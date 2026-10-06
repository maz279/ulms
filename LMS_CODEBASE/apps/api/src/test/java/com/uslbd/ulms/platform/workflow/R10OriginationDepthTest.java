package com.uslbd.ulms.platform.workflow;

import com.uslbd.ulms.customer.Customer;
import com.uslbd.ulms.customer.CustomerCreateRequest;
import com.uslbd.ulms.customer.CustomerCreateRequest;
import com.uslbd.ulms.customer.CustomerService;
import com.uslbd.ulms.origination.Application;
import com.uslbd.ulms.origination.OriginationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * R10 P-B integration: SLA engine lifecycle (arm → warn at 80% → breach →
 * auto-escalate) and the STP fast-track + risk-based pricing snapshot.
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class R10OriginationDepthTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractPort clientPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 8100 + seq.incrementAndGet();
        }
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractLoanPort loanPort() {
            return spec -> 999L;
        }
        @Bean @Primary com.uslbd.ulms.integration.docs.DocumentStorePort docPort() {
            return new com.uslbd.ulms.integration.docs.DocumentStorePort() {
                @Override public com.uslbd.ulms.integration.docs.DocumentStorePort.StoredObject put(
                        String key, java.io.InputStream bytes, long size, String contentType) {
                    return new com.uslbd.ulms.integration.docs.DocumentStorePort.StoredObject(
                            key, "b".repeat(64), size);
                }
                @Override public String presignedGetUrl(String key,
                        com.uslbd.ulms.integration.docs.DocumentStorePort.DurationTtl ttl) {
                    return "http://minio.local/" + key;
                }
            };
        }
    }

    @Autowired SlaService sla;
    @Autowired WorkflowService workflow;
    @Autowired WorkflowTaskSlaRepository tasks;
    @Autowired OriginationService origination;
    @Autowired CustomerService customers;
    @Autowired com.uslbd.ulms.assessment.AssessmentService assessment;
    @Autowired org.springframework.jdbc.core.JdbcTemplate jdbc;

    @Test
    void slaLifecycleArmsWarnsBreachesAndEscalates() {
        var aggId = UUID.randomUUID();
        var started = workflow.start(WorkflowService.LADDER, "sla-it", aggId, "L1");
        WorkflowTask task = started.task();
        assertThat(task.getSlaDeadline()).isNotNull();   // engine arms a flat 48 h at creation

        // 1) first scan re-arms onto the per-level policy (L1 = 240 min)
        var r0 = sla.runOnce(java.time.Instant.now());
        assertThat(r0.armed()).isGreaterThanOrEqualTo(1);
        task = tasks.findById(task.getId()).orElseThrow();
        assertThat(task.getSlaDeadline())
                .isEqualTo(task.getOpenedAt().plus(java.time.Duration.ofMinutes(240)));
        assertThat(task.getSlaState()).isEqualTo("OK");

        java.time.Instant opened = task.getOpenedAt();
        // L1 standard = 240 min → warn at 192
        var rWarn = sla.runOnce(opened.plus(200, ChronoUnit.MINUTES));
        task = tasks.findById(task.getId()).orElseThrow();
        assertThat(task.getSlaState()).isEqualTo("WARNED");
        assertThat(rWarn.warned()).isGreaterThanOrEqualTo(1);

        // breach at 240+
        sla.runOnce(opened.plus(250, ChronoUnit.MINUTES));
        task = tasks.findById(task.getId()).orElseThrow();
        assertThat(task.getSlaState()).isEqualTo("BREACHED");

        // auto-escalate at SLA+50% (360+)
        sla.runOnce(opened.plus(370, ChronoUnit.MINUTES));
        assertThat(tasks.findById(task.getId()).orElseThrow().getStatus())
                .isEqualTo("ESCALATED");
        // the engine opened ladder-2 for the same aggregate
        var current = workflow.currentTask("sla-it", aggId).orElseThrow();
        assertThat(current.getNode()).isEqualTo("L2");
    }

    @Test
    void stpPathRoutesStraightToSanctionWithPricing() {
        // relationship ≥ 24 months + grade-B factors (low DBR + full collateral
        // coverage) → STP under the grade-tier policy
        var customer = customers.create(new CustomerCreateRequest(
                "Stp Person " + System.nanoTime() % 100_000, null,
                Customer.Segment.RETAIL, "+8801712345678", null, "BR-001"),
                UUID.randomUUID(), "test", UUID.randomUUID());
        // age the RELATIONSHIP on the row (reflection would hit a detached copy)
        jdbc.update("update ulms.customer set created_at = ? where id = ?",
                java.sql.Timestamp.from(Instant.now().minus(800, ChronoUnit.DAYS)),
                customer.getId());

        var a = origination.createDraft("APP-STP" + System.nanoTime() % 100_000,
                customer.getId(), "retail-personal", 200_000_00L, 24,
                Application.RateType.FIXED, "BR-001",
                9_000_000_000_00L, 0L, "test");   // ৳90 M/mo — DBR stays green under the mock bureau's obligation stock
        // full collateral coverage feeds the scorecard's coverage factor (+60)
        assessment.addCollateral(a.getId(), "FDR", "sterling collateral",
                250_000_00L, java.time.LocalDate.now(), null, "test");
        origination.submit(a.getId(), "test");

        var after = origination.get(a.getId());
        assertThat(after.isStp()).isTrue();
        assertThat(after.getStage()).isEqualTo(Application.Stage.SANCTION);   // no CPV, no manual ladder
        assertThat(after.getGrade()).isIn("A", "B");
        assertThat(after.getAppliedRateBp()).isNotNull().isGreaterThan(0);    // grade premium applied

        // the STP lane completed the workflow (L7 auto-approved, instance done)
        assertThat(workflow.instance("application", a.getId()).orElseThrow().getStatus())
                .isEqualTo("COMPLETED");
    }


}

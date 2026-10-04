package com.uslbd.ulms.collections;

import com.uslbd.ulms.platform.outbox.OutboxService;
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
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Mobile field gateway (PLANNING/08 §A5) gates:
 *  - delta pull returns the officer's tasks + a bundle version
 *  - visit intake is IDEMPOTENT by client uuid (offline replay safe) and the
 *    task transition is server-wins with append-only evidence
 *  - PTP capture rides the mod-collections rules unchanged
 *  - one-tap SOS creates a durable alert + outbox event; ack is single-shot
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class FieldGatewayTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractPort clientPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 8900 + seq.incrementAndGet();
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

    @Autowired FieldGatewayService gateway;
    @Autowired CollectionsService collections;
    @Autowired com.uslbd.ulms.servicing.LoanRepository loans;
    @Autowired com.uslbd.ulms.customer.CustomerService customers;
    @Autowired FieldTaskRepository fieldTasks;
    @Autowired com.uslbd.ulms.platform.outbox.OutboxEventRepository outboxEvents;

    /** Migrated-loan fixture: real customer row (customer FK) + Loan.demo
     *  (application_id NULL — no application FK row). */
    private com.uslbd.ulms.servicing.Loan loan() {
        var mobile = String.format("+88017%08d", System.nanoTime() % 100_000_000L);
        var req = new com.uslbd.ulms.customer.CustomerCreateRequest(
                "FG Person " + System.nanoTime() % 1000, null,
                com.uslbd.ulms.customer.Customer.Segment.SME, mobile, null, "BR-001");
        var customer = customers.create(req, UUID.randomUUID(), "user:test", UUID.randomUUID());
        var id = UUID.randomUUID();
        var l = com.uslbd.ulms.servicing.Loan.demo(id, customer.getId(),
                "LN-FG-" + System.nanoTime() % 1_000_000, 8_000_000_00L, 45);
        loans.save(l);
        return loans.findById(id).orElseThrow();
    }

    @Test
    void deltaPullReturnsOfficerTasksAndBundleVersion() {
        var loan = loan();
        collections.assignFieldTask(loan.getId(), "user:field-officer",
                LocalDate.now().plusDays(2), "user:manager");

        var bundle = gateway.tasksFor("user:field-officer", null);
        assertThat((java.util.List<?>) bundle.get("data")).isNotEmpty();
        assertThat((String) bundle.get("bundleVersion")).isNotEqualTo("empty");

        // delta with a future `since` yields nothing new
        var none = gateway.tasksFor("user:field-officer", Instant.now().plusSeconds(60));
        assertThat((java.util.List<?>) none.get("data")).isEmpty();
    }

    @Test
    void visitIntakeIsIdempotentAndServerWins() {
        var loan = loan();
        var task = collections.assignFieldTask(loan.getId(), "user:field-officer",
                LocalDate.now().plusDays(1), "user:manager");
        String clientUuid = "mob-" + System.nanoTime();

        var first = gateway.visit(clientUuid, task.getId(), loan.getId(), "VERIFIED",
                json("{\"gps\":\"23.79,90.40\",\"photos\":2}"), "user:field-officer");
        assertThat(first.replayed()).isFalse();
        assertThat(first.visit().isApplied()).isTrue();
        assertThat(fieldTasks.findById(task.getId()).orElseThrow().getStatus())
                .isEqualTo("DONE");

        // offline replay: same client uuid → recorded, applied=false, task
        // NOT double-transitioned, evidence still appended
        var replay = gateway.visit(clientUuid, task.getId(), loan.getId(), "VERIFIED",
                json("{\"gps\":\"23.79,90.40\",\"photos\":2}"), "user:field-officer");
        assertThat(replay.replayed()).isTrue();
        assertThat(replay.visit().getId()).isEqualTo(first.visit().getId());
        var after = fieldTasks.findById(task.getId()).orElseThrow();
        assertThat(after.getStatus()).isEqualTo("DONE");
        // idempotent: the same-uuid replay must NOT append the evidence twice
        assertThat(after.getNotes().split("gps", -1).length - 1).isEqualTo(1);

        // a DIFFERENT client uuid completing the already-DONE task is the
        // server-wins conflict: suppressed transition, evidence still appended
        var conflict = gateway.visit("mob-" + System.nanoTime(), task.getId(), loan.getId(),
                "VERIFIED", json("{\"gps\":\"23.79,90.40\"}"), "user:field-officer");
        assertThat(conflict.replayed()).isFalse();
        assertThat(conflict.visit().isApplied()).isFalse();   // suppressed
        assertThat(fieldTasks.findById(task.getId()).orElseThrow().getNotes())
                .contains("duplicate complete suppressed");
    }

    @Test
    void fieldPtpRidesTheCollectionsRules() {
        var loan = loan();
        var ptp = gateway.ptp(loan.getId(), 500_000_00L, LocalDate.now().plusDays(7),
                "HIGH", "Borrower", "Self", "+8801711122334",
                "captured during CPV visit", "user:field-officer");
        assertThat(ptp.getPromisedOn()).isEqualTo(LocalDate.now().plusDays(7));
        assertThat(collections.ptpsOf(loan.getId()))
                .extracting(Ptp::getId).contains(ptp.getId());
    }

    @Test
    void oneTapSosCreatesDurableAlertOutboxEventAndSingleShotAck() {
        var loan = loan();
        var alert = gateway.sos(loan.getId(), 23.7936, 90.4043,
                "aggressive borrower", "user:field-officer");

        assertThat(alert.getStatus()).isEqualTo("OPEN");
        var event = outboxEvents.findTop50ByDispatchedAtIsNullOrderByCreatedAtAsc().stream()
                .filter(e -> "SOS_RAISED".equals(e.getType())
                        && alert.getId().equals(e.getAggregateId()))
                .findFirst().orElseThrow();
        assertThat(event.getPayload()).contains("23.7936");

        var acked = gateway.acknowledgeSos(alert.getId(), "user:security");
        assertThat(acked.getStatus()).isEqualTo("ACKNOWLEDGED");
        org.assertj.core.api.Assertions.assertThatThrownBy(
                        () -> gateway.acknowledgeSos(alert.getId(), "user:security"))
                .hasMessageContaining("already ACKNOWLEDGED");
    }

    private static com.fasterxml.jackson.databind.JsonNode json(String raw) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().readTree(raw);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}

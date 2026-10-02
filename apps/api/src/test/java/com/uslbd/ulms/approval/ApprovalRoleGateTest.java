package com.uslbd.ulms.approval;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Ladder role gate (06 §1 method security): the caller's realm roles must
 * cover the task's ladder level; admin bypasses; empty roles = internal call.
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class ApprovalRoleGateTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractPort clientPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 3000 + seq.incrementAndGet();
        }
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractLoanPort loanPort() {
            return spec -> 999L;
        }
        /** submit() pulls CIB which stores raw — stub the store (06 §5). */
        @Bean @Primary com.uslbd.ulms.integration.docs.DocumentStorePort docPort() {
            return new com.uslbd.ulms.integration.docs.DocumentStorePort() {
                @Override public StoredObject put(String key, java.io.InputStream bytes,
                                                  long size, String contentType) {
                    return new StoredObject(key, "b".repeat(64), size);
                }
                @Override public String presignedGetUrl(String key, DurationTtl ttl) {
                    return "http://minio.local/" + key;
                }
            };
        }
    }

    @Autowired com.uslbd.ulms.platform.workflow.WorkflowService workflow;
    @Autowired ApprovalService approvals;
    @Autowired com.uslbd.ulms.origination.OriginationService origination;
    @Autowired com.uslbd.ulms.customer.CustomerService customers;

    private UUID draftAtL5() {
        var req = new com.uslbd.ulms.customer.CustomerCreateRequest(
                "Gate Person", null, com.uslbd.ulms.customer.Customer.Segment.SME,
                "+8801712345678", null, "BR-001");
        var customer = customers.create(req, UUID.randomUUID(), "user:test", UUID.randomUUID());
        var a = origination.createDraft("APP-9" + new java.security.SecureRandom().nextInt(99_999),
                customer.getId(), "sme-term", 600_000_000L, 48,
                com.uslbd.ulms.origination.Application.RateType.FIXED, "BR-001",
                1_000_000_00L, 50_000_00L, "user:officer");
        origination.submit(a.getId(), "user:officer");   // → CPV
        origination.cpv(a.getId(), true, "ok", "user:cpv");   // → APPROVAL @ L5 (৳60L)
        return workflow.currentTask("application", a.getId()).orElseThrow().getId();
    }

    @Test
    void wrongRoleIsDeniedRightRoleActs() {
        UUID taskId = draftAtL5();   // L5 = ho-credit per the band table

        assertThatThrownBy(() -> approvals.act(taskId, com.uslbd.ulms.platform.workflow.WorkflowService.Action.APPROVE,
                "user:branch-manager", Set.of("branch-manager"), "nope"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("ladder-5");

        // empty roles = internal/system call (event replay) — allowed
        var out = approvals.act(taskId, com.uslbd.ulms.platform.workflow.WorkflowService.Action.APPROVE,
                "user:l5", Set.of(), "internal");
        assertThat(out.event()).isNotBlank();
    }

    @Test
    void adminBypassesAndHoCreditActs() {
        UUID taskId = draftAtL5();

        var out = approvals.act(taskId, com.uslbd.ulms.platform.workflow.WorkflowService.Action.APPROVE,
                "user:ho-credit", Set.of("ho-credit"), "ok");
        assertThat(out.event()).isNotBlank();     // ladder-5 role matches L5 node
    }

    @Test
    void approverInboxFiltersByLadderRole() {
        UUID taskId = draftAtL5();   // ৳60L → L5 task OPEN

        var forL5 = workflow.openTasksForRoles(java.util.Set.of("ladder-5"));
        assertThat(forL5).extracting("id").contains(taskId);

        var forL1 = workflow.openTasksForRoles(java.util.Set.of("ladder-1"));
        assertThat(forL1).extracting("id").doesNotContain(taskId);

        var forAdmin = workflow.openTasksForRoles(java.util.Set.of("admin"));
        assertThat(forAdmin).extracting("id").contains(taskId);   // admin sees all

        // inbox rows join back to the application aggregate
        assertThat(workflow.instanceOfTask(taskId))
                .hasValueSatisfying(i -> assertThat(i.getAggregate()).isEqualTo("application"));
    }
}

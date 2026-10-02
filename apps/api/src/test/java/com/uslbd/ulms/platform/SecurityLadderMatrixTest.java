package com.uslbd.ulms.platform;

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

import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * R2 security activation (audit/plan/phases/R2) — the exhaustive ladder
 * role matrix. For every band L1..L7 and every realm role: a caller may
 * act only when ROLE_TO_LADDER maps them onto the task's rung; admin
 * bypasses everything; no cross-rung elevation (L2 may NOT act on L3,
 * MD is not a global approver). Mirrors the web mirror-test
 * (apps/web tests/unit/auth.test.ts) so drift fails one of the two.
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class SecurityLadderMatrixTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractPort clientPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 4000 + seq.incrementAndGet();
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

    @Autowired com.uslbd.ulms.platform.workflow.WorkflowService workflow;
    @Autowired com.uslbd.ulms.approval.ApprovalService approvals;
    @Autowired com.uslbd.ulms.origination.OriginationService origination;
    @Autowired com.uslbd.ulms.customer.CustomerService customers;

    /** role → rung — mirror of ApprovalService.ROLE_TO_LADDER (drift = defect). */
    private static final Set<String[]> MATRIX = Set.of(
            new String[]{"branch-officer", "ladder-1"},
            new String[]{"branch-manager", "ladder-2"},
            new String[]{"regional-manager", "ladder-3"},
            new String[]{"divisional-head", "ladder-4"},
            new String[]{"ho-credit", "ladder-5"},
            new String[]{"credit-committee", "ladder-6"},
            new String[]{"md", "ladder-7"});

    /** Band tops (inclusive) — mirror of the V2 approval_band seed, which
     *  LadderBoundaryTest pins: L1≤5L, L2≤10L, L3≤25L, L4≤50L, L5≤2.5Cr,
     *  L6≤10Cr taka (minor units). */
    private static final long[] BAND_AMOUNTS_MINOR = {
            50_000_000L,        // L1  ≤ ৳5L
            100_000_000L,       // L2  ≤ ৳10L
            250_000_000L,       // L3  ≤ ৳25L
            500_000_000L,       // L4  ≤ ৳50L
            2_500_000_000L,     // L5  ≤ ৳2.5Cr
            10_000_000_000L,    // L6  ≤ ৳10Cr
            11_000_000_000L     // L7  > ৳10Cr
    };

    private UUID draftAt(int band) {   // band 1..7 → ladder-{band} task
        var req = new com.uslbd.ulms.customer.CustomerCreateRequest(
                "Matrix Person", null, com.uslbd.ulms.customer.Customer.Segment.SME,
                "+8801712345678", null, "BR-001");
        var customer = customers.create(req, UUID.randomUUID(), "user:test", UUID.randomUUID());
        var a = origination.createDraft("APP-M" + new java.security.SecureRandom().nextInt(99_999),
                customer.getId(), "sme-term", BAND_AMOUNTS_MINOR[band - 1], 48,
                com.uslbd.ulms.origination.Application.RateType.FIXED, "BR-001",
                2_000_000_000L, 0L, "user:officer");   // ample income → DBR clears
        origination.submit(a.getId(), "user:officer");
        origination.cpv(a.getId(), true, "ok", "user:cpv");
        var task = workflow.currentTask("application", a.getId()).orElseThrow();
        assertThat(task.getAssigneeRole()).isEqualTo("ladder-" + band);   // fixture sanity
        return task.getId();
    }

    @Test
    void exactRungMatchForEveryRoleAndBand() {
        for (String[] mapping : MATRIX) {
            String role = mapping[0];
            String rung = mapping[1];
            int band = Integer.parseInt(rung.substring("ladder-".length()));

            // own rung acts
            assertThatCode(() -> approvals.act(draftAt(band),
                    com.uslbd.ulms.platform.workflow.WorkflowService.Action.APPROVE,
                    "user:" + role, Set.of(role), "matrix"))
                    .doesNotThrowAnyException();

            // every OTHER rung denies (no elevation, no demotion-acting)
            for (int other = 1; other <= 7; other++) {
                if (other == band) continue;
                final int targetBand = other;
                assertThatThrownBy(() -> approvals.act(draftAt(targetBand),
                        com.uslbd.ulms.platform.workflow.WorkflowService.Action.APPROVE,
                        "user:" + role, Set.of(role), "matrix"))
                        .isInstanceOf(AccessDeniedException.class)
                        .hasMessageContaining("ladder-" + targetBand);
            }
        }
    }

    @Test
    void adminBypassesEveryBand_andNonLadderStaffNeverAct() {
        for (int band = 1; band <= 7; band++) {
            final int rung = band;
            assertThatCode(() -> approvals.act(draftAt(rung),
                    com.uslbd.ulms.platform.workflow.WorkflowService.Action.APPROVE,
                    "user:admin", Set.of("admin"), "matrix"))
                    .doesNotThrowAnyException();

            // staff roles outside the ladder (06 §1 URL-gate members) hold no
            // approval authority at any rung
            for (String staffRole : new String[]{"collections", "compliance", "credit-analyst"}) {
                assertThatThrownBy(() -> approvals.act(draftAt(rung),
                        com.uslbd.ulms.platform.workflow.WorkflowService.Action.APPROVE,
                        "user:" + staffRole, Set.of(staffRole), "matrix"))
                        .isInstanceOf(AccessDeniedException.class)
                        .hasMessageContaining("ladder-" + rung);
            }
        }
    }

    @Test
    void multiRoleSessionsActOnAnyOwnedRung() {
        // a delegate carrying L2+L4 acts on both, still not on L5
        assertThatCode(() -> {
            approvals.act(draftAt(2), com.uslbd.ulms.platform.workflow.WorkflowService.Action.APPROVE,
                    "user:delegate", Set.of("branch-manager", "divisional-head"), "matrix");
        }).doesNotThrowAnyException();
        assertThatCode(() -> {
            approvals.act(draftAt(4), com.uslbd.ulms.platform.workflow.WorkflowService.Action.APPROVE,
                    "user:delegate", Set.of("branch-manager", "divisional-head"), "matrix");
        }).doesNotThrowAnyException();
        assertThatThrownBy(() -> approvals.act(draftAt(5),
                com.uslbd.ulms.platform.workflow.WorkflowService.Action.APPROVE,
                "user:delegate", Set.of("branch-manager", "divisional-head"), "matrix"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("ladder-5");
    }
}

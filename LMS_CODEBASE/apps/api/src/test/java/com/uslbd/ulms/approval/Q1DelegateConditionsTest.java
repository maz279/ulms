package com.uslbd.ulms.approval;

import com.uslbd.ulms.integration.docs.DocumentStorePort;
import com.uslbd.ulms.integration.fineract.FineractLoanPort;
import com.uslbd.ulms.integration.fineract.FineractPort;
import com.uslbd.ulms.origination.Application;
import com.uslbd.ulms.origination.OriginationService;
import com.uslbd.ulms.platform.workflow.WorkflowService;
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

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Q1.3 semantics locked end-to-end (PLANNING/03 mod-approval depth):
 *  - DELEGATE reassigns the OPEN task in place — same id, same node, SLA
 *    clock keeps running — and from then on only the delegate (or admin)
 *    can act; the delegation is audited as a transition
 *  - APPROVE_WITH_CONDITIONS advances like APPROVE while recording one
 *    condition-precedent row per remark line; the rows gate disbursement
 *    until every one is SATISFIED or WAIVED
 *  - resolution is single-shot and evidence-bearing
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class Q1DelegateConditionsTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary FineractPort clientPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 5000 + seq.incrementAndGet();
        }
        @Bean @Primary FineractLoanPort loanPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return new FineractLoanPort() {
                @Override public long createLoan(LoanSpec spec) { return 5500 + seq.incrementAndGet(); }
                @Override public long disburseLoan(long loanId, long amountMinor) {
                    assertThat(amountMinor).isPositive();
                    return 99000 + seq.incrementAndGet();
                }
            };
        }
        @Bean @Primary DocumentStorePort docPort() {
            return new DocumentStorePort() {
                @Override public StoredObject put(String key, java.io.InputStream bytes,
                                                  long size, String contentType) {
                    return new StoredObject(key, "0".repeat(64), size);
                }
                @Override public String presignedGetUrl(String key, DurationTtl ttl) {
                    return "http://minio.local/" + key;
                }
            };
        }
    }

    @Autowired WorkflowService workflow;
    @Autowired ApprovalService approvals;
    @Autowired DisbursementService disbursements;
    @Autowired OriginationService origination;
    @Autowired com.uslbd.ulms.customer.CustomerService customers;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Set<String> L3_ROLE = Set.of("regional-manager");

    // ── DELEGATE ──────────────────────────────────────────────────────────

    @Test
    void delegateReassignsInPlaceKeepingTheSlaClock() {
        UUID agg = UUID.randomUUID();
        var started = workflow.start(WorkflowService.LADDER, "application", agg, "L3");
        UUID taskId = started.task().getId();
        // Postgres timestamptz keeps micros and ROUNDS nanos — compare at millis
        Instant deadline = started.task().getSlaDeadline()
                .truncatedTo(java.time.temporal.ChronoUnit.MILLIS);

        var out = workflow.act(taskId, WorkflowService.Action.DELEGATE,
                "user:l3", "out of office", "user:l3-peer");
        assertThat(out.event()).isEqualTo(WorkflowService.Event.DELEGATED);
        assertThat(out.nextTask().getId()).isEqualTo(taskId);   // SAME task, moved
        assertThat(out.nextTask().getAssigneeUser()).isEqualTo("user:l3-peer");
        assertThat(out.nextTask().getStatus()).isEqualTo("OPEN");
        assertThat(out.nextTask().getSlaDeadline()
                .truncatedTo(java.time.temporal.ChronoUnit.MILLIS)).isEqualTo(deadline);   // never reset
        assertThat(out.instance().getCurrentNode()).isEqualTo("L3");
    }

    @Test
    void delegatedTaskAnswersOnlyToItsAssignee() {
        UUID agg = UUID.randomUUID();
        var started = workflow.start(WorkflowService.LADDER, "application", agg, "L3");
        UUID taskId = started.task().getId();

        approvals.act(taskId, WorkflowService.Action.DELEGATE, "user:l3",
                L3_ROLE, "holiday cover", "user:l3-peer");

        // same ladder role but NOT the assignee → denied
        assertThatThrownBy(() -> approvals.act(taskId, WorkflowService.Action.APPROVE,
                "user:l3-other", L3_ROLE, "trying anyway"))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class)
                .hasMessageContaining("assigned to user:l3-peer");

        // the delegate approves cleanly and the file advances
        var out = approvals.act(taskId, WorkflowService.Action.APPROVE,
                "user:l3-peer", L3_ROLE, "approve on behalf");
        assertThat(out.event()).isEqualTo("NODE_ADVANCED");   // ActResult.event is a String
    }

    @Test
    void delegateValidatesTarget() {
        var started = workflow.start(WorkflowService.LADDER, "application",
                UUID.randomUUID(), "L1");
        UUID taskId = started.task().getId();

        assertThatThrownBy(() -> workflow.act(taskId, WorkflowService.Action.DELEGATE,
                "user:a", null, (String) null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("requires a delegate user");
        assertThatThrownBy(() -> workflow.act(taskId, WorkflowService.Action.DELEGATE,
                "user:a", null, "user:a"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("yourself");
    }

    // ── APPROVE_WITH_CONDITIONS ───────────────────────────────────────────

    @Test
    void conditionalApprovalRecordsOneRowPerLineAndAdvances() {
        UUID agg = UUID.randomUUID();
        var started = workflow.start(WorkflowService.LADDER, "application", agg, "L7");

        var out = workflow.act(started.task().getId(),
                WorkflowService.Action.APPROVE_WITH_CONDITIONS, "user:md",
                "Insurance policy assigned to bank\nPost-dated cheques secured");
        assertThat(out.event()).isEqualTo(WorkflowService.Event.COMPLETED);

        var rows = workflow.conditions("application", agg);
        assertThat(rows).hasSize(2);
        assertThat(rows).allMatch(c -> c.getStatus().equals("PENDING"));
        assertThat(rows).allMatch(c -> c.getNode().equals("L7"));
        assertThat(rows).extracting(c -> c.getConditionText())
                .containsExactly("Insurance policy assigned to bank",
                        "Post-dated cheques secured");
        assertThat(workflow.outstandingConditions("application", agg)).isEqualTo(2);
    }

    @Test
    void conditionalApprovalWithoutTextIsRejected() {
        var started = workflow.start(WorkflowService.LADDER, "application",
                UUID.randomUUID(), "L7");
        assertThatThrownBy(() -> workflow.act(started.task().getId(),
                WorkflowService.Action.APPROVE_WITH_CONDITIONS, "user:md", null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("at least one condition");
    }

    @Test
    void resolutionIsSingleShotAndEvidenceBearing() {
        UUID agg = UUID.randomUUID();
        var started = workflow.start(WorkflowService.LADDER, "application", agg, "L7");
        workflow.act(started.task().getId(), WorkflowService.Action.APPROVE_WITH_CONDITIONS,
                "user:md", "Land mutation certificate");

        var row = workflow.conditions("application", agg).get(0);
        var resolved = approvals.resolveCondition(row.getId(), "SATISFIED",
                "user:officer", "cert #4471 on file");
        assertThat(resolved.getStatus()).isEqualTo("SATISFIED");
        assertThat(resolved.getResolvedBy()).isEqualTo("user:officer");
        assertThat(resolved.getResolvedAt()).isNotNull();
        assertThat(workflow.outstandingConditions("application", agg)).isZero();

        assertThatThrownBy(() -> approvals.resolveCondition(row.getId(), "WAIVED",
                "user:officer", null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already SATISFIED");
        // entity checks the already-resolved state before the status value —
        // a nonsense status on a resolved row still answers "already SATISFIED"
        assertThatThrownBy(() -> approvals.resolveCondition(row.getId(), "MAYBE",
                "user:officer", null))
                .isInstanceOf(IllegalStateException.class);
    }

    // ── the money gate: conditions block disbursement ────────────────────

    @Test
    void outstandingConditionsBlockDisbursementUntilResolved() {
        var a = toSanction(WorkflowService.Action.APPROVE_WITH_CONDITIONS,
                "Insurance endorsement to bank\nTri-party agreement executed");
        assertThat(a.getStage()).isEqualTo(Application.Stage.SANCTION);

        // PENDING rows → prepare is refused
        assertThatThrownBy(() -> disbursements.prepare(a.getId(), "user:maker"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Conditions precedent outstanding (2)");

        // evidence + documented override → the gate opens
        var rows = approvals.conditions(a.getId());
        approvals.resolveCondition(rows.get(0).getId(), "SATISFIED", "user:officer",
                "endorsement scanned to DMS");
        approvals.resolveCondition(rows.get(1).getId(), "WAIVED", "user:manager",
                "legal advises tri-party not required for this collateral");

        var prepared = disbursements.prepare(a.getId(), "user:maker");
        assertThat(prepared.getState()).isEqualTo("PREPARED");
    }

    // ── helpers ───────────────────────────────────────────────────────────

    /** G2-style credit→cash setup, parameterized on the FINAL (L7) action. */
    private Application toSanction(WorkflowService.Action finalAction, String finalRemark) {
        var req = new com.uslbd.ulms.customer.CustomerCreateRequest(
                "Q1 Person", null, com.uslbd.ulms.customer.Customer.Segment.SME,
                "+8801712345678", null, "BR-001");
        var customer = customers.create(req, UUID.randomUUID(), "user:test", UUID.randomUUID());
        var a = origination.createDraft("APP-Q1" + RANDOM.nextInt(99_999),
                customer.getId(), "sme-term", 150_000_000L, 24,
                Application.RateType.FIXED, "BR-001", 1_000_000_00L, 0L, "user:officer");
        origination.submit(a.getId(), "user:officer");
        origination.cpv(a.getId(), true, "verified", "user:cpv");
        var task = workflow.currentTask("application", a.getId()).orElseThrow();
        UUID current = task.getId();
        int level = 3;
        while (current != null) {
            WorkflowService.Action action = level == 7 ? finalAction
                    : WorkflowService.Action.APPROVE;
            String remark = level == 7 ? finalRemark : "ok";
            var out = approvals.act(current, action, "user:l" + level, remark);
            current = out.nextTaskId();
            level++;
        }
        assertThat(origination.get(a.getId()).getStage()).isEqualTo(Application.Stage.SANCTION);
        return origination.get(a.getId());
    }
}

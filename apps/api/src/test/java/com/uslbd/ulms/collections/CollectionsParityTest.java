package com.uslbd.ulms.collections;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Audit-E parity oracles (03 mod-collections/mod-approval): dunning ladder
 * policy + queue + PTP suspension, ESCALATE workflow transition, legal-case
 * CRUD, Fineract waiver on resolution.
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class CollectionsParityTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractPort clientPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 9900 + seq.incrementAndGet();
        }
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractLoanPort loanPort() {
            return new com.uslbd.ulms.integration.fineract.FineractLoanPort() {
                @Override public long createLoan(LoanSpec spec) { return 9950L; }
                @Override public long waiveInterest(long loanId, long amountMinor) {
                    assertThat(amountMinor).isPositive();
                    return 99600L;
                }
            };
        }
        @Bean @Primary com.uslbd.ulms.integration.docs.DocumentStorePort docPort() {
            return new com.uslbd.ulms.integration.docs.DocumentStorePort() {
                @Override public StoredObject put(String key, java.io.InputStream bytes,
                                                  long size, String contentType) {
                    return new StoredObject(key, "f".repeat(64), size);
                }
                @Override public String presignedGetUrl(String key, DurationTtl ttl) {
                    return "http://minio.local/" + key;
                }
            };
        }
    }

    @Autowired CollectionsService collections;
    @Autowired DunningLadderService ladder;   // config-driven (R10 P-A)
    @Autowired com.uslbd.ulms.collections.DunningLadderService dunning;
    @Autowired com.uslbd.ulms.platform.workflow.WorkflowService workflow;
    @Autowired com.uslbd.ulms.servicing.LoanRepository loans;
    @Autowired JdbcTemplate jdbc;

    private static final SecureRandom RANDOM = new SecureRandom();

    private UUID seedLoan(int dpd, Long fineractLoanId) {
        UUID customerId = UUID.randomUUID();
        jdbc.update("""
            insert into ulms.customer (id, cif_no, name_en, segment, mobile, branch_code, kyc_status)
            values (?, ?, 'Parity Person', 'SME', '+880171234567', 'BR-001', 'VERIFIED')
            """, customerId, "CIF-P" + RANDOM.nextInt(999_999));
        var loan = com.uslbd.ulms.servicing.Loan.demo(UUID.randomUUID(), customerId,
                "LN-P" + RANDOM.nextInt(99_999), 60_000_000L, dpd);
        var saved = loans.save(loan);
        if (fineractLoanId != null) {
            jdbc.update("update ulms.loan set fineract_loan_id = ? where id = ?",
                    fineractLoanId, saved.getId());
        }
        return saved.getId();
    }

    @Test
    void dunningLadderPolicyMapsBucketsAndCadence() {
        // R10 P-A: the ladder is CONFIG (ulms.dunning_step, 6 rungs) — the old
        // 3-rung static mapping moved to the seed; the service resolves the
        // same bucket semantics through the table
        assertThat(ladder.stepFor(0)).isNull();
        assertThat(ladder.stepFor(15).getActionType()).isEqualTo("VISIT");
        assertThat(ladder.stepFor(45).getActionType()).isEqualTo("NOTICE");
        assertThat(ladder.stepFor(120).getActionType()).isEqualTo("NPA_RECOVERY");
        assertThat(ladder.stepFor(15).getCadenceDays()).isEqualTo(14);
        assertThat(DunningLadderService.fallbackCadence("SMS")).isEqualTo(7);
    }

    @Test
    void ladderQueuesRightStepAndPtpSuspendsIt() {
        // R10 P-A: six-rung config ladder — DPD 25 is the VISIT rung (15-29),
        // DPD 120 the NPA_RECOVERY rung (90+)
        UUID dpd25 = seedLoan(25, null);    // VISIT bucket
        UUID dpd120 = seedLoan(120, null);  // NPA_RECOVERY bucket

        int queued = ladder.runOnce(LocalDate.now());
        assertThat(queued).isGreaterThanOrEqualTo(2);
        var queue = ladder.dueQueue();
        assertThat(queue).anySatisfy(a -> {
            if (a.getLoanId().equals(dpd25)) assertThat(a.getActionType()).isEqualTo("VISIT");
        });
        assertThat(queue).anySatisfy(a -> {
            if (a.getLoanId().equals(dpd120)) assertThat(a.getActionType()).isEqualTo("NPA_RECOVERY");
        });

        // second pass the same day: no duplicates while a step is unacted
        assertThat(ladder.runOnce(LocalDate.now())).isZero();

        // PENDING promise suspends the ladder for its loan
        UUID promised = seedLoan(40, null);
        collections.promise(promised, 1_000_000L, LocalDate.now().plusDays(5), "HIGH",
                null, null, null, null, "user:c");
        assertThat(ladder.dueQueue()).noneMatch(a -> a.getLoanId().equals(promised));

        // officer resolves a queued step → outcome recorded, timer cleared
        var step = ladder.dueQueue().stream()
                .filter(a -> a.getLoanId().equals(dpd25)).findFirst().orElseThrow();
        var resolved = ladder.resolveQueued(step.getId(), "CONTACTED", "sms delivered",
                "user:collector");
        assertThat(resolved.getOutcome()).isEqualTo("CONTACTED");
        assertThat(resolved.getDueOn()).isNull();               // timer cleared
        assertThat(ladder.dueQueue()).noneMatch(a -> a.getId().equals(step.getId()));
    }

    @Test
    void escalateMovesUpWithoutCompleting() {
        // L3 task (10L..25L band): escalate → L4 task OPEN, instance RUNNING
        UUID loanId = seedLoan(50, null);
        var instance = workflow.start(com.uslbd.ulms.platform.workflow.WorkflowService.LADDER,
                "loan", loanId, "L3");
        var out = workflow.act(instance.task().getId(),
                com.uslbd.ulms.platform.workflow.WorkflowService.Action.ESCALATE,
                "user:l3", "policy override");
        assertThat(out.event().name()).isEqualTo("ESCALATED");
        assertThat(out.instance().getStatus()).isEqualTo("RUNNING");   // not completed
        var next = workflow.task(out.nextTask().getId()).orElseThrow();
        assertThat(next.getNode()).isEqualTo("L4");                   // pushed up
    }

    @Test
    void legalCaseCrudAndWaiver() {
        UUID loanId = seedLoan(200, 770001L);

        var filed = collections.fileCase(loanId, "Dhaka Money Loan Court",
                LocalDate.now().minusDays(10), 40_000_000L, "Adv. Karim",
                "claim after B/L classification", "user:collections");
        assertThat(filed.getCaseNo()).startsWith("LC-");
        assertThat(filed.getStatus()).isEqualTo("FILED");

        var updated = collections.updateCaseStatus(filed.getId(), "ONGOING", "user:collections");
        assertThat(updated.getStatus()).isEqualTo("ONGOING");
        assertThat(collections.casesOf(loanId)).hasSize(1);

        // waiver hits the stubbed Fineract port and audits
        long txn = collections.waiveInterest(loanId, 500_000L, "user:bm");
        assertThat(txn).isEqualTo(99600L);

        // mirror-only loans reject the waiver honestly
        UUID migrated = seedLoan(220, null);
        assertThatThrownBy(() -> collections.waiveInterest(migrated, 1L, "user:bm"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("mirror-only");
    }
}

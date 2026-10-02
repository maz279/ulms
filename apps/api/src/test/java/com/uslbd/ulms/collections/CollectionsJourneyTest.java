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
 * Collections oracles (03 mod-collections tests): worklist priority with
 * broken-PTP propensity, PTP state machine (terminal states fixed), kept
 * evidence via the payment read model, field-task server-wins sync with
 * append-only evidence.
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class CollectionsJourneyTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractPort clientPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 9800 + seq.incrementAndGet();
        }
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractLoanPort loanPort() {
            return spec -> 9900L;
        }
        @Bean @Primary com.uslbd.ulms.integration.docs.DocumentStorePort docPort() {
            return new com.uslbd.ulms.integration.docs.DocumentStorePort() {
                @Override public StoredObject put(String key, java.io.InputStream bytes,
                                                  long size, String contentType) {
                    return new StoredObject(key, "e".repeat(64), size);
                }
                @Override public String presignedGetUrl(String key, DurationTtl ttl) {
                    return "http://minio.local/" + key;
                }
            };
        }
    }

    @Autowired CollectionsService collections;
    @Autowired com.uslbd.ulms.servicing.PaymentService payments;
    @Autowired com.uslbd.ulms.servicing.LoanRepository loans;
    @Autowired JdbcTemplate jdbc;

    private static final SecureRandom RANDOM = new SecureRandom();

    private UUID seedDelinquentLoan(int dpd) {
        UUID customerId = UUID.randomUUID();
        jdbc.update("""
            insert into ulms.customer (id, cif_no, name_en, segment, mobile, branch_code, kyc_status)
            values (?, ?, 'Coll Person', 'SME', '+880171234568', 'BR-001', 'VERIFIED')
            """, customerId, "CIF-C" + RANDOM.nextInt(999_999));
        var loan = com.uslbd.ulms.servicing.Loan.demo(UUID.randomUUID(), customerId,
                "LN-C" + RANDOM.nextInt(99_999), 80_000_000L, dpd);
        return loans.save(loan).getId();
    }

    @Test
    void worklistPrioritizesBrokenPtpAndDpd() {
        UUID lowDpd = seedDelinquentLoan(20);
        UUID highDpd = seedDelinquentLoan(150);
        UUID brokenPtpLoan = seedDelinquentLoan(40);

        var ptp = collections.promise(brokenPtpLoan, 5_000_000L,
                LocalDate.now().minusDays(10), "HIGH", "Borrower", "Self",
                "+8801799900011", "will pay", "user:collector");
        collections.markOutcome(ptp.getId(), false, "user:collector");   // BROKEN

        var worklist = collections.worklist();
        var first = worklist.get(0);
        assertThat(first.loanId()).isEqualTo(brokenPtpLoan);   // P1: broken PTP tops
        assertThat(first.hasBrokenPtp()).isTrue();

        var rest = worklist.stream().skip(1).map(CollectionsService.WorklistRow::loanId).toList();
        assertThat(rest.indexOf(highDpd)).isLessThan(rest.indexOf(lowDpd));   // DPD desc

        // phone never leaks into the worklist/audit plaintext (06 §5)
        String audit = jdbc.queryForObject(
                "select payload from ulms.audit_entry where action = 'PTP_CREATED' "
                        + "and aggregate_id = ? order by at desc limit 1",
                String.class, brokenPtpLoan);
        assertThat(audit).contains("****0011").doesNotContain("799900011");
    }

    @Test
    void ptpStateMachineAndKeptEvidence() {
        UUID loanId = seedDelinquentLoan(75);
        var ptp = collections.promise(loanId, 5_000_000L, LocalDate.now().minusDays(1),
                "MEDIUM", "Guarantor", "Brother", "+8801799900022", "salary credited",
                "user:collector");

        // kept evidence: no payment yet → not covered
        assertThat(collections.promiseCovered(ptp)).isFalse();

        // payment covering the promise lands → covered → mark KEPT
        payments.postPayment(loanId, 5_000_000L, "PTP-COVER-1", "COUNTER", null, "user:teller");
        assertThat(collections.promiseCovered(ptp)).isTrue();
        var kept = collections.markOutcome(ptp.getId(), true, "user:collector");
        assertThat(kept.getKept()).isEqualTo("KEPT");

        // terminal: no second transition (03 state machine)
        assertThatThrownBy(() -> collections.markOutcome(ptp.getId(), false, "user:collector"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already KEPT");
    }

    @Test
    void fieldTaskSyncIsServerWinsWithAppendOnlyEvidence() {
        UUID loanId = seedDelinquentLoan(120);
        var task = collections.assignFieldTask(loanId, "user:agent1",
                LocalDate.now().plusDays(3), "user:bm");

        var done = collections.completeFieldTask(task.getId(), "visited, spoke to guarantor",
                "user:agent1");
        assertThat(done.getStatus()).isEqualTo("DONE");
        assertThat(done.getNotes()).contains("visited, spoke to guarantor");

        // duplicate complete (offline sync replay): suppressed, evidence appended
        var again = collections.completeFieldTask(task.getId(), "replayed from device",
                "user:agent1");
        assertThat(again.getStatus()).isEqualTo("DONE");
        assertThat(again.getNotes()).contains("visited").contains("duplicate complete suppressed")
                .contains("replayed from device");   // append-only, nothing lost
        Integer rows = jdbc.queryForObject(
                "select count(*) from ulms.field_task where id = ?", Integer.class, task.getId());
        assertThat(rows).isEqualTo(1);              // server-wins: no duplicate row
    }

    @Test
    void calendarReturnsPromisesInRange() {
        UUID loanId = seedDelinquentLoan(60);
        collections.promise(loanId, 1_000_000L, LocalDate.now().plusDays(5), "LOW",
                null, null, null, null, "user:c");
        var week = collections.calendar(LocalDate.now(), LocalDate.now().plusDays(7));
        assertThat(week).anyMatch(p -> p.getLoanId().equals(loanId));
        var empty = collections.calendar(LocalDate.now().plusDays(30),
                LocalDate.now().plusDays(40));
        assertThat(empty).noneMatch(p -> p.getLoanId().equals(loanId));
    }
}

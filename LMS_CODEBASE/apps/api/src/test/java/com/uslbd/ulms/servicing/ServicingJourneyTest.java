package com.uslbd.ulms.servicing;

import com.uslbd.ulms.integration.docs.DocumentStorePort;
import com.uslbd.ulms.integration.fineract.FineractLoanPort;
import com.uslbd.ulms.integration.fineract.FineractPort;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * G3 servicing oracles (03 mod-servicing tests): exactly-once under a
 * duplicate webhook storm, schedule Σprincipal = principal (EMI-oracle
 * parity), statement JSON/CSV parity, settlement-quote policy math,
 * reschedule regeneration, recon mismatch → alert.
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
@TestPropertySource(properties = "ulms.rails.webhook-secret=${random.uuid}-test-secret")
class ServicingJourneyTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary FineractPort clientPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 9000 + seq.incrementAndGet();
        }
        @Bean @Primary FineractLoanPort loanPort() {
            return new FineractLoanPort() {
                @Override public long createLoan(LoanSpec spec) { return 9500L; }
                @Override public long chargeFee(long loanId, long amountMinor, String chargeName) {
                    assertThat(amountMinor).isPositive();
                    return 98001L;
                }
                @Override public long disburseLoan(long loanId, long amountMinor) { return 96001L; }
                @Override public long repayLoan(long loanId, long amountMinor) {
                    assertThat(amountMinor).isPositive();
                    return 97000 + (repaySeq.incrementAndGet());
                }
            };
        }
        @Bean @Primary DocumentStorePort docPort() {
            return new DocumentStorePort() {
                @Override public StoredObject put(String key, java.io.InputStream bytes,
                                                  long size, String contentType) {
                    return new StoredObject(key, "d".repeat(64), size);
                }
                @Override public String presignedGetUrl(String key, DurationTtl ttl) {
                    return "http://minio.local/" + key;
                }
            };
        }
        static final java.util.concurrent.atomic.AtomicLong repaySeq =
                new java.util.concurrent.atomic.AtomicLong();
        @Bean @Primary Clock fixedClock() {
            return Clock.fixed(Instant.parse("2026-09-29T12:00:00Z"), ZoneOffset.UTC);
        }
    }

    @Autowired PaymentService payments;
    @Autowired ServicingService servicing;
    @Autowired WebhookVerifier verifier;
    @Autowired LoanRepository loans;
    @Autowired org.springframework.jdbc.core.JdbcTemplate jdbc;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Test
    void webhookStormPostsExactlyOnce() {
        var loan = seedLoan(100_000_000L, 12, 0);
        var intent = payments.initiateIntent(loan.getId(), 10_000_000L, "BKASH", "user:portal");

        String raw = "{\"intentId\":\"" + intent.getId() + "\",\"utr\":\"UTR-STORM-1\","
                + "\"amountMinor\":10000000}";
        String ts = String.valueOf(Instant.now().getEpochSecond());
        String sig = verifier.sign("BKASH", ts, raw);

        // ── the storm: 10 identical verified callbacks
        int replays = 0;
        for (int i = 0; i < 10; i++) {
            var result = payments.onRailCallback("BKASH", "UTR-STORM-1", 10_000_000L,
                    intent.getId());
            if (result.replay()) replays++;
        }
        assertThat(replays).isEqualTo(9);                      // 1 post + 9 replays
        Integer rows = jdbc.queryForObject(
                "select count(*) from ulms.payment where utr = 'UTR-STORM-1'", Integer.class);
        assertThat(rows).isEqualTo(1);                         // exactly ONE row
        Long posted = jdbc.queryForObject(
                "select outstanding_minor from ulms.loan where id = ?", Long.class, loan.getId());
        assertThat(posted).isEqualTo(90_000_000L);             // mirror decremented ONCE
        Integer finTxns = jdbc.queryForObject(
                "select count(*) from ulms.payment where utr = 'UTR-STORM-1' and fineract_txn_id is not null",
                Integer.class);
        assertThat(finTxns).isEqualTo(1);                      // Fineract hit ONCE
        String intentDone = jdbc.queryForObject(
                "select status from ulms.payment_intent where id = ?",
                String.class, intent.getId());
        assertThat(intentDone).isEqualTo("COMPLETED");         // callback settles its intent

        // verifier: fresh ts (fixed clock) + tampered body → BAD_SIGNATURE;
        // ts 10 min old → STALE (replay window ±5 min)
        long freshTs = Instant.parse("2026-09-29T12:00:00Z").getEpochSecond();
        assertThat(verifier.verify("BKASH", String.valueOf(freshTs), sig, raw + "x"))
                .isEqualTo(WebhookVerifier.Verdict.BAD_SIGNATURE);
        String staleTs = String.valueOf(freshTs - 600);
        assertThat(verifier.verify("BKASH", staleTs, verifier.sign("BKASH", staleTs, raw), raw))
                .isEqualTo(WebhookVerifier.Verdict.STALE_TIMESTAMP);
        // P5 F8: cross-rail replay — a BKASH signature is invalid on the NAGAD path
        // (freshTs: the FIXED test clock, so the staleness gate doesn't fire first)
        assertThat(verifier.verify("NAGAD", String.valueOf(freshTs),
                verifier.sign("BKASH", String.valueOf(freshTs), raw), raw))
                .isEqualTo(WebhookVerifier.Verdict.BAD_SIGNATURE);
    }

    @Test
    void scheduleParityStatementCsvAndQuoteMath() {
        var loan = seedLoan(150_000_000L, 24, 0);   // ৳15L / 24m @ 11.99%

        // ── schedule: EMI-oracle parity + closes exactly
        var schedule = servicing.schedule(loan.getId());
        assertThat(schedule).hasSize(24);
        long emiOracle = com.uslbd.ulms.platform.MoneyMath.emiMonthly(
                150_000_000L, 24, new BigDecimal("0.1199"));
        assertThat(schedule.get(0).emiMinor()).isEqualTo(emiOracle);
        assertThat(schedule.stream().mapToLong(ServicingService.ScheduleLine::principalMinor).sum())
                .isEqualTo(150_000_000L);                       // Σ principal = principal
        assertThat(schedule.get(23).balanceAfterMinor()).isZero();

        // ── payments → statement page; JSON rows == CSV rows (parity)
        payments.postPayment(loan.getId(), emiOracle, "T1", "COUNTER", null, "user:teller");
        payments.postPayment(loan.getId(), emiOracle, "T2", "COUNTER", null, "user:teller");
        var stmt = servicing.statement(loan.getId(), 1, 50, "user:t");
        assertThat(stmt.rows()).hasSize(2);
        String csv = stmt.toCsv();
        assertThat(csv).startsWith("paid_on,reference,rail,paid_in_minor,outstanding_after_minor");
        assertThat(csv.lines().count()).isEqualTo(3);           // header + 2 rows
        for (var row : stmt.rows()) {
            assertThat(csv).contains(row.reference() + ",COUNTER," + row.paidInMinor());
        }
        // running balance reconstructed: last row's outstanding = current mirror
        long mirror = loans.findById(loan.getId()).orElseThrow().getOutstandingMinor();
        assertThat(stmt.rows().get(stmt.rows().size() - 1).outstandingAfterMinor())
                .isEqualTo(mirror);

        // ── quote math (policy oracle): 2 installments paid (<6 → 2% penalty, no rebate)
        var quote = servicing.settleQuote(loan.getId(), "user:officer");
        long outstanding = mirror;
        assertThat(quote.getPenaltyMinor()).isEqualTo(outstanding / 50);      // 2%
        assertThat(quote.getRebateMinor()).isZero();                          // <12 paid
        assertThat(quote.getTotalMinor()).isEqualTo(outstanding + outstanding / 50);
        assertThat(quote.getValidUntil()).isAfter(Instant.now());

        // ── reschedule: request → approve → schedule regenerates at new tenor
        var req = servicing.requestReschedule(loan.getId(), 36, "income shock", "user:officer");
        servicing.decideReschedule(req.getId(), true, "user:bm");
        assertThat(servicing.schedule(loan.getId())).hasSize(36);             // regenerated
        assertThat(loans.findById(loan.getId()).orElseThrow().getTenorMonths()).isEqualTo(36);
        assertThatThrownBy(() -> servicing.decideReschedule(req.getId(), false, "user:bm"))
                .isInstanceOf(IllegalStateException.class)                    // already decided
                .hasMessageContaining("Already decided");
    }

    @Test
    void reconRaisesAlertOnMismatch() {
        var loan = seedLoan(50_000_000L, 12, 0);
        payments.postPayment(loan.getId(), 5_000_000L, "R1", "BKASH", "UTR-R1", "user:t");
        // bank file claims UTR-R1 paid ৳40k (we posted ৳50k) + an unknown UTR
        var result = payments.reconcile(List.of(
                new com.uslbd.ulms.integration.rails.PaymentRailPort.SettlementLine("UTR-R1", 4_000_000L),
                new com.uslbd.ulms.integration.rails.PaymentRailPort.SettlementLine("UTR-UNKNOWN", 1_000L)),
                "user:recon");
        assertThat(result.matched()).isZero();
        assertThat(result.mismatches()).hasSize(2);
        Integer alerts = jdbc.queryForObject(
                "select count(*) from ulms.compliance_alert where type = 'RECON_MISMATCH'",
                Integer.class);
        assertThat(alerts).isGreaterThanOrEqualTo(2);           // each mismatch → alert
    }

    @Test
    void amountGuardsRejectGarbageAndFeesChargeThroughFineract() {
        var loan = seedLoan(80_000_000L, 12, 0);

        // negative/zero amounts → 422-style
        assertThatThrownBy(() -> payments.postPayment(loan.getId(), 0, "G1", "COUNTER", null, "u"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("positive");
        // overpayment → 422-style with the outstanding in the message
        assertThatThrownBy(() -> payments.postPayment(loan.getId(), 99_000_000_00L, "G2",
                "COUNTER", null, "u"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("exceeds outstanding");
        // webhook garbage amount rejected before any posting
        assertThatThrownBy(() -> payments.onRailCallback("BKASH", "UTR-NEG", -5, loan.getId()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("positive");

        // fee (03 repayment/fee/waiver triple): stubbed Fineract charge + audit
        long charge = payments.chargeFee(loan.getId(), 2_500_00, "ULMS Penalty Fee", "user:officer");
        assertThat(charge).isPositive();
        Integer feeAudits = jdbc.queryForObject(
                "select count(*) from ulms.audit_entry where action = 'FEE_CHARGED' "
                        + "and aggregate_id = ?", Integer.class, loan.getId());
        assertThat(feeAudits).isEqualTo(1);
        // mirror-only loans reject honestly
        var migrated = seedLoan(30_000_000L, 12, 0);
        jdbc.update("update ulms.loan set fineract_loan_id = null where id = ?",
                migrated.getId());
        assertThatThrownBy(() -> payments.chargeFee(migrated.getId(), 100, "x", "u"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("mirror-only");
    }

    /** Real customer FK + loan WITH a Fineract id so postings hit the stubbed rail. */
    private Loan seedLoan(long principal, int tenor, int dpd) {
        UUID customerId = UUID.randomUUID();
        jdbc.update("""
            insert into ulms.customer (id, cif_no, name_en, segment, mobile, branch_code, kyc_status)
            values (?, ?, 'Srv Person', 'RETAIL', '+880171234569', 'BR-001', 'VERIFIED')
            """, customerId, "CIF-S" + RANDOM.nextInt(999_999));
        Loan l = Loan.demo(UUID.randomUUID(), customerId, "LN-S" + RANDOM.nextInt(99_999),
                principal, dpd);
        l.updateTenor(tenor);
        Loan saved = loans.save(l);
        long fineractId = 4242L + RANDOM.nextInt(999_999);   // UNIQUE column — distinct per loan
        jdbc.update("update ulms.loan set fineract_loan_id = ? where id = ?",
                fineractId, saved.getId());
        return loans.findById(saved.getId()).orElseThrow();
    }
}

package com.uslbd.ulms.servicing;

import com.uslbd.ulms.platform.MoneyMath;
import com.uslbd.ulms.platform.audit.AuditService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * Schedules, statements, settlement quotes and reschedules (03
 * mod-servicing). The schedule is the amortization derived from the SAME
 * EMI oracle as the wizard/assessment (09 §3); statements are payment-ledger
 * pages with JSON and CSV parity; quote math is a deterministic policy
 * oracle (penalty within 6-installment lock-in, 50% rebate on unearned
 * interest after 12 paid).
 */
@Service
public class ServicingService {

    private final LoanRepository loans;
    private final PaymentRepository payments;
    private final StatementRunRepository statements;
    private final RescheduleRequestRepository reschedules;
    private final SettlementQuoteRepository quotes;
    private final AuditService audit;

    ServicingService(LoanRepository loans, PaymentRepository payments,
                     StatementRunRepository statements,
                     RescheduleRequestRepository reschedules,
                     SettlementQuoteRepository quotes, AuditService audit) {
        this.loans = loans; this.payments = payments;
        this.statements = statements; this.reschedules = reschedules;
        this.quotes = quotes; this.audit = audit;
    }

    public record ScheduleLine(int no, LocalDate dueDate, long emiMinor,
                               long principalMinor, long interestMinor,
                               long balanceAfterMinor) {}

    /**
     * R10 P-C: payment-stream reads for the AML monitoring module — the
     * public cross-module surface (package-private repos stay internal).
     */
    @Transactional(readOnly = true)
    public java.util.List<Payment> paymentsOfCustomerBetween(UUID customerId,
                                                             java.time.Instant from,
                                                             java.time.Instant to) {
        var loanIds = loans.findAllByCustomerId(customerId).stream()
                .map(com.uslbd.ulms.servicing.Loan::getId).toList();
        return payments.findAllByPaidAtBetweenOrderByPaidAtAsc(from, to).stream()
                .filter(p -> loanIds.contains(p.getLoanId()))
                .toList();
    }

    /** Amortization schedule — EMI-oracle parity is tested (Σprincipal = principal). */
    @Transactional(readOnly = true)
    public List<ScheduleLine> schedule(UUID loanId) {
        Loan loan = loan(loanId);
        return scheduleFor(loan.getPrincipalMinor(), loan.getTenorMonths(),
                loan.getInterestRateBp(), loan.getDisbursedAt());
    }

    static List<ScheduleLine> scheduleFor(long principalMinor, int tenorMonths,
                                          int rateBp, Instant disbursedAt) {
        BigDecimal rate = BigDecimal.valueOf(rateBp, 4);
        long emi = MoneyMath.emiMonthly(principalMinor, tenorMonths, rate);
        BigDecimal monthlyRate = rate.divide(BigDecimal.valueOf(12), 12, RoundingMode.HALF_UP);
        List<ScheduleLine> lines = new ArrayList<>(tenorMonths);
        long balance = principalMinor;
        Instant anchor = disbursedAt == null ? Instant.now() : disbursedAt;   // migrated rows may lack it
        LocalDate firstDue = anchor.atZone(ZoneOffset.UTC).toLocalDate().plusMonths(1);
        for (int n = 1; n <= tenorMonths; n++) {
            long interest = BigDecimal.valueOf(balance).multiply(monthlyRate)
                    .setScale(0, RoundingMode.HALF_UP).longValue();
            long principalPart = Math.min(emi - interest, balance);
            if (n == tenorMonths) principalPart = balance;   // last row closes the loan
            balance -= principalPart;
            lines.add(new ScheduleLine(n, firstDue.plusMonths(n - 1L),
                    principalPart + interest, principalPart, interest, balance));
        }
        return lines;
    }

    public record StatementRow(LocalDate paidOn, String reference, String rail,
                               long paidInMinor, long outstandingAfterMinor) {}

    /** Statement page over the payment ledger (both formats derive from this). */
    @Transactional
    public StatementPage statement(UUID loanId, int page, int size, String actor) {
        Loan loan = loan(loanId);
        List<Payment> ledger = payments
                .findAllByLoanIdAndPaidAtBetweenOrderByPaidAtAsc(loanId, Instant.EPOCH, Instant.now());
        // running-outstanding reconstruction from the current balance backwards
        long running = loan.getOutstandingMinor();
        List<StatementRow> rows = new ArrayList<>(ledger.size());
        for (int i = ledger.size() - 1; i >= 0; i--) {
            Payment p = ledger.get(i);
            rows.add(new StatementRow(
                    p.getPaidAt().atZone(ZoneOffset.UTC).toLocalDate(),
                    p.getUtr() != null ? p.getUtr() : p.getExternalRef(),
                    p.getRail(), p.getAmountMinor(), running));
            running += p.getAmountMinor();
        }
        java.util.Collections.reverse(rows);

        int from = Math.min((page - 1) * size, rows.size());
        int to = Math.min(from + size, rows.size());
        statements.save(StatementRun.of(UUID.randomUUID(), loanId, rows.size(),
                Instant.EPOCH, Instant.now(), actor));
        // P5 audit F9: statement generation is a state change — audit it (06 §3)
        audit.record(actor, "STATEMENT_GENERATED", "loan", loanId,
                "{\"rows\":" + rows.size() + ",\"page\":" + page + "}", UUID.randomUUID());
        return new StatementPage(loan.getLoanNo(), rows.subList(from, to), page, size, rows.size());
    }

    public record StatementPage(String loanNo, List<StatementRow> rows,
                                int page, int size, int total) {

        /** CSV rendering — byte-parity with the JSON rows is tested (03). */
        public String toCsv() {
            StringBuilder sb = new StringBuilder("paid_on,reference,rail,paid_in_minor,outstanding_after_minor\n");
            for (StatementRow r : rows) {
                sb.append(r.paidOn()).append(',').append(r.reference()).append(',')
                        .append(r.rail()).append(',').append(r.paidInMinor()).append(',')
                        .append(r.outstandingAfterMinor()).append('\n');
            }
            return sb.toString();
        }
    }

    /**
     * Early-settlement quote (03 policy oracle): total = outstanding +
     * penalty (2% if fewer than 6 installments paid — lock-in) − rebate
     * (50% of remaining scheduled interest once ≥ 12 paid). Valid 7 days.
     */
    @Transactional
    public SettlementQuote settleQuote(UUID loanId, String actor) {
        Loan loan = loan(loanId);
        long emi = MoneyMath.emiMonthly(loan.getPrincipalMinor(), loan.getTenorMonths(),
                BigDecimal.valueOf(loan.getInterestRateBp(), 4));
        long paid = payments.findAllByLoanIdOrderByPaidAtDesc(loanId).stream()
                .mapToLong(Payment::getAmountMinor).sum();
        int installmentsPaid = emi > 0 ? (int) Math.min(loan.getTenorMonths(), paid / emi) : 0;

        long remainingInterest = schedule(loanId).stream()
                .skip(installmentsPaid).mapToLong(ScheduleLine::interestMinor).sum();
        long penalty = installmentsPaid < 6 ? loan.getOutstandingMinor() / 50 : 0;   // 2%
        long rebate = installmentsPaid >= 12 ? remainingInterest / 2 : 0;            // 50%
        long total = Math.max(0, loan.getOutstandingMinor() + penalty - rebate);

        SettlementQuote q = quotes.save(SettlementQuote.of(UUID.randomUUID(), loanId,
                loan.getOutstandingMinor(), penalty, rebate, total,
                Instant.now().plusSeconds(7 * 24 * 3600), actor));
        audit.record(actor, "SETTLE_QUOTED", "loan", loanId,
                "{\"outstanding\":" + loan.getOutstandingMinor() + ",\"penalty\":" + penalty
                        + ",\"rebate\":" + rebate + ",\"total\":" + total + "}",
                UUID.randomUUID());
        return q;
    }

    /** Record a reschedule request (officer decision is the CPV-style gate). */
    @Transactional
    public RescheduleRequest requestReschedule(UUID loanId, int newTenorMonths,
                                               String reason, String actor) {
        loan(loanId);
        RescheduleRequest r = reschedules.save(RescheduleRequest.of(UUID.randomUUID(),
                loanId, newTenorMonths, reason, actor));
        audit.record(actor, "RESCHEDULE_REQUESTED", "loan", loanId,
                "{\"newTenor\":" + newTenorMonths + "}", UUID.randomUUID());
        return r;
    }

    /** Approve regenerates the schedule tenor on the loan (03: regeneration test). */
    @Transactional
    public RescheduleRequest decideReschedule(UUID requestId, boolean approve, String actor) {
        RescheduleRequest r = reschedules.findById(requestId)
                .orElseThrow(() -> new NoSuchElementException("No reschedule " + requestId));
        if (!"REQUESTED".equals(r.getStatus())) {
            throw new IllegalStateException("Already decided (" + r.getStatus() + ")");
        }
        r.decide(approve ? "APPROVED" : "REJECTED", actor);
        if (approve) {
            loan(r.getLoanId()).updateTenor(r.getNewTenorMonths());   // schedule regenerates
        }
        audit.record(actor, approve ? "RESCHEDULE_APPROVED" : "RESCHEDULE_REJECTED",
                "loan", r.getLoanId(), "{\"newTenor\":" + r.getNewTenorMonths() + "}",
                UUID.randomUUID());
        return r;
    }

    public record TaxCertificateLine(String loanNo, long interestPaidMinor, long totalPaidMinor) {}

    /** Tax certificate for a year: interest portion of payments (03). */
    @Transactional(readOnly = true)
    public List<TaxCertificateLine> taxCertificate(UUID customerId, int year) {
        List<TaxCertificateLine> lines = new ArrayList<>();
        for (Loan loan : loans.findAllByCustomerId(customerId)) {
            var schedule = schedule(loan.getId());
            long emi = schedule.isEmpty() ? 0 : schedule.get(0).emiMinor();
            long totalPaid = payments.findAllByLoanIdOrderByPaidAtDesc(loan.getId()).stream()
                    .filter(p -> p.getPaidAt().atZone(ZoneOffset.UTC).getYear() == year)
                    .mapToLong(Payment::getAmountMinor).sum();
            if (totalPaid == 0) continue;
            long interestPaid = schedule.stream()
                    .limit(emi > 0 ? totalPaid / emi : 0)
                    .mapToLong(ScheduleLine::interestMinor).sum();
            lines.add(new TaxCertificateLine(loan.getLoanNo(), interestPaid, totalPaid));
        }
        return lines;
    }

    @Transactional(readOnly = true)
    public List<RescheduleRequest> reschedulesOf(UUID loanId) {
        return reschedules.findAllByLoanIdOrderByCreatedAtDesc(loanId);
    }

    @Transactional(readOnly = true)
    public List<SettlementQuote> quotesOf(UUID loanId) {
        return quotes.findAllByLoanIdOrderByCreatedAtDesc(loanId);
    }

    // ── compliance read facts (P4: CL-3 recovery, CL-5 restructures, CIB track) ──

    /** Payment fact for the regcon pack — cross-module read (CL-3, CIB rhythm). */
    public record PaymentFact(UUID loanId, java.time.LocalDateTime paidOn, long amountMinor) {}

    /** Every posted payment system-wide in a window (inclusive from, exclusive to). */
    @Transactional(readOnly = true)
    public List<PaymentFact> paymentsBetween(Instant from, Instant to) {
        // P5 perf: ONE query (was one query per loan — N+1 behind the CL-3/CIB packs)
        return payments.findAllByPaidAtBetweenOrderByPaidAtAsc(from, to).stream()
                .map(p -> new PaymentFact(p.getLoanId(),
                        p.getPaidAt().atZone(java.time.ZoneOffset.UTC).toLocalDateTime(),
                        p.getAmountMinor()))
                .toList();
    }

    /** Restructure fact for CL-5 — approvals decided inside the window. */
    public record RescheduleFact(UUID loanId, int newTenorMonths, String reason,
                                 String requestedBy, String decidedBy, Instant decidedAt) {}

    @Transactional(readOnly = true)
    public List<RescheduleFact> reschedulesApprovedBetween(Instant from, Instant to) {
        return reschedules.findAll().stream()
                .filter(r -> "APPROVED".equals(r.getStatus()) && r.getDecidedAt() != null)
                .filter(r -> !r.getDecidedAt().isBefore(from) && r.getDecidedAt().isBefore(to))
                .map(r -> new RescheduleFact(r.getLoanId(), r.getNewTenorMonths(),
                        r.getReason(), r.getRequestedBy(), r.getDecidedBy(), r.getDecidedAt()))
                .toList();
    }

    private Loan loan(UUID loanId) {
        return loans.findById(loanId)
                .orElseThrow(() -> new NoSuchElementException("No loan " + loanId));
    }
}

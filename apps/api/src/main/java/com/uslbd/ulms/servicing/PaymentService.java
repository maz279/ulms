package com.uslbd.ulms.servicing;

import com.uslbd.ulms.integration.fineract.FineractLoanPort;
import com.uslbd.ulms.integration.rails.PaymentRailPort;
import com.uslbd.ulms.platform.MoneyMath;
import com.uslbd.ulms.platform.audit.AuditService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;

/**
 * Payments (03 mod-servicing, 11 §3): portal intent → rail redirect →
 * HMAC-signed webhook → post. Posting is idempotent by externalRef; webhook
 * intake is idempotent by UTR (05 §7); the Fineract repayment + loan-mirror
 * update happen in ONE transaction; recon compares bank-file lines vs
 * posted payments and raises alerts on mismatch.
 */
@Service
public class PaymentService {

    private final PaymentRepository payments;
    private final PaymentIntentRepository intents;
    private final LoanRepository loans;
    private final FineractLoanPort fineractLoans;
    private final PaymentRailPort rails;
    private final ComplianceAlertPort alerts;    // port keeps modules acyclic
    private final AuditService audit;
    private final PaymentMonitorPort monitoring;   // R10: CTR/velocity/structuring (port keeps acyclic)
    @org.springframework.beans.factory.annotation.Value(
            "${ulms.servicing.portal-daily-payment-limit:10}")
    private int portalDailyPaymentLimit;

    PaymentService(PaymentRepository payments, PaymentIntentRepository intents,
                   LoanRepository loans, FineractLoanPort fineractLoans,
                   PaymentRailPort rails, ComplianceAlertPort alerts, AuditService audit,
                   PaymentMonitorPort monitoring) {
        this.payments = payments; this.intents = intents; this.loans = loans;
        this.fineractLoans = fineractLoans; this.rails = rails;
        this.monitoring = monitoring;
        this.alerts = alerts; this.audit = audit;
    }

    /** Portal/staff payment intent → rail checkout URL (redirect model, 08 B2). */
    @Transactional
    public PaymentIntent initiateIntent(UUID loanId, long amountMinor, String rail,
                                        String initiatedBy) {
        Loan loan = loan(loanId);
        if ("CLOSED".equals(loan.getStage())) {
            throw new IllegalStateException("Loan " + loan.getLoanNo() + " is closed");
        }
        if (amountMinor <= 0 || amountMinor > loan.getOutstandingMinor()) {
            throw new IllegalArgumentException(
                    "Amount must be positive and ≤ outstanding " + loan.getOutstandingMinor());
        }
        // R10 P-D: portal velocity limit — N payment initiations per customer
        // per rolling 24 h (staff counter posting is exempt)
        if (initiatedBy != null && initiatedBy.startsWith("portal:")) {
            long today = loans.findAllByCustomerId(loan.getCustomerId()).stream()
                    .flatMap(l -> intents.findAllByLoanIdOrderByCreatedAtDesc(l.getId()).stream())
                    .filter(i -> i.getCreatedAt().isAfter(java.time.Instant.now()
                            .minus(java.time.Duration.ofHours(24))))
                    .count();
            if (today >= portalDailyPaymentLimit) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.TOO_MANY_REQUESTS,
                        "portal payment limit (" + portalDailyPaymentLimit + "/day) reached");
            }
        }
        // P5 F5: allowlist at the service boundary — no caller-chosen hosts in checkout URLs
        String canonicalRail = com.uslbd.ulms.integration.rails.PaymentRailPort.requireKnownRail(rail);
        var checkout = rails.initiate(canonicalRail, loanId.toString(), amountMinor);
        PaymentIntent intent = intents.save(PaymentIntent.of(UUID.randomUUID(), loanId,
                amountMinor, canonicalRail, checkout.railRef(), checkout.railUrl(), initiatedBy));
        audit.record(initiatedBy, "PAYMENT_INTENT_CREATED", "loan", loanId,
                "{\"amount\":" + amountMinor + ",\"rail\":\"" + canonicalRail
                        + "\",\"railRef\":\"" + checkout.railRef() + "\"}", UUID.randomUUID());
        return intent;
    }

    /**
     * Post a payment: dedupe by externalRef → Fineract repayment → mirror
     * update, all in one tx. The ONLY entry points are staff counter posting
     * and the verified webhook — never the portal directly.
     */
    @Transactional
    public Payment postPayment(UUID loanId, long amountMinor, String externalRef,
                               String rail, String utr, String postedBy) {
        if (amountMinor <= 0) {
            throw new IllegalArgumentException("Payment amount must be positive");
        }
        Optional<Payment> existing = payments.findByExternalRef(externalRef);
        if (existing.isPresent()) return existing.get();   // 03: idempotent by external ref
        if (utr != null) {
            Optional<Payment> byUtr = payments.findByUtr(utr);
            if (byUtr.isPresent()) return byUtr.get();     // 05 §7: idempotent by UTR
        }
        Loan loan = loan(loanId);
        if (amountMinor > loan.getOutstandingMinor()) {
            throw new IllegalArgumentException(
                    "Payment " + amountMinor + " exceeds outstanding " + loan.getOutstandingMinor());
        }
        // Demo/migrated loans carry no Fineract id — mirror-only posting;
        // ULMS-originated loans always hit the real repayment transaction.
        Long txnId = loan.getFineractLoanId() == null ? null
                : fineractLoans.repayLoan(loan.getFineractLoanId(), amountMinor);
        long emi = emiOf(loan);
        loan.applyPayment(amountMinor, emi);
        Payment p = payments.save(Payment.of(UUID.randomUUID(), loanId, amountMinor,
                externalRef, rail, utr, txnId, postedBy));
        audit.record(postedBy, "PAYMENT_POSTED", "loan", loanId,
                "{\"amount\":" + amountMinor + ",\"rail\":\"" + rail
                        + "\",\"utr\":\"" + utr + "\",\"fineractTxn\":" + txnId
                        + ",\"outstandingAfter\":" + loan.getOutstandingMinor() + "}",
                UUID.randomUUID());
        monitoring.observe(p);   // R10 P-C: CTR ≥ ৳10 L cash + velocity/structuring
        return p;
    }

    /**
     * Verified webhook intake (05 §7): idempotent by UTR — a duplicate-callback
     * storm results in exactly ONE posted payment. Body is parsed by the
     * controller AFTER signature verification; here we trust the verified payload.
     */
    @Transactional
    public WebhookResult onRailCallback(String rail, String utr, long amountMinor,
                                        UUID intentId) {
        if (amountMinor <= 0) {
            throw new IllegalArgumentException("Callback amount must be positive");
        }
        Optional<Payment> byUtr = payments.findByUtr(utr);
        if (byUtr.isPresent()) {
            return new WebhookResult(byUtr.get(), true);   // replay — no double posting
        }
        UUID loanId = intentId;
        if (loanId == null) {
            throw new IllegalArgumentException("callback carries no intentId — cannot resolve loan");
        }
        PaymentIntent intent = intents.findById(loanId)
                .orElseThrow(() -> new NoSuchElementException("No intent " + loanId));
        Payment p = postPayment(intent.getLoanId(), amountMinor,
                "WEBHOOK:" + utr, rail, utr, "rail:" + rail);
        intent.complete();   // the callback settles its own intent (id-addressed, not string-matched)
        return new WebhookResult(p, false);
    }

    public record WebhookResult(Payment payment, boolean replay) {}

    /**
     * Reconciliation job (11 §3): nightly 23:50 — bank-file lines vs posted
     * payments; each mismatch raises a RECON_MISMATCH alert. The sandbox
     * adapter's settlement feed is empty, so the pilot run is a no-op audit
     * row until a bank feed lands (UAT swaps the adapter).
     */
    @org.springframework.scheduling.annotation.Scheduled(cron = "0 50 23 * * *")
    public void nightlyRecon() {
        reconcile(rails.settlementLines(java.time.LocalDate.now()), "system:recon");
    }

    /** Reconciliation (11 §3): bank-file lines vs posted payments → alerts. */
    @Transactional
    public ReconResult reconcile(List<PaymentRailPort.SettlementLine> bankLines, String actor) {
        int matched = 0;
        var mismatches = new java.util.ArrayList<PaymentRailPort.SettlementLine>();
        for (var line : bankLines) {
            var p = payments.findByUtr(line.utr());
            if (p.isPresent() && p.get().getAmountMinor() == line.amountMinor()) {
                matched++;
            } else {
                mismatches.add(line);
                alerts.raiseAlert("RECON_MISMATCH", "payment", null,
                        "{\"utr\":\"" + line.utr() + "\",\"bankAmount\":" + line.amountMinor()
                                + ",\"ulmsAmount\":" + (p.map(x -> x.getAmountMinor()).orElse(0L)) + "}");
            }
        }
        audit.record(actor, "RECON_RUN", "recon", UUID.randomUUID(),
                "{\"lines\":" + bankLines.size() + ",\"matched\":" + matched
                        + ",\"mismatch\":" + mismatches.size() + "}", UUID.randomUUID());
        return new ReconResult(bankLines.size(), matched, mismatches);
    }

    public record ReconResult(int lines, int matched,
                              List<PaymentRailPort.SettlementLine> mismatches) {}

    /** Fee charge on a loan (03 mod-servicing: repayment/fee/waiver triple). */
    @Transactional
    public long chargeFee(UUID loanId, long amountMinor, String chargeName, String actor) {
        if (amountMinor <= 0) {
            throw new IllegalArgumentException("Fee amount must be positive");
        }
        Loan loan = loan(loanId);
        if (loan.getFineractLoanId() == null) {
            throw new IllegalStateException(
                    "Loan " + loan.getLoanNo() + " is mirror-only (migrated) — no Fineract charge");
        }
        long chargeId = fineractLoans.chargeFee(loan.getFineractLoanId(), amountMinor, chargeName);
        audit.record(actor, "FEE_CHARGED", "loan", loanId,
                "{\"amount\":" + amountMinor + ",\"charge\":\"" + chargeName
                        + "\",\"fineractCharge\":" + chargeId + "}", UUID.randomUUID());
        return chargeId;
    }

    @Transactional(readOnly = true)
    public List<Payment> paymentsOf(UUID loanId) {
        return payments.findAllByLoanIdOrderByPaidAtDesc(loanId);
    }

    @Transactional(readOnly = true)
    public List<PaymentIntent> intentsOf(UUID loanId) {
        return intents.findAllByLoanIdOrderByCreatedAtDesc(loanId);
    }

    private Loan loan(UUID loanId) {
        return loans.findById(loanId)
                .orElseThrow(() -> new NoSuchElementException("No loan " + loanId));
    }

    private static long emiOf(Loan loan) {
        return MoneyMath.emiMonthly(loan.getPrincipalMinor(), loan.getTenorMonths(),
                BigDecimal.valueOf(loan.getInterestRateBp(), 4));
    }
}

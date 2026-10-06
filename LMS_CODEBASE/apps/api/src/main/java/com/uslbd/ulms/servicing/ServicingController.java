package com.uslbd.ulms.servicing;

import com.uslbd.ulms.platform.ApiList;
import com.uslbd.ulms.platform.AuthPrincipal;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

/** Servicing endpoints (03 mod-servicing): payments, schedule, statement, quote, reschedule. */
@RestController
@RequestMapping("/api/v1/loans")
class ServicingController {

    private final PaymentService paymentService;
    private final ServicingService servicing;
    private final LoanRepository loans;

    ServicingController(PaymentService paymentService, ServicingService servicing,
                        LoanRepository loans) {
        this.paymentService = paymentService; this.servicing = servicing; this.loans = loans;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('branch-officer','collections','compliance','credit-analyst','admin')")
    ApiList<LoanView> loansList() {
        return ApiList.of(loans.findAll().stream().map(LoanView::of).toList());
    }

    @GetMapping("/{id}")
    LoanView loan(@PathVariable UUID id) {
        return loans.findById(id).map(LoanView::of)
                .orElseThrow(() -> new NoSuchElementException("No loan " + id));
    }

    /** Fee charge (03: repayment/fee/waiver triple) — Fineract loan charge. */
    @PostMapping("/{id}/fees")
    @PreAuthorize("hasAnyRole('branch-officer','collections','admin')")
    Object fee(@PathVariable UUID id, @RequestBody FeeRequest body) {
        return java.util.Map.of("fineractCharge", paymentService.chargeFee(id,
                body.amountMinor(), body.chargeName() == null ? "ULMS Penalty Fee" : body.chargeName(),
                AuthPrincipal.actorOf()));
    }

    /** Counter payment (staff) — idempotent by externalRef (03). */
    @PostMapping("/{id}/payments")
    @PreAuthorize("hasAnyRole('branch-officer','collections','admin')")
    PaymentView postPayment(@PathVariable UUID id, @RequestBody PaymentRequest body) {
        var p = paymentService.postPayment(id, body.amountMinor(),
                body.externalRef() == null || body.externalRef().isBlank()
                        ? "COUNTER:" + UUID.randomUUID() : body.externalRef(),
                body.rail() == null ? "COUNTER" : body.rail(), null, AuthPrincipal.actorOf());
        return PaymentView.of(p);
    }

    @GetMapping("/{id}/payments")
    ApiList<PaymentView> payments(@PathVariable UUID id) {
        return ApiList.of(paymentService.paymentsOf(id).stream().map(PaymentView::of).toList());
    }

    /** Portal/intent payment initiation → rail redirect URL (11 §3). */
    @PostMapping("/{id}/payment-intents")
    @PreAuthorize("hasAnyRole('branch-officer','collections','admin')")
    IntentView intent(@PathVariable UUID id, @RequestBody IntentRequest body) {
        var i = paymentService.initiateIntent(id, body.amountMinor(), body.rail(),
                AuthPrincipal.actorOf());
        return new IntentView(i.getId(), i.getLoanId(), i.getAmountMinor(), i.getRail(),
                i.getRailRef(), i.getRailUrl(), i.getStatus());
    }

    @GetMapping("/{id}/payment-intents")
    ApiList<IntentView> intents(@PathVariable UUID id) {
        return ApiList.of(paymentService.intentsOf(id).stream()
                .map(i -> new IntentView(i.getId(), i.getLoanId(), i.getAmountMinor(),
                        i.getRail(), i.getRailRef(), i.getRailUrl(), i.getStatus()))
                .toList());
    }

    @GetMapping("/{id}/schedule")
    ApiList<ServicingService.ScheduleLine> schedule(@PathVariable UUID id) {
        return ApiList.of(servicing.schedule(id));
    }

    /** Statement page — JSON or CSV (parity tested); generation audited. */
    @GetMapping("/{id}/statement")
    ResponseEntity<Object> statement(@PathVariable UUID id,
                                     @RequestParam(defaultValue = "1") int page,
                                     @RequestParam(defaultValue = "25") int size,
                                     @RequestParam(defaultValue = "json") String format) {
        var stmt = servicing.statement(id, page, Math.min(size, 100), AuthPrincipal.actorOf());
        if ("csv".equalsIgnoreCase(format)) {
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .header("Content-Disposition",
                            "attachment; filename=statement-" + stmt.loanNo() + ".csv")
                    .body((Object) stmt.toCsv());
        }
        return ResponseEntity.ok().body(stmt);
    }

    @PostMapping("/{id}/settle-quote")
    @PreAuthorize("hasAnyRole('branch-officer','credit-analyst','admin')")
    QuoteView quote(@PathVariable UUID id) {
        var q = servicing.settleQuote(id, AuthPrincipal.actorOf());
        return new QuoteView(q.getId(), q.getOutstandingMinor(), q.getPenaltyMinor(),
                q.getRebateMinor(), q.getTotalMinor(), q.getValidUntil().toString());
    }

    @PostMapping("/{id}/reschedule-request")
    @PreAuthorize("hasAnyRole('branch-officer','collections','admin')")
    RescheduleView requestReschedule(@PathVariable UUID id, @RequestBody RescheduleBody body) {
        var r = servicing.requestReschedule(id, body.newTenorMonths(), body.reason(),
                AuthPrincipal.actorOf());
        return RescheduleView.of(r);
    }

    @PostMapping("/reschedule/{requestId}/decision")
    @PreAuthorize("hasAnyRole('branch-manager','ho-credit','admin')")
    RescheduleView decideReschedule(@PathVariable UUID requestId, @RequestBody Decision body) {
        return RescheduleView.of(servicing.decideReschedule(requestId, body.approve(),
                AuthPrincipal.actorOf()));
    }

    /** Reconciliation run (11 §3): bank-file lines in, mismatches → alerts. */
    @PostMapping("/payments/reconcile")
    @PreAuthorize("hasAnyRole('compliance','admin')")
    Object reconcile(@RequestBody ReconRequest body) {
        var result = paymentService.reconcile(body.settlements(), AuthPrincipal.actorOf());
        return java.util.Map.of("lines", result.lines(), "matched", result.matched(),
                "mismatches", result.mismatches().size());
    }

    // ── views ──────────────────────────────────────────────────────────────
    record LoanView(UUID id, String loanNo, UUID customerId, long principalMinor,
                    long outstandingMinor, int dpd, String stage, String classification,
                    boolean interestSuspense, int tenorMonths, int interestRateBp,
                    String disbursedAt) {
        static LoanView of(Loan l) {
            return new LoanView(l.getId(), l.getLoanNo(), l.getCustomerId(),
                    l.getPrincipalMinor(), l.getOutstandingMinor(), l.getDpd(), l.getStage(),
                    l.getClassification(), l.isInterestSuspense(), l.getTenorMonths(),
                    l.getInterestRateBp(),
                    l.getDisbursedAt() == null ? null : l.getDisbursedAt().toString());
        }
    }
    record PaymentView(UUID id, UUID loanId, long amountMinor, String externalRef,
                       String rail, String utr, Long fineractTxnId, String paidAt) {
        static PaymentView of(Payment p) {
            return new PaymentView(p.getId(), p.getLoanId(), p.getAmountMinor(),
                    p.getExternalRef(), p.getRail(), p.getUtr(), p.getFineractTxnId(),
                    p.getPaidAt().toString());
        }
    }
    record IntentView(UUID id, UUID loanId, long amountMinor, String rail,
                      String railRef, String railUrl, String status) {}
    record QuoteView(UUID id, long outstandingMinor, long penaltyMinor, long rebateMinor,
                     long totalMinor, String validUntil) {}
    record RescheduleView(UUID id, UUID loanId, int newTenorMonths, String reason,
                          String status, String requestedBy) {
        static RescheduleView of(com.uslbd.ulms.servicing.RescheduleRequest r) {
            return new RescheduleView(r.getId(), r.getLoanId(), r.getNewTenorMonths(),
                    r.getReason(), r.getStatus(), r.getRequestedBy());
        }
    }
    record PaymentRequest(long amountMinor, String externalRef, String rail) {}
    record FeeRequest(@jakarta.validation.constraints.Positive long amountMinor, String chargeName) {}
    record IntentRequest(long amountMinor, @jakarta.validation.constraints.NotBlank String rail) {}
    record RescheduleBody(int newTenorMonths, @jakarta.validation.constraints.NotBlank String reason) {}
    record Decision(boolean approve) {}
    record ReconRequest(List<com.uslbd.ulms.integration.rails.PaymentRailPort.SettlementLine> settlements) {}
}

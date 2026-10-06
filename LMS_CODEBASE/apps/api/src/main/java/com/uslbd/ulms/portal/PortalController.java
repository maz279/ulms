package com.uslbd.ulms.portal;

import com.uslbd.ulms.customer.Customer;
import com.uslbd.ulms.customer.CustomerService;
import com.uslbd.ulms.origination.Application;
import com.uslbd.ulms.origination.OriginationService;
import com.uslbd.ulms.platform.ApiList;
import com.uslbd.ulms.platform.AuthPrincipal;
import com.uslbd.ulms.servicing.Loan;
import com.uslbd.ulms.servicing.LoanRepository;
import com.uslbd.ulms.servicing.PaymentService;
import com.uslbd.ulms.servicing.ServicingService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Borrower portal thin slice (08 B1 W10): balance + EMI card, application
 * tracker (read projection of the SAME workflow tables — no second truth),
 * payment history + intent initiation (redirect model only).
 *
 * <p>Security (P5 audit F1): until the dedicated borrower client carries a
 * JWT-bound identity claim (mobile attribute mapper + OTP — UAT scope), the
 * portal is STAFF-token driven; the {@code borrower} realm role is NOT
 * accepted here, because nothing binds a borrower JWT subject to the
 * mobile/CIF query parameters this contract uses. The own-CIF helper stays
 * for the day that binding ships.
 */
@RestController
@RequestMapping("/api/v1/portal")
@PreAuthorize("hasAnyRole('branch-officer','collections','admin')")
class PortalController {

    private final CustomerService customers;
    private final LoanRepository loans;
    private final PaymentService paymentService;
    private final ServicingService servicing;
    private final OriginationService origination;
    private final PortalOtpService otp;   // R10 P-D: OTP login + payment confirmation
    private final com.uslbd.ulms.product.ProductService products;   // R5 apply bounds

    /** Minimal application projection matching the mock's portal-apply shape. */
    record ApplicationView(UUID id, String appNo, String productCode, long amountMinor,
                           int tenorMonths, String stage, String channel) {
        static ApplicationView of(com.uslbd.ulms.origination.Application a) {
            return new ApplicationView(a.getId(), a.getAppNo(), a.getProductCode(),
                    a.getAmountMinor(), a.getTenorMonths(), a.getStage().name(), "PORTAL");
        }
    }

    @org.springframework.beans.factory.annotation.Value("${ulms.portal.otp-required:false}")
    private boolean otpRequired;

    PortalController(CustomerService customers, LoanRepository loans,
                     PaymentService paymentService, ServicingService servicing,
                     OriginationService origination, PortalOtpService otp,
                     com.uslbd.ulms.product.ProductService products) {
        this.customers = customers; this.loans = loans;
        this.paymentService = paymentService; this.servicing = servicing;
        this.origination = origination; this.otp = otp; this.products = products;
    }

    /** Own-CIF lookup by mobile (portal login identifier). Shared mobiles
     *  (legacy duplicates) resolve to the holder with loans — the portal is
     *  useless for the loan-less twin. */
    @GetMapping("/me")
    PortalMe me(@RequestParam String mobile) {
        var candidates = customers.allByMobile(mobile);
        if (candidates.isEmpty()) {
            throw new java.util.NoSuchElementException("No borrower with that mobile");
        }
        Customer c = candidates.stream()
                .filter(x -> !loans.findAllByCustomerId(x.getId()).isEmpty())
                .findFirst()
                .orElse(candidates.get(0));
        List<Loan> myLoans = loans.findAllByCustomerId(c.getId());
        return new PortalMe(c.getCifNo(), c.getNameEn(), c.getKycStatus(),
                myLoans.stream().map(this::loanCard).toList());
    }

    /** Balance + EMI card (08 B1). */
    private LoanCard loanCard(Loan l) {
        var schedule = servicing.schedule(l.getId());
        long emi = schedule.isEmpty() ? 0 : schedule.get(0).emiMinor();
        LocalDate nextDue = schedule.stream()
                .map(ServicingService.ScheduleLine::dueDate)
                .filter(d -> !d.isBefore(java.time.LocalDate.now()))
                .findFirst().orElse(null);
        return new LoanCard(l.getId(), l.getLoanNo(), l.getOutstandingMinor(), emi,
                nextDue == null ? null : nextDue.toString(), l.getClassification());
    }

    /** Application tracker — SAME workflow projection, read-only (08 B2). */
    @GetMapping("/me/application")
    ApiList<TrackerRow> tracker(@RequestParam String cif) {
        Customer c = customers.byCif(cif);
        return ApiList.of(origination.applicationsOf(c.getId()).stream()
                .map(a -> new TrackerRow(a.getAppNo(), a.getStage().name(),
                        a.getAmountMinor(), a.getCreatedAt().toString()))
                .toList());
    }

    @GetMapping("/me/payments")
    ApiList<PaymentLine> myPayments(@RequestParam UUID loanId,
                                   @RequestParam String mobile) {
        assertOwnsLoan(mobile, loanId);                        // 08 B3: strictly own-CIF
        return ApiList.of(paymentService.paymentsOf(loanId).stream()
                .map(p -> new PaymentLine(p.getPaidAt().toString(), p.getAmountMinor(),
                        p.getRail(), p.getUtr() == null ? p.getExternalRef() : p.getUtr()))
                .toList());
    }

    /** R5 parity — borrower self-service apply: mobile→customer, ACTIVE
     *  product bounds enforced, draft created with channel=PORTAL and the
     *  APPLICATION_SUBMITTED event emitted (staff pipeline then submits). */
    @PostMapping("/me/applications")
    org.springframework.http.ResponseEntity<ApplicationView> apply(
            @RequestBody java.util.Map<String, Object> body) {
        var candidates = customers.allByMobile(String.valueOf(body.getOrDefault("mobile", "")));
        if (candidates.isEmpty()) {
            throw new java.util.NoSuchElementException("No borrower with that registered mobile");
        }
        var c = candidates.get(0);
        String productCode = String.valueOf(body.get("productCode"));
        var product = products.active(productCode);
        long amountMinor = ((Number) body.get("amountMinor")).longValue();
        if (amountMinor < product.getMinAmountMinor() || amountMinor > product.getMaxAmountMinor()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY,
                    "amount outside " + productCode + " bounds");
        }
        int tenor = ((Number) body.getOrDefault("tenorMonths", 24)).intValue();
        var incomeBoxed = body.get("incomeMinor");
        Long income = incomeBoxed instanceof Number n ? n.longValue() : null;
        var a = origination.createDraft("APP-P" + System.nanoTime() % 100_000,
                c.getId(), productCode, amountMinor, tenor,
                Application.RateType.FIXED, c.getBranchCode(), income, 0L,
                "customer:" + c.getCifNo());
        return org.springframework.http.ResponseEntity.status(
                org.springframework.http.HttpStatus.CREATED).body(ApplicationView.of(a));
    }

    /** R5 parity — portal document upload: the prototype/demo flow posts the
     *  client-side digest + metadata (no raw bytes); the row lands on the
     *  customer's newest application with a portal storage key. */
    @PostMapping("/me/documents")
    org.springframework.http.ResponseEntity<com.uslbd.ulms.origination.OriginationService.PortalDocumentView> upload(
            @RequestBody java.util.Map<String, Object> body) {
        var candidates = customers.allByMobile(String.valueOf(body.getOrDefault("mobile", "")));
        if (candidates.isEmpty()) {
            throw new java.util.NoSuchElementException("No borrower with that registered mobile");
        }
        var c = candidates.get(0);
        String docType = String.valueOf(body.getOrDefault("docType", ""));
        String sha = String.valueOf(body.getOrDefault("sha256", ""));
        if (docType.isBlank() || sha.length() != 64) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY,
                    "docType and 64-char sha256 required");
        }
        long sizeBytes = body.get("sizeBytes") instanceof Number n ? n.longValue() : 0L;
        var view = origination.recordPortalDocument(c.getId(), c.getCifNo(), docType, sha, sizeBytes);
        return org.springframework.http.ResponseEntity.status(
                org.springframework.http.HttpStatus.CREATED).body(view);
    }

    // ── R10 P-D: OTP issue/verify (login + payment confirmation) ────────────

    @PostMapping("/otp")
    org.springframework.http.ResponseEntity<PortalOtpService.Issued> issueOtp(
            @RequestBody java.util.Map<String, String> body) {
        var issued = otp.issue(body.get("mobile"),
                body.getOrDefault("purpose", "login"));
        return org.springframework.http.ResponseEntity.status(
                org.springframework.http.HttpStatus.ACCEPTED).body(issued);
    }

    @PostMapping("/otp/verify")
    java.util.Map<String, Object> verifyOtp(@RequestBody java.util.Map<String, String> body) {
        return java.util.Map.of("otpToken", otp.verify(body.get("mobile"), body.get("code")));
    }

    /** Initiate a payment → rail redirect URL (never card data, 08 B2).
     *  R10 P-D: with otp-required=true (UAT), the request must carry the
     *  consumed OTP token for the paying mobile (payment confirmation). */
    @PostMapping("/me/payments/initiate")
    IntentView initiate(@RequestBody InitiateRequest body,
                        @org.springframework.web.bind.annotation.RequestParam(
                                required = false) java.util.UUID otpToken,
                        @org.springframework.web.bind.annotation.RequestParam(
                                required = false) String mobile) {
        if (otpRequired) {
            if (otpToken == null || mobile == null) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.UNAUTHORIZED,
                        "payment confirmation OTP required (ulms.portal.otp-required)");
            }
            otp.assertConfirmed(otpToken, mobile);
        }
        var i = paymentService.initiateIntent(body.loanId(), body.amountMinor(),
                body.rail(), AuthPrincipal.actorOf());
        return new IntentView(i.getId(), i.getRail(), i.getRailUrl(), i.getStatus());
    }

    /** Own statement as JSON (spec parity: the OpenAPI contract documents
     *  both shapes; same own-CIF gate and paging as the CSV download). */
    @GetMapping("/me/loans/{loanId}/statement")
    Object myStatementJson(@PathVariable UUID loanId, @RequestParam String mobile) {
        assertOwnsLoan(mobile, loanId);                        // 08 B3: strictly own-CIF
        return servicing.statement(loanId, 1, 100, AuthPrincipal.actorOf());
    }

    /** Own statement as CSV download (08 B1 "statements & tax certificates download"). */
    @GetMapping("/me/loans/{loanId}/statement.csv")
    org.springframework.http.ResponseEntity<String> myStatement(@PathVariable UUID loanId,
                                                               @RequestParam String mobile) {
        assertOwnsLoan(mobile, loanId);                        // 08 B3: strictly own-CIF
        var stmt = servicing.statement(loanId, 1, 100, AuthPrincipal.actorOf());
        return org.springframework.http.ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.parseMediaType("text/csv"))
                .header("Content-Disposition",
                        "attachment; filename=statement-" + stmt.loanNo() + ".csv")
                .body(stmt.toCsv());
    }

    /**
     * 08 B3 security delta: row access strictly own-CIF. Portal callers
     * identify by registered mobile (shared mobiles resolve to the loan
     * holder, same as /me); a loan UUID outside that borrower's own loans is
     * a 404 (no existence oracle). Staff roles see everything.
     */
    private void assertOwnsLoan(String mobile, UUID loanId) {
        boolean staff = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_admin")
                        || a.getAuthority().equals("ROLE_branch-officer")
                        || a.getAuthority().equals("ROLE_collections"));
        if (staff) return;
        var candidates = customers.allByMobile(mobile);
        if (candidates.isEmpty()) {
            throw new java.util.NoSuchElementException("No borrower with that mobile");
        }
        boolean owns = candidates.stream()
                .flatMap(c -> loans.findAllByCustomerId(c.getId()).stream())
                .anyMatch(l -> l.getId().equals(loanId));
        if (!owns) {
            throw new java.util.NoSuchElementException("No such loan for this borrower");
        }
    }

    record PortalMe(String cifNo, String nameEn, String kycStatus, List<LoanCard> loans) {}
    record LoanCard(UUID loanId, String loanNo, long outstandingMinor, long emiMinor,
                    String nextDueOn, String classification) {}
    record TrackerRow(String appNo, String stage, long amountMinor, String createdAt) {}
    record PaymentLine(String paidAt, long amountMinor, String rail, String reference) {}
    record IntentView(UUID id, String rail, String railUrl, String status) {}
    record InitiateRequest(@jakarta.validation.constraints.NotNull UUID loanId,
                           @jakarta.validation.constraints.Positive long amountMinor,
                           @jakarta.validation.constraints.NotBlank String rail) {}
}

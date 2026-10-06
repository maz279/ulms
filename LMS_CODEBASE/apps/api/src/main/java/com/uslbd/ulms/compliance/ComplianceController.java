package com.uslbd.ulms.compliance;

import com.uslbd.ulms.platform.AuthPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

/** Compliance endpoints (03 mod-compliance): EOD trigger, board, calculator, alerts, provision JV. */
@RestController
@RequestMapping("/api/v1/compliance")
class ComplianceController {

    private final EodBatchService eod;
    private final ProvisionJvService provisionJv;

    ComplianceController(EodBatchService eod, ProvisionJvService provisionJv) {
        this.eod = eod; this.provisionJv = provisionJv;
    }

    /** Operator-triggered EOD (also scheduled 23:30 nightly). Body date optional (rerun). */
    @PostMapping("/eod/run")
    @PreAuthorize("hasAnyRole('compliance','admin')")
    Map<String, Object> run(@RequestBody(required = false) RunRequest body) {
        LocalDate date = body == null || body.date() == null ? LocalDate.now() : body.date();
        var result = eod.run(date, AuthPrincipal.actorOf());
        return Map.of("runDate", result.runDate().toString(),
                "loansClassified", result.loansClassified(),
                "totalOutstandingMinor", result.totalOutstandingMinor(),
                "totalProvisionMinor", result.totalProvisionMinor(),
                "provisionsByClass", result.provisionsByClass());
    }

    /** Classification board (03): latest run + portfolio + open alerts. */
    @GetMapping("/classification")
    @PreAuthorize("hasAnyRole('compliance','credit-analyst','branch-manager','admin')")
    Map<String, Object> board() { return eod.board(); }

    /** Provision calculator — the policy oracle shared with the frontend (03). */
    @GetMapping("/provision-calculator")
    Map<String, Object> calculator(@RequestParam String classification,
                                   @RequestParam long outstandingMinor) {
        var result = BrpdClassifier.byName(classification);
        return Map.of("classification", result.classification(),
                "provisionRateBp", result.provisionRateBp(),
                "interestSuspense", result.interestSuspense(),
                "provisionMinor", result.provisionMinor(outstandingMinor));
    }

    @GetMapping("/alerts")
    @PreAuthorize("hasAnyRole('compliance','admin')")
    com.uslbd.ulms.platform.ApiList<AlertView> alerts() {
        return com.uslbd.ulms.platform.ApiList.of(eod.openAlerts().stream()
                .map(a -> new AlertView(a.getId(), a.getType(), a.getDetail(), a.getCreatedAt()))
                .toList());
    }

    record RunRequest(LocalDate date) {}
    record AlertView(java.util.UUID id, String type, String detail, java.time.Instant createdAt) {}

    /**
     * Post the EOD batch's provision total to the Fineract GL as a zero-sum JV
     * (03: "JV queue to Fineract GL"; prototype board's Provision JV button).
     * Idempotent per run-date; a drifted rerun total after posting → 409.
     */
    @PostMapping("/provision-jv")
    @PreAuthorize("hasAnyRole('compliance','admin')")
    Map<String, Object> postProvisionJv(@RequestBody(required = false) RunRequest body) {
        LocalDate date = body == null || body.date() == null ? LocalDate.now() : body.date();
        var jv = provisionJv.post(date, AuthPrincipal.actorOf());
        return Map.of("id", jv.getId().toString(), "runDate", jv.getRunDate().toString(),
                "totalMinor", jv.getTotalMinor(), "debitsMinor", jv.getDebitsMinor(),
                "creditsMinor", jv.getCreditsMinor(), "zeroSum", jv.isZeroSum(),
                "fineractTxnId", jv.getFineractTxnId(),
                "referenceNumber", jv.getReferenceNumber());
    }

    @GetMapping("/provision-jv")
    @PreAuthorize("hasAnyRole('compliance','credit-analyst','branch-manager','admin')")
    java.util.List<ProvisionJv> provisionJvs() { return provisionJv.latest(); }
}

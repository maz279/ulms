package com.uslbd.ulms.compliance;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Basel + regcon ops API (R10 P-F): CAR inputs for the compliance desk and
 * the operator trigger for the nightly transmission/reconciliation pass
 * (mirrors POST /compliance/eod/run for drills — RB-11 parity).
 */
@RestController
@RequestMapping("/api/v1/compliance")
class BaselOpsController {

    private final BaselService basel;
    private final RegconOpsService regconOps;
    private final BaselParallelRunService parallel;   // Q3.7 harness

    BaselOpsController(BaselService basel, RegconOpsService regconOps,
                       BaselParallelRunService parallel) {
        this.basel = basel; this.regconOps = regconOps; this.parallel = parallel;
    }

    /** RWA summary + CAR inputs + single-borrower breaches (SCH-BR feed). */
    @GetMapping("/basel/summary")
    @PreAuthorize("hasAnyRole('compliance','admin')")
    Map<String, Object> summary() {
        var m = new java.util.LinkedHashMap<String, Object>(basel.rwaSummary());
        m.put("largeExposureBreaches", basel.largeExposureBreaches());
        m.put("rwaBySegment", basel.rwaBySegment());
        m.put("leverageRatioBp", basel.leverageRatioBp());
        return m;
    }

    // ── Q3.7: Basel parallel-run harness ─────────────────────────────────────

    @PostMapping("/basel/parallel/snapshot")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('compliance','admin')")
    java.util.Map<String, Object> snapshot(@RequestParam String period,
                                           org.springframework.security.core.Authentication auth) {
        int n = parallel.snapshotUmlsValues(period, com.uslbd.ulms.platform.AuthPrincipal.actorOf(auth));
        return java.util.Map.of("period", period, "metricsSnapshotted", n);
    }

    @PostMapping("/basel/parallel/bank-value")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('compliance','admin')")
    BaselParallelRun bankValue(@RequestParam String period, @RequestParam String metric,
                               @RequestBody java.util.Map<String, String> body,
                               org.springframework.security.core.Authentication auth) {
        return parallel.recordBankValue(period, metric, body.get("bankValue"),
                body.get("varianceNote"), com.uslbd.ulms.platform.AuthPrincipal.actorOf(auth));
    }

    @GetMapping(value = "/basel/parallel/report", produces = "text/markdown")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('compliance','admin')")
    String report(@org.springframework.web.bind.annotation.RequestParam(
            required = false) String period) {
        return parallel.report(period);
    }

    /** Operator trigger for the regcon transmission + reconciliation pass. */
    @PostMapping("/regcon/push")
    @PreAuthorize("hasAnyRole('compliance','admin')")
    Map<String, Object> pushRegcon(Authentication auth) {
        int transmitted = regconOps.runOnce(java.time.LocalDate.now());
        return Map.of("transmitted", transmitted);
    }
}

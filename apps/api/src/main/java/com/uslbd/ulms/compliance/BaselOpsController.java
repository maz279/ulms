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

    BaselOpsController(BaselService basel, RegconOpsService regconOps) {
        this.basel = basel; this.regconOps = regconOps;
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

    /** Operator trigger for the regcon transmission + reconciliation pass. */
    @PostMapping("/regcon/push")
    @PreAuthorize("hasAnyRole('compliance','admin')")
    Map<String, Object> pushRegcon(Authentication auth) {
        int transmitted = regconOps.runOnce(java.time.LocalDate.now());
        return Map.of("transmitted", transmitted);
    }
}

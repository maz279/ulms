package com.uslbd.ulms.servicing;

import com.uslbd.ulms.platform.AuthPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Servicing operations API (R10 P-E): BLR administration and the two
 * loan-modification flows. Moratorium/top-up are officer actions on running
 * loans — both audit-referenced and event-emitting in the service; BLR
 * re-pricing is a treasury (admin) action that fans out to every FLOATING
 * loan.
 */
@RestController
@RequestMapping("/api/v1/servicing")
class ServicingOpsController {

    private final FloatingRateService floating;

    ServicingOpsController(FloatingRateService floating) {
        this.floating = floating;
    }

    /** Current active BLR (bp) — the floating-rate anchor. */
    @GetMapping("/blr")
    Map<String, Object> blr() {
        return Map.of("rateBp", floating.currentBlrBp());
    }

    /** Apply a new BLR — re-prices every FLOATING loan (RATE_REPRICED events). */
    @PostMapping("/blr")
    @PreAuthorize("hasRole('admin')")
    FloatingRateService.RepriceResult applyBlr(@RequestBody Map<String, Object> body,
                                               Authentication auth) {
        if (!(body.get("rateBp") instanceof Number n)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_ENTITY, "rateBp (positive bp) required");
        }
        return floating.applyBlr(n.intValue(), AuthPrincipal.actorOf(auth));
    }

    /** Moratorium 1–12 months: paused interest capitalizes into outstanding. */
    @PostMapping("/loans/{loanId}/moratorium")
    @PreAuthorize("hasAnyRole('collections','compliance','admin')")
    Loan moratorium(@PathVariable UUID loanId,
                    @RequestBody Map<String, Object> body, Authentication auth) {
        if (!(body.get("months") instanceof Number n)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_ENTITY, "months (1–12) required");
        }
        return floating.grantMoratorium(loanId, n.intValue(), AuthPrincipal.actorOf(auth));
    }

    /** Top-up: additional exposure on a running loan (combined schedule regenerates). */
    @PostMapping("/loans/{loanId}/top-up")
    @PreAuthorize("hasAnyRole('branch-manager','regional-manager','ho-credit','admin')")
    Loan topUp(@PathVariable UUID loanId,
               @RequestBody Map<String, Object> body, Authentication auth) {
        if (!(body.get("amountMinor") instanceof Number n)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_ENTITY, "amountMinor (positive) required");
        }
        return floating.topUp(loanId, n.longValue(), AuthPrincipal.actorOf(auth));
    }
}

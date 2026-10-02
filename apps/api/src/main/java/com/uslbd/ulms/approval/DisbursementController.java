package com.uslbd.ulms.approval;

import com.uslbd.ulms.platform.AuthPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * Disbursement dual authorization (03 mod-approval): PREPARED → AUTHORIZED
 * (a DIFFERENT officer) → RELEASED (executes Fineract approve+disburse,
 * creates the loan mirror, moves the application to DISBURSED, raises the
 * BFIU STR cash-threshold alert ≥ ৳10L). The acting officer is ALWAYS the
 * JWT subject — dual-authorization identities come from tokens, not bodies.
 */
@RestController
@RequestMapping("/api/v1/disbursements")
class DisbursementController {

    private final DisbursementService service;

    DisbursementController(DisbursementService service) { this.service = service; }

    @PostMapping("/{applicationId}/prepare")
    @PreAuthorize("hasAnyRole('branch-officer','branch-manager','admin')")
    DisbursementView prepare(@PathVariable UUID applicationId) {
        var d = service.prepare(applicationId, AuthPrincipal.actorOf());
        return DisbursementView.of(d, service.trail(d.getId()));
    }

    @PostMapping("/{id}/authorize")
    @PreAuthorize("hasAnyRole('branch-manager','regional-manager','ho-credit','admin')")
    DisbursementView authorize(@PathVariable UUID id) {
        return DisbursementView.of(service.authorize(id, AuthPrincipal.actorOf()), service.trail(id));
    }

    @PostMapping("/{id}/release")
    @PreAuthorize("hasAnyRole('branch-officer','branch-manager','admin')")
    DisbursementView release(@PathVariable UUID id) {
        return DisbursementView.of(service.release(id, AuthPrincipal.actorOf()), service.trail(id));
    }

    @GetMapping("/{id}")
    DisbursementView get(@PathVariable UUID id) {
        return service.find(id).map(d -> DisbursementView.of(d, service.trail(id)))
                .orElseThrow(() -> new NoSuchElementException("No disbursement " + id));
    }

    @GetMapping("/application/{applicationId}")
    DisbursementView byApplication(@PathVariable UUID applicationId) {
        return service.findByApplication(applicationId)
                .map(d -> DisbursementView.of(d, service.trail(d.getId())))
                .orElseThrow(() -> new NoSuchElementException("No disbursement for " + applicationId));
    }

    record DisbursementView(UUID id, UUID applicationId, long amountMinor, String state,
                            String preparedBy, String authorizedBy, Long fineractTxnId,
                            List<AuthLine> trail) {
        record AuthLine(String action, String actor, java.time.Instant actedAt) {}
        static DisbursementView of(Disbursement d, List<DualAuthorization> trail) {
            return new DisbursementView(d.getId(), d.getApplicationId(), d.getAmountMinor(),
                    d.getState(), d.getPreparedBy(), d.getAuthorizedBy(), d.getFineractTxnId(),
                    trail.stream().map(t -> new AuthLine(t.getAction(), t.getActor(), t.getActedAt()))
                            .toList());
        }
    }
}

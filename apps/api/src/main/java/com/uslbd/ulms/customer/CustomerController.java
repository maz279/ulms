package com.uslbd.ulms.customer;

import com.uslbd.ulms.platform.AuthPrincipal;
import com.uslbd.ulms.platform.idempotency.IdempotencyService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.UUID;

/**
 * Customer endpoints (PLANNING/03 mod-customer, conventions 05). Mutating
 * routes are role-gated (06 §1) and the audit actor is ALWAYS the JWT sub —
 * a client-supplied actor string is never trusted.
 */
@RestController
@RequestMapping("/api/v1/customers")
class CustomerController {

    private final CustomerService service;
    private final IdempotencyService idempotency;

    CustomerController(CustomerService service, IdempotencyService idempotency) {
        this.service = service; this.idempotency = idempotency;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('branch-officer','admin')")
    ResponseEntity<String> create(@RequestHeader("Idempotency-Key") UUID idempotencyKey,
                                  @Valid @RequestBody CustomerCreateRequest req,
                                  Authentication auth) {
        var replay = idempotency.replayOf(idempotencyKey, "POST /customers", req);
        if (replay.isPresent()) {
            return ResponseEntity.status(replay.get().statusCode())
                    .header("Idempotent-Replay", "true")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(replay.get().responseBody());
        }
        Customer c = service.create(req, idempotencyKey, AuthPrincipal.actorOf(auth),
                AuthPrincipal.requestIdOf(auth));
        var view = CustomerView.of(c);
        idempotency.record(idempotencyKey, "POST /customers", req, 201, view);
        return ResponseEntity
                .created(URI.create("/api/v1/customers/" + c.getId()))
                .contentType(MediaType.APPLICATION_JSON)
                .body(write(view));
    }

    @GetMapping
    CustomerPageView list(@RequestParam(defaultValue = "1") int page,
                          @RequestParam(defaultValue = "25") int size,
                          @org.springframework.beans.factory.annotation.Value(
                                  "${ulms.branch-scope-required:true}") boolean branchScopeRequired) {
        // P5 audit F4: branch-scoped roles see only their branch (06 §1)
        return service.list(page, Math.min(size, 100),
                com.uslbd.ulms.platform.AuthPrincipal.requireBranchFor(branchScopeRequired));
    }

    /** NIDW e-KYC refresh (03 `kyc-refresh`): mock port in P1; history in kyc_check. */
    @PostMapping("/{id}/kyc-refresh")
    @PreAuthorize("hasAnyRole('branch-officer','admin')")
    ResponseEntity<CustomerView> refreshKyc(@PathVariable UUID id,
                                            @RequestBody KycVerifyRequest body) {
        Customer c = service.verifyKyc(id, body.nid(), body.dob(), AuthPrincipal.actorOf());
        return ResponseEntity.ok(CustomerView.of(c));
    }

    /** Sanctions/PEP screening hook (06 §8 P1) — hits persist, none block yet. */
    @PostMapping("/{id}/screen")
    @PreAuthorize("hasAnyRole('branch-officer','compliance','admin')")
    ResponseEntity<ScreeningView> screen(@PathVariable UUID id) {
        var hits = service.screen(id, AuthPrincipal.actorOf());
        return ResponseEntity.ok(ScreeningView.of(id, hits));
    }

    record KycVerifyRequest(String nid, java.time.LocalDate dob) {}
    record ScreeningHitView(String listName, String matchedName, java.time.Instant checkedAt) {}
    record ScreeningView(UUID customerId, boolean clear, java.util.List<ScreeningHitView> hits) {
        static ScreeningView of(UUID customerId, java.util.List<ScreeningHit> rows) {
            return new ScreeningView(customerId, rows.isEmpty(),
                    rows.stream().map(h -> new ScreeningHitView(
                            h.getListName(), h.getMatchedName(), h.getCheckedAt())).toList());
        }
    }

    private String write(Object view) {
        return IdempotencyService.toJson(view);
    }
}

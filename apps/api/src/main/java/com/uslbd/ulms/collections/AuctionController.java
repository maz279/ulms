package com.uslbd.ulms.collections;

import com.uslbd.ulms.platform.ApiList;
import com.uslbd.ulms.platform.AuthPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Collateral auction/disposal ledger (Q1.5, ULS-01 §6.3): schedule →
 * held → sold/unsold on written-off loans. Selling cuts a RecoveryEntry
 * (mode AUCTION, 5% incentive) — the gate test pins that link.
 */
@RestController
@RequestMapping("/api/v1/collections/auctions")
class AuctionController {

    private final AuctionService service;

    AuctionController(AuctionService service) { this.service = service; }

    @GetMapping
    @PreAuthorize("hasAnyRole('collections','compliance','admin')")
    ApiList<AuctionEntry> list(@RequestParam(required = false) String status,
                               @RequestParam(required = false) UUID loanId) {
        return ApiList.of(service.list(status, loanId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('collections','admin')")
    AuctionEntry schedule(@RequestBody ScheduleRequest body, Authentication auth) {
        return service.schedule(body.loanId(), body.collateralRef(), body.venue(),
                body.scheduledFor(), body.reserveMinor(), AuthPrincipal.actorOf(auth));
    }

    @PostMapping("/{id}/held")
    @PreAuthorize("hasAnyRole('collections','admin')")
    AuctionEntry held(@PathVariable UUID id, Authentication auth) {
        return service.markHeld(id, AuthPrincipal.actorOf(auth));
    }

    @PostMapping("/{id}/sold")
    @PreAuthorize("hasAnyRole('collections','compliance','admin')")
    AuctionEntry sold(@PathVariable UUID id, @RequestBody SoldRequest body,
                      Authentication auth) {
        return service.markSold(id, body.proceedsMinor(), body.buyer(),
                AuthPrincipal.actorOf(auth));
    }

    @PostMapping("/{id}/unsold")
    @PreAuthorize("hasAnyRole('collections','compliance','admin')")
    AuctionEntry unsold(@PathVariable UUID id, Authentication auth) {
        return service.markUnsold(id, AuthPrincipal.actorOf(auth));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('collections','admin')")
    AuctionEntry cancel(@PathVariable UUID id, Authentication auth) {
        return service.cancel(id, AuthPrincipal.actorOf(auth));
    }

    record ScheduleRequest(UUID loanId, String collateralRef, String venue,
                           Instant scheduledFor, long reserveMinor) {}
    record SoldRequest(long proceedsMinor, String buyer) {}
}

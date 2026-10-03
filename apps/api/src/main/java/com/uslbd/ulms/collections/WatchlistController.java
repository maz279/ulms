package com.uslbd.ulms.collections;

import com.uslbd.ulms.platform.ApiList;
import com.uslbd.ulms.platform.AuthPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Collections early-warning watchlist (Q1.4, PLAN-03 mod-collections):
 * officer adds with reason codes + review cadence, clearing with evidence,
 * and the nightly-scan feed. Collections/compliance work the list; the
 * graduated-dunning trigger reads it via the service.
 */
@RestController
@RequestMapping("/api/v1/collections/watchlist")
class WatchlistController {

    private final WatchlistService service;

    WatchlistController(WatchlistService service) { this.service = service; }

    /** The working list — OPEN (default), CLEARED, or ALL. */
    @GetMapping
    @PreAuthorize("hasAnyRole('collections','compliance','admin')")
    ApiList<WatchlistEntry> list(@RequestParam(required = false) String status) {
        return ApiList.of(service.list(status));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('collections','compliance','admin')")
    WatchlistEntry add(@RequestBody AddRequest body, Authentication auth) {
        return service.add(body.loanId(), body.reasonCode(), body.note(),
                body.reviewWithinDays(), AuthPrincipal.actorOf(auth));
    }

    /** Terminal clear — a re-offending loan enters as a fresh row. */
    @PostMapping("/{id}/clear")
    @PreAuthorize("hasAnyRole('collections','compliance','admin')")
    WatchlistEntry clear(@PathVariable UUID id, @RequestBody ClearRequest body,
                         Authentication auth) {
        return service.clear(id, body.note(), AuthPrincipal.actorOf(auth));
    }

    record AddRequest(UUID loanId, String reasonCode, String note, Integer reviewWithinDays) {}
    record ClearRequest(String note) {}
}

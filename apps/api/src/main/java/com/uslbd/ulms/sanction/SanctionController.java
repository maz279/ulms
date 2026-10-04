package com.uslbd.ulms.sanction;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/** Sanction letters API (R3, OpenAPI §sanctions). */
@RestController
@RequestMapping("/api/v1/sanctions")
class SanctionController {

    private final SanctionService service;

    SanctionController(SanctionService service) { this.service = service; }

    @PostMapping("/{applicationId}/generate")
    @PreAuthorize("hasAnyRole('branch-manager','regional-manager','divisional-head','ho-credit','credit-committee','md','admin')")
    ResponseEntity<SanctionLetter> generate(@PathVariable UUID applicationId, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).contentType(MediaType.APPLICATION_JSON)
                .body(service.generate(applicationId, com.uslbd.ulms.platform.AuthPrincipal.actorOf(auth)));
    }

    @PostMapping("/{id}/resend")
    org.springframework.http.ResponseEntity<SanctionLetter> resend(@PathVariable UUID id,
                                                                   org.springframework.security.core.Authentication auth) {
        return org.springframework.http.ResponseEntity.ok()
                .body(service.resend(id, com.uslbd.ulms.platform.AuthPrincipal.actorOf(auth)));
    }

    /** Letters register (R3 parity: the mock + OpenAPI spec shipped this list
     *  from day one — newest first, optional per-application filter). */
    @GetMapping
    com.uslbd.ulms.platform.ApiList<SanctionLetter> list(
            @RequestParam(required = false) UUID applicationId) {
        return com.uslbd.ulms.platform.ApiList.of(service.list(applicationId));
    }

    @GetMapping("/{id}")
    SanctionLetter get(@PathVariable UUID id) { return service.get(id); }

    @PostMapping("/{id}/accept")
    ResponseEntity<SanctionLetter> accept(@PathVariable UUID id, @RequestParam String token) {
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(service.accept(id, token));
    }
}

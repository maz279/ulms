package com.uslbd.ulms.collections;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/** Write-off / recovery API (R4, OpenAPI §write-offs). */
@RestController
class WriteOffController {

    private final WriteOffService service;

    WriteOffController(WriteOffService service) { this.service = service; }

    record ProposeRequest(String reason) {}
    record RecoveryRequest(Long amountMinor, String mode) {}

    @GetMapping("/api/v1/write-offs")
    java.util.List<WriteOff> register() { return service.register(); }

    @PostMapping("/api/v1/collections/{loanId}/write-off")
    @PreAuthorize("hasAnyRole('collections','compliance','admin')")
    ResponseEntity<WriteOff> propose(@PathVariable UUID loanId, @RequestBody ProposeRequest req,
                                     Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).contentType(MediaType.APPLICATION_JSON)
                .body(service.propose(loanId, req.reason(), com.uslbd.ulms.platform.AuthPrincipal.actorOf(auth)));
    }

    @PostMapping("/api/v1/write-offs/{id}/approve")
    @PreAuthorize("hasAnyRole('compliance','admin','md')")
    WriteOff approve(@PathVariable UUID id, Authentication auth) {
        return service.approve(id, com.uslbd.ulms.platform.AuthPrincipal.actorOf(auth));
    }

    @PostMapping("/api/v1/write-offs/{id}/reverse")
    @PreAuthorize("hasAnyRole('compliance','admin','md')")
    WriteOff reverse(@PathVariable UUID id, Authentication auth) {
        return service.reverse(id, com.uslbd.ulms.platform.AuthPrincipal.actorOf(auth));
    }

    @GetMapping("/api/v1/collections/{loanId}/recoveries")
    Object recoveries(@PathVariable UUID loanId) {
        return Map.of("data", service.recoveriesOf(loanId));
    }

    @PostMapping("/api/v1/collections/{loanId}/recoveries")
    @PreAuthorize("hasAnyRole('collections','admin')")
    ResponseEntity<RecoveryEntry> record(@PathVariable UUID loanId, @RequestBody RecoveryRequest req,
                                         Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).contentType(MediaType.APPLICATION_JSON)
                .body(service.recordRecovery(loanId, req.amountMinor(), req.mode() == null ? "CASH" : req.mode(),
                        com.uslbd.ulms.platform.AuthPrincipal.actorOf(auth)));
    }
}

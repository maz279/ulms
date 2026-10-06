package com.uslbd.ulms.partner;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/** Partner API (R5, OpenAPI §partner) — X-Api-Key identified, idempotent. */
@RestController
@RequestMapping("/api/v1/partner")
class PartnerController {

    private final PartnerService service;

    PartnerController(PartnerService service) { this.service = service; }

    @PostMapping("/applications")
    ResponseEntity<PartnerService.IntakeResult> intake(
            @RequestHeader(value = "X-Api-Key", required = false) String apiKey,
            @RequestHeader(value = "Idempotency-Key", required = false) UUID idempotencyKey,
            @RequestBody PartnerService.IntakeRequest req) {
        // note: authenticate() throws the 401 before any body processing
        var out = service.intake(apiKey, idempotencyKey, req);
        return ResponseEntity.status(HttpStatus.CREATED).contentType(MediaType.APPLICATION_JSON).body(out);
    }

    @GetMapping("/applications/{id}/status")
    ResponseEntity<PartnerService.IntakeResult> status(
            @RequestHeader(value = "X-Api-Key", required = false) String apiKey,
            @PathVariable UUID id) {
        service.authenticate(apiKey);            // identity gate even for reads
        var a = service.statusOf(id);
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(a);
    }
}

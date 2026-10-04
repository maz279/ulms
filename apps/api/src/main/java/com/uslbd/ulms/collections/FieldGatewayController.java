package com.uslbd.ulms.collections;

import com.fasterxml.jackson.databind.JsonNode;
import com.uslbd.ulms.platform.ApiList;
import com.uslbd.ulms.platform.AuthPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Mobile field-app API (PLANNING/08 §A5). Dedicated to the Expo CPV/collections
 * app — the same contract is documented in OpenAPI and mirrored by the mock so
 * the app is testable offline-first. Roles: field work is collections +
 * branch-officer territory (06 §1).
 */
@RestController
@RequestMapping("/api/v1/field")
class FieldGatewayController {

    private final FieldGatewayService service;

    FieldGatewayController(FieldGatewayService service) { this.service = service; }

    /** Delta task pull for the signed-in officer (?since=ISO-instant, null = full). */
    @GetMapping("/tasks")
    @PreAuthorize("hasAnyRole('collections','branch-officer','admin')")
    Map<String, Object> tasks(@RequestParam(required = false) Instant since,
                              Authentication auth) {
        return service.tasksFor(AuthPrincipal.actorOf(auth), since);
    }

    /** Idempotent visit intake — clientUuid is the mobile op id. */
    @PostMapping("/visits")
    @PreAuthorize("hasAnyRole('collections','branch-officer','admin')")
    ResponseEntity<Map<String, Object>> visit(@RequestBody VisitRequest body,
                                              Authentication auth) {
        if (body.clientUuid() == null || body.clientUuid().isBlank()) {
            throw new IllegalArgumentException("clientUuid is required (idempotency key)");
        }
        var result = service.visit(body.clientUuid().trim(), body.taskId(), body.loanId(),
                body.outcome(), body.evidence(), AuthPrincipal.actorOf(auth));
        FieldVisit v = result.visit();
        boolean applied = !result.replayed() && v.isApplied();
        return ResponseEntity.status(result.replayed() ? HttpStatus.OK : HttpStatus.CREATED)
                .body(Map.of("id", v.getId(), "clientUuid", v.getClientUuid(),
                        "applied", applied, "outcome", v.getOutcome(),
                        "replayed", result.replayed()));
    }

    /** PTP captured in the field. */
    @PostMapping("/ptp")
    @PreAuthorize("hasAnyRole('collections','branch-officer','admin')")
    Ptp ptp(@RequestBody PtpRequest body, Authentication auth) {
        return service.ptp(body.loanId(), body.promisedAmountMinor(), body.promisedOn(),
                body.confidence() == null ? "MEDIUM" : body.confidence(),
                body.contactName(), body.contactRelation(), body.contactPhone(),
                body.remark(), AuthPrincipal.actorOf(auth));
    }

    /** One-tap SOS — durable alert + security workflow + SMS via outbox. */
    @PostMapping("/sos")
    @PreAuthorize("hasAnyRole('collections','branch-officer','admin')")
    ResponseEntity<SosAlert> sos(@RequestBody SosRequest body, Authentication auth) {
        SosAlert a = service.sos(body.loanId(), body.lat(), body.lng(), body.note(),
                AuthPrincipal.actorOf(auth));
        return ResponseEntity.status(HttpStatus.CREATED).body(a);
    }

    /** Security desk: acknowledge an open alert. */
    @PostMapping("/sos/{id}/ack")
    @PreAuthorize("hasAnyRole('collections','compliance','admin')")
    SosAlert ack(@PathVariable UUID id, Authentication auth) {
        return service.acknowledgeSos(id, AuthPrincipal.actorOf(auth));
    }

    /** Security desk feed. */
    @GetMapping("/sos")
    @PreAuthorize("hasAnyRole('collections','compliance','admin')")
    ApiList<SosAlert> openSos() {
        return ApiList.of(service.openSos());
    }

    record VisitRequest(String clientUuid, UUID taskId, UUID loanId, String outcome,
                        JsonNode evidence) {}
    record PtpRequest(UUID loanId, long promisedAmountMinor, LocalDate promisedOn,
                      String confidence, String contactName, String contactRelation,
                      String contactPhone, String remark) {}
    record SosRequest(UUID loanId, Double lat, Double lng, String note) {}
}

package com.uslbd.ulms.bocc;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** BOCC API (R3, OpenAPI §bocc). */
@RestController
@RequestMapping("/api/v1/bocc/meetings")
class BoccController {

    private final BoccService service;

    BoccController(BoccService service) { this.service = service; }

    record ScheduleRequest(String branchCode, LocalDate date, List<String> members) {}
    record AttendanceRequest(String member) {}
    record VoteRequest(UUID caseId, String member, String vote, String dissent) {}

    @GetMapping
    List<BoccMeeting> list() { return service.list(); }

    @PostMapping
    @PreAuthorize("hasAnyRole('branch-manager','admin')")
    ResponseEntity<BoccMeeting> schedule(@RequestBody ScheduleRequest req, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).contentType(MediaType.APPLICATION_JSON)
                .body(service.schedule(req.branchCode(),
                        req.date() == null ? LocalDate.now().plusDays(1) : req.date(),
                        req.members(), com.uslbd.ulms.platform.AuthPrincipal.actorOf(auth)));
    }

    @GetMapping("/{id}")
    BoccMeeting get(@PathVariable UUID id) { return service.get(id); }

    @PostMapping("/{id}/attendance")
    BoccMeeting attendance(@PathVariable UUID id, @RequestBody AttendanceRequest req) {
        return service.checkIn(id, req.member());
    }

    @PostMapping("/{id}/vote")
    BoccMeeting vote(@PathVariable UUID id, @RequestBody VoteRequest req) {
        BoccVote.Vote parsed;
        try {
            parsed = BoccVote.Vote.valueOf(req.vote());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNPROCESSABLE_ENTITY,
                    "vote must be APPROVE|REJECT|HOLD|DEFER");
        }
        return service.vote(id, req.caseId(), req.member(), parsed, req.dissent());
    }

    @PostMapping("/{id}/close")
    BoccMeeting close(@PathVariable UUID id, Authentication auth) {
        return service.close(id, com.uslbd.ulms.platform.AuthPrincipal.actorOf(auth));
    }
}

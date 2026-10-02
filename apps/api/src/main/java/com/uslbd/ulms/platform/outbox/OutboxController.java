package com.uslbd.ulms.platform.outbox;

import com.uslbd.ulms.platform.ApiList;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Outbox ops API (R3, OpenAPI §outbox — admin-only view + manual relay). */
@RestController
@RequestMapping("/api/v1/outbox")
class OutboxController {

    private final OutboxEventRepository events;
    private final OutboxService outbox;

    OutboxController(OutboxEventRepository events, OutboxService outbox) {
        this.events = events; this.outbox = outbox;
    }

    @GetMapping
    @PreAuthorize("hasRole('admin')")
    ApiList<OutboxEvent> list() {
        var recent = events.findAll(org.springframework.data.domain.PageRequest.of(0, 50))
                .getContent().reversed();
        return ApiList.of(recent.stream().toList());
    }

    @PostMapping("/relay")
    @PreAuthorize("hasRole('admin')")
    ResponseEntity<OutboxService.RelayResult> relay() {
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(outbox.relay());
    }
}

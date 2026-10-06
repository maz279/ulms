package com.uslbd.ulms.notification;

import com.uslbd.ulms.platform.ApiList;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Notifications API (R4, OpenAPI §notifications). */
@RestController
@RequestMapping("/api/v1/notifications")
class NotificationController {

    private final NotificationService service;

    NotificationController(NotificationService service) { this.service = service; }

    @GetMapping("/templates")
    ApiList<NotificationTemplate> templates() { return ApiList.of(service.templateList()); }

    record TemplateRequest(String type, String channel, String lang, String body) {}

    @PostMapping("/templates")
    @PreAuthorize("hasRole('admin')")
    ResponseEntity<NotificationTemplate> upsert(@RequestBody TemplateRequest req, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).contentType(MediaType.APPLICATION_JSON)
                .body(service.upsert(req.type(), req.channel() == null ? "SMS" : req.channel(),
                        req.lang() == null ? "en" : req.lang(), req.body(),
                        com.uslbd.ulms.platform.AuthPrincipal.actorOf(auth)));
    }

    @GetMapping("/outbox")
    ApiList<NotificationDelivery> outbox() { return ApiList.of(service.recentDeliveries()); }

    record SendRequest(String type, String cif, Long amountMinor) {}

    @PostMapping("/send")
    NotificationDelivery send(@RequestBody SendRequest req, Authentication auth) {
        return service.dispatch(req.type(), req.cif(),
                req.amountMinor() == null ? 0 : req.amountMinor(),
                com.uslbd.ulms.platform.AuthPrincipal.actorOf(auth));
    }
}

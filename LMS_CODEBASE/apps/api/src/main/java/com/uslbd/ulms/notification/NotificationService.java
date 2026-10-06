package com.uslbd.ulms.notification;

import com.uslbd.ulms.customer.CustomerRepository;
import com.uslbd.ulms.platform.audit.AuditService;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Notifications module (R4): template rendering + delivery log + an outbox
 * consumer that turns lifecycle events (APPLICATION_SUBMITTED, APPROVED,
 * DISBURSED, PAYMENT_POSTED, RECOVERY_RECEIVED…) into SMS deliveries —
 * idempotent by (type, cif, rendered body) per the relay contract.
 */
@Service
public class NotificationService {

    private final NotificationTemplateRepository templates;
    private final NotificationDeliveryRepository deliveries;
    private final CustomerRepository customers;
    private final AuditService audit;
    private final SmsDispatcher sms;

    // internal mapper — Boot 4 exposes no com.fasterxml ObjectMapper bean in
    // every context (see IdempotencyService for the same pattern)
    private final com.fasterxml.jackson.databind.ObjectMapper json =
            new com.fasterxml.jackson.databind.ObjectMapper();

    NotificationService(NotificationTemplateRepository templates,
                        NotificationDeliveryRepository deliveries,
                        CustomerRepository customers, AuditService audit,
                        SmsDispatcher sms) {
        this.templates = templates; this.deliveries = deliveries;
        this.customers = customers; this.audit = audit; this.sms = sms;
    }

    /** Outbox consumer bean — registered automatically with OutboxService. */
    @Bean
    com.uslbd.ulms.platform.outbox.OutboxService.Consumer lifecycleConsumer() {
        return new com.uslbd.ulms.platform.outbox.OutboxService.Consumer() {
            private static final List<String> LIFECYCLE = List.of(
                    "APPLICATION_SUBMITTED", "APPROVED", "DISBURSED",
                    "PAYMENT_POSTED", "RECOVERY_RECEIVED", "SANCTION_ISSUED",
                    "EMI_REMINDER", "RATE_REPRICED");

            @Override public boolean accepts(String type) { return LIFECYCLE.contains(type); }

            @Override @Transactional
            public void consume(com.uslbd.ulms.platform.outbox.OutboxEvent event) {
                var payload = parse(event.getPayload());
                String cif = String.valueOf(payload.get("cif"));
                long amount = payload.get("amountMinor") instanceof Number n ? n.longValue() : 0;
                dispatch(event.getType(), cif, amount, "outbox-relay");
            }
        };
    }

    private Map<String, Object> parse(String payload) {
        try {
            return json.readValue(payload, new com.fasterxml.jackson.core.type.TypeReference<>() {});
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalArgumentException("bad outbox payload", e);
        }
    }

    /** Render + record a delivery (idempotent for relay replays). */
    @Transactional
    public NotificationDelivery dispatch(String type, String cifNo, long amountMinor, String actor) {
        var tpl = templates.findByTypeAndChannelAndLang(type, "SMS", "en")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "no " + type + " SMS/en template"));
        var customer = customers.findByCifNo(cifNo).orElse(null);
        String name = customer == null ? "customer" : customer.getNameEn();
        String mobile = customer == null ? null : customer.getMobile();
        String body = tpl.render(name, amountMinor);
        if (deliveries.existsByTypeAndCifNoAndBody(type, cifNo, body)) {
            return deliveries.findTop50ByOrderByCreatedAtDesc().stream()
                    .filter(d -> type.equals(d.getType()) && cifNo.equals(d.getCifNo()) && body.equals(d.getBody()))
                    .findFirst().orElseThrow();
        }
        var d = NotificationDelivery.queued(UUID.randomUUID(), type, cifNo, mobile, "SMS", body);
        if (mobile != null) {
            try {
                sms.deliver(mobile, body);
                d.markDelivered();
            } catch (RuntimeException gatewayFailed) {
                // all providers in the chain failed — record FAILED, never drop
                d.markFailed();
            }
        } else {
            d.markFailed();   // no reachable mobile on file
        }
        deliveries.save(d);
        audit.record(actor, "NOTIF_SEND", "notification_delivery", d.getId(),
                "\"" + type + " SMS → " + (mobile == null ? "?" : mobile.substring(0, 8) + "…") + "\"",
                UUID.randomUUID());
        return d;
    }

    @Transactional(readOnly = true)
    public List<NotificationTemplate> templateList() { return templates.findAllByOrderByTypeAscLangAsc(); }

    @Transactional
    public NotificationTemplate upsert(String type, String channel, String lang, String body, String actor) {
        var t = templates.findByTypeAndChannelAndLang(type, channel, lang)
                .orElseGet(() -> NotificationTemplate.of(UUID.randomUUID(), type, channel, lang, body, actor));
        templates.save(t);
        audit.record(actor, "NOTIF_TEMPLATE", "notification_template", t.getId(),
                "\"" + type + "/" + lang + " upsert (maker-checker)\"", UUID.randomUUID());
        return t;
    }

    @Transactional(readOnly = true)
    public List<NotificationDelivery> recentDeliveries() { return deliveries.findTop50ByOrderByCreatedAtDesc(); }
}

package com.uslbd.ulms.platform.outbox;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Outbox writer + relay (ADR-004, R3). Writers emit in the caller's
 * transaction; the scheduled relay (or the manual ops trigger) drains
 * PENDING rows and fans them to registered consumers (notification
 * rendering rides R4's NotificationService). At-least-once delivery —
 * consumers are idempotent by (type, aggregateId).
 */
@Service
public class OutboxService {

    public interface Consumer {
        boolean accepts(String type);
        /** Idempotent by contract: duplicates must be no-ops. */
        void consume(OutboxEvent event);
    }

    private final OutboxEventRepository events;
    // self-contained mapper: the outbox must work in slim JPA test slices and
    // every module context, not just ones with Jackson auto-configuration
    private final com.fasterxml.jackson.databind.ObjectMapper json =
            new com.fasterxml.jackson.databind.ObjectMapper();
    private final List<Consumer> consumers;

    OutboxService(OutboxEventRepository events, List<Consumer> consumers) {
        this.events = events; this.consumers = consumers;
    }

    /** Writer — call inside the SAME transaction as the state change. */
    public OutboxEvent emit(String aggregate, UUID aggregateId, String type, Map<String, ?> payload) {
        try {
            return events.save(OutboxEvent.pending(UUID.randomUUID(), aggregate, aggregateId,
                    type, json.writeValueAsString(payload)));
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalArgumentException("outbox payload not serializable", e);
        }
    }

    /** Relay drain — @Scheduled in prod; POST /outbox/relay for ops drills. */
    @Scheduled(fixedDelayString = "${ulms.outbox.relay-ms:5000}")
    @Transactional
    public RelayResult relay() {
        int dispatched = 0, failed = 0;
        List<OutboxEvent> batch = events.findTop50ByDispatchedAtIsNullOrderByCreatedAtAsc();
        for (OutboxEvent e : batch) {
            try {
                for (Consumer c : consumers) {
                    if (c.accepts(e.getType())) c.consume(e);
                }
                e.markDispatched();
                dispatched++;
            } catch (Exception ex) {
                e.markFailed(String.valueOf(ex.getMessage()));
                failed++;
            }
        }
        return new RelayResult(dispatched, failed);
    }

    public record RelayResult(int dispatched, int failed) {}
}

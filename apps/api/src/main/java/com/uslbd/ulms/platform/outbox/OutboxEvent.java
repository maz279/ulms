package com.uslbd.ulms.platform.outbox;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

/**
 * Transactional outbox row (ADR-004; table since V1). Written in the SAME
 * transaction as the state change; the relay drains PENDING rows and fans
 * out (notifications + audit) with at-least-once + idempotent consumers.
 */
@Entity
@Table(name = "outbox_event", schema = "ulms")
public class OutboxEvent {

    @Id private UUID id;
    @Column(nullable = false, length = 40) private String aggregate;
    @Column(name = "aggregate_id", nullable = false) private UUID aggregateId;
    @Column(nullable = false, length = 60) private String type;
    // SqlTypes.JSON binds the String through PG's jsonb instead of varchar
    // (plain columnDefinition only affects DDL, not the insert's JDBC type)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb") private String payload;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();
    @Column(name = "dispatched_at") private Instant dispatchedAt;
    @Column(name = "attempts", nullable = false) private int attempts;
    @Column(name = "last_error", columnDefinition = "text") private String lastError;

    protected OutboxEvent() {}

    public static OutboxEvent pending(UUID id, String aggregate, UUID aggregateId,
                                      String type, String payloadJson) {
        OutboxEvent e = new OutboxEvent();
        e.id = id; e.aggregate = aggregate; e.aggregateId = aggregateId;
        e.type = type; e.payload = payloadJson;
        return e;
    }

    boolean isPending() { return dispatchedAt == null; }
    void markDispatched() { this.dispatchedAt = Instant.now(); }
    void markFailed(String error) { this.attempts++; this.lastError = error; }

    public UUID getId() { return id; }
    public String getAggregate() { return aggregate; }
    public UUID getAggregateId() { return aggregateId; }
    public String getType() { return type; }
    public String getPayload() { return payload; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getDispatchedAt() { return dispatchedAt; }
    public int getAttempts() { return attempts; }
}

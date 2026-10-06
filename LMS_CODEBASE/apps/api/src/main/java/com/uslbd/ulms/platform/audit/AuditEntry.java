package com.uslbd.ulms.platform.audit;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Append-only audit row (PLANNING/06 §3). Hash chain: hash(prev.hash + payload)
 * computed in AuditService before insert — tamper-evident; daily anchor exported
 * WORM. This entity is written by AuditService only; no code path may update it.
 */
@Entity
@Table(name = "audit_entry", schema = "ulms", indexes = @Index(name = "idx_audit_aggregate", columnList = "aggregate,aggregateId,at"))
public class AuditEntry {

    @Id @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(nullable = false, updatable = false, length = 64)
    private String actor;          // keycloak sub or "service:<name>"

    @Column(nullable = false, updatable = false, length = 60)
    private String action;         // e.g. CUSTOMER_CREATED

    @Column(nullable = false, updatable = false, length = 40)
    private String aggregate;

    @Column(name = "aggregate_id", nullable = false, updatable = false)
    private UUID aggregateId;

    @jakarta.persistence.Lob
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(nullable = false, updatable = false, columnDefinition = "jsonb")
    private String payload;        // PII-masked before/after JSON

    @Column(nullable = false, updatable = false)
    private String hash;           // sha256(prevHash + payload)

    @Column(nullable = false, updatable = false)
    private Instant at;

    @Column(name = "request_id", updatable = false)
    private UUID requestId;

    @Column(name = "source_ip", updatable = false, length = 45)
    private String sourceIp;       // 06 §3 — request-thread IP; null on scheduled jobs

    protected AuditEntry() {}

    static AuditEntry of(UUID id, String actor, String action, String aggregate,
                         UUID aggregateId, String payload, String hash, Instant at,
                         UUID requestId, String sourceIp) {
        AuditEntry e = new AuditEntry();
        e.id = id; e.actor = actor; e.action = action; e.aggregate = aggregate;
        e.aggregateId = aggregateId; e.payload = payload; e.hash = hash;
        e.at = at; e.requestId = requestId; e.sourceIp = sourceIp;
        return e;
    }

    public UUID getId() { return id; }
    public String getActor() { return actor; }
    public String getAction() { return action; }
    public String getAggregate() { return aggregate; }
    public UUID getAggregateId() { return aggregateId; }
    public String getPayload() { return payload; }
    public String getHash() { return hash; }
    public String getSourceIp() { return sourceIp; }
    public Instant getAt() { return at; }
    public UUID getRequestId() { return requestId; }
}

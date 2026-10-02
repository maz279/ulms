package com.uslbd.ulms.compliance;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

/** Compliance worklist row — STR cash-threshold hooks etc. (06 §4, 03). */
@Entity
@Table(name = "compliance_alert", schema = "ulms")
public class ComplianceAlert {

    @Id @Column(nullable = false, updatable = false) private UUID id;
    @Column(nullable = false, length = 24) private String type;   // STR_CASH_THRESHOLD | CIB_PULL_FAILED
    @Column(length = 40) private String aggregate;
    @Column(name = "aggregate_id") private UUID aggregateId;
    @JdbcTypeCode(SqlTypes.JSON) @Column(nullable = false, columnDefinition = "jsonb")
    private String detail;
    @Column(nullable = false, length = 10) private String state = "OPEN";
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    protected ComplianceAlert() {}

    public static ComplianceAlert open(UUID id, String type, String aggregate,
                                       UUID aggregateId, String detailJson) {
        ComplianceAlert a = new ComplianceAlert();
        a.id = id; a.type = type; a.aggregate = aggregate; a.aggregateId = aggregateId;
        a.detail = detailJson;
        return a;
    }

    void resolve() { this.state = "RESOLVED"; }

    public UUID getId() { return id; }
    public String getType() { return type; }
    public String getAggregate() { return aggregate; }
    public UUID getAggregateId() { return aggregateId; }
    public String getDetail() { return detail; }
    public String getState() { return state; }
    public Instant getCreatedAt() { return createdAt; }
}

package com.uslbd.ulms.approval;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/** Immutable actor log per disbursement step (03: "every action audit-logged with maker/checker ids"). */
@Entity
@Table(name = "dual_authorization", schema = "ulms",
       indexes = @Index(name = "idx_dualauth_disb", columnList = "disbursement_id"))
public class DualAuthorization {

    @Id @Column(nullable = false, updatable = false) private UUID id;
    @Column(name = "disbursement_id", nullable = false) private UUID disbursementId;
    @Column(nullable = false, length = 12) private String action;   // PREPARE|AUTHORIZE|RELEASE
    @Column(nullable = false, length = 64) private String actor;
    @Column(name = "acted_at", nullable = false) private Instant actedAt = Instant.now();

    protected DualAuthorization() {}

    static DualAuthorization of(UUID id, UUID disbursementId, String action, String actor) {
        DualAuthorization d = new DualAuthorization();
        d.id = id; d.disbursementId = disbursementId; d.action = action; d.actor = actor;
        return d;
    }

    public UUID getId() { return id; }
    public UUID getDisbursementId() { return disbursementId; }
    public String getAction() { return action; }
    public String getActor() { return actor; }
    public Instant getActedAt() { return actedAt; }
}

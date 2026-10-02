package com.uslbd.ulms.approval;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/** Dual-authorized disbursement (03 mod-approval): PREPARED → AUTHORIZED → RELEASED. */
@Entity
@Table(name = "disbursement", schema = "ulms",
       indexes = @Index(name = "idx_disbursement_state", columnList = "state"))
public class Disbursement {

    public enum State { PREPARED, AUTHORIZED, RELEASED }

    @Id @Column(nullable = false, updatable = false) private UUID id;
    @Column(name = "application_id", nullable = false, unique = true) private UUID applicationId;
    @Column(name = "amount_minor", nullable = false) private long amountMinor;
    @Column(nullable = false, length = 12) private String state = "PREPARED";
    @Column(name = "prepared_by", nullable = false, length = 64) private String preparedBy;
    @Column(name = "prepared_at", nullable = false) private Instant preparedAt = Instant.now();
    @Column(name = "authorized_by", length = 64) private String authorizedBy;
    @Column(name = "authorized_at") private Instant authorizedAt;
    @Column(name = "released_at") private Instant releasedAt;
    @Column(name = "fineract_txn_id") private Long fineractTxnId;
    /** Optimistic concurrency (05 §4). */
    @jakarta.persistence.Version @Column(nullable = false) private long version;

    protected Disbursement() {}

    static Disbursement prepared(UUID id, UUID applicationId, long amountMinor, String preparedBy) {
        Disbursement d = new Disbursement();
        d.id = id; d.applicationId = applicationId;
        d.amountMinor = amountMinor; d.preparedBy = preparedBy;
        return d;
    }

    void authorize(String by) { this.authorizedBy = by; this.authorizedAt = Instant.now(); this.state = "AUTHORIZED"; }
    void release(Long fineractTxnId) { this.releasedAt = Instant.now(); this.fineractTxnId = fineractTxnId; this.state = "RELEASED"; }

    public UUID getId() { return id; }
    public UUID getApplicationId() { return applicationId; }
    public long getAmountMinor() { return amountMinor; }
    public String getState() { return state; }
    public String getPreparedBy() { return preparedBy; }
    public Instant getPreparedAt() { return preparedAt; }
    public String getAuthorizedBy() { return authorizedBy; }
    public Instant getAuthorizedAt() { return authorizedAt; }
    public Instant getReleasedAt() { return releasedAt; }
    public Long getFineractTxnId() { return fineractTxnId; }
    public long getVersion() { return version; }
}

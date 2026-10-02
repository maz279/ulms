package com.uslbd.ulms.collections;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/** Recovery receipt on a written-off loan (R4) — CL-3 feed, 5% incentive. */
@Entity
@Table(name = "recovery_entry", schema = "ulms")
public class RecoveryEntry {

    @Id private UUID id;
    @Column(name = "loan_id", nullable = false) private UUID loanId;
    @Column(name = "loan_no", nullable = false, length = 16) private String loanNo;
    @Column(name = "cif_no", nullable = false, length = 16) private String cifNo;
    @Column(name = "amount_minor", nullable = false) private long amountMinor;
    @Column(nullable = false, length = 10) private String mode;
    @Column(name = "incentive_minor", nullable = false) private long incentiveMinor;
    @Column(name = "received_by", nullable = false, length = 64) private String receivedBy;
    @Column(name = "received_at", nullable = false) private Instant receivedAt = Instant.now();

    protected RecoveryEntry() {}

    static RecoveryEntry record(UUID id, UUID loanId, String loanNo, String cifNo,
                                long amountMinor, String mode, long incentiveMinor, String receivedBy) {
        RecoveryEntry r = new RecoveryEntry();
        r.id = id; r.loanId = loanId; r.loanNo = loanNo; r.cifNo = cifNo;
        r.amountMinor = amountMinor; r.mode = mode;
        r.incentiveMinor = incentiveMinor; r.receivedBy = receivedBy;
        return r;
    }

    public String getCifNo() { return cifNo; }
    public String getMode() { return mode; }
    public String getReceivedBy() { return receivedBy; }
    public java.time.Instant getReceivedAt() { return receivedAt; }
    public UUID getId() { return id; }
    public UUID getLoanId() { return loanId; }
    public String getLoanNo() { return loanNo; }
    public long getAmountMinor() { return amountMinor; }
    public long getIncentiveMinor() { return incentiveMinor; }
}

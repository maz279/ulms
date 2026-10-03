package com.uslbd.ulms.collections;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Collateral auction/disposal ledger (Q1.5, ULS-01 §6.3): auction tracking
 * on written-off loans. A SOLD entry cuts a RecoveryEntry (mode AUCTION —
 * the 5% recovery-incentive ledger picks it up via WriteOffService), so
 * CL-3 reporting sees auction proceeds like any other recovery.
 */
@Entity
@Table(name = "auction_entry", schema = "ulms")
public class AuctionEntry {

    public static final String SCHEDULED = "SCHEDULED";
    public static final String HELD = "HELD";
    public static final String SOLD = "SOLD";
    public static final String UNSOLD = "UNSOLD";
    public static final String CANCELLED = "CANCELLED";

    @Id private UUID id;
    @Column(name = "loan_id", nullable = false) private UUID loanId;
    @Column(name = "cif_no", nullable = false, length = 16) private String cifNo;
    @Column(name = "loan_no", nullable = false, length = 24) private String loanNo;
    @Column(name = "collateral_ref", length = 64) private String collateralRef;
    @Column(nullable = false, length = 120) private String venue;
    @Column(name = "scheduled_for", nullable = false) private Instant scheduledFor;
    @Column(name = "held_on") private Instant heldOn;
    @Column(nullable = false, length = 10) private String status = SCHEDULED;
    @Column(name = "reserve_minor", nullable = false) private long reserveMinor;
    @Column(name = "proceeds_minor") private Long proceedsMinor;
    @Column(length = 120) private String buyer;
    @Column(name = "recovery_id") private UUID recoveryId;
    @Column(name = "created_by", nullable = false, length = 40) private String createdBy;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    protected AuctionEntry() {}

    static AuctionEntry schedule(UUID id, UUID loanId, String cifNo, String loanNo,
                                 String collateralRef, String venue, Instant scheduledFor,
                                 long reserveMinor, String createdBy) {
        AuctionEntry a = new AuctionEntry();
        a.id = id; a.loanId = loanId; a.cifNo = cifNo; a.loanNo = loanNo;
        a.collateralRef = collateralRef; a.venue = venue;
        a.scheduledFor = scheduledFor; a.reserveMinor = reserveMinor;
        a.createdBy = createdBy;
        return a;
    }

    void markHeld() {
        if (!SCHEDULED.equals(status)) throw new IllegalStateException("held requires SCHEDULED (now " + status + ")");
        this.status = HELD;
        this.heldOn = Instant.now();
    }

    /** SOLD cuts the recovery — invoked by AuctionService with the entry id. */
    void markSold(long proceedsMinor, String buyer, UUID recoveryId) {
        if (!HELD.equals(status) && !SCHEDULED.equals(status)) {
            throw new IllegalStateException("sold requires SCHEDULED/HELD (now " + status + ")");
        }
        if (proceedsMinor <= 0) throw new IllegalArgumentException("proceedsMinor must be positive");
        this.status = SOLD;
        this.proceedsMinor = proceedsMinor;
        this.buyer = buyer;
        this.recoveryId = recoveryId;
        if (this.heldOn == null) this.heldOn = Instant.now();
    }

    void markUnsold() {
        if (!HELD.equals(status) && !SCHEDULED.equals(status)) {
            throw new IllegalStateException("unsold requires SCHEDULED/HELD (now " + status + ")");
        }
        this.status = UNSOLD;
        if (this.heldOn == null) this.heldOn = Instant.now();
    }

    void cancel() {
        if (SOLD.equals(status)) throw new IllegalStateException("a sold auction cannot be cancelled");
        this.status = CANCELLED;
    }

    public UUID getId() { return id; }
    public UUID getLoanId() { return loanId; }
    public String getCifNo() { return cifNo; }
    public String getLoanNo() { return loanNo; }
    public String getCollateralRef() { return collateralRef; }
    public String getVenue() { return venue; }
    public Instant getScheduledFor() { return scheduledFor; }
    public Instant getHeldOn() { return heldOn; }
    public String getStatus() { return status; }
    public long getReserveMinor() { return reserveMinor; }
    public Long getProceedsMinor() { return proceedsMinor; }
    public String getBuyer() { return buyer; }
    public UUID getRecoveryId() { return recoveryId; }
    public String getCreatedBy() { return createdBy; }
    public Instant getCreatedAt() { return createdAt; }
}

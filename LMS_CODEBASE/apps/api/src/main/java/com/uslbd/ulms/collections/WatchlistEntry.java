package com.uslbd.ulms.collections;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Collections early-warning watchlist (Q1.4, PLAN-03 mod-collections): the
 * pre-SMA list officers work before an account tips into SMA. One OPEN row
 * per loan (unique partial index); the nightly scan auto-adds accounts
 * entering STD-2 (31-60 DPD) with reason AUTO_STD2 — graduated dunning and
 * the PTP worklist already key off the loan, so presence on this list is
 * the human cue, not a new machine state.
 */
@Entity
@Table(name = "watchlist_entry", schema = "ulms")
public class WatchlistEntry {

    /** Validated reason codes (PLAN-03 §early-warning). */
    public static final java.util.Set<String> REASONS = java.util.Set.of(
            "DPD_RISING", "CHEQUE_BOUNCE", "CIB_ALERT", "FIELD_INTEL",
            "BANKING_INACTIVITY", "AUTO_STD2");

    @Id private UUID id;
    @Column(name = "loan_id", nullable = false) private UUID loanId;
    @Column(name = "cif_no", nullable = false, length = 16) private String cifNo;
    @Column(name = "loan_no", nullable = false, length = 24) private String loanNo;
    @Column(name = "reason_code", nullable = false, length = 20) private String reasonCode;
    @Column(columnDefinition = "text") private String note;
    @Column(nullable = false, length = 10) private String status = "OPEN";
    @Column(name = "review_by", nullable = false) private Instant reviewBy;
    @Column(name = "added_by", nullable = false, length = 40) private String addedBy;
    @Column(name = "added_at", nullable = false) private Instant addedAt = Instant.now();
    @Column(name = "cleared_by", length = 40) private String clearedBy;
    @Column(name = "cleared_at") private Instant clearedAt;
    @Column(name = "clear_note", columnDefinition = "text") private String clearNote;

    protected WatchlistEntry() {}

    static WatchlistEntry open(UUID id, UUID loanId, String cifNo, String loanNo,
                               String reasonCode, String note, Instant reviewBy,
                               String addedBy) {
        WatchlistEntry w = new WatchlistEntry();
        w.id = id; w.loanId = loanId; w.cifNo = cifNo; w.loanNo = loanNo;
        w.reasonCode = reasonCode; w.note = note; w.reviewBy = reviewBy;
        w.addedBy = addedBy;
        return w;
    }

    /** CLEARED is terminal — a re-offending loan gets a fresh row. */
    void clear(String clearedBy, String note) {
        if (!"OPEN".equals(status)) throw new IllegalStateException("already " + status);
        this.status = "CLEARED";
        this.clearedBy = clearedBy;
        this.clearedAt = Instant.now();
        this.clearNote = note;
    }

    public UUID getId() { return id; }
    public UUID getLoanId() { return loanId; }
    public String getCifNo() { return cifNo; }
    public String getLoanNo() { return loanNo; }
    public String getReasonCode() { return reasonCode; }
    public String getNote() { return note; }
    public String getStatus() { return status; }
    public Instant getReviewBy() { return reviewBy; }
    public String getAddedBy() { return addedBy; }
    public Instant getAddedAt() { return addedAt; }
    public String getClearedBy() { return clearedBy; }
    public Instant getClearedAt() { return clearedAt; }
    public String getClearNote() { return clearNote; }
}

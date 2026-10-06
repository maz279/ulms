package com.uslbd.ulms.collections;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Write-off case (R4): propose on SS/DF/B-L → committee approve (GL JV +
 * CIB flag + outstanding zeroed) → reverse when recovery arrives.
 * CL-4 feed source; provision pinned at proposal.
 */
@Entity
@Table(name = "write_off", schema = "ulms")
public class WriteOff {

    public enum State { PROPOSED, EXECUTED, REVERSED }

    @Id private UUID id;
    @Column(name = "loan_id", nullable = false) private UUID loanId;
    @Column(name = "loan_no", nullable = false, length = 16) private String loanNo;
    @Column(name = "cif_no", nullable = false, length = 16) private String cifNo;
    @Column(name = "amount_minor", nullable = false) private long amountMinor;
    @Column(name = "provision_at_proposal_minor", nullable = false) private long provisionAtProposalMinor;
    @Column(nullable = false, length = 6) private String classification;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 10) private State state = State.PROPOSED;
    @Column(name = "board_band", nullable = false, length = 16) private String boardBand;
    @Column(name = "proposed_by", nullable = false, length = 64) private String proposedBy;
    @Column(name = "proposed_at", nullable = false) private Instant proposedAt = Instant.now();
    @Column(name = "approved_at") private Instant approvedAt;
    @Column(name = "reversed_at") private Instant reversedAt;
    @Column(name = "gl_ref", length = 32) private String glRef;
    @Column(nullable = false, columnDefinition = "text") private String reason;

    protected WriteOff() {}

    public static WriteOff propose(UUID id, UUID loanId, String loanNo, String cifNo,
                                   long amountMinor, long provisionMinor, String classification,
                                   String boardBand, String proposedBy, String reason) {
        WriteOff w = new WriteOff();
        w.id = id; w.loanId = loanId; w.loanNo = loanNo; w.cifNo = cifNo;
        w.amountMinor = amountMinor; w.provisionAtProposalMinor = provisionMinor;
        w.classification = classification; w.boardBand = boardBand;
        w.proposedBy = proposedBy; w.reason = reason;
        return w;
    }

    void execute(String glRef) {
        if (state != State.PROPOSED) throw new IllegalStateException("approve requires PROPOSED (now " + state + ")");
        this.state = State.EXECUTED; this.approvedAt = Instant.now(); this.glRef = glRef;
    }

    void reverse() {
        if (state != State.EXECUTED) throw new IllegalStateException("only EXECUTED reverses");
        this.state = State.REVERSED; this.reversedAt = Instant.now();
    }

    public String getCifNo() { return cifNo; }
    public long getProvisionAtProposalMinor() { return provisionAtProposalMinor; }
    public String getClassification() { return classification; }
    public String getProposedBy() { return proposedBy; }
    public java.time.Instant getProposedAt() { return proposedAt; }
    public java.time.Instant getApprovedAt() { return approvedAt; }
    public java.time.Instant getReversedAt() { return reversedAt; }
    public String getReason() { return reason; }
    public UUID getId() { return id; }
    public UUID getLoanId() { return loanId; }
    public String getLoanNo() { return loanNo; }
    public long getAmountMinor() { return amountMinor; }
    public State getState() { return state; }
    public String getBoardBand() { return boardBand; }
    public String getGlRef() { return glRef; }
}

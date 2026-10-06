package com.uslbd.ulms.servicing;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/** Early-settlement quote (03): outstanding + penalty − rebate, valid 7 days. */
@Entity
@Table(name = "settlement_quote", schema = "ulms")
public class SettlementQuote {

    @Id @Column(nullable = false, updatable = false) private UUID id;
    @Column(name = "loan_id", nullable = false) private UUID loanId;
    @Column(name = "outstanding_minor", nullable = false) private long outstandingMinor;
    @Column(name = "penalty_minor", nullable = false) private long penaltyMinor;
    @Column(name = "rebate_minor", nullable = false) private long rebateMinor;
    @Column(name = "total_minor", nullable = false) private long totalMinor;
    @Column(name = "valid_until", nullable = false) private Instant validUntil;
    @Column(name = "quoted_by", nullable = false, length = 64) private String quotedBy;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    protected SettlementQuote() {}

    static SettlementQuote of(UUID id, UUID loanId, long outstanding, long penalty,
                              long rebate, long total, Instant validUntil, String quotedBy) {
        SettlementQuote q = new SettlementQuote();
        q.id = id; q.loanId = loanId;
        q.outstandingMinor = outstanding; q.penaltyMinor = penalty;
        q.rebateMinor = rebate; q.totalMinor = total;
        q.validUntil = validUntil; q.quotedBy = quotedBy;
        return q;
    }

    public UUID getId() { return id; }
    public UUID getLoanId() { return loanId; }
    public long getOutstandingMinor() { return outstandingMinor; }
    public long getPenaltyMinor() { return penaltyMinor; }
    public long getRebateMinor() { return rebateMinor; }
    public long getTotalMinor() { return totalMinor; }
    public Instant getValidUntil() { return validUntil; }
    public String getQuotedBy() { return quotedBy; }
    public Instant getCreatedAt() { return createdAt; }
}

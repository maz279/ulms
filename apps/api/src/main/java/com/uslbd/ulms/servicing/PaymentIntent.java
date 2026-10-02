package com.uslbd.ulms.servicing;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/** Portal-initiated payment intent — redirect model only, no card data (08 B2). */
@Entity
@Table(name = "payment_intent", schema = "ulms",
       indexes = @Index(name = "idx_intent_loan", columnList = "loan_id"))
public class PaymentIntent {

    @Id @Column(nullable = false, updatable = false) private UUID id;
    @Column(name = "loan_id", nullable = false) private UUID loanId;
    @Column(name = "amount_minor", nullable = false) private long amountMinor;
    @Column(nullable = false, length = 16) private String rail;
    @Column(name = "rail_ref", length = 64) private String railRef;
    @Column(name = "rail_url", length = 300) private String railUrl;
    @Column(nullable = false, length = 10) private String status = "CREATED";
    @Column(name = "initiated_by", nullable = false, length = 64) private String initiatedBy;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    protected PaymentIntent() {}

    static PaymentIntent of(UUID id, UUID loanId, long amountMinor, String rail,
                            String railRef, String railUrl, String initiatedBy) {
        PaymentIntent i = new PaymentIntent();
        i.id = id; i.loanId = loanId; i.amountMinor = amountMinor;
        i.rail = rail; i.railRef = railRef; i.railUrl = railUrl; i.initiatedBy = initiatedBy;
        return i;
    }

    void complete() { this.status = "COMPLETED"; }

    public UUID getId() { return id; }
    public UUID getLoanId() { return loanId; }
    public long getAmountMinor() { return amountMinor; }
    public String getRail() { return rail; }
    public String getRailRef() { return railRef; }
    public String getRailUrl() { return railUrl; }
    public String getStatus() { return status; }
    public String getInitiatedBy() { return initiatedBy; }
    public Instant getCreatedAt() { return createdAt; }
}

package com.uslbd.ulms.servicing;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/** Posted payment mirror — idempotent by externalRef; utr unique for webhooks (05 §7). */
@Entity
@Table(name = "payment", schema = "ulms",
       uniqueConstraints = {
               @UniqueConstraint(name = "uq_payment_external_ref", columnNames = "external_ref"),
               @UniqueConstraint(name = "uq_payment_utr", columnNames = "utr")
       },
       indexes = @Index(name = "idx_payment_loan", columnList = "loan_id"))
public class Payment {

    @Id @Column(nullable = false, updatable = false) private UUID id;
    @Column(name = "loan_id", nullable = false) private UUID loanId;
    @Column(name = "amount_minor", nullable = false) private long amountMinor;
    @Column(name = "external_ref", nullable = false, length = 80) private String externalRef;
    @Column(nullable = false, length = 16) private String rail;   // COUNTER|BKASH|NAGAD|BEFTN
    @Column(length = 64) private String utr;
    @Column(nullable = false, length = 12) private String status = "COMPLETED";
    @Column(name = "fineract_txn_id") private Long fineractTxnId;
    @Column(name = "paid_at", nullable = false) private Instant paidAt = Instant.now();
    @Column(name = "posted_by", nullable = false, length = 64) private String postedBy;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    protected Payment() {}

    public static Payment of(UUID id, UUID loanId, long amountMinor, String externalRef,
                      String rail, String utr, Long fineractTxnId, String postedBy) {
        Payment p = new Payment();
        p.id = id; p.loanId = loanId; p.amountMinor = amountMinor;
        p.externalRef = externalRef; p.rail = rail; p.utr = utr;
        p.fineractTxnId = fineractTxnId; p.postedBy = postedBy;
        return p;
    }

    public UUID getId() { return id; }
    public UUID getLoanId() { return loanId; }
    public long getAmountMinor() { return amountMinor; }
    public String getExternalRef() { return externalRef; }
    public String getRail() { return rail; }
    public String getUtr() { return utr; }
    public String getStatus() { return status; }
    public Long getFineractTxnId() { return fineractTxnId; }
    public Instant getPaidAt() { return paidAt; }
    public String getPostedBy() { return postedBy; }
    public Instant getCreatedAt() { return createdAt; }
}

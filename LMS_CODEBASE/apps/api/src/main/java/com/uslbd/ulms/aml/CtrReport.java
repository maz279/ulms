package com.uslbd.ulms.aml;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/** CTR row (R10 P-C, BFIU): every CASH payment ≥ ৳10 lakh generates one. */
@Entity
@Table(name = "ctr_report", schema = "ulms",
       indexes = @Index(name = "idx_ctr_cif", columnList = "cif_no"))
public class CtrReport {

    @Id private UUID id;
    @Column(name = "cif_no", nullable = false, length = 16) private String cifNo;
    @Column(name = "payment_id", nullable = false) private UUID paymentId;
    @Column(name = "amount_minor", nullable = false) private long amountMinor;
    @Column(name = "occurred_at", nullable = false) private Instant occurredAt;
    @Column(nullable = false) private boolean exported = false;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    protected CtrReport() {}

    static CtrReport of(UUID id, String cifNo, UUID paymentId,
                        long amountMinor, Instant occurredAt) {
        CtrReport c = new CtrReport();
        c.id = id; c.cifNo = cifNo; c.paymentId = paymentId;
        c.amountMinor = amountMinor; c.occurredAt = occurredAt;
        return c;
    }

    void markExported() { this.exported = true; }

    public java.time.Instant getCreatedAt() { return createdAt; }
    public UUID getId() { return id; }
    public String getCifNo() { return cifNo; }
    public UUID getPaymentId() { return paymentId; }
    public long getAmountMinor() { return amountMinor; }
    public Instant getOccurredAt() { return occurredAt; }
    public boolean isExported() { return exported; }
}

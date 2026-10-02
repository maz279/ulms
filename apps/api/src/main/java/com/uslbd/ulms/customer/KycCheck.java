package com.uslbd.ulms.customer;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/** One NIDW e-KYC attempt (03 mod-customer table kyc_check; 06 §5). */
@Entity
@Table(name = "kyc_check", schema = "ulms",
       indexes = @Index(name = "idx_kyccheck_customer", columnList = "customer_id"))
public class KycCheck {

    @Id @Column(nullable = false, updatable = false) private UUID id;
    @Column(name = "customer_id", nullable = false) private UUID customerId;
    @Column(nullable = false, length = 12) private String status;   // VERIFIED|REJECTED|ERROR
    @Column(name = "reference_id", length = 64) private String referenceId;
    @Column(name = "checked_at", nullable = false) private Instant checkedAt = Instant.now();

    protected KycCheck() {}

    static KycCheck of(UUID id, UUID customerId, String status, String referenceId) {
        KycCheck k = new KycCheck();
        k.id = id; k.customerId = customerId; k.status = status; k.referenceId = referenceId;
        return k;
    }

    public UUID getId() { return id; }
    public UUID getCustomerId() { return customerId; }
    public String getStatus() { return status; }
    public String getReferenceId() { return referenceId; }
    public Instant getCheckedAt() { return checkedAt; }
}

package com.uslbd.ulms.assessment;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.Instant;
import java.util.UUID;

/** Collateral registry row with valuation + insurance tracking (03). */
@Entity
@Table(name = "collateral", schema = "ulms",
       indexes = @Index(name = "idx_collateral_app", columnList = "application_id"))
public class Collateral {

    @Id @Column(nullable = false, updatable = false) private UUID id;
    @Column(name = "application_id", nullable = false) private UUID applicationId;
    @Column(name = "collateral_type", nullable = false, length = 30) private String collateralType;
    @Column(length = 200) private String description;
    @Column(name = "value_minor", nullable = false) private long valueMinor;
    @Column(name = "valued_on") private LocalDate valuedOn;
    @Column(name = "insured_until") private LocalDate insuredUntil;
    @Column(name = "created_by", nullable = false, length = 64) private String createdBy;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();
    // R10 P-C registry extension: customer-level ownership + FSV + lifecycle
    @Column(name = "customer_id") private UUID customerId;
    @Column(name = "forced_sale_value_minor") private Long forcedSaleValueMinor;
    @Column(nullable = false, length = 10) private String status = "ACTIVE";

    protected Collateral() {}

    static Collateral of(UUID id, UUID applicationId, String type, String description,
                         long valueMinor, LocalDate valuedOn, LocalDate insuredUntil,
                         String createdBy) {
        Collateral c = new Collateral();
        c.id = id; c.applicationId = applicationId; c.collateralType = type;
        c.description = description; c.valueMinor = valueMinor;
        c.valuedOn = valuedOn; c.insuredUntil = insuredUntil; c.createdBy = createdBy;
        return c;
    }

    void revalue(long valueMinor, LocalDate valuedOn) {
        this.valueMinor = valueMinor; this.valuedOn = valuedOn;
    }
    /** R10 P-C: register with customer scope + forced-sale value (≤ MV). */
    public static Collateral registered(UUID id, UUID applicationId, UUID customerId,
                                        String type, String description, long valueMinor,
                                        long forcedSaleValueMinor, LocalDate valuedOn,
                                        LocalDate insuredUntil, String createdBy) {
        Collateral c = of(id, applicationId, type, description, valueMinor,
                valuedOn, insuredUntil, createdBy);
        c.customerId = customerId; c.forcedSaleValueMinor = forcedSaleValueMinor;
        return c;
    }
    void retire() { this.status = "RETIRED"; }

    public UUID getId() { return id; }
    public UUID getApplicationId() { return applicationId; }
    public String getCollateralType() { return collateralType; }
    public String getDescription() { return description; }
    public long getValueMinor() { return valueMinor; }
    public LocalDate getValuedOn() { return valuedOn; }
    public UUID getCustomerId() { return customerId; }
    public long getForcedSaleValueMinor() {
        return forcedSaleValueMinor == null ? Math.round(valueMinor * 0.8) : forcedSaleValueMinor;
    }
    public String getStatus() { return status; }
    public LocalDate getInsuredUntil() { return insuredUntil; }
    public String getCreatedBy() { return createdBy; }
    public Instant getCreatedAt() { return createdAt; }
}

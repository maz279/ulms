package com.uslbd.ulms.assessment;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Immutable valuation history (04 §3 table collateral_valuation): the initial
 * valuation and every revaluation append a row; collateral keeps the current.
 */
@Entity
@Table(name = "collateral_valuation", schema = "ulms",
       indexes = @Index(name = "idx_collval_collateral", columnList = "collateral_id"))
public class CollateralValuation {

    @Id @Column(nullable = false, updatable = false) private UUID id;
    @Column(name = "collateral_id", nullable = false) private UUID collateralId;
    @Column(name = "value_minor", nullable = false) private long valueMinor;
    @Column(name = "valued_on") private LocalDate valuedOn;
    @Column(name = "valued_by", nullable = false, length = 64) private String valuedBy;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    protected CollateralValuation() {}

    static CollateralValuation of(UUID id, UUID collateralId, long valueMinor,
                                  LocalDate valuedOn, String valuedBy) {
        CollateralValuation v = new CollateralValuation();
        v.id = id; v.collateralId = collateralId; v.valueMinor = valueMinor;
        v.valuedOn = valuedOn; v.valuedBy = valuedBy;
        return v;
    }

    public UUID getId() { return id; }
    public UUID getCollateralId() { return collateralId; }
    public long getValueMinor() { return valueMinor; }
    public LocalDate getValuedOn() { return valuedOn; }
    public String getValuedBy() { return valuedBy; }
    public Instant getCreatedAt() { return createdAt; }
}

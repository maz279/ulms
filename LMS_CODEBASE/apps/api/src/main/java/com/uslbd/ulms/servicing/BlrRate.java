package com.uslbd.ulms.servicing;

import jakarta.persistence.*;
import java.time.LocalDate;

/** Dated BLR (base lending rate) configuration (R10 P-E, ADR-009). */
@Entity
@Table(name = "blr_rate", schema = "ulms")
public class BlrRate {

    @Id private int id = 1;
    @Column(name = "rate_bp", nullable = false) private int rateBp;
    @Column(name = "effective_from", nullable = false) private LocalDate effectiveFrom;
    @Column(nullable = false) private boolean active = true;

    protected BlrRate() {}

    void apply(int newRateBp, java.time.LocalDate from) {
        this.rateBp = newRateBp; this.effectiveFrom = from; this.active = true;
    }

    public int getRateBp() { return rateBp; }
    public LocalDate getEffectiveFrom() { return effectiveFrom; }
    public boolean isActive() { return active; }
}

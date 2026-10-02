package com.uslbd.ulms.collections;

import jakarta.persistence.*;

/** Dunning ladder rung (R10 P-A, ULS-01 §6.1) — bank-tunable configuration. */
@Entity
@Table(name = "dunning_step", schema = "ulms")
public class DunningStep {

    @Id private int seq;
    @Column(name = "min_dpd", nullable = false) private int minDpd;
    @Column(name = "max_dpd") private Integer maxDpd;   // null = unbounded
    @Column(name = "action_type", nullable = false, length = 16) private String actionType;
    @Column(name = "cadence_days", nullable = false) private int cadenceDays;

    protected DunningStep() {}

    /** The rung governing a DPD (highest min_dpd ≤ dpd within its band). */
    boolean covers(int dpd) {
        return dpd >= minDpd && (maxDpd == null || dpd <= maxDpd);
    }

    public int getSeq() { return seq; }
    public String getActionType() { return actionType; }
    public int getCadenceDays() { return cadenceDays; }
    public int getMinDpd() { return minDpd; }
    public Integer getMaxDpd() { return maxDpd; }
}

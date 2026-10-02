package com.uslbd.ulms.platform.workflow;

import jakarta.persistence.*;

/** Per-level SLA policy (R10 P-B, WF-SPEC §5) — bank-tunable minutes. */
@Entity
@Table(name = "sla_policy", schema = "ulms")
public class SlaPolicy {

    @Id private int level;
    @Column(name = "standard_min", nullable = false) private int standardMin;
    @Column(name = "urgent_min", nullable = false) private int urgentMin;

    protected SlaPolicy() {}

    public int getLevel() { return level; }
    public int getStandardMin() { return standardMin; }
    public int getUrgentMin() { return urgentMin; }
}

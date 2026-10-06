package com.uslbd.ulms.compliance;

import jakarta.persistence.*;

/** Basel risk weight (R10 P-F, BASEL §3.2): segment keys + BRPD classes. */
@Entity
@Table(name = "risk_weight", schema = "ulms")
public class RiskWeight {

    @Id @Column(name = "rkey", length = 20) private String rkey;
    @Column(name = "weight_bp", nullable = false) private int weightBp;

    protected RiskWeight() {}

    public String getRkey() { return rkey; }
    public int getWeightBp() { return weightBp; }
}

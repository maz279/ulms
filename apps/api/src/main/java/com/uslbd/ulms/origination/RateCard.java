package com.uslbd.ulms.origination;

import jakarta.persistence.*;

/** Risk-based pricing card (R10 P-B, DMN §3): grade → premium over product rate. */
@Entity
@Table(name = "rate_card", schema = "ulms")
public class RateCard {

    @Id @Column(length = 2) private String grade;
    @Column(name = "premium_bp", nullable = false) private int premiumBp;

    protected RateCard() {}

    public String getGrade() { return grade; }
    public int getPremiumBp() { return premiumBp; }
}

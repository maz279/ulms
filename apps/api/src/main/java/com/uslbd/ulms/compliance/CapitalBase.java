package com.uslbd.ulms.compliance;

import jakarta.persistence.*;

/** Bank capital base (R10 P-F): the 15%/25% large-exposure denominators. */
@Entity
@Table(name = "capital_base", schema = "ulms")
public class CapitalBase {

    @Id private int id = 1;
    @Column(name = "capital_minor", nullable = false) private long capitalMinor;

    protected CapitalBase() {}

    public long getCapitalMinor() { return capitalMinor; }
}

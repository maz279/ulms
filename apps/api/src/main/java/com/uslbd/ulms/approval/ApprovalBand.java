package com.uslbd.ulms.approval;

import jakarta.persistence.*;
import java.util.UUID;

/** Ladder start node for an amount — CONFIGURATION per V2 seed (03 mod-approval). */
@Entity
@Table(name = "approval_band", schema = "ulms")
public class ApprovalBand {

    @Id private int level;
    @Column(name = "role_key", nullable = false, length = 30) private String roleKey;
    @Column(name = "role_name_en", nullable = false, length = 60) private String roleNameEn;
    @Column(name = "min_minor", nullable = false) private long minMinor;
    @Column(name = "max_minor") private Long maxMinor;   // null = unbounded

    protected ApprovalBand() {}

    /** Band routing: level for amount (minor units). Boundaries: min inclusive, max inclusive. */
    boolean contains(long amountMinor) {
        return amountMinor >= minMinor && (maxMinor == null || amountMinor <= maxMinor);
    }

    public int getLevel() { return level; }
    public String getRoleKey() { return roleKey; }
    public String getRoleNameEn() { return roleNameEn; }
    public long getMinMinor() { return minMinor; }
    public Long getMaxMinor() { return maxMinor; }
}

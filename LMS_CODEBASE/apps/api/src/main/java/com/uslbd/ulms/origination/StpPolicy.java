package com.uslbd.ulms.origination;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Fast-track (STP) eligibility oracle (R10 P-B, WF-SPEC §4.2 — premium/good
 * tiers mapped onto the versioned pilot scorecard):
 *   relationship ≥ 24 months · grade A or B · DBR ≤ 40% (green band) · no
 *   delinquent loans (DPD > 0) · Personal/Auto products only · amount within
 *   the grade's tier (A → ৳5 L, B → ৳3 L) · TAT < 30 min, no human review
 *   (post-approval audit sweep instead).
 */
public final class StpPolicy {

    private StpPolicy() {}

    static final java.util.Set<String> STP_PRODUCTS = java.util.Set.of(
            "retail-personal", "auto-new", "auto-used");

    /** Tier ceiling in minor units by scorecard grade. */
    static long tierLimitMinor(String grade) {
        if ("A".equals(grade)) return 500_000_00L;    // premium
        if ("B".equals(grade)) return 300_000_00L;    // good
        return 0;
    }

    public static boolean eligible(String productCode, long amountMinor, String grade,
                                   BigDecimal dbrPercent, int worstDpd,
                                   Instant relationshipSince, Instant now) {
        if (!STP_PRODUCTS.contains(productCode)) return false;
        if (worstDpd > 0) return false;
        long tier = tierLimitMinor(grade);
        if (tier == 0 || amountMinor > tier) return false;
        if (dbrPercent == null || dbrPercent.doubleValue() > 40) return false;
        if (relationshipSince == null) return false;
        var zone = java.time.ZoneId.of("Asia/Dhaka");
        return ChronoUnit.MONTHS.between(
                java.time.LocalDate.ofInstant(relationshipSince, zone),
                java.time.LocalDate.ofInstant(now, zone)) >= 24;
    }
}

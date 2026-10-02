package com.uslbd.ulms.compliance;

import java.util.Map;

/**
 * Basel III capital-adequacy inputs (P4 / 03 mod-compliance "Basel CAR inputs"):
 * RWA from simplified standardized risk weights by BRPD classification, CAR
 * against the 12.5% regulatory floor (BRPD/Basel III RBCA). Pure + table-tested.
 *
 * <p>Eligible capital is a configured pilot input ({@code
 * ulms.compliance.eligible-capital-minor}) — the real figure comes from the
 * bank's capital ledger at UAT; the return demonstrates the computation.
 */
public final class BaselCar {

    private BaselCar() {}

    /** Regulatory CAR floor — 12.5% (Basel III RBCA guidelines, BRPD). */
    public static final int FLOOR_BP = 1_250;

    /** Simplified standardized retail risk weights by BRPD class (bp of exposure). */
    static final Map<String, Integer> RISK_WEIGHT_BP = Map.of(
            "STD-0", 7_500,
            "STD-1", 7_500,
            "STD-2", 7_500,
            "SMA", 10_000,
            "SS", 15_000,
            "DF", 17_500,
            "B/L", 25_000);

    public static int riskWeightBp(String brpdStage) {
        Integer w = RISK_WEIGHT_BP.get(brpdStage);
        if (w == null) throw new IllegalArgumentException("Unknown BRPD stage " + brpdStage);
        return w;
    }

    /** RWA = Σ exposure × risk weight (bp scaled by 10⁴). */
    public static long rwaMinor(Map<String, Long> outstandingByClassMinor) {
        long rwa = 0;
        for (var e : outstandingByClassMinor.entrySet()) {
            rwa += Math.round(e.getValue() * riskWeightBp(e.getKey()) / 10_000.0);
        }
        return rwa;
    }

    /** CAR (bp) = eligible capital × 10⁴ / RWA; Integer.MAX_VALUE cap guards the empty book. */
    public static int carBp(long eligibleCapitalMinor, long rwaMinor) {
        if (rwaMinor <= 0) return Integer.MAX_VALUE;
        long bp = Math.round(eligibleCapitalMinor * 10_000.0 / rwaMinor);
        return (int) Math.min(Integer.MAX_VALUE, bp);
    }

    /** Buffer above the 12.5% floor (bp) — negative means a breach. */
    public static long bufferBp(int carBp) {
        return (long) carBp - FLOOR_BP;
    }
}

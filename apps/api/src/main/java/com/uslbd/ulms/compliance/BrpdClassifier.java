package com.uslbd.ulms.compliance;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * BRPD Circular 15/2024 stage matrix — THE classification oracle (03
 * mod-compliance: "stage rules data-driven exactly as prototype table").
 * Boundary semantics (verified ±1 in ClassificationBoundaryTest):
 *   0        → STD-0   1%    (current)
 *   1–30     → STD-1   1%    (watch)
 *   31–60    → STD-2   1%    (caution)
 *   61–90    → SMA     5%
 *   91–180   → SS      20%   interest suspense starts
 *   181–365  → DF      50%
 *   ≥366     → B/L     100%
 */
public final class BrpdClassifier {

    public record Result(String classification, int provisionRateBp, boolean interestSuspense) {
        public long provisionMinor(long outstandingMinor) {
            return BigDecimal.valueOf(outstandingMinor)
                    .multiply(BigDecimal.valueOf(provisionRateBp))
                    .divide(BigDecimal.valueOf(10_000), 0, RoundingMode.HALF_UP)
                    .longValue();
        }
    }

    private BrpdClassifier() {}

    public static final Result STD_0 = new Result("STD-0", 100, false);
    public static final Result STD_1 = new Result("STD-1", 100, false);
    public static final Result STD_2 = new Result("STD-2", 100, false);
    public static final Result SMA  = new Result("SMA", 500, false);
    public static final Result SS   = new Result("SS", 2_000, true);
    public static final Result DF   = new Result("DF", 5_000, true);
    public static final Result BL   = new Result("B/L", 10_000, true);

    public static Result classify(int dpd) {
        if (dpd <= 0) return STD_0;
        if (dpd <= 30) return STD_1;
        if (dpd <= 60) return STD_2;
        if (dpd <= 90) return SMA;
        if (dpd <= 180) return SS;
        if (dpd <= 365) return DF;
        return BL;
    }

    /** Provision calculator by classification name — the shared policy oracle (03). */
    public static Result byName(String classification) {
        return switch (classification) {
            case "STD-0" -> STD_0;
            case "STD-1" -> STD_1;
            case "STD-2" -> STD_2;
            case "SMA" -> SMA;
            case "SS" -> SS;
            case "DF" -> DF;
            case "B/L" -> BL;
            default -> throw new IllegalArgumentException("Unknown classification: " + classification);
        };
    }
}

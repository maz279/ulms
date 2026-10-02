package com.uslbd.ulms.compliance;

import java.time.LocalDate;
import java.util.List;

/**
 * Classification override oracle (R10 P-C, CLS-ALGO §1.2/§2): pre-classification
 * adjustments applied BEFORE the DPD rule at EOD —
 *   borrower bankrupt                     → B/L
 *   loan under legal proceedings          → at least SS
 *   rescheduled within the last 6 months  → performing keeps the pre-reschedule
 *                                           stage (retention); non-performing is
 *                                           floored one stage below the original
 *                                           ("downgrade one stage from original")
 *   older reschedules                     → pure DPD classification
 */
public final class BrpdOverrides {

    private static final List<String> ORDER =
            List.of("STD-0", "STD-1", "STD-2", "SMA", "SS", "DF", "B/L");

    private BrpdOverrides() {}

    static int rank(String classification) {
        int i = ORDER.indexOf(classification);
        if (i < 0) throw new IllegalArgumentException("Unknown classification: " + classification);
        return i;
    }

    /** The effective stage for a loan given its DPD class and override facts. */
    public static String effective(String dpdClass, boolean bankruptcy, boolean legal,
                                   LocalDate rescheduledOn, String preReschedule,
                                   LocalDate today) {
        if (bankruptcy) return "B/L";

        String result = dpdClass;
        if (legal) {
            result = worseOf(result, "SS");
        }
        if (rescheduledOn != null && preReschedule != null
                && !today.isAfter(rescheduledOn.plusMonths(6))) {
            if ("STD-0".equals(dpdClass)) {
                result = preReschedule;                     // performing → retention
            } else {
                // non-performing → floor one stage worse than the original
                int floorRank = Math.min(rank(preReschedule) + 1, ORDER.size() - 1);
                result = worseOf(result, ORDER.get(floorRank));
            }
        }
        return result;
    }

    private static String worseOf(String a, String b) {
        return rank(a) >= rank(b) ? a : b;
    }
}

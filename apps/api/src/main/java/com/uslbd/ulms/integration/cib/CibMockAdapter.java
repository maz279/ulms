package com.uslbd.ulms.integration.cib;

import org.springframework.stereotype.Component;

/**
 * P2 MOCK adapter (PLANNING/11 §1): deterministic, no network. Generates a
 * fixed-width report whose shape matches the bank file contract — the SAME
 * parser handles mock and UAT payloads, so fixture tests exercise the real
 * path. Facilities are seeded from the CIF so every subject gets a stable,
 * reproducible bureau profile (2 clean + 1 watch-list facility).
 */
@Component
// mutual exclusion with the live adapter — two CibPort beans break context
// startup once the cib-live flag is flipped (R7 feature flags)
@org.springframework.context.annotation.Profile("!cib-live")
public class CibMockAdapter implements CibPort {

    @Override
    public String pullReport(String cifNo, String periodYYYYMM) {
        long seed = Math.abs(cifNo.hashCode());
        StringBuilder sb = new StringBuilder();
        sb.append("HDR,").append(periodYYYYMM).append(",MOCK-").append(cifNo).append('\n');
        sb.append("SUBJ,").append(cifNo).append(",SUBJECT ").append(cifNo).append('\n');

        sb.append(facility(seed, 0, "DBBL001", "Dutch-Bangla Bank Ltd.", "TERM",
                5_000_000_00L, 3_100_000_00L, 0, 45_000_00L, 0, "STD-0", "20260915",
                "0".repeat(24)));                                             // spotless 24m
        sb.append(facility(seed, 1, "EBL0002", "Eastern Bank Ltd.", "CC",
                2_000_000_00L, 800_000_00L, 0, 25_000_00L, 0, "STD-0", "20260901",
                "0".repeat(21) + "100"));                                     // 2 clean + 1 overdue + 1 missed
        sb.append(facility(seed, 2, "IBBL003", "Islami Bank Bangladesh", "HP",
                1_200_000_00L, 700_000_00L, 40_000_00L, 18_000_00L,
                (int) (60 + seed % 40), "SMA", "20260820",
                "0".repeat(12) + "1".repeat(6) + "0".repeat(6)));            // SMA rhythm

        sb.append("TRLR,3\n");
        return sb.toString();
    }

    /** One fixed-width FACL row laid out exactly per CibFixedWidthParser.FACL_FIELDS. */
    private static String facility(long seed, int idx, String code, String name,
                                   String type, long limit, long outstanding,
                                   long overdue, long installment, int dpd,
                                   String classification, String lastPay, String track) {
        // deterministic ±jitter per facility so subjects differ but are stable
        long j = (seed >> (idx * 3)) % 50_000_00L;
        long lim = limit + j, out = outstanding + j / 2;
        return "FACL" + pad(code, 10) + pad(name, 30) + pad(type, 12)
                + pad(Long.toString(lim), 15) + pad(Long.toString(out), 15)
                + pad(Long.toString(overdue), 15) + pad(Long.toString(installment), 15)
                + pad(Integer.toString(dpd), 5) + pad(classification, 6)
                + pad(lastPay, 8) + track + '\n';
    }

    private static String pad(String value, int width) {
        if (value.length() > width) return value.substring(0, width);
        // amounts zero-padded (numeric fields), text space-padded
        return value.matches("\\d+") && value.length() < width
                ? "0".repeat(width - value.length()) + value
                : value + " ".repeat(width - value.length());
    }
}

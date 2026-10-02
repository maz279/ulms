package com.uslbd.ulms.assessment;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Internal scorecard (03 mod-assessment, "score versioning"): factors are
 * data in code with an explicit VERSION stamped on every result — changing a
 * weight bumps VERSION and old results stay interpretable. P5 moves the
 * table to per-bank config (00 §P7 multi-bank).
 *
 * v2 factors: worst CIB classification, DBR band, collateral coverage, tenor.
 * Scale 300–900 (base 500); grade A≥760, B≥660, C≥560, else D.
 * Decision: DBR>50% or grade D → AUTO_DECLINE; grade A → AUTO_PASS; else REFER.
 */
public final class ScoringPolicy {

    public static final int VERSION = 2;

    public record Outcome(int score, String grade, String decision, Map<String, Object> factors) {}

    private ScoringPolicy() {}

    public static Outcome evaluate(String worstCibClassification, BigDecimal dbrPercent,
                                    long collateralValueMinor, long principalMinor, int tenorMonths) {
        Map<String, Object> factors = new LinkedHashMap<>();
        int score = 500;

        int cib = switch (worstCibClassification == null ? "NONE" : worstCibClassification) {
            case "STD-0", "NONE" -> 30;
            case "STD-1", "STD-2" -> 20;
            case "SMA" -> 0;
            case "SS" -> -60;
            case "DF" -> -120;
            case "BL" -> -200;
            default -> 0;
        };
        factors.put("cibClass", Map.of("value", worstCibClassification == null ? "NONE" : worstCibClassification, "points", cib));
        score += cib;

        int dbrPts;
        if (dbrPercent == null) dbrPts = 0;
        else if (dbrPercent.compareTo(new BigDecimal("30")) <= 0) dbrPts = 80;
        else if (dbrPercent.compareTo(new BigDecimal("40")) <= 0) dbrPts = 60;
        else if (dbrPercent.compareTo(new BigDecimal("50")) <= 0) dbrPts = 30;
        else dbrPts = -150;
        factors.put("dbrBand", Map.of("value", dbrPercent == null ? "n/a" : dbrPercent.toPlainString() + "%", "points", dbrPts));
        score += dbrPts;

        int cov;
        if (principalMinor <= 0) cov = 0;
        else if (collateralValueMinor >= principalMinor) cov = 60;          // ≥100% coverage
        else if (collateralValueMinor * 2 >= principalMinor) cov = 30;      // ≥50%
        else cov = 0;
        factors.put("collateralCoverage", Map.of("ratio", principalMinor <= 0 ? 0
                : BigDecimal.valueOf(collateralValueMinor * 100)
                        .divide(BigDecimal.valueOf(principalMinor), 0, java.math.RoundingMode.HALF_UP)
                        .toPlainString() + "%", "points", cov));
        score += cov;

        int ten = tenorMonths <= 36 ? 20 : tenorMonths <= 60 ? 10 : 0;
        factors.put("tenor", Map.of("value", tenorMonths + "m", "points", ten));
        score += ten;

        score = Math.max(300, Math.min(900, score));
        // R10 calibration fix: bands mapped to the reachable pilot scale
        // (max achievable = 500 base + 190 points = 690) — 760+ was dead code
        String grade = score >= 680 ? "A" : score >= 620 ? "B" : score >= 540 ? "C" : "D";
        boolean overDbr = dbrPercent != null && dbrPercent.compareTo(new BigDecimal("50")) > 0;
        String decision = (overDbr || "D".equals(grade)) ? "AUTO_DECLINE"
                : "A".equals(grade) ? "AUTO_PASS" : "REFER";
        return new Outcome(score, grade, decision, factors);
    }
}

package com.uslbd.ulms.compliance;

import java.time.LocalDate;
import java.time.YearMonth;

/**
 * IFRS-9 ECL runway model (P4 / 03 mod-compliance, 12 §2 risk 9): BRPD stage →
 * IFRS-9 stage mapping with pilot PD/LGD calibration, pure and table-tested.
 * This is the runway — the model fields exist now so the Dec 2027 statement is
 * assembly-only; calibration is replaced with the bank's own estimates at UAT.
 *
 * <ul>
 *   <li>IFRS stage 1 (performing): STD-0, STD-1 — 12-month ECL</li>
 *   <li>IFRS stage 2 (significant increase in credit risk): STD-2, SMA — lifetime ECL</li>
 *   <li>IFRS stage 3 (credit-impaired): SS, DF, B/L — lifetime ECL</li>
 * </ul>
 */
public final class EclModel {

    private EclModel() {}

    /** Mandatory IFRS-9 adoption date (BRPD/BB — runway end). */
    public static final LocalDate MANDATORY_FROM = LocalDate.of(2027, 12, 31);

    /** Pilot LGD — unsecured retail (secured books carry lower LGD at UAT calibration). */
    public static final int LGD_BP = 4_500;

    /** Pilot PD calibration by BRPD class (bp). Lifetime basis for stages 2–3. */
    static int pdBp(String brpdStage) {
        return switch (brpdStage) {
            case "STD-0" -> 100;
            case "STD-1" -> 150;
            case "STD-2" -> 300;
            case "SMA" -> 800;
            case "SS" -> 2_000;
            case "DF" -> 4_000;
            case "B/L" -> 9_000;
            default -> throw new IllegalArgumentException("Unknown BRPD stage " + brpdStage);
        };
    }

    /** IFRS-9 stage for a BRPD classification (1 performing · 2 SICR · 3 impaired). */
    public static int ifrsStage(String brpdStage) {
        return switch (brpdStage) {
            case "STD-0", "STD-1" -> 1;
            case "STD-2", "SMA" -> 2;
            case "SS", "DF", "B/L" -> 3;
            default -> throw new IllegalArgumentException("Unknown BRPD stage " + brpdStage);
        };
    }

    /** ECL = EAD × PD × LGD (bp × bp scaled by 10⁸), floor at 0, cap at EAD. */
    public static long eclMinor(long eadMinor, int pdBp, int lgdBp) {
        long ecl = Math.round(eadMinor * (double) pdBp * lgdBp / 100_000_000.0);
        return Math.max(0, Math.min(eadMinor, ecl));
    }

    /** Whole months from {@code today} to the mandatory adoption date (runway). */
    public static long runwayMonths(LocalDate today) {
        return Math.max(0, YearMonth.from(MANDATORY_FROM).compareTo(YearMonth.from(today)) == 0
                ? 0 : java.time.temporal.ChronoUnit.MONTHS.between(YearMonth.from(today), YearMonth.from(MANDATORY_FROM)));
    }
}

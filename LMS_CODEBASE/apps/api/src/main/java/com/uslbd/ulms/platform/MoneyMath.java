package com.uslbd.ulms.platform;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Money math oracles (09 §3) shared by every module — the SAME formula backs
 * the backend services and (mirrored) the web calculators; parity is asserted
 * in tests and e2e. Moved here from OriginationService in P2 so assessment
 * and compliance share it without module cycles.
 */
public final class MoneyMath {

    private MoneyMath() {}

    /** Fixed reducing-balance EMI in minor units: P·i·(1+i)^n / ((1+i)^n − 1). */
    public static long emiMonthly(long principalMinor, int months, BigDecimal annualRate) {
        BigDecimal i = annualRate.divide(BigDecimal.valueOf(12), 12, RoundingMode.HALF_UP);
        BigDecimal pow = BigDecimal.ONE.add(i).pow(months);
        BigDecimal emi = BigDecimal.valueOf(principalMinor)
                .multiply(i).multiply(pow)
                .divide(pow.subtract(BigDecimal.ONE), 0, RoundingMode.HALF_UP);
        return emi.longValue();
    }

    /** DBR percent (1 dp): (existing EMIs + CIB obligations + proposed EMI) / income × 100. */
    public static BigDecimal dbrPercent(long incomeMinor, long existingEmiMinor,
                                        long cibObligationMinor, long proposedEmiMinor) {
        if (incomeMinor <= 0) return null;   // caller decides policy (income required)
        return BigDecimal.valueOf(existingEmiMinor + cibObligationMinor + proposedEmiMinor)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(incomeMinor), 1, RoundingMode.HALF_UP);
    }
}

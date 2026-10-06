package com.uslbd.ulms.compliance;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

/** R10 P-C: classification override floors (CLS-ALGO §1.2) — pure oracle. */
class BrpdOverridesTest {

    static final LocalDate TODAY = LocalDate.of(2026, 10, 2);

    @Test
    void bankruptcyForcesBadLossRegardlessOfDpd() {
        assertThat(BrpdOverrides.effective("STD-0", true, false, null, null, TODAY))
                .isEqualTo("B/L");
        assertThat(BrpdOverrides.effective("SMA", true, true, null, null, TODAY))
                .isEqualTo("B/L");
    }

    @Test
    void legalProceedingsFloorAtLeastSubstandard() {
        assertThat(BrpdOverrides.effective("STD-1", false, true, null, null, TODAY))
                .isEqualTo("SS");
        assertThat(BrpdOverrides.effective("DF", false, true, null, null, TODAY))
                .isEqualTo("DF");   // already worse — unchanged
    }

    @Test
    void recentReschedulePerformingKeepsPreStage() {
        assertThat(BrpdOverrides.effective("STD-0", false, false,
                TODAY.minusMonths(3), "SMA", TODAY)).isEqualTo("SMA");
        // six-month window boundary: exactly 6 months still retains
        assertThat(BrpdOverrides.effective("STD-0", false, false,
                TODAY.minusMonths(6), "SS", TODAY)).isEqualTo("SS");
    }

    @Test
    void recentRescheduleNonPerformingFloorsOneBelowOriginal() {
        // original SMA → floor one worse = SS
        assertThat(BrpdOverrides.effective("SMA", false, false,
                TODAY.minusMonths(2), "SMA", TODAY)).isEqualTo("SS");
        // DPD already worse than the floor stays
        assertThat(BrpdOverrides.effective("DF", false, false,
                TODAY.minusMonths(2), "SMA", TODAY)).isEqualTo("DF");
    }

    @Test
    void staleRescheduleClassifiesOnActualDpd() {
        assertThat(BrpdOverrides.effective("STD-2", false, false,
                TODAY.minusMonths(7), "SS", TODAY)).isEqualTo("STD-2");
    }
}

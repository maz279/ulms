package com.uslbd.ulms.origination;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;

/** R10 P-B: STP grade-tier eligibility (WF-SPEC §4.2) — pure oracle. */
class StpPolicyTest {

    static final Instant NOW = Instant.now();
    static final Instant TWO_YEARS_AGO = NOW.minus(730, ChronoUnit.DAYS);

    @Test
    void tierLimitsByGrade() {
        assertThat(StpPolicy.tierLimitMinor("A")).isEqualTo(500_000_00L);
        assertThat(StpPolicy.tierLimitMinor("B")).isEqualTo(300_000_00L);
        assertThat(StpPolicy.tierLimitMinor("C")).isZero();
        assertThat(StpPolicy.tierLimitMinor("D")).isZero();
    }

    @Test
    void eligibilityMatrix() {
        assertThat(StpPolicy.eligible("retail-personal", 200_000_00L, "B",
                new BigDecimal("22.5"), 0, TWO_YEARS_AGO, NOW)).isTrue();
        assertThat(StpPolicy.eligible("sme-term", 200_000_00L, "A",
                new BigDecimal("22.5"), 0, TWO_YEARS_AGO, NOW)).isFalse();   // product gate
        assertThat(StpPolicy.eligible("retail-personal", 400_000_00L, "B",
                new BigDecimal("22.5"), 0, TWO_YEARS_AGO, NOW)).isFalse();   // above ৳3 L tier
        assertThat(StpPolicy.eligible("retail-personal", 200_000_00L, "C",
                new BigDecimal("22.5"), 0, TWO_YEARS_AGO, NOW)).isFalse();   // grade too weak
        assertThat(StpPolicy.eligible("retail-personal", 200_000_00L, "B",
                new BigDecimal("45"), 0, TWO_YEARS_AGO, NOW)).isFalse();     // yellow DBR band
        assertThat(StpPolicy.eligible("retail-personal", 200_000_00L, "B",
                new BigDecimal("22.5"), 3, TWO_YEARS_AGO, NOW)).isFalse();   // delinquent
        assertThat(StpPolicy.eligible("retail-personal", 200_000_00L, "B",
                new BigDecimal("22.5"), 0, NOW.minus(300, ChronoUnit.DAYS), NOW))
                .isFalse();                                                    // young relationship
    }
}

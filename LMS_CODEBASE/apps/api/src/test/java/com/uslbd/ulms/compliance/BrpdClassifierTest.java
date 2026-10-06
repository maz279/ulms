package com.uslbd.ulms.compliance;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * BRPD 15/2024 classification oracle — decision table with ±1 DPD at every
 * boundary (0/1/30/31/60/61/90/91/180/181/365/366), provision math, and the
 * prototype-calculator parity anchors (SS ৳8.5M → ৳1.7M; B/L → ৳8.5M).
 */
class BrpdClassifierTest {

    @ParameterizedTest(name = "{0} DPD → {1} @ {2}bp")
    @CsvSource({
            "0,   STD-0, 100",
            "1,   STD-1, 100",
            "30,  STD-1, 100",
            "31,  STD-2, 100",
            "60,  STD-2, 100",
            "61,  SMA,  500",
            "90,  SMA,  500",
            "91,  SS,   2000",
            "180, SS,   2000",
            "181, DF,   5000",
            "365, DF,   5000",
            "366, B/L,  10000",
            "900, B/L,  10000",
    })
    void decisionTable(int dpd, String classification, int rateBp) {
        var result = BrpdClassifier.classify(dpd);
        assertThat(result.classification()).isEqualTo(classification);
        assertThat(result.provisionRateBp()).isEqualTo(rateBp);
    }

    @Test
    void boundaryOffByOneIsTheAdjacentClass() {
        assertThat(BrpdClassifier.classify(60).classification()).isEqualTo("STD-2");
        assertThat(BrpdClassifier.classify(61).classification()).isEqualTo("SMA");
        assertThat(BrpdClassifier.classify(90).classification()).isEqualTo("SMA");
        assertThat(BrpdClassifier.classify(91).classification()).isEqualTo("SS");
        assertThat(BrpdClassifier.classify(180).classification()).isEqualTo("SS");
        assertThat(BrpdClassifier.classify(181).classification()).isEqualTo("DF");
        assertThat(BrpdClassifier.classify(365).classification()).isEqualTo("DF");
        assertThat(BrpdClassifier.classify(366).classification()).isEqualTo("B/L");
    }

    @Test
    void interestSuspenseStartsAtSubstandard() {
        assertThat(BrpdClassifier.classify(90).interestSuspense()).isFalse();
        assertThat(BrpdClassifier.classify(91).interestSuspense()).isTrue();   // SS onward (03)
        assertThat(BrpdClassifier.classify(400).interestSuspense()).isTrue();
    }

    @Test
    void provisionMathMatchesPrototypeCalculator() {
        // prototype anchors: SS on ৳85,00,000 → ৳17,00,000 (20%); B/L → 100%
        long outstanding = 850_000_000L;   // ৳85L in minor units
        assertThat(BrpdClassifier.SS.provisionMinor(outstanding)).isEqualTo(170_000_000L);
        assertThat(BrpdClassifier.BL.provisionMinor(outstanding)).isEqualTo(850_000_000L);
        assertThat(BrpdClassifier.SMA.provisionMinor(outstanding)).isEqualTo(42_500_000L);  // 5%
        assertThat(BrpdClassifier.STD_1.provisionMinor(outstanding)).isEqualTo(8_500_000L); // 1%
    }

    @Test
    void calculatorLookupByNameCoversAllClasses() {
        for (String name : new String[]{"STD-0", "STD-1", "STD-2", "SMA", "SS", "DF", "B/L"}) {
            assertThat(BrpdClassifier.byName(name).classification()).isEqualTo(name);
        }
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> BrpdClassifier.byName("XX"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}

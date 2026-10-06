package com.uslbd.ulms.compliance;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Q3.6 — BRPD boundary lock documentation. The classifier is table-driven;
 * this test pins the CURRENT locked boundaries (audit decision D2: DF/B-L
 * boundary = 365 days) AND documents exactly which lines change if the bank's
 * circular Annex diff says otherwise — making the UAT boundary review a
 * 30-minute, two-line change with the golden suite as the safety net.
 */
class BrpdBoundaryLockTest {

    // LOCKED boundaries (D2, Business_logic §24 contradiction #1).
    // If the Annex diff differs, these two constants are the ONLY change:
    static final int DF_UPPER_BOUNDARY_INCLUSIVE = 365;
    static final int BL_LOWER_BOUNDARY_EXCLUSIVE = 365;

    private static final List<int[]> BOUNDARY_CASES = List.of(
            // dpd, expectedClass
            new int[]{0, 0}, new int[]{30, 1}, new int[]{31, 2}, new int[]{60, 2},
            new int[]{61, 3}, new int[]{90, 3}, new int[]{91, 4}, new int[]{180, 4},
            new int[]{181, 5}, new int[]{DF_UPPER_BOUNDARY_INCLUSIVE, 5},
            new int[]{DF_UPPER_BOUNDARY_INCLUSIVE + 1, 6}, new int[]{730, 6});

    @Test
    void classifierMatchesTheLockedBoundariesAtEveryEdge() {
        for (int[] c : BOUNDARY_CASES) {
            var r = BrpdClassifier.classify(c[0]);
            assertThat(r.classification())
                    .as("dpd=%d", c[0])
                    .isEqualTo(expectedName(c[1]));
        }
        // the D2 lock explicitly: DF ends at 365 inclusive, B/L starts above
        assertThat(BrpdClassifier.classify(365).classification()).isEqualTo("DF");
        assertThat(BrpdClassifier.classify(366).classification()).isEqualTo("B/L");
        assertThat(BL_LOWER_BOUNDARY_EXCLUSIVE).isEqualTo(DF_UPPER_BOUNDARY_INCLUSIVE);
    }

    @Test
    void provisionRatesMatchTheCircularTable() {
        assertThat(BrpdClassifier.byName("STD-0").provisionRateBp()).isEqualTo(100);
        assertThat(BrpdClassifier.byName("STD-1").provisionRateBp()).isEqualTo(100);
        assertThat(BrpdClassifier.byName("STD-2").provisionRateBp()).isEqualTo(100);
        assertThat(BrpdClassifier.byName("SMA").provisionRateBp()).isEqualTo(500);
        assertThat(BrpdClassifier.byName("SS").provisionRateBp()).isEqualTo(2_000);
        assertThat(BrpdClassifier.byName("DF").provisionRateBp()).isEqualTo(5_000);
        assertThat(BrpdClassifier.byName("B/L").provisionRateBp()).isEqualTo(10_000);
    }

    @Test
    void annexDiffProcedureIsMechanical() {
        // UAT action: if the bank's Annex says the DF/B-L boundary is, e.g.,
        // 360: change DF_UPPER_BOUNDARY_INCLUSIVE/BL_LOWER_BOUNDARY_EXCLUSIVE
        // here AND the two comparison lines in BrpdClassifier.classify, then
        // update these expected pairs. The suite fails loudly until both move
        // together — no silent drift.
        int boundaryFromCode = boundarySeenInClassifier();
        assertThat(boundaryFromCode)
                .as("classifier boundary must equal the locked constant")
                .isEqualTo(DF_UPPER_BOUNDARY_INCLUSIVE);
    }

    private static int boundarySeenInClassifier() {
        int dpd = 181;
        while (!"B/L".equals(BrpdClassifier.classify(dpd).classification())) dpd++;
        return dpd - 1;
    }

    private static String expectedName(int idx) {
        return switch (idx) {
            case 0 -> "STD-0"; case 1 -> "STD-1"; case 2 -> "STD-2"; case 3 -> "SMA";
            case 4 -> "SS"; case 5 -> "DF"; default -> "B/L";
        };
    }
}

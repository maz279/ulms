package com.uslbd.ulms.integration.cib;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Golden fixture suite for the pure fixed-width parser (11 §1: valid,
 * malformed, partial-file). No Spring — pure function under test. Fixtures
 * are built with EXPLICIT field widths mirroring the bank file layout, so a
 * miscounted offset shows up as a failed assertion, not a broken fixture.
 */
class CibFixedWidthParserTest {

    /** FACL row builder — the layout contract: 10/30/12/15×4/5/6/8/24 fields. */
    static String facl(String code, String name, String type, long limit, long outstanding,
                       long overdue, long installment, int dpd, String cls, String lastPay,
                       String track24) {
        return "FACL" + "%-10s%-30s%-12s%015d%015d%015d%015d%05d%-6s%s%s".formatted(
                code, name, type, limit, outstanding, overdue, installment, dpd, cls, lastPay,
                track24);
    }

    @Test
    void goldenValidFileParsesCompletely() {
        String valid = """
                HDR,2026-09,FILE-0001
                SUBJ,CIF-100871,Md. Rafiqul Islam
                %s
                %s
                TRLR,2
                """.formatted(
                facl("DBBL001", "Dutch-Bangla Bank Ltd.", "TERM",
                        500_000_000L, 310_000_000L, 0L, 4_500_000L, 0, "STD-0", "20260915",
                        "0".repeat(24)),
                facl("EBL0002", "Eastern Bank Ltd.", "CC",
                        200_000_000L, 80_000_000L, 4_000_000L, 2_500_000L, 75, "SMA", "20260901",
                        "0".repeat(12) + "1".repeat(6) + "0".repeat(6)));

        var parsed = CibFixedWidthParser.parse(valid);
        assertThat(parsed.period()).isEqualTo("2026-09");
        assertThat(parsed.fileId()).isEqualTo("FILE-0001");
        assertThat(parsed.cifNo()).isEqualTo("CIF-100871");
        assertThat(parsed.subjectName()).isEqualTo("Md. Rafiqul Islam");
        assertThat(parsed.facilities()).hasSize(2);
        assertThat(parsed.quarantinedRaw()).isEmpty();

        var first = parsed.facilities().get(0);
        assertThat(first.lenderCode()).isEqualTo("DBBL001");
        assertThat(first.lenderName()).isEqualTo("Dutch-Bangla Bank Ltd.");
        assertThat(first.facilityType()).isEqualTo("TERM");
        assertThat(first.limitMinor()).isEqualTo(500_000_000L);      // ৳50L
        assertThat(first.outstandingMinor()).isEqualTo(310_000_000L);
        assertThat(first.overdueMinor()).isZero();
        assertThat(first.installmentMinor()).isEqualTo(4_500_000L);  // ৳45,000
        assertThat(first.dpd()).isZero();
        assertThat(first.classification()).isEqualTo("STD-0");
        assertThat(first.lastPaymentDate()).isEqualTo("20260915");
        assertThat(first.repaymentTrack()).isEqualTo("0".repeat(24));   // spotless 24m rhythm

        var second = parsed.facilities().get(1);
        assertThat(second.overdueMinor()).isEqualTo(4_000_000L);
        assertThat(second.dpd()).isEqualTo(75);
        assertThat(second.classification()).isEqualTo("SMA");
        assertThat(second.repaymentTrack()).endsWith("1".repeat(6) + "0".repeat(6));   // SMA rhythm
    }

    @Test
    void invalidRepaymentTrackIsQuarantined() {
        String badTrack = """
                HDR,2026-09,FILE-0009
                SUBJ,CIF-100871,Md. Rafiqul Islam
                %s
                TRLR,0
                """.formatted(facl("DBBL001", "Dutch-Bangla Bank Ltd.", "TERM",
                500_000_000L, 310_000_000L, 0L, 4_500_000L, 0, "STD-0", "20260915",
                "ABC"));   // not 0/1/2 digits
        var parsed = CibFixedWidthParser.parse(badTrack);
        assertThat(parsed.facilities()).isEmpty();
        assertThat(parsed.quarantinedRaw()).hasSize(1);
    }

    @Test
    void malformedRowIsQuarantinedAndParsingContinues() {
        String malformed = """
                HDR,2026-09,FILE-0002
                SUBJ,CIF-100872,Nusrat Jahan
                FACLXXX                                                     NOT-NUMERIC      STD-0 20260901
                %s
                TRLR,1
                """.formatted(facl("EBL0002", "Eastern Bank Ltd.", "CC",
                200_000_000L, 80_000_000L, 0L, 2_500_000L, 0, "STD-0", "20260901",
                "0".repeat(24)));

        var parsed = CibFixedWidthParser.parse(malformed);
        assertThat(parsed.facilities()).hasSize(1);              // good row survived
        assertThat(parsed.quarantinedRaw()).hasSize(1);          // bad row quarantined, not dropped
    }

    @Test
    void truncatedFacilityRowIsQuarantined() {
        String truncated = """
                HDR,2026-09,FILE-0002B
                SUBJ,CIF-100872,Nusrat Jahan
                FACLEBL0002  Eastern Bank Ltd.
                TRLR,0
                """;
        var parsed = CibFixedWidthParser.parse(truncated);
        assertThat(parsed.facilities()).isEmpty();
        assertThat(parsed.quarantinedRaw()).hasSize(1);          // row too short → quarantine
    }

    @Test
    void partialFileFailsLoudlyOnTrailerMismatch() {
        String partial = """
                HDR,2026-09,FILE-0003
                SUBJ,CIF-100873,Salma Khatun
                %s
                TRLR,5
                """.formatted(facl("EBL0002", "Eastern Bank Ltd.", "CC",
                200_000_000L, 80_000_000L, 0L, 2_500_000L, 0, "STD-0", "20260901",
                "0".repeat(24)));

        assertThatThrownBy(() -> CibFixedWidthParser.parse(partial))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("TRLR count 5")
                .hasMessageContaining("parsed facilities 1");   // never silently drops subjects
    }

    @Test
    void missingHeaderOrSubjectFails() {
        assertThatThrownBy(() -> CibFixedWidthParser.parse("FACLshort\nTRLR,0"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("missing HDR or SUBJ");
    }

    @Test
    void mockAdapterRoundTripsThroughTheRealParser() {
        var raw = new CibMockAdapter().pullReport("CIF-777001", "2026-09");
        var parsed = CibFixedWidthParser.parse(raw);
        assertThat(parsed.cifNo()).isEqualTo("CIF-777001");
        assertThat(parsed.facilities()).hasSize(3);
        assertThat(parsed.facilities()).allSatisfy(f -> {
            assertThat(f.lenderCode()).isNotBlank();
            assertThat(f.outstandingMinor()).isPositive();
            assertThat(f.repaymentTrack()).hasSize(24).matches("[012]{24}");
        });
        // deterministic: same CIF → identical bytes (fixture stability)
        assertThat(new CibMockAdapter().pullReport("CIF-777001", "2026-09")).isEqualTo(raw);
    }
}

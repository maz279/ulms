package com.uslbd.ulms.compliance;

import com.uslbd.ulms.integration.cib.CibFileWriter;
import com.uslbd.ulms.integration.cib.CibFixedWidthParser;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * P4 pure-model decision tables: BB submission calendar math, the IFRS-9 ECL
 * runway model, Basel CAR weights, and the CIB fixed-width writer's
 * round-trip through the parser (writer IS the parser's inverse).
 */
class RegconModelTest {

    // ── RegconCatalog ─────────────────────────────────────────────────────

    @Test
    void monthlyDueRollsToNextMonthAndSkipsToday() {
        assertThat(RegconCatalog.nextDue("CL-1", LocalDate.of(2026, 9, 30)))
                .isEqualTo(LocalDate.of(2026, 10, 10));       // this month's 10th already passed
        assertThat(RegconCatalog.nextDue("CL-1", LocalDate.of(2026, 10, 10)))
                .isEqualTo(LocalDate.of(2026, 11, 10));       // due day itself → next cycle
        assertThat(RegconCatalog.nextDue("CL-1", LocalDate.of(2026, 10, 1)))
                .isEqualTo(LocalDate.of(2026, 10, 10));
        assertThat(RegconCatalog.nextDue("CIB-S", LocalDate.of(2026, 9, 30)))
                .isEqualTo(LocalDate.of(2026, 10, 5));
        assertThat(RegconCatalog.nextDue("EDW", LocalDate.of(2026, 9, 30)))
                .isEqualTo(LocalDate.of(2026, 10, 12));
    }

    @Test
    void quarterlyAndAnnualDues() {
        // quarterlies fall the month after quarter end: Q3 (Jul–Sep) → Oct, Q4 → Jan
        assertThat(RegconCatalog.nextDue("CAR", LocalDate.of(2026, 9, 30)))
                .isEqualTo(LocalDate.of(2026, 10, 15));
        assertThat(RegconCatalog.nextDue("CAR", LocalDate.of(2026, 10, 15)))
                .isEqualTo(LocalDate.of(2027, 1, 15));
        assertThat(RegconCatalog.nextDue("CAR", LocalDate.of(2026, 1, 15)))
                .isEqualTo(LocalDate.of(2026, 4, 15));
        assertThat(RegconCatalog.nextDue("LLF", LocalDate.of(2026, 9, 30)))
                .isEqualTo(LocalDate.of(2026, 10, 20));
        assertThat(RegconCatalog.nextDue("ECL", LocalDate.of(2026, 9, 30)))
                .isEqualTo(LocalDate.of(2026, 12, 31));
        assertThat(RegconCatalog.nextDue("ECL", LocalDate.of(2026, 12, 31)))
                .isEqualTo(LocalDate.of(2027, 12, 31));
    }

    @Test
    void continuousChannelNeverAges() {
        assertThat(RegconCatalog.nextDue("CIB-R", LocalDate.of(2026, 9, 30))).isNull();
        assertThat(RegconCatalog.byCode("CIB-R").isCalendar()).isFalse();
        assertThatThrownBy(() -> RegconCatalog.byCode("CL-9"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unknown return code");
    }

    @Test
    void calendarIsChronologicalAndCoversTheHorizon() {
        var dues = RegconCatalog.upcoming(LocalDate.of(2026, 9, 30), 3);
        assertThat(dues).isNotEmpty();
        assertThat(dues).allSatisfy(d -> assertThat(d.dueDate())
                .isAfter(LocalDate.of(2026, 9, 30))
                .isBeforeOrEqualTo(LocalDate.of(2026, 12, 30)));
        // none for the continuous channel
        assertThat(dues).noneMatch(d -> d.code().equals("CIB-R"));
        // within October: CIB 5th (×2), CL 10th (×5), EDW 12th, CAR 15th, LLF 20th,
        // SCH-BR-4 10th + SCH-BR-1/2/3/5/6 15th (R10 P-F) = 16
        assertThat(dues.stream().filter(d -> d.dueDate().getMonthValue() == 10).count())
                .isEqualTo(16);
    }

    @Test
    void periodOfDueDateIsThePriorMonth() {
        assertThat(RegconCatalog.periodOf(LocalDate.of(2026, 10, 10))).isEqualTo("2026-09");
        assertThat(RegconCatalog.periodOf(LocalDate.of(2026, 10, 5))).isEqualTo("2026-09");
    }

    // ── EclModel ──────────────────────────────────────────────────────────

    @Test
    void eclStageMapAndPdCalibration() {
        assertThat(EclModel.ifrsStage("STD-0")).isEqualTo(1);
        assertThat(EclModel.ifrsStage("STD-1")).isEqualTo(1);
        assertThat(EclModel.ifrsStage("STD-2")).isEqualTo(2);
        assertThat(EclModel.ifrsStage("SMA")).isEqualTo(2);
        assertThat(EclModel.ifrsStage("SS")).isEqualTo(3);
        assertThat(EclModel.ifrsStage("DF")).isEqualTo(3);
        assertThat(EclModel.ifrsStage("B/L")).isEqualTo(3);
        assertThatThrownBy(() -> EclModel.pdBp("XX")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void eclMathIsPdTimesLgdTimesEad() {
        // SS: 20% PD × 45% LGD on ৳10L = ৳90,000 (9% of EAD)
        assertThat(EclModel.eclMinor(100_000_000L, 2_000, 4_500)).isEqualTo(9_000_000L);
        // B/L: 90% × 45% = 40.5% of EAD
        assertThat(EclModel.eclMinor(100_000_000L, 9_000, 4_500)).isEqualTo(40_500_000L);
        // capped at EAD even with extreme inputs
        assertThat(EclModel.eclMinor(100L, 10_000, 10_000)).isEqualTo(100L);
        assertThat(EclModel.eclMinor(100L, 0, 4_500)).isZero();
    }

    @Test
    void runwayCountsMonthsToDecember2027() {
        assertThat(EclModel.MANDATORY_FROM).isEqualTo(LocalDate.of(2027, 12, 31));
        assertThat(EclModel.runwayMonths(LocalDate.of(2026, 9, 30))).isEqualTo(15);
        assertThat(EclModel.runwayMonths(LocalDate.of(2027, 12, 31))).isZero();
        assertThat(EclModel.runwayMonths(LocalDate.of(2028, 6, 30))).isZero();   // never negative
    }

    // ── BaselCar ──────────────────────────────────────────────────────────

    @Test
    void rwaWeightsAndCarMath() {
        // ৳10L in each of the 7 classes → RWA = 10L × (0.75×3 + 1.0 + 1.5 + 1.75 + 2.5) = ৳90L
        var byClass = new java.util.LinkedHashMap<String, Long>();
        for (String c : new String[]{"STD-0", "STD-1", "STD-2", "SMA", "SS", "DF", "B/L"}) {
            byClass.put(c, 100_000_000L);
        }
        assertThat(BaselCar.rwaMinor(byClass)).isEqualTo(900_000_000L);
        // capital ৳10Cr on that RWA → CAR = 10000×1e9/9e8 = 11111bp ≈ 111.1%
        int car = BaselCar.carBp(1_000_000_000L, 900_000_000L);
        assertThat(car).isEqualTo(11_111);
        assertThat(BaselCar.bufferBp(car)).isEqualTo(11_111 - 1_250);
        // breach case: ৳1Cr capital → CAR 1111bp, below the floor → negative buffer
        assertThat(BaselCar.bufferBp(BaselCar.carBp(100_000_000L, 900_000_000L))).isNegative();
        // empty book guards
        assertThat(BaselCar.carBp(1L, 0)).isEqualTo(Integer.MAX_VALUE);
        assertThatThrownBy(() -> BaselCar.riskWeightBp("XX"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ── CibFileWriter round-trip ──────────────────────────────────────────

    @Test
    void subjectFileRoundTripsThroughTheParser() {
        var fac = new CibFileWriter.FacilityLineRaw("ULMS01", "ULMS Bank (Pilot)", "TERM LOAN",
                150_000_000L, 120_000_000L, 12_500_000L, 13_500_000L, 95, "SS",
                "20260914", "2".repeat(11) + "0".repeat(13));
        String file = CibFileWriter.subjectFile("2026-09", "ULMS-S-2026-09-30",
                List.of(new CibFileWriter.Subject("CIF-0001", "Rahim Uddin", List.of(fac))));

        String[] lines = file.split("\n");
        assertThat(lines[0]).startsWith("HDR,2026-09,ULMS-S-2026-09-30");
        assertThat(lines[1]).startsWith("SUBJ,CIF-0001,Rahim Uddin");
        assertThat(lines[2]).hasSize(159);                       // exact FACL width
        assertThat(lines[3]).isEqualTo("TRLR,1");

        CibFixedWidthParser.Parsed parsed = CibFixedWidthParser.parse(file);
        assertThat(parsed.period()).isEqualTo("2026-09");
        assertThat(parsed.cifNo()).isEqualTo("CIF-0001");
        assertThat(parsed.facilities()).hasSize(1);
        var f = parsed.facilities().get(0);
        assertThat(f.lenderCode()).isEqualTo("ULMS01");
        assertThat(f.limitMinor()).isEqualTo(150_000_000L);
        assertThat(f.outstandingMinor()).isEqualTo(120_000_000L);
        assertThat(f.overdueMinor()).isEqualTo(12_500_000L);
        assertThat(f.installmentMinor()).isEqualTo(13_500_000L);
        assertThat(f.dpd()).isEqualTo(95);
        assertThat(f.classification()).isEqualTo("SS");
        assertThat(f.lastPaymentDate()).isEqualTo("20260914");
        assertThat(f.repaymentTrack()).hasSize(24);
        assertThat(parsed.quarantinedRaw()).isEmpty();
    }

    @Test
    void writerRejectsMalformedTracksAndNegativeAmounts() {
        assertThatThrownBy(() -> CibFileWriter.subjectFile("2026-09", "F",
                List.of(new CibFileWriter.Subject("C", "N",
                        List.of(new CibFileWriter.FacilityLineRaw("L", "N", "T",
                                1, 1, 1, 1, 1, "SS", "", "abc"))))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("repaymentTrack");
        assertThatThrownBy(() -> CibFileWriter.subjectFile("2026-09", "F",
                List.of(new CibFileWriter.Subject("C", "N",
                        List.of(new CibFileWriter.FacilityLineRaw("L", "N", "T",
                                -1, 1, 1, 1, 1, "SS", "", "0".repeat(24)))))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("negative");
    }
}

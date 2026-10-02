package com.uslbd.ulms.integration.cib;

import java.util.List;

/**
 * Inbound CIB report files are parsed by {@link CibFixedWidthParser}; this is
 * the OUTBOUND generator (P4 / 03 mod-compliance "CIB report generation"):
 * the Subject file (one SUBJ block per borrowing customer, FACL per facility)
 * and the Contract file (HDR + FACL per contract) ULMS submits to Bangladesh
 * Bank monthly (11 §6). Row layout is the parser's own FACL_FIELDS — the
 * writer is the parser's inverse, and the round-trip is table-tested.
 */
public final class CibFileWriter {

    private CibFileWriter() {}

    /** One facility row per loan in the Subject/Contract files. */
    public record FacilityLineRaw(String lenderCode, String lenderName, String facilityType,
                                  long limitMinor, long outstandingMinor, long overdueMinor,
                                  long installmentMinor, int dpd, String classification,
                                  String lastPaymentDateYYYYMMDD, String repaymentTrack) {}

    /** Subject block: SUBJ header + one FACL row per facility of that customer. */
    public record Subject(String cifNo, String subjectName, List<FacilityLineRaw> facilities) {}

    /** Render the Subject file: HDR / (SUBJ + FACL…)… / TRLR,count. */
    public static String subjectFile(String period, String fileId, List<Subject> subjects) {
        StringBuilder sb = new StringBuilder();
        sb.append("HDR,").append(period).append(',').append(fileId).append('\n');
        int facilities = 0;
        for (Subject s : subjects) {
            sb.append("SUBJ,").append(s.cifNo()).append(',').append(s.subjectName()).append('\n');
            for (FacilityLineRaw f : s.facilities()) {
                sb.append(faclRow(f)).append('\n');
                facilities++;
            }
        }
        sb.append("TRLR,").append(facilities).append('\n');
        return sb.toString();
    }

    /** Render the Contract file: HDR + one FACL per contract (TRLR carries the count). */
    public static String contractFile(String period, String fileId, List<FacilityLineRaw> contracts) {
        StringBuilder sb = new StringBuilder();
        sb.append("HDR,").append(period).append(',').append(fileId).append('\n');
        for (FacilityLineRaw f : contracts) sb.append(faclRow(f)).append('\n');
        sb.append("TRLR,").append(contracts.size()).append('\n');
        return sb.toString();
    }

    /** Fixed-width FACL row exactly per {@link CibFixedWidthParser#FACL_FIELDS} (159 chars). */
    static String faclRow(FacilityLineRaw f) {
        if (f.repaymentTrack() == null || !f.repaymentTrack().matches("[012]{24}")) {
            throw new IllegalArgumentException("repaymentTrack must be 24 digits of 0/1/2");
        }
        StringBuilder row = new StringBuilder(159);
        row.append("FACL");                                              // [0,4) record type
        appendText(row, f.lenderCode(), 10);                            // [4,14)
        appendText(row, f.lenderName(), 30);                            // [14,44)
        appendText(row, f.facilityType(), 12);                          // [44,56)
        appendNum(row, f.limitMinor(), 15);                             // [56,71)
        appendNum(row, f.outstandingMinor(), 15);                       // [71,86)
        appendNum(row, f.overdueMinor(), 15);                           // [86,101)
        appendNum(row, f.installmentMinor(), 15);                       // [101,116)
        appendNum(row, f.dpd(), 5);                                     // [116,121)
        appendText(row, f.classification(), 6);                         // [121,127)
        appendText(row, f.lastPaymentDateYYYYMMDD() == null ? "" : f.lastPaymentDateYYYYMMDD(), 8); // [127,135)
        row.append(f.repaymentTrack());                                 // [135,159)
        if (row.length() != 159) {
            throw new IllegalStateException("FACL row length " + row.length() + " ≠ 159");
        }
        return row.toString();
    }

    private static void appendText(StringBuilder row, String value, int width) {
        String v = value == null ? "" : value.trim();
        if (v.length() > width) v = v.substring(0, width);
        row.append(v);
        row.append(" ".repeat(width - v.length()));
    }

    private static void appendNum(StringBuilder row, long value, int width) {
        if (value < 0) throw new IllegalArgumentException("negative amount in CIB row: " + value);
        String digits = Long.toString(value);
        if (digits.length() > width) throw new IllegalArgumentException("amount overflow " + width + " digits: " + value);
        row.append("0".repeat(width - digits.length())).append(digits);
    }
}

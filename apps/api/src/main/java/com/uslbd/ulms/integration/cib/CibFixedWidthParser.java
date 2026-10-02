package com.uslbd.ulms.integration.cib;

import java.util.List;

/**
 * Pure fixed-width CIB report parser (PLANNING/11 §1, 03 mod-assessment):
 * no I/O, no Spring — table-tested against golden fixtures. Rules:
 *  - HDR carries period + file id; SUBJ carries the subject line.
 *  - FACL rows are fixed-width slices (see FACL_FIELDS); a malformed row is
 *    QUARANTINED and parsing continues (11 §1: never silently dropped).
 *  - TRLR carries the expected facility count; a mismatch FAILS the parse
 *    ("partial file never silently drops subjects").
 */
public final class CibFixedWidthParser {

    private CibFixedWidthParser() {}

    /** Offsets are [start, end) per field, in FACL row order. */
    static final int[][] FACL_FIELDS = {
            {4, 14},    // lenderCode      (10)
            {14, 44},   // lenderName      (30)
            {44, 56},   // facilityType    (12)
            {56, 71},   // limitMinor      (15, zero-padded)
            {71, 86},   // outstandingMinor(15)
            {86, 101},  // overdueMinor    (15)
            {101, 116}, // installmentMinor(15)
            {116, 121}, // dpd             (5)
            {121, 127}, // classification  (6)
            {127, 135}, // lastPaymentDate (8, YYYYMMDD)
            {135, 159}, // repaymentTrack  (24 digits — the monthly rhythm:
                         //   '0' clean · '1' overdue · '2' missed, oldest→latest)
    };

    public record Facility(String lenderCode, String lenderName, String facilityType,
                           Long limitMinor, Long outstandingMinor, Long overdueMinor,
                           Long installmentMinor, Integer dpd, String classification,
                           String lastPaymentDate, String repaymentTrack) {}

    public record Parsed(String period, String fileId, String cifNo, String subjectName,
                         List<Facility> facilities, List<String> quarantinedRaw) {}

    public static Parsed parse(String raw) {
        String period = null, fileId = null, cif = null, subjectName = null;
        List<Facility> facilities = new java.util.ArrayList<>();
        List<String> quarantined = new java.util.ArrayList<>();
        Integer expectedCount = null;

        for (String line : raw.split("\n", -1)) {
            if (line.isBlank()) continue;
            switch (line.substring(0, Math.min(4, line.length()))) {
                case "HDR," -> {
                    String[] p = line.split(",");
                    period = p.length > 1 ? p[1].trim() : null;
                    fileId = p.length > 2 ? p[2].trim() : null;
                }
                case "SUBJ" -> {
                    // SUBJ,<cif>,<name>
                    String[] p = line.split(",", 3);
                    cif = p.length > 1 ? p[1].trim() : null;
                    subjectName = p.length > 2 ? p[2].trim() : null;
                }
                case "FACL" -> {
                    try {
                        facilities.add(parseFacility(line));
                    } catch (RuntimeException e) {
                        quarantined.add(line);   // 11 §1: quarantine + continue
                    }
                }
                case "TRLR" -> {
                    String[] p = line.split(",");
                    if (p.length > 1) expectedCount = Integer.valueOf(p[1].trim());
                }
                default -> quarantined.add(line);   // unknown record type
            }
        }
        if (period == null || cif == null) {
            throw new IllegalArgumentException("CIB parse failed: missing HDR or SUBJ record");
        }
        if (expectedCount != null && expectedCount != facilities.size()) {
            throw new IllegalArgumentException(
                    "CIB parse failed: TRLR count " + expectedCount
                            + " ≠ parsed facilities " + facilities.size() + " (partial file)");
        }
        return new Parsed(period, fileId, cif, subjectName,
                List.copyOf(facilities), List.copyOf(quarantined));
    }

    private static Facility parseFacility(String line) {
        String[] f = new String[FACL_FIELDS.length];
        for (int i = 0; i < FACL_FIELDS.length; i++) {
            int end = Math.min(FACL_FIELDS[i][1], line.length());
            if (FACL_FIELDS[i][0] >= end) {
                throw new IllegalArgumentException("FACL row too short at field " + i);
            }
            f[i] = line.substring(FACL_FIELDS[i][0], end).trim();
        }
        String track = f[10];
        if (!track.isEmpty() && !track.matches("[012]{24}")) {
            throw new IllegalArgumentException("repaymentTrack must be 24 digits of 0/1/2");
        }
        return new Facility(f[0], f[1], f[2],
                numeric(f[3]), numeric(f[4]), numeric(f[5]), numeric(f[6]),
                f[7].isEmpty() ? 0 : Integer.valueOf(f[7]),
                f[8].isEmpty() ? "STD-0" : f[8],
                f[9].isEmpty() ? null : f[9],
                track.isEmpty() ? "0".repeat(24) : track);
    }

    private static Long numeric(String value) {
        if (value == null || value.isEmpty()) return 0L;
        if (!value.matches("\\d+")) {
            throw new IllegalArgumentException("non-numeric amount: " + value);
        }
        return Long.valueOf(value);
    }
}

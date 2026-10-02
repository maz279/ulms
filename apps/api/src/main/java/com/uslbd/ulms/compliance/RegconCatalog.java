package com.uslbd.ulms.compliance;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

/**
 * Bangladesh Bank returns catalog + submission calendar math (P4 / 11 §6, the
 * prototype regcon console as UX contract). Pure — no I/O, table-tested.
 *
 * <p>Frequencies and due days follow the prototype's regcon table: CL series
 * monthly on the 10th, CIB files monthly on the 5th, EDW monthly on the 12th,
 * Basel CAR quarterly on the 15th of the month after quarter-end, large-loan
 * forecast quarterly on the 20th, IFRS-9 ECL annually 31 Dec. CIB real-time
 * is event-driven (continuous) and never appears on the calendar.
 */
public final class RegconCatalog {

    private RegconCatalog() {}

    public enum Frequency { MONTHLY, QUARTERLY, ANNUAL, CONTINUOUS }

    public record Entry(String code, String description, Frequency frequency,
                        int dueDay, String fileFormat) {
        public boolean isCalendar() { return frequency != Frequency.CONTINUOUS; }
    }

    /** The 12-row board (prototype pgRegcon). Order is the display order. */
    public static final List<Entry> CATALOG = List.of(
            new Entry("CL-1", "Classified loan details", Frequency.MONTHLY, 10, "csv"),
            new Entry("CL-2", "Provisioning details", Frequency.MONTHLY, 10, "csv"),
            new Entry("CL-3", "Recovery position", Frequency.MONTHLY, 10, "csv"),
            new Entry("CL-4", "Write-off details", Frequency.MONTHLY, 10, "csv"),
            new Entry("CL-5", "Restructured loans", Frequency.MONTHLY, 10, "csv"),
            new Entry("CIB-S", "CIB Subject file (fixed-width via FTP)", Frequency.MONTHLY, 5, "fixed-width"),
            new Entry("CIB-C", "CIB Contract file (fixed-width via FTP)", Frequency.MONTHLY, 5, "fixed-width"),
            new Entry("CIB-R", "CIB Real-time (event-driven API)", Frequency.CONTINUOUS, 0, "csv"),
            new Entry("CAR", "Basel III capital adequacy return", Frequency.QUARTERLY, 15, "csv"),
            new Entry("EDW", "EDW submission (BB prescribed)", Frequency.MONTHLY, 12, "csv"),
            new Entry("ECL", "IFRS-9 ECL provisioning statement", Frequency.ANNUAL, 31, "csv"),
            new Entry("LLF", "Large loan forecast (BB format)", Frequency.QUARTERLY, 20, "csv"),
            // R10 P-F: SCH-BR series (BASEL §7.1) — quarterly, 15th of the month after quarter-end
            new Entry("SCH-BR-1", "Capital adequacy (SCH-BR-1)", Frequency.QUARTERLY, 15, "csv"),
            new Entry("SCH-BR-2", "Large exposures (SCH-BR-2)", Frequency.QUARTERLY, 15, "csv"),
            new Entry("SCH-BR-3", "Credit concentration (SCH-BR-3)", Frequency.QUARTERLY, 15, "csv"),
            new Entry("SCH-BR-4", "Asset classification (SCH-BR-4)", Frequency.MONTHLY, 10, "csv"),
            new Entry("SCH-BR-5", "Operational risk (SCH-BR-5)", Frequency.QUARTERLY, 15, "csv"),
            new Entry("SCH-BR-6", "Leverage ratio (SCH-BR-6)", Frequency.QUARTERLY, 15, "csv"));

    public static Entry byCode(String code) {
        return CATALOG.stream().filter(e -> e.code().equals(code)).findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Unknown return code " + code + " — catalog: "
                                + CATALOG.stream().map(Entry::code).toList()));
    }

    /**
     * Next due date strictly after {@code today} — the upcoming submission
     * deadline for a return not yet filed for its period. Continuous returns
     * have no due date (null).
     */
    public static LocalDate nextDue(String code, LocalDate today) {
        Entry e = byCode(code);
        return switch (e.frequency()) {
            case CONTINUOUS -> null;
            case MONTHLY -> nextDayOfMonth(today, e.dueDay());
            // submission months follow quarter end by one month (Q3 → Oct for LLF-20; CAR-15 prototype: 15 Jan for Q3)
            case QUARTERLY -> nextInMonths(today, e.dueDay(), new int[]{1, 4, 7, 10});
            case ANNUAL -> nextInMonths(today, e.dueDay(), new int[]{12});
        };
    }

    /** First day-{@code dueDay} strictly after today (clamped to month length). */
    static LocalDate nextDayOfMonth(LocalDate today, int dueDay) {
        LocalDate candidate = today.withDayOfMonth(Math.min(dueDay, today.lengthOfMonth()));
        if (candidate.isAfter(today)) return candidate;
        var next = YearMonth.from(today).plusMonths(1);
        return next.atDay(Math.min(dueDay, next.lengthOfMonth()));
    }

    /** Next {@code dueDay} falling in one of {@code months}, strictly after today. */
    static LocalDate nextInMonths(LocalDate today, int dueDay, int[] months) {
        for (int year = today.getYear(); year <= today.getYear() + 2; year++) {
            for (int m : months) {
                var ym = YearMonth.of(year, m);
                LocalDate candidate = ym.atDay(Math.min(dueDay, ym.lengthOfMonth()));
                if (candidate.isAfter(today)) return candidate;
            }
        }
        throw new IllegalStateException("no due date within 2 years — impossible for valid months");
    }

    /**
     * Upcoming calendar (chronological) — continuous returns excluded. Used by
     * the submission-calendar screen (prototype G3-s2).
     */
    public static List<Due> upcoming(LocalDate today, int months) {
        LocalDate horizon = today.plusMonths(months);
        List<Due> dues = new java.util.ArrayList<>();
        for (Entry e : CATALOG) {
            if (!e.isCalendar()) continue;
            LocalDate d = nextDue(e.code(), today);
            while (d != null && !d.isAfter(horizon)) {
                dues.add(new Due(e.code(), d));
                d = nextDue(e.code(), d);
            }
        }
        dues.sort(java.util.Comparator.comparing(Due::dueDate));
        return List.copyOf(dues);
    }

    public record Due(String code, LocalDate dueDate) {}

    /** Period label (YYYY-MM) a due date belongs to — the pack period. */
    public static String periodOf(LocalDate dueDate) {
        // a monthly return due on the 10th reports on the PRIOR month's data;
        // quarterly/annual returns report on the quarter/year ending the prior month.
        return YearMonth.from(dueDate).minusMonths(1).toString();
    }
}

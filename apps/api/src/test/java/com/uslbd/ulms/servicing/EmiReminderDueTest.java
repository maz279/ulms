package com.uslbd.ulms.servicing;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/** R10 P-A: EMI D-3 due-date derivation — pure oracle. */
class EmiReminderDueTest {

    private static Loan loanDisbursedOn(String isoDate) {
        Loan l = Loan.demo(UUID.randomUUID(), UUID.randomUUID(), "LN-T", 100_000_00L, 0);
        java.lang.reflect.Field f;
        try {
            f = Loan.class.getDeclaredField("disbursedAt");
            f.setAccessible(true);
            f.set(l, Instant.parse(isoDate + "T00:00:00Z"));
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(e);
        }
        return l;
    }

    @Test
    void dueDayIsMonthlyAnniversaryOfFirstEmi() {
        Loan l = loanDisbursedOn("2026-08-15");     // first EMI 2026-09-15
        assertThat(EmiReminderService.nextDueOn(l, LocalDate.of(2026, 9, 12)))
                .isEqualTo(LocalDate.of(2026, 9, 15));
        assertThat(EmiReminderService.nextDueOn(l, LocalDate.of(2026, 9, 15)))
                .isEqualTo(LocalDate.of(2026, 9, 15));   // due today = today
        assertThat(EmiReminderService.nextDueOn(l, LocalDate.of(2026, 9, 16)))
                .isEqualTo(LocalDate.of(2026, 10, 15));
    }

    @Test
    void undischargedAndClosedLoansHaveNoReminder() {
        Loan undated = Loan.demo(UUID.randomUUID(), UUID.randomUUID(), "LN-T", 1L, 0);
        try {   // undated mirror row — no reminder possible
            java.lang.reflect.Field f = Loan.class.getDeclaredField("disbursedAt");
            f.setAccessible(true); f.set(undated, null);
        } catch (ReflectiveOperationException e) { throw new IllegalStateException(e); }
        assertThat(EmiReminderService.nextDueOn(undated, LocalDate.of(2026, 10, 2))).isNull();
        Loan closed = loanDisbursedOn("2026-08-15");
        closed.close();
        assertThat(EmiReminderService.nextDueOn(closed, LocalDate.of(2026, 9, 12))).isNull();
    }
}

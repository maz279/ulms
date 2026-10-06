package com.uslbd.ulms.servicing;

import com.uslbd.ulms.customer.CustomerRepository;
import com.uslbd.ulms.platform.MoneyMath;
import com.uslbd.ulms.platform.outbox.OutboxService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;

/**
 * EMI D-3 reminder job (R10 P-A, URDv2/PLAN-11 §5): three days before the
 * next installment falls due, emit an EMI_REMINDER outbox event — the
 * notification consumer renders + dispatches the SMS through the provider
 * chain. Due-day derivation: monthly anniversary of the first EMI date
 * (disbursement + 1 month), the same anchor the schedule oracle uses.
 */
@Service
public class EmiReminderService {

    private final LoanRepository loans;
    private final CustomerRepository customers;
    private final OutboxService outbox;
    private final boolean schedulerEnabled;

    EmiReminderService(LoanRepository loans, CustomerRepository customers,
                       OutboxService outbox,
                       @Value("${ulms.servicing.emi-reminder-scheduler:true}") boolean schedulerEnabled) {
        this.loans = loans; this.customers = customers;
        this.outbox = outbox; this.schedulerEnabled = schedulerEnabled;
    }

    /** Next due date for a loan (monthly anniversary of first EMI), or null
     *  when undated (not yet disbursed) or already closed. */
    static LocalDate nextDueOn(Loan loan, LocalDate today) {
        if (loan.getDisbursedAt() == null || "CLOSED".equals(loan.getStage())
                || "WRITTEN_OFF".equals(loan.getStage())) return null;
        LocalDate firstEmi = LocalDate.ofInstant(loan.getDisbursedAt(),
                java.time.ZoneId.of("Asia/Dhaka")).plusMonths(1);
        LocalDate due = firstEmi;
        while (due.isBefore(today)) due = due.plusMonths(1);
        return due;
    }

    @Scheduled(cron = "0 0 8 * * *")   // 08:00 Dhaka — ahead of the banking day
    public void daily() {
        if (schedulerEnabled) runOnce(LocalDate.now());
    }

    /** One pass; returns the number of reminders emitted. */
    @Transactional
    public int runOnce(LocalDate today) {
        int emitted = 0;
        for (Loan loan : loans.findAllByStageOrderByDpdDesc("ACTIVE")) {
            LocalDate due = nextDueOn(loan, today);
            if (due == null || ChronoUnit.DAYS.between(today, due) != 3) continue;
            long emi = MoneyMath.emiMonthly(loan.getPrincipalMinor(), loan.getTenorMonths(),
                    BigDecimal.valueOf(loan.getInterestRateBp(), 4));
            String cif = customers.findById(loan.getCustomerId())
                    .map(c -> c.getCifNo()).orElse(null);
            if (cif == null) continue;   // orphan mirror row — nothing to remind
            outbox.emit("loan", loan.getId(), "EMI_REMINDER",
                    Map.of("cif", cif, "amountMinor", emi, "dueOn", due.toString()));
            emitted++;
        }
        return emitted;
    }

    /** Operator view: which loans remind today (drill support). */
    @Transactional(readOnly = true)
    public java.util.List<UUID> remindingLoans(LocalDate today) {
        return loans.findAllByStageOrderByDpdDesc("ACTIVE").stream()
                .filter(l -> {
                    LocalDate due = nextDueOn(l, today);
                    return due != null && ChronoUnit.DAYS.between(today, due) == 3;
                })
                .map(Loan::getId)
                .toList();
    }
}

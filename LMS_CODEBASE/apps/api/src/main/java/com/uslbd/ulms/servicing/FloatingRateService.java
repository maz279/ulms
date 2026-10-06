package com.uslbd.ulms.servicing;

import com.uslbd.ulms.platform.MoneyMath;
import com.uslbd.ulms.platform.audit.AuditService;
import com.uslbd.ulms.platform.outbox.OutboxService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

/**
 * Floating-rate servicing depth (R10 P-E): BLR re-pricing, moratorium
 * (interest capitalization) and top-up (combined exposure). All three
 * regenerate implicitly — schedules are DERIVED from the loan mirror via the
 * shared EMI oracle, so principal/tenor/rate changes flow through untouched.
 */
@Service
public class FloatingRateService {

    private final BlrRateRepository blr;
    private final LoanRepository loans;
    private final AuditService audit;
    private final OutboxService outbox;

    public FloatingRateService(BlrRateRepository blr, LoanRepository loans,
                               AuditService audit, OutboxService outbox) {
        this.blr = blr; this.loans = loans; this.audit = audit; this.outbox = outbox;
    }

    /** Current active BLR in bp (or 0 when unconfigured). */
    @Transactional(readOnly = true)
    public int currentBlrBp() {
        BlrRate row = blr.findTopByActiveTrueOrderByEffectiveFromDesc();
        return row == null ? 0 : row.getRateBp();
    }

    /**
     * Apply a new BLR: every FLOATING loan re-prices to BLR + its spread;
     * each emits RATE_REPRICED (the notification consumer texts the new EMI).
     * FIXED loans are untouched.
     */
    @Transactional
    public RepriceResult applyBlr(int newRateBp, String actor) {
        if (newRateBp <= 0) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "BLR must be positive bp");
        }
        BlrRate row = blr.findById(1).orElseGet(BlrRate::new);
        int from = row.getRateBp();
        row.apply(newRateBp, java.time.LocalDate.now());
        blr.save(row);

        int repriced = 0;
        for (Loan loan : loans.findAll()) {
            if (!"FLOATING".equals(loan.getRateType())) continue;
            loan.reprice(newRateBp + loan.getSpreadBp());
            long emi = MoneyMath.emiMonthly(loan.getPrincipalMinor(), loan.getTenorMonths(),
                    BigDecimal.valueOf(loan.getInterestRateBp(), 4));
            outbox.emit("loan", loan.getId(), "RATE_REPRICED",
                    Map.of("rateBp", loan.getInterestRateBp(), "emiMinor", emi));
            repriced++;
        }
        audit.record(actor, "BLR_APPLIED", "blr_rate", UUID.nameUUIDFromBytes("blr".getBytes()),
                "{\"from\":" + from + ",\"to\":" + newRateBp
                        + ",\"repricedLoans\":" + repriced + "}", UUID.randomUUID());
        return new RepriceResult(from, newRateBp, repriced);
    }

    /**
     * Moratorium: interest for the paused months CAPITALIZES into the
     * outstanding balance (URDv2 UR-SERV-003) — monthly interest on the
     * outstanding at the loan's rate, times the months granted.
     */
    @Transactional
    public Loan grantMoratorium(UUID loanId, int months, String actor) {
        if (months <= 0 || months > 12) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "moratorium must be 1–12 months");
        }
        Loan loan = loans.findById(loanId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "loan not found"));
        if (!"ACTIVE".equals(loan.getStage())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "moratorium applies to ACTIVE loans only");
        }
        long monthlyInterest = Math.round(loan.getOutstandingMinor()
                * loan.getInterestRateBp() / 12.0 / 10_000.0);
        long capitalized = monthlyInterest * months;
        loan.capitalizedMoratorium(months, capitalized);
        audit.record(actor, "MORATORIUM_GRANTED", "loan", loan.getId(),
                "{\"months\":" + months + ",\"capitalizedMinor\":" + capitalized + "}",
                UUID.randomUUID());
        outbox.emit("loan", loan.getId(), "MORATORIUM_GRANTED",
                Map.of("months", months, "capitalizedMinor", capitalized));
        return loan;
    }

    /** Top-up: additional exposure on the running loan — combined schedule
     *  regenerates from the raised principal (Σprincipal invariant holds). */
    @Transactional
    public Loan topUp(UUID loanId, long amountMinor, String actor) {
        if (amountMinor <= 0) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "top-up amount must be positive");
        }
        Loan loan = loans.findById(loanId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "loan not found"));
        if (!"ACTIVE".equals(loan.getStage())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "top-up applies to ACTIVE loans only");
        }
        loan.raise(amountMinor);
        long emi = MoneyMath.emiMonthly(loan.getPrincipalMinor(), loan.getTenorMonths(),
                BigDecimal.valueOf(loan.getInterestRateBp(), 4));
        audit.record(actor, "TOP_UP_GRANTED", "loan", loan.getId(),
                "{\"addedMinor\":" + amountMinor
                        + ",\"principalAfter\":" + loan.getPrincipalMinor() + "}",
                UUID.randomUUID());
        outbox.emit("loan", loan.getId(), "TOP_UP_GRANTED",
                Map.of("addedMinor", amountMinor, "emiMinor", emi));
        return loan;
    }

    public record RepriceResult(int fromBp, int toBp, int repricedLoans) {}
}

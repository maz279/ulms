package com.uslbd.ulms.servicing;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

/** Read-model adapter backing mod-collections' PTP kept-evidence checks. */
@Component
public class PaymentWorkReadModelAdapter implements PaymentWorkReadModel {

    private final PaymentRepository payments;

    PaymentWorkReadModelAdapter(PaymentRepository payments) { this.payments = payments; }

    @Override
    public long totalPaidBetween(UUID loanId, LocalDate from, LocalDate to) {
        Instant fromTs = from.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant toTs = to.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        List<Payment> rows = payments.findAllByLoanIdAndPaidAtBetweenOrderByPaidAtAsc(
                loanId, fromTs, toTs);
        return rows.stream().mapToLong(Payment::getAmountMinor).sum();
    }
}

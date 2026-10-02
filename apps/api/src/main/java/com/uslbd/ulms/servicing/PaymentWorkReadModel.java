package com.uslbd.ulms.servicing;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Payment read model consumed by mod-collections (PTP kept-evidence checks).
 * Defined in servicing (the owning module) so the dependency stays one-way:
 * collections → servicing.
 */
public interface PaymentWorkReadModel {
    long totalPaidBetween(UUID loanId, LocalDate from, LocalDate to);
}

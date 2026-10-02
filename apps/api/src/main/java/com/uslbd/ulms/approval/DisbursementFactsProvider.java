package com.uslbd.ulms.approval;

import java.util.UUID;

/**
 * Facts + stage transition the disbursement flow needs from mod-origination —
 * hexagonal inversion (like assessment's ApplicationFactsProvider) keeps the
 * module graph acyclic: origination implements this, approval consumes it.
 */
public interface DisbursementFactsProvider {

    record DisbursableFacts(UUID applicationId, UUID customerId, String appNo,
                            long amountMinor, String stage, Long fineractLoanId,
                            int tenorMonths, String rateType) {}

    DisbursableFacts disbursementFacts(UUID applicationId);

    /** SANCTION → DISBURSEMENT transition when the disbursement is prepared. */
    void markDisbursementPrepared(UUID applicationId);

    /** DISBURSEMENT-stage application → DISBURSED after a successful Fineract disbursement. */
    void markDisbursed(UUID applicationId);
}

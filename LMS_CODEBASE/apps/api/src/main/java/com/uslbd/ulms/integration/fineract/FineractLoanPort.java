package com.uslbd.ulms.integration.fineract;

/** Loan-account operations (P1 create · P2 approve + disburse). */
public interface FineractLoanPort {

    /** Create a loan account for the Fineract client; returns Fineract loan id. */
    long createLoan(LoanSpec spec);

    /**
     * Approve (if pending) then disburse the loan; returns the disbursement
     * transaction id. Amounts in BDT minor units — the adapter converts to
     * Fineract MAJOR units (৳).
     */
    default long disburseLoan(long fineractLoanId, long amountMinor) {
        throw new UnsupportedOperationException("disburse not implemented by this adapter");
    }

    /**
     * Post a repayment transaction (P3 mod-servicing); returns the transaction
     * id. Minor units in, major units on the wire — adapter converts.
     */
    default long repayLoan(long fineractLoanId, long amountMinor) {
        throw new UnsupportedOperationException("repay not implemented by this adapter");
    }

    /**
     * Waive interest on resolution (P3 mod-collections: "write adjustment
     * transactions on resolution"). Returns the transaction id.
     */
    default long waiveInterest(long fineractLoanId, long amountMinor) {
        throw new UnsupportedOperationException("waive not implemented by this adapter");
    }

    /**
     * Charge a fee on the loan (03 mod-servicing Fineract row:
     * repayment/fee/waiver). Attaches charge definition 1 (ULMS Penalty
     * Fee, seeded in the pilot tenant); returns the loan-charge resource id.
     */
    default long chargeFee(long fineractLoanId, long amountMinor, String chargeName) {
        throw new UnsupportedOperationException("fee not implemented by this adapter");
    }

    record LoanSpec(
            long fineractClientId,
            String productExternalId,   // Fineract product template externalId
            long principalMinor,        // BDT minor units
            int tenorMonths,
            String rateType             // FIXED | FLOATING → Fineract strategy mapping in adapter
    ) {}
}

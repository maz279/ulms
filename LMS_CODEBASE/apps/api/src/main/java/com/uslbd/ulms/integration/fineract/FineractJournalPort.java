package com.uslbd.ulms.integration.fineract;

/**
 * Fineract GL journal entries (P4 audit-G, 03 mod-compliance "JV queue to
 * Fineract GL"). The provision JV is a zero-sum pair — debit provision
 * expense, credit loan-loss reserve — posted to office 1 in BDT.
 */
public interface FineractJournalPort {

    /**
     * Post a balanced two-line journal entry; returns the Fineract transaction
     * id (a string like {@code a2dd5b5f27df}). Amounts in BDT minor units —
     * the adapter converts to Fineract MAJOR units.
     */
    String postJournalEntry(long debitGlAccountId, long creditGlAccountId,
                            long amountMinor, String referenceNumber);
}

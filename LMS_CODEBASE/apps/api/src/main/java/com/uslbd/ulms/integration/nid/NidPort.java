package com.uslbd.ulms.integration.nid;

/**
 * Port to the NIDW / NID e-KYC gateway (PLANNING/03 mod-customer, 11 §2).
 * P1 ships the MOCK (deterministic, no external dependency); UAT swaps the
 * adapter for the NIDW sandbox behind this same interface.
 */
public interface NidPort {

    /** Verify a customer's NID details. Deterministic mock: name/DOB match → VERIFIED. */
    NidResult verify(NidQuery query);

    record NidQuery(String nid, String nameEn, java.time.LocalDate dob) {}

    /** status: VERIFIED | REJECTED | ERROR (ERROR = gateway issue → officer fallback per 11 §2). */
    record NidResult(String status, String referenceId, String matchedNameEn) {
        public static final String VERIFIED = "VERIFIED";
        public static final String REJECTED = "REJECTED";
        public static final String ERROR = "ERROR";
    }
}

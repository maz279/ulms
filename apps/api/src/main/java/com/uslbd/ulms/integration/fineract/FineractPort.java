package com.uslbd.ulms.integration.fineract;

/**
 * Port to the Fineract lending engine (PLANNING/01 ADR-002, PLANNING/11).
 * Domain code depends on THIS interface only — the generated Fineract REST
 * client lives behind the adapter implementation. Upgrading Fineract must
 * never touch domain code.
 */
public interface FineractPort {

    /** Create a client in Fineract; returns Fineract's client id. */
    long createClient(FineractClient client);

    /**
     * Find an existing Fineract client by exact mobileNo. Default: absent
     * (adapters without search keep working; lambdas in tests stay valid).
     * Used by the legacy-link backfill — Fineract enforces globally-unique
     * mobileNo, so a lost ULMS link must be re-attached, never re-created.
     */
    default java.util.Optional<Long> findClientIdByMobile(String mobile) {
        return java.util.Optional.empty();
    }

    record FineractClient(
            String nameEn,
            String nameBn,
            String mobile,
            String branchCode,
            String activeClient            /* "true" — full name for office use */
    ) {}

    /** Raised when Fineract rejects or is unreachable after retries. */
    class FineractUnavailableException extends RuntimeException {
        public FineractUnavailableException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}

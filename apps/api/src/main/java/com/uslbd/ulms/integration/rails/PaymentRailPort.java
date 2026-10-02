package com.uslbd.ulms.integration.rails;

import java.util.List;

/**
 * Port to payment rails (PLANNING/11 §3): bKash / Nagad / BEFTN / card PSP.
 * Portal/redirect model ONLY — no card data ever touches ULMS (06 §5).
 * P3 ships the deterministic SANDBOX mock (no network, no secrets); UAT swaps
 * adapters per rail behind this same interface.
 *
 * <p>Security (P5 audit F5): callers may name a rail ONLY from this allowlist
 * — the rail string flows into checkout URLs, and an open string lets a caller
 * steer borrowers to an attacker host. {@link #requireKnownRail} enforces it
 * at the port boundary so every adapter inherits the gate.
 */
public interface PaymentRailPort {

    /** The rails ULMS integrates (11 §3) — the ONLY accepted `rail` values. */
    java.util.Set<String> RAILS = java.util.Set.of("BKASH", "NAGAD", "ROCKET", "BEFTN", "CARD");

    /** Canonical-or-fail: returns the uppercased rail, or 422 for anything else. */
    static String requireKnownRail(String rail) {
        if (rail == null) throw new IllegalArgumentException("rail is required (one of " + RAILS + ")");
        String canonical = rail.trim().toUpperCase();
        if (!RAILS.contains(canonical)) {
            throw new IllegalArgumentException(
                    "Unknown rail '" + rail + "' — allowed: " + RAILS);
        }
        return canonical;
    }

    /** Create a rail checkout for an intent → redirect URL + rail reference. */
    RailCheckout initiate(String rail, String intentId, long amountMinor);

    record RailCheckout(String railUrl, String railRef) {}

    /** Settlement line from the rail's settlement file (reconciliation input). */
    record SettlementLine(String utr, long amountMinor) {}

    /** Fetch the settlement lines for a date — recon compares vs payment rows. */
    List<SettlementLine> settlementLines(java.time.LocalDate date);
}

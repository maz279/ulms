package com.uslbd.ulms.integration.rails;

import org.springframework.stereotype.Component;

import java.util.List;

/**
 * P3 SANDBOX mock (11 §3): deterministic, no network, no secrets. Checkout
 * URLs are fake redirects; settlement lines mirror the COMPLETED payments
 * passed by the recon job caller (the mock has no bank feed — the caller
 * supplies what "the bank file" said, keeping recon logic testable).
 */
@Component
// mutual exclusion with the live adapter (rails-live flag, R7)
@org.springframework.context.annotation.Profile("!rails-live")
public class SandboxRailAdapter implements PaymentRailPort {

    @Override
    public RailCheckout initiate(String rail, String intentId, long amountMinor) {
        String railRef = rail.toUpperCase() + "-" + intentId.substring(0, 8);
        return new RailCheckout(
                "https://sandbox." + rail.toLowerCase() + ".com/checkout?ref=" + railRef
                        + "&amount=" + amountMinor,
                railRef);
    }

    @Override
    public List<SettlementLine> settlementLines(java.time.LocalDate date) {
        return List.of();   // mock: the recon endpoint accepts the file lines directly
    }
}

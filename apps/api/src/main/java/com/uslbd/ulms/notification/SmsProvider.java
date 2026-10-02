package com.uslbd.ulms.notification;

/**
 * SMS provider port (R10 P-A, SMS-GW): implementations form the fallback
 * CHAIN — the dispatcher tries them in order; the first success wins and an
 * all-fail run marks the delivery FAILED (never silently dropped).
 */
public interface SmsProvider {

    /** Provider id recorded on the delivery audit trail (e.g. "mock", "sslw"). */
    String id();

    /** Send one message; throw on failure so the chain falls through. */
    void send(String to, String body);
}

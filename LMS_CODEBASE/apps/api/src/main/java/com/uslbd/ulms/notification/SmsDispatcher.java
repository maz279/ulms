package com.uslbd.ulms.notification;

import org.springframework.stereotype.Component;

import java.util.List;

/**
 * SMS fallback chain (R10 P-A, SMS-GW): providers are tried in bean order;
 * the first success wins and an all-fail run rethrows so the caller records
 * FAILED (never silently dropped).
 */
@Component
public class SmsDispatcher {

    private final List<SmsProvider> chain;

    public SmsDispatcher(List<SmsProvider> chain) {
        this.chain = chain;
    }

    /** @return the id of the provider that delivered. */
    public String deliver(String to, String body) {
        RuntimeException last = null;
        for (SmsProvider p : chain) {
            try {
                p.send(to, body);
                return p.id();
            } catch (RuntimeException e) {
                last = e;
            }
        }
        throw new IllegalStateException("all SMS providers failed", last);
    }
}

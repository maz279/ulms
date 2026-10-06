package com.uslbd.ulms.integration.fineract;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Finacle CBS live adapter (R7, PLANNING/11 §5): limit loading + GL posting
 * through the bank's Finacle REST facade with the SAGA compensation model —
 * a failed GL post raises (the disbursement flow compensates by reversing
 * the Fineract disbursement). Limit loads are idempotent by limit key.
 * Activated by profile `cbs-live`.
 */
@Component
@org.springframework.context.annotation.Profile("cbs-live")
public class FinacleCbsAdapter {

    private final WebClient http;
    private final String baseUrl;
    private final String token;

    public FinacleCbsAdapter(WebClient.Builder builder,
                             @Value("${ulms.cbs.base-url}") String baseUrl,
                             @Value("${ulms.cbs.token}") String token) {
        this.http = builder.build();
        this.baseUrl = baseUrl; this.token = token;
    }

    /** Idempotent limit load (key = facility limit key; replays return the same ref). */
    public String loadLimit(String limitKey, long amountMinor, String cifNo) {
        var res = http.post()
                .uri(baseUrl + "/finconnector/limits")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("limitKey", limitKey, "amount", amountMinor / 100.0,
                                  "currency", "BDT", "customer", cifNo))
                .retrieve()
                .bodyToMono(FinacleRefResponse.class)
                .retryWhen(Retry.backoff(3, Duration.ofMillis(800)))
                .block();
        if (res == null || res.reference() == null) {
            throw new IllegalStateException("Finacle limit load failed for " + limitKey);
        }
        return res.reference();
    }

    /** GL posting (double-entry pair) — throws on failure so the SAGA compensates. */
    public String postGl(String debitAccount, String creditAccount, long amountMinor, String narration) {
        var res = http.post()
                .uri(baseUrl + "/finconnector/gl")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of(
                        "entries", List.of(
                                Map.of("account", debitAccount, "type", "D", "amount", amountMinor / 100.0),
                                Map.of("account", creditAccount, "type", "C", "amount", amountMinor / 100.0)),
                        "narration", narration))
                .retrieve()
                .bodyToMono(FinacleRefResponse.class)
                .block();
        if (res == null || res.reference() == null) {
            throw new IllegalStateException("Finacle GL post failed — SAGA compensation required");
        }
        return res.reference();
    }

    record FinacleRefResponse(String reference, String status) {}
}

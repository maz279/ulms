package com.uslbd.ulms.integration.rails;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

/**
 * bKash live rail adapter (R7, PLANNING/11 §3): Grant-Token → Create
 * (checkout redirect URL) → signed webhook completes the posting (the
 * existing RailWebhookController verifies HMAC). Redirect model only —
 * no wallet credentials transit ULMS (06 §5).
 * Activated by profile `rails-live`; credentials from env/Vault ONLY.
 */
@Component
@org.springframework.context.annotation.Profile("rails-live")
public class BkashRailAdapter implements PaymentRailPort {

    private final WebClient http;
    private final String base;
    private final String username;
    private final String password;
    private final String appKey;
    private final String appSecret;

    public BkashRailAdapter(WebClient.Builder builder,
                            @Value("${ulms.rails.bkash.base-url}") String base,
                            @Value("${ulms.rails.bkash.username}") String username,
                            @Value("${ulms.rails.bkash.password}") String password,
                            @Value("${ulms.rails.bkash.app-key}") String appKey,
                            @Value("${ulms.rails.bkash.app-secret}") String appSecret) {
        this.http = builder.build();
        this.base = base; this.username = username; this.password = password;
        this.appKey = appKey; this.appSecret = appSecret;
    }

    @Override
    public RailCheckout initiate(String rail, String intentId, long amountMinor) {
        PaymentRailPort.requireKnownRail(rail);
        String token = grantToken();
        var response = http.post()
                .uri(base + "/tokenized/checkout/create")
                .header(HttpHeaders.AUTHORIZATION, token)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of(
                        "mode", "0011",
                        "amount", String.valueOf(amountMinor / 100.0),
                        "currency", "BDT",
                        "intent", "sale"))
                .retrieve()
                .bodyToMono(BkashCreateResponse.class)
                .retryWhen(Retry.backoff(2, Duration.ofMillis(500)))   // rail timeout ladder
                .block();
        if (response == null || response.bkashURL() == null) {
            throw new IllegalStateException("bKash create failed — no redirect URL");
        }
        return new RailCheckout(response.bkashURL(), response.paymentID());
    }

    @Override
    public java.util.List<SettlementLine> settlementLines(java.time.LocalDate date) {
        // R8 recon: bKash settlement arrives via the bank's recon portal SFTP drop —
        // parsed by the recon batch (compliance mod), not pulled per-rail here.
        return java.util.List.of();
    }

    /** Grant token (per-call in P0 — cached when the bank's TTL contract lands). */
    private String grantToken() {
        var res = http.post()
                .uri(base + "/tokenized/checkout/token/grant")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("app_key", appKey, "app_secret", appSecret,
                                  "username", username, "password", password))
                .retrieve()
                .bodyToMono(BkashTokenResponse.class)
                .block();
        if (res == null || res.idToken() == null) {
            throw new IllegalStateException("bKash grant-token failed");
        }
        return res.idToken();
    }

    record BkashTokenResponse(String idToken) {}
    record BkashCreateResponse(String paymentID, String bkashURL) {}
}

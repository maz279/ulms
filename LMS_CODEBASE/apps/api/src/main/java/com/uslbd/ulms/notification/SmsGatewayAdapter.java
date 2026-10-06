package com.uslbd.ulms.notification;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.util.retry.Retry;

import java.time.Duration;

/**
 * SMS gateway live adapter (R7, PLANNING/11 §6): Robi/Airtel generic HTTP
 * shape (SSL Wireless / Bulk SMS BD use the same contract with different
 * base URLs). Replaces the delivered-in-dev mock. Activated by profile
 * `sms-live`; credentials env/Vault ONLY.
 */
@Component
@org.springframework.context.annotation.Profile("sms-live")
public class SmsGatewayAdapter implements SmsProvider {

    private final WebClient http;
    private final String baseUrl;
    private final String apiKey;

    public SmsGatewayAdapter(WebClient.Builder builder,
                            @Value("${ulms.sms.base-url}") String baseUrl,
                            @Value("${ulms.sms.api-key}") String apiKey) {
        this.http = builder.build();
        this.baseUrl = baseUrl; this.apiKey = apiKey;
    }

    public record SmsResult(boolean delivered, String gatewayRef) {}

    @Override
    public String id() { return "sslw"; }

    /** Chain contract: throw on failure so the dispatcher falls through. */
    @Override
    public void send(String maskedRoutingTo, String body) {
        SmsResult r = sendWithRef(maskedRoutingTo, body);
        if (!r.delivered()) {
            throw new IllegalStateException("sms gateway NACK (" + r.gatewayRef() + ")");
        }
    }

    public SmsResult sendWithRef(String maskedRoutingTo, String body) {
        var res = http.post()
                .uri(baseUrl + "/smsapi")
                .header("X-Api-Key", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(java.util.Map.of("to", maskedRoutingTo, "message", body,
                                            "mask", "ABCBANK"))
                .retrieve()
                .bodyToMono(SmsSendResponse.class)
                .retryWhen(Retry.backoff(2, Duration.ofSeconds(1)))
                .block();
        return res == null
                ? new SmsResult(false, null)
                : new SmsResult("SENT".equals(res.status()), res.reference());
    }

    record SmsSendResponse(String status, String reference) {}
}

package com.uslbd.ulms.integration.nid;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;
import reactor.util.retry.Retry;

import java.time.Duration;

/**
 * NIDW live adapter (R7, PLANNING/11 §2): real-time verify with the <5s SLA
 * budget (2s timeout + 1 retry ≈ 4s worst case; ERROR past that routes to
 * the officer-fallback per 11 §2 — the P1 flow already implements it).
 * Activated by profile `nid-live`.
 */
@Component
@org.springframework.context.annotation.Profile("nid-live")
public class NidwAdapter implements NidPort {

    private final WebClient http;

    public NidwAdapter(@Value("${ulms.nidw.base-url}") String baseUrl,
                       @Value("${ulms.nidw.timeout-ms:2000}") long timeoutMs) {
        this.http = WebClient.builder()
                .baseUrl(baseUrl)
                .clientConnector(new ReactorClientHttpConnector(
                        HttpClient.create().responseTimeout(Duration.ofMillis(timeoutMs))))
                .build();
    }

    @Override
    public NidResult verify(NidQuery query) {
        try {
            var response = http.post()
                    .uri("/nid/verify")
                    .bodyValue(query)
                    .retrieve()
                    .bodyToMono(NidwResponse.class)
                    .retryWhen(Retry.backoff(1, Duration.ofMillis(300)))   // 1 retry inside the 5s SLA
                    .block();
            if (response == null) return error();
            return new NidResult(
                    "MATCH".equals(response.status()) ? NidResult.VERIFIED : NidResult.REJECTED,
                    response.referenceId(),
                    response.matchedNameEn());
        } catch (Exception e) {
            return error();   // gateway issue → officer fallback (11 §2)
        }
    }

    private static NidResult error() { return new NidResult(NidResult.ERROR, null, null); }

    record NidwResponse(String status, String referenceId, String matchedNameEn) {}
}

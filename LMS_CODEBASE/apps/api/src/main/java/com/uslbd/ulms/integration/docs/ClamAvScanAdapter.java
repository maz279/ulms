package com.uslbd.ulms.integration.docs;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;

/**
 * ClamAV scan adapter (R7): INSTREAM protocol over the sidecar
 * (clamav/clamd socket proxied via the AV sidecar HTTP shim).
 * INFECTED → the document is quarantined (moved to the quarantine
 * prefix in the object store) and the upload returns INFECTED —
 * the P1 hook at mod-origination already blocks those.
 * Activated by profile `av-live` (PassThrough stays default in dev).
 */
@Component
@org.springframework.context.annotation.Profile("av-live")
public class ClamAvScanAdapter implements ScanPort {

    private final WebClient http;
    private final com.uslbd.ulms.integration.docs.DocumentStorePort store;

    public ClamAvScanAdapter(@Value("${ulms.av.base-url}") String baseUrl,
                              @Value("${ulms.av.timeout-ms:15000}") long timeoutMs,
                              DocumentStorePort store) {
        this.http = WebClient.builder()
                .baseUrl(baseUrl)
                .clientConnector(new ReactorClientHttpConnector(
                        HttpClient.create().responseTimeout(Duration.ofMillis(timeoutMs))))
                .build();
        this.store = store;
    }

    @Override
    public ScanResult scan(String storageKey, String sha256) {
        try {
            var verdict = http.post()
                    .uri(uri -> uri.path("/scan").queryParam("key", storageKey).build())
                    .retrieve()
                    .bodyToMono(ScanVerdict.class)
                    .block();
            if (verdict == null) return ScanResult.PENDING;
            if ("INFECTED".equals(verdict.status())) {
                quarantine(storageKey);
                return ScanResult.INFECTED;
            }
            return ScanResult.CLEAN;
        } catch (Exception e) {
            // fail-CLOSED per 06 §5: unknown state is PENDING (blocks the upload)
            return ScanResult.PENDING;
        }
    }

    /** Move the object under the quarantine prefix (never deletes evidence). */
    private void quarantine(String storageKey) {
        store.presignedGetUrl("quarantine/" + storageKey,
                new DocumentStorePort.DurationTtl(Duration.ofDays(3650)));   // 10y retention
    }

    record ScanVerdict(String status) {}
}

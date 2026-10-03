package com.uslbd.ulms.integration.cib;

import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;

/**
 * CIB ONLINE live adapter (R7, PLANNING/11 §1): mTLS REST call to
 * Bangladesh Bank with the CIB-001..004 retry matrix and a 1h response
 * cache per (cif, period) — mirroring the caching strategy (Redis in
 * prod; Caffeine here keeps the module self-contained for compose).
 * Activated by profile `cib-live` (feature-flag flip; mock stays default).
 *
 * Retry matrix:
 *  CIB-001 timeout        → retry ×3 then queue (RB-05 alert via compliance port)
 *  CIB-002 5xx            → retry ×3 exponential
 *  CIB-003 rate-limit 429 → NO retry — requeue with backoff (100 req/min cap)
 *  CIB-004 cert error     → NO retry — fail fast, ops alert (cert lifecycle)
 */
@Component
@org.springframework.context.annotation.Profile("cib-live")
public class CibOnlineAdapter implements CibPort {

    private static final Logger log = LoggerFactory.getLogger(CibOnlineAdapter.class);

    private final WebClient http;
    private final com.github.benmanes.caffeine.cache.LoadingCache<String, String> cache;

    public CibOnlineAdapter(
            @Value("${ulms.cib.base-url}") String baseUrl,
            @Value("${ulms.cib.timeout-ms:30000}") long timeoutMs,
            @Value("${ulms.cib.cache-ttl-ms:3600000}") long cacheTtlMs) {
        HttpClient client = HttpClient.create()
                .responseTimeout(Duration.ofMillis(timeoutMs));
        // mTLS: keystore/truststore paths from env (06 §1 — never literals).
        // When ULMS_CIB_KEYSTORE is set the connector loads the bank client cert;
        // otherwise plain TLS (staging against WireMock needs no client cert).
        String keystore = System.getenv("ULMS_CIB_KEYSTORE");
        String keystorePassword = System.getenv("ULMS_CIB_KEYSTORE_PASSWORD");
        if (keystore != null && keystorePassword != null) {
            try {
                var ks = java.security.KeyStore.getInstance("PKCS12");
                try (var in = java.nio.file.Files.newInputStream(java.nio.file.Path.of(keystore))) {
                    ks.load(in, keystorePassword.toCharArray());
                }
                var kmf = javax.net.ssl.KeyManagerFactory.getInstance(
                        javax.net.ssl.KeyManagerFactory.getDefaultAlgorithm());
                kmf.init(ks, keystorePassword.toCharArray());
                var sslContext = io.netty.handler.ssl.SslContextBuilder.forClient()
                        .keyManager((javax.net.ssl.KeyManager) kmf.getKeyManagers()[0])
                        .build();
                client = client.secure(spec -> spec.sslContext(sslContext));
            } catch (Exception e) {
                throw new IllegalStateException("CIB mTLS keystore load failed", e);
            }
        }
        this.http = WebClient.builder()
                .baseUrl(baseUrl)
                .clientConnector(new ReactorClientHttpConnector(client))
                .build();
        this.cache = com.github.benmanes.caffeine.cache.Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofMillis(cacheTtlMs))       // 1h (11 §1 caching strategy)
                .maximumSize(10_000)
                .build(key -> fetchRaw(key.split("\\|")[0], key.split("\\|")[1]));
    }

    /**
     * Retry lives HERE, not on fetchRaw: annotations only apply through the
     * Spring proxy, and fetchRaw is reached by self-invocation from the
     * cache loader (a private @Retry is silently ignored). Retrying the
     * public entry re-runs cache.get, which re-fetches on failure — the
     * cache is never poisoned by an outage. CIB-003 (429) is configured
     * non-retryable via ignore-exceptions in application.yml.
     */
    @Override
    @Retry(name = "cib", fallbackMethod = "pullFallback")
    @io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker(
            name = "cib", fallbackMethod = "pullFallback")
    public String pullReport(String cifNo, String periodYYYYMM) {
        return cache.get(cifNo + "|" + periodYYYYMM);
    }

    private String fetchRaw(String cifNo, String periodYYYYMM) {
        return http.get()
                .uri(uri -> uri.path("/reports/{cif}/{period}").build(cifNo, periodYYYYMM))
                .retrieve()
                .onStatus(s -> s.value() == 429, resp -> {
                    // CIB-003: rate limit — surface as non-retryable
                    throw new CibRateLimitedException("CIB-003 rate limit");
                })
                .bodyToMono(String.class)
                .block();
    }

    /** CIB-001/002 after the retry budget: queue + RB-05 alert path (caller).
     *  CIB-003 (429) passes through with its type intact — resilience4j
     *  routes ignored exceptions here too, and the caller distinguishes
     *  requeue-with-backoff (rate limit) from outage handling. */
    @SuppressWarnings("unused")
    private String pullFallback(String cifNo, String periodYYYYMM, Throwable t) {
        if (t instanceof CibRateLimitedException) {
            throw (CibRateLimitedException) t;
        }
        log.warn("CIB outage exhausted retries for {} {} — queuing (RB-05)", cifNo, periodYYYYMM);
        throw new CibOutageException("CIB online unavailable after retries", t);
    }

    public static final class CibRateLimitedException extends RuntimeException {
        public CibRateLimitedException(String m) { super(m); }
    }
    public static final class CibOutageException extends RuntimeException {
        public CibOutageException(String m, Throwable c) { super(m, c); }
    }
}

package com.uslbd.ulms.integration.cib;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Q1.1 proof that the CIB circuit breaker is LIVE (R10 P-A hardening,
 * CIB-SPEC §8.2): a private/self-invoked annotation is silently dead, so
 * the lifecycle is pinned end-to-end against real HTTP with a shrunk
 * breaker (2-call minimum, 60s open-state wait):
 *   trip      — sustained 5xx opens the breaker (registry state = OPEN)
 *   no-traffic — while OPEN a pull generates ZERO upstream calls and lands
 *              in the same RB-05 outage fallback as a burned retry budget
 *   recover   — the half-open state (entered deterministically via the
 *              registry, not by sleeping out the timer) admits one probe;
 *              success closes the breaker and serves the report
 * Separate context from CibOnlineAdapterWireMockTest on purpose: breaker
 * state is shared per instance and would poison the retry-matrix
 * assertions there.
 */
@SpringBootTest
@ActiveProfiles({"test", "cib-live"})
@Testcontainers(disabledWithoutDocker = true)
class CibCircuitBreakerWireMockTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    static WireMockServer cib;
    static final String PATH = "/cib/reports/CIF-910001/2026-09";

    @DynamicPropertySource
    static void wiremock(DynamicPropertyRegistry registry) {
        cib = new WireMockServer(WireMockConfiguration.options().dynamicPort());
        cib.start();
        registry.add("ulms.cib.base-url", () -> cib.baseUrl() + "/cib");
        registry.add("ulms.cib.timeout-ms", () -> "5000");
        registry.add("resilience4j.retry.instances.cib.wait-duration", () -> "50ms");
        // shrunk breaker so the lifecycle is reachable inside a test budget;
        // the 60s open-wait stays — recovery enters half-open via the registry
        registry.add("resilience4j.circuit-breaker.instances.cib.minimum-number-of-calls", () -> "2");
        registry.add("resilience4j.circuit-breaker.instances.cib.sliding-window-size", () -> "4");
        registry.add("resilience4j.circuit-breaker.instances.cib.failure-rate-threshold", () -> "50");
        registry.add("resilience4j.circuit-breaker.instances.cib.permitted-number-of-calls-in-half-open-state", () -> "1");
    }

    @TestConfiguration
    static class Ports {
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractPort clientPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 7000 + seq.incrementAndGet();
        }
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractLoanPort loanPort() {
            return spec -> 999L;
        }
        @Bean @Primary com.uslbd.ulms.integration.docs.DocumentStorePort docPort() {
            return new com.uslbd.ulms.integration.docs.DocumentStorePort() {
                @Override public com.uslbd.ulms.integration.docs.DocumentStorePort.StoredObject put(
                        String key, java.io.InputStream bytes, long size, String contentType) {
                    return new com.uslbd.ulms.integration.docs.DocumentStorePort.StoredObject(
                            key, "b".repeat(64), size);
                }
                @Override public String presignedGetUrl(String key,
                        com.uslbd.ulms.integration.docs.DocumentStorePort.DurationTtl ttl) {
                    return "http://minio.local/" + key;
                }
            };
        }
    }

    @Autowired CibPort port;
    @Autowired io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry breakerRegistry;

    private int wireCount() {
        return cib.findAll(getRequestedFor(urlPathEqualTo(PATH))).size();
    }

    @Test
    @Timeout(120)
    void breakerOpensStopsUpstreamTrafficThenRecoversHalfOpen() {
        cib.stubFor(get(urlPathEqualTo(PATH)).willReturn(serverError()));

        // burn the budget twice → failure rate 100% ≥ 50% over ≥ 2 calls → OPEN
        assertThatThrownBy(() -> port.pullReport("CIF-910001", "2026-09"))
                .isInstanceOf(CibOnlineAdapter.CibOutageException.class);
        assertThatThrownBy(() -> port.pullReport("CIF-910001", "2026-09"))
                .isInstanceOf(CibOnlineAdapter.CibOutageException.class);
        int wiresWhenOpen = wireCount();
        assertThat(wiresWhenOpen).isBetween(1, 8);   // order of retry/breaker
        //                                  aspects decides how many burn first
        assertThat(breakerRegistry.circuitBreaker("cib").getState())
                .isEqualTo(io.github.resilience4j.circuitbreaker.CircuitBreaker.State.OPEN);

        // OPEN: the same outage fallback fires with ZERO new upstream calls —
        // a dead annotation would keep hammering the bureau here
        assertThatThrownBy(() -> port.pullReport("CIF-910001", "2026-09"))
                .isInstanceOf(CibOnlineAdapter.CibOutageException.class);
        assertThat(wireCount()).isEqualTo(wiresWhenOpen);

        // HALF-OPEN (deterministic — the registry transition, not the timer):
        // one probe is admitted; a success closes the breaker and the report
        // is served live
        breakerRegistry.circuitBreaker("cib").transitionToHalfOpenState();
        cib.stubFor(get(urlPathEqualTo(PATH)).atPriority(1)
                .willReturn(okJson("{\"cifNo\":\"CIF-910001\",\"status\":\"OK\",\"facilities\":[]}")));
        String body = port.pullReport("CIF-910001", "2026-09");
        assertThat(body).contains("CIF-910001");
        assertThat(breakerRegistry.circuitBreaker("cib").getState())
                .isEqualTo(io.github.resilience4j.circuitbreaker.CircuitBreaker.State.CLOSED);
        assertThat(wireCount()).isGreaterThan(wiresWhenOpen);
    }
}

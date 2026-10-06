package com.uslbd.ulms.integration.cib;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;
import com.github.tomakehurst.wiremock.stubbing.Scenario;
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
 * R7 contract test for the CIB ONLINE retry matrix (PLANNING/11 §1) against
 * real HTTP. Serves the checked-in contract stubs from
 * src/test/resources/wiremock/cib (period-keyed scenarios) plus two
 * count-controlled scenarios. Before audit round 2 the @Retry sat on a
 * private self-invoked method — silently dead — so this suite now pins:
 *   CIB report 200 + 1h cache (one wire per key)
 *   CIB-003 429  → EXACTLY ONE call, never retried
 *   CIB-002 5xx  → retried (1+3), then the outage fallback fires
 *   flaky 5xx    → retry ladder recovers on the 3rd call
 */
@SpringBootTest
@ActiveProfiles({"test", "cib-live"})
@Testcontainers(disabledWithoutDocker = true)
class CibOnlineAdapterWireMockTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    static WireMockServer cib;

    @DynamicPropertySource
    static void wiremock(DynamicPropertyRegistry registry) {
        cib = new WireMockServer(WireMockConfiguration.options().dynamicPort());
        cib.start();
        // stubs are loaded per-file (not usingFilesUnderDirectory): scanner
        // tooling drops state files under the mappings dir which WireMock's
        // recursive loader then rejects
        stubFromFile("cib-report-ok.json");
        stubFromFile("cib-rate-limited.json");
        registry.add("ulms.cib.base-url", () -> cib.baseUrl() + "/cib");
        registry.add("ulms.cib.timeout-ms", () -> "5000");
        registry.add("resilience4j.retry.instances.cib.wait-duration", () -> "100ms");
    }

    private static void stubFromFile(String name) {
        try {
            String json = java.nio.file.Files.readString(java.nio.file.Path.of(
                    "src/test/resources/wiremock/cib/mappings/" + name));
            cib.addStubMapping(com.github.tomakehurst.wiremock.common.Json.read(
                    json, com.github.tomakehurst.wiremock.stubbing.StubMapping.class));
        } catch (java.io.IOException e) {
            throw new IllegalStateException("cannot read contract stub " + name, e);
        }
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

    @Test
    @Timeout(60)
    void okReportReturnsAndCacheServesTheSecondPull() {
        String body = port.pullReport("CIF-900001", "2026-09");
        assertThat(body).contains("AA").contains("facilities");

        port.pullReport("CIF-900001", "2026-09");   // 1h cache hit — no second wire
        cib.verify(1, getRequestedFor(urlPathEqualTo("/cib/reports/CIF-900001/2026-09")));
    }

    @Test
    @Timeout(60)
    void rateLimit429IsNeverRetried() {
        assertThatThrownBy(() -> port.pullReport("CIF-900002", "2026-08"))
                .isInstanceOf(CibOnlineAdapter.CibRateLimitedException.class);
        cib.verify(1, getRequestedFor(urlPathEqualTo("/cib/reports/CIF-900002/2026-08")));
    }

    @Test
    @Timeout(120)
    void outage5xxBurnsTheRetryBudgetThenFallsBack() {
        cib.stubFor(get(urlPathEqualTo("/cib/reports/CIF-900003/2026-06"))
                .willReturn(serverError()));
        assertThatThrownBy(() -> port.pullReport("CIF-900003", "2026-06"))
                .isInstanceOf(CibOnlineAdapter.CibOutageException.class);
        // 1 attempt + 3 retries (CIB-002 ×3 exponential)
        cib.verify(4, getRequestedFor(urlPathEqualTo("/cib/reports/CIF-900003/2026-06")));
    }

    @Test
    @Timeout(120)
    void flaky5xxRecoversWithinTheRetryLadder() {
        cib.stubFor(get(urlPathEqualTo("/cib/reports/CIF-900004/2026-05"))
                .inScenario("flaky")
                .whenScenarioStateIs(Scenario.STARTED)
                .willReturn(serverError())
                .willSetStateTo("second"));
        cib.stubFor(get(urlPathEqualTo("/cib/reports/CIF-900004/2026-05"))
                .inScenario("flaky")
                .whenScenarioStateIs("second")
                .willReturn(okJson("{\"cifNo\":\"CIF-900004\",\"status\":\"OK\",\"facilities\":[]}")));

        String body = port.pullReport("CIF-900004", "2026-05");
        assertThat(body).contains("CIF-900004");
        cib.verify(2, getRequestedFor(urlPathEqualTo("/cib/reports/CIF-900004/2026-05")));
    }
}

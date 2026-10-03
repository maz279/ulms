package com.uslbd.ulms.integration.nid;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;
import org.junit.jupiter.api.BeforeEach;
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

import java.time.LocalDate;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Q1.2 contract test for the NIDW live adapter (PLANNING/11 §2) against real
 * HTTP: serves the checked-in stub from src/test/resources/wiremock/nidw.
 * Pins the <5s e-KYC SLA budget and the officer-fallback routing:
 *   MATCH   → VERIFIED with NIDW reference + matched name
 *   5xx/out → EXACTLY 2 wire calls (1 attempt + the single in-SLA retry),
 *             adapter swallows and answers ERROR — the P1 flow then routes
 *             the applicant to the officer fallback instead of rejecting.
 * Tests are keyed by distinct `nid` values so journal counts stay precise
 * even though every request hits the same /nid/verify path.
 */
@SpringBootTest
@ActiveProfiles({"test", "nid-live"})
@Testcontainers(disabledWithoutDocker = true)
class NidwAdapterWireMockTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    static WireMockServer nidw;

    @DynamicPropertySource
    static void wiremock(DynamicPropertyRegistry registry) {
        nidw = new WireMockServer(WireMockConfiguration.options().dynamicPort());
        nidw.start();
        // per-file loading: scanner tooling drops state files under mappings/
        // which the recursive files-under-directory loader rejects
        try {
            String json = java.nio.file.Files.readString(java.nio.file.Path.of(
                    "src/test/resources/wiremock/nidw/mappings/nidw-verify-match.json"));
            nidw.addStubMapping(com.github.tomakehurst.wiremock.common.Json.read(
                    json, com.github.tomakehurst.wiremock.stubbing.StubMapping.class));
        } catch (java.io.IOException e) {
            throw new IllegalStateException("cannot read contract stub nidw-verify-match.json", e);
        }
        registry.add("ulms.nidw.base-url", nidw::baseUrl);
    }

    @BeforeEach
    void resetJournal() {
        nidw.resetRequests();   // stubs survive; per-test counts stay exact
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

    @Autowired NidPort port;

    @Test
    @Timeout(5)
    void matchVerifiesWithReferenceAndMatchedName() {
        var result = port.verify(new NidPort.NidQuery(
                "1990123456789", "Md. Rafiqul Islam", LocalDate.of(1990, 1, 15)));

        assertThat(result.status()).isEqualTo(NidPort.NidResult.VERIFIED);
        assertThat(result.referenceId()).startsWith("NIDW-");
        assertThat(result.matchedNameEn()).isEqualTo("Md. Rafiqul Islam");
        nidw.verify(1, postRequestedFor(urlPathEqualTo("/nid/verify"))
                .withRequestBody(matchingJsonPath("$.nid", equalTo("1990123456789"))));
    }

    @Test
    @Timeout(5)
    void gatewayOutageRetriesOnceThenRoutesToOfficerFallback() {
        // "ROUTE-ERROR" fails the file stub's ^[0-9]{10,17}$ pattern, so this
        // stub is the ONLY match for the request — no precedence games
        nidw.stubFor(post(urlPathEqualTo("/nid/verify")).willReturn(serverError()));

        var result = port.verify(new NidPort.NidQuery(
                "ROUTE-ERROR", "Anyone", LocalDate.of(1985, 6, 30)));

        // gateway issue → ERROR (never REJECTED): the P1 flow sends the
        // applicant down the officer-fallback path (11 §2)
        assertThat(result.status()).isEqualTo(NidPort.NidResult.ERROR);
        assertThat(result.referenceId()).isNull();
        assertThat(result.matchedNameEn()).isNull();
        // 1 attempt + the single 300ms-backoff retry — both inside the 5s SLA
        nidw.verify(2, postRequestedFor(urlPathEqualTo("/nid/verify"))
                .withRequestBody(matchingJsonPath("$.nid", equalTo("ROUTE-ERROR"))));
    }

    @Test
    @Timeout(5)
    void nonMatchStatusIsRejectedNotError() {
        nidw.stubFor(post(urlPathEqualTo("/nid/verify"))
                .withRequestBody(matchingJsonPath("$.nid", equalTo("MISMATCH-1")))
                .atPriority(1)
                .willReturn(okJson("{\"status\":\"NO_MATCH\",\"referenceId\":\"NIDW-REF-1\"}")));

        var result = port.verify(new NidPort.NidQuery(
                "MISMATCH-1", "Wrong Name", LocalDate.of(1991, 2, 2)));

        // a definitive NO_MATCH from the bureau is a data decision, not an
        // outage — it must surface as REJECTED so onboarding stops
        assertThat(result.status()).isEqualTo(NidPort.NidResult.REJECTED);
        assertThat(result.referenceId()).isEqualTo("NIDW-REF-1");
        assertThat(result.matchedNameEn()).isNull();
        nidw.verify(1, postRequestedFor(urlPathEqualTo("/nid/verify"))
                .withRequestBody(matchingJsonPath("$.nid", equalTo("MISMATCH-1"))));
    }
}

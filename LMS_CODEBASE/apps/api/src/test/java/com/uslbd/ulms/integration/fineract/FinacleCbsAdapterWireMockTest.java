package com.uslbd.ulms.integration.fineract;

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

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Q1.2 contract test for the Finacle CBS live adapter (PLANNING/11 §5)
 * against real HTTP: serves the checked-in stubs from
 * src/test/resources/wiremock/finacle. Pins the two posting legs and the
 * SAGA compensation contract:
 *   limit load → idempotent POST /finconnector/limits, ACTIVE reference,
 *                retry ladder allowed (3 backoffs)
 *   GL post     → double-entry D/C pair with narration, POSTED reference
 *   GL reject   → 422 surfaces EXACTLY ONCE with no blind retry — the
 *                disbursement SAGA compensates by reversing, never by
 *                re-posting money movements
 */
@SpringBootTest
@ActiveProfiles({"test", "cbs-live"})
@Testcontainers(disabledWithoutDocker = true)
class FinacleCbsAdapterWireMockTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    static WireMockServer fin;

    @DynamicPropertySource
    static void wiremock(DynamicPropertyRegistry registry) {
        fin = new WireMockServer(WireMockConfiguration.options().dynamicPort());
        fin.start();
        stubFromFile("finacle-limit-load.json");
        stubFromFile("finacle-gl-post.json");
        // rejection stub carries priority 1 in the file so it deterministically
        // beats the catch-all gl-post stub for FORCE_FAIL narrations
        stubFromFile("finacle-gl-rejection.json");
        registry.add("ulms.cbs.base-url", fin::baseUrl);
    }

    private static void stubFromFile(String name) {
        try {
            String json = java.nio.file.Files.readString(java.nio.file.Path.of(
                    "src/test/resources/wiremock/finacle/mappings/" + name));
            fin.addStubMapping(com.github.tomakehurst.wiremock.common.Json.read(
                    json, com.github.tomakehurst.wiremock.stubbing.StubMapping.class));
        } catch (java.io.IOException e) {
            throw new IllegalStateException("cannot read contract stub " + name, e);
        }
    }

    @BeforeEach
    void resetJournal() {
        fin.resetRequests();
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

    @Autowired FinacleCbsAdapter adapter;

    @Test
    @Timeout(60)
    void limitLoadIsActiveAndCarriesTheFacilityKey() {
        String reference = adapter.loadLimit("FAC-LIM-001", 250_000, "CIF-77");

        assertThat(reference).startsWith("FIN-LIMIT-");
        fin.verify(1, postRequestedFor(urlPathEqualTo("/finconnector/limits"))
                .withHeader("Authorization", equalTo("Bearer test"))
                .withRequestBody(matchingJsonPath("$.limitKey", equalTo("FAC-LIM-001")))
                .withRequestBody(matchingJsonPath("$.amount", equalTo("2500.0")))
                .withRequestBody(matchingJsonPath("$.customer", equalTo("CIF-77")))
                .withRequestBody(matchingJsonPath("$.currency", equalTo("BDT"))));
    }

    @Test
    @Timeout(60)
    void glPostIsADoubleEntryPairOnOneWireCall() {
        String reference = adapter.postGl("120001002", "210001003", 50_000,
                "disb LN-9 tranche 1");

        assertThat(reference).startsWith("FIN-GL-");
        fin.verify(1, postRequestedFor(urlPathEqualTo("/finconnector/gl"))
                .withRequestBody(matchingJsonPath("$.entries[0].account", equalTo("120001002")))
                .withRequestBody(matchingJsonPath("$.entries[0].type", equalTo("D")))
                .withRequestBody(matchingJsonPath("$.entries[0].amount", equalTo("500.0")))
                .withRequestBody(matchingJsonPath("$.entries[1].account", equalTo("210001003")))
                .withRequestBody(matchingJsonPath("$.entries[1].type", equalTo("C")))
                .withRequestBody(matchingJsonPath("$.entries[1].amount", equalTo("500.0")))
                .withRequestBody(matchingJsonPath("$.narration", containing("LN-9"))));
    }

    @Test
    @Timeout(60)
    void glRejectionSurfacesOnceForSagaCompensation() {
        // 422 (account closed) must propagate so the disbursement flow can
        // reverse its Fineract leg — postGl deliberately has NO retry: a
        // money movement is never blind-retried, only compensated
        assertThatThrownBy(() -> adapter.postGl("120001002", "999999999", 10_000,
                "disb FORCE_FAIL probe"))
                .isInstanceOf(org.springframework.web.reactive.function.client.WebClientResponseException.class)
                .hasMessageContaining("422");
        fin.verify(1, postRequestedFor(urlPathEqualTo("/finconnector/gl"))
                .withRequestBody(matchingJsonPath("$.narration", containing("FORCE_FAIL"))));
    }
}

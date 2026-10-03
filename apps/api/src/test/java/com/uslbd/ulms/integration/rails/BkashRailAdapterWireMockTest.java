package com.uslbd.ulms.integration.rails;

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
 * Q1.2 contract test for the bKash live rail adapter (PLANNING/11 §3)
 * against real HTTP: serves the checked-in stubs from
 * src/test/resources/wiremock/bkash. Pins the redirect-model ladder:
 *   grant-token → Authorization-bearer create → RailCheckout(railUrl, railRef)
 * plus the F5 rail allowlist gate (unknown rail = IllegalArgumentException
 * BEFORE any wire call) and the no-redirect-URL hard failure (money never
 * moves without a checkout URL). Credentials resolve from the inert test
 * profile defaults — no usable secret crosses this suite.
 */
@SpringBootTest
@ActiveProfiles({"test", "rails-live"})
@Testcontainers(disabledWithoutDocker = true)
class BkashRailAdapterWireMockTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    static WireMockServer bk;

    @DynamicPropertySource
    static void wiremock(DynamicPropertyRegistry registry) {
        bk = new WireMockServer(WireMockConfiguration.options().dynamicPort());
        bk.start();
        stubFromFile("bkash-grant-token.json");
        stubFromFile("bkash-create-payment.json");
        registry.add("ulms.rails.bkash.base-url", bk::baseUrl);
    }

    private static void stubFromFile(String name) {
        try {
            String json = java.nio.file.Files.readString(java.nio.file.Path.of(
                    "src/test/resources/wiremock/bkash/mappings/" + name));
            bk.addStubMapping(com.github.tomakehurst.wiremock.common.Json.read(
                    json, com.github.tomakehurst.wiremock.stubbing.StubMapping.class));
        } catch (java.io.IOException e) {
            throw new IllegalStateException("cannot read contract stub " + name, e);
        }
    }

    @BeforeEach
    void resetJournal() {
        bk.resetRequests();   // grant-token bodies are identical across tests
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

    @Autowired PaymentRailPort port;

    @Test
    @Timeout(60)
    void initiateRunsGrantThenCreateLadder() {
        var checkout = port.initiate("bkash", "PAY-INT-1", 150_000);

        assertThat(checkout.railUrl()).startsWith("https://sandbox.bkash.com/checkout");
        assertThat(checkout.railRef()).startsWith("TR bkash-test-");
        // ladder order is implicit (create needs the token) — assert both legs
        bk.verify(1, postRequestedFor(urlPathEqualTo("/tokenized/checkout/token/grant"))
                .withRequestBody(matchingJsonPath("$.app_key", equalTo("test")))
                .withRequestBody(matchingJsonPath("$.username", equalTo("test"))));
        bk.verify(1, postRequestedFor(urlPathEqualTo("/tokenized/checkout/create"))
                .withHeader("Authorization", containing("test-id-token"))
                .withRequestBody(matchingJsonPath("$.amount", equalTo("1500.0")))
                .withRequestBody(matchingJsonPath("$.currency", equalTo("BDT")))
                .withRequestBody(matchingJsonPath("$.intent", equalTo("sale"))));
    }

    @Test
    @Timeout(30)
    void unknownRailIsRejectedBeforeAnyWireCall() {
        // F5 gate: the rail string flows into checkout URLs — only the
        // allowlist may pass, and nothing may touch the wire on failure
        assertThatThrownBy(() -> port.initiate("BITCOIN-LIGHTNING", "PAY-INT-2", 100))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unknown rail");
        bk.verify(0, postRequestedFor(urlPathEqualTo("/tokenized/checkout/token/grant")));
        bk.verify(0, postRequestedFor(urlPathEqualTo("/tokenized/checkout/create")));
    }

    @Test
    @Timeout(60)
    void createWithoutRedirectUrlFailsHard() {
        // amount 777.0 keys this stub apart from the checked-in catch-all;
        // priority 1 keeps it deterministic regardless of registration order
        bk.stubFor(post(urlPathEqualTo("/tokenized/checkout/create"))
                .withRequestBody(matchingJsonPath("$.amount", equalTo("777.0")))
                .atPriority(1)
                .willReturn(okJson("{\"paymentID\":\"TR-NO-URL\",\"status\":\"CREATED\"}")));

        // no bkashURL in the response → the borrower must never be sent on.
        // The rail answered 200 (definitive, no error) — the retry ladder
        // wraps the HTTP exchange, so there is exactly ONE wire call and
        // the hard failure surfaces from the post-parse URL check
        assertThatThrownBy(() -> port.initiate("bkash", "PAY-INT-3", 77_700))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("no redirect URL");
        bk.verify(1, postRequestedFor(urlPathEqualTo("/tokenized/checkout/create"))
                .withRequestBody(matchingJsonPath("$.amount", equalTo("777.0"))));
    }
}

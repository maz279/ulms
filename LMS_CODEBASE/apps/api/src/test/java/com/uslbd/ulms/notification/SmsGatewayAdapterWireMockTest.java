package com.uslbd.ulms.notification;

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
 * Q1.2 contract test for the SMS gateway live adapter (R7, PLANNING/11 §6)
 * against real HTTP: serves the checked-in stub from
 * src/test/resources/wiremock/sms. Pins the delivery + fallback-chain
 * contract:
 *   SENT     → delivered with gateway reference; bank mask + API-key header
 *   NACK     → sendWithRef answers delivered=false and send() THROWS so the
 *              dispatcher falls through to the next provider
 *   all-fail → under sms-live the mock provider is profiled out, so the
 *              chain rethrows — the delivery records FAILED, never silently
 *              dropped (R10 P-A SMS-GW)
 * Negative stubs are keyed by a marker inside the message body and pinned
 * at priority 1 so they beat the catch-all checked-in stub regardless of
 * registration order.
 */
@SpringBootTest
@ActiveProfiles({"test", "sms-live"})
@Testcontainers(disabledWithoutDocker = true)
class SmsGatewayAdapterWireMockTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    static WireMockServer sms;

    @DynamicPropertySource
    static void wiremock(DynamicPropertyRegistry registry) {
        sms = new WireMockServer(WireMockConfiguration.options().dynamicPort());
        sms.start();
        try {
            String json = java.nio.file.Files.readString(java.nio.file.Path.of(
                    "src/test/resources/wiremock/sms/mappings/sms-gateway-send.json"));
            sms.addStubMapping(com.github.tomakehurst.wiremock.common.Json.read(
                    json, com.github.tomakehurst.wiremock.stubbing.StubMapping.class));
        } catch (java.io.IOException e) {
            throw new IllegalStateException("cannot read contract stub sms-gateway-send.json", e);
        }
        registry.add("ulms.sms.base-url", sms::baseUrl);
    }

    @BeforeEach
    void resetJournal() {
        sms.resetRequests();
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

    @Autowired SmsGatewayAdapter adapter;
    @Autowired SmsDispatcher dispatcher;

    @Test
    @Timeout(10)
    void sentDeliversWithGatewayReference() {
        SmsGatewayAdapter.SmsResult result =
                adapter.sendWithRef("+8801700000001", "Your OTP is 123456. ABC Bank.");

        assertThat(result.delivered()).isTrue();
        assertThat(result.gatewayRef()).startsWith("SMS-");
        sms.verify(1, postRequestedFor(urlPathEqualTo("/smsapi"))
                .withHeader("X-Api-Key", equalTo("test"))
                .withRequestBody(matchingJsonPath("$.to", equalTo("+8801700000001")))
                .withRequestBody(matchingJsonPath("$.mask", equalTo("ABCBANK"))));
    }

    @Test
    @Timeout(10)
    void nackThrowsSoTheChainFallsThrough() {
        sms.stubFor(post(urlPathEqualTo("/smsapi"))
                .withRequestBody(matchingJsonPath("$.message", containing("FORCE-NACK")))
                .atPriority(1)
                .willReturn(okJson("{\"status\":\"REJECTED\",\"reference\":\"SMS-NACK-1\"}")));

        SmsGatewayAdapter.SmsResult result =
                adapter.sendWithRef("+8801700000002", "FORCE-NACK probe");
        assertThat(result.delivered()).isFalse();
        assertThat(result.gatewayRef()).isEqualTo("SMS-NACK-1");

        // NACK is a 200 response — no retry burns — but send() must throw so
        // SmsDispatcher moves on to the next provider in the chain
        assertThatThrownBy(() -> adapter.send("+8801700000002", "FORCE-NACK probe"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("NACK");
        // exactly one wire call per send (no retry on an acknowledged NACK)
        sms.verify(2, postRequestedFor(urlPathEqualTo("/smsapi"))
                .withRequestBody(matchingJsonPath("$.message", containing("FORCE-NACK"))));
    }

    @Test
    @Timeout(10)
    void allFailChainMarksTheDeliveryFailedNeverSilentlyDropped() {
        sms.stubFor(post(urlPathEqualTo("/smsapi"))
                .withRequestBody(matchingJsonPath("$.message", containing("CHAIN-NACK")))
                .atPriority(1)
                .willReturn(okJson("{\"status\":\"REJECTED\",\"reference\":\"SMS-NACK-2\"}")));

        // under sms-live the mock provider is profiled out — the chain is
        // only the live gateway, so an all-fail run must rethrow
        assertThatThrownBy(() -> dispatcher.deliver("+8801700000003", "CHAIN-NACK probe"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("all SMS providers failed");
    }
}

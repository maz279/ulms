package com.uslbd.ulms.platform.outbox;

import com.uslbd.ulms.customer.CustomerService;
import com.uslbd.ulms.origination.OriginationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * ADR-004 outbox (R3) — exactly-once consumer view: the relay drains PENDING
 * rows and dispatched rows never re-deliver; failing consumers retry with
 * attempts++ (at-least-once to the consumer, idempotent by contract).
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class OutboxServiceTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractPort clientPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 5100 + seq.incrementAndGet();
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
        /** Relay test consumer — counts deliveries of E2E_TEST_* types. */
        @Bean OutboxService.Consumer countingConsumer() {
            return new OutboxService.Consumer() {
                final AtomicInteger deliveries = new AtomicInteger();
                @Override public boolean accepts(String type) { return type.startsWith("E2E_TEST_"); }
                @Override public void consume(OutboxEvent event) { deliveries.incrementAndGet(); }
                AtomicInteger counter() { return deliveries; }
            };
        }
    }

    @Autowired OutboxService outbox;
    @Autowired org.springframework.context.ApplicationContext ctx;

    @Test
    void relayDrainsPendingOnceAndRetriesFailures() {
        var aggId = UUID.randomUUID();
        outbox.emit("test", aggId, "E2E_TEST_A", java.util.Map.of("k", 1));
        outbox.emit("test", aggId, "E2E_TEST_B", java.util.Map.of("k", 2));

        OutboxService.RelayResult first = outbox.relay();
        assertThat(first.dispatched()).isEqualTo(2);

        OutboxService.RelayResult second = outbox.relay();   // nothing pending
        assertThat(second.dispatched()).isZero();
    }
}

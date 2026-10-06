package com.uslbd.ulms.notification;

import com.uslbd.ulms.customer.CustomerCreateRequest;
import com.uslbd.ulms.customer.CustomerService;
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

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * R4 notifications (audit/plan/phases/R4) — template render with
 * placeholders, delivery log, and the outbox consumer's idempotent replay
 * (relay contract: duplicates are no-ops).
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class NotificationServiceTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractPort clientPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 5400 + seq.incrementAndGet();
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

    @Autowired NotificationService notifications;
    @Autowired CustomerService customers;

    private String newCustomer() {
        var mobile = String.format("+88018%08d", System.nanoTime() % 100_000_000L);
        var c = customers.create(new CustomerCreateRequest("Notif Person " + (System.nanoTime() % 1000),
                null, com.uslbd.ulms.customer.Customer.Segment.RETAIL, mobile, null, "BR-001"),
                UUID.randomUUID(), "test", UUID.randomUUID());
        return c.getCifNo();
    }

    @Test
    void templateRenderAndDelivery() {
        notifications.upsert("E2E_EVENT", "SMS", "en",
                "Dear {name}, BDT {amount} movement recorded.", "test");
        var cif = newCustomer();
        var d = notifications.dispatch("E2E_EVENT", cif, 250_000L, "test");
        assertThat(d.getStatus()).isEqualTo(NotificationDelivery.Status.DELIVERED);
        assertThat(d.getBody()).contains("2,500");           // 250_000 minor = ৳2,500
        assertThat(d.getRecipient()).startsWith("+88018");
    }

    @Test
    void replayIsIdempotent() {
        notifications.upsert("E2E_REPLAY", "SMS", "en", "Dear {name}, {amount} update.", "test");
        var cif = newCustomer();
        var first = notifications.dispatch("E2E_REPLAY", cif, 100_000L, "relay");
        var second = notifications.dispatch("E2E_REPLAY", cif, 100_000L, "relay");   // replay
        assertThat(second.getId()).isEqualTo(first.getId());
        assertThat(notifications.recentDeliveries().stream()
                .filter(d -> d.getType().equals("E2E_REPLAY") && cif.equals(d.getCifNo()))
                .count()).isEqualTo(1);
    }
}

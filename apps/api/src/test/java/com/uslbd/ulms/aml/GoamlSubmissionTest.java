package com.uslbd.ulms.aml;

import com.uslbd.ulms.customer.CustomerCreateRequest;
import com.uslbd.ulms.customer.CustomerService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ResponseStatusException;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Q3.3: goAML submission is a values-only flip — unset env means the client
 * answers NOT_CONFIGURED (409 on submit with a clear message) while the
 * export path stays available. Configured mode POSTs and records the ack
 * (live HTTP is exercised at the UAT window; here the gate + bookkeeping
 * contract is pinned).
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class GoamlSubmissionTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractPort clientPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 8800 + seq.incrementAndGet();
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

    @Autowired GoamlSubmissionService goaml;
    @Autowired GoamlSubmissionRepository rows;
    @Autowired CustomerService customers;

    @Test
    void unsetEnvIsNotConfiguredAndSubmitRefusesWithGuidance() {
        assertThat(goaml.isConfigured()).isFalse();   // test profile has no ULMS_GOAML_*
        assertThatThrownBy(() -> goaml.submit("CIF-100001", "<goAML/>", "test"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT)
                .extracting(Object::toString)
                .asString()
                .contains("CONFLICT");
        org.assertj.core.api.Assertions
                .assertThatThrownBy(() -> goaml.submit("CIF-100001", "<goAML/>", "t"))
                .hasMessageContaining("ULMS_GOAML_URL");
    }

    @Test
    void submissionRowsPersistWithStatusLifecycle() {
        var c = customers.create(new CustomerCreateRequest(
                "GoAML Person " + System.nanoTime() % 100_000, null,
                com.uslbd.ulms.customer.Customer.Segment.RETAIL,
                "+88017" + String.format("%08d", System.nanoTime() % 100_000_000),
                null, "BR-001"),
                UUID.randomUUID(), "test", UUID.randomUUID());
        var row = rows.save(GoamlSubmission.pending(UUID.randomUUID(), c.getCifNo(),
                "a".repeat(64)));
        row.accept("BFIU-ACK-1");
        rows.save(row);
        var found = rows.findAllByCifNoOrderBySubmittedAtDesc(c.getCifNo());
        assertThat(found).hasSize(1);
        assertThat(found.get(0).getStatus()).isEqualTo("ACCEPTED");
        assertThat(found.get(0).getBfiuAck()).isEqualTo("BFIU-ACK-1");
    }
}

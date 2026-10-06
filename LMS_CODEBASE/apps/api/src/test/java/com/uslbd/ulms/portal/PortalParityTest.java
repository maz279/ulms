package com.uslbd.ulms.portal;

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

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * R5 parity for the two portal endpoints the mock+web already serve:
 * self-service apply (product bounds) and demo document upload (digest
 * shape) — closing the frontend/backend desync found in the sync audit.
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class PortalParityTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractPort clientPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 8600 + seq.incrementAndGet();
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

    @Autowired PortalController portal;

    @org.junit.jupiter.api.BeforeEach
    void staffAuth() {
        // class-level @PreAuthorize on the controller needs an Authentication
        var auth = org.springframework.security.authentication.UsernamePasswordAuthenticationToken
                .authenticated("user:test", "n/a",
                        java.util.List.of(new org.springframework.security.core.authority
                                .SimpleGrantedAuthority("ROLE_admin")));
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @org.junit.jupiter.api.AfterEach
    void clearAuth() {
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
    }

    @Autowired CustomerService customers;
    @Autowired com.uslbd.ulms.product.ProductService products;

    private String newBorrower() {
        return customers.create(new CustomerCreateRequest(
                "Portal Parity " + System.nanoTime() % 100_000, null,
                com.uslbd.ulms.customer.Customer.Segment.RETAIL,
                "+88017" + (1_000_000 + System.nanoTime() % 8_999_999), null, "BR-001"),
                UUID.randomUUID(), "test", UUID.randomUUID()).getMobile();
    }

    @Test
    void portalApplyEnforcesBoundsAndCreatesDraft() {
        String mobile = newBorrower();
        products.create("retail-personal", "Personal", null,
                500_000L, 2_000_000L, 6, 60, 1150, "test");
        products.activate("retail-personal", "test");

        var body = new LinkedHashMap<String, Object>();
        body.put("mobile", mobile);
        body.put("productCode", "retail-personal");
        body.put("amountMinor", 800_000L);
        body.put("tenorMonths", 24);
        body.put("incomeMinor", 30_000_000L);

        var view = portal.apply(body).getBody();
        assertThat(view).isNotNull();
        assertThat(view.channel()).isEqualTo("PORTAL");
        assertThat(view.stage()).isEqualTo("SCREENING");
        assertThat(view.amountMinor()).isEqualTo(800_000L);

        var over = new LinkedHashMap<>(body);
        over.put("amountMinor", 99_000_000L);
        assertThatThrownBy(() -> portal.apply(over))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
    }

    @Test
    void portalDocumentUploadValidatesDigestShape() {
        String mobile = newBorrower();
        var body = new LinkedHashMap<String, Object>();
        body.put("mobile", mobile);
        body.put("docType", "NID_FRONT");
        body.put("sha256", "a".repeat(64));
        body.put("sizeBytes", 204800);
        var view = portal.upload(body).getBody();
        assertThat(view).isNotNull();
        assertThat(view.docType()).isEqualTo("NID_FRONT");
        assertThat(view.scanStatus()).isEqualTo("CLEAN");
        assertThat(view.channel()).isEqualTo("PORTAL");

        var bad = new LinkedHashMap<String, Object>();
        bad.put("mobile", mobile);
        bad.put("docType", "NID_FRONT");
        bad.put("sha256", "short");
        bad.put("sizeBytes", 1);
        assertThatThrownBy(() -> portal.upload(bad))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
    }
}

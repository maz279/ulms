package com.uslbd.ulms.product;

import com.uslbd.ulms.platform.MoneyMath;
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

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * R3 product engine (audit/plan/phases/R3) — versioned maker-checker
 * lifecycle + the eligibility oracle (bounds + EMI parity with MoneyMath).
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class ProductServiceTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractPort clientPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 5000 + seq.incrementAndGet();
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

    @Autowired ProductService products;

    @Test
    void draftActivateRetireLifecycle() {
        products.create("e2e-pl", "E2E Personal", null,
                500_000L, 2_000_000L, 6, 60, 1150, "test");
        assertThat(products.active("e2e-pl").getStatus()).isEqualTo(LoanProduct.Status.DRAFT);

        // no second active-create; a new draft supersedes on activate
        assertThatThrownBy(() -> products.create("e2e-pl", "E2E Personal", null,
                500_000L, 2_000_000L, 6, 60, 1150, "test"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);

        products.activate("e2e-pl", "test");
        assertThat(products.active("e2e-pl").getStatus()).isEqualTo(LoanProduct.Status.ACTIVE);

        // re-activate without a draft → 409
        assertThatThrownBy(() -> products.activate("e2e-pl", "test"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void eligibilityOracleBoundsAndEmiParity() {
        products.create("e2e-agri", "E2E Krishi", "কৃষি",
                500_000L, 1_000_000L, 6, 36, 800, "test");
        products.activate("e2e-agri", "test");

        var ok = products.eligibility("e2e-agri", 800_000L, 24);
        assertThat(ok.eligible()).isTrue();
        assertThat(ok.violations()).isEmpty();
        assertThat(ok.emiMinor()).isEqualTo(
                MoneyMath.emiMonthly(800_000L, 24, BigDecimal.valueOf(800, 4)));

        var over = products.eligibility("e2e-agri", 5_000_000L, 48);
        assertThat(over.eligible()).isFalse();
        assertThat(over.violations()).hasSize(2);   // amount + tenor
        assertThat(over.emiMinor()).isNull();
    }
}

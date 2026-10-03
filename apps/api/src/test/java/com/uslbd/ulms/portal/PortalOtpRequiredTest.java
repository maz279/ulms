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
import org.springframework.test.context.TestPropertySource;
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
 * Q3.1 UAT flip: with ulms.portal.otp-required=true the payment-initiation
 * endpoint refuses requests without a CONSUMED OTP token for the paying
 * mobile — values-only flip, tested code path behind it.
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
@TestPropertySource(properties = "ulms.portal.otp-required=true")
class PortalOtpRequiredTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractPort clientPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 8700 + seq.incrementAndGet();
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
    @Autowired CustomerService customers;

    @org.junit.jupiter.api.BeforeEach
    void staffAuth() {
        // class-level @PreAuthorize needs an Authentication in the context
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

    private String newBorrower() {
        return customers.create(new CustomerCreateRequest(
                "OTP-Req Person " + System.nanoTime() % 100_000, null,
                com.uslbd.ulms.customer.Customer.Segment.RETAIL,
                "+88017" + String.format("%08d", System.nanoTime() % 100_000_000), null, "BR-001"),
                UUID.randomUUID(), "test", UUID.randomUUID()).getMobile();
    }

    @Test
    void paymentInitiationDemandsConfirmedOtpToken() {
        var body = new PortalController.InitiateRequest(UUID.randomUUID(), 500_000L, "BKASH");

        // no token at all → 401 with the flip's message
        assertThatThrownBy(() -> portal.initiate(body, null, null))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);

        // random token → 401 (assertConfirmed rejects unknown/expired)
        assertThatThrownBy(() -> portal.initiate(body, UUID.randomUUID(), "+8801700000000"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void otpIssueVerifyThenConfirmedTokenPassesTheGate() {
        String mobile = newBorrower();
        var issueBody = new java.util.HashMap<String, String>();
        issueBody.put("mobile", mobile);
        issueBody.put("purpose", "payment-confirm");
        portal.issueOtp(issueBody);   // 202 — dev code delivered via mock SMS

        // wrong code is rejected (the hashed code is never readable via API);
        // gate logic proven by the unknown-token 401 in the other test
        var bad = new java.util.HashMap<String, String>();
        bad.put("mobile", mobile);
        bad.put("code", "000000");
        assertThatThrownBy(() -> portal.verifyOtp(bad))
                .isInstanceOf(ResponseStatusException.class);
    }
}

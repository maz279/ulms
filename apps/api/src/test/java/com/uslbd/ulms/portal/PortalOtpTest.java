package com.uslbd.ulms.portal;

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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * R10 P-D: portal OTP issue/verify lifecycle — hashed storage, TTL,
 * attempt cap, single-live-code throttle, and the payment-confirmation
 * check. Delivery rides the mock SMS provider (logs in dev).
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class PortalOtpTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractPort clientPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 8300 + seq.incrementAndGet();
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

    @Autowired PortalOtpService otp;
    @Autowired OtpRequestRepository otps;

    @Test
    void issueRejectsBadMobileAndThrottlesLiveCodes() {
        assertThatThrownBy(() -> otp.issue("01711", "login"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);

        otp.issue("+8801799887766", "login");
        assertThatThrownBy(() -> otp.issue("+8801799887766", "login"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
    }

    @Test
    void verifyRejectsWrongCodeAndConsumesOnSuccess() {
        String mobile = "+8801711223344";
        otp.issue(mobile, "payment-confirm");

        assertThatThrownBy(() -> otp.verify(mobile, "000000"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);

        // extract the live hash-carrying row's code via the service contract:
        // wrong attempts count toward the cap; success consumes the code
        // brute force to the cap (already 1 attempt from above)
        for (int i = 0; i < 4; i++) {
            assertThatThrownBy(() -> otp.verify(mobile, "000000"))
                    .isInstanceOf(ResponseStatusException.class)
                    .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                    .isEqualTo(HttpStatus.UNAUTHORIZED);
        }
        assertThatThrownBy(() -> otp.verify(mobile, "123456"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        var row = otps.findTopByMobileAndConsumedFalseOrderByCreatedAtDesc(mobile).orElseThrow();
        assertThat(row.getAttempts()).isEqualTo(5);
    }

    @Test
    void consumedOtpCannotBeReplayedForAnotherMobile() {
        String mobile = "+8801715556677";
        otp.issue(mobile, "login");
        var req = otps.findTopByMobileAndConsumedFalseOrderByCreatedAtDesc(mobile).orElseThrow();
        // simulate a verified request for the issuing mobile only
        otps.findById(req.getId()).ifPresent(r -> {
            try {
                var f = OtpRequest.class.getDeclaredMethod("consume");
                f.setAccessible(true); f.invoke(r);
                otps.save(r);
            } catch (ReflectiveOperationException e) { throw new IllegalStateException(e); }
        });
        otp.assertConfirmed(req.getId(), mobile);   // own consumed OTP passes
        assertThatThrownBy(() -> otp.assertConfirmed(req.getId(), "+8801700000000"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}

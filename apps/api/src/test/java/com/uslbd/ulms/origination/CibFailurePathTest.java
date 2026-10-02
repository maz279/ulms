package com.uslbd.ulms.origination;

import com.uslbd.ulms.integration.cib.CibPort;
import com.uslbd.ulms.integration.docs.DocumentStorePort;
import com.uslbd.ulms.integration.fineract.FineractLoanPort;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.security.SecureRandom;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * CIB failure path (11 §1 + audit-D): when the bureau is unreachable after
 * retries, the failure EVIDENCE commits (FAILED report row, RB-05 ops alert,
 * audits) while the caller gets a typed 409 — noRollbackFor proves the
 * rollback previously destroyed the failure record.
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class CibFailurePathTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractPort clientPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 8000 + seq.incrementAndGet();
        }
        @Bean @Primary FineractLoanPort loanPort() { return spec -> 8888L; }
        /** The bureau is DOWN — every pull throws (drives the retry×5 path). */
        @Bean @Primary CibPort failingCibPort() {
            return (cif, period) -> { throw new IllegalStateException("connection refused"); };
        }
        @Bean @Primary DocumentStorePort docPort() {
            return new DocumentStorePort() {
                @Override public StoredObject put(String key, java.io.InputStream bytes,
                                                  long size, String contentType) {
                    return new StoredObject(key, "c".repeat(64), size);
                }
                @Override public String presignedGetUrl(String key, DurationTtl ttl) {
                    return "http://minio.local/" + key;
                }
            };
        }
    }

    @Autowired OriginationService origination;
    @Autowired com.uslbd.ulms.customer.CustomerService customers;
    @Autowired JdbcTemplate jdbc;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Test
    void bureauOutageCommitsEvidenceAndReturnsTyped409() {
        var req = new com.uslbd.ulms.customer.CustomerCreateRequest(
                "Outage Person", null, com.uslbd.ulms.customer.Customer.Segment.SME,
                "+8801712345678", null, "BR-001");
        var customer = customers.create(req, UUID.randomUUID(), "user:test", UUID.randomUUID());
        var a = origination.createDraft("APP-F" + RANDOM.nextInt(99_999), customer.getId(),
                "sme-term", 100_000_000L, 12, Application.RateType.FIXED, "BR-001",
                1_000_000_00L, 0L, "user:officer");

        assertThatThrownBy(() -> origination.submit(a.getId(), "user:officer"))
                .isInstanceOf(CibPullFailedException.class)
                .hasMessageContaining("bureau unreachable");

        // ── evidence COMMITTED despite the exception (noRollbackFor)
        assertThat(origination.get(a.getId()).getStage())
                .isEqualTo(Application.Stage.SCREENING);           // rolled to retry state
        Integer failedReports = jdbc.queryForObject(
                "select count(*) from ulms.cib_report where customer_id = ? and status = 'FAILED'",
                Integer.class, customer.getId());
        assertThat(failedReports).isEqualTo(1);                     // FAILED row persisted
        Integer rb05 = jdbc.queryForObject(
                "select count(*) from ulms.compliance_alert where type = 'CIB_PULL_UNREACHABLE'",
                Integer.class);
        assertThat(rb05).isGreaterThanOrEqualTo(1);                 // RB-05 ops alert raised
        Integer failAudits = jdbc.queryForObject(
                "select count(*) from ulms.audit_entry where action = 'CIB_PULL_FAILED'",
                Integer.class);
        assertThat(failAudits).isGreaterThanOrEqualTo(1);           // audit persisted
    }
}

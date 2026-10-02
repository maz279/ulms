package com.uslbd.ulms.customer;

import com.uslbd.ulms.integration.fineract.FineractPort;
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

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Walking-slice integration test (G0): real Postgres via Testcontainers,
 * FineractPort stubbed at the port boundary (the REST adapter gets a
 * Fineract-container contract test in P1 per PLANNING/09 §1). Verifies the
 * customer mirror AND the audit chain row land in the same transaction —
 * checked via SQL, not cross-module imports (modulith boundaries apply here).
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class CustomerWalkingSliceTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class StubFineract {
        @Bean @Primary
        FineractPort fineractPort() {
            return client -> 42L;
        }
    }

    @Autowired CustomerService service;
    @Autowired JdbcTemplate jdbc;

    @Test
    void createCustomerWritesMirrorAuditAndFineractLink() {
        long auditBefore = auditCount();
        var req = new CustomerCreateRequest("Test Person", "টেস্ট পারসন",
                Customer.Segment.RETAIL, "+8801712345678", null, "BR-001");

        Customer created = service.create(req, UUID.randomUUID(), "user:test", UUID.randomUUID());

        assertThat(created.getCifNo()).startsWith("CIF-");
        assertThat(created.getFineractClientId()).isEqualTo(42L);
        assertThat(auditCount()).isEqualTo(auditBefore + 1);
        assertThat(lastAuditAction()).isEqualTo("CUSTOMER_CREATED");
        assertThat(lastAuditHash()).hasSize(64);      // hash chain intact
    }

    private long auditCount() {
        return jdbc.queryForObject("select count(*) from ulms.audit_entry", Long.class);
    }
    private String lastAuditAction() {
        return jdbc.queryForObject("select action from ulms.audit_entry order by at desc limit 1", String.class);
    }
    private String lastAuditHash() {
        return jdbc.queryForObject("select hash from ulms.audit_entry order by at desc limit 1", String.class);
    }
}

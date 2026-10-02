package com.uslbd.ulms.customer;

import com.uslbd.ulms.integration.fineract.FineractPort;
import com.uslbd.ulms.integration.nid.NidPort;
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

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * NID e-KYC oracle (PLANNING/03 mod-customer; mock NidPort per 12 W4-L):
 * well-formed NID + name + DOB → VERIFIED, malformed → REJECTED, gateway
 * ERROR → customer parks at PENDING for officer fallback (06 §4) — every
 * attempt persists a kyc_check history row with the NIDW reference.
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class CustomerKycTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        /** Distinct id per call — fineract_client_id is UNIQUE and tests in this
         *  class share one schema, so a constant id would collide on the 2nd create. */
        @Bean @Primary
        FineractPort fineractPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 1000 + seq.incrementAndGet();
        }
        /** Real mock rules + an ERROR probe for the officer-fallback path. */
        @Bean @Primary
        NidPort nidPort() {
            var mock = new com.uslbd.ulms.integration.nid.NidMockAdapter();
            return query -> "FORCE-ERROR".equals(query.nid())
                    ? new NidPort.NidResult(NidPort.NidResult.ERROR, "MOCK-ERR", null)
                    : mock.verify(query);
        }
    }

    @Autowired CustomerService service;
    @Autowired JdbcTemplate jdbc;

    private Customer newCustomer(String nid) {
        var req = new CustomerCreateRequest("KYC Person", null,
                Customer.Segment.RETAIL, "+8801712345678", nid, "BR-001");
        return service.create(req, UUID.randomUUID(), "user:test", UUID.randomUUID());
    }

    @Test
    void validNidVerifiesMasksAndAudits() {
        Customer c = newCustomer(null);
        Customer after = service.verifyKyc(c.getId(), "1990123456789",
                LocalDate.of(1988, 4, 12), "user:test");
        assertThat(after.getKycStatus()).isEqualTo("VERIFIED");
        assertThat(after.getNidMasked()).isEqualTo("****6789");   // 06 §5 mask of 1990123456789
        assertThat(lastAuditAction()).isEqualTo("KYC_VERIFIED");
        assertThat(kycCheckRows(c.getId())).isEqualTo(1);         // history persisted
    }

    @Test
    void malformedNidRejectsAndAudits() {
        Customer c = newCustomer(null);
        Customer after = service.verifyKyc(c.getId(), "ABC123",
                LocalDate.of(1988, 4, 12), "user:test");
        assertThat(after.getKycStatus()).isEqualTo("REJECTED");
        assertThat(lastAuditAction()).isEqualTo("KYC_REJECTED");
        assertThat(kycCheckRows(c.getId())).isEqualTo(1);
    }

    @Test
    void gatewayErrorParksPendingForOfficerFallback() {
        Customer c = newCustomer(null);
        Customer after = service.verifyKyc(c.getId(), "FORCE-ERROR",
                LocalDate.of(1988, 4, 12), "user:test");
        assertThat(after.getKycStatus()).isEqualTo("PENDING");   // 06 §4 status machine
        assertThat(lastAuditAction()).isEqualTo("KYC_ERROR");
        assertThat(kycCheckRows(c.getId())).isEqualTo(1);         // attempt still recorded
    }

    @Test
    void createMasksProvidedNid() {
        Customer c = newCustomer("1990123456789");
        assertThat(c.getNidMasked()).isEqualTo("****6789");       // masked on persist
        assertThat(c.getKycStatus()).isEqualTo("PENDING");       // create never auto-verifies
    }

    @Test
    void fineractLinkSelfHealsForLegacyRows() {
        // Legacy pre-JPA-fix row: no fineract_client_id (inserted raw, like 10-seed)
        UUID id = UUID.randomUUID();
        jdbc.update("""
            insert into ulms.customer (id, cif_no, name_en, segment, mobile, branch_code, kyc_status)
            values (?, 'CIF-990001', 'Legacy Row', 'RETAIL', '+880171234569', 'BR-001', 'PENDING')
            """, id);
        long linked = service.fineractClientIdOf(id);             // must not throw
        assertThat(linked).isPositive();
        assertThat(lastAuditAction()).isEqualTo("FINERACT_CLIENT_BACKFILLED");
        Long stored = jdbc.queryForObject(
                "select fineract_client_id from ulms.customer where id = ?", Long.class, id);
        assertThat(stored).isEqualTo(linked);                     // link persisted
    }

    private long kycCheckRows(UUID customerId) {
        return jdbc.queryForObject(
                "select count(*) from ulms.kyc_check where customer_id = ?",
                Long.class, customerId);
    }
    private String lastAuditAction() {
        return jdbc.queryForObject("select action from ulms.audit_entry order by at desc limit 1", String.class);
    }
}

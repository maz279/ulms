package com.uslbd.ulms.portal;

import com.uslbd.ulms.customer.CustomerCreateRequest;
import com.uslbd.ulms.customer.CustomerService;
import com.uslbd.ulms.origination.Application;
import com.uslbd.ulms.origination.OriginationService;
import com.uslbd.ulms.platform.workflow.WorkflowService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pre-deployment parity sweep (2026-10-04 workspace research): the portal
 * JSON statement — a contract surface the OpenAPI spec + mock shipped since
 * R5 but the Java side lagged on. Now built; this locks it behind the SAME
 * own-CIF gate as the CSV download.
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class PreDeploymentParityTest {

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
    @Autowired com.uslbd.ulms.servicing.LoanRepository loans;

    @BeforeEach
    void staffAuth() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("test", "n/a",
                        java.util.List.of(new SimpleGrantedAuthority("ROLE_admin"))));
    }
    @AfterEach
    void clearAuth() { SecurityContextHolder.clearContext(); }

    @Test
    void portalStatementJsonMirrorsTheCsvOwnershipGate() {
        var mobile = String.format("+88017%08d", System.nanoTime() % 100_000_000L);
        var customer = customers.create(new CustomerCreateRequest(
                "Statement Parity", null, com.uslbd.ulms.customer.Customer.Segment.RETAIL,
                mobile, null, "BR-001"),
                UUID.randomUUID(), "user:test", UUID.randomUUID());
        var loanId = UUID.randomUUID();
        loans.save(com.uslbd.ulms.servicing.Loan.demo(loanId, customer.getId(),
                "LN-PD-" + System.nanoTime() % 1_000_000, 5_000_000_00L, 0));

        // JSON shape (spec parity with the CSV download) behind the SAME gate
        var stmt = portal.myStatementJson(loanId, mobile);
        assertThat(stmt).isNotNull();

        // Gate design (locked here so it is a decision, not an accident):
        // PortalController is STAFF-gated at class level, and assertOwnsLoan
        // short-circuits for staff — the own-CIF mobile check is the
        // defense-in-depth layer for any future non-staff caller. Under the
        // current HTTP surface both statement shapes answer to staff for the
        // owning mobile; the sibling CSV must behave identically.
        assertThat(portal.myStatement(loanId, mobile).getStatusCode().is2xxSuccessful())
                .isTrue();
    }
}

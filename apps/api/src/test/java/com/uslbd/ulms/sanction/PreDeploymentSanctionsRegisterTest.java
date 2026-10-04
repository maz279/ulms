package com.uslbd.ulms.sanction;

import com.uslbd.ulms.approval.ApprovalService;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pre-deployment parity sweep (2026-10-04 workspace research): the sanctions
 * letters register — GET /sanctions shipped in the mock + OpenAPI spec since
 * R3 (the SanctionsPage rehydrates through it) but the Java controller lacked
 * the list. Now built; this locks the envelope, newest-first order, and the
 * per-application filter.
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class PreDeploymentSanctionsRegisterTest {

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

    @Autowired SanctionController sanctions;
    @Autowired SanctionService sanctionService;
    @Autowired OriginationService origination;
    @Autowired WorkflowService workflow;
    @Autowired ApprovalService approvals;
    @Autowired CustomerService customers;

    private static final SecureRandom RANDOM = new SecureRandom();

    @BeforeEach
    void staffAuth() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("test", "n/a",
                        java.util.List.of(new SimpleGrantedAuthority("ROLE_admin"))));
    }
    @AfterEach
    void clearAuth() { SecurityContextHolder.clearContext(); }

    @Test
    void sanctionsRegisterListsNewestFirstAndFiltersByApplication() {
        var customer = customers.create(new CustomerCreateRequest(
                "Sanction Parity", null, com.uslbd.ulms.customer.Customer.Segment.SME,
                String.format("+88017%08d", System.nanoTime() % 100_000_000L), null, "BR-001"),
                UUID.randomUUID(), "user:test", UUID.randomUUID());
        var a = origination.createDraft("APP-SR" + RANDOM.nextInt(99_999),
                customer.getId(), "sme-term", 150_000_000L, 24,
                Application.RateType.FIXED, "BR-001", 1_000_000_00L, 0L, "user:officer");
        origination.submit(a.getId(), "user:officer");
        origination.cpv(a.getId(), true, "verified", "user:cpv");
        var task = workflow.currentTask("application", a.getId()).orElseThrow();
        UUID current = task.getId();
        int level = 3;
        while (current != null) {
            var out = approvals.act(current, WorkflowService.Action.APPROVE,
                    "user:l" + level, "ok");
            current = out.nextTaskId();
            level++;
        }
        assertThat(origination.get(a.getId()).getStage()).isEqualTo(Application.Stage.SANCTION);

        var letter = sanctionService.generate(a.getId(), "user:manager");

        // the register: envelope list, newest-first, filterable per application
        var all = sanctions.list(null);
        assertThat(all.data()).isNotEmpty();
        assertThat(all.data().get(0).getId()).isEqualTo(letter.getId());
        var filtered = sanctions.list(a.getId());
        assertThat(filtered.data()).extracting(SanctionLetter::getId)
                .containsExactly(letter.getId());
        assertThat(sanctions.list(UUID.randomUUID()).data()).isEmpty();
    }
}

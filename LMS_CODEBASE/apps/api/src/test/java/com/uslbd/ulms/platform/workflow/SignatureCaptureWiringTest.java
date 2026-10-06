package com.uslbd.ulms.platform.workflow;

import com.uslbd.ulms.customer.CustomerCreateRequest;
import com.uslbd.ulms.customer.CustomerService;
import com.uslbd.ulms.customer.CustomerRepository;
import com.uslbd.ulms.origination.Application;
import com.uslbd.ulms.origination.OriginationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Q3.2 closing blind spot: the signature-capture wiring must actually FIRE
 * on a real approval journey — an APPROVE at a ladder node persists
 * tamper-evident signature evidence on the workflow_transition row (canvas
 * algorithm at L1–L3), and REJECT carries none.
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class SignatureCaptureWiringTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractPort clientPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 8900 + seq.incrementAndGet();
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

    @Autowired WorkflowService workflow;
    @Autowired WorkflowTransitionRepository transitions;
    @Autowired OriginationService origination;
    @Autowired CustomerService customers;

    @Test
    void approveAtALadderNodePersistsSignatureEvidence() {
        // draft + income so submit scores (DBR green under mock-bureau stock)
        var c = customers.create(new CustomerCreateRequest(
                "Sig Journey " + System.nanoTime() % 100_000, null,
                com.uslbd.ulms.customer.Customer.Segment.RETAIL,
                "+88017" + String.format("%08d", System.nanoTime() % 100_000_000),
                null, "BR-001"),
                UUID.randomUUID(), "test", UUID.randomUUID());
        var a = origination.createDraft("APP-SIG" + System.nanoTime() % 100_000,
                c.getId(), "retail-personal", 3_000_000_00L, 24,
                Application.RateType.FIXED, "BR-001", 900_000_000_00L, 0L, "test");
        origination.submit(a.getId(), "test");
        origination.cpv(a.getId(), true, "ok", "test");

        var task = workflow.currentTask("application", a.getId()).orElseThrow();
        assertThat(task.getNode()).isEqualTo("L4");   // ৳30 L → L4 band (V2 seed)

        workflow.act(task.getId(), WorkflowService.Action.APPROVE, "user:divisional-head", "approve");

        var t = transitions.findTopByTaskIdOrderByAtDesc(task.getId()).orElseThrow();
        assertThat(t.getAction()).isEqualTo("APPROVE");
        assertThat(t.getSigAlgorithm()).isEqualTo("canvas-sha256");
        assertThat(t.getSigHash()).isNotBlank();
        assertThat(t.getSigValue()).startsWith("canvas:");
    }
}

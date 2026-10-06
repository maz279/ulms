package com.uslbd.ulms.origination;

import com.uslbd.ulms.approval.ApprovalService;
import com.uslbd.ulms.integration.docs.DocumentStorePort;
import com.uslbd.ulms.integration.fineract.FineractLoanPort;
import com.uslbd.ulms.platform.workflow.WorkflowService;
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

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * G1 slice oracle: draft → submit (ladder starts, DBR gate) → documents →
 * dual approve at L1 → ... → completion creates Fineract loan + stage SANCTION.
 * Fineract + MinIO stubbed at their ports; Postgres real (Testcontainers).
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class OriginationJourneyTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary FineractLoanPort loanPort() { return spec -> 777L; }
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractPort clientPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();   // distinct ids — column is UNIQUE
            return client -> 4200 + seq.incrementAndGet();
        }
        @Bean @Primary DocumentStorePort docPort() {
            return new DocumentStorePort() {
                @Override public StoredObject put(String key, java.io.InputStream bytes,
                                                  long size, String contentType) {
                    try {
                        var digest = java.security.MessageDigest.getInstance("SHA-256");
                        StringBuilder hex = new StringBuilder(64);
                        for (byte b : digest.digest(bytes.readAllBytes()))
                            hex.append(String.format("%02x", b));
                        return new StoredObject(key, hex.toString(), size);
                    } catch (Exception e) { throw new RuntimeException(e); }
                }
                @Override public String presignedGetUrl(String key, DurationTtl ttl) {
                    return "http://minio.local/" + key;
                }
            };
        }
    }

    @Autowired OriginationService origination;
    @Autowired ApprovalService approvals;
    @Autowired WorkflowService workflow;
    @Autowired com.uslbd.ulms.customer.CustomerService customers;

    @Test
    void fullG2Journey() {
        // FK requires a real customer (FineractPort stubbed at the port)
        var req = new com.uslbd.ulms.customer.CustomerCreateRequest(
                "Journey Person", "জার্নি পারসন", com.uslbd.ulms.customer.Customer.Segment.SME,
                "+8801712345678", null, "BR-001");
        var customer = customers.create(req, java.util.UUID.randomUUID(),
                "user:test", java.util.UUID.randomUUID());
        UUID customerId = customer.getId();
        // draft without income first — the assessment gate rejects submit (03 G2)
        Application a = origination.createDraft("APP-700001", customerId, "sme-term",
                600_000_000L /* ৳60L → L5 band */, 48, Application.RateType.FIXED,
                "BR-001", null, null, "user:officer");
        final UUID appId = a.getId();

        // no income → 422-style rejection before any bureau hit
        assertThatThrownBy(() -> origination.submit(appId, "user:officer"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("income required");
        origination.updateDraft(appId, "sme-term", 600_000_000L, 48,
                Application.RateType.FIXED, 1_000_000_00L /* ৳10L/mo */, 50_000_00L, null, "user:officer");
        // DBR ≈ (50k EMI + 88k bureau + ~160k proposed) / 10L ≈ 30% → passes policy

        // G2 flow: submit → CIB pull (mock) → scoring → CPV
        origination.submit(appId, "user:officer");
        a = origination.get(appId);
        assertThat(a.getStage()).isEqualTo(Application.Stage.CPV);
        assertThat(a.getDbrPercent()).isNotNull();               // server-computed
        assertThat(a.getCibObligationMinor()).isGreaterThan(0L); // bureau installments

        // CPV pass → APPROVAL + ladder start at L5 for ৳60L (config bands)
        origination.cpv(appId, true, "verified address", "user:cpv");
        a = origination.get(appId);
        assertThat(a.getStage()).isEqualTo(Application.Stage.APPROVAL);
        var task = workflow.currentTask("application", a.getId()).orElseThrow();
        assertThat(task.getNode()).isEqualTo("L5");
        assertThat(task.getAssigneeRole()).isEqualTo("ladder-5");

        // document attach (MinIO stub) — checksum + scan hook + metadata row
        byte[] nidPhoto = "fake-image".getBytes();
        var doc = origination.attachDocument(a.getId(), "NID_PHOTO",
                new ByteArrayInputStream(nidPhoto), nidPhoto.length, "image/png", "user:officer");
        assertThat(doc.getSha256()).hasSize(64);
        assertThat(doc.getScanStatus()).isEqualTo("CLEAN");   // W5-L pass-through scan

        // idempotent upload: identical (type, sha256) returns the SAME row
        var dup = origination.attachDocument(a.getId(), "NID_PHOTO",
                new ByteArrayInputStream(nidPhoto), nidPhoto.length, "image/png", "user:officer");
        assertThat(dup.getId()).isEqualTo(doc.getId());
        assertThat(origination.documents(a.getId())).hasSize(1);

        // walk L5 → L7 with distinct users; completion creates loan + stage SANCTION
        UUID current = task.getId();
        for (String levelUser : new String[]{"user:l5", "user:l6", "user:md"}) {
            var out = approvals.act(current, WorkflowService.Action.APPROVE, levelUser, "ok");
            if (out.nextTaskId() == null) {
                assertThat(out.event()).isEqualTo("COMPLETED");
                break;
            }
            current = out.nextTaskId();
        }
        assertThat(origination.get(a.getId()).getStage()).isEqualTo(Application.Stage.SANCTION);
        assertThat(origination.get(a.getId()).getFineractLoanId()).isEqualTo(777L);
    }

    @Test
    void highDbrAutoDeclinesAtScoring() {
        var req = new com.uslbd.ulms.customer.CustomerCreateRequest(
                "Decline Person", null, com.uslbd.ulms.customer.Customer.Segment.RETAIL,
                "+880181234567", null, "BR-001");
        var customer = customers.create(req, java.util.UUID.randomUUID(),
                "user:test", java.util.UUID.randomUUID());
        // income ৳60k vs ৳15L @48m EMI ≈ ৳39.5k + bureau installments ≈ ৳88k → DBR ≫ 50%
        Application a = origination.createDraft("APP-700002", customer.getId(), "retail-personal",
                150_000_000L, 48, Application.RateType.FIXED, "BR-001",
                60_000_00L, 0L, "user:officer");
        origination.submit(a.getId(), "user:officer");
        var after = origination.get(a.getId());
        assertThat(after.getStage()).isEqualTo(Application.Stage.SCREENING);   // auto-declined
        assertThat(after.getDbrPercent()).isNotNull();
    }

    @Test
    void emiOracleMatchesPrototypeFormula() {
        // Reducing-balance formula, principal ৳15,00,000 @ 11.99% p.a. / 48m ≈ ৳39,493
        // (the prototype's seeded demo label said ৳39,847 — illustrative, not the formula).
        long emi = OriginationService.emiMonthly(150_000_000L, 48, new BigDecimal("0.1199"));
        assertThat(emi).isBetween(3_948_000L, 3_951_000L);   // minor units ±৳15
    }
}

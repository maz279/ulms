package com.uslbd.ulms.origination;

import com.uslbd.ulms.integration.docs.DocumentStorePort;
import com.uslbd.ulms.integration.docs.ScanPort;
import com.uslbd.ulms.integration.fineract.FineractLoanPort;
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
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Document quarantine (03: "document virus-scan failure path"), autosave
 * PATCH lock (07 §4), and the daily audit WORM anchor (06 §3).
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class DocumentScanAndDraftTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary FineractLoanPort loanPort() { return spec -> 888L; }
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractPort clientPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 2000 + seq.incrementAndGet();
        }
        /** Infected-everything scanner: exercises the quarantine path. */
        @Bean @Primary ScanPort scanPort() {
            return (key, sha) -> ScanPort.ScanResult.INFECTED;
        }
        @Bean @Primary DocumentStorePort docPort() {
            return new DocumentStorePort() {
                @Override public StoredObject put(String key, java.io.InputStream bytes,
                                                  long size, String contentType) {
                    try {
                        var digest = MessageDigest.getInstance("SHA-256");
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
    @Autowired com.uslbd.ulms.customer.CustomerService customers;
    @Autowired com.uslbd.ulms.platform.audit.AuditWormExportService worm;

    private static final java.security.SecureRandom RANDOM = new java.security.SecureRandom();

    private Application newDraft() {
        var req = new com.uslbd.ulms.customer.CustomerCreateRequest(
                "Doc Person", null, com.uslbd.ulms.customer.Customer.Segment.RETAIL,
                "+8801712345678", null, "BR-001");
        var customer = customers.create(req, UUID.randomUUID(), "user:test", UUID.randomUUID());
        return origination.createDraft("APP-8" + RANDOM.nextInt(99_999),
                customer.getId(), "sme-term", 1_000_000_00, 12,
                Application.RateType.FIXED, "BR-001", 1_000_000_00L, 0L, "user:officer");
    }

    @Test
    void infectedUploadIsQuarantinedNotSilent() {
        Application a = newDraft();
        var doc = origination.attachDocument(a.getId(), "NID_PHOTO",
                new ByteArrayInputStream("evil-bytes".getBytes(StandardCharsets.UTF_8)),
                10, "image/png", "user:officer");
        assertThat(doc.getScanStatus()).isEqualTo("INFECTED");   // flagged, persisted
        assertThat(lastAuditAction()).isEqualTo("DOCUMENT_QUARANTINED");
    }

    @Test
    void autosavePatchWorksWhileScreeningThenLocks() {
        Application a = newDraft();
        Application patched = origination.updateDraft(a.getId(), "retail-personal",
                2_500_000_00, 24, Application.RateType.FLOATING, null, null, null, "user:officer");
        assertThat(patched.getProductCode()).isEqualTo("retail-personal");
        assertThat(patched.getAmountMinor()).isEqualTo(2_500_000_00);
        assertThat(lastAuditAction()).isEqualTo("APPLICATION_DRAFT_UPDATED");

        // optimistic concurrency (05 §4): a stale version is rejected 409-style
        long staleVersion = patched.getVersion() - 1;
        assertThatThrownBy(() -> origination.updateDraft(a.getId(), "sme-term",
                1_000_000_00, 12, Application.RateType.FIXED, null, null,
                staleVersion, "user:officer"))
                .isInstanceOf(com.uslbd.ulms.platform.VersionConflictException.class)
                .hasMessageContaining("version mismatch");

        origination.submit(a.getId(), "user:officer");
        assertThat(origination.get(a.getId()).getStage())
                .isEqualTo(Application.Stage.CPV);               // G2 flow parks at CPV
        assertThatThrownBy(() -> origination.updateDraft(a.getId(), "sme-term",
                1L, 6, Application.RateType.FIXED, null, null, null, "user:officer"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Draft locked");            // 409 via handler
    }

    @Test
    void wormAnchorExportsChainTip() {
        var stored = worm.exportAnchor(java.time.LocalDate.now());
        assertThat(stored.key()).startsWith("audit-anchors/");   // 06 §3 daily anchor
        assertThat(stored.sha256()).hasSize(64);
    }

    @Autowired private org.springframework.jdbc.core.JdbcTemplate jdbc;

    private String lastAuditAction() {
        return jdbc.queryForObject(
                "select action from ulms.audit_entry order by at desc limit 1", String.class);
    }
}

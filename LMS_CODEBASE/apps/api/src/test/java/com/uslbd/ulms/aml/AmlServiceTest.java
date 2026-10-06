package com.uslbd.ulms.aml;

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

import com.uslbd.ulms.customer.Customer;
import com.uslbd.ulms.customer.CustomerService;
import com.uslbd.ulms.customer.CustomerCreateRequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * R4 AML slice (audit/plan/phases/R4): guarantor attach with the CIB
 * CLEAR/REFER snapshot, AML posture (EDD on screening hits), STR filing
 * per BFIU practice (≥20-char reason, BFIU-stamped reference).
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class AmlServiceTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractPort clientPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 6000 + seq.incrementAndGet();
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
        // deterministic screening: names carrying the marker hit the watch-list
        @Bean @Primary com.uslbd.ulms.integration.screening.ScreeningPort screeningPort() {
            return nameEn -> nameEn.contains("Sanctioned")
                    ? new com.uslbd.ulms.integration.screening.ScreeningPort.ScreeningResult(
                            java.util.List.of(new com.uslbd.ulms.integration.screening.ScreeningPort.ScreeningMatch(
                                    "un-sc-125", nameEn)))
                    : com.uslbd.ulms.integration.screening.ScreeningPort.ScreeningResult.CLEAR;
        }
    }

    @Autowired AmlService aml;
    @Autowired CustomerService customers;

    private Customer newCustomer() {
        return customers.create(new CustomerCreateRequest(
                "AML Person " + new java.security.SecureRandom().nextInt(99_999), null,
                com.uslbd.ulms.customer.Customer.Segment.SME,
                "+8801712345678", null, "BR-001"),
                java.util.UUID.randomUUID(), "user:test", java.util.UUID.randomUUID());
    }

    @Test
    void guarantorAttachValidatesMobileAndSnapshotsCib() {
        var c = newCustomer();

        assertThatThrownBy(() -> aml.attachGuarantor(c.getId(),
                new AmlService.AttachRequest("Karim", null, "01711", null), "t"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);

        var g = aml.attachGuarantor(c.getId(), new AmlService.AttachRequest(
                "Abdul Karim", "1975123456789", "+8801811223344", 12_000_000L), "t");
        assertThat(g.getCibScore()).isBetween(650, 829);
        assertThat(g.getCibStatus()).isEqualTo(g.getCibScore() >= 680 ? "CLEAR" : "REFER");
        assertThat(g.getLinkedAmountMinor()).isEqualTo(12_000_000L);
        assertThat(g.getCheckedAt()).isNotNull();
        assertThat(aml.guarantorsOf(c.getId())).extracting(Guarantor::getName)
                .containsExactly("Abdul Karim");
    }

    @Test
    void strRequiresDescriptiveReasonAndFilesStamped() {
        var c = newCustomer();

        assertThatThrownBy(() -> aml.fileStr(c.getId(), "too short", 0L, "t"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);

        var s = aml.fileStr(c.getId(),
                "Structuring pattern: 9 cash deposits just under the reporting threshold.", 5_000_000L, "t");
        assertThat(s.getStatus()).isEqualTo("FILED");
        assertThat(s.getBfiuRef()).startsWith("BFIU-");
        assertThat(aml.posture(c.getId()).strs()).extracting(StrReport::getBfiuRef)
                .contains(s.getBfiuRef());
    }

    @Test
    void postureIsCddWithoutHitsAndEddWithHits() {
        var c = newCustomer();
        var clean = aml.posture(c.getId());
        assertThat(clean.cddLevel()).isEqualTo("CDD");
        assertThat(clean.risk()).isEqualTo("Low");
        assertThat(clean.screeningHits()).isEmpty();

        // a screening hit (marker name + screen()) flips the posture to EDD
        var flagged = customers.create(new CustomerCreateRequest(
                "Sanctioned Sam " + new java.security.SecureRandom().nextInt(99_999), null,
                com.uslbd.ulms.customer.Customer.Segment.SME,
                "+8801712345679", null, "BR-001"),
                java.util.UUID.randomUUID(), "user:test", java.util.UUID.randomUUID());
        customers.screen(flagged.getId(), "t");
        var edd = aml.posture(flagged.getId());
        assertThat(edd.cddLevel()).isEqualTo("EDD");
        assertThat(edd.risk()).isEqualTo("High");
        assertThat(edd.screeningHits()).hasSize(1);
    }
}

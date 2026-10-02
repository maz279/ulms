package com.uslbd.ulms.servicing;

import com.uslbd.ulms.customer.CustomerCreateRequest;
import com.uslbd.ulms.customer.CustomerService;
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

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * R10 P-E servicing depth: ops-surface validation (BLR apply, moratorium,
 * top-up) and the tax-certificate PDF renderer. The loan economics
 * (re-pricing, capitalization, combined exposure) are pinned in
 * R10PlatformAndServicingTest; this class pins the guards + the PDF bytes.
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class R10ServicingDepthTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractPort clientPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 8400 + seq.incrementAndGet();
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

    @Autowired FloatingRateService floating;
    @Autowired LoanRepository loans;
    @Autowired CustomerService customers;

    private UUID newCustomer() {
        return customers.create(new CustomerCreateRequest(
                "P-E Person " + System.nanoTime() % 100_000, null,
                com.uslbd.ulms.customer.Customer.Segment.RETAIL,
                "+8801712345678", null, "BR-001"),
                UUID.randomUUID(), "test", UUID.randomUUID()).getId();
    }

    @Test
    void moratoriumRejectsBadMonthsAndTopUpRejectsNonPositive() {
        UUID cust = newCustomer();
        Loan loan = loans.save(Loan.demo(UUID.randomUUID(), cust, "LN-PE1", 500_000_00L, 0));

        assertThatThrownBy(() -> floating.grantMoratorium(loan.getId(), 0, "test"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
        assertThatThrownBy(() -> floating.grantMoratorium(loan.getId(), 13, "test"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
        assertThatThrownBy(() -> floating.topUp(loan.getId(), 0, "test"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
        assertThatThrownBy(() -> floating.grantMoratorium(UUID.randomUUID(), 3, "test"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void blrRejectsNonPositiveThenApplies() {
        assertThatThrownBy(() -> floating.applyBlr(0, "test"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
        var result = floating.applyBlr(950, "test");
        assertThat(result.toBp()).isEqualTo(950);
        assertThat(floating.currentBlrBp()).isEqualTo(950);
    }

    @Test
    void taxCertificateRendererProducesRealPdfBytes() {
        // the bilingual certificate shape the endpoint renders (CertificateController)
        String html = "<html><body><h2>Tax Certificate / \u0995\u09b0 \u09b8\u09a8\u09a6\u09aa\u09a4\u09cd\u09b0</h2>"
                + "<table border='1'><tr><th>Loan</th><th>Interest (BDT)</th></tr>"
                + "<tr><td>LN-PE2</td><td>1200.00</td></tr></table></body></html>";
        byte[] pdf = PdfRenderer.htmlToPdf(html);
        assertThat(PdfRenderer.looksLikePdf(pdf))
                .as("openhtmltopdf must emit a %PDF header").isTrue();
        assertThat(pdf.length).isGreaterThan(500);
    }
}

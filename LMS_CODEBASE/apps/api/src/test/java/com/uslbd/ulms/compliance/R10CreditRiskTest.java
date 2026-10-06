package com.uslbd.ulms.compliance;

import com.uslbd.ulms.aml.MonitoringService;
import com.uslbd.ulms.aml.CtrReportRepository;
import com.uslbd.ulms.aml.MonitoringAlertRepository;
import com.uslbd.ulms.assessment.CollateralRegistryService;
import com.uslbd.ulms.customer.Customer;
import com.uslbd.ulms.customer.CustomerRepository;
import com.uslbd.ulms.servicing.Loan;
import com.uslbd.ulms.servicing.LoanRepository;
import com.uslbd.ulms.servicing.Payment;
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

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * R10 P-C + P-F integration: EOD classification overrides, collateral LTV
 * gate, transaction monitoring (CTR/velocity/structuring), Basel weights and
 * the 15% large-exposure check.
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class R10CreditRiskTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractPort clientPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 8200 + seq.incrementAndGet();
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

    @Autowired EodBatchService eod;
    @Autowired LoanRepository loans;
    @Autowired com.uslbd.ulms.customer.CustomerService customerService;
    @Autowired com.uslbd.ulms.servicing.PaymentRepository payments;
    @Autowired CollateralRegistryService collateral;
    @Autowired MonitoringService monitoring;
    @Autowired CtrReportRepository ctrs;
    @Autowired MonitoringAlertRepository alerts;
    @Autowired BaselService basel;

    private UUID newCustomer(String segment) {
        var c = customerService.create(new com.uslbd.ulms.customer.CustomerCreateRequest(
                "CR Person " + System.nanoTime() % 100_000, null,
                com.uslbd.ulms.customer.Customer.Segment.valueOf(segment),
                "+8801712345678", null, "BR-001"),
                UUID.randomUUID(), "test", UUID.randomUUID());
        return c.getId();
    }

    @Test
    void eodAppliesOverrideFloors() {
        UUID cust = newCustomer("RETAIL");
        Loan plain = loans.save(Loan.demo(UUID.randomUUID(), cust, "LN-CR1", 100_000_00L, 45));
        Loan legal = Loan.demo(UUID.randomUUID(), cust, "LN-CR2", 100_000_00L, 10);
        legal.markLegal();                       // flags BEFORE save — they persist
        loans.save(legal);
        Loan bankrupt = Loan.demo(UUID.randomUUID(), cust, "LN-CR3", 100_000_00L, 0);
        bankrupt.markBankrupt();
        loans.save(bankrupt);

        eod.run(LocalDate.now(), "test");

        // read back fresh — EOD mutates its own managed copies
        assertThat(loans.findById(plain.getId()).orElseThrow().getClassification())
                .isEqualTo("STD-2");                                     // DPD 45
        assertThat(loans.findById(legal.getId()).orElseThrow().getClassification())
                .isEqualTo("SS");                                        // floored by legal flag
        assertThat(loans.findById(bankrupt.getId()).orElseThrow().getClassification())
                .isEqualTo("B/L");
    }

    @Test
    void collateralLtvGateFlagsBreach() {
        UUID cust = newCustomer("RETAIL");
        var col = collateral.register(new CollateralRegistryService.RegisterRequest(
                null, cust, "FDR", "term deposit",
                100_000_00L, 90_000_00L, LocalDate.now(), null), "test");
        assertThat(col.getForcedSaleValueMinor()).isEqualTo(90_000_00L);

        // FDR cap 90% of realizable (min(MV,FSV)=90L) → acceptable 81L
        var ok = collateral.checkLtv(cust, 80_000_00L, 0, "test");
        assertThat(ok.breach()).isFalse();
        var breach = collateral.checkLtv(cust, 100_000_00L, 0, "test");
        assertThat(breach.breach()).isTrue();
        assertThat(breach.acceptableMinor()).isEqualTo(81_000_00L);
    }

    @Test
    void monitoringGeneratesCtrVelocityAndStructuring() {
        UUID cust = newCustomer("RETAIL");
        Loan loan = loans.save(Loan.demo(UUID.randomUUID(), cust, "LN-CR4", 500_000_00L, 0));
        Customer c = customerService.get(cust);

        // CTR: cash at/above ৳10 L → row; just-under does not
        monitoring.observe(payments.save(Payment.of(UUID.randomUUID(), loan.getId(),
                MonitoringService.CTR_THRESHOLD_MINOR, "CTR-" + UUID.randomUUID(),
                "COUNTER", null, null, "test")));
        monitoring.observe(payments.save(Payment.of(UUID.randomUUID(), loan.getId(),
                MonitoringService.CTR_THRESHOLD_MINOR - 1, "CTR-" + UUID.randomUUID(),
                "COUNTER", null, null, "test")));
        assertThat(ctrs.findAllByCifNoOrderByOccurredAtDesc(c.getCifNo())).hasSize(1);

        // STRUCTURING: 3 near-threshold cash payments within 24 h → alert
        for (int i = 0; i < 3; i++) {
            monitoring.observe(payments.save(Payment.of(UUID.randomUUID(), loan.getId(),
                    MonitoringService.CTR_THRESHOLD_MINOR * 85 / 100,
                    "STR-" + UUID.randomUUID(), "COUNTER", null, null, "test")));
        }
        assertThat(alerts.findAllByCifNoOrderByCreatedAtDesc(c.getCifNo()))
                .anyMatch(a -> "STRUCTURING".equals(a.getRule()));

        // VELOCITY: >5 payments within the hour
        UUID cust2 = newCustomer("RETAIL");
        Loan loan2 = loans.save(Loan.demo(UUID.randomUUID(), cust2, "LN-CR5", 500_000_00L, 0));
        Customer c2 = customerService.get(cust2);
        for (int i = 0; i < 7; i++) {
            monitoring.observe(payments.save(Payment.of(UUID.randomUUID(), loan2.getId(),
                    1_000_00L, "VEL-" + UUID.randomUUID(), "COUNTER", null, null, "test")));
        }
        assertThat(alerts.findAllByCifNoOrderByCreatedAtDesc(c2.getCifNo()))
                .anyMatch(a -> "VELOCITY".equals(a.getRule()));
    }

    @Test
    void baselWeightsOverridesAndLargeExposure() {
        UUID retail = newCustomer("RETAIL");
        UUID sme = newCustomer("SME");
        Loan stdRetail = loans.save(Loan.demo(UUID.randomUUID(), retail, "LN-CR6",
                100_000_000_00L, 0));                       // ৳10 M outstanding
        Loan ssLoan = loans.save(Loan.demo(UUID.randomUUID(), sme, "LN-CR7",
                100_000_000_00L, 120));
        ssLoan.reclassify("SS", true);

        // retail 75%, SME-with-SS 150% (classification override)
        assertThat(basel.rwaMinor(stdRetail)).isEqualTo(100_000_000_00L * 7500 / 10_000);
        assertThat(basel.rwaMinor(ssLoan)).isEqualTo(100_000_000_00L * 15000 / 10_000);

        // ৳10 Cr exposure vs ৳10 Cr capital = 100% → the 15% single-borrower
        // check MUST flag it (BASEL §4.3)
        assertThat(basel.largeExposureBreaches()).isNotEmpty();
        assertThat(basel.largeExposureBreaches())
                .allSatisfy(b -> assertThat((Double) b.get("percentOfCapital")).isGreaterThan(15.0));
        // summary carries the CAR inputs
        var summary = basel.rwaSummary();
        assertThat(summary).containsKeys("exposureMinor", "rwaMinor", "capitalMinor");
    }
}

package com.uslbd.ulms.platform;

import com.uslbd.ulms.collections.DunningLadderService;
import com.uslbd.ulms.collections.DunningStep;
import com.uslbd.ulms.collections.DunningStepRepository;
import com.uslbd.ulms.platform.audit.AuditAnchorService;
import com.uslbd.ulms.servicing.*;
import com.uslbd.ulms.customer.Customer;
import com.uslbd.ulms.customer.CustomerCreateRequest;
import com.uslbd.ulms.customer.CustomerService;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * R10 P-A + P-E integration: dunning config table, audit WORM anchor, EMI
 * D-3 emission, BLR re-price, moratorium capitalization, top-up.
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class R10PlatformAndServicingTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractPort clientPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 8000 + seq.incrementAndGet();
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

    @Autowired DunningLadderService dunning;
    @Autowired DunningStepRepository steps;
    @Autowired AuditAnchorService anchor;
    @Autowired EmiReminderService reminders;
    @Autowired FloatingRateService floating;
    @Autowired BlrRateRepository blr;
    @Autowired LoanRepository loans;
    @Autowired CustomerService customers;

    private UUID newCustomer() {
        return customers.create(new CustomerCreateRequest(
                "R10 Person " + System.nanoTime() % 100_000, null,
                Customer.Segment.RETAIL, "+8801712345678", null, "BR-001"),
                UUID.randomUUID(), "test", UUID.randomUUID()).getId();
    }

    @Test
    void dunningLadderIsConfigDrivenSixSteps() {
        var all = steps.findAllByOrderByMinDpdAsc();
        assertThat(all).hasSize(6);
        assertThat(dunning.stepFor(1).getActionType()).isEqualTo("SMS");
        assertThat(dunning.stepFor(7).getActionType()).isEqualTo("CALL");
        assertThat(dunning.stepFor(15).getActionType()).isEqualTo("VISIT");
        assertThat(dunning.stepFor(30).getActionType()).isEqualTo("NOTICE");
        assertThat(dunning.stepFor(60).getActionType()).isEqualTo("STRATEGY");
        assertThat(dunning.stepFor(120).getActionType()).isEqualTo("NPA_RECOVERY");
        assertThat(dunning.stepFor(120).getCadenceDays()).isEqualTo(14);
        assertThat(dunning.stepFor(0)).isNull();
    }

    @Test
    void auditAnchorExportsChainTipManifest() {
        String key = anchor.exportAnchor(LocalDate.now());
        assertThat(key).isEqualTo("worm/audit-anchor/" + LocalDate.now() + ".json");
    }

    @Test
    void emiReminderFiresExactlyThreeDaysBeforeDue() {
        UUID customerId = newCustomer();
        Loan loan = Loan.demo(UUID.randomUUID(), customerId, "LN-R10A", 500_000_00L, 0);
        // due-day = monthly anniversary of first EMI (disbursement + 1 month):
        // craft disbursedAt so nextDue == today + 3 — set BEFORE save (persisted)
        java.time.Instant disbursedAt = LocalDate.now().plusDays(3).minusMonths(1)
                .atStartOfDay(java.time.ZoneId.of("Asia/Dhaka")).toInstant();
        setDisbursed(loan, disbursedAt);
        loans.save(loan);
        int emitted = reminders.runOnce(LocalDate.now());
        assertThat(emitted).isGreaterThanOrEqualTo(1);
        assertThat(reminders.remindingLoans(LocalDate.now())).contains(loan.getId());
    }

    @Test
    void blrRepriceTouchesOnlyFloatingLoans() {
        UUID customerId = newCustomer();
        Loan fixed = loans.save(Loan.demo(UUID.randomUUID(), customerId, "LN-R10B", 100_000_00L, 0));
        Loan floatingLoan = Loan.demo(UUID.randomUUID(), customerId, "LN-R10C", 100_000_00L, 0);
        setFloating(floatingLoan, 250);   // spread 2.5% — set BEFORE save
        loans.save(floatingLoan);

        var result = floating.applyBlr(950, "test");
        assertThat(result.repricedLoans()).isEqualTo(1);
        assertThat(loans.findById(floatingLoan.getId()).orElseThrow().getInterestRateBp())
                .isEqualTo(1200);                                        // 950 + 250
        assertThat(loans.findById(fixed.getId()).orElseThrow().getInterestRateBp())
                .isEqualTo(1199);                                        // untouched default
        assertThat(floating.currentBlrBp()).isEqualTo(950);
    }

    @Test
    void moratoriumCapitalizesAndTopUpRaises() {
        UUID customerId = newCustomer();
        Loan loan = loans.save(Loan.demo(UUID.randomUUID(), customerId, "LN-R10D", 1_200_000_00L, 0));
        long before = loan.getOutstandingMinor();

        Loan afterMoratorium = floating.grantMoratorium(loan.getId(), 3, "test");
        long monthlyInterest = Math.round(before * 1199 / 12.0 / 10_000.0);
        assertThat(afterMoratorium.getOutstandingMinor())
                .isEqualTo(before + 3 * monthlyInterest);
        assertThat(afterMoratorium.getMoratoriumMonths()).isEqualTo(3);

        long outstandingBeforeTopUp = afterMoratorium.getOutstandingMinor();
        Loan afterTopUp = floating.topUp(loan.getId(), 200_000_00L, "test");
        assertThat(afterTopUp.getPrincipalMinor()).isEqualTo(1_400_000_00L);
        assertThat(afterTopUp.getOutstandingMinor())
                .isEqualTo(outstandingBeforeTopUp + 200_000_00L);
    }

    private static void setDisbursed(Loan loan, java.time.Instant at) {
        try {
            var f = Loan.class.getDeclaredField("disbursedAt");
            f.setAccessible(true); f.set(loan, at);
        } catch (ReflectiveOperationException e) { throw new IllegalStateException(e); }
    }

    private static void setFloating(Loan loan, int spreadBp) {
        try {
            var rt = Loan.class.getDeclaredField("rateType");
            rt.setAccessible(true); rt.set(loan, "FLOATING");
            var sp = Loan.class.getDeclaredField("spreadBp");
            sp.setAccessible(true); sp.set(loan, spreadBp);
        } catch (ReflectiveOperationException e) { throw new IllegalStateException(e); }
    }
}

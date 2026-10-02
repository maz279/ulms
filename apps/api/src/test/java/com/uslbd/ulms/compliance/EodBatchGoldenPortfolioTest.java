package com.uslbd.ulms.compliance;

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

import java.security.SecureRandom;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Golden classification suite over a seeded portfolio (03 mod-compliance
 * tests: "golden classification suite over seeded portfolio"): one demo loan
 * per BRPD class, EOD rerun idempotency, migration list (from→to), interest
 * suspense flags, board payload.
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class EodBatchGoldenPortfolioTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractPort clientPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 6000 + seq.incrementAndGet();
        }
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractLoanPort loanPort() {
            return spec -> 6666L;
        }
        @Bean @Primary com.uslbd.ulms.integration.docs.DocumentStorePort docPort() {
            return new com.uslbd.ulms.integration.docs.DocumentStorePort() {
                @Override public StoredObject put(String key, java.io.InputStream bytes,
                                                  long size, String contentType) {
                    return new StoredObject(key, "0".repeat(64), size);
                }
                @Override public String presignedGetUrl(String key, DurationTtl ttl) {
                    return "http://minio.local/" + key;
                }
            };
        }
    }

    @Autowired EodBatchService eod;
    @Autowired com.uslbd.ulms.servicing.LoanRepository loans;
    @Autowired com.uslbd.ulms.customer.CustomerService customers;
    @Autowired JdbcTemplate jdbc;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final long OUTSTANDING = 100_000_000L;   // ৳10L per demo loan

    private UUID demoCustomer() {
        var req = new com.uslbd.ulms.customer.CustomerCreateRequest(
                "Demo Holder", null, com.uslbd.ulms.customer.Customer.Segment.RETAIL,
                "+8801712345678", null, "BR-001");
        return customers.create(req, UUID.randomUUID(), "user:test", UUID.randomUUID()).getId();
    }

    /** Seed the 7-class portfolio directly (mirrors migrate/seed semantics). */
    private void seedPortfolio(UUID customerId) {
        int[] dpds = {0, 15, 45, 75, 120, 250, 400};   // one per BRPD class
        int i = RANDOM.nextInt(1000);
        for (int dpd : dpds) {
            loans.save(com.uslbd.ulms.servicing.Loan.demo(UUID.randomUUID(),
                    customerId, "LN-G" + (i++) + "-" + dpd, OUTSTANDING, dpd));
        }
    }

    @Test
    void goldenPortfolioClassifiesAndProvisions() {
        UUID customer = demoCustomer();
        seedPortfolio(customer);

        var run = eod.run(LocalDate.now(), "user:compliance");
        assertThat(run.loansClassified()).isGreaterThanOrEqualTo(7);
        // expected provisions: 3×1% + 5% + 20% + 50% + 100% on ৳10L each
        long expected = OUTSTANDING * 3 / 100        // STD-0/1/2 @1%
                + OUTSTANDING * 5 / 100              // SMA @5%
                + OUTSTANDING * 20 / 100             // SS @20%
                + OUTSTANDING * 50 / 100             // DF @50%
                + OUTSTANDING;                       // B/L @100%
        assertThat(run.provisionsByClass()).containsEntry("STD-0", OUTSTANDING / 100L)
                .containsEntry("SMA", OUTSTANDING * 5 / 100)
                .containsEntry("SS", OUTSTANDING * 20 / 100)
                .containsEntry("DF", OUTSTANDING * 50 / 100)
                .containsEntry("B/L", OUTSTANDING);

        // loan mirrors updated with class + suspense from SS onward
        var ss = loans.findAllByStageOrderByDpdDesc("ACTIVE").stream()
                .filter(l -> l.getDpd() == 120).findFirst().orElseThrow();
        assertThat(ss.getClassification()).isEqualTo("SS");
        assertThat(ss.isInterestSuspense()).isTrue();
        var std = loans.findAllByStageOrderByDpdDesc("ACTIVE").stream()
                .filter(l -> l.getDpd() == 45).findFirst().orElseThrow();
        assertThat(std.getClassification()).isEqualTo("STD-2");
        assertThat(std.isInterestSuspense()).isFalse();

        // migration list: rerun the next day with unchanged DPDs → from == to
        LocalDate day2 = LocalDate.now().plusDays(1);
        eod.run(day2, "user:compliance");
        Integer migrations = jdbc.queryForObject(
                "select count(*) from ulms.classification_history where run_date = ? and from_class <> to_class",
                Integer.class, java.sql.Date.valueOf(day2));
        assertThat(migrations).isZero();   // stable portfolio → no class migrations

        // board payload carries the run + portfolio + alerts
        var board = eod.board();
        assertThat(board).containsKeys("latestRun", "loans", "openAlerts");
    }
}

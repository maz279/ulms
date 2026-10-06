package com.uslbd.ulms.assessment;

import com.uslbd.ulms.integration.fineract.FineractPort;
import com.uslbd.ulms.platform.MoneyMath;
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

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Assessment oracles (03 mod-assessment): DBR formula parity with the
 * frontend calculator (same inputs), CIB obligation aggregation, scorecard
 * versioning + determinism, DBR-band policy routing.
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class AssessmentServiceTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary FineractPort fineractPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 7000 + seq.incrementAndGet();
        }
        /** Pulls now persist raw to the object store (06 §5) — stub the port. */
        @Bean @Primary com.uslbd.ulms.integration.docs.DocumentStorePort docPort() {
            return new com.uslbd.ulms.integration.docs.DocumentStorePort() {
                @Override public StoredObject put(String key, java.io.InputStream bytes,
                                                  long size, String contentType) {
                    return new StoredObject(key, "a".repeat(64), size);
                }
                @Override public String presignedGetUrl(String key, DurationTtl ttl) {
                    return "http://minio.local/" + key;
                }
            };
        }
    }

    @Autowired AssessmentService assessment;
    @Autowired com.uslbd.ulms.customer.CustomerService customers;
    @Autowired JdbcTemplate jdbc;

    private static final SecureRandom RANDOM = new SecureRandom();

    private UUID customerWithCib() {
        var req = new com.uslbd.ulms.customer.CustomerCreateRequest(
                "Assess Person", null, com.uslbd.ulms.customer.Customer.Segment.SME,
                "+8801712345678", null, "BR-001");
        var c = customers.create(req, UUID.randomUUID(), "user:test", UUID.randomUUID());
        var report = assessment.pullCib(c.getId(), c.getCifNo(), "user:test");
        assertThat(report.getStatus()).isEqualTo("PARSED");
        return c.getId();
    }

    @Test
    void dbrFormulaParityWithFrontendOracle() {
        // frontend: (existing + cib + emi) / income × 100 — same numbers must match
        long income = 1_000_000_00L, existing = 50_000_00L, cib = 88_000_00L;
        long emi = MoneyMath.emiMonthly(150_000_000L, 48, new BigDecimal("0.1199"));
        BigDecimal backend = MoneyMath.dbrPercent(income, existing, cib, emi);
        double frontend = ((double) (existing + cib + emi) / income) * 100;
        assertThat(backend.doubleValue())
                .isCloseTo(frontend, org.assertj.core.data.Offset.offset(0.05));
    }

    @Test
    void cibObligationAggregatesFacilityInstallments() {
        UUID customerId = customerWithCib();
        // mock profile: ৳45k + ৳25k + ৳18k installments = ৳88k
        assertThat(assessment.cibObligationMinor(customerId)).isEqualTo(88_000_00L);
        assertThat(assessment.worstCibClassification(customerId)).isEqualTo("SMA");
    }

    @Test
    void pullIsDeduplicatedPerPeriodAndFile() {
        UUID customerId = customerWithCib();
        assessment.pullCib(customerId, customers.get(customerId).getCifNo(), "user:test");
        long rows = jdbc.queryForObject(
                "select count(*) from ulms.cib_report where customer_id = ?",
                Long.class, customerId);
        assertThat(rows).isEqualTo(1);   // 11 §1: re-pull same (cif, period, file) is a no-op
    }

    @Test
    void rawNeverLandsInPlaintext_andFileChannelSharesTheParser() {
        UUID customerId = customerWithCib();

        // 06 §5: raw is in the object store, only the key + parsed JSONB in DB
        Map<String, Object> row = jdbc.queryForMap(
                "select raw, storage_key, parsed from ulms.cib_report where customer_id = ?",
                customerId);
        assertThat(row.get("raw")).isNull();
        assertThat((String) row.get("storage_key")).startsWith("cib-reports/");
        assertThat(String.valueOf(row.get("parsed"))).contains("subjectName");   // jsonb → PGobject

        // 11 §1 file channel: same parser, different source tag, own dedupe axis
        var cif = customers.get(customerId).getCifNo();
        var raw = new com.uslbd.ulms.integration.cib.CibMockAdapter().pullReport(cif, "2026-08");
        var fileReport = assessment.ingestFile(customerId, cif, "2026-08", "SFTP-D0901", raw, "user:test");
        assertThat(fileReport.getStatus()).isEqualTo("PARSED");
        assertThat(fileReport.getSource()).isEqualTo("FILE");
        long fileRows = jdbc.queryForObject(
                "select count(*) from ulms.cib_report where customer_id = ? and source = 'FILE'",
                Long.class, customerId);
        assertThat(fileRows).isEqualTo(1);
        // re-ingest same (cif, period, file) → dedupe, no second row
        assessment.ingestFile(customerId, cif, "2026-08", "SFTP-D0901", raw, "user:test");
        assertThat(jdbc.queryForObject(
                "select count(*) from ulms.cib_report where customer_id = ? and source = 'FILE'",
                Long.class, customerId)).isEqualTo(1);

        // viewer carries pull history (03: "parsed facilities + history")
        assertThat(service_latestCib(customerId).pullHistory().size()).isEqualTo(2);
        // obligation reads the latest PERIOD (2026-09 realtime), not the just-
        // ingested older file (2026-08 with no facilities)
        assertThat(assessment.cibObligationMinor(customerId)).isEqualTo(88_000_00L);
    }

    private com.uslbd.ulms.assessment.AssessmentService.CibView service_latestCib(UUID customerId) {
        return assessment.latestCib(customerId);
    }

    @Test
    void scoringIsVersionedAndDeterministic() {
        UUID customerId = customerWithCib();
        UUID applicationId = realApplicationFor(customerId);   // FK requires a real row
        var facts = new ApplicationFactsProvider.ApplicationFacts(
                applicationId, customerId, 150_000_000L, 24, "FIXED",
                1_000_000_00L, 0L, 0L, null);
        var first = assessment.assessApplication(facts, "user:test");
        var second = assessment.assessApplication(facts, "user:test");

        assertThat(first.score().getVersion()).isEqualTo(ScoringPolicy.VERSION);
        assertThat(first.score().getScore()).isEqualTo(second.score().getScore());   // deterministic
        // EMI ৳15L/24m ≈ ৳70.8k + bureau ৳88k → DBR ≈ 15.9% → band ≤30% (+80)
        // worst CIB SMA (+0), tenor 24 (+20) → 600 → grade C → REFER
        assertThat(first.score().getGrade()).isEqualTo("C");
        assertThat(first.score().getDecision()).isEqualTo("REFER");
        assertThat(first.dbr()).isEqualByComparingTo(new BigDecimal("15.9"));
    }

    @Test
    void collateralValuationHistoryGrowsOnRevalue() {
        UUID customerId = customerWithCib();
        UUID applicationId = realApplicationFor(customerId);
        var c = assessment.addCollateral(applicationId, "LAND", "Mouza: Savar", 200_000_000L,
                java.time.LocalDate.of(2026, 1, 15), null, "user:test");
        assertThat(assessment.valuationHistory(c.getId())).hasSize(1);   // initial valuation row

        var revalued = assessment.revalueCollateral(c.getId(), 250_000_000L,
                java.time.LocalDate.of(2026, 9, 1), "user:test");
        assertThat(revalued.getValueMinor()).isEqualTo(250_000_000L);    // current updated
        var history = assessment.valuationHistory(c.getId());
        assertThat(history).hasSize(2);                                  // 04 §3: append-only
        assertThat(history.get(0).getValueMinor()).isEqualTo(200_000_000L);
        assertThat(history.get(1).getValueMinor()).isEqualTo(250_000_000L);
    }

    /** score_result.application_id is FK-bound — insert a real application row. */
    private UUID realApplicationFor(UUID customerId) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
            insert into ulms.application (id, app_no, customer_id, product_code, amount_minor,
                tenor_months, rate_type, stage, branch_code, created_by)
            values (?, ?, ?, 'sme-term', 150000000, 24, 'FIXED', 'SCREENING', 'BR-001', 'user:test')
            """, id, "APP-T" + RANDOM.nextInt(99_999), customerId);
        return id;
    }

    @Test
    void dbrBandPolicyRouting() {
        // ≤30% vs >50% drive the scorecard apart (03: DBR formula per policy matrix)
        var low = ScoringPolicy.evaluate("STD-0", new BigDecimal("25"), 0, 100, 24);
        var high = ScoringPolicy.evaluate("STD-0", new BigDecimal("55"), 0, 100, 24);
        assertThat(low.decision()).isNotEqualTo("AUTO_DECLINE");
        assertThat(high.decision()).isEqualTo("AUTO_DECLINE");   // >50% always declines
    }
}

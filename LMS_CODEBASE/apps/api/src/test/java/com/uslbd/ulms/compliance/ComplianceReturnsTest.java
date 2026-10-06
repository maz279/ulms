package com.uslbd.ulms.compliance;

import com.uslbd.ulms.collections.CollectionsService;
import com.uslbd.ulms.customer.CustomerCreateRequest;
import com.uslbd.ulms.customer.CustomerService;
import com.uslbd.ulms.integration.cib.CibFixedWidthParser;
import com.uslbd.ulms.servicing.Loan;
import com.uslbd.ulms.servicing.LoanRepository;
import com.uslbd.ulms.servicing.PaymentService;
import com.uslbd.ulms.servicing.ServicingService;
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
import java.time.YearMonth;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * P4 golden pack suite (03 mod-compliance tests row): the CL-1..CL-5 pack over
 * the seeded 7-class portfolio, the preparer→checker→compliance sign-off
 * chain, WORM file rendering with checksum verification, the ECL runway
 * snapshot, Basel CAR inputs, CIB fixed-width files, and the reporting read
 * model. Generation is idempotent per (code, period).
 */
@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
class ComplianceReturnsTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractPort clientPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 7000 + seq.incrementAndGet();
        }
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractLoanPort loanPort() {
            return spec -> 7777L;
        }
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractJournalPort journalPort() {
            return (debit, credit, amountMinor, ref) -> "jv-test-" + Math.abs(ref.hashCode()) % 100000;
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

    @Autowired ReturnsService returnsService;
    @Autowired ReportingService reporting;
    @Autowired ProvisionJvService provisionJv;
    @Autowired ReportDefinitionRepository definitions;
    @Autowired EodBatchService eod;
    @Autowired LoanRepository loans;
    @Autowired CustomerService customers;
    @Autowired PaymentService paymentService;
    @Autowired ServicingService servicing;
    @Autowired CollectionsService collections;
    @Autowired ComplianceAlertRepository alerts;
    @Autowired JdbcTemplate jdbc;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final long OUTSTANDING = 100_000_000L;   // ৳10L per demo loan

    private UUID demoCustomer() {
        var req = new CustomerCreateRequest("Regcon Tester", null,
                com.uslbd.ulms.customer.Customer.Segment.RETAIL,
                "+8801799887766", null, "BR-001");
        return customers.create(req, UUID.randomUUID(), "user:test", UUID.randomUUID()).getId();
    }

    private void seedSevenClassPortfolio(UUID customerId) {
        int[] dpds = {0, 15, 45, 75, 120, 250, 400};
        int i = RANDOM.nextInt(1000);
        for (int dpd : dpds) {
            loans.save(Loan.demo(UUID.randomUUID(), customerId,
                    "LN-R" + (i++) + "-" + dpd, OUTSTANDING, dpd));
        }
    }

    @Test
    void clPackSignOffChainFilesAndCalendarKpis() {
        UUID customer = demoCustomer();
        seedSevenClassPortfolio(customer);
        eod.run(LocalDate.now(), "user:compliance");
        String period = YearMonth.now().toString();

        // in-period facts: recovery on the B/L loan, a restructure, a write-off case
        Loan bl = loans.findAllByStageOrderByDpdDesc("ACTIVE").stream()
                .filter(l -> l.getDpd() == 400).findFirst().orElseThrow();
        Loan std0 = loans.findAllByStageOrderByDpdDesc("ACTIVE").stream()
                .filter(l -> l.getDpd() == 0).findFirst().orElseThrow();
        Loan df = loans.findAllByStageOrderByDpdDesc("ACTIVE").stream()
                .filter(l -> l.getDpd() == 250).findFirst().orElseThrow();
        paymentService.postPayment(bl.getId(), 100_000L, "RCV-" + UUID.randomUUID(), "BEFTN", null, "user:officer");
        servicing.decideReschedule(
                servicing.requestReschedule(std0.getId(), 24, "income shock", "user:officer").getId(),
                true, "user:manager");
        var case30 = collections.fileCase(df.getId(), "Dhaka Money Loan Court", LocalDate.now(),
                OUTSTANDING, "Adv. Karim", "test claim", "user:officer");
        collections.updateCaseStatus(case30.getId(), "WRITE_OFF", "user:officer");

        // ── CL-1: exactly the classified loans (SS/DF/B/L) ─────────────────
        var cl1 = returnsService.generate("CL-1", period, "user:compliance");
        assertThat(cl1.getStatus()).isEqualTo("STAGED");
        assertThat(cl1.getPreparer()).isEqualTo("system:regcon");
        assertThat(cl1.getRowCount()).isEqualTo(3);
        var rows = ReturnsServiceRows.of(cl1);
        assertThat(rows).extracting(r -> r.get("classification"))
                .containsExactlyInAnyOrder("SS", "DF", "B/L");
        assertThat(rows).allSatisfy(r ->
                assertThat((String) r.get("outstanding_taka")).isEqualTo("1000000.00"));

        // regenerate same (code, period) replaces wholesale — idempotent
        var cl1again = returnsService.generate("CL-1", period, "user:compliance");
        Integer count = jdbc.queryForObject(
                "select count(*) from ulms.regulatory_return where code = 'CL-1' and period = ?",
                Integer.class, period);
        assertThat(count).isEqualTo(1);
        assertThat(cl1again.getId()).isNotEqualTo(cl1.getId());

        // ── CL-2: provisioning by class matches the BRPD matrix ───────────
        var cl2 = returnsService.generate("CL-2", period, "user:compliance");
        var cl2rows = ReturnsServiceRows.of(cl2);
        assertThat(cl2rows).hasSize(7);
        assertThat(cl2rows.stream().filter(r -> "SS".equals(r.get("classification")))
                .findFirst().orElseThrow().get("provision_taka")).isEqualTo("200000.00");

        // ── CL-3: the posted recovery, and only that ──────────────────────
        var cl3 = returnsService.generate("CL-3", period, "user:compliance");
        var cl3rows = ReturnsServiceRows.of(cl3);
        assertThat(cl3rows).hasSize(1);
        assertThat(cl3rows.get(0).get("recovered_taka")).isEqualTo("1000.00");
        assertThat(cl3rows.get(0).get("classification")).isEqualTo("B/L");

        // ── CL-4: the WRITE_OFF legal case ────────────────────────────────
        var cl4 = returnsService.generate("CL-4", period, "user:compliance");
        assertThat(ReturnsServiceRows.of(cl4)).hasSize(1);
        assertThat(ReturnsServiceRows.of(cl4).get(0).get("status")).isEqualTo("WRITE_OFF");

        // ── CL-5: the approved restructure ────────────────────────────────
        var cl5 = returnsService.generate("CL-5", period, "user:compliance");
        var cl5rows = ReturnsServiceRows.of(cl5);
        assertThat(cl5rows).hasSize(1);
        assertThat(cl5rows.get(0).get("new_tenor_months")).isEqualTo(24);

        // ── sign-off chain: preparer → checker → compliance (out-of-order rejected) ──
        UUID id = cl1again.getId();
        assertThatThrownBy(() -> returnsService.fileReturn(id, "user:compliance"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("preparer → checker → compliance");
        var checked = returnsService.check(id, "user:checker");
        assertThat(checked.getStatus()).isEqualTo("CHECKED");
        assertThat(checked.getChecker()).isEqualTo("user:checker");
        assertThatThrownBy(() -> returnsService.check(id, "user:checker2"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("checker sign-off applies to STAGED packs only");
        // 06 §8 maker-checker: compliance sign-off must be a DIFFERENT officer
        assertThatThrownBy(() -> returnsService.fileReturn(id, "user:checker"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("DIFFERENT officer");
        var filed = returnsService.fileReturn(id, "user:compliance");
        assertThat(filed.getStatus()).isEqualTo("FILED");
        assertThat(filed.getSubmittedAt()).isNotNull();
        assertThat(filed.getComplianceOfficer()).isEqualTo("user:compliance");

        // ── WORM staging (11 §6): the rendered file lands in the object store ──
        assertThat(filed.getStorageKey()).isEqualTo("regcon/CL-1/" + period + ".csv");
        Integer staged = jdbc.queryForObject(
                "select count(*) from ulms.regulatory_return where storage_key is null", Integer.class);
        assertThat(staged).isZero();   // every pack carries its WORM key

        // ── WORM file: CSV render + checksum parity ───────────────────────
        var rendered = returnsService.file(id);
        assertThat(rendered.content()).startsWith("loan_no,cif,classification,dpd,outstanding_taka,interest_suspense");
        assertThat(rendered.content().lines().count()).isEqualTo(4);   // header + 3 classified
        assertThat(ReturnsService.sha256(rendered.content()))
                .isEqualTo(rendered.ret().getFileSha256());

        // ── board: statuses + KPIs (prototype pgRegcon) ───────────────────
        var board = returnsService.board(LocalDate.now());
        assertThat((Iterable<?>) board.get("entries")).hasSize(18);   // 12 + SCH-BR-1..6 (R10 P-F)
        var kpis = (Map<?, ?>) board.get("kpis");
        assertThat(kpis.get("dueIn30Days")).isNotNull();
        assertThat((Integer) kpis.get("dueIn30Days")).isGreaterThanOrEqualTo(1);
        assertThat((Long) kpis.get("onTimeStreak")).isGreaterThanOrEqualTo(1);
        assertThat((Double) kpis.get("carPercent")).isGreaterThan(12.5);
        assertThat(kpis.get("eclRunwayMonths")).isEqualTo(EclModel.runwayMonths(LocalDate.now()));

        // ── CIB subject file: fixed-width, parser round-trip ──────────────
        var cibs = returnsService.generate("CIB-S", period, "user:compliance");
        assertThat(cibs.getFileFormat()).isEqualTo("fixed-width");
        var cibRendered = returnsService.file(cibs.getId());
        String[] lines = cibRendered.content().split("\n");
        assertThat(lines[0]).startsWith("HDR," + period);
        assertThat(lines[1]).startsWith("SUBJ,");
        long facl = java.util.Arrays.stream(lines).filter(l -> l.startsWith("FACL")).count();
        assertThat(facl).isGreaterThanOrEqualTo(7);
        assertThat(lines).allSatisfy(l -> {
            if (l.startsWith("FACL")) assertThat(l).hasSize(159);
        });
        assertThat(lines[lines.length - 1]).isEqualTo("TRLR," + facl);
        CibFixedWidthParser.Parsed parsed = CibFixedWidthParser.parse(cibRendered.content());
        assertThat(parsed.facilities()).hasSize((int) facl);
        assertThat(parsed.quarantinedRaw()).isEmpty();

        // CIB contract file is one FACL per contract
        var cibc = returnsService.generate("CIB-C", period, "user:compliance");
        var contractRendered = returnsService.file(cibc.getId());
        long contractFacl = contractRendered.content().lines()
                .filter(l -> l.startsWith("FACL")).count();
        assertThat(contractFacl).isEqualTo(facl);

        // ── ECL runway: snapshot persisted, PD×LGD×EAD math vs live mirrors ──
        var eclPack = returnsService.generate("ECL", period, "user:compliance");
        LocalDate asOf = YearMonth.parse(period).atEndOfMonth();
        var eclBoard = returnsService.eclBoard(asOf);
        var active = loans.findAllByStageOrderByDpdDesc("ACTIVE");
        long expectedEcl = active.stream().mapToLong(l -> EclModel.eclMinor(
                l.getOutstandingMinor(), EclModel.pdBp(l.getClassification()), EclModel.LGD_BP)).sum();
        long expectedBrpd = active.stream().mapToLong(l -> BrpdClassifier.byName(l.getClassification())
                .provisionMinor(l.getOutstandingMinor())).sum();
        assertThat((Iterable<?>) eclBoard.get("rows")).hasSize(7);
        assertThat(eclBoard.get("eclMinor")).isEqualTo(expectedEcl);
        assertThat(eclBoard.get("brpdProvisionMinor")).isEqualTo(expectedBrpd);
        assertThat(eclBoard.get("runwayMonths"))
                .isEqualTo(EclModel.runwayMonths(LocalDate.now()));
        assertThat(eclPack.getRowCount()).isEqualTo(7);

        // ── Basel CAR: RWA from live mirrors, ratio above the 12.5% floor ──
        var car = returnsService.carInputs();
        long expectedRwa = active.stream().mapToLong(l -> Math.round(l.getOutstandingMinor()
                * BaselCar.riskWeightBp(l.getClassification()) / 10_000.0)).sum();
        assertThat(car.get("rwa_taka")).isEqualTo(ReturnsService.taka(expectedRwa));
        assertThat((Double) car.get("car_percent")).isGreaterThan(12.5);
        assertThat(car.get("floor_percent")).isEqualTo(12.5);

        // ── guards: continuous channel + bad input ────────────────────────
        assertThatThrownBy(() -> returnsService.generate("CIB-R", period, "u"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("event-driven");
        assertThatThrownBy(() -> returnsService.generate("CL-1", "2026-13", "u"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("YYYY-MM");
        assertThatThrownBy(() -> returnsService.generate("CL-9", period, "u"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unknown return code");

        // ── reporting read model ──────────────────────────────────────────
        var portfolio = reporting.portfolio("classification");
        assertThat(portfolio.get("groupBy")).isEqualTo("classification");
        assertThat((Iterable<?>) portfolio.get("rows")).hasSize(7);
        var byBranch = reporting.portfolio("branch");
        @SuppressWarnings("unchecked")
        var branchRows = (java.util.List<Map<String, Object>>) byBranch.get("rows");
        assertThat(branchRows).isNotEmpty();
        assertThat(branchRows).extracting(r -> r.get("branch")).contains("BR-001");
        assertThatThrownBy(() -> reporting.portfolio("bogus"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("classification|stage|branch");
    }

    /**
     * Audit-G: the provision JV to the Fineract GL (03 "JV queue …
     * zero-sum") — idempotent per run-date, drift after posting blocked with
     * an alert — plus the report-writer definitions (12 W11).
     */
    @Test
    void provisionJvZeroSumIdempotentDriftBlocksAndWriterDefinitions() {
        UUID customer = demoCustomer();
        seedSevenClassPortfolio(customer);
        LocalDate runDate = LocalDate.now();
        var run = eod.run(runDate, "user:compliance");

        // zero-sum JV mirrors the run total exactly
        var jv = provisionJv.post(runDate, "user:officer");
        assertThat(jv.isZeroSum()).isTrue();
        assertThat(jv.getTotalMinor()).isEqualTo(run.totalProvisionMinor());
        assertThat(jv.getDebitsMinor()).isEqualTo(jv.getCreditsMinor());
        assertThat(jv.getFineractTxnId()).startsWith("jv-test-");
        assertThat(jv.getReferenceNumber()).isEqualTo("ULMS-JV-" + runDate.toString().replace("-", ""));

        // idempotent: unchanged rerun returns the SAME entry, no duplicate row
        eod.run(runDate, "user:compliance");
        var again = provisionJv.post(runDate, "user:officer2");
        assertThat(again.getId()).isEqualTo(jv.getId());

        // drift: a new loan changes the total → repost blocked + alert raised
        loans.save(Loan.demo(UUID.randomUUID(), customer,
                "LN-JV-" + RANDOM.nextInt(9999), OUTSTANDING, 500));
        var drifted = eod.run(runDate, "user:compliance");
        assertThat(drifted.totalProvisionMinor()).isNotEqualTo(jv.getTotalMinor());
        assertThatThrownBy(() -> provisionJv.post(runDate, "user:officer"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("reversing entry");
        assertThat(alerts.findAllByStateOrderByCreatedAtDesc("OPEN"))
                .anyMatch(a -> "PROVISION_JV_DRIFT".equals(a.getType()));

        // writer (12 W11): definitions save, run through the read model, reject dupes
        var def = definitions.save(ReportDefinition.of(UUID.randomUUID(),
                "Audit-G branch pack " + RANDOM.nextInt(9999), "branch", "monthly", "user:analyst"));
        assertThat(definitions.existsByName(def.getName())).isTrue();
        var executed = reporting.portfolio(def.getGroupBy());
        assertThat((Iterable<?>) executed.get("rows")).isNotEmpty();
        assertThatThrownBy(() -> reporting.portfolio("nope"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("classification|stage|branch");
    }

    /** Payload row access helper — rows are LinkedHashMaps inside the JSON payload. */
    static class ReturnsServiceRows {
        @SuppressWarnings("unchecked")
        static java.util.List<Map<String, Object>> of(RegulatoryReturn r) {
            return (java.util.List<Map<String, Object>>) (java.util.List<?>) com.uslbd.ulms.platform
                    .idempotency.IdempotencyService.parseJson(r.getPayload()).get("rows");
        }
    }
}

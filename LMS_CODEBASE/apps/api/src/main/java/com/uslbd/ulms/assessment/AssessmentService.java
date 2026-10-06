package com.uslbd.ulms.assessment;

import com.uslbd.ulms.integration.cib.CibFixedWidthParser;
import com.uslbd.ulms.integration.cib.CibPort;
import com.uslbd.ulms.integration.docs.DocumentStorePort;
import com.uslbd.ulms.platform.audit.AuditService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * Credit assessment (03 mod-assessment): CIB pull + parse, monthly obligation
 * aggregation, versioned scoring, DBR computation. Depends on NO other
 * business module — application facts arrive via {@link ApplicationFactsProvider}
 * (implemented by mod-origination), so the module graph stays acyclic.
 */
@Service
public class AssessmentService {

    private final CibReportRepository reports;
    private final CibFacilityRepository facilities;
    private final ScoreResultRepository scores;
    private final CollateralRepository collateral;
    private final CollateralValuationRepository valuations;
    private final CibPort cib;
    private final DocumentStorePort documentStore;
    private final com.uslbd.ulms.compliance.EodBatchService alertSink;   // RB-05 ops alerts
    private final AuditService audit;

    AssessmentService(CibReportRepository reports, CibFacilityRepository facilities,
                      ScoreResultRepository scores, CollateralRepository collateral,
                      CollateralValuationRepository valuations,
                      CibPort cib, DocumentStorePort documentStore,
                      com.uslbd.ulms.compliance.EodBatchService alertSink,
                      AuditService audit) {
        this.reports = reports; this.facilities = facilities;
        this.scores = scores; this.collateral = collateral; this.valuations = valuations;
        this.cib = cib; this.documentStore = documentStore;
        this.alertSink = alertSink; this.audit = audit;
    }

    /**
     * Pull + parse a report for a customer (11 §1: dedupe by cif/period/file).
     * Network pull retries ×5 with exponential backoff; final failure raises
     * the RB-05 ops alert and still persists a FAILED report row.
     */
    @Transactional
    public CibReport pullCib(UUID customerId, String cifNo, String actor) {
        String period = LocalDate.now(ZoneOffset.UTC).toString().substring(0, 7);
        String fileId = "MOCK-" + cifNo;
        // dedupe guard BEFORE insert — the unique violation would otherwise
        // surface at flush time, past any save()-level catch (11 §1)
        var existing = reports.findAllByCustomerIdOrderByPulledAtDesc(customerId).stream()
                .filter(r -> period.equals(r.getReportPeriod()) && fileId.equals(r.getFileId()))
                .findFirst();
        if (existing.isPresent()) return existing.get();

        String raw = pullWithRetry(customerId, cifNo, period, actor);
        if (raw == null) return null;   // FAILED report + alert already persisted
        return ingestRaw(customerId, cifNo, "MOCK_REALTIME", period, fileId, raw, actor);
    }

    /** 11 §1 failure mode: retry exp-backoff ×5, then ops alert RB-05 + FAILED row. */
    private String pullWithRetry(UUID customerId, String cifNo, String period, String actor) {
        RuntimeException last = null;
        for (int attempt = 1; attempt <= 5; attempt++) {
            try {
                return cib.pullReport(cifNo, period);
            } catch (RuntimeException e) {
                last = e;
                if (attempt < 5) {
                    try { Thread.sleep(200L << (attempt - 1)); }   // 200,400,800,1600ms
                    catch (InterruptedException ie) { Thread.currentThread().interrupt(); break; }
                }
            }
        }
        CibReport failed = CibReport.of(UUID.randomUUID(), customerId, cifNo,
                "MOCK_REALTIME", period, "MOCK-" + cifNo, actor);
        failed.markFailed("bureau unreachable after 5 attempts: "
                + (last == null ? "interrupted" : last.getMessage()));
        reports.save(failed);
        alertSink.raiseAlert("CIB_PULL_UNREACHABLE", "customer", customerId,
                "{\"cif\":\"" + cifNo + "\",\"attempts\":5,\"rule\":\"RB-05\"}");
        audit.record(actor, "CIB_PULL_FAILED", "customer", customerId,
                "{\"attempts\":5,\"rule\":\"RB-05\"}", UUID.randomUUID());
        return null;
    }

    /**
     * Monthly SFTP file channel (11 §1 `parseFile`): the SAME pure parser as
     * the real-time channel — both produce identical rows. Malformed rows are
     * quarantined (count in parsed JSON), never silently dropped.
     */
    @Transactional
    public CibReport ingestFile(UUID customerId, String cifNo, String period,
                                String fileId, String raw, String actor) {
        var existing = reports.findAllByCustomerIdOrderByPulledAtDesc(customerId).stream()
                .filter(r -> period.equals(r.getReportPeriod()) && fileId.equals(r.getFileId()))
                .findFirst();
        if (existing.isPresent()) return existing.get();   // 11 §1 dedupe, both channels
        return ingestRaw(customerId, cifNo, "FILE", period, fileId, raw, actor);
    }

    private CibReport ingestRaw(UUID customerId, String cifNo, String source,
                                String period, String fileId, String raw, String actor) {
        CibReport report = CibReport.of(UUID.randomUUID(), customerId, cifNo,
                source, period, fileId, actor);
        report = reports.save(report);
        // raw → encrypted object store FIRST (06 §5): even a malformed report
        // keeps its key so the raw is retained and reprocessable
        try {
            var stored = documentStore.put(
                    "cib-reports/" + cifNo + "/" + period + "-" + fileId + ".txt",
                    new java.io.ByteArrayInputStream(raw.getBytes(java.nio.charset.StandardCharsets.UTF_8)),
                    raw.length(), "text/plain");
            report.attachStorage(stored.key());
        } catch (RuntimeException e) {
            report.markFailed("raw store unavailable: " + e.getMessage());
            audit.record(actor, "CIB_PULL_FAILED", "customer", customerId,
                    "{\"error\":\"store\",\"detail\":\"" + e.getMessage() + "\"}", UUID.randomUUID());
            return report;
        }
        try {
            CibFixedWidthParser.Parsed parsed = CibFixedWidthParser.parse(raw);
            facilities.deleteAllByCibReportId(report.getId());
            for (CibFixedWidthParser.Facility f : parsed.facilities()) {
                facilities.save(CibFacility.of(UUID.randomUUID(), report.getId(), f));
            }
            report.markParsed("{\"subjectName\":\"" + parsed.subjectName()
                    + "\",\"quarantined\":" + parsed.quarantinedRaw().size() + "}");
            audit.record(actor, "CIB_PULLED", "customer", customerId,
                    "{\"period\":\"" + period + "\",\"facilities\":" + parsed.facilities().size()
                            + ",\"quarantined\":" + parsed.quarantinedRaw().size()
                            + ",\"source\":\"" + source + "\"}",
                    UUID.randomUUID());
        } catch (RuntimeException e) {
            report.markFailed(e.getMessage());
            audit.record(actor, "CIB_PULL_FAILED", "customer", customerId,
                    "{\"error\":\"" + e.getMessage() + "\"}", UUID.randomUUID());
        }
        return report;
    }

    public record CibView(CibReport report, List<CibFacility> facilities,
                          List<CibReport> pullHistory) {}

    /** Latest parsed report (by bureau PERIOD, not pull time — a just-arrived
     *  older monthly file must not shadow newer real-time data). */
    private CibReport latestData(UUID customerId) {
        return reports.findAllByCustomerIdOrderByReportPeriodDescPulledAtDesc(customerId)
                .stream().findFirst()
                .orElseThrow(() -> new NoSuchElementException("No CIB report pulled yet"));
    }

    /** Latest parsed report + facilities + pull history for the viewer (03). */
    @Transactional(readOnly = true)
    public CibView latestCib(UUID customerId) {
        CibReport report = latestData(customerId);
        List<CibReport> history = reports.findAllByCustomerIdOrderByPulledAtDesc(customerId);
        return new CibView(report, facilities.findAllByCibReportId(report.getId()), history);
    }

    /** Monthly bureau obligation feeding DBR — from the latest-period report. */
    @Transactional(readOnly = true)
    public long cibObligationMinor(UUID customerId) {
        return latestDataOpt(customerId)
                .filter(r -> "PARSED".equals(r.getStatus()))
                .map(r -> facilities.findAllByCibReportId(r.getId()).stream()
                        .mapToLong(f -> f.getInstallmentMinor() == null ? 0 : f.getInstallmentMinor())
                        .sum())
                .orElse(0L);
    }

    /** Worst classification across the customer's facilities (score input). */
    @Transactional(readOnly = true)
    public String worstCibClassification(UUID customerId) {
        List<String> order = List.of("BL", "DF", "SS", "SMA", "STD-2", "STD-1", "STD-0");
        return latestDataOpt(customerId)
                .filter(r -> "PARSED".equals(r.getStatus()))
                .map(r -> facilities.findAllByCibReportId(r.getId()).stream()
                        .map(CibFacility::getClassification)
                        .filter(order::contains)
                        .min(java.util.Comparator.comparingInt(order::indexOf))
                        .orElse(null))
                .orElse(null);
    }

    private java.util.Optional<CibReport> latestDataOpt(UUID customerId) {
        return reports.findAllByCustomerIdOrderByReportPeriodDescPulledAtDesc(customerId)
                .stream().findFirst();
    }

    /**
     * Full assessment for an application: server-computed DBR from stored
     * income + CIB obligations + the EMI oracle, then the versioned
     * scorecard. Returns everything the caller persists/routes on.
     */
    @Transactional
    public AssessmentOutcome assessApplication(ApplicationFactsProvider.ApplicationFacts f, String actor) {
        long proposedEmi = com.uslbd.ulms.platform.MoneyMath.emiMonthly(
                f.amountMinor(), f.tenorMonths(), rateOf(f.rateType()));
        long cibObligation = cibObligationMinor(f.customerId());
        BigDecimal dbr = f.computedDbr() != null ? f.computedDbr()
                : com.uslbd.ulms.platform.MoneyMath.dbrPercent(
                        f.incomeMinor() == null ? 0 : f.incomeMinor(),
                        f.existingEmiMinor() == null ? 0 : f.existingEmiMinor(),
                        cibObligation, proposedEmi);

        ScoringPolicy.Outcome out = ScoringPolicy.evaluate(
                worstCibClassification(f.customerId()), dbr,
                f.collateralValueMinor(), f.amountMinor(), f.tenorMonths());
        String factorsJson = com.uslbd.ulms.platform.idempotency.IdempotencyService.toJson(
                java.util.Map.of("dbrPercent", dbr == null ? "n/a" : dbr.toPlainString(),
                        "cibObligationMinor", cibObligation, "proposedEmiMinor", proposedEmi,
                        "factors", out.factors()));
        ScoreResult result = scores.save(ScoreResult.of(UUID.randomUUID(), f.applicationId(),
                ScoringPolicy.VERSION, out.score(), out.grade(), out.decision(),
                factorsJson, actor));
        audit.record(actor, "APPLICATION_SCORED", "application", f.applicationId(),
                "{\"score\":" + out.score() + ",\"grade\":\"" + out.grade()
                        + "\",\"decision\":\"" + out.decision() + "\",\"dbr\":\""
                        + (dbr == null ? "n/a" : dbr.toPlainString()) + "\"}",
                UUID.randomUUID());
        return new AssessmentOutcome(result, dbr, cibObligation, proposedEmi);
    }

    /**
     * DBR computation only (03: `POST /assessments/{applicationId}/dbr`) —
     * the policy-matrix breakdown without running the scorecard.
     */
    @Transactional
    public DbrBreakdown computeDbr(ApplicationFactsProvider.ApplicationFacts f, String actor) {
        long proposedEmi = com.uslbd.ulms.platform.MoneyMath.emiMonthly(
                f.amountMinor(), f.tenorMonths(), rateOf(f.rateType()));
        long cibObligation = cibObligationMinor(f.customerId());
        BigDecimal dbr = com.uslbd.ulms.platform.MoneyMath.dbrPercent(
                f.incomeMinor() == null ? 0 : f.incomeMinor(),
                f.existingEmiMinor() == null ? 0 : f.existingEmiMinor(),
                cibObligation, proposedEmi);
        audit.record(actor, "DBR_COMPUTED", "application", f.applicationId(),
                "{\"dbr\":\"" + (dbr == null ? "n/a" : dbr.toPlainString())
                        + "\",\"cibObligation\":" + cibObligation + "}", UUID.randomUUID());
        return new DbrBreakdown(dbr, cibObligation, proposedEmi,
                f.incomeMinor() == null ? 0 : f.incomeMinor(),
                f.existingEmiMinor() == null ? 0 : f.existingEmiMinor());
    }

    public record DbrBreakdown(BigDecimal dbrPercent, long cibObligationMinor,
                               long proposedEmiMinor, long incomeMinor, long existingEmiMinor) {}

    public record AssessmentOutcome(ScoreResult score, BigDecimal dbr,
                                    long cibObligationMinor, long proposedEmiMinor) {}

    /** Latest score for an application (viewer / pipeline). */
    @Transactional(readOnly = true)
    public ScoreResult latestScore(UUID applicationId) {
        return scores.findAllByApplicationIdOrderByComputedAtDesc(applicationId).stream()
                .findFirst().orElse(null);
    }

    @Transactional
    public Collateral addCollateral(UUID applicationId, String type, String description,
                                    long valueMinor, LocalDate valuedOn, LocalDate insuredUntil,
                                    String actor) {
        Collateral c = collateral.save(Collateral.of(UUID.randomUUID(), applicationId, type,
                description, valueMinor, valuedOn, insuredUntil, actor));
        valuations.save(CollateralValuation.of(UUID.randomUUID(), c.getId(), valueMinor,
                valuedOn, actor));   // initial valuation = first history row (04 §3)
        audit.record(actor, "COLLATERAL_ADDED", "application", applicationId,
                "{\"type\":\"" + type + "\",\"value\":" + valueMinor + "}", UUID.randomUUID());
        return c;
    }

    /** Revalue: appends a history row and updates the current value (04 §3). */
    @Transactional
    public Collateral revalueCollateral(UUID collateralId, long valueMinor,
                                        LocalDate valuedOn, String actor) {
        Collateral c = collateral.findById(collateralId)
                .orElseThrow(() -> new NoSuchElementException("No collateral " + collateralId));
        long before = c.getValueMinor();
        c.revalue(valueMinor, valuedOn);
        valuations.save(CollateralValuation.of(UUID.randomUUID(), collateralId, valueMinor,
                valuedOn, actor));
        audit.record(actor, "COLLATERAL_REVALUED", "collateral", collateralId,
                "{\"from\":" + before + ",\"to\":" + valueMinor + "}", UUID.randomUUID());
        return c;
    }

    /** Full valuation history for a collateral row (04 §3). */
    @Transactional(readOnly = true)
    public List<CollateralValuation> valuationHistory(UUID collateralId) {
        return valuations.findAllByCollateralIdOrderByCreatedAtAsc(collateralId);
    }

    @Transactional(readOnly = true)
    public List<Collateral> collateralOf(UUID applicationId) {
        return collateral.findAllByApplicationId(applicationId);
    }

    private static BigDecimal rateOf(String rateType) {
        return "FLOATING".equals(rateType) ? new BigDecimal("0.1249") : new BigDecimal("0.1199");
    }
}

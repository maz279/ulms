package com.uslbd.ulms.compliance;

import com.uslbd.ulms.platform.audit.AuditService;
import com.uslbd.ulms.servicing.Loan;
import com.uslbd.ulms.servicing.LoanRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * BRPD EOD batch (03 mod-compliance): nightly (23:30) or operator-triggered.
 * Idempotent per run-date with rerun semantics — a rerun replaces that date's
 * classification_history and provision_run wholesale. Interest suspense is
 * flagged from SS onward; the migration list (from→to) is history rows.
 */
@Service
public class EodBatchService {

    private final LoanRepository loans;
    private final ProvisionRunRepository runs;
    private final ClassificationHistoryRepository history;
    private final ComplianceAlertRepository alerts;
    private final AuditService audit;
    private final boolean scheduledEnabled;

    EodBatchService(LoanRepository loans, ProvisionRunRepository runs,
                    ClassificationHistoryRepository history,
                    ComplianceAlertRepository alerts, AuditService audit,
                    @Value("${ulms.compliance.eod-scheduler:true}") boolean scheduledEnabled) {
        this.loans = loans; this.runs = runs; this.history = history;
        this.alerts = alerts; this.audit = audit; this.scheduledEnabled = scheduledEnabled;
    }

    /** Nightly EOD — 23:30 bank quiet window. */
    @Scheduled(cron = "0 30 23 * * *")
    public void nightly() {
        if (scheduledEnabled) run(LocalDate.now(), "system:eod");
    }

    public record RunResult(LocalDate runDate, int loansClassified,
                            long totalOutstandingMinor, long totalProvisionMinor,
                            Map<String, Long> provisionsByClass) {}

    /** Run (or rerun) the classification batch for a date. */
    @Transactional
    public RunResult run(LocalDate runDate, String actor) {
        // rerun semantics: same date → wipe and recompute (idempotent).
        // Bulk deletes flush immediately; entity deletes would reorder.
        history.deleteAllByRunDate(runDate);
        runs.deleteAllByRunDate(runDate);

        List<Loan> active = loans.findAllByStageOrderByDpdDesc("ACTIVE");
        Map<String, Long> byClass = new LinkedHashMap<>();
        long totalOutstanding = 0, totalProvision = 0;
        List<ClassificationHistory> rows = new ArrayList<>(active.size());

        for (Loan loan : active) {
            // R10 P-C: override floors precede the DPD rule (CLS-ALGO §1.2) —
            // legal ≥ SS, bankruptcy → B/L, reschedule retention window
            String effectiveClass = BrpdOverrides.effective(
                    BrpdClassifier.classify(loan.getDpd()).classification(),
                    loan.isBankruptcyFlag(), loan.isLegalFlag(),
                    loan.getRescheduledOn(), loan.getPreRescheduleClassification(), runDate);
            BrpdClassifier.Result result = BrpdClassifier.byName(effectiveClass);
            long provision = result.provisionMinor(loan.getOutstandingMinor());
            String from = loan.getClassification();
            loan.reclassify(result.classification(), result.interestSuspense());
            rows.add(ClassificationHistory.of(UUID.randomUUID(), loan.getId(), runDate,
                    from, result.classification(), loan.getDpd(),
                    loan.getOutstandingMinor(), result.provisionRateBp(),
                    provision, result.interestSuspense()));
            byClass.merge(result.classification(), provision, Long::sum);
            totalOutstanding += loan.getOutstandingMinor();
            totalProvision += provision;
        }
        rows.forEach(history::save);

        Map<String, Object> detail = new LinkedHashMap<>();
        byClass.forEach((cls, amount) -> detail.put(cls, Map.of(
                "count", active.stream().filter(l -> cls.equals(l.getClassification())).count(),
                "provisionMinor", amount)));
        UUID runId = UUID.randomUUID();
        runs.save(ProvisionRun.of(runId, runDate, active.size(),
                totalOutstanding, totalProvision,
                com.uslbd.ulms.platform.idempotency.IdempotencyService.toJson(detail), actor));

        audit.record(actor, "EOD_RUN_COMPLETED", "provision_run", runId,
                "{\"date\":\"" + runDate + "\",\"loans\":" + active.size()
                        + ",\"provision\":" + totalProvision + "}", UUID.randomUUID());
        return new RunResult(runDate, active.size(), totalOutstanding, totalProvision, byClass);
    }

    /** Board payload: run summary + current loan portfolio + open alerts. */
    @Transactional(readOnly = true)
    public Map<String, Object> board() {
        ProvisionRun latest = runs.findAllByOrderByRunDateDesc().stream().findFirst().orElse(null);
        List<Loan> active = loans.findAllByStageOrderByDpdDesc("ACTIVE");
        Map<String, Object> board = new LinkedHashMap<>();
        board.put("latestRun", latest);
        board.put("loans", active);
        board.put("openAlerts", alerts.findAllByStateOrderByCreatedAtDesc("OPEN"));
        return board;
    }

    @Transactional
    public ComplianceAlert raiseAlert(String type, String aggregate, UUID aggregateId,
                                      String detailJson) {
        return alerts.save(ComplianceAlert.open(UUID.randomUUID(), type, aggregate,
                aggregateId, detailJson));
    }

    @Transactional(readOnly = true)
    public List<ComplianceAlert> openAlerts() {
        return alerts.findAllByStateOrderByCreatedAtDesc("OPEN");
    }
}

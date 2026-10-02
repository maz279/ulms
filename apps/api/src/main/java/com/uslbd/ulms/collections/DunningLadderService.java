package com.uslbd.ulms.collections;

import com.uslbd.ulms.platform.audit.AuditService;
import com.uslbd.ulms.servicing.Loan;
import com.uslbd.ulms.servicing.LoanRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Dunning ladder as timers on collection_action (03 mod-collections; R10 P-A):
 * the rungs are CONFIGURATION (ulms.dunning_step, ULS-01 §6.1 — SMS → CALL →
 * VISIT → NOTICE → STRATEGY → NPA_RECOVERY). The nightly job queues the next
 * due step per delinquent loan as a collection_action with outcome
 * AUTO_QUEUED + due_on = today; officers act on it from the worklist. A
 * PENDING promise suspends the ladder until its promise date passes.
 */
@Service
public class DunningLadderService {

    private final LoanRepository loans;
    private final CollectionActionRepository actions;
    private final PtpRepository ptpRepo;
    private final DunningStepRepository steps;
    private final AuditService audit;
    private final boolean schedulerEnabled;

    DunningLadderService(LoanRepository loans, CollectionActionRepository actions,
                         PtpRepository ptps, DunningStepRepository steps, AuditService audit,
                         @Value("${ulms.collections.dunning-scheduler:true}") boolean schedulerEnabled) {
        this.loans = loans; this.actions = actions; this.ptpRepo = ptps;
        this.steps = steps; this.audit = audit; this.schedulerEnabled = schedulerEnabled;
    }

    /** The configured rung for a DPD (null = current, no rung covers 0). */
    public DunningStep stepFor(int dpd) {
        if (dpd <= 0) return null;
        return steps.findAllByOrderByMinDpdAsc().stream()
                .filter(s -> s.covers(dpd))
                .reduce((first, second) -> second)   // tightest matching band
                .orElse(null);
    }

    /** Pure fallback used when the table is empty (dev bootstrap safety). */
    static String fallbackAction(int dpd) {
        if (dpd <= 30) return "SMS";
        if (dpd <= 90) return "CALL";
        return "VISIT";
    }

    static int fallbackCadence(String action) {
        return "VISIT".equals(action) ? 14 : 7;
    }

    /** Nightly 06:00 — queue the next due dunning step for every delinquent loan. */
    @Scheduled(cron = "0 0 6 * * *")
    public void nightly() {
        if (schedulerEnabled) runOnce(LocalDate.now());
    }

    /** One pass (scheduled or operator-invoked); returns the queued-step count. */
    @Transactional
    public int runOnce(LocalDate today) {
        int queued = 0;
        for (Loan loan : loans.findAllByStageOrderByDpdDesc("ACTIVE")) {
            DunningStep step = stepFor(loan.getDpd());
            String actionType = step != null ? step.getActionType() : fallbackAction(loan.getDpd());
            int cadence = step != null ? step.getCadenceDays() : fallbackCadence(actionType);

            // a PENDING promise suspends the ladder until its date passes (03)
            boolean openPromise = ptpRepo.findAllByLoanIdOrderByPromisedOnAsc(loan.getId()).stream()
                    .anyMatch(p -> "PENDING".equals(p.getKept())
                            && !p.getPromisedOn().isBefore(today));
            if (openPromise) continue;

            var history = actions.findAllByLoanIdOrderByActedAtDesc(loan.getId());
            // an unacted queued step for this rung already covers the window
            boolean alreadyQueued = history.stream().anyMatch(a ->
                    actionType.equals(a.getActionType()) && "AUTO_QUEUED".equals(a.getOutcome()));
            if (alreadyQueued) continue;

            // cadence elapsed since the rung's last activity (acted or queued)?
            var lastOfStep = history.stream()
                    .filter(a -> actionType.equals(a.getActionType()))
                    .findFirst();
            boolean windowElapsed = lastOfStep.isEmpty()
                    || lastOfStep.get().getDueOn() == null
                    || !today.isBefore(lastOfStep.get().getDueOn().plusDays(cadence));
            if (!windowElapsed) continue;

            actions.save(CollectionAction.of(UUID.randomUUID(), loan.getId(), actionType,
                    "AUTO_QUEUED", "dunning ladder timer", "system:dunning", today));
            audit.record("system:dunning", "DUNNING_STEP_QUEUED", "loan", loan.getId(),
                    "{\"step\":\"" + actionType + "\",\"dpd\":" + loan.getDpd()
                            + ",\"due\":\"" + today + "\"}", UUID.randomUUID());
            queued++;
        }
        return queued;
    }

    /** Officer acts a queued step: replaces AUTO_QUEUED with the real outcome. */
    @Transactional
    public CollectionAction resolveQueued(UUID actionId, String outcome, String notes,
                                         String actor) {
        CollectionAction a = actions.findById(actionId)
                .orElseThrow(() -> new java.util.NoSuchElementException("No action " + actionId));
        a.resolve(outcome, notes == null ? "" : notes, actor);
        audit.record(actor, "DUNNING_STEP_RESOLVED", "loan", a.getLoanId(),
                "{\"outcome\":\"" + outcome + "\"}", UUID.randomUUID());
        return a;
    }

    /** Queued (unacted) dunning steps — the worklist's action inbox. */
    @Transactional(readOnly = true)
    public List<CollectionAction> dueQueue() {
        return actions.findAllByOutcomeOrderByDueOnAsc("AUTO_QUEUED");
    }
}

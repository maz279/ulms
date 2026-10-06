package com.uslbd.ulms.collections;

import com.uslbd.ulms.platform.audit.AuditService;
import com.uslbd.ulms.servicing.Loan;
import com.uslbd.ulms.servicing.LoanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * Collections (03 mod-collections): bucket worklist (DPD desc, broken-PTP
 * propensity boost), dunning-ladder actions, PTP state machine
 * (PENDING→KEPT|BROKEN with payment evidence), field tasks with the Expo
 * sync contract (server-wins status, append-only evidence).
 */
@Service
public class CollectionsService {

    private final LoanRepository loans;
    private final com.uslbd.ulms.servicing.PaymentWorkReadModel payments;   // PTP kept evidence
    private final CollectionActionRepository actions;
    private final PtpRepository ptps;
    private final FieldTaskRepository tasks;
    private final LegalCaseRepository legalCases;
    private final com.uslbd.ulms.integration.fineract.FineractLoanPort fineractLoans;
    private final AuditService audit;

    CollectionsService(LoanRepository loans,
                       com.uslbd.ulms.servicing.PaymentWorkReadModel payments,
                       CollectionActionRepository actions, PtpRepository ptps,
                       FieldTaskRepository tasks, LegalCaseRepository legalCases,
                       com.uslbd.ulms.integration.fineract.FineractLoanPort fineractLoans,
                       AuditService audit) {
        this.loans = loans; this.payments = payments; this.actions = actions;
        this.ptps = ptps; this.tasks = tasks; this.legalCases = legalCases;
        this.fineractLoans = fineractLoans; this.audit = audit;
    }

    public record WorklistRow(UUID loanId, String loanNo, UUID customerId, int dpd,
                              String classification, long outstandingMinor,
                              String priority, boolean hasBrokenPtp) {}

    /** Bucket worklist (prototype F2 board): DPD desc; broken PTP bumps priority. */
    @Transactional(readOnly = true)
    public List<WorklistRow> worklist() {
        return loans.findAllByStageOrderByDpdDesc("ACTIVE").stream()
                .filter(l -> l.getDpd() > 0)
                .map(l -> {
                    boolean broken = ptps.findFirstByLoanIdAndKeptOrderByPromisedOnDesc(
                            l.getId(), "BROKEN").isPresent();
                    String priority = broken ? "P1" : l.getDpd() > 90 ? "P2" : "P3";
                    return new WorklistRow(l.getId(), l.getLoanNo(), l.getCustomerId(),
                            l.getDpd(), l.getClassification(), l.getOutstandingMinor(),
                            priority, broken);
                })
                .sorted(java.util.Comparator.comparing(WorklistRow::priority)
                        .thenComparing(WorklistRow::dpd, java.util.Comparator.reverseOrder()))
                .toList();
    }

    /** Dunning-ladder action (SMS→call→visit; NOTICE for legal escalation). */
    @Transactional
    public CollectionAction recordAction(UUID loanId, String actionType, String outcome,
                                         String notes, String actor) {
        var a = actions.save(CollectionAction.of(UUID.randomUUID(), loanId, actionType,
                outcome, notes, actor));
        // phone masked in audit payload (06 §5) — notes are business evidence
        audit.record(actor, "COLLECTION_ACTION", "loan", loanId,
                "{\"type\":\"" + actionType + "\",\"outcome\":\"" + outcome + "\"}",
                UUID.randomUUID());
        return a;
    }

    /** PTP promise (prototype F3 contextual form core). */
    @Transactional
    public Ptp promise(UUID loanId, long promisedAmountMinor, LocalDate promisedOn,
                       String confidence, String contactName, String contactRelation,
                       String contactPhone, String remark, String actor) {
        Loan loan = loans.findById(loanId)
                .orElseThrow(() -> new NoSuchElementException("No loan " + loanId));
        Ptp p = ptps.save(Ptp.of(UUID.randomUUID(), loanId, promisedAmountMinor, promisedOn,
                confidence, contactName, contactRelation, contactPhone, remark,
                loan.getDpd(), loan.getClassification(), actor));
        audit.record(actor, "PTP_CREATED", "loan", loanId,
                "{\"amount\":" + promisedAmountMinor + ",\"on\":\"" + promisedOn
                        + "\",\"confidence\":\"" + confidence + "\",\"contact\":\""
                        + mask(contactPhone) + "\"}", UUID.randomUUID());
        return p;
    }

    /**
     * PTP outcome state machine (03): KEPT if a payment landed on/after the
     * promise date covering the amount, else BROKEN — once terminal, fixed.
     */
    @Transactional
    public Ptp markOutcome(UUID ptpId, boolean kept, String actor) {
        Ptp p = ptps.findById(ptpId)
                .orElseThrow(() -> new NoSuchElementException("No PTP " + ptpId));
        if (!"PENDING".equals(p.getKept())) {
            throw new IllegalStateException("PTP already " + p.getKept());
        }
        if (kept) p.markKept(); else p.markBroken();
        audit.record(actor, kept ? "PTP_KEPT" : "PTP_BROKEN", "loan", p.getLoanId(),
                "{\"ptp\":\"" + ptpId + "\"}", UUID.randomUUID());
        return p;
    }

    /** Auto-derivation input: payments received on/after the promised date. */
    @Transactional(readOnly = true)
    public boolean promiseCovered(Ptp ptp) {
        long paid = payments.totalPaidBetween(ptp.getLoanId(),
                ptp.getPromisedOn(), ptp.getPromisedOn().plusDays(7));
        return paid >= ptp.getPromisedAmountMinor();
    }

    /** PTP calendar (03 GET /collections/ptp/calendar). */
    @Transactional(readOnly = true)
    public List<Ptp> calendar(LocalDate from, LocalDate to) {
        return ptps.findAllByPromisedOnBetweenOrderByPromisedOnAsc(from, to);
    }

    /** Field task assignment (sync contract for the Expo app, 03). */
    @Transactional
    public FieldTask assignFieldTask(UUID loanId, String assignedTo, LocalDate dueOn,
                                     String actor) {
        return assignFieldTask(loanId, assignedTo, dueOn, actor, null, null);
    }

    /** With the borrower pin for the field map (PLANNING/08 A4). */
    public FieldTask assignFieldTask(UUID loanId, String assignedTo, LocalDate dueOn,
                                     String actor, Double lat, Double lng) {
        var t = FieldTask.of(UUID.randomUUID(), loanId, assignedTo, dueOn, actor);
        t.setPin(lat, lng);
        tasks.save(t);
        audit.record(actor, "FIELD_TASK_ASSIGNED", "loan", loanId,
                "{\"to\":\"" + assignedTo + "\",\"due\":\"" + dueOn + "\"}", UUID.randomUUID());
        return t;
    }

    /** Server-wins completion + append-only evidence (03 sync rules). */
    @Transactional
    public FieldTask completeFieldTask(UUID taskId, String evidence, String actor) {
        FieldTask t = tasks.findById(taskId)
                .orElseThrow(() -> new NoSuchElementException("No field task " + taskId));
        boolean changed = t.complete(evidence == null ? "" : evidence);
        audit.record(actor, changed ? "FIELD_TASK_COMPLETED" : "FIELD_TASK_DUP_COMPLETE",
                "loan", t.getLoanId(), "{}", UUID.randomUUID());
        return t;
    }

    @Transactional(readOnly = true)
    public List<FieldTask> openTasks() {
        return tasks.findAllByStatusOrderByDueOnAsc("OPEN");
    }

    @Transactional(readOnly = true)
    public List<CollectionAction> actionsOf(UUID loanId) {
        return actions.findAllByLoanIdOrderByActedAtDesc(loanId);
    }

    @Transactional(readOnly = true)
    public List<Ptp> ptpsOf(UUID loanId) {
        return ptps.findAllByLoanIdOrderByPromisedOnAsc(loanId);
    }

    // ── legal cases (03: recovery & legal case tracking, CRUD) ────────────

    @Transactional
    public LegalCase fileCase(UUID loanId, String court, LocalDate filedOn,
                              long claimMinor, String lawyer, String notes, String actor) {
        loans.findById(loanId)
                .orElseThrow(() -> new NoSuchElementException("No loan " + loanId));
        String caseNo = "LC-" + System.currentTimeMillis() + "-" 
                + Integer.toHexString(loanId.hashCode() & 0xffff);
        LegalCase lc = legalCases.save(LegalCase.of(UUID.randomUUID(), loanId, caseNo,
                court, filedOn, claimMinor, lawyer, notes, actor));
        audit.record(actor, "LEGAL_CASE_FILED", "loan", loanId,
                "{\"caseNo\":\"" + caseNo + "\",\"claim\":" + claimMinor + "}", UUID.randomUUID());
        return lc;
    }

    @Transactional
    public LegalCase updateCaseStatus(UUID caseId, String status, String actor) {
        LegalCase lc = legalCases.findById(caseId)
                .orElseThrow(() -> new NoSuchElementException("No legal case " + caseId));
        lc.updateStatus(status);
        audit.record(actor, "LEGAL_CASE_" + status, "legal_case", caseId,
                "{\"loan\":\"" + lc.getLoanId() + "\"}", UUID.randomUUID());
        return lc;
    }

    @Transactional(readOnly = true)
    public List<LegalCase> casesOf(UUID loanId) {
        return legalCases.findAllByLoanIdOrderByCreatedAtDesc(loanId);
    }

    /** Write-off fact for the CL-4 regcon pack — cross-module read (P4). */
    public record WriteOffFact(String caseNo, UUID loanId, String court, String status,
                               long claimMinor, LocalDate filedOn) {}

    /** Every legal case resolved as a write-off (status WRITE_OFF). */
    @Transactional(readOnly = true)
    public List<WriteOffFact> writeOffCases() {
        return legalCases.findAll().stream()
                .filter(c -> "WRITE_OFF".equals(c.getStatus()))
                .map(c -> new WriteOffFact(c.getCaseNo(), c.getLoanId(), c.getCourt(),
                        c.getStatus(), c.getClaimMinor(), c.getFiledOn()))
                .toList();
    }

    /**
     * Collections resolution adjustment (03 Fineract row): waive interest via
     * the Fineract transaction, audited — only on a loan that exists there.
     */
    @Transactional
    public long waiveInterest(UUID loanId, long amountMinor, String actor) {
        Loan loan = loans.findById(loanId)
                .orElseThrow(() -> new NoSuchElementException("No loan " + loanId));
        if (loan.getFineractLoanId() == null) {
            throw new IllegalStateException(
                    "Loan " + loan.getLoanNo() + " is mirror-only (migrated) — no Fineract waiver");
        }
        long txn = fineractLoans.waiveInterest(loan.getFineractLoanId(), amountMinor);
        audit.record(actor, "INTEREST_WAIVED", "loan", loanId,
                "{\"amount\":" + amountMinor + ",\"fineractTxn\":" + txn + "}", UUID.randomUUID());
        return txn;
    }

    private static String mask(String phone) {
        if (phone == null || phone.length() < 4) return "****";
        return "****" + phone.substring(phone.length() - 4);
    }
}

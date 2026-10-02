package com.uslbd.ulms.origination;

import com.uslbd.ulms.approval.DisbursementFactsProvider;
import com.uslbd.ulms.approval.LadderService;
import com.uslbd.ulms.assessment.ApplicationFactsProvider;
import com.uslbd.ulms.assessment.AssessmentService;
import com.uslbd.ulms.assessment.Collateral;
import com.uslbd.ulms.integration.docs.DocumentStorePort;
import com.uslbd.ulms.integration.docs.ScanPort;
import com.uslbd.ulms.integration.fineract.FineractLoanPort;
import com.uslbd.ulms.platform.audit.AuditService;
import com.uslbd.ulms.platform.workflow.WorkflowCompletedEvent;
import com.uslbd.ulms.platform.workflow.WorkflowService;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.math.BigDecimal;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class OriginationService implements ApplicationFactsProvider, DisbursementFactsProvider {

    private final ApplicationRepository applications;
    private final ApplicationDocumentRepository documents;
    private final LadderService ladder;
    private final WorkflowService workflow;
    private final DocumentStorePort documentStore;
    private final FineractLoanPort fineractLoans;   // loan creation on approval (03)
    private final AuditService audit;
    private final com.uslbd.ulms.platform.outbox.OutboxService outbox;
    private final com.uslbd.ulms.customer.CustomerService customers;   // cross-module read API
    private final ScanPort scanner;
    private final AssessmentService assessment;
    private final RateCardRepository rateCards;                      // R10 P-B: risk-based pricing
    private final com.uslbd.ulms.product.ProductService products;    // product rate for pricing
    private final com.uslbd.ulms.servicing.LoanRepository loans;     // STP delinquency check

    OriginationService(
                       com.uslbd.ulms.platform.outbox.OutboxService outbox,ApplicationRepository applications,
                       ApplicationDocumentRepository documents,
                       LadderService ladder, WorkflowService workflow,
                       DocumentStorePort documentStore, FineractLoanPort fineractLoans,
                       com.uslbd.ulms.customer.CustomerService customers,
                       ScanPort scanner, AssessmentService assessment,
                       AuditService audit,
                       RateCardRepository rateCards,
                       com.uslbd.ulms.product.ProductService products,
                       com.uslbd.ulms.servicing.LoanRepository loans) {
        this.outbox = outbox;
        this.applications = applications; this.documents = documents;
        this.ladder = ladder; this.workflow = workflow;
        this.documentStore = documentStore; this.fineractLoans = fineractLoans;
        this.customers = customers; this.scanner = scanner;
        this.assessment = assessment; this.audit = audit;
        this.rateCards = rateCards; this.products = products; this.loans = loans;
    }

/** R5 parity projection — the portal demo-upload response shape. */
    public record PortalDocumentView(UUID id, String cifNo, String appId, String docType,
                                     String sha256, long sizeBytes, String scanStatus,
                                     String uploadedAt, String channel) {}

    /** R5 parity: portal demo upload persists metadata on a portal-scoped row
     *  (client-side digest, no raw bytes on the wire in the prototype). */
    @Transactional
    public PortalDocumentView recordPortalDocument(
            UUID customerId, String cifNo, String docType, String sha256, long sizeBytes) {
        var doc = documents.save(com.uslbd.ulms.origination.ApplicationDocument.of(
                UUID.randomUUID(), null, docType,
                "portal/" + customerId + "/" + docType.toLowerCase() + "-" + sha256.substring(0, 12),
                sha256, sizeBytes, "customer:" + cifNo));
        audit.record("customer:" + cifNo, "PORTAL_DOC", "customer", customerId,
                "\"" + docType + " sha " + sha256.substring(0, 12) + "…\"", UUID.randomUUID());
        outbox.emit("customer", customerId, "PORTAL_DOCUMENT_UPLOADED",
                java.util.Map.of("cif", cifNo, "docType", docType));
        return new PortalDocumentView(doc.getId(), cifNo, null,
                docType, sha256, sizeBytes, "CLEAN",
                doc.getUploadedAt().toString(), "PORTAL");
    }

    /** Draft application (wizard autosave) — income snapshot feeds assessment (04 §2). */
    @Transactional
    public Application createDraft(String appNo, UUID customerId, String productCode,
                                   long amountMinor, int tenorMonths, Application.RateType rateType,
                                   String branchCode, Long incomeMinor, Long existingEmiMinor,
                                   String actor) {
        Application a = Application.draft(UUID.randomUUID(), appNo, customerId, productCode,
                amountMinor, tenorMonths, rateType, branchCode, actor,
                incomeMinor, existingEmiMinor);
        applications.save(a);
        audit.record(actor, "APPLICATION_DRAFTED", "application", a.getId(),
                "{\"appNo\":\"" + appNo + "\",\"amount\":" + amountMinor + "}", UUID.randomUUID());
        return a;
    }

    /**
     * G2 submit pipeline (03 mod-origination 9-stage machine):
     * SCREENING → CIB_PULL (pull + parse) → SCORING (server-side DBR from
     * income + bureau obligations + versioned scorecard) → CPV (officer) or
     * back to SCREENING on AUTO_DECLINE. The ladder starts on CPV pass.
     * noRollbackFor CibPullFailedException: the failure evidence (FAILED
     * report row, RB-05 alert, audits) COMMITS while the caller gets a 409.
     */
    @Transactional(noRollbackFor = CibPullFailedException.class)
    public Application submit(UUID applicationId, String actor) {
        Application a = get(applicationId);
        if (a.getStage() != Application.Stage.SCREENING) {
            throw new IllegalStateException("Already submitted (stage=" + a.getStage() + ")");
        }
        if (a.getIncomeMinor() == null || a.getIncomeMinor() <= 0) {
            throw new IllegalArgumentException(
                    "Monthly income required for assessment — collect it at the wizard finance step");
        }
        a.stage(Application.Stage.CIB_PULL);
        audit.record(actor, "APPLICATION_SUBMITTED", "application", a.getId(),
                "{\"appNo\":\"" + a.getAppNo() + "\"}", UUID.randomUUID());

        // ── CIB_PULL: pull + parse the bureau report (mock adapter, sync in P2)
        var customer = customers.get(a.getCustomerId());
        var report = assessment.pullCib(a.getCustomerId(), customer.getCifNo(), actor);
        if (report == null || !"PARSED".equals(report.getStatus())) {
            a.stage(Application.Stage.SCREENING);   // officer retry path (11 §1)
            throw new CibPullFailedException("CIB pull failed — retry or manual bureau check: "
                    + (report == null ? "bureau unreachable (RB-05 alert raised)" : report.getError()));
        }
        a.stage(Application.Stage.SCORING);

        // ── SCORING: server-computed DBR + versioned scorecard (03)
        var outcome = assessment.assessApplication(facts(applicationId), actor);
        a.recordAssessment(outcome.dbr(), outcome.cibObligationMinor());
        if ("AUTO_DECLINE".equals(outcome.score().getDecision())) {
            a.stage(Application.Stage.SCREENING);
            audit.record(actor, "SCORING_AUTO_DECLINED", "application", a.getId(),
                    "{\"score\":" + outcome.score().getScore()
                            + ",\"grade\":\"" + outcome.score().getGrade() + "\"}",
                    UUID.randomUUID());
            return a;   // officer sees the score + DBR on the app
        }
        // ── R10 P-B: risk-based pricing — grade premium over the product rate
        // non-throwing on purpose: a 404 through the service proxy inside this
        // shared transaction would mark it rollback-only even when caught
        Integer productRateBpBoxed = products.rateBpOrNull(a.getProductCode());
        int productRateBp = productRateBpBoxed == null ? 1200 : productRateBpBoxed;
        int premiumBp = rateCards.findById(outcome.score().getGrade())
                .map(RateCard::getPremiumBp).orElse(0);
        a.recordPricing(outcome.score().getGrade(), productRateBp + premiumBp);

        // ── R10 P-B: fast-track (STP) — eligible applications skip CPV and
        // ride an auto-approved L7 pass (WF-SPEC §4.2, no human review;
        // post-approval audit sweep below)
        var borrower = customers.get(a.getCustomerId());
        int worstDpd = loans.findAllByCustomerId(a.getCustomerId()).stream()
                .mapToInt(com.uslbd.ulms.servicing.Loan::getDpd).max().orElse(0);
        if (StpPolicy.eligible(a.getProductCode(), a.getAmountMinor(),
                outcome.score().getGrade(), outcome.dbr(), worstDpd,
                borrower.getCreatedAt(), Instant.now())) {
            a.markStp();
            a.stage(Application.Stage.APPROVAL);
            audit.record(actor, "STP_APPROVED", "application", a.getId(),
                    "{\"score\":" + outcome.score().getScore()
                            + ",\"appliedRateBp\":" + a.getAppliedRateBp() + "}",
                    UUID.randomUUID());
            var started = workflow.start(WorkflowService.LADDER, "application",
                    a.getId(), "L7");   // graph node convention: L1..L7
            var t = started.task();
            var outcomeWf = workflow.act(t.getId(), WorkflowService.Action.APPROVE,
                    "system:stp", "fast-track auto-approval (WF-SPEC §4.2)");
            // dual-phase top node (if any) checks as a distinct system actor
            if (outcomeWf.nextTask() != null && "CHECK".equals(outcomeWf.nextTask().getPhase())) {
                workflow.act(outcomeWf.nextTask().getId(), WorkflowService.Action.APPROVE,
                        "system:stp-check", "fast-track maker-checker phase");
            }
            return a;   // onWorkflowCompleted moved the stage to SANCTION
        }

        a.stage(Application.Stage.CPV);             // officer verification point
        audit.record(actor, "SCORING_PASSED", "application", a.getId(),
                "{\"score\":" + outcome.score().getScore()
                        + ",\"grade\":\"" + outcome.score().getGrade()
                        + "\",\"decision\":\"" + outcome.score().getDecision() + "\"}",
                UUID.randomUUID());
        return a;
    }

    /** CPV (physical verification) gate: PASS starts the approval ladder (03). */
    @Transactional
    public Application cpv(UUID applicationId, boolean passed, String notes, String actor) {
        Application a = get(applicationId);
        if (a.getStage() != Application.Stage.CPV) {
            throw new IllegalStateException("CPV not pending (stage=" + a.getStage() + ")");
        }
        if (!passed) {
            a.stage(Application.Stage.SCREENING);
            audit.record(actor, "CPV_FAILED", "application", a.getId(),
                    "{\"notes\":\"" + notes + "\"}", UUID.randomUUID());
            return a;
        }
        a.stage(Application.Stage.APPROVAL);
        String startNode = ladder.startNodeFor(a.getAmountMinor());
        workflow.start(WorkflowService.LADDER, "application", a.getId(), startNode);
        audit.record(actor, "CPV_PASSED", "application", a.getId(),
                "{\"ladderStart\":\"" + startNode + "\",\"notes\":\"" + notes + "\"}",
                UUID.randomUUID());
        return a;
    }

    /**
     * Attach document: checksum → idempotency check → object store put →
     * virus-scan hook → metadata. Re-uploading identical content of the same
     * type is a no-op that returns the existing row (03 docs).
     */
    @Transactional
    public ApplicationDocument attachDocument(UUID applicationId, String docType,
                                              InputStream bytes, long size, String contentType,
                                              String actor) {
        Application a = get(applicationId);
        byte[] buffer = readAll(bytes);
        String sha256 = sha256Of(buffer);

        var existing = documents.findAllByApplicationId(applicationId).stream()
                .filter(d -> d.getDocType().equals(docType) && d.getSha256().equals(sha256))
                .findFirst();
        if (existing.isPresent()) return existing.get();

        String key = "applications/" + a.getId() + "/" + docType + "/" + UUID.randomUUID();
        DocumentStorePort.StoredObject stored = documentStore.put(key,
                new java.io.ByteArrayInputStream(buffer), buffer.length, contentType);
        if (!stored.sha256().equals(sha256)) {
            throw new IllegalStateException("Store checksum mismatch for " + key);
        }

        var scan = scanner.scan(stored.key(), sha256);
        ApplicationDocument d = documents.save(ApplicationDocument.of(
                UUID.randomUUID(), applicationId, docType, stored.key(),
                sha256, stored.sizeBytes(), actor));
        d.markScanned(scan.name());
        audit.record(actor, scan == ScanPort.ScanResult.INFECTED
                ? "DOCUMENT_QUARANTINED" : "DOCUMENT_UPLOADED", "application", applicationId,
                "{\"type\":\"" + docType + "\",\"sha256\":\"" + sha256
                        + "\",\"scan\":\"" + scan.name() + "\"}",
                UUID.randomUUID());
        return d;
    }

    @Transactional(readOnly = true)
    public List<ApplicationDocument> documents(UUID applicationId) {
        return documents.findAllByApplicationId(applicationId);
    }

    /** Cross-module read for the customer 360 aggregate (03 mod-customer). */
    @Transactional(readOnly = true)
    public List<Application> applicationsOf(UUID customerId) {
        return applications.findAllByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    /**
     * Wizard autosave PATCH (07 §4 dirty-state drafts): mutable while the
     * application is still in SCREENING; any later stage is a 409. Optimistic
     * concurrency (05 §4): a caller-supplied version must match — stale ⇒ 409.
     */
    @Transactional
    public Application updateDraft(UUID applicationId, String productCode,
                                   long amountMinor, int tenorMonths,
                                   Application.RateType rateType,
                                   Long incomeMinor, Long existingEmiMinor,
                                   Long expectedVersion, String actor) {
        Application a = get(applicationId);
        if (a.getStage() != Application.Stage.SCREENING) {
            throw new IllegalStateException("Draft locked (stage=" + a.getStage() + ")");
        }
        if (expectedVersion != null && expectedVersion != a.getVersion()) {
            throw new com.uslbd.ulms.platform.VersionConflictException(
                    "Draft version mismatch — reload and retry (expected " + expectedVersion
                            + ", current " + a.getVersion() + ")");
        }
        a.redraft(productCode, amountMinor, tenorMonths, rateType);
        if (incomeMinor != null) a.updateIncome(incomeMinor, existingEmiMinor);
        audit.record(actor, "APPLICATION_DRAFT_UPDATED", "application", applicationId,
                "{\"amount\":" + amountMinor + ",\"tenor\":" + tenorMonths + "}",
                UUID.randomUUID());
        return a;
    }

    @Transactional(readOnly = true)
    public Application get(UUID id) {
        return applications.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No application " + id));
    }

    @Transactional(readOnly = true)
    public List<Application> list() { return list(null, null, null); }

    /** Filtered list (05 §1): ?stage=&branch=&officer= filters; newest first. */
    @Transactional(readOnly = true)
    public List<Application> list(String stage, String branch, String officer) {
        return applications.findAll().stream()
                .filter(a -> stage == null || a.getStage().name().equalsIgnoreCase(stage))
                .filter(a -> branch == null || a.getBranchCode().equalsIgnoreCase(branch))
                .filter(a -> officer == null || a.getCreatedBy().equalsIgnoreCase(officer))
                .sorted(java.util.Comparator.comparing(Application::getCreatedAt).reversed())
                .toList();
    }

    // ── ApplicationFactsProvider (assessment reads application facts, no cycle) ──

    @Override
    @Transactional(readOnly = true)
    public ApplicationFactsProvider.ApplicationFacts facts(UUID applicationId) {
        Application a = get(applicationId);
        long collateralValue = assessment.collateralOf(applicationId).stream()
                .mapToLong(Collateral::getValueMinor).sum();
        return new ApplicationFactsProvider.ApplicationFacts(applicationId, a.getCustomerId(),
                a.getAmountMinor(), a.getTenorMonths(), a.getRateType().name(),
                a.getIncomeMinor(), a.getExistingEmiMinor(), collateralValue, a.getDbrPercent());
    }

    // ── DisbursementFactsProvider (approval reads facts + stage transition) ──

    @Override
    @Transactional(readOnly = true)
    public DisbursementFactsProvider.DisbursableFacts disbursementFacts(UUID applicationId) {
        Application a = get(applicationId);
        return new DisbursementFactsProvider.DisbursableFacts(applicationId, a.getCustomerId(),
                a.getAppNo(), a.getAmountMinor(), a.getStage().name(), a.getFineractLoanId(),
                a.getTenorMonths(), a.getRateType().name());
    }

    @Override
    @Transactional
    public void markDisbursementPrepared(UUID applicationId) {
        Application a = get(applicationId);
        a.stage(Application.Stage.DISBURSEMENT);
        audit.record("system:disbursement", "DISBURSEMENT_PREPARED_STAGE", "application",
                applicationId, "{}", UUID.randomUUID());
    }

    @Override
    @Transactional
    public void markDisbursed(UUID applicationId) {
        Application a = get(applicationId);
        a.stage(Application.Stage.DISBURSED);
        audit.record("system:disbursement", "APPLICATION_DISBURSED", "application",
                applicationId, "{}", UUID.randomUUID());
    }

    /** Fineract loan id for the sanctioned application (disbursement release). */
    @Transactional(readOnly = true)
    public Long fineractLoanIdOf(UUID applicationId) {
        return applications.findById(applicationId).map(Application::getFineractLoanId).orElse(null);
    }

    /** Workflow completion side-effects (approval ↔ origination decoupled, ADR-001). */
    @org.springframework.context.event.EventListener   // synchronous, same tx as act()
    @Transactional
    public void onWorkflowCompleted(WorkflowCompletedEvent event) {
        if (!"application".equals(event.aggregate())) return;
        applications.findById(event.aggregateId()).ifPresent(a -> {
            a.stage(event.approved() ? Application.Stage.SANCTION : Application.Stage.SCREENING);
            if (event.approved()) {
                long loanId = fineractLoans.createLoan(new FineractLoanPort.LoanSpec(
                        resolveFineractClientId(a.getCustomerId()),
                        "ulms-" + a.getProductCode(), a.getAmountMinor(), a.getTenorMonths(),
                        a.getRateType().name()));
                a.attachFineractLoan(loanId);
                audit.record("system:workflow", "SANCTION_LOAN_CREATED", "application", a.getId(),
                        "{\"fineractLoanId\":" + loanId + "}", UUID.randomUUID());
            } else {
                audit.record("system:workflow", "APPLICATION_REJECTED", "application", a.getId(),
                        "{}", UUID.randomUUID());
            }
        });
    }

    private long resolveFineractClientId(java.util.UUID customerId) {
        return customers.fineractClientIdOf(customerId);
    }

    private static byte[] readAll(InputStream in) {
        try (in) {
            return in.readAllBytes();
        } catch (java.io.IOException e) {
            throw new IllegalArgumentException("Unreadable upload", e);
        }
    }

    private static String sha256Of(byte[] buffer) {
        try {
            var digest = java.security.MessageDigest.getInstance("SHA-256");
            StringBuilder hex = new StringBuilder(64);
            for (byte b : digest.digest(buffer)) hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    /** Fixed reducing-balance EMI in BDT minor units — the shared oracle (09 §3). */
    public static long emiMonthly(long principalMinor, int months, BigDecimal annualRate) {
        return com.uslbd.ulms.platform.MoneyMath.emiMonthly(principalMinor, months, annualRate);
    }
}

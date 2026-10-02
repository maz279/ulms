package com.uslbd.ulms.approval;

import com.uslbd.ulms.compliance.EodBatchService;
import com.uslbd.ulms.integration.fineract.FineractLoanPort;
import com.uslbd.ulms.platform.audit.AuditService;
import com.uslbd.ulms.servicing.Loan;
import com.uslbd.ulms.servicing.LoanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * Dual-authorized disbursement (03 mod-approval). The INVARIANT — no single
 * user can move a disbursement from PREPARED to RELEASED alone — is enforced
 * here AND asserted by an ArchUnit/service test: authorize requires an actor
 * DIFFERENT from the preparer; release requires an actor different from BOTH
 * (checker never executes). Every step writes dual_authorization + audit.
 */
@Service
public class DisbursementService {

    /** BFIU STR cash threshold: disbursements ≥ ৳10,00,000 raise an alert (06 §4). */
    static final long STR_THRESHOLD_MINOR = 100_000_000L;   // ৳10L = 100,000 × 100

    private final DisbursementRepository disbursements;
    private final DualAuthorizationRepository authorizations;
    private final DisbursementFactsProvider origination;
    private final FineractLoanPort fineractLoans;
    private final LoanRepository loans;
    private final EodBatchService compliance;
    private final AuditService audit;

    DisbursementService(DisbursementRepository disbursements,
                        DualAuthorizationRepository authorizations,
                        DisbursementFactsProvider origination,
                        FineractLoanPort fineractLoans, LoanRepository loans,
                        EodBatchService compliance, AuditService audit) {
        this.disbursements = disbursements; this.authorizations = authorizations;
        this.origination = origination; this.fineractLoans = fineractLoans;
        this.loans = loans; this.compliance = compliance; this.audit = audit;
    }

    /** Prepare from a SANCTIONED application (one active disbursement per app). */
    @Transactional
    public Disbursement prepare(UUID applicationId, String actor) {
        var facts = origination.disbursementFacts(applicationId);
        if (!"SANCTION".equals(facts.stage())) {
            throw new IllegalStateException(
                    "Disbursement requires stage SANCTION (stage=" + facts.stage() + ")");
        }
        if (disbursements.findByApplicationId(applicationId).isPresent()) {
            throw new IllegalStateException("Disbursement already prepared for " + facts.appNo());
        }
        Disbursement d = disbursements.save(
                Disbursement.prepared(UUID.randomUUID(), applicationId,
                        facts.amountMinor(), actor));
        authorizations.save(DualAuthorization.of(UUID.randomUUID(), d.getId(), "PREPARE", actor));
        origination.markDisbursementPrepared(applicationId);   // SANCTION → DISBURSEMENT
        audit.record(actor, "DISBURSEMENT_PREPARED", "application", applicationId,
                "{\"amount\":" + facts.amountMinor() + "}", UUID.randomUUID());
        return d;
    }

    /** Second-officer authorization — MUST be a different user than the preparer. */
    @Transactional
    public Disbursement authorize(UUID disbursementId, String actor) {
        Disbursement d = get(disbursementId);
        if (!"PREPARED".equals(d.getState())) {
            throw new IllegalStateException("Not in PREPARED state (" + d.getState() + ")");
        }
        if (actor.equals(d.getPreparedBy())) {
            // THE dual-authorization invariant (03): maker cannot check own action
            throw new IllegalStateException(
                    "Dual-authorization violation: preparer cannot authorize own disbursement");
        }
        d.authorize(actor);
        authorizations.save(DualAuthorization.of(UUID.randomUUID(), d.getId(), "AUTHORIZE", actor));
        audit.record(actor, "DISBURSEMENT_AUTHORIZED", "application", d.getApplicationId(),
                "{\"preparedBy\":\"" + d.getPreparedBy() + "\"}", UUID.randomUUID());
        return d;
    }

    /** Release: execute Fineract approve+disburse, create the loan mirror, DISBURSED. */
    @Transactional
    public Disbursement release(UUID disbursementId, String actor) {
        Disbursement d = get(disbursementId);
        if (!"AUTHORIZED".equals(d.getState())) {
            throw new IllegalStateException("Release requires AUTHORIZED state (" + d.getState() + ")");
        }
        if (actor.equals(d.getAuthorizedBy()) || actor.equals(d.getPreparedBy())) {
            // third distinct pair of hands: the checker never executes, and the
            // preparer's role ended at prepare — release is a third action (03)
            throw new IllegalStateException(
                    "Dual-authorization violation: release requires a different officer");
        }
        var facts = origination.disbursementFacts(d.getApplicationId());
        if (facts.fineractLoanId() == null) {
            throw new IllegalStateException("No Fineract loan on application " + facts.appNo());
        }
        long txnId = fineractLoans.disburseLoan(facts.fineractLoanId(), d.getAmountMinor());
        d.release(txnId);
        authorizations.save(DualAuthorization.of(UUID.randomUUID(), d.getId(), "RELEASE", actor));

        // ULMS loan mirror — the BRPD engine + boards read this row;
        // tenor/rate feed the P3 schedule + quote oracles
        int rateBp = "FLOATING".equals(facts.rateType()) ? 1249 : 1199;
        loans.save(Loan.disbursed(UUID.randomUUID(), d.getApplicationId(),
                facts.customerId(), nextLoanNo(), facts.fineractLoanId(), d.getAmountMinor(),
                facts.tenorMonths(), rateBp));
        origination.markDisbursed(d.getApplicationId());

        if (d.getAmountMinor() >= STR_THRESHOLD_MINOR) {
            compliance.raiseAlert("STR_CASH_THRESHOLD", "disbursement", d.getId(),
                    "{\"amountMinor\":" + d.getAmountMinor() + ",\"appNo\":\"" + facts.appNo()
                            + "\"}");
        }
        audit.record(actor, "DISBURSEMENT_RELEASED", "application", d.getApplicationId(),
                "{\"fineractTxn\":" + txnId + ",\"amount\":" + d.getAmountMinor() + "}",
                UUID.randomUUID());
        return d;
    }

    @Transactional(readOnly = true)
    public java.util.Optional<Disbursement> find(UUID id) {
        return disbursements.findById(id);
    }

    @Transactional(readOnly = true)
    public java.util.Optional<Disbursement> findByApplication(UUID applicationId) {
        return disbursements.findByApplicationId(applicationId);
    }

    @Transactional(readOnly = true)
    public List<DualAuthorization> trail(UUID disbursementId) {
        return authorizations.findAllByDisbursementIdOrderByActedAtAsc(disbursementId);
    }

    private Disbursement get(UUID id) {
        return disbursements.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No disbursement " + id));
    }

    private String nextLoanNo() {
        return "LN-" + (200_000 + loans.count());
    }
}

package com.uslbd.ulms.compliance;

import com.uslbd.ulms.integration.fineract.FineractJournalPort;
import com.uslbd.ulms.platform.audit.AuditService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * Provision JV posting (P4 audit-G, 03 mod-compliance): the EOD batch's
 * provision total is journaled to the Fineract GL as a zero-sum pair —
 * debit provision expense, credit loan-loss reserve. Idempotent per run-date:
 * re-posting an unchanged total returns the original entry; a DRIFTED total
 * after posting is blocked (reversal is a UAT bank process) and raises a
 * compliance alert, so the GL can never silently disagree with the run.
 */
@Service
public class ProvisionJvService {

    private final ProvisionJvRepository jvs;
    private final ProvisionRunRepository runs;
    private final FineractJournalPort fineractJournal;
    private final ComplianceAlertWriter alertWriter;
    private final AuditService audit;
    private final long expenseAccountId;
    private final long reserveAccountId;

    ProvisionJvService(ProvisionJvRepository jvs, ProvisionRunRepository runs,
                       FineractJournalPort fineractJournal, ComplianceAlertWriter alertWriter,
                       AuditService audit,
                       @Value("${ulms.compliance.gl.provision-expense-id:1}") long expenseAccountId,
                       @Value("${ulms.compliance.gl.provision-reserve-id:2}") long reserveAccountId) {
        this.jvs = jvs; this.runs = runs; this.fineractJournal = fineractJournal;
        this.alertWriter = alertWriter; this.audit = audit;
        this.expenseAccountId = expenseAccountId; this.reserveAccountId = reserveAccountId;
    }

    @Transactional
    public ProvisionJv post(LocalDate runDate, String actor) {
        ProvisionRun run = runs.findByRunDate(runDate)
                .orElseThrow(() -> new NoSuchElementException(
                        "No EOD provision run for " + runDate + " — run the batch first"));

        ProvisionJv existing = jvs.findByRunDate(runDate).orElse(null);
        if (existing != null) {
            if (existing.getTotalMinor() == run.getTotalProvisionMinor()) {
                return existing;   // idempotent repost of an unchanged run
            }
            // REQUIRES_NEW: the alert must outlive the rollback this throw causes
            alertWriter.raise("PROVISION_JV_DRIFT", "provision_jv", existing.getId(),
                    "{\"posted\":" + existing.getTotalMinor()
                            + ",\"run\":" + run.getTotalProvisionMinor() + "}");
            throw new IllegalStateException("Provision JV for " + runDate
                    + " already posted at " + existing.getTotalMinor()
                    + " but the rerun totals " + run.getTotalProvisionMinor()
                    + " — post a reversing entry via the bank process (drift alert raised)");
        }

        String reference = "ULMS-JV-" + runDate.toString().replace("-", "");
        String txnId = fineractJournal.postJournalEntry(
                expenseAccountId, reserveAccountId, run.getTotalProvisionMinor(), reference);
        ProvisionJv saved = jvs.save(ProvisionJv.of(UUID.randomUUID(), runDate,
                run.getTotalProvisionMinor(), txnId, reference, actor));
        audit.record(actor, "PROVISION_JV_POSTED", "provision_jv", saved.getId(),
                "{\"runDate\":\"" + runDate + "\",\"total\":" + run.getTotalProvisionMinor()
                        + ",\"debits\":" + saved.getDebitsMinor()
                        + ",\"credits\":" + saved.getCreditsMinor()
                        + ",\"fineractTxn\":\"" + txnId + "\"}", UUID.randomUUID());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<ProvisionJv> latest() {
        return jvs.findTop10ByOrderByRunDateDesc();
    }
}

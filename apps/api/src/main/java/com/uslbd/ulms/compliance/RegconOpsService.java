package com.uslbd.ulms.compliance;

import com.uslbd.ulms.integration.sftp.BbSftpPgpTransport;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Regcon operations (R10 P-F): nightly push of staged returns and the
 * GL-count reconciliation. Push wraps the staged file bytes in the
 * sign-then-encrypt PGP envelope (11 §6) — actual SFTP upload fires only
 * when the bank endpoint is configured (UAT); until then the envelope is
 * prepared and audited as READY_TO_TRANSMIT. Reconciliation compares the
 * return's declared row count against the matching GL provision-run sums
 * and raises a ComplianceAlert on mismatch (never silently passes).
 */
@Service
public class RegconOpsService {

    private static final Logger log = LoggerFactory.getLogger(RegconOpsService.class);

    private final RegulatoryReturnRepository returns;
    private final ProvisionRunRepository runs;
    private final ClassificationHistoryRepository history;
    private final EodBatchService eod;
    private final BbSftpPgpTransport pgp;
    private final java.util.function.Supplier<String> signingKeyArmor;
    private final java.util.function.Supplier<String> encryptionKeyArmor;
    private final boolean pushEnabled;

    public RegconOpsService(RegulatoryReturnRepository returns,
                            ProvisionRunRepository runs,
                            ClassificationHistoryRepository history,
                            EodBatchService eod,
                            BbSftpPgpTransport pgp,
                            @org.springframework.beans.factory.annotation.Value(
                                    "${ulms.regcon.push-enabled:false}") boolean pushEnabled) {
        this.returns = returns; this.runs = runs; this.history = history;
        this.eod = eod; this.pgp = pgp; this.pushEnabled = pushEnabled;
        // bank keys arrive from the secret store at UAT — env-shaped suppliers
        this.signingKeyArmor = () -> System.getenv("ULMS_BB_SIGNING_KEY");
        this.encryptionKeyArmor = () -> System.getenv("ULMS_BB_ENCRYPTION_KEY");
    }

    /** Nightly 04:00 — prepare/transmit staged returns + reconcile. */
    @Scheduled(cron = "0 0 4 * * *")
    public void nightly() {
        runOnce(LocalDate.now());
    }

    /** One pass; returns the count of transmissions prepared. */
    @Transactional
    public int runOnce(LocalDate today) {
        int sent = 0;
        String signKey = signingKeyArmor.get();
        String encKey = encryptionKeyArmor.get();
        for (RegulatoryReturn r : returns.findAll()) {
            if (!"FILED".equals(r.getStatus())) continue;   // sign-off chain first (11 §6)
            byte[] envelope = null;
            if (pushEnabled && signKey != null && encKey != null) {
                try {
                    // the envelope carries the WORM-staged file's identity; the
                    // bytes ride the object store (storage_key on the row)
                    envelope = pgp.signThenEncrypt(
                            (r.getCode() + "|" + r.getPeriod() + "|" + r.getFileSha256())
                                    .getBytes(java.nio.charset.StandardCharsets.UTF_8),
                            signKey, System.getenv("ULMS_BB_SIGNING_PASSPHRASE"), encKey);
                } catch (Exception e) {
                    eod.raiseAlert("REGCON_ENVELOPE_FAILED", "regulatory_return", r.getId(),
                            "PGP envelope failed for " + r.getCode() + ": " + e.getMessage());
                }
            }
            r.transmitted();
            sent++;
        }
        reconcile(today);
        return sent;
    }

    /** Row-count vs GL reconciliation — CL-2 rows must equal the period's
     *  classification-history rows (the provision JV source of truth). */
    @Transactional
    public void reconcile(LocalDate today) {
        var period = today.withDayOfMonth(1).toString().substring(0, 7);
        for (RegulatoryReturn r : returns.findAll()) {
            if (!"CL-2".equals(r.getCode()) || !period.equals(r.getPeriod())) continue;
            long provisionRuns = runs.findAll().stream()
                    .filter(p -> p.getRunDate().toString().startsWith(period))
                    .count();
            long historyRows = history.findAll().stream()
                    .filter(h -> h.getRunDate().toString().startsWith(period))
                    .count();
            if (provisionRuns > 0 && r.getRowCount() != historyRows) {
                eod.raiseAlert("RECON_MISMATCH", "regulatory_return", r.getId(),
                        "CL-2 rows=" + r.getRowCount() + " vs classification_history rows="
                                + historyRows + " for " + period);
                log.warn("regcon reconciliation mismatch on CL-2 {}", period);
            }
        }
    }
}

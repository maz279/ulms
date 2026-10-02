package com.uslbd.ulms.compliance;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Provision journal entry (03 mod-compliance "migration list + JV queue to
 * Fineract GL"): the zero-sum pair posted for one EOD run-date — debits ==
 * credits == the run's provision total. UNIQUE(run_date) makes the post
 * idempotent per EOD batch; a drifted total after posting blocks repost
 * (reversal is a UAT process) and raises a compliance alert.
 */
@Entity
@Table(name = "provision_jv", schema = "ulms")
public class ProvisionJv {

    @Id @Column(nullable = false, updatable = false) private UUID id;
    @Column(name = "run_date", nullable = false, unique = true) private LocalDate runDate;
    @Column(name = "total_minor", nullable = false) private long totalMinor;
    @Column(name = "debits_minor", nullable = false) private long debitsMinor;
    @Column(name = "credits_minor", nullable = false) private long creditsMinor;
    @Column(name = "fineract_txn_id", nullable = false, length = 64) private String fineractTxnId;
    @Column(name = "reference_number", nullable = false, length = 64) private String referenceNumber;
    @Column(name = "posted_by", nullable = false, length = 64) private String postedBy;
    @Column(name = "posted_at", nullable = false) private Instant postedAt = Instant.now();

    protected ProvisionJv() {}

    static ProvisionJv of(UUID id, LocalDate runDate, long totalMinor,
                          String fineractTxnId, String referenceNumber, String postedBy) {
        ProvisionJv jv = new ProvisionJv();
        jv.id = id; jv.runDate = runDate; jv.totalMinor = totalMinor;
        jv.debitsMinor = totalMinor; jv.creditsMinor = totalMinor;   // zero-sum pair
        jv.fineractTxnId = fineractTxnId; jv.referenceNumber = referenceNumber;
        jv.postedBy = postedBy;
        return jv;
    }

    /** Zero-sum reconciliation (03 test row): debits == credits == run total. */
    public boolean isZeroSum() {
        return debitsMinor == creditsMinor && creditsMinor == totalMinor && totalMinor >= 0;
    }

    public UUID getId() { return id; }
    public LocalDate getRunDate() { return runDate; }
    public long getTotalMinor() { return totalMinor; }
    public long getDebitsMinor() { return debitsMinor; }
    public long getCreditsMinor() { return creditsMinor; }
    public String getFineractTxnId() { return fineractTxnId; }
    public String getReferenceNumber() { return referenceNumber; }
    public String getPostedBy() { return postedBy; }
    public Instant getPostedAt() { return postedAt; }
}

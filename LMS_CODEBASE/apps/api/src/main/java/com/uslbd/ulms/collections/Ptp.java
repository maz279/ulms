package com.uslbd.ulms.collections;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Promise-to-pay (03 mod-collections, prototype F3 contextual form): the
 * promise snapshot + derived kept/broken state machine (PENDING→KEPT|BROKEN).
 * Contact phone is ops data — masked in audit payloads (06 §5).
 */
@Entity
@Table(name = "ptp", schema = "ulms",
       indexes = @Index(name = "idx_ptp_loan", columnList = "loan_id"))
public class Ptp {

    @Id @Column(nullable = false, updatable = false) private UUID id;
    @Column(name = "loan_id", nullable = false) private UUID loanId;
    @Column(name = "promised_amount_minor", nullable = false) private long promisedAmountMinor;
    @Column(name = "promised_on", nullable = false) private LocalDate promisedOn;
    @Column(nullable = false, length = 8) private String confidence;   // HIGH|MEDIUM|LOW
    @Column(name = "contact_name", length = 120) private String contactName;
    @Column(name = "contact_relation", length = 60) private String contactRelation;
    @Column(name = "contact_phone", length = 20) private String contactPhone;
    @Column(length = 400) private String remark;
    @Column(name = "dpd_at_promise", nullable = false) private int dpdAtPromise;
    @Column(name = "classification_at_promise", nullable = false, length = 6)
    private String classificationAtPromise;
    @Column(nullable = false, length = 8) private String kept = "PENDING";
    @Column(name = "promised_by", nullable = false, length = 64) private String promisedBy;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    protected Ptp() {}

    static Ptp of(UUID id, UUID loanId, long promisedAmountMinor, LocalDate promisedOn,
                  String confidence, String contactName, String contactRelation,
                  String contactPhone, String remark, int dpdAtPromise,
                  String classificationAtPromise, String promisedBy) {
        Ptp p = new Ptp();
        p.id = id; p.loanId = loanId; p.promisedAmountMinor = promisedAmountMinor;
        p.promisedOn = promisedOn; p.confidence = confidence;
        p.contactName = contactName; p.contactRelation = contactRelation;
        p.contactPhone = contactPhone; p.remark = remark;
        p.dpdAtPromise = dpdAtPromise;
        p.classificationAtPromise = classificationAtPromise;
        p.promisedBy = promisedBy;
        return p;
    }

    void markKept() { this.kept = "KEPT"; }
    void markBroken() { this.kept = "BROKEN"; }

    public UUID getId() { return id; }
    public UUID getLoanId() { return loanId; }
    public long getPromisedAmountMinor() { return promisedAmountMinor; }
    public LocalDate getPromisedOn() { return promisedOn; }
    public String getConfidence() { return confidence; }
    public String getContactName() { return contactName; }
    public String getContactRelation() { return contactRelation; }
    public String getContactPhone() { return contactPhone; }
    public String getRemark() { return remark; }
    public int getDpdAtPromise() { return dpdAtPromise; }
    public String getClassificationAtPromise() { return classificationAtPromise; }
    public String getKept() { return kept; }
    public String getPromisedBy() { return promisedBy; }
    public Instant getCreatedAt() { return createdAt; }
}

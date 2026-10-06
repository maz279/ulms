package com.uslbd.ulms.servicing;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * ULMS loan mirror — created at disbursement release (P2), the row the BRPD
 * engine and boards read; Fineract remains the lending truth. DPD syncs from
 * Fineract arrears in P3 (payments); demo/migrated loans carry DPD directly.
 */
@Entity
@Table(name = "loan", schema = "ulms",
       indexes = { @Index(name = "idx_loan_classification", columnList = "classification") })
public class Loan {

    @Id @Column(nullable = false, updatable = false) private UUID id;
    @Column(name = "application_id", nullable = false) private UUID applicationId;
    @Column(name = "customer_id", nullable = false) private UUID customerId;
    @Column(name = "loan_no", nullable = false, unique = true, length = 16) private String loanNo;
    @Column(name = "fineract_loan_id", unique = true) private Long fineractLoanId;
    @Column(name = "principal_minor", nullable = false) private long principalMinor;
    @Column(name = "outstanding_minor", nullable = false) private long outstandingMinor;
    @Column(nullable = false) private int dpd;
    // VARCHAR(16) since V13 — 'WRITTEN_OFF' (11) overflowed the V5 width of 10
    @Column(nullable = false, length = 16) private String stage = "ACTIVE";
    @Column(nullable = false, length = 6) private String classification = "STD-0";
    @Column(name = "interest_suspense", nullable = false) private boolean interestSuspense;
    @Column(name = "disbursed_at") private Instant disbursedAt;
    @Column(name = "tenor_months", nullable = false) private int tenorMonths = 12;   // schedule/quote oracle input (V8)
    @Column(name = "interest_rate_bp", nullable = false) private int interestRateBp = 1199;
    @Column(name = "last_paid_at") private Instant lastPaidAt;
    // R10 P-C classification overrides + R10 P-E floating/moratorium facts
    @Column(name = "legal_flag", nullable = false) private boolean legalFlag = false;
    @Column(name = "bankruptcy_flag", nullable = false) private boolean bankruptcyFlag = false;
    @Column(name = "rescheduled_on") private java.time.LocalDate rescheduledOn;
    @Column(name = "pre_reschedule_classification", length = 6) private String preRescheduleClassification;
    @Column(name = "rate_type", nullable = false, length = 10) private String rateType = "FIXED";
    @Column(name = "spread_bp", nullable = false) private int spreadBp = 0;
    @Column(name = "moratorium_months", nullable = false) private int moratoriumMonths = 0;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    protected Loan() {}

    public static Loan disbursed(UUID id, UUID applicationId, UUID customerId, String loanNo,
                                 Long fineractLoanId, long principalMinor) {
        Loan l = new Loan();
        l.id = id; l.applicationId = applicationId; l.customerId = customerId;
        l.loanNo = loanNo; l.fineractLoanId = fineractLoanId;
        l.principalMinor = principalMinor; l.outstandingMinor = principalMinor;
        l.dpd = 0; l.disbursedAt = Instant.now();
        return l;
    }

    public static Loan disbursed(UUID id, UUID applicationId, UUID customerId, String loanNo,
                                 Long fineractLoanId, long principalMinor,
                                 int tenorMonths, int interestRateBp) {
        Loan l = disbursed(id, applicationId, customerId, loanNo, fineractLoanId, principalMinor);
        l.tenorMonths = tenorMonths; l.interestRateBp = interestRateBp;
        return l;
    }

    /** Demo/migrated portfolio row (G2: board live against migrated demo data). */
    public static Loan demo(UUID id, UUID customerId, String loanNo,
                            long principalMinor, int dpd) {
        Loan l = new Loan();
        l.id = id; l.customerId = customerId; l.applicationId = null;   // migrated: no application
        l.loanNo = loanNo; l.principalMinor = principalMinor;
        l.outstandingMinor = principalMinor; l.dpd = dpd; l.disbursedAt = Instant.now();
        return l;
    }

    public void reclassify(String classification, boolean interestSuspense) {
        this.classification = classification;
        this.interestSuspense = interestSuspense;
    }
    void setDpd(int dpd) { this.dpd = dpd; }

    /** Payment posting: reduce outstanding, stamp last-paid, DPD heuristic
     *  (months paid ≈ amount/EMI × 30 days credited; floor 0). */
    void applyPayment(long amountMinor, long emiMinor) {
        this.outstandingMinor = Math.max(0, this.outstandingMinor - amountMinor);
        this.lastPaidAt = Instant.now();
        if (emiMinor > 0) {
            long months = amountMinor / emiMinor;
            this.dpd = (int) Math.max(0, this.dpd - months * 30);
        }
        if (this.outstandingMinor == 0) { this.dpd = 0; this.stage = "CLOSED"; }
    }
    void close() { this.stage = "CLOSED"; }
    void updateTenor(int tenorMonths) { this.tenorMonths = tenorMonths; }   // approved reschedule

    // R10 P-C: classification-override facts (CLS-ALGO §1.2) — legal /
    // bankruptcy floors and reschedule retention window
    public void markLegal() { this.legalFlag = true; }
    public void markBankrupt() { this.bankruptcyFlag = true; }
    public void markRescheduled(java.time.LocalDate on, String priorClassification) {
        this.rescheduledOn = on; this.preRescheduleClassification = priorClassification;
    }
    /** R10 P-E moratorium: paused months' interest capitalizes into outstanding. */
    void capitalizedMoratorium(int months, long capitalizedMinor) {
        this.moratoriumMonths += months;
        this.outstandingMinor += capitalizedMinor;
    }
    /** R10 P-E top-up: combined exposure raises principal + outstanding. */
    void raise(long amountMinor) {
        this.principalMinor += amountMinor;
        this.outstandingMinor += amountMinor;
    }
    /** R10 P-E: floating re-price — BLR + spread. */
    void reprice(int newRateBp) { this.interestRateBp = newRateBp; }

    /** R4 write-off execution (collections bridge): zero + close, provision settled. */
    public void writeOffToZero() {
        this.outstandingMinor = 0;
        this.dpd = 0;
        this.stage = "WRITTEN_OFF";
    }
    /** R4 reversal: recovery arrived after write-off — restore the claim. */
    public void restoreAfterWriteOffReversal(long amountMinor) {
        this.outstandingMinor = amountMinor;
        this.stage = "ACTIVE";
    }

    public UUID getId() { return id; }
    public UUID getApplicationId() { return applicationId; }
    public UUID getCustomerId() { return customerId; }
    public String getLoanNo() { return loanNo; }
    public Long getFineractLoanId() { return fineractLoanId; }
    public long getPrincipalMinor() { return principalMinor; }
    public long getOutstandingMinor() { return outstandingMinor; }
    public boolean isLegalFlag() { return legalFlag; }
    public boolean isBankruptcyFlag() { return bankruptcyFlag; }
    public java.time.LocalDate getRescheduledOn() { return rescheduledOn; }
    public String getPreRescheduleClassification() { return preRescheduleClassification; }
    public String getRateType() { return rateType; }
    public int getSpreadBp() { return spreadBp; }
    public int getMoratoriumMonths() { return moratoriumMonths; }
    public int getDpd() { return dpd; }
    public String getStage() { return stage; }
    public String getClassification() { return classification; }
    public boolean isInterestSuspense() { return interestSuspense; }
    public Instant getDisbursedAt() { return disbursedAt; }
    public int getTenorMonths() { return tenorMonths; }
    public int getInterestRateBp() { return interestRateBp; }
    public Instant getLastPaidAt() { return lastPaidAt; }
    public Instant getCreatedAt() { return createdAt; }
}

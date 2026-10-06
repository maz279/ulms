package com.uslbd.ulms.origination;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Loan application (PLANNING/03 mod-origination). Stage mirrors the prototype's
 * 9-stage pipeline; snapshot fields captured at submit per 04 §2.
 */
@Entity
@Table(name = "application", schema = "ulms",
       indexes = { @Index(name = "idx_application_stage", columnList = "stage"),
                   @Index(name = "idx_application_branch", columnList = "branchCode") })
public class Application {

    public enum Stage { SCREENING, CIB_PULL, SCORING, CPV, APPROVAL, SANCTION,
                        DOCUMENTATION, DISBURSEMENT, DISBURSED }
    public enum RateType { FIXED, FLOATING }          // ADR-009 (BLR+spread)

    @Id private UUID id;
    @Column(name = "app_no", nullable = false, unique = true, length = 16) private String appNo;
    @Column(name = "customer_id", nullable = false) private UUID customerId;
    @Column(name = "product_code", nullable = false, length = 20) private String productCode;
    @Column(name = "amount_minor", nullable = false) private long amountMinor;
    @Column(name = "tenor_months", nullable = false) private int tenorMonths;
    @Enumerated(EnumType.STRING) @Column(name = "rate_type", nullable = false, length = 10)
    private RateType rateType = RateType.FIXED;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private Stage stage = Stage.SCREENING;
    @Column(name = "dbr_percent") private java.math.BigDecimal dbrPercent;
    @Column(name = "income_minor") private Long incomeMinor;                 // assessment snapshot (04 §2)
    @Column(name = "existing_emi_minor") private Long existingEmiMinor;
    @Column(name = "cib_obligation_minor") private Long cibObligationMinor;
    @Column(name = "branch_code", nullable = false, length = 8) private String branchCode;
    @Column(name = "fineract_loan_id") private Long fineractLoanId;   // set on sanction
    @Column(name = "created_by", nullable = false, length = 64) private String createdBy;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();
    @Column(name = "updated_at", nullable = false) private Instant updatedAt = Instant.now();
    /** Optimistic concurrency (05 §4): PATCH carries the version; stale ⇒ 409. */
    @jakarta.persistence.Version @Column(nullable = false) private long version;

    // R10 P-B: fast-track flag + risk-based pricing snapshot (applied at scoring)
    @Column(nullable = false) private boolean stp = false;
    @Column(length = 2) private String grade;
    @Column(name = "applied_rate_bp") private Integer appliedRateBp;

    protected Application() {}

    static Application draft(UUID id, String appNo, UUID customerId, String productCode,
                             long amountMinor, int tenorMonths, RateType rateType,
                             String branchCode, String createdBy,
                             Long incomeMinor, Long existingEmiMinor) {
        Application a = new Application();
        a.id = id; a.appNo = appNo; a.customerId = customerId; a.productCode = productCode;
        a.amountMinor = amountMinor; a.tenorMonths = tenorMonths; a.rateType = rateType;
        a.branchCode = branchCode; a.createdBy = createdBy;
        a.incomeMinor = incomeMinor; a.existingEmiMinor = existingEmiMinor;
        return a;
    }

    void submit(java.math.BigDecimal dbr) { this.dbrPercent = dbr; touch(); }
    void stage(Stage s) { this.stage = s; touch(); }
    /** Risk-based pricing snapshot (R10 P-B): grade → premium over product rate. */
    void recordPricing(String grade, int appliedRateBp) {
        this.grade = grade; this.appliedRateBp = appliedRateBp; touch();
    }
    void markStp() { this.stp = true; touch(); }
    /** Autosave PATCH while still a draft (07 §4). */
    void redraft(String productCode, long amountMinor, int tenorMonths, RateType rateType) {
        this.productCode = productCode; this.amountMinor = amountMinor;
        this.tenorMonths = tenorMonths; this.rateType = rateType; touch();
    }
    void recordAssessment(java.math.BigDecimal dbr, long cibObligationMinor) {
        this.dbrPercent = dbr; this.cibObligationMinor = cibObligationMinor; touch();
    }
    void updateIncome(Long incomeMinor, Long existingEmiMinor) {
        if (incomeMinor != null) this.incomeMinor = incomeMinor;
        if (existingEmiMinor != null) this.existingEmiMinor = existingEmiMinor;
        touch();
    }
    void attachFineractLoan(long fineractLoanId) { this.fineractLoanId = fineractLoanId; touch(); }
    private void touch() { this.updatedAt = Instant.now(); }

    public UUID getId() { return id; }
    public String getAppNo() { return appNo; }
    public UUID getCustomerId() { return customerId; }
    public String getProductCode() { return productCode; }
    public long getAmountMinor() { return amountMinor; }
    public int getTenorMonths() { return tenorMonths; }
    public RateType getRateType() { return rateType; }
    public Stage getStage() { return stage; }
    public java.math.BigDecimal getDbrPercent() { return dbrPercent; }
    public Long getIncomeMinor() { return incomeMinor; }
    public Long getExistingEmiMinor() { return existingEmiMinor; }
    public Long getCibObligationMinor() { return cibObligationMinor; }
    public String getBranchCode() { return branchCode; }
    public Long getFineractLoanId() { return fineractLoanId; }
    public String getCreatedBy() { return createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public long getVersion() { return version; }
    public boolean isStp() { return stp; }
    public String getGrade() { return grade; }
    public Integer getAppliedRateBp() { return appliedRateBp; }
}

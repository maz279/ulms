package com.uslbd.ulms.product;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Loan product (R3, PLANNING/03 mod-product): no-code product configuration —
 * bilingual names, amount/tenor bounds, rate (fixed or BLR+spread per
 * ADR-009), charges and security rules. Versioned; one ACTIVE per code.
 */
@Entity
@Table(name = "loan_product", schema = "ulms",
       indexes = { @Index(name = "idx_loan_product_code", columnList = "code") })
public class LoanProduct {

    public enum Status { DRAFT, ACTIVE, RETIRED }
    public enum RateType { FIXED, FLOATING }

    @Id private UUID id;
    @Column(nullable = false, length = 20) private String code;
    @Column(nullable = false) private int version;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 10) private Status status = Status.DRAFT;
    @Column(name = "name_en", nullable = false, length = 120) private String nameEn;
    @Column(name = "name_bn", length = 120) private String nameBn;
    @Column(name = "min_amount_minor", nullable = false) private long minAmountMinor;
    @Column(name = "max_amount_minor", nullable = false) private long maxAmountMinor;
    @Column(name = "step_minor", nullable = false) private long stepMinor = 500_000;
    @Column(name = "tenor_min_months", nullable = false) private int tenorMinMonths;
    @Column(name = "tenor_max_months", nullable = false) private int tenorMaxMonths;
    @Enumerated(EnumType.STRING) @Column(name = "rate_type", nullable = false, length = 10) private RateType rateType = RateType.FIXED;
    @Column(name = "rate_bp", nullable = false) private int rateBp;
    @Column(name = "spread_bp") private Integer spreadBp;
    @Column(nullable = false, length = 12) private String frequency = "MONTHLY";
    @Column(nullable = false, length = 12) private String amortization = "REDUCING";
    @Column(name = "prepay_penalty_bp", nullable = false) private int prepayPenaltyBp = 200;
    @Column(name = "collateral_required", nullable = false) private boolean collateralRequired;
    @Column(name = "guarantor_required", nullable = false) private boolean guarantorRequired;
    @Column(name = "max_ltv_bp", nullable = false) private int maxLtvBp;
    @Column(name = "created_by", nullable = false, length = 64) private String createdBy;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "loan_product_charge", schema = "ulms",
                     joinColumns = @JoinColumn(name = "product_id"),
                     uniqueConstraints = @UniqueConstraint(columnNames = {"product_id", "code"}))
    @Column(name = "code", length = 20) private List<String> chargeCodes = new ArrayList<>();

    protected LoanProduct() {}

    /** External-audit fix: amend a DRAFT in place (PATCH /products/{code}).
     *  ACTIVE versions are immutable — version them via create+activate. */
    void amend(String nameEn, String nameBn, Long maxAmountMinor,
               Integer tenorMaxMonths, Integer rateBp) {
        if (status != Status.DRAFT) {
            throw new IllegalStateException("only DRAFT rows amend (now " + status + ")");
        }
        if (nameEn != null) this.nameEn = nameEn;
        if (nameBn != null) this.nameBn = nameBn;
        if (maxAmountMinor != null) this.maxAmountMinor = maxAmountMinor;
        if (tenorMaxMonths != null) this.tenorMaxMonths = tenorMaxMonths;
        if (rateBp != null) this.rateBp = rateBp;
    }

    public static LoanProduct draft(UUID id, String code, String nameEn, String nameBn,
                                    long minAmountMinor, long maxAmountMinor,
                                    int tenorMinMonths, int tenorMaxMonths,
                                    RateType rateType, int rateBp, String createdBy) {
        LoanProduct p = new LoanProduct();
        p.id = id; p.code = code; p.version = 1; p.nameEn = nameEn; p.nameBn = nameBn;
        p.minAmountMinor = minAmountMinor; p.maxAmountMinor = maxAmountMinor;
        p.tenorMinMonths = tenorMinMonths; p.tenorMaxMonths = tenorMaxMonths;
        p.rateType = rateType; p.rateBp = rateBp; p.createdBy = createdBy;
        return p;
    }

    public record Eligibility(boolean eligible, java.util.List<String> violations,
                              Long emiMinor, int rateBp,
                              boolean collateralRequired, boolean guarantorRequired) {}

    /** Eligibility pre-check (03): bounds + EMI preview via the shared oracle. */
    public Eligibility eligibility(long amountMinor, int tenorMonths) {
        var violations = new java.util.ArrayList<String>();
        if (amountMinor < minAmountMinor || amountMinor > maxAmountMinor) {
            violations.add("amount must be " + minAmountMinor + "–" + maxAmountMinor + " minor");
        }
        if (tenorMonths < tenorMinMonths || tenorMonths > tenorMaxMonths) {
            violations.add("tenor must be " + tenorMinMonths + "–" + tenorMaxMonths + " months");
        }
        Long emi = violations.isEmpty()
                ? com.uslbd.ulms.platform.MoneyMath.emiMonthly(amountMinor, tenorMonths,
                        java.math.BigDecimal.valueOf(rateBp, 4))
                : null;
        return new Eligibility(violations.isEmpty(), violations, emi, rateBp,
                collateralRequired, guarantorRequired);
    }

    // --- getters (package-private fields kept for JPA; service drives state) ---
    public long getStepMinor() { return stepMinor; }
    public Integer getSpreadBp() { return spreadBp; }
    public String getFrequency() { return frequency; }
    public String getAmortization() { return amortization; }
    public int getPrepayPenaltyBp() { return prepayPenaltyBp; }
    public boolean isCollateralRequired() { return collateralRequired; }
    public boolean isGuarantorRequired() { return guarantorRequired; }
    public int getMaxLtvBp() { return maxLtvBp; }
    public String getCreatedBy() { return createdBy; }
    public java.time.Instant getCreatedAt() { return createdAt; }
    public java.util.List<String> getChargeCodes() { return chargeCodes; }
    public UUID getId() { return id; }
    public String getCode() { return code; }
    public int getVersion() { return version; }
    public Status getStatus() { return status; }
    public String getNameEn() { return nameEn; }
    public String getNameBn() { return nameBn; }
    public long getMinAmountMinor() { return minAmountMinor; }
    public long getMaxAmountMinor() { return maxAmountMinor; }
    public int getTenorMinMonths() { return tenorMinMonths; }
    public int getTenorMaxMonths() { return tenorMaxMonths; }
    public RateType getRateType() { return rateType; }
    public int getRateBp() { return rateBp; }
    void activate() {
        if (status != Status.DRAFT) throw new IllegalStateException("only DRAFT activates");
        this.status = Status.ACTIVE;
    }
    void retire() { this.status = Status.RETIRED; }
}

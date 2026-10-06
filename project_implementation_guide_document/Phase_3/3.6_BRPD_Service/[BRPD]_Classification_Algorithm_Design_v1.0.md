**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Classification Algorithm Design |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Unisoft Technical Team |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# Classification Algorithm Design

## 1. Algorithm Overview

### 1.1 DPD Calculation

```java
@Component
public class DpdCalculator {
    
    /**
     * Calculate Days Past Due for a loan
     */
    public int calculateDpd(Loan loan, LocalDate calculationDate) {
        // Get the oldest unpaid installment
        Optional<Installment> oldestUnpaid = loan.getInstallments().stream()
            .filter(i -> i.getStatus() == InstallmentStatus.UNPAID)
            .filter(i -> i.getDueDate().isBefore(calculationDate))
            .min(Comparator.comparing(Installment::getDueDate));
        
        if (oldestUnpaid.isEmpty()) {
            // All installments paid or not yet due
            return 0;
        }
        
        LocalDate dueDate = oldestUnpaid.get().getDueDate();
        return (int) ChronoUnit.DAYS.between(dueDate, calculationDate);
    }
    
    /**
     * Calculate DPD considering grace period
     */
    public int calculateDpdWithGracePeriod(Loan loan, LocalDate calculationDate, 
            int gracePeriodDays) {
        int rawDpd = calculateDpd(loan, calculationDate);
        return Math.max(0, rawDpd - gracePeriodDays);
    }
}
```

### 1.2 Classification Engine

```java
@Component
@RequiredArgsConstructor
public class ClassificationEngine {
    
    private final DpdCalculator dpdCalculator;
    
    /**
     * Determine classification based on DPD
     */
    public ClassificationDecision classify(Loan loan, LocalDate date) {
        int dpd = dpdCalculator.calculateDpd(loan, date);
        
        // Base classification from DPD
        BrpdClassificationStage stage = BrpdClassificationStage.fromDpd(dpd);
        
        // Apply override rules
        ClassificationOverride override = checkOverrideRules(loan, stage, dpd);
        
        if (override != null) {
            return ClassificationDecision.builder()
                .stage(override.getStage())
                .dpd(dpd)
                .reason(override.getReason())
                .override(true)
                .build();
        }
        
        return ClassificationDecision.builder()
            .stage(stage)
            .dpd(dpd)
            .reason("DPD based: " + dpd + " days")
            .override(false)
            .build();
    }
    
    /**
     * Check for classification overrides
     */
    private ClassificationOverride checkOverrideRules(Loan loan, 
            BrpdClassificationStage currentStage, int dpd) {
        
        // Rule 1: Legal proceedings - auto SS minimum
        if (loan.isUnderLegalProceedings() && currentStage.ordinal() < BrpdClassificationStage.SS.ordinal()) {
            return ClassificationOverride.builder()
                .stage(BrpdClassificationStage.SS)
                .reason("Legal proceedings initiated")
                .build();
        }
        
        // Rule 2: Bankruptcy filing
        if (loan.getBorrower().isBankrupt()) {
            return ClassificationOverride.builder()
                .stage(BrpdClassificationStage.BL)
                .reason("Borrower bankrupt")
                .build();
        }
        
        // Rule 3: Restructured loans special handling
        if (loan.isRestructured() && loan.getRestructureDate().isAfter(LocalDate.now().minusMonths(6))) {
            // Keep previous classification for 6 months after restructure
            return ClassificationOverride.builder()
                .stage(loan.getPreRestructureStage())
                .reason("Within 6 months of restructuring")
                .build();
        }
        
        return null;
    }
}
```

## 2. Special Classification Rules

### 2.1 Rescheduled Loans

```java
public class RescheduledLoanClassifier {
    
    public BrpdClassificationStage classifyRescheduledLoan(RescheduledLoan loan, 
            LocalDate date) {
        
        // For loans rescheduled within last 6 months
        if (isWithinSixMonthsOfReschedule(loan, date)) {
            // Check if performing as per rescheduled terms
            if (isPerformingPerRescheduleTerms(loan, date)) {
                // Can maintain STD classification
                return BrpdClassificationStage.STD_0;
            } else {
                // Downgrade to next stage
                return downgradeStage(loan.getOriginalStage());
            }
        }
        
        // After 6 months, classify based on actual DPD
        return calculateBasedOnDpd(loan, date);
    }
}
```

### 2.2 COVID-19 Special Considerations

```java
public class SpecialConsiderationClassifier {
    
    /**
     * Check if loan qualifies for special consideration
     */
    public boolean qualifiesForSpecialConsideration(Loan loan) {
        // Loans affected by COVID-19
        return loan.hasCovidReschedule() && 
               loan.getCovidRescheduleDate().isAfter(LocalDate.of(2020, 3, 1));
    }
    
    /**
     * Apply special consideration classification
     */
    public ClassificationDecision applySpecialConsideration(Loan loan, 
            LocalDate date) {
        // As per BRPD circular, may allow extended period before classification upgrade
        int adjustedDpd = Math.max(0, calculateDpd(loan, date) - 90);
        
        return ClassificationDecision.builder()
            .stage(BrpdClassificationStage.fromDpd(adjustedDpd))
            .dpd(calculateDpd(loan, date))
            .reason("Special consideration applied (COVID)")
            .build();
    }
}
```

## 3. Classification History Tracking

```java
@Entity
@Table(name = "classification_history")
@Data
public class ClassificationHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "loan_id", nullable = false)
    private Long loanId;
    
    @Column(name = "previous_stage", length = 10)
    @Enumerated(EnumType.STRING)
    private BrpdClassificationStage previousStage;
    
    @Column(name = "current_stage", length = 10)
    @Enumerated(EnumType.STRING)
    private BrpdClassificationStage currentStage;
    
    @Column(name = "days_past_due")
    private Integer daysPastDue;
    
    @Column(name = "outstanding_principal", precision = 19, scale = 6)
    private BigDecimal outstandingPrincipal;
    
    @Column(name = "provision_required", precision = 19, scale = 6)
    private BigDecimal provisionRequired;
    
    @Column(name = "classification_date")
    private LocalDate classificationDate;
    
    @Column(name = "reason")
    private String reason;
    
    @Column(name = "classified_by")
    private String classifiedBy;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
```

---

## Appendices

### A.1 Classification Decision Tree

```
Start
  |
  v
Calculate DPD
  |
  v
DPD = 0? ----Yes----> STD-0
  | No
  v
DPD <= 30? --Yes----> STD-1
  | No
  v
DPD <= 60? --Yes----> STD-2
  | No
  v
DPD <= 90? --Yes----> SMA
  | No
  v
DPD <= 180? -Yes----> SS
  | No
  v
DPD <= 365? -Yes----> DF
  | No
  v
B/L
```

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | ECL Calculation Model |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Unisoft Technical Team |
| **Reviewed By** | Solution Architect |
| **Classification** | Confidential |
| **Status** | Draft |

---

# ECL Calculation Model

## 1. Overview

IFRS-9 Expected Credit Loss (ECL) calculation model supporting three-stage approach.

## 2. ECL Stages

| Stage | Description | ECL Period |
|-------|-------------|------------|
| Stage 1 | Performing | 12-month |
| Stage 2 | Significant increase in credit risk | Lifetime |
| Stage 3 | Credit impaired | Lifetime |

## 3. Calculation Formula

```
ECL = PD × LGD × EAD

Where:
- PD = Probability of Default
- LGD = Loss Given Default
- EAD = Exposure at Default
```

## 4. Implementation

```java
@Service
@RequiredArgsConstructor
public class EclCalculationService {
    
    private final PdModelService pdModelService;
    private final LgdModelService lgdModelService;
    private final EadModelService eadModelService;
    
    public EclResult calculateEcl(Long loanId, LocalDate calculationDate) {
        Loan loan = loanRepository.findById(loanId)
            .orElseThrow(() -> new LoanNotFoundException(loanId));
        
        // Determine stage
        Ifrs9Stage stage = determineStage(loan, calculationDate);
        
        // Calculate components
        BigDecimal pd = pdModelService.calculatePd(loan, stage, calculationDate);
        BigDecimal lgd = lgdModelService.calculateLgd(loan, stage);
        BigDecimal ead = eadModelService.calculateEad(loan, calculationDate);
        
        // Calculate ECL
        BigDecimal ecl = pd.multiply(lgd).multiply(ead)
            .setScale(2, RoundingMode.HALF_UP);
        
        return EclResult.builder()
            .loanId(loanId)
            .stage(stage)
            .probabilityOfDefault(pd)
            .lossGivenDefault(lgd)
            .exposureAtDefault(ead)
            .expectedCreditLoss(ecl)
            .calculationDate(calculationDate)
            .build();
    }
    
    private Ifrs9Stage determineStage(Loan loan, LocalDate calculationDate) {
        // Stage 3: Credit impaired
        if (loan.getClassificationStage() == BrpdClassificationStage.SS ||
            loan.getClassificationStage() == BrpdClassificationStage.DF ||
            loan.getClassificationStage() == BrpdClassificationStage.BL) {
            return Ifrs9Stage.STAGE_3;
        }
        
        // Stage 2: Significant increase in credit risk
        if (hasSignificantIncreaseInCreditRisk(loan, calculationDate)) {
            return Ifrs9Stage.STAGE_2;
        }
        
        // Stage 1: Performing
        return Ifrs9Stage.STAGE_1;
    }
    
    private boolean hasSignificantIncreaseInCreditRisk(Loan loan, LocalDate date) {
        // Criteria:
        // 1. DPD > 30 days
        // 2. On watchlist
        // 3. Significant deterioration in CIB score
        // 4. Forbearance/restructuring
        
        if (loan.getDaysPastDue() > 30) return true;
        if (loan.isWatchlisted()) return true;
        if (loan.isRestructured()) return true;
        
        return false;
    }
    
    public PortfolioEclResult calculatePortfolioEcl(LocalDate calculationDate) {
        List<Loan> activeLoans = loanRepository.findActiveLoans();
        
        BigDecimal totalStage1Ecl = BigDecimal.ZERO;
        BigDecimal totalStage2Ecl = BigDecimal.ZERO;
        BigDecimal totalStage3Ecl = BigDecimal.ZERO;
        
        int stage1Count = 0;
        int stage2Count = 0;
        int stage3Count = 0;
        
        for (Loan loan : activeLoans) {
            EclResult result = calculateEcl(loan.getId(), calculationDate);
            
            switch (result.getStage()) {
                case STAGE_1 -> {
                    totalStage1Ecl = totalStage1Ecl.add(result.getExpectedCreditLoss());
                    stage1Count++;
                }
                case STAGE_2 -> {
                    totalStage2Ecl = totalStage2Ecl.add(result.getExpectedCreditLoss());
                    stage2Count++;
                }
                case STAGE_3 -> {
                    totalStage3Ecl = totalStage3Ecl.add(result.getExpectedCreditLoss());
                    stage3Count++;
                }
            }
        }
        
        return PortfolioEclResult.builder()
            .calculationDate(calculationDate)
            .stage1Count(stage1Count)
            .stage1Ecl(totalStage1Ecl)
            .stage2Count(stage2Count)
            .stage2Ecl(totalStage2Ecl)
            .stage3Count(stage3Count)
            .stage3Ecl(totalStage3Ecl)
            .totalEcl(totalStage1Ecl.add(totalStage2Ecl).add(totalStage3Ecl))
            .build();
    }
}
```

## 5. PD Model

```java
@Component
public class PdModelService {
    
    public BigDecimal calculatePd(Loan loan, Ifrs9Stage stage, LocalDate date) {
        return switch (stage) {
            case STAGE_1 -> calculate12MonthPd(loan, date);
            case STAGE_2, STAGE_3 -> calculateLifetimePd(loan, date);
        };
    }
    
    private BigDecimal calculate12MonthPd(Loan loan, LocalDate date) {
        // Based on:
        // - Historical default rates by loan type
        // - Current CIB score
        // - Days past due
        // - Economic indicators
        
        double basePd = getBasePdByType(loan.getLoanType());
        
        // Adjustments
        if (loan.getCibScore() < 600) basePd *= 2;
        if (loan.getDaysPastDue() > 0) basePd *= 1.5;
        
        return BigDecimal.valueOf(Math.min(basePd, 0.99));
    }
    
    private BigDecimal calculateLifetimePd(Loan loan, LocalDate date) {
        // Lifetime PD considers remaining tenor
        int monthsRemaining = loan.getRemainingTenorMonths();
        BigDecimal annualPd = calculate12MonthPd(loan, date);
        
        // Simplified: PD = 1 - (1 - annualPd)^years
        double years = monthsRemaining / 12.0;
        double lifetimePd = 1 - Math.pow(1 - annualPd.doubleValue(), years);
        
        return BigDecimal.valueOf(Math.min(lifetimePd, 0.99));
    }
}
```

---

## Appendices

### A.1 ECL vs BRPD Provisioning

| Aspect | IFRS-9 ECL | BRPD Provisioning |
|--------|------------|-------------------|
| Forward-looking | Yes | No |
| PD-based | Yes | No |
| Stage-based | Yes | DPD-based |
| Economic factors | Included | Not included |
| Reporting | Financial statements | Regulatory reports |

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | IFRS-9 ECL Calculation Model |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Technical Lead |
| **Reviewed By** | Solution Architect |
| **Classification** | Confidential |
| **Status** | Draft |

---

# IFRS-9 ECL Calculation Model

## ECL Formula

```
ECL = PD × LGD × EAD

Where:
- PD: Probability of Default
- LGD: Loss Given Default
- EAD: Exposure at Default
```

## Implementation

```java
@Service
@RequiredArgsConstructor
public class EclCalculationService {
    
    public EclResult calculateEcl(Long loanId, LocalDate asOfDate) {
        Loan loan = loanRepository.findById(loanId).orElseThrow();
        
        // Get classification
        BrpdClassification classification = classificationService
            .getCurrentClassification(loanId);
        
        // Calculate components
        BigDecimal pd = calculatePD(classification);
        BigDecimal lgd = calculateLGD(loan);
        BigDecimal ead = calculateEAD(loan);
        
        // Calculate ECL
        BigDecimal ecl = pd.multiply(lgd).multiply(ead)
            .setScale(2, RoundingMode.HALF_UP);
        
        return EclResult.builder()
            .loanId(loanId)
            .asOfDate(asOfDate)
            .probabilityOfDefault(pd)
            .lossGivenDefault(lgd)
            .exposureAtDefault(ead)
            .expectedCreditLoss(ecl)
            .build();
    }
    
    private BigDecimal calculatePD(BrpdClassification classification) {
        return switch (classification) {
            case STD_0, STD_1, STD_2 -> new BigDecimal("0.01");
            case SMA -> new BigDecimal("0.05");
            case SS -> new BigDecimal("0.20");
            case DF -> new BigDecimal("0.50");
            case BL -> new BigDecimal("1.00");
        };
    }
    
    private BigDecimal calculateLGD(Loan loan) {
        // Based on collateral coverage
        if (loan.getCollateralValue() != null && 
            loan.getCollateralValue().compareTo(loan.getOutstanding()) >= 0) {
            return new BigDecimal("0.20");  // 20% loss with full collateral
        }
        return new BigDecimal("0.60");  // 60% loss without collateral
    }
    
    private BigDecimal calculateEAD(Loan loan) {
        // Outstanding + Undrawn commitments
        return loan.getOutstandingAmount()
            .add(loan.getUndrawnCommitments());
    }
}
```

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

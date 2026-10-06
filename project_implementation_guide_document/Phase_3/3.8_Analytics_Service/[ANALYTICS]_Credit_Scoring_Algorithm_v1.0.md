**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Credit Scoring Algorithm |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Unisoft Technical Team |
| **Reviewed By** | Solution Architect |
| **Classification** | Confidential |
| **Status** | Draft |

---

# Credit Scoring Algorithm

## 1. Overview

Multi-factor credit scoring algorithm combining CIB data, application data, and behavioral analytics.

## 2. Scoring Model

### 2.1 Score Components

| Factor | Weight | Max Points |
|--------|--------|------------|
| CIB Score | 30% | 300 |
| Income Stability | 20% | 200 |
| Employment Type | 15% | 150 |
| Collateral Value | 15% | 150 |
| Existing Relationship | 10% | 100 |
| Geographic Risk | 10% | 100 |
| **Total** | **100%** | **1000** |

### 2.2 Implementation

```java
@Service
@RequiredArgsConstructor
public class CreditScoringService {
    
    private final CibService cibService;
    private final RuleEngine ruleEngine;
    
    public CreditScore calculateScore(CreditScoreInput input) {
        int score = 0;
        Map<String, Integer> breakdown = new HashMap<>();
        List<String> riskFactors = new ArrayList<>();
        
        // CIB Score Component (30%)
        int cibPoints = calculateCibPoints(input.getNid());
        score += cibPoints;
        breakdown.put("cib", cibPoints);
        
        // Income Stability (20%)
        int incomePoints = calculateIncomePoints(
            input.getMonthlyIncome(), 
            input.getIncomeSource()
        );
        score += incomePoints;
        breakdown.put("income", incomePoints);
        
        // Employment Type (15%)
        int employmentPoints = calculateEmploymentPoints(
            input.getEmploymentType(),
            input.getEmploymentTenure()
        );
        score += employmentPoints;
        breakdown.put("employment", employmentPoints);
        
        // Collateral (15%)
        int collateralPoints = calculateCollateralPoints(
            input.getCollateralType(),
            input.getCollateralValue(),
            input.getLoanAmount()
        );
        score += collateralPoints;
        breakdown.put("collateral", collateralPoints);
        
        // Existing Relationship (10%)
        int relationshipPoints = calculateRelationshipPoints(
            input.getExistingLoans(),
            input.getPaymentHistory()
        );
        score += relationshipPoints;
        breakdown.put("relationship", relationshipPoints);
        
        // Geographic Risk (10%)
        int geoPoints = calculateGeographicPoints(input.getDistrict());
        score += geoPoints;
        breakdown.put("geographic", geoPoints);
        
        // Risk factor analysis
        riskFactors = analyzeRiskFactors(input, score);
        
        return CreditScore.builder()
            .score(score)
            .rating(determineRating(score))
            .breakdown(breakdown)
            .riskFactors(riskFactors)
            .recommendedInterestRate(calculateInterestRate(score))
            .maxLoanAmount(calculateMaxLoanAmount(score, input.getMonthlyIncome()))
            .build();
    }
    
    private int calculateCibPoints(String nid) {
        CibIndividualReport report = cibService.inquireIndividual(
            CibIndividualInquiryRequest.builder().nid(nid).build()
        ).block();
        
        int cibScore = report.getCibScore();
        
        // Map CIB score 0-900 to points 0-300
        return Math.min(300, (int) (cibScore * 0.333));
    }
    
    private int calculateIncomePoints(BigDecimal income, IncomeSource source) {
        int points = 0;
        
        // Income amount (max 150)
        if (income.compareTo(new BigDecimal("200000")) >= 0) {
            points += 150;
        } else if (income.compareTo(new BigDecimal("100000")) >= 0) {
            points += 120;
        } else if (income.compareTo(new BigDecimal("50000")) >= 0) {
            points += 80;
        } else {
            points += 40;
        }
        
        // Income source stability (max 50)
        points += switch (source) {
            case SALARIED_GOVT -> 50;
            case SALARIED_PRIVATE -> 40;
            case BUSINESS_ESTABLISHED -> 35;
            case BUSINESS_NEW -> 20;
            case FREELANCE -> 15;
            default -> 10;
        };
        
        return points;
    }
    
    private Rating determineRating(int score) {
        if (score >= 800) return Rating.EXCELLENT;
        if (score >= 700) return Rating.GOOD;
        if (score >= 600) return Rating.FAIR;
        if (score >= 500) return Rating.POOR;
        return Rating.VERY_POOR;
    }
    
    private BigDecimal calculateInterestRate(int score) {
        // Base rate 10%
        BigDecimal baseRate = new BigDecimal("10.0");
        
        // Add risk premium
        BigDecimal premium = switch (determineRating(score)) {
            case EXCELLENT -> new BigDecimal("0");
            case GOOD -> new BigDecimal("1");
            case FAIR -> new BigDecimal("2.5");
            case POOR -> new BigDecimal("4");
            case VERY_POOR -> new BigDecimal("6");
        };
        
        return baseRate.add(premium);
    }
}
```

## 3. Score Interpretation

| Score Range | Rating | Risk Level | Max LTV |
|-------------|--------|------------|---------|
| 800-1000 | Excellent | Very Low | 90% |
| 700-799 | Good | Low | 80% |
| 600-699 | Fair | Moderate | 70% |
| 500-599 | Poor | High | 60% |
| 0-499 | Very Poor | Very High | 50% |

---

## Appendices

### A.1 Model Validation

- Back-testing against historical data
- Quarterly model review
- Annual recalibration

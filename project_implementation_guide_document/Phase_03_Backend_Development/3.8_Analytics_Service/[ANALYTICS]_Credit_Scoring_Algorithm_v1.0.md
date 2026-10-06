**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Credit Scoring Algorithm |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Technical Lead |
| **Reviewed By** | Solution Architect |
| **Classification** | Confidential |
| **Status** | Draft |

---

# Credit Scoring Algorithm

## Scoring Factors

| Factor | Weight | Range |
|--------|--------|-------|
| CIB History | 30% | 0-300 |
| Income Stability | 25% | 0-250 |
| Employment Type | 15% | 0-150 |
| Age | 10% | 0-100 |
| Location | 10% | 0-100 |
| Existing Relationship | 10% | 0-100 |

## Implementation

```java
@Service
@RequiredArgsConstructor
public class CreditScoringService {
    
    private final CibService cibService;
    private final LoanRepository loanRepository;
    
    public CreditScore calculateScore(Long clientId) {
        Client client = clientRepository.findById(clientId).orElseThrow();
        
        // CIB Score
        int cibScore = calculateCibScore(client.getNidNumber());
        
        // Income Score
        int incomeScore = calculateIncomeScore(client.getAnnualIncome());
        
        // Employment Score
        int employmentScore = calculateEmploymentScore(client.getEmploymentType());
        
        // Calculate total
        int totalScore = (cibScore * 30 + incomeScore * 25 + employmentScore * 15) / 70;
        
        return CreditScore.builder()
            .clientId(clientId)
            .score(totalScore)
            .grade(determineGrade(totalScore))
            .build();
    }
    
    private String determineGrade(int score) {
        if (score >= 800) return "A";
        if (score >= 700) return "B";
        if (score >= 600) return "C";
        if (score >= 500) return "D";
        return "E";
    }
}
```

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

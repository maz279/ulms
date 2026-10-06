**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Interest Suspense Accounting |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Technical Lead |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# Interest Suspense Accounting

## Rules

| Classification | Interest Treatment |
|----------------|-------------------|
| STD, SMA | Normal accrual to Income |
| SS, DF, BL | Suspend - move to Suspense Account |

## Implementation

```java
@Service
@RequiredArgsConstructor
public class InterestSuspenseService {
    
    private final LoanRepository loanRepository;
    private final JournalEntryService journalService;
    
    @Scheduled(cron = "0 0 3 * * ?", zone = "Asia/Dhaka")
    public void processInterestSuspense() {
        List<Loan> classifiedLoans = loanRepository
            .findByClassificationIn(List.of(SS, DF, BL));
        
        for (Loan loan : classifiedLoans) {
            BigDecimal accruedInterest = calculateAccruedInterest(loan);
            
            // Move interest from Income to Suspense
            journalService.createEntry(
                loan.getOfficeId(),
                "41001",  // Interest Income (Debit - reduce)
                "41002",  // Interest Suspense (Credit - increase)
                accruedInterest,
                "Interest suspended for " + loan.getAccountNumber()
            );
        }
    }
}
```

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

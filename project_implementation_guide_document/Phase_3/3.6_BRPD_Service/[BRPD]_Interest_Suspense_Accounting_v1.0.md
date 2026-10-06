**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Interest Suspense Accounting |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Unisoft Technical Team |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# Interest Suspense Accounting

## 1. Overview

Per BRPD Circular 15/2024, interest accrual must be suspended for loans classified as Substandard (SS), Doubtful (DF), or Bad/Loss (B/L).

## 2. Suspense Logic

### 2.1 When to Suspend

| Classification | Interest Action |
|----------------|-----------------|
| STD-0, STD-1, STD-2 | Accrue normally |
| SMA | Accrue normally |
| SS | Suspend accrual to P&L, track in memorandum |
| DF | Suspend accrual |
| B/L | Suspend accrual, write off interest |

### 2.2 Implementation

```java
@Service
@RequiredArgsConstructor
public class InterestSuspenseService {
    
    private final LoanRepository loanRepository;
    private final GlEntryService glEntryService;
    
    /**
     * Process interest accrual with suspense logic
     */
    @Transactional
    public InterestAccrualResult accrueInterest(Long loanId, 
            LocalDate accrualDate) {
        
        Loan loan = loanRepository.findById(loanId)
            .orElseThrow(() -> new LoanNotFoundException(loanId));
        
        BigDecimal interestAmount = calculateInterest(loan, accrualDate);
        
        if (shouldSuspendInterest(loan.getClassificationStage())) {
            return processSuspendedInterest(loan, interestAmount, accrualDate);
        } else {
            return processNormalInterest(loan, interestAmount, accrualDate);
        }
    }
    
    private boolean shouldSuspendInterest(BrpdClassificationStage stage) {
        return stage == BrpdClassificationStage.SS ||
               stage == BrpdClassificationStage.DF ||
               stage == BrpdClassificationStage.BL;
    }
    
    private InterestAccrualResult processSuspendedInterest(Loan loan, 
            BigDecimal interestAmount, LocalDate accrualDate) {
        
        // Don't recognize in P&L
        // Track in suspense/memorandum account
        SuspenseInterestEntry entry = SuspenseInterestEntry.builder()
            .loanId(loan.getId())
            .amount(interestAmount)
            .accrualDate(accrualDate)
            .stage(loan.getClassificationStage())
            .build();
        
        suspenseInterestRepository.save(entry);
        
        // Update loan totals
        loan.addSuspendedInterest(interestAmount);
        loanRepository.save(loan);
        
        return InterestAccrualResult.builder()
            .loanId(loan.getId())
            .amount(interestAmount)
            .suspended(true)
            .build();
    }
    
    private InterestAccrualResult processNormalInterest(Loan loan, 
            BigDecimal interestAmount, LocalDate accrualDate) {
        
        // Normal GL entries
        glEntryService.createInterestAccrualEntry(loan, interestAmount, accrualDate);
        
        // Update loan
        loan.addAccruedInterest(interestAmount);
        loanRepository.save(loan);
        
        return InterestAccrualResult.builder()
            .loanId(loan.getId())
            .amount(interestAmount)
            .suspended(false)
            .build();
    }
}
```

## 3. GL Entries

### 3.1 Normal Interest Accrual (STD/SMA)

```
Dr. Interest Receivable (Asset)    XXX
    Cr. Interest Income (Income)        XXX
```

### 3.2 Suspended Interest Accrual (SS/DF/B/L)

```
Dr. Suspense Interest (Memorandum) XXX
    (No credit to P&L)
```

### 3.3 Interest Reversal (when loan improves)

When SS loan becomes STD:

```
Dr. Interest Receivable            XXX
    Cr. Suspense Interest Reversal      XXX
```

## 4. Reporting

### 4.1 Suspended Interest Report

```java
@Service
public class SuspendedInterestReportService {
    
    public SuspendedInterestReport generateReport(LocalDate reportDate) {
        List<Loan> suspendedLoans = loanRepository
            .findByClassificationStageIn(List.of(SS, DF, BL));
        
        BigDecimal totalSuspended = suspendedLoans.stream()
            .map(Loan::getSuspendedInterestAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        return SuspendedInterestReport.builder()
            .reportDate(reportDate)
            .totalSuspendedInterest(totalSuspended)
            .loanCount(suspendedLoans.size())
            .breakdownByStage(groupByStage(suspendedLoans))
            .build();
    }
}
```

---

## Appendices

### A.1 Suspense Account Structure

| Account | Type | Purpose |
|---------|------|---------|
| 1-10003 | Memorandum | Suspended interest tracking |
| 1-10004 | Memorandum | Suspended interest - SS |
| 1-10005 | Memorandum | Suspended interest - DF |
| 1-10006 | Memorandum | Suspended interest - B/L |

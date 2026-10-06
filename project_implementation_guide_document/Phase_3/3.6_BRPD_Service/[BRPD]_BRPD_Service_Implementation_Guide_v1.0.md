**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | BRPD Service Implementation Guide |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Unisoft Technical Team |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# BRPD Service Implementation Guide

## 1. Configuration

```yaml
ulms:
  brpd:
    classification:
      cron: "0 0 23 * * ?"  # Daily at 23:00
      cutoff-time: "23:00"
      batch-size: 1000
    provisioning:
      general-rate: 0.01
      sma-rate: 0.05
      ss-rate: 0.20
      df-rate: 0.50
      bl-rate: 1.00
    interest-suspension:
      stages: [SS, DF, BL]
    reporting:
      monthly-cron: "0 0 2 5 * ?"  # 5th of month at 02:00
```

## 2. Implementation

### 2.1 Classification Service

```java
@Service
@RequiredArgsConstructor
public class BrpdServiceImpl implements BrpdService {
    
    private final LoanRepository loanRepository;
    private final ClassificationRepository classificationRepository;
    private final ProvisionRepository provisionRepository;
    private final AccountingService accountingService;
    
    @Override
    @Transactional
    public ClassificationResult classifyLoan(Long loanId, LocalDate date) {
        Loan loan = loanRepository.findById(loanId)
            .orElseThrow(() -> new LoanNotFoundException(loanId));
        
        // Calculate DPD
        int dpd = calculateDpd(loan, date);
        
        // Determine classification
        BrpdClassificationStage newStage = BrpdClassificationStage.fromDpd(dpd);
        BrpdClassificationStage currentStage = loan.getClassificationStage();
        
        // Check if changed
        if (newStage != currentStage) {
            // Save classification change
            ClassificationHistory history = ClassificationHistory.builder()
                .loanId(loanId)
                .previousStage(currentStage)
                .currentStage(newStage)
                .daysPastDue(dpd)
                .classificationDate(date)
                .outstandingPrincipal(loan.getOutstandingPrincipal())
                .build();
            
            classificationRepository.save(history);
            
            // Update loan
            loan.setClassificationStage(newStage);
            loan.setClassificationDate(date);
            loan.setDaysPastDue(dpd);
            loanRepository.save(loan);
            
            // Calculate and apply provision
            calculateAndApplyProvision(loan, newStage, date);
            
            // Handle interest suspension
            if (requiresInterestSuspension(newStage)) {
                suspendInterestAccrual(loan, date);
            }
            
            // Generate GL entries
            createClassificationGlEntries(loan, currentStage, newStage, date);
            
            // Send notification
            notificationService.notifyClassificationChange(loan, newStage);
        }
        
        return ClassificationResult.builder()
            .loanId(loanId)
            .stage(newStage)
            .daysPastDue(dpd)
            .changed(newStage != currentStage)
            .build();
    }
    
    private int calculateDpd(Loan loan, LocalDate date) {
        if (loan.getLastPaymentDate() == null) {
            return (int) ChronoUnit.DAYS.between(loan.getFirstInstallmentDate(), date);
        }
        
        LocalDate dueDate = loan.getNextDueDate();
        if (date.isBefore(dueDate) || date.isEqual(dueDate)) {
            return 0;
        }
        
        return (int) ChronoUnit.DAYS.between(dueDate, date);
    }
    
    private boolean requiresInterestSuspension(BrpdClassificationStage stage) {
        return stage == BrpdClassificationStage.SS ||
               stage == BrpdClassificationStage.DF ||
               stage == BrpdClassificationStage.BL;
    }
}
```

### 2.2 Batch Classification Job

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class DailyClassificationJob {
    
    private final BrpdService brpdService;
    private final LoanRepository loanRepository;
    
    @Scheduled(cron = "${ulms.brpd.classification.cron}")
    public void execute() {
        LocalDate today = LocalDate.now();
        log.info("Starting daily classification for {}", today);
        
        Pageable pageable = PageRequest.of(0, 1000);
        Page<Loan> page;
        
        int totalClassified = 0;
        int totalChanged = 0;
        
        do {
            page = loanRepository.findActiveLoans(pageable);
            
            for (Loan loan : page.getContent()) {
                try {
                    ClassificationResult result = brpdService
                        .classifyLoan(loan.getId(), today);
                    
                    totalClassified++;
                    if (result.isChanged()) {
                        totalChanged++;
                    }
                    
                } catch (Exception e) {
                    log.error("Classification failed for loan {}", loan.getId(), e);
                }
            }
            
            pageable = page.nextPageable();
        } while (page.hasNext());
        
        log.info("Classification completed: {} loans processed, {} changed",
            totalClassified, totalChanged);
    }
}
```

---

## Appendices

### A.1 GL Entries for Classification Change

STD to SS (20% provision on BDT 100,000):
```
Dr. Provision Expense      20,000
    Cr. Provision for Loan Loss    20,000
```

SS to DF (additional 30% provision):
```
Dr. Provision Expense      30,000
    Cr. Provision for Loan Loss    30,000
```

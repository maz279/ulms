**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | BRPD Service Implementation Guide |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Technical Lead |
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
      cron: "0 0 1 * * ?"  # Daily at 1 AM
      batch-size: 1000
    provisioning:
      rates:
        STD: 1.0
        SMA: 5.0
        SS: 20.0
        DF: 50.0
        BL: 100.0
```

## 2. Classification Service

```java
@Service
@RequiredArgsConstructor
public class BrpdClassificationService {
    
    private final LoanRepository loanRepository;
    private final ClassificationRepository classificationRepository;
    private final DpdCalculationService dpdService;
    
    @Transactional
    public ClassificationResult classifyLoan(Long loanId, LocalDate asOfDate) {
        Loan loan = loanRepository.findById(loanId)
            .orElseThrow(() -> new LoanNotFoundException(loanId));
        
        // Calculate DPD
        int dpd = dpdService.calculateDPD(loan, asOfDate);
        
        // Determine classification
        BrpdClassification classification = determineClassification(dpd);
        
        // Calculate provision
        BigDecimal provision = calculateProvision(loan, classification);
        
        // Save classification
        LoanClassification entity = LoanClassification.builder()
            .loanId(loanId)
            .classification(classification)
            .daysPastDue(dpd)
            .effectiveDate(asOfDate)
            .outstandingAmount(loan.getOutstandingAmount())
            .provisionRequired(provision)
            .provisionRate(getProvisionRate(classification))
            .build();
        
        classificationRepository.save(entity);
        
        return ClassificationResult.builder()
            .loanId(loanId)
            .classification(classification)
            .dpd(dpd)
            .provisionRequired(provision)
            .build();
    }
    
    private BrpdClassification determineClassification(int dpd) {
        if (dpd == 0) return BrpdClassification.STD_0;
        if (dpd <= 30) return BrpdClassification.STD_1;
        if (dpd <= 60) return BrpdClassification.STD_2;
        if (dpd <= 90) return BrpdClassification.SMA;
        if (dpd <= 180) return BrpdClassification.SS;
        if (dpd <= 365) return BrpdClassification.DF;
        return BrpdClassification.BL;
    }
}
```

## 3. DPD Calculation

```java
@Service
public class DpdCalculationService {
    
    public int calculateDPD(Loan loan, LocalDate asOfDate) {
        // Find oldest unpaid installment
        return loan.getRepaymentSchedule().stream()
            .filter(i -> !i.isFullyPaid())
            .map(Installment::getDueDate)
            .min(Comparator.naturalOrder())
            .map(oldestDue -> (int) ChronoUnit.DAYS.between(oldestDue, asOfDate))
            .orElse(0);
    }
}
```

## 4. Scheduled Job

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class DailyClassificationJob {
    
    private final BrpdClassificationService classificationService;
    
    @Scheduled(cron = "${ulms.brpd.classification.cron}", zone = "Asia/Dhaka")
    public void runDailyClassification() {
        log.info("Starting daily BRPD classification");
        
        LocalDate today = LocalDate.now();
        List<Long> activeLoans = loanRepository.findActiveLoanIds();
        
        for (Long loanId : activeLoans) {
            try {
                classificationService.classifyLoan(loanId, today);
            } catch (Exception e) {
                log.error("Failed to classify loan {}", loanId, e);
            }
        }
        
        log.info("Daily classification completed for {} loans", activeLoans.size());
    }
}
```

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

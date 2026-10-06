**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | BRPD Reports Generation |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Unisoft Technical Team |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# BRPD Reports Generation

## 1. Report Types

### 1.1 Scheduled Items Report (Monthly)
- Submitted to Bangladesh Bank by 5th of each month
- Contains all loan classifications and provisions

### 1.2 Daily Position Report
- Internal monitoring report
- Shows portfolio quality metrics

### 1.3 NPL (Non-Performing Loan) Report
- Tracks SMA, SS, DF, B/L loans
- Recovery tracking

## 2. Scheduled Items Report

### 2.1 Report Structure

| Section | Content |
|---------|---------|
| 1 | Summary by classification |
| 2 | Loan details by category |
| 3 | Provision summary |
| 4 | Movement analysis |
| 5 | Large exposures |

### 2.2 Implementation

```java
@Service
@RequiredArgsConstructor
public class ScheduledItemsReportService {
    
    private final LoanRepository loanRepository;
    private final ClassificationRepository classificationRepository;
    
    public ScheduledItemsReport generateReport(LocalDate reportDate) {
        ScheduledItemsReport report = new ScheduledItemsReport();
        report.setReportDate(reportDate);
        report.setGeneratedAt(LocalDateTime.now());
        
        // Section 1: Summary by classification
        Map<BrpdClassificationStage, ClassificationSummary> summary = 
            new EnumMap<>(BrpdClassificationStage.class);
        
        for (BrpdClassificationStage stage : BrpdClassificationStage.values()) {
            List<Loan> loans = loanRepository.findByClassificationStage(stage);
            
            ClassificationSummary stageSummary = ClassificationSummary.builder()
                .stage(stage)
                .loanCount(loans.size())
                .totalOutstanding(calculateTotalOutstanding(loans))
                .totalProvision(calculateTotalProvision(loans))
                .build();
            
            summary.put(stage, stageSummary);
        }
        
        report.setClassificationSummary(summary);
        
        // Section 2: Loan details
        List<LoanDetail> loanDetails = loanRepository.findActiveLoansForReporting(reportDate)
            .stream()
            .map(this::mapToLoanDetail)
            .collect(Collectors.toList());
        
        report.setLoanDetails(loanDetails);
        
        // Section 3: Movement analysis
        report.setMovementAnalysis(generateMovementAnalysis(reportDate));
        
        return report;
    }
    
    public byte[] generateExcelReport(ScheduledItemsReport report) {
        try (Workbook workbook = new XSSFWorkbook()) {
            // Summary sheet
            Sheet summarySheet = workbook.createSheet("Summary");
            createSummarySection(summarySheet, report.getClassificationSummary());
            
            // Details sheet
            Sheet detailsSheet = workbook.createSheet("Loan Details");
            createDetailsSection(detailsSheet, report.getLoanDetails());
            
            // Movement sheet
            Sheet movementSheet = workbook.createSheet("Movement");
            createMovementSection(movementSheet, report.getMovementAnalysis());
            
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            workbook.write(output);
            return output.toByteArray();
            
        } catch (IOException e) {
            throw new ReportGenerationException("Failed to generate Excel", e);
        }
    }
    
    private void createSummarySection(Sheet sheet, 
            Map<BrpdClassificationStage, ClassificationSummary> summary) {
        
        Row header = sheet.createRow(0);
        header.createCell(0).setCellValue("Classification");
        header.createCell(1).setCellValue("Count");
        header.createCell(2).setCellValue("Outstanding (BDT)");
        header.createCell(3).setCellValue("Provision (BDT)");
        header.createCell(4).setCellValue("Provision %");
        
        int rowNum = 1;
        BigDecimal totalOutstanding = BigDecimal.ZERO;
        BigDecimal totalProvision = BigDecimal.ZERO;
        
        for (Map.Entry<BrpdClassificationStage, ClassificationSummary> entry : 
                summary.entrySet()) {
            Row row = sheet.createRow(rowNum++);
            ClassificationSummary cs = entry.getValue();
            
            row.createCell(0).setCellValue(entry.getKey().getCode());
            row.createCell(1).setCellValue(cs.getLoanCount());
            row.createCell(2).setCellValue(cs.getTotalOutstanding().doubleValue());
            row.createCell(3).setCellValue(cs.getTotalProvision().doubleValue());
            row.createCell(4).setCellValue(
                entry.getKey().getProvisionRate().multiply(new BigDecimal("100"))
                    .doubleValue());
            
            totalOutstanding = totalOutstanding.add(cs.getTotalOutstanding());
            totalProvision = totalProvision.add(cs.getTotalProvision());
        }
        
        // Total row
        Row totalRow = sheet.createRow(rowNum);
        totalRow.createCell(0).setCellValue("TOTAL");
        totalRow.createCell(2).setCellValue(totalOutstanding.doubleValue());
        totalRow.createCell(3).setCellValue(totalProvision.doubleValue());
    }
}
```

## 3. Report Scheduling

```java
@Component
@RequiredArgsConstructor
public class BrpdReportScheduler {
    
    private final ScheduledItemsReportService reportService;
    private final BangladeshBankUploadService uploadService;
    
    /**
     * Generate and submit monthly scheduled items report
     */
    @Scheduled(cron = "0 0 2 5 * ?")  // 5th of each month at 02:00
    public void generateMonthlyReport() {
        LocalDate reportDate = LocalDate.now().minusMonths(1).withDayOfMonth(1);
        
        log.info("Generating scheduled items report for {}", reportDate);
        
        ScheduledItemsReport report = reportService.generateReport(reportDate);
        byte[] excelReport = reportService.generateExcelReport(report);
        
        // Save locally
        reportService.saveReport(reportDate, excelReport);
        
        // Upload to Bangladesh Bank
        uploadService.uploadScheduledItems(reportDate, excelReport);
        
        // Notify stakeholders
        notificationService.sendReportGenerated(reportDate, report);
    }
}
```

---

## Appendices

### A.1 Report Submission Timeline

| Report Type | Due Date | Format |
|-------------|----------|--------|
| Scheduled Items | 5th of month | Excel + PDF |
| Large Loans | 10th of month | Excel |
| NPL Summary | 15th of month | PDF |
| Provision Summary | Monthly | Excel |

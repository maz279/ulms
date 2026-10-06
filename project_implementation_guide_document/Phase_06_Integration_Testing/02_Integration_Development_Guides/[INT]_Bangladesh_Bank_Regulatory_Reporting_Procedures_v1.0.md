**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Bangladesh Bank Regulatory Reporting Procedures |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Compliance Lead, Unisoft Systems Limited |
| **Reviewed By** | Technical Lead |
| **Classification** | Confidential |
| **Status** | Draft |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | Compliance Lead | Initial version |

---

# Bangladesh Bank Regulatory Reporting Procedures

## Table of Contents

1. [Introduction](#1-introduction)
2. [Regulatory Reporting Overview](#2-regulatory-reporting-overview)
3. [Report Types (CL-1 to CL-5)](#3-report-types-cl-1-to-cl-5)
4. [SFTP Integration](#4-sftp-integration)
5. [Report Generation Process](#5-report-generation-process)
6. [Submission Procedures](#6-submission-procedures)
7. [Error Handling](#7-error-handling)
8. [Audit and Compliance](#8-audit-and-compliance)
9. [Implementation Examples](#9-implementation-examples)
10. [Related Documents](#10-related-documents)

---

## 1. Introduction

### 1.1 Purpose

This document defines procedures for generating and submitting regulatory reports to Bangladesh Bank as required under BRPD Circular 15/2024 and other relevant circulars. It covers the CL-1 through CL-5 report series and other mandatory submissions.

### 1.2 Scope

- CL-1 to CL-5 report generation
- SFTP-based submission to Bangladesh Bank
- Error handling and reconciliation
- Audit trail maintenance
- Data validation procedures

### 1.3 Regulatory Framework

| Circular | Description | Effective Date |
|----------|-------------|----------------|
| BRPD Circular 15/2024 | Loan Classification and Provisioning | 2024 |
| BRPD Circular 14/2024 | Large Loan Reporting | 2024 |
| DOS Circular 01/2023 | Stress Testing Requirements | 2023 |
| FID Circular 03/2022 | Foreign Exchange Exposure | 2022 |

---

## 2. Regulatory Reporting Overview

### 2.1 Reporting Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REGULATORY REPORTING ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         ULMS v2.0                                    │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │   │
│   │  │  Report      │  │   Report     │  │   Report Validation      │  │   │
│   │  │  Generator   │──▶│  Formatter   │──▶│   & Sign-off           │  │   │
│   │  │  (Services)  │  │   (BB Format)│  │   (Workflow)             │  │   │
│   │  └──────────────┘  └──────────────┘  └──────────────────────────┘  │   │
│   │         │                                                            │   │
│   │  ┌──────▼──────┐                                                     │   │
│   │  │   Report    │                                                     │   │
│   │  │   Store     │                                                     │   │
│   │  │   (S3/DB)   │                                                     │   │
│   │  └──────┬──────┘                                                     │   │
│   └─────────┼────────────────────────────────────────────────────────────┘   │
│             │                                                                │
│   ┌─────────▼──────────────────────────────────────────────────────────┐     │
│   │                        SFTP UPLOAD SERVICE                          │     │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐    │     │
│   │  │   Encrypt   │  │   Digital   │  │   Upload & Confirm      │    │     │
│   │  │   (PGP)     │──▶│   Sign      │──▶│   to Bangladesh Bank    │    │     │
│   │  └─────────────┘  └─────────────┘  └─────────────────────────┘    │     │
│   └────────────────────────────────────────────────────────────────────┘     │
│                                    │                                         │
│                                    ▼                                         │
│                         ┌─────────────────────┐                             │
│                         │  Bangladesh Bank    │                             │
│                         │  SFTP Server        │                             │
│                         │  (reports.bb.org.bd)│                             │
│                         └─────────────────────┘                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Report Submission Timeline

| Report | Frequency | Submission Date | Data Cutoff |
|--------|-----------|-----------------|-------------|
| CL-1 | Monthly | 7th working day | Month-end |
| CL-2 | Monthly | 7th working day | Month-end |
| CL-3 | Quarterly | 15th working day | Quarter-end |
| CL-4 | Quarterly | 15th working day | Quarter-end |
| CL-5 | Annually | 30th April | Year-end (31 Dec) |
| Large Loan Report | Quarterly | 15th working day | Quarter-end |
| Foreign Currency | Monthly | 5th working day | Month-end |

---

## 3. Report Types (CL-1 to CL-5)

### 3.1 CL-1: Summary Statement of Loans and Advances

#### Purpose
CL-1 provides a summary classification of all loans and advances by category and classification status.

#### Data Structure

```java
@Entity
@Table(name = "cl1_report_data")
public class CL1ReportData {
    
    @Id
    @GeneratedValue
    private Long id;
    
    private String reportingMonth;
    private String bankCode;
    private String branchCode;
    
    // Loan Categories
    private BigDecimal termLoansStandard;
    private BigDecimal termLoansSMA;
    private BigDecimal termLoansSS;
    private BigDecimal termLoansDF;
    private BigDecimal termLoansBL;
    
    private BigDecimal demandLoansStandard;
    private BigDecimal demandLoansSMA;
    private BigDecimal demandLoansSS;
    private BigDecimal demandLoansDF;
    private BigDecimal demandLoansBL;
    
    private BigDecimal continuousLoansStandard;
    private BigDecimal continuousLoansSMA;
    private BigDecimal continuousLoansSS;
    private BigDecimal continuousLoansDF;
    private BigDecimal continuousLoansBL;
    
    // SME Categories
    private BigDecimal smeTermStandard;
    private BigDecimal smeTermSMA;
    private BigDecimal smeTermSS;
    private BigDecimal smeTermDF;
    private BigDecimal smeTermBL;
    
    // Microcredit
    private BigDecimal microcreditStandard;
    private BigDecimal microcreditSMA;
    private BigDecimal microcreditSS;
    private BigDecimal microcreditDF;
    private BigDecimal microcreditBL;
    
    // Agricultural
    private BigDecimal agriculturalShortTermStandard;
    private BigDecimal agriculturalShortTermSMA;
    private BigDecimal agriculturalShortTermSS;
    private BigDecimal agriculturalShortTermDF;
    private BigDecimal agriculturalShortTermBL;
    
    // Grand Totals
    private BigDecimal totalStandard;
    private BigDecimal totalSMA;
    private BigDecimal totalSS;
    private BigDecimal totalDF;
    private BigDecimal totalBL;
    private BigDecimal grandTotal;
    
    // Provisions
    private BigDecimal provisionStandard;
    private BigDecimal provisionSMA;
    private BigDecimal provisionSS;
    private BigDecimal provisionDF;
    private BigDecimal provisionBL;
    private BigDecimal totalProvision;
    
    // Metadata
    private LocalDateTime generatedAt;
    private String generatedBy;
    private ReportStatus status;
}
```

#### Report Generation Query

```sql
-- CL-1 Report Generation Query
WITH loan_classifications AS (
    SELECT 
        l.loan_type,
        l.classification,
        SUM(l.outstanding_principal) as amount,
        SUM(l.outstanding_principal * p.provision_rate / 100) as provision
    FROM loans l
    JOIN provision_rates p ON l.classification = p.classification
    WHERE l.reporting_date = :reportingDate
      AND l.status IN ('ACTIVE', 'DISBURSED')
    GROUP BY l.loan_type, l.classification
)
SELECT 
    loan_type,
    SUM(CASE WHEN classification = 'STD-0' THEN amount ELSE 0 END) as standard,
    SUM(CASE WHEN classification = 'SMA' THEN amount ELSE 0 END) as sma,
    SUM(CASE WHEN classification = 'SS' THEN amount ELSE 0 END) as ss,
    SUM(CASE WHEN classification = 'DF' THEN amount ELSE 0 END) as df,
    SUM(CASE WHEN classification = 'BL' THEN amount ELSE 0 END) as bl,
    SUM(provision) as total_provision
FROM loan_classifications
GROUP BY loan_type;
```

### 3.2 CL-2: Particulars of Classified Loans

#### Purpose
CL-2 provides detailed information on classified loans (SS, DF, BL) including borrower details, collateral, and provision calculations.

#### Data Structure

```java
@Entity
@Table(name = "cl2_report_data")
public class CL2ReportData {
    
    @Id
    private String reportId;
    
    // Borrower Information
    private String borrowerName;
    private String nidNumber;
    private String businessAddress;
    private String businessNature;
    
    // Facility Details
    private String facilityType;
    private BigDecimal sanctionedLimit;
    private LocalDate sanctionDate;
    private LocalDate expiryDate;
    private BigDecimal outstandingAmount;
    private BigDecimal overdueAmount;
    private Integer daysPastDue;
    
    // Classification
    private String classification;
    private LocalDate classificationDate;
    private String classificationReason;
    
    // Collateral Details
    private String collateralType;
    private BigDecimal collateralValue;
    private String collateralDescription;
    
    // Security Details
    private BigDecimal cashSecurity;
    private BigDecimal immovableProperty;
    private BigDecimal movableAssets;
    private BigDecimal guarantees;
    private BigDecimal totalSecurity;
    
    // Financial Information
    private BigDecimal totalLiabilities;
    private BigDecimal totalAssets;
    private BigDecimal annualTurnover;
    
    // Provision
    private BigDecimal requiredProvision;
    private BigDecimal maintainedProvision;
    private BigDecimal shortfallSurplus;
    
    // Recovery
    private BigDecimal recoveryDuringPeriod;
    private BigDecimal writeOffDuringPeriod;
    
    // Legal Action
    private Boolean legalActionInitiated;
    private LocalDate legalActionDate;
    private String courtReference;
}
```

### 3.3 CL-3: Statement of Write-off

#### Purpose
CL-3 reports all loan write-offs during the reporting period.

```java
@Entity
@Table(name = "cl3_report_data")
public class CL3ReportData {
    
    private String reportingPeriod;
    private String borrowerName;
    private String nidNumber;
    private String facilityType;
    
    private BigDecimal principalWrittenOff;
    private BigDecimal interestWrittenOff;
    private BigDecimal totalWrittenOff;
    
    private LocalDate writeOffDate;
    private String writeOffAuthority;
    private String writeOffReason;
    
    private BigDecimal recoveryAfterWriteOff;
    private BigDecimal outstandingAfterRecovery;
}
```

### 3.4 CL-4: Statement of Rescheduled/Restructured Loans

#### Purpose
CL-4 reports all loans that were rescheduled or restructured during the period.

```java
@Entity
@Table(name = "cl4_report_data")
public class CL4ReportData {
    
    private String reportingPeriod;
    private String borrowerName;
    private String facilityType;
    
    private BigDecimal originalOutstanding;
    private LocalDate originalMaturityDate;
    private String originalClassification;
    
    private String reschedulingType; // RESCHEDULED, RESTRUCTURED, BOTH
    private LocalDate reschedulingDate;
    private BigDecimal rescheduledAmount;
    private LocalDate newMaturityDate;
    private String newRepaymentTerms;
    
    private String reschedulingReason;
    private String approvalAuthority;
    private String downPaymentReceived;
}
```

### 3.5 CL-5: Annual Statement of Loans and Advances

#### Purpose
CL-5 is the comprehensive annual report consolidating all loan information.

---

## 4. SFTP Integration

### 4.1 SFTP Configuration

```yaml
# application-reporting.yml
bangladesh-bank:
  sftp:
    host: reports.bb.org.bd
    port: 22
    username: ${BB_SFTP_USERNAME}
    private-key-path: ${BB_SFTP_KEY_PATH}
    known-hosts-path: ${BB_SFTP_KNOWN_HOSTS}
    
    # Connection settings
    connection-timeout: 30000
    session-timeout: 60000
    
    # Upload settings
    remote-directory: /incoming/reports
    temp-directory: /incoming/temp
    
    # Retry settings
    max-retries: 3
    retry-interval: 60000
```

### 4.2 SFTP Service Implementation

```java
@Component
public class BangladeshBankSFTPService {
    
    @Value("${bangladesh-bank.sftp.host}")
    private String host;
    
    @Value("${bangladesh-bank.sftp.port}")
    private int port;
    
    @Value("${bangladesh-bank.sftp.username}")
    private String username;
    
    @Value("${bangladesh-bank.sftp.private-key-path}")
    private String privateKeyPath;
    
    @Value("${bangladesh-bank.sftp.known-hosts-path}")
    private String knownHostsPath;
    
    /**
     * Upload report to Bangladesh Bank SFTP
     */
    public SFTPUploadResult uploadReport(ReportFile reportFile) {
        JSch jsch = new JSch();
        Session session = null;
        ChannelSftp channel = null;
        
        try {
            // Load private key
            jsch.addIdentity(privateKeyPath);
            jsch.setKnownHosts(knownHostsPath);
            
            // Create session
            session = jsch.getSession(username, host, port);
            session.connect(30000);
            
            // Open SFTP channel
            channel = (ChannelSftp) session.openChannel("sftp");
            channel.connect();
            
            // Generate remote filename
            String remoteFileName = generateRemoteFilename(reportFile);
            String tempPath = "/incoming/temp/" + remoteFileName;
            String finalPath = "/incoming/reports/" + remoteFileName;
            
            // Upload to temp location
            try (InputStream is = new FileInputStream(reportFile.getFile())) {
                channel.put(is, tempPath);
            }
            
            // Verify upload
            SftpATTRS attrs = channel.stat(tempPath);
            if (attrs.getSize() != reportFile.getFile().length()) {
                throw new SFTPException("Upload verification failed - size mismatch");
            }
            
            // Move to final location
            channel.rename(tempPath, finalPath);
            
            // Generate acknowledgment
            String acknowledgment = generateAcknowledgment(channel, finalPath);
            
            return SFTPUploadResult.builder()
                .success(true)
                .remotePath(finalPath)
                .acknowledgment(acknowledgment)
                .uploadTime(Instant.now())
                .build();
                
        } catch (Exception e) {
            log.error("SFTP upload failed", e);
            return SFTPUploadResult.builder()
                .success(false)
                .errorMessage(e.getMessage())
                .build();
        } finally {
            if (channel != null) channel.disconnect();
            if (session != null) session.disconnect();
        }
    }
    
    private String generateRemoteFilename(ReportFile reportFile) {
        // Format: BANKCODE_REPORTTYPE_YYYYMM_SEQ.DAT
        // Example: 0001_CL1_202401_001.DAT
        return String.format("%s_%s_%s_%03d.DAT",
            reportFile.getBankCode(),
            reportFile.getReportType(),
            reportFile.getReportingPeriod(),
            reportFile.getSequenceNumber()
        );
    }
}
```

---

## 5. Report Generation Process

### 5.1 Report Generation Service

```java
@Service
@Slf4j
public class RegulatoryReportService {
    
    @Autowired
    private CL1ReportGenerator cl1Generator;
    
    @Autowired
    private CL2ReportGenerator cl2Generator;
    
    @Autowired
    private ReportFormatter reportFormatter;
    
    @Autowired
    private DigitalSignatureService signatureService;
    
    @Autowired
    private ReportRepository reportRepository;
    
    /**
     * Generate monthly CL-1 report
     */
    @Transactional
    public ReportGenerationResult generateCL1(YearMonth reportingMonth) {
        log.info("Generating CL-1 report for {}", reportingMonth);
        
        try {
            // Step 1: Extract data
            CL1ReportData data = cl1Generator.extractData(reportingMonth);
            
            // Step 2: Validate data
            List<ValidationError> errors = validateCL1Data(data);
            if (!errors.isEmpty()) {
                return ReportGenerationResult.builder()
                    .success(false)
                    .errors(errors)
                    .build();
            }
            
            // Step 3: Format report
            String formattedReport = reportFormatter.formatCL1(data);
            
            // Step 4: Apply digital signature
            String signedReport = signatureService.sign(formattedReport);
            
            // Step 5: Store report
            ReportFile reportFile = storeReport("CL1", reportingMonth, signedReport);
            
            // Step 6: Update status
            reportRepository.save(ReportRecord.builder()
                .reportType("CL1")
                .reportingPeriod(reportingMonth.toString())
                .filePath(reportFile.getPath())
                .status(ReportStatus.GENERATED)
                .generatedAt(LocalDateTime.now())
                .build());
            
            return ReportGenerationResult.builder()
                .success(true)
                .reportFile(reportFile)
                .build();
                
        } catch (Exception e) {
            log.error("CL-1 generation failed", e);
            return ReportGenerationResult.builder()
                .success(false)
                .errorMessage(e.getMessage())
                .build();
        }
    }
    
    private List<ValidationError> validateCL1Data(CL1ReportData data) {
        List<ValidationError> errors = new ArrayList<>();
        
        // Check totals
        BigDecimal calculatedTotal = data.getTotalStandard()
            .add(data.getTotalSMA())
            .add(data.getTotalSS())
            .add(data.getTotalDF())
            .add(data.getTotalBL());
        
        if (calculatedTotal.compareTo(data.getGrandTotal()) != 0) {
            errors.add(new ValidationError("Grand total mismatch", 
                "Calculated: " + calculatedTotal + ", Reported: " + data.getGrandTotal()));
        }
        
        // Check provision calculations
        // ...
        
        return errors;
    }
}
```

### 5.2 Report Formatting

```java
@Component
public class BangladeshBankReportFormatter {
    
    /**
     * Format CL-1 report in Bangladesh Bank format
     */
    public String formatCL1(CL1ReportData data) {
        StringBuilder sb = new StringBuilder();
        
        // Header record
        sb.append("01"); // Record type
        sb.append(StringUtils.rightPad(data.getBankCode(), 4));
        sb.append(data.getReportingMonth());
        sb.append("CL1");
        sb.append(LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE));
        sb.append("\n");
        
        // Term loans
        appendCategory(sb, "TERM", data);
        
        // Demand loans
        appendCategory(sb, "DEMAND", data);
        
        // Continuous loans
        appendCategory(sb, "CONTINUOUS", data);
        
        // SME loans
        appendSMECategory(sb, data);
        
        // Microcredit
        appendMicrocreditCategory(sb, data);
        
        // Agricultural loans
        appendAgriculturalCategory(sb, data);
        
        // Trailer record
        sb.append("99"); // Record type
        sb.append(String.format("%018.2f", data.getGrandTotal()));
        sb.append(String.format("%018.2f", data.getTotalProvision()));
        
        return sb.toString();
    }
    
    private void appendCategory(StringBuilder sb, String category, CL1ReportData data) {
        sb.append("02"); // Detail record
        sb.append(StringUtils.rightPad(category, 15));
        sb.append(formatAmount(data.getTermLoansStandard()));
        sb.append(formatAmount(data.getTermLoansSMA()));
        sb.append(formatAmount(data.getTermLoansSS()));
        sb.append(formatAmount(data.getTermLoansDF()));
        sb.append(formatAmount(data.getTermLoansBL()));
        sb.append("\n");
    }
    
    private String formatAmount(BigDecimal amount) {
        return String.format("%015.2f", amount != null ? amount : BigDecimal.ZERO);
    }
}
```

---

## 6. Submission Procedures

### 6.1 Submission Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REPORT SUBMISSION WORKFLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│   │ GENERATE │───▶│ VALIDATE │───▶│  REVIEW  │───▶│ APPROVE  │             │
│   │   Report │    │   Data   │    │  (CMU)   │    │  (CEO/   │             │
│   │          │    │          │    │          │    │  Board)  │             │
│   └──────────┘    └──────────┘    └────┬─────┘    └────┬─────┘             │
│                                        │               │                    │
│                                        ▼               ▼                    │
│                                  ┌──────────────────────────┐              │
│                                  │     SUBMIT TO BB         │              │
│                                  │  ┌────────────────────┐  │              │
│                                  │  │  SFTP Upload       │  │              │
│                                  │  │  Get Acknowledgment│  │              │
│                                  │  │  Store Receipt     │  │              │
│                                  │  └────────────────────┘  │              │
│                                  └──────────────────────────┘              │
│                                              │                              │
│                                              ▼                              │
│                                        ┌──────────┐                        │
│                                        │ COMPLETE │                        │
│                                        └──────────┘                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Automated Submission

```java
@Service
@Slf4j
public class ReportSubmissionService {
    
    @Autowired
    private RegulatoryReportService reportService;
    
    @Autowired
    private BangladeshBankSFTPService sftpService;
    
    @Autowired
    private ReportNotificationService notificationService;
    
    /**
     * Submit CL-1 report for given month
     */
    @Transactional
    public SubmissionResult submitCL1(YearMonth reportingMonth) {
        // Step 1: Generate if not exists
        ReportFile reportFile = reportService.getOrGenerateCL1(reportingMonth);
        
        if (reportFile.getStatus() != ReportStatus.APPROVED) {
            return SubmissionResult.builder()
                .success(false)
                .errorMessage("Report not approved for submission")
                .build();
        }
        
        // Step 2: Encrypt
        File encryptedFile = encryptReport(reportFile);
        
        // Step 3: Upload via SFTP
        SFTPUploadResult uploadResult = sftpService.uploadReport(
            ReportFile.builder()
                .file(encryptedFile)
                .reportType("CL1")
                .reportingPeriod(reportingMonth.toString())
                .bankCode(reportFile.getBankCode())
                .build()
        );
        
        if (!uploadResult.isSuccess()) {
            // Queue for retry
            queueForRetry(reportFile);
            return SubmissionResult.builder()
                .success(false)
                .errorMessage(uploadResult.getErrorMessage())
                .build();
        }
        
        // Step 4: Update status
        reportService.updateStatus(reportFile.getId(), ReportStatus.SUBMITTED);
        
        // Step 5: Store acknowledgment
        storeAcknowledgment(reportFile, uploadResult.getAcknowledgment());
        
        // Step 6: Notify stakeholders
        notificationService.sendSubmissionNotification(reportFile);
        
        return SubmissionResult.builder()
            .success(true)
            .acknowledgment(uploadResult.getAcknowledgment())
            .submissionTime(Instant.now())
            .build();
    }
    
    /**
     * Scheduled submission job
     */
    @Scheduled(cron = "0 0 2 7 * *") // 7th of every month at 2 AM
    public void scheduledCL1Submission() {
        YearMonth lastMonth = YearMonth.now().minusMonths(1);
        log.info("Starting scheduled CL-1 submission for {}", lastMonth);
        
        SubmissionResult result = submitCL1(lastMonth);
        
        if (!result.isSuccess()) {
            alertService.sendCriticalAlert("CL-1 Submission Failed", result.getErrorMessage());
        }
    }
}
```

---

## 7. Error Handling

### 7.1 Error Types and Resolution

| Error Code | Description | Resolution |
|------------|-------------|------------|
| RPT-001 | Data validation failed | Review and correct data |
| RPT-002 | Total mismatch | Check aggregation logic |
| RPT-003 | SFTP connection failed | Retry, escalate if persistent |
| RPT-004 | Authentication failed | Check certificates |
| RPT-005 | File format rejected | Verify Bangladesh Bank format |
| RPT-006 | Late submission | Escalate to compliance officer |

### 7.2 Retry Mechanism

```java
@Component
public class ReportRetryService {
    
    @Scheduled(fixedDelay = 300000) // Every 5 minutes
    public void processFailedSubmissions() {
        List<ReportRecord> failedReports = reportRepository
            .findByStatusAndRetryCountLessThan(ReportStatus.FAILED, 3);
        
        for (ReportRecord report : failedReports) {
            try {
                SubmissionResult result = submissionService.retrySubmission(report);
                
                if (result.isSuccess()) {
                    report.setStatus(ReportStatus.SUBMITTED);
                } else {
                    report.incrementRetryCount();
                }
                
                reportRepository.save(report);
                
            } catch (Exception e) {
                log.error("Retry failed for report: {}", report.getId(), e);
                
                if (report.getRetryCount() >= 3) {
                    alertService.sendAlert("Max retries exceeded", report);
                }
            }
        }
    }
}
```

---

## 8. Audit and Compliance

### 8.1 Audit Requirements

| Action | Retention Period | Format |
|--------|------------------|--------|
| Report generation | 7 years | Database + Files |
| Data changes | 7 years | Audit log |
| Submissions | 7 years | Signed receipts |
| Access logs | 3 years | System logs |

### 8.2 Audit Trail Implementation

```java
@Entity
@Table(name = "regulatory_report_audit")
public class RegulatoryReportAudit {
    
    @Id
    @GeneratedValue
    private Long id;
    
    private String reportType;
    private String reportingPeriod;
    private String action; // GENERATED, VALIDATED, APPROVED, SUBMITTED
    
    private String performedBy;
    private String userRole;
    private LocalDateTime timestamp;
    
    private String ipAddress;
    private String details;
    
    @Column(columnDefinition = "TEXT")
    private String dataSnapshot; // JSON snapshot of report data
}
```

---

## 9. Implementation Examples

### 9.1 Complete Report Submission

```java
@RestController
@RequestMapping("/api/reports/regulatory")
public class RegulatoryReportController {
    
    @Autowired
    private RegulatoryReportService reportService;
    
    @Autowired
    private ReportSubmissionService submissionService;
    
    @PostMapping("/cl1/generate")
    @PreAuthorize("hasRole('REPORT_GENERATOR')")
    public ResponseEntity<ReportGenerationResult> generateCL1(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM") YearMonth reportingMonth) {
        
        ReportGenerationResult result = reportService.generateCL1(reportingMonth);
        
        return result.isSuccess() 
            ? ResponseEntity.ok(result)
            : ResponseEntity.badRequest().body(result);
    }
    
    @PostMapping("/cl1/submit")
    @PreAuthorize("hasRole('REPORT_SUBMITTER')")
    public ResponseEntity<SubmissionResult> submitCL1(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM") YearMonth reportingMonth) {
        
        SubmissionResult result = submissionService.submitCL1(reportingMonth);
        
        return result.isSuccess()
            ? ResponseEntity.ok(result)
            : ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
    }
}
```

---

## 10. Related Documents

| Document | Purpose |
|----------|---------|
| `[INT]_CIB_Online_API_Integration_Guide_v1.0.md` | CIB integration details |
| `../Compliance_Validation_Matrix.md` | Compliance requirements |
| `../Business_Requirements_Document_LMS.md` | BRPD compliance |

---

**Document Owner:** Compliance Lead, Unisoft Systems Limited  
**Next Review Date:** 2026-03-05  
**Classification:** Confidential

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

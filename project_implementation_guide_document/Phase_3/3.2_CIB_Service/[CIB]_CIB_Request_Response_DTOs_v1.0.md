**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | CIB Request/Response DTOs |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Unisoft Technical Team |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-08 | Unisoft Team | Initial version |

---

# CIB Request/Response DTOs

## 1. Request DTOs

### 1.1 Individual Inquiry Request

```java
package com.unisoft.ulms.cib.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@Schema(description = "Request for individual CIB inquiry")
public class CibIndividualInquiryRequest {
    
    @Schema(description = "National ID (10-17 digits)", example = "1234567890", required = true)
    @NotBlank(message = "NID is mandatory")
    @Pattern(regexp = "\\d{10,17}", message = "NID must be 10-17 digits")
    private String nid;
    
    @Schema(description = "Full name as per NID", example = "MOHAMMAD ALI", required = true)
    @NotBlank(message = "Name is mandatory")
    @Size(min = 3, max = 100, message = "Name must be 3-100 characters")
    private String name;
    
    @Schema(description = "Father's name", example = "ABDUL KARIM")
    @Size(max = 100, message = "Father's name max 100 characters")
    private String fatherName;
    
    @Schema(description = "Mother's name", example = "AMENA BEGUM")
    @Size(max = 100, message = "Mother's name max 100 characters")
    private String motherName;
    
    @Schema(description = "Date of birth (YYYY-MM-DD)", example = "1990-05-15", required = true)
    @NotBlank(message = "Date of birth is mandatory")
    @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}", message = "Date format: YYYY-MM-DD")
    private String dateOfBirth;
    
    @Schema(description = "Purpose of inquiry", required = true)
    @NotNull(message = "Inquiry purpose is mandatory")
    private InquiryPurpose inquiryPurpose;
    
    @Schema(description = "Internal loan application reference")
    @Size(max = 50, message = "Reference max 50 characters")
    private String loanApplicationReference;
    
    @Schema(description = "Request timestamp", hidden = true)
    @Builder.Default
    private LocalDateTime requestTime = LocalDateTime.now();
}

public enum InquiryPurpose {
    LOAN_APPLICATION("01", "Loan Application"),
    LOAN_REVIEW("02", "Loan Review"),
    CREDIT_LIMIT_ENHANCEMENT("03", "Credit Limit Enhancement"),
    GUARANTOR_CHECK("04", "Guarantor Check"),
    EMPLOYMENT_VERIFICATION("05", "Employment Verification"),
    ANNUAL_REVIEW("06", "Annual Review"),
    OTHERS("99", "Others");
    
    private final String code;
    private final String description;
    
    InquiryPurpose(String code, String description) {
        this.code = code;
        this.description = description;
    }
}
```

### 1.2 Company Inquiry Request

```java
package com.unisoft.ulms.cib.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@Schema(description = "Request for company CIB inquiry")
public class CibCompanyInquiryRequest {
    
    @Schema(description = "Business Identification Number (BIN)", example = "12345678901234567", required = true)
    @NotBlank(message = "BIN is mandatory")
    @Pattern(regexp = "\\d{9,17}", message = "BIN must be 9-17 digits")
    private String bin;
    
    @Schema(description = "Company name as registered", example = "ABC TRADING LIMITED", required = true)
    @NotBlank(message = "Company name is mandatory")
    @Size(min = 3, max = 200, message = "Name must be 3-200 characters")
    private String companyName;
    
    @Schema(description = "Company registration number")
    private String registrationNumber;
    
    @Schema(description = "Inquiry purpose", required = true)
    @NotNull(message = "Inquiry purpose is mandatory")
    private InquiryPurpose inquiryPurpose;
    
    @Schema(description = "List of authorized signatories to check")
    private List<SignatoryInfo> signatories;
}

@Data
@Builder
public class SignatoryInfo {
    
    @Schema(description = "Signatory NID")
    @Pattern(regexp = "\\d{10,17}", message = "Invalid NID format")
    private String nid;
    
    @Schema(description = "Signatory name")
    private String name;
    
    @Schema(description = "Designation")
    private String designation;
}
```

### 1.3 Batch Upload Request

```java
package com.unisoft.ulms.cib.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
@Schema(description = "Batch upload request for CIB monthly reporting")
public class CibBatchUploadRequest {
    
    @Schema(description = "Batch type", example = "MONTHLY")
    @NotNull(message = "Batch type is mandatory")
    private BatchType batchType;
    
    @Schema(description = "Reporting month (YYYY-MM)", example = "2026-01")
    @NotBlank(message = "Reporting month is mandatory")
    @Pattern(regexp = "\\d{4}-\\d{2}", message = "Format: YYYY-MM")
    private String reportingMonth;
    
    @Schema(description = "Financial institution code assigned by BB")
    @NotBlank(message = "Institution code is mandatory")
    private String institutionCode;
    
    @Schema(description = "List of records to upload")
    @NotEmpty(message = "At least one record is required")
    @Size(max = 100000, message = "Maximum 100,000 records per batch")
    @Valid
    private List<BatchRecord> records;
}

public enum BatchType {
    MONTHLY,
    DAILY,
    CORRECTION
}

@Data
@Builder
@Schema(description = "Individual record in batch upload")
public class BatchRecord {
    
    @Schema(description = "Record type")
    @NotNull(message = "Record type is mandatory")
    private RecordType recordType;
    
    @Schema(description = "Internal facility/loan ID")
    @NotBlank(message = "Facility ID is mandatory")
    @Size(max = 50)
    private String facilityId;
    
    @Schema(description = "Borrower NID (for individual)")
    @Pattern(regexp = "\\d{10,17}")
    private String borrowerNid;
    
    @Schema(description = "Borrower BIN (for company)")
    @Pattern(regexp = "\\d{9,17}")
    private String borrowerBin;
    
    @Schema(description = "Borrower/Company name")
    @NotBlank(message = "Borrower name is mandatory")
    @Size(max = 200)
    private String borrowerName;
    
    @Schema(description = "Facility type code")
    @NotBlank(message = "Facility type is mandatory")
    private String facilityType;
    
    @Schema(description = "Loan sanction date (YYYY-MM-DD)")
    @NotBlank(message = "Sanction date is mandatory")
    private String sanctionDate;
    
    @Schema(description = "Sanctioned amount")
    @NotNull(message = "Sanction amount is mandatory")
    @Positive(message = "Sanction amount must be positive")
    private BigDecimal sanctionAmount;
    
    @Schema(description = "Current outstanding principal")
    @NotNull(message = "Outstanding amount is mandatory")
    @PositiveOrZero(message = "Outstanding cannot be negative")
    private BigDecimal outstandingAmount;
    
    @Schema(description = "Overdue amount")
    @NotNull(message = "Overdue amount is mandatory")
    @PositiveOrZero(message = "Overdue cannot be negative")
    private BigDecimal overdueAmount;
    
    @Schema(description = "Days past due")
    @PositiveOrZero
    private Integer daysPastDue;
    
    @Schema(description = "Classification per BRPD")
    @NotNull(message = "Classification is mandatory")
    private BrpdClassification classification;
    
    @Schema(description = "Facility status")
    @NotNull(message = "Status is mandatory")
    private FacilityStatus status;
}

public enum RecordType {
    FACILITY,
    GUARANTOR,
    CO_BORROWER
}

public enum BrpdClassification {
    STD_0("STD-0"),
    STD_1("STD-1"),
    STD_2("STD-2"),
    SMA("SMA"),
    SS("SS"),
    DF("DF"),
    BL("B/L");
    
    private final String code;
    
    BrpdClassification(String code) {
        this.code = code;
    }
}

public enum FacilityStatus {
    ACTIVE,
    CLOSED,
    WRITTEN_OFF,
    SETTLED
}
```

## 2. Response DTOs

### 2.1 Individual CIB Report

```java
package com.unisoft.ulms.cib.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@Schema(description = "CIB report for an individual")
public class CibIndividualReport {
    
    @Schema(description = "Unique report ID from CIB")
    private String reportId;
    
    @Schema(description = "Subject NID")
    private String nid;
    
    @Schema(description = "Subject name")
    private String name;
    
    @Schema(description = "Father's name")
    private String fatherName;
    
    @Schema(description = "Mother's name")
    private String motherName;
    
    @Schema(description = "Date of birth")
    private String dateOfBirth;
    
    @Schema(description = "CIB credit score (0-900)")
    private Integer cibScore;
    
    @Schema(description = "Score category")
    private ScoreCategory scoreCategory;
    
    @Schema(description = "Credit summary")
    private CibSummary summary;
    
    @Schema(description = "List of credit facilities")
    private List<CibFacility> facilities;
    
    @Schema(description = "Default history")
    private List<CibDefaultRecord> defaultHistory;
    
    @Schema(description = "Recent inquiries (last 12 months)")
    private List<CibInquiryRecord> recentInquiries;
    
    @Schema(description = "Report generation timestamp")
    private LocalDateTime generatedAt;
    
    @Schema(description = "Report validity expiry")
    private LocalDateTime expiresAt;
    
    @Schema(description = "Report hash for verification")
    private String reportHash;
}

public enum ScoreCategory {
    EXCELLENT("750-900", "Very Low Risk"),
    GOOD("650-749", "Low Risk"),
    FAIR("550-649", "Moderate Risk"),
    POOR("400-549", "High Risk"),
    VERY_POOR("0-399", "Very High Risk"),
    NO_HISTORY("-1", "No Credit History");
    
    private final String range;
    private final String riskLevel;
    
    ScoreCategory(String range, String riskLevel) {
        this.range = range;
        this.riskLevel = riskLevel;
    }
}

@Data
@Builder
@Schema(description = "CIB credit summary")
public class CibSummary {
    
    @Schema(description = "Total outstanding across all facilities")
    private BigDecimal totalOutstanding;
    
    @Schema(description = "Total overdue amount")
    private BigDecimal totalOverdue;
    
    @Schema(description = "Total monthly EMI")
    private BigDecimal totalEmi;
    
    @Schema(description = "Total number of facilities")
    private Integer totalFacilities;
    
    @Schema(description = "Number of performing facilities")
    private Integer performingFacilities;
    
    @Schema(description = "Number of non-performing facilities")
    private Integer nonPerformingFacilities;
    
    @Schema(description = "Number of defaulted facilities")
    private Integer defaultedFacilities;
    
    @Schema(description = "Number of settled facilities")
    private Integer settledFacilities;
    
    @Schema(description = "Number of written-off facilities")
    private Integer writeOffFacilities;
    
    @Schema(description = "Maximum credit limit")
    private BigDecimal maxCreditLimit;
    
    @Schema(description = "Credit utilization percentage")
    private BigDecimal creditUtilizationPercent;
}

@Data
@Builder
@Schema(description = "Credit facility details")
public class CibFacility {
    
    @Schema(description = "Facility ID")
    private String facilityId;
    
    @Schema(description = "Lender name")
    private String lenderName;
    
    @Schema(description = "Facility type")
    private String facilityType;
    
    @Schema(description = "Sanction date")
    private String sanctionDate;
    
    @Schema(description = "Sanctioned amount")
    private BigDecimal sanctionAmount;
    
    @Schema(description = "Current outstanding")
    private BigDecimal outstandingAmount;
    
    @Schema(description = "Overdue amount")
    private BigDecimal overdueAmount;
    
    @Schema(description = "EMI amount")
    private BigDecimal emiAmount;
    
    @Schema(description = "Days past due")
    private Integer daysPastDue;
    
    @Schema(description = "Classification")
    private String classification;
    
    @Schema(description = "Facility status")
    private String status;
    
    @Schema(description = "Installment history (last 12 months)")
    private List<InstallmentRecord> installmentHistory;
}

@Data
@Builder
@Schema(description = "Default record information")
public class CibDefaultRecord {
    
    @Schema(description = "Lender name")
    private String lenderName;
    
    @Schema(description = "Facility type")
    private String facilityType;
    
    @Schema(description = "Default date")
    private String defaultDate;
    
    @Schema(description = "Default amount")
    private BigDecimal defaultAmount;
    
    @Schema(description = "Current status")
    private DefaultStatus status;
    
    @Schema(description = "Settlement date if settled")
    private String settlementDate;
    
    @Schema(description = "Settled amount")
    private BigDecimal settledAmount;
}

public enum DefaultStatus {
    ACTIVE,
    SETTLED,
    WRITTEN_OFF
}

@Data
@Builder
@Schema(description = "Inquiry record")
public class CibInquiryRecord {
    
    @Schema(description = "Inquiry date")
    private String inquiryDate;
    
    @Schema(description = "Inquiring institution")
    private String institutionName;
    
    @Schema(description = "Inquiry purpose")
    private String purpose;
    
    @Schema(description = "Facility type applied for")
    private String facilityType;
}
```

### 2.2 Batch Upload Response

```java
package com.unisoft.ulms.cib.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@Schema(description = "CIB batch upload response")
public class CibBatchResponse {
    
    @Schema(description = "CIB assigned batch ID")
    private String batchId;
    
    @Schema(description = "Submission status")
    private BatchSubmissionStatus status;
    
    @Schema(description = "Total records received")
    private Integer totalRecords;
    
    @Schema(description = "Number of valid records")
    private Integer validRecords;
    
    @Schema(description = "Number of invalid records")
    private Integer invalidRecords;
    
    @Schema(description = "Validation errors if any")
    private List<BatchValidationError> validationErrors;
    
    @Schema(description = "Submission timestamp")
    private LocalDateTime submittedAt;
    
    @Schema(description = "Estimated processing time")
    private String estimatedProcessingTime;
}

public enum BatchSubmissionStatus {
    ACCEPTED,
    REJECTED,
    PARTIAL
}

@Data
@Builder
@Schema(description = "Batch validation error")
public class BatchValidationError {
    
    @Schema(description = "Record index")
    private Integer recordIndex;
    
    @Schema(description = "Facility ID")
    private String facilityId;
    
    @Schema(description = "Error field")
    private String field;
    
    @Schema(description = "Error message")
    private String errorMessage;
}

@Data
@Builder
@Schema(description = "CIB batch status")
public class CibBatchStatus {
    
    @Schema(description = "Batch ID")
    private String batchId;
    
    @Schema(description = "Current status")
    private BatchProcessingStatus status;
    
    @Schema(description = "Total records")
    private Integer totalRecords;
    
    @Schema(description = "Processed records")
    private Integer processedRecords;
    
    @Schema(description = "Successful records")
    private Integer successRecords;
    
    @Schema(description = "Failed records")
    private Integer failedRecords;
    
    @Schema(description = "Submission time")
    private LocalDateTime submittedAt;
    
    @Schema(description = "Processing start time")
    private LocalDateTime processingStartedAt;
    
    @Schema(description = "Completion time")
    private LocalDateTime completedAt;
    
    @Schema(description = "Report download URL if available")
    private String reportDownloadUrl;
}

public enum BatchProcessingStatus {
    QUEUED,
    PROCESSING,
    COMPLETED,
    FAILED
}
```

### 2.3 Loan Application CIB Report

```java
package com.unisoft.ulms.cib.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@Schema(description = "Composite CIB report for loan application")
public class LoanApplicationCibReport {
    
    @Schema(description = "Loan application ID")
    private Long loanApplicationId;
    
    @Schema(description = "Primary borrower CIB report")
    private CibIndividualReport primaryBorrowerReport;
    
    @Schema(description = "Co-borrower CIB reports")
    private List<CibIndividualReport> coBorrowerReports;
    
    @Schema(description = "Guarantor CIB reports")
    private List<CibIndividualReport> guarantorReports;
    
    @Schema(description = "Overall CIB decision")
    private CibDecision overallDecision;
    
    @Schema(description = "Decision reasoning")
    private String decisionReason;
    
    @Schema(description = "Risk factors identified")
    private List<String> riskFactors;
    
    @Schema(description = "Recommended loan terms if approved")
    private RecommendedTerms recommendedTerms;
    
    @Schema(description = "Inquiry timestamp")
    private LocalDateTime inquiryTime;
    
    @Schema(description = "Earliest report expiry")
    private LocalDateTime earliestExpiry;
}

public enum CibDecision {
    APPROVE,
    APPROVE_WITH_CONDITIONS,
    REVIEW,
    REJECT
}

@Data
@Builder
@Schema(description = "Recommended loan terms based on CIB")
public class RecommendedTerms {
    
    @Schema(description = "Maximum recommended loan amount")
    private BigDecimal maxAmount;
    
    @Schema(description = "Recommended interest rate adjustment")
    private BigDecimal interestRateAdjustment;
    
    @Schema(description = "Require additional collateral")
    private Boolean requireCollateral;
    
    @Schema(description = "Require guarantor")
    private Boolean requireGuarantor;
    
    @Schema(description = "Maximum tenor in months")
    private Integer maxTenorMonths;
}
```

## 3. Error Response DTOs

### 3.1 CIB API Error Response

```java
package com.unisoft.ulms.cib.dto.error;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@Schema(description = "CIB API error response")
public class CibApiErrorResponse {
    
    @Schema(description = "Error timestamp")
    private LocalDateTime timestamp;
    
    @Schema(description = "HTTP status code")
    private Integer status;
    
    @Schema(description = "Error code")
    private String errorCode;
    
    @Schema(description = "Error message")
    private String message;
    
    @Schema(description = "Detailed error description")
    private String details;
    
    @Schema(description = "Request ID for tracking")
    private String requestId;
    
    @Schema(description = "Validation errors")
    private List<FieldError> fieldErrors;
    
    @Schema(description = "Retry after seconds (for rate limit)")
    private Integer retryAfterSeconds;
}

@Data
@Builder
@Schema(description = "Field validation error")
public class FieldError {
    
    @Schema(description = "Field name")
    private String field;
    
    @Schema(description = "Rejected value")
    private Object rejectedValue;
    
    @Schema(description = "Error message")
    private String message;
}
```

---

## Appendices

### A.1 JSON Examples

#### Individual Inquiry Request
```json
{
  "nid": "1234567890",
  "name": "MOHAMMAD ALI",
  "fatherName": "ABDUL KARIM",
  "motherName": "AMENA BEGUM",
  "dateOfBirth": "1990-05-15",
  "inquiryPurpose": "LOAN_APPLICATION",
  "loanApplicationReference": "LA-2026-000123"
}
```

#### Individual CIB Report Response
```json
{
  "reportId": "CIB-2026-00123456",
  "nid": "1234567890",
  "name": "MOHAMMAD ALI",
  "cibScore": 685,
  "scoreCategory": "GOOD",
  "summary": {
    "totalOutstanding": 2500000.00,
    "totalOverdue": 0.00,
    "totalEmi": 45000.00,
    "totalFacilities": 2,
    "performingFacilities": 2,
    "nonPerformingFacilities": 0
  },
  "facilities": [
    {
      "facilityId": "FAC001",
      "lenderName": "AB BANK LIMITED",
      "facilityType": "PERSONAL LOAN",
      "sanctionAmount": 1000000.00,
      "outstandingAmount": 750000.00,
      "overdueAmount": 0.00,
      "daysPastDue": 0,
      "classification": "STD",
      "status": "ACTIVE"
    }
  ],
  "defaultHistory": [],
  "generatedAt": "2026-02-08T10:30:00",
  "expiresAt": "2026-02-09T10:30:00"
}
```

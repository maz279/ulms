**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | CIB Request and Response DTOs |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Technical Lead |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | Technical Lead | Initial version |

---

# CIB Request and Response DTOs

## Table of Contents

1. [Introduction](#1-introduction)
2. [Subject Management DTOs](#2-subject-management-dtos)
3. [Contract Management DTOs](#3-contract-management-dtos)
4. [Installment Update DTOs](#4-installment-update-dtos)
5. [Inquiry DTOs](#5-inquiry-dtos)
6. [Batch Processing DTOs](#6-batch-processing-dtos)
7. [Common DTOs](#7-common-dtos)
8. [Error Response DTOs](#8-error-response-dtos)
9. [Validation Rules](#9-validation-rules)

---

## 1. Introduction

### 1.1 Purpose

This document defines all Data Transfer Objects (DTOs) used for communication with Bangladesh Bank's Credit Information Bureau (CIB) Online system.

### 1.2 Naming Conventions

| Suffix | Purpose |
|--------|---------|
| `Request` | Outbound data to CIB |
| `Response` | Inbound data from CIB |
| `Dto` | Internal data transfer |
| `Query` | Query parameters |

---

## 2. Subject Management DTOs

### 2.1 Subject Request

```java
package com.unisoft.ulms.cib.dto.subject;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * CIB Subject Request DTO
 * Represents borrower/entity information for CIB registration
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SubjectRequest {
    
    @JsonProperty("subjectId")
    @Size(max = 50, message = "Subject ID cannot exceed 50 characters")
    private String subjectId;  // Internal reference
    
    @JsonProperty("subjectType")
    @NotBlank(message = "Subject type is required")
    @Pattern(regexp = "^(INDIVIDUAL|CORPORATE|PARTNERSHIP|TRUST)$",
        message = "Invalid subject type")
    private String subjectType;
    
    @JsonProperty("subjectName")
    @NotBlank(message = "Subject name is required")
    @Size(min = 3, max = 200, message = "Subject name must be 3-200 characters")
    private String subjectName;
    
    @JsonProperty("fatherName")
    @Size(max = 200, message = "Father's name cannot exceed 200 characters")
    private String fatherName;
    
    @JsonProperty("motherName")
    @Size(max = 200, message = "Mother's name cannot exceed 200 characters")
    private String motherName;
    
    @JsonProperty("spouseName")
    @Size(max = 200, message = "Spouse name cannot exceed 200 characters")
    private String spouseName;
    
    @JsonProperty("dateOfBirth")
    @NotNull(message = "Date of birth is required")
    @Past(message = "Date of birth must be in the past")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateOfBirth;
    
    @JsonProperty("gender")
    @Pattern(regexp = "^(MALE|FEMALE|OTHER)$", message = "Invalid gender")
    private String gender;
    
    @JsonProperty("nidNumber")
    @Pattern(regexp = "^\\d{10}$|^\\d{13}$|^\\d{17}$", 
        message = "NID must be 10, 13, or 17 digits")
    private String nidNumber;
    
    @JsonProperty("passportNumber")
    @Pattern(regexp = "^[A-Z]{2}\\d{7}$", message = "Invalid passport format")
    private String passportNumber;
    
    @JsonProperty("tinNumber")
    @Pattern(regexp = "^\\d{12}$", message = "TIN must be 12 digits")
    private String tinNumber;
    
    @JsonProperty("birthRegistrationNumber")
    @Pattern(regexp = "^\\d{17}$", message = "Birth registration must be 17 digits")
    private String birthRegistrationNumber;
    
    @JsonProperty("occupation")
    @Size(max = 100, message = "Occupation cannot exceed 100 characters")
    private String occupation;
    
    @JsonProperty("sectorCode")
    @Pattern(regexp = "^\\d{4}$", message = "Sector code must be 4 digits")
    private String sectorCode;  // Bangladesh Bank sector classification
    
    @JsonProperty("annualIncome")
    @DecimalMin(value = "0.0", inclusive = true, message = "Income cannot be negative")
    @Digits(integer = 15, fraction = 2, message = "Invalid income format")
    private BigDecimal annualIncome;
    
    @JsonProperty("presentAddress")
    @Valid
    @NotNull(message = "Present address is required")
    private AddressDto presentAddress;
    
    @JsonProperty("permanentAddress")
    @Valid
    private AddressDto permanentAddress;
    
    @JsonProperty("businessAddress")
    @Valid
    private AddressDto businessAddress;
    
    @JsonProperty("mobileNumber")
    @Pattern(regexp = "^01[3-9]\\d{8}$", message = "Invalid Bangladesh mobile number")
    private String mobileNumber;
    
    @JsonProperty("email")
    @Email(message = "Invalid email format")
    @Size(max = 100, message = "Email cannot exceed 100 characters")
    private String email;
    
    @JsonProperty("emergencyContact")
    @Valid
    private EmergencyContactDto emergencyContact;
}
```

### 2.2 Subject Response

```java
package com.unisoft.ulms.cib.dto.subject;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * CIB Subject Response DTO
 */
@Data
@Builder
public class SubjectResponse {
    
    @JsonProperty("subjectId")
    private String subjectId;  // CIB assigned ID
    
    @JsonProperty("internalReference")
    private String internalReference;  // Original reference
    
    @JsonProperty("status")
    private SubjectStatus status;  // ACTIVE, INACTIVE, PENDING
    
    @JsonProperty("cibScore")
    private Integer cibScore;  // CIB credit score (if available)
    
    @JsonProperty("createdAt")
    private LocalDateTime createdAt;
    
    @JsonProperty("updatedAt")
    private LocalDateTime updatedAt;
    
    @JsonProperty("message")
    private String message;
}

public enum SubjectStatus {
    ACTIVE,      // Subject is active in CIB
    INACTIVE,    // Subject marked inactive
    PENDING,     // Registration pending
    REJECTED,    // Registration rejected
    DUPLICATE    // Duplicate subject detected
}
```

---

## 3. Contract Management DTOs

### 3.1 Contract Request

```java
package com.unisoft.ulms.cib.dto.contract;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * CIB Contract Request DTO
 * Represents loan/facility contract information
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ContractRequest {
    
    @JsonProperty("contractId")
    @NotBlank(message = "Contract ID is required")
    @Size(max = 50, message = "Contract ID cannot exceed 50 characters")
    private String contractId;
    
    @JsonProperty("subjectId")
    @NotBlank(message = "Subject ID is required")
    private String subjectId;
    
    @JsonProperty("cibSubjectId")
    private String cibSubjectId;  // CIB assigned subject ID
    
    @JsonProperty("facilityType")
    @NotBlank(message = "Facility type is required")
    @Pattern(regexp = "^(TERM_LOAN|OVERDRAFT|LETTER_OF_CREDIT|LETTER_OF_GUARANTEE|" +
        "BILL_PURCHASED|BILL_DISCOUNTED|HIRE_PURCHASE|LEASE_FINANCE|MORTGAGE_LOAN|" +
        "STAFF_LOAN|OTHER)$", message = "Invalid facility type")
    private String facilityType;
    
    @JsonProperty("contractPhase")
    @NotBlank(message = "Contract phase is required")
    @Pattern(regexp = "^(NEW|RENEWAL|RESTRUCTURED|RESCHEDULED|REFINANCED|TAKEOVER)$",
        message = "Invalid contract phase")
    private String contractPhase;
    
    @JsonProperty("sanctionDate")
    @NotNull(message = "Sanction date is required")
    @PastOrPresent(message = "Sanction date cannot be in the future")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate sanctionDate;
    
    @JsonProperty("disbursementDate")
    @PastOrPresent(message = "Disbursement date cannot be in the future")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate disbursementDate;
    
    @JsonProperty("expiryDate")
    @Future(message = "Expiry date must be in the future")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate expiryDate;
    
    @JsonProperty("maturityDate")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate maturityDate;
    
    @JsonProperty("sanctionAmount")
    @NotNull(message = "Sanction amount is required")
    @DecimalMin(value = "0.01", message = "Sanction amount must be greater than 0")
    @Digits(integer = 15, fraction = 2, message = "Invalid amount format")
    private BigDecimal sanctionAmount;
    
    @JsonProperty("disbursementAmount")
    @DecimalMin(value = "0.0", inclusive = true, message = "Disbursement amount cannot be negative")
    @Digits(integer = 15, fraction = 2, message = "Invalid amount format")
    private BigDecimal disbursementAmount;
    
    @JsonProperty("currency")
    @NotBlank(message = "Currency is required")
    @Pattern(regexp = "^(BDT|USD|EUR|GBP|JPY)$", message = "Unsupported currency")
    private String currency;
    
    @JsonProperty("repaymentType")
    @Pattern(regexp = "^(EMI|BULLET|EQUAL_PRINCIPAL|INTEREST_ONLY|GRACE_PERIOD)$",
        message = "Invalid repayment type")
    private String repaymentType;
    
    @JsonProperty("totalInstallments")
    @Min(value = 1, message = "Total installments must be at least 1")
    @Max(value = 600, message = "Total installments cannot exceed 600")
    private Integer totalInstallments;
    
    @JsonProperty("paymentFrequency")
    @Min(value = 1, message = "Payment frequency must be at least 1 (monthly)")
    @Max(value = 12, message = "Payment frequency cannot exceed 12")
    private Integer paymentFrequency;  // 1=Monthly, 3=Quarterly, 12=Yearly
    
    @JsonProperty("interestType")
    @Pattern(regexp = "^(FIXED|FLOATING|MIXED)$", message = "Invalid interest type")
    private String interestType;
    
    @JsonProperty("interestRate")
    @DecimalMin(value = "0.0", inclusive = true, message = "Interest rate cannot be negative")
    @DecimalMax(value = "100.0", message = "Interest rate cannot exceed 100%")
    @Digits(integer = 3, fraction = 2, message = "Invalid interest rate format")
    private BigDecimal interestRate;
    
    @JsonProperty("securityType")
    @Pattern(regexp = "^(CASH|DEPOSIT|PROPERTY|VEHICLE|EQUIPMENT|INVENTORY|" +
        "RECEIVABLES|GUARANTEE|OTHER|UNSECURED)$", message = "Invalid security type")
    private String securityType;
    
    @JsonProperty("securityValue")
    @DecimalMin(value = "0.0", inclusive = true, message = "Security value cannot be negative")
    private BigDecimal securityValue;
    
    @JsonProperty("purposeCode")
    @Pattern(regexp = "^\\d{4}$", message = "Purpose code must be 4 digits")
    private String purposeCode;  // Bangladesh Bank purpose classification
    
    @JsonProperty("economicSector")
    @Pattern(regexp = "^\\d{4}$", message = "Economic sector must be 4 digits")
    private String economicSector;  // Bangladesh Bank sector code
    
    @JsonProperty("branchCode")
    @NotBlank(message = "Branch code is required")
    @Size(max = 20, message = "Branch code cannot exceed 20 characters")
    private String branchCode;
    
    @JsonProperty("contractStatus")
    @Pattern(regexp = "^(ACTIVE|CLOSED|WRITTEN_OFF|TRANSFERRED)$",
        message = "Invalid contract status")
    private String contractStatus;
    
    @JsonProperty("installments")
    @Valid
    private List<InstallmentDetailDto> installments;
}
```

### 3.2 Contract Response

```java
package com.unisoft.ulms.cib.dto.contract;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * CIB Contract Response DTO
 */
@Data
@Builder
public class ContractResponse {
    
    @JsonProperty("contractId")
    private String contractId;
    
    @JsonProperty("cibContractId")
    private String cibContractId;  // CIB assigned contract ID
    
    @JsonProperty("status")
    private ContractStatus status;
    
    @JsonProperty("validationErrors")
    private List<ValidationError> validationErrors;
    
    @JsonProperty("createdAt")
    private LocalDateTime createdAt;
    
    @JsonProperty("message")
    private String message;
}

public enum ContractStatus {
    REGISTERED,     // Successfully registered
    UPDATED,        // Successfully updated
    REJECTED,       // Rejected due to validation
    DUPLICATE,      // Duplicate contract detected
    PENDING         // Pending manual review
}
```

---

## 4. Installment Update DTOs

### 4.1 Installment Request

```java
package com.unisoft.ulms.cib.dto.installment;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * CIB Installment Update Request DTO
 */
@Data
@Builder
public class InstallmentRequest {
    
    @JsonProperty("contractId")
    @NotBlank(message = "Contract ID is required")
    private String contractId;
    
    @JsonProperty("cibContractId")
    private String cibContractId;
    
    @JsonProperty("installmentNumber")
    @NotNull(message = "Installment number is required")
    @Min(value = 1, message = "Installment number must be at least 1")
    private Integer installmentNumber;
    
    @JsonProperty("dueDate")
    @NotNull(message = "Due date is required")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dueDate;
    
    @JsonProperty("principalAmount")
    @NotNull(message = "Principal amount is required")
    @DecimalMin(value = "0.0", message = "Principal amount cannot be negative")
    private BigDecimal principalAmount;
    
    @JsonProperty("interestAmount")
    @NotNull(message = "Interest amount is required")
    @DecimalMin(value = "0.0", message = "Interest amount cannot be negative")
    private BigDecimal interestAmount;
    
    @JsonProperty("totalAmount")
    @NotNull(message = "Total amount is required")
    @DecimalMin(value = "0.0", message = "Total amount cannot be negative")
    private BigDecimal totalAmount;
    
    @JsonProperty("paidDate")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate paidDate;
    
    @JsonProperty("paidAmount")
    @DecimalMin(value = "0.0", message = "Paid amount cannot be negative")
    private BigDecimal paidAmount;
    
    @JsonProperty("outstandingAmount")
    @DecimalMin(value = "0.0", message = "Outstanding amount cannot be negative")
    private BigDecimal outstandingAmount;
    
    @JsonProperty("overdueDays")
    @Min(value = 0, message = "Overdue days cannot be negative")
    private Integer overdueDays;
    
    @JsonProperty("installmentStatus")
    @NotBlank(message = "Installment status is required")
    @Pattern(regexp = "^(PENDING|PAID|PARTIAL|OVERDUE|WAIVED)$",
        message = "Invalid installment status")
    private String installmentStatus;
    
    @JsonProperty("effectiveDate")
    @NotNull(message = "Effective date is required")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate effectiveDate;
}
```

### 4.2 Installment Response

```java
package com.unisoft.ulms.cib.dto.installment;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * CIB Installment Update Response DTO
 */
@Data
@Builder
public class InstallmentResponse {
    
    @JsonProperty("contractId")
    private String contractId;
    
    @JsonProperty("installmentNumber")
    private Integer installmentNumber;
    
    @JsonProperty("status")
    private InstallmentUpdateStatus status;
    
    @JsonProperty("updatedAt")
    private LocalDateTime updatedAt;
    
    @JsonProperty("message")
    private String message;
}

public enum InstallmentUpdateStatus {
    ACCEPTED,
    REJECTED,
    PENDING_VERIFICATION
}
```

---

## 5. Inquiry DTOs

### 5.1 Inquiry Response

```java
package com.unisoft.ulms.cib.dto.inquiry;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * CIB Subject Inquiry Response DTO
 */
@Data
@Builder
public class InquiryResponse {
    
    @JsonProperty("subjectId")
    private String subjectId;
    
    @JsonProperty("subjectName")
    private String subjectName;
    
    @JsonProperty("cibScore")
    private Integer cibScore;
    
    @JsonProperty("riskGrade")
    private String riskGrade;  // A, B, C, D, E
    
    @JsonProperty("inquiryDate")
    private LocalDateTime inquiryDate;
    
    @JsonProperty("totalFacilities")
    private Integer totalFacilities;
    
    @JsonProperty("totalOutstanding")
    private BigDecimal totalOutstanding;
    
    @JsonProperty("totalOverdue")
    private BigDecimal totalOverdue;
    
    @JsonProperty("worstClassification")
    private String worstClassification;
    
    @JsonProperty("facilities")
    private List<FacilitySummaryDto> facilities;
    
    @JsonProperty("inquiryHistory")
    private List<InquiryRecordDto> inquiryHistory;
}

@Data
@Builder
public class FacilitySummaryDto {
    
    @JsonProperty("contractId")
    private String contractId;
    
    @JsonProperty("institutionName")
    private String institutionName;
    
    @JsonProperty("facilityType")
    private String facilityType;
    
    @JsonProperty("sanctionAmount")
    private BigDecimal sanctionAmount;
    
    @JsonProperty("outstandingAmount")
    private BigDecimal outstandingAmount;
    
    @JsonProperty("overdueAmount")
    private BigDecimal overdueAmount;
    
    @JsonProperty("status")
    private String status;
    
    @JsonProperty("classification")
    private String classification;
}
```

---

## 6. Batch Processing DTOs

### 6.1 Batch Request

```java
package com.unisoft.ulms.cib.dto.batch;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Data;

import java.time.YearMonth;
import java.util.List;

/**
 * CIB Monthly Batch Request DTO
 */
@Data
@Builder
public class BatchRequest {
    
    @JsonProperty("reportingMonth")
    @NotNull(message = "Reporting month is required")
    private YearMonth reportingMonth;
    
    @JsonProperty("institutionCode")
    @NotBlank(message = "Institution code is required")
    private String institutionCode;
    
    @JsonProperty("totalRecords")
    @NotNull(message = "Total records count is required")
    @Min(value = 0, message = "Total records cannot be negative")
    private Integer totalRecords;
    
    @JsonProperty("totalAmount")
    @NotNull(message = "Total amount is required")
    @DecimalMin(value = "0.0", message = "Total amount cannot be negative")
    private BigDecimal totalAmount;
    
    @JsonProperty("subjects")
    @NotEmpty(message = "Subjects list cannot be empty")
    @Valid
    private List<BatchSubjectDto> subjects;
    
    @JsonProperty("contracts")
    @Valid
    private List<BatchContractDto> contracts;
}
```

### 6.2 Batch Response

```java
package com.unisoft.ulms.cib.dto.batch;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * CIB Batch Submission Response DTO
 */
@Data
@Builder
public class BatchResponse {
    
    @JsonProperty("batchId")
    private String batchId;
    
    @JsonProperty("status")
    private BatchStatus status;
    
    @JsonProperty("submittedAt")
    private LocalDateTime submittedAt;
    
    @JsonProperty("totalRecords")
    private Integer totalRecords;
    
    @JsonProperty("acceptedRecords")
    private Integer acceptedRecords;
    
    @JsonProperty("rejectedRecords")
    private Integer rejectedRecords;
    
    @JsonProperty("errors")
    private List<BatchErrorDto> errors;
    
    @JsonProperty("processingTimeMs")
    private Long processingTimeMs;
    
    @JsonProperty("message")
    private String message;
}

public enum BatchStatus {
    ACCEPTED,           // Batch accepted for processing
    PROCESSING,         // Currently processing
    COMPLETED,          // Processing completed
    PARTIAL,            // Partial success
    REJECTED,           // Batch rejected
    FAILED              // Processing failed
}
```

---

## 7. Common DTOs

### 7.1 Address DTO

```java
package com.unisoft.ulms.cib.dto.common;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;

/**
 * Address DTO for CIB requests
 */
@Data
@Builder
public class AddressDto {
    
    @JsonProperty("addressLine1")
    @NotBlank(message = "Address line 1 is required")
    @Size(max = 200, message = "Address line 1 cannot exceed 200 characters")
    private String addressLine1;
    
    @JsonProperty("addressLine2")
    @Size(max = 200, message = "Address line 2 cannot exceed 200 characters")
    private String addressLine2;
    
    @JsonProperty("city")
    @NotBlank(message = "City is required")
    @Size(max = 100, message = "City cannot exceed 100 characters")
    private String city;
    
    @JsonProperty("district")
    @Size(max = 100, message = "District cannot exceed 100 characters")
    private String district;
    
    @JsonProperty("division")
    @Size(max = 100, message = "Division cannot exceed 100 characters")
    private String division;
    
    @JsonProperty("postCode")
    @Size(max = 10, message = "Post code cannot exceed 10 characters")
    private String postCode;
    
    @JsonProperty("country")
    @Size(max = 100, message = "Country cannot exceed 100 characters")
    private String country;
}
```

### 7.2 Emergency Contact DTO

```java
package com.unisoft.ulms.cib.dto.common;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EmergencyContactDto {
    
    @JsonProperty("name")
    @Size(max = 200, message = "Name cannot exceed 200 characters")
    private String name;
    
    @JsonProperty("relationship")
    @Size(max = 50, message = "Relationship cannot exceed 50 characters")
    private String relationship;
    
    @JsonProperty("mobileNumber")
    @Pattern(regexp = "^01[3-9]\\d{8}$", message = "Invalid mobile number")
    private String mobileNumber;
    
    @JsonProperty("address")
    private String address;
}
```

---

## 8. Error Response DTOs

### 8.1 CIB Error Response

```java
package com.unisoft.ulms.cib.dto.error;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * CIB API Error Response DTO
 */
@Data
@Builder
public class CibErrorResponse {
    
    @JsonProperty("errorCode")
    private String errorCode;
    
    @JsonProperty("message")
    private String message;
    
    @JsonProperty("timestamp")
    private LocalDateTime timestamp;
    
    @JsonProperty("path")
    private String path;
    
    @JsonProperty("errors")
    private List<ValidationError> errors;
    
    @JsonProperty("referenceId")
    private String referenceId;
}

@Data
@Builder
public class ValidationError {
    
    @JsonProperty("field")
    private String field;
    
    @JsonProperty("code")
    private String code;
    
    @JsonProperty("message")
    private String message;
    
    @JsonProperty("rejectedValue")
    private Object rejectedValue;
}
```

### 8.2 Batch Error DTO

```java
package com.unisoft.ulms.cib.dto.error;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BatchErrorDto {
    
    @JsonProperty("recordNumber")
    private Integer recordNumber;
    
    @JsonProperty("recordId")
    private String recordId;
    
    @JsonProperty("errorCode")
    private String errorCode;
    
    @JsonProperty("errorMessage")
    private String errorMessage;
    
    @JsonProperty("fieldErrors")
    private List<ValidationError> fieldErrors;
}
```

---

## 9. Validation Rules

### 9.1 Validation Summary

| Field | Rule | Error Code |
|-------|------|------------|
| nidNumber | 10, 13, or 17 digits | VAL-NID-001 |
| passportNumber | 2 uppercase letters + 7 digits | VAL-PASS-001 |
| mobileNumber | 01[3-9] followed by 8 digits | VAL-MOB-001 |
| tinNumber | 12 digits | VAL-TIN-001 |
| sectorCode | 4 digits | VAL-SEC-001 |
| email | Valid email format | VAL-EMAIL-001 |
| dateOfBirth | Past date only | VAL-DOB-001 |

### 9.2 Business Rules

```java
package com.unisoft.ulms.cib.validation;

import com.unisoft.ulms.cib.dto.subject.SubjectRequest;
import org.springframework.stereotype.Component;

@Component
public class SubjectRequestValidator {
    
    public void validate(SubjectRequest request) {
        // At least one ID required
        if (isBlank(request.getNidNumber()) && 
            isBlank(request.getPassportNumber()) &&
            isBlank(request.getBirthRegistrationNumber())) {
            throw new ValidationException("At least one ID (NID, Passport, or Birth Registration) is required");
        }
        
        // Individual requires date of birth
        if ("INDIVIDUAL".equals(request.getSubjectType()) && 
            request.getDateOfBirth() == null) {
            throw new ValidationException("Date of birth is required for individual subjects");
        }
        
        // Present address mandatory
        if (request.getPresentAddress() == null) {
            throw new ValidationException("Present address is required");
        }
    }
}
```

---

## Related Documents

| Document | Description |
|----------|-------------|
| [CIB]_CIB_Service_Technical_Specification_v1.0.md | Service specification |
| [CIB]_CIB_API_Client_Design_v1.0.md | WebClient design |
| [CIB]_CIB_Batch_Processing_Design_v1.0.md | Batch processing design |

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

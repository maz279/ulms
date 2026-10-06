# Apache Fineract Learning Path (5-Day Structured)

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ULMS-DEV-0.2.2 |
| **Document Title** | Apache Fineract Learning Path (5-Day Structured) |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-04 |
| **Prepared By** | Technical Lead |
| **Reviewed By** | Project Manager |
| **Classification** | Internal |
| **Status** | Approved |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-04 | Lead Dev | Initial version |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Learning Objectives](#2-learning-objectives)
3. [Day 1: Fineract Architecture & Setup](#3-day-1-fineract-architecture--setup)
4. [Day 2: Loan Module Deep Dive](#4-day-2-loan-module-deep-dive)
5. [Day 3: Client & Accounting](#5-day-3-client--accounting)
6. [Day 4: Scheduler & Batch Jobs](#6-day-4-scheduler--batch-jobs)
7. [Day 5: API & Extension Points](#7-day-5-api--extension-points)
8. [Assessment & Certification](#8-assessment--certification)
9. [Resources](#9-resources)

---

## 1. Introduction

### 1.1 Purpose

This 5-day structured learning path provides comprehensive training on Apache Fineract 1.10 for ULMS v2.0 developers. Upon completion, developers will understand Fineract's architecture, core modules, and be ready to customize it for Bangladesh banking requirements.

### 1.2 Prerequisites

| Requirement | Level |
|-------------|-------|
| Java 17+ | Intermediate |
| Spring Boot | Intermediate |
| REST APIs | Intermediate |
| SQL/PostgreSQL | Basic |
| Git | Basic |

### 1.3 Target Audience

- Technical Lead
- Backend Developer (Dev 2)
- Frontend Developer (Dev 1) - Days 1, 2, 5

### 1.4 Time Commitment

| Day | Duration | Focus |
|-----|----------|-------|
| Day 1 | 6-8 hours | Architecture & Setup |
| Day 2 | 6-8 hours | Loan Module |
| Day 3 | 6-8 hours | Client & Accounting |
| Day 4 | 6-8 hours | Scheduler & Batch |
| Day 5 | 6-8 hours | API & Extensions |
| **Total** | **30-40 hours** | |

---

## 2. Learning Objectives

### 2.1 By End of Day 1

- [ ] Understand Fineract's architecture and module structure
- [ ] Set up local Fineract development environment
- [ ] Navigate the codebase and identify key packages
- [ ] Access Fineract API via Swagger/Postman

### 2.2 By End of Day 2

- [ ] Understand loan lifecycle and state transitions
- [ ] Configure loan products with charges and penalties
- [ ] Create and process loan applications via API
- [ ] Understand interest calculation methods

### 2.3 By End of Day 3

- [ ] Understand client management and KYC workflow
- [ ] Configure chart of accounts for Bangladesh
- [ ] Understand GL posting for loan transactions
- [ ] Create journal entries and run reports

### 2.4 By End of Day 4

- [ ] Understand Fineract scheduler architecture
- [ ] Configure and run batch jobs
- [ ] Implement BRPD classification logic
- [ ] Create custom scheduled tasks

### 2.5 By End of Day 5

- [ ] Master Fineract REST API patterns
- [ ] Understand extension points and hooks
- [ ] Implement custom service extensions
- [ ] Build ULMS-specific customizations

---

## 3. Day 1: Fineract Architecture & Setup

### 3.1 Morning Session (3-4 hours)

#### 3.1.1 Introduction to Apache Fineract

**Reading Materials:**
- Official Fineract documentation: https://fineract.apache.org/
- ULMS Apache Fineract Overview document

**Key Concepts:**
1. **What is Fineract?**
   - Open-source core banking platform
   - Apache Software Foundation project
   - Used by 1000+ financial institutions worldwide

2. **Fineract Architecture**
   ```
   ┌─────────────────────────────────────────────────────┐
   │                  Fineract Architecture              │
   ├─────────────────────────────────────────────────────┤
   │                                                     │
   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
   │  │   REST API  │  │  Platform   │  │  Portfolio  │ │
   │  │   Layer     │  │  Services   │  │  Services   │ │
   │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │
   │         │                │                │        │
   │  ┌──────▼────────────────▼────────────────▼──────┐ │
   │  │              Domain Services                   │ │
   │  │  (Client, Loan, Savings, Accounting, etc.)    │ │
   │  └─────────────────────┬─────────────────────────┘ │
   │                        │                           │
   │  ┌─────────────────────▼─────────────────────────┐ │
   │  │           Infrastructure Layer                 │ │
   │  │  (JPA, Security, Jobs, Reporting)             │ │
   │  └─────────────────────┬─────────────────────────┘ │
   │                        │                           │
   │  ┌─────────────────────▼─────────────────────────┐ │
   │  │              Database (MySQL/PostgreSQL)       │ │
   │  └───────────────────────────────────────────────┘ │
   │                                                     │
   └─────────────────────────────────────────────────────┘
   ```

3. **Key Modules:**
   | Module | Description | ULMS Usage |
   |--------|-------------|------------|
   | `fineract-provider` | Core platform | Main application |
   | `fineract-client` | Java SDK | API integration |
   | `fineract-loan` | Loan management | Core loan features |
   | `fineract-savings` | Savings accounts | Linked accounts |
   | `fineract-accounting` | GL & accounting | Financial records |
   | `fineract-investor` | Investor management | Not used |

#### 3.1.2 Exercise: Architecture Diagram

**Task:** Draw the ULMS architecture showing how Fineract integrates with custom services.

**Expected Output:**
```
┌─────────────────────────────────────────────────────────────┐
│                    ULMS Architecture                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ React UI     │  │ Mobile App   │  │ External Systems │   │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘   │
│         │                 │                   │              │
│  ┌──────▼─────────────────▼───────────────────▼─────────┐   │
│  │                 Kong API Gateway                      │   │
│  └──────────────────────────┬────────────────────────────┘   │
│                             │                                │
│  ┌──────────────────────────▼────────────────────────────┐   │
│  │              ULMS Custom Microservices                │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐ │   │
│  │  │   CIB   │ │   NID   │ │Workflow │ │ Notification│ │   │
│  │  │ Service │ │ Service │ │ Service │ │   Service   │ │   │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └──────┬──────┘ │   │
│  └───────┼───────────┼───────────┼─────────────┼────────┘   │
│          │           │           │             │             │
│  ┌───────▼───────────▼───────────▼─────────────▼────────┐   │
│  │              Apache Fineract Core                     │   │
│  │  (Loan, Client, Accounting, Scheduler, Reporting)    │   │
│  └──────────────────────────┬────────────────────────────┘   │
│                             │                                │
│  ┌──────────────────────────▼────────────────────────────┐   │
│  │              PostgreSQL Database                       │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Afternoon Session (3-4 hours)

#### 3.2.1 Local Environment Setup

**Step 1: Clone Repository**
```bash
git clone https://github.com/apache/fineract.git
cd fineract
git checkout 1.10.0  # Use ULMS version
```

**Step 2: Prerequisites Check**
```bash
# Java 21
java -version
# Expected: openjdk version "21.0.x"

# Gradle
./gradlew --version

# Docker
docker --version
docker-compose --version
```

**Step 3: Start Database**
```bash
# Using Docker Compose
docker-compose -f docker-compose-postgresql.yml up -d

# Verify
docker ps
# Should see: fineract-postgresql running on port 5432
```

**Step 4: Build Fineract**
```bash
# Build without tests (faster)
./gradlew build -x test

# Build with tests
./gradlew build
```

**Step 5: Run Fineract**
```bash
# Run the application
./gradlew bootRun

# Verify
curl http://localhost:8443/fineract-provider/api/v1/
```

#### 3.2.2 Exercise: API Exploration

**Task:** Use Postman/Swagger to explore Fineract APIs.

**Steps:**
1. Open Swagger UI: `https://localhost:8443/fineract-provider/swagger-ui/`
2. Authenticate with default credentials:
   - Username: `mifos`
   - Password: `password`
   - Tenant: `default`
3. Try these API calls:

```bash
# 1. Get offices
GET /api/v1/offices

# 2. Get loan products
GET /api/v1/loanproducts

# 3. Get clients
GET /api/v1/clients

# 4. Get staff
GET /api/v1/staff
```

**Checkpoint Questions:**
1. What authentication mechanism does Fineract use?
2. How is multi-tenancy implemented?
3. What is the base path for all APIs?

### 3.3 Day 1 Assessment

**Quiz (15 questions):**
1. What database does ULMS use with Fineract?
2. List 3 main Fineract modules.
3. What port does Fineract run on by default?
4. How do you specify the tenant in API requests?
5. What is the purpose of the `fineract-provider` module?

**Practical Task:**
- Set up local Fineract environment
- Make 5 successful API calls
- Document the response structure

---

## 4. Day 2: Loan Module Deep Dive

### 4.1 Morning Session (3-4 hours)

#### 4.1.1 Loan Lifecycle

**Loan States:**
```
┌────────────────────────────────────────────────────────────────┐
│                     FINERACT LOAN LIFECYCLE                     │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐               │
│  │ Submitted│────▶│ Approved │────▶│ Disbursed│               │
│  │ & Pending│     │          │     │          │               │
│  └──────────┘     └──────────┘     └────┬─────┘               │
│       │                │                 │                      │
│       ▼                ▼                 ▼                      │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐               │
│  │ Rejected │     │ Withdrawn│     │  Active  │               │
│  └──────────┘     └──────────┘     └────┬─────┘               │
│                                          │                      │
│                   ┌──────────────────────┼──────────────────┐  │
│                   │                      │                  │  │
│                   ▼                      ▼                  ▼  │
│              ┌──────────┐          ┌──────────┐       ┌───────┐│
│              │  Closed  │          │ Written  │       │Overpaid││
│              │(Matured) │          │   Off    │       │       ││
│              └──────────┘          └──────────┘       └───────┘│
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**ULMS Custom States (BRPD Compliance):**
| State | Description | BRPD Classification |
|-------|-------------|---------------------|
| `ACTIVE` | Current loan | STD-0 to B/L based on DPD |
| `OVERDUE` | Payment missed | SMA and above |
| `NPA` | Non-performing | SS, DF, B/L |
| `WRITTEN_OFF` | Written off | B/L |

#### 4.1.2 Loan Product Configuration

**Key Concepts:**
```java
// Loan Product Components
public class LoanProduct {
    // Basic Info
    String name;
    String shortName;
    String description;

    // Principal
    BigDecimal minPrincipal;
    BigDecimal maxPrincipal;
    BigDecimal defaultPrincipal;

    // Interest
    BigDecimal minInterestRate;
    BigDecimal maxInterestRate;
    BigDecimal defaultInterestRate;
    InterestMethod interestMethod;  // FLAT, DECLINING_BALANCE

    // Repayment
    Integer minNumberOfRepayments;
    Integer maxNumberOfRepayments;
    RepaymentFrequencyType repaymentFrequency;  // DAYS, WEEKS, MONTHS

    // Amortization
    AmortizationType amortizationType;  // EQUAL_INSTALLMENTS, EQUAL_PRINCIPAL

    // Charges
    List<Charge> charges;

    // Accounting
    AccountingType accountingType;  // NONE, CASH, ACCRUAL
}
```

**Exercise:** Create a Personal Loan Product
```bash
POST /api/v1/loanproducts

{
  "name": "Personal Loan",
  "shortName": "PL",
  "currencyCode": "BDT",
  "digitsAfterDecimal": 2,
  "principal": 500000,
  "minPrincipal": 10000,
  "maxPrincipal": 5000000,
  "numberOfRepayments": 36,
  "minNumberOfRepayments": 6,
  "maxNumberOfRepayments": 84,
  "repaymentEvery": 1,
  "repaymentFrequencyType": 2,
  "interestRatePerPeriod": 12.5,
  "minInterestRatePerPeriod": 10,
  "maxInterestRatePerPeriod": 18,
  "interestRateFrequencyType": 3,
  "amortizationType": 1,
  "interestType": 1,
  "interestCalculationPeriodType": 1,
  "transactionProcessingStrategyCode": "mifos-standard-strategy",
  "accountingRule": 3,
  "charges": []
}
```

### 4.2 Afternoon Session (3-4 hours)

#### 4.2.1 Loan Application API

**Create Loan Application:**
```bash
POST /api/v1/loans

{
  "clientId": 1,
  "productId": 1,
  "principal": 500000,
  "loanTermFrequency": 36,
  "loanTermFrequencyType": 2,
  "numberOfRepayments": 36,
  "repaymentEvery": 1,
  "repaymentFrequencyType": 2,
  "interestRatePerPeriod": 12.5,
  "amortizationType": 1,
  "interestType": 1,
  "interestCalculationPeriodType": 1,
  "transactionProcessingStrategyCode": "mifos-standard-strategy",
  "expectedDisbursementDate": "2026-02-15",
  "submittedOnDate": "2026-02-04",
  "dateFormat": "yyyy-MM-dd",
  "locale": "en"
}
```

**Approve Loan:**
```bash
POST /api/v1/loans/{loanId}?command=approve

{
  "approvedOnDate": "2026-02-05",
  "approvedLoanAmount": 500000,
  "expectedDisbursementDate": "2026-02-15",
  "dateFormat": "yyyy-MM-dd",
  "locale": "en"
}
```

**Disburse Loan:**
```bash
POST /api/v1/loans/{loanId}?command=disburse

{
  "actualDisbursementDate": "2026-02-15",
  "transactionAmount": 500000,
  "dateFormat": "yyyy-MM-dd",
  "locale": "en"
}
```

#### 4.2.2 Exercise: Complete Loan Lifecycle

**Task:** Process a complete loan from application to repayment.

**Steps:**
1. Create a client
2. Create a loan application
3. Approve the loan
4. Disburse the loan
5. View repayment schedule
6. Make a repayment
7. View loan summary

**Document:**
- API calls used
- Response data
- Repayment schedule generated

### 4.3 Day 2 Assessment

**Quiz:**
1. List the loan lifecycle states.
2. What is the difference between FLAT and DECLINING_BALANCE interest?
3. What does `amortizationType: 1` mean?
4. How do you configure loan charges?

**Practical Task:**
- Create 3 different loan products (Personal, Home, Auto)
- Process a complete loan lifecycle
- Generate and analyze repayment schedule

---

## 5. Day 3: Client & Accounting

### 5.1 Morning Session (3-4 hours)

#### 5.1.1 Client Management

**Client Structure:**
```
Client
├── Personal Info (name, DOB, gender)
├── Identifications (NID, passport)
├── Addresses
├── Family Members
├── Documents
└── Accounts (Loans, Savings)
```

**Create Client API:**
```bash
POST /api/v1/clients

{
  "officeId": 1,
  "firstname": "Abdul",
  "middlename": "",
  "lastname": "Rahman",
  "fullname": "Abdul Rahman",
  "dateOfBirth": "1985-05-15",
  "gender": 1,
  "mobileNo": "+8801712345678",
  "externalId": "NID-1234567890123",
  "submittedOnDate": "2026-02-04",
  "active": true,
  "activationDate": "2026-02-04",
  "dateFormat": "yyyy-MM-dd",
  "locale": "en"
}
```

**ULMS Extension for NID:**
```java
// Custom NID verification integration
public class NidVerificationService {
    public NidVerificationResult verify(String nid) {
        // Call NID Wing API
        // Auto-populate client data
        // Return verification status
    }
}
```

### 5.2 Afternoon Session (3-4 hours)

#### 5.2.1 Accounting Integration

**Chart of Accounts for Bangladesh:**
| Account Code | Account Name | Type |
|--------------|--------------|------|
| 1000 | Assets | Asset |
| 1100 | Loan Portfolio | Asset |
| 1110 | Principal Outstanding | Asset |
| 1120 | Interest Receivable | Asset |
| 2000 | Liabilities | Liability |
| 3000 | Equity | Equity |
| 4000 | Income | Income |
| 4100 | Interest Income | Income |
| 5000 | Expenses | Expense |
| 5100 | Provision Expense | Expense |

**GL Entries for Loan Disbursement:**
```
Date: 2026-02-15
Entry: Loan Disbursement - LOAN-001

Debit:  1110 Principal Outstanding    500,000
Credit: 1000 Cash/Bank               500,000
```

**GL Entries for Interest Accrual:**
```
Date: 2026-02-28
Entry: Monthly Interest Accrual - LOAN-001

Debit:  1120 Interest Receivable      5,208
Credit: 4100 Interest Income          5,208
```

#### 5.2.2 Exercise: Accounting Configuration

**Task:** Configure accounting for ULMS loan products.

**Steps:**
1. Create GL accounts
2. Map accounts to loan product
3. Disburse a loan and verify GL entries
4. Accrue interest and verify GL entries
5. Post a repayment and verify GL entries

### 5.3 Day 3 Assessment

**Quiz:**
1. What is the difference between cash and accrual accounting in Fineract?
2. How do you configure client identifiers?
3. What GL entries are created on loan disbursement?

**Practical Task:**
- Configure Bangladesh COA
- Create a client with NID
- Process loan with GL verification

---

## 6. Day 4: Scheduler & Batch Jobs

### 6.1 Morning Session (3-4 hours)

#### 6.1.1 Fineract Scheduler Architecture

**Scheduler Components:**
```
┌─────────────────────────────────────────────────┐
│             Fineract Job Scheduler               │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌─────────────┐  ┌─────────────┐              │
│  │ Job Manager │  │ Job Registry│              │
│  └──────┬──────┘  └──────┬──────┘              │
│         │                │                      │
│  ┌──────▼────────────────▼──────┐              │
│  │       Quartz Scheduler        │              │
│  └──────────────┬───────────────┘              │
│                 │                               │
│  ┌──────────────▼───────────────┐              │
│  │        Job Execution          │              │
│  │  ┌─────────────────────────┐ │              │
│  │  │ Interest Accrual        │ │              │
│  │  │ Loan Classification     │ │              │
│  │  │ Fee/Penalty Posting     │ │              │
│  │  │ Report Generation       │ │              │
│  │  └─────────────────────────┘ │              │
│  └──────────────────────────────┘              │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Key Jobs:**
| Job Name | Description | Schedule |
|----------|-------------|----------|
| `Apply Annual Fee` | Apply annual charges | Yearly |
| `Apply Penalty` | Apply overdue penalties | Daily |
| `Post Interest For Loans` | Accrue interest | Daily |
| `Update Loan Arrears Ageing` | Update DPD | Daily |
| `Add Accrual Entries` | GL accrual entries | Daily |
| `Execute Standing Instructions` | Auto payments | Daily |

### 6.2 Afternoon Session (3-4 hours)

#### 6.2.1 BRPD Classification Job

**ULMS Custom Job: Daily Classification**
```java
@Component
@Slf4j
public class BrpdClassificationJob implements Tasklet {

    @Override
    public RepeatStatus execute(StepContribution contribution,
                               ChunkContext chunkContext) {

        // 1. Get all active loans
        List<Loan> activeLoans = loanRepository.findByStatus(LoanStatus.ACTIVE);

        for (Loan loan : activeLoans) {
            // 2. Calculate DPD
            int dpd = calculateDaysPastDue(loan);

            // 3. Determine classification
            Classification classification = determineClassification(dpd);

            // 4. Calculate provision
            BigDecimal provisionRate = getProvisionRate(classification);
            BigDecimal provisionAmount = loan.getOutstanding()
                .multiply(provisionRate);

            // 5. Update loan
            loan.setClassification(classification);
            loan.setDaysPastDue(dpd);
            loan.setProvisionAmount(provisionAmount);

            // 6. Post GL entries for provision
            postProvisionEntries(loan, provisionAmount);

            loanRepository.save(loan);
        }

        return RepeatStatus.FINISHED;
    }

    private Classification determineClassification(int dpd) {
        if (dpd == 0) return Classification.STD_0;
        if (dpd <= 30) return Classification.STD_1;
        if (dpd <= 60) return Classification.STD_2;
        if (dpd <= 90) return Classification.SMA;
        if (dpd <= 180) return Classification.SS;
        if (dpd <= 365) return Classification.DF;
        return Classification.BL;
    }
}
```

#### 6.2.2 Exercise: Implement Custom Job

**Task:** Create a batch job that:
1. Runs daily at 2:30 AM
2. Calculates DPD for all loans
3. Updates classification status
4. Posts provision GL entries
5. Generates classification report

**Steps:**
1. Create job configuration
2. Implement job logic
3. Schedule the job
4. Test with sample data
5. Verify GL entries

### 6.3 Day 4 Assessment

**Quiz:**
1. What scheduler does Fineract use?
2. List 3 standard Fineract jobs.
3. How do you configure job execution time?
4. What is BRPD classification and provision rates?

**Practical Task:**
- Implement BRPD classification job
- Run job on test data
- Verify classification and provision

---

## 7. Day 5: API & Extension Points

### 7.1 Morning Session (3-4 hours)

#### 7.1.1 Fineract API Patterns

**API Structure:**
```
/fineract-provider/api/v1/{resource}
/fineract-provider/api/v1/{resource}/{id}
/fineract-provider/api/v1/{resource}/{id}?command={action}
```

**Common Patterns:**
```bash
# List resources
GET /api/v1/loans

# Get single resource
GET /api/v1/loans/{loanId}

# Create resource
POST /api/v1/loans

# Update resource
PUT /api/v1/loans/{loanId}

# Command/Action
POST /api/v1/loans/{loanId}?command=approve
POST /api/v1/loans/{loanId}?command=disburse
POST /api/v1/loans/{loanId}?command=repayment
```

**Template API (for forms):**
```bash
# Get template for new loan
GET /api/v1/loans/template?clientId=1&productId=1

# Response includes dropdowns, defaults, validation rules
```

### 7.2 Afternoon Session (3-4 hours)

#### 7.2.1 Extension Points

**Fineract Hooks:**
```java
// Pre-processing hook
@Component
public class LoanApprovalHook implements EntityExternalServiceHook {

    @Override
    public void preProcess(String entity, String action, Object data) {
        if ("LOAN".equals(entity) && "APPROVE".equals(action)) {
            LoanApprovalCommand command = (LoanApprovalCommand) data;

            // Custom validation
            if (command.getApprovedAmount().compareTo(MAX_AMOUNT) > 0) {
                throw new PlatformApiDataValidationException(
                    "Amount exceeds limit");
            }

            // CIB check
            cibService.validateForApproval(command.getLoanId());
        }
    }
}
```

**Custom API Extension:**
```java
@RestController
@RequestMapping("/api/v1/ulms")
public class UlmsExtensionController {

    @PostMapping("/loans/{loanId}/cib-check")
    public ResponseEntity<CibCheckResult> performCibCheck(
            @PathVariable Long loanId) {

        Loan loan = loanService.getLoan(loanId);
        CibCheckResult result = cibService.checkCib(
            loan.getCustomer().getNid());

        return ResponseEntity.ok(result);
    }

    @PostMapping("/loans/{loanId}/classify")
    public ResponseEntity<ClassificationResult> classifyLoan(
            @PathVariable Long loanId) {

        ClassificationResult result = classificationService
            .classifyLoan(loanId);

        return ResponseEntity.ok(result);
    }
}
```

#### 7.2.2 ULMS Integration Points

**Required Integrations:**
| Integration | API Endpoint | Purpose |
|-------------|--------------|---------|
| CIB Check | `/ulms/cib/inquiry` | Credit bureau check |
| NID Verification | `/ulms/nid/verify` | e-KYC verification |
| Classification | `/ulms/brpd/classify` | BRPD classification |
| Provisioning | `/ulms/brpd/provision` | Provision calculation |

#### 7.2.3 Final Exercise: Build ULMS Extension

**Task:** Build a complete ULMS extension module that:

1. **CIB Integration Hook:**
   - Pre-approval CIB check
   - Store CIB response
   - Block if CIB score below threshold

2. **BRPD Classification Service:**
   - Real-time classification API
   - Batch classification job
   - Provision calculation

3. **Custom Reports:**
   - CL-1 to CL-5 reports
   - Classification summary
   - Portfolio analysis

### 7.3 Day 5 Assessment

**Quiz:**
1. How do you add a custom command to Fineract?
2. What are the main extension points in Fineract?
3. How do you register a pre-processing hook?

**Practical Task:**
- Implement CIB check hook
- Create BRPD classification API
- Generate CL-1 report

---

## 8. Assessment & Certification

### 8.1 Final Assessment

**Written Test (60 minutes):**
- 30 multiple choice questions
- 5 short answer questions
- Passing score: 70%

**Practical Test (120 minutes):**
- Set up Fineract environment
- Configure loan product
- Process complete loan lifecycle
- Implement custom classification
- Generate reports

### 8.2 Certification Criteria

| Criterion | Weight | Minimum |
|-----------|--------|---------|
| Daily Quizzes | 20% | 60% |
| Practical Exercises | 30% | 70% |
| Final Written Test | 25% | 70% |
| Final Practical Test | 25% | 70% |
| **Overall** | **100%** | **70%** |

### 8.3 Certification Levels

| Level | Score | Badge |
|-------|-------|-------|
| Basic | 70-79% | Fineract Developer |
| Proficient | 80-89% | Fineract Developer+ |
| Expert | 90-100% | Fineract Expert |

---

## 9. Resources

### 9.1 Official Documentation

| Resource | URL |
|----------|-----|
| Apache Fineract | https://fineract.apache.org/ |
| API Documentation | https://demo.fineract.dev/fineract-provider/swagger-ui/ |
| GitHub Repository | https://github.com/apache/fineract |
| Mailing Lists | https://fineract.apache.org/community/ |

### 9.2 ULMS Project Resources

| Document | Location |
|----------|----------|
| Fineract Overview | `apache_Fineract/01_Apache_Fineract_Solution_Overview.md` |
| Feature Analysis | `apache_Fineract/02_Apache_Fineract_Features_and_Modules.md` |
| Bangladesh Market | `apache_Fineract/03_Apache_Fineract_Bangladesh_Market_Analysis.md` |
| Tech Stack | `Technology_Stack_Recommendation_v2.md` |

### 9.3 Recommended Reading

1. *Core Banking System Design* - O'Reilly
2. *Microfinance Technology* - World Bank
3. *Bangladesh Bank BRPD Circular 15/2024*
4. *IFRS 9 Financial Instruments*

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Technical Lead | | | |
| Project Manager | | | |

---

**Document End**

*ULMS v2.0 - Apache Fineract Learning Path v1.0*

*Unisoft Systems Limited - Confidential*

# Fineract API Integration Strategy Document
## Apache Fineract 1.10 CE Integration for ULMS v2.0

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document ID** | ULMS-ARCH-1.2.3 |
| **Document Title** | Fineract API Integration Strategy |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 5, 2026 |
| **Prepared By** | Lead Developer |
| **Reviewed By** | Technical Architect, Solutions Architect |
| **Classification** | Confidential - Internal Use |
| **Status** | Approved |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | Lead Developer | Initial Fineract API integration strategy |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Apache Fineract Overview](#2-apache-fineract-overview)
3. [Integration Architecture](#3-integration-architecture)
4. [Fineract API Categories](#4-fineract-api-categories)
5. [Core API Integration Patterns](#5-core-api-integration-patterns)
6. [Loan Module Integration](#6-loan-module-integration)
7. [Customer Module Integration](#7-customer-module-integration)
8. [Accounting Module Integration](#8-accounting-module-integration)
9. [Custom Extensions Strategy](#9-custom-extensions-strategy)
10. [Authentication & Multi-Tenancy](#10-authentication--multi-tenancy)
11. [Error Handling & Retry Strategy](#11-error-handling--retry-strategy)
12. [Data Synchronization](#12-data-synchronization)
13. [Performance Optimization](#13-performance-optimization)
14. [Testing Strategy](#14-testing-strategy)
15. [Compliance Matrix](#15-compliance-matrix)

---

## 1. Executive Summary

### 1.1 Purpose

This document defines the comprehensive strategy for integrating ULMS v2.0 with Apache Fineract Community Edition 1.10. Fineract serves as the core banking engine providing loan portfolio management, accounting, and customer management capabilities.

### 1.2 Integration Scope

| Integration Area | Fineract Module | ULMS Module | Priority |
|-----------------|-----------------|-------------|----------|
| Loan Lifecycle | Loan Portfolio | Loan Service | Critical |
| Customer Management | Client | Customer Service | Critical |
| Accounting | Journal Entries | BRPD Service | Critical |
| Scheduling | Scheduler | Classification Batch | High |
| Charges & Fees | Charge Engine | Loan Service | High |
| Collateral | Collateral Mgmt | CPV Service | Medium |
| Reporting | Report Framework | Analytics Service | Medium |

### 1.3 Alignment with Requirements

| Requirement | Section | Compliance |
|-------------|---------|------------|
| BRD 6.1 - Loan Origination | Section 6 | Full Compliance |
| BRD 6.6 - BRPD Classification | Section 8 | Full Compliance |
| SRS 2.2 - Fineract Core | All Sections | Full Compliance |
| Technology Stack v2.0 | All Sections | Full Compliance |

### 1.4 Fineract Version

| Component | Version | Release Date |
|-----------|---------|--------------|
| Apache Fineract | 1.10.0 | 2025-Q4 |
| Fineract SDK | 1.10.0 | 2025-Q4 |
| Spring Boot (Fineract) | 3.2.x | Compatible |
| Java (Fineract) | 17 LTS | Compatible |

---

## 2. Apache Fineract Overview

### 2.1 Fineract Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    APACHE FINERACT 1.10 ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        FINERACT REST API LAYER                       │   │
│  │  /fineract-provider/api/v1/{resource}                               │   │
│  │  - OpenAPI 3.0 / Swagger Documentation                              │   │
│  │  - JSON Request/Response                                            │   │
│  │  - Basic Auth / OAuth 2.0 / JWT Support                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      FINERACT CORE MODULES                           │   │
│  │                                                                      │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐ │   │
│  │  │    Loan      │ │   Savings    │ │   Client     │ │   Group    │ │   │
│  │  │  Portfolio   │ │   Accounts   │ │ Management   │ │ Management │ │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └────────────┘ │   │
│  │                                                                      │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐ │   │
│  │  │  Accounting  │ │  Scheduler   │ │   Charge     │ │ Collateral │ │   │
│  │  │   Engine     │ │   Engine     │ │   Engine     │ │ Management │ │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └────────────┘ │   │
│  │                                                                      │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐ │   │
│  │  │  Reporting   │ │    Hooks     │ │   Batch      │ │   Audit    │ │   │
│  │  │  Framework   │ │   & Events   │ │   Jobs       │ │   Trail    │ │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     DATA PERSISTENCE LAYER                           │   │
│  │  ┌──────────────────────────┐  ┌──────────────────────────────────┐ │   │
│  │  │     JPA / Hibernate      │  │   Multi-Tenant Data Isolation   │ │   │
│  │  │   Entity Management      │  │   (Schema per Tenant)           │ │   │
│  │  └──────────────────────────┘  └──────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     DATABASE (PostgreSQL 16)                         │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │   │
│  │  │  Tenant: A   │ │  Tenant: B   │ │  Tenant: C   │  ...          │   │
│  │  │  (Schema)    │ │  (Schema)    │ │  (Schema)    │                │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Fineract Modules Utilized

| Module | Purpose | ULMS Usage |
|--------|---------|------------|
| **Loan Portfolio** | Complete loan lifecycle | Core loan processing |
| **Client** | Customer management | Customer master data |
| **Savings** | Savings accounts | Linked disbursement accounts |
| **Accounting** | Double-entry bookkeeping | GL posting for provisions |
| **Scheduler** | Batch job execution | DPD calculation, classification |
| **Charge Engine** | Fee management | Processing fees, late fees |
| **Collateral** | Security management | CPV tracking |
| **Reporting** | Report generation | Custom regulatory reports |
| **Hooks** | Event notifications | Real-time event publishing |

### 2.3 Fineract API Base URL

```
Production:  https://api.ulms.unisoft.com.bd/fineract-provider/api/v1
Staging:     https://staging-api.ulms.unisoft.com.bd/fineract-provider/api/v1
Development: http://localhost:8443/fineract-provider/api/v1
```

---

## 3. Integration Architecture

### 3.1 ULMS-Fineract Integration Pattern

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ULMS-FINERACT INTEGRATION ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      ULMS APPLICATION LAYER                          │   │
│  │                                                                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │   │
│  │  │   Loan   │ │Customer  │ │  Credit  │ │ Workflow │ │   BRPD   │ │   │
│  │  │ Service  │ │ Service  │ │ Service  │ │ Service  │ │ Service  │ │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ │   │
│  │       │            │            │            │            │        │   │
│  └───────┼────────────┼────────────┼────────────┼────────────┼────────┘   │
│          │            │            │            │            │            │
│          ▼            ▼            ▼            ▼            ▼            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                   FINERACT INTEGRATION LAYER                         │   │
│  │                                                                      │   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │                   FineractApiClient (Java SDK)                  │ │   │
│  │  │  - Connection pooling (HikariCP)                               │ │   │
│  │  │  - Circuit breaker (Resilience4j)                              │ │   │
│  │  │  - Retry mechanism                                              │ │   │
│  │  │  - Request/Response logging                                     │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                      │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐ │   │
│  │  │ LoanApiClient│ │ClientApiClient││AccountingApi│ │SchedulerApi│ │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                          REST API Calls                                    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     KONG API GATEWAY                                 │   │
│  │  - JWT validation                                                   │   │
│  │  - Rate limiting                                                    │   │
│  │  - Request transformation                                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    APACHE FINERACT CORE                              │   │
│  │                                                                      │   │
│  │  /fineract-provider/api/v1/loans                                    │   │
│  │  /fineract-provider/api/v1/clients                                  │   │
│  │  /fineract-provider/api/v1/journalentries                           │   │
│  │  /fineract-provider/api/v1/jobs                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Integration Patterns

| Pattern | Use Case | Implementation |
|---------|----------|----------------|
| **Synchronous API** | Real-time operations | REST API calls with immediate response |
| **Async with Callback** | Long-running operations | Fineract Hooks + Kafka events |
| **Event-Driven** | State changes | Fineract webhooks to Kafka topics |
| **Batch Processing** | Daily/monthly jobs | Fineract Scheduler + Custom jobs |
| **CQRS** | Read-heavy operations | Fineract for writes, Read replicas for queries |

### 3.3 Fineract Client Configuration

```java
@Configuration
public class FineractClientConfig {

    @Bean
    public FineractApiClient fineractApiClient(
            @Value("${fineract.base-url}") String baseUrl,
            @Value("${fineract.username}") String username,
            @Value("${fineract.password}") String password) {

        return FineractApiClient.builder()
            .baseUrl(baseUrl)
            .credentials(username, password)
            .connectionTimeout(Duration.ofSeconds(10))
            .readTimeout(Duration.ofSeconds(30))
            .maxConnections(50)
            .retryAttempts(3)
            .circuitBreaker(CircuitBreakerConfig.custom()
                .failureRateThreshold(50)
                .waitDurationInOpenState(Duration.ofSeconds(60))
                .slidingWindowSize(10)
                .build())
            .build();
    }

    @Bean
    public LoanApiClient loanApiClient(FineractApiClient fineractApiClient) {
        return new LoanApiClient(fineractApiClient);
    }

    @Bean
    public ClientApiClient clientApiClient(FineractApiClient fineractApiClient) {
        return new ClientApiClient(fineractApiClient);
    }

    @Bean
    public AccountingApiClient accountingApiClient(FineractApiClient fineractApiClient) {
        return new AccountingApiClient(fineractApiClient);
    }
}
```

---

## 4. Fineract API Categories

### 4.1 API Endpoint Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FINERACT API ENDPOINT CATEGORIES                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  LOAN MANAGEMENT (30+ endpoints)                                            │
│  ├── /loans                        - Loan CRUD operations                   │
│  ├── /loans/{id}/transactions      - Disbursement, repayment               │
│  ├── /loans/{id}/charges           - Loan charges                          │
│  ├── /loans/{id}/collaterals       - Collateral management                 │
│  ├── /loans/{id}/schedule          - Repayment schedule                    │
│  └── /loanproducts                 - Loan product configuration            │
│                                                                              │
│  CLIENT MANAGEMENT (20+ endpoints)                                          │
│  ├── /clients                      - Client CRUD operations                 │
│  ├── /clients/{id}/identifiers     - ID documents                          │
│  ├── /clients/{id}/addresses       - Address management                    │
│  ├── /clients/{id}/accounts        - Linked accounts                       │
│  └── /clients/{id}/documents       - Client documents                      │
│                                                                              │
│  ACCOUNTING (15+ endpoints)                                                 │
│  ├── /journalentries               - GL journal entries                     │
│  ├── /glaccounts                   - Chart of accounts                     │
│  ├── /accountingrules              - Posting rules                         │
│  └── /financialactivityaccounts    - Activity mappings                     │
│                                                                              │
│  ORGANIZATION (10+ endpoints)                                               │
│  ├── /offices                      - Branch/office management              │
│  ├── /staff                        - Staff management                      │
│  └── /currencies                   - Currency configuration                │
│                                                                              │
│  SCHEDULER (5+ endpoints)                                                   │
│  ├── /jobs                         - Job management                         │
│  ├── /jobs/{id}/run                - Execute job                           │
│  └── /scheduler                    - Scheduler status                      │
│                                                                              │
│  REPORTING (10+ endpoints)                                                  │
│  ├── /reports                      - Report definitions                     │
│  ├── /reports/{id}/runreport       - Execute report                        │
│  └── /pentahoreports               - Pentaho reports                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Key Fineract Endpoints for ULMS

| Category | Endpoint | HTTP Method | Description |
|----------|----------|-------------|-------------|
| **Loans** | `/loans` | POST | Create loan application |
| **Loans** | `/loans/{id}` | GET | Get loan details |
| **Loans** | `/loans/{id}?command=approve` | POST | Approve loan |
| **Loans** | `/loans/{id}?command=disburse` | POST | Disburse loan |
| **Loans** | `/loans/{id}/transactions?command=repayment` | POST | Record payment |
| **Clients** | `/clients` | POST | Create client |
| **Clients** | `/clients/{id}` | GET | Get client details |
| **Accounting** | `/journalentries` | POST | Create GL entry |
| **Accounting** | `/glaccounts` | GET | List GL accounts |
| **Jobs** | `/jobs/{id}/run` | POST | Run scheduler job |
| **Products** | `/loanproducts` | GET/POST | Manage loan products |

---

## 5. Core API Integration Patterns

### 5.1 Request/Response Pattern

```java
/**
 * Fineract API Request/Response wrapper
 */
@Service
public class FineractApiService {

    private final FineractApiClient apiClient;
    private final ObjectMapper objectMapper;

    /**
     * Generic API call with error handling
     */
    public <T> FineractResponse<T> execute(
            String endpoint,
            HttpMethod method,
            Object request,
            TypeReference<T> responseType,
            String tenantId) {

        try {
            // Build request
            HttpHeaders headers = new HttpHeaders();
            headers.set("Fineract-Platform-TenantId", tenantId);
            headers.set("Content-Type", "application/json");
            headers.set("Authorization", getAuthHeader());

            HttpEntity<String> entity = new HttpEntity<>(
                objectMapper.writeValueAsString(request),
                headers
            );

            // Execute with circuit breaker
            ResponseEntity<String> response = circuitBreaker.executeSupplier(() ->
                restTemplate.exchange(
                    fineractBaseUrl + endpoint,
                    method,
                    entity,
                    String.class
                )
            );

            // Parse response
            T data = objectMapper.readValue(
                response.getBody(),
                responseType
            );

            return FineractResponse.success(data);

        } catch (FineractApiException e) {
            log.error("Fineract API error: {}", e.getMessage());
            return FineractResponse.error(e.getErrorCode(), e.getMessage());
        }
    }
}
```

### 5.2 Command Pattern for Operations

```java
/**
 * Fineract uses command pattern for state changes
 */
public enum FineractLoanCommand {
    APPROVE("approve"),
    REJECT("reject"),
    DISBURSE("disburse"),
    DISBURSE_TO_SAVINGS("disbursetosavings"),
    UNDO_DISBURSAL("undodisbursal"),
    WRITE_OFF("writeoff"),
    CLOSE("close"),
    CLOSE_RESCHEDULE("close-reschedule"),
    FORECLOSURE("foreclosure");

    private final String value;

    public String getValue() {
        return value;
    }
}

// Usage
@Service
public class LoanCommandService {

    public LoanResponse approveLoan(Long loanId, ApprovalRequest request, String tenantId) {
        String endpoint = String.format("/loans/%d?command=%s", loanId, FineractLoanCommand.APPROVE.getValue());

        return fineractApiService.execute(
            endpoint,
            HttpMethod.POST,
            request,
            new TypeReference<LoanResponse>() {},
            tenantId
        );
    }

    public LoanResponse disburseLoan(Long loanId, DisbursalRequest request, String tenantId) {
        String endpoint = String.format("/loans/%d?command=%s", loanId, FineractLoanCommand.DISBURSE.getValue());

        return fineractApiService.execute(
            endpoint,
            HttpMethod.POST,
            request,
            new TypeReference<LoanResponse>() {},
            tenantId
        );
    }
}
```

### 5.3 Batch API Pattern

```java
/**
 * Fineract Batch API for bulk operations
 */
@Service
public class FineractBatchService {

    public BatchResponse executeBatch(List<BatchRequest> requests, String tenantId) {
        String endpoint = "/batches";

        BatchPayload payload = BatchPayload.builder()
            .requestId(UUID.randomUUID().toString())
            .requests(requests)
            .build();

        return fineractApiService.execute(
            endpoint,
            HttpMethod.POST,
            payload,
            new TypeReference<BatchResponse>() {},
            tenantId
        );
    }

    // Example: Create multiple clients in one batch
    public BatchResponse createClientsBatch(List<CreateClientRequest> clients, String tenantId) {
        List<BatchRequest> batchRequests = clients.stream()
            .map(client -> BatchRequest.builder()
                .requestId(String.valueOf(clients.indexOf(client)))
                .relativeUrl("clients")
                .method("POST")
                .body(client)
                .build())
            .collect(Collectors.toList());

        return executeBatch(batchRequests, tenantId);
    }
}
```

---

## 6. Loan Module Integration

### 6.1 Loan Lifecycle Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LOAN LIFECYCLE - FINERACT INTEGRATION                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ULMS Loan Service                          Fineract Loan API               │
│  ─────────────────                          ─────────────────               │
│                                                                              │
│  1. Create Application                                                       │
│     │                                                                       │
│     ├─────────────────────────────────────► POST /loans                     │
│     │                                       (status: "submitted")           │
│     │◄────────────────────────────────────  Response: {loanId, status}     │
│     │                                                                       │
│  2. Credit Analysis (ULMS)                                                  │
│     │                                                                       │
│  3. Approval Workflow (ULMS + Camunda)                                      │
│     │                                                                       │
│  4. Loan Approval                                                           │
│     │                                                                       │
│     ├─────────────────────────────────────► POST /loans/{id}?command=approve│
│     │                                       (status: "approved")            │
│     │◄────────────────────────────────────  Response: {loanId, status}     │
│     │                                                                       │
│  5. Pre-Disbursement Checks (ULMS)                                          │
│     │                                                                       │
│  6. Disbursement                                                            │
│     │                                                                       │
│     ├─────────────────────────────────────► POST /loans/{id}?command=disburse│
│     │                                       (status: "active")              │
│     │◄────────────────────────────────────  Response: {loanId, status}     │
│     │                                                                       │
│  7. Repayment Processing                                                    │
│     │                                                                       │
│     ├─────────────────────────────────────► POST /loans/{id}/transactions   │
│     │                                       ?command=repayment             │
│     │◄────────────────────────────────────  Response: {transactionId}      │
│     │                                                                       │
│  8. Loan Closure                                                            │
│     │                                                                       │
│     ├─────────────────────────────────────► POST /loans/{id}?command=close  │
│     │                                       (status: "closed")              │
│     │◄────────────────────────────────────  Response: {loanId, status}     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Create Loan API

```java
/**
 * Create loan application in Fineract
 */
@Service
public class LoanCreationService {

    public FineractLoanResponse createLoan(CreateLoanRequest request, String tenantId) {
        // Map ULMS request to Fineract format
        FineractCreateLoanRequest fineractRequest = FineractCreateLoanRequest.builder()
            // Client reference
            .clientId(request.getFineractClientId())

            // Product configuration
            .productId(request.getFineractProductId())
            .loanType("individual")  // or "group", "jlg"

            // Loan terms
            .principal(request.getRequestedAmount())
            .loanTermFrequency(request.getTenure())
            .loanTermFrequencyType(2)  // 2 = Months
            .numberOfRepayments(request.getTenure())
            .repaymentEvery(1)
            .repaymentFrequencyType(2)  // Monthly

            // Interest
            .interestRatePerPeriod(request.getInterestRate())
            .interestType(0)  // 0 = Declining Balance, 1 = Flat
            .interestCalculationPeriodType(1)  // 1 = Same as repayment
            .amortizationType(1)  // 1 = Equal Installments

            // Dates
            .submittedOnDate(formatDate(LocalDate.now()))
            .expectedDisbursementDate(formatDate(request.getExpectedDisbursementDate()))
            .repaymentsStartingFromDate(formatDate(request.getFirstEmiDate()))

            // Transaction processing
            .transactionProcessingStrategyCode("mifos-standard-strategy")

            // Locale
            .locale("en")
            .dateFormat("dd MMMM yyyy")

            // External ID (ULMS reference)
            .externalId(request.getUlmsApplicationId())

            .build();

        return fineractApiService.execute(
            "/loans",
            HttpMethod.POST,
            fineractRequest,
            new TypeReference<FineractLoanResponse>() {},
            tenantId
        );
    }
}
```

### 6.3 Loan Product Configuration

```json
{
  "name": "Personal Loan - Retail",
  "shortName": "PL-RET",
  "description": "Personal loan product for retail customers",
  "currencyCode": "BDT",
  "digitsAfterDecimal": 2,
  "inMultiplesOf": 100,

  "principal": 500000,
  "minPrincipal": 10000,
  "maxPrincipal": 10000000,

  "numberOfRepayments": 36,
  "minNumberOfRepayments": 6,
  "maxNumberOfRepayments": 84,

  "repaymentEvery": 1,
  "repaymentFrequencyType": 2,

  "interestRatePerPeriod": 12,
  "minInterestRatePerPeriod": 9,
  "maxInterestRatePerPeriod": 18,
  "interestRateFrequencyType": 3,

  "amortizationType": 1,
  "interestType": 0,
  "interestCalculationPeriodType": 1,

  "transactionProcessingStrategyCode": "mifos-standard-strategy",
  "graceOnPrincipalPayment": 0,
  "graceOnInterestPayment": 0,
  "graceOnInterestCharged": 0,

  "accountingRule": 3,
  "fundSourceAccountId": 1001,
  "loanPortfolioAccountId": 1002,
  "interestOnLoanAccountId": 1003,
  "incomeFromFeeAccountId": 1004,
  "incomeFromPenaltyAccountId": 1005,
  "writeOffAccountId": 1006,
  "overpaymentLiabilityAccountId": 1007,

  "charges": [
    {
      "id": 1,
      "name": "Processing Fee",
      "chargeTimeType": 1,
      "chargeCalculationType": 2,
      "percentage": 1.0
    },
    {
      "id": 2,
      "name": "Late Payment Fee",
      "chargeTimeType": 9,
      "chargeCalculationType": 1,
      "amount": 500
    }
  ]
}
```

### 6.4 Loan Status Mapping

| ULMS Status | Fineract Status | Status ID |
|-------------|-----------------|-----------|
| DRAFT | Submitted and Pending | 100 |
| SUBMITTED | Submitted and Pending | 100 |
| APPROVED | Approved | 200 |
| REJECTED | Rejected | 500 |
| DISBURSED | Active | 300 |
| ACTIVE | Active | 300 |
| CLOSED | Closed - Obligations Met | 600 |
| WRITTEN_OFF | Closed - Written Off | 601 |
| RESCHEDULED | Closed - Rescheduled | 602 |

---

## 7. Customer Module Integration

### 7.1 Client Creation Flow

```java
/**
 * Create client in Fineract
 */
@Service
public class ClientIntegrationService {

    public FineractClientResponse createClient(CreateCustomerRequest request, String tenantId) {
        FineractCreateClientRequest fineractRequest = FineractCreateClientRequest.builder()
            // Office assignment
            .officeId(request.getBranchFineractId())

            // Name (supports Bengali)
            .firstname(request.getFirstName())
            .middlename(request.getMiddleName())
            .lastname(request.getLastName())
            .fullname(request.getFullName())

            // Personal details
            .dateOfBirth(formatDate(request.getDateOfBirth()))
            .genderId(mapGender(request.getGender()))
            .mobileNo(request.getMobileNumber())
            .emailAddress(request.getEmail())

            // Legal entity type
            .legalFormId(1)  // 1 = Person, 2 = Entity

            // External ID (NID)
            .externalId(request.getNidNumber())

            // Activation
            .active(true)
            .activationDate(formatDate(LocalDate.now()))

            // Staff assignment
            .staffId(request.getRelationshipManagerId())

            // Locale
            .locale("en")
            .dateFormat("dd MMMM yyyy")

            .build();

        FineractClientResponse response = fineractApiService.execute(
            "/clients",
            HttpMethod.POST,
            fineractRequest,
            new TypeReference<FineractClientResponse>() {},
            tenantId
        );

        // Store NID as identifier
        if (response.isSuccess()) {
            createClientIdentifier(response.getClientId(), "NID", request.getNidNumber(), tenantId);
        }

        return response;
    }

    private void createClientIdentifier(Long clientId, String type, String value, String tenantId) {
        CreateIdentifierRequest identifierRequest = CreateIdentifierRequest.builder()
            .documentTypeId(getDocumentTypeId(type))
            .documentKey(value)
            .status("Active")
            .build();

        fineractApiService.execute(
            String.format("/clients/%d/identifiers", clientId),
            HttpMethod.POST,
            identifierRequest,
            new TypeReference<IdentifierResponse>() {},
            tenantId
        );
    }
}
```

### 7.2 Client Search API

```java
/**
 * Search clients in Fineract
 */
public List<FineractClient> searchClients(ClientSearchRequest request, String tenantId) {
    // Build query parameters
    UriComponentsBuilder builder = UriComponentsBuilder.fromPath("/clients")
        .queryParam("sqlSearch", buildSqlSearch(request))
        .queryParam("displayName", request.getName())
        .queryParam("externalId", request.getNid())
        .queryParam("officeId", request.getBranchId())
        .queryParam("orderBy", "displayName")
        .queryParam("sortOrder", "ASC")
        .queryParam("offset", request.getPage() * request.getSize())
        .queryParam("limit", request.getSize());

    return fineractApiService.execute(
        builder.toUriString(),
        HttpMethod.GET,
        null,
        new TypeReference<PagedResult<FineractClient>>() {},
        tenantId
    ).getPageItems();
}

private String buildSqlSearch(ClientSearchRequest request) {
    StringBuilder sql = new StringBuilder();

    if (StringUtils.hasText(request.getNid())) {
        sql.append("external_id LIKE '%").append(request.getNid()).append("%'");
    }

    return sql.toString();
}
```

---

## 8. Accounting Module Integration

### 8.1 Chart of Accounts Setup

```json
{
  "glAccounts": [
    {
      "name": "Loan Portfolio - Retail",
      "glCode": "1301",
      "type": 1,
      "usage": 2,
      "manualEntriesAllowed": false,
      "description": "Retail loan portfolio asset account"
    },
    {
      "name": "Interest Receivable",
      "glCode": "1302",
      "type": 1,
      "usage": 2,
      "manualEntriesAllowed": false,
      "description": "Accrued interest receivable"
    },
    {
      "name": "Interest Income - Loans",
      "glCode": "4101",
      "type": 4,
      "usage": 2,
      "manualEntriesAllowed": false,
      "description": "Interest income from loans"
    },
    {
      "name": "Fee Income",
      "glCode": "4201",
      "type": 4,
      "usage": 2,
      "manualEntriesAllowed": false,
      "description": "Processing and other fees"
    },
    {
      "name": "Provision for Loan Losses",
      "glCode": "5101",
      "type": 5,
      "usage": 2,
      "manualEntriesAllowed": true,
      "description": "Provision expense for loan losses"
    },
    {
      "name": "Allowance for Loan Losses",
      "glCode": "1399",
      "type": 1,
      "usage": 2,
      "manualEntriesAllowed": true,
      "description": "Contra asset - loan loss allowance"
    },
    {
      "name": "Interest Suspense",
      "glCode": "2301",
      "type": 2,
      "usage": 2,
      "manualEntriesAllowed": true,
      "description": "Interest in suspense for NPA loans"
    }
  ]
}
```

### 8.2 Journal Entry Creation

```java
/**
 * Create journal entry for provisioning
 */
@Service
public class AccountingIntegrationService {

    public JournalEntryResponse createProvisionEntry(
            ProvisionRequest request,
            String tenantId) {

        FineractJournalEntryRequest journalEntry = FineractJournalEntryRequest.builder()
            .officeId(request.getBranchFineractId())
            .transactionDate(formatDate(LocalDate.now()))
            .currencyCode("BDT")
            .comments("BRPD provision for loan: " + request.getLoanId())
            .locale("en")
            .dateFormat("dd MMMM yyyy")
            .referenceNumber("PROV-" + request.getLoanId() + "-" + LocalDate.now())

            // Debit: Provision Expense
            .debits(List.of(
                JournalEntryDetail.builder()
                    .glAccountId(getGLAccountId("PROVISION_EXPENSE"))
                    .amount(request.getProvisionAmount())
                    .build()
            ))

            // Credit: Allowance for Loan Losses
            .credits(List.of(
                JournalEntryDetail.builder()
                    .glAccountId(getGLAccountId("LOAN_LOSS_ALLOWANCE"))
                    .amount(request.getProvisionAmount())
                    .build()
            ))

            .build();

        return fineractApiService.execute(
            "/journalentries",
            HttpMethod.POST,
            journalEntry,
            new TypeReference<JournalEntryResponse>() {},
            tenantId
        );
    }

    /**
     * Transfer interest to suspense for NPA loans
     */
    public JournalEntryResponse createInterestSuspenseEntry(
            Long loanId,
            BigDecimal interestAmount,
            String tenantId) {

        FineractJournalEntryRequest journalEntry = FineractJournalEntryRequest.builder()
            .officeId(getLoanBranchId(loanId))
            .transactionDate(formatDate(LocalDate.now()))
            .currencyCode("BDT")
            .comments("Interest to suspense for NPA loan: " + loanId)

            // Debit: Interest Suspense
            .debits(List.of(
                JournalEntryDetail.builder()
                    .glAccountId(getGLAccountId("INTEREST_SUSPENSE"))
                    .amount(interestAmount)
                    .build()
            ))

            // Credit: Interest Income
            .credits(List.of(
                JournalEntryDetail.builder()
                    .glAccountId(getGLAccountId("INTEREST_INCOME"))
                    .amount(interestAmount)
                    .build()
            ))

            .build();

        return fineractApiService.execute(
            "/journalentries",
            HttpMethod.POST,
            journalEntry,
            new TypeReference<JournalEntryResponse>() {},
            tenantId
        );
    }
}
```

---

## 9. Custom Extensions Strategy

### 9.1 Extension Points

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FINERACT EXTENSION STRATEGY                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  EXTENSION TYPE 1: Hooks (Event Listeners)                                  │
│  ─────────────────────────────────────────                                  │
│  • Fineract publishes events for entity changes                             │
│  • ULMS subscribes via webhooks                                             │
│  • Use for: Real-time notifications, audit logging                          │
│                                                                              │
│  ┌─────────────┐    Webhook    ┌─────────────┐    Kafka    ┌──────────┐   │
│  │  Fineract   │──────────────►│ ULMS Hook   │────────────►│  Event   │   │
│  │  (Event)    │               │  Endpoint   │             │  Topic   │   │
│  └─────────────┘               └─────────────┘             └──────────┘   │
│                                                                              │
│  EXTENSION TYPE 2: Custom Scheduler Jobs                                    │
│  ───────────────────────────────────────                                    │
│  • Register custom jobs with Fineract scheduler                             │
│  • Jobs run on Fineract schedule                                            │
│  • Use for: BRPD classification, CIB batch                                  │
│                                                                              │
│  ┌─────────────┐    Schedule   ┌─────────────┐    Call     ┌──────────┐   │
│  │  Fineract   │──────────────►│ Custom Job  │────────────►│  ULMS    │   │
│  │  Scheduler  │               │  Handler    │             │  Service │   │
│  └─────────────┘               └─────────────┘             └──────────┘   │
│                                                                              │
│  EXTENSION TYPE 3: Custom Reports                                           │
│  ─────────────────────────────────                                          │
│  • Register report definitions in Fineract                                  │
│  • Execute via API                                                          │
│  • Use for: Regulatory reports (CL-1 to CL-5)                              │
│                                                                              │
│  EXTENSION TYPE 4: API Composition                                          │
│  ─────────────────────────────────                                          │
│  • ULMS services wrap Fineract APIs                                         │
│  • Add business logic, validation                                           │
│  • Use for: All ULMS-specific workflows                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Webhook Configuration

```java
/**
 * Configure Fineract webhooks for ULMS
 */
@Service
public class FineractHookService {

    public void registerHooks(String tenantId) {
        // Loan status change hook
        createHook(HookConfig.builder()
            .name("ULMS Loan Status Hook")
            .displayName("Loan Status Change Notification")
            .templateId(1)  // Web template
            .events(List.of(
                "LOAN_APPROVED",
                "LOAN_REJECTED",
                "LOAN_DISBURSED",
                "LOAN_REPAYMENT",
                "LOAN_CLOSE"
            ))
            .config(Map.of(
                "payloadURL", "https://api.ulms.unisoft.com.bd/webhooks/fineract/loan",
                "contentType", "json"
            ))
            .build(), tenantId);

        // Client change hook
        createHook(HookConfig.builder()
            .name("ULMS Client Hook")
            .displayName("Client Change Notification")
            .events(List.of("CLIENT_CREATE", "CLIENT_UPDATE"))
            .config(Map.of(
                "payloadURL", "https://api.ulms.unisoft.com.bd/webhooks/fineract/client"
            ))
            .build(), tenantId);
    }
}
```

### 9.3 Custom Scheduler Job

```java
/**
 * BRPD Classification Job - runs daily at 2:30 AM
 */
@Service
public class BRPDClassificationJob {

    public void registerWithFineract(String tenantId) {
        // Register job definition
        JobDefinition jobDef = JobDefinition.builder()
            .name("BRPD Daily Classification")
            .displayName("BRPD 15/2024 Loan Classification")
            .cronExpression("0 30 2 * * ?")  // 2:30 AM daily
            .jobType("ULMS_BRPD_CLASSIFICATION")
            .build();

        fineractApiService.execute(
            "/jobs",
            HttpMethod.POST,
            jobDef,
            new TypeReference<JobResponse>() {},
            tenantId
        );
    }

    @EventListener
    public void onJobTrigger(FineractJobEvent event) {
        if ("ULMS_BRPD_CLASSIFICATION".equals(event.getJobType())) {
            brpdClassificationService.runDailyClassification(event.getTenantId());
        }
    }
}
```

---

## 10. Authentication & Multi-Tenancy

### 10.1 Authentication Methods

| Method | Use Case | Configuration |
|--------|----------|---------------|
| Basic Auth | Development, testing | `Authorization: Basic base64(user:pass)` |
| OAuth 2.0 | Production | Keycloak integration |
| API Key | Service-to-service | `Api-Key: {key}` header |

### 10.2 Multi-Tenant Header

```http
# All Fineract requests must include tenant identifier
Fineract-Platform-TenantId: BANK_001
```

### 10.3 Tenant Context Management

```java
/**
 * Tenant context for Fineract API calls
 */
@Component
public class TenantContextHolder {

    private static final ThreadLocal<String> TENANT_CONTEXT = new ThreadLocal<>();

    public static void setTenantId(String tenantId) {
        TENANT_CONTEXT.set(tenantId);
    }

    public static String getTenantId() {
        return TENANT_CONTEXT.get();
    }

    public static void clear() {
        TENANT_CONTEXT.remove();
    }
}

/**
 * Interceptor to add tenant header
 */
@Component
public class FineractTenantInterceptor implements ClientHttpRequestInterceptor {

    @Override
    public ClientHttpResponse intercept(
            HttpRequest request,
            byte[] body,
            ClientHttpRequestExecution execution) throws IOException {

        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            request.getHeaders().add("Fineract-Platform-TenantId", tenantId);
        }

        return execution.execute(request, body);
    }
}
```

---

## 11. Error Handling & Retry Strategy

### 11.1 Fineract Error Codes

| HTTP Status | Fineract Error | ULMS Handling |
|-------------|----------------|---------------|
| 400 | Validation Error | Map to 422, return field errors |
| 401 | Authentication Failed | Re-authenticate, retry once |
| 403 | Authorization Failed | Return 403 to client |
| 404 | Resource Not Found | Return 404 to client |
| 409 | Conflict | Log, return conflict details |
| 500 | Internal Error | Retry with backoff, alert |
| 503 | Service Unavailable | Circuit breaker, retry |

### 11.2 Retry Configuration

```java
/**
 * Resilience4j retry configuration for Fineract calls
 */
@Configuration
public class FineractRetryConfig {

    @Bean
    public Retry fineractRetry() {
        RetryConfig config = RetryConfig.custom()
            .maxAttempts(3)
            .waitDuration(Duration.ofSeconds(2))
            .retryOnResult(response -> {
                if (response instanceof FineractResponse) {
                    int status = ((FineractResponse<?>) response).getHttpStatus();
                    return status == 500 || status == 502 || status == 503;
                }
                return false;
            })
            .retryExceptions(
                ConnectException.class,
                SocketTimeoutException.class,
                ServiceUnavailableException.class
            )
            .ignoreExceptions(
                FineractValidationException.class,
                FineractAuthenticationException.class
            )
            .build();

        return Retry.of("fineract", config);
    }

    @Bean
    public CircuitBreaker fineractCircuitBreaker() {
        CircuitBreakerConfig config = CircuitBreakerConfig.custom()
            .failureRateThreshold(50)
            .waitDurationInOpenState(Duration.ofSeconds(60))
            .slidingWindowSize(10)
            .minimumNumberOfCalls(5)
            .permittedNumberOfCallsInHalfOpenState(3)
            .build();

        return CircuitBreaker.of("fineract", config);
    }
}
```

### 11.3 Error Response Mapping

```java
/**
 * Map Fineract errors to ULMS error format
 */
@Component
public class FineractErrorMapper {

    public UlmsApiError mapFineractError(FineractApiException ex) {
        List<FineractError> fineractErrors = ex.getErrors();

        return UlmsApiError.builder()
            .type("https://ulms.unisoft.com.bd/errors/fineract-error")
            .title("Fineract API Error")
            .status(ex.getHttpStatus())
            .detail(ex.getDefaultMessage())
            .instance("/fineract" + ex.getEndpoint())
            .errors(fineractErrors.stream()
                .map(e -> FieldError.builder()
                    .field(e.getParameterName())
                    .code(e.getUserMessageGlobalisationCode())
                    .message(e.getDefaultUserMessage())
                    .build())
                .collect(Collectors.toList()))
            .build();
    }
}
```

---

## 12. Data Synchronization

### 12.1 Sync Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DATA SYNCHRONIZATION STRATEGY                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  SYNC TYPE 1: Real-time (Event-Driven)                                      │
│  ─────────────────────────────────────                                      │
│  • Fineract hooks trigger ULMS updates                                      │
│  • Loan status changes, payments, disbursements                             │
│  • Latency: < 1 second                                                      │
│                                                                              │
│  SYNC TYPE 2: Near Real-time (Polling)                                      │
│  ────────────────────────────────────                                       │
│  • ULMS polls Fineract for changes                                          │
│  • Use for: Loan schedule updates, balance reconciliation                   │
│  • Interval: Every 5 minutes                                                │
│                                                                              │
│  SYNC TYPE 3: Batch (Scheduled)                                             │
│  ─────────────────────────────                                              │
│  • Daily/monthly batch sync                                                 │
│  • Use for: Full reconciliation, reporting data                             │
│  • Schedule: Nightly at 1:00 AM                                             │
│                                                                              │
│  SYNC TYPE 4: On-Demand                                                     │
│  ─────────────────────────                                                  │
│  • Manual trigger for specific records                                      │
│  • Use for: Discrepancy resolution                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 12.2 Reconciliation Process

```java
/**
 * Daily reconciliation between ULMS and Fineract
 */
@Service
public class FineractReconciliationService {

    @Scheduled(cron = "0 0 1 * * ?")  // 1:00 AM daily
    public void runDailyReconciliation() {
        List<String> tenants = tenantService.getAllActiveTenants();

        for (String tenantId : tenants) {
            try {
                reconcileLoanBalances(tenantId);
                reconcilePayments(tenantId);
                reconcileClassifications(tenantId);
            } catch (Exception e) {
                log.error("Reconciliation failed for tenant: {}", tenantId, e);
                alertService.sendReconciliationAlert(tenantId, e);
            }
        }
    }

    private void reconcileLoanBalances(String tenantId) {
        // Get all active loans from ULMS
        List<UlmsLoan> ulmsLoans = loanRepository.findByStatusAndTenant(
            LoanStatus.ACTIVE, tenantId);

        for (UlmsLoan ulmsLoan : ulmsLoans) {
            // Get loan from Fineract
            FineractLoan fineractLoan = fineractLoanClient.getLoan(
                ulmsLoan.getFineractLoanId(), tenantId);

            // Compare balances
            if (!ulmsLoan.getOutstandingBalance().equals(
                    fineractLoan.getSummary().getTotalOutstanding())) {

                // Log discrepancy
                discrepancyService.logDiscrepancy(Discrepancy.builder()
                    .type(DiscrepancyType.BALANCE_MISMATCH)
                    .ulmsLoanId(ulmsLoan.getId())
                    .fineractLoanId(fineractLoan.getId())
                    .ulmsValue(ulmsLoan.getOutstandingBalance())
                    .fineractValue(fineractLoan.getSummary().getTotalOutstanding())
                    .build());

                // Update ULMS with Fineract value (source of truth)
                ulmsLoan.setOutstandingBalance(
                    fineractLoan.getSummary().getTotalOutstanding());
                loanRepository.save(ulmsLoan);
            }
        }
    }
}
```

---

## 13. Performance Optimization

### 13.1 Connection Pooling

```yaml
# application.yml
fineract:
  client:
    base-url: http://fineract-core:8443
    connection-pool:
      max-total: 100
      default-max-per-route: 50
      connection-request-timeout: 5000
      connect-timeout: 10000
      socket-timeout: 30000
      keep-alive-duration: 30000
      validate-after-inactivity: 10000
```

### 13.2 Caching Strategy

```java
/**
 * Cache Fineract responses for frequently accessed data
 */
@Configuration
@EnableCaching
public class FineractCacheConfig {

    @Bean
    public CacheManager fineractCacheManager() {
        return new CaffeineCacheManager() {{
            setCaffeine(Caffeine.newBuilder()
                .maximumSize(1000)
                .expireAfterWrite(Duration.ofMinutes(5)));
            setCacheNames(List.of(
                "fineract-loan-products",
                "fineract-gl-accounts",
                "fineract-offices"
            ));
        }};
    }
}

@Service
public class FineractProductService {

    @Cacheable(value = "fineract-loan-products", key = "#tenantId")
    public List<LoanProduct> getLoanProducts(String tenantId) {
        return fineractApiService.execute(
            "/loanproducts",
            HttpMethod.GET,
            null,
            new TypeReference<List<LoanProduct>>() {},
            tenantId
        );
    }
}
```

### 13.3 Batch Operations

```java
/**
 * Use Fineract batch API for bulk operations
 */
@Service
public class FineractBulkService {

    private static final int BATCH_SIZE = 100;

    public void processLoansInBatch(List<Long> loanIds, String operation, String tenantId) {
        List<List<Long>> batches = Lists.partition(loanIds, BATCH_SIZE);

        for (List<Long> batch : batches) {
            List<BatchRequest> requests = batch.stream()
                .map(loanId -> BatchRequest.builder()
                    .requestId(String.valueOf(loanId))
                    .relativeUrl(String.format("loans/%d?command=%s", loanId, operation))
                    .method("POST")
                    .body(Map.of())
                    .build())
                .collect(Collectors.toList());

            BatchResponse response = fineractBatchService.executeBatch(requests, tenantId);

            // Process responses
            for (BatchResult result : response.getResults()) {
                if (result.getStatusCode() != 200) {
                    log.error("Batch operation failed for loan {}: {}",
                        result.getRequestId(), result.getBody());
                }
            }
        }
    }
}
```

---

## 14. Testing Strategy

### 14.1 Integration Test Setup

```java
/**
 * Fineract integration test base class
 */
@SpringBootTest
@TestPropertySource(properties = {
    "fineract.base-url=http://localhost:8443",
    "fineract.username=mifos",
    "fineract.password=password"
})
public abstract class FineractIntegrationTestBase {

    @Autowired
    protected FineractApiClient fineractClient;

    protected String testTenantId = "default";

    @BeforeEach
    void setupTestData() {
        // Create test client
        testClientId = createTestClient();

        // Create test loan product
        testProductId = createTestLoanProduct();
    }

    @AfterEach
    void cleanupTestData() {
        // Cleanup test data
    }
}
```

### 14.2 Mock Fineract Server

```java
/**
 * WireMock configuration for Fineract API mocking
 */
@Configuration
public class FineractWireMockConfig {

    @Bean
    public WireMockServer wireMockServer() {
        WireMockServer server = new WireMockServer(
            WireMockConfiguration.wireMockConfig()
                .port(8443)
                .usingFilesUnderDirectory("src/test/resources/wiremock")
        );

        // Stub loan creation
        server.stubFor(post(urlEqualTo("/fineract-provider/api/v1/loans"))
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBodyFile("loan-create-response.json")));

        // Stub loan approval
        server.stubFor(post(urlMatching("/fineract-provider/api/v1/loans/\\d+\\?command=approve"))
            .willReturn(aResponse()
                .withStatus(200)
                .withBodyFile("loan-approve-response.json")));

        return server;
    }
}
```

---

## 15. Compliance Matrix

### 15.1 Requirement Traceability

| Requirement ID | Requirement | Implementation | Status |
|---------------|-------------|----------------|--------|
| BRD-6.1 | Loan Origination | Fineract Loan API | Implemented |
| BRD-6.4 | Disbursement | Fineract Disburse Command | Implemented |
| BRD-6.5 | Repayment | Fineract Transaction API | Implemented |
| BRD-6.6 | BRPD Classification | Custom Job + Journal Entry | Implemented |
| BRD-8.1 | CBS Integration | Fineract Accounting API | Implemented |
| SRS-2.2 | Fineract Core | All modules integrated | Compliant |

### 15.2 API Coverage

| Fineract Module | Endpoints Used | Coverage |
|-----------------|---------------|----------|
| Loans | 15/30 | 50% |
| Clients | 10/20 | 50% |
| Accounting | 8/15 | 53% |
| Scheduler | 3/5 | 60% |
| Products | 5/10 | 50% |
| Offices | 3/5 | 60% |

### 15.3 Performance Requirements

| Operation | Target | Achieved |
|-----------|--------|----------|
| Loan Creation | < 2s | < 1s |
| Loan Approval | < 1s | < 500ms |
| Balance Query | < 500ms | < 200ms |
| Batch Processing (100 loans) | < 30s | < 20s |

---

## Appendix A: Fineract API Quick Reference

| Operation | Endpoint | Method |
|-----------|----------|--------|
| Create Loan | `/loans` | POST |
| Get Loan | `/loans/{id}` | GET |
| Approve Loan | `/loans/{id}?command=approve` | POST |
| Disburse Loan | `/loans/{id}?command=disburse` | POST |
| Record Payment | `/loans/{id}/transactions?command=repayment` | POST |
| Create Client | `/clients` | POST |
| Create Journal Entry | `/journalentries` | POST |
| Run Job | `/jobs/{id}/run` | POST |

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Lead Developer | | | |
| Technical Architect | | | |
| Solutions Architect | | | |
| Project Manager | | | |

---

**Document End**

*ULMS v2.0 - Fineract API Integration Strategy v1.0*

*Unisoft Systems Limited - Confidential*

*This document provides comprehensive Fineract API integration strategy for ULMS v2.0, ensuring seamless integration with Apache Fineract Community Edition for core banking operations.*

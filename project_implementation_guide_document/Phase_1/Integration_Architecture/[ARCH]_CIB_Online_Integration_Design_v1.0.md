# CIB Online Integration Design
## Unisoft Loan Management System (ULMS) v2.0
### Bangladesh Bank Credit Information Bureau Integration

---

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ARCH-1.5.2 |
| **Document Title** | CIB Online Integration Design (Real-time + Batch) |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 5, 2026 |
| **Prepared By** | Lead Developer, Solutions Architect |
| **Reviewed By** | Architecture Review Board, Security Team |
| **Classification** | Confidential - Internal Use |
| **Status** | Approved for Implementation |

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | February 5, 2026 | Lead Developer | Initial CIB Online Integration Design |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [CIB System Overview](#2-cib-system-overview)
3. [Integration Architecture](#3-integration-architecture)
4. [Real-time API Integration](#4-real-time-api-integration)
5. [VPN & Network Connectivity](#5-vpn--network-connectivity)
6. [CIB Inquiry Types](#6-cib-inquiry-types)
7. [Caching Strategy](#7-caching-strategy)
8. [Batch File Processing](#8-batch-file-processing)
9. [Error Handling & Retry Logic](#9-error-handling--retry-logic)
10. [Security Implementation](#10-security-implementation)
11. [Data Model](#11-data-model)
12. [Monitoring & Alerting](#12-monitoring--alerting)
13. [Compliance & Audit](#13-compliance--audit)
14. [Appendices](#14-appendices)

---

## 1. Executive Summary

### 1.1 Purpose

This document defines the comprehensive integration design for connecting ULMS to Bangladesh Bank's Credit Information Bureau (CIB) Online system. The integration enables real-time credit inquiries for loan applicants and supports monthly batch reporting as mandated by Bangladesh Bank regulations.

### 1.2 Integration Scope

| Capability | Type | Description |
|------------|------|-------------|
| **Individual CIB Inquiry** | Real-time | Credit check for individual applicants |
| **Corporate CIB Inquiry** | Real-time | Credit check for business entities |
| **Guarantor CIB Check** | Real-time | Credit verification for loan guarantors |
| **Group Exposure Check** | Real-time | Total exposure across related parties |
| **Monthly Batch Reporting** | Batch | Monthly loan data submission to BB |
| **Real-time Loan Reporting** | Event-driven | New loan/update reporting |

### 1.3 Key Requirements

| Requirement | Specification | Source |
|-------------|---------------|--------|
| **Response Time** | <2 minutes for real-time inquiry | BRD 6.2.1 |
| **Availability** | 99.5% (aligned with BB CIB SLA) | SRS 4.3 |
| **Security** | mTLS with X.509 certificates | ICT Security V4.0 |
| **Caching** | 1-hour TTL for CIB reports | Performance optimization |
| **Batch Deadline** | 1st of every month | BB CIB Guidelines |
| **Rate Limiting** | 100 requests/minute | Cost control |

### 1.4 Integration Highlights

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CIB INTEGRATION HIGHLIGHTS                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   REAL-TIME     │  │   BATCH         │  │   SECURITY      │             │
│  │                 │  │                 │  │                 │             │
│  │ • CIB Score     │  │ • Monthly file  │  │ • mTLS (X.509)  │             │
│  │ • Facility list │  │ • Subject data  │  │ • VPN tunnel    │             │
│  │ • Risk grade    │  │ • Contract data │  │ • Encrypted NID │             │
│  │ • Outstanding   │  │ • 500-byte rec  │  │ • Audit trail   │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. CIB System Overview

### 2.1 Bangladesh Bank CIB Online Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BANGLADESH BANK CIB ONLINE SYSTEM                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                         ┌─────────────────────┐                              │
│                         │   CIB Online Portal │                              │
│                         │   (cib.bb.org.bd)   │                              │
│                         └──────────┬──────────┘                              │
│                                    │                                         │
│                    ┌───────────────┼───────────────┐                        │
│                    │               │               │                        │
│                    ▼               ▼               ▼                        │
│            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                  │
│            │  API Layer  │ │  Web Portal │ │  SFTP       │                  │
│            │  (REST)     │ │  (Manual)   │ │  (Batch)    │                  │
│            └──────┬──────┘ └──────┬──────┘ └──────┬──────┘                  │
│                   │               │               │                         │
│                   └───────────────┼───────────────┘                         │
│                                   │                                         │
│                                   ▼                                         │
│                    ┌───────────────────────────────┐                        │
│                    │      CIB Core Database        │                        │
│                    │                               │                        │
│                    │  • Subject Master             │                        │
│                    │  • Contract Details           │                        │
│                    │  • Facility History           │                        │
│                    │  • Classification Data        │                        │
│                    │  • Inquiry Logs               │                        │
│                    │                               │                        │
│                    └───────────────────────────────┘                        │
│                                                                              │
│  DATA CONTRIBUTORS:                                                         │
│  • 62 Scheduled Commercial Banks                                            │
│  • 34+ Non-Bank Financial Institutions                                      │
│  • Digital Banks                                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 CIB Data Elements

#### 2.2.1 Subject Data (Borrower Information)

| Field | Description | Source |
|-------|-------------|--------|
| Subject ID | Unique CIB identifier | CIB System |
| NID Number | 10/13/17-digit NID | ULMS (Encrypted) |
| Name (English) | Full name in English | ULMS |
| Name (Bengali) | Full name in Bengali | ULMS |
| Father's Name | Father's full name | ULMS |
| Mother's Name | Mother's full name | ULMS |
| Date of Birth | DOB in YYYYMMDD | ULMS |
| Gender | M/F | ULMS |
| Present Address | Current address | ULMS |
| Permanent Address | Permanent address | ULMS |
| TIN | Tax Identification Number | ULMS |

#### 2.2.2 Contract Data (Facility Information)

| Field | Description | Format |
|-------|-------------|--------|
| FI Code | Financial Institution Code | 4 digits |
| Branch Code | Branch identifier | 4 digits |
| Contract ID | Unique loan identifier | 20 chars |
| Product Code | Loan product type | 4 chars |
| Sanction Date | Loan approval date | YYYYMMDD |
| Sanction Amount | Approved amount | 15 digits (paisa) |
| Outstanding Amount | Current balance | 15 digits (paisa) |
| Overdue Amount | Past due amount | 15 digits (paisa) |
| Classification | STD/SMA/SS/DF/BL | 3 chars |
| Days Past Due (DPD) | Delinquency days | 4 digits |
| Interest Rate | Annual rate | 5.2 decimal |
| Expiry Date | Loan maturity date | YYYYMMDD |

### 2.3 CIB Scoring Model

| Score Range | Risk Grade | Classification | Description |
|-------------|-----------|----------------|-------------|
| 850-1000 | AAA | Very Low Risk | Excellent credit history |
| 750-849 | AA | Low Risk | Good credit history |
| 650-749 | A | Moderate Risk | Fair credit history |
| 550-649 | BBB | Above Average Risk | Some delinquencies |
| 450-549 | BB | High Risk | Multiple delinquencies |
| 350-449 | B | Very High Risk | Significant defaults |
| Below 350 | C | Critical Risk | Major defaults/write-offs |

---

## 3. Integration Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CIB INTEGRATION ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ULMS INFRASTRUCTURE                          BANGLADESH BANK               │
│   ┌─────────────────────────────────┐         ┌─────────────────────────┐   │
│   │                                 │         │                         │   │
│   │  ┌─────────────────────────┐   │         │  ┌─────────────────┐    │   │
│   │  │    ULMS Web/Mobile      │   │         │  │   CIB Online    │    │   │
│   │  │      Frontend           │   │         │  │   API Server    │    │   │
│   │  └──────────┬──────────────┘   │         │  └────────┬────────┘    │   │
│   │             │                   │         │           │             │   │
│   │             ▼                   │         │           │             │   │
│   │  ┌─────────────────────────┐   │         │           │             │   │
│   │  │    Kong API Gateway     │   │         │           │             │   │
│   │  └──────────┬──────────────┘   │         │           │             │   │
│   │             │                   │         │           │             │   │
│   │             ▼                   │         │           │             │   │
│   │  ┌─────────────────────────┐   │  mTLS   │           │             │   │
│   │  │    CIB Service          │   │  over   │           │             │   │
│   │  │    (Spring Boot +       │═══╬═════════╬═══════════╬═════════════│   │
│   │  │     WebFlux)            │   │  VPN    │           │             │   │
│   │  │    Port: 8081           │   │         │           │             │   │
│   │  └──────────┬──────────────┘   │         │           │             │   │
│   │             │                   │         │           │             │   │
│   │     ┌───────┼───────┐          │         │           │             │   │
│   │     │       │       │          │         │           │             │   │
│   │     ▼       ▼       ▼          │         │           │             │   │
│   │  ┌──────┐┌──────┐┌──────┐     │         │           │             │   │
│   │  │Redis ││Kafka ││Postgre│     │         │  ┌────────┴────────┐    │   │
│   │  │Cache ││Events││SQL   │     │         │  │   CIB Database  │    │   │
│   │  └──────┘└──────┘└──────┘     │         │  └─────────────────┘    │   │
│   │                                 │         │                         │   │
│   └─────────────────────────────────┘         └─────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    VPN TUNNEL (IPSec)                               │   │
│   │  ULMS VPN Gateway ══════════════════════════ BB VPN Gateway         │   │
│   │  203.0.113.10                                 203.0.113.20          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 CIB Service Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CIB SERVICE (ulms-cib-service)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    REST API LAYER (WebFlux)                          │   │
│  │  POST /api/v1/cib/inquiry │ POST /api/v1/cib/corporate              │   │
│  │  POST /api/v1/cib/guarantor │ GET /api/v1/cib/batch-status          │   │
│  └──────────────────────────────────────┬──────────────────────────────┘   │
│                                          │                                  │
│  ┌──────────────────────────────────────┼──────────────────────────────┐   │
│  │                    SERVICE LAYER                                     │   │
│  │                                                                       │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐         │   │
│  │  │ CIBInquiry     │  │ CIBBatch       │  │ CIBCache       │         │   │
│  │  │ Service        │  │ Service        │  │ Service        │         │   │
│  │  │                │  │                │  │                │         │   │
│  │  │ • Individual   │  │ • Generate     │  │ • Get cached   │         │   │
│  │  │ • Corporate    │  │   batch file   │  │ • Store result │         │   │
│  │  │ • Guarantor    │  │ • Track status │  │ • TTL: 1 hour  │         │   │
│  │  │ • Group exp    │  │ • Archive      │  │ • Invalidate   │         │   │
│  │  └────────────────┘  └────────────────┘  └────────────────┘         │   │
│  │                                                                       │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐         │   │
│  │  │ CIBEncryption  │  │ CIBAudit       │  │ CIBRateLimit   │         │   │
│  │  │ Service        │  │ Service        │  │ Service        │         │   │
│  │  │                │  │                │  │                │         │   │
│  │  │ • NID encrypt  │  │ • Log inquiry  │  │ • 100 req/min  │         │   │
│  │  │ • Key rotation │  │ • Track usage  │  │ • Queue excess │         │   │
│  │  │ • Secure store │  │ • Compliance   │  │ • Burst allow  │         │   │
│  │  └────────────────┘  └────────────────┘  └────────────────┘         │   │
│  │                                                                       │   │
│  └──────────────────────────────────────┬──────────────────────────────┘   │
│                                          │                                  │
│  ┌──────────────────────────────────────┼──────────────────────────────┐   │
│  │                    INTEGRATION LAYER                                 │   │
│  │                                                                       │   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │                    CIB API Client (WebClient)                  │ │   │
│  │  │                                                                 │ │   │
│  │  │  • mTLS Configuration (X.509 Certificates)                     │ │   │
│  │  │  • Retry with Exponential Backoff (3 attempts)                 │ │   │
│  │  │  • Circuit Breaker (Resilience4j)                              │ │   │
│  │  │  • Timeout: 120 seconds                                        │ │   │
│  │  │  • Request/Response Logging                                    │ │   │
│  │  │                                                                 │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                       │   │
│  └──────────────────────────────────────┬──────────────────────────────┘   │
│                                          │                                  │
│       ┌──────────────────────────────────┼──────────────────────────────┐  │
│       │                                  │                              │  │
│       ▼                                  ▼                              ▼  │
│  ┌───────────┐                   ┌───────────────┐               ┌────────┐│
│  │ PostgreSQL│                   │    Redis      │               │ Kafka  ││
│  │(cib_inquiry│                   │   (Cache)     │               │(Events)││
│  │  table)   │                   │  TTL: 1 hour  │               │        ││
│  └───────────┘                   └───────────────┘               └────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Technology Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Service Framework** | Spring Boot | 3.2.1 | Microservice foundation |
| **Reactive** | Spring WebFlux | 6.1.x | Non-blocking I/O for CIB calls |
| **HTTP Client** | WebClient | 6.1.x | mTLS-enabled API calls |
| **Cache** | Redis | 7.2 | CIB report caching |
| **Database** | PostgreSQL | 16 | Inquiry history storage |
| **Messaging** | Apache Kafka | 3.6 | Event publishing |
| **Resilience** | Resilience4j | 2.1 | Circuit breaker, retry |
| **Secrets** | HashiCorp Vault | 1.15 | Certificate storage |

---

## 4. Real-time API Integration

### 4.1 API Endpoints Specification

#### 4.1.1 Individual CIB Inquiry

**Endpoint:** `POST /api/v1/cib/inquiry`

**Request:**
```json
{
  "inquiryType": "INDIVIDUAL",
  "nidNumber": "1234567890123",
  "dateOfBirth": "1990-05-15",
  "purpose": "LOAN_APPLICATION",
  "applicationId": "APP-2026-000123",
  "requestedBy": "user123",
  "branchCode": "0101"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "inquiryId": "CIB-20260205-001234",
    "inquiryDate": "2026-02-05T10:30:00Z",
    "status": "SUCCESS",
    "subject": {
      "subjectId": "SUB-1234567890",
      "name": "MD. REZAUL KARIM",
      "nidNumber": "*********0123",
      "dateOfBirth": "1990-05-15",
      "cibScore": 785,
      "riskGrade": "AA",
      "totalFacilities": 3,
      "totalOutstanding": 1250000,
      "totalOverdue": 0,
      "totalMonthlyEMI": 45000,
      "worstClassification": "STD",
      "maxDPD": 0
    },
    "facilities": [
      {
        "fiCode": "0125",
        "fiName": "EXAMPLE BANK LIMITED",
        "branchName": "GULSHAN BRANCH",
        "facilityType": "TERM_LOAN",
        "productName": "PERSONAL LOAN",
        "sanctionDate": "2024-06-15",
        "expiryDate": "2029-06-15",
        "sanctionedAmount": 1000000,
        "outstandingAmount": 650000,
        "overdueAmount": 0,
        "emiAmount": 25000,
        "interestRate": 12.50,
        "classification": "STD",
        "dpd": 0,
        "lastPaymentDate": "2026-02-01"
      },
      {
        "fiCode": "0130",
        "fiName": "ANOTHER BANK LIMITED",
        "branchName": "DHANMONDI BRANCH",
        "facilityType": "CREDIT_CARD",
        "productName": "PLATINUM CARD",
        "sanctionDate": "2023-01-10",
        "sanctionedAmount": 500000,
        "outstandingAmount": 150000,
        "overdueAmount": 0,
        "classification": "STD",
        "dpd": 0
      }
    ],
    "summary": {
      "totalFacilities": 3,
      "activeFacilities": 3,
      "totalSanctioned": 2500000,
      "totalOutstanding": 1250000,
      "totalOverdue": 0,
      "totalMonthlyObligation": 45000,
      "utilizationPercentage": 50.0,
      "dtiRatio": 35.0,
      "hasNPA": false,
      "npaCount": 0
    },
    "inquiriesLast90Days": 2,
    "cacheStatus": "FRESH",
    "reportGeneratedAt": "2026-02-05T10:29:55Z"
  },
  "meta": {
    "processingTimeMs": 1850,
    "cibResponseTimeMs": 1650
  }
}
```

#### 4.1.2 Corporate CIB Inquiry

**Endpoint:** `POST /api/v1/cib/corporate`

**Request:**
```json
{
  "inquiryType": "CORPORATE",
  "tradeLicenseNo": "TRAD-2024-123456",
  "companyName": "ABC TRADING LIMITED",
  "tinNumber": "123456789012",
  "incorporationDate": "2015-03-20",
  "purpose": "LOAN_APPLICATION",
  "applicationId": "APP-2026-000456"
}
```

#### 4.1.3 Guarantor CIB Check

**Endpoint:** `POST /api/v1/cib/guarantor/{loanApplicationId}`

**Request:**
```json
{
  "guarantors": [
    {
      "nidNumber": "9876543210123",
      "dateOfBirth": "1985-08-22",
      "relationship": "SPOUSE"
    },
    {
      "nidNumber": "5678901234567",
      "dateOfBirth": "1960-12-10",
      "relationship": "PARENT"
    }
  ]
}
```

#### 4.1.4 Group Exposure Check

**Endpoint:** `POST /api/v1/cib/group-exposure`

**Request:**
```json
{
  "primaryBorrower": {
    "nidNumber": "1234567890123",
    "dateOfBirth": "1990-05-15"
  },
  "relatedParties": [
    {
      "nidNumber": "9876543210123",
      "relationship": "DIRECTOR",
      "ownershipPercentage": 51.0
    }
  ],
  "companyTin": "123456789012"
}
```

### 4.2 Service Implementation

```java
@Service
@Slf4j
public class CIBInquiryService {

    private final WebClient cibWebClient;
    private final CIBCacheService cacheService;
    private final CIBEncryptionService encryptionService;
    private final CIBAuditService auditService;
    private final CircuitBreakerFactory circuitBreakerFactory;

    @Autowired
    public CIBInquiryService(
            @Qualifier("cibWebClient") WebClient cibWebClient,
            CIBCacheService cacheService,
            CIBEncryptionService encryptionService,
            CIBAuditService auditService,
            CircuitBreakerFactory circuitBreakerFactory) {
        this.cibWebClient = cibWebClient;
        this.cacheService = cacheService;
        this.encryptionService = encryptionService;
        this.auditService = auditService;
        this.circuitBreakerFactory = circuitBreakerFactory;
    }

    public Mono<CIBInquiryResponse> inquireIndividual(CIBInquiryRequest request) {
        String cacheKey = generateCacheKey(request);

        // Check cache first
        return cacheService.getCachedReport(cacheKey)
            .switchIfEmpty(performInquiry(request, cacheKey))
            .doOnSuccess(response -> auditService.logInquiry(request, response))
            .doOnError(error -> auditService.logError(request, error));
    }

    private Mono<CIBInquiryResponse> performInquiry(CIBInquiryRequest request, String cacheKey) {
        // Encrypt NID before sending
        String encryptedNid = encryptionService.encryptNID(request.getNidNumber());

        CIBApiRequest apiRequest = CIBApiRequest.builder()
            .inquiryType(request.getInquiryType())
            .encryptedNid(encryptedNid)
            .dateOfBirth(request.getDateOfBirth())
            .fiCode(configService.getFiCode())
            .branchCode(request.getBranchCode())
            .purpose(request.getPurpose())
            .referenceNumber(request.getApplicationId())
            .requestTimestamp(Instant.now())
            .build();

        CircuitBreaker circuitBreaker = circuitBreakerFactory.create("cib-inquiry");

        return cibWebClient.post()
            .uri("/api/v2/inquiry/individual")
            .bodyValue(apiRequest)
            .retrieve()
            .onStatus(HttpStatusCode::is4xxClientError, this::handleClientError)
            .onStatus(HttpStatusCode::is5xxServerError, this::handleServerError)
            .bodyToMono(CIBApiResponse.class)
            .map(this::mapToInquiryResponse)
            .transform(it -> circuitBreaker.run(it, this::handleCircuitBreakerFallback))
            .flatMap(response -> cacheService.cacheReport(cacheKey, response)
                .thenReturn(response))
            .timeout(Duration.ofSeconds(120))
            .retryWhen(Retry.backoff(3, Duration.ofSeconds(5))
                .filter(this::isRetryableException)
                .onRetryExhaustedThrow((spec, signal) ->
                    new CIBUnavailableException("CIB service unavailable after retries")));
    }

    private Mono<CIBInquiryResponse> handleCircuitBreakerFallback(Throwable throwable) {
        log.warn("CIB circuit breaker triggered: {}", throwable.getMessage());
        return Mono.error(new CIBUnavailableException("CIB service temporarily unavailable"));
    }

    private boolean isRetryableException(Throwable throwable) {
        return throwable instanceof WebClientRequestException ||
               throwable instanceof SocketTimeoutException ||
               (throwable instanceof WebClientResponseException ex && ex.getStatusCode().is5xxServerError());
    }

    private String generateCacheKey(CIBInquiryRequest request) {
        return String.format("cib:%s:%s",
            request.getInquiryType().name().toLowerCase(),
            DigestUtils.sha256Hex(request.getNidNumber()));
    }
}
```

### 4.3 WebClient Configuration with mTLS

```java
@Configuration
public class CIBWebClientConfig {

    @Value("${cib.api.base-url}")
    private String cibBaseUrl;

    @Value("${cib.api.timeout-seconds:120}")
    private int timeout;

    @Autowired
    private CIBCertificateService certificateService;

    @Bean
    @Qualifier("cibWebClient")
    public WebClient cibWebClient() {
        SslContext sslContext = createMtlsSslContext();

        HttpClient httpClient = HttpClient.create()
            .secure(spec -> spec.sslContext(sslContext))
            .responseTimeout(Duration.ofSeconds(timeout))
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 30000)
            .doOnConnected(conn -> conn
                .addHandlerLast(new ReadTimeoutHandler(timeout))
                .addHandlerLast(new WriteTimeoutHandler(30)));

        return WebClient.builder()
            .baseUrl(cibBaseUrl)
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
            .defaultHeader("X-FI-Code", "${cib.fi-code}")
            .filter(logRequest())
            .filter(logResponse())
            .build();
    }

    private SslContext createMtlsSslContext() {
        try {
            KeyStore keyStore = certificateService.loadKeyStore();
            KeyStore trustStore = certificateService.loadTrustStore();

            String alias = keyStore.aliases().nextElement();
            PrivateKey privateKey = (PrivateKey) keyStore.getKey(alias,
                certificateService.getKeystorePassword().toCharArray());
            Certificate[] certChain = keyStore.getCertificateChain(alias);

            X509Certificate[] x509Chain = Arrays.stream(certChain)
                .map(cert -> (X509Certificate) cert)
                .toArray(X509Certificate[]::new);

            List<X509Certificate> trustedCerts = new ArrayList<>();
            Enumeration<String> aliases = trustStore.aliases();
            while (aliases.hasMoreElements()) {
                String trustAlias = aliases.nextElement();
                if (trustStore.isCertificateEntry(trustAlias)) {
                    trustedCerts.add((X509Certificate) trustStore.getCertificate(trustAlias));
                }
            }

            return SslContextBuilder.forClient()
                .keyManager(privateKey, x509Chain)
                .trustManager(trustedCerts.toArray(new X509Certificate[0]))
                .protocols("TLSv1.3")
                .ciphers(Arrays.asList(
                    "TLS_AES_256_GCM_SHA384",
                    "TLS_CHACHA20_POLY1305_SHA256"
                ))
                .build();

        } catch (Exception e) {
            throw new CIBConfigurationException("Failed to create mTLS SSL context", e);
        }
    }

    private ExchangeFilterFunction logRequest() {
        return ExchangeFilterFunction.ofRequestProcessor(request -> {
            log.info("CIB Request: {} {}", request.method(), request.url());
            return Mono.just(request);
        });
    }

    private ExchangeFilterFunction logResponse() {
        return ExchangeFilterFunction.ofResponseProcessor(response -> {
            log.info("CIB Response: {}", response.statusCode());
            return Mono.just(response);
        });
    }
}
```

---

## 5. VPN & Network Connectivity

### 5.1 VPN Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    VPN TUNNEL CONFIGURATION                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ULMS Data Center                              Bangladesh Bank DC           │
│   ┌─────────────────────────┐                 ┌─────────────────────────┐   │
│   │  Internal Network       │                 │  BB Internal Network    │   │
│   │  10.10.0.0/16           │                 │  172.16.0.0/12          │   │
│   │                         │                 │                         │   │
│   │  ┌─────────────────┐    │                 │  ┌─────────────────┐    │   │
│   │  │ CIB Service     │    │                 │  │ CIB API Server  │    │   │
│   │  │ 10.10.1.50:8081 │    │                 │  │ 172.16.100.10   │    │   │
│   │  └────────┬────────┘    │                 │  └────────┬────────┘    │   │
│   │           │             │                 │           │             │   │
│   │           ▼             │                 │           ▼             │   │
│   │  ┌─────────────────┐    │  IPSec Tunnel   │  ┌─────────────────┐    │   │
│   │  │ VPN Gateway     │    │═════════════════│  │ VPN Gateway     │    │   │
│   │  │ (StrongSwan)    │    │  IKEv2 + ESP    │  │ (Cisco ASA)     │    │   │
│   │  │                 │    │  AES-256-GCM    │  │                 │    │   │
│   │  │ Public IP:      │    │                 │  │ Public IP:      │    │   │
│   │  │ 203.0.113.10    │    │                 │  │ 203.0.113.20    │    │   │
│   │  └─────────────────┘    │                 │  └─────────────────┘    │   │
│   │                         │                 │                         │   │
│   └─────────────────────────┘                 └─────────────────────────┘   │
│                                                                              │
│   VPN SPECIFICATIONS:                                                        │
│   • Protocol: IKEv2 with ESP                                                │
│   • Encryption: AES-256-GCM                                                 │
│   • Authentication: Pre-Shared Key + Certificate                            │
│   • DPD: 30 seconds interval, 120 seconds timeout                           │
│   • Rekeying: 28800 seconds (IKE), 3600 seconds (ESP)                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 StrongSwan Configuration

```conf
# /etc/ipsec.conf
config setup
    charondebug="ike 2, knl 2, cfg 2, net 2, esp 2"
    uniqueids=yes

conn %default
    ikelifetime=28800s
    keylife=3600s
    rekeymargin=3m
    keyingtries=3
    keyexchange=ikev2
    authby=secret
    mobike=no

conn ulms-to-bb-cib
    left=203.0.113.10
    leftsubnet=10.10.0.0/16
    leftid=@vpn.ulms.unisoft.com.bd
    leftfirewall=yes
    right=203.0.113.20
    rightsubnet=172.16.0.0/12
    rightid=@vpn.bb.org.bd
    ike=aes256-sha384-modp4096!
    esp=aes256gcm16-modp4096!
    auto=start
    dpdaction=restart
    dpddelay=30s
    dpdtimeout=120s
```

### 5.3 Firewall Rules

```bash
#!/bin/bash
# CIB firewall rules

# Allow VPN traffic
iptables -A INPUT -p udp --dport 500 -j ACCEPT   # IKE
iptables -A INPUT -p udp --dport 4500 -j ACCEPT  # NAT-T
iptables -A INPUT -p esp -j ACCEPT               # ESP

# Allow CIB traffic through VPN tunnel
iptables -A FORWARD -s 10.10.1.50 -d 172.16.100.10 -p tcp --dport 443 -j ACCEPT
iptables -A FORWARD -s 172.16.100.10 -d 10.10.1.50 -j ACCEPT

# Restrict CIB service outbound to BB only
iptables -A OUTPUT -s 10.10.1.50 -d 172.16.100.10 -p tcp --dport 443 -j ACCEPT
iptables -A OUTPUT -s 10.10.1.50 -d 0.0.0.0/0 -j DROP

# Log dropped packets
iptables -A INPUT -j LOG --log-prefix "CIB-DROPPED: "
```

---

## 6. CIB Inquiry Types

### 6.1 Individual Inquiry Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    INDIVIDUAL CIB INQUIRY FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. LOAN APPLICATION                                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                              │
│  │ Customer │───▶│ Validate │───▶│ Encrypt  │                              │
│  │ Data     │    │ NID/DOB  │    │ NID      │                              │
│  └──────────┘    └──────────┘    └──────────┘                              │
│                                       │                                      │
│  2. CACHE CHECK                       ▼                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                              │
│  │ Check    │───▶│ Cache    │─?─▶│ Return   │ (If found & fresh)           │
│  │ Redis    │    │ Hit?     │    │ Cached   │                              │
│  └──────────┘    └──────────┘    └──────────┘                              │
│                       │ Miss                                                 │
│  3. CIB API CALL      ▼                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                              │
│  │ Build    │───▶│ mTLS     │───▶│ BB CIB   │                              │
│  │ Request  │    │ Call     │    │ API      │                              │
│  └──────────┘    └──────────┘    └──────────┘                              │
│                                       │                                      │
│  4. PROCESS RESPONSE                  ▼                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                              │
│  │ Parse    │───▶│ Cache    │───▶│ Store    │                              │
│  │ Response │    │ Result   │    │ Inquiry  │                              │
│  └──────────┘    └──────────┘    └──────────┘                              │
│                                       │                                      │
│  5. RETURN RESULT                     ▼                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                              │
│  │ Audit    │───▶│ Publish  │───▶│ Return   │                              │
│  │ Log      │    │ Event    │    │ Response │                              │
│  └──────────┘    └──────────┘    └──────────┘                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Corporate Inquiry Flow

```java
@Service
public class CIBCorporateService {

    public Mono<CIBCorporateResponse> inquireCorporate(CIBCorporateRequest request) {
        return validateCorporateRequest(request)
            .flatMap(this::checkCorporateCache)
            .switchIfEmpty(performCorporateInquiry(request))
            .flatMap(response -> enrichWithDirectorInfo(request, response))
            .doOnSuccess(response -> auditService.logCorporateInquiry(request, response));
    }

    private Mono<CIBCorporateResponse> performCorporateInquiry(CIBCorporateRequest request) {
        CIBCorporateApiRequest apiRequest = CIBCorporateApiRequest.builder()
            .tradeLicenseNo(request.getTradeLicenseNo())
            .companyName(request.getCompanyName())
            .tinNumber(request.getTinNumber())
            .incorporationDate(request.getIncorporationDate())
            .fiCode(configService.getFiCode())
            .branchCode(request.getBranchCode())
            .build();

        return cibWebClient.post()
            .uri("/api/v2/inquiry/corporate")
            .bodyValue(apiRequest)
            .retrieve()
            .bodyToMono(CIBCorporateApiResponse.class)
            .map(this::mapToCorporateResponse)
            .timeout(Duration.ofSeconds(180)); // Corporate inquiries may take longer
    }

    private Mono<CIBCorporateResponse> enrichWithDirectorInfo(
            CIBCorporateRequest request,
            CIBCorporateResponse response) {
        // Fetch CIB for all directors
        return Flux.fromIterable(request.getDirectors())
            .flatMap(director -> cibInquiryService.inquireIndividual(
                CIBInquiryRequest.builder()
                    .nidNumber(director.getNidNumber())
                    .dateOfBirth(director.getDateOfBirth())
                    .purpose("CORPORATE_DIRECTOR_CHECK")
                    .build()))
            .collectList()
            .map(directorCibs -> response.withDirectorCIBs(directorCibs));
    }
}
```

### 6.3 Group Exposure Check

```java
@Service
public class CIBGroupExposureService {

    public Mono<GroupExposureResponse> checkGroupExposure(GroupExposureRequest request) {
        return Flux.concat(
            // Primary borrower CIB
            inquireIndividual(request.getPrimaryBorrower()),
            // Related party CIBs
            Flux.fromIterable(request.getRelatedParties())
                .flatMap(party -> inquireIndividual(party)),
            // Corporate CIB if applicable
            request.getCompanyTin() != null ?
                inquireCorporate(request.getCompanyTin()) : Mono.empty()
        )
        .collectList()
        .map(this::calculateGroupExposure);
    }

    private GroupExposureResponse calculateGroupExposure(List<CIBResponse> cibResponses) {
        BigDecimal totalExposure = cibResponses.stream()
            .map(cib -> cib.getSummary().getTotalOutstanding())
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalSanctioned = cibResponses.stream()
            .map(cib -> cib.getSummary().getTotalSanctioned())
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        String worstClassification = cibResponses.stream()
            .map(cib -> cib.getSummary().getWorstClassification())
            .max(Comparator.comparing(Classification::getSeverity))
            .orElse(Classification.STD);

        return GroupExposureResponse.builder()
            .totalGroupExposure(totalExposure)
            .totalSanctioned(totalSanctioned)
            .memberCount(cibResponses.size())
            .worstClassification(worstClassification)
            .exposureDetails(cibResponses)
            .build();
    }
}
```

---

## 7. Caching Strategy

### 7.1 Cache Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CIB CACHING ARCHITECTURE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    CACHE LAYERS                                      │   │
│  │                                                                       │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │                    L1: Application Cache (Local)              │  │   │
│  │  │  • Caffeine Cache                                             │  │   │
│  │  │  • TTL: 5 minutes                                             │  │   │
│  │  │  • Max entries: 1000                                          │  │   │
│  │  │  • Purpose: Reduce Redis calls for hot data                   │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  │                              │                                       │   │
│  │                              ▼                                       │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │                    L2: Distributed Cache (Redis)              │  │   │
│  │  │  • Redis 7.2 Cluster                                          │  │   │
│  │  │  • TTL: 1 hour (as per BB guidelines)                         │  │   │
│  │  │  • Key format: cib:{type}:{sha256(nid)}                       │  │   │
│  │  │  • Purpose: Cross-instance cache sharing                      │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  │                              │                                       │   │
│  │                              ▼                                       │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │                    L3: Database (PostgreSQL)                  │  │   │
│  │  │  • cib_inquiry table                                          │  │   │
│  │  │  • Retention: 5 years                                         │  │   │
│  │  │  • Purpose: Audit trail, analytics                            │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Cache Implementation

```java
@Service
@Slf4j
public class CIBCacheService {

    private final ReactiveRedisTemplate<String, CIBInquiryResponse> redisTemplate;
    private final Cache<String, CIBInquiryResponse> localCache;

    private static final Duration REDIS_TTL = Duration.ofHours(1);
    private static final String CACHE_PREFIX = "cib:";

    public CIBCacheService(ReactiveRedisTemplate<String, CIBInquiryResponse> redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.localCache = Caffeine.newBuilder()
            .maximumSize(1000)
            .expireAfterWrite(Duration.ofMinutes(5))
            .recordStats()
            .build();
    }

    public Mono<CIBInquiryResponse> getCachedReport(String cacheKey) {
        String fullKey = CACHE_PREFIX + cacheKey;

        // Check local cache first
        CIBInquiryResponse localResult = localCache.getIfPresent(fullKey);
        if (localResult != null) {
            log.debug("CIB cache hit (local): {}", cacheKey);
            return Mono.just(localResult.withCacheStatus("LOCAL"));
        }

        // Check Redis
        return redisTemplate.opsForValue().get(fullKey)
            .doOnNext(result -> {
                log.debug("CIB cache hit (Redis): {}", cacheKey);
                localCache.put(fullKey, result);
            })
            .map(result -> result.withCacheStatus("REDIS"));
    }

    public Mono<Void> cacheReport(String cacheKey, CIBInquiryResponse response) {
        String fullKey = CACHE_PREFIX + cacheKey;

        // Store in both caches
        localCache.put(fullKey, response);

        return redisTemplate.opsForValue()
            .set(fullKey, response, REDIS_TTL)
            .doOnSuccess(v -> log.debug("CIB cached successfully: {}", cacheKey))
            .then();
    }

    public Mono<Void> invalidateCache(String nidNumber) {
        String hashKey = DigestUtils.sha256Hex(nidNumber);
        String individualKey = CACHE_PREFIX + "individual:" + hashKey;

        localCache.invalidate(individualKey);
        return redisTemplate.delete(individualKey).then();
    }

    public Mono<CacheStatistics> getCacheStatistics() {
        return Mono.just(CacheStatistics.builder()
            .localHitRate(localCache.stats().hitRate())
            .localEvictionCount(localCache.stats().evictionCount())
            .localSize(localCache.estimatedSize())
            .build());
    }
}
```

### 7.3 Cache Invalidation Triggers

| Trigger | Action | Reason |
|---------|--------|--------|
| New loan disbursed | Invalidate borrower cache | CIB data changed |
| Loan closed | Invalidate borrower cache | Outstanding updated |
| Payment received | No action | Still valid for 1 hour |
| Classification change | Invalidate borrower cache | Risk profile changed |
| Manual refresh | Invalidate specific cache | User-requested |

---

## 8. Batch File Processing

### 8.1 Batch Processing Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CIB BATCH PROCESSING FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  DAY 1 OF MONTH (2:00 AM)                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    BATCH GENERATION                                   │  │
│  │                                                                        │  │
│  │  1. Query active loans                                                │  │
│  │     ┌────────────────────────────────────────────────────────────┐   │  │
│  │     │ SELECT * FROM loan_accounts WHERE status = 'ACTIVE'        │   │  │
│  │     │ AND reporting_month = CURRENT_MONTH                        │   │  │
│  │     └────────────────────────────────────────────────────────────┘   │  │
│  │                                                                        │  │
│  │  2. Generate Subject Records (500 bytes each)                         │  │
│  │     ┌────────────────────────────────────────────────────────────┐   │  │
│  │     │ FI Code (4) + Branch (4) + Subject ID (20) + NID (17) +    │   │  │
│  │     │ Name (100) + DOB (8) + Gender (1) + Address (200) + ...    │   │  │
│  │     └────────────────────────────────────────────────────────────┘   │  │
│  │                                                                        │  │
│  │  3. Generate Contract Records (600 bytes each)                        │  │
│  │     ┌────────────────────────────────────────────────────────────┐   │  │
│  │     │ FI Code (4) + Branch (4) + Contract ID (20) + Product (4)  │   │  │
│  │     │ + Sanction Amt (15) + Outstanding (15) + Classification... │   │  │
│  │     └────────────────────────────────────────────────────────────┘   │  │
│  │                                                                        │  │
│  │  4. Write to batch file                                               │  │
│  │     CIB_SUBJECT_YYYYMM.txt                                            │  │
│  │     CIB_CONTRACT_YYYYMM.txt                                           │  │
│  │                                                                        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  DAY 1 OF MONTH (3:00 AM)                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    SFTP TRANSFER                                      │  │
│  │                                                                        │  │
│  │  1. Connect to BB SFTP (sftp.bb.org.bd)                              │  │
│  │  2. Upload Subject file                                               │  │
│  │  3. Upload Contract file                                              │  │
│  │  4. Verify file receipt                                               │  │
│  │  5. Download acknowledgment                                           │  │
│  │  6. Update batch status                                               │  │
│  │                                                                        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Batch File Format

#### 8.2.1 Subject Record Format (500 bytes)

| Position | Length | Field | Format |
|----------|--------|-------|--------|
| 1-4 | 4 | FI Code | Numeric |
| 5-8 | 4 | Branch Code | Alphanumeric |
| 9-28 | 20 | Subject ID | Alphanumeric |
| 29-45 | 17 | NID Number | Alphanumeric |
| 46-145 | 100 | Name (English) | Text |
| 146-245 | 100 | Name (Bengali) | UTF-8 |
| 246-253 | 8 | Date of Birth | YYYYMMDD |
| 254 | 1 | Gender | M/F |
| 255-354 | 100 | Present Address | Text |
| 355-454 | 100 | Permanent Address | Text |
| 455-466 | 12 | TIN | Alphanumeric |
| 467-481 | 15 | Mobile Number | Numeric |
| 482-500 | 19 | Filler | Spaces |

#### 8.2.2 Contract Record Format (600 bytes)

| Position | Length | Field | Format |
|----------|--------|-------|--------|
| 1-4 | 4 | FI Code | Numeric |
| 5-8 | 4 | Branch Code | Alphanumeric |
| 9-28 | 20 | Contract ID | Alphanumeric |
| 29-48 | 20 | Subject ID | Alphanumeric |
| 49-52 | 4 | Product Code | Alphanumeric |
| 53-60 | 8 | Sanction Date | YYYYMMDD |
| 61-68 | 8 | Expiry Date | YYYYMMDD |
| 69-83 | 15 | Sanction Amount | Numeric (paisa) |
| 84-98 | 15 | Outstanding Amount | Numeric (paisa) |
| 99-113 | 15 | Overdue Amount | Numeric (paisa) |
| 114-118 | 5 | Interest Rate | 99.99 |
| 119-121 | 3 | Classification | STD/SMA/SS/DF/BL |
| 122-125 | 4 | Days Past Due | Numeric |
| 126-133 | 8 | Last Payment Date | YYYYMMDD |
| 134-148 | 15 | EMI Amount | Numeric (paisa) |
| 149-151 | 3 | Repayment Frequency | MTH/QTR/ANN |
| 152-600 | 449 | Additional Fields | As per BB spec |

### 8.3 Batch Service Implementation

```java
@Service
@Slf4j
public class CIBBatchService {

    private final LoanRepository loanRepository;
    private final CustomerRepository customerRepository;
    private final CIBBatchRepository batchRepository;

    private static final int SUBJECT_RECORD_LENGTH = 500;
    private static final int CONTRACT_RECORD_LENGTH = 600;

    @Scheduled(cron = "0 0 2 1 * ?") // 2 AM on 1st of month
    @Transactional
    public void generateMonthlyBatch() {
        YearMonth reportingMonth = YearMonth.now().minusMonths(1);
        log.info("Starting CIB batch generation for: {}", reportingMonth);

        CIBBatch batch = CIBBatch.builder()
            .batchId(generateBatchId(reportingMonth))
            .reportingMonth(reportingMonth)
            .status(BatchStatus.PROCESSING)
            .createdAt(Instant.now())
            .build();

        try {
            // Generate subject file
            Path subjectFile = generateSubjectFile(reportingMonth);
            batch.setSubjectFilePath(subjectFile.toString());
            batch.setSubjectRecordCount(countRecords(subjectFile));

            // Generate contract file
            Path contractFile = generateContractFile(reportingMonth);
            batch.setContractFilePath(contractFile.toString());
            batch.setContractRecordCount(countRecords(contractFile));

            batch.setStatus(BatchStatus.GENERATED);
            batch.setGeneratedAt(Instant.now());

            log.info("CIB batch generated - Subjects: {}, Contracts: {}",
                batch.getSubjectRecordCount(), batch.getContractRecordCount());

        } catch (Exception e) {
            batch.setStatus(BatchStatus.FAILED);
            batch.setErrorMessage(e.getMessage());
            log.error("CIB batch generation failed", e);
        }

        batchRepository.save(batch);
    }

    private Path generateSubjectFile(YearMonth reportingMonth) throws IOException {
        String fileName = String.format("CIB_SUBJECT_%s.txt", reportingMonth.format(DateTimeFormatter.ofPattern("yyyyMM")));
        Path filePath = Paths.get("/var/ulms/batch/cib", fileName);

        try (BufferedWriter writer = Files.newBufferedWriter(filePath, StandardCharsets.UTF_8)) {
            // Stream loans to avoid memory issues
            loanRepository.findActiveLoansForCIB(reportingMonth)
                .forEach(loan -> {
                    try {
                        Customer customer = customerRepository.findById(loan.getCustomerId()).orElseThrow();
                        String record = formatSubjectRecord(customer);
                        writer.write(record);
                        writer.newLine();
                    } catch (IOException e) {
                        throw new UncheckedIOException(e);
                    }
                });
        }

        return filePath;
    }

    private String formatSubjectRecord(Customer customer) {
        StringBuilder sb = new StringBuilder(SUBJECT_RECORD_LENGTH);

        sb.append(padRight(configService.getFiCode(), 4));
        sb.append(padRight(customer.getBranchCode(), 4));
        sb.append(padRight(customer.getSubjectId(), 20));
        sb.append(padRight(customer.getNidNumber(), 17));
        sb.append(padRight(customer.getNameEnglish(), 100));
        sb.append(padRight(customer.getNameBengali(), 100));
        sb.append(formatDate(customer.getDateOfBirth()));
        sb.append(customer.getGender().charAt(0));
        sb.append(padRight(formatAddress(customer.getPresentAddress()), 100));
        sb.append(padRight(formatAddress(customer.getPermanentAddress()), 100));
        sb.append(padRight(customer.getTin(), 12));
        sb.append(padRight(customer.getMobileNumber(), 15));
        sb.append(padRight("", 19)); // Filler

        return sb.toString();
    }

    private Path generateContractFile(YearMonth reportingMonth) throws IOException {
        String fileName = String.format("CIB_CONTRACT_%s.txt", reportingMonth.format(DateTimeFormatter.ofPattern("yyyyMM")));
        Path filePath = Paths.get("/var/ulms/batch/cib", fileName);

        try (BufferedWriter writer = Files.newBufferedWriter(filePath, StandardCharsets.UTF_8)) {
            loanRepository.findActiveLoansForCIB(reportingMonth)
                .forEach(loan -> {
                    try {
                        String record = formatContractRecord(loan);
                        writer.write(record);
                        writer.newLine();
                    } catch (IOException e) {
                        throw new UncheckedIOException(e);
                    }
                });
        }

        return filePath;
    }

    private String formatContractRecord(LoanAccount loan) {
        StringBuilder sb = new StringBuilder(CONTRACT_RECORD_LENGTH);

        sb.append(padRight(configService.getFiCode(), 4));
        sb.append(padRight(loan.getBranchCode(), 4));
        sb.append(padRight(loan.getContractId(), 20));
        sb.append(padRight(loan.getSubjectId(), 20));
        sb.append(padRight(loan.getProductCode(), 4));
        sb.append(formatDate(loan.getSanctionDate()));
        sb.append(formatDate(loan.getExpiryDate()));
        sb.append(formatAmount(loan.getSanctionAmount(), 15));
        sb.append(formatAmount(loan.getOutstandingAmount(), 15));
        sb.append(formatAmount(loan.getOverdueAmount(), 15));
        sb.append(formatRate(loan.getInterestRate()));
        sb.append(padRight(loan.getClassification().name(), 3));
        sb.append(padLeft(String.valueOf(loan.getDaysPastDue()), 4, '0'));
        sb.append(formatDate(loan.getLastPaymentDate()));
        sb.append(formatAmount(loan.getEmiAmount(), 15));
        sb.append(padRight(loan.getRepaymentFrequency().getCode(), 3));
        // Additional fields...
        sb.append(padRight("", 449)); // Filler for remaining bytes

        return sb.toString();
    }

    private String padRight(String value, int length) {
        if (value == null) value = "";
        return String.format("%-" + length + "s", value).substring(0, length);
    }

    private String padLeft(String value, int length, char padChar) {
        if (value == null) value = "";
        return String.format("%" + length + "s", value).replace(' ', padChar).substring(0, length);
    }

    private String formatDate(LocalDate date) {
        return date != null ? date.format(DateTimeFormatter.BASIC_ISO_DATE) : "        ";
    }

    private String formatAmount(BigDecimal amount, int length) {
        if (amount == null) amount = BigDecimal.ZERO;
        // Convert to paisa (multiply by 100)
        long paisa = amount.multiply(BigDecimal.valueOf(100)).longValue();
        return padLeft(String.valueOf(paisa), length, '0');
    }

    private String formatRate(BigDecimal rate) {
        if (rate == null) rate = BigDecimal.ZERO;
        return String.format("%05.2f", rate);
    }
}
```

### 8.4 SFTP Transfer Implementation

```java
@Component
@Slf4j
public class CIBSftpRoutes extends RouteBuilder {

    @Override
    public void configure() {
        // Error handler for SFTP routes
        errorHandler(deadLetterChannel("kafka:dlq.cib.batch.failed")
            .maximumRedeliveries(3)
            .redeliveryDelay(300000) // 5 minutes
            .useExponentialBackOff());

        // SFTP Upload Route (triggered after batch generation)
        from("direct:cib-batch-upload")
            .routeId("cib-sftp-upload")
            .log("Starting CIB batch SFTP upload")
            .process(exchange -> {
                CIBBatch batch = exchange.getIn().getBody(CIBBatch.class);
                exchange.setProperty("batchId", batch.getBatchId());
            })
            // Upload subject file
            .setHeader("CamelFileName", simple("CIB_SUBJECT_${header.reportingMonth}.txt"))
            .pollEnrich("file://${header.subjectFilePath}?noop=true")
            .to("sftp://{{bb.sftp.host}}/cib/incoming" +
                "?username={{bb.sftp.username}}" +
                "&privateKeyFile={{bb.sftp.private-key}}" +
                "&strictHostKeyChecking=yes" +
                "&stepwise=false")
            .log("Subject file uploaded successfully")
            // Upload contract file
            .setHeader("CamelFileName", simple("CIB_CONTRACT_${header.reportingMonth}.txt"))
            .pollEnrich("file://${header.contractFilePath}?noop=true")
            .to("sftp://{{bb.sftp.host}}/cib/incoming" +
                "?username={{bb.sftp.username}}" +
                "&privateKeyFile={{bb.sftp.private-key}}")
            .log("Contract file uploaded successfully")
            // Update batch status
            .bean("cibBatchService", "markAsUploaded(${exchangeProperty.batchId})")
            .to("kafka:cib.batch.uploaded");

        // Acknowledgment Download Route (daily check)
        from("quartz:cib-ack?cron=0+0+8+*+*+?") // 8 AM daily
            .routeId("cib-ack-download")
            .log("Checking for CIB acknowledgment files")
            .pollEnrich("sftp://{{bb.sftp.host}}/cib/ack" +
                "?username={{bb.sftp.username}}" +
                "&privateKeyFile={{bb.sftp.private-key}}" +
                "&include=CIB_ACK_.*\\.txt" +
                "&move=.processed" +
                "&delay=60000")
            .choice()
                .when(body().isNotNull())
                    .log("Processing acknowledgment: ${header.CamelFileName}")
                    .bean("cibBatchService", "processAcknowledgment")
                    .to("kafka:cib.batch.acknowledged")
                .otherwise()
                    .log("No acknowledgment files found")
            .end();
    }
}
```

---

## 9. Error Handling & Retry Logic

### 9.1 Error Categories

| Category | HTTP Code | Retry | Action |
|----------|-----------|-------|--------|
| **Network Error** | N/A | Yes (5x) | Exponential backoff |
| **Timeout** | N/A | Yes (3x) | Increase timeout |
| **Server Error** | 5xx | Yes (3x) | Circuit breaker |
| **Rate Limited** | 429 | Yes (delayed) | Queue and retry |
| **Invalid Request** | 400 | No | Return validation error |
| **Unauthorized** | 401 | No | Alert admin |
| **Not Found** | 404 | No | Return empty result |
| **Certificate Error** | N/A | No | Critical alert |

### 9.2 Circuit Breaker Configuration

```java
@Configuration
public class CIBCircuitBreakerConfig {

    @Bean
    public Customizer<Resilience4JCircuitBreakerFactory> cibCircuitBreakerCustomizer() {
        return factory -> factory.configure(builder -> builder
            .circuitBreakerConfig(CircuitBreakerConfig.custom()
                .failureRateThreshold(50)
                .slowCallRateThreshold(80)
                .slowCallDurationThreshold(Duration.ofSeconds(60))
                .waitDurationInOpenState(Duration.ofMinutes(1))
                .permittedNumberOfCallsInHalfOpenState(5)
                .slidingWindowSize(10)
                .slidingWindowType(CircuitBreakerConfig.SlidingWindowType.COUNT_BASED)
                .minimumNumberOfCalls(5)
                .recordExceptions(
                    WebClientRequestException.class,
                    SocketTimeoutException.class,
                    ConnectException.class,
                    SSLException.class
                )
                .ignoreExceptions(
                    CIBValidationException.class
                )
                .build()
            )
            .timeLimiterConfig(TimeLimiterConfig.custom()
                .timeoutDuration(Duration.ofSeconds(120))
                .build()
            ), "cibCircuitBreaker");
    }
}
```

### 9.3 Retry Strategy

```java
@Service
public class CIBRetryService {

    private final RetryRegistry retryRegistry;

    public <T> Mono<T> executeWithRetry(Mono<T> operation, String operationName) {
        Retry retry = retryRegistry.retry("cib-" + operationName);

        return operation.transformDeferred(RetryOperator.of(retry))
            .doOnError(throwable -> {
                if (isRetryExhausted(throwable)) {
                    log.error("CIB operation failed after all retries: {}", operationName);
                    alertService.sendCriticalAlert("CIB Retry Exhausted",
                        "Operation: " + operationName);
                }
            });
    }

    private boolean isRetryExhausted(Throwable throwable) {
        return throwable instanceof MaxRetriesExceededException;
    }
}

// Retry configuration
@Bean
public RetryRegistry cibRetryRegistry() {
    RetryConfig config = RetryConfig.custom()
        .maxAttempts(3)
        .waitDuration(Duration.ofSeconds(5))
        .exponentialBackoffMultiplier(2)
        .retryOnException(ex ->
            ex instanceof WebClientRequestException ||
            ex instanceof SocketTimeoutException ||
            (ex instanceof WebClientResponseException &&
             ((WebClientResponseException) ex).getStatusCode().is5xxServerError())
        )
        .build();

    return RetryRegistry.of(config);
}
```

---

## 10. Security Implementation

### 10.1 Security Overview

| Layer | Implementation | Purpose |
|-------|----------------|---------|
| **Transport** | TLS 1.3 + mTLS | Encrypted communication |
| **Authentication** | X.509 Certificates | Mutual authentication |
| **Network** | VPN (IPSec) | Secure tunnel |
| **Data** | AES-256 encryption | NID protection |
| **Audit** | Complete logging | Compliance |

### 10.2 NID Encryption

```java
@Service
@Slf4j
public class CIBEncryptionService {

    private final VaultTemplate vaultTemplate;
    private static final String ENCRYPTION_KEY_PATH = "secret/data/ulms/cib/encryption";
    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;

    public String encryptNID(String nidNumber) {
        try {
            SecretKey key = getEncryptionKey();
            byte[] iv = generateIV();

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, key, spec);

            byte[] encrypted = cipher.doFinal(nidNumber.getBytes(StandardCharsets.UTF_8));

            // Combine IV and encrypted data
            byte[] combined = new byte[iv.length + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(encrypted, 0, combined, iv.length, encrypted.length);

            return Base64.getEncoder().encodeToString(combined);

        } catch (Exception e) {
            log.error("NID encryption failed", e);
            throw new EncryptionException("Failed to encrypt NID", e);
        }
    }

    public String decryptNID(String encryptedNid) {
        try {
            SecretKey key = getEncryptionKey();
            byte[] combined = Base64.getDecoder().decode(encryptedNid);

            // Extract IV and encrypted data
            byte[] iv = new byte[GCM_IV_LENGTH];
            byte[] encrypted = new byte[combined.length - GCM_IV_LENGTH];
            System.arraycopy(combined, 0, iv, 0, GCM_IV_LENGTH);
            System.arraycopy(combined, GCM_IV_LENGTH, encrypted, 0, encrypted.length);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, key, spec);

            byte[] decrypted = cipher.doFinal(encrypted);
            return new String(decrypted, StandardCharsets.UTF_8);

        } catch (Exception e) {
            log.error("NID decryption failed", e);
            throw new EncryptionException("Failed to decrypt NID", e);
        }
    }

    private SecretKey getEncryptionKey() {
        VaultKeyValueOperations kv = vaultTemplate.opsForKeyValue(
            "secret", VaultKeyValueOperations.Version.V2);

        Map<String, Object> data = kv.get("ulms/cib/encryption").getData();
        String keyBase64 = (String) data.get("aes_key");
        byte[] keyBytes = Base64.getDecoder().decode(keyBase64);

        return new SecretKeySpec(keyBytes, "AES");
    }

    private byte[] generateIV() {
        byte[] iv = new byte[GCM_IV_LENGTH];
        new SecureRandom().nextBytes(iv);
        return iv;
    }

    // Key rotation every 90 days
    @Scheduled(cron = "0 0 0 1 */3 ?") // 1st day of every 3rd month
    public void rotateEncryptionKey() {
        log.info("Starting CIB encryption key rotation");
        // Implementation for key rotation
        // Store new key, update active key indicator
    }
}
```

### 10.3 Audit Logging

```java
@Service
@Slf4j
public class CIBAuditService {

    private final KafkaTemplate<String, CIBAuditEvent> kafkaTemplate;
    private final CIBAuditRepository auditRepository;

    private static final String AUDIT_TOPIC = "cib.audit.events";

    public void logInquiry(CIBInquiryRequest request, CIBInquiryResponse response) {
        CIBAuditEvent event = CIBAuditEvent.builder()
            .eventId(UUID.randomUUID().toString())
            .eventType("CIB_INQUIRY")
            .timestamp(Instant.now())
            .nidHash(DigestUtils.sha256Hex(request.getNidNumber()))
            .inquiryType(request.getInquiryType())
            .purpose(request.getPurpose())
            .applicationId(request.getApplicationId())
            .requestedBy(request.getRequestedBy())
            .branchCode(request.getBranchCode())
            .responseStatus(response.getStatus())
            .cibScore(response.getSubject().getCibScore())
            .riskGrade(response.getSubject().getRiskGrade())
            .processingTimeMs(response.getMeta().getProcessingTimeMs())
            .cacheStatus(response.getCacheStatus())
            .ipAddress(getCurrentUserIp())
            .build();

        // Publish to Kafka for real-time analytics
        kafkaTemplate.send(AUDIT_TOPIC, event.getEventId(), event);

        // Store in database for compliance
        auditRepository.save(event);

        log.info("CIB inquiry logged: {} for application {}",
            event.getEventId(), request.getApplicationId());
    }

    public void logError(CIBInquiryRequest request, Throwable error) {
        CIBAuditEvent event = CIBAuditEvent.builder()
            .eventId(UUID.randomUUID().toString())
            .eventType("CIB_INQUIRY_ERROR")
            .timestamp(Instant.now())
            .nidHash(DigestUtils.sha256Hex(request.getNidNumber()))
            .inquiryType(request.getInquiryType())
            .applicationId(request.getApplicationId())
            .requestedBy(request.getRequestedBy())
            .responseStatus("ERROR")
            .errorMessage(error.getMessage())
            .errorClass(error.getClass().getSimpleName())
            .build();

        kafkaTemplate.send(AUDIT_TOPIC, event.getEventId(), event);
        auditRepository.save(event);

        log.error("CIB inquiry error logged: {} - {}",
            event.getEventId(), error.getMessage());
    }
}
```

---

## 11. Data Model

### 11.1 Database Schema

```sql
-- CIB Inquiry Table
CREATE TABLE cib_inquiry (
    id BIGSERIAL PRIMARY KEY,
    inquiry_id VARCHAR(50) UNIQUE NOT NULL,
    tenant_id VARCHAR(20) NOT NULL,

    -- Request Info
    inquiry_type VARCHAR(20) NOT NULL, -- INDIVIDUAL, CORPORATE
    nid_hash VARCHAR(64) NOT NULL, -- SHA-256 hash
    encrypted_nid TEXT NOT NULL, -- AES-256 encrypted
    date_of_birth DATE,
    purpose VARCHAR(50),
    application_id VARCHAR(30),
    requested_by VARCHAR(50),
    branch_code VARCHAR(10),

    -- Response Info
    subject_id VARCHAR(30),
    subject_name VARCHAR(200),
    cib_score INTEGER,
    risk_grade VARCHAR(5),
    total_facilities INTEGER,
    total_outstanding DECIMAL(20, 2),
    total_overdue DECIMAL(20, 2),
    total_monthly_emi DECIMAL(20, 2),
    worst_classification VARCHAR(5),
    max_dpd INTEGER,

    -- Full Response (JSON)
    response_json JSONB,

    -- Status
    status VARCHAR(20) NOT NULL, -- PENDING, SUCCESS, FAILED, CACHED
    error_message TEXT,

    -- Timing
    request_timestamp TIMESTAMP WITH TIME ZONE,
    response_timestamp TIMESTAMP WITH TIME ZONE,
    processing_time_ms INTEGER,
    cib_response_time_ms INTEGER,

    -- Cache Info
    cache_status VARCHAR(20), -- FRESH, LOCAL, REDIS
    cache_expiry TIMESTAMP WITH TIME ZONE,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50)
);

-- Indexes
CREATE INDEX idx_cib_inquiry_nid_hash ON cib_inquiry(nid_hash);
CREATE INDEX idx_cib_inquiry_application ON cib_inquiry(application_id);
CREATE INDEX idx_cib_inquiry_tenant ON cib_inquiry(tenant_id);
CREATE INDEX idx_cib_inquiry_timestamp ON cib_inquiry(request_timestamp);
CREATE INDEX idx_cib_inquiry_status ON cib_inquiry(status);

-- Partitioning by month
CREATE TABLE cib_inquiry_y2026m01 PARTITION OF cib_inquiry
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE cib_inquiry_y2026m02 PARTITION OF cib_inquiry
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
-- Continue for each month...

-- CIB Facility Detail Table
CREATE TABLE cib_facility_detail (
    id BIGSERIAL PRIMARY KEY,
    inquiry_id VARCHAR(50) NOT NULL REFERENCES cib_inquiry(inquiry_id),

    fi_code VARCHAR(10),
    fi_name VARCHAR(100),
    branch_name VARCHAR(100),
    facility_type VARCHAR(30),
    product_name VARCHAR(100),
    sanction_date DATE,
    expiry_date DATE,
    sanctioned_amount DECIMAL(20, 2),
    outstanding_amount DECIMAL(20, 2),
    overdue_amount DECIMAL(20, 2),
    emi_amount DECIMAL(20, 2),
    interest_rate DECIMAL(5, 2),
    classification VARCHAR(5),
    dpd INTEGER,
    last_payment_date DATE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cib_facility_inquiry ON cib_facility_detail(inquiry_id);

-- CIB Batch Table
CREATE TABLE cib_batch (
    id BIGSERIAL PRIMARY KEY,
    batch_id VARCHAR(30) UNIQUE NOT NULL,
    tenant_id VARCHAR(20) NOT NULL,
    reporting_month DATE NOT NULL,

    -- File Info
    subject_file_path TEXT,
    subject_record_count INTEGER,
    contract_file_path TEXT,
    contract_record_count INTEGER,

    -- Status
    status VARCHAR(20) NOT NULL, -- PENDING, PROCESSING, GENERATED, UPLOADED, ACKNOWLEDGED, FAILED
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    generated_at TIMESTAMP WITH TIME ZONE,
    uploaded_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,

    -- Acknowledgment Info
    ack_file_path TEXT,
    ack_status VARCHAR(20),
    ack_error_count INTEGER,
    ack_success_count INTEGER
);

CREATE INDEX idx_cib_batch_month ON cib_batch(reporting_month);
CREATE INDEX idx_cib_batch_status ON cib_batch(status);

-- CIB Response Cache (Redis structure)
-- Key: cib:individual:{sha256(nid)}
-- Value: JSON of CIBInquiryResponse
-- TTL: 3600 seconds (1 hour)
```

### 11.2 Entity Classes

```java
@Entity
@Table(name = "cib_inquiry")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CIBInquiryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "inquiry_id", unique = true, nullable = false)
    private String inquiryId;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(name = "inquiry_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private InquiryType inquiryType;

    @Column(name = "nid_hash", nullable = false)
    private String nidHash;

    @Column(name = "encrypted_nid", nullable = false)
    private String encryptedNid;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "purpose")
    private String purpose;

    @Column(name = "application_id")
    private String applicationId;

    @Column(name = "requested_by")
    private String requestedBy;

    @Column(name = "branch_code")
    private String branchCode;

    @Column(name = "subject_id")
    private String subjectId;

    @Column(name = "subject_name")
    private String subjectName;

    @Column(name = "cib_score")
    private Integer cibScore;

    @Column(name = "risk_grade")
    private String riskGrade;

    @Column(name = "total_facilities")
    private Integer totalFacilities;

    @Column(name = "total_outstanding")
    private BigDecimal totalOutstanding;

    @Column(name = "total_overdue")
    private BigDecimal totalOverdue;

    @Column(name = "total_monthly_emi")
    private BigDecimal totalMonthlyEmi;

    @Column(name = "worst_classification")
    private String worstClassification;

    @Column(name = "max_dpd")
    private Integer maxDpd;

    @Column(name = "response_json", columnDefinition = "jsonb")
    @Type(JsonType.class)
    private String responseJson;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private InquiryStatus status;

    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "request_timestamp")
    private Instant requestTimestamp;

    @Column(name = "response_timestamp")
    private Instant responseTimestamp;

    @Column(name = "processing_time_ms")
    private Integer processingTimeMs;

    @Column(name = "cib_response_time_ms")
    private Integer cibResponseTimeMs;

    @Column(name = "cache_status")
    private String cacheStatus;

    @Column(name = "cache_expiry")
    private Instant cacheExpiry;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "created_by")
    private String createdBy;

    @OneToMany(mappedBy = "inquiry", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<CIBFacilityDetailEntity> facilities;
}
```

---

## 12. Monitoring & Alerting

### 12.1 Key Metrics

| Metric | Type | Description | Alert Threshold |
|--------|------|-------------|-----------------|
| `cib_inquiry_total` | Counter | Total inquiries | - |
| `cib_inquiry_success` | Counter | Successful inquiries | - |
| `cib_inquiry_failure` | Counter | Failed inquiries | >5% of total |
| `cib_inquiry_duration` | Histogram | Response time | >60s (95th) |
| `cib_cache_hit_rate` | Gauge | Cache effectiveness | <50% |
| `cib_circuit_breaker_state` | Gauge | Circuit status | Open |
| `cib_batch_status` | Gauge | Batch processing | Failed |
| `cib_certificate_expiry_days` | Gauge | Cert validity | <30 days |

### 12.2 Prometheus Metrics

```java
@Component
public class CIBMetrics {

    private final MeterRegistry registry;

    private final Counter inquiryTotal;
    private final Counter inquirySuccess;
    private final Counter inquiryFailure;
    private final Timer inquiryDuration;
    private final AtomicDouble cacheHitRate;
    private final Gauge certificateExpiry;

    public CIBMetrics(MeterRegistry registry) {
        this.registry = registry;

        this.inquiryTotal = Counter.builder("cib_inquiry_total")
            .description("Total CIB inquiries")
            .tag("service", "cib")
            .register(registry);

        this.inquirySuccess = Counter.builder("cib_inquiry_success")
            .description("Successful CIB inquiries")
            .tag("service", "cib")
            .register(registry);

        this.inquiryFailure = Counter.builder("cib_inquiry_failure")
            .description("Failed CIB inquiries")
            .tag("service", "cib")
            .register(registry);

        this.inquiryDuration = Timer.builder("cib_inquiry_duration")
            .description("CIB inquiry duration")
            .tag("service", "cib")
            .publishPercentiles(0.5, 0.95, 0.99)
            .register(registry);

        this.cacheHitRate = new AtomicDouble(0);
        Gauge.builder("cib_cache_hit_rate", cacheHitRate, AtomicDouble::get)
            .description("CIB cache hit rate")
            .register(registry);
    }

    public void recordInquiry(CIBInquiryResponse response, long durationMs) {
        inquiryTotal.increment();

        if (response.getStatus() == InquiryStatus.SUCCESS) {
            inquirySuccess.increment();
        } else {
            inquiryFailure.increment();
        }

        inquiryDuration.record(Duration.ofMillis(durationMs));
    }

    public void updateCacheHitRate(double rate) {
        cacheHitRate.set(rate);
    }
}
```

### 12.3 Alert Rules

```yaml
groups:
  - name: cib-alerts
    rules:
      - alert: CIBHighErrorRate
        expr: rate(cib_inquiry_failure[5m]) / rate(cib_inquiry_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "CIB inquiry error rate exceeds 5%"

      - alert: CIBCircuitBreakerOpen
        expr: cib_circuit_breaker_state{name="cib-inquiry"} == 1
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "CIB circuit breaker is OPEN"

      - alert: CIBHighLatency
        expr: histogram_quantile(0.95, cib_inquiry_duration_bucket) > 60
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "CIB 95th percentile latency exceeds 60 seconds"

      - alert: CIBCertificateExpiring
        expr: cib_certificate_expiry_days < 30
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "CIB certificate expires in {{ $value }} days"

      - alert: CIBBatchFailed
        expr: cib_batch_status{status="FAILED"} == 1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "CIB monthly batch processing failed"
```

---

## 13. Compliance & Audit

### 13.1 Regulatory Requirements

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| **CIB Inquiry Logging** | All inquiries logged with timestamp | Compliant |
| **Data Retention** | 5-year retention for audit | Compliant |
| **Encryption** | AES-256 for NID, TLS 1.3 for transport | Compliant |
| **Access Control** | Role-based CIB access | Compliant |
| **Monthly Reporting** | Automated batch file generation | Compliant |
| **Audit Trail** | Immutable audit events in Kafka | Compliant |

### 13.2 Audit Report Generation

```java
@Service
public class CIBAuditReportService {

    public CIBAuditReport generateMonthlyReport(YearMonth month) {
        LocalDate startDate = month.atDay(1);
        LocalDate endDate = month.atEndOfMonth();

        List<CIBInquiryEntity> inquiries = inquiryRepository
            .findByRequestTimestampBetween(
                startDate.atStartOfDay(ZoneId.systemDefault()).toInstant(),
                endDate.atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant()
            );

        return CIBAuditReport.builder()
            .reportMonth(month)
            .totalInquiries(inquiries.size())
            .successfulInquiries((int) inquiries.stream()
                .filter(i -> i.getStatus() == InquiryStatus.SUCCESS).count())
            .failedInquiries((int) inquiries.stream()
                .filter(i -> i.getStatus() == InquiryStatus.FAILED).count())
            .averageResponseTimeMs(inquiries.stream()
                .filter(i -> i.getProcessingTimeMs() != null)
                .mapToInt(CIBInquiryEntity::getProcessingTimeMs)
                .average().orElse(0))
            .inquiriesByType(inquiries.stream()
                .collect(Collectors.groupingBy(CIBInquiryEntity::getInquiryType, Collectors.counting())))
            .inquiriesByBranch(inquiries.stream()
                .collect(Collectors.groupingBy(CIBInquiryEntity::getBranchCode, Collectors.counting())))
            .uniqueBorrowers((int) inquiries.stream()
                .map(CIBInquiryEntity::getNidHash)
                .distinct().count())
            .cacheHitRate(calculateCacheHitRate(inquiries))
            .generatedAt(Instant.now())
            .build();
    }
}
```

---

## 14. Appendices

### 14.1 Configuration Reference

```yaml
# application.yml - CIB Service Configuration
cib:
  api:
    base-url: https://172.16.100.10:443
    timeout-seconds: 120
    retry:
      max-attempts: 3
      initial-delay-seconds: 5
      multiplier: 2
      max-delay-seconds: 60

  ssl:
    enabled: true
    protocol: TLSv1.3
    keystore-type: PKCS12
    keystore-path: ${VAULT_KEYSTORE_PATH}
    truststore-type: JKS
    truststore-path: ${VAULT_TRUSTSTORE_PATH}

  cache:
    enabled: true
    ttl-seconds: 3600
    local-max-size: 1000
    local-ttl-seconds: 300

  batch:
    enabled: true
    cron: "0 0 2 1 * ?"
    output-directory: /var/ulms/batch/cib
    sftp:
      host: sftp.bb.org.bd
      port: 22
      username: ${BB_SFTP_USER}
      private-key-path: /etc/ulms/keys/bb-sftp.key
      incoming-directory: /cib/incoming
      ack-directory: /cib/ack

  rate-limiting:
    enabled: true
    requests-per-minute: 100
    burst-capacity: 20

  circuit-breaker:
    enabled: true
    failure-rate-threshold: 50
    slow-call-rate-threshold: 80
    slow-call-duration-seconds: 60
    wait-duration-open-state-seconds: 60
    sliding-window-size: 10

  fi-code: "0125"
```

### 14.2 Related Documents

| Document ID | Document Name |
|-------------|---------------|
| ARCH-1.5.1 | Integration Architecture Overview |
| ARCH-1.4.5 | mTLS Configuration for CIB |
| ARCH-1.3.6 | Data Model - CIB Reports |
| ARCH-1.1.2 | Microservices Architecture Blueprint |

### 14.3 Glossary

| Term | Definition |
|------|------------|
| **CIB** | Credit Information Bureau (Bangladesh Bank) |
| **mTLS** | Mutual TLS - certificate-based authentication |
| **DPD** | Days Past Due |
| **FI Code** | Financial Institution Code assigned by BB |
| **Subject** | Borrower in CIB terminology |
| **Contract** | Loan facility in CIB terminology |

---

**Document Version:** 1.0
**Classification:** Confidential - Internal Use
**Last Updated:** February 5, 2026
**Next Review:** August 2026

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

*This CIB Online Integration Design Document provides the comprehensive design for Bangladesh Bank CIB integration in ULMS v2.0.*

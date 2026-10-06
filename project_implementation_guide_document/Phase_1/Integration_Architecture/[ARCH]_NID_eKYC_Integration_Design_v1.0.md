# NID/e-KYC Integration Design
## National ID Wing (NIDW) API Integration
### Unisoft Loan Management System (ULMS) v2.0

---

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ULMS-ARCH-1.5.3 |
| **Document Title** | NID/e-KYC Integration Design (NIDW API) |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 5, 2026 |
| **Prepared By** | Developer 2 |
| **Reviewed By** | Lead Developer, Security Architect |
| **Classification** | Confidential - Internal Use |
| **Status** | Approved for Implementation |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | Dev 2 | Initial NID/e-KYC Integration Design Document |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Bangladesh NID System Overview](#2-bangladesh-nid-system-overview)
3. [NID/e-KYC Service Architecture](#3-nidekyc-service-architecture)
4. [NIDW API Integration](#4-nidw-api-integration)
5. [Verification Flows](#5-verification-flows)
6. [Photo Matching & Biometric Verification](#6-photo-matching--biometric-verification)
7. [Duplicate Detection](#7-duplicate-detection)
8. [Data Security & Encryption](#8-data-security--encryption)
9. [Smart Card Data Extraction](#9-smart-card-data-extraction)
10. [Error Handling & Fallback Procedures](#10-error-handling--fallback-procedures)
11. [Rate Limiting & Quotas](#11-rate-limiting--quotas)
12. [Caching Strategy](#12-caching-strategy)
13. [Data Model](#13-data-model)
14. [Apache Camel Integration Routes](#14-apache-camel-integration-routes)
15. [Monitoring & Observability](#15-monitoring--observability)
16. [Compliance & Regulatory](#16-compliance--regulatory)
17. [Implementation Guide](#17-implementation-guide)
18. [Appendices](#18-appendices)

---

## 1. Executive Summary

### 1.1 Purpose

This document defines the comprehensive integration design for the National ID Wing (NIDW) API, enabling real-time NID verification and e-KYC (Electronic Know Your Customer) capabilities for ULMS v2.0. The integration supports Bangladesh Bank's digital KYC requirements and BFIU e-KYC guidelines.

### 1.2 Integration Objectives

| Objective | Target | Measurement |
|-----------|--------|-------------|
| **NID Verification Speed** | < 5 seconds | API response time |
| **Verification Success Rate** | > 99% | Successful verifications |
| **Data Auto-Population** | 100% | Fields populated from NIDW |
| **Photo Match Accuracy** | > 95% | Match score threshold |
| **Duplicate Detection** | 100% | Duplicate NID prevention |
| **System Availability** | 99.9% | Service uptime |

### 1.3 Integration Scope

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    NID/e-KYC INTEGRATION SCOPE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        IN SCOPE                                      │   │
│   ├─────────────────────────────────────────────────────────────────────┤   │
│   │  • Real-time NID verification via NIDW API                          │   │
│   │  • Customer data auto-population (Name, DOB, Address, Photo)        │   │
│   │  • Photo matching and verification                                   │   │
│   │  • Duplicate NID detection                                           │   │
│   │  • Smart Card data extraction                                        │   │
│   │  • e-KYC compliance verification                                     │   │
│   │  • Verification audit trail                                          │   │
│   │  • Encrypted NID storage (AES-256)                                   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                       OUT OF SCOPE                                   │   │
│   ├─────────────────────────────────────────────────────────────────────┤   │
│   │  • Biometric fingerprint verification (future enhancement)          │   │
│   │  • NID card issuance or renewal                                      │   │
│   │  • Passport verification (separate integration)                      │   │
│   │  • Birth certificate verification (separate integration)             │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.4 Key Stakeholders

| Role | Responsibility |
|------|---------------|
| **Lead Developer** | Architecture oversight, code review |
| **Developer 2** | Implementation, API integration |
| **Security Architect** | Security review, encryption |
| **Compliance Officer** | BFIU guideline compliance |
| **Operations Team** | Monitoring, incident response |

---

## 2. Bangladesh NID System Overview

### 2.1 National ID Wing (NIDW)

The National ID Wing (NIDW) operates under the Election Commission of Bangladesh and maintains the National Identity Register (NIR) for all Bangladeshi citizens.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BANGLADESH NID ECOSYSTEM                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                  ELECTION COMMISSION OF BANGLADESH                    │  │
│   │                                                                       │  │
│   │   ┌─────────────────────────────────────────────────────────────┐    │  │
│   │   │               NATIONAL ID WING (NIDW)                        │    │  │
│   │   │                                                              │    │  │
│   │   │   ┌───────────────┐     ┌───────────────┐                   │    │  │
│   │   │   │     NIR       │     │   NIDW API    │                   │    │  │
│   │   │   │  (National    │────▶│   Gateway     │                   │    │  │
│   │   │   │  ID Register) │     │               │                   │    │  │
│   │   │   └───────────────┘     └───────┬───────┘                   │    │  │
│   │   │                                  │                           │    │  │
│   │   └──────────────────────────────────│───────────────────────────┘    │  │
│   │                                      │                                 │  │
│   └──────────────────────────────────────│─────────────────────────────────┘  │
│                                          │                                    │
│                          ┌───────────────┴───────────────┐                   │
│                          │                               │                   │
│                          ▼                               ▼                   │
│             ┌───────────────────┐           ┌───────────────────┐           │
│             │      BANKS        │           │    GOVERNMENT     │           │
│             │  (e-KYC Partners) │           │     AGENCIES      │           │
│             │                   │           │                   │           │
│             │  ┌─────────────┐  │           │  ┌─────────────┐  │           │
│             │  │    ULMS     │  │           │  │   Other     │  │           │
│             │  │ NID Service │  │           │  │   Systems   │  │           │
│             │  └─────────────┘  │           │  └─────────────┘  │           │
│             └───────────────────┘           └───────────────────┘           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 NID Types in Bangladesh

| NID Type | Format | Length | Validation Pattern | Status |
|----------|--------|--------|-------------------|--------|
| **Old NID** | Numeric | 13 digits | `^[0-9]{13}$` | Legacy (Valid) |
| **Smart NID** | Numeric | 17 digits | `^[0-9]{17}$` | Current Standard |

### 2.3 Smart NID Card Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SMART NID CARD STRUCTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   FRONT SIDE                              BACK SIDE                          │
│   ┌──────────────────────────┐            ┌──────────────────────────┐      │
│   │  ┌─────────┐             │            │                          │      │
│   │  │  PHOTO  │  Name (EN)  │            │   Present Address        │      │
│   │  │  (35mm  │  Name (BN)  │            │                          │      │
│   │  │  x 45mm)│             │            │   Permanent Address      │      │
│   │  └─────────┘ Father Name │            │                          │      │
│   │             Mother Name  │            │   Date of Issue          │      │
│   │             DOB          │            │                          │      │
│   │             Blood Group  │            │   ┌────────────────────┐ │      │
│   │                          │            │   │  MRZ (Machine      │ │      │
│   │  NID: 1234567890123456X  │            │   │  Readable Zone)    │ │      │
│   │                          │            │   └────────────────────┘ │      │
│   │  ████████████████████    │            │   ┌────────────────────┐ │      │
│   │  (2D Barcode)            │            │   │   QR Code          │ │      │
│   └──────────────────────────┘            │   └────────────────────┘ │      │
│                                            └──────────────────────────┘      │
│                                                                              │
│   CHIP DATA (Smart Card)                                                    │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  • Biometric Data (Fingerprints - 10 fingers)                        │   │
│   │  • Facial Recognition Data                                           │   │
│   │  • Digital Signature Certificate                                     │   │
│   │  • Personal Information (Encrypted)                                  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.4 NIDW Data Elements

| Data Element | Field Name | Type | Max Length | Description |
|--------------|------------|------|------------|-------------|
| **NID Number** | nid | String | 17 | National ID number |
| **Name (English)** | nameEn | String | 100 | Full name in English |
| **Name (Bengali)** | nameBn | String | 100 | Full name in Bengali |
| **Father's Name (EN)** | fatherNameEn | String | 100 | Father's name in English |
| **Father's Name (BN)** | fatherNameBn | String | 100 | Father's name in Bengali |
| **Mother's Name (EN)** | motherNameEn | String | 100 | Mother's name in English |
| **Mother's Name (BN)** | motherNameBn | String | 100 | Mother's name in Bengali |
| **Date of Birth** | dob | Date | 10 | Format: YYYY-MM-DD |
| **Gender** | gender | String | 10 | MALE, FEMALE, OTHER |
| **Blood Group** | bloodGroup | String | 5 | A+, A-, B+, B-, AB+, AB-, O+, O- |
| **Present Address** | presentAddress | Object | - | Structured address |
| **Permanent Address** | permanentAddress | Object | - | Structured address |
| **Photo** | photo | String | - | Base64 encoded image |
| **Spouse Name** | spouseNameEn | String | 100 | Spouse name (if married) |

---

## 3. NID/e-KYC Service Architecture

### 3.1 Service Specification

| Parameter | Value | Notes |
|-----------|-------|-------|
| **Service Name** | nid-ekyc-service | Kubernetes deployment |
| **Port** | 8082 | Service port |
| **Framework** | Spring Boot 3.2.1 | Java 21 |
| **API Style** | REST | OpenAPI 3.0 |
| **Database** | PostgreSQL 16 | Tenant-specific schema |
| **Cache** | Redis 7.2 | Verification result cache |
| **Encryption** | AES-256-CBC | Field-level encryption |

### 3.2 Service Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    NID/e-KYC SERVICE ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      KONG API GATEWAY (Port 8000)                    │   │
│   │                   Rate Limiting | Auth | Routing                     │   │
│   └──────────────────────────────────┬──────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                  NID/e-KYC SERVICE (Port 8082)                       │   │
│   │                                                                       │   │
│   │   ┌──────────────────────────────────────────────────────────────┐   │   │
│   │   │                    CONTROLLER LAYER                           │   │   │
│   │   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │   │   │
│   │   │  │ NIDVerify   │  │ eKYCVerify  │  │ DuplicateCheck      │   │   │   │
│   │   │  │ Controller  │  │ Controller  │  │ Controller          │   │   │   │
│   │   │  └─────────────┘  └─────────────┘  └─────────────────────┘   │   │   │
│   │   └───────────────────────────┬──────────────────────────────────┘   │   │
│   │                               │                                       │   │
│   │   ┌──────────────────────────────────────────────────────────────┐   │   │
│   │   │                     SERVICE LAYER                             │   │   │
│   │   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │   │   │
│   │   │  │ NIDVerify   │  │ PhotoMatch  │  │ EncryptionService   │   │   │   │
│   │   │  │ Service     │  │ Service     │  │ (Vault Integration) │   │   │   │
│   │   │  └─────────────┘  └─────────────┘  └─────────────────────┘   │   │   │
│   │   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │   │   │
│   │   │  │ DataPopulate│  │ Duplicate   │  │ AuditService        │   │   │   │
│   │   │  │ Service     │  │ CheckService│  │                     │   │   │   │
│   │   │  └─────────────┘  └─────────────┘  └─────────────────────┘   │   │   │
│   │   └───────────────────────────┬──────────────────────────────────┘   │   │
│   │                               │                                       │   │
│   │   ┌──────────────────────────────────────────────────────────────┐   │   │
│   │   │                  INTEGRATION LAYER                            │   │   │
│   │   │  ┌─────────────────────┐  ┌───────────────────────────────┐  │   │   │
│   │   │  │ NIDW API Client     │  │ Apache Camel Route            │  │   │   │
│   │   │  │ (WebClient/RestTmpl)│  │ (Resilience, Transform)       │  │   │   │
│   │   │  └─────────────────────┘  └───────────────────────────────┘  │   │   │
│   │   └───────────────────────────┬──────────────────────────────────┘   │   │
│   │                               │                                       │   │
│   └───────────────────────────────┼──────────────────────────────────────┘   │
│                                   │                                          │
│   ┌───────────────────────────────┴──────────────────────────────────────┐   │
│   │                       EXTERNAL INTEGRATIONS                           │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │   │
│   │  │   NIDW API   │  │ PostgreSQL   │  │    Redis     │  │  Vault   │  │   │
│   │  │  (External)  │  │   (Data)     │  │   (Cache)    │  │  (Keys)  │  │   │
│   │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────┘  │   │
│   └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Technology Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Runtime** | Java | 21 (LTS) | Application runtime |
| **Framework** | Spring Boot | 3.2.1 | Microservice framework |
| **Web Client** | Spring WebFlux | 6.1.x | Non-blocking HTTP client |
| **Integration** | Apache Camel | 4.3 | Integration routes |
| **Database** | PostgreSQL | 16 | Persistent storage |
| **Cache** | Redis | 7.2 | Verification caching |
| **Encryption** | HashiCorp Vault | 1.15 | Key management |
| **Resilience** | Resilience4j | Latest | Circuit breaker |
| **Monitoring** | Micrometer | Latest | Metrics collection |

### 3.4 API Endpoints Specification

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/v1/nid/verify` | POST | Verify NID and retrieve data | JWT |
| `/api/v1/nid/verify-basic` | POST | Basic NID validation only | JWT |
| `/api/v1/nid/check-duplicate` | POST | Check for duplicate NID | JWT |
| `/api/v1/ekyc/verify` | POST | Full e-KYC verification | JWT |
| `/api/v1/ekyc/photo-match` | POST | Photo matching verification | JWT |
| `/api/v1/nid/history/{clientId}` | GET | Get verification history | JWT |
| `/api/v1/nid/health` | GET | Service health check | None |

---

## 4. NIDW API Integration

### 4.1 NIDW API Connection Details

| Parameter | Value | Notes |
|-----------|-------|-------|
| **API Gateway URL** | `https://nidw.gov.bd/api/v2` | Production endpoint |
| **UAT URL** | `https://nidw-uat.gov.bd/api/v2` | Testing endpoint |
| **Protocol** | HTTPS (TLS 1.3) | Encrypted transport |
| **Authentication** | API Key + Client Certificate | Mutual authentication |
| **Timeout** | 30 seconds | Connection timeout |
| **Rate Limit** | 100 requests/minute | Per-client limit |

### 4.2 Authentication Configuration

```yaml
# application-nidw.yml - NIDW Integration Configuration
nidw:
  api:
    base-url: ${NIDW_API_URL:https://nidw.gov.bd/api/v2}
    api-key: ${vault:secret/data/ulms/nidw#api-key}
    client-id: ${NIDW_CLIENT_ID:ulms-bank-001}

  # Client Certificate Configuration
  ssl:
    enabled: true
    key-store: classpath:certs/nidw-client.p12
    key-store-password: ${vault:secret/data/ulms/nidw#keystore-password}
    key-store-type: PKCS12
    trust-store: classpath:certs/nidw-ca.jks
    trust-store-password: ${vault:secret/data/ulms/nidw#truststore-password}

  # Timeouts
  connection:
    connect-timeout: 10000  # 10 seconds
    read-timeout: 30000     # 30 seconds
    write-timeout: 10000    # 10 seconds

  # Retry Configuration
  retry:
    max-attempts: 3
    initial-interval: 1000  # 1 second
    multiplier: 2
    max-interval: 10000     # 10 seconds

  # Circuit Breaker
  circuit-breaker:
    failure-rate-threshold: 50
    wait-duration-in-open-state: 60000  # 60 seconds
    sliding-window-size: 10
```

### 4.3 NIDW API Request/Response

#### 4.3.1 NID Verification Request

```json
{
  "requestId": "ULMS-NID-20260205-001234",
  "clientId": "ulms-bank-001",
  "timestamp": "2026-02-05T10:30:00+06:00",
  "verificationRequest": {
    "nid": "1234567890123456X",
    "dateOfBirth": "1990-05-15",
    "verificationLevel": "FULL",
    "photoRequired": true,
    "addressRequired": true
  }
}
```

#### 4.3.2 NID Verification Response

```json
{
  "responseId": "NIDW-RES-20260205-567890",
  "requestId": "ULMS-NID-20260205-001234",
  "status": "SUCCESS",
  "timestamp": "2026-02-05T10:30:02+06:00",
  "verificationResult": {
    "verified": true,
    "nidType": "SMART",
    "personalInfo": {
      "nid": "1234567890123456X",
      "nameEn": "MOHAMMAD RAHMAN KHAN",
      "nameBn": "মোহাম্মদ রহমান খান",
      "fatherNameEn": "ABDUL KARIM KHAN",
      "fatherNameBn": "আব্দুল করিম খান",
      "motherNameEn": "FATIMA BEGUM",
      "motherNameBn": "ফাতেমা বেগম",
      "spouseNameEn": "NUSRAT JAHAN",
      "spouseNameBn": "নুসরাত জাহান",
      "dateOfBirth": "1990-05-15",
      "gender": "MALE",
      "bloodGroup": "B+",
      "nationality": "Bangladeshi"
    },
    "presentAddress": {
      "division": "Dhaka",
      "district": "Dhaka",
      "upazila": "Gulshan",
      "union": "N/A",
      "postOffice": "Gulshan-2",
      "postalCode": "1212",
      "addressLine": "House 45, Road 12, Gulshan-2",
      "addressLineBn": "বাড়ি ৪৫, রোড ১২, গুলশান-২"
    },
    "permanentAddress": {
      "division": "Chattogram",
      "district": "Chattogram",
      "upazila": "Pahartali",
      "union": "N/A",
      "postOffice": "Pahartali",
      "postalCode": "4202",
      "addressLine": "Village Pahartali, Chattogram",
      "addressLineBn": "গ্রাম পাহাড়তলী, চট্টগ্রাম"
    },
    "photo": "data:image/jpeg;base64,/9j/4AAQSkZJRg...[Base64 encoded photo]",
    "issueDate": "2020-03-15",
    "nidStatus": "ACTIVE"
  }
}
```

### 4.4 Request/Response DTOs

```java
// NidVerificationRequest.java
@Data
@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class NidVerificationRequest {

    @NotNull(message = "NID number is required")
    @Pattern(regexp = "^[0-9]{13}$|^[0-9]{17}$", message = "Invalid NID format")
    private String nid;

    @NotNull(message = "Date of birth is required")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateOfBirth;

    private VerificationLevel verificationLevel = VerificationLevel.FULL;
    private boolean photoRequired = true;
    private boolean addressRequired = true;
}

// NidVerificationResponse.java
@Data
@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class NidVerificationResponse {

    private String responseId;
    private String requestId;
    private VerificationStatus status;
    private LocalDateTime timestamp;
    private NidVerificationResult verificationResult;
    private ErrorDetails error;

    @Data
    @Builder
    public static class NidVerificationResult {
        private boolean verified;
        private String nidType;
        private PersonalInfo personalInfo;
        private Address presentAddress;
        private Address permanentAddress;
        private String photo;  // Base64 encoded
        private LocalDate issueDate;
        private String nidStatus;
    }

    @Data
    @Builder
    public static class PersonalInfo {
        private String nid;
        private String nameEn;
        private String nameBn;
        private String fatherNameEn;
        private String fatherNameBn;
        private String motherNameEn;
        private String motherNameBn;
        private String spouseNameEn;
        private String spouseNameBn;
        private LocalDate dateOfBirth;
        private String gender;
        private String bloodGroup;
        private String nationality;
    }

    @Data
    @Builder
    public static class Address {
        private String division;
        private String district;
        private String upazila;
        private String union;
        private String postOffice;
        private String postalCode;
        private String addressLine;
        private String addressLineBn;
    }
}

// Enums
public enum VerificationLevel {
    BASIC,      // NID validation only
    STANDARD,   // NID + Name + DOB
    FULL        // All data including photo and address
}

public enum VerificationStatus {
    SUCCESS,
    FAILED,
    MISMATCH,
    NID_NOT_FOUND,
    DOB_MISMATCH,
    EXPIRED_NID,
    TIMEOUT,
    ERROR
}
```

### 4.5 NIDW Client Implementation

```java
// NidwApiClient.java
@Service
@Slf4j
public class NidwApiClient {

    private final WebClient webClient;
    private final NidwProperties properties;
    private final VaultTemplate vaultTemplate;

    public NidwApiClient(
            WebClient.Builder webClientBuilder,
            NidwProperties properties,
            VaultTemplate vaultTemplate) {

        this.properties = properties;
        this.vaultTemplate = vaultTemplate;

        // Configure WebClient with SSL and timeouts
        this.webClient = webClientBuilder
            .baseUrl(properties.getApi().getBaseUrl())
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .defaultHeader("X-API-Key", getApiKey())
            .defaultHeader("X-Client-Id", properties.getApi().getClientId())
            .clientConnector(createSslConnector())
            .filter(ExchangeFilterFunction.ofRequestProcessor(this::logRequest))
            .filter(ExchangeFilterFunction.ofResponseProcessor(this::logResponse))
            .build();
    }

    @CircuitBreaker(name = "nidwApi", fallbackMethod = "fallbackVerify")
    @Retry(name = "nidwApi")
    @RateLimiter(name = "nidwApi")
    public Mono<NidVerificationResponse> verifyNid(NidVerificationRequest request) {
        String requestId = generateRequestId();

        NidwApiRequest apiRequest = NidwApiRequest.builder()
            .requestId(requestId)
            .clientId(properties.getApi().getClientId())
            .timestamp(OffsetDateTime.now(ZoneId.of("Asia/Dhaka")))
            .verificationRequest(request)
            .build();

        return webClient.post()
            .uri("/verify")
            .bodyValue(apiRequest)
            .retrieve()
            .onStatus(HttpStatusCode::is4xxClientError, this::handle4xxError)
            .onStatus(HttpStatusCode::is5xxServerError, this::handle5xxError)
            .bodyToMono(NidVerificationResponse.class)
            .timeout(Duration.ofSeconds(30))
            .doOnSuccess(response -> logSuccess(requestId, response))
            .doOnError(error -> logError(requestId, error));
    }

    private Mono<NidVerificationResponse> fallbackVerify(
            NidVerificationRequest request,
            Throwable throwable) {
        log.error("NIDW API fallback triggered for NID verification", throwable);

        return Mono.just(NidVerificationResponse.builder()
            .status(VerificationStatus.ERROR)
            .timestamp(LocalDateTime.now())
            .error(ErrorDetails.builder()
                .code("NIDW_UNAVAILABLE")
                .message("NIDW API is temporarily unavailable. Please try again later.")
                .build())
            .build());
    }

    private ReactorClientHttpConnector createSslConnector() {
        try {
            SslContext sslContext = SslContextBuilder.forClient()
                .keyManager(getKeyManagerFactory())
                .trustManager(getTrustManagerFactory())
                .protocols("TLSv1.3")
                .build();

            HttpClient httpClient = HttpClient.create()
                .secure(sslSpec -> sslSpec.sslContext(sslContext))
                .responseTimeout(Duration.ofSeconds(properties.getConnection().getReadTimeout() / 1000));

            return new ReactorClientHttpConnector(httpClient);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create SSL context", e);
        }
    }

    private String getApiKey() {
        VaultResponse response = vaultTemplate.read("secret/data/ulms/nidw");
        return (String) response.getData().get("api-key");
    }

    private String generateRequestId() {
        return String.format("ULMS-NID-%s-%06d",
            LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE),
            ThreadLocalRandom.current().nextInt(999999));
    }
}
```

---

## 5. Verification Flows

### 5.1 Complete NID Verification Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    NID VERIFICATION FLOW                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   USER/BRANCH                  NID SERVICE                    NIDW API       │
│        │                           │                              │          │
│        │  1. Submit NID + DOB      │                              │          │
│        │ ─────────────────────────▶│                              │          │
│        │                           │                              │          │
│        │                           │  2. Validate NID format      │          │
│        │                           │  ───────────────────────     │          │
│        │                           │                              │          │
│        │                           │  3. Check duplicate NID      │          │
│        │                           │  ───────────────────────     │          │
│        │                           │                              │          │
│        │                           │  4. Check cache              │          │
│        │                           │  ────────────────────        │          │
│        │                           │         │                    │          │
│        │                           │         ▼                    │          │
│        │                           │   [Cache Hit?]               │          │
│        │                           │     YES │ NO                 │          │
│        │                           │         │    \               │          │
│        │                           │         │     \              │          │
│        │                           │         │      │             │          │
│        │                           │         │      │ 5. Call API │          │
│        │                           │         │      │────────────▶│          │
│        │                           │         │      │             │          │
│        │                           │         │      │  6. Response│          │
│        │                           │         │      │◀────────────│          │
│        │                           │         │      │             │          │
│        │                           │         │      │ 7. Decrypt  │          │
│        │                           │         │      │ & Validate  │          │
│        │                           │         │      │────────     │          │
│        │                           │         │      │             │          │
│        │                           │         │      │ 8. Cache    │          │
│        │                           │         │      │ result      │          │
│        │                           │         │     /              │          │
│        │                           │         │    /               │          │
│        │                           │         ▼   /                │          │
│        │                           │  9. Store verification log   │          │
│        │                           │  ──────────────────────────  │          │
│        │                           │                              │          │
│        │  10. Verification Result  │                              │          │
│        │ ◀─────────────────────────│                              │          │
│        │                           │                              │          │
│        │                           │  11. Emit Kafka event        │          │
│        │                           │  ─────────────────────       │          │
│        │                           │                              │          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Customer Data Auto-Population Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DATA AUTO-POPULATION FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                   NIDW RESPONSE DATA                                 │   │
│   │                                                                       │   │
│   │   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐              │   │
│   │   │  Personal   │   │   Address   │   │    Photo    │              │   │
│   │   │    Info     │   │    Data     │   │   (Base64)  │              │   │
│   │   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘              │   │
│   │          │                 │                 │                       │   │
│   └──────────│─────────────────│─────────────────│───────────────────────┘   │
│              │                 │                 │                           │
│              ▼                 ▼                 ▼                           │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                   DATA TRANSFORMATION                                │   │
│   │                                                                       │   │
│   │   ┌─────────────────────────────────────────────────────────────┐   │   │
│   │   │                    Field Mapping                             │   │   │
│   │   │                                                              │   │   │
│   │   │   NIDW Field          │    ULMS Field                       │   │   │
│   │   │   ────────────────────│─────────────────────                │   │   │
│   │   │   nameEn              │    fullname (encrypted)             │   │   │
│   │   │   nameBn              │    fullname_bn (encrypted)          │   │   │
│   │   │   fatherNameEn        │    father_name (encrypted)          │   │   │
│   │   │   fatherNameBn        │    father_name_bn (encrypted)       │   │   │
│   │   │   motherNameEn        │    mother_name (encrypted)          │   │   │
│   │   │   motherNameBn        │    mother_name_bn (encrypted)       │   │   │
│   │   │   dateOfBirth         │    date_of_birth                    │   │   │
│   │   │   gender              │    gender                           │   │   │
│   │   │   presentAddress      │    customer_address (PRESENT)       │   │   │
│   │   │   permanentAddress    │    customer_address (PERMANENT)     │   │   │
│   │   │   photo               │    MinIO storage                    │   │   │
│   │   │                                                              │   │   │
│   │   └─────────────────────────────────────────────────────────────┘   │   │
│   │                                                                       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    ULMS DATABASE                                     │   │
│   │                                                                       │   │
│   │   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐              │   │
│   │   │  m_client   │   │  customer_  │   │   MinIO     │              │   │
│   │   │  (Master)   │   │   address   │   │  (Photos)   │              │   │
│   │   └─────────────┘   └─────────────┘   └─────────────┘              │   │
│   │                                                                       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 NID Verification Service Implementation

```java
// NidVerificationService.java
@Service
@Slf4j
@Transactional
public class NidVerificationService {

    private final NidwApiClient nidwApiClient;
    private final NidVerificationLogRepository verificationLogRepository;
    private final ClientRepository clientRepository;
    private final EncryptionService encryptionService;
    private final PhotoStorageService photoStorageService;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String CACHE_PREFIX = "nid:verification:";
    private static final Duration CACHE_TTL = Duration.ofHours(24);

    @Autowired
    public NidVerificationService(
            NidwApiClient nidwApiClient,
            NidVerificationLogRepository verificationLogRepository,
            ClientRepository clientRepository,
            EncryptionService encryptionService,
            PhotoStorageService photoStorageService,
            KafkaTemplate<String, Object> kafkaTemplate,
            RedisTemplate<String, Object> redisTemplate) {
        this.nidwApiClient = nidwApiClient;
        this.verificationLogRepository = verificationLogRepository;
        this.clientRepository = clientRepository;
        this.encryptionService = encryptionService;
        this.photoStorageService = photoStorageService;
        this.kafkaTemplate = kafkaTemplate;
        this.redisTemplate = redisTemplate;
    }

    public Mono<CustomerVerificationResult> verifyAndPopulateCustomer(
            NidVerificationRequest request,
            String requestedBy,
            String ipAddress) {

        log.info("Starting NID verification for NID: {}", maskNid(request.getNid()));

        // Step 1: Validate NID format
        validateNidFormat(request.getNid());

        // Step 2: Check for duplicate NID
        return checkDuplicateNid(request.getNid())
            .flatMap(isDuplicate -> {
                if (isDuplicate) {
                    return Mono.error(new DuplicateNidException(
                        "NID already exists in the system"));
                }

                // Step 3: Check cache
                return getCachedVerification(request.getNid())
                    .switchIfEmpty(
                        // Step 4: Call NIDW API if not cached
                        callNidwApi(request, requestedBy, ipAddress)
                    );
            })
            .flatMap(response -> {
                // Step 5: Process response and populate customer data
                return processVerificationResponse(response, requestedBy);
            })
            .doOnSuccess(result -> {
                // Step 6: Emit Kafka event
                emitVerificationEvent(result, requestedBy);
            });
    }

    private void validateNidFormat(String nid) {
        if (!nid.matches("^[0-9]{13}$|^[0-9]{17}$")) {
            throw new InvalidNidFormatException(
                "NID must be either 13 or 17 digits");
        }
    }

    private Mono<Boolean> checkDuplicateNid(String nid) {
        String encryptedNid = encryptionService.encrypt(nid);
        return Mono.fromCallable(() ->
            clientRepository.existsByNidNumber(encryptedNid));
    }

    private Mono<NidVerificationResponse> getCachedVerification(String nid) {
        String cacheKey = CACHE_PREFIX + hashNid(nid);

        return Mono.fromCallable(() ->
            (NidVerificationResponse) redisTemplate.opsForValue().get(cacheKey))
            .filter(Objects::nonNull)
            .doOnSuccess(cached -> {
                if (cached != null) {
                    log.info("Cache hit for NID verification");
                }
            });
    }

    private Mono<NidVerificationResponse> callNidwApi(
            NidVerificationRequest request,
            String requestedBy,
            String ipAddress) {

        LocalDateTime startTime = LocalDateTime.now();

        return nidwApiClient.verifyNid(request)
            .doOnSuccess(response -> {
                // Cache successful responses
                if (response.getStatus() == VerificationStatus.SUCCESS) {
                    cacheVerificationResult(request.getNid(), response);
                }

                // Log verification attempt
                logVerificationAttempt(request, response, requestedBy,
                    ipAddress, startTime);
            });
    }

    private void cacheVerificationResult(String nid, NidVerificationResponse response) {
        String cacheKey = CACHE_PREFIX + hashNid(nid);
        redisTemplate.opsForValue().set(cacheKey, response, CACHE_TTL);
    }

    private Mono<CustomerVerificationResult> processVerificationResponse(
            NidVerificationResponse response,
            String requestedBy) {

        if (response.getStatus() != VerificationStatus.SUCCESS) {
            return Mono.just(CustomerVerificationResult.builder()
                .verified(false)
                .status(response.getStatus())
                .errorMessage(response.getError() != null ?
                    response.getError().getMessage() : "Verification failed")
                .build());
        }

        NidVerificationResponse.NidVerificationResult result =
            response.getVerificationResult();

        // Create customer entity with populated data
        Client client = mapToClientEntity(result);
        client.setCreatedBy(requestedBy);
        client.setUpdatedBy(requestedBy);

        // Save photo to MinIO
        String photoPath = null;
        if (result.getPhoto() != null && !result.getPhoto().isEmpty()) {
            photoPath = photoStorageService.savePhoto(
                result.getPersonalInfo().getNid(),
                result.getPhoto()
            );
            client.setPhotoPath(photoPath);
        }

        return Mono.just(CustomerVerificationResult.builder()
            .verified(true)
            .status(VerificationStatus.SUCCESS)
            .customer(client)
            .photoPath(photoPath)
            .nidwData(result)
            .build());
    }

    private Client mapToClientEntity(
            NidVerificationResponse.NidVerificationResult result) {

        PersonalInfo info = result.getPersonalInfo();

        Client client = new Client();

        // Encrypted fields
        client.setNidNumber(encryptionService.encrypt(info.getNid()));
        client.setFullname(encryptionService.encrypt(info.getNameEn()));
        client.setFullnameBn(encryptionService.encrypt(info.getNameBn()));
        client.setFatherName(encryptionService.encrypt(info.getFatherNameEn()));
        client.setFatherNameBn(encryptionService.encrypt(info.getFatherNameBn()));
        client.setMotherName(encryptionService.encrypt(info.getMotherNameEn()));
        client.setMotherNameBn(encryptionService.encrypt(info.getMotherNameBn()));

        if (info.getSpouseNameEn() != null) {
            client.setSpouseName(encryptionService.encrypt(info.getSpouseNameEn()));
            client.setSpouseNameBn(encryptionService.encrypt(info.getSpouseNameBn()));
        }

        // Non-encrypted fields
        client.setNidType(info.getNid().length() == 17 ? "SMART" : "OLD");
        client.setDateOfBirth(info.getDateOfBirth());
        client.setGender(info.getGender());
        client.setDisplayName(info.getNameEn());

        // NID Verification status
        client.setNidVerified(true);
        client.setNidVerifiedAt(LocalDateTime.now());
        client.setNidVerificationMethod("API");
        client.setKycStatus("PENDING");  // Overall KYC still pending

        return client;
    }

    private void logVerificationAttempt(
            NidVerificationRequest request,
            NidVerificationResponse response,
            String requestedBy,
            String ipAddress,
            LocalDateTime startTime) {

        NidVerificationLog log = NidVerificationLog.builder()
            .nidNumber(encryptionService.encrypt(request.getNid()))
            .dateOfBirth(request.getDateOfBirth())
            .verificationMethod("API")
            .requestId(response.getRequestId())
            .verificationStatus(response.getStatus().name())
            .nidwResponseCode(response.getStatus().name())
            .requestedAt(startTime)
            .respondedAt(LocalDateTime.now())
            .responseTimeMs((int) Duration.between(startTime,
                LocalDateTime.now()).toMillis())
            .requestedBy(requestedBy)
            .ipAddress(ipAddress)
            .build();

        if (response.getStatus() == VerificationStatus.SUCCESS) {
            // Store encrypted NIDW data
            log.setNidwDataEncrypted(encryptionService.encrypt(
                serializeNidwData(response.getVerificationResult())));
            log.setNameMatchResult(true);
            log.setDobMatchResult(true);
        } else if (response.getError() != null) {
            log.setErrorCode(response.getError().getCode());
            log.setErrorMessage(response.getError().getMessage());
        }

        verificationLogRepository.save(log);
    }

    private void emitVerificationEvent(
            CustomerVerificationResult result,
            String requestedBy) {

        NidVerificationEvent event = NidVerificationEvent.builder()
            .eventId(UUID.randomUUID().toString())
            .eventType(result.isVerified() ? "NID_VERIFIED" : "NID_VERIFICATION_FAILED")
            .timestamp(LocalDateTime.now())
            .requestedBy(requestedBy)
            .verified(result.isVerified())
            .status(result.getStatus())
            .build();

        kafkaTemplate.send("ulms.nid.verification.events", event);
    }

    private String maskNid(String nid) {
        if (nid == null || nid.length() < 8) return "****";
        return nid.substring(0, 4) + "****" + nid.substring(nid.length() - 4);
    }

    private String hashNid(String nid) {
        return DigestUtils.sha256Hex(nid);
    }
}
```

---

## 6. Photo Matching & Biometric Verification

### 6.1 Photo Matching Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PHOTO MATCHING FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐          │
│   │  Applicant  │         │    NIDW     │         │  Photo Match│          │
│   │   Photo     │         │   Photo     │         │   Service   │          │
│   │ (Captured)  │         │ (From API)  │         │             │          │
│   └──────┬──────┘         └──────┬──────┘         └──────┬──────┘          │
│          │                       │                       │                  │
│          │                       │                       │                  │
│          ▼                       ▼                       │                  │
│   ┌─────────────────────────────────────┐               │                  │
│   │        IMAGE PREPROCESSING          │               │                  │
│   │                                      │               │                  │
│   │  • Resize to standard dimensions    │               │                  │
│   │  • Face detection & alignment       │               │                  │
│   │  • Normalize lighting               │               │                  │
│   │  • Convert to grayscale             │               │                  │
│   │                                      │               │                  │
│   └──────────────────┬──────────────────┘               │                  │
│                      │                                   │                  │
│                      ▼                                   │                  │
│   ┌─────────────────────────────────────┐               │                  │
│   │       FEATURE EXTRACTION            │               │                  │
│   │                                      │               │                  │
│   │  • Facial landmarks (68 points)     │◀──────────────┘                  │
│   │  • Eye position, nose, mouth        │                                   │
│   │  • Face encoding (128-dimensional)  │                                   │
│   │                                      │                                   │
│   └──────────────────┬──────────────────┘                                   │
│                      │                                                       │
│                      ▼                                                       │
│   ┌─────────────────────────────────────┐                                   │
│   │         SIMILARITY COMPARISON       │                                   │
│   │                                      │                                   │
│   │  • Cosine similarity calculation    │                                   │
│   │  • Distance threshold evaluation    │                                   │
│   │  • Confidence score generation      │                                   │
│   │                                      │                                   │
│   │  Threshold: >= 95% = MATCH         │                                   │
│   │             80-94% = REVIEW         │                                   │
│   │             < 80% = MISMATCH        │                                   │
│   │                                      │                                   │
│   └──────────────────┬──────────────────┘                                   │
│                      │                                                       │
│                      ▼                                                       │
│   ┌─────────────────────────────────────┐                                   │
│   │           RESULT                    │                                   │
│   │                                      │                                   │
│   │  • Match Score: 97.5%               │                                   │
│   │  • Result: MATCH                    │                                   │
│   │  • Confidence: HIGH                 │                                   │
│   │                                      │                                   │
│   └─────────────────────────────────────┘                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Photo Matching Service

```java
// PhotoMatchService.java
@Service
@Slf4j
public class PhotoMatchService {

    private static final double MATCH_THRESHOLD = 0.95;
    private static final double REVIEW_THRESHOLD = 0.80;

    private final FaceRecognitionClient faceRecognitionClient;
    private final MinioClient minioClient;

    @Value("${photo.match.bucket}")
    private String photoBucket;

    public PhotoMatchResult matchPhotos(String applicantPhoto, String nidwPhoto) {
        log.info("Starting photo matching process");

        try {
            // Decode Base64 images
            byte[] applicantBytes = Base64.getDecoder().decode(
                extractBase64Data(applicantPhoto));
            byte[] nidwBytes = Base64.getDecoder().decode(
                extractBase64Data(nidwPhoto));

            // Preprocess images
            ProcessedImage processedApplicant = preprocessImage(applicantBytes);
            ProcessedImage processedNidw = preprocessImage(nidwBytes);

            // Extract facial features
            FaceEncoding applicantEncoding = extractFaceEncoding(processedApplicant);
            FaceEncoding nidwEncoding = extractFaceEncoding(processedNidw);

            // Calculate similarity
            double similarity = calculateSimilarity(applicantEncoding, nidwEncoding);

            // Determine result
            PhotoMatchStatus status = determineMatchStatus(similarity);

            return PhotoMatchResult.builder()
                .matchScore(similarity * 100)  // Convert to percentage
                .status(status)
                .confidence(calculateConfidence(similarity))
                .timestamp(LocalDateTime.now())
                .build();

        } catch (FaceNotFoundException e) {
            log.error("Face not detected in one or both images", e);
            return PhotoMatchResult.builder()
                .matchScore(0.0)
                .status(PhotoMatchStatus.FACE_NOT_DETECTED)
                .confidence(ConfidenceLevel.NONE)
                .errorMessage("Face could not be detected in the image")
                .build();
        } catch (Exception e) {
            log.error("Photo matching failed", e);
            return PhotoMatchResult.builder()
                .matchScore(0.0)
                .status(PhotoMatchStatus.ERROR)
                .errorMessage(e.getMessage())
                .build();
        }
    }

    private ProcessedImage preprocessImage(byte[] imageBytes) {
        // Image preprocessing steps
        BufferedImage image = ImageIO.read(new ByteArrayInputStream(imageBytes));

        // Resize to standard dimensions (300x400)
        BufferedImage resized = Scalr.resize(image,
            Scalr.Method.QUALITY, 300, 400);

        // Convert to grayscale for better comparison
        BufferedImage grayscale = new BufferedImage(
            resized.getWidth(), resized.getHeight(),
            BufferedImage.TYPE_BYTE_GRAY);
        Graphics g = grayscale.getGraphics();
        g.drawImage(resized, 0, 0, null);
        g.dispose();

        return new ProcessedImage(grayscale);
    }

    private FaceEncoding extractFaceEncoding(ProcessedImage image) {
        // Use face recognition library to extract facial landmarks
        // and generate face encoding (128-dimensional vector)
        return faceRecognitionClient.encode(image);
    }

    private double calculateSimilarity(FaceEncoding encoding1, FaceEncoding encoding2) {
        // Cosine similarity between face encodings
        double[] vec1 = encoding1.getVector();
        double[] vec2 = encoding2.getVector();

        double dotProduct = 0.0;
        double norm1 = 0.0;
        double norm2 = 0.0;

        for (int i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }

        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }

    private PhotoMatchStatus determineMatchStatus(double similarity) {
        if (similarity >= MATCH_THRESHOLD) {
            return PhotoMatchStatus.MATCH;
        } else if (similarity >= REVIEW_THRESHOLD) {
            return PhotoMatchStatus.REVIEW_REQUIRED;
        } else {
            return PhotoMatchStatus.MISMATCH;
        }
    }

    private ConfidenceLevel calculateConfidence(double similarity) {
        if (similarity >= 0.98) return ConfidenceLevel.VERY_HIGH;
        if (similarity >= 0.95) return ConfidenceLevel.HIGH;
        if (similarity >= 0.90) return ConfidenceLevel.MEDIUM;
        if (similarity >= 0.80) return ConfidenceLevel.LOW;
        return ConfidenceLevel.VERY_LOW;
    }
}

// PhotoMatchResult.java
@Data
@Builder
public class PhotoMatchResult {
    private double matchScore;          // 0-100 percentage
    private PhotoMatchStatus status;    // MATCH, MISMATCH, REVIEW_REQUIRED
    private ConfidenceLevel confidence;
    private LocalDateTime timestamp;
    private String errorMessage;
}

public enum PhotoMatchStatus {
    MATCH,
    MISMATCH,
    REVIEW_REQUIRED,
    FACE_NOT_DETECTED,
    ERROR
}

public enum ConfidenceLevel {
    VERY_HIGH,
    HIGH,
    MEDIUM,
    LOW,
    VERY_LOW,
    NONE
}
```

---

## 7. Duplicate Detection

### 7.1 Duplicate Detection Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DUPLICATE DETECTION STRATEGY                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     LEVEL 1: EXACT NID MATCH                         │   │
│   │                                                                       │   │
│   │   • Hash-based lookup on encrypted NID                               │   │
│   │   • Unique constraint on m_client.nid_number                         │   │
│   │   • O(1) lookup via database index                                   │   │
│   │   • Result: DUPLICATE_NID if exists                                  │   │
│   │                                                                       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     LEVEL 2: PHONE NUMBER CHECK                      │   │
│   │                                                                       │   │
│   │   • Check mobile_primary for existing customers                      │   │
│   │   • Alert if same phone exists with different NID                    │   │
│   │   • Result: POTENTIAL_DUPLICATE_PHONE                                │   │
│   │                                                                       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     LEVEL 3: NAME + DOB MATCH                        │   │
│   │                                                                       │   │
│   │   • Fuzzy matching on decrypted names                                │   │
│   │   • Exact DOB match required                                         │   │
│   │   • Levenshtein distance < 3 for name similarity                     │   │
│   │   • Result: POTENTIAL_DUPLICATE_NAME                                 │   │
│   │                                                                       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     DUPLICATE DETECTION RESULT                       │   │
│   │                                                                       │   │
│   │   • NO_DUPLICATE: Proceed with registration                          │   │
│   │   • DUPLICATE_NID: Block registration                                │   │
│   │   • POTENTIAL_DUPLICATE: Flag for manual review                      │   │
│   │                                                                       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Duplicate Detection Service

```java
// DuplicateDetectionService.java
@Service
@Slf4j
public class DuplicateDetectionService {

    private final ClientRepository clientRepository;
    private final EncryptionService encryptionService;

    public DuplicateCheckResult checkForDuplicates(
            String nid,
            String phoneNumber,
            String fullName,
            LocalDate dateOfBirth) {

        List<DuplicateMatch> matches = new ArrayList<>();

        // Level 1: Exact NID match
        String encryptedNid = encryptionService.encrypt(nid);
        Optional<Client> existingByNid = clientRepository
            .findByNidNumber(encryptedNid);

        if (existingByNid.isPresent()) {
            matches.add(DuplicateMatch.builder()
                .matchType(DuplicateMatchType.EXACT_NID)
                .existingCustomerId(existingByNid.get().getId())
                .existingCif(existingByNid.get().getCustomerCif())
                .confidence(100.0)
                .build());

            return DuplicateCheckResult.builder()
                .isDuplicate(true)
                .duplicateType(DuplicateType.DUPLICATE_NID)
                .matches(matches)
                .message("NID already exists in the system")
                .build();
        }

        // Level 2: Phone number check
        Optional<Client> existingByPhone = clientRepository
            .findByMobilePrimary(phoneNumber);

        if (existingByPhone.isPresent()) {
            Client existing = existingByPhone.get();
            String decryptedExistingNid = encryptionService
                .decrypt(existing.getNidNumber());

            if (!decryptedExistingNid.equals(nid)) {
                matches.add(DuplicateMatch.builder()
                    .matchType(DuplicateMatchType.PHONE_NUMBER)
                    .existingCustomerId(existing.getId())
                    .existingCif(existing.getCustomerCif())
                    .confidence(80.0)
                    .remarks("Same phone number with different NID")
                    .build());
            }
        }

        // Level 3: Name + DOB fuzzy match
        List<Client> potentialMatches = clientRepository
            .findByDateOfBirth(dateOfBirth);

        for (Client existing : potentialMatches) {
            String decryptedName = encryptionService
                .decrypt(existing.getFullname());

            double similarity = calculateNameSimilarity(fullName, decryptedName);

            if (similarity >= 0.85) {  // 85% name similarity threshold
                matches.add(DuplicateMatch.builder()
                    .matchType(DuplicateMatchType.NAME_DOB)
                    .existingCustomerId(existing.getId())
                    .existingCif(existing.getCustomerCif())
                    .confidence(similarity * 100)
                    .remarks(String.format("Name similarity: %.1f%%",
                        similarity * 100))
                    .build());
            }
        }

        // Determine overall result
        if (matches.isEmpty()) {
            return DuplicateCheckResult.builder()
                .isDuplicate(false)
                .duplicateType(DuplicateType.NO_DUPLICATE)
                .message("No duplicates found")
                .build();
        }

        return DuplicateCheckResult.builder()
            .isDuplicate(false)  // Not an exact duplicate
            .duplicateType(DuplicateType.POTENTIAL_DUPLICATE)
            .matches(matches)
            .message("Potential duplicates found - manual review required")
            .build();
    }

    private double calculateNameSimilarity(String name1, String name2) {
        // Normalize names
        String normalized1 = normalizeName(name1);
        String normalized2 = normalizeName(name2);

        // Calculate Levenshtein distance
        int distance = LevenshteinDistance.getDefaultInstance()
            .apply(normalized1, normalized2);

        // Convert to similarity score
        int maxLength = Math.max(normalized1.length(), normalized2.length());
        return 1.0 - ((double) distance / maxLength);
    }

    private String normalizeName(String name) {
        return name.toLowerCase()
            .replaceAll("[^a-z\\s]", "")
            .replaceAll("\\s+", " ")
            .trim();
    }
}

// DuplicateCheckResult.java
@Data
@Builder
public class DuplicateCheckResult {
    private boolean isDuplicate;
    private DuplicateType duplicateType;
    private List<DuplicateMatch> matches;
    private String message;
}

@Data
@Builder
public class DuplicateMatch {
    private DuplicateMatchType matchType;
    private Long existingCustomerId;
    private String existingCif;
    private double confidence;
    private String remarks;
}

public enum DuplicateType {
    NO_DUPLICATE,
    DUPLICATE_NID,
    POTENTIAL_DUPLICATE
}

public enum DuplicateMatchType {
    EXACT_NID,
    PHONE_NUMBER,
    NAME_DOB
}
```

---

## 8. Data Security & Encryption

### 8.1 Encryption Strategy for NID Data

| Data Element | Encryption | Algorithm | Key ID | Storage |
|--------------|------------|-----------|--------|---------|
| **NID Number** | Required | AES-256-CBC | `pii_encryption_key` | Database |
| **Full Name** | Required | AES-256-CBC | `pii_encryption_key` | Database |
| **Father Name** | Required | AES-256-CBC | `pii_encryption_key` | Database |
| **Mother Name** | Required | AES-256-CBC | `pii_encryption_key` | Database |
| **Address** | Required | AES-256-CBC | `pii_encryption_key` | Database |
| **Photo** | At-Rest | AES-256-GCM | `minio_encryption_key` | MinIO |
| **NIDW Response** | Required | AES-256-CBC | `pii_encryption_key` | Database |

### 8.2 Key Management Configuration

```yaml
# Vault Key Configuration for NID Service
vault:
  address: https://vault.ulms.internal:8200
  namespace: ulms/nid-ekyc

  secrets:
    encryption:
      path: secret/data/ulms/nid-ekyc/encryption-keys
      keys:
        - name: pii_encryption_key
          purpose: NID and PII field encryption
          algorithm: AES-256-CBC
          rotation_days: 90

    api:
      path: secret/data/ulms/nid-ekyc/api-credentials
      credentials:
        - name: nidw_api_key
          purpose: NIDW API authentication
          rotation_days: 365

    certificates:
      path: secret/data/ulms/nid-ekyc/certificates
      certs:
        - name: nidw_client_cert
          purpose: NIDW mTLS authentication
          expiry_days: 365
```

### 8.3 Encryption Service Implementation

```java
// EncryptionService.java
@Service
@Slf4j
public class EncryptionService {

    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";
    private static final int IV_SIZE = 16;

    private final VaultTemplate vaultTemplate;
    private final String encryptionKeyPath;

    private SecretKey encryptionKey;

    @PostConstruct
    public void init() {
        loadEncryptionKey();
    }

    private void loadEncryptionKey() {
        VaultResponse response = vaultTemplate.read(encryptionKeyPath);
        String keyBase64 = (String) response.getData().get("pii_encryption_key");
        byte[] keyBytes = Base64.getDecoder().decode(keyBase64);
        this.encryptionKey = new SecretKeySpec(keyBytes, "AES");
        log.info("Encryption key loaded successfully");
    }

    public String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isEmpty()) {
            return plaintext;
        }

        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            byte[] iv = generateIV();
            IvParameterSpec ivSpec = new IvParameterSpec(iv);
            cipher.init(Cipher.ENCRYPT_MODE, encryptionKey, ivSpec);

            byte[] encrypted = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            // Combine IV + encrypted data
            byte[] combined = new byte[iv.length + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(encrypted, 0, combined, iv.length, encrypted.length);

            return Base64.getEncoder().encodeToString(combined);

        } catch (Exception e) {
            log.error("Encryption failed", e);
            throw new EncryptionException("Failed to encrypt data", e);
        }
    }

    public String decrypt(String ciphertext) {
        if (ciphertext == null || ciphertext.isEmpty()) {
            return ciphertext;
        }

        try {
            byte[] combined = Base64.getDecoder().decode(ciphertext);

            // Extract IV and encrypted data
            byte[] iv = new byte[IV_SIZE];
            byte[] encrypted = new byte[combined.length - IV_SIZE];
            System.arraycopy(combined, 0, iv, 0, IV_SIZE);
            System.arraycopy(combined, IV_SIZE, encrypted, 0, encrypted.length);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            IvParameterSpec ivSpec = new IvParameterSpec(iv);
            cipher.init(Cipher.DECRYPT_MODE, encryptionKey, ivSpec);

            byte[] decrypted = cipher.doFinal(encrypted);
            return new String(decrypted, StandardCharsets.UTF_8);

        } catch (Exception e) {
            log.error("Decryption failed", e);
            throw new EncryptionException("Failed to decrypt data", e);
        }
    }

    private byte[] generateIV() {
        byte[] iv = new byte[IV_SIZE];
        new SecureRandom().nextBytes(iv);
        return iv;
    }
}
```

### 8.4 NID Masking for Logging

```java
// NidMaskingUtil.java
public class NidMaskingUtil {

    /**
     * Masks NID for logging purposes
     * 13-digit: 1234*****5678
     * 17-digit: 1234*********5678
     */
    public static String maskNid(String nid) {
        if (nid == null) return null;

        int length = nid.length();
        if (length == 13) {
            return nid.substring(0, 4) + "*****" + nid.substring(9);
        } else if (length == 17) {
            return nid.substring(0, 4) + "*********" + nid.substring(13);
        }

        // Invalid format, mask completely
        return "****INVALID****";
    }

    /**
     * Masks for display in UI (last 4 digits only)
     */
    public static String maskForDisplay(String nid) {
        if (nid == null || nid.length() < 4) return "****";
        return "*".repeat(nid.length() - 4) + nid.substring(nid.length() - 4);
    }
}
```

---

## 9. Smart Card Data Extraction

### 9.1 Smart Card Reader Integration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SMART CARD DATA EXTRACTION                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    SMART CARD READER                                 │   │
│   │                                                                       │   │
│   │   ┌─────────────┐     ┌─────────────┐     ┌─────────────────────┐   │   │
│   │   │ NID Smart   │────▶│  PC/SC      │────▶│   Reader Driver     │   │   │
│   │   │   Card      │     │  Protocol   │     │   (Windows/Linux)   │   │   │
│   │   └─────────────┘     └─────────────┘     └──────────┬──────────┘   │   │
│   │                                                       │              │   │
│   └───────────────────────────────────────────────────────│──────────────┘   │
│                                                           │                  │
│                                                           ▼                  │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    BRANCH DESKTOP APPLICATION                        │   │
│   │                                                                       │   │
│   │   ┌─────────────────────────────────────────────────────────────┐   │   │
│   │   │                 Smart Card Reader Service                    │   │   │
│   │   │                                                              │   │   │
│   │   │   1. Detect card insertion                                   │   │   │
│   │   │   2. Authenticate with card (PIN if required)                │   │   │
│   │   │   3. Read NID data from chip                                 │   │   │
│   │   │   4. Extract photo (compressed JPEG)                         │   │   │
│   │   │   5. Extract personal information                            │   │   │
│   │   │   6. Verify digital signature                                │   │   │
│   │   │                                                              │   │   │
│   │   └─────────────────────────────────────────────────────────────┘   │   │
│   │                               │                                      │   │
│   └───────────────────────────────│──────────────────────────────────────┘   │
│                                   │                                          │
│                                   ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    NID/e-KYC SERVICE (Port 8082)                     │   │
│   │                                                                       │   │
│   │   Endpoint: POST /api/v1/nid/verify-smartcard                        │   │
│   │                                                                       │   │
│   │   • Receive extracted card data                                      │   │
│   │   • Validate digital signature                                       │   │
│   │   • Cross-verify with NIDW API (optional)                           │   │
│   │   • Populate customer data                                           │   │
│   │                                                                       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Smart Card Data Structure

```java
// SmartCardData.java
@Data
@Builder
public class SmartCardData {

    // Basic Information
    private String nid;
    private String nameEn;
    private String nameBn;
    private LocalDate dateOfBirth;
    private String gender;
    private String bloodGroup;

    // Family Information
    private String fatherNameEn;
    private String fatherNameBn;
    private String motherNameEn;
    private String motherNameBn;
    private String spouseNameEn;
    private String spouseNameBn;

    // Address Information
    private AddressData presentAddress;
    private AddressData permanentAddress;

    // Photo (compressed JPEG from chip)
    private byte[] photo;

    // Card Information
    private LocalDate issueDate;
    private LocalDate expiryDate;
    private String cardStatus;

    // Digital Signature
    private byte[] digitalSignature;
    private String signatureAlgorithm;

    // Verification
    private boolean signatureValid;
    private LocalDateTime extractedAt;
}
```

---

## 10. Error Handling & Fallback Procedures

### 10.1 Error Classification

| Error Type | Code | HTTP Status | Action |
|------------|------|-------------|--------|
| **Invalid NID Format** | NID_FORMAT_001 | 400 | Reject request |
| **NID Not Found** | NID_NOT_FOUND_001 | 404 | Inform user |
| **DOB Mismatch** | DOB_MISMATCH_001 | 400 | Reject verification |
| **Duplicate NID** | DUP_NID_001 | 409 | Block registration |
| **NIDW API Timeout** | NIDW_TIMEOUT_001 | 504 | Retry/Fallback |
| **NIDW API Error** | NIDW_ERROR_001 | 502 | Retry/Fallback |
| **Rate Limit Exceeded** | RATE_LIMIT_001 | 429 | Queue request |
| **Authentication Failed** | AUTH_FAIL_001 | 401 | Alert operations |
| **Encryption Error** | ENC_ERROR_001 | 500 | Alert security |

### 10.2 Fallback Procedures

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    NIDW API FALLBACK PROCEDURES                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    PRIMARY: NIDW API                                 │   │
│   │                                                                       │   │
│   │   Attempt 1 ──▶ Attempt 2 ──▶ Attempt 3 ──▶ FAIL                   │   │
│   │   (timeout 30s)  (timeout 30s)  (timeout 30s)                       │   │
│   │                                                                       │   │
│   └───────────────────────────────────────────────────────────────────┬─┘   │
│                                                                        │     │
│                               Circuit Breaker Opens                    │     │
│                                                                        ▼     │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    FALLBACK OPTION 1: Manual Verification           │   │
│   │                                                                       │   │
│   │   • Mark verification as "PENDING_MANUAL"                           │   │
│   │   • Accept NID document upload                                       │   │
│   │   • Queue for manual verification by operations team                │   │
│   │   • Allow provisional customer creation                              │   │
│   │                                                                       │   │
│   └───────────────────────────────────────────────────────────────────┬─┘   │
│                                                                        │     │
│                               If Manual Not Allowed                    │     │
│                                                                        ▼     │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    FALLBACK OPTION 2: Scheduled Retry               │   │
│   │                                                                       │   │
│   │   • Queue verification request                                       │   │
│   │   • Notify user of delay                                            │   │
│   │   • Auto-retry when circuit breaker resets                          │   │
│   │   • Send notification when complete                                  │   │
│   │                                                                       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.3 Error Handling Implementation

```java
// NidVerificationExceptionHandler.java
@RestControllerAdvice
@Slf4j
public class NidVerificationExceptionHandler {

    @ExceptionHandler(InvalidNidFormatException.class)
    public ResponseEntity<ErrorResponse> handleInvalidNidFormat(
            InvalidNidFormatException ex) {
        log.warn("Invalid NID format: {}", ex.getMessage());

        return ResponseEntity.badRequest()
            .body(ErrorResponse.builder()
                .errorCode("NID_FORMAT_001")
                .message(ex.getMessage())
                .timestamp(LocalDateTime.now())
                .build());
    }

    @ExceptionHandler(DuplicateNidException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateNid(
            DuplicateNidException ex) {
        log.warn("Duplicate NID detected: {}", ex.getMessage());

        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(ErrorResponse.builder()
                .errorCode("DUP_NID_001")
                .message("This NID is already registered in the system")
                .timestamp(LocalDateTime.now())
                .build());
    }

    @ExceptionHandler(NidwApiException.class)
    public ResponseEntity<ErrorResponse> handleNidwApiError(
            NidwApiException ex) {
        log.error("NIDW API error: {}", ex.getMessage(), ex);

        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
            .body(ErrorResponse.builder()
                .errorCode("NIDW_ERROR_001")
                .message("NID verification service is temporarily unavailable")
                .retryAfter(60)  // seconds
                .timestamp(LocalDateTime.now())
                .build());
    }

    @ExceptionHandler(CallNotPermittedException.class)
    public ResponseEntity<ErrorResponse> handleCircuitBreakerOpen(
            CallNotPermittedException ex) {
        log.warn("Circuit breaker is open for NIDW API");

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(ErrorResponse.builder()
                .errorCode("SERVICE_UNAVAILABLE_001")
                .message("Service temporarily unavailable. Please try again later.")
                .retryAfter(120)  // seconds
                .timestamp(LocalDateTime.now())
                .build());
    }
}
```

---

## 11. Rate Limiting & Quotas

### 11.1 Rate Limiting Configuration

| Consumer Type | Rate Limit | Burst Limit | Window |
|---------------|------------|-------------|--------|
| **Branch Console** | 50 req/min | 100 | 1 minute |
| **Mobile App** | 20 req/min | 30 | 1 minute |
| **API Partner** | 100 req/min | 200 | 1 minute |
| **Internal Service** | 200 req/min | 500 | 1 minute |

### 11.2 Kong Rate Limiting Configuration

```yaml
# Kong Rate Limiting Plugin for NID Service
plugins:
  - name: rate-limiting
    service: nid-ekyc-service
    config:
      minute: 100
      policy: local
      fault_tolerant: true
      hide_client_headers: false

  - name: rate-limiting-advanced
    service: nid-ekyc-service
    config:
      identifier: consumer
      window_size: 60
      window_type: sliding
      limit:
        - 50  # Per minute
      sync_rate: 10

  # Consumer-specific limits
  - name: rate-limiting
    consumer: branch-console
    config:
      minute: 50

  - name: rate-limiting
    consumer: mobile-app
    config:
      minute: 20

  - name: rate-limiting
    consumer: api-partner
    config:
      minute: 100
```

### 11.3 Resilience4j Configuration

```yaml
# application-resilience.yml
resilience4j:
  circuitbreaker:
    instances:
      nidwApi:
        registerHealthIndicator: true
        slidingWindowSize: 10
        minimumNumberOfCalls: 5
        permittedNumberOfCallsInHalfOpenState: 3
        automaticTransitionFromOpenToHalfOpenEnabled: true
        waitDurationInOpenState: 60s
        failureRateThreshold: 50
        eventConsumerBufferSize: 10
        recordExceptions:
          - java.io.IOException
          - java.util.concurrent.TimeoutException
          - org.springframework.web.client.HttpServerErrorException
        ignoreExceptions:
          - com.ulms.nid.exception.InvalidNidFormatException

  retry:
    instances:
      nidwApi:
        maxAttempts: 3
        waitDuration: 2s
        enableExponentialBackoff: true
        exponentialBackoffMultiplier: 2
        retryExceptions:
          - java.io.IOException
          - java.util.concurrent.TimeoutException
        ignoreExceptions:
          - com.ulms.nid.exception.InvalidNidFormatException

  ratelimiter:
    instances:
      nidwApi:
        limitForPeriod: 100
        limitRefreshPeriod: 60s
        timeoutDuration: 30s
        registerHealthIndicator: true

  timelimiter:
    instances:
      nidwApi:
        timeoutDuration: 30s
        cancelRunningFuture: true
```

---

## 12. Caching Strategy

### 12.1 Cache Configuration

| Cache Type | TTL | Purpose | Eviction Policy |
|------------|-----|---------|-----------------|
| **Verification Result** | 24 hours | Successful verification cache | LRU |
| **NID Hash Lookup** | 1 hour | Duplicate check optimization | LRU |
| **Rate Limit Counters** | 1 minute | Request rate tracking | Sliding window |

### 12.2 Redis Cache Configuration

```yaml
# Redis Cache Configuration
spring:
  data:
    redis:
      host: ${REDIS_HOST:redis}
      port: ${REDIS_PORT:6379}
      password: ${vault:secret/data/ulms/redis#password}
      ssl:
        enabled: true
      timeout: 2000ms

  cache:
    type: redis
    redis:
      time-to-live: 86400000  # 24 hours
      cache-null-values: false
      key-prefix: "nid::"

# Custom cache configurations
cache:
  nid-verification:
    name: nid-verification-cache
    ttl: 86400  # 24 hours
    max-size: 10000

  nid-hash:
    name: nid-hash-cache
    ttl: 3600  # 1 hour
    max-size: 50000
```

### 12.3 Cache Implementation

```java
// NidCacheService.java
@Service
@Slf4j
public class NidCacheService {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String VERIFICATION_PREFIX = "nid:verification:";
    private static final String HASH_PREFIX = "nid:hash:";
    private static final Duration VERIFICATION_TTL = Duration.ofHours(24);
    private static final Duration HASH_TTL = Duration.ofHours(1);

    public void cacheVerificationResult(String nidHash, NidVerificationResponse response) {
        String key = VERIFICATION_PREFIX + nidHash;

        try {
            redisTemplate.opsForValue().set(key, response, VERIFICATION_TTL);
            log.debug("Cached verification result for hash: {}", nidHash.substring(0, 8));
        } catch (Exception e) {
            log.warn("Failed to cache verification result", e);
        }
    }

    public Optional<NidVerificationResponse> getCachedVerification(String nidHash) {
        String key = VERIFICATION_PREFIX + nidHash;

        try {
            NidVerificationResponse cached = (NidVerificationResponse)
                redisTemplate.opsForValue().get(key);

            if (cached != null) {
                log.debug("Cache hit for verification: {}", nidHash.substring(0, 8));
            }

            return Optional.ofNullable(cached);
        } catch (Exception e) {
            log.warn("Failed to retrieve cached verification", e);
            return Optional.empty();
        }
    }

    public void cacheNidHash(String nidHash, Long customerId) {
        String key = HASH_PREFIX + nidHash;
        redisTemplate.opsForValue().set(key, customerId, HASH_TTL);
    }

    public Optional<Long> getCustomerIdByNidHash(String nidHash) {
        String key = HASH_PREFIX + nidHash;
        return Optional.ofNullable((Long) redisTemplate.opsForValue().get(key));
    }

    public void invalidateVerificationCache(String nidHash) {
        String key = VERIFICATION_PREFIX + nidHash;
        redisTemplate.delete(key);
        log.info("Invalidated verification cache for hash: {}", nidHash.substring(0, 8));
    }
}
```

---

## 13. Data Model

### 13.1 Database Tables

```sql
-- NID Verification Log Table
-- Schema: {tenant_schema}.nid_verification_log

CREATE TABLE nid_verification_log (
    id BIGSERIAL PRIMARY KEY,

    -- Foreign Key
    client_id BIGINT REFERENCES m_client(id) ON DELETE CASCADE,

    -- Request Data (Encrypted)
    nid_number VARCHAR(255) NOT NULL,                 -- ENCRYPTED
    date_of_birth DATE NOT NULL,

    -- Request Details
    verification_method VARCHAR(30) NOT NULL,         -- API, MANUAL, SMARTCARD
    verification_level VARCHAR(20) NOT NULL,          -- BASIC, STANDARD, FULL
    request_id VARCHAR(100),                          -- NIDW request ID
    api_endpoint VARCHAR(200),

    -- Response Data
    verification_status VARCHAR(30) NOT NULL,         -- SUCCESS, FAILED, etc.
    nidw_response_code VARCHAR(20),
    nidw_response_message VARCHAR(500),

    -- Stored NIDW Data (Encrypted JSON)
    nidw_data_encrypted TEXT,

    -- Match Results
    name_match_result BOOLEAN,
    name_match_score DECIMAL(5,2),
    dob_match_result BOOLEAN,
    photo_match_result BOOLEAN,
    photo_match_score DECIMAL(5,2),

    -- Error Details
    error_code VARCHAR(50),
    error_message TEXT,

    -- Performance
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP WITH TIME ZONE,
    response_time_ms INTEGER,

    -- Audit
    requested_by VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),

    -- Constraints
    CONSTRAINT chk_verification_method CHECK (
        verification_method IN ('API', 'MANUAL', 'SMARTCARD', 'OFFLINE')
    ),
    CONSTRAINT chk_verification_status CHECK (
        verification_status IN ('SUCCESS', 'FAILED', 'MISMATCH', 'TIMEOUT', 'ERROR', 'PENDING')
    )
);

-- Indexes
CREATE INDEX idx_nid_verification_client ON nid_verification_log(client_id);
CREATE INDEX idx_nid_verification_status ON nid_verification_log(verification_status);
CREATE INDEX idx_nid_verification_date ON nid_verification_log(requested_at);
CREATE INDEX idx_nid_verification_request_id ON nid_verification_log(request_id);

-- Comments
COMMENT ON TABLE nid_verification_log IS 'Audit trail for NID verification via NIDW API';
COMMENT ON COLUMN nid_verification_log.nid_number IS 'NID number - AES-256 encrypted';
COMMENT ON COLUMN nid_verification_log.nidw_data_encrypted IS 'Full NIDW response - AES-256 encrypted';
```

### 13.2 Entity Relationship

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    NID/e-KYC DATA MODEL                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────┐         ┌─────────────────────┐                   │
│   │     m_client        │         │ nid_verification_log│                   │
│   │─────────────────────│         │─────────────────────│                   │
│   │ PK: id              │◀───────┐│ PK: id              │                   │
│   │                     │        ││ FK: client_id       │───────────────┐   │
│   │ nid_number (ENC)    │        │└─────────────────────┘               │   │
│   │ nid_type            │        │                                       │   │
│   │ nid_verified        │        │                                       │   │
│   │ nid_verified_at     │        │                                       │   │
│   │ fullname (ENC)      │        │                                       │   │
│   │ fullname_bn (ENC)   │        │                                       │   │
│   │ father_name (ENC)   │        │                                       │   │
│   │ mother_name (ENC)   │        │                                       │   │
│   │ date_of_birth       │        │                                       │   │
│   │ gender              │        │┌─────────────────────┐                │   │
│   │ kyc_status          │◀───────┤│customer_kyc_        │                │   │
│   │ photo_path          │        ││verification         │                │   │
│   │                     │        │└─────────────────────┘                │   │
│   └─────────────────────┘        │                                       │   │
│            │                      │                                       │   │
│            │                      │                                       │   │
│            │ 1:N                  │ 1:N                                   │   │
│            ▼                      │                                       │   │
│   ┌─────────────────────┐        │                                       │   │
│   │  customer_address   │        │                                       │   │
│   │─────────────────────│        │                                       │   │
│   │ PK: id              │        │                                       │   │
│   │ FK: client_id       │────────┘                                       │   │
│   │ address_type        │                                                │   │
│   │ address_line1 (ENC) │                                                │   │
│   │ district            │                                                │   │
│   │ division            │                                                │   │
│   │ verification_method │                                                │   │
│   └─────────────────────┘                                                │   │
│                                                                           │   │
│                              ┌────────────────────────────────────────────┘   │
│                              │                                                │
│                              ▼                                                │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                       LEGEND                                         │   │
│   │                                                                       │   │
│   │   (ENC) = Field is AES-256 encrypted                                │   │
│   │   PK = Primary Key                                                   │   │
│   │   FK = Foreign Key                                                   │   │
│   │   1:N = One-to-Many relationship                                     │   │
│   │                                                                       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 14. Apache Camel Integration Routes

### 14.1 NIDW Integration Route

```java
// NidwIntegrationRoute.java
@Component
public class NidwIntegrationRoute extends RouteBuilder {

    @Override
    public void configure() throws Exception {

        // Error Handler
        errorHandler(deadLetterChannel("kafka:dlq.nid.verification.failed")
            .maximumRedeliveries(3)
            .redeliveryDelay(5000)
            .exponentialBackOff()
            .onRedelivery(exchange -> {
                log.warn("Retrying NIDW API call, attempt: {}",
                    exchange.getIn().getHeader(Exchange.REDELIVERY_COUNTER));
            }));

        // NID Verification Route
        from("direct:nid-verification")
            .routeId("nidw-verification-route")
            .description("NIDW API Integration Route")

            // Log incoming request
            .log(LoggingLevel.INFO, "Processing NID verification request: ${header.requestId}")

            // Transform to NIDW API format
            .process("nidwRequestTransformer")

            // Circuit Breaker
            .circuitBreaker()
                .resilience4jConfiguration()
                    .minimumNumberOfCalls(5)
                    .failureRateThreshold(50)
                    .waitDurationInOpenState(60)
                .end()

                // Call NIDW API
                .to("https4://{{nidw.api.base-url}}/verify"
                    + "?bridgeEndpoint=true"
                    + "&sslContextParameters=#nidwSslContext"
                    + "&connectionTimeout=10000"
                    + "&socketTimeout=30000")

            .onFallback()
                .process("nidwFallbackProcessor")
            .end()

            // Transform response
            .process("nidwResponseTransformer")

            // Log result
            .log(LoggingLevel.INFO, "NID verification completed: ${body.status}")

            // Publish event
            .wireTap("kafka:ulms.nid.verification.events");

        // Batch NID Verification Route (for bulk uploads)
        from("kafka:ulms.nid.verification.batch?groupId=nid-batch-processor")
            .routeId("nidw-batch-verification-route")
            .description("Batch NID Verification Route")

            .unmarshal().json(JsonLibrary.Jackson, BatchVerificationRequest.class)

            .split(body().method("getVerificationRequests"))
                .parallelProcessing()
                .executorService("nidBatchExecutor")

                .to("direct:nid-verification")

                .aggregate(header("batchId"), new NidVerificationAggregator())
                    .completionSize(header("batchSize"))
                    .completionTimeout(300000)  // 5 minutes
            .end()

            .to("kafka:ulms.nid.verification.batch.results");
    }
}
```

### 14.2 SSL Context Configuration

```java
// NidwSslContextConfig.java
@Configuration
public class NidwSslContextConfig {

    @Value("${nidw.ssl.key-store}")
    private Resource keyStore;

    @Value("${vault:secret/data/ulms/nidw#keystore-password}")
    private String keyStorePassword;

    @Value("${nidw.ssl.trust-store}")
    private Resource trustStore;

    @Value("${vault:secret/data/ulms/nidw#truststore-password}")
    private String trustStorePassword;

    @Bean("nidwSslContext")
    public SSLContextParameters nidwSslContextParameters() throws Exception {

        KeyStoreParameters keyStoreParams = new KeyStoreParameters();
        keyStoreParams.setResource(keyStore.getFile().getAbsolutePath());
        keyStoreParams.setPassword(keyStorePassword);
        keyStoreParams.setType("PKCS12");

        KeyManagersParameters keyManagersParams = new KeyManagersParameters();
        keyManagersParams.setKeyStore(keyStoreParams);
        keyManagersParams.setKeyPassword(keyStorePassword);

        KeyStoreParameters trustStoreParams = new KeyStoreParameters();
        trustStoreParams.setResource(trustStore.getFile().getAbsolutePath());
        trustStoreParams.setPassword(trustStorePassword);
        trustStoreParams.setType("JKS");

        TrustManagersParameters trustManagersParams = new TrustManagersParameters();
        trustManagersParams.setKeyStore(trustStoreParams);

        SSLContextParameters sslContextParams = new SSLContextParameters();
        sslContextParams.setKeyManagers(keyManagersParams);
        sslContextParams.setTrustManagers(trustManagersParams);
        sslContextParams.setSecureSocketProtocol("TLSv1.3");

        return sslContextParams;
    }
}
```

---

## 15. Monitoring & Observability

### 15.1 Metrics Configuration

| Metric | Type | Description |
|--------|------|-------------|
| `nid.verification.total` | Counter | Total verification requests |
| `nid.verification.success` | Counter | Successful verifications |
| `nid.verification.failed` | Counter | Failed verifications |
| `nid.verification.duration` | Timer | Verification response time |
| `nid.api.circuit.state` | Gauge | Circuit breaker state |
| `nid.cache.hit.rate` | Gauge | Cache hit percentage |
| `nid.duplicate.detected` | Counter | Duplicate NID detections |

### 15.2 Prometheus Metrics

```java
// NidMetricsService.java
@Service
public class NidMetricsService {

    private final MeterRegistry meterRegistry;

    private final Counter verificationTotalCounter;
    private final Counter verificationSuccessCounter;
    private final Counter verificationFailedCounter;
    private final Counter duplicateDetectedCounter;
    private final Timer verificationDurationTimer;

    public NidMetricsService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;

        this.verificationTotalCounter = Counter.builder("nid.verification.total")
            .description("Total NID verification requests")
            .tag("service", "nid-ekyc")
            .register(meterRegistry);

        this.verificationSuccessCounter = Counter.builder("nid.verification.success")
            .description("Successful NID verifications")
            .tag("service", "nid-ekyc")
            .register(meterRegistry);

        this.verificationFailedCounter = Counter.builder("nid.verification.failed")
            .description("Failed NID verifications")
            .tag("service", "nid-ekyc")
            .register(meterRegistry);

        this.duplicateDetectedCounter = Counter.builder("nid.duplicate.detected")
            .description("Duplicate NID detections")
            .tag("service", "nid-ekyc")
            .register(meterRegistry);

        this.verificationDurationTimer = Timer.builder("nid.verification.duration")
            .description("NID verification response time")
            .tag("service", "nid-ekyc")
            .publishPercentiles(0.5, 0.95, 0.99)
            .register(meterRegistry);
    }

    public void recordVerification(VerificationStatus status, long durationMs) {
        verificationTotalCounter.increment();

        if (status == VerificationStatus.SUCCESS) {
            verificationSuccessCounter.increment();
        } else {
            verificationFailedCounter.increment();
        }

        verificationDurationTimer.record(durationMs, TimeUnit.MILLISECONDS);
    }

    public void recordDuplicateDetected() {
        duplicateDetectedCounter.increment();
    }
}
```

### 15.3 Grafana Dashboard Queries

```promql
# NID Verification Success Rate
sum(rate(nid_verification_success_total[5m])) /
sum(rate(nid_verification_total_total[5m])) * 100

# Average Verification Duration
histogram_quantile(0.95,
  sum(rate(nid_verification_duration_seconds_bucket[5m])) by (le))

# Circuit Breaker State
resilience4j_circuitbreaker_state{name="nidwApi"}

# Duplicate Detection Rate
sum(rate(nid_duplicate_detected_total[1h]))

# Cache Hit Rate
sum(rate(cache_gets{result="hit",cache="nid-verification-cache"}[5m])) /
sum(rate(cache_gets{cache="nid-verification-cache"}[5m])) * 100
```

### 15.4 Alert Rules

```yaml
# Prometheus Alert Rules for NID Service
groups:
  - name: nid-ekyc-alerts
    rules:
      - alert: NidVerificationHighFailureRate
        expr: |
          sum(rate(nid_verification_failed_total[5m])) /
          sum(rate(nid_verification_total_total[5m])) > 0.1
        for: 5m
        labels:
          severity: warning
          service: nid-ekyc
        annotations:
          summary: "High NID verification failure rate"
          description: "NID verification failure rate is above 10% for 5 minutes"

      - alert: NidwApiCircuitBreakerOpen
        expr: resilience4j_circuitbreaker_state{name="nidwApi"} == 2
        for: 1m
        labels:
          severity: critical
          service: nid-ekyc
        annotations:
          summary: "NIDW API circuit breaker is OPEN"
          description: "Circuit breaker for NIDW API has opened, fallback is active"

      - alert: NidVerificationSlow
        expr: |
          histogram_quantile(0.95,
            sum(rate(nid_verification_duration_seconds_bucket[5m])) by (le)) > 10
        for: 10m
        labels:
          severity: warning
          service: nid-ekyc
        annotations:
          summary: "NID verification is slow"
          description: "95th percentile verification duration exceeds 10 seconds"
```

---

## 16. Compliance & Regulatory

### 16.1 BFIU e-KYC Guidelines Compliance

| BFIU Guideline | Requirement | Implementation | Status |
|----------------|-------------|----------------|--------|
| **e-KYC-001** | Digital verification via NID | NIDW API integration | ✅ |
| **e-KYC-002** | Photo matching verification | Photo match service | ✅ |
| **e-KYC-003** | Data encryption at rest | AES-256 field encryption | ✅ |
| **e-KYC-004** | Audit trail for all verifications | nid_verification_log table | ✅ |
| **e-KYC-005** | Data minimization | Only essential fields stored | ✅ |
| **e-KYC-006** | Consent management | Consent capture in workflow | ✅ |

### 16.2 ICT Security Guidelines V4.0 Compliance

| Guideline | Section | Requirement | Implementation |
|-----------|---------|-------------|----------------|
| **4.3.1** | Data Protection | Encrypt PII at rest | AES-256-CBC encryption |
| **4.3.2** | Data Minimization | Collect only necessary data | Essential fields only |
| **4.3.3** | Access Control | Role-based access | RBAC via Keycloak |
| **4.3.4** | Audit Logging | Log all data access | Comprehensive audit trail |
| **4.3.5** | Data Retention | 7 years retention | Configurable retention policy |
| **5.1.1** | Encryption | TLS 1.2+ for transit | TLS 1.3 for all connections |
| **5.2.1** | Key Management | Secure key storage | HashiCorp Vault |

### 16.3 BRD/SRS Requirements Mapping

| Requirement ID | Description | Implementation |
|----------------|-------------|----------------|
| **BRD 6.1.4** | NID/e-KYC API access | NIDW API integration |
| **SRS-LOS-001** | NID-based customer registration | Auto-populate from NIDW |
| **SRS-NID-001** | NID verification < 5 seconds | Optimized API client |
| **SRS-NID-002** | Duplicate NID detection | Multi-level detection |
| **SRS-NID-003** | Photo match verification | Photo match service |

---

## 17. Implementation Guide

### 17.1 Prerequisites

| Component | Requirement | Notes |
|-----------|-------------|-------|
| **Java** | 21 (LTS) | GraalVM recommended |
| **Spring Boot** | 3.2.1 | Parent POM version |
| **PostgreSQL** | 16 | Tenant database |
| **Redis** | 7.2 | Cache cluster |
| **Vault** | 1.15 | Secrets management |
| **NIDW Access** | API credentials | Contact NIDW for access |

### 17.2 Configuration Steps

1. **Obtain NIDW API Credentials**
   - Register with Election Commission
   - Obtain API key and client certificate
   - Store credentials in HashiCorp Vault

2. **Configure SSL Certificates**
   - Import NIDW CA certificate to trust store
   - Configure client certificate for mTLS
   - Set up certificate rotation

3. **Deploy Service**
   - Build Docker image
   - Deploy to Kubernetes
   - Configure service mesh

4. **Configure Monitoring**
   - Enable Prometheus metrics
   - Import Grafana dashboards
   - Configure alert rules

### 17.3 Testing Checklist

| Test Type | Test Case | Expected Result |
|-----------|-----------|-----------------|
| **Unit** | Valid NID format (13 digits) | Pass validation |
| **Unit** | Valid NID format (17 digits) | Pass validation |
| **Unit** | Invalid NID format | Reject with error |
| **Integration** | NIDW API call - Success | Return verified data |
| **Integration** | NIDW API call - Timeout | Trigger retry |
| **Integration** | Circuit breaker - Open | Return fallback |
| **E2E** | Full verification flow | Customer data populated |
| **Performance** | 100 concurrent requests | Response < 5 seconds |
| **Security** | Encrypted storage | Verify AES-256 |

---

## 18. Appendices

### Appendix A: Error Codes

| Code | Description | HTTP Status | Action |
|------|-------------|-------------|--------|
| NID_FORMAT_001 | Invalid NID format | 400 | Validate input |
| NID_NOT_FOUND_001 | NID not in NIDW database | 404 | Check NID |
| DOB_MISMATCH_001 | DOB doesn't match NID | 400 | Verify DOB |
| DUP_NID_001 | Duplicate NID exists | 409 | Use existing customer |
| NIDW_TIMEOUT_001 | NIDW API timeout | 504 | Retry later |
| NIDW_ERROR_001 | NIDW API error | 502 | Contact support |
| PHOTO_MATCH_001 | Photo match failed | 400 | Manual review |
| ENC_ERROR_001 | Encryption failure | 500 | Contact support |

### Appendix B: Sample API Requests

```bash
# NID Verification Request
curl -X POST https://api.ulms.internal/api/v1/nid/verify \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "nid": "12345678901234567",
    "dateOfBirth": "1990-05-15",
    "verificationLevel": "FULL",
    "photoRequired": true
  }'

# Check Duplicate NID
curl -X POST https://api.ulms.internal/api/v1/nid/check-duplicate \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "nid": "12345678901234567",
    "phoneNumber": "+8801712345678",
    "fullName": "MOHAMMAD RAHMAN KHAN",
    "dateOfBirth": "1990-05-15"
  }'
```

### Appendix C: Kafka Topics

| Topic | Purpose | Retention |
|-------|---------|-----------|
| `ulms.nid.verification.events` | Verification events | 7 days |
| `ulms.nid.verification.batch` | Batch verification requests | 1 day |
| `ulms.nid.verification.batch.results` | Batch results | 7 days |
| `dlq.nid.verification.failed` | Dead letter queue | 30 days |

### Appendix D: References

1. Bangladesh NID Wing (NIDW) API Documentation
2. BFIU Circular No. 25 - e-KYC Guidelines
3. Bangladesh Bank ICT Security Guidelines V4.0
4. ULMS BRD v1.0 - Section 6.1.4
5. ULMS SRS v2.0 - Section 3.1.1
6. Apache Camel 4.3 Documentation
7. Spring Boot 3.2 Reference Guide
8. Resilience4j Documentation

---

**Document End**

*ULMS v2.0 - NID/e-KYC Integration Design v1.0*

*Unisoft Systems Limited - Confidential*

*This document provides the comprehensive integration design for NID/e-KYC verification using NIDW API for ULMS v2.0.*

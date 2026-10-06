**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Integration Test Plan |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | QA Lead, Unisoft Systems Limited |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Draft |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | QA Lead | Initial version |

---

# Integration Test Plan

## Table of Contents

1. [Introduction](#1-introduction)
2. [Integration Points Overview](#2-integration-points-overview)
3. [Integration Test Strategy](#3-integration-test-strategy)
4. [Detailed Integration Test Scenarios](#4-detailed-integration-test-scenarios)
5. [Test Environment Setup](#5-test-environment-setup)
6. [Test Data Requirements](#6-test-data-requirements)
7. [Test Execution Plan](#7-test-execution-plan)
8. [Entry and Exit Criteria](#8-entry-and-exit-criteria)
9. [Defect Management](#9-defect-management)
10. [Risk and Mitigation](#10-risk-and-mitigation)
11. [Related Documents](#11-related-documents)

---

## 1. Introduction

### 1.1 Purpose

This Integration Test Plan defines the comprehensive testing approach for all integration points in the ULMS v2.0 system. It covers the 12+ external and internal integration points critical for Bangladesh banking operations, including Bangladesh Bank CIB, NID verification, Core Banking Systems, and payment gateways.

### 1.2 Scope

This plan covers:
- External API integrations (CIB, NID, Payment Gateways)
- Internal service-to-service communication
- Database integration layer
- Message queue integrations (Kafka)
- File-based integrations (SFTP, regulatory reporting)

### 1.3 References

- Master Test Strategy Document
- Software Requirements Specification v2.0
- API Specification Documents
- Bangladesh Bank Integration Guidelines

---

## 2. Integration Points Overview

### 2.1 Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ULMS v2.0 INTEGRATION ARCHITECTURE                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         ULMS Application                             │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │   │
│   │  │ Loan Service │  │  CIB Service │  │Report Service│               │   │
│   │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘               │   │
│   │         │                 │                 │                        │   │
│   │  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐               │   │
│   │  │Payment Service│  │  NID Service │  │  CBS Service │               │   │
│   │  └──────────────┘  └──────────────┘  └──────────────┘               │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│         ┌──────────────────────────┼──────────────────────────┐             │
│         │                          │                          │             │
│         ▼                          ▼                          ▼             │
│   ┌──────────┐              ┌──────────┐              ┌──────────┐         │
│   │Bangladesh│              │ National │              │   bKash  │         │
│   │Bank CIB  │              │  ID Wing │              │  API     │         │
│   │(mTLS)    │              │ (NIDW)   │              │(REST)    │         │
│   └──────────┘              └──────────┘              └──────────┘         │
│                                                                              │
│   ┌──────────┐              ┌──────────┐              ┌──────────┐         │
│   │  Nagad   │              │  Rocket  │              │    CBS   │         │
│   │  API     │              │  API     │              │ (Bank)   │         │
│   └──────────┘              └──────────┘              └──────────┘         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Integration Points Summary

| # | Integration Point | Type | Protocol | Criticality |
|---|-------------------|------|----------|-------------|
| 1 | Bangladesh Bank CIB Online | External | REST API + mTLS | Critical |
| 2 | NID/e-KYC (NIDW) | External | REST API + OAuth2 | Critical |
| 3 | Core Banking System (CBS) | External | REST/SOAP | Critical |
| 4 | bKash Payment Gateway | External | REST API | Critical |
| 5 | Nagad Payment Gateway | External | REST API | High |
| 6 | Rocket/DBBL Payment Gateway | External | REST API | High |
| 7 | Bangladesh Bank SFTP | External | SFTP | Critical |
| 8 | SMS Gateway (SSL/Banglalink) | External | REST API | Medium |
| 9 | Email Service (SendGrid/AWS SES) | External | REST API | Medium |
| 10 | Internal Loan Services | Internal | REST/gRPC | Critical |
| 11 | Kafka Event Stream | Internal | Kafka Protocol | Critical |
| 12 | PostgreSQL Database | Internal | JDBC | Critical |
| 13 | Redis Cache | Internal | Redis Protocol | High |

---

## 3. Integration Test Strategy

### 3.1 Testing Approach

| Strategy | Description | Tools |
|----------|-------------|-------|
| Contract Testing | Verify API contracts using Pact | Pact, Spring Cloud Contract |
| Component Testing | Test individual integration components | Testcontainers, WireMock |
| Integration Testing | Test component interactions | REST Assured, Testcontainers |
| End-to-End Testing | Full flow validation | Playwright, Cucumber |
| Chaos Testing | Resilience validation | Chaos Monkey, Gremlin |

### 3.2 Test Levels

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INTEGRATION TEST LEVELS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Level 1: Component Tests                                                    │
│  ├── Individual service testing with mocked dependencies                     │
│  └── Focus: Business logic, validation                                       │
│                                                                              │
│  Level 2: Integration Tests                                                  │
│  ├── Service + database integration                                          │
│  ├── Service + message queue integration                                     │
│  └── Focus: Data persistence, event publishing                               │
│                                                                              │
│  Level 3: Contract Tests                                                     │
│  ├── Provider/consumer contract validation                                   │
│  ├── API schema validation                                                   │
│  └── Focus: API compatibility                                                │
│                                                                              │
│  Level 4: End-to-End Tests                                                   │
│  ├── Full user journey with real dependencies (sandbox)                      │
│  └── Focus: Business process validation                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Test Automation Framework

```java
// Base Integration Test Class
@SpringBootTest
@Testcontainers
@AutoConfigureMockMvc
public abstract class BaseIntegrationTest {
    
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
        .withDatabaseName("ulms_test")
        .withUsername("test")
        .withPassword("test");
    
    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
        .withExposedPorts(6379);
    
    @Container
    static KafkaContainer kafka = new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.5.0"));
    
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", redis::getFirstMappedPort);
        registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
    }
}
```

---

## 4. Detailed Integration Test Scenarios

### 4.1 Bangladesh Bank CIB Integration (INT-001)

#### 4.1.1 Scope
- CIB inquiry submission
- CIB report retrieval
- Error handling and retries
- mTLS authentication

#### 4.1.2 Test Scenarios

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| CIB-001 | Valid borrower CIB inquiry | Returns CIB score and status |
| CIB-002 | Borrower with no CIB record | Returns "NO_RECORD" status |
| CIB-003 | CIB service timeout | Retries 3 times, then fails gracefully |
| CIB-004 | Invalid mTLS certificate | Returns authentication error |
| CIB-005 | CIB service unavailable | Circuit breaker opens, returns fallback |
| CIB-006 | Concurrent CIB requests | All requests processed without data corruption |

#### 4.1.3 Test Implementation

```java
@WireMockTest(httpPort = 9999)
class CIBIntegrationTest extends BaseIntegrationTest {
    
    @Autowired
    private CIBService cibService;
    
    @Test
    @DisplayName("CIB-001: Valid borrower CIB inquiry")
    void shouldReturnCIBReportForValidBorrower() {
        // Given
        String nid = "1234567890123";
        stubFor(post("/cib/v1/inquiry")
            .withRequestBody(matchingJsonPath("$.nid", equalTo(nid)))
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody("""
                    {
                        "cibId": "CIB-${nid}",
                        "score": 750,
                        "classification": "STANDARD",
                        "totalOutstanding": 500000.00,
                        "totalEMI": 15000.00,
                        "status": "SUCCESS"
                    }
                    """)));
        
        // When
        CIBReport report = cibService.inquiry(nid);
        
        // Then
        assertThat(report.getScore()).isEqualTo(750);
        assertThat(report.getClassification()).isEqualTo("STANDARD");
    }
    
    @Test
    @DisplayName("CIB-003: CIB service timeout with retry")
    void shouldRetryOnTimeout() {
        // Simulate timeout on first 2 attempts, success on 3rd
        stubFor(post("/cib/v1/inquiry")
            .inScenario("Retry Scenario")
            .whenScenarioStateIs(Scenario.STARTED)
            .willReturn(aResponse().withFixedDelay(11000))
            .willSetStateTo("Attempt 2"));
        
        stubFor(post("/cib/v1/inquiry")
            .inScenario("Retry Scenario")
            .whenScenarioStateIs("Attempt 2")
            .willReturn(aResponse().withFixedDelay(11000))
            .willSetStateTo("Attempt 3"));
        
        stubFor(post("/cib/v1/inquiry")
            .inScenario("Retry Scenario")
            .whenScenarioStateIs("Attempt 3")
            .willReturn(aResponse()
                .withStatus(200)
                .withBody("{\"status\": \"SUCCESS\"}")));
        
        // Execute and verify retry behavior
        CIBReport report = cibService.inquiry("1234567890123");
        assertThat(report).isNotNull();
        
        verify(3, postRequestedFor(urlEqualTo("/cib/v1/inquiry")));
    }
}
```

### 4.2 NID/e-KYC Integration (INT-002)

#### 4.2.1 Scope
- NID verification via NIDW API
- Biometric verification
- Photo matching

#### 4.2.2 Test Scenarios

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| NID-001 | Valid NID verification | Returns verified status with photo |
| NID-002 | Invalid NID number | Returns verification failed |
| NID-003 | Deceased person NID | Returns "DECEASED" status |
| NID-004 | Biometric mismatch | Returns mismatch error |
| NID-005 | NIDW service unavailable | Returns appropriate error |

#### 4.2.3 Test Implementation

```java
@Test
@DisplayName("NID-001: Valid NID verification")
void shouldVerifyValidNID() {
    // Given
    String nid = "1234567890123";
    String dob = "1990-01-01";
    
    stubFor(post("/nidw/v2/verify")
        .willReturn(aResponse()
            .withStatus(200)
            .withBody("""
                {
                    "status": "VERIFIED",
                    "nid": "1234567890123",
                    "name": "Md. Test User",
                    "nameEn": "Md. Test User",
                    "dateOfBirth": "1990-01-01",
                    "fatherName": "Father Name",
                    "motherName": "Mother Name",
                    "address": "Test Address, Dhaka",
                    "photo": "base64_encoded_photo_data",
                    "verificationId": "V20240205120000"
                }
                """)));
    
    // When
    NIDVerificationResult result = nidService.verify(nid, dob);
    
    // Then
    assertThat(result.getStatus()).isEqualTo(VerificationStatus.VERIFIED);
    assertThat(result.getName()).isEqualTo("Md. Test User");
}
```

### 4.3 CBS Integration (INT-003)

#### 4.3.1 Scope
- Account inquiry
- Disbursement posting
- Repayment posting
- Real-time balance updates

#### 4.3.2 Test Scenarios

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| CBS-001 | Valid account inquiry | Returns account details |
| CBS-002 | Account not found | Returns 404 with error message |
| CBS-003 | Loan disbursement posting | Transaction successful, GL updated |
| CBS-004 | Repayment posting | Transaction successful, balance updated |
| CBS-005 | CBS timeout with retry | Retry mechanism works correctly |
| CBS-006 | Duplicate transaction prevention | Idempotency key prevents duplicate |

#### 4.3.3 Test Implementation

```java
@Test
@DisplayName("CBS-003: Loan disbursement posting with idempotency")
void shouldPostDisbursementWithIdempotency() {
    // Given
    String idempotencyKey = UUID.randomUUID().toString();
    DisbursementRequest request = DisbursementRequest.builder()
        .loanId("LOAN001")
        .accountNumber("1200123456789")
        .amount(new BigDecimal("500000"))
        .idempotencyKey(idempotencyKey)
        .build();
    
    stubFor(post("/cbs/v1/disbursement")
        .withHeader("Idempotency-Key", equalTo(idempotencyKey))
        .willReturn(aResponse()
            .withStatus(200)
            .withBody("""
                {
                    "transactionId": "TXN123456",
                    "status": "SUCCESS",
                    "amount": 500000.00,
                    "glReference": "GL-2024-001"
                }
                """)));
    
    // When - First call
    DisbursementResponse response1 = cbsService.postDisbursement(request);
    
    // When - Second call with same idempotency key
    DisbursementResponse response2 = cbsService.postDisbursement(request);
    
    // Then
    assertThat(response1.getTransactionId()).isEqualTo(response2.getTransactionId());
    verify(1, postRequestedFor(urlEqualTo("/cbs/v1/disbursement")));
}
```

### 4.4 Payment Gateway Integration (INT-004 to INT-006)

#### 4.4.1 bKash Integration Test Scenarios

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| BK-001 | Create payment intent | Returns payment URL/ID |
| BK-002 | Payment success callback | Updates loan as paid |
| BK-003 | Payment failure callback | Records failure reason |
| BK-004 | Payment timeout | Handles timeout gracefully |
| BK-005 | Duplicate callback | Ignores duplicate webhook |
| BK-006 | Invalid signature | Rejects callback with 401 |

#### 4.4.2 Test Implementation

```java
@Test
@DisplayName("BK-001: Create bKash payment intent")
void shouldCreateBkashPayment() throws Exception {
    // Given
    PaymentRequest request = PaymentRequest.builder()
        .loanId("LOAN001")
        .amount(new BigDecimal("5000"))
        .callbackUrl("https://ulms.bank.com/callback/bkash")
        .build();
    
    stubFor(post("/bkash/v1.2.0-beta/payment/create")
        .willReturn(aResponse()
            .withStatus(200)
            .withBody("""
                {
                    "paymentID": "BK20240205120000",
                    "paymentCreateTime": "2024-02-05T12:00:00.000+06:00",
                    "transactionStatus": "Initiated",
                    "amount": "5000",
                    "currency": "BDT",
                    "intent": "sale",
                    "merchantInvoiceNumber": "INV-LOAN001-001",
                    "bkashURL": "https://bkash.com/pay/BK20240205120000"
                }
                """)));
    
    // When
    PaymentIntent intent = bkashService.createPayment(request);
    
    // Then
    assertThat(intent.getPaymentId()).startsWith("BK");
    assertThat(intent.getAmount()).isEqualByComparingTo(new BigDecimal("5000"));
    assertThat(intent.getPaymentUrl()).isNotNull();
}

@Test
@DisplayName("BK-006: Validate bKash webhook signature")
void shouldValidateWebhookSignature() throws Exception {
    // Given
    String payload = "{\"paymentID\":\"BK001\",\"status\":\"Completed\"}";
    String secret = "test_secret_key";
    String signature = calculateHmac(payload, secret);
    
    // When & Then - Valid signature
    mockMvc.perform(post("/webhooks/bkash")
        .header("X-Bkash-Signature", signature)
        .contentType(MediaType.APPLICATION_JSON)
        .content(payload))
        .andExpect(status().isOk());
    
    // When & Then - Invalid signature
    mockMvc.perform(post("/webhooks/bkash")
        .header("X-Bkash-Signature", "invalid_signature")
        .contentType(MediaType.APPLICATION_JSON)
        .content(payload))
        .andExpect(status().isUnauthorized());
}
```

### 4.5 Bangladesh Bank SFTP Integration (INT-007)

#### 4.5.1 Test Scenarios

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| SFTP-001 | Upload CL-1 report | File uploaded successfully |
| SFTP-002 | Upload with invalid credentials | Authentication error |
| SFTP-003 | Network failure during upload | Retry and resume |
| SFTP-004 | File already exists | Overwrite or version appropriately |
| SFTP-005 | Large file upload | Chunked upload successful |

---

## 5. Test Environment Setup

### 5.1 Testcontainers Configuration

```java
@TestConfiguration
public class IntegrationTestConfiguration {
    
    @Bean
    @ServiceConnection
    PostgreSQLContainer<?> postgresContainer() {
        return new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("ulms_test")
            .withUsername("ulms")
            .withPassword("ulms_test")
            .withInitScript("schema.sql");
    }
    
    @Bean
    @ServiceConnection(name = "redis")
    GenericContainer<?> redisContainer() {
        return new GenericContainer<>("redis:7-alpine")
            .withExposedPorts(6379);
    }
    
    @Bean
    @ServiceConnection(name = "kafka")
    KafkaContainer kafkaContainer() {
        return new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.5.0"));
    }
    
    @Bean
    public WireMockServer wireMockServer() {
        WireMockServer server = new WireMockServer(WireMockConfiguration.options().port(9999));
        server.start();
        return server;
    }
}
```

### 5.2 Docker Compose for Integration Tests

```yaml
# docker-compose.integration.yml
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: ulms_test
      POSTGRES_USER: ulms
      POSTGRES_PASSWORD: ulms_test
    ports:
      - "5432:5432"
    volumes:
      - ./init-scripts:/docker-entrypoint-initdb.d
      
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
      
  kafka:
    image: confluentinc/cp-kafka:7.5.0
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      
  wiremock:
    image: wiremock/wiremock:3.3.1
    ports:
      - "9999:8080"
    volumes:
      - ./wiremock/stubs:/home/wiremock/mappings
```

---

## 6. Test Data Requirements

### 6.1 Test Data Matrix

| Integration Point | Data Type | Volume | Refresh Frequency |
|-------------------|-----------|--------|-------------------|
| CIB | Borrower NID, loan history | 100+ records | Per test run |
| NID | Valid/invalid NID numbers | 50+ records | Per test run |
| CBS | Account numbers, GL codes | 200+ records | Weekly |
| Payment | Transaction references | Generated | Per test |
| SFTP | Report files | 10+ templates | Per release |

### 6.2 Test Data Factory

```java
@Component
public class IntegrationTestDataFactory {
    
    private final Faker faker = new Faker();
    
    public String generateValidNID() {
        // Bangladesh NID: 10-17 digits
        return faker.number().digits(13);
    }
    
    public String generateBankAccountNumber() {
        // Bangladesh bank account format
        return "1200" + faker.number().digits(9);
    }
    
    public CIBReport generateCIBReport(String nid) {
        return CIBReport.builder()
            .cibId("CIB-" + nid)
            .score(faker.number().numberBetween(300, 900))
            .classification(faker.options().option("STANDARD", "SMA", "SS", "DF", "BL"))
            .totalOutstanding(BigDecimal.valueOf(faker.number().randomDouble(2, 0, 10000000)))
            .totalEMI(BigDecimal.valueOf(faker.number().randomDouble(2, 1000, 100000)))
            .build();
    }
}
```

---

## 7. Test Execution Plan

### 7.1 Execution Schedule

| Week | Activity | Integration Points |
|------|----------|-------------------|
| 1-2 | Framework setup, base tests | Database, Redis, Kafka |
| 3-4 | Internal service integration | Microservices communication |
| 5-6 | External API integration - Phase 1 | CIB, NID |
| 7-8 | External API integration - Phase 2 | CBS, Payment Gateways |
| 9-10 | File-based integration | SFTP, Reporting |
| 11-12 | E2E integration flows | All points combined |
| 13-14 | Regression and stabilization | All |

### 7.2 CI/CD Integration

```yaml
# .github/workflows/integration-tests.yml
name: Integration Tests

on:
  push:
    branches: [ develop, main ]
  pull_request:
    branches: [ develop ]

jobs:
  integration-test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
      
      - name: Run Integration Tests
        run: ./gradlew integrationTest
        
      - name: Publish Test Results
        uses: actions/upload-artifact@v4
        with:
          name: integration-test-results
          path: build/reports/tests/integrationTest/
```

---

## 8. Entry and Exit Criteria

### 8.1 Entry Criteria

| Criterion | Requirement |
|-----------|-------------|
| Code Delivery | Feature code delivered and unit tested |
| Environment | Integration test environment provisioned |
| Test Data | Test data prepared and validated |
| API Contracts | API contracts documented and approved |
| Access | Access to sandbox/test APIs confirmed |

### 8.2 Exit Criteria

| Criterion | Target |
|-----------|--------|
| Test Coverage | ≥ 90% of integration points covered |
| Pass Rate | ≥ 95% tests passing |
| Critical Defects | 0 open |
| High Defects | ≤ 3 open |
| Performance | All response times < 5 seconds |
| Documentation | All integration tests documented |

---

## 9. Defect Management

### 9.1 Defect Severity Definitions

| Severity | Definition | Response Time |
|----------|------------|---------------|
| Critical | Integration completely broken, no workaround | 4 hours |
| High | Major functionality impaired, partial workaround | 24 hours |
| Medium | Minor functionality issue, easy workaround | 72 hours |
| Low | Cosmetic issue, no functional impact | Next sprint |

### 9.2 Defect Lifecycle

```
New → Triaged → Assigned → In Progress → Fixed → Ready for Test → Verified → Closed
                ↓
            Rejected → Deferred
                ↓
            Cannot Reproduce
```

---

## 10. Risk and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| External API unavailability | High | Medium | Comprehensive mocking, contract tests |
| Test environment instability | High | Medium | IaC, automated provisioning |
| Data synchronization issues | Medium | Low | Event-driven architecture tests |
| Performance degradation | Medium | Low | Performance baselines, monitoring |
| Security vulnerabilities | High | Low | Security scanning, penetration testing |

---

## 11. Related Documents

| Document | Purpose |
|----------|---------|
| `[TEST]_Master_Test_Strategy_Document_v1.0.md` | Overall testing approach |
| `[INT]_CIB_Online_API_Integration_Guide_v1.0.md` | CIB integration details |
| `[INT]_NID_eKYC_Integration_Guide_v1.0.md` | NID integration details |
| `[INT]_CBS_Integration_Patterns_Guide_v1.0.md` | CBS integration patterns |
| `[INT]_Payment_Gateway_Integration_Guide_v1.0.md` | Payment gateway details |

---

**Document Owner:** QA Lead, Unisoft Systems Limited  
**Next Review Date:** 2026-03-05  
**Classification:** Internal

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | CIB Online API Integration Guide |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Technical Lead, Unisoft Systems Limited |
| **Reviewed By** | Security Architect |
| **Classification** | Confidential |
| **Status** | Draft |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | Technical Lead | Initial version |

---

# CIB Online API Integration Guide

## Table of Contents

1. [Introduction](#1-introduction)
2. [Bangladesh Bank CIB Overview](#2-bangladesh-bank-cib-overview)
3. [Technical Architecture](#3-technical-architecture)
4. [mTLS Configuration](#4-mtls-configuration)
5. [API Integration](#5-api-integration)
6. [Error Handling](#6-error-handling)
7. [Security Considerations](#7-security-considerations)
8. [Testing Approach](#8-testing-approach)
9. [Code Examples](#9-code-examples)
10. [Troubleshooting](#10-troubleshooting)
11. [Related Documents](#11-related-documents)

---

## 1. Introduction

### 1.1 Purpose

This document provides comprehensive technical guidance for integrating ULMS v2.0 with Bangladesh Bank's Credit Information Bureau (CIB) Online system. It covers mTLS configuration, API implementation, error handling, and security best practices.

### 1.2 Scope

- CIB inquiry API integration
- CIB report retrieval
- Individual and corporate borrower inquiries
- Real-time and batch processing modes
- Error handling and retry mechanisms

### 1.3 Prerequisites

| Requirement | Description |
|-------------|-------------|
| CIB Membership | Valid Bangladesh Bank CIB membership |
| Organization ID | Unique 8-digit CIB organization code |
| Digital Certificate | Bangladesh Bank issued mTLS certificate |
| API Credentials | Client ID and API key |
| IP Whitelisting | Production server IPs registered with CIB |

---

## 2. Bangladesh Bank CIB Overview

### 2.1 CIB System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CIB ONLINE INTEGRATION ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    ┌─────────────────┐                                                      │
│    │   ULMS v2.0     │                                                      │
│    │   Application   │                                                      │
│    └────────┬────────┘                                                      │
│             │                                                                │
│    ┌────────▼────────┐     mTLS (Mutual TLS)      ┌─────────────────────┐  │
│    │   API Gateway   │═══════════════════════════▶│  Bangladesh Bank    │  │
│    │   (Kong)        │    Certificate Pinning     │  CIB Online API     │  │
│    └────────┬────────┘                            │  (cib.bb.org.bd)    │  │
│             │                                      └─────────────────────┘  │
│    ┌────────▼────────┐                                                      │
│    │  CIB Service    │                                                      │
│    │  (Spring Boot)  │                                                      │
│    └─────────────────┘                                                      │
│                                                                              │
│    Components:                                                               │
│    • Certificate Store: HSM/Vault for mTLS certificates                      │
│    • Circuit Breaker: Resilience4j for fault tolerance                       │
│    • Cache: Redis for CIB response caching (30 days)                         │
│    • Audit: All CIB calls logged for compliance                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 CIB Data Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Borrower│────▶│  NID     │────▶│  CIB     │────▶│  CIB     │
│  Request │     │  Verify  │     │  Inquiry │     │  Report  │
└──────────┘     └──────────┘     └────┬─────┘     └────┬─────┘
                                       │                │
                                       ▼                ▼
                                ┌──────────┐     ┌──────────┐
                                │ Bangladesh│    │  Score   │
                                │ Bank CIB  │    │  History │
                                │  System   │    │  Default │
                                └──────────┘     │  Status  │
                                                 └──────────┘
```

---

## 3. Technical Architecture

### 3.1 Service Architecture

```java
/**
 * CIB Service Layer Architecture
 */
@Service
public class CIBService {
    
    private final CIBClient cibClient;
    private final CIBResponseCache cache;
    private final CIBAuditLogger auditLogger;
    private final CircuitBreaker circuitBreaker;
    
    /**
     * Perform CIB inquiry with caching and audit
     */
    public CIBReport inquiry(CIBInquiryRequest request) {
        // Check cache first
        Optional<CIBReport> cached = cache.get(request.getNid());
        if (cached.isPresent() && !cached.get().isExpired()) {
            auditLogger.logCacheHit(request.getNid());
            return cached.get();
        }
        
        // Execute with circuit breaker
        return circuitBreaker.executeSupplier(() -> {
            try {
                CIBReport report = cibClient.inquiry(request);
                cache.put(request.getNid(), report);
                auditLogger.logSuccess(request, report);
                return report;
            } catch (CIBException e) {
                auditLogger.logError(request, e);
                throw e;
            }
        });
    }
}
```

### 3.2 Configuration Properties

```yaml
# application-cib.yml
integration:
  cib:
    # API Configuration
    base-url: https://cib.bb.org.bd/api/v2
    connect-timeout: 10000
    read-timeout: 30000
    
    # mTLS Configuration
    mtls:
      enabled: true
      keystore-path: ${CIB_KEYSTORE_PATH:/secure/cib/keystore.p12}
      keystore-password: ${CIB_KEYSTORE_PASSWORD}
      truststore-path: ${CIB_TRUSTSTORE_PATH:/secure/cib/truststore.p12}
      truststore-password: ${CIB_TRUSTSTORE_PASSWORD}
      
    # Organization Details
    organization:
      id: "${CIB_ORG_ID}"  # 8-digit code
      name: "${BANK_NAME}"
      
    # Retry Configuration
    retry:
      max-attempts: 3
      initial-interval: 1000
      multiplier: 2.0
      max-interval: 10000
      
    # Cache Configuration
    cache:
      enabled: true
      ttl-hours: 720  # 30 days
      max-size: 10000
      
    # Circuit Breaker
    circuit-breaker:
      failure-rate-threshold: 50
      slow-call-rate-threshold: 80
      slow-call-duration-threshold: 10000
      permitted-number-of-calls-in-half-open-state: 10
      sliding-window-size: 100
      wait-duration-in-open-state: 60000
```

---

## 4. mTLS Configuration

### 4.1 Certificate Setup

```bash
#!/bin/bash
# setup-cib-certificates.sh
# Setup CIB mTLS certificates

set -e

CIB_CERT_DIR="/secure/cib"
KEYSTORE_FILE="$CIB_CERT_DIR/keystore.p12"
TRUSTSTORE_FILE="$CIB_CERT_DIR/truststore.p12"

# Create directory
mkdir -p $CIB_CERT_DIR
chmod 700 $CIB_CERT_DIR

# Import Bangladesh Bank CIB certificate to truststore
keytool -importcert \
  -alias cib-bb-org-bd \
  -file "$CIB_CERT_DIR/bb-cib-ca.crt" \
  -keystore $TRUSTSTORE_FILE \
  -storepass "$TRUSTSTORE_PASSWORD" \
  -noprompt

# Import organization certificate to keystore
keytool -importkeystore \
  -srckeystore "$CIB_CERT_DIR/org-certificate.p12" \
  -srcstoretype PKCS12 \
  -destkeystore $KEYSTORE_FILE \
  -deststoretype PKCS12 \
  -deststorepass "$KEYSTORE_PASSWORD" \
  -srcstorepass "$SRC_KEYSTORE_PASSWORD"

# Set permissions
chmod 600 $KEYSTORE_FILE $TRUSTSTORE_FILE

echo "CIB certificates configured successfully"
```

### 4.2 Spring Boot SSL Context Configuration

```java
@Configuration
@ConditionalOnProperty(prefix = "integration.cib.mtls", name = "enabled", havingValue = "true")
public class CIBSSLConfiguration {
    
    @Value("${integration.cib.mtls.keystore-path}")
    private String keystorePath;
    
    @Value("${integration.cib.mtls.keystore-password}")
    private String keystorePassword;
    
    @Value("${integration.cib.mtls.truststore-path}")
    private String truststorePath;
    
    @Value("${integration.cib.mtls.truststore-password}")
    private String truststorePassword;
    
    @Bean
    public SSLContext cibSSLContext() throws Exception {
        // Load keystore
        KeyStore keyStore = KeyStore.getInstance("PKCS12");
        try (InputStream is = new FileInputStream(keystorePath)) {
            keyStore.load(is, keystorePassword.toCharArray());
        }
        
        // Load truststore
        KeyStore trustStore = KeyStore.getInstance("PKCS12");
        try (InputStream is = new FileInputStream(truststorePath)) {
            trustStore.load(is, truststorePassword.toCharArray());
        }
        
        // Initialize KeyManager
        KeyManagerFactory keyManagerFactory = KeyManagerFactory.getInstance(
            KeyManagerFactory.getDefaultAlgorithm());
        keyManagerFactory.init(keyStore, keystorePassword.toCharArray());
        
        // Initialize TrustManager
        TrustManagerFactory trustManagerFactory = TrustManagerFactory.getInstance(
            TrustManagerFactory.getDefaultAlgorithm());
        trustManagerFactory.init(trustStore);
        
        // Create SSL Context
        SSLContext sslContext = SSLContext.getInstance("TLSv1.3");
        sslContext.init(
            keyManagerFactory.getKeyManagers(),
            trustManagerFactory.getTrustManagers(),
            new SecureRandom()
        );
        
        return sslContext;
    }
    
    @Bean
    public SSLConnectionSocketFactory cibSSLConnectionSocketFactory(SSLContext sslContext) {
        return new SSLConnectionSocketFactory(
            sslContext,
            new String[]{"TLSv1.3"},
            null,
            SSLConnectionSocketFactory.getDefaultHostnameVerifier()
        );
    }
}
```

### 4.3 WebClient with mTLS

```java
@Configuration
public class CIBClientConfiguration {
    
    @Autowired
    private SSLContext cibSSLContext;
    
    @Bean
    public WebClient cibWebClient(
            @Value("${integration.cib.base-url}") String baseUrl,
            @Value("${integration.cib.connect-timeout}") int connectTimeout,
            @Value("${integration.cib.read-timeout}") int readTimeout) {
        
        HttpClient httpClient = HttpClient.create()
            .secure(spec -> spec.sslContext(cibSSLContext))
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, connectTimeout)
            .responseTimeout(Duration.ofMillis(readTimeout));
        
        return WebClient.builder()
            .baseUrl(baseUrl)
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .defaultHeaders(headers -> {
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.set("X-Organization-ID", orgId);
                headers.set("X-Request-ID", MDC.get("requestId"));
            })
            .filter(logRequest())
            .filter(logResponse())
            .build();
    }
    
    private ExchangeFilterFunction logRequest() {
        return ExchangeFilterFunction.ofRequestProcessor(clientRequest -> {
            log.debug("CIB Request: {} {}", 
                clientRequest.method(), 
                clientRequest.url());
            return Mono.just(clientRequest);
        });
    }
}
```

---

## 5. API Integration

### 5.1 CIB Client Implementation

```java
@Component
public class CIBClient {
    
    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    
    @Value("${integration.cib.organization.id}")
    private String organizationId;
    
    /**
     * Submit CIB inquiry for individual borrower
     */
    public CIBReport inquiry(CIBInquiryRequest request) {
        String requestId = generateRequestId();
        
        CIBInquiryPayload payload = CIBInquiryPayload.builder()
            .organizationId(organizationId)
            .requestId(requestId)
            .inquiryType("INDIVIDUAL")
            .nid(request.getNid())
            .dob(request.getDateOfBirth())
            .name(request.getName())
            .fatherName(request.getFatherName())
            .motherName(request.getMotherName())
            .timestamp(Instant.now())
            .build();
        
        return webClient.post()
            .uri("/inquiry/individual")
            .header("X-Request-ID", requestId)
            .bodyValue(payload)
            .retrieve()
            .onStatus(HttpStatusCode::is4xxClientError, this::handleClientError)
            .onStatus(HttpStatusCode::is5xxServerError, this::handleServerError)
            .bodyToMono(CIBResponse.class)
            .map(this::mapToCIBReport)
            .block();
    }
    
    /**
     * Submit CIB inquiry for corporate borrower
     */
    public CIBReport inquiryCorporate(CIBCorporateInquiryRequest request) {
        String requestId = generateRequestId();
        
        CIBCorporateInquiryPayload payload = CIBCorporateInquiryPayload.builder()
            .organizationId(organizationId)
            .requestId(requestId)
            .inquiryType("CORPORATE")
            .tradeLicenseNumber(request.getTradeLicenseNumber())
            .bin(request.getBin())
            .companyName(request.getCompanyName())
            .build();
        
        return webClient.post()
            .uri("/inquiry/corporate")
            .header("X-Request-ID", requestId)
            .bodyValue(payload)
            .retrieve()
            .bodyToMono(CIBResponse.class)
            .map(this::mapToCIBReport)
            .block();
    }
    
    /**
     * Retrieve CIB report by CIB ID
     */
    public CIBReport retrieveReport(String cibId) {
        return webClient.get()
            .uri("/report/{cibId}", cibId)
            .retrieve()
            .bodyToMono(CIBReport.class)
            .block();
    }
    
    private String generateRequestId() {
        return organizationId + "-" + Instant.now().toEpochMilli() + "-" + 
               UUID.randomUUID().toString().substring(0, 8);
    }
    
    private Mono<? extends Throwable> handleClientError(ClientResponse response) {
        return response.bodyToMono(String.class)
            .flatMap(body -> {
                log.error("CIB client error: {} - {}", response.statusCode(), body);
                return Mono.error(new CIBClientException(
                    "CIB inquiry failed: " + response.statusCode(), body));
            });
    }
    
    private Mono<? extends Throwable> handleServerError(ClientResponse response) {
        return response.bodyToMono(String.class)
            .flatMap(body -> {
                log.error("CIB server error: {} - {}", response.statusCode(), body);
                return Mono.error(new CIBServerException(
                    "CIB service unavailable: " + response.statusCode(), body));
            });
    }
}
```

### 5.2 Request/Response Models

```java
/**
 * CIB Inquiry Request
 */
@Data
@Builder
public class CIBInquiryRequest {
    @NotBlank
    @Pattern(regexp = "\\d{10,17}", message = "NID must be 10-17 digits")
    private String nid;
    
    @NotNull
    private LocalDate dateOfBirth;
    
    private String name;
    private String fatherName;
    private String motherName;
}

/**
 * CIB Report Response
 */
@Data
@Builder
public class CIBReport {
    private String cibId;
    private String nid;
    private String inquiryId;
    
    // Scoring
    private Integer score;
    private String classification;
    private String riskGrade;
    
    // Exposure
    private BigDecimal totalOutstanding;
    private BigDecimal totalEMI;
    private BigDecimal totalMonthlyInstallment;
    private Integer numActiveLoans;
    private Integer numClosedLoans;
    
    // History
    private List<ClassificationHistory> classificationHistory;
    private DefaultHistory defaultHistory;
    
    // Status
    private String status;
    private LocalDateTime inquiryDate;
    private LocalDate reportExpiryDate;
    
    public boolean isExpired() {
        return LocalDate.now().isAfter(reportExpiryDate);
    }
    
    public boolean isGoodStanding() {
        return score != null && score >= 650 && 
               !"BL".equals(classification) && 
               !"DF".equals(classification);
    }
}

/**
 * Classification History Entry
 */
@Data
@Builder
public class ClassificationHistory {
    private String month;
    private String classification;
    private BigDecimal outstanding;
}

/**
 * Default History
 */
@Data
@Builder
public class DefaultHistory {
    private boolean hasDefault;
    private BigDecimal defaultAmount;
    private LocalDate defaultDate;
    private String settlementStatus;
}
```

---

## 6. Error Handling

### 6.1 CIB Error Codes

| Error Code | Description | Action |
|------------|-------------|--------|
| CIB-001 | Invalid NID format | Reject inquiry, prompt user |
| CIB-002 | NID not found in CIB | Proceed with caution, flag for review |
| CIB-003 | CIB system timeout | Retry with exponential backoff |
| CIB-004 | CIB service unavailable | Failover to cached data or queue |
| CIB-005 | Authentication failure | Check certificates, alert operations |
| CIB-006 | Rate limit exceeded | Throttle requests, queue inquiries |
| CIB-007 | Invalid organization ID | Check configuration |
| CIB-008 | Report expired | Re-inquiry required |

### 6.2 Retry Configuration with Resilience4j

```java
@Configuration
public class CIBResilienceConfiguration {
    
    @Bean
    public RetryRegistry retryRegistry() {
        RetryConfig config = RetryConfig.custom()
            .maxAttempts(3)
            .waitDuration(Duration.ofMillis(1000))
            .intervalFunction(IntervalFunction.ofExponentialBackoff(
                Duration.ofMillis(1000), 2.0))
            .retryExceptions(
                CIBServerException.class,
                TimeoutException.class,
                IOException.class)
            .ignoreExceptions(
                CIBClientException.class,
                CIBValidationException.class)
            .build();
        
        return RetryRegistry.of(config);
    }
    
    @Bean
    public CircuitBreakerRegistry circuitBreakerRegistry() {
        CircuitBreakerConfig config = CircuitBreakerConfig.custom()
            .failureRateThreshold(50)
            .slowCallRateThreshold(80)
            .slowCallDurationThreshold(Duration.ofSeconds(10))
            .permittedNumberOfCallsInHalfOpenState(10)
            .slidingWindowSize(100)
            .waitDurationInOpenState(Duration.ofSeconds(60))
            .build();
        
        return CircuitBreakerRegistry.of(config);
    }
    
    @Bean
    public Retry cibRetry(RetryRegistry registry) {
        return registry.retry("cibInquiry");
    }
    
    @Bean
    public CircuitBreaker cibCircuitBreaker(CircuitBreakerRegistry registry) {
        return registry.circuitBreaker("cibInquiry");
    }
}
```

### 6.3 Fallback Handler

```java
@Component
public class CIBFallbackHandler {
    
    private final CIBResponseCache cache;
    private final CIBQueueService queueService;
    
    /**
     * Fallback when CIB service is unavailable
     */
    public CIBReport handleUnavailable(CIBInquiryRequest request, Exception ex) {
        log.warn("CIB service unavailable for NID: {}", request.getNid(), ex);
        
        // Try cache
        Optional<CIBReport> cached = cache.get(request.getNid());
        if (cached.isPresent()) {
            CIBReport report = cached.get();
            if (!report.isExpired()) {
                log.info("Using cached CIB report for NID: {}", request.getNid());
                return report;
            }
        }
        
        // Queue for later processing
        queueService.enqueue(request);
        
        // Return provisional report
        return CIBReport.builder()
            .nid(request.getNid())
            .status("PENDING")
            .inquiryDate(LocalDateTime.now())
            .build();
    }
    
    /**
     * Async processing of queued inquiries
     */
    @Scheduled(fixedDelay = 60000)
    public void processQueuedInquiries() {
        List<CIBInquiryRequest> pending = queueService.dequeue(10);
        
        for (CIBInquiryRequest request : pending) {
            try {
                CIBReport report = cibClient.inquiry(request);
                // Notify relevant systems
                eventPublisher.publishEvent(new CIBReportAvailableEvent(report));
            } catch (Exception e) {
                log.error("Failed to process queued CIB inquiry", e);
                queueService.requeue(request);
            }
        }
    }
}
```

---

## 7. Security Considerations

### 7.1 Security Checklist

```markdown
## CIB Integration Security Checklist

### Certificate Management
- [ ] mTLS certificates stored in HSM or secure vault
- [ ] Certificate rotation process defined
- [ ] Certificate expiry monitoring enabled
- [ ] Private keys never logged or exposed

### Data Protection
- [ ] CIB responses encrypted at rest
- [ ] CIB data access logged
- [ ] Cache TTL limited to 30 days
- [ ] PII masked in logs

### Access Control
- [ ] Role-based access to CIB data
- [ ] API calls authenticated
- [ ] Request rate limiting implemented
- [ ] IP whitelisting configured

### Audit and Compliance
- [ ] All CIB inquiries logged
- [ ] Audit logs retained for 7 years
- [ ] Regular access reviews scheduled
- [ ] Bangladesh Bank reporting accurate
```

### 7.2 Audit Logging

```java
@Component
public class CIBAuditLogger {
    
    private final AuditRepository auditRepository;
    
    public void logInquiry(CIBInquiryRequest request, CIBReport report, String userId) {
        CIBAuditLog log = CIBAuditLog.builder()
            .timestamp(Instant.now())
            .userId(userId)
            .nidHash(hashNid(request.getNid()))
            .cibId(report.getCibId())
            .inquiryType("INDIVIDUAL")
            .score(report.getScore())
            .classification(report.getClassification())
            .status(report.getStatus())
            .ipAddress(RequestContext.getClientIp())
            .userAgent(RequestContext.getUserAgent())
            .build();
        
        auditRepository.save(log);
    }
    
    private String hashNid(String nid) {
        return DigestUtils.sha256Hex(nid + salt);
    }
}
```

---

## 8. Testing Approach

### 8.1 Test Strategy

| Test Type | Scope | Tools |
|-----------|-------|-------|
| Unit Tests | Client logic, mapping | JUnit, Mockito |
| Integration Tests | With WireMock | Testcontainers, WireMock |
| Contract Tests | API schema validation | Pact |
| Security Tests | mTLS validation | OpenSSL tests |

### 8.2 WireMock Configuration for Testing

```java
@ExtendWith(WireMockExtension.class)
class CIBClientTest {
    
    @Test
    void shouldSuccessfullyInquiryCIB() {
        // Given
        String nid = "1234567890123";
        
        stubFor(post("/api/v2/inquiry/individual")
            .withRequestBody(matchingJsonPath("$.nid", equalTo(nid)))
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody("""
                    {
                        "cibId": "CIB-2024-001",
                        "score": 750,
                        "classification": "STANDARD",
                        "totalOutstanding": 500000.00,
                        "status": "SUCCESS"
                    }
                    """)));
        
        // When
        CIBReport report = cibClient.inquiry(
            CIBInquiryRequest.builder()
                .nid(nid)
                .dateOfBirth(LocalDate.of(1990, 1, 1))
                .build());
        
        // Then
        assertThat(report.getScore()).isEqualTo(750);
        assertThat(report.getClassification()).isEqualTo("STANDARD");
    }
    
    @Test
    void shouldRetryOnTimeout() {
        // Simulate timeout on first attempt, success on retry
        stubFor(post("/api/v2/inquiry/individual")
            .inScenario("Retry Test")
            .whenScenarioStateIs(Scenario.STARTED)
            .willReturn(aResponse()
                .withStatus(504)
                .withBody("{\"error\": \"Gateway Timeout\"}"))
            .willSetStateTo("Second Attempt"));
        
        stubFor(post("/api/v2/inquiry/individual")
            .inScenario("Retry Test")
            .whenScenarioStateIs("Second Attempt")
            .willReturn(aResponse()
                .withStatus(200)
                .withBody("{\"cibId\": \"CIB-001\", \"status\": \"SUCCESS\"}")));
        
        // Execute and verify retry
        CIBReport report = cibClient.inquiry(createRequest());
        assertThat(report).isNotNull();
        
        verify(2, postRequestedFor(urlEqualTo("/api/v2/inquiry/individual")));
    }
}
```

---

## 9. Code Examples

### 9.1 Complete Service Implementation

```java
@Service
@Slf4j
public class CIBInquiryService {
    
    private final CIBClient cibClient;
    private final CIBResponseCache cache;
    private final CIBAuditLogger auditLogger;
    private final Retry retry;
    private final CircuitBreaker circuitBreaker;
    
    /**
     * Perform CIB inquiry with full resilience
     */
    @Transactional(readOnly = true)
    public CIBInquiryResult performInquiry(CIBInquiryRequest request, String userId) {
        // Validate request
        validateRequest(request);
        
        // Check cache
        Optional<CIBReport> cached = cache.get(request.getNid());
        if (cached.isPresent() && isCacheValid(cached.get())) {
            auditLogger.logCacheHit(request.getNid(), userId);
            return CIBInquiryResult.builder()
                .report(cached.get())
                .source(CACHE)
                .build();
        }
        
        // Execute with resilience
        try {
            CIBReport report = executeWithResilience(request);
            
            // Cache successful response
            cache.put(request.getNid(), report);
            
            // Audit
            auditLogger.logInquiry(request, report, userId);
            
            return CIBInquiryResult.builder()
                .report(report)
                .source(CIB_API)
                .build();
                
        } catch (CIBClientException e) {
            // Client error - don't retry
            log.error("CIB client error for NID: {}", request.getNid(), e);
            throw new CIBInquiryFailedException("Invalid request: " + e.getMessage(), e);
            
        } catch (Exception e) {
            // Server error - try fallback
            log.error("CIB service error for NID: {}", request.getNid(), e);
            return handleFallback(request, cached.orElse(null));
        }
    }
    
    private CIBReport executeWithResilience(CIBInquiryRequest request) {
        Supplier<CIBReport> decorated = Decorators.ofSupplier(() -> cibClient.inquiry(request))
            .withRetry(retry)
            .withCircuitBreaker(circuitBreaker)
            .decorate();
        
        return decorated.get();
    }
    
    private boolean isCacheValid(CIBReport report) {
        return !report.isExpired() && 
               report.getInquiryDate().isAfter(LocalDateTime.now().minusDays(30));
    }
}
```

---

## 10. Troubleshooting

### 10.1 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| SSL handshake failed | Certificate mismatch | Verify cert chain, check expiry |
| Connection timeout | Network/firewall | Check connectivity, verify ports |
| 401 Unauthorized | Auth failure | Check org ID, API credentials |
| 429 Rate limited | Too many requests | Implement rate limiting, check quota |
| Empty response | CIB has no data | Normal for new borrowers |

### 10.2 Debug Commands

```bash
# Test mTLS connection
openssl s_client -connect cib.bb.org.bd:443 \
  -cert /secure/cib/client.crt \
  -key /secure/cib/client.key \
  -CAfile /secure/cib/bb-ca.crt \
  -tls1_3

# Verify certificate chain
keytool -list -v -keystore /secure/cib/keystore.p12

# Test API with curl
curl -v --cert /secure/cib/client.crt \
  --key /secure/cib/client.key \
  https://cib.bb.org.bd/api/v2/health
```

---

## 11. Related Documents

| Document | Purpose |
|----------|---------|
| `[TEST]_Integration_Test_Plan_v1.0.md` | Integration testing approach |
| `[INT]_NID_eKYC_Integration_Guide_v1.0.md` | NIDW integration details |
| `../Technology_Stack_Recommendation_v2.md` | Security architecture |

---

**Document Owner:** Technical Lead, Unisoft Systems Limited  
**Next Review Date:** 2026-03-05  
**Classification:** Confidential

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

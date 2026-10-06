**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | CIB Service Implementation Guide |
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

# CIB Service Implementation Guide

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Project Setup](#2-project-setup)
3. [Configuration](#3-configuration)
4. [Implementation Steps](#4-implementation-steps)
5. [Database Schema](#5-database-schema)
6. [Event Integration](#6-event-integration)
7. [Testing](#7-testing)
8. [Deployment](#8-deployment)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Prerequisites

### 1.1 Required Access

| Item | Purpose | How to Obtain |
|------|---------|---------------|
| CIB Institution Code | Bank identification | Bangladesh Bank registration |
| API Key | Authentication | Bangladesh Bank CIB portal |
| OAuth Credentials | Token generation | Bangladesh Bank IT support |
| SSL Certificate | Secure communication | Bangladesh Bank certificate |

### 1.2 Development Environment

```bash
# Java version
java -version  # Requires Java 21

# Maven
mvn -version   # Requires Maven 3.9+

# Verify network connectivity
curl -I https://cib.bb.org.bd/api/health
```

---

## 2. Project Setup

### 2.1 Maven Dependencies

```xml
<dependencies>
    <!-- Spring Boot WebFlux for reactive HTTP client -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-webflux</artifactId>
    </dependency>
    
    <!-- Spring Data JPA -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    
    <!-- Spring Retry -->
    <dependency>
        <groupId>org.springframework.retry</groupId>
        <artifactId>spring-retry</artifactId>
    </dependency>
    
    <!-- Resilience4j Circuit Breaker -->
    <dependency>
        <groupId>io.github.resilience4j</groupId>
        <artifactId>resilience4j-spring-boot3</artifactId>
        <version>2.1.0</version>
    </dependency>
    
    <!-- Redis for caching -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis-reactive</artifactId>
    </dependency>
    
    <!-- Jackson for JSON -->
    <dependency>
        <groupId>com.fasterxml.jackson.core</groupId>
        <artifactId>jackson-databind</artifactId>
    </dependency>
    
    <!-- Validation -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    
    <!-- Testing -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>io.projectreactor</groupId>
        <artifactId>reactor-test</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>com.squareup.okhttp3</groupId>
        <artifactId>mockwebserver</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

### 2.2 Project Structure

```
ulms-cib-service/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/unisoft/ulms/cib/
│   │   │       ├── config/
│   │   │       │   ├── CibClientConfig.java
│   │   │       │   ├── CibRetryConfig.java
│   │   │       │   └── CibCircuitBreakerConfig.java
│   │   │       ├── client/
│   │   │       │   ├── CibApiClient.java
│   │   │       │   ├── CibAuthClient.java
│   │   │       │   └── CibBatchClient.java
│   │   │       ├── service/
│   │   │       │   ├── CibService.java
│   │   │       │   ├── CibRetryService.java
│   │   │       │   └── CibAuditService.java
│   │   │       ├── domain/
│   │   │       │   ├── CibRequestEntity.java
│   │   │       │   ├── CibResponseEntity.java
│   │   │       │   └── CibRetryQueueEntity.java
│   │   │       ├── repository/
│   │   │       │   ├── CibRequestRepository.java
│   │   │       │   └── CibRetryQueueRepository.java
│   │   │       ├── dto/
│   │   │       │   ├── SubjectRequest.java
│   │   │       │   ├── ContractRequest.java
│   │   │       │   └── CibResponse.java
│   │   │       ├── exception/
│   │   │       │   ├── CibException.java
│   │   │       │   └── CibErrorHandler.java
│   │   │       └── listener/
│   │   │           └── LoanEventListener.java
│   │   └── resources/
│   │       ├── application-cib.yml
│   │       └── db/migration/
│   │           └── V1__Create_CIB_Tables.sql
│   └── test/
│       └── java/com/unisoft/ulms/cib/
│           ├── CibApiClientTest.java
│           ├── CibServiceTest.java
│           └── CibIntegrationTest.java
└── pom.xml
```

---

## 3. Configuration

### 3.1 Application Configuration

```yaml
# application-cib.yml
ulms:
  cib:
    enabled: true
    # CIB API Configuration
    api:
      base-url: https://cib.bb.org.bd/api/v2
      token-url: https://cib.bb.org.bd/oauth/token
      institution-code: ${CIB_INSTITUTION_CODE}
      api-key: ${CIB_API_KEY}
      client-id: ${CIB_CLIENT_ID}
      client-secret: ${CIB_CLIENT_SECRET}
    
    # Connection Settings
    connection:
      timeout: 30s
      read-timeout: 60s
      max-connections: 50
      max-idle-time: 30m
    
    # Retry Configuration
    retry:
      max-attempts: 3
      initial-interval: 1000
      multiplier: 2.0
      max-interval: 10000
    
    # Circuit Breaker
    circuit-breaker:
      failure-rate-threshold: 50
      wait-duration-in-open-state: 30s
      permitted-number-of-calls-in-half-open-state: 5
      sliding-window-size: 100
    
    # Cache Configuration
    cache:
      token-ttl: 3300  # 55 minutes (token expires at 60)
      inquiry-ttl: 3600  # 1 hour
    
    # Batch Processing
    batch:
      chunk-size: 1000
      max-retries: 5
      retry-interval: 300000  # 5 minutes

# WebClient Configuration
spring:
  webflux:
    client:
      connect-timeout: 30000
      response-timeout: 60000
```

### 3.2 Environment Variables

```bash
# .env file or environment configuration
CIB_INSTITUTION_CODE=BANK001
CIB_API_KEY=your-api-key-here
CIB_CLIENT_ID=your-client-id
CIB_CLIENT_SECRET=your-client-secret
CIB_ENABLED=true

# Database
CIB_DB_URL=jdbc:postgresql://localhost:5432/ulms_cib
CIB_DB_USERNAME=cib_user
CIB_DB_PASSWORD=secure-password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis-password
```

---

## 4. Implementation Steps

### Step 1: Create Configuration Classes

```java
package com.unisoft.ulms.cib.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "ulms.cib")
public class CibProperties {
    
    private boolean enabled;
    private ApiConfig api;
    private ConnectionConfig connection;
    private RetryConfig retry;
    private CircuitBreakerConfig circuitBreaker;
    private CacheConfig cache;
    private BatchConfig batch;
    
    @Data
    public static class ApiConfig {
        private String baseUrl;
        private String tokenUrl;
        private String institutionCode;
        private String apiKey;
        private String clientId;
        private String clientSecret;
    }
    
    @Data
    public static class ConnectionConfig {
        private Duration timeout;
        private Duration readTimeout;
        private int maxConnections;
        private Duration maxIdleTime;
    }
    
    @Data
    public static class RetryConfig {
        private int maxAttempts;
        private long initialInterval;
        private double multiplier;
        private long maxInterval;
    }
    
    @Data
    public static class CircuitBreakerConfig {
        private float failureRateThreshold;
        private Duration waitDurationInOpenState;
        private int permittedNumberOfCallsInHalfOpenState;
        private int slidingWindowSize;
    }
    
    @Data
    public static class CacheConfig {
        private long tokenTtl;
        private long inquiryTtl;
    }
    
    @Data
    public static class BatchConfig {
        private int chunkSize;
        private int maxRetries;
        private long retryInterval;
    }
}
```

### Step 2: Create WebClient Configuration

```java
package com.unisoft.ulms.cib.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Configuration
@RequiredArgsConstructor
public class CibClientConfig {
    
    private final CibProperties properties;
    
    @Bean
    public WebClient cibWebClient() {
        HttpClient httpClient = HttpClient.create()
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 
                (int) properties.getConnection().getTimeout().toMillis())
            .responseTimeout(properties.getConnection().getReadTimeout())
            .doOnConnected(conn -> conn
                .addHandlerLast(new ReadTimeoutHandler(
                    (int) properties.getConnection().getReadTimeout().getSeconds(), 
                    TimeUnit.SECONDS))
                .addHandlerLast(new WriteTimeoutHandler(
                    (int) properties.getConnection().getTimeout().getSeconds(), 
                    TimeUnit.SECONDS)));
        
        return WebClient.builder()
            .baseUrl(properties.getApi().getBaseUrl())
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .defaultHeader("X-API-Version", "v2")
            .build();
    }
}
```

### Step 3: Implement CIB API Client

```java
package com.unisoft.ulms.cib.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
@Slf4j
public class CibApiClient {
    
    private final WebClient cibWebClient;
    private final CibAuthenticationProvider authProvider;
    private final CibProperties properties;
    
    /**
     * Submit subject to CIB
     */
    @CircuitBreaker(name = "cib-api", fallbackMethod = "submitSubjectFallback")
    @Retry(name = "cib-api")
    @TimeLimiter(name = "cib-api")
    public Mono<SubjectResponse> submitSubject(SubjectRequest request) {
        return cibWebClient.post()
            .uri("/subjects")
            .headers(headers -> headers.addAll(authProvider.getAuthenticatedHeaders()))
            .bodyValue(request)
            .retrieve()
            .onStatus(HttpStatusCode::is4xxClientError, this::handleClientError)
            .onStatus(HttpStatusCode::is5xxServerError, this::handleServerError)
            .bodyToMono(SubjectResponse.class)
            .doOnSuccess(response -> log.info("Subject submitted successfully: {}", 
                response.getSubjectId()))
            .doOnError(error -> log.error("Failed to submit subject: {}", error.getMessage()));
    }
    
    /**
     * Submit contract to CIB
     */
    @CircuitBreaker(name = "cib-api")
    @Retry(name = "cib-api")
    public Mono<ContractResponse> submitContract(ContractRequest request) {
        return cibWebClient.post()
            .uri("/contracts")
            .headers(headers -> headers.addAll(authProvider.getAuthenticatedHeaders()))
            .bodyValue(request)
            .retrieve()
            .onStatus(HttpStatusCode::is4xxClientError, this::handleClientError)
            .onStatus(HttpStatusCode::is5xxServerError, this::handleServerError)
            .bodyToMono(ContractResponse.class);
    }
    
    /**
     * Update installment status
     */
    @CircuitBreaker(name = "cib-api")
    @Retry(name = "cib-api")
    public Mono<InstallmentResponse> updateInstallment(InstallmentRequest request) {
        return cibWebClient.put()
            .uri("/installments/{contractId}", request.getContractId())
            .headers(headers -> headers.addAll(authProvider.getAuthenticatedHeaders()))
            .bodyValue(request)
            .retrieve()
            .onStatus(HttpStatusCode::is4xxClientError, this::handleClientError)
            .onStatus(HttpStatusCode::is5xxServerError, this::handleServerError)
            .bodyToMono(InstallmentResponse.class);
    }
    
    /**
     * Subject inquiry
     */
    @CircuitBreaker(name = "cib-api")
    @Cacheable(value = "cib-inquiry", key = "#subjectId")
    public Mono<InquiryResponse> inquirySubject(String subjectId) {
        return cibWebClient.get()
            .uri("/inquiry/subjects/{subjectId}", subjectId)
            .headers(headers -> headers.addAll(authProvider.getAuthenticatedHeaders()))
            .retrieve()
            .onStatus(HttpStatusCode::is4xxClientError, this::handleClientError)
            .onStatus(HttpStatusCode::is5xxServerError, this::handleServerError)
            .bodyToMono(InquiryResponse.class);
    }
    
    private Mono<Throwable> handleClientError(ClientResponse response) {
        return response.bodyToMono(CibErrorResponse.class)
            .map(error -> new CibValidationException(error.getMessage(), error.getErrors()));
    }
    
    private Mono<Throwable> handleServerError(ClientResponse response) {
        return response.bodyToMono(String.class)
            .map(error -> new CibConnectionException("CIB server error: " + error));
    }
    
    // Fallback methods
    public Mono<SubjectResponse> submitSubjectFallback(SubjectRequest request, Exception ex) {
        log.error("Fallback triggered for subject submission: {}", ex.getMessage());
        return Mono.error(new CibException("CIB-999", "Service temporarily unavailable", true));
    }
}
```

### Step 4: Create Event Listeners

```java
package com.unisoft.ulms.cib.listener;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.fineract.infrastructure.event.business.domain.loan.LoanApprovedBusinessEvent;
import org.apache.fineract.infrastructure.event.business.domain.loan.LoanDisbursedBusinessEvent;
import org.apache.fineract.infrastructure.event.business.domain.loan.transaction.LoanRepaymentBusinessEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class LoanEventListener {
    
    private final CibService cibService;
    private final CibEventMapper eventMapper;
    
    @Async
    @EventListener
    public void handleLoanApproved(LoanApprovedBusinessEvent event) {
        try {
            SubjectRequest request = eventMapper.toSubjectRequest(event.getLoan());
            cibService.submitSubject(request);
        } catch (Exception e) {
            log.error("Failed to process loan approval event: {}", e.getMessage());
        }
    }
    
    @Async
    @EventListener
    public void handleLoanDisbursed(LoanDisbursedBusinessEvent event) {
        try {
            ContractRequest request = eventMapper.toContractRequest(event.getLoan());
            cibService.submitContract(request);
        } catch (Exception e) {
            log.error("Failed to process loan disbursement event: {}", e.getMessage());
        }
    }
    
    @Async
    @EventListener
    public void handleRepaymentPosted(LoanRepaymentBusinessEvent event) {
        try {
            InstallmentRequest request = eventMapper.toInstallmentRequest(event.getLoanTransaction());
            cibService.updateInstallment(request);
        } catch (Exception e) {
            log.error("Failed to process repayment event: {}", e.getMessage());
        }
    }
}
```

---

## 5. Database Schema

### 5.1 Migration Script

```sql
-- V1__Create_CIB_Tables.sql

-- CIB Requests table
CREATE TABLE ulms_cib_requests (
    id BIGSERIAL PRIMARY KEY,
    request_id VARCHAR(50) NOT NULL UNIQUE,
    request_type VARCHAR(20) NOT NULL,
    subject_id VARCHAR(50),
    loan_id BIGINT,
    contract_id VARCHAR(50),
    request_payload TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    cib_reference VARCHAR(100),
    cib_response TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    version BIGINT DEFAULT 0
);

CREATE INDEX idx_cib_requests_status ON ulms_cib_requests(status);
CREATE INDEX idx_cib_requests_loan ON ulms_cib_requests(loan_id);
CREATE INDEX idx_cib_requests_created ON ulms_cib_requests(created_at);

-- CIB Retry Queue
CREATE TABLE ulms_cib_retry_queue (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES ulms_cib_requests(id),
    scheduled_at TIMESTAMP NOT NULL,
    attempt_count INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cib_retry_scheduled ON ulms_cib_retry_queue(scheduled_at, status);

-- CIB Audit Log
CREATE TABLE ulms_cib_audit_log (
    id BIGSERIAL PRIMARY KEY,
    request_id VARCHAR(50) NOT NULL,
    operation VARCHAR(50) NOT NULL,
    request_payload TEXT,
    response_payload TEXT,
    status VARCHAR(20) NOT NULL,
    error_details TEXT,
    executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    executed_by VARCHAR(100)
);

CREATE INDEX idx_cib_audit_request ON ulms_cib_audit_log(request_id);
CREATE INDEX idx_cib_audit_executed ON ulms_cib_audit_log(executed_at);

-- CIB Subject Mapping
CREATE TABLE ulms_cib_subject_mapping (
    id BIGSERIAL PRIMARY KEY,
    internal_subject_id BIGINT NOT NULL,
    cib_subject_id VARCHAR(50) NOT NULL UNIQUE,
    nid_number VARCHAR(20),
    mapping_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_cib_mapping_internal ON ulms_cib_subject_mapping(internal_subject_id);
CREATE INDEX idx_cib_mapping_nid ON ulms_cib_subject_mapping(nid_number);
```

---

## 6. Event Integration

### 6.1 Kafka Integration

```java
package com.unisoft.ulms.cib.messaging;

import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CibKafkaConsumer {
    
    private final CibService cibService;
    
    @KafkaListener(topics = "loan-approved", groupId = "cib-service")
    public void handleLoanApproved(LoanApprovedEvent event) {
        cibService.processLoanApproval(event.getLoanId());
    }
    
    @KafkaListener(topics = "loan-disbursed", groupId = "cib-service")
    public void handleLoanDisbursed(LoanDisbursedEvent event) {
        cibService.processDisbursement(event.getLoanId());
    }
}
```

---

## 7. Testing

### 7.1 Unit Test Example

```java
package com.unisoft.ulms.cib;

import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClient;

class CibApiClientTest {
    
    private MockWebServer mockWebServer;
    private CibApiClient cibApiClient;
    
    @BeforeEach
    void setUp() {
        mockWebServer = new MockWebServer();
        WebClient webClient = WebClient.builder()
            .baseUrl(mockWebServer.url("/").toString())
            .build();
        cibApiClient = new CibApiClient(webClient, mockAuthProvider, mockProperties);
    }
    
    @AfterEach
    void tearDown() throws IOException {
        mockWebServer.shutdown();
    }
    
    @Test
    void submitSubject_Success() {
        // Given
        mockWebServer.enqueue(new MockResponse()
            .setResponseCode(200)
            .setBody("""
                {
                    "subjectId": "SUB123",
                    "status": "ACTIVE",
                    "createdAt": "2026-02-05T10:00:00"
                }
                """));
        
        SubjectRequest request = SubjectRequest.builder()
            .subjectName("John Doe")
            .nidNumber("1234567890")
            .build();
        
        // When
        SubjectResponse response = cibApiClient.submitSubject(request).block();
        
        // Then
        assertThat(response.getSubjectId()).isEqualTo("SUB123");
    }
}
```

---

## 8. Deployment

### 8.1 Docker Configuration

```dockerfile
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY target/ulms-cib-service-*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 8.2 Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ulms-cib-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ulms-cib-service
  template:
    metadata:
      labels:
        app: ulms-cib-service
    spec:
      containers:
        - name: cib-service
          image: ulms/cib-service:latest
          ports:
            - containerPort: 8080
          env:
            - name: CIB_INSTITUTION_CODE
              valueFrom:
                secretKeyRef:
                  name: cib-credentials
                  key: institution-code
            - name: CIB_API_KEY
              valueFrom:
                secretKeyRef:
                  name: cib-credentials
                  key: api-key
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
```

---

## 9. Troubleshooting

### 9.1 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Connection timeout | Network issue | Check firewall, verify CIB endpoint |
| Authentication failure | Invalid credentials | Verify API key and client credentials |
| Rate limiting | Too many requests | Implement backoff, check rate limits |
| SSL handshake error | Certificate issue | Update SSL certificates |
| Data validation error | Invalid request format | Check request payload against CIB schema |

### 9.2 Debug Logging

```yaml
# Enable debug logging
logging:
  level:
    com.unisoft.ulms.cib: DEBUG
    org.springframework.web.reactive: DEBUG
    reactor.netty: DEBUG
```

---

## Related Documents

| Document | Description |
|----------|-------------|
| [CIB]_CIB_Service_Technical_Specification_v1.0.md | Technical specification |
| [CIB]_CIB_API_Client_Design_v1.0.md | WebClient design details |
| [CIB]_CIB_Batch_Processing_Design_v1.0.md | Batch processing design |

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | CIB Service Test Suite - Unit and Integration Tests |
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

# CIB Service Test Suite - Unit and Integration Tests

## Table of Contents

1. [Introduction](#1-introduction)
2. [Test Strategy](#2-test-strategy)
3. [Unit Tests](#3-unit-tests)
4. [Integration Tests](#4-integration-tests)
5. [Contract Tests](#5-contract-tests)
6. [Performance Tests](#6-performance-tests)
7. [Test Data](#7-test-data)
8. [Mock Services](#8-mock-services)
9. [Coverage Requirements](#9-coverage-requirements)

---

## 1. Introduction

### 1.1 Purpose

This document defines the comprehensive test suite for the CIB Service including unit tests, integration tests, and contract tests.

### 1.2 Test Categories

| Category | Framework | Coverage Target |
|----------|-----------|-----------------|
| Unit Tests | JUnit 5, Mockito | 80% |
| Integration Tests | Testcontainers, WebTestClient | Critical paths |
| Contract Tests | Pact | API contracts |
| Performance Tests | Gatling | Load testing |

---

## 2. Test Strategy

### 2.1 Test Pyramid

```
        /\
       /  \
      / E2E\          10% - End-to-End Tests
     /------\
    /  Intg  \        30% - Integration Tests
   /----------\
  /    Unit    \      60% - Unit Tests
 /--------------\
```

---

## 3. Unit Tests

### 3.1 Service Layer Tests

```java
package com.unisoft.ulms.cib.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@ExtendWith(MockitoExtension.class)
class CibServiceTest {
    
    @Mock
    private CibApiClient apiClient;
    
    @Mock
    private CibRequestRepository requestRepository;
    
    @Mock
    private CibAuditService auditService;
    
    @InjectMocks
    private CibServiceImpl cibService;
    
    @Test
    void submitSubject_Success() {
        // Given
        SubjectRequest request = SubjectRequest.builder()
            .subjectName("John Doe")
            .nidNumber("1234567890")
            .build();
        
        SubjectResponse expectedResponse = SubjectResponse.builder()
            .subjectId("SUB123")
            .status(SubjectStatus.ACTIVE)
            .build();
        
        when(apiClient.submitSubject(any())).thenReturn(Mono.just(expectedResponse));
        when(requestRepository.save(any())).thenReturn(createMockEntity());
        
        // When & Then
        StepVerifier.create(cibService.submitSubject(request))
            .expectNextMatches(response -> 
                response.getData().getSubjectId().equals("SUB123"))
            .verifyComplete();
    }
    
    @Test
    void submitSubject_ValidationError() {
        // Given
        SubjectRequest request = SubjectRequest.builder()
            .subjectName("")  // Invalid - empty name
            .build();
        
        // When & Then
        StepVerifier.create(cibService.submitSubject(request))
            .expectError(ValidationException.class)
            .verify();
    }
    
    @Test
    void submitSubject_ApiError_Retryable() {
        // Given
        SubjectRequest request = createValidRequest();
        
        when(apiClient.submitSubject(any()))
            .thenReturn(Mono.error(new CibConnectionException("Timeout")));
        
        // When & Then
        StepVerifier.create(cibService.submitSubject(request))
            .expectError(CibException.class)
            .verify();
        
        // Verify retry was attempted
        verify(apiClient, times(3)).submitSubject(any());
    }
}
```

### 3.2 Client Layer Tests

```java
package com.unisoft.ulms.cib.client;

import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.test.StepVerifier;

class CibApiClientTest {
    
    private MockWebServer mockWebServer;
    private CibApiClient cibApiClient;
    
    @BeforeEach
    void setUp() {
        mockWebServer = new MockWebServer();
        WebClient webClient = WebClient.builder()
            .baseUrl(mockWebServer.url("/").toString())
            .build();
        cibApiClient = new CibApiClient(webClient, mockAuthProvider);
    }
    
    @AfterEach
    void tearDown() throws IOException {
        mockWebServer.shutdown();
    }
    
    @Test
    void submitSubject_Success() throws InterruptedException {
        // Given
        mockWebServer.enqueue(new MockResponse()
            .setResponseCode(200)
            .setHeader("Content-Type", "application/json")
            .setBody("""
                {
                    "subjectId": "CIB-SUB-001",
                    "status": "ACTIVE",
                    "createdAt": "2026-02-05T10:00:00"
                }
                """));
        
        SubjectRequest request = SubjectRequest.builder()
            .subjectName("Test User")
            .nidNumber("1234567890")
            .build();
        
        // When & Then
        StepVerifier.create(cibApiClient.submitSubject(request))
            .expectNextMatches(response -> 
                response.getSubjectId().equals("CIB-SUB-001"))
            .verifyComplete();
        
        // Verify request
        RecordedRequest recordedRequest = mockWebServer.takeRequest();
        assertThat(recordedRequest.getMethod()).isEqualTo("POST");
        assertThat(recordedRequest.getPath()).isEqualTo("/subjects");
    }
    
    @Test
    void submitSubject_4xxError() {
        // Given
        mockWebServer.enqueue(new MockResponse()
            .setResponseCode(400)
            .setBody("""
                {
                    "errorCode": "VAL-001",
                    "message": "Invalid NID format"
                }
                """));
        
        // When & Then
        StepVerifier.create(cibApiClient.submitSubject(createRequest()))
            .expectError(CibValidationException.class)
            .verify();
    }
    
    @Test
    void inquirySubject_CacheHit() {
        // Given - cached response
        when(redisTemplate.opsForValue().get(anyString()))
            .thenReturn(Mono.just(createCachedResponse()));
        
        // When & Then - should not call API
        StepVerifier.create(cibApiClient.inquirySubject("SUB123"))
            .expectNextCount(1)
            .verifyComplete();
        
        verify(webClient, never()).get();
    }
}
```

---

## 4. Integration Tests

### 4.1 Testcontainers Setup

```java
package com.unisoft.ulms.cib.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class CibServiceIntegrationTest {
    
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
        .withDatabaseName("ulms_cib_test")
        .withUsername("test")
        .withPassword("test");
    
    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
        .withExposedPorts(6379);
    
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.redis.host", redis::getHost);
        registry.add("spring.redis.port", redis::getFirstMappedPort);
    }
    
    @Autowired
    private CibService cibService;
    
    @Autowired
    private CibRequestRepository requestRepository;
    
    @Test
    void fullSubjectSubmissionFlow() {
        // Given
        SubjectRequest request = SubjectRequest.builder()
            .subjectName("Integration Test User")
            .nidNumber("9876543210")
            .mobileNumber("01712345678")
            .build();
        
        // When
        CibResponse<SubjectResponse> response = cibService
            .submitSubject(request)
            .block();
        
        // Then
        assertThat(response.isSuccess()).isTrue();
        assertThat(requestRepository.count()).isEqualTo(1);
    }
}
```

---

## 5. Contract Tests

```java
package com.unisoft.ulms.cib.contract;

import au.com.dius.pact.consumer.MockServer;
import au.com.dius.pact.consumer.dsl.PactDslWithProvider;
import au.com.dius.pact.consumer.junit5.PactConsumerTestExt;
import au.com.dius.pact.consumer.junit5.PactTestFor;
import au.com.dius.pact.core.model.V4Pact;
import au.com.dius.pact.core.model.annotations.Pact;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

@ExtendWith(PactConsumerTestExt.class)
@PactTestFor(providerName = "cib-online-api")
class CibConsumerContractTest {
    
    @Pact(consumer = "ulms-cib-service")
    public V4Pact submitSubjectPact(PactDslWithProvider builder) {
        return builder
            .given("CIB API is available")
            .uponReceiving("Submit valid subject")
            .path("/api/v2/subjects")
            .method("POST")
            .headers("Content-Type", "application/json")
            .body(newJsonBody(o -> {
                o.stringType("subjectName", "John Doe");
                o.stringType("nidNumber", "1234567890");
            }).build())
            .willRespondWith()
            .status(200)
            .body(newJsonBody(o -> {
                o.stringType("subjectId", "SUB-001");
                o.stringType("status", "ACTIVE");
            }).build())
            .toPact(V4Pact.class);
    }
    
    @Test
    @PactTestFor(pactMethod = "submitSubjectPact")
    void testSubmitSubject(MockServer mockServer) {
        // Test with mock server
    }
}
```

---

## 6. Performance Tests

```java
package com.unisoft.ulms.cib.performance;

import io.gatling.javaapi.core.ScenarioBuilder;
import io.gatling.javaapi.core.Simulation;
import io.gatling.javaapi.http.HttpProtocolBuilder;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

public class CibServiceLoadTest extends Simulation {
    
    HttpProtocolBuilder httpProtocol = http
        .baseUrl("http://localhost:8080")
        .acceptHeader("application/json");
    
    ScenarioBuilder submitSubjectScenario = scenario("Submit Subject")
        .exec(http("Submit Subject")
            .post("/api/v1/cib/subjects")
            .body(StringBody("""
                {
                    "subjectName": "Test User",
                    "nidNumber": "1234567890",
                    "mobileNumber": "01712345678"
                }
                """))
            .check(status().is(200)));
    
    {
        setUp(
            submitSubjectScenario.injectOpen(
                rampUsersPerSec(10).to(100).during(60)
            )
        ).protocols(httpProtocol);
    }
}
```

---

## 7. Test Data

### 7.1 Test Data Builder

```java
package com.unisoft.ulms.cib.testdata;

public class CibTestDataBuilder {
    
    public static SubjectRequest validSubjectRequest() {
        return SubjectRequest.builder()
            .subjectName("Test User")
            .nidNumber("1234567890")
            .mobileNumber("01712345678")
            .dateOfBirth(LocalDate.of(1990, 1, 1))
            .presentAddress(validAddress())
            .build();
    }
    
    public static SubjectRequest invalidSubjectRequest() {
        return SubjectRequest.builder()
            .subjectName("")  // Invalid
            .build();
    }
}
```

---

## 8. Mock Services

```java
package com.unisoft.ulms.cib.mock;

public class MockCibServer {
    
    public static void setupStub(WireMockServer server) {
        server.stubFor(post("/api/v2/subjects")
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBody("""
                    {"subjectId": "MOCK-SUB-001", "status": "ACTIVE"}
                    """)));
    }
}
```

---

## 9. Coverage Requirements

| Component | Line Coverage | Branch Coverage |
|-----------|--------------|-----------------|
| Service Layer | 85% | 80% |
| Client Layer | 80% | 75% |
| DTO Validators | 90% | 85% |
| Retry Logic | 80% | 80% |

---

## Related Documents

| Document | Description |
|----------|-------------|
| [CIB]_CIB_Service_Technical_Specification_v1.0.md | Service specification |
| [TEST]_Unit_Testing_Guide_JUnit5_Mockito_v1.0.md | Unit testing guide |
| [TEST]_Integration_Testing_Guide_Testcontainers_v1.0.md | Integration testing guide |

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

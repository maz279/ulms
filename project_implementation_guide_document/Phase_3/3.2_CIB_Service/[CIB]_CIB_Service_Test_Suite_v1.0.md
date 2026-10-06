**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | CIB Service Test Suite |
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

# CIB Service Test Suite

## 1. Test Strategy Overview

### 1.1 Testing Levels

| Level | Coverage | Tools |
|-------|----------|-------|
| Unit Tests | Individual classes | JUnit 5, Mockito |
| Integration Tests | Service interactions | Testcontainers, WireMock |
| API Contract Tests | API specifications | Pact |
| Performance Tests | Load and stress | JMeter, Gatling |
| E2E Tests | Complete flows | Cucumber |

### 1.2 Test Environment

| Environment | CIB Endpoint | Purpose |
|-------------|--------------|---------|
| Local | WireMock | Development |
| CI/CD | WireMock | Automated testing |
| Staging | CIB Sandbox | Integration testing |
| UAT | CIB Sandbox | User acceptance |
| Production | CIB Production | Live operations |

## 2. Unit Tests

### 2.1 CibServiceImplTest

```java
@ExtendWith(MockitoExtension.class)
@DisplayName("CIB Service Unit Tests")
class CibServiceImplTest {
    
    @Mock
    private CibApiClient apiClient;
    
    @Mock
    private CibCacheService cacheService;
    
    @Mock
    private CibDecisionEngine decisionEngine;
    
    @InjectMocks
    private CibServiceImpl cibService;
    
    @Test
    @DisplayName("Should return cached report when available")
    void shouldReturnCachedReport() {
        String nid = "1234567890";
        CibIndividualInquiryRequest request = createRequest(nid);
        CibIndividualReport cachedReport = createReport(nid, 750);
        
        when(cacheService.getIndividualReport(nid))
            .thenReturn(Mono.just(cachedReport));
        
        CibIndividualReport result = cibService.inquireIndividual(request).block();
        
        assertThat(result.getCibScore()).isEqualTo(750);
        verify(apiClient, never()).inquireIndividual(any());
    }
    
    @Test
    @DisplayName("Should call API and cache on cache miss")
    void shouldCallApiOnCacheMiss() {
        String nid = "1234567890";
        CibIndividualInquiryRequest request = createRequest(nid);
        CibIndividualReport apiResponse = createReport(nid, 650);
        
        when(cacheService.getIndividualReport(nid)).thenReturn(Mono.empty());
        when(apiClient.inquireIndividual(request)).thenReturn(Mono.just(apiResponse));
        when(cacheService.cacheIndividualReport(any(), any())).thenReturn(Mono.just(true));
        
        CibIndividualReport result = cibService.inquireIndividual(request).block();
        
        assertThat(result.getCibScore()).isEqualTo(650);
        verify(apiClient).inquireIndividual(request);
        verify(cacheService).cacheIndividualReport(nid, apiResponse);
    }
    
    private CibIndividualInquiryRequest createRequest(String nid) {
        return CibIndividualInquiryRequest.builder()
            .nid(nid)
            .name("TEST USER")
            .dateOfBirth("1990-01-01")
            .inquiryPurpose(InquiryPurpose.LOAN_APPLICATION)
            .build();
    }
    
    private CibIndividualReport createReport(String nid, int score) {
        return CibIndividualReport.builder()
            .nid(nid)
            .cibScore(score)
            .defaultHistory(Collections.emptyList())
            .build();
    }
}
```

### 2.2 CibDecisionEngineTest

```java
@ExtendWith(MockitoExtension.class)
@DisplayName("CIB Decision Engine Tests")
class CibDecisionEngineTest {
    
    private CibDecisionEngine decisionEngine;
    
    @BeforeEach
    void setUp() {
        decisionEngine = new CibDecisionEngine();
    }
    
    @ParameterizedTest
    @CsvSource({
        "800, APPROVE",
        "750, APPROVE",
        "649, APPROVE_WITH_CONDITIONS",
        "550, APPROVE_WITH_CONDITIONS",
        "549, REVIEW",
        "399, REJECT"
    })
    @DisplayName("Should make decision based on score")
    void shouldDecideBasedOnScore(int score, CibDecision expected) {
        CibIndividualReport report = CibIndividualReport.builder()
            .cibScore(score)
            .defaultHistory(Collections.emptyList())
            .build();
        
        CibDecision decision = decisionEngine.evaluate(report);
        
        assertThat(decision).isEqualTo(expected);
    }
    
    @Test
    @DisplayName("Should reject if has active default")
    void shouldRejectOnActiveDefault() {
        CibIndividualReport report = CibIndividualReport.builder()
            .cibScore(800)
            .defaultHistory(List.of(
                CibDefaultRecord.builder()
                    .status(DefaultStatus.ACTIVE)
                    .build()
            ))
            .build();
        
        CibDecision decision = decisionEngine.evaluate(report);
        
        assertThat(decision).isEqualTo(CibDecision.REJECT);
    }
}
```

## 3. Integration Tests

### 3.1 CibApiIntegrationTest

```java
@SpringBootTest
@Testcontainers
@DisplayName("CIB API Integration Tests")
class CibApiIntegrationTest {
    
    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
        .withExposedPorts(6379);
    
    @Container
    static WireMockContainer wireMock = new WireMockContainer("wiremock/wiremock:3.3.1");
    
    @Autowired
    private CibApiClient cibApiClient;
    
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.redis.host", redis::getHost);
        registry.add("spring.redis.port", redis::getFirstMappedPort);
        registry.add("ulms.cib.base-url", wireMock::getBaseUrl);
    }
    
    @Test
    @DisplayName("Should successfully inquire individual")
    void shouldInquireIndividual() {
        stubFor(post("/api/v1/inquiry/individual")
            .willReturn(aResponse()
                .withStatus(200)
                .withHeader("Content-Type", "application/json")
                .withBodyFile("cib-individual-response.json")));
        
        CibIndividualInquiryRequest request = CibIndividualInquiryRequest.builder()
            .nid("1234567890")
            .name("MOHAMMAD ALI")
            .dateOfBirth("1990-01-01")
            .inquiryPurpose(InquiryPurpose.LOAN_APPLICATION)
            .build();
        
        CibIndividualReport report = cibApiClient.inquireIndividual(request).block();
        
        assertThat(report).isNotNull();
        assertThat(report.getCibScore()).isEqualTo(685);
    }
}
```

## 4. Performance Tests

### 4.1 Gatling Simulation

```scala
package com.unisoft.ulms.cib.simulation

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._

class CibServiceSimulation extends Simulation {
  
  val httpProtocol = http
    .baseUrl("http://localhost:8080")
    .acceptHeader("application/json")
    .contentTypeHeader("application/json")
  
  val individualInquiry = exec(
    http("Individual CIB Inquiry")
      .post("/api/v1/cib/inquiry/individual")
      .body(StringBody("""
        {
          "nid": "${nid}",
          "name": "Test User",
          "dateOfBirth": "1990-01-01",
          "inquiryPurpose": "LOAN_APPLICATION"
        }
      """))
      .check(status.is(200))
  )
  
  val users = csv("nids.csv").circular
  
  val scn = scenario("CIB Service Load Test")
    .feed(users)
    .exec(individualInquiry)
  
  setUp(
    scn.inject(
      rampUsersPerSec(1).to(50).during(60),
      constantUsersPerSec(50).during(300)
    )
  ).protocols(httpProtocol)
}
```

## 5. Test Coverage Requirements

| Component | Line Coverage | Branch Coverage |
|-----------|---------------|-----------------|
| CibService | 90% | 85% |
| CibApiClient | 85% | 80% |
| CibCacheService | 90% | 85% |
| CibDecisionEngine | 95% | 90% |
| CibBatchService | 85% | 80% |

---

## Appendices

### A.1 Test Data

| NID | Name | Score | Scenario |
|-----|------|-------|----------|
| 1234567890 | MOHAMMAD ALI | 685 | Good score |
| 1234567891 | ABDUL KARIM | 400 | Poor score |
| 1234567892 | TEST DEFAULT | 700 | Has default |

### A.2 CI/CD Integration

```yaml
# .github/workflows/cib-tests.yml
name: CIB Service Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Unit Tests
        run: ./gradlew :cib-service:test
      - name: Run Integration Tests
        run: ./gradlew :cib-service:integrationTest
      - name: Generate Coverage Report
        run: ./gradlew :cib-service:jacocoTestReport
```

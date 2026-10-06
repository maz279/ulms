**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | API Contract Testing - Pact |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Unisoft Technical Team |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# API Contract Testing - Pact

## 1. Overview

Pact ensures API contracts between services are not broken during changes.

## 2. Consumer Test (Frontend Service)

```java
@PactTestFor(providerName = "loan-service")
class LoanServiceConsumerTest {
    
    @Pact(consumer = "web-frontend")
    public RequestResponsePact loanApplicationPact(PactDslWithProvider builder) {
        return builder
            .given("loan application exists")
            .uponReceiving("get loan application by id")
            .path("/api/v1/loan-applications/123")
            .method("GET")
            .willRespondWith()
            .status(200)
            .body(new PactDslJsonBody()
                .integerType("id", 123)
                .stringType("customerName", "John Doe")
                .stringType("nid", "1234567890")
                .decimalType("loanAmount", 500000.00)
                .stringType("status", "PENDING")
                .stringType("applicationDate", "2026-02-08T10:00:00"))
            .toPact();
    }
    
    @PactTestFor(pactMethod = "loanApplicationPact")
    @Test
    void shouldGetLoanApplication(MockServer mockServer) {
        // Use the mock server URL
        LoanServiceClient client = new LoanServiceClient(mockServer.getUrl());
        
        LoanApplication app = client.getApplication(123L);
        
        assertThat(app.getId()).isEqualTo(123L);
        assertThat(app.getCustomerName()).isEqualTo("John Doe");
    }
}
```

## 3. Provider Verification

```java
@Provider("loan-service")
@PactFolder("pacts")
class LoanServiceProviderTest {
    
    @TestTemplate
    @ExtendWith(PactVerificationInvocationContextProvider.class)
    void pactVerificationTestTemplate(PactVerificationContext context) {
        context.verifyInteraction();
    }
    
    @BeforeEach
    void before(PactVerificationContext context) {
        context.setTarget(new HttpTestTarget("localhost", 8080));
    }
    
    @State("loan application exists")
    void setupLoanApplication() {
        // Setup test data
        loanRepository.save(LoanApplication.builder()
            .id(123L)
            .customerName("John Doe")
            .nid("1234567890")
            .loanAmount(new BigDecimal("500000"))
            .status(ApplicationStatus.PENDING)
            .build());
    }
}
```

## 4. CI/CD Integration

```yaml
# Publish pacts
publish-pacts:
  stage: test
  script:
    - ./mvnw pact:publish
  variables:
    PACT_BROKER_URL: https://pact.unisoft.com.bd
    PACT_BROKER_TOKEN: ${PACT_TOKEN}

# Verify pacts
verify-pacts:
  stage: integration
  script:
    - ./mvnw pact:verify
  only:
    - merge_requests
```

---

## Appendices

### A.1 Pact Broker

| Feature | Description |
|---------|-------------|
| Contract storage | Central pact repository |
| Versioning | Track pact versions |
| Webhooks | Trigger verification |
| Can-I-Deploy | Check before deployment |

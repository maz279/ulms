**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | API Contract Testing - Pact |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Technical Lead |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# API Contract Testing - Pact

## Dependencies

```xml
<dependency>
    <groupId>au.com.dius.pact.consumer</groupId>
    <artifactId>junit5</artifactId>
    <version>4.6.0</version>
    <scope>test</scope>
</dependency>
```

## Consumer Test

```java
@ExtendWith(PactConsumerTestExt.class)
@PactTestFor(providerName = "cib-service")
class CibConsumerContractTest {
    
    @Pact(consumer = "loan-service")
    public V4Pact cibVerifyPact(PactDslWithProvider builder) {
        return builder
            .given("CIB verification available")
            .uponReceiving("Verify NID request")
            .path("/api/v1/cib/verify")
            .method("POST")
            .body("""
                {"nidNumber": "1234567890", "dateOfBirth": "1990-01-01"}
                """)
            .willRespondWith()
            .status(200)
            .body(newJsonBody(o -> {
                o.booleanType("verified", true);
                o.stringType("nameEn", "John Doe");
            }).build())
            .toPact(V4Pact.class);
    }
    
    @PactTestFor(pactMethod = "cibVerifyPact")
    @Test
    void testCibVerification(MockServer mockServer) {
        CibClient client = new CibClient(mockServer.getUrl());
        
        NidVerificationResult result = client.verify("1234567890", "1990-01-01");
        
        assertThat(result.isVerified()).isTrue();
    }
}
```

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

---
type: tutorial
topic: enterprise_test_harness_testcontainers
target_audience: [qa_engineer, backend_developer, ci_cd_engineer]
version: 2026.10
document_id: DOC-05-EXT-08
---

# DOC-05-EXT-08: Enterprise Test Harness Development, Testcontainers & Mocks Guide

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | Test Harness Development & Testcontainers Guide |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Quality Engineering Guide |
| **Status** | Approved Master Specification |
| **Authority Chain** | `DOC-06-QA-01` → Spring Boot 4 Testing Best Practices |

---

## 1. Zero-Mock Database Testing with Testcontainers

ULMS rejects in-memory H2 databases for testing because H2 fails to emulate PostgreSQL 17 features (JSONB operators, CTEs, window functions, and Flyway V1-V18 scripts). All integration tests run against real PostgreSQL 17 inside Docker:

```java
@SpringBootTest
@Testcontainers
public abstract class AbstractIntegrationTest {
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine")
            .withDatabaseName("ulms_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
    }
}
```

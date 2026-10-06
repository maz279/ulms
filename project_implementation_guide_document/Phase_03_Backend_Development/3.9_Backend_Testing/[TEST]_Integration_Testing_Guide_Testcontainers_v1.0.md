**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Integration Testing Guide - Testcontainers |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Technical Lead |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# Integration Testing Guide - Testcontainers

## Dependencies

```xml
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>postgresql</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>junit-jupiter</artifactId>
    <scope>test</scope>
</dependency>
```

## Example Test

```java
@SpringBootTest
@Testcontainers
class LoanIntegrationTest {
    
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
        .withDatabaseName("ulms_test")
        .withUsername("test")
        .withPassword("test");
    
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }
    
    @Autowired
    private LoanRepository loanRepository;
    
    @Autowired
    private LoanService loanService;
    
    @Test
    void createAndRetrieveLoan() {
        // Create loan
        Loan loan = Loan.builder()
            .accountNumber("LOAN001")
            .principal(BigDecimal.valueOf(100000))
            .build();
        
        Loan saved = loanRepository.save(loan);
        
        // Retrieve
        Optional<Loan> found = loanService.findById(saved.getId());
        
        assertThat(found).isPresent();
        assertThat(found.get().getAccountNumber()).isEqualTo("LOAN001");
    }
}
```

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

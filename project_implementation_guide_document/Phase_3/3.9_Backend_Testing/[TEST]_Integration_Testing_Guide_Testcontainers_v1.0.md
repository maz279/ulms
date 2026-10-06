**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Integration Testing Guide - Testcontainers |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Unisoft Technical Team |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# Integration Testing Guide - Testcontainers

## 1. Setup

### 1.1 Dependencies

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>postgresql</artifactId>
    <version>1.19.3</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>1.19.3</version>
    <scope>test</scope>
</dependency>
```

## 2. Database Integration Test

```java
@SpringBootTest
@Testcontainers
@AutoConfigureMockMvc
class LoanApplicationIntegrationTest {
    
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
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
    private MockMvc mockMvc;
    
    @Autowired
    private LoanApplicationRepository repository;
    
    @BeforeEach
    void setUp() {
        repository.deleteAll();
    }
    
    @Test
    void shouldCreateLoanApplication() throws Exception {
        // Given
        String request = """
            {
                "customerName": "John Doe",
                "nid": "1234567890",
                "loanAmount": 500000,
                "purpose": "PERSONAL"
            }
            """;
        
        // When/Then
        mockMvc.perform(post("/api/v1/loan-applications")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").exists())
            .andExpect(jsonPath("$.status").value("PENDING"));
        
        // Verify in database
        assertThat(repository.count()).isEqualTo(1);
    }
    
    @Test
    void shouldRetrieveLoanApplication() throws Exception {
        // Given
        LoanApplication saved = repository.save(createLoanApplication());
        
        // When/Then
        mockMvc.perform(get("/api/v1/loan-applications/{id}", saved.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(saved.getId()))
            .andExpect(jsonPath("$.customerName").value("John Doe"));
    }
}
```

## 3. Multiple Containers

```java
@SpringBootTest
@Testcontainers
class ServiceIntegrationTest {
    
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");
    
    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
        .withExposedPorts(6379);
    
    @Container
    static GenericContainer<?> wiremock = new GenericContainer<>("wiremock/wiremock:3.3.1")
        .withExposedPorts(8080);
    
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.redis.host", redis::getHost);
        registry.add("spring.redis.port", redis::getFirstMappedPort);
        registry.add("ulms.cib.base-url", 
            () -> "http://" + wiremock.getHost() + ":" + wiremock.getFirstMappedPort());
    }
    
    @Test
    void shouldProcessLoanWithCibCheck() {
        // Setup WireMock stub
        setupCibStub();
        
        // Execute test
        // ...
    }
    
    private void setupCibStub() {
        // WireMock setup
    }
}
```

## 4. Shared Containers

```java
@TestConfiguration
public class TestcontainersConfiguration {
    
    @Bean
    @ServiceConnection
    public PostgreSQLContainer<?> postgresContainer() {
        return new PostgreSQLContainer<>("postgres:16-alpine")
            .withReuse(true);  // Reuse container across tests
    }
    
    @Bean
    @ServiceConnection(name = "redis")
    public GenericContainer<?> redisContainer() {
        return new GenericContainer<>("redis:7-alpine")
            .withExposedPorts(6379)
            .withReuse(true);
    }
}

// Use in tests
@Import(TestcontainersConfiguration.class)
@SpringBootTest
class MyIntegrationTest {
    // Tests using shared containers
}
```

---

## Appendices

### A.1 Testcontainers Lifecycle

| Annotation | Behavior |
|------------|----------|
| `@Container` | JUnit manages lifecycle |
| `@Testcontainers` | Enables Testcontainers support |
| `static` container | Shared across test class |
| non-static | New container per test |

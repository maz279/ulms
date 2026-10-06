# Common Development Tasks Guide

## ULMS v2.0 - Developer Task Reference

---

**Document Control**

| Field | Value |
|-------|-------|
| Document ID | ULMS-KT-CDT-003 |
| Version | 1.0 |
| Status | Final |
| Classification | Internal - Technical |
| Effective Date | February 2026 |
| Review Cycle | Per Release |
| Owner | Technical Lead |
| Approver | CTO |

---

## Table of Contents

1. [Database Migrations](#1-database-migrations)
2. [Adding New API Endpoints](#2-adding-new-api-endpoints)
3. [Creating Background Jobs](#3-creating-background-jobs)
4. [Integration Testing](#4-integration-testing)
5. [Building and Deploying](#5-building-and-deploying)
6. [Debugging Tips](#6-debugging-tips)

---

## 1. Database Migrations

### 1.1 Create New Migration

```bash
# Navigate to backend
cd backend

# Create migration file
# Format: V{version}__{description}.sql
# Example: src/main/resources/db/migration/V1.5.0__add_loan_status.sql
```

### 1.2 Migration Template

```sql
-- V1.5.0__add_loan_status.sql

-- Add new column
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(500);

-- Add index
CREATE INDEX IF NOT EXISTS idx_loans_status 
ON loans(status) 
WHERE status = 'CANCELLED';

-- Add comment
COMMENT ON COLUMN loans.cancellation_reason IS 'Reason for loan cancellation';
```

### 1.3 Run Migrations

```bash
# Run pending migrations
./gradlew flywayMigrate

# Check migration status
./gradlew flywayInfo

# Repair (if needed)
./gradlew flywayRepair
```

---

## 2. Adding New API Endpoints

### 2.1 Step-by-Step

**Step 1: Create DTOs**

```java
// LoanCancellationRequest.java
@Data
public class LoanCancellationRequest {
    @NotBlank
    private String loanId;
    
    @NotBlank
    @Size(max = 500)
    private String reason;
    
    @NotNull
    private CancellationType type;
}
```

**Step 2: Create Controller Method**

```java
// LoanController.java
@RestController
@RequestMapping("/api/v1/loans")
@RequiredArgsConstructor
public class LoanController {
    
    private final LoanService loanService;
    
    @PostMapping("/{loanId}/cancel")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<LoanResponse> cancelLoan(
            @PathVariable UUID loanId,
            @Valid @RequestBody LoanCancellationRequest request) {
        LoanResponse response = loanService.cancelLoan(loanId, request);
        return ResponseEntity.ok(response);
    }
}
```

**Step 3: Implement Service**

```java
// LoanServiceImpl.java
@Override
@Transactional
public LoanResponse cancelLoan(UUID loanId, LoanCancellationRequest request) {
    Loan loan = loanRepository.findById(loanId)
        .orElseThrow(() -> new LoanNotFoundException(loanId));
    
    validateCancellation(loan, request);
    
    loan.setStatus(LoanStatus.CANCELLED);
    loan.setCancellationReason(request.getReason());
    loan.setCancelledAt(LocalDateTime.now());
    loan.setCancelledBy(getCurrentUser());
    
    Loan saved = loanRepository.save(loan);
    
    eventPublisher.publish(new LoanCancelledEvent(saved.getId(), request.getReason()));
    
    return loanMapper.toResponse(saved);
}
```

**Step 4: Add Tests**

```java
// LoanControllerTest.java
@Test
@WithMockUser(roles = "MANAGER")
void shouldCancelLoan() throws Exception {
    // Given
    UUID loanId = UUID.randomUUID();
    LoanCancellationRequest request = new LoanCancellationRequest();
    request.setReason("Customer request");
    
    when(loanService.cancelLoan(any(), any())).thenReturn(new LoanResponse());
    
    // When & Then
    mockMvc.perform(post("/api/v1/loans/{loanId}/cancel", loanId)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk());
}
```

---

## 3. Creating Background Jobs

### 3.1 Scheduled Job

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class LoanClassificationJob {
    
    private final LoanClassificationService classificationService;
    
    @Scheduled(cron = "0 0 2 * * ?") // Daily at 2 AM
    public void classifyLoans() {
        log.info("Starting loan classification job");
        
        LocalDate classificationDate = LocalDate.now();
        classificationService.classifyAllLoans(classificationDate);
        
        log.info("Loan classification completed");
    }
}
```

### 3.2 Async Job

```java
@Service
@RequiredArgsConstructor
public class CIBQueryService {
    
    @Async("taskExecutor")
    public CompletableFuture<CIBReport> queryCIBAsync(String nid) {
        CIBReport report = queryCIB(nid);
        return CompletableFuture.completedFuture(report);
    }
}
```

---

## 4. Integration Testing

### 4.1 Test Container Setup

```java
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
public class LoanIntegrationTest {
    
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
    private MockMvc mockMvc;
    
    @Test
    @WithMockUser
    void shouldCreateLoan() throws Exception {
        // Test implementation
    }
}
```

---

## 5. Building and Deploying

### 5.1 Local Build

```bash
# Clean build
./gradlew clean build

# Skip tests for quick build
./gradlew build -x test

# Build Docker image
./gradlew bootBuildImage --imageName=ulms-backend:latest
```

### 5.2 Deploy to Staging

```bash
# Build and push
docker build -t registry.bank.com/ulms-backend:v1.2.0 .
docker push registry.bank.com/ulms-backend:v1.2.0

# Deploy to Kubernetes
kubectl set image deployment/ulms-backend \
  ulms-backend=registry.bank.com/ulms-backend:v1.2.0 \
  -n ulms-staging

# Verify rollout
kubectl rollout status deployment/ulms-backend -n ulms-staging
```

---

## 6. Debugging Tips

### 6.1 Enable Debug Logging

```yaml
# application-dev.yml
logging:
  level:
    com.unisoft.ulms: DEBUG
    org.springframework.security: DEBUG
```

### 6.2 Remote Debugging

```bash
# Start with debug agent
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 \
  -jar ulms-backend.jar
```

### 6.3 Database Query Logging

```yaml
spring:
  jpa:
    show-sql: true
    properties:
      hibernate:
        format_sql: true
```

---

**Document Control Footer**

*Classification: Internal - Technical*
*Next Review: Per Release*
*Owner: Technical Lead*

**END OF DOCUMENT**

# Java Coding Standards (Spring Boot 3.2)

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ULMS-STD-0.3.2 |
| **Document Title** | Java Coding Standards (Spring Boot 3.2) |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-04 |
| **Prepared By** | Technical Lead |
| **Reviewed By** | Project Manager |
| **Classification** | Internal |
| **Status** | Approved |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-04 | Lead Dev | Initial version |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Project Structure](#2-project-structure)
3. [Naming Conventions](#3-naming-conventions)
4. [Code Organization](#4-code-organization)
5. [Spring Boot Patterns](#5-spring-boot-patterns)
6. [REST Controller Standards](#6-rest-controller-standards)
7. [Service Layer Standards](#7-service-layer-standards)
8. [Repository Standards](#8-repository-standards)
9. [DTO & Mapper Standards](#9-dto--mapper-standards)
10. [Exception Handling](#10-exception-handling)
11. [Logging Standards](#11-logging-standards)
12. [Testing Standards](#12-testing-standards)
13. [Code Quality Metrics](#13-code-quality-metrics)

---

## 1. Introduction

### 1.1 Purpose

This document defines Java coding standards for ULMS v2.0 backend development using Java 21 LTS and Spring Boot 3.2. These standards ensure consistent, maintainable, and high-quality code across all microservices.

### 1.2 Technology Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| Java | 21 LTS | Programming language |
| Spring Boot | 3.2.x | Application framework |
| Spring Security | 6.2.x | Security framework |
| Spring Data JPA | 3.2.x | Data access |
| Hibernate | 6.4.x | ORM |
| Lombok | 1.18.x | Boilerplate reduction |
| MapStruct | 1.5.x | DTO mapping |
| Apache Fineract | 1.10.x | Core banking platform |

### 1.3 Java 21 Features to Use

| Feature | Usage |
|---------|-------|
| Records | DTOs, value objects |
| Pattern Matching | switch expressions, instanceof |
| Sealed Classes | Domain hierarchies |
| Virtual Threads | High-concurrency operations |
| Text Blocks | Multi-line strings, SQL |

---

## 2. Project Structure

### 2.1 Module Structure

```
ulms-backend/
├── ulms-common/                    # Shared utilities, DTOs
├── ulms-fineract-extension/        # Fineract customizations
├── ulms-loan-service/              # Loan management service
├── ulms-cib-service/               # CIB integration service
├── ulms-nid-service/               # NID/e-KYC service
├── ulms-workflow-service/          # Camunda workflow service
├── ulms-document-service/          # Document management
├── ulms-notification-service/      # SMS/Email notifications
├── ulms-brpd-service/              # BRPD compliance service
└── ulms-gateway/                   # API Gateway (Kong config)
```

### 2.2 Package Structure (per service)

```
com.unisoft.ulms.loan/
├── LoanServiceApplication.java     # Main application class
├── config/                         # Configuration classes
│   ├── SecurityConfig.java
│   ├── WebConfig.java
│   └── CacheConfig.java
├── controller/                     # REST controllers
│   ├── LoanController.java
│   └── LoanDocumentController.java
├── service/                        # Business logic
│   ├── LoanService.java           # Interface
│   └── impl/
│       └── LoanServiceImpl.java   # Implementation
├── repository/                     # Data access
│   ├── LoanRepository.java
│   └── LoanSpecifications.java
├── model/                          # JPA entities
│   ├── Loan.java
│   ├── LoanApplication.java
│   └── enums/
│       └── LoanStatus.java
├── dto/                            # Data transfer objects
│   ├── request/
│   │   └── LoanRequest.java
│   └── response/
│       └── LoanResponse.java
├── mapper/                         # DTO mappers
│   └── LoanMapper.java
├── exception/                      # Custom exceptions
│   ├── LoanNotFoundException.java
│   └── handler/
│       └── GlobalExceptionHandler.java
├── validator/                      # Custom validators
│   └── NidValidator.java
├── event/                          # Domain events
│   └── LoanApprovedEvent.java
└── client/                         # External service clients
    └── CibClient.java
```

### 2.3 Package Naming

```java
// Base package
com.unisoft.ulms

// Service-specific
com.unisoft.ulms.loan           // Loan service
com.unisoft.ulms.cib            // CIB service
com.unisoft.ulms.nid            // NID service
com.unisoft.ulms.workflow       // Workflow service

// Common/shared
com.unisoft.ulms.common         // Shared utilities
com.unisoft.ulms.common.dto     // Shared DTOs
com.unisoft.ulms.common.util    // Utilities
```

---

## 3. Naming Conventions

### 3.1 General Naming Rules

| Element | Convention | Example |
|---------|------------|---------|
| Package | lowercase, no underscores | `com.unisoft.ulms.loan` |
| Class | PascalCase | `LoanApplicationService` |
| Interface | PascalCase (no I prefix) | `LoanService` |
| Method | camelCase, verb-noun | `calculateInterest()` |
| Variable | camelCase | `loanAmount` |
| Constant | UPPER_SNAKE_CASE | `MAX_LOAN_AMOUNT` |
| Enum | PascalCase | `LoanStatus` |
| Enum Value | UPPER_SNAKE_CASE | `UNDER_REVIEW` |

### 3.2 Class Naming Patterns

| Type | Pattern | Example |
|------|---------|---------|
| Entity | Noun | `Loan`, `Customer`, `LoanApplication` |
| Repository | `{Entity}Repository` | `LoanRepository` |
| Service Interface | `{Entity}Service` | `LoanService` |
| Service Implementation | `{Entity}ServiceImpl` | `LoanServiceImpl` |
| Controller | `{Entity}Controller` | `LoanController` |
| DTO Request | `{Action}{Entity}Request` | `CreateLoanRequest` |
| DTO Response | `{Entity}Response` | `LoanResponse` |
| Mapper | `{Entity}Mapper` | `LoanMapper` |
| Exception | `{Entity}{Reason}Exception` | `LoanNotFoundException` |
| Validator | `{Entity}Validator` | `NidValidator` |
| Event | `{Entity}{Action}Event` | `LoanApprovedEvent` |

### 3.3 Method Naming Patterns

```java
// Retrieval methods
findById(Long id)                    // Returns Optional
findByStatus(LoanStatus status)      // Returns List
getById(Long id)                     // Throws if not found
getAllByCustomerId(Long customerId)  // Returns List

// Boolean methods
isActive()
hasDocuments()
canBeApproved()
shouldNotify()

// Action methods
createLoan(LoanRequest request)
updateLoan(Long id, LoanRequest request)
deleteLoan(Long id)
approveLoan(Long id)
calculateInterest(BigDecimal principal)

// Transformation methods
toDto(Loan entity)
toEntity(LoanRequest dto)
mapToResponse(Loan loan)
```

### 3.4 Variable Naming

```java
// ✅ Good: Descriptive names
BigDecimal loanAmount;
LocalDate disbursementDate;
List<Loan> pendingLoans;
Map<String, Customer> customerCache;

// ❌ Bad: Vague or abbreviated
BigDecimal amt;
LocalDate date;
List<Loan> list;
Map<String, Customer> map;

// Loop variables (acceptable short names)
for (Loan loan : loans) { }
for (int i = 0; i < count; i++) { }

// Stream variables
loans.stream()
    .filter(loan -> loan.isActive())
    .map(loan -> loan.getAmount())
    .collect(Collectors.toList());
```

---

## 4. Code Organization

### 4.1 Class Structure

```java
/**
 * Service for managing loan applications.
 *
 * @author ULMS Team
 * @since 1.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LoanServiceImpl implements LoanService {

    // 1. Static fields (constants)
    private static final String LOAN_PREFIX = "LOAN-";

    // 2. Instance fields (dependencies via constructor)
    private final LoanRepository loanRepository;
    private final CustomerService customerService;
    private final LoanMapper loanMapper;
    private final ApplicationEventPublisher eventPublisher;

    // 3. Configuration properties
    @Value("${ulms.loan.max-amount:10000000}")
    private BigDecimal maxLoanAmount;

    // 4. Public methods (API contract)
    @Override
    @Transactional
    public LoanResponse createLoan(CreateLoanRequest request) {
        // Implementation
    }

    @Override
    @Transactional(readOnly = true)
    public LoanResponse getLoanById(Long id) {
        // Implementation
    }

    // 5. Private helper methods
    private String generateLoanId() {
        // Implementation
    }

    private void validateLoanAmount(BigDecimal amount) {
        // Implementation
    }
}
```

### 4.2 Method Organization

```java
@Override
@Transactional
public LoanResponse createLoan(CreateLoanRequest request) {
    // 1. Validation
    validateLoanRequest(request);

    // 2. Business logic preparation
    Customer customer = customerService.getCustomerById(request.customerId());
    BigDecimal interestRate = calculateInterestRate(request, customer);

    // 3. Entity creation
    Loan loan = Loan.builder()
        .loanId(generateLoanId())
        .customer(customer)
        .requestedAmount(request.amount())
        .interestRate(interestRate)
        .status(LoanStatus.DRAFT)
        .build();

    // 4. Persistence
    Loan savedLoan = loanRepository.save(loan);

    // 5. Side effects (events, notifications)
    eventPublisher.publishEvent(new LoanCreatedEvent(savedLoan));

    // 6. Response mapping
    return loanMapper.toResponse(savedLoan);
}
```

### 4.3 Import Organization

```java
// 1. Java standard library
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

// 2. Third-party libraries
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// 3. Project imports
import com.unisoft.ulms.loan.dto.request.CreateLoanRequest;
import com.unisoft.ulms.loan.dto.response.LoanResponse;
import com.unisoft.ulms.loan.model.Loan;
import com.unisoft.ulms.loan.repository.LoanRepository;

// Avoid:
// - Wildcard imports (import java.util.*)
// - Static imports except for commonly used (Collectors, assertions)
```

---

## 5. Spring Boot Patterns

### 5.1 Dependency Injection

```java
// ✅ Good: Constructor injection (recommended)
@Service
@RequiredArgsConstructor  // Lombok generates constructor
public class LoanServiceImpl implements LoanService {
    private final LoanRepository loanRepository;
    private final CustomerService customerService;
    private final LoanMapper loanMapper;
}

// ✅ Good: Explicit constructor (if not using Lombok)
@Service
public class LoanServiceImpl implements LoanService {
    private final LoanRepository loanRepository;
    private final CustomerService customerService;

    public LoanServiceImpl(LoanRepository loanRepository,
                          CustomerService customerService) {
        this.loanRepository = loanRepository;
        this.customerService = customerService;
    }
}

// ❌ Bad: Field injection
@Service
public class LoanServiceImpl implements LoanService {
    @Autowired
    private LoanRepository loanRepository;  // Avoid
}
```

### 5.2 Configuration Properties

```java
// Configuration class
@Configuration
@ConfigurationProperties(prefix = "ulms.loan")
@Validated
public class LoanProperties {

    @NotNull
    @Min(10000)
    private BigDecimal minAmount = BigDecimal.valueOf(10000);

    @NotNull
    @Max(100000000)
    private BigDecimal maxAmount = BigDecimal.valueOf(100000000);

    @NotNull
    @Min(6)
    @Max(84)
    private Integer maxTenure = 84;

    // Getters and setters
}

// Usage in service
@Service
@RequiredArgsConstructor
public class LoanServiceImpl implements LoanService {
    private final LoanProperties loanProperties;

    private void validateAmount(BigDecimal amount) {
        if (amount.compareTo(loanProperties.getMinAmount()) < 0) {
            throw new InvalidLoanAmountException("Amount below minimum");
        }
    }
}

// application.yml
ulms:
  loan:
    min-amount: 10000
    max-amount: 100000000
    max-tenure: 84
```

### 5.3 Bean Configuration

```java
@Configuration
public class AppConfig {

    @Bean
    @ConditionalOnProperty(name = "ulms.cib.mock-enabled", havingValue = "true")
    public CibClient mockCibClient() {
        return new MockCibClient();
    }

    @Bean
    @ConditionalOnProperty(name = "ulms.cib.mock-enabled", havingValue = "false", matchIfMissing = true)
    public CibClient realCibClient(CibProperties properties, WebClient.Builder webClientBuilder) {
        return new RealCibClient(properties, webClientBuilder);
    }

    @Bean
    public ObjectMapper objectMapper() {
        return JsonMapper.builder()
            .addModule(new JavaTimeModule())
            .configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false)
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
            .build();
    }
}
```

### 5.4 Profiles

```java
// Development profile
@Configuration
@Profile("dev")
public class DevConfig {
    @Bean
    public CibClient devCibClient() {
        return new MockCibClient();  // Use mock in dev
    }
}

// Production profile
@Configuration
@Profile("prod")
public class ProdConfig {
    @Bean
    public CibClient prodCibClient(CibProperties properties) {
        return new RealCibClient(properties);
    }
}
```

---

## 6. REST Controller Standards

### 6.1 Controller Structure

```java
@RestController
@RequestMapping("/api/v1/loans")
@RequiredArgsConstructor
@Validated
@Tag(name = "Loans", description = "Loan management operations")
@Slf4j
public class LoanController {

    private final LoanService loanService;

    @GetMapping
    @Operation(summary = "List all loans", description = "Retrieve paginated list of loans")
    @PreAuthorize("hasAnyRole('LOAN_OFFICER', 'CREDIT_ANALYST', 'BRANCH_MANAGER')")
    public ResponseEntity<PagedResponse<LoanResponse>> getLoans(
            @ParameterObject Pageable pageable,
            @RequestParam(required = false) LoanStatus status,
            @RequestParam(required = false) String branchId) {

        log.debug("Fetching loans: status={}, branchId={}, page={}",
                  status, branchId, pageable.getPageNumber());

        Page<LoanResponse> loans = loanService.getLoans(status, branchId, pageable);
        return ResponseEntity.ok(PagedResponse.of(loans));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get loan by ID")
    @PreAuthorize("hasAnyRole('LOAN_OFFICER', 'CREDIT_ANALYST') and @loanAccessChecker.canAccess(#id)")
    public ResponseEntity<ApiResponse<LoanResponse>> getLoan(
            @PathVariable @NotNull Long id) {

        log.debug("Fetching loan: id={}", id);
        LoanResponse loan = loanService.getLoanById(id);
        return ResponseEntity.ok(ApiResponse.success(loan));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create new loan application")
    @PreAuthorize("hasRole('LOAN_OFFICER')")
    public ResponseEntity<ApiResponse<LoanResponse>> createLoan(
            @Valid @RequestBody CreateLoanRequest request) {

        log.info("Creating loan application: customerId={}", request.customerId());
        LoanResponse loan = loanService.createLoan(request);

        URI location = ServletUriComponentsBuilder
            .fromCurrentRequest()
            .path("/{id}")
            .buildAndExpand(loan.id())
            .toUri();

        return ResponseEntity.created(location)
            .body(ApiResponse.success(loan));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve loan application")
    @PreAuthorize("hasRole('CREDIT_ANALYST') and @loanAccessChecker.canApprove(#id)")
    public ResponseEntity<ApiResponse<LoanResponse>> approveLoan(
            @PathVariable @NotNull Long id,
            @Valid @RequestBody ApproveLoanRequest request) {

        log.info("Approving loan: id={}", id);
        LoanResponse loan = loanService.approveLoan(id, request);
        return ResponseEntity.ok(ApiResponse.success(loan));
    }
}
```

### 6.2 Request Validation

```java
// Using records for immutable DTOs (Java 21)
public record CreateLoanRequest(
    @NotNull(message = "Customer ID is required")
    @Size(min = 10, max = 20, message = "Invalid customer ID format")
    String customerId,

    @NotNull(message = "Product ID is required")
    String productId,

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "10000", message = "Minimum amount is BDT 10,000")
    @DecimalMax(value = "100000000", message = "Maximum amount is BDT 10 crore")
    BigDecimal amount,

    @NotNull(message = "Tenure is required")
    @Min(value = 6, message = "Minimum tenure is 6 months")
    @Max(value = 84, message = "Maximum tenure is 84 months")
    Integer tenure,

    @NotBlank(message = "Purpose is required")
    @Size(max = 500, message = "Purpose cannot exceed 500 characters")
    String purpose,

    @Valid
    List<CollateralRequest> collaterals
) {}

// Custom validator
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = NidValidator.class)
public @interface ValidNid {
    String message() default "Invalid NID format. Must be 13 or 17 digits";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

@Component
public class NidValidator implements ConstraintValidator<ValidNid, String> {

    private static final Pattern NID_PATTERN = Pattern.compile("^(\\d{13}|\\d{17})$");

    @Override
    public boolean isValid(String nid, ConstraintValidatorContext context) {
        if (nid == null) {
            return true; // Let @NotNull handle null check
        }
        return NID_PATTERN.matcher(nid).matches();
    }
}
```

### 6.3 Response Wrapper

```java
// Generic API response
public record ApiResponse<T>(
    boolean success,
    T data,
    String message,
    LocalDateTime timestamp
) {
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, null, LocalDateTime.now());
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(true, data, message, LocalDateTime.now());
    }
}

// Paginated response
public record PagedResponse<T>(
    List<T> data,
    PaginationInfo pagination
) {
    public static <T> PagedResponse<T> of(Page<T> page) {
        return new PagedResponse<>(
            page.getContent(),
            new PaginationInfo(
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.hasNext(),
                page.hasPrevious()
            )
        );
    }
}

public record PaginationInfo(
    int page,
    int size,
    long totalElements,
    int totalPages,
    boolean hasNext,
    boolean hasPrevious
) {}
```

---

## 7. Service Layer Standards

### 7.1 Service Interface

```java
/**
 * Service interface for loan management operations.
 */
public interface LoanService {

    /**
     * Creates a new loan application.
     *
     * @param request the loan creation request
     * @return the created loan response
     * @throws CustomerNotFoundException if customer not found
     * @throws InvalidLoanAmountException if amount validation fails
     */
    LoanResponse createLoan(CreateLoanRequest request);

    /**
     * Retrieves a loan by its ID.
     *
     * @param id the loan ID
     * @return the loan response
     * @throws LoanNotFoundException if loan not found
     */
    LoanResponse getLoanById(Long id);

    /**
     * Retrieves loans with optional filtering.
     *
     * @param status optional status filter
     * @param branchId optional branch filter
     * @param pageable pagination parameters
     * @return page of loan responses
     */
    Page<LoanResponse> getLoans(LoanStatus status, String branchId, Pageable pageable);

    /**
     * Approves a loan application.
     *
     * @param id the loan ID
     * @param request the approval request
     * @return the updated loan response
     * @throws LoanNotFoundException if loan not found
     * @throws InvalidLoanStateException if loan cannot be approved
     */
    LoanResponse approveLoan(Long id, ApproveLoanRequest request);
}
```

### 7.2 Service Implementation

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class LoanServiceImpl implements LoanService {

    private final LoanRepository loanRepository;
    private final CustomerService customerService;
    private final CibService cibService;
    private final LoanMapper loanMapper;
    private final ApplicationEventPublisher eventPublisher;
    private final LoanProperties loanProperties;

    @Override
    @Transactional
    public LoanResponse createLoan(CreateLoanRequest request) {
        log.info("Creating loan for customer: {}", request.customerId());

        // 1. Validate request
        validateLoanRequest(request);

        // 2. Get customer
        Customer customer = customerService.getCustomerById(request.customerId());

        // 3. Check CIB (if applicable)
        if (shouldCheckCib(request.amount())) {
            CibReport cibReport = cibService.getCibReport(customer.getNid());
            validateCibReport(cibReport);
        }

        // 4. Calculate interest rate
        BigDecimal interestRate = calculateInterestRate(request, customer);

        // 5. Create entity
        Loan loan = Loan.builder()
            .loanId(generateLoanId())
            .customer(customer)
            .productId(request.productId())
            .requestedAmount(request.amount())
            .tenure(request.tenure())
            .purpose(request.purpose())
            .interestRate(interestRate)
            .status(LoanStatus.DRAFT)
            .createdBy(SecurityUtils.getCurrentUsername())
            .build();

        // 6. Add collaterals
        if (request.collaterals() != null) {
            request.collaterals().forEach(c ->
                loan.addCollateral(loanMapper.toCollateral(c)));
        }

        // 7. Save
        Loan savedLoan = loanRepository.save(loan);
        log.info("Loan created: id={}", savedLoan.getId());

        // 8. Publish event
        eventPublisher.publishEvent(new LoanCreatedEvent(savedLoan));

        // 9. Return response
        return loanMapper.toResponse(savedLoan);
    }

    @Override
    @Transactional(readOnly = true)
    public LoanResponse getLoanById(Long id) {
        Loan loan = findLoanOrThrow(id);
        return loanMapper.toResponse(loan);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LoanResponse> getLoans(LoanStatus status, String branchId, Pageable pageable) {
        Specification<Loan> spec = LoanSpecifications.withFilters(status, branchId);
        Page<Loan> loans = loanRepository.findAll(spec, pageable);
        return loans.map(loanMapper::toResponse);
    }

    @Override
    @Transactional
    public LoanResponse approveLoan(Long id, ApproveLoanRequest request) {
        log.info("Approving loan: id={}", id);

        Loan loan = findLoanOrThrow(id);

        // Validate state transition
        if (!loan.canBeApproved()) {
            throw new InvalidLoanStateException(
                "Cannot approve loan in status: " + loan.getStatus());
        }

        // Validate approver authority
        validateApproverAuthority(request.approvedAmount());

        // Update loan
        loan.approve(
            request.approvedAmount(),
            request.interestRate(),
            request.conditions(),
            request.remarks()
        );

        Loan savedLoan = loanRepository.save(loan);
        log.info("Loan approved: id={}, amount={}", id, request.approvedAmount());

        // Publish event
        eventPublisher.publishEvent(new LoanApprovedEvent(savedLoan));

        return loanMapper.toResponse(savedLoan);
    }

    // Private helper methods

    private Loan findLoanOrThrow(Long id) {
        return loanRepository.findById(id)
            .orElseThrow(() -> new LoanNotFoundException(id));
    }

    private void validateLoanRequest(CreateLoanRequest request) {
        if (request.amount().compareTo(loanProperties.getMaxAmount()) > 0) {
            throw new InvalidLoanAmountException(
                "Amount exceeds maximum: " + loanProperties.getMaxAmount());
        }
    }

    private String generateLoanId() {
        return "LOAN-" + LocalDate.now().getYear() + "-" +
               String.format("%06d", loanRepository.getNextSequence());
    }

    private boolean shouldCheckCib(BigDecimal amount) {
        return amount.compareTo(BigDecimal.valueOf(100000)) > 0;
    }

    private BigDecimal calculateInterestRate(CreateLoanRequest request, Customer customer) {
        // Business logic for interest rate calculation
        return BigDecimal.valueOf(12.5);
    }

    private void validateCibReport(CibReport cibReport) {
        if (cibReport.hasDefaultHistory()) {
            throw new CibValidationException("Customer has default history in CIB");
        }
    }

    private void validateApproverAuthority(BigDecimal amount) {
        // Check current user's approval authority
    }
}
```

### 7.3 Transaction Management

```java
// Read-only transactions for queries
@Override
@Transactional(readOnly = true)
public LoanResponse getLoanById(Long id) {
    return loanMapper.toResponse(findLoanOrThrow(id));
}

// Write transactions for modifications
@Override
@Transactional
public LoanResponse createLoan(CreateLoanRequest request) {
    // Creates new data
}

// Propagation for nested transactions
@Transactional(propagation = Propagation.REQUIRED)
public void updateLoanStatus(Long id, LoanStatus status) {
    // Uses existing transaction or creates new
}

// Separate transaction for audit logging
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void logAuditEvent(AuditEvent event) {
    // Always runs in new transaction
}

// Rollback rules
@Transactional(rollbackFor = Exception.class, noRollbackFor = NotFoundException.class)
public void processLoan(Long id) {
    // Rollback on all exceptions except NotFoundException
}
```

---

## 8. Repository Standards

### 8.1 Repository Interface

```java
@Repository
public interface LoanRepository extends JpaRepository<Loan, Long>, JpaSpecificationExecutor<Loan> {

    // Simple queries - use method naming
    Optional<Loan> findByLoanId(String loanId);

    List<Loan> findByStatus(LoanStatus status);

    List<Loan> findByCustomerIdAndStatusIn(Long customerId, List<LoanStatus> statuses);

    boolean existsByCustomerIdAndStatus(Long customerId, LoanStatus status);

    // Count queries
    long countByStatusAndBranchId(LoanStatus status, String branchId);

    // Custom JPQL query
    @Query("SELECT l FROM Loan l JOIN FETCH l.customer WHERE l.id = :id")
    Optional<Loan> findByIdWithCustomer(@Param("id") Long id);

    // Fetch join to avoid N+1
    @Query("""
        SELECT l FROM Loan l
        JOIN FETCH l.customer c
        LEFT JOIN FETCH l.collaterals
        WHERE l.status = :status
        """)
    List<Loan> findByStatusWithDetails(@Param("status") LoanStatus status);

    // Native query for complex queries
    @Query(value = """
        SELECT l.* FROM loans l
        WHERE l.status = :status
        AND l.created_at >= :startDate
        ORDER BY l.created_at DESC
        """, nativeQuery = true)
    List<Loan> findRecentByStatus(@Param("status") String status,
                                  @Param("startDate") LocalDateTime startDate);

    // Modifying query
    @Modifying
    @Query("UPDATE Loan l SET l.status = :status WHERE l.id = :id")
    int updateStatus(@Param("id") Long id, @Param("status") LoanStatus status);

    // Sequence for ID generation
    @Query(value = "SELECT nextval('loan_id_seq')", nativeQuery = true)
    Long getNextSequence();
}
```

### 8.2 Specification Pattern

```java
public class LoanSpecifications {

    public static Specification<Loan> withFilters(LoanStatus status, String branchId) {
        return Specification
            .where(hasStatus(status))
            .and(hasBranch(branchId));
    }

    public static Specification<Loan> hasStatus(LoanStatus status) {
        return (root, query, cb) -> {
            if (status == null) {
                return null;
            }
            return cb.equal(root.get("status"), status);
        };
    }

    public static Specification<Loan> hasBranch(String branchId) {
        return (root, query, cb) -> {
            if (branchId == null || branchId.isBlank()) {
                return null;
            }
            return cb.equal(root.get("branchId"), branchId);
        };
    }

    public static Specification<Loan> amountBetween(BigDecimal min, BigDecimal max) {
        return (root, query, cb) -> {
            if (min == null && max == null) {
                return null;
            }
            if (min != null && max != null) {
                return cb.between(root.get("requestedAmount"), min, max);
            }
            if (min != null) {
                return cb.greaterThanOrEqualTo(root.get("requestedAmount"), min);
            }
            return cb.lessThanOrEqualTo(root.get("requestedAmount"), max);
        };
    }

    public static Specification<Loan> createdBetween(LocalDate from, LocalDate to) {
        return (root, query, cb) -> {
            if (from == null && to == null) {
                return null;
            }
            LocalDateTime fromDateTime = from != null ? from.atStartOfDay() : LocalDateTime.MIN;
            LocalDateTime toDateTime = to != null ? to.plusDays(1).atStartOfDay() : LocalDateTime.MAX;
            return cb.between(root.get("createdAt"), fromDateTime, toDateTime);
        };
    }
}

// Usage
Page<Loan> loans = loanRepository.findAll(
    LoanSpecifications.withFilters(status, branchId)
        .and(LoanSpecifications.amountBetween(minAmount, maxAmount))
        .and(LoanSpecifications.createdBetween(fromDate, toDate)),
    pageable
);
```

---

## 9. DTO & Mapper Standards

### 9.1 DTO Design with Records

```java
// Request DTO
public record CreateLoanRequest(
    @NotNull String customerId,
    @NotNull String productId,
    @NotNull @DecimalMin("10000") BigDecimal amount,
    @NotNull @Min(6) @Max(84) Integer tenure,
    @NotBlank @Size(max = 500) String purpose,
    @Valid List<CollateralRequest> collaterals
) {}

// Response DTO
public record LoanResponse(
    Long id,
    String loanId,
    String customerId,
    String customerName,
    String productName,
    BigDecimal requestedAmount,
    BigDecimal approvedAmount,
    BigDecimal interestRate,
    Integer tenure,
    String purpose,
    LoanStatus status,
    List<CollateralResponse> collaterals,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    Map<String, String> links
) {}

// Nested DTO
public record CollateralRequest(
    @NotNull CollateralType type,
    @NotNull @DecimalMin("0") BigDecimal value,
    @Size(max = 500) String description
) {}

public record CollateralResponse(
    Long id,
    CollateralType type,
    BigDecimal value,
    String description,
    CollateralStatus status
) {}

// Summary DTO for lists
public record LoanSummary(
    Long id,
    String loanId,
    String customerName,
    BigDecimal amount,
    LoanStatus status,
    LocalDateTime createdAt
) {}
```

### 9.2 MapStruct Mapper

```java
@Mapper(
    componentModel = "spring",
    unmappedTargetPolicy = ReportingPolicy.IGNORE,
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    uses = {CollateralMapper.class}
)
public interface LoanMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "loanId", ignore = true)
    @Mapping(target = "status", constant = "DRAFT")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Loan toEntity(CreateLoanRequest request);

    @Mapping(target = "customerName", source = "customer.fullName")
    @Mapping(target = "productName", source = "product.name")
    @Mapping(target = "links", expression = "java(generateLinks(loan))")
    LoanResponse toResponse(Loan loan);

    @Mapping(target = "customerName", source = "customer.fullName")
    LoanSummary toSummary(Loan loan);

    List<LoanResponse> toResponseList(List<Loan> loans);

    // Custom mapping method
    default Map<String, String> generateLinks(Loan loan) {
        String baseUrl = "/api/v1/loans/" + loan.getId();
        Map<String, String> links = new HashMap<>();
        links.put("self", baseUrl);
        links.put("customer", "/api/v1/customers/" + loan.getCustomer().getId());
        links.put("documents", baseUrl + "/documents");

        if (loan.getStatus() == LoanStatus.PENDING_APPROVAL) {
            links.put("approve", baseUrl + "/approve");
            links.put("reject", baseUrl + "/reject");
        }

        return links;
    }

    // Update entity from DTO
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "loanId", ignore = true)
    @Mapping(target = "status", ignore = true)
    void updateEntity(@MappingTarget Loan loan, UpdateLoanRequest request);
}
```

---

## 10. Exception Handling

### 10.1 Exception Hierarchy

```java
// Base exception
public abstract class UlmsException extends RuntimeException {
    private final String errorCode;
    private final HttpStatus httpStatus;

    protected UlmsException(String message, String errorCode, HttpStatus httpStatus) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }

    protected UlmsException(String message, String errorCode, HttpStatus httpStatus, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }

    public String getErrorCode() { return errorCode; }
    public HttpStatus getHttpStatus() { return httpStatus; }
}

// Not found exceptions
public class ResourceNotFoundException extends UlmsException {
    public ResourceNotFoundException(String resourceName, Object identifier) {
        super(
            String.format("%s not found with identifier: %s", resourceName, identifier),
            "RESOURCE_NOT_FOUND",
            HttpStatus.NOT_FOUND
        );
    }
}

public class LoanNotFoundException extends ResourceNotFoundException {
    public LoanNotFoundException(Long id) {
        super("Loan", id);
    }

    public LoanNotFoundException(String loanId) {
        super("Loan", loanId);
    }
}

public class CustomerNotFoundException extends ResourceNotFoundException {
    public CustomerNotFoundException(Long id) {
        super("Customer", id);
    }
}

// Business rule exceptions
public class BusinessRuleException extends UlmsException {
    public BusinessRuleException(String message, String errorCode) {
        super(message, errorCode, HttpStatus.UNPROCESSABLE_ENTITY);
    }
}

public class InvalidLoanStateException extends BusinessRuleException {
    public InvalidLoanStateException(String message) {
        super(message, "INVALID_LOAN_STATE");
    }
}

public class InvalidLoanAmountException extends BusinessRuleException {
    public InvalidLoanAmountException(String message) {
        super(message, "INVALID_LOAN_AMOUNT");
    }
}

// Validation exceptions
public class ValidationException extends UlmsException {
    private final List<FieldError> fieldErrors;

    public ValidationException(String message, List<FieldError> fieldErrors) {
        super(message, "VALIDATION_ERROR", HttpStatus.BAD_REQUEST);
        this.fieldErrors = fieldErrors;
    }

    public List<FieldError> getFieldErrors() { return fieldErrors; }
}

// External service exceptions
public class ExternalServiceException extends UlmsException {
    public ExternalServiceException(String serviceName, String message) {
        super(
            String.format("%s service error: %s", serviceName, message),
            "EXTERNAL_SERVICE_ERROR",
            HttpStatus.SERVICE_UNAVAILABLE
        );
    }
}

public class CibServiceException extends ExternalServiceException {
    public CibServiceException(String message) {
        super("CIB", message);
    }
}
```

### 10.2 Global Exception Handler

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(UlmsException.class)
    public ResponseEntity<ErrorResponse> handleUlmsException(
            UlmsException ex, WebRequest request) {

        log.error("Business exception: code={}, message={}",
                  ex.getErrorCode(), ex.getMessage());

        ErrorResponse error = ErrorResponse.builder()
            .type("https://ulms.unisoft.com.bd/errors/" + ex.getErrorCode().toLowerCase())
            .title(ex.getClass().getSimpleName())
            .status(ex.getHttpStatus().value())
            .detail(ex.getMessage())
            .instance(request.getDescription(false))
            .timestamp(LocalDateTime.now())
            .traceId(MDC.get("traceId"))
            .build();

        return ResponseEntity.status(ex.getHttpStatus()).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            MethodArgumentNotValidException ex, WebRequest request) {

        List<FieldErrorDetail> fieldErrors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(fe -> new FieldErrorDetail(
                fe.getField(),
                fe.getCode(),
                fe.getDefaultMessage(),
                fe.getRejectedValue()
            ))
            .toList();

        log.warn("Validation error: {} errors", fieldErrors.size());

        ErrorResponse error = ErrorResponse.builder()
            .type("https://ulms.unisoft.com.bd/errors/validation-error")
            .title("Validation Error")
            .status(HttpStatus.BAD_REQUEST.value())
            .detail("One or more validation errors occurred")
            .instance(request.getDescription(false))
            .timestamp(LocalDateTime.now())
            .traceId(MDC.get("traceId"))
            .errors(fieldErrors)
            .build();

        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(
            AccessDeniedException ex, WebRequest request) {

        log.warn("Access denied: {}", ex.getMessage());

        ErrorResponse error = ErrorResponse.builder()
            .type("https://ulms.unisoft.com.bd/errors/authorization-error")
            .title("Access Denied")
            .status(HttpStatus.FORBIDDEN.value())
            .detail("You do not have permission to access this resource")
            .instance(request.getDescription(false))
            .timestamp(LocalDateTime.now())
            .traceId(MDC.get("traceId"))
            .build();

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex, WebRequest request) {

        log.error("Unexpected error: {}", ex.getMessage(), ex);

        ErrorResponse error = ErrorResponse.builder()
            .type("https://ulms.unisoft.com.bd/errors/internal-error")
            .title("Internal Server Error")
            .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
            .detail("An unexpected error occurred. Please contact support.")
            .instance(request.getDescription(false))
            .timestamp(LocalDateTime.now())
            .traceId(MDC.get("traceId"))
            .build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}

// Error response structure (RFC 7807)
@Builder
public record ErrorResponse(
    String type,
    String title,
    int status,
    String detail,
    String instance,
    LocalDateTime timestamp,
    String traceId,
    List<FieldErrorDetail> errors
) {}

public record FieldErrorDetail(
    String field,
    String code,
    String message,
    Object rejectedValue
) {}
```

---

## 11. Logging Standards

### 11.1 Logging Configuration

```yaml
# application.yml
logging:
  level:
    root: INFO
    com.unisoft.ulms: DEBUG
    org.springframework.web: INFO
    org.hibernate.SQL: DEBUG  # Only in dev
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE  # Only in dev
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss.SSS} [%X{traceId}] [%thread] %-5level %logger{36} - %msg%n"
```

### 11.2 Logging Best Practices

```java
@Service
@Slf4j
public class LoanServiceImpl implements LoanService {

    @Override
    public LoanResponse createLoan(CreateLoanRequest request) {
        // ✅ Good: Structured logging with context
        log.info("Creating loan: customerId={}, amount={}, product={}",
                 request.customerId(), request.amount(), request.productId());

        try {
            // Business logic
            Loan loan = processLoan(request);

            log.info("Loan created successfully: loanId={}", loan.getLoanId());
            return loanMapper.toResponse(loan);

        } catch (Exception e) {
            log.error("Failed to create loan: customerId={}, error={}",
                     request.customerId(), e.getMessage(), e);
            throw e;
        }
    }

    // ❌ Bad: String concatenation
    // log.info("Creating loan for customer " + customerId);

    // ❌ Bad: Logging sensitive data
    // log.info("Customer NID: {}", customer.getNid());

    // ✅ Good: Mask sensitive data
    log.info("Processing customer: nid={}", maskNid(customer.getNid()));

    private String maskNid(String nid) {
        if (nid == null || nid.length() < 8) {
            return "***";
        }
        return nid.substring(0, 3) + "****" + nid.substring(nid.length() - 4);
    }
}
```

### 11.3 Log Levels

| Level | Usage | Example |
|-------|-------|---------|
| ERROR | Exceptions, failures | `log.error("CIB inquiry failed", e)` |
| WARN | Recoverable issues | `log.warn("Retry attempt {} failed", retry)` |
| INFO | Business events | `log.info("Loan approved: id={}", id)` |
| DEBUG | Technical details | `log.debug("Query returned {} results", count)` |
| TRACE | Very detailed | `log.trace("Entering method with params: {}", params)` |

### 11.4 MDC for Tracing

```java
@Component
public class RequestLoggingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                   HttpServletResponse response,
                                   FilterChain filterChain) throws ServletException, IOException {
        try {
            String traceId = request.getHeader("X-Trace-Id");
            if (traceId == null) {
                traceId = UUID.randomUUID().toString().substring(0, 8);
            }

            MDC.put("traceId", traceId);
            MDC.put("userId", SecurityUtils.getCurrentUsername());
            MDC.put("tenantId", SecurityUtils.getCurrentTenantId());

            filterChain.doFilter(request, response);
        } finally {
            MDC.clear();
        }
    }
}
```

---

## 12. Testing Standards

### 12.1 Unit Test Structure

```java
@ExtendWith(MockitoExtension.class)
class LoanServiceImplTest {

    @Mock
    private LoanRepository loanRepository;

    @Mock
    private CustomerService customerService;

    @Mock
    private LoanMapper loanMapper;

    @InjectMocks
    private LoanServiceImpl loanService;

    private Customer testCustomer;
    private Loan testLoan;
    private CreateLoanRequest validRequest;

    @BeforeEach
    void setUp() {
        testCustomer = Customer.builder()
            .id(1L)
            .nid("1234567890123")
            .fullName("Test Customer")
            .build();

        testLoan = Loan.builder()
            .id(1L)
            .loanId("LOAN-2026-000001")
            .customer(testCustomer)
            .requestedAmount(BigDecimal.valueOf(500000))
            .status(LoanStatus.DRAFT)
            .build();

        validRequest = new CreateLoanRequest(
            "CUST-001",
            "PROD-001",
            BigDecimal.valueOf(500000),
            36,
            "Home renovation",
            null
        );
    }

    @Nested
    @DisplayName("createLoan")
    class CreateLoanTests {

        @Test
        @DisplayName("should create loan successfully with valid request")
        void createLoan_withValidRequest_shouldReturnCreatedLoan() {
            // Given
            when(customerService.getCustomerById(anyString())).thenReturn(testCustomer);
            when(loanRepository.save(any(Loan.class))).thenReturn(testLoan);
            when(loanMapper.toResponse(any(Loan.class)))
                .thenReturn(new LoanResponse(/* ... */));

            // When
            LoanResponse result = loanService.createLoan(validRequest);

            // Then
            assertThat(result).isNotNull();
            verify(loanRepository).save(any(Loan.class));
            verify(customerService).getCustomerById(validRequest.customerId());
        }

        @Test
        @DisplayName("should throw exception when customer not found")
        void createLoan_withInvalidCustomer_shouldThrowException() {
            // Given
            when(customerService.getCustomerById(anyString()))
                .thenThrow(new CustomerNotFoundException(1L));

            // When/Then
            assertThatThrownBy(() -> loanService.createLoan(validRequest))
                .isInstanceOf(CustomerNotFoundException.class);

            verify(loanRepository, never()).save(any());
        }

        @Test
        @DisplayName("should reject amount exceeding maximum")
        void createLoan_withExcessiveAmount_shouldThrowException() {
            // Given
            CreateLoanRequest request = new CreateLoanRequest(
                "CUST-001",
                "PROD-001",
                BigDecimal.valueOf(999999999), // Exceeds max
                36,
                "Test",
                null
            );

            // When/Then
            assertThatThrownBy(() -> loanService.createLoan(request))
                .isInstanceOf(InvalidLoanAmountException.class)
                .hasMessageContaining("exceeds maximum");
        }
    }

    @Nested
    @DisplayName("getLoanById")
    class GetLoanByIdTests {

        @Test
        @DisplayName("should return loan when exists")
        void getLoanById_whenExists_shouldReturnLoan() {
            // Given
            when(loanRepository.findById(1L)).thenReturn(Optional.of(testLoan));
            when(loanMapper.toResponse(testLoan))
                .thenReturn(new LoanResponse(/* ... */));

            // When
            LoanResponse result = loanService.getLoanById(1L);

            // Then
            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("should throw exception when not found")
        void getLoanById_whenNotExists_shouldThrowException() {
            // Given
            when(loanRepository.findById(999L)).thenReturn(Optional.empty());

            // When/Then
            assertThatThrownBy(() -> loanService.getLoanById(999L))
                .isInstanceOf(LoanNotFoundException.class);
        }
    }
}
```

### 12.2 Integration Test

```java
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("test")
class LoanControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private LoanRepository loanRepository;

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

    @BeforeEach
    void setUp() {
        loanRepository.deleteAll();
    }

    @Test
    @WithMockUser(roles = "LOAN_OFFICER")
    void createLoan_withValidRequest_shouldReturn201() throws Exception {
        // Given
        CreateLoanRequest request = new CreateLoanRequest(
            "CUST-001",
            "PROD-001",
            BigDecimal.valueOf(500000),
            36,
            "Home renovation",
            null
        );

        // When/Then
        mockMvc.perform(post("/api/v1/loans")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.id").exists())
            .andExpect(jsonPath("$.data.status").value("DRAFT"))
            .andExpect(jsonPath("$.data.requestedAmount").value(500000));

        assertThat(loanRepository.count()).isEqualTo(1);
    }

    @Test
    @WithMockUser(roles = "LOAN_OFFICER")
    void createLoan_withInvalidAmount_shouldReturn400() throws Exception {
        // Given
        CreateLoanRequest request = new CreateLoanRequest(
            "CUST-001",
            "PROD-001",
            BigDecimal.valueOf(100), // Below minimum
            36,
            "Test",
            null
        );

        // When/Then
        mockMvc.perform(post("/api/v1/loans")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("amount"));
    }

    @Test
    void createLoan_withoutAuth_shouldReturn401() throws Exception {
        mockMvc.perform(post("/api/v1/loans")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isUnauthorized());
    }
}
```

---

## 13. Code Quality Metrics

### 13.1 SonarQube Quality Gate

| Metric | Threshold | Blocker |
|--------|-----------|---------|
| Code Coverage | ≥ 80% | Yes |
| Duplicated Lines | < 3% | No |
| Maintainability Rating | A | Yes |
| Reliability Rating | A | Yes |
| Security Rating | A | Yes |
| Security Hotspots Reviewed | 100% | Yes |
| Blocker Issues | 0 | Yes |
| Critical Issues | 0 | Yes |

### 13.2 Code Metrics Thresholds

| Metric | Maximum | Tool |
|--------|---------|------|
| Cyclomatic Complexity | 10 | SonarQube |
| Method Length | 50 lines | SonarQube |
| Class Length | 500 lines | SonarQube |
| Method Parameters | 5 | SonarQube |
| Class Fan-out | 20 | SonarQube |

### 13.3 Checkstyle Configuration

```xml
<!-- checkstyle.xml excerpt -->
<module name="Checker">
    <module name="TreeWalker">
        <!-- Naming conventions -->
        <module name="TypeName"/>
        <module name="MethodName"/>
        <module name="ConstantName"/>
        <module name="LocalVariableName"/>

        <!-- Size limits -->
        <module name="MethodLength">
            <property name="max" value="50"/>
        </module>
        <module name="ParameterNumber">
            <property name="max" value="5"/>
        </module>

        <!-- Imports -->
        <module name="AvoidStarImport"/>
        <module name="UnusedImports"/>

        <!-- Whitespace -->
        <module name="WhitespaceAround"/>
        <module name="NoWhitespaceBefore"/>
    </module>
</module>
```

---

## Appendix: Quick Reference

### Spring Annotations

| Annotation | Purpose |
|------------|---------|
| `@Service` | Business logic class |
| `@Repository` | Data access class |
| `@RestController` | REST API controller |
| `@Configuration` | Configuration class |
| `@Component` | Generic Spring bean |
| `@Transactional` | Transaction boundary |
| `@Valid` | Trigger validation |
| `@PreAuthorize` | Method security |

### Lombok Annotations

| Annotation | Generated |
|------------|-----------|
| `@Data` | Getters, setters, equals, hashCode, toString |
| `@Getter/@Setter` | Individual accessor methods |
| `@NoArgsConstructor` | No-args constructor |
| `@AllArgsConstructor` | All-args constructor |
| `@RequiredArgsConstructor` | Constructor for final fields |
| `@Builder` | Builder pattern |
| `@Slf4j` | Logger field |

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Technical Lead | | | |
| Project Manager | | | |

---

**Document End**

*ULMS v2.0 - Java Coding Standards v1.0*

*Unisoft Systems Limited - Confidential*

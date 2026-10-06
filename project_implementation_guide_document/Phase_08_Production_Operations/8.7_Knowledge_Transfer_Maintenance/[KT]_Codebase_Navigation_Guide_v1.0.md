# Codebase Navigation Guide

## ULMS v2.0 - Developer Onboarding Guide

---

**Document Control**

| Field | Value |
|-------|-------|
| Document ID | ULMS-KT-CNG-001 |
| Version | 1.0 |
| Status | Final |
| Classification | Internal - Technical |
| Effective Date | February 2026 |
| Review Cycle | Per Release |
| Owner | Technical Lead |
| Approver | CTO |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Repository Structure](#2-repository-structure)
3. [Architecture Overview](#3-architecture-overview)
4. [Key Components](#4-key-components)
5. [Development Workflow](#5-development-workflow)
6. [Code Patterns](#6-code-patterns)
7. [Debugging Guide](#7-debugging-guide)
8. [Appendices](#8-appendices)

---

## 1. Introduction

### 1.1 Purpose
This guide helps new developers navigate the ULMS v2.0 codebase and understand its structure and conventions.

### 1.2 Prerequisites
- Java 21
- Spring Boot knowledge
- React/TypeScript experience
- Git proficiency

---

## 2. Repository Structure

```
ulms-v2/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/unisoft/ulms/
│   │   │   │       ├── config/           # Configuration classes
│   │   │   │       ├── controller/       # REST controllers
│   │   │   │       ├── service/          # Business logic
│   │   │   │       │   ├── impl/         # Service implementations
│   │   │   │       ├── repository/       # JPA repositories
│   │   │   │       ├── model/            # Entity classes
│   │   │   │       │   ├── entity/       # JPA entities
│   │   │   │       │   ├── dto/          # Data transfer objects
│   │   │   │       │   └── enums/        # Enumerations
│   │   │   │       ├── mapper/           # MapStruct mappers
│   │   │   │       ├── security/         # Security config
│   │   │   │       ├── exception/        # Exception handling
│   │   │   │       ├── validation/       # Custom validators
│   │   │   │       └── util/             # Utility classes
│   │   │   └── resources/
│   │   │       ├── application.yml       # Main config
│   │   │       ├── application-dev.yml   # Dev config
│   │   │       ├── application-prod.yml  # Prod config
│   │   │       └── db/migration/         # Flyway migrations
│   │   └── test/                         # Unit & integration tests
│   └── build.gradle
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── common/       # Generic components
│   │   │   ├── forms/        # Form components
│   │   │   └── layout/       # Layout components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API service layer
│   │   ├── store/            # Redux store
│   │   ├── types/            # TypeScript types
│   │   ├── utils/            # Utility functions
│   │   └── App.tsx
│   └── package.json
├── infrastructure/
│   ├── docker/               # Docker configurations
│   ├── k8s/                  # Kubernetes manifests
│   └── terraform/            # Infrastructure as code
└── docs/
    ├── api/                  # API documentation
    ├── architecture/         # Architecture docs
    └── deployment/           # Deployment guides
```

---

## 3. Architecture Overview

### 3.1 Layered Architecture

```
┌─────────────────────────────────────┐
│  Controller Layer                   │
│  - REST endpoints                   │
│  - Request/Response DTOs           │
│  - Input validation                │
├─────────────────────────────────────┤
│  Service Layer                      │
│  - Business logic                  │
│  - Transaction management          │
│  - Cross-cutting concerns          │
├─────────────────────────────────────┤
│  Repository Layer                   │
│  - Data access                     │
│  - JPA queries                     │
│  - Database operations             │
├─────────────────────────────────────┤
│  Database                           │
│  - PostgreSQL                      │
└─────────────────────────────────────┘
```

### 3.2 Data Flow

```
HTTP Request → Controller → Service → Repository → Database
                                              ↓
HTTP Response ← Controller ← Service ← Repository
```

---

## 4. Key Components

### 4.1 Controllers

Location: `backend/src/main/java/com/unisoft/ulms/controller/`

| Controller | Purpose | Base Path |
|------------|---------|-----------|
| LoanController | Loan CRUD operations | /api/v1/loans |
| CustomerController | Customer management | /api/v1/customers |
| RepaymentController | Payment processing | /api/v1/repayments |
| ReportController | Report generation | /api/v1/reports |
| AuthController | Authentication | /api/v1/auth |

### 4.2 Services

Location: `backend/src/main/java/com/unisoft/ulms/service/`

| Service | Responsibility |
|---------|----------------|
| LoanService | Loan business logic |
| LoanClassificationService | BRPD classification |
| ECLCalculationService | IFRS-9 ECL calculation |
| CIBIntegrationService | Bangladesh Bank CIB |
| WorkflowService | Approval workflows |

### 4.3 Repositories

Location: `backend/src/main/java/com/unisoft/ulms/repository/`

```java
@Repository
public interface LoanRepository extends JpaRepository<Loan, UUID> {
    List<Loan> findByCustomerId(UUID customerId);
    List<Loan> findByStatusAndBranchId(LoanStatus status, UUID branchId);
    
    @Query("SELECT l FROM Loan l WHERE l.status = :status AND l.createdAt > :date")
    List<Loan> findRecentByStatus(@Param("status") LoanStatus status, 
                                   @Param("date") LocalDateTime date);
}
```

---

## 5. Development Workflow

### 5.1 Feature Development

```
1. Create feature branch
   git checkout -b feature/ULMS-123-loan-approval

2. Implement changes
   - Write tests first (TDD)
   - Implement feature
   - Update documentation

3. Run tests
   ./gradlew test

4. Commit changes
   git commit -m "ULMS-123: Add loan approval workflow"

5. Push and create PR
   git push origin feature/ULMS-123-loan-approval

6. Code review and merge
```

### 5.2 Testing

| Test Type | Command | Location |
|-----------|---------|----------|
| Unit Tests | `./gradlew test` | `src/test/java` |
| Integration Tests | `./gradlew integrationTest` | `src/integrationTest/java` |
| Code Coverage | `./gradlew jacocoTestReport` | `build/reports/jacoco` |

---

## 6. Code Patterns

### 6.1 Service Implementation Pattern

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LoanServiceImpl implements LoanService {
    
    private final LoanRepository loanRepository;
    private final CustomerRepository customerRepository;
    private final LoanMapper loanMapper;
    private final EventPublisher eventPublisher;
    
    @Override
    @Transactional
    public LoanResponse createLoan(LoanRequest request) {
        // Validation
        Customer customer = customerRepository.findById(request.getCustomerId())
            .orElseThrow(() -> new CustomerNotFoundException(request.getCustomerId()));
        
        // Business logic
        Loan loan = loanMapper.toEntity(request);
        loan.setStatus(LoanStatus.PENDING);
        loan.setApplicationNumber(generateApplicationNumber());
        
        // Save
        Loan saved = loanRepository.save(loan);
        
        // Publish event
        eventPublisher.publish(new LoanCreatedEvent(saved.getId()));
        
        return loanMapper.toResponse(saved);
    }
}
```

### 6.2 Exception Handling

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NotFoundException ex) {
        log.error("Resource not found: {}", ex.getMessage());
        ErrorResponse error = new ErrorResponse(
            HttpStatus.NOT_FOUND.value(),
            ex.getMessage(),
            LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
}
```

---

## 7. Debugging Guide

### 7.1 Local Development

```bash
# Start dependencies (Docker)
docker-compose up -d postgres redis

# Run application
./gradlew bootRun --args='--spring.profiles.active=dev'

# Or with IDE
# Run UlmsApplication with VM options:
# -Dspring.profiles.active=dev
```

### 7.2 Debug Configuration

```yaml
# application-dev.yml
logging:
  level:
    com.unisoft.ulms: DEBUG
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql: TRACE
```

### 7.3 Common Debug Points

| Issue | Location | Debug Strategy |
|-------|----------|----------------|
| API not working | Controller | Check request mapping |
| Data not saving | Service | Check transaction boundary |
| Query slow | Repository | Enable SQL logging |
| Auth failing | Security | Check JWT filter |

---

## 8. Appendices

### Appendix A: Useful Commands

```bash
# Build project
./gradlew clean build

# Run specific test
./gradlew test --tests LoanServiceTest

# Generate API docs
./gradlew openapi

# Database migration
./gradlew flywayMigrate

# Code quality check
./gradlew sonarqube
```

### Appendix B: Related Documents

| Document | ID |
|----------|-----|
| Development Environment Setup | ULMS-KT-DEV-002 |
| Common Development Tasks | ULMS-KT-CDT-003 |
| Troubleshooting Guide | ULMS-KT-TSG-004 |

---

**Document Control Footer**

*Classification: Internal - Technical*
*Next Review: Per Release*
*Owner: Technical Lead*

**END OF DOCUMENT**

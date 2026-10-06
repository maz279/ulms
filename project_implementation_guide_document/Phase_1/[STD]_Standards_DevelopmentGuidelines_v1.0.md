# Development Standards & Guidelines
## Unisoft Loan Management System (ULMS) v2.0

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Development Standards & Guidelines - ULMS v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 3, 2026 |
| **Prepared By** | Technical Lead |
| **Reviewed By** | QA Lead, Project Manager |
| **Classification** | Confidential - Internal Use |
| **Status** | Approved |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Code Quality Standards](#2-code-quality-standards)
3. [Java Coding Standards](#3-java-coding-standards)
4. [TypeScript/React Coding Standards](#4-typescriptreact-coding-standards)
5. [Database Standards](#5-database-standards)
6. [Git Workflow Standards](#6-git-workflow-standards)
7. [Testing Standards](#7-testing-standards)
8. [Documentation Standards](#8-documentation-standards)
9. [Security Standards](#9-security-standards)
10. [Performance Standards](#10-performance-standards)
11. [Review & Approval Process](#11-review--approval-process)

---

## 1. Introduction

### Purpose
This document establishes the development standards and guidelines for the ULMS v2.0 project. All team members must adhere to these standards to ensure code quality, maintainability, and consistency across the codebase.

### Scope
These standards apply to:
- All Java/Spring Boot backend code
- All TypeScript/React frontend code
- All SQL database scripts
- All configuration files
- All documentation

### Reference Standards
- Google Java Style Guide
- Airbnb React/JSX Style Guide
- OWASP Secure Coding Practices
- ISO/IEC 25010 Software Quality Standards

---

## 2. Code Quality Standards

### 2.1 General Principles

| Principle | Description |
|-----------|-------------|
| **KISS** | Keep It Simple, Stupid - Avoid unnecessary complexity |
| **DRY** | Don't Repeat Yourself - Centralize common logic |
| **SOLID** | Follow SOLID principles for OOP |
| **YAGNI** | You Ain't Gonna Need It - Don't over-engineer |

### 2.2 Code Metrics Thresholds

| Metric | Java | TypeScript | Action if Exceeded |
|--------|------|------------|-------------------|
| Cyclomatic Complexity | < 10 | < 10 | Refactor into smaller methods |
| Method Length | < 50 lines | < 40 lines | Extract helper methods |
| Class Length | < 500 lines | < 300 lines | Split into multiple classes |
| Parameter Count | < 5 | < 5 | Use parameter objects |
| Nesting Depth | < 4 | < 4 | Extract methods |
| File Length | < 1000 lines | < 500 lines | Split module |

### 2.3 SonarQube Quality Gates

All code must pass the following quality gates:

| Gate | Threshold | Severity |
|------|-----------|----------|
| Code Coverage | > 80% | Blocker |
| Duplicated Lines | < 3% | Critical |
| Security Hotspots | 0 | Blocker |
| Vulnerabilities | 0 | Blocker |
| Bugs | 0 | Critical |
| Code Smells | < 50 | Major |
| Technical Debt | < 30 days | Major |

---

## 3. Java Coding Standards

### 3.1 Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Classes | PascalCase | `LoanApplicationService` |
| Interfaces | PascalCase (adjective) | `LoanRepository`, `Serializable` |
| Methods | camelCase | `calculateEmiAmount()` |
| Variables | camelCase | `loanAmount` |
| Constants | UPPER_SNAKE_CASE | `MAX_LOAN_AMOUNT` |
| Packages | lowercase | `com.unisoft.ulms.loan` |
| Enums | PascalCase | `LoanStatus` |
| Test Classes | PascalCase + Test | `LoanServiceTest` |

### 3.2 Package Structure

```
com.unisoft.ulms
├── loan                    # Domain module
│   ├── controller          # REST controllers
│   ├── service             # Business logic
│   │   └── impl            # Service implementations
│   ├── repository          # Data access
│   ├── model               # Domain models/entities
│   ├── dto                 # Data transfer objects
│   ├── mapper              # Entity-DTO mappers
│   ├── exception           # Custom exceptions
│   └── validator           # Business validators
├── cib                     # CIB integration
├── workflow                # Workflow engine
├── config                  # Configuration
├── security                # Security components
└── common                  # Shared utilities
    ├── util
    ├── constant
    └── annotation
```

### 3.3 Class Structure Template

```java
/**
 * Service class for managing loan applications.
 * 
 * @author Developer Name
 * @since 1.0.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LoanApplicationService {
    
    // ==================== Constants ====================
    private static final int MAX_RETRY_ATTEMPTS = 3;
    private static final String LOAN_PREFIX = "LN";
    
    // ==================== Dependencies ====================
    private final LoanApplicationRepository loanRepository;
    private final CustomerService customerService;
    private final CibService cibService;
    
    // ==================== Public Methods ====================
    
    /**
     * Creates a new loan application.
     *
     * @param request the loan application request
     * @return the created loan application
     * @throws InvalidCustomerException if customer not found
     * @throws CibInquiryException if CIB inquiry fails
     */
    @Transactional
    public LoanApplicationDTO createLoanApplication(
            @Valid @NotNull LoanApplicationRequest request) {
        
        log.info("Creating loan application for customer: {}", 
                request.getCustomerId());
        
        validateCustomer(request.getCustomerId());
        CibReport cibReport = performCibInquiry(request);
        
        LoanApplication loan = buildLoanApplication(request, cibReport);
        LoanApplication saved = loanRepository.save(loan);
        
        log.info("Loan application created: {}", saved.getLoanNumber());
        
        return mapToDTO(saved);
    }
    
    // ==================== Private Methods ====================
    
    private void validateCustomer(Long customerId) {
        // Implementation
    }
    
    private LoanApplication buildLoanApplication(
            LoanApplicationRequest request, 
            CibReport cibReport) {
        // Implementation
        return null;
    }
}
```

### 3.4 Spring Boot Best Practices

```java
// ✅ DO: Use constructor injection
@Service
@RequiredArgsConstructor
public class LoanService {
    private final LoanRepository repository;
    private final CustomerService customerService;
}

// ❌ DON'T: Use field injection
@Service
public class LoanService {
    @Autowired
    private LoanRepository repository;  // Avoid this
}

// ✅ DO: Use DTOs for API boundaries
@PostMapping("/loans")
public ResponseEntity<LoanDTO> createLoan(
        @Valid @RequestBody LoanRequestDTO request) {
    // Implementation
}

// ❌ DON'T: Expose entities directly
@PostMapping("/loans")
public ResponseEntity<Loan> createLoan(@RequestBody Loan loan) {
    // Avoid this - exposes internal structure
}

// ✅ DO: Use proper HTTP status codes
@GetMapping("/loans/{id}")
public ResponseEntity<LoanDTO> getLoan(@PathVariable Long id) {
    return repository.findById(id)
            .map(this::mapToDTO)
            .map(ResponseEntity::ok)
            .orElseThrow(() -> new LoanNotFoundException(id));
}

// ✅ DO: Use exception handlers
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(LoanNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleLoanNotFound(
            LoanNotFoundException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(ex.getMessage(), 
                        LocalDateTime.now()));
    }
}
```

### 3.5 Logging Standards

```java
@Slf4j
@Service
public class LoanService {
    
    public LoanDTO processLoan(Long loanId) {
        // ✅ DO: Log at appropriate levels
        log.debug("Processing loan: {}", loanId);
        
        try {
            // Business logic
            log.info("Loan {} processed successfully", loanId);
        } catch (Exception e) {
            // ✅ DO: Log exceptions with context
            log.error("Failed to process loan: {}", loanId, e);
            throw new LoanProcessingException(loanId, e);
        }
        
        // ❌ DON'T: Log sensitive data
        // log.info("Customer NID: {}", customer.getNidNumber()); // NEVER
        
        // ✅ DO: Mask sensitive data
        log.info("Customer NID: {}", maskNid(customer.getNidNumber()));
    }
    
    private String maskNid(String nid) {
        if (nid == null || nid.length() < 4) return "***";
        return "***" + nid.substring(nid.length() - 4);
    }
}
```

### 3.6 Exception Handling

```java
// Custom exception hierarchy
public abstract class ULMSException extends RuntimeException {
    private final String errorCode;
    private final HttpStatus httpStatus;
    
    protected ULMSException(String message, String errorCode, 
                           HttpStatus httpStatus) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }
}

public class LoanNotFoundException extends ULMSException {
    public LoanNotFoundException(Long loanId) {
        super(
            String.format("Loan not found: %d", loanId),
            "LOAN-001",
            HttpStatus.NOT_FOUND
        );
    }
}

public class CibInquiryException extends ULMSException {
    public CibInquiryException(String nid, Throwable cause) {
        super(
            String.format("CIB inquiry failed for NID: %s", nid),
            "CIB-001",
            HttpStatus.SERVICE_UNAVAILABLE
        );
    }
}
```

---

## 4. TypeScript/React Coding Standards

### 4.1 Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Components | PascalCase | `LoanApplicationForm` |
| Hooks | camelCase + use prefix | `useLoanData` |
| Types/Interfaces | PascalCase + Type/Props | `LoanType`, `ButtonProps` |
| Constants | UPPER_SNAKE_CASE | `MAX_LOAN_AMOUNT` |
| Functions | camelCase | `calculateEmi` |
| Variables | camelCase | `loanAmount` |
| Files | PascalCase (components) | `LoanCard.tsx` |
| Files | camelCase (utils) | `formatCurrency.ts` |

### 4.2 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Shared components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   ├── Button.styles.ts
│   │   │   └── index.ts
│   │   └── Input/
│   └── domain/          # Domain-specific components
│       └── LoanCard/
├── hooks/               # Custom React hooks
├── modules/             # Feature modules
│   ├── los/            # Loan Origination
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── credit/
│   └── workflow/
├── services/            # API services
│   ├── api/            # Axios instances
│   ├── loanService.ts
│   └── customerService.ts
├── store/              # Redux store
│   ├── slices/
│   └── index.ts
├── types/              # Global TypeScript types
├── utils/              # Utility functions
├── styles/             # Global styles
└── i18n/               # Internationalization
    ├── bn/             # Bengali
    └── en/             # English
```

### 4.3 Component Template

```typescript
/**
 * LoanApplicationForm Component
 * 
 * Multi-step form for creating loan applications.
 * 
 * @example
 * ```tsx
 * <LoanApplicationForm 
 *   customerId={123}
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 * />
 * ```
 */
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button, TextField, Select } from '@/components/common';
import { useLoanProducts } from '@/hooks/useLoanProducts';
import { LoanService } from '@/services/loanService';
import { LoanApplicationRequest } from '@/types/loan.types';

import * as S from './LoanApplicationForm.styles';

// ==================== Types ====================
interface LoanApplicationFormProps {
  customerId: number;
  onSubmit: (data: LoanApplicationRequest) => void;
  onCancel: () => void;
}

// ==================== Validation Schema ====================
const loanSchema = z.object({
  productId: z.number().min(1, 'Product is required'),
  amount: z.number().min(50000).max(20000000),
  tenure: z.number().min(12).max(360),
  purpose: z.string().min(10).max(500),
});

type LoanFormData = z.infer<typeof loanSchema>;

// ==================== Component ====================
export const LoanApplicationForm: React.FC<LoanApplicationFormProps> = ({
  customerId,
  onSubmit,
  onCancel,
}) => {
  const { t } = useTranslation();
  const { products, isLoading } = useLoanProducts();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      amount: 500000,
      tenure: 36,
    },
  });

  const selectedAmount = watch('amount');
  const selectedTenure = watch('tenure');

  const handleFormSubmit = useCallback(
    async (data: LoanFormData) => {
      setIsSubmitting(true);
      try {
        const request: LoanApplicationRequest = {
          ...data,
          customerId,
        };
        await onSubmit(request);
      } finally {
        setIsSubmitting(false);
      }
    },
    [customerId, onSubmit]
  );

  if (isLoading) {
    return <S.LoadingSkeleton />;
  }

  return (
    <S.FormContainer>
      <S.FormTitle>{t('loan.application.title')}</S.FormTitle>
      
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <Select
          label={t('loan.product.label')}
          options={products.map((p) => ({
            value: p.id,
            label: t(`products.${p.code}`),
          }))}
          error={errors.productId?.message}
          {...register('productId', { valueAsNumber: true })}
        />

        <TextField
          label={t('loan.amount.label')}
          type="number"
          helperText={t('loan.amount.range', { min: 50000, max: 20000000 })}
          error={errors.amount?.message}
          {...register('amount', { valueAsNumber: true })}
        />

        <TextField
          label={t('loan.tenure.label')}
          type="number"
          helperText={t('loan.tenure.range', { min: 12, max: 360 })}
          error={errors.tenure?.message}
          {...register('tenure', { valueAsNumber: true })}
        />

        <TextField
          label={t('loan.purpose.label')}
          multiline
          rows={4}
          error={errors.purpose?.message}
          {...register('purpose')}
        />

        <S.EmiPreview>
          {t('loan.emi.estimate', {
            amount: selectedAmount,
            tenure: selectedTenure,
          })}
        </S.EmiPreview>

        <S.ButtonGroup>
          <Button variant="outlined" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button 
            type="submit" 
            variant="contained"
            loading={isSubmitting}
          >
            {t('loan.application.submit')}
          </Button>
        </S.ButtonGroup>
      </form>
    </S.FormContainer>
  );
};

export default LoanApplicationForm;
```

### 4.4 Hook Standards

```typescript
/**
 * useLoanData Hook
 * 
 * Fetches and manages loan data with caching.
 * 
 * @param loanId - The loan ID to fetch
 * @returns Loan data, loading state, and error
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LoanService } from '@/services/loanService';
import { Loan, LoanUpdateRequest } from '@/types/loan.types';

interface UseLoanDataResult {
  loan: Loan | undefined;
  isLoading: boolean;
  error: Error | null;
  updateLoan: (data: LoanUpdateRequest) => Promise<void>;
  refreshLoan: () => void;
}

export const useLoanData = (loanId: number): UseLoanDataResult => {
  const queryClient = useQueryClient();
  const queryKey = ['loan', loanId];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => LoanService.getLoan(loanId),
    enabled: !!loanId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });

  const updateMutation = useMutation({
    mutationFn: (request: LoanUpdateRequest) =>
      LoanService.updateLoan(loanId, request),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    loan: data,
    isLoading,
    error,
    updateLoan: updateMutation.mutateAsync,
    refreshLoan: refetch,
  };
};
```

### 4.5 API Service Standards

```typescript
// services/api/axiosConfig.ts
import axios, { AxiosError, AxiosInstance } from 'axios';
import { useAuthStore } from '@/store/authSlice';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle token refresh
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          useAuthStore.getState().setTokens(response.data);
          // Retry original request
          return apiClient(error.config!);
        } catch {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// services/loanService.ts
import { apiClient } from './api/axiosConfig';
import { Loan, LoanApplicationRequest } from '@/types/loan.types';

export const LoanService = {
  async getLoan(id: number): Promise<Loan> {
    const response = await apiClient.get<Loan>(`/loans/${id}`);
    return response.data;
  },

  async createLoan(request: LoanApplicationRequest): Promise<Loan> {
    const response = await apiClient.post<Loan>('/loans', request);
    return response.data;
  },

  async updateLoan(id: number, data: Partial<Loan>): Promise<Loan> {
    const response = await apiClient.put<Loan>(`/loans/${id}`, data);
    return response.data;
  },

  async deleteLoan(id: number): Promise<void> {
    await apiClient.delete(`/loans/${id}`);
  },
};
```

---

## 5. Database Standards

### 5.1 Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Tables | lowercase, plural | `loan_applications` |
| Columns | lowercase, snake_case | `customer_id` |
| Primary Keys | `id` or `{table}_id` | `id` |
| Foreign Keys | `{referenced_table}_id` | `customer_id` |
| Indexes | `idx_{table}_{column}` | `idx_loan_customer_id` |
| Constraints | `pk_{table}`, `fk_{table}_{ref}` | `pk_loans` |
| Sequences | `{table}_{column}_seq` | `loan_id_seq` |

### 5.2 Table Design Standards

```sql
-- ✅ DO: Use appropriate data types
CREATE TABLE loan_applications (
    id                          BIGSERIAL PRIMARY KEY,
    loan_number                 VARCHAR(20) NOT NULL UNIQUE,
    customer_id                 BIGINT NOT NULL,
    product_id                  INTEGER NOT NULL,
    
    -- Monetary amounts as DECIMAL
    principal_amount            DECIMAL(18, 2) NOT NULL,
    interest_rate               DECIMAL(5, 4) NOT NULL,
    
    -- Enumerated values as VARCHAR with check constraint
    status                      VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    
    -- Timestamps
    application_date            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approval_date               TIMESTAMP,
    disbursement_date           TIMESTAMP,
    created_at                  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by                  VARCHAR(50) NOT NULL,
    updated_by                  VARCHAR(50),
    
    -- Soft delete
    is_deleted                  BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at                  TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_status CHECK (status IN (
        'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 
        'DISBURSED', 'CLOSED'
    )),
    CONSTRAINT chk_positive_amount CHECK (principal_amount > 0),
    
    -- Foreign Keys
    CONSTRAINT fk_loan_customer 
        FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_loan_product 
        FOREIGN KEY (product_id) REFERENCES loan_products(id)
);

-- ✅ DO: Create indexes for frequently queried columns
CREATE INDEX idx_loan_customer_id ON loan_applications(customer_id);
CREATE INDEX idx_loan_status ON loan_applications(status) 
    WHERE is_deleted = FALSE;
CREATE INDEX idx_loan_application_date ON loan_applications(application_date);

-- ✅ DO: Add comments for documentation
COMMENT ON TABLE loan_applications IS 
    'Stores loan application data for all products';
COMMENT ON COLUMN loan_applications.principal_amount IS 
    'Loan principal in BDT (Bangladesh Taka)';
```

### 5.3 Migration Standards

```sql
-- V1.0.0__create_loan_applications_table.sql
-- ==========================================
-- Purpose: Create loan_applications table
-- Author: Developer Name
-- Date: 2026-02-03
-- Ticket: ULMS-123
-- ==========================================

BEGIN;

-- Create table
CREATE TABLE IF NOT EXISTS loan_applications (
    -- ... table definition ...
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_loan_customer_id 
    ON loan_applications(customer_id);

-- Add audit trigger
CREATE TRIGGER loan_applications_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON loan_applications
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

COMMIT;

-- V1.0.1__add_loan_classification_columns.sql
-- ===========================================
-- Purpose: Add BRPD classification columns
-- Author: Developer Name  
-- Date: 2026-02-10
-- Ticket: ULMS-145
-- ==========================================

BEGIN;

ALTER TABLE loan_applications
    ADD COLUMN IF NOT EXISTS classification_stage VARCHAR(10) 
        DEFAULT 'STD-0',
    ADD COLUMN IF NOT EXISTS days_past_due INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS provisioning_rate DECIMAL(5, 2) DEFAULT 1.00,
    ADD COLUMN IF NOT EXISTS classified_at TIMESTAMP;

-- Create index for classification queries
CREATE INDEX idx_loan_classification 
    ON loan_applications(classification_stage) 
    WHERE is_deleted = FALSE;

COMMIT;
```

---

## 6. Git Workflow Standards

### 6.1 Branching Strategy (GitFlow)

```
main (production)
  ↑
develop (integration)
  ↑
  ├── feature/ULMS-123-loan-application
  ├── feature/ULMS-124-cib-integration
  └── feature/ULMS-125-workflow-engine
  ↑
release/v1.0.0
  ↑
hotfix/v1.0.1
```

### 6.2 Branch Naming

| Branch Type | Pattern | Example |
|-------------|---------|---------|
| Feature | `feature/{ticket-id}-{description}` | `feature/ULMS-123-loan-application` |
| Bugfix | `bugfix/{ticket-id}-{description}` | `bugfix/ULMS-145-cib-timeout` |
| Hotfix | `hotfix/{version}-{description}` | `hotfix/v1.0.1-memory-leak` |
| Release | `release/v{version}` | `release/v1.0.0` |

### 6.3 Commit Message Standards

Format: `<type>(<scope>): <subject>`

```bash
# Types
feat:     New feature
fix:      Bug fix
docs:     Documentation only
style:    Code style (formatting, no logic change)
refactor: Code refactoring
test:     Adding or updating tests
chore:    Build process or auxiliary tool changes
perf:     Performance improvement
ci:       CI/CD changes
```

Examples:
```bash
# Good commit messages
feat(loan): add loan application form validation
fix(cib): resolve timeout issue on CIB inquiry
docs(api): update API documentation for loan endpoints
test(workflow): add unit tests for approval service
refactor(db): optimize loan query performance

# Bad commit messages (avoid)
git commit -m "fix"                    # Too vague
git commit -m "updated stuff"          # Not descriptive
git commit -m "WIP"                    # Work in progress
git commit -m "fix bug"                # No context
```

### 6.4 Pull Request Standards

```markdown
## Description
Brief description of changes

## Related Ticket
ULMS-123

## Type of Change
- [ ] Bug fix
- [x] New feature
- [ ] Breaking change
- [ ] Documentation update

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] No new SonarQube issues

## Screenshots (if UI changes)

## Testing Instructions
1. Step 1
2. Step 2
3. Verify result
```

---

## 7. Testing Standards

### 7.1 Test Coverage Requirements

| Layer | Minimum Coverage | Target Coverage |
|-------|------------------|-----------------|
| Unit Tests | 80% | 90% |
| Integration Tests | 70% | 80% |
| E2E Tests | Critical paths | Critical paths |

### 7.2 Java Unit Test Template

```java
@ExtendWith(MockitoExtension.class)
class LoanApplicationServiceTest {

    @Mock
    private LoanApplicationRepository loanRepository;
    
    @Mock
    private CustomerService customerService;
    
    @InjectMocks
    private LoanApplicationService loanService;

    @Test
    @DisplayName("Should create loan application successfully")
    void createLoanApplication_Success() {
        // Given
        LoanApplicationRequest request = LoanApplicationRequest.builder()
                .customerId(1L)
                .productId(1)
                .amount(BigDecimal.valueOf(500000))
                .tenure(36)
                .build();
                
        Customer customer = Customer.builder()
                .id(1L)
                .name("Test Customer")
                .build();
                
        when(customerService.findById(1L)).thenReturn(customer);
        when(loanRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        // When
        LoanDTO result = loanService.createLoanApplication(request);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo("PENDING");
        verify(loanRepository).save(any(LoanApplication.class));
    }

    @Test
    @DisplayName("Should throw exception when customer not found")
    void createLoanApplication_CustomerNotFound() {
        // Given
        LoanApplicationRequest request = LoanApplicationRequest.builder()
                .customerId(999L)
                .build();
                
        when(customerService.findById(999L))
                .thenThrow(new CustomerNotFoundException(999L));

        // When/Then
        assertThatThrownBy(() -> loanService.createLoanApplication(request))
                .isInstanceOf(CustomerNotFoundException.class)
                .hasMessageContaining("Customer not found: 999");
    }
}
```

### 7.3 React Component Test Template

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { LoanApplicationForm } from './LoanApplicationForm';
import { LoanService } from '@/services/loanService';

// Mock the service
jest.mock('@/services/loanService');

describe('LoanApplicationForm', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <LoanApplicationForm
          customerId={1}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
          {...props}
        />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render form fields correctly', () => {
    renderComponent();
    
    expect(screen.getByLabelText(/loan.product/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/loan.amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/loan.tenure/i)).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    renderComponent();
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/product is required/i)).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    const onSubmit = jest.fn();
    renderComponent({ onSubmit });
    
    // Fill form
    await userEvent.selectOptions(
      screen.getByLabelText(/loan.product/i),
      '1'
    );
    await userEvent.clear(screen.getByLabelText(/loan.amount/i));
    await userEvent.type(screen.getByLabelText(/loan.amount/i), '500000');
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 1,
          amount: 500000,
        })
      );
    });
  });
});
```

---

## 8. Documentation Standards

### 8.1 Code Documentation

```java
/**
 * Calculates Equated Monthly Installment (EMI) for a loan.
 * 
 * <p>Uses the standard EMI formula:</p>
 * <pre>
 * EMI = [P × R × (1+R)^N] / [(1+R)^N - 1]
 * where:
 * P = Principal amount
 * R = Monthly interest rate (annual rate / 12 / 100)
 * N = Number of months
 * </pre>
 *
 * @param principal the loan principal amount (must be positive)
 * @param annualRate the annual interest rate in percentage (e.g., 12.5)
 * @param tenureMonths the loan tenure in months
 * @return the calculated EMI amount
 * @throws IllegalArgumentException if principal, rate, or tenure is invalid
 * @see <a href="https://en.wikipedia.org/wiki/Equated_monthly_installment">
 *      EMI Wikipedia</a>
 */
public BigDecimal calculateEmi(
        BigDecimal principal, 
        BigDecimal annualRate, 
        int tenureMonths) {
    // Implementation
}
```

### 8.2 API Documentation (OpenAPI)

```yaml
openapi: 3.0.0
info:
  title: ULMS Loan API
  version: 1.0.0

paths:
  /api/v1/loans:
    post:
      summary: Create a new loan application
      description: |
        Creates a new loan application for an existing customer.
        Performs CIB inquiry and credit scoring automatically.
      tags:
        - Loans
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoanApplicationRequest'
      responses:
        '201':
          description: Loan application created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LoanApplication'
        '400':
          description: Invalid request data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '404':
          description: Customer not found
```

---

## 9. Security Standards

### 9.1 OWASP Top 10 Compliance

| Risk | Mitigation | Implementation |
|------|------------|----------------|
| Injection | Parameterized queries | JPA/Hibernate |
| Broken Auth | JWT + MFA | Keycloak |
| Sensitive Data | AES-256 encryption | JPA converters |
| XXE | Disable DTDs | XML parser config |
| Broken Access | RBAC | Spring Security |
| Misconfiguration | Security headers | Spring Security |
| XSS | Output encoding | React auto-escape |
| Insecure Deserialization | Input validation | DTO validation |
| Components | Dependency scanning | Snyk/OWASP DC |
| Logging | No sensitive data | Log masking |

### 9.2 Secure Coding Practices

```java
// ✅ DO: Validate all inputs
public void processLoan(@Valid @NotNull LoanRequest request) {
    // Implementation
}

// ✅ DO: Use parameterized queries
@Query("SELECT l FROM Loan l WHERE l.status = :status")
List<Loan> findByStatus(@Param("status") String status);

// ✅ DO: Encrypt sensitive data
@Entity
public class Customer {
    @Convert(converter = NidEncryptor.class)
    private String nidNumber;
}

// ✅ DO: Implement rate limiting
@RateLimiter(name = "cibInquiry", fallbackMethod = "cibFallback")
public CibReport inquireCib(String nid) {
    // Implementation
}

// ✅ DO: Log security events
@AuditLog(action = "LOAN_APPROVAL", level = "SECURITY")
public void approveLoan(Long loanId) {
    // Implementation
}
```

---

## 10. Performance Standards

### 10.1 Response Time Targets

| Operation | Target | Maximum |
|-----------|--------|---------|
| API Response (P95) | < 200ms | < 500ms |
| Page Load | < 2s | < 5s |
| Database Query | < 50ms | < 200ms |
| CIB Inquiry | < 30s | < 2min |
| Report Generation | < 10s | < 30s |

### 10.2 Database Performance

```sql
-- ✅ DO: Use EXPLAIN ANALYZE for query optimization
EXPLAIN ANALYZE 
SELECT * FROM loan_applications 
WHERE customer_id = 12345 
AND status = 'PENDING';

-- ✅ DO: Add appropriate indexes
CREATE INDEX CONCURRENTLY idx_loan_customer_status 
ON loan_applications(customer_id, status);

-- ✅ DO: Use pagination for large datasets
SELECT * FROM loan_applications 
WHERE status = 'PENDING'
ORDER BY created_at DESC
LIMIT 50 OFFSET 0;
```

---

## 11. Review & Approval Process

### 11.1 Code Review Checklist

```markdown
## Code Review Checklist

### General
- [ ] Code follows style guidelines
- [ ] No hardcoded values (use constants/config)
- [ ] No commented-out code
- [ ] No debug/console logs left in code
- [ ] No sensitive data in code/logs

### Java
- [ ] Proper exception handling
- [ ] Transaction boundaries correct
- [ ] Null safety checks
- [ ] Thread safety considered
- [ ] Resource leaks prevented

### TypeScript/React
- [ ] Type safety maintained
- [ ] Proper error boundaries
- [ ] Memory leaks prevented
- [ ] Accessibility (a11y) considered

### Database
- [ ] Migration scripts included
- [ ] Indexes added for new queries
- [ ] No N+1 query problems
- [ ] Rollback script provided

### Testing
- [ ] Unit tests added/updated
- [ ] Test coverage maintained
- [ ] Integration tests for new endpoints
```

### 11.2 Approval Matrix

| Change Type | Reviewers Required | Approvers Required |
|-------------|-------------------|-------------------|
| Bug fix | 1 | 1 (Tech Lead) |
| Feature | 2 | 1 (Tech Lead) |
| Database | 2 | 2 (Tech Lead + DBA) |
| Security | 2 | 2 (Tech Lead + Security) |
| Release | All | 2 (PM + Tech Lead) |

---

**Document Version:** 1.0  
**Last Updated:** February 3, 2026  
**Next Review:** Monthly or as needed

*Document Classification: Confidential - Internal Use Only*

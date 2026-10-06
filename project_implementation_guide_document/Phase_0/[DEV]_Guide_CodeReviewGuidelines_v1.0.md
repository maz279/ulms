# Code Review Guidelines & Checklist

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ULMS-DEV-0.2.6 |
| **Document Title** | Code Review Guidelines & Checklist |
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
2. [Code Review Philosophy](#2-code-review-philosophy)
3. [Review Process](#3-review-process)
4. [General Code Review Checklist](#4-general-code-review-checklist)
5. [Java/Spring Boot Checklist](#5-javaspring-boot-checklist)
6. [TypeScript/React Checklist](#6-typescriptreact-checklist)
7. [Database/SQL Checklist](#7-databasesql-checklist)
8. [Security Review Checklist](#8-security-review-checklist)
9. [Performance Checklist](#9-performance-checklist)
10. [Testing Checklist](#10-testing-checklist)
11. [ULMS-Specific Checklist](#11-ulms-specific-checklist)
12. [Review Feedback Guidelines](#12-review-feedback-guidelines)
13. [Approval Matrix](#13-approval-matrix)

---

## 1. Introduction

### 1.1 Purpose

This document establishes code review standards and checklists for the ULMS v2.0 project. Code reviews ensure code quality, knowledge sharing, and compliance with project standards before merging to shared branches.

### 1.2 Scope

All code changes must be reviewed before merging to `develop` or `main` branches:
- Backend (Java/Spring Boot) code
- Frontend (TypeScript/React) code
- Mobile (React Native) code
- Database migrations
- Infrastructure configurations
- Documentation updates

### 1.3 Goals

| Goal | Description |
|------|-------------|
| Quality | Catch bugs and issues before they reach production |
| Consistency | Ensure code follows project standards |
| Knowledge sharing | Spread understanding across the team |
| Security | Identify vulnerabilities early |
| Compliance | Verify Bangladesh banking requirements |

---

## 2. Code Review Philosophy

### 2.1 Core Principles

1. **Respect**: Reviews are about code, not people
2. **Constructive**: Provide actionable feedback
3. **Educational**: Explain the "why" behind suggestions
4. **Collaborative**: Work together to improve code
5. **Timely**: Review within 24 hours for normal MRs

### 2.2 Reviewer Mindset

| Do | Don't |
|----|-------|
| Ask questions for clarity | Make assumptions about intent |
| Suggest improvements | Demand specific implementation |
| Acknowledge good practices | Focus only on negatives |
| Consider context and constraints | Ignore business requirements |
| Be specific in feedback | Make vague comments |

### 2.3 Author Mindset

| Do | Don't |
|----|-------|
| Provide context in MR description | Expect reviewers to guess intent |
| Keep MRs focused and small | Create massive MRs |
| Respond to feedback constructively | Take feedback personally |
| Self-review before requesting | Submit without checking |
| Thank reviewers for their time | Dismiss valid concerns |

---

## 3. Review Process

### 3.1 Review Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                     CODE REVIEW WORKFLOW                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   1. Author                                                  │
│      └── Self-review changes                                │
│      └── Create Merge Request                               │
│      └── Fill MR template                                   │
│      └── Assign reviewers                                   │
│                                                              │
│   2. CI Pipeline                                             │
│      └── Build                                              │
│      └── Tests                                              │
│      └── Lint/Format                                        │
│      └── SonarQube analysis                                 │
│                                                              │
│   3. Reviewer(s)                                             │
│      └── Review code changes                                │
│      └── Check against checklists                          │
│      └── Leave comments/suggestions                        │
│      └── Approve or Request changes                        │
│                                                              │
│   4. Author                                                  │
│      └── Address feedback                                   │
│      └── Update MR                                          │
│      └── Resolve discussions                                │
│                                                              │
│   5. Final Approval                                          │
│      └── Reviewer approves                                  │
│      └── CI passes                                          │
│      └── Merge to target branch                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Service Level Agreements (SLAs)

| MR Size | Initial Review | Follow-up Review |
|---------|----------------|------------------|
| Small (< 100 lines) | < 4 hours | < 2 hours |
| Medium (100-500 lines) | < 8 hours | < 4 hours |
| Large (500+ lines) | < 24 hours | < 8 hours |
| Hotfix/Critical | < 2 hours | < 1 hour |

### 3.3 MR Size Guidelines

| Size | Lines Changed | Recommendation |
|------|---------------|----------------|
| XS | < 50 | Ideal for quick fixes |
| S | 50-100 | Preferred size |
| M | 100-300 | Acceptable |
| L | 300-500 | Consider splitting |
| XL | 500+ | Must split unless justified |

### 3.4 When to Split MRs

- Refactoring + new feature → Separate MRs
- Multiple unrelated fixes → Separate MRs
- Backend + Frontend for same feature → Can be together
- Database migration + code changes → Consider splitting

---

## 4. General Code Review Checklist

### 4.1 Readability & Maintainability

- [ ] **Naming**: Variables, functions, classes have meaningful names
- [ ] **Comments**: Complex logic is explained; no commented-out code
- [ ] **Formatting**: Code follows project formatting standards
- [ ] **Structure**: Code is organized logically
- [ ] **DRY**: No unnecessary code duplication
- [ ] **KISS**: Solution is not over-engineered
- [ ] **Single Responsibility**: Functions/classes do one thing well

### 4.2 Correctness

- [ ] **Logic**: Implementation matches requirements
- [ ] **Edge cases**: Boundary conditions are handled
- [ ] **Error handling**: Errors are caught and handled appropriately
- [ ] **Null safety**: Null/undefined values are handled
- [ ] **Resource management**: Resources are properly closed/released

### 4.3 Documentation

- [ ] **API docs**: Public methods have documentation
- [ ] **README**: Updated if setup/usage changes
- [ ] **CHANGELOG**: Updated for user-facing changes
- [ ] **OpenAPI**: API specifications updated

### 4.4 Code Hygiene

- [ ] **No debug code**: console.log, print statements removed
- [ ] **No hardcoded values**: Uses configuration/constants
- [ ] **No sensitive data**: No credentials, tokens, PII in code
- [ ] **No TODO without ticket**: TODOs reference ULMS ticket
- [ ] **Import organization**: Imports are clean and organized

---

## 5. Java/Spring Boot Checklist

### 5.1 Code Quality

- [ ] **Package structure**: Follows `com.unisoft.ulms.<module>` convention
- [ ] **Class naming**: PascalCase, descriptive names
- [ ] **Method naming**: camelCase, verb-noun pattern
- [ ] **Method length**: < 50 lines per method
- [ ] **Class length**: < 500 lines per class
- [ ] **Cyclomatic complexity**: < 10 per method

### 5.2 Spring Boot Specific

- [ ] **Dependency Injection**: Constructor injection preferred
- [ ] **@Service/@Repository**: Appropriate annotations used
- [ ] **@Transactional**: Correct transaction boundaries
- [ ] **@Valid/@Validated**: Request validation in place
- [ ] **@ControllerAdvice**: Centralized exception handling
- [ ] **Configuration**: Uses @ConfigurationProperties for config

```java
// Good: Constructor injection
@Service
@RequiredArgsConstructor
public class LoanService {
    private final LoanRepository loanRepository;
    private final CibService cibService;
}

// Bad: Field injection
@Service
public class LoanService {
    @Autowired
    private LoanRepository loanRepository;
}
```

### 5.3 REST API

- [ ] **HTTP methods**: Correct method for operation (GET/POST/PUT/DELETE)
- [ ] **Status codes**: Appropriate HTTP status codes returned
- [ ] **Request validation**: Input validated with Bean Validation
- [ ] **Response DTOs**: Using DTOs, not entities directly
- [ ] **Error responses**: Consistent error format (RFC 7807)

```java
// Good: Proper REST controller
@RestController
@RequestMapping("/api/v1/loans")
@RequiredArgsConstructor
@Validated
public class LoanController {

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LoanResponse createLoan(@Valid @RequestBody LoanRequest request) {
        return loanService.createLoan(request);
    }
}
```

### 5.4 Exception Handling

- [ ] **Custom exceptions**: Domain-specific exceptions defined
- [ ] **Exception hierarchy**: Proper exception class hierarchy
- [ ] **Logging**: Exceptions logged with appropriate level
- [ ] **No swallowing**: Exceptions not silently caught
- [ ] **Stack traces**: Not exposed to clients

```java
// Good: Custom exception with proper handling
public class LoanNotFoundException extends RuntimeException {
    public LoanNotFoundException(Long id) {
        super("Loan not found with id: " + id);
    }
}

@ExceptionHandler(LoanNotFoundException.class)
@ResponseStatus(HttpStatus.NOT_FOUND)
public ErrorResponse handleNotFound(LoanNotFoundException ex) {
    log.warn("Loan not found: {}", ex.getMessage());
    return ErrorResponse.of(HttpStatus.NOT_FOUND, ex.getMessage());
}
```

### 5.5 Logging

- [ ] **Appropriate levels**: DEBUG/INFO/WARN/ERROR used correctly
- [ ] **Structured logging**: Using SLF4J placeholders
- [ ] **Sensitive data**: NID, account numbers masked
- [ ] **Performance**: No expensive operations in log statements

```java
// Good: Structured logging with masking
log.info("Processing loan application: loanId={}, customerId={}",
    loanId, maskNid(customerId));

// Bad: String concatenation
log.info("Processing loan application: " + loanId);
```

### 5.6 JPA/Hibernate

- [ ] **Lazy loading**: Avoid N+1 queries, use fetch joins
- [ ] **Projections**: Use DTOs for read-only queries
- [ ] **Pagination**: Large result sets are paginated
- [ ] **Indexes**: Queries use indexed columns
- [ ] **Cascades**: Appropriate cascade types

```java
// Good: Fetch join to avoid N+1
@Query("SELECT l FROM Loan l JOIN FETCH l.customer WHERE l.status = :status")
List<Loan> findByStatusWithCustomer(@Param("status") LoanStatus status);
```

---

## 6. TypeScript/React Checklist

### 6.1 TypeScript Quality

- [ ] **Strict mode**: No `any` types without justification
- [ ] **Type definitions**: Proper interfaces/types defined
- [ ] **Null checks**: Optional chaining and nullish coalescing used
- [ ] **Enums/constants**: Magic values avoided
- [ ] **Generic types**: Used appropriately

```typescript
// Good: Proper typing
interface LoanApplication {
  id: string;
  customerId: string;
  amount: number;
  status: LoanStatus;
  createdAt: Date;
}

// Bad: Using any
const processLoan = (loan: any) => { ... }
```

### 6.2 React Best Practices

- [ ] **Functional components**: Using function components with hooks
- [ ] **Custom hooks**: Logic extracted to reusable hooks
- [ ] **Memoization**: useMemo/useCallback for expensive operations
- [ ] **Key props**: Proper keys for list items
- [ ] **Prop types**: Props have TypeScript interfaces
- [ ] **Children pattern**: Appropriate component composition

```tsx
// Good: Functional component with proper typing
interface LoanFormProps {
  initialData?: LoanFormData;
  onSubmit: (data: LoanFormData) => Promise<void>;
  isLoading?: boolean;
}

const LoanForm: React.FC<LoanFormProps> = ({
  initialData,
  onSubmit,
  isLoading = false
}) => {
  // ...
};
```

### 6.3 State Management

- [ ] **Redux slices**: Using createSlice from Redux Toolkit
- [ ] **RTK Query**: API calls through RTK Query
- [ ] **Selectors**: Memoized selectors for derived state
- [ ] **Normalization**: Complex state is normalized
- [ ] **Local vs global**: State is in appropriate scope

```typescript
// Good: RTK Query API
export const loanApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getLoan: builder.query<Loan, string>({
      query: (id) => `/loans/${id}`,
      providesTags: (result, error, id) => [{ type: 'Loan', id }],
    }),
    createLoan: builder.mutation<Loan, CreateLoanRequest>({
      query: (body) => ({
        url: '/loans',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Loan'],
    }),
  }),
});
```

### 6.4 Forms (React Hook Form + Zod)

- [ ] **Zod schemas**: Validation schemas defined
- [ ] **Error messages**: User-friendly error messages
- [ ] **Bengali messages**: Translations for error messages
- [ ] **Form state**: Loading/submitting states handled
- [ ] **Dirty checking**: Unsaved changes warning

```typescript
// Good: Zod schema with i18n
const loanSchema = z.object({
  amount: z.number()
    .min(10000, { message: 'loan.validation.minAmount' })
    .max(10000000, { message: 'loan.validation.maxAmount' }),
  purpose: z.string()
    .min(1, { message: 'loan.validation.purposeRequired' }),
});

type LoanFormData = z.infer<typeof loanSchema>;
```

### 6.5 Accessibility (a11y)

- [ ] **Semantic HTML**: Proper HTML elements used
- [ ] **ARIA labels**: Labels for interactive elements
- [ ] **Keyboard navigation**: All features accessible via keyboard
- [ ] **Focus management**: Focus handled for modals/dialogs
- [ ] **Color contrast**: Meets WCAG 2.1 AA requirements

### 6.6 Internationalization (i18n)

- [ ] **No hardcoded strings**: All UI text through i18n
- [ ] **Bengali translations**: Translation keys have Bengali values
- [ ] **Number formatting**: Uses locale-aware formatting
- [ ] **Date formatting**: Uses locale-aware dates
- [ ] **RTL support**: Layout supports both directions

```tsx
// Good: Using i18n
const { t } = useTranslation();
return <h1>{t('loan.form.title')}</h1>;

// Bad: Hardcoded string
return <h1>Loan Application Form</h1>;
```

---

## 7. Database/SQL Checklist

### 7.1 Migration Quality

- [ ] **Naming**: `V{version}__{description}.sql` (Flyway format)
- [ ] **Rollback**: Down migration provided
- [ ] **Idempotent**: Can run multiple times safely
- [ ] **Data preservation**: Existing data not lost
- [ ] **Performance**: Large table migrations are batched

### 7.2 Schema Design

- [ ] **Naming conventions**: Tables lowercase, plural, snake_case
- [ ] **Primary keys**: Consistent PK strategy (id or {table}_id)
- [ ] **Foreign keys**: Relationships properly defined
- [ ] **Indexes**: Appropriate indexes for queries
- [ ] **Constraints**: NOT NULL, UNIQUE, CHECK where needed

```sql
-- Good: Proper naming and constraints
CREATE TABLE loan_applications (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_loan_applications_customer_id ON loan_applications(customer_id);
CREATE INDEX idx_loan_applications_status ON loan_applications(status);
```

### 7.3 Query Performance

- [ ] **EXPLAIN ANALYZE**: Complex queries analyzed
- [ ] **Index usage**: Queries use available indexes
- [ ] **Pagination**: Large result sets paginated
- [ ] **N+1 queries**: No unintended N+1 patterns
- [ ] **Projections**: Select only needed columns

### 7.4 Data Security

- [ ] **Encryption**: Sensitive fields encrypted (NID, PAN)
- [ ] **Audit columns**: created_at, updated_at, created_by
- [ ] **Soft delete**: Consider is_deleted flag
- [ ] **Multi-tenant**: Schema isolation verified

---

## 8. Security Review Checklist

### 8.1 OWASP Top 10 Coverage

| Vulnerability | Check |
|---------------|-------|
| **A01: Broken Access Control** | - [ ] Authorization checks in place |
| | - [ ] RBAC enforced correctly |
| | - [ ] Direct object reference protected |
| **A02: Cryptographic Failures** | - [ ] Sensitive data encrypted |
| | - [ ] Strong encryption algorithms (AES-256) |
| | - [ ] No sensitive data in logs |
| **A03: Injection** | - [ ] Parameterized queries used |
| | - [ ] Input validation in place |
| | - [ ] No dynamic SQL construction |
| **A04: Insecure Design** | - [ ] Threat modeling considered |
| | - [ ] Defense in depth applied |
| **A05: Security Misconfiguration** | - [ ] Default credentials changed |
| | - [ ] Error messages don't leak info |
| | - [ ] Security headers configured |
| **A06: Vulnerable Components** | - [ ] Dependencies up to date |
| | - [ ] No known vulnerabilities |
| **A07: Auth Failures** | - [ ] Strong password policy |
| | - [ ] Session management secure |
| | - [ ] MFA implemented where needed |
| **A08: Software/Data Integrity** | - [ ] Input validation on all endpoints |
| | - [ ] Deserialization is safe |
| **A09: Logging Failures** | - [ ] Security events logged |
| | - [ ] Logs don't contain sensitive data |
| **A10: SSRF** | - [ ] URL validation for external calls |
| | - [ ] Whitelist allowed domains |

### 8.2 Authentication & Authorization

- [ ] **JWT validation**: Tokens validated properly
- [ ] **Role checks**: @PreAuthorize or equivalent used
- [ ] **Scope validation**: API scopes checked
- [ ] **Session timeout**: Appropriate timeout configured

```java
// Good: Proper authorization
@PreAuthorize("hasRole('CREDIT_ANALYST') and @permissionService.canViewLoan(#loanId)")
public LoanDetails getLoanDetails(Long loanId) {
    // ...
}
```

### 8.3 Data Protection

- [ ] **Field-level encryption**: NID, account numbers encrypted
- [ ] **Data masking**: Sensitive data masked in logs/UI
- [ ] **PII handling**: Personal data protected per regulations
- [ ] **GDPR/data retention**: Policies implemented

### 8.4 Bangladesh-Specific Security

- [ ] **ICT Security V4.0**: Guidelines compliance
- [ ] **Bangladesh Bank**: Data residency requirements
- [ ] **Audit trail**: Immutable audit logs for banking data

---

## 9. Performance Checklist

### 9.1 Backend Performance

- [ ] **Query optimization**: No N+1 queries
- [ ] **Caching**: Appropriate caching strategy
- [ ] **Async processing**: Long operations are async
- [ ] **Connection pooling**: Database connections pooled
- [ ] **Response time**: API responses < 500ms (p95)

### 9.2 Frontend Performance

- [ ] **Bundle size**: Code splitting implemented
- [ ] **Lazy loading**: Routes and components lazy loaded
- [ ] **Image optimization**: Images optimized and lazy loaded
- [ ] **Memoization**: Expensive renders memoized
- [ ] **Virtual scrolling**: Long lists virtualized

### 9.3 Database Performance

- [ ] **Index analysis**: Queries use indexes
- [ ] **Query plan**: EXPLAIN shows efficient plan
- [ ] **Pagination**: Large datasets paginated
- [ ] **Batch operations**: Bulk inserts/updates batched

---

## 10. Testing Checklist

### 10.1 Unit Tests

- [ ] **Coverage**: ≥ 80% code coverage
- [ ] **Edge cases**: Boundary conditions tested
- [ ] **Mocking**: Dependencies properly mocked
- [ ] **Naming**: Test names describe behavior
- [ ] **Isolation**: Tests are independent

```java
// Good: Descriptive test name
@Test
void createLoan_withValidData_shouldReturnCreatedLoan() {
    // Given
    LoanRequest request = createValidRequest();

    // When
    LoanResponse response = loanService.createLoan(request);

    // Then
    assertThat(response.getStatus()).isEqualTo(LoanStatus.DRAFT);
}
```

### 10.2 Integration Tests

- [ ] **API tests**: All endpoints have integration tests
- [ ] **Database tests**: Repository tests with Testcontainers
- [ ] **External services**: Mocked with WireMock
- [ ] **Authentication**: Security context set up

### 10.3 Frontend Tests

- [ ] **Component tests**: Key components have tests
- [ ] **Hook tests**: Custom hooks tested
- [ ] **User interactions**: User events tested
- [ ] **Accessibility tests**: a11y violations checked

```typescript
// Good: React Testing Library test
test('displays loan amount in correct format', () => {
  render(<LoanCard loan={mockLoan} />);

  expect(screen.getByText('৳ 5,00,000')).toBeInTheDocument();
});
```

---

## 11. ULMS-Specific Checklist

### 11.1 Bangladesh Banking Compliance

- [ ] **BRPD classification**: 7-stage classification logic correct
- [ ] **CIB integration**: CIB data handled per regulations
- [ ] **NID validation**: NID format validated (13 or 17 digits)
- [ ] **Interest calculation**: Bangladesh Bank formula used
- [ ] **Provisioning**: BRPD 15/2024 rates applied

### 11.2 Loan Module

- [ ] **Loan lifecycle**: States transition correctly
- [ ] **DPD calculation**: Days Past Due calculated accurately
- [ ] **EMI calculation**: EMI formula verified
- [ ] **Prepayment**: Early payment handled correctly
- [ ] **Charges**: Fees calculated per product config

### 11.3 Multi-Tenant

- [ ] **Tenant isolation**: Data isolated per bank schema
- [ ] **Tenant context**: TenantContext propagated correctly
- [ ] **Cross-tenant access**: No data leakage between tenants

### 11.4 Audit Trail

- [ ] **Audit logging**: All mutations logged
- [ ] **User tracking**: created_by, updated_by captured
- [ ] **Timestamps**: created_at, updated_at in UTC
- [ ] **Immutability**: Audit records not modifiable

---

## 12. Review Feedback Guidelines

### 12.1 Comment Types

| Prefix | Meaning | Action Required |
|--------|---------|-----------------|
| `[MUST]` | Blocking issue | Must be fixed |
| `[SHOULD]` | Strong recommendation | Should be addressed |
| `[NIT]` | Minor suggestion | Optional |
| `[QUESTION]` | Clarification needed | Response required |
| `[PRAISE]` | Positive feedback | None |

### 12.2 Examples of Good Feedback

```markdown
# Blocking issue
[MUST] This SQL query is vulnerable to injection. Please use parameterized
queries instead:
```java
// Instead of:
String sql = "SELECT * FROM loans WHERE id = " + id;
// Use:
jdbcTemplate.query("SELECT * FROM loans WHERE id = ?", id);
```

# Strong recommendation
[SHOULD] Consider extracting this logic into a separate method for
better testability. The current method is 60 lines which exceeds our
50-line guideline.

# Minor suggestion
[NIT] This variable name `x` could be more descriptive. Perhaps `loanAmount`?

# Question
[QUESTION] I see we're caching CIB responses for 1 hour. Is this aligned
with Bangladesh Bank requirements for data freshness?

# Praise
[PRAISE] Great job on the test coverage! The edge cases for interest
calculation are thorough.
```

### 12.3 Avoiding Negative Patterns

| Don't | Do |
|-------|-----|
| "This is wrong" | "Consider using X because Y" |
| "Why did you do this?" | "Could you explain the reasoning for X?" |
| "This is obvious" | "For clarity, we might want to add a comment" |
| "Just change it" | "I suggest changing X to Y because Z" |
| Leave only negative comments | Balance with positive observations |

---

## 13. Approval Matrix

### 13.1 By Change Type

| Change Type | Min Reviewers | Required Approvers |
|-------------|---------------|-------------------|
| Bug fix (minor) | 1 | 1 (any developer) |
| Bug fix (critical) | 2 | Tech Lead |
| Feature (small) | 1 | 1 (any developer) |
| Feature (medium) | 2 | 1 (Tech Lead aware) |
| Feature (large) | 2 | Tech Lead |
| Refactoring | 1 | 1 (any developer) |
| Database migration | 2 | Tech Lead + BA |
| Security-related | 2 | Tech Lead + Security |
| Release branch | All team | Tech Lead + PM |
| Hotfix | 1 | Tech Lead |

### 13.2 By Module Ownership

| Module | Primary Reviewer | Secondary Reviewer |
|--------|------------------|-------------------|
| Fineract Core | Tech Lead | Dev 2 |
| CIB Service | Tech Lead | Dev 2 |
| NID Service | Dev 2 | Tech Lead |
| React Frontend | Dev 1 | Tech Lead |
| Mobile App | Dev 2 | Dev 1 |
| Database | Tech Lead | BA (business logic) |
| Infrastructure | Tech Lead | Dev 2 |

### 13.3 Escalation

| Situation | Action |
|-----------|--------|
| Reviewer unavailable > 24h | Reassign to backup |
| Disagreement on approach | Tech Lead makes final call |
| Urgent hotfix | Tech Lead can merge with 1 approval |
| Large MR blocked | Split MR or schedule meeting |

---

## Appendix A: Code Review Checklist Template

```markdown
## Code Review Checklist - MR #XXX

### General
- [ ] Code is readable and well-organized
- [ ] No hardcoded values or magic numbers
- [ ] No debug code or console.log statements
- [ ] Comments are meaningful (not obvious)
- [ ] No sensitive data in code

### Correctness
- [ ] Logic matches requirements
- [ ] Edge cases handled
- [ ] Error handling appropriate
- [ ] Null safety checked

### Testing
- [ ] Unit tests added/updated
- [ ] Tests pass locally
- [ ] Coverage meets threshold (≥80%)

### Security
- [ ] Input validation in place
- [ ] Authorization checks present
- [ ] No injection vulnerabilities
- [ ] Sensitive data encrypted/masked

### Performance
- [ ] No obvious performance issues
- [ ] Queries optimized
- [ ] Appropriate caching

### Documentation
- [ ] Public APIs documented
- [ ] README updated if needed

### ULMS-Specific
- [ ] Bangladesh compliance considered
- [ ] Audit logging in place
- [ ] Multi-tenant isolation maintained

### Reviewer Notes
<!-- Add your specific observations here -->
```

---

## Appendix B: Quick Reference

### Review Commands

```bash
# Checkout MR locally
git fetch origin merge-requests/123/head:mr-123
git checkout mr-123

# View changes
git diff develop...mr-123

# Run tests
./gradlew test
npm test
```

### GitLab MR Shortcuts

| Action | Shortcut |
|--------|----------|
| Go to file | `t` |
| Next/prev file | `]` / `[` |
| Show file tree | `f` |
| Show diff | `d` |
| Add comment | `c` |

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Technical Lead | | | |
| Project Manager | | | |

---

**Document End**

*ULMS v2.0 - Code Review Guidelines & Checklist v1.0*

*Unisoft Systems Limited - Confidential*

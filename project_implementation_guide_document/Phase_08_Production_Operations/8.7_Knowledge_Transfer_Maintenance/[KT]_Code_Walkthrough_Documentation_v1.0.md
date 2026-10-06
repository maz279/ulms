# Code Walkthrough Documentation

## ULMS v2.0 - Module-by-Module Code Review

---

**Document Control**

| Field | Value |
|-------|-------|
| Document ID | ULMS-KT-CWD-006 |
| Version | 1.0 |
| Status | Final |
| Classification | Internal - Technical |
| Effective Date | February 2026 |
| Review Cycle | Per Release |
| Owner | Technical Lead |
| Approver | CTO |

---

## Module 1: Authentication & Authorization

### Files
- `AuthController.java`
- `JwtTokenProvider.java`
- `SecurityConfig.java`

### Walkthrough
1. Login request arrives at AuthController
2. Credentials validated against Keycloak
3. JWT token generated with claims
4. Token returned to client
5. Subsequent requests include token in header
6. JwtTokenProvider validates token
7. Security context established

### Key Points
- Tokens expire after 30 minutes
- Refresh tokens valid for 7 days
- Roles mapped from Keycloak

---

## Module 2: Loan Processing

### Files
- `LoanController.java`
- `LoanServiceImpl.java`
- `LoanRepository.java`

### Walkthrough
1. POST /api/v1/loans creates new loan
2. Request validated by @Valid
3. Service layer applies business rules
4. Entity saved via Repository
5. Domain event published
6. Response mapped via MapStruct

### Key Points
- All loan changes audited
- Workflow triggered on submission
- CIB checked asynchronously

---

## Module 3: Classification Engine

### Files
- `LoanClassificationService.java`
- `ClassificationRuleEngine.java`

### Walkthrough
1. Scheduled job triggers daily at 2 AM
2. All active loans retrieved
3. DPD calculated for each loan
4. Rules applied sequentially
5. Classification updated if changed
6. History recorded

### Key Points
- BRPD 15/2024 compliant
- Backdated classifications prevented
- Audit trail maintained

---

**Document Control Footer**

*Classification: Internal - Technical*
*Next Review: Per Release*
*Owner: Technical Lead*

**END OF DOCUMENT**

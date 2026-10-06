# Definition of Done Checklist

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ULMS-DEV-0.3.7 |
| **Document Title** | Definition of Done Checklist |
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
2. [Definition of Done - User Story](#2-definition-of-done---user-story)
3. [Definition of Done - Task](#3-definition-of-done---task)
4. [Definition of Done - Bug Fix](#4-definition-of-done---bug-fix)
5. [Definition of Done - Sprint](#5-definition-of-done---sprint)
6. [Definition of Done - Release](#6-definition-of-done---release)
7. [Module-Specific DoD](#7-module-specific-dod)
8. [ULMS Compliance DoD](#8-ulms-compliance-dod)
9. [DoD Verification Process](#9-dod-verification-process)

---

## 1. Introduction

### 1.1 Purpose

The Definition of Done (DoD) is a clear, shared understanding of what it means for work to be complete. It ensures consistent quality across all deliverables and prevents incomplete work from being marked as finished.

### 1.2 Scope

This DoD applies to all work items in the ULMS v2.0 project:
- User Stories
- Technical Tasks
- Bug Fixes
- Sprints
- Releases

### 1.3 Principles

1. **Complete means complete**: No partial completion
2. **Quality is non-negotiable**: Standards must be met
3. **Transparency**: Everyone understands and follows DoD
4. **Continuous improvement**: DoD evolves with project needs

---

## 2. Definition of Done - User Story

### 2.1 Code Complete Checklist

| # | Criterion | Required | Verification |
|---|-----------|----------|--------------|
| 1 | All acceptance criteria implemented | Yes | Product review |
| 2 | Code follows coding standards | Yes | Code review |
| 3 | No hardcoded values or credentials | Yes | Code review |
| 4 | Code is properly commented | Yes | Code review |
| 5 | No TODO comments without ticket reference | Yes | Code review |
| 6 | Feature flag implemented (if applicable) | Conditional | Code review |

### 2.2 Testing Checklist

| # | Criterion | Required | Verification |
|---|-----------|----------|--------------|
| 1 | Unit tests written | Yes | CI pipeline |
| 2 | Unit test coverage ≥ 80% | Yes | SonarQube |
| 3 | Integration tests written | Yes | CI pipeline |
| 4 | All existing tests pass | Yes | CI pipeline |
| 5 | Manual testing completed | Yes | Developer sign-off |
| 6 | Edge cases tested | Yes | Test review |
| 7 | E2E tests updated (if UI change) | Conditional | CI pipeline |

### 2.3 Code Review Checklist

| # | Criterion | Required | Verification |
|---|-----------|----------|--------------|
| 1 | Merge request created | Yes | GitLab |
| 2 | MR template filled completely | Yes | MR review |
| 3 | Code reviewed by at least 1 developer | Yes | MR approval |
| 4 | All review comments addressed | Yes | MR threads |
| 5 | SonarQube quality gate passed | Yes | CI pipeline |
| 6 | No critical/blocker issues | Yes | SonarQube |

### 2.4 Documentation Checklist

| # | Criterion | Required | Verification |
|---|-----------|----------|--------------|
| 1 | API documentation updated (OpenAPI) | Conditional | Swagger UI |
| 2 | README updated (if setup changes) | Conditional | File review |
| 3 | User-facing help text added | Conditional | UI review |
| 4 | Release notes entry drafted | Yes | Release doc |

### 2.5 Security Checklist

| # | Criterion | Required | Verification |
|---|-----------|----------|--------------|
| 1 | Input validation implemented | Yes | Code review |
| 2 | Authorization checks in place | Yes | Code review |
| 3 | Sensitive data encrypted/masked | Yes | Code review |
| 4 | Security scan passed | Yes | CI pipeline |
| 5 | No OWASP Top 10 vulnerabilities | Yes | Security review |

### 2.6 Performance Checklist

| # | Criterion | Required | Verification |
|---|-----------|----------|--------------|
| 1 | API response time < 500ms (p95) | Yes | Performance test |
| 2 | No N+1 database queries | Yes | Code review |
| 3 | Pagination implemented for lists | Conditional | Code review |
| 4 | Caching implemented where appropriate | Conditional | Code review |

### 2.7 Accessibility & i18n Checklist

| # | Criterion | Required | Verification |
|---|-----------|----------|--------------|
| 1 | UI text uses i18n (no hardcoded strings) | Yes | Code review |
| 2 | Bengali translation added | Yes | Translation review |
| 3 | WCAG 2.1 AA compliance verified | Yes | a11y audit |
| 4 | Keyboard navigation works | Yes | Manual testing |
| 5 | Screen reader compatible | Yes | a11y audit |

### 2.8 Deployment Checklist

| # | Criterion | Required | Verification |
|---|-----------|----------|--------------|
| 1 | CI pipeline passes | Yes | GitLab CI |
| 2 | Deployed to DEV environment | Yes | Deployment log |
| 3 | Smoke tests pass on DEV | Yes | Test results |
| 4 | Database migrations tested | Conditional | Migration log |

### 2.9 Acceptance Checklist

| # | Criterion | Required | Verification |
|---|-----------|----------|--------------|
| 1 | Demo to Product Owner (BA) | Yes | Meeting notes |
| 2 | Acceptance criteria verified | Yes | BA sign-off |
| 3 | Story moved to Done in board | Yes | GitLab board |

---

## 3. Definition of Done - Task

### 3.1 Technical Task DoD

| # | Criterion | Required |
|---|-----------|----------|
| 1 | Task objective achieved | Yes |
| 2 | Code follows standards | Yes |
| 3 | Unit tests written (if applicable) | Conditional |
| 4 | Code reviewed | Yes |
| 5 | Documentation updated (if applicable) | Conditional |
| 6 | Merged to develop branch | Yes |

### 3.2 Research Task DoD

| # | Criterion | Required |
|---|-----------|----------|
| 1 | Research question answered | Yes |
| 2 | Findings documented | Yes |
| 3 | Recommendations provided | Yes |
| 4 | Knowledge shared with team | Yes |
| 5 | Decision logged (if applicable) | Conditional |

### 3.3 Configuration Task DoD

| # | Criterion | Required |
|---|-----------|----------|
| 1 | Configuration implemented | Yes |
| 2 | Configuration documented | Yes |
| 3 | Tested in DEV environment | Yes |
| 4 | Peer reviewed | Yes |
| 5 | No secrets in code repository | Yes |

---

## 4. Definition of Done - Bug Fix

### 4.1 Bug Fix DoD

| # | Criterion | Required | Verification |
|---|-----------|----------|--------------|
| 1 | Root cause identified | Yes | Bug analysis |
| 2 | Fix implemented | Yes | Code review |
| 3 | Regression test added | Yes | Test suite |
| 4 | Original issue verified fixed | Yes | Manual testing |
| 5 | No new issues introduced | Yes | Regression testing |
| 6 | Code reviewed | Yes | MR approval |
| 7 | All tests pass | Yes | CI pipeline |
| 8 | Deployed to DEV | Yes | Deployment log |
| 9 | Bug ticket updated with details | Yes | GitLab issue |

### 4.2 Critical Bug Fix DoD (Hotfix)

| # | Criterion | Required | Verification |
|---|-----------|----------|--------------|
| 1 | Root cause identified | Yes | Bug analysis |
| 2 | Fix implemented | Yes | Code review |
| 3 | Regression test added | Yes | Test suite |
| 4 | Tech Lead approved | Yes | MR approval |
| 5 | Deployed to STAGING | Yes | Deployment log |
| 6 | Smoke tests pass | Yes | Test results |
| 7 | Deployed to PRODUCTION | Yes | Deployment log |
| 8 | Production verified | Yes | Monitoring |
| 9 | Post-mortem scheduled (if P1) | Conditional | Calendar |

---

## 5. Definition of Done - Sprint

### 5.1 Sprint Completion Criteria

| # | Criterion | Required | Verification |
|---|-----------|----------|--------------|
| 1 | All committed stories meet DoD | Yes | Story review |
| 2 | Sprint goal achieved | Yes | Sprint review |
| 3 | All critical bugs fixed | Yes | Bug tracker |
| 4 | Code merged to develop branch | Yes | Git log |
| 5 | DEV environment stable | Yes | Health check |
| 6 | Sprint demo conducted | Yes | Meeting |
| 7 | Sprint retrospective conducted | Yes | Meeting |
| 8 | Sprint metrics recorded | Yes | Dashboard |

### 5.2 Sprint Metrics

| Metric | Target | Calculation |
|--------|--------|-------------|
| Velocity | Baseline + 5% | Story points completed |
| Commitment Rate | ≥ 90% | Completed / Committed |
| Bug Escape Rate | < 5% | Bugs found post-sprint |
| Code Coverage | ≥ 80% | SonarQube |
| Technical Debt | Decreasing | SonarQube |

### 5.3 Sprint Deliverables

| Deliverable | Owner | Due |
|-------------|-------|-----|
| Working increment on DEV | Lead Dev | Sprint end |
| Updated documentation | All devs | Sprint end |
| Sprint demo recording | PM | Sprint end + 1 day |
| Sprint report | PM | Sprint end + 1 day |
| Retrospective action items | PM | Sprint end |

---

## 6. Definition of Done - Release

### 6.1 Release Readiness Checklist

#### Code Quality

| # | Criterion | Required | Owner |
|---|-----------|----------|-------|
| 1 | All planned features complete | Yes | PM |
| 2 | All critical/high bugs fixed | Yes | Lead Dev |
| 3 | Code coverage ≥ 80% | Yes | Lead Dev |
| 4 | SonarQube quality gate passed | Yes | Lead Dev |
| 5 | No critical security vulnerabilities | Yes | Lead Dev |
| 6 | Technical debt within threshold | Yes | Lead Dev |

#### Testing

| # | Criterion | Required | Owner |
|---|-----------|----------|-------|
| 1 | All unit tests pass | Yes | All devs |
| 2 | All integration tests pass | Yes | Lead Dev |
| 3 | E2E test suite passes | Yes | Dev 1 |
| 4 | Performance testing completed | Yes | Lead Dev |
| 5 | Security testing completed | Yes | Lead Dev |
| 6 | UAT completed and signed off | Yes | BA |
| 7 | Regression testing completed | Yes | QA |

#### Documentation

| # | Criterion | Required | Owner |
|---|-----------|----------|-------|
| 1 | Release notes finalized | Yes | PM |
| 2 | API documentation current | Yes | Lead Dev |
| 3 | User documentation updated | Yes | BA |
| 4 | Operations runbook updated | Yes | Lead Dev |
| 5 | Database migration scripts documented | Yes | Lead Dev |

#### Deployment

| # | Criterion | Required | Owner |
|---|-----------|----------|-------|
| 1 | Deployment runbook tested | Yes | Lead Dev |
| 2 | Rollback procedure tested | Yes | Lead Dev |
| 3 | Database backup verified | Yes | Lead Dev |
| 4 | Environment configuration verified | Yes | Lead Dev |
| 5 | Monitoring and alerts configured | Yes | Lead Dev |

#### Compliance (ULMS-Specific)

| # | Criterion | Required | Owner |
|---|-----------|----------|-------|
| 1 | BRPD compliance verified | Yes | BA |
| 2 | CIB integration tested | Yes | Lead Dev |
| 3 | NID integration tested | Yes | Dev 2 |
| 4 | Audit trail functional | Yes | Lead Dev |
| 5 | Multi-tenant isolation verified | Yes | Lead Dev |
| 6 | ICT Security V4.0 compliance | Yes | Lead Dev |

#### Approvals

| # | Criterion | Required | Owner |
|---|-----------|----------|-------|
| 1 | QA sign-off | Yes | QA Lead |
| 2 | BA/Product Owner sign-off | Yes | BA |
| 3 | Technical Lead sign-off | Yes | Lead Dev |
| 4 | Project Manager sign-off | Yes | PM |
| 5 | Client sign-off (for production) | Yes | Client PM |

### 6.2 Release Artifacts

| Artifact | Format | Location |
|----------|--------|----------|
| Release notes | Markdown | GitLab Release |
| Docker images | Tagged containers | Container registry |
| Helm charts | Versioned charts | Helm repository |
| Database migrations | SQL files | Migration folder |
| API documentation | OpenAPI 3.0 | Swagger UI |
| User documentation | PDF/HTML | Docs portal |

### 6.3 Post-Release Verification

| # | Check | Timeline | Owner |
|---|-------|----------|-------|
| 1 | Health checks pass | Immediate | Lead Dev |
| 2 | Smoke tests pass | < 30 min | QA |
| 3 | Key user workflows verified | < 1 hour | BA |
| 4 | Monitoring shows normal metrics | < 2 hours | Lead Dev |
| 5 | No error spikes in logs | < 4 hours | Lead Dev |
| 6 | User feedback collected | < 24 hours | PM |

---

## 7. Module-Specific DoD

### 7.1 Backend (Java/Spring Boot) DoD

| # | Criterion | Required |
|---|-----------|----------|
| 1 | Follows Java coding standards | Yes |
| 2 | Uses constructor injection | Yes |
| 3 | @Transactional boundaries correct | Yes |
| 4 | Exception handling complete | Yes |
| 5 | Logging with proper levels | Yes |
| 6 | Sensitive data masked in logs | Yes |
| 7 | API versioned (/api/v1/) | Yes |
| 8 | OpenAPI annotations complete | Yes |

### 7.2 Frontend (React/TypeScript) DoD

| # | Criterion | Required |
|---|-----------|----------|
| 1 | Follows TypeScript strict mode | Yes |
| 2 | No `any` types without justification | Yes |
| 3 | Components use proper typing | Yes |
| 4 | i18n keys for all UI text | Yes |
| 5 | Bengali translations provided | Yes |
| 6 | WCAG 2.1 AA accessibility | Yes |
| 7 | Responsive design verified | Yes |
| 8 | Form validation with Zod | Yes |

### 7.3 Mobile (React Native) DoD

| # | Criterion | Required |
|---|-----------|----------|
| 1 | Offline functionality works | Yes |
| 2 | Data syncs when online | Yes |
| 3 | GPS capture functional | Yes |
| 4 | Camera integration works | Yes |
| 5 | Works on Android 8+ | Yes |
| 6 | Battery usage optimized | Yes |
| 7 | App size reasonable (< 50MB) | Yes |

### 7.4 Database Migration DoD

| # | Criterion | Required |
|---|-----------|----------|
| 1 | Migration script follows naming convention | Yes |
| 2 | Rollback script provided | Yes |
| 3 | Tested on fresh database | Yes |
| 4 | Tested with existing data | Yes |
| 5 | Performance impact assessed | Yes |
| 6 | Data preservation verified | Yes |
| 7 | Multi-tenant compatible | Yes |

### 7.5 API Endpoint DoD

| # | Criterion | Required |
|---|-----------|----------|
| 1 | Follows REST conventions | Yes |
| 2 | Proper HTTP status codes | Yes |
| 3 | Request validation implemented | Yes |
| 4 | Error responses follow RFC 7807 | Yes |
| 5 | Authorization enforced | Yes |
| 6 | Rate limiting configured | Yes |
| 7 | OpenAPI spec updated | Yes |
| 8 | Postman collection updated | Yes |

---

## 8. ULMS Compliance DoD

### 8.1 Bangladesh Bank Compliance

| # | Criterion | Required | Regulation |
|---|-----------|----------|------------|
| 1 | BRPD 15/2024 classification logic | Yes | BRPD Circular |
| 2 | 7-stage loan classification | Yes | BRPD Circular |
| 3 | DPD calculation accurate | Yes | BRPD Circular |
| 4 | Provision rates applied correctly | Yes | BRPD Circular |
| 5 | CIB data format compliant | Yes | Bangladesh Bank |
| 6 | NID validation (13/17 digits) | Yes | NIDW |
| 7 | Interest calculation verified | Yes | Bangladesh Bank |
| 8 | Bengali language support | Yes | Local requirements |

### 8.2 Security Compliance

| # | Criterion | Required | Standard |
|---|-----------|----------|----------|
| 1 | AES-256 encryption for sensitive data | Yes | ICT V4.0 |
| 2 | TLS 1.3 for data in transit | Yes | ICT V4.0 |
| 3 | MFA for administrative functions | Yes | ICT V4.0 |
| 4 | Session timeout (30 min) | Yes | ICT V4.0 |
| 5 | Audit trail immutable | Yes | ICT V4.0 |
| 6 | Password policy enforced | Yes | ICT V4.0 |
| 7 | Data masking for PII | Yes | ICT V4.0 |

### 8.3 Multi-Tenant Compliance

| # | Criterion | Required |
|---|-----------|----------|
| 1 | Data isolated per tenant schema | Yes |
| 2 | No cross-tenant data access | Yes |
| 3 | Tenant context verified in all queries | Yes |
| 4 | Tenant-specific configuration | Yes |
| 5 | Tenant switching prevented for users | Yes |

### 8.4 Audit Trail Compliance

| # | Criterion | Required |
|---|-----------|----------|
| 1 | All data mutations logged | Yes |
| 2 | User ID captured | Yes |
| 3 | Timestamp in UTC | Yes |
| 4 | Before/after values captured | Yes |
| 5 | Audit records immutable | Yes |
| 6 | 10-year retention configured | Yes |

---

## 9. DoD Verification Process

### 9.1 Self-Verification (Developer)

Before requesting review:

```markdown
## Pre-Review Self-Check

I have verified the following:

### Code
- [ ] Code follows project standards
- [ ] No console.log/debug statements
- [ ] No hardcoded values
- [ ] No TODO without ticket reference

### Testing
- [ ] Unit tests written and passing
- [ ] Coverage meets threshold
- [ ] Manual testing completed

### Documentation
- [ ] API docs updated (if applicable)
- [ ] Code comments added where needed

### Security
- [ ] Input validation in place
- [ ] Authorization checks present
- [ ] No sensitive data exposed
```

### 9.2 Code Review Verification (Reviewer)

During code review:

```markdown
## Code Review DoD Verification

### Code Quality
- [ ] Follows coding standards
- [ ] Readable and maintainable
- [ ] No obvious bugs

### Testing
- [ ] Tests cover main scenarios
- [ ] Edge cases tested
- [ ] Coverage acceptable

### Security
- [ ] No security vulnerabilities
- [ ] Authorization correct

### Performance
- [ ] No obvious performance issues
- [ ] Queries optimized
```

### 9.3 Sprint Review Verification (PM)

During sprint review:

```markdown
## Sprint DoD Verification

### Completed Stories
| Story | DoD Met | Notes |
|-------|---------|-------|
| ULMS-101 | ✅ Yes | |
| ULMS-102 | ✅ Yes | |
| ULMS-103 | ⚠️ Partial | Missing Bengali translation |

### Sprint Metrics
- Velocity: XX points
- Commitment: XX%
- Code Coverage: XX%

### Outstanding Items
- [ ] Item 1 - Carry to next sprint
```

### 9.4 Release Verification (Lead Dev)

Before release:

```markdown
## Release DoD Verification Checklist

### Code Quality
- [ ] All features complete
- [ ] All critical bugs fixed
- [ ] SonarQube gate passed
- [ ] Security scan passed

### Testing
- [ ] Unit tests: PASS
- [ ] Integration tests: PASS
- [ ] E2E tests: PASS
- [ ] Performance tests: PASS
- [ ] UAT: SIGNED OFF

### Documentation
- [ ] Release notes complete
- [ ] API docs current
- [ ] User docs updated

### Deployment
- [ ] Staging deployment successful
- [ ] Rollback tested
- [ ] Monitoring configured

### Compliance
- [ ] BRPD compliance verified
- [ ] Security compliance verified
- [ ] Audit trail functional

### Approvals
- [ ] QA Lead: _______________
- [ ] BA: _______________
- [ ] Tech Lead: _______________
- [ ] PM: _______________
```

---

## Appendix A: DoD Quick Reference Card

### User Story - Must Have

1. ✅ Acceptance criteria met
2. ✅ Code reviewed and approved
3. ✅ Unit tests ≥ 80% coverage
4. ✅ All tests pass
5. ✅ SonarQube gate passed
6. ✅ Bengali translation complete
7. ✅ Deployed to DEV
8. ✅ BA/PO accepted

### Bug Fix - Must Have

1. ✅ Root cause identified
2. ✅ Fix implemented
3. ✅ Regression test added
4. ✅ Code reviewed
5. ✅ All tests pass
6. ✅ Deployed to DEV

### Release - Must Have

1. ✅ All features complete
2. ✅ All critical bugs fixed
3. ✅ Coverage ≥ 80%
4. ✅ UAT signed off
5. ✅ Documentation current
6. ✅ Compliance verified
7. ✅ All approvals obtained

---

## Appendix B: DoD Exceptions Process

### Exception Request

When DoD cannot be fully met:

1. Document the exception and reason
2. Assess risk and impact
3. Get Tech Lead approval for technical items
4. Get PM approval for process items
5. Create ticket to address debt
6. Track in technical debt register

### Exception Template

```markdown
## DoD Exception Request

**Story/Task**: ULMS-XXX
**DoD Item**: [Which criterion]
**Reason**: [Why it cannot be met]
**Risk Assessment**: [Low/Medium/High]
**Mitigation**: [How we'll manage the risk]
**Resolution Plan**: [When and how it will be addressed]
**Approved By**: [Name, Date]
```

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Technical Lead | | | |
| Project Manager | | | |

---

**Document End**

*ULMS v2.0 - Definition of Done Checklist v1.0*

*Unisoft Systems Limited - Confidential*

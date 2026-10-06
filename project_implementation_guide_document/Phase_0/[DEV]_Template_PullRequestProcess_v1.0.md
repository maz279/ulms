# Pull Request Template & Process

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ULMS-DEV-0.3.6 |
| **Document Title** | Pull Request Template & Process |
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
2. [PR Lifecycle](#2-pr-lifecycle)
3. [PR Template](#3-pr-template)
4. [PR Title Conventions](#4-pr-title-conventions)
5. [PR Description Guidelines](#5-pr-description-guidelines)
6. [Review Assignment](#6-review-assignment)
7. [Merge Requirements](#7-merge-requirements)
8. [Post-Merge Actions](#8-post-merge-actions)
9. [Special PR Types](#9-special-pr-types)

---

## 1. Introduction

### 1.1 Purpose

This document defines the Pull Request (PR) / Merge Request (MR) process for ULMS v2.0 development. A well-structured PR process ensures code quality, knowledge sharing, and maintainable history.

### 1.2 Terminology

| Term | Platform | Usage |
|------|----------|-------|
| Pull Request (PR) | GitHub | Request to merge changes |
| Merge Request (MR) | GitLab | Same as PR |
| Code Review | Both | Review of code changes |
| Approval | Both | Sign-off from reviewer |

### 1.3 Scope

All code changes to protected branches (`develop`, `main`, `release/*`) must go through the PR process:
- Feature development
- Bug fixes
- Refactoring
- Documentation updates
- Configuration changes

---

## 2. PR Lifecycle

### 2.1 Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      PR LIFECYCLE                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. CREATE BRANCH                                               │
│     └── git checkout -b feature/ULMS-XXX-description            │
│                                                                  │
│  2. DEVELOP & COMMIT                                            │
│     └── Make changes, commit frequently                         │
│     └── Self-review before pushing                              │
│                                                                  │
│  3. PUSH & CREATE PR                                            │
│     └── Push to remote                                          │
│     └── Create PR using template                                │
│     └── Fill all required sections                              │
│     └── Assign reviewers                                        │
│                                                                  │
│  4. AUTOMATED CHECKS                                            │
│     └── CI Pipeline runs                                        │
│     └── Build, tests, lint, coverage                           │
│     └── SonarQube analysis                                     │
│                                                                  │
│  5. CODE REVIEW                                                 │
│     └── Reviewers examine code                                  │
│     └── Leave comments/suggestions                              │
│     └── Request changes if needed                               │
│                                                                  │
│  6. ADDRESS FEEDBACK                                            │
│     └── Author updates code                                     │
│     └── Push new commits                                        │
│     └── Resolve discussions                                     │
│                                                                  │
│  7. APPROVAL                                                    │
│     └── Required approvals obtained                            │
│     └── All checks pass                                        │
│                                                                  │
│  8. MERGE                                                       │
│     └── Squash and merge (features)                            │
│     └── Delete source branch                                   │
│                                                                  │
│  9. POST-MERGE                                                  │
│     └── Verify deployment                                      │
│     └── Update related tickets                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Timing Guidelines

| Stage | Target Duration |
|-------|-----------------|
| PR Creation | Same day as code completion |
| Initial Review | < 24 hours |
| Address Feedback | < 4 hours |
| Follow-up Review | < 4 hours |
| Total PR Lifecycle | < 48 hours (small), < 72 hours (medium) |

---

## 3. PR Template

### 3.1 GitLab MR Template

Create file at `.gitlab/merge_request_templates/Default.md`:

```markdown
## Description
<!--
Provide a clear and concise description of the changes.
Explain the problem being solved and the approach taken.
-->

### What does this PR do?


### Why is this change needed?


## Related Issue
<!-- Link to the GitLab issue. Use "Closes" to auto-close on merge -->
Closes ULMS-XXX

## Type of Change
<!-- Check all that apply -->
- [ ] Feature (new functionality)
- [ ] Bug fix (fixes an issue)
- [ ] Refactoring (no functional changes)
- [ ] Documentation (docs only)
- [ ] Configuration (config/infra changes)
- [ ] Test (adding/updating tests)
- [ ] Hotfix (critical production fix)

## Changes Made
<!-- List the key changes made in this PR -->
-
-
-

## Testing Done
<!-- Describe the testing performed -->
### Unit Tests
- [ ] New unit tests added
- [ ] All unit tests pass
- [ ] Coverage meets threshold (≥80%)

### Integration Tests
- [ ] Integration tests added/updated
- [ ] All integration tests pass

### Manual Testing
- [ ] Tested locally
- [ ] Tested on DEV environment
- [ ] Tested specific scenarios:

## Screenshots (if applicable)
<!-- Add screenshots for UI changes -->
| Before | After |
|--------|-------|
| screenshot | screenshot |

## Database Changes
<!-- Check if applicable -->
- [ ] No database changes
- [ ] Migration script included
- [ ] Rollback script included
- [ ] Data migration tested

## Checklist
<!-- Ensure all items are checked before requesting review -->
### Code Quality
- [ ] Code follows project coding standards
- [ ] No hardcoded values or magic numbers
- [ ] No debug code (console.log, print statements)
- [ ] Comments added for complex logic
- [ ] No TODO without ticket reference

### Security
- [ ] No sensitive data in code
- [ ] Input validation implemented
- [ ] Authorization checks in place
- [ ] No new security vulnerabilities introduced

### Documentation
- [ ] README updated (if needed)
- [ ] API documentation updated (if applicable)
- [ ] Code comments added where necessary

### i18n (Frontend)
- [ ] No hardcoded UI strings
- [ ] Bengali translations added
- [ ] Translation keys follow naming convention

### Definition of Done
- [ ] All acceptance criteria met
- [ ] PR is focused and appropriately sized
- [ ] Branch is up-to-date with target

## Deployment Notes
<!-- Any special deployment considerations -->


## Reviewer Notes
<!-- Any specific areas you'd like reviewers to focus on -->


---
<!-- Do not edit below this line -->
/label ~"needs review"
```

### 3.2 Feature PR Template

For feature PRs, create `.gitlab/merge_request_templates/Feature.md`:

```markdown
## Feature: [Feature Name]

### Description
<!-- Describe the feature being implemented -->

### User Story
As a [role], I want [capability] so that [benefit].

### Acceptance Criteria
<!-- List acceptance criteria from the ticket -->
- [ ] AC1:
- [ ] AC2:
- [ ] AC3:

### Technical Approach
<!-- Describe the technical implementation -->

### Changes Made
#### Backend
-

#### Frontend
-

#### Database
-

### API Changes
<!-- Document any API changes -->
| Endpoint | Method | Change |
|----------|--------|--------|
| | | |

### Testing
- [ ] Unit tests added (coverage: %)
- [ ] Integration tests added
- [ ] E2E tests added (if UI change)
- [ ] Manual testing completed

### Screenshots
| Before | After |
|--------|-------|
| | |

### Definition of Done
- [ ] Acceptance criteria verified
- [ ] Code reviewed and approved
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Bengali translations added (if UI)
- [ ] Deployed to DEV

/label ~feature ~"needs review"
```

### 3.3 Bug Fix PR Template

Create `.gitlab/merge_request_templates/BugFix.md`:

```markdown
## Bug Fix: [Brief Description]

### Issue
Fixes ULMS-XXX

### Root Cause Analysis
<!-- Describe the root cause of the bug -->

### Solution
<!-- Describe the fix implemented -->

### Changes Made
-

### Regression Test
<!-- Describe the regression test added -->
```
// Test case added:
```

### Testing
- [ ] Root cause verified
- [ ] Fix verified locally
- [ ] Regression test added
- [ ] All tests pass
- [ ] No new issues introduced

### Affected Areas
<!-- List areas potentially affected by this change -->
-

/label ~bug ~"needs review"
```

---

## 4. PR Title Conventions

### 4.1 Title Format

```
[TYPE] ULMS-XXX: Brief description of change
```

### 4.2 Type Prefixes

| Prefix | Usage | Example |
|--------|-------|---------|
| `[FEAT]` | New feature | `[FEAT] ULMS-101: Add loan application form` |
| `[FIX]` | Bug fix | `[FIX] ULMS-201: Fix validation error on amount field` |
| `[REFACTOR]` | Code refactoring | `[REFACTOR] ULMS-301: Extract interest calculation to util` |
| `[DOCS]` | Documentation | `[DOCS] ULMS-401: Update API documentation` |
| `[TEST]` | Tests only | `[TEST] ULMS-501: Add CIB service unit tests` |
| `[CHORE]` | Maintenance | `[CHORE] ULMS-601: Upgrade Spring Boot to 3.2.2` |
| `[HOTFIX]` | Production fix | `[HOTFIX] ULMS-701: Fix CIB timeout issue` |
| `[CONFIG]` | Configuration | `[CONFIG] ULMS-801: Update Kubernetes resource limits` |

### 4.3 Title Guidelines

| Rule | Good Example | Bad Example |
|------|--------------|-------------|
| Include ticket ID | `[FEAT] ULMS-101: Add loan form` | `Add loan form` |
| Be specific | `Fix null pointer in interest calc` | `Fix bug` |
| Use imperative mood | `Add validation for amount` | `Added validation` |
| Keep under 72 chars | `Add loan application form` | `Add the new loan application form with all the fields and validation` |
| No period at end | `Add loan form` | `Add loan form.` |

---

## 5. PR Description Guidelines

### 5.1 Description Sections

#### What (Required)
- Clearly state what the PR does
- List the key changes
- Be specific about modifications

```markdown
### What does this PR do?
This PR implements the loan application form with the following components:
- Multi-step form wizard (5 steps)
- Form validation using React Hook Form + Zod
- Integration with customer lookup API
- Bengali/English language support
```

#### Why (Required)
- Explain the motivation
- Reference business requirements
- Link to user story/ticket

```markdown
### Why is this change needed?
Per business requirements (ULMS-101), loan officers need a streamlined
way to capture loan application data. The current paper-based process
results in data entry errors and delays.

This addresses:
- BRD Section 4.2: Loan Application Capture
- User Story: "As a loan officer, I want to enter loan applications digitally"
```

#### How (For complex changes)
- Explain technical approach
- Describe key design decisions
- Note any trade-offs made

```markdown
### Technical Approach
- Used React Hook Form for performance (uncontrolled inputs)
- Implemented wizard pattern for better UX on large forms
- Added debounced customer lookup to reduce API calls
- Stored form state in Redux for persistence across steps

Alternative considered: Single long form
Reason for rejection: Poor UX for 50+ field form
```

### 5.2 Adding Context

#### Screenshots (UI Changes)
```markdown
## Screenshots

### Desktop View
![Desktop](screenshots/desktop.png)

### Mobile View
![Mobile](screenshots/mobile.png)

### Before/After
| Before | After |
|--------|-------|
| ![Before](before.png) | ![After](after.png) |
```

#### API Changes
```markdown
## API Changes

### New Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/loans | Create loan application |
| GET | /api/v1/loans/{id} | Get loan details |

### Modified Endpoints
| Endpoint | Change |
|----------|--------|
| GET /api/v1/customers/{id} | Added `loanHistory` field |

### Request/Response Examples
```json
// POST /api/v1/loans
{
  "customerId": "CUST-001",
  "amount": 500000,
  "tenure": 36
}
```
```

#### Database Changes
```markdown
## Database Changes

### New Tables
- `loan_applications` - Stores loan application data

### Modified Tables
- `customers` - Added `risk_rating` column

### Migration
File: `V20260204.01__add_loan_applications_table.sql`

### Rollback
File: `U20260204.01__add_loan_applications_table.sql`
```

---

## 6. Review Assignment

### 6.1 Assignment Rules

| Change Type | Required Reviewers | Approval Count |
|-------------|-------------------|----------------|
| Feature (small) | 1 developer | 1 |
| Feature (medium) | 2 developers | 1 |
| Feature (large) | 2 developers + Lead | 2 |
| Bug fix | 1 developer | 1 |
| Hotfix | Tech Lead | 1 (expedited) |
| Database migration | Tech Lead + BA | 2 |
| Security-related | Tech Lead | 2 |
| Release branch | All team | 2 |

### 6.2 Reviewer Selection by Module

| Module | Primary Reviewer | Secondary Reviewer |
|--------|------------------|-------------------|
| Fineract Core | Tech Lead | Dev 2 |
| CIB Service | Tech Lead | Dev 2 |
| BRPD Service | Tech Lead | BA (business logic) |
| React Frontend | Dev 1 | Tech Lead |
| Mobile App | Dev 2 | Dev 1 |
| Database | Tech Lead | BA |
| Infrastructure | Tech Lead | Dev 2 |

### 6.3 GitLab Assignment

```markdown
<!-- In PR description -->
/assign @lead-dev
/assign_reviewer @dev1 @dev2

<!-- Or use GitLab UI -->
Assignee: @author
Reviewers: @lead-dev, @dev1
```

---

## 7. Merge Requirements

### 7.1 Required Checks

| Check | Requirement | Blocking |
|-------|-------------|----------|
| CI Pipeline | All stages pass | Yes |
| Unit Tests | Pass | Yes |
| Integration Tests | Pass | Yes |
| Code Coverage | ≥ 80% | Yes |
| SonarQube Gate | Pass | Yes |
| Security Scan | No critical issues | Yes |
| Lint/Format | Pass | Yes |
| Build | Success | Yes |

### 7.2 Approval Requirements

| Target Branch | Approvals Required | Special Requirements |
|---------------|-------------------|----------------------|
| `develop` | 1 | CI must pass |
| `release/*` | 2 | QA sign-off |
| `main` | 2 | PM sign-off for releases |
| `hotfix/*` | 1 (Tech Lead) | Expedited process |

### 7.3 Pre-Merge Checklist

```markdown
## Pre-Merge Verification

### Author Checklist
- [ ] All discussions resolved
- [ ] Branch is up-to-date with target
- [ ] No merge conflicts
- [ ] CI pipeline passed
- [ ] Required approvals obtained
- [ ] PR title follows convention
- [ ] Related ticket linked

### Reviewer Checklist
- [ ] Code quality verified
- [ ] Tests are adequate
- [ ] No security concerns
- [ ] Documentation complete
- [ ] Ready to merge
```

### 7.4 Merge Methods

| Method | When to Use | Result |
|--------|-------------|--------|
| **Squash and Merge** | Features, bug fixes | Single commit |
| **Merge Commit** | Releases | Preserves history |
| **Rebase and Merge** | Clean linear history | All commits preserved |

**ULMS Standard:** Use **Squash and Merge** for `develop`, **Merge Commit** for `main`.

---

## 8. Post-Merge Actions

### 8.1 Immediate Actions

```bash
# 1. Delete merged branch
git branch -d feature/ULMS-XXX-description
git push origin --delete feature/ULMS-XXX-description

# 2. Update local develop
git checkout develop
git pull origin develop

# 3. Verify deployment (automated)
# Check GitLab CI/CD pipeline status
```

### 8.2 Ticket Updates

```markdown
## Update ULMS-XXX

### Status Change
- Move to: "Done" or "Ready for QA"

### Add Comment
```
PR merged to develop: !123
Deployed to DEV environment.
Ready for QA verification.
```

### Link PR
- Add merge request link to ticket
```

### 8.3 Documentation Updates

| If Changed | Update |
|------------|--------|
| API endpoints | OpenAPI/Swagger docs |
| Configuration | README or config docs |
| Database schema | ERD diagrams |
| User-facing feature | User documentation |

---

## 9. Special PR Types

### 9.1 Hotfix PR

```markdown
## [HOTFIX] ULMS-XXX: Critical Production Fix

### Severity
- [ ] P1 - Critical (system down)
- [ ] P2 - High (major feature broken)

### Issue
<!-- Describe the production issue -->

### Root Cause
<!-- Quick root cause analysis -->

### Fix
<!-- Describe the fix -->

### Risk Assessment
- Impact:
- Rollback plan:

### Testing
- [ ] Fix verified locally
- [ ] Regression test added
- [ ] Smoke test on staging

### Deployment
- [ ] Ready for immediate deployment
- [ ] Requires off-hours deployment

/label ~hotfix ~urgent
/assign @lead-dev
```

### 9.2 Release PR

```markdown
## [RELEASE] v1.0.0

### Release Summary
<!-- Overview of release contents -->

### Included Features
- ULMS-101: Loan application form
- ULMS-102: CIB integration
- ULMS-103: Approval workflow

### Bug Fixes
- ULMS-201: Fix validation error

### Breaking Changes
- [ ] None
- [ ] List:

### Migration Required
- [ ] No
- [ ] Yes - Migration guide:

### Release Checklist
- [ ] All features complete
- [ ] All tests pass
- [ ] UAT signed off
- [ ] Release notes finalized
- [ ] Documentation updated
- [ ] Deployment runbook ready
- [ ] Rollback procedure tested

### Approvals Required
- [ ] QA Lead
- [ ] Tech Lead
- [ ] PM
- [ ] Client (for production)

/label ~release
/milestone %v1.0.0
```

### 9.3 Documentation PR

```markdown
## [DOCS] ULMS-XXX: Update API Documentation

### Documentation Changes
- Updated:
- Added:
- Removed:

### Verification
- [ ] Links verified
- [ ] Examples tested
- [ ] Spelling/grammar checked

/label ~documentation
```

### 9.4 Dependency Update PR

```markdown
## [CHORE] Update Dependencies

### Updated Packages

| Package | From | To | Reason |
|---------|------|-----|--------|
| spring-boot | 3.2.1 | 3.2.2 | Security patch |
| react | 18.2.0 | 18.3.0 | Bug fixes |

### Changelog Review
- [ ] Reviewed changelogs for breaking changes
- [ ] No breaking changes
- [ ] Breaking changes addressed:

### Testing
- [ ] All tests pass
- [ ] Manual smoke test completed
- [ ] No functionality affected

/label ~dependencies ~maintenance
```

---

## Appendix A: Quick Reference

### PR Creation Checklist

```
□ Branch from develop
□ Follow branch naming: feature/ULMS-XXX-description
□ Commit messages follow convention
□ Self-review completed
□ Tests written and passing
□ Push and create PR
□ Fill template completely
□ Assign reviewers
□ Link to ticket
```

### Reviewer Quick Guide

```
□ Check PR description completeness
□ Review code changes
□ Run locally if needed
□ Check test coverage
□ Verify security considerations
□ Leave constructive feedback
□ Approve or request changes
```

### GitLab Slash Commands

```
/assign @username       # Assign PR
/assign_reviewer @user  # Request review
/label ~label-name      # Add label
/milestone %v1.0.0      # Set milestone
/due 2026-02-15        # Set due date
/approve               # Approve PR
/merge                 # Merge PR
```

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Technical Lead | | | |
| Project Manager | | | |

---

**Document End**

*ULMS v2.0 - Pull Request Template & Process v1.0*

*Unisoft Systems Limited - Confidential*

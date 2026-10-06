# Technical Debt Tracking Process

## ULMS v2.0 - Technical Debt Management

---

**Document Control**

| Field | Value |
|-------|-------|
| Document ID | ULMS-GOV-TDT-001 |
| Version | 1.0 |
| Status | Final |
| Classification | Internal - Engineering |
| Effective Date | February 2026 |
| Review Cycle | Monthly |
| Owner | Technical Lead |
| Approver | CTO |

---

## Revision History

| Version | Date | Author | Changes | Approver |
|---------|------|--------|---------|----------|
| 0.1 | 2026-01-10 | Engineering Team | Initial draft | - |
| 0.5 | 2026-01-20 | Architecture Team | Added metrics | - |
| 0.8 | 2026-01-28 | QA Lead | Added quality gates | - |
| 1.0 | 2026-02-05 | Technical Lead | Final release | CTO |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Technical Debt Definition](#2-technical-debt-definition)
3. [Debt Classification](#3-debt-classification)
4. [Debt Identification](#4-debt-identification)
5. [Debt Tracking](#5-debt-tracking)
6. [Debt Prioritization](#6-debt-prioritization)
7. [Debt Repayment](#7-debt-repayment)
8. [Debt Metrics](#8-debt-metrics)
9. [Governance](#9-governance)
10. [Appendices](#10-appendices)

---

## 1. Introduction

### 1.1 Purpose
This document establishes a systematic approach to identifying, tracking, and managing technical debt in the ULMS v2.0 system to maintain code quality and system maintainability.

### 1.2 Scope
- Code-level technical debt
- Architecture debt
- Infrastructure debt
- Documentation debt
- Test debt

### 1.3 Debt Management Principles

| Principle | Description |
|-----------|-------------|
| Visibility | All debt must be visible and tracked |
| Accountability | Each debt item has an owner |
| Prioritization | Debt is prioritized based on impact |
| Incremental Repayment | Debt is paid down continuously |
| Prevention | New debt is minimized through quality gates |

---

## 2. Technical Debt Definition

### 2.1 What is Technical Debt?

Technical debt refers to the accumulated cost of additional rework caused by choosing an easy (limited) solution now instead of using a better approach that would take longer.

### 2.2 Debt Categories

| Category | Description | Example |
|----------|-------------|---------|
| **Code Debt** | Suboptimal code implementation | Hard-coded values, code duplication |
| **Design Debt** | Architecture shortcuts | Missing abstraction layers |
| **Test Debt** | Insufficient test coverage | Missing unit tests, flaky tests |
| **Documentation Debt** | Outdated or missing docs | API docs not updated |
| **Infrastructure Debt** | Suboptimal infrastructure | Manual deployments |

---

## 3. Debt Classification

### 3.1 Severity Levels

| Severity | Interest Rate | Description |
|----------|---------------|-------------|
| **Critical** | High | Blocks development, high risk |
| **High** | Medium | Significant impact on velocity |
| **Medium** | Low | Moderate impact, manageable |
| **Low** | Minimal | Cosmetic, low impact |

### 3.2 Debt Types Matrix

| Type | Interest | Principal | Detection |
|------|----------|-----------|-----------|
| Security Vulnerability | High | High | Security scans |
| Performance Issue | High | Medium | Profiling |
| Code Duplication | Medium | Low | Static analysis |
| Outdated Dependencies | Medium | Medium | Dependency check |
| Missing Tests | Low | High | Coverage reports |
| Documentation Gaps | Low | Low | Reviews |

---

## 4. Debt Identification

### 4.1 Automated Detection

| Tool | Purpose | Integration |
|------|---------|-------------|
| SonarQube | Code quality, duplication | CI/CD pipeline |
| CodeClimate | Maintainability | GitHub integration |
| Snyk | Security vulnerabilities | PR checks |
| OWASP Dependency Check | Vulnerable dependencies | CI/CD pipeline |
| JaCoCo | Test coverage | Build process |

### 4.2 SonarQube Debt Metrics

| Metric | Threshold | Current | Status |
|--------|-----------|---------|--------|
| Code Smells | < 100 | | |
| Duplications | < 3% | | |
| Coverage | > 80% | | |
| Critical Issues | 0 | | |
| Blocker Issues | 0 | | |

### 4.3 Manual Identification

| Source | Method | Frequency |
|--------|--------|-----------|
| Code Reviews | Reviewer flags | Each PR |
| Architecture Reviews | Design discussions | Quarterly |
| Retrospectives | Team feedback | Sprint end |
| Incident Analysis | Post-mortems | Per incident |

---

## 5. Debt Tracking

### 5.1 Debt Register Template

| ID | Category | Description | Severity | Principal | Interest | Owner | Created | Target | Status |
|----|----------|-------------|----------|-----------|----------|-------|---------|--------|--------|
| TD-001 | Code | Duplicate validation logic | Medium | 4h | 1h/week | Dev A | 2026-01-15 | 2026-02-15 | Open |
| TD-002 | Test | Missing integration tests for CIB | High | 16h | 2h/week | Dev B | 2026-01-10 | 2026-03-01 | Open |
| TD-003 | Infra | Manual database backup | Medium | 8h | 30m/week | DevOps | 2026-01-05 | 2026-02-01 | In Progress |

### 5.2 Debt Item Format

```markdown
## TD-XXX: [Title]

### Description
[Detailed description of the debt]

### Location
- File: [path]
- Lines: [line numbers]
- Component: [module name]

### Why It Exists
[Explanation of why the shortcut was taken]

### Impact
- [Impact on development]
- [Impact on maintenance]
- [Risk if not addressed]

### Proposed Solution
[Description of ideal solution]

### Effort Estimate
- Principal: [hours to fix]
- Interest: [hours/week ongoing cost]

### Owner
[Name]

### Timeline
- Created: [Date]
- Target: [Date]
- Completed: [Date]

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
```

### 5.3 Tracking Tools

| Tool | Use Case | URL |
|------|----------|-----|
| Jira | Debt items as stories/tasks | https://jira.bank.com |
| GitHub Issues | Code-level debt | https://github.com/bank/ulms |
| SonarQube | Automated findings | https://sonar.bank.com |
| Confluence | Debt documentation | https://wiki.bank.com |

---

## 6. Debt Prioritization

### 6.1 Prioritization Matrix

| Criteria | Weight | Score 1-5 |
|----------|--------|-----------|
| Business Risk | 30% | |
| Development Impact | 25% | |
| Maintenance Cost | 20% | |
| Customer Impact | 15% | |
| Compliance Risk | 10% | |

**Priority Score = Σ(Criteria × Weight)**

### 6.2 Priority Levels

| Score | Priority | Action |
|-------|----------|--------|
| 4.5-5.0 | Critical | Immediate sprint allocation |
| 3.5-4.4 | High | Next 2 sprints |
| 2.5-3.4 | Medium | Next quarter |
| 1.5-2.4 | Low | Backlog |
| < 1.5 | Minimal | As capacity allows |

### 6.3 Debt Quadrant

```
                    HIGH INTEREST
                         │
    ┌────────────────────┼────────────────────┐
    │  PAY NOW           │    AVOID           │
    │  (Critical debt)   │    (Don't create)  │
LOW ├────────────────────┼────────────────────┤ HIGH
PRIN│  CARRY             │    TRANSFER        │
CIP │  (Acceptable)      │    (Refactor)      │
    └────────────────────┼────────────────────┘
                         │
                    LOW INTEREST
```

---

## 7. Debt Repayment

### 7.1 Repayment Strategies

| Strategy | When to Use | Example |
|----------|-------------|---------|
| **Incremental** | Small, scattered debt | Fix 1-2 items per sprint |
| **Dedicated Sprint** | Large accumulated debt | "Cleanup Sprint" |
| **Boy Scout Rule** | Ongoing maintenance | Leave code better than found |
| **Rewrite** | Unmanageable debt | Component rewrite |

### 7.2 Sprint Planning Guidelines

| Debt Level | Sprint Allocation |
|------------|-------------------|
| Healthy (< 20 items) | 10-15% of capacity |
| Warning (20-50 items) | 15-25% of capacity |
| Critical (> 50 items) | 25-40% of capacity |

### 7.3 Repayment Workflow

```
1. SELECT
   - Review debt register
   - Select items for sprint
   - Balance with features

2. PLAN
   - Create user stories
   - Estimate effort
   - Assign to developers

3. IMPLEMENT
   - Fix the debt
   - Add tests
   - Update documentation

4. VERIFY
   - Code review
   - Automated checks pass
   - QA validation

5. CLOSE
   - Update debt register
   - Document lessons learned
   - Celebrate! 🎉
```

---

## 8. Debt Metrics

### 8.1 Key Metrics Dashboard

| Metric | Target | Current | Trend |
|--------|--------|---------|-------|
| Total Debt Items | < 50 | | |
| Critical Debt Items | 0 | | |
| Debt Age (avg) | < 30 days | | |
| Debt/Feature Ratio | < 0.2 | | |
| Code Coverage | > 80% | | |
| SonarQube Rating | A | | |

### 8.2 Debt Trends

```
Month    New Debt    Resolved    Net    Total
──────────────────────────────────────────────
Jan 2026     10          5        +5      45
Feb 2026      8          8         0      45
Mar 2026      6         10        -4      41
Apr 2026      5         12        -7      34
```

### 8.3 Quality Gates

| Gate | Criteria | Enforcement |
|------|----------|-------------|
| PR Gate | No new critical issues | SonarQube checks |
| Coverage Gate | > 80% coverage | CI/CD block |
| Review Gate | No code smells approved | Manual review |
| Sprint Gate | Debt items addressed | Sprint retrospective |

---

## 9. Governance

### 9.1 Roles and Responsibilities

| Role | Responsibility |
|------|----------------|
| CTO | Overall debt strategy, resource allocation |
| Technical Lead | Debt prioritization, technical decisions |
| Tech Lead (per team) | Team debt management, sprint planning |
| Developers | Debt identification, repayment |
| QA | Test debt management |
| DevOps | Infrastructure debt |

### 9.2 Review Cadence

| Review | Frequency | Participants | Output |
|--------|-----------|--------------|--------|
| Debt Triage | Weekly | Tech Leads | Prioritized backlog |
| Debt Review | Monthly | All leads | Repayment plan |
| Architecture Review | Quarterly | Architects | Strategic decisions |
| Board Report | Quarterly | CTO | Executive summary |

### 9.3 Technical Debt Budget

| Quarter | Capacity for Debt | Notes |
|---------|-------------------|-------|
| Q1 2026 | 20% | New system, building foundation |
| Q2 2026 | 15% | Feature focus |
| Q3 2026 | 25% | Cleanup sprint planned |
| Q4 2026 | 15% | Year-end features |

---

## 10. Appendices

### Appendix A: Debt Item Template

```markdown
## TD-XXX: [Brief Description]

**Category**: [Code/Test/Infra/Doc]
**Severity**: [Critical/High/Medium/Low]
**Principal**: [Hours]
**Interest**: [Hours/week]
**Owner**: [Name]
**Created**: [Date]
**Target**: [Date]

### Description
[Detailed description]

### Technical Details
- File: [path]
- Issue: [description]

### Impact
[Risk/impact if not addressed]

### Proposed Solution
[How to fix]

### Acceptance Criteria
- [ ] Criteria 1
- [ ] Criteria 2
```

### Appendix B: SonarQube Rules Reference

| Rule | Severity | Category |
|------|----------|----------|
| squid:S106 | Critical | Security |
| squid:S1192 | Minor | Maintainability |
| squid:S3776 | Critical | Complexity |
| squid:S125 | Minor | Code Smell |
| squid:S1481 | Minor | Code Smell |

### Appendix C: Related Documents

| Document | ID | Location |
|----------|-----|----------|
| Code Quality Standards | ULMS-DEV-CQS-001 | 8.3_Development/ |
| Definition of Done | ULMS-DEV-DOD-001 | 8.3_Development/ |
| Architecture Decision Records | ULMS-GOV-ADR-001 | 8.3_Risk_Governance/ |

---

**Document Control Footer**

*Classification: Internal - Engineering*
*Next Review: Monthly*
*Owner: Technical Lead*

**END OF DOCUMENT**

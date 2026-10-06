**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | UAT Test Plan |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | QA Lead, Unisoft Systems Limited |
| **Reviewed By** | Project Manager |
| **Classification** | Internal |
| **Status** | Draft |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | QA Lead | Initial version |

---

# UAT Test Plan

## Table of Contents

1. [Introduction](#1-introduction)
2. [UAT Objectives](#2-uat-objectives)
3. [UAT Scope](#3-uat-scope)
4. [UAT Approach](#4-uat-approach)
5. [User Roles and Responsibilities](#5-user-roles-and-responsibilities)
6. [Test Environment](#6-test-environment)
7. [Entry and Exit Criteria](#7-entry-and-exit-criteria)
8. [Test Schedule](#8-test-schedule)
9. [Acceptance Criteria](#9-acceptance-criteria)
10. [Risk Management](#10-risk-management)
11. [Related Documents](#11-related-documents)

---

## 1. Introduction

### 1.1 Purpose

This document defines the User Acceptance Testing (UAT) approach for ULMS v2.0. UAT validates that the system meets business requirements and is ready for production deployment in Bangladesh banks.

### 1.2 Target Audience

| Role | Responsibility |
|------|----------------|
| Business Users | Execute test cases, validate functionality |
| Relationship Managers | Test loan origination workflow |
| Credit Officers | Test credit evaluation process |
| Branch Managers | Test approval workflows |
| CMU Officers | Test credit monitoring functions |
| IT Team | Environment support, defect resolution |
| QA Team | Test coordination, defect management |

---

## 2. UAT Objectives

### 2.1 Primary Objectives

| Objective | Success Criteria |
|-----------|------------------|
| Validate Business Requirements | 100% of BRD requirements tested |
| Verify User Workflows | All user journeys executable |
| Confirm Data Accuracy | Financial calculations validated |
| Test Integration | All external systems functional |
| Validate Compliance | BRPD 15/2024 requirements met |
| Performance Validation | Response times acceptable |

### 2.2 UAT Goals

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         UAT SUCCESS CRITERIA                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   100% Test     │  │   < 5% Defect   │  │   100% Critical │             │
│  │   Coverage      │  │   Rate          │  │   BRD Coverage  │             │
│  │   (200+ cases)  │  │   (10 defects)  │  │   (All met)     │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   95% Pass      │  │   100% High     │  │   Business      │             │
│  │   Rate          │  │   Priority Fix  │  │   Sign-off      │             │
│  │   (190 cases)   │  │   (Before Go)   │  │   (Obtained)    │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. UAT Scope

### 3.1 In-Scope Features

| Module | Features | Priority |
|--------|----------|----------|
| **Loan Origination** | Application, NID verify, CIB check | Critical |
| **Credit Evaluation** | Scoring, assessment, recommendation | Critical |
| **Approval Workflow** | BOCC, CMU, Credit Committee | Critical |
| **Disbursement** | Documentation, fund transfer | Critical |
| **Repayment** | EMI, prepayment, settlement | Critical |
| **Classification** | BRPD 15/2024 auto-classification | Critical |
| **Provisioning** | IFRS-9 ECL calculation | Critical |
| **Reporting** | CL-1 to CL-5, regulatory reports | Critical |
| **Integration** | CIB, NID, CBS, Payment Gateways | Critical |
| **Administration** | User management, configuration | High |

### 3.2 Out of Scope

| Item | Reason |
|------|--------|
| Performance Testing | Completed in separate phase |
| Security Penetration Testing | Completed by security team |
| Core Banking System | External system |
| Infrastructure Setup | Completed by DevOps |

---

## 4. UAT Approach

### 4.1 Testing Strategy

| Phase | Activities | Duration |
|-------|------------|----------|
| **Phase 1: Preparation** | Environment setup, data preparation, training | 3 days |
| **Phase 2: Functional UAT** | Execute functional test cases | 10 days |
| **Phase 3: Integration UAT** | End-to-end workflow testing | 5 days |
| **Phase 4: Regression UAT** | Re-test after fixes | 3 days |
| **Phase 5: Sign-off** | Business approval, go/no-go | 2 days |

### 4.2 UAT Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         UAT EXECUTION WORKFLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│   │  ASSIGN  │───▶│ EXECUTE  │───▶│  LOG     │───▶│  FIX     │             │
│   │  Test    │    │  Test    │    │  Result  │    │  Defect  │             │
│   └──────────┘    └──────────┘    └────┬─────┘    └────┬─────┘             │
│                                        │               │                    │
│                                        │ PASS          │                    │
│                                        ▼               │                    │
│                                  ┌──────────┐          │                    │
│                                  │  SIGN    │          │ FIX                │
│                                  │  OFF     │◀─────────┘ COMPLETE           │
│                                  └──────────┘                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. User Roles and Responsibilities

### 5.1 UAT Team Structure

| Role | Name | Responsibility |
|------|------|----------------|
| **UAT Lead** | TBD | Overall UAT coordination |
| **Business Analyst** | TBD | Requirements clarification |
| **Test Coordinator** | TBD | Test execution coordination |
| **Relationship Managers** | 5 users | Loan origination testing |
| **Credit Officers** | 3 users | Credit evaluation testing |
| **Branch Managers** | 2 users | Approval workflow testing |
| **CMU Officers** | 2 users | Monitoring and reporting |
| **IT Support** | 2 users | Technical support |

### 5.2 RACI Matrix

| Activity | UAT Lead | Business | IT | QA |
|----------|----------|----------|-----|-----|
| Test Planning | R/A | C | I | C |
| Environment Setup | A | I | R | C |
| Test Execution | C | R/A | I | C |
| Defect Logging | C | R | I | A |
| Defect Fix | I | C | R/A | C |
| Regression Test | C | R | I | A |
| Sign-off | C | R/A | I | C |

---

## 6. Test Environment

### 6.1 UAT Environment Configuration

```yaml
# UAT Environment Specification
environment:
  name: ULMS-UAT
  url: https://ulms-uat.bank.com
  
  application:
    version: v2.0.0-RC1
    replicas: 2
    
  database:
    type: PostgreSQL 16
    data: Anonymized production clone (3 months)
    
  integrations:
    cib: CIB Sandbox
    nid: NIDW Sandbox
    cbs: CBS Test Instance
    payment: Payment Gateway Sandboxes
    
  monitoring:
    logging: Enabled
    error_tracking: Enabled
    performance_monitoring: Enabled
```

### 6.2 Test Data Requirements

| Data Type | Volume | Source |
|-----------|--------|--------|
| Borrowers | 5,000 | Anonymized production |
| Loans | 10,000 | Anonymized production |
| Users | 50 | Test users created |
| Documents | 5,000 | Sample documents |
| CIB Records | 5,000 | Sandbox data |

---

## 7. Entry and Exit Criteria

### 7.1 Entry Criteria

| Criterion | Requirement |
|-----------|-------------|
| Code Complete | 100% features developed |
| SIT Complete | System Integration Testing passed |
| Defects Resolved | All critical/high defects fixed |
| Documentation | User guide, training materials ready |
| Environment | UAT environment provisioned |
| Data | Test data loaded and validated |
| Training | Business users trained |

### 7.2 Exit Criteria

| Criterion | Target |
|-----------|--------|
| Test Coverage | 100% of test cases executed |
| Pass Rate | ≥ 95% test cases passed |
| Critical Defects | 0 open |
| High Defects | ≤ 3 open with workarounds |
| Medium/Low | Documented and accepted |
| Business Sign-off | Obtained from stakeholders |

---

## 8. Test Schedule

### 8.1 UAT Timeline

| Week | Activity | Deliverable |
|------|----------|-------------|
| Week 1 | Environment setup, data load, training | UAT Ready |
| Week 2 | Functional testing - Loan Origination | Test Results |
| Week 3 | Functional testing - Credit & Approval | Test Results |
| Week 4 | Functional testing - Disbursement & Repayment | Test Results |
| Week 5 | Integration testing, Reporting | Test Results |
| Week 6 | Defect fixes, Regression testing | Fixed Build |
| Week 7 | Final regression, Sign-off | UAT Sign-off |

### 8.2 Daily Schedule

| Time | Activity |
|------|----------|
| 09:00 - 09:30 | Daily standup meeting |
| 09:30 - 12:30 | Test execution |
| 12:30 - 13:30 | Lunch break |
| 13:30 - 16:30 | Test execution |
| 16:30 - 17:00 | Defect triage |

---

## 9. Acceptance Criteria

### 9.1 Feature Acceptance Criteria

| Feature | Criteria | Measurement |
|---------|----------|-------------|
| Loan Application | Complete in < 10 minutes | Time measurement |
| NID Verification | > 99% success rate | Success rate |
| CIB Integration | Response < 5 seconds | Response time |
| Approval Workflow | All stages routable | Workflow test |
| Disbursement | Zero calculation errors | Calculation test |
| Classification | BRPD 15/2024 compliant | Compliance check |
| Reporting | 100% report accuracy | Data validation |

### 9.2 Go/No-Go Criteria

```markdown
## UAT Go/No-Go Decision Matrix

### GO Criteria (All must be met)
- [ ] All critical test cases passed
- [ ] 95%+ of all test cases passed
- [ ] No open critical defects
- [ ] Performance meets SLA
- [ ] Business sign-off obtained
- [ ] Training completed
- [ ] Support team ready
- [ ] Rollback plan documented

### NO-GO Triggers
- [ ] Any critical defect unresolved
- [ ] Data integrity issues
- [ ] Security vulnerabilities
- [ ] Performance below 50% of target
- [ ] Key stakeholder rejection
```

---

## 10. Risk Management

### 10.1 UAT Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Environment issues | High | Medium | Dedicated support, backup environment |
| Resource unavailability | High | Low | Backup testers assigned |
| Data quality issues | Medium | Medium | Data validation, multiple datasets |
| Integration failures | High | Medium | Mock services, sandbox fallback |
| Scope creep | Medium | Low | Change control process |

---

## 11. Related Documents

| Document | Purpose |
|----------|---------|
| `[UAT]_UAT_Test_Cases_200plus_v1.0.md` | Detailed test cases |
| `[UAT]_UAT_Environment_Setup_Guide_v1.0.md` | Environment setup |
| `../User_Requirements_Document_v2.md` | URD traceability |
| `../Business_Requirements_Document_LMS.md` | BRD requirements |

---

**Document Owner:** QA Lead, Unisoft Systems Limited  
**Next Review Date:** 2026-03-05  
**Classification:** Internal

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

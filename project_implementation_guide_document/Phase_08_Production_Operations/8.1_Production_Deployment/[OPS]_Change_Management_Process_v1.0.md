# Change Management Process

## ULMS v2.0 - IT Change Control

---

**Document Control**

| Field | Value |
|-------|-------|
| Document ID | ULMS-OPS-CM-001 |
| Version | 1.0 |
| Status | Final |
| Classification | Internal - Operations |
| Effective Date | February 2026 |
| Review Cycle | Per Change |
| Owner | Change Manager |
| Approver | CTO |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Change Types](#2-change-types)
3. [Change Workflow](#3-change-workflow)
4. [Change Advisory Board](#4-change-advisory-board)
5. [Emergency Changes](#5-emergency-changes)
6. [Documentation](#6-documentation)
7. [Appendices](#7-appendices)

---

## 1. Introduction

### 1.1 Purpose
This document defines the change management process for ULMS v2.0 to ensure controlled and authorized changes to the production environment.

### 1.2 Scope
- Software updates
- Configuration changes
- Infrastructure modifications
- Security patches
- Database changes

---

## 2. Change Types

### 2.1 Change Categories

| Type | Definition | Examples | Approval |
|------|------------|----------|----------|
| **Standard** | Pre-approved, low risk | Patch updates, config changes | Change Manager |
| **Normal** | Requires assessment | Feature releases, upgrades | CAB |
| **Emergency** | Urgent fix required | Security patches, outages | Emergency CAB |

### 2.2 Risk Assessment

| Risk Level | Criteria | Review |
|------------|----------|--------|
| Low | No downtime, reversible | 24 hours |
| Medium | < 1 hour downtime | 1 week |
| High | > 1 hour downtime | 2 weeks |

---

## 3. Change Workflow

### 3.1 Standard Process

```
Request → Assess → Plan → Approve → Build → Test → Deploy → Review → Close
```

### 3.2 Detailed Steps

**Step 1: Change Request**
- Submit RFC (Request for Change)
- Describe change purpose
- Identify affected systems
- Assess risks

**Step 2: Change Assessment**
- Technical review
- Impact analysis
- Resource estimation
- Risk evaluation

**Step 3: Change Planning**
- Implementation plan
- Rollback plan
- Test plan
- Communication plan

**Step 4: CAB Review**
- Present to CAB
- Address concerns
- Obtain approval
- Schedule change

**Step 5: Implementation**
- Execute change
- Monitor progress
- Document results

**Step 6: Post-Implementation**
- Verify success
- Close RFC
- Lessons learned

---

## 4. Change Advisory Board

### 4.1 CAB Composition

| Role | Responsibility |
|------|----------------|
| Change Manager | Chair, process owner |
| Technical Lead | Technical assessment |
| Operations Lead | Operations impact |
| Security Lead | Security review |
| Business Representative | Business impact |

### 4.2 CAB Meetings

| Type | Frequency | Attendees |
|------|-----------|-----------|
| Standard CAB | Weekly | Core members |
| Emergency CAB | As needed | Available members |

### 4.3 CAB Decision

| Decision | Meaning |
|----------|---------|
| Approved | Proceed as planned |
| Approved with conditions | Proceed with modifications |
| Deferred | Resubmit with more info |
| Rejected | Do not proceed |

---

## 5. Emergency Changes

### 5.1 Criteria
- Security vulnerability
- System outage
- Data corruption
- Regulatory requirement

### 5.2 Emergency Process

1. **Request** (0-15 min)
   - Document emergency
   - Notify on-call manager

2. **Assessment** (15-30 min)
   - Quick risk assessment
   - Identify approvers

3. **Approval** (30-60 min)
   - Emergency CAB conference
   - Authorize change

4. **Implementation** (varies)
   - Execute change
   - Document actions

5. **Retroactive** (within 24 hours)
   - Complete documentation
   - CAB review

---

## 6. Documentation

### 6.1 RFC Template

```
REQUEST FOR CHANGE

Change ID: CHG-YYYY-NNNN
Requested By: 
Date: 

Description:
[Detailed description of change]

Justification:
[Business/technical reason]

Affected Systems:
[List of components]

Risk Assessment:
[High/Medium/Low with justification]

Implementation Plan:
[Step-by-step plan]

Rollback Plan:
[How to revert]

Testing:
[How change will be tested]

Schedule:
Proposed Date: 
Duration: 
Window: 

Approvals:
Requester: _________________ Date: _______
Technical Lead: _________________ Date: _______
CAB: _________________ Date: _______
```

### 6.2 Change Log

| Change ID | Description | Date | Status | Implementer |
|-----------|-------------|------|--------|-------------|
| | | | | |

---

## 7. Appendices

### Appendix A: Change Metrics

| Metric | Target |
|--------|--------|
| Change success rate | > 95% |
| Emergency change ratio | < 10% |
| CAB meeting attendance | > 80% |
| RFC completion rate | > 90% |

### Appendix B: Related Documents

| Document | ID |
|----------|-----|
| Release Management Process | ULMS-OPS-RM-005 |
| Rollback Procedures | ULMS-OPS-RB-004 |
| Incident Response Plan | ULMS-OPS-IRP-001 |

---

**Document Control Footer**

*Classification: Internal - Operations*
*Next Review: Per Change*
*Owner: Change Manager*

**END OF DOCUMENT**

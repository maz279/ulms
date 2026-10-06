# Loan Approval Workflow Specifications

## Unisoft Loan Management System (ULMS) v2.0

### BPMN 2.0 Process Models and Business Rules

---

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ARCH-1.6.2 |
| **Document Title** | Loan Approval Workflow Specifications |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 5, 2026 |
| **Prepared By** | Lead Developer |
| **Reviewed By** | Architecture Review Board |
| **Classification** | Confidential - Internal Use |
| **Status** | Approved for Implementation |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | Lead Developer | Initial Loan Approval Workflow Specifications |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Approval Authority Matrix](#2-approval-authority-matrix)
3. [Workflow State Transitions](#3-workflow-state-transitions)
4. [Approval Process Types](#4-approval-process-types)
5. [SLA Management](#5-sla-management)
6. [Notification Specifications](#6-notification-specifications)
7. [Digital Signature Requirements](#7-digital-signature-requirements)
8. [Integration Specifications](#8-integration-specifications)
9. [REST API Specifications](#9-rest-api-specifications)
10. [Audit and Compliance](#10-audit-and-compliance)
11. [Business Rules Engine](#11-business-rules-engine)
12. [Compliance Matrix](#12-compliance-matrix)

---

## 1. Executive Summary

### 1.1 Purpose

This document specifies the business requirements, REST APIs, and operational specifications for the loan approval workflow in ULMS v2.0. It serves as the implementation guide for the 7-level approval hierarchy integrated with Camunda BPMN 2.0.

### 1.2 Scope

| Aspect | Coverage |
|--------|----------|
| Approval Levels | 7 levels (L1-L7) |
| Approval Types | Standard, Fast-Track, Conditional, Committee |
| SLA Management | Per-level SLA with auto-escalation |
| Integration | CIB, NID, CBS, Notification Services |
| API Endpoints | 15+ REST endpoints |

### 1.3 Key Business Objectives

1. **Reduce TAT** - Target < 48 hours (from current 7-15 days)
2. **Ensure Compliance** - BRPD 15/2024, ICT Security V4.0
3. **Automate Routing** - DMN-based intelligent routing
4. **Full Audit Trail** - Complete approval history

### 1.4 Workflow Service Specification

| Specification | Value |
|--------------|-------|
| Service Name | ulms-workflow-service |
| Port | 8083 |
| Management Port | 8093 |
| API Base Path | /api/v1/workflow |
| Authentication | JWT (Keycloak) |

---

## 2. Approval Authority Matrix

### 2.1 7-Level Approval Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                         ULMS 7-LEVEL APPROVAL AUTHORITY MATRIX                               │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│  Level │ Role                  │ Amount Range (BDT)     │ SLA    │ Escalate │ Keycloak Role │
│  ──────┼───────────────────────┼────────────────────────┼────────┼──────────┼───────────────│
│                                                                                              │
│   L1   │ Branch Credit Head    │ 0 - 5,00,000           │ 4 hrs  │ After    │ BRANCH_CREDIT │
│        │ (BCH)                 │ (Up to 5 Lakh)         │        │ 6 hrs    │ _HEAD         │
│  ──────┼───────────────────────┼────────────────────────┼────────┼──────────┼───────────────│
│   L2   │ Branch Manager        │ 5,00,001 - 10,00,000   │ 6 hrs  │ After    │ BRANCH_       │
│        │ (BM)                  │ (5-10 Lakh)            │        │ 8 hrs    │ MANAGER       │
│  ──────┼───────────────────────┼────────────────────────┼────────┼──────────┼───────────────│
│   L3   │ Regional Manager      │ 10,00,001 - 25,00,000  │ 8 hrs  │ After    │ REGIONAL_     │
│        │ (RM)                  │ (10-25 Lakh)           │        │ 12 hrs   │ MANAGER       │
│  ──────┼───────────────────────┼────────────────────────┼────────┼──────────┼───────────────│
│   L4   │ Head of Credit        │ 25,00,001 - 1,00,00,000│ 12 hrs │ After    │ HEAD_OF_      │
│        │ (HOC)                 │ (25 Lakh - 1 Crore)    │        │ 18 hrs   │ CREDIT        │
│  ──────┼───────────────────────┼────────────────────────┼────────┼──────────┼───────────────│
│   L5   │ Credit Committee      │ 1,00,00,001-5,00,00,000│ 24 hrs │ After    │ CREDIT_       │
│        │ (CC)                  │ (1-5 Crore)            │        │ 36 hrs   │ COMMITTEE     │
│  ──────┼───────────────────────┼────────────────────────┼────────┼──────────┼───────────────│
│   L6   │ Deputy MD             │ 5,00,00,001-10,00,00,000│ 48 hrs│ After    │ DEPUTY_MD     │
│        │ (DMD)                 │ (5-10 Crore)           │        │ 72 hrs   │               │
│  ──────┼───────────────────────┼────────────────────────┼────────┼──────────┼───────────────│
│   L7   │ Managing Director     │ > 10,00,00,000         │ 72 hrs │ Board/   │ MANAGING_     │
│        │ (MD)                  │ (Above 10 Crore)       │        │ EC       │ DIRECTOR      │
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

Note: 1 Lakh = 1,00,000 BDT, 1 Crore = 1,00,00,000 BDT
```

### 2.2 Approval Actions

| Action | Description | Comments Required | Next Step |
|--------|-------------|-------------------|-----------|
| **APPROVE** | Full approval at current level | Optional | Next level or Final |
| **APPROVE_WITH_CONDITIONS** | Approval with stipulations | Required | Capture conditions |
| **REJECT** | Decline application | Required | End - Rejected |
| **RETURN** | Send back for revision | Required | Return to applicant |
| **DELEGATE** | Forward to another approver | Required | Assign to delegate |
| **ESCALATE** | Manual escalation | Optional | Next level |

### 2.3 Delegation Rules

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DELEGATION AUTHORITY RULES                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. SAME LEVEL DELEGATION                                                   │
│     - Approver can delegate to another user with same role                  │
│     - Delegate must be in same or broader geographical scope                │
│     - Original approver remains accountable                                 │
│                                                                              │
│  2. LEAVE/ABSENCE DELEGATION                                                │
│     - Pre-configured delegation during leave periods                        │
│     - Maximum delegation period: 30 days                                    │
│     - System tracks all delegated approvals                                 │
│                                                                              │
│  3. DELEGATION RESTRICTIONS                                                 │
│     - Cannot delegate to subordinates                                       │
│     - Cannot delegate L6/L7 to lower levels                                │
│     - Credit Committee (L5) cannot be delegated to single approver         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.4 Credit Committee (L5) Quorum Rules

| Rule | Specification |
|------|---------------|
| Minimum Members | 3 voting members |
| Quorum for Meeting | 2/3 of members present |
| Approval Threshold | Majority vote (>50%) |
| Chairman Vote | Tie-breaker authority |
| Virtual Meetings | Allowed with audit trail |
| Maximum Pending | 48 hours before escalation |

---

## 3. Workflow State Transitions

### 3.1 Application State Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                      LOAN APPLICATION STATE FLOW DIAGRAM                                  │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│                                    ┌─────────┐                                          │
│                                    │  DRAFT  │                                          │
│                                    └────┬────┘                                          │
│                                         │ Submit                                        │
│                                         ▼                                               │
│                                    ┌───────────┐                                        │
│                                    │ SUBMITTED │                                        │
│                                    └─────┬─────┘                                        │
│                                          │ Start Review                                 │
│                                          ▼                                              │
│                                    ┌─────────────┐                                      │
│          ┌─────────────────────────│ UNDER_REVIEW│──────────────────────┐              │
│          │                         └──────┬──────┘                       │              │
│          │                                │                              │              │
│          │ Return                   Route to Level                 Reject               │
│          ▼                                │                              ▼              │
│     ┌──────────┐                         ▼                        ┌──────────┐         │
│     │ RETURNED │              ┌──────────────────────┐            │ REJECTED │         │
│     └────┬─────┘              │   APPROVAL PHASE     │            └──────────┘         │
│          │                    │   (L1 → L2 → ... L7) │            (Terminal)           │
│          │ Edit               └──────────┬───────────┘                                 │
│          ▼                               │                                              │
│     ┌─────────┐                    Approve (Final)                                      │
│     │  DRAFT  │                          │                                              │
│     └─────────┘                          ▼                                              │
│     (Re-submit)                   ┌──────────┐                                         │
│                                   │ APPROVED │                                          │
│                                   └────┬─────┘                                          │
│                                        │ Initiate Disbursement                          │
│                                        ▼                                                │
│                            ┌───────────────────────┐                                    │
│                            │ PENDING_DISBURSEMENT  │                                    │
│                            └───────────┬───────────┘                                    │
│                                        │ Disburse                                       │
│                                        ▼                                                │
│                                   ┌───────────┐                                         │
│                                   │ DISBURSED │                                         │
│                                   └─────┬─────┘                                         │
│                                         │ Activate                                      │
│                                         ▼                                               │
│                                    ┌─────────┐                                          │
│                                    │ ACTIVE  │                                          │
│                                    └─────────┘                                          │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Approval Phase Detail

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           APPROVAL PHASE INTERNAL FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│                         ┌───────────────────────────────────────┐                       │
│                         │         DMN: Route by Amount          │                       │
│                         └─────────────────┬─────────────────────┘                       │
│                                           │                                              │
│     ┌─────────────────┬─────────────────┼─────────────────┬─────────────────┐          │
│     │                 │                 │                 │                 │          │
│     ▼                 ▼                 ▼                 ▼                 ▼          │
│  ┌─────┐          ┌─────┐          ┌─────┐          ┌─────┐          ┌─────┐         │
│  │ L1  │──────────│ L2  │──────────│ L3  │──────────│ L4  │──────────│L5-7 │         │
│  │≤5L  │ Approve  │≤10L │ Approve  │≤25L │ Approve  │≤1Cr │ Approve  │>1Cr │         │
│  └──┬──┘ (esc)    └──┬──┘ (esc)    └──┬──┘ (esc)    └──┬──┘ (esc)    └──┬──┘         │
│     │                │                │                │                │              │
│     ├───────────────┬┴────────────────┴────────────────┴────────────────┘              │
│     │               │                                                                   │
│     │ Approve       │ Reject/Return                                                    │
│     │ (Final)       │                                                                   │
│     ▼               ▼                                                                   │
│  ┌────────┐    ┌──────────┐                                                           │
│  │APPROVED│    │REJECTED/ │                                                           │
│  │        │    │RETURNED  │                                                           │
│  └────────┘    └──────────┘                                                           │
│                                                                                          │
│  ESCALATION PATH (Approval at current level, amount exceeds authority):                │
│  L1 ──(>5L)──▶ L2 ──(>10L)──▶ L3 ──(>25L)──▶ L4 ──(>1Cr)──▶ L5 ──(>5Cr)──▶ L6/L7    │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Valid State Transitions

| Current State | Valid Next States | Trigger | Condition |
|---------------|-------------------|---------|-----------|
| DRAFT | SUBMITTED | Submit | All mandatory fields filled |
| SUBMITTED | UNDER_REVIEW | Start Review | - |
| UNDER_REVIEW | PENDING_APPROVAL_L1-L7 | Route | Based on DMN result |
| UNDER_REVIEW | RETURNED | Return | Analyst requests revision |
| UNDER_REVIEW | REJECTED | Reject | Fails initial checks |
| PENDING_APPROVAL_Lx | APPROVED | Approve | Final level for amount |
| PENDING_APPROVAL_Lx | PENDING_APPROVAL_L(x+1) | Approve | Escalate to next level |
| PENDING_APPROVAL_Lx | REJECTED | Reject | Any level rejects |
| PENDING_APPROVAL_Lx | RETURNED | Return | Needs revision |
| RETURNED | DRAFT | Edit | Re-open for editing |
| APPROVED | PENDING_DISBURSEMENT | Initiate | Conditions met |
| APPROVED | CANCELLED | Cancel | Bank/customer cancels |

---

## 4. Approval Process Types

### 4.1 Standard Approval

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       STANDARD APPROVAL PROCESS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Application submitted by Branch User                                    │
│  2. Credit Analyst performs initial assessment                              │
│  3. CIB inquiry executed                                                    │
│  4. Credit score calculated                                                 │
│  5. DMN determines required approval level                                  │
│  6. Task assigned to appropriate approver(s)                                │
│  7. Sequential approval through required levels                             │
│  8. Final approval recorded                                                 │
│  9. Notification sent to customer                                           │
│                                                                              │
│  TAT Target: < 48 hours total                                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Fast-Track Approval

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FAST-TRACK APPROVAL PROCESS                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ELIGIBILITY CRITERIA:                                                      │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Existing customer with 12+ months relationship                           │
│  • Credit score ≥ 750                                                       │
│  • No existing DPD > 0                                                      │
│  • Loan amount within pre-approved limit                                    │
│  • Product category: Personal, Auto (not Home/SME/Corporate)               │
│                                                                              │
│  FAST-TRACK FLOW:                                                           │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐                │
│  │ Submit   │──▶│ Auto-CIB │──▶│ Auto-    │──▶│ APPROVED │                │
│  │          │   │ Check    │   │ Scoring  │   │ (System) │                │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘                │
│                                                                              │
│  TAT Target: < 30 minutes (system processing only)                          │
│  Human Review: None (post-approval audit)                                   │
│                                                                              │
│  LIMITS:                                                                    │
│  • Premium customers (score ≥ 850, 36+ months): Up to 5 Lakh               │
│  • Good customers (score ≥ 750, 24+ months): Up to 3 Lakh                  │
│  • Standard customers (score ≥ 650, 12+ months): Up to 1 Lakh              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Conditional Approval

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CONDITIONAL APPROVAL PROCESS                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CONDITION TYPES:                                                           │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • DOCUMENT_PENDING - Missing documents required before disbursement        │
│  • COLLATERAL_PENDING - Collateral registration required                    │
│  • INSURANCE_PENDING - Insurance policy required                            │
│  • GUARANTOR_PENDING - Guarantor verification pending                       │
│  • REDUCED_AMOUNT - Approved for lesser amount                              │
│  • INCREASED_RATE - Approved with higher interest rate                      │
│  • ADDITIONAL_SECURITY - Additional security required                       │
│                                                                              │
│  CONDITION TRACKING:                                                        │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  {                                                                           │
│    "conditionId": "COND-001",                                               │
│    "conditionType": "DOCUMENT_PENDING",                                     │
│    "description": "Submit salary certificate for last 3 months",           │
│    "deadline": "2026-02-15T23:59:59Z",                                      │
│    "status": "PENDING",                                                     │
│    "addedBy": "approver123",                                                │
│    "addedAt": "2026-02-05T10:30:00Z"                                        │
│  }                                                                           │
│                                                                              │
│  DISBURSEMENT BLOCKED until all conditions marked as MET                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.4 Committee Approval (L5)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CREDIT COMMITTEE APPROVAL PROCESS                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  COMMITTEE COMPOSITION:                                                     │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Chairman: Head of Credit or Deputy MD                                    │
│  • Members: 3-5 senior credit officers                                      │
│  • Secretary: Credit Admin (non-voting)                                     │
│                                                                              │
│  MEETING WORKFLOW:                                                          │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  1. Agenda Preparation                                                      │
│     - System compiles pending L5 applications                               │
│     - Credit memos attached                                                 │
│     - Previous meeting minutes attached                                     │
│                                                                              │
│  2. Meeting Scheduling                                                      │
│     - Minimum 24 hours notice                                               │
│     - Quorum verification                                                   │
│     - Virtual participation allowed                                         │
│                                                                              │
│  3. Voting Process                                                          │
│     ┌──────────────────────────────────────────────────────────────────┐   │
│     │  Application: APP-2026-001234                                     │   │
│     │  Amount: 3,50,00,000 BDT                                         │   │
│     │  ─────────────────────────────────────────────────────────────   │   │
│     │  Member 1 (HOC):     [✓] APPROVE  [ ] REJECT  [ ] DEFER          │   │
│     │  Member 2 (Sr. Mgr): [✓] APPROVE  [ ] REJECT  [ ] DEFER          │   │
│     │  Member 3 (Sr. Mgr): [ ] APPROVE  [✓] REJECT  [ ] DEFER          │   │
│     │  Member 4 (Mgr):     [✓] APPROVE  [ ] REJECT  [ ] DEFER          │   │
│     │  ─────────────────────────────────────────────────────────────   │   │
│     │  Result: APPROVED (3-1)                                           │   │
│     │  Chairman concurs: [✓]                                            │   │
│     └──────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  4. Minutes Generation                                                      │
│     - Auto-generated from voting                                            │
│     - Digital signatures required                                           │
│     - PDF archived for compliance                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. SLA Management

### 5.1 SLA Configuration by Level

| Level | Role | Standard SLA | Urgent SLA | Escalation After | Escalation To |
|-------|------|-------------|------------|------------------|---------------|
| L1 | Branch Credit Head | 4 hours | 2 hours | 6 hours | L2 |
| L2 | Branch Manager | 6 hours | 3 hours | 8 hours | L3 |
| L3 | Regional Manager | 8 hours | 4 hours | 12 hours | L4 |
| L4 | Head of Credit | 12 hours | 6 hours | 18 hours | L5 |
| L5 | Credit Committee | 24 hours | 12 hours | 36 hours | L6 |
| L6 | Deputy MD | 48 hours | 24 hours | 72 hours | L7 |
| L7 | Managing Director | 72 hours | 48 hours | 96 hours | Board/EC |

### 5.2 SLA Breach Handling

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SLA BREACH HANDLING PROCESS                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  BREACH DETECTION:                                                          │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Scheduled job runs every 15 minutes                                      │
│  • Checks pending_approval_since vs approval_sla_due_at                     │
│  • Marks is_sla_breached = TRUE when breached                               │
│                                                                              │
│  ESCALATION ACTIONS:                                                        │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  At SLA Breach:                                                             │
│  1. Send notification to current approver (reminder)                        │
│  2. Send notification to approver's supervisor                              │
│  3. Log SLA breach in audit trail                                           │
│  4. Increment breach counter for approver                                   │
│                                                                              │
│  At Escalation Threshold (SLA + 50%):                                       │
│  1. Auto-escalate to next approval level                                    │
│  2. Mark original task as "ESCALATED_DUE_TO_SLA"                           │
│  3. Send escalation notification to all stakeholders                        │
│  4. Flag for management review                                              │
│                                                                              │
│  BREACH METRICS:                                                            │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • ulms.workflow.sla.breached (Counter by level)                           │
│  • ulms.workflow.sla.breach_duration (Histogram)                            │
│  • ulms.workflow.sla.compliance_rate (Gauge)                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 SLA Tracking Database Schema

```sql
-- SLA tracking in loan table
ALTER TABLE m_loan ADD COLUMN IF NOT EXISTS
    pending_approval_since TIMESTAMP WITH TIME ZONE,
    approval_sla_due_at TIMESTAMP WITH TIME ZONE,
    is_sla_breached BOOLEAN DEFAULT FALSE,
    sla_breach_count INTEGER DEFAULT 0;

-- SLA breach history
CREATE TABLE sla_breach_history (
    id BIGSERIAL PRIMARY KEY,
    loan_id BIGINT NOT NULL,
    approval_level INTEGER NOT NULL,
    task_id VARCHAR(100),
    sla_due_at TIMESTAMP WITH TIME ZONE NOT NULL,
    breach_detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    breach_duration_hours DECIMAL(10,2),
    escalated BOOLEAN DEFAULT FALSE,
    escalated_at TIMESTAMP WITH TIME ZONE,
    escalated_to_level INTEGER,

    CONSTRAINT fk_sla_breach_loan FOREIGN KEY (loan_id)
        REFERENCES m_loan(id)
);

CREATE INDEX idx_sla_breach_loan ON sla_breach_history(loan_id);
CREATE INDEX idx_sla_breach_level ON sla_breach_history(approval_level);
```

---

## 6. Notification Specifications

### 6.1 Notification Triggers

| Event | Recipients | Channels | Priority |
|-------|------------|----------|----------|
| Task Created | Approver(s), Applicant | Email, Push | Normal |
| Task Completed | Next Approver, Applicant | Email, Push | Normal |
| SLA Warning (80%) | Approver | Email, SMS, Push | High |
| SLA Breached | Approver, Supervisor | Email, SMS, Push | Critical |
| Loan Approved | Applicant, Branch | Email, SMS | Normal |
| Loan Rejected | Applicant, Branch | Email | Normal |
| Return for Revision | Applicant, Branch | Email, Push | Normal |
| Delegation | Delegate, Original Approver | Email, Push | Normal |

### 6.2 Notification Templates

#### 6.2.1 Approval Task Created

```json
{
  "templateId": "TASK_CREATED",
  "subject": "Loan Approval Required - {{applicationNumber}}",
  "channels": ["EMAIL", "PUSH"],
  "body": {
    "email": {
      "html": "templates/email/task-created.html",
      "plain": "templates/email/task-created.txt"
    },
    "push": {
      "title": "New Approval Task",
      "body": "Loan {{applicationNumber}} requires your approval. Amount: {{loanAmount}} BDT"
    }
  },
  "variables": [
    "applicationNumber",
    "loanAmount",
    "customerName",
    "productName",
    "slaDueAt",
    "approvalLevel"
  ]
}
```

#### 6.2.2 SLA Breach Alert

```json
{
  "templateId": "SLA_BREACHED",
  "subject": "URGENT: SLA Breached - {{applicationNumber}}",
  "channels": ["EMAIL", "SMS", "PUSH"],
  "priority": "CRITICAL",
  "body": {
    "email": {
      "html": "templates/email/sla-breached.html"
    },
    "sms": "URGENT: Loan {{applicationNumber}} SLA breached. Pending since {{pendingSince}}. Please take action immediately.",
    "push": {
      "title": "SLA BREACH ALERT",
      "body": "{{applicationNumber}} is overdue by {{breachDuration}}. Escalation imminent."
    }
  }
}
```

### 6.3 Notification Service Integration

```java
@Service
@RequiredArgsConstructor
public class WorkflowNotificationService {

    private final NotificationClient notificationClient;
    private final TemplateEngine templateEngine;

    public void sendTaskCreatedNotification(WorkflowTask task, Loan loan) {
        Map<String, Object> variables = Map.of(
            "applicationNumber", loan.getApplicationRef(),
            "loanAmount", formatAmount(loan.getProposedPrincipal()),
            "customerName", loan.getClientName(),
            "productName", loan.getProductName(),
            "slaDueAt", formatDateTime(task.getSlaDueAt()),
            "approvalLevel", "L" + task.getApprovalLevel()
        );

        NotificationRequest request = NotificationRequest.builder()
            .templateId("TASK_CREATED")
            .recipients(getApproversForGroup(task.getCandidateGroup()))
            .variables(variables)
            .priority(NotificationPriority.NORMAL)
            .build();

        notificationClient.send(request);
    }

    public void sendSLABreachNotification(Loan loan, int level) {
        Map<String, Object> variables = Map.of(
            "applicationNumber", loan.getApplicationRef(),
            "pendingSince", formatDateTime(loan.getPendingApprovalSince()),
            "breachDuration", calculateBreachDuration(loan)
        );

        NotificationRequest request = NotificationRequest.builder()
            .templateId("SLA_BREACHED")
            .recipients(getApproversAndSupervisors(level))
            .variables(variables)
            .priority(NotificationPriority.CRITICAL)
            .build();

        notificationClient.send(request);
    }
}
```

---

## 7. Digital Signature Requirements

### 7.1 Signature Types

| Signature Type | Use Case | Implementation |
|----------------|----------|----------------|
| Simple Signature | Internal approvals L1-L3 | Canvas capture + timestamp |
| Advanced Signature | Approvals L4+ | PKI certificate-based |
| Qualified Signature | Customer agreements | Third-party CA (e.g., DigiCert) |

### 7.2 Signature Capture Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DIGITAL SIGNATURE CAPTURE FLOW                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. USER AUTHENTICATION                                                     │
│     ┌──────────────────────────────────────────────────────────────────┐   │
│     │  • Verify JWT token                                               │   │
│     │  • Check user has APPROVER role                                   │   │
│     │  • Validate task assignment                                       │   │
│     └──────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  2. SIGNATURE CAPTURE                                                       │
│     ┌──────────────────────────────────────────────────────────────────┐   │
│     │  For L1-L3 (Simple):                                              │   │
│     │  • Capture signature on canvas                                    │   │
│     │  • Convert to PNG image                                           │   │
│     │  • Store with timestamp and user ID                               │   │
│     │                                                                    │   │
│     │  For L4+ (Advanced):                                              │   │
│     │  • Request PKI certificate from Vault                             │   │
│     │  • Generate signature using private key                           │   │
│     │  • Include certificate in signature                               │   │
│     └──────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  3. SIGNATURE STORAGE                                                       │
│     ┌──────────────────────────────────────────────────────────────────┐   │
│     │  {                                                                │   │
│     │    "signatureId": "SIG-2026-001234",                             │   │
│     │    "loanId": 12345,                                               │   │
│     │    "taskId": "task-xyz",                                          │   │
│     │    "signedBy": "approver123",                                     │   │
│     │    "signedAt": "2026-02-05T10:30:00Z",                           │   │
│     │    "signatureType": "ADVANCED",                                   │   │
│     │    "signatureImage": "base64...",                                 │   │
│     │    "certificateSerial": "ABC123...",                              │   │
│     │    "signatureHash": "sha256:...",                                 │   │
│     │    "ipAddress": "192.168.1.100",                                  │   │
│     │    "userAgent": "Mozilla/5.0..."                                  │   │
│     │  }                                                                │   │
│     └──────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  4. SIGNATURE VERIFICATION                                                  │
│     • Hash verification for tampering detection                             │
│     • Certificate validation for PKI signatures                             │
│     • Timestamp verification                                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Integration Specifications

### 8.1 Integration Points

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       WORKFLOW SERVICE INTEGRATIONS                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                              ┌─────────────────┐                            │
│                              │  Workflow       │                            │
│                              │  Service        │                            │
│                              │  (Port 8083)    │                            │
│                              └────────┬────────┘                            │
│                                       │                                      │
│     ┌─────────────────────────────────┼─────────────────────────────────┐   │
│     │                                 │                                  │   │
│     ▼                                 ▼                                  ▼   │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐ │
│  │   CIB    │   │   NID    │   │Notifica- │   │Fineract  │   │ Integra- │ │
│  │ Service  │   │ Service  │   │   tion   │   │  Core    │   │   tion   │ │
│  │(Port 8081)│  │(Port 8082)│  │(Port 8086)│  │(Port 8443)│  │ Gateway  │ │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘   │(Port 8088)│ │
│                                                              └──────────┘ │
│                                                                              │
│  KAFKA TOPICS:                                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • loan.applications (publish)                                              │
│  • loan.approvals (publish)                                                 │
│  • loan.status-changes (publish)                                            │
│  • cib.results (subscribe)                                                  │
│  • nid.verification (subscribe)                                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 CIB Service Integration

```java
@Component
@RequiredArgsConstructor
public class CIBIntegrationService {

    private final CIBServiceClient cibClient;
    private final CircuitBreaker circuitBreaker;

    @Retry(name = "cibService", fallbackMethod = "cibFallback")
    @CircuitBreaker(name = "cibService")
    public CIBResult inquire(String nid, Long loanId) {
        CIBInquiryRequest request = CIBInquiryRequest.builder()
            .nid(nid)
            .inquiryType("INDIVIDUAL")
            .referenceId(loanId.toString())
            .build();

        return cibClient.inquire(request);
    }

    private CIBResult cibFallback(String nid, Long loanId, Exception e) {
        log.error("CIB inquiry failed for NID {}: {}", nid, e.getMessage());
        throw new CIBServiceException("CIB service unavailable", e);
    }
}
```

### 8.3 Notification Service Integration

| Event | HTTP Method | Endpoint | Async |
|-------|-------------|----------|-------|
| Send Email | POST | /api/v1/notifications/email | Yes |
| Send SMS | POST | /api/v1/notifications/sms | Yes |
| Send Push | POST | /api/v1/notifications/push | Yes |
| Send Bulk | POST | /api/v1/notifications/bulk | Yes |

---

## 9. REST API Specifications

### 9.1 API Overview

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/v1/workflow/start | Start approval workflow | JWT |
| POST | /api/v1/workflow/approve/{taskId} | Approve at current level | JWT |
| POST | /api/v1/workflow/reject/{taskId} | Reject application | JWT |
| POST | /api/v1/workflow/return/{taskId} | Return for revision | JWT |
| POST | /api/v1/workflow/delegate/{taskId} | Delegate to another user | JWT |
| GET | /api/v1/workflow/pending | Get pending tasks | JWT |
| GET | /api/v1/workflow/status/{processId} | Get workflow status | JWT |
| GET | /api/v1/workflow/history/{loanId} | Get approval history | JWT |
| GET | /api/v1/workflow/sla-breaches | Get SLA breach report | JWT |
| POST | /api/v1/workflow/escalate/{taskId} | Manual escalation | JWT |

### 9.2 OpenAPI Specification

```yaml
openapi: 3.0.3
info:
  title: ULMS Workflow Service API
  description: Loan Approval Workflow REST API
  version: 1.0.0
  contact:
    name: ULMS Development Team
    email: dev@ulms.com

servers:
  - url: http://localhost:8083/api/v1/workflow
    description: Local Development
  - url: https://api.ulms.com/workflow/api/v1
    description: Production

security:
  - bearerAuth: []

paths:
  /start:
    post:
      summary: Start approval workflow
      operationId: startWorkflow
      tags:
        - Workflow
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/StartWorkflowRequest'
      responses:
        '201':
          description: Workflow started successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/WorkflowResponse'
        '400':
          description: Invalid request
        '401':
          description: Unauthorized
        '404':
          description: Loan not found

  /approve/{taskId}:
    post:
      summary: Approve loan at current level
      operationId: approveTask
      tags:
        - Approval
      parameters:
        - name: taskId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ApprovalRequest'
      responses:
        '200':
          description: Approval recorded
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApprovalResponse'
        '400':
          description: Invalid request or cannot approve
        '401':
          description: Unauthorized
        '403':
          description: User not authorized to approve
        '404':
          description: Task not found

  /reject/{taskId}:
    post:
      summary: Reject loan application
      operationId: rejectTask
      tags:
        - Approval
      parameters:
        - name: taskId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RejectionRequest'
      responses:
        '200':
          description: Rejection recorded
        '400':
          description: Invalid request
        '401':
          description: Unauthorized

  /pending:
    get:
      summary: Get pending approval tasks
      operationId: getPendingTasks
      tags:
        - Tasks
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 0
        - name: size
          in: query
          schema:
            type: integer
            default: 20
        - name: level
          in: query
          schema:
            type: integer
        - name: branchId
          in: query
          schema:
            type: string
      responses:
        '200':
          description: List of pending tasks
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PendingTasksResponse'

  /status/{processId}:
    get:
      summary: Get workflow status
      operationId: getWorkflowStatus
      tags:
        - Status
      parameters:
        - name: processId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Workflow status
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/WorkflowStatusResponse'

  /history/{loanId}:
    get:
      summary: Get approval history
      operationId: getApprovalHistory
      tags:
        - History
      parameters:
        - name: loanId
          in: path
          required: true
          schema:
            type: integer
            format: int64
      responses:
        '200':
          description: Approval history
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApprovalHistoryResponse'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    StartWorkflowRequest:
      type: object
      required:
        - loanId
      properties:
        loanId:
          type: integer
          format: int64
          description: Loan ID to start workflow for
        priority:
          type: string
          enum: [NORMAL, URGENT]
          default: NORMAL

    ApprovalRequest:
      type: object
      required:
        - decision
      properties:
        decision:
          type: string
          enum: [APPROVE, APPROVE_WITH_CONDITIONS]
        approvedAmount:
          type: number
          description: Approved amount (if different from requested)
        comments:
          type: string
          maxLength: 2000
        conditions:
          type: array
          items:
            $ref: '#/components/schemas/ApprovalCondition'
        signature:
          type: string
          description: Base64 encoded digital signature

    ApprovalCondition:
      type: object
      required:
        - conditionType
        - description
      properties:
        conditionType:
          type: string
          enum: [DOCUMENT_PENDING, COLLATERAL_PENDING, INSURANCE_PENDING, OTHER]
        description:
          type: string
        deadline:
          type: string
          format: date-time

    RejectionRequest:
      type: object
      required:
        - reason
      properties:
        reason:
          type: string
          maxLength: 500
        comments:
          type: string
          maxLength: 2000
        signature:
          type: string

    WorkflowResponse:
      type: object
      properties:
        processInstanceId:
          type: string
        loanId:
          type: integer
          format: int64
        applicationNumber:
          type: string
        currentStatus:
          type: string
        currentApprovalLevel:
          type: integer
        nextApprover:
          type: string
        slaDueAt:
          type: string
          format: date-time

    ApprovalResponse:
      type: object
      properties:
        taskId:
          type: string
        decision:
          type: string
        approvalLevel:
          type: integer
        nextStatus:
          type: string
        nextApprovalLevel:
          type: integer
        isComplete:
          type: boolean

    PendingTasksResponse:
      type: object
      properties:
        content:
          type: array
          items:
            $ref: '#/components/schemas/PendingTask'
        totalElements:
          type: integer
        totalPages:
          type: integer
        page:
          type: integer
        size:
          type: integer

    PendingTask:
      type: object
      properties:
        taskId:
          type: string
        loanId:
          type: integer
          format: int64
        applicationNumber:
          type: string
        customerName:
          type: string
        loanAmount:
          type: number
        productName:
          type: string
        approvalLevel:
          type: integer
        createdAt:
          type: string
          format: date-time
        slaDueAt:
          type: string
          format: date-time
        isSlaBreached:
          type: boolean

    WorkflowStatusResponse:
      type: object
      properties:
        processInstanceId:
          type: string
        loanId:
          type: integer
          format: int64
        applicationNumber:
          type: string
        currentStatus:
          type: string
        currentApprovalLevel:
          type: integer
        pendingTaskId:
          type: string
        pendingApprover:
          type: string
        slaDueAt:
          type: string
          format: date-time
        isSlaBreached:
          type: boolean
        history:
          type: array
          items:
            $ref: '#/components/schemas/ApprovalHistoryItem'

    ApprovalHistoryResponse:
      type: object
      properties:
        loanId:
          type: integer
          format: int64
        applicationNumber:
          type: string
        history:
          type: array
          items:
            $ref: '#/components/schemas/ApprovalHistoryItem'

    ApprovalHistoryItem:
      type: object
      properties:
        approvalLevel:
          type: integer
        approverName:
          type: string
        decision:
          type: string
        comments:
          type: string
        approvedAt:
          type: string
          format: date-time
        isSlaBreached:
          type: boolean
```

### 9.3 Sample API Requests/Responses

#### Start Workflow

```bash
POST /api/v1/workflow/start
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "loanId": 12345,
  "priority": "NORMAL"
}

Response (201 Created):
{
  "processInstanceId": "proc-2026-001234",
  "loanId": 12345,
  "applicationNumber": "APP-2026-001234",
  "currentStatus": "UNDER_REVIEW",
  "currentApprovalLevel": null,
  "nextApprover": null,
  "slaDueAt": null
}
```

#### Approve Task

```bash
POST /api/v1/workflow/approve/task-xyz-123
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "decision": "APPROVE",
  "comments": "Approved based on strong credit profile and adequate collateral.",
  "signature": "base64_encoded_signature_image"
}

Response (200 OK):
{
  "taskId": "task-xyz-123",
  "decision": "APPROVE",
  "approvalLevel": 2,
  "nextStatus": "PENDING_APPROVAL_L3",
  "nextApprovalLevel": 3,
  "isComplete": false
}
```

---

## 10. Audit and Compliance

### 10.1 Audit Requirements

| Requirement | Specification |
|-------------|---------------|
| Log Retention | 7 years (regulatory) |
| Immutability | Audit logs cannot be modified |
| Completeness | All approval actions logged |
| Timestamp | UTC with millisecond precision |
| Actor | User ID, role, IP address |

### 10.2 Audit Log Schema

```sql
CREATE TABLE approval_audit_log (
    id BIGSERIAL PRIMARY KEY,

    -- Loan Reference
    loan_id BIGINT NOT NULL,
    application_ref VARCHAR(50),

    -- Task Reference
    task_id VARCHAR(100),
    process_instance_id VARCHAR(100),

    -- Approval Details
    approval_level INTEGER NOT NULL,
    decision VARCHAR(30) NOT NULL,
    comments TEXT,
    conditions JSONB,

    -- Actor
    actor_user_id VARCHAR(100) NOT NULL,
    actor_name VARCHAR(200),
    actor_role VARCHAR(50),
    actor_branch_id VARCHAR(20),

    -- Delegate (if delegated)
    delegated_from_user_id VARCHAR(100),
    delegation_reason VARCHAR(500),

    -- SLA
    sla_due_at TIMESTAMP WITH TIME ZONE,
    is_sla_breached BOOLEAN DEFAULT FALSE,

    -- Signature
    signature_id VARCHAR(100),
    signature_type VARCHAR(30),

    -- Context
    ip_address INET,
    user_agent VARCHAR(500),
    correlation_id VARCHAR(100),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Tenant
    tenant_id VARCHAR(50) NOT NULL,

    -- Constraints
    CONSTRAINT fk_audit_loan FOREIGN KEY (loan_id) REFERENCES m_loan(id)
);

-- Indexes for query performance
CREATE INDEX idx_audit_loan ON approval_audit_log(loan_id);
CREATE INDEX idx_audit_date ON approval_audit_log(created_at);
CREATE INDEX idx_audit_actor ON approval_audit_log(actor_user_id);
CREATE INDEX idx_audit_level ON approval_audit_log(approval_level);
CREATE INDEX idx_audit_tenant ON approval_audit_log(tenant_id);

-- BRIN index for time-series queries
CREATE INDEX brin_audit_date ON approval_audit_log USING BRIN(created_at);

COMMENT ON TABLE approval_audit_log IS 'Immutable audit trail for all loan approval decisions';
```

### 10.3 Compliance Reports

| Report | Frequency | Purpose | Recipients |
|--------|-----------|---------|------------|
| SLA Compliance | Daily | Track approval time compliance | Management |
| Approval Activity | Weekly | Volume and distribution | Credit Head |
| Delegation Report | Monthly | Track delegated approvals | Audit |
| Breach Summary | Monthly | SLA violations by level | Compliance |
| Authority Utilization | Quarterly | Usage vs limits | Board |

---

## 11. Business Rules Engine

### 11.1 Pre-Approval Checks

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PRE-APPROVAL BUSINESS RULES                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  RULE 1: CIB Status Check                                                   │
│  ─────────────────────────────────────────────────────────────────────────  │
│  IF cibStatus IN ('DEFAULTER', 'WRITTEN_OFF', 'BLACKLISTED')               │
│  THEN REJECT with reason "Adverse CIB status"                              │
│                                                                              │
│  RULE 2: Existing Exposure Check                                            │
│  ─────────────────────────────────────────────────────────────────────────  │
│  IF (existingExposure + proposedAmount) > maxExposureLimit                 │
│  THEN FLAG for senior review OR REJECT                                     │
│                                                                              │
│  RULE 3: DBR Threshold Check                                                │
│  ─────────────────────────────────────────────────────────────────────────  │
│  IF dbrPercentage > 50%                                                     │
│  THEN WARN "High debt burden" AND ESCALATE +1 level                        │
│                                                                              │
│  RULE 4: Age Eligibility                                                    │
│  ─────────────────────────────────────────────────────────────────────────  │
│  IF customerAge < 21 OR customerAge > 60                                   │
│  THEN REJECT with reason "Age not within eligible range"                   │
│                                                                              │
│  RULE 5: Product Eligibility                                                │
│  ─────────────────────────────────────────────────────────────────────────  │
│  IF productCategory == "SME" AND customerType != "SME"                     │
│  THEN REJECT with reason "Customer type mismatch for product"              │
│                                                                              │
│  RULE 6: Branch Limit Check                                                 │
│  ─────────────────────────────────────────────────────────────────────────  │
│  IF branchMonthlyDisbursement >= branchDisbursementLimit                   │
│  THEN FLAG for Regional Manager review                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Approval Authority Validation

```java
@Component
public class ApprovalAuthorityValidator {

    public ValidationResult validateApprovalAuthority(
            Loan loan,
            User approver,
            int approvalLevel) {

        ValidationResult result = new ValidationResult();

        // 1. Check user has required role
        if (!approver.hasRole(getRoleForLevel(approvalLevel))) {
            result.addError("User does not have authority for level L" + approvalLevel);
        }

        // 2. Check branch scope (L1-L3)
        if (approvalLevel <= 3 && !isInBranchScope(loan, approver)) {
            result.addError("Loan not within approver's branch scope");
        }

        // 3. Check regional scope (L3)
        if (approvalLevel == 3 && !isInRegionalScope(loan, approver)) {
            result.addError("Loan not within approver's regional scope");
        }

        // 4. Check amount within authority
        BigDecimal maxAmount = getMaxAmountForLevel(approvalLevel);
        if (loan.getProposedPrincipal().compareTo(maxAmount) > 0 && approvalLevel < 7) {
            result.addError("Amount exceeds authority limit for L" + approvalLevel);
        }

        // 5. Check not approving own application
        if (loan.getCreatedBy().equals(approver.getUserId())) {
            result.addError("Cannot approve own loan application");
        }

        // 6. Check previous level approved (sequential approval)
        if (approvalLevel > 1 && !isPreviousLevelApproved(loan, approvalLevel)) {
            result.addError("Previous approval level not completed");
        }

        return result;
    }

    private String getRoleForLevel(int level) {
        return switch (level) {
            case 1 -> "BRANCH_CREDIT_HEAD";
            case 2 -> "BRANCH_MANAGER";
            case 3 -> "REGIONAL_MANAGER";
            case 4 -> "HEAD_OF_CREDIT";
            case 5 -> "CREDIT_COMMITTEE";
            case 6 -> "DEPUTY_MD";
            case 7 -> "MANAGING_DIRECTOR";
            default -> throw new IllegalArgumentException("Invalid level: " + level);
        };
    }

    private BigDecimal getMaxAmountForLevel(int level) {
        return switch (level) {
            case 1 -> new BigDecimal("500000");
            case 2 -> new BigDecimal("1000000");
            case 3 -> new BigDecimal("2500000");
            case 4 -> new BigDecimal("10000000");
            case 5 -> new BigDecimal("50000000");
            case 6 -> new BigDecimal("100000000");
            case 7 -> BigDecimal.valueOf(Long.MAX_VALUE); // Unlimited
            default -> BigDecimal.ZERO;
        };
    }
}
```

---

## 12. Compliance Matrix

### 12.1 Regulatory Compliance

| Requirement | Regulation | Document Section | Implementation |
|-------------|------------|------------------|----------------|
| 7-level approval | BRD 6.3.1 | Section 2 | Approval Authority Matrix |
| SLA tracking | BRD 6.3.2 | Section 5 | SLA Management |
| Audit trail | ICT Security V4.0 | Section 10 | Audit Log Schema |
| Digital signatures | BRD 6.3.5 | Section 7 | PKI Integration |
| Notification | BRD 6.3.4 | Section 6 | Notification Service |
| API security | ICT Security V4.0 | Section 9 | JWT Authentication |

### 12.2 Document References

| Reference Document | Location | Relevant Sections |
|-------------------|----------|-------------------|
| Camunda BPMN Workflow Design | Phase_1/Workflow Architecture/ | All sections |
| DMN Decision Tables | Phase_1/Workflow Architecture/ | Section 4 |
| Workflow State Machine | Phase_1/Workflow Architecture/ | Section 3 |
| RBAC Authorization Matrix | Phase_1/Security Architecture/ | Section 3 |
| Event Driven Architecture | Phase_1/ARCHITECTURE & DESIGN/ | Section 4 |
| BRD | Root directory | Section 6.3 |
| SRS | Root directory | Section 3.3 |

---

## Appendix A: Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| WF-001 | 400 | Invalid workflow request |
| WF-002 | 404 | Loan not found |
| WF-003 | 404 | Task not found |
| WF-004 | 403 | User not authorized for this action |
| WF-005 | 400 | Task already completed |
| WF-006 | 400 | Invalid approval decision |
| WF-007 | 400 | Comments required for rejection |
| WF-008 | 400 | Amount exceeds approval authority |
| WF-009 | 409 | Workflow already started |
| WF-010 | 400 | Previous level approval required |
| WF-011 | 400 | Cannot delegate at this level |
| WF-012 | 400 | Quorum not met for committee approval |

---

**Document End**

*This document is part of the ULMS v2.0 Architecture Documentation Suite*

*Last Updated: February 5, 2026*

# Data Model - Loan Applications
## Workflow States and Lifecycle Management
### Unisoft Loan Management System (ULMS) v2.0

---

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ULMS-ARCH-1.3.4 |
| **Document Title** | Data Model - Loan Applications (Workflow States) |
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
| 1.0 | 2026-02-05 | Lead Dev | Initial Loan Applications Data Model |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Loan Product Configuration](#2-loan-product-configuration)
3. [Loan Master Table](#3-loan-master-table)
4. [Loan Status State Machine](#4-loan-status-state-machine)
5. [Repayment Schedule](#5-repayment-schedule)
6. [Loan Transactions](#6-loan-transactions)
7. [Collateral Management](#7-collateral-management)
8. [Guarantor Information](#8-guarantor-information)
9. [Loan Charges](#9-loan-charges)
10. [Disbursement Management](#10-disbursement-management)
11. [Loan Modification History](#11-loan-modification-history)
12. [Workflow Integration](#12-workflow-integration)
13. [Flyway Migration Scripts](#13-flyway-migration-scripts)
14. [Compliance Matrix](#14-compliance-matrix)

---

## 1. Introduction

### 1.1 Purpose

This document defines the data model for Loan Applications in ULMS v2.0, covering:
- Loan product configuration
- Loan lifecycle states (from application to closure/write-off)
- Camunda workflow integration
- 7-level approval hierarchy (L1-L7)
- Repayment schedules and transactions

### 1.2 Scope

| Aspect | Coverage |
|--------|----------|
| **Primary Table** | m_loan (loan master) |
| **Supporting Tables** | 12 tables (product, schedule, transaction, collateral, etc.) |
| **Workflow Engine** | Camunda 8.3 integration |
| **Approval Levels** | L1 (Branch) to L7 (Board/BOCC) |

### 1.3 Loan Status Overview

| Status | Description | Next States |
|--------|-------------|-------------|
| DRAFT | Initial data entry | SUBMITTED, CANCELLED |
| SUBMITTED | Application submitted | UNDER_REVIEW, RETURNED |
| UNDER_REVIEW | Credit assessment | APPROVED, REJECTED, RETURNED |
| APPROVED | Final approval granted | DISBURSED, CANCELLED |
| REJECTED | Application rejected | (terminal) |
| DISBURSED | Funds released | ACTIVE |
| ACTIVE | Loan in repayment | CLOSED, WRITTEN_OFF |
| CLOSED | Fully repaid | (terminal) |
| WRITTEN_OFF | Bad debt written off | (terminal) |

---

## 2. Loan Product Configuration

### 2.1 Table Definition: ref_loan_product

```sql
-- Table: {tenant_schema}.ref_loan_product
-- Purpose: Loan product configuration and terms

CREATE TABLE ref_loan_product (
    -- Primary Key
    id SERIAL PRIMARY KEY,

    -- Product Identification
    product_code VARCHAR(20) UNIQUE NOT NULL,         -- "PL-PERSONAL-001"
    product_name VARCHAR(100) NOT NULL,
    product_name_bn VARCHAR(100),                     -- Bengali name
    product_short_name VARCHAR(30),
    description TEXT,

    -- Product Classification
    product_type VARCHAR(30) NOT NULL,                -- PERSONAL, HOME, AUTO, SME, CORPORATE, ISLAMIC
    product_category VARCHAR(30),                     -- RETAIL, SME, CORPORATE
    is_islamic BOOLEAN NOT NULL DEFAULT FALSE,

    -- ═══════════════════════════════════════════════════════════════════════
    -- PRINCIPAL CONFIGURATION
    -- ═══════════════════════════════════════════════════════════════════════
    currency_code VARCHAR(3) NOT NULL DEFAULT 'BDT',
    min_principal DECIMAL(15,2) NOT NULL,
    max_principal DECIMAL(15,2) NOT NULL,
    principal_multiple_of DECIMAL(10,2) DEFAULT 1000,

    -- ═══════════════════════════════════════════════════════════════════════
    -- INTEREST CONFIGURATION
    -- ═══════════════════════════════════════════════════════════════════════
    interest_method VARCHAR(30) NOT NULL DEFAULT 'DECLINING_BALANCE',
    -- FLAT, DECLINING_BALANCE, DECLINING_BALANCE_EQUAL_INSTALLMENTS
    min_interest_rate DECIMAL(5,2) NOT NULL,
    max_interest_rate DECIMAL(5,2) NOT NULL,
    default_interest_rate DECIMAL(5,2),
    interest_calculation_period VARCHAR(20) DEFAULT 'DAILY',
    -- DAILY, SAME_AS_REPAYMENT, MONTHLY

    -- Islamic Finance (Murabaha)
    profit_rate DECIMAL(5,2),                         -- For Islamic products

    -- ═══════════════════════════════════════════════════════════════════════
    -- TERM CONFIGURATION
    -- ═══════════════════════════════════════════════════════════════════════
    min_term_months INTEGER NOT NULL,
    max_term_months INTEGER NOT NULL,
    default_term_months INTEGER,
    repayment_frequency VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
    -- DAILY, WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY

    -- Moratorium/Grace Period
    grace_on_principal_periods INTEGER DEFAULT 0,
    grace_on_interest_periods INTEGER DEFAULT 0,
    grace_on_interest_charged VARCHAR(20) DEFAULT 'NONE',
    -- NONE, CAPITALIZE, WAIVE

    -- ═══════════════════════════════════════════════════════════════════════
    -- AMORTIZATION
    -- ═══════════════════════════════════════════════════════════════════════
    amortization_type VARCHAR(30) NOT NULL DEFAULT 'EQUAL_INSTALLMENTS',
    -- EQUAL_INSTALLMENTS, EQUAL_PRINCIPAL_PAYMENTS, BALLOON

    -- ═══════════════════════════════════════════════════════════════════════
    -- CHARGES CONFIGURATION
    -- ═══════════════════════════════════════════════════════════════════════
    processing_fee_type VARCHAR(20) DEFAULT 'PERCENTAGE',
    -- FLAT, PERCENTAGE
    processing_fee_value DECIMAL(10,2),
    late_payment_fee_type VARCHAR(20) DEFAULT 'PERCENTAGE',
    late_payment_fee_value DECIMAL(10,2),
    prepayment_penalty_type VARCHAR(20),
    prepayment_penalty_value DECIMAL(10,2),
    charges_config JSONB,                             -- Additional charges configuration

    -- ═══════════════════════════════════════════════════════════════════════
    -- COLLATERAL REQUIREMENTS
    -- ═══════════════════════════════════════════════════════════════════════
    requires_collateral BOOLEAN NOT NULL DEFAULT FALSE,
    min_collateral_coverage DECIMAL(5,2),             -- Minimum collateral coverage %
    allowed_collateral_types JSONB,                   -- Array of allowed collateral types

    -- ═══════════════════════════════════════════════════════════════════════
    -- APPROVAL WORKFLOW
    -- ═══════════════════════════════════════════════════════════════════════
    workflow_definition_key VARCHAR(100),             -- Camunda BPMN process key
    requires_cib_check BOOLEAN NOT NULL DEFAULT TRUE,
    requires_cpv BOOLEAN NOT NULL DEFAULT TRUE,
    max_dpd_for_new_loan INTEGER DEFAULT 30,          -- Max existing DPD for new loan
    max_existing_loans INTEGER,                       -- Max concurrent loans

    -- ═══════════════════════════════════════════════════════════════════════
    -- ACCOUNTING
    -- ═══════════════════════════════════════════════════════════════════════
    fund_source_account_id VARCHAR(30),
    loan_portfolio_account_id VARCHAR(30),
    interest_receivable_account_id VARCHAR(30),
    interest_income_account_id VARCHAR(30),
    fee_income_account_id VARCHAR(30),
    overpayment_liability_account_id VARCHAR(30),
    write_off_account_id VARCHAR(30),
    suspense_interest_account_id VARCHAR(30),

    -- ═══════════════════════════════════════════════════════════════════════
    -- DOCUMENTS REQUIRED
    -- ═══════════════════════════════════════════════════════════════════════
    required_documents JSONB,                         -- List of mandatory documents
    optional_documents JSONB,                         -- List of optional documents

    -- ═══════════════════════════════════════════════════════════════════════
    -- STATUS & AUDIT
    -- ═══════════════════════════════════════════════════════════════════════
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    effective_from_date DATE,
    effective_to_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,

    -- Constraints
    CONSTRAINT pk_ref_loan_product PRIMARY KEY (id),
    CONSTRAINT uq_ref_loan_product_code UNIQUE (product_code),
    CONSTRAINT chk_product_type CHECK (
        product_type IN ('PERSONAL', 'HOME', 'AUTO', 'SME', 'CORPORATE', 'ISLAMIC', 'AGRICULTURE', 'EDUCATION')
    ),
    CONSTRAINT chk_interest_method CHECK (
        interest_method IN ('FLAT', 'DECLINING_BALANCE', 'DECLINING_BALANCE_EQUAL_INSTALLMENTS')
    ),
    CONSTRAINT chk_amortization_type CHECK (
        amortization_type IN ('EQUAL_INSTALLMENTS', 'EQUAL_PRINCIPAL_PAYMENTS', 'BALLOON')
    ),
    CONSTRAINT chk_principal_range CHECK (min_principal <= max_principal),
    CONSTRAINT chk_interest_range CHECK (min_interest_rate <= max_interest_rate),
    CONSTRAINT chk_term_range CHECK (min_term_months <= max_term_months)
);

-- Indexes
CREATE INDEX idx_loan_product_code ON ref_loan_product(product_code);
CREATE INDEX idx_loan_product_type ON ref_loan_product(product_type);
CREATE INDEX idx_loan_product_active ON ref_loan_product(is_active) WHERE is_active = TRUE;

-- Comments
COMMENT ON TABLE ref_loan_product IS 'Loan product configuration and terms';
COMMENT ON COLUMN ref_loan_product.interest_method IS 'FLAT=Simple interest, DECLINING_BALANCE=Reducing balance';
```

### 2.2 Sample Loan Products

| Product Code | Type | Min Amount | Max Amount | Interest Rate | Term |
|--------------|------|------------|------------|---------------|------|
| PL-PERSONAL-001 | PERSONAL | 50,000 | 5,000,000 | 12-18% | 12-60 months |
| PL-HOME-001 | HOME | 500,000 | 50,000,000 | 9-12% | 60-240 months |
| PL-AUTO-001 | AUTO | 300,000 | 10,000,000 | 10-15% | 12-84 months |
| PL-SME-001 | SME | 500,000 | 100,000,000 | 10-14% | 12-84 months |
| PL-ISLAMIC-001 | ISLAMIC | 50,000 | 5,000,000 | 12-16% (profit) | 12-60 months |

---

## 3. Loan Master Table

### 3.1 Table Definition: m_loan

```sql
-- Table: {tenant_schema}.m_loan
-- Purpose: Loan account master with full lifecycle tracking

CREATE TABLE m_loan (
    -- ═══════════════════════════════════════════════════════════════════════
    -- PRIMARY KEY & IDENTIFIERS
    -- ═══════════════════════════════════════════════════════════════════════
    id BIGSERIAL PRIMARY KEY,
    account_no VARCHAR(30) UNIQUE NOT NULL,           -- Loan account number
    external_id VARCHAR(50),                          -- External system reference
    application_ref VARCHAR(50) UNIQUE,               -- Application reference number

    -- ═══════════════════════════════════════════════════════════════════════
    -- FOREIGN KEYS
    -- ═══════════════════════════════════════════════════════════════════════
    client_id BIGINT NOT NULL,                        -- FK to m_client
    product_id INTEGER NOT NULL,                      -- FK to ref_loan_product
    branch_id VARCHAR(20) NOT NULL,                   -- FK to ref_branch
    loan_officer_id VARCHAR(50),                      -- Assigned loan officer
    group_id BIGINT,                                  -- For group lending

    -- Denormalized for performance
    product_code VARCHAR(20) NOT NULL,
    product_name VARCHAR(100),
    branch_name VARCHAR(100),
    client_name VARCHAR(200),
    client_nid VARCHAR(20),

    -- ═══════════════════════════════════════════════════════════════════════
    -- LOAN AMOUNTS
    -- ═══════════════════════════════════════════════════════════════════════
    currency_code VARCHAR(3) NOT NULL DEFAULT 'BDT',

    -- Requested/Submitted
    proposed_principal DECIMAL(15,2) NOT NULL,        -- Customer requested amount
    proposed_interest_rate DECIMAL(5,4),
    proposed_term_months INTEGER,

    -- Approved
    approved_principal DECIMAL(15,2),                 -- Final approved amount
    approved_interest_rate DECIMAL(5,4),
    approved_term_months INTEGER,
    approved_by VARCHAR(100),
    approved_at TIMESTAMP WITH TIME ZONE,

    -- Disbursed
    principal_disbursed DECIMAL(15,2),
    number_of_disbursements INTEGER DEFAULT 1,
    last_disbursement_date DATE,

    -- Outstanding
    principal_outstanding DECIMAL(15,2) NOT NULL DEFAULT 0,
    interest_outstanding DECIMAL(15,2) NOT NULL DEFAULT 0,
    fees_outstanding DECIMAL(15,2) NOT NULL DEFAULT 0,
    penalty_outstanding DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_outstanding DECIMAL(15,2) NOT NULL DEFAULT 0,

    -- Paid
    principal_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
    interest_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
    fees_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
    penalty_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_paid DECIMAL(15,2) NOT NULL DEFAULT 0,

    -- Written Off
    principal_written_off DECIMAL(15,2) DEFAULT 0,
    interest_written_off DECIMAL(15,2) DEFAULT 0,

    -- ═══════════════════════════════════════════════════════════════════════
    -- INTEREST & TERMS
    -- ═══════════════════════════════════════════════════════════════════════
    annual_interest_rate DECIMAL(5,4) NOT NULL,       -- e.g., 0.1200 = 12%
    interest_method VARCHAR(30) NOT NULL,
    interest_calculation_period VARCHAR(20),
    amortization_type VARCHAR(30),

    number_of_repayments INTEGER NOT NULL,
    repayment_every INTEGER NOT NULL DEFAULT 1,
    repayment_frequency VARCHAR(20) NOT NULL DEFAULT 'MONTHS',

    -- Grace Period
    grace_on_principal INTEGER DEFAULT 0,
    grace_on_interest INTEGER DEFAULT 0,

    -- ═══════════════════════════════════════════════════════════════════════
    -- KEY DATES
    -- ═══════════════════════════════════════════════════════════════════════
    application_date DATE NOT NULL DEFAULT CURRENT_DATE,
    submitted_on_date DATE,
    approved_on_date DATE,
    rejected_on_date DATE,
    withdrawn_on_date DATE,
    expected_disbursement_date DATE,
    actual_disbursement_date DATE,
    first_repayment_date DATE,
    expected_maturity_date DATE,
    actual_maturity_date DATE,
    closed_on_date DATE,
    written_off_on_date DATE,

    -- ═══════════════════════════════════════════════════════════════════════
    -- STATUS & CLASSIFICATION
    -- ═══════════════════════════════════════════════════════════════════════
    loan_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    -- DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, WITHDRAWN, DISBURSED, ACTIVE, OVERPAID, CLOSED, WRITTEN_OFF, RESCHEDULED

    sub_status VARCHAR(30),                           -- Additional status detail

    -- BRPD Classification
    classification VARCHAR(20) NOT NULL DEFAULT 'UC',
    -- UC=Unclassified, STD_0, STD_1, STD_2, SMA, SS, DF, BL
    classification_date DATE,
    previous_classification VARCHAR(20),
    dpd INTEGER NOT NULL DEFAULT 0,                   -- Days Past Due
    last_dpd_calculation_date DATE,

    -- ═══════════════════════════════════════════════════════════════════════
    -- WORKFLOW INTEGRATION (Camunda)
    -- ═══════════════════════════════════════════════════════════════════════
    workflow_process_instance_id VARCHAR(100),        -- Camunda process instance ID
    workflow_definition_key VARCHAR(100),
    current_workflow_task_id VARCHAR(100),
    current_approval_level INTEGER,                   -- L1-L7
    pending_approval_since TIMESTAMP WITH TIME ZONE,
    approval_sla_due_at TIMESTAMP WITH TIME ZONE,
    is_sla_breached BOOLEAN DEFAULT FALSE,

    -- ═══════════════════════════════════════════════════════════════════════
    -- FLAGS
    -- ═══════════════════════════════════════════════════════════════════════
    is_npa BOOLEAN NOT NULL DEFAULT FALSE,            -- Non-Performing Asset
    is_rescheduled BOOLEAN NOT NULL DEFAULT FALSE,
    reschedule_count INTEGER DEFAULT 0,
    is_restructured BOOLEAN NOT NULL DEFAULT FALSE,
    restructure_count INTEGER DEFAULT 0,
    is_written_off BOOLEAN NOT NULL DEFAULT FALSE,
    is_waived BOOLEAN NOT NULL DEFAULT FALSE,
    has_collateral BOOLEAN NOT NULL DEFAULT FALSE,
    has_guarantor BOOLEAN NOT NULL DEFAULT FALSE,
    cib_checked BOOLEAN NOT NULL DEFAULT FALSE,
    cib_check_date DATE,
    cpv_completed BOOLEAN NOT NULL DEFAULT FALSE,
    cpv_completion_date DATE,

    -- ═══════════════════════════════════════════════════════════════════════
    -- CREDIT ASSESSMENT
    -- ═══════════════════════════════════════════════════════════════════════
    credit_score INTEGER,
    risk_grade VARCHAR(10),
    debt_burden_ratio DECIMAL(5,2),                   -- DBR %
    loan_to_value_ratio DECIMAL(5,2),                 -- LTV % for secured loans

    -- ═══════════════════════════════════════════════════════════════════════
    -- DISBURSEMENT
    -- ═══════════════════════════════════════════════════════════════════════
    disbursement_account_type VARCHAR(30),            -- SAVINGS, CURRENT, EXTERNAL
    disbursement_account_no VARCHAR(30),
    disbursement_bank_name VARCHAR(100),
    disbursement_bank_branch VARCHAR(100),

    -- ═══════════════════════════════════════════════════════════════════════
    -- LOAN PURPOSE
    -- ═══════════════════════════════════════════════════════════════════════
    loan_purpose_id INTEGER,
    loan_purpose_description TEXT,

    -- ═══════════════════════════════════════════════════════════════════════
    -- NOTES & REMARKS
    -- ═══════════════════════════════════════════════════════════════════════
    application_notes TEXT,
    approval_notes TEXT,
    rejection_reason VARCHAR(200),
    rejection_notes TEXT,
    closure_notes TEXT,

    -- ═══════════════════════════════════════════════════════════════════════
    -- AUDIT COLUMNS
    -- ═══════════════════════════════════════════════════════════════════════
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,

    -- Soft Delete
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by VARCHAR(100),

    -- ═══════════════════════════════════════════════════════════════════════
    -- CONSTRAINTS
    -- ═══════════════════════════════════════════════════════════════════════
    CONSTRAINT pk_m_loan PRIMARY KEY (id),
    CONSTRAINT uq_m_loan_account_no UNIQUE (account_no),
    CONSTRAINT uq_m_loan_application_ref UNIQUE (application_ref),
    CONSTRAINT fk_m_loan_client FOREIGN KEY (client_id)
        REFERENCES m_client(id) ON DELETE RESTRICT,
    CONSTRAINT fk_m_loan_product FOREIGN KEY (product_id)
        REFERENCES ref_loan_product(id),
    CONSTRAINT chk_loan_status CHECK (
        loan_status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'RETURNED', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'PENDING_DISBURSEMENT', 'PARTIALLY_DISBURSED', 'DISBURSED', 'ACTIVE', 'OVERPAID', 'CLOSED', 'WRITTEN_OFF', 'RESCHEDULED', 'CANCELLED')
    ),
    CONSTRAINT chk_loan_classification CHECK (
        classification IN ('UC', 'STD_0', 'STD_1', 'STD_2', 'SMA', 'SS', 'DF', 'BL')
    ),
    CONSTRAINT chk_loan_amounts CHECK (
        proposed_principal > 0 AND
        (approved_principal IS NULL OR approved_principal > 0)
    )
);

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════
CREATE INDEX idx_m_loan_account_no ON m_loan(account_no);
CREATE INDEX idx_m_loan_client ON m_loan(client_id);
CREATE INDEX idx_m_loan_product ON m_loan(product_id);
CREATE INDEX idx_m_loan_branch ON m_loan(branch_id);
CREATE INDEX idx_m_loan_status ON m_loan(loan_status);
CREATE INDEX idx_m_loan_classification ON m_loan(classification);
CREATE INDEX idx_m_loan_dpd ON m_loan(dpd) WHERE dpd > 0;
CREATE INDEX idx_m_loan_workflow ON m_loan(workflow_process_instance_id);
CREATE INDEX idx_m_loan_approval_level ON m_loan(current_approval_level);
CREATE INDEX idx_m_loan_application_date ON m_loan(application_date);
CREATE INDEX idx_m_loan_disbursement_date ON m_loan(actual_disbursement_date);
CREATE INDEX idx_m_loan_maturity_date ON m_loan(expected_maturity_date);
CREATE INDEX idx_m_loan_created ON m_loan(created_at);

-- Partial indexes
CREATE INDEX idx_m_loan_active ON m_loan(client_id, loan_status)
    WHERE loan_status IN ('DISBURSED', 'ACTIVE') AND is_deleted = FALSE;
CREATE INDEX idx_m_loan_pending_approval ON m_loan(current_approval_level, pending_approval_since)
    WHERE loan_status = 'UNDER_REVIEW';
CREATE INDEX idx_m_loan_npa ON m_loan(classification, dpd)
    WHERE is_npa = TRUE;

-- Comments
COMMENT ON TABLE m_loan IS 'Loan account master with full lifecycle tracking';
COMMENT ON COLUMN m_loan.classification IS 'BRPD loan classification (UC, STD_0-2, SMA, SS, DF, BL)';
COMMENT ON COLUMN m_loan.dpd IS 'Days Past Due for classification calculation';
COMMENT ON COLUMN m_loan.workflow_process_instance_id IS 'Camunda BPMN process instance ID';
```

---

## 4. Loan Status State Machine

### 4.1 Status Transition Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         LOAN STATUS STATE MACHINE                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   ┌─────────┐                                                                       │
│   │  DRAFT  │◀─────────────────────────────────────┐                               │
│   └────┬────┘                                       │ return                        │
│        │ submit                                     │                               │
│        ▼                                            │                               │
│   ┌───────────┐       ┌───────────┐           ┌────┴────┐                          │
│   │ SUBMITTED │──────▶│UNDER_REVIEW│──────────▶│ RETURNED│                          │
│   └───────────┘ start └─────┬─────┘  return   └─────────┘                          │
│                       review│                                                       │
│                             │                                                       │
│                ┌────────────┼────────────┐                                         │
│                │ reject     │            │ approve                                  │
│                ▼            │            ▼                                          │
│           ┌──────────┐     │      ┌──────────┐        ┌────────────┐              │
│           │ REJECTED │     │      │ APPROVED │───────▶│ CANCELLED  │              │
│           └──────────┘     │      └────┬─────┘ cancel └────────────┘              │
│           (terminal)       │           │                                           │
│                            │           │ disburse                                   │
│                            │           ▼                                            │
│                            │      ┌───────────┐                                    │
│                            │      │ DISBURSED │                                    │
│                            │      └─────┬─────┘                                    │
│                            │            │ activate (after first payment)           │
│                            │            ▼                                           │
│                            │       ┌─────────┐                                     │
│                            │       │ ACTIVE  │◀────────────────────┐              │
│                            │       └────┬────┘                     │              │
│                            │            │                          │ reschedule   │
│                            │    ┌───────┼───────┐                  │              │
│                            │    │       │       │                  │              │
│                            │ close    write_off │            ┌─────┴─────┐        │
│                            │    │       │       │            │RESCHEDULED│        │
│                            │    ▼       ▼       ▼            └───────────┘        │
│                            │ ┌──────┐ ┌────────────┐                              │
│                            │ │CLOSED│ │WRITTEN_OFF │                              │
│                            │ └──────┘ └────────────┘                              │
│                            │ (terminal) (terminal)                                 │
│                                                                                      │
│   LEGEND:                                                                           │
│   ──────────────────────────────────────────────────────────────────────────────   │
│   (terminal) = No further transitions allowed                                       │
│   Approval flow: L1 → L2 → L3 → L4 → L5 → L6 → L7 (based on amount)              │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Status Transition Rules

| From Status | To Status | Trigger | Condition |
|-------------|-----------|---------|-----------|
| DRAFT | SUBMITTED | submit() | All mandatory data filled |
| SUBMITTED | UNDER_REVIEW | startReview() | CIB check initiated |
| UNDER_REVIEW | APPROVED | approve() | All approval levels cleared |
| UNDER_REVIEW | REJECTED | reject() | Any approver rejects |
| UNDER_REVIEW | RETURNED | return() | Missing documents/info |
| RETURNED | DRAFT | edit() | Re-open for editing |
| APPROVED | DISBURSED | disburse() | Disbursement completed |
| APPROVED | CANCELLED | cancel() | Customer/bank cancels |
| DISBURSED | ACTIVE | activate() | First repayment due |
| ACTIVE | CLOSED | close() | Full repayment completed |
| ACTIVE | WRITTEN_OFF | writeOff() | Board approval for write-off |
| ACTIVE | RESCHEDULED | reschedule() | Restructuring approved |

### 4.3 Table Definition: loan_status_history

```sql
-- Table: {tenant_schema}.loan_status_history
-- Purpose: Track all loan status transitions

CREATE TABLE loan_status_history (
    id BIGSERIAL PRIMARY KEY,
    loan_id BIGINT NOT NULL,

    -- Status Change
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    transition_reason VARCHAR(100),

    -- Actor
    changed_by VARCHAR(100) NOT NULL,
    changed_by_role VARCHAR(50),

    -- Details
    remarks TEXT,
    additional_data JSONB,

    -- Timestamps
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT pk_loan_status_history PRIMARY KEY (id),
    CONSTRAINT fk_loan_status_history_loan FOREIGN KEY (loan_id)
        REFERENCES m_loan(id) ON DELETE CASCADE
);

CREATE INDEX idx_loan_status_history_loan ON loan_status_history(loan_id);
CREATE INDEX idx_loan_status_history_date ON loan_status_history(changed_at);
CREATE INDEX idx_loan_status_history_status ON loan_status_history(to_status);

COMMENT ON TABLE loan_status_history IS 'Audit trail of all loan status transitions';
```

---

## 5. Repayment Schedule

### 5.1 Table Definition: m_loan_repayment_schedule

```sql
-- Table: {tenant_schema}.m_loan_repayment_schedule
-- Purpose: EMI/installment schedule for each loan

CREATE TABLE m_loan_repayment_schedule (
    id BIGSERIAL PRIMARY KEY,
    loan_id BIGINT NOT NULL,

    -- Installment Details
    installment_number INTEGER NOT NULL,
    from_date DATE NOT NULL,
    due_date DATE NOT NULL,

    -- Due Amounts
    principal_due DECIMAL(15,2) NOT NULL DEFAULT 0,
    interest_due DECIMAL(15,2) NOT NULL DEFAULT 0,
    fee_charges_due DECIMAL(15,2) NOT NULL DEFAULT 0,
    penalty_charges_due DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_due DECIMAL(15,2) NOT NULL DEFAULT 0,

    -- Paid Amounts
    principal_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
    interest_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
    fee_charges_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
    penalty_charges_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_paid DECIMAL(15,2) NOT NULL DEFAULT 0,

    -- Written Off
    principal_written_off DECIMAL(15,2) DEFAULT 0,
    interest_written_off DECIMAL(15,2) DEFAULT 0,

    -- Waived
    principal_waived DECIMAL(15,2) DEFAULT 0,
    interest_waived DECIMAL(15,2) DEFAULT 0,
    fee_charges_waived DECIMAL(15,2) DEFAULT 0,
    penalty_charges_waived DECIMAL(15,2) DEFAULT 0,

    -- Outstanding
    principal_outstanding DECIMAL(15,2) GENERATED ALWAYS AS (
        principal_due - principal_paid - principal_written_off - principal_waived
    ) STORED,
    total_outstanding DECIMAL(15,2) GENERATED ALWAYS AS (
        total_due - total_paid
    ) STORED,

    -- Status
    is_paid BOOLEAN GENERATED ALWAYS AS (
        total_paid >= total_due
    ) STORED,
    is_overdue BOOLEAN GENERATED ALWAYS AS (
        NOT (total_paid >= total_due) AND due_date < CURRENT_DATE
    ) STORED,

    -- Payment Info
    completed_date DATE,
    last_payment_date DATE,

    -- Recalculation tracking
    is_recalculated BOOLEAN DEFAULT FALSE,
    recalculated_at TIMESTAMP WITH TIME ZONE,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT pk_loan_repayment_schedule PRIMARY KEY (id),
    CONSTRAINT fk_loan_repayment_schedule_loan FOREIGN KEY (loan_id)
        REFERENCES m_loan(id) ON DELETE CASCADE,
    CONSTRAINT uq_loan_schedule_installment UNIQUE (loan_id, installment_number)
);

-- Indexes
CREATE INDEX idx_loan_schedule_loan ON m_loan_repayment_schedule(loan_id);
CREATE INDEX idx_loan_schedule_due_date ON m_loan_repayment_schedule(due_date);
CREATE INDEX idx_loan_schedule_overdue ON m_loan_repayment_schedule(due_date, is_paid)
    WHERE is_paid = FALSE;

COMMENT ON TABLE m_loan_repayment_schedule IS 'EMI/installment schedule for each loan';
```

---

## 6. Loan Transactions

### 6.1 Table Definition: m_loan_transaction

```sql
-- Table: {tenant_schema}.m_loan_transaction
-- Purpose: All financial transactions on a loan account

CREATE TABLE m_loan_transaction (
    id BIGSERIAL PRIMARY KEY,
    loan_id BIGINT NOT NULL,

    -- Transaction Identification
    transaction_ref VARCHAR(50) UNIQUE NOT NULL,      -- System generated reference
    external_ref VARCHAR(50),                         -- External/banking reference

    -- Transaction Type
    transaction_type VARCHAR(30) NOT NULL,
    -- DISBURSEMENT, REPAYMENT, PREPAYMENT, PENALTY_APPLIED, PENALTY_PAID,
    -- FEE_APPLIED, FEE_PAID, INTEREST_POSTING, WAIVER, WRITE_OFF, REVERSAL, ADJUSTMENT

    transaction_date DATE NOT NULL,
    submitted_on_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Amounts
    amount DECIMAL(15,2) NOT NULL,
    principal_portion DECIMAL(15,2) DEFAULT 0,
    interest_portion DECIMAL(15,2) DEFAULT 0,
    fee_portion DECIMAL(15,2) DEFAULT 0,
    penalty_portion DECIMAL(15,2) DEFAULT 0,
    overpayment_portion DECIMAL(15,2) DEFAULT 0,

    -- Running Balance (after transaction)
    outstanding_loan_balance DECIMAL(15,2),

    -- Payment Details
    payment_mode VARCHAR(30),                         -- CASH, CHEQUE, TRANSFER, BKASH, NAGAD, STANDING_INSTRUCTION
    payment_detail_id BIGINT,                         -- Reference to payment_detail table

    -- For checks
    cheque_number VARCHAR(30),
    cheque_date DATE,
    bank_name VARCHAR(100),
    bank_branch VARCHAR(100),

    -- For electronic transfers
    account_number VARCHAR(30),
    routing_number VARCHAR(20),

    -- Receipt
    receipt_number VARCHAR(50),

    -- Reversal
    is_reversed BOOLEAN NOT NULL DEFAULT FALSE,
    reversed_by_transaction_id BIGINT,
    reversal_reason VARCHAR(200),
    reversal_date DATE,

    -- Manually adjusted
    is_manual_adjustment BOOLEAN DEFAULT FALSE,
    adjustment_reason VARCHAR(200),

    -- Status
    is_posted BOOLEAN NOT NULL DEFAULT TRUE,
    posting_date DATE,

    -- Remarks
    remarks TEXT,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,

    -- Constraints
    CONSTRAINT pk_m_loan_transaction PRIMARY KEY (id),
    CONSTRAINT fk_loan_transaction_loan FOREIGN KEY (loan_id)
        REFERENCES m_loan(id) ON DELETE RESTRICT,
    CONSTRAINT uq_loan_transaction_ref UNIQUE (transaction_ref),
    CONSTRAINT chk_transaction_type CHECK (
        transaction_type IN ('DISBURSEMENT', 'REPAYMENT', 'PREPAYMENT', 'PENALTY_APPLIED', 'PENALTY_PAID', 'FEE_APPLIED', 'FEE_PAID', 'INTEREST_POSTING', 'WAIVER', 'WRITE_OFF', 'REVERSAL', 'ADJUSTMENT', 'REFUND')
    ),
    CONSTRAINT chk_payment_mode CHECK (
        payment_mode IS NULL OR payment_mode IN ('CASH', 'CHEQUE', 'TRANSFER', 'BKASH', 'NAGAD', 'ROCKET', 'STANDING_INSTRUCTION', 'INTERNAL_TRANSFER')
    )
);

-- Indexes
CREATE INDEX idx_loan_transaction_loan ON m_loan_transaction(loan_id);
CREATE INDEX idx_loan_transaction_ref ON m_loan_transaction(transaction_ref);
CREATE INDEX idx_loan_transaction_type ON m_loan_transaction(transaction_type);
CREATE INDEX idx_loan_transaction_date ON m_loan_transaction(transaction_date);
CREATE INDEX idx_loan_transaction_created ON m_loan_transaction(created_at);

-- BRIN index for time-series data
CREATE INDEX brin_loan_transaction_date ON m_loan_transaction USING BRIN(transaction_date);

COMMENT ON TABLE m_loan_transaction IS 'All financial transactions on loan accounts';
```

---

## 7. Collateral Management

### 7.1 Table Definition: loan_collateral

```sql
-- Table: {tenant_schema}.loan_collateral
-- Purpose: Collateral/security records for secured loans

CREATE TABLE loan_collateral (
    id BIGSERIAL PRIMARY KEY,
    loan_id BIGINT NOT NULL,

    -- Collateral Type
    collateral_type_id INTEGER NOT NULL,
    collateral_type_code VARCHAR(30) NOT NULL,
    collateral_type_name VARCHAR(100),

    -- Description
    description TEXT NOT NULL,
    collateral_reference VARCHAR(100),                -- Reference number

    -- Valuation
    market_value DECIMAL(15,2) NOT NULL,
    forced_sale_value DECIMAL(15,2),
    insured_value DECIMAL(15,2),
    valuation_date DATE NOT NULL,
    valuation_expiry_date DATE,
    valued_by VARCHAR(100),
    valuation_company VARCHAR(200),

    -- Coverage
    coverage_amount DECIMAL(15,2),                    -- Amount covered by this collateral
    coverage_percentage DECIMAL(5,2),

    -- Legal Status
    lien_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    -- PENDING, REGISTERED, RELEASED
    lien_registration_date DATE,
    lien_registration_number VARCHAR(100),
    lien_release_date DATE,

    -- Property Details (for land/building)
    property_address TEXT,
    property_district VARCHAR(100),
    property_mouza VARCHAR(100),
    property_khatian_no VARCHAR(100),
    property_dag_no VARCHAR(100),
    property_area_sqft DECIMAL(15,2),

    -- Vehicle Details (for auto loans)
    vehicle_registration_no VARCHAR(50),
    vehicle_chassis_no VARCHAR(100),
    vehicle_engine_no VARCHAR(100),
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_year INTEGER,

    -- Insurance
    is_insured BOOLEAN DEFAULT FALSE,
    insurance_policy_no VARCHAR(100),
    insurance_company VARCHAR(200),
    insurance_expiry_date DATE,

    -- Documents
    documents_collected JSONB,                        -- List of collected documents

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',     -- ACTIVE, RELEASED, LIQUIDATED

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,

    -- Constraints
    CONSTRAINT pk_loan_collateral PRIMARY KEY (id),
    CONSTRAINT fk_loan_collateral_loan FOREIGN KEY (loan_id)
        REFERENCES m_loan(id) ON DELETE RESTRICT,
    CONSTRAINT chk_collateral_lien_status CHECK (
        lien_status IN ('PENDING', 'REGISTERED', 'RELEASED')
    )
);

-- Indexes
CREATE INDEX idx_loan_collateral_loan ON loan_collateral(loan_id);
CREATE INDEX idx_loan_collateral_type ON loan_collateral(collateral_type_code);
CREATE INDEX idx_loan_collateral_lien ON loan_collateral(lien_status);

COMMENT ON TABLE loan_collateral IS 'Collateral/security records for secured loans';
```

---

## 8. Guarantor Information

### 8.1 Table Definition: loan_guarantor

```sql
-- Table: {tenant_schema}.loan_guarantor
-- Purpose: Guarantor information for loans

CREATE TABLE loan_guarantor (
    id BIGSERIAL PRIMARY KEY,
    loan_id BIGINT NOT NULL,

    -- Guarantor Type
    guarantor_type VARCHAR(20) NOT NULL,              -- PERSONAL, CORPORATE

    -- Identity (Encrypted)
    nid_number VARCHAR(255),                          -- ENCRYPTED
    tin VARCHAR(100),                                 -- ENCRYPTED

    -- Personal Information
    full_name VARCHAR(200) NOT NULL,
    full_name_bn VARCHAR(200),
    father_name VARCHAR(200),
    mother_name VARCHAR(200),
    date_of_birth DATE,
    gender VARCHAR(10),

    -- Relationship
    relationship_with_borrower VARCHAR(50) NOT NULL,
    -- SPOUSE, PARENT, SIBLING, RELATIVE, FRIEND, EMPLOYER, BUSINESS_PARTNER, OTHER

    -- Contact
    mobile_number VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    present_address TEXT,
    permanent_address TEXT,

    -- Employment/Income (Encrypted)
    employer_name VARCHAR(255),                       -- ENCRYPTED
    designation VARCHAR(100),
    monthly_income DECIMAL(15,2),                     -- ENCRYPTED

    -- Guarantee Details
    guarantee_amount DECIMAL(15,2) NOT NULL,
    guarantee_percentage DECIMAL(5,2),
    guarantee_type VARCHAR(30) DEFAULT 'UNLIMITED',   -- LIMITED, UNLIMITED

    -- Verification
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by VARCHAR(100),
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_method VARCHAR(30),

    -- Photo
    photo_path VARCHAR(500),
    signature_path VARCHAR(500),

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',     -- ACTIVE, RELEASED
    release_date DATE,
    release_reason VARCHAR(200),

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,

    -- Constraints
    CONSTRAINT pk_loan_guarantor PRIMARY KEY (id),
    CONSTRAINT fk_loan_guarantor_loan FOREIGN KEY (loan_id)
        REFERENCES m_loan(id) ON DELETE RESTRICT,
    CONSTRAINT chk_guarantor_type CHECK (
        guarantor_type IN ('PERSONAL', 'CORPORATE')
    ),
    CONSTRAINT chk_guarantor_relationship CHECK (
        relationship_with_borrower IN ('SPOUSE', 'PARENT', 'CHILD', 'SIBLING', 'RELATIVE', 'FRIEND', 'EMPLOYER', 'BUSINESS_PARTNER', 'OTHER')
    )
);

-- Indexes
CREATE INDEX idx_loan_guarantor_loan ON loan_guarantor(loan_id);
CREATE INDEX idx_loan_guarantor_nid ON loan_guarantor(nid_number);
CREATE INDEX idx_loan_guarantor_mobile ON loan_guarantor(mobile_number);

COMMENT ON TABLE loan_guarantor IS 'Guarantor information for loans';
COMMENT ON COLUMN loan_guarantor.nid_number IS 'Guarantor NID - AES-256 encrypted';
```

---

## 9. Loan Charges

### 9.1 Table Definition: loan_charge

```sql
-- Table: {tenant_schema}.loan_charge
-- Purpose: Fees and charges applied to loans

CREATE TABLE loan_charge (
    id BIGSERIAL PRIMARY KEY,
    loan_id BIGINT NOT NULL,

    -- Charge Definition
    charge_id INTEGER,                                -- Reference to charge master
    charge_code VARCHAR(30) NOT NULL,
    charge_name VARCHAR(100) NOT NULL,

    -- Charge Type & Timing
    charge_type VARCHAR(30) NOT NULL,
    -- PROCESSING_FEE, DOCUMENTATION_FEE, INSURANCE_FEE, APPRAISAL_FEE, LATE_FEE, PREPAYMENT_PENALTY, OTHER
    charge_time VARCHAR(30) NOT NULL,
    -- DISBURSEMENT, SPECIFIED_DUE_DATE, INSTALLMENT_FEE, OVERDUE_INSTALLMENT

    -- Calculation
    charge_calculation_type VARCHAR(30) NOT NULL,     -- FLAT, PERCENTAGE
    charge_amount_or_percentage DECIMAL(10,4),
    percentage_of VARCHAR(30),                        -- PRINCIPAL, OUTSTANDING, INSTALLMENT

    -- Amounts
    amount DECIMAL(15,2) NOT NULL,
    amount_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
    amount_waived DECIMAL(15,2) DEFAULT 0,
    amount_written_off DECIMAL(15,2) DEFAULT 0,
    amount_outstanding DECIMAL(15,2) GENERATED ALWAYS AS (
        amount - amount_paid - amount_waived - amount_written_off
    ) STORED,

    -- Due Date
    due_date DATE,

    -- Installment Link (for installment-based charges)
    installment_number INTEGER,

    -- Status
    is_paid BOOLEAN GENERATED ALWAYS AS (
        amount_paid >= (amount - amount_waived - amount_written_off)
    ) STORED,
    is_waived BOOLEAN NOT NULL DEFAULT FALSE,
    waived_by VARCHAR(100),
    waiver_reason VARCHAR(200),
    waiver_date DATE,

    -- Penalty Calculation (for late fees)
    is_penalty BOOLEAN NOT NULL DEFAULT FALSE,
    penalty_days INTEGER,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,

    -- Constraints
    CONSTRAINT pk_loan_charge PRIMARY KEY (id),
    CONSTRAINT fk_loan_charge_loan FOREIGN KEY (loan_id)
        REFERENCES m_loan(id) ON DELETE CASCADE,
    CONSTRAINT chk_charge_type CHECK (
        charge_type IN ('PROCESSING_FEE', 'DOCUMENTATION_FEE', 'INSURANCE_FEE', 'APPRAISAL_FEE', 'LATE_FEE', 'PREPAYMENT_PENALTY', 'STAMP_DUTY', 'LEGAL_FEE', 'OTHER')
    ),
    CONSTRAINT chk_charge_calculation CHECK (
        charge_calculation_type IN ('FLAT', 'PERCENTAGE')
    )
);

-- Indexes
CREATE INDEX idx_loan_charge_loan ON loan_charge(loan_id);
CREATE INDEX idx_loan_charge_type ON loan_charge(charge_type);
CREATE INDEX idx_loan_charge_due_date ON loan_charge(due_date);
CREATE INDEX idx_loan_charge_unpaid ON loan_charge(loan_id, is_paid) WHERE is_paid = FALSE;

COMMENT ON TABLE loan_charge IS 'Fees and charges applied to loans';
```

---

## 10. Disbursement Management

### 10.1 Table Definition: loan_disbursement

```sql
-- Table: {tenant_schema}.loan_disbursement
-- Purpose: Loan disbursement records (supports multiple disbursements)

CREATE TABLE loan_disbursement (
    id BIGSERIAL PRIMARY KEY,
    loan_id BIGINT NOT NULL,

    -- Disbursement Reference
    disbursement_ref VARCHAR(50) UNIQUE NOT NULL,
    disbursement_number INTEGER NOT NULL DEFAULT 1,

    -- Amount
    expected_amount DECIMAL(15,2) NOT NULL,
    actual_amount DECIMAL(15,2),

    -- Dates
    expected_date DATE NOT NULL,
    actual_date DATE,

    -- Payment Details
    payment_mode VARCHAR(30) NOT NULL,
    -- CASH, CHEQUE, TRANSFER, INTERNAL_TRANSFER

    -- Bank Details
    account_number VARCHAR(30),
    account_name VARCHAR(200),
    bank_name VARCHAR(100),
    bank_branch VARCHAR(100),
    routing_number VARCHAR(20),

    -- Transaction Reference
    transaction_ref VARCHAR(50),
    cheque_number VARCHAR(30),
    cheque_date DATE,

    -- Deductions
    processing_fee_deducted DECIMAL(15,2) DEFAULT 0,
    insurance_deducted DECIMAL(15,2) DEFAULT 0,
    other_deductions DECIMAL(15,2) DEFAULT 0,
    net_disbursement DECIMAL(15,2),

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    -- PENDING, APPROVED, DISBURSED, FAILED, CANCELLED
    failure_reason VARCHAR(200),

    -- Approval
    approved_by VARCHAR(100),
    approved_at TIMESTAMP WITH TIME ZONE,

    -- Disbursement Execution
    disbursed_by VARCHAR(100),
    disbursed_at TIMESTAMP WITH TIME ZONE,

    -- Remarks
    remarks TEXT,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,

    -- Constraints
    CONSTRAINT pk_loan_disbursement PRIMARY KEY (id),
    CONSTRAINT fk_loan_disbursement_loan FOREIGN KEY (loan_id)
        REFERENCES m_loan(id) ON DELETE RESTRICT,
    CONSTRAINT uq_loan_disbursement_ref UNIQUE (disbursement_ref),
    CONSTRAINT uq_loan_disbursement_number UNIQUE (loan_id, disbursement_number),
    CONSTRAINT chk_disbursement_status CHECK (
        status IN ('PENDING', 'APPROVED', 'DISBURSED', 'FAILED', 'CANCELLED')
    )
);

-- Indexes
CREATE INDEX idx_loan_disbursement_loan ON loan_disbursement(loan_id);
CREATE INDEX idx_loan_disbursement_ref ON loan_disbursement(disbursement_ref);
CREATE INDEX idx_loan_disbursement_status ON loan_disbursement(status);
CREATE INDEX idx_loan_disbursement_date ON loan_disbursement(actual_date);

COMMENT ON TABLE loan_disbursement IS 'Loan disbursement records';
```

---

## 11. Loan Modification History

### 11.1 Table Definition: loan_modification_history

```sql
-- Table: {tenant_schema}.loan_modification_history
-- Purpose: Track loan rescheduling and restructuring

CREATE TABLE loan_modification_history (
    id BIGSERIAL PRIMARY KEY,
    loan_id BIGINT NOT NULL,

    -- Modification Type
    modification_type VARCHAR(30) NOT NULL,           -- RESCHEDULE, RESTRUCTURE, TOP_UP
    modification_date DATE NOT NULL,
    effective_date DATE NOT NULL,

    -- Old Terms
    old_principal_outstanding DECIMAL(15,2),
    old_interest_rate DECIMAL(5,4),
    old_term_months INTEGER,
    old_emi_amount DECIMAL(15,2),
    old_maturity_date DATE,
    old_classification VARCHAR(20),

    -- New Terms
    new_principal_amount DECIMAL(15,2),               -- May include capitalized interest
    new_interest_rate DECIMAL(5,4),
    new_term_months INTEGER,
    new_emi_amount DECIMAL(15,2),
    new_maturity_date DATE,

    -- Interest Capitalization
    interest_capitalized DECIMAL(15,2) DEFAULT 0,
    fees_capitalized DECIMAL(15,2) DEFAULT 0,
    penalty_capitalized DECIMAL(15,2) DEFAULT 0,

    -- Reason
    modification_reason VARCHAR(200) NOT NULL,
    customer_request_date DATE,

    -- Approval
    approval_level INTEGER,
    approved_by VARCHAR(100),
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_remarks TEXT,

    -- Supporting Documents
    documents JSONB,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,

    -- Constraints
    CONSTRAINT pk_loan_modification_history PRIMARY KEY (id),
    CONSTRAINT fk_loan_modification_loan FOREIGN KEY (loan_id)
        REFERENCES m_loan(id) ON DELETE RESTRICT,
    CONSTRAINT chk_modification_type CHECK (
        modification_type IN ('RESCHEDULE', 'RESTRUCTURE', 'TOP_UP', 'TENURE_EXTENSION', 'RATE_CHANGE')
    )
);

-- Indexes
CREATE INDEX idx_loan_modification_loan ON loan_modification_history(loan_id);
CREATE INDEX idx_loan_modification_type ON loan_modification_history(modification_type);
CREATE INDEX idx_loan_modification_date ON loan_modification_history(modification_date);

COMMENT ON TABLE loan_modification_history IS 'Track loan rescheduling and restructuring';
```

---

## 12. Workflow Integration

### 12.1 Table Definition: workflow_task

```sql
-- Table: {tenant_schema}.workflow_task
-- Purpose: Active workflow tasks from Camunda

CREATE TABLE workflow_task (
    id BIGSERIAL PRIMARY KEY,

    -- Camunda References
    task_id VARCHAR(100) UNIQUE NOT NULL,             -- Camunda task ID
    process_instance_id VARCHAR(100) NOT NULL,        -- Camunda process instance ID
    process_definition_key VARCHAR(100) NOT NULL,
    activity_id VARCHAR(100),

    -- Loan Reference
    loan_id BIGINT NOT NULL,

    -- Task Details
    task_name VARCHAR(100) NOT NULL,
    task_type VARCHAR(50) NOT NULL,                   -- APPROVAL, REVIEW, VERIFICATION, DISBURSEMENT
    task_description TEXT,

    -- Assignment
    assignee_id VARCHAR(50),
    assignee_name VARCHAR(200),
    assignee_role VARCHAR(50),
    candidate_groups JSONB,                           -- Array of candidate group IDs
    candidate_users JSONB,                            -- Array of candidate user IDs

    -- Approval Level
    approval_level INTEGER,                           -- L1-L7
    approval_limit DECIMAL(15,2),

    -- SLA
    due_date TIMESTAMP WITH TIME ZONE,
    sla_hours INTEGER,
    is_overdue BOOLEAN GENERATED ALWAYS AS (
        due_date IS NOT NULL AND due_date < CURRENT_TIMESTAMP
    ) STORED,
    escalation_level INTEGER DEFAULT 0,

    -- Priority
    priority INTEGER DEFAULT 50,                      -- 0=highest, 100=lowest

    -- Status
    task_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    -- ACTIVE, CLAIMED, COMPLETED, CANCELLED

    -- Task Variables
    task_variables JSONB,

    -- Completion
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by VARCHAR(100),
    completion_outcome VARCHAR(50),                   -- APPROVED, REJECTED, RETURNED
    completion_remarks TEXT,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT pk_workflow_task PRIMARY KEY (id),
    CONSTRAINT fk_workflow_task_loan FOREIGN KEY (loan_id)
        REFERENCES m_loan(id) ON DELETE CASCADE,
    CONSTRAINT uq_workflow_task_id UNIQUE (task_id),
    CONSTRAINT chk_workflow_task_status CHECK (
        task_status IN ('ACTIVE', 'CLAIMED', 'COMPLETED', 'CANCELLED')
    )
);

-- Indexes
CREATE INDEX idx_workflow_task_loan ON workflow_task(loan_id);
CREATE INDEX idx_workflow_task_assignee ON workflow_task(assignee_id);
CREATE INDEX idx_workflow_task_status ON workflow_task(task_status);
CREATE INDEX idx_workflow_task_due ON workflow_task(due_date) WHERE task_status = 'ACTIVE';
CREATE INDEX idx_workflow_task_level ON workflow_task(approval_level);
CREATE INDEX idx_workflow_task_process ON workflow_task(process_instance_id);

COMMENT ON TABLE workflow_task IS 'Active workflow tasks from Camunda';
```

### 12.2 Table Definition: approval_log

```sql
-- Table: {tenant_schema}.approval_log
-- Purpose: Audit trail for all approval actions

CREATE TABLE approval_log (
    id BIGSERIAL PRIMARY KEY,
    loan_id BIGINT NOT NULL,
    task_id VARCHAR(100),

    -- Approval Level
    approval_level INTEGER NOT NULL,
    approval_level_name VARCHAR(50),

    -- Approver
    approver_id VARCHAR(50) NOT NULL,
    approver_name VARCHAR(200),
    approver_role VARCHAR(50),
    approver_branch VARCHAR(20),

    -- Action
    action VARCHAR(30) NOT NULL,                      -- APPROVE, REJECT, RETURN, DELEGATE, ESCALATE
    decision VARCHAR(30),                             -- APPROVED, CONDITIONALLY_APPROVED, REJECTED, RETURNED

    -- Details
    requested_amount DECIMAL(15,2),
    approved_amount DECIMAL(15,2),
    approval_conditions JSONB,                        -- Array of conditions

    -- Remarks
    remarks TEXT,

    -- SLA
    task_assigned_at TIMESTAMP WITH TIME ZONE,
    task_completed_at TIMESTAMP WITH TIME ZONE,
    sla_due_at TIMESTAMP WITH TIME ZONE,
    sla_breached BOOLEAN DEFAULT FALSE,
    time_taken_hours DECIMAL(10,2),

    -- Audit
    action_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),

    -- Constraints
    CONSTRAINT pk_approval_log PRIMARY KEY (id),
    CONSTRAINT fk_approval_log_loan FOREIGN KEY (loan_id)
        REFERENCES m_loan(id) ON DELETE CASCADE,
    CONSTRAINT chk_approval_action CHECK (
        action IN ('APPROVE', 'REJECT', 'RETURN', 'DELEGATE', 'ESCALATE', 'CLAIM', 'UNCLAIM')
    )
);

-- Indexes
CREATE INDEX idx_approval_log_loan ON approval_log(loan_id);
CREATE INDEX idx_approval_log_approver ON approval_log(approver_id);
CREATE INDEX idx_approval_log_level ON approval_log(approval_level);
CREATE INDEX idx_approval_log_action ON approval_log(action);
CREATE INDEX idx_approval_log_date ON approval_log(action_at);

COMMENT ON TABLE approval_log IS 'Audit trail for all approval actions';
```

### 12.3 Approval Level Configuration

| Level | Name | Amount Range (BDT) | Typical Role | SLA Hours |
|-------|------|-------------------|--------------|-----------|
| L1 | Branch Manager | 0 - 500,000 | Branch Manager | 4 |
| L2 | Regional Manager | 500,001 - 1,000,000 | Regional Head | 8 |
| L3 | Credit Head | 1,000,001 - 5,000,000 | Head of Credit | 12 |
| L4 | Risk Committee | 5,000,001 - 10,000,000 | Risk Committee | 24 |
| L5 | DMD | 10,000,001 - 50,000,000 | Deputy MD | 48 |
| L6 | MD | 50,000,001 - 100,000,000 | Managing Director | 72 |
| L7 | Board/BOCC | > 100,000,000 | Board Committee | 168 |

---

## 13. Flyway Migration Scripts

### 13.1 Migration: V1.0.1__create_loan_tables.sql

```sql
-- V1.0.1__create_loan_tables.sql
-- Description: Create loan management tables
-- Author: Lead Dev
-- Date: 2026-02-05

-- See individual table definitions above
-- Tables created in order of dependencies:
-- 1. ref_loan_product
-- 2. m_loan
-- 3. loan_status_history
-- 4. m_loan_repayment_schedule
-- 5. m_loan_transaction
-- 6. loan_collateral
-- 7. loan_guarantor
-- 8. loan_charge
-- 9. loan_disbursement
-- 10. loan_modification_history
-- 11. workflow_task
-- 12. approval_log
```

---

## 14. Compliance Matrix

### 14.1 BRD/SRS Requirements Mapping

| Requirement | Reference | Implementation | Status |
|-------------|-----------|----------------|--------|
| Loan product configuration | BRD 6.2.1 | ref_loan_product table | ✅ |
| Multi-stage approval | BRD 6.3.1 | workflow_task, approval_log | ✅ |
| 7-level approval hierarchy | BRD 6.3.2 | approval_level (L1-L7) | ✅ |
| Camunda workflow integration | SRS 4.2 | workflow_process_instance_id | ✅ |
| Loan status tracking | BRD 6.4 | loan_status, loan_status_history | ✅ |
| Collateral management | BRD 6.2.3 | loan_collateral table | ✅ |
| Disbursement tracking | BRD 6.4.3 | loan_disbursement table | ✅ |
| BRPD classification | BRD 6.6 | classification field | ✅ |

---

**Document End**

*ULMS v2.0 - Data Model - Loan Applications v1.0*

*Unisoft Systems Limited - Confidential*

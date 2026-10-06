# Data Model - BRPD Compliance
## 7-Stage Loan Classification System
### Unisoft Loan Management System (ULMS) v2.0

---

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ULMS-ARCH-1.3.5 |
| **Document Title** | Data Model - BRPD Compliance (7-Stage Classification) |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 5, 2026 |
| **Prepared By** | Lead Developer |
| **Reviewed By** | Compliance Team, Architecture Review Board |
| **Classification** | Confidential - Internal Use |
| **Status** | Approved for Implementation |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | Lead Dev | Initial BRPD Compliance Data Model |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [BRPD 15/2024 Classification Rules](#2-brpd-152024-classification-rules)
3. [Classification History Table](#3-classification-history-table)
4. [Provision Tracking Table](#4-provision-tracking-table)
5. [Interest Suspense Accounting](#5-interest-suspense-accounting)
6. [GL Journal Entries](#6-gl-journal-entries)
7. [DPD Calculation Logic](#7-dpd-calculation-logic)
8. [Daily Classification Batch Job](#8-daily-classification-batch-job)
9. [Regulatory Reports Data Structure](#9-regulatory-reports-data-structure)
10. [Compliance Validation Rules](#10-compliance-validation-rules)
11. [Flyway Migration Scripts](#11-flyway-migration-scripts)

---

## 1. Introduction

### 1.1 Purpose

This document defines the data model for BRPD (Bangladesh Bank Prudential Regulations Division) compliance in ULMS v2.0, specifically implementing the 7-stage loan classification system as per BRPD Circular 15/2024.

### 1.2 Regulatory Reference

| Regulation | Description |
|------------|-------------|
| **BRPD Circular 15/2024** | Loan classification and provisioning guidelines |
| **BRPD Circular 19/2019** | Classification for restructured loans |
| **IFRS-9** | Expected Credit Loss (ECL) requirements |
| **Basel III** | Capital adequacy requirements |

### 1.3 Key Concepts

| Term | Definition |
|------|------------|
| **DPD** | Days Past Due - days since last missed payment |
| **NPA** | Non-Performing Asset - loans classified SS or worse |
| **Provision** | Reserve amount for potential loan losses |
| **Interest Suspense** | Accrued interest moved to suspense for NPA loans |

---

## 2. BRPD 15/2024 Classification Rules

### 2.1 7-Stage Classification System

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    BRPD 15/2024 CLASSIFICATION STAGES                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   Stage │ Code   │ DPD Range      │ Provision │ Interest    │ Status               │
│   ──────┼────────┼────────────────┼───────────┼─────────────┼─────────────────────│
│   1     │ STD-0  │ 0 days         │ 1%        │ Accrual     │ Standard             │
│   2     │ STD-1  │ 1 - 30 days    │ 1%        │ Accrual     │ Standard             │
│   3     │ STD-2  │ 31 - 60 days   │ 1%        │ Accrual     │ Standard             │
│   4     │ SMA    │ 61 - 90 days   │ 5%        │ Accrual     │ Special Mention      │
│   5     │ SS     │ 91 - 180 days  │ 20%       │ Suspense    │ Sub-Standard (NPA)   │
│   6     │ DF     │ 181 - 365 days │ 50%       │ Suspense    │ Doubtful (NPA)       │
│   7     │ BL     │ > 365 days     │ 100%      │ Suspense    │ Bad/Loss (NPA)       │
│                                                                                      │
│   NOTES:                                                                             │
│   - NPA = Non-Performing Asset (SS, DF, BL)                                         │
│   - Interest stops accruing at SS stage (moved to suspense)                         │
│   - Provision rates are on outstanding principal                                     │
│   - Additional specific provisions may apply for collateral-deficient loans         │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Classification Code Reference

```sql
-- Reference table for classification codes
CREATE TABLE ref_classification_code (
    id SERIAL PRIMARY KEY,
    classification_code VARCHAR(10) UNIQUE NOT NULL,
    classification_name VARCHAR(50) NOT NULL,
    classification_name_bn VARCHAR(100),
    stage_number INTEGER NOT NULL,
    min_dpd INTEGER NOT NULL,
    max_dpd INTEGER,                                  -- NULL for BL (no upper limit)
    provision_rate DECIMAL(5,4) NOT NULL,             -- e.g., 0.0100 = 1%
    is_npa BOOLEAN NOT NULL DEFAULT FALSE,
    interest_treatment VARCHAR(20) NOT NULL,          -- ACCRUAL, SUSPENSE
    description TEXT,
    effective_from DATE NOT NULL,
    effective_to DATE,                                -- NULL if currently active
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_ref_classification PRIMARY KEY (id),
    CONSTRAINT uq_classification_code UNIQUE (classification_code),
    CONSTRAINT chk_interest_treatment CHECK (
        interest_treatment IN ('ACCRUAL', 'SUSPENSE', 'WRITE_OFF')
    )
);

-- Seed data for BRPD 15/2024
INSERT INTO ref_classification_code
(classification_code, classification_name, stage_number, min_dpd, max_dpd, provision_rate, is_npa, interest_treatment, effective_from)
VALUES
('UC',    'Unclassified',      0,   NULL, NULL, 0.0000, FALSE, 'ACCRUAL',   '2024-01-01'),
('STD_0', 'Standard (0 DPD)',  1,   0,    0,    0.0100, FALSE, 'ACCRUAL',   '2024-01-01'),
('STD_1', 'Standard (1-30)',   2,   1,    30,   0.0100, FALSE, 'ACCRUAL',   '2024-01-01'),
('STD_2', 'Standard (31-60)',  3,   31,   60,   0.0100, FALSE, 'ACCRUAL',   '2024-01-01'),
('SMA',   'Special Mention',   4,   61,   90,   0.0500, FALSE, 'ACCRUAL',   '2024-01-01'),
('SS',    'Sub-Standard',      5,   91,   180,  0.2000, TRUE,  'SUSPENSE',  '2024-01-01'),
('DF',    'Doubtful',          6,   181,  365,  0.5000, TRUE,  'SUSPENSE',  '2024-01-01'),
('BL',    'Bad/Loss',          7,   366,  NULL, 1.0000, TRUE,  'SUSPENSE',  '2024-01-01');

CREATE INDEX idx_ref_classification_dpd ON ref_classification_code(min_dpd, max_dpd);
COMMENT ON TABLE ref_classification_code IS 'BRPD loan classification codes and provision rates';
```

### 2.3 Classification Logic Function

```sql
-- Function to determine classification based on DPD
CREATE OR REPLACE FUNCTION get_classification_for_dpd(p_dpd INTEGER)
RETURNS VARCHAR(10) AS $$
BEGIN
    IF p_dpd IS NULL OR p_dpd < 0 THEN
        RETURN 'UC';
    ELSIF p_dpd = 0 THEN
        RETURN 'STD_0';
    ELSIF p_dpd BETWEEN 1 AND 30 THEN
        RETURN 'STD_1';
    ELSIF p_dpd BETWEEN 31 AND 60 THEN
        RETURN 'STD_2';
    ELSIF p_dpd BETWEEN 61 AND 90 THEN
        RETURN 'SMA';
    ELSIF p_dpd BETWEEN 91 AND 180 THEN
        RETURN 'SS';
    ELSIF p_dpd BETWEEN 181 AND 365 THEN
        RETURN 'DF';
    ELSE
        RETURN 'BL';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get provision rate for classification
CREATE OR REPLACE FUNCTION get_provision_rate(p_classification VARCHAR(10))
RETURNS DECIMAL(5,4) AS $$
BEGIN
    RETURN CASE p_classification
        WHEN 'STD_0' THEN 0.0100
        WHEN 'STD_1' THEN 0.0100
        WHEN 'STD_2' THEN 0.0100
        WHEN 'SMA'   THEN 0.0500
        WHEN 'SS'    THEN 0.2000
        WHEN 'DF'    THEN 0.5000
        WHEN 'BL'    THEN 1.0000
        ELSE 0.0000
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if classification is NPA
CREATE OR REPLACE FUNCTION is_npa_classification(p_classification VARCHAR(10))
RETURNS BOOLEAN AS $$
BEGIN
    RETURN p_classification IN ('SS', 'DF', 'BL');
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

---

## 3. Classification History Table

### 3.1 Table Definition: loan_classification_history

```sql
-- Table: {tenant_schema}.loan_classification_history
-- Purpose: Audit trail for all loan classification changes

CREATE TABLE loan_classification_history (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,

    -- Loan Reference
    loan_id BIGINT NOT NULL,
    loan_account_no VARCHAR(30) NOT NULL,

    -- Classification Change
    previous_classification VARCHAR(10),
    new_classification VARCHAR(10) NOT NULL,
    classification_date DATE NOT NULL,
    effective_date DATE NOT NULL,

    -- DPD Information
    dpd INTEGER NOT NULL,
    previous_dpd INTEGER,
    overdue_amount DECIMAL(15,2),

    -- Outstanding at Classification
    principal_outstanding DECIMAL(15,2) NOT NULL,
    interest_outstanding DECIMAL(15,2),
    total_outstanding DECIMAL(15,2),

    -- Provision Calculation
    previous_provision_rate DECIMAL(5,4),
    new_provision_rate DECIMAL(5,4) NOT NULL,
    previous_provision_amount DECIMAL(15,2),
    new_provision_amount DECIMAL(15,2) NOT NULL,
    provision_change DECIMAL(15,2),                   -- Increase (+) or decrease (-)

    -- Interest Suspense (for NPA transitions)
    interest_suspended DECIMAL(15,2) DEFAULT 0,
    interest_reversed DECIMAL(15,2) DEFAULT 0,

    -- NPA Flag Changes
    was_npa BOOLEAN DEFAULT FALSE,
    is_npa BOOLEAN NOT NULL,
    npa_date DATE,                                    -- Date loan became NPA

    -- GL Posting Reference
    gl_journal_entry_id BIGINT,
    provision_gl_entry_id BIGINT,
    suspense_gl_entry_id BIGINT,

    -- Classification Reason
    classification_reason VARCHAR(50) NOT NULL,
    -- AUTO_DPD, MANUAL_OVERRIDE, RESTRUCTURE, WRITE_OFF, RECOVERY
    classification_method VARCHAR(30) NOT NULL DEFAULT 'SYSTEM',
    -- SYSTEM, MANUAL

    -- Manual Override Details
    override_by VARCHAR(100),
    override_reason TEXT,
    override_approved_by VARCHAR(100),

    -- Batch Information
    batch_id VARCHAR(50),                             -- Daily classification batch ID
    batch_date DATE,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,

    -- Constraints
    CONSTRAINT pk_loan_classification_history PRIMARY KEY (id),
    CONSTRAINT fk_classification_history_loan FOREIGN KEY (loan_id)
        REFERENCES m_loan(id) ON DELETE RESTRICT,
    CONSTRAINT chk_classification_codes CHECK (
        new_classification IN ('UC', 'STD_0', 'STD_1', 'STD_2', 'SMA', 'SS', 'DF', 'BL')
    ),
    CONSTRAINT chk_classification_reason CHECK (
        classification_reason IN ('AUTO_DPD', 'MANUAL_OVERRIDE', 'RESTRUCTURE', 'WRITE_OFF', 'RECOVERY', 'SYSTEM_CORRECTION', 'REGULATORY_CHANGE')
    )
);

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════
CREATE INDEX idx_classification_history_loan ON loan_classification_history(loan_id);
CREATE INDEX idx_classification_history_date ON loan_classification_history(classification_date);
CREATE INDEX idx_classification_history_classification ON loan_classification_history(new_classification);
CREATE INDEX idx_classification_history_npa ON loan_classification_history(is_npa, npa_date);
CREATE INDEX idx_classification_history_batch ON loan_classification_history(batch_id);

-- BRIN index for time-series queries
CREATE INDEX brin_classification_history_date ON loan_classification_history
    USING BRIN(classification_date);

-- Partial index for NPA loans
CREATE INDEX idx_classification_history_npa_active ON loan_classification_history(loan_id, classification_date)
    WHERE is_npa = TRUE;

-- Comments
COMMENT ON TABLE loan_classification_history IS 'Audit trail for all loan classification changes per BRPD 15/2024';
COMMENT ON COLUMN loan_classification_history.dpd IS 'Days Past Due at time of classification';
COMMENT ON COLUMN loan_classification_history.provision_change IS 'Change in provision amount (positive=increase, negative=decrease)';
COMMENT ON COLUMN loan_classification_history.interest_suspended IS 'Interest moved to suspense account for NPA';
```

### 3.2 Classification Upgrade/Downgrade Rules

| Transition | Condition | Action |
|------------|-----------|--------|
| Downgrade (worse) | DPD increases to next bracket | Automatic via batch |
| Upgrade (better) | Full payment + DPD reset | Requires manual review for NPA |
| NPA to Performing | 3 consecutive payments + DPD < 90 | Board approval required |
| Write-off to Recovery | Any recovery received | Book recovery income |

---

## 4. Provision Tracking Table

### 4.1 Table Definition: loan_provision

```sql
-- Table: {tenant_schema}.loan_provision
-- Purpose: Track provision amounts for each loan

CREATE TABLE loan_provision (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,

    -- Loan Reference
    loan_id BIGINT NOT NULL,
    loan_account_no VARCHAR(30) NOT NULL,

    -- Provision Date
    provision_date DATE NOT NULL,
    provision_month VARCHAR(7) NOT NULL,              -- Format: YYYY-MM

    -- Classification
    classification VARCHAR(10) NOT NULL,
    dpd INTEGER NOT NULL,

    -- Outstanding Amounts
    principal_outstanding DECIMAL(15,2) NOT NULL,
    interest_outstanding DECIMAL(15,2) DEFAULT 0,
    total_outstanding DECIMAL(15,2) NOT NULL,

    -- Provision Rates
    general_provision_rate DECIMAL(5,4) NOT NULL,     -- Per BRPD
    specific_provision_rate DECIMAL(5,4) DEFAULT 0,   -- Additional for collateral deficiency
    total_provision_rate DECIMAL(5,4) NOT NULL,

    -- Provision Amounts
    general_provision DECIMAL(15,2) NOT NULL,         -- principal * general_rate
    specific_provision DECIMAL(15,2) DEFAULT 0,       -- For collateral shortfall
    total_provision DECIMAL(15,2) NOT NULL,

    -- Collateral Information
    collateral_value DECIMAL(15,2) DEFAULT 0,
    collateral_coverage_pct DECIMAL(5,2) DEFAULT 0,
    collateral_deficiency DECIMAL(15,2) DEFAULT 0,

    -- Changes from Previous Month
    previous_provision DECIMAL(15,2),
    provision_increase DECIMAL(15,2) DEFAULT 0,
    provision_decrease DECIMAL(15,2) DEFAULT 0,
    net_provision_change DECIMAL(15,2) DEFAULT 0,

    -- GL Posting
    gl_journal_entry_id BIGINT,
    is_posted BOOLEAN DEFAULT FALSE,
    posted_at TIMESTAMP WITH TIME ZONE,
    posted_by VARCHAR(100),

    -- Interest Suspense
    interest_in_suspense DECIMAL(15,2) DEFAULT 0,
    suspense_increase DECIMAL(15,2) DEFAULT 0,

    -- Write-off Information
    is_written_off BOOLEAN DEFAULT FALSE,
    write_off_amount DECIMAL(15,2) DEFAULT 0,
    write_off_date DATE,

    -- Batch Information
    batch_id VARCHAR(50),

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,

    -- Constraints
    CONSTRAINT pk_loan_provision PRIMARY KEY (id),
    CONSTRAINT fk_loan_provision_loan FOREIGN KEY (loan_id)
        REFERENCES m_loan(id) ON DELETE RESTRICT,
    CONSTRAINT uq_loan_provision_month UNIQUE (loan_id, provision_month),
    CONSTRAINT chk_provision_classification CHECK (
        classification IN ('UC', 'STD_0', 'STD_1', 'STD_2', 'SMA', 'SS', 'DF', 'BL')
    )
);

-- Indexes
CREATE INDEX idx_loan_provision_loan ON loan_provision(loan_id);
CREATE INDEX idx_loan_provision_date ON loan_provision(provision_date);
CREATE INDEX idx_loan_provision_month ON loan_provision(provision_month);
CREATE INDEX idx_loan_provision_classification ON loan_provision(classification);
CREATE INDEX idx_loan_provision_batch ON loan_provision(batch_id);

-- BRIN index for monthly data
CREATE INDEX brin_loan_provision_date ON loan_provision USING BRIN(provision_date);

COMMENT ON TABLE loan_provision IS 'Monthly provision tracking for each loan per BRPD requirements';
```

### 4.2 Provision Calculation Logic

```sql
-- Function to calculate provision for a loan
CREATE OR REPLACE FUNCTION calculate_loan_provision(
    p_loan_id BIGINT,
    p_provision_date DATE
)
RETURNS TABLE (
    classification VARCHAR(10),
    principal_outstanding DECIMAL(15,2),
    general_provision_rate DECIMAL(5,4),
    general_provision DECIMAL(15,2),
    specific_provision DECIMAL(15,2),
    total_provision DECIMAL(15,2)
) AS $$
DECLARE
    v_classification VARCHAR(10);
    v_principal DECIMAL(15,2);
    v_collateral_value DECIMAL(15,2);
    v_provision_rate DECIMAL(5,4);
    v_general_provision DECIMAL(15,2);
    v_specific_provision DECIMAL(15,2);
    v_collateral_deficiency DECIMAL(15,2);
BEGIN
    -- Get loan classification and outstanding
    SELECT l.classification, l.principal_outstanding,
           COALESCE((SELECT SUM(market_value) FROM loan_collateral WHERE loan_id = p_loan_id), 0)
    INTO v_classification, v_principal, v_collateral_value
    FROM m_loan l WHERE l.id = p_loan_id;

    -- Get provision rate
    v_provision_rate := get_provision_rate(v_classification);

    -- Calculate general provision
    v_general_provision := ROUND(v_principal * v_provision_rate, 2);

    -- Calculate specific provision for collateral deficiency (if NPA)
    v_specific_provision := 0;
    IF is_npa_classification(v_classification) THEN
        v_collateral_deficiency := GREATEST(0, v_principal - v_collateral_value);
        -- Additional 20% provision on collateral deficiency for SS, 50% for DF, 100% for BL
        v_specific_provision := CASE v_classification
            WHEN 'SS' THEN v_collateral_deficiency * 0.20
            WHEN 'DF' THEN v_collateral_deficiency * 0.50
            WHEN 'BL' THEN v_collateral_deficiency
            ELSE 0
        END;
        v_specific_provision := ROUND(v_specific_provision, 2);
    END IF;

    RETURN QUERY SELECT
        v_classification,
        v_principal,
        v_provision_rate,
        v_general_provision,
        v_specific_provision,
        v_general_provision + v_specific_provision;
END;
$$ LANGUAGE plpgsql;
```

---

## 5. Interest Suspense Accounting

### 5.1 Table Definition: interest_suspense

```sql
-- Table: {tenant_schema}.interest_suspense
-- Purpose: Track interest in suspense for NPA loans

CREATE TABLE interest_suspense (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,

    -- Loan Reference
    loan_id BIGINT NOT NULL,
    loan_account_no VARCHAR(30) NOT NULL,

    -- Suspense Entry
    suspense_date DATE NOT NULL,
    suspense_type VARCHAR(30) NOT NULL,
    -- ACCRUED_TO_SUSPENSE, REVERSAL, RECOVERY, WRITE_OFF

    -- Amounts
    interest_accrued DECIMAL(15,2) NOT NULL,          -- Interest that would have accrued
    interest_suspended DECIMAL(15,2) NOT NULL,        -- Amount moved to suspense
    interest_reversed DECIMAL(15,2) DEFAULT 0,        -- Previously accrued, now reversed
    interest_recovered DECIMAL(15,2) DEFAULT 0,       -- Recovered from suspense
    interest_written_off DECIMAL(15,2) DEFAULT 0,

    -- Balances
    suspense_balance_before DECIMAL(15,2),
    suspense_balance_after DECIMAL(15,2),

    -- GL Posting
    gl_journal_entry_id BIGINT,
    debit_gl_account VARCHAR(20),                     -- Interest Suspense Account
    credit_gl_account VARCHAR(20),                    -- Interest Income Account

    -- Classification at time of entry
    classification VARCHAR(10) NOT NULL,
    dpd INTEGER,

    -- Source
    source_type VARCHAR(30) NOT NULL,
    -- DAILY_ACCRUAL, NPA_TRANSITION, MANUAL_ADJUSTMENT, PAYMENT_RECEIVED
    source_reference_id BIGINT,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    remarks TEXT,

    -- Constraints
    CONSTRAINT pk_interest_suspense PRIMARY KEY (id),
    CONSTRAINT fk_interest_suspense_loan FOREIGN KEY (loan_id)
        REFERENCES m_loan(id) ON DELETE RESTRICT,
    CONSTRAINT chk_suspense_type CHECK (
        suspense_type IN ('ACCRUED_TO_SUSPENSE', 'REVERSAL', 'RECOVERY', 'WRITE_OFF', 'ADJUSTMENT')
    )
);

-- Indexes
CREATE INDEX idx_interest_suspense_loan ON interest_suspense(loan_id);
CREATE INDEX idx_interest_suspense_date ON interest_suspense(suspense_date);
CREATE INDEX idx_interest_suspense_type ON interest_suspense(suspense_type);
CREATE INDEX idx_interest_suspense_classification ON interest_suspense(classification);

COMMENT ON TABLE interest_suspense IS 'Interest suspense entries for NPA loans per BRPD guidelines';
```

### 5.2 Interest Treatment Rules

| Scenario | Treatment | GL Entry |
|----------|-----------|----------|
| STD/SMA loan accrual | Normal interest income | DR: Interest Receivable, CR: Interest Income |
| Transition to SS (NPA) | Reverse accrued interest | DR: Interest Income, CR: Interest Suspense |
| Daily accrual on NPA | Record in suspense only | No GL entry (memo only) |
| Payment received on NPA | Recovery from suspense | DR: Cash, CR: Interest Suspense |
| Write-off | Remove from suspense | DR: Interest Suspense, CR: Write-off Account |

---

## 6. GL Journal Entries

### 6.1 Table Definition: gl_journal_entry

```sql
-- Table: {tenant_schema}.gl_journal_entry
-- Purpose: General Ledger journal entries for compliance

CREATE TABLE gl_journal_entry (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,

    -- Journal Reference
    journal_ref VARCHAR(50) UNIQUE NOT NULL,
    journal_date DATE NOT NULL,
    posting_date DATE NOT NULL,
    value_date DATE,

    -- Entry Type
    entry_type VARCHAR(50) NOT NULL,
    -- PROVISION_INCREASE, PROVISION_DECREASE, INTEREST_SUSPENSE,
    -- INTEREST_RECOVERY, WRITE_OFF, RECOVERY_AFTER_WRITEOFF

    -- Description
    description VARCHAR(500) NOT NULL,
    narration TEXT,

    -- Amounts
    debit_amount DECIMAL(15,2) NOT NULL,
    credit_amount DECIMAL(15,2) NOT NULL,

    -- GL Accounts
    debit_gl_account VARCHAR(20) NOT NULL,
    debit_gl_account_name VARCHAR(100),
    credit_gl_account VARCHAR(20) NOT NULL,
    credit_gl_account_name VARCHAR(100),

    -- Reference
    loan_id BIGINT,
    loan_account_no VARCHAR(30),
    customer_id BIGINT,

    -- Source
    source_type VARCHAR(30) NOT NULL,
    -- CLASSIFICATION_BATCH, PROVISION_BATCH, MANUAL, TRANSACTION
    source_reference_id BIGINT,
    source_reference_type VARCHAR(30),

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    -- PENDING, POSTED, REVERSED, FAILED
    posted_at TIMESTAMP WITH TIME ZONE,
    posted_by VARCHAR(100),

    -- Reversal
    is_reversed BOOLEAN DEFAULT FALSE,
    reversed_by_journal_id BIGINT,
    reversal_date DATE,
    reversal_reason VARCHAR(200),

    -- CBS Integration
    cbs_transaction_ref VARCHAR(100),
    cbs_posted BOOLEAN DEFAULT FALSE,
    cbs_posted_at TIMESTAMP WITH TIME ZONE,
    cbs_error_message TEXT,

    -- Batch
    batch_id VARCHAR(50),

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,

    -- Constraints
    CONSTRAINT pk_gl_journal_entry PRIMARY KEY (id),
    CONSTRAINT uq_gl_journal_ref UNIQUE (journal_ref),
    CONSTRAINT chk_gl_amounts_balance CHECK (debit_amount = credit_amount),
    CONSTRAINT chk_gl_status CHECK (
        status IN ('PENDING', 'POSTED', 'REVERSED', 'FAILED')
    )
);

-- Indexes
CREATE INDEX idx_gl_journal_loan ON gl_journal_entry(loan_id);
CREATE INDEX idx_gl_journal_date ON gl_journal_entry(journal_date);
CREATE INDEX idx_gl_journal_type ON gl_journal_entry(entry_type);
CREATE INDEX idx_gl_journal_status ON gl_journal_entry(status);
CREATE INDEX idx_gl_journal_batch ON gl_journal_entry(batch_id);

COMMENT ON TABLE gl_journal_entry IS 'GL journal entries for provision, suspense, and compliance';
```

### 6.2 GL Account Mapping

| Entry Type | Debit Account | Credit Account |
|------------|---------------|----------------|
| Provision Increase | Provision Expense | Loan Loss Provision |
| Provision Decrease | Loan Loss Provision | Provision Expense |
| Interest to Suspense | Interest Income | Interest Suspense |
| Interest Recovery | Cash/Bank | Interest Suspense |
| Write-off | Loan Loss Provision | Loan Principal |
| Recovery after Write-off | Cash/Bank | Bad Debt Recovery |

---

## 7. DPD Calculation Logic

### 7.1 DPD Calculation Function

```sql
-- Function to calculate Days Past Due for a loan
CREATE OR REPLACE FUNCTION calculate_loan_dpd(p_loan_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
    v_dpd INTEGER := 0;
    v_oldest_overdue_date DATE;
    v_loan_status VARCHAR(30);
BEGIN
    -- Get loan status
    SELECT loan_status INTO v_loan_status
    FROM m_loan WHERE id = p_loan_id;

    -- Only calculate DPD for active loans
    IF v_loan_status NOT IN ('DISBURSED', 'ACTIVE') THEN
        RETURN 0;
    END IF;

    -- Find the oldest unpaid installment due date
    SELECT MIN(due_date) INTO v_oldest_overdue_date
    FROM m_loan_repayment_schedule
    WHERE loan_id = p_loan_id
      AND is_paid = FALSE
      AND due_date < CURRENT_DATE;

    -- Calculate DPD
    IF v_oldest_overdue_date IS NOT NULL THEN
        v_dpd := CURRENT_DATE - v_oldest_overdue_date;
    END IF;

    RETURN GREATEST(0, v_dpd);
END;
$$ LANGUAGE plpgsql;

-- Function to update DPD and classification for a loan
CREATE OR REPLACE FUNCTION update_loan_classification(
    p_loan_id BIGINT,
    p_batch_id VARCHAR(50) DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_current_dpd INTEGER;
    v_new_classification VARCHAR(10);
    v_old_classification VARCHAR(10);
    v_old_provision_rate DECIMAL(5,4);
    v_new_provision_rate DECIMAL(5,4);
    v_principal DECIMAL(15,2);
    v_old_provision DECIMAL(15,2);
    v_new_provision DECIMAL(15,2);
    v_was_npa BOOLEAN;
    v_is_npa BOOLEAN;
    v_loan_account_no VARCHAR(30);
BEGIN
    -- Get current loan data
    SELECT classification, principal_outstanding, account_no,
           is_npa_classification(classification)
    INTO v_old_classification, v_principal, v_loan_account_no, v_was_npa
    FROM m_loan WHERE id = p_loan_id;

    -- Calculate new DPD
    v_current_dpd := calculate_loan_dpd(p_loan_id);

    -- Determine new classification
    v_new_classification := get_classification_for_dpd(v_current_dpd);

    -- Get provision rates
    v_old_provision_rate := get_provision_rate(v_old_classification);
    v_new_provision_rate := get_provision_rate(v_new_classification);

    -- Calculate provisions
    v_old_provision := ROUND(v_principal * v_old_provision_rate, 2);
    v_new_provision := ROUND(v_principal * v_new_provision_rate, 2);

    -- Check if NPA status changed
    v_is_npa := is_npa_classification(v_new_classification);

    -- Update loan record
    UPDATE m_loan
    SET dpd = v_current_dpd,
        classification = v_new_classification,
        classification_date = CURRENT_DATE,
        previous_classification = v_old_classification,
        is_npa = v_is_npa,
        last_dpd_calculation_date = CURRENT_DATE,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = 'SYSTEM'
    WHERE id = p_loan_id;

    -- Record classification history if changed
    IF v_old_classification IS DISTINCT FROM v_new_classification THEN
        INSERT INTO loan_classification_history (
            loan_id, loan_account_no,
            previous_classification, new_classification,
            classification_date, effective_date,
            dpd, previous_dpd,
            principal_outstanding,
            previous_provision_rate, new_provision_rate,
            previous_provision_amount, new_provision_amount,
            provision_change,
            was_npa, is_npa,
            classification_reason, classification_method,
            batch_id, batch_date,
            created_by
        ) VALUES (
            p_loan_id, v_loan_account_no,
            v_old_classification, v_new_classification,
            CURRENT_DATE, CURRENT_DATE,
            v_current_dpd, NULL,
            v_principal,
            v_old_provision_rate, v_new_provision_rate,
            v_old_provision, v_new_provision,
            v_new_provision - v_old_provision,
            v_was_npa, v_is_npa,
            'AUTO_DPD', 'SYSTEM',
            p_batch_id, CURRENT_DATE,
            'SYSTEM'
        );
    END IF;
END;
$$ LANGUAGE plpgsql;
```

---

## 8. Daily Classification Batch Job

### 8.1 Batch Processing Design

```sql
-- Table for batch job tracking
CREATE TABLE classification_batch_log (
    id BIGSERIAL PRIMARY KEY,
    batch_id VARCHAR(50) UNIQUE NOT NULL,
    batch_date DATE NOT NULL,
    batch_type VARCHAR(30) NOT NULL,                  -- DAILY_DPD, MONTHLY_PROVISION, MANUAL

    -- Timing
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,

    -- Statistics
    total_loans_processed INTEGER DEFAULT 0,
    classification_changes INTEGER DEFAULT 0,
    new_npa_count INTEGER DEFAULT 0,
    upgraded_count INTEGER DEFAULT 0,
    downgraded_count INTEGER DEFAULT 0,

    -- Provision Impact
    total_provision_increase DECIMAL(15,2) DEFAULT 0,
    total_provision_decrease DECIMAL(15,2) DEFAULT 0,
    net_provision_change DECIMAL(15,2) DEFAULT 0,

    -- Interest Suspense
    total_interest_suspended DECIMAL(15,2) DEFAULT 0,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'RUNNING',
    -- RUNNING, COMPLETED, FAILED, CANCELLED
    error_message TEXT,

    -- Audit
    created_by VARCHAR(100) NOT NULL,

    CONSTRAINT pk_classification_batch PRIMARY KEY (id),
    CONSTRAINT uq_batch_id UNIQUE (batch_id)
);

-- Function to run daily classification batch
CREATE OR REPLACE FUNCTION run_daily_classification_batch()
RETURNS VARCHAR AS $$
DECLARE
    v_batch_id VARCHAR(50);
    v_loan RECORD;
    v_total_processed INTEGER := 0;
    v_changes INTEGER := 0;
BEGIN
    -- Generate batch ID
    v_batch_id := 'CLF-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' ||
                  LPAD(EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::TEXT, 10, '0');

    -- Create batch log entry
    INSERT INTO classification_batch_log (batch_id, batch_date, batch_type, started_at, status, created_by)
    VALUES (v_batch_id, CURRENT_DATE, 'DAILY_DPD', CURRENT_TIMESTAMP, 'RUNNING', 'SYSTEM');

    -- Process all active loans
    FOR v_loan IN
        SELECT id FROM m_loan
        WHERE loan_status IN ('DISBURSED', 'ACTIVE')
          AND is_deleted = FALSE
    LOOP
        BEGIN
            PERFORM update_loan_classification(v_loan.id, v_batch_id);
            v_total_processed := v_total_processed + 1;
        EXCEPTION WHEN OTHERS THEN
            -- Log error but continue processing
            RAISE NOTICE 'Error processing loan %: %', v_loan.id, SQLERRM;
        END;
    END LOOP;

    -- Update batch statistics
    UPDATE classification_batch_log
    SET status = 'COMPLETED',
        completed_at = CURRENT_TIMESTAMP,
        duration_seconds = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at)),
        total_loans_processed = v_total_processed,
        classification_changes = (
            SELECT COUNT(*) FROM loan_classification_history WHERE batch_id = v_batch_id
        ),
        new_npa_count = (
            SELECT COUNT(*) FROM loan_classification_history
            WHERE batch_id = v_batch_id AND was_npa = FALSE AND is_npa = TRUE
        ),
        net_provision_change = (
            SELECT COALESCE(SUM(provision_change), 0)
            FROM loan_classification_history WHERE batch_id = v_batch_id
        )
    WHERE batch_id = v_batch_id;

    RETURN v_batch_id;
END;
$$ LANGUAGE plpgsql;
```

### 8.2 Batch Schedule

| Batch | Schedule | Purpose |
|-------|----------|---------|
| Daily DPD Calculation | 02:30 AM daily | Update DPD and classification |
| Monthly Provision | 1st of month, 03:00 AM | Calculate monthly provisions |
| Interest Suspense | Daily at 02:00 AM | Process interest for NPA loans |
| Regulatory Reports | Monthly, 5th | Generate CL reports |

---

## 9. Regulatory Reports Data Structure

### 9.1 Table Definition: regulatory_report_log

```sql
-- Table: {tenant_schema}.regulatory_report_log
-- Purpose: Track regulatory report generation and submission

CREATE TABLE regulatory_report_log (
    id BIGSERIAL PRIMARY KEY,

    -- Report Identification
    report_id VARCHAR(50) UNIQUE NOT NULL,
    report_type VARCHAR(30) NOT NULL,
    -- CL_1, CL_2, CL_3, CL_4, CL_5, CIB_MONTHLY, PROVISION_SUMMARY
    report_name VARCHAR(100) NOT NULL,

    -- Period
    report_period VARCHAR(7) NOT NULL,                -- YYYY-MM
    report_date DATE NOT NULL,
    period_start_date DATE,
    period_end_date DATE,

    -- File Information
    file_name VARCHAR(200),
    file_path VARCHAR(500),
    file_format VARCHAR(20),                          -- PDF, XLSX, CSV, TXT
    file_size BIGINT,
    file_checksum VARCHAR(64),

    -- Report Statistics
    total_loans INTEGER,
    total_customers INTEGER,
    total_outstanding DECIMAL(18,2),
    total_provision DECIMAL(18,2),

    -- Classification Breakdown
    std_count INTEGER,
    std_outstanding DECIMAL(18,2),
    sma_count INTEGER,
    sma_outstanding DECIMAL(18,2),
    npa_count INTEGER,
    npa_outstanding DECIMAL(18,2),

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'GENERATED',
    -- GENERATING, GENERATED, VALIDATED, SUBMITTED, ACKNOWLEDGED, REJECTED

    -- Generation
    generated_at TIMESTAMP WITH TIME ZONE,
    generated_by VARCHAR(100),
    generation_duration_seconds INTEGER,

    -- Validation
    validated_at TIMESTAMP WITH TIME ZONE,
    validated_by VARCHAR(100),
    validation_errors JSONB,

    -- Submission
    submitted_at TIMESTAMP WITH TIME ZONE,
    submitted_by VARCHAR(100),
    submission_method VARCHAR(30),                    -- SFTP, EMAIL, PORTAL
    submission_reference VARCHAR(100),

    -- Acknowledgement
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledgement_reference VARCHAR(100),
    rejection_reason TEXT,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    remarks TEXT,

    CONSTRAINT pk_regulatory_report PRIMARY KEY (id),
    CONSTRAINT uq_report_id UNIQUE (report_id),
    CONSTRAINT chk_report_type CHECK (
        report_type IN ('CL_1', 'CL_2', 'CL_3', 'CL_4', 'CL_5', 'CIB_MONTHLY', 'PROVISION_SUMMARY', 'NPA_MOVEMENT')
    )
);

-- Indexes
CREATE INDEX idx_regulatory_report_type ON regulatory_report_log(report_type);
CREATE INDEX idx_regulatory_report_period ON regulatory_report_log(report_period);
CREATE INDEX idx_regulatory_report_status ON regulatory_report_log(status);

COMMENT ON TABLE regulatory_report_log IS 'Regulatory report generation and submission tracking';
```

### 9.2 CL Report Types

| Report | Description | Frequency | Submission |
|--------|-------------|-----------|------------|
| CL-1 | Classified Loans Statement | Monthly | By 15th |
| CL-2 | Provision Details | Monthly | By 15th |
| CL-3 | Recovery Position | Monthly | By 15th |
| CL-4 | Write-off Details | Monthly | By 15th |
| CL-5 | Restructured Loans | Monthly | By 15th |

---

## 10. Compliance Validation Rules

### 10.1 Validation Rules Table

```sql
-- Table: {tenant_schema}.compliance_validation_rule
CREATE TABLE compliance_validation_rule (
    id SERIAL PRIMARY KEY,
    rule_code VARCHAR(30) UNIQUE NOT NULL,
    rule_name VARCHAR(100) NOT NULL,
    rule_category VARCHAR(30) NOT NULL,
    -- CLASSIFICATION, PROVISION, INTEREST, REPORTING
    rule_description TEXT,
    validation_query TEXT,
    error_message VARCHAR(500),
    severity VARCHAR(20) NOT NULL,
    -- ERROR, WARNING, INFO
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sample validation rules
INSERT INTO compliance_validation_rule (rule_code, rule_name, rule_category, rule_description, severity) VALUES
('CLF001', 'DPD Consistency', 'CLASSIFICATION', 'DPD must match oldest overdue installment', 'ERROR'),
('CLF002', 'Classification Match', 'CLASSIFICATION', 'Classification must match DPD bracket', 'ERROR'),
('PRV001', 'Provision Rate', 'PROVISION', 'Provision rate must match classification', 'ERROR'),
('PRV002', 'Provision Amount', 'PROVISION', 'Provision = Outstanding x Rate', 'ERROR'),
('INT001', 'Interest Suspense', 'INTEREST', 'NPA loans must have interest in suspense', 'ERROR'),
('RPT001', 'Report Completeness', 'REPORTING', 'All active loans must be in CL report', 'ERROR');
```

---

## 11. Flyway Migration Scripts

### 11.1 Migration: V1.0.2__create_brpd_compliance_tables.sql

```sql
-- V1.0.2__create_brpd_compliance_tables.sql
-- Description: Create BRPD compliance tables
-- Author: Lead Dev
-- Date: 2026-02-05

-- Tables created:
-- 1. ref_classification_code
-- 2. loan_classification_history
-- 3. loan_provision
-- 4. interest_suspense
-- 5. gl_journal_entry
-- 6. classification_batch_log
-- 7. regulatory_report_log
-- 8. compliance_validation_rule

-- Functions created:
-- 1. get_classification_for_dpd()
-- 2. get_provision_rate()
-- 3. is_npa_classification()
-- 4. calculate_loan_dpd()
-- 5. update_loan_classification()
-- 6. run_daily_classification_batch()
```

---

**Document End**

*ULMS v2.0 - Data Model - BRPD Compliance v1.0*

*Unisoft Systems Limited - Confidential*

*This document provides the complete data model for BRPD 15/2024 compliance with 7-stage loan classification.*

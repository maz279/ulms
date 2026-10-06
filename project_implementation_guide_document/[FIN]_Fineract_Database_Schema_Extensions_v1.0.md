# Fineract Database Schema Extensions
## Bangladesh-Specific Schema Customizations for ULMS v2.0

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Fineract Database Schema Extensions |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 8, 2026 |
| **Prepared By** | Database Architect / Backend Developer |
| **Classification** | Internal |
| **Status** | Approved |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Bangladesh Regulatory Requirements](#2-bangladesh-regulatory-requirements)
3. [Schema Extension Architecture](#3-schema-extension-architecture)
4. [Core Extensions](#4-core-extensions)
5. [Loan Classification Schema](#5-loan-classification-schema)
6. [CIB Integration Schema](#6-cib-integration-schema)
7. [Islamic Banking Schema](#7-islamic-banking-schema)
8. [Migration Scripts](#8-migration-scripts)
9. [Data Migration](#9-data-migration)
10. [Performance Optimization](#10-performance-optimization)
11. [Appendix](#11-appendix)

---

## 1. Overview

### 1.1 Purpose

This document defines the database schema extensions required to adapt Apache Fineract for Bangladesh banking regulations and ULMS v2.0 specific requirements.

### 1.2 Extension Strategy

| Approach | Description | Usage |
|----------|-------------|-------|
| New Tables | Custom tables for Bangladesh-specific data | CIB reports, NID verification |
| Extended Tables | Additional columns to existing Fineract tables | Loan classification, Islamic flags |
| Views | Aggregated views for reporting | BRPD compliance reports |
| Functions/Procedures | Business logic in database | Auto-classification |

---

## 2. Bangladesh Regulatory Requirements

### 2.1 BRPD Loan Classification (Circular 15/2024)

| Stage | Classification | DPD Range | Provision % |
|-------|---------------|-----------|-------------|
| STD-0 | Standard (Current) | 0 | 1% |
| STD-1 | Standard (Watch) | 1-30 | 1% |
| STD-2 | Standard (Caution) | 31-60 | 1% |
| SMA | Special Mention | 61-90 | 5% |
| SS | Substandard | 91-180 | 20% |
| DF | Doubtful | 181-365 | 50% |
| BL | Bad/Loss | >365 | 100% |

### 2.2 Required Data Elements

- NID (National ID) - 13/17 digits
- TIN (Tax Identification Number)
- Mobile Financial Services (MFS) accounts
- Islamic banking indicators
- CIB inquiry tracking
- Bangladesh Bank reporting codes

---

## 3. Schema Extension Architecture

### 3.1 Schema Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ULMS Database Schema                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                  Apache Fineract Core                        │   │
│  │  • m_loan, m_client, m_group                                │   │
│  │  • m_product_loan, m_charge                                 │   │
│  │  • Accrual Accounting Tables                                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ▲                                      │
│  ┌───────────────────────────┼───────────────────────────┐          │
│  │                           │                           │          │
│  ▼                           ▼                           ▼          │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐        │
│  │ ULMS Extensions│  │ BRPD Compliance│  │  CIB/NID Data  │        │
│  ├────────────────┤  ├────────────────┤  ├────────────────┤        │
│  │ ulms_loan_     │  │ brpd_loan_     │  │ cib_inquiry    │        │
│  │   classification│  │   classification│  │ cib_report     │        │
│  │ ulms_islamic_  │  │ brpd_provision │  │ nid_verification│        │
│  │   product_terms│  │   _summary     │  │ cib_consent    │        │
│  │ ulms_customer_ │  │ brpd_large_loan│  │                │        │
│  │   nid_details  │  │   _report      │  │                │        │
│  └────────────────┘  └────────────────┘  └────────────────┘        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Core Extensions

### 4.1 Extended Client Table

```sql
-- Add Bangladesh-specific columns to m_client
ALTER TABLE m_client ADD COLUMN IF NOT EXISTS nid_number VARCHAR(17);
ALTER TABLE m_client ADD COLUMN IF NOT EXISTS tin_number VARCHAR(12);
ALTER TABLE m_client ADD COLUMN IF NOT EXISTS date_of_birth_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE m_client ADD COLUMN IF NOT EXISTS nid_verification_status VARCHAR(20);
ALTER TABLE m_client ADD COLUMN IF NOT EXISTS nid_verified_date TIMESTAMP;
ALTER TABLE m_client ADD COLUMN IF NOT EXISTS mobile_number_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE m_client ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE m_client ADD COLUMN IF NOT EXISTS occupation_code VARCHAR(10);
ALTER TABLE m_client ADD COLUMN IF NOT EXISTS employer_name VARCHAR(100);
ALTER TABLE m_client ADD COLUMN IF NOT EXISTS monthly_income DECIMAL(19,6);
ALTER TABLE m_client ADD COLUMN IF NOT EXISTS income_source VARCHAR(50);
ALTER TABLE m_client ADD COLUMN IF NOT EXISTS politically_exposed_person BOOLEAN DEFAULT FALSE;
ALTER TABLE m_client ADD COLUMN IF NOT EXISTS pep_category VARCHAR(20);
ALTER TABLE m_client ADD COLUMN IF NOT EXISTS risk_rating VARCHAR(10);
ALTER TABLE m_client ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(20) DEFAULT 'PENDING';
ALTER TABLE m_client ADD COLUMN IF NOT EXISTS kyc_completed_date TIMESTAMP;
ALTER TABLE m_client ADD COLUMN IF NOT EXISTS introducer_id BIGINT;
ALTER TABLE m_client ADD COLUMN IF NOT EXISTS introducer_relationship VARCHAR(50);
ALTER TABLE m_client ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'bn';

-- Create index for NID lookups
CREATE INDEX IF NOT EXISTS idx_m_client_nid ON m_client(nid_number);
CREATE INDEX IF NOT EXISTS idx_m_client_mobile ON m_client(mobile_no);

-- Add comment for documentation
COMMENT ON COLUMN m_client.nid_number IS 'Bangladesh National ID Number (13 or 17 digits)';
COMMENT ON COLUMN m_client.tin_number IS 'Tax Identification Number';
COMMENT ON COLUMN m_client.politically_exposed_person IS 'PEP status for AML compliance';
```

### 4.2 Extended Loan Table

```sql
-- Add Bangladesh-specific loan columns
ALTER TABLE m_loan ADD COLUMN IF NOT EXISTS application_number VARCHAR(50);
ALTER TABLE m_loan ADD COLUMN IF NOT EXISTS bd_loan_purpose_code VARCHAR(10);
ALTER TABLE m_loan ADD COLUMN IF NOT EXISTS bd_sector_code VARCHAR(10);
ALTER TABLE m_loan ADD COLUMN IF NOT EXISTS bd_economic_purpose_code VARCHAR(10);
ALTER TABLE m_loan ADD COLUMN IF NOT EXISTS is_islamic BOOLEAN DEFAULT FALSE;
ALTER TABLE m_loan ADD COLUMN IF NOT EXISTS islamic_mode VARCHAR(20);
ALTER TABLE m_loan ADD COLUMN IF NOT EXISTS cib_inquiry_id VARCHAR(50);
ALTER TABLE m_loan ADD COLUMN IF NOT EXISTS cib_report_date DATE;
ALTER TABLE m_loan ADD COLUMN IF NOT EXISTS cib_score INTEGER;
ALTER TABLE m_loan ADD COLUMN IF NOT EXISTS internal_credit_score INTEGER;
ALTER TABLE m_loan ADD COLUMN IF NOT EXISTS loan_committee_approval_required BOOLEAN DEFAULT FALSE;
ALTER TABLE m_loan ADD COLUMN IF NOT EXISTS committee_approved_amount DECIMAL(19,6);
ALTER TABLE m_loan ADD COLUMN IF NOT EXISTS committee_approved_date TIMESTAMP;
ALTER TABLE m_loan ADD COLUMN IF NOT EXISTS committee_remarks TEXT;
ALTER TABLE m_loan ADD COLUMN IF NOT EXISTS security_value DECIMAL(19,6);
ALTER TABLE m_loan ADD COLUMN IF NOT EXISTS security_type VARCHAR(50);
ALTER TABLE m_loan ADD COLUMN IF NOT EXISTS margin_percentage DECIMAL(5,2);
ALTER TABLE m_loan ADD COLUMN IF NOT EXISTS emi_starts_after_months INTEGER DEFAULT 0;
ALTER TABLE m_loan ADD COLUMN IF NOT EXISTS grace_period_principal INTEGER DEFAULT 0;
ALTER TABLE m_loan ADD COLUMN IF NOT EXISTS grace_period_interest INTEGER DEFAULT 0;
ALTER TABLE m_loan ADD COLUMN IF NOT EXISTS disbursement_schedule TEXT;
ALTER TABLE m_loan ADD COLUMN IF NOT EXISTS repayment_account_id BIGINT;
ALTER TABLE m_loan ADD COLUMN IF NOT EXISTS repayment_account_type VARCHAR(20);
ALTER TABLE m_loan ADD COLUMN IF NOT EXISTS mfs_account_number VARCHAR(20);
ALTER TABLE m_loan ADD COLUMN IF NOT EXISTS mfs_provider VARCHAR(20);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_m_loan_app_number ON m_loan(application_number);
CREATE INDEX IF NOT EXISTS idx_m_loan_islamic ON m_loan(is_islamic);
CREATE INDEX IF NOT EXISTS idx_m_loan_cib_inquiry ON m_loan(cib_inquiry_id);

COMMENT ON COLUMN m_loan.is_islamic IS 'Flag for Islamic/Shariah-compliant loan';
COMMENT ON COLUMN m_loan.cib_score IS 'Credit score from CIB inquiry';
```

### 4.3 New Table: ULMS Customer NID Details

```sql
CREATE TABLE IF NOT EXISTS ulms_customer_nid_details (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL,
    nid_number VARCHAR(17) NOT NULL,
    nid_type VARCHAR(10) DEFAULT 'SMART', -- SMART, OLD, DIGITAL
    full_name_english VARCHAR(100),
    full_name_bangla VARCHAR(100),
    father_name_english VARCHAR(100),
    father_name_bangla VARCHAR(100),
    mother_name_english VARCHAR(100),
    mother_name_bangla VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(10),
    blood_group VARCHAR(5),
    present_address JSONB,
    permanent_address JSONB,
    photo BYTEA,
    photo_hash VARCHAR(64),
    verification_id VARCHAR(50),
    verification_date TIMESTAMP,
    verification_status VARCHAR(20) DEFAULT 'PENDING',
    nidw_response JSONB,
    created_by BIGINT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_by BIGINT,
    last_modified_date TIMESTAMP,
    CONSTRAINT uk_ulms_nid_number UNIQUE (nid_number),
    CONSTRAINT fk_ulms_nid_client FOREIGN KEY (client_id) 
        REFERENCES m_client(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ulms_nid_client ON ulms_customer_nid_details(client_id);
CREATE INDEX IF NOT EXISTS idx_ulms_nid_verification ON ulms_customer_nid_details(verification_status);

COMMENT ON TABLE ulms_customer_nid_details IS 'Extended NID verification data from NIDW';
```

---

## 5. Loan Classification Schema

### 5.1 Loan Classification History Table

```sql
CREATE TABLE IF NOT EXISTS brpd_loan_classification (
    id BIGSERIAL PRIMARY KEY,
    loan_id BIGINT NOT NULL,
    classification_date DATE NOT NULL,
    classification_stage VARCHAR(5) NOT NULL, -- STD-0, STD-1, STD-2, SMA, SS, DF, BL
    classification_name VARCHAR(50),
    days_past_due INTEGER DEFAULT 0,
    outstanding_principal DECIMAL(19,6) DEFAULT 0,
    outstanding_interest DECIMAL(19,6) DEFAULT 0,
    total_outstanding DECIMAL(19,6) DEFAULT 0,
    provision_percentage DECIMAL(5,2),
    provision_amount DECIMAL(19,6),
    interest_suspense_amount DECIMAL(19,6),
    classification_reason VARCHAR(100),
    next_review_date DATE,
    reviewed_by BIGINT,
    review_date TIMESTAMP,
    remarks TEXT,
    is_manual_classification BOOLEAN DEFAULT FALSE,
    manual_classification_reason TEXT,
    bb_reporting_code VARCHAR(10),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_brpd_classification_loan FOREIGN KEY (loan_id) 
        REFERENCES m_loan(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_brpd_class_loan ON brpd_loan_classification(loan_id);
CREATE INDEX IF NOT EXISTS idx_brpd_class_date ON brpd_loan_classification(classification_date);
CREATE INDEX IF NOT EXISTS idx_brpd_class_stage ON brpd_loan_classification(classification_stage);

COMMENT ON TABLE brpd_loan_classification IS 'BRPD Circular 15/2024 loan classification tracking';
```

### 5.2 Auto-Classification Function

```sql
CREATE OR REPLACE FUNCTION calculate_loan_classification(
    p_loan_id BIGINT,
    p_as_of_date DATE DEFAULT CURRENT_DATE
)
RETURNS VARCHAR(5) AS $$
DECLARE
    v_dpd INTEGER;
    v_classification VARCHAR(5);
    v_loan_status VARCHAR(20);
BEGIN
    -- Get loan status
    SELECT loan_status_enum INTO v_loan_status 
    FROM m_loan WHERE id = p_loan_id;
    
    -- If loan is closed or written off
    IF v_loan_status IN (600, 601) THEN
        RETURN 'CLOSED';
    END IF;
    
    -- Calculate days past due
    SELECT COALESCE(MAX(CASE 
        WHEN due_date < p_as_of_date AND principal_portion_derived > 0 
        THEN p_as_of_date - due_date 
        ELSE 0 
    END), 0)
    INTO v_dpd
    FROM m_loan_repayment_schedule 
    WHERE loan_id = p_loan_id AND completed_derived = FALSE;
    
    -- Determine classification based on DPD
    v_classification := CASE
        WHEN v_dpd = 0 THEN 'STD-0'
        WHEN v_dpd BETWEEN 1 AND 30 THEN 'STD-1'
        WHEN v_dpd BETWEEN 31 AND 60 THEN 'STD-2'
        WHEN v_dpd BETWEEN 61 AND 90 THEN 'SMA'
        WHEN v_dpd BETWEEN 91 AND 180 THEN 'SS'
        WHEN v_dpd BETWEEN 181 AND 365 THEN 'DF'
        ELSE 'BL'
    END;
    
    RETURN v_classification;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_loan_classification IS 'Calculate BRPD loan classification based on DPD';
```

### 5.3 Provision Summary Table

```sql
CREATE TABLE IF NOT EXISTS brpd_provision_summary (
    id BIGSERIAL PRIMARY KEY,
    report_date DATE NOT NULL,
    branch_id BIGINT,
    product_id BIGINT,
    classification_stage VARCHAR(5),
    loan_count INTEGER DEFAULT 0,
    total_outstanding DECIMAL(19,6) DEFAULT 0,
    provision_percentage DECIMAL(5,2),
    provision_required DECIMAL(19,6) DEFAULT 0,
    provision_held DECIMAL(19,6) DEFAULT 0,
    provision_shortfall DECIMAL(19,6) DEFAULT 0,
    interest_suspended DECIMAL(19,6) DEFAULT 0,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_brpd_prov_summary UNIQUE (report_date, branch_id, product_id, classification_stage)
);

CREATE INDEX IF NOT EXISTS idx_brpd_prov_date ON brpd_provision_summary(report_date);
CREATE INDEX IF NOT EXISTS idx_brpd_prov_branch ON brpd_provision_summary(branch_id);

COMMENT ON TABLE brpd_provision_summary IS 'Daily provision summary for BRPD reporting';
```

---

## 6. CIB Integration Schema

### 6.1 CIB Inquiry Table

```sql
CREATE TABLE IF NOT EXISTS cib_inquiry (
    id BIGSERIAL PRIMARY KEY,
    inquiry_id VARCHAR(50) NOT NULL,
    client_id BIGINT NOT NULL,
    loan_id BIGINT,
    nid_number VARCHAR(17) NOT NULL,
    inquiry_type VARCHAR(20) DEFAULT 'INDIVIDUAL', -- INDIVIDUAL, COMMERCIAL, GUARANTOR
    inquiry_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    inquiry_status VARCHAR(20) DEFAULT 'PENDING',
    response_code VARCHAR(10),
    response_message VARCHAR(200),
    cib_score INTEGER,
    score_grade VARCHAR(5),
    total_outstanding_amount DECIMAL(19,6),
    total_number_of_loans INTEGER,
    worst_status VARCHAR(10),
    inquiry_count_6m INTEGER,
    inquiry_count_12m INTEGER,
    cib_report JSONB,
    raw_response XML,
    consent_id VARCHAR(50),
    consent_date TIMESTAMP,
    created_by BIGINT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_cib_inquiry_id UNIQUE (inquiry_id),
    CONSTRAINT fk_cib_inquiry_client FOREIGN KEY (client_id) 
        REFERENCES m_client(id) ON DELETE CASCADE,
    CONSTRAINT fk_cib_inquiry_loan FOREIGN KEY (loan_id) 
        REFERENCES m_loan(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_cib_inquiry_client ON cib_inquiry(client_id);
CREATE INDEX IF NOT EXISTS idx_cib_inquiry_loan ON cib_inquiry(loan_id);
CREATE INDEX IF NOT EXISTS idx_cib_inquiry_nid ON cib_inquiry(nid_number);
CREATE INDEX IF NOT EXISTS idx_cib_inquiry_date ON cib_inquiry(inquiry_date);

COMMENT ON TABLE cib_inquiry IS 'Credit Information Bureau inquiry tracking';
```

### 6.2 CIB Consent Table

```sql
CREATE TABLE IF NOT EXISTS cib_consent (
    id BIGSERIAL PRIMARY KEY,
    consent_id VARCHAR(50) NOT NULL,
    client_id BIGINT NOT NULL,
    nid_number VARCHAR(17) NOT NULL,
    consent_type VARCHAR(20) DEFAULT 'CIB_INQUIRY',
    consent_granted BOOLEAN DEFAULT FALSE,
    consent_date TIMESTAMP,
    consent_expiry_date TIMESTAMP,
    consent_document BYTEA,
    consent_document_type VARCHAR(20),
    ip_address VARCHAR(45),
    user_agent TEXT,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_date TIMESTAMP,
    revoked_reason TEXT,
    created_by BIGINT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_cib_consent_id UNIQUE (consent_id),
    CONSTRAINT fk_cib_consent_client FOREIGN KEY (client_id) 
        REFERENCES m_client(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cib_consent_client ON cib_consent(client_id);
CREATE INDEX IF NOT EXISTS idx_cib_consent_expiry ON cib_consent(consent_expiry_date);

COMMENT ON TABLE cib_consent IS 'Customer consent for CIB inquiries';
```

---

## 7. Islamic Banking Schema

### 7.1 Islamic Product Terms Table

```sql
CREATE TABLE IF NOT EXISTS ulms_islamic_product_terms (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    financing_mode VARCHAR(20) NOT NULL, -- MURABAHA, IJARAH, MUDARABA, MUSHARAKA, BAI_MUJJAL
    profit_calculation_method VARCHAR(30), -- FIXED, VARIABLE, TIERED
    profit_rate DECIMAL(19,6),
    profit_rate_type VARCHAR(10), -- FLAT, DECLINING, ACTUAL
    buy_price DECIMAL(19,6),
    selling_price DECIMAL(19,6),
    security_deposit_required BOOLEAN DEFAULT FALSE,
    security_deposit_percentage DECIMAL(5,2),
    security_deposit_amount DECIMAL(19,6),
    late_payment_penalty_type VARCHAR(20), -- CHARITY, PENALTY_ACCOUNT
    penalty_rate DECIMAL(5,2),
    penalty_account_id BIGINT,
    shariah_advisor_approval_required BOOLEAN DEFAULT TRUE,
    shariah_compliance_notes TEXT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_date TIMESTAMP,
    CONSTRAINT fk_ulms_islamic_product FOREIGN KEY (product_id) 
        REFERENCES m_product_loan(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ulms_islamic_product ON ulms_islamic_product_terms(product_id);
CREATE INDEX IF NOT EXISTS idx_ulms_islamic_mode ON ulms_islamic_product_terms(financing_mode);

COMMENT ON TABLE ulms_islamic_product_terms IS 'Islamic financing product terms and conditions';
```

### 7.2 Islamic Loan Schedule Extension

```sql
CREATE TABLE IF NOT EXISTS ulms_islamic_loan_schedule (
    id BIGSERIAL PRIMARY KEY,
    loan_repayment_schedule_id BIGINT NOT NULL,
    loan_id BIGINT NOT NULL,
    installment_number INTEGER NOT NULL,
    principal_amount DECIMAL(19,6) DEFAULT 0,
    profit_amount DECIMAL(19,6) DEFAULT 0,
    total_installment_amount DECIMAL(19,6) DEFAULT 0,
    outstanding_principal DECIMAL(19,6) DEFAULT 0,
    outstanding_profit DECIMAL(19,6) DEFAULT 0,
    cost_price DECIMAL(19,6), -- For Murabaha
    selling_price DECIMAL(19,6), -- For Murabaha
    rent_amount DECIMAL(19,6), -- For Ijarah
    purchase_price DECIMAL(19,6), -- For diminishing Musharaka
    customer_share DECIMAL(5,2), -- For Musharaka
    bank_share DECIMAL(5,2), -- For Musharaka
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ulms_islamic_schedule FOREIGN KEY (loan_repayment_schedule_id) 
        REFERENCES m_loan_repayment_schedule(id) ON DELETE CASCADE,
    CONSTRAINT fk_ulms_islamic_loan FOREIGN KEY (loan_id) 
        REFERENCES m_loan(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ulms_islamic_schedule_loan ON ulms_islamic_loan_schedule(loan_id);
CREATE INDEX IF NOT EXISTS idx_ulms_islamic_schedule_repayment ON ulms_islamic_loan_schedule(loan_repayment_schedule_id);

COMMENT ON TABLE ulms_islamic_loan_schedule IS 'Islamic loan repayment schedule breakdown';
```

---

## 8. Migration Scripts

### 8.1 Flyway Migration Configuration

```yaml
# application.yml
spring:
  flyway:
    enabled: true
    locations: 
      - classpath:db/migration/fineract
      - classpath:db/migration/ulms
    baseline-on-migrate: true
    validate-on-migrate: true
    out-of-order: false
    schemas:
      - public
      - ulms_extensions
```

### 8.2 Migration Script: V1__ULMS_Core_Extensions.sql

```sql
-- Migration: V1__ULMS_Core_Extensions.sql
-- Date: 2026-02-08
-- Description: Initial ULMS schema extensions for Bangladesh

-- Create ULMS schema
CREATE SCHEMA IF NOT EXISTS ulms_extensions;

-- Extension to m_client table
ALTER TABLE m_client 
    ADD COLUMN IF NOT EXISTS nid_number VARCHAR(17),
    ADD COLUMN IF NOT EXISTS tin_number VARCHAR(12),
    ADD COLUMN IF NOT EXISTS date_of_birth_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS nid_verification_status VARCHAR(20),
    ADD COLUMN IF NOT EXISTS politically_exposed_person BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS risk_rating VARCHAR(10),
    ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(20) DEFAULT 'PENDING';

CREATE INDEX IF NOT EXISTS idx_m_client_nid ON m_client(nid_number);

-- Extension to m_loan table
ALTER TABLE m_loan 
    ADD COLUMN IF NOT EXISTS application_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS is_islamic BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS islamic_mode VARCHAR(20),
    ADD COLUMN IF NOT EXISTS cib_inquiry_id VARCHAR(50),
    ADD COLUMN IF NOT EXISTS cib_score INTEGER,
    ADD COLUMN IF NOT EXISTS internal_credit_score INTEGER,
    ADD COLUMN IF NOT EXISTS bb_loan_purpose_code VARCHAR(10),
    ADD COLUMN IF NOT EXISTS bb_sector_code VARCHAR(10);

CREATE INDEX IF NOT EXISTS idx_m_loan_app_number ON m_loan(application_number);
CREATE INDEX IF NOT EXISTS idx_m_loan_islamic ON m_loan(is_islamic);

-- Insert migration tracking
INSERT INTO schema_version (version, description, type, script, checksum, installed_by, execution_time, success)
VALUES ('1', 'ULMS Core Extensions', 'SQL', 'V1__ULMS_Core_Extensions.sql', 0, 'system', 0, TRUE)
ON CONFLICT (version) DO NOTHING;
```

### 8.3 Migration Script: V2__ULMS_BRPD_Tables.sql

```sql
-- Migration: V2__ULMS_BRPD_Tables.sql
-- Date: 2026-02-08
-- Description: BRPD compliance tables

-- Loan classification table
CREATE TABLE IF NOT EXISTS brpd_loan_classification (
    id BIGSERIAL PRIMARY KEY,
    loan_id BIGINT NOT NULL,
    classification_date DATE NOT NULL,
    classification_stage VARCHAR(5) NOT NULL,
    days_past_due INTEGER DEFAULT 0,
    outstanding_principal DECIMAL(19,6) DEFAULT 0,
    outstanding_interest DECIMAL(19,6) DEFAULT 0,
    provision_percentage DECIMAL(5,2),
    provision_amount DECIMAL(19,6),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_brpd_class_loan ON brpd_loan_classification(loan_id);
CREATE INDEX idx_brpd_class_date ON brpd_loan_classification(classification_date);

-- Provision summary table
CREATE TABLE IF NOT EXISTS brpd_provision_summary (
    id BIGSERIAL PRIMARY KEY,
    report_date DATE NOT NULL,
    branch_id BIGINT,
    classification_stage VARCHAR(5),
    loan_count INTEGER DEFAULT 0,
    total_outstanding DECIMAL(19,6) DEFAULT 0,
    provision_required DECIMAL(19,6) DEFAULT 0,
    CONSTRAINT uk_brpd_prov_summary UNIQUE (report_date, branch_id, classification_stage)
);

-- Insert migration tracking
INSERT INTO schema_version (version, description, type, script, checksum, installed_by, execution_time, success)
VALUES ('2', 'ULMS BRPD Tables', 'SQL', 'V2__ULMS_BRPD_Tables.sql', 0, 'system', 0, TRUE)
ON CONFLICT (version) DO NOTHING;
```

### 8.4 Migration Script: V3__ULMS_CIB_Tables.sql

```sql
-- Migration: V3__ULMS_CIB_Tables.sql
-- Date: 2026-02-08
-- Description: CIB and NID verification tables

-- CIB Inquiry table
CREATE TABLE IF NOT EXISTS cib_inquiry (
    id BIGSERIAL PRIMARY KEY,
    inquiry_id VARCHAR(50) NOT NULL UNIQUE,
    client_id BIGINT NOT NULL REFERENCES m_client(id),
    loan_id BIGINT REFERENCES m_loan(id),
    nid_number VARCHAR(17) NOT NULL,
    inquiry_type VARCHAR(20) DEFAULT 'INDIVIDUAL',
    inquiry_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    inquiry_status VARCHAR(20) DEFAULT 'PENDING',
    cib_score INTEGER,
    cib_report JSONB
);

CREATE INDEX idx_cib_inquiry_client ON cib_inquiry(client_id);
CREATE INDEX idx_cib_inquiry_nid ON cib_inquiry(nid_number);

-- CIB Consent table
CREATE TABLE IF NOT EXISTS cib_consent (
    id BIGSERIAL PRIMARY KEY,
    consent_id VARCHAR(50) NOT NULL UNIQUE,
    client_id BIGINT NOT NULL REFERENCES m_client(id),
    nid_number VARCHAR(17) NOT NULL,
    consent_granted BOOLEAN DEFAULT FALSE,
    consent_date TIMESTAMP,
    consent_expiry_date TIMESTAMP
);

CREATE INDEX idx_cib_consent_client ON cib_consent(client_id);

-- NID Details table
CREATE TABLE IF NOT EXISTS ulms_customer_nid_details (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES m_client(id),
    nid_number VARCHAR(17) NOT NULL UNIQUE,
    full_name_english VARCHAR(100),
    full_name_bangla VARCHAR(100),
    date_of_birth DATE,
    present_address JSONB,
    permanent_address JSONB,
    verification_status VARCHAR(20) DEFAULT 'PENDING',
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ulms_nid_client ON ulms_customer_nid_details(client_id);

-- Insert migration tracking
INSERT INTO schema_version (version, description, type, script, checksum, installed_by, execution_time, success)
VALUES ('3', 'ULMS CIB Tables', 'SQL', 'V3__ULMS_CIB_Tables.sql', 0, 'system', 0, TRUE)
ON CONFLICT (version) DO NOTHING;
```

---

## 9. Data Migration

### 9.1 Migration Strategy

| Phase | Description | Downtime |
|-------|-------------|----------|
| 1 | Schema creation | < 5 min |
| 2 | Index creation | < 10 min |
| 3 | Data backfill | Background |
| 4 | Validation | < 5 min |
| 5 | Application deploy | Rolling |

### 9.2 Data Backfill Script

```sql
-- Backfill existing loans with application numbers
UPDATE m_loan 
SET application_number = 'APP-' || TO_CHAR(created_date, 'YYYY') || '-' || LPAD(id::TEXT, 6, '0')
WHERE application_number IS NULL;

-- Backfill NID from additional fields
UPDATE m_client c
SET nid_number = caf.string_value
FROM m_client_additional_fields caf
WHERE c.id = caf.client_id 
AND caf.name = 'NID_Number'
AND c.nid_number IS NULL;

-- Set Islamic flag based on product
UPDATE m_loan l
SET is_islamic = TRUE
FROM m_product_loan p
WHERE l.product_id = p.id
AND p.name ILIKE '%islamic%';
```

---

## 10. Performance Optimization

### 10.1 Index Strategy

```sql
-- Composite indexes for common queries
CREATE INDEX idx_loan_classification_date ON brpd_loan_classification(loan_id, classification_date DESC);
CREATE INDEX idx_cib_inquiry_date_status ON cib_inquiry(client_id, inquiry_date DESC, inquiry_status);
CREATE INDEX idx_loan_islamic_product ON m_loan(is_islamic, product_id) WHERE is_islamic = TRUE;

-- Partial indexes
CREATE INDEX idx_client_unverified_nid ON m_client(nid_number) WHERE nid_verification_status != 'VERIFIED';
CREATE INDEX idx_loan_pending_cib ON m_loan(cib_inquiry_id) WHERE cib_inquiry_id IS NULL;
```

### 10.2 Partitioning Strategy

```sql
-- Partition large tables by date
CREATE TABLE brpd_loan_classification_partitioned (
    LIKE brpd_loan_classification INCLUDING ALL
) PARTITION BY RANGE (classification_date);

-- Create monthly partitions
CREATE TABLE brpd_loan_classification_2024_01 PARTITION OF brpd_loan_classification_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Automated partition creation function
CREATE OR REPLACE FUNCTION create_monthly_partition(
    p_table_name TEXT,
    p_year INTEGER,
    p_month INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_partition_name TEXT;
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    v_partition_name := p_table_name || '_' || p_year || '_' || LPAD(p_month::TEXT, 2, '0');
    v_start_date := MAKE_DATE(p_year, p_month, 1);
    v_end_date := v_start_date + INTERVAL '1 month';
    
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
        v_partition_name, p_table_name, v_start_date, v_end_date);
END;
$$ LANGUAGE plpgsql;
```

---

## 11. Appendix

### 11.1 Entity Relationship Diagram

```
m_client ||--o{ ulms_customer_nid_details : has
m_client ||--o{ cib_consent : grants
m_client ||--o{ cib_inquiry : has

m_loan ||--o{ brpd_loan_classification : classified_as
m_loan ||--o{ cib_inquiry : references
m_loan ||--o{ ulms_islamic_loan_schedule : has

m_product_loan ||--o{ ulms_islamic_product_terms : has

m_loan_repayment_schedule ||--o{ ulms_islamic_loan_schedule : extends
```

### 11.2 Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Feb 8, 2026 | Database Architect | Initial document creation |

### 11.3 Related Documents

| Document | Description |
|----------|-------------|
| `[DB]_PostgreSQL_16_Setup_Guide_v1.0.md` | Database setup guide |
| `[DB]_Redis_7_Setup_Configuration_v1.0.md` | Redis caching setup |
| `[ARCH]_Database_Design_ERD_v1.0.md` | Complete ERD documentation |

---

**End of Document**

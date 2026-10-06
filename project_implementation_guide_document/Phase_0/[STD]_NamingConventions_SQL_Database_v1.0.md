# SQL & Database Naming Conventions

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ULMS-STD-0.3.4 |
| **Document Title** | SQL & Database Naming Conventions |
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
2. [General Naming Rules](#2-general-naming-rules)
3. [Schema Naming](#3-schema-naming)
4. [Table Naming](#4-table-naming)
5. [Column Naming](#5-column-naming)
6. [Constraint Naming](#6-constraint-naming)
7. [Index Naming](#7-index-naming)
8. [Sequence & Function Naming](#8-sequence--function-naming)
9. [Migration Naming](#9-migration-naming)
10. [Data Types Guidelines](#10-data-types-guidelines)
11. [ULMS Table Examples](#11-ulms-table-examples)

---

## 1. Introduction

### 1.1 Purpose

This document defines SQL and database naming conventions for ULMS v2.0 using PostgreSQL 16. Consistent naming ensures maintainability, readability, and prevents confusion across the development team.

### 1.2 Database Environment

| Component | Specification |
|-----------|---------------|
| DBMS | PostgreSQL 16.1 |
| ORM | Spring Data JPA / Hibernate 6.4 |
| Migration Tool | Flyway 10.x |
| Multi-Tenant | Schema-per-tenant |

### 1.3 Identifier Limits

| Type | Max Length | ULMS Convention |
|------|------------|-----------------|
| Schema name | 63 chars | 30 chars max |
| Table name | 63 chars | 40 chars max |
| Column name | 63 chars | 30 chars max |
| Index name | 63 chars | 50 chars max |
| Constraint name | 63 chars | 50 chars max |

---

## 2. General Naming Rules

### 2.1 Universal Rules

| Rule | Convention | Example |
|------|------------|---------|
| Case | lowercase | `loan_applications` |
| Word separator | underscore (snake_case) | `customer_address` |
| No reserved words | Avoid SQL keywords | Use `loan_status` not `status` |
| No special characters | Letters, numbers, underscore only | `customer_2024` OK, `customer#1` NOT OK |
| Start with letter | Never start with number | `loan_01` NOT `01_loan` |
| Be descriptive | Self-documenting names | `approval_date` not `apr_dt` |
| Singular/Plural | Tables: plural, Columns: singular | `loans`, `loan_id` |
| Abbreviations | Use standard, documented only | See Appendix A |

### 2.2 Approved Abbreviations

| Full Word | Abbreviation | Usage |
|-----------|--------------|-------|
| identifier | id | Primary keys |
| number | no | Sequence numbers |
| reference | ref | Reference codes |
| transaction | txn | Transaction tables |
| configuration | config | Config tables |
| timestamp | ts | Timestamp columns |
| created | created | Audit columns |
| updated | updated | Audit columns |

### 2.3 Words to Avoid

| Word | Reason | Alternative |
|------|--------|-------------|
| data | Vague | Specific noun |
| info | Vague | Specific noun |
| temp | Unclear lifecycle | Purpose-specific |
| test | Confusion in prod | Use test schema |
| new | Ambiguous over time | Version or date |

---

## 3. Schema Naming

### 3.1 Multi-Tenant Schema Convention

```sql
-- Format: {tenant_code}
-- Example: bank_001, bank_002

CREATE SCHEMA bank_001;
CREATE SCHEMA bank_002;

-- System schema for shared data
CREATE SCHEMA ulms_shared;
CREATE SCHEMA ulms_config;

-- Audit schema
CREATE SCHEMA ulms_audit;
```

### 3.2 Schema Types

| Schema Type | Naming | Purpose |
|-------------|--------|---------|
| Tenant | `bank_{code}` | Per-bank isolated data |
| Shared | `ulms_shared` | Cross-tenant reference data |
| Config | `ulms_config` | System configuration |
| Audit | `ulms_audit` | Audit logs (cross-tenant) |
| Staging | `ulms_staging` | ETL staging area |

### 3.3 Schema Search Path

```sql
-- Set search path for tenant
SET search_path TO bank_001, ulms_shared, public;

-- Application dynamically sets based on authenticated tenant
```

---

## 4. Table Naming

### 4.1 Table Naming Convention

```
{domain}_{entity}s

Examples:
- loans                    (core entity)
- loan_applications        (related entity)
- loan_documents           (child entity)
- loan_approval_histories  (audit/history)
```

### 4.2 Table Name Examples by Domain

#### Core Lending Domain

| Table Name | Description |
|------------|-------------|
| `customers` | Customer master data |
| `customer_addresses` | Customer address details |
| `customer_documents` | Customer KYC documents |
| `loans` | Active loan accounts |
| `loan_applications` | Loan application records |
| `loan_products` | Loan product definitions |
| `loan_charges` | Fees and charges |
| `loan_repayments` | Repayment schedule |
| `loan_payments` | Actual payment records |
| `loan_collaterals` | Collateral/security |
| `loan_guarantors` | Guarantor information |

#### Credit & CIB Domain

| Table Name | Description |
|------------|-------------|
| `cib_inquiries` | CIB inquiry log |
| `cib_reports` | Cached CIB reports |
| `credit_scores` | Credit scoring results |
| `credit_limits` | Customer credit limits |

#### Workflow Domain

| Table Name | Description |
|------------|-------------|
| `workflow_tasks` | Active workflow tasks |
| `workflow_histories` | Completed workflow steps |
| `approval_matrices` | Approval authority config |
| `approval_logs` | Approval audit trail |

#### Reference Data

| Table Name | Description |
|------------|-------------|
| `ref_branches` | Branch master |
| `ref_departments` | Department master |
| `ref_loan_purposes` | Loan purpose codes |
| `ref_collateral_types` | Collateral type codes |
| `ref_rejection_reasons` | Rejection reason codes |

### 4.3 Table Naming Patterns

| Pattern | Usage | Example |
|---------|-------|---------|
| `{entity}s` | Main entities | `customers`, `loans` |
| `{parent}_{child}s` | Related entities | `loan_documents` |
| `{entity}_histories` | Temporal history | `loan_status_histories` |
| `{entity}_archives` | Archived data | `loan_archives` |
| `ref_{entity}s` | Reference/lookup | `ref_branches` |
| `cfg_{entity}s` | Configuration | `cfg_interest_rates` |
| `log_{entity}s` | Log tables | `log_api_calls` |

### 4.4 Junction/Join Tables

```sql
-- Format: {table1}_{table2} (alphabetical order preferred)
-- Or: {parent}_{relationship}_{child}

-- Many-to-many relationships
CREATE TABLE customer_loan_officers (
    customer_id BIGINT REFERENCES customers(id),
    loan_officer_id BIGINT REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (customer_id, loan_officer_id)
);

CREATE TABLE loan_product_charges (
    loan_product_id BIGINT REFERENCES loan_products(id),
    charge_id BIGINT REFERENCES charges(id),
    is_mandatory BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (loan_product_id, charge_id)
);
```

---

## 5. Column Naming

### 5.1 Column Naming Convention

| Type | Convention | Example |
|------|------------|---------|
| Primary Key | `id` | `id` |
| Foreign Key | `{referenced_table_singular}_id` | `customer_id` |
| Boolean | `is_` or `has_` prefix | `is_active`, `has_documents` |
| Date | `_date` suffix | `application_date` |
| Timestamp | `_at` suffix | `created_at`, `approved_at` |
| Amount/Money | `_amount` suffix | `principal_amount` |
| Count | `_count` suffix | `retry_count` |
| Code | `_code` suffix | `branch_code` |
| Name | `_name` suffix | `product_name` |
| Status | `_status` suffix | `loan_status` |
| Type | `_type` suffix | `collateral_type` |

### 5.2 Standard Column Names

#### Primary Key

```sql
-- Always use 'id' for primary key
id BIGSERIAL PRIMARY KEY

-- Or UUID
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

#### Foreign Keys

```sql
-- Format: {referenced_table_singular}_id
customer_id BIGINT NOT NULL REFERENCES customers(id)
loan_product_id BIGINT REFERENCES loan_products(id)
created_by_user_id BIGINT REFERENCES users(id)
```

#### Audit Columns (Required for all tables)

```sql
-- Timestamp audit columns (required)
created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP

-- User audit columns (required)
created_by VARCHAR(100) NOT NULL
updated_by VARCHAR(100) NOT NULL

-- Soft delete (optional, where applicable)
deleted_at TIMESTAMP WITH TIME ZONE
deleted_by VARCHAR(100)
is_deleted BOOLEAN NOT NULL DEFAULT FALSE
```

#### Version Column (for optimistic locking)

```sql
version INTEGER NOT NULL DEFAULT 0
```

### 5.3 Column Examples by Type

#### Money/Amount Columns

```sql
-- Use DECIMAL(15,2) for Bangladesh currency (up to 999 trillion)
principal_amount DECIMAL(15,2) NOT NULL CHECK (principal_amount > 0)
interest_amount DECIMAL(15,2) NOT NULL DEFAULT 0
penalty_amount DECIMAL(15,2) NOT NULL DEFAULT 0
total_outstanding DECIMAL(15,2) NOT NULL DEFAULT 0

-- Percentage/Rate columns
interest_rate DECIMAL(5,2) NOT NULL CHECK (interest_rate >= 0 AND interest_rate <= 100)
provision_rate DECIMAL(5,2) NOT NULL
```

#### Date/Timestamp Columns

```sql
-- Date only
application_date DATE NOT NULL DEFAULT CURRENT_DATE
disbursement_date DATE
maturity_date DATE NOT NULL

-- Timestamp with timezone
created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
approved_at TIMESTAMP WITH TIME ZONE
expired_at TIMESTAMP WITH TIME ZONE
```

#### Status Columns

```sql
-- Use VARCHAR with CHECK constraint for statuses
loan_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT'
    CHECK (loan_status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED', 'ACTIVE', 'CLOSED', 'WRITTEN_OFF'))

-- Classification status (BRPD)
classification_status VARCHAR(20) NOT NULL DEFAULT 'STD_0'
    CHECK (classification_status IN ('STD_0', 'STD_1', 'STD_2', 'SMA', 'SS', 'DF', 'BL'))
```

#### Boolean Columns

```sql
is_active BOOLEAN NOT NULL DEFAULT TRUE
is_verified BOOLEAN NOT NULL DEFAULT FALSE
has_collateral BOOLEAN NOT NULL DEFAULT FALSE
is_mandatory BOOLEAN NOT NULL DEFAULT FALSE
```

#### Code/Reference Columns

```sql
-- Fixed codes
branch_code VARCHAR(10) NOT NULL
product_code VARCHAR(20) NOT NULL
currency_code VARCHAR(3) NOT NULL DEFAULT 'BDT'

-- Generated IDs
loan_account_no VARCHAR(30) NOT NULL UNIQUE
customer_cif VARCHAR(20) NOT NULL UNIQUE
application_ref_no VARCHAR(50) NOT NULL UNIQUE
```

---

## 6. Constraint Naming

### 6.1 Constraint Naming Convention

| Constraint Type | Pattern | Example |
|-----------------|---------|---------|
| Primary Key | `pk_{table}` | `pk_loans` |
| Foreign Key | `fk_{table}_{column}` | `fk_loans_customer_id` |
| Unique | `uq_{table}_{column(s)}` | `uq_customers_nid` |
| Check | `chk_{table}_{description}` | `chk_loans_amount_positive` |
| Not Null | (implicit) | Column definition |
| Default | (implicit) | Column definition |

### 6.2 Constraint Examples

```sql
-- Primary Key
CONSTRAINT pk_loans PRIMARY KEY (id)

-- Foreign Key
CONSTRAINT fk_loans_customer_id
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE RESTRICT ON UPDATE CASCADE

-- Foreign Key with explicit name
CONSTRAINT fk_loans_product_id
    FOREIGN KEY (loan_product_id) REFERENCES loan_products(id)

-- Unique constraint (single column)
CONSTRAINT uq_customers_nid UNIQUE (nid)

-- Unique constraint (composite)
CONSTRAINT uq_loans_account_branch UNIQUE (loan_account_no, branch_code)

-- Check constraint
CONSTRAINT chk_loans_amount_positive CHECK (principal_amount > 0)
CONSTRAINT chk_loans_tenure_valid CHECK (tenure BETWEEN 6 AND 84)
CONSTRAINT chk_loans_rate_valid CHECK (interest_rate >= 0 AND interest_rate <= 50)
CONSTRAINT chk_loans_status_valid CHECK (
    loan_status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'DISBURSED')
)

-- Combined example
CREATE TABLE loans (
    id BIGSERIAL,
    customer_id BIGINT NOT NULL,
    loan_product_id BIGINT NOT NULL,
    loan_account_no VARCHAR(30) NOT NULL,
    principal_amount DECIMAL(15,2) NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    tenure INTEGER NOT NULL,
    loan_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT pk_loans PRIMARY KEY (id),
    CONSTRAINT fk_loans_customer_id FOREIGN KEY (customer_id)
        REFERENCES customers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_loans_product_id FOREIGN KEY (loan_product_id)
        REFERENCES loan_products(id),
    CONSTRAINT uq_loans_account_no UNIQUE (loan_account_no),
    CONSTRAINT chk_loans_amount_positive CHECK (principal_amount > 0),
    CONSTRAINT chk_loans_tenure_valid CHECK (tenure BETWEEN 6 AND 84),
    CONSTRAINT chk_loans_rate_valid CHECK (interest_rate >= 0 AND interest_rate <= 50)
);
```

---

## 7. Index Naming

### 7.1 Index Naming Convention

| Index Type | Pattern | Example |
|------------|---------|---------|
| B-tree (default) | `idx_{table}_{column(s)}` | `idx_loans_customer_id` |
| Unique | `uidx_{table}_{column(s)}` | `uidx_customers_nid` |
| Partial | `idx_{table}_{column}_partial` | `idx_loans_status_active` |
| Composite | `idx_{table}_{col1}_{col2}` | `idx_loans_branch_status` |
| GIN (full-text) | `gin_{table}_{column}` | `gin_customers_search` |
| GiST (spatial) | `gist_{table}_{column}` | `gist_branches_location` |

### 7.2 Index Examples

```sql
-- Foreign key index (always create)
CREATE INDEX idx_loans_customer_id ON loans(customer_id);
CREATE INDEX idx_loans_product_id ON loans(loan_product_id);

-- Status queries (frequently filtered)
CREATE INDEX idx_loans_status ON loans(loan_status);

-- Date range queries
CREATE INDEX idx_loans_created_at ON loans(created_at);
CREATE INDEX idx_loans_disbursement_date ON loans(disbursement_date);

-- Composite index (column order matters!)
CREATE INDEX idx_loans_branch_status ON loans(branch_code, loan_status);
CREATE INDEX idx_loans_status_date ON loans(loan_status, created_at DESC);

-- Partial index (for common filters)
CREATE INDEX idx_loans_active ON loans(customer_id)
    WHERE loan_status IN ('DISBURSED', 'ACTIVE');

CREATE INDEX idx_loans_pending_approval ON loans(created_at)
    WHERE loan_status = 'UNDER_REVIEW';

-- Unique index (alternative to UNIQUE constraint)
CREATE UNIQUE INDEX uidx_customers_nid ON customers(nid);
CREATE UNIQUE INDEX uidx_loans_account_no ON loans(loan_account_no);

-- Full-text search index
CREATE INDEX gin_customers_search ON customers
    USING GIN (to_tsvector('english', full_name || ' ' || nid));

-- Expression index
CREATE INDEX idx_customers_lower_email ON customers(LOWER(email));

-- BRIN index (for append-only/time-series data)
CREATE INDEX brin_loan_payments_date ON loan_payments
    USING BRIN(payment_date);
```

### 7.3 Index Selection Guidelines

| Scenario | Index Type | Example |
|----------|------------|---------|
| Foreign key lookup | B-tree | `idx_loans_customer_id` |
| Range queries (dates) | B-tree | `idx_loans_created_at` |
| Equality + range | Composite | `idx_loans_status_date` |
| Full-text search | GIN | `gin_customers_search` |
| Time-series/audit | BRIN | `brin_audit_logs_ts` |
| Point lookup | Hash (rare) | `hash_sessions_token` |

---

## 8. Sequence & Function Naming

### 8.1 Sequence Naming

```sql
-- Pattern: {table}_{column}_seq
CREATE SEQUENCE loans_id_seq;
CREATE SEQUENCE loan_applications_id_seq;

-- Custom business sequences
CREATE SEQUENCE loan_account_no_seq START 1000000;
CREATE SEQUENCE application_ref_seq START 100000;

-- Usage
SELECT nextval('loan_account_no_seq');
```

### 8.2 Function Naming

```sql
-- Pattern: {action}_{entity}_{purpose}
-- Actions: get, set, calculate, validate, generate, update, delete

-- Getter functions
CREATE FUNCTION get_customer_by_nid(p_nid VARCHAR)
    RETURNS customers AS $$...$$;

CREATE FUNCTION get_loan_outstanding(p_loan_id BIGINT)
    RETURNS DECIMAL AS $$...$$;

-- Calculation functions
CREATE FUNCTION calculate_emi(
    p_principal DECIMAL,
    p_rate DECIMAL,
    p_tenure INTEGER
) RETURNS DECIMAL AS $$...$$;

CREATE FUNCTION calculate_provision(
    p_outstanding DECIMAL,
    p_classification VARCHAR
) RETURNS DECIMAL AS $$...$$;

-- Validation functions
CREATE FUNCTION validate_nid(p_nid VARCHAR)
    RETURNS BOOLEAN AS $$...$$;

-- Generator functions
CREATE FUNCTION generate_loan_account_no(p_branch_code VARCHAR)
    RETURNS VARCHAR AS $$...$$;

-- Update functions
CREATE FUNCTION update_loan_classification()
    RETURNS TRIGGER AS $$...$$;
```

### 8.3 Trigger Naming

```sql
-- Pattern: trg_{table}_{timing}_{action}
-- Timing: before, after, instead_of
-- Action: insert, update, delete

CREATE TRIGGER trg_loans_before_update
    BEFORE UPDATE ON loans
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_loans_after_insert
    AFTER INSERT ON loans
    FOR EACH ROW
    EXECUTE FUNCTION log_loan_creation();

CREATE TRIGGER trg_loan_payments_after_insert
    AFTER INSERT ON loan_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_loan_outstanding();
```

### 8.4 View Naming

```sql
-- Pattern: vw_{description}
CREATE VIEW vw_active_loans AS
    SELECT * FROM loans WHERE loan_status = 'ACTIVE';

CREATE VIEW vw_loan_summary AS
    SELECT
        l.id,
        l.loan_account_no,
        c.full_name as customer_name,
        l.principal_amount,
        l.loan_status
    FROM loans l
    JOIN customers c ON l.customer_id = c.id;

-- Materialized view
CREATE MATERIALIZED VIEW mvw_daily_loan_stats AS
    SELECT
        DATE(created_at) as report_date,
        COUNT(*) as applications,
        SUM(principal_amount) as total_amount
    FROM loan_applications
    GROUP BY DATE(created_at);
```

---

## 9. Migration Naming

### 9.1 Flyway Migration Naming

```
V{version}__{description}.sql

Version format: YYYYMMDD.NN (date + sequence)
Description: lowercase with underscores, no spaces
```

### 9.2 Migration File Examples

```
V20260201.01__create_customers_table.sql
V20260201.02__create_loans_table.sql
V20260201.03__add_customers_indexes.sql
V20260202.01__add_loan_status_column.sql
V20260202.02__create_loan_payments_table.sql
V20260203.01__add_classification_status.sql
V20260203.02__add_brpd_provision_rates.sql
```

### 9.3 Migration Best Practices

```sql
-- V20260201.01__create_customers_table.sql

-- Header comment
-- Description: Create customers table for ULMS
-- Author: Lead Dev
-- Date: 2026-02-01
-- JIRA: ULMS-101

-- Create table
CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    customer_cif VARCHAR(20) NOT NULL,
    nid VARCHAR(17) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    date_of_birth DATE NOT NULL,
    -- ... more columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT pk_customers PRIMARY KEY (id),
    CONSTRAINT uq_customers_cif UNIQUE (customer_cif),
    CONSTRAINT uq_customers_nid UNIQUE (nid)
);

-- Create indexes
CREATE INDEX idx_customers_nid ON customers(nid);
CREATE INDEX idx_customers_name ON customers(full_name);

-- Add comments
COMMENT ON TABLE customers IS 'Customer master data for ULMS';
COMMENT ON COLUMN customers.nid IS 'National ID (13 or 17 digits)';
```

### 9.4 Undo Migration (Flyway Teams)

```
U20260201.01__create_customers_table.sql

-- Undo script
DROP TABLE IF EXISTS customers CASCADE;
```

---

## 10. Data Types Guidelines

### 10.1 Recommended Data Types

| Use Case | PostgreSQL Type | Java Type |
|----------|-----------------|-----------|
| Primary Key | `BIGSERIAL` | `Long` |
| UUID Key | `UUID` | `UUID` |
| Short text (<256) | `VARCHAR(n)` | `String` |
| Long text | `TEXT` | `String` |
| Integer | `INTEGER` | `Integer` |
| Big integer | `BIGINT` | `Long` |
| Decimal/Money | `DECIMAL(15,2)` | `BigDecimal` |
| Boolean | `BOOLEAN` | `Boolean` |
| Date only | `DATE` | `LocalDate` |
| Timestamp | `TIMESTAMP WITH TIME ZONE` | `Instant` |
| JSON | `JSONB` | `String`/custom |
| Binary | `BYTEA` | `byte[]` |
| Enum | `VARCHAR(30)` + CHECK | Java Enum |

### 10.2 Avoid These Types

| Type | Issue | Use Instead |
|------|-------|-------------|
| `SERIAL` | 32-bit limit | `BIGSERIAL` |
| `MONEY` | Locale dependent | `DECIMAL(15,2)` |
| `TIMESTAMP` (no TZ) | Timezone issues | `TIMESTAMP WITH TIME ZONE` |
| `CHAR(n)` | Padding issues | `VARCHAR(n)` |
| `JSON` | Less efficient | `JSONB` |
| `FLOAT`/`REAL` | Precision issues | `DECIMAL` for money |

### 10.3 ULMS-Specific Types

```sql
-- NID (13 or 17 digits)
nid VARCHAR(17) NOT NULL CHECK (nid ~ '^[0-9]{13}$' OR nid ~ '^[0-9]{17}$')

-- Phone number (Bangladesh)
phone_number VARCHAR(15) CHECK (phone_number ~ '^\+?880[0-9]{10}$')

-- Account number
account_no VARCHAR(20) NOT NULL

-- Currency code
currency_code VARCHAR(3) NOT NULL DEFAULT 'BDT' CHECK (currency_code IN ('BDT', 'USD'))

-- Amount
amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0)

-- Percentage
rate DECIMAL(5,2) NOT NULL CHECK (rate >= 0 AND rate <= 100)

-- Classification (BRPD)
classification VARCHAR(10) NOT NULL
    CHECK (classification IN ('STD_0', 'STD_1', 'STD_2', 'SMA', 'SS', 'DF', 'BL'))
```

---

## 11. ULMS Table Examples

### 11.1 Customers Table

```sql
CREATE TABLE customers (
    -- Primary Key
    id BIGSERIAL,

    -- Business Keys
    customer_cif VARCHAR(20) NOT NULL,

    -- Identity
    nid VARCHAR(17) NOT NULL,
    tin VARCHAR(20),
    passport_no VARCHAR(20),

    -- Personal Info
    full_name VARCHAR(200) NOT NULL,
    full_name_bn VARCHAR(200),
    father_name VARCHAR(200),
    mother_name VARCHAR(200),
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,

    -- Contact
    email VARCHAR(100),
    mobile_primary VARCHAR(15) NOT NULL,
    mobile_secondary VARCHAR(15),

    -- Status
    customer_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    kyc_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    risk_rating VARCHAR(10),

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,

    -- Constraints
    CONSTRAINT pk_customers PRIMARY KEY (id),
    CONSTRAINT uq_customers_cif UNIQUE (customer_cif),
    CONSTRAINT uq_customers_nid UNIQUE (nid),
    CONSTRAINT chk_customers_gender CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    CONSTRAINT chk_customers_status CHECK (customer_status IN ('ACTIVE', 'INACTIVE', 'BLOCKED', 'DECEASED'))
);

-- Indexes
CREATE INDEX idx_customers_nid ON customers(nid);
CREATE INDEX idx_customers_mobile ON customers(mobile_primary);
CREATE INDEX idx_customers_status ON customers(customer_status);
CREATE INDEX idx_customers_created ON customers(created_at);

-- Comments
COMMENT ON TABLE customers IS 'Customer master data';
COMMENT ON COLUMN customers.nid IS 'Bangladesh National ID (13 or 17 digits)';
COMMENT ON COLUMN customers.customer_cif IS 'Customer Information File number';
```

### 11.2 Loans Table

```sql
CREATE TABLE loans (
    -- Primary Key
    id BIGSERIAL,

    -- Business Keys
    loan_account_no VARCHAR(30) NOT NULL,
    application_ref_no VARCHAR(50),

    -- Foreign Keys
    customer_id BIGINT NOT NULL,
    loan_product_id BIGINT NOT NULL,
    branch_id BIGINT NOT NULL,
    loan_officer_id BIGINT,

    -- Loan Details
    principal_amount DECIMAL(15,2) NOT NULL,
    approved_amount DECIMAL(15,2),
    disbursed_amount DECIMAL(15,2),
    outstanding_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    interest_rate DECIMAL(5,2) NOT NULL,
    tenure INTEGER NOT NULL,

    -- Dates
    application_date DATE NOT NULL DEFAULT CURRENT_DATE,
    approval_date DATE,
    disbursement_date DATE,
    maturity_date DATE,
    first_emi_date DATE,

    -- Status
    loan_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    classification_status VARCHAR(10) NOT NULL DEFAULT 'STD_0',
    days_past_due INTEGER NOT NULL DEFAULT 0,

    -- Provision
    provision_rate DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    provision_amount DECIMAL(15,2) NOT NULL DEFAULT 0,

    -- Flags
    is_rescheduled BOOLEAN NOT NULL DEFAULT FALSE,
    is_restructured BOOLEAN NOT NULL DEFAULT FALSE,
    is_written_off BOOLEAN NOT NULL DEFAULT FALSE,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,

    -- Constraints
    CONSTRAINT pk_loans PRIMARY KEY (id),
    CONSTRAINT fk_loans_customer FOREIGN KEY (customer_id)
        REFERENCES customers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_loans_product FOREIGN KEY (loan_product_id)
        REFERENCES loan_products(id),
    CONSTRAINT fk_loans_branch FOREIGN KEY (branch_id)
        REFERENCES branches(id),
    CONSTRAINT uq_loans_account_no UNIQUE (loan_account_no),
    CONSTRAINT chk_loans_amount_positive CHECK (principal_amount > 0),
    CONSTRAINT chk_loans_tenure_valid CHECK (tenure BETWEEN 6 AND 84),
    CONSTRAINT chk_loans_rate_valid CHECK (interest_rate >= 0 AND interest_rate <= 50),
    CONSTRAINT chk_loans_status CHECK (loan_status IN (
        'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED',
        'DISBURSED', 'ACTIVE', 'CLOSED', 'WRITTEN_OFF'
    )),
    CONSTRAINT chk_loans_classification CHECK (classification_status IN (
        'STD_0', 'STD_1', 'STD_2', 'SMA', 'SS', 'DF', 'BL'
    ))
);

-- Indexes
CREATE INDEX idx_loans_customer ON loans(customer_id);
CREATE INDEX idx_loans_product ON loans(loan_product_id);
CREATE INDEX idx_loans_branch ON loans(branch_id);
CREATE INDEX idx_loans_status ON loans(loan_status);
CREATE INDEX idx_loans_classification ON loans(classification_status);
CREATE INDEX idx_loans_maturity ON loans(maturity_date);
CREATE INDEX idx_loans_dpd ON loans(days_past_due) WHERE days_past_due > 0;
CREATE INDEX idx_loans_active ON loans(customer_id)
    WHERE loan_status IN ('DISBURSED', 'ACTIVE');

-- Comments
COMMENT ON TABLE loans IS 'Loan accounts';
COMMENT ON COLUMN loans.classification_status IS 'BRPD loan classification (STD_0 to BL)';
COMMENT ON COLUMN loans.days_past_due IS 'Days past due for classification';
```

### 11.3 Loan Payments Table

```sql
CREATE TABLE loan_payments (
    id BIGSERIAL,

    -- Foreign Keys
    loan_id BIGINT NOT NULL,

    -- Payment Details
    payment_ref_no VARCHAR(50) NOT NULL,
    payment_date DATE NOT NULL,
    payment_type VARCHAR(30) NOT NULL,

    -- Amounts
    principal_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
    interest_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
    penalty_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,

    -- Payment Info
    payment_mode VARCHAR(20) NOT NULL,
    transaction_ref VARCHAR(50),
    remarks TEXT,

    -- Status
    payment_status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,

    -- Constraints
    CONSTRAINT pk_loan_payments PRIMARY KEY (id),
    CONSTRAINT fk_payments_loan FOREIGN KEY (loan_id)
        REFERENCES loans(id),
    CONSTRAINT uq_payments_ref UNIQUE (payment_ref_no),
    CONSTRAINT chk_payments_amount CHECK (total_amount > 0),
    CONSTRAINT chk_payments_type CHECK (payment_type IN (
        'EMI', 'PREPAYMENT', 'FULL_SETTLEMENT', 'PENALTY', 'ADJUSTMENT'
    )),
    CONSTRAINT chk_payments_mode CHECK (payment_mode IN (
        'CASH', 'CHEQUE', 'TRANSFER', 'BKASH', 'NAGAD', 'STANDING_INSTRUCTION'
    ))
);

-- Indexes
CREATE INDEX idx_payments_loan ON loan_payments(loan_id);
CREATE INDEX idx_payments_date ON loan_payments(payment_date);
CREATE BRIN INDEX brin_payments_date ON loan_payments(payment_date);

-- Partition (optional, for large volumes)
-- CREATE TABLE loan_payments (...) PARTITION BY RANGE (payment_date);
```

---

## Appendix A: Standard Abbreviations

| Abbreviation | Full Word |
|--------------|-----------|
| id | identifier |
| no | number |
| ref | reference |
| txn | transaction |
| config | configuration |
| ts | timestamp |
| amt | amount |
| qty | quantity |
| dt | date |
| addr | address |
| desc | description |
| seq | sequence |
| idx | index |
| pk | primary key |
| fk | foreign key |
| uq | unique |
| chk | check |

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Technical Lead | | | |
| Project Manager | | | |

---

**Document End**

*ULMS v2.0 - SQL & Database Naming Conventions v1.0*

*Unisoft Systems Limited - Confidential*

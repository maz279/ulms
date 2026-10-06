# Database Schema Design Document (Multi-Tenant)
## Unisoft Loan Management System (ULMS) v2.0

---

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ULMS-ARCH-1.3.1 |
| **Document Title** | Database Schema Design Document (Multi-Tenant) |
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
| 1.0 | 2026-02-05 | Lead Dev | Initial Database Schema Design Document |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Multi-Tenant Strategy Overview](#2-multi-tenant-strategy-overview)
3. [Schema Architecture](#3-schema-architecture)
4. [Public Schema Design](#4-public-schema-design)
5. [Per-Tenant Schema Design](#5-per-tenant-schema-design)
6. [Schema Naming Conventions](#6-schema-naming-conventions)
7. [Tenant Lifecycle Management](#7-tenant-lifecycle-management)
8. [Connection Management](#8-connection-management)
9. [Security & Access Control](#9-security--access-control)
10. [Performance Considerations](#10-performance-considerations)
11. [Compliance Matrix](#11-compliance-matrix)
12. [Appendices](#12-appendices)

---

## 1. Executive Summary

### 1.1 Purpose

This document defines the database schema design for ULMS v2.0, implementing a **Schema-Per-Tenant** (Schema-Per-Bank) multi-tenancy strategy to serve 62+ scheduled commercial banks in Bangladesh while ensuring complete data isolation, regulatory compliance, and optimal performance.

### 1.2 Scope

| Aspect | Coverage |
|--------|----------|
| **Database Platform** | PostgreSQL 16.1 |
| **Multi-Tenancy Model** | Schema-Per-Bank |
| **Target Tenants** | 62+ Bangladesh scheduled banks |
| **ORM Framework** | Hibernate 6.4 / Spring Data JPA 3.2.1 |
| **Migration Tool** | Flyway 10.x |
| **Connection Pooling** | pgBouncer |

### 1.3 Key Design Decisions

| Decision | Rationale | Reference |
|----------|-----------|-----------|
| Schema-Per-Tenant | Complete data isolation for banks | BRD 7.3, ICT Security V4.0 |
| PostgreSQL 16 | Fineract compatibility, JSON support | Technology Stack v2.0 |
| Flyway Migrations | Version-controlled schema changes | SRS 6.2 |
| pgBouncer Pooling | Efficient connection management | SRS 7.1 |

---

## 2. Multi-Tenant Strategy Overview

### 2.1 Strategy Selection

ULMS adopts **Schema-Per-Tenant** isolation strategy for the following reasons:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    MULTI-TENANCY STRATEGY COMPARISON                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   Strategy              │ Isolation │ Customization │ Cost   │ ULMS Choice         │
│   ──────────────────────┼───────────┼───────────────┼────────┼─────────────────── │
│   Separate Database     │ ★★★★★    │ ★★★★★        │ High   │ ❌ Too costly       │
│   Schema-Per-Tenant     │ ★★★★★    │ ★★★★         │ Medium │ ✅ Selected         │
│   Shared Schema (RLS)   │ ★★★      │ ★★           │ Low    │ ❌ Insufficient     │
│   Shared Table          │ ★★       │ ★            │ Lowest │ ❌ Risk of leakage  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Benefits of Schema-Per-Tenant

| Benefit | Description |
|---------|-------------|
| **Complete Data Isolation** | Zero risk of cross-bank data leakage |
| **Independent Operations** | Per-bank backup, restore, migration |
| **Regulatory Compliance** | Meets Bangladesh Bank & ICT Security V4.0 |
| **Performance Isolation** | Queries don't affect other tenants |
| **Schema Flexibility** | Bank-specific customizations possible |
| **Simplified Debugging** | Clear tenant boundaries |

### 2.3 Trade-offs & Mitigations

| Trade-off | Mitigation Strategy |
|-----------|---------------------|
| Higher resource usage | Shared application tier reduces overhead |
| Schema management complexity | Automated Flyway multi-tenant migrations |
| Connection pool scaling | pgBouncer with transaction mode pooling |
| Cross-tenant reporting | Federated views for group-level reports |

---

## 3. Schema Architecture

### 3.1 Overall Database Structure

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         ULMS DATABASE STRUCTURE                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   ulms_db (PostgreSQL 16.1 Database)                                                │
│   │                                                                                  │
│   ├── public (Shared Infrastructure Schema)                                         │
│   │   ├── tenants                    -- Tenant registry (62+ banks)                │
│   │   ├── tenant_configuration       -- Per-bank settings                          │
│   │   ├── users                      -- Global user accounts                       │
│   │   ├── system_configuration       -- System-wide settings                       │
│   │   ├── audit_log_global           -- Cross-tenant audit (admin actions)         │
│   │   └── flyway_schema_history      -- Migration tracking (public)                │
│   │                                                                                  │
│   ├── bank_001 (Tenant: EXIM Bank Limited)                                         │
│   │   ├── m_client                   -- Customer master data                       │
│   │   ├── m_loan                     -- Loan accounts                              │
│   │   ├── m_loan_repayment_schedule  -- EMI schedules                              │
│   │   ├── m_loan_transaction         -- Loan transactions                          │
│   │   ├── cib_inquiry                -- CIB inquiry history                        │
│   │   ├── loan_classification_hist   -- BRPD classification audit                  │
│   │   ├── audit_log                  -- Tenant-specific audit trail                │
│   │   ├── flyway_schema_history      -- Migration tracking (tenant)                │
│   │   └── ... (50+ tables)                                                         │
│   │                                                                                  │
│   ├── bank_002 (Tenant: Dutch-Bangla Bank Limited)                                 │
│   │   └── (Same structure as bank_001)                                             │
│   │                                                                                  │
│   ├── bank_003 (Tenant: BRAC Bank Limited)                                         │
│   │   └── (Same structure as bank_001)                                             │
│   │                                                                                  │
│   └── bank_00N (Future tenants up to 62+ banks)                                    │
│       └── (Same structure as bank_001)                                             │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Schema Categories

| Schema Category | Naming Pattern | Purpose | Tables |
|-----------------|----------------|---------|--------|
| **Public** | `public` | Shared infrastructure | 5 tables |
| **Tenant** | `bank_{XXX}` | Per-bank isolated data | 50+ tables |
| **Shared Reference** | `ulms_shared` | Cross-tenant lookup data | 10 tables |
| **Audit** | Per-tenant `audit_log` | Compliance audit trail | 1 table per tenant |

---

## 4. Public Schema Design

### 4.1 Tenants Registry Table

```sql
-- public.tenants
-- Master registry of all bank tenants

CREATE TABLE public.tenants (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) UNIQUE NOT NULL,           -- "bank_001"
    schema_name VARCHAR(50) UNIQUE NOT NULL,          -- "bank_001"

    -- Bank Information
    bank_name VARCHAR(100) NOT NULL,                  -- "EXIM Bank Limited"
    bank_name_bn VARCHAR(200),                        -- Bengali name
    bank_code VARCHAR(10) UNIQUE NOT NULL,            -- "EXIM"
    swift_code VARCHAR(11),                           -- "EXIMBDDH"
    routing_number VARCHAR(20),                       -- Bangladesh Bank routing

    -- Contact Information
    head_office_address TEXT,
    website VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),

    -- License & Configuration
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',    -- PENDING, ACTIVE, SUSPENDED, TERMINATED
    license_type VARCHAR(50) DEFAULT 'STANDARD',      -- STANDARD, PREMIUM, ENTERPRISE
    max_users INTEGER DEFAULT 1000,
    max_branches INTEGER DEFAULT 500,
    max_loans_per_month INTEGER DEFAULT 50000,

    -- Keycloak Integration
    keycloak_realm VARCHAR(100),                      -- "bank_001_realm"

    -- MinIO Integration
    document_bucket VARCHAR(100),                     -- "ulms-bank-001-documents"

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP WITH TIME ZONE,
    suspended_at TIMESTAMP WITH TIME ZONE,
    terminated_at TIMESTAMP WITH TIME ZONE,

    -- Audit
    created_by VARCHAR(100) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,

    -- Constraints
    CONSTRAINT pk_tenants PRIMARY KEY (id),
    CONSTRAINT uq_tenants_tenant_id UNIQUE (tenant_id),
    CONSTRAINT uq_tenants_schema_name UNIQUE (schema_name),
    CONSTRAINT uq_tenants_bank_code UNIQUE (bank_code),
    CONSTRAINT chk_tenants_status CHECK (
        status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'TERMINATED')
    ),
    CONSTRAINT chk_tenants_license CHECK (
        license_type IN ('STANDARD', 'PREMIUM', 'ENTERPRISE')
    )
);

-- Indexes
CREATE INDEX idx_tenants_status ON public.tenants(status);
CREATE INDEX idx_tenants_bank_code ON public.tenants(bank_code);
CREATE INDEX idx_tenants_created_at ON public.tenants(created_at);

-- Comments
COMMENT ON TABLE public.tenants IS 'Master registry of all bank tenants in ULMS';
COMMENT ON COLUMN public.tenants.tenant_id IS 'Unique tenant identifier (bank_XXX format)';
COMMENT ON COLUMN public.tenants.schema_name IS 'PostgreSQL schema name for this tenant';
```

### 4.2 Tenant Configuration Table

```sql
-- public.tenant_configuration
-- Per-bank configuration settings

CREATE TABLE public.tenant_configuration (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,

    -- Configuration
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT,
    config_type VARCHAR(20) NOT NULL DEFAULT 'STRING',  -- STRING, INTEGER, BOOLEAN, DECIMAL, JSON
    config_category VARCHAR(50),                         -- LOAN, APPROVAL, BRANDING, INTEGRATION, COMPLIANCE
    description TEXT,

    -- Security
    is_encrypted BOOLEAN NOT NULL DEFAULT FALSE,
    is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,

    -- Constraints
    CONSTRAINT pk_tenant_configuration PRIMARY KEY (id),
    CONSTRAINT fk_tenant_config_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.tenants(tenant_id) ON DELETE CASCADE,
    CONSTRAINT uq_tenant_config_key UNIQUE (tenant_id, config_key),
    CONSTRAINT chk_config_type CHECK (
        config_type IN ('STRING', 'INTEGER', 'BOOLEAN', 'DECIMAL', 'JSON')
    )
);

-- Indexes
CREATE INDEX idx_tenant_config_tenant ON public.tenant_configuration(tenant_id);
CREATE INDEX idx_tenant_config_category ON public.tenant_configuration(config_category);
CREATE INDEX idx_tenant_config_key ON public.tenant_configuration(config_key);

-- Comments
COMMENT ON TABLE public.tenant_configuration IS 'Per-bank configuration key-value pairs';
```

### 4.3 Standard Configuration Keys

| Category | Config Key | Default Value | Type | Description |
|----------|------------|---------------|------|-------------|
| **LOAN** | `loan.max_amount_personal` | 5000000 | INTEGER | Max personal loan amount (BDT) |
| **LOAN** | `loan.max_amount_sme` | 50000000 | INTEGER | Max SME loan amount (BDT) |
| **LOAN** | `loan.max_tenor_months` | 60 | INTEGER | Maximum loan tenure in months |
| **LOAN** | `loan.min_tenor_months` | 6 | INTEGER | Minimum loan tenure in months |
| **APPROVAL** | `approval.level1_limit` | 500000 | INTEGER | L1 approval limit (BDT) |
| **APPROVAL** | `approval.level2_limit` | 1000000 | INTEGER | L2 approval limit (BDT) |
| **APPROVAL** | `approval.level3_limit` | 5000000 | INTEGER | L3 approval limit (BDT) |
| **APPROVAL** | `approval.sla_hours_l1` | 4 | INTEGER | SLA hours for L1 approval |
| **BRANDING** | `branding.logo_url` | NULL | STRING | Bank logo URL |
| **BRANDING** | `branding.primary_color` | #1976D2 | STRING | Primary brand color |
| **INTEGRATION** | `cib.api_key` | (encrypted) | STRING | CIB API key |
| **INTEGRATION** | `cib.cache_ttl_hours` | 1 | INTEGER | CIB cache TTL in hours |
| **COMPLIANCE** | `brpd.classification_enabled` | true | BOOLEAN | Enable BRPD classification |
| **COMPLIANCE** | `audit.retention_years` | 10 | INTEGER | Audit log retention years |

### 4.4 Global Users Table

```sql
-- public.users
-- Global user accounts (cross-tenant)

CREATE TABLE public.users (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,              -- "USR-2026-000123"

    -- Authentication
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    keycloak_id VARCHAR(100),                         -- Keycloak user ID

    -- Personal Information
    full_name VARCHAR(200) NOT NULL,
    full_name_bn VARCHAR(200),                        -- Bengali name
    mobile_number VARCHAR(20),

    -- Tenant Association
    tenant_id VARCHAR(50) NOT NULL,
    branch_id VARCHAR(20),
    department VARCHAR(50),

    -- Role & Access
    user_type VARCHAR(30) NOT NULL,                   -- BANK_USER, ADMIN, SUPER_ADMIN
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE,

    -- Audit
    created_by VARCHAR(100) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,

    -- Constraints
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.tenants(tenant_id),
    CONSTRAINT chk_users_type CHECK (
        user_type IN ('BANK_USER', 'ADMIN', 'SUPER_ADMIN')
    )
);

-- Indexes
CREATE INDEX idx_users_tenant ON public.users(tenant_id);
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_active ON public.users(is_active) WHERE is_active = TRUE;

-- Comments
COMMENT ON TABLE public.users IS 'Global user accounts for ULMS';
```

### 4.5 System Configuration Table

```sql
-- public.system_configuration
-- System-wide configuration settings

CREATE TABLE public.system_configuration (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    config_type VARCHAR(20) NOT NULL DEFAULT 'STRING',
    description TEXT,
    is_encrypted BOOLEAN NOT NULL DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,

    CONSTRAINT pk_system_config PRIMARY KEY (id),
    CONSTRAINT uq_system_config_key UNIQUE (config_key)
);

-- Comments
COMMENT ON TABLE public.system_configuration IS 'System-wide configuration settings';
```

### 4.6 Global Audit Log Table

```sql
-- public.audit_log_global
-- Audit trail for cross-tenant administrative actions

CREATE TABLE public.audit_log_global (
    id BIGSERIAL PRIMARY KEY,
    event_id VARCHAR(50) UNIQUE NOT NULL,             -- UUID
    event_type VARCHAR(50) NOT NULL,                  -- TENANT_CREATED, TENANT_SUSPENDED, etc.
    event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Actor
    user_id VARCHAR(50),
    username VARCHAR(100),
    ip_address VARCHAR(45),                           -- IPv4 or IPv6

    -- Target
    target_tenant_id VARCHAR(50),
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),

    -- Action Details
    action_type VARCHAR(50) NOT NULL,                 -- CREATE, UPDATE, DELETE, SUSPEND, etc.
    action_status VARCHAR(20) NOT NULL,               -- SUCCESS, FAILURE

    -- Data
    old_value JSONB,
    new_value JSONB,
    changes JSONB,

    -- Context
    request_uri VARCHAR(500),
    request_method VARCHAR(10),
    correlation_id VARCHAR(100),

    -- Constraints
    CONSTRAINT pk_audit_log_global PRIMARY KEY (id)
);

-- Indexes
CREATE INDEX idx_audit_global_timestamp ON public.audit_log_global(event_timestamp);
CREATE INDEX idx_audit_global_user ON public.audit_log_global(user_id);
CREATE INDEX idx_audit_global_tenant ON public.audit_log_global(target_tenant_id);
CREATE INDEX idx_audit_global_type ON public.audit_log_global(event_type);

-- Partitioning by month (for large volumes)
-- Consider: CREATE TABLE public.audit_log_global (...) PARTITION BY RANGE (event_timestamp);

-- Comments
COMMENT ON TABLE public.audit_log_global IS 'Audit trail for cross-tenant administrative actions';
```

---

## 5. Per-Tenant Schema Design

### 5.1 Schema Creation Template

```sql
-- Template for creating a new tenant schema
-- Variables: {TENANT_ID} = bank_001, {BANK_CODE} = EXIM

-- Step 1: Create schema
CREATE SCHEMA IF NOT EXISTS {TENANT_ID};

-- Step 2: Set search path
SET search_path TO {TENANT_ID}, public;

-- Step 3: Grant permissions to application user
GRANT USAGE ON SCHEMA {TENANT_ID} TO ulms_app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA {TENANT_ID} TO ulms_app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA {TENANT_ID} TO ulms_app_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA {TENANT_ID} TO ulms_app_user;

-- Step 4: Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA {TENANT_ID}
    GRANT ALL ON TABLES TO ulms_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA {TENANT_ID}
    GRANT ALL ON SEQUENCES TO ulms_app_user;

-- Step 5: Revoke public access
REVOKE ALL ON SCHEMA {TENANT_ID} FROM PUBLIC;

-- Step 6: Reset search path
RESET search_path;
```

### 5.2 Core Tables in Per-Tenant Schema

Each tenant schema contains the following table categories:

| Category | Table Count | Key Tables |
|----------|-------------|------------|
| **Customer Management** | 8 | m_client, customer_address, customer_document |
| **Loan Management** | 15 | m_loan, m_loan_repayment_schedule, m_loan_transaction |
| **Credit Assessment** | 5 | cib_inquiry, credit_score, credit_limit |
| **Workflow** | 4 | workflow_task, workflow_history, approval_log |
| **BRPD Compliance** | 4 | loan_classification_history, loan_provision |
| **Reference Data** | 10 | ref_branch, ref_loan_product, ref_collateral_type |
| **Audit** | 2 | audit_log, change_log |
| **Total** | ~50 | - |

### 5.3 Per-Tenant Table Structure Overview

```sql
-- Example: bank_001 schema tables

-- Customer Management
bank_001.m_client                    -- Customer master
bank_001.customer_address            -- Customer addresses
bank_001.customer_employment         -- Employment details
bank_001.customer_document           -- Document metadata
bank_001.customer_kyc_verification   -- KYC verification log
bank_001.nid_verification_log        -- NID verification audit

-- Loan Management
bank_001.m_loan                      -- Loan accounts
bank_001.m_loan_repayment_schedule   -- EMI schedules
bank_001.m_loan_transaction          -- Payment transactions
bank_001.loan_application            -- Loan applications
bank_001.loan_collateral             -- Collateral records
bank_001.loan_guarantor              -- Guarantor information
bank_001.loan_charge                 -- Fees and charges
bank_001.loan_disbursement           -- Disbursement records

-- Credit Assessment
bank_001.cib_inquiry                 -- CIB inquiry history
bank_001.cib_report_cache            -- Cached CIB reports
bank_001.credit_score                -- Credit scoring results
bank_001.credit_limit                -- Customer credit limits

-- Workflow
bank_001.workflow_task               -- Active workflow tasks
bank_001.workflow_history            -- Completed workflow steps
bank_001.approval_matrix             -- Approval authority config
bank_001.approval_log                -- Approval audit trail

-- BRPD Compliance
bank_001.loan_classification_history -- Classification changes
bank_001.loan_provision              -- Provision amounts
bank_001.interest_suspense           -- Suspended interest
bank_001.regulatory_report_log       -- Report generation log

-- Reference Data
bank_001.ref_branch                  -- Branch master
bank_001.ref_loan_product            -- Loan products
bank_001.ref_collateral_type         -- Collateral types
bank_001.ref_loan_purpose            -- Loan purposes
bank_001.ref_rejection_reason        -- Rejection reasons

-- Audit
bank_001.audit_log                   -- Comprehensive audit trail
bank_001.flyway_schema_history       -- Migration tracking
```

---

## 6. Schema Naming Conventions

### 6.1 Schema Names

| Schema Type | Pattern | Example |
|-------------|---------|---------|
| Public | `public` | `public` |
| Tenant | `bank_{XXX}` | `bank_001`, `bank_062` |
| Shared Reference | `ulms_shared` | `ulms_shared` |

### 6.2 Table Naming

| Type | Convention | Example |
|------|------------|---------|
| Core Entity | `{entity}s` (plural) | `customers`, `loans` |
| Fineract Tables | `m_{entity}` | `m_client`, `m_loan` |
| Junction Tables | `{table1}_{table2}` | `loan_collateral` |
| Reference Tables | `ref_{entity}s` | `ref_branches` |
| History Tables | `{entity}_history` | `loan_classification_history` |
| Log Tables | `{entity}_log` | `audit_log` |

### 6.3 Column Naming

| Type | Convention | Example |
|------|------------|---------|
| Primary Key | `id` | `id` |
| Foreign Key | `{table_singular}_id` | `customer_id`, `loan_id` |
| Boolean | `is_` or `has_` prefix | `is_active`, `has_collateral` |
| Date | `_date` suffix | `application_date` |
| Timestamp | `_at` suffix | `created_at`, `approved_at` |
| Amount | `_amount` suffix | `principal_amount` |
| Status | `_status` suffix | `loan_status` |

### 6.4 Constraint Naming

| Constraint | Pattern | Example |
|------------|---------|---------|
| Primary Key | `pk_{table}` | `pk_loans` |
| Foreign Key | `fk_{table}_{column}` | `fk_loans_customer_id` |
| Unique | `uq_{table}_{columns}` | `uq_customers_nid` |
| Check | `chk_{table}_{description}` | `chk_loans_amount_positive` |

### 6.5 Index Naming

| Index Type | Pattern | Example |
|------------|---------|---------|
| B-tree | `idx_{table}_{columns}` | `idx_loans_customer_id` |
| Unique | `uidx_{table}_{columns}` | `uidx_customers_nid` |
| Partial | `idx_{table}_{column}_partial` | `idx_loans_active` |
| GIN | `gin_{table}_{column}` | `gin_customers_search` |
| BRIN | `brin_{table}_{column}` | `brin_transactions_date` |

---

## 7. Tenant Lifecycle Management

### 7.1 Tenant Lifecycle States

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         TENANT LIFECYCLE STATE MACHINE                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│    ┌──────────┐     onboard()     ┌──────────┐     activate()    ┌──────────┐      │
│    │ PENDING  │ ─────────────────▶│ PENDING  │ ─────────────────▶│  ACTIVE  │      │
│    └──────────┘                   │ (schema  │                   └──────────┘      │
│                                   │ created) │                        │            │
│                                   └──────────┘                        │            │
│                                                                       │            │
│                                        suspend()                      │            │
│                                   ┌───────────────────────────────────┘            │
│                                   │                                                │
│                                   ▼                                                │
│                              ┌──────────┐     reactivate()    ┌──────────┐        │
│                              │SUSPENDED │ ───────────────────▶│  ACTIVE  │        │
│                              └──────────┘                     └──────────┘        │
│                                   │                                                │
│                                   │ terminate()                                    │
│                                   ▼                                                │
│                              ┌──────────┐                                          │
│                              │TERMINATED│ (schema archived/dropped)                │
│                              └──────────┘                                          │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Tenant Onboarding Process

| Step | Action | Database Operation |
|------|--------|-------------------|
| 1 | Create tenant registry | `INSERT INTO public.tenants` |
| 2 | Create schema | `CREATE SCHEMA bank_XXX` |
| 3 | Run Flyway migrations | Execute tenant-migration scripts |
| 4 | Create Keycloak realm | External Keycloak API call |
| 5 | Create MinIO bucket | External MinIO API call |
| 6 | Initialize configuration | `INSERT INTO public.tenant_configuration` |
| 7 | Create admin user | `INSERT INTO public.users` |
| 8 | Update status to ACTIVE | `UPDATE public.tenants SET status = 'ACTIVE'` |

### 7.3 Tenant Suspension

```sql
-- Suspend tenant (revoke write access, allow read-only)
-- Step 1: Update status
UPDATE public.tenants
SET status = 'SUSPENDED',
    suspended_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE tenant_id = 'bank_001';

-- Step 2: Revoke write permissions
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA bank_001 FROM ulms_app_user;

-- Step 3: Log action
INSERT INTO public.audit_log_global (
    event_id, event_type, event_timestamp, target_tenant_id,
    action_type, action_status
) VALUES (
    gen_random_uuid(), 'TENANT_SUSPENDED', CURRENT_TIMESTAMP,
    'bank_001', 'SUSPEND', 'SUCCESS'
);
```

### 7.4 Tenant Termination

```sql
-- Terminate tenant (archive and optionally drop schema)
-- Step 1: Update status
UPDATE public.tenants
SET status = 'TERMINATED',
    terminated_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE tenant_id = 'bank_001';

-- Step 2: Archive schema (rename for retention)
ALTER SCHEMA bank_001 RENAME TO bank_001_archived_20260205;

-- Step 3: (Optional) Drop schema after retention period
-- DROP SCHEMA bank_001_archived_20260205 CASCADE;

-- Step 4: Log action
INSERT INTO public.audit_log_global (
    event_id, event_type, event_timestamp, target_tenant_id,
    action_type, action_status
) VALUES (
    gen_random_uuid(), 'TENANT_TERMINATED', CURRENT_TIMESTAMP,
    'bank_001', 'TERMINATE', 'SUCCESS'
);
```

---

## 8. Connection Management

### 8.1 pgBouncer Configuration

```ini
# pgbouncer.ini - Connection pooling for ULMS

[databases]
# Default connection (public schema)
ulms_db = host=postgres-primary port=5432 dbname=ulms_db

# Per-tenant connections (optional, for dedicated pools)
# ulms_bank_001 = host=postgres-primary port=5432 dbname=ulms_db

[pgbouncer]
# Pool mode
pool_mode = transaction

# Connection limits
max_client_conn = 5000
default_pool_size = 50
min_pool_size = 10
reserve_pool_size = 20
reserve_pool_timeout = 5

# Database connection limits
max_db_connections = 500

# Timeouts
server_connect_timeout = 15
server_idle_timeout = 600
server_lifetime = 3600
client_idle_timeout = 0
client_login_timeout = 60
query_timeout = 0
query_wait_timeout = 120

# Logging
log_connections = 1
log_disconnections = 1
log_pooler_errors = 1

# Authentication
auth_type = hba
auth_hba_file = /etc/pgbouncer/pg_hba.conf
auth_file = /etc/pgbouncer/userlist.txt

# Admin
admin_users = pgbouncer_admin
stats_users = pgbouncer_stats

# Security
server_tls_sslmode = require
```

### 8.2 Application Connection Configuration

```yaml
# application.yml - Spring Boot datasource configuration

spring:
  datasource:
    url: jdbc:postgresql://pgbouncer:6432/ulms_db
    username: ulms_app_user
    password: ${DB_PASSWORD}
    driver-class-name: org.postgresql.Driver

    hikari:
      maximum-pool-size: 100
      minimum-idle: 20
      idle-timeout: 300000
      connection-timeout: 30000
      max-lifetime: 1800000
      leak-detection-threshold: 60000
      pool-name: ULMSHikariPool

  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        multi_tenant_connection_provider: com.ulms.config.SchemaMultiTenantConnectionProvider
        tenant_identifier_resolver: com.ulms.config.TenantIdentifierResolver
        jdbc:
          fetch_size: 50
          batch_size: 25
          batch_versioned_data: true
        order_inserts: true
        order_updates: true
```

### 8.3 Schema Switch Mechanism

```sql
-- Schema switch for each tenant request
-- Executed before each query/transaction

-- Option 1: SET search_path (recommended)
SET search_path TO bank_001, public;

-- Option 2: Fully qualified table names
SELECT * FROM bank_001.m_loan WHERE id = 123;

-- Reset after request
SET search_path TO public;
-- Or: RESET search_path;
```

### 8.4 Connection Pool Monitoring

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Active connections | < 80% max | > 85% |
| Waiting clients | 0 | > 10 |
| Avg query time | < 50ms | > 200ms |
| Pool utilization | < 70% | > 80% |

---

## 9. Security & Access Control

### 9.1 Database Users & Roles

| User/Role | Purpose | Permissions |
|-----------|---------|-------------|
| `ulms_admin` | DBA operations | SUPERUSER |
| `ulms_app_user` | Application user | SELECT, INSERT, UPDATE, DELETE on tenant schemas |
| `ulms_readonly` | Reporting/Analytics | SELECT only |
| `ulms_migration` | Flyway migrations | CREATE, ALTER, DROP on schemas |

### 9.2 Schema-Level Security

```sql
-- Create roles
CREATE ROLE ulms_app_user LOGIN PASSWORD 'secure_password';
CREATE ROLE ulms_readonly LOGIN PASSWORD 'readonly_password';
CREATE ROLE ulms_migration LOGIN PASSWORD 'migration_password';

-- Grant schema usage per tenant
GRANT USAGE ON SCHEMA bank_001 TO ulms_app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA bank_001 TO ulms_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA bank_001 TO ulms_app_user;

-- Read-only access
GRANT USAGE ON SCHEMA bank_001 TO ulms_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA bank_001 TO ulms_readonly;

-- Migration access
GRANT ALL ON SCHEMA bank_001 TO ulms_migration;
GRANT ALL ON ALL TABLES IN SCHEMA bank_001 TO ulms_migration;
```

### 9.3 Row-Level Security (Additional Layer)

```sql
-- Optional: Row-level security for additional protection
-- Enable RLS on sensitive tables

ALTER TABLE bank_001.m_loan ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY tenant_isolation_policy ON bank_001.m_loan
    USING (
        current_setting('app.current_tenant', true) = 'bank_001'
    );

-- Force RLS for all users except owner
ALTER TABLE bank_001.m_loan FORCE ROW LEVEL SECURITY;
```

### 9.4 Audit Logging

All schema modifications and sensitive operations are logged:

| Event Type | Logged Data | Retention |
|------------|-------------|-----------|
| Schema creation | Tenant ID, timestamp, user | 10 years |
| Table modification | DDL statement, user, timestamp | 10 years |
| Permission changes | Grant/Revoke details | 10 years |
| Data access | Query patterns (sampled) | 90 days |

---

## 10. Performance Considerations

### 10.1 Schema Switch Overhead

| Operation | Latency | Notes |
|-----------|---------|-------|
| SET search_path | 1-2 ms | Minimal overhead |
| Connection acquisition | 5-10 ms | Pooled connections |
| Schema validation | < 1 ms | Cached metadata |

### 10.2 Table Volume Estimates (Per Tenant)

| Table | Rows (Small Bank) | Rows (Large Bank) | Growth/Month |
|-------|-------------------|-------------------|--------------|
| m_client | 50,000 | 5,000,000 | 10,000 |
| m_loan | 10,000 | 1,000,000 | 5,000 |
| m_loan_transaction | 100,000 | 50,000,000 | 100,000 |
| cib_inquiry | 20,000 | 2,000,000 | 20,000 |
| audit_log | 500,000 | 100,000,000 | 500,000 |

### 10.3 Scaling Strategy for 62+ Banks

| Scale Level | Strategy | Banks Supported |
|-------------|----------|-----------------|
| **Current** | Single DB, schema-per-tenant | 1-30 banks |
| **Phase 2** | Read replicas, connection pooling | 31-62 banks |
| **Phase 3** | Database sharding by tenant group | 63+ banks |

### 10.4 Index Strategy per Schema

```sql
-- Standard indexes for each tenant schema
-- Applied via Flyway migration

-- Customer indexes
CREATE INDEX idx_client_nid ON bank_001.m_client(nid_number);
CREATE INDEX idx_client_mobile ON bank_001.m_client(mobile_primary);
CREATE INDEX idx_client_status ON bank_001.m_client(status);

-- Loan indexes
CREATE INDEX idx_loan_customer ON bank_001.m_loan(client_id);
CREATE INDEX idx_loan_status ON bank_001.m_loan(loan_status);
CREATE INDEX idx_loan_classification ON bank_001.m_loan(classification);
CREATE INDEX idx_loan_branch ON bank_001.m_loan(branch_id);
CREATE INDEX idx_loan_dpd ON bank_001.m_loan(dpd) WHERE dpd > 0;

-- Partial index for active loans
CREATE INDEX idx_loan_active ON bank_001.m_loan(client_id, loan_status)
    WHERE loan_status IN ('DISBURSED', 'ACTIVE');

-- Audit log indexes
CREATE INDEX idx_audit_timestamp ON bank_001.audit_log(event_timestamp);
CREATE INDEX idx_audit_user ON bank_001.audit_log(user_id);
```

---

## 11. Compliance Matrix

### 11.1 Regulatory Compliance

| Regulation | Requirement | Implementation | Status |
|------------|-------------|----------------|--------|
| **ICT Security V4.0** | Data segregation | Schema-per-tenant isolation | ✅ Compliant |
| **Bangladesh Bank** | Customer data protection | AES-256 encryption, access control | ✅ Compliant |
| **Data Protection Act** | Data localization | Per-bank data management | ✅ Compliant |
| **BRPD 15/2024** | Audit trail | 10-year retention per schema | ✅ Compliant |

### 11.2 BRD/SRS Requirements Mapping

| Requirement | Document | Section | Implementation |
|-------------|----------|---------|----------------|
| Multi-tenant support | BRD | 5.1 | Schema-per-bank |
| 62+ bank support | RFP | 2.1 | Scalable schema architecture |
| Data isolation | SRS | 7.3 | Complete schema separation |
| Connection pooling | SRS | 7.1 | pgBouncer configuration |
| Audit compliance | BRD | 8.4 | Per-tenant audit_log table |

---

## 12. Appendices

### Appendix A: Schema Creation Script

```sql
-- Complete schema creation script for new tenant

-- Variables (replace before execution)
-- {TENANT_ID}: bank_001
-- {BANK_CODE}: EXIM
-- {BANK_NAME}: EXIM Bank Limited

DO $$
DECLARE
    v_tenant_id VARCHAR := '{TENANT_ID}';
    v_bank_code VARCHAR := '{BANK_CODE}';
    v_bank_name VARCHAR := '{BANK_NAME}';
BEGIN
    -- Create schema
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', v_tenant_id);

    -- Grant permissions
    EXECUTE format('GRANT USAGE ON SCHEMA %I TO ulms_app_user', v_tenant_id);
    EXECUTE format('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA %I TO ulms_app_user', v_tenant_id);
    EXECUTE format('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA %I TO ulms_app_user', v_tenant_id);

    -- Set default privileges
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON TABLES TO ulms_app_user', v_tenant_id);
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON SEQUENCES TO ulms_app_user', v_tenant_id);

    -- Revoke public access
    EXECUTE format('REVOKE ALL ON SCHEMA %I FROM PUBLIC', v_tenant_id);

    -- Register tenant
    INSERT INTO public.tenants (tenant_id, schema_name, bank_name, bank_code, status, created_by, updated_by)
    VALUES (v_tenant_id, v_tenant_id, v_bank_name, v_bank_code, 'PENDING', 'system', 'system');

    RAISE NOTICE 'Schema % created successfully', v_tenant_id;
END $$;
```

### Appendix B: Sample Tenant Data

| tenant_id | bank_code | bank_name | status |
|-----------|-----------|-----------|--------|
| bank_001 | EXIM | EXIM Bank Limited | ACTIVE |
| bank_002 | DBBL | Dutch-Bangla Bank Limited | ACTIVE |
| bank_003 | BRAC | BRAC Bank Limited | ACTIVE |
| bank_004 | CITY | City Bank Limited | ACTIVE |
| bank_005 | EAST | Eastern Bank Limited | ACTIVE |

### Appendix C: References

1. PostgreSQL 16 Documentation - Schemas
2. Hibernate 6.4 Multi-Tenancy Guide
3. Spring Data JPA Multi-Tenancy
4. pgBouncer Configuration Reference
5. ULMS BRD v1.0
6. ULMS SRS v2.0
7. ULMS Technology Stack v2.0
8. Bangladesh Bank ICT Security Guidelines V4.0
9. BRPD Circular 15/2024

---

**Document End**

*ULMS v2.0 - Database Schema Design Document v1.0*

*Unisoft Systems Limited - Confidential*

*This document provides the complete database schema design for multi-tenant architecture supporting 62+ Bangladesh scheduled commercial banks with full regulatory compliance.*

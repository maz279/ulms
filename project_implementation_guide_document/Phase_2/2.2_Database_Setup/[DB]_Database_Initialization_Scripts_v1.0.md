# Database Initialization Scripts
## ULMS v2.0 Multi-Tenant Database Setup

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Database Initialization Scripts |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 8, 2026 |
| **Prepared By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Approved |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Multi-Tenant Schema Setup](#2-multi-tenant-schema-setup)
3. [Core Tables](#3-core-tables)
4. [BRPD Compliance Tables](#4-brpd-compliance-tables)
5. [CIB Integration Tables](#5-cib-integration-tables)
6. [Indexes and Constraints](#6-indexes-and-constraints)

---

## 1. Overview

This document provides SQL scripts for initializing the ULMS v2.0 database with multi-tenant support, BRPD compliance, and CIB integration.

### 1.1 Multi-Tenant Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MULTI-TENANT DATABASE ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   public (shared)                                                            │
│   ├── tenants                    # Tenant registry                           │
│   ├── banks                      # Bank master data                          │
│   └── audit_log                  # Cross-tenant audit                        │
│                                                                              │
│   bank_001 schema (Tenant 1)                                                 │
│   ├── m_client                   # Fineract: Customers                       │
│   ├── m_loan                     # Fineract: Loans                           │
│   ├── ulms_customers             # ULMS: Extended customers                  │
│   ├── loan_applications          # ULMS: Applications                        │
│   ├── cib_reports                # ULMS: CIB history                         │
│   └── loan_classification        # ULMS: BRPD compliance                     │
│                                                                              │
│   bank_002 schema (Tenant 2)                                                 │
│   └── ... (same structure)                                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Multi-Tenant Schema Setup

### 2.1 Create Tenant Registry

```sql
-- Connect to database
\c ulms_dev

-- Create tenant management table
CREATE TABLE public.tenants (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(20) UNIQUE NOT NULL,
    schema_name VARCHAR(50) UNIQUE NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    bank_code VARCHAR(10) UNIQUE NOT NULL,
    bank_type VARCHAR(20) CHECK (bank_type IN ('PCB', 'SCB', 'FCB', 'DFI', 'MFI')),
    license_number VARCHAR(50),
    address JSONB,
    contact_info JSONB,
    settings JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default tenant
INSERT INTO public.tenants (tenant_id, schema_name, bank_name, bank_code, bank_type)
VALUES ('default', 'bank_default', 'Default Bank', 'DEF001', 'PCB');
```

### 2.2 Create Tenant Schema Function

```sql
-- Function to create new tenant schema
CREATE OR REPLACE FUNCTION create_tenant_schema(p_tenant_id VARCHAR, p_schema_name VARCHAR)
RETURNS VOID AS $$
BEGIN
    -- Create schema
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', p_schema_name);
    
    -- Grant privileges
    EXECUTE format('GRANT ALL ON SCHEMA %I TO ulms_user', p_schema_name);
    
    -- Set search path
    EXECUTE format('ALTER USER ulms_user SET search_path TO %I, public', p_schema_name);
    
    RAISE NOTICE 'Created schema: %', p_schema_name;
END;
$$ LANGUAGE plpgsql;

-- Usage:
-- SELECT create_tenant_schema('bank_001', 'bank_001');
```

---

## 3. Core Tables

### 3.1 Extended Customer Table

```sql
-- Create in tenant schema
CREATE TABLE ulms_customers (
    id BIGSERIAL PRIMARY KEY,
    fineract_client_id BIGINT,
    
    -- NID Information (Encrypted)
    nid_number VARCHAR(20) UNIQUE NOT NULL,
    nid_verified BOOLEAN DEFAULT FALSE,
    nid_verified_at TIMESTAMP,
    nid_verification_response JSONB,
    
    -- Personal Information
    name_en VARCHAR(100) NOT NULL,
    name_bn VARCHAR(100),
    father_name VARCHAR(100),
    mother_name VARCHAR(100),
    spouse_name VARCHAR(100),
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    marital_status VARCHAR(20),
    nationality VARCHAR(50) DEFAULT 'Bangladeshi',
    
    -- Contact
    mobile_number VARCHAR(15) NOT NULL,
    email VARCHAR(100),
    emergency_contact_name VARCHAR(100),
    emergency_contact_number VARCHAR(15),
    
    -- Address (JSON for flexibility)
    present_address JSONB NOT NULL,
    permanent_address JSONB,
    
    -- Employment
    employment_type VARCHAR(30) CHECK (employment_type IN ('SALARIED', 'SELF_EMPLOYED', 'BUSINESS', 'PROFESSIONAL', 'RETIRED', 'HOUSEWIFE', 'STUDENT', 'OTHER')),
    employer_name VARCHAR(100),
    employer_address JSONB,
    designation VARCHAR(50),
    department VARCHAR(50),
    years_of_service INTEGER,
    
    -- Financial
    monthly_income DECIMAL(15,2),
    annual_income DECIMAL(15,2),
    other_income DECIMAL(15,2),
    total_income DECIMAL(15,2),
    
    -- Banking
    existing_bank_relationship JSONB,
    
    -- Metadata
    customer_type VARCHAR(20) DEFAULT 'INDIVIDUAL',
    risk_grade VARCHAR(5),
    kyc_status VARCHAR(20) DEFAULT 'PENDING',
    kyc_completed_at TIMESTAMP,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    
    -- Constraints
    CONSTRAINT chk_mobile_format CHECK (mobile_number ~ '^[0-9]{11,15}$'),
    CONSTRAINT chk_email_format CHECK (email IS NULL OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes
CREATE INDEX idx_customers_nid ON ulms_customers(nid_number);
CREATE INDEX idx_customers_mobile ON ulms_customers(mobile_number);
CREATE INDEX idx_customers_name ON ulms_customers USING gin(name_en gin_trgm_ops);
CREATE INDEX idx_customers_created ON ulms_customers(created_at);

-- Trigger for updated_at
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON ulms_customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 3.2 Loan Applications Table

```sql
CREATE TABLE loan_applications (
    id BIGSERIAL PRIMARY KEY,
    application_no VARCHAR(20) UNIQUE NOT NULL,
    
    -- Customer Reference
    customer_id BIGINT NOT NULL REFERENCES ulms_customers(id),
    
    -- Product
    product_id BIGINT NOT NULL,
    product_code VARCHAR(20),
    
    -- Application Details
    requested_amount DECIMAL(15,2) NOT NULL,
    approved_amount DECIMAL(15,2),
    sanctioned_amount DECIMAL(15,2),
    tenor_months INTEGER NOT NULL,
    interest_rate DECIMAL(5,2),
    interest_type VARCHAR(20) DEFAULT 'FIXED',
    purpose TEXT,
    purpose_code VARCHAR(20),
    
    -- Status Workflow
    status VARCHAR(30) DEFAULT 'DRAFT',
    sub_status VARCHAR(50),
    
    -- Application Stages
    stage_dates JSONB DEFAULT '{}',
    
    -- Credit Assessment
    cib_report_id BIGINT,
    credit_score INTEGER,
    credit_score_details JSONB,
    risk_grade VARCHAR(5),
    dbr_percentage DECIMAL(5,2),
    dti_percentage DECIMAL(5,2),
    
    -- Approval Hierarchy
    current_approval_level INTEGER DEFAULT 0,
    final_approval_level INTEGER,
    approval_chain JSONB DEFAULT '[]',
    
    -- BOCC Information
    bocc_meeting_id BIGINT,
    bocc_recommendation VARCHAR(20),
    bocc_remarks TEXT,
    
    -- Timestamps
    submitted_at TIMESTAMP,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    disbursed_at TIMESTAMP,
    
    -- Rejection Details
    rejection_reason VARCHAR(100),
    rejection_details TEXT,
    
    -- Disbursement
    disbursement_method VARCHAR(30),
    disbursement_account VARCHAR(50),
    
    -- Metadata
    branch_id VARCHAR(20) NOT NULL,
    source VARCHAR(20) DEFAULT 'BRANCH',
    priority VARCHAR(10) DEFAULT 'NORMAL',
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50)
);

-- Indexes
CREATE INDEX idx_apps_customer ON loan_applications(customer_id);
CREATE INDEX idx_apps_status ON loan_applications(status);
CREATE INDEX idx_apps_branch ON loan_applications(branch_id);
CREATE INDEX idx_apps_submitted ON loan_applications(submitted_at);
CREATE INDEX idx_apps_app_no ON loan_applications(application_no);

-- Trigger
CREATE TRIGGER update_apps_updated_at
    BEFORE UPDATE ON loan_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## 4. BRPD Compliance Tables

### 4.1 Loan Classification History

```sql
CREATE TABLE loan_classification_history (
    id BIGSERIAL PRIMARY KEY,
    loan_id BIGINT NOT NULL,
    fineract_loan_id BIGINT,
    
    -- Classification
    previous_classification VARCHAR(10),
    new_classification VARCHAR(10) NOT NULL,
    classification_change_reason VARCHAR(100),
    
    -- DPD Information
    days_past_due INTEGER NOT NULL,
    outstanding_principal DECIMAL(15,2),
    outstanding_interest DECIMAL(15,2),
    total_outstanding DECIMAL(15,2),
    
    -- Provision
    provision_rate DECIMAL(5,2),
    provision_amount DECIMAL(15,2),
    interest_suspense_amount DECIMAL(15,2),
    
    -- Change Date
    change_date DATE NOT NULL,
    change_effective_date DATE,
    
    -- System
    calculated_by VARCHAR(50) DEFAULT 'SYSTEM',
    batch_id VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_class_loan ON loan_classification_history(loan_id);
CREATE INDEX idx_class_date ON loan_classification_history(change_date);
CREATE INDEX idx_class_new ON loan_classification_history(new_classification);
CREATE INDEX idx_class_batch ON loan_classification_history(batch_id);

-- Partition by month for large datasets
CREATE TABLE loan_classification_history_2026_01 
    PARTITION OF loan_classification_history
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

### 4.2 Provision Register

```sql
CREATE TABLE provision_register (
    id BIGSERIAL PRIMARY KEY,
    report_date DATE NOT NULL,
    loan_id BIGINT NOT NULL,
    
    -- Classification
    classification VARCHAR(10) NOT NULL,
    dpd INTEGER,
    
    -- Amounts
    outstanding_principal DECIMAL(15,2),
    outstanding_interest DECIMAL(15,2),
    total_outstanding DECIMAL(15,2),
    
    -- Provision
    provision_rate DECIMAL(5,2),
    provision_required DECIMAL(15,2),
    provision_held DECIMAL(15,2),
    provision_shortfall DECIMAL(15,2),
    
    -- GL Posting
    gl_posted BOOLEAN DEFAULT FALSE,
    gl_posting_date DATE,
    gl_voucher_no VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prov_register_date ON provision_register(report_date);
CREATE INDEX idx_prov_register_loan ON provision_register(loan_id);
```

---

## 5. CIB Integration Tables

### 5.1 CIB Reports

```sql
CREATE TABLE cib_reports (
    id BIGSERIAL PRIMARY KEY,
    inquiry_id VARCHAR(50) UNIQUE NOT NULL,
    
    -- Inquiry Details
    customer_id BIGINT REFERENCES ulms_customers(id),
    application_id BIGINT REFERENCES loan_applications(id),
    nid_number VARCHAR(20) NOT NULL,
    tin_number VARCHAR(20),
    inquiry_type VARCHAR(20) NOT NULL, -- INDIVIDUAL, CORPORATE, PROPRIETOR
    inquiry_purpose VARCHAR(50),
    inquiry_purpose_code VARCHAR(10),
    
    -- Subject Information
    subject_name VARCHAR(100),
    subject_father_name VARCHAR(100),
    subject_mother_name VARCHAR(100),
    subject_dob DATE,
    
    -- CIB Response
    cib_response JSONB,
    cib_raw_response TEXT,
    cib_score INTEGER,
    cib_score_version VARCHAR(10),
    risk_grade VARCHAR(5),
    
    -- Summary
    total_facilities INTEGER,
    total_sanctioned DECIMAL(15,2),
    total_outstanding DECIMAL(15,2),
    total_overdue DECIMAL(15,2),
    total_emi DECIMAL(15,2),
    worst_classification VARCHAR(10),
    max_dpd INTEGER,
    
    -- Status
    status VARCHAR(20) DEFAULT 'PENDING',
    error_message TEXT,
    
    -- Metadata
    inquiry_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response_date TIMESTAMP,
    response_time_ms INTEGER,
    inquiry_source VARCHAR(50), -- API, BATCH, MANUAL
    inquiry_by VARCHAR(50),
    
    -- Cache
    cache_hit BOOLEAN DEFAULT FALSE,
    cache_expires_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_cib_customer ON cib_reports(customer_id);
CREATE INDEX idx_cib_nid ON cib_reports(nid_number);
CREATE INDEX idx_cib_date ON cib_reports(inquiry_date);
CREATE INDEX idx_cib_app ON cib_reports(application_id);
CREATE INDEX idx_cib_status ON cib_reports(status);
```

### 5.2 CIB Contract Data

```sql
CREATE TABLE cib_contract_data (
    id BIGSERIAL PRIMARY KEY,
    report_id BIGINT REFERENCES cib_reports(id),
    
    -- Contract Details
    contract_code VARCHAR(50),
    facility_type VARCHAR(50),
    
    -- Financials
    sanctioned_amount DECIMAL(15,2),
    outstanding_amount DECIMAL(15,2),
    overdue_amount DECIMAL(15,2),
    emi_amount DECIMAL(15,2),
    
    -- Status
    classification VARCHAR(10),
    dpd INTEGER,
    
    -- Dates
    sanction_date DATE,
    expiry_date DATE,
    last_payment_date DATE,
    
    -- Bank
    bank_name VARCHAR(100),
    bank_code VARCHAR(20),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cib_contract_report ON cib_contract_data(report_id);
CREATE INDEX idx_cib_contract_bank ON cib_contract_data(bank_code);
```

---

## 6. Indexes and Constraints

### 6.1 Performance Indexes

```sql
-- Composite indexes for common queries
CREATE INDEX idx_apps_status_branch ON loan_applications(status, branch_id);
CREATE INDEX idx_apps_submitted_branch ON loan_applications(submitted_at, branch_id);
CREATE INDEX idx_customers_type_date ON ulms_customers(customer_type, created_at);

-- Partial indexes
CREATE INDEX idx_apps_pending ON loan_applications(application_no) 
    WHERE status IN ('SUBMITTED', 'UNDER_REVIEW');

-- GIN indexes for JSONB
CREATE INDEX idx_customers_address ON ulms_customers USING gin(present_address);
CREATE INDEX idx_cib_response ON cib_reports USING gin(cib_response);
```

### 6.2 Foreign Key Constraints

```sql
-- Add foreign keys (if not added during table creation)
ALTER TABLE loan_applications
    ADD CONSTRAINT fk_apps_customer 
    FOREIGN KEY (customer_id) REFERENCES ulms_customers(id);

ALTER TABLE loan_classification_history
    ADD CONSTRAINT fk_class_loan 
    FOREIGN KEY (loan_id) REFERENCES m_loan(id);

ALTER TABLE cib_contract_data
    ADD CONSTRAINT fk_contract_report 
    FOREIGN KEY (report_id) REFERENCES cib_reports(id);
```

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

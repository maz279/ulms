# Data Model - Customer Management
## NID Storage and Field-Level Encryption
### Unisoft Loan Management System (ULMS) v2.0

---

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ULMS-ARCH-1.3.3 |
| **Document Title** | Data Model - Customer Management (NID, Encryption) |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 5, 2026 |
| **Prepared By** | Developer 2 |
| **Reviewed By** | Lead Developer, Security Team |
| **Classification** | Confidential - Internal Use |
| **Status** | Approved for Implementation |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | Dev 2 | Initial Customer Management Data Model |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Customer Master Table](#2-customer-master-table)
3. [Customer Address Tables](#3-customer-address-tables)
4. [Customer Employment Data](#4-customer-employment-data)
5. [Customer Documents](#5-customer-documents)
6. [NID Verification](#6-nid-verification)
7. [KYC Verification](#7-kyc-verification)
8. [Field-Level Encryption Strategy](#8-field-level-encryption-strategy)
9. [Data Protection Compliance](#9-data-protection-compliance)
10. [Flyway Migration Scripts](#10-flyway-migration-scripts)
11. [Compliance Matrix](#11-compliance-matrix)

---

## 1. Introduction

### 1.1 Purpose

This document defines the data model for Customer Management in ULMS v2.0, with specific focus on:
- National ID (NID) storage and encryption
- Field-level encryption for Personally Identifiable Information (PII)
- Bangladesh-specific compliance requirements
- NIDW API integration data model

### 1.2 Scope

| Aspect | Coverage |
|--------|----------|
| **Primary Table** | m_client (customer master) |
| **Supporting Tables** | 7 tables (address, employment, document, verification) |
| **Encryption** | AES-256-CBC field-level encryption |
| **Key Management** | HashiCorp Vault integration |
| **Compliance** | ICT Security V4.0, Data Protection Act |

### 1.3 NID Requirements (Bangladesh)

| NID Type | Format | Length | Validation |
|----------|--------|--------|------------|
| **Old NID** | Numeric only | 13 digits | `^[0-9]{13}$` |
| **Smart NID** | Numeric only | 17 digits | `^[0-9]{17}$` |

---

## 2. Customer Master Table

### 2.1 Table Definition: m_client

```sql
-- Table: {tenant_schema}.m_client
-- Purpose: Customer master data with encrypted PII fields
-- Owner: Lead Dev
-- Created: 2026-02-05

CREATE TABLE m_client (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,

    -- Business Identifiers
    external_id VARCHAR(50),                          -- External system ID
    account_no VARCHAR(20) UNIQUE,                    -- Customer account number (CIF)
    customer_cif VARCHAR(20) UNIQUE NOT NULL,         -- Customer Information File number

    -- ═══════════════════════════════════════════════════════════════════════
    -- NATIONAL ID INFORMATION (ENCRYPTED)
    -- ═══════════════════════════════════════════════════════════════════════
    nid_number VARCHAR(255) NOT NULL,                 -- ENCRYPTED: 13 or 17 digit NID
    nid_type VARCHAR(10) NOT NULL DEFAULT 'SMART',    -- OLD (13-digit), SMART (17-digit)
    nid_verified BOOLEAN NOT NULL DEFAULT FALSE,
    nid_verified_at TIMESTAMP WITH TIME ZONE,
    nid_verified_by VARCHAR(50),
    nid_verification_method VARCHAR(30),              -- API, MANUAL, DOCUMENT

    -- ═══════════════════════════════════════════════════════════════════════
    -- PERSONAL INFORMATION (PARTIAL ENCRYPTION)
    -- ═══════════════════════════════════════════════════════════════════════
    -- Names (Encrypted for search protection)
    firstname VARCHAR(255) NOT NULL,                  -- ENCRYPTED
    middlename VARCHAR(255),                          -- ENCRYPTED
    lastname VARCHAR(255),                            -- ENCRYPTED
    fullname VARCHAR(500) NOT NULL,                   -- ENCRYPTED: Full name in English
    fullname_bn VARCHAR(500),                         -- ENCRYPTED: Full name in Bengali
    display_name VARCHAR(200),                        -- Non-encrypted for display

    -- Family Information (Encrypted)
    father_name VARCHAR(255),                         -- ENCRYPTED
    father_name_bn VARCHAR(255),                      -- ENCRYPTED (Bengali)
    mother_name VARCHAR(255),                         -- ENCRYPTED
    mother_name_bn VARCHAR(255),                      -- ENCRYPTED (Bengali)
    spouse_name VARCHAR(255),                         -- ENCRYPTED
    spouse_name_bn VARCHAR(255),                      -- ENCRYPTED (Bengali)

    -- Demographics
    date_of_birth DATE NOT NULL,
    birth_place VARCHAR(100),
    gender VARCHAR(10) NOT NULL,                      -- MALE, FEMALE, OTHER
    marital_status VARCHAR(20),                       -- SINGLE, MARRIED, DIVORCED, WIDOWED
    nationality VARCHAR(50) DEFAULT 'Bangladeshi',
    religion VARCHAR(30),

    -- ═══════════════════════════════════════════════════════════════════════
    -- CONTACT INFORMATION
    -- ═══════════════════════════════════════════════════════════════════════
    mobile_primary VARCHAR(20) NOT NULL,              -- Primary mobile (OTP verified)
    mobile_primary_verified BOOLEAN DEFAULT FALSE,
    mobile_primary_verified_at TIMESTAMP WITH TIME ZONE,
    mobile_secondary VARCHAR(20),
    phone_landline VARCHAR(20),
    email VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP WITH TIME ZONE,

    -- ═══════════════════════════════════════════════════════════════════════
    -- OTHER IDENTIFICATION
    -- ═══════════════════════════════════════════════════════════════════════
    tin VARCHAR(100),                                 -- ENCRYPTED: Tax Identification Number
    passport_number VARCHAR(100),                     -- ENCRYPTED
    passport_expiry_date DATE,
    driving_license VARCHAR(100),                     -- ENCRYPTED
    birth_certificate_no VARCHAR(100),

    -- ═══════════════════════════════════════════════════════════════════════
    -- STATUS & CLASSIFICATION
    -- ═══════════════════════════════════════════════════════════════════════
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',    -- PENDING, ACTIVE, INACTIVE, BLOCKED, DECEASED
    kyc_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',-- PENDING, VERIFIED, REJECTED, EXPIRED
    risk_rating VARCHAR(10),                          -- LOW, MEDIUM, HIGH
    customer_category VARCHAR(30),                    -- INDIVIDUAL, PROPRIETOR, CORPORATE
    customer_segment VARCHAR(30),                     -- RETAIL, SME, CORPORATE, PREMIUM

    -- Activation Dates
    activation_date DATE,
    deactivation_date DATE,
    deactivation_reason VARCHAR(100),

    -- ═══════════════════════════════════════════════════════════════════════
    -- BRANCH ASSOCIATION
    -- ═══════════════════════════════════════════════════════════════════════
    home_branch_id VARCHAR(20),
    home_branch_name VARCHAR(100),
    relationship_manager_id VARCHAR(50),

    -- ═══════════════════════════════════════════════════════════════════════
    -- PHOTO (Reference to MinIO)
    -- ═══════════════════════════════════════════════════════════════════════
    photo_path VARCHAR(500),                          -- MinIO object path
    photo_verified BOOLEAN DEFAULT FALSE,

    -- ═══════════════════════════════════════════════════════════════════════
    -- AUDIT COLUMNS (Standard)
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
    CONSTRAINT pk_m_client PRIMARY KEY (id),
    CONSTRAINT uq_m_client_cif UNIQUE (customer_cif),
    CONSTRAINT uq_m_client_account_no UNIQUE (account_no),
    CONSTRAINT uq_m_client_nid UNIQUE (nid_number),
    CONSTRAINT chk_m_client_gender CHECK (
        gender IN ('MALE', 'FEMALE', 'OTHER')
    ),
    CONSTRAINT chk_m_client_status CHECK (
        status IN ('PENDING', 'ACTIVE', 'INACTIVE', 'BLOCKED', 'DECEASED')
    ),
    CONSTRAINT chk_m_client_kyc_status CHECK (
        kyc_status IN ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED')
    ),
    CONSTRAINT chk_m_client_nid_type CHECK (
        nid_type IN ('OLD', 'SMART')
    ),
    CONSTRAINT chk_m_client_marital CHECK (
        marital_status IS NULL OR marital_status IN ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED')
    )
);

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════
CREATE INDEX idx_m_client_nid ON m_client(nid_number);
CREATE INDEX idx_m_client_cif ON m_client(customer_cif);
CREATE INDEX idx_m_client_mobile ON m_client(mobile_primary);
CREATE INDEX idx_m_client_email ON m_client(email) WHERE email IS NOT NULL;
CREATE INDEX idx_m_client_status ON m_client(status);
CREATE INDEX idx_m_client_kyc_status ON m_client(kyc_status);
CREATE INDEX idx_m_client_branch ON m_client(home_branch_id);
CREATE INDEX idx_m_client_created ON m_client(created_at);

-- Partial index for active customers only
CREATE INDEX idx_m_client_active ON m_client(customer_cif, status)
    WHERE status = 'ACTIVE' AND is_deleted = FALSE;

-- ═══════════════════════════════════════════════════════════════════════════
-- COMMENTS
-- ═══════════════════════════════════════════════════════════════════════════
COMMENT ON TABLE m_client IS 'Customer master data with encrypted PII fields';
COMMENT ON COLUMN m_client.nid_number IS 'National ID (13 or 17 digits) - AES-256 encrypted';
COMMENT ON COLUMN m_client.fullname IS 'Full name in English - AES-256 encrypted';
COMMENT ON COLUMN m_client.fullname_bn IS 'Full name in Bengali - AES-256 encrypted';
COMMENT ON COLUMN m_client.tin IS 'Tax Identification Number - AES-256 encrypted';
```

### 2.2 Encrypted Fields Summary

| Field | Encryption | Algorithm | Key ID Reference |
|-------|------------|-----------|------------------|
| nid_number | Required | AES-256-CBC | `pii_encryption_key` |
| firstname | Required | AES-256-CBC | `pii_encryption_key` |
| lastname | Required | AES-256-CBC | `pii_encryption_key` |
| fullname | Required | AES-256-CBC | `pii_encryption_key` |
| fullname_bn | Required | AES-256-CBC | `pii_encryption_key` |
| father_name | Required | AES-256-CBC | `pii_encryption_key` |
| mother_name | Required | AES-256-CBC | `pii_encryption_key` |
| spouse_name | Optional | AES-256-CBC | `pii_encryption_key` |
| tin | Optional | AES-256-CBC | `pii_encryption_key` |
| passport_number | Optional | AES-256-CBC | `pii_encryption_key` |
| driving_license | Optional | AES-256-CBC | `pii_encryption_key` |

---

## 3. Customer Address Tables

### 3.1 Table Definition: customer_address

```sql
-- Table: {tenant_schema}.customer_address
-- Purpose: Customer present and permanent addresses
-- Note: Address fields are encrypted for privacy

CREATE TABLE customer_address (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,

    -- Foreign Key
    client_id BIGINT NOT NULL,

    -- Address Type
    address_type VARCHAR(20) NOT NULL,                -- PRESENT, PERMANENT, OFFICE, MAILING

    -- ═══════════════════════════════════════════════════════════════════════
    -- ADDRESS DETAILS (ENCRYPTED)
    -- ═══════════════════════════════════════════════════════════════════════
    address_line1 VARCHAR(500) NOT NULL,              -- ENCRYPTED: House/Road/Area
    address_line2 VARCHAR(500),                       -- ENCRYPTED: Additional details
    address_line1_bn VARCHAR(500),                    -- ENCRYPTED: Bengali
    address_line2_bn VARCHAR(500),                    -- ENCRYPTED: Bengali

    -- Geographic Information (Not encrypted for reporting)
    village VARCHAR(100),
    post_office VARCHAR(100),
    upazila VARCHAR(100),
    district VARCHAR(100) NOT NULL,
    division VARCHAR(50),
    postal_code VARCHAR(10),
    country VARCHAR(50) NOT NULL DEFAULT 'Bangladesh',

    -- Verification
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by VARCHAR(50),
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_method VARCHAR(30),                  -- CPV, DOCUMENT, NID_API

    -- Additional Info
    residence_type VARCHAR(30),                       -- OWNED, RENTED, FAMILY, COMPANY
    years_at_address INTEGER,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,

    -- Constraints
    CONSTRAINT pk_customer_address PRIMARY KEY (id),
    CONSTRAINT fk_customer_address_client FOREIGN KEY (client_id)
        REFERENCES m_client(id) ON DELETE CASCADE,
    CONSTRAINT chk_address_type CHECK (
        address_type IN ('PRESENT', 'PERMANENT', 'OFFICE', 'MAILING')
    ),
    CONSTRAINT uq_customer_address_type UNIQUE (client_id, address_type)
);

-- Indexes
CREATE INDEX idx_customer_address_client ON customer_address(client_id);
CREATE INDEX idx_customer_address_district ON customer_address(district);
CREATE INDEX idx_customer_address_type ON customer_address(address_type);

-- Comments
COMMENT ON TABLE customer_address IS 'Customer address records (present, permanent, office)';
COMMENT ON COLUMN customer_address.address_line1 IS 'Primary address line - AES-256 encrypted';
```

### 3.2 Bangladesh Administrative Divisions

| Division | Districts | Sample Upazilas |
|----------|-----------|-----------------|
| Dhaka | 13 | Gulshan, Dhanmondi, Mirpur |
| Chattogram | 11 | Agrabad, Pahartali, Kotwali |
| Rajshahi | 8 | Boalia, Motihar, Shah Makhdum |
| Khulna | 10 | Khalishpur, Sonadanga, Daulatpur |
| Sylhet | 4 | Kotwali, Jalalabad, Shahporan |
| Rangpur | 8 | Kotwali, Gangachara, Pirganj |
| Barisal | 6 | Kotwali, Bandar, Bakerganj |
| Mymensingh | 4 | Kotwali, Muktagacha, Trishal |

---

## 4. Customer Employment Data

### 4.1 Table Definition: customer_employment

```sql
-- Table: {tenant_schema}.customer_employment
-- Purpose: Customer employment and income information
-- Note: Income fields are encrypted for privacy

CREATE TABLE customer_employment (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,

    -- Foreign Key
    client_id BIGINT NOT NULL,

    -- Employment Type
    employment_type VARCHAR(30) NOT NULL,             -- SALARIED, SELF_EMPLOYED, BUSINESS, RETIRED, UNEMPLOYED

    -- ═══════════════════════════════════════════════════════════════════════
    -- EMPLOYER INFORMATION (ENCRYPTED)
    -- ═══════════════════════════════════════════════════════════════════════
    employer_name VARCHAR(500),                       -- ENCRYPTED
    employer_name_bn VARCHAR(500),                    -- ENCRYPTED (Bengali)
    employer_address VARCHAR(500),                    -- ENCRYPTED
    employer_phone VARCHAR(20),
    employer_industry VARCHAR(100),

    -- Position Details
    designation VARCHAR(100),
    department VARCHAR(100),
    employee_id VARCHAR(50),

    -- ═══════════════════════════════════════════════════════════════════════
    -- INCOME INFORMATION (ENCRYPTED)
    -- ═══════════════════════════════════════════════════════════════════════
    monthly_gross_income DECIMAL(15,2),               -- ENCRYPTED
    monthly_net_income DECIMAL(15,2),                 -- ENCRYPTED
    annual_income DECIMAL(15,2),                      -- ENCRYPTED
    other_income DECIMAL(15,2),                       -- ENCRYPTED
    income_currency VARCHAR(3) DEFAULT 'BDT',

    -- Employment Duration
    employment_start_date DATE,
    employment_end_date DATE,
    years_in_current_job INTEGER,
    total_work_experience_years INTEGER,

    -- Status
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by VARCHAR(50),
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_document VARCHAR(100),               -- SALARY_SLIP, EMPLOYMENT_CERT, BANK_STMT

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,

    -- Constraints
    CONSTRAINT pk_customer_employment PRIMARY KEY (id),
    CONSTRAINT fk_customer_employment_client FOREIGN KEY (client_id)
        REFERENCES m_client(id) ON DELETE CASCADE,
    CONSTRAINT chk_employment_type CHECK (
        employment_type IN ('SALARIED', 'SELF_EMPLOYED', 'BUSINESS', 'RETIRED', 'UNEMPLOYED', 'STUDENT', 'HOUSEWIFE')
    )
);

-- Indexes
CREATE INDEX idx_customer_employment_client ON customer_employment(client_id);
CREATE INDEX idx_customer_employment_type ON customer_employment(employment_type);
CREATE INDEX idx_customer_employment_current ON customer_employment(client_id, is_current)
    WHERE is_current = TRUE;

-- Comments
COMMENT ON TABLE customer_employment IS 'Customer employment and income records';
COMMENT ON COLUMN customer_employment.monthly_gross_income IS 'Gross monthly income in BDT - AES-256 encrypted';
```

### 4.2 Employment Type Definitions

| Type | Description | Income Verification |
|------|-------------|---------------------|
| SALARIED | Regular employment | Salary slip, bank statement |
| SELF_EMPLOYED | Professional services | Income certificate, tax return |
| BUSINESS | Business owner | Trade license, financial statements |
| RETIRED | Pension recipient | Pension certificate |
| UNEMPLOYED | Not currently employed | N/A |
| STUDENT | Full-time student | Student ID, guardian income |
| HOUSEWIFE | Homemaker | Spouse income documentation |

---

## 5. Customer Documents

### 5.1 Table Definition: customer_document

```sql
-- Table: {tenant_schema}.customer_document
-- Purpose: KYC document metadata (files stored in MinIO)

CREATE TABLE customer_document (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,

    -- Foreign Keys
    client_id BIGINT NOT NULL,
    document_type_id INTEGER NOT NULL,

    -- Document Details
    document_name VARCHAR(200) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    document_number VARCHAR(100),                     -- ID/Passport/License number

    -- ═══════════════════════════════════════════════════════════════════════
    -- STORAGE INFORMATION (MinIO)
    -- ═══════════════════════════════════════════════════════════════════════
    bucket_name VARCHAR(100) NOT NULL,                -- Tenant-specific bucket
    object_key VARCHAR(500) NOT NULL,                 -- Object path in MinIO
    storage_path VARCHAR(500),                        -- Full path reference

    -- File Metadata
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,                        -- Size in bytes
    file_extension VARCHAR(10),

    -- Security
    checksum_md5 VARCHAR(32),
    checksum_sha256 VARCHAR(64) NOT NULL,
    is_encrypted BOOLEAN NOT NULL DEFAULT TRUE,       -- MinIO SSE
    encryption_key_id VARCHAR(100),

    -- Verification
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_status VARCHAR(30) DEFAULT 'PENDING',-- PENDING, VERIFIED, REJECTED
    verified_by VARCHAR(50),
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_remarks TEXT,
    rejection_reason VARCHAR(200),

    -- Validity
    issue_date DATE,
    expiry_date DATE,
    is_expired BOOLEAN GENERATED ALWAYS AS (
        expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE
    ) STORED,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,

    -- Soft Delete (for audit trail)
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by VARCHAR(100),

    -- Constraints
    CONSTRAINT pk_customer_document PRIMARY KEY (id),
    CONSTRAINT fk_customer_document_client FOREIGN KEY (client_id)
        REFERENCES m_client(id) ON DELETE CASCADE,
    CONSTRAINT fk_customer_document_type FOREIGN KEY (document_type_id)
        REFERENCES ref_document_type(id),
    CONSTRAINT chk_document_verification_status CHECK (
        verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')
    )
);

-- Indexes
CREATE INDEX idx_customer_document_client ON customer_document(client_id);
CREATE INDEX idx_customer_document_type ON customer_document(document_type_id);
CREATE INDEX idx_customer_document_status ON customer_document(verification_status);
CREATE INDEX idx_customer_document_bucket ON customer_document(bucket_name, object_key);

-- Comments
COMMENT ON TABLE customer_document IS 'Customer KYC document metadata (files in MinIO)';
COMMENT ON COLUMN customer_document.object_key IS 'MinIO object key path';
COMMENT ON COLUMN customer_document.checksum_sha256 IS 'SHA-256 hash for integrity verification';
```

### 5.2 Reference: Document Type Table

```sql
-- Table: {tenant_schema}.ref_document_type
-- Purpose: Document type master data

CREATE TABLE ref_document_type (
    id SERIAL PRIMARY KEY,
    type_code VARCHAR(30) UNIQUE NOT NULL,
    type_name VARCHAR(100) NOT NULL,
    type_name_bn VARCHAR(100),
    category VARCHAR(30) NOT NULL,                    -- IDENTITY, FINANCIAL, COLLATERAL, OTHER
    applicable_to VARCHAR(30) NOT NULL,               -- CUSTOMER, LOAN, BOTH

    -- Requirements
    is_mandatory_kyc BOOLEAN NOT NULL DEFAULT FALSE,
    is_mandatory_loan BOOLEAN NOT NULL DEFAULT FALSE,

    -- File Restrictions
    allowed_extensions VARCHAR(100) DEFAULT 'pdf,jpg,jpeg,png',
    max_size_mb INTEGER DEFAULT 5,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_ref_document_type PRIMARY KEY (id),
    CONSTRAINT uq_ref_document_type_code UNIQUE (type_code),
    CONSTRAINT chk_document_category CHECK (
        category IN ('IDENTITY', 'FINANCIAL', 'COLLATERAL', 'ADDRESS', 'OTHER')
    )
);

-- Seed Data
INSERT INTO ref_document_type (type_code, type_name, type_name_bn, category, applicable_to, is_mandatory_kyc) VALUES
('NID_CARD', 'National ID Card', 'জাতীয় পরিচয়পত্র', 'IDENTITY', 'CUSTOMER', TRUE),
('NID_CARD_BACK', 'National ID Card (Back)', 'জাতীয় পরিচয়পত্র (পিছন)', 'IDENTITY', 'CUSTOMER', TRUE),
('PASSPORT', 'Passport', 'পাসপোর্ট', 'IDENTITY', 'CUSTOMER', FALSE),
('PHOTO', 'Passport Size Photo', 'পাসপোর্ট সাইজ ছবি', 'IDENTITY', 'CUSTOMER', TRUE),
('SIGNATURE', 'Signature Specimen', 'স্বাক্ষর নমুনা', 'IDENTITY', 'CUSTOMER', TRUE),
('INCOME_CERT', 'Income Certificate', 'আয়ের প্রমাণপত্র', 'FINANCIAL', 'LOAN', FALSE),
('SALARY_SLIP', 'Salary Slip', 'বেতন স্লিপ', 'FINANCIAL', 'LOAN', FALSE),
('BANK_STATEMENT', 'Bank Statement', 'ব্যাংক স্টেটমেন্ট', 'FINANCIAL', 'LOAN', FALSE),
('TIN_CERT', 'TIN Certificate', 'টিআইএন সার্টিফিকেট', 'FINANCIAL', 'LOAN', FALSE),
('TRADE_LICENSE', 'Trade License', 'ট্রেড লাইসেন্স', 'FINANCIAL', 'LOAN', FALSE),
('LAND_DOCUMENT', 'Land Ownership Document', 'জমির দলিল', 'COLLATERAL', 'LOAN', FALSE),
('UTILITY_BILL', 'Utility Bill', 'ইউটিলিটি বিল', 'ADDRESS', 'CUSTOMER', FALSE);
```

---

## 6. NID Verification

### 6.1 Table Definition: nid_verification_log

```sql
-- Table: {tenant_schema}.nid_verification_log
-- Purpose: Audit trail for NID verification via NIDW API

CREATE TABLE nid_verification_log (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,

    -- Foreign Key
    client_id BIGINT NOT NULL,

    -- ═══════════════════════════════════════════════════════════════════════
    -- VERIFICATION REQUEST (ENCRYPTED)
    -- ═══════════════════════════════════════════════════════════════════════
    nid_number VARCHAR(255) NOT NULL,                 -- ENCRYPTED
    date_of_birth DATE NOT NULL,

    -- Request Details
    verification_method VARCHAR(30) NOT NULL,         -- API, MANUAL, OFFLINE
    request_id VARCHAR(100),                          -- NIDW request ID
    api_endpoint VARCHAR(200),

    -- ═══════════════════════════════════════════════════════════════════════
    -- VERIFICATION RESPONSE
    -- ═══════════════════════════════════════════════════════════════════════
    verification_status VARCHAR(30) NOT NULL,         -- SUCCESS, FAILED, MISMATCH, TIMEOUT, ERROR
    nidw_response_code VARCHAR(10),
    nidw_response_message VARCHAR(500),

    -- Returned Data (encrypted JSON)
    nidw_data_encrypted TEXT,                         -- ENCRYPTED: Full NIDW response

    -- Match Results
    name_match_result BOOLEAN,
    name_match_score DECIMAL(5,2),                    -- 0-100%
    dob_match_result BOOLEAN,
    photo_match_result BOOLEAN,
    photo_match_score DECIMAL(5,2),                   -- 0-100%

    -- Error Details
    error_code VARCHAR(20),
    error_message TEXT,

    -- Timestamps
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP WITH TIME ZONE,
    response_time_ms INTEGER,                         -- Response time in milliseconds

    -- Audit
    requested_by VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),

    -- Constraints
    CONSTRAINT pk_nid_verification_log PRIMARY KEY (id),
    CONSTRAINT fk_nid_verification_client FOREIGN KEY (client_id)
        REFERENCES m_client(id) ON DELETE CASCADE,
    CONSTRAINT chk_verification_method CHECK (
        verification_method IN ('API', 'MANUAL', 'OFFLINE')
    ),
    CONSTRAINT chk_verification_status CHECK (
        verification_status IN ('SUCCESS', 'FAILED', 'MISMATCH', 'TIMEOUT', 'ERROR', 'PENDING')
    )
);

-- Indexes
CREATE INDEX idx_nid_verification_client ON nid_verification_log(client_id);
CREATE INDEX idx_nid_verification_nid ON nid_verification_log(nid_number);
CREATE INDEX idx_nid_verification_status ON nid_verification_log(verification_status);
CREATE INDEX idx_nid_verification_date ON nid_verification_log(requested_at);

-- Comments
COMMENT ON TABLE nid_verification_log IS 'Audit trail for NID verification via NIDW API';
COMMENT ON COLUMN nid_verification_log.nidw_data_encrypted IS 'Full NIDW response - AES-256 encrypted';
```

### 6.2 NIDW Integration Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         NIDW VERIFICATION FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   ┌──────────────┐                                                                  │
│   │ 1. Customer  │                                                                  │
│   │ enters NID   │                                                                  │
│   └──────┬───────┘                                                                  │
│          │                                                                           │
│          ▼                                                                           │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                       │
│   │ 2. ULMS      │────▶│ 3. Encrypt   │────▶│ 4. Call      │                       │
│   │ validates    │     │ request data │     │ NIDW API     │                       │
│   │ NID format   │     │              │     │              │                       │
│   └──────────────┘     └──────────────┘     └──────┬───────┘                       │
│                                                     │                               │
│                                                     ▼                               │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                       │
│   │ 7. Update    │◀────│ 6. Store     │◀────│ 5. Receive   │                       │
│   │ m_client     │     │ verification │     │ response     │                       │
│   │ nid_verified │     │ log          │     │              │                       │
│   └──────────────┘     └──────────────┘     └──────────────┘                       │
│                                                                                      │
│   NIDW Response Fields:                                                             │
│   - Full name (English & Bengali)                                                   │
│   - Father's name                                                                   │
│   - Mother's name                                                                   │
│   - Date of birth                                                                   │
│   - Present address                                                                 │
│   - Permanent address                                                               │
│   - Photo (Base64)                                                                  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. KYC Verification

### 7.1 Table Definition: customer_kyc_verification

```sql
-- Table: {tenant_schema}.customer_kyc_verification
-- Purpose: Overall KYC verification status and audit

CREATE TABLE customer_kyc_verification (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,

    -- Foreign Key
    client_id BIGINT NOT NULL,

    -- Verification Type
    verification_type VARCHAR(30) NOT NULL,           -- NID, ADDRESS, EMPLOYMENT, INCOME, PHOTO

    -- Status
    verification_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    -- PENDING, IN_PROGRESS, VERIFIED, REJECTED, EXPIRED

    -- Verification Details
    verification_method VARCHAR(50),                  -- API_NIDW, DOCUMENT_REVIEW, CPV, PHONE_CALL
    verification_source VARCHAR(100),                 -- Source of verification
    verification_reference VARCHAR(100),              -- Reference ID (NID log ID, CPV report ID, etc.)

    -- Result
    verification_result JSONB,                        -- Detailed verification result
    verification_score DECIMAL(5,2),                  -- 0-100% confidence score
    verification_remarks TEXT,
    rejection_reason VARCHAR(200),

    -- Dates
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_reverified_at TIMESTAMP WITH TIME ZONE,

    -- Verifier
    verified_by VARCHAR(100),
    verifier_role VARCHAR(50),

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,

    -- Constraints
    CONSTRAINT pk_customer_kyc_verification PRIMARY KEY (id),
    CONSTRAINT fk_kyc_verification_client FOREIGN KEY (client_id)
        REFERENCES m_client(id) ON DELETE CASCADE,
    CONSTRAINT chk_kyc_verification_type CHECK (
        verification_type IN ('NID', 'ADDRESS', 'EMPLOYMENT', 'INCOME', 'PHOTO', 'DOCUMENT', 'OVERALL')
    ),
    CONSTRAINT chk_kyc_verification_status CHECK (
        verification_status IN ('PENDING', 'IN_PROGRESS', 'VERIFIED', 'REJECTED', 'EXPIRED')
    ),
    CONSTRAINT uq_kyc_verification_type UNIQUE (client_id, verification_type)
);

-- Indexes
CREATE INDEX idx_kyc_verification_client ON customer_kyc_verification(client_id);
CREATE INDEX idx_kyc_verification_status ON customer_kyc_verification(verification_status);
CREATE INDEX idx_kyc_verification_type ON customer_kyc_verification(verification_type);

-- Comments
COMMENT ON TABLE customer_kyc_verification IS 'KYC verification status for each verification type';
```

### 7.2 KYC Verification Requirements

| Verification Type | Mandatory | Method | Validity |
|-------------------|-----------|--------|----------|
| NID | Yes | NIDW API | Permanent |
| PHOTO | Yes | Photo match | 2 years |
| ADDRESS | Yes | CPV / Document | 1 year |
| EMPLOYMENT | Loan-only | Document review | 6 months |
| INCOME | Loan-only | Document review | 6 months |

---

## 8. Field-Level Encryption Strategy

### 8.1 Encryption Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Algorithm** | AES-256-CBC | Advanced Encryption Standard |
| **Key Size** | 256 bits | Maximum security |
| **IV Size** | 128 bits | Initialization Vector |
| **Padding** | PKCS7 | Standard padding |
| **Encoding** | Base64 | Encrypted data storage |

### 8.2 Hibernate/JPA Encryption Implementation

```java
// Entity field annotation for encrypted columns
@Entity
@Table(name = "m_client")
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nid_number", nullable = false)
    @Convert(converter = EncryptedStringConverter.class)
    private String nidNumber;

    @Column(name = "fullname", nullable = false)
    @Convert(converter = EncryptedStringConverter.class)
    private String fullname;

    @Column(name = "monthly_gross_income")
    @Convert(converter = EncryptedBigDecimalConverter.class)
    private BigDecimal monthlyGrossIncome;

    // ... other fields
}

// Converter implementation
@Converter
public class EncryptedStringConverter implements AttributeConverter<String, String> {

    @Autowired
    private EncryptionService encryptionService;

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) return null;
        return encryptionService.encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        return encryptionService.decrypt(dbData);
    }
}
```

### 8.3 Key Management with HashiCorp Vault

```yaml
# Vault key configuration
vault:
  address: https://vault.ulms.internal:8200
  namespace: ulms
  secrets:
    path: secret/data/ulms/encryption-keys
    keys:
      - name: pii_encryption_key
        purpose: Customer PII encryption
        algorithm: AES-256-CBC
        rotation_days: 365
      - name: financial_encryption_key
        purpose: Financial data encryption
        algorithm: AES-256-CBC
        rotation_days: 180
```

### 8.4 Encryption at Database Level (Alternative)

```sql
-- PostgreSQL pgcrypto extension for additional security
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encryption function using pgcrypto
CREATE OR REPLACE FUNCTION encrypt_pii(data TEXT, key_id TEXT)
RETURNS TEXT AS $$
DECLARE
    encryption_key BYTEA;
BEGIN
    -- Retrieve key from secure storage (simplified)
    encryption_key := get_encryption_key(key_id);

    RETURN encode(
        pgp_sym_encrypt(data, encryption_key::TEXT, 'cipher-algo=aes256'),
        'base64'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decryption function
CREATE OR REPLACE FUNCTION decrypt_pii(encrypted_data TEXT, key_id TEXT)
RETURNS TEXT AS $$
DECLARE
    encryption_key BYTEA;
BEGIN
    encryption_key := get_encryption_key(key_id);

    RETURN pgp_sym_decrypt(
        decode(encrypted_data, 'base64'),
        encryption_key::TEXT
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 9. Data Protection Compliance

### 9.1 ICT Security Guidelines V4.0 Compliance

| Guideline | Requirement | Implementation |
|-----------|-------------|----------------|
| **4.3.1** | PII encryption at rest | AES-256 field-level encryption |
| **4.3.2** | Data minimization | Only essential PII collected |
| **4.3.3** | Access logging | Audit log for all PII access |
| **4.3.4** | Key management | HashiCorp Vault integration |
| **4.3.5** | Data retention | 7-year active + 7-year archive |

### 9.2 Data Access Logging

```sql
-- Trigger for logging PII access
CREATE OR REPLACE FUNCTION log_pii_access()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (
        event_id,
        event_type,
        event_timestamp,
        user_id,
        resource_type,
        resource_id,
        action_type,
        action_status
    ) VALUES (
        gen_random_uuid()::TEXT,
        'PII_ACCESS',
        CURRENT_TIMESTAMP,
        current_setting('app.current_user', true),
        'CUSTOMER',
        NEW.id::TEXT,
        TG_OP,
        'SUCCESS'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
CREATE TRIGGER trg_m_client_pii_access
    AFTER SELECT OR UPDATE ON m_client
    FOR EACH ROW
    EXECUTE FUNCTION log_pii_access();
```

### 9.3 Data Masking for Non-Production

```sql
-- Function to mask sensitive data for test environments
CREATE OR REPLACE FUNCTION mask_nid(nid_value TEXT)
RETURNS TEXT AS $$
BEGIN
    IF LENGTH(nid_value) = 13 THEN
        RETURN SUBSTRING(nid_value, 1, 4) || '*****' || SUBSTRING(nid_value, 10, 4);
    ELSIF LENGTH(nid_value) = 17 THEN
        RETURN SUBSTRING(nid_value, 1, 4) || '*********' || SUBSTRING(nid_value, 14, 4);
    ELSE
        RETURN '***INVALID***';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Example: SELECT mask_nid(decrypt_pii(nid_number, 'pii_key')) FROM m_client;
-- Result: 1234*****5678 or 1234*********5678
```

---

## 10. Flyway Migration Scripts

### 10.1 Migration: V1.0.0__create_customer_tables.sql

```sql
-- V1.0.0__create_customer_tables.sql
-- Description: Create customer management tables
-- Author: Dev 2
-- Date: 2026-02-05
-- JIRA: ULMS-103

-- ═══════════════════════════════════════════════════════════════════════════
-- REFERENCE: Document Type
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ref_document_type (
    id SERIAL PRIMARY KEY,
    type_code VARCHAR(30) UNIQUE NOT NULL,
    type_name VARCHAR(100) NOT NULL,
    type_name_bn VARCHAR(100),
    category VARCHAR(30) NOT NULL,
    applicable_to VARCHAR(30) NOT NULL,
    is_mandatory_kyc BOOLEAN NOT NULL DEFAULT FALSE,
    is_mandatory_loan BOOLEAN NOT NULL DEFAULT FALSE,
    allowed_extensions VARCHAR(100) DEFAULT 'pdf,jpg,jpeg,png',
    max_size_mb INTEGER DEFAULT 5,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_document_category CHECK (
        category IN ('IDENTITY', 'FINANCIAL', 'COLLATERAL', 'ADDRESS', 'OTHER')
    )
);

-- ═══════════════════════════════════════════════════════════════════════════
-- MAIN: Customer Master
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS m_client (
    id BIGSERIAL PRIMARY KEY,
    external_id VARCHAR(50),
    account_no VARCHAR(20) UNIQUE,
    customer_cif VARCHAR(20) UNIQUE NOT NULL,
    nid_number VARCHAR(255) NOT NULL,
    nid_type VARCHAR(10) NOT NULL DEFAULT 'SMART',
    nid_verified BOOLEAN NOT NULL DEFAULT FALSE,
    nid_verified_at TIMESTAMP WITH TIME ZONE,
    nid_verified_by VARCHAR(50),
    nid_verification_method VARCHAR(30),
    firstname VARCHAR(255) NOT NULL,
    middlename VARCHAR(255),
    lastname VARCHAR(255),
    fullname VARCHAR(500) NOT NULL,
    fullname_bn VARCHAR(500),
    display_name VARCHAR(200),
    father_name VARCHAR(255),
    father_name_bn VARCHAR(255),
    mother_name VARCHAR(255),
    mother_name_bn VARCHAR(255),
    spouse_name VARCHAR(255),
    spouse_name_bn VARCHAR(255),
    date_of_birth DATE NOT NULL,
    birth_place VARCHAR(100),
    gender VARCHAR(10) NOT NULL,
    marital_status VARCHAR(20),
    nationality VARCHAR(50) DEFAULT 'Bangladeshi',
    religion VARCHAR(30),
    mobile_primary VARCHAR(20) NOT NULL,
    mobile_primary_verified BOOLEAN DEFAULT FALSE,
    mobile_primary_verified_at TIMESTAMP WITH TIME ZONE,
    mobile_secondary VARCHAR(20),
    phone_landline VARCHAR(20),
    email VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    tin VARCHAR(100),
    passport_number VARCHAR(100),
    passport_expiry_date DATE,
    driving_license VARCHAR(100),
    birth_certificate_no VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    kyc_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    risk_rating VARCHAR(10),
    customer_category VARCHAR(30),
    customer_segment VARCHAR(30),
    activation_date DATE,
    deactivation_date DATE,
    deactivation_reason VARCHAR(100),
    home_branch_id VARCHAR(20),
    home_branch_name VARCHAR(100),
    relationship_manager_id VARCHAR(50),
    photo_path VARCHAR(500),
    photo_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by VARCHAR(100),
    CONSTRAINT uq_m_client_nid UNIQUE (nid_number),
    CONSTRAINT chk_m_client_gender CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    CONSTRAINT chk_m_client_status CHECK (status IN ('PENDING', 'ACTIVE', 'INACTIVE', 'BLOCKED', 'DECEASED')),
    CONSTRAINT chk_m_client_kyc_status CHECK (kyc_status IN ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED')),
    CONSTRAINT chk_m_client_nid_type CHECK (nid_type IN ('OLD', 'SMART'))
);

-- Indexes for m_client
CREATE INDEX idx_m_client_nid ON m_client(nid_number);
CREATE INDEX idx_m_client_cif ON m_client(customer_cif);
CREATE INDEX idx_m_client_mobile ON m_client(mobile_primary);
CREATE INDEX idx_m_client_status ON m_client(status);
CREATE INDEX idx_m_client_created ON m_client(created_at);

-- ═══════════════════════════════════════════════════════════════════════════
-- CHILD: Customer Address
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS customer_address (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES m_client(id) ON DELETE CASCADE,
    address_type VARCHAR(20) NOT NULL,
    address_line1 VARCHAR(500) NOT NULL,
    address_line2 VARCHAR(500),
    address_line1_bn VARCHAR(500),
    address_line2_bn VARCHAR(500),
    village VARCHAR(100),
    post_office VARCHAR(100),
    upazila VARCHAR(100),
    district VARCHAR(100) NOT NULL,
    division VARCHAR(50),
    postal_code VARCHAR(10),
    country VARCHAR(50) NOT NULL DEFAULT 'Bangladesh',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by VARCHAR(50),
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_method VARCHAR(30),
    residence_type VARCHAR(30),
    years_at_address INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    CONSTRAINT chk_address_type CHECK (address_type IN ('PRESENT', 'PERMANENT', 'OFFICE', 'MAILING')),
    CONSTRAINT uq_customer_address_type UNIQUE (client_id, address_type)
);

CREATE INDEX idx_customer_address_client ON customer_address(client_id);
CREATE INDEX idx_customer_address_district ON customer_address(district);

-- ═══════════════════════════════════════════════════════════════════════════
-- CHILD: Customer Employment
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS customer_employment (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES m_client(id) ON DELETE CASCADE,
    employment_type VARCHAR(30) NOT NULL,
    employer_name VARCHAR(500),
    employer_name_bn VARCHAR(500),
    employer_address VARCHAR(500),
    employer_phone VARCHAR(20),
    employer_industry VARCHAR(100),
    designation VARCHAR(100),
    department VARCHAR(100),
    employee_id VARCHAR(50),
    monthly_gross_income DECIMAL(15,2),
    monthly_net_income DECIMAL(15,2),
    annual_income DECIMAL(15,2),
    other_income DECIMAL(15,2),
    income_currency VARCHAR(3) DEFAULT 'BDT',
    employment_start_date DATE,
    employment_end_date DATE,
    years_in_current_job INTEGER,
    total_work_experience_years INTEGER,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by VARCHAR(50),
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_document VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    CONSTRAINT chk_employment_type CHECK (
        employment_type IN ('SALARIED', 'SELF_EMPLOYED', 'BUSINESS', 'RETIRED', 'UNEMPLOYED', 'STUDENT', 'HOUSEWIFE')
    )
);

CREATE INDEX idx_customer_employment_client ON customer_employment(client_id);
CREATE INDEX idx_customer_employment_current ON customer_employment(client_id, is_current) WHERE is_current = TRUE;

-- ═══════════════════════════════════════════════════════════════════════════
-- CHILD: Customer Document
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS customer_document (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES m_client(id) ON DELETE CASCADE,
    document_type_id INTEGER NOT NULL REFERENCES ref_document_type(id),
    document_name VARCHAR(200) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    document_number VARCHAR(100),
    bucket_name VARCHAR(100) NOT NULL,
    object_key VARCHAR(500) NOT NULL,
    storage_path VARCHAR(500),
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    file_extension VARCHAR(10),
    checksum_md5 VARCHAR(32),
    checksum_sha256 VARCHAR(64) NOT NULL,
    is_encrypted BOOLEAN NOT NULL DEFAULT TRUE,
    encryption_key_id VARCHAR(100),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_status VARCHAR(30) DEFAULT 'PENDING',
    verified_by VARCHAR(50),
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_remarks TEXT,
    rejection_reason VARCHAR(200),
    issue_date DATE,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by VARCHAR(100),
    CONSTRAINT chk_document_verification_status CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED'))
);

CREATE INDEX idx_customer_document_client ON customer_document(client_id);
CREATE INDEX idx_customer_document_type ON customer_document(document_type_id);
CREATE INDEX idx_customer_document_status ON customer_document(verification_status);

-- ═══════════════════════════════════════════════════════════════════════════
-- CHILD: NID Verification Log
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS nid_verification_log (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES m_client(id) ON DELETE CASCADE,
    nid_number VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    verification_method VARCHAR(30) NOT NULL,
    request_id VARCHAR(100),
    api_endpoint VARCHAR(200),
    verification_status VARCHAR(30) NOT NULL,
    nidw_response_code VARCHAR(10),
    nidw_response_message VARCHAR(500),
    nidw_data_encrypted TEXT,
    name_match_result BOOLEAN,
    name_match_score DECIMAL(5,2),
    dob_match_result BOOLEAN,
    photo_match_result BOOLEAN,
    photo_match_score DECIMAL(5,2),
    error_code VARCHAR(20),
    error_message TEXT,
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP WITH TIME ZONE,
    response_time_ms INTEGER,
    requested_by VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    CONSTRAINT chk_verification_method CHECK (verification_method IN ('API', 'MANUAL', 'OFFLINE')),
    CONSTRAINT chk_verification_status CHECK (
        verification_status IN ('SUCCESS', 'FAILED', 'MISMATCH', 'TIMEOUT', 'ERROR', 'PENDING')
    )
);

CREATE INDEX idx_nid_verification_client ON nid_verification_log(client_id);
CREATE INDEX idx_nid_verification_status ON nid_verification_log(verification_status);
CREATE INDEX idx_nid_verification_date ON nid_verification_log(requested_at);

-- ═══════════════════════════════════════════════════════════════════════════
-- CHILD: KYC Verification
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS customer_kyc_verification (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES m_client(id) ON DELETE CASCADE,
    verification_type VARCHAR(30) NOT NULL,
    verification_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    verification_method VARCHAR(50),
    verification_source VARCHAR(100),
    verification_reference VARCHAR(100),
    verification_result JSONB,
    verification_score DECIMAL(5,2),
    verification_remarks TEXT,
    rejection_reason VARCHAR(200),
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_reverified_at TIMESTAMP WITH TIME ZONE,
    verified_by VARCHAR(100),
    verifier_role VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    CONSTRAINT chk_kyc_verification_type CHECK (
        verification_type IN ('NID', 'ADDRESS', 'EMPLOYMENT', 'INCOME', 'PHOTO', 'DOCUMENT', 'OVERALL')
    ),
    CONSTRAINT chk_kyc_verification_status CHECK (
        verification_status IN ('PENDING', 'IN_PROGRESS', 'VERIFIED', 'REJECTED', 'EXPIRED')
    ),
    CONSTRAINT uq_kyc_verification_type UNIQUE (client_id, verification_type)
);

CREATE INDEX idx_kyc_verification_client ON customer_kyc_verification(client_id);
CREATE INDEX idx_kyc_verification_status ON customer_kyc_verification(verification_status);

-- ═══════════════════════════════════════════════════════════════════════════
-- COMMENTS
-- ═══════════════════════════════════════════════════════════════════════════
COMMENT ON TABLE m_client IS 'Customer master data with encrypted PII fields';
COMMENT ON TABLE customer_address IS 'Customer addresses (present, permanent, office)';
COMMENT ON TABLE customer_employment IS 'Customer employment and income records';
COMMENT ON TABLE customer_document IS 'Customer KYC document metadata (files in MinIO)';
COMMENT ON TABLE nid_verification_log IS 'Audit trail for NID verification via NIDW API';
COMMENT ON TABLE customer_kyc_verification IS 'KYC verification status for each verification type';
```

---

## 11. Compliance Matrix

### 11.1 BRD/SRS Requirements Mapping

| Requirement | Reference | Implementation | Status |
|-------------|-----------|----------------|--------|
| NID-based customer identification | BRD 6.1.2 | m_client.nid_number (encrypted) | ✅ |
| NID verification via NIDW API | BRD 6.1.4 | nid_verification_log table | ✅ |
| Field-level encryption for PII | SRS 7.3.2 | AES-256-CBC encryption | ✅ |
| Bengali language support | URD 14.2 | fullname_bn, address_bn fields | ✅ |
| KYC document management | BRD 6.1.3 | customer_document table | ✅ |
| Employment/income verification | BRD 6.1.5 | customer_employment table | ✅ |
| Address verification (CPV) | BRD 6.2.3 | customer_address.is_verified | ✅ |

### 11.2 Data Protection Compliance

| Regulation | Requirement | Implementation | Status |
|------------|-------------|----------------|--------|
| ICT Security V4.0 | PII encryption | AES-256 field-level | ✅ |
| ICT Security V4.0 | Access audit | Audit log triggers | ✅ |
| ICT Security V4.0 | Key management | HashiCorp Vault | ✅ |
| Data Protection Act | Data minimization | Essential fields only | ✅ |
| Data Protection Act | Right to deletion | Soft delete support | ✅ |

---

## Appendices

### Appendix A: Encrypted Field List

| Table | Field | Encryption | Key |
|-------|-------|------------|-----|
| m_client | nid_number | AES-256-CBC | pii_encryption_key |
| m_client | firstname | AES-256-CBC | pii_encryption_key |
| m_client | lastname | AES-256-CBC | pii_encryption_key |
| m_client | fullname | AES-256-CBC | pii_encryption_key |
| m_client | fullname_bn | AES-256-CBC | pii_encryption_key |
| m_client | father_name | AES-256-CBC | pii_encryption_key |
| m_client | mother_name | AES-256-CBC | pii_encryption_key |
| m_client | tin | AES-256-CBC | pii_encryption_key |
| customer_address | address_line1 | AES-256-CBC | pii_encryption_key |
| customer_employment | employer_name | AES-256-CBC | pii_encryption_key |
| customer_employment | monthly_gross_income | AES-256-CBC | financial_key |
| nid_verification_log | nidw_data_encrypted | AES-256-CBC | pii_encryption_key |

### Appendix B: References

1. Bangladesh NID Wing (NIDW) API Documentation
2. ULMS BRD v1.0 - Section 6.1 Customer Management
3. ULMS SRS v2.0 - Section 3.1 Customer Module
4. ICT Security Guidelines V4.0 - Data Protection
5. HashiCorp Vault Documentation
6. PostgreSQL pgcrypto Extension

---

**Document End**

*ULMS v2.0 - Data Model - Customer Management v1.0*

*Unisoft Systems Limited - Confidential*

*This document provides the complete data model for Customer Management with NID storage and field-level encryption for ULMS v2.0.*

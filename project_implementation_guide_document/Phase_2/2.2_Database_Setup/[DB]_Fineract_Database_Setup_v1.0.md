# Fineract Database Setup
## Core Schema Configuration for ULMS v2.0

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Fineract Database Setup |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 8, 2026 |
| **Prepared By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Approved |

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Tenant Database Setup](#2-tenant-database-setup)
3. [Fineract Schema Initialization](#3-fineract-schema-initialization)
4. [ULMS Extensions](#4-ulms-extensions)
5. [Initial Data](#5-initial-data)
6. [Verification](#6-verification)

---

## 1. Prerequisites

- PostgreSQL 16 installed and running
- Database user `ulms_user` created with appropriate privileges
- Tenant schema created

---

## 2. Tenant Database Setup

### 2.1 Create Tenant Registry

```sql
-- Connect to tenants database
\c fineract_tenants

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    identifier VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    timezone_id VARCHAR(100) NOT NULL,
    country_id INT,
    joined_date DATE,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastmodified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    connection_parameters JSONB
);

-- Insert default tenant
INSERT INTO tenants (identifier, name, timezone_id, connection_parameters)
VALUES (
    'default', 
    'Default Tenant', 
    'Asia/Dhaka',
    '{
        "driverClass": "org.postgresql.Driver",
        "protocol": "postgresql",
        "subProtocol": "postgresql",
        "host": "localhost",
        "port": "5432",
        "schemaName": "fineract_default",
        "schemaServer": "localhost",
        "schemaServerPort": "5432",
        "schemaConnectionParameters": "?serverTimezone=Asia/Dhaka",
        "schemaUsername": "ulms_user",
        "schemaPassword": "secure_password"
    }'::jsonb
) ON CONFLICT (identifier) DO NOTHING;
```

### 2.2 Create Tenant Database

```sql
-- Create default tenant database
CREATE DATABASE fineract_default OWNER ulms_user;

-- Connect to tenant database
\c fineract_default

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

---

## 3. Fineract Schema Initialization

### 3.1 Run Flyway Migrations

```bash
# Navigate to Fineract directory
cd backend/fineract

# Run migrations
./gradlew flywayMigrate -Pflyway.url=jdbc:postgresql://localhost:5432/fineract_default \
  -Pflyway.user=ulms_user \
  -Pflyway.password=secure_password
```

### 3.2 Core Fineract Tables

```sql
-- The following tables are created by Fineract migrations:
-- m_office           - Branch/Office hierarchy
-- m_staff            - Bank employees
-- m_currency         - Currency configuration
-- m_charge           - Fee/charge types
-- m_fund             - Fund sources
-- m_code             - Reference data codes
-- m_code_value       - Code values
-- m_product_loan     - Loan product definitions
-- m_loan             - Loan accounts
-- m_loan_repayment_schedule - EMI schedules
-- m_loan_transaction - Loan transactions
-- m_client           - Customer master
-- m_savings_account  - Savings accounts
-- m_payment_type     - Payment methods
-- m_accounting_rule  - Accounting rules
-- acc_gl_account     - GL accounts
-- acc_gl_journal_entry - Journal entries
```

---

## 4. ULMS Extensions

### 4.1 Add ULMS Columns to Fineract Tables

```sql
-- Add ULMS-specific columns to m_loan
ALTER TABLE m_loan ADD COLUMN IF NOT EXISTS ulms_application_id BIGINT;
ALTER TABLE m_loan ADD COLUMN IF NOT EXISTS ulms_classification VARCHAR(10);
ALTER TABLE m_loan ADD COLUMN IF NOT EXISTS ulms_dpd INTEGER DEFAULT 0;
ALTER TABLE m_loan ADD COLUMN IF NOT EXISTS ulms_npa_date DATE;
ALTER TABLE m_loan ADD COLUMN IF NOT EXISTS ulms_cib_report_id BIGINT;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_m_loan_ulms_app ON m_loan(ulms_application_id);
CREATE INDEX IF NOT EXISTS idx_m_loan_classification ON m_loan(ulms_classification);
CREATE INDEX IF NOT EXISTS idx_m_loan_dpd ON m_loan(ulms_dpd);

-- Add ULMS columns to m_client
ALTER TABLE m_client ADD COLUMN IF NOT EXISTS ulms_customer_id BIGINT;
ALTER TABLE m_client ADD COLUMN IF NOT EXISTS ulms_nid_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE m_client ADD COLUMN IF NOT EXISTS ulms_risk_grade VARCHAR(5);

CREATE INDEX IF NOT EXISTS idx_m_client_ulms_cust ON m_client(ulms_customer_id);
```

### 4.2 Create ULMS-Fineract Mapping Table

```sql
CREATE TABLE ulms_fineract_mapping (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(20) NOT NULL, -- LOAN, CLIENT, SAVINGS
    ulms_entity_id BIGINT NOT NULL,
    fineract_entity_id BIGINT NOT NULL,
    tenant_id VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entity_type, ulms_entity_id, tenant_id)
);

CREATE INDEX idx_ulms_fin_map_type ON ulms_fineract_mapping(entity_type);
CREATE INDEX idx_ulms_fin_map_ulms ON ulms_fineract_mapping(ulms_entity_id);
CREATE INDEX idx_ulms_fin_map_fineract ON ulms_fineract_mapping(fineract_entity_id);
```

---

## 5. Initial Data

### 5.1 Office Structure

```sql
-- Insert Head Office
INSERT INTO m_office (parent_id, name, external_id, opening_date, hierarchy)
VALUES (NULL, 'Head Office', 'HO001', '2010-01-01', '.');

-- Get HO id
DO $$
DECLARE
    ho_id BIGINT;
BEGIN
    SELECT id INTO ho_id FROM m_office WHERE name = 'Head Office';
    
    -- Insert branches
    INSERT INTO m_office (parent_id, name, external_id, opening_date, hierarchy)
    VALUES 
        (ho_id, 'Dhanmondi Branch', 'BR001', '2015-01-01', '.' || ho_id || '.'),
        (ho_id, 'Gulshan Branch', 'BR002', '2016-01-01', '.' || ho_id || '.'),
        (ho_id, 'Motijheel Branch', 'BR003', '2017-01-01', '.' || ho_id || '.');
END $$;
```

### 5.2 Currency

```sql
-- Insert Bangladesh Taka
INSERT INTO m_currency (code, decimal_places, name, display_symbol, name_code)
VALUES ('BDT', 2, 'Bangladesh Taka', '৳', 'currency.BDT')
ON CONFLICT (code) DO NOTHING;
```

### 5.3 Payment Types

```sql
INSERT INTO m_payment_type (value, description, is_cash_payment, order_position, "name") VALUES
('Cash', 'Cash Payment', true, 1, 'Cash'),
('Cheque', 'Cheque Payment', false, 2, 'Cheque'),
('Bank Transfer', 'Bank Transfer / BEFTN', false, 3, 'Bank Transfer'),
('bKash', 'bKash Mobile Banking', false, 4, 'bKash'),
('Nagad', 'Nagad Mobile Banking', false, 5, 'Nagad'),
('Rocket', 'DBBL Rocket', false, 6, 'Rocket'),
('Online Banking', 'Internet Banking', false, 7, 'Online Banking')
ON CONFLICT (value) DO NOTHING;
```

### 5.4 Staff (Sample)

```sql
-- Insert sample staff
INSERT INTO m_staff (office_id, firstname, lastname, display_name, mobile_no, joining_date, status)
SELECT 
    o.id,
    'System',
    'Administrator',
    'System Administrator',
    '01700000000',
    CURRENT_DATE,
    1
FROM m_office o WHERE o.name = 'Head Office'
ON CONFLICT DO NOTHING;
```

---

## 6. Verification

### 6.1 Check Tables

```sql
-- List all Fineract tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'm_%'
ORDER BY table_name;

-- Count records in key tables
SELECT 
    'Offices' as entity, COUNT(*) as count FROM m_office
UNION ALL
SELECT 'Staff', COUNT(*) FROM m_staff
UNION ALL
SELECT 'Clients', COUNT(*) FROM m_client
UNION ALL
SELECT 'Loans', COUNT(*) FROM m_loan
UNION ALL
SELECT 'Loan Products', COUNT(*) FROM m_product_loan;
```

### 6.2 Test Connection

```bash
# From Fineract application
./gradlew :fineract-provider:bootRun

# Check logs for successful database connection
```

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

# Database Seeding Scripts
## ULMS v2.0 Test Data

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Database Seeding Scripts |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 8, 2026 |
| **Prepared By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Approved |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Loan Products](#2-loan-products)
3. [Test Customers](#3-test-customers)
4. [Test Applications](#4-test-applications)
5. [Reference Data](#5-reference-data)
6. [Running Seeds](#6-running-seeds)

---

## 1. Overview

This document provides SQL scripts for seeding development data into ULMS v2.0 database.

### 1.1 Data Categories

| Category | Records | Purpose |
|----------|---------|---------|
| Loan Products | 15+ | Product catalog |
| Test Customers | 100 | Customer data |
| Test Applications | 200 | Application pipeline |
| Reference Data | 50+ | Codes and lookups |

---

## 2. Loan Products

### 2.1 Personal Loan Products

```sql
-- Personal Loan - Standard
INSERT INTO loan_products (
    product_code, 
    name_en, 
    name_bn, 
    category, 
    is_islamic,
    min_amount, 
    max_amount, 
    default_amount,
    min_tenor_months, 
    max_tenor_months, 
    default_tenor_months,
    min_rate, 
    max_rate, 
    default_rate,
    repayment_frequency,
    repayment_type,
    processing_fee_type,
    processing_fee_value,
    late_fee_type,
    late_fee_value,
    required_documents,
    approval_workflow,
    status
) VALUES (
    'PL-001',
    'Personal Loan - Standard',
    'ব্যক্তিগত ঋণ - সাধারণ',
    'RETAIL',
    false,
    50000, 2000000, 500000,
    12, 60, 36,
    9.00, 15.00, 12.00,
    'MONTHLY',
    'EMI',
    'PERCENTAGE', 1.00,
    'FIXED', 500.00,
    '["NID", "PHOTO", "INCOME_PROOF", "BANK_STATEMENT"]',
    'STANDARD',
    'ACTIVE'
);

-- Personal Loan - Premium
INSERT INTO loan_products VALUES (
    'PL-002',
    'Personal Loan - Premium',
    'ব্যক্তিগত ঋণ - প্রিমিয়াম',
    'RETAIL',
    false,
    2000000, 10000000, 5000000,
    12, 84, 48,
    8.00, 12.00, 10.00,
    'MONTHLY',
    'EMI',
    'PERCENTAGE', 0.75,
    'FIXED', 1000.00,
    '["NID", "PHOTO", "INCOME_PROOF", "BANK_STATEMENT", "TIN"]',
    'STANDARD',
    'ACTIVE'
);

-- Home Loan
INSERT INTO loan_products VALUES (
    'HL-001',
    'Home Loan',
    'গৃহ ঋণ',
    'RETAIL',
    false,
    500000, 50000000, 3000000,
    60, 300, 180,
    7.00, 12.00, 9.00,
    'MONTHLY',
    'EMI',
    'PERCENTAGE', 1.00,
    'FIXED', 1000.00,
    '["NID", "PHOTO", "INCOME_PROOF", "BANK_STATEMENT", "SALARY_CERTIFICATE", "PROPERTY_DOCUMENTS"]',
    'STANDARD',
    'ACTIVE'
);

-- Auto Loan
INSERT INTO loan_products VALUES (
    'AL-001',
    'Auto Loan',
    'গাড়ি ঋণ',
    'RETAIL',
    false,
    300000, 10000000, 1500000,
    12, 72, 48,
    8.00, 13.00, 10.50,
    'MONTHLY',
    'EMI',
    'PERCENTAGE', 1.00,
    'FIXED', 500.00,
    '["NID", "PHOTO", "INCOME_PROOF", "BANK_STATEMENT", "QUOTATION"]',
    'STANDARD',
    'ACTIVE'
);
```

### 2.2 SME Products

```sql
-- Working Capital
INSERT INTO loan_products VALUES (
    'WC-001',
    'Working Capital Loan',
    'ওয়ার্কিং ক্যাপিটাল ঋণ',
    'SME',
    false,
    500000, 50000000, 5000000,
    6, 60, 24,
    9.00, 14.00, 11.00,
    'MONTHLY',
    'EMI',
    'PERCENTAGE', 1.00,
    'FIXED', 1000.00,
    '["NID", "PHOTO", "TIN", "TRADE_LICENSE", "BANK_STATEMENT", "FINANCIAL_STATEMENTS"]',
    'STANDARD',
    'ACTIVE'
);

-- Term Loan
INSERT INTO loan_products VALUES (
    'TL-001',
    'Term Loan - SME',
    'টার্ম লোন - এসএমই',
    'SME',
    false,
    1000000, 100000000, 10000000,
    12, 120, 60,
    8.00, 13.00, 10.50,
    'MONTHLY',
    'EMI',
    'PERCENTAGE', 1.00,
    'FIXED', 1000.00,
    '["NID", "PHOTO", "TIN", "TRADE_LICENSE", "BANK_STATEMENT", "FINANCIAL_STATEMENTS", "PROJECT_REPORT"]',
    'STANDARD',
    'ACTIVE'
);
```

### 2.3 Islamic Products

```sql
-- Murabaha
INSERT INTO loan_products VALUES (
    'MU-001',
    'Murabaha',
    'মুরাবাহা',
    'RETAIL',
    true,
    50000, 2000000, 500000,
    12, 60, 36,
    0, 0, 0,  -- Islamic - profit rate instead
    'MONTHLY',
    'EMI',
    'PERCENTAGE', 1.00,
    'FIXED', 500.00,
    '["NID", "PHOTO", "INCOME_PROOF", "BANK_STATEMENT"]',
    'STANDARD',
    'ACTIVE'
);
```

---

## 3. Test Customers

### 3.1 Generate Test Customers

```sql
-- Create function to generate test customers
CREATE OR REPLACE FUNCTION generate_test_customers(p_count INTEGER)
RETURNS VOID AS $$
DECLARE
    i INTEGER;
    random_mobile VARCHAR(15);
    random_nid VARCHAR(17);
BEGIN
    FOR i IN 1..p_count LOOP
        -- Generate random mobile (Bangladesh format)
        random_mobile := '017' || LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0');
        
        -- Generate random NID (17 digits)
        random_nid := LPAD(FLOOR(RANDOM() * 10000000000000000)::TEXT, 17, '0');
        
        INSERT INTO ulms_customers (
            nid_number,
            name_en,
            name_bn,
            father_name,
            mother_name,
            date_of_birth,
            gender,
            marital_status,
            mobile_number,
            email,
            present_address,
            permanent_address,
            employment_type,
            employer_name,
            designation,
            monthly_income,
            customer_type,
            kyc_status,
            created_by
        ) VALUES (
            random_nid,
            'Test Customer ' || i,
            'টেস্ট গ্রাহক ' || i,
            'Father Name ' || i,
            'Mother Name ' || i,
            CURRENT_DATE - INTERVAL '20 years' - (FLOOR(RANDOM() * 40) || ' years')::INTERVAL,
            CASE WHEN RANDOM() > 0.5 THEN 'MALE' ELSE 'FEMALE' END,
            CASE FLOOR(RANDOM() * 4)::INT 
                WHEN 0 THEN 'SINGLE' 
                WHEN 1 THEN 'MARRIED' 
                WHEN 2 THEN 'DIVORCED' 
                ELSE 'WIDOWED' 
            END,
            random_mobile,
            'customer' || i || '@test.com',
            jsonb_build_object(
                'address_line_1', 'House ' || i || ', Road ' || (i % 20 + 1),
                'address_line_2', 'Dhanmondi',
                'city', 'Dhaka',
                'postal_code', '1209',
                'country', 'Bangladesh'
            ),
            jsonb_build_object(
                'address_line_1', 'Village ' || i,
                'address_line_2', 'Thana ' || (i % 10 + 1),
                'city', 'District ' || (i % 20 + 1),
                'postal_code', '1000',
                'country', 'Bangladesh'
            ),
            CASE FLOOR(RANDOM() * 5)::INT 
                WHEN 0 THEN 'SALARIED' 
                WHEN 1 THEN 'BUSINESS' 
                WHEN 2 THEN 'SELF_EMPLOYED' 
                WHEN 3 THEN 'PROFESSIONAL' 
                ELSE 'OTHER' 
            END,
            'Company ' || (i % 50 + 1),
            'Position ' || (i % 10 + 1),
            30000 + FLOOR(RANDOM() * 170000),
            'INDIVIDUAL',
            'COMPLETED',
            'system'
        )
        ON CONFLICT (nid_number) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Generate 100 test customers
SELECT generate_test_customers(100);
```

---

## 4. Test Applications

### 4.1 Generate Test Applications

```sql
-- Create function to generate test applications
CREATE OR REPLACE FUNCTION generate_test_applications(p_count INTEGER)
RETURNS VOID AS $$
DECLARE
    i INTEGER;
    v_customer_id BIGINT;
    v_product_id BIGINT;
    v_branch_id VARCHAR(20);
    v_amount DECIMAL(15,2);
    v_status VARCHAR(30);
    v_app_no VARCHAR(20);
BEGIN
    FOR i IN 1..p_count LOOP
        -- Get random customer
        SELECT id INTO v_customer_id 
        FROM ulms_customers 
        ORDER BY RANDOM() 
        LIMIT 1;
        
        -- Get random product
        SELECT id INTO v_product_id 
        FROM loan_products 
        WHERE status = 'ACTIVE'
        ORDER BY RANDOM() 
        LIMIT 1;
        
        -- Random branch
        v_branch_id := 'BR00' || (1 + FLOOR(RANDOM() * 3))::INT;
        
        -- Random amount
        v_amount := 100000 + FLOOR(RANDOM() * 4900000);
        
        -- Random status with weighted distribution
        v_status := CASE 
            WHEN RANDOM() < 0.15 THEN 'DRAFT'
            WHEN RANDOM() < 0.30 THEN 'SUBMITTED'
            WHEN RANDOM() < 0.50 THEN 'UNDER_REVIEW'
            WHEN RANDOM() < 0.65 THEN 'APPROVED'
            WHEN RANDOM() < 0.80 THEN 'DISBURSED'
            WHEN RANDOM() < 0.90 THEN 'REJECTED'
            ELSE 'CLOSED'
        END;
        
        -- Generate application number
        v_app_no := 'APP-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(i::TEXT, 6, '0');
        
        INSERT INTO loan_applications (
            application_no,
            customer_id,
            product_id,
            requested_amount,
            approved_amount,
            tenor_months,
            interest_rate,
            purpose,
            status,
            branch_id,
            source,
            submitted_at,
            created_by
        ) VALUES (
            v_app_no,
            v_customer_id,
            v_product_id,
            v_amount,
            CASE WHEN v_status IN ('APPROVED', 'DISBURSED') THEN v_amount ELSE NULL END,
            12 + FLOOR(RANDOM() * 48)::INT,
            10.00 + (RANDOM() * 4),
            'Personal Use',
            v_status,
            v_branch_id,
            'BRANCH',
            CASE WHEN v_status != 'DRAFT' THEN CURRENT_TIMESTAMP - (FLOOR(RANDOM() * 30) || ' days')::INTERVAL ELSE NULL END,
            'system'
        )
        ON CONFLICT (application_no) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Generate 200 test applications
SELECT generate_test_applications(200);
```

---

## 5. Reference Data

### 5.1 Document Types

```sql
INSERT INTO document_types (code, name_en, name_bn, category, is_mandatory, max_size_mb, allowed_formats) VALUES
('NID', 'National ID Card', 'জাতীয় পরিচয়পত্র', 'IDENTITY', true, 5, '["pdf", "jpg", "png"]'),
('PHOTO', 'Passport Size Photo', 'পাসপোর্ট সাইজ ছবি', 'IDENTITY', true, 2, '["jpg", "png"]'),
('TIN', 'TIN Certificate', 'টিন সার্টিফিকেট', 'IDENTITY', false, 5, '["pdf"]'),
('PASSPORT', 'Passport', 'পাসপোর্ট', 'IDENTITY', false, 5, '["pdf", "jpg", "png"]'),
('BIRTH_CERT', 'Birth Certificate', 'জন্ম সনদ', 'IDENTITY', false, 5, '["pdf", "jpg", "png"]'),
('INCOME_PROOF', 'Income Proof', 'আয়ের প্রমাণ', 'FINANCIAL', true, 10, '["pdf"]'),
('BANK_STATEMENT', 'Bank Statement', 'ব্যাংক স্টেটমেন্ট', 'FINANCIAL', true, 10, '["pdf"]'),
('SALARY_CERT', 'Salary Certificate', 'বেতন সার্টিফিকেট', 'FINANCIAL', true, 5, '["pdf"]'),
('TRADE_LICENSE', 'Trade License', 'ট্রেড লাইসেন্স', 'BUSINESS', true, 5, '["pdf"]'),
('TAX_RETURN', 'Tax Return', 'ট্যাক্স রিটার্ন', 'FINANCIAL', false, 10, '["pdf"]'),
('PROPERTY_DOC', 'Property Documents', 'সম্পত্তির দলিল', 'COLLATERAL', false, 20, '["pdf"]'),
('VEHICLE_REG', 'Vehicle Registration', 'যানবাহন রেজিস্ট্রেশন', 'COLLATERAL', false, 5, '["pdf"]'),
('QUOTATION', 'Quotation', 'কোটেশন', 'PURCHASE', false, 5, '["pdf"]')
ON CONFLICT (code) DO NOTHING;
```

### 5.2 Loan Purposes

```sql
INSERT INTO loan_purposes (code, name_en, name_bn, category, is_active) VALUES
('PERSONAL', 'Personal Use', 'ব্যক্তিগত ব্যবহার', 'RETAIL', true),
('MEDICAL', 'Medical Expenses', 'চিকিৎসা ব্যয়', 'RETAIL', true),
('EDUCATION', 'Education', 'শিক্ষা', 'RETAIL', true),
('MARRIAGE', 'Marriage', 'বিবাহ', 'RETAIL', true),
('TRAVEL', 'Travel', 'ভ্রমণ', 'RETAIL', true),
('HOME_RENOVATION', 'Home Renovation', 'বাড়ি সংস্কার', 'RETAIL', true),
('DEBT_CONSOLIDATION', 'Debt Consolidation', 'ঋণ একীকরণ', 'RETAIL', true),
('VEHICLE_PURCHASE', 'Vehicle Purchase', 'গাড়ি ক্রয়', 'RETAIL', true),
('BUSINESS_EXPANSION', 'Business Expansion', 'ব্যবসায় সম্প্রসারণ', 'SME', true),
('WORKING_CAPITAL', 'Working Capital', 'ওয়ার্কিং ক্যাপিটাল', 'SME', true),
('MACHINERY', 'Machinery Purchase', 'যন্ত্রপাতি ক্রয়', 'SME', true),
('INVENTORY', 'Inventory Purchase', 'মজুদ ক্রয়', 'SME', true)
ON CONFLICT (code) DO NOTHING;
```

---

## 6. Running Seeds

### 6.1 Execute All Seeds

```bash
# Run complete seed script
psql -h localhost -U ulms_user -d ulms_dev -f scripts/seeds/01_loan_products.sql
psql -h localhost -U ulms_user -d ulms_dev -f scripts/seeds/02_test_customers.sql
psql -h localhost -U ulms_user -d ulms_dev -f scripts/seeds/03_test_applications.sql
psql -h localhost -U ulms_user -d ulms_dev -f scripts/seeds/04_reference_data.sql
```

### 6.2 Verification

```sql
-- Verify seed data
SELECT 'Loan Products' as table_name, COUNT(*) as count FROM loan_products
UNION ALL
SELECT 'Customers', COUNT(*) FROM ulms_customers
UNION ALL
SELECT 'Applications', COUNT(*) FROM loan_applications
UNION ALL
SELECT 'Document Types', COUNT(*) FROM document_types;
```

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

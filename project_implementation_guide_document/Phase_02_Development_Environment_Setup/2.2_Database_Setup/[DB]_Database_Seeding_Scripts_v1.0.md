**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Database Seeding Scripts |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document ID** | 2.2.4 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | QA Lead, ULMS Project |
| **Reviewed By** | Database Administrator |
| **Classification** | Internal |
| **Status** | Approved |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | QA Lead | Initial version |

---

# Database Seeding Scripts
## Test Data Management for ULMS Development and Testing

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Seeding Strategy](#2-seeding-strategy)
3. [Reference Data Seeding](#3-reference-data-seeding)
4. [Test User Seeding](#4-test-user-seeding)
5. [Sample Client Data](#5-sample-client-data)
6. [Sample Loan Data](#6-sample-loan-data)
7. [Test Data Scenarios](#7-test-data-scenarios)
8. [Data Anonymization](#8-data-anonymization)
9. [Execution Instructions](#9-execution-instructions)
10. [Related Documents](#10-related-documents)

---

## 1. Purpose

This document provides SQL scripts and procedures for seeding test data into ULMS v2.0 databases. The seeded data supports development, unit testing, integration testing, and user acceptance testing while ensuring compliance with Bangladesh Bank data privacy requirements.

---

## 2. Seeding Strategy

### 2.1 Data Categories

| Category | Purpose | Volume | Refresh Frequency |
|----------|---------|--------|-------------------|
| Reference Data | Master data | ~500 records | As needed |
| Test Users | Authentication testing | ~50 records | Per test run |
| Sample Clients | Feature testing | ~1000 records | Per sprint |
| Sample Loans | Workflow testing | ~5000 records | Per sprint |
| Transaction History | Reporting testing | ~100K records | Monthly |

### 2.2 Environment-Specific Seeding

| Environment | Data Type | Anonymized | Volume |
|-------------|-----------|------------|--------|
| Local Dev | Synthetic | N/A | Minimal |
| CI/Test | Synthetic | N/A | Medium |
| Staging | Anonymized Production | Yes | Large |
| Production | Real Data | N/A | Production |

---

## 3. Reference Data Seeding

### 3.1 Bangladesh Administrative Data

**File:** `scripts/seeding/01-reference-data.sql`

```sql
-- ==========================================
-- Bangladesh Reference Data Seeding
-- ==========================================

\c ulms_test

-- ==========================================
-- 1. ALL DIVISIONS OF BANGLADESH
-- ==========================================

TRUNCATE TABLE reference_data.divisions RESTART IDENTITY CASCADE;

INSERT INTO reference_data.divisions (code, name, name_bn) VALUES
('10', 'Barisal', 'বরিশাল'),
('20', 'Chattogram', 'চট্টগ্রাম'),
('30', 'Dhaka', 'ঢাকা'),
('40', 'Khulna', 'খুলনা'),
('50', 'Rajshahi', 'রাজশাহী'),
('55', 'Rangpur', 'রংপুর'),
('60', 'Sylhet', 'সিলেট'),
('65', 'Mymensingh', 'ময়মনসিংহ');

-- ==========================================
-- 2. ALL DISTRICTS OF BANGLADESH
-- ==========================================

TRUNCATE TABLE reference_data.districts RESTART IDENTITY CASCADE;

-- Barisal Division (10)
INSERT INTO reference_data.districts (division_id, code, name, name_bn) VALUES
(1, '04', 'Barguna', 'বরগুনা'),
(1, '06', 'Barisal', 'বরিশাল'),
(1, '09', 'Bhola', 'ভোলা'),
(1, '42', 'Jhalokati', 'ঝালকাঠী'),
(1, '78', 'Patuakhali', 'পটুয়াখালী'),
(1, '79', 'Pirojpur', 'পিরোজপুর');

-- Chattogram Division (20)
INSERT INTO reference_data.districts (division_id, code, name, name_bn) VALUES
(2, '03', 'Bandarban', 'বান্দরবান'),
(2, '12', 'Brahmanbaria', 'ব্রাহ্মণবাড়িয়া'),
(2, '13', 'Chandpur', 'চাঁদপুর'),
(2, '15', 'Chattogram', 'চট্টগ্রাম'),
(2, '19', 'Cumilla', 'কুমিল্লা'),
(2, '22', 'Cox''s Bazar', 'কক্সবাজার'),
(2, '30', 'Feni', 'ফেনী'),
(2, '46', 'Khagrachhari', 'খাগড়াছড়ি'),
(2, '51', 'Lakshmipur', 'লক্ষ্মীপুর'),
(2, '75', 'Noakhali', 'নোয়াখালী'),
(2, '84', 'Rangamati', 'রাঙ্গামাটি');

-- Dhaka Division (30)
INSERT INTO reference_data.districts (division_id, code, name, name_bn) VALUES
(3, '01', 'Dhaka', 'ঢাকা'),
(3, '18', 'Faridpur', 'ফরিদপুর'),
(3, '33', 'Gazipur', 'গাজীপুর'),
(3, '35', 'Gopalganj', 'গোপালগঞ্জ'),
(3, '39', 'Jamalpur', 'জামালপুর'),
(3, '48', 'Kishoreganj', 'কিশোরগঞ্জ'),
(3, '53', 'Madaripur', 'মাদারীপুর'),
(3, '56', 'Manikganj', 'মানিকগঞ্জ'),
(3, '59', 'Munshiganj', 'মুন্সিগঞ্জ'),
(3, '67', 'Narayanganj', 'নারায়ণগঞ্জ'),
(3, '68', 'Narsingdi', 'নরসিংদী'),
(3, '72', 'Netrokona', 'নেত্রকোনা'),
(3, '81', 'Rajbari', 'রাজবাড়ী'),
(3, '82', 'Shariatpur', 'শরীয়তপুর'),
(3, '86', 'Sherpur', 'শেরপুর'),
(3, '93', 'Tangail', 'টাঙ্গাইল');

-- Khulna Division (40)
INSERT INTO reference_data.districts (division_id, code, name, name_bn) VALUES
(4, '10', 'Bagerhat', 'বাগেরহাট'),
(4, '27', 'Chuadanga', 'চুয়াডাঙ্গা'),
(4, '47', 'Jashore', 'যশোর'),
(4, '41', 'Jhenaidah', 'ঝিনাইদহ'),
(4, '44', 'Khulna', 'খুলনা'),
(4, '50', 'Kushtia', 'কুষ্টিয়া'),
(4, '55', 'Magura', 'মাগুরা'),
(4, '57', 'Meherpur', 'মেহেরপুর'),
(4, '65', 'Narail', 'নড়াইল'),
(4, '87', 'Satkhira', 'সাতক্ষীরা');

-- Rajshahi Division (50)
INSERT INTO reference_data.districts (division_id, code, name, name_bn) VALUES
(5, '11', 'Bogura', 'বগুড়া'),
(5, '38', 'Joypurhat', 'জয়পুরহাট'),
(5, '49', 'Naogaon', 'নওগাঁ'),
(5, '52', 'Natore', 'নাটোর'),
(5, '64', 'Nawabganj', 'নবাবগঞ্জ'),
(5, '69', 'Pabna', 'পাবনা'),
(5, '70', 'Rajshahi', 'রাজশাহী'),
(5, '77', 'Sirajganj', 'সিরাজগঞ্জ');

-- Rangpur Division (55)
INSERT INTO reference_data.districts (division_id, code, name, name_bn) VALUES
(6, '32', 'Dinajpur', 'দিনাজপুর'),
(6, '36', 'Gaibandha', 'গাইবান্ধা'),
(6, '45', 'Kurigram', 'কুড়িগ্রাম'),
(6, '54', 'Lalmonirhat', 'লালমনিরহাট'),
(6, '73', 'Nilphamari', 'নীলফামারী'),
(6, '85', 'Panchagarh', 'পঞ্চগড়'),
(6, '88', 'Rangpur', 'রংপুর'),
(6, '94', 'Thakurgaon', 'ঠাকুরগাঁও');

-- Sylhet Division (60)
INSERT INTO reference_data.districts (division_id, code, name, name_bn) VALUES
(7, '07', 'Habiganj', 'হবিগঞ্জ'),
(7, '24', 'Moulvibazar', 'মৌলভীবাজার'),
(7, '58', 'Sunamganj', 'সুনামগঞ্জ'),
(7, '90', 'Sylhet', 'সিলেট');

-- Mymensingh Division (65)
INSERT INTO reference_data.districts (division_id, code, name, name_bn) VALUES
(8, '14', 'Jamalpur', 'জামালপুর'),
(8, '34', 'Mymensingh', 'ময়মনসিংহ'),
(8, '89', 'Netrokona', 'নেত্রকোনা'),
(8, '93', 'Sherpur', 'শেরপুর');

-- ==========================================
-- 3. OCCUPATION CODES
-- ==========================================

CREATE TABLE IF NOT EXISTS reference_data.occupations (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    name_bn VARCHAR(200),
    sector_id INTEGER REFERENCES reference_data.m_economic_sector(id),
    is_active BOOLEAN DEFAULT true
);

INSERT INTO reference_data.occupations (code, name, name_bn, sector_id) VALUES
('FARMER', 'Farmer', 'কৃষক', 1),
('BUSINESS_OWNER', 'Business Owner', 'ব্যবসায়ী', 6),
('SERVICE_PRIVATE', 'Private Service', 'বেসরকারি চাকরি', 8),
('SERVICE_GOVT', 'Government Service', 'সরকারি চাকরি', 8),
('TEACHER', 'Teacher', 'শিক্ষক', 8),
('DOCTOR', 'Doctor', 'ডাক্তার', 8),
('ENGINEER', 'Engineer', 'ইঞ্জিনিয়ার', 3),
('LABOUR', 'Day Labourer', 'দিনমজুর', 1),
('DRIVER', 'Driver', 'চালক', 6),
('HOUSEWIFE', 'Housewife', 'গৃহিণী', NULL),
('STUDENT', 'Student', 'ছাত্র/ছাত্রী', NULL),
('RETIRED', 'Retired', 'অবসরপ্রাপ্ত', NULL),
('OTHERS', 'Others', 'অন্যান্য', NULL);

-- Verify counts
SELECT 'Divisions' as entity, COUNT(*) as count FROM reference_data.divisions
UNION ALL
SELECT 'Districts', COUNT(*) FROM reference_data.districts
UNION ALL
SELECT 'Occupations', COUNT(*) FROM reference_data.occupations;
```

### 3.2 Fineract Reference Codes

```sql
-- ==========================================
-- Fineract Code Values Seeding
-- ==========================================

-- Gender Codes
INSERT INTO m_code_value (code_id, code_value, order_position, is_active)
SELECT id, 'Male', 1, true FROM m_code WHERE code_name = 'Gender'
UNION ALL
SELECT id, 'Female', 2, true FROM m_code WHERE code_name = 'Gender'
UNION ALL
SELECT id, 'Other', 3, true FROM m_code WHERE code_name = 'Gender'
ON CONFLICT DO NOTHING;

-- Client Status
INSERT INTO m_code_value (code_id, code_value, order_position, is_active)
SELECT id, 'Active', 1, true FROM m_code WHERE code_name = 'CustomerStatus'
UNION ALL
SELECT id, 'Inactive', 2, true FROM m_code WHERE code_name = 'CustomerStatus'
UNION ALL
SELECT id, 'Closed', 3, true FROM m_code WHERE code_name = 'CustomerStatus'
ON CONFLICT DO NOTHING;

-- Address Types
INSERT INTO m_code_value (code_id, code_value, order_position, is_active)
SELECT id, 'Present Address', 1, true FROM m_code WHERE code_name = 'AddressType'
UNION ALL
SELECT id, 'Permanent Address', 2, true FROM m_code WHERE code_name = 'AddressType'
UNION ALL
SELECT id, 'Office Address', 3, true FROM m_code WHERE code_name = 'AddressType'
ON CONFLICT DO NOTHING;
```

---

## 4. Test User Seeding

### 4.1 Staff and Users

**File:** `scripts/seeding/02-test-users.sql`

```sql
-- ==========================================
-- Test Users and Staff Seeding
-- Password: password (BCrypt encoded)
-- ==========================================

-- Test office
INSERT INTO m_office (external_id, name, name_decoded, parent_id, opening_date, hierarchy)
VALUES ('HQ001', 'Head Office', 'Head Office', NULL, '2024-01-01', '.');

-- Test staff
INSERT INTO m_staff (office_id, firstname, lastname, display_name, mobile_no, is_loan_officer, is_active, joining_date)
VALUES 
(1, 'Abdul', 'Rahman', 'Abdul Rahman', '01711111111', true, true, '2024-01-01'),
(1, 'Fatima', 'Khatun', 'Fatima Khatun', '01722222222', true, true, '2024-01-01'),
(1, 'Mohammad', 'Ali', 'Mohammad Ali', '01733333333', false, true, '2024-01-01'),
(1, 'Nasrin', 'Akter', 'Nasrin Akter', '01744444444', true, true, '2024-01-01'),
(1, 'System', 'Administrator', 'System Administrator', '01755555555', false, true, '2024-01-01');

-- Test app users (password: 'password')
-- BCrypt hash for 'password': $2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEsKYGs5xje6q3dqPa

INSERT INTO m_appuser (office_id, staff_id, username, firstname, lastname, password, email, first_time_login_remaining, is_deleted)
VALUES
(1, 1, 'abdul.rahman', 'Abdul', 'Rahman', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEsKYGs5xje6q3dqPa', 'abdul.rahman@ulms.test', false, false),
(1, 2, 'fatima.khatun', 'Fatima', 'Khatun', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEsKYGs5xje6q3dqPa', 'fatima.khatun@ulms.test', false, false),
(1, 3, 'mohammad.ali', 'Mohammad', 'Ali', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEsKYGs5xje6q3dqPa', 'mohammad.ali@ulms.test', false, false),
(1, 4, 'nasrin.akter', 'Nasrin', 'Akter', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEsKYGs5xje6q3dqPa', 'nasrin.akter@ulms.test', false, false),
(1, 5, 'admin', 'System', 'Administrator', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEsKYGs5xje6q3dqPa', 'admin@ulms.test', false, false);

-- Assign all permissions to admin
INSERT INTO m_role (name, description)
VALUES ('Super User', 'Full system access');

INSERT INTO m_role_permission (role_id, permission_id)
SELECT 1, id FROM m_permission;

INSERT INTO m_appuser_role (app_user_id, role_id)
VALUES (5, 1);
```

---

## 5. Sample Client Data

### 5.1 Individual Clients

**File:** `scripts/seeding/03-sample-clients.sql`

```sql
-- ==========================================
-- Sample Client Data Generation
-- ==========================================

-- Function to generate random NID (17 digits for new NID)
CREATE OR REPLACE FUNCTION generate_nid() RETURNS VARCHAR(20) AS $$
BEGIN
    RETURN LPAD(FLOOR(RANDOM() * 99999999999999999)::TEXT, 17, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate random mobile number
CREATE OR REPLACE FUNCTION generate_mobile() RETURNS VARCHAR(20) AS $$
BEGIN
    RETURN '017' || LPAD(FLOOR(RANDOM() * 99999999)::TEXT, 8, '0');
END;
$$ LANGUAGE plpgsql;

-- Sample client data
INSERT INTO m_client (
    office_id, 
    staff_id,
    account_no,
    external_id,
    status_enum,
    activation_date,
    firstname,
    lastname,
    display_name,
    mobile_no,
    gender_cv_id,
    date_of_birth,
    submittedon_date
)
SELECT 
    1 as office_id,
    (SELECT id FROM m_staff WHERE is_loan_officer = true ORDER BY RANDOM() LIMIT 1) as staff_id,
    'C' || LPAD((ROW_NUMBER() OVER ())::TEXT, 6, '0') as account_no,
    generate_nid() as external_id,
    300 as status_enum, -- ACTIVE
    '2024-01-01' as activation_date,
    CASE (ROW_NUMBER() OVER ()) % 5
        WHEN 0 THEN 'Mohammad'
        WHEN 1 THEN 'Abdul'
        WHEN 2 THEN 'Abdullah'
        WHEN 3 THEN 'Rahim'
        ELSE 'Karim'
    END as firstname,
    CASE (ROW_NUMBER() OVER ()) % 5
        WHEN 0 THEN 'Hossain'
        WHEN 1 THEN 'Rahman'
        WHEN 2 THEN 'Islam'
        WHEN 3 THEN 'Khan'
        ELSE 'Ahmed'
    END as lastname,
    NULL as display_name,
    generate_mobile() as mobile_no,
    CASE (ROW_NUMBER() OVER ()) % 2 
        WHEN 0 THEN 1  -- Male
        ELSE 2         -- Female
    END as gender_cv_id,
    ('1970-01-01'::DATE + (FLOOR(RANDOM() * 15000))::INTEGER) as date_of_birth,
    CURRENT_DATE as submittedon_date
FROM generate_series(1, 100) AS t;

-- Update display names
UPDATE m_client SET display_name = firstname || ' ' || lastname WHERE display_name IS NULL;

-- Add client identifiers (NID)
INSERT INTO m_client_identifier (
    client_id,
    document_type_id,
    document_key,
    description,
    status
)
SELECT 
    id as client_id,
    1 as document_type_id, -- NID
    generate_nid() as document_key,
    'National ID' as description,
    'ACTIVE' as status
FROM m_client
WHERE status_enum = 300;

-- Add sample addresses
INSERT INTO m_client_address (
    client_id,
    address_type_id,
    address_line_1,
    address_line_2,
    city,
    county_district,
    state_province_id,
    postal_code
)
SELECT 
    c.id as client_id,
    1 as address_type_id, -- Present Address
    'House ' || FLOOR(RANDOM() * 100 + 1)::TEXT as address_line_1,
    'Road ' || FLOOR(RANDOM() * 20 + 1)::TEXT as address_line_2,
    'Dhaka' as city,
    'Mohammadpur' as county_district,
    (SELECT id FROM reference_data.districts WHERE code = '26' LIMIT 1) as state_province_id,
    '1207' as postal_code
FROM m_client c
LIMIT 50;
```

---

## 6. Sample Loan Data

### 6.1 Loan Products

```sql
-- ==========================================
-- Sample Loan Products
-- ==========================================

-- Personal Loan
INSERT INTO m_product_loan (
    short_name, description, fund_id, currency_code,
    principal_amount, min_principal_amount, max_principal_amount,
    nominal_interest_rate_per_period, interest_period_frequency_enum,
    number_of_repayments, repay_every, amortization_method_enum,
    interest_method_enum, accounting_rule, is_active
)
VALUES (
    'PL-SMALL', 'Personal Loan - Small', 1, 'BDT',
    100000, 50000, 500000,
    12.00, 2, -- MONTHLY
    12, 1, 1, -- EQUAL_INSTALLMENTS
    0, 1, true -- DECLINING_BALANCE, ACCRUAL_PERIODIC
);

-- SME Loan
INSERT INTO m_product_loan (
    short_name, description, fund_id, currency_code,
    principal_amount, min_principal_amount, max_principal_amount,
    nominal_interest_rate_per_period, interest_period_frequency_enum,
    number_of_repayments, repay_every, amortization_method_enum,
    interest_method_enum, accounting_rule, is_active
)
VALUES (
    'SME-MEDIUM', 'SME Loan - Medium', 1, 'BDT',
    500000, 200000, 2000000,
    10.00, 2, -- MONTHLY
    24, 1, 1, -- EQUAL_INSTALLMENTS
    0, 1, true -- DECLINING_BALANCE, ACCRUAL_PERIODIC
);
```

### 6.2 Sample Loan Accounts

```sql
-- ==========================================
-- Sample Loan Accounts
-- ==========================================

INSERT INTO m_loan (
    account_no,
    external_id,
    client_id,
    product_id,
    fund_id,
    loan_officer_id,
    loan_status_id,
    currency_code,
    currency_digits,
    principal_amount_proposed,
    principal_amount,
    approved_principal,
    annual_nominal_interest_rate,
    interest_method_enum,
    interest_calculated_in_period_enum,
    term_frequency,
    term_period_frequency_enum,
    number_of_repayments,
    repayment_every,
    repayment_period_frequency_enum,
    amortization_method_enum,
    expected_disbursedon_date,
    disbursedon_date,
    expected_firstrepaymenton_date,
    interest_charged_from_date,
    submittedon_date,
    approvedon_date,
    disbursedon_userid,
    created_on_date
)
SELECT 
    'L' || LPAD((ROW_NUMBER() OVER ())::TEXT, 6, '0') as account_no,
    generate_nid() as external_id,
    c.id as client_id,
    (ARRAY[1, 2])[FLOOR(RANDOM() * 2 + 1)::INT] as product_id,
    1 as fund_id,
    c.staff_id as loan_officer_id,
    300 as loan_status_id, -- ACTIVE
    'BDT' as currency_code,
    2 as currency_digits,
    (FLOOR(RANDOM() * 450000 + 50000)::NUMERIC / 1000)::INT * 1000 as principal_amount_proposed,
    0 as principal_amount, -- Will be set after disbursement
    0 as approved_principal,
    (FLOOR(RANDOM() * 5 + 10)::NUMERIC) as annual_nominal_interest_rate,
    0 as interest_method_enum, -- DECLINING_BALANCE
    1 as interest_calculated_in_period_enum,
    12 as term_frequency,
    2 as term_period_frequency_enum, -- MONTHS
    12 as number_of_repayments,
    1 as repayment_every,
    2 as repayment_period_frequency_enum, -- MONTHS
    1 as amortization_method_enum, -- EQUAL_INSTALLMENTS
    CURRENT_DATE - INTERVAL '30 days' as expected_disbursedon_date,
    CURRENT_DATE - INTERVAL '30 days' as disbursedon_date,
    CURRENT_DATE - INTERVAL '15 days' as expected_firstrepaymenton_date,
    CURRENT_DATE - INTERVAL '15 days' as interest_charged_from_date,
    CURRENT_DATE - INTERVAL '45 days' as submittedon_date,
    CURRENT_DATE - INTERVAL '30 days' as approvedon_date,
    1 as disbursedon_userid,
    CURRENT_DATE - INTERVAL '45 days' as created_on_date
FROM m_client c
WHERE c.status_enum = 300
LIMIT 50;

-- Update principal amounts
UPDATE m_loan 
SET principal_amount = principal_amount_proposed,
    approved_principal = principal_amount_proposed
WHERE principal_amount = 0;

-- Add repayment schedules
INSERT INTO m_loan_repayment_schedule (
    loan_id,
    fromdate,
    due_date,
    installment,
    principal_amount,
    interest_amount,
    fee_charges_amount,
    penalty_charges_amount
)
SELECT 
    l.id as loan_id,
    CASE 
        WHEN i = 1 THEN l.disbursedon_date
        ELSE l.disbursedon_date + ((i-1) || ' months')::INTERVAL
    END as fromdate,
    l.disbursedon_date + (i || ' months')::INTERVAL as due_date,
    i as installment,
    ROUND(l.principal_amount / l.number_of_repayments, 2) as principal_amount,
    ROUND((l.principal_amount * l.annual_nominal_interest_rate / 100 / 12), 2) as interest_amount,
    0 as fee_charges_amount,
    0 as penalty_charges_amount
FROM m_loan l
CROSS JOIN generate_series(1, 12) AS i
WHERE l.loan_status_id = 300;
```

---

## 7. Test Data Scenarios

### 7.1 Loan Classification Scenarios

```sql
-- Create loans in different classification stages for testing

-- SMA (61-90 DPD) - 5 loans
UPDATE m_loan SET 
    loan_status_id = 600, -- IN_ARREARS
    arrears_tolerance_amount = 0
WHERE id IN (SELECT id FROM m_loan WHERE loan_status_id = 300 LIMIT 5);

-- SS (91-180 DPD) - 3 loans
UPDATE m_loan SET 
    loan_status_id = 600,
    arrears_tolerance_amount = 0
WHERE id IN (SELECT id FROM m_loan WHERE loan_status_id = 300 LIMIT 3 OFFSET 5);

-- Add overdue amounts
INSERT INTO m_loan_arrears_aging (
    loan_id,
    principal_overdue_derived,
    interest_overdue_derived,
    total_overdue_derived,
    overdue_since_date_derived
)
SELECT 
    l.id,
    l.principal_amount * 0.1, -- 10% overdue
    l.principal_amount * 0.12 * 0.1, -- Interest on overdue
    l.principal_amount * 0.1 * 1.12,
    CURRENT_DATE - INTERVAL '75 days'
FROM m_loan l
WHERE l.loan_status_id = 600
LIMIT 5;
```

---

## 8. Data Anonymization

### 8.1 Anonymization Script

```sql
-- ==========================================
-- Production Data Anonymization
-- Use when copying production to staging
-- ==========================================

-- Anonymize client names
UPDATE m_client SET
    firstname = 'Client' || id,
    lastname = 'Test' || id,
    display_name = 'Client Test ' || id,
    mobile_no = '017' || LPAD(id::TEXT, 8, '0');

-- Anonymize NIDs
UPDATE m_client_identifier SET
    document_key = LPAD(id::TEXT, 17, '0');

-- Anonymize addresses
UPDATE m_client_address SET
    address_line_1 = 'House ' || id,
    address_line_2 = 'Road ' || (id % 20 + 1);

-- Clear sensitive notes
UPDATE m_note SET note = 'Anonymized' WHERE id > 0;
```

---

## 9. Execution Instructions

### 9.1 Execute All Seeds

```bash
#!/bin/bash
# Execute all seeding scripts

DB_NAME="ulms_test"
DB_USER="ulms_admin"

echo "Seeding reference data..."
psql -U $DB_USER -d $DB_NAME -f scripts/seeding/01-reference-data.sql

echo "Seeding test users..."
psql -U $DB_USER -d $DB_NAME -f scripts/seeding/02-test-users.sql

echo "Seeding sample clients..."
psql -U $DB_USER -d $DB_NAME -f scripts/seeding/03-sample-clients.sql

echo "Seeding sample loans..."
psql -U $DB_USER -d $DB_NAME -f scripts/seeding/04-sample-loans.sql

echo "Seeding complete!"
```

### 9.2 Reset Test Data

```sql
-- Truncate and reset all test data
TRUNCATE TABLE m_loan_transaction CASCADE;
TRUNCATE TABLE m_loan_repayment_schedule CASCADE;
TRUNCATE TABLE m_loan_charge CASCADE;
TRUNCATE TABLE m_loan CASCADE;
TRUNCATE TABLE m_client_identifier CASCADE;
TRUNCATE TABLE m_client_address CASCADE;
TRUNCATE TABLE m_client CASCADE;
TRUNCATE TABLE m_appuser CASCADE;
TRUNCATE TABLE m_staff CASCADE;
TRUNCATE TABLE m_office CASCADE;
```

---

## 10. Related Documents

| Document ID | Document Name | Description |
|-------------|---------------|-------------|
| 2.2.2 | [Database Initialization Scripts]([DB]_Database_Initialization_Scripts_v1.0.md) | Multi-tenant setup |
| 2.2.3 | [Fineract Database Setup]([DB]_Fineract_Database_Setup_v1.0.md) | Core schema |
| 2.3.3 | [Test Data Management Strategy](../2.3_Testing_Infrastructure/[TEST]_Test_Data_Management_Strategy_v1.0.md) | Test data approach |

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
*Internal Use Only - ULMS Development Team*

# Entity Relationship Diagrams (ERD)
## Unisoft Loan Management System (ULMS) v2.0

---

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ULMS-ARCH-1.3.2 |
| **Document Title** | Entity Relationship Diagrams (ERD) |
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
| 1.0 | 2026-02-05 | Lead Dev | Initial Entity Relationship Diagrams |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [ERD Notation Guide](#2-erd-notation-guide)
3. [Master ERD Overview](#3-master-erd-overview)
4. [Customer Management ERD](#4-customer-management-erd)
5. [Loan Origination ERD](#5-loan-origination-erd)
6. [Credit Assessment ERD](#6-credit-assessment-erd)
7. [Workflow & Approval ERD](#7-workflow--approval-erd)
8. [BRPD Compliance ERD](#8-brpd-compliance-erd)
9. [CIB Integration ERD](#9-cib-integration-erd)
10. [Document Management ERD](#10-document-management-erd)
11. [Audit & Reporting ERD](#11-audit--reporting-erd)
12. [Entity Relationship Summary](#12-entity-relationship-summary)

---

## 1. Introduction

### 1.1 Purpose

This document provides comprehensive Entity Relationship Diagrams (ERDs) for the ULMS v2.0 database schema. These diagrams serve as the visual reference for database design, showing entities, attributes, and relationships across all functional domains.

### 1.2 Scope

| Domain | Tables | ERD Section |
|--------|--------|-------------|
| Customer Management | 8 | Section 4 |
| Loan Origination | 15 | Section 5 |
| Credit Assessment | 5 | Section 6 |
| Workflow & Approval | 6 | Section 7 |
| BRPD Compliance | 5 | Section 8 |
| CIB Integration | 4 | Section 9 |
| Document Management | 3 | Section 10 |
| Audit & Reporting | 4 | Section 11 |

### 1.3 Schema Context

All ERDs represent tables within the per-tenant schema (`bank_XXX`). The `public` schema tables (tenants, users, configuration) are documented in the Database Schema Design Document (1.3.1).

---

## 2. ERD Notation Guide

### 2.1 Mermaid Diagram Notation

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         ERD NOTATION GUIDE                                           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   RELATIONSHIP TYPES:                                                                │
│   ────────────────────                                                               │
│   ||──||  One-to-One (1:1)                                                          │
│   ||──o{  One-to-Many (1:N)                                                         │
│   }o──o{  Many-to-Many (M:N)                                                        │
│   ||──o|  One-to-Zero-or-One (1:0..1)                                               │
│                                                                                      │
│   CARDINALITY SYMBOLS:                                                               │
│   ────────────────────                                                               │
│   ||  Exactly one (mandatory)                                                        │
│   o|  Zero or one (optional)                                                         │
│   }|  One or more (mandatory)                                                        │
│   o{  Zero or more (optional)                                                        │
│                                                                                      │
│   ENTITY ATTRIBUTES:                                                                 │
│   ────────────────────                                                               │
│   PK  Primary Key                                                                    │
│   FK  Foreign Key                                                                    │
│   UK  Unique Key                                                                     │
│   *   Required/NOT NULL                                                              │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Color Coding

| Color | Domain |
|-------|--------|
| Blue | Customer Management |
| Green | Loan Management |
| Orange | Credit Assessment |
| Purple | Workflow |
| Red | Compliance |
| Teal | Integration |

---

## 3. Master ERD Overview

### 3.1 High-Level Domain Relationships

```mermaid
erDiagram
    CUSTOMER ||--o{ LOAN_APPLICATION : "applies for"
    CUSTOMER ||--o{ CIB_INQUIRY : "has"
    CUSTOMER ||--o{ CUSTOMER_DOCUMENT : "provides"

    LOAN_APPLICATION ||--|| LOAN : "becomes"
    LOAN_APPLICATION ||--o{ WORKFLOW_TASK : "triggers"
    LOAN_APPLICATION ||--o{ APPROVAL_LOG : "requires"

    LOAN ||--o{ LOAN_TRANSACTION : "has"
    LOAN ||--o{ REPAYMENT_SCHEDULE : "has"
    LOAN ||--o{ LOAN_CLASSIFICATION : "classified by"
    LOAN ||--o{ LOAN_COLLATERAL : "secured by"

    LOAN ||--o{ LOAN_PROVISION : "provisions"
    LOAN_CLASSIFICATION ||--o{ REGULATORY_REPORT : "feeds"

    CIB_INQUIRY ||--o{ CIB_FACILITY : "contains"

    AUDIT_LOG ||--|| ALL_ENTITIES : "tracks"
```

### 3.2 Core Entity Summary

| Entity | Primary Key | Key Relationships | Estimated Volume |
|--------|-------------|-------------------|------------------|
| m_client | id | Loans, CIB, Documents | 500K - 5M |
| m_loan | id | Customer, Transactions, Classification | 100K - 1M |
| m_loan_transaction | id | Loan | 5M - 50M |
| cib_inquiry | id | Customer, Loan Application | 200K - 2M |
| loan_classification_history | id | Loan | 500K - 5M |
| audit_log | id | All entities | 10M - 100M |

---

## 4. Customer Management ERD

### 4.1 Customer Domain ERD

```mermaid
erDiagram
    M_CLIENT ||--o{ CUSTOMER_ADDRESS : "has"
    M_CLIENT ||--o{ CUSTOMER_EMPLOYMENT : "has"
    M_CLIENT ||--o{ CUSTOMER_DOCUMENT : "provides"
    M_CLIENT ||--o{ CUSTOMER_KYC_VERIFICATION : "verified by"
    M_CLIENT ||--o{ NID_VERIFICATION_LOG : "verified via"
    M_CLIENT ||--o{ M_LOAN : "applies for"
    M_CLIENT ||--o{ CIB_INQUIRY : "inquired for"

    M_CLIENT {
        bigserial id PK
        varchar external_id UK
        varchar account_no UK
        varchar nid_number UK "ENCRYPTED"
        boolean nid_verified
        timestamp nid_verified_at
        varchar firstname
        varchar lastname
        varchar fullname_bn
        varchar display_name
        varchar father_name
        varchar mother_name
        varchar spouse_name
        date date_of_birth
        varchar gender
        varchar marital_status
        varchar mobile_primary
        varchar mobile_secondary
        varchar email
        varchar status
        date activation_date
        timestamp created_at
        timestamp updated_at
        varchar created_by
        varchar updated_by
        integer version
    }

    CUSTOMER_ADDRESS {
        bigserial id PK
        bigint client_id FK
        varchar address_type "PRESENT/PERMANENT"
        varchar address_line1
        varchar address_line2
        varchar district
        varchar upazila
        varchar postal_code
        varchar country
        boolean is_verified
        timestamp created_at
        timestamp updated_at
    }

    CUSTOMER_EMPLOYMENT {
        bigserial id PK
        bigint client_id FK
        varchar employer_name
        varchar employer_address
        varchar designation
        varchar department
        decimal monthly_income
        varchar employment_type
        date employment_start_date
        boolean is_current
        timestamp created_at
        timestamp updated_at
    }

    CUSTOMER_DOCUMENT {
        bigserial id PK
        bigint client_id FK
        varchar document_type
        varchar document_name
        varchar file_path
        varchar mime_type
        bigint file_size
        varchar checksum
        boolean is_verified
        varchar verified_by
        timestamp verified_at
        timestamp created_at
    }

    CUSTOMER_KYC_VERIFICATION {
        bigserial id PK
        bigint client_id FK
        varchar verification_type
        varchar verification_status
        varchar verified_by
        timestamp verification_date
        jsonb verification_data
        varchar remarks
    }

    NID_VERIFICATION_LOG {
        bigserial id PK
        bigint client_id FK
        varchar nid_number "ENCRYPTED"
        varchar verification_method
        varchar verification_status
        jsonb nidw_response
        boolean photo_matched
        timestamp requested_at
        timestamp responded_at
        varchar requested_by
    }
```

### 4.2 Customer Entity Descriptions

| Entity | Description | Key Fields |
|--------|-------------|------------|
| **m_client** | Customer master data | NID (encrypted), personal info, contact |
| **customer_address** | Present and permanent addresses | Address type, district, upazila |
| **customer_employment** | Employment and income details | Employer, income (encrypted), designation |
| **customer_document** | KYC document metadata | Document type, file path, verification |
| **customer_kyc_verification** | KYC verification audit | Verification type, status, date |
| **nid_verification_log** | NID verification via NIDW API | NID, response, photo match result |

### 4.3 Customer Relationships

| Relationship | Type | Description |
|--------------|------|-------------|
| m_client → customer_address | 1:N | Customer has multiple addresses |
| m_client → customer_employment | 1:N | Customer employment history |
| m_client → customer_document | 1:N | Customer KYC documents |
| m_client → m_loan | 1:N | Customer loan applications |
| m_client → cib_inquiry | 1:N | CIB inquiries for customer |

---

## 5. Loan Origination ERD

### 5.1 Loan Domain ERD

```mermaid
erDiagram
    M_CLIENT ||--o{ M_LOAN : "applies for"
    REF_LOAN_PRODUCT ||--o{ M_LOAN : "defines"
    REF_BRANCH ||--o{ M_LOAN : "originates"

    M_LOAN ||--o{ M_LOAN_REPAYMENT_SCHEDULE : "has"
    M_LOAN ||--o{ M_LOAN_TRANSACTION : "records"
    M_LOAN ||--o{ LOAN_COLLATERAL : "secured by"
    M_LOAN ||--o{ LOAN_GUARANTOR : "guaranteed by"
    M_LOAN ||--o{ LOAN_CHARGE : "has"
    M_LOAN ||--o{ LOAN_DISBURSEMENT : "disbursed via"
    M_LOAN ||--o{ LOAN_MODIFICATION_HISTORY : "modified by"
    M_LOAN ||--o{ LOAN_CLASSIFICATION_HISTORY : "classified as"

    M_LOAN {
        bigserial id PK
        varchar account_no UK
        varchar external_id
        bigint client_id FK
        bigint product_id FK
        varchar product_code
        varchar branch_id FK
        varchar branch_name
        decimal principal_amount
        decimal approved_principal
        decimal principal_disbursed
        decimal principal_outstanding
        decimal interest_rate
        varchar interest_type
        integer number_of_repayments
        integer repayment_every
        varchar repayment_frequency
        date submitted_on_date
        date approved_on_date
        date expected_disbursement_date
        date actual_disbursement_date
        date expected_maturity_date
        date closed_on_date
        varchar loan_status
        varchar classification
        integer dpd
        date last_classification_date
        varchar workflow_process_id
        integer current_approval_level
        boolean is_rescheduled
        boolean is_restructured
        boolean is_written_off
        timestamp created_at
        timestamp updated_at
        varchar created_by
        varchar updated_by
        integer version
    }

    REF_LOAN_PRODUCT {
        serial id PK
        varchar product_code UK
        varchar product_name
        varchar product_name_bn
        varchar product_type
        decimal min_principal
        decimal max_principal
        decimal min_interest_rate
        decimal max_interest_rate
        integer min_term_months
        integer max_term_months
        varchar interest_method
        varchar amortization_type
        varchar repayment_frequency
        boolean is_active
        jsonb charges_config
        timestamp created_at
        timestamp updated_at
    }

    M_LOAN_REPAYMENT_SCHEDULE {
        bigserial id PK
        bigint loan_id FK
        integer installment_number
        date due_date
        decimal principal_due
        decimal interest_due
        decimal fee_due
        decimal penalty_due
        decimal total_due
        decimal principal_paid
        decimal interest_paid
        decimal fee_paid
        decimal penalty_paid
        decimal total_paid
        boolean is_paid
        date paid_date
        timestamp created_at
    }

    M_LOAN_TRANSACTION {
        bigserial id PK
        bigint loan_id FK
        varchar transaction_type
        varchar transaction_ref
        date transaction_date
        decimal amount
        decimal principal_portion
        decimal interest_portion
        decimal fee_portion
        decimal penalty_portion
        decimal outstanding_balance
        varchar payment_mode
        varchar remarks
        boolean is_reversed
        bigint reversed_by_txn_id
        timestamp created_at
        varchar created_by
    }

    LOAN_COLLATERAL {
        bigserial id PK
        bigint loan_id FK
        varchar collateral_type
        varchar description
        decimal market_value
        decimal forced_sale_value
        decimal coverage_percentage
        varchar lien_status
        varchar document_reference
        date valuation_date
        varchar valued_by
        timestamp created_at
        timestamp updated_at
    }

    LOAN_GUARANTOR {
        bigserial id PK
        bigint loan_id FK
        varchar guarantor_type
        varchar nid_number "ENCRYPTED"
        varchar full_name
        varchar relationship
        varchar mobile_number
        varchar address
        decimal guarantee_amount
        boolean is_verified
        timestamp created_at
        timestamp updated_at
    }

    LOAN_CHARGE {
        bigserial id PK
        bigint loan_id FK
        varchar charge_type
        varchar charge_name
        decimal charge_amount
        varchar calculation_type
        date charge_date
        date due_date
        boolean is_paid
        date paid_date
        decimal paid_amount
        boolean is_waived
        varchar waived_by
        timestamp created_at
    }

    LOAN_DISBURSEMENT {
        bigserial id PK
        bigint loan_id FK
        varchar disbursement_ref
        date disbursement_date
        decimal amount
        varchar payment_mode
        varchar account_number
        varchar bank_name
        varchar bank_branch
        varchar transaction_ref
        varchar status
        varchar remarks
        timestamp created_at
        varchar created_by
    }

    LOAN_MODIFICATION_HISTORY {
        bigserial id PK
        bigint loan_id FK
        varchar modification_type
        date modification_date
        jsonb old_terms
        jsonb new_terms
        varchar reason
        varchar approved_by
        timestamp created_at
    }

    REF_BRANCH {
        serial id PK
        varchar branch_code UK
        varchar branch_name
        varchar branch_name_bn
        varchar branch_type
        varchar region
        varchar district
        varchar address
        varchar phone
        varchar email
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
```

### 5.2 Loan Entity Descriptions

| Entity | Description | Key Fields |
|--------|-------------|------------|
| **m_loan** | Loan account master | Account no, principal, status, classification |
| **ref_loan_product** | Loan product configuration | Product code, interest rates, terms |
| **m_loan_repayment_schedule** | EMI schedule | Due date, amounts, payment status |
| **m_loan_transaction** | Payment transactions | Transaction type, amounts, date |
| **loan_collateral** | Collateral/security | Type, valuation, lien status |
| **loan_guarantor** | Guarantor information | NID, relationship, guarantee amount |
| **loan_charge** | Fees and charges | Charge type, amount, payment status |
| **loan_disbursement** | Disbursement records | Amount, payment mode, status |
| **loan_modification_history** | Rescheduling/restructuring | Old terms, new terms, reason |

### 5.3 Loan Status State Machine

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         LOAN STATUS STATE MACHINE                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   ┌─────────┐   submit    ┌───────────┐   approve   ┌──────────┐                   │
│   │  DRAFT  │ ──────────▶ │ SUBMITTED │ ──────────▶ │ APPROVED │                   │
│   └─────────┘             └───────────┘             └──────────┘                   │
│                                 │                        │                          │
│                          reject │                        │ disburse                 │
│                                 ▼                        ▼                          │
│                           ┌──────────┐            ┌───────────┐                    │
│                           │ REJECTED │            │ DISBURSED │                    │
│                           └──────────┘            └───────────┘                    │
│                                                         │                          │
│                                                         │ activate                 │
│                                                         ▼                          │
│                                                    ┌─────────┐                     │
│                                                    │ ACTIVE  │                     │
│                                                    └─────────┘                     │
│                                                    │         │                      │
│                                          close     │         │ write_off           │
│                                                    ▼         ▼                      │
│                                             ┌────────┐ ┌────────────┐              │
│                                             │ CLOSED │ │ WRITTEN_OFF│              │
│                                             └────────┘ └────────────┘              │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Credit Assessment ERD

### 6.1 Credit Assessment Domain ERD

```mermaid
erDiagram
    M_CLIENT ||--o{ CIB_INQUIRY : "inquired for"
    M_LOAN ||--o| CIB_INQUIRY : "requires"
    CIB_INQUIRY ||--o{ CIB_FACILITY_DETAIL : "contains"

    M_CLIENT ||--o{ CREDIT_SCORE : "scored"
    M_CLIENT ||--o| CREDIT_LIMIT : "has"

    CIB_INQUIRY {
        bigserial id PK
        varchar inquiry_id UK
        bigint client_id FK
        bigint loan_application_id FK
        varchar nid_number "ENCRYPTED"
        varchar inquiry_type
        varchar purpose
        integer cib_score
        varchar risk_grade
        integer total_facilities
        decimal total_outstanding
        decimal total_monthly_emi
        varchar worst_classification
        integer max_dpd
        jsonb request_json
        jsonb response_json
        varchar status
        text error_message
        timestamp requested_at
        timestamp responded_at
        timestamp cached_until
        varchar requested_by
    }

    CIB_FACILITY_DETAIL {
        bigserial id PK
        bigint cib_inquiry_id FK
        varchar facility_id
        varchar bank_code
        varchar bank_name
        varchar facility_type
        decimal sanctioned_amount
        decimal outstanding_amount
        decimal overdue_amount
        varchar classification
        integer dpd
        date last_payment_date
        timestamp created_at
    }

    CREDIT_SCORE {
        bigserial id PK
        bigint client_id FK
        bigint loan_application_id FK
        varchar score_model
        integer score_value
        varchar risk_category
        jsonb score_factors
        jsonb score_breakdown
        timestamp scored_at
        varchar scored_by
    }

    CREDIT_LIMIT {
        bigserial id PK
        bigint client_id FK
        varchar limit_type
        decimal approved_limit
        decimal utilized_limit
        decimal available_limit
        date effective_from
        date effective_to
        varchar approved_by
        timestamp created_at
        timestamp updated_at
    }
```

### 6.2 Credit Assessment Entity Descriptions

| Entity | Description | Key Fields |
|--------|-------------|------------|
| **cib_inquiry** | CIB inquiry and response cache | Score, facilities, classification |
| **cib_facility_detail** | Individual facilities from CIB | Bank, amount, classification |
| **credit_score** | Credit scoring results | Score value, risk category, factors |
| **credit_limit** | Customer credit limits | Approved limit, utilization |

---

## 7. Workflow & Approval ERD

### 7.1 Workflow Domain ERD

```mermaid
erDiagram
    M_LOAN ||--o{ WORKFLOW_TASK : "has"
    M_LOAN ||--o{ WORKFLOW_HISTORY : "tracked by"
    M_LOAN ||--o{ APPROVAL_LOG : "approved via"

    REF_APPROVAL_MATRIX ||--o{ WORKFLOW_TASK : "configures"
    USERS ||--o{ WORKFLOW_TASK : "assigned to"
    USERS ||--o{ APPROVAL_LOG : "performed by"

    WORKFLOW_TASK {
        bigserial id PK
        varchar task_id UK
        bigint loan_id FK
        varchar process_instance_id
        varchar task_type
        varchar task_name
        integer approval_level
        varchar assignee_id FK
        varchar assignee_role
        varchar task_status
        date sla_due_date
        boolean is_overdue
        jsonb task_data
        timestamp created_at
        timestamp completed_at
        varchar completed_by
    }

    WORKFLOW_HISTORY {
        bigserial id PK
        bigint loan_id FK
        varchar process_instance_id
        varchar activity_id
        varchar activity_name
        varchar activity_type
        varchar from_status
        varchar to_status
        varchar performed_by
        timestamp performed_at
        varchar remarks
        jsonb activity_data
    }

    APPROVAL_LOG {
        bigserial id PK
        bigint loan_id FK
        bigint task_id FK
        integer approval_level
        varchar approver_id FK
        varchar approver_name
        varchar approver_role
        varchar action
        varchar decision
        text remarks
        decimal approved_amount
        jsonb conditions
        timestamp action_date
    }

    REF_APPROVAL_MATRIX {
        serial id PK
        varchar product_type
        integer approval_level
        decimal min_amount
        decimal max_amount
        varchar required_role
        integer sla_hours
        boolean is_parallel
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    DELEGATION_LOG {
        bigserial id PK
        bigint task_id FK
        varchar from_user_id
        varchar to_user_id
        varchar delegation_type
        date delegation_start
        date delegation_end
        varchar reason
        boolean is_active
        timestamp created_at
    }

    SLA_BREACH_LOG {
        bigserial id PK
        bigint task_id FK
        bigint loan_id FK
        integer approval_level
        timestamp sla_due_at
        timestamp breached_at
        integer breach_hours
        varchar escalated_to
        boolean is_resolved
        timestamp resolved_at
    }
```

### 7.2 Workflow Entity Descriptions

| Entity | Description | Key Fields |
|--------|-------------|------------|
| **workflow_task** | Active approval tasks | Task ID, assignee, SLA, status |
| **workflow_history** | Completed workflow activities | Activity, status change, performer |
| **approval_log** | Approval decision audit | Level, approver, decision, remarks |
| **ref_approval_matrix** | Approval authority configuration | Level, amount limits, roles |
| **delegation_log** | Task delegation records | From/to user, dates |
| **sla_breach_log** | SLA breach tracking | Breach time, escalation |

### 7.3 Approval Level Configuration

| Level | Role | Amount Range (BDT) | SLA Hours |
|-------|------|-------------------|-----------|
| L1 | Branch Manager | 0 - 500,000 | 4 |
| L2 | Regional Manager | 500,001 - 1,000,000 | 8 |
| L3 | Credit Head | 1,000,001 - 5,000,000 | 12 |
| L4 | Risk Committee | 5,000,001 - 10,000,000 | 24 |
| L5 | DMD | 10,000,001 - 50,000,000 | 48 |
| L6 | MD | 50,000,001 - 100,000,000 | 72 |
| L7 | Board/BOCC | > 100,000,000 | 168 |

---

## 8. BRPD Compliance ERD

### 8.1 BRPD Compliance Domain ERD

```mermaid
erDiagram
    M_LOAN ||--o{ LOAN_CLASSIFICATION_HISTORY : "classified"
    M_LOAN ||--o{ LOAN_PROVISION : "provisioned"
    M_LOAN ||--o| INTEREST_SUSPENSE : "suspended"

    LOAN_CLASSIFICATION_HISTORY ||--o| GL_JOURNAL_ENTRY : "posts to"
    LOAN_PROVISION ||--o| GL_JOURNAL_ENTRY : "posts to"

    LOAN_CLASSIFICATION_HISTORY {
        bigserial id PK
        bigint loan_id FK
        varchar previous_classification
        varchar new_classification
        date classification_date
        integer dpd
        decimal previous_provision_rate
        decimal new_provision_rate
        decimal provision_amount
        decimal interest_suspended
        bigint gl_journal_entry_id FK
        varchar classification_reason
        varchar classified_by
        timestamp created_at
    }

    LOAN_PROVISION {
        bigserial id PK
        bigint loan_id FK
        varchar classification
        decimal outstanding_principal
        decimal outstanding_interest
        decimal provision_rate
        decimal general_provision
        decimal specific_provision
        decimal total_provision
        date provision_date
        bigint gl_journal_entry_id FK
        timestamp created_at
    }

    INTEREST_SUSPENSE {
        bigserial id PK
        bigint loan_id FK
        date suspense_date
        decimal interest_accrued
        decimal interest_suspended
        decimal interest_reversed
        varchar suspense_reason
        bigint gl_journal_entry_id FK
        timestamp created_at
    }

    GL_JOURNAL_ENTRY {
        bigserial id PK
        varchar journal_ref UK
        date journal_date
        varchar entry_type
        varchar description
        decimal debit_amount
        decimal credit_amount
        varchar debit_gl_account
        varchar credit_gl_account
        bigint loan_id FK
        varchar created_by
        boolean is_reversed
        timestamp created_at
    }

    REGULATORY_REPORT_LOG {
        bigserial id PK
        varchar report_type
        varchar report_period
        date report_date
        varchar file_path
        varchar file_checksum
        varchar status
        timestamp generated_at
        timestamp submitted_at
        varchar submitted_by
        text remarks
    }
```

### 8.2 BRPD Classification Rules

| Classification | DPD Range | Provision Rate | Interest Treatment |
|----------------|-----------|----------------|-------------------|
| **STD-0** | 0 days | 1% | Accrual |
| **STD-1** | 1-30 days | 1% | Accrual |
| **STD-2** | 31-60 days | 1% | Accrual |
| **SMA** | 61-90 days | 5% | Accrual |
| **SS** | 91-180 days | 20% | Suspense (NPA) |
| **DF** | 181-365 days | 50% | Suspense |
| **B/L** | >365 days | 100% | Suspense/Write-off |

### 8.3 Compliance Entity Descriptions

| Entity | Description | Key Fields |
|--------|-------------|------------|
| **loan_classification_history** | Classification change audit | Previous/new classification, DPD |
| **loan_provision** | Provision amount tracking | Rate, general/specific provision |
| **interest_suspense** | Suspended interest records | Accrued, suspended, reversed |
| **gl_journal_entry** | GL posting records | Debit/credit accounts, amounts |
| **regulatory_report_log** | Report generation audit | Type, period, submission status |

---

## 9. CIB Integration ERD

### 9.1 CIB Integration Domain ERD

```mermaid
erDiagram
    M_CLIENT ||--o{ CIB_INQUIRY : "inquired"
    CIB_INQUIRY ||--o{ CIB_FACILITY_DETAIL : "contains"
    CIB_INQUIRY ||--o{ CIB_INQUIRY_HISTORY : "tracked"

    M_LOAN ||--o{ CIB_SUBMISSION_LOG : "reported to"

    CIB_INQUIRY {
        bigserial id PK
        varchar inquiry_id UK
        bigint client_id FK
        bigint loan_application_id FK
        varchar nid_number "ENCRYPTED"
        varchar inquiry_type
        varchar purpose
        integer cib_score
        varchar risk_grade
        integer total_facilities
        decimal total_outstanding
        decimal total_monthly_emi
        varchar worst_classification
        integer max_dpd
        jsonb request_json
        jsonb response_json
        varchar status
        text error_message
        timestamp requested_at
        timestamp responded_at
        timestamp cached_until
        varchar requested_by
    }

    CIB_FACILITY_DETAIL {
        bigserial id PK
        bigint cib_inquiry_id FK
        varchar facility_id
        varchar institution_code
        varchar institution_name
        varchar facility_type
        varchar facility_status
        decimal sanctioned_limit
        decimal outstanding_amount
        decimal overdue_amount
        varchar classification
        integer dpd
        date start_date
        date maturity_date
        date last_payment_date
        timestamp created_at
    }

    CIB_INQUIRY_HISTORY {
        bigserial id PK
        bigint client_id FK
        date inquiry_month
        integer total_inquiries
        integer inquiries_by_self
        integer inquiries_by_others
        boolean credit_shopping_flag
        timestamp created_at
    }

    CIB_SUBMISSION_LOG {
        bigserial id PK
        varchar submission_id UK
        varchar submission_type
        date reporting_period
        varchar file_name
        varchar file_path
        integer total_records
        integer success_records
        integer failed_records
        varchar status
        timestamp generated_at
        timestamp submitted_at
        timestamp acknowledged_at
        jsonb error_details
    }

    CIB_BATCH_RECORD {
        bigserial id PK
        bigint submission_id FK
        bigint loan_id FK
        varchar record_type
        varchar record_data
        varchar status
        text error_message
        timestamp created_at
    }
```

### 9.2 CIB Entity Descriptions

| Entity | Description | Key Fields |
|--------|-------------|------------|
| **cib_inquiry** | Real-time CIB inquiry | Score, facilities, worst classification |
| **cib_facility_detail** | Existing facilities from CIB | Institution, amounts, status |
| **cib_inquiry_history** | Inquiry frequency tracking | Monthly count, credit shopping flag |
| **cib_submission_log** | Batch submission to BB | Period, file, record counts |
| **cib_batch_record** | Individual batch records | Loan data, submission status |

### 9.3 CIB Report Types

| Report Type | Frequency | Description |
|-------------|-----------|-------------|
| **Subject Data** | Monthly | Customer demographic data |
| **Contract Data** | Monthly | Loan facility details |
| **Payment Data** | Monthly | Payment history |
| **Classification** | Monthly | Loan classification status |

---

## 10. Document Management ERD

### 10.1 Document Management Domain ERD

```mermaid
erDiagram
    M_CLIENT ||--o{ CUSTOMER_DOCUMENT : "provides"
    M_LOAN ||--o{ LOAN_DOCUMENT : "requires"

    DOCUMENT_TYPE ||--o{ CUSTOMER_DOCUMENT : "categorizes"
    DOCUMENT_TYPE ||--o{ LOAN_DOCUMENT : "categorizes"

    CUSTOMER_DOCUMENT {
        bigserial id PK
        bigint client_id FK
        integer document_type_id FK
        varchar document_name
        varchar original_filename
        varchar storage_path
        varchar bucket_name
        varchar object_key
        varchar mime_type
        bigint file_size
        varchar checksum_md5
        varchar checksum_sha256
        boolean is_encrypted
        varchar encryption_key_id
        boolean is_verified
        varchar verified_by
        timestamp verified_at
        varchar verification_status
        text verification_remarks
        timestamp created_at
        varchar created_by
    }

    LOAN_DOCUMENT {
        bigserial id PK
        bigint loan_id FK
        integer document_type_id FK
        varchar document_name
        varchar original_filename
        varchar storage_path
        varchar bucket_name
        varchar object_key
        varchar mime_type
        bigint file_size
        varchar checksum_md5
        varchar checksum_sha256
        boolean is_encrypted
        varchar encryption_key_id
        varchar document_stage
        boolean is_mandatory
        boolean is_submitted
        timestamp submitted_at
        boolean is_verified
        varchar verified_by
        timestamp verified_at
        timestamp created_at
        varchar created_by
    }

    DOCUMENT_TYPE {
        serial id PK
        varchar type_code UK
        varchar type_name
        varchar type_name_bn
        varchar category
        varchar applicable_to
        boolean is_mandatory_kyc
        boolean is_mandatory_loan
        varchar allowed_extensions
        integer max_size_mb
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    DOCUMENT_VERSION_HISTORY {
        bigserial id PK
        bigint document_id FK
        varchar entity_type
        integer version_number
        varchar storage_path
        varchar change_reason
        varchar changed_by
        timestamp changed_at
    }
```

### 10.2 Document Types

| Type Code | Category | Mandatory KYC | Mandatory Loan |
|-----------|----------|---------------|----------------|
| NID_CARD | Identity | Yes | Yes |
| PASSPORT | Identity | No | No |
| PHOTO | Identity | Yes | Yes |
| INCOME_CERT | Financial | No | Yes |
| SALARY_SLIP | Financial | No | Yes (Salaried) |
| BANK_STMT | Financial | No | Yes |
| LAND_DOC | Collateral | No | Yes (Secured) |
| TRADE_LICENSE | Business | No | Yes (SME) |

---

## 11. Audit & Reporting ERD

### 11.1 Audit Domain ERD

```mermaid
erDiagram
    ALL_ENTITIES ||--o{ AUDIT_LOG : "tracked by"
    ALL_ENTITIES ||--o{ CHANGE_LOG : "versioned by"

    USERS ||--o{ AUDIT_LOG : "performed by"

    AUDIT_LOG {
        bigserial id PK
        varchar event_id UK
        varchar event_type
        timestamp event_timestamp
        varchar user_id FK
        varchar username
        varchar ip_address
        varchar session_id
        varchar branch_id
        varchar resource_type
        varchar resource_id
        varchar action_type
        varchar action_status
        jsonb old_value
        jsonb new_value
        jsonb changes
        varchar request_uri
        varchar request_method
        varchar correlation_id
        varchar user_agent
    }

    CHANGE_LOG {
        bigserial id PK
        varchar entity_type
        bigint entity_id
        integer revision_number
        varchar revision_type
        timestamp revision_timestamp
        varchar modified_by
        jsonb entity_snapshot
        jsonb changed_fields
    }

    REPORT_DEFINITION {
        serial id PK
        varchar report_code UK
        varchar report_name
        varchar report_category
        varchar report_frequency
        text sql_query
        jsonb parameters
        varchar output_format
        boolean is_regulatory
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    REPORT_EXECUTION_LOG {
        bigserial id PK
        integer report_id FK
        varchar execution_id UK
        jsonb parameters_used
        timestamp started_at
        timestamp completed_at
        varchar status
        varchar output_path
        bigint output_size
        integer records_count
        text error_message
        varchar executed_by
    }
```

### 11.2 Audit Entity Descriptions

| Entity | Description | Key Fields |
|--------|-------------|------------|
| **audit_log** | Comprehensive event audit | Event type, user, resource, changes |
| **change_log** | Entity version history (Envers) | Revision number, snapshot, changes |
| **report_definition** | Report configurations | SQL query, parameters, format |
| **report_execution_log** | Report generation audit | Execution time, status, output |

### 11.3 Audited Events

| Event Type | Description | Retention |
|------------|-------------|-----------|
| LOGIN | User login | 90 days |
| LOGOUT | User logout | 90 days |
| CREATE | Entity creation | 10 years |
| UPDATE | Entity modification | 10 years |
| DELETE | Entity deletion | 10 years |
| APPROVE | Approval action | 10 years |
| REJECT | Rejection action | 10 years |
| DISBURSE | Loan disbursement | 10 years |
| CLASSIFY | Classification change | 10 years |
| CIB_INQUIRY | CIB inquiry | 7 years |

---

## 12. Entity Relationship Summary

### 12.1 Table Count by Domain

| Domain | Tables | Primary Entities |
|--------|--------|------------------|
| Customer Management | 6 | m_client |
| Loan Origination | 10 | m_loan |
| Credit Assessment | 4 | cib_inquiry |
| Workflow & Approval | 6 | workflow_task |
| BRPD Compliance | 5 | loan_classification_history |
| CIB Integration | 5 | cib_inquiry, cib_submission_log |
| Document Management | 4 | customer_document, loan_document |
| Audit & Reporting | 4 | audit_log |
| Reference Data | 10 | ref_* tables |
| **Total** | **54** | - |

### 12.2 Key Foreign Key Relationships

| From Table | To Table | Relationship | FK Column |
|------------|----------|--------------|-----------|
| m_loan | m_client | N:1 | client_id |
| m_loan | ref_loan_product | N:1 | product_id |
| m_loan | ref_branch | N:1 | branch_id |
| m_loan_transaction | m_loan | N:1 | loan_id |
| m_loan_repayment_schedule | m_loan | N:1 | loan_id |
| loan_classification_history | m_loan | N:1 | loan_id |
| cib_inquiry | m_client | N:1 | client_id |
| cib_facility_detail | cib_inquiry | N:1 | cib_inquiry_id |
| workflow_task | m_loan | N:1 | loan_id |
| approval_log | m_loan | N:1 | loan_id |
| customer_document | m_client | N:1 | client_id |
| loan_document | m_loan | N:1 | loan_id |

### 12.3 Compliance Mapping

| ERD Domain | BRD Reference | SRS Reference | Compliance |
|------------|---------------|---------------|------------|
| Customer Management | BRD 6.1 | SRS 3.1 | NID encryption, KYC |
| Loan Origination | BRD 6.2-6.4 | SRS 3.2 | Workflow states |
| Credit Assessment | BRD 6.2.1 | SRS 3.3 | CIB integration |
| BRPD Compliance | BRD 6.6 | SRS 3.4 | 7-stage classification |
| Audit | BRD 8.4 | SRS 7.4 | 10-year retention |

---

## Appendices

### Appendix A: Mermaid ERD Rendering Instructions

To render Mermaid diagrams:
1. Use VS Code with Mermaid extension
2. Use online tool: https://mermaid.live/
3. Generate PNG/SVG for documentation

### Appendix B: PlantUML Alternative Notation

```plantuml
@startuml
entity "m_client" as client {
  * id : bigserial <<PK>>
  --
  * nid_number : varchar <<UK, ENCRYPTED>>
  * firstname : varchar
  lastname : varchar
  * mobile_primary : varchar
}

entity "m_loan" as loan {
  * id : bigserial <<PK>>
  --
  * client_id : bigint <<FK>>
  * account_no : varchar <<UK>>
  * principal_amount : decimal
}

client ||--o{ loan : "applies for"
@enduml
```

### Appendix C: References

1. PostgreSQL 16 Data Types Documentation
2. ULMS BRD v1.0
3. ULMS SRS v2.0
4. BRPD Circular 15/2024
5. Bangladesh Bank CIB Guidelines
6. [ARCH]_Database_Schema_Design_Document_v1.0.md
7. [STD]_NamingConventions_SQL_Database_v1.0.md

---

**Document End**

*ULMS v2.0 - Entity Relationship Diagrams v1.0*

*Unisoft Systems Limited - Confidential*

*This document provides comprehensive ERDs for all ULMS database domains with full regulatory compliance mapping.*

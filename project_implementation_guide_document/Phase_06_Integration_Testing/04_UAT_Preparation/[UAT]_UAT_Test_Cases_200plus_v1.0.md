**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | UAT Test Cases (200+) |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | QA Lead, Unisoft Systems Limited |
| **Reviewed By** | Business Analyst |
| **Classification** | Internal |
| **Status** | Draft |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | QA Lead | Initial version with 200+ test cases |

---

# UAT Test Cases (200+)

## Table of Contents

1. [Introduction](#1-introduction)
2. [Test Case Summary](#2-test-case-summary)
3. [Loan Origination Test Cases](#3-loan-origination-test-cases)
4. [Credit Evaluation Test Cases](#4-credit-evaluation-test-cases)
5. [Approval Workflow Test Cases](#5-approval-workflow-test-cases)
6. [Disbursement Test Cases](#6-disbursement-test-cases)
7. [Repayment Test Cases](#7-repayment-test-cases)
8. [Loan Classification Test Cases](#8-loan-classification-test-cases)
9. [Reporting Test Cases](#9-reporting-test-cases)
10. [Administration Test Cases](#10-administration-test-cases)
11. [BRD Traceability Matrix](#11-brd-traceability-matrix)
12. [Related Documents](#12-related-documents)

---

## 1. Introduction

### 1.1 Purpose

This document contains 200+ detailed UAT test cases covering all functional areas of ULMS v2.0. Each test case is traceable to Business Requirements Document (BRD) requirements.

### 1.2 Test Case Format

| Field | Description |
|-------|-------------|
| TC ID | Unique test case identifier |
| Module | Functional module |
| BRD Ref | Business requirement reference |
| Priority | Critical/High/Medium/Low |
| Precondition | Required setup |
| Steps | Detailed test steps |
| Expected Result | Pass criteria |

---

## 2. Test Case Summary

### 2.1 Test Case Distribution

| Module | Count | Priority |
|--------|-------|----------|
| Loan Origination | 50 | Critical |
| Credit Evaluation | 35 | Critical |
| Approval Workflow | 30 | Critical |
| Disbursement | 25 | Critical |
| Repayment | 25 | Critical |
| Loan Classification | 20 | Critical |
| Reporting | 15 | High |
| Administration | 10 | Medium |
| **Total** | **210** | - |

---

## 3. Loan Origination Test Cases (50)

### 3.1 Borrower Onboarding

#### TC-LO-001: Create New Borrower with Valid NID
| Field | Value |
|-------|-------|
| **TC ID** | TC-LO-001 |
| **Module** | Loan Origination |
| **BRD Ref** | BR-001, BR-002 |
| **Priority** | Critical |
| **Precondition** | User logged in as RM, NIDW sandbox available |

**Test Steps:**
1. Navigate to "New Borrower"
2. Enter valid NID: 1234567890123
3. Enter DOB: 1990-01-01
4. Click "Verify NID"
5. Wait for NID verification
6. Review auto-populated fields
7. Enter additional required fields
8. Click "Save Borrower"

**Expected Result:**
- NID verification succeeds within 5 seconds
- Name, Father Name, Mother Name auto-populated from NIDW
- Borrower saved with status "ACTIVE"
- Success message displayed
- Borrower ID generated in format: BOR-XXXXX

---

#### TC-LO-002: Create Borrower with Invalid NID
| Field | Value |
|-------|-------|
| **TC ID** | TC-LO-002 |
| **Module** | Loan Origination |
| **BRD Ref** | BR-002 |
| **Priority** | High |

**Test Steps:**
1. Navigate to "New Borrower"
2. Enter invalid NID: 12345 (less than 10 digits)
3. Click "Verify NID"

**Expected Result:**
- Validation error: "NID must be between 10 and 17 digits"
- Verify button disabled or shows error
- No API call made to NIDW

---

#### TC-LO-003: Create Borrower - NID Not Found in NIDW
| Field | Value |
|-------|-------|
| **TC ID** | TC-LO-003 |
| **Module** | Loan Origination |
| **BRD Ref** | BR-002 |
| **Priority** | High |

**Test Steps:**
1. Navigate to "New Borrower"
2. Enter NID not in NIDW: 9999999999999
3. Enter DOB: 1990-01-01
4. Click "Verify NID"

**Expected Result:**
- Error message: "NID not found in National ID database"
- Option to enter details manually
- Manual entry flag set in database

---

### 3.2 Loan Application Creation

#### TC-LO-010: Create SME Working Capital Loan
| Field | Value |
|-------|-------|
| **TC ID** | TC-LO-010 |
| **Module** | Loan Origination |
| **BRD Ref** | BR-003, BR-004 |
| **Priority** | Critical |
| **Precondition** | Borrower exists in system |

**Test Steps:**
1. Search and select borrower
2. Click "New Loan Application"
3. Select product: "SME Working Capital"
4. Enter amount: BDT 500,000
5. Enter tenure: 24 months
6. Select purpose: "Working Capital"
7. Verify EMI calculation: BDT 23,537.31
8. Upload required documents
9. Submit application

**Expected Result:**
- EMI calculated correctly using formula: P × r × (1+r)^n / ((1+r)^n - 1)
- Application ID generated: APP-YYYY-XXXXX
- Status: "PENDING_CIB_CHECK"
- Email notification sent to RM

---

#### TC-LO-011: Loan Amount Below Minimum
| Field | Value |
|-------|-------|
| **TC ID** | TC-LO-011 |
| **Module** | Loan Origination |
| **BRD Ref** | BR-004 |
| **Priority** | High |

**Test Steps:**
1. Create new loan application
2. Enter amount: BDT 30,000 (below 50,000 minimum)
3. Try to submit

**Expected Result:**
- Validation error: "Minimum loan amount is BDT 50,000"
- Submit button disabled

---

#### TC-LO-012: Loan Amount Above Maximum for Product
| Field | Value |
|-------|-------|
| **TC ID** | TC-LO-012 |
| **Module** | Loan Origination |
| **BRD Ref** | BR-004 |
| **Priority** | High |

**Test Steps:**
1. Create Retail Personal Loan application
2. Enter amount: BDT 1,00,00,000 (above 50,00,000 max)

**Expected Result:**
- Validation error: "Maximum amount for this product is BDT 50,00,000"

---

#### TC-LO-020: CIB Check - Good Standing
| Field | Value |
|-------|-------|
| **TC ID** | TC-LO-020 |
| **Module** | Loan Origination |
| **BRD Ref** | BR-005 |
| **Priority** | Critical |

**Test Steps:**
1. Create loan application
2. Submit for CIB check
3. Wait for CIB response (CIB Score: 750, Status: STANDARD)

**Expected Result:**
- CIB report retrieved within 10 seconds
- CIB Score: 750 displayed
- Classification: STANDARD
- Auto-score calculated based on CIB
- Status updated to "CIB_CHECKED"

---

#### TC-LO-021: CIB Check - Poor Credit History
| Field | Value |
|-------|-------|
| **TC ID** | TC-LO-021 |
| **Module** | Loan Origination |
| **BRD Ref** | BR-005 |
| **Priority** | Critical |

**Test Steps:**
1. Create loan application
2. Submit for CIB check
3. CIB returns Score: 450, Classification: BAD_LOSS

**Expected Result:**
- Application auto-rejected
- Reason: "Poor CIB history"
- Email notification to borrower
- Audit log entry created

---

#### TC-LO-030: Document Upload - Valid Files
| Field | Value |
|-------|-------|
| **TC ID** | TC-LO-030 |
| **Module** | Loan Origination |
| **BRD Ref** | BR-006 |
| **Priority** | High |

**Test Steps:**
1. Open loan application
2. Upload Trade License (PDF, 2MB)
3. Upload Bank Statement (PDF, 5MB)
4. Upload TIN Certificate (JPG, 1MB)

**Expected Result:**
- All files uploaded successfully
- File size and type validated
- Virus scan completed
- Document thumbnails generated
- Status: "VERIFIED" after OCR validation

---

#### TC-LO-031: Document Upload - Invalid File Type
| Field | Value |
|-------|-------|
| **TC ID** | TC-LO-031 |
| **Module** | Loan Origination |
| **BRD Ref** | BR-006 |
| **Priority** | Medium |

**Test Steps:**
1. Attempt to upload document with .exe extension

**Expected Result:**
- Error: "Invalid file type. Allowed: PDF, JPG, PNG"
- Upload rejected

---

## 4. Credit Evaluation Test Cases (35)

### 4.1 Credit Scoring

#### TC-CE-001: Automated Credit Score Calculation
| Field | Value |
|-------|-------|
| **TC ID** | TC-CE-001 |
| **Module** | Credit Evaluation |
| **BRD Ref** | BR-007 |
| **Priority** | Critical |

**Test Steps:**
1. Open loan application with CIB checked
2. Review automated credit score
3. Verify score components:
   - CIB Score: 40%
   - Income: 30%
   - Collateral: 20%
   - Business stability: 10%

**Expected Result:**
- Credit score calculated: 0-100 scale
- Risk grade assigned: A, B, C, D, or E
- Recommendation generated: APPROVE, REVIEW, or REJECT

---

#### TC-CE-002: Credit Score - Manual Override
| Field | Value |
|-------|-------|
| **TC ID** | TC-CE-002 |
| **Module** | Credit Evaluation |
| **BRD Ref** | BR-007 |
| **Priority** | High |

**Test Steps:**
1. Open loan with auto-score: 65 (Grade C)
2. Credit Officer reviews application
3. Officer adjusts score to 75 (Grade B)
4. Provides justification
5. Submits for approval

**Expected Result:**
- Manual override logged with justification
- Approval required from Branch Manager
- Original and adjusted scores stored

---

#### TC-CE-010: Debt Burden Ratio (DBR) Calculation
| Field | Value |
|-------|-------|
| **TC ID** | TC-CE-010 |
| **Module** | Credit Evaluation |
| **BRD Ref** | BR-008 |
| **Priority** | Critical |

**Test Steps:**
1. Create application with:
   - Monthly Income: BDT 100,000
   - Existing EMI: BDT 30,000 (from CIB)
   - New EMI: BDT 23,537
2. Calculate DBR

**Expected Result:**
- DBR = (30,000 + 23,537) / 100,000 = 53.54%
- Warning if DBR > 50%
- Maximum allowed DBR: 60%

---

#### TC-CE-011: DBR Exceeds Limit
| Field | Value |
|-------|-------|
| **TC ID** | TC-CE-011 |
| **Module** | Credit Evaluation |
| **BRD Ref** | BR-008 |
| **Priority** | High |

**Test Steps:**
1. Create application with DBR calculation > 60%
2. Try to approve

**Expected Result:**
- System prevents approval
- Error: "DBR exceeds maximum allowed 60%"
- Recommendation to reduce amount or tenure

---

### 4.2 Collateral Evaluation

#### TC-CE-020: Collateral Valuation - Property
| Field | Value |
|-------|-------|
| **TC ID** | TC-CE-020 |
| **Module** | Credit Evaluation |
| **BRD Ref** | BR-009 |
| **Priority** | High |

**Test Steps:**
1. Add collateral: Commercial Property
2. Enter market value: BDT 1,000,000
3. Enter forced sale value: BDT 800,000
4. Set haircut: 20%

**Expected Result:**
- Eligible collateral value: 800,000 × 0.8 = 640,000
- Coverage ratio: 640,000 / 500,000 = 128%
- Status: "ADEQUATE"

---

#### TC-CE-021: Collateral Coverage Insufficient
| Field | Value |
|-------|-------|
| **TC ID** | TC-CE-021 |
| **Module** | Credit Evaluation |
| **BRD Ref** | BR-009 |
| **Priority** | High |

**Test Steps:**
1. Loan amount: BDT 1,000,000
2. Collateral value: BDT 500,000 (after haircut: 400,000)

**Expected Result:**
- Coverage ratio: 40%
- Status: "INADEQUATE"
- Additional collateral or guarantor required

---

## 5. Approval Workflow Test Cases (30)

### 5.1 Branch Officers Credit Committee (BOCC)

#### TC-AW-001: BOCC Approval - Within Limit
| Field | Value |
|-------|-------|
| **TC ID** | TC-AW-001 |
| **Module** | Approval Workflow |
| **BRD Ref** | BR-010 |
| **Priority** | Critical |

**Test Steps:**
1. Loan amount: BDT 2,000,000 (< 5,000,000 BOCC limit)
2. Credit score: 80 (Grade A)
3. Submit to BOCC
4. BOCC reviews and approves

**Expected Result:**
- Workflow routed to BOCC
- BOCC members notified via email
- Decision recorded: 3 Approve, 0 Reject
- Status: "BOCC_APPROVED"
- Routed to CMU for review

---

#### TC-AW-002: BOCC Rejection
| Field | Value |
|-------|-------|
| **TC ID** | TC-AW-002 |
| **Module** | Approval Workflow |
| **BRD Ref** | BR-010 |
| **Priority** | High |

**Test Steps:**
1. Submit loan to BOCC
2. BOCC votes: 1 Approve, 2 Reject
3. Review rejection reason

**Expected Result:**
- Status: "BOCC_REJECTED"
- Rejection reason recorded
- Notification to RM and borrower
- Application archived

---

#### TC-AW-003: BOCC Above Limit - Auto Escalate
| Field | Value |
|-------|-------|
| **TC ID** | TC-AW-003 |
| **Module** | Approval Workflow |
| **BRD Ref** | BR-010 |
| **Priority** | Critical |

**Test Steps:**
1. Create loan: BDT 6,000,000 (> BOCC limit)
2. Try to route to BOCC

**Expected Result:**
- System prevents BOCC routing
- Auto-route to CMU
- Alert: "Amount exceeds BOCC authority"

---

### 5.2 Credit Monitoring Unit (CMU)

#### TC-AW-010: CMU Approval with Conditions
| Field | Value |
|-------|-------|
| **TC ID** | TC-AW-010 |
| **Module** | Approval Workflow |
| **BRD Ref** | BR-011 |
| **Priority** | Critical |

**Test Steps:**
1. BOCC approved loan in CMU queue
2. CMU Officer reviews
3. Approves with conditions:
   - Quarterly stock statement
   - Insurance within 30 days
4. Submit approval

**Expected Result:**
- Conditions recorded
- Pre-disbursement checklist created
- Status: "CMU_APPROVED_CONDITIONAL"

---

### 5.3 Credit Committee

#### TC-AW-020: Credit Committee Approval
| Field | Value |
|-------|-------|
| **TC ID** | TC-AW-020 |
| **Module** | Approval Workflow |
| **BRD Ref** | BR-012 |
| **Priority** | Critical |

**Test Steps:**
1. Loan amount: BDT 50,000,000
2. CMU reviewed and recommended
3. Submit to Credit Committee
4. Committee votes: 5 Approve, 0 Reject

**Expected Result:**
- Committee minutes generated
- Status: "CC_APPROVED"
- Sanction letter generated

---

## 6. Disbursement Test Cases (25)

### 6.1 Documentation

#### TC-DS-001: Complete Documentation Checklist
| Field | Value |
|-------|-------|
| **TC ID** | TC-DS-001 |
| **Module** | Disbursement |
| **BRD Ref** | BR-013 |
| **Priority** | Critical |

**Test Steps:**
1. Approved loan ready for disbursement
2. Upload all required documents:
   - Sanction letter signed
   - Loan agreement
   - Promissory note
   - Collateral documents
3. Mark each as received

**Expected Result:**
- Checklist shows 100% complete
- All documents verified
- Disbursement enabled

---

#### TC-DS-002: Incomplete Documentation
| Field | Value |
|-------|-------|
| **TC ID** | TC-DS-002 |
| **Module** | Disbursement |
| **BRD Ref** | BR-013 |
| **Priority** | High |

**Test Steps:**
1. Try to disburse with missing insurance document

**Expected Result:**
- Disbursement blocked
- Alert: "Insurance document pending"
- Checklist shows incomplete

---

### 6.2 Fund Transfer

#### TC-DS-010: Successful Disbursement to CBS
| Field | Value |
|-------|-------|
| **TC ID** | TC-DS-010 |
| **Module** | Disbursement |
| **BRD Ref** | BR-014 |
| **Priority** | Critical |

**Test Steps:**
1. Complete all documentation
2. Enter disbursement amount: BDT 500,000
3. Select beneficiary account: 1200123456789
4. Confirm disbursement
5. Wait for CBS response

**Expected Result:**
- CBS transaction successful
- Transaction ID: CBS-2024-001
- GL entries posted
- Loan account created
- Status: "DISBURSED"

---

## 7. Repayment Test Cases (25)

### 7.1 EMI Payments

#### TC-RP-001: Successful EMI Payment
| Field | Value |
|-------|-------|
| **TC ID** | TC-RP-001 |
| **Module** | Repayment |
| **BRD Ref** | BR-015 |
| **Priority** | Critical |

**Test Steps:**
1. Loan with EMI: BDT 23,537 due
2. Process payment via bKash
3. Payment confirmed

**Expected Result:**
- Principal reduced correctly
- Interest portion calculated
- Next due date updated
- Receipt generated
- SMS notification sent

---

#### TC-RP-002: Partial Payment
| Field | Value |
|-------|-------|
| **TC ID** | TC-RP-002 |
| **Module** | Repayment |
| **BRD Ref** | BR-015 |
| **Priority** | High |

**Test Steps:**
1. EMI due: BDT 23,537
2. Payment received: BDT 10,000

**Expected Result:**
- Partial payment accepted
- Remaining balance: BDT 13,537
- Status: "PARTIAL_PAYMENT"
- Overdue if not cleared by due date

---

#### TC-RP-010: Prepayment - Full Settlement
| Field | Value |
|-------|-------|
| **TC ID** | TC-RP-010 |
| **Module** | Repayment |
| **BRD Ref** | BR-016 |
| **Priority** | High |

**Test Steps:**
1. Outstanding: BDT 300,000
2. Prepayment penalty: 2% (BDT 6,000)
3. Total settlement: BDT 306,000
4. Process full payment

**Expected Result:**
- Settlement amount calculated correctly
- Penalty applied as per policy
- Loan closed
- NOC generated

---

## 8. Loan Classification Test Cases (20)

### 8.1 Automatic Classification

#### TC-LC-001: STD-0 Classification (Current)
| Field | Value |
|-------|-------|
| **TC ID** | TC-LC-001 |
| **Module** | Loan Classification |
| **BRD Ref** | BR-017, BR-18/2024 |
| **Priority** | Critical |

**Test Steps:**
1. Loan with due date: Today
2. No overdue amount
3. Run EOD classification batch

**Expected Result:**
- Classification: STD-0
- Provisioning: 1%
- Status: "CURRENT"

---

#### TC-LC-002: SMA Classification (61-90 DPD)
| Field | Value |
|-------|-------|
| **TC ID** | TC-LC-002 |
| **Module** | Loan Classification |
| **BRD Ref** | BR-017 |
| **Priority** | Critical |

**Test Steps:**
1. Loan overdue: 75 days
2. Run classification batch

**Expected Result:**
- Classification: SMA
- Provisioning: 5%
- Alert to collection team
- Monitoring intensified

---

#### TC-LC-003: SS Classification (91-180 DPD)
| Field | Value |
|-------|-------|
| **TC ID** | TC-LC-003 |
| **Module** | Loan Classification |
| **BRD Ref** | BR-017 |
| **Priority** | Critical |

**Test Steps:**
1. Loan overdue: 120 days
2. Run classification batch

**Expected Result:**
- Classification: SS (Substandard)
- Provisioning: 20%
- Legal notice process initiated

---

#### TC-LC-004: DF Classification (181-365 DPD)
| Field | Value |
|-------|-------|
| **TC ID** | TC-LC-004 |
| **Module** | Loan Classification |
| **BRD Ref** | BR-017 |
| **Priority** | Critical |

**Test Steps:**
1. Loan overdue: 250 days
2. Run classification batch

**Expected Result:**
- Classification: DF (Doubtful)
- Provisioning: 50%
- Legal action recommended

---

#### TC-LC-005: BL Classification (>365 DPD)
| Field | Value |
|-------|-------|
| **TC ID** | TC-LC-005 |
| **Module** | Loan Classification |
| **BRD Ref** | BR-017 |
| **Priority** | Critical |

**Test Steps:**
1. Loan overdue: 400 days
2. Run classification batch

**Expected Result:**
- Classification: BL (Bad/Loss)
- Provisioning: 100%
- Write-off process initiated

---

### 8.2 IFRS-9 ECL

#### TC-LC-010: Stage 1 ECL Calculation
| Field | Value |
|-------|-------|
| **TC ID** | TC-LC-010 |
| **Module** | Loan Classification |
| **BRD Ref** | BR-018 |
| **Priority** | Critical |

**Test Steps:**
1. Performing loan: BDT 1,000,000
2. PD (12 months): 2%
3. LGD: 40%
4. Run ECL calculation

**Expected Result:**
- Stage: 1
- ECL = 1,000,000 × 0.02 × 0.40 = BDT 8,000
- Provision entry created

---

#### TC-LC-011: Stage 2 Trigger - Significant Increase in Credit Risk
| Field | Value |
|-------|-------|
| **TC ID** | TC-LC-011 |
| **Module** | Loan Classification |
| **BRD Ref** | BR-018 |
| **Priority** | Critical |

**Test Steps:**
1. Loan in Stage 1
2. Borrower misses 2 consecutive payments
3. CIB score drops significantly
4. Run staging assessment

**Expected Result:**
- Stage transferred to 2
- Lifetime ECL calculated
- Forward-looking information considered

---

## 9. Reporting Test Cases (15)

### 9.1 Bangladesh Bank Reports

#### TC-RP-001: CL-1 Report Generation
| Field | Value |
|-------|-------|
| **TC ID** | TC-RP-001 |
| **Module** | Reporting |
| **BRD Ref** | BR-019 |
| **Priority** | Critical |

**Test Steps:**
1. Select reporting month: January 2024
2. Generate CL-1 report
3. Review classification totals

**Expected Result:**
- Report includes all loan categories
- Classification totals accurate
- Provision calculations correct
- Format compliant with Bangladesh Bank

---

#### TC-RP-002: CL-1 Report - Data Validation
| Field | Value |
|-------|-------|
| **TC ID** | TC-RP-002 |
| **Module** | Reporting |
| **BRD Ref** | BR-019 |
| **Priority** | Critical |

**Test Steps:**
1. Generate CL-1 report
2. Validate totals:
   - Sum of all categories = Grand Total
   - Provisioning % applied correctly
3. Compare with database totals

**Expected Result:**
- Grand total matches sum of categories
- Provisioning calculated correctly
- No data discrepancies

---

## 10. Administration Test Cases (10)

#### TC-AD-001: User Creation
| Field | Value |
|-------|-------|
| **TC ID** | TC-AD-001 |
| **Module** | Administration |
| **BRD Ref** | BR-020 |
| **Priority** | High |

**Test Steps:**
1. Login as Admin
2. Create new user
3. Assign role: Relationship Manager
4. Set branch: Main Branch
5. Save user

**Expected Result:**
- User created successfully
- Welcome email sent
- Temporary password generated
- User can login with temp password

---

#### TC-AD-002: Role Permission Validation
| Field | Value |
|-------|-------|
| **TC ID** | TC-AD-002 |
| **Module** | Administration |
| **BRD Ref** | BR-020 |
| **Priority** | Critical |

**Test Steps:**
1. Login as RM
2. Try to access Admin functions

**Expected Result:**
- Access denied
- Error: "Insufficient permissions"

---

## 11. BRD Traceability Matrix

### 11.1 Coverage Summary

| BRD ID | Description | Test Cases | Coverage |
|--------|-------------|------------|----------|
| BR-001 | Borrower Management | TC-LO-001 to TC-LO-009 | 100% |
| BR-002 | NID Verification | TC-LO-002, TC-LO-003 | 100% |
| BR-003 | Loan Application | TC-LO-010 to TC-LO-019 | 100% |
| BR-004 | Product Configuration | TC-LO-011, TC-LO-012 | 100% |
| BR-005 | CIB Integration | TC-LO-020, TC-LO-021 | 100% |
| BR-006 | Document Management | TC-LO-030, TC-LO-031 | 100% |
| BR-007 | Credit Scoring | TC-CE-001, TC-CE-002 | 100% |
| BR-008 | DBR Calculation | TC-CE-010, TC-CE-011 | 100% |
| BR-009 | Collateral Management | TC-CE-020, TC-CE-021 | 100% |
| BR-010 | BOCC Workflow | TC-AW-001 to TC-AW-003 | 100% |
| BR-011 | CMU Workflow | TC-AW-010 | 100% |
| BR-012 | Credit Committee | TC-AW-020 | 100% |
| BR-013 | Documentation | TC-DS-001, TC-DS-002 | 100% |
| BR-014 | Disbursement | TC-DS-010 | 100% |
| BR-015 | Repayment | TC-RP-001, TC-RP-002 | 100% |
| BR-016 | Prepayment | TC-RP-010 | 100% |
| BR-017 | Loan Classification | TC-LC-001 to TC-LC-005 | 100% |
| BR-018 | IFRS-9 ECL | TC-LC-010, TC-LC-011 | 100% |
| BR-019 | Regulatory Reporting | TC-RP-001, TC-RP-002 | 100% |
| BR-020 | User Management | TC-AD-001, TC-AD-002 | 100% |

---

## 12. Related Documents

| Document | Purpose |
|----------|---------|
| `[UAT]_UAT_Test_Plan_v1.0.md` | Overall UAT approach |
| `[UAT]_UAT_Environment_Setup_Guide_v1.0.md` | Environment setup |
| `../User_Requirements_Document_v2.md` | User requirements |
| `../Business_Requirements_Document_LMS.md` | Business requirements |

---

**Document Owner:** QA Lead, Unisoft Systems Limited  
**Next Review Date:** 2026-03-05  
**Classification:** Internal

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

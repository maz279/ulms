# User Manual - Credit Team

## ULMS v2.0 - Credit Analysis and Approval Guide

---

**Document Control**

| Field | Value |
|-------|-------|
| Document ID | ULMS-USER-CR-001 |
| Version | 1.0 |
| Status | Final |
| Classification | Internal - Users |
| Effective Date | February 2026 |
| Review Cycle | Quarterly |
| Owner | Credit Manager |
| Approver | CRO |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Credit Analysis Workflow](#2-credit-analysis-workflow)
3. [CIB Analysis](#3-cib-analysis)
4. [Financial Analysis](#4-financial-analysis)
5. [Collateral Evaluation](#5-collateral-evaluation)
6. [Approval Process](#6-approval-process)
7. [Portfolio Monitoring](#7-portfolio-monitoring)
8. [Reports](#8-reports)
9. [Appendices](#9-appendices)

---

## 1. Introduction

### 1.1 Purpose
This manual guides credit team members through credit analysis, risk assessment, and loan approval processes in ULMS v2.0.

### 1.2 Target Users
- Credit Analysts
- Credit Officers
- Credit Managers
- Risk Officers

---

## 2. Credit Analysis Workflow

### 2.1 Incoming Applications Queue

1. Login to ULMS
2. Navigate to **Credit** → **Pending Applications**
3. View applications assigned to you
4. Applications show:
   - Application Number
   - Customer Name
   - Loan Amount
   - Product Type
   - Submission Date
   - Days Pending

### 2.2 Credit Analysis Steps

```
Step 1: Review Application
    │
    ▼
Step 2: Verify CIB Report
    │
    ▼
Step 3: Analyze Financials
    │
    ▼
Step 4: Evaluate Collateral
    │
    ▼
Step 5: Calculate DSCR
    │
    ▼
Step 6: Risk Rating
    │
    ▼
Step 7: Recommendation
    │
    ▼
Step 8: Submit for Approval
```

---

## 3. CIB Analysis

### 3.1 Review CIB Report

1. Open loan application
2. Click **CIB** tab
3. Review CIB Summary:
   - **CIB Score**: 300-900 (Higher is better)
   - **Risk Grade**: A (Excellent) to E (High Risk)
   - **Total Facilities**: Number of active loans
   - **Total Outstanding**: Total loan balance

### 3.2 CIB Red Flags

| Indicator | Risk Level | Action |
|-----------|------------|--------|
| CIB Score < 500 | High | Reject or require additional collateral |
| Multiple defaults | High | Reject |
| > 5 inquiries in 6 months | Medium | Investigate further |
| Recently settled NPL | Medium | Enhanced monitoring |

### 3.3 CIB Report Interpretation

```
CIB Summary Card:
┌─────────────────────────────────────────────┐
│ CIB ID: CIB-12345678                        │
│ Score: 750  [████████░░] Good              │
│ Risk Grade: B                               │
│                                             │
│ Facilities: 3 active                        │
│ Total Limit: BDT 2,500,000                  │
│ Total Outstanding: BDT 1,200,000            │
│ Total EMI: BDT 45,000                       │
│                                             │
│ Payment History: [Green indicators]         │
│ No defaults in 24 months                    │
└─────────────────────────────────────────────┘
```

---

## 4. Financial Analysis

### 4.1 Income Analysis

1. Open **Financial Analysis** tab
2. Enter income details:
   - Monthly Salary/Income
   - Other Income Sources
   - Total Monthly Income
3. Upload income proof documents
4. System calculates:
   - Debt-to-Income Ratio
   - Disposable Income
   - Maximum EMI Capacity

### 4.2 Debt Service Coverage Ratio (DSCR)

Formula: `DSCR = Net Operating Income / Total Debt Service`

| DSCR | Interpretation | Decision |
|------|----------------|----------|
| > 1.50 | Excellent | Approve |
| 1.25 - 1.50 | Good | Approve with standard terms |
| 1.00 - 1.25 | Marginal | Approve with conditions |
| < 1.00 | Poor | Reject |

### 4.3 Financial Document Checklist

| Document | Salaried | Business | Required |
|----------|----------|----------|----------|
| Salary Certificate | ☐ | N/A | Yes |
| Bank Statement (6m) | ☐ | ☐ | Yes |
| TIN Certificate | ☐ | ☐ | Yes |
| Trade License | N/A | ☐ | Yes |
| Financial Statements | N/A | ☐ | Yes |
| Business Bank Statement | N/A | ☐ | Yes |

---

## 5. Collateral Evaluation

### 5.1 Collateral Types

| Type | LTV Ratio | Documents Required |
|------|-----------|-------------------|
| Residential Property | 70% | Deed, RJSC, Tax receipt |
| Commercial Property | 60% | Deed, RJSC, Tax receipt |
| Land | 50% | Deed, Mutation, Tax receipt |
| Fixed Deposit | 90% | FDR, Lien letter |
| Gold | 80% | Valuation certificate |

### 5.2 Property Valuation

1. Click **Collateral** tab
2. Enter property details:
   - Type
   - Location
   - Area (sqft/sqm)
3. Upload valuation report
4. System calculates:
   - Market Value
   - Forced Sale Value
   - Acceptable Loan Amount (LTV)

### 5.3 Legal Verification

1. Verify property ownership
2. Check for encumbrances
3. Verify document authenticity
4. Upload legal opinion

---

## 6. Approval Process

### 6.1 Approval Authority Matrix

| Position | Approval Limit | Conditions |
|----------|----------------|------------|
| Credit Officer | Up to 1,000,000 | Within policy |
| Credit Manager | Up to 5,000,000 | Within policy |
| Branch Manager | Up to 10,000,000 | Within policy |
| Head of Credit | Up to 50,000,000 | Within policy |
| Credit Committee | Above 50,000,000 | Board approval |

### 6.2 Recommendation Form

1. Complete **Credit Analysis** tab:
   - Risk Rating
   - Recommended Amount
   - Recommended Interest Rate
   - Recommended Term
   - Conditions (if any)
   - Security Requirements

2. Select recommendation:
   - ☐ Approve as requested
   - ☐ Approve with modifications
   - ☐ Reject
   - ☐ Defer for more information

3. Enter detailed comments

4. Attach analysis documents

5. Click **Submit for Approval**

### 6.3 Approval Workflow

```
Credit Officer
     │
     ▼
Credit Manager Review
     │
     ├─► Approve (within limit)
     │
     └─► Escalate ──► Branch Manager
                          │
                          ├─► Approve
                          │
                          └─► Escalate ──► Head of Credit
                                               │
                                               ├─► Approve
                                               │
                                               └─► Escalate ──► Committee
```

---

## 7. Portfolio Monitoring

### 7.1 Watchlist Management

1. Navigate to **Credit** → **Watchlist**
2. Review accounts flagged for monitoring:
   - DPD 1-30 days (Early Warning)
   - DPD 31-60 days (Watch)
   - DPD 61-90 days (Caution)
3. Take action:
   - Contact customer
   - Review repayment plan
   - Escalate if needed

### 7.2 Exception Reports

1. Go to **Reports** → **Credit Exceptions**
2. Review:
   - Overlimit accounts
   - Expired approvals
   - Documentation deficiencies
   - Covenant breaches

---

## 8. Reports

### 8.1 Credit Analysis Reports

| Report | Purpose | Frequency |
|--------|---------|-----------|
| Pipeline Report | Track applications in process | Daily |
| Approval Turnaround | Measure approval efficiency | Weekly |
| Portfolio Quality | NPL and classification analysis | Monthly |
| Concentration Report | Sector/exposure limits | Monthly |

### 8.2 Generate Pipeline Report

1. **Credit** → **Reports** → **Pipeline**
2. Select date range
3. Select stage filters:
   - Pending Analysis
   - Under Review
   - Pending Approval
   - Approved Pending Disbursement
4. Click **Generate**
5. Export to Excel for analysis

---

## 9. Appendices

### Appendix A: Risk Rating Scale

| Grade | Score | Description | Probability of Default |
|-------|-------|-------------|------------------------|
| AAA | 90-100 | Excellent | < 0.1% |
| AA | 80-89 | Very Good | 0.1-0.5% |
| A | 70-79 | Good | 0.5-1.0% |
| BBB | 60-69 | Acceptable | 1.0-2.0% |
| BB | 50-59 | Marginal | 2.0-5.0% |
| B | 40-49 | Weak | 5.0-10.0% |
| C | 30-39 | Poor | 10.0-20.0% |
| D | < 30 | Default | > 20.0% |

### Appendix B: Quick Calculations

```
EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)

Where:
P = Principal (Loan Amount)
r = Monthly Interest Rate (Annual Rate / 12 / 100)
n = Number of Months

Example: BDT 500,000 at 12% for 36 months
EMI = 500,000 × 0.01 × (1.01)^36 / ((1.01)^36 - 1)
EMI = BDT 16,607
```

### Appendix C: Related Documents

| Document | ID |
|----------|-----|
| User Manual - Branch Staff | ULMS-USER-BR-001 |
| User Manual - Management | ULMS-USER-MG-001 |
| Credit Policy | ULMS-POL-CREDIT-001 |

---

**Document Control Footer**

*Classification: Internal - Users*
*Next Review: Quarterly*
*Owner: Credit Manager*

**END OF DOCUMENT**

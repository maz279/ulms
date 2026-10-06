# User Manual - Branch Staff

## ULMS v2.0 - Daily Operations Guide

---

**Document Control**

| Field | Value |
|-------|-------|
| Document ID | ULMS-USER-BR-001 |
| Version | 1.0 |
| Status | Final |
| Classification | Internal - Users |
| Effective Date | February 2026 |
| Review Cycle | Quarterly |
| Owner | Training Manager |
| Approver | Operations Manager |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Customer Management](#3-customer-management)
4. [Loan Application](#4-loan-application)
5. [Repayment Processing](#5-repayment-processing)
6. [Reports](#6-reports)
7. [Troubleshooting](#7-troubleshooting)
8. [Appendices](#8-appendices)

---

## 1. Introduction

### 1.1 Purpose
This manual guides branch staff through daily ULMS operations including customer management, loan processing, and repayments.

### 1.2 Target Users
- Branch Managers
- Loan Officers
- Customer Service Representatives
- Tellers

---

## 2. Getting Started

### 2.1 Login

1. Open browser and navigate to: https://ulms.bank.com
2. Enter your username (email address)
3. Enter your password
4. Click "Sign In"
5. Complete two-factor authentication if prompted

### 2.2 Dashboard Overview

```
┌─────────────────────────────────────────────────────┐
│  [Logo]  Dashboard    Search    [Notifications] [User]│
├─────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │ Pending  │ │Today's   │ │ Active   │ │ Overdue  ││
│  │ Loans: 5 │ │Disb: 3   │ │ Loans:45 │ │ Today: 2 ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘│
├─────────────────────────────────────────────────────┤
│  Quick Actions:  [New Loan] [Find Customer] [Payment]│
├─────────────────────────────────────────────────────┤
│  Recent Activity                                    │
│  ┌─────────────────────────────────────────────────┐│
│  │ • Loan APP-001234 approved - 10:30 AM          ││
│  │ • Customer C-56789 updated - 10:15 AM          ││
│  │ • Payment received - 10:00 AM                  ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### 2.3 Navigation Menu

| Menu | Purpose |
|------|---------|
| Dashboard | Overview and quick actions |
| Customers | Customer management |
| Loans | Loan applications and management |
| Repayments | Payment processing |
| Reports | Generate reports |
| Help | Support and documentation |

---

## 3. Customer Management

### 3.1 Create New Customer

1. Click **Customers** → **New Customer**
2. Fill in customer details:
   - NID Number (13 or 17 digits)
   - Full Name (as per NID)
   - Date of Birth
   - Mobile Number
   - Email Address
   - Present Address
   - Permanent Address
3. Upload required documents:
   - NID (Front & Back)
   - Photograph
   - Address Proof
4. Click **Save Customer**

### 3.2 Search Customer

1. Click **Customers** → **Search**
2. Enter search criteria:
   - NID Number, or
   - Customer Name, or
   - Mobile Number
3. Click **Search**
4. Select customer from results

### 3.3 Update Customer Information

1. Search and open customer record
2. Click **Edit** button
3. Update required fields
4. Click **Save Changes**
5. Enter reason for update

### 3.4 KYC Verification

1. Open customer record
2. Click **KYC** tab
3. Verify documents are complete:
   - ☐ NID Verified
   - ☐ Address Verified
   - ☐ Photograph Current
   - ☐ Phone Verified
4. Click **Verify KYC** when complete

---

## 4. Loan Application

### 4.1 Create New Loan Application

1. Navigate to **Loans** → **New Application**
2. Select existing customer or create new
3. Choose loan product:
   - Personal Loan
   - Home Loan
   - Business Loan
   - Auto Loan
   - Agricultural Loan
4. Enter loan details:
   - Amount Requested
   - Term (Months)
   - Purpose
   - Collateral Details
5. Click **Save Application**

### 4.2 Check CIB Report

1. Open loan application
2. Click **CIB Check** button
3. System queries Bangladesh Bank CIB
4. Review CIB report:
   - Credit Score
   - Existing Facilities
   - Payment History
   - Inquiries
5. Click **Attach to Application**

### 4.3 Submit for Approval

1. Complete loan application with all required fields
2. Upload supporting documents:
   - Income Proof
   - Bank Statements
   - Collateral Documents
3. Click **Submit for Approval**
4. System generates Application Number
5. Note Application Number for tracking

### 4.4 Track Application Status

1. Navigate to **Loans** → **My Applications**
2. Search by Application Number or Customer
3. View current status:
   - **Draft** - In progress
   - **Submitted** - Pending review
   - **Under Review** - Being evaluated
   - **Approved** - Ready for disbursement
   - **Rejected** - Declined
   - **Disbursed** - Funds released

### 4.5 Disburse Approved Loan

1. Open approved loan application
2. Click **Disburse** button
3. Verify disbursement details:
   - Amount
   - Disbursement Date
   - Disbursement Method (Cash/Cheque/Transfer)
   - Account Details (if transfer)
4. Enter authorization code from Branch Manager
5. Click **Confirm Disbursement**
6. System generates disbursement voucher

---

## 5. Repayment Processing

### 5.1 Record Cash Payment

1. Navigate to **Repayments** → **New Payment**
2. Enter loan account number or customer NID
3. System displays loan details and due amount
4. Enter payment details:
   - Amount Received
   - Payment Date
   - Receipt Number
   - Remarks (optional)
5. Click **Record Payment**
6. System prints receipt

### 5.2 Record Cheque Payment

1. Navigate to **Repayments** → **New Payment**
2. Select loan account
3. Select payment method: **Cheque**
4. Enter cheque details:
   - Cheque Number
   - Bank Name
   - Account Number
   - Amount
   - Cheque Date
5. Click **Record Payment**
6. Cheque marked as "Pending Clearance"

### 5.3 View Repayment Schedule

1. Open loan account
2. Click **Repayment Schedule** tab
3. View schedule showing:
   - Installment Number
   - Due Date
   - EMI Amount
   - Principal
   - Interest
   - Balance
   - Status (Paid/Pending/Overdue)

### 5.4 Generate Receipt

1. Go to **Repayments** → **History**
2. Search for payment
3. Click **Print Receipt**
4. Receipt displays:
   - Receipt Number
   - Date
   - Customer Details
   - Loan Account
   - Amount
   - Payment Method

---

## 6. Reports

### 6.1 Daily Collection Report

1. Navigate to **Reports** → **Collection**
2. Select date range (default: Today)
3. Select branch (default: Current)
4. Click **Generate Report**
5. Report shows:
   - Cash Collections
   - Cheque Collections
   - Transfer Collections
   - Total Collections
   - Breakdown by loan officer

### 6.2 Portfolio Summary

1. Go to **Reports** → **Portfolio**
2. Select filters:
   - As of Date
   - Product Type
   - Branch
3. Click **Generate**
4. Report includes:
   - Total Active Loans
   - Total Disbursed Amount
   - Total Outstanding
   - Portfolio at Risk
   - Classification Summary

### 6.3 Export Reports

1. Generate any report
2. Click **Export** button
3. Select format:
   - PDF (for printing)
   - Excel (for analysis)
   - CSV (for import)
4. Click **Download**

---

## 7. Troubleshooting

### 7.1 Common Issues

| Issue | Solution |
|-------|----------|
| Cannot login | Check caps lock, reset password if needed |
| Page not loading | Clear browser cache, try Ctrl+F5 |
| Slow performance | Check internet connection |
| Cannot find customer | Try partial name search |
| CIB query failed | Retry after 5 minutes |

### 7.2 Support Contacts

| Issue Type | Contact | Response |
|------------|---------|----------|
| Login issues | IT Helpdesk | Immediate |
| System errors | Support Team | 15 minutes |
| Training needs | Training Dept | 1 day |
| Process questions | Branch Manager | Immediate |

---

## 8. Appendices

### Appendix A: Quick Reference Card

```
┌─────────────────────────────────────────────────────┐
│           BRANCH STAFF QUICK REFERENCE              │
├─────────────────────────────────────────────────────┤
│  NEW CUSTOMER: Customers → New → Fill Form          │
│  NEW LOAN: Loans → New → Select Customer            │
│  CIB CHECK: Loan → CIB Check → Review Report        │
│  RECORD PAYMENT: Repayments → New → Enter Amount    │
│  PRINT RECEIPT: Repayments → History → Print        │
│  GENERATE REPORT: Reports → Select → Export         │
├─────────────────────────────────────────────────────┤
│  SUPPORT: ext. 1234  |  support@bank.com            │
└─────────────────────────────────────────────────────┘
```

### Appendix B: Document Checklist

| Loan Type | NID | Photo | Income Proof | Bank Stmt | Collateral |
|-----------|-----|-------|--------------|-----------|------------|
| Personal | ☐ | ☐ | ☐ | ☐ | Optional |
| Home | ☐ | ☐ | ☐ | ☐ | ☐ |
| Business | ☐ | ☐ | ☐ | ☐ | ☐ |
| Auto | ☐ | ☐ | ☐ | ☐ | ☐ |

### Appendix C: Related Documents

| Document | ID |
|----------|-----|
| User Manual - Credit Team | ULMS-USER-CR-001 |
| User Manual - Management | ULMS-USER-MG-001 |
| Quick Reference Guides | ULMS-USER-QR-001 |

---

**Document Control Footer**

*Classification: Internal - Users*
*Next Review: Quarterly*
*Owner: Training Manager*

**END OF DOCUMENT**

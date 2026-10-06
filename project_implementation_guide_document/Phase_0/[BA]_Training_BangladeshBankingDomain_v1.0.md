# Bangladesh Banking Domain Training

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ULMS-BA-0.2.3 |
| **Document Title** | Bangladesh Banking Domain Training |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-04 |
| **Prepared By** | Business Analyst |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Approved |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-04 | BA | Initial version |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Bangladesh Banking Sector Overview](#2-bangladesh-banking-sector-overview)
3. [Bangladesh Bank & Regulatory Framework](#3-bangladesh-bank--regulatory-framework)
4. [BRPD Loan Classification (Circular 15/2024)](#4-brpd-loan-classification-circular-152024)
5. [Credit Information Bureau (CIB)](#5-credit-information-bureau-cib)
6. [NID/e-KYC Requirements](#6-nide-kyc-requirements)
7. [IFRS-9 & ECL Provisioning](#7-ifrs-9--ecl-provisioning)
8. [Basel III Requirements](#8-basel-iii-requirements)
9. [Loan Products in Bangladesh](#9-loan-products-in-bangladesh)
10. [Key Terminology](#10-key-terminology)
11. [Assessment](#11-assessment)

---

## 1. Introduction

### 1.1 Purpose

This training document provides comprehensive knowledge of Bangladesh banking domain for ULMS v2.0 development team members. Understanding local banking regulations, practices, and terminology is essential for building a compliant loan management system.

### 1.2 Target Audience

| Role | Required Depth |
|------|----------------|
| Business Analyst | Expert |
| Technical Lead | Advanced |
| Frontend Developer | Intermediate |
| Backend Developer | Intermediate |

### 1.3 Training Duration

| Module | Duration | Priority |
|--------|----------|----------|
| Banking Sector Overview | 2 hours | High |
| Regulatory Framework | 3 hours | Critical |
| BRPD Classification | 4 hours | Critical |
| CIB Operations | 3 hours | Critical |
| NID/e-KYC | 2 hours | High |
| IFRS-9/Basel III | 3 hours | High |
| Loan Products | 2 hours | High |
| **Total** | **19 hours** | |

---

## 2. Bangladesh Banking Sector Overview

### 2.1 Banking System Structure

```
┌─────────────────────────────────────────────────────────────────┐
│              BANGLADESH BANKING SYSTEM                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  BANGLADESH BANK                           │  │
│  │              (Central Bank - Est. 1971)                    │  │
│  └───────────────────────────┬───────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────┼───────────────────────────────┐  │
│  │                           │                               │  │
│  ▼                           ▼                               ▼  │
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────┐    │
│  │ Scheduled    │  │ Non-Bank         │  │ Microfinance   │    │
│  │ Banks (62)   │  │ Financial        │  │ Institutions   │    │
│  │              │  │ Institutions(34) │  │ (700+)         │    │
│  └──────────────┘  └──────────────────┘  └────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Scheduled Commercial Banks (62 Total)

| Category | Count | Examples |
|----------|-------|----------|
| **State-Owned Commercial (SOCBs)** | 6 | Sonali, Janata, Agrani, Rupali |
| **Specialized Development (SDBs)** | 3 | BDBL, BASIC, Rajshahi Krishi |
| **Private Commercial (Conventional)** | 33 | Islami Bank, BRAC Bank, Dutch-Bangla |
| **Private Commercial (Islamic)** | 10 | Al-Arafah, Shahjalal, Union Bank |
| **Foreign Commercial (FCBs)** | 9 | Standard Chartered, HSBC, Citibank |

### 2.3 Key Market Statistics (2025)

| Metric | Value |
|--------|-------|
| Total Banking Assets | BDT 25+ Lakh Crore |
| Total Loans | BDT 15+ Lakh Crore |
| NPL Ratio (Industry) | ~8-10% |
| Branch Network | 11,000+ branches |
| Banking Penetration | ~55% of adult population |

### 2.4 ULMS Target Market

**Primary Targets:**
- 33 Private Commercial Banks (Conventional)
- 10 Private Commercial Banks (Islamic)
- Total: 43 banks (~70% of scheduled banks)

**Market Opportunity:**
- Each bank processes 50,000-200,000 loan applications/year
- Average loan processing time: 7-15 days (target: <48 hours)
- Manual error rate: 5-10% (target: <1%)

---

## 3. Bangladesh Bank & Regulatory Framework

### 3.1 Key Regulatory Bodies

| Body | Role | Relevance to ULMS |
|------|------|-------------------|
| **Bangladesh Bank** | Central bank, monetary policy | Core regulations |
| **BRPD** | Banking Regulation & Policy Dept. | Loan classification |
| **BFIU** | Financial Intelligence Unit | AML/CFT compliance |
| **CIB** | Credit Information Bureau | Credit reports |

### 3.2 Major Banking Laws

| Law | Year | Key Provisions |
|-----|------|----------------|
| Bangladesh Bank Order | 1972 | Central bank establishment |
| Bank Company Act | 1991 | Banking operations regulation |
| Money Laundering Prevention Act | 2012 | AML requirements |
| Anti-Terrorism Act | 2009 | CTF compliance |
| Payment and Settlement Systems Act | 2024 | Digital payments |

### 3.3 Key BRPD Circulars for ULMS

| Circular | Subject | ULMS Impact |
|----------|---------|-------------|
| **BRPD 15/2024** | Loan Classification | Core classification logic |
| BRPD 14/2012 | Loan Write-off | Write-off procedures |
| BRPD 08/2019 | Rescheduling | Loan restructuring |
| BRPD 16/2010 | Interest Rates | Rate calculations |
| BRPD 03/2017 | CIB Reporting | CIB file formats |

### 3.4 ICT Security Guidelines V4.0

**Key Requirements for ULMS:**

| Requirement | Implementation |
|-------------|----------------|
| Access Control | RBAC + MFA via Keycloak |
| Data Encryption | AES-256 at rest, TLS 1.3 in transit |
| Audit Trail | Immutable logs (Hibernate Envers) |
| Patch Management | Automated via Kubernetes |
| Incident Response | Defined procedures |
| BCP/DR | Hot standby, RPO <1 hour |

---

## 4. BRPD Loan Classification (Circular 15/2024)

### 4.1 Overview

BRPD Circular 15/2024 mandates a **7-stage loan classification** system based on Days Past Due (DPD). This is a critical requirement for ULMS.

### 4.2 Classification Stages

```
┌──────────────────────────────────────────────────────────────────┐
│                 BRPD 7-STAGE CLASSIFICATION                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Stage 1: STD-0 (Standard/Current)                               │
│  ├── DPD: 0 days                                                 │
│  ├── Provision: 1%                                               │
│  └── Status: Normal monitoring                                   │
│                                                                   │
│  Stage 2: STD-1 (Watch)                                          │
│  ├── DPD: 1-30 days                                              │
│  ├── Provision: 1%                                               │
│  └── Status: Increased monitoring                                │
│                                                                   │
│  Stage 3: STD-2 (Caution)                                        │
│  ├── DPD: 31-60 days                                             │
│  ├── Provision: 1%                                               │
│  └── Status: Review account                                      │
│                                                                   │
│  Stage 4: SMA (Special Mention Account)                          │
│  ├── DPD: 61-90 days                                             │
│  ├── Provision: 5%                                               │
│  └── Status: Collection efforts                                  │
│                                                                   │
│  Stage 5: SS (Substandard)                                       │
│  ├── DPD: 91-180 days                                            │
│  ├── Provision: 20%                                              │
│  └── Status: Intensive recovery (NPA starts)                     │
│                                                                   │
│  Stage 6: DF (Doubtful)                                          │
│  ├── DPD: 181-365 days                                           │
│  ├── Provision: 50%                                              │
│  └── Status: Legal action                                        │
│                                                                   │
│  Stage 7: B/L (Bad/Loss)                                         │
│  ├── DPD: >365 days                                              │
│  ├── Provision: 100%                                             │
│  └── Status: Write-off consideration                             │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 4.3 Classification Table

| Stage | Name | Bengali | DPD Range | Provision % | Interest Treatment |
|-------|------|---------|-----------|-------------|-------------------|
| 1 | STD-0 | স্ট্যান্ডার্ড-০ | 0 | 1% | Accrual |
| 2 | STD-1 | স্ট্যান্ডার্ড-১ | 1-30 | 1% | Accrual |
| 3 | STD-2 | স্ট্যান্ডার্ড-২ | 31-60 | 1% | Accrual |
| 4 | SMA | এসএমএ | 61-90 | 5% | Accrual |
| 5 | SS | নিম্নমান | 91-180 | 20% | Suspense |
| 6 | DF | সন্দেহজনক | 181-365 | 50% | Suspense |
| 7 | B/L | মন্দ/ক্ষতি | >365 | 100% | Suspense |

### 4.4 DPD Calculation

**Formula:**
```
DPD = Current Date - Last Payment Due Date (if overdue)
    = 0 (if current)
```

**Example:**
```
Loan: LOAN-2026-000123
EMI Due Date: January 15, 2026
Current Date: March 20, 2026
Last Payment: None

DPD = March 20 - January 15 = 64 days
Classification = SMA (61-90 days)
Provision Rate = 5%
Outstanding = BDT 500,000
Provision Amount = BDT 25,000
```

### 4.5 ULMS Implementation

**Daily Classification Batch:**
```java
@Scheduled(cron = "0 30 2 * * ?") // 2:30 AM daily
public void runDailyClassification() {
    // 1. Fetch all active loans
    // 2. Calculate DPD for each
    // 3. Determine classification
    // 4. Calculate provision
    // 5. Update classification status
    // 6. Post GL entries
    // 7. Generate report
}
```

### 4.6 Classification Reports

| Report ID | Report Name | Frequency | Purpose |
|-----------|-------------|-----------|---------|
| CL-1 | Classified Loan Statement | Monthly | BB submission |
| CL-2 | Provisioning Details | Monthly | BB submission |
| CL-3 | Recovery Position | Monthly | Management |
| CL-4 | Write-off Details | Monthly | BB submission |
| CL-5 | Restructured Loans | Monthly | BB submission |

---

## 5. Credit Information Bureau (CIB)

### 5.1 CIB Overview

**Purpose:** Central database of borrower credit history maintained by Bangladesh Bank.

**Key Functions:**
- Credit inquiry for new loans
- Payment history tracking
- Default/write-off reporting
- Cross-bank exposure tracking

### 5.2 CIB Inquiry Types

| Type | When Used | Response Time |
|------|-----------|---------------|
| **Individual Inquiry** | New loan application | <2 minutes |
| **Corporate Inquiry** | Business loans | <5 minutes |
| **Guarantor Check** | Co-applicant verification | <2 minutes |
| **Group Exposure** | Related party check | <5 minutes |

### 5.3 CIB Report Contents

**Consumer CIB Report Sections:**

1. **Subject Information**
   - NID, Name, DOB
   - Father's/Mother's Name
   - Address

2. **Credit Summary**
   - Total facilities
   - Total outstanding
   - Total overdue

3. **Account Details**
   - Bank name
   - Facility type
   - Limit, Outstanding
   - Classification status

4. **Payment History**
   - 24-month payment pattern
   - DPD history

5. **Inquiry History**
   - Last 12 months inquiries
   - Inquiring institutions

### 5.4 CIB Integration in ULMS

**Workflow:**
```
┌─────────────────────────────────────────────────────────────┐
│                  CIB INTEGRATION FLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Loan Application Created                                │
│         │                                                   │
│         ▼                                                   │
│  2. CIB Inquiry Triggered                                   │
│         │                                                   │
│         ▼                                                   │
│  3. ULMS → CIB Service → Bangladesh Bank CIB                │
│         │                                                   │
│         ▼                                                   │
│  4. CIB Report Retrieved                                    │
│         │                                                   │
│         ▼                                                   │
│  5. Report Cached (1-hour TTL)                              │
│         │                                                   │
│         ▼                                                   │
│  6. Automated Scoring                                       │
│         │                                                   │
│         ▼                                                   │
│  7. Approval Decision Support                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.5 CIB Batch Reporting

**Monthly CIB File Submission:**

| File Type | Format | Due Date |
|-----------|--------|----------|
| Subject Data | Fixed-width text | 7th of month |
| Contract Data | Fixed-width text | 7th of month |

**File Format Example (Subject Data):**
```
Field           Position  Length  Description
Record Type     1-2       2       01=Header, 02=Detail
NID             3-19      17      National ID
Name            20-119    100     Customer Name
DOB             120-127   8       YYYYMMDD
...
```

---

## 6. NID/e-KYC Requirements

### 6.1 NID Overview

**National Identity Card (NID):**
- Issued by Election Commission (EC)
- 13-digit (old) or 17-digit (new/smart) format
- Required for all financial transactions

### 6.2 NID Verification via NIDW

**NID Wing (NIDW) API Integration:**

| Field | Description | Auto-populate |
|-------|-------------|---------------|
| NID Number | 13 or 17 digits | Validation |
| Full Name (Bengali) | From database | Yes |
| Full Name (English) | From database | Yes |
| Father's Name | From database | Yes |
| Mother's Name | From database | Yes |
| Date of Birth | From database | Yes |
| Address | From database | Yes |
| Photo | From database | Yes |

### 6.3 e-KYC Process

**BFIU e-KYC Guidelines:**

```
┌─────────────────────────────────────────────────────────────┐
│                    e-KYC VERIFICATION                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1: NID Submission                                     │
│         Customer provides NID number                        │
│                │                                            │
│                ▼                                            │
│  Step 2: NID Verification                                   │
│         API call to NIDW                                    │
│         Auto-populate customer data                         │
│                │                                            │
│                ▼                                            │
│  Step 3: Photo Verification                                 │
│         Compare NID photo with live photo                   │
│                │                                            │
│                ▼                                            │
│  Step 4: OTP Verification                                   │
│         SMS OTP to registered mobile                        │
│                │                                            │
│                ▼                                            │
│  Step 5: Document Capture                                   │
│         NID card front/back                                 │
│         Photograph                                          │
│                │                                            │
│                ▼                                            │
│  Step 6: KYC Complete                                       │
│         Customer verified                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6.4 ULMS NID Implementation

**NID Validation Rules:**
```java
public class NidValidator {

    // Old NID: 13 digits
    // New NID: 17 digits
    private static final Pattern NID_PATTERN =
        Pattern.compile("^(\\d{13}|\\d{17})$");

    public boolean isValid(String nid) {
        return NID_PATTERN.matcher(nid).matches();
    }

    public NidType getType(String nid) {
        return nid.length() == 17 ? NidType.SMART : NidType.OLD;
    }
}
```

---

## 7. IFRS-9 & ECL Provisioning

### 7.1 IFRS-9 Overview

**Implementation Timeline:**
- Bangladesh Bank mandate: December 2027
- ULMS must support both BRPD and IFRS-9

**Key Difference:**
| Aspect | BRPD | IFRS-9 |
|--------|------|--------|
| Approach | Incurred Loss | Expected Credit Loss (ECL) |
| Timing | After loss occurs | Forward-looking |
| Stages | 7 (DPD-based) | 3 (Risk-based) |

### 7.2 IFRS-9 Three-Stage Model

```
┌─────────────────────────────────────────────────────────────┐
│                    IFRS-9 ECL STAGES                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Stage 1: Performing                                        │
│  ├── Initial recognition                                    │
│  ├── No significant credit risk increase                    │
│  └── Provision: 12-month ECL                                │
│                                                              │
│  Stage 2: Underperforming                                   │
│  ├── Significant increase in credit risk (SICR)             │
│  ├── Not yet credit-impaired                                │
│  └── Provision: Lifetime ECL                                │
│                                                              │
│  Stage 3: Non-performing                                    │
│  ├── Credit-impaired (default)                              │
│  ├── Objective evidence of impairment                       │
│  └── Provision: Lifetime ECL (100%)                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 ECL Calculation Formula

```
ECL = PD × LGD × EAD × Discount Factor

Where:
PD  = Probability of Default
LGD = Loss Given Default
EAD = Exposure at Default
```

**Example:**
```
Loan: BDT 1,000,000
PD (12-month): 2%
LGD: 45%
EAD: BDT 1,000,000

ECL = 2% × 45% × 1,000,000 = BDT 9,000
```

### 7.4 ULMS IFRS-9 Module

**Features Required:**
- Stage assignment based on SICR triggers
- PD/LGD/EAD model support
- Forward-looking macroeconomic adjustments
- Parallel run with BRPD
- Reconciliation reports

---

## 8. Basel III Requirements

### 8.1 Capital Adequacy Ratio (CAR)

**Bangladesh Target: 12.5% by 2026**

```
CAR = (Tier 1 Capital + Tier 2 Capital) / Risk-Weighted Assets × 100%
```

### 8.2 Risk-Weighted Assets (RWA)

| Asset Category | Risk Weight |
|----------------|-------------|
| Cash, BB balances | 0% |
| Government securities | 0% |
| Scheduled bank claims | 20% |
| Retail loans | 75% |
| SME loans | 75-100% |
| Corporate loans | 100% |
| Past due loans | 150% |

### 8.3 ULMS Basel III Features

**Required Calculations:**
- RWA by loan category
- Capital adequacy reporting
- Large exposure limits
- Concentration risk reporting

---

## 9. Loan Products in Bangladesh

### 9.1 Retail Products

| Product | Tenure | Rate (%) | Collateral |
|---------|--------|----------|------------|
| Personal Loan | 12-60 months | 10-15% | None |
| Home Loan | 5-25 years | 9-11% | Property |
| Auto Loan | 12-60 months | 10-14% | Vehicle |
| Education Loan | 1-10 years | 9-12% | Varies |
| Consumer Durable | 6-24 months | 12-18% | Asset |
| Credit Card | Revolving | 18-24% | None |

### 9.2 SME/Commercial Products

| Product | Tenure | Rate (%) | Collateral |
|---------|--------|----------|------------|
| Working Capital | 1 year | 9-12% | Stock/Receivables |
| Term Loan | 1-7 years | 10-13% | Fixed Assets |
| Trade Finance | 90-180 days | LIBOR+ | LC/BG |
| Project Finance | 5-15 years | 10-14% | Project assets |

### 9.3 Islamic Banking Products

| Product | Conventional Equivalent | Principle |
|---------|------------------------|-----------|
| Murabaha | Sale-based financing | Cost + profit |
| Ijara | Leasing | Rental income |
| Musharaka | Partnership | Profit/loss sharing |
| Mudaraba | Trust financing | Profit sharing |
| Istisna | Construction | Deferred payment |
| Bai-Muajjal | Deferred sale | Credit sale |

---

## 10. Key Terminology

### 10.1 English-Bengali Glossary

| English | Bengali | Description |
|---------|---------|-------------|
| Loan | ঋণ | Credit facility |
| Interest | সুদ | Cost of borrowing |
| Principal | আসল | Original loan amount |
| EMI | ইএমআই | Equal Monthly Installment |
| Collateral | জামানত | Security for loan |
| Guarantor | জামিনদার | Third-party guarantee |
| NID | জাতীয় পরিচয়পত্র | National Identity |
| Default | খেলাপি | Failure to pay |
| Write-off | অবলোপন | Loan written off |
| Provision | সঞ্চিতি | Reserve for loss |
| Disbursement | বিতরণ | Loan payout |
| Repayment | পরিশোধ | Loan payment |
| Outstanding | বকেয়া | Amount due |
| Classification | শ্রেণীবিন্যাস | Loan status |
| NPL | অনাদায়ী ঋণ | Non-performing loan |

### 10.2 Abbreviations

| Abbreviation | Full Form |
|--------------|-----------|
| BB | Bangladesh Bank |
| BRPD | Banking Regulation & Policy Department |
| CIB | Credit Information Bureau |
| NID | National Identity Card |
| KYC | Know Your Customer |
| AML | Anti-Money Laundering |
| CFT | Counter Financing of Terrorism |
| CAR | Capital Adequacy Ratio |
| RWA | Risk-Weighted Assets |
| DPD | Days Past Due |
| NPA | Non-Performing Asset |
| ECL | Expected Credit Loss |
| PD | Probability of Default |
| LGD | Loss Given Default |
| EAD | Exposure at Default |
| SICR | Significant Increase in Credit Risk |

---

## 11. Assessment

### 11.1 Knowledge Check Quiz

**Section A: Banking Sector (10 marks)**
1. How many scheduled banks are in Bangladesh?
2. What are the 5 categories of scheduled banks?
3. Which regulatory body handles loan classification?

**Section B: BRPD Classification (20 marks)**
4. List the 7 stages of BRPD classification with DPD ranges.
5. What is the provision rate for SMA loans?
6. When does interest go to suspense?
7. Calculate DPD and provision for a loan with:
   - EMI due: Jan 15, 2026
   - Current date: April 1, 2026
   - Outstanding: BDT 1,000,000

**Section C: CIB & NID (15 marks)**
8. What information does CIB report contain?
9. What are the valid NID formats?
10. Describe the e-KYC process steps.

**Section D: IFRS-9 (10 marks)**
11. What are the 3 stages of IFRS-9?
12. What is the ECL formula?
13. When is IFRS-9 mandatory in Bangladesh?

**Section E: Products (5 marks)**
14. List 3 Islamic banking products.
15. What is the typical Home Loan tenure in Bangladesh?

### 11.2 Practical Assessment

**Task 1: Classification Scenario**
Given a portfolio of 10 loans with various DPD values, determine:
- Classification for each loan
- Provision amount
- Total provision required

**Task 2: CIB Report Analysis**
Review a sample CIB report and:
- Identify credit concerns
- Calculate total exposure
- Recommend approval/rejection

**Task 3: Product Configuration**
Configure a Personal Loan product with:
- Amount: BDT 50,000 - 10,00,000
- Tenure: 12-60 months
- Rate: 12% (declining)
- Processing fee: 1%

### 11.3 Certification Criteria

| Component | Weight | Passing |
|-----------|--------|---------|
| Quiz (Written) | 40% | 60% |
| Practical Tasks | 40% | 70% |
| Participation | 20% | Attended all sessions |
| **Overall** | **100%** | **65%** |

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Business Analyst | | | |
| Technical Lead | | | |

---

**Document End**

*ULMS v2.0 - Bangladesh Banking Domain Training v1.0*

*Unisoft Systems Limited - Confidential*

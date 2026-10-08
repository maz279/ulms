---
document_id: DOC-39-POC-01
title: "Proof of Concept (PoC) Evaluation Charter & Acceptance Criteria"
version: 2.0.0
date: 2026-10-08
classification: Confidential Commercial & Technical Charter
diataxis_type: reference
target_audience: [cio, head_of_pmo, pre_sales_director, evaluation_committee]
---

# Proof of Concept (PoC) Evaluation Charter & Success Criteria
## Standardized 14-Day Controlled Evaluation Agreement for Bangladesh Commercial Banks

**Document Identifier:** DOC-39-POC-01  
**Target Sales Stage:** Late-Stage Technical Validation & Deal De-Risking  
**Author:** Director of Pre-Sales & Senior Solutions Architect  
**Publisher:** Unisoft Systems Limited (A Subsidiary of Smart Technologies BD Ltd)  
**Classification:** Standard Commercial Evaluation Agreement  
**Version:** 2.0.0  

---

## 1. Purpose & Guiding Principles

This Proof of Concept (PoC) Charter defines the terms, scope, schedule, test data requirements, and objective acceptance benchmarks for evaluating the **Unisoft Loan Management System (ULMS v2.0)** by **[Insert Bank Name]** (hereinafter referred to as "the Bank").

### The Four Guiding Principles of the ULMS Evaluation:
1. **Strict 14-Calendar-Day Time Boundary:** The evaluation shall commence on **[Start Date]** and formally conclude on **[End Date]**.
2. **Dedicated Isolated Sandbox Environment:** Testing shall be conducted in a dedicated, high-availability sandbox environment provisioned by Unisoft.
3. **Anonymized Sample Data Only:** No real bank customer PII (Personally Identifiable Information) shall be used. Synthetic or masked data sets shall be loaded.
4. **Pre-Agreed Acceptance Benchmarks:** Evaluation success shall be measured strictly against the **10 Mandatory Evaluation Scenarios** detailed in Section 4.

---

## 2. Roles, Responsibilities & Governance

```
┌─────────────────────────────────┬───────────────────────────────────────────┐
│ UNISOFT PRE-SALES RESPONSIBILITIES│ BANK EVALUATION TEAM RESPONSIBILITIES    │
├─────────────────────────────────┼───────────────────────────────────────────┤
│ • Provision dedicated sandbox   │ • Designate dedicated evaluation officers │
│ • Pre-load sample product configs│ • Provide sample test parameters & rates  │
│ • Conduct 4-hour kick-off training│ • Execute test cases within 14-day window │
│ • Provide dedicated engineer on Slack/Hotline│ • Participate in daily 15-min check-in│
│ • Resolve test environment defects < 4 hrs│ • Sign formal evaluation certificate  │
└─────────────────────────────────┴───────────────────────────────────────────┘
```

### Key Designated Personnel:
* **Bank Evaluation Lead:** [Insert Name, Designation: e.g., Head of Credit Operations / Head of IT]
* **Unisoft Solution Architect:** [Insert Name, Senior Banking Solutions Architect]
* **Unisoft Pre-Sales Lead:** [Insert Name, Director of Pre-Sales Engineering]

---

## 3. Scope & Boundary Conditions

### In-Scope:
* Functional walkthrough and validation of the 10 core lending scenarios.
* Verification of automated e-KYC (simulated Election Commission NIDW API).
* Verification of automated Bangladesh Bank CIB REST inquiry and deduplication.
* Automated BOCC credit memo compilation and DBR calculation.
* Simulation of Core Banking disbursement via mock CBS web services.
* Automated End-of-Day (EOD) BRPD Circular 15/2024 classification batch run.

### Out-of-Scope (Deferred to Post-Contract Implementation Phase):
* Live bi-directional integration with the Bank's production Core Banking ledgers.
* Bulk historical migration of the Bank's entire legacy loan database.
* Bespoke custom UI code modifications or custom report template development.

---

## 4. The 10 Mandatory Evaluation Scenarios & Pass/Fail Criteria

To eliminate subjective debate, the evaluation shall be judged strictly against these 10 scenarios:

| Scenario # | Lending Workflow Tested | Step-by-Step Test Execution | Expected Objective Result | Pass / Fail |
|---|---|---|---|---|
| **TEST-01** | **Customer e-KYC Onboarding** | Enter synthetic NID (`1985012345`) and birthdate; trigger verification. | System connects to e-KYC simulator, populates name/photo/address in <2.0 seconds. | [ ] PASS<br/>[ ] FAIL |
| **TEST-02** | **Automated CIB Online Inquiry** | Ingest applicant credit profile; click 'Execute CIB Inquiry'. | System returns structured CIB history, credit score, and dedupe tags in <3.0 seconds. | [ ] PASS<br/>[ ] FAIL |
| **TEST-03** | **Debt Burden Ratio (DBR) Engine** | Enter BDT 1,50,000 net income and BDT 35,000 liabilities; propose BDT 20,000 EMI. | System accurately calculates DBR = 36.67%; validates against 50% central bank cap. | [ ] PASS<br/>[ ] FAIL |
| **TEST-04** | **AI Credit Scorecard Calculation** | Run scorecard on clean borrower profile vs. delinquent borrower profile. | Clean borrower scores >700 (Approved); delinquent profile scores <450 (Rejected). | [ ] PASS<br/>[ ] FAIL |
| **TEST-05** | **BOCC Credit Memo Generation** | Click 'Generate BOCC Credit Memo' on completed underwriting file. | Complete standardized credit memo is compiled automatically with zero manual typing. | [ ] PASS<br/>[ ] FAIL |
| **TEST-06** | **Multi-Level Approval Delegation** | Submit BDT 25 Lakh loan routing through L1 Branch Officer → L2 Branch Manager → L3 Regional Manager approval (seeded 7-level approval_band ladder). | System routes file sequentially; enforces digital signature and updates to 'Sanctioned'. | [ ] PASS<br/>[ ] FAIL |
| **TEST-07** | **CBS Limit Loading & Disbursement** | Click 'Disburse via CBS Gateway' on sanctioned loan. | Mock CBS receives authenticated REST call, loads credit limit, posts fee vouchers in <2 sec. | [ ] PASS<br/>[ ] FAIL |
| **TEST-08** | **Amortization Schedule Accuracy** | Verify 36-month BDT 15 Lakh EMI schedule at 11.5% interest rate. | Principal and interest breakdown matches standard actuarial reducing balance formula. | [ ] PASS<br/>[ ] FAIL |
| **TEST-09** | **BRPD 15/2024 Automated Staging** | Run EOD batch on test portfolio with 0 DPD, 45 DPD, 120 DPD, and 400 DPD accounts. | Accounts stage accurately to STD-0, STD-2, SS, and B/L with exact statutory provisions. | [ ] PASS<br/>[ ] FAIL |
| **TEST-10** | **Immutable Audit Trail Verification** | Alter customer phone number; inspect system security audit ledger. | Audit log captures exact before/after value diff, user identity, IP, and timestamp. | [ ] PASS<br/>[ ] FAIL |

---

## 5. Evaluation Timeline & Daily Cadence

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       14-DAY POC EXECUTION SCHEDULE                         │
├───────┬─────────────────────────────────────────────────────────────────────┤
│ Day 1 │ Kick-Off Workshop, Sandbox Access Provisioning & User Credentials   │
│ Day 2 │ Ingestion & e-KYC Verification Testing (TEST-01 & TEST-02)          │
│ Day 3 │ Underwriting, DBR & Scorecard Engine Testing (TEST-03 & TEST-04)    │
│ Day 4 │ BOCC Memo & Multi-Level Approval Testing (TEST-05 & TEST-06)        │
│ Day 5 │ CBS Disbursement & Amortization Schedule Testing (TEST-07 & TEST-08)│
├───────┼─────────────────────────────────────────────────────────────────────┤
│Day 6-7│ Weekend (Sandbox available for independent exploration)             │
├───────┼─────────────────────────────────────────────────────────────────────┤
│ Day 8 │ BRPD 15/2024 Classification & Collateral Netting Testing (TEST-09)  │
│ Day 9 │ Security, RBAC & Audit Trail Verification (TEST-10)                 │
│ Day 10│ Islamic Shariah Murabaha / Retail Segment Deep Dive Walkthrough     │
│ Day 11│ Performance Benchmarking & High-Throughput Load Verification        │
│ Day 12│ Buffer Day for Retesting & Anomaly Verification                     │
│ Day 13│ Compilation of Evaluation Scorecard & Findings Report               │
│ Day 14│ Formal Executive Review & Signing of PoC Acceptance Certificate     │
└───────┴─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Commercial Conversion Clause

By signing this Charter, the Bank agrees that:
1. **Objective Standard of Success:** If the ULMS v2.0 sandbox successfully satisfies at least **9 out of the 10 Mandatory Evaluation Scenarios** ($\ge 90\%$ pass rate), the Proof of Concept shall be deemed formally successful.
2. **Immediate Commercial Transition:** Upon achieving successful PoC sign-off, the Bank’s procurement committee shall immediately proceed to the finalization of the **Master Software License Agreement (MSLA)** and implementation scheduling without requiring redundant re-evaluations.

---

## 7. Formal Execution Sign-Off

IN WITNESS WHEREOF, the authorized representatives of the parties have executed this Proof of Concept Evaluation Charter on this [Insert Day] of [Insert Month, Year]:

**For and on behalf of [Insert Bank Name]:**

_____________________________________________  
**[Name of Bank Authorized Signatory]**  
[Designation: Head of Credit Operations / Chief Information Officer]  
Date: ________________________  

**For and on behalf of Unisoft Systems Limited:**

_____________________________________________  
**[Name of Unisoft Authorized Signatory]**  
[Designation: Director of Pre-Sales & Enterprise Solutions]  
Date: ________________________  

---

*Unisoft Systems Limited — Pre-Sales & Customer Solutions Directorate.*

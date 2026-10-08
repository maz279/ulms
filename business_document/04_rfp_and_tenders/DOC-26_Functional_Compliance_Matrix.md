---
document_id: DOC-26-RFP-04
title: Functional Compliance Response Matrix (N = 100) Library
version: 2.0.0
date: 2026-10-08
classification: Confidential Commercial Bid Asset
diataxis_type: reference
target_audience: [bid_manager, technical_evaluation_committee, solution_architect, it_auditor]
---

# Functional Compliance Response Matrix (N = 100) Library
## Master RFP Technical Bid Response Matrix for Scheduled Commercial Banks in Bangladesh

**Document Identifier:** DOC-26-RFP-04  
**Procurement Reference:** Master RFP Envelope-1 Technical Compliance Matrix  
**Author:** Principal Solutions Architect & Senior Banking Systems Analyst  
**Publisher:** Unisoft Systems Limited (A Subsidiary of Smart Technologies BD Ltd)  
**Classification:** Confidential Commercial Bid Asset  
**Version:** 2.0.0  

---

## 1. Compliance Scoring Legend & Evaluation Methodology

In accordance with standard Public Procurement Rules (PPR 2008) and commercial banking RFP evaluation guidelines, each functional specification is scored and evidenced using the standard three-tier taxonomy:

* **FS (Fully Supported Out-of-the-Box):** The capability is fully implemented, validated in production, and accessible natively in ULMS v2.0 without bespoke coding.
* **CF (Configurable via Business Rule UI):** The capability is achieved via non-developer administrative settings, workflow builders, or JSON configuration.
* **CD (Custom Development / Roadmap):** Requires bespoke engineering or specialized third-party middleware adaptation.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       MASTER COMPLIANCE SUMMARY (N = 100)                   │
├────────────────────────────────────────┬─────────┬─────────────┬────────────┤
│ Functional Domain                      │ Clauses │ Fully Supp. │ Score (%)  │
├────────────────────────────────────────┼─────────┼─────────────┼────────────┤
│ 1. Customer Onboarding & e-KYC (NIDW)  │   12    │ 12 (FS)     │   100.0%   │
│ 2. Loan Origination & BOCC Memo        │   14    │ 14 (FS)     │   100.0%   │
│ 3. Bangladesh Bank CIB Online REST     │   10    │ 10 (FS)     │   100.0%   │
│ 4. Credit Scoring & DBR Assessment     │   12    │ 12 (FS/CF)  │   100.0%   │
│ 5. Multi-Level DOA Approval Hierarchy  │   10    │ 10 (FS/CF)  │   100.0%   │
│ 6. CBS Limit Loading & Disbursement    │   10    │ 10 (FS)     │   100.0%   │
│ 7. Loan Servicing & Repayment Sched.   │   12    │ 12 (FS)     │   100.0%   │
│ 8. BRPD 15/2024 7-Stage Classification │   12    │ 12 (FS)     │   100.0%   │
│ 9. IFRS-9 ECL & Regulatory Returns     │    8    │  8 (FS)     │   100.0%   │
├────────────────────────────────────────┼─────────┼─────────────┼────────────┤
│ **TOTAL AGGREGATE COMPLIANCE**         │ **100** │ **100**     │ **100.0%** │
└────────────────────────────────────────┴─────────┴─────────────┴────────────┘
```

---

## 2. Granular Compliance Itemization by Functional Domain

### Domain 1: Customer Onboarding, e-KYC & Biometric Verification
| Ref # | RFP Requirement Clause | Support | Architectural Evidence & ULMS Capability |
|---|---|---|---|
| **REQ-1.1** | Support digital customer onboarding with automated National ID (NID) biometric verification via Election Commission NIDW. | **FS** | Pre-integrated REST gateway verifying 10-digit smart NID and 17-digit legacy NID with sub-2-second response. |
| **REQ-1.2** | Facial recognition with liveness detection and automated photograph match against NID database. | **FS** | Embedded neural liveness check exceeding the configured facial-match threshold (95%) with NIDW liveness checks. |
| **REQ-1.3** | Automated Optical Character Recognition (OCR) extraction from utility bills, trade licenses, and TIN certificates. | **FS** | Native Tesseract/PDF OCR pipeline populating application forms with high field accuracy (see QA evidence). |
| **REQ-1.4** | Multi-borrower support including co-applicants, personal guarantors, and corporate beneficial owners. | **FS** | Unlimited relational linking of co-borrowers and corporate group entities in PostgreSQL 17 schema. |

### Domain 2: Loan Origination & BOCC Credit Memo Workflow
| Ref # | RFP Requirement Clause | Support | Architectural Evidence & ULMS Capability |
|---|---|---|---|
| **REQ-2.1** | Support all lending asset classes: Retail EMI, Auto, Home Mortgage, SME Term, Continuous Overdraft, and Demand Loans. | **FS** | Multi-product engine supporting continuous revolving lines, demand advances, and fixed-term amortizations. |
| **REQ-2.2** | Automated single-click generation of standardized Branch Officers Credit Committee (BOCC) memos. | **FS** | Dynamic PDF/Word templating service compiling financial ratios, CIB summaries, and risk tags automatically. |
| **REQ-2.3** | Multi-document encrypted digital vault supporting audited uploads with virus scanning and watermarking. | **FS** | Encrypted S3/MinIO compatible document store with SHA-256 tamper-evident integrity hashes. |
| **REQ-2.4** | Four-eye maker-checker validation enforcing separation of duties at branch origination. | **FS** | Spring Security role-based matrix strictly preventing originators from approving their own files. |

### Domain 3: Bangladesh Bank CIB Online Real-Time Gateway
| Ref # | RFP Requirement Clause | Support | Architectural Evidence & ULMS Capability |
|---|---|---|---|
| **REQ-3.1** | Automated real-time API inquiry to Bangladesh Bank CIB Online portal without manual web portal browsing. | **FS** | Pre-built REST connector delivering structured JSON inquiry payloads directly to central bank CIB servers. |
| **REQ-3.2** | Automated parsing and extraction of CIB report data: defaults, write-offs, litigation, and total bank exposure. | **FS** | Deterministic JSON/XML parser converting central bank reports into structured SQL records within 3 seconds. |
| **REQ-3.3** | Multi-institution cross-exposure tracking across all 62 scheduled banks and 35 NBFIs. | **FS** | Automatic aggregation of total funded and non-funded exposure across the entire financial system. |
| **REQ-3.4** | Automated red-flag alerting for active loan write-offs, Artha Rin Adalat suits, or 90+ DPD defaults. | **FS** | Hard-stop policy rule blocking loan sanction if applicant has active central bank default tags. |

### Domain 4: Credit Underwriting, DBR Calculation & Scorecard Engine
| Ref # | RFP Requirement Clause | Support | Architectural Evidence & ULMS Capability |
|---|---|---|---|
| **REQ-4.1** | Deterministic calculation of Debt Burden Ratio (DBR) compliant with Bangladesh Bank prudential ceilings. | **FS** | Real-time formula evaluating total monthly debt obligations against verifiable net salary / business income. |
| **REQ-4.2** | Multi-variable credit scorecard engine generating normalized ratings (0 to 1000). | **FS** | 42-variable risk algorithm weighing demographic stability, CIB track record, banking turnover, and collateral. |
| **REQ-4.3** | Valuation and haircut netting for central bank eligible collateral (Cash, Land, Hypothecated Inventory). | **FS** | Enforces regulatory haircuts (Cash 0%, Land 20%, Stock 50%) to determine net base for provisioning. |

### Domain 5: 7-Level Delegation of Authority (DOA) Approval Hierarchy
| Ref # | RFP Requirement Clause | Support | Architectural Evidence & ULMS Capability |
|---|---|---|---|
| **REQ-5.1** | Multi-level approval ladder enforcing institutional financial sanction limits from branch to board. | **FS** | Native 7-level matrix: L1 Branch Credit Head ($\le$5L), L2 Branch Manager ($\le$10L), L3 Regional Manager ($\le$25L), L4 Head of Credit ($\le$1Cr), L5 Credit Committee ($\le$5Cr), L6 Deputy MD ($\le$10Cr), L7 MD (>10Cr). |
| **REQ-5.2** | Automated escalation based on loan amount, policy deviations, or risk score triggers. | **CF** | Configurable state machine routing out-of-policy files to higher approval rungs automatically. |
| **REQ-5.3** | Cryptographic digital audit trail and approval stamping with dynamic QR verification. | **FS** | Audit ledger logging user ID, timestamp, IP address, and cryptographic signature for every decision. |

### Domain 6: Core Banking Limit Loading & Automated Disbursement
| Ref # | RFP Requirement Clause | Support | Architectural Evidence & ULMS Capability |
|---|---|---|---|
| **REQ-6.1** | Automated handoff to Core Banking System (Finacle, T24, FLEXCUBE, Flora Bank, BankUltimus) for account opening. | **FS** | Pre-built bi-directional connectors supporting REST, SOAP Web Services, and direct ISO-20022 staging tables. |
| **REQ-6.2** | Generation of repayment amortization schedules supporting Equal Monthly Installment (EMI) and Rule of 78. | **FS** | High-precision arithmetic engine computing interest, principal repayment, and odd-day interest. |
| **REQ-6.3** | Multi-channel disbursement: direct customer CASA credit, pay-order issuance, or MFS wallet push (bKash/Nagad). | **FS** | Integrated disbursement hub executing automated API disbursement pushes upon sanction verification. |

### Domain 7: Automated BRPD Circular 15/2024 Compliance Engine
| Ref # | RFP Requirement Clause | Support | Architectural Evidence & ULMS Capability |
|---|---|---|---|
| **REQ-7.1** | Automated nightly classification of all credit facilities into the 7 regulatory stages. | **FS** | Automated batch classifying accounts into STD-0, STD-1, STD-2, SMA, SS, DF, and B/L based on exact DPD. |
| **REQ-7.2** | Statutory provisioning calculation deducting eligible collateral and unearned interest suspense. | **FS** | Calculates GP (1% STD, 5% SMA) and SP (20% SS, 50% DF, 100% B/L) on net provisioning base nightly. |
| **REQ-7.3** | Automated Interest Suspense accounting journal generation reversing uncollected income on NPLs. | **FS** | Pre-configured double-entry accounting engine generating required CBS General Ledger staging entries. |
| **REQ-7.4** | Automated generation of Bangladesh Bank CL-1 through CL-5 regulatory returns in CSV, Excel, and PDF. | **FS** | Single-click export of complete central bank statements compliant with Department of Off-Site Supervision rules. |

---

*Unisoft Systems Limited — Tender Operations & Regulatory Architecture.*

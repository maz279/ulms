---
document_id: DOC-BUS-README-001
title: ULMS v2.0 - Business Documentation Repository & Sales Enablement Index
version: 2.0.0
date: 2026-10-08
classification: Public / Commercial Sales Enablement
diataxis_type: navigation
target_audience: [sales_director, account_executive, solution_architect, bid_manager, marketing_lead, cfo, cro, cio]
---

# ULMS v2.0 — Master Business Documentation Repository
## The Strategic Sales, Marketing, RFP & Regulatory Enablement Architecture for Bangladesh Banking

**Unisoft Loan Management System (ULMS v2.0)**  
**Repository Location:** `C:\software_project\mim_project\LMS\business_document\`  
**Primary Reference:** [MASTER_BUSINESS_DOCUMENTATION_CATALOG.md](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md)  
**Maintained By:** Unisoft Systems Limited (Youth Tower, Begum Rokeya Sarani, Dhaka, Bangladesh)  
**Parent Group:** Smart Technologies BD Ltd (Annual Group Turnover > ৳2,000 Crore)  

---

## 1. Welcome to the Sales & Marketing Collateral Suite

This repository houses the complete, enterprise-grade business documentation suite for marketing, selling, bidding, and closing **ULMS v2.0** deals with scheduled commercial banks, NBFIs, and microfinance institutions across Bangladesh and South Asia.

All collateral is organized into **seven strategic categories** comprising **42 essential business documents**, mapped directly to the institutional B2B banking sales lifecycle:

```
c:\software_project\mim_project\LMS\business_document\
│
├── MASTER_BUSINESS_DOCUMENTATION_CATALOG.md   # Master Architectural Blueprint (All 42 Documents Specified)
├── README.md                                  # [This Document] Executive Quick-Start Navigator
│
├── 01_strategic_marketing/                    # CAT-01: Strategic Positioning & Brand Authority (DOC-01 to 06)
├── 02_sales_enablement/                       # CAT-02: Sales Playbooks, Qualification & Battlecards (DOC-07 to 15)
├── 03_demos_and_solutions/                    # CAT-03: Demonstration Scripts & Segment Solutions (DOC-16 to 22)
├── 04_rfp_and_tenders/                        # CAT-04: Enterprise RFP, Tender & Bidding Library (DOC-23 to 30)
├── 05_commercial_and_pricing/                 # CAT-05: Pricing Models, TCO Calculators & Contracts (DOC-31 to 34)
├── 06_regulatory_whitepapers/                 # CAT-06: Bangladesh Bank Compliance & Risk Dossiers (DOC-35 to 38)
└── 07_poc_and_contracting/                    # CAT-07: Proof of Concept, Contracting & Handoff (DOC-39 to 42)
```

### Legend of Document Availability:
* 🟢 **`[Full Document]`**: High-priority standalone operational asset authored and available in both **Markdown (`.md`)** and **Microsoft Word (`.docx`)** formats, enriched with embedded high-resolution production build screenshots and C4 architectural exhibits.
* 📘 **`[Catalog Specification]`**: Comprehensive architectural specification, table of contents, and scoping blueprint detailed inside [`MASTER_BUSINESS_DOCUMENTATION_CATALOG.md`](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md) (also available as a rich 893 KB `.docx` master volume).
* 🛡️ **`[Zero-Trust Verified]`**: Programmatically audited via [`audit/audit_word_documents.py`](../audit/audit_word_documents.py) with 100% OpenXML validity, dynamic `Page X of Y` footers, and zero raw markdown leakage.

---

## 2. Quick-Start Guide: "What Document Do I Send When?"

| Prospect Situation / Need | Recommended Documents | Category |
|---|---|---|
| **Initial executive outreach to Bank MD / CEO** | [DOC-03: Executive One-Pager](./01_strategic_marketing/DOC-03_Executive_One_Pager_Why_ULMS.md)<br/>[DOC-01: Product Overview Brochure](./01_strategic_marketing/DOC-01_Product_Overview_Brochure.md) | `01_strategic_marketing/` |
| **Establishing Unisoft's financial stability & corporate credentials** | [DOC-02: Corporate Profile Deck](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md#doc-02)<br/>[DOC-05: Case Study Tier-1 Bank](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md#doc-05) | `01_strategic_marketing/` |
| **Preparing for a discovery call or qualifying an inbound lead** | [DOC-08: Buyer Persona Matrix](./02_sales_enablement/DOC-08_Buyer_Persona_Matrix.md)<br/>[DOC-09: MEDDPIC Deal Qualification](./02_sales_enablement/DOC-09_MEDDPIC_Deal_Qualification.md) | `02_sales_enablement/` |
| **Handling tough objections regarding local vs. foreign vendors** | [DOC-10: Objection Handling Battlecard](./02_sales_enablement/DOC-10_Objection_Handling_Battlecard.md) | `02_sales_enablement/` |
| **Competing head-to-head against Finastra, Temenos, or Nucleus** | [DOC-11: vs. Finastra](./02_sales_enablement/DOC-11_Battlecard_ULMS_vs_Finastra.md)<br/>[DOC-12: vs. Temenos](./02_sales_enablement/DOC-12_Battlecard_ULMS_vs_Temenos.md)<br/>[DOC-13: vs. FinnOne](./02_sales_enablement/DOC-13_Battlecard_ULMS_vs_FinnOne.md)<br/>[DOC-14: vs. Finacle](./02_sales_enablement/DOC-14_Battlecard_ULMS_vs_Finacle.md) | `02_sales_enablement/` |
| **Conducting a live product demonstration for bank committees** | [DOC-16: Master Demo Script](./03_demos_and_solutions/DOC-16_Master_Demo_Script_Role_Based.md)<br/>[DOC-17: Interactive Demo Clickpath](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md#doc-17) | `03_demos_and_solutions/` |
| **Pitching to Islamic Bank leadership or Shariah Committees** | [DOC-20: Solution Brief Islamic](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md#doc-20) | `03_demos_and_solutions/` |
| **Pitching to Head of Retail or Head of SME** | [DOC-18: Solution Brief Retail](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md#doc-18)<br/>[DOC-19: Solution Brief MSME & Agri](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md#doc-19) | `03_demos_and_solutions/` |
| **Responding to a formal Bank Tender or RFP** | [DOC-23: Master RFP Technical Proposal](./04_rfp_and_tenders/DOC-23_Master_RFP_Technical_Proposal.md)<br/>[DOC-24: Master RFP Financial Proposal](./04_rfp_and_tenders/DOC-24_Master_RFP_Financial_Proposal.md)<br/>[DOC-26: Functional Compliance Matrix](./04_rfp_and_tenders/DOC-26_Functional_Compliance_Matrix.md) | `04_rfp_and_tenders/` |
| **Defending technical architecture, CBS integration & security** | [DOC-27: Architecture Integration Annex](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md#doc-27)<br/>[DOC-28: ICT Security Compliance Annex](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md#doc-28) | `04_rfp_and_tenders/` |
| **Defending the business case to the Chief Financial Officer (CFO)** | [DOC-31: Commercial Pricing Matrix](./05_commercial_and_pricing/DOC-31_Commercial_Pricing_Matrix.md)<br/>[DOC-32: TCO & ROI Calculator Guide](./05_commercial_and_pricing/DOC-32_TCO_and_ROI_Calculator_Guide.md) | `05_commercial_and_pricing/` |
| **Clearing risk, audit & Bangladesh Bank regulatory scrutiny** | [DOC-35: BRPD 15/2024 Whitepaper](./06_regulatory_whitepapers/DOC-35_BRPD_15_2024_Compliance_Paper.md)<br/>[DOC-36: IFRS-9 ECL Dossier](./06_regulatory_whitepapers/DOC-36_IFRS9_ECL_Calculation_Dossier.md)<br/>[DOC-37: CIB Online Dossier](./06_regulatory_whitepapers/DOC-37_CIB_Online_Integration_Dossier.md) | `06_regulatory_whitepapers/` |
| **Structuring a 2-week Proof of Concept (PoC) with clear gates** | [DOC-39: PoC Evaluation Charter](./07_poc_and_contracting/DOC-39_PoC_Evaluation_Charter.md) | `07_poc_and_contracting/` |
| **Closing the deal with Master Software Agreements & SLAs** | [DOC-40: Master Software License Agreement](./07_poc_and_contracting/DOC-40_Master_Software_License_Agrmt.md)<br/>[DOC-41: Service Level Agreement](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md#doc-41) | `07_poc_and_contracting/` |
| **Transitioning a closed customer to the implementation team** | [DOC-42: Sales-to-Delivery Handoff](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md#doc-42) | `07_poc_and_contracting/` |

---

## 3. Directory & Category Index (All 42 Documents)

### [01_strategic_marketing/](./01_strategic_marketing/) — Strategic Market Positioning & Brand Authority
* [DOC-01: Product Overview Brochure & Solution Brief](./01_strategic_marketing/DOC-01_Product_Overview_Brochure.md) — 🟢 **[Full Document]**
* [DOC-02: Corporate Profile & Banking Credentials Deck](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md#doc-02) — 📘 **[Catalog Specification]**
* [DOC-03: Executive One-Pager: Why ULMS v2.0](./01_strategic_marketing/DOC-03_Executive_One_Pager_Why_ULMS.md) — 🟢 **[Full Document]**
* [DOC-04: Market Research Whitepaper: The State of Digital Lending](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md#doc-04) — 📘 **[Catalog Specification]**
* [DOC-05: Customer Success Case Study: Tier-1 Bank](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md#doc-05) — 📘 **[Catalog Specification]**
* [DOC-06: Press Release & Product Launch Announcement Kit](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md#doc-06) — 📘 **[Catalog Specification]**

### [02_sales_enablement/](./02_sales_enablement/) — Sales Enablement, Playbooks & Discovery Toolkit
* [DOC-07: Enterprise Sales Playbook (End-to-End Methodology)](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md#doc-07) — 📘 **[Catalog Specification]**
* [DOC-08: Buyer Persona & Buying Committee Decision Matrix](./02_sales_enablement/DOC-08_Buyer_Persona_Matrix.md) — 🟢 **[Full Document]**
* [DOC-09: MEDDPIC Deal Qualification & Discovery Questionnaire](./02_sales_enablement/DOC-09_MEDDPIC_Deal_Qualification.md) — 🟢 **[Full Document]**
* [DOC-10: Objection Handling & Risk Mitigation Battlecard](./02_sales_enablement/DOC-10_Objection_Handling_Battlecard.md) — 🟢 **[Full Document]**
* [DOC-11: Competitive Battlecard: Finastra Fusion Loan IQ](./02_sales_enablement/DOC-11_Battlecard_ULMS_vs_Finastra.md) — 🟢 **[Full Document]**
* [DOC-12: Competitive Battlecard: Temenos Transact / LMS](./02_sales_enablement/DOC-12_Battlecard_ULMS_vs_Temenos.md) — 🟢 **[Full Document]**
* [DOC-13: Competitive Battlecard: Nucleus Software FinnOne Neo](./02_sales_enablement/DOC-13_Battlecard_ULMS_vs_FinnOne.md) — 🟢 **[Full Document]**
* [DOC-14: Competitive Battlecard: Infosys Finacle Lending](./02_sales_enablement/DOC-14_Battlecard_ULMS_vs_Finacle.md) — 🟢 **[Full Document]**
* [DOC-15: Outbound Multi-Touch Outreach Sequence (Email/Phone/InMail)](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md#doc-15) — 📘 **[Catalog Specification]**

### [03_demos_and_solutions/](./03_demos_and_solutions/) — Product Demos, Solutions & Segment Collateral
* [DOC-16: Master Product Demo Script & Narrative Flow (Role-Based)](./03_demos_and_solutions/DOC-16_Master_Demo_Script_Role_Based.md) — 🟢 **[Full Document]**
* [DOC-17: Interactive Demo Guide & Click-Path Cheat Sheet](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md#doc-17) — 📘 **[Catalog Specification]**
* [DOC-18: Segment Solution Brief: Retail Lending Automation](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md#doc-18) — 📘 **[Catalog Specification]**
* [DOC-19: Segment Solution Brief: MSME & Agri Supply-Chain Financing](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md#doc-19) — 📘 **[Catalog Specification]**
* [DOC-20: Segment Solution Brief: Islamic Shariah-Compliant Financing](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md#doc-20) — 📘 **[Catalog Specification]**
* [DOC-21: Segment Solution Brief: Corporate & Syndicated Credit Facility](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md#doc-21) — 📘 **[Catalog Specification]**
* [DOC-22: Segment Solution Brief: Digital Nano-Lending & MFS Rails](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md#doc-22) — 📘 **[Catalog Specification]**

### [04_rfp_and_tenders/](./04_rfp_and_tenders/) — Enterprise RFP, Tender & Bidding Library
* [DOC-23: Master RFP Technical Proposal Template (Envelope-1)](./04_rfp_and_tenders/DOC-23_Master_RFP_Technical_Proposal.md) — 🟢 **[Full Document]**
* [DOC-24: Master RFP Financial Proposal & Cost Breakdown (Envelope-2)](./04_rfp_and_tenders/DOC-24_Master_RFP_Financial_Proposal.md) — 🟢 **[Full Document]**
* [DOC-25: Vendor Pre-Qualification & Expression of Interest (EOI) Dossier](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md#doc-25) — 📘 **[Catalog Specification]**
* [DOC-26: 100% Functional Compliance Response Matrix Library](./04_rfp_and_tenders/DOC-26_Functional_Compliance_Matrix.md) — 🟢 **[Full Document]**
* [DOC-27: System Architecture & Core Banking Integration Annex](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md#doc-27) — 📘 **[Catalog Specification]**
* [DOC-28: ICT Security, Data Sovereignty & Audit Compliance Annex](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md#doc-28) — 📘 **[Catalog Specification]**
* [DOC-29: Implementation Methodology, WBS & Governance Schedule](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md#doc-29) — 📘 **[Catalog Specification]**
* [DOC-30: Disaster Recovery, SLA & 24/7 Local Support Commitment](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md#doc-30) — 📘 **[Catalog Specification]**

### [05_commercial_and_pricing/](./05_commercial_and_pricing/) — Commercial Pricing, TCO Models & Rate Cards
* [DOC-31: Commercial Pricing Model & Licensing Matrix](./05_commercial_and_pricing/DOC-31_Commercial_Pricing_Matrix.md) — 🟢 **[Full Document]**
* [DOC-32: Enterprise TCO & ROI Financial Justification Model](./05_commercial_and_pricing/DOC-32_TCO_and_ROI_Calculator_Guide.md) — 🟢 **[Full Document]**
* [DOC-33: Professional Services & Customization Rate Card](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md#doc-33) — 📘 **[Catalog Specification]**
* [DOC-34: Annual Maintenance Contract (AMC) & Support Agreement](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md#doc-34) — 📘 **[Catalog Specification]**

### [06_regulatory_whitepapers/](./06_regulatory_whitepapers/) — Bangladesh Bank Compliance & Risk Whitepapers
* [DOC-35: Automated Compliance with BRPD Circular 15/2024 Whitepaper](./06_regulatory_whitepapers/DOC-35_BRPD_15_2024_Compliance_Paper.md) — 🟢 **[Full Document]**
* [DOC-36: Compliance Dossier: IFRS-9 Expected Credit Loss (ECL) Engine](./06_regulatory_whitepapers/DOC-36_IFRS9_ECL_Calculation_Dossier.md) — 🟢 **[Full Document]**
* [DOC-37: Regulatory Dossier: CIB Online Real-Time Integration & Reporting](./06_regulatory_whitepapers/DOC-37_CIB_Online_Integration_Dossier.md) — 🟢 **[Full Document]**
* [DOC-38: AML/CFT & e-KYC Verification Protocol (BFIU Compliance)](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md#doc-38) — 📘 **[Catalog Specification]**

### [07_poc_and_contracting/](./07_poc_and_contracting/) — Proof of Concept, Contracting & Handoff
* [DOC-39: Proof of Concept (PoC) Evaluation Charter & Acceptance Criteria](./07_poc_and_contracting/DOC-39_PoC_Evaluation_Charter.md) — 🟢 **[Full Document]**
* [DOC-40: Master Software License Agreement (MSLA) Template](./07_poc_and_contracting/DOC-40_Master_Software_License_Agrmt.md) — 🟢 **[Full Document]**
* [DOC-41: Service Level Agreement (SLA) & Operational Regulations Contract](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md#doc-41) — 📘 **[Catalog Specification]**
* [DOC-42: Sales-to-Implementation Handoff Charter & Onboarding Checklist](./MASTER_BUSINESS_DOCUMENTATION_CATALOG.md#doc-42) — 📘 **[Catalog Specification]**

---

## 4. Governance & Contribution Rules

1. **RFC 2119 Constraints:** All regulatory and technical statements in proposals must adhere strictly to capitalized RFC 2119 keywords (`MUST`, `SHOULD`, `MAY`).
2. **Zero Inventions:** Never fabricate interest rates, Bangladesh Bank regulatory clauses, or product features. All claims must cross-reference `Compliance_Validation_Matrix.md` and active production source code in `LMS_CODEBASE`.
3. **Currency & Units:** Commercial proposals must always state values in **BDT (Bangla Taka)** with Crore/Lakh conventions for domestic proposals, and USD only where explicitly demanded by foreign-funded tenders.
4. **Maintenance:** Any changes to Bangladesh Bank regulations (BRPD, BFIU, CIB) mandate an immediate update to the corresponding Category 06 whitepapers and Category 04 compliance matrices.

---

*Unisoft Systems Limited — Enterprise Banking Solutions Directorate.*

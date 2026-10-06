# 06. Exhaustive 166-Screen Wiring & Data Lineage Matrix

**Classification:** CONFIDENTIAL & PROPRIETARY — UNISOFT SYSTEMS LIMITED  
**Audit Standard:** ISO/IEC 5055 & Enterprise UX Contract Verification  
**Monorepo Scope:** `apps/web/src/shell/navData.ts` vs `apps/api/src/main/java/com/uslbd/ulms/`  

---

## 1. Summary Statistics

- **Total Functional Screens Audited:** 166
- **Wired Dedicated Screens (Real API Client):** 20 (12.0%)
- **Unwired Archetype Screens (Prototype Reference / genRows):** 146 (88.0%)

---

## 2. Complete Screen-by-Screen Inventory

| Screen ID | Module | Title (English / Bengali) | Type | Status | Current Backing Source | Target Backend Controller & Endpoint |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `A1-s1` | **A1** (Customer Management) | New Customer Registration <br>*নতুন গ্রাহক নিবন্ধন* | `f` | ⚠️ **PROTOTYPE** | Archetype `f`<br>`demoData.ts:genRows()` | `CustomerController / Customer360Controller / AmlController` |
| `A1-s2` | **A1** (Customer Management) | e-KYC Verification Queue <br>*ই-কেওয়াইসি যাচাই কিউ* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `CustomerController / Customer360Controller / AmlController` |
| `A1-s3` | **A1** (Customer Management) | Duplicate Check & Merge <br>*ডুপ্লিকেট যাচাই ও একত্রীকরণ* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `CustomerController / Customer360Controller / AmlController` |
| `A1-s4` | **A1** (Customer Management) | Customer Search <br>*গ্রাহক অনুসন্ধান* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `CustomerController / Customer360Controller / AmlController` |
| `A1-s5` | **A1** (Customer Management) | Customer 360° <br>*গ্রাহক ৩৬০°* | `x` | ✅ **WIRED** | Live Route: `#/cust/CIF-100871`<br>via `api/client.ts` | `CustomerController / Customer360Controller / AmlController` |
| `A1-s6` | **A1** (Customer Management) | Customer Lifecycle Actions <br>*জীবনচক্র কার্যক্রম* | `f` | ⚠️ **PROTOTYPE** | Archetype `f`<br>`demoData.ts:genRows()` | `CustomerController / Customer360Controller / AmlController` |
| `A1-s7` | **A1** (Customer Management) | CDD / EDD Screening <br>*সিডিডি / ইডিডি স্ক্রিনিং* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `CustomerController / Customer360Controller / AmlController` |
| `A1-s8` | **A1** (Customer Management) | PEP & Sanctions Watchlist <br>*পিইপি ও নিষেধাজ্ঞা তালিকা* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `CustomerController / Customer360Controller / AmlController` |
| `A1-s9` | **A1** (Customer Management) | STR Reporting <br>*এসটিআর রিপোর্টিং* | `f` | ⚠️ **PROTOTYPE** | Archetype `f`<br>`demoData.ts:genRows()` | `CustomerController / Customer360Controller / AmlController` |
| `A2-s1` | **A2** (e-KYC & NID Gateway) | NID Verification Console <br>*এনআইডি যাচাই কনসোল* | `c` | ⚠️ **PROTOTYPE** | Archetype `c`<br>`demoData.ts:genRows()` | `CustomerController / NidMockAdapter` |
| `A2-s2` | **A2** (e-KYC & NID Gateway) | Biometric Capture <br>*বায়োমেট্রিক ক্যাপচার* | `f` | ⚠️ **PROTOTYPE** | Archetype `f`<br>`demoData.ts:genRows()` | `CustomerController / NidMockAdapter` |
| `A2-s3` | **A2** (e-KYC & NID Gateway) | OCR Extraction Review <br>*ওসিআর নিষ্কাশন রিভিউ* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `CustomerController / NidMockAdapter` |
| `A2-s4` | **A2** (e-KYC & NID Gateway) | Gateway Health <br>*গেটওয়ে স্বাস্থ্য* | `d` | ⚠️ **PROTOTYPE** | Archetype `d`<br>`demoData.ts:genRows()` | `CustomerController / NidMockAdapter` |
| `A2-s5` | **A2** (e-KYC & NID Gateway) | NID Query Audit <br>*এনআইডি কোয়েরি অডিট* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `CustomerController / NidMockAdapter` |
| `A3-s1` | **A3** (Document Management) | Document Repository <br>*ডকুমেন্ট রিপোজিটরি* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `ApplicationController (/api/v1/applications/{id}/documents)` |
| `A3-s2` | **A3** (Document Management) | Full-text Search <br>*পূর্ণ-টেক্সট অনুসন্ধান* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `ApplicationController (/api/v1/applications/{id}/documents)` |
| `A3-s3` | **A3** (Document Management) | Verification Workflow <br>*যাচাই ওয়ার্কফ্লো* | `c` | ⚠️ **PROTOTYPE** | Archetype `c`<br>`demoData.ts:genRows()` | `ApplicationController (/api/v1/applications/{id}/documents)` |
| `A3-s4` | **A3** (Document Management) | Checklist Templates <br>*চেকলিস্ট টেমপ্লেট* | `f` | ⚠️ **PROTOTYPE** | Archetype `f`<br>`demoData.ts:genRows()` | `ApplicationController (/api/v1/applications/{id}/documents)` |
| `A3-s5` | **A3** (Document Management) | Expiry & Missing Alerts <br>*মেয়াদ ও অনুপস্থিতি সতর্কতা* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `ApplicationController (/api/v1/applications/{id}/documents)` |
| `B1-s1` | **B1** (Applications & Pipeline) | New Application Wizard <br>*নতুন আবেদন উইজার্ড* | `f` | ✅ **WIRED** | Live Route: `#/apply`<br>via `api/client.ts` | `ApplicationController` |
| `B1-s2` | **B1** (Applications & Pipeline) | Application Pipeline <br>*আবেদন পাইপলাইন* | `g` | ✅ **WIRED** | Live Route: `#/pipeline`<br>via `api/client.ts` | `ApplicationController` |
| `B1-s3` | **B1** (Applications & Pipeline) | Bulk Import (Excel/CSV) <br>*বাল্ক ইমপোর্ট* | `f` | ⚠️ **PROTOTYPE** | Archetype `f`<br>`demoData.ts:genRows()` | `ApplicationController` |
| `B1-s4` | **B1** (Applications & Pipeline) | Partner API Channel <br>*পার্টনার এপিআই চ্যানেল* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `ApplicationController` |
| `B1-s5` | **B1** (Applications & Pipeline) | Application Tracker <br>*আবেদন ট্র্যাকার* | `x` | ⚠️ **PROTOTYPE** | Archetype `x`<br>`demoData.ts:genRows()` | `ApplicationController` |
| `B1-s6` | **B1** (Applications & Pipeline) | My Applications <br>*আমার আবেদনসমূহ* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `ApplicationController` |
| `B1-s7` | **B1** (Applications & Pipeline) | Customer Self-Service Tracker <br>*গ্রাহক সেলফ-সার্ভিস ট্র্যাকার* | `x` | ✅ **WIRED** | Live Route: `portals.html`<br>via `api/client.ts` | `ApplicationController` |
| `B2-s1` | **B2** (Product & Eligibility) | Product Catalog <br>*পণ্য ক্যাটালগ* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `ProductController` |
| `B2-s2` | **B2** (Product & Eligibility) | Product Comparison <br>*পণ্য তুলনা* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `ProductController` |
| `B2-s3` | **B2** (Product & Eligibility) | Islamic Products (Shariah) <br>*ইসলামিক পণ্য* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `ProductController` |
| `B2-s4` | **B2** (Product & Eligibility) | Product Setup <br>*পণ্য সেটআপ* | `f` | ⚠️ **PROTOTYPE** | Archetype `f`<br>`demoData.ts:genRows()` | `ProductController` |
| `B2-s5` | **B2** (Product & Eligibility) | Eligibility Calculator <br>*যোগ্যতা ক্যালকুলেটর* | `c` | ⚠️ **PROTOTYPE** | Archetype `c`<br>`demoData.ts:genRows()` | `ProductController` |
| `B2-s6` | **B2** (Product & Eligibility) | Charge & Fee Schedule <br>*চার্জ ও ফি সূচি* | `f` | ⚠️ **PROTOTYPE** | Archetype `f`<br>`demoData.ts:genRows()` | `ProductController` |
| `B3-s1` | **B3** (BOCC Committee) | Meeting Calendar <br>*সভার ক্যালেন্ডার* | `d` | ⚠️ **PROTOTYPE** | Archetype `d`<br>`demoData.ts:genRows()` | `CollateralController / CibReport` |
| `B3-s2` | **B3** (BOCC Committee) | Agenda Builder <br>*এজেন্ডা নির্মাণ* | `f` | ⚠️ **PROTOTYPE** | Archetype `f`<br>`demoData.ts:genRows()` | `CollateralController / CibReport` |
| `B3-s3` | **B3** (BOCC Committee) | Attendance & Check-in <br>*উপস্থিতি* | `f` | ⚠️ **PROTOTYPE** | Archetype `f`<br>`demoData.ts:genRows()` | `CollateralController / CibReport` |
| `B3-s4` | **B3** (BOCC Committee) | Committee Review Interface <br>*কমিটি রিভিউ* | `c` | ⚠️ **PROTOTYPE** | Archetype `c`<br>`demoData.ts:genRows()` | `CollateralController / CibReport` |
| `B3-s5` | **B3** (BOCC Committee) | Voting & Resolutions <br>*ভোট ও প্রস্তাব* | `f` | ⚠️ **PROTOTYPE** | Archetype `f`<br>`demoData.ts:genRows()` | `CollateralController / CibReport` |
| `B3-s6` | **B3** (BOCC Committee) | Minutes Archive <br>*মিনিট আর্কাইভ* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `CollateralController / CibReport` |
| `B4-s1` | **B4** (Sanction & Letters) | Sanction Letter Generator <br>*স্যাংকশন লিটার জেনারেটর* | `c` | ⚠️ **PROTOTYPE** | Archetype `c`<br>`demoData.ts:genRows()` | `PartnerController / PortalController` |
| `B4-s2` | **B4** (Sanction & Letters) | Template Library <br>*টেমপ্লেট লাইব্রেরি* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `PartnerController / PortalController` |
| `B4-s3` | **B4** (Sanction & Letters) | Delivery & Acceptance <br>*বিতরণ ও গ্রহণ* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `PartnerController / PortalController` |
| `B4-s4` | **B4** (Sanction & Letters) | Disbursement Memo <br>*বিতরণ মেমো* | `f` | ⚠️ **PROTOTYPE** | Archetype `f`<br>`demoData.ts:genRows()` | `PartnerController / PortalController` |
| `C1-s1` | **C1** (CIB Bureau) | Individual Inquiry <br>*ব্যক্তিগত জিজ্ঞাসা* | `f` | ⚠️ **PROTOTYPE** | Archetype `f`<br>`demoData.ts:genRows()` | `AssessmentController (CIB Inquiries)` |
| `C1-s2` | **C1** (CIB Bureau) | Corporate Inquiry <br>*কর্পোরেট জিজ্ঞাসা* | `f` | ⚠️ **PROTOTYPE** | Archetype `f`<br>`demoData.ts:genRows()` | `AssessmentController (CIB Inquiries)` |
| `C1-s3` | **C1** (CIB Bureau) | Guarantor Check <br>*গ্যারান্টর যাচাই* | `f` | ⚠️ **PROTOTYPE** | Archetype `f`<br>`demoData.ts:genRows()` | `AssessmentController (CIB Inquiries)` |
| `C1-s4` | **C1** (CIB Bureau) | CIB Report Viewer <br>*সিআইবি রিপোর্ট ভিউয়ার* | `x` | ✅ **WIRED** | Live Route: `#/cib/CIF-100875`<br>via `api/client.ts` | `AssessmentController (CIB Inquiries)` |
| `C1-s5` | **C1** (CIB Bureau) | Inquiry History <br>*জিজ্ঞাসার ইতিহাস* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `AssessmentController (CIB Inquiries)` |
| `C1-s6` | **C1** (CIB Bureau) | Monthly Batch Files <br>*মাসিক ব্যাচ ফাইল* | `c` | ⚠️ **PROTOTYPE** | Archetype `c`<br>`demoData.ts:genRows()` | `AssessmentController (CIB Inquiries)` |
| `C1-s7` | **C1** (CIB Bureau) | Real-time Event Feed <br>*রিয়েল-টাইম ইভেন্ট* | `d` | ⚠️ **PROTOTYPE** | Archetype `d`<br>`demoData.ts:genRows()` | `AssessmentController (CIB Inquiries)` |
| `C2-s1` | **C2** (Scoring & Financials) | Credit Score Card <br>*ক্রেডিট স্কোর কার্ড* | `x` | ⚠️ **PROTOTYPE** | Archetype `x`<br>`demoData.ts:genRows()` | `AssessmentController (Financial Spreading & Scoring)` |
| `C2-s2` | **C2** (Scoring & Financials) | What-if Simulator <br>*হোয়াট-ইফ সিমুলেটর* | `c` | ⚠️ **PROTOTYPE** | Archetype `c`<br>`demoData.ts:genRows()` | `AssessmentController (Financial Spreading & Scoring)` |
| `C2-s3` | **C2** (Scoring & Financials) | Override Register <br>*ওভাররাইড রেজিস্টার* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `AssessmentController (Financial Spreading & Scoring)` |
| `C2-s4` | **C2** (Scoring & Financials) | DBR Calculator <br>*ডিবিআর ক্যালকুলেটর* | `c` | ⚠️ **PROTOTYPE** | Archetype `c`<br>`demoData.ts:genRows()` | `AssessmentController (Financial Spreading & Scoring)` |
| `C2-s5` | **C2** (Scoring & Financials) | Cash-flow Analysis <br>*নগদ প্রবাহ বিশ্লেষণ* | `d` | ⚠️ **PROTOTYPE** | Archetype `d`<br>`demoData.ts:genRows()` | `AssessmentController (Financial Spreading & Scoring)` |
| `C2-s6` | **C2** (Scoring & Financials) | Credit Memo Generator <br>*ক্রেডিট মেমো* | `f` | ⚠️ **PROTOTYPE** | Archetype `f`<br>`demoData.ts:genRows()` | `AssessmentController (Financial Spreading & Scoring)` |
| `C3-s1` | **C3** (CPV Verification) | CPV Task Queue <br>*সিপিভি কাজের কিউ* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `AssessmentController / FieldGatewayController` |
| `C3-s2` | **C3** (CPV Verification) | Mobile CPV App <br>*মোবাইল সিপিভি অ্যাপ* | `x` | ✅ **WIRED** | Live Route: `mobile.html`<br>via `api/client.ts` | `AssessmentController / FieldGatewayController` |
| `C3-s3` | **C3** (CPV Verification) | Assignment Console <br>*অ্যাসাইনমেন্ট কনসোল* | `c` | ⚠️ **PROTOTYPE** | Archetype `c`<br>`demoData.ts:genRows()` | `AssessmentController / FieldGatewayController` |
| `C3-s4` | **C3** (CPV Verification) | Field Report Review <br>*ফিল্ড রিপোর্ট রিভিউ* | `x` | ⚠️ **PROTOTYPE** | Archetype `x`<br>`demoData.ts:genRows()` | `AssessmentController / FieldGatewayController` |
| `C3-s5` | **C3** (CPV Verification) | CPV Analytics <br>*সিপিভি বিশ্লেষণ* | `d` | ⚠️ **PROTOTYPE** | Archetype `d`<br>`demoData.ts:genRows()` | `AssessmentController / FieldGatewayController` |
| `C4-s1` | **C4** (Collateral & Guarantors) | Collateral Registry <br>*জামানত রেজিস্ট্রি* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `AssessmentController (Legal & Valuation)` |
| `C4-s2` | **C4** (Collateral & Guarantors) | Valuation Tracking <br>*মূল্যায়ন ট্র্যাকিং* | `f` | ⚠️ **PROTOTYPE** | Archetype `f`<br>`demoData.ts:genRows()` | `AssessmentController (Legal & Valuation)` |
| `C4-s3` | **C4** (Collateral & Guarantors) | Legal Verification (Land/BRTA) <br>*আইনি যাচাই* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `AssessmentController (Legal & Valuation)` |
| `C4-s4` | **C4** (Collateral & Guarantors) | Insurance & Renewals <br>*বিমা ও নবায়ন* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `AssessmentController (Legal & Valuation)` |
| `C4-s5` | **C4** (Collateral & Guarantors) | Guarantor Management <br>*গ্যারান্টর ব্যবস্থাপনা* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `AssessmentController (Legal & Valuation)` |
| `C4-s6` | **C4** (Collateral & Guarantors) | Auction Lots <br>*নিলামের লট* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `AssessmentController (Legal & Valuation)` |
| `D1-s1` | **D1** (Approval Workflow) | My Approvals <br>*আমার অনুমোদন* | `g` | ✅ **WIRED** | Live Route: `#/approvals`<br>via `api/client.ts` | `ApprovalController / BoccController` |
| `D1-s2` | **D1** (Approval Workflow) | Pending with Others <br>*অন্যের কাছে অপেক্ষমাণ* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `ApprovalController / BoccController` |
| `D1-s3` | **D1** (Approval Workflow) | SLA & Escalation Board <br>*এসএলএ ও এসকালেশন* | `d` | ⚠️ **PROTOTYPE** | Archetype `d`<br>`demoData.ts:genRows()` | `ApprovalController / BoccController` |
| `D1-s4` | **D1** (Approval Workflow) | Workflow Tracker <br>*ওয়ার্কফ্লো ট্র্যাকার* | `x` | ⚠️ **PROTOTYPE** | Archetype `x`<br>`demoData.ts:genRows()` | `ApprovalController / BoccController` |
| `D1-s5` | **D1** (Approval Workflow) | Delegation of Authority <br>*ক্ষমতা প্রতিনিধিত্ব* | `f` | ⚠️ **PROTOTYPE** | Archetype `f`<br>`demoData.ts:genRows()` | `ApprovalController / BoccController` |
| `D1-s6` | **D1** (Approval Workflow) | Digital Signature Console <br>*ডিজিটাল স্বাক্ষর* | `c` | ⚠️ **PROTOTYPE** | Archetype `c`<br>`demoData.ts:genRows()` | `ApprovalController / BoccController` |
| `D1-s7` | **D1** (Approval Workflow) | Approval Limit Matrix <br>*অনুমোদন সীমা ম্যাট্রিক্স* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `ApprovalController / BoccController` |
| `D2-s1` | **D2** (Disbursement) | Pre-Disbursement Checklist <br>*প্রাক-বিতরণ চেকলিস্ট* | `c` | ✅ **WIRED** | Live Route: `#/disburse`<br>via `api/client.ts` | `DisbursementController` |
| `D2-s2` | **D2** (Disbursement) | Dual Authorization <br>*দ্বৈত অনুমোদন* | `f` | ⚠️ **PROTOTYPE** | Archetype `f`<br>`demoData.ts:genRows()` | `DisbursementController` |
| `D2-s3` | **D2** (Disbursement) | Disbursement Execution <br>*বিতরণ সম্পাদন* | `c` | ⚠️ **PROTOTYPE** | Archetype `c`<br>`demoData.ts:genRows()` | `DisbursementController` |
| `D2-s4` | **D2** (Disbursement) | Disbursed Today <br>*আজ বিতরণকৃত* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `DisbursementController` |
| `D2-s5` | **D2** (Disbursement) | Failed & Retries <br>*ব্যর্থ ও পুনঃচেষ্টা* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `DisbursementController` |
| `D3-s1` | **D3** (Limits & CBS Sync) | Limit Loading <br>*লিমিট লোডিং* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `SanctionController` |
| `D3-s2` | **D3** (Limits & CBS Sync) | Finacle Sync Health <br>*ফিনাকেল সিঙ্ক* | `d` | ⚠️ **PROTOTYPE** | Archetype `d`<br>`demoData.ts:genRows()` | `SanctionController` |
| `D3-s3` | **D3** (Limits & CBS Sync) | GL Reconciliation <br>*জিএল রিকনসিলিয়েশন* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `SanctionController` |
| `E1-s1` | **E1** (Loan Accounts) | Loan 360° <br>*ঋণ ৩৬০°* | `x` | ✅ **WIRED** | Live Route: `#/loan/LN-40118`<br>via `api/client.ts` | `ServicingController / LoanDetailPage` |
| `E1-s2` | **E1** (Loan Accounts) | Portfolio List <br>*পোর্টফোলিও তালিকা* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `ServicingController / LoanDetailPage` |
| `E1-s3` | **E1** (Loan Accounts) | Due Today / Overdue <br>*আজকের ও অনাদায়ী* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `ServicingController / LoanDetailPage` |
| `E1-s4` | **E1** (Loan Accounts) | Closed & Settled <br>*পরিশোধিত হিসাব* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `ServicingController / LoanDetailPage` |
| `E1-s5` | **E1** (Loan Accounts) | Lien & Hold Management <br>*লিয়েন ও হোল্ড* | `f` | ⚠️ **PROTOTYPE** | Archetype `f`<br>`demoData.ts:genRows()` | `ServicingController / LoanDetailPage` |
| `E2-s1` | **E2** (Payments & Receipts) | Payment Posting <br>*পরিশোধ জমা* | `f` | ⚠️ **PROTOTYPE** | Archetype `f`<br>`demoData.ts:genRows()` | `ServicingController (Payment Intents & Reconcile)` |
| `E2-s2` | **E2** (Payments & Receipts) | Receipts Today <br>*আজকের রিসিট* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `ServicingController (Payment Intents & Reconcile)` |
| `E2-s3` | **E2** (Payments & Receipts) | Batch & Day-end <br>*ব্যাচ ও দিন-শেষ* | `c` | ⚠️ **PROTOTYPE** | Archetype `c`<br>`demoData.ts:genRows()` | `ServicingController (Payment Intents & Reconcile)` |
| `E2-s4` | **E2** (Payments & Receipts) | Excess & Refunds <br>*অতিরিক্ত ও ফেরত* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `ServicingController (Payment Intents & Reconcile)` |
| `E2-s5` | **E2** (Payments & Receipts) | Prepayment & Foreclosure <br>*প্রি-পেমেন্ট ও ফোরক্লোজার* | `c` | ⚠️ **PROTOTYPE** | Archetype `c`<br>`demoData.ts:genRows()` | `ServicingController (Payment Intents & Reconcile)` |
| `E2-s6` | **E2** (Payments & Receipts) | Late Fee & Waivers <br>*বিলম্ব ফি ও মওকুফ* | `f` | ⚠️ **PROTOTYPE** | Archetype `f`<br>`demoData.ts:genRows()` | `ServicingController (Payment Intents & Reconcile)` |
| `E3-s1` | **E3** (Schedules & Statements) | Schedule Generator <br>*তফসিলি জেনারেটর* | `c` | ⚠️ **PROTOTYPE** | Archetype `c`<br>`demoData.ts:genRows()` | `ServicingController (Statements & Certificates)` |
| `E3-s2` | **E3** (Schedules & Statements) | Schedule Compare (restructure) <br>*তফসিলি তুলনা* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `ServicingController (Statements & Certificates)` |
| `E3-s3` | **E3** (Schedules & Statements) | Account Statement <br>*হিসাব স্টেটমেন্ট* | `r` | ⚠️ **PROTOTYPE** | Archetype `r`<br>`demoData.ts:genRows()` | `ServicingController (Statements & Certificates)` |
| `E3-s4` | **E3** (Schedules & Statements) | Annual Tax Certificate <br>*বার্ষিক কর সনদ* | `r` | ⚠️ **PROTOTYPE** | Archetype `r`<br>`demoData.ts:genRows()` | `ServicingController (Statements & Certificates)` |
| `E3-s5` | **E3** (Schedules & Statements) | No-Due Certificate <br>*ঋণমুক্তি সনদ* | `r` | ⚠️ **PROTOTYPE** | Archetype `r`<br>`demoData.ts:genRows()` | `ServicingController (Statements & Certificates)` |
| `E4-s1` | **E4** (Loan Modifications) | Reschedule Request <br>*পুনঃতফসিলী অনুরোধ* | `f` | ⚠️ **PROTOTYPE** | Archetype `f`<br>`demoData.ts:genRows()` | `ServicingOpsController (Moratorium & Top-Up)` |
| `E4-s2` | **E4** (Loan Modifications) | Restructure (BRPD compliant) <br>*পুনর্গঠন* | `f` | ⚠️ **PROTOTYPE** | Archetype `f`<br>`demoData.ts:genRows()` | `ServicingOpsController (Moratorium & Top-Up)` |
| `E4-s3` | **E4** (Loan Modifications) | Moratorium <br>*মোরাটোরিয়াম* | `f` | ⚠️ **PROTOTYPE** | Archetype `f`<br>`demoData.ts:genRows()` | `ServicingOpsController (Moratorium & Top-Up)` |
| `E4-s4` | **E4** (Loan Modifications) | Top-up Loan <br>*টপ-আপ ঋণ* | `f` | ⚠️ **PROTOTYPE** | Archetype `f`<br>`demoData.ts:genRows()` | `ServicingOpsController (Moratorium & Top-Up)` |
| `E4-s5` | **E4** (Loan Modifications) | Rate Change (floating reset) <br>*সুদের হার পরিবর্তন* | `f` | ⚠️ **PROTOTYPE** | Archetype `f`<br>`demoData.ts:genRows()` | `ServicingOpsController (Moratorium & Top-Up)` |
| `E4-s6` | **E4** (Loan Modifications) | Modification Register <br>*পরিবর্তন রেজিস্টার* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `ServicingOpsController (Moratorium & Top-Up)` |
| `F1-s1` | **F1** (Classification & Provisioning) | BRPD Classification Board <br>*বিআরপিডি বোর্ড* | `c` | ✅ **WIRED** | Live Route: `#/classification`<br>via `api/client.ts` | `ComplianceController (BRPD 15/2024 Classification)` |
| `F1-s2` | **F1** (Classification & Provisioning) | Provisioning Calculator <br>*প্রভিশন ক্যালকুলেটর* | `c` | ⚠️ **PROTOTYPE** | Archetype `c`<br>`demoData.ts:genRows()` | `ComplianceController (BRPD 15/2024 Classification)` |
| `F1-s3` | **F1** (Classification & Provisioning) | EOD Batch Monitor <br>*ইওডি ব্যাচ মনিটর* | `d` | ⚠️ **PROTOTYPE** | Archetype `d`<br>`demoData.ts:genRows()` | `ComplianceController (BRPD 15/2024 Classification)` |
| `F1-s4` | **F1** (Classification & Provisioning) | Classification Change History <br>*শ্রেণি পরিবর্তনের ইতিহাস* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `ComplianceController (BRPD 15/2024 Classification)` |
| `F1-s5` | **F1** (Classification & Provisioning) | Interest Suspense Entries <br>*সুদ সাসপেন্স* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `ComplianceController (BRPD 15/2024 Classification)` |
| `F1-s6` | **F1** (Classification & Provisioning) | NPA Migration Tracker <br>*এনপিএ মাইগ্রেশন* | `d` | ⚠️ **PROTOTYPE** | Archetype `d`<br>`demoData.ts:genRows()` | `ComplianceController (BRPD 15/2024 Classification)` |
| `F2-s1` | **F2** (Collections Workbench) | Collections Workbench <br>*আদায় ওয়ার্কবেঞ্চ* | `c` | ✅ **WIRED** | Live Route: `#/collections`<br>via `api/client.ts` | `CollectionsController / FieldGatewayController` |
| `F2-s2` | **F2** (Collections Workbench) | DPD Bucket Lists <br>*ডিপিডি বাকেট* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `CollectionsController / FieldGatewayController` |
| `F2-s3` | **F2** (Collections Workbench) | Daily Call List <br>*দৈনিক কল তালিকা* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `CollectionsController / FieldGatewayController` |
| `F2-s4` | **F2** (Collections Workbench) | PTP Tracker <br>*পিটিপি ট্র্যাকার* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `CollectionsController / FieldGatewayController` |
| `F2-s5` | **F2** (Collections Workbench) | Field Visit Scheduler <br>*ফিল্ড ভিজিট শিডিউল* | `d` | ⚠️ **PROTOTYPE** | Archetype `d`<br>`demoData.ts:genRows()` | `CollectionsController / FieldGatewayController` |
| `F2-s6` | **F2** (Collections Workbench) | Dunning Ladder Setup <br>*ডানিং ল্যাডার* | `c` | ⚠️ **PROTOTYPE** | Archetype `c`<br>`demoData.ts:genRows()` | `CollectionsController / FieldGatewayController` |
| `F3-s1` | **F3** (NPA Recovery) | Write-off Processing <br>*অবলোপন প্রক্রিয়াকরণ* | `c` | ⚠️ **PROTOTYPE** | Archetype `c`<br>`demoData.ts:genRows()` | `WatchlistController / AuctionController` |
| `F3-s2` | **F3** (NPA Recovery) | Recovery Tracking <br>*পুনরুদ্ধার ট্র্যাকিং* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `WatchlistController / AuctionController` |
| `F3-s3` | **F3** (NPA Recovery) | Recovery Accounting <br>*পুনরুদ্ধার হিসাব* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `WatchlistController / AuctionController` |
| `F3-s4` | **F3** (NPA Recovery) | Legal Case Register <br>*আইনি মামলা রেজিস্টার* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `WatchlistController / AuctionController` |
| `F3-s5` | **F3** (NPA Recovery) | Agency Assignment <br>*এজেন্সি নিয়োগ* | `f` | ⚠️ **PROTOTYPE** | Archetype `f`<br>`demoData.ts:genRows()` | `WatchlistController / AuctionController` |
| `F4-s1` | **F4** (Early Warning (EWS)) | EWS Dashboard <br>*ইডাব্লিউএস ড্যাশবোর্ড* | `d` | ⚠️ **PROTOTYPE** | Archetype `d`<br>`demoData.ts:genRows()` | `WriteOffController / RecoveryEntry` |
| `F4-s2` | **F4** (Early Warning (EWS)) | Signal Explorer <br>*সিগন্যাল এক্সপ্লোরার* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `WriteOffController / RecoveryEntry` |
| `F4-s3` | **F4** (Early Warning (EWS)) | Watchlist Management <br>*ওয়াচলিস্ট ব্যবস্থাপনা* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `WriteOffController / RecoveryEntry` |
| `F4-s4` | **F4** (Early Warning (EWS)) | Cured Accounts <br>*নিরাময় হিসাব* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `WriteOffController / RecoveryEntry` |
| `G1-s1` | **G1** (Dashboards & Analytics) | Executive Dashboard <br>*নির্বাহী ড্যাশবোর্ড* | `d` | ✅ **WIRED** | Live Route: `#/home`<br>via `api/client.ts` | `ComplianceController / RegconController` |
| `G1-s2` | **G1** (Dashboards & Analytics) | Portfolio Analytics <br>*পোর্টফোলিও বিশ্লেষণ* | `d` | ✅ **WIRED** | Live Route: `#/analytics`<br>via `api/client.ts` | `ComplianceController / RegconController` |
| `G1-s3` | **G1** (Dashboards & Analytics) | Branch Performance <br>*শাখা পারফরম্যান্স* | `d` | ⚠️ **PROTOTYPE** | Archetype `d`<br>`demoData.ts:genRows()` | `ComplianceController / RegconController` |
| `G1-s4` | **G1** (Dashboards & Analytics) | Product Performance <br>*পণ্য পারফরম্যান্স* | `d` | ⚠️ **PROTOTYPE** | Archetype `d`<br>`demoData.ts:genRows()` | `ComplianceController / RegconController` |
| `G1-s5` | **G1** (Dashboards & Analytics) | Officer Productivity <br>*কর্মকর্তা উৎপাদনশীলতা* | `d` | ⚠️ **PROTOTYPE** | Archetype `d`<br>`demoData.ts:genRows()` | `ComplianceController / RegconController` |
| `G2-s1` | **G2** (Report Center) | All Reports <br>*সকল রিপোর্ট* | `g` | ✅ **WIRED** | Live Route: `#/reports`<br>via `api/client.ts` | `BaselOpsController / CapitalBase` |
| `G2-s2` | **G2** (Report Center) | My Scheduled <br>*আমার শিডিউল* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `BaselOpsController / CapitalBase` |
| `G2-s3` | **G2** (Report Center) | Report Writer (7-step) <br>*রিপোর্ট রাইটার* | `c` | ✅ **WIRED** | Live Route: `#/writer`<br>via `api/client.ts` | `BaselOpsController / CapitalBase` |
| `G2-s4` | **G2** (Report Center) | Report Viewer <br>*রিপোর্ট ভিউয়ার* | `r` | ✅ **WIRED** | Live Route: `#/report/F1/0`<br>via `api/client.ts` | `BaselOpsController / CapitalBase` |
| `G3-s1` | **G3** (Regulatory Console) | BB Returns Console <br>*বাংলাদেশ ব্যাংক রিটার্ন* | `c` | ✅ **WIRED** | Live Route: `#/regcon`<br>via `api/client.ts` | `ComplianceController (IFRS-9 ECL)` |
| `G3-s2` | **G3** (Regulatory Console) | Submission Calendar <br>*জমা দেওয়ার ক্যালেন্ডার* | `d` | ⚠️ **PROTOTYPE** | Archetype `d`<br>`demoData.ts:genRows()` | `ComplianceController (IFRS-9 ECL)` |
| `G3-s3` | **G3** (Regulatory Console) | Basel III Capital Adequacy <br>*বাসেল-৩* | `d` | ⚠️ **PROTOTYPE** | Archetype `d`<br>`demoData.ts:genRows()` | `ComplianceController (IFRS-9 ECL)` |
| `G3-s4` | **G3** (Regulatory Console) | IFRS-9 / ECL Workspace <br>*আইএফআরএস-৯ / ইসিএল* | `c` | ⚠️ **PROTOTYPE** | Archetype `c`<br>`demoData.ts:genRows()` | `ComplianceController (IFRS-9 ECL)` |
| `G3-s5` | **G3** (Regulatory Console) | Green Finance Tagging <br>*সবুজ অর্থায়ন* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `ComplianceController (IFRS-9 ECL)` |
| `G4-s1` | **G4** (Risk Models (IFRS-9)) | PD / LGD / EAD Registry <br>*পিডি/এলজিডি/ইএডি* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `ReportingController` |
| `G4-s2` | **G4** (Risk Models (IFRS-9)) | Model Documentation <br>*মডেল ডকুমেন্টেশন* | `x` | ⚠️ **PROTOTYPE** | Archetype `x`<br>`demoData.ts:genRows()` | `ReportingController` |
| `G4-s3` | **G4** (Risk Models (IFRS-9)) | ECL Run Console <br>*ইসিএল রান কনসোল* | `c` | ⚠️ **PROTOTYPE** | Archetype `c`<br>`demoData.ts:genRows()` | `ReportingController` |
| `G4-s4` | **G4** (Risk Models (IFRS-9)) | Scenario Lab <br>*পরিস্থিতি ল্যাব* | `c` | ⚠️ **PROTOTYPE** | Archetype `c`<br>`demoData.ts:genRows()` | `ReportingController` |
| `G4-s5` | **G4** (Risk Models (IFRS-9)) | Stage Migration Report <br>*পর্যায় স্থানান্তর* | `d` | ⚠️ **PROTOTYPE** | Archetype `d`<br>`demoData.ts:genRows()` | `ReportingController` |
| `H1-s1` | **H1** (Admin & Security) | User Management <br>*ব্যবহারকারী ব্যবস্থাপনা* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `OutboxController / AuditLogService` |
| `H1-s2` | **H1** (Admin & Security) | Roles & Permissions (RBAC) <br>*ভূমিকা ও অনুমতি* | `f` | ⚠️ **PROTOTYPE** | Archetype `f`<br>`demoData.ts:genRows()` | `OutboxController / AuditLogService` |
| `H1-s3` | **H1** (Admin & Security) | Approval Limits <br>*অনুমোদন সীমা* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `OutboxController / AuditLogService` |
| `H1-s4` | **H1** (Admin & Security) | Organisation Hierarchy <br>*প্রাতিষ্ঠানিক কাঠামো* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `OutboxController / AuditLogService` |
| `H1-s5` | **H1** (Admin & Security) | Session & Device Policy <br>*সেশন ও ডিভাইস নীতি* | `f` | ⚠️ **PROTOTYPE** | Archetype `f`<br>`demoData.ts:genRows()` | `OutboxController / AuditLogService` |
| `H2-s1` | **H2** (Workflow & SLA) | Workflow Designer <br>*ওয়ার্কফ্লো ডিজাইনার* | `c` | ⚠️ **PROTOTYPE** | Archetype `c`<br>`demoData.ts:genRows()` | `ApprovalBand / SlaPolicy` |
| `H2-s2` | **H2** (Workflow & SLA) | Routing Table (DMN) <br>*রাউটিং টেবিল* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `ApprovalBand / SlaPolicy` |
| `H2-s3` | **H2** (Workflow & SLA) | SLA Rules <br>*এসএলএ নিয়ম* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `ApprovalBand / SlaPolicy` |
| `H2-s4` | **H2** (Workflow & SLA) | Holiday Calendar <br>*ছুটির ক্যালেন্ডার* | `f` | ⚠️ **PROTOTYPE** | Archetype `f`<br>`demoData.ts:genRows()` | `ApprovalBand / SlaPolicy` |
| `H2-s5` | **H2** (Workflow & SLA) | Job Scheduler <br>*জব শিডিউলার* | `d` | ⚠️ **PROTOTYPE** | Archetype `d`<br>`demoData.ts:genRows()` | `ApprovalBand / SlaPolicy` |
| `H3-s1` | **H3** (Integration Hub) | Integration Health <br>*ইন্টিগ্রেশন স্বাস্থ্য* | `d` | ⚠️ **PROTOTYPE** | Archetype `d`<br>`demoData.ts:genRows()` | `RailWebhookController / OutboxRelay` |
| `H3-s2` | **H3** (Integration Hub) | Endpoint Registry <br>*এন্ডপয়েন্ট রেজিস্ট্রি* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `RailWebhookController / OutboxRelay` |
| `H3-s3` | **H3** (Integration Hub) | Keys & Certificates <br>*কী ও সার্টিফিকেট* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `RailWebhookController / OutboxRelay` |
| `H3-s4` | **H3** (Integration Hub) | Replay & DLQ <br>*রিপ্লে ও ডিএলকিউ* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `RailWebhookController / OutboxRelay` |
| `H4-s1` | **H4** (Audit & Governance) | Audit Trail Viewer <br>*অডিট ট্রেইল ভিউয়ার* | `g` | ✅ **WIRED** | Live Route: `#/audit`<br>via `api/client.ts` | `NotificationController` |
| `H4-s2` | **H4** (Audit & Governance) | Maker-Checker Log <br>*মেকার-চেকার লগ* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `NotificationController` |
| `H4-s3` | **H4** (Audit & Governance) | User Activity Analytics <br>*ব্যবহারকারী কার্যক্রম* | `d` | ⚠️ **PROTOTYPE** | Archetype `d`<br>`demoData.ts:genRows()` | `NotificationController` |
| `H4-s4` | **H4** (Audit & Governance) | Compliance Findings <br>*কমপ্লায়েন্স ফাইন্ডিংস* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `NotificationController` |
| `H5-s1` | **H5** (System Settings) | General Settings <br>*সাধারণ সেটিংস* | `f` | ✅ **WIRED** | Live Route: `#/settings`<br>via `api/client.ts` | `CustomerHygieneController` |
| `H5-s2` | **H5** (System Settings) | Number & Currency Format <br>*সংখ্যা ও মুদ্রা ফরম্যাট* | `f` | ⚠️ **PROTOTYPE** | Archetype `f`<br>`demoData.ts:genRows()` | `CustomerHygieneController` |
| `H5-s3` | **H5** (System Settings) | SMS / Email Templates <br>*এসএমএস / ইমেইল টেমপ্লেট* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `CustomerHygieneController` |
| `H5-s4` | **H5** (System Settings) | Notification Rules <br>*বিজ্ঞপ্তি নিয়ম* | `g` | ⚠️ **PROTOTYPE** | Archetype `g`<br>`demoData.ts:genRows()` | `CustomerHygieneController` |
| `H5-s5` | **H5** (System Settings) | Design System & Branding <br>*ডিজাইন সিস্টেম* | `x` | ✅ **WIRED** | Live Route: `#/designsystem`<br>via `api/client.ts` | `CustomerHygieneController` |
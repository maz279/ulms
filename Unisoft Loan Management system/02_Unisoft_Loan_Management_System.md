# Unisoft Loan Management System (ULMS)
## Product Specification Document

**Version:** 1.0
**Date:** January 26, 2026
**Prepared By:** Unisoft Systems Limited
**Product Family:** Unisoft Banking Suite
**Based On:** Apache Fineract Community Edition

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Overview](#product-overview)
3. [Market Analysis](#market-analysis)
4. [Comprehensive Feature List](#comprehensive-feature-list)
5. [Functional Modules](#functional-modules)
6. [Technical Features](#technical-features)
7. [Bangladesh-Specific Features](#bangladesh-specific-features)
8. [Competitive Advantages](#competitive-advantages)
9. [Integration Capabilities](#integration-capabilities)
10. [Benefits & Value Proposition](#benefits--value-proposition)
11. [Pricing & Licensing](#pricing--licensing)
12. [Implementation Roadmap](#implementation-roadmap)

---

## Executive Summary

### Product Vision

**Unisoft Loan Management System (ULMS)** is a comprehensive, next-generation digital lending platform specifically designed for Bangladesh's banking sector. Built on Apache Fineract Community Edition with extensive customizations for Bangladesh Bank regulations, ULMS automates the complete loan lifecycle from application to closure while ensuring full regulatory compliance.

### Key Value Propositions

| Value Proposition | Description |
|-------------------|-------------|
| **Zero Licensing Cost** | Based on Apache Fineract CE - no per-user or per-branch fees |
| **100% Bangladesh Compliance** | Built-in BRPD 15/2024, IFRS-9, CIB, and Basel III compliance |
| **Rapid Processing** | Loan processing in <48 hours vs. industry average of 7-15 days |
| **End-to-End Automation** | From application to disbursement to collection |
| **Islamic Banking Ready** | Complete Shariah-compliant product support |
| **AI-Powered Decisions** | Machine learning credit scoring engine |

### Target Market

- **Primary:** Private Commercial Banks (PCBs) - 33 banks
- **Secondary:** Non-Bank Financial Institutions (NBFIs) - 34+ institutions
- **Tertiary:** Microfinance Institutions (MFIs) - 700+ institutions
- **Quaternary:** Digital Banks and Fintech Lenders

---

## Product Overview

### What is ULMS?

Unisoft Loan Management System is a **comprehensive digital lending platform** that combines:

1. **Loan Origination** - Digital application and underwriting
2. **Credit Management** - Credit assessment and decisioning
3. **Loan Servicing** - Disbursement, repayment, account management
4. **Collection Management** - Delinquency tracking and recovery
5. **Regulatory Compliance** - Automated Bangladesh Bank compliance
6. **Analytics & Insights** - Portfolio analytics and reporting

### Product Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        UNISOFT LOAN MANAGEMENT SYSTEM                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Loan         │  │ Credit       │  │ Collection   │  │ Reporting    │  │
│  │ Origination  │  │ Management   │  │ Management   │  │ & Analytics  │  │
│  │   Portal     │  │   Engine     │  │   System     │  │   Dashboard  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    UNISOFT CUSTOMIZATION LAYER                        │   │
│  │  (BRPD Compliance, IFRS-9, CIB, Islamic Products, Bilingual)       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    APACHE FINERACT CORE (Community Edition)           │   │
│  │                    Loan Management Module                            │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────────────┐
        │         EXTERNAL INTEGRATIONS                    │
        │  ┌─────────┐ ┌─────────┐ ┌─────────┐           │
        │  │   CIB   │ │   CBS   │ │ Payment │           │
        │  │ Online  │ │Integration│Gateway│           │
        │  └─────────┘ └─────────┘ └─────────┘           │
        └─────────────────────────────────────────────────┘
```

### Loan Lifecycle Management

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ Customer │──▶│ Application │──▶│ Underwriting│──▶│ Approval │──▶│Disbursement│
│ Requisition│  & Data Entry │  & Credit Analysis│  Workflow│            │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
                                                           │
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ▼
│ Closure  │◀─│ Recovery │◀─│ NPA      │◀─│ Servicing│   Account
│          │  │ Management│  │ Management│  & Repayment│   Creation
└──────────┘   └──────────┘   └──────────┘   └──────────┘
```

---

## Market Analysis

### Bangladesh LMS Market Size

| Segment | Institutions | Potential Market Size (BDT) |
|---------|-------------|-----------------------------|
| Private Commercial Banks (Tier 2-3) | 25 | 150-200 Crore |
| Private Commercial Banks (Islamic) | 10 | 50-75 Crore |
| Non-Bank Financial Institutions | 34 | 75-100 Crore |
| Large MFIs | 50 | 40-60 Crore |
| Digital Banks/Fintechs | 10 | 25-40 Crore |
| **Total Addressable Market** | **129+** | **340-475 Crore** |

### Competitive Landscape

| Vendor | Solution | Approx. Cost | Bangladesh Expertise |
|--------|----------|--------------|---------------------|
| **Finastra** | Fusion Loan IQ | Very High | Low |
| **Temenos** | Lifecycle Management | Very High | Medium |
| **TCS BaNCS** | Lending Solutions | Very High | High |
| **Infosys Finacle** | Digital Lending | High | High |
| **FinnOne Neo** | LMS | High | Very High |
| **Local Vendors** | Custom Solutions | Medium-High | High |
| **Unisoft** | **ULMS** | **Low (one-time)** | **Very High** |

### Market Gaps Identified

1. **Very High Cost:** International solutions cost 10-30+ Crore BDT
2. **Generic Features:** Not tailored for Bangladesh loan products
3. **Limited Compliance:** Manual BRPD and IFRS-9 compliance
4. **Slow Implementation:** 12-24 month implementation cycles
5. **Ongoing Fees:** 15-20% annual maintenance
6. **Complex Integration:** Difficult CIB and CBS integration

---

## Comprehensive Feature List

### 1. Loan Origination System (LOS)

#### 1.1 Digital Application Channel

| Feature | Description | Priority |
|---------|-------------|----------|
| **Web Application Portal** | Online loan application for customers | Critical |
| **Mobile Application** | Android app for field officers | Critical |
| **Branch Application** | Counter-based application entry | Critical |
| **Bulk Applications** | Excel/CSV import for batch processing | High |
| **API Application** | For partner/fintech integration | High |

#### 1.2 Application Data Capture

**Personal Information:**
```yaml
Customer Details:
  - Name, Father's Name, Mother's Name, Spouse Name
  - Date of Birth, Gender, Marital Status
  - National ID Number, Passport Number
  - Tax Identification Number (TIN)
  - Mobile Number, Email Address
  - Present Address, Permanent Address
  - Occupation, Employer Details
  - Monthly/Annual Income
  - Source of Income
```

**Loan Information:**
```yaml
Loan Details:
  - Loan Product Type
  - Loan Amount Requested
  - Loan Tenor (Months)
  - Repayment Method
  - Purpose of Loan
  - Security/Collateral Details
```

**Documentation:**
```yaml
Required Documents:
  - National ID Card
  - Passport Size Photo
  - Income Proof (Salary Certificate/IT Return)
  - Bank Statement (Last 6 months)
  - TIN Certificate
  - Trade License (for business)
  - Property Documents (for secured loans)
```

#### 1.3 Branch Officers Credit Committee (BOCC)

| Feature | Description | Priority |
|---------|-------------|----------|
| **BOCC Meeting Scheduler** | Schedule and manage committee meetings | Critical |
| **Agenda Management** | Create meeting agendas | High |
| **Attendance Tracking** | Record committee member attendance | Critical |
| **Minutes Generation** | Auto-generate meeting minutes | Critical |
| **Digital Signatures** | Committee member digital signatures | Critical |
| **Recommendation Engine** | Committee recommendation capture | Critical |
| **Branch Manager Approval** | Final branch-level approval | Critical |

#### 1.4 e-KYC & Document Management

| Feature | Description | Priority |
|---------|-------------|----------|
| **NID Verification** | Integration with NID database | Critical |
| **Biometric Verification** | Fingerprint/facial recognition | High |
| **OCR Processing** | Auto-extract data from documents | High |
| **Document Upload** | Multiple document type support | Critical |
| **Document Verification** | Verify authenticity of documents | Critical |
| **Document Checklist** | Required document tracking | Critical |
| **Missing Document Alert** | Alert for incomplete documentation | Critical |

### 2. Credit Management System

#### 2.1 Credit Analysis & Scoring

| Feature | Description | Priority |
|---------|-------------|----------|
| **Automated Credit Scoring** | AI/ML-based scoring engine | Critical |
| **Debt-to-Burden (DBR) Calculation** | Auto-calculate DBR ratio | Critical |
| **Debt-to-Income (DTI) Ratio** | Calculate DTI ratio | Critical |
| **Repayment Capacity Analysis** | Assess repayment ability | Critical |
| **Behavioral Scoring** | Historical behavior analysis | High |
| **Industry Risk Scoring** | Sector-specific risk assessment | High |
| **Guarantor Assessment** | Evaluate guarantor creditworthiness | Critical |

#### 2.2 CIB Integration

| Feature | Description | Priority |
|---------|-------------|----------|
| **Online CIB Inquiry** | Real-time CIB report fetching | Critical |
| **Individual CIB Report** | Personal credit report | Critical |
| **Corporate CIB Report** | Business credit report | Critical |
| **Guarantor CIB Check** | Check guarantor credit history | Critical |
| **Group Exposure Check** | Related party exposure | Critical |
| **CIB Score Interpretation** | Score-based decisioning | High |
| **CIB History Storage** | Historical CIB data | High |

**CIB Report Processing:**

```
CIB Report Fields:
├── Borrower Information
├── Classification Status (STD/SMA/SS/DF/B/L)
├── Total Outstanding Balance
├── Overdue Amount
├── Number of Credit Facilities
├── Group/Related Party Exposure
├── Guarantor Information
├── Payment History (24 months)
└── Write-off History (if any)
```

#### 2.3 Credit Assessment Workflow

| Stage | Activities | Output |
|-------|------------|--------|
| **Application Review** | Verify application completeness | Review Checklist |
| **Credit Inquiry** | CIB, reference checks | Credit Report |
| **Capacity Assessment** | Income, expense analysis | DBR/DTI Report |
| **Collateral Assessment** | Security valuation | Valuation Report |
| **Credit Memo** | Consolidated assessment | Credit Memo |
| **Recommendation** | Approve/Reject/Modify | Recommendation |

#### 2.4 Contact Point Verification (CPV)

| Feature | Description | Priority |
|---------|-------------|----------|
| **CPV Assignment** | Assign verification officer | Critical |
| **Mobile CPV App** | Field verification app | Critical |
| **Geotagging** | GPS-tagged verification | High |
| **Photo Capture** | On-site photos | High |
| **CPV Report Generation** | Auto-generate report | Critical |
| **Verification Workflow** | Review and approval | Critical |

### 3. Loan Approval Workflow

#### 3.1 Multi-Level Approval System

| Approval Level | Authority | Typical Limit |
|----------------|-----------|---------------|
| **Branch Credit Head** | Initial review | Up to 5 Lakh |
| **Branch Manager** | Branch approval | Up to 10 Lakh |
| **Regional Manager** | Regional approval | Up to 25 Lakh |
| **Head of Credit** | HO approval | Up to 1 Crore |
| **Credit Committee** | Committee approval | Up to 5 Crore |
| **Managing Director** | Final approval | Above 5 Crore |

#### 3.2 Workflow Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Configurable Limits** | Set approval amount limits | Critical |
| **Parallel Processing** | Multiple reviewers simultaneously | High |
| **Escalation Rules** | Auto-escalate on SLA breach | High |
| **Delegation** | Delegate approval authority | High |
| **Conditional Approval** | Approve with conditions | Critical |
| **Digital Signatures** | Authenticated approval | Critical |
| **Workflow Tracking** | Real-time status tracking | Critical |

#### 3.3 Sanction Letter Generation

| Feature | Description | Priority |
|---------|-------------|----------|
| **Auto-Generation** | Generate sanction letter on approval | Critical |
| **Customizable Templates** | Bank-specific templates | High |
| **Terms & Conditions** | Include loan terms | Critical |
| **Email/SMS Delivery** | Send to customer | Critical |
| **Acceptance Tracking** | Track customer acceptance | High |

### 4. Loan Disbursement

#### 4.1 Pre-Disbursement Activities

| Activity | Description | Priority |
|----------|-------------|----------|
| **Documentation Check** | Verify all documents | Critical |
| **Security Creation** | Collateral registration | Critical |
| **Insurance Verification** | Check insurance coverage | Critical |
| **Legal Opinion** | Legal document verification | High |
| **Limit Loading** | Load limit in CBS | Critical |

#### 4.2 Disbursement Methods

| Method | Description | Priority |
|--------|-------------|----------|
| **Account Credit** | Credit customer account | Critical |
| **Cash Disbursement** | Cash payment | High |
| **Bank Transfer** | Transfer to bank account | Critical |
| **bKash Disbursement** | Mobile wallet disbursement | High |
| **Nagad Disbursement** | Mobile wallet disbursement | High |
| **Check Payment** | Issue check | Medium |
| **Direct Payment** | Pay to vendor/supplier | High |

#### 4.3 Post-Disbursement

| Activity | Description | Priority |
|----------|-------------|----------|
| **Disbursement Letter** | Generate and send letter | Critical |
| **Welcome Communication** | Send welcome SMS/Email | High |
| **First EMI Reminder** | Schedule first payment reminder | Critical |
| **Physical Document Inventory** | Store original documents | Critical |

### 5. Loan Servicing

#### 5.1 Repayment Management

| Feature | Description | Priority |
|---------|-------------|----------|
| **EMI Calculation** | Auto-calculate installments | Critical |
| **Repayment Schedule** | Generate repayment schedule | Critical |
| **Multiple Payment Modes** | Cash, transfer, mobile | Critical |
| **Payment Processing** | Process payments | Critical |
| **Prepayment Processing** | Handle early payments | High |
| **Part Payment** | Partial payment handling | High |
| **Late Fee Calculation** | Auto-calculate late fees | Critical |
| **Interest Adjustment** | Rate change processing | High |

#### 5.2 Account Management

| Feature | Description | Priority |
|---------|-------------|----------|
| **Account Statement** | Generate statements | Critical |
| **Balance Inquiry** | Real-time balance | Critical |
| **Transaction History** | View all transactions | Critical |
| **Interest Calculation** | Auto-calculate interest | Critical |
| **Outstanding Calculation** | Current outstanding | Critical |

#### 5.3 Loan Modifications

| Feature | Description | Priority |
|---------|-------------|----------|
| **Rescheduling** | Modify loan terms | Critical |
| **Restructuring** | Reorganize loan | Critical |
| **Top-up** | Additional loan amount | High |
| **Rate Change** | Interest rate revision | High |
| **Tenor Change** | Modify loan period | High |
| **Moratorium** | Payment holiday | High |

### 6. Collection Management

#### 6.1 Delinquency Management

| Feature | Description | Priority |
|---------|-------------|----------|
| **DPD Tracking** | Days Past Due calculation | Critical |
| **Aging Buckets** | 30-60-90+ day buckets | Critical |
| **Collection Strategy** | Assign collection strategy | Critical |
| **Auto-Reminders** | SMS/Email reminders | Critical |
| **Call List Generation** | Daily call lists | Critical |
| **Field Visit Scheduler** | Schedule field visits | High |
| **Promise to Pay (PTP)** | Record payment promises | High |

#### 6.2 NPA Management

| Feature | Description | Priority |
|---------|-------------|----------|
| **NPA Identification** | Auto-identify NPAs | Critical |
| **Loan Classification** | BRPD 15/2024 classification | Critical |
| **Provisioning Calculation** | Auto-calculate provisions | Critical |
| **NPA Reporting** | Generate NPA reports | Critical |
| **Write-off Processing** | Process write-offs | Critical |
| **Recovery Tracking** | Track recoveries | Critical |

**BRPD 15/2024 Loan Classification:**

| Classification | Overdue Days | Provision |
|----------------|--------------|-----------|
| STD-0 (Standard) | Current | 1% |
| STD-1 (Watch) | 1-30 days | 1% |
| STD-2 (Caution) | 31-60 days | 1% |
| SMA (Special Mention) | 61-90 days | 5% |
| SS (Substandard) | 91-180 days | 20% |
| DF (Doubtful) | 181-360 days | 50% |
| B/L (Bad/Loss) | >360 days | 100% |

#### 6.3 Recovery Management

| Feature | Description | Priority |
|---------|-------------|----------|
| **Collection Agency Assignment** | Assign external agencies | High |
| **Legal Action Initiation** | Track legal proceedings | High |
| **Auction Management** | Collateral auction | Medium |
| **Recovery Accounting** | Track recovered amounts | Critical |
| **Reconciliation** | Reconcile recoveries | Critical |

### 7. Product Configuration

#### 7.1 Loan Product Types

**Retail Products:**
| Product | Description |
|---------|-------------|
| **Personal Loan** | Unsecured personal loan |
| **Home Loan** | Secured property loan |
| **Auto Loan** | Vehicle loan |
| **Education Loan** | Student loan |
| **Consumer Durable** | Electronics/appliance loan |
| **Credit Card** | Revolving credit |
| **Overdraft** | Demand loan |

**SME/Commercial Products:**
| Product | Description |
|---------|-------------|
| **Working Capital** | Business working capital |
| **Term Loan** | Business term loan |
| **Trade Finance** | LC, BG, Bill discounting |
| **Project Finance** | Project-based loan |
| **Lease Finance** | Equipment leasing |

**Islamic Products:**
| Product | Description |
|---------|-------------|
| **Murabaha** | Cost-plus financing |
| **Ijara** | Leasing |
| **Musharaka** | Partnership |
| **Mudaraba** | Profit-sharing |
| **Istisna** | Manufacturing finance |
| **Bai-Muajjal** | Deferred sale |

#### 7.2 Product Parameters

```yaml
Loan Product Configuration:
  Product Information:
    - Product Name, Code
    - Product Type (Retail/SME/Islamic)
    - Currency
    - Status

  Amount Parameters:
    - Minimum Amount
    - Maximum Amount
    - Default Amount

  Tenor Parameters:
    - Minimum Tenor (Months)
    - Maximum Tenor (Months)
    - Default Tenor

  Interest Parameters:
    - Interest Rate Type (Fixed/Floating)
    - Interest Rate
    - Interest Rate Floor
    - Interest Rate Ceiling
    - Interest Calculation Method

  Repayment Parameters:
    - Repayment Frequency (Daily/Weekly/Monthly/Quarterly)
    - Repayment Strategy
    - Amortization Method
    - Grace Period

  Charges:
    - Processing Fee
    - Late Payment Fee
    - Prepayment Fee
    - Documentation Fee
    - Other Charges
```

### 8. Regulatory Compliance

#### 8.1 BRPD 15/2024 Compliance

| Feature | Description | Priority |
|---------|-------------|----------|
| **Loan Classification** | Automatic 7-stage classification | Critical |
| **Provisioning Calculation** | Auto-calculate provisions | Critical |
| **Interest Suspense** | Interest to suspense account | Critical |
| **CL-1 Report** | Classified loans report | Critical |
| **CL-2 Report** | Provisioning report | Critical |
| **CL-3 Report** | Recovery position | Critical |
| **CL-4 Report** | Write-off details | Critical |
| **CL-5 Report** | Restructured loans | Critical |

#### 8.2 IFRS-9 Compliance (By Dec 2027)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Stage 1: 12-month ECL** | Good standing loans | High |
| **Stage 2: Lifetime ECL** | Significant credit risk increase | High |
| **Stage 3: Lifetime ECL** | Credit impaired | High |
| **ECL Calculation Engine** | Expected credit loss calculation | High |
| **Forward-Looking Info** | Macroeconomic scenarios | Medium |

#### 8.3 Basel III Compliance

| Feature | Description | Priority |
|---------|-------------|----------|
| **RWA Calculation** | Risk-weighted assets | Critical |
| **Capital Adequacy** | CAR calculation | Critical |
| **Exposure Limits** | Single/group borrower limits | Critical |
| **Large Exposure Reporting** | Report large exposures | High |

#### 8.4 CIB Reporting

| Feature | Description | Priority |
|---------|-------------|----------|
| **Monthly Batch Upload** | Subject and contract data | Critical |
| **Real-time Reporting** | New loan reporting | Critical |
| **Classification Updates** | Classification change reporting | Critical |
| **Write-off Reporting** | Immediate write-off notification | Critical |
| **Recovery Reporting** | Recovery updates | Critical |

### 9. Analytics & Reporting

#### 9.1 Management Dashboards

| Dashboard | Key Metrics |
|-----------|-------------|
| **Portfolio Overview** | Total portfolio, PAR, NPA % |
| **Application Pipeline** | Applications by stage, TAT |
| **Disbursement Trends** | Monthly disbursements by product |
| **Collection Efficiency** | Collection rate, overdue analysis |
| **NPA Analysis** | NPA by bucket, aging analysis |
| **Product Performance** | Product-wise profitability |
| **Branch Performance** | Branch-wise comparisons |

#### 9.2 Standard Reports

| Report | Description | Frequency |
|--------|-------------|-----------|
| **Loan Ledger** | Loan transaction history | On-demand |
| **Disbursement Report** | Disbursements by period | Daily |
| **Repayment Report** | Collections by period | Daily |
| **Overdue Report** | Overdue loans | Daily |
| **Aging Report** | Aging by bucket | Weekly |
| **PAR Report** | Portfolio at risk | Monthly |
| **NPA Report** | Non-performing assets | Monthly |
| **Provisioning Report** | Required provisions | Monthly |
| **Branch-wise Report** | Branch performance | Monthly |

---

## Technical Features

### Architecture Specifications

| Aspect | Specification |
|--------|---------------|
| **Architecture Pattern** | Microservices with API Gateway |
| **Backend Framework** | Java Spring Boot (Apache Fineract) |
| **Frontend Framework** | React.js / Angular |
| **Mobile Framework** | React Native (Android) |
| **Database** | PostgreSQL / MySQL |
| **Cache** | Redis |
| **Search** | Elasticsearch |
| **Message Queue** | RabbitMQ / Kafka |
| **API Protocol** | RESTful (OpenAPI 3.0) |
| **AI/ML Framework** | Python (scikit-learn/TensorFlow) |

### Security Features

| Feature | Implementation |
|---------|----------------|
| **Authentication** | OAuth 2.0 / JWT |
| **Authorization** | Role-Based Access Control (RBAC) |
| **Maker-Checker** | Dual control for sensitive actions |
| **Encryption** | AES-256 for data at rest |
| **Transmission** | TLS 1.3 |
| **Audit Trail** | Immutable logging |
| **MFA** | Multi-Factor Authentication |
| **Digital Signature** | Document signing |

### Performance Specifications

| Metric | Target |
|--------|--------|
| **Application Processing** | <2 minutes |
| **Credit Decision** | <30 minutes (Auto) |
| **API Response Time** | <500ms (95th percentile) |
| **Concurrent Users** | 1000+ |
| **Daily Applications** | 10,000+ |
| **Availability** | 99.9% uptime |

---

## Bangladesh-Specific Features

### 1. Loan Products for Bangladesh

| Product | Target Segment | Features |
|---------|----------------|----------|
| **Agricultural Loan** | Farmers | Crop-based repayment |
| **Weaver's Loan** | Textile workers | Cluster-based lending |
| **Small Business Loan** | Small traders | Invoice-based lending |
| **Women's Entrepreneur** | Women-owned businesses | Lower rates, flexible terms |
| **Green Loan** | Eco-friendly projects | Preferential rates |
| **ICT Loan** | Tech professionals | Digital documentation |

### 2. Islamic Banking

**Shariah-Compliant Features:**
- Complete Murabaha product module
- Ijara (leasing) management
- Musharaka (partnership) financing
- Mudaraba (profit-sharing)
- Bai-Muajjal (deferred payment)
- Shariah board approval workflow
- Zakat calculation and deduction
- Islamic profit calculation

### 3. Local Integration

| Integration | Description |
|-------------|-------------|
| **CIB Online** | Real-time credit inquiry |
| **NID/e-KYC** | Digital verification |
| **BRTA** | Vehicle verification |
| **Land Registry** | Property verification |
| **bKash/Nagad** | MFS disbursement |
| **Bangladesh Bank** | Regulatory reporting |

---

## Competitive Advantages

### Unisoft ULMS vs. Competition

| Feature | Unisoft ULMS | FinnOne Neo | TCS BaNCS | Finacle |
|---------|--------------|-------------|-----------|---------|
| **Licensing Model** | One-time | Perpetual + AMC | Perpetual + AMC | Subscription |
| **Implementation Cost** | 2-4 Crore BDT | 8-15 Crore BDT | 10-20 Crore BDT | 6-12 Crore BDT |
| **Bangladesh Compliance** | Built-in | Customization needed | Good | Customization |
| **Islamic Banking** | Full support | Full support | Good | Basic |
| **CIB Integration** | Pre-built | Custom | Custom | Custom |
| **BRPD 15/2024** | Built-in | Custom | Good | Custom |
| **IFRS-9** | Ready (2027) | Available | Available | Available |
| **Implementation Time** | 4-6 months | 12-18 months | 12-18 months | 9-15 months |
| **Local Support** | 24/7 Dhaka | Limited | Limited | Limited |

### Unique Selling Propositions (USPs)

1. **80-90% Cost Advantage** vs. international solutions
2. **Built-in Bangladesh Compliance** - No customization needed
3. **Rapid 4-6 Month Implementation**
4. **Unlimited User/Branch Licensing**
5. **Complete Islamic Banking Suite**
6. **Local 24/7 Support**

---

## Integration Capabilities

### Pre-Built Integrations

| System | Integration Type | Status |
|--------|-----------------|--------|
| **CIB Online** | File + API | Pre-built |
| **NID/e-KYC** | API | Pre-built |
| **Core Banking** | REST/SOAP | Configurable |
| **bKash** | API | Pre-built |
| **Nagad** | API | Pre-built |
| **Rocket** | API | Pre-built |
| **SMS Gateway** | HTTP API | Pre-built |
| **Payment Gateway** | API | Pre-built |

### API Architecture

```
ULMS API Gateway
    │
    ├── Loan Origination APIs (30+)
    ├── Credit Management APIs (25+)
    ├── Disbursement APIs (15+)
    ├── Collection APIs (20+)
    ├── Reporting APIs (40+)
    └── Admin APIs (15+)
```

---

## Benefits & Value Proposition

### Quantified Benefits

| Benefit Category | Current State | With ULMS | Improvement |
|------------------|---------------|-----------|-------------|
| **Loan Processing Time** | 7-15 days | <48 hours | 85% reduction |
| **Credit Decision Time** | 3-5 days | <30 minutes | 95% reduction |
| **Data Entry Errors** | 5-10% | <1% | 90% reduction |
| **CIB Inquiry Time** | 30-60 minutes | <2 minutes | 95% reduction |
| **Collection Efficiency** | 70-75% | 85-90% | 15% improvement |
| **NPA Identification** | Manual/Delayed | Real-time | Immediate |

### Financial Benefits

**For a Mid-Size Private Bank:**

| Cost/Benefit | Amount (BDT) |
|--------------|--------------|
| **Implementation Cost** | 2.5 - 4 Crore |
| **Annual Maintenance** | 30 - 50 Lakh |
| **Annual Savings (Staff)** | 3 - 5 Crore |
| **Annual Revenue Increase** | 5 - 8 Crore |
| **NPA Reduction** | 2 - 3 Crore |
| **ROI Payback** | 12-15 months |
| **3-Year ROI** | 400-500% |

---

## Pricing & Licensing

### Pricing Tiers

| Tier | Branches | Loan Volume | Price (BDT) |
|------|----------|-------------|-------------|
| **Small** | 1-10 | Up to 500 Cr | 2 - 2.5 Crore |
| **Medium** | 11-50 | Up to 2000 Cr | 3 - 4 Crore |
| **Large** | 51+ | 2000+ Cr | 5+ Crore (Custom) |

### What's Included

✓ Software license (perpetual)
✓ Implementation services
✓ Training (on-site)
✓ Standard integrations
✓ Bangladesh regulatory reports
✓ Islamic banking module
✓ Software updates (1 year)
✓ Technical support (1 year)

---

## Implementation Roadmap

### Phase-wise Implementation

**Phase 1: Foundation (Months 1-2)**
- Core loan origination
- Basic workflow
- CIB integration
- Standard reports

**Phase 2: Credit Management (Months 3-4)**
- Credit scoring engine
- CPV module
- Approval workflow
- CBS integration

**Phase 3: Servicing & Collection (Months 5-6)**
- Disbursement module
- Repayment processing
- Collection management
- NPA management

**Phase 4: Advanced Features (Months 7-8)**
- Islamic products
- Advanced analytics
- Mobile apps
- Go-live

---

## Conclusion

Unisoft Loan Management System provides a **complete digital lending platform** specifically designed for Bangladesh's banking sector. With comprehensive features, built-in regulatory compliance, and 80-90% cost advantage over international solutions, ULMS is the **ideal choice for banks seeking to modernize their lending operations**.

---

**Document Version:** 1.0
**Prepared By:** Unisoft Systems Limited
**Date:** January 26, 2026

---

**Document End**

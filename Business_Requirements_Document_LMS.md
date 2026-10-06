# Business Requirements Document (BRD)
## Unisoft Loan Management System (ULMS) for Bangladesh Banking Sector

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Business Requirements Document - Unisoft Loan Management System |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | January 26, 2026 |
| **Prepared By** | Unisoft Systems Limited |
| **Classification** | Confidential |
| **Status** | Final |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | January 26, 2026 | Unisoft Systems | Initial BRD Document |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Background](#2-project-background)
3. [Business Objectives](#3-business-objectives)
4. [Scope](#4-scope)
5. [Business Requirements](#5-business-requirements)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Integration Requirements](#8-integration-requirements)
9. [Compliance and Regulatory Requirements](#9-compliance-and-regulatory-requirements)
10. [Data Requirements](#10-data-requirements)
11. [Reporting and Analytics](#11-reporting-and-analytics)
12. [User Roles and Permissions](#12-user-roles-and-permissions)
13. [Implementation Considerations](#13-implementation-considerations)
14. [Appendices](#14-appendices)

---

## 1. Executive Summary

### 1.1 Project Overview

The **Unisoft Loan Management System (ULMS)** is a comprehensive, enterprise-grade digital lending platform designed specifically for Bangladesh's banking sector. Built on Apache Fineract Community Edition with extensive customizations for Bangladesh Bank regulations, ULMS automates the complete loan lifecycle from application to closure while ensuring full regulatory compliance.

### 1.2 Key Business Drivers

- **Regulatory Mandates**: Bangladesh Bank's Digital Roadmap targeting 75% cashless transactions by 2027 and mandatory IFRS-9 ECL provisioning by December 2027
- **Market Opportunity**: 62 scheduled commercial banks with significant manual loan processing inefficiencies
- **Competitive Pressure**: Need to compete with fintech lenders and digital banks
- **Cost Reduction**: Current manual processes result in 7-15 day turnaround times with 5-10% error rates

### 1.3 Expected Benefits

| Benefit Area | Current State | Target State | Improvement |
|--------------|---------------|--------------|-------------|
| Loan Processing Time | 7-15 days | <48 hours | 85% reduction |
| Credit Decision Time | 3-5 days | <30 minutes | 95% reduction |
| Data Entry Error Rate | 5-10% | <1% | 90% reduction |
| Customer Satisfaction | 65% | 85%+ | +20 points |
| Cost Savings | Baseline | 3-5 Cr BDT/year | Significant |

### 1.4 Target Market

- **Primary**: Private Commercial Banks (33 banks)
- **Secondary**: Non-Bank Financial Institutions (34+ institutions)
- **Tertiary**: Microfinance Institutions (700+ institutions)
- **Quaternary**: Digital Banks and Fintech Lenders

---

## 2. Project Background

### 2.1 Bangladesh Banking Sector Context

Bangladesh's banking sector comprises **62 scheduled commercial banks** serving a population of over 170 million people:

| Bank Category | Count | Market Share |
|---------------|-------|--------------|
| State-Owned Commercial Banks (SOCBs) | 6 | 35% |
| Private Commercial Banks (Conventional) | 33 | 45% |
| Private Commercial Banks (Islamic) | 10 | 15% |
| Foreign Commercial Banks (FCBs) | 9 | 5% |
| Specialized Development Banks (SDBs) | 3 | - |

### 2.2 Current Pain Points

#### 2.2.1 Operational Pain Points

| Pain Point | Impact | Frequency |
|------------|--------|-----------|
| Manual loan applications | 7-15 days average processing time | All loans |
| Manual data entry | 5-10% error rate in documentation | High |
| Physical document verification | Branch visits required | Every loan |
| Manual credit scoring | Inconsistent risk assessment | Every loan |
| Serial processing | Applications processed sequentially | Standard practice |

#### 2.2.2 Technology Challenges

| Challenge | Current State |
|-----------|---------------|
| Legacy Core Banking Systems | Limited API capabilities, batch processing |
| No Integrated DMS | Documents stored in multiple locations |
| Manual CIB Verification | 30-60 minutes per inquiry |
| Spreadsheet-based Reporting | Error-prone, delayed MIS |
| No Real-time Dashboards | Lack of portfolio visibility |

### 2.3 Regulatory Landscape

#### 2.3.1 Bangladesh Bank Digital Roadmap (2025-2027)

| Initiative | Target | Deadline |
|------------|--------|----------|
| Cashless Transactions | 75% | 2027 |
| Inclusive Instant Payment System (IIPS) | Full Implementation | July 2027 |
| IFRS-9 ECL Provisioning | Mandatory | December 2027 |
| Digital Banking Licenses | BDT 300 crore minimum capital | Ongoing |
| AI Policy | Explainability requirements | 2026 |

### 2.4 Vendor Profile: Unisoft Systems Limited

| Attribute | Value |
|-----------|-------|
| Established | 2015 (10+ years of excellence) |
| Parent Company | Smart Technologies BD Ltd |
| Team Size | 40+ Software Engineers |
| Projects Delivered | 150+ Successful Implementations |
| On-Time Delivery Rate | 98% |
| Revenue (2024) | BDT 15 Crore |
| Certifications | ISO 9001:2015, NBR Approved UniVAT™ |

---

## 3. Business Objectives

### 3.1 Primary Objectives

1. **Digitize Loan Lifecycle**: End-to-end automation from application to closure
2. **Achieve Regulatory Compliance**: 100% compliance with BRPD 15/2024, IFRS-9, and Basel III
3. **Improve Processing Speed**: Reduce loan processing time from 7-15 days to <48 hours
4. **Enhance Customer Experience**: Provide real-time status tracking and faster decisions
5. **Reduce Operational Costs**: Achieve 40%+ improvement in staff productivity

### 3.2 Secondary Objectives

1. **Enable Data-Driven Decisions**: AI-powered credit scoring and analytics
2. **Support Islamic Banking**: Complete Shariah-compliant product suite
3. **Future-Proof Architecture**: Microservices-based, API-first design
4. **Multi-Channel Access**: Web, mobile, and API-based application channels

### 3.3 Success Criteria

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Loan Processing Time | <48 hours | System tracking |
| Credit Decision Time | <30 minutes | Workflow timestamps |
| Data Entry Error Rate | <1% | Audit reports |
| System Uptime | 99.9% | Monitoring tools |
| User Adoption Rate | >95% | Login analytics |
| Customer Satisfaction | >85% | Survey scores |

---

## 4. Scope

### 4.1 In-Scope

#### 4.1.1 Functional Modules

1. **Loan Origination System (LOS)**
2. **Credit Management System**
3. **Multi-Level Approval Workflow Engine**
4. **Loan Disbursement Module**
5. **Loan Servicing & Account Management**
6. **Collection & Recovery Management System**
7. **NPA Management (BRPD 15/2024 Compliant)**
8. **Document Management System (AES-256 Encrypted)**
9. **Regulatory Reporting Engine**
10. **Analytics & Management Dashboards**

#### 4.1.2 Loan Products Supported

**Retail Products:**
- Personal Loans
- Home Loans
- Auto Loans
- Education Loans
- Consumer Durable Loans
- Credit Cards
- Overdraft Facilities

**SME/Commercial Products:**
- Working Capital Loans
- Term Loans
- Trade Finance (LC, BG)
- Project Finance
- Lease Finance

**Islamic Products:**
- Murabaha
- Ijara
- Musharaka
- Mudaraba
- Istisna
- Bai-Muajjal

### 4.2 Out-of-Scope

- Core Banking System replacement (integration only)
- General ledger accounting (integration only)
- ATM/POS integration
- International remittance processing
- Trade finance documentation (LC processing)

### 4.3 Assumptions

1. Core Banking System API access will be available
2. CIB Online system integration will be approved
3. NID/e-KYC API access will be provided
4. Adequate infrastructure (servers, network) will be available
5. Bank staff will be available for UAT and training

### 4.4 Constraints

1. Must comply with Bangladesh Bank ICT Security Guidelines V4.0
2. Must support Bengali language interface
3. Must integrate with existing CBS
4. Implementation must not disrupt existing operations
5. Budget constraints as per agreed pricing

---

## 5. Business Requirements

### 5.1 Business Process Requirements

#### 5.1.1 End-to-End Loan Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LOAN MANAGEMENT LIFECYCLE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐  │
│  │ Customer │──▶│   BOCC   │──▶│ Credit   │──▶│ Approval │──▶│Disburse- │  │
│  │Requisition│  │ Review   │   │ Analysis │   │ Workflow │   │  ment    │  │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘  │
│                                                                              │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐  │
│  │ Servicing│──▶│Collection│──▶│   NPA    │──▶│ Recovery │──▶│ Closure  │  │
│  │          │   │          │   │Management│   │          │   │          │  │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 5.1.2 Processing Time Requirements

| Stage | Current Time | Target Time | Automation Level |
|-------|-------------|-------------|------------------|
| Application to BOCC | 1-2 days | <4 hours | 80% |
| BOCC to Branch Manager | 2-3 days | <1 day | 70% |
| Branch to HO Credit | 1-2 days | <4 hours | 90% |
| HO Analysis & Approval | 2-4 days | <1 day | 85% |
| Approval to Disbursement | 2-3 days | <1 day | 75% |
| **Total TAT** | **7-15 days** | **<48 hours** | **80%** |

### 5.2 Business Rules Requirements

#### 5.2.1 Credit Scoring Rules

| Parameter | Weight | Data Source |
|-----------|--------|-------------|
| Customer Profile | 20% | Application data, NID |
| Financial Capacity | 30% | Income proof, bank statements |
| Credit History | 25% | CIB report |
| Collateral Security | 15% | Valuation reports |
| Business/Industry Risk | 10% | Industry database |

#### 5.2.2 DBR/DTI Calculation Rules

| Metric | Formula | Maximum Threshold |
|--------|---------|-------------------|
| Debt-to-Burden Ratio (DBR) | (Total EMI / Monthly Income) × 100 | <50% |
| Debt-to-Income Ratio (DTI) | (Total Debt / Total Income) × 100 | <40% |
| Fixed Obligation Ratio | Fixed Payments / Net Income | <60% |

---

## 6. Functional Requirements

### 6.1 Loan Origination System (LOS)

#### 6.1.1 Application Channels

| ID | Requirement | Priority |
|----|-------------|----------|
| LOS-001 | Web-based application portal for retail customers | Critical |
| LOS-002 | Branch console for assisted applications | Critical |
| LOS-003 | Mobile field app for field officers (Android) | Critical |
| LOS-004 | API gateway for partner/fintech integration | High |
| LOS-005 | Bulk application import (Excel/CSV) | Medium |

#### 6.1.2 Data Capture Requirements

**Personal Information:**
- Full Name, Father's Name, Mother's Name, Spouse Name
- Date of Birth, Gender, Marital Status
- National ID Number (NID) with verification
- Tax Identification Number (TIN)
- Mobile Number, Email Address
- Present and Permanent Address

**Financial Information:**
- Monthly/Annual Income
- Employment Details
- Existing EMIs and Liabilities
- Asset Information
- Bank Account Details

#### 6.1.3 BOCC Module Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| BOCC-001 | Meeting scheduler with notification | Critical |
| BOCC-002 | Attendance tracking with digital signature | Critical |
| BOCC-003 | Minutes auto-generation | Critical |
| BOCC-004 | Recommendation capture | Critical |
| BOCC-005 | Branch Manager approval workflow | Critical |

### 6.2 Credit Management System

#### 6.2.1 CIB Integration Requirements

| ID | Requirement | Type |
|----|-------------|------|
| CIB-001 | Online CIB inquiry - Individual | Real-time API |
| CIB-002 | Online CIB inquiry - Corporate | Real-time API |
| CIB-003 | Guarantor CIB check | Real-time API |
| CIB-004 | Group exposure check | Real-time API |
| CIB-005 | Monthly batch file generation | Batch/File |
| CIB-006 | Real-time loan reporting | Event-driven |

#### 6.2.2 Credit Scoring Engine

| ID | Requirement | Priority |
|----|-------------|----------|
| CS-001 | Automated credit score calculation | Critical |
| CS-002 | Configurable scoring parameters | Critical |
| CS-003 | DBR/DTI auto-calculation | Critical |
| CS-004 | Risk grade assignment | Critical |
| CS-005 | Override tracking with approval | High |

#### 6.2.3 Contact Point Verification (CPV)

| ID | Requirement | Priority |
|----|-------------|----------|
| CPV-001 | CPV assignment to officers | Critical |
| CPV-002 | Mobile CPV app with offline capability | Critical |
| CPV-003 | Geotagging of verification locations | High |
| CPV-004 | Photo capture during verification | High |
| CPV-005 | Digital signature capture | Critical |
| CPV-006 | Auto-generated CPV report | Critical |

### 6.3 Approval Workflow Engine

#### 6.3.1 Approval Hierarchy

| Level | Role | Authority Limit (BDT) |
|-------|------|----------------------|
| Level 1 | Branch Credit Head | Up to 5 Lakh |
| Level 2 | Branch Manager | Up to 10 Lakh |
| Level 3 | Regional Manager | Up to 25 Lakh |
| Level 4 | Head of Credit | Up to 1 Crore |
| Level 5 | Credit Committee | Up to 5 Crore |
| Level 6 | Deputy MD | Up to 10 Crore |
| Level 7 | Managing Director | Above 10 Crore |

#### 6.3.2 Workflow Features

| ID | Requirement | Priority |
|----|-------------|----------|
| WF-001 | Configurable approval limits | Critical |
| WF-002 | Parallel processing capability | High |
| WF-003 | Auto-escalation on SLA breach | Critical |
| WF-004 | Delegation of authority | High |
| WF-005 | Conditional approval with terms | Critical |
| WF-006 | Digital signature authentication | Critical |
| WF-007 | Real-time workflow tracking | Critical |

### 6.4 Loan Disbursement Module

#### 6.4.1 Pre-Disbursement Checklist

| ID | Requirement | Automation |
|----|-------------|------------|
| DISB-001 | Documentation verification | Automated Checklist |
| DISB-002 | Security/collateral registration | CBS Integration |
| DISB-003 | Insurance verification | External API |
| DISB-004 | Legal opinion verification | Workflow-based |
| DISB-005 | Limit loading in CBS | Automatic |

#### 6.4.2 Disbursement Methods

| Method | Integration Required |
|--------|---------------------|
| Account Credit | CBS Integration |
| Bank Transfer (BEFTN) | Payment Gateway |
| bKash Disbursement | bKash API |
| Nagad Disbursement | Nagad API |
| Rocket Disbursement | DBBL API |
| Check Payment | CBS Integration |

### 6.5 Loan Servicing Module

#### 6.5.1 Repayment Management

| ID | Requirement | Priority |
|----|-------------|----------|
| SERV-001 | EMI calculation and scheduling | Critical |
| SERV-002 | Multiple payment mode support | Critical |
| SERV-003 | Prepayment processing | High |
| SERV-004 | Part payment handling | High |
| SERV-005 | Late fee auto-calculation | Critical |
| SERV-006 | Interest rate revision | High |

#### 6.5.2 Loan Modifications

| Modification Type | Approval Required | Workflow |
|-------------------|-------------------|----------|
| Rescheduling | Yes | Full approval |
| Restructuring | Yes | Full approval |
| Top-up | Yes | Full process |
| Rate Change | System/Admin | System |
| Tenor Change | Yes | Approval |
| Moratorium | Yes | Approval |

### 6.6 Collection & Recovery Management

#### 6.6.1 Delinquency Management

| ID | Requirement | Priority |
|----|-------------|----------|
| COLL-001 | Automatic DPD calculation | Critical |
| COLL-002 | Aging bucket classification | Critical |
| COLL-003 | Collection strategy assignment | Critical |
| COLL-004 | Auto-reminders (SMS/Email) | Critical |
| COLL-005 | Daily call list generation | Critical |
| COLL-006 | Promise to Pay (PTP) tracking | High |

#### 6.6.2 NPA Management (BRPD 15/2024)

| Stage | Classification | DPD | Provision | System Action |
|-------|---------------|-----|-----------|---------------|
| STD-0 | Standard (Current) | 0 | 1% | Normal monitoring |
| STD-1 | Standard (Watch) | 1-30 | 1% | Increased monitoring |
| STD-2 | Standard (Caution) | 31-60 | 1% | Review account |
| SMA | Special Mention | 61-90 | 5% | Collection efforts |
| SS | Substandard | 91-180 | 20% | Intensive recovery |
| DF | Doubtful | 181-360 | 50% | Legal action |
| B/L | Bad/Loss | >360 | 100% | Write-off process |

### 6.7 Document Management System

| ID | Requirement | Specification |
|----|-------------|---------------|
| DMS-001 | Document upload | PDF, JPG, PNG (max 10MB) |
| DMS-002 | Encryption | AES-256-CBC |
| DMS-003 | Version control | Full audit trail |
| DMS-004 | Access control | Role-based |
| DMS-005 | Document checklist | Product-specific |
| DMS-006 | Expiry alerts | Automated notifications |

---

## 7. Non-Functional Requirements

### 7.1 Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Response Time (95th percentile) | <500ms | API monitoring |
| Application Processing | <2 minutes | End-to-end |
| Credit Decision (Auto) | <30 minutes | Workflow tracking |
| Concurrent Users | 1000+ | Load testing |
| Daily Transaction Volume | 10,000+ | System logs |
| System Availability | 99.9% | Uptime monitoring |

### 7.2 Scalability Requirements

| Aspect | Requirement |
|--------|-------------|
| Horizontal Scaling | Support 10 to 1,000+ branches |
| Database Scaling | Support 100K to 10M+ loans |
| User Scaling | Unlimited user licensing |
| Transaction Scaling | Handle 10x peak load |

### 7.3 Security Requirements

#### 7.3.1 Authentication & Authorization

| ID | Requirement | Implementation |
|----|-------------|----------------|
| SEC-001 | OAuth 2.0 / JWT authentication | Spring Security |
| SEC-002 | Role-Based Access Control (RBAC) | Configurable |
| SEC-003 | Multi-Factor Authentication (MFA) | SMS/OTP |
| SEC-004 | Session management | Timeout controls |
| SEC-005 | Password policy enforcement | Complexity rules |

#### 7.3.2 Data Protection

| ID | Requirement | Implementation |
|----|-------------|----------------|
| SEC-006 | AES-256 encryption at rest | Database encryption |
| SEC-007 | TLS 1.3 for transmission | SSL certificates |
| SEC-008 | Field-level encryption | Sensitive fields |
| SEC-009 | Data masking | UI display |
| SEC-010 | Secure key management | HSM integration |

#### 7.3.3 Audit & Compliance

| ID | Requirement | Implementation |
|----|-------------|----------------|
| SEC-011 | Immutable audit trail | Database logging |
| SEC-012 | User activity monitoring | Real-time tracking |
| SEC-013 | Transaction logging | Complete history |
| SEC-014 | Compliance reporting | Automated reports |

### 7.4 Usability Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| UI-001 | Intuitive interface | <2 hours training |
| UI-002 | Responsive design | Mobile/tablet compatible |
| UI-003 | Bengali language support | Full UI translation |
| UI-004 | Accessibility | WCAG 2.1 Level AA |
| UI-005 | Contextual help | In-app guidance |

### 7.5 Reliability Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| REL-001 | System availability | 99.9% uptime |
| REL-002 | Recovery Time Objective (RTO) | <4 hours |
| REL-003 | Recovery Point Objective (RPO) | <1 hour |
| REL-004 | Data backup frequency | Hourly incremental |
| REL-005 | Disaster recovery | Hot standby |

---

## 8. Integration Requirements

### 8.1 Core Banking System Integration

| Aspect | Specification |
|--------|---------------|
| Integration Type | REST/SOAP APIs |
| Data Exchange | Real-time and batch |
| Key Functions | Account creation, limit loading, GL posting |
| Error Handling | Retry mechanism, fallback procedures |

### 8.2 External System Integrations

| System | Integration Type | Purpose |
|--------|-----------------|---------|
| CIB Online | Real-time API + Batch | Credit inquiry and reporting |
| NID/e-KYC | API | Digital customer verification |
| Bangladesh Bank | File transfer | Regulatory reporting |
| bKash/Nagad | API | Mobile wallet disbursement |
| SMS Gateway | HTTP API | Customer notifications |
| Email Gateway | SMTP/API | Email communications |
| BRTA | API | Vehicle verification |
| Land Registry | API | Property verification |

### 8.3 API Architecture

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

## 9. Compliance and Regulatory Requirements

### 9.1 BRPD Circular 15/2024 Compliance

| Requirement | System Feature | Status |
|-------------|---------------|--------|
| 7-Stage Classification | Auto-classification based on DPD | Built-in |
| Provisioning Calculation | Auto-calculation per stage | Built-in |
| Interest Suspense | Automatic accounting entries | Built-in |
| CL-1 to CL-5 Reports | Auto-generation | Built-in |

### 9.2 IFRS-9 ECL Requirements (By December 2027)

| Stage | Condition | ECL Calculation | System Support |
|-------|-----------|-----------------|----------------|
| Stage 1 | Good standing | 12-month ECL | Framework ready |
| Stage 2 | Significant credit risk increase | Lifetime ECL | Configurable |
| Stage 3 | Credit impaired | Lifetime ECL (100%) | Configurable |

### 9.3 Basel III Compliance

| Requirement | System Support |
|-------------|---------------|
| RWA Calculation | Automated |
| Capital Adequacy Reporting | Configurable |
| Exposure Limits | Built-in controls |
| Large Exposure Reporting | Automated |

### 9.4 CIB Reporting Requirements

| Report Type | Frequency | Format |
|-------------|-----------|--------|
| Subject Data File | Monthly | Fixed-width text |
| Contract Data File | Monthly | Fixed-width text |
| Real-time Updates | Event-driven | API/JSON |

### 9.5 Security Compliance

| Guideline | Compliance |
|-----------|------------|
| ICT Security Guidelines V4.0 | Full compliance |
| Data Protection Act | Compliant |
| PCI DSS (for card data) | Compliant |
| ISO 27001 | Aligned |

---

## 10. Data Requirements

### 10.1 Data Entities

#### 10.1.1 Customer Master Data

| Field | Type | Source |
|-------|------|--------|
| Customer ID | Auto-generated | System |
| NID Number | Alphanumeric | NID/e-KYC |
| Name | Text | Application |
| Contact Information | Structured | Application |
| Address | Structured | Application |
| Employment Details | Structured | Application |

#### 10.1.2 Loan Master Data

| Field | Type | Description |
|-------|------|-------------|
| Loan Account Number | Auto-generated | Unique identifier |
| Product Code | Reference | Loan product type |
| Sanction Amount | Decimal | Approved amount |
| Disbursed Amount | Decimal | Actual disbursement |
| Interest Rate | Decimal | Applied rate |
| Tenor | Integer | Months |
| Repayment Mode | Enum | EMI/Bullet/etc. |

### 10.2 Data Retention

| Data Type | Retention Period | Archive Policy |
|-----------|------------------|----------------|
| Active Loan Data | Loan tenure + 7 years | No archive |
| Closed Loan Data | 7 years from closure | Archive after 2 years |
| Audit Logs | 10 years | Archive after 5 years |
| Documents | 10 years | Archive after 7 years |

---

## 11. Reporting and Analytics

### 11.1 Regulatory Reports

| Report ID | Report Name | Frequency | Recipient |
|-----------|-------------|-----------|-----------|
| REG-001 | CL-1 (Classified Loans) | Monthly | Bangladesh Bank |
| REG-002 | CL-2 (Provisioning) | Monthly | Bangladesh Bank |
| REG-003 | CL-3 (Recovery Position) | Monthly | Bangladesh Bank |
| REG-004 | CL-4 (Write-off Details) | Monthly | Bangladesh Bank |
| REG-005 | CL-5 (Restructured Loans) | Monthly | Bangladesh Bank |
| REG-006 | CIB Batch Files | Monthly | CIB |
| REG-007 | Basel III Reports | Quarterly | Bangladesh Bank |

### 11.2 Management Dashboards

| Dashboard | Key Metrics |
|-----------|-------------|
| Portfolio Overview | Total portfolio, PAR, NPA % |
| Application Pipeline | Applications by stage, TAT |
| Disbursement Trends | Monthly disbursements |
| Collection Efficiency | Collection rate, overdue analysis |
| NPA Analysis | NPA by bucket, aging |
| Branch Performance | Branch-wise comparison |

### 11.3 Operational Reports

| Report | Description | Frequency |
|--------|-------------|-----------|
| Loan Ledger | Transaction history | On-demand |
| Disbursement Report | Disbursements by period | Daily |
| Repayment Report | Collections by period | Daily |
| Overdue Report | Overdue loans | Daily |
| Aging Report | Aging buckets | Weekly |
| PAR Report | Portfolio at risk | Monthly |

---

## 12. User Roles and Permissions

### 12.1 Role Definitions

| Role | Responsibilities | System Access |
|------|------------------|---------------|
| Branch User | Customer requisition, basic data entry | LOS, Customer view |
| Branch Credit Analyst | Scrutiny, DBR/CIB/CPV creation | LOS, Credit module |
| CPV Officer | Field verification | Mobile CPV App |
| Branch Credit Head | Quality review, forward recommendation | LOS, Credit module |
| Branch Manager | Branch approval, proposal generation | All branch functions |
| HO Credit Division | Case distribution, oversight | Full system |
| Credit Analyst (HO) | Detailed assessment, credit memo | Credit module |
| Head of Retail | Recommendation, risk oversight | Dashboards, reports |
| DMD/AMD | Senior approval authority | Approval workflow |
| MD | Final approval authority | Full system |
| Credit Admin | Sanction letter, limit loading | Disbursement module |
| System Admin | User management, configuration | Admin module |

### 12.2 Permission Matrix

| Function | Branch User | Credit Analyst | Branch Manager | HO Credit | MD |
|----------|-------------|----------------|----------------|-----------|-----|
| Create Application | ✓ | ✓ | ✓ | ✓ | ✓ |
| Edit Application | ✓ | ✓ | ✓ | ✓ | ✓ |
| View CIB | - | ✓ | ✓ | ✓ | ✓ |
| Create CPV | - | ✓ | ✓ | ✓ | ✓ |
| Approve (Branch) | - | - | ✓ | - | ✓ |
| Approve (HO) | - | - | - | ✓ | ✓ |
| Final Approval | - | - | - | - | ✓ |
| Disburse | - | - | - | ✓ | ✓ |
| Configure Products | - | - | - | - | ✓ |

---

## 13. Implementation Considerations

### 13.1 Implementation Phases

#### Phase 1: Foundation (Months 1-2)
- Core loan origination
- Basic workflow
- CIB integration
- Standard reports

#### Phase 2: Credit Management (Months 3-4)
- Credit scoring engine
- CPV module
- Approval workflow
- CBS integration

#### Phase 3: Servicing & Collection (Months 5-6)
- Disbursement module
- Repayment processing
- Collection management
- NPA management

#### Phase 4: Advanced Features (Months 7-8)
- Islamic products
- Advanced analytics
- Mobile apps
- Go-live

### 13.2 Resource Requirements

| Role | Count | Duration |
|------|-------|----------|
| Project Manager | 1 | Full project |
| Business Analyst | 2 | Full project |
| Solution Architect | 1 | Phase 1-2 |
| Senior Developers | 4 | Full project |
| Junior Developers | 4 | Full project |
| QA Engineers | 2 | Full project |
| DevOps Engineer | 1 | Phase 2 onwards |

### 13.3 Risk Mitigation

| Risk | Mitigation Strategy |
|------|---------------------|
| Scope creep | Fixed scope per phase, change control |
| Integration delays | Early CBS vendor engagement |
| Resource availability | Cross-training, documentation |
| Regulatory changes | Flexible rule engine |
| User adoption | Change management, training |

---

## 14. Appendices

### Appendix A: Glossary

| Term | Definition |
|------|------------|
| BOCC | Branch Officers Credit Committee |
| BRPD | Banking Regulation and Policy Department |
| CBS | Core Banking System |
| CIB | Credit Information Bureau |
| CPV | Contact Point Verification |
| DBR | Debt-to-Burden Ratio |
| DPD | Days Past Due |
| ECL | Expected Credit Loss |
| e-KYC | Electronic Know Your Customer |
| IFRS-9 | International Financial Reporting Standard 9 |
| LMS | Loan Management System |
| NPA | Non-Performing Asset |
| SMA | Special Mention Account |
| TAT | Turnaround Time |

### Appendix B: References

1. Bangladesh Bank - Banking Regulation and Policy Department Circulars
2. Credit Information Bureau (CIB) Guidelines and User Manual
3. BFIU e-KYC Guidelines
4. Basel III RBCA Guidelines for Bangladesh
5. IFRS-9 Implementation Guidelines
6. ICT Security Guidelines V4.0, 2023

### Appendix C: Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Project Sponsor | | | |
| Business Owner | | | |
| Technical Lead | | | |
| QA Manager | | | |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

*This document is proprietary and confidential. Unauthorized distribution is prohibited.*

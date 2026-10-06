# User Requirements Document (URD) - Version 2.0
## Unisoft Loan Management System (ULMS) for Bangladesh Banking Sector
### Apache Fineract-Based Implementation

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | User Requirements Document - ULMS v2.0 |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 2.0 |
| **Date** | February 3, 2026 |
| **Prepared By** | Senior Solutions Architect, Technical Lead |
| **Reviewed By** | Product Management, Business Analysis Team |
| **Classification** | Confidential |
| **Status** | Approved for Development |
| **Based On** | RFP LMS-BD-2026-001, BRD v1.0, URD v1.0 |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | January 26, 2026 | Unisoft Systems | Initial URD Document |
| 2.0 | February 3, 2026 | Senior Solutions Architect | Refinement for Fineract CE implementation |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [User Classes and Characteristics](#2-user-classes-and-characteristics)
3. [Operating Environment](#3-operating-environment)
4. [User Experience Requirements](#4-user-experience-requirements)
5. [Loan Origination User Requirements](#5-loan-origination-user-requirements)
6. [Credit Management User Requirements](#6-credit-management-user-requirements)
7. [Approval Workflow User Requirements](#7-approval-workflow-user-requirements)
8. [Disbursement User Requirements](#8-disbursement-user-requirements)
9. [Servicing and Collections User Requirements](#9-servicing-and-collections-user-requirements)
10. [Document Management User Requirements](#10-document-management-user-requirements)
11. [Reporting and Analytics User Requirements](#11-reporting-and-analytics-user-requirements)
12. [Administration User Requirements](#12-administration-user-requirements)
13. [Mobile User Requirements](#13-mobile-user-requirements)
14. [Integration User Requirements](#14-integration-user-requirements)
15. [Compliance User Requirements](#15-compliance-user-requirements)
16. [Appendices](#16-appendices)

---

## 1. Introduction

### 1.1 Purpose

This User Requirements Document (URD) v2.0 defines the complete set of user requirements for the **Unisoft Loan Management System (ULMS)**, refined specifically for implementation on **Apache Fineract Community Edition**. This document specifies what users need to accomplish with the system, focusing on user tasks, workflows, and interactions.

### 1.2 Scope

This URD covers:
- All user personas and their interaction patterns with ULMS
- Complete user workflow requirements from loan application to closure
- Mobile and web interface requirements
- Reporting and analytics needs from user perspective
- Administrative and configuration functions
- Compliance-related user interactions

### 1.3 Document Alignment

| Source Document | Reference | Alignment Status |
|----------------|-----------|------------------|
| RFP LMS-BD-2026-001 | All Sections | 100% Compliant |
| BRD v1.0 | Sections 5-12 | 100% Compliant |
| URD v1.0 | All Requirements | Enhanced |
| Technology Stack v2.0 | All Sections | Architecture-aligned |
| Fineract Analysis Report | Section 3.1 | Platform-mapped |

### 1.4 Definitions and Acronyms

| Term | Definition |
|------|------------|
| **Actor** | A user or external system that interacts with ULMS |
| **User Story** | A brief description of functionality from the user's perspective |
| **Acceptance Criteria** | Conditions that must be met for a requirement to be considered complete |
| **Fineract** | Apache Fineract Community Edition - Core Banking Platform |
| **DPD** | Days Past Due |
| **PAR** | Portfolio at Risk |
| **BOCC** | Branch Officers Credit Committee |
| **CPV** | Contact Point Verification |

---

## 2. User Classes and Characteristics

### 2.1 User Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ULMS USER HIERARCHY                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        EXECUTIVE LEVEL                              │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │   │
│  │  │    MD      │  │   DMD      │  │    AMD     │  │   Board    │   │   │
│  │  │ (Level 7)  │  │ (Level 6)  │  │  (Level 5) │  │  Members   │   │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      HEAD OFFICE LEVEL                              │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │   │
│  │  │  Head of   │  │  Credit    │  │   Credit   │  │  Credit    │   │   │
│  │  │   Credit   │  │ Committee  │  │  Analyst   │  │   Admin    │   │   │
│  │  │ (Level 4)  │  │  (Level 5) │  │   (HO)     │  │            │   │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       BRANCH LEVEL                                  │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │   │
│  │  │  Branch    │  │   Branch   │  │  Credit    │  │   Branch   │   │   │
│  │  │  Manager   │  │   Credit   │  │  Analyst   │  │   User     │   │   │
│  │  │ (Level 2)  │  │   Head     │  │  (Branch)  │  │            │   │   │
│  │  └────────────┘  │ (Level 1)  │  └────────────┘  └────────────┘   │   │
│  │                  └────────────┘                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      FIELD OPERATIONS                               │   │
│  │  ┌────────────┐  ┌────────────┐                                    │   │
│  │  │  CPV       │  │ Collection │                                    │   │
│  │  │  Officer   │  │  Officer   │                                    │   │
│  │  └────────────┘  └────────────┘                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Detailed User Personas

#### 2.2.1 Persona: Rezaul - Branch Loan Officer

| Attribute | Description |
|-----------|-------------|
| **Role** | Branch Loan Officer |
| **Age** | 28 years |
| **Experience** | 3 years in banking operations |
| **Education** | BBA/MBA in Finance |
| **Technical Skill** | Basic computer literacy, MS Office |
| **Daily Tasks** | Customer data entry, document collection, application submission |
| **Goals** | Process 15-20 applications daily, minimize errors |
| **Pain Points** | Manual data entry, duplicate work, document chasing |
| **Motivations** | Performance bonuses, customer satisfaction |

**Key User Stories:**
- "I need to enter customer information quickly with auto-fill from NID"
- "I want to see which documents are missing before submission"
- "I need to track my application pipeline status"

#### 2.2.2 Persona: Fatima - Credit Analyst

| Attribute | Description |
|-----------|-------------|
| **Role** | Head Office Credit Analyst |
| **Age** | 35 years |
| **Experience** | 7 years in credit analysis |
| **Education** | MBA in Banking, Credit certification |
| **Technical Skill** | Advanced Excel, moderate system skills |
| **Daily Tasks** | Credit assessment, CIB analysis, DBR calculation, risk grading |
| **Goals** | Accurate credit decisions, risk mitigation |
| **Pain Points** | Manual CIB checks, spreadsheet-based calculations |
| **Motivations** | Career growth, professional reputation |

**Key User Stories:**
- "I need CIB reports integrated directly into the application view"
- "I want automated DBR calculation with visual indicators"
- "I need to generate credit memos with one click"

#### 2.2.3 Persona: Karim - Branch Manager

| Attribute | Description |
|-----------|-------------|
| **Role** | Branch Manager |
| **Age** | 45 years |
| **Experience** | 15 years in banking |
| **Education** | Masters in Economics |
| **Technical Skill** | Basic email, comfortable with reports |
| **Daily Tasks** | Branch operations, approval decisions, portfolio management |
| **Goals** | Meet branch targets, maintain portfolio quality |
| **Pain Points** | Limited visibility, delayed information |
| **Motivations** | Branch performance, regulatory compliance |

**Key User Stories:**
- "I need a dashboard showing branch performance at a glance"
- "I want to approve loans from my mobile when traveling"
- "I need alerts when applications are pending too long"

#### 2.2.4 Persona: Tahmina - CPV Officer

| Attribute | Description |
|-----------|-------------|
| **Role** | Contact Point Verification Officer |
| **Age** | 26 years |
| **Experience** | 2 years in field operations |
| **Education** | BBA |
| **Technical Skill** | Smartphone proficient, basic apps |
| **Daily Tasks** | Field verification, address confirmation, employment verification |
| **Goals** | Complete 8-10 verifications daily |
| **Pain Points** | Paper forms, travel time, manual report writing |
| **Motivations** | Field allowances, job flexibility |

**Key User Stories:**
- "I need a mobile app that works without internet in remote areas"
- "I want to capture photos and GPS coordinates automatically"
- "I need digital signatures from customers"

#### 2.2.5 Persona: Ahmed - Managing Director

| Attribute | Description |
|-----------|-------------|
| **Role** | Managing Director |
| **Age** | 55 years |
| **Experience** | 25 years in banking leadership |
| **Education** | Masters in Banking, Advanced Management |
| **Technical Skill** | Executive-level user, prefers summaries |
| **Daily Tasks** | Strategic oversight, board reporting, regulatory compliance |
| **Goals** | Bank profitability, regulatory compliance, strategic growth |
| **Pain Points** | Information overload, delayed insights |
| **Motivations** | Bank reputation, shareholder value |

**Key User Stories:**
- "I need executive dashboards showing KPIs in real-time"
- "I want exception alerts for NPA spikes"
- "I need board-ready reports generated automatically"

---

## 3. Operating Environment

### 3.1 Physical Environment

| Location | Conditions | Device Requirements |
|----------|------------|---------------------|
| **Bank Branches** | Air-conditioned, stable power | Desktop computers (i5+, 8GB RAM) |
| **Head Office** | Corporate environment | High-performance workstations |
| **Field Locations** | Variable, outdoor, poor connectivity | Rugged Android tablets/phones |
| **Customer Locations** | Homes, offices | Officer mobile devices |
| **Executive Offices** | Corporate | Laptops with secure access |

### 3.2 Technical Environment

| Component | Specification |
|-----------|--------------|
| **Web Browsers** | Chrome 120+, Firefox 121+, Edge 120+ |
| **Operating Systems** | Windows 10/11, Android 10+ |
| **Screen Resolution** | Minimum 1366x768, Recommended 1920x1080 |
| **Internet Connectivity** | Broadband 10Mbps+ (branch), 4G (field) |
| **Offline Capability** | CPV mobile app with sync |

### 3.3 Accessibility Requirements

| Requirement | Specification |
|-------------|---------------|
| **Language** | Bengali (primary), English (secondary) |
| **Font Size** | Adjustable 100%-150% |
| **Color Contrast** | WCAG 2.1 Level AA (4.5:1 minimum) |
| **Keyboard Navigation** | Full tab navigation support |
| **Screen Reader** | ARIA labels, alt text for images |

---

## 4. User Experience Requirements

### 4.1 General UX Requirements

#### UR-UX-001: Interface Consistency

**Priority:** Critical
**Source:** BRD 7.4

**User Requirement:**
All screens shall follow consistent design patterns:

| Element | Standard |
|---------|----------|
| Navigation | Left sidebar (collapsed option) |
| Color Scheme | Bank brand colors with accessibility compliance |
| Typography | Noto Sans Bengali, Roboto |
| Icons | Material Design icons |
| Buttons | Primary (filled), Secondary (outlined), Danger (red) |
| Forms | Labels above fields, inline validation |
| Tables | Sortable columns, pagination, row actions |

**Acceptance Criteria:**
- [ ] All screens use same component library
- [ ] Navigation pattern consistent across modules
- [ ] Bengali text renders correctly (Unicode)

#### UR-UX-002: Response Time Expectations

**Priority:** Critical
**Source:** BRD 7.1

| Operation | Maximum Response Time |
|-----------|----------------------|
| Page load | 2 seconds |
| Form submission | 3 seconds |
| Report generation | 30 seconds |
| Search results | 1 second |
| Dashboard refresh | 5 seconds |
| CIB inquiry | 2 minutes |

#### UR-UX-003: Error Handling

**Priority:** High

**User Requirement:**
Errors shall be communicated clearly:

- Error messages in Bengali and English
- Specific actionable guidance
- Error reference codes for support
- Automatic retry for transient errors
- Graceful degradation for system errors

---

## 5. Loan Origination User Requirements

### 5.1 Customer Application Entry

#### UR-LOS-001: Quick Customer Onboarding

**Priority:** Critical
**Source:** RFP 1.1, BRD 6.1.1
**Personas:** Rezaul (Branch Officer)

**User Requirement:**
As a branch officer, I need to onboard customers quickly:

| Feature | Requirement |
|---------|-------------|
| NID Auto-fill | Enter NID → Auto-populate name, DOB, address from NIDW |
| Photo Capture | Webcam/mobile camera for customer photo |
| Mobile Verification | OTP verification for primary mobile |
| Address Entry | Present address, Permanent address with map selection |
| Family Details | Spouse, dependents, emergency contact |

**Acceptance Criteria:**
- Form completion time < 5 minutes with NID auto-fill
- Real-time validation with Bengali error messages
- Auto-save every 30 seconds
- Progress indicator showing completion %

#### UR-LOS-002: Loan Product Selection

**Priority:** Critical
**Personas:** Rezaul (Branch Officer)

**User Requirement:**
Product selection interface shall provide:

- Visual product catalog with icons
- Eligibility pre-check calculator
- Interest rate and fee display
- Required documents checklist per product
- Product comparison feature

**Acceptance Criteria:**
- Product selection < 2 clicks
- Warning if customer ineligible
- Terms and conditions acceptance tracking

#### UR-LOS-003: Financial Information Capture

**Priority:** Critical

**User Requirement:**
Financial data entry shall include:

| Category | Fields |
|----------|--------|
| Income | Monthly salary, Business income, Other income, Total |
| Employment | Employer name, Designation, Department, Years of service |
| Existing Loans | Bank, Outstanding, EMI (auto-populated from CIB) |
| Assets | Property, Vehicles, Investments, Bank balances |
| References | Professional reference, Personal reference |

**Acceptance Criteria:**
- DBR auto-calculated as entries made
- Visual indicator (green/yellow/red) for DBR health
- Document upload for income proof

### 5.2 Document Upload and Management

#### UR-LOS-004: Intelligent Document Upload

**Priority:** Critical
**Source:** BRD 6.7

**User Requirement:**
Document upload shall support:

| Document Type | Format | Max Size | Validation |
|---------------|--------|----------|------------|
| NID/Passport | PDF, JPG, PNG | 5MB | OCR text extraction |
| Photograph | JPG, PNG | 2MB | Face detection, quality check |
| Income Proof | PDF | 10MB | - |
| Bank Statement | PDF | 10MB | - |
| Property Documents | PDF | 20MB | - |

**Upload Features:**
- Drag-and-drop support
- Bulk upload (up to 10 files)
- Progress indicator with cancel option
- Virus scanning notification
- Blur/detection for photos
- Missing document alerts

**Acceptance Criteria:**
- Upload progress visible
- Quality check warnings (blur, darkness)
- Virus scan completion before save
- Document checklist auto-updated

### 5.3 BOCC (Branch Officers Credit Committee) Module

#### UR-BOCC-001: Meeting Management

**Priority:** Critical
**Source:** RFP 1.2.2, BRD 6.1.3
**Personas:** Branch Credit Head

**User Requirement:**
BOCC meeting management shall provide:

| Function | Requirement |
|----------|-------------|
| Scheduling | Calendar view, member availability check |
| Agenda | Auto-generated from pending applications |
| Notifications | SMS/Email 24 hours and 1 hour before |
| Attendance | Digital check-in with biometric verification |
| Minutes | Auto-generation with editing capability |

**Acceptance Criteria:**
- Meeting setup < 3 minutes
- All members notified within 5 minutes
- Minutes generated within 10 minutes of close

#### UR-BOCC-002: Committee Review Interface

**Priority:** Critical

**User Requirement:**
During BOCC meetings, members shall:

- See one-page application summary
- View all documents in browser (no download)
- Add discussion notes
- Select recommendation (Approve/Reject/Hold/Defer)
- Capture digital signature
- Record dissenting opinions

**Acceptance Criteria:**
- Application review < 5 minutes per case
- All documents accessible offline during meeting
- Digital signature legally compliant

---

## 6. Credit Management User Requirements

### 6.1 CIB Integration

#### UR-CIB-001: Real-Time CIB Inquiry

**Priority:** Critical
**Source:** RFP 2.3, BRD 6.2.1
**Personas:** Fatima (Credit Analyst)

**User Requirement:**
As a credit analyst, I need:

| Inquiry Type | Details |
|--------------|---------|
| Individual | By NID, shows all facilities, classification, overdues |
| Corporate | By TIN/Registration, shows company and directors |
| Guarantor | CIB of proposed guarantors |
| Group Exposure | Related party exposures combined |
| Historical Trend | 24-month payment history graph |

**CIB Report Display:**
- Summary score/rating
- Facility-wise breakdown
- Classification status (color-coded)
- Overdue amounts highlighted
- Inquiry timestamp

**Acceptance Criteria:**
- CIB report retrieval < 2 minutes
- Clear visual risk indicators
- Historical data trend chart
- Export to PDF option

#### UR-CIB-002: Automated Credit Scoring

**Priority:** Critical
**Source:** BRD 6.2.2

**User Requirement:**
Credit scoring shall provide:

| Parameter | Weight | Display Format |
|-----------|--------|----------------|
| Customer Profile | 20% | Progress bar + score |
| Financial Capacity | 30% | Progress bar + score |
| Credit History (CIB) | 25% | Progress bar + score |
| Collateral Security | 15% | Progress bar + score |
| Business/Industry Risk | 10% | Progress bar + score |
| **Total Score** | **100%** | **Final score + Grade** |

**Score Interpretation:**
- 800-1000: Excellent (AAA)
- 700-799: Good (AA)
- 600-699: Fair (A)
- 500-599: Poor (BBB)
- <500: High Risk (Reject)

**Acceptance Criteria:**
- Score calculation < 30 seconds
- Component breakdown visible
- What-if analysis capability
- Override with justification

### 6.2 DBR and Financial Analysis

#### UR-DBR-001: Automated DBR Calculation

**Priority:** Critical

**User Requirement:**
DBR calculation shall:

- Capture monthly income (salary + business + other)
- Auto-detect existing EMIs from CIB
- Calculate proposed loan EMI
- Compute total DBR percentage
- Show visual gauge (green <40%, yellow 40-50%, red >50%)

**Acceptance Criteria:**
- Real-time calculation as values entered
- Warning if DBR exceeds 50%
- Explanation of calculation shown

### 6.3 Contact Point Verification (CPV)

#### UR-CPV-001: CPV Task Management

**Priority:** Critical
**Source:** RFP 2.5, BRD 6.2.3
**Personas:** Rezaul (Branch Officer), Tahmina (CPV Officer)

**User Requirement:**
CPV assignment shall include:

| Feature | Requirement |
|---------|-------------|
| Assignment | Officer selection by workload and location |
| Priority | Normal/Urgent flag with SLA |
| Due Date | Configurable (default 3 working days) |
| Notification | Mobile app push + SMS |
| Status Tracking | Assigned → In Progress → Completed |

#### UR-CPV-002: Mobile CPV Application

**Priority:** Critical
**Personas:** Tahmina (CPV Officer)

**User Requirement:**
The CPV mobile app shall provide:

| Feature | Specification |
|---------|--------------|
| Offline Mode | Full functionality without internet |
| GPS Tagging | Auto-capture location (accuracy <10m) |
| Photo Capture | High-res photos with timestamp |
| Voice Notes | Record observations |
| Digital Signature | Customer acknowledgment |
| Report Generation | Auto-generate from template |
| Sync | Auto-sync when connected |

**Verification Types:**
- Residence verification
- Office/business verification
- Reference verification
- Asset verification

**Acceptance Criteria:**
- App works offline completely
- GPS accuracy within 10 meters
- Photo quality verification
- Report submission < 5 minutes
- Conflict resolution for sync issues

---

## 7. Approval Workflow User Requirements

### 7.1 Multi-Level Approval Hierarchy

#### UR-WF-001: Approval Authority Management

**Priority:** Critical
**Source:** RFP 3.1, BRD 6.3.1

**User Requirement:**
The system shall enforce approval hierarchy:

| Level | Role | Authority (BDT) | Authority (USD) |
|-------|------|-----------------|-----------------|
| Level 1 | Branch Credit Head | Up to 5 Lakh | Up to $5,000 |
| Level 2 | Branch Manager | Up to 10 Lakh | Up to $10,000 |
| Level 3 | Regional Manager | Up to 25 Lakh | Up to $25,000 |
| Level 4 | Head of Credit | Up to 1 Crore | Up to $100,000 |
| Level 5 | Credit Committee | Up to 5 Crore | Up to $500,000 |
| Level 6 | Deputy MD | Up to 10 Crore | Up to $1M |
| Level 7 | Managing Director | Above 10 Crore | Above $1M |

**Routing Rules:**
- Auto-route based on loan amount
- Parallel routing option for urgent cases
- Delegation when approver unavailable
- Escalation on SLA breach

#### UR-WF-002: Approval Actions

**Priority:** Critical

**User Requirement:**
Approvers shall have these actions:

| Action | Description | Comments Required |
|--------|-------------|-------------------|
| Approve | Full approval | Optional |
| Approve with Conditions | Approval with stipulations | Required |
| Reject | Decline application | Required |
| Return | Send back to previous stage | Required |
| Hold | Pending additional info | Optional |
| Delegate | Forward to another approver | Required |
| Escalate | Send to higher authority | Required |

**Acceptance Criteria:**
- Approval action < 2 minutes
- Email/SMS notifications sent
- Audit trail captured

#### UR-WF-003: Digital Signatures

**Priority:** Critical
**Source:** BRD 6.3.2

**User Requirement:**
Digital signature capability shall:

- Capture signature via mouse/touch/stylus
- Apply PKI-based digital certificate
- Embed signature in approval documents
- Maintain signature audit trail
- Support non-repudiation

### 7.2 Workflow Visibility

#### UR-WF-004: Application Tracking

**Priority:** Critical
**Source:** BRD 6.3.2

**User Requirement:**
Application status tracking shall show:

- Visual workflow diagram
- Current stage highlighted
- Stage entry timestamps
- Approver names at each stage
- Comments history
- SLA countdown timer
- Expected completion date

**Acceptance Criteria:**
- Real-time status updates
- Color coding (Green/Done, Blue/In Progress, Red/Overdue)
- SLA breach alerts

---

## 8. Disbursement User Requirements

### 8.1 Pre-Disbursement Verification

#### UR-DISB-001: Automated Checklist

**Priority:** Critical
**Source:** RFP 4.1, BRD 6.4.1
**Personas:** Credit Admin

**User Requirement:**
Pre-disbursement checklist shall include:

| Check Item | Verification Method |
|------------|---------------------|
| Sanction Letter Issued | System check |
| Agreement Signed | Document presence |
| Collateral Registered | CBS/Collateral system check |
| Insurance Valid | Date verification |
| Legal Opinion | Document presence |
| Limit Loaded in CBS | API verification |
| First EMI Date Set | System check |

**Acceptance Criteria:**
- Checklist auto-populated
- All items required for disbursement
- Override capability with dual authorization

### 8.2 Disbursement Execution

#### UR-DISB-002: Multiple Disbursement Methods

**Priority:** Critical
**Source:** BRD 6.4.2

**User Requirement:**
Disbursement options shall include:

| Method | Processing Time | Confirmation |
|--------|-----------------|--------------|
| Account Credit | Real-time | CBS confirmation |
| BEFTN Transfer | 1-2 days | Transaction reference |
| bKash | Real-time | bKash confirmation |
| Nagad | Real-time | Nagad confirmation |
| Rocket | Real-time | Rocket confirmation |
| Check Issuance | Manual | Check number |

**Acceptance Criteria:**
- Disbursement execution < 2 minutes
- Customer SMS notification
- Integration with payment gateways
- Failed transaction handling

#### UR-DISB-003: Document Generation

**Priority:** High

**User Requirement:**
Auto-generated documents:

- Sanction Letter (Bengali + English)
- Disbursement Memo
- Repayment Schedule
- Welcome Letter to Customer

**Acceptance Criteria:**
- Documents in Bengali and English
- Digital signatures embedded
- PDF generation < 10 seconds

---

## 9. Servicing and Collections User Requirements

### 9.1 Loan Servicing

#### UR-SERV-001: Payment Processing

**Priority:** Critical
**Source:** RFP 5.1, BRD 6.5.1
**Personas:** Servicing Officer

**User Requirement:**
Payment processing shall support:

| Payment Type | Handling |
|--------------|----------|
| Regular EMI | Auto-allocation (Interest + Principal) |
| Partial Payment | Pro-rata allocation |
| Prepayment | Interest rebate calculation |
| Late Payment | Auto-late fee calculation |
| Excess Payment | Hold or refund option |

**Acceptance Criteria:**
- Payment posting < 1 minute
- Receipt generation (print/email)
- Real-time balance update
- SMS confirmation to customer

#### UR-SERV-002: Account Inquiry

**Priority:** High

**User Requirement:**
Account view shall display:

- Current principal outstanding
- Interest accrued
- Next EMI amount and due date
- Payment history (last 12 months)
- Late payment history
- Current DPD status

### 9.2 Loan Modifications

#### UR-SERV-003: Modification Requests

**Priority:** High
**Source:** BRD 6.5.2

**User Requirement:**
Loan modification workflows:

| Modification | Approval | Impact Calculation |
|--------------|----------|-------------------|
| Rescheduling | Required | New schedule preview |
| Restructuring | Required | Provision impact |
| Top-up | Required | Combined schedule |
| Rate Change | System/Admin | EMI change preview |
| Tenor Change | Required | EMI adjustment |
| Moratorium | Required | Interest capitalization |

### 9.3 Collections Management

#### UR-COLL-001: Delinquency Tracking

**Priority:** Critical
**Source:** RFP 6.1, BRD 6.6.1
**Personas:** Collection Officer

**User Requirement:**
Collections dashboard shall show:

| Metric | Display |
|--------|---------|
| DPD Buckets | 1-30, 31-60, 61-90, 90+ days |
| Collection Target | Daily/Monthly target vs actual |
| Promise to Pay | PTP tracking with dates |
| Field Visit Schedule | Today's visits with GPS |
| Call List | Priority-ranked calling list |

**Acceptance Criteria:**
- DPD updated daily at EOD
- Color-coded risk indicators
- Filter and sort capabilities
- Export to Excel

#### UR-COLL-002: Collection Activities

**Priority:** Critical

**User Requirement:**
Activity logging shall support:

| Activity | Data Captured |
|----------|--------------|
| Phone Call | Outcome, next action, follow-up date |
| Field Visit | GPS coordinates, photos, outcome |
| SMS/Email | Template selection, delivery status |
| Payment Promise | Amount, date, confirmation |
| Legal Notice | Notice type, date, delivery proof |

#### UR-COLL-003: NPA Management

**Priority:** Critical
**Source:** BRD 6.6.2

**User Requirement:**
NPA management shall provide:

| Classification | DPD Range | Provision % |
|----------------|-----------|-------------|
| STD-0 | Current | 1% |
| STD-1 | 1-30 days | 1% |
| STD-2 | 31-60 days | 1% |
| SMA | 61-90 days | 5% |
| SS | 91-180 days | 20% |
| DF | 181-365 days | 50% |
| B/L | >365 days | 100% |

**NPA Actions:**
- Auto-classification daily
- Provision calculation
- Recovery tracking
- Write-off workflow
- NPA recovery incentives

---

## 10. Document Management User Requirements

### 10.1 Document Repository

#### UR-DMS-001: Secure Document Storage

**Priority:** Critical
**Source:** BRD 6.7

**User Requirement:**
Document management shall provide:

| Feature | Specification |
|---------|--------------|
| Storage | AES-256 encrypted |
| Access Control | Role-based permissions |
| Version Control | Full version history |
| Audit Trail | View/download logging |
| Retention | 10 years per policy |
| Search | Full-text content search |

**Acceptance Criteria:**
- Encryption at rest and transit
- Access logging immutable
- Virus scanning on upload

### 10.2 Document Workflow

#### UR-DMS-002: Document Verification Workflow

**Priority:** High

**User Requirement:**
Document verification states:

```
Uploaded → Pending Verification → Verified → Approved → Archived
              ↓
         Rejected (with reason)
```

**Acceptance Criteria:**
- Status visible to all users
- Notification on status change
- Rejection reason mandatory
- Resubmission capability

---

## 11. Reporting and Analytics User Requirements

### 11.1 Operational Reports

#### UR-RPT-001: Standard Reports

**Priority:** High
**Source:** BRD 11

**User Requirement:**
Available reports:

| Report | Frequency | Format | Delivery |
|--------|-----------|--------|----------|
| Loan Ledger | On-demand | PDF/Excel | Download |
| Disbursement Report | Daily | PDF/Excel | Email |
| Repayment Report | Daily | PDF/Excel | Email |
| Overdue Report | Daily | PDF/Excel | Email/Dashboard |
| Aging Report | Weekly | PDF/Excel | Email |
| PAR Report | Monthly | PDF/Excel | Email |

**Acceptance Criteria:**
- Report generation < 30 seconds
- Bengali language support
- Print-friendly formatting
- Scheduled auto-generation

### 11.2 Regulatory Reports

#### UR-RPT-002: Bangladesh Bank Reports

**Priority:** Critical
**Source:** BRD 11.1, 9.1

**User Requirement:**
Regulatory reports shall include:

| Report | Frequency | Format | Auto-submit |
|--------|-----------|--------|-------------|
| CL-1 (Classified Loans) | Monthly | BB Format | No |
| CL-2 (Provisioning) | Monthly | BB Format | No |
| CL-3 (Recovery Position) | Monthly | BB Format | No |
| CL-4 (Write-off Details) | Monthly | BB Format | No |
| CL-5 (Restructured Loans) | Monthly | BB Format | No |
| CIB Subject Data | Monthly | Fixed-width | FTP |
| CIB Contract Data | Monthly | Fixed-width | FTP |

**Acceptance Criteria:**
- BB format validation
- Data integrity checks
- Submission tracking
- Error handling

### 11.3 Dashboards

#### UR-RPT-003: Management Dashboards

**Priority:** High
**Personas:** Karim (Branch Manager), Ahmed (MD)

**User Requirement:**
Dashboard views by role:

**Branch Manager Dashboard:**
- Portfolio summary (disbursed, outstanding)
- Application pipeline
- Collection performance
- NPA metrics
- Staff productivity

**MD Dashboard:**
- Bank-wide portfolio
- NPA trends
- Disbursement trends
- Branch comparison
- Regulatory compliance status

**Acceptance Criteria:**
- Real-time data refresh
- Drill-down capability
- Export to PDF/PPT
- Mobile responsive

---

## 12. Administration User Requirements

### 12.1 User Management

#### UR-ADM-001: User Lifecycle Management

**Priority:** Critical

**User Requirement:**
User management functions:

| Function | Capability |
|----------|-----------|
| Create User | Basic info, role assignment, branch |
| Modify User | Update details, change role |
| Deactivate | Soft delete with history preservation |
| Reset Password | Self-service + Admin reset |
| Approval Limits | Set authority by amount |

#### UR-ADM-002: Role Configuration

**Priority:** High

**User Requirement:**
Configurable roles:

| Role | Base Permissions |
|------|-----------------|
| Super Admin | Full system access |
| Branch Manager | Branch operations + reports |
| Credit Analyst | Credit assessment + CIB |
| Loan Officer | Application entry + tracking |
| Viewer | Read-only access |

### 12.2 Product Configuration

#### UR-ADM-003: Loan Product Setup

**Priority:** High

**User Requirement:**
Product configuration:

| Setting | Options |
|---------|---------|
| Product Name | Text (Bengali + English) |
| Interest Rate | Fixed/Floating, Min/Max/Default |
| Amount Limits | Minimum, Maximum |
| Tenor | Min/Max months |
| Repayment | Monthly/Quarterly/Bullet |
| Charges | Processing fee, Late fee |
| Documents | Required checklist |
| Workflow | Approval hierarchy |

---

## 13. Mobile User Requirements

### 13.1 CPV Mobile Application

#### UR-MOB-001: Offline Capability

**Priority:** Critical

**User Requirement:**
Offline functionality:

- Download assigned cases
- Complete verifications offline
- Capture photos with local storage
- GPS coordinates cached
- Auto-sync when online

#### UR-MOB-002: Data Capture

**Priority:** Critical

**User Requirement:**
Field data capture:

| Feature | Specification |
|---------|--------------|
| Photos | Before/after, unlimited |
| GPS | Auto-capture, manual override |
| Voice Notes | 5-minute max per note |
| Text Notes | Unlimited |
| Signature | Touch signature capture |
| Verification Checklist | Configurable per product |

---

## 14. Integration User Requirements

### 14.1 Core Banking Integration

#### UR-INT-001: CBS Real-Time Integration

**Priority:** Critical

**User Requirement:**
CBS integration shall provide:

| Function | User Experience |
|----------|----------------|
| Account Creation | Auto-create loan account in CBS |
| Limit Loading | Auto-load approved limit |
| GL Posting | Real-time accounting entries |
| Balance Inquiry | Real-time outstanding balance |
| Transaction History | View CBS transactions in ULMS |

### 14.2 External System Integration

#### UR-INT-002: Payment Gateway Integration

**Priority:** High

**User Requirement:**
Payment integration:

| Gateway | Functions |
|---------|-----------|
| bKash | Disbursement + Collection |
| Nagad | Disbursement + Collection |
| Rocket | Disbursement + Collection |
| BEFTN | Bank transfers |

---

## 15. Compliance User Requirements

### 15.1 BRPD Compliance

#### UR-COMP-001: Loan Classification Display

**Priority:** Critical

**User Requirement:**
Classification visibility:

- Auto-classification display on loan accounts
- Classification change history
- Provision amount display
- Reason for classification change

### 15.2 Audit Trail

#### UR-COMP-002: User Activity Monitoring

**Priority:** Critical

**User Requirement:**
Audit capabilities:

- View own activity history
- Search audit logs (authorized users)
- Export audit reports
- Immutable audit trail

---

## 16. Appendices

### Appendix A: User Requirement Traceability Matrix

| URD ID | Description | BRD Ref | RFP Ref | Priority | Status |
|--------|-------------|---------|---------|----------|--------|
| UR-LOS-001 | Quick Customer Onboarding | 6.1.2 | 1.1 | Critical | Approved |
| UR-LOS-002 | Loan Product Selection | 6.1.2 | 1.1 | Critical | Approved |
| UR-LOS-003 | Financial Information | 6.1.2 | 1.1 | Critical | Approved |
| UR-LOS-004 | Document Upload | 6.7 | 1.1.4 | Critical | Approved |
| UR-BOCC-001 | Meeting Management | 6.1.3 | 1.2.2 | Critical | Approved |
| UR-BOCC-002 | Committee Review | 6.1.3 | 1.2.2 | Critical | Approved |
| UR-CIB-001 | Real-Time CIB Inquiry | 6.2.1 | 2.3 | Critical | Approved |
| UR-CIB-002 | Automated Credit Scoring | 6.2.2 | 2.4 | Critical | Approved |
| UR-DBR-001 | Automated DBR Calculation | 6.2.2 | 2.4 | Critical | Approved |
| UR-CPV-001 | CPV Task Management | 6.2.3 | 2.5 | Critical | Approved |
| UR-CPV-002 | Mobile CPV Application | 6.2.3 | 2.5 | Critical | Approved |
| UR-WF-001 | Approval Authority | 6.3.1 | 3.1 | Critical | Approved |
| UR-WF-002 | Approval Actions | 6.3.2 | 3.2 | Critical | Approved |
| UR-WF-003 | Digital Signatures | 6.3.2 | 3.2 | Critical | Approved |
| UR-WF-004 | Application Tracking | 6.3.2 | 3.2 | Critical | Approved |
| UR-DISB-001 | Pre-Disbursement Checklist | 6.4.1 | 4.1 | Critical | Approved |
| UR-DISB-002 | Multiple Disbursement Methods | 6.4.2 | 4.2 | Critical | Approved |
| UR-SERV-001 | Payment Processing | 6.5.1 | 5.1 | Critical | Approved |
| UR-COLL-001 | Delinquency Tracking | 6.6.1 | 6.1 | Critical | Approved |
| UR-COLL-003 | NPA Management | 6.6.2 | 6.2 | Critical | Approved |
| UR-RPT-002 | Bangladesh Bank Reports | 11.1 | 7 | Critical | Approved |

### Appendix B: Persona-Requirement Mapping

| Persona | Primary Requirements |
|---------|---------------------|
| Rezaul (Branch Officer) | UR-LOS-001, UR-LOS-002, UR-LOS-003, UR-LOS-004 |
| Fatima (Credit Analyst) | UR-CIB-001, UR-CIB-002, UR-DBR-001 |
| Karim (Branch Manager) | UR-WF-001, UR-WF-002, UR-RPT-003 |
| Tahmina (CPV Officer) | UR-CPV-001, UR-CPV-002, UR-MOB-001 |
| Ahmed (MD) | UR-RPT-003, UR-COMP-001, UR-WF-004 |

### Appendix C: Use Case Summary

| Use Case ID | Use Case Name | Primary Actor | Priority | Complexity |
|-------------|---------------|---------------|----------|------------|
| UC-001 | Submit Loan Application | Branch User | Critical | Medium |
| UC-002 | Conduct BOCC Review | Branch Credit Head | Critical | Medium |
| UC-003 | Perform Credit Analysis | Credit Analyst | Critical | High |
| UC-004 | Approve Loan Application | Approver | Critical | Medium |
| UC-005 | Execute Disbursement | Credit Admin | Critical | Medium |
| UC-006 | Process Repayment | Servicing Officer | Critical | Low |
| UC-007 | Manage Collections | Collection Officer | Critical | Medium |
| UC-008 | Generate Regulatory Reports | Compliance Officer | Critical | High |
| UC-009 | Configure Loan Products | Product Admin | High | Medium |
| UC-010 | Perform Field Verification | CPV Officer | Critical | High |

### Appendix D: Accessibility Checklist

| Requirement | WCAG Reference | Implementation |
|-------------|----------------|----------------|
| Keyboard Navigation | 2.1.1 | Full tab navigation |
| Color Contrast | 1.4.3 | 4.5:1 minimum ratio |
| Text Resize | 1.4.4 | Up to 200% without loss |
| Screen Reader | 4.1.2 | ARIA labels on all elements |
| Focus Indicator | 2.4.7 | Visible focus on all elements |
| Error Identification | 3.3.1 | Clear error messages |
| Form Labels | 3.3.2 | Labels associated with inputs |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

*This User Requirements Document v2.0 is approved for development and provides the user-centric foundation for ULMS implementation on Apache Fineract Community Edition.*

# User Requirements Document (URD)
## Unisoft Loan Management System (ULMS) for Bangladesh Banking Sector

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | User Requirements Document - Unisoft Loan Management System |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | January 26, 2026 |
| **Prepared By** | Unisoft Systems Limited |
| **Classification** | Confidential |
| **Status** | Final |
| **Based On** | RFP LMS-BD-2026-001, BRD v1.0 |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | January 26, 2026 | Unisoft Systems | Initial URD Document |

**Document Approval**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Project Sponsor | | | |
| Business Owner | | | |
| Product Manager | | | |
| Lead Business Analyst | | | |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [User Classes and Characteristics](#2-user-classes-and-characteristics)
3. [Operating Environment](#3-operating-environment)
4. [User Requirements by Module](#4-user-requirements-by-module)
5. [Loan Origination User Requirements](#5-loan-origination-user-requirements)
6. [Credit Management User Requirements](#6-credit-management-user-requirements)
7. [Approval Workflow User Requirements](#7-approval-workflow-user-requirements)
8. [Disbursement User Requirements](#8-disbursement-user-requirements)
9. [Servicing and Collections User Requirements](#9-servicing-and-collections-user-requirements)
10. [Reporting and Analytics User Requirements](#10-reporting-and-analytics-user-requirements)
11. [Administration User Requirements](#11-administration-user-requirements)
12. [Integration User Requirements](#12-integration-user-requirements)
13. [Compliance and Regulatory User Requirements](#13-compliance-and-regulatory-user-requirements)
14. [User Interface Requirements](#14-user-interface-requirements)
15. [Appendices](#15-appendices)

---

## 1. Introduction

### 1.1 Purpose

This User Requirements Document (URD) defines the requirements for the **Unisoft Loan Management System (ULMS)** from the perspective of end-users. It specifies what users need to accomplish with the system, focusing on user tasks, workflows, and interactions rather than technical implementation details.

This document is based on and fully compliant with:
- **RFP Reference:** LMS-BD-2026-001 (Bangladesh Banking Sector)
- **BRD Version:** 1.0 (Business Requirements Document)

### 1.2 Scope

This URD covers user requirements for:
- All user roles involved in the loan lifecycle
- Customer-facing and internal user interfaces
- Workflows and business processes from user perspective
- Reporting and analytics needs
- Administrative functions

### 1.3 Definitions and Acronyms

| Term | Definition |
|------|------------|
| **User** | Any person who interacts with the ULMS system |
| **Stakeholder** | Anyone with an interest in the system (users, management, regulators) |
| **Use Case** | A description of how users interact with the system to achieve a goal |
| **User Story** | A brief description of functionality from the user's perspective |
| **Actor** | A role that interacts with the system |

### 1.4 References

1. RFP LMS-BD-2026-001 - Comprehensive RFP for Loan Management System
2. BRD v1.0 - Business Requirements Document for ULMS
3. Apache Fineract Documentation - https://fineract.apache.org/
4. Bangladesh Bank Guidelines - BRPD Circulars
5. ISO 25010 - Systems and Software Quality Requirements

---

## 2. User Classes and Characteristics

### 2.1 Primary User Classes

| User Class | Description | Count Estimate | Technical Expertise |
|------------|-------------|----------------|---------------------|
| **Branch Users** | Front-line staff handling customer applications | 500-2000 per bank | Low-Medium |
| **Credit Analysts** | Staff analyzing creditworthiness | 100-300 per bank | Medium |
| **Branch Managers** | Branch-level decision makers | 50-200 per bank | Medium |
| **CPV Officers** | Field verification officers | 50-150 per bank | Low-Medium |
| **HO Credit Staff** | Head office credit department | 20-50 per bank | Medium-High |
| **Senior Management** | DMD, MD, Board members | 5-20 per bank | Low-Medium |
| **System Administrators** | IT staff managing the system | 2-10 per bank | High |
| **Customers** | Loan applicants and borrowers | 100,000+ per bank | Variable |

### 2.2 User Personas

#### 2.2.1 Persona: Rezaul - Branch Loan Officer

| Attribute | Description |
|-----------|-------------|
| **Role** | Branch Loan Officer |
| **Experience** | 3 years in banking |
| **Technical Skill** | Basic computer literacy |
| **Goals** | Process loan applications quickly and accurately |
| **Pain Points** | Manual data entry, repetitive tasks, chasing documents |
| **Needs** | Simple interface, clear guidance, quick data entry |

**User Story:**
> "As a branch loan officer, I need to enter customer information quickly so that I can submit applications without errors and meet my daily targets."

#### 2.2.2 Persona: Fatima - Credit Analyst

| Attribute | Description |
|-----------|-------------|
| **Role** | Head Office Credit Analyst |
| **Experience** | 7 years in credit analysis |
| **Technical Skill** | Advanced Excel, moderate system skills |
| **Goals** | Make accurate credit decisions, manage risk |
| **Pain Points** | Manual CIB checks, spreadsheet-based DBR calculations |
| **Needs** | Automated calculations, comprehensive reports, decision support |

**User Story:**
> "As a credit analyst, I need to see complete customer information including CIB reports and calculated DBR instantly so that I can make informed credit decisions quickly."

#### 2.2.3 Persona: Karim - Branch Manager

| Attribute | Description |
|-----------|-------------|
| **Role** | Branch Manager |
| **Experience** | 15 years in banking |
| **Technical Skill** | Basic email, reports viewing |
| **Goals** | Meet branch targets, manage portfolio quality |
| **Pain Points** | Limited visibility, delayed reports, manual approvals |
| **Needs** | Dashboards, quick approvals, performance metrics |

**User Story:**
> "As a branch manager, I need to see my branch's loan portfolio and pending approvals at a glance so that I can manage operations effectively."

#### 2.2.4 Persona: Tahmina - CPV Officer

| Attribute | Description |
|-----------|-------------|
| **Role** | Contact Point Verification Officer |
| **Experience** | 2 years in field verification |
| **Technical Skill** | Smartphone proficient |
| **Goals** | Complete verifications accurately and on time |
| **Pain Points** | Paper forms, travel time, manual report writing |
| **Needs** | Mobile app, GPS tracking, photo capture |

**User Story:**
> "As a CPV officer, I need a mobile app that works offline and allows me to capture photos and GPS coordinates so that I can complete verifications efficiently."

#### 2.2.5 Persona: Ahmed - Managing Director

| Attribute | Description |
|-----------|-------------|
| **Role** | Managing Director |
| **Experience** | 25 years in banking |
| **Technical Skill** | Executive-level user |
| **Goals** | Strategic oversight, regulatory compliance |
| **Pain Points** | Information overload, delayed insights |
| **Needs** | Executive dashboards, key metrics, exception alerts |

**User Story:**
> "As Managing Director, I need real-time visibility into the bank's loan portfolio and NPA status so that I can make strategic decisions and ensure regulatory compliance."

---

## 3. Operating Environment

### 3.1 Physical Environment

| Location | Conditions | Requirements |
|----------|------------|--------------|
| **Bank Branches** | Air-conditioned, stable power | Desktop computers, reliable internet |
| **Head Office** | Corporate environment | High-performance workstations |
| **Field Locations** | Variable, outdoor conditions | Rugged mobile devices, offline capability |
| **Customer Locations** | Home, office visits | Mobile app with photo capabilities |

### 3.2 Technical Environment

| Component | User Requirement |
|-----------|------------------|
| **Devices** | Desktop, laptop, tablet, smartphone support |
| **Browsers** | Chrome, Firefox, Edge (latest 2 versions) |
| **Operating Systems** | Windows 10+, Android 8+ |
| **Connectivity** | Online mode (primary), offline mode (field app) |
| **Screen Resolution** | Responsive design (1024x768 minimum) |

### 3.3 Accessibility Requirements

| Requirement | Description |
|-------------|-------------|
| **Language** | Bengali (primary), English (secondary) |
| **Font Size** | Adjustable (100%-200%) |
| **Color Contrast** | WCAG 2.1 Level AA compliance |
| **Keyboard Navigation** | Full keyboard support |
| **Screen Reader** | Screen reader compatible |

---

## 4. User Requirements by Module

### 4.1 Module Overview

| Module | Primary Users | Key User Requirements |
|--------|---------------|----------------------|
| Loan Origination | Branch Users, Customers | Fast data entry, document upload, status tracking |
| Credit Management | Credit Analysts | Automated scoring, CIB integration, risk assessment |
| Approval Workflow | Managers, MD | Digital signatures, delegation, escalation |
| Disbursement | Credit Admin | Automated checks, multiple disbursement methods |
| Servicing | Servicing Team | Payment processing, account inquiries, modifications |
| Collections | Collection Officers | DPD tracking, call lists, recovery workflows |
| Reporting | All Users | Standard reports, dashboards, regulatory submissions |
| Administration | System Admins | User management, configuration, monitoring |

---

## 5. Loan Origination User Requirements

### 5.1 Customer Application Entry

#### UR-LOS-001: Customer Information Entry

**Priority:** Critical
**Source:** RFP Section 1.1, BRD 6.1.1

**User Requirement:**
As a branch loan officer, I need to enter customer information through a simple form with the following capabilities:

| Field Category | Required Fields | Validation |
|----------------|-----------------|------------|
| Personal | Name, Father's Name, Mother's Name, DOB, Gender | NID-based auto-fill |
| Contact | Mobile (verified via OTP), Email, Address | Format validation |
| Identity | NID Number (with real-time verification) | NIDW integration |
| Employment | Employer, Designation, Income | Document upload |
| Family | Spouse name, Dependents | Optional fields |

**Acceptance Criteria:**
- Form completion time < 5 minutes for standard cases
- Real-time validation with clear error messages
- Auto-save capability to prevent data loss
- Support for Bengali text input

#### UR-LOS-002: Loan Product Selection

**Priority:** Critical

**User Requirement:**
As a branch loan officer, I need to select from available loan products with clear eligibility criteria:

- Product catalog with descriptions in Bengali
- Eligibility calculator (pre-check)
- Interest rate display
- Required documents checklist per product
- Maximum/minimum amount indicators

**Acceptance Criteria:**
- Product selection < 2 clicks
- Clear display of terms and conditions
- Warning if application exceeds product limits

#### UR-LOS-003: Document Upload

**Priority:** Critical
**Source:** RFP Section 1.1.4, BRD 6.7

**User Requirement:**
As a branch loan officer, I need to upload and manage customer documents:

| Document Type | Format | Max Size | Validation |
|---------------|--------|----------|------------|
| NID/Passport | PDF, JPG, PNG | 5MB | OCR verification |
| Photograph | JPG, PNG | 2MB | Face detection |
| Income Proof | PDF | 10MB | - |
| Bank Statement | PDF | 10MB | - |
| Property Documents | PDF | 20MB | - |

**Acceptance Criteria:**
- Drag-and-drop upload
- Progress indicator
- Virus scanning notification
- Document quality check (blur detection)
- Missing document alerts

### 5.2 BOCC (Branch Officers Credit Committee) Module

#### UR-BOCC-001: Meeting Scheduling

**Priority:** Critical
**Source:** RFP Section 1.2.2, BRD 6.1.3

**User Requirement:**
As a branch credit head, I need to schedule and manage BOCC meetings:

- Calendar view for meeting scheduling
- Member availability checking
- Automated notifications (SMS/Email)
- Agenda creation with application list
- Meeting reminders (24 hours, 1 hour before)

**Acceptance Criteria:**
- Meeting setup < 3 minutes
- All members notified within 5 minutes
- Agenda auto-generated from pending applications

#### UR-BOCC-002: Committee Review

**Priority:** Critical

**User Requirement:**
As a BOCC member, I need to review applications during committee meetings:

- Application summary view (one-page)
- Document viewer with zoom capability
- Discussion notes capture
- Recommendation selection (Approve/Reject/Hold)
- Digital signature capture

**Acceptance Criteria:**
- Application review < 5 minutes per case
- All documents accessible without download
- Digital signature legally compliant

#### UR-BOCC-003: Minutes Generation

**Priority:** Critical

**User Requirement:**
As a branch credit head, I need automatic generation of meeting minutes:

- Attendance tracking
- Applications discussed summary
- Decisions recorded
- Action items identified
- PDF generation with digital signatures

**Acceptance Criteria:**
- Minutes auto-generated within 10 minutes of meeting close
- Editable before finalization
- Distribution to all members within 30 minutes

### 5.3 e-KYC Integration

#### UR-KYC-001: NID Verification

**Priority:** Critical
**Source:** RFP Section 1.2.4, BRD 6.1.4

**User Requirement:**
As a branch loan officer, I need real-time NID verification:

- NID number entry or QR code scan
- Real-time verification with NIDW database
- Photo matching with uploaded customer photo
- Address auto-population
- Verification status indicator

**Acceptance Criteria:**
- Verification response < 10 seconds
- Clear pass/fail indication
- Mismatch alerts with details

#### UR-KYC-002: Biometric Verification

**Priority:** High

**User Requirement:**
As a branch loan officer, I need biometric verification capability:

- Fingerprint scanner integration
- Facial recognition comparison
- Verification result logging
- Fallback options if biometric fails

---

## 6. Credit Management User Requirements

### 6.1 CIB Integration

#### UR-CIB-001: Online CIB Inquiry

**Priority:** Critical
**Source:** RFP Section 2.3, BRD 6.2.1

**User Requirement:**
As a credit analyst, I need to request and view CIB reports:

| Feature | User Need |
|---------|-----------|
| Individual Inquiry | Query by NID/Passport |
| Corporate Inquiry | Query by TIN/Registration |
| Guarantor Check | Query guarantor credit history |
| Group Exposure | View related party exposure |
| Historical Data | View 24-month payment history |

**Acceptance Criteria:**
- CIB report retrieval < 2 minutes
- Report display in readable format
- Classification status clearly highlighted
- Overdue amounts prominently displayed

#### UR-CIB-002: CIB Score Interpretation

**Priority:** High

**User Requirement:**
As a credit analyst, I need automated CIB score interpretation:

- Risk grade assignment based on CIB data
- Automated eligibility recommendation
- Override capability with justification
- Historical CIB tracking per customer

### 6.2 Credit Scoring

#### UR-CS-001: Automated Credit Scoring

**Priority:** Critical
**Source:** RFP Section 2.4, BRD 6.2.2

**User Requirement:**
As a credit analyst, I need automated credit scoring with the following capabilities:

| Parameter | Weight | Display |
|-----------|--------|---------|
| Customer Profile | 20% | Visual gauge |
| Financial Capacity | 30% | Visual gauge |
| Credit History | 25% | Visual gauge |
| Collateral Security | 15% | Visual gauge |
| Business/Industry Risk | 10% | Visual gauge |
| **Total Score** | **100%** | **Final score with grade** |

**Acceptance Criteria:**
- Score calculation < 30 seconds
- Explanation of score components
- What-if analysis capability

#### UR-CS-002: DBR/DTI Calculation

**Priority:** Critical

**User Requirement:**
As a credit analyst, I need automatic DBR and DTI calculations:

- Monthly income capture
- Existing EMI detection (from CIB)
- Proposed EMI calculation
- DBR percentage calculation
- Threshold violation warnings (>50%)

**Acceptance Criteria:**
- Calculation accuracy 100%
- Clear display of DBR/DTI ratios
- Warning if thresholds exceeded

### 6.3 Contact Point Verification (CPV)

#### UR-CPV-001: CPV Assignment

**Priority:** Critical
**Source:** RFP Section 2.5, BRD 6.2.3

**User Requirement:**
As a branch credit head, I need to assign and track CPV tasks:

- Field officer selection by availability and location
- Priority assignment (urgent/normal)
- Due date setting
- Mobile app notification to officer
- Status tracking (Assigned/In Progress/Completed)

#### UR-CPV-002: Mobile CPV App

**Priority:** Critical

**User Requirement:**
As a CPV officer, I need a mobile application for field verification:

| Feature | User Need |
|---------|-----------|
| Offline Mode | Work without internet |
| GPS Tagging | Automatic location capture |
| Photo Capture | Before/after photos |
| Voice Notes | Record observations |
| Digital Signature | Customer acknowledgment |
| Report Generation | Auto-generate CPV report |

**Acceptance Criteria:**
- App works offline with sync capability
- GPS accuracy within 10 meters
- Photo quality check
- Report submission < 5 minutes

---

## 7. Approval Workflow User Requirements

### 7.1 Multi-Level Approval

#### UR-WF-001: Approval Hierarchy

**Priority:** Critical
**Source:** RFP Section 3.1, BRD 6.3.1

**User Requirement:**
As a manager, I need to approve or reject loan applications based on my authority:

| Level | User Role | Authority Limit |
|-------|-----------|-----------------|
| Level 1 | Branch Credit Head | Up to 5 Lakh BDT |
| Level 2 | Branch Manager | Up to 10 Lakh BDT |
| Level 3 | Regional Manager | Up to 25 Lakh BDT |
| Level 4 | Head of Credit | Up to 1 Crore BDT |
| Level 5 | Credit Committee | Up to 5 Crore BDT |
| Level 6 | Deputy MD | Up to 10 Crore BDT |
| Level 7 | Managing Director | Above 10 Crore BDT |

**Acceptance Criteria:**
- Clear visibility of approval authority
- Automatic routing based on amount
- Delegation capability when approver unavailable

#### UR-WF-002: Approval Actions

**Priority:** Critical

**User Requirement:**
As an approver, I need the following approval capabilities:

| Action | Description |
|--------|-------------|
| **Approve** | Full approval with conditions if any |
| **Reject** | Rejection with reason code |
| **Return** | Return to previous stage with comments |
| **Hold** | Place on hold for additional documents |
| **Delegate** | Delegate to another approver |
| **Escalate** | Escalate to higher authority |

**Acceptance Criteria:**
- Approval action < 2 minutes
- Mandatory comments for reject/return
- Email/SMS notification to relevant parties

#### UR-WF-003: Digital Signatures

**Priority:** Critical

**User Requirement:**
As an approver, I need to digitally sign approvals:

- Secure digital signature capture
- PKI-based signature validation
- Signature appearance on documents
- Signature audit trail
- Non-repudiation guarantee

### 7.2 Workflow Tracking

#### UR-WF-004: Application Status Tracking

**Priority:** Critical
**Source:** RFP Section 6.2, BRD 6.3.2

**User Requirement:**
As any user, I need to track application status:

- Visual workflow diagram showing current stage
- Stage-wise timestamps
- Approver names at each stage
- Comments history
- Expected completion time (SLA)

**Acceptance Criteria:**
- Status update real-time
- Color-coded stages (Green/Completed, Blue/In Progress, Red/Delayed)
- SLA breach alerts

---

## 8. Disbursement User Requirements

### 8.1 Pre-Disbursement Checks

#### UR-DISB-001: Document Verification

**Priority:** Critical
**Source:** RFP Section 4.1, BRD 6.4.1

**User Requirement:**
As a credit admin, I need to verify all required documents before disbursement:

| Check Item | Verification Method |
|------------|---------------------|
| Sanction Letter | Auto-generated check |
| Agreement Signed | Document upload check |
| Collateral Registered | System verification |
| Insurance Valid | Date verification |
| Legal Opinion | Document presence |
| Limit Loaded | CBS integration check |

**Acceptance Criteria:**
- Checklist auto-populated
- All items must be checked before disbursement
- Override capability with authorization

### 8.2 Disbursement Methods

#### UR-DISB-002: Multiple Disbursement Options

**Priority:** Critical
**Source:** RFP Section 4.2, BRD 6.4.2

**User Requirement:**
As a credit admin, I need multiple disbursement methods:

| Method | User Need |
|--------|-----------|
| Account Credit | Credit to customer account in CBS |
| Bank Transfer | Transfer to other bank via BEFTN |
| bKash | Disburse to bKash wallet |
| Nagad | Disburse to Nagad wallet |
| Rocket | Disburse to Rocket wallet |
| Check | Generate check for pickup |

**Acceptance Criteria:**
- Disbursement execution < 2 minutes
- Confirmation receipt generated
- SMS notification to customer
- Integration with payment gateways

#### UR-DISB-003: Disbursement Letter Generation

**Priority:** High

**User Requirement:**
As a credit admin, I need automatic generation of disbursement letters:

- Auto-populated with customer and loan details
- Bengali and English language support
- Digital signature of authorized officer
- Multiple copies (customer, branch, file)

---

## 9. Servicing and Collections User Requirements

### 9.1 Repayment Management

#### UR-SERV-001: Payment Processing

**Priority:** Critical
**Source:** RFP Section 5.1, BRD 6.5.1

**User Requirement:**
As a servicing officer, I need to process loan repayments:

| Payment Type | User Need |
|--------------|-----------|
| Regular EMI | Process monthly installments |
| Partial Payment | Accept partial payments |
| Prepayment | Process early repayments |
| Late Payment | Calculate and collect late fees |
| Excess Payment | Handle overpayments |

**Acceptance Criteria:**
- Payment posting < 1 minute
- Receipt generation
- Real-time balance update
- SMS confirmation to customer

#### UR-SERV-002: Account Inquiry

**Priority:** High

**User Requirement:**
As a servicing officer or customer, I need to view account details:

- Current outstanding balance
- Next EMI amount and due date
- Payment history
- Interest breakdown
- Charges and fees detail
- Loan status

### 9.2 Loan Modifications

#### UR-SERV-003: Loan Rescheduling

**Priority:** High
**Source:** RFP Section 5.3, BRD 6.5.2

**User Requirement:**
As a servicing manager, I need to process loan modifications:

| Modification Type | User Need |
|-------------------|-----------|
| Rescheduling | Change repayment dates |
| Restructuring | Modify loan terms |
| Top-up | Add to existing loan |
| Rate Change | Modify interest rate |
| Tenor Change | Extend/reduce loan period |
| Moratorium | Payment holiday |

**Acceptance Criteria:**
- Approval workflow for modifications
- Impact calculation before approval
- New repayment schedule generation

### 9.3 Collections Management

#### UR-COLL-001: DPD Tracking

**Priority:** Critical
**Source:** RFP Section 6.1, BRD 6.6.1

**User Requirement:**
As a collection officer, I need to track delinquent accounts:

- Automatic DPD calculation
- Aging bucket classification (1-30, 31-60, 61-90, 90+)
- Collection priority scoring
- Customer contact information
- Payment promise tracking

**Acceptance Criteria:**
- DPD updated daily
- Clear visual indicators (color-coded)
- Filter and sort capabilities

#### UR-COLL-002: Collection Activities

**Priority:** Critical

**User Requirement:**
As a collection officer, I need to log collection activities:

| Activity | User Need |
|----------|-----------|
| Phone Call | Log call outcome, next action |
| Field Visit | GPS-tagged visit log |
| SMS/Email | Send automated/manual messages |
| Payment Promise | Record PTP with date |
| Legal Notice | Generate and track notices |

#### UR-COLL-003: NPA Management

**Priority:** Critical
**Source:** RFP Section 6.2, BRD 6.6.2

**User Requirement:**
As a collection manager, I need NPA management capabilities:

| Classification | DPD Range | Provision |
|----------------|-----------|-----------|
| STD-0 (Standard) | Current | 1% |
| STD-1 (Watch) | 1-30 days | 1% |
| STD-2 (Caution) | 31-60 days | 1% |
| SMA | 61-90 days | 5% |
| SS | 91-180 days | 20% |
| DF | 181-360 days | 50% |
| B/L | >360 days | 100% |

**Acceptance Criteria:**
- Automatic classification based on DPD
- Provision calculation
- NPA reporting

---

## 10. Reporting and Analytics User Requirements

### 10.1 Standard Reports

#### UR-RPT-001: Operational Reports

**Priority:** High
**Source:** RFP Section 7, BRD 11

**User Requirement:**
As any user, I need access to standard reports:

| Report | User Need | Frequency |
|--------|-----------|-----------|
| Loan Ledger | View transaction history | On-demand |
| Disbursement Report | View disbursements | Daily |
| Repayment Report | View collections | Daily |
| Overdue Report | View overdue loans | Daily |
| Aging Report | View aging buckets | Weekly |
| PAR Report | Portfolio at risk | Monthly |
| Branch-wise Report | Compare branches | Monthly |

**Acceptance Criteria:**
- Report generation < 30 seconds
- Export to PDF/Excel
- Print-friendly format
- Bengali language support

#### UR-RPT-002: Regulatory Reports

**Priority:** Critical

**User Requirement:**
As a compliance officer, I need to generate regulatory reports:

| Report | Frequency | Format |
|--------|-----------|--------|
| CL-1 (Classified Loans) | Monthly | Bangladesh Bank format |
| CL-2 (Provisioning) | Monthly | Bangladesh Bank format |
| CL-3 (Recovery Position) | Monthly | Bangladesh Bank format |
| CL-4 (Write-off Details) | Monthly | Bangladesh Bank format |
| CL-5 (Restructured Loans) | Monthly | Bangladesh Bank format |
| CIB Batch Files | Monthly | Fixed-width text |

**Acceptance Criteria:**
- Auto-generation on schedule
- Validation before submission
- Submission tracking

### 10.2 Dashboards

#### UR-RPT-003: Management Dashboards

**Priority:** High
**Source:** RFP Section 7.3, BRD 11.2

**User Requirement:**
As a manager, I need visual dashboards:

| Dashboard | User Need |
|-----------|-----------|
| Portfolio Overview | Total portfolio, PAR, NPA % |
| Application Pipeline | Applications by stage |
| Disbursement Trends | Monthly disbursements |
| Collection Efficiency | Collection rate, overdue |
| NPA Analysis | NPA by bucket, aging |
| Branch Performance | Branch comparisons |

**Acceptance Criteria:**
- Real-time data refresh
- Drill-down capability
- Chart and table views

---

## 11. Administration User Requirements

### 11.1 User Management

#### UR-ADM-001: User Creation

**Priority:** Critical
**Source:** RFP Section 8, BRD 12

**User Requirement:**
As a system admin, I need to manage system users:

- Create user accounts
- Assign roles and permissions
- Set office/branch assignment
- Define approval limits
- Activate/deactivate users
- Reset passwords

#### UR-ADM-002: Role Configuration

**Priority:** High

**User Requirement:**
As a system admin, I need to configure roles:

| Role | Permissions |
|------|-------------|
| Super Admin | Full system access |
| Branch Manager | Branch-level operations |
| Credit Analyst | Credit assessment |
| Loan Officer | Application entry |
| Viewer | Read-only access |

### 11.2 Product Configuration

#### UR-ADM-003: Loan Product Setup

**Priority:** High

**User Requirement:**
As a product admin, I need to configure loan products:

- Product name and description
- Interest rates (min/max/default)
- Amount limits
- Tenor limits
- Repayment frequency
- Charges and fees
- Required documents
- Approval workflow

### 11.3 System Configuration

#### UR-ADM-004: System Settings

**Priority:** High

**User Requirement:**
As a system admin, I need to configure system settings:

- Organization hierarchy
- Working days and holidays
- Currency settings (BDT)
- Number format (Lakhs/Crores)
- Email/SMS gateway
- Audit settings

---

## 12. Integration User Requirements

### 12.1 Core Banking Integration

#### UR-INT-001: CBS Integration

**Priority:** Critical
**Source:** RFP Section 9, BRD 8

**User Requirement:**
As a system user, I need seamless CBS integration:

| Function | User Need |
|----------|-----------|
| Account Creation | Auto-create loan accounts in CBS |
| Limit Loading | Auto-load approved limits |
| GL Posting | Automatic accounting entries |
| Balance Inquiry | Real-time balance check |
| Transaction History | View CBS transactions |

### 12.2 External Integrations

#### UR-INT-002: Payment Gateway Integration

**Priority:** High

**User Requirement:**
As a user, I need integration with payment systems:

- bKash disbursement and collection
- Nagad disbursement and collection
- Rocket integration
- BEFTN transfers
- Card payments

#### UR-INT-003: NID/e-KYC Integration

**Priority:** Critical

**User Requirement:**
As a branch user, I need NID verification:

- Real-time NID validation
- Photo matching
- Address verification
- Biometric verification

---

## 13. Compliance and Regulatory User Requirements

### 13.1 BRPD Compliance

#### UR-COMP-001: Loan Classification

**Priority:** Critical
**Source:** RFP Section 9.1, BRD 9.1

**User Requirement:**
As a compliance officer, I need automatic loan classification:

- Automatic DPD calculation
- Classification per BRPD 15/2024
- Provision calculation
- Classification reports (CL-1 to CL-5)

### 13.2 IFRS-9 Compliance

#### UR-COMP-002: ECL Calculation

**Priority:** High
**Source:** RFP Section 9.2, BRD 9.2

**User Requirement:**
As a finance officer, I need IFRS-9 ECL calculations:

| Stage | Calculation |
|-------|-------------|
| Stage 1 | 12-month ECL |
| Stage 2 | Lifetime ECL |
| Stage 3 | Lifetime ECL (Credit Impaired) |

### 13.3 CIB Reporting

#### UR-COMP-003: CIB Submissions

**Priority:** Critical

**User Requirement:**
As a compliance officer, I need CIB reporting:

- Subject data file generation
- Contract data file generation
- Monthly batch submission
- Real-time updates
- Submission confirmation

---

## 14. User Interface Requirements

### 14.1 General UI Requirements

#### UR-UI-001: Interface Design

**Priority:** High

**User Requirement:**
As a user, I need an intuitive interface:

- Clean, modern design
- Consistent navigation
- Breadcrumb trails
- Search functionality
- Favorites/bookmarks
- Recent items list

#### UR-UI-002: Language Support

**Priority:** Critical

**User Requirement:**
As a user, I need Bengali language support:

- Bengali interface (primary)
- English interface (secondary)
- Easy language switching
- Bengali number formatting
- Bengali date format

#### UR-UI-003: Notifications

**Priority:** High

**User Requirement:**
As a user, I need notification capabilities:

| Notification Type | Channel |
|-------------------|---------|
| Task Assignments | In-app, Email |
| Approvals Pending | In-app, SMS |
| SLA Alerts | In-app, Email |
| System Alerts | In-app |
| Report Completion | Email |

### 14.2 Accessibility Requirements

#### UR-UI-004: Accessibility

**Priority:** Medium

**User Requirement:**
As a user with disabilities, I need accessible features:

- Keyboard navigation
- Screen reader support
- High contrast mode
- Adjustable font sizes
- Alt text for images

---

## 15. Appendices

### Appendix A: User Requirement Traceability Matrix

| URD ID | Description | BRD Ref | RFP Ref | Priority | Status |
|--------|-------------|---------|---------|----------|--------|
| UR-LOS-001 | Customer Information Entry | 6.1.2 | 1.1 | Critical | Approved |
| UR-LOS-002 | Loan Product Selection | 6.1.2 | 1.1 | Critical | Approved |
| UR-LOS-003 | Document Upload | 6.7 | 1.1.4 | Critical | Approved |
| UR-BOCC-001 | Meeting Scheduling | 6.1.3 | 1.2.2 | Critical | Approved |
| UR-BOCC-002 | Committee Review | 6.1.3 | 1.2.2 | Critical | Approved |
| UR-BOCC-003 | Minutes Generation | 6.1.3 | 1.2.2 | Critical | Approved |
| UR-KYC-001 | NID Verification | 6.1.4 | 1.2.4 | Critical | Approved |
| UR-CIB-001 | Online CIB Inquiry | 6.2.1 | 2.3 | Critical | Approved |
| UR-CS-001 | Automated Credit Scoring | 6.2.2 | 2.4 | Critical | Approved |
| UR-CS-002 | DBR/DTI Calculation | 6.2.2 | 2.4 | Critical | Approved |
| UR-CPV-001 | CPV Assignment | 6.2.3 | 2.5 | Critical | Approved |
| UR-CPV-002 | Mobile CPV App | 6.2.3 | 2.5 | Critical | Approved |
| UR-WF-001 | Approval Hierarchy | 6.3.1 | 3.1 | Critical | Approved |
| UR-WF-002 | Approval Actions | 6.3.2 | 3.2 | Critical | Approved |
| UR-WF-003 | Digital Signatures | 6.3.2 | 3.2 | Critical | Approved |
| UR-WF-004 | Application Status Tracking | 6.3.2 | 3.2 | Critical | Approved |
| UR-DISB-001 | Document Verification | 6.4.1 | 4.1 | Critical | Approved |
| UR-DISB-002 | Multiple Disbursement Options | 6.4.2 | 4.2 | Critical | Approved |
| UR-SERV-001 | Payment Processing | 6.5.1 | 5.1 | Critical | Approved |
| UR-SERV-003 | Loan Rescheduling | 6.5.2 | 5.3 | High | Approved |
| UR-COLL-001 | DPD Tracking | 6.6.1 | 6.1 | Critical | Approved |
| UR-COLL-003 | NPA Management | 6.6.2 | 6.2 | Critical | Approved |
| UR-RPT-002 | Regulatory Reports | 11.1 | 7 | Critical | Approved |
| UR-COMP-001 | Loan Classification | 9.1 | 9.1 | Critical | Approved |

### Appendix B: Use Case Summary

| Use Case ID | Use Case Name | Primary Actor | Priority |
|-------------|---------------|---------------|----------|
| UC-001 | Submit Loan Application | Branch User | Critical |
| UC-002 | Conduct BOCC Review | Branch Credit Head | Critical |
| UC-003 | Perform Credit Analysis | Credit Analyst | Critical |
| UC-004 | Approve Loan Application | Branch Manager | Critical |
| UC-005 | Disburse Loan | Credit Admin | Critical |
| UC-006 | Process Loan Repayment | Servicing Officer | Critical |
| UC-007 | Manage Collections | Collection Officer | Critical |
| UC-008 | Generate Reports | All Users | High |
| UC-009 | Configure Products | System Admin | High |
| UC-010 | Manage Users | System Admin | Critical |

### Appendix C: Glossary

| Term | Definition |
|------|------------|
| **Actor** | A user or system that interacts with ULMS |
| **BRPD** | Banking Regulation and Policy Department |
| **CIB** | Credit Information Bureau |
| **CPV** | Contact Point Verification |
| **DBR** | Debt-to-Burden Ratio |
| **DTI** | Debt-to-Income Ratio |
| **DPD** | Days Past Due |
| **ECL** | Expected Credit Loss |
| **e-KYC** | Electronic Know Your Customer |
| **EMI** | Equated Monthly Installment |
| **NID** | National Identity Card |
| **NPA** | Non-Performing Asset |
| **PAR** | Portfolio at Risk |
| **SLA** | Service Level Agreement |
| **TAT** | Turnaround Time |
| **URD** | User Requirements Document |
| **Use Case** | A sequence of actions to achieve a goal |
| **User Story** | A description of functionality from user perspective |

### Appendix D: Document References

1. RFP LMS-BD-2026-001 - Request for Proposal for Loan Management System
2. BRD v1.0 - Business Requirements Document for ULMS
3. Apache Fineract Documentation
4. Bangladesh Bank Guidelines
5. IEEE 830-1998 - Recommended Practice for Software Requirements Specifications

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

*This document is proprietary and confidential. Unauthorized distribution is prohibited.*

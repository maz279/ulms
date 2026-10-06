# Comprehensive RFP for Loan Management System (LMS)
## Bangladesh Banking Sector - Executive Summary

**RFP Reference:** LMS-BD-2026-001  
**Issue Date:** January 2026  
**Target Market:** 62 Scheduled Commercial Banks of Bangladesh

---

## Research Highlights

### Bangladesh Banking Sector Overview

| Category | Count | Examples |
|----------|-------|----------|
| State-Owned Commercial Banks (SOCBs) | 6 | Sonali, Janata, Agrani, Rupali |
| Specialized Development Banks (SDBs) | 3 | Bangladesh Krishi Bank, Probashi Kallyan Bank |
| Private Commercial Banks (Conventional) | 33 | BRAC, City, Dutch-Bangla, Bank Asia, EBL |
| Private Commercial Banks (Islamic) | 10 | Islami Bank, Al-Arafah, EXIM Bank |
| Foreign Commercial Banks (FCBs) | 9 | Standard Chartered, HSBC, Citibank |
| **Total Scheduled Banks** | **62** | |

### Key Regulatory Framework

1. **Bangladesh Bank Order, 1972** - Central bank authority
2. **Bank Company Act, 1991** - Banking operations regulation
3. **Money Laundering Prevention Act, 2012** - AML/CFT requirements
4. **Anti-Terrorism Act, 2009** - CTF compliance
5. **Basel III RBCA Guidelines** - Capital adequacy (12.5% CAR by 2026)
6. **BFIU e-KYC Guidelines** - Digital customer onboarding
7. **BRPD Circulars** - Loan classification and provisioning
8. **Payment and Settlement Systems Act, 2024** - Digital payments

### Bangladesh Bank 2025-2027 Digital Roadmap

- **75% Cashless Transactions** by 2027
- **Inclusive Instant Payment System (IIPS)** by July 2027
- **IFRS-9 ECL Provisioning** mandatory by December 2027
- **Digital Banking Licenses** with BDT 300 crore minimum capital
- **AI Policy** with explainability requirements

---

## Top 5 Global LMS Solutions (Benchmark)

### 1. Finastra Fusion Loan IQ
- **Market Share:** ~70% of global syndicated loan volume
- **Strengths:** Enterprise-grade, Basel III compliant, global bank adoption
- **Best For:** Large commercial and investment banks

### 2. Temenos LMS
- **Clients:** 950+ banks globally
- **Strengths:** Cloud-native, AI-powered, Shariah-compliant modules
- **Best For:** Universal banks including Islamic banking

### 3. TCS BaNCS Lending
- **Presence:** Strong in Asia and Middle East
- **Strengths:** End-to-end automation, robust integration capabilities
- **Best For:** Asian and MEA banks

### 4. Infosys Finacle Lending
- **Reach:** 100+ countries, 1 billion end users
- **Strengths:** API-first, comprehensive digital lending
- **Best For:** Banks seeking digital transformation

### 5. Nucleus FinnOne Neo
- **Clients:** 200+ FIs in 50+ countries
- **Strengths:** South Asian market expertise, retail and corporate lending
- **Best For:** South Asian banks and NBFCs

---

## RFP Key Sections

### 1. Functional Requirements

#### Loan Products Coverage
- **Retail:** Personal, Home, Auto, Education, Credit Cards, Agricultural
- **SME/Commercial:** Working Capital, Term Loans, Trade Finance, Project Finance
- **Islamic:** Murabaha, Ijara, Musharaka, Mudaraba, Istisna, Bai-Muajjal

#### Core Modules
1. **Loan Origination** - Customer requisition, BOCC workflow, data entry
2. **e-KYC Integration** - NID verification, biometric authentication
3. **CIB Integration** - Credit inquiry, dedupe checking
4. **Credit Scoring** - AI/ML-based scoring, DBR calculation
5. **Approval Workflow** - Multi-level hierarchy with digital signatures
6. **Document Management** - AES-encrypted DMS, auto-generated reports
7. **Disbursement** - Limit loading, CBS integration
8. **Servicing** - Repayment, restructuring, moratorium
9. **Collections** - DPD tracking, NPA management, provisioning

### 2. Compliance Requirements

- Bangladesh Bank BRPD Circulars
- BFIU AML/KYC Guidelines
- Basel III Capital Adequacy
- IFRS-9 ECL Model (by Dec 2027)
- CIB Reporting
- Green Banking (5% minimum)

### 3. Technical Requirements

#### Architecture
- Microservices-based
- API-first design
- Cloud-native/hybrid deployment
- Event-driven processing

#### Technology Stack
| Component | Options |
|-----------|---------|
| Frontend | React, Angular, Vue.js, Thymeleaf |
| Backend | Java Spring Boot, .NET Core, Node.js |
| Database | Oracle, PostgreSQL, MySQL, MongoDB |
| DMS | LogicalDOC, Alfresco |
| Reporting | JasperReports, BIRT, Power BI |

#### Security
- AES-256 encryption
- TLS 1.3
- RBAC with MFA
- HSM integration
- ICT Security Guidelines V4.0 compliance

### 4. Integration Points

| System | Purpose |
|--------|---------|
| Core Banking System (CBS) | Account management, GL posting |
| CIB Online System | Credit inquiry |
| NID Database (NIDW) | e-KYC verification |
| Card Management System | Credit card limits |
| AML System | Sanction screening |
| SMS/Email Gateway | Notifications |

---

## Vendor Qualifications

### Mandatory
- 5+ years banking software experience
- 3+ LMS implementations in 100+ branch banks
- ISO 27001 certified
- BDT 50 crore minimum annual revenue
- Local presence/partnership in Bangladesh

### Preferred
- Bangladesh implementation experience
- CIB integration experience
- Islamic banking module
- CMMI Level 3+
- Dhaka support center

---

## Evaluation Criteria

| Criteria | Weight |
|----------|--------|
| **Technical (70%)** | |
| Functional Requirements | 25% |
| Architecture & Scalability | 15% |
| Regulatory Compliance | 15% |
| Integration Capabilities | 10% |
| Security Features | 10% |
| User Experience | 5% |
| Product Demo | 10% |
| **Commercial (30%)** | |
| Total Cost of Ownership | 15% |
| Implementation Timeline | 5% |
| Payment Terms | 5% |
| Warranty & Support | 5% |

**Minimum Qualifying Score:** 60% Technical

---

## Key Dates

| Milestone | Date |
|-----------|------|
| RFP Issue | January 27, 2026 |
| Pre-Bid Conference | February 10, 2026 |
| Submission Deadline | March 17, 2026 |
| Vendor Demos | April 8-15, 2026 |
| Final Selection | April 30, 2026 |
| Contract Award | May 15, 2026 |

---

## Sources & References

### Bangladesh Bank Resources
- [Bangladesh Bank Guidelines](https://www.bb.org.bd/en/index.php/about/guidelist)
- [CIB Department](https://www.bb.org.bd/en/index.php/about/deptdtl/11)
- [Digital Bank Guidelines V2](https://www.bb.org.bd/aboutus/regulationguideline/brpd/digitalbank_version-2_english.pdf)

### Regulatory References
- BRPD Circular No. 15/2024 - Loan Classification
- BFIU Circular No. 25 - e-KYC Guidelines
- ICT Security Guidelines V4.0, 2023
- CBS Features and Controls V2.0
- Bank Resolution Ordinance, 2025

### Industry Research
- Gartner Peer Insights - Loan Management Systems
- LMS Market Report 2024-2028
- Bangladesh Banking Regulation 2026 (Chambers)

---

*Document prepared based on extensive research of Bangladesh banking regulations and global LMS best practices.*

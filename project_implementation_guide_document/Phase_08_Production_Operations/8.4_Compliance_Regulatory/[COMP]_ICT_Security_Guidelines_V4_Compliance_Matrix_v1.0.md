# ICT Security Guidelines V4.0 Compliance Matrix

## ULMS v2.0 - Bangladesh Bank ICT Security Compliance

---

**Document Control**

| Field | Value |
|-------|-------|
| Document ID | ULMS-COMP-ICT-002 |
| Version | 1.0 |
| Status | Final |
| Classification | Confidential - Security |
| Effective Date | February 2026 |
| Review Cycle | Quarterly |
| Owner | CISO |
| Approver | CEO |

---

## Revision History

| Version | Date | Author | Changes | Approver |
|---------|------|--------|---------|----------|
| 0.1 | 2026-01-10 | Security Team | Initial mapping | - |
| 0.5 | 2026-01-20 | Compliance | Detailed controls | - |
| 0.9 | 2026-01-28 | External Auditor | Review | - |
| 1.0 | 2026-02-05 | CISO | Final release | CEO |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Governance and Organization](#2-governance-and-organization)
3. [Information Security Policy](#3-information-security-policy)
4. [Human Resource Security](#4-human-resource-security)
5. [Asset Management](#5-asset-management)
6. [Access Control](#6-access-control)
7. [Cryptography](#7-cryptography)
8. [Physical Security](#8-physical-security)
9. [Operations Security](#9-operations-security)
10. [Communications Security](#10-communications-security)
11. [System Development](#11-system-development)
12. [Supplier Relationships](#12-supplier-relationships)
13. [Incident Management](#13-incident-management)
14. [Business Continuity](#14-business-continuity)
15. [Compliance](#15-compliance)
16. [Appendices](#16-appendices)

---

## 1. Introduction

### 1.1 Purpose
This document maps ULMS v2.0 controls to Bangladesh Bank ICT Security Guidelines V4.0 requirements.

### 1.2 Compliance Scope
All 15 domains of ICT Security Guidelines V4.0 are addressed.

### 1.3 Compliance Legend

| Status | Description |
|--------|-------------|
| ✅ Fully Compliant | Control fully implemented |
| ⚠️ Partially Compliant | Control partially implemented |
| ❌ Non-Compliant | Control not yet implemented |
| 🔄 In Progress | Implementation ongoing |

---

## 2. Governance and Organization

### 2.1 ICT Security Governance Framework

| Guideline Clause | Requirement | ULMS Implementation | Status |
|------------------|-------------|---------------------|--------|
| 4.1.1 | Board responsibility for ICT security | Security policies approved by Board | ✅ |
| 4.1.2 | ICT Security Committee | Quarterly security committee meetings | ✅ |
| 4.1.3 | CISO appointment | Dedicated CISO role | ✅ |
| 4.1.4 | Security roles and responsibilities | RACI matrix documented | ✅ |
| 4.1.5 | Security awareness program | Quarterly training for all staff | ✅ |

### 2.2 Compliance Evidence

| Evidence | Location | Review Date |
|----------|----------|-------------|
| Board Minutes | Board Portal | Quarterly |
| Security Committee Minutes | SharePoint | Quarterly |
| CISO Appointment Letter | HR Files | Annual |
| RACI Matrix | Confluence | Annual |
| Training Records | LMS | Monthly |

---

## 3. Information Security Policy

### 3.1 Policy Framework

| Guideline Clause | Requirement | ULMS Implementation | Status |
|------------------|-------------|---------------------|--------|
| 5.1.1 | Information security policy | Approved policy v2.0 | ✅ |
| 5.1.2 | Policy review annually | Last review: Jan 2026 | ✅ |
| 5.1.3 | Policy communication | Published on intranet | ✅ |
| 5.1.4 | Topic-specific policies | 12 topic policies defined | ✅ |

### 3.2 ULMS Security Policies

| Policy | Document ID | Last Review | Next Review |
|--------|-------------|-------------|-------------|
| Information Security Policy | SEC-POL-001 | 2026-01 | 2027-01 |
| Access Control Policy | SEC-POL-002 | 2026-01 | 2027-01 |
| Data Classification Policy | SEC-POL-003 | 2026-01 | 2027-01 |
| Incident Response Policy | SEC-POL-004 | 2026-01 | 2027-01 |
| Business Continuity Policy | SEC-POL-005 | 2026-01 | 2027-01 |
| Cryptographic Policy | SEC-POL-006 | 2026-01 | 2027-01 |
| Network Security Policy | SEC-POL-007 | 2026-01 | 2027-01 |
| Mobile Device Policy | SEC-POL-008 | 2026-01 | 2027-01 |
| Password Policy | SEC-POL-009 | 2026-01 | 2027-01 |
| Vendor Security Policy | SEC-POL-010 | 2026-01 | 2027-01 |
| Acceptable Use Policy | SEC-POL-011 | 2026-01 | 2027-01 |
| Remote Access Policy | SEC-POL-012 | 2026-01 | 2027-01 |

---

## 4. Human Resource Security

### 4.1 Prior to Employment

| Guideline Clause | Requirement | ULMS Implementation | Status |
|------------------|-------------|---------------------|--------|
| 6.1.1 | Background verification | BGV for all employees | ✅ |
| 6.1.2 | Confidentiality agreements | Signed by all staff | ✅ |
| 6.1.3 | Terms and conditions | Security clauses in contracts | ✅ |

### 4.2 During Employment

| Guideline Clause | Requirement | ULMS Implementation | Status |
|------------------|-------------|---------------------|--------|
| 6.2.1 | Management responsibilities | Security in job descriptions | ✅ |
| 6.2.2 | Information security awareness | Monthly newsletters + training | ✅ |
| 6.2.3 | Training and education | Role-based security training | ✅ |
| 6.2.4 | Disciplinary process | Documented in HR policy | ✅ |

### 4.3 Termination and Change

| Guideline Clause | Requirement | ULMS Implementation | Status |
|------------------|-------------|---------------------|--------|
| 6.3.1 | Termination responsibilities | HR checklist includes security | ✅ |
| 6.3.2 | Return of assets | Asset return form mandatory | ✅ |
| 6.3.3 | Removal of access rights | Automated access revocation | ✅ |

---

## 5. Asset Management

### 5.1 Responsibility for Assets

| Guideline Clause | Requirement | ULMS Implementation | Status |
|------------------|-------------|---------------------|--------|
| 7.1.1 | Inventory of assets | CMDB with all assets | ✅ |
| 7.1.2 | Ownership | Asset owners assigned | ✅ |
| 7.1.3 | Acceptable use | Acceptable Use Policy | ✅ |
| 7.1.4 | Return of assets | Exit checklist enforced | ✅ |

### 5.2 Information Classification

| Guideline Clause | Requirement | ULMS Implementation | Status |
|------------------|-------------|---------------------|--------|
| 7.2.1 | Classification guidelines | 4-level classification | ✅ |
| 7.2.2 | Labeling | Automated watermarking | ✅ |
| 7.2.3 | Handling | Handling procedures by class | ✅ |

### 5.3 ULMS Data Classification

| Classification | Definition | Examples | Handling |
|----------------|------------|----------|----------|
| **Critical** | Bank survival depends on it | Core banking data, keys | Encryption, strict access |
| **Confidential** | Significant competitive advantage | Customer PII, loan details | Encryption, need-to-know |
| **Internal** | Business use only | Internal reports, policies | Access control |
| **Public** | Approved for public release | Marketing materials | No special handling |

---

## 6. Access Control

### 6.1 Business Requirements

| Guideline Clause | Requirement | ULMS Implementation | Status |
|------------------|-------------|---------------------|--------|
| 8.1.1 | Access control policy | Documented and approved | ✅ |
| 8.1.2 | Access to networks | NAC implemented | ✅ |
| 8.1.3 | Access to OS | Role-based OS access | ✅ |
| 8.1.4 | Access to apps | RBAC in ULMS | ✅ |
| 8.1.5 | Segregation of duties | SoD matrix implemented | ✅ |

### 6.2 User Access Management

| Guideline Clause | Requirement | ULMS Implementation | Status |
|------------------|-------------|---------------------|--------|
| 8.2.1 | User registration | HR-driven provisioning | ✅ |
| 8.2.2 | Privilege management | Role-based with approval | ✅ |
| 8.2.3 | Password management | Keycloak with strong policy | ✅ |
| 8.2.4 | Review of rights | Quarterly access review | ✅ |

### 6.3 ULMS Access Control Matrix

| Role | Loan View | Loan Edit | Approve | Admin | Reports |
|------|-----------|-----------|---------|-------|---------|
| Branch Staff | Own branch | Own branch | No | No | Basic |
| Branch Manager | Own branch | Own branch | < 10M | No | Branch |
| Credit Officer | All | No | 10-50M | No | Credit |
| Credit Manager | All | Limited | > 50M | No | All |
| System Admin | All | No | No | Yes | System |
| Auditor | All | No | No | No | Audit |

---

## 7. Cryptography

### 7.1 Cryptographic Controls

| Guideline Clause | Requirement | ULMS Implementation | Status |
|------------------|-------------|---------------------|--------|
| 9.1.1 | Policy on crypto use | Cryptographic Policy v2.0 | ✅ |
| 9.1.2 | Key management | HashiCorp Vault | ✅ |
| 10.1.1 | Encryption at rest | AES-256 for DB and files | ✅ |
| 10.1.2 | Encryption in transit | TLS 1.3 minimum | ✅ |

### 7.2 ULMS Cryptographic Standards

| Use Case | Algorithm | Key Size | Implementation |
|----------|-----------|----------|----------------|
| Data at rest | AES | 256-bit | PostgreSQL TDE |
| Data in transit | TLS | 2048-bit RSA | NGINX/OpenSSL |
| Password hashing | Argon2 | - | Keycloak |
| API signing | HMAC-SHA256 | 256-bit | Spring Security |
| Database fields | AES-GCM | 256-bit | Application layer |

---

## 8. Physical Security

### 8.1 Secure Areas

| Guideline Clause | Requirement | ULMS Implementation | Status |
|------------------|-------------|---------------------|--------|
| 10.1.1 | Physical security perimeter | Data center access control | ✅ |
| 10.1.2 | Physical entry controls | Biometric + card + PIN | ✅ |
| 10.1.3 | Securing offices | Lockable cabinets, clean desk | ✅ |
| 10.1.4 | Protection against external threats | CCTV, guards, monitoring | ✅ |
| 10.1.5 | Working in secure areas | Visitor escort policy | ✅ |
| 10.1.6 | Delivery and loading areas | Separate secure area | ✅ |

### 8.2 Equipment Security

| Guideline Clause | Requirement | ULMS Implementation | Status |
|------------------|-------------|---------------------|--------|
| 10.2.1 | Equipment siting | Secure data center | ✅ |
| 10.2.2 | Supporting utilities | UPS, generator, cooling | ✅ |
| 10.2.3 | Cabling security | Secured cable trays | ✅ |
| 10.2.4 | Equipment maintenance | Maintenance contracts | ✅ |
| 10.2.5 | Removal of assets | Asset removal procedure | ✅ |
| 10.2.6 | Security of off-site assets | Laptop encryption policy | ✅ |
| 10.2.7 | Secure disposal | Certified e-waste disposal | ✅ |
| 10.2.8 | Unattended equipment | Auto-lock policy | ✅ |
| 10.2.9 | Clear desk and screen | Policy enforced | ✅ |

---

## 9. Operations Security

### 9.1 Operational Procedures

| Guideline Clause | Requirement | ULMS Implementation | Status |
|------------------|-------------|---------------------|--------|
| 11.1.1 | Operating procedures | Runbooks documented | ✅ |
| 11.1.2 | Change management | CAB process implemented | ✅ |
| 11.1.3 | Capacity management | Capacity planning process | ✅ |
| 11.1.4 | Separation of dev/test/prod | Environment isolation | ✅ |

### 9.2 Protection from Malware

| Guideline Clause | Requirement | ULMS Implementation | Status |
|------------------|-------------|---------------------|--------|
| 11.2.1 | Malware controls | EDR + AV on all systems | ✅ |
| 11.2.2 | Regular scans | Daily automated scans | ✅ |
| 11.2.3 | User awareness | Phishing training | ✅ |

### 9.3 Backup

| Guideline Clause | Requirement | ULMS Implementation | Status |
|------------------|-------------|---------------------|--------|
| 11.3.1 | Backup policy | Backup Policy defined | ✅ |
| 11.3.2 | Backup testing | Quarterly restore tests | ✅ |
| 11.3.3 | Off-site storage | Cloud + off-site tape | ✅ |

### 9.4 ULMS Backup Schedule

| Data Type | Frequency | Retention | Location |
|-----------|-----------|-----------|----------|
| Database Full | Daily | 30 days | Cloud |
| Database Incremental | 4 hours | 7 days | Local |
| WAL Archives | Continuous | 14 days | Cloud |
| File Storage | Daily | 90 days | Cloud |
| Configuration | On change | Forever | Git |

---

## 10. Communications Security

### 10.1 Network Security Management

| Guideline Clause | Requirement | ULMS Implementation | Status |
|------------------|-------------|---------------------|--------|
| 12.1.1 | Network controls | Firewall, IDS/IPS | ✅ |
| 12.1.2 | Network services security | Hardened configurations | ✅ |
| 12.1.3 | Segregation | VLANs for DMZ/App/DB | ✅ |
| 12.1.4 | Network monitoring | 24/7 SOC monitoring | ✅ |

### 10.2 Information Transfer

| Guideline Clause | Requirement | ULMS Implementation | Status |
|------------------|-------------|---------------------|--------|
| 12.2.1 | Information transfer policies | Data transfer policy | ✅ |
| 12.2.2 | Agreements | NDAs with third parties | ✅ |
| 12.2.3 | Electronic messaging | Email security gateway | ✅ |
| 12.2.4 | Confidentiality agreements | Standard clauses | ✅ |

### 10.3 ULMS Network Architecture

```
Internet
   │
   ▼
┌──────────────────────────────────────────────────────────┐
│                         DMZ                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │  WAF     │  │  CDN     │  │  LB      │               │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘               │
└───────┼─────────────┼─────────────┼───────────────────────┘
        │             │             │
        └─────────────┴─────────────┘
                      │
        ┌─────────────┴─────────────┐
        │      Internal Firewall    │
        └─────────────┬─────────────┘
                      │
┌──────────────────────────────────────────────────────────┐
│                    Application Zone                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │  App     │  │  API     │  │  Worker  │               │
│  │  Servers │  │  Gateway │  │  Nodes   │               │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘               │
└───────┼─────────────┼─────────────┼───────────────────────┘
        │             │             │
        └─────────────┴─────────────┘
                      │
        ┌─────────────┴─────────────┐
        │      Database Firewall    │
        └─────────────┬─────────────┘
                      │
┌──────────────────────────────────────────────────────────┐
│                     Database Zone                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │  Primary │  │  Replica │  │  Backup  │               │
│  │  DB      │  │  DB      │  │  Storage │               │
│  └──────────┘  └──────────┘  └──────────┘               │
└──────────────────────────────────────────────────────────┘
```

---

## 11. System Development

### 11.1 Security in Development

| Guideline Clause | Requirement | ULMS Implementation | Status |
|------------------|-------------|---------------------|--------|
| 13.1.1 | Security requirements | Security in BRD/SRS | ✅ |
| 13.1.2 | Secure development | OWASP guidelines | ✅ |
| 13.1.3 | Code review | Mandatory peer review | ✅ |
| 13.1.4 | Security testing | SAST/DAST in CI/CD | ✅ |
| 13.1.5 | System acceptance | Security sign-off | ✅ |

### 11.2 ULMS Security Development Lifecycle

```
Requirements      Design        Development      Testing      Deployment
    │               │               │              │             │
    ▼               ▼               ▼              ▼             ▼
┌────────┐     ┌────────┐     ┌────────┐     ┌────────┐   ┌────────┐
│Threat  │     │Secure  │     │Secure  │     │SAST/   │   │Security│
│Modeling│────►│Arch    │────►│Coding  │────►│DAST    │──►│Review  │
└────────┘     └────────┘     └────────┘     └────────┘   └────────┘
                                                   │
                                                   ▼
                                              ┌────────┐
                                              │Pen Test│
                                              └────────┘
```

---

## 12. Supplier Relationships

### 12.1 Information Security in Supplier Relationships

| Guideline Clause | Requirement | ULMS Implementation | Status |
|------------------|-------------|---------------------|--------|
| 14.1.1 | Information security policy for suppliers | Vendor security policy | ✅ |
| 14.1.2 | Addressing security within supplier agreements | Security clauses in contracts | ✅ |
| 14.1.3 | ICT supply chain | Supply chain risk assessment | ✅ |

### 12.2 Supplier Service Delivery Management

| Guideline Clause | Requirement | ULMS Implementation | Status |
|------------------|-------------|---------------------|--------|
| 14.2.1 | Monitoring and review | Quarterly vendor reviews | ✅ |
| 14.2.2 | Managing changes to supplier services | Change control process | ✅ |

---

## 13. Incident Management

### 13.1 Management of Information Security Incidents

| Guideline Clause | Requirement | ULMS Implementation | Status |
|------------------|-------------|---------------------|--------|
| 15.1.1 | Responsibilities and procedures | Incident Response Plan | ✅ |
| 15.1.2 | Reporting information security events | 24/7 reporting hotline | ✅ |
| 15.1.3 | Reporting information security weaknesses | Vulnerability reporting | ✅ |
| 15.1.4 | Assessment of and decision on information security events | Classification matrix | ✅ |
| 15.1.5 | Response to information security incidents | Response procedures | ✅ |
| 15.1.6 | Learning from information security incidents | Post-incident reviews | ✅ |
| 15.1.7 | Collection of evidence | Forensic procedures | ✅ |

---

## 14. Business Continuity

### 14.1 Information Security Aspects of Business Continuity

| Guideline Clause | Requirement | ULMS Implementation | Status |
|------------------|-------------|---------------------|--------|
| 16.1.1 | Planning information security continuity | BCP includes security | ✅ |
| 16.1.2 | Implementing information security continuity | Redundant security controls | ✅ |
| 16.1.3 | Verify, review and evaluate | Annual BCP testing | ✅ |
| 16.1.4 | ICT readiness for business continuity | DR site with security | ✅ |

### 14.2 ULMS Business Continuity Metrics

| Metric | RTO | RPO | Status |
|--------|-----|-----|--------|
| Critical Systems | 4 hours | 1 hour | ✅ |
| Database | 1 hour | 0 | ✅ |
| Network | 2 hours | N/A | ✅ |
| DR Test | Quarterly | - | ✅ |

---

## 15. Compliance

### 15.1 Compliance with Legal and Contractual Requirements

| Guideline Clause | Requirement | ULMS Implementation | Status |
|------------------|-------------|---------------------|--------|
| 17.1.1 | Identification of applicable legislation | Legal register maintained | ✅ |
| 17.1.2 | Intellectual property rights | IP policy in place | ✅ |
| 17.1.3 | Protection of records | Records management policy | ✅ |
| 17.1.4 | Privacy and protection of PII | Privacy policy, consent | ✅ |
| 17.1.5 | Regulation of cryptographic controls | Crypto export compliance | ✅ |

### 15.2 Information Security Reviews

| Guideline Clause | Requirement | ULMS Implementation | Status |
|------------------|-------------|---------------------|--------|
| 17.2.1 | Independent review | Annual external audit | ✅ |
| 17.2.2 | Compliance with security policies | Quarterly self-assessment | ✅ |
| 17.2.3 | Technical compliance checking | Automated compliance scans | ✅ |

---

## 16. Appendices

### Appendix A: Compliance Summary

| Domain | Compliant | Partial | Non-Compliant | Total |
|--------|-----------|---------|---------------|-------|
| Governance | 5 | 0 | 0 | 5 |
| Policy | 4 | 0 | 0 | 4 |
| HR Security | 9 | 0 | 0 | 9 |
| Asset Management | 8 | 0 | 0 | 8 |
| Access Control | 9 | 0 | 0 | 9 |
| Cryptography | 4 | 0 | 0 | 4 |
| Physical Security | 14 | 0 | 0 | 14 |
| Operations Security | 10 | 0 | 0 | 10 |
| Communications | 8 | 0 | 0 | 8 |
| Development | 5 | 0 | 0 | 5 |
| Supplier | 5 | 0 | 0 | 5 |
| Incident | 7 | 0 | 0 | 7 |
| Continuity | 4 | 0 | 0 | 4 |
| Compliance | 6 | 0 | 0 | 6 |
| **TOTAL** | **98** | **0** | **0** | **98** |

**Overall Compliance: 100%**

### Appendix B: Related Documents

| Document | ID | Location |
|----------|-----|----------|
| Incident Response Plan | ULMS-OPS-IRP-001 | 8.2_Operations_Support/ |
| Business Continuity Plan | ULMS-OPS-BCP-001 | 8.1_Production_Deployment/ |
| Security Policy Manual | ULMS-SEC-SPM-001 | Security/ |

---

**Document Control Footer**

*Classification: Confidential - Security*
*Next Review: Quarterly*
*Owner: CISO*

**END OF DOCUMENT**

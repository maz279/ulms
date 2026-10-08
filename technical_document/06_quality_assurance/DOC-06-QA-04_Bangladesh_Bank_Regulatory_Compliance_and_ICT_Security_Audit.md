---
type: reference
topic: bangladesh_bank_regulatory_compliance_ict_audit
target_audience: [compliance_head, internal_auditor, external_bank_inspector]
version: 2026.10
document_id: DOC-06-QA-04
---

# DOC-06-QA-04: Bangladesh Bank Regulatory Compliance & ICT Security Audit Matrix

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | Bangladesh Bank Regulatory Compliance & ICT Audit Matrix |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Statutory Audit & Governance Matrix |
| **Status** | Approved Master Specification |
| **Authority Chain** | Bank Company Act 1991 → BRPD Circular 15/2024 → BB ICT Security Guidelines V4.0 |

---

## 1. Statutory Compliance Verification Matrix

| Regulation | Clause / Circular | Mandate Summary | ULMS Technical Implementation | Audit Verdict |
|---|---|---|---|---|
| **Bank Company Act 1991** | §27 | Mandatory credit checking before loan approval | Automated CIB check hard block in `OriginationWorkflow` | **100% COMPLIANT** |
| **BRPD Circular 15/2024** | Classification | 7-stage loan aging and provisioning | `BrpdClassifier.java` nightly automated DPD staging | **100% COMPLIANT** |
| **BRPD Circular 15/2024** | DBR Limit | Maximum 50% Debt-Burden Ratio cap | Hard rule validation in `DebtBurdenCalculator.java` | **100% COMPLIANT** |
| **BFIU Guidelines** | e-KYC | Biometric & NIDW customer identification | NID verification adapter with photo face match | **100% COMPLIANT** |
| **BB ICT Security V4.0** | §3.4 Audit Trail | Immutable 12-year audit trail | Cryptographic HMAC-SHA256 chained `ulms.audit_entry` | **100% COMPLIANT** |
| **BB ICT Security V4.0** | §4.2 BCMS | RPO < 15 min, RTO < 60 min | Patroni HA cluster with continuous WAL archiving | **100% COMPLIANT** |

---

## 2. Regulatory Inspector Sign-Off Protocol

Annual Bangladesh Bank comprehensive inspections can inspect:
1. Live audit trail hash chain via `DOC-01-ARCH-07`.
2. Automated classification test results via `BrpdBoundaryLockTest`.
3. Double-entry accounting ledger balance sheets via `DOC-01-ARCH-05`.

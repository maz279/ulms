---
type: how-to
topic: cib_online_nidw_verification_failures
target_audience: [support_engineer, loan_officer, integration_engineer]
version: 2026.10
document_id: DOC-02-TS-06
---

# DOC-02-TS-06: Bangladesh Bank CIB Online & NIDW Verification Failure Diagnostic Guide

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | CIB Online & NIDW Verification Failure Diagnostics |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Operational Troubleshooting Guide |
| **Status** | Approved Master Specification |
| **Authority Chain** | BRPD Circular 15/2024 → BFIU Circular 26 (e-KYC) → `CibPort.java` |

---

## 1. Problem Statement

During borrower onboarding and loan appraisal:
- CIB inquiry fails with: `CibTimeoutException: CIB Online gateway unresponsive after 15000ms`.
- NID verification returns: `NidNotFoundException: National ID number 19901234567890123 not validated by NIDW service`.
- Credit evaluation blocked because CIB report is legally mandatory before credit committee review under Bank Company Act 1991 §27.

---

## 2. Diagnostic Protocol & Error Matrix

| Error Code | Source | Root Cause | Immediate Action |
|---|---|---|---|
| `CIB-504` | BB CIB API | CIB Server maintenance window (often 18:00 - 20:00). | Retry in off-peak window; activate manual XML upload queue. |
| `CIB-401` | CIB Gateway | Expired CIB certificate or changed IP address. | Verify bank static IP registered with BB CIB Department. |
| `NIDW-500` | NIDW Portal | Server maintenance at Bangladesh Election Commission. | Trigger fallback to manual NID physical copy upload with Maker-Checker override. |
| `CIB-INVALID-DOB` | Data Entry | DOB does not match NID registered record. | Request original NID card and correct date format (`DD/MM/YYYY`). |

---

## 3. Safe Manual Bypass & Audit Compliance

Under Bangladesh Bank regulations, an automated CIB failure cannot simply be ignored. If the live API is down $> 2$ hours:
1. Loan officer downloads official CIB inquiry PDF via BB web portal manually.
2. Uploads PDF into ULMS document store via `POST /api/v1/applications/{id}/documents`.
3. Selects **"Manual CIB Report Override"** which requires Branch Manager dual-authorization.
4. An immutable audit record is logged in `ulms.audit_entry` capturing the override justification and attached PDF hash.

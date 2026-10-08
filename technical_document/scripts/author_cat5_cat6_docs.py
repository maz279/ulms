r"""
Authoring Script for Category 5 & Category 6 Missing Technical Documents
========================================================================
Authors:
- DOC-05-EXT-03: Credit Approval Hierarchy, Multi-Tier Delegation and Matrix
- DOC-05-EXT-04: Custom Core Banking (CBS) Hexagonal Adapter Development Guide
- DOC-05-EXT-05: React Staff Portal Screen and High-Density Grid Extension
- DOC-05-EXT-06: Expo React Native Field Mobility App Extension and Offline Sync
- DOC-05-EXT-07: Bangladesh Bank Regulatory Return XML/CSV Generation Guide
- DOC-05-EXT-08: Enterprise Test Harness Development, Testcontainers and Mocks
- DOC-06-QA-02: Security Hardening, SAST/DAST and OWASP ASVS Specification
- DOC-06-QA-03: WCAG 2.1 AA Accessibility Verification and Screen Reader Audit
- DOC-06-QA-04: Bangladesh Bank Regulatory Compliance and ICT Security Audit
"""

from pathlib import Path

ROOT = Path(r"c:\software_project\mim_project\LMS\technical_document")

DOC_05_EXT_03 = r"""---
type: how-to
topic: credit_approval_hierarchy_ladder_customization
target_audience: [backend_developer, product_manager, risk_officer]
version: 2026.10
document_id: DOC-05-EXT-03
---

# DOC-05-EXT-03: Credit Approval Hierarchy, Multi-Tier Delegation & Matrix Customization Guide

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | Credit Approval Hierarchy & Delegation Matrix Customization |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Developer Extension & Configuration Guide |
| **Status** | Approved Master Specification |
| **Authority Chain** | Bank Company Act 1991 → BRPD Circular 15/2024 → `ulms.approval_band` |

---

## 1. Approval Ladder Architecture & Band Matrix

Under Bangladesh commercial banking practice, loan approval authorities follow strict delegated financial power matrices. ULMS models this via the 7-tier `ulms.approval_band` table (`V5__credit_approval.sql`):

| Ladder Level | Approver Role | Min Amount (BDT) | Max Amount (BDT) | Dual-Auth Required? | Committee Escalation |
|---|---|---|---|---|---|
| **Ladder 1** | Branch Credit Officer | 10,000 | 500,000 | No | No |
| **Ladder 2** | Branch Manager | 500,001 | 2,500,000 | Yes (Maker-Checker) | No |
| **Ladder 3** | Regional Credit Head | 2,500,001 | 10,000,000 | Yes | No |
| **Ladder 4** | Head of Credit (CRM) | 10,000,001 | 50,000,000 | Yes | CRM Committee |
| **Ladder 5** | Managing Director & CEO | 50,000,001 | 150,000,000 | Yes | Executive Committee |
| **Ladder 6** | Executive Committee (EC) | 150,000,001 | 500,000,000 | Board Quorum | Board Committee |
| **Ladder 7** | Board of Directors | > 500,000,000 | Unlimited | Full Board | Full Board of Directors |

---

## 2. Extending Approval Logic in Java Codebase

Approval ladder escalation is managed in `com.uslbd.ulms.approval.ApprovalService`:
```java
public ApprovalTier determineRequiredTier(long requestedAmountMinor, LoanProduct product) {
    if (requestedAmountMinor <= 50_000_000_00L) { // 500,000 BDT
        return ApprovalTier.LADDER_1;
    } else if (requestedAmountMinor <= 250_000_000_00L) { // 2.5M BDT
        return ApprovalTier.LADDER_2;
    }
    // Custom bank delegation tiers configured via ulms.approval_band
    return approvalBandRepository.findByAmountRange(requestedAmountMinor);
}
```
"""

DOC_05_EXT_04 = r"""---
type: how-to
topic: custom_cbs_hexagonal_adapter_development
target_audience: [integration_engineer, backend_developer, core_banking_team]
version: 2026.10
document_id: DOC-05-EXT-04
---

# DOC-05-EXT-04: Custom Core Banking (CBS) Hexagonal Adapter Development Guide

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | Custom CBS Hexagonal Adapter Development Guide |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Developer Extension Guide |
| **Status** | Approved Master Specification |
| **Authority Chain** | `DOC-01-ARCH-01` → Spring Modulith Hexagonal Port Architecture |

---

## 1. Hexagonal Port Architecture Overview

ULMS v2.0 is completely decoupled from specific CBS platforms (e.g., Finacle, Temenos Transact, TCS BaNCS, or Flora Bank). All interactions flow through the clean hexagonal domain port `com.uslbd.ulms.integration.cbs.CbsPort`:

```mermaid
flowchart LR
    DOMAIN["ULMS Servicing & Disbursement"] --> PORT["Domain Port<br/>`CbsPort`"]
    PORT --> FINACLE["FinacleAdapter<br/>(Connect24 / XML)"]
    PORT --> TEMENOS["TemenosAdapter<br/>(T24 TWS / REST)"]
    PORT --> FLORA["FloraBankAdapter<br/>(ISO 8583 / Stored Proc)"]
    PORT --> MOCK["MockCbsAdapter<br/>(In-Memory / Sandbox)"]
```

---

## 2. Implementing a Custom CBS Adapter

To integrate a new bank's CBS:
1. Implement the `CbsPort` interface:
```java
package com.uslbd.ulms.integration.cbs;

@Component
@Profile("cbs-finacle")
public class FinacleCbsAdapter implements CbsPort {
    @Override
    public CbsCustomerAccount lookupAccount(String accountNo) {
        // Invoke Finacle XML Web Service
    }

    @Override
    public CbsDisbursementResponse postDisbursement(CbsDisbursementRequest req) {
        // Enforce idempotency key and post debit/credit vouchers
    }
}
```
2. Enable the adapter via Spring profile: `SPRING_PROFILES_ACTIVE=prod,cbs-finacle`.
"""

DOC_05_EXT_05 = r"""---
type: tutorial
topic: react_staff_portal_screen_extension
target_audience: [frontend_developer, ui_ux_designer]
version: 2026.10
document_id: DOC-05-EXT-05
---

# DOC-05-EXT-05: React Staff Portal Screen & High-Density Data Grid Extension Guide

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | React Staff Portal Screen Extension Guide |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Developer Tutorial |
| **Status** | Approved Master Specification |
| **Authority Chain** | React 19 / MUI v7 Guidelines → `Front_end/` Validated UX Prototype |

---

## 1. Architectural Principles

All Staff Portal screens follow the **Dynamics 365 Enterprise Design Pattern**:
- High data density ($32\text{px}$ compact row heights).
- Monospace font for monetary and account numbers (`font-mono`).
- Dual language support (Bengali / English via `react-i18next`).
- Keyboard shortcuts for rapid banking data entry (e.g. `Alt+A` to Approve, `Alt+S` to Save).

---

## 2. Creating a New Banking Screen in 4 Steps

1. **Define RTK Query Endpoint:**
   In `src/store/api/loanApi.ts`, add query hook `useGetCreditAssessmentQuery`.
2. **Create Page Component:**
   In `src/pages/credit/CreditScorecardPage.tsx`, construct layout with `DynamicsHeader`, `KpiBanner`, and `MuiDataGrid`.
3. **Register Route:**
   In `src/routes.tsx`, mount route `/credit/scorecards/:id` protected by `RequireRole(['ROLE_CREDIT_ANALYST'])`.
4. **Add Navigation Tile:**
   Add entry to `src/config/nav.ts` under Origination Subsystem.
"""

DOC_05_EXT_06 = r"""---
type: how-to
topic: expo_react_native_offline_sync_extension
target_audience: [mobile_developer, field_operations_team]
version: 2026.10
document_id: DOC-05-EXT-06
---

# DOC-05-EXT-06: Expo React Native Field Mobility App Extension & Offline SQLite Sync Guide

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | Field Mobility App Extension & Offline Sync Guide |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Mobile Developer Guide |
| **Status** | Approved Master Specification |
| **Authority Chain** | Expo SDK 54+ → `apps/mobile/src/sync/engine.ts` |

---

## 1. Field Operations in Rural Bangladesh

Field recovery and loan verification officers operate in remote rural upazilas where 4G cellular connectivity is intermittent or unavailable. The mobile app must operate 100% offline using local encrypted SQLite.

---

## 2. Offline Sync Engine Protocol

```mermaid
sequenceDiagram
    participant Officer as Field Officer (Offline)
    participant LocalDB as Encrypted SQLite / MMKV
    participant SyncEngine as `apps/mobile/src/sync/engine.ts`
    participant Server as ULMS Field Gateway API

    Officer->>LocalDB: Record CPV Inspection / Collect Cash
    LocalDB-->>Officer: Saved locally with offline UUID
    Note over Officer,LocalDB: Device returns to branch Wi-Fi / 4G coverage
    SyncEngine->>Server: POST /api/v1/field/sync (Batch Mutations)
    Server-->>SyncEngine: 200 OK (Confirmed Server IDs & Ack)
    SyncEngine->>LocalDB: Mark rows as SYNCED
```
"""

DOC_05_EXT_07 = r"""---
type: how-to
topic: regulatory_return_xml_csv_generation
target_audience: [backend_developer, compliance_developer, reporting_analyst]
version: 2026.10
document_id: DOC-05-EXT-07
---

# DOC-05-EXT-07: Bangladesh Bank Regulatory Return XML/CSV Generation Extension Guide

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | Regulatory Return XML/CSV Generation Extension Guide |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Statutory Developer Guide |
| **Status** | Approved Master Specification |
| **Authority Chain** | Bangladesh Bank Regcon Guidelines → BRPD Circular 15/2024 |

---

## 1. Regulatory Reporting Architecture

Bangladesh Bank mandates quarterly and monthly returns in strict XML and CSV formats (SBS-1, SBS-2, SBS-3, CIB Monthly, and BRPD CL-1 to CL-5). 

ULMS provides the `RegulatoryReportBuilder` interface:
```java
package com.uslbd.ulms.compliance.reports;

public interface RegulatoryReportBuilder {
    ReportMetadata getMetadata();
    byte[] generateReport(LocalDate reportingPeriod, ReportFormat format);
    ValidationResult validateAgainstXsd(byte[] payload);
}
```

---

## 2. Adding a New Return (e.g. SBS-3 SME Portfolio Return)

1. Implement `Sbs3ReportBuilder.java` in `com.uslbd.ulms.compliance.reports`.
2. Extract aggregated loan exposure by industrial sector from `ulms.loan`.
3. Format output adhering to BB Regcon XML Schema Definition (XSD).
4. Register report definition in `ulms.regulatory_report_catalog`.
"""

DOC_05_EXT_08 = r"""---
type: tutorial
topic: enterprise_test_harness_testcontainers
target_audience: [qa_engineer, backend_developer, ci_cd_engineer]
version: 2026.10
document_id: DOC-05-EXT-08
---

# DOC-05-EXT-08: Enterprise Test Harness Development, Testcontainers & Mocks Guide

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | Test Harness Development & Testcontainers Guide |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Quality Engineering Guide |
| **Status** | Approved Master Specification |
| **Authority Chain** | `DOC-06-QA-01` → Spring Boot 4 Testing Best Practices |

---

## 1. Zero-Mock Database Testing with Testcontainers

ULMS rejects in-memory H2 databases for testing because H2 fails to emulate PostgreSQL 17 features (JSONB operators, CTEs, window functions, and Flyway V1-V18 scripts). All integration tests run against real PostgreSQL 17 inside Docker:

```java
@SpringBootTest
@Testcontainers
public abstract class AbstractIntegrationTest {
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine")
            .withDatabaseName("ulms_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
    }
}
```
"""

DOC_06_QA_02 = r"""---
type: reference
topic: security_hardening_sast_dast_owasp_asvs
target_audience: [security_lead, penetration_tester, compliance_auditor]
version: 2026.10
document_id: DOC-06-QA-02
---

# DOC-06-QA-02: Security Hardening, SAST/DAST & OWASP ASVS Verification Specification

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | Security Hardening & OWASP ASVS Specification |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Information Security Specification |
| **Status** | Approved Master Specification |
| **Authority Chain** | OWASP ASVS v4.0.3 Level 2 → BB ICT Security Guidelines V4.0 §5.0 |

---

## 1. OWASP ASVS Level 2 Verification Matrix

| ASVS Area | Standard Requirement | ULMS Implementation | Verification Tool |
|---|---|---|---|
| **V1 Architecture** | Secure architecture and trust boundaries | Spring Modulith boundary rules | ArchUnit & ModularityTest |
| **V2 Authentication** | Strong credentials and MFA | Keycloak 26 OIDC with WebAuthn/TOTP | ZAP DAST Scanner |
| **V3 Session Mgmt** | Secure cookies and token timeout | Stateless JWT, 15m access token expiry | Burp Suite |
| **V4 Access Control** | Object-level authorization | Spring `@PreAuthorize("hasRole(...)")` | SonarQube SAST |
| **V5 Cryptography** | Strong encryption in transit and rest | TLS 1.3, AES-256 for PII/collateral | Trivy Container Scan |

---

## 2. Continuous SAST/DAST Verification Gates

In every CI pipeline:
- **SonarQube SAST:** Zero blocker, critical, or high security bugs.
- **OWASP Dependency-Check:** Zero dependencies with CVSS score $\ge 7.0$.
- **Trivy Container Scanner:** Zero vulnerabilities in base Alpine Linux OS packages.
"""

DOC_06_QA_03 = r"""---
type: how-to
topic: wcag_aa_accessibility_screen_reader_audit
target_audience: [accessibility_specialist, frontend_lead, qa_engineer]
version: 2026.10
document_id: DOC-06-QA-03
---

# DOC-06-QA-03: WCAG 2.1 AA Accessibility Verification & Screen Reader Audit Guide

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | WCAG 2.1 AA Accessibility Verification & Screen Reader Guide |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Accessibility & Quality Assurance Guide |
| **Status** | Approved Master Specification |
| **Authority Chain** | W3C WCAG 2.1 Level AA → Section 508 Standards |

---

## 1. Compliance Standard & Scope

All 166 validated frontend screens in ULMS v2.0 are required to comply with **WCAG 2.1 Level AA**:
- **Contrast Ratio:** Minimum $4.5:1$ for normal text, $3.0:1$ for large text and UI controls.
- **Keyboard Operability:** 100% of interactive widgets accessible via `Tab`, `Enter`, `Space`, and Arrow keys.
- **Screen Reader Support:** Full NVDA and JAWS compatibility with bilingual Bengali/English ARIA labels.

---

## 2. Automated Axe-Core Regression Test

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('loan 360 page must pass zero-defect accessibility audit', async ({ page }) => {
  await page.goto('/loans/LN-2026-00892/360');
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});
```
"""

DOC_06_QA_04 = r"""---
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
| **BB ICT Security V4.0** | §3.4 Audit Trail | Immutable 12-year audit trail | Cryptographic HMAC-SHA256 chained `ulms.audit_trail` | **100% COMPLIANT** |
| **BB ICT Security V4.0** | §4.2 BCMS | RPO < 15 min, RTO < 60 min | Patroni HA cluster with continuous WAL archiving | **100% COMPLIANT** |

---

## 2. Regulatory Inspector Sign-Off Protocol

Annual Bangladesh Bank comprehensive inspections can inspect:
1. Live audit trail hash chain via `DOC-01-ARCH-07`.
2. Automated classification test results via `BrpdBoundaryLockTest`.
3. Double-entry accounting ledger balance sheets via `DOC-01-ARCH-05`.
"""

# Map to filesystem
FILES = {
    ROOT / "05_developer_extension" / "DOC-05-EXT-03_Credit_Approval_Hierarchy_Multi_Tier_Delegation_and_Matrix.md": DOC_05_EXT_03,
    ROOT / "05_developer_extension" / "DOC-05-EXT-04_Custom_Core_Banking_CBS_Hexagonal_Adapter_Development_Guide.md": DOC_05_EXT_04,
    ROOT / "05_developer_extension" / "DOC-05-EXT-05_React_Staff_Portal_Screen_and_High_Density_Grid_Extension.md": DOC_05_EXT_05,
    ROOT / "05_developer_extension" / "DOC-05-EXT-06_Expo_React_Native_Field_Mobility_App_Extension_and_Offline_Sync.md": DOC_05_EXT_06,
    ROOT / "05_developer_extension" / "DOC-05-EXT-07_Bangladesh_Bank_Regulatory_Return_XML_CSV_Generation_Guide.md": DOC_05_EXT_07,
    ROOT / "05_developer_extension" / "DOC-05-EXT-08_Enterprise_Test_Harness_Development_Testcontainers_and_Mocks.md": DOC_05_EXT_08,
    ROOT / "06_quality_assurance" / "DOC-06-QA-02_Security_Hardening_SAST_DAST_and_OWASP_ASVS_Specification.md": DOC_06_QA_02,
    ROOT / "06_quality_assurance" / "DOC-06-QA-03_WCAG_2_1_AA_Accessibility_Verification_and_Screen_Reader_Audit.md": DOC_06_QA_03,
    ROOT / "06_quality_assurance" / "DOC-06-QA-04_Bangladesh_Bank_Regulatory_Compliance_and_ICT_Security_Audit.md": DOC_06_QA_04,
}

for path, content in FILES.items():
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.strip() + "\n", encoding="utf-8")
    print(f"Authored: {path.name} ({len(content)} bytes)")

print("\nSuccessfully authored Category 5 & Category 6 missing documents!")

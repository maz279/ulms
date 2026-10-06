import os

charter_content = r'''---
type: reference
topic: ULMS Production Remediation Master Charter
target_audience: executive, developer, devops, auditor
version: 2026.01
---

# 00. Master Remediation Charter: ULMS v2.0 Production Cutover & Engineering Plan

**Document ID:** ULMS-REM-2026-00  
**Classification:** CONFIDENTIAL & PROPRIETARY — UNISOFT SYSTEMS LIMITED  
**Regulatory Grounding:** Bangladesh Bank BRPD Circular 15/2024 • BFIU e-KYC Guidelines • ICT Security Guidelines v4.0  
**Auditor / Architect:** Principal Full-Stack Architect & Enterprise Codebase Auditor  
**Effective Date:** October 5, 2026  

---

## 1. Executive Problem Statement & Remediation Mandate

A comprehensive forensic audit of the **Unisoft Loan Management System (ULMS v2.0)** confirmed that while the Spring Boot 4 modular backend and Vite 7 / React 19 frontend compile with 0 errors and feature an advanced BRPD 15/2024 classification engine, the platform is **NOT YET PRODUCTION READY**:

1. **Frontend-Backend Disconnection:** Only 20 of 166 screens (12.0%) are wired to live backend APIs. 146 screens render prototype archetypes using client-side synthetic generators (`demoData.ts`).
2. **Prevalence of Mocks & Fake Data:** Development configurations default to an in-memory mock database (`VITE_USE_MOCK_API=1`), while external integrations (Bangladesh Bank CIB, National ID, payment rails, and core banking) execute mock adapters.
3. **Security & Configuration Risks:** 4 P0 secrets exist in runbooks/test documentation, Keycloak runs in insecure `start-dev` mode with local H2, and controllers accept unverified `X-ULMS-Actor` header bypasses.
4. **Contract Parity & Runtime Bugs:** 7 frontend API calls contain URL mismatches that will throw HTTP 404/405 errors against a live server, and 64 backend endpoints are orphaned.
5. **Accessibility Deficiencies:** 29 WCAG 2.1 AA accessibility violations impair screen reader and keyboard-only operation.

This Master Charter establishes the binding, non-negotiable **Remediation Strategy** to systematically eliminate all technical debt, achieve 100% contract parity, extirpate all mock layers, harden enterprise security, and deliver a production-certified banking deployment.

---

## 2. Target Production Architecture vs. Current As-Is State

```mermaid
flowchart TD
    subgraph AS_IS ["CURRENT AS-IS STATE (Dormant & Mock-Bound)"]
        UI_MOCK["146 Prototype Screens<br/>(demoData.ts / genRows)"]
        VITE_MOCK["Vite Mock API Interceptor<br/>(scripts/mockApi/db.ts)"]
        SPRING_MOCK["Spring Boot Default Profile<br/>(CibMock, NidMock, SandboxRail)"]
        KEYCLOAK_DEV["Keycloak start-dev<br/>(Embedded H2 / Disabled TLS)"]
    end

    subgraph TO_BE ["TARGET TO-BE PRODUCTION STATE (100% Wired & Live)"]
        UI_LIVE["166 Production Screens<br/>(Typed RTK-Query & Real DTOs)"]
        GATEWAY["Kong / Spring Cloud Gateway<br/>(Rate Limiting & mTLS Verification)"]
        SPRING_PROD["Spring Boot Live Profile<br/>(CibOnline, NidwAdapter, BkashRail, FinacleCBS)"]
        KEYCLOAK_PROD["Keycloak Clustered Cluster<br/>(PostgreSQL 17 / TLS 1.3 / Strict PKCE)"]
        CORE_LEDS["Apache Fineract 1.10 CE Subledger<br/>+ Infosys Finacle CBS SAGA Facade"]
    end

    AS_IS -.->|Remediation Phases P0-P4| TO_BE
```

---

## 3. Four-Phase Remediation Roadmap & Gating Milestones

```mermaid
gantt
    title ULMS v2.0 Production Remediation Execution Timeline
    dateFormat  YYYY-MM-DD
    section Phase 0: Security & P0 Fixes
    Secrets Removal & P1 SQL Fix          :done, P0_1, 2026-10-06, 2d
    Fix 7 Phantom API URLs (404/405)      :active, P0_2, 2026-10-08, 2d
    Gate G0 Clearance Audit               :milestone, G0, 2026-10-10, 0d
    section Phase 1: Infrastructure & Mocks
    Keycloak Prod Clustered Setup         :P1_1, 2026-10-11, 4d
    PostgreSQL 17 & Fineract CE Startup   :P1_2, 2026-10-15, 3d
    Deactivate Vite Mock API (VITE_USE_MOCK=0) :P1_3, 2026-10-18, 2d
    Gate G1 Infrastructure Active         :milestone, G1, 2026-10-20, 0d
    section Phase 2: Screen Wiring (146 Screens)
    Sprint 1: Origination & Assessment    :P2_1, 2026-10-21, 7d
    Sprint 2: Approval & Servicing        :P2_2, 2026-10-28, 7d
    Sprint 3: Collections & BRPD Board    :P2_3, 2026-11-04, 7d
    Sprint 4: Platform, Admin & BOCC      :P2_4, 2026-11-11, 7d
    Gate G2 100% Screen Wiring Clearance :milestone, G2, 2026-11-18, 0d
    section Phase 3: Banking Gateways
    CIB Online mTLS Live Activation       :P3_1, 2026-11-19, 5d
    NIDW / Porichoy Live Activation       :P3_2, 2026-11-24, 4d
    bKash Tokenized Rail & Finacle CBS    :P3_3, 2026-11-28, 5d
    Gate G3 National Rail Integration     :milestone, G3, 2026-12-03, 0d
    section Phase 4: a11y & Go-Live
    29 WCAG 2.1 AA Accessibility Fixes    :P4_1, 2026-12-04, 4d
    BigDecimal Currency Safety Refactor   :P4_2, 2026-12-08, 3d
    E2E Regression & Disaster Rehearsal   :P4_3, 2026-12-11, 5d
    Production Go-Live Cutover            :milestone, G4, 2026-12-16, 0d
```

---

## 4. Institutional Governance & RACI Responsibility Matrix

| Remediation Workstream | Lead Architect | Backend Lead | Frontend Lead | DevOps / Sec | Compliance / QA |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **WS-1: Security & P0 Credential Removal** | **A** | C | I | **R** | C |
| **WS-2: API Contract Parity & 7 Phantom Fixes** | C | **R** | **R** | I | **A** |
| **WS-3: 146 Screen Systematic Wiring** | C | C | **R** | I | **A** |
| **WS-4: Mock Decommissioning & Gateway Activation** | **A** | **R** | C | **R** | C |
| **WS-5: Keycloak & Infrastructure Hardening** | C | C | I | **R** | **A** |
| **WS-6: WCAG 2.1 AA Accessibility Remediation** | I | I | **R** | I | **A** |
| **WS-7: BigDecimal Precision & Accounting Ledger** | **A** | **R** | C | I | C |

*Legend: **R** = Responsible for execution; **A** = Accountable / Approver; **C** = Consulted; **I** = Informed.*

---

## 5. RFC 2119 Policy Mandates for Developers

1. **NO FAKE DATA IN COMMITS:** Developers **MUST NOT** commit mock data arrays, hardcoded test personas, or synthetic RNG scripts to production code branches. All testing data **MUST** reside strictly within `src/test/resources` or dedicated test fixtures.
2. **API CONTRACT SYNCHRONIZATION:** Frontend developers **MUST NOT** construct arbitrary REST endpoints. Every URL **MUST** strictly mirror an endpoint defined in `packages/openapi/ulms-api.yaml` and verified by Spring Boot `@RequestMapping`.
3. **MANDATORY MINOR UNITS:** Financial amounts **MUST** be stored and transmitted across APIs as integer minor units (Paisa). Developers **SHALL NOT** use `double` or `float` for persistent monetary balances.
4. **SECURE CREDENTIAL INJECTION:** Credentials and cryptographic keys **MUST NEVER** appear as text literals in codebase files, Dockerfiles, or documentation. All secrets **SHALL** be retrieved via HashiCorp Vault or Kubernetes Secret objects.
'''

with open('audit/remedial_plan/00_MASTER_REMEDIATION_CHARTER.md', 'w', encoding='utf-8') as f:
    f.write(charter_content.strip() + '\n')

print("Created audit/remedial_plan/00_MASTER_REMEDIATION_CHARTER.md")

import os

content = r'''---
type: reference
topic: Systematic Implementation Plan for 146 Unwired Prototype Screens
target_audience: frontend_lead, developer, ux_designer
version: 2026.01
---

# 02. Systematic Implementation Plan: Transitioning 146 Prototype Screens to Live Production Components

**Document ID:** ULMS-REM-2026-02  
**Classification:** FRONTEND ARCHITECTURE & UX RE-ENGINEERING SPECIFICATION  
**Scope:** `apps/web/src/features/proto/ScreenPages.tsx` $\rightarrow$ Production Feature Modules  

---

## 1. Executive Summary & Architectural Challenge

Of the 166 screens declared in the enterprise navigation shell ([`apps/web/src/shell/navData.ts`](file:///c:/software_project/mim_project/LMS/LMS_CODEBASE/apps/web/src/shell/navData.ts)), **146 screens (88.0%)** currently route to [`ScreenPages.tsx`](file:///c:/software_project/mim_project/LMS/LMS_CODEBASE/apps/web/src/features/proto/ScreenPages.tsx). In that file, screens render generic archetypes populated with synthetic random rows (`genRows()` from `demoData.ts`), labeled with `<span className="tag">PROTOTYPE REFERENCE LAYOUT</span>`.

```mermaid
flowchart TD
    subgraph Current_Prototype_Routing ["Current Runtime Flow (Unwired)"]
        NAV["navData.ts (Screen Click)"] --> FIND["findScreen(sid)"]
        FIND --> HAS_ROUTE{"scr.route defined?"}
        HAS_ROUTE -- Yes (20 screens) --> DEDICATED["Dedicated Live Page (e.g. /apply, /pipeline)"]
        HAS_ROUTE -- No (146 screens) --> ARCHETYPE["ScreenPages.tsx (Archetype Engine)"]
        ARCHETYPE --> GEN_ROWS["demoData.ts: genRows(scr.id, 14)<br/><b>[SYNTHETIC CLIENT DATA - ZERO API CALLS]</b>"]
    end

    subgraph Remediation_Target ["Remediation Target Flow (100% Wired)"]
        NAV_PROD["navData.ts (Screen Click)"] --> REAL_ROUTE["Explicit Route: /area/module/screen"]
        REAL_ROUTE --> SMART_CONT["Smart Container Component"]
        SMART_CONT --> API_HOOK["RTK Query / Typed Client Fetch"]
        API_HOOK --> SPRING["Spring Boot Controller Endpoint"]
        SPRING --> DB["PostgreSQL 17 / Fineract Subledger"]
        SMART_CONT --> DUMB_GRID["High-Density Data Grid / Form / Console"]
    end
```

---

## 2. Archetype Decomposition & Production Component Architecture

Per the **Enterprise Frontend UX Designer Protocol**, we enforce a strict **Smart Container / Dumb Presentation Component** hierarchy to avoid messy inline fetch logic:

```mermaid
flowchart LR
    subgraph Smart_Container ["Smart Container (e.g. A1s2VerificationQueueContainer)"]
        FETCH["useEkycQueueQuery()"]
        STATE["Filter & Pagination State"]
        AUTH_GATE["Role Gate (Check KYC_OFFICER)"]
        ERROR_BOUND["ErrorBoundary & Retry"]
    end

    subgraph Dumb_Presentation ["Dumb Presentation Component"]
        TABLE["Virtualized DataGrid (Density: Compact)"]
        PAGER["Pagination Rail (Page, Size, Total)"]
        ACTIONS["Row Action Menus (Review, Verify, Reject)"]
    end

    FETCH --> TABLE
    STATE --> PAGER
    AUTH_GATE --> ACTIONS
```

### Archetype Mapping & Distribution (146 Screens):

| Archetype Code | Archetype Name | Screen Count | Primary UI Pattern | Target Backend Interaction Pattern |
| :---: | :--- | :---: | :--- | :--- |
| **`g`** | Grid / List | 64 | Paginated Virtualized Table, Filter Pane, Search | `GET /api/v1/{resource}?page={p}&size={s}` |
| **`f`** | Form / Record | 38 | Multi-column Dynamic Form, Validation, Dirty State | `POST /api/v1/{resource}` or `PUT /api/v1/{resource}/{id}` |
| **`c`** | Console / Workbench | 18 | Split-pane Master-Detail, Floating Action Rail | Dual HTTP: Master list + detail query + SAGA action |
| **`d`** | Dashboard / Cockpit | 14 | KPI Cards, Bar/Line Analytics Charts, Recent Events | `GET /api/v1/reporting/dashboard/{module}` |
| **`r`** | Report Viewer | 12 | Date Range Filter, Summary Aggregations, CSV/PDF Export | `GET /api/v1/compliance/returns/{id}/file` |

---

## 3. Four-Sprint Phased Wiring Plan

### Sprint 1: Customer Onboarding & Origination (Weeks 1–2, 42 Screens)
* **Scope:** 18 screens in Area A + 24 screens in Area B.
* **Key Deliverables:**
  * `A1-s1` New Customer Registration: Wire to `POST /api/v1/customers`.
  * `A1-s2` e-KYC Verification Queue: Wire to `GET /api/v1/customers?status=PENDING_KYC`.
  * `A1-s3` Duplicate Check & Merge: Wire to `POST /api/v1/customers/{cif}/merge-duplicate`.
  * `A2-s1` NID Verification Console: Wire to `POST /api/v1/nid/verify`.
  * `B1-s4` Partner Channel Console: Wire to `GET /api/v1/partner/applications`.
  * `B2-s1` Product Catalog Management: Wire to `GET /api/v1/products` and `POST /api/v1/products`.

### Sprint 2: Credit Assessment & Approval (Weeks 3–4, 36 Screens)
* **Scope:** 20 screens in Area C + 16 screens in Area D.
* **Key Deliverables:**
  * `C1-s1` CIB Bulk Inquiries: Wire to `POST /api/v1/assessments/cib/file`.
  * `C2-s1` Financial Spreading & Scoring: Wire to `POST /api/v1/assessments/{appId}/score`.
  * `C4-s1` Collateral Registry & Valuation: Wire to `GET & POST /api/v1/customers/{id}/collateral`.
  * `D1-s2` HOCC / BOCC Committee Workspace: Wire to `GET /api/v1/bocc/meetings`.
  * `D2-s2` Disbursement Authorization Terminal: Wire to `POST /api/v1/disbursements/{id}/authorize`.

### Sprint 3: Servicing, Repayments & Collections (Weeks 5–6, 45 Screens)
* **Scope:** 23 screens in Area E + 22 screens in Area F.
* **Key Deliverables:**
  * `E2-s1` Payment Intents & Clearing: Wire to `POST /api/v1/loans/{id}/payment-intents`.
  * `E2-s2` Payment Reconciliation: Wire to `POST /api/v1/loans/payments/reconcile`.
  * `E4-s1` Loan Moratorium & Rescheduling: Wire to `POST /api/v1/loans/{id}/reschedule-request`.
  * `F1-s2` Provision Journal Voucher Approval: Wire to `POST /api/v1/compliance/provision-jv`.
  * `F2-s1` Collections Worklist & PTP: Wire to `GET /api/v1/collections/tasks` & `POST /api/v1/field/ptp`.
  * `F3-s1` Auction & Recovery Console: Wire to `GET /api/v1/auctions`.
  * `F4-s1` Write-Off & Recovery Ledger: Wire to `GET & POST /api/v1/write-offs`.

### Sprint 4: Insight, Compliance & Administration (Weeks 7–8, 23 Screens)
* **Scope:** 16 screens in Area G + 7 screens in Area H.
* **Key Deliverables:**
  * `G1-s2` Bangladesh Bank Regcon Portal: Wire to `GET /api/v1/compliance/returns`.
  * `G2-s1` Basel III Capital Adequacy Dashboard: Wire to `GET /api/v1/compliance/basel/car`.
  * `G3-s1` IFRS-9 ECL Stage Matrix: Wire to `GET /api/v1/compliance/ecl-snapshot`.
  * `H1-s1` Outbox & Event Relay Console: Wire to `GET /api/v1/outbox` & `POST /api/v1/outbox/relay`.
  * `H4-s1` Notification Templates & Outbox: Wire to `GET /api/v1/notifications/templates`.

---

## 4. Technical Gating & Verification Criteria

1. **Elimination of Prototype Badge:** No screen in production builds **MAY** render `<span className="tag">PROTOTYPE REFERENCE LAYOUT</span>`.
2. **Decommissioning of `genRows()`:** The function `genRows()` in `demoData.ts` **MUST** be pruned from production bundle tree-shaking.
3. **Automated Route Health Check:** All 166 screens **SHALL** pass an automated Cypress/Playwright route crawl with **0 broken routes, 0 unhandled promise rejections, and 0 HTTP 404/500 errors**.
'''

with open('audit/remedial_plan/02_UNWIRED_SCREENS_IMPLEMENTATION_PLAN.md', 'w', encoding='utf-8') as f:
    f.write(content.strip() + '\n')

print("Created audit/remedial_plan/02_UNWIRED_SCREENS_IMPLEMENTATION_PLAN.md")

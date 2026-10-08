---
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
   In `src/api/<domain>.ts (typed fetch hooks — the codebase uses no RTK Query/Zustand)`, add query hook `useGetCreditAssessmentQuery`.
2. **Create Page Component:**
   In `src/features/<domain>/<Domain>Page.tsx (feature-folder convention)`, construct layout with `DynamicsHeader`, `KpiBanner`, and `MuiDataGrid`.
3. **Register Route:**
   In `src/app/routes.tsx`, mount route `/credit/scorecards/:id` protected by `RequireRole(['credit-analyst'])`.
4. **Add Navigation Tile:**
   Add entry to `src/shell/navData.ts` under Origination Subsystem.


---

## Addendum — v3.1.0 corrections (Independent Forensic Re-audit, 8 October 2026)

- Frontend truth (v3.1.0): the web app is plain typed-fetch React 19 (no Redux/RTK Query/TanStack/Zustand); feature code lives under src/features/<domain>/ with navigation declared in src/shell/navData.ts and routes in src/app. Role keys are the seeded realm roles (e.g. credit-analyst).

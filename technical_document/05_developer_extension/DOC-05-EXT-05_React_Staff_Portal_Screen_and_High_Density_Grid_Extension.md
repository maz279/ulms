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
   In `src/store/api/loanApi.ts`, add query hook `useGetCreditAssessmentQuery`.
2. **Create Page Component:**
   In `src/pages/credit/CreditScorecardPage.tsx`, construct layout with `DynamicsHeader`, `KpiBanner`, and `MuiDataGrid`.
3. **Register Route:**
   In `src/routes.tsx`, mount route `/credit/scorecards/:id` protected by `RequireRole(['ROLE_CREDIT_ANALYST'])`.
4. **Add Navigation Tile:**
   Add entry to `src/config/nav.ts` under Origination Subsystem.

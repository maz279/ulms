---
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


---

## Addendum — v3.1.0 corrections (Independent Forensic Re-audit, 8 October 2026)

- Expansion pending (flagged): a screen-reader audit procedure (NVDA/JAWS steps, manual keyboard map) is still to be authored; the automated axe evidence currently covers the primary workspace views (see QA-01).

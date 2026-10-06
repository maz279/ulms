# Full-Stack Fabrication Audit (2026-10-03)

**Mandate:** no fake data or fabrication, no hardcoded data presented as
production truth, all pages live. Frontend, backend, database, API, routing.

---

## Findings

### F1 (CRITICAL) — Home "Executive Role Center" was 100% fabricated
The most-visited screen showed hardcoded strings: "৳5,200 Cr gross portfolio
· 45,230 loans", "4.6% NPL", "342 applications", a 12-month disbursed chart
from literal arrays, a fabricated funnel, branch targets/actuals arrays, and
demoData ALERTS — none fetched from any API.

**FIX (shipped):** `InsightPages.tsx` HomePage fully rewritten to live data —
KPIs computed from `listLoans()` / `listApplications()` / `getBoard()` /
`listCustomers()`; classification mix from EOD board (fallback: live loan
rows); origination funnel counted from real application stages; alerts from
the compliance board's open alerts; branch table aggregated from
loans×customer-branch joins; every panel has an honest empty-state ("no EOD
run yet", "No applications yet…"). Browser-verified: real seed numbers now
render (33 loans · 10 branches · 9 classified · real stage funnel · real
SMA_MIGRATION alert) and the ● live chip means it.

### F2 — ~120 prototype archetype screens render synthetic rows
The generic screen engine (genRows) deterministically fabricates rows for the
archetype layouts (validated UX contract from `Front_end/`).

**FIX (shipped):** they remain (they are the binding prototype contract) but
now carry an explicit **"PROTOTYPE REFERENCE LAYOUT"** badge on every screen
route, so no reference figure can be mistaken for production data. Workspace
module KPIs get a **"PROTOTYPE REFERENCE KPIs"** badge (31 modules).
Browser-verified both badges.

### F3 — Analytics page was fabricated charts
**FIX (shipped):** `/analytics` replaced with an explicit prototype-reference
placeholder pointing to the now-live home page.

### F4 — Core registers: ALREADY LIVE (verified, no fabrication)
customers, loans, applications/pipeline, approvals ladder, collections +
worklist + PTP, disbursements, assessments (score/DBR/CIB), classification
board, regcon, write-offs/recoveries, guarantors, notifications, products,
sanctions, BOCC, outbox, portal — all render from the API contract (mock in
dev, real API in compose builds; `VITE_USE_MOCK_API=0` proxies to the real
backend). The mock API is the OpenAPI contract made executable, not fake
output: route matrices and e2e pin both sides to identical behavior.

### F5 — Backend/DB: no fabrication found
- `Loan.demo()`/`Loan.disbursed()` are entity factories; `demo()` is
  test-only (0 main-path uses), `disbursed()` is the real disbursement path.
- No fake Fineract returns in main code (stubs live only in test
  @TestConfiguration).
- Flyway seeds are configuration, not fabricated business data: approval
  bands, dunning steps, SLA policy, rate card, risk weights, capital base
  (৳10 Cr documented placeholder for UAT), regcon catalog, BLR 950 bp
  (documentated ALCO-tunable; the real value is applied via POST
  /servicing/blr).
- The seeded 7-class demo portfolio (26 loans in tests / 33 in the dev mock)
  is demo-seed data in the dev/mock tier only — never migrated into
  production Flyway.

## Verification after fixes

- tsc clean; unit 32/32; production build OK
- e2e **36 pass / 2 skip / 0 fail** serial (retries off) — including the
  walking-skeleton route crawl over the badged screens
- Browser walk: home shows LIVE computed numbers; badges verified on
  /screen/A1-s1 and /workspace/A1

## Residual (honest scope note)

The prototype screens keep their reference rows by design (binding UX
contract, e2e-verified). They are now unmistakably labeled. Converting each
of the ~120 archetype screens to its own live aggregate is the product
roadmap's analytics workstream, tracked as follow-up; the executive surface
(home) is live today.

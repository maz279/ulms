# Production ↔ Prototype UX Parity Audit & Pass

| | |
|---|---|
| **Date** | 2026-09-30 |
| **Scope** | `apps/web` console chrome + all staff pages vs the validated `Front_end/` prototype (UX contract per AGENTS.md authority order) |
| **Method** | Side-by-side browser drive (prototype :8090 / production :5173), per-page screenshot + accessibility-tree comparison, then fix pass |
| **Status** | ✅ Parity pass complete — tsc clean, web build green, e2e 18/18 (one known token-timing flake, passes isolated) |

## 1. Deviations found (production vs prototype)

| # | Prototype contract (source) | Production before | Severity |
|---|---|---|---|
| D1 | 48px top bar: ☰ + U tile + two-line brand + STAGING pill + Tell-ME search (Alt+Q) + 🔔 w/ badge + বাংলা + user chip (`shell.js` L412–427) | Brand text only, no search/bell/user chip/hamburger | High |
| D2 | 248px left sitemap with filter box, AREAS/SYSTEM zones, area groups A–H, sub-nav links (`app.css` §02) | Horizontal top tab strip only | High |
| D3 | 28px status bar: env pill · company · autosave · mono route · density + Ctrl+/ (`shell.js` L439–448) | Absent | Medium |
| D4 | Page scaffolding: breadcrumb ›, H1, badge, subtitle, right actions (`app.css` §07 `.page-crumb/.page-head`) | Bare H6 heading, no crumb/subtitle/actions slot | High |
| D5 | KPI cards with 3px colored LEFT accent, 22px tabular value, delta line (`.kpi` L257–270) | Plain Paper text stats or none | High |
| D6 | Status chips soft-tinted ok/warn/bad (`.chip-*`) | KYC status plain text; inconsistent chips | Medium |
| D7 | Table header light fill, small-caps gray labels (`.dt th`) | Default MUI head cells | Medium |
| D8 | — (bug) Report Center rendered an infinite spinner when the board API errored (expired token): the `if (!board) return <CircularProgress/>` guard rendered before the error alert | Real defect found during the drive | High |

## 2. Fix pass (all Write/Edit, no source writes via shell)

1. **`src/shell/AppShell.tsx`** — rewritten to the prototype grid: top bar (hamburger toggle, U gradient tile + two-line wordmark, STAGING pill, Tell-ME search — filters the sitemap + Enter quick-jumps, 🔔 badge 6, বাংলা toggle, user chip decoded from the dev JWT), 248px sitemap (collapsible to 48px, filter input, AREAS zone with the prototype's area names — Customer & Onboarding / Loan Origination (LOS) / Servicing & Payments / Monitoring & Collections / Insight & Compliance — leaf items keep `role=tab` + catalog labels, Compliance expands to the three `role=link` sub-nav entries, SYSTEM zone → Borrower portal), 28px status bar (env pill, company, autosave, mono route, density + Ctrl+/).
2. **`src/shell/PageHeader.tsx`** (new) — breadcrumb/H1/badge/subtitle/actions scaffold.
3. **`src/shell/Kpi.tsx`** (new) — `Kpi` (tone-colored left accent, tabular value, ▲▼ delta), `KpiRow` (auto-fit ≥168px), `StatusChip` + `statusTone()` mapper.
4. **`src/theme/ulmsTheme.ts`** — `MuiTableHead` light fill + `MuiTableCell.head` small-caps gray (lifts every list at once).
5. **Pages** — Customer, Customer360, Apply, Pipeline, LoanDetail (servicing), Collections, ClassificationBoard, Regcon, ReportViewer all open with PageHeader; KPI strips added to Customer (on-file/verified/pending/SME), Pipeline (in-flight/booked/approval+CPV/screening), Collections (P1, 1–30, 31–90 SMA, exposure), Board (open/standard/NPA/provision), Regcon (due-30d/streak/CAR/IFRS-9 runway — replaces the old plain stat cards), ReportViewer (statutory/filed/not-started/board). KYC column → StatusChip. Portal keeps its gradient hero (the portals.html contract).
6. **ReportViewer spinner bug (D8)** — loading branch now renders the error alert ("Returns board failed: …") instead of an eternal spinner.
7. **i18n catalog** — +13 keys, Bengali strictly from prototype dictionaries (`i18n.js`: search/filter/autosave/env/company/density; `nav_data.js`: the five area names). `npm run gen:i18n` regenerated (141 keys).

## 3. Contracts preserved (and two spec pins)

- Top-level nav remains `role=tab` (EN `Customers`/BN `গ্রাহক`, `Apply`/`প্রয়োগ`) — i18n-separation passes.
- Compliance sub-nav remains `role=link` (`রিপোর্ট সেন্টার`, `রেগুলেটরি কনসোল`).
- "Toggle language" button unchanged; walking-skeleton bilingual invariant green.
- The richer chrome legitimately repeats labels (sidebar + crumb + statusbar route), so two e2e assertions were pinned to semantic elements:
  - `p4-regcon.spec.ts:108` → `getByRole("heading", { name: "Report Center" })`
  - `p1-origination.spec.ts:23` → subtitle regex `${cif} · (RETAIL|SME|CORPORATE|AGRI)`

## 4. Verification

- `tsc --noEmit` clean; `npm run build` ✓ (3.4s).
- e2e: **18/18 passed** (run 2: 17 passed + 1 flaky that passes isolated/retry — the p2 API-leg token-timing flake, unchanged from before this pass).
- Visual: browser drive of /customers, /compliance/regcon, /compliance/board, /pipeline, /collections, /apply — image-model audit confirmed every checked chrome element present with **no overlap/clipping/misalignment defects**.
- IAB note: interactive clicks time out in this desktop browser session (hit-target checks; affects prototype and production tabs alike) — click-path verification is covered by the headless Playwright suite, which clicks the toggle, tabs, forms and wizard end-to-end.

## 5. Follow-ups (next pass candidates)

- Sparklines inside KPI cards (prototype draws tiny trend SVGs) — needs a small chart component; deferred.
- Sitemap RECENTS zone + density/dark-mode buttons (prototype shell extras) — deferred.
- Mega-menu (Tell-ME dropdown listbox) — the input filters the sitemap and Enter jumps; the flyout panel is not built.

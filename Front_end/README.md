# ULMS v2.0 — Front-End Prototype (Dynamics 365 Style)

**Project:** Unisoft Loan Management System · ABC Bank Bangladesh
**Prototype version:** 1.0 · September 2026
**Design language:** "INDIGO-FLUENT" (Fluent 2 / Dynamics 365 model-driven app pattern)
**Verification status:** ✅ 405/405 automated route tests PASS · ✅ 1,327 in-app links, 0 dead · ✅ in-browser self-test page

---

## 1. What This Is

A **100% working, zero-dependency front-end prototype** of the ULMS v2.0 loan
management system. It reproduces the Microsoft Dynamics 365 model-driven app
experience (modern refreshed look / Fluent 2) and exceeds the earlier CRMS
reference prototype in theme, density, accessibility, localization and QA
coverage.

Everything runs from the file system — no build step, no server, no npm
install. Open `index.html` in any modern browser (Edge/Chrome recommended).

| Entry point | What it shows |
|---|---|
| `index.html` | Landing / sign-in with 5 demo personas (MD, CRO, Approver, CIB Officer, Collections) |
| `app.html` | The full D365-style application shell (start here for a demo) |
| `portals.html` | Borrower self-service portal (balance, application tracker, bKash/Nagad/BEFTN payments) |
| `mobile.html` | CPV field-officer mobile app (offline-first, phone device frame) |
| `_selftest.html` | In-browser route walker — prints PASS/FAIL table, sets title `SELFTEST ALL PASS n/n` |

Default demo route after sign-in: `app.html#/home`.

---

## 2. Scale of the Prototype

| Dimension | Count |
|---|---|
| Business areas (sitemap) | 8 (A Customer → H Platform) |
| Modules | 31 |
| Sub-module groups | 62 |
| Screens | 166 |
| Reports | 104 |
| Data-entry forms (modal) | 85 |
| Functions (per-module function register) | 632 |
| Hash routes verified by test harness | 400 + 5 smoke = **405** |
| Distinct in-app links audited | **1,327 — 0 dead** |

---

## 3. File Map

```
Front_end/
├── index.html                 Landing + persona sign-in
├── app.html                   SPA host (loads css + 6 js files)
├── portals.html               Borrower portal
├── mobile.html                CPV field app
├── _selftest.html             In-browser self-test
├── README.md                  This file
├── UX_Design_Research_and_Rationale.md   Design research & decisions
├── css/
│   ├── tokens.css             Design tokens (brand ramp, aliases, dark mode, density)
│   └── app.css                Component layer (22 sections)
├── js/
│   ├── i18n.js                en/bn shell dictionary + statutory glossary
│   ├── charts.js              Dependency-free SVG chart library (8 chart types)
│   ├── demo_data.js           Seeded demo data (PRNG — deterministic)
│   ├── nav_data.js            Sitemap: areas → modules → groups → screens
│   ├── shell.js               Shell chrome: tabs, mega menu, Tell-ME, copilot, keys
│   └── app.js                 Router + all page builders (archetype-driven)
└── _tools/
    ├── route_test.js          Node harness — walks all 405 routes (DOM stubs)
    ├── link_audit.js          Node harness — crawls 407 pages, audits 1,327 links
    └── shots/                 12 headless-Edge screenshots
```

### Architecture

- **Pure vanilla JS SPA** — hash routing (`#/route/...`), string templates via
  `innerHTML`, `file://` friendly. No framework, no CDN, no network calls.
- **Navigation-as-data** — the entire sitemap lives in `js/nav_data.js`
  (`LMS_AREAS → LMS_MODULES → groups → screens`). The mega menu, sidebar,
  search index and route table are all generated from this one source.
- **Screen archetypes** — six page grammars cover all 166 screens:
  `g` grid/list · `f` record form · `x` 360° view · `c` console ·
  `d` dashboard · `r` report. Bespoke flagship pages (apply wizard, pipeline,
  CIB viewer, approvals, disbursement, collections, classification, regulatory
  console) are hand-built on top.
- **Deterministic demo data** — xorshift PRNG seeded with `"ulms-2026"`:
  every reload shows the same 16 customers, 26 loans, 18 applications.

---

## 4. Feature Checklist

### Dynamics 365 shell fidelity
- 48 px top bar: logo, STAGING badge, Tell-ME search (`Alt+Q`), theme toggle,
  density toggle, language toggle (EN/বাংলা), notification bell, avatar
- Left sitemap: Home · Favorites (★) · 8 collapsible areas · Recents · System
- **Mega menu** per area (hover/click): module columns → sub-module groups →
  screens, plus a Reports column and an area-count footer
- Multi-tab strip (max 12, LRU eviction, pin, session persistence)
- Collapsible icon rail (48 px) per module with color identity
- Status bar (bottom): route, record counts, clock, environment tag
- Command bars, view pills (All/Active/Overdue…), sortable/filterable grids,
  facet filter pane, saved-view dropdowns
- **Business Process Flow** on record pages (5 steps, done/current/pending)
- **FactBox** right rail on 360° views (related records, KPIs, timeline)
- Dashboard cards, KPI rails with trend sparklines, alert center

### Beyond-D365 enhancements
- **Real dark mode** — alias-token remap in `tokens.css` (charts re-palette live)
- **Three densities** — compact / comfortable / spacious (32/40/48 px rows)
- **WCAG 2.1 AA** — skip-link, `:focus-visible` double ring, ARIA labels on
  all icon buttons, `prefers-reduced-motion` support, 4.5:1 contrast tokens
- **Bilingual EN/বাংলা** — full shell translation + statutory term glossary
  (NPL → অবলোপনীয় ঋণ, SMA → বিশেষ উল্লেখযোগ্য হিসাব …) with Noto Sans Bengali
- **Responsive fluid type** — rem-based `clamp()` scale from 360 px phone to
  4K; off-canvas nav < 1024 px; print stylesheet for reports
- **Keyboard-first** — Alt+Q search, Ctrl+B nav, Ctrl+K copilot, Ctrl+W close
  tab, Ctrl+PgUp/PgDn cycle tabs, Esc closes overlays, arrow keys in Tell-ME
- **Copilot panel** — contextual canned answers (NPL, application status,
  strategy, branch queries)

### Bangladesh banking domain baked in
- **BRPD 15/2024** 7-stage classification (STD-0/1/2, SMA, SS, DF, B/L) with
  DPD-driven stage chips and 1/1/1/5/20/50/100% provisioning colors everywhere
- Interactive **provision calculator** on the classification board
- **CIB bureau viewer** — facility table, 24-month enquiry rhythm chart
- 7-level **approval ladder** L1 ≤ ৳5 L → L7 MD > ৳10 Cr, with org-chart view
- Disbursement **6-point checklist** + rail mix (BEFTN/bKash/Nagad/Rocket/cheque)
- Collections console with DPD buckets, promise-to-pay calendar strip
- ৳ formatting in Lakh/Crore (`৳ 2.4 Cr`), masked NID, CIF/LN identifiers
- Regulatory console: BRPD · BFIU AML · IFRS-9 ECL · Basel III CAR gauge

---

## 5. How to Demo (5-minute script)

1. Open `index.html` → click persona **Ahmed — Managing Director** → lands on
   `#/home` role center (funnel, portfolio donut, branch bars, alerts).
2. Hover **F Monitoring & Collections** in the sidebar → mega menu opens.
3. Click **BRPD Classification Board** → interactive provision calculator.
4. Press `Alt+Q` → type `LN-40118` → Enter → loan 360° with BPF + FactBox.
5. Sidebar **B Loan Origination → New Application** → 6-step wizard; type in
   income fields to see live DBR and EMI update.
6. Toggle 🌙 (dark) and density (compact) in the top bar — everything, charts
   included, re-themes instantly.
7. Toggle **বাংলা** — the shell translates live.
8. Open `portals.html` (borrower view) and `mobile.html` (field officer).

---

## 6. Quality Assurance

### Browser QA pass — 27 Sep 2026 (IAB drive-through, every component clicked)

A full manual drive-through over `python -m http.server` with a real browser
(persona logins, all 8 mega menus, Tell-ME, tabs pin/close, theme/density/
language toggles, copilot Q&A, wizard 6 steps, modal forms, grid sort/
facets/view pills, 360° tabs, report viewer/writer, portals, mobile) found
and fixed 10 defects that structural tests could not see:

| # | Defect | Fix |
|---|--------|-----|
| 1 | `app.css` line 488 missing `)` in `var(--fw-semibold` — Chromium silently dropped **94 rules** (modals, landing, portals, mobile, all responsive media queries, print) | paren restored; 485 rules parse |
| 2 | Tell-ME record results navigated to display labels (`#Loan · Md. …`) | `searchIndex()` normalizes `[id,title,sub,route]` rows |
| 3 | Tab pin hit-area 0×0 (empty span) | always-rendered 📌 with 16×16 box |
| 4 | Dark-mode active-nav contrast 4.22:1 (< AA) | dark-scope lift → 7.58:1; dark primary-button text navy |
| 5 | `#/regcon` crashed — two 4-element rows in returns table | descriptions added (5 elements) |
| 6 | `#/search?q=…` → "Screen not found" | router strips hash query string |
| 7 | Wizard step 3 leaked literal "NaN" (`+ +` typo) | operator fixed |
| 8 | Wizard EMI preview was static, ignored amount/tenor | live reducing-balance calc (ids + recalc) |
| 9 | Modal footer rendered 566px below modal box (flex min-height) — Submit unreachable on short viewports | `.modal` flex/min-height/overflow fix, footer pinned |
| 10 | Pipeline view pills: "SLA" filtered to 0 rows (case), "big" key unmatched | regex `/SLA\s*risk/i` + `big` alias |
| 11 | `#/directory` was a flat 166-screen list, not a module directory | rebuilt as Module Directory (A–Z): 31 module cards with area, counts and full module → group → screen trees, live filter; area breadcrumbs now open the area mega menu (labels updated shell-wide) |
| 12 | Bangla and English were concatenated on the same elements everywhere ("X · ইক্স", "Name (নাম)") | new i18n term layer (`js/i18n_data.js`): `LMSPick/LMSLabel/LMSPlace` render exactly one language — 57 group names + 92 KPI labels + places + segments translated; all 24 high-traffic routes verified **zero Bengali glyphs in EN mode** (৳ sign and the language-toggle affordance excluded); BRPD tables, copilot, user chip, Tell-ME, landing/portals/mobile all single-language with working toggles sharing `lms-lang` |
| 13 | UX drive-through (click-crawl + journeys): bare `#/search` page was a near dead-end | search page now has 7 suggestion chips (LN-40118, CL-1, NPL…) that run the query and deep-link results; click-crawl 58 links/8 hubs = 0 failures, 4-path navigation to #/apply verified, E2E journey (login→apply→approve→disburse→pay→PTP) green, glow states distinct |

Asset URLs now carry `?v=16` cache-busting (bump on every asset edit). `route_test.js` additionally fails
on any "Something went wrong" error page, so class-5 crashes can never pass again.

**Known coverage boundary (deliberate, documented):** Bangla mode localizes the
shell, navigation, module/area/group/screen names, customer/product/place
names, KPI labels, form labels and the static hosts (landing/portal/mobile).
Bespoke page intros, card titles and some deep prose remain English in bn mode
(untranslated — never mixed on one element). EN mode is verified 100% Bangla-free.
Regulatory report names (CL-1…) and codes stay Latin by banking convention in both.

### Run the automated gates (Node.js required)

```bash
cd Front_end
node _tools/route_test.js    # walks all 400 routes + 5 smoke tests
node _tools/link_audit.js    # renders 407 seed pages, follows 1,327 links
```

Expected output (current status):

```
PASS: 405   FAIL: 0   uncaught errors: 0
ALL PASS — every route reachable and rendering.

Seed pages rendered: 407
Distinct hash links discovered: 1327
Dead links: 0
ALL LINKS RESOLVE — zero dead links.
```

Both harnesses load the **real production JS files** with minimal DOM stubs —
no test-only code paths. Exit code is non-zero on any failure, so they can be
wired straight into CI.

### In-browser self-test

Open `_selftest.html` — it boots the real shell, walks the full route
inventory and renders a PASS/FAIL table. The browser tab title becomes
`SELFTEST ALL PASS 405/405` (grep-able by CI or a screenshot).

### Screenshots

`_tools/shots/` holds 12 headless-Edge captures (landing, home, pipeline,
apply, customer 360, loan 360, BRPD board, collections, reports, self-test,
portals, mobile). Regenerate with:

```bash
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
  --headless=new --disable-gpu --window-size=1440,900 \
  --virtual-time-budget=7000 \
  --screenshot="_tools\\shots\\02_home.png" \
  "file:///D:/software_project_development/software_project/Software_Project_14/mim_project/LMS/Front_end/app.html#/home"
```

---

## 7. Resetting Demo State

Shell preferences (theme, density, language, favorites, open tabs, recents)
persist in `localStorage` under `lms-*` keys. Use the ⚙ Settings page →
*Reset demo state*, or clear site data, to return to factory defaults.

---

## 8. Handover Notes for the Dev Team

- **Token-first styling** — never hard-code colors; use `var(--…)`. Dark mode
  and density come free if you respect the aliases in `tokens.css`.
- **Adding a screen** — add one object to the right group in `js/nav_data.js`;
  the sitemap, mega menu, search, route table and QA harness pick it up
  automatically. Give it a bespoke builder in `app.js` only if it needs more
  than the archetype default.
- **Wiring to real APIs** — every page builder is a pure function returning an
  HTML string over `demo_data.js` collections. Swap the collections for
  `fetch()` results in one place to go live; the archetype renderer needs no
  changes.
- **React migration path** — archetypes map 1:1 to page components; the token
  file ports directly to a CSS-in-JS/React context; `nav_data.js` is already
  framework-neutral JSON-in-JS.

See `UX_Design_Research_and_Rationale.md` for the design research trail,
source links, and the point-by-point comparison against the CRMS reference.

---

*Prepared by Unisoft Systems Limited · Youth Tower, Begum Rokeya Sarani, Dhaka · office@uslbd.com*

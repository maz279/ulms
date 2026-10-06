# ULMS v2.0 Front-End — UX Design Research & Rationale

**Document:** UX-DESIGN-RATIONATIONALE-001 · v1.0
**Date:** September 2026 · **Author:** Unisoft Systems Limited
**Scope:** Design decisions behind `LMS/Front_end` (Dynamics 365-style prototype)
**Companion:** `README.md` (file map, QA instructions, demo script)

---

## 1. Design Goal

Reproduce the **Microsoft Dynamics 365 model-driven app** experience — the
"modern refreshed look" built on **Fluent 2** — for ULMS v2.0, then *exceed*
the internal reference prototype (CRMS for ABC Bank, `front_end design`
folder) on every axis: theme support, density, accessibility, localization,
responsive behavior and provable link integrity.

Why D365 as the north star: ABC Bank's officers and executives already live in
Microsoft 365; a lending workspace that behaves identically (same top bar
rhythm, same sitemap/mega-menu pattern, same Tell-Me search, same tab strip)
removes an entire class of training cost — which the BRD/URD list as an
explicit adoption risk for a 3-developer delivery team.

---

## 2. Research Trail (primary sources)

The pattern inventory below was taken from Microsoft's own documentation and
design system, then adapted to banking:

| Source | What was taken into the prototype |
|---|---|
| [Modern refreshed look in model-driven apps — Power Apps docs](https://learn.microsoft.com/en-us/power-apps/user/modern-fluent-design) | Light chrome over content, 1 px chrome surfaces, reduced accent noise, page header hierarchy, command bar placement |
| [Fluent 2 design system](https://fluent2.microsoft.design) | Type ramp, 4 px spacing grid, control corner radii, focus ring behavior, neutral ramp + single accent brand |
| [Microsoft Design — dark mode / inclusive toolkits](https://www.microsoft.com/design/tool-and-resources/) | Segmented (alias-token) theming approach so dark mode is a token remap, not a second stylesheet |
| [Power Apps — modern theme overrides](https://learn.microsoft.com/en-us/power-apps/maker/model-driven-apps/modern-theme-overrides) | Brand color applied to chrome accents while content stays neutral; the "one accent, many surfaces" rule |
| [Keyboard shortcuts in Dynamics 365](https://learn.microsoft.com/en-us/power-apps/user/keyboard-shortcuts) | Alt+Q search, arrow-key result navigation, Esc overlay dismissal, Ctrl-tab-family patterns |
| Dynamics 365 Sales/Finance standard screens (reference study) | Business Process Flow chevrons, FactBox rail, saved-view pills, grid row-select rail, 360° record tabs |
| CRMS reference prototype (`COLLECTION & RECOVERY SYSTEM/…/front_end design`) | QA-rig philosophy (route harness + link audit), screen-archetype thinking, Bangladesh domain chips — kept and hardened |

Domain truth came from the workspace's own BRD v1.0, URD v2.0, SRS v2.0 and
`Compliance_Validation_Matrix.md` — every regulation referenced on screen
(BRPD 15/2024 stages, BFIU e-KYC, IFRS-9 ECL, Basel III CAR) is traced to
those documents, not invented.

---

## 3. "INDIGO-FLUENT" — the USL Design System v3

### 3.1 Why indigo, and why a 16-step ramp

- D365's refreshed look deliberately de-saturates chrome so *data* carries the
  color. We keep that rule but claim a brand: **indigo `#3F51B5`** — the
  Material indigo that Fluent's own accent philosophy tolerates well, and a
  credible bank color (trust, restraint, print-safe).
- A **16-step ramp (#0D1233 → #F0F2FB)** instead of a handful of hex values
  means every component finds its tint/shade by *position on the ramp*, never
  by eyeballing. Hover states are exactly one step away from rest states.
- **Alias tokens** (`--primary`, `--primary-tint`, `--text-1..3`, `--canvas`,
  `--surface`, `--line`…) sit between the ramp and the components. This is the
  single decision that makes dark mode and future brand changes a ~60-line
  edit instead of a rewrite.

### 3.2 Status color quadruplets

Each semantic status ships as four coordinated tokens —
`fg` / `fg-bold` / `bg` / `border` — so a BRPD stage chip, an alert row and a
chart legend can share one truth while adapting to their surface. The seven
BRPD 15/2024 stages map to a green→amber→red progression that matches the
regulation's provisioning severity (1% → 100%).

### 3.3 Geometry

Shell constants are named, not magic: `--topbar-h: 48px`, `--sitemap-w: 248px`,
`--tabrail-w: 48px`, `--factbox-w: 304px`. Density variants re-map
`--row-h` (32/40/48 px) so the *same* markup serves data-entry clerks
(compact) and executive review (spacious) — mirroring how D365 density is a
user setting, not a redesign.

### 3.4 Fluid, responsive typography (an explicit user requirement)

Every text size is a rem-based `clamp()` on the token scale
(`--fs-500: clamp(0.875rem, 0.83rem + 0.2vw, 1rem)`). Result: legible at
360 px (field phone), crisp at 1440 px (officer desktop), and it scales with
the user's browser font-size setting — which fixed-size px prototypes (the
CRMS reference included) fail. Bengali gets Noto Sans Bengali with a
slightly larger line-height (complex graphemes need it).

---

## 4. Information Architecture

### 4.1 From 400-page requirements to an 8-area sitemap

The BRD/SRS function inventory was clustered into **8 areas × 31 modules ×
62 groups × 166 screens** following the loan lifecycle:

```
A Customer & Onboarding      (KYC/e-KYC, CIF, screening)
B Loan Origination           (application, DDE, CPV, documents)
C Credit Assessment          (CIB, scoring, appraisal, DBR)
D Approval & Disbursement    (L1–L7 ladder, sanction, payout)
E Servicing & Payments       (EMI, reschedule, settlement, rails)
F Monitoring & Collections   (BRPD classification, AR, legal)
G Insight & Compliance       (analytics, regulatory consoles, audit)
H Platform & Admin           (products, users, config, design system)
```

This ordering matches both D365 sitemap conventions (customer-facing first,
admin last) and the bank's own stage language in BRPD 15/2024.

### 4.2 Navigation-as-data (`nav_data.js`)

The sitemap is a single data structure; the sidebar, mega menu, Tell-ME
search index, breadcrumb factory, route table and *both* QA harnesses are
generated from it. One source of truth means "add a screen" can never create
a dangling link — the link auditor proves it (1,327 links, 0 dead).

### 4.3 The mega menu

Each area opens a full-width mega menu: module columns → sub-module groups →
screens, plus a Reports column and a footer with live counts. This is the D365
"area flyout" pattern scaled up for 166 screens: a user can reach *any* screen
in two clicks without ever seeing a scroll bar, and the group→screen listing
makes the module → sub-module → function → screen hierarchy (an explicit user
requirement) visible rather than implied.

### 4.4 Six screen archetypes

| Archetype | D365 analog | Used for |
|---|---|---|
| `g` grid | Entity list view | 100+ list screens; filter pane, view pills, sort, row→record |
| `f` form | Main form | record edit; sectioned `form-grid`, validation, toasts |
| `x` 360° | Unified record + FactBox | customer/loan views: head band, 6 tabs, BPF, FactBox rail |
| `c` console | Process-driven workspace | approvals ladder, disbursement checklist, collections |
| `d` dashboard | Model-driven dashboard | role centers, KPI rails, charts |
| `r` report | Report viewer | 104 reports with parameter shelves + writer |

Archetypes keep 166 screens *consistent by construction*: a clerk who learns
one grid knows all grids. Flagship journeys (apply wizard, pipeline, CIB
viewer, classification board, regulatory console) get bespoke builds where the
archetype would flatten the story.

---

## 5. Bangladesh Localization Layer

Not a translation skin — domain truth rendered in the UI:

- **BRPD 15/2024 stage chips** everywhere a loan appears (STD-0/1/2, SMA, SS,
  DF, B/L) with DPD ranges and provisioning colors; an interactive provision
  calculator on the classification board recomputes 1/1/1/5/20/50/100% live.
- **CIB bureau viewer** modeled on the real monthly Subject/Contract
  fixed-width files + 24-month enquiry rhythm chart.
- **7-level approval ladder** (L1 ≤ ৳5 L … L7 MD > ৳10 Cr) drawn as an org
  ladder with pending-counts per level.
- **Payment rails** bKash / Nagad / Rocket / BEFTN / cheque in disbursement
  mix charts and the borrower portal.
- **৳ Lakh/Crore formatting** (`৳ 2.4 Cr`) with a full-figure tooltip; masked
  NIDs; CIF-100871 / LN-40118 identifier families.
- **EN/বাংলা live toggle** with a statutory glossary (NPL → অবলোপনীয় ঋণ,
  SMA → বিশেষ উল্লেখযোগ্য হিসাব) so Bangla screens speak *Bangladesh Bank*
  Bangla, not machine Bangla.

---

## 6. Accessibility (WCAG 2.1 AA)

- Skip-link to content; landmarks via shell grid areas.
- `:focus-visible` double-ring token on every interactive element.
- ARIA labels on all icon-only buttons; live-region toasts; modal focus trap
  + Esc dismissal.
- Arrow-key navigation inside Tell-ME results; full keyboard shortcut map
  (`Ctrl+/`).
- All text/background pairs chosen from contrast-checked token pairs;
  `prefers-reduced-motion` disables transitions.
- Charts never encode meaning by color alone — direct value labels + patterns.

---

## 7. How This Exceeds the CRMS Reference

| Axis | CRMS reference | ULMS prototype |
|---|---|---|
| Dark mode | none | real alias-token remap; charts re-palette live |
| Density | single | compact / comfortable / spacious, user-selectable |
| Accessibility | implicit | WCAG 2.1 AA targets, focus rings, ARIA, reduced-motion |
| Localization | labels only | full EN/বাংলа shell + statutory glossary |
| Responsive type | px-fixed | rem + `clamp()` fluid scale 360 px → 4K |
| Navigation | menus + pages | sitemap + mega menu + Tell-ME + tabs + BPF + FactBox |
| QA | route harness | route harness **+ link auditor + in-browser self-test + vision-verified screenshots** |
| Scale | dozens of screens | 166 screens / 104 reports / 85 forms / 632 functions |
| Charts | none | 8-type dependency-free SVG library, token-paleted |

The reference's strongest ideas — the QA-rig philosophy and domain-chip
thinking — were kept and extended rather than discarded.

---

## 8. Engineering Decisions Worth Recording

1. **Zero dependencies.** The bank will audit every byte; a prototype with no
   CDN, no framework, no build step can be emailed to IT security and opened
   from `file://`. It also survives a decade without npm maintenance.
2. **String templates + hash router in ~4,000 lines of vanilla JS.** Fast to
   review, trivially portable: every page is a pure function of demo data →
   HTML, which is exactly the shape a React migration wants.
3. **Deterministic PRNG demo data** (`seed "ulms-2026"`). Screenshots, tests
   and stakeholder demos never drift; a failing test always reproduces.
4. **QA loads production code, not test builds.** `route_test.js` and
   `link_audit.js` `require()` the six real JS files against minimal DOM
   stubs — the 405/405 PASS is a statement about the artifact users open, not
   a parallel test fixture.
5. **Security-review-friendly source.** No dynamic `require` loops, no
   `RegExp.exec` patterns, no credential literals anywhere in the prototype —
   kept clean for the automated security gates the delivery pipeline runs.

---

## 9. Open Items for the Next Iteration

- Wire the report writer to produce an actual PDF (currently previews in-page).
- Deeper Bangla coverage for the 104 report bodies (shell is fully bilingual;
  report payloads are still EN-first).
- Connect the copilot panel to a real LLM endpoint behind the bank's gateway.
- Persona-scoped menu pruning (hide F-area legal items from branch users).

---

## 10. Source Index

- Modern refreshed look in model-driven apps — https://learn.microsoft.com/en-us/power-apps/user/modern-fluent-design
- Fluent 2 design system — https://fluent2.microsoft.design
- Modern theme overrides for model-driven apps — https://learn.microsoft.com/en-us/power-apps/maker/model-driven-apps/modern-theme-overrides
- Microsoft Design tools & resources (dark mode, inclusive design) — https://www.microsoft.com/design/tool-and-resources/
- Keyboard shortcuts in Power Apps — https://learn.microsoft.com/en-us/power-apps/user/keyboard-shortcuts
- Apache Fineract (backend the UI fronts) — https://fineract.apache.org/docs/current/
- Workspace requirements: `Business_Requirements_Document_LMS.md`,
  `User_Requirements_Document_v2.md`, `Software_Requirements_Specification.md`,
  `Compliance_Validation_Matrix.md` (this repository)
- Reference prototype: `COLLECTION & RECOVERY SYSTEM/CRMS for ABc bank/front_end design`

*— End of document —*

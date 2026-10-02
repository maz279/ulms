# 07 — Frontend Implementation Plan (Staff Web App)

**Doc:** PLAN-007 · v1.0 · 2026-09-27 · Owner: Frontend Developer
**Stack:** React 19 · TypeScript 5.8 strict · Vite 7 · MUI v7 · TanStack Query ·
Zustand · React Hook Form + Zod · react-i18next · Playwright.

---

## 1. Source of Truth — the Prototype

`Front_end/` is the behavioral + visual contract (00 §2 rule 2). The build
**ports** it; it does not redesign it.

## 2. Design System Port (packages/ui) — Week 1–2

| Prototype asset | Product implementation |
|---|---|
| `tokens.css` 16-step indigo ramp + aliases | MUI v7 `createTheme` palette + CSS custom properties (theme provider injects both — components use MUI tokens; charts read CSS vars live like the prototype) |
| Dark mode alias remap | MUI dark theme + same CSS var swap — both stay in sync (story + test) |
| Density (32/40/48 rows) | theme spacing/density variant + user setting persisted (as prototype) |
| Status quadruplets + BRPD chips | module `@ulms/ui/chips` with the exact class mapping (`b-std0…b-bl`) |
| Focus rings, skip-link, reduced-motion | global theme components — a11y baseline carries over |

**Acceptance:** Storybook of the 6 archetypes (g/f/x/c/d/r) + shell chrome with
screenshot diff against prototype captures (Playwright `toHaveScreenshot`,
0.5% tolerance).

## 3. App Structure (apps/web)

```
src/
├── app/          router (route tree mirrors prototype routes exactly)
├── shell/        topbar, sitemap, mega menu, tabs, Tell-ME, statusbar, copilot panel
├── features/     one folder per area module (customer, origination, …)
│   └── …/        pages/ (archetype components), api/ (typed hooks), model/ (zod)
├── components/   generic grid (server pagination+sort), filter-pane, BPF, factbox,
│                 wizard shell, record tabs, view pills, upload zone
└── i18n/         en/bn message catalogs + glossary (ported from i18n_data.js)
```

- **Routing = prototype routes** (`/home`, `/workspace/:mid`, `/screen/:id`,
  `/loan/:id`, …) — Playwright gates and muscle memory carry over.
- **Menu config** fetched from `/platform/menu` (generated from the same module
  model as the prototype's `nav_data.js`, now role-filtered server-side).
- Data: TanStack Query per endpoint (keys mirror URL), optimistic updates for
  actions with rollback toast (prototype toasts become real feedback).
- State: Zustand stores only for shell UI (tabs, theme, lang, recent) — same
  keys as prototype localStorage.

## 4. Forms

- React Hook Form + **Zod schemas generated from OpenAPI** (`packages/openapi`).
- Field vocabulary per module area ported from FORMVOCAB (incl. PTP promise
  fields context-hook) — vocabulary is data, not code.
- Validation parity rule: server error codes map 1:1 to field errors via the
  `fields[]` problem-details envelope (05 §3).
- Autosave: dirty-state PATCH drafts (wizard) with the 30s cadence shown in UI.

## 5. Charts & Reports

- Port prototype chart grammar to **ECharts** (bundle-split) — same palette
  reading CSS vars; funnel/donut/gauge/heatmap presets map to prototype charts.
- Report viewer renders parameter shelves from OpenAPI examples; export = API
  call returning file (never client-side money formatting).

## 6. Internationalization (strict separation — a product feature)

- react-i18next with ICU; catalogs `en.json` / `bn.json`; **glossary layer**
  ported from `i18n_data.js` (57 groups, 92 KPI labels, places, segments).
- Rule: one language rendered per element — `{en,bn}` objects resolved by
  `pick()` helper; **CI Playwright job asserts zero Bengali script on key routes
  in EN mode** (and vice-versa) exactly like the prototype probe. ৳ sign and the
  language toggle are exempt (documented affordances).
- All numbers via Intl (en-IN grouping / bn-BD) — no hand formatting.

## 7. Accessibility (WCAG 2.1 AA — carried from prototype)

Keyboard map (Alt+Q, Ctrl+B, Esc, arrow Tell-ME), focus-visible rings, ARIA on
icon buttons, axe-core CI job with zero critical violations per page; tables use
real `<table>` semantics with sortable headers announced.

## 8. Non-functional Targets

- Initial route ≤250KB gz; route-level code split; LCP <2.5s on bank LAN.
- 30s polling for pipelines/worklists (no websockets in pilot — revisit GA).
- Offline tolerance: read caches survive session refresh (Query persistence).

## 9. Build Order (matches program weeks)

W1–2 shell+theme+auth+routing; W3–5 customer360 + wizard + pipeline;
W6–8 approvals/classification/CIB screens; W9–10 servicing/collections;
W11 reporting/regcon polish + a11y/i18n full sweep; W12 pilot fixes.

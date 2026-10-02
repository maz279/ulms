# 00 — Master Build & Implementation Plan

**Doc:** PLAN-000 · v1.0 · 2026-09-27 · Owner: Lead System Developer
**Status:** Approved for execution · **Audience:** whole team + management

---

## 1. Mission

Take ULMS v2.0 from **validated prototype** to **production software in use at
ABC Bank**, then productize for the wider Bangladesh market — in 12 weeks to
pilot with 3 developers, without regulatory or security shortcuts.

## 2. Delivery Philosophy (non-negotiable rules)

1. **Walking skeleton first.** Week 1 ends with one vertical slice deployed end
   to end (login → create client via our API → persisted in Fineract → shown in
   the React app → audit row written → visible in Grafana). Every later feature
   grows that skeleton; no feature lands on an undeployed trunk.
2. **Prototype is the contract.** Screen structure, journeys, bilingual rules,
   theme tokens come from `Front_end/`. Deviations require a written ADR.
3. **Trunk-based development.** Short-lived branches (<2 days), PR review by a
   second developer, CI is the gatekeeper (see 02 for the pipeline).
4. **Definition of Done** (per feature): code + unit tests + module test +
   OpenAPI updated + migration written + Playwright journey updated when UI
   changes + docs/ADR when architectural + deployed to DEV by pipeline.
5. **Regulatory features are first-class**, not hardening add-ons: BRPD
   classification, CIB, audit trail, maker-checker ship inside their modules.
6. **No secrets in code or examples.** All credentials via environment variables
   or the platform secret store; CI fails on detected secret patterns.
7. **Weekly demo to stakeholders** (Thursday), always from the deployed DEV
   environment, always walking the same journeys the prototype defined.

## 3. Phases and Gates

| Phase | Weeks | Exit gate (checked in demo + CI) |
|---|---|---|
| **P0 — Foundation** | 1–2 | G0: walking skeleton on Compose; CI green incl. Fineract contract tests; Keycloak login; Flyway baseline; one E2E test |
| **P1 — Origination core** | 3–5 | G1: customer 360 + application wizard persisted through our API to Fineract; approval ladder workflow with maker-checker; document upload (MinIO) |
| **P2 — Credit & approval** | 6–8 | G2: CIB connector (mock UAT), scoring + DBR service, approvals + disbursement with dual authorization; BRPD EOD batch + classification board live against migrated demo data |
| **P3 — Servicing & collections** | 9–10 | G3: payments posting + rails adapters (sandbox), schedules/statements, collections workbench + PTP; full E2E journeys green |
| **P4 — Compliance & reporting** | 11 | G4: CL-1..5 report pack, regcon calendar, regulatory dashboard, IFRS-9 runway fields |
| **P5 — Pilot hardening & UAT** | 12 | G5: security review fixes, backup/restore drill, DR runbook exercised, ABC UAT sign-off, go-live checklist complete |
| **P6 — Pilot run** | 13–16 | 4 weeks shadow + single-branch live operation, weekly issue burn-down, then general-availability branch |
| **P7 — Productization** | 17+ | Multi-bank config, tenant branding, packaging, docs for the 62-bank rollout |

Hardening is not a phase dump: each phase's gate includes its own security &
ops items (06/10 define per-phase checklists).

## 4. Workstream Swim-lanes (3 developers)

| Lane | Owner | Standing responsibilities |
|---|---|---|
| **Lead / full-stack** | Lead Dev | Architecture, Fineract adapter, integration connectors, workflow engine, security, CI/CD, reviews |
| **Frontend** | FE Dev | React app, design system port, i18n, a11y, Playwright journeys, borrower portal (P3), Expo app pairing |
| **Backend** | BE Dev | Modules, data model, batch jobs, reporting, tests, mobile API contracts |

Detailed week-by-week allocation lives in `12_Program_Plan_Timeline_Risks.md`.

## 5. Environment Strategy

| Env | Purpose | Data | Deploy |
|---|---|---|---|
| LOCAL | each dev laptop, Docker Compose | seeded synthetic | manual |
| DEV | shared, auto-deploy from main | seeded + anonymized | pipeline on merge |
| UAT | bank-facing acceptance | anonymized ABC extract (approved) | tagged releases |
| PILOT/PROD | ABC on-prem (k3s) | real (migrated) | release + change window |

No real customer PII before UAT; NID/CIB live endpoints only from UAT onward,
behind feature flags, with the bank's credentials in their secret store.

## 6. Risk-managed Sequencing (why this order)

1. Foundation before features — an undeployable feature is negative progress.
2. Origination before servicing — it exercises every layer (UI→workflow→
   Fineract→audit) with the smallest domain surface.
3. CIB/NID connectors gated behind adapter interfaces from week 3 — mocks first
   (11 defines the mock contracts), live sandboxes in P2, so external slippage
   never blocks internal progress.
4. Compliance reporting last-but-one because it consumes everything upstream;
   its data needs (classification, provisions, ECL fields) are nevertheless
   built from P2 onward so the reports are assembly, not archaeology.
5. Mobile app starts week 6 on the now-stable API contract; portal is a thin
   slice of the web app in week 10.

## 7. What "Done" Means for the Program

- All gates G0–G5 signed, UAT defects ≤ agreed threshold (0 critical/High, ≤5 medium open with bank sign-off)
- Pilot: 30 consecutive days ≥99.5% availability during banking hours, zero
  data-loss incidents, RPO/RTO demonstrated (10), all runbooks rehearsed
- Handover: ops runbook, admin guide, release process, and training delivered

## 8. Document Authority

Conflict resolution order: Compliance Matrix (regulatory truth) → SRS v2
(behavioral truth) → this planning suite (build truth) → prototype (UX truth).
Anything contradicting a higher authority is a defect, not a preference.

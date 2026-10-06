# ULMS Forensic Audit — Production Build State
**Date:** 2026-10-01 · **Auditor:** ZCode (session forensic pass)
**Inputs:** `project_implementation_guide_document/` (401 docs, Phases 0–8) · `Unisoft Loan Management system/` + BRD/URD/SRS/RFP (requirements corpus) · `LMS_CODEBASE/` (live code) · `Front_end/` (validated UX contract) · e2e suites

---

## 1. Verdict in one paragraph

The codebase is **further along than its own tracker claims**: gates G0–G3 are formally closed, and G4/G5 work (regcon returns pack, ECL, Basel CAR, provision JV, g5-evidence pack, i18n parity pass, 18-test e2e) is **built but unrecorded in the README status ledger**. What genuinely remains for *production* is: (a) activating security end-to-end (Keycloak login + role-gated UX — today the web runs on a dev actor header), (b) five missing business modules the requirements mark CORE (loan-product engine, sanction letters, BOCC committee, notifications, write-off/recovery), (c) the transactional outbox promised by ADR-004, (d) the mobile field app, (e) live external adapters (CIB/NIDW/rails/SMS — all mocks by design until UAT), (f) k3s/Helm deployment + strict CI gates, and (g) pilot/G5 bank-side closure items. The 401-doc guide suite additionally mandates an architecture (8 microservices, Camunda, Kafka, Kong, Vault, schema-per-tenant) that **conflicts with the binding stack** (modular monolith, no Camunda/Kafka, PG17, Keycloak 26, React 19/MUI7/Vite7, Expo 54, compose→k3s) — the plan translates guide deliverables into the binding architecture rather than following the guide literally.

---

## 2. What IS built (evidence-backed)

### 2.1 Backend (`apps/api` — Spring Boot 4 modular monolith, Java 21, 11 packages)
- **73/73 OpenAPI path items (88 operations) implemented** by 14 controllers across 11 modules (customer, customer360, origination, approval+disbursement, assessment, servicing, collections, compliance+regcon+reporting, portal, platform, integration). 36 JPA entities, 38 Flyway tables (V1–V11).
- Business rules genuinely implemented: server-side DBR/scoring with auto-decline, 7-level approval ladder with maker-checker role gates, dual-auth disbursement (409 discipline), BRPD 15/2024 EOD engine ±1-day boundaries, provision oracle + GL JV (zero-sum, idempotent), CIB fixed-width parser (golden-tested), payment rails with HMAC webhooks (idempotent by UTR), collections worklist/PTP/dunning/legal/waiver, settle-quote policy oracle, ECL 3-stage, Basel CAR, regcon 12-return catalog with preparer→checker→compliance chain, reporting read model + writer slice, portal thin slice, WORM audit export.
- **103 backend tests** (Testcontainers PG17 + ArchUnit) across 20 classes.
- **Mocks by design (live at UAT):** CibMockAdapter, NidMockAdapter, NoListScreeningAdapter, SandboxRailAdapter, PassThroughScanAdapter (P1 stub — AV engine never replaced).

### 2.2 Web (`apps/web` — React 19 + TS + Vite 7 + MUI v7)
- Full prototype UX contract: D365-style shell (sitemap Home/Favorites/Areas/Recents/System, mega menus, Tell-ME search, tab strip + rail, copilot, toasts, shortcuts, density/theme/lang), **all 31 modules and 166 screens** reachable, API-coupled pages (customers, 360, apply wizard, pipeline, loan detail, collections, classification board, regcon, report center) + prototype-faithful pages (home, workspaces, archetypes g/f/x/c/d/r, directory, coverage, audit, settings, design system).
- Mock API (`scripts/mockApi/`) implements the OpenAPI contract end-to-end (verified 73 endpoint sweep, 0×5xx) so the UI is fully exercisable without Docker/JDK.
- Verified this session: 216-route crawl (0 dead routes), 8/8 mega menus, 10/10 system links, numeric grid sorting, tab LRU/pinning/persistence, i18n EN/BN invariant, dark mode, form validation.

### 2.3 Quality/infra
- e2e: **18 Playwright tests / 6 suites** (G0–G4 + i18n); 16 pass + 2 token-gated skips against the mock stack.
- CI: GitLab verify→test→security→build→deploy-dev→e2e with gitleaks (hard-fail), redocly OpenAPI lint, osv-scanner + semgrep (still `allow_failure` — plan said strict at G1/G2).
- deploy: compose (PG17, Keycloak 26 + realm seed with 11 roles, Fineract, seaweedfs-MinIO, api), seed SQL (5 customers/7 loans all BRPD classes), backup/migration drills, 10 runbooks RB-01..10, g5-evidence pack (2026-09-30), ADR-001..004.

---

## 3. What is NOT built (the production gap list)

### 3.1 Tracker dishonesty / hygiene rot (fix first)
1. `LMS_CODEBASE/README.md` status ledger stops at "P3 G3 CLOSED"; P4/P5 code+evidence exist → **G4/G5 build state unrecorded**.
2. Junk files: `apps/api/nul`, `apps/api/src/main/java/nul`, `.../com/uslbd/ulms/nul` (Windows redirect dumps).
3. Compose **lacks web/prometheus/grafana** services the README advertises; Fineract image unpinned (`latest`).
4. Real `.env` committed alongside `.env.example` (no VCS here, but hygiene rule stands); no `.gitignore`.
5. OpenAPI drift: `GET /collections/{loanId}/actions` implemented but undocumented; `/actuator/health` + `/hooks/*` server-base mismatch vs compose mounts.
6. CI `deploy-dev` is a placeholder echo.

### 3.2 Security not activated (requirements CORE)
7. No Keycloak login in the web app (dev `X-ULMS-Actor` header); no token refresh; **no role-gated menus/actions** (realm ships 11 roles incl. ladder bands); MFA unexercised.
8. Mock API performs no auth (fine for dev; production path untested).

### 3.3 Missing CORE business modules (per requirements inventory)
9. **Loan-product configuration engine** — no product entity/table/CRUD anywhere in the backend (23-product catalog is config data, not code). Products are hardcoded strings in the web + mock.
10. **Sanction letters** — `sanction_letter` table exists (V2) with **zero code**; bilingual generation/acceptance-tracking is a CORE requirement.
11. **BOCC committee module** — meetings/agenda/attendance/minutes/voting: no backend, prototype screens only (B3 archetype pages are generic demos).
12. **Notifications module** — no module at all: templates (BN/EN), SMS/email gateways, delivery tracking, lifecycle triggers. Requirements CORE.
13. **Write-off processing + NPA recovery tracking/incentives** — screens only (F3 archetypes); no backend flow.
14. **Guarantor management** — partial (CIB guarantor check exists); no guarantor registry/linkage.
15. **Transactional outbox (ADR-004)** — `outbox_event` table exists, no writer/relay code; event-driven notification/audit fan-out unbuilt.
16. **Document management depth** — MinIO adapter + scan stub only; no OCR, thumbnails, per-product checklists, expiry alerts (A3 module).
17. **AML depth** — screening hook exists (CLEAR-only stub); CDD/EDD/PEP lists/STR support missing.

### 3.4 Channels
18. **Mobile field app (Expo 54)** — nothing built (CPV capture, GPS, offline sync, collections app; a priced add-on module).
19. **Borrower portal depth** — thin slice only (login, cards, tracker, pay-redirect); self-service apply/document upload/statements browsing missing; partner API channel (B1-s4) missing.

### 3.5 Deployment & operations
20. **No k3s/Helm/Terraform** — PLANNING/10 targets compose→k3s+Helm; only compose exists.
21. Monitoring: Prometheus/Grafana configs absent (compose + dashboards + alert rules); no Jaeger.
22. Backup: pgBackRest config + DR plan docs exist as guides only; drills exist for logical backup (RB-02).
23. Perf/security testing (JMeter/k6, OWASP ZAP, pen-test) not executed; SonarQube gate not wired.

### 3.6 Program-level
24. G5 bank-side items open: UAT letter, external pen-test, bank-hosted dashboards, MDM mobile distribution, training.
25. P6 (pilot) and P7 (productization) unstarted per PLANNING/00.
26. Multi-tenancy (schema-per-tenant, SRS CORE) consciously absent in binding PLANNING — decision needed to formally de-scope or roadmap it (62-bank SaaS ambition vs single-bank pilot).

### 3.7 Guide-suite conflicts to formally resolve (ADR needed)
Microservices+Kong+Camunda(7.20 vs 8.3 self-conflict)+Kafka+Vault+Elasticsearch+Python-ML+schema-per-tenant ⊕ per-service ports ⊕ Helm-to-K8s-1.28-full-cluster **vs** binding monolith/no-Camunda/no-Kafka/PG17/Keycloak26/React19/Expo54/k3s. Also DF/B-L boundary (360 vs 365 days) and 6-vs-7 approval levels contradictions inside the requirements corpus — the codebase already pins 365 and 7 levels (L1..L7), which the audit endorses.

---

## 4. Scorecard (production readiness by area)

| Area | State | Score |
|---|---|---|
| Prototype UX parity (web) | Complete, 0 dead routes | ✅ 95% |
| OpenAPI contract coverage | 73/73 paths (redocly-verified) | ✅ 95% |
| Business-rule engines (BRPD/scoring/ladder/dual-auth/ECL/CAR) | Built + tested | ✅ 90% |
| Security activation (login/RBAC/MFA) | Not wired | 🔴 20% |
| Product/sanction/BOCC/notifications/write-off modules | Missing | 🔴 0–15% |
| Mobile | Missing | 🔴 0% |
| Live integrations | Mock adapters (by design until UAT) | 🟡 40% |
| Deployment (k3s/Helm/CI-CD/monitoring) | Compose only; CI partial | 🔴 30% |
| Ops docs/runbooks/drills | Strong | ✅ 85% |
| Program gates honesty | Ledger stale | 🟡 60% |

**Overall production readiness ≈ 55–60%.** The plan below closes the rest in 9 phases.

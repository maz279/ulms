# ULMS Technology Stack Recommendation — v3.0

**Document:** TECH-STACK-REC-003 · v3.0
**Date:** September 27, 2026 · **Author:** Unisoft Systems Limited
**Supersedes:** Technology_Stack_Recommendation_v2.md (Feb 2026)
**Status:** PROPOSED — for team review before Phase 1 build
**Context:** Validated high-fidelity prototype delivered (`Front_end/`); 3-developer team; first target deployment ABC Bank Bangladesh

---

## 1. Why a v3 — What Changed Since February

Three things changed since the v2 recommendation was written:

1. **The prototype now exists and is verified** — 166 screens, 1,327 links, working
   journeys, bilingual, themeable. The build is no longer a blank page; the stack
   must serve a direct prototype→product conversion, not a from-scratch build.
2. **The platform landscape moved** (researched Sept 2026): Fineract's current line is
   1.12.x (v2 pinned 1.10); Spring Boot 3.5 reaches end of OSS support **June 2026**
   and 4.0 is GA; React 19 / MUI v7 / Vite 7 are current; Keycloak 23 is EOL-era;
   PostgreSQL 18 shipped Sept 2025; Kubernetes 1.33+ is current.
3. **A licensing landmine was found**: Camunda 8 self-managed **requires an
   enterprise license for any production deployment** — the Free Edition is
   dev/non-production only. The v2 plan (Camunda 8.3) would have created an
   unplanned recurring cost and a contractual dependency.

And one thing did not change but must now be said plainly: **the delivery team is
3 developers.** v2 sketched a 10+-operator architecture (microservices + Kafka +
Zeebe cluster + Kong + Vault + ELK). That is not operable by 3 people building a
bank product. v3 optimizes for: *small team, bank-grade correctness, fastest safe
path to production, no license traps.*

---

## 2. v3 Stack at a Glance

| Layer | v2 (Feb 2026) | v3 (this doc) | Change |
|---|---|---|---|
| Core lending platform | Apache Fineract 1.10 CE | **Apache Fineract 1.12.x CE** (pin latest patch) | UPDATE + security CVE fixes |
| Custom backend runtime | Java 21 + Spring Boot 3.2 microservices | **Java 21 LTS + Spring Boot 4.0.x, modular monolith** | UPDATE + SIMPLIFY |
| Workflow / approvals | Camunda 8.3 | **DB-backed workflow engine (Spring) — no external BPM** | REPLACE (license) |
| Async messaging | Apache Kafka 3.6 | **Postgres transactional outbox + Spring events** (Kafka deferred) | DEFER |
| Primary database | PostgreSQL 16 | **PostgreSQL 17** (18 validated in staging) | UPDATE |
| Cache | Redis 7 (day one) | **Caffeine in-process** → Redis only if measured need | DEFER |
| API gateway | Kong 3.5 | **Spring Cloud Gateway** (or nginx for the simplest installs) | SIMPLIFY |
| Identity & access | Keycloak 23 | **Keycloak 26.x** | UPDATE (EOL gap) |
| Secrets | HashiCorp Vault 1.15 day one | **Bank KMS/HSM + encrypted config; Vault in hardening phase** | DEFER |
| Web frontend | React 18.2 + TS 5.3 + Vite 5 + MUI 5.15 | **React 19 + TS 5.8+ + Vite 7 + MUI v7** | UPDATE |
| State/data | Redux Toolkit 2 + RTK Query | **TanStack Query + Zustand** (less boilerplate) | SIMPLIFY |
| Mobile | React Native 0.73 + Expo 50 | **React Native 0.81+ / Expo SDK 54+** | UPDATE |
| Observability | Prometheus + Grafana + ELK | **Prometheus + Grafana + Loki** (ELK dropped) | SIMPLIFY |
| Runtime/orchestration | Docker + Kubernetes 1.28 | **Docker Compose (dev) → k3s (bank on-prem)** | RIGHT-SIZE |
| CI/CD | GitLab CI + ArgoCD | **GitLab CI → k3s via Compose/Helm; ArgoCD later** | RIGHT-SIZE |

---

## 3. Decision Detail

### 3.1 Apache Fineract 1.10 → **1.12.x** (UPDATE, mandatory)

- Current release train is **1.12.x** (last release Nov 2025). A 2025 SANS advisory
  notes an insufficiently-protected-credentials issue fixed in **1.12.1**, and a 2026
  CVE (CVE-2026-32255, arbitrary file upload via Images API) makes running anything
  older than the current patch line indefensible in a bank security review.
- ASF board minutes mark Fineract health **amber** — mitigation: pin the exact patch
  version, wrap every Fineract API call behind our own adapter layer with contract
  tests, and budget for occasional manual upgrades.
- Fineract keeps its **own embedded runtime/Spring version**; we integrate over REST
  (and share the PostgreSQL cluster, separate schemas). This deliberately decouples
  "Fineract's stack" from "our stack" so both can upgrade independently.

### 3.2 Spring Boot 3.2 → **4.0.x** (UPDATE — timing is the reason)

- Spring Boot **3.5.x OSS support ends 30 June 2026** — already behind us. Starting a
  new build today on any 3.x means launching on a dead branch. **4.0 went GA
  November 2025**; migration guides and the ecosystem (starters, security, data)
  are current in 2026.
- Our custom services are *new code with zero 3.x legacy*, which is exactly the
  profile that should start on the current major.
- Java stays **21 LTS** (what Fineract targets; long support). Java 25 LTS exists but
  adds nothing we need for this system; revisit at the 2027 upgrade window.

### 3.3 Microservices → **Modular monolith** (SIMPLIFY — the big one)

- One custom Spring Boot application, strongly modularized by package boundaries and
  enforced module tests (Spring Modulith), deployed beside Fineract. Modules:
  `customer` `origination` `assessment` `approval` `servicing` `collections`
  `compliance` `integration` `platform`.
- Rationale: with 3 developers, every extra deployable multiplies CI, deployment,
  debugging, and on-call surface. A modular monolith keeps the *logical* boundaries
  of the prototype's 8 areas while deploying as one artifact. Extract a service
  later only when a module has independently proven scaling or release needs.
- The prototype's architecture (pure-function builders over an API client) maps
  1:1 onto this: one frontend app consuming one backend API.

### 3.4 Camunda 8 → **DB-backed workflow engine** (REPLACE — license + weight)

- **Why out:** Camunda 8 self-managed Free Edition is **dev/non-production only**;
  production requires an Enterprise license (quote-based, reported ~$10k+/yr entry).
  Camunda 7 CE is end-of-life. Either path is a hard sell for a 3-dev product.
- **Why nothing external instead:** our workflows are structurally simple and few —
  the 7-level approval ladder, BRPD EOD classification batch, CIB file schedules,
  document verification queue. These are **state + transitions + timers**, not
  ad-hoc human process design. A BPM cluster (Zeebe alone wants 3 nodes) is
  disproportionate.
- **v3 approach:** `workflow_definition` / `workflow_instance` / `workflow_task`
  tables + a small Spring service (event-driven transitions, SLA timers via
  ShedLock-scheduled jobs, full audit trail). This is auditable (bank requirement),
  renders into the prototype's existing approval-ladder and BPF UIs unchanged, and
  costs ~2 weeks of one developer.
- **Escape hatch:** if a bank later demands BPMN process visibility, embed
  **Flowable 7 (Apache-2.0, Spring-native, in-process)** — no cluster, no license.

### 3.5 Kafka → **Postgres outbox + Spring events** (DEFER)

- At ABC-bank scale (~500k loans, batch CIB rhythms), Postgres is comfortably the
  transactional backbone. Use the **transactional outbox pattern** (same-DB,
  same-transaction event rows) + a dispatcher for integrations (CIB, NID, SMS) and
  domain events. Same ordering and reliability guarantees we need, zero new
  infrastructure.
- Introduce Kafka **only** when a real driver appears: multi-bank SaaS volumes,
  heavy stream analytics, or BB real-time reporting requirements. The outbox table
  converts to a Kafka topic producer with no domain-code change.

### 3.6 PostgreSQL 16 → **17 now, 18 in staging** (UPDATE)

- **17** is the conservative production choice (mature, widely supported by
  Fineract-era tooling, logical-replication improvements we may use for reporting
  replicas).
- **18** (Sept 2025) brings async I/O, UUIDv7, virtual generated columns — validate
  in staging; adopt for greenfield banks once it has a year of field exposure.
  UUIDv7 in particular suits our event/outbox keys.

### 3.7 Keycloak 23 → **26.x** (UPDATE — security-critical)

- Keycloak 23 is far behind; 26.x is the current line (26.7 at research time) with
  Admin API v2, standard token exchange, SCIM preview, and a stream of security
  fixes. IAM is the last component a bank audit wants stale. Use OIDC throughout;
  the prototype's 5 personas become Keycloak realm roles (`md`, `loan-officer`,
  `branch-manager`, `credit-analyst`, `collections`).

### 3.8 Frontend: React 18 → **React 19, MUI v7, Vite 7, TS 5.8+** (UPDATE)

- React 19 (stable since Dec 2024) with the App Router-less SPA we already have —
  Actions/server-thinking not required; we benefit from `useOptimistic` (payment
  posting UX), improved Suspense, and first-class TS support.
- **MUI v7** current major (Theme v6 engine) — our prototype design tokens
  (`tokens.css`) port into a single MUI theme: the 16-step indigo ramp becomes the
  palette object, density tokens become MUI density, dark mode is one theme object.
- **Vite 7** for build/HMR.
- **TanStack Query + Zustand** replace RTK for less boilerplate with a 3-dev team;
  server state (Query) and UI state (Zustand) split cleanly. Forms stay
  **React Hook Form + Zod** as v2 planned — mirrors the prototype's validated
  field/vocab model.
- i18n: the prototype's separation mechanism (`LMSPick/LMSLabel`, strict one-language
  rendering) ports to **react-i18next + ICU messages**; keep the leaf-node
  "no mixed script" test as a CI check.

### 3.9 Mobile: React Native 0.73/Expo 50 → **0.81+/SDK 54+** (UPDATE)

- Prototype's CPV app is deliberately minimal (offline visits, photos, GPS, queue).
  Expo SDK 54+ with **expo-sqlite + MMKV** matches the offline-first spec exactly.
  Defer native modules; EAS Build for both stores.

### 3.10 Infra right-sizing

- **Dev:** Docker Compose (app + Fineract + Postgres + Keycloak + MinIO) — one
  command, zero cluster.
- **Bank on-prem:** **k3s** single/HA-small cluster — real Kubernetes (current 1.33+
  features irrelevant vs. its lightweight ops), Helm charts from the same images.
  Full k8s + ArgoCD remains available when the install base justifies it.
- **Observability:** Prometheus + Grafana + **Loki** (logs) — covers the bank
  monitoring ask at a fraction of ELK's footprint. ELK returns only if BB mandates
  full-text log retention tooling we can't meet otherwise.
- **Gateway:** Spring Cloud Gateway (in our app or a thin sidecar JAR). Kong
  re-enters only for multi-tenant SaaS routing later.
- **Secrets:** Phase 1 = OS-level secret files + encrypted properties + bank HSM for
  keys (banks prefer their own KMS anyway). Vault becomes a hardening-phase item,
  not a day-one system to operate.

---

## 4. Prototype → Product Mapping (why this stack converts fastest)

| Prototype asset | Becomes | Notes |
|---|---|---|
| `css/tokens.css` | MUI v7 theme + CSS variables | ramp/alias tokens map 1:1 |
| Archetypes (g/f/x/c/d/r) | 6 route-component families | page builders were pure functions already |
| `nav_data.js` | Backend-served menu/permission config | single source of truth, role-filtered |
| `demo_data.js` | API client + server seed fixtures | same shapes → same components |
| FORMVOCAB + validation | React Hook Form + Zod schemas | vocab per module area kept |
| BPF / approval ladder / FactBox | MUI Stepper / custom ladder / side-panel | verified UX copied as-is |
| `i18n_data.js` pick/label/place | react-i18next + ICU + glossary JSON | keep the "no mixed script" CI probe |
| `route_test`/`link_audit`/self-test | **Playwright** E2E suite | same route inventory as the test plan |
| 13-defect QA log | Regression checklist | several (modal focus, contrast) become CI a11y tests |

This is the core economic argument for v3: **every structural decision in the
prototype was made to survive this conversion**; the stack above is the shortest
paved road from it.

---

## 5. Build Plan Sketch (3 developers, 12 weeks to pilot)

| Weeks | Lead Dev | Frontend Dev | Backend Dev |
|---|---|---|---|
| 1–2 | Repo, CI, Compose env, Fineract 1.12 boot + contract tests | Vite7/MUI7 theme from tokens.css; shell + routing + auth flow | Postgres schema, Flyway, Keycloak 26 realm, outbox |
| 3–5 | Fineract adapter (clients/products/loans APIs) | Customer 360 + origination wizard (RHF+Zod) | Customer/origination modules + workflow engine core |
| 6–8 | CIB + NID integration connectors (mock → UAT) | Pipeline, approvals, classification screens | Approval workflow, BRPD EOD batch, provision calc |
| 9–10 | Payments/disbursement + rails adapters | Servicing, collections, PTP | Servicing/collections modules + audit trail |
| 11–12 | Hardening: security review fixes, backup/restore drill | Playwright suite from prototype gates, a11y pass | Reporting (CL-1..5), regcon pack, UAT data load |

Mobile (CPV app) runs as a parallel track from week 6 (Expo scaffold already
specified); borrower portal is a thin slice of the same React app at week 10.

---

## 6. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Fineract "amber" health / upgrade drift | Adapter layer + contract tests; pin patch; quarterly upgrade budget |
| Spring Boot 4 early-ecosystem gaps | Stay on core starters only; HeroDevs/spring guides tracked; 3.5 escape hatch until June 2026 is closed — start on 4, not 3 |
| Custom workflow engine scope creep | Hard scope: ladder, classification, doc-queue, CIB schedules; Flowable escape hatch documented |
| Team of 3 bus-factor | Modular monolith + ADRs + the docs suite already in repo; every module has tests |
| Bank on-prem variability | Compose-first packaging; k3s Helm; both produced from same images |
| Bangladesh Bank timeline (IFRS-9 Dec 2027 etc.) | BRPD/ECL modules land by week 8 in this plan; regulatory calendar already in SRS |

---

## 7. Summary Verdict

The v2 direction was sound but dated and over-tooled for the team. **v3 keeps the
strategic core** (Fineract CE + PostgreSQL + Java/Spring + React + Keycloak — all
open-source, all bank-auditable) and changes what time and licensing force:
**update** Fineract/Spring Boot/React line/Keycloak/Postgres to current supportable
versions, **replace** Camunda (license trap) with a right-sized DB workflow engine,
**defer** Kafka/Vault/Redis/ELK until measured need, and **right-size** deployment
to Compose → k3s. Combined with the validated prototype, this is the fastest
defensible path from "working prototype" to "working product."

---

## 8. Sources (researched Sept 2026)

- Apache Fineract releases/downloads — https://downloads.apache.org (fineract directory) and https://fineract.apache.org
- Fineract 1.12.1 security fix context (SANS advisory, Dec 2025); CVE-2026-32255 (Images API)
- Camunda licensing — https://camunda.com (Self-Managed Free = dev/non-production; production requires Enterprise) and https://docs.camunda.io
- Spring Boot 4.0 GA (Nov 2025); 3.5 OSS support ends 30 Jun 2026 — https://spring.io and community migration guides
- React 19 — https://react.dev/blog/2024/12/05/react-19
- MUI v7 / MUI X v8 current majors — https://mui.com
- Vite 7 release (Jun–Jul 2025) — https://vite.dev
- Expo SDK 54 / React Native 0.81 pairing — https://expo.dev
- PostgreSQL 18 (Sept 2025: async I/O, UUIDv7, virtual generated columns) — https://www.postgresql.org
- Keycloak 26.x line (Admin API v2, token exchange, SCIM preview; line ends ~26.8) — https://www.keycloak.org and https://github.com/keycloak/keycloak
- Kubernetes 1.33 "Octarine" (Apr 2025) and later — https://kubernetes.io
- SVPG live-data prototype vs production (definition used in the prototype assessment) — https://www.svpg.com

*— End of document —*

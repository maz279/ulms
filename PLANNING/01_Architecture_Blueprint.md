# 01 — Architecture Blueprint

**Doc:** PLAN-001 · v1.0 · 2026-09-27 · Owner: Lead System Developer
**Stack reference:** Technology_Stack_Recommendation_v3.md (binding)

---

## 1. System Context (C4 Level 1)

```
        ┌────────────┐   NID/e-KYC    ┌─────────────┐   CIB files/RT
        │  NIDW API  │◄───────────────┤             ├──────────────► Bangladesh Bank CIB
        └────────────┘                │             │
        ┌────────────┐   SMS/Email    │   ULMS v2   │   BEFTN/bKash/Nagad
        │ SMS gateway│◄───────────────┤  (this      ├──────────────► Payment rails
        └────────────┘                │  build)     │
        ┌────────────┐   REST/SOAP    │             │   REST         ┌────────────┐
        │ ABC CBS    │◄───────────────┤             │◄──────────────►│ Staff Web  │
        └────────────┘                └──────┬──────┘                │ (React 19) │
                                            │ REST                  └────────────┘
                                            ▼                        ┌────────────┐
                                    ┌───────────────┐                │ Expo field │
                                    │ Apache Fineract│◄──────────────┤  CPV app   │
                                    │ CE (lending    │                └────────────┘
                                    │ engine)       │                ┌────────────┐
                                    └───────────────┘                │ Borrower   │
                                                                     │ portal     │
                                                                     └────────────┘
```

Users: branch officers, branch managers (L2), HO credit analysts, regional/Head
office approvers (L3–L6), MD/Board (L7), CPV/collection field officers,
compliance officers, borrowers (portal), Bangladesh Bank (regulatory consumer).

## 2. Container View (C4 Level 2)

**Two deployable applications + platform services.**

```
┌────────────────────────────── ULMS App (modular monolith) ─────────────────────────────┐
│  Java 21 · Spring Boot 4 · modules enforced by Spring Modulith verification            │
│                                                                                        │
│  api-web          REST controllers, OIDC resource server (Keycloak), OpenAPI live      │
│  mod-customer     CIF mirror, KYC/e-KYC orchestration, screening                       │
│  mod-origination  applications, documents, CPV, eligibility                            │
│  mod-assessment   CIB pull/parse, scoring, DBR, appraisal memo                         │
│  mod-approval     workflow engine use, sanction letters, dual authorization            │
│  mod-servicing    disbursement rails, payments, schedules, statements, restructuring   │
│  mod-collections  DPD engine, buckets, PTP, field tasks, recovery/legal                 │
│  mod-compliance   BRPD EOD batch, provisions, CL-1..5 pack, regcon calendar, ECL fields │
│  mod-integration  adapter ports: CIB, NIDW, SMS, rails, CBS + outbox dispatcher        │
│  mod-platform     users/roles sync, config, audit (WORM), jobs (ShedLock), reporting   │
│                                                                                        │
│  workflow-engine  DB-backed (workflow_definition/instance/task) — in-process           │
│  fineract-adapter generated Fineract client behind port interfaces (Adapter+Facade)    │
└───────┬────────────────┬──────────────┬───────────────┬───────────────────────────────┘
        │                │              │               │
   PostgreSQL 17     Keycloak 26     MinIO S3       Prometheus/Grafana/Loki
   (ulms schema +    (OIDC, roles)   (documents)    (metrics/logs)
    fineract schema
    same cluster)
```

**Why one app:** 3 developers; module boundaries preserved in code and CI
(ArchUnit + Modulith tests); extraction path documented in ADR-007 template.
**Why Fineract separate:** it keeps its own release cadence (amber-health
upgrades), we talk REST-only, we never patch its schema.

## 3. Runtime Topology

| Stage | Topology |
|---|---|
| LOCAL | `docker compose up` → app, Fineract, Postgres, Keycloak, MinIO, Prometheus/Grafana |
| DEV | single VM, Compose, auto-deploy |
| UAT | 2 VMs: app+Fineract on one, Postgres+Keycloak+MinIO on other; nightly backup |
| PILOT (bank on-prem) | k3s (3 nodes: 2 app-pool, 1 db-pool), Helm chart; Keycloak HA behind Postgres; MinIO with 2 replicas; Loki single + object storage retention |
| Scale-out later | add app replicas behind gateway; Postgres streaming replica for reporting; outbox→Kafka bridge when volumes demand |

## 4. Key Architectural Decisions (ADR index — full ADRs live in repo `/docs/adr`)

| ADR | Decision | Rationale summary |
|---|---|---|
| 001 | Modular monolith over microservices | team size, operability, module boundaries kept |
| 002 | Fineract as lending engine, our schema mirrors what UI needs | avoid building loan math twice; REST adapter isolates us |
| 003 | DB-backed workflow engine (no external BPM) | Camunda 8 production = paid license; our flows are state+timers; Flowable escape hatch |
| 004 | Transactional outbox in Postgres (no Kafka day one) | reliability without ops burden; bridge-ready |
| 005 | Keycloak 26 OIDC, realm per bank | EOL gap closed; roles map to prototype personas |
| 006 | MinIO for documents; metadata in our DB | AES-256, checksums, virus-scan hook (06) |
| 007 | Extraction criteria for future services | stated upfront: independent scaling OR release cadence OR security domain |
| 008 | Reporting reads from read-replica / operational snapshot | keep OLTP clean; CL reports are batch anyway |
| 009 | Product families are configuration, not code (Islamic Murabaha, Krishi, floating BLR, LTV, watchlist per 03 §Product & Variant Coverage) | new bank product must launch via config + report template only; needing code = design defect |

## 5. Request & Data Flows (three representative journeys)

**A. Application submit (wizard):** React (RHF+Zod) → `POST /origination/applications`
(idempotency key) → tx: save application + emit `ApplicationSubmitted` (outbox)
→ workflow engine starts ladder instance → dispatcher notifies SMS adapter →
officer sees it in pipeline (SignalR-free: 30s poll + optimistic UI).

**B. Nightly BRPD EOD (02:30, ShedLock):** load open loans → compute DPD per
Fineract schedule data (via adapter read model) → stage transitions +
provision deltas in one tx per account → `ClassificationMigrated` events →
interest-suspense flags ≥SS → GL JV rows queued for Fineract posting →
compliance pack refresh.

**C. Payment via rail callback:** bKash/Nagad webhook (signed) → verify + map to
loan → `POST /servicing/payments` with idempotent external ref → Fineract
transaction via adapter → receipt event → SMS confirmation.

## 6. Cross-cutting Concerns (owned where)

| Concern | Owner module | Mechanism |
|---|---|---|
| AuthN/AuthZ | api-web | Keycloak JWT; method security per role/branch scope |
| Audit trail | mod-platform | append-only table + hash chain + WORM export (06) |
| Idempotency | api-web | `Idempotency-Key` header store |
| Money & dates | mod-servicing | BDT minor-unit longs; Asia/Dhaka; BB holiday calendar table |
| i18n | frontend + api errors | RFC-cased codes; `Accept-Language` respected for error payloads |
| Feature flags | mod-platform | DB config, cached; used for live connectors & phased rollout |
| Observability | all | Micrometer metrics, structured logs, trace ids in every response header |

## 7. Quality Attributes (targets)

- Availability (banking hours): ≥99.5% pilot, ≥99.9% GA
- p95 API latency: ≤400ms reads, ≤800ms writes (excl. external connectors)
- EOD batch: ≤30 min for 500k loans
- RPO ≤15min (WAL shipping), RTO ≤4h (10 defines drills)
- Security: OWASP ASVS L2; BB ICT V4.0 mapping matrix (06)

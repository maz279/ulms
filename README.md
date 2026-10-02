# ULMS v2.0 — Production Codebase

**Product:** Unisoft Loan Management System for Bangladesh scheduled banks
**Phase:** P3 — Servicing & Collections COMPLETE (Gate G3) per `PLANNING/00`
**Stack:** Fineract CE · Java 21 + Spring Boot 4 (modular monolith) · PostgreSQL 17 ·
Keycloak 26 · React 19 + TS + Vite 7 + MUI v7 · Docker Compose → k3s

---

## Layout (per `PLANNING/02`)

```
LMS_CODEBASE/
├── PLANNING/               # 14-doc build plan (READ FIRST — authority for this repo)
├── apps/
│   ├── api/                # Spring Boot 4 modular monolith (9 modules per PLANNING/03)
│   └── web/                # React 19 staff app (Vite + MUI v7)
├── packages/
│   └── openapi/            # ulms-api.yaml — API source of truth (PLANNING/05)
├── deploy/
│   ├── compose/            # full local stack: one command (PLANNING/02 §5)
│   └── seed/               # Keycloak realm + synthetic data seeds
├── docs/
│   └── adr/                # ADR-001..004 (P0) per PLANNING/01 §4
├── e2e/                    # Playwright walking-skeleton spec (G0 evidence)
├── .gitlab-ci.yml          # pipeline per PLANNING/02 §4
├── Makefile                # make up | make seed | make test | make e2e
└── README.md               # this file
```

## Quick Start (local)

Prereqs: Docker (+compose plugin), JDK 21 (to run the API outside Docker),
Node 20+ (web dev), and ports 8080-8090 free.

### UI-first mode — no Docker/JDK needed (2026-10-01)

`apps/web` now ships a **mock API** that answers the same OpenAPI contract from
a seeded in-memory DB (`apps/web/scripts/mockApi/` — SQL-seed anchors
LN-300001..7 + the validated prototype demo dataset). The full staff app,
every journey and the whole Playwright suite (except the two token-gated
Keycloak legs) run against it:

```bash
cd apps/web
npm run mock:api     # optional: also serves http://localhost:8081 for API-leg specs
npm run dev          # http://localhost:5173  (mock middleware is default-on)
```

- `VITE_USE_MOCK_API=0 npm run dev` → proxies `/api` to the real compose stack.
- The mock encodes the business rules (server DBR/scoring, 7-level ladder,
  dual-auth 409s, BRPD EOD + provision oracle, PTP masking, HMAC webhooks,
  maker-checker sign-off chain) so UI work and e2e stay contract-true.

```bash
# 1) full stack (Postgres, Keycloak, Fineract, MinIO, API, Web, Prometheus, Grafana)
cd deploy/compose && docker compose up -d

# 2) seed realm + synthetic data (idempotent)
make seed

# 3) verify the walking skeleton (G0 slice)
#    a) obtain a token (DEV ONLY client; credentials from environment — never hardcoded)
export KEYCLOAK_PASSWORD="${KEYCLOAK_PASSWORD:?set from your secret store}"
curl -s http://localhost:8081/actuator/health            # {"status":"UP"}
curl -s -X POST http://localhost:8081/api/v1/customers \
  -H "Authorization: Bearer $TOKEN" -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"nameEn":"Md. Rafiqul Islam","nameBn":"মোঃ রফিকুল ইসলাম","segment":"RETAIL","mobile":"+8801712345678","branchCode":"BR-001"}'
#    b) audit row: psql ulms -c 'select count(*) from ulms.audit_entry'
#    c) web: http://localhost:5173 (login via Keycloak, create customer in UI)

# 4) gates
make test          # backend unit + module tests (Testcontainers; needs JDK21)
cd ../apps/web && npm ci && npm run test:unit && npm run build   # unit oracles + typecheck + production build
cd ../../e2e && npm ci && npx playwright test   # full journey suite (globalSetup resets the mock DBs — repeat-safe)
```

## Configuration & Secrets (rule: ENV ONLY)

Every credential is an environment variable supplied by `.env` (gitignored,
template provided) or the platform secret store — see `deploy/compose/.env.example`.
CI fails on any credential literal (gitleaks). Never commit real values.

## Authority & Change Control

Build truth = `PLANNING/` suite · UX truth = `../../Front_end` prototype ·
Stack truth = `../../Technology_Stack_Recommendation_v3.md`.
ADRs live in `docs/adr/`; architectural changes require an ADR + lead review.

## Status

- [x] P0.1 repo + CI skeleton + tooling (this commit)
- [x] P0.2 compose stack + seeded realm/data
- [x] P0.3 walking skeleton: login → POST /customers → Fineract → audit → metric
- [x] P0.4 ADR-001..004
- [x] P0.5 Playwright skeleton
- [x] G0 sign-off (28+ tests green in Docker harness, live stack verified)
- [x] P1 Origination Core — **G1 CLOSED** (2026-09-28):
  - Customer 360 (GET /customers/{idOrCif} aggregate), NID e-KYC mock with
    kyc_check history + officer fallback, screening hook (sanctions/PEP)
  - Wizard → server draft (POST + PATCH autosave, 30s cadence) → submit
    (DBR ≤50% gate) → 7-level ladder with maker-checker → Fineract loan on
    approval; documents to object storage with sha256 + virus-scan hook
    (CLEAN/INFECTED quarantine) + idempotent (type,sha256) uploads
  - Idempotency-Key replay store (48h), RFC 9457 error model with stable
    codes (`docs/errors.md`), {data,meta} list envelope, ?stage/&branch filters
  - Method security: role-gated mutating routes + ladder-level check on
    approvals (realm roles per 06 §1); audit actor = JWT sub
  - Daily audit WORM anchor export to object storage (06 §3)
  - Backend tests 28+ green (Testcontainers PG17); web build green (Zod
    validation parity); OpenAPI v1.1 in sync; live stack verified end-to-end
- [ ] P2 Credit & approval (G2): CIB connector, scoring/DBR service,
      disbursement dual-auth, BRPD EOD batch + classification board
- [x] P2 Credit & Approval — **G2 CLOSED** (2026-09-29):
  - CIB connector (11 §1): CibPort + deterministic mock adapter emitting the
    fixed-width bank layout; PURE parser golden-tested (valid/malformed→
    quarantine/partial→TRLR mismatch fails loudly); pulls dedupe by
    (cif, period, file); every pull audited
  - Assessment (03): server-side DBR (income + bureau installments + EMI
    oracle in platform MoneyMath) + versioned scorecard v2 (grade A–D,
    AUTO_PASS/REFER/AUTO_DECLINE with DBR>50 override); collateral registry
  - 9-stage machine wired: submit → CIB_PULL → SCORING (auto-decline rolls
    back with score persisted) → CPV officer gate → ladder → SANCTION
  - Disbursement dual-auth: prepare(A)→authorize(B≠A, 409 on same actor)→
    release(C∉{A,B}) with immutable dual_authorization trail; Fineract
    approve+disburse (major units, container clock); ULMS loan mirror;
    BFIU STR alert ≥ ৳10L; ArchUnit rule blocks controller bypasses
  - BRPD 15/2024 engine (03): decision table ±1 at every boundary, interest
    suspense SS+, provisions in bp, EOD idempotent per run-date with rerun,
    nightly 23:30 + operator trigger, classification board + shared
    provision-calculator oracle (frontend parity)
  - Web: CIB viewer + score chips in pipeline detail, CPV pass/fail actions,
    disbursement stepper, classification board page w/ 7-class cards
  - Backend 70 tests green; web build green; OpenAPI v1.2; demo 7-class
    loan portfolio seed
- [ ] P3 Servicing & collections (G3): payments + rails, schedules/statements,
      collections workbench + PTP, full E2E
- [x] P3 Servicing & Collections — **G3 CLOSED** (2026-09-29):
  - Payments (03 mod-servicing): counter posting idempotent by externalRef;
    Fineract repayment (command=repayment, major units) + loan-mirror update
    in one tx (outstanding, DPD heuristic, close-at-zero)
  - Rails (11 §3): PaymentRailPort + sandbox adapter (redirect model — no
    card data); HMAC-SHA256 webhooks over `timestamp.body` with ±5-min
    window, **idempotent by UTR** (10-callback storm → exactly one posting +
    9 replays), unsigned → 401, stale → 403, secret absent → 503 fail-closed
  - Schedules/statements: amortization derived from the shared EMI oracle
    (Σprincipal = principal tested); statement pages in JSON and byte-parity
    CSV (generation audited); settle-quote policy oracle (2% lock-in penalty,
    50% unearned-interest rebate, 7-day validity); reschedule requests with
    officer decision regenerating the schedule tenor
  - Collections (03 mod-collections): DPD worklist with P1/P2/P3 priority
    (broken-PTP propensity boost), dunning actions (call/sms/visit/notice),
    PTP contextual form with kept/broken state machine + payment evidence,
    field tasks with server-wins sync + append-only evidence; PTP phone
    masked in every projection and audit (06 §5)
  - Portal thin slice (08 B1 W10): mobile login → balance/EMI cards (shared
    mobiles resolve to the loan holder), application tracker (same workflow
    projection — no second truth), payment initiation → rail redirect
  - Tax certificates per year/cif; recon run vs bank settlement lines with
    RECON_MISMATCH alerts
  - Web: LoanDetailPage (schedule/statement/payments/quote), CollectionsPage
    (worklist + PTP dialog), PortalPage; 6-tab nav; /hooks dev proxy
  - Backend 82 tests green; web build green; OpenAPI v1.4; e2e 11/11
    (incl. live webhook-auth rejection through the browser)
- [ ] P4 Compliance & reporting (G4): CL-1..5 report pack, regcon calendar,
      regulatory dashboard, IFRS-9 runway fields
- [x] P4 Compliance & Reporting — **G4 BUILT** (2026-09-30, sign-off pending
      evidence review; recorded 2026-10-01 from code+docs audit):
  - Regcon returns pack (RegconController): 12-return catalog with WORM
    staging + sha256, preparer→checker→compliance sign-off chain (distinct
    officers enforced), submission calendar, file download
  - EOD provision JV to the Fineract GL (zero-sum, idempotent per run-date);
    ECL 3-stage engine + snapshots (EclModel, ecl_snapshot); Basel CAR inputs;
    reporting read model + writer slice (ReportDefinition)
  - OpenAPI v1.5.2 (redocly-verified: 73 path items / 88 operations /
    44 schemas — 100% controller coverage; machine-parsable since the R1c
    fix); V10/V11 migrations; e2e p4-regcon suite (5 journeys)
- [x] P5 Hardening — **BUILT** (2026-09-30; see docs/g5-evidence/): i18n
  separation suite (EN zero-Bengali invariant), prototype parity pass,
  backup-restore + migration-rehearsal + EOD-rerun + secret-rotation +
  release-rollback drills, runbooks RB-01..RB-10, web prototype-parity
  rebuild (shell + 31 modules + 166 screens, mock-API dev mode in
  apps/web/scripts/mockApi)
- [ ] G5 bank-side items open: UAT sign-off letter, external pen-test,
      bank-hosted monitoring dashboards, MDM mobile distribution, training
- [ ] P6 Deployment (R8 plan): k3s + Helm + strict CI gates + observability
- [ ] P7 Pilot & productization (R9 plan)
- [x] CI-parity verification (2026-10-02): full Java suite + chart verified
  in Docker on dev machine (gradle:8-jdk21 + docker.sock → Testcontainers
  Postgres 17). `compileJava` ✅, `test` **112/112 green, 0 skipped, 26
  suites** ✅, `helm lint`/`helm template` ✅. Fixes landed: 9 compile
  errors across the R3–R7 adapters/entities; V12 migration rewritten
  (sanction_letter ALTER path, PG partial-unique index, element-collection
  table alignment); BOCC JPA duplicate-mapping; outbox JSONB binding +
  markDispatched query + Modulith NamedInterface; Boot-4 ObjectMapper
  ownership; V13 loan.stage VARCHAR(16) ('WRITTEN_OFF' overflow); Helm
  brace typo + Prometheus-rule escaping + PrometheusRule CRD wrapper.
  Open: guarantor/str_report Java services (V12 tables are forward schema).
- [x] Audit round 2 (2026-10-02): re-audit of the verification pass found 9
  defects, all fixed — Gradle wrapper was missing (CI jobs ran `./gradlew`
  against nothing; generated + proven in the CI image); live/mock adapter
  pairs double-registered beans on profile flips (guards +
  LiveProfileFlipTest); the CIB retry matrix was dead code (private
  self-invoked @Retry, no weaver — moved to the proxied entry point,
  aspectjweaver added, WireMock contract test pins 200+cache / 429-once /
  5xx×4 / flaky-recover); `aml` Java module closes the guarantor/STR gap
  (entities+service+controller+tests per V12 + OpenAPI); mock product-create
  aligned to the live-version rule + OpenAPI 409; CIB mTLS env documented
  (compose example + helm secret-gated); SanctionLetter JPA constraint
  cleanup; e2e had 5 retry-masked deterministic failures (web
  COLLECTIONS_WRITE missing `compliance` vs Java controller, MUI-select
  spec driving, about:blank evaluate, Typography locator, stale servers).
  Gates: Java **120/120** (29 suites), web unit 32/32, tsc, build, redocly,
  helm lint+template, e2e **35/2skip/0fail/0flaky, retries disabled**.
- Remaining-production plan of record: `../../audit/plan/` (R1–R9)

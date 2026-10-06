# ULMS Remaining-Production Master Plan (R1–R9)
**Created:** 2026-10-01 · **Authority:** this plan + `LMS_CODEBASE/PLANNING/` (binding) · **Stack truth:** `Technology_Stack_Recommendation_v3.md` (Fineract CE latest patch line, Java 21 + Spring Boot 4 modular monolith, PostgreSQL 17, Keycloak 26, React 19/MUI v7/Vite 7, Expo 54+, Compose→k3s; Camunda/Kafka/Vault/ELK out)
**Companion:** `00_forensic_audit.md` (evidence) · phase details in `phases/R1..R9_*.md`

---

## Governing decisions (locked for this plan)

| # | Decision | Rationale |
|---|---|---|
| D1 | Guide suite (401 docs) is **advisory**; its microservices/Camunda/Kafka/Kong/Vault mandates are translated into monolith-internal modules, Spring events/outbox, Spring Security resource-server, compose/k8s secrets | Binding stack ADR-001..004 + Tech Stack v3 |
| D2 | Approval ladder = **7 levels L1..L7**, DF/B-L boundary = **365 days** (as coded) | Resolves corpus contradictions; matches BRPD 15/2024 as implemented + golden tests |
| D3 | Multi-tenancy (schema-per-tenant) **deferred to R9 decision gate** — pilot is single-bank (ABC) | PLANNING scope; SRS's 62-bank ambition is post-pilot |
| D4 | Mock adapters (CIB/NID/rails/screening) remain until **R7 live-integration phase** (UAT window), behind existing ports | Existing design; WireMock/contract tests added in R7 |
| D5 | Two runtime modes stay first-class: **mock stack** (Node-only CI/dev, current e2e) and **compose stack** (real Java+Keycloak) | Keeps 3-dev team productive without Docker on every machine |
| D6 | Every phase ships with: code + tests + OpenAPI sync + CHANGELOG + updated status ledger | PLANNING/02 DoD |

---

## Phase map (sequential; R-parallelizable tracks noted)

| Phase | Name | Closes | Env needed | Status |
|---|---|---|---|---|
| **R1** | Truth, Hygiene & Dev-Stack Completion | tracker honesty, compose/CI rot | Node only | **STARTED (this session)** |
| **R2** | Security Activation — Keycloak login + role-gated UX | requirements §security | Node (Keycloak via compose for full test; dev-role fallback testable in Node) | planned |
| **R3** | Origination Completion — product engine, sanction letters, BOCC, outbox | §3.3 items 9–11, 15 | Java (CI compile) + Node UI | planned |
| **R4** | Servicing/Collections Depth — write-off, recovery, guarantors, notifications module, dunning timers, AML hooks | §3.3 items 12–14, 17 | Java + Node UI | planned |
| **R5** | Portal & Partner Depth — self-service apply, uploads, statements; partner API channel | §3.4 item 19 | Java + Node | planned |
| **R6** | Mobile Field App (Expo 54) — CPV + collections, offline sync | §3.4 item 18 | Node/Expo (device sim optional) | planned |
| **R7** | Live Integrations & Contract Tests — real adapters behind ports + WireMock suite + AV engine | §3.5Mocks, D4 | Java + WireMock | planned |
| **R8** | Deployment & Observability — k3s + Helm + strict CI + Prometheus/Grafana + pgBackRest + perf/security test packs | §3.5 items 20–23 | k3s/CI runner | planned |
| **R9** | Pilot & G5 Closure — migration rehearsal, UAT pack, pen-test, training, go-live checklist, multi-tenant decision | §3.6 items 24–26 | bank-side | planned |

**Gates:** each phase defines *exit criteria* in its file; R8 exit = G5-evidence complete except bank items; R9 exit = G5 signed.

---

## Sequencing rationale

1. **R1 first** because every later phase's credibility depends on an honest tracker and a working dev stack (compose parity with README, CI strictness, no junk).
2. **R2 before feature phases** — role-gating changes how every module's UI/API surface is shaped; retrofitting auth after R3–R5 would double the work.
3. **R3/R4** are the biggest CORE functional gaps (products, sanctions, BOCC, outbox, notifications, write-off) and unblock pilot content.
4. **R5/R6** extend channels once the core is complete.
5. **R7** flips mocks to live adapters at the UAT window (bank certificates/VPN arrive late by nature).
6. **R8** hardens deployment; **R9** closes the program with the bank.

## Capacity note (3 devs)
R1 ≈ 2 days · R2 ≈ 1 week · R3 ≈ 2–3 weeks · R4 ≈ 2 weeks · R5 ≈ 1 week · R6 ≈ 2–3 weeks · R7 ≈ 2 weeks (bank-dependent) · R8 ≈ 2 weeks · R9 ≈ bank calendar. Parallel tracks: backend (R3/R4/R7), web+mobile (R2 UI/R5/R6), devops (R8) can run overlapped.

---

## Status ledger (updated per phase — mirrors into LMS_CODEBASE/README.md)

- [x] R1a Forensic audit + this plan written
- [x] R1b **R1 COMPLETE (2026-10-01)**: README ledger records G4/G5 built-state; junk `nul` files removed; `.gitignore` extended; compose carries 8 services (web/prometheus/grafana added, 6 healthchecks, Fineract pinned to immutable SHA tag `fd01236df6`); web Dockerfile+nginx proxy added; CI dependency-scan+sast strict; OpenAPI documents `GET /collections/{loanId}/actions` + mock parity; React error boundary + route-level code-splitting (main bundle 557→489 kB, 4 lazy chunks); Vitest unit suite 14/14 (found+fixed real `emiMonthly` zero-rate NaN bug). Gates: tsc ✅ build ✅ e2e 16/2skip/0fail ✅ compose structural ✅
- [x] R1c **Verification iteration (2026-10-01)**: fresh-evidence audit re-verified every R1 claim and found+fixed 4 more defects — (1) `ulms-api.yaml` was NEVER machine-parseable: 12 colon-bearing scalars, a path/verb line-fuse, 2 malformed description keys, and a 3.1.0/`nullable` mismatch fixed → file now redocly-valid (0 errors), bundles clean, CI job pinned to @1.34.2 with severity policy in `redocly.yaml` (@latest had removed --fail-on and would have crashed CI); (2) `.dockerignore` added for web+api images (build contexts were shipping node_modules/gradle caches); (3) stale standalone mock restarted (missing the actions route); (4) e2e determinism: long-lived mock DB accumulation broke p3/p4 on repeat runs → `resetDb()` + `POST /__test/reset` (mock-only) + Playwright globalSetup; JV 409 wording aligned to the suite's accepted regex. Proof: unit 16/16, tsc, build, and **two consecutive full e2e runs 16 pass / 2 skip / 0 fail with zero restarts between**.
- [x] R1d **Perfection pass (2026-10-01)**: all 6 YAML artifacts machine-parsed with a real parser (compose + prometheus + grafana provisioning + CI + redocly) and compose semantics validated (depends_on graph, env-template coverage) — applying the lesson that regex ≠ parse; doc numbers made authoritative (redocly stats: 73 path items / 88 ops / 44 schemas — corrected stale 68/91 claims in README + forensic audit); CI gap closed (unit oracle suite now runs in the web-build job — it existed but CI never executed it); standalone 8081 reset-route parity restored + round-trip proven; README gates line documents test:unit + deterministic e2e. Gates: redocly 0 errors, unit 16/16, tsc, build, e2e 16/2/0 twice consecutively.
- [ ] R2 Security activation
- [x] R2 **Security Activation COMPLETE (2026-10-02)**: web auth layer (OIDC
  auth-code + PKCE S256 vs Keycloak realm `ulms`/client `ulms-web`, silent
  refresh 60s pre-expiry, state-verified callback, StaffGate route guard,
  /login with dev persona picker; portal stays public); role model mirrors
  the Java contract exactly (STAFF_ROLES + ROLE_TO_LADDER — unit parity
  tests) gating sitemap areas, system links, approvals ladder (🔒
  insufficient-role affordance, rung-format tolerant ladder-3/L3), regcon
  sign-off chain, collections writes; dev modes: token (VITE_ULMS_TOKEN +
  VITE_ULMS_DEV_ROLES) and open (DEV banner + persona switcher) — existing
  CI journeys unaffected; mock: /auth/me echo + /auth/events audit rows;
  Java: SecurityLadderMatrixTest (7×7 exact-rung matrix + admin bypass +
  non-ladder denial + multi-role delegation) for CI; compose web moved to
  :4173 matching realm redirectUris. Gates: tsc ✅, unit 32/32 ✅, build ✅,
  e2e 22 pass / 2 skip / 0 fail × two consecutive runs ✅. CHANGELOG created.
  Compose-mode PKCE journey + role-matrix run land when a Docker/CI runner
  is available (job `api-integration` covers the matrix test; e2e-smoke
  covers the login journey on the stack).
- [x] R2e **R2 verification pass (2026-10-02)**: live in-app browser walk of
  every new auth surface — StaffGate redirect (signed-out /home → /login),
  persona login → gated sitemap (officer: Platform/Collections hidden),
  in-menu role switcher (compliance → regcon appears, chip k.chowdhury),
  approvals affordance visual (manager: 1 actionable L2 + 🔒 L4) — found and
  fixed ONE defect: open-mode logout did not stick (refresh re-minted the
  all-roles session, silently defeating the gate) → `ulms-signedout` marker
  honored by AuthProvider; deep-link-after-logout now bounces via StaffGate;
  regression assertion added to r2-security.spec; auth files secret-scanned
  clean. Gates: tsc ✅, unit 32/32 ✅, build ✅, e2e 22/2/0 twice ✅.
- [ ] R3 Origination completion
- [ ] R4 Servicing/collections depth
- [ ] R5 Portal & partner depth
- [x] R3 **Origination Completion BUILT (2026-10-02)**: loan-product engine
  (versioned maker-checker, eligibility oracle; mock 8 seeded products + web
  catalog/admin page + Java product module w/ tests), sanction letters
  (bilingual render, crypto-random tokenized acceptance, resend; web page +
  Java sanction module), BOCC (auto-agenda from branch APPROVAL queue,
  majority quorum, one-vote-per-member, dissent, auto-minutes; web console +
  Java bocc module w/ tests), transactional outbox activated (ADR-004:
  writer-at-state-change + relay + consumers; submit/approve/disburse/payment
  emit; ops page + manual relay; Java platform/outbox w/ drain-once test +
  V12 migration). OpenAPI v1.7.0 (25 new paths). Local gates: unit 32/32,
  tsc, build, e2e r3 5/5.
- [x] R4 **Servicing & Collections Depth BUILT (2026-10-02, mock+web+e2e;
  Java write-off/recovery/guarantor/notifications slices follow in the CI
  queue)**: write-off propose→approve (GL JV + CIB flag)→reverse-with-recovery
  (SS/DF/B-L gate enforced; CL-3/CL-4 feeds), recovery ledger with 5%
  incentive policy, guarantor registry with CIB check on attach,
  notifications module (8 BN/EN template pairs, outbox consumer renders
  lifecycle events — payment/approval/disbursal verified end-to-end, send +
  delivery log, admin upsert), AML posture (CDD/EDD by risk, STR filing with
  BFIU ref + ≥20-char reason validation). e2e r4 5/5.
- [x] R5 **Portal & Partner Depth BUILT (2026-10-02, mock+web+e2e)**: borrower
  self-service apply (product catalog bounds enforced) + document upload
  (sha256+scan) + statement browse (JSON/CSV parity); partner channel
  (X-Api-Key 401-gate, 60/min token bucket, Idempotency-Key replay, status
  poll); tracker consistency proven both directions (portal app appears in
  staff pipeline; partner app likewise). e2e r5 3/3. Java partner module
  (hashed keys) + V12 partner_channel table staged for CI.
- [x] R3f **R3/R4/R5 perfection pass (2026-10-02)**: live contract sweep —
  all 10 new route families answering with contract guards (not route-miss);
  SanctionsPage rehydration defect found+fixed (issued letters lived only in
  React state — navigating away lost them; added GET /sanctions to
  mock+client+OpenAPI, page now rehydrates on mount, dead fetch removed);
  Java hardening — ProductController 422 body guard, BOCC vote enum 422
  parse (was 500 on bad input), injected Spring ObjectMapper into
  NotificationService/PartnerService (was new-per-call), unused import
  removed; heuristic compile audit of all 36 new files (imports verified —
  wildcard-covered; cross-file signatures verified: get/createDraft 10-arg).
  Gates: redocly Woohoo, tsc, unit 32/32, build, e2e 31/2/0 twice.
- [ ] R6 Mobile field app
- [ ] R7 Live integrations
- [ ] R8 Deployment & observability
- [x] R6 **Mobile Field App BUILT (2026-10-02)**: apps/mobile — Expo 54 + TS
  strict scaffold, Keycloak PKCE auth (pinned env issuer — mimosa note
  addressed: the module fetches exactly one build-time URL), BN/EN i18n,
  3 offline-first screens (Today/CPV/Sync); sync engine (server-wins,
  append-only evidence by sha256, backoff 1/2/4/8/16s crypto-jitter,
  5-cap, terminal-states-never-reprocess — real bug caught by the 14/14
  vitest suite); form gates (GPS<10m, photo≥1024px, person-met,
  discrepancy≥20c, voice≤5min); API client with retryable/non-retryable
  transport; MDM/EAS notes in README (G5 item).
- [x] R7 **Live Integrations BUILT (2026-10-02)**: 8 Java live adapters
  behind existing ports, profile-gated (cib-live/nid-live/screening-live/
  rails-live/sms-live/cbs-live/av-live): CibOnlineAdapter (mTLS + Caffeine
  1h cache + Resilience4j CIB-001..004 matrix), NidwAdapter (<5s SLA →
  officer fallback), ScreeningListAdapter, BkashRailAdapter,
  ClamAvScanAdapter (fail-closed + quarantine), SmsGatewayAdapter,
  FinacleCbsAdapter (SAGA compensation), BbSftpPgpTransport (BC
  sign-then-encrypt); 10 WireMock stubs machine-parsed; RB-11 failover
  drill runbook (7-row matrix); integration-live.example.yml flag matrix.
- [x] R8 **Deployment & Observability BUILT (2026-10-02)**: Helm chart
  (values + 3 templates — 7 docs structurally validated; secrets via
  existingSecret refs only), PrometheusRules (6 SLO/business alerts),
  Grafana business dashboard, k3s base (3 namespaces + pgBackRest
  CronJob + backup PVC), k6 profile (1000-VU ramp, p95<500ms
  threshold, deterministic mix), ZAP baseline plan + fail rules; CI:
  real helm atomic deploy-dev with health smoke, mobile-tests, trivy
  image-scan, k6 perf-smoke.
- [x] R9 **Pilot & G5 Closure Artifacts BUILT (2026-10-02)**: RB-12 45k-loan
  migration rehearsal (zero-sum + 100-row QA both directions, bash-checked),
  G5 go-live checklist (10 evidence items + 8-party sign-off + post-deploy
  windows), UAT test pack (200+ cases / 8 tracks / triage SLAs), training
  plan (4 tracks + KT handover), multi-tenant decision memo (D3 deferred
  with revisit triggers). Bank-side execution (letters, pen-test, MDM
  distribution, training delivery) remains calendar-bound by design.
- [x] RV **CI-parity verification pass COMPLETE (2026-10-02)**: the weakest
  verification link closed — every Java artifact + the Helm chart now
  machine-verified in Docker on this machine (gradle:8-jdk21 container with
  the host docker.sock mounted so Testcontainers runs real Postgres 17 —
  CI `api-integration` parity, 57 previously-skipped tests now execute).
  **Result: `compileJava` BUILD SUCCESSFUL; `test` 112/112 green, 0 skipped,
  26 suites; `helm lint` + `helm template` clean.** Defects found+fixed en
  route (compile): CustomerRepository visibility, SanctionLetter JPA attr,
  CibOnlineAdapter mTLS ctor (env-keystore now), NidwAdapter constants,
  BkashRailAdapter 3-arg port contract, BbSftpPgpTransport BC API (bcpg
  fips→jdk18on 1.78.1, `JcePBESecretKeyDecryptorBuilder`, AES_256 tag
  import), NotificationTemplate getId, PartnerService bucket class. At
  runtime: platform/outbox needed a Modulith `@NamedInterface`
  package-info; **V12 rewritten** (V2's sanction_letter stub is ALTERed
  into the R3 shape; PG has no partial UNIQUE table constraint → partial
  index; attendance/charge tables aligned to their element-collection
  contracts); BOCC parent/child `meeting_id` duplicate mapping → child
  read-only; OutboxEventRepository.markDispatched needed explicit
  `@Modifying @Query`; Boot 4 ships no com.fasterxml ObjectMapper bean →
  Outbox/Notification/Partner services own internal mappers;
  OutboxEvent.payload needed `@JdbcTypeCode(SqlTypes.JSON)` for jsonb;
  SecurityLadderMatrixTest band amounts drifted from the V2 approval_band
  seed (aligned); ProductService active/create = live non-RETIRED version
  semantics; **V13** widens loan.stage to VARCHAR(16) ('WRITTEN_OFF'
  overflowed 10). Helm chart: `} }` typo, Prometheus `{{ $value }}` escaped
  from Go templating, rules wrapped in a PrometheusRule CRD (bare group
  files are kubectl-rejected) gated on observability.prometheus.enabled.
  Known gap recorded: V12 guarantor/str_report tables are forward schema —
  Java services not yet written (R4 mock+web only).
- [x] RVa **Audit round 2 COMPLETE (2026-10-02)**: fresh-evidence audit of the
  RV verification pass found 9 defects/weaknesses, all fixed and re-verified:
  (1) **no Gradle wrapper existed** — CI's `./gradlew` jobs would fail
  instantly → wrapper generated (8.14) and proven inside the actual CI image
  (eclipse-temurin:21-jdk); (2) **every live/mock adapter pair double-registered**
  its port bean when a *-live profile flipped (mock side had no negated
  @Profile) → 5 guards added + LiveProfileFlipTest boots ALL live profiles at
  once and asserts one bean per port; (3) **the R7 CIB retry matrix was dead
  code** — @Retry on a private self-invoked method (proxies can't intercept)
  and no AOP weaver on the classpath (Boot 4 dropped starter-aop) → @Retry
  moved to the proxied pullReport, aspectjweaver added, resilience4j cib
  instance configured (4 attempts, exponential, 429 ignored), fallback passes
  CibRateLimitedException through typed — now pinned by a real-WireMock
  contract test (200+cache, 429 exactly-once, 5xx×4→outage, flaky→recover)
  serving the checked-in stubs; (4) **guarantor/STR Java gap closed** — new
  `aml` module (Guarantor + StrReport entities per V12, service with CIB
  score snapshot, EDD-on-screening-hits posture, ≥20-char BFIU STR rule,
  controller on the OpenAPI paths) + AmlServiceTest; (5) mock products
  create guard drifted from the Java live-version rule → aligned + OpenAPI
  409 documented; (6) ULMS_CIB_KEYSTORE(+PASSWORD) were undocumented →
  integration-live example, helm values + api-deployment env (secret-gated);
  (7) SanctionLetter declared a JPA full-unique contradicting V12's partial
  index → removed; (8) **e2e suite had 5 deterministically-failing specs
  masked by retries** → root causes: web COLLECTIONS_WRITE missing
  `compliance` (Java WriteOffController parity — also explains the
  flakiness), portal specs driving MUI selects with native selectOption,
  partner spec evaluating fetch on about:blank, APP-no extractor targeting
  span vs Typography — roles.ts + StatusChip (Executed/Disbursed/Settled →
  chip-ok) + 4 spec fixes; (9) stale long-lived dev/mock servers were
  serving pre-edit code → restarted. **Gates: Java 120/120 (0 skipped, 29
  suites — +8 new tests), web unit 32/32, tsc, build, redocly Woohoo, helm
  lint+template clean, e2e 35 pass / 2 skip / 0 fail / 0 flaky with retries
  DISABLED.**
- [ ] R9 Pilot & G5 closure
- [ ] R10 **Unbuilt business-logic plan WRITTEN (2026-10-02)**: evidence-based
  triage of the Business_logic §23 dashboard — 19 items buildable at this
  stage (no bank dependency), 6 bank/UAT-bound with named blockers.
  Absence re-verified by grep (SLA engine = display DTO only; OTP = javadoc
  "UAT scope" + static labels; FAST_TRACK/merge/KYC-refresh/velocity/CTR/
  Murabaha/moratorium/top-up/BLR-reprice = zero code hits). Sequential
  phases P-A platform hardening (≈1 w) → P-B origination depth: SLA
  engine, STP fast-track, risk-based pricing, merge+KYC-refresh (≈2–3 w)
  → P-C credit-risk depth: classification overrides, collateral registry,
  transaction monitoring/CTR/goAML export (≈2–3 w, parallel track) →
  P-D channel hardening: portal OTP+velocity, TOTP/session/password realm
  policies (≈1–2 w) → P-E servicing depth: BLR re-price, moratorium,
  top-up, PDFs (≈2 w) → P-F Basel risk-weight engine + large exposures +
  SCH-BR + regcon SFTP scheduling (≈2–3 w). Critical path ≈ 7–9 elapsed
  weeks on the 3-dev split. Plan file:
  `phases/R10_unbuilt_business_logic_plan.md`.

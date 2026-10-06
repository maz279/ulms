# ULMS Changelog

All notable changes to the ULMS codebase. Format: Keep a Changelog; dates are ISO.

## [Unreleased]

### R10 — unbuilt business logic implemented (P-A…P-F, 2026-10-02)
- **Platform (P-A):** money-float ArchUnit rule; daily audit WORM-anchor
  export; CIB circuit-breaker activated; dunning ladder → config-driven
  6-step timers (SMS→CALL→VISIT→NOTICE→STRATEGY→NPA_RECOVERY); EMI D-3
  reminder job + SMS provider fallback chain.
- **Origination (P-B):** SLA engine (per-level policy table, 15-min scan,
  80% warning, breach audit, auto-escalate at SLA+50%); STP fast-track
  (grade tiers A→৳5 L / B→৳3 L, DBR ≤ 40%, 24-month relationship — submit
  rides an auto-approved L7 straight to SANCTION); risk-based pricing
  (grade premium rate card, snapshot on the application); customer
  merge-duplicate + risk-based KYC-refresh cycles (1/2/3 y).
- **Credit risk (P-C):** classification overrides in EOD (legal ≥ SS,
  bankruptcy → B/L, reschedule retention); collateral registry on the V5
  table (customer scope + FSV + status) with LTV gate and breach events;
  transaction monitoring — CTR rows at ≥ ৳10 L cash, VELOCITY and
  STRUCTURING alerts, goAML XML export; portal payment velocity limit.
- **Channel (P-D):** portal OTP (hashed codes, TTL, attempt cap,
  payment-confirmation token, otp-required flag); realm TOTP/session/
  password policies verified already enforced in the seed.
- **Servicing (P-E):** BLR reprice engine (floating loans re-price to
  BLR+spread with RATE_REPRICED notifications); moratorium interest
  capitalization; top-up combined exposure; tax-certificate PDF
  (openhtmltopdf).
- **Basel & regcon (P-F):** risk-weight engine (SS 150/DF 200/BL 250%,
  segment bases, CRM ≤ 50%), single-borrower 15% large-exposure check,
  SCH-BR-1..6 return renderers, nightly regcon transmission (PGP envelope
  when keys configured) + GL-count reconciliation alerts.
- **Fixes surfaced by the work:** scorecard grade bands recalibrated
  (760+ was unreachable dead code; now A≥680/B≥620/C≥540); STP gates
  re-anchored to grade tiers; mock OTP store resets with __test/reset.
- **Re-audit gap-closing (all phases):** customer merge-duplicate + risk
  endpoints, collateral registry endpoints (register + LTV verdict), Basel
  summary + regcon push ops endpoints, and the previously missing
  CustomerHygieneTest (merge idempotency/conflict + 1/2/3-y KYC cadence);
  OpenAPI extended by 6 paths (redocly valid); all 9 scheduled jobs and 6
  mock/live profile pairs verified. Final regression: **149 tests / 0
  failures / 38 suites (41m55s)**.
- **Servicing ops surface (P-E completion):** GET/POST /servicing/blr
  (admin), POST /servicing/loans/{id}/moratorium and /top-up with role
  gates + 422/409 guards; R10ServicingDepthTest pins the guards and a real
  openhtmltopdf %PDF render; OpenAPI paths added.
- **Tests:** 24 new R10 tests (oracles + integration); e2e portal journey
  covers OTP login; V14 migration (dunning_step, sla_policy, rate_card,
  customer risk/merge/KYC, loan override + floating/moratorium fields,
  collateral ALTER, ctr_report, monitoring_alert, otp_request, blr_rate,
  risk_weight, capital_base).

### Audit round 2 — verification pass re-audited; 9 defects found+fixed (2026-10-02)
- **Gradle wrapper generated** (`gradlew`, 8.14) and proven inside the CI
  image — the `api-compile-unit`/`api-integration` jobs ran `./gradlew`
  against a repo that had none.
- **Live/mock adapter bean conflicts fixed**: the five mock adapters gained
  `@Profile("!<live>")` guards — flipping any live flag used to register two
  beans of the same port and kill context startup. New `LiveProfileFlipTest`
  boots all live profiles together and asserts exactly one bean per port.
- **CIB retry matrix was dead code** (private self-invoked `@Retry`, no AOP
  weaver — Boot 4 dropped starter-aop): annotation moved to the proxied
  `pullReport`, `aspectjweaver` dependency added, `resilience4j` `cib`
  instance configured (1+3 attempts, exponential backoff, 429
  ignore-exceptions; fallback passes `CibRateLimitedException` through
  typed). New `CibOnlineAdapterWireMockTest` pins the contract over real
  HTTP: 200+1h-cache single wire, 429 exactly-once, 5xx burns 1+3 then
  outage-fallback, flaky 5xx recovers mid-ladder.
- **AML Java module added** (`com.uslbd.ulms.aml`): Guarantor registry
  (attach-time CIB CLEAR/REFER snapshot, BD-mobile validation, outbox event)
  + STR filing (≥20-char BFIU reason, BFIU-stamped ref, audit) + AML posture
  (CDD/EDD flips on screening hits) on the OpenAPI customer paths, with
  `AmlServiceTest` (3 journeys). Closes the V12 forward-schema gap.
- **Mock/OpenAPI parity**: products create now 409s on any live version
  (DRAFT or ACTIVE) matching the Java oracle; 409 response documented in the
  OpenAPI.
- **CIB mTLS env documented + chart-wired**: `ULMS_CIB_KEYSTORE(+_PASSWORD)`
  in the integration-live example, helm values and api-deployment env
  (secret-gated, only rendered when the live base URL is set).
- **Cleanup**: SanctionLetter's JPA full-unique constraint removed (V12 owns
  a partial unique index); unused `existsByCodeAndStatus` dropped.
- **e2e truth restored**: 5 specs failed deterministically but retries hid
  it. Fixed: web `COLLECTIONS_WRITE` now includes `compliance` (mirrors Java
  `WriteOffController`; also the root of the propose-button flakiness),
  StatusChip colors Executed/Disbursed/Settled green, portal specs drive MUI
  selects properly + exact label match + Typography-aware locator, partner
  spec navigates to a real origin before `page.evaluate` fetches, and the
  stale dev/mock servers were restarted.
- Gates: Java **120/120** (0 skipped, 29 suites), web unit 32/32, tsc,
  build, redocly valid, helm lint+template clean, e2e **35/2skip/0fail with
  retries disabled**.

### CI-parity verification pass — Java suite + Helm chart machine-verified (2026-10-02)
- **`gradle compileJava` BUILD SUCCESSFUL** in a gradle:8-jdk21 container
  (was 24 errors): repository visibility, JPA attribute names, CIB mTLS
  constructor (env-keystore load), NIDW result constants, BkashRail 3-arg
  port contract, BouncyCastle API fixes (bcpg-fips→bcpg-jdk18on 1.78.1;
  `JcePBESecretKeyDecryptorBuilder`; `SymmetricKeyAlgorithmTags.AES_256`),
  missing getter, rate-bucket class.
- **`gradle test` 112/112 green, 0 skipped, 26 suites** — Testcontainers
  Postgres 17 runs via host docker.sock mount inside the build container
  (CI api-integration parity; 57 previously-skipped tests now execute).
  Runtime defects found+fixed by the suite: platform/outbox Modulith
  `@NamedInterface`; **V12 rewritten** (V2's sanction_letter stub ALTERed
  into the R3 shape — partial UNIQUE is index-only in PG; attendance/
  charge tables aligned to their element-collection contracts); BOCC
  parent/child `meeting_id` duplicate mapping; `markDispatched` explicit
  `@Modifying @Query`; Boot-4 ObjectMapper ownership moved into
  Outbox/Notification/Partner services; `OutboxEvent.payload`
  `@JdbcTypeCode(SqlTypes.JSON)`; SecurityLadderMatrixTest band amounts
  realigned to the V2 approval_band seed; ProductService live-version
  semantics; **V13** widens loan.stage to VARCHAR(16) ('WRITTEN_OFF'
  overflowed the V5 width of 10).
- **`helm lint` + `helm template` clean**: `} }` brace typo in
  api-deployment.yaml; Prometheus `{{ $value }}` annotation templating
  escaped out of Go templating; rule groups wrapped in a PrometheusRule CRD
  (bare group files are rejected by kubectl) gated on
  `observability.prometheus.enabled`.
- Known gap recorded: V12 guarantor/str_report tables are forward schema —
  Java services still to be written (R4 delivered mock+web for those).

### R6–R9 — Mobile, live integrations, deployment, pilot closure (2026-10-02)
**R6 — Mobile Field App (apps/mobile)**
- Expo 54 scaffold (TS strict, Keycloak PKCE w/ pinned issuer from env —
  scanner note addressed), BN/EN i18n, offline-first screens (Today visits /
  CPV tasks with gated form / Sync console).
- Sync engine (pure TS, 14 vitest tests): server-wins merge, append-only
  evidence (sha256 dedupe), exponential backoff 1/2/4/8/16s with
  crypto-random jitter, 5-attempt cap, terminal states never reprocess
  (bug found+fixed by tests). Form validation: GPS<10m, photo≥1024px,
  person-met, discrepancy≥20 chars, voice≤5min.
- README documents EAS/MDM distribution (G5 item).

**R7 — Live Integrations**
- Java live adapters behind existing ports (profile-gated feature flags):
  CibOnlineAdapter (mTLS, Caffeine 1h cache, CIB-001..004 retry matrix via
  Resilience4j, 429 non-retryable, outage→RB-05 path), NidwAdapter (<5s SLA,
  error→officer fallback), ScreeningListAdapter (CSV list feeds, normalized
  matching), BkashRailAdapter (grant-token→create, retry ladder),
  ClamAvScanAdapter (fail-closed PENDING, quarantine),
  SmsGatewayAdapter, FinacleCbsAdapter (limit load + GL with SAGA
  compensation), BbSftpPgpTransport (BC sign-then-encrypt).
- 10 WireMock contract stubs (cib/nidw/bkash/sms/finacle — all
  machine-parsed) + RB-11 failover drill runbook (7-row matrix) +
  integration-live.example.yml config matrix.

**R8 — Deployment & Observability**
- Helm chart (Chart.yaml, values w/ existingSecret refs only, api/web
  deployments + services + ingress + NetworkPolicy templates — 7 template
  docs structurally validated), PrometheusRules (SLO alerts: 5xx>2%,
  p95>500ms, EOD-not-run, outbox backlog, webhook failures, SMA spike),
  business Grafana dashboard JSON, k3s base (namespaces + pgBackRest
  daily-full CronJob + 500Gi backup PVC), k6 load profile (ramp to 1000
  VU, p95<500 threshold, deterministic mix), ZAP baseline plan + rules.
- CI: real helm deploy-dev (atomic, post-deploy health smoke — replaces the
  R1 placeholder), mobile-tests job, trivy image-scan gate, k6 perf-smoke.

**R9 — Pilot & G5 Closure**
- RB-12 migration rehearsal script (45k loans + ~500k payments, zero-sum
  reconciliation + 100-row QA both directions; bash-syntax checked).
- G5 go-live checklist (10 evidence-linked items + 8-party sign-off +
  post-deploy windows), UAT test pack (200+ cases, 8 tracks, triage SLAs),
  training plan (4 tracks + KT handover), multi-tenant decision memo
  (D3 — defer with revisit triggers).
## [Unreleased]

### R3/R4/R5 — Origination completion, depth, portal & partner (2026-10-02)
**Added**
- OpenAPI v1.7.0: +25 paths — products (CRUD/activate/eligibility), sanction
  letters (generate/accept/resend), BOCC (schedule/attendance/vote/close),
  outbox (list/relay), write-offs (propose/approve/reverse), recoveries,
  guarantors, notifications (templates/outbox/send), AML/STR, portal apply/
  documents/statement, partner channel (intake/status). Redocly-valid.
- Mock (scripts/mockApi/r3r4r5.ts): full implementation of all 25 paths
  with business rules (BOCC quorum=majority, write-off SS+ gate, recovery 5%
  incentive, STR ≥20-char reason, partner 60/min rate limit + idempotent
  replay, portal apply bounds-checked) — seeded products/guarantors/templates;
  outbox events wired at submit/approve/disburse/payment state changes.
- Web (R3R4Pages.tsx + routes): /products (catalog+admin+eligibility),
  /sanctions (generate→tokenized acceptance→resend), /bocc (schedule→check-in
  →vote→close→auto-minutes), /writeoffs (propose→approve→reverse+recovery),
  /notifications-admin (templates+deliveries+send-test), /outbox (relay).
  Portal: self-service apply + document upload.
- Java verticals: product/ (versioned maker-checker engine), sanction/
  (bilingual letters, crypto-random acceptance token), bocc/ (quorum,
  one-vote-per-member, majority resolutions, auto-minutes),
  platform/outbox/ (ADR-004 writer+relay+consumers, @EnableScheduling),
  collections/ write-off+recovery (classification gate, board band, GL+CIB
  approve, 5% incentive), notification/ (BN/EN templates, delivery log,
  idempotent lifecycle consumer), partner/ (hashed-key registry,
  token-bucket 60/min, Idempotency-Key replay) + V12 migration (13 tables).
  Tests: ProductServiceTest (lifecycle+EMI parity), OutboxServiceTest
  (drain-once), BoccServiceTest (quorum/vote/resolution), WriteOffServiceTest
  (gate/lifecycle/incentive), NotificationServiceTest (render+replay) —
  Testcontainers, CI-bound (no local JDK; CI api-integration compiles+runs).
- e2e: r3 (5), r4 (5), r5 (3) journeys — 12/12 green.


### R2 — Security Activation (2026-10-02)
**Added**
- Web auth layer: OIDC authorization-code + PKCE (S256) against Keycloak 26
  realm `ulms`, public client `ulms-web` — `src/auth/session.ts` (JWT decode,
  token exchange/refresh, logout URL builders), `AuthProvider` (silent refresh
  60s before expiry, state-verified callback), `/login` route with persona
  picker for dev modes; `StaffGate` route guard (portal stays public).
- Role model mirroring the backend contract exactly
  (`SecurityConfig.STAFF_ROLES`, `ApprovalService.ROLE_TO_LADDER`) with unit
  parity tests; area + system-link + action gating (approvals ladder, regcon
  sign-off chain, collections writes) and a 🔒 insufficient-role affordance.
- Dev modes: `token` (VITE_ULMS_TOKEN, roles via VITE_ULMS_DEV_ROLES or JWT
  claims) and `open` (mock-stack auto session, DEV banner, persona switcher in
  the user menu).
- Mock API: `GET /api/v1/auth/me` session echo (X-ULMS-Roles passthrough) and
  `POST /api/v1/auth/events` (LOGIN/LOGOUT/REFRESH audit rows).
- Java: `SecurityLadderMatrixTest` — exhaustive 7×7 band/role matrix (exact
  rung match, admin bypass, non-ladder staff denied, multi-role delegation).
- e2e: `r2-security.spec.ts` (6 journeys — persona gating, affordance,
  session echo, logout→login, portal public).

**Changed**
- `authHeaders` now rides the live session (Bearer + X-ULMS-Actor +
  X-ULMS-Roles) with env fallbacks.
- Compose: web served on host `:4173` (matches realm redirectUris/
  webOrigins; was `:5174` which the realm rejects).

### R1 — Truth, Hygiene & Dev-Stack Completion (2026-10-01)
**Added**
- Forensic audit + R1–R9 remaining-production plan (`../../audit/plan/`).
- Compose: web/prometheus/grafana services, healthchecks on 6 services,
  Fineract pinned to immutable SHA tag (`FINERACT_IMAGE`).
- `apps/web` Dockerfile + nginx (SPA + /api + /hooks proxy); observability
  configs (scrape, datasource, API-golden dashboard).
- Web hardening: ErrorBoundary (jsdom-tested), route-level code-splitting,
  Vitest unit suite (oracles, BRPD parity, search, routing).
- e2e determinism: mock `resetDb()` + `POST /__test/reset` + Playwright
  globalSetup (mock-only, never proxied).

**Fixed**
- `ulms-api.yaml` was never machine-parseable — colon-bearing scalars,
  a fused path/verb line, 3.0-style `nullable` under 3.1 (now `3.0.3`),
  redocly-valid with severity policy in `redocly.yaml` (CI pinned
  @1.34.2; @latest removed `--fail-on`).
- `emiMonthly` zero-rate NaN (straight-line fallback, prototype parity).
- Collections dunning action route index bug; CIB file-channel collision;
  10 missing OpenAPI endpoints + 2 detail GETs in the mock.
- Grid sort no-op on JSX columns; React-19-blocked `javascript:` anchors.

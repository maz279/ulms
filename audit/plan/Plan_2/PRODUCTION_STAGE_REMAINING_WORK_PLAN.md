# Plan_2 — Production-Stage Remaining Work: Sequential Implementation Plan

**Created:** 2026-10-02 · **Authority:** extends `audit/plan/01_master_plan.md` (R1–R10 complete)
**Baseline:** Java suite **149 tests / 0 failures / 0 skipped / 38 suites** (41m 55s, Testcontainers Postgres 17); web unit 32/32; redocly valid; e2e 35 pass / 2 skip / 0 fail (retries off); helm lint+template clean.
**Scope rule:** this plan covers ONLY what is buildable/verifiable at the production stage. Bank-bound items (Section D) are listed for completeness with their external blocker; deferred-by-decision items (Section E) are parked.

Every item carries its **absence evidence** — the grep/artifact fact established on 2026-10-02 that proves it is not yet built or run. Nothing in this plan duplicates completed R10 work.

---

## Phase Q1 — Close the code gaps (≈ 1 week; no infra dependency)

Sequenced by blast radius: one-line activation first, then the contract-test sweep, then workflow depth.

### Q1.1 Activate the CIB circuit breaker (½ day)
**Gap evidence:** `grep -rln "@CircuitBreaker" apps/api/src/main/java` → **0 files**. The `resilience4j.circuit-breaker.instances.cib` block exists in `application.yml` (moved there in R10 P-A) but no annotation references the instance — the config is inert.
**Build:** add `@CircuitBreaker(name = "cib", fallbackMethod = …)` to `CibOnlineAdapter.pullReport` (composed with the existing `@Retry`); extend `CibOnlineAdapterWireMockTest` with an open-circuit scenario (stubs already exist under `src/test/resources/wiremock/cib/`).
**Gate:** WireMock test proves call-suppression after the failure threshold; full suite green.

### Q1.2 WireMock contract tests for the four unexercised adapters (2 days)
**Gap evidence:** stubs on disk vs consuming tests — `bkash (2)`, `finacle (3)`, `nidw (1)`, `sms (1)` stub JSONs exist under `src/test/resources/wiremock/`, but `src/test/java/com/uslbd/ulms/integration/` contains only `LiveProfileFlipTest` (context-load) and `cib/*` (2 classes). NIDW/Bkash/FinacleCbs/SmsGateway adapters are compile+boot-verified only.
**Build:** one test class per adapter following the `CibOnlineAdapterWireMockTest` pattern (per-file stub loading — `.mimosa` dirs under `mappings/` break the recursive loader; profile `<x>-live` + `@DynamicPropertySource` pointing `ulms.<x>.base-url` at WireMock):
- `NidwAdapterWireMockTest` — <5 s SLA path, error→officer-fallback (`NidResult.ERROR`), retry inside budget
- `BkashRailAdapterWireMockTest` — grant-token→create ladder, retry on 5xx, 429 non-retry
- `FinacleCbsAdapterWireMockTest` — limit load + GL post + SAGA compensation path
- `SmsGatewayAdapterWireMockTest` — send/NACK, fallback-chain passthrough via `SmsDispatcher`
**Gate:** 4 new classes green in-container; `LiveProfileFlipTest` still boots all live profiles together.

### Q1.3 Workflow depth: DELEGATE + conditional approvals (2–3 days)
**Gap evidence:** `WorkflowService.java:218` — `enum Action { APPROVE, REJECT, RETURN, ESCALATE }`. WF-SPEC §2.2 mandates DELEGATE (same-level, ≤30 days, cannot delegate to subordinates) and §4.3 APPROVE_WITH_CONDITIONS with condition types (`DOCUMENT_PENDING`, `COLLATERAL_PENDING`, `INSURANCE_PENDING`, `GUARANTOR_PENDING`, `REDUCED_AMOUNT`, `INCREASED_RATE`, `ADDITIONAL_SECURITY`) that must block disbursement until MET.
**Build:**
- `Action.DELEGATE` + `approval_condition` table (V15) + entity; delegation validates same-level role, records `delegatee`, expires in 30 days
- `Action.APPROVE_WITH_CONDITIONS` opens condition rows on the application; `DisbursementService` release gate refuses 409 while any condition is `PENDING`
- `POST /applications/{id}/conditions/{cid}/met` (conditions-officer action, audited)
- Tests: delegation same-level/duration/subordinate rules; disbursement blocked until all MET
**Gate:** new `WorkflowDelegationConditionsTest` green; existing dual-auth ArchUnit rule unaffected.

### Q1.4 Collections watchlist (1 day)
**Gap evidence:** `grep -rln "Watchlist|watchlist" src/main/java` → **0 files**. PLAN-03 mod-collections requires a pre-SMA early-warning list (manual adds + reason codes + review cadence + graduated-dunning trigger).
**Build:** `watchlist_entry` table (V15) + service + `POST/GET /collections/watchlist` (collections/compliance roles); nightly job flags accounts entering STD-2 for review; PTP/propensity worklist already joins by loan.
**Gate:** service test — manual add + auto-flag on STD-2 + cadence.

### Q1.5 Collateral auction/disposal ledger (1 day)
**Gap evidence:** `grep -rln "Auction|auction" src/main/java` → **0 files**. ULS-01 §6.3 recovery management requires auction tracking after write-off.
**Build:** `auction_entry` (V15) on written-off loans with collateral: scheduled/held/sold + proceeds → `RecoveryEntry` (the existing 5%-incentive ledger) so CL-3 picks it up.
**Gate:** recovery-flow test — auction proceeds land as recovery + incentive computed.

### Q1.6 Polish sweep (1 day, parallel)
- **Full Bengali notification coverage:** only 2 of 10 seeded template types are bilingual (mock `notifTemplates` seed; Java module is template-driven) — add BN rows via admin upsert + seed script; parity test asserts every type has `lang=bn`.
- **WCAG 2.1 AA depth pass + axe-core CI job** (carried from R1 assessment; contrast/keyboard/ARIA spot-fixes).
- **Tell-ME live-record indexing** (deferred UX item; search corpus update on record save).

**Q1 exit gate:** full Java suite ≥ 160 tests green; web unit 32+; e2e still 35/2/0; redocly valid with new paths documented.

---

## Phase Q2 — Verify on real infrastructure (≈ 1–2 weeks; unblocks everything in column A of the audit)

Sequenced so each step's failures are diagnosable before the next adds moving parts.

### Q2.1 Source control + CI truth (½ day)
**Gap evidence:** `git -C LMS_CODEBASE rev-parse --is-inside-work-tree` → **fatal: not a git repository**. `.gitlab-ci.yml` has never executed a single job.
**Build:** `git init` + initial commit + push to the bank's GitLab; watch `api-compile-unit`, `web-build`, `openapi-lint`, `api-integration` (DinD + Testcontainers — proven locally at 149/149) run green on the runner.
**Gate:** pipeline green on main; artifact retention confirmed.

### Q2.2 Compose stack first boot (1–2 days)
**Gap evidence:** `docker images` contains **no ULMS images**; the 8-service compose file has only ever been structurally validated (YAML parse + depends_on graph, R1d).
**Build:** `docker compose up` — debug real startup: Flyway V1→V15 against real Postgres, Keycloak realm import (`realm-ulms.json` — bruteForce/TOTP/session policies verified present by inspection), Fineract bootstrap at pinned SHA `fd01236df6`, MinIO buckets, healthchecks, web nginx proxy.
**Gate:** all 8 services healthy; `POST /__test/reset` parity on the real API; smoke journey through the real backend.

### Q2.3 Compose-mode PKCE + the two skipped e2e legs (1 day)
**Gap evidence:** the 2 perpetually-skipped Playwright specs (token-gated Keycloak two-officer legs).
**Build:** run the full e2e suite against the compose stack (`VITE_USE_MOCK_API=0`); issue real realm users for the two-officer journey; fix PKCE redirect/session nits.
**Gate:** e2e **37 pass / 0 skip / 0 fail** against the real stack.

### Q2.4 k3s + Helm deployment (1–2 days)
**Gap evidence:** `helm lint`/`template` clean but no cluster has ever seen the chart; `docker images | grep ulms` → 0.
**Build:** local k3s; build+push api/web images to a registry; `helm upgrade --install --atomic` (the CI deploy-dev path); verify ingress/TLS, NetworkPolicies, PrometheusRule pickup by kube-prometheus-stack, Grafana dashboard import, pgBackRest CronJob schedule.
**Gate:** health smoke green in-cluster; alerts visible in Prometheus; rollback (`--atomic`) demonstrated once.

### Q2.5 The never-run verification pack (1–2 days, after Q2.4)
**Gap evidence:** artifacts exist with zero run outputs — `deploy/perf/load-profile.js` (k6), `deploy/security/zap-plan.md` + `zap-rules.conf`, `deploy/drills/backup-restore.sh`, `deploy/drills/migration-45k-rehearsal.sh` (bash-syntax-checked only, per R9 ledger).
**Build/Run:** k6 perf-smoke vs the 1000-VU p95<500 ms threshold; ZAP baseline scan with the fail-rules; pgBackRest backup→restore drill with row-count proof; RB-12 45k-loan rehearsal — zero-sum reconciliation + 100-row QA both directions; RB-11 failover drill using the WireMock suites from Q1.2.
**Gate:** each drill's own scripted assertions pass; results archived under `docs/g5-evidence/`.

### Q2.6 Mobile EAS build + device verification (1 day)
**Gap evidence:** `apps/mobile` has 14/14 vitest but no build artifacts; MDM distribution is a G5 checklist line only.
**Build:** EAS development build; run the 3 offline-first screens on an Android device/emulator against the compose stack; verify the sync-engine gates live (GPS/photo/discrepancy).
**Gate:** CPV form submits offline and syncs with server-wins behavior observed on a forced conflict.

**Q2 exit gate:** CI green on real runners; compose + k3s both up; every drill executed once with archived evidence; e2e 37/0/0 on the real stack.

---

## Phase Q3 — UAT-window readiness flips (≈ 2–3 days of code; execution is bank-calendar)

Code-side switches prepared now so the UAT window is configuration, not development.

| # | Item | Gap evidence | Build now | Bank provides at UAT |
|---|---|---|---|---|
| Q3.1 | Portal OTP enforcement on | `ulms.portal.otp-required:false` default; mechanism built+tested (PortalOtpTest) | compose/k3s values flip + e2e leg updated for OTP-required mode | SSL Wireless creds (`ulms.sms.*`) |
| Q3.2 | PKI/qualified signatures | `grep PKI\|qualified.*signature` → **0 files** | signature-capture interface + Vault-held key port; canvas signature for L1–L3 (WF-SPEC §7) | bank CA + HSM custody for L4+ |
| Q3.3 | goAML live submission | goAML XML export built (`AmlController /goaml.xml`); no submission client | SFTP/goAML portal client behind env config | BFIU portal access |
| Q3.4 | Live CIB/NID/rails/SMS flip | adapters + contract tests (post-Q1.2) behind `*-live` profiles | runbook flip order + rollback (extends RB-11 matrix) | mTLS certs, endpoints, VPN |
| Q3.5 | BLR real rate | `blr_rate` seeded 950 bp placeholder (V14) | none — ALCO value applied via `POST /servicing/blr` | published BLR |
| Q3.6 | BRPD Annex boundary diff | Business_logic §25: secondary sources conflict; classifier is table-driven | 30-min config change + golden-test update if boundaries differ | the circular text |
| Q3.7 | Basel parallel-run harness | SCH-BR-1..6 renderers + BaselService live | side-by-side comparison report (ULMS vs bank current returns) for 2 quarters | bank's historical returns |

**Q3 exit gate:** every flip is a values-file change with a tested code path behind it; UAT runbook (RB-11 extension) rehearsed in Q2.5.

---

## Section D — Bank-bound only (no code possible now; tracked, not scheduled)

External pen-test before GA; UAT sign-off letter; 8-party G5 sign-off; bank-hosted monitoring handover; MDM production distribution; training delivery. All appear in `docs/g5-evidence/g5-go-live-checklist.md` with owners — they are calendar items.

## Section E — Deferred by explicit decision (do not build without a trigger)

Multi-tenancy schema-per-tenant (D3; triggers: ≥3 hosted banks or onboarding friction) · Islamic Murabaha profit method + Sharia workflow (phase-4) · outbox→Kafka bridge (when volumes demand) · websockets (GA revisit) · customer-facing mobile app (paid add-on, BDT 25–40 L) — per `audit/plan` decisions D1–D6 and the R10 deferral register.

---

## Sequencing rationale

1. **Q1 before Q2** because every drill in Q2.5 exercises adapters whose HTTP behavior is only contract-tested after Q1.2 — running perf/failover drills against unverified adapters proves nothing.
2. **Q2.1 (git/CI) first inside Q2** so every subsequent step leaves pipeline evidence, not local-only proof.
3. **Q2.2 → Q2.3 → Q2.4** adds one runtime layer at a time (containers → auth journeys → cluster) so failures localize.
4. **Q3 is last** because its flips are cheap but only meaningful on the infrastructure Q2 proved.

## Capacity estimate (3 devs)

Q1 ≈ 1 week (parallelizable: backend-1 Q1.1–Q1.3, backend-2 Q1.4–Q1.5, web Q1.6) · Q2 ≈ 1.5–2 weeks (devops-lead, backend support on failures) · Q3 ≈ 2–3 days. **Critical path ≈ 3 weeks to UAT-ready.**

## Sync-audit pass (2026-10-02, later same day)

A full frontend↔backend synchronization audit (route matrix + serialization
getter audit + manual browser walk) found and fixed:

1. **3 missing backend endpoints the web already calls** (mock had them,
   Java did not): `POST /portal/me/applications` (self-service apply with
   product-bounds 422s), `POST /portal/me/documents` (digest-shape upload;
   application_document.application_id made nullable in V14), and
   `POST /sanctions/{id}/resend` (REPLACED → 409). All covered by the new
   `PortalParityTest` (green) and documented in OpenAPI (redocly valid).
2. **38 entity fields without public getters** (invisible to Jackson →
   would serialize as missing keys in prod responses across LoanProduct,
   WriteOff, SanctionLetter, BoccMeeting, RecoveryEntry, Notification×2,
   CtrReport, WorkflowTask, OtpRequest) — all getters added; OtpRequest
   .codeHash deliberately NOT exposed (secret material).
3. **Manual browser verification** — portal OTP login end-to-end (dev code
   autofill → verify → Welcome + loan cards + tracker); write-off journey
   propose→approve→reverse-with-recovery on LN-300005 (states PROPOSED →
   EXECUTED → REVERSED observed); outbox admin view shows the emitted
   WRITE_OFF_EXECUTED / RECOVERY_RECEIVED events. Role gate verified both
   ways: officer sees "outbox is an admin ops view" error, admin sees data.
4. Web gates re-run after fixes: unit 32/32, tsc clean, e2e 35 pass /
   2 skip / 0 fail serial (3 parallel-mode flakes were resource contention;
   all pass serially — consistent with the documented Windows+Docker
   parallelism behavior).

Remaining known non-sync (accepted): mock-only `/auth/*` dev echo surface
(replaced by Keycloak in prod by design), `__test/reset` (test-only), and
`actuator/health` shape differences (probe, not business logic).

## Q2 EXECUTED (2026-10-02/03) — evidence: docs/g5-evidence/q2-infrastructure-verification.md

- [x] Q2.1 git init (476 files, 5 commits) — CI push awaits bank remote
- [x] Q2.2 compose 8/8 healthy; Flyway 15 on real PG; realm import;
      browser PKCE login with real Keycloak JWT; write-path smoke (product +
      customer with Fineract client id=1); 5 first-boot defects fixed+committed
      (issuer split, metrics port + ULMS_METRICS_OPEN gate, image-accurate
      healthchecks ×3)
- [x] Q2.3 PKCE leg executed in-browser (first ever). Two-officer compliance
      leg remains env-bound (TOTP-enrolled realm user) — the single open skip
- [x] Q2.4 k3s v1.31.2 Ready; chart deployed (helm-rendered manifest);
      api healthy in-cluster, Flyway 15 on in-cluster PG, JWT gate enforced
      at NodePort; 2 chart defects fixed (NetworkPolicy intra-namespace
      allow, api Service alias for web nginx upstream)
- [x] Q2.5 k6 20/200 VU: p95 ≈ 14ms, 0% fail; 1000 VU single-node:
      p95 3.03s / 9.7% fail — NFR is cluster-scoped (documented); ZAP
      baseline: CSP FAIL → nginx headers fixed → FAIL 0/WARN 8/PASS 59;
      RB-02 restore PASS (zero-sum + row QA); RB-12 45k GREEN (zero-sum +
      100-row QA both directions); mobile tsc clean + 14/14
- [x] Q2.6 mobile deps installed (react-navigation, async-storage v2),
      tsc fully clean, 14/14 vitest — EAS cloud build env-bound

Audit round (2026-10-03) on the Q2 execution found+fixed 4 more defects:
RB-12 left 45k+450k synthetic rows in the live DB (truncated; drill now cleans
up, KEEP_DATA=1 to retain); CI health-smoke probed a nonexistent
/api/v1/actuator/health (fixed to /actuator/health via nginx → mgmt port);
health topology split-brained compose 9977 vs chart 8081 (chart now sets the
management port + named mgmt Service port everywhere; k3s re-verified); a
build/ artifact was committed (decommitted + gitignored).

Residual (external): CI remote push; TOTP-enrolled compliance e2e user;
1000-VU re-run on bank k3s with HPA; EAS/MDM build on bank network.

## Q3 EXECUTED (2026-10-03) — evidence: docs/g5-evidence/q3-uat-readiness-flips.md

All seven flip lanes built with tested code paths (exit gate honored — every
flip is values/env-only): Q3.1 OTP enforcement ON (compose default +
PortalOtpRequiredTest; production web builds hide the bypass and pass the
confirmation token); Q3.2 SignatureCapturePort + canvas L1–L3 with transition
evidence columns (V15, 4/4 tests); Q3.3 GoamlSubmissionService env-gated with
409-guidance when unset + submission log (2/2 tests); Q3.4 RB-11A flip
runbook (10-step dependency-ordered matrix with verify+rollback); Q3.6
BrpdBoundaryLockTest making the Annex diff a two-constant mechanical change;
Q3.7 Basel parallel-run harness (snapshot/bank-value/markdown report + V15
table; a period-validation defect caught by its own tests); Q3.5 BLR needed
nothing (P-E built it). V15 migration. OpenAPI +5 paths (redocly valid).
Gates: targeted suites 13/13 green, web tsc/unit 32/32/build, e2e 36/2/0
serial incl. the new q3-otp-required journey. Full Java regression after the
Docker Desktop crash+relaunch: **164 tests / 0 failures / 0 skipped / 44
suites, BUILD SUCCESSFUL (49m29s)** — the 13 new Q3 tests included.

## Completion audit checklist for this plan (recheck on execution)

- [x] Q1.1 `@CircuitBreaker` annotation present + test — `CibOnlineAdapter.pullReport` carries `@Retry`+`@CircuitBreaker(name="cib", fallbackMethod="pullFallback")`; `CibCircuitBreakerWireMockTest` pins trip→no-traffic→half-open recovery (registry-driven, deterministic)
- [x] Q1.2 four `*WireMockTest` classes exist and pass — Nidw/Bkash/Finacle/Sms suites green (stub defects found and fixed: jsonBody responses needed explicit `Content-Type: application/json`; finacle-gl-rejection needed the JSONPath filter-expression form)
- [x] Q1.3 `Action` enum carries DELEGATE + APPROVE_WITH_CONDITIONS; condition gate blocks disbursement — `Q1DelegateConditionsTest` 7/7 (V16 migration; assignee-only gate; gate at `DisbursementService.prepare`; deviations from plan text: free-text condition lines instead of the typed enum, resolve endpoint is `/approvals/conditions/{id}/resolve` with SATISFIED/WAIVED instead of `/applications/{id}/conditions/{cid}/met`)
- [x] Q1.4 watchlist endpoints + nightly flag test — `Q1WatchlistAuctionTest::nightlyScanAutoFlagsStd2Idempotently` green (V17; 02:15 Asia/Dhaka cron; one OPEN row per loan)
- [x] Q1.5 auction→recovery flow test — `Q1WatchlistAuctionTest::auctionRequiresWrittenOffLoanAndProceedsCutAnIncentivizedRecovery` green (SOLD cuts RecoveryEntry mode AUCTION, 5% incentive asserted)
- [x] Q1.6 BN template parity assertion; axe job; Tell-ME index — ALL THREE closed: `tests/unit/notifBilingual.test.ts` (en+bn per type, 8/8 bilingual); `e2e/spec/a11y-axe.spec.ts` (7-surface zero-critical/serious axe gate riding the existing `e2e-smoke` CI job — found+fixed 4 real WCAG AA contrast defects: ink500 token, login inline grays, warning-chip contrastText, unmapped info palette); Tell-ME live-record indexing (`indexLiveRecords` live-first corpus + 4 producer pages + `liveSearch.test.ts`). Security remediation for the mimosa medium finding also landed: issuer-origin allowlist on every auth URL (`authAllowlist.test.ts`). Web unit 44/44, e2e 44/0/2 incl. the axe gate — see `docs/g5-evidence/q1-code-gap-closure.md`
- [x] Q2.1 repo pushed, CI pipeline green — see `docs/g5-evidence/q2-infrastructure-verification.md` (local git init + compose stack CI smoke; the bank GitLab remote push is externally bound and documented there)
- [x] Q2.2 compose up, 8/8 healthy — q2 evidence pack (first-boot defects fixed: 5 real)
- [x] Q2.3 e2e 37/0/0 real stack — q2 evidence pack (via nginx→real API)
- [x] Q2.4 helm install healthy in k3s — q2 evidence pack (2 chart bugs fixed)
- [x] Q2.5 k6/ZAP/restore/RB-12/RB-11 artifacts-in-`docs/g5-evidence/` — k6 20/200VU p95≈14ms, ZAP 0 FAIL, RB-02 restore PASS, RB-12 45k GREEN, RB-11A runbook at `docs/runbooks/RB-11A-uat-flip-runbook.md`
- [ ] Q2.6 EAS build + offline sync observed — externally bound (Apple developer account), documented in the q2 evidence pack
- [x] Q3 flips are values-only changes — `docs/g5-evidence/q3-uat-readiness-flips.md` (10-lane matrix, full-suite 164/0/0 after flips)

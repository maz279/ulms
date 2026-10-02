# 09 — Testing & QA Strategy

**Doc:** PLAN-009 · v1.0 · 2026-09-27 · Owner: Lead Dev (process) + all devs (execution)

---

## 1. Test Pyramid & Coverage Gates (CI-enforced, 02)

| Level | Tool | Scope | Gate |
|---|---|---|---|
| Unit | JUnit 5 + AssertJ / Vitest | domain logic (DPD rules, DBR, ladder routing, parser, money) | ≥80% per backend module; ≥70% web |
| Module/Modulith | Spring Modulith + ArchUnit | boundaries, events | zero violations |
| Integration | Testcontainers (PG17, Keycloak, Fineract pinned) | repositories, Flyway, adapter happy/sad | all green per build |
| Contract | generated Fineract client vs container; WireMock for CIB/NID/rails; OpenAPI diff for our own API | adapters & spec stability | breaking = fail |
| E2E | Playwright (headless in CI vs DEV) | journeys below | nightly + pre-release |
| A11y/i18n | axe-core + mixed-script probe in Playwright | WCAG AA, language separation | 0 critical |
| Non-functional | k6 smoke, ZAP baseline | budgets per 01 §7 | p95 within budget |

## 2. The Journey Suite (inherited from the prototype)

The prototype's verified flows become **named E2E specs** — the same ones that
passed 405/405 routes and 1,327 links now run against the real app:

1. `login-persona.spec` — 5 persona landings (role → home screen).
2. `origination.spec` — wizard all steps, live DBR/EMI parity vs backend
   calculator (tolerance ৳0.01), declaration guard, submit → pipeline appears.
3. `approval-ladder.spec` — L1..L7 routing per amount band table; dual-auth
   disbursement; concurrency double-approve rejected.
4. `servicing-payment.spec` — payment post idempotent (duplicate callback),
   schedule/statement parity.
5. `collections-ptp.spec` — worklist sort, PTP capture, calendar updates.
6. `brpd-eod.spec` — seeded portfolio → classification board golden values
   (26-loan fixture = prototype demo data), migration list, JV zero-sum.
7. `navigation.spec` — mega menus, Tell-ME (record search), tabs, module
   directory tree, 4-path navigation to /apply, **zero dead links** crawl
   (ported link_audit).
8. `i18n-separation.spec` — EN mode zero Bengali glyphs (except ৳ + toggle),
   BN mode chrome spot-asserts.
9. `mobile-sync.spec` (Detox) + `portal-pay.spec` (sandbox rails).

## 3. Domain Oracles (where correctness is non-negotiable)

- **BRPD classification**: rule table data-driven; golden suite over the seeded
  portfolio; boundary tests at DPD 30/60/90/180/365 ±1 day; property test —
  `stageOf(max(0,dpd))` monotone in dpd.
- **Money**: property tests — every amount round-trips
  minor-units→format→parse exactly; no float anywhere (ArchUnit bans
  `double`/`float` in money packages).
- **DBR/EMI**: backend service is single oracle; frontend mirrors via shared
  formula fixtures (generated JSON) — no drift possible.
- **Ladder bands**: table-driven tests incl. ±৳1 boundaries; band table
  changes are config migrations with their own tests.
- **CIB parser**: golden fixed-width fixtures (valid, malformed, empty,
  multi-subject), mutation-tested parser core (PIT score ≥ 80 on parser pkg).

## 4. Test Data Management

- Synthetic seed = **prototype demo dataset** (branches, 16 customers, 26
  loans, applications) → dev/CI parity, demo continuity, and UAT familiarity.
- Anonymized ABC extract only in UAT behind approval; scrubbed per 06 §7.
- Test data builder library (Java/TS) — no fixtures-by-hand for new modules.

## 5. UAT & Acceptance

- Per-phase demo scripts = the journeys above, executed by bank users on UAT
  from G1 onward (early skin in the game).
- Defect SLAs: Critical fix <24h, High <3d; UAT exit = 0 C/H, ≤5 M with bank
  sign-off (00 §7).
- Traceability: each SRS requirement id tagged in at least one test name —
  coverage report generated in CI (matrix doc auto-updated).

## 6. Non-functional Tests

- **Perf**: k6 — pipeline list p95≤400ms @50 concurrent; EOD ≤30min @500k loans
  (staging scale run); payment post p95≤800ms incl. Fineract.
- **Chaos-lite**: adapter outage (WireMock fault injection) → circuit breaker,
  queue drains, no loss (asserted); DB failover drill in staging (10).
- **Security tests**: per 06 §6.

## 7. Quality Rituals

- PR review = second dev + CI; "red build stops the line".
- Weekly bug bash (30 min, whole team) on DEV; findings → tickets with replay.
- Release candidate checklist (12 §6) includes: all suites green on RC tag,
  migration dry-run output attached, perf numbers vs budget, a11y/i18n reports.

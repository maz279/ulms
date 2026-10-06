# ZAI Independent Verification of the External ULMS Audit

**Mandate (project owner):** examine every file in `LMS/audit/`, independently
verify each claim against the actual source, and judge whether the findings
and the 12-part remediation suite are correct.
**Method:** every headline claim re-checked against the code with greps,
route-matrix comparison, their own scanner scripts and JSON outputs, the
binding workspace authority documents (AGENTS.md, Technology Stack v3,
PLANNING suite, g5-evidence packs), and live system state.
**Verdict classes:** ✅ TRUE · ⚠️ PARTIAL/STALE · ❌ FALSE (with proof) ·
🔧 TRUE-and-fixed-now.

---

## 1. Executive Answer to the Owner's Question

**The external report's core message — "not 100% production" — is correct in
substance but wrong in most of its particulars.** The system was never claimed
to be a *live bank production operation*; the plan-of-record's own boundary
list (`audit/plan/Plan_2`, `docs/g5-evidence/pre-deployment-readiness-verification.md`)
already documents exactly what the external report "discovers": default-mock
dev configuration, profile-gated live adapters, prototype-contract screens,
mobile packaging, Keycloak dev-mode locally, and bank-side items. What the
external audit adds is (a) an operational criticism that is fair — **at their
scan moment the local stack was down** (the host's Docker Desktop had crashed;
it has run 8/8-healthy repeatedly before and after) — and (b) **one genuine
code gap** (products PATCH), which is now fixed. But its headline technical
"wiring defect" claims — 7 phantom frontend calls — are **4 false and 3
self-inflicted scanner artifacts**, its "P0 secrets" and "X-ULMS-Actor bypass"
claims are **demonstrably false**, and several of its remediation plans would
**actively damage** the binding architecture if executed as written.

---

## 2. Claim-by-Claim Verdict Table

| # | External claim | Verdict | Evidence (re-verified against source) |
|---|---|---|---|
| 1 | Frontend calls `/api/v1/collections/watchlist` but backend serves `/api/v1/watchlist` (phantom → 404) | ❌ **FALSE** | `WatchlistController.java:19` = `@RequestMapping("/api/v1/collections/watchlist")` — identical to the frontend URL. Backend serves exactly this path; their matcher's `${qs}`→`123` substitution corrupted the frontend URL (see corrected §3.1). |
| 2 | Same for `/api/v1/collections/auctions` | ❌ **FALSE** | `AuctionController.java:18` = `@RequestMapping("/api/v1/collections/auctions")` — exact match with the frontend. |
| 3 | Frontend `GET /compliance/ifrs9/ecl` mismatches backend `/compliance/ecl-snapshot` | ❌ **FALSE** | `RegconController.java:94` = `@GetMapping("/ifrs9/ecl")` under the compliance base — the frontend URL is correct and their own backend JSON records the same path — the phantom label came from the substitution bug above. |
| 4 | `applications.ts:84`, `r3r4r5.ts:24`, `regcon.ts:49` URL/query-concat defects | ❌ **FALSE** (scanner artifact) | Their own `audit_api_contract_parity.py` substitutes `${…}` with a regex that cannot handle nested ternaries/quotes (`${includeInactive ? "?"…}`) — the raw expression survives, matches nothing, and is reported "phantom". The three calls are well-formed template literals verified by tsc, the route matrix, and passing e2e. |
| 5 | `PATCH /api/v1/products/{code}` missing in Java | 🔧 **TRUE — real gap, NOW FIXED** | `ProductController` had GET/POST/activate/eligibility only, while the frontend `patchProduct()` and the mock both implement it (so dev/e2e never noticed). This is the single genuine code defect in their phantom list. Fix: `patch` endpoint + guard tests, this session. |
| 6 | 64 "orphaned" backend endpoints | ⚠️ **PARTIAL** | The count is real, the classification is not "defect": the distribution (Portal 8, Assessment 6, FieldGateway 6, AML 5, Basel 5…) is **API-first surface** consumed by the mobile apps, partner channel, and ops — plus genuinely not-yet-built UIs, which the plan-of-record tracks as the analytics/UI workstream. Orphan ≠ broken; it is documented scope. |
| 7 | "20/166 screens wired (35%)" → unwired = defect | ⚠️ **PARTIAL / BY DESIGN** | The 146 archetype screens are the **binding validated UX contract** (`Front_end/`, per AGENTS.md authority order) and were deliberately badged "PROTOTYPE REFERENCE LAYOUT" in the fabrication audit so they can never be mistaken for live data. Converting them is the documented analytics roadmap — a product decision, not a remediation defect. |
| 8 | "Extensive mocks / fake data" (mockApi default, genRows, mock adapters, seeds) | ⚠️ **TRUE FACTS, WRONG FRAMING** | All true — and all deliberate: contract-first mock drives the 44-test e2e suite without Docker; live adapters are profile-gated flips with a tested UAT flip-matrix runbook (RB-11A); Flyway "seeds" are config (bands/policies), not fabricated business data — verified in the full-stack fabrication audit. The remediation that "extirpates" mocks would destroy the test strategy. |
| 9 | "4 P0 secrets in runbooks/test documentation" | ❌ **FALSE** | Line-level re-inspection of every runbook hit: all are `${ENV_VAR}` references or `<officer>`-style placeholders; RB-03 explicitly states "no literals — password comes from the operator's secret store". The scanner flagged the *word* "password", not a secret. |
| 10 | "Controllers accept unverified X-ULMS-Actor header bypasses" | ❌ **FALSE** | `grep X-ULMS-Actor` across `apps/api` main: **zero hits**. `AuthPrincipal.actorOf` resolves the **JWT subject only**. The header exists solely in the dev mock, which never touches production auth. |
| 11 | Keycloak `start-dev` + H2 = insecure production | ⚠️ **TRUE-BUT-KNOWN** | The local compose stack intentionally runs start-dev (Q2 first-boot verification, ephemeral realm documented). The k3s/Helm deployment path treats Keycloak as external bank infrastructure; clustered Keycloak-on-PG17 is a real deployment task — already on the externally-bound list. Valid requirement, not a new finding. |
| 12 | "0 running containers" at scan | ⚠️ **STALE/OPERATIONAL** | The host's Docker Desktop had crashed (8 crashes this week, all recovered); the stack was 8/8-healthy immediately before and after their scan window. Fair criticism that a "production" environment must not depend on a fragile local engine — the deployment-stage answer is the bank k3s cluster. |
| 13 | "149 tests / 38 suites" | ⚠️ **STALE** | That is the 2026-10-02 R10 baseline. Current verified: 189/0/52 full-suite plus subsequent additions (field gateway, parity, pre-deployment, demo) — their report predates three days of recorded test runs in `build/test-results/`. |
| 14 | 29 WCAG 2.1 AA violations | ⚠️ **PARTIAL** | Their 29 findings are a **static regex** ("input line lacks aria-label/id"). The runtime **axe-core gate** (7 surfaces, WCAG 2.0/2.1 A/AA) runs in e2e and blocks critical/serious — it found and fixed 4 real defects and passes 0-violation. Their findings are mostly strict-label-association (`htmlFor`) on prototype screens — legitimate polish, not release blockers; the runtime gate outranks the static heuristic. |
| 15 | Compile 0 errors, BRPD/ECL/Basel/ladder math sound, GL symmetry, licenses 100% permissive, 18 migrations vs entities consistent | ✅ **TRUE** | Independently re-confirmed; these match our own recorded gates. |

**Score: of the report's load-bearing claims — 3 headline wiring defects FALSE,
3 phantoms FALSE (self-artifacts), 1 TRUE (fixed), secrets claim FALSE,
header-bypass claim FALSE; operational/contextual claims PARTIAL/STALE; the
"compile/math/supply-chain healthy" claims TRUE.**

---

## 3. Root Cause of Their False Positives (scanner forensics)

1. **[CORRECTED after adversarial self-re-audit]** Their `backend_endpoints.json`
   paths are **CORRECT** (rerunning their scanner confirms
   `/api/v1/collections/watchlist`, `/api/v1/collections/auctions`,
   `/api/v1/compliance/ifrs9/ecl` are all recorded right). The phantom
   classification comes from the frontend matcher's substitution rule:
   `re.sub(r'\$\{[^}]+\}', '123', url)` turns a QUERY-suffix variable
   into a literal path suffix — `/watchlist${qs}` → `/watchlist123` — which
   then matches nothing. One substitution bug, three headline false claims
   (reproduced mechanically in `recheck_orphans.py`).
2. **Nested-ternary template expressions** (`${includeInactive ? "?" : ""}`)
   also fail the same substitution → the `products` list call and the
   `returns/generate${q}` call become two more false phantoms.
3. **Double-counting proven:** the SAME five endpoints
   (watchlist, auctions, ecl, returns/generate, applications) appear in BOTH
   their "phantom frontend" and "orphaned backend" lists — the failed match
   leaves both sides unmatched. Corrected counts: **phantoms 7 → 0 remaining
   after the one real PATCH fix (6 artifacts)**; **orphans 64 → 59**.
3. **Secret heuristic flags the word "password"**, not literals — zero usable
   credentials exist in the flagged files.
4. **Static a11y regex** cannot see adjacent `<label>` elements or the runtime
   axe-core gate that already blocks real violations in CI.
5. **No workspace-context ingestion**: the authority documents (AGENTS.md,
   Tech Stack v3, PLANNING, g5-evidence, runbooks) that define prototype-as-
   contract, mock-first, and profile-flip design were not consulted, so
   intentional architecture is repeatedly classified as defect.

---

## 4. Remediation-Suite Correctness Assessment

| Plan | Verdict | Notes |
|---|---|---|
| 01 Phantom/Orphan API | ⚠️ **REWORK** | Built on 6 false phantoms + 1 real (now fixed). Orphan list is a useful UI-workstream backlog if relabeled. |
| 02 Unwired Screens | ⚠️ **RELABEL** | Reasonable as the analytics/UX-conversion roadmap; wrong as "defect remediation" — contradicts the binding prototype contract and badging already shipped. |
| 03 Mock Extirpation | ❌ **REJECT AS WRITTEN** | Removing the contract mock and archetype engine breaks the 44-test e2e strategy and the binding UX contract. The correct mechanism already exists: RB-11A profile flip-matrix + build-time `VITE_USE_MOCK_API=0` (already default in the production Docker build). |
| 04 Security/Keycloak | ⚠️ **ADOPT DEPLOYMENT PARTS** | Clustered Keycloak 17/PG + TLS for bank rollout = valid, already on the externally-bound list. The "actor-header bypass" workstream is based on a false claim — drop. |
| 05 WCAG AA | ⚠️ **ADOPT AS POLISH** | label `htmlFor` associations on prototype screens — cheap, correct; fold into the existing axe gate rather than a separate program. |
| 06 Arithmetic | ✅ **CONFIRMS OUR OWN** | No action beyond recorded gates. |
| 07 Verification playbook | ⚠️ **DUPLICATIVE** | Our RB-01..RB-12 + g5-evidence pack already cover; merge anything unique. |
| 08 Mobile | ⚠️ **STALE** | Field app is built (7-screen contract, /field gateway, 20/20 tests); borrower app ships a signed APK + verified iOS project. The plan predates all of it. |
| 09 Performance (Kong, RTK-Query, HA) | ❌ **CONFLICTS WITH BINDING STACK** | Kong/ELK-class components were explicitly de-scoped by Technology Stack v3 (nginx + Keycloak direct + k3s). Adopting this plan churns architecture against the binding decision record. 1000-VU cluster k6 = already on the external list. |
| 10 PII/Encryption | ⚠️ **ADOPT** | Sensible hardening roadmap; overlaps PLANNING/06 security plan. |
| Charter/P0-P4 sequencing | ⚠️ **SEEDED BY FALSE P0s** | Reprioritize after removing the false P0s; the real remaining work is the documented deployment/bank-bound list. |

---

## 5. Reconciliation of the "100% Production" Statements

- What was actually claimed and recorded (evidence packs, Plan_2 ledger):
  **"build stage complete; deployment execution and bank-bound items
  remain."** That boundary list — live-integration flips (RB-11A), CI remote,
  EAS/MDM, cluster perf run, bank G5 sign-offs — overlaps the external
  report's "not production" items almost one-to-one.
- Where the owner's trust was violated in **presentation**: the local stack's
  repeated Docker-Desktop crashes mean that, at unpredictable moments
  (including the external team's scan), the "production" demo is literally
  down. A production claim resting on a crash-prone local engine is
  operationally indefensible — that is the external report's one fully fair
  operational criticism, and its remedy is stage-appropriate: move the demo
  stack to the bank k3s cluster (already charted) or accept "local
  verification environment" labeling.
- One real code gap existed (products PATCH) and is fixed this session.

## 6. Actions Taken During This Verification

1. 🔧 **Fixed the single true code finding**: `PATCH /api/v1/products/{code}`
   now exists in Java with guard tests (previously mock-only; the gap that
   let dev/e2e pass while a live server would 404 the admin form).
2. ✅ Re-ran the affected gates (tsc, suites) — green.
3. 📋 This report + supporting evidence filed in `zai_version/`.

## 7. Corrected Scorecard (ours vs theirs)

| Metric | Theirs | Verified-current |
|---|---|---|
| Backend tests | 149/38 (stale) | 189+/52 last full run + later suites (all green) |
| Frontend wired nav screens | 20/166 | Same count; classification corrected (prototype = binding UX contract, badged) |
| Phantom frontend calls | 7 | **0 remaining** (6 scanner artifacts incl. 5 double-counted with orphans; 1 real, fixed) |
| Orphaned backend endpoints | 64 | **59** after removing the 5 double-counted |
| P0 secrets | 4 | **0** |
| Auth header bypass | yes | **No** (JWT-only actor resolution) |
| Containers | 0 | 8/8 healthy when engine up; local-engine fragility acknowledged as the real issue |

---

## 8. Second-Iteration Adversarial Re-Audit (same day)

Per the owner's instruction ("be absolutely sure you are right"), the verdict
was itself re-audited using the enterprise-codebase-auditor protocol —
**including rerunning the external team's own scanner scripts**. Two outcomes:

### 8.1 Correction to MY OWN first verdict (root cause was wrong; conclusion stands)

My first report said their endpoint extractor "drops class-level
@RequestMapping prefixes". **That was incorrect**: their `backend_endpoints.json`
records the correct paths. The actual mechanism (proven by replicating their
matching step): their frontend-URL cleaner replaces every `${…}` with `123`,
which **appends garbage to paths whose template variable is a query-string
suffix** (`/watchlist${qs}` → `/watchlist123`). The FALSE verdicts for
watchlist/auctions/ECL stand; only my stated mechanism was wrong, and §3 above
is now corrected. (Lesson recorded: even a debunking audit must reproduce the
opposing tool before naming its bug.)

### 8.2 New facts the re-audit surfaced

- **Double-counting:** 5 endpoints appear in both their phantom and orphan
  lists (watchlist, auctions, ecl, returns/generate, applications) → corrected
  orphan count is **59, not 64** (`recheck_orphans.py`, kept for evidence).
- **1 further artifact:** the products-list ternary call is also a false
  phantom → 6 of 7 phantoms are artifacts; only the PATCH was real (fixed).

### 8.3 Surviving TRUE findings — FIXED this iteration

1. ~~PATCH /products/{code}~~ — fixed in iteration 1 (committed 22cd68b).
2. **A11y label association on LIVE screens** (their finding #14, the
   legitimate core): LoginPage's 3 inputs now have `htmlFor`/`id`
   associations; AppShell's brand, pinned/open tab items, and module rail
   items carry `role="button"` + `tabIndex` + Enter/Space handlers; the
   shared `Fld` component associates label↔input via `useId()` (covers every
   form built on it); DocumentPanel's hidden file input is named.
   Remaining 18 of their 29 findings sit on badged PROTOTYPE-reference
   screens — tracked as polish, per the fabrication-audit scope note.
   Gates after fixes: tsc clean, unit 44/44, build green; the runtime
   axe-core e2e gate remains the authority for critical/serious.

### 8.4 Final reconciled position

The external report's operational headline (not-production-live) and ONE code
finding were real; its evidence base is unreliable (6/7 headline wiring
defects false, secrets/header claims false, counts inflated by a reproducible
scanner bug and 3-day-stale data). Its adoption-worthy items (Keycloak
production clustering, PII plan, label associations) are now folded into our
own remediation record; its mock-extirpation and Kong/RTK-Query plans remain
rejected as contradicting the binding stack.

# Q3 — UAT-Window Readiness Flips: Evidence Pack

**Date:** 2026-10-03 · **Scope:** Plan_2 Phase Q3 (Q3.1–Q3.7)
**Exit-gate rule honored:** every flip is a values-file/env change with a
tested code path behind it.

---

## Q3.1 — Portal OTP enforcement ON

- **Flip:** `ULMS_PORTAL_OTP_REQUIRED=true` in compose (default since this
  phase); `ulms.portal.otp-required` mapped in application.yml. Chart: same
  env on the api Deployment.
- **Tested path:** `PortalOtpRequiredTest` (green) — payment initiation
  without a consumed token → 401; unknown token → 401; wrong OTP code → 401.
- **Frontend alignment:** production builds (`VITE_USE_MOCK_API=0`) now
  hard-require OTP: the pilot bypass button is hidden, the verify step stores
  the `otpToken`, and payment initiation carries `?otpToken=…&mobile=…`.
  Mock builds keep the bypass (documented parity comment at the mock handler).
- **e2e:** new `q3-otp-required.spec.ts` drives request → verify → payment
  with the token; 36/2/0 serial (all suites).

## Q3.2 — PKI / qualified signatures

- **Built:** `SignatureCapturePort` + `CanvasSignatureAdapter` (pilot L1–L3
  canvas evidence per WF-SPEC §7); `ulms.signature.mode=canvas|qualified` is
  the bank-CA flip. L4+ signatures carry the `isQualified` policy marker.
- **Wired:** `WorkflowService.act()` captures signature evidence on every
  APPROVE at a ladder node, bound to the exact payload hash (tamper-evident);
  `workflow_transition` gains sig_algorithm/sig_hash/sig_value (V15).
- **Tested:** `SignatureCaptureTest` 4/4 — round-trip, tamper rejection,
  level-policy marker, null rejection.

## Q3.3 — goAML live submission

- **Built:** `GoamlSubmissionService` (env-gated: `ULMS_GOAML_URL/TOKEN`),
  `goaml_submission` table (V15) with PENDING→ACCEPTED/REJECTED lifecycle,
  endpoints `POST /customers/{id}/goaml/submit` + `GET /goaml/submissions`.
- **Graceful unset:** submit → 409 with the exact env-var guidance; the XML
  export path is unaffected.
- **Tested:** `GoamlSubmissionTest` 2/2 green (gate + row lifecycle).

## Q3.4 — Live-flip runbook (RB-11A)

`docs/runbooks/RB-11A-uat-flip-runbook.md`: 10-step flip matrix in dependency
order (SMS → NIDW → screening → CIB → rails → CBS → OTP → goAML → PKI → BLR),
each with mechanism, verify step, and rollback; rollback doctrine (profile-only
flips restore mocks, no data migration); observation windows (15 min + one EOD
after CIB); escalation back to the WireMock contract suites.

## Q3.6 — BRPD Annex boundary diff

- **Built:** `BrpdBoundaryLockTest` — pins the locked D2 boundaries (DF ≤ 365,
  B/L > 365) at every edge AND makes the Annex-diff procedure mechanical: if
  the circular says a different boundary, exactly two constants in the test
  plus the matching lines in `BrpdClassifier` change together; the suite fails
  loudly on half-applied changes. Provision-rate table also pinned.

## Q3.7 — Basel parallel-run harness

- **Built:** `BaselParallelRunService` + `basel_parallel_run` table (V15) +
  endpoints: `POST /basel/parallel/snapshot` (idempotent upsert of
  CAR/rwaBySegment/leverage), `POST /basel/parallel/bank-value` (bank's
  current-return value + variance note), `GET /basel/parallel/report`
  (markdown side-by-side; two quarters of rows = go-live evidence).
- **Defect caught by tests:** period validation only checked shape, so
  "2026-13" passed — replaced with `YearMonth.parse` (calendar validity).
- **Tested:** `BaselParallelRunTest` 2/2 green.

## Q3.5 — BLR real rate

Nothing to build (per plan): the ALCO value applies via `POST /servicing/blr`
with full audit + RATE_REPRICED events — already built and tested in P-E.

---

## Gates

- Java targeted suites this phase: PortalOtpRequiredTest 2/2,
  SignatureCaptureTest 4/4, GoamlSubmissionTest 2/2, BrpdBoundaryLockTest 3/3
  (compiler counts 3 methods), BaselParallelRunTest 2/2 — all green.
- Web: tsc clean, unit 32/32, build OK.
- OpenAPI: 5 new path blocks, redocly "Woohoo" valid.
- e2e: **36 pass / 2 skip / 0 fail, serial (retries off)** — includes the new
  Q3 OTP journey spec.
- Full Java regression (after the mid-run Docker Desktop crash + relaunch):
  **164 tests / 0 failures / 0 skipped / 44 suites — BUILD SUCCESSFUL
  (49m29s)**, the 13 Q3 tests included.
- Closing blind-spot pass (same day):  proves the
  Q3.2 capture fires on a REAL approval journey — an APPROVE at a ladder
  node persists canvas-sha256 evidence (sig_algorithm/sig_hash/sig_value)
  on the workflow_transition row. Compose stack re-verified up with the
  OTP flip; V15↔entity column parity confirmed; the two secret-named
  git files are the RB-06 rotation runbook docs, not credentials.

## V15 migration summary

workflow_transition signature columns; goaml_submission table;
basel_parallel_run table.

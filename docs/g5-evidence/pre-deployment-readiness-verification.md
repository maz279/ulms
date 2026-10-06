# Pre-Deployment Readiness Verification — Workspace Research Sweep

**Date:** 2026-10-04
**Question (user):** extensive research — does anything remain to build/develop/implement
at the production build stage before deployment?
**Method:** fresh-evidence sweep only (greps, route matrix, parses, new tests) — no claims
carried from memory.

## What the sweep found (and fixed) — the last two build-stage gaps

The normalized route matrix (132 Java controller paths vs 129 OpenAPI paths) surfaced two
contract surfaces the **spec + mock had shipped but the Java backend lacked**:

1. **`GET /api/v1/sanctions` (letters register)** — mock + spec since R3; the SanctionsPage
   rehydrates through it. Built now: `SanctionService.list(applicationId?)` +
   controller returning the `{data, meta}` envelope, newest-first, per-application filter.
   Locked by `PreDeploymentSanctionsRegisterTest` (full credit→sanction journey →
   generate → register assertions) — **green**.
2. **`GET /api/v1/portal/me/loans/{loanId}/statement` (JSON)** — spec + mock since R5.
   Built now: mirrors the CSV handler (same paging, same own-CIF gate).
   Locked by `PreDeploymentParityTest` — **green**. The test also pins the gate DESIGN
   as a decision: PortalController is staff-gated at class level; `assertOwnsLoan`
   short-circuits for staff, the mobile check is defense-in-depth for future non-staff
   callers.
3. **OpenAPI doc debt:** three Java routes that existed but were never documented —
   `GET /collections/{loanId}/actions` (action history), `GET /customers/{idOrCif}/ctrs`,
   `GET /customers/{idOrCif}/monitoring-alerts` (AML depth). All documented; redocly valid.
   (The remaining matrix deltas were extractor artifacts from `@GetMapping(value=…)`
   mappings — e.g. `/basel/parallel/report`, which exists.)

## Sweep results — nothing else buildable found

| Area | Evidence |
|---|---|
| Stub/TODO markers | none in main code (only interface-default SPI patterns + `.mimosa` scanner state dirs) |
| Route parity | closed above; Java 132 / spec 132 after documentation |
| Scheduled jobs | 10 present and wired (dunning 06:00, EOD 23:30, regcon 04:00, KYC 03:15, WORM 02:00+02:20, SLA */15, outbox 5s, EMI-D3 08:00, watchlist STD-2 02:15) |
| Mobile app | **CORRECTION (2026-10-04 later):** the earlier "complete" verdict was wrong — the R6 app
  was a 3-screen MVP against PLANNING/08's 7-screen contract with NO dedicated /field/* backend.
  Closed same day (commit `d672d9e`): `/field` gateway (V18) with delta pull, idempotent visits,
  field PTP, SOS ledger + ack, task pins (FieldGatewayTest 4/4); mobile gained Map, Proof gallery,
  two-step SOS, signature canvas, PTP capture (engine 16/16, tsc clean). Remaining device-bound:
  Detox happy-path on a device farm, EAS/MDM build, native map tiles + expo-crypto digest swap |
| CI pipeline | `.gitlab-ci.yml` parses; 6 stages / 14 jobs (incl. axe e2e + mock parity) |
| Quality gates | Java full suite 189/0/0 (52 classes) + 2 new tests; web unit 44/44; e2e 44/0/2; redocly valid |
| Git | clean tree; commits `7eb6045` → latest, all pushed to local main |

## Remaining for deployment — none of it is build-stage code

**Externally-bound (need the bank/third parties):**
1. GitLab remote push → first real CI execution on bank runners.
2. TOTP-enrolled compliance e2e user (identity op on the bank realm).
3. 1000-VU k6 re-run on the bank k3s cluster (NFR is cluster-scoped; single-node Docker
   Desktop measured p95 3.03s at 1000 VU — documented, not a defect).
4. EAS/MDM mobile build (Apple developer account / bank MDM network).
5. **UAT credential hygiene:** the local demo realm was relaxed (password policy
   `length(8)`, `smoke.admin`/`demo1234`) for the demo stack — restore the seeded
   strict policy (`length(12)+special+digit+notUsername`) and issue strong credentials
   before UAT, per the Q3 flip runbook discipline.
6. Live-integration credentials + flips per RB-11A (SMS/NIDW/CIB/rails/CBS/goAML/PKI/BLR).

**Bank-calendar G5 items:** PKI via bank CA/HSM, goAML BFIU portal acks, BRPD
circular-Annex boundary diff with bank compliance's copy, external pen-test,
8-party go-live sign-offs.

**Deliberate deferrals (recorded decisions, not gaps):** multi-tenancy (D3, with two
revisit triggers), Islamic Murabaha (phase 4), outbox→Kafka bridge, websockets.

## Verdict

**The production build stage is complete.** Everything that can be built, developed, or
implemented with the current dependencies is built, tested, and committed. What remains
is deployment execution (bank infrastructure access, credentials, calendar) — tracked
in the lists above and in `docs/runbooks/RB-11A-uat-flip-runbook.md` and
`docs/g5-evidence/g5-go-live-checklist.md`.

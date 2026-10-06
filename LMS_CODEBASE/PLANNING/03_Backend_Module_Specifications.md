# 03 — Backend Module Specifications

**Doc:** PLAN-003 · v1.0 · 2026-09-27 · Owner: Lead System Developer
**Notation:** each module lists Responsibility · Key APIs (see 05 conventions) ·
Domain tables (04) · Workflows (engine per 01) · Fineract usage · Tests focus.

---

## mod-customer (Area A — mirrors prototype A1–A3)

**Responsibility:** single customer truth for the UI: CIF register mirror,
KYC/e-KYC status, screening/dedupe, document ownership, lifecycle actions.
**APIs:** `GET/POST /customers`, `GET /customers/{cif}` (360 aggregate),
`POST /customers/{cif}/kyc-refresh`, `POST /customers/{cif}/screen`,
`POST /customers/{cif}/merge-duplicate`, `POST /customers/{cif}/lifecycle`.
**Tables:** `customer` (mirror + bn names + segment), `kyc_check`, `screening_hit`,
`customer_merge_log`.
**Fineract:** create/update **client**; client identifiers (NID/TIN/mobile);
documents metadata (files in MinIO).
**Integration:** NIDW verify via mod-integration port (async, status machine
`PENDING→VERIFIED/REJECTED/ERROR` with retry + officer fallback).
**Workflow:** e-KYC refresh (7-day), blacklist entry requires maker-checker.
**Tests:** dedupe decision table (NID/DOB/name proximity), merge idempotency,
NID adapter failure fallback, audit completeness.

## mod-origination (Area B — B1–B4)

**Responsibility:** application intake wizard persistence, product eligibility,
documents/CPV, sanction letters.
**APIs:** `POST /applications` (idempotent draft/submit), `GET /applications`
(filter: stage/branch/officer/pill), `GET /applications/{id}` (detail incl.
workflow state), `POST /applications/{id}/documents`, `POST /applications/{id}/cpv`,
`POST /applications/{id}/submit` (validation gate + ladder start).
**Tables:** `application` (snapshot of customer/product/amount/tenor/DBR at each
stage), `application_document`, `cpv_visit`, `sanction_letter`.
**Fineract:** on approval→ create **loan account** from product template;
charges; collateral linking (with mod-assessment).
**Workflow:** 9-stage pipeline (Screening→…→Disbursed) exactly as prototype;
stage transitions emit events; SLA timers per stage.
**Tests:** wizard submit contract (Zod↔DTO parity), stage machine legality,
document virus-scan failure path, autosave draft merge.

## mod-assessment (Area C — C1–C4)

**Responsibility:** CIB bureau pull/parse (monthly fixed-width + real-time),
internal score card, DBR computation, appraisal memo, collateral registry.
**APIs:** `POST /assessments/cib/{cif}` (async pull → status), `GET /assessments/cib/{cif}`
(parsed facilities + history), `POST /assessments/{applicationId}/score`,
`POST /assessments/{applicationId}/dbr`, collateral CRUD + valuation/insurance
tracking.
**Tables:** `cib_report` (raw + parsed JSONB), `cib_facility`, `score_result`,
`collateral`, `collateral_valuation`.
**Fineract:** read client exposure; write collateral data for secured loans.
**Integration:** CIB adapter (11): FTP file watcher + real-time API; both
produce identical internal events; parser is pure + table-tested against
fixture files (24-month rhythm as in prototype).
**Tests:** parser fixtures (golden files incl. malformed rows), DBR formula
per policy matrix (prototype calculator is the oracle), score versioning.

## mod-approval (Area D — D1–D3)

**Responsibility:** the 7-level ladder (L1 ≤৳5L … L7 MD >৳10Cr), maker-checker,
sanction generation, dual-authorized disbursement readiness.
**APIs:** `GET /approvals/my-inbox`, `POST /approvals/{taskId}/act`
(`approve|reject|return|escalate` + remark, idempotent), `GET /approvals/ladder/{applicationId}`,
`POST /disbursements/{applicationId}/prepare`, `POST /disbursements/{id}/authorize` (2nd officer),
`POST /disbursements/{id}/release`.
**Tables:** workflow engine tables (01) + `sanction_letter`, `disbursement`,
`dual_authorization`.
**Workflows:** ladder definition data-driven (amount bands from config table —
bank-tunable, not code); every action audit-logged with maker/checker ids;
return-to-maker loops allowed once per stage.
**Fineract:** loan approval + disbursement execution via adapter (transactional
outbox ensures exactly-once against Fineract with reconciliation job).
**Tests:** ladder routing decision table (band boundaries ±৳1), dual-auth
invariant (no single-user release — enforced in service + ArchUnit), concurrency
(two approvers same task).

## mod-servicing (Area E — E1–E4)

**Responsibility:** payments, schedules/statements, reschedule/restructure,
early settlement, tax certificates.
**APIs:** `POST /loans/{id}/payments` (idempotent by external ref), `GET /loans/{id}/schedule`,
`GET /loans/{id}/statement` (paginated PDF-ready), `POST /loans/{id}/reschedule-request`,
`POST /loans/{id}/settle-quote`, `GET /certificates/tax/{year}`.
**Tables:** `payment` (mirror + rail ref), `statement_run`, `reschedule_request`,
`settlement_quote`.
**Fineract:** transactions (repayment/fee/waiver), schedule regeneration,
restructuring where supported (else shadow ledger + reconciliation).
**Integration:** rails callbacks (bKash/Nagad/BEFTN per 11) → payment intake.
**Tests:** exactly-once with duplicate callback storm, schedule regeneration
after reschedule, settlement quote math (penalty/rebate policy), statement
pagination + CSV parity.

## mod-collections (Area F — F2–F4)

**Responsibility:** DPD engine (read model), bucket worklists, contact
strategy/PTP, field tasks to mobile, recovery & legal case tracking.
**APIs:** `GET /collections/worklist` (bucket/priority/propensity sort — the
prototype board), `POST /collections/{loanId}/actions/call|sms|visit|ptp`,
`POST /collections/ptp` (promise date+amount+confidence), `GET /collections/ptp/calendar`,
legal case CRUD.
**Tables:** `collection_action`, `ptp` (kept/broken derived), `field_task`
(sync contract for Expo app), `legal_case`.
**Fineract:** read arrears; write adjustment transactions on resolution.
**Workflows:** dunning ladder (SMS→call→visit) as timers on `collection_action`;
PTP kept/broken updates classification inputs.
**Tests:** DPD boundary dates (30/60/90/180/365), PTP state machine, offline
sync conflict rules (server-wins for status, append-only for evidence).

## mod-compliance (Areas F1/G3 — BRPD engine + regulatory pack)

**Responsibility:** nightly BRPD 15/2024 classification, provisions, interest
suspense, CL-1..CL-5 pack, CIB report generation, regcon calendar, Basel CAR
inputs, IFRS-9 ECL runway fields.
**APIs:** `POST /compliance/eod/run` (operator trigger, also scheduled), `GET /compliance/classification`
(board data), `GET /compliance/returns`, `POST /compliance/returns/{code}/generate`,
provision calculator endpoint (policy oracle shared with frontend).
**Tables:** `classification_history`, `provision_run`, `regulatory_return`,
`ecl_snapshot`.
**Logic:** stage rules data-driven exactly as prototype table (STD-0 0d/1% …
B/L >365d/100%); migration list + JV queue to Fineract GL; interest suspense
from SS onward; EOD idempotent per (loan, run-date) with rerun semantics.
**Tests:** golden classification suite over seeded portfolio (26 prototype
loans as fixtures), EOD rerun idempotency, JV reconciliation zero-sum.

## mod-integration (all external systems)

**Responsibility:** ports & adapters (hexagonal): `CibPort`, `NidPort`,
`SmsPort`, `PaymentRailPort`, `CbsPort`, `FineractPort`; outbox dispatcher with
per-adapter retry policy & circuit breaker; mock implementations for DEV.
**Tables:** `outbox_event`, `integration_log` (every external call: request
hash, response code, latency — no PII payloads, references only).
**Tests:** contract tests per adapter (WireMock + Fineract Testcontainer),
dispatcher at-least-once + dedupe, circuit-breaker state transitions.

## mod-platform

**Responsibility:** role/branch scoping (sync from Keycloak), config + feature
flags, audit (append-only, hash-chained, WORM export), scheduled jobs
(ShedLock), reporting query services (read model), notification templates
(bilingual), holiday calendar.
**APIs:** `/platform/config`, `/platform/audit` (search/export), `/platform/jobs`
(status/rerun), `/platform/notifications`.
**Tests:** audit hash-chain tamper detection, role matrix (personas from
prototype = realm roles), flag rollout semantics.

---

## Product & Variant Coverage (BRD/prototype requirements that span modules)

The prototype ships 8 product families — including **Islamic Murabaha**,
**Krishi (agri)**, SME working-capital and education loans — and the BRD
targets 10 Islamic banks. Products are therefore **configuration, not code**:

| Variant | Where implemented | Notes |
|---|---|---|
| Islamic Murabaha / Sharia modes | mod-origination product config + Fineract product templates | profit-rate markup instead of interest; language fields switch (রফজার/মুরাবাহা labels per prototype); no interest-bearing GL accounts — profit accrual mapping in mod-servicing; reviewed by bank Sharia board where applicable |
| Krishi / agri lending | product config + seasonal schedule support | harvest-cycle repayment schedules (irregular EMI calendar) in mod-servicing; crop/collateral fields in mod-assessment |
| Floating rate (BLR + spread) | mod-servicing rate engine | `rate_type ∈ {fixed, floating}`; BLR (base lending rate) is a dated config row in mod-platform; spread on product; re-priced EMI recomputation + customer notification on BLR change (prototype wizard exposes this option) |
| Collateral LTV | mod-assessment collateral registry | LTV policy per product (e.g., commercial property 62% — prototype value); valuation ≤ 1 year rule; insurance-expiry enforcement; breach ⇒ approval-condition task |
| Watchlist | mod-collections + mod-compliance | internal watch list (pre-SMA early-warning accounts + manually added) with reason codes, review cadence, and graduated-dunning trigger; feeds the prototype's Watchlist group screens |
| Education / clean loans | product config | no-collateral path with guarantor fields |

**Rule:** a new product family must be launchable by configuration + report
template only — if it needs code, that's a defect in this design (ADR-009).


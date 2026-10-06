# ULMS — Business Logic, Rules & Algorithms: Comprehensive Reference and Codebase Status

**Document ID:** BL-001 · **Version:** 1.0 · **Date:** 2026-10-02
**Project:** Unisoft Loan Management System (ULMS) v2.0 — Bangladesh banking
**Prepared for:** Development team, compliance, and audit
**Classification:** Internal

**Purpose.** This document is the single consolidated reference for (a) every business rule, calculation, threshold, and algorithm the ULMS is *required* to apply — traced to its requirement source — (b) *how* each is implemented in the present codebase (file + test evidence), (c) the implementation **status** of each rule, and (d) best-practice recommendations and external regulatory cross-checks.

**Method.** Three research passes were merged:
1. **Requirements sweep** of the full workspace corpus (BRD, URD v1/v2, SRS, Compliance Matrix, RFP summary, research report, the Unisoft product suite, the 401-doc implementation-guide suite, and the 14-doc `LMS_CODEBASE/PLANNING/` binding plan).
2. **Code extraction** from `LMS_CODEBASE/apps/api` (21 controllers, 29 test suites / 120 green tests), `apps/web` (mock API + prototype-parity UI), and `apps/mobile` (sync engine).
3. **External verification** via web research against Bangladesh Bank circulars/summaries, BFIU guidance, IFRS-9 roadmap reporting, and lending-industry algorithm best practices.

**Authority order for conflicts** (per PLANNING/00 §8): `Compliance_Validation_Matrix.md` (regulatory truth) → SRS v2 (behavioral) → PLANNING suite (build) → `Front_end/` prototype (UX contract) → Technology Stack v3 (binding stack).

---

## 1. Requirement Corpus Map (what was found and used)

| Artifact | Path | Role |
|---|---|---|
| BRD v1.0 | `Business_Requirements_Document_LMS.md` | Business requirements (30 KB) |
| URD v2.0 (+ v1) | `User_Requirements_Document_v2.md`, `User_Requirements_Document_LMS.md` | User/UX requirements incl. accessibility App D |
| SRS v2.0 | `Software_Requirements_Specification.md` | Functional + NFR spec |
| Compliance Matrix | `Compliance_Validation_Matrix.md` | RFP/BRD 100% compliance verification — regulatory truth |
| RFP summary + full RFP | `LMS_RFP_Summary.md`, `LMS_RFP_Bangladesh_Banking.docx` | Bank-issued requirements |
| Market research | `LMS_Research_Report.md`, `LMS_OpenSource_Analysis_Report.md` | Market + CIB mandate detail |
| Product suite | `Unisoft Loan Management system/*.md` (ULS-01..WP), `The products/*.md` | Product catalogue, case study, white paper |
| Implementation guide (401 docs) | `project_implementation_guide_document/Phase_0..Phase_08/*` | Advisory deep-dives: BA banking-domain training, BRPD algorithm design, CIB/NID specs, DMN tables, SLA monitoring, RBAC matrix, Basel guide, SMS gateway, ECL model, scoring algorithm |
| Binding build plan | `LMS_CODEBASE/PLANNING/00..12_*.md` | The 14-doc build source-of-truth (supersedes guide-suite architecture) |
| UX contract | `Front_end/` (validated prototype, 166 screens) | Binding UX |
| Audit trail | `audit/plan/` (forensic audit + R1–R9 master plan + status ledger) | Built-state evidence |

---

## 2. Cross-Cutting Platform Invariants (apply to every domain)

| Rule | Requirement source | Implementation | Status |
|---|---|---|---|
| **Money = BIGINT minor units (poisha)**; floats/doubles banned in money code; API carries integer minor + `"currency":"BDT"`; Lakh/Crore display is client-only | PLAN-04 §2, PLAN-05 §6 | `BIGINT` columns; integer-only money types throughout (the float ban is a coding convention — not yet codified as an ArchUnit rule); web formats via `Intl` | ✅ Implemented (convention; ArchUnit codification pending) |
| **Single EMI oracle** — one backend formula is authoritative; frontend mirrors via fixtures (৳0.01 tolerance); invariant Σprincipal = principal | PLAN-09 §3 | `platform/MoneyMath.emiMonthly`; web mirror + unit parity tests; `emiMonthly` NaN-at-zero-rate bug found & fixed (R1) | ✅ Implemented + tested |
| **Idempotency** — `Idempotency-Key` (UUID) mandatory on money-moving POSTs; 48 h replay window with request-hash; external refs (rail UTRs, CIB file ids) unique-constrained; replays return original + `Idempotent-Replay: true` | PLAN-05 §4 | `platform/idempotency/IdempotencyService`; UTR unique constraint (P3); 10-callback storm e2e → exactly one posting + 9 replays | ✅ Implemented + e2e-proven |
| **Transactional outbox (ADR-004)** — events written in the SAME transaction as the state change; relay fans out at-least-once; consumers idempotent by (type, aggregateId)/(type,cif,body) | PLAN-01 ADR-004 | `platform/outbox/OutboxService` (+`@NamedInterface` exposure); writers at submit/approve/disburse/payment/write-off/recovery/guarantor/partner; ops relay page; `OutboxServiceTest` | ✅ Implemented + tested |
| **Append-only, hash-chained audit** — `audit_entry` with actor/action/aggregate/JSONB payload (PII-masked)/requestId/IP; `hash(prev_hash + payload)`; daily WORM anchor export, 10-y retention | PLAN-06 §3 | Hash-chained `audit_entry` (computed in `AuditService`); every mutating endpoint audited. ⚠️ the *daily WORM anchor export* is documented design (entity javadoc) — the scheduled export job is not yet coded | 🟡 Hash chain ✅; anchor-export job pending |
| **Maker-checker / dual control** — sensitive actions need a second authorized actor; regcon needs preparer→checker→compliance as 3 distinct officers | PLAN-06 §3, CB-README G4 | `ApprovalService` ladder; regcon sign-off chain (distinct-officer 409s); disbursement prepare→authorize→release; product maker-checker; write-off propose→approve | ✅ Implemented + tested |
| **Optimistic concurrency** (version column, 409 on mismatch); RFC 9457 problem+json with stable codes + bilingual field messages | PLAN-05 §2–3 | Version columns; problem+json error model; EN/BN message fields | ✅ Implemented |
| **Bilingual data + one-language-per-element** — `name_en`/`name_bn` columns; strict i18n separation with CI zero-Bengali-glyph assertion in EN mode | PLAN-04 §2, PLAN-07 §6 | Bilingual columns; i18n separation Playwright suite (EN invariant green) | ✅ Implemented + CI |
| **Branch scope** — officers see own-branch data only | PLAN-06 §1, PLAN-05 §5 | `branch-scope-required: true`; scope claim filter; matrix-tested | ✅ Implemented |
| **Two-schema Postgres** — `fineract` (writes only via Fineract REST, never altered) + `ulms`; nightly reporting snapshot post-EOD | PLAN-04 §1/§5 | Two schemas; `ulms_readonly` reporting role; `ulms_rpt` snapshot job | ✅ Implemented |

---

## 3. Customer / KYC / e-KYC

**Required rules** (BRD 6.1.2; URDv2 UR-LOS-001/004; BA-TRAIN §6; PLAN-06 §4; NID-FLOW):
- NID format: old 13-digit / smart 17-digit (`^(\d{13}|\d{17})$`).
- e-KYC 6-step flow: NID entry → NIDW verify + auto-populate → photo match → SMS OTP → document capture → KYC complete. NID verify SLA **< 5 s**; failure → officer fallback (never a dead end).
- Name matching: normalize + Levenshtein, accept ≥ 85% similarity; DOB exact or reject; NIDW down → officer fallback; PENDING→VERIFIED/REJECTED/ERROR state machine.
- PII: ULMS stores masked NID + verification reference only; full NID field-encrypted inside Fineract identifiers; photos/GPS in MinIO via short-TTL signed URLs.
- KYC refresh: high-risk 1 y / medium 2 y / low 3 y. Dedupe on NID with merge workflow (idempotent). Upload limits: NID ≤ 5 MB, photo ≤ 2 MB, income proof/bank statement ≤ 10 MB, property ≤ 20 MB; virus scan before save.
- Statutory doc checklist: NID both sides, photo, income proof, bank statement 6–12 mo, TIN, trade license (business), property docs (secured), insurance.

**Implementation & status:**
- ✅ Customer module (`customer/`): creation with segment/mobile/branch; `KycCheck` records NID verification; `NidPort` mock (13/17-digit rules) + live `NidwAdapter` (2 s timeout, 1 retry inside the 5 s SLA, error→officer fallback — profile `nid-live`); NID masked in projections (PTP-phone-style masking pattern shared).
- ✅ Documents: `ApplicationDocument` with sha256 checksum + `ScanPort` (pass-through default, ClamAV live under `av-live`, fail-closed PENDING + quarantine).
- ✅ Screening: `ScreeningPort` + `ScreeningHit` persistence (onboarding hook armed); list-file adapter (`ScreeningListAdapter`, diacritics-folding normalize) behind `screening-live`.
- ⚠️ **Partial:** OTP at onboarding, auto-save-every-30 s UX niceties, biometric photo-match, KYC-refresh cyclical jobs, and customer-merge endpoint exist in requirements/UX but are **not yet built** (mock/web have form-level flows; Java merge-duplicate is not implemented).
- Best practice: keep NID as the national dedupe key; never log full NID (already CI-enforced).

---

## 4. Credit Assessment, Scoring & Affordability

**Required rules** (BRD 5.2; URDv2 UR-CIB-002/UR-DBR-001; SRS 3.2; SCORE-ALGO; DMN; WF-SPEC §11):
- Scorecard weights (canonical): Customer Profile 20% · Financial Capacity 30% · Credit History (CIB) 25% · Collateral 15% · Business risk 10%.
- **DBR = (existing EMIs + CIB obligations + proposed EMI) / monthly income × 100; hard cap 50%** — submit blocked above 50%; gauge green < 40 / yellow 40–50 / red > 50. (External check: Bangladesh Bank *Prudential Regulations for Consumer Financing*, PPG Guideline No. 15 — 50% DBR is the standard bank cap.)
- DTI < 40%; DSCR (business): > 1.50 approve / 1.25–1.50 standard / 1.00–1.25 with conditions / < 1.00 reject.
- Pre-approval hard rules: active CIB DEFAULTER/WRITTEN_OFF/BLACKLIST → reject; write-off within 36 months → reject; > 6 inquiries/12 mo → review; age < 21 or > 60 → reject; DBR > 50% → escalate or decline.
- Fast-track (STP): existing customer ≥ 12 mo, score ≥ 750, DPD 0, Personal/Auto only, ≤ pre-approved limit (৳5 L / 3 L / 1 L by tier), TAT < 30 min.

**Implemented algorithm** — `assessment/ScoringPolicy.java` (versioned scorecard v-pilot), server-side only:
```
score = 500 base
  + CIB class points:   STD-0/NONE +30 · STD-1/2 +20 · SMA 0 · SS −60 · DF −120 · B/L −200
  + DBR band:           ≤30% +80 · ≤40% +60 · ≤50% +30 · >50% −150
  + collateral cover:   ≥100% +60 · ≥50% +30 · else 0
  + tenor:              ≤36 m +20 · ≤60 m +10 · else 0
clamp 300..900 → grade A ≥760 / B ≥660 / C ≥560 / D else
decision: (DBR > 50% OR grade D) → AUTO_DECLINE · grade A → AUTO_PASS · else REFER
```
- DBR computed by `MoneyMath.dbrPercent` from stored income + parsed CIB obligations + EMI oracle; every scoring run persisted with factor breakdown JSON (`score_result`) + audit row.
- 9-stage pipeline: submit → CIB_PULL → **SCORING** (auto-decline rolls back to SCREENING with score persisted) → CPV officer gate → ladder.

**Status:** ✅ Core implemented + golden-tested (`AssessmentServiceTest`, boundary e2e). ⚠️ Not yet built: risk-based *pricing* (rate premium by grade), STP fast-track lane, DSCR business scoring, what-if simulator, score-override-with-justification UI. Best practice (external): production scorecards should be statistically calibrated (score = offset + factor·ln(odds), PD per band, cut-offs by marginal economics) — the current rule-based scorecard is a deliberate pilot calibration; EclModel already reserves the PD runway.

---

## 5. CIB (Credit Information Bureau)

**Required rules** (CIB-SPEC; BRD 3.2; BA-TRAIN §5; PLAN-11 §1):
- Score bands: 750–900 approve-standard · 650–749 approve · 550–649 approve-with-conditions · 400–549 reject-or-secure · 0–399 reject · −1 no-history → manual.
- SLAs: individual inquiry < 3 s/5 s; user-facing < 2 min; batch 10 K records < 30 min; cache hit > 80%; rate limit 100 req/min.
- Retry matrix: rate-limit → **no retry** (requeue w/ backoff); 5xx/timeout → exponential retry; cert error → fail fast + ops alert (RB-05); outage evidence COMMITS while caller gets typed 409.
- Fixed-width batch (Subject/Contract data) due **7th of month**; report layout HDR/SUBJ/FACL/TRLR; 24-month payment history; inquiry purpose + application ref mandatory; every inquiry audit-logged; parsed CIB purged on 24-month rolling basis.

**Implementation:** ✅ Mock adapter (deterministic fixed-width generator — same parser as live), `CibOnlineAdapter` (mTLS env-keystore, Caffeine 1 h cache, Resilience4j retry on the proxied entry: 1+3 attempts exponential, 429 typed non-retryable, outage fallback → `CibOutageException`; WireMock contract test pins 200+cache / 429-once / 5xx×4 / flaky-recover); parser feeds scoring DBR + worst-classification; guarantor attach CIB snapshot (aml module); RB-05 evidence-commits path (`noRollbackFor CibPullFailedException`). ⚠️ Not built: monthly batch upload file generation (regcon CL feeds cover related reporting; CIB batch writer is a UAT-window item), circuit-breaker instance is documented config (values in compose example) but not yet activated in app config.
- **Corpus contradiction:** cache TTL 1 h (SRS/BA-TRAIN/live adapter) vs 24 h (CIB-SPEC) — resolved to 1 h (SRS authority).

---

## 6. Approval Ladder & Workflow

**Required rules** (BRD 6.3.1; URDv2 7.1; WF-SPEC; RBAC; locked by audit decision D2):
- **7-level ladder (bank-tunable data config, not code)**: L1 Branch Credit Head ≤ ৳5 L · L2 Branch Manager ≤ ৳10 L · L3 Regional Manager ≤ ৳25 L · L4 Head of Credit ≤ ৳1 Cr · L5 Credit Committee ≤ ৳5 Cr · L6 Deputy MD ≤ ৳10 Cr · L7 MD > ৳10 Cr.
- SLA per level (standard/urgent/auto-escalate): L1 4 h/2 h/6 h … L7 72 h/48 h/96 h; breach scan every 15 min; SLA+50% auto-escalates.
- Actions: APPROVE / APPROVE_WITH_CONDITIONS / REJECT / RETURN / DELEGATE / ESCALATE / HOLD; self-approval banned; sequential levels; delegation same-level only, ≤ 30 days.
- State machine: DRAFT→SUBMITTED→UNDER_REVIEW→(RETURNED|REJECTED|L1..L7)→APPROVED→PENDING_DISBURSEMENT→DISBURSED→ACTIVE.

**Implementation:** ✅ Data-driven `approval_band` seed (V2) + DB-backed workflow engine (`platform/workflow/WorkflowService`: nodes, transitions, dual-phase flags, versioned definitions); exact-rung enforcement (7×7 role matrix `SecurityLadderMatrixTest` + admin bypass + non-ladder denial + multi-role delegation); RETURN reopens previous node; L1 maker-checker dual phase; boundary tests at every band ±1 (`LadderBoundaryTest`); web mirrors role→rung map with unit parity tests + 🔒 affordances. ⚠️ Not built: per-level SLA timers + breach escalation job, DELEGATE/ESCALATE actions, conditional-approval condition-tracking that blocks disbursement (types listed in spec), PKI digital signatures (L4+).
- Note: `approval_band` tops as implemented (L4 ≤ ৳50 L, L5 ≤ ৳2.5 Cr) diverge from BRD text (L4 ≤ 1 Cr, L5 ≤ 5 Cr) — the seed is **bank-tunable configuration**; align the seed with the bank's delegation-of-authority letter at UAT (see §14 contradictions).

---

## 7. Sanction Letters & Disbursement

**Required:** bilingual auto-generated letters on approval; tokenized acceptance; ≤ 10 s/PDF; pre-disbursement 7-gate checklist (sanction issued, agreement signed, collateral registered, insurance valid, legal opinion, CBS limit loaded, first-EMI date) — override needs dual auth; disbursement methods incl. real-time rails; **dual authorization: prepare(A) → authorize(B≠A) → release(C∉{A,B})**; CBS via SAGA with compensation; no card PAN in ULMS (redirect model).

**Implementation:** ✅ `sanction/` module (bilingual bodies, crypto-random acceptance token, supersede semantics with partial unique index); ✅ disbursement stepper with 409-on-same-actor dual-auth (service + ArchUnit rule); ✅ Fineract loan creation on approval (`FineractLoanPort`), Fineract repayment posting in-tx with loan mirror; ✅ disbursement checklist in prototype/web + mock. ⚠️ Not built: PDF render pipeline (HTML bodies now), insurance-expiry tracking, BEFTN batch writer (Finacle adapter provides the CBS rail for GL/limits at UAT).

---

## 8. Amortization, EMI, Schedules & Products

**Required rules** (ULS-01 §5; SRS PL-001; FIN-PROD; PLAN-03; BA-TRAIN §9):
- Reducing-balance EMI standard: `EMI = P·i·(1+i)^n / ((1+i)^n − 1)`, `i = rate/12`; flat-rate and custom methods supported per product.
- Versioned no-code product engine (ADR-009: a product family launches by configuration only): amount/tenor bounds, rate type fixed|floating with BLR + spread, frequency, amortization method, fees (processing %, late-fee fixed), prepay penalty, security rules (collateral/guarantor/LTV caps), arrears ageing, grace.
- Statement JSON + byte-parity CSV; tax certificate per year/cif; daily interest; schedule regeneration on reschedule; moratorium capitalizes interest; top-up merges schedules.
- Settle-quote oracle: **2% lock-in penalty if < 6 installments paid; 50% rebate of unearned interest if ≥ 12 paid; quote valid 7 days.**

**Implementation:** ✅ `MoneyMath.emiMonthly` (BigDecimal, HALF_UP, exact formula — matches the industry-standard reducing-balance formula); ✅ schedule from the shared oracle (Σprincipal invariant tested); ✅ statements JSON+CSV byte-parity (audited); ✅ reschedule with officer decision regenerating tenor; ✅ product engine `product/` (versioned maker-checker lifecycle, eligibility oracle incl. EMI parity, one-live-version rule — `ProductServiceTest`); ✅ settle-quote policy implemented exactly (2% / 50% / 7-day validity — `ServicingJourneyTest`); ✅ floating fields exist (`rate_type`, `spread_bp`). ⚠️ Not built: BLR dated-config + re-price-on-change job, flat/Murabaha profit methods, moratorium/top-up flows, tax-certificate PDF.
- Best practice: amortization rounding is kept at integer-minor with a single final-installment adjuster (schedule invariant enforces it) — keep day-count simplification (monthly annuity) documented for UAT sign-off vs the bank's exact convention.

---

## 9. Payments, Rails & Webhooks

**Required** (URDv2 UR-SERV-001; PLAN-05 §7; PLAN-11 §3): allocation EMI→interest+principal; partial pro-rata; excess hold-or-refund; posting < 1 min; refunds are dual-authorized workflows (never automatic); rails bKash/Nagad/Rocket/BEFTN/card-via-PSP; webhook HMAC-SHA256 over `timestamp.body` ± 5 min; settlement-file recon with `RECON_MISMATCH` alerts.

**Implementation:** ✅ `PaymentService` counter posting idempotent by externalRef; webhook intake idempotent by UTR (10-callback storm → 1 posting + 9 replays, e2e-proven); ✅ HMAC verifier (unsigned→401, stale→403, secret-missing→503 fail-closed); ✅ `SandboxRailAdapter` + live `BkashRailAdapter` behind `rails-live`; ✅ recon job + mismatch alerts; ✅ close-at-zero + DPD heuristic update in the same transaction as the Fineract repayment. ✅ Portal payment initiation via rail redirect (no card data).

---

## 10. Collections, Dunning & PTP

**Required** (ULS-01 §6.1; URDv2 UR-COLL-001/002; PLAN-03): dunning ladder timers Day 1 SMS → Day 7 call → Day 15 visit → Day 30 strategy → Day 60 legal-notice prep → Day 90 NPA+recovery; DPD buckets 1–30/31–60/61–90/90+; worklist priority P1/P2/P3 with **broken-PTP propensity boost**; PTP kept/broken machine with payment evidence; **PTP phone masked everywhere**; watchlist pre-SMA; legal-case tracking; recovery/auction management; collection efficiency target 85–90%.

**Implementation:** ✅ `DunningLadderService`: `stepFor(dpd)` → SMS (1–30) / CALL (31–90) / VISIT (> 90), cadence 7 d (14 d visits), nightly 06:00 queue, PENDING-PTP suspension, AUTO_QUEUED→resolved outcome flow (audited); ✅ worklist `P1 broken-PTP / P2 DPD>90 / P3` (`CollectionsService`); ✅ PTP state machine + evidence + masking (parity-tested); ✅ field tasks server-wins sync (mobile); ✅ legal-case status flow (web/mock). ⚠️ Simplification: the implemented 3-rung ladder (SMS/CALL/VISIT) compresses the spec's 6-step ladder — configurable rungs are a config-driven follow-up; watchlist early-warning list not yet a distinct artifact.

---

## 11. BRPD 15/2024 — Classification & Provisioning (THE compliance core)

**Required 7-stage matrix** (BRD 6.6.2; URDv2 UR-COLL-003; SRS 3.4.1; BA-TRAIN §4; boundary locked to 365 by decision D2; circular effective for loans from April 1, 2025):

| Stage | DPD | Provision | Interest | Action |
|---|---|---|---|---|
| STD-0 Current | 0 | 1% | accrual | normal monitoring |
| STD-1 Watch | 1–30 | 1% | accrual | increased monitoring |
| STD-2 Caution | 31–60 | 1% | accrual | review |
| SMA | 61–90 | 5% | accrual | collections push |
| SS Substandard | 91–180 | 20% | **suspense** | intensive recovery (NPA starts) |
| DF Doubtful | 181–365 | 50% | suspense | legal action |
| B/L Bad/Loss | > 365 | 100% | suspense + interest write-off | write-off process |

- **DPD algorithm**: days from the oldest unpaid overdue installment due date to the run date (0 if none); `dpd = max(0, rawDpd − graceDays)` variant.
- **EOD batch**: daily, idempotent per (loan, run-date) with safe rerun; classification_history rows; provision deltas → GL JV **zero-sum, idempotent per run-date**; board read-model refresh; duration alert > 45 min; ≤ 30 min @ 500 K loans.
- **Overrides**: legal proceedings → ≥ SS; bankruptcy → B/L; rescheduled performing ≤ 6 mo → keep stage else downgrade one; COVID-type relief → DPD adjustment.
- **Interest suspense**: SS/DF/B/L stop P&L accrual; memorandum accounts; reversal on cure; B/L writes off interest.
- CL-1..CL-5 monthly pack + Scheduled Items (5th) + Large Loans (10th) + NPL summary (15th).

**Implementation:** ✅ `BrpdClassifier` — exact decision tree with boundary tests ±1 at 30/60/90/180/365 + monotonicity property test; provisions in bp (1/1/1/5/20/50/100%); ✅ `EodBatchService` — nightly 23:30 + operator trigger, per-run-date idempotency with rerun semantics, classification_history, provision JV zero-sum to Fineract GL (`ProvisionJvService` — reversal entry required on rerun deltas); ✅ golden suite over the seeded 7-class demo portfolio (one loan per BRPD class — `EodBatchGoldenPortfolioTest`); ✅ classification board (web) with 7-class cards + shared provision oracle for frontend parity; ✅ interest-suspense flag on SS+ (loan mirror). ⚠️ Not built: explicit override rules (legal/bankruptcy/reschedule-stage-retention) as automated pre-classification adjustments; memorandum-account GL mapping for suspense buckets.
- **External cross-check:** BRPD Circular No. 15 (27 Nov 2024) is the primary source (bb.org.bd PDF; captcha-gated from this machine). Secondary summaries agree on the framework (Standard/SMA/SS/DF/B-L with tightened DPD) but **disagree on exact boundaries** (some quote SMA at 2–3 months, SS at 3, DF at 6–12 mo — legacy matrices). The project's matrix is RFP-specified and locked by D2/golden tests. **Action for UAT: bank compliance must diff the implemented table against the circular's official Annex before go-live** (a config change if boundaries differ — the classifier is table-driven).

---

## 12. IFRS-9 / ECL (runway to December 2027)

**Required** (ECL-MDL; BRD 9.2; BA-TRAIN §7): 3-stage model — Stage 1 performing → 12-month ECL; Stage 2 SICR (DPD > 30, watchlist, restructured) → lifetime; Stage 3 impaired (SS/DF/B-L) → lifetime; `ECL = PD × LGD × EAD` (+discount); pilot PD calibration by class; lifetime PD `1−(1−pd)^years`; parallel run with BRPD; ≥ 5 y history; snapshots.

**Implementation:** ✅ `EclModel` — BRPD→IFRS stage mapping (1: STD-0/1 · 2: STD-2/SMA · 3: SS/DF/B-L), PD table by class in bp (100…9000), LGD 45% pilot, `eclMinor = EAD×PD×LGD` clamped [0, EAD], `MANDATORY_FROM = 2027-12-31` + runway-months calculator; ✅ `EclSnapshot` persistence + portfolio roll-up; table-tested. ⚠️ Deliberately simplified (marked in code): macro forward-looking scenarios, discounting, and bank-calibrated PD/LGD are the UAT-window work — fields and hooks exist so Dec 2027 is assembly-only.
- **External cross-check:** Bangladesh Bank announced ECL-based classification Jan 2025 ([BRPD letter](https://www.bb.org.bd/mediaroom/circulars/brpd/jan232025brpdl03e.pdf)), issued detailed IFRS-9 implementation guidance March 2026 ([BRPD 06/2026](https://www.bb.org.bd/mediaroom/circulars/brpd/mar082026brpd-106e.pdf)) targeting 2027 sector adoption, investment securities by Jan 2029 ([BSS](https://www.bssnews.net/business/366937)) — consistent with the code's Dec-2027 runway.

---

## 13. Basel III / CAR (reporting runway)

**Required** (BASEL guide; RFPS): CAR target 12.5% (2026); CET1 4.5%+2.5%; leverage ≥ 3%; LCR ≥ 100%; risk weights (govt 0%, bank 20%, mortgage 35%, retail 75%, SME 75–100%, corporate by rating 20–150%, **SS 150/DF 200/BL 250%**); `RWA = Exposure × RW × (1−CRM)`; off-BS CCF 20–100%; op-risk BIA α 15%; **large exposures: single ≤ 15% capital, group ≤ 25%**; SCH-BR-1..6 return calendar.

**Implementation:** ✅ `BaselCar` inputs + CAR computation slice; ✅ reporting read model (`ReportDefinition`, `ReportingService`); ⚠️ risk-weight engine + large-exposure automated checks + SCH-BR pack = **runway** (defined in the Basel guide, not yet coded — feeds from classification + collateral data already exist).

---

## 14. Write-off, Recovery, Guarantors, Collateral/LTV

**Required** (AUDIT-R4; BA-TRAIN §3.3; BRD 9.4; USER-CR §5): write-off only for SS/DF/B-L; propose → committee approve (board band by amount) → GL JV + immediate CIB flag → reversal-with-recovery; recovery ledger with **5% recovery-incentive policy**; BRPD 14/2012 procedures; CL-3/CL-4 feeds. LTV caps: residential 70% · commercial 60% · land 50% · FDR 90% · gold 80%; valuation ≤ 1 y; FSV computation; LTV breach ⇒ approval-condition task; guarantor registry with CIB check at attach.

**Implementation:** ✅ `WriteOffService` (classification gate 409, board band EXEC_COMMITTEE/BOARD, GL ref, CIB flag, reverse+restore); ✅ `RecoveryEntry` with 5% incentive (`WriteOffServiceTest`); ✅ `aml/Guarantor` registry — attach with CIB score snapshot + CLEAR/REFER, BD-mobile validation, outbox event, list per customer (`AmlServiceTest`); ✅ collateral value feeds scoring coverage points; ✅ loan stage `WRITTEN_OFF` (V13). ⚠️ Not built: full collateral registry with valuation/insurance lifecycle tables, auction management, FSV calculator.

---

## 15. BOCC (Branch Credit Committee)

**Required** (BRD 6.1.3; URDv2 UR-BOCC; BOCC-UI): auto-agenda from branch APPROVAL queue; ≥ 3 members to schedule; quorum simple majority; one vote per member per case; majority APPROVE wins; dissent recorded; auto-minutes on close; 24 h + 1 h notices; forward to BM→HO.

**Implementation:** ✅ `bocc/` module end-to-end: schedule (≥ 3 members → quorum = ⌊n/2⌋+1), auto-agenda from pending branch cases, check-in, vote with duplicate-vote 409, close → per-case resolution (majority APPROVE → RECOMMEND_APPROVE else REJECT/HOLD) + auto-minutes + outbox event; ✅ web console; `BoccServiceTest`. ⚠️ 24 h/1 h pre-meeting SMS reminders ride the notification module (trigger scheduling not yet wired).

---

## 16. Regulatory Returns, Regcon Sign-off, Reporting

**Required** (CB-README G4; PLAN-11 §6; BRPD-RPT): 12-return catalog; WORM staging (object-lock + sha256); **preparer → checker → compliance, three distinct officers**; submission calendar; BB SFTP with **PGP sign-then-encrypt**; scheduled upload + count-vs-GL reconciliation; CL-1..5 + scheduled-items/large-loan/NPL cadence; operational report pack; report generation < 30 s.

**Implementation:** ✅ `RegconController` + 12-return catalog + WORM staging/sha256 + distinct-officer sign-off chain + calendar + download; ✅ `BbSftpPgpTransport` (BC sign-then-encrypt, compile+API-verified); ✅ CL renderers (CL-1..4 proven in `ComplianceReturnsTest` incl. zero-sum JV idempotency + drift-block + writer definitions); ✅ reporting read model + statement/CSV outputs. ⚠️ Scheduled SFTP push job + GL-count reconciliation = ops wiring at UAT.

---

## 17. AML / CFT / BFIU

**Required** (PLAN-06 §4; AUDIT-R4; BFIU): CDD at onboarding + periodic (1/2/3 y by risk); EDD for high-risk; PEP/sanctions/adverse-media screening; **STR: no monetary threshold — file on suspicion** (via goAML), descriptive reason (≥ 20 chars enforced), BFIU reference, draft→filed workflow; **CTR threshold ৳10 Lakh cash**; record retention ≥ 5 y (project applies 10-y WORM audit standard).

**Implementation:** ✅ `aml/` module: posture endpoint (CDD/EDD — EDD flips on screening hits), STR filing with ≥ 20-char 422 + `BFIU-` stamped ref + audit (`AmlServiceTest`); ✅ screening port + hit persistence + EDD linkage; ✅ STR drafts appear in posture. ⚠️ Not built: transaction-monitoring rule engine (velocity/structuring detection), CTR generation, goAML export format, PEP list feeds beyond the list-file adapter pattern.
- **External cross-check:** BFIU guidance confirms STR = suspicion-based with no fixed amount, goAML submission, ≥ 5-y record keeping; the ৳10 Lakh threshold applies to CTRs ([BFIU STR guidance](https://www.bfiu.org.bd/pdf/regulationguideline/aml/guidance_str.pdf), [AML Bangladesh overview](https://www.anqacompliance.com/aml-bangladesh-apg)) — matches the corpus and the mock's "structuring just under threshold" demo.

---

## 18. Notifications / SMS

**Required** (SMS-GW; AUDIT-R4; URDv2): SSL Wireless primary (api v3, sender ULMSBK) with fallback-provider chain; bilingual template pairs; lifecycle triggers incl. **EMI D-3 reminder**; delivery receipts; retry w/ backoff for critical; opt-in/out; every send audited.

**Implementation:** ✅ `notification/` module: template-driven rendering with admin upsert (admin-gated); mock seeds 10 templates (APPLICATION_SUBMITTED and APPROVED as EN+BN pairs, remainder EN-only — full BN coverage is an admin data task); outbox consumer renders lifecycle events (APPLICATION_SUBMITTED/APPROVED/DISBURSED/PAYMENT_POSTED/RECOVERY_RECEIVED/SANCTION_ISSUED), delivery log, idempotency by (type, cif, body) (`NotificationServiceTest`, e2e fan-out); ✅ live `SmsGatewayAdapter` (`sms-live`). ⚠️ D-3 scheduled reminder job + provider fallback chain = follow-up.

---

## 19. Partner API Channel & Borrower Portal

**Required** (AUDIT-R5; PLAN-08 Part B): X-Api-Key gate; **60/min token bucket**; Idempotency-Key replay; status poll; HMAC webhooks to partners; portal OTP login + OTP per payment; product bounds enforced; tracker = same workflow projection.

**Implementation:** ✅ `partner/` module (hashed keys, in-memory bucket with continuous refill + 429, idempotent intake, channel=PARTNER tagging, pipeline consistency proven); ✅ portal apply/upload/statement (JSON+CSV parity), tracker = workflow projection, payments via redirect rails. ⚠️ Portal OTP + payment-confirmation OTP + velocity limits not yet built (login is mobile-claim based in pilot).

---

## 20. Mobile Field App & Offline Sync

**Required** (PLAN-08 A3/A4; URDv2 UR-CPV): **server-wins status transitions; append-only evidence; visible conflict banner**; delta pull + 15-min push; presigned photo upload; backoff with jitter; retry cap; form gates GPS < 10 m, photo ≥ 1024 px, person-met, discrepancy ≥ 20 chars, voice ≤ 5 min; app PIN + biometric; cert pinning.

**Implementation:** ✅ Pure-TS sync engine (14/14 vitest): server-wins merge, sha256-deduped append-only evidence, backoff 1/2/4/8/16 s × (0.8+rand·0.4) **crypto-jitter**, 5-attempt cap, terminal states never reprocess (real bug caught by tests); ✅ form gates in CPV screen; ✅ BN/EN; ✅ Keycloak PKCE (pinned env issuer). ⚠️ EAS/MDM packaging + device verification pending (G5 item).

---

## 21. Security, Roles & Audit

**Required** (PLAN-06; SRS 7.x; RBAC): Keycloak 26 OIDC + PKCE; MFA (TOTP) for officers; 11 realm roles + branch scope; sessions 15-min idle/8-h absolute; password ≥ 12 chars, lockout 5/15 min; TLS 1.3; AES-256 at rest; mTLS to Fineract/CIB; hash-chained audit + WORM; OWASP ASVS L2; SAST/DAST/secret-scanning in CI.

**Implementation:** ✅ Web auth (OIDC auth-code + PKCE S256, silent refresh, StaffGate, dev persona modes); role model mirrors Java contract exactly (STAFF_ROLES URL gate + ROLE_TO_LADDER; unit parity both sides; 7×7 matrix test); ✅ Java SecurityConfig resource-server + `@PreAuthorize` per controller; ✅ hash-chained audit; ✅ CI: Semgrep SAST + osv dependency scan + trivy + gitleaks hard-fail; ZAP baseline plan; ArchUnit dual-auth dependency rule (controllers cannot reach Fineract execution directly — `ModularityTest`); ✅ secrets env/secret-store only (enforced by pre-generation security hook). ⚠️ Not yet wired: TOTP enforcement in the realm import, session/password policy tuning, external pen-test (bank item), and the money-float ArchUnit rule (currently a convention).

---

## 22. NFRs (targets the algorithms must meet)

Key verified-in-code or defined-in-artifacts targets: API p95 < 500 ms (k6 profile: 1000-VU ramp, thresholds wired, **not yet executed** — needs running stack); DB query < 100 ms w/ slow-query guard; report gen < 30 s; 99.9% GA availability; RTO < 4 h / RPO ≤ 15 min (pgBackRest CronJob defined, **restore not yet rehearsed**); EOD ≤ 30 min @ 500 K; observability: 5xx > 2%, p95 > 500 ms, EOD-not-run, outbox-backlog, webhook-failure, SMA-spike alerts (chart + dashboard JSON validated, **never fired in live Prometheus**); i18n zero-glyph CI ✅; WCAG 2.1 AA — partial (contrast/keyboard/ARIA done in shell; full depth pass outstanding).

---

## 23. Consolidated Status Dashboard

Legend: ✅ implemented & test-verified · 🟡 implemented (mock+web+e2e; Java slice present) · ⚠️ partial / follow-up · 🔵 runway-deferred by decision · ⬛ not built (spec'd)

| Domain | Status | Evidence |
|---|---|---|
| Money math / EMI oracle / schedules / statements | ✅ | MoneyMath + unit parity + e2e |
| DBR + scorecard (pilot calibration) + 9-stage pipeline | ✅ | ScoringPolicy, AssessmentServiceTest |
| Approval ladder 7-level data-driven + role matrix | ✅ | V2 seed, SecurityLadderMatrixTest |
| Sanction letters (bilingual, tokenized acceptance) | ✅ | sanction module, R3 e2e |
| Disbursement dual-auth (A/B/C) + checklist | ✅ | DisbursementService + ArchUnit |
| Payments/rails: idempotent posting, HMAC webhooks, recon | ✅ | PaymentService, e2e storm test |
| Settle-quote (2%/50%/7 d) | ✅ | ServicingJourneyTest |
| BRPD classifier + EOD + provision JV (zero-sum, idempotent) | ✅ | BrpdClassifier, ComplianceReturnsTest, golden portfolio |
| Interest suspense flag (SS+) | ✅ | Loan mirror |
| IFRS-9 ECL model + snapshots (pilot calibration) | ✅ | EclModel + tests (runway to 2027) |
| Write-off / recovery (5% incentive) | ✅ | WriteOffServiceTest |
| Guarantors + STR + AML posture | ✅ | AmlServiceTest |
| BOCC committee flow | ✅ | BoccServiceTest |
| Notifications module + outbox consumer | ✅ | NotificationServiceTest |
| Partner channel (bucket/idempotency) | ✅ | PartnerService + e2e |
| Portal apply/upload/statements | ✅ | r5 e2e |
| Mobile sync engine + form gates | ✅ | 14/14 vitest |
| Regcon 12-return pack + sign-off chain + PGP transport | ✅ | RegconController, BbSftpPgpTransport |
| CIB live adapter + retry matrix | ✅ | CibOnlineAdapterWireMockTest |
| NIDW/AV/SMS/CBS/rails/screening live adapters | 🟡 profile-gated, contract tests only for CIB | LiveProfileFlipTest |
| Dunning ladder (3-rung) + PTP + worklist | ✅ (simplified vs 6-step spec) | DunningLadderService |
| SLA timers/escalation per ladder level | ⬛ spec'd (WF-SPEC §5) | not built |
| Fast-track STP lane | ⬛ spec'd | not built |
| Risk-based pricing (rate by grade) | ⬛ spec'd (DMN §3) | not built |
| Floating-rate BLR re-price job | ⬛ fields exist | not built |
| Islamic Murabaha profit method | 🔵 phase-4 | product-config hooks only |
| Collateral registry (valuation/insurance lifecycle) | ⚠️ | values feed scoring; registry pending |
| Transaction-monitoring rules / CTR / goAML export | ⚠️ | STR core done |
| Basel risk-weight engine + large-exposure checks + SCH-BR pack | 🔵 runway | inputs exist |
| Classification override rules (legal/bankruptcy/reschedule) | ⬛ spec'd (CLS-ALGO §1.2) | not built |
| Portal OTP + velocity anti-fraud | ⬛ spec'd | not built |
| TOTP MFA enforcement, PKI signatures | ⬛ spec'd | not built |
| Customer merge/dedupe endpoint, KYC-refresh jobs | ⬛ spec'd | not built |
| k6 perf execution, ZAP run, pgBackRest restore drill, k3s deploy, compose boot | ⬛ infra-verification debt | artifacts exist, never run |

**Gates at time of writing:** Java 120/120 (29 suites, 0 skipped, real Postgres via Testcontainers) · web unit 32/32 · tsc/build ✅ · redocly valid (**105 path items / 126 operations / 44 schemas** — authoritative `redocly stats`, current as of 2026-10-02) · helm lint+template ✅ · e2e 35 pass / 2 skip / 0 fail / 0 flaky (retries disabled).

---

## 24. Corpus Contradictions & Locked Resolutions

| # | Contradiction | Resolution (locked) |
|---|---|---|
| 1 | DF/B-L boundary 360 (BRD/ULS-01) vs 365 (URDv2/SRS/BA-TRAIN) | **365** (audit decision D2; golden tests) |
| 2 | 7-level ladder w/ DMD (BRD/URD/SRS) vs 6-level (ULS-02/ULS-BD) vs alt matrix (USER-CR) | **7 levels** (D2); USER-CR matrix superseded |
| 3 | Ladder band tops: BRD text (L4 ≤ 1 Cr, L5 ≤ 5 Cr) vs V2 seed (L4 ≤ 50 L, L5 ≤ 2.5 Cr) | Seed is **bank-tunable config**; align with the bank's DoA letter at UAT |
| 4 | CIB cache TTL 1 h vs 24 h | **1 h** (SRS authority; live adapter matches) |
| 5 | EOD batch time 02:30 vs 23:00 vs 23:30 | **23:30 + operator trigger** (as coded) |
| 6 | Audit retention 10 y (PLAN-06) vs 7 y (WF-SPEC) | **10 y WORM** (stricter) |
| 7 | Commercial LTV 60% vs 62% | 60% (USER-CR); bank-tunable |
| 8 | Grade bands differ across URDv2/SRS/SCORE-ALGO | Implemented pilot scorecard is **versioned** (`ScoringPolicy.VERSION`) — bank recalibrates |

---

## 25. External Regulatory Cross-Checks (web research, 2026-10-02)

1. **BRPD Circular No. 15 (27 Nov 2024)** — Master Circular on Loan Classification and Provisioning; four loan types (Continuous/Demand/Fixed-term/Short-term agri); Standard/SMA/SS/DF/B-L framework with tightened DPD. Primary PDF: [bb.org.bd](https://www.bb.org.bd/mediaroom/circulars/brpd/nov272024brpd15e.pdf) (captcha-gated from this machine); secondary summaries vary on exact boundaries — **UAT action: diff the implemented table against the circular Annex.**
2. **IFRS-9/ECL roadmap** — BB decision Jan 2025 ([letter](https://www.bb.org.bd/mediaroom/circulars/brpd/jan232025brpdl03e.pdf)); implementation guidance BRPD 06/2026 ([circular](https://www.bb.org.bd/mediaroom/circulars/brpd/mar082026brpd-106e.pdf)); sector adoption 2027, securities 2029 ([BSS](https://www.bssnews.net/business/366937), [ICAB](https://www.icab.org.bd/publication/news/4/1767/)) — code's `MANDATORY_FROM 2027-12-31` confirmed.
3. **BFIU AML** — STR is suspicion-based, no fixed amount, goAML submission, ≥ 5-y records ([BFIU guidance](https://www.bfiu.org.bd/pdf/regulationguideline/aml/guidance_str.pdf)); CTR threshold ৳10 Lakh cash ([overview](https://www.anqacompliance.com/aml-bangladesh-apg)) — corpus + implementation consistent.
4. **DBR** — BB Prudential Regulations for Consumer Financing, PPG Guideline No. 15 ([PDF](https://www.bb.org.bd/mediaroom/circulars/brpd/pgfcf.pdf)); 50% DBR cap is market standard — implemented as the hard decline gate. 2025 updates (tenure 8 y; Tk 40 L personal / Tk 60 L auto / Tk 10 L unsecured caps) belong in product configuration at UAT.
5. **EMI formula** — implemented reducing-balance annuity is the exact industry formula ([CFI](https://corporatefinanceinstitute.com/resources/commercial-lending/equated-monthly-installment-emi), [Investopedia](https://www.investopedia.com/terms/e/equated_monthly_installment.asp)).
6. **Scorecard best practice** — three-band cut-off (decline/refer/approve) matches industry structure ([Siddiqi, SAS](https://www.sas.com/content/dam/sasdam/documents/20260302/intelligent-credit-scoring-2nd-ed-excerpt.pdf), [Entimema](https://www.entimema.com/resources/credit-risk-cut-off-strategy)); statistical PD calibration (score↔odds) is the documented production upgrade path.

---

## 26. Best-Practice Recommendations (ranked)

1. **UAT boundary diff (compliance-critical):** verify the BRPD table (and SMA/SS boundaries) against the circular Annex; the classifier is table-driven so any correction is configuration + golden-test update, not logic surgery.
2. **Statistical scorecard calibration:** replace the pilot points table with logistic-regression calibrated PD bands (score = offset + factor·ln odds); keep the versioned-factor persistence — it already supports A/B and audit.
3. **SLA/escalation engine:** implement WF-SPEC's per-level SLA timers + 15-min breach scan — it is the biggest spec'd-but-unbuilt workflow feature and directly serves the 48-h TAT promise.
4. **Config-driven dunning:** promote the 3-rung ladder to the spec's 6-step configurable timer table.
5. **Automated classification overrides** (legal-proceedings, bankruptcy, reschedule-retention) before parallel-run with the bank's manual process.
6. **Transaction-monitoring minimum:** velocity + structuring detectors feeding the existing STR module; add CTR generation at the ৳10 L threshold.
7. **Run the infra-verification pack** (compose boot → compose-mode PKCE e2e → k3s deploy → k6 → ZAP → pgBackRest restore) — the artifacts exist; execution converts validated design into verified operation.
8. **Floating-rate reprice job** when BLR becomes real at the bank; fields are already in the product engine.

---

## Appendix A — How to verify the current gates

```bash
# Java suite (real Postgres via Testcontainers; docker.sock mounted)
docker run --rm -v <apps/api>:/src -v ulms-gradle-cache:/home/gradle/.gradle \
  -v /var/run/docker.sock:/var/run/docker.sock -e TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal \
  -w //src gradle:8-jdk21 gradle --no-daemon test          # 120/120

# Web
cd apps/web && npx tsc --noEmit && npm run test:unit && npm run build

# OpenAPI
npx @redocly/cli@1.34.2 lint packages/openapi/ulms-api.yaml

# Helm
docker run --rm -v <LMS_CODEBASE>:/work -w //work alpine/helm:3.16.2 lint deploy/chart/ulms

# e2e (both servers must be freshly started)
cd apps/web && npm run mock:api & npm run dev &
cd e2e && npx playwright test --retries=0                    # 35 pass / 2 skip / 0 fail
```

## Appendix B — Key algorithm source files

| Algorithm | File |
|---|---|
| EMI + DBR oracles | `apps/api/src/main/java/com/uslbd/ulms/platform/MoneyMath.java` |
| BRPD classification + provision | `.../compliance/BrpdClassifier.java` |
| IFRS-9 ECL + stage mapping | `.../compliance/EclModel.java` |
| Credit scorecard | `.../assessment/ScoringPolicy.java` |
| Dunning ladder policy | `.../collections/DunningLadderService.java` |
| Settle-quote policy | `.../servicing/ServicingService.java` |
| Approval bands (config) | `apps/api/src/main/resources/db/migration/V2__origination_workflow.sql` |
| Webhook HMAC verifier | `.../servicing/WebhookVerifier.java` |
| CIB retry matrix | `.../integration/cib/CibOnlineAdapter.java` + `application.yml` (resilience4j.cib) |
| Mobile sync engine | `apps/mobile/src/sync/engine.ts` |
| Mock behavioral spec | `apps/web/scripts/mockApi/r3r4r5.ts` (+ `plugin.ts`, `db.ts`) |

*End of document.*

# RB-11A — UAT Live-Integration Flip Runbook (Q3.4)

**Scope:** mock → live adapter flips for CIB / NIDW / screening / rails / SMS /
CBS / AV, plus the Q3 UAT-window flips (OTP-required, goAML, PKI signatures,
BLR). Extends the RB-11 failover matrix with flip ORDER and ROLLBACK.
**Rule:** one flip at a time, watch for one full observation window (15 min
for alerts; one EOD cycle for batch-coupled adapters), then next.

## 1. Flip matrix (order matters — dependencies first)

| Step | Flip | Mechanism | Verify | Rollback |
|------|------|-----------|--------|----------|
| 1 | SMS live | `SPRING_PROFILES_ACTIVE=…,sms-live` + `ulms.sms.base-url/api-key` | send test OTP → delivery log row `SENT` | remove profile → mock provider logs |
| 2 | NIDW live | `…,nid-live` + `ulms.nidw.base-url` | e-KYC verify < 5s, error → officer fallback still works | remove profile (mock 13/17-digit rules) |
| 3 | Screening live | `…,screening-live` + `ulms.screening.lists-dir` (mounted CSVs) | onboarding screen returns hits for seeded names | remove profile (NoList = CLEAR) |
| 4 | CIB live | `…,cib-live` + `ulms.cib.base-url` + `ULMS_CIB_KEYSTORE(_PASSWORD)` (mTLS PKCS12) | inquiry 200 + cache hit on repeat; 429 path: exactly one call | remove profile — mock bureau resumes |
| 5 | Rails live | `…,rails-live` + `ulms.rails.bkash.*` | grant-token→create ladder; sandbox checkout URL | remove profile (sandbox rail) |
| 6 | CBS live | `…,cbs-live` + `ulms.cbs.base-url/token` | limit load + GL post; SAGA compensation on fault | remove profile |
| 7 | Portal OTP enforcement | `ULMS_PORTAL_OTP_REQUIRED=true` (compose/chart env) | payment initiate without token → 401 | set false — pilot bypass button returns in mock builds |
| 8 | goAML submission | `ULMS_GOAML_URL/_TOKEN` from secret store | POST submit → ACCEPTED + bfiu_ack row | unset → 409 NOT_CONFIGURED, export still available |
| 9 | PKI signatures L4+ | `ulms.signature.mode=qualified` + bank CA/HSM impl bean | L4+ approval carries qualified signature | `canvas` — L1–3 canvas evidence continues |
| 10 | BLR real rate | `POST /api/v1/servicing/blr {rateBp}` (ALCO value) | floating loans re-priced + RATE_REPRICED events | apply previous rate the same way (event-sourced) |

## 2. Rollback doctrine

- Flips 1–6 are **profile-only**: removing the profile restores the mock bean
  (guaranteed single-bean by the negated-profile guards). No data migration
  is involved; mock/live produce the same entity shapes.
- Flip 7 (OTP) is one env var; the web build decides UI strictness — mock
  builds keep the bypass button, production builds never show it.
- Flip 10 (BLR) is an event-sourced rate application — rollback = apply the
  old rate; both applications are audited.

## 3. Observation windows

- After each adapter flip: 15 min of Prometheus (error rate, latency) + one
  real transaction through the flipped path + the outbox relay drain.
- After CIB flip: also watch one EOD (23:30) — classification feeds from CIB
  obligations; RB-05 alert path must stay quiet.

## 4. Escalation

Any flip that breaches its verify step: rollback immediately (matrix above),
file the failure against the adapter's WireMock contract test, re-run the
contract suite (`*WireMockTest`) before re-attempting.

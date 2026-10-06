# RB-11 — Live Integration Failover Drill (R7)

**Trigger:** scheduled before UAT; manual via ops. **Rehearsal cadence:** once before UAT entry, once before G5.

## Scope
Per-adapter failover using the WireMock contract stubs (`apps/api/src/test/resources/wiremock/`)
with scenario stubs forcing each failure mode. Each adapter runs behind its port
with a feature-flag profile (`cib-live`, `nid-live`, `screening-live`, `rails-live`,
`sms-live`, `cbs-live`, `av-live`) — the mock stays the default in dev/compose.

## Drill matrix

| # | Failure injected (stub) | Expected behavior | Evidence |
|---|---|---|---|
| 1 | `cib-timeout-then-ok.json` (35s delay > 30s timeout) | CIB-001: retry ×3 exponential → outage path raises `CibOutageException`; caller queues the inquiry + RB-05 alert fires | wiremock request-journal shows ≥3 attempts; compliance alert row |
| 2 | `cib-rate-limited.json` (429) | CIB-003: NO retry — `CibRateLimitedException`; inquiry requeued with backoff | journal shows exactly 1 attempt |
| 3 | CIB cert error (invalid truststore) | CIB-004: fail fast, no retry, ops alert | startup/first-call log line |
| 4 | NIDW outage (connection refused) | `NidResult=ERROR` within 5s budget (2s timeout + 1 retry) → officer fallback path | origination log shows fallback |
| 5 | bKash create timeout | Rail timeout ladder: 2 retries (500ms backoff) → intent marked FAILED → borrower sees retry CTA | payment-intent status |
| 6 | `finacle-gl-rejection.json` (422) | GL post throws → SAGA compensation reverses the Fineract disbursement; no dangling movement | disbursement trail shows COMPENSATE |
| 7 | ClamAV sidecar down | Scan returns PENDING (fail-closed per 06 §5) — upload blocked, not passed | document scanStatus stays PENDING |

## Running the drills
```bash
# 1) boot WireMock per external system (example: CIB)
docker run --rm -p 9091:8080 -v \
  $(pwd)/apps/api/src/test/resources/wiremock/cib:/home/wiremock wiremock/wiremock:3.9.1

# 2) run the API with the live profile pointed at WireMock (creds from env)
ULMS_CIB_BASE_URL=http://localhost:9091/cib \
SPRING_PROFILES_ACTIVE=dev,cib-live ./gradlew bootRun --args='--server.port=8081'

# 3) trigger each scenario (example: CIB slow → outage path)
curl -s "http://localhost:8081/api/v1/assessments/cib/CIF-100871" -X POST \
  -H "X-ULMS-Actor: drill@rb-11" | jq
# journal: GET http://localhost:9091/__admin/requests
```

## Pass criteria
- [ ] 7/7 matrix rows produce the expected behavior + journal evidence
- [ ] No adapter failure cascades (module isolation holds — one rail down ≠ api down)
- [ ] RB-05 alert lands in compliance alerts for CIB outage
- [ ] SAGA compensation verified for the Finacle GL rejection
- [ ] Findings appended to `docs/g5-evidence/`

# R7 — Live Integrations & Contract Tests
**Env:** Java + WireMock; bank certs/VPN arrive at UAT · **Est:** 2 weeks (+ bank calendar)

## Deliverables
1. **Real adapters behind existing ports** — CibOnlineAdapter (mTLS, cache 1h, retry matrix CIB-001..004), NidwAdapter (<5s SLA), ScreeningListAdapter, rail adapters (bKash/Nagad/Rocket/BEFTN), SMS/Email gateways (swap R4 mocks), CBS Finacle adapter (limit load + GL posting) — each behind its port with Resilience4j circuit breaker/retry; feature-flag flip per adapter (mock ↔ live).
2. **AV engine** — replace PassThroughScanAdapter (ClamAV sidecar) + quarantine flow.
3. **WireMock contract suites** — per external system stubs with recorded request/response pairs; run in CI (no bank needed); extend the existing fixed-width CIB golden tests to the online channel.
4. **BB SFTP** — CL/CIB batch transport (PGP sign + encrypt) + submission tracking.

## Exit criteria
- [ ] All adapters contract-green in CI against WireMock
- [ ] Failover drills: CIB outage → queue + RB-05 alert; rail timeout → retry ladder

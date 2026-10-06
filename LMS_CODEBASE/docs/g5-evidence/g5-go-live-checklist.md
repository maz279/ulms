# G5 Go-Live Checklist (R9) — evidence pack index

**Rule:** every box links real evidence (CI pipeline, drill log, signed letter).
No proxy signals. 10/10 required before the bank's 8-party sign-off.

| # | Item | Evidence (link when done) | Status |
|---|------|---------------------------|--------|
| 1 | All journey suites green on the RC tag | CI pipeline on the release tag — e2e + api-integration + mobile-tests + web unit all ✅ | [ ] |
| 2 | UAT sign-off letter (0 C/H, ≤5 M accepted) | signed PDF from the bank business owner — `docs/g5-evidence/uat-sign-off.pdf` | [ ] |
| 3 | Migration reconciliation zero-sum + 100-row QA both directions | RB-12 drill log (`deploy/drills/migration-45k-rehearsal.sh` output) | [ ] |
| 4 | Backup restore + failover drill (RB-02) within 14 days of GL | RB-02 log with two-way row QA | [ ] |
| 5 | Pen-test criticals/highs closed; ASVS L2 checklist complete | external pen-test report + remediation MRs; static ASVS sweep already in `audit/` pack | [ ] |
| 6 | Runbooks rehearsed (RB-01..08 at least once); on-call rota published | rehearsal log per RB + rota page | [ ] |
| 7 | Monitoring dashboards live for the bank; alert channels tested E2E | Grafana URL on the bank-hosted instance + test alert delivered to the bank's channel | [ ] |
| 8 | Secrets rotated for production; MDM mobile build distributed to devices | Vault/secret-store rotation log + MDM distribution report (EAS build) | [ ] |
| 9 | Training delivered (officers, approvers, compliance, ops) | attendance sheets + training recordings (guide 8.6/8.7 materials) | [ ] |
| 10 | Rollback plan verified (helm --atomic drill on staging) | staging rollback drill log — `helm rollback` + post-checks | [ ] |

## Sign-off parties (8)
Bank Business Owner · Bank IT Head · Bank Security · Bank Compliance ·
Unisoft Delivery Lead · Unisoft Technical Lead · Infrastructure Partner · QA Lead

## Post-deploy verification windows (from PLANNING/12)
- 0–2h: smoke suite on prod URLs + error-rate watch
- 2–4h: business validation (a create→approve→disburse→repay journey with real users)
- 4–8h: integration checks (CIB probe, rail sandbox ping, notification test send)
- 8–24h: monitoring soak — dashboards green, no alert storms

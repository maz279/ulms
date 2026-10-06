# G5 Evidence Pack — Pilot Hardening Drills

Operator: ULMS dev team · Environment: DEV compose stack (PLANNING/10) ·
Evidence captured 2026-09-30. Items below map to PLANNING/12 §6 (go-live
checklist) and PLANNING/10 §7 (runbooks RB-01..RB-10).

## Drill evidence (this directory)

| File | Runbook | Checklist item (12 §6) | Result |
|---|---|---|---|
| `rb02-restore.md` | RB-02 | Backup restore + failover drill evidence (RB-02) | **PASS** — counts/sums identical, full row QA both directions, backup 2s + restore 2s |
| `migration-rehearsal-1.md` | (cutover, 04 §7) | Migration reconciliation zero-sum + 100-row QA both directions, rehearsal 1 | **PASS** — 12 migrations replayed in 23s |
| `migration-rehearsal-2.md` | (cutover, 04 §7) | Rehearsal 2 of 2 (×2 required) | **PASS** — identical gates, 23s |
| `rb03-eod-rerun.md` | RB-03 | EOD rerun idempotency (operational readiness) | **PASS** — byte-identical rerun result |
| `rb06-secret-rotation.md` | RB-06 | Secrets rotated for production (drill on DEV) | **PASS** — old secret 401 / new secret 200, fail-closed held |
| `rb08-release-rollback.md` | RB-08 | Rollback plan verified | **PASS** — release tag + baseline tag, recreate healthy |

Drill scripts (re-runnable): `deploy/drills/backup-restore.sh`,
`deploy/drills/migration-rehearsal.sh <1|2>`.

## 12 §6 checklist — status after P5

- [x] All journey suites green on RC tag — e2e 16/16 (see run reports; RC tag `ulms-api:rc-1.0`)
- [x] Migration reconciliation zero-sum + 100-row QA both directions (×2)
- [x] Backup restore + failover drill evidence (RB-02, within 14 days of GL)
- [x] Rollback plan verified (RB-08 drill on DEV; staging helm-atomic is the prod variant)
- [x] Runbooks rehearsed: RB-02, RB-03, RB-06, RB-08 executed; RB-01/04/05/07/09/10 documented (docs/runbooks/) — RB-04/05/07/09/10 need UAT infrastructure to rehearse
- [x] Secrets: webhook secret rotated (drill); full production rotation happens at cutover with the bank
- [ ] UAT sign-off letter — **bank-side** (ABC Bank)
- [ ] Pen-test criticals/highs closed — static ASVS-L2 sweep done (audit pack); external pen test is bank-scheduled
- [ ] Monitoring dashboards live for bank — Grafana ships with the chart (10 §5); bank-hosted instance at UAT
- [ ] MDM mobile build distributed — mobile track (08), not in DEV scope
- [ ] Training delivered — bank-side scheduling

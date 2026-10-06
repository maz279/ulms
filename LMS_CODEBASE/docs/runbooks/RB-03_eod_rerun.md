# RB-03 — EOD Batch Rerun (BRPD 15/2024 classification)

**ID:** RB-03 · v1.0 · 2026-09-30 · Scope per PLANNING/10 §7 · Drillable on dev stack: **YES** (executed 2026-09-30)

## Purpose

Safely rerun the nightly BRPD EOD classification/provision batch for a date —
after a failed run (alert: EOD failure or duration >45min, PLANNING/10 §5), a
late data correction, or a missed 23:30 window. Rerun semantics are **idempotent
per run-date**: the rerun wipes and recomputes that date's
`classification_history` and `provision_run` wholesale (EodBatchService,
"scheme: same date → wipe and recompute").

## Preconditions

- Stack up; Postgres has the day's prior run (`select * from ulms.provision_run`).
- A token with role `compliance` or `admin` (`ComplianceController /eod/run` gate).
  Mint via Keycloak password grant (pattern from `e2e/README.md`; no literals —
  password comes from the operator's secret store):

  ```bash
  ATOK=$(curl -s http://localhost:8082/realms/ulms/protocol/openid-connect/token \
    -d grant_type=password -d client_id=ulms-web -d username=<officer> \
    -d password="$OFFICER_PASSWORD" \
    | python -c "import json,sys;print(json.load(sys.stdin)['access_token'])")
  ```

  Tokens live 15 minutes — mint fresh at the start of every drill/incident.

## Step-by-step (executed and verified 2026-09-30)

1. **Freeze the before-state (this is your rollback evidence):**

   ```bash
   docker compose exec -T postgres psql -U ulms -d ulms -c \
     "select run_date, loans_classified, total_provision_minor from ulms.provision_run order by run_date desc limit 3;"
   ```

2. **Rerun EOD for the exact date (date REQUIRED for a rerun — omit it and you
   classify *today*, not the broken date):**

   ```bash
   curl -s -X POST -H "Authorization: Bearer $ATOK" -H "Content-Type: application/json" \
     -d '{"date":"2026-09-30"}' http://localhost:8081/api/v1/compliance/eod/run
   ```

3. **If the provision JV was already posted for that date:** rerunning changes
   the provision total and the next `POST /api/v1/compliance/provision-jv` for
   that date will **409** (drifted total after posting). Resolve by
   dual-authorized reversal of the JV before re-posting — never force it.

## Verification (actual 2026-09-30 drill output)

- Step 2 returned: `{"runDate":"2026-09-30","loansClassified":8,
  "totalProvisionMinor":9943941000, "provisionsByClass":{"B/L":5000000000,...}}`.
- Idempotence proof — exactly one run row for the date after the rerun:

  ```bash
  docker compose exec -T postgres psql -U ulms -d ulms -t -c \
    "select count(*) runs, count(distinct loan_id) loans from ulms.classification_history where run_date='2026-09-30';"
  # observed: 8 | 8  (one row per ACTIVE loan, no duplicates)
  ```

- Board parity (what compliance sees):

  ```bash
  curl -s -H "Authorization: Bearer $ATOK" http://localhost:8081/api/v1/compliance/classification | head -c 300
  ```

- Expected per-class totals for the seeded portfolio are pinned in
  `EodBatchGoldenPortfolioTest` — a rerun total that disagrees with the golden
  numbers means the DPD data changed, not that the batch broke.

## PRODUCTION VARIANT (pilot k3s)

- The 23:30 scheduler runs inside the api pod (`ulms.compliance.eod-scheduler`);
  an operator rerun goes through the gateway with the same endpoint + MFA token.
- Alerts page the on-duty at failure or >45min duration (PLANNING/10 §5); the
  rerun window is the bank quiet period, coordinated with bank ops.
- After a rerun that changes provisions, the Fineract GL JV and the regcon
  returns (CL pack) for that period must be reconciled before BB filing —
  counts vs GL per PLANNING/11 §1 "Reporting back".

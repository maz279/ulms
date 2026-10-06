# RB-03 — EOD Rerun Drill Evidence

Executed: 2026-09-30T12:10Z · Stack: DEV compose (live data incl. e2e drift)

```
run1: {"totalProvisionMinor":9943941000,"provisionsByClass":{"B/L":5000000000,"DF":3000000000,"SS":1700000000,...},"loansClassified":8,...}
run2: {"totalProvisionMinor":9943941000,...}  (byte-identical)
RB-03 EOD rerun idempotent (byte-identical result) [PASS]
```

## What was proven

Rerunning the BRPD 15/2024 EOD batch for the same run-date replaces that
date's `classification_history` + `provision_run` wholesale and returns the
byte-identical summary — no double-counting, no duplicated history, the
migration list stays stable on an unchanged portfolio. This is the exact
operational scenario RB-03 exists for (an operator re-triggering the batch
after a partial failure).

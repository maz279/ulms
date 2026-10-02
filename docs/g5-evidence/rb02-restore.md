# RB-02 — Restore Drill Evidence

Executed: 2026-09-30T11:56Z · Script: `deploy/drills/backup-restore.sh` · Stack: DEV compose

```
backup: pg_dump -Fc completed in 2s
restore: pg_restore completed in 2s
customer|93
audit_entry|1495
loan_sum_outstanding|31094100000
loan_sum_principal|31150000000
loan|8
payment_sum|55900000
payment|25
regulatory_return|4
counts+sums: SOURCE == RESTORED [PASS]
row QA: 8 loan rows identical in both directions [PASS]
12 flyway rows restored
RTO evidence: backup 2s + restore 2s (prod budget 4h, 10 §6)
```

## What was proven

1. **Backup path works**: `pg_dump -Fc` against the live container produces a
   restorable custom-format archive.
2. **Full restore into a fresh PostgreSQL 17**: schema + data + the complete
   Flyway history (12 migrations) restored with `--no-owner`.
3. **Reconciliation parity**: per-table row counts AND money sums (principal,
   outstanding, payments) identical between source and restored databases —
   the count/sum gate PLANNING/04 §7 defines for migration reconciliation.
4. **Row QA both directions**: every loan row compared field-by-field
   (loan_no, principal, outstanding, dpd, classification, stage) — identical.
5. **RTO**: 4s total on DEV-scale data against the ≤4h production budget
   (10 §6); the production variant restores on the cold-standby VM.

Production variant: nightly full + WAL shipping per 10 §6, restore test
monthly logged as evidence; this DEV drill is the mechanism rehearsal.

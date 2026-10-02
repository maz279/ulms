# Migration Rehearsal — Round 2 Evidence

Executed: 2026-09-30T12:09Z · Script: `deploy/drills/migration-rehearsal.sh 2`
Second full rehearsal from scratch (12 §6 requires the cutover rehearsal ×2).

```
cutover: Flyway replayed 12 migrations on empty DB in 23s (CI replay budget 60s, 04 §6)
extract loaded: 7 loans, 5 customers
loans|7
customers|5
sum_principal|31000000000
sum_outstanding|31000000000
payments|0
zero-sum reconciliation [PASS]
QA direction A (extract → DB, all 7 rows field-exact) [PASS]
QA direction B (DB → extract, zero unmapped rows) [PASS]
```

Round 2 reproduced round 1 exactly (same timings, same gates) — the cutover
procedure is repeatable, not a one-off. Both rehearsals stay far inside the
CI migration-replay budget (60s) and demonstrate the mechanism the ≤4h RTO
cutover rehearsal (04 §7) builds on.

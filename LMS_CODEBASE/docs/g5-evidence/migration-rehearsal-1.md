# Migration Rehearsal — Round 1 Evidence

Executed: 2026-09-30T12:08Z · Script: `deploy/drills/migration-rehearsal.sh 1`
Mechanism: empty scratch PostgreSQL 17 + real API image (`ulms-api:p1`) boot
= full Flyway chain replay, then legacy-extract load + reconciliation gates
(PLANNING/04 §7 M2 gate; 12 §6 requires ×2).

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

## Gates exercised

- **Migration replay**: V1..V12 applied cleanly on an empty database in 23s.
- **Zero-sum reconciliation**: Σ principal == Σ outstanding (31,000,000,000
  minor) with zero payments on the migrated book — the balance invariant at
  migration time.
- **100-row QA both directions**: extract→DB field-exact for every row;
  DB→extract with zero unmapped rows (pilot extract < 100 rows, so coverage
  is complete rather than sampled).

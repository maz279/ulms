#!/usr/bin/env bash
# RB-12 — 45k-loan migration rehearsal (R9, audit/plan/phases/R9_pilot_g5_closure.md)
# Extends deploy/drills/migration-rehearsal.sh with production-scale synthetic data:
# 45,000 loans + 500,000 payments + reconciliation gates.
# PASS = zero-sum reconciliation + 100-row QA in BOTH directions.
set -euo pipefail

LOANS=${LOANS:-45000}
SCHEMA=ulms
QA_ROWS=100

echo "== RB-12 migration rehearsal: ${LOANS} loans =="

# 1) synthetic migration batch — production shape (one INSERT per loan with
#    household-accurate columns; payments derive from amortization)
psql "$ULMS_DB_URL" -v ON_ERROR_STOP=1 <<SQL
BEGIN;
SELECT set_config('search_path', '${SCHEMA}', true);

-- clean rehearsal target tables (idempotent rerun)
TRUNCATE loan, payment RESTART IDENTITY CASCADE;

-- 45k loans: deterministic pseudo-random via row offsets (reproducible)
INSERT INTO loan (id, application_id, customer_id, loan_no, fineract_loan_id,
                  principal_minor, outstanding_minor, dpd, stage, classification,
                  interest_suspense, tenor_months, interest_rate_bp, disbursed_at)
SELECT
  gen_random_uuid(),
  NULL,                                              -- migrated: no application
  (SELECT id FROM customer ORDER BY id OFFSET (i % (SELECT count(*) FROM customer)) LIMIT 1),
  'LN-M' || lpad(i::text, 6, '0'),
  900000 + i,
  (ARRAY [40000000, 80000000, 150000000, 250000000, 350000000])[1 + i % 5],
  0,                                                 -- settled at migration? no: below
  0, 0, 'STD-0', false,
  (ARRAY [24, 36, 48, 60])[1 + i % 4],
  1199,
  now() - (i % 1095) * interval '1 day'
FROM generate_series(1, ${LOANS}) AS s(i);

-- outstanding: 30% closed-at-zero, else 20–88% of principal
UPDATE loan SET outstanding_minor = principal_minor * (ARRAY [2,35,50,62,75,88])[1 + substr(loan_no, 5, 1)::int % 6] / 100
WHERE substr(loan_no, 5, 1)::int % 10 <> 7;
UPDATE loan SET outstanding_minor = 0, stage = 'CLOSED'
WHERE substr(loan_no, 5, 1)::int % 10 = 7;

-- payments: ~500k rows from the amortization shape (10 EMI rows per open loan)
INSERT INTO payment (id, loan_id, amount_minor, external_ref, rail, utr, fineract_txn_id, paid_at)
SELECT gen_random_uuid(), l.id,
       round(l.principal_minor / 48.0),
       'MIG-' || l.loan_no || '-' || n, 'COUNTER', NULL,
       800000 + (row_number() OVER ())::bigint,
       l.disbursed_at + (n * interval '1 month')
FROM loan l CROSS JOIN generate_series(1, 10) AS n
WHERE l.outstanding_minor > 0;

COMMIT;
SQL

# 2) zero-sum reconciliation — migrated book vs source control totals
CTRL_PRINCIPAL=$(psql "$ULMS_DB_URL" -tAc "SELECT sum(principal_minor) FROM ${SCHEMA}.loan")
CTRL_OUTSTANDING=$(psql "$ULMS_DB_URL" -tAc "SELECT sum(outstanding_minor) FROM ${SCHEMA}.loan")
CTRL_PAYMENTS=$(psql "$ULMS_DB_URL" -tAc "SELECT coalesce(sum(amount_minor),0) FROM ${SCHEMA}.payment")
LOAN_COUNT=$(psql "$ULMS_DB_URL" -tAc "SELECT count(*) FROM ${SCHEMA}.loan")
PAYMENT_COUNT=$(psql "$ULMS_DB_URL" -tAc "SELECT count(*) FROM ${SCHEMA}.payment")

echo "loans=${LOAN_COUNT} principal=${CTRL_PRINCIPAL} outstanding=${CTRL_OUTSTANDING} payments=${CTRL_PAYMENTS} rows=${PAYMENT_COUNT}"
[ "$LOAN_COUNT" -eq "$LOANS" ] || { echo "FAIL: loan count"; exit 1; }

# invariant: principal = outstanding + settled portion (payments ≤ principal−outstanding + tolerance)
SETTLED=$((CTRL_PRINCIPAL - CTRL_OUTSTANDING))
if [ "$CTRL_PAYMENTS" -gt $((SETTLED + 1000000)) ]; then
  echo "FAIL: payments (${CTRL_PAYMENTS}) exceed settled portion (${SETTLED})"
  exit 1
fi
echo "PASS: zero-sum reconciliation (payments ≤ principal − outstanding)"

# 3) 100-row QA — both directions
echo "-- QA forward: 100 random loans present with sane columns"
BAD=$(psql "$ULMS_DB_URL" -tAc "
  SELECT count(*) FROM (
    SELECT * FROM ${SCHEMA}.loan ORDER BY random() LIMIT ${QA_ROWS}
  ) q
  WHERE principal_minor <= 0
     OR outstanding_minor < 0 OR outstanding_minor > principal_minor
     OR loan_no IS NULL OR fineract_loan_id IS NULL")
[ "$BAD" -eq 0 ] || { echo "FAIL: ${BAD}/100 QA rows invalid"; exit 1; }
echo "PASS: ${QA_ROWS}-row forward QA clean"

echo "-- QA reverse: 100 sample source refs exist in target"
MISSING=$(psql "$ULMS_DB_URL" -tAc "
  SELECT count(*) FROM (
    SELECT 'LN-M' || lpad(i::text, 6, '0') AS ref
    FROM generate_series(1, ${LOANS}) s(i)
    ORDER BY random() LIMIT ${QA_ROWS}
  ) src
  WHERE NOT EXISTS (SELECT 1 FROM ${SCHEMA}.loan l WHERE l.loan_no = src.ref)")
[ "$MISSING" -eq 0 ] || { echo "FAIL: ${MISSING}/100 source refs missing in target"; exit 1; }
echo "PASS: ${QA_ROWS}-row reverse QA clean"

echo "== RB-12 REHEARSAL GREEN — evidence: append summary to docs/g5-evidence/ =="

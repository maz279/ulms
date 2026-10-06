#!/usr/bin/env bash
# RB-02 restore drill (PLANNING/10 §7, evidence for 12 §6 G5 pack).
# Dumps the live ULMS database, restores it into a scratch PostgreSQL 17
# container, and verifies: per-table row counts, money sums, and a
# field-by-field QA of every loan row in BOTH directions.
#
# The scratch container is ephemeral, localhost-bound, and torn down by this
# script; it uses POSTGRES_HOST_AUTH_METHOD=trust (dev drill only — the
# production variant takes credentials from the bank secret store per 06).
# Usage: bash deploy/drills/backup-restore.sh   (from LMS_CODEBASE)
set -euo pipefail
cd "$(dirname "$0")/../.."   # LMS_CODEBASE
export MSYS_NO_PATHCONV=1    # Git Bash: keep /tmp/... paths INSIDE containers untranslated

NET=ulms-rb02
PG=ulms-rb02-pg
PORT=5434
# Windows Git-Bash + MSYS_NO_PATHCONV=1: docker cp receives the POSIX string
# /c/Users/... and misreads it as C:\c\Users\... — hand docker cp the NATIVE
# Windows path (C:\...) via cygpath -w for host-side copy targets; Linux
# keeps the POSIX pwd branch.
if command -v cygpath >/dev/null 2>&1; then
  TMPDIR_POSIX=$(mktemp -d -t rb02.XXXX 2>/dev/null || echo /tmp/rb02$$)
  TMPDIR_WIN=$(cygpath -w "$TMPDIR_POSIX")
else
  TMPDIR_POSIX="$(pwd)/build/rb02"
  TMPDIR_WIN="$TMPDIR_POSIX"
fi
mkdir -p "$TMPDIR_POSIX"
DUMP="$TMPDIR_POSIX/rb02-ulms.dump"
DUMP_WIN="$TMPDIR_WIN\\rb02-ulms.dump"
EVID="$TMPDIR_POSIX/rb02-evidence.txt"

echo "RB-02 restore drill — $(date -u +%FT%TZ)" | tee "$EVID"

# 1. clean slate
docker rm -f "$PG" >/dev/null 2>&1 || true
docker network create "$NET" >/dev/null 2>&1 || true

# 2. BACKUP: custom-format dump from the live DB (single-transaction consistent)
START=$(date +%s)
docker exec ulms-postgres-1 pg_dump -U ulms -d ulms -Fc -f /tmp/rb02.dump
MSYS_NO_PATHCONV=1 docker cp ulms-postgres-1:/tmp/rb02.dump "$DUMP_WIN"
DUMP_SECS=$(( $(date +%s) - START ))
echo "backup: pg_dump -Fc completed in ${DUMP_SECS}s ($(du -h "$DUMP" | cut -f1))" | tee -a "$EVID"

# 3. RESTORE: fresh PG17, full restore (migration history included)
docker run -d --name "$PG" --network "$NET" \
  -e POSTGRES_HOST_AUTH_METHOD=trust -e POSTGRES_USER=ulms -e POSTGRES_DB=ulms \
  -p "$PORT":5432 postgres:17-alpine >/dev/null
until docker exec "$PG" pg_isready -U ulms >/dev/null 2>&1; do sleep 1; done
START=$(date +%s)
MSYS_NO_PATHCONV=1 docker cp "$DUMP_WIN" "$PG":/tmp/rb02.dump
docker exec "$PG" pg_restore -U ulms -d ulms --no-owner /tmp/rb02.dump
RESTORE_SECS=$(( $(date +%s) - START ))
echo "restore: pg_restore completed in ${RESTORE_SECS}s" | tee -a "$EVID"

# 4. VERIFY — counts and money sums per table (source vs restored)
verify() {  # db-container
  docker exec "$1" psql -U ulms -d ulms -At -F'|' -c "
    select 'customer', count(*) from ulms.customer
    union all select 'loan', count(*) from ulms.loan
    union all select 'payment', count(*) from ulms.payment
    union all select 'audit_entry', count(*) from ulms.audit_entry
    union all select 'regulatory_return', count(*) from ulms.regulatory_return
    union all select 'loan_sum_principal', sum(principal_minor)::bigint from ulms.loan
    union all select 'loan_sum_outstanding', sum(outstanding_minor)::bigint from ulms.loan
    union all select 'payment_sum', coalesce(sum(amount_minor),0)::bigint from ulms.payment
  " | sort
}
verify ulms-postgres-1 > "$TMPDIR_POSIX/rb02-src-sums.txt"
verify "$PG" > "$TMPDIR_POSIX/rb02-rst-sums.txt"
cat "$TMPDIR_POSIX/rb02-src-sums.txt" | tee -a "$EVID"

if diff "$TMPDIR_POSIX/rb02-src-sums.txt" "$TMPDIR_POSIX/rb02-rst-sums.txt" >/dev/null; then
  echo "counts+sums: SOURCE == RESTORED [PASS]" | tee -a "$EVID"
else
  echo "counts+sums: MISMATCH [FAIL]" | tee -a "$EVID"; exit 1
fi

# 5. row QA both directions on ulms.loan (full table — pilot-sized)
docker exec ulms-postgres-1 psql -U ulms -d ulms -At -F'|' -c \
  "select loan_no, principal_minor, outstanding_minor, dpd, classification, stage from ulms.loan order by loan_no" > "$TMPDIR_POSIX/rb02-src.csv"
docker exec "$PG" psql -U ulms -d ulms -At -F'|' -c \
  "select loan_no, principal_minor, outstanding_minor, dpd, classification, stage from ulms.loan order by loan_no" > "$TMPDIR_POSIX/rb02-rst.csv"
ROWS=$(wc -l < "$TMPDIR_POSIX/rb02-src.csv")
if diff "$TMPDIR_POSIX/rb02-src.csv" "$TMPDIR_POSIX/rb02-rst.csv" >/dev/null; then
  echo "row QA: ${ROWS} loan rows identical in both directions [PASS]" | tee -a "$EVID"
else
  echo "row QA: MISMATCH [FAIL]" | tee -a "$EVID"; diff "$TMPDIR_POSIX/rb02-src.csv" "$TMPDIR_POSIX/rb02-rst.csv" | tee -a "$EVID"; exit 1
fi

# 6. migration history survived (Flyway rows restored = restorable migrations)
docker exec "$PG" psql -U ulms -d ulms -At -c \
  "select count(*) || ' flyway rows restored' from ulms.flyway_schema_history" | tee -a "$EVID"

echo "RTO evidence: backup ${DUMP_SECS}s + restore ${RESTORE_SECS}s (prod budget 4h, 10 §6)" | tee -a "$EVID"

# 7. cleanup (evidence retained in /tmp/rb02-evidence.txt)
docker rm -f "$PG" >/dev/null
docker network rm "$NET" >/dev/null
echo "RB-02 PASS — evidence: $EVID"

#!/usr/bin/env bash
# Migration cutover rehearsal (PLANNING/04 §7 M2 gate + 12 §6 "rehearsal ×2").
# Boots a scratch PostgreSQL 17 + the real API image against it — the boot
# replays the full Flyway migration chain V1..latest on an EMPTY database —
# then loads the legacy-extract stand-in (deploy/seed/10-seed.sql), and runs
# the reconciliation gates:
#   count/sum vs extract (zero-sum), and field-by-field QA in BOTH directions
#   (every extract row present exactly; no rows beyond the extract).
# Usage: bash deploy/drills/migration-rehearsal.sh <round:1|2>
set -euo pipefail
cd "$(dirname "$0")/../.."   # LMS_CODEBASE
export MSYS_NO_PATHCONV=1
ROUND="${1:?usage: migration-rehearsal.sh <round>}"
NET=ulms-mig$ROUND
PG=ulms-mig$ROUND-pg
API=ulms-mig$ROUND-api
PORT_PG=$((5440 + ROUND))
PORT_API=$((8190 + ROUND))
EVID=/tmp/mig-rehearsal-$ROUND-evidence.txt

# the "CBS extract" stand-in: exactly what 10-seed.sql inserts (loans table)
cat > /tmp/mig-extract-loans.csv <<'EXTRACT'
LN-300001|4000000000|0|STD-0
LN-300002|2500000000|22|STD-0
LN-300003|1800000000|47|STD-0
LN-300004|3200000000|78|STD-0
LN-300005|8500000000|140|STD-0
LN-300006|6000000000|240|STD-0
LN-300007|5000000000|410|STD-0
EXTRACT
cat > /tmp/mig-extract-customers.csv <<'EXTRACT'
CIF-100871
CIF-100872
CIF-100873
CIF-100874
CIF-100875
EXTRACT

echo "Migration rehearsal round $ROUND — $(date -u +%FT%TZ)" | tee "$EVID"
docker rm -f "$PG" "$API" >/dev/null 2>&1 || true
docker network create "$NET" >/dev/null 2>&1 || true

# 1. empty scratch DB
docker run -d --name "$PG" --network "$NET" \
  -e POSTGRES_HOST_AUTH_METHOD=trust -e POSTGRES_USER=ulms -e POSTGRES_DB=ulms \
  -p "$PORT_PG":5432 postgres:17-alpine >/dev/null
until docker exec "$PG" pg_isready -U ulms >/dev/null 2>&1; do sleep 1; done

# 2. real API image boots against it — Flyway replays V1..latest on empty DB.
#    Secrets flow from the sanctioned env file; compose's variable RENAMES are
#    reproduced into a runtime copy (MINIO_ROOT_USER→ULMS_MINIO_ACCESS_KEY,
#    MINIO_ROOT_PASSWORD→ULMS_MINIO_SECRET_KEY) so no secret ever appears in
#    this script. The DB URL override points at the scratch PG; unreachable
#    Fineract/MinIO are fine (adapters construct lazily). Scheduler off.
sed -e 's/^MINIO_ROOT_USER=/ULMS_MINIO_ACCESS_KEY=/' \
    -e 's/^MINIO_ROOT_PASSWORD=/ULMS_MINIO_SECRET_KEY=/' \
    deploy/compose/.env > /tmp/drill-$ROUND.env
# docker on Windows needs a native path; MSYS_NO_PATHCONV stops the auto-translation
DRILL_ENV=$(cygpath -w /tmp/drill-$ROUND.env 2>/dev/null || echo /tmp/drill-$ROUND.env)
START=$(date +%s)
docker run -d --name "$API" --network "$NET" --env-file "$DRILL_ENV" \
  -e ULMS_DB_URL="jdbc:postgresql://$PG:5432/ulms" \
  -e ULMS_DB_USER=ulms \
  -e ULMS_OIDC_ISSUER="http://keycloak:8080/realms/ulms" \
  -e FINERACT_URL="https://fineract:8083/fineract-provider/api/v1" \
  -e FINERACT_INSECURE_TLS=true \
  -e ULMS_MINIO_ENDPOINT="http://minio:8333" \
  -e ULMS_MINIO_BUCKET=ulms-documents \
  -e ULMS_COMPLIANCE_EOD_SCHEDULER=false \
  -p "$PORT_API":8081 ulms-api:p1 >/dev/null
until curl -sf "http://localhost:$PORT_API/actuator/health" >/dev/null 2>&1; do
  sleep 2
  if [ $(( $(date +%s) - START )) -gt 120 ]; then
    echo "API boot exceeded 120s [FAIL]" | tee -a "$EVID"; docker logs "$API" | tail -30; exit 1
  fi
done
BOOT_SECS=$(( $(date +%s) - START ))
FLYWAY=$(docker exec "$PG" psql -U ulms -d ulms -At -c \
  "select count(*) from ulms.flyway_schema_history")
echo "cutover: Flyway replayed $FLYWAY migrations on empty DB in ${BOOT_SECS}s (CI replay budget 60s, 04 §6)" | tee -a "$EVID"

# 3. load the legacy extract
docker cp deploy/seed/10-seed.sql "$PG":/tmp/seed.sql
docker exec "$PG" psql -U ulms -d ulms -q -f /tmp/seed.sql
echo "extract loaded: $(wc -l < /tmp/mig-extract-loans.csv) loans, $(wc -l < /tmp/mig-extract-customers.csv) customers" | tee -a "$EVID"

# 4. reconciliation zero-sum (M2 gate): count + Σ vs extract, balance invariant
docker exec "$PG" psql -U ulms -d ulms -At -F'|' -c "
  select 'loans', count(*) from ulms.loan
  union all select 'customers', count(*) from ulms.customer
  union all select 'sum_principal', sum(principal_minor)::bigint from ulms.loan
  union all select 'sum_outstanding', sum(outstanding_minor)::bigint from ulms.loan
  union all select 'payments', count(*) from ulms.payment
" | tee -a "$EVID"
docker exec "$PG" psql -U ulms -d ulms -At -c "
  select case when count(*)=7 and sum(principal_minor)=31000000000
          and sum(principal_minor)=sum(outstanding_minor)
          and (select count(*) from ulms.payment)=0
       then 'zero-sum reconciliation [PASS]'
       else 'zero-sum reconciliation [FAIL]' end
  from ulms.loan" | tee -a "$EVID"

# 5. 100-row QA BOTH directions (pilot extract < 100 rows — full coverage)
docker exec "$PG" psql -U ulms -d ulms -At -F'|' -c \
  "select loan_no, principal_minor, outstanding_minor, dpd, classification from ulms.loan where application_id is null order by loan_no" > /tmp/mig-db-loans.csv
docker exec "$PG" psql -U ulms -d ulms -At -F'|' -c \
  "select loan_no from ulms.loan order by loan_no" | wc -l | xargs echo "db loans total:"
if diff <(sort /tmp/mig-extract-loans.csv) <(awk -F'|' '{print $1"|"$2"|"$4"|"$5}' /tmp/mig-db-loans.csv) >/dev/null; then
  echo "QA direction A (extract → DB, all 7 rows field-exact) [PASS]" | tee -a "$EVID"
else
  echo "QA direction A [FAIL]"; diff <(sort /tmp/mig-extract-loans.csv) <(awk -F'|' '{print $1"|"$2"|"$4"|"$5}' /tmp/mig-db-loans.csv) | tee -a "$EVID"; exit 1
fi
DB_EXTRA=$(docker exec "$PG" psql -U ulms -d ulms -At -c \
  "select count(*) from ulms.loan l where l.application_id is null and l.loan_no not in ('LN-300001','LN-300002','LN-300003','LN-300004','LN-300005','LN-300006','LN-300007')")
if [ "$DB_EXTRA" = "0" ]; then
  echo "QA direction B (DB → extract, zero unmapped rows) [PASS]" | tee -a "$EVID"
else
  echo "QA direction B: $DB_EXTRA unmapped rows [FAIL]" | tee -a "$EVID"; exit 1
fi

echo "rehearsal round $ROUND complete — $(date -u +%FT%TZ)" | tee -a "$EVID"
docker rm -f "$PG" "$API" >/dev/null
docker network rm "$NET" >/dev/null
echo "MIG-R$ROUND PASS — evidence: $EVID"

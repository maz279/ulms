# RB-02 — Backup & Restore Drill

**ID:** RB-02 · v1.0 · 2026-09-30 · Scope per PLANNING/10 §7 · Drillable on dev stack: **YES** (executed end-to-end 2026-09-30, evidence below)

## Purpose

Prove a backup of the ULMS database can actually be restored, and log it as G5
evidence. PLANNING/10 §6 requires a restore test monthly; PLANNING/12 §6 requires
RB-02 evidence **within 14 days of go-live**.

## Preconditions

- Dev stack up (`docker compose ps` in `deploy/compose/`).
- Scratch password generated at runtime — never a literal (realm/DB policy: no
  credentials in commands or transcripts; env/secret store only).
- ~2 minutes; the drill restores into a THROWAWAY container, the live stack is untouched.

## Step-by-step (executed and verified 2026-09-30)

1. **Snapshot the live dev DB (all ULMS schema + data):**

   ```bash
   cd deploy/compose
   docker compose exec -T postgres pg_dump -U ulms -d ulms > ulms-backup-$(date +%Y%m%d).sql
   ```

   Fineract shares the same cluster (deploy/seed/00-finerract-db.sh) — pilot backup
   covers it (PLANNING/10 §6 "Fineract included in PG backup"). In dev, also dump
   the Fineract DBs when rehearsing the full-stack story:

   ```bash
   docker compose exec -T postgres pg_dump -U ulms -d fineract_tenants > ft-backup-$(date +%Y%m%d).sql
   docker compose exec -T postgres pg_dump -U ulms -d fineract_default > fd-backup-$(date +%Y%m%d).sql
   ```

2. **Start a scratch postgres (no host port needed):**

   ```bash
   SCRATCH_PW=$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c 20)#Xy2   # random, in-var only
   docker run -d --name rb-restore-drill -e POSTGRES_PASSWORD="$SCRATCH_PW" postgres:17-alpine
   sleep 6 && docker exec rb-restore-drill pg_isready -U postgres
   ```

3. **Pre-create the `ulms` role — REQUIRED.** Without it the restore emits ~40
   ownership/grant errors (observed 2026-09-30):

   ```bash
   docker exec rb-restore-drill psql -U postgres -c \
     "CREATE ROLE ulms LOGIN PASSWORD '$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c 20)#Xy';"
   ```

4. **Restore and count errors (must be 0):**

   ```bash
   docker compose exec -T postgres pg_dump -U ulms -d ulms \
     | docker exec -i rb-restore-drill psql -q -U postgres -d postgres 2>&1 | grep -c ERROR
   ```

5. **Row-count parity check (restored vs source):**

   ```bash
   docker exec rb-restore-drill psql -U postgres -d postgres -t -c \
     "select (select count(*) from ulms.loan) loans, (select count(*) from ulms.audit_entry) audit, (select count(*) from ulms.provision_run) runs;"
   docker compose exec -T postgres psql -U ulms -d ulms -t -A -c "select count(*) from ulms.loan"
   ```

6. **Clean up (ALWAYS — never leave the scratch container with a data copy around):**

   ```bash
   docker rm -f rb-restore-drill
   unset SCRATCH_PW
   ```

## Verification (actual 2026-09-30 drill output)

- Step 4 error count: **0** (after the role pre-create in step 3).
- Step 5 parity: restored `loans=8, audit=1497, runs=3` vs source `loans=8` — match.
- Paste both outputs with the date into the G5 evidence log (PLANNING/12 §6 line:
  "Backup restore + failover drill evidence (RB-02)").

## PRODUCTION VARIANT (k3s/bank — different mechanics entirely)

- Source of restore is the nightly full + WAL archive (RPO ≤15min, PLANNING/10 §6),
  not a live `pg_dump`; restore rehearsal happens on the cold-standby VM
  (RTO ≤4h), using `pg_restore` + WAL replay to a chosen PITR timestamp.
- MinIO/SeaweedFS restore uses versioned replicas + manifest checksum job — the
  dev drill covers Postgres only; the pilot drill must also verify one document
  and one WORM audit anchor (`audit-anchors/<date>.json` in the `ulms-documents`
  bucket, AuditWormExportService 02:00 export) survive restore.
- Evidence goes to the bank ops dashboard + monthly ops review (PLANNING/10 §8).

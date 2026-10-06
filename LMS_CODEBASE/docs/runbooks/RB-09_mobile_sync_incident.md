# RB-09 — Mobile (CPV Field App) Sync Incident

**ID:** RB-09 · v1.0 · 2026-09-30 · Scope per PLANNING/10 §7 · Drillable on dev stack: **NO** (no mobile app and no delta-sync contract in the repo yet; API-side partial drill noted)

## Purpose

Field officers report the CPV/collections Android app stuck: today's visit list
not loading, completed visits/evidence not landing, offline queue not draining.

## Operating model (design source: PLANNING/08 A3 — the contract being built)

- **Server-authority:** task *status* transitions are server-wins; evidence
  (photos/notes/GPS/signature) is append-only and always accepted; a conflict
  re-fetches the task and shows a banner — never silent loss.
- Sync = pull delta `GET /field/tasks?since=` on foreground + 15-min push;
  upsert by `task_id + local_rev`; photos go direct to presigned URLs when
  online, queue in SQLite when not.
- JWT lives in expo-secure-store; certificate pinning to the gateway; devices
  are MDM-enrolled.

## Current repo reality (verified 2026-09-30 — why this is not drillable yet)

- `apps/` contains `api` and `web` only; the Expo app (scaffold W6–W9,
  PLANNING/12 §2) does not exist yet.
- The live endpoint is `GET /api/v1/collections/field-tasks`
  (CollectionsController.java:82-88, `openTasks()` — open tasks only) with **no
  `since` delta parameter**; the contract's `?since=` form is not implemented.

## Step-by-step (incident triage — server side, runnable today)

1. **RB-01 legs first:** api health, Keycloak realm reachability (mobile tokens
   come from the same realm `ulms`), gateway status.

2. **Is the task store itself healthy? (seeded data exists):**

   ```bash
   docker compose exec -T postgres psql -U ulms -d ulms -c \
     "select status, count(*) from ulms.field_task group by status;"
   ```

3. **Exercise the write path the app uses (roles `collections`/`admin`):**

   ```bash
   # assign a task to a seeded loan, then complete it — exactly what a stuck
   # device is failing to do
   LOAN=$(docker compose exec -T postgres psql -U ulms -d ulms -t -A -c \
     "select id from ulms.loan where loan_no='LN-300004'")
   curl -s -X POST -H "Authorization: Bearer $ATOK" -H "Content-Type: application/json" \
     -d "{\"loanId\":\"$LOAN\",\"assignedTo\":\"field-officer-1\",\"dueOn\":\"2026-10-01\"}" \
     http://localhost:8081/api/v1/collections/field-tasks
   # then: POST /api/v1/collections/field-tasks/<taskId>/complete  {"evidence":"..."}
   ```

   If both succeed server-side, the incident is device/network/pinning, not ULMS.

4. **Token leg:** mobile sessions are 15-min idle/8h absolute (PLANNING/06 §1) —
   a fleet-wide 401 storm is a realm outage (RB-01), not a sync bug.

## Verification (when the app + delta contract land, W6–W9)

- Delta endpoint returns only rows changed since the client's cursor.
- Evidence posted offline appears after reconnect; conflicting task completion
  returns the server state with a visible banner (server-wins), no data loss.
- Contract tests shared with web (PLANNING/08 A5) green.

## PRODUCTION VARIANT (pilot)

- App ships via bank MDM/EAS (Play Store only if BYOD); a bad build is rolled
  back by MDM pushing the previous APK — the app has no server-side rollback.
- SOS incidents (one-tap → branch security workflow + SMS) are treated as a
  Sev-1 sub-case: verify the SMS fallback provider fired (PLANNING/11 §5).
- Egress allow-list covers rails/CIB only; sync failures from NetworkPolicy
  changes show up as pinned-connection resets in device logs.

# RB-01 — Incident Response (triage, severity, comms)

**ID:** RB-01 · v1.0 · 2026-09-30 · Scope per PLANNING/10 §7 · Drillable on dev stack: **YES** (triage legs executed 2026-09-30)

## Purpose

First 30 minutes of any ULMS incident: establish scope, assign severity, start the
comms trail. Severity matrix and alert channels per PLANNING/10 §5; BB notification
path per PLANNING/06 §2.

## Preconditions

- Dev stack running (`cd LMS_CODEBASE/deploy/compose && docker compose ps`).
- Shell in `deploy/compose/` for every command below.
- On Windows Git Bash: prefix container-path commands with `MSYS_NO_PATHCONV=1`.

## Step-by-step (dev stack triage — verified 2026-09-30)

1. **Scope — which services are down?**

   ```bash
   docker compose ps
   ```

   Healthy baseline (verified live): postgres `Up (healthy)`, api/fineract/keycloak/minio `Up`.

2. **Health probes (no token needed):**

   ```bash
   curl -s -m 5 http://localhost:8081/actuator/health          # {"status":"UP"} — verified
   curl -sk -m 5 https://localhost:8083/fineract-provider/actuator/health   # Fineract TLS :8083 — verified 200
   curl -s -m 5 -o /dev/null -w "%{http_code}\n" http://localhost:8082/realms/ulms   # Keycloak
   curl -s -m 5 -o /dev/null -w "%{http_code}\n" http://localhost:9002/ulms-documents # SeaweedFS S3 — verified 200
   ```

3. **Auth-gate check (is it the app or the token?):**

   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/api/v1/compliance/classification
   # 401 = API up, auth working (verified live); 000/502 = API down
   ```

4. **Outbox backlog (alert threshold: >1000 rows or oldest >5min — PLANNING/10 §5):**

   ```bash
   docker compose exec -T postgres psql -U ulms -d ulms -c \
     "select count(*) undelivered, max(age(now(), created_at))::text oldest from ulms.outbox_event where dispatched_at is null;"
   ```

   (Verified live: 0 undelivered on a healthy stack.)

5. **Logs — newest 100 lines per suspect service:**

   ```bash
   docker compose logs --tail 100 api
   docker compose logs --tail 100 fineract
   docker compose logs --tail 100 keycloak
   ```

6. **Assign severity (PLANNING/10 §5):**

   | Signal | Severity |
   |---|---|
   | Backup missed / WAL lag >15min | critical |
   | EOD failure or >45min duration | high |
   | Outbox >1000 or oldest >5min | high |
   | API 5xx >1%/5min, p95 over budget 10min | page-on-duty |
   | Cert expiry <30d, disk >80% | warn |

7. **Comms trail (all incidents):** one channel per incident, first message =
   severity + affected services + next update time. Comms path: on-duty (pilot:
   lead dev by default, PLANNING/10 §8) → bank ops (critical only) → Bangladesh
   Bank notification per BB ICT V4.0 circular timelines (PLANNING/06 §2).

8. **If the whole engine is gone (Docker Desktop crash, seen in the wild):**
   recover per `LMS_CODEBASE/e2e/README.md` §"Environment recovery":

   ```powershell
   powershell -Command "Start-Process \"$LOCALAPPDATA\Programs\DockerDesktop\Docker Desktop.exe\""
   ```

   ```bash
   docker info        # wait until this answers
   docker compose start     # NOT up — start preserves volumes/state
   ```

## Verification

- Step 2 all green ⇒ infra tier healthy.
- Step 3 returns 401 (not 5xx) ⇒ API process healthy; investigate tokens/roles next.
- Step 4 returns 0 undelivered ⇒ async tier healthy.
- Record every command output with timestamps into the incident channel — this is
  the raw material for the post-incident review (PLANNING/10 §8 monthly ops review).

## PRODUCTION VARIANT (k3s, bank on-prem — do NOT run compose there)

- Steps 1/5 become `kubectl -n ulms get pods` and `kubectl -n ulms logs deploy/api --tail=100`.
- Health probes go through the gateway ingress with bank TLS; Grafana→SMS+email
  paging fires automatically for the §5 signals (RB-01 step 6 table is the alert
  config source of truth).
- BB notification is a mandatory timed step per circular, owned by the on-duty
  lead with bank ops on the channel; break-glass VPN access is audited
  (PLANNING/10 §8).
- This runbook must be rehearsed at least once before G5 (PLANNING/12 §6).

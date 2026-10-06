# RB-10 — Capacity: Add a Node / Replica

**ID:** RB-10 · v1.0 · 2026-09-30 · Scope per PLANNING/10 §7 · Drillable on dev stack: **NO** (k3s-only; dev `--scale` collides on fixed host ports — verified from the compose port map)

## Purpose

Add capacity to the pilot cluster when sustained load approaches limits
(monthly ops review capacity item, PLANNING/10 §8): more api replicas or a new
node in the 2-app-pool/1-db-pool k3s cluster (PLANNING/01 §3).

## Preconditions (pilot)

- Evidence, not vibes: Grafana RED dashboards show p95 nearing budget or
  sustained replica saturation for ≥1 week (alert thresholds PLANNING/10 §5).
- Resource requests/limits are set on workloads (PLANNING/10 §3) — without
  them a new node schedules nothing usefully.

## Step-by-step (pilot k3s — NOT runnable in dev)

1. **First lever — replicas, no new node:**

   ```bash
   kubectl -n ulms scale deploy/api --replicas=3
   kubectl -n ulms get pods -l app=api -w     # wait Running/Ready
   ```

   PDB on api tolerates the roll (PLANNING/10 §3). Check the gateway (nginx) —
   it fronts the pool, no config change needed.

2. **Second lever — add a node (VM provided by bank ops):**

   ```bash
   # on the new VM, join the k3s cluster (token from the server node)
   curl -sfL https://get.k3s.io | sh -s - agent --server https://<server>:6443 \
     --token "$K3S_NODE_TOKEN"     # value from the node's secret store, never a literal
   kubectl get nodes               # wait Ready
   ```

3. **Label it into the right pool and let the scheduler fill it:**

   ```bash
   kubectl label node <new-node> nodepool=app
   # optional rebalance of existing pods:
   kubectl -n ulms rollout restart deploy/api
   ```

4. **Data tier:** Postgres grows by *streaming replica for reporting*, not by
   piling primaries (PLANNING/01 §3 scale-out row); MinIO scales to a second
   replica with versioning+replication (PLANNING/10 §6). Neither is a step-2
   clone — they are their own change windows.

5. **Verify & record:** p95 back inside budget after ≥1 business day incl. EOD
   window; node counts and dashboards into the monthly ops review pack.

## Verification (pilot)

- `kubectl get nodes` shows the new node `Ready` and pods scheduled on it.
- Alert that triggered the exercise cleared; no new alerts during EOD (the
  nightly 23:30 batch is the natural load test — PLANNING/12 §2 risk #7).

## Dev-stack reality check (verified 2026-09-30)

`docker compose up -d --scale api=2` FAILS in dev: the compose file maps fixed
host ports (`8081:8081` for api; likewise 5433/8082/8083/9002 for the others),
so a second replica cannot bind. A dev approximation of step 1 would need a
compose override dropping the host port — useful as a demo, but it is NOT this
drill and must not be logged as one. Dev capacity questions are answered by the
staging scale run in W8 (PLANNING/12 §2 week 8 "staging scale run").

## PRODUCTION VARIANT

This runbook IS the production variant (bank on-prem k3s via Helm, PLANNING/10
§2). Long-term scale-out (outbox→Kafka bridge, reporting replica) is the
PLANNING/01 §3 "scale-out later" row — separate ADR, separate drill.

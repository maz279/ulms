# RB-07 — Node Failure (k3s pilot)

**ID:** RB-07 · v1.0 · 2026-09-30 · Scope per PLANNING/10 §7 · Drillable on dev stack: **NO** (k3s topology does not exist in dev; dev analog below)

## Purpose

Lose one node of the 3-node pilot k3s cluster (2 app-pool + 1 db-pool,
PLANNING/01 §3) and keep serving: pods reschedule, data survives, alerts fire.

## Preconditions (pilot)

- k3s cluster healthy: `kubectl get nodes` — all `Ready`.
- PodDisruptionBudgets exist on api/keycloak (PLANNING/10 §3) — verify once:
  `kubectl -n ulms get pdb`, `kubectl -n data get pdb`.
- Postgres WAL shipping to the standby verified current (lag alert <15min,
  PLANNING/10 §5).

## Step-by-step (pilot k3s — NOT runnable in dev)

1. **Confirm the failure, not the network:** `kubectl get nodes`;
   a `NotReady` node with pod churn = node down.
2. **Cordon it so nothing reschedules back:**
   `kubectl cordon <node>`.
3. **Evict/reschedule workloads:**
   `kubectl drain <node> --ignore-daemonsets --delete-emptydir-data`.
   api (2 replicas) and keycloak (2 replicas) must keep ≥1 pod Serving — that is
   the PDB doing its job; if drain hangs, the PDB is misconfigured, fix that first.
4. **Watch recovery:** `kubectl -n ulms get pods -w` until the surviving pods are
   `Running/Ready`; health via the gateway (RB-01 step 2 probes).
5. **db-pool node special case:** Postgres primary on the failed node → the
   standby is promoted per the DR cold-standby procedure (RTO ≤4h, PLANNING/10
   §6); bank ops joins the bridge — this is a *declared incident* (RB-01), not
   routine rescheduling.
6. **Restore the node:** patch/replace the VM, `kubectl uncordon <node>`, verify
   pods rebalance.

## Verification (pilot)

- Service health green throughout step 3-4 (zero user-visible downtime for
  app-pool loss is the pass criterion).
- `kubectl get nodes` all `Ready` after step 6; Grafana shows no alert.
- Drill logged as evidence — rehearsed before G5 (PLANNING/12 §6 covers RB-01..08).

## Dev-stack analog (what dev CAN rehearse today — verified 2026-09-30)

Single-container kill/restart of a stateless service:

```bash
cd deploy/compose
docker compose kill api && docker compose ps        # api Exited
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/actuator/health   # connection refused
docker compose start api
curl -s http://localhost:8081/actuator/health        # {"status":"UP"}
```

And the full-engine variant already seen in the wild (e2e/README.md §
"Environment recovery"): Docker Desktop restart → `docker compose start` (NOT
`up` — preserves volumes) → re-mint tokens. Caution verified 2026-09-30:
`start` revives containers with their ORIGINAL create-time env; only `up -d`
re-applies current `.env` (matters after RB-06 rotations).

## PRODUCTION VARIANT

This runbook IS the production variant (k3s/bank on-prem via VPN, break-glass
audited — PLANNING/10 §8). Dev compose has no node abstraction; adding a node in
dev is RB-10's dev-analog note.

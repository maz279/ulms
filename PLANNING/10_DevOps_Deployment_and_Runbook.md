# 10 — DevOps, Deployment & Operations Runbook Plan

**Doc:** PLAN-010 · v1.0 · 2026-09-27 · Owner: Lead Developer

---

## 1. Packaging

- Images: `ulms-api` (distroless JRE21), `ulms-web`, `ulms-portal` (nginx
  static), Fineract pinned image, Keycloak 26, Postgres 17, MinIO, Prometheus,
  Grafana, Loki — all built by CI, SBOM attached, signed (cosign) at release.
- **One artifact, many environments** — same image tag promoted DEV→UAT→PILOT;
  config via env only.

## 2. Environments (topology per 01 §3)

| Env | Deploy method | Data refresh |
|---|---|---|
| DEV | Compose, auto on main | nightly reseed |
| UAT | Compose on 2 VMs, tagged | weekly anonymized extract |
| PILOT | **k3s** (bank on-prem, 3 nodes) via Helm | migration cutover + daily prod backup |

## 3. Helm/k3s Layout (pilot)

```
namespace ulms:  api(2 replicas) web portal gateway(nginx)
namespace data:  postgres(primary) minio(2) keycloak(2)
namespace obs:   prometheus grafana loki promtail node-exporter
```

- Resource requests/limits set; PodDisruptionBudgets on api/keycloak;
- ConfigMaps for non-secret config; Secrets from bank vault/KMS (06) —
  **no literals in charts**;
- Ingress TLS with bank-issued certs; egress NetworkPolicy allow-list
  (CIB/NIDW/rails endpoints only).

## 4. CI/CD Promotion (02 §4 summary)

main → DEV auto → smoke suite; tag `vX.Y.Z-rc` → UAT + full E2E + sign-off;
tag `vX.Y.Z` + change window → pilot `helm upgrade --atomic` (auto-rollback on
failed readiness). DB migrations run as pre-deploy job with **expand→migrate→
contract** policy (additive first, drop only after N+2 releases).

## 5. Monitoring & Alerting

| Signal | Alert | Channel |
|---|---|---|
| API 5xx >1%/5min, p95 >budget 10min | page-on-duty (pilot: lead dev) | Grafana → SMS+email |
| EOD job failure / duration >45min | high | same |
| Outbox backlog >1000 or oldest >5min | high | same |
| Backup missed / WAL lag >15min | critical | same + bank ops |
| Cert expiry <30d, disk >80% | warn | bank ops dashboard |

Dashboards: prototype status-bar equivalents (routes, env) + RED per module +
business KPIs (applications/day, EOD stage counts) — Grafana shipped in chart.
Loki logs 90d hot; audit WORM per 06 (not in Loki).

## 6. Backup & Disaster Recovery

- Postgres: WAL shipping to standby node (RPO ≤15min) + nightly full +
  weekly offsite (bank vault); restore test monthly (logged as evidence).
- MinIO: versioning + replication to second node; manifest checksum job.
- DR: cold-standby VM with same chart; **RTO ≤4h** — rehearsed twice before
  pilot (cutover rehearsal doubles as drill, 04 §7).
- Fineract included in PG backup (same cluster) — restore = full stack.

## 7. Runbooks (docs/runbooks/, each ≤2 pages, rehearsed)

RB-01 incident response (severity, comms, BB notification path) ·
RB-02 restore drill · RB-03 EOD rerun · RB-04 Fineract upgrade (pin bump,
adapter contract tests, rollback) · RB-05 CIB file re-request ·
RB-06 key/secret rotation · RB-07 node failure (k3s) · RB-08 release &
rollback · RB-09 mobile sync incident · RB-10 capacity add node.

## 8. Operations Model for a 3-Dev Team (pilot)

- On-duty rotation (lead by default, shared after pilot); bank IT has read-only
  Grafana + runbook access — they host, we operate remotely via VPN with
  break-glass (audited).
- Monthly ops review: alerts recap, capacity, patch window (Fineract/Keycloak/
  PG minors), backup evidence, DR drill scheduling.

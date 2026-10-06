# R8 — Deployment & Observability (k3s, Helm, CI/CD, monitoring, backup, perf)
**Env:** k3s cluster / CI runner · **Est:** 2 weeks

## Deliverables
1. **Helm chart** (`deploy/chart/ulms`) — api/web + postgres (keycloak/fineract/minio as subcharts or in-cluster services), values.schema.json, secrets from env, resource requests/limits, liveness/readiness probes, `helm --atomic` install.
2. **k3s manifests** — namespaces (ulms-dev/staging), ingress + TLS (traefik/cert-manager), PVs, NetworkPolicy.
3. **CI/CD completion** — deploy-dev job → real k3s dev environment; trivy image-scan gate; SonarQube quality gate wired (coverage ≥80% enforced); ArgoCD vs GitLab-agent decision documented.
4. **Observability** — Prometheus alert rules + Grafana dashboards (API golden signals, EOD batch, BRPD mix, dunning queue, business KPIs); alert channels tested; structured JSON logs.
5. **Backup/DR** — pgBackRest full+incremental schedule + restore drill (extends RB-02); object-store bucket replication note; DR runbook rehearsal.
6. **Perf/security packs** — k6 load profiles (1,000 concurrent users, p95 <500ms), OWASP ZAP baseline in CI, ASVS L2 checklist refresh.

## Exit criteria
- [ ] `helm install` on k3s → full stack healthy; e2e green against the staging URL
- [ ] Dashboards + alerts demoed; restore-drill evidence appended to the g5 pack
- [ ] Perf report vs NFR targets; ZAP report filed

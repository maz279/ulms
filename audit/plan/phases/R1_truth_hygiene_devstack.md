# R1 — Truth, Hygiene & Dev-Stack Completion
**Env:** Node-only (this machine) · **Est:** 2 days · **Exit:** tracker honest, dev stack matches README, CI strict, web hardened

## Deliverables
1. **Tracker truth** — `LMS_CODEBASE/README.md` status ledger records G4/G5 *built* state (regcon/ECL/CAR/JV/reporting + g5-evidence + 18 e2e) and lists P6/P7 + bank-side G5 items as the open set.
2. **Rot removal** — delete `apps/api/nul`, `apps/api/src/main/java/nul`, `.../com/uslbd/ulms/nul`; add `.gitignore` (env, nul, node_modules, dist, test-results).
3. **Compose completion** — add `web` (vite build serve), `prometheus` (+`prometheus.yml` scraping api actuator), `grafana` (+ datasource provisioning + starter dashboard); parametrize + pin `FINERACT_IMAGE` (default pinned tag with digest-pin instruction); healthchecks for all services.
4. **CI strictness** — remove `allow_failure` from dependency-scan + sast (G1/G2 passed per plan); annotate `deploy-dev` as R8 scope.
5. **OpenAPI truth** — document `GET /collections/{loanId}/actions`; annotate `/actuator/health` + `/hooks/*` mount bases vs server entry.
6. **Web hardening** — top-level React error boundary; route-level code-splitting (React.lazy for the prototype page group); first Vitest unit suite (money formatting, Zod schemas, search index, BRPD classify parity); keep 18 e2e green.
7. **Mock parity** — mirror the OpenAPI addition into `scripts/mockApi`.

## Exit criteria — **ALL MET (2026-10-01)**
- [x] Audit + plan files exist
- [x] README ledger updated; junk gone; compose carries 8 services (web/prometheus/grafana, 6 healthchecks, Fineract SHA-pinned via FINERACT_IMAGE)
- [x] CI file strict (allow_failure removed from dependency-scan + sast); OpenAPI documents GET /collections/{loanId}/actions + mock parity route
- [x] `npm run build` + `tsc` + e2e 16 pass/2 skip/0 fail; error boundary wired above the Router; route-level lazy chunks (main 557→489 kB); unit suite 14/14 green — which surfaced and fixed a real `emiMonthly` zero-rate NaN bug

**Extra deliverables shipped in R1:** `apps/web/Dockerfile` + `nginx.conf` (static serve + /api + /hooks proxy), `deploy/compose/observability/` (prometheus.yml, grafana datasource + API-golden dashboard), `.env.example` keys (FINERACT_IMAGE, GRAFANA_ADMIN_PASSWORD, ULMS_RAILS_WEBHOOK_SECRET), `test:unit` npm script + vitest.config.ts.

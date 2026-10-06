# RB-08 — Release & Rollback

**ID:** RB-08 · v1.0 · 2026-09-30 · Scope per PLANNING/10 §7 · Drillable on dev stack: **YES** at the compose level (build/tag/verify/rollback mechanics; not executed end-to-end this session)

## Purpose

Ship a new api image and come back cleanly when it misbehaves. Promotion flow
(PLANNING/10 §4): main → DEV auto + smoke; `vX.Y.Z-rc` → UAT + full E2E;
`vX.Y.Z` + change window → pilot via `helm upgrade --atomic` (auto-rollback on
failed readiness). DB migrations run pre-deploy with **expand→migrate→contract**
(additive first; drop only after N+2 releases).

## Preconditions

- Working tree clean; CI green on main (gitleaks + SAST gates, PLANNING/06 §6).
- Migration files, if any, reviewed against the expand→contract policy
  (`apps/api/src/main/resources/db/migration/V*.sql` — Flyway owns the schema,
  `hibernate.ddl-auto: validate`).

## Step-by-step (dev compose release)

1. **Tag the current running api image — this is the rollback anchor:**

   ```bash
   docker tag ulms-api:p1 ulms-api:rollback-$(date +%Y%m%d%H%M)
   ```

2. **Build + release the new image (compose builds and runs tag `ulms-api:p1`,
   docker-compose.yml line 80):**

   ```bash
   cd deploy/compose && docker compose build api && docker compose up -d api
   ```

3. **Health + smoke gates (probe verified live 2026-09-30):**

   ```bash
   curl -s http://localhost:8081/actuator/health                       # {"status":"UP"}
   curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/api/v1/compliance/classification   # 401 = auth path intact
   make test                                                          # backend suite
   make e2e                                                           # Playwright (stack must be up)
   ```

4. **Rollback if any gate fails:**

   ```bash
   docker tag ulms-api:rollback-<timestamp> ulms-api:p1
   docker compose up -d --no-build api
   curl -s http://localhost:8081/actuator/health
   ```

5. **Migration rollback policy:** additive migrations from a failed release are
   LEFT IN PLACE (harmless to the older image — that is the point of expand
   first). A contract/drop migration is only ever executed N+2 releases later;
   if one misfires, restore per RB-02 — do not hand-edit schema.

## Verification

- Step 3 all green (two consecutive e2e runs per `e2e/README.md` flake note).
- `docker compose ps api` shows the recreated container Up.
- Rollback path verified when rehearsed: health `UP` + one spec green on the
  restored tag.

## PRODUCTION VARIANT (pilot k3s)

- No local builds: CI builds, signs (cosign), attaches SBOM (PLANNING/10 §1);
  the SAME image tag promotes DEV→UAT→PILOT — config via env only.
- Release = `helm upgrade --atomic` inside the bank change window; readiness
  failure rolls the release back automatically — step 4's manual `docker tag`
  dance does not exist (verify the `--atomic` drill on staging: G5 checklist
  line "Rollback plan verified (helm --atomic drill on staging)",
  PLANNING/12 §6).
- Migrations run as a pre-deploy job; the change window and bank sign-off are
  mandatory gates (RACI: Release/deploy L=A/R, bank I for window).

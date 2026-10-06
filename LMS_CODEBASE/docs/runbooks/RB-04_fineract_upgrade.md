# RB-04 — Fineract Image Upgrade / Pin Bump

**ID:** RB-04 · v1.0 · 2026-09-30 · Scope per PLANNING/10 §7 · Drillable on dev stack: **YES** (mechanics verified; image swap NOT executed this session — it would recreate the shared running stack)

## Purpose

Move ULMS to a new Fineract CE image (security patch or minor bump) with adapter
contract tests green and a one-command rollback. The dev compose runs
`apache/fineract:latest` today precisely because the pin is deferred to G0
sign-off (docker-compose.yml line 42 comment, ADR-002); this runbook is what the
pin *becomes*.

## Preconditions

- Know the current image digest: `docker inspect ulms-fineract-1 --format '{{.Image}}'`.
- New tag/digest approved (quarterly patch window, PLANNING/12 §2 risk #2).
- Test suite runnable: JDK 21 (Makefile `test`).

## Step-by-step (dev stack)

1. **Freeze the current state (rollback anchor):**

   ```bash
   docker tag apache/fineract:latest ulms-fineract:previous   # alias = rollback target
   ```

2. **Bump the pin in `deploy/compose/docker-compose.yml`:**

   ```yaml
   fineract:
     image: apache/fineract:<new-tag>@sha256:<digest>   # pin digest at G0 (ADR-002)
   ```

3. **Recreate only Fineract (rest of the stack keeps running):**

   ```bash
   cd deploy/compose && docker compose up -d fineract
   docker compose ps fineract
   ```

4. **Health gate before any tests (verified live 2026-09-30):**

   ```bash
   curl -sk https://localhost:8083/fineract-provider/actuator/health   # {"status":"UP"}
   ```

   Note: api talks to Fineract over self-signed TLS at `https://fineract:8083`
   with `FINERACT_INSECURE_TLS: "true"` (compose line 89 — dev/compose only).

5. **Adapter contract tests — the journeys that prove the adapter still works
   (loan creation through Fineract is asserted as `fineractLoanId` in
   `G2CreditToCashJourneyTest` / `OriginationJourneyTest`):**

   ```bash
   make test            # = cd apps/api && ./gradlew --console=plain test
   ```

6. **Live smoke through the real stack (strongest signal):**

   ```bash
   cd e2e && npx playwright test p2-credit.spec.ts    # board parity + EOD + disbursement
   ```

## Verification

- Step 4 `UP`; step 5 green; step 6 green (two consecutive runs per `e2e/README.md`
  flake guidance).
- Confirm the api container reconnected to the NEW Fineract: `docker compose logs --tail 50 api`
  shows no persistent Fineract 5xx/timeouts (adapter timeouts: connect 3s / read 10s, PLANNING/11 §7).

## Rollback

```bash
# revert the image line to the previous pin (or ulms-fineract:previous alias), then:
docker compose up -d fineract && curl -sk https://localhost:8083/fineract-provider/actuator/health
make test
```

## PRODUCTION VARIANT (pilot k3s)

- Image comes from the bank mirror/private registry (ADR-006 note), not Docker Hub;
  SBOM attached and cosign signature verified before the chart references it
  (PLANNING/10 §1).
- Upgrade = chart value bump + `helm upgrade --atomic` in the change window —
  auto-rollback on failed readiness (PLANNING/10 §4); the dev `docker tag` alias
  does not exist there.
- Fineract DB schema migrations (if the bump carries any) run as a pre-deploy job
  under expand→migrate→contract policy — additive first, drop only after N+2
  releases (PLANNING/10 §4). Quarter window per PLANNING/12 §2 risk #2.

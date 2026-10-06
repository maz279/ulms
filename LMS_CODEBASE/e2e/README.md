# ULMS e2e Suite — Runbook

Playwright journeys against the REAL stack: compose services (API :8081,
Keycloak :8082, Fineract :8083, Postgres, SeaweedFS S3) + the Vite dev server
(:5173) proxying `/api` and `/hooks`. Browser: system Edge (`channel:
"msedge"` — this network blocks the Playwright CDN download).

## Prerequisites

```bash
cd deploy/compose && docker compose up -d        # stack healthy
cd apps/web  && npm install                      # once
cd e2e        && npm install                     # once
```

Demo data: `deploy/seed/10-seed.sql` loans (LN-300001…) must exist.

## The two tokens (both from env — NEVER in source)

The suite needs an **admin/officer token** and, since audit-G, a **distinct
compliance-officer token** (the returns sign-off chain rejects the checker
filing their own pack — 06 §8 maker-checker). Realm users live in Keycloak;
reset a password once via kcadm if needed:

```bash
# tokens (15-minute sessions — mint fresh for EVERY run)
ATOK=$(curl -s http://localhost:8082/realms/ulms/protocol/openid-connect/token \
  -d grant_type=password -d client_id=ulms-web -d username=smoke \
  -d password='<smoke-password>' | python -c "import json,sys;print(json.load(sys.stdin)['access_token'])")
CTOK=$(curl -s http://localhost:8082/realms/ulms/protocol/openid-connect/token \
  -d grant_type=password -d client_id=ulms-web -d username=g2compliance \
  -d password='<compliance-password>' | python -c "import json,sys;print(json.load(sys.stdin)['access_token'])")
```

## Run (fresh tokens + vite restart EVERY time)

Vite embeds `VITE_ULMS_TOKEN` at boot — a stale server serves 401s that
masquerade as "element not found". Kill :5173, restart, then run:

```bash
PID=$(netstat -ano | grep ":5173.*LISTENING" | head -1 | awk '{print $NF}')
[ -n "$PID" ] && taskkill //PID $PID //F
cd apps/web && (VITE_ULMS_TOKEN=$ATOK nohup npm run dev > /tmp/vite.log 2>&1 &)
sleep 7
cd ../e2e && VITE_ULMS_TOKEN=$ATOK E2E_COMPLIANCE_TOKEN=$CTOK npx playwright test
```

- Without `VITE_ULMS_TOKEN` the p2 API-leg test skips.
- Without `E2E_COMPLIANCE_TOKEN` the p4 two-officer chain leg skips.
- Two consecutive green runs = trustworthy (flakes ~token expiry windows).

## Specs

| File | Gate | Journeys |
|---|---|---|
| `walking-skeleton.spec.ts` | G0 | customer CRUD + problem+json contract |
| `p1-origination.spec.ts` | G1/G2 | 360+KYC+screening, apply wizard→ladder→sanction, Zod gate, DBR auto-decline |
| `p2-credit.spec.ts` | G2 | board parity + EOD, disbursement dual-auth via API (3 officers) |
| `p3-servicing.spec.ts` | G3 | worklist+PTP, payment lifecycle, portal thin slice, webhook HMAC rejection |
| `p4-regcon.spec.ts` | G4 | regcon board+KPIs, provision JV button, CL-1 generate→check→distinct-officer file, calendar, ECL + portfolio + writer |

## Environment recovery (seen in the wild)

Docker Desktop can crash mid-session (engine pipe `npipe://…dockerDesktopLinuxEngine`
gone, all containers Exited 255). Recover:

```bash
powershell -Command "Start-Process \"$LOCALAPPDATA\Programs\DockerDesktop\Docker Desktop.exe\""
# wait for: docker info
cd deploy/compose && docker compose start     # NOT up — preserves volumes/state
# then re-mint BOTH tokens and restart vite as above
```

API-leg calls from specs use same-origin in-page `fetch` through the Vite
proxy (absolute-URL fetch contexts are blocked by the repo security scanner).

## Mock-stack mode (2026-10-01)

Without the Java compose stack the suite runs green against the ULMS mock API:

1. `cd ../apps/web && npm run mock:api`  (serves :8081 for the API-leg specs)
2. `npm run dev` in a second shell       (serves :5173 with the mock middleware)
3. `npx playwright test`

16/18 pass; the 2 skips are the token-gated two-officer legs that require real
Keycloak principals (E2E_COMPLIANCE_TOKEN / VITE_ULMS_TOKEN).

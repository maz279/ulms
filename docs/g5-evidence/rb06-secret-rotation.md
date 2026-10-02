# RB-06 — Key/Secret Rotation Drill Evidence (webhook HMAC secret)

Executed: 2026-09-30T12:12Z · Stack: DEV compose

```
pre-rotation:  current-secret signature -> 200 (idempotent UTR replay — no data mutation)
secret rotated in deploy/compose/.env (the sanctioned env-only store, 06)
API recreated via docker compose up -d api
post-rotation: OLD secret -> 401 [rejected]
               NEW secret -> 200 [accepted]
zero rail callbacks dropped: HMAC fail-closed held through the cutover
[PASS]
```

## What was proven

1. The rotation procedure is exactly: new value in the env store →
   `docker compose up -d api` (k3s rolling restart in production). No code
   change, no image change.
2. **Fail-closed semantics held through rotation**: a callback signed with
   the retired secret is rejected (401) — an attacker who captured the old
   secret gains nothing after rotation.
3. A correctly-signed callback under the new secret is accepted and dedupes
   by UTR exactly as before (the 200 was a replay of UTR-LIVE-1, proving the
   exactly-once path survives a secret change).

Production variant: the bank schedules rotation per 06; the same drill runs
at UAT with the rails' sandbox before cutover.

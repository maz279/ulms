# RB-06 — Key / Secret Rotation

**ID:** RB-06 · v1.0 · 2026-09-30 · Scope per PLANNING/10 §7 · Drillable on dev stack: **YES** (kcadm legs executed 2026-09-30; DB/MinIO env legs not executed — they would rotate the shared dev stack mid-session)

## Purpose

Rotate the stack's credentials without losing data or access. Quarterly cadence
per PLANNING/06 §1; "secrets rotated for production" is a G5 checklist line
(PLANNING/12 §6). **No credential literal ever appears in shell history, docs, or
transcripts — new values are generated into a variable and written straight to
`.env` (gitignored) or the secret store.**

## Preconditions

- Stack up; you are in `deploy/compose/`.
- `.env` is present (variable names only are documented in `.env.example`).
- Know the compose gotcha verified 2026-09-30: **`KEYCLOAK_ADMIN` exists only at
  container-create time** (it interpolates into `KC_BOOTSTRAP_ADMIN_*`). A
  container revived by `docker compose start` carries the env it was CREATED
  with — after any `.env` change you must `docker compose up -d` (recreate), not
  just `start`.

## Step-by-step (dev stack)

### Leg 1 — Postgres `ULMS_DB_PASSWORD` (representative app-secret rotation)

1. Generate and apply in-DB (local socket needs no old password):

   ```bash
   NEWPW=$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c 24)
   docker compose exec -T postgres psql -U ulms -d ulms -c \
     "ALTER ROLE ulms LOGIN PASSWORD '$NEWPW';"
   ```

2. Write it to `.env` (never the transcript): `ULMS_DB_PASSWORD=$NEWPW`.

3. Recreate the consumers so they pick it up (postgres + api use this var):

   ```bash
   docker compose up -d
   unset NEWPW
   ```

4. Verify: `curl -s http://localhost:8081/actuator/health` → `UP` (api reconnected
   with the new password; failure mode is a datasource 401 in `docker compose logs api`).

### Leg 2 — Keycloak officer/officer-admin password (kcadm — executed 2026-09-30)

Login from inside the container (pipe the script; Git Bash mangles inline
`sh -c` quoting — observed 2026-09-30):

```bash
cat > /tmp/kc.sh <<'EOF'   # or use the Write tool for this script
/opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 \
  --realm master --user "$KC_BOOTSTRAP_ADMIN_USERNAME" --password "$KC_BOOTSTRAP_ADMIN_PASSWORD"
/opt/keycloak/bin/kcadm.sh set-password -r ulms --username <user> --new-password "$NEW_PW"
EOF
docker compose exec -T keycloak sh -s < /tmp/kc.sh && rm /tmp/kc.sh
```

Notes verified live: realm password policy **requires ≥1 special char**
(pure-alnum passwords are rejected with `invalidPasswordMinSpecialCharsMessage`);
role grant if the rotated principal is new: `add-roles -r ulms --uusername <user>
--rolename <role>`; user delete needs the **id** (`kcadm get users -q username=…
| kcadm delete users/<id> -r ulms`) — `--username` does not work on delete.

### Leg 3 — SeaweedFS/MinIO keys + others

Same pattern as Leg 1 for `MINIO_ROOT_USER/MINIO_ROOT_PASSWORD` (WeaweedFS S3
keys, compose lines 71-73): change in `.env`, `docker compose up -d`, verify the
bucket answers `curl -s -o /dev/null -w "%{http_code}" http://localhost:9002/ulms-documents` (200).
`FINERACT_DB_PASSWORD` additionally needs the matching `ALTER ROLE fineract`;
`FINERACT_PASSWORD` (adapter user) must be changed in Fineract itself first.
`ULMS_RAILS_WEBHOOK_SECRET` rotates with the rail partner and fails CLOSED when
unset (compose line 94 comment) — coordinate the rails window before rotating.

## Verification

- `docker compose ps` all Up; `curl -s http://localhost:8081/actuator/health` → `UP`.
- Old token now fails, fresh mint succeeds (RB-03 step 0 mint) for any rotated user.
- One e2e leg (`cd e2e && npx playwright test walking-skeleton.spec.ts`) green
  proves the full auth+DB path end-to-end.

## PRODUCTION VARIANT (pilot)

- Secrets come from the bank vault/KMS into chart Secrets — **no literals in
  charts** (PLANNING/10 §3); rotation happens in the vault, then `helm upgrade`
  rolls the pods — `.env`-style editing does not exist.
- Rotation is dual-authorized (config change = maker-checker, PLANNING/06 §3) and
  every step lands in the hash-chained audit trail.
- Bank-issued TLS certs (gateway ingress) rotate on their own schedule with a
  <30d-expiry warn alert (PLANNING/10 §5); mTLS to Fineract where supported.

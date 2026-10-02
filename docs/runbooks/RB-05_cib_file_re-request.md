# RB-05 — CIB Report Re-Request (file channel)

**ID:** RB-05 · v1.0 · 2026-09-30 · Scope per PLANNING/10 §7 · Drillable on dev stack: **YES** (executed 2026-09-30)

## Purpose

Re-obtain a Bangladesh Bank CIB report when the monthly SFTP file failed or was
malformed (PLANNING/11 §1 failure policy: SFTP unreachable → retry exp backoff ×5
then this ops path; malformed row → quarantine + continue; a partial file never
silently drops subjects). ULMS dedupes by `(cif, report_period, file_id)` and the
re-request guard surfaces "already have newer" — re-requesting is always safe.

## Preconditions

- Token with role `credit-analyst`, `compliance` or `admin` (endpoint gate on
  `POST /api/v1/assessments/cib/file`). Mint as in RB-03 step 0.
- The subject exists (seeded customers: `CIF-100871`…`CIF-100875`,
  `deploy/seed/10-seed.sql`).
- The raw file body — in production pulled from the bank SFTP retry; in dev the
  mock/golden layout: `HDR,<period>,<fileId>` / `SUBJ,<cif>,<name>` / FACL rows
  (159 chars: 10/30/12/15×4/5/6/8/24 field widths, `CibFixedWidthParserTest`)
  / `TRLR,<count>`.

## Step-by-step (executed and verified 2026-09-30)

1. **Check what we already hold for the subject (the "already have newer" guard):**

   ```bash
   curl -s -H "Authorization: Bearer $ATOK" http://localhost:8081/api/v1/assessments/cib/CIF-100871 | head -c 400
   ```

2. **Re-ingest the file (build the JSON body without a literal payload file):**

   ```bash
   BODY=$(python - <<'PY'
   row = ("FACL" + "RBDRILL001".ljust(10) + "Drill Bank Ltd.".ljust(30) + "TERM".ljust(12)
          + "500000000".zfill(15) + "310000000".zfill(15) + "0".zfill(15) + "4500000".zfill(15)
          + "0".zfill(5) + "STD-0".ljust(6) + "20260915" + "0"*24)
   assert len(row) == 159, len(row)
   raw = "HDR,2026-09,RBDRILL01\nSUBJ,CIF-100871,Md. Rafiqul Islam\n" + row + "\nTRLR,1\n"
   import json; print(json.dumps({"cif":"CIF-100871","period":"2026-09","fileId":"RBDRILL01","raw":raw}))
   PY
   )
   curl -s -X POST -H "Authorization: Bearer $ATOK" -H "Content-Type: application/json" \
     -d "$BODY" http://localhost:8081/api/v1/assessments/cib/file
   ```

   A **new** `fileId` (e.g. `RBDRILL02` from the bank's re-sent file) creates a
   fresh report; the same `fileId` re-plays idempotently.

3. **Repeat the exact same POST** — dedupe proof (verified live: same report id
   returned, no second row).

4. **Database evidence (raw retained + parsed facilities):**

   ```bash
   docker compose exec -T postgres psql -U ulms -d ulms -c \
     "select status, source, report_period, file_id, storage_key from ulms.cib_report where file_id='RBDRILL01';"
   ```

5. **Real-time channel alternative (where the bank is enrolled):**

   ```bash
   curl -s -X POST -H "Authorization: Bearer $ATOK" http://localhost:8081/api/v1/assessments/cib/CIF-100871
   ```

## Verification (actual 2026-09-30 drill output)

- Step 2: `{"id":"46624f9e-…","status":"PARSED","period":"2026-09","error":null}`.
- Step 3: identical id returned (dedupe by cif+period+fileId — one row, `source=FILE`).
- Step 4: single `PARSED | FILE | 2026-09 | RBDRILL01` row.
- A deliberately malformed FACL row (non-numeric amounts) yields a quarantine/
  error status, never a silent drop (golden fixtures `CibFixedWidthParserTest`).

## PRODUCTION VARIANT (pilot)

- The file arrives on the bank SFTP, not a curl body; the retry ladder (backoff
  ×5) runs in the adapter BEFORE this runbook opens. After 5 failures this
  runbook = coordinate with bank ops for re-send, then the scheduled ingest picks
  it up — the endpoint above stays the same for manual catch-up.
- Raw reports are encrypted objects under retention policy (PLANNING/06 §5/§7);
  officer inquiry audit interlocks apply to every pull (PLANNING/06 §6).
- Egress to CIB endpoints only, via the NetworkPolicy allow-list (PLANNING/10 §3).

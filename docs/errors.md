# ULMS Error Code Registry (PLANNING/05 §3)

Stable machine-readable `code` values carried in every problem+json response.
Client i18n keys map to `code`; `detail` is the developer message (English).

| Code | HTTP | Meaning | Example source |
|---|---|---|---|
| `ULMS-NOT-FOUND` | 404 | Unknown customer / application / task id | `GET /applications/{id}` with random id |
| `ULMS-FORBIDDEN` | 403 | Authenticated role not authorized for the ladder level | act on an L5 task without `ho-credit`/`admin` |
| `ULMS-VAL-0001` | 422 | Validation or policy rejection | DBR exceeds policy max 50%; unreadable upload body |
| `ULMS-STATE-0001` | 409 | State-machine conflict | submit on non-SCREENING stage; PATCH a locked draft; store checksum mismatch; returns sign-off out of chain order; compliance sign-off by the checker (distinct-officer, 06 §8); provision-JV repost after a drifted EOD rerun (drift alert raised) |
| `ULMS-STATE-0002` | 409 | Optimistic-concurrency conflict (05 §4) | PATCH with a stale `version`; concurrent modification lost the race |

Adding a code: append here first (this file is the registry), then use
`GlobalExceptionHandler.withCode(...)`. Field-level `fields[]` entries
(bilingual per 05 §3) arrive with the form-error work in P2.

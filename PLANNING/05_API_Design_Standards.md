# 05 — API Design Standards

**Doc:** PLAN-005 · v1.0 · 2026-09-27 · Owner: Lead System Developer
**Source of truth:** `packages/openapi/ulms-api.yaml` (OpenAPI 3.1) — code and
types are generated FROM it (backend interfaces via openapi-generator, web via
openapi-typescript). Spec changes precede implementation (API-first).

---

## 1. Conventions

- Base: `https://{host}/api/v1` — version in path; breaking change ⇒ `/v2` for
  affected resources only.
- Resources plural kebab: `/customers`, `/applications/{id}/documents`.
- Verbs: GET (safe), POST (create/actions), PATCH (partial update), PUT
  (full update, rare), DELETE soft (state change e.g. `/lifecycle` preferred).
- Actions as sub-resources: `POST /approvals/{taskId}/act`.
- Filtering: `?stage=&branch=&q=&sort=-created_at&page=3&size=25`
  (size cap 100). Cursor pagination only for statements/audit.

## 2. Standard Response Envelope

```json
// single
{ "data": { ... }, "meta": { "requestId": "uuid" } }
// list
{ "data": [ ... ], "meta": { "requestId": "uuid", "page": 1, "size": 25,
  "totalElements": 512, "totalPages": 21 } }
```

## 3. Error Model (RFC 9457 problem+json)

```json
{ "type": "https://ulms.uslbd.com/errors/validation",
  "title": "Validation failed", "status": 422,
  "code": "ULMS-VAL-0042",
  "detail": "Requested amount exceeds product ceiling",
  "fields": [{ "path": "amount", "code": "max", "message": "…",
               "messageBn": "…" }],
  "requestId": "uuid", "instance": "/api/v1/applications" }
```

Rules: every error carries stable `code` (registry in repo `/docs/errors.md`),
bilingual `message`/`messageBn` for user-facing fields, no stack traces, no
internal IDs leaked. Map: 400 malformed → 401/403 (OIDC) → 404 → 409 state
conflict (includes optimistic-lock `version` mismatches) → 422 validation →
429 rate-limited (Retry-After) → 5xx opaque + alert.

## 4. Idempotency & Concurrency

- All POST that create or move money require `Idempotency-Key` header (UUID);
  server stores key+request-hash+response for 48h; replays return the original
  result with `Idempotent-Replay: true`.
- Optimistic concurrency: aggregates carry `version`; PATCH sends
  `If-Unmodified-Since`-style `version` — mismatch ⇒ 409 with current state.
- External refs (rail UTRs, CIB file ids) are unique-constrained — duplicate
  callbacks are absorbed, not errors.

## 5. Security (details in 06)

- OIDC bearer JWT (Keycloak); scopes per module; role + **branch scope** claims
  enforced at service layer (a branch officer cannot read other branches'
  customers — tested by matrix tests).
- TLS only; HSTS; request size caps; rate limits per role (defaults:
  120 req/min user, burst 300).
- Every mutating endpoint declares its audit event in OpenAPI extension
  `x-audit-event` — CI check: no audit-undeclared mutations.

## 6. Domain Standards

- Money: `{"amount": 15000000, "currency": "BDT"}` = ৳150,000.00 (minor units,
  integer only). Formatting (Lakh/Crore) is a **client concern** — API never
  sends formatted strings.
- Dates: ISO-8601 UTC `Z`; the API accepts `?asOf=YYYY-MM-DD` for
  point-in-time reads (classification board history).
- Enums: UPPER_SNAKE, registry per spec (e.g. `ApplicationStage`,
  `BrpdStage` = `STD_0|STD_1|STD_2|SMA|SS|DF|BL`).
- Bilingual content: objects expose `{ "en": "...", "bn": "..." }`; **client
  renders one** per active language (enforced by frontend CI probe).

## 7. Webhooks (inbound from rails/CIB realtime)

- Signed (`X-ULMS-Signature` HMAC per secret per partner — secrets from env),
  replay-protected (`X-ULMS-Timestamp` ±5min), idempotent by external ref.
- Endpoint per partner class: `/hooks/payments/{rail}`, `/hooks/cib`.

## 8. Versioning & Compatibility Policy

- Additive changes (new optional fields/endpoints) — no version bump.
- Breaking (remove/rename/semantic change) — new `/v2` route, `/v1` supported
  minimum 12 months after GA, deprecation headers `Sunset:` announced.
- CI job diffs spec against `main` with oasdiff — breaking changes require the
  `api-break` label + lead approval.

## 9. Performance Budgets & Observability

- p95 targets per 01 §7; every response includes `X-Request-Id` +
  `Server-Timing`; slow-query guard (>300ms) logs explain-plan tag.
- OpenAPI `examples` for every endpoint — they double as Playwright fixtures.

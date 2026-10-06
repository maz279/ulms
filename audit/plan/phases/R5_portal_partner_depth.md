# R5 — Portal & Partner Depth
**Env:** Java + Node · **Est:** 1 week

## Deliverables
1. **Borrower portal** — self-service application initiation (reuses the wizard API), document upload (checksum + scan), statements browsing + CSV/PDF, payment history, notification preferences; fully bilingual.
2. **Partner API channel (B1-s4)** — API-key/OAuth client-credentials scope, partner intake endpoint (rate-limited, idempotent), status webhook callbacks; developer docs page.
3. **Tracker consistency** — portal application tracker shares the workflow projection (no second truth) — verify with a test.

## Exit criteria
- [ ] e2e: borrower applies via portal → branch pipeline sees the same application; partner POST → application created
- [ ] OpenAPI v1.7 partner section; mock parity; security scopes defined

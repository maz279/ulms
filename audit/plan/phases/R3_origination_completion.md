# R3 — Origination Completion (products, sanction letters, BOCC, outbox)
**Env:** Java (CI compile; Testcontainers) + Node UI · **Est:** 2–3 weeks

## Deliverables
1. **Loan-product engine (CORE)** — `loan_product` tables (bilingual info, amounts min/max/default/step, tenors+grace, fixed/floating + floor/ceiling/spread, frequency/strategy/amortization, prepayment rules + penalty, charge schedule, security requirements/LTV); CRUD + versioning + activation; eligibility pre-check endpoint; wizard product step reads the catalog (replaces hardcoded list); seed 8–23 products from the catalogue doc; OpenAPI v1.6.
2. **Sanction letters (CORE)** — activate the dormant `sanction_letter` table: bilingual template render (HTML→PDF), generation on SANCTION, acceptance tracking (tokenized portal link), branch copy, resend; portal acceptance endpoint; OpenAPI + UI (B4 screens wired, replacing archetype demos).
3. **BOCC committee module (CORE)** — `bocc_meeting / agenda_item / attendance / minute / vote` tables; agenda builder from pending ≥threshold applications; one-page case summary; voting + dissenting opinion; auto-minutes draft; UI for B3-s1..s6 screens.
4. **Transactional outbox (ADR-004)** — implement the `outbox_event` writer in the same transaction as state changes; relay (@scheduled) → Spring application events → notification queue (R4) + audit fan-out; replay/idempotency; ArchUnit rule forbidding direct publishes.
5. **OpenAPI + mock sync** for every new path; web pages wired to live APIs.

## Exit criteria
- [ ] Backend tests: product CRUD/validation, sanction render golden, BOCC quorum/voting rules, outbox exactly-once relay
- [ ] e2e: pick product from catalog → sanction letter generated → BOCC minutes recorded
- [ ] OpenAPI v1.6 redocly-clean; mock parity; ledger updated

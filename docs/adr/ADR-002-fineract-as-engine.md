# ADR-002: Fineract CE as lending engine, REST-only integration

**Status:** Accepted · **Date:** 2026-09-27
**Context:** PLANNING/01 — avoid rebuilding loan math; Fineract release cadence
is independent (ASF board health: amber).
**Decision:** ULMS never patches Fineract's schema; all lending writes go
through Fineract's REST API behind `FineractPort` (Adapter+Facade; generated
client from Fineract's OpenAPI when P1 lands). We pin the image digest and
upgrade via RB-04 with contract tests.
**Consequences:** Two schemas, one cluster; mirror tables in `ulms`; exactly-once
against Fineract via outbox+reconciliation (P1).

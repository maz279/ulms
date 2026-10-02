# ADR-001: Modular monolith (not microservices)

**Status:** Accepted · **Date:** 2026-09-27 · **Deciders:** Lead, team
**Context:** PLANNING/01 — 3-developer team; v2 sketched microservices+Kafka.
**Decision:** Single Spring Boot 4 application, 9 enforced modules
(Spring Modulith verification test = CI gate; see ModularityTest).
**Consequences:** One deployable; module boundaries are code-enforced; service
extraction criteria pre-agreed (independent scaling OR release cadence OR
security domain) — documented as ADR-007 template when needed.

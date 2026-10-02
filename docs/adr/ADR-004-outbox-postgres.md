# ADR-004: Transactional outbox in Postgres (no Kafka day one)

**Status:** Accepted · **Date:** 2026-09-27
**Context:** At ABC-bank scale, Postgres is comfortably the transactional
backbone; a broker adds 3-dev-unsupported ops burden.
**Decision:** Domain events are rows in `ulms.outbox_event`, written in the
same transaction as the state change; a dispatcher (P1) delivers to
integration adapters with per-adapter retry/circuit-breaker.
**Consequences:** Same ordering/reliability guarantees we need; bridge to
Kafka later is a dispatcher change, zero domain-code impact.

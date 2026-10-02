# ADR-003: DB-backed workflow engine (no external BPM)

**Status:** Accepted · **Date:** 2026-09-27
**Context:** Camunda 8 self-managed requires a paid enterprise license for any
production use (PLANNING/00 §1). Our flows (7-level ladder, BRPD EOD,
doc queue, CIB schedules) are state+transition+timers, not ad-hoc human design.
**Decision:** workflow_definition/instance/task tables + Spring service with
ShedLock timers. Flowable 7 (Apache-2.0, in-process) is the documented escape
hatch if BPMN visibility is ever mandated.
**Consequences:** ~2 dev-weeks built inside mod-approval; full audit trail;
ladder bands are configuration rows (bank-tunable) per PLANNING/03.

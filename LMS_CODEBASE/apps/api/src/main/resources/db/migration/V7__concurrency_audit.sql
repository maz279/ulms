-- V7 — P2 audit-D fixes (05 §4, 06 §3, 04 §3, 11 §1):
-- 1. Optimistic concurrency (05 §4): aggregates carry a version; PATCH with
--    a stale version ⇒ 409 ULMS-STATE-0002.
-- 2. Audit trail completeness (06 §3): source IP per entry (best-effort from
--    the request thread; null for scheduled jobs).
-- 3. collateral_valuation history (04 §3): every valuation — initial and
--    revaluations — is an immutable history row; collateral keeps the current.

ALTER TABLE ulms.application   ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE ulms.disbursement  ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE ulms.audit_entry   ADD COLUMN IF NOT EXISTS source_ip VARCHAR(45);

CREATE TABLE ulms.collateral_valuation (
  id             UUID PRIMARY KEY,
  collateral_id  UUID NOT NULL REFERENCES ulms.collateral(id),
  value_minor    BIGINT NOT NULL,
  valued_on      DATE,
  valued_by      VARCHAR(64) NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_collval_collateral ON ulms.collateral_valuation(collateral_id);

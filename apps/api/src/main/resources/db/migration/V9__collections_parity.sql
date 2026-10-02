-- V9 — P3 audit-iteration spec-parity fixes (03 mod-collections/mod-approval, 08 B1):
-- 1. legal_case: recovery & legal case tracking (03 table + CRUD).
-- 2. collection_action.due_on: the dunning-ladder timer axis (03 "timers on
--    collection_action") — the nightly job queues the next SMS→call→visit
--    step as a DUE action when the step's window elapses.

CREATE TABLE ulms.legal_case (
  id            UUID PRIMARY KEY,
  loan_id       UUID NOT NULL REFERENCES ulms.loan(id),
  case_no       VARCHAR(24) NOT NULL UNIQUE,
  court         VARCHAR(160),
  filed_on      DATE,
  status        VARCHAR(12) NOT NULL DEFAULT 'FILED',   -- FILED|ONGOING|WON|LOST|WITHDRAWN
  claim_minor   BIGINT NOT NULL,
  lawyer        VARCHAR(120),
  notes         VARCHAR(500),
  created_by    VARCHAR(64) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_legalcase_loan ON ulms.legal_case(loan_id);

ALTER TABLE ulms.collection_action ADD COLUMN IF NOT EXISTS due_on DATE;
CREATE INDEX IF NOT EXISTS idx_collaction_due ON ulms.collection_action(due_on, outcome);

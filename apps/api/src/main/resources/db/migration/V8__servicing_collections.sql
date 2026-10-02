-- V8 — P3 Servicing & Collections (03 mod-servicing / mod-collections, 11 §3, 08 B1):
-- payments mirror + intents + statements, reschedule/settlement quotes,
-- collections (actions, PTP, field tasks), loan tenor/rate for schedules.

-- loan mirror gains the fields the schedule/quote oracles need
ALTER TABLE ulms.loan ADD COLUMN IF NOT EXISTS tenor_months INT NOT NULL DEFAULT 12;
ALTER TABLE ulms.loan ADD COLUMN IF NOT EXISTS interest_rate_bp INT NOT NULL DEFAULT 1199;
ALTER TABLE ulms.loan ADD COLUMN IF NOT EXISTS last_paid_at TIMESTAMPTZ;

CREATE TABLE ulms.payment (
  id               UUID PRIMARY KEY,
  loan_id          UUID NOT NULL REFERENCES ulms.loan(id),
  amount_minor     BIGINT NOT NULL CHECK (amount_minor > 0),
  external_ref     VARCHAR(80) NOT NULL UNIQUE,      -- 03: idempotent by external ref
  rail             VARCHAR(16) NOT NULL,             -- COUNTER | BKASH | NAGAD | BEFTN
  utr              VARCHAR(64) UNIQUE,               -- rail UTR; webhook idempotency axis (05 §7)
  status           VARCHAR(12) NOT NULL DEFAULT 'COMPLETED',
  fineract_txn_id  BIGINT,                           -- repayment transaction
  paid_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  posted_by        VARCHAR(64) NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payment_loan ON ulms.payment(loan_id, paid_at DESC);

CREATE TABLE ulms.payment_intent (
  id          UUID PRIMARY KEY,
  loan_id     UUID NOT NULL REFERENCES ulms.loan(id),
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  rail        VARCHAR(16) NOT NULL,
  rail_ref    VARCHAR(64),                           -- rail's reference for this intent
  rail_url    VARCHAR(300),                          -- redirect/deeplink (08 B2: never card data)
  status      VARCHAR(10) NOT NULL DEFAULT 'CREATED', -- CREATED|COMPLETED|EXPIRED
  initiated_by VARCHAR(64) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_intent_loan ON ulms.payment_intent(loan_id, created_at DESC);

CREATE TABLE ulms.statement_run (
  id           UUID PRIMARY KEY,
  loan_id      UUID NOT NULL REFERENCES ulms.loan(id),
  rows         INT NOT NULL,
  from_ts      TIMESTAMPTZ NOT NULL,
  to_ts        TIMESTAMPTZ NOT NULL,
  generated_by VARCHAR(64) NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_statement_loan ON ulms.statement_run(loan_id, generated_at DESC);

CREATE TABLE ulms.reschedule_request (
  id            UUID PRIMARY KEY,
  loan_id       UUID NOT NULL REFERENCES ulms.loan(id),
  new_tenor_months INT NOT NULL CHECK (new_tenor_months BETWEEN 3 AND 120),
  reason        VARCHAR(300) NOT NULL,
  status        VARCHAR(10) NOT NULL DEFAULT 'REQUESTED', -- REQUESTED|APPROVED|REJECTED
  requested_by  VARCHAR(64) NOT NULL,
  decided_by    VARCHAR(64),
  decided_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ulms.settlement_quote (
  id             UUID PRIMARY KEY,
  loan_id        UUID NOT NULL REFERENCES ulms.loan(id),
  outstanding_minor BIGINT NOT NULL,
  penalty_minor  BIGINT NOT NULL,
  rebate_minor   BIGINT NOT NULL,
  total_minor    BIGINT NOT NULL,
  valid_until    TIMESTAMPTZ NOT NULL,
  quoted_by      VARCHAR(64) NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ulms.collection_action (
  id          UUID PRIMARY KEY,
  loan_id     UUID NOT NULL REFERENCES ulms.loan(id),
  action_type VARCHAR(10) NOT NULL,                  -- CALL|SMS|VISIT|NOTICE
  outcome     VARCHAR(20) NOT NULL,                  -- CONTACTED|NO_ANSWER|PROMISED|REFUSED
  notes       VARCHAR(400),
  actor       VARCHAR(64) NOT NULL,
  acted_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_collaction_loan ON ulms.collection_action(loan_id, acted_at DESC);

CREATE TABLE ulms.ptp (
  id                  UUID PRIMARY KEY,
  loan_id             UUID NOT NULL REFERENCES ulms.loan(id),
  promised_amount_minor BIGINT NOT NULL CHECK (promised_amount_minor > 0),
  promised_on         DATE NOT NULL,
  confidence          VARCHAR(8) NOT NULL,           -- HIGH|MEDIUM|LOW
  contact_name        VARCHAR(120),
  contact_relation    VARCHAR(60),
  contact_phone       VARCHAR(20),                   -- ops use; masked in logs/audit (06 §5)
  remark              VARCHAR(400),
  dpd_at_promise      INT NOT NULL,
  classification_at_promise VARCHAR(6) NOT NULL,
  kept                VARCHAR(8) NOT NULL DEFAULT 'PENDING', -- PENDING|KEPT|BROKEN
  promised_by         VARCHAR(64) NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ptp_loan ON ulms.ptp(loan_id, promised_on);

CREATE TABLE ulms.field_task (
  id          UUID PRIMARY KEY,
  loan_id     UUID NOT NULL REFERENCES ulms.loan(id),
  assigned_to VARCHAR(64) NOT NULL,
  due_on      DATE NOT NULL,
  status      VARCHAR(8) NOT NULL DEFAULT 'OPEN',    -- OPEN|DONE (server-wins; evidence append-only)
  notes       VARCHAR(1000),                         -- append-only evidence log (JSON lines)
  created_by  VARCHAR(64) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  done_at     TIMESTAMPTZ
);
CREATE INDEX idx_fieldtask_status ON ulms.field_task(status, due_on);

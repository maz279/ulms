-- V5 — P2 Credit & Approval (PLANNING/03 mod-assessment/mod-approval/mod-compliance, 04 §3):
-- CIB pull + parsed facilities, versioned scorecard, collateral registry,
-- dual-authorized disbursement, ULMS loan mirror, BRPD 15/2024 EOD engine.

-- ── mod-assessment ─────────────────────────────────────────────────────────
CREATE TABLE ulms.cib_report (
  id            UUID PRIMARY KEY,
  customer_id   UUID NOT NULL REFERENCES ulms.customer(id),
  cif_no        VARCHAR(16) NOT NULL,
  status        VARCHAR(12) NOT NULL,        -- PENDING | PARSED | FAILED
  source        VARCHAR(16) NOT NULL,        -- MOCK_REALTIME | FILE
  report_period VARCHAR(7)  NOT NULL,        -- YYYY-MM (11 §1 dedupe axis)
  file_id       VARCHAR(40) NOT NULL,
  raw           TEXT,
  parsed        JSONB,
  error         VARCHAR(200),
  pulled_by     VARCHAR(64) NOT NULL,
  pulled_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_cib_dedupe UNIQUE (cif_no, report_period, file_id)  -- 11 §1 idempotency
);
CREATE INDEX idx_cibreport_customer ON ulms.cib_report(customer_id, pulled_at DESC);

CREATE TABLE ulms.cib_facility (
  id               UUID PRIMARY KEY,
  cib_report_id    UUID NOT NULL REFERENCES ulms.cib_report(id),
  lender_code      VARCHAR(20),
  lender_name      VARCHAR(120),
  facility_type    VARCHAR(30),
  limit_minor      BIGINT,
  outstanding_minor BIGINT,
  overdue_minor    BIGINT,
  installment_minor BIGINT,                  -- monthly obligation → DBR (03)
  dpd              INT,
  classification   VARCHAR(6),
  last_payment_date DATE
);
CREATE INDEX idx_cibfacility_report ON ulms.cib_facility(cib_report_id);

CREATE TABLE ulms.score_result (
  id              UUID PRIMARY KEY,
  application_id  UUID NOT NULL REFERENCES ulms.application(id),
  version         INT NOT NULL,              -- scorecard policy version (03)
  score           INT NOT NULL,
  grade           VARCHAR(2) NOT NULL,       -- A | B | C | D
  decision        VARCHAR(14) NOT NULL,      -- AUTO_PASS | REFER | AUTO_DECLINE
  factors         JSONB NOT NULL,            -- attribute → points breakdown
  computed_by     VARCHAR(64) NOT NULL,
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_scoreresult_app ON ulms.score_result(application_id, computed_at DESC);

CREATE TABLE ulms.collateral (
  id              UUID PRIMARY KEY,
  application_id  UUID NOT NULL REFERENCES ulms.application(id),
  collateral_type VARCHAR(30) NOT NULL,      -- LAND | PROPERTY | FDR | MACHINERY | GUARANTEE
  description     VARCHAR(200),
  value_minor     BIGINT NOT NULL,
  valued_on       DATE,
  insured_until   DATE,
  created_by      VARCHAR(64) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_collateral_app ON ulms.collateral(application_id);

-- application assessment snapshot (04 §2: "snapshot of customer/product/amount/tenor/DBR at each stage")
ALTER TABLE ulms.application
  ADD COLUMN income_minor        BIGINT,
  ADD COLUMN existing_emi_minor  BIGINT,
  ADD COLUMN cib_obligation_minor BIGINT,
  ADD COLUMN fineract_loan_id    BIGINT;

-- ── mod-approval: disbursement dual authorization ──────────────────────────
CREATE TABLE ulms.disbursement (
  id               UUID PRIMARY KEY,
  application_id   UUID NOT NULL REFERENCES ulms.application(id),
  amount_minor     BIGINT NOT NULL,
  state            VARCHAR(12) NOT NULL,     -- PREPARED | AUTHORIZED | RELEASED
  prepared_by      VARCHAR(64) NOT NULL,
  prepared_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  authorized_by    VARCHAR(64),
  authorized_at    TIMESTAMPTZ,
  released_at      TIMESTAMPTZ,
  fineract_txn_id  BIGINT,                   -- disburse transaction (major-unit engine)
  CONSTRAINT uq_disbursement_active UNIQUE (application_id)
);
CREATE INDEX idx_disbursement_state ON ulms.disbursement(state);

CREATE TABLE ulms.dual_authorization (
  id              UUID PRIMARY KEY,
  disbursement_id UUID NOT NULL REFERENCES ulms.disbursement(id),
  action          VARCHAR(12) NOT NULL,      -- PREPARE | AUTHORIZE | RELEASE
  actor           VARCHAR(64) NOT NULL,
  acted_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_dualauth_disb ON ulms.dual_authorization(disbursement_id);

-- ── loan mirror + mod-compliance BRPD 15/2024 engine ──────────────────────
-- application_id NULLABLE: migrated/demo portfolio loans (G2 board data) map
-- straight to the customer; ULMS-originated loans carry the application id.
CREATE TABLE ulms.loan (
  id               UUID PRIMARY KEY,
  application_id   UUID REFERENCES ulms.application(id),
  customer_id      UUID NOT NULL REFERENCES ulms.customer(id),
  loan_no          VARCHAR(16) NOT NULL UNIQUE,
  fineract_loan_id BIGINT UNIQUE,
  principal_minor  BIGINT NOT NULL,
  outstanding_minor BIGINT NOT NULL,
  dpd              INT NOT NULL DEFAULT 0,
  stage            VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',   -- ACTIVE | CLOSED
  classification   VARCHAR(6) NOT NULL DEFAULT 'STD-0',
  interest_suspense BOOLEAN NOT NULL DEFAULT false,          -- SS onward (03)
  disbursed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_loan_classification ON ulms.loan(classification);

CREATE TABLE ulms.provision_run (
  id                     UUID PRIMARY KEY,
  run_date               DATE NOT NULL UNIQUE,   -- EOD idempotent per date (03)
  loans_classified       INT NOT NULL,
  total_outstanding_minor BIGINT NOT NULL,
  total_provision_minor  BIGINT NOT NULL,
  detail                 JSONB NOT NULL,         -- per-class counts + amounts
  started_by             VARCHAR(64) NOT NULL,
  finished_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ulms.classification_history (
  id               UUID PRIMARY KEY,
  loan_id          UUID NOT NULL REFERENCES ulms.loan(id),
  run_date         DATE NOT NULL,
  from_class       VARCHAR(6),
  to_class         VARCHAR(6) NOT NULL,
  dpd              INT NOT NULL,
  outstanding_minor BIGINT NOT NULL,
  provision_rate_bp INT NOT NULL,
  provision_minor  BIGINT NOT NULL,
  interest_suspense BOOLEAN NOT NULL,
  classified_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_classification_loan_date UNIQUE (loan_id, run_date)
);

CREATE TABLE ulms.compliance_alert (
  id          UUID PRIMARY KEY,
  type        VARCHAR(24) NOT NULL,           -- STR_CASH_THRESHOLD | CIB_PULL_FAILED
  aggregate   VARCHAR(40),
  aggregate_id UUID,
  detail      JSONB NOT NULL,
  state       VARCHAR(10) NOT NULL DEFAULT 'OPEN',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- R10 (audit/plan/phases/R10_unbuilt_business_logic_plan.md) — unbuilt
-- business logic, all phases. Bank-tunable values carry seed defaults that
-- UAT re-configures; no credentials here by policy (06 §1).

-- ============ P-A: dunning ladder as configuration (ULS-01 §6.1) ============
CREATE TABLE ulms.dunning_step (
    seq          INT PRIMARY KEY,
    min_dpd      INT NOT NULL,
    max_dpd      INT,                              -- NULL = unbounded
    action_type  VARCHAR(16) NOT NULL,             -- SMS|CALL|VISIT|NOTICE|STRATEGY|NPA_RECOVERY
    cadence_days INT NOT NULL
);
INSERT INTO ulms.dunning_step (seq, min_dpd, max_dpd, action_type, cadence_days) VALUES
  (1,  1,  6,    'SMS',          7),
  (2,  7,  14,   'CALL',         7),
  (3,  15, 29,   'VISIT',        14),
  (4,  30, 59,   'NOTICE',       14),   -- legal-notice preparation
  (5,  60, 89,   'STRATEGY',     14),   -- recovery strategy assignment
  (6,  90, NULL, 'NPA_RECOVERY', 14);   -- NPA classification + recovery initiation

-- ============ P-B: SLA policy per ladder level (WF-SPEC §5) ============
-- minutes: standard / urgent. Auto-escalation fires at SLA + 50%.
CREATE TABLE ulms.sla_policy (
    level        INT PRIMARY KEY,                  -- 1..7 (approval-ladder-7)
    standard_min INT NOT NULL,
    urgent_min   INT NOT NULL
);
INSERT INTO ulms.sla_policy (level, standard_min, urgent_min) VALUES
  (1,  240,  120), (2,  360,  180), (3,  480,  240), (4,  720,  360),
  (5, 1440,  720), (6, 2880, 1440), (7, 4320, 2160);

ALTER TABLE ulms.workflow_task
    ADD COLUMN IF NOT EXISTS sla_state VARCHAR(10) NOT NULL DEFAULT 'OK';
    -- OK → WARNED (80% of SLA) → BREACHED → ESCALATED (SLA + 50%)

-- ============ P-B: risk-based pricing (DMN §3: premium by grade) ============
CREATE TABLE ulms.rate_card (
    grade      VARCHAR(2) PRIMARY KEY,             -- A|B|C|D
    premium_bp INT NOT NULL
);
INSERT INTO ulms.rate_card (grade, premium_bp) VALUES
  ('A', 0), ('B', 100), ('C', 250), ('D', 400);

ALTER TABLE ulms.application
    ADD COLUMN IF NOT EXISTS stp            BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS grade          VARCHAR(2),
    ADD COLUMN IF NOT EXISTS applied_rate_bp INT;

-- ============ P-B: customer risk + merge + KYC refresh ============
ALTER TABLE ulms.customer
    ADD COLUMN IF NOT EXISTS risk           VARCHAR(8) NOT NULL DEFAULT 'Low',
    ADD COLUMN IF NOT EXISTS merged_into_cif VARCHAR(16),
    ADD COLUMN IF NOT EXISTS last_kyc_at    TIMESTAMPTZ;

-- ============ P-C: classification override flags (CLS-ALGO §1.2) ============
ALTER TABLE ulms.loan
    ADD COLUMN IF NOT EXISTS legal_flag        BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS bankruptcy_flag   BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS rescheduled_on    DATE,
    ADD COLUMN IF NOT EXISTS pre_reschedule_classification VARCHAR(6);

-- ============ P-C: collateral registry (PLAN-03; USER-CR §5) ============
-- ulms.collateral EXISTS since V5 (application-scoped) — extend it into the
-- customer-level registry with FSV + lifecycle status instead of a new table
ALTER TABLE ulms.collateral
    ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES ulms.customer (id),
    ADD COLUMN IF NOT EXISTS forced_sale_value_minor BIGINT,
    ADD COLUMN IF NOT EXISTS status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE ulms.collateral ALTER COLUMN application_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_collateral_customer ON ulms.collateral (customer_id);
-- FSV defaults to 80% of market value where historical rows carry none
UPDATE ulms.collateral SET forced_sale_value_minor = CEIL(value_minor * 0.8)
    WHERE forced_sale_value_minor IS NULL;

-- six-rung ladder actions exceed the V8 width (NPA_RECOVERY = 12 chars)
ALTER TABLE ulms.collection_action ALTER COLUMN action_type TYPE VARCHAR(16);

-- R5 parity: portal demo uploads carry no application binding yet
ALTER TABLE ulms.application_document ALTER COLUMN application_id DROP NOT NULL;

-- ============ P-C: transaction monitoring + CTR (BFIU: cash ≥ ৳10 L) ============
CREATE TABLE ulms.ctr_report (
    id          UUID PRIMARY KEY,
    cif_no      VARCHAR(16) NOT NULL,
    payment_id  UUID NOT NULL,
    amount_minor BIGINT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    exported    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ctr_cif ON ulms.ctr_report (cif_no);

CREATE TABLE ulms.monitoring_alert (
    id         UUID PRIMARY KEY,
    cif_no     VARCHAR(16) NOT NULL,
    rule       VARCHAR(20) NOT NULL,               -- VELOCITY|STRUCTURING
    detail     TEXT NOT NULL,
    str_raised BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_monitoring_cif ON ulms.monitoring_alert (cif_no);

-- ============ P-D: portal OTP store ============
CREATE TABLE ulms.otp_request (
    id          UUID PRIMARY KEY,
    mobile      VARCHAR(16) NOT NULL,
    code_hash   VARCHAR(64) NOT NULL,              -- sha256(code + salt)
    expires_at  TIMESTAMPTZ NOT NULL,
    attempts    INT NOT NULL DEFAULT 0,
    consumed    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_otp_mobile ON ulms.otp_request (mobile, created_at DESC);

-- ============ P-E: BLR dated config + floating flags + moratorium ============
CREATE TABLE ulms.blr_rate (
    id             INT PRIMARY KEY DEFAULT 1,      -- singleton row per effective date
    rate_bp        INT NOT NULL,
    effective_from DATE NOT NULL,
    active         BOOLEAN NOT NULL DEFAULT TRUE
);
INSERT INTO ulms.blr_rate (id, rate_bp, effective_from, active) VALUES
  (1, 950, DATE '2026-10-01', TRUE);               -- 9.50% — bank ALCO re-configures (tunable)

ALTER TABLE ulms.loan
    ADD COLUMN IF NOT EXISTS rate_type   VARCHAR(10) NOT NULL DEFAULT 'FIXED',
    ADD COLUMN IF NOT EXISTS spread_bp   INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS moratorium_months INT NOT NULL DEFAULT 0;

-- ============ P-F: Basel risk weights + capital base (BASEL §3, §4.3) ============
CREATE TABLE ulms.risk_weight (
    rkey       VARCHAR(20) PRIMARY KEY,            -- segment keys + BRPD classes
    weight_bp  INT NOT NULL
);
INSERT INTO ulms.risk_weight (rkey, weight_bp) VALUES
  ('RETAIL', 7500), ('SME', 10000), ('CORPORATE', 10000), ('MORTGAGE', 3500),
  ('SS', 15000), ('DF', 20000), ('B/L', 25000);

CREATE TABLE ulms.capital_base (
    id            INT PRIMARY KEY DEFAULT 1,
    capital_minor BIGINT NOT NULL
);
INSERT INTO ulms.capital_base (id, capital_minor) VALUES
  (1, 10000000000);                                -- ৳10 Cr placeholder — bank sets at UAT (tunable)

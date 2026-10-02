-- R3 (audit/plan/phases/R3) — origination completion: loan-product engine,
-- sanction letters, BOCC committee, transactional outbox (ADR-004 activation).
-- R4 (phases/R4) — write-off/recovery, guarantors, notifications, AML/STR.
-- R5 (phases/R5) — partner channel registry.

-- ============ R3: loan-product engine (no-code product configuration) ============
CREATE TABLE ulms.loan_product (
    id                  UUID PRIMARY KEY,
    code                VARCHAR(20)  NOT NULL,
    version             INT          NOT NULL,
    status              VARCHAR(10)  NOT NULL,          -- DRAFT | ACTIVE | RETIRED
    name_en             VARCHAR(120) NOT NULL,
    name_bn             VARCHAR(120),
    min_amount_minor    BIGINT       NOT NULL,
    max_amount_minor    BIGINT       NOT NULL,
    step_minor          BIGINT       NOT NULL DEFAULT 500000,
    tenor_min_months    INT          NOT NULL,
    tenor_max_months    INT          NOT NULL,
    rate_type           VARCHAR(10)  NOT NULL,          -- FIXED | FLOATING
    rate_bp             INT          NOT NULL,
    spread_bp           INT,                              -- floating: BLR + spread (ADR-009)
    frequency           VARCHAR(12)  NOT NULL DEFAULT 'MONTHLY',
    amortization        VARCHAR(12)  NOT NULL DEFAULT 'REDUCING',
    prepay_penalty_bp   INT          NOT NULL DEFAULT 200,
    collateral_required BOOLEAN      NOT NULL DEFAULT FALSE,
    guarantor_required  BOOLEAN      NOT NULL DEFAULT FALSE,
    max_ltv_bp          INT          NOT NULL DEFAULT 0,
    created_by          VARCHAR(64)  NOT NULL,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CHECK (min_amount_minor > 0 AND max_amount_minor >= min_amount_minor),
    CHECK (tenor_max_months >= tenor_min_months),
    UNIQUE (code, version)
);
CREATE INDEX idx_loan_product_active ON ulms.loan_product (code) WHERE status = 'ACTIVE';

CREATE TABLE ulms.loan_product_charge (
    -- element-collection backing table: Hibernate writes (product_id, code) only
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES ulms.loan_product (id),
    code       VARCHAR(20) NOT NULL,                    -- PROCESSING | LATE_FEE | PREPAYMENT | DOCUMENTATION
    UNIQUE (product_id, code)
);

-- ============ R3: sanction letters (bilingual, acceptance-tracked) ============
-- V2 shipped a stub table (letter_no/body_json — never referenced by code);
-- evolve it to the R3 shape. Pre-pilot DBs hold no rows: a NOT NULL failure
-- here flags a stray legacy letter that needs manual backfill.
ALTER TABLE ulms.sanction_letter
    ADD COLUMN IF NOT EXISTS app_no           VARCHAR(16),
    ADD COLUMN IF NOT EXISTS cif_no           VARCHAR(16),
    ADD COLUMN IF NOT EXISTS customer_name_en VARCHAR(120),
    ADD COLUMN IF NOT EXISTS amount_minor     BIGINT,
    ADD COLUMN IF NOT EXISTS tenor_months     INT,
    ADD COLUMN IF NOT EXISTS rate_bp          INT,
    ADD COLUMN IF NOT EXISTS acceptance_token VARCHAR(64),
    ADD COLUMN IF NOT EXISTS accepted_at      TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS body_en          TEXT,
    ADD COLUMN IF NOT EXISTS body_bn          TEXT;
UPDATE ulms.sanction_letter SET app_no  = COALESCE(app_no, letter_no);
UPDATE ulms.sanction_letter SET body_en = COALESCE(body_en, body_json::text);
ALTER TABLE ulms.sanction_letter
    ALTER COLUMN app_no           SET NOT NULL,
    ALTER COLUMN cif_no           SET NOT NULL,
    ALTER COLUMN customer_name_en SET NOT NULL,
    ALTER COLUMN amount_minor     SET NOT NULL,
    ALTER COLUMN tenor_months     SET NOT NULL,
    ALTER COLUMN rate_bp          SET NOT NULL,
    ALTER COLUMN acceptance_token SET NOT NULL,
    ALTER COLUMN body_en          SET NOT NULL,
    ALTER COLUMN status           TYPE VARCHAR(10),
    DROP COLUMN IF EXISTS letter_no,
    DROP COLUMN IF EXISTS body_json;
-- single live letter per application (REPLACED rows keep history) — partial
-- unique INDEX, since PG has no partial UNIQUE table constraint
CREATE UNIQUE INDEX uq_sanction_live ON ulms.sanction_letter (application_id) WHERE status <> 'REPLACED';
CREATE INDEX idx_sanction_status ON ulms.sanction_letter (status);

-- ============ R3: BOCC committee ============
CREATE TABLE ulms.bocc_meeting (
    id            UUID PRIMARY KEY,
    branch_code   VARCHAR(8)  NOT NULL,
    meeting_date  DATE        NOT NULL,
    status        VARCHAR(10) NOT NULL,                   -- SCHEDULED | HELD | CLOSED
    quorum_needed INT         NOT NULL,
    minutes_text  TEXT,                                     -- auto-drafted on close
    closed_at     TIMESTAMPTZ,
    created_by    VARCHAR(64) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bocc_meeting_branch ON ulms.bocc_meeting (branch_code, meeting_date);

CREATE TABLE ulms.bocc_agenda_item (
    id             UUID PRIMARY KEY,
    meeting_id     UUID NOT NULL REFERENCES ulms.bocc_meeting (id),
    application_id UUID NOT NULL REFERENCES ulms.application (id),
    app_no         VARCHAR(16) NOT NULL,
    cif_no         VARCHAR(16) NOT NULL,
    amount_minor   BIGINT NOT NULL,
    resolution     VARCHAR(20),                            -- RECOMMEND_APPROVE | REJECT | HOLD
    UNIQUE (meeting_id, application_id)
);

CREATE TABLE ulms.bocc_attendance (
    -- id/signed_at are DB-defaulted: Hibernate's element collection only writes (meeting_id, member)
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id  UUID NOT NULL REFERENCES ulms.bocc_meeting (id),
    member      VARCHAR(64) NOT NULL,
    signed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (meeting_id, member)
);

CREATE TABLE ulms.bocc_vote (
    id          UUID PRIMARY KEY,
    meeting_id  UUID NOT NULL REFERENCES ulms.bocc_meeting (id),
    agenda_item UUID NOT NULL REFERENCES ulms.bocc_agenda_item (id),
    member      VARCHAR(64) NOT NULL,
    vote        VARCHAR(10) NOT NULL,                      -- APPROVE | REJECT | HOLD | DEFER
    dissent     TEXT,
    voted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (agenda_item, member)
);

-- ============ R3: transactional outbox (ADR-004 — activation) ============
-- V1 already ships outbox_event (id, aggregate, aggregate_id, type, payload,
-- created_at, dispatched_at, attempts). Add relay bookkeeping only.
ALTER TABLE ulms.outbox_event
    ADD COLUMN IF NOT EXISTS last_error TEXT;
CREATE INDEX IF NOT EXISTS idx_outbox_pending_v12 ON ulms.outbox_event (created_at) WHERE dispatched_at IS NULL;

-- ============ R4: write-off / recovery ============
CREATE TABLE ulms.write_off (
    id                         UUID PRIMARY KEY,
    loan_id                    UUID NOT NULL,
    loan_no                    VARCHAR(16) NOT NULL,
    cif_no                     VARCHAR(16) NOT NULL,
    amount_minor               BIGINT NOT NULL,
    provision_at_proposal_minor BIGINT NOT NULL,
    classification             VARCHAR(6) NOT NULL,        -- SS | DF | B/L
    state                      VARCHAR(10) NOT NULL,       -- PROPOSED | EXECUTED | REVERSED
    board_band                 VARCHAR(16) NOT NULL,        -- EXEC_COMMITTEE | BOARD
    proposed_by                VARCHAR(64) NOT NULL,
    proposed_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    approved_at                TIMESTAMPTZ,
    reversed_at                TIMESTAMPTZ,
    gl_ref                     VARCHAR(32),
    reason                     TEXT NOT NULL
);
CREATE INDEX idx_write_off_state ON ulms.write_off (state);

CREATE TABLE ulms.recovery_entry (
    id              UUID PRIMARY KEY,
    loan_id         UUID NOT NULL,
    loan_no         VARCHAR(16) NOT NULL,
    cif_no          VARCHAR(16) NOT NULL,
    amount_minor    BIGINT NOT NULL,
    mode            VARCHAR(10) NOT NULL,                  -- CASH | BANK | AUCTION
    incentive_minor BIGINT NOT NULL,                       -- 5% policy
    received_by     VARCHAR(64) NOT NULL,
    received_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_recovery_loan ON ulms.recovery_entry (loan_id);

-- ============ R4: guarantor registry ============
CREATE TABLE ulms.guarantor (
    id                  UUID PRIMARY KEY,
    customer_id         UUID NOT NULL REFERENCES ulms.customer (id),
    name                VARCHAR(120) NOT NULL,
    nid                 VARCHAR(20),
    mobile              VARCHAR(14) NOT NULL,
    cib_score           INT,
    cib_status          VARCHAR(8),                        -- CLEAR | REFER
    linked_amount_minor BIGINT NOT NULL DEFAULT 0,
    status              VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
    checked_at          DATE,
    created_by          VARCHAR(64) NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_guarantor_customer ON ulms.guarantor (customer_id);

-- ============ R4: notifications ============
CREATE TABLE ulms.notification_template (
    id       UUID PRIMARY KEY,
    type     VARCHAR(40) NOT NULL,                         -- APPLICATION_SUBMITTED | APPROVED | DISBURSED | EMI_REMINDER | OVERDUE | ...
    channel  VARCHAR(8)  NOT NULL,                         -- SMS | EMAIL
    lang     VARCHAR(2)  NOT NULL,                         -- en | bn
    body     TEXT NOT NULL,                                -- {name} / {amount} placeholders
    updated_by VARCHAR(64) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (type, channel, lang)
);

CREATE TABLE ulms.notification_delivery (
    id        UUID PRIMARY KEY,
    type      VARCHAR(40) NOT NULL,
    cif_no    VARCHAR(16),
    recipient VARCHAR(20),
    channel   VARCHAR(8) NOT NULL,
    body      TEXT NOT NULL,
    status    VARCHAR(12) NOT NULL,                        -- QUEUED | SENT | DELIVERED | FAILED
    sent_at   TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_delivery_recent ON ulms.notification_delivery (created_at DESC);

-- ============ R4: AML / STR ============
CREATE TABLE ulms.str_report (
    id           UUID PRIMARY KEY,
    cif_no       VARCHAR(16) NOT NULL,
    reason       TEXT NOT NULL,
    amount_minor BIGINT NOT NULL DEFAULT 0,
    status       VARCHAR(10) NOT NULL,                     -- DRAFT | FILED
    bfiu_ref     VARCHAR(24) NOT NULL,
    filed_by     VARCHAR(64) NOT NULL,
    filed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_str_cif ON ulms.str_report (cif_no);

-- ============ R5: partner channel ============
CREATE TABLE ulms.partner_channel (
    id            UUID PRIMARY KEY,
    partner_name  VARCHAR(80) NOT NULL,
    api_key_hash  VARCHAR(64) NOT NULL,                    -- sha256(api key) — key itself never stored (06 §1)
    rate_per_min  INT NOT NULL DEFAULT 60,
    status        VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (api_key_hash)
);

ALTER TABLE ulms.application
    ADD COLUMN IF NOT EXISTS channel     VARCHAR(10) NOT NULL DEFAULT 'BRANCH',   -- BRANCH | PORTAL | PARTNER
    ADD COLUMN IF NOT EXISTS partner_ref VARCHAR(40);

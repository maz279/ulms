-- V2: origination + workflow engine + documents + approval bands (PLANNING/03, 04 §4)

-- ---------- origination ----------
CREATE TABLE ulms.application (
    id               UUID PRIMARY KEY,
    app_no           VARCHAR(16) NOT NULL UNIQUE,          -- APP-7xxxx
    customer_id      UUID NOT NULL REFERENCES ulms.customer(id),
    product_code     VARCHAR(20) NOT NULL,                 -- product config key (03 Product Variants)
    amount_minor     BIGINT NOT NULL,                      -- BDT minor units (04 §2)
    tenor_months     INT   NOT NULL,
    rate_type        VARCHAR(10) NOT NULL DEFAULT 'FIXED', -- FIXED | FLOATING (BLR+spread, ADR-009)
    stage            VARCHAR(20) NOT NULL DEFAULT 'SCREENING',
    dbr_percent      NUMERIC(5,2),
    branch_code      VARCHAR(8)  NOT NULL,
    created_by       VARCHAR(40) NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_application_stage ON ulms.application(stage);
CREATE INDEX idx_application_branch ON ulms.application(branch_code);

CREATE TABLE ulms.application_document (
    id             UUID PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES ulms.application(id),
    doc_type       VARCHAR(30) NOT NULL,      -- NID_PHOTO, INCOME_PROOF, BANK_STATEMENT...
    storage_key    VARCHAR(200) NOT NULL,     -- MinIO object key
    sha256         VARCHAR(64) NOT NULL,         -- checksum (04 §7 M4 manifests)
    size_bytes     BIGINT NOT NULL,
    scan_status    VARCHAR(10) NOT NULL DEFAULT 'PENDING',  -- PENDING|CLEAN|INFECTED (virus-scan hook)
    uploaded_by    VARCHAR(40) NOT NULL,
    uploaded_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_appdoc_application ON ulms.application_document(application_id);

CREATE TABLE ulms.sanction_letter (
    id             UUID PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES ulms.application(id),
    letter_no      VARCHAR(20) NOT NULL UNIQUE,
    body_json      JSONB NOT NULL,            -- bilingual template output (03 mod-approval)
    status         VARCHAR(12) NOT NULL DEFAULT 'ISSUED',
    issued_by      VARCHAR(40) NOT NULL,
    issued_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- workflow engine (ADR-003; PLANNING/04 §4) ----------
CREATE TABLE ulms.workflow_definition (
    key          VARCHAR(30) PRIMARY KEY,     -- e.g. approval-ladder-7
    name         VARCHAR(60) NOT NULL,
    graph        JSONB NOT NULL,              -- nodes, transitions, roles, dual(phase) flags
    version      INT NOT NULL DEFAULT 1,
    active       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE ulms.workflow_instance (
    id            UUID PRIMARY KEY,
    definition_key VARCHAR(30) NOT NULL REFERENCES ulms.workflow_definition(key),
    aggregate     VARCHAR(40) NOT NULL,       -- 'application'
    aggregate_id  UUID NOT NULL,
    current_node  VARCHAR(30) NOT NULL,
    status        VARCHAR(12) NOT NULL DEFAULT 'RUNNING',  -- RUNNING|COMPLETED|REJECTED|RETURNED
    started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at      TIMESTAMPTZ
);
CREATE INDEX idx_wf_instance_aggregate ON ulms.workflow_instance(aggregate, aggregate_id);

CREATE TABLE ulms.workflow_task (
    id            UUID PRIMARY KEY,
    instance_id   UUID NOT NULL REFERENCES ulms.workflow_instance(id),
    node          VARCHAR(30) NOT NULL,
    assignee_role VARCHAR(30) NOT NULL,       -- ladder level role (L1..L7) or 'maker'/'checker'
    assignee_user VARCHAR(40),                -- claimed user (approver)
    phase         VARCHAR(10) NOT NULL DEFAULT 'ACTION',  -- ACTION | CHECK (maker-checker dual phase)
    status        VARCHAR(12) NOT NULL DEFAULT 'OPEN',    -- OPEN|CLAIMED|DONE|REJECTED|RETURNED
    sla_deadline  TIMESTAMPTZ,                -- per-stage SLA (03 mod-approval)
    opened_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at     TIMESTAMPTZ
);
CREATE INDEX idx_wf_task_status ON ulms.workflow_task(status, assignee_role);

CREATE TABLE ulms.workflow_transition (
    id         UUID PRIMARY KEY,
    task_id    UUID NOT NULL,
    actor      VARCHAR(40) NOT NULL,
    action     VARCHAR(12) NOT NULL,          -- APPROVE|REJECT|RETURN|ESCALATE|SUBMIT
    remark     TEXT,
    at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7-level approval ladder bands — CONFIGURATION, bank-tunable (03 mod-approval, ADR-009)
CREATE TABLE ulms.approval_band (
    level        INT PRIMARY KEY,             -- 1..7
    role_key     VARCHAR(30) NOT NULL,        -- ladder-1..ladder-7
    role_name_en VARCHAR(60) NOT NULL,
    min_minor    BIGINT NOT NULL,
    max_minor    BIGINT                       -- NULL = unbounded
);

INSERT INTO ulms.approval_band (level, role_key, role_name_en, min_minor, max_minor) VALUES
  (1, 'ladder-1', 'Branch Officer (L1)',       0,           50000000),     -- ≤ ৳5 L   (500,000৳)
  (2, 'ladder-2', 'Branch Manager (L2)',        50000001,    100000000),    -- ≤ ৳10 L
  (3, 'ladder-3', 'Regional Manager (L3)',      100000001,   250000000),    -- ≤ ৳25 L
  (4, 'ladder-4', 'Divisional Head (L4)',       250000001,   500000000),    -- ≤ ৳50 L
  (5, 'ladder-5', 'Head of Credit (L5)',        500000001,   2500000000),   -- ≤ ৳2.5 Cr
  (6, 'ladder-6', 'Credit Committee (L6)',      2500000001,  10000000000),  -- ≤ ৳10 Cr
  (7, 'ladder-7', 'Managing Director (L7)',     10000000001, NULL);         -- > ৳10 Cr

-- ladder graph: sequential APPROVAL nodes per level; RETURN goes one node back (once per node);
-- L1 is maker-checker dual (submit = maker phase, L1 approval = check phase).
INSERT INTO ulms.workflow_definition (key, name, graph) VALUES
('approval-ladder-7', '7-level approval ladder (bank policy)', $json$
{
  "start": "L1",
  "nodes": [
    {"id": "L1", "role": "ladder-1", "dual": true,  "next": "L2"},
    {"id": "L2", "role": "ladder-2", "next": "L3"},
    {"id": "L3", "role": "ladder-3", "next": "L4"},
    {"id": "L4", "role": "ladder-4", "next": "L5"},
    {"id": "L5", "role": "ladder-5", "next": "L6"},
    {"id": "L6", "role": "ladder-6", "next": "L7"},
    {"id": "L7", "role": "ladder-7", "next": null}
  ],
  "onComplete": "SANCTION"
}
$json$);

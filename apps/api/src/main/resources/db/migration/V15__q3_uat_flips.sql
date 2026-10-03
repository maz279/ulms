-- Q3 UAT-window readiness flips

-- Q3.2: signature evidence on approval transitions (WF-SPEC §7)
ALTER TABLE ulms.workflow_transition
    ADD COLUMN IF NOT EXISTS sig_algorithm VARCHAR(24),
    ADD COLUMN IF NOT EXISTS sig_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS sig_value TEXT;

-- Q3.3: goAML submission bookkeeping (BFIU portal acks)
CREATE TABLE IF NOT EXISTS ulms.goaml_submission (
    id          UUID PRIMARY KEY,
    cif_no      VARCHAR(16) NOT NULL,
    xml_sha256  VARCHAR(64) NOT NULL,
    status      VARCHAR(12) NOT NULL DEFAULT 'PENDING',   -- PENDING|ACCEPTED|REJECTED
    bfiu_ack    VARCHAR(64),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_goaml_cif ON ulms.goaml_submission (cif_no);

-- Q3.7: Basel parallel-run comparison snapshots
CREATE TABLE IF NOT EXISTS ulms.basel_parallel_run (
    id            UUID PRIMARY KEY,
    period        VARCHAR(7) NOT NULL,                     -- YYYY-MM
    metric        VARCHAR(40) NOT NULL,                    -- CAR|rwaBySegment|leverageRatioBp
    ulms_value    TEXT NOT NULL,
    bank_value    TEXT,
    variance_note TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (period, metric)
);

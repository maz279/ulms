-- PLANNING/08 §A5 mobile field gateway: idempotent visit intake + SOS ledger

CREATE TABLE IF NOT EXISTS ulms.field_visit (
    id           UUID PRIMARY KEY,
    client_uuid  VARCHAR(64) NOT NULL,          -- mobile-generated op id (idempotency key)
    task_id      UUID,
    loan_id      UUID,
    officer      VARCHAR(64) NOT NULL,
    outcome      VARCHAR(20) NOT NULL,           -- VERIFIED|DISCREPANCY|NOT_MET
    evidence     JSONB NOT NULL DEFAULT '{}'::jsonb,
    applied      BOOLEAN NOT NULL DEFAULT FALSE, -- false = seen, suppressed replay
    applied_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_field_visit_client ON ulms.field_visit (client_uuid);
CREATE INDEX IF NOT EXISTS idx_field_visit_officer ON ulms.field_visit (officer, applied_at);

-- task pins for the field map (PLANNING/08 A4): borrower geo at assignment
ALTER TABLE ulms.field_task
    ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

CREATE TABLE IF NOT EXISTS ulms.sos_alert (
    id         UUID PRIMARY KEY,
    officer    VARCHAR(64) NOT NULL,
    loan_id    UUID,
    lat        DOUBLE PRECISION,
    lng        DOUBLE PRECISION,
    note       TEXT,
    status     VARCHAR(12) NOT NULL DEFAULT 'OPEN',   -- OPEN|ACKNOWLEDGED
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sos_status ON ulms.sos_alert (status, created_at);

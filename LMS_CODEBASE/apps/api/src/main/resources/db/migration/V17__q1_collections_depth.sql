-- Q1.4 collections watchlist (PLAN-03 mod-collections): pre-SMA early-warning
CREATE TABLE IF NOT EXISTS ulms.watchlist_entry (
    id          UUID PRIMARY KEY,
    loan_id     UUID NOT NULL,
    cif_no      VARCHAR(16) NOT NULL,
    loan_no     VARCHAR(24) NOT NULL,
    reason_code VARCHAR(20) NOT NULL,            -- DPD_RISING|CHEQUE_BOUNCE|CIB_ALERT|FIELD_INTEL|BANKING_INACTIVITY|AUTO_STD2
    note        TEXT,
    status      VARCHAR(10) NOT NULL DEFAULT 'OPEN',   -- OPEN|CLEARED
    review_by   TIMESTAMPTZ NOT NULL,            -- review cadence deadline
    added_by    VARCHAR(40) NOT NULL,
    added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    cleared_by  VARCHAR(40),
    cleared_at  TIMESTAMPTZ,
    clear_note  TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_watchlist_open_loan
    ON ulms.watchlist_entry (loan_id) WHERE status = 'OPEN';
CREATE INDEX IF NOT EXISTS idx_watchlist_status ON ulms.watchlist_entry (status, review_by);

-- Q1.5 collateral auction/disposal ledger (ULS-01 §6.3, after write-off)
CREATE TABLE IF NOT EXISTS ulms.auction_entry (
    id             UUID PRIMARY KEY,
    loan_id        UUID NOT NULL,
    cif_no         VARCHAR(16) NOT NULL,
    loan_no        VARCHAR(24) NOT NULL,
    collateral_ref VARCHAR(64),                  -- collateral id / deed ref
    venue          VARCHAR(120) NOT NULL,
    scheduled_for  TIMESTAMPTZ NOT NULL,
    held_on        TIMESTAMPTZ,
    status         VARCHAR(10) NOT NULL DEFAULT 'SCHEDULED',  -- SCHEDULED|HELD|SOLD|UNSOLD|CANCELLED
    reserve_minor  BIGINT NOT NULL,
    proceeds_minor BIGINT,
    buyer          VARCHAR(120),
    recovery_id    UUID,                         -- RecoveryEntry cut on SOLD
    created_by     VARCHAR(40) NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_auction_loan ON ulms.auction_entry (loan_id, status);

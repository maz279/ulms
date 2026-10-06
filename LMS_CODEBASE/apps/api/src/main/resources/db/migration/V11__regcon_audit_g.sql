-- P4 audit-G closes (11 §6 WORM staging · 03 mod-compliance provision JV · 12 W11 writer):

-- 1. WORM object-store staging (11 §6: "generated into WORM staging (object-lock)"):
--    the rendered file bytes go to the object store at generate-time; the key is
--    kept beside the sha256. The payload column stays the read-path source of truth.
ALTER TABLE ulms.regulatory_return ADD COLUMN storage_key VARCHAR(200);

-- 2. provision_jv (03 mod-compliance "migration list + JV queue to Fineract GL" +
--    "JV reconciliation zero-sum"): one journal entry per EOD run-date — debit
--    provision expense, credit loan-loss reserve, amounts equal ⇒ zero-sum.
--    Idempotent per run-date; a drifted total blocks repost (409) and raises an alert.
CREATE TABLE ulms.provision_jv (
    id UUID PRIMARY KEY,
    run_date DATE NOT NULL UNIQUE,
    total_minor BIGINT NOT NULL,             -- provision_run total the JV mirrors
    debits_minor BIGINT NOT NULL,            -- Σdebits — must equal total (zero-sum proof)
    credits_minor BIGINT NOT NULL,           -- Σcredits — must equal total
    fineract_txn_id VARCHAR(64) NOT NULL,    -- Fineract journal entry transaction id
    reference_number VARCHAR(64) NOT NULL,
    posted_by VARCHAR(64) NOT NULL,
    posted_at TIMESTAMPTZ NOT NULL
);

-- 3. report_definition (12 W11 "report viewer/writer"): a saved governed report =
--    the portfolio read model with a group-by + schedule. Thin by design — the
--    prototype's 7-step writer is simulated; the binding store is definition +
--    execution through the read model.
CREATE TABLE ulms.report_definition (
    id UUID PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    domain VARCHAR(30) NOT NULL DEFAULT 'loan-portfolio',
    group_by VARCHAR(15) NOT NULL,           -- classification | stage | branch
    schedule VARCHAR(20) NOT NULL DEFAULT 'manual',
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

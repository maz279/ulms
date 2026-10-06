-- P4 (G4): regulatory returns pack + IFRS-9 ECL runway (PLANNING/03 mod-compliance,
-- 06 §8 P4, 11 §6 — CL-1..5 / CIB files / Basel CAR / EDW / ECL / large-loan forecast,
-- sign-off chain preparer→checker→compliance, then submission).

-- 1. regulatory_return: one generated pack per (code, period). Payload is the
--    WORM-staged source of truth; file_sha256 checksums the rendered file bytes.
--    Status chain: STAGED (generated, preparer=system) → CHECKED (checker) →
--    FILED (compliance approved + submitted). Rerun semantics: regenerate the
--    same (code, period) replaces the row wholesale (mirrors EOD rerun).
CREATE TABLE ulms.regulatory_return (
    id UUID PRIMARY KEY,
    code VARCHAR(10) NOT NULL,                -- CL-1..CL-5, CIB-S, CIB-C, CAR, EDW, ECL, LLF
    period VARCHAR(7) NOT NULL,               -- YYYY-MM the pack covers
    status VARCHAR(10) NOT NULL,              -- STAGED | CHECKED | FILED
    payload TEXT NOT NULL,                    -- generated pack JSON (rows + totals)
    file_format VARCHAR(16) NOT NULL,           -- csv | fixed-width
    file_sha256 VARCHAR(64) NOT NULL,         -- checksum of rendered file (court-grade provenance)
    row_count INT NOT NULL,
    preparer VARCHAR(64) NOT NULL,            -- sign-off chain: 'system:regcon' at generation
    checker VARCHAR(64),
    checked_at TIMESTAMPTZ,
    compliance_officer VARCHAR(64),
    compliance_approved_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,                 -- set when FILED (submitted to Bangladesh Bank)
    generated_at TIMESTAMPTZ NOT NULL,
    UNIQUE (code, period)
);
CREATE INDEX idx_regreturn_status ON ulms.regulatory_return(status, submitted_at);

-- 2. ecl_snapshot: IFRS-9 runway fields (03: ECL built now, assembly-only later —
--    mandatory Dec 2027). One row per BRPD stage per as-of date.
CREATE TABLE ulms.ecl_snapshot (
    id UUID PRIMARY KEY,
    as_of DATE NOT NULL,
    stage VARCHAR(6) NOT NULL,                -- BRPD stage (STD-0 … B/L)
    ifrs_stage INT NOT NULL,                  -- 1 performing · 2 SICR · 3 credit-impaired
    loans INT NOT NULL,
    ead_minor BIGINT NOT NULL,                -- exposure at default = outstanding
    pd_bp INT NOT NULL,                       -- 12m (stage 1) / lifetime (2,3) pilot calibration
    lgd_bp INT NOT NULL,                      -- unsecured retail pilot assumption
    ecl_minor BIGINT NOT NULL,                -- EAD × PD × LGD
    brpd_provision_minor BIGINT NOT NULL,     -- runway delta = ECL − BRPD provision
    UNIQUE (as_of, stage)
);

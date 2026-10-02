-- V6 — P2 audit-iteration compliance fixes (06 §5, 03, 11 §1):
-- 1. cib_facility.repayment_track: the 24-month rhythm field (03: "24-month
--    rhythm as in prototype") — '0' clean · '1' overdue · '2' missed.
-- 2. cib_report: raw NEVER lives in the database in plaintext (06 §5 "CIB raw
--    files: encrypted object + parsed JSONB with facility-level data only").
--    New pulls store the raw report in the document store (server-side
--    encryption at rest) and keep only its storage key here; existing
--    plaintext rows are purged retroactively.

ALTER TABLE ulms.cib_facility ADD COLUMN repayment_track VARCHAR(24);
ALTER TABLE ulms.cib_report  ADD COLUMN storage_key VARCHAR(200);

UPDATE ulms.cib_report SET raw = NULL WHERE raw IS NOT NULL;   -- purge plaintext (06 §7 retention)

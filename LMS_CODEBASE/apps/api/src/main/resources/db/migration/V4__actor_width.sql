-- V4 — widen actor-bearing columns: JWT-sub actor ids are "user:<uuid36>" = 41
-- chars, one over the V2 VARCHAR(40) (audit_entry.actor was already 64).

ALTER TABLE ulms.application          ALTER COLUMN created_by    TYPE VARCHAR(64);
ALTER TABLE ulms.application_document ALTER COLUMN uploaded_by   TYPE VARCHAR(64);
ALTER TABLE ulms.sanction_letter      ALTER COLUMN issued_by     TYPE VARCHAR(64);
ALTER TABLE ulms.workflow_task        ALTER COLUMN assignee_user TYPE VARCHAR(64);
ALTER TABLE ulms.workflow_transition  ALTER COLUMN actor         TYPE VARCHAR(64);

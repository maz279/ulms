-- Q1.3 workflow depth: DELEGATE reassignment evidence + conditions precedent
-- (workflow_task.assignee_user exists since V2 — DELEGATE only writes to it)

CREATE TABLE IF NOT EXISTS ulms.approval_condition (
    id             UUID PRIMARY KEY,
    instance_id    UUID NOT NULL,
    task_id        UUID NOT NULL,
    node           VARCHAR(30) NOT NULL,
    condition_text TEXT NOT NULL,
    status         VARCHAR(10) NOT NULL DEFAULT 'PENDING',   -- PENDING|SATISFIED|WAIVED
    created_by     VARCHAR(40) NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_by    VARCHAR(40),
    resolved_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_appr_cond_instance ON ulms.approval_condition (instance_id, status);

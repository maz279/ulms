package com.uslbd.ulms.platform.workflow;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Condition precedent attached by an APPROVE_WITH_CONDITIONS decision
 * (Q1.3, PLANNING/03 mod-approval): the workflow advances, but disbursement
 * stays gated until every condition is SATISFIED (evidence on file) or
 * WAIVED (documented override by an authorized level). Rows are immutable
 * apart from resolution — the trail is banking evidence.
 */
@Entity
@Table(name = "approval_condition", schema = "ulms",
       indexes = @Index(name = "idx_appr_cond_instance", columnList = "instance_id,status"))
public class ApprovalCondition {

    public static final String PENDING = "PENDING";
    public static final String SATISFIED = "SATISFIED";
    public static final String WAIVED = "WAIVED";

    @Id private UUID id;
    @Column(name = "instance_id", nullable = false) private UUID instanceId;
    @Column(name = "task_id", nullable = false) private UUID taskId;
    @Column(nullable = false, length = 30) private String node;
    @Column(name = "condition_text", nullable = false, columnDefinition = "text") private String conditionText;
    @Column(nullable = false, length = 10) private String status = PENDING;
    @Column(name = "created_by", nullable = false, length = 40) private String createdBy;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();
    @Column(name = "resolved_by", length = 40) private String resolvedBy;
    @Column(name = "resolved_at") private Instant resolvedAt;

    protected ApprovalCondition() {}

    static ApprovalCondition pending(UUID instanceId, UUID taskId, String node,
                                     String text, String createdBy) {
        ApprovalCondition c = new ApprovalCondition();
        c.id = UUID.randomUUID();
        c.instanceId = instanceId; c.taskId = taskId; c.node = node;
        c.conditionText = text; c.createdBy = createdBy;
        return c;
    }

    /** SATISFIED (evidence) or WAIVED (override) — only from PENDING. */
    void resolve(String status, String actor) {
        if (!PENDING.equals(this.status)) {
            throw new IllegalStateException("Condition already " + this.status);
        }
        if (!SATISFIED.equals(status) && !WAIVED.equals(status)) {
            throw new IllegalArgumentException("Resolution must be SATISFIED or WAIVED");
        }
        this.status = status;
        this.resolvedBy = actor;
        this.resolvedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getInstanceId() { return instanceId; }
    public UUID getTaskId() { return taskId; }
    public String getNode() { return node; }
    public String getConditionText() { return conditionText; }
    public String getStatus() { return status; }
    public String getCreatedBy() { return createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public String getResolvedBy() { return resolvedBy; }
    public Instant getResolvedAt() { return resolvedAt; }
}

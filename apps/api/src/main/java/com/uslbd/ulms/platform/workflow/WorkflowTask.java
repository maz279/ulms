package com.uslbd.ulms.platform.workflow;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "workflow_task", schema = "ulms",
       indexes = @Index(name = "idx_wf_task_status", columnList = "status,assigneeRole"))
public class WorkflowTask {

    @Id private UUID id;
    @Column(name = "instance_id", nullable = false) private UUID instanceId;
    @Column(nullable = false, length = 30) private String node;
    @Column(name = "assignee_role", nullable = false, length = 30) private String assigneeRole;
    @Column(name = "assignee_user", length = 40) private String assigneeUser;
    /** ACTION = normal approve/reject; CHECK = maker-checker second phase (03 mod-approval). */
    @Column(nullable = false, length = 10) private String phase = "ACTION";
    @Column(nullable = false, length = 12) private String status = "OPEN";
    @Column(name = "sla_deadline") private Instant slaDeadline;
    /** SLA progression (R10 P-B, WF-SPEC §5): OK → WARNED → BREACHED → ESCALATED. */
    @Column(name = "sla_state", nullable = false, length = 10) private String slaState = "OK";
    @Column(name = "opened_at", nullable = false) private Instant openedAt = Instant.now();
    @Column(name = "closed_at") private Instant closedAt;

    protected WorkflowTask() {}

    static WorkflowTask open(UUID id, UUID instanceId, String node, String role,
                             String phase, Instant slaDeadline) {
        WorkflowTask t = new WorkflowTask();
        t.id = id; t.instanceId = instanceId; t.node = node;
        t.assigneeRole = role; t.phase = phase; t.slaDeadline = slaDeadline;
        return t;
    }

    void claim(String user) { this.assigneeUser = user; this.status = "CLAIMED"; }
    /** Q1.3 DELEGATE: move responsibility, keep the task OPEN and the SLA clock
     *  running — delegation never resets the deadline (WF-SPEC §5). */
    void reassign(String user) { this.assigneeUser = user; }
    void close(String status) { this.status = status; this.closedAt = Instant.now(); }
    void reopen() { this.status = "OPEN"; this.assigneeUser = null; this.closedAt = null; }

    void armSla(Instant deadline) { this.slaDeadline = deadline; this.slaState = "OK"; }
    void markSlaWarned() { this.slaState = "WARNED"; }
    void markSlaBreached() { this.slaState = "BREACHED"; }
    void markSlaEscalated() { this.slaState = "ESCALATED"; }   // status stays ≤12 chars: act() closes with ESCALATED

    public java.time.Instant getClosedAt() { return closedAt; }
    public UUID getId() { return id; }
    public UUID getInstanceId() { return instanceId; }
    public String getNode() { return node; }
    public String getAssigneeRole() { return assigneeRole; }
    public String getAssigneeUser() { return assigneeUser; }
    public String getPhase() { return phase; }
    public String getStatus() { return status; }
    public Instant getSlaDeadline() { return slaDeadline; }
    public String getSlaState() { return slaState; }
    public Instant getOpenedAt() { return openedAt; }
}

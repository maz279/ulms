package com.uslbd.ulms.platform.workflow;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "workflow_transition", schema = "ulms")
public class WorkflowTransition {

    @Id private UUID id;
    @Column(name = "task_id", nullable = false) private UUID taskId;
    @Column(nullable = false, length = 40) private String actor;
    @Column(nullable = false, length = 12) private String action;   // APPROVE|REJECT|RETURN|ESCALATE|SUBMIT
    @Column(columnDefinition = "text") private String remark;
    @Column(nullable = false) private Instant at = Instant.now();

    protected WorkflowTransition() {}

    static WorkflowTransition of(UUID taskId, String actor, String action, String remark) {
        WorkflowTransition t = new WorkflowTransition();
        t.id = UUID.randomUUID(); t.taskId = taskId; t.actor = actor;
        t.action = action; t.remark = remark;
        return t;
    }

    public UUID getId() { return id; }
    public UUID getTaskId() { return taskId; }
    public String getActor() { return actor; }
    public String getAction() { return action; }
    public String getRemark() { return remark; }
    public Instant getAt() { return at; }
}

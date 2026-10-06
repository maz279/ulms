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
    // Q3.2 signature evidence (WF-SPEC §7) — null when the action carried none
    @Column(name = "sig_algorithm", length = 24) private String sigAlgorithm;
    @Column(name = "sig_hash", length = 64) private String sigHash;
    @Column(name = "sig_value", columnDefinition = "text") private String sigValue;
    @Column(nullable = false) private Instant at = Instant.now();

    protected WorkflowTransition() {}

    static WorkflowTransition of(UUID taskId, String actor, String action, String remark) {
        WorkflowTransition t = new WorkflowTransition();
        t.id = UUID.randomUUID(); t.taskId = taskId; t.actor = actor;
        t.action = action; t.remark = remark;
        return t;
    }

    /** Q3.2: attach captured signature evidence to this transition. */
    void attachSignature(SignatureCapturePort.CapturedSignature sig) {
        this.sigAlgorithm = sig.algorithm();
        this.sigHash = sig.payloadHash();
        this.sigValue = sig.signature();
    }

    public UUID getId() { return id; }
    public UUID getTaskId() { return taskId; }
    public String getActor() { return actor; }
    public String getAction() { return action; }
    public String getRemark() { return remark; }
    public Instant getAt() { return at; }
    public String getSigAlgorithm() { return sigAlgorithm; }
    public String getSigHash() { return sigHash; }
    public String getSigValue() { return sigValue; }
}

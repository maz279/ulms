package com.uslbd.ulms.collections;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

/**
 * Mobile visit intake row (PLANNING/08 §A5): one per client-generated op id —
 * the idempotency key that makes offline replay safe. `applied=false` marks a
 * replay that was suppressed by the server-wins rule (evidence still
 * appended on the task, but no second state transition).
 */
@Entity
@Table(name = "field_visit", schema = "ulms")
public class FieldVisit {

    @Id private UUID id;
    @Column(name = "client_uuid", nullable = false, length = 64) private String clientUuid;
    @Column(name = "task_id") private UUID taskId;
    @Column(name = "loan_id") private UUID loanId;
    @Column(nullable = false, length = 64) private String officer;
    @Column(nullable = false, length = 20) private String outcome;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb") private JsonNode evidence;
    @Column(nullable = false) private boolean applied = true;
    @Column(name = "applied_at", nullable = false) private Instant appliedAt = Instant.now();

    protected FieldVisit() {}

    static FieldVisit record(UUID id, String clientUuid, UUID taskId, UUID loanId,
                             String officer, String outcome, JsonNode evidence,
                             boolean applied) {
        FieldVisit v = new FieldVisit();
        v.id = id; v.clientUuid = clientUuid; v.taskId = taskId; v.loanId = loanId;
        v.officer = officer; v.outcome = outcome; v.evidence = evidence; v.applied = applied;
        return v;
    }

    public UUID getId() { return id; }
    public String getClientUuid() { return clientUuid; }
    public UUID getTaskId() { return taskId; }
    public UUID getLoanId() { return loanId; }
    public String getOfficer() { return officer; }
    public String getOutcome() { return outcome; }
    public JsonNode getEvidence() { return evidence; }
    public boolean isApplied() { return applied; }
    public Instant getAppliedAt() { return appliedAt; }
}

package com.uslbd.ulms.collections;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Field-visit task (03 mod-collections "sync contract for Expo app"):
 * status is SERVER-WINS (mobile may complete, server arbitrates);
 * `notes` is an append-only JSON-lines evidence log.
 */
@Entity
@Table(name = "field_task", schema = "ulms",
       indexes = @Index(name = "idx_fieldtask_status", columnList = "status,due_on"))
public class FieldTask {

    @Id @Column(nullable = false, updatable = false) private UUID id;
    @Column(name = "loan_id", nullable = false) private UUID loanId;
    @Column(name = "assigned_to", nullable = false, length = 64) private String assignedTo;
    @Column(name = "due_on", nullable = false) private LocalDate dueOn;
    @Column(nullable = false, length = 8) private String status = "OPEN";
    @Column(length = 1000) private String notes;              // JSON-lines evidence, append-only
    @Column(name = "created_by", nullable = false, length = 64) private String createdBy;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();
    @Column(name = "done_at") private Instant doneAt;

    protected FieldTask() {}

    static FieldTask of(UUID id, UUID loanId, String assignedTo, LocalDate dueOn,
                        String createdBy) {
        FieldTask t = new FieldTask();
        t.id = id; t.loanId = loanId; t.assignedTo = assignedTo;
        t.dueOn = dueOn; t.createdBy = createdBy;
        return t;
    }

    /** Server-wins completion + append-only evidence (03 sync rules):
     *  a replayed complete is suppressed but its evidence is still appended. */
    boolean complete(String evidenceNote) {
        if ("DONE".equals(this.status)) {
            appendEvidence(evidenceNote == null ? "" : evidenceNote);
            appendEvidence("duplicate complete suppressed (server-wins)");
            return false;
        }
        this.status = "DONE"; this.doneAt = Instant.now();
        appendEvidence(evidenceNote);
        return true;
    }

    void appendEvidence(String note) {
        String line = "{\"at\":\"" + Instant.now() + "\",\"note\":\""
                + (note == null ? "" : note.replace("\"", "'")) + "\"}";
        this.notes = (this.notes == null || this.notes.isBlank()) ? line : this.notes + "\n" + line;
    }

    public UUID getId() { return id; }
    public UUID getLoanId() { return loanId; }
    public String getAssignedTo() { return assignedTo; }
    public LocalDate getDueOn() { return dueOn; }
    public String getStatus() { return status; }
    public String getNotes() { return notes; }
    public String getCreatedBy() { return createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getDoneAt() { return doneAt; }
}

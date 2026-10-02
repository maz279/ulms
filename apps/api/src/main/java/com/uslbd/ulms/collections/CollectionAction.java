package com.uslbd.ulms.collections;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** One contact attempt — the dunning ladder SMS→call→visit (03 mod-collections). */
@Entity
@Table(name = "collection_action", schema = "ulms",
       indexes = @Index(name = "idx_collaction_loan", columnList = "loan_id"))
public class CollectionAction {

    @Id @Column(nullable = false, updatable = false) private UUID id;
    @Column(name = "loan_id", nullable = false) private UUID loanId;
    @Column(name = "action_type", nullable = false, length = 16)   // V14: NPA_RECOVERY
    private String actionType;
    @Column(nullable = false, length = 20) private String outcome;
    @Column(length = 400) private String notes;
    @Column(nullable = false, length = 64) private String actor;
    @Column(name = "acted_at", nullable = false) private Instant actedAt = Instant.now();
    /** Dunning-timer axis (03): when this queued step falls due; null for
     *  officer-logged actions (already acted). */
    @Column(name = "due_on") private LocalDate dueOn;

    protected CollectionAction() {}

    static CollectionAction of(UUID id, UUID loanId, String actionType, String outcome,
                               String notes, String actor) {
        return of(id, loanId, actionType, outcome, notes, actor, null);
    }

    /** Timer-queued dunning step (03): created DUE on a date, acted later. */
    static CollectionAction of(UUID id, UUID loanId, String actionType, String outcome,
                               String notes, String actor, LocalDate dueOn) {
        CollectionAction a = new CollectionAction();
        a.id = id; a.loanId = loanId; a.actionType = actionType;
        a.outcome = outcome; a.notes = notes; a.actor = actor; a.dueOn = dueOn;
        return a;
    }

    void resolve(String outcome, String notes, String actor) {
        this.outcome = outcome; this.notes = notes; this.actor = actor;
        this.actedAt = Instant.now(); this.dueOn = null;   // acted — timer cleared
    }

    public UUID getId() { return id; }
    public UUID getLoanId() { return loanId; }
    public String getActionType() { return actionType; }
    public String getOutcome() { return outcome; }
    public String getNotes() { return notes; }
    public String getActor() { return actor; }
    public Instant getActedAt() { return actedAt; }
    public LocalDate getDueOn() { return dueOn; }
}

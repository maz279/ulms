package com.uslbd.ulms.servicing;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/** Reschedule/restructure request (03) — approve re-generates the schedule tenor. */
@Entity
@Table(name = "reschedule_request", schema = "ulms")
public class RescheduleRequest {

    @Id @Column(nullable = false, updatable = false) private UUID id;
    @Column(name = "loan_id", nullable = false) private UUID loanId;
    @Column(name = "new_tenor_months", nullable = false) private int newTenorMonths;
    @Column(nullable = false, length = 300) private String reason;
    @Column(nullable = false, length = 10) private String status = "REQUESTED";
    @Column(name = "requested_by", nullable = false, length = 64) private String requestedBy;
    @Column(name = "decided_by", length = 64) private String decidedBy;
    @Column(name = "decided_at") private Instant decidedAt;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    protected RescheduleRequest() {}

    static RescheduleRequest of(UUID id, UUID loanId, int newTenorMonths,
                                String reason, String requestedBy) {
        RescheduleRequest r = new RescheduleRequest();
        r.id = id; r.loanId = loanId; r.newTenorMonths = newTenorMonths;
        r.reason = reason; r.requestedBy = requestedBy;
        return r;
    }

    void decide(String status, String decidedBy) {
        this.status = status; this.decidedBy = decidedBy; this.decidedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getLoanId() { return loanId; }
    public int getNewTenorMonths() { return newTenorMonths; }
    public String getReason() { return reason; }
    public String getStatus() { return status; }
    public String getRequestedBy() { return requestedBy; }
    public String getDecidedBy() { return decidedBy; }
    public Instant getDecidedAt() { return decidedAt; }
    public Instant getCreatedAt() { return createdAt; }
}

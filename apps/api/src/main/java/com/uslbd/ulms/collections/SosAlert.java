package com.uslbd.ulms.collections;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * One-tap SOS from the field app (PLANNING/08 §A4): raises a branch-security
 * workflow task + SMS via the outbox; this row is the durable ledger of the
 * alert itself, with acknowledge for the security desk.
 */
@Entity
@Table(name = "sos_alert", schema = "ulms")
public class SosAlert {

    @Id private UUID id;
    @Column(nullable = false, length = 64) private String officer;
    @Column(name = "loan_id") private UUID loanId;
    private Double lat;
    private Double lng;
    @Column(columnDefinition = "text") private String note;
    @Column(nullable = false, length = 12) private String status = "OPEN";
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    protected SosAlert() {}

    static SosAlert raise(UUID id, String officer, UUID loanId,
                          Double lat, Double lng, String note) {
        SosAlert a = new SosAlert();
        a.id = id; a.officer = officer; a.loanId = loanId;
        a.lat = lat; a.lng = lng; a.note = note;
        return a;
    }

    void acknowledge() {
        if (!"OPEN".equals(status)) throw new IllegalStateException("already " + status);
        this.status = "ACKNOWLEDGED";
    }

    public UUID getId() { return id; }
    public String getOfficer() { return officer; }
    public UUID getLoanId() { return loanId; }
    public Double getLat() { return lat; }
    public Double getLng() { return lng; }
    public String getNote() { return note; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
}

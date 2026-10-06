package com.uslbd.ulms.bocc;

import jakarta.persistence.*;
import java.util.UUID;

/** Agenda case (R3): one pending application listed for committee review. */
@Entity
@Table(name = "bocc_agenda_item", schema = "ulms",
       uniqueConstraints = @UniqueConstraint(columnNames = {"meeting_id", "application_id"}))
public class BoccAgendaItem {

    @Id private UUID id;
    // FK written by BoccMeeting's @OneToMany @JoinColumn — read-only here
    @Column(name = "meeting_id", nullable = false, insertable = false, updatable = false) private UUID meetingId;
    @Column(name = "application_id", nullable = false) private UUID applicationId;
    @Column(name = "app_no", nullable = false, length = 16) private String appNo;
    @Column(name = "cif_no", nullable = false, length = 16) private String cifNo;
    @Column(name = "amount_minor", nullable = false) private long amountMinor;
    @Column(length = 20) private String resolution;

    protected BoccAgendaItem() {}

    BoccAgendaItem(UUID id, UUID meetingId, UUID applicationId, String appNo,
                   String cifNo, long amountMinor) {
        this.id = id; this.meetingId = meetingId; this.applicationId = applicationId;
        this.appNo = appNo; this.cifNo = cifNo; this.amountMinor = amountMinor;
    }

    public UUID getId() { return id; }
    public UUID getApplicationId() { return applicationId; }
    public String getAppNo() { return appNo; }
    public String getCifNo() { return cifNo; }
    public long getAmountMinor() { return amountMinor; }
    public String getResolution() { return resolution; }
    void setResolution(String resolution) { this.resolution = resolution; }
}

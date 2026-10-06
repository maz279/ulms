package com.uslbd.ulms.notification;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/** Delivery log row (R4) — one per rendered dispatch attempt. */
@Entity
@Table(name = "notification_delivery", schema = "ulms")
public class NotificationDelivery {

    public enum Status { QUEUED, SENT, DELIVERED, FAILED }

    @Id private UUID id;
    @Column(nullable = false, length = 40) private String type;
    @Column(name = "cif_no", length = 16) private String cifNo;
    @Column(length = 20) private String recipient;
    @Column(nullable = false, length = 8) private String channel;
    @Column(nullable = false, columnDefinition = "text") private String body;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 12) private Status status = Status.QUEUED;
    @Column(name = "sent_at") private Instant sentAt;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    protected NotificationDelivery() {}

    public static NotificationDelivery queued(UUID id, String type, String cifNo,
                                              String recipient, String channel, String body) {
        NotificationDelivery d = new NotificationDelivery();
        d.id = id; d.type = type; d.cifNo = cifNo; d.recipient = recipient;
        d.channel = channel; d.body = body;
        return d;
    }

    void markDelivered() { this.status = Status.DELIVERED; this.sentAt = Instant.now(); }
    void markFailed() { this.status = Status.FAILED; this.sentAt = Instant.now(); }

    public java.time.Instant getSentAt() { return sentAt; }
    public java.time.Instant getCreatedAt() { return createdAt; }
    public UUID getId() { return id; }
    public String getType() { return type; }
    public String getCifNo() { return cifNo; }
    public String getRecipient() { return recipient; }
    public String getChannel() { return channel; }
    public String getBody() { return body; }
    public Status getStatus() { return status; }
}

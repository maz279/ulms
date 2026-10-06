package com.uslbd.ulms.notification;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/** BN/EN notification template (R4) — {name}/{amount} placeholders. */
@Entity
@Table(name = "notification_template", schema = "ulms",
       uniqueConstraints = @UniqueConstraint(columnNames = {"type", "channel", "lang"}))
public class NotificationTemplate {

    @Id private UUID id;
    @Column(nullable = false, length = 40) private String type;
    @Column(nullable = false, length = 8) private String channel;      // SMS | EMAIL
    @Column(nullable = false, length = 2) private String lang;         // en | bn
    @Column(nullable = false, columnDefinition = "text") private String body;
    @Column(name = "updated_by", nullable = false, length = 64) private String updatedBy;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt = Instant.now();

    protected NotificationTemplate() {}

    public static NotificationTemplate of(UUID id, String type, String channel,
                                          String lang, String body, String updatedBy) {
        NotificationTemplate t = new NotificationTemplate();
        t.id = id; t.type = type; t.channel = channel; t.lang = lang;
        t.body = body; t.updatedBy = updatedBy;
        return t;
    }

    /** Render with the standard placeholders. */
    public String render(String name, long amountMinor) {
        return body.replace("{name}", name == null ? "customer" : name)
                   .replace("{amount}", String.format("%,d", amountMinor / 100));
    }

    public String getUpdatedBy() { return updatedBy; }
    public java.time.Instant getUpdatedAt() { return updatedAt; }
    public UUID getId() { return id; }
    public String getType() { return type; }
    public String getChannel() { return channel; }
    public String getLang() { return lang; }
    public String getBody() { return body; }
}

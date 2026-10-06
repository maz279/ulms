package com.uslbd.ulms.partner;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Partner channel registry (R5): API-key intake. Only the SHA-256 of the
 * key is stored — the key itself lives in the partner's secret store (06 §1);
 * lookup is by hash. Rate limit is a per-minute token bucket.
 */
@Entity
@Table(name = "partner_channel", schema = "ulms",
       uniqueConstraints = @UniqueConstraint(columnNames = "api_key_hash"))
public class PartnerChannel {

    @Id private UUID id;
    @Column(name = "partner_name", nullable = false, length = 80) private String partnerName;
    @Column(name = "api_key_hash", nullable = false, length = 64) private String apiKeyHash;
    @Column(name = "rate_per_min", nullable = false) private int ratePerMin = 60;
    @Column(nullable = false, length = 10) private String status = "ACTIVE";
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    protected PartnerChannel() {}

    public static PartnerChannel register(UUID id, String partnerName, String apiKeyHash) {
        PartnerChannel p = new PartnerChannel();
        p.id = id; p.partnerName = partnerName; p.apiKeyHash = apiKeyHash;
        return p;
    }

    public UUID getId() { return id; }
    public String getPartnerName() { return partnerName; }
    public String getApiKeyHash() { return apiKeyHash; }
    public int getRatePerMin() { return ratePerMin; }
    public String getStatus() { return status; }
}

package com.uslbd.ulms.platform.idempotency;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

/** Stored Idempotency-Key + response for replay (PLANNING/05 §4, 48h window). */
@Entity
@Table(name = "idempotency_key", schema = "ulms")
public class IdempotencyKey {

    @Id @Column(nullable = false, updatable = false) private UUID key;
    @Column(nullable = false, length = 120) private String endpoint;
    @Column(name = "request_hash", nullable = false, length = 64) private String requestHash;
    @Column(name = "status_code", nullable = false) private int statusCode;
    @JdbcTypeCode(SqlTypes.JSON) @Column(name = "response_body", nullable = false)
    private String responseBody;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();
    @Column(name = "expires_at", nullable = false) private Instant expiresAt;

    protected IdempotencyKey() {}

    static IdempotencyKey of(UUID key, String endpoint, String requestHash,
                             int statusCode, String responseBody, Instant expiresAt) {
        IdempotencyKey k = new IdempotencyKey();
        k.key = key; k.endpoint = endpoint; k.requestHash = requestHash;
        k.statusCode = statusCode; k.responseBody = responseBody; k.expiresAt = expiresAt;
        return k;
    }

    public UUID getKey() { return key; }
    public String getEndpoint() { return endpoint; }
    public String getRequestHash() { return requestHash; }
    public int getStatusCode() { return statusCode; }
    public String getResponseBody() { return responseBody; }
    public Instant getExpiresAt() { return expiresAt; }
}

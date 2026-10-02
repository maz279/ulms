package com.uslbd.ulms.portal;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/** Portal OTP attempt (R10 P-D, PLAN-08 B3): hashed code, 5-min TTL, ≤5 tries. */
@Entity
@Table(name = "otp_request", schema = "ulms",
       indexes = @Index(name = "idx_otp_mobile", columnList = "mobile"))
public class OtpRequest {

    @Id private UUID id;
    @Column(nullable = false, length = 16) private String mobile;
    @Column(name = "code_hash", nullable = false, length = 64) private String codeHash;
    @Column(name = "expires_at", nullable = false) private Instant expiresAt;
    @Column(nullable = false) private int attempts;
    @Column(nullable = false) private boolean consumed = false;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    protected OtpRequest() {}

    static OtpRequest issue(UUID id, String mobile, String codeHash, Instant expiresAt) {
        OtpRequest o = new OtpRequest();
        o.id = id; o.mobile = mobile; o.codeHash = codeHash; o.expiresAt = expiresAt;
        return o;
    }

    boolean expired(Instant now) { return now.isAfter(expiresAt); }

    void consume() { this.consumed = true; }
    void countAttempt() { this.attempts++; }

    public java.time.Instant getCreatedAt() { return createdAt; }
    public UUID getId() { return id; }
    public String getMobile() { return mobile; }
    public Instant getExpiresAt() { return expiresAt; }
    public int getAttempts() { return attempts; }
    public boolean isConsumed() { return consumed; }
    String codeHash() { return codeHash; }
}

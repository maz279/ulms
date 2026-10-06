package com.uslbd.ulms.servicing;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

/**
 * Rail webhook verifier (PLANNING/11 §3, 05 §7): HMAC-SHA256 over
 * `timestamp + "." + rail + "." + rawBody`, hex-encoded; timestamp must be
 * within ±5 min. The shared secret comes ONLY from the environment — absent
 * secret fails CLOSED (503-style rejection), never an insecure bypass.
 *
 * <p>P5 audit F8: the rail path segment is INSIDE the MAC — a signature
 * captured for one rail is not replayable against another
 * (/hooks/payments/{rail}), even if per-rail secrets arrive at UAT.
 */
@Component
public class WebhookVerifier {

    private final byte[] secret;      // env-only (06 §1); null = callbacks disabled
    private final Clock clock;

    public WebhookVerifier(
            @Value("${ulms.rails.webhook-secret:}") String secret,
            Clock clock) {
        this.secret = (secret == null || secret.isBlank()) ? null
                : secret.getBytes(StandardCharsets.UTF_8);
        this.clock = clock;
    }

    public enum Verdict { OK, NO_SECRET, STALE_TIMESTAMP, BAD_SIGNATURE }

    public Verdict verify(String rail, String timestampHeader, String signatureHex, String rawBody) {
        if (secret == null) return Verdict.NO_SECRET;
        if (timestampHeader == null || signatureHex == null || rail == null) return Verdict.BAD_SIGNATURE;
        Instant ts;
        try {
            ts = Instant.ofEpochSecond(Long.parseLong(timestampHeader));
        } catch (NumberFormatException e) {
            return Verdict.BAD_SIGNATURE;
        }
        if (Duration.between(ts, clock.instant()).abs().compareTo(Duration.ofMinutes(5)) > 0) {
            return Verdict.STALE_TIMESTAMP;    // replay window (05 §7)
        }
        String expected = hmac(timestampHeader + "." + rail + "." + rawBody);
        return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8),
                signatureHex.toLowerCase().getBytes(StandardCharsets.UTF_8))
                ? Verdict.OK : Verdict.BAD_SIGNATURE;
    }

    /** Test/ops helper: compute the signature the rail would send. */
    public String sign(String rail, String timestampEpochSeconds, String rawBody) {
        if (secret == null) throw new IllegalStateException("webhook secret not configured");
        return hmac(timestampEpochSeconds + "." + rail + "." + rawBody);
    }

    private String hmac(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            byte[] digest = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(digest.length * 2);
            for (byte b : digest) hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (Exception e) {
            throw new IllegalStateException("HMAC unavailable", e);
        }
    }
}

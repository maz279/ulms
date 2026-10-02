package com.uslbd.ulms.portal;

import com.uslbd.ulms.notification.SmsDispatcher;
import com.uslbd.ulms.platform.audit.AuditService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Portal OTP (R10 P-D, PLAN-08 B3): issue/verify 6-digit codes for the
 * borrower portal — login AND payment confirmation. Codes are stored HASHED
 * (sha256), expire in 5 minutes, allow ≤5 attempts, and are delivered
 * through the SMS provider chain (mock logs in dev; live gateway at UAT).
 */
@Service
public class PortalOtpService {

    static final Duration TTL = Duration.ofMinutes(5);
    static final int MAX_ATTEMPTS = 5;

    private final OtpRequestRepository otps;
    private final SmsDispatcher sms;
    private final AuditService audit;
    private final SecureRandom random = new SecureRandom();

    public PortalOtpService(OtpRequestRepository otps, SmsDispatcher sms, AuditService audit) {
        this.otps = otps; this.sms = sms; this.audit = audit;
    }

    /** Issue an OTP for a mobile; returns expiry (never the code itself). */
    @Transactional
    public Issued issue(String mobile, String purpose) {
        if (mobile == null || !mobile.matches("^\\+8801\\d{9}$")) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "BD mobile required (+8801…)");
        }
        // throttle: at most one live code per mobile
        otps.findTopByMobileAndConsumedFalseOrderByCreatedAtDesc(mobile)
                .filter(o -> !o.expired(Instant.now()))
                .ifPresent(o -> {
                    throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                            "an active code already exists — wait for expiry");
                });
        String code = "%06d".formatted(random.nextInt(1_000_000));
        var req = otps.save(OtpRequest.issue(UUID.randomUUID(), mobile,
                sha256(mobile + ":" + code), Instant.now().plus(TTL)));
        sms.deliver(mobile, "ULMS verification code: " + code
                + " (valid " + TTL.toMinutes() + " minutes, " + purpose + ")");
        audit.record("portal:otp", "OTP_ISSUED", "otp_request", req.getId(),
                "{\"mobile\":\"" + mask(mobile) + "\",\"purpose\":\"" + purpose + "\"}",
                UUID.randomUUID());
        return new Issued(req.getId(), TTL.toSeconds());
    }

    /** Verify the latest code for a mobile — consumes it on success.
     *  noRollbackFor: a wrong-code 401 must still COMMIT the attempt count. */
    @Transactional(noRollbackFor = org.springframework.web.server.ResponseStatusException.class)
    public UUID verify(String mobile, String code) {
        var req = otps.findTopByMobileAndConsumedFalseOrderByCreatedAtDesc(mobile)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                        "no active code — request one first"));
        if (req.expired(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "code expired");
        }
        if (req.getAttempts() >= MAX_ATTEMPTS) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "too many attempts — request a new code");
        }
        req.countAttempt();
        if (!req.codeHash().equals(sha256(mobile + ":" + code))) {
            otps.save(req);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "code mismatch");
        }
        req.consume();
        otps.save(req);
        audit.record("portal:otp", "OTP_VERIFIED", "otp_request", req.getId(),
                "{\"mobile\":\"" + mask(mobile) + "\"}", UUID.randomUUID());
        return req.getId();   // presented as the confirmation token for payments
    }

    /** Payment-confirmation check: the token must be a consumed OTP for this mobile. */
    @Transactional(readOnly = true)
    public void assertConfirmed(UUID otpToken, String mobile) {
        var req = otps.findById(otpToken)
                .filter(OtpRequest::isConsumed)
                .filter(o -> o.getMobile().equals(mobile))
                .filter(o -> !o.expired(Instant.now()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                        "payment confirmation OTP required"));
    }

    private static String mask(String mobile) {
        return mobile.substring(0, 7) + "…" + mobile.substring(mobile.length() - 3);
    }

    private static String sha256(String s) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    public record Issued(UUID requestId, long ttlSeconds) {}
}

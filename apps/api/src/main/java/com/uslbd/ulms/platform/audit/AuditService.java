package com.uslbd.ulms.platform.audit;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Audit spine (PLANNING/06 §3). Called INSIDE the same transaction as the
 * business change — if the tx rolls back, the audit row rolls back too; the
 * hash chain therefore never contains gaps.
 */
@Service
public class AuditService {

    private final AuditEntryRepository repository;
    private static final String GENESIS = "0".repeat(64);

    public AuditService(AuditEntryRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void record(String actor, String action, String aggregate, UUID aggregateId,
                       String payloadJson, UUID requestId) {
        String prevHash = repository.findTopByOrderByAtDesc().map(AuditEntry::getHash).orElse(GENESIS);
        String hash = sha256(prevHash + "|" + actor + "|" + action + "|" + aggregateId + "|" + payloadJson);
        repository.save(AuditEntry.of(UUID.randomUUID(), actor, action, aggregate,
                aggregateId, payloadJson, hash, Instant.now(), requestId, currentSourceIp()));
    }

    /** 06 §3: best-effort source IP from the calling request thread (XFF first);
     *  null in scheduled jobs and listeners off the request path. */
    private static String currentSourceIp() {
        try {
            var attrs = org.springframework.web.context.request.RequestContextHolder
                    .getRequestAttributes();
            if (attrs instanceof org.springframework.web.context.request.ServletRequestAttributes s) {
                String xff = s.getRequest().getHeader("X-Forwarded-For");
                if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
                return s.getRequest().getRemoteAddr();
            }
        } catch (IllegalStateException ignored) { /* no request context bound */ }
        return null;
    }

    static String sha256(String value) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}

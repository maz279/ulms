package com.uslbd.ulms.platform.idempotency;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Idempotency-Key store (PLANNING/05 §4): creating POSTs record key +
 * request-hash + response; a replayed key with the SAME hash returns the
 * original response (callers add `Idempotent-Replay: true`); the same key
 * with a DIFFERENT body is a 409 conflict, not a silent duplicate.
 * Entries expire after 48h.
 */
@Service
public class IdempotencyService {

    public record Stored(int statusCode, String responseBody) {}

    /**
     * Internal mapper — Boot 4 does not expose an ObjectMapper bean in every
     * context (MVC builds its own converters), so this store serializes its
     * snapshots itself; format is opaque storage, not API output.
     * Jackson 3 (tools.jackson — the Boot 4 line) needs no time module for
     * Instant and handles records natively; the com.fasterxml 2.x mapper on
     * the classpath (transitively via AWS SDK) does NOT.
     */
    private static final tools.jackson.databind.ObjectMapper MAPPER =
            tools.jackson.databind.json.JsonMapper.builder().build();

    private final IdempotencyKeyRepository repository;
    private static final Duration TTL = Duration.ofHours(48);

    public IdempotencyService(IdempotencyKeyRepository repository) {
        this.repository = repository;
    }

    /** Replay lookup: present iff key known, unexpired, same endpoint and hash. */
    @Transactional(readOnly = true)
    public Optional<Stored> replayOf(UUID key, String endpoint, Object requestBody) {
        return repository.findById(key)
                .filter(k -> k.getExpiresAt().isAfter(Instant.now()))
                .filter(k -> k.getEndpoint().equals(endpoint))
                .filter(k -> k.getRequestHash().equals(hashOf(requestBody)))
                .map(k -> new Stored(k.getStatusCode(), k.getResponseBody()));
    }

    /** Same key, different body → conflict (05 §4 implicit; prevents key abuse). */
    @Transactional(readOnly = true)
    public boolean isConflict(UUID key, String endpoint, Object requestBody) {
        return repository.findById(key)
                .filter(k -> k.getEndpoint().equals(endpoint))
                .map(k -> !k.getRequestHash().equals(hashOf(requestBody)))
                .orElse(false);
    }

    @Transactional
    public void record(UUID key, String endpoint, Object requestBody,
                       int statusCode, Object responseBody) {
        repository.save(IdempotencyKey.of(key, endpoint, hashOf(requestBody),
                statusCode, MAPPER.writeValueAsString(responseBody),
                Instant.now().plus(TTL)));
    }

    static String hashOf(Object requestBody) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(String.valueOf(requestBody).getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(64);
            for (byte b : digest) hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    /** Shared snapshot serialization (controllers reuse for replay-body parity). */
    public static String toJson(Object value) {
        return MAPPER.writeValueAsString(value);
    }

    /** Shared JSON parsing (webhook bodies after signature verification). */
    @SuppressWarnings("unchecked")
    public static java.util.Map<String, Object> parseJson(String raw) {
        try {
            return MAPPER.readValue(raw, java.util.Map.class);
        } catch (tools.jackson.core.JacksonException e) {
            throw new IllegalArgumentException("Malformed webhook JSON", e);
        }
    }
}

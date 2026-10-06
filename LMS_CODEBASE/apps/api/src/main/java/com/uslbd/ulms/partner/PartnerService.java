package com.uslbd.ulms.partner;

import com.uslbd.ulms.origination.OriginationService;
import com.uslbd.ulms.platform.audit.AuditService;
import com.uslbd.ulms.platform.idempotency.IdempotencyService;
import com.uslbd.ulms.platform.outbox.OutboxService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Partner API channel (R5): hashed-key identification, per-key token bucket
 * (60/min default), Idempotency-Key replay, intake into the SAME origination
 * pipeline (channel=PARTNER — no second truth).
 */
@Service
public class PartnerService {

    private final PartnerChannelRepository channels;
    private final OriginationService origination;
    private final IdempotencyService idempotency;
    private final AuditService audit;
    private final OutboxService outbox;

    /** In-memory token buckets (single-node compose/k3s today; Redis in R8 scale-out). */
    private final java.util.Map<UUID, Bucket> buckets = new java.util.concurrent.ConcurrentHashMap<>();

    /** Mutable token bucket — tokens refill continuously toward the per-minute cap. */
    private static final class Bucket {
        double tokens;
        long ts;
        Bucket(double tokens, long ts) { this.tokens = tokens; this.ts = ts; }
    }

    // internal mapper — Boot 4 exposes no com.fasterxml ObjectMapper bean in
    // every context (see IdempotencyService for the same pattern)
    private final com.fasterxml.jackson.databind.ObjectMapper json =
            new com.fasterxml.jackson.databind.ObjectMapper();

    PartnerService(PartnerChannelRepository channels, OriginationService origination,
                   IdempotencyService idempotency, AuditService audit, OutboxService outbox,
                   com.uslbd.ulms.customer.CustomerRepository customers) {
        this.channels = channels; this.origination = origination;
        this.idempotency = idempotency; this.audit = audit; this.outbox = outbox;
        this.customers = customers;
    }

    static String sha256(String raw) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    /** 401 on missing/unknown key (partner identity). */
    PartnerChannel authenticate(String apiKey) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "X-Api-Key required");
        }
        return channels.findByApiKeyHash(sha256(apiKey))
                .filter(c -> "ACTIVE".equals(c.getStatus()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "unknown partner key"));
    }

    /** Token bucket per key; 429 when drained. */
    void rateLimit(PartnerChannel channel) {
        long now = System.currentTimeMillis();
        Bucket b = buckets.compute(channel.getId(), (id, bucket) -> {
            if (bucket == null) return new Bucket(channel.getRatePerMin(), now);
            double refill = Math.min(channel.getRatePerMin(),
                    bucket.tokens + (now - bucket.ts) / 1000.0 * channel.getRatePerMin() / 60.0);
            return new Bucket(refill, now);
        });
        if (b.tokens < 1) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "partner rate limit (" + channel.getRatePerMin() + "/min) exceeded");
        }
        b.tokens -= 1;
    }

    record IntakeRequest(String cifNo, String productCode, Long amountMinor, Integer tenorMonths) {}
    record IntakeResult(UUID id, String appNo, String stage, String channel) {}

    @Transactional
    public IntakeResult intake(String apiKey, UUID idempotencyKey, IntakeRequest req) {
        var channel = authenticate(apiKey);
        rateLimit(channel);
        if (idempotencyKey != null) {
            var replay = idempotency.replayOf(idempotencyKey, "POST /partner/applications", req);
            if (replay.isPresent()) {
                try {
                    var prior = json.readValue(replay.get().responseBody(),
                            new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
                    return new IntakeResult(UUID.fromString((String) prior.get("id")),
                            (String) prior.get("appNo"), (String) prior.get("stage"), "PARTNER");
                } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
                    throw new IllegalStateException("idempotent replay body unreadable", e);
                }
            }
        }
        var a = origination.createDraft("APP-P" + System.nanoTime() % 99_999,
                customerIdOf(req.cifNo()), req.productCode(), req.amountMinor(), req.tenorMonths(),
                com.uslbd.ulms.origination.Application.RateType.FIXED, branchOf(req.cifNo()),
                null, 0L, "partner:" + channel.getPartnerName());
        audit.record("partner:" + channel.getPartnerName(), "PARTNER_APPLY", "application", a.getId(),
                "\"" + a.getAppNo() + " via API\"", UUID.randomUUID());
        outbox.emit("application", a.getId(), "APPLICATION_SUBMITTED",
                Map.of("cif", req.cifNo(), "amountMinor", a.getAmountMinor()));
        return new IntakeResult(a.getId(), a.getAppNo(), a.getStage().name(), "PARTNER");
    }

    private final com.uslbd.ulms.customer.CustomerRepository customers;

    @Transactional(readOnly = true)
    public IntakeResult statusOf(UUID id) {
        var a = origination.get(id);
        return new IntakeResult(a.getId(), a.getAppNo(), a.getStage().name(), "PARTNER");
    }

    private java.util.UUID customerIdOf(String cifNo) {
        return customers.findByCifNo(cifNo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                        "cif must reference an existing customer"))
                .getId();
    }

    private String branchOf(String cifNo) {
        return customers.findByCifNo(cifNo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                        "cif must reference an existing customer"))
                .getBranchCode();
    }
}

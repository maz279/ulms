package com.uslbd.ulms.servicing;

import com.uslbd.ulms.platform.idempotency.IdempotencyService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Rail callbacks (05 §7): HMAC-SHA256 over `timestamp + "." + rawBody`,
 * ±5-minute window, idempotent by UTR. Route is PUBLIC (rails cannot mint
 * JWTs) — the signature IS the authentication; absent/invalid → 401/403,
 * stale → 403, secret unset → 503 (fail closed).
 */
@RestController
@RequestMapping("/hooks/payments")
class RailWebhookController {

    private final PaymentService payments;
    private final WebhookVerifier verifier;

    RailWebhookController(PaymentService payments, WebhookVerifier verifier) {
        this.payments = payments; this.verifier = verifier;
    }

    @PostMapping("/{rail}")
    ResponseEntity<Map<String, Object>> callback(
            @PathVariable String rail,
            @RequestHeader(value = "X-ULMS-Timestamp", required = false) String timestamp,
            @RequestHeader(value = "X-ULMS-Signature", required = false) String signature,
            @RequestBody String rawBody) {

        switch (verifier.verify(rail, timestamp, signature, rawBody)) {
            case NO_SECRET -> {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body(Map.of("error", "webhook secret not configured"));
            }
            case BAD_SIGNATURE -> {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "bad signature"));
            }
            case STALE_TIMESTAMP -> {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "stale timestamp (±5min window)"));
            }
            default -> { }   // OK
        }

        Map<String, Object> body = IdempotencyService.parseJson(rawBody);
        String utr = String.valueOf(body.get("utr"));
        long amount = ((Number) body.get("amountMinor")).longValue();
        UUID intentId = body.get("intentId") == null ? null
                : UUID.fromString(String.valueOf(body.get("intentId")));

        var result = payments.onRailCallback(rail, utr, amount, intentId);
        return ResponseEntity.ok(Map.of(
                "status", "COMPLETED",
                "paymentId", result.payment().getId().toString(),
                "replay", result.replay()));   // duplicate storms see replay=true
    }
}

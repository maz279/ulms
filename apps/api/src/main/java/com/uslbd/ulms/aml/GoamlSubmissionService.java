package com.uslbd.ulms.aml;

import com.uslbd.ulms.platform.audit.AuditService;
import jakarta.persistence.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;
import java.util.UUID;

/**
 * goAML submission client (Q3.3): POSTs the exported goAML XML to the BFIU
 * portal and records the ack. Env-only activation — no endpoint literals:
 *
 *   ULMS_GOAML_URL      BFIU portal submission endpoint (unset → NOT_READY 409)
 *   ULMS_GOAML_TOKEN    bearer token from the bank secret store
 *
 * The export itself (/customers/{id}/goaml.xml) stays available regardless;
 * submission is the UAT-window flip.
 */
@Service
public class GoamlSubmissionService {

    private static final Logger log = LoggerFactory.getLogger(GoamlSubmissionService.class);

    public record SubmissionResult(UUID submissionId, String status, String bfiuAck) {}

    private final GoamlSubmissionRepository submissions;
    private final AuditService audit;
    private final WebClient http;
    private final String url;
    private final String token;

    public GoamlSubmissionService(GoamlSubmissionRepository submissions, AuditService audit,
                                  org.springframework.web.reactive.function.client.WebClient.Builder builder,
                                  @Value("${ulms.goaml.url:}") String url,
                                  @Value("${ulms.goaml.token:}") String token) {
        this.submissions = submissions;
        this.audit = audit;
        this.http = builder.build();
        this.url = url == null ? "" : url;
        this.token = token == null ? "" : token;
    }

    /** Submission gate — values-only flip. */
    public boolean isConfigured() {
        return !url.isBlank() && !token.isBlank();
    }

    @Transactional
    public SubmissionResult submit(String cifNo, String xml, String actor) {
        if (!isConfigured()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "goAML submission not configured (ULMS_GOAML_URL/ULMS_GOAML_TOKEN) — "
                            + "export via /customers/{id}/goaml.xml is available");
        }
        String sha = sha256(xml);
        var row = submissions.save(GoamlSubmission.pending(UUID.randomUUID(), cifNo, sha));
        String ack;
        try {
            ack = http.post()
                    .uri(url)
                    .headers(h -> {
                        h.setBearerAuth(token);
                        h.set("Content-Type", "application/xml");
                    })
                    .bodyValue(xml)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(30))
                    .block();
        } catch (Exception e) {
            row.reject(e.getMessage());
            audit.record(actor, "GOAML_SUBMIT_FAILED", "goaml_submission", row.getId(),
                    "\"" + e.getClass().getSimpleName() + "\"", UUID.randomUUID());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "BFIU portal submission failed: " + e.getMessage(), e);
        }
        String ackRef = ack == null ? null : ack.replaceAll("^[^0-9A-Za-z]*", "").split("[^0-9A-Za-z-]")[0];
        row.accept(ackRef == null || ackRef.isBlank() ? "ack-" + row.getId() : ackRef);
        audit.record(actor, "GOAML_SUBMITTED", "goaml_submission", row.getId(),
                "{\"cif\":\"" + cifNo + "\",\"sha\":\"" + sha.substring(0, 12) + "…\"}", UUID.randomUUID());
        log.info("goAML submission accepted for {} (ack {})", cifNo, row.getBfiuAck());
        return new SubmissionResult(row.getId(), row.getStatus(), row.getBfiuAck());
    }

    private static String sha256(String s) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}

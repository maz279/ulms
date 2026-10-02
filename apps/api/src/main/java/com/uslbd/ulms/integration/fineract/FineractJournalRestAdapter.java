package com.uslbd.ulms.integration.fineract;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * Journal entries via Fineract REST — live-probed contract (P4 audit-G):
 * POST /journalentries takes {@code currencyCode} (NOT currency) and
 * {@code referenceNumber} (NOT reference); nested enums are rejected with a
 * misleading date-format error, officeId is a flat number; the response is
 * {officeId, transactionId}. Transaction date uses the CONTAINER clock
 * (a local-ahead clock is rejected as future-dated).
 */
@Component
class FineractJournalRestAdapter implements FineractJournalPort {

    private final WebClient webClient;
    private final String basicAuth;

    FineractJournalRestAdapter(WebClient.Builder builder,
                               @Value("${ulms.fineract.base-url}") String baseUrl,
                               @Value("${ulms.fineract.username}") String username,
                               @Value("${ulms.fineract.password}") String password) {
        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            throw new IllegalStateException("FINERACT_USER / FINERACT_PASSWORD must be provided via environment");
        }
        this.basicAuth = "Basic " + Base64.getEncoder()
                .encodeToString((username + ":" + password).getBytes(StandardCharsets.UTF_8));
        this.webClient = builder.baseUrl(baseUrl).build();
    }

    @Override
    public String postJournalEntry(long debitGlAccountId, long creditGlAccountId,
                                   long amountMinor, String referenceNumber) {
        double major = amountMinor / 100.0;
        try {
            Map<?, ?> resp = webClient.post()
                    .uri("/journalentries")
                    .header(HttpHeaders.AUTHORIZATION, basicAuth)
                    .header("Fineract-Platform-TenantId", "default")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of(
                            "officeId", 1,
                            "currencyCode", "BDT",
                            "debits", List.of(Map.of("glAccountId", debitGlAccountId, "amount", major)),
                            "credits", List.of(Map.of("glAccountId", creditGlAccountId, "amount", major)),
                            "referenceNumber", referenceNumber,
                            "transactionDate", LocalDate.now().toString(),
                            "dateFormat", "yyyy-MM-dd",
                            "locale", "en",
                            "comments", "ULMS BRPD provision JV"))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            Object txn = resp == null ? null : resp.get("transactionId");
            if (txn != null && !String.valueOf(txn).isBlank()) return String.valueOf(txn);
            throw new FineractPort.FineractUnavailableException(
                    "Fineract journal entry returned no transactionId", null);
        } catch (WebClientResponseException e) {
            throw new FineractPort.FineractUnavailableException(
                    "Fineract rejected journal entry: " + e.getStatusCode()
                            + " " + e.getResponseBodyAsString(), e);
        }
    }
}

package com.uslbd.ulms.integration.fineract;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

/**
 * REST adapter over the pinned Fineract CE instance.
 * Kept deliberately thin: auth header + POST /clients. When the generated
 * OpenAPI client (PLANNING/02 §2) lands, it slots in here behind the same
 * FineractPort — domain code unchanged.
 */
@Component
class FineractRestAdapter implements FineractPort {

    private final WebClient webClient;
    private final String basicAuth;

    FineractRestAdapter(WebClient.Builder builder,
                        @Value("${ulms.fineract.base-url}") String baseUrl,
                        @Value("${ulms.fineract.username}") String username,
                        @Value("${ulms.fineract.password}") String password) {
        if (username == null || password == null || username.isBlank() || password.isBlank()) {
            // Fail fast — credentials only ever come from the environment (06 §1).
            throw new IllegalStateException(
                "FINERACT_USER / FINERACT_PASSWORD must be provided via environment");
        }
        this.basicAuth = "Basic " + Base64.getEncoder()
                .encodeToString((username + ":" + password).getBytes(StandardCharsets.UTF_8));
        this.webClient = builder.baseUrl(baseUrl).build();
    }

    @Override
    public long createClient(FineractClient client) {
        try {
            Map<String, Object> body = Map.of(
                    "officeId", officeIdFor(client.branchCode()),
                    "legalFormId", 1,                       // person
                    "fullname", client.nameEn(),
                    "mobileNo", client.mobile(),
                    "active", true,
                    "activationDate", java.time.LocalDate.now().toString(),
                    "submittedOnDate", java.time.LocalDate.now().toString(),
                    "dateFormat", "yyyy-MM-dd",
                    "locale", "en");
            Map<?, ?> resp = webClient.post()
                    .uri("/clients")
                    .header(HttpHeaders.AUTHORIZATION, basicAuth)
                    .header("Fineract-Platform-TenantId", "default")   // tenant header is mandatory
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            Object id = resp == null ? null : resp.get("clientId");
            if (id instanceof Number n) return n.longValue();
            throw new FineractUnavailableException("Fineract returned no clientId", null);
        } catch (WebClientResponseException e) {
            // Fineract's body carries the real reason (e.g. duplicate mobileNo
            // returns 403 error.msg.client.duplicate.mobileNo) — surface it.
            String reason = e.getResponseBodyAsString(java.nio.charset.StandardCharsets.UTF_8);
            throw new FineractUnavailableException("Fineract rejected client create: "
                    + e.getStatusCode() + " " + reason, e);
        }
    }

    /**
     * Exact mobileNo lookup. This Fineract build ignores its mobileNo/sqlSearch
     * filters on GET /clients, so the adapter fetches one page (limit 200) and
     * matches exactly — fine at pilot scale; swap to an indexed search once the
     * upstream filter contract is confirmed.
     */
    @Override
    public java.util.Optional<Long> findClientIdByMobile(String mobile) {
        try {
            Map<?, ?> resp = webClient.get()
                    .uri(uri -> uri.path("/clients").queryParam("limit", 200).build())
                    .header(HttpHeaders.AUTHORIZATION, basicAuth)
                    .header("Fineract-Platform-TenantId", "default")
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            if (resp == null || !(resp.get("pageItems") instanceof java.util.List<?> items)) {
                return java.util.Optional.empty();
            }
            return items.stream()
                    .filter(item -> item instanceof Map<?, ?> m
                            && mobile != null && mobile.equals(m.get("mobileNo")))
                    .map(item -> ((Number) ((Map<?, ?>) item).get("id")).longValue())
                    .findFirst();
        } catch (WebClientResponseException e) {
            return java.util.Optional.empty();   // lookup is best-effort; create() surfaces real errors
        }
    }

    /** branchCode → Fineract officeId map lives in app_config (seeded BR-001→1). */
    private long officeIdFor(String branchCode) {
        // P0: single seeded office. P1 replaces with config-table lookup (mod-platform).
        return 1L;
    }
}

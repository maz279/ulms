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

/** Loan creation via Fineract REST (ADR-002: REST-only, adapter-isolated). */
@Component
class FineractLoanRestAdapter implements FineractLoanPort {

    private final WebClient webClient;
    private final String basicAuth;

    FineractLoanRestAdapter(WebClient.Builder builder,
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
    public long createLoan(LoanSpec spec) {
        try {
            Map<String, Object> body = Map.ofEntries(
                    Map.entry("clientId", spec.fineractClientId()),
                    Map.entry("productId", resolveProductId(spec.productExternalId())),
                    Map.entry("principal", spec.principalMinor() / 100.0),   // Fineract majors
                    Map.entry("loanTermFrequency", spec.tenorMonths()),
                    Map.entry("loanTermFrequencyType", 2),                  // months (enum id)
                    Map.entry("numberOfRepayments", spec.tenorMonths()),
                    Map.entry("repaymentFrequencyType", 2),                 // months
                    Map.entry("repaymentEvery", 1),
                    Map.entry("transactionProcessingStrategyCode", "mifos-standard-strategy"),
                    Map.entry("interestRatePerPeriod", 11.99),
                    Map.entry("interestRateFrequencyType", 2),              // per year
                    Map.entry("amortizationType", 1),                      // equal installments
                    Map.entry("interestType", 1),                          // declining balance
                    Map.entry("interestCalculationPeriodType", 1),         // same as repayment period
                    Map.entry("dateFormat", "yyyy-MM-dd"),
                    Map.entry("locale", "en"),
                    Map.entry("loanType", "individual"),                   // AccountType.fromName — lowercase
                    Map.entry("expectedDisbursementDate", "2026-10-05"),
                    Map.entry("submittedOnDate", java.time.LocalDate.now().toString()));
            Map<?, ?> resp = webClient.post()
                    .uri("/loans")
                    .header(HttpHeaders.AUTHORIZATION, basicAuth)
                    .header("Fineract-Platform-TenantId", "default")   // tenant header is mandatory
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            Object id = resp == null ? null : resp.get("loanId");
            if (id instanceof Number n) return n.longValue();
            if (resp != null && resp.get("resourceId") instanceof Number n2) return n2.longValue();
            throw new FineractPort.FineractUnavailableException("Fineract returned no loanId", null);
        } catch (WebClientResponseException e) {
            throw new FineractPort.FineractUnavailableException(
                    "Fineract rejected loan create: " + e.getStatusCode(), e);
        }
    }

    /**
     * Approve (no-op if already approved) then disburse — the Fineract state
     * machine requires submitted→approved→disbursed. Dates use the CONTAINER
     * clock (same host as Fineract; a local-ahead clock reads as "future
     * date" and is rejected). transactionAmount is in MAJOR units.
     */
    @Override
    public long disburseLoan(long fineractLoanId, long amountMinor) {
        String today = java.time.LocalDate.now().toString();
        try {
            webClient.post()
                    .uri(uri -> uri.path("/loans/" + fineractLoanId)
                            .queryParam("command", "approve").build())
                    .header(HttpHeaders.AUTHORIZATION, basicAuth)
                    .header("Fineract-Platform-TenantId", "default")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of("approvedOnDate", today,
                            "dateFormat", "yyyy-MM-dd", "locale", "en"))
                    .retrieve().bodyToMono(Map.class).block();
        } catch (WebClientResponseException e) {
            // already-approved is fine on retry; anything else is fatal
            if (!String.valueOf(e.getResponseBodyAsString()).contains("approved")) {
                throw new FineractPort.FineractUnavailableException(
                        "Fineract rejected loan approve: " + e.getStatusCode() + " "
                                + e.getResponseBodyAsString(StandardCharsets.UTF_8), e);
            }
        }
        try {
            Map<?, ?> resp = webClient.post()
                    .uri(uri -> uri.path("/loans/" + fineractLoanId)
                            .queryParam("command", "disburse").build())
                    .header(HttpHeaders.AUTHORIZATION, basicAuth)
                    .header("Fineract-Platform-TenantId", "default")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of("actualDisbursementDate", today,
                            "transactionAmount", amountMinor / 100.0,   // Fineract majors
                            "dateFormat", "yyyy-MM-dd", "locale", "en"))
                    .retrieve().bodyToMono(Map.class).block();
            Object txn = resp == null ? null
                    : resp.get("subResourceId") != null ? resp.get("subResourceId") : resp.get("resourceId");
            if (txn instanceof Number n) return n.longValue();
            throw new FineractPort.FineractUnavailableException("Fineract returned no txn id", null);
        } catch (WebClientResponseException e) {
            throw new FineractPort.FineractUnavailableException(
                    "Fineract rejected loan disburse: " + e.getStatusCode() + " "
                            + e.getResponseBodyAsString(StandardCharsets.UTF_8), e);
        }
    }

    /** P3 repayment: POST /loans/{id}/transactions?command=repayment (major units). */
    @Override
    public long repayLoan(long fineractLoanId, long amountMinor) {
        String today = java.time.LocalDate.now().toString();
        try {
            Map<?, ?> resp = webClient.post()
                    .uri(uri -> uri.path("/loans/" + fineractLoanId + "/transactions")
                            .queryParam("command", "repayment").build())
                    .header(HttpHeaders.AUTHORIZATION, basicAuth)
                    .header("Fineract-Platform-TenantId", "default")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of("transactionDate", today,
                            "transactionAmount", amountMinor / 100.0,   // Fineract majors
                            "dateFormat", "yyyy-MM-dd", "locale", "en"))
                    .retrieve().bodyToMono(Map.class).block();
            Object txn = resp == null ? null
                    : resp.get("resourceId") != null ? resp.get("resourceId") : resp.get("subResourceId");
            if (txn instanceof Number n) return n.longValue();
            throw new FineractPort.FineractUnavailableException("Fineract returned no repayment txn id", null);
        } catch (WebClientResponseException e) {
            throw new FineractPort.FineractUnavailableException(
                    "Fineract rejected repayment: " + e.getStatusCode() + " "
                            + e.getResponseBodyAsString(StandardCharsets.UTF_8), e);
        }
    }

    /** Collections resolution: waive interest (03 "adjustment transactions"). */
    @Override
    public long waiveInterest(long fineractLoanId, long amountMinor) {
        String today = java.time.LocalDate.now().toString();
        try {
            Map<?, ?> resp = webClient.post()
                    .uri(uri -> uri.path("/loans/" + fineractLoanId + "/transactions")
                            .queryParam("command", "waiveInterest").build())
                    .header(HttpHeaders.AUTHORIZATION, basicAuth)
                    .header("Fineract-Platform-TenantId", "default")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of("transactionDate", today,
                            "transactionAmount", amountMinor / 100.0,
                            "dateFormat", "yyyy-MM-dd", "locale", "en"))
                    .retrieve().bodyToMono(Map.class).block();
            Object txn = resp == null ? null : resp.get("resourceId");
            if (txn instanceof Number n) return n.longValue();
            throw new FineractPort.FineractUnavailableException("Fineract returned no waiver txn id", null);
        } catch (WebClientResponseException e) {
            throw new FineractPort.FineractUnavailableException(
                    "Fineract rejected waiver: " + e.getStatusCode() + " "
                            + e.getResponseBodyAsString(StandardCharsets.UTF_8), e);
        }
    }

    /** Fee charge (03): POST /loans/{id}/charges — charge def 1 seeded per tenant. */
    @Override
    public long chargeFee(long fineractLoanId, long amountMinor, String chargeName) {
        String today = java.time.LocalDate.now().toString();
        try {
            Map<?, ?> resp = webClient.post()
                    .uri(uri -> uri.path("/loans/" + fineractLoanId + "/charges").build())
                    .header(HttpHeaders.AUTHORIZATION, basicAuth)
                    .header("Fineract-Platform-TenantId", "default")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of("chargeId", 1L,   // ULMS Penalty Fee (seeded)
                            "amount", amountMinor / 100.0,   // Fineract majors
                            "dueDate", today,
                            "dateFormat", "yyyy-MM-dd", "locale", "en"))
                    .retrieve().bodyToMono(Map.class).block();
            Object id = resp == null ? null : resp.get("resourceId");
            if (id instanceof Number n) return n.longValue();
            throw new FineractPort.FineractUnavailableException("Fineract returned no charge id", null);
        } catch (WebClientResponseException e) {
            throw new FineractPort.FineractUnavailableException(
                    "Fineract rejected charge: " + e.getStatusCode() + " "
                            + e.getResponseBodyAsString(StandardCharsets.UTF_8), e);
        }
    }

    private long resolveProductId(String externalId) {
        // P1: single seeded product template (externalId ulms-sme-term); P2 adds
        // the product catalog lookup against mod-origination product config.
        return 1L;
    }
}

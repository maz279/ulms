# Payment Gateway Integration Design
## Mobile Financial Services (bKash, Nagad, Rocket) Integration
### Unisoft Loan Management System (ULMS) v2.0

---

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ULMS-ARCH-1.5.5 |
| **Document Title** | Payment Gateway Integration Design (bKash/Nagad/Rocket) |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 5, 2026 |
| **Prepared By** | Developer 2 |
| **Reviewed By** | Lead Developer, Security Architect |
| **Classification** | Confidential - Internal Use |
| **Status** | Approved for Implementation |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | Dev 2 | Initial Payment Gateway Integration Design |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Bangladesh MFS Landscape](#2-bangladesh-mfs-landscape)
3. [Integration Architecture](#3-integration-architecture)
4. [bKash Integration](#4-bkash-integration)
5. [Nagad Integration](#5-nagad-integration)
6. [Rocket Integration](#6-rocket-integration)
7. [Unified Payment Interface](#7-unified-payment-interface)
8. [Transaction Management](#8-transaction-management)
9. [Reconciliation](#9-reconciliation)
10. [Error Handling & Retry](#10-error-handling--retry)
11. [Security & Compliance](#11-security--compliance)
12. [Rate Limiting & Quotas](#12-rate-limiting--quotas)
13. [Monitoring & Observability](#13-monitoring--observability)
14. [Data Model](#14-data-model)
15. [Apache Camel Routes](#15-apache-camel-routes)
16. [Implementation Guide](#16-implementation-guide)
17. [Appendices](#17-appendices)

---

## 1. Executive Summary

### 1.1 Purpose

This document defines the comprehensive integration design for Mobile Financial Services (MFS) payment gateways including bKash, Nagad, and Rocket. The integration enables loan disbursement to mobile wallets and collection of repayments through these channels.

### 1.2 Integration Objectives

| Objective | Target | Measurement |
|-----------|--------|-------------|
| **Disbursement Speed** | < 30 seconds | Transaction completion time |
| **Transaction Success Rate** | > 99.5% | Successful transactions |
| **System Availability** | 99.9% | Gateway uptime |
| **Reconciliation Accuracy** | 100% | Daily reconciliation match |
| **Fraud Prevention** | Zero fraud loss | Security monitoring |

### 1.3 Integration Scope

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MFS PAYMENT GATEWAY INTEGRATION SCOPE                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        IN SCOPE                                      │   │
│   ├─────────────────────────────────────────────────────────────────────┤   │
│   │  • Loan disbursement to bKash wallet                                │   │
│   │  • Loan disbursement to Nagad wallet                                │   │
│   │  • Loan disbursement to Rocket wallet                               │   │
│   │  • Repayment collection via MFS (bKash/Nagad/Rocket)               │   │
│   │  • Transaction status tracking and verification                     │   │
│   │  • Real-time and batch reconciliation                               │   │
│   │  • Refund/reversal processing                                       │   │
│   │  • Transaction reporting and analytics                              │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                       OUT OF SCOPE                                   │   │
│   ├─────────────────────────────────────────────────────────────────────┤   │
│   │  • MFS agent management                                              │   │
│   │  • Cash-in/Cash-out operations                                       │   │
│   │  • P2P transfers                                                     │   │
│   │  • Merchant payment collection                                       │   │
│   │  • Bill payment integration                                          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.4 Supported Transactions

| Transaction Type | bKash | Nagad | Rocket | Priority |
|-----------------|-------|-------|--------|----------|
| **Loan Disbursement** | ✅ | ✅ | ✅ | Critical |
| **EMI Collection** | ✅ | ✅ | ✅ | Critical |
| **Prepayment** | ✅ | ✅ | ✅ | High |
| **Refund** | ✅ | ✅ | ✅ | High |
| **Transaction Inquiry** | ✅ | ✅ | ✅ | Medium |

---

## 2. Bangladesh MFS Landscape

### 2.1 MFS Market Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BANGLADESH MFS ECOSYSTEM                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    BANGLADESH BANK                                   │   │
│   │               (Payment System Department)                            │   │
│   │                                                                       │   │
│   │   • MFS Licensing & Regulation                                       │   │
│   │   • Transaction Monitoring                                           │   │
│   │   • Settlement Guidelines                                            │   │
│   └────────────────────────────────┬────────────────────────────────────┘   │
│                                    │                                         │
│                    Regulatory Oversight                                     │
│                                    │                                         │
│   ┌────────────────────────────────┴────────────────────────────────────┐   │
│   │                                                                      │   │
│   │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐               │   │
│   │  │   bKash     │   │   Nagad     │   │   Rocket    │               │   │
│   │  │  (BRAC)     │   │   (Govt)    │   │   (DBBL)    │               │   │
│   │  │             │   │             │   │             │               │   │
│   │  │ Market: 40% │   │ Market: 35% │   │ Market: 15% │               │   │
│   │  │ Users: 66M  │   │ Users: 58M  │   │ Users: 20M  │               │   │
│   │  │             │   │             │   │             │               │   │
│   │  └─────────────┘   └─────────────┘   └─────────────┘               │   │
│   │                                                                      │   │
│   │                    Other MFS: 10% (SureCash, Upay, etc.)            │   │
│   │                                                                      │   │
│   └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   MFS Statistics (2025):                                                    │
│   • Total Registered Users: 180+ Million                                    │
│   • Monthly Transaction Volume: BDT 1.2+ Trillion                          │
│   • Daily Transactions: 15+ Million                                         │
│   • Agent Network: 1.5+ Million                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 MFS Provider Comparison

| Feature | bKash | Nagad | Rocket |
|---------|-------|-------|--------|
| **Parent Company** | BRAC Bank | Bangladesh Post Office | Dutch-Bangla Bank |
| **License Type** | MFS | MFS (Govt-backed) | MFS |
| **API Type** | REST | REST | REST |
| **Settlement** | T+1 | T+1 | T+0 (Same day) |
| **Transaction Limit** | BDT 200,000/day | BDT 200,000/day | BDT 150,000/day |
| **B2P Transfer Charge** | 0.5% | 0.4% | 0.5% |
| **API Response Time** | < 3 sec | < 3 sec | < 5 sec |

### 2.3 Integration Points

| Provider | API Version | Authentication | Sandbox |
|----------|-------------|----------------|---------|
| **bKash** | v1.2.0 | OAuth 2.0 + API Key | Yes |
| **Nagad** | v2.0 | API Key + Signature | Yes |
| **Rocket** | v1.1 | API Key + mTLS | Yes |

---

## 3. Integration Architecture

### 3.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MFS PAYMENT GATEWAY ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    ULMS APPLICATION LAYER                            │   │
│   │                                                                       │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │   │
│   │   │ Disbursement │  │  Collection  │  │    Loan Service          │  │   │
│   │   │   Service    │  │   Service    │  │                          │  │   │
│   │   └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘  │   │
│   │          │                 │                       │                │   │
│   └──────────│─────────────────│───────────────────────│────────────────┘   │
│              │                 │                       │                     │
│              ▼                 ▼                       ▼                     │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    PAYMENT GATEWAY SERVICE (Port 8089)               │   │
│   │                                                                       │   │
│   │   ┌─────────────────────────────────────────────────────────────┐   │   │
│   │   │              UNIFIED PAYMENT INTERFACE                       │   │   │
│   │   │                                                              │   │   │
│   │   │   POST /api/v1/payments/disburse                            │   │   │
│   │   │   POST /api/v1/payments/collect                             │   │   │
│   │   │   GET  /api/v1/payments/{txnId}/status                      │   │   │
│   │   │   POST /api/v1/payments/{txnId}/refund                      │   │   │
│   │   │                                                              │   │   │
│   │   └──────────────────────────┬──────────────────────────────────┘   │   │
│   │                              │                                       │   │
│   │   ┌──────────────────────────┴──────────────────────────────────┐   │   │
│   │   │              PAYMENT ORCHESTRATION LAYER                     │   │   │
│   │   │                                                              │   │   │
│   │   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │   │   │
│   │   │   │  Provider   │  │ Idempotency │  │    Circuit      │    │   │   │
│   │   │   │  Selector   │  │   Handler   │  │    Breaker      │    │   │   │
│   │   │   └─────────────┘  └─────────────┘  └─────────────────┘    │   │   │
│   │   │                                                              │   │   │
│   │   └──────────────────────────┬──────────────────────────────────┘   │   │
│   │                              │                                       │   │
│   │   ┌──────────────────────────┴──────────────────────────────────┐   │   │
│   │   │                    PROVIDER ADAPTERS                         │   │   │
│   │   │                                                              │   │   │
│   │   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │   │   │
│   │   │   │   bKash     │  │   Nagad     │  │    Rocket       │    │   │   │
│   │   │   │   Adapter   │  │   Adapter   │  │    Adapter      │    │   │   │
│   │   │   └──────┬──────┘  └──────┬──────┘  └────────┬────────┘    │   │   │
│   │   │          │                │                  │              │   │   │
│   │   └──────────│────────────────│──────────────────│──────────────┘   │   │
│   │              │                │                  │                   │   │
│   └──────────────│────────────────│──────────────────│───────────────────┘   │
│                  │                │                  │                       │
│                  ▼                ▼                  ▼                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    EXTERNAL MFS PROVIDERS                            │   │
│   │                                                                       │   │
│   │   ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────┐   │   │
│   │   │     bKash       │ │     Nagad       │ │      Rocket         │   │   │
│   │   │   API Gateway   │ │   API Gateway   │ │    API Gateway      │   │   │
│   │   │                 │ │                 │ │                     │   │   │
│   │   │ api.bkash.com   │ │ api.nagad.com.bd│ │ api.dutchbangla.com │   │   │
│   │   └─────────────────┘ └─────────────────┘ └─────────────────────┘   │   │
│   │                                                                       │   │
│   └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Technology Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Runtime** | Java | 21 (LTS) | Application runtime |
| **Framework** | Spring Boot | 3.2.1 | Microservice framework |
| **Integration** | Apache Camel | 4.3 | Provider routing |
| **HTTP Client** | Spring WebClient | 6.1.x | Non-blocking API calls |
| **Database** | PostgreSQL | 16 | Transaction records |
| **Cache** | Redis | 7.2 | Idempotency, rate limiting |
| **Messaging** | Apache Kafka | 3.6 | Event streaming |
| **Resilience** | Resilience4j | Latest | Circuit breaker |

### 3.3 Service Specification

| Parameter | Value | Notes |
|-----------|-------|-------|
| **Service Name** | payment-gateway-service | Kubernetes deployment |
| **Port** | 8089 | Service port |
| **Replicas** | 3 (min) | High availability |
| **Memory** | 2 GB | Per instance |
| **CPU** | 2 cores | Per instance |

---

## 4. bKash Integration

### 4.1 bKash API Configuration

| Parameter | Value | Notes |
|-----------|-------|-------|
| **Base URL (Prod)** | `https://tokenized.pay.bka.sh/v1.2.0` | Production |
| **Base URL (Sandbox)** | `https://tokenized.sandbox.bka.sh/v1.2.0` | Testing |
| **Authentication** | OAuth 2.0 + API Key | Token-based |
| **Timeout** | 30 seconds | Connection timeout |
| **Rate Limit** | 100 req/min | Per merchant |

### 4.2 bKash API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/tokenized/checkout/token/grant` | POST | Get access token |
| `/tokenized/checkout/token/refresh` | POST | Refresh access token |
| `/tokenized/checkout/payment/b2c` | POST | B2P disbursement |
| `/tokenized/checkout/payment/query` | GET | Transaction status |
| `/tokenized/checkout/payment/refund` | POST | Refund transaction |

### 4.3 bKash Disbursement Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    bKash DISBURSEMENT FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ULMS                 PAYMENT GW               bKash API                    │
│    │                       │                       │                         │
│    │  1. Disburse Request  │                       │                         │
│    │ ─────────────────────▶│                       │                         │
│    │                       │                       │                         │
│    │                       │  2. Get Token         │                         │
│    │                       │ ─────────────────────▶│                         │
│    │                       │                       │                         │
│    │                       │  3. Token Response    │                         │
│    │                       │ ◀─────────────────────│                         │
│    │                       │                       │                         │
│    │                       │  4. B2C Payment       │                         │
│    │                       │ ─────────────────────▶│                         │
│    │                       │     {                 │                         │
│    │                       │       amount: 50000,  │                         │
│    │                       │       receiver: "01X",│                         │
│    │                       │       reference: "XX" │                         │
│    │                       │     }                 │                         │
│    │                       │                       │                         │
│    │                       │  5. Payment Response  │                         │
│    │                       │ ◀─────────────────────│                         │
│    │                       │     {                 │                         │
│    │                       │       trxID: "XXX",   │                         │
│    │                       │       status: "OK"    │                         │
│    │                       │     }                 │                         │
│    │                       │                       │                         │
│    │  6. Success Response  │                       │                         │
│    │ ◀─────────────────────│                       │                         │
│    │                       │                       │                         │
│    │                       │  7. Verify (Optional) │                         │
│    │                       │ ─────────────────────▶│                         │
│    │                       │                       │                         │
│    │                       │  8. Verified Status   │                         │
│    │                       │ ◀─────────────────────│                         │
│    │                       │                       │                         │
│    │  9. Emit Kafka Event  │                       │                         │
│    │ ──────────────────────│                       │                         │
│    │                       │                       │                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.4 bKash Adapter Implementation

```java
// BkashPaymentAdapter.java
@Component
@Slf4j
public class BkashPaymentAdapter implements MfsPaymentAdapter {

    private final WebClient webClient;
    private final BkashProperties properties;
    private final VaultTemplate vaultTemplate;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String TOKEN_CACHE_KEY = "bkash:access:token";

    public BkashPaymentAdapter(
            WebClient.Builder webClientBuilder,
            BkashProperties properties,
            VaultTemplate vaultTemplate,
            RedisTemplate<String, Object> redisTemplate) {

        this.properties = properties;
        this.vaultTemplate = vaultTemplate;
        this.redisTemplate = redisTemplate;

        this.webClient = webClientBuilder
            .baseUrl(properties.getBaseUrl())
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .build();
    }

    @Override
    public MfsProvider getProvider() {
        return MfsProvider.BKASH;
    }

    @Override
    @CircuitBreaker(name = "bkashApi", fallbackMethod = "fallbackDisburse")
    @Retry(name = "bkashApi")
    public Mono<DisbursementResponse> disburse(DisbursementRequest request) {
        log.info("Processing bKash disbursement: {} to {}",
            request.getAmount(), maskPhoneNumber(request.getReceiverMobile()));

        return getAccessToken()
            .flatMap(token -> executeDisbursement(token, request))
            .doOnSuccess(response -> logSuccess(request, response))
            .doOnError(error -> logError(request, error));
    }

    private Mono<String> getAccessToken() {
        // Check cache first
        String cachedToken = (String) redisTemplate.opsForValue().get(TOKEN_CACHE_KEY);
        if (cachedToken != null) {
            return Mono.just(cachedToken);
        }

        // Request new token
        return webClient.post()
            .uri("/tokenized/checkout/token/grant")
            .header("username", properties.getUsername())
            .header("password", getPassword())
            .bodyValue(Map.of(
                "app_key", properties.getAppKey(),
                "app_secret", getAppSecret()
            ))
            .retrieve()
            .bodyToMono(BkashTokenResponse.class)
            .map(response -> {
                // Cache token
                redisTemplate.opsForValue().set(
                    TOKEN_CACHE_KEY,
                    response.getIdToken(),
                    Duration.ofMinutes(55)  // Token valid for 60 min
                );
                return response.getIdToken();
            });
    }

    private Mono<DisbursementResponse> executeDisbursement(
            String token,
            DisbursementRequest request) {

        BkashB2CRequest b2cRequest = BkashB2CRequest.builder()
            .amount(request.getAmount().toString())
            .receiverMSISDN(formatPhoneNumber(request.getReceiverMobile()))
            .currency("BDT")
            .merchantInvoiceNumber(request.getReferenceId())
            .build();

        return webClient.post()
            .uri("/tokenized/checkout/payment/b2c")
            .header("Authorization", "Bearer " + token)
            .header("X-APP-Key", properties.getAppKey())
            .bodyValue(b2cRequest)
            .retrieve()
            .onStatus(HttpStatusCode::is4xxClientError, this::handle4xxError)
            .onStatus(HttpStatusCode::is5xxServerError, this::handle5xxError)
            .bodyToMono(BkashB2CResponse.class)
            .map(this::mapToResponse);
    }

    private DisbursementResponse mapToResponse(BkashB2CResponse bkashResponse) {
        return DisbursementResponse.builder()
            .provider(MfsProvider.BKASH)
            .providerTransactionId(bkashResponse.getTrxID())
            .status(mapStatus(bkashResponse.getTransactionStatus()))
            .amount(new BigDecimal(bkashResponse.getAmount()))
            .receiverMobile(bkashResponse.getReceiverMSISDN())
            .completedAt(LocalDateTime.now())
            .providerResponse(serializeResponse(bkashResponse))
            .build();
    }

    private TransactionStatus mapStatus(String bkashStatus) {
        return switch (bkashStatus) {
            case "Completed" -> TransactionStatus.SUCCESS;
            case "Pending" -> TransactionStatus.PENDING;
            case "Failed" -> TransactionStatus.FAILED;
            default -> TransactionStatus.UNKNOWN;
        };
    }

    private Mono<DisbursementResponse> fallbackDisburse(
            DisbursementRequest request,
            Throwable throwable) {
        log.error("bKash disbursement fallback: {}", throwable.getMessage());

        return Mono.just(DisbursementResponse.builder()
            .provider(MfsProvider.BKASH)
            .status(TransactionStatus.FAILED)
            .errorCode("BKASH_UNAVAILABLE")
            .errorMessage("bKash service temporarily unavailable")
            .build());
    }

    private String getPassword() {
        VaultResponse response = vaultTemplate.read("secret/data/ulms/bkash");
        return (String) response.getData().get("password");
    }

    private String getAppSecret() {
        VaultResponse response = vaultTemplate.read("secret/data/ulms/bkash");
        return (String) response.getData().get("app-secret");
    }

    private String formatPhoneNumber(String mobile) {
        // Ensure format: 01XXXXXXXXX
        if (mobile.startsWith("+880")) {
            return mobile.substring(4);
        } else if (mobile.startsWith("880")) {
            return mobile.substring(3);
        }
        return mobile;
    }

    private String maskPhoneNumber(String mobile) {
        if (mobile == null || mobile.length() < 8) return "****";
        return mobile.substring(0, 4) + "****" + mobile.substring(mobile.length() - 3);
    }
}
```

### 4.5 bKash Configuration

```yaml
# application-bkash.yml
bkash:
  enabled: true
  base-url: ${BKASH_API_URL:https://tokenized.sandbox.bka.sh/v1.2.0}
  username: ${vault:secret/data/ulms/bkash#username}
  app-key: ${BKASH_APP_KEY}

  # Timeout settings
  connection-timeout: 10000
  read-timeout: 30000

  # Retry settings
  retry:
    max-attempts: 3
    initial-interval: 2000
    multiplier: 2

  # Circuit breaker
  circuit-breaker:
    failure-rate-threshold: 50
    wait-duration-in-open-state: 60000
    sliding-window-size: 10

  # Transaction limits
  limits:
    min-amount: 10
    max-amount: 200000
    daily-limit: 500000
```

---

## 5. Nagad Integration

### 5.1 Nagad API Configuration

| Parameter | Value | Notes |
|-----------|-------|-------|
| **Base URL (Prod)** | `https://api.nagad.com.bd/api/merchant` | Production |
| **Base URL (Sandbox)** | `https://sandbox.nagad.com.bd/api/merchant` | Testing |
| **Authentication** | API Key + Request Signature | HMAC-SHA256 |
| **Timeout** | 30 seconds | Connection timeout |
| **Rate Limit** | 100 req/min | Per merchant |

### 5.2 Nagad API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/dfs/check-balance` | GET | Check merchant balance |
| `/dfs/send-money` | POST | B2P disbursement |
| `/dfs/transaction-status` | GET | Transaction status |
| `/dfs/refund` | POST | Refund transaction |

### 5.3 Nagad Request Signature

```java
// NagadSignatureUtil.java
public class NagadSignatureUtil {

    private static final String ALGORITHM = "HmacSHA256";

    /**
     * Generate Nagad request signature
     */
    public static String generateSignature(
            String payload,
            String secretKey,
            String timestamp) {

        try {
            String dataToSign = timestamp + payload;

            Mac mac = Mac.getInstance(ALGORITHM);
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                secretKey.getBytes(StandardCharsets.UTF_8),
                ALGORITHM
            );
            mac.init(secretKeySpec);

            byte[] signatureBytes = mac.doFinal(
                dataToSign.getBytes(StandardCharsets.UTF_8)
            );

            return Base64.getEncoder().encodeToString(signatureBytes);

        } catch (Exception e) {
            throw new SignatureGenerationException(
                "Failed to generate Nagad signature", e);
        }
    }

    /**
     * Verify Nagad response signature
     */
    public static boolean verifySignature(
            String payload,
            String signature,
            String secretKey,
            String timestamp) {

        String expectedSignature = generateSignature(payload, secretKey, timestamp);
        return MessageDigest.isEqual(
            expectedSignature.getBytes(StandardCharsets.UTF_8),
            signature.getBytes(StandardCharsets.UTF_8)
        );
    }
}
```

### 5.4 Nagad Adapter Implementation

```java
// NagadPaymentAdapter.java
@Component
@Slf4j
public class NagadPaymentAdapter implements MfsPaymentAdapter {

    private final WebClient webClient;
    private final NagadProperties properties;
    private final VaultTemplate vaultTemplate;

    @Override
    public MfsProvider getProvider() {
        return MfsProvider.NAGAD;
    }

    @Override
    @CircuitBreaker(name = "nagadApi", fallbackMethod = "fallbackDisburse")
    @Retry(name = "nagadApi")
    public Mono<DisbursementResponse> disburse(DisbursementRequest request) {
        log.info("Processing Nagad disbursement: {} to {}",
            request.getAmount(), maskPhoneNumber(request.getReceiverMobile()));

        String timestamp = generateTimestamp();
        NagadSendMoneyRequest nagadRequest = buildNagadRequest(request);
        String payload = serializeRequest(nagadRequest);
        String signature = NagadSignatureUtil.generateSignature(
            payload, getSecretKey(), timestamp);

        return webClient.post()
            .uri("/dfs/send-money")
            .header("X-KM-API-KEY", properties.getApiKey())
            .header("X-KM-TIMESTAMP", timestamp)
            .header("X-KM-SIGNATURE", signature)
            .header("X-KM-MERCHANT-ID", properties.getMerchantId())
            .bodyValue(nagadRequest)
            .retrieve()
            .onStatus(HttpStatusCode::is4xxClientError, this::handle4xxError)
            .onStatus(HttpStatusCode::is5xxServerError, this::handle5xxError)
            .bodyToMono(NagadSendMoneyResponse.class)
            .map(this::mapToResponse);
    }

    private NagadSendMoneyRequest buildNagadRequest(DisbursementRequest request) {
        return NagadSendMoneyRequest.builder()
            .amount(request.getAmount())
            .receiverMobileNo(formatPhoneNumber(request.getReceiverMobile()))
            .referenceNo(request.getReferenceId())
            .purpose("LOAN_DISBURSEMENT")
            .currency("BDT")
            .build();
    }

    private DisbursementResponse mapToResponse(NagadSendMoneyResponse nagadResponse) {
        return DisbursementResponse.builder()
            .provider(MfsProvider.NAGAD)
            .providerTransactionId(nagadResponse.getTransactionId())
            .status(mapStatus(nagadResponse.getStatus()))
            .amount(nagadResponse.getAmount())
            .receiverMobile(nagadResponse.getReceiverMobile())
            .completedAt(LocalDateTime.now())
            .charge(nagadResponse.getCharge())
            .build();
    }

    private String generateTimestamp() {
        return LocalDateTime.now(ZoneId.of("Asia/Dhaka"))
            .format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
    }

    private String getSecretKey() {
        VaultResponse response = vaultTemplate.read("secret/data/ulms/nagad");
        return (String) response.getData().get("secret-key");
    }
}
```

---

## 6. Rocket Integration

### 6.1 Rocket API Configuration

| Parameter | Value | Notes |
|-----------|-------|-------|
| **Base URL (Prod)** | `https://api.dutchbanglabank.com/rocket/v1` | Production |
| **Base URL (Sandbox)** | `https://sandbox.dutchbanglabank.com/rocket/v1` | Testing |
| **Authentication** | API Key + mTLS | Certificate-based |
| **Timeout** | 45 seconds | Longer timeout |
| **Rate Limit** | 50 req/min | Per merchant |

### 6.2 Rocket Adapter Implementation

```java
// RocketPaymentAdapter.java
@Component
@Slf4j
public class RocketPaymentAdapter implements MfsPaymentAdapter {

    private final WebClient webClient;
    private final RocketProperties properties;

    public RocketPaymentAdapter(
            WebClient.Builder webClientBuilder,
            RocketProperties properties,
            @Qualifier("rocketSslContext") SSLContext sslContext) {

        HttpClient httpClient = HttpClient.create()
            .secure(sslSpec -> sslSpec.sslContext(
                SslContextBuilder.forClient()
                    .keyManager(getKeyManagerFactory())
                    .trustManager(getTrustManagerFactory())
                    .build()));

        this.webClient = webClientBuilder
            .baseUrl(properties.getBaseUrl())
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .defaultHeader("X-API-KEY", properties.getApiKey())
            .build();

        this.properties = properties;
    }

    @Override
    public MfsProvider getProvider() {
        return MfsProvider.ROCKET;
    }

    @Override
    @CircuitBreaker(name = "rocketApi", fallbackMethod = "fallbackDisburse")
    @Retry(name = "rocketApi")
    public Mono<DisbursementResponse> disburse(DisbursementRequest request) {
        log.info("Processing Rocket disbursement: {} to {}",
            request.getAmount(), maskPhoneNumber(request.getReceiverMobile()));

        RocketTransferRequest rocketRequest = RocketTransferRequest.builder()
            .amount(request.getAmount())
            .toAccount(formatRocketAccount(request.getReceiverMobile()))
            .transactionReference(request.getReferenceId())
            .purpose("LOAN_DISBURSEMENT")
            .remarks("Loan disbursement - " + request.getLoanReference())
            .build();

        return webClient.post()
            .uri("/transfers/b2p")
            .bodyValue(rocketRequest)
            .retrieve()
            .bodyToMono(RocketTransferResponse.class)
            .map(this::mapToResponse);
    }

    private String formatRocketAccount(String mobile) {
        // Rocket uses 018XXXXXXXX format
        String formatted = mobile.replaceAll("[^0-9]", "");
        if (formatted.startsWith("880")) {
            formatted = "0" + formatted.substring(3);
        }
        return formatted;
    }
}
```

---

## 7. Unified Payment Interface

### 7.1 Payment Service Interface

```java
// MfsPaymentAdapter.java
public interface MfsPaymentAdapter {

    MfsProvider getProvider();

    // Disbursement
    Mono<DisbursementResponse> disburse(DisbursementRequest request);

    // Collection (default implementation)
    default Mono<CollectionResponse> collect(CollectionRequest request) {
        return Mono.error(new UnsupportedOperationException(
            "Collection not supported for " + getProvider()));
    }

    // Transaction Status
    default Mono<TransactionStatusResponse> getStatus(String transactionId) {
        return Mono.error(new UnsupportedOperationException(
            "Status check not supported for " + getProvider()));
    }

    // Refund
    default Mono<RefundResponse> refund(RefundRequest request) {
        return Mono.error(new UnsupportedOperationException(
            "Refund not supported for " + getProvider()));
    }

    // Health Check
    default Mono<Boolean> isHealthy() {
        return Mono.just(true);
    }
}
```

### 7.2 Payment Orchestration Service

```java
// PaymentOrchestrationService.java
@Service
@Slf4j
public class PaymentOrchestrationService {

    private final Map<MfsProvider, MfsPaymentAdapter> adapters;
    private final PaymentTransactionRepository transactionRepository;
    private final IdempotencyService idempotencyService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Autowired
    public PaymentOrchestrationService(
            List<MfsPaymentAdapter> adapterList,
            PaymentTransactionRepository transactionRepository,
            IdempotencyService idempotencyService,
            KafkaTemplate<String, Object> kafkaTemplate) {

        this.adapters = adapterList.stream()
            .collect(Collectors.toMap(
                MfsPaymentAdapter::getProvider,
                Function.identity()
            ));
        this.transactionRepository = transactionRepository;
        this.idempotencyService = idempotencyService;
        this.kafkaTemplate = kafkaTemplate;
    }

    /**
     * Process disbursement request
     */
    @Transactional
    public Mono<DisbursementResponse> processDisbursement(
            DisbursementRequest request,
            String idempotencyKey) {

        // Check idempotency
        return idempotencyService.checkIdempotency(idempotencyKey)
            .flatMap(existingResult -> {
                if (existingResult != null) {
                    log.info("Returning cached result for idempotency key: {}",
                        idempotencyKey);
                    return Mono.just(existingResult);
                }

                // Create transaction record
                PaymentTransaction transaction = createTransaction(request);

                // Get appropriate adapter
                MfsPaymentAdapter adapter = adapters.get(request.getProvider());
                if (adapter == null) {
                    throw new UnsupportedProviderException(request.getProvider());
                }

                // Execute disbursement
                return adapter.disburse(request)
                    .flatMap(response -> {
                        // Update transaction
                        updateTransaction(transaction, response);

                        // Cache result for idempotency
                        idempotencyService.cacheResult(idempotencyKey, response);

                        // Emit event
                        emitDisbursementEvent(transaction, response);

                        return Mono.just(response);
                    })
                    .doOnError(error -> {
                        transaction.setStatus(TransactionStatus.FAILED);
                        transaction.setErrorMessage(error.getMessage());
                        transactionRepository.save(transaction);
                    });
            });
    }

    /**
     * Get transaction status
     */
    public Mono<TransactionStatusResponse> getTransactionStatus(
            String transactionId) {

        PaymentTransaction transaction = transactionRepository
            .findByTransactionId(transactionId)
            .orElseThrow(() -> new TransactionNotFoundException(transactionId));

        // If completed or failed, return from database
        if (transaction.getStatus().isFinal()) {
            return Mono.just(mapToStatusResponse(transaction));
        }

        // Otherwise, check with provider
        MfsPaymentAdapter adapter = adapters.get(transaction.getProvider());
        return adapter.getStatus(transaction.getProviderTransactionId())
            .flatMap(response -> {
                // Update transaction if status changed
                if (response.getStatus() != transaction.getStatus()) {
                    transaction.setStatus(response.getStatus());
                    transaction.setUpdatedAt(LocalDateTime.now());
                    transactionRepository.save(transaction);
                }
                return Mono.just(response);
            });
    }

    /**
     * Process refund request
     */
    @Transactional
    public Mono<RefundResponse> processRefund(RefundRequest request) {
        PaymentTransaction originalTransaction = transactionRepository
            .findByTransactionId(request.getOriginalTransactionId())
            .orElseThrow(() -> new TransactionNotFoundException(
                request.getOriginalTransactionId()));

        // Validate refund is possible
        validateRefund(originalTransaction, request);

        MfsPaymentAdapter adapter = adapters.get(originalTransaction.getProvider());

        return adapter.refund(request)
            .flatMap(response -> {
                // Create refund transaction record
                PaymentTransaction refundTransaction = createRefundTransaction(
                    originalTransaction, request, response);
                transactionRepository.save(refundTransaction);

                // Update original transaction
                originalTransaction.setRefunded(true);
                originalTransaction.setRefundTransactionId(
                    refundTransaction.getTransactionId());
                transactionRepository.save(originalTransaction);

                return Mono.just(response);
            });
    }

    private PaymentTransaction createTransaction(DisbursementRequest request) {
        PaymentTransaction transaction = PaymentTransaction.builder()
            .transactionId(generateTransactionId())
            .transactionType(TransactionType.DISBURSEMENT)
            .provider(request.getProvider())
            .amount(request.getAmount())
            .currency("BDT")
            .receiverMobile(request.getReceiverMobile())
            .loanId(request.getLoanId())
            .referenceId(request.getReferenceId())
            .status(TransactionStatus.PENDING)
            .createdAt(LocalDateTime.now())
            .build();

        return transactionRepository.save(transaction);
    }

    private void emitDisbursementEvent(
            PaymentTransaction transaction,
            DisbursementResponse response) {

        DisbursementCompletedEvent event = DisbursementCompletedEvent.builder()
            .transactionId(transaction.getTransactionId())
            .loanId(transaction.getLoanId())
            .provider(transaction.getProvider())
            .amount(response.getAmount())
            .status(response.getStatus())
            .providerTransactionId(response.getProviderTransactionId())
            .completedAt(response.getCompletedAt())
            .build();

        kafkaTemplate.send("ulms.payment.disbursement.completed", event);
    }

    private String generateTransactionId() {
        return String.format("TXN-%s-%s",
            LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE),
            UUID.randomUUID().toString().substring(0, 8).toUpperCase());
    }
}
```

### 7.3 API Controller

```java
// PaymentController.java
@RestController
@RequestMapping("/api/v1/payments")
@Slf4j
public class PaymentController {

    private final PaymentOrchestrationService paymentService;

    @PostMapping("/disburse")
    public Mono<ResponseEntity<DisbursementResponse>> disburse(
            @Valid @RequestBody DisbursementRequest request,
            @RequestHeader("X-Idempotency-Key") String idempotencyKey) {

        log.info("Disbursement request received: provider={}, amount={}, idempotencyKey={}",
            request.getProvider(), request.getAmount(), idempotencyKey);

        return paymentService.processDisbursement(request, idempotencyKey)
            .map(response -> {
                if (response.getStatus() == TransactionStatus.SUCCESS) {
                    return ResponseEntity.ok(response);
                } else if (response.getStatus() == TransactionStatus.PENDING) {
                    return ResponseEntity.accepted().body(response);
                } else {
                    return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED)
                        .body(response);
                }
            });
    }

    @GetMapping("/{transactionId}/status")
    public Mono<ResponseEntity<TransactionStatusResponse>> getStatus(
            @PathVariable String transactionId) {

        return paymentService.getTransactionStatus(transactionId)
            .map(ResponseEntity::ok);
    }

    @PostMapping("/{transactionId}/refund")
    public Mono<ResponseEntity<RefundResponse>> refund(
            @PathVariable String transactionId,
            @Valid @RequestBody RefundRequest request) {

        request.setOriginalTransactionId(transactionId);
        return paymentService.processRefund(request)
            .map(ResponseEntity::ok);
    }
}
```

---

## 8. Transaction Management

### 8.1 Idempotency Handling

```java
// IdempotencyService.java
@Service
@Slf4j
public class IdempotencyService {

    private final RedisTemplate<String, Object> redisTemplate;
    private static final String KEY_PREFIX = "idempotency:payment:";
    private static final Duration TTL = Duration.ofHours(24);

    public Mono<DisbursementResponse> checkIdempotency(String idempotencyKey) {
        String key = KEY_PREFIX + idempotencyKey;

        return Mono.fromCallable(() ->
            (DisbursementResponse) redisTemplate.opsForValue().get(key));
    }

    public void cacheResult(String idempotencyKey, DisbursementResponse response) {
        String key = KEY_PREFIX + idempotencyKey;
        redisTemplate.opsForValue().set(key, response, TTL);
        log.debug("Cached idempotency result for key: {}", idempotencyKey);
    }
}
```

### 8.2 Transaction Status Tracking

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TRANSACTION STATUS STATE MACHINE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                         ┌─────────────┐                                      │
│                         │   PENDING   │                                      │
│                         └──────┬──────┘                                      │
│                                │                                             │
│                    ┌───────────┴───────────┐                                │
│                    │                       │                                │
│                    ▼                       ▼                                │
│           ┌─────────────┐          ┌─────────────┐                          │
│           │ PROCESSING  │          │   FAILED    │◀─────┐                   │
│           └──────┬──────┘          └─────────────┘      │                   │
│                  │                        ▲             │                   │
│      ┌───────────┴───────────┐           │             │                   │
│      │                       │           │             │                   │
│      ▼                       ▼           │             │                   │
│ ┌─────────────┐       ┌─────────────┐    │             │                   │
│ │   SUCCESS   │       │   TIMEOUT   │────┘             │                   │
│ └──────┬──────┘       └─────────────┘                  │                   │
│        │                                               │                   │
│        │ Refund Request                                │                   │
│        │                                               │                   │
│        ▼                                               │                   │
│ ┌─────────────┐       ┌─────────────┐                  │                   │
│ │  REFUNDING  │──────▶│  REFUNDED   │                  │                   │
│ └─────────────┘       └─────────────┘                  │                   │
│        │                                               │                   │
│        └───────────────────────────────────────────────┘                   │
│                                                                              │
│   Legend:                                                                   │
│   ────▶  Normal transition                                                  │
│   - - -▶ Error/timeout transition                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Duplicate Prevention

```java
// DuplicatePreventionService.java
@Service
@Slf4j
public class DuplicatePreventionService {

    private final PaymentTransactionRepository transactionRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String DUPLICATE_CHECK_PREFIX = "payment:duplicate:";

    /**
     * Check for duplicate transaction
     */
    public boolean isDuplicate(DisbursementRequest request) {
        // Generate duplicate key based on loan, amount, and time window
        String duplicateKey = generateDuplicateKey(request);

        // Check Redis first (fast path)
        Boolean exists = redisTemplate.hasKey(duplicateKey);
        if (Boolean.TRUE.equals(exists)) {
            log.warn("Potential duplicate detected (Redis): {}", duplicateKey);
            return true;
        }

        // Check database for recent similar transactions (last 5 minutes)
        LocalDateTime windowStart = LocalDateTime.now().minusMinutes(5);
        Optional<PaymentTransaction> existingTxn = transactionRepository
            .findByLoanIdAndAmountAndReceiverMobileAndCreatedAtAfter(
                request.getLoanId(),
                request.getAmount(),
                request.getReceiverMobile(),
                windowStart
            );

        if (existingTxn.isPresent()) {
            log.warn("Potential duplicate detected (DB): {}, existing: {}",
                duplicateKey, existingTxn.get().getTransactionId());
            return true;
        }

        // Mark as processing (prevent race condition)
        redisTemplate.opsForValue().set(duplicateKey, "PROCESSING",
            Duration.ofMinutes(5));

        return false;
    }

    private String generateDuplicateKey(DisbursementRequest request) {
        return String.format("%s%d:%s:%s",
            DUPLICATE_CHECK_PREFIX,
            request.getLoanId(),
            request.getAmount().toPlainString(),
            request.getReceiverMobile());
    }
}
```

---

## 9. Reconciliation

### 9.1 Reconciliation Process

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PAYMENT RECONCILIATION PROCESS                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   DAILY RECONCILIATION (2:00 AM)                                            │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    STEP 1: FETCH DATA                                │   │
│   │                                                                      │   │
│   │   ┌─────────────────┐                ┌─────────────────────────┐    │   │
│   │   │  ULMS Payment   │                │   MFS Provider          │    │   │
│   │   │  Transactions   │                │   Settlement Report     │    │   │
│   │   │  (Yesterday)    │                │   (Yesterday)           │    │   │
│   │   └────────┬────────┘                └────────────┬────────────┘    │   │
│   │            │                                      │                 │   │
│   └────────────│──────────────────────────────────────│─────────────────┘   │
│                │                                      │                     │
│                ▼                                      ▼                     │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    STEP 2: MATCH RECORDS                             │   │
│   │                                                                      │   │
│   │   For each ULMS transaction:                                        │   │
│   │   • Find matching MFS transaction by reference                      │   │
│   │   • Compare amount, status, timestamp                               │   │
│   │   • Categorize: MATCHED, MISMATCHED, MISSING_IN_ULMS, MISSING_IN_MFS│   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    STEP 3: HANDLE DISCREPANCIES                      │   │
│   │                                                                      │   │
│   │   • MISSING_IN_MFS → Verify with provider, update status            │   │
│   │   • MISSING_IN_ULMS → Create record from MFS data                   │   │
│   │   • AMOUNT_MISMATCH → Flag for manual review                        │   │
│   │   • STATUS_MISMATCH → Update ULMS status                            │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    STEP 4: GENERATE REPORT                           │   │
│   │                                                                      │   │
│   │   • Total transactions: 1,234                                       │   │
│   │   • Matched: 1,230 (99.7%)                                          │   │
│   │   • Discrepancies: 4 (0.3%)                                         │   │
│   │   • Amount reconciled: BDT 12,340,000                               │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Reconciliation Service

```java
// PaymentReconciliationService.java
@Service
@Slf4j
public class PaymentReconciliationService {

    private final PaymentTransactionRepository transactionRepository;
    private final Map<MfsProvider, MfsPaymentAdapter> adapters;
    private final ReconciliationReportRepository reportRepository;

    @Scheduled(cron = "0 0 2 * * ?")  // 2 AM daily
    public void runDailyReconciliation() {
        log.info("Starting daily payment reconciliation");

        LocalDate reconciliationDate = LocalDate.now().minusDays(1);

        for (MfsProvider provider : MfsProvider.values()) {
            try {
                reconcileProvider(provider, reconciliationDate);
            } catch (Exception e) {
                log.error("Reconciliation failed for {}: {}",
                    provider, e.getMessage());
            }
        }
    }

    private void reconcileProvider(MfsProvider provider, LocalDate date) {
        log.info("Reconciling {} transactions for {}", provider, date);

        // Fetch ULMS transactions
        List<PaymentTransaction> ulmsTransactions = transactionRepository
            .findByProviderAndCreatedAtBetween(
                provider,
                date.atStartOfDay(),
                date.plusDays(1).atStartOfDay()
            );

        // Fetch provider settlement report
        List<MfsSettlementRecord> providerRecords =
            fetchProviderSettlement(provider, date);

        // Build lookup maps
        Map<String, PaymentTransaction> ulmsMap = ulmsTransactions.stream()
            .collect(Collectors.toMap(
                PaymentTransaction::getProviderTransactionId,
                Function.identity(),
                (a, b) -> a
            ));

        Map<String, MfsSettlementRecord> providerMap = providerRecords.stream()
            .collect(Collectors.toMap(
                MfsSettlementRecord::getTransactionId,
                Function.identity(),
                (a, b) -> a
            ));

        // Reconciliation results
        List<ReconciliationResult> results = new ArrayList<>();
        int matched = 0;
        int mismatched = 0;
        BigDecimal totalAmount = BigDecimal.ZERO;

        // Check ULMS transactions against provider
        for (PaymentTransaction ulms : ulmsTransactions) {
            MfsSettlementRecord provider_record =
                providerMap.get(ulms.getProviderTransactionId());

            if (provider_record == null) {
                // Missing in provider
                results.add(ReconciliationResult.builder()
                    .transactionId(ulms.getTransactionId())
                    .type(ReconciliationType.MISSING_IN_PROVIDER)
                    .ulmsAmount(ulms.getAmount())
                    .build());
                mismatched++;
            } else if (!ulms.getAmount().equals(provider_record.getAmount())) {
                // Amount mismatch
                results.add(ReconciliationResult.builder()
                    .transactionId(ulms.getTransactionId())
                    .type(ReconciliationType.AMOUNT_MISMATCH)
                    .ulmsAmount(ulms.getAmount())
                    .providerAmount(provider_record.getAmount())
                    .build());
                mismatched++;
            } else {
                // Matched
                matched++;
                totalAmount = totalAmount.add(ulms.getAmount());
            }

            providerMap.remove(ulms.getProviderTransactionId());
        }

        // Check for transactions in provider but not in ULMS
        for (MfsSettlementRecord orphan : providerMap.values()) {
            results.add(ReconciliationResult.builder()
                .transactionId(orphan.getTransactionId())
                .type(ReconciliationType.MISSING_IN_ULMS)
                .providerAmount(orphan.getAmount())
                .build());
            mismatched++;
        }

        // Save reconciliation report
        ReconciliationReport report = ReconciliationReport.builder()
            .provider(provider)
            .reconciliationDate(date)
            .totalTransactions(ulmsTransactions.size())
            .matchedCount(matched)
            .mismatchedCount(mismatched)
            .totalAmount(totalAmount)
            .results(results)
            .createdAt(LocalDateTime.now())
            .build();

        reportRepository.save(report);

        log.info("Reconciliation completed for {}: matched={}, mismatched={}",
            provider, matched, mismatched);

        // Alert if discrepancies exceed threshold
        if (mismatched > 0) {
            alertDiscrepancies(report);
        }
    }
}
```

---

## 10. Error Handling & Retry

### 10.1 Error Classification

| Error Type | Code | Retry | Action |
|------------|------|-------|--------|
| **Network Timeout** | NET_TIMEOUT | Yes (3x) | Exponential backoff |
| **Provider Unavailable** | PROVIDER_DOWN | Yes (5x) | Circuit breaker |
| **Invalid Account** | INVALID_ACCOUNT | No | Return error |
| **Insufficient Balance** | INSUFFICIENT_BAL | No | Return error |
| **Daily Limit Exceeded** | LIMIT_EXCEEDED | No | Return error |
| **Duplicate Transaction** | DUPLICATE | No | Return existing |
| **Authentication Failed** | AUTH_FAILED | No | Alert ops |

### 10.2 Resilience Configuration

```yaml
# Resilience4j Configuration
resilience4j:
  circuitbreaker:
    instances:
      bkashApi:
        registerHealthIndicator: true
        slidingWindowSize: 10
        minimumNumberOfCalls: 5
        permittedNumberOfCallsInHalfOpenState: 3
        automaticTransitionFromOpenToHalfOpenEnabled: true
        waitDurationInOpenState: 60s
        failureRateThreshold: 50

      nagadApi:
        registerHealthIndicator: true
        slidingWindowSize: 10
        minimumNumberOfCalls: 5
        waitDurationInOpenState: 60s
        failureRateThreshold: 50

      rocketApi:
        registerHealthIndicator: true
        slidingWindowSize: 10
        minimumNumberOfCalls: 5
        waitDurationInOpenState: 90s  # Rocket is slower
        failureRateThreshold: 40

  retry:
    instances:
      bkashApi:
        maxAttempts: 3
        waitDuration: 2s
        enableExponentialBackoff: true
        exponentialBackoffMultiplier: 2
        retryExceptions:
          - java.net.SocketTimeoutException
          - java.net.ConnectException

      nagadApi:
        maxAttempts: 3
        waitDuration: 2s
        enableExponentialBackoff: true

      rocketApi:
        maxAttempts: 4
        waitDuration: 3s
        enableExponentialBackoff: true

  ratelimiter:
    instances:
      bkashApi:
        limitForPeriod: 100
        limitRefreshPeriod: 60s
        timeoutDuration: 10s

      nagadApi:
        limitForPeriod: 100
        limitRefreshPeriod: 60s
        timeoutDuration: 10s

      rocketApi:
        limitForPeriod: 50
        limitRefreshPeriod: 60s
        timeoutDuration: 10s
```

---

## 11. Security & Compliance

### 11.1 Security Measures

| Security Control | Implementation |
|-----------------|----------------|
| **Data Encryption** | AES-256 for sensitive data at rest |
| **Transport Security** | TLS 1.3 for all API calls |
| **API Key Protection** | HashiCorp Vault storage |
| **Request Signing** | HMAC-SHA256 (Nagad) |
| **mTLS** | Certificate-based (Rocket) |
| **PCI DSS** | Compliant data handling |

### 11.2 Sensitive Data Handling

```java
// PaymentDataMasking.java
public class PaymentDataMasking {

    /**
     * Mask mobile number for logging
     */
    public static String maskMobile(String mobile) {
        if (mobile == null || mobile.length() < 8) return "****";
        return mobile.substring(0, 4) + "****" +
               mobile.substring(mobile.length() - 3);
    }

    /**
     * Mask transaction ID for public display
     */
    public static String maskTransactionId(String txnId) {
        if (txnId == null || txnId.length() < 8) return "****";
        return txnId.substring(0, 4) + "****" +
               txnId.substring(txnId.length() - 4);
    }

    /**
     * Mask amount for logging (show only order of magnitude)
     */
    public static String maskAmount(BigDecimal amount) {
        if (amount == null) return "****";
        int digits = amount.precision() - amount.scale();
        return "~" + digits + " digits";
    }
}
```

### 11.3 Audit Logging

```java
// PaymentAuditLogger.java
@Aspect
@Component
@Slf4j
public class PaymentAuditLogger {

    private final AuditLogRepository auditLogRepository;

    @Around("@annotation(PaymentAudit)")
    public Object logPaymentOperation(ProceedingJoinPoint joinPoint) throws Throwable {
        String operation = joinPoint.getSignature().getName();
        Object[] args = joinPoint.getArgs();

        AuditLog auditLog = AuditLog.builder()
            .operation(operation)
            .requestData(sanitizeForLogging(args))
            .requestedAt(LocalDateTime.now())
            .requestedBy(SecurityContextHolder.getContext()
                .getAuthentication().getName())
            .build();

        try {
            Object result = joinPoint.proceed();
            auditLog.setStatus("SUCCESS");
            auditLog.setResponseData(sanitizeForLogging(result));
            return result;
        } catch (Exception e) {
            auditLog.setStatus("FAILED");
            auditLog.setErrorMessage(e.getMessage());
            throw e;
        } finally {
            auditLog.setCompletedAt(LocalDateTime.now());
            auditLogRepository.save(auditLog);
        }
    }
}
```

---

## 12. Rate Limiting & Quotas

### 12.1 Rate Limits by Provider

| Provider | Requests/Minute | Daily Volume | Daily Amount |
|----------|-----------------|--------------|--------------|
| **bKash** | 100 | 10,000 | BDT 100 Cr |
| **Nagad** | 100 | 10,000 | BDT 100 Cr |
| **Rocket** | 50 | 5,000 | BDT 50 Cr |

### 12.2 Kong Rate Limiting

```yaml
# Kong Rate Limiting for Payment APIs
plugins:
  - name: rate-limiting
    service: payment-gateway-service
    config:
      minute: 200
      policy: redis
      redis_host: redis
      redis_port: 6379

  - name: rate-limiting-advanced
    service: payment-gateway-service
    config:
      identifier: consumer
      window_size: 60
      window_type: sliding
      limit:
        - 100  # Per minute per consumer
```

---

## 13. Monitoring & Observability

### 13.1 Key Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `payment.disbursement.total` | Counter | Total disbursements |
| `payment.disbursement.success` | Counter | Successful disbursements |
| `payment.disbursement.failed` | Counter | Failed disbursements |
| `payment.disbursement.duration` | Timer | Processing time |
| `payment.provider.health` | Gauge | Provider availability |
| `payment.reconciliation.discrepancy` | Gauge | Discrepancy count |

### 13.2 Grafana Dashboard Queries

```promql
# Disbursement Success Rate
sum(rate(payment_disbursement_success_total[5m])) /
sum(rate(payment_disbursement_total_total[5m])) * 100

# Average Disbursement Time by Provider
histogram_quantile(0.95,
  sum(rate(payment_disbursement_duration_seconds_bucket[5m])) by (le, provider))

# Daily Disbursement Volume
sum(increase(payment_disbursement_success_total[24h])) by (provider)

# Circuit Breaker Status
sum(resilience4j_circuitbreaker_state) by (name)
```

### 13.3 Alert Rules

```yaml
groups:
  - name: payment-gateway-alerts
    rules:
      - alert: PaymentHighFailureRate
        expr: |
          sum(rate(payment_disbursement_failed_total[5m])) /
          sum(rate(payment_disbursement_total_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Payment failure rate above 5%"

      - alert: ProviderCircuitBreakerOpen
        expr: resilience4j_circuitbreaker_state == 2
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "MFS provider circuit breaker is OPEN"

      - alert: ReconciliationDiscrepancyHigh
        expr: payment_reconciliation_discrepancy_count > 10
        for: 30m
        labels:
          severity: warning
        annotations:
          summary: "High reconciliation discrepancy count"
```

---

## 14. Data Model

### 14.1 Payment Transaction Table

```sql
-- Payment Transaction Table
CREATE TABLE payment_transaction (
    id BIGSERIAL PRIMARY KEY,

    -- Transaction Identifiers
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    provider_transaction_id VARCHAR(100),
    reference_id VARCHAR(100) NOT NULL,

    -- Transaction Details
    transaction_type VARCHAR(30) NOT NULL,  -- DISBURSEMENT, COLLECTION, REFUND
    provider VARCHAR(20) NOT NULL,          -- BKASH, NAGAD, ROCKET
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'BDT',
    charge DECIMAL(10,2),

    -- Parties
    loan_id BIGINT,
    customer_id BIGINT,
    receiver_mobile VARCHAR(20) NOT NULL,
    receiver_name VARCHAR(200),

    -- Status
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    -- PENDING, PROCESSING, SUCCESS, FAILED, REFUNDED

    -- Provider Response
    provider_response_code VARCHAR(20),
    provider_response_message VARCHAR(500),
    provider_response_data JSONB,

    -- Refund
    refunded BOOLEAN DEFAULT FALSE,
    refund_transaction_id VARCHAR(50),
    refund_reason VARCHAR(200),

    -- Error Details
    error_code VARCHAR(50),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Audit
    created_by VARCHAR(100) NOT NULL,

    -- Constraints
    CONSTRAINT chk_transaction_type CHECK (
        transaction_type IN ('DISBURSEMENT', 'COLLECTION', 'REFUND')
    ),
    CONSTRAINT chk_provider CHECK (
        provider IN ('BKASH', 'NAGAD', 'ROCKET')
    ),
    CONSTRAINT chk_status CHECK (
        status IN ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REFUNDED', 'TIMEOUT')
    )
);

-- Indexes
CREATE INDEX idx_payment_txn_loan ON payment_transaction(loan_id);
CREATE INDEX idx_payment_txn_provider ON payment_transaction(provider);
CREATE INDEX idx_payment_txn_status ON payment_transaction(status);
CREATE INDEX idx_payment_txn_created ON payment_transaction(created_at);
CREATE INDEX idx_payment_txn_reference ON payment_transaction(reference_id);
CREATE INDEX idx_payment_txn_provider_txn ON payment_transaction(provider_transaction_id);

-- Comments
COMMENT ON TABLE payment_transaction IS 'MFS payment transactions for loan disbursement and collection';
```

---

## 15. Apache Camel Routes

### 15.1 Payment Processing Route

```java
// PaymentProcessingRoute.java
@Component
public class PaymentProcessingRoute extends RouteBuilder {

    @Override
    public void configure() throws Exception {

        // Error Handler
        errorHandler(deadLetterChannel("kafka:dlq.payment.failed")
            .maximumRedeliveries(3)
            .redeliveryDelay(5000)
            .exponentialBackOff());

        // Disbursement Processing Route
        from("kafka:ulms.loan.disbursement.requested?groupId=payment-processor")
            .routeId("payment-disbursement-route")
            .unmarshal().json(JsonLibrary.Jackson, DisbursementRequestEvent.class)
            .log(LoggingLevel.INFO, "Processing disbursement: ${body.loanId}")

            // Select provider based on customer preference
            .process("providerSelector")

            // Route to appropriate provider
            .toD("direct:${header.providerRoute}")

            // Update loan status
            .process("disbursementStatusUpdater")

            // Emit completion event
            .to("kafka:ulms.payment.disbursement.completed");

        // bKash Route
        from("direct:payment-bkash")
            .routeId("payment-bkash-route")
            .circuitBreaker()
                .resilience4jConfiguration()
                    .minimumNumberOfCalls(5)
                    .failureRateThreshold(50)
                .end()
                .to("bean:bkashPaymentAdapter?method=disburse")
            .onFallback()
                .process("bkashFallbackProcessor")
            .end();

        // Nagad Route
        from("direct:payment-nagad")
            .routeId("payment-nagad-route")
            .circuitBreaker()
                .to("bean:nagadPaymentAdapter?method=disburse")
            .onFallback()
                .process("nagadFallbackProcessor")
            .end();

        // Rocket Route
        from("direct:payment-rocket")
            .routeId("payment-rocket-route")
            .circuitBreaker()
                .to("bean:rocketPaymentAdapter?method=disburse")
            .onFallback()
                .process("rocketFallbackProcessor")
            .end();
    }
}
```

---

## 16. Implementation Guide

### 16.1 Prerequisites

| Component | Requirement | Notes |
|-----------|-------------|-------|
| **Java** | 21 (LTS) | GraalVM recommended |
| **Spring Boot** | 3.2.1 | Parent POM |
| **bKash Credentials** | Merchant account | Contact bKash |
| **Nagad Credentials** | Merchant account | Contact Nagad |
| **Rocket Credentials** | Merchant account | Contact DBBL |

### 16.2 Environment Configuration

```yaml
# application-payment.yml
payment:
  enabled: true

  providers:
    bkash:
      enabled: true
      priority: 1
    nagad:
      enabled: true
      priority: 2
    rocket:
      enabled: true
      priority: 3

  default-provider: BKASH

  limits:
    min-amount: 10
    max-amount: 200000
    daily-limit-per-loan: 500000

  reconciliation:
    enabled: true
    schedule: "0 0 2 * * ?"  # 2 AM daily
```

---

## 17. Appendices

### Appendix A: Error Codes

| Code | Provider | Description |
|------|----------|-------------|
| BKASH_001 | bKash | Invalid receiver account |
| BKASH_002 | bKash | Insufficient merchant balance |
| BKASH_003 | bKash | Transaction limit exceeded |
| NAGAD_001 | Nagad | Invalid mobile number |
| NAGAD_002 | Nagad | Daily limit exceeded |
| ROCKET_001 | Rocket | Account not found |
| ROCKET_002 | Rocket | Service temporarily unavailable |

### Appendix B: Kafka Topics

| Topic | Purpose | Retention |
|-------|---------|-----------|
| `ulms.loan.disbursement.requested` | Disbursement requests | 7 days |
| `ulms.payment.disbursement.completed` | Completion events | 7 days |
| `ulms.payment.collection.received` | Collection events | 7 days |
| `dlq.payment.failed` | Dead letter queue | 30 days |

### Appendix C: References

1. bKash Merchant API Documentation v1.2.0
2. Nagad Merchant Integration Guide v2.0
3. Rocket B2P API Documentation
4. Bangladesh Bank MFS Guidelines
5. ULMS BRD v1.0 - Section 6.4 Disbursement Methods
6. Apache Camel 4.3 Documentation

---

**Document End**

*ULMS v2.0 - Payment Gateway Integration Design v1.0*

*Unisoft Systems Limited - Confidential*

*This document provides the comprehensive MFS payment gateway integration design for ULMS v2.0.*

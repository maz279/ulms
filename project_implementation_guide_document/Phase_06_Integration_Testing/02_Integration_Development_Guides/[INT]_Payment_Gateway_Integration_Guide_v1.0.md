**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Payment Gateway Integration Guide |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Technical Lead, Unisoft Systems Limited |
| **Reviewed By** | Security Architect |
| **Classification** | Confidential |
| **Status** | Draft |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | Technical Lead | Initial version |

---

# Payment Gateway Integration Guide

## Table of Contents

1. [Introduction](#1-introduction)
2. [Payment Gateway Overview](#2-payment-gateway-overview)
3. [bKash Integration](#3-bkash-integration)
4. [Nagad Integration](#4-nagad-integration)
5. [Rocket/DBBL Integration](#5-rocketdbbl-integration)
6. [Unified Payment Service](#6-unified-payment-service)
7. [Webhook Handling](#7-webhook-handling)
8. [Security Considerations](#8-security-considerations)
9. [Error Handling](#9-error-handling)
10. [Testing Strategy](#10-testing-strategy)
11. [Related Documents](#11-related-documents)

---

## 1. Introduction

### 1.1 Purpose

This document provides comprehensive technical guidance for integrating ULMS v2.0 with Bangladesh's major payment gateways: bKash, Nagad, and Rocket/DBBL. It covers payment initiation, callback handling, reconciliation, and security requirements.

### 1.2 Scope

- bKash API integration (v1.2.0-beta)
- Nagad API integration
- Rocket/DBBL payment integration
- Unified payment abstraction layer
- Webhook/Callback handling
- Payment reconciliation

### 1.3 Prerequisites

| Gateway | Requirements |
|---------|--------------|
| bKash | Merchant account, App Key, App Secret, Username, Password |
| Nagad | Merchant ID, Merchant Private Key, Nagad Public Key |
| Rocket | Merchant ID, API Key, Terminal ID |

---

## 2. Payment Gateway Overview

### 2.1 Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PAYMENT GATEWAY INTEGRATION ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         ULMS v2.0                                    │   │
│   │  ┌──────────────────────────────────────────────────────────────┐  │   │
│   │  │                  UNIFIED PAYMENT SERVICE                      │  │   │
│   │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │  │   │
│   │  │  │  Payment    │  │   Webhook   │  │   Reconciliation    │  │  │   │
│   │  │  │  Initiator  │  │   Handler   │  │     Service         │  │  │   │
│   │  │  └──────┬──────┘  └─────────────┘  └─────────────────────┘  │  │   │
│   │  └─────────┼────────────────────────────────────────────────────┘  │   │
│   │            │                                                        │   │
│   │     ┌──────┴──────┐                                                │   │
│   │     │   Factory   │                                                │   │
│   │     │   Pattern   │                                                │   │
│   │     └──────┬──────┘                                                │   │
│   └────────────┼────────────────────────────────────────────────────────┘   │
│                │                                                             │
│        ┌───────┼───────┬───────────────┐                                    │
│        ▼       ▼       ▼               ▼                                    │
│   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                              │
│   │ bKash  │ │ Nagad  │ │ Rocket │ │ Others │                              │
│   │  API   │ │  API   │ │  API   │ │        │                              │
│   └────────┘ └────────┘ └────────┘ └────────┘                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Payment Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Borrower│────▶│   ULMS   │────▶│ Payment  │────▶│ Payment  │
│  Initiate│     │   Init   │     │ Gateway  │     │  Page    │
└──────────┘     └──────────┘     └──────────┘     └────┬─────┘
                                                        │
                                                        ▼
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Payment │◀────│   ULMS   │◀────│ Webhook  │◀────│ Borrower │
│ Complete │     │ Confirm  │     │ Callback │     │ Complete │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

---

## 3. bKash Integration

### 3.1 bKash API Overview

bKash provides a comprehensive API for merchant integration supporting:
- Payment creation and execution
- Query payment status
- Refund processing
- Transaction history

### 3.2 Configuration

```yaml
# application-payment.yml
payment:
  gateways:
    bkash:
      enabled: true
      mode: sandbox # or production
      base-url: https://tokenized.sandbox.bka.sh/v1.2.0-beta
      # Credentials from bKash merchant portal
      app-key: ${BKASH_APP_KEY}
      app-secret: ${BKASH_APP_SECRET}
      username: ${BKASH_USERNAME}
      password: ${BKASH_PASSWORD}
      # Callback configuration
      callback-url: https://ulms.bank.com/api/payments/bkash/callback
      # Token settings
      token-ttl: 3600
      # Retry settings
      max-retries: 3
      timeout: 30000
```

### 3.3 bKash Token Management

```java
@Component
public class BkashTokenManager {
    
    private final WebClient webClient;
    private final RedisTemplate<String, String> redisTemplate;
    
    @Value("${payment.gateways.bkash.app-key}")
    private String appKey;
    
    @Value("${payment.gateways.bkash.app-secret}")
    private String appSecret;
    
    @Value("${payment.gateways.bkash.username}")
    private String username;
    
    @Value("${payment.gateways.bkash.password}")
    private String password;
    
    private static final String TOKEN_KEY = "bkash:token";
    private static final String REFRESH_TOKEN_KEY = "bkash:refresh_token";
    
    /**
     * Get valid bKash access token
     */
    public synchronized BkashToken getToken() {
        String token = redisTemplate.opsForValue().get(TOKEN_KEY);
        
        if (token != null) {
            return BkashToken.builder()
                .idToken(token)
                .tokenType("Bearer")
                .build();
        }
        
        return refreshToken();
    }
    
    /**
     * Refresh token from bKash
     */
    private BkashToken refreshToken() {
        BkashGrantTokenRequest request = BkashGrantTokenRequest.builder()
            .appKey(appKey)
            .appSecret(appSecret)
            .build();
        
        BkashGrantTokenResponse response = webClient.post()
            .uri("/tokenized/checkout/token/grant")
            .header("username", username)
            .header("password", password)
            .bodyValue(request)
            .retrieve()
            .bodyToMono(BkashGrantTokenResponse.class)
            .block();
        
        if (response == null || !"0000".equals(response.getStatusCode())) {
            throw new BkashAuthenticationException("Failed to get bKash token");
        }
        
        // Cache tokens
        long ttl = 3300; // 55 minutes (token valid for 60 min)
        redisTemplate.opsForValue().set(TOKEN_KEY, response.getIdToken(), ttl, TimeUnit.SECONDS);
        redisTemplate.opsForValue().set(REFRESH_TOKEN_KEY, response.getRefreshToken(), ttl, TimeUnit.SECONDS);
        
        return BkashToken.builder()
            .idToken(response.getIdToken())
            .refreshToken(response.getRefreshToken())
            .tokenType(response.getTokenType())
            .build();
    }
}
```

### 3.4 Payment Creation and Execution

```java
@Component
public class BkashPaymentClient {
    
    @Autowired
    private BkashTokenManager tokenManager;
    
    @Autowired
    private WebClient bkashWebClient;
    
    @Value("${payment.gateways.bkash.app-key}")
    private String appKey;
    
    @Value("${payment.gateways.bkash.callback-url}")
    private String callbackUrl;
    
    /**
     * Create bKash payment
     */
    public PaymentIntent createPayment(PaymentRequest request) {
        BkashToken token = tokenManager.getToken();
        
        String merchantInvoiceNumber = generateInvoiceNumber(request);
        
        BkashCreatePaymentRequest payload = BkashCreatePaymentRequest.builder()
            .mode("0011") // Tokenized checkout
            .payerReference(request.getBorrowerMobile())
            .callbackURL(callbackUrl)
            .merchantAssociationInfo("MI MID Test_1234")
            .amount(request.getAmount().toString())
            .currency("BDT")
            .intent("sale")
            .merchantInvoiceNumber(merchantInvoiceNumber)
            .build();
        
        BkashCreatePaymentResponse response = bkashWebClient.post()
            .uri("/tokenized/checkout/create")
            .header("Authorization", token.getIdToken())
            .header("X-APP-Key", appKey)
            .bodyValue(payload)
            .retrieve()
            .bodyToMono(BkashCreatePaymentResponse.class)
            .block();
        
        if (response == null || !"0000".equals(response.getStatusCode())) {
            throw new PaymentCreationException("Failed to create bKash payment: " + 
                (response != null ? response.getStatusMessage() : "No response"));
        }
        
        return PaymentIntent.builder()
            .paymentId(response.getPaymentID())
            .paymentUrl(response.getBkashURL())
            .amount(new BigDecimal(response.getAmount()))
            .currency(response.getCurrency())
            .merchantInvoiceNumber(response.getMerchantInvoiceNumber())
            .status(PaymentStatus.PENDING)
            .gateway(PaymentGateway.BKASH)
            .createdAt(Instant.now())
            .build();
    }
    
    /**
     * Execute payment after user confirmation
     */
    public PaymentResult executePayment(String paymentId) {
        BkashToken token = tokenManager.getToken();
        
        BkashExecutePaymentRequest payload = BkashExecutePaymentRequest.builder()
            .paymentID(paymentId)
            .build();
        
        BkashExecutePaymentResponse response = bkashWebClient.post()
            .uri("/tokenized/checkout/execute")
            .header("Authorization", token.getIdToken())
            .header("X-APP-Key", appKey)
            .bodyValue(payload)
            .retrieve()
            .bodyToMono(BkashExecutePaymentResponse.class)
            .block();
        
        if (response == null) {
            throw new PaymentExecutionException("No response from bKash");
        }
        
        if (!"0000".equals(response.getStatusCode())) {
            return PaymentResult.builder()
                .success(false)
                .paymentId(paymentId)
                .status(PaymentStatus.FAILED)
                .errorCode(response.getStatusCode())
                .errorMessage(response.getStatusMessage())
                .build();
        }
        
        return PaymentResult.builder()
            .success(true)
            .paymentId(response.getPaymentID())
            .trxId(response.getTrxID())
            .amount(new BigDecimal(response.getAmount()))
            .currency(response.getCurrency())
            .status(mapBkashStatus(response.getTransactionStatus()))
            .transactionReference(response.getTrxID())
            .customerMsisdn(response.getCustomerMsisdn())
            .executedAt(parseBkashDate(response.getPaymentExecuteTime()))
            .build();
    }
    
    /**
     * Query payment status
     */
    public PaymentResult queryPayment(String paymentId) {
        BkashToken token = tokenManager.getToken();
        
        BkashQueryPaymentRequest payload = BkashQueryPaymentRequest.builder()
            .paymentID(paymentId)
            .build();
        
        BkashQueryPaymentResponse response = bkashWebClient.post()
            .uri("/tokenized/checkout/payment/status")
            .header("Authorization", token.getIdToken())
            .header("X-APP-Key", appKey)
            .bodyValue(payload)
            .retrieve()
            .bodyToMono(BkashQueryPaymentResponse.class)
            .block();
        
        // Map response to PaymentResult
        return mapQueryResponse(response);
    }
    
    private PaymentStatus mapBkashStatus(String bkashStatus) {
        return switch (bkashStatus) {
            case "Completed" -> PaymentStatus.COMPLETED;
            case "Pending" -> PaymentStatus.PENDING;
            case "Failed" -> PaymentStatus.FAILED;
            case "Cancelled" -> PaymentStatus.CANCELLED;
            default -> PaymentStatus.UNKNOWN;
        };
    }
}
```

### 3.5 Webhook Handler

```java
@RestController
@RequestMapping("/api/payments/bkash")
@Slf4j
public class BkashWebhookController {
    
    @Autowired
    private PaymentService paymentService;
    
    @Autowired
    private BkashPaymentClient bkashClient;
    
    @Autowired
    private SignatureValidator signatureValidator;
    
    /**
     * Handle bKash callback
     */
    @PostMapping("/callback")
    public ResponseEntity<Void> handleCallback(
            @RequestParam("paymentID") String paymentId,
            @RequestParam("status") String status,
            @RequestParam("apiVersion") String apiVersion,
            @RequestHeader("X-Bkash-Signature") String signature) {
        
        log.info("Received bKash callback for payment: {}, status: {}", paymentId, status);
        
        try {
            // Validate signature
            String payload = paymentId + status + apiVersion;
            if (!signatureValidator.validateBkashSignature(payload, signature)) {
                log.error("Invalid bKash signature for payment: {}", paymentId);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            // Query payment status for verification
            PaymentResult result = bkashClient.queryPayment(paymentId);
            
            // Process payment result
            paymentService.processPaymentCallback(result);
            
            return ResponseEntity.ok().build();
            
        } catch (Exception e) {
            log.error("Error processing bKash callback for payment: {}", paymentId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
```

---

## 4. Nagad Integration

### 4.1 Nagad Configuration

```yaml
payment:
  gateways:
    nagad:
      enabled: true
      mode: sandbox
      base-url: https://sandbox.mynagad.com/api/dfs
      # Credentials
      merchant-id: ${NAGAD_MERCHANT_ID}
      merchant-private-key: ${NAGAD_PRIVATE_KEY}
      nagad-public-key: ${NAGAD_PUBLIC_KEY}
      # Settings
      callback-url: https://ulms.bank.com/api/payments/nagad/callback
      timeout: 30000
```

### 4.2 Nagad Client Implementation

```java
@Component
public class NagadPaymentClient {
    
    @Autowired
    private WebClient nagadWebClient;
    
    @Autowired
    private NagadSignatureService signatureService;
    
    @Value("${payment.gateways.nagad.merchant-id}")
    private String merchantId;
    
    /**
     * Initialize Nagad payment
     */
    public PaymentIntent initializePayment(PaymentRequest request) {
        String orderId = generateOrderId();
        
        // Create sensitive data payload
        Map<String, Object> sensitiveData = new HashMap<>();
        sensitiveData.put("merchantId", merchantId);
        sensitiveData.put("orderId", orderId);
        sensitiveData.put("amount", request.getAmount().toString());
        sensitiveData.put("currency", "BDT");
        sensitiveData.put("challenge", signatureService.generateChallenge());
        
        String encryptedData = signatureService.encryptSensitiveData(sensitiveData);
        String signature = signatureService.signData(encryptedData);
        
        NagadInitializeRequest payload = NagadInitializeRequest.builder()
            .accountNumber(request.getBorrowerMobile())
            .dateTime(DateTimeFormatter.ISO_DATE_TIME.format(LocalDateTime.now()))
            .sensitiveData(encryptedData)
            .signature(signature)
            .build();
        
        NagadInitializeResponse response = nagadWebClient.post()
            .uri("/check-out/initialize/{merchant}/{order}", merchantId, orderId)
            .bodyValue(payload)
            .retrieve()
            .bodyToMono(NagadInitializeResponse.class)
            .block();
        
        return PaymentIntent.builder()
            .paymentId(orderId)
            .paymentUrl(response.getCallBackUrl())
            .amount(request.getAmount())
            .currency("BDT")
            .status(PaymentStatus.PENDING)
            .gateway(PaymentGateway.NAGAD)
            .build();
    }
    
    /**
     * Complete Nagad payment
     */
    public PaymentResult completePayment(String orderId, String paymentRefId) {
        Map<String, Object> sensitiveData = new HashMap<>();
        sensitiveData.put("merchantId", merchantId);
        sensitiveData.put("orderId", orderId);
        sensitiveData.put("paymentRefId", paymentRefId);
        sensitiveData.put("challenge", signatureService.generateChallenge());
        
        String encryptedData = signatureService.encryptSensitiveData(sensitiveData);
        String signature = signatureService.signData(encryptedData);
        
        NagadCompleteRequest payload = NagadCompleteRequest.builder()
            .paymentRefId(paymentRefId)
            .sensitiveData(encryptedData)
            .signature(signature)
            .build();
        
        NagadCompleteResponse response = nagadWebClient.post()
            .uri("/check-out/complete/{paymentRefId}", paymentRefId)
            .bodyValue(payload)
            .retrieve()
            .bodyToMono(NagadCompleteResponse.class)
            .block();
        
        return PaymentResult.builder()
            .success("Success".equals(response.getStatus()))
            .paymentId(orderId)
            .trxId(response.getIssuerPaymentRefNo())
            .amount(new BigDecimal(response.getAmount()))
            .status(mapNagadStatus(response.getStatus()))
            .build();
    }
}
```

---

## 5. Rocket/DBBL Integration

### 5.1 Rocket Configuration

```yaml
payment:
  gateways:
    rocket:
      enabled: true
      mode: sandbox
      base-url: https://sandbox.dutchbanglabank.com/rocket/api
      merchant-id: ${ROCKET_MERCHANT_ID}
      api-key: ${ROCKET_API_KEY}
      terminal-id: ${ROCKET_TERMINAL_ID}
      callback-url: https://ulms.bank.com/api/payments/rocket/callback
```

### 5.2 Rocket Client Implementation

```java
@Component
public class RocketPaymentClient {
    
    @Autowired
    private WebClient rocketWebClient;
    
    @Value("${payment.gateways.rocket.merchant-id}")
    private String merchantId;
    
    @Value("${payment.gateways.rocket.api-key}")
    private String apiKey;
    
    /**
     * Create Rocket payment
     */
    public PaymentIntent createPayment(PaymentRequest request) {
        String transactionId = generateTransactionId();
        
        RocketPaymentRequest payload = RocketPaymentRequest.builder()
            .merchantId(merchantId)
            .transactionId(transactionId)
            .amount(request.getAmount())
            .currency("BDT")
            .description("Loan payment - " + request.getLoanId())
            .customerMobile(request.getBorrowerMobile())
            .callbackUrl(callbackUrl)
            .build();
        
        // Add HMAC signature
        String signature = generateHmacSignature(payload, apiKey);
        
        RocketPaymentResponse response = rocketWebClient.post()
            .uri("/payment/create")
            .header("X-Merchant-ID", merchantId)
            .header("X-Signature", signature)
            .bodyValue(payload)
            .retrieve()
            .bodyToMono(RocketPaymentResponse.class)
            .block();
        
        return PaymentIntent.builder()
            .paymentId(transactionId)
            .paymentUrl(response.getPaymentUrl())
            .amount(request.getAmount())
            .status(PaymentStatus.PENDING)
            .gateway(PaymentGateway.ROCKET)
            .build();
    }
    
    private String generateHmacSignature(Object payload, String key) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(), "HmacSHA256");
            mac.init(secretKey);
            byte[] hash = mac.doFinal(new ObjectMapper().writeValueAsBytes(payload));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate signature", e);
        }
    }
}
```

---

## 6. Unified Payment Service

### 6.1 Payment Gateway Factory

```java
@Component
public class PaymentGatewayFactory {
    
    @Autowired
    private BkashPaymentClient bkashClient;
    
    @Autowired
    private NagadPaymentClient nagadClient;
    
    @Autowired
    private RocketPaymentClient rocketClient;
    
    /**
     * Get appropriate payment client
     */
    public PaymentGatewayClient getClient(PaymentGateway gateway) {
        return switch (gateway) {
            case BKASH -> bkashClient;
            case NAGAD -> nagadClient;
            case ROCKET -> rocketClient;
            default -> throw new UnsupportedPaymentGatewayException(gateway);
        };
    }
}

/**
 * Unified payment interface
 */
public interface PaymentGatewayClient {
    PaymentIntent createPayment(PaymentRequest request);
    PaymentResult queryPayment(String paymentId);
    PaymentResult executePayment(String paymentId);
}
```

### 6.2 Unified Payment Service

```java
@Service
@Slf4j
public class UnifiedPaymentService {
    
    @Autowired
    private PaymentGatewayFactory gatewayFactory;
    
    @Autowired
    private PaymentRepository paymentRepository;
    
    @Autowired
    private IdempotencyKeyService idempotencyService;
    
    /**
     * Initiate payment through selected gateway
     */
    @Transactional
    public PaymentIntent initiatePayment(PaymentRequest request) {
        // Check idempotency
        if (idempotencyService.exists(request.getIdempotencyKey())) {
            return idempotencyService.getPaymentIntent(request.getIdempotencyKey());
        }
        
        // Get appropriate gateway client
        PaymentGatewayClient client = gatewayFactory.getClient(request.getGateway());
        
        // Create payment
        PaymentIntent intent = client.createPayment(request);
        
        // Persist payment record
        PaymentRecord record = PaymentRecord.builder()
            .paymentId(intent.getPaymentId())
            .loanId(request.getLoanId())
            .amount(intent.getAmount())
            .currency(intent.getCurrency())
            .gateway(request.getGateway())
            .status(intent.getStatus())
            .merchantInvoiceNumber(intent.getMerchantInvoiceNumber())
            .createdAt(Instant.now())
            .build();
        
        paymentRepository.save(record);
        
        // Store for idempotency
        idempotencyService.store(request.getIdempotencyKey(), intent);
        
        return intent;
    }
    
    /**
     * Process payment callback from any gateway
     */
    @Transactional
    public void processPaymentCallback(PaymentResult result) {
        PaymentRecord record = paymentRepository.findByPaymentId(result.getPaymentId())
            .orElseThrow(() -> new PaymentNotFoundException(result.getPaymentId()));
        
        // Idempotency check
        if (record.getStatus() == PaymentStatus.COMPLETED) {
            log.info("Payment {} already processed, ignoring callback", result.getPaymentId());
            return;
        }
        
        // Update record
        record.setStatus(result.getStatus());
        record.setTransactionReference(result.getTrxId());
        record.setCustomerMsisdn(result.getCustomerMsisdn());
        record.setCompletedAt(result.getExecutedAt());
        record.setErrorCode(result.getErrorCode());
        record.setErrorMessage(result.getErrorMessage());
        
        paymentRepository.save(record);
        
        // Publish payment event
        if (result.isSuccess()) {
            eventPublisher.publishEvent(new PaymentCompletedEvent(result));
        } else {
            eventPublisher.publishEvent(new PaymentFailedEvent(result));
        }
    }
}
```

---

## 7. Webhook Handling

### 7.1 Unified Webhook Controller

```java
@RestController
@RequestMapping("/api/payments/webhooks")
@Slf4j
public class PaymentWebhookController {
    
    @Autowired
    private UnifiedPaymentService paymentService;
    
    @Autowired
    private WebhookSignatureValidator signatureValidator;
    
    /**
     * Generic webhook handler
     */
    @PostMapping("/{gateway}")
    public ResponseEntity<Void> handleWebhook(
            @PathVariable String gateway,
            @RequestBody String payload,
            @RequestHeader Map<String, String> headers) {
        
        log.info("Received webhook from {}: {}", gateway, payload);
        
        try {
            // Validate signature based on gateway
            boolean valid = switch (gateway.toLowerCase()) {
                case "bkash" -> signatureValidator.validateBkashWebhook(payload, headers);
                case "nagad" -> signatureValidator.validateNagadWebhook(payload, headers);
                case "rocket" -> signatureValidator.validateRocketWebhook(payload, headers);
                default -> throw new UnsupportedPaymentGatewayException(gateway);
            };
            
            if (!valid) {
                log.error("Invalid webhook signature from {}", gateway);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            // Parse and process webhook
            PaymentResult result = parseWebhookPayload(gateway, payload);
            paymentService.processPaymentCallback(result);
            
            return ResponseEntity.ok().build();
            
        } catch (Exception e) {
            log.error("Error processing {} webhook", gateway, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
```

---

## 8. Security Considerations

### 8.1 Security Checklist

```markdown
## Payment Gateway Security Checklist

### Authentication
- [ ] API keys stored in secure vault (HashiCorp Vault)
- [ ] Keys rotated every 90 days
- [ ] Different keys for sandbox and production
- [ ] IP whitelisting configured

### Data Protection
- [ ] Sensitive data encrypted at rest
- [ ] TLS 1.3 for all communications
- [ ] PII masked in logs
- [ ] Card/bank data never stored

### Webhook Security
- [ ] Signature validation mandatory
- [ ] Replay attack protection (nonce/timestamp)
- [ ] IP whitelist for callbacks
- [ ] HTTPS only for callbacks

### Transaction Integrity
- [ ] Idempotency keys for all requests
- [ ] Duplicate payment prevention
- [ ] Reconciliation process daily
- [ ] Audit trail for all transactions
```

### 8.2 Signature Validation

```java
@Component
public class WebhookSignatureValidator {
    
    @Value("${payment.gateways.bkash.app-secret}")
    private String bkashSecret;
    
    public boolean validateBkashWebhook(String payload, Map<String, String> headers) {
        String signature = headers.get("X-Bkash-Signature");
        if (signature == null) return false;
        
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(bkashSecret.getBytes(), "HmacSHA256");
            mac.init(secretKey);
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String expected = Base64.getEncoder().encodeToString(hash);
            
            return MessageDigest.isEqual(signature.getBytes(), expected.getBytes());
        } catch (Exception e) {
            log.error("Signature validation failed", e);
            return false;
        }
    }
}
```

---

## 9. Error Handling

### 9.1 Error Codes

| Code | Description | Action |
|------|-------------|--------|
| PMT-001 | Insufficient balance | Notify customer |
| PMT-002 | Payment timeout | Query status, retry if pending |
| PMT-003 | Invalid credentials | Check API keys |
| PMT-004 | Rate limit exceeded | Implement backoff |
| PMT-005 | Duplicate transaction | Return existing result |
| PMT-006 | Gateway unavailable | Queue for retry |

---

## 10. Testing Strategy

### 10.1 Test Scenarios

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| PMT-001 | Successful bKash payment | Status COMPLETED |
| PMT-002 | bKash insufficient balance | Status FAILED |
| PMT-003 | Nagad payment success | Status COMPLETED |
| PMT-004 | Rocket payment timeout | Retry then fail |
| PMT-005 | Duplicate callback | Idempotency check passes |
| PMT-006 | Invalid webhook signature | 401 Unauthorized |

---

## 11. Related Documents

| Document | Purpose |
|----------|---------|
| `[INT]_CBS_Integration_Patterns_Guide_v1.0.md` | CBS integration patterns |
| `[TEST]_Integration_Test_Plan_v1.0.md` | Testing approach |

---

**Document Owner:** Technical Lead, Unisoft Systems Limited  
**Next Review Date:** 2026-03-05  
**Classification:** Confidential

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | NID Service Error Handling Strategy |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Technical Lead |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# NID Service Error Handling Strategy

## Table of Contents

1. [Error Categories](#1-error-categories)
2. [Exception Hierarchy](#2-exception-hierarchy)
3. [Error Codes](#3-error-codes)
4. [Retry Strategy](#4-retry-strategy)
5. [Fallback Mechanisms](#5-fallback-mechanisms)
6. [Error Responses](#6-error-responses)

---

## 1. Error Categories

| Category | Examples | Retryable |
|----------|----------|-----------|
| Validation | Invalid NID format | No |
| Authentication | Invalid API key | No |
| Network | Timeout, Connection refused | Yes |
| Service | NIDW unavailable | Yes |
| Data | NID not found | No |

## 2. Exception Hierarchy

```java
public abstract class NidException extends RuntimeException {
    private final String errorCode;
    private final boolean retryable;
    
    public NidException(String code, String message, boolean retryable) {
        super(message);
        this.errorCode = code;
        this.retryable = retryable;
    }
}

public class NidValidationException extends NidException {
    public NidValidationException(String message) {
        super("NID-VAL-001", message, false);
    }
}

public class NidNotFoundException extends NidException {
    public NidNotFoundException(String nid) {
        super("NID-NF-001", "NID not found: " + nid, false);
    }
}

public class NidwConnectionException extends NidException {
    public NidwConnectionException(String message) {
        super("NID-CONN-001", message, true);
    }
}

public class NidwTimeoutException extends NidException {
    public NidwTimeoutException() {
        super("NID-TIME-001", "NIDW request timed out", true);
    }
}
```

## 3. Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| NID-VAL-001 | Invalid NID format | 400 |
| NID-VAL-002 | Invalid date of birth | 400 |
| NID-NF-001 | NID not found | 404 |
| NID-NF-002 | NID data expired | 410 |
| NID-AUTH-001 | Authentication failed | 401 |
| NID-AUTH-002 | Authorization failed | 403 |
| NID-CONN-001 | Connection error | 503 |
| NID-TIME-001 | Request timeout | 504 |
| NID-ENC-001 | Encryption error | 500 |
| NID-UNK-001 | Unknown error | 500 |

## 4. Retry Strategy

```java
@Configuration
public class NidRetryConfig {
    
    @Bean
    public RetryTemplate nidRetryTemplate() {
        RetryTemplate template = new RetryTemplate();
        
        // Retry only on specific exceptions
        Map<Class<? extends Throwable>, Boolean> retryable = new HashMap<>();
        retryable.put(NidwConnectionException.class, true);
        retryable.put(NidwTimeoutException.class, true);
        retryable.put(NidwServiceUnavailableException.class, true);
        
        SimpleRetryPolicy policy = new SimpleRetryPolicy(3, retryable);
        
        ExponentialBackOffPolicy backoff = new ExponentialBackOffPolicy();
        backoff.setInitialInterval(1000);
        backoff.setMultiplier(2.0);
        backoff.setMaxInterval(10000);
        
        template.setRetryPolicy(policy);
        template.setBackOffPolicy(backoff);
        
        return template;
    }
}
```

## 5. Fallback Mechanisms

```java
@Service
public class NidServiceWithFallback {
    
    private final NidwApiClient nidwClient;
    private final NidCacheRepository cacheRepository;
    
    @Retryable(
        retryFor = {NidwConnectionException.class, NidwTimeoutException.class},
        maxAttempts = 3,
        backoff = @Backoff(delay = 1000, multiplier = 2)
    )
    @CircuitBreaker(name = "nidw", fallbackMethod = "fallbackVerify")
    public NidVerificationResult verify(String nid, String dob) {
        return nidwClient.verify(nid, dob);
    }
    
    public NidVerificationResult fallbackVerify(String nid, String dob, 
            Exception ex) {
        // Try cache
        Optional<NidVerificationEntity> cached = cacheRepository
            .findByNidHash(hash(nid));
        
        if (cached.isPresent() && !isExpired(cached.get())) {
            return decryptAndMap(cached.get());
        }
        
        // Queue for later processing
        queueForRetry(nid, dob);
        
        throw new NidwUnavailableException(
            "NIDW temporarily unavailable. Please try again later.");
    }
}
```

## 6. Error Responses

```java
@Data
@Builder
public class NidErrorResponse {
    private String errorCode;
    private String message;
    private String details;
    private LocalDateTime timestamp;
    private String path;
    private boolean retryable;
}

@RestControllerAdvice
public class NidExceptionHandler {
    
    @ExceptionHandler(NidValidationException.class)
    public ResponseEntity<NidErrorResponse> handleValidation(NidValidationException ex) {
        return ResponseEntity.badRequest()
            .body(NidErrorResponse.builder()
                .errorCode(ex.getErrorCode())
                .message(ex.getMessage())
                .timestamp(LocalDateTime.now())
                .retryable(false)
                .build());
    }
    
    @ExceptionHandler(NidwConnectionException.class)
    public ResponseEntity<NidErrorResponse> handleConnection(NidwConnectionException ex) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(NidErrorResponse.builder()
                .errorCode(ex.getErrorCode())
                .message("NID verification service temporarily unavailable")
                .timestamp(LocalDateTime.now())
                .retryable(true)
                .build());
    }
}
```

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

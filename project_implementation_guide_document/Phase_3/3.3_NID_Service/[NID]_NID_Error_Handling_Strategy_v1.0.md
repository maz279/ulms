**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | NID Error Handling Strategy |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Unisoft Technical Team |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# NID Error Handling Strategy

## 1. Overview

This document defines the error handling strategy for NID verification, including retry policies, fallback mechanisms, and escalation procedures.

## 2. Error Categories

### 2.1 Error Classification

| Category | Examples | Severity |
|----------|----------|----------|
| Validation Errors | Invalid NID format, missing fields | Low |
| API Errors | NIDW timeout, rate limit | Medium |
| Data Errors | NID not found, name mismatch | Medium |
| System Errors | Database failure, network issue | High |
| Security Errors | Auth failure, invalid certificate | Critical |

## 3. Error Handling Matrix

| Error | Retry | Fallback | Alert |
|-------|-------|----------|-------|
| Invalid NID | No | Return error | No |
| NID not found | No | Return error | No |
| NIDW Timeout | 3x | Use stale cache | Yes |
| Rate Limited | 5x with backoff | Queue request | Yes |
| Auth Failure | No | Manual process | Immediate |
| Name mismatch | No | Manual review | No |

## 4. Implementation

### 4.1 Exception Hierarchy

```java
public abstract class NidException extends RuntimeException {
    private final String errorCode;
    private final boolean retryable;
    
    protected NidException(String code, String message, boolean retryable) {
        super(message);
        this.errorCode = code;
        this.retryable = retryable;
    }
}

public class NidValidationException extends NidException {
    public NidValidationException(String message) {
        super("NID-001", message, false);
    }
}

public class NidNotFoundException extends NidException {
    public NidNotFoundException(String nid) {
        super("NID-002", "NID not found: " + nid, false);
    }
}

public class NidwServiceException extends NidException {
    public NidwServiceException(String message) {
        super("NIDW-001", message, true);
    }
}

public class NidwRateLimitException extends NidException {
    private final int retryAfter;
    
    public NidwRateLimitException(int retryAfter) {
        super("NIDW-429", "Rate limit exceeded", true);
        this.retryAfter = retryAfter;
    }
}
```

### 4.2 Global Error Handler

```java
@RestControllerAdvice
@Slf4j
public class NidExceptionHandler {
    
    @ExceptionHandler(NidValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidation(NidValidationException ex) {
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse.builder()
                .code(ex.getErrorCode())
                .message(ex.getMessage())
                .timestamp(LocalDateTime.now())
                .build());
    }
    
    @ExceptionHandler(NidNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NidNotFoundException ex) {
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(ErrorResponse.builder()
                .code(ex.getErrorCode())
                .message(ex.getMessage())
                .timestamp(LocalDateTime.now())
                .build());
    }
    
    @ExceptionHandler(NidwServiceException.class)
    public ResponseEntity<ErrorResponse> handleServiceError(NidwServiceException ex) {
        log.error("NIDW service error: {}", ex.getMessage());
        
        // Send alert
        alertService.sendAlert("NIDW_SERVICE_ERROR", ex.getMessage());
        
        return ResponseEntity
            .status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(ErrorResponse.builder()
                .code(ex.getErrorCode())
                .message("NID verification service temporarily unavailable")
                .timestamp(LocalDateTime.now())
                .build());
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        log.error("Unexpected error in NID service", ex);
        
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ErrorResponse.builder()
                .code("NID-500")
                .message("An unexpected error occurred")
                .timestamp(LocalDateTime.now())
                .build());
    }
}
```

### 4.3 Retry Configuration

```java
@Configuration
public class NidRetryConfig {
    
    @Bean
    public RetryTemplate nidwRetryTemplate() {
        RetryTemplate template = new RetryTemplate();
        
        // Retry only on retryable exceptions
        SimpleRetryPolicy policy = new SimpleRetryPolicy(
            3,
            Map.of(
                NidwServiceException.class, true,
                NidwRateLimitException.class, true,
                NidValidationException.class, false,
                NidNotFoundException.class, false
            )
        );
        
        ExponentialBackOffPolicy backOff = new ExponentialBackOffPolicy();
        backOff.setInitialInterval(1000);
        backOff.setMultiplier(2);
        backOff.setMaxInterval(10000);
        
        template.setRetryPolicy(policy);
        template.setBackOffPolicy(backOff);
        
        return template;
    }
}
```

### 4.4 Circuit Breaker

```java
@Configuration
public class NidCircuitBreakerConfig {
    
    @Bean
    public Customizer<ReactiveResilience4JCircuitBreakerFactory> nidwCircuitBreaker() {
        return factory -> factory.configure(builder -> builder
            .circuitBreakerConfig(CircuitBreakerConfig.custom()
                .failureRateThreshold(50)
                .slowCallRateThreshold(80)
                .slowCallDurationThreshold(Duration.ofSeconds(5))
                .waitDurationInOpenState(Duration.ofSeconds(30))
                .permittedNumberOfCallsInHalfOpenState(5)
                .build())
            .timeLimiterConfig(TimeLimiterConfig.custom()
                .timeoutDuration(Duration.ofSeconds(10))
                .build()),
            "nidwService");
    }
}
```

## 5. Monitoring and Alerting

### 5.1 Error Metrics

```java
@Component
@RequiredArgsConstructor
public class NidErrorMetrics {
    
    private final MeterRegistry meterRegistry;
    
    public void recordError(String errorCode, String category) {
        Counter.builder("nid.errors")
            .tag("code", errorCode)
            .tag("category", category)
            .register(meterRegistry)
            .increment();
    }
    
    public void recordRetry(String operation, int attempt) {
        Counter.builder("nid.retries")
            .tag("operation", operation)
            .tag("attempt", String.valueOf(attempt))
            .register(meterRegistry)
            .increment();
    }
}
```

### 5.2 Alert Rules

```yaml
alerts:
  nid-service:
    - name: high-error-rate
      condition: rate(nid.errors[5m]) > 10
      severity: warning
      message: "High NID error rate detected"
    
    - name: nidw-down
      condition: nid.errors{code="NIDW-001"} > 5
      severity: critical
      message: "NIDW service appears down"
    
    - name: circuit-breaker-open
      condition: resilience4j_circuitbreaker_state{name="nidwService"} == 0
      severity: critical
      message: "NIDW circuit breaker is open"
```

---

## Appendices

### A.1 Error Response Format

```json
{
  "code": "NID-001",
  "message": "Invalid NID format",
  "timestamp": "2026-02-08T10:30:00",
  "requestId": "req-123456",
  "details": {
    "field": "nid",
    "input": "12345"
  }
}
```

### A.2 Escalation Matrix

| Error Type | L1 Response | L2 Escalation |
|------------|-------------|---------------|
| Validation | Auto-reject | - |
| NIDW Down | Use cache | 30 min to L2 |
| Auth Failure | Immediate | Immediate |
| Data Issues | Manual queue | 4 hours |

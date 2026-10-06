**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Microservices Communication Patterns |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Unisoft Technical Team |
| **Reviewed By** | Solution Architect |
| **Classification** | Confidential |
| **Status** | Draft |

---

# Microservices Communication Patterns

## 1. Communication Patterns Overview

| Pattern | Use Case | Implementation |
|---------|----------|----------------|
| REST API | Synchronous requests | WebClient, OpenFeign |
| gRPC | High-performance RPC | gRPC + Protobuf |
| Message Queue | Async events | Apache Kafka |
| Event Sourcing | Audit trails | Kafka + Event Store |
| Saga | Distributed transactions | Orchestration/Choreography |

## 2. Synchronous Communication

### 2.1 REST with WebClient

```java
@Service
@RequiredArgsConstructor
public class CibServiceClient {
    
    private final WebClient webClient;
    
    public Mono<CibReport> getCibReport(String nid) {
        return webClient.get()
            .uri("/api/v1/cib/inquiry/{nid}", nid)
            .retrieve()
            .onStatus(HttpStatus::is5xxServerError, 
                resp -> Mono.error(new CibServiceException()))
            .bodyToMono(CibReport.class)
            .timeout(Duration.ofSeconds(10))
            .retryWhen(Retry.backoff(3, Duration.ofMillis(100)));
    }
}
```

### 2.2 OpenFeign Client

```java
@FeignClient(
    name = "cib-service",
    url = "${ulms.cib.url}",
    fallback = CibServiceFallback.class
)
public interface CibServiceFeignClient {
    
    @PostMapping("/api/v1/cib/inquiry")
    CibReport inquireCib(@RequestBody CibInquiryRequest request);
}

@Component
@Slf4j
public class CibServiceFallback implements CibServiceFeignClient {
    
    @Override
    public CibReport inquireCib(CibInquiryRequest request) {
        log.warn("CIB service fallback triggered");
        return CibReport.empty();
    }
}
```

## 3. Circuit Breaker Pattern

```java
@Configuration
public class CircuitBreakerConfig {
    
    @Bean
    public Customizer<ReactiveResilience4JCircuitBreakerFactory> defaultCustomizer() {
        return factory -> factory.configureDefault(id -> new Resilience4JConfigBuilder(id)
            .circuitBreakerConfig(CircuitBreakerConfig.custom()
                .failureRateThreshold(50)
                .waitDurationInOpenState(Duration.ofSeconds(30))
                .permittedNumberOfCallsInHalfOpenState(5)
                .build())
            .timeLimiterConfig(TimeLimiterConfig.custom()
                .timeoutDuration(Duration.ofSeconds(5))
                .build())
            .build());
    }
}
```

## 4. Saga Pattern for Distributed Transactions

### 4.1 Loan Disbursement Saga

```java
@Component
@RequiredArgsConstructor
public class DisbursementSaga {
    
    private final CibService cibService;
    private final DocumentService documentService;
    private final LoanService loanService;
    private final AccountingService accountingService;
    
    @Transactional
    public DisbursementResult execute(DisbursementRequest request) {
        try {
            // Step 1: Pre-disbursement CIB check
            CibResult cibResult = cibService.preDisbursementCheck(request.getLoanId());
            if (!cibResult.isApproved()) {
                return DisbursementResult.failed("CIB check failed");
            }
            
            // Step 2: Verify documents
            DocumentStatus docStatus = documentService.verifyDocuments(request.getLoanId());
            if (!docStatus.isComplete()) {
                return DisbursementResult.failed("Documents incomplete");
            }
            
            // Step 3: Post to CBS (Core Banking)
            CbsPostingResult cbsResult = accountingService.postToCbs(request);
            if (!cbsResult.isSuccess()) {
                // Compensate
                documentService.rollbackVerification(request.getLoanId());
                return DisbursementResult.failed("CBS posting failed");
            }
            
            // Step 4: Update loan status
            loanService.markDisbursed(request.getLoanId());
            
            return DisbursementResult.success();
            
        } catch (Exception e) {
            // Compensate all steps
            compensate(request);
            throw e;
        }
    }
    
    private void compensate(DisbursementRequest request) {
        // Rollback actions
        accountingService.reverseCbsPosting(request.getLoanId());
        documentService.rollbackVerification(request.getLoanId());
    }
}
```

## 5. API Gateway

```yaml
# Kong Gateway Configuration
services:
  - name: loan-service
    url: http://loan-service:8080
    routes:
      - name: loan-routes
        paths:
          - /api/v1/loans
    plugins:
      - name: rate-limiting
        config:
          minute: 100
      - name: jwt
        config:
          uri_param_names: []
```

## 6. Service Discovery

```yaml
# Eureka Client Configuration
eureka:
  client:
    service-url:
      defaultZone: http://eureka:8761/eureka/
  instance:
    prefer-ip-address: true
    health-check-url-path: /actuator/health
```

---

## Appendices

### A.1 Communication Guidelines

| Scenario | Recommended Pattern |
|----------|---------------------|
| Simple query | REST API |
| High throughput | gRPC |
| Async processing | Kafka |
| Distributed transaction | Saga |
| Real-time updates | WebSocket |

### A.2 Timeout Configuration

| Service | Connection Timeout | Read Timeout |
|---------|-------------------|--------------|
| CIB Service | 5s | 10s |
| NID Service | 5s | 10s |
| CBS Integration | 10s | 30s |
| Document Service | 3s | 30s |

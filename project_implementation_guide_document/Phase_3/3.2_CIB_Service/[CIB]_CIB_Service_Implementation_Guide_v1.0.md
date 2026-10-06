**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | CIB Service Implementation Guide |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Unisoft Technical Team |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-08 | Unisoft Team | Initial version |

---

# CIB Service Implementation Guide

## 1. Prerequisites

### 1.1 Required Access
- Bangladesh Bank CIB Online portal credentials
- Client certificate for mutual TLS
- API Key and Client ID
- Whitelisted static IP address

### 1.2 Dependencies
```xml
<dependencies>
    <!-- WebClient -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-webflux</artifactId>
    </dependency>
    
    <!-- Resilience4j -->
    <dependency>
        <groupId>io.github.resilience4j</groupId>
        <artifactId>resilience4j-spring-boot3</artifactId>
        <version>2.1.0</version>
    </dependency>
    
    <!-- Validation -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    
    <!-- Redis Cache -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis-reactive</artifactId>
    </dependency>
</dependencies>
```

## 2. Project Structure

```
cib-service/
├── src/main/java/com/unisoft/ulms/cib/
│   ├── config/
│   │   ├── CibClientConfig.java
│   │   ├── CibCircuitBreakerConfig.java
│   │   └── CibSecurityConfig.java
│   ├── client/
│   │   ├── CibApiClient.java
│   │   ├── CibAuthClient.java
│   │   └── CibBatchClient.java
│   ├── service/
│   │   ├── CibService.java
│   │   ├── CibServiceImpl.java
│   │   ├── CibCacheService.java
│   │   └── CibDecisionEngine.java
│   ├── controller/
│   │   └── CibController.java
│   ├── dto/
│   │   ├── request/
│   │   └── response/
│   ├── model/
│   │   └── entity/
│   ├── repository/
│   ├── exception/
│   └── mapper/
├── src/main/resources/
│   ├── application-cib.yml
│   └── cib-client-cert.p12
└── src/test/
```

## 3. Configuration

### 3.1 Application Configuration

```yaml
# application-cib.yml
ulms:
  cib:
    # API Configuration
    base-url: https://cib.bb.org.bd/api/v1
    sandbox-url: https://sandbox-cib.bb.org.bd/api/v1
    
    # Authentication
    client-id: ${CIB_CLIENT_ID}
    api-key: ${CIB_API_KEY}
    
    # TLS/SSL
    keystore:
      path: classpath:cib-client-cert.p12
      password: ${CIB_KEYSTORE_PASSWORD}
      type: PKCS12
    
    # Connection Settings
    connection:
      timeout: 5000
      read-timeout: 10000
      max-connections: 50
      max-connections-per-route: 20
    
    # Cache Settings
    cache:
      enabled: true
      ttl-hours: 24
      max-size: 10000
    
    # Retry Settings
    retry:
      max-attempts: 3
      backoff-delay-ms: 1000
      backoff-multiplier: 2
    
    # Circuit Breaker
    circuit-breaker:
      failure-rate-threshold: 50
      slow-call-rate-threshold: 80
      wait-duration-open: 30s

# Spring Configuration
spring:
  redis:
    host: localhost
    port: 6379
    password: ${REDIS_PASSWORD}
    database: 0
    timeout: 2000ms
    lettuce:
      pool:
        max-active: 8
        max-idle: 8
        min-idle: 0
```

### 3.2 SSL Configuration

```java
@Configuration
public class CibSslConfig {
    
    @Value("${ulms.cib.keystore.path}")
    private String keystorePath;
    
    @Value("${ulms.cib.keystore.password}")
    private String keystorePassword;
    
    @Bean
    public SslContext cibSslContext() throws Exception {
        KeyStore keyStore = KeyStore.getInstance("PKCS12");
        
        try (InputStream is = new ClassPathResource(keystorePath).getInputStream()) {
            keyStore.load(is, keystorePassword.toCharArray());
        }
        
        KeyManagerFactory keyManagerFactory = 
            KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm());
        keyManagerFactory.init(keyStore, keystorePassword.toCharArray());
        
        return SslContextBuilder.forClient()
            .keyManager(keyManagerFactory)
            .trustManager(InsecureTrustManagerFactory.INSTANCE) // Use proper trust manager in production
            .build();
    }
}
```

## 4. Implementation

### 4.1 WebClient Configuration

```java
@Configuration
@RequiredArgsConstructor
public class CibClientConfig {
    
    private final CibSslConfig sslConfig;
    private final CibProperties cibProperties;
    
    @Bean
    public WebClient cibWebClient() throws Exception {
        HttpClient httpClient = HttpClient.create()
            .secure(spec -> spec.sslContext(sslConfig.cibSslContext()))
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 
                cibProperties.getConnection().getTimeout())
            .responseTimeout(Duration.ofMillis(
                cibProperties.getConnection().getReadTimeout()))
            .doOnConnected(conn -> conn
                .addHandlerLast(new ReadTimeoutHandler(10))
                .addHandlerLast(new WriteTimeoutHandler(10)));
        
        return WebClient.builder()
            .baseUrl(cibProperties.getBaseUrl())
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .defaultHeaders(headers -> {
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
            })
            .filter(logRequest())
            .filter(logResponse())
            .build();
    }
    
    private ExchangeFilterFunction logRequest() {
        return ExchangeFilterFunction.ofRequestProcessor(clientRequest -> {
            log.debug("CIB Request: {} {}", 
                clientRequest.method(), 
                clientRequest.url());
            return Mono.just(clientRequest);
        });
    }
}
```

### 4.2 Service Implementation

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class CibServiceImpl implements CibService {
    
    private final CibApiClient apiClient;
    private final CibCacheService cacheService;
    private final CibDecisionEngine decisionEngine;
    private final CibRequestRepository requestRepository;
    
    @Override
    @CircuitBreaker(name = "cibInquiry", fallbackMethod = "inquiryFallback")
    @Retry(name = "cibInquiry")
    @TimeLimiter(name = "cibInquiry")
    public Mono<CibIndividualReport> inquireIndividual(CibIndividualInquiryRequest request) {
        log.info("Processing CIB inquiry for NID: {}", maskNid(request.getNid()));
        
        // Check cache first
        return cacheService.getIndividualReport(request.getNid())
            .switchIfEmpty(Mono.defer(() -> {
                // Save request record
                CibRequest requestRecord = saveRequest(request);
                
                // Call CIB API
                return apiClient.inquireIndividual(request)
                    .doOnNext(response -> {
                        // Cache the response
                        cacheService.cacheIndividualReport(request.getNid(), response);
                        // Update request record
                        updateRequestSuccess(requestRecord, response);
                    })
                    .doOnError(error -> {
                        log.error("CIB inquiry failed for NID: {}", 
                            maskNid(request.getNid()), error);
                        updateRequestFailure(requestRecord, error);
                    });
            }));
    }
    
    @Override
    public Mono<LoanApplicationCibReport> inquireLoanApplication(Long loanApplicationId) {
        log.info("Processing CIB inquiry for loan application: {}", loanApplicationId);
        
        // Fetch loan application details
        return loanApplicationService.findById(loanApplicationId)
            .flatMap(application -> {
                // Create inquiry for primary borrower
                Mono<CibIndividualReport> primaryInquiry = inquireIndividual(
                    createBorrowerRequest(application.getBorrower()));
                
                // Create inquiries for co-borrowers
                List<Mono<CibIndividualReport>> coBorrowerInquiries = 
                    application.getCoBorrowers().stream()
                        .map(this::inquireIndividual)
                        .collect(Collectors.toList());
                
                // Create inquiries for guarantors
                List<Mono<CibIndividualReport>> guarantorInquiries = 
                    application.getGuarantors().stream()
                        .map(this::inquireIndividual)
                        .collect(Collectors.toList());
                
                // Combine all inquiries
                return Mono.zip(
                    primaryInquiry,
                    Mono.zip(coBorrowerInquiries, reports -> reports),
                    Mono.zip(guarantorInquiries, reports -> reports)
                ).map(tuple -> {
                    CibIndividualReport primary = tuple.getT1();
                    CibIndividualReport[] coBorrowers = tuple.getT2();
                    CibIndividualReport[] guarantors = tuple.getT3();
                    
                    // Evaluate overall decision
                    CibDecision decision = decisionEngine.evaluateComposite(
                        primary, Arrays.asList(coBorrowers), Arrays.asList(guarantors));
                    
                    return LoanApplicationCibReport.builder()
                        .loanApplicationId(loanApplicationId)
                        .primaryBorrowerReport(primary)
                        .coBorrowerReports(Arrays.asList(coBorrowers))
                        .guarantorReports(Arrays.asList(guarantors))
                        .overallDecision(decision)
                        .inquiryTime(LocalDateTime.now())
                        .build();
                });
            });
    }
    
    // Fallback method for circuit breaker
    private Mono<CibIndividualReport> inquiryFallback(CibIndividualInquiryRequest request, 
            Exception ex) {
        log.warn("CIB inquiry fallback triggered for NID: {}", maskNid(request.getNid()));
        
        // Return cached data if available (even if stale)
        return cacheService.getIndividualReportStale(request.getNid())
            .switchIfEmpty(Mono.error(new CibServiceUnavailableException(
                "CIB service unavailable and no cached data", ex)));
    }
    
    private String maskNid(String nid) {
        if (nid == null || nid.length() < 4) return "****";
        return nid.substring(0, 4) + "****" + nid.substring(nid.length() - 4);
    }
}
```

### 4.3 Cache Service Implementation

```java
@Service
@RequiredArgsConstructor
public class CibCacheService {
    
    private final ReactiveRedisTemplate<String, CibIndividualReport> redisTemplate;
    private final Duration cacheTtl = Duration.ofHours(24);
    
    private static final String INDIVIDUAL_REPORT_KEY_PREFIX = "cib:individual:";
    
    public Mono<CibIndividualReport> getIndividualReport(String nid) {
        String key = INDIVIDUAL_REPORT_KEY_PREFIX + nid;
        return redisTemplate.opsForValue()
            .get(key)
            .filter(report -> !isExpired(report));
    }
    
    public Mono<CibIndividualReport> getIndividualReportStale(String nid) {
        String key = INDIVIDUAL_REPORT_KEY_PREFIX + nid;
        return redisTemplate.opsForValue().get(key);
    }
    
    public Mono<Boolean> cacheIndividualReport(String nid, CibIndividualReport report) {
        String key = INDIVIDUAL_REPORT_KEY_PREFIX + nid;
        return redisTemplate.opsForValue()
            .set(key, report, cacheTtl);
    }
    
    public Mono<Long> invalidateReport(String nid) {
        String key = INDIVIDUAL_REPORT_KEY_PREFIX + nid;
        return redisTemplate.delete(key);
    }
    
    private boolean isExpired(CibIndividualReport report) {
        return report.getExpiresAt() != null && 
               report.getExpiresAt().isBefore(LocalDateTime.now());
    }
}
```

### 4.4 Controller Implementation

```java
@RestController
@RequestMapping("/api/v1/cib")
@RequiredArgsConstructor
@Tag(name = "CIB Service", description = "Bangladesh Bank CIB integration APIs")
public class CibController {
    
    private final CibService cibService;
    
    @PostMapping("/inquiry/individual")
    @Operation(summary = "Perform CIB inquiry for an individual")
    public Mono<ResponseEntity<CibIndividualReport>> inquireIndividual(
            @Valid @RequestBody CibIndividualInquiryRequest request) {
        
        return cibService.inquireIndividual(request)
            .map(ResponseEntity::ok)
            .onErrorResume(CibValidationException.class, ex -> 
                Mono.just(ResponseEntity.badRequest().build()))
            .onErrorResume(CibServiceUnavailableException.class, ex -> 
                Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build()));
    }
    
    @PostMapping("/inquiry/loan-application/{loanApplicationId}")
    @Operation(summary = "Perform CIB inquiry for loan application")
    public Mono<ResponseEntity<LoanApplicationCibReport>> inquireLoanApplication(
            @PathVariable Long loanApplicationId) {
        
        return cibService.inquireLoanApplication(loanApplicationId)
            .map(ResponseEntity::ok);
    }
    
    @GetMapping("/cache/invalidate/{nid}")
    @Operation(summary = "Invalidate cached CIB report")
    public Mono<ResponseEntity<Void>> invalidateCache(@PathVariable String nid) {
        return cibService.invalidateCache(nid)
            .then(Mono.just(ResponseEntity.ok().<Void>build()));
    }
}
```

## 5. Testing

### 5.1 Unit Test Example

```java
@ExtendWith(MockitoExtension.class)
class CibServiceImplTest {
    
    @Mock
    private CibApiClient apiClient;
    
    @Mock
    private CibCacheService cacheService;
    
    @InjectMocks
    private CibServiceImpl cibService;
    
    @Test
    void shouldReturnCachedReportWhenAvailable() {
        // Given
        String nid = "1234567890";
        CibIndividualInquiryRequest request = CibIndividualInquiryRequest.builder()
            .nid(nid)
            .name("Test User")
            .build();
        
        CibIndividualReport cachedReport = CibIndividualReport.builder()
            .nid(nid)
            .cibScore(750)
            .build();
        
        when(cacheService.getIndividualReport(nid))
            .thenReturn(Mono.just(cachedReport));
        
        // When
        CibIndividualReport result = cibService.inquireIndividual(request).block();
        
        // Then
        assertThat(result.getCibScore()).isEqualTo(750);
        verify(apiClient, never()).inquireIndividual(any());
    }
    
    @Test
    void shouldCallApiWhenCacheMiss() {
        // Given
        String nid = "1234567890";
        CibIndividualInquiryRequest request = createRequest(nid);
        CibIndividualReport apiResponse = createReport(nid, 650);
        
        when(cacheService.getIndividualReport(nid)).thenReturn(Mono.empty());
        when(apiClient.inquireIndividual(request)).thenReturn(Mono.just(apiResponse));
        when(cacheService.cacheIndividualReport(any(), any()))
            .thenReturn(Mono.just(true));
        
        // When
        CibIndividualReport result = cibService.inquireIndividual(request).block();
        
        // Then
        assertThat(result.getCibScore()).isEqualTo(650);
        verify(apiClient).inquireIndividual(request);
        verify(cacheService).cacheIndividualReport(nid, apiResponse);
    }
}
```

### 5.2 Integration Test

```java
@SpringBootTest
@Testcontainers
class CibServiceIntegrationTest {
    
    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
        .withExposedPorts(6379);
    
    @Autowired
    private CibService cibService;
    
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.redis.host", redis::getHost);
        registry.add("spring.redis.port", redis::getFirstMappedPort);
    }
    
    @Test
    void endToEndCibInquiry() {
        // This test requires CIB sandbox access
        CibIndividualInquiryRequest request = CibIndividualInquiryRequest.builder()
            .nid("1234567890")
            .name("Test Person")
            .dateOfBirth("1990-01-01")
            .inquiryPurpose(InquiryPurpose.LOAN_APPLICATION)
            .build();
        
        CibIndividualReport report = cibService.inquireIndividual(request).block();
        
        assertThat(report).isNotNull();
        assertThat(report.getNid()).isEqualTo("1234567890");
    }
}
```

## 6. Deployment

### 6.1 Docker Configuration

```dockerfile
FROM eclipse-temurin:21-jdk-alpine

WORKDIR /app

# Copy client certificate
COPY src/main/resources/cib-client-cert.p12 /app/certs/

COPY target/cib-service-*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", 
    "-Dspring.profiles.active=prod",
    "-jar", 
    "app.jar"]
```

### 6.2 Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cib-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: cib-service
  template:
    metadata:
      labels:
        app: cib-service
    spec:
      containers:
      - name: cib-service
        image: unisoft/cib-service:1.0.0
        ports:
        - containerPort: 8080
        env:
        - name: CIB_CLIENT_ID
          valueFrom:
            secretKeyRef:
              name: cib-credentials
              key: client-id
        - name: CIB_API_KEY
          valueFrom:
            secretKeyRef:
              name: cib-credentials
              key: api-key
        - name: CIB_KEYSTORE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: cib-credentials
              key: keystore-password
        volumeMounts:
        - name: cib-cert
          mountPath: /app/certs
          readOnly: true
      volumes:
      - name: cib-cert
        secret:
          secretName: cib-client-cert
```

---

## Appendices

### A.1 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| CIB_CLIENT_ID | Bangladesh Bank assigned client ID | Yes |
| CIB_API_KEY | API authentication key | Yes |
| CIB_KEYSTORE_PASSWORD | Client certificate password | Yes |
| REDIS_PASSWORD | Redis authentication password | No |

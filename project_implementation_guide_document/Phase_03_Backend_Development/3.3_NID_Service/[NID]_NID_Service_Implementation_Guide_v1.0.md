**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | NID/e-KYC Service Implementation Guide |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Technical Lead |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | Technical Lead | Initial version |

---

# NID/e-KYC Service Implementation Guide

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Project Setup](#2-project-setup)
3. [Configuration](#3-configuration)
4. [Implementation Steps](#4-implementation-steps)
5. [Database Schema](#5-database-schema)
6. [Integration with Fineract](#6-integration-with-fineract)
7. [Testing](#7-testing)
8. [Deployment](#8-deployment)

---

## 1. Prerequisites

- NIDW API access credentials
- SSL certificate for NIDW connection
- Encryption key store setup
- Redis for caching

## 2. Project Setup

### Maven Dependencies

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.security</groupId>
        <artifactId>spring-security-crypto</artifactId>
    </dependency>
</dependencies>
```

## 3. Configuration

```yaml
ulms:
  nid:
    enabled: true
    nidw:
      base-url: https://nidw.gov.bd/api/v1
      api-key: ${NIDW_API_KEY}
      partner-id: ${NIDW_PARTNER_ID}
      timeout: 10s
    encryption:
      key-store-path: ${NID_KEYSTORE_PATH}
      key-store-password: ${NID_KEYSTORE_PASSWORD}
      key-alias: nid-encryption-key
    cache:
      ttl: 24h
```

## 4. Implementation Steps

### Step 1: Configure WebClient

```java
@Configuration
public class NidwClientConfig {
    
    @Bean
    public WebClient nidwWebClient(NidProperties properties) {
        return WebClient.builder()
            .baseUrl(properties.getNidw().getBaseUrl())
            .defaultHeader("X-API-Key", properties.getNidw().getApiKey())
            .defaultHeader("X-Partner-Id", properties.getNidw().getPartnerId())
            .build();
    }
}
```

### Step 2: Implement Verification Service

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class NidVerificationService {
    
    private final NidwApiClient nidwClient;
    private final NidDataRepository repository;
    private final EncryptionService encryptionService;
    
    public NidVerificationResult verify(String nid, String dob) {
        // Check local cache first
        Optional<NidData> cached = repository.findByNidHash(hash(nid));
        if (cached.isPresent() && !isExpired(cached.get())) {
            return decryptAndMap(cached.get());
        }
        
        // Call NIDW
        NidwResponse response = nidwClient.verify(nid, dob);
        
        // Store encrypted result
        NidData data = NidData.builder()
            .nidHash(hash(nid))
            .encryptedData(encryptionService.encrypt(response.toJson()))
            .expiresAt(LocalDateTime.now().plusHours(24))
            .build();
        
        repository.save(data);
        
        return mapToResult(response);
    }
}
```

### Step 3: Create REST Controller

```java
@RestController
@RequestMapping("/api/v1/nid")
@RequiredArgsConstructor
public class NidController {
    
    private final NidVerificationService verificationService;
    
    @PostMapping("/verify")
    public ResponseEntity<NidVerificationResponse> verify(
            @Valid @RequestBody NidVerificationRequest request) {
        
        NidVerificationResult result = verificationService.verify(
            request.getNidNumber(), 
            request.getDateOfBirth()
        );
        
        return ResponseEntity.ok(NidVerificationResponse.from(result));
    }
}
```

## 5. Database Schema

```sql
CREATE TABLE ulms_nid_verifications (
    id BIGSERIAL PRIMARY KEY,
    nid_hash VARCHAR(64) UNIQUE NOT NULL,
    encrypted_data TEXT NOT NULL,
    verification_status VARCHAR(20) NOT NULL,
    verified_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_nid_hash ON ulms_nid_verifications(nid_hash);
```

## 6. Integration with Fineract

```java
@Component
@RequiredArgsConstructor
public class FineractNidIntegration {
    
    private final NidVerificationService nidService;
    
    @EventListener
    public void onClientCreate(ClientCreatedEvent event) {
        if (event.getClient().getNidNumber() != null) {
            NidVerificationResult result = nidService.verify(
                event.getClient().getNidNumber(),
                event.getClient().getDateOfBirth()
            );
            
            // Auto-fill client data
            if (result.isVerified()) {
                autoFillClientData(event.getClient(), result);
            }
        }
    }
    
    private void autoFillClientData(Client client, NidVerificationResult result) {
        client.setFirstname(result.getNameEn().split(" ")[0]);
        client.setLastname(result.getNameEn().substring(result.getNameEn().indexOf(" ") + 1));
        client.setDateOfBirth(result.getDateOfBirth());
        // ... map other fields
    }
}
```

## 7. Testing

```java
@SpringBootTest
class NidServiceIntegrationTest {
    
    @Test
    void verifyNid_Success() {
        NidVerificationResult result = nidService.verify(
            "1234567890", 
            "1990-01-01"
        );
        
        assertThat(result.isVerified()).isTrue();
        assertThat(result.getNameEn()).isNotNull();
    }
}
```

## 8. Deployment

```dockerfile
FROM eclipse-temurin:21-jre-alpine
COPY target/ulms-nid-service.jar app.jar
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

---

## Related Documents

| Document | Description |
|----------|-------------|
| [NID]_NID_Service_Technical_Specification_v1.0.md | Technical specification |
| [NID]_NID_Verification_Flow_v1.0.md | Verification flow |

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

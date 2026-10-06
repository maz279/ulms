**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | NID Service Implementation Guide |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Unisoft Technical Team |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# NID Service Implementation Guide

## 1. Project Setup

### 1.1 Dependencies

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-webflux</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis-reactive</artifactId>
    </dependency>
    <dependency>
        <groupId>io.netty</groupId>
        <artifactId>netty-tcnative-boringssl-static</artifactId>
    </dependency>
</dependencies>
```

### 1.2 Configuration

```yaml
ulms:
  nid:
    nidw:
      base-url: https://nidw.gov.bd/api
      client-id: ${NIDW_CLIENT_ID}
      client-secret: ${NIDW_SECRET}
      keystore-path: /certs/nidw-client.p12
      keystore-password: ${KEYSTORE_PASSWORD}
    cache:
      ttl-days: 30
      max-size: 50000
```

## 2. Implementation

### 2.1 NIDW Client

```java
@Service
@RequiredArgsConstructor
public class NidwClient {
    
    private final WebClient webClient;
    private final NidProperties properties;
    
    public Mono<NidwResponse> verifyNid(String nid, String dob) {
        return webClient.post()
            .uri("/verify")
            .header("X-Client-ID", properties.getClientId())
            .header("X-Request-ID", generateRequestId())
            .bodyValue(Map.of(
                "nid", nid,
                "dateOfBirth", dob
            ))
            .retrieve()
            .bodyToMono(NidwResponse.class)
            .timeout(Duration.ofSeconds(10));
    }
}
```

### 2.2 Verification Service

```java
@Service
@RequiredArgsConstructor
public class NidServiceImpl implements NidService {
    
    private final NidwClient nidwClient;
    private final NidCacheService cacheService;
    private final NidRepository repository;
    
    @Override
    public Mono<NidVerificationResult> verifyNid(NidVerificationRequest request) {
        String cacheKey = request.getNid();
        
        return cacheService.get(cacheKey)
            .switchIfEmpty(Mono.defer(() -> 
                fetchAndCache(request)))
            .map(response -> validateAndMap(request, response));
    }
    
    private Mono<NidwResponse> fetchAndCache(NidVerificationRequest request) {
        return nidwClient.verifyNid(request.getNid(), request.getDateOfBirth())
            .flatMap(response -> cacheService.put(request.getNid(), response)
                .thenReturn(response));
    }
    
    private NidVerificationResult validateAndMap(NidVerificationRequest request, 
            NidwResponse response) {
        boolean nameMatch = fuzzyMatch(request.getName(), response.getName());
        boolean dobMatch = request.getDateOfBirth().equals(response.getDateOfBirth());
        
        return NidVerificationResult.builder()
            .verified(nameMatch && dobMatch)
            .nid(response.getNid())
            .name(response.getName())
            .fatherName(response.getFatherName())
            .motherName(response.getMotherName())
            .dateOfBirth(response.getDateOfBirth())
            .presentAddress(mapAddress(response.getPresentAddress()))
            .permanentAddress(mapAddress(response.getPermanentAddress()))
            .photoBase64(response.getPhoto())
            .verifiedAt(LocalDateTime.now())
            .build();
    }
    
    private boolean fuzzyMatch(String input, String nidName) {
        // Implementation using Levenshtein distance
        double similarity = calculateSimilarity(
            normalize(input), 
            normalize(nidName)
        );
        return similarity >= 0.85; // 85% match threshold
    }
}
```

## 3. Fuzzy Matching Algorithm

```java
@Component
public class NameMatcher {
    
    public double calculateSimilarity(String s1, String s2) {
        String normalized1 = normalize(s1);
        String normalized2 = normalize(s2);
        
        int distance = levenshteinDistance(normalized1, normalized2);
        int maxLength = Math.max(normalized1.length(), normalized2.length());
        
        return 1.0 - ((double) distance / maxLength);
    }
    
    private String normalize(String input) {
        return input.toUpperCase()
            .replaceAll("[^A-Z]", "")
            .replaceAll("MOHAMMAD|MOHAMED|MUHAMMAD", "MD")
            .replaceAll("MOHAMMOD", "MD")
            .trim();
    }
    
    private int levenshteinDistance(String s1, String s2) {
        // Standard Levenshtein implementation
        int[][] dp = new int[s1.length() + 1][s2.length() + 1];
        
        for (int i = 0; i <= s1.length(); i++) dp[i][0] = i;
        for (int j = 0; j <= s2.length(); j++) dp[0][j] = j;
        
        for (int i = 1; i <= s1.length(); i++) {
            for (int j = 1; j <= s2.length(); j++) {
                int cost = (s1.charAt(i - 1) == s2.charAt(j - 1)) ? 0 : 1;
                dp[i][j] = Math.min(Math.min(
                    dp[i - 1][j] + 1,
                    dp[i][j - 1] + 1),
                    dp[i - 1][j - 1] + cost);
            }
        }
        
        return dp[s1.length()][s2.length()];
    }
}
```

## 4. Database Schema

```sql
CREATE TABLE nid_verifications (
    id BIGSERIAL PRIMARY KEY,
    nid VARCHAR(17) NOT NULL,
    name VARCHAR(100),
    father_name VARCHAR(100),
    mother_name VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(10),
    present_address JSONB,
    permanent_address JSONB,
    photo_hash VARCHAR(64),
    verified BOOLEAN DEFAULT FALSE,
    verification_reference VARCHAR(50),
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_nid UNIQUE (nid)
);

CREATE INDEX idx_nid_verifications_nid ON nid_verifications(nid);
CREATE INDEX idx_nid_verifications_verified ON nid_verifications(verified, verified_at);
```

---

## Appendices

### A.1 Name Variations to Handle

| Pattern | Variations |
|---------|------------|
| MD/Mohammad | MOHAMMAD, MOHAMED, MUHAMMAD, MUHAMMED, MOHAMMOD |
| Hossain | HOSSAIN, HOSSEN, HOSEN |
| Islam | ISLAM, ISLAMUL |

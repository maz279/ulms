**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | NID e-KYC Integration Guide |
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

# NID e-KYC Integration Guide

## Table of Contents

1. [Introduction](#1-introduction)
2. [NIDW System Overview](#2-nidw-system-overview)
3. [Technical Architecture](#3-technical-architecture)
4. [API Integration](#4-api-integration)
5. [Biometric Verification](#5-biometric-verification)
6. [Response Handling](#6-response-handling)
7. [Security and Compliance](#7-security-and-compliance)
8. [Error Handling](#8-error-handling)
9. [Code Examples](#9-code-examples)
10. [Testing Strategy](#10-testing-strategy)
11. [Related Documents](#11-related-documents)

---

## 1. Introduction

### 1.1 Purpose

This document provides comprehensive technical guidance for integrating ULMS v2.0 with the National ID Wing (NIDW) e-KYC system for Bangladesh. It covers NID verification, biometric matching, photo verification, and data protection requirements.

### 1.2 Scope

- NID online verification
- Biometric verification (fingerprint, face)
- Photo matching and validation
- Demographic data retrieval
- Error handling and retry mechanisms

### 1.3 Prerequisites

| Requirement | Description |
|-------------|-------------|
| NIDW Registration | Approved e-KYC service provider status |
| API Credentials | Client ID, Client Secret, API Key |
| IP Whitelisting | Production IPs registered with NIDW |
| Certificate | NIDW issued certificate for secure communication |
| Compliance | BFIU e-KYC Guidelines adherence |

---

## 2. NIDW System Overview

### 2.1 NIDW Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NIDW e-KYC INTEGRATION ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    ┌─────────────────┐                                                      │
│    │   ULMS v2.0     │                                                      │
│    │   Application   │                                                      │
│    └────────┬────────┘                                                      │
│             │                                                                │
│    ┌────────▼────────┐     OAuth 2.0           ┌─────────────────────┐     │
│    │   NID Service   │════════════════════════▶│  National ID Wing   │     │
│    │  (Spring Boot)  │    + API Key            │  (NIDW) API         │     │
│    └────────┬────────┘                         │  (nidw.gov.bd)      │     │
│             │                                   └─────────────────────┘     │
│    ┌────────▼────────┐                                                      │
│    │  Token Manager  │                                                      │
│    │  (OAuth Client) │                                                      │
│    └─────────────────┘                                                      │
│                                                                              │
│    Components:                                                               │
│    • Token Store: Secure storage for access tokens                           │
│    • Rate Limiter: NIDW API rate limiting (100 req/min)                      │
│    • Cache: Redis for verification results (24 hours)                        │
│    • Audit: All verifications logged per BFIU guidelines                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Verification Flows

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NID VERIFICATION FLOWS                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FLOW 1: Basic NID Verification                                              │
│  ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐                          │
│  │  NID   │──▶│  DOB   │──▶│  NIDW  │──▶│ Identity│                         │
│  │Number  │   │Verify  │   │ Verify │   │  Info   │                         │
│  └────────┘   └────────┘   └────────┘   └────────┘                          │
│                                                                              │
│  FLOW 2: Biometric Verification                                              │
│  ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐             │
│  │  NID   │──▶│ Finger │──▶│ Capture│──▶│  NIDW  │──▶│ Match  │             │
│  │Number  │   │ Select │   │ Device │   │ Verify │   │ Result │             │
│  └────────┘   └────────┘   └────────┘   └────────┘   └────────┘             │
│                                                                              │
│  FLOW 3: Photo Verification                                                  │
│  ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐             │
│  │  NID   │──▶│ Live   │──▶│ Face   │──▶│  NIDW  │──▶│ Match  │             │
│  │Number  │   │ Photo  │   │ Detect │   │ Compare│   │ Score  │             │
│  └────────┘   └────────┘   └────────┘   └────────┘   └────────┘             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Technical Architecture

### 3.1 Service Components

```java
/**
 * NIDW Service Architecture
 */
@Service
public class NIDVerificationService {
    
    private final NIDWClient nidwClient;
    private final NIDTokenManager tokenManager;
    private final NIDVerificationCache cache;
    private final NIDAuditLogger auditLogger;
    private final BiometricService biometricService;
    
    /**
     * Perform NID verification with caching
     */
    public NIDVerificationResult verify(NIDVerificationRequest request) {
        // Check cache
        String cacheKey = generateCacheKey(request);
        Optional<NIDVerificationResult> cached = cache.get(cacheKey);
        if (cached.isPresent() && isCacheValid(cached.get())) {
            auditLogger.logCacheHit(request);
            return cached.get();
        }
        
        // Get access token
        String accessToken = tokenManager.getValidToken();
        
        // Perform verification
        NIDVerificationResult result = nidwClient.verify(request, accessToken);
        
        // Cache and audit
        cache.put(cacheKey, result);
        auditLogger.logVerification(request, result);
        
        return result;
    }
}
```

### 3.2 Configuration

```yaml
# application-nidw.yml
integration:
  nidw:
    # API Configuration
    base-url: https://nidw.gov.bd/api/v2
    auth-url: https://nidw.gov.bd/oauth/token
    
    # Credentials (from Vault)
    client-id: ${NIDW_CLIENT_ID}
    client-secret: ${NIDW_CLIENT_SECRET}
    api-key: ${NIDW_API_KEY}
    
    # OAuth Configuration
    oauth:
      grant-type: client_credentials
      scope: ekyc_verify
      token-ttl: 3600  # seconds
      
    # Rate Limiting
    rate-limit:
      requests-per-minute: 100
      burst-capacity: 10
      
    # Connection Settings
    connect-timeout: 5000
    read-timeout: 15000
    
    # Cache Configuration
    cache:
      enabled: true
      ttl-hours: 24
      
    # Biometric Settings
    biometric:
      fingerprint-quality-threshold: 60
      face-match-threshold: 80
      liveness-check: true
```

---

## 4. API Integration

### 4.1 OAuth 2.0 Token Management

```java
@Component
public class NIDTokenManager {
    
    private final WebClient webClient;
    private final RedisTemplate<String, String> redisTemplate;
    
    @Value("${integration.nidw.client-id}")
    private String clientId;
    
    @Value("${integration.nidw.client-secret}")
    private String clientSecret;
    
    private static final String TOKEN_KEY = "nidw:access_token";
    
    /**
     * Get valid access token (refresh if needed)
     */
    public synchronized String getValidToken() {
        String cachedToken = redisTemplate.opsForValue().get(TOKEN_KEY);
        
        if (cachedToken != null && !isTokenExpired(cachedToken)) {
            return cachedToken;
        }
        
        return refreshToken();
    }
    
    /**
     * Refresh OAuth token
     */
    private String refreshToken() {
        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("grant_type", "client_credentials");
        formData.add("client_id", clientId);
        formData.add("client_secret", clientSecret);
        formData.add("scope", "ekyc_verify");
        
        NIDWTokenResponse response = webClient.post()
            .uri("/oauth/token")
            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .bodyValue(formData)
            .retrieve()
            .onStatus(HttpStatusCode::isError, this::handleAuthError)
            .bodyToMono(NIDWTokenResponse.class)
            .block();
        
        if (response == null || response.getAccessToken() == null) {
            throw new NIDWAuthenticationException("Failed to obtain access token");
        }
        
        // Cache token with 5-minute buffer
        long ttl = response.getExpiresIn() - 300;
        redisTemplate.opsForValue().set(TOKEN_KEY, response.getAccessToken(), ttl, TimeUnit.SECONDS);
        
        return response.getAccessToken();
    }
}

@Data
public class NIDWTokenResponse {
    @JsonProperty("access_token")
    private String accessToken;
    
    @JsonProperty("token_type")
    private String tokenType;
    
    @JsonProperty("expires_in")
    private long expiresIn;
}
```

### 4.2 NID Verification Client

```java
@Component
public class NIDWClient {
    
    private final WebClient webClient;
    private final RateLimiter rateLimiter;
    
    @Value("${integration.nidw.api-key}")
    private String apiKey;
    
    /**
     * Basic NID verification
     */
    public NIDVerificationResult verify(NIDVerificationRequest request, String accessToken) {
        // Apply rate limiting
        if (!rateLimiter.tryAcquire()) {
            throw new NIDWRateLimitException("Rate limit exceeded for NIDW API");
        }
        
        NIDWVerifyPayload payload = NIDWVerifyPayload.builder()
            .nidNumber(request.getNid())
            .dateOfBirth(request.getDateOfBirth().format(DateTimeFormatter.ISO_DATE))
            .build();
        
        return webClient.post()
            .uri("/verify/basic")
            .header("Authorization", "Bearer " + accessToken)
            .header("X-API-Key", apiKey)
            .header("X-Request-ID", generateRequestId())
            .bodyValue(payload)
            .retrieve()
            .onStatus(HttpStatusCode::is4xxClientError, this::handleClientError)
            .onStatus(HttpStatusCode::is5xxServerError, this::handleServerError)
            .bodyToMono(NIDWResponse.class)
            .map(this::mapToVerificationResult)
            .block();
    }
    
    /**
     * Biometric verification with fingerprint
     */
    public BiometricVerificationResult verifyFingerprint(
            String nid, byte[] fingerprintData, String fingerPosition, String accessToken) {
        
        MultiValueMap<String, Object> parts = new LinkedMultiValueMap<>();
        parts.add("nid", nid);
        parts.add("finger_position", fingerPosition);
        parts.add("fingerprint", new ByteArrayResource(fingerprintData) {
            @Override
            public String getFilename() {
                return "fingerprint.wsq";
            }
        });
        
        return webClient.post()
            .uri("/verify/fingerprint")
            .header("Authorization", "Bearer " + accessToken)
            .header("X-API-Key", apiKey)
            .contentType(MediaType.MULTIPART_FORM_DATA)
            .bodyValue(parts)
            .retrieve()
            .bodyToMono(NIDWBiometricResponse.class)
            .map(this::mapToBiometricResult)
            .block();
    }
    
    /**
     * Face verification
     */
    public FaceVerificationResult verifyFace(
            String nid, byte[] faceImage, String accessToken) {
        
        MultiValueMap<String, Object> parts = new LinkedMultiValueMap<>();
        parts.add("nid", nid);
        parts.add("face_image", new ByteArrayResource(faceImage) {
            @Override
            public String getFilename() {
                return "face.jpg";
            }
        });
        parts.add("liveness_check", "true");
        
        return webClient.post()
            .uri("/verify/face")
            .header("Authorization", "Bearer " + accessToken)
            .header("X-API-Key", apiKey)
            .contentType(MediaType.MULTIPART_FORM_DATA)
            .bodyValue(parts)
            .retrieve()
            .bodyToMono(NIDWFaceResponse.class)
            .map(this::mapToFaceResult)
            .block();
    }
}
```

---

## 5. Biometric Verification

### 5.1 Fingerprint Verification

```java
@Service
public class FingerprintVerificationService {
    
    private final NIDWClient nidwClient;
    private final FingerprintDeviceManager deviceManager;
    private final NIDTokenManager tokenManager;
    
    @Value("${integration.nidw.biometric.fingerprint-quality-threshold}")
    private int qualityThreshold;
    
    /**
     * Capture and verify fingerprint
     */
    public FingerprintVerificationResult captureAndVerify(String nid, String fingerPosition) {
        // Initialize device
        FingerprintDevice device = deviceManager.getDevice();
        
        try {
            // Capture fingerprint
            FingerprintCapture capture = device.capture(qualityThreshold);
            
            if (capture.getQualityScore() < qualityThreshold) {
                return FingerprintVerificationResult.builder()
                    .success(false)
                    .message("Fingerprint quality too low: " + capture.getQualityScore())
                    .build();
            }
            
            // Verify with NIDW
            String token = tokenManager.getValidToken();
            BiometricVerificationResult result = nidwClient.verifyFingerprint(
                nid, capture.getData(), fingerPosition, token);
            
            return FingerprintVerificationResult.builder()
                .success(result.isMatch())
                .matchScore(result.getScore())
                .message(result.isMatch() ? "Verified" : "No match")
                .build();
                
        } finally {
            deviceManager.release(device);
        }
    }
}
```

### 5.2 Face Verification

```java
@Service
public class FaceVerificationService {
    
    private final NIDWClient nidwClient;
    private final CameraService cameraService;
    private final FaceDetectionService faceDetectionService;
    private final NIDTokenManager tokenManager;
    
    @Value("${integration.nidw.biometric.face-match-threshold}")
    private int matchThreshold;
    
    @Value("${integration.nidw.biometric.liveness-check}")
    private boolean livenessCheck;
    
    /**
     * Capture and verify face
     */
    public FaceVerificationResult captureAndVerify(String nid) {
        // Capture image
        byte[] image = cameraService.captureImage();
        
        // Detect face
        FaceDetectionResult detection = faceDetectionService.detect(image);
        if (!detection.isFaceDetected()) {
            return FaceVerificationResult.builder()
                .success(false)
                .message("No face detected in image")
                .build();
        }
        
        // Liveness check
        if (livenessCheck) {
            LivenessResult liveness = faceDetectionService.checkLiveness(image);
            if (!liveness.isLive()) {
                return FaceVerificationResult.builder()
                    .success(false)
                    .message("Liveness check failed: " + liveness.getMessage())
                    .build();
            }
        }
        
        // Verify with NIDW
        String token = tokenManager.getValidToken();
        FaceVerificationResult result = nidwClient.verifyFace(nid, image, token);
        
        return FaceVerificationResult.builder()
            .success(result.getMatchScore() >= matchThreshold)
            .matchScore(result.getMatchScore())
            .livenessPassed(livenessCheck)
            .message(result.getMatchScore() >= matchThreshold ? "Verified" : "No match")
            .build();
    }
}
```

---

## 6. Response Handling

### 6.1 Response Models

```java
/**
 * NID Verification Result
 */
@Data
@Builder
public class NIDVerificationResult {
    private boolean verified;
    private String nid;
    private String verificationId;
    
    // Demographic data
    private String nameBn;
    private String nameEn;
    private String fatherName;
    private String motherName;
    private LocalDate dateOfBirth;
    private String gender;
    
    // Address
    private String permanentAddress;
    private String presentAddress;
    
    // Photo
    private byte[] photo;
    
    // Verification metadata
    private VerificationStatus status;
    private String message;
    private LocalDateTime timestamp;
    private String verificationMethod;
    
    public enum VerificationStatus {
        VERIFIED,
        NOT_VERIFIED,
        DECEASED,
        SUSPENDED,
        ERROR
    }
}

/**
 * Biometric Verification Result
 */
@Data
@Builder
public class BiometricVerificationResult {
    private boolean match;
    private int score;
    private String fingerPosition;
    private String message;
}

/**
 * Face Verification Result
 */
@Data
@Builder
public class FaceVerificationResult {
    private boolean success;
    private int matchScore;
    private boolean livenessPassed;
    private String message;
}
```

### 6.2 Response Mapping

```java
@Component
public class NIDResponseMapper {
    
    public NIDVerificationResult mapToVerificationResult(NIDWResponse response) {
        return NIDVerificationResult.builder()
            .verified("VERIFIED".equals(response.getStatus()))
            .nid(response.getNid())
            .verificationId(response.getVerificationId())
            .nameBn(response.getNameBn())
            .nameEn(response.getNameEn())
            .fatherName(response.getFatherName())
            .motherName(response.getMotherName())
            .dateOfBirth(parseDate(response.getDateOfBirth()))
            .gender(response.getGender())
            .permanentAddress(response.getPermanentAddress())
            .presentAddress(response.getPresentAddress())
            .photo(Base64.getDecoder().decode(response.getPhotoBase64()))
            .status(mapStatus(response.getStatus()))
            .message(response.getMessage())
            .timestamp(LocalDateTime.now())
            .verificationMethod("BASIC")
            .build();
    }
    
    private NIDVerificationResult.VerificationStatus mapStatus(String status) {
        return switch (status) {
            case "VERIFIED" -> NIDVerificationResult.VerificationStatus.VERIFIED;
            case "NOT_VERIFIED" -> NIDVerificationResult.VerificationStatus.NOT_VERIFIED;
            case "DECEASED" -> NIDVerificationResult.VerificationStatus.DECEASED;
            case "SUSPENDED" -> NIDVerificationResult.VerificationStatus.SUSPENDED;
            default -> NIDVerificationResult.VerificationStatus.ERROR;
        };
    }
}
```

---

## 7. Security and Compliance

### 7.1 Data Protection

```java
@Component
public class NIDDataProtectionService {
    
    @Autowired
    private EncryptionService encryptionService;
    
    /**
     * Encrypt sensitive NID data at rest
     */
    public String encryptNID(String nid) {
        return encryptionService.encrypt(nid, "NID_ENCRYPTION_KEY");
    }
    
    /**
     * Mask NID in logs
     */
    public String maskNID(String nid) {
        if (nid == null || nid.length() < 4) return "****";
        return "*".repeat(nid.length() - 4) + nid.substring(nid.length() - 4);
    }
    
    /**
     * Securely store verification result
     */
    public void storeSecurely(NIDVerificationResult result) {
        // Encrypt PII fields
        String encryptedName = encryptionService.encrypt(result.getNameEn());
        String encryptedAddress = encryptionService.encrypt(result.getPermanentAddress());
        
        // Store with audit trail
        // ...
    }
}
```

### 7.2 BFIU Compliance

```markdown
## BFIU e-KYC Compliance Checklist

### Customer Due Diligence
- [ ] NID verified against NIDW database
- [ ] Photograph matched with NID photo
- [ ] Address verified
- [ ] Risk profile assessed

### Record Keeping
- [ ] Verification ID recorded
- [ ] Timestamp captured
- [ ] User/branch identified
- [ ] Purpose documented

### Data Retention
- [ ] NID data retained per policy
- [ ] Biometric data not stored
- [ ] Audit logs maintained for 7 years
- [ ] Secure disposal procedures

### Reporting
- [ ] Suspicious transactions flagged
- [ ] Large cash transactions reported
- [ ] STRs filed within 7 days
```

---

## 8. Error Handling

### 8.1 NIDW Error Codes

| Error Code | Description | Action |
|------------|-------------|--------|
| NID-001 | Invalid NID format | Validate NID format (10-17 digits) |
| NID-002 | NID not found | Check with customer, verify DOB |
| NID-003 | DOB mismatch | Request correct DOB |
| NID-004 | Deceased person | Flag account, initiate verification |
| NID-005 | Service unavailable | Retry with backoff |
| NID-006 | Rate limit exceeded | Implement client-side throttling |
| NID-007 | Invalid credentials | Check API key and token |
| NID-008 | Biometric mismatch | Retry with different finger/photo |

### 8.2 Exception Handling

```java
public class NIDWExceptionHandler {
    
    public NIDVerificationResult handleException(Exception e, NIDVerificationRequest request) {
        if (e instanceof WebClientResponseException.BadRequest) {
            return NIDVerificationResult.builder()
                .verified(false)
                .status(NIDVerificationResult.VerificationStatus.ERROR)
                .message("Invalid request: Please check NID and DOB")
                .build();
        }
        
        if (e instanceof WebClientResponseException.NotFound) {
            return NIDVerificationResult.builder()
                .verified(false)
                .status(NIDVerificationResult.VerificationStatus.NOT_VERIFIED)
                .message("NID not found in NIDW database")
                .build();
        }
        
        if (e instanceof WebClientResponseException.TooManyRequests) {
            // Queue for retry
            retryQueue.enqueue(request);
            return NIDVerificationResult.builder()
                .verified(false)
                .status(NIDVerificationResult.VerificationStatus.ERROR)
                .message("Service busy: Verification queued for retry")
                .build();
        }
        
        // Log and return error
        log.error("Unexpected error during NID verification", e);
        return NIDVerificationResult.builder()
            .verified(false)
            .status(NIDVerificationResult.VerificationStatus.ERROR)
            .message("Verification failed: Please try again later")
            .build();
    }
}
```

---

## 9. Code Examples

### 9.1 Complete Verification Flow

```java
@Service
@Slf4j
public class CompleteVerificationService {
    
    @Autowired
    private NIDVerificationService nidService;
    
    @Autowired
    private FaceVerificationService faceService;
    
    @Autowired
    private FingerprintVerificationService fingerprintService;
    
    /**
     * Complete e-KYC verification flow
     */
    public EKYCResult performCompleteEKYC(EKYCRequest request) {
        log.info("Starting e-KYC for NID: {}", maskNID(request.getNid()));
        
        try {
            // Step 1: Basic NID verification
            NIDVerificationResult nidResult = nidService.verify(
                NIDVerificationRequest.builder()
                    .nid(request.getNid())
                    .dateOfBirth(request.getDateOfBirth())
                    .build());
            
            if (!nidResult.isVerified()) {
                return EKYCResult.builder()
                    .success(false)
                    .stage("NID_VERIFICATION")
                    .message(nidResult.getMessage())
                    .build();
            }
            
            // Step 2: Face verification (if enabled)
            if (request.isFaceVerificationRequired()) {
                FaceVerificationResult faceResult = faceService.captureAndVerify(request.getNid());
                
                if (!faceResult.isSuccess()) {
                    return EKYCResult.builder()
                        .success(false)
                        .stage("FACE_VERIFICATION")
                        .message(faceResult.getMessage())
                        .build();
                }
            }
            
            // Step 3: Fingerprint verification (if enabled)
            if (request.isFingerprintVerificationRequired()) {
                FingerprintVerificationResult fpResult = fingerprintService
                    .captureAndVerify(request.getNid(), request.getFingerPosition());
                
                if (!fpResult.isSuccess()) {
                    return EKYCResult.builder()
                        .success(false)
                        .stage("FINGERPRINT_VERIFICATION")
                        .message(fpResult.getMessage())
                        .build();
                }
            }
            
            // Success - return full result
            return EKYCResult.builder()
                .success(true)
                .nid(nidResult.getNid())
                .name(nidResult.getNameEn())
                .fatherName(nidResult.getFatherName())
                .motherName(nidResult.getMotherName())
                .dateOfBirth(nidResult.getDateOfBirth())
                .address(nidResult.getPermanentAddress())
                .photo(nidResult.getPhoto())
                .verificationId(nidResult.getVerificationId())
                .timestamp(LocalDateTime.now())
                .build();
                
        } catch (Exception e) {
            log.error("e-KYC failed for NID: {}", maskNID(request.getNid()), e);
            return EKYCResult.builder()
                .success(false)
                .stage("UNKNOWN")
                .message("System error: Please try again")
                .build();
        }
    }
}
```

---

## 10. Testing Strategy

### 10.1 Test Cases

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| NID-001 | Valid NID and DOB | Returns verified with demographics |
| NID-002 | Invalid NID format | Returns validation error |
| NID-003 | NID not found | Returns NOT_VERIFIED status |
| NID-004 | DOB mismatch | Returns mismatch error |
| NID-005 | Deceased person | Returns DECEASED status |
| NID-006 | Face match success | Returns high match score |
| NID-007 | Face mismatch | Returns low match score |
| NID-008 | Fingerprint match | Returns verified |
| NID-009 | Rate limit hit | Returns 429, queues request |
| NID-010 | Service timeout | Retries and returns result |

---

## 11. Related Documents

| Document | Purpose |
|----------|---------|
| `[INT]_CIB_Online_API_Integration_Guide_v1.0.md` | CIB integration details |
| `[TEST]_Integration_Test_Plan_v1.0.md` | Integration testing approach |

---

**Document Owner:** Technical Lead, Unisoft Systems Limited  
**Next Review Date:** 2026-03-05  
**Classification:** Confidential

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

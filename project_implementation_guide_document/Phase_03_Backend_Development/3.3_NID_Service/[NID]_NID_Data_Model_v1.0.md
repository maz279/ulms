**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | NID Service Data Model - Encrypted Storage |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Technical Lead |
| **Reviewed By** | Solution Architect |
| **Classification** | Confidential |
| **Status** | Draft |

---

# NID Service Data Model - Encrypted Storage

## Table of Contents

1. [Entity Relationship Diagram](#1-entity-relationship-diagram)
2. [Core Entities](#2-core-entities)
3. [Encryption Strategy](#3-encryption-strategy)
4. [Database Schema](#4-database-schema)
5. [Data Retention](#5-data-retention)

---

## 1. Entity Relationship Diagram

```
┌──────────────────────────────┐
│ ulms_nid_verifications       │
├──────────────────────────────┤
│ PK id                        │
│ UK nid_hash                  │
│ encrypted_data               │
│ verification_status          │
│ verified_at                  │
│ expires_at                   │
└──────────────────────────────┘
           │
           │ 1:N
           ▼
┌──────────────────────────────┐
│ ulms_nid_verification_logs   │
├──────────────────────────────┤
│ PK id                        │
│ FK verification_id           │
│ operation_type               │
│ performed_by                 │
│ performed_at                 │
└──────────────────────────────┘
```

## 2. Core Entities

### 2.1 NID Verification Entity

```java
@Entity
@Table(name = "ulms_nid_verifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NidVerificationEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "nid_hash", nullable = false, unique = true, length = 64)
    private String nidHash;
    
    @Column(name = "encrypted_data", nullable = false, columnDefinition = "TEXT")
    private String encryptedData;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false)
    private VerificationStatus status;
    
    @Column(name = "verified_at", nullable = false)
    private LocalDateTime verifiedAt;
    
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

public enum VerificationStatus {
    VERIFIED,
    PENDING,
    EXPIRED,
    REVOKED
}
```

### 2.2 Audit Log Entity

```java
@Entity
@Table(name = "ulms_nid_verification_logs")
@Data
@Builder
public class NidVerificationLogEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verification_id")
    private NidVerificationEntity verification;
    
    @Column(name = "operation_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private NidOperationType operationType;
    
    @Column(name = "performed_by", nullable = false)
    private String performedBy;
    
    @Column(name = "performed_at", nullable = false)
    private LocalDateTime performedAt;
    
    @Column(name = "ip_address")
    private String ipAddress;
    
    @Column(name = "user_agent")
    private String userAgent;
}

public enum NidOperationType {
    VERIFY,
    REFRESH,
    VIEW,
    DELETE
}
```

## 3. Encryption Strategy

### 3.1 Encryption Service

```java
@Service
public class NidEncryptionService {
    
    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 16;
    
    @Value("${ulms.nid.encryption.key}")
    private String encryptionKey;
    
    public String encrypt(String plaintext) {
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            SecureRandom.getInstanceStrong().nextBytes(iv);
            
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
            cipher.init(Cipher.ENCRYPT_MODE, getKey(), spec);
            
            byte[] encrypted = cipher.doFinal(plaintext.getBytes(UTF_8));
            
            ByteBuffer buffer = ByteBuffer.allocate(iv.length + encrypted.length);
            buffer.put(iv);
            buffer.put(encrypted);
            
            return Base64.getEncoder().encodeToString(buffer.array());
        } catch (Exception e) {
            throw new EncryptionException("Encryption failed", e);
        }
    }
    
    public String decrypt(String ciphertext) {
        try {
            byte[] decoded = Base64.getDecoder().decode(ciphertext);
            ByteBuffer buffer = ByteBuffer.wrap(decoded);
            
            byte[] iv = new byte[GCM_IV_LENGTH];
            buffer.get(iv);
            byte[] encrypted = new byte[buffer.remaining()];
            buffer.get(encrypted);
            
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
            cipher.init(Cipher.DECRYPT_MODE, getKey(), spec);
            
            return new String(cipher.doFinal(encrypted), UTF_8);
        } catch (Exception e) {
            throw new EncryptionException("Decryption failed", e);
        }
    }
    
    private SecretKey getKey() {
        byte[] keyBytes = Base64.getDecoder().decode(encryptionKey);
        return new SecretKeySpec(keyBytes, "AES");
    }
}
```

### 3.2 Hashing for Lookup

```java
@Component
public class NidHashingService {
    
    public String hash(String nidNumber) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(nidNumber.getBytes(UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new HashingException("Failed to hash NID", e);
        }
    }
}
```

## 4. Database Schema

```sql
-- NID Verification Table
CREATE TABLE ulms_nid_verifications (
    id BIGSERIAL PRIMARY KEY,
    nid_hash VARCHAR(64) NOT NULL UNIQUE,
    encrypted_data TEXT NOT NULL,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    verified_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_nid_hash ON ulms_nid_verifications(nid_hash);
CREATE INDEX idx_nid_status ON ulms_nid_verifications(verification_status);
CREATE INDEX idx_nid_expires ON ulms_nid_verifications(expires_at);

-- NID Verification Logs
CREATE TABLE ulms_nid_verification_logs (
    id BIGSERIAL PRIMARY KEY,
    verification_id BIGINT REFERENCES ulms_nid_verifications(id),
    operation_type VARCHAR(20) NOT NULL,
    performed_by VARCHAR(100) NOT NULL,
    performed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_nid_logs_verification ON ulms_nid_verification_logs(verification_id);
CREATE INDEX idx_nid_logs_performed ON ulms_nid_verification_logs(performed_at);
```

## 5. Data Retention

| Data Type | Retention Period | Action |
|-----------|-----------------|--------|
| Verified NID Data | 7 years | Archive then delete |
| Failed Verifications | 90 days | Auto-delete |
| Audit Logs | 7 years | Archive |
| Expired Cache | 24 hours | Auto-delete |

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

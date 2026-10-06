# Data Encryption Strategy
## Unisoft Loan Management System (ULMS) v2.0
### AES-256 Encryption & Field-Level Data Protection

---

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ARCH-1.4.3 |
| **Document Title** | Data Encryption Strategy |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 5, 2026 |
| **Prepared By** | Lead Developer, Security Architect |
| **Reviewed By** | Architecture Review Board, Security Team |
| **Classification** | Confidential - Internal Use |
| **Status** | Approved for Implementation |

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | February 5, 2026 | Lead Developer | Initial Data Encryption Strategy Document |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Encryption Architecture Overview](#2-encryption-architecture-overview)
3. [Data Classification](#3-data-classification)
4. [Encryption at Rest](#4-encryption-at-rest)
5. [Encryption in Transit](#5-encryption-in-transit)
6. [Field-Level Encryption](#6-field-level-encryption)
7. [Key Management](#7-key-management)
8. [Encryption Implementation](#8-encryption-implementation)
9. [Database Encryption Functions](#9-database-encryption-functions)
10. [Application-Level Encryption](#10-application-level-encryption)
11. [Backup Encryption](#11-backup-encryption)
12. [Compliance Mapping](#12-compliance-mapping)
13. [Monitoring & Audit](#13-monitoring--audit)
14. [Appendices](#14-appendices)

---

## 1. Executive Summary

### 1.1 Purpose

This document defines the comprehensive data encryption strategy for ULMS v2.0, ensuring protection of sensitive financial and personal data in compliance with Bangladesh Bank ICT Security Guidelines V4.0 and international standards (NIST, ISO 27001).

### 1.2 Encryption Standards Summary

| Data State | Algorithm | Key Size | Standard |
|------------|-----------|----------|----------|
| **At Rest (Database)** | AES-256-TDE | 256-bit | FIPS 197 |
| **At Rest (Files)** | AES-256-GCM | 256-bit | NIST SP 800-38D |
| **At Rest (Backups)** | AES-256-CBC | 256-bit | FIPS 197 |
| **In Transit (External)** | TLS 1.3 | 256-bit | RFC 8446 |
| **In Transit (Internal)** | mTLS/TLS 1.3 | 256-bit | RFC 8446 |
| **Field-Level** | AES-256-CBC | 256-bit | FIPS 197 |
| **Hashing** | SHA-256/SHA-384 | 256/384-bit | FIPS 180-4 |

### 1.3 Regulatory Compliance

This encryption strategy complies with:

- **Bangladesh Bank ICT Security Guidelines V4.0** (Section 5.1-5.3)
- **BFIU Circular No. 25** - e-KYC data protection
- **BRPD Circular 15/2024** - Financial data security
- **Payment and Settlement Systems Act, 2024**
- **ISO/IEC 27001:2022** - Information Security
- **PCI DSS v4.0** - Payment card data (if applicable)

---

## 2. Encryption Architecture Overview

### 2.1 Multi-Layer Encryption Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ULMS DATA ENCRYPTION ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ LAYER 1: TRANSPORT ENCRYPTION (Data in Transit)                        │ │
│  │ ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │ │
│  │ │   TLS 1.3        │  │   mTLS           │  │   VPN (IPSec)        │  │ │
│  │ │   (External)     │  │   (Service-Svc)  │  │   (Bangladesh Bank)  │  │ │
│  │ │   ECDHE-AES256   │  │   X.509 Certs    │  │   AES-256-GCM        │  │ │
│  │ └──────────────────┘  └──────────────────┘  └──────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ LAYER 2: APPLICATION ENCRYPTION (Field-Level)                          │ │
│  │ ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │ │
│  │ │   NID Numbers    │  │   Account Nos    │  │   Phone Numbers      │  │ │
│  │ │   AES-256-CBC    │  │   AES-256-CBC    │  │   AES-256-CBC        │  │ │
│  │ │   Vault Keys     │  │   Vault Keys     │  │   Vault Keys         │  │ │
│  │ └──────────────────┘  └──────────────────┘  └──────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ LAYER 3: STORAGE ENCRYPTION (Data at Rest)                             │ │
│  │ ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │ │
│  │ │   PostgreSQL     │  │   MinIO          │  │   Redis              │  │ │
│  │ │   AES-256-TDE    │  │   AES-256-GCM    │  │   AES-256-CBC        │  │ │
│  │ │   (Volume Enc)   │  │   (Server-Side)  │  │   (At-Rest Enc)      │  │ │
│  │ └──────────────────┘  └──────────────────┘  └──────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ LAYER 4: BACKUP ENCRYPTION                                             │ │
│  │ ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │ │
│  │ │   pgBackRest     │  │   Offsite Copy   │  │   Archive Storage    │  │ │
│  │ │   AES-256-CBC    │  │   AES-256-GCM    │  │   AES-256-CBC        │  │ │
│  │ │   Vault Keys     │  │   HSM Keys       │  │   7-Year Retention   │  │ │
│  │ └──────────────────┘  └──────────────────┘  └──────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ KEY MANAGEMENT (HashiCorp Vault + HSM)                                 │ │
│  │ ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │ │
│  │ │   Transit Engine │  │   KV Engine      │  │   PKI Engine         │  │ │
│  │ │   (Encrypt/Dec)  │  │   (Key Storage)  │  │   (Certificates)     │  │ │
│  │ │   Key Rotation   │  │   Versioning     │  │   Auto-Renewal       │  │ │
│  │ └──────────────────┘  └──────────────────┘  └──────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Encryption Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      DATA ENCRYPTION FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   CLIENT                    APPLICATION                    DATABASE          │
│   ┌─────┐                   ┌─────────┐                   ┌─────────┐       │
│   │     │                   │         │                   │         │       │
│   │ User│  1. HTTPS/TLS 1.3 │ Spring  │  5. TDE Auto-Enc │PostgreSQL       │
│   │ Data│ ─────────────────▶│  Boot   │ ─────────────────▶│   TDE   │       │
│   │     │                   │         │                   │         │       │
│   └─────┘                   └────┬────┘                   └─────────┘       │
│                                  │                                           │
│                    2. Validate   │                                           │
│                       Input      │                                           │
│                                  ▼                                           │
│                            ┌───────────┐                                    │
│                            │  Identify │                                    │
│                            │ Sensitive │                                    │
│                            │   Fields  │                                    │
│                            └─────┬─────┘                                    │
│                                  │                                           │
│                    3. Field-Level│                                           │
│                       Encryption │                                           │
│                                  ▼                                           │
│                            ┌───────────┐      ┌───────────┐                 │
│                            │   Vault   │◀────▶│Encryption │                 │
│                            │  Transit  │      │   Key     │                 │
│                            │   Engine  │      │           │                 │
│                            └─────┬─────┘      └───────────┘                 │
│                                  │                                           │
│                    4. Encrypted  │                                           │
│                       Data       │                                           │
│                                  ▼                                           │
│                            ┌───────────┐                                    │
│                            │ Encrypted │                                    │
│                            │  Payload  │                                    │
│                            │ + Key ID  │                                    │
│                            └───────────┘                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Classification

### 3.1 Data Sensitivity Levels

| Level | Classification | Description | Encryption Required |
|-------|---------------|-------------|---------------------|
| **L1** | Public | Marketing materials, public reports | No |
| **L2** | Internal | Internal documents, policies | At rest (optional) |
| **L3** | Confidential | Customer data, loan details | At rest + Field-level |
| **L4** | Restricted | NID, financial data, credentials | All layers |
| **L5** | Highly Restricted | Encryption keys, audit logs | HSM + Multi-layer |

### 3.2 Sensitive Data Inventory

| Data Element | Entity/Table | Classification | Encryption Type |
|--------------|--------------|----------------|-----------------|
| **NID Number** | customers | L4 - Restricted | AES-256-CBC (Field) |
| **Date of Birth** | customers | L3 - Confidential | AES-256-CBC (Field) |
| **Phone Number** | customers | L3 - Confidential | AES-256-CBC (Field) |
| **Email Address** | customers | L3 - Confidential | AES-256-CBC (Field) |
| **Bank Account No** | loan_disbursements | L4 - Restricted | AES-256-CBC (Field) |
| **Card Number** | payment_cards | L4 - Restricted | AES-256-CBC (Field) |
| **Salary Amount** | customer_income | L3 - Confidential | TDE only |
| **Loan Amount** | loan_applications | L3 - Confidential | TDE only |
| **CIB Report Data** | cib_reports | L4 - Restricted | AES-256-CBC (Field) |
| **Document Files** | document_storage | L3 - Confidential | AES-256-GCM (MinIO) |
| **API Keys** | vault_secrets | L5 - Highly Restricted | Vault KV + HSM |
| **Encryption Keys** | vault_transit | L5 - Highly Restricted | HSM |

### 3.3 Data Masking for Logs and Display

| Data Type | Masking Rule | Example |
|-----------|--------------|---------|
| **NID** | Show last 4 digits | `***********1234` |
| **Phone** | Show last 4 digits | `+880*****5678` |
| **Email** | Show first char + domain | `m***@bank.com.bd` |
| **Account** | Show last 4 digits | `*********4567` |
| **Card** | Show last 4 digits | `****-****-****-1234` |

---

## 4. Encryption at Rest

### 4.1 PostgreSQL Transparent Data Encryption (TDE)

**Configuration:**

```yaml
# PostgreSQL TDE Configuration (PostgreSQL 16 + pgcrypto)
postgresql:
  version: 16
  encryption:
    enabled: true
    algorithm: AES-256
    mode: TDE
    key_management: hashicorp_vault

  # Data directory encryption (LUKS)
  data_encryption:
    type: LUKS2
    cipher: aes-xts-plain64
    key_size: 512  # 256 for AES + 256 for XTS
    hash: sha512

  # Tablespace encryption
  tablespaces:
    - name: ulms_encrypted
      location: /var/lib/postgresql/data/encrypted
      encryption: true

  # SSL/TLS for connections
  ssl:
    enabled: true
    cert_file: /etc/ssl/certs/postgres.crt
    key_file: /etc/ssl/private/postgres.key
    ca_file: /etc/ssl/certs/ca.crt
    min_protocol_version: TLSv1.3
```

**PostgreSQL Configuration (postgresql.conf):**

```conf
# Encryption Settings
ssl = on
ssl_cert_file = '/etc/ssl/certs/postgres.crt'
ssl_key_file = '/etc/ssl/private/postgres.key'
ssl_ca_file = '/etc/ssl/certs/ca.crt'
ssl_min_protocol_version = 'TLSv1.3'
ssl_ciphers = 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256'

# pgcrypto extension
shared_preload_libraries = 'pgcrypto'

# Connection encryption required
hostssl all all 0.0.0.0/0 scram-sha-256
```

### 4.2 MinIO Object Storage Encryption

**Server-Side Encryption Configuration:**

```yaml
# MinIO SSE Configuration
minio:
  server_side_encryption:
    enabled: true
    type: SSE-S3  # Server-side encryption with S3-managed keys
    algorithm: AES-256-GCM

  # Key Management Service (KMS)
  kms:
    type: vault
    endpoint: https://vault.ulms.internal:8200
    key_name: minio-encryption-key
    tls:
      ca_cert: /etc/ssl/certs/vault-ca.crt

  # Bucket-level encryption policy
  bucket_encryption:
    default_algorithm: AES256
    apply_to_all: true
```

**MinIO Bucket Policy:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EnforceEncryption",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::ulms-documents/*",
      "Condition": {
        "StringNotEquals": {
          "s3:x-amz-server-side-encryption": "AES256"
        }
      }
    }
  ]
}
```

### 4.3 Redis Encryption

**Redis At-Rest Encryption:**

```yaml
# Redis Configuration with TLS and At-Rest Encryption
redis:
  version: 7.2
  tls:
    enabled: true
    cert_file: /etc/redis/certs/redis.crt
    key_file: /etc/redis/certs/redis.key
    ca_file: /etc/redis/certs/ca.crt
    protocols: TLSv1.3
    ciphers: TLS_AES_256_GCM_SHA384

  # At-rest encryption (Redis Enterprise or encrypted volume)
  persistence:
    enabled: true
    aof:
      enabled: true
      appendfsync: everysec
    rdb:
      enabled: true
      compression: true

  # Encrypted volume mount (Kubernetes)
  volume:
    encrypted: true
    encryption_key: vault:secret/data/redis/encryption-key
```

---

## 5. Encryption in Transit

### 5.1 TLS 1.3 Configuration

**Kong API Gateway TLS:**

```yaml
# TLS 1.3 Configuration
tls:
  version: 1.3
  cipher_suites:
    - TLS_AES_256_GCM_SHA384
    - TLS_CHACHA20_POLY1305_SHA256
    - TLS_AES_128_GCM_SHA256

  # Fallback to TLS 1.2 for legacy clients
  min_version: 1.2
  tls12_cipher_suites:
    - ECDHE-ECDSA-AES256-GCM-SHA384
    - ECDHE-RSA-AES256-GCM-SHA384
    - ECDHE-ECDSA-CHACHA20-POLY1305
    - ECDHE-RSA-CHACHA20-POLY1305

  # Certificate configuration
  certificate:
    cert_file: /etc/kong/certs/api.ulms.unisoft.com.bd.crt
    key_file: /etc/kong/certs/api.ulms.unisoft.com.bd.key
    ca_file: /etc/kong/certs/ca-chain.crt

  # HSTS configuration
  hsts:
    enabled: true
    max_age: 31536000
    include_subdomains: true
    preload: true

  # OCSP Stapling
  ocsp_stapling: true
```

### 5.2 Service-to-Service mTLS

```yaml
# Istio/Linkerd mTLS Configuration
mtls:
  mode: STRICT
  certificate_rotation:
    enabled: true
    rotation_interval: 24h

  # Service mesh configuration
  service_mesh:
    provider: istio
    version: 1.20

  # Peer authentication
  peer_authentication:
    mode: STRICT
    port_level_mtls:
      - port: 8080
        mode: STRICT
```

### 5.3 Database Connection Encryption

**Spring Boot JDBC with SSL:**

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:postgresql://postgres.ulms.internal:5432/ulms?ssl=true&sslmode=verify-full&sslrootcert=/etc/ssl/certs/postgres-ca.crt
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    hikari:
      connection-timeout: 20000
      maximum-pool-size: 20
      data-source-properties:
        ssl: true
        sslmode: verify-full
        sslrootcert: /etc/ssl/certs/postgres-ca.crt
        sslcert: /etc/ssl/certs/client.crt
        sslkey: /etc/ssl/private/client.key
```

---

## 6. Field-Level Encryption

### 6.1 Sensitive Fields Requiring Encryption

| Field | Table | Encryption Algorithm | Key Source | Key Rotation |
|-------|-------|---------------------|------------|--------------|
| `nid_number` | customers | AES-256-CBC | Vault Transit | 90 days |
| `date_of_birth` | customers | AES-256-CBC | Vault Transit | 90 days |
| `phone_number` | customers | AES-256-CBC | Vault Transit | 90 days |
| `email` | customers | AES-256-CBC | Vault Transit | 90 days |
| `bank_account_number` | loan_disbursements | AES-256-CBC | Vault Transit | 90 days |
| `card_number` | payment_cards | AES-256-CBC | Vault Transit | 90 days |
| `cib_response_data` | cib_reports | AES-256-CBC | Vault Transit | 90 days |

### 6.2 Encryption Format

**Encrypted Field Structure:**

```
Format: base64(IV):base64(ciphertext):keyVersion

Example:
Original: 1234567890123456 (NID)
Encrypted: dGVzdGl2MTIzNDU2:YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXo=:v3

Components:
- IV (16 bytes): dGVzdGl2MTIzNDU2 (base64)
- Ciphertext: YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXo= (base64)
- Key Version: v3 (for key rotation support)
```

### 6.3 JPA Entity with Encryption

```java
@Entity
@Table(name = "customers")
@EntityListeners(AuditingEntityListener.class)
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_number", unique = true, nullable = false)
    private String customerNumber;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    // Encrypted fields using custom JPA converter
    @Column(name = "nid_number_encrypted", nullable = false)
    @Convert(converter = EncryptedStringConverter.class)
    @FieldEncryption(keyName = "ulms-nid-key", algorithm = "AES-256-CBC")
    private String nidNumber;

    @Column(name = "date_of_birth_encrypted")
    @Convert(converter = EncryptedDateConverter.class)
    @FieldEncryption(keyName = "ulms-personal-key", algorithm = "AES-256-CBC")
    private LocalDate dateOfBirth;

    @Column(name = "phone_number_encrypted")
    @Convert(converter = EncryptedStringConverter.class)
    @FieldEncryption(keyName = "ulms-contact-key", algorithm = "AES-256-CBC")
    private String phoneNumber;

    @Column(name = "email_encrypted")
    @Convert(converter = EncryptedStringConverter.class)
    @FieldEncryption(keyName = "ulms-contact-key", algorithm = "AES-256-CBC")
    private String email;

    // Non-encrypted fields
    @Column(name = "gender")
    @Enumerated(EnumType.STRING)
    private Gender gender;

    @Column(name = "customer_type")
    @Enumerated(EnumType.STRING)
    private CustomerType customerType;

    // Audit fields
    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Getters and setters...
}
```

### 6.4 JPA Encryption Converter

```java
@Component
public class EncryptedStringConverter implements AttributeConverter<String, String> {

    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";
    private static final String DELIMITER = ":";
    private static final int IV_LENGTH = 16;

    private final VaultTemplate vaultTemplate;
    private final EncryptionKeyService keyService;

    @Autowired
    public EncryptedStringConverter(VaultTemplate vaultTemplate,
                                    EncryptionKeyService keyService) {
        this.vaultTemplate = vaultTemplate;
        this.keyService = keyService;
    }

    @Override
    public String convertToDatabaseColumn(String plainText) {
        if (plainText == null || plainText.isEmpty()) {
            return null;
        }

        try {
            // Get current encryption key from Vault
            EncryptionKey key = keyService.getCurrentKey("ulms-field-encryption");

            // Generate random IV
            byte[] iv = new byte[IV_LENGTH];
            SecureRandom random = new SecureRandom();
            random.nextBytes(iv);

            // Initialize cipher
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            SecretKeySpec secretKey = new SecretKeySpec(key.getKeyBytes(), "AES");
            IvParameterSpec ivSpec = new IvParameterSpec(iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, ivSpec);

            // Encrypt
            byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            // Format: base64(iv):base64(ciphertext):keyVersion
            String encodedIv = Base64.getEncoder().encodeToString(iv);
            String encodedCiphertext = Base64.getEncoder().encodeToString(encrypted);

            String result = encodedIv + DELIMITER + encodedCiphertext + DELIMITER + key.getVersion();

            // Log encryption event (without sensitive data)
            auditLog("FIELD_ENCRYPTED", key.getVersion());

            return result;

        } catch (Exception e) {
            throw new EncryptionException("Failed to encrypt field", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String encryptedText) {
        if (encryptedText == null || encryptedText.isEmpty()) {
            return null;
        }

        try {
            // Parse encrypted format
            String[] parts = encryptedText.split(DELIMITER);
            if (parts.length != 3) {
                throw new EncryptionException("Invalid encrypted format");
            }

            byte[] iv = Base64.getDecoder().decode(parts[0]);
            byte[] ciphertext = Base64.getDecoder().decode(parts[1]);
            String keyVersion = parts[2];

            // Get decryption key (supports old key versions)
            EncryptionKey key = keyService.getKey("ulms-field-encryption", keyVersion);

            // Initialize cipher
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            SecretKeySpec secretKey = new SecretKeySpec(key.getKeyBytes(), "AES");
            IvParameterSpec ivSpec = new IvParameterSpec(iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, ivSpec);

            // Decrypt
            byte[] decrypted = cipher.doFinal(ciphertext);

            // Log decryption event
            auditLog("FIELD_DECRYPTED", keyVersion);

            return new String(decrypted, StandardCharsets.UTF_8);

        } catch (Exception e) {
            throw new EncryptionException("Failed to decrypt field", e);
        }
    }

    private void auditLog(String action, String keyVersion) {
        // Audit logging implementation
        MDC.put("encryptionAction", action);
        MDC.put("keyVersion", keyVersion);
        log.info("Field encryption operation: {}", action);
        MDC.clear();
    }
}
```

---

## 7. Key Management

### 7.1 Key Management Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      KEY MANAGEMENT ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    HASHICORP VAULT (Primary KMS)                       │ │
│  │                                                                         │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐ │ │
│  │  │  Transit Engine  │  │   KV Engine v2   │  │    PKI Engine        │ │ │
│  │  │                  │  │                  │  │                      │ │ │
│  │  │ • Encrypt/Decrypt│  │ • API Keys       │  │ • TLS Certificates   │ │ │
│  │  │ • Key Rotation   │  │ • DB Credentials │  │ • Client Certs       │ │ │
│  │  │ • Key Versioning │  │ • Service Secrets│  │ • CA Management      │ │ │
│  │  │                  │  │                  │  │                      │ │ │
│  │  │ Keys:            │  │ Paths:           │  │ Roles:               │ │ │
│  │  │ • ulms-nid-key   │  │ • secret/db/*    │  │ • ulms-server        │ │ │
│  │  │ • ulms-field-key │  │ • secret/api/*   │  │ • ulms-client        │ │ │
│  │  │ • ulms-backup-key│  │ • secret/cib/*   │  │ • ulms-service       │ │ │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────────┘ │ │
│  │                                │                                        │ │
│  │                                │                                        │ │
│  │                    ┌───────────▼───────────┐                           │ │
│  │                    │    Auto-Unseal        │                           │ │
│  │                    │    (AWS KMS / HSM)    │                           │ │
│  │                    └───────────────────────┘                           │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                    ┌───────────────┼───────────────┐                        │
│                    │               │               │                        │
│                    ▼               ▼               ▼                        │
│           ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │
│           │  Spring Boot │ │   Kubernetes │ │   Database   │               │
│           │   Services   │ │   Secrets    │ │   (TDE Key)  │               │
│           └──────────────┘ └──────────────┘ └──────────────┘               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Vault Transit Engine Configuration

```hcl
# Enable Transit Engine
path "transit" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Create encryption key for field-level encryption
vault write transit/keys/ulms-field-encryption \
  type=aes256-gcm96 \
  derived=false \
  exportable=false \
  allow_plaintext_backup=false \
  auto_rotate_period=2160h  # 90 days

# Create key for NID encryption
vault write transit/keys/ulms-nid-key \
  type=aes256-gcm96 \
  derived=false \
  exportable=false \
  auto_rotate_period=2160h  # 90 days

# Create key for backup encryption
vault write transit/keys/ulms-backup-key \
  type=aes256-gcm96 \
  derived=false \
  exportable=true  # Required for pgBackRest
  auto_rotate_period=8760h  # 1 year
```

### 7.3 Key Rotation Policy

| Key Type | Rotation Period | Grace Period | Retention |
|----------|-----------------|--------------|-----------|
| **Field Encryption** | 90 days | 30 days | 2 years |
| **NID Encryption** | 90 days | 30 days | 2 years |
| **Database TDE** | 1 year | 90 days | 7 years |
| **Backup Encryption** | 1 year | 180 days | 10 years |
| **TLS Certificates** | 1 year | 30 days | 1 year |
| **JWT Signing** | 1 year | 90 days | 1 year |
| **API Keys** | 6 months | 30 days | 1 year |

### 7.4 Key Rotation Implementation

```java
@Service
@Slf4j
public class KeyRotationService {

    private final VaultTemplate vaultTemplate;
    private final KeyMetadataRepository keyMetadataRepository;

    @Scheduled(cron = "0 0 2 * * ?") // Daily at 2 AM
    public void checkAndRotateKeys() {
        log.info("Starting key rotation check...");

        List<KeyMetadata> keys = keyMetadataRepository.findAllActive();

        for (KeyMetadata key : keys) {
            if (isRotationDue(key)) {
                rotateKey(key);
            } else if (isRotationWarning(key)) {
                sendRotationWarning(key);
            }
        }
    }

    private boolean isRotationDue(KeyMetadata key) {
        LocalDateTime rotationDate = key.getLastRotated()
            .plusDays(key.getRotationPeriodDays());
        return LocalDateTime.now().isAfter(rotationDate);
    }

    private void rotateKey(KeyMetadata key) {
        try {
            // Rotate key in Vault
            vaultTemplate.write(
                "transit/keys/" + key.getKeyName() + "/rotate",
                Collections.emptyMap()
            );

            // Update metadata
            key.setLastRotated(LocalDateTime.now());
            key.setCurrentVersion(key.getCurrentVersion() + 1);
            keyMetadataRepository.save(key);

            // Log rotation event
            auditLogKeyRotation(key);

            log.info("Successfully rotated key: {}", key.getKeyName());

        } catch (Exception e) {
            log.error("Failed to rotate key: {}", key.getKeyName(), e);
            alertKeyRotationFailure(key, e);
        }
    }

    @Async
    public void reEncryptWithNewKey(String keyName, String tableName, String columnName) {
        // Re-encrypt existing data with new key version
        log.info("Starting re-encryption for {}.{} with key {}",
                 tableName, columnName, keyName);

        // Process in batches
        int batchSize = 1000;
        int offset = 0;
        int totalProcessed = 0;

        while (true) {
            List<EncryptedRecord> records = fetchBatch(tableName, columnName,
                                                        batchSize, offset);
            if (records.isEmpty()) {
                break;
            }

            for (EncryptedRecord record : records) {
                String decrypted = decrypt(record.getEncryptedValue());
                String reEncrypted = encrypt(decrypted, keyName);
                updateRecord(record.getId(), tableName, columnName, reEncrypted);
                totalProcessed++;
            }

            offset += batchSize;
            log.debug("Re-encrypted {} records so far", totalProcessed);
        }

        log.info("Completed re-encryption. Total records processed: {}", totalProcessed);
    }
}
```

---

## 8. Encryption Implementation

### 8.1 Spring Boot Vault Integration

**Maven Dependencies:**

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-vault-config</artifactId>
        <version>4.1.0</version>
    </dependency>
    <dependency>
        <groupId>org.springframework.vault</groupId>
        <artifactId>spring-vault-core</artifactId>
        <version>3.1.0</version>
    </dependency>
</dependencies>
```

**Application Configuration:**

```yaml
# bootstrap.yml
spring:
  cloud:
    vault:
      enabled: true
      uri: https://vault.ulms.internal:8200
      authentication: KUBERNETES
      kubernetes:
        role: ulms-service
        kubernetes-path: auth/kubernetes
        service-account-token-file: /var/run/secrets/kubernetes.io/serviceaccount/token
      ssl:
        trust-store: classpath:vault-truststore.jks
        trust-store-password: ${VAULT_TRUSTSTORE_PASSWORD}

      # KV Secrets Engine
      kv:
        enabled: true
        backend: secret
        profile-separator: '/'
        default-context: ulms

      # Transit Engine
      transit:
        enabled: true
        backend: transit
```

### 8.2 Encryption Service

```java
@Service
@Slf4j
public class EncryptionService {

    private final VaultTemplate vaultTemplate;
    private final VaultTransitOperations transitOperations;

    @Autowired
    public EncryptionService(VaultTemplate vaultTemplate) {
        this.vaultTemplate = vaultTemplate;
        this.transitOperations = vaultTemplate.opsForTransit();
    }

    /**
     * Encrypt sensitive data using Vault Transit engine
     */
    public String encrypt(String plaintext, String keyName) {
        if (plaintext == null || plaintext.isEmpty()) {
            return null;
        }

        try {
            Ciphertext ciphertext = transitOperations.encrypt(keyName, Plaintext.of(plaintext));
            return ciphertext.getCiphertext();
        } catch (VaultException e) {
            log.error("Encryption failed for key: {}", keyName, e);
            throw new EncryptionException("Failed to encrypt data", e);
        }
    }

    /**
     * Decrypt sensitive data using Vault Transit engine
     */
    public String decrypt(String ciphertext, String keyName) {
        if (ciphertext == null || ciphertext.isEmpty()) {
            return null;
        }

        try {
            Plaintext plaintext = transitOperations.decrypt(keyName, Ciphertext.of(ciphertext));
            return plaintext.asString();
        } catch (VaultException e) {
            log.error("Decryption failed for key: {}", keyName, e);
            throw new EncryptionException("Failed to decrypt data", e);
        }
    }

    /**
     * Encrypt with specific context (for derived keys)
     */
    public String encryptWithContext(String plaintext, String keyName, String context) {
        VaultTransitContext transitContext = VaultTransitContext.builder()
            .context(context.getBytes(StandardCharsets.UTF_8))
            .build();

        Ciphertext ciphertext = transitOperations.encrypt(keyName,
            Plaintext.of(plaintext), transitContext);

        return ciphertext.getCiphertext();
    }

    /**
     * Batch encryption for performance
     */
    public List<String> encryptBatch(List<String> plaintexts, String keyName) {
        List<Plaintext> plaintextList = plaintexts.stream()
            .map(Plaintext::of)
            .collect(Collectors.toList());

        List<VaultEncryptionResult> results = transitOperations.encrypt(keyName, plaintextList);

        return results.stream()
            .map(result -> result.get().getCiphertext())
            .collect(Collectors.toList());
    }

    /**
     * Rewrap ciphertext with latest key version
     */
    public String rewrap(String ciphertext, String keyName) {
        try {
            Ciphertext rewrapped = transitOperations.rewrap(keyName, Ciphertext.of(ciphertext));
            return rewrapped.getCiphertext();
        } catch (VaultException e) {
            log.error("Rewrap failed for key: {}", keyName, e);
            throw new EncryptionException("Failed to rewrap data", e);
        }
    }

    /**
     * Generate data key for client-side encryption
     */
    public DataKey generateDataKey(String keyName) {
        VaultTransitKeyConfiguration config = VaultTransitKeyConfiguration.builder()
            .type("aes256-gcm96")
            .build();

        RawTransitKey rawKey = transitOperations.exportKey(keyName,
            TransitKeyType.ENCRYPTION_KEY);

        return DataKey.builder()
            .plaintext(rawKey.getKeys().get("1"))
            .ciphertext(encrypt(new String(rawKey.getKeys().get("1")), keyName))
            .build();
    }
}
```

---

## 9. Database Encryption Functions

### 9.1 PostgreSQL Encryption Functions

```sql
-- Create extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function: Encrypt NID for CIB submission
CREATE OR REPLACE FUNCTION encrypt_nid_for_cib(
    p_nid VARCHAR(17),
    p_tenant_id VARCHAR(50)
)
RETURNS TABLE (
    encrypted_nid VARCHAR(255),
    key_id VARCHAR(100),
    iv VARCHAR(32)
) AS $$
DECLARE
    v_key BYTEA;
    v_iv BYTEA;
    v_encrypted BYTEA;
    v_key_id VARCHAR(100);
BEGIN
    -- Get current encryption key from Vault (via stored procedure or external call)
    -- In production, this would call Vault API
    v_key := get_current_encryption_key(p_tenant_id, 'nid-encryption');
    v_key_id := get_current_key_id(p_tenant_id, 'nid-encryption');

    -- Generate random IV
    v_iv := gen_random_bytes(16);

    -- Encrypt NID
    v_encrypted := encrypt_iv(
        p_nid::BYTEA,
        v_key,
        v_iv,
        'aes-cbc'
    );

    -- Return encrypted data
    RETURN QUERY SELECT
        encode(v_encrypted, 'base64')::VARCHAR(255) AS encrypted_nid,
        v_key_id AS key_id,
        encode(v_iv, 'base64')::VARCHAR(32) AS iv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Decrypt NID
CREATE OR REPLACE FUNCTION decrypt_nid_for_cib(
    p_encrypted_nid VARCHAR(255),
    p_key_id VARCHAR(100),
    p_iv VARCHAR(32),
    p_tenant_id VARCHAR(50)
)
RETURNS VARCHAR(17) AS $$
DECLARE
    v_key BYTEA;
    v_decrypted BYTEA;
BEGIN
    -- Get decryption key (supports historical key versions)
    v_key := get_encryption_key_by_id(p_tenant_id, p_key_id);

    -- Decrypt NID
    v_decrypted := decrypt_iv(
        decode(p_encrypted_nid, 'base64'),
        v_key,
        decode(p_iv, 'base64'),
        'aes-cbc'
    );

    RETURN convert_from(v_decrypted, 'UTF8');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Hash sensitive data for searching (one-way)
CREATE OR REPLACE FUNCTION hash_for_search(
    p_value VARCHAR,
    p_salt VARCHAR DEFAULT 'ulms-search-salt'
)
RETURNS VARCHAR(64) AS $$
BEGIN
    RETURN encode(
        digest(p_salt || p_value || p_salt, 'sha256'),
        'hex'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

-- Trigger: Auto-encrypt sensitive fields on insert/update
CREATE OR REPLACE FUNCTION encrypt_customer_fields()
RETURNS TRIGGER AS $$
DECLARE
    v_encryption_result RECORD;
BEGIN
    -- Encrypt NID if changed
    IF NEW.nid_number IS DISTINCT FROM OLD.nid_number THEN
        SELECT * INTO v_encryption_result
        FROM encrypt_nid_for_cib(NEW.nid_number, NEW.tenant_id);

        NEW.nid_number_encrypted := v_encryption_result.encrypted_nid;
        NEW.nid_encryption_key_id := v_encryption_result.key_id;
        NEW.nid_encryption_iv := v_encryption_result.iv;
        NEW.nid_number := NULL; -- Clear plaintext
    END IF;

    -- Create search hash
    IF NEW.nid_number_hash IS NULL AND NEW.nid_number_encrypted IS NOT NULL THEN
        NEW.nid_number_hash := hash_for_search(
            decrypt_nid_for_cib(
                NEW.nid_number_encrypted,
                NEW.nid_encryption_key_id,
                NEW.nid_encryption_iv,
                NEW.tenant_id
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_encrypt_customer_fields
    BEFORE INSERT OR UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION encrypt_customer_fields();
```

### 9.2 Searchable Encryption

```sql
-- Create index on hash for efficient searching
CREATE INDEX idx_customers_nid_hash ON customers(nid_number_hash)
    WHERE is_deleted = FALSE;

-- Function: Search by NID (uses hash comparison)
CREATE OR REPLACE FUNCTION search_customer_by_nid(
    p_nid VARCHAR(17),
    p_tenant_id VARCHAR(50)
)
RETURNS TABLE (
    customer_id BIGINT,
    customer_number VARCHAR(20),
    first_name VARCHAR(100),
    last_name VARCHAR(100)
) AS $$
DECLARE
    v_hash VARCHAR(64);
BEGIN
    -- Hash the search input
    v_hash := hash_for_search(p_nid);

    -- Search by hash
    RETURN QUERY
    SELECT
        c.id AS customer_id,
        c.customer_number,
        c.first_name,
        c.last_name
    FROM customers c
    WHERE c.nid_number_hash = v_hash
      AND c.tenant_id = p_tenant_id
      AND c.is_deleted = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 10. Application-Level Encryption

### 10.1 Spring Security Encryption

```java
@Configuration
public class EncryptionConfig {

    @Bean
    public TextEncryptor textEncryptor(
            @Value("${encryption.password}") String password,
            @Value("${encryption.salt}") String salt) {
        return Encryptors.text(password, salt);
    }

    @Bean
    public BytesEncryptor bytesEncryptor(
            @Value("${encryption.password}") String password,
            @Value("${encryption.salt}") String salt) {
        return Encryptors.stronger(password, salt);
    }
}
```

### 10.2 File Encryption Service

```java
@Service
@Slf4j
public class FileEncryptionService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128;
    private static final int GCM_IV_LENGTH = 12;

    private final VaultTemplate vaultTemplate;

    /**
     * Encrypt file before storing in MinIO
     */
    public EncryptedFile encryptFile(byte[] fileContent, String keyName) {
        try {
            // Get encryption key from Vault
            SecretKey key = getKeyFromVault(keyName);

            // Generate IV
            byte[] iv = new byte[GCM_IV_LENGTH];
            SecureRandom random = new SecureRandom();
            random.nextBytes(iv);

            // Initialize cipher
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, key, gcmSpec);

            // Encrypt
            byte[] encryptedContent = cipher.doFinal(fileContent);

            return EncryptedFile.builder()
                .content(encryptedContent)
                .iv(iv)
                .keyId(getCurrentKeyId(keyName))
                .algorithm(ALGORITHM)
                .build();

        } catch (Exception e) {
            log.error("File encryption failed", e);
            throw new EncryptionException("Failed to encrypt file", e);
        }
    }

    /**
     * Decrypt file retrieved from MinIO
     */
    public byte[] decryptFile(EncryptedFile encryptedFile) {
        try {
            // Get decryption key
            SecretKey key = getKeyFromVault(encryptedFile.getKeyId());

            // Initialize cipher
            Cipher cipher = Cipher.getInstance(encryptedFile.getAlgorithm());
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH,
                                                            encryptedFile.getIv());
            cipher.init(Cipher.DECRYPT_MODE, key, gcmSpec);

            // Decrypt
            return cipher.doFinal(encryptedFile.getContent());

        } catch (Exception e) {
            log.error("File decryption failed", e);
            throw new EncryptionException("Failed to decrypt file", e);
        }
    }

    /**
     * Stream encryption for large files
     */
    public void encryptFileStream(InputStream input, OutputStream output,
                                   String keyName) throws IOException {
        try {
            SecretKey key = getKeyFromVault(keyName);
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            // Write IV to output first
            output.write(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, key,
                       new GCMParameterSpec(GCM_TAG_LENGTH, iv));

            try (CipherOutputStream cos = new CipherOutputStream(output, cipher)) {
                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = input.read(buffer)) != -1) {
                    cos.write(buffer, 0, bytesRead);
                }
            }
        } catch (GeneralSecurityException e) {
            throw new EncryptionException("Stream encryption failed", e);
        }
    }

    private SecretKey getKeyFromVault(String keyName) {
        // Implementation to retrieve key from Vault
        RawTransitKey rawKey = vaultTemplate.opsForTransit()
            .exportKey(keyName, TransitKeyType.ENCRYPTION_KEY);

        byte[] keyBytes = Base64.getDecoder().decode(rawKey.getKeys().get("1"));
        return new SecretKeySpec(keyBytes, "AES");
    }
}
```

---

## 11. Backup Encryption

### 11.1 pgBackRest Encryption Configuration

```ini
# /etc/pgbackrest/pgbackrest.conf

[global]
# Repository configuration
repo1-type=s3
repo1-path=/ulms-backups
repo1-s3-bucket=ulms-backup-bucket
repo1-s3-endpoint=s3.ap-south-1.amazonaws.com
repo1-s3-region=ap-south-1

# Encryption configuration
repo1-cipher-type=aes-256-cbc
repo1-cipher-pass={VAULT_BACKUP_KEY}

# Retention
repo1-retention-full=4
repo1-retention-diff=7
repo1-retention-archive=30

# Compression
compress-type=lz4
compress-level=6

[ulms]
pg1-path=/var/lib/postgresql/16/data
pg1-port=5432
```

### 11.2 Backup Encryption Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      BACKUP ENCRYPTION FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐                 │
│  │  PostgreSQL │      │  pgBackRest │      │    Vault    │                 │
│  │   Database  │      │   Backup    │      │   (Keys)    │                 │
│  └──────┬──────┘      └──────┬──────┘      └──────┬──────┘                 │
│         │                    │                    │                         │
│         │  1. WAL Stream     │                    │                         │
│         │───────────────────▶│                    │                         │
│         │                    │                    │                         │
│         │                    │  2. Get Key       │                         │
│         │                    │───────────────────▶│                         │
│         │                    │                    │                         │
│         │                    │  3. Encryption Key│                         │
│         │                    │◀───────────────────│                         │
│         │                    │                    │                         │
│         │                    │  4. Encrypt Backup │                        │
│         │                    │  (AES-256-CBC)     │                        │
│         │                    │                    │                         │
│         │                    │  5. Upload to S3   │                        │
│         │                    │────────────────────────────▶ S3 Bucket      │
│         │                    │                              (Encrypted)    │
│         │                    │                                              │
│         │                    │  6. Log Success   │                         │
│         │                    │◀───────────────────│                         │
│         │                    │                    │                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 11.3 Backup Verification

```bash
#!/bin/bash
# verify-backup.sh - Verify backup integrity and encryption

BACKUP_SET=$1
VAULT_TOKEN=$2

# Verify backup integrity
pgbackrest --stanza=ulms verify

# Test restore (to temporary location)
pgbackrest --stanza=ulms --target-action=shutdown \
  --type=time --target="$(date -d '1 hour ago' +%Y-%m-%d\ %H:%M:%S)" \
  --target-path=/tmp/restore-test \
  restore

# Verify encryption
BACKUP_FILE=$(pgbackrest --stanza=ulms info --output=json | jq -r '.[] | .backup[0].archive.start')
echo "Verifying encryption of backup: $BACKUP_FILE"

# Check file header for encryption markers
head -c 16 /var/lib/pgbackrest/backup/ulms/$BACKUP_FILE | xxd | grep -q "Salted"
if [ $? -eq 0 ]; then
  echo "✓ Backup is encrypted"
else
  echo "✗ WARNING: Backup may not be encrypted!"
  exit 1
fi

# Cleanup test restore
rm -rf /tmp/restore-test
```

---

## 12. Compliance Mapping

### 12.1 ICT Security Guidelines V4.0 Compliance

| Section | Requirement | ULMS Implementation | Status |
|---------|-------------|---------------------|--------|
| **5.1.1** | Data encryption at rest | AES-256-TDE (PostgreSQL) | ✅ Compliant |
| **5.1.2** | Encryption algorithm standards | AES-256 (FIPS 197) | ✅ Compliant |
| **5.1.3** | Key management | HashiCorp Vault + HSM | ✅ Compliant |
| **5.2.1** | Data encryption in transit | TLS 1.3 | ✅ Compliant |
| **5.2.2** | Certificate management | cert-manager, auto-renewal | ✅ Compliant |
| **5.3.1** | Sensitive data protection | Field-level AES-256-CBC | ✅ Compliant |
| **5.3.2** | Key rotation | 90-day rotation | ✅ Compliant |
| **5.3.3** | Encryption audit logging | ELK Stack | ✅ Compliant |

### 12.2 Data Protection Verification Checklist

| Check | Verification Method | Frequency |
|-------|---------------------|-----------|
| TDE active | `SELECT name, is_encrypted FROM pg_tablespace;` | Daily |
| TLS version | `openssl s_client -connect api:443` | Daily |
| Key rotation | Vault audit log review | Weekly |
| Backup encryption | pgBackRest verify | After each backup |
| Field encryption | Application unit tests | Each deployment |
| Certificate expiry | cert-manager alerts | Continuous |

---

## 13. Monitoring & Audit

### 13.1 Encryption Audit Events

```json
{
  "eventId": "enc-2026-02-05-abc123",
  "timestamp": "2026-02-05T10:30:45.123Z",
  "eventType": "FIELD_ENCRYPTION",
  "action": "ENCRYPT",
  "status": "SUCCESS",

  "encryption": {
    "algorithm": "AES-256-CBC",
    "keyName": "ulms-nid-key",
    "keyVersion": "v3",
    "dataType": "NID_NUMBER"
  },

  "context": {
    "service": "customer-service",
    "operation": "createCustomer",
    "userId": "system",
    "tenantId": "BANK_001",
    "requestId": "req-xyz789"
  },

  "metadata": {
    "environment": "production",
    "region": "bd-dhaka-1"
  }
}
```

### 13.2 Prometheus Metrics

```yaml
# Encryption Metrics
ulms_encryption_operations_total{type="encrypt",algorithm="AES-256-CBC"}
ulms_encryption_operations_total{type="decrypt",algorithm="AES-256-CBC"}
ulms_encryption_errors_total{type="key_not_found"}
ulms_encryption_latency_seconds{operation="encrypt"}
ulms_key_rotation_last_timestamp{key_name="ulms-nid-key"}
ulms_key_age_days{key_name="ulms-nid-key"}

# Alert Rules
groups:
  - name: encryption-alerts
    rules:
      - alert: EncryptionKeyExpiringSoon
        expr: ulms_key_age_days > 80
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "Encryption key approaching rotation"

      - alert: HighEncryptionErrorRate
        expr: rate(ulms_encryption_errors_total[5m]) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High encryption error rate detected"
```

---

## 14. Appendices

### 14.1 Glossary

| Term | Definition |
|------|------------|
| **AES** | Advanced Encryption Standard |
| **CBC** | Cipher Block Chaining mode |
| **GCM** | Galois/Counter Mode |
| **HSM** | Hardware Security Module |
| **IV** | Initialization Vector |
| **KMS** | Key Management Service |
| **mTLS** | Mutual TLS |
| **PKCS** | Public Key Cryptography Standards |
| **TDE** | Transparent Data Encryption |
| **TLS** | Transport Layer Security |

### 14.2 Algorithm Reference

| Algorithm | Mode | Use Case | Key Size |
|-----------|------|----------|----------|
| AES-256 | CBC | Field-level encryption | 256-bit |
| AES-256 | GCM | File encryption | 256-bit |
| AES-256 | TDE | Database at-rest | 256-bit |
| RSA | OAEP | Key exchange | 2048-bit |
| SHA-256 | - | Hashing, HMAC | 256-bit |
| ECDHE | - | Key agreement | P-384 |

### 14.3 Related Documents

| Document ID | Document Name |
|-------------|---------------|
| ARCH-1.4.1 | Security Architecture Document |
| ARCH-1.4.2 | Authentication & Authorization Design |
| ARCH-1.4.4 | Secrets Management Design (Vault) |
| ARCH-1.4.5 | mTLS Configuration for CIB |

---

**Document Version:** 1.0
**Classification:** Confidential - Internal Use
**Last Updated:** February 5, 2026
**Next Review:** August 2026

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

*This Data Encryption Strategy Document defines the encryption standards and implementation for ULMS v2.0.*

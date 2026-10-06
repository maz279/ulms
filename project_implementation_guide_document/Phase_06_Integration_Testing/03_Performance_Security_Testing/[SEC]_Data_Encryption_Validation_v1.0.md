**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Data Encryption Validation |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Security Lead, Unisoft Systems Limited |
| **Reviewed By** | CISO |
| **Classification** | Confidential |
| **Status** | Draft |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | Security Lead | Initial version |

---

# Data Encryption Validation

## Table of Contents

1. [Introduction](#1-introduction)
2. [Encryption Standards](#2-encryption-standards)
3. [Data at Rest Encryption](#3-data-at-rest-encryption)
4. [Data in Transit Encryption](#4-data-in-transit-encryption)
5. [Key Management Testing](#5-key-management-testing)
6. [Validation Procedures](#6-validation-procedures)
7. [Testing Tools and Scripts](#7-testing-tools-and-scripts)
8. [Remediation Guidelines](#8-remediation-guidelines)
9. [Related Documents](#9-related-documents)

---

## 1. Introduction

### 1.1 Purpose

This document defines comprehensive validation procedures for data encryption in ULMS v2.0, covering encryption at rest, in transit, and key management practices.

### 1.2 Encryption Requirements

| Requirement | Standard | Status |
|-------------|----------|--------|
| Data at Rest | AES-256 | Required |
| Data in Transit | TLS 1.3 | Required |
| Password Hashing | bcrypt/Argon2 | Required |
| Key Storage | HSM/Vault | Required |
| Key Rotation | 90 days | Required |

---

## 2. Encryption Standards

### 2.1 Approved Algorithms

| Use Case | Algorithm | Key Size | Mode |
|----------|-----------|----------|------|
| Data Encryption | AES | 256 bits | GCM |
| Key Exchange | ECDHE | P-256 | - |
| Digital Signature | RSA/ECDSA | 2048/256 bits | - |
| Hashing | SHA-256 | - | - |
| Password Hashing | bcrypt | Cost 12+ | - |

### 2.2 Prohibited Algorithms

| Algorithm | Reason | Replacement |
|-----------|--------|-------------|
| MD5 | Collision attacks | SHA-256 |
| SHA-1 | Deprecated | SHA-256 |
| DES | Weak key | AES-256 |
| 3DES | Deprecated | AES-256 |
| RC4 | Vulnerable | AES-256 |
| RSA < 2048 | Weak | RSA 2048+ |

---

## 3. Data at Rest Encryption

### 3.1 PostgreSQL TDE Configuration

```sql
-- Enable encryption for sensitive tables
-- PostgreSQL with pgcrypto extension

-- Install extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create encrypted column function
CREATE OR REPLACE FUNCTION encrypt_sensitive(data TEXT, key TEXT)
RETURNS BYTEA AS $$
BEGIN
    RETURN pgp_sym_encrypt(data, key, 'cipher-algo=aes256');
END;
$$ LANGUAGE plpgsql;

-- Create decryption function
CREATE OR REPLACE FUNCTION decrypt_sensitive(encrypted_data BYTEA, key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(encrypted_data, key);
END;
$$ LANGUAGE plpgsql;

-- Encrypt existing data
UPDATE borrowers
SET 
    nid_encrypted = encrypt_sensitive(nid, current_setting('app.encryption_key')),
    mobile_encrypted = encrypt_sensitive(mobile_number, current_setting('app.encryption_key'))
WHERE nid_encrypted IS NULL;

-- Verify encryption
SELECT 
    nid,
    nid_encrypted,
    decrypt_sensitive(nid_encrypted, current_setting('app.encryption_key')) as decrypted_nid
FROM borrowers
LIMIT 5;
```

### 3.2 Application-Level Encryption

```java
@Component
public class FieldEncryptionService {
    
    private final String algorithm = "AES/GCM/NoPadding";
    private final int gcmTagLength = 128;
    private final int gcmIvLength = 12;
    
    @Autowired
    private KeyManagementService keyService;
    
    /**
     * Encrypt sensitive field
     */
    public String encrypt(String plaintext) {
        try {
            byte[] iv = new byte[gcmIvLength];
            SecureRandom random = new SecureRandom();
            random.nextBytes(iv);
            
            Cipher cipher = Cipher.getInstance(algorithm);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(gcmTagLength, iv);
            cipher.init(Cipher.ENCRYPT_MODE, keyService.getDataKey(), parameterSpec);
            
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            
            // Combine IV + ciphertext
            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + ciphertext.length);
            byteBuffer.put(iv);
            byteBuffer.put(ciphertext);
            
            return Base64.getEncoder().encodeToString(byteBuffer.array());
            
        } catch (Exception e) {
            throw new EncryptionException("Encryption failed", e);
        }
    }
    
    /**
     * Decrypt sensitive field
     */
    public String decrypt(String encryptedData) {
        try {
            byte[] decoded = Base64.getDecoder().decode(encryptedData);
            
            ByteBuffer byteBuffer = ByteBuffer.wrap(decoded);
            byte[] iv = new byte[gcmIvLength];
            byteBuffer.get(iv);
            byte[] ciphertext = new byte[byteBuffer.remaining()];
            byteBuffer.get(ciphertext);
            
            Cipher cipher = Cipher.getInstance(algorithm);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(gcmTagLength, iv);
            cipher.init(Cipher.DECRYPT_MODE, keyService.getDataKey(), parameterSpec);
            
            byte[] plaintext = cipher.doFinal(ciphertext);
            return new String(plaintext, StandardCharsets.UTF_8);
            
        } catch (Exception e) {
            throw new EncryptionException("Decryption failed", e);
        }
    }
}
```

### 3.3 File Encryption

```java
@Component
public class DocumentEncryptionService {
    
    private static final int BUFFER_SIZE = 8192;
    
    /**
     * Encrypt uploaded document
     */
    public void encryptDocument(InputStream input, OutputStream output, SecretKey key) 
            throws Exception {
        byte[] iv = new byte[12];
        SecureRandom random = new SecureRandom();
        random.nextBytes(iv);
        
        // Write IV first
        output.write(iv);
        
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        GCMParameterSpec spec = new GCMParameterSpec(128, iv);
        cipher.init(Cipher.ENCRYPT_MODE, key, spec);
        
        try (CipherOutputStream cos = new CipherOutputStream(output, cipher)) {
            byte[] buffer = new byte[BUFFER_SIZE];
            int bytesRead;
            while ((bytesRead = input.read(buffer)) != -1) {
                cos.write(buffer, 0, bytesRead);
            }
        }
    }
}
```

---

## 4. Data in Transit Encryption

### 4.1 TLS 1.3 Configuration

```yaml
# Spring Boot TLS Configuration
server:
  port: 8443
  ssl:
    enabled: true
    protocol: TLS
    enabled-protocols: TLSv1.3
    ciphers:
      - TLS_AES_256_GCM_SHA384
      - TLS_CHACHA20_POLY1305_SHA256
      - TLS_AES_128_GCM_SHA256
    key-store: ${SSL_KEYSTORE_PATH}
    key-store-password: ${SSL_KEYSTORE_PASSWORD}
    key-store-type: PKCS12
    key-alias: ulms-server
```

### 4.2 Nginx TLS Configuration

```nginx
# nginx.conf SSL configuration
server {
    listen 443 ssl http2;
    server_name ulms.bank.com;
    
    # TLS 1.3 only
    ssl_protocols TLSv1.3;
    ssl_prefer_server_ciphers off;
    
    # Strong cipher suites
    ssl_ciphers TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256;
    
    # Certificate configuration
    ssl_certificate /etc/ssl/certs/ulms.crt;
    ssl_certificate_key /etc/ssl/private/ulms.key;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/ssl/certs/chain.crt;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;
    
    # Session configuration
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
}
```

### 4.3 TLS Validation Script

```bash
#!/bin/bash
# validate-tls.sh

TARGET=$1

echo "=== TLS Configuration Validation ==="

# Check TLS version
echo "[*] Checking TLS 1.3 support..."
echo | openssl s_client -connect $TARGET:443 -tls1_3 2>/dev/null | grep "Protocol"

# Check cipher suites
echo "[*] Supported cipher suites..."
nmap --script ssl-enum-ciphers -p 443 $TARGET

# Check certificate
echo "[*] Certificate details..."
echo | openssl s_client -connect $TARGET:443 2>/dev/null | openssl x509 -noout -text | grep -A2 "Subject:"
echo | openssl s_client -connect $TARGET:443 2>/dev/null | openssl x509 -noout -text | grep -A2 "Validity"

# Check HSTS
echo "[*] HSTS header..."
curl -s -I https://$TARGET | grep -i strict-transport-security

# SSL Labs scan (optional)
echo "[*] SSL Labs grade..."
# Requires ssllabs-scan tool
# ssllabs-scan $TARGET | jq '.endpoints[0].grade'

echo "=== Validation Complete ==="
```

---

## 5. Key Management Testing

### 5.1 HashiCorp Vault Configuration

```hcl
# vault-policy.hcl
# ULMS Application Policy

# Encrypt/decrypt data keys
path "transit/encrypt/ulms-data" {
  capabilities = ["create", "update"]
}

path "transit/decrypt/ulms-data" {
  capabilities = ["create", "update"]
}

# Read database credentials
path "database/creds/ulms-app" {
  capabilities = ["read"]
}

# Read application secrets
path "secret/data/ulms/*" {
  capabilities = ["read"]
}
```

### 5.2 Key Rotation Testing

```java
@Component
public class KeyRotationTest {
    
    @Autowired
    private VaultTemplate vaultTemplate;
    
    /**
     * Test key rotation procedure
     */
    public KeyRotationResult testKeyRotation() {
        String keyName = "ulms-data";
        
        // Step 1: Get current key version
        int currentVersion = getCurrentKeyVersion(keyName);
        log.info("Current key version: {}", currentVersion);
        
        // Step 2: Encrypt test data with current key
        String testData = "sensitive-test-data";
        String encrypted = encryptWithVersion(testData, keyName, currentVersion);
        
        // Step 3: Trigger key rotation
        rotateKey(keyName);
        int newVersion = getCurrentKeyVersion(keyName);
        log.info("New key version: {}", newVersion);
        
        // Step 4: Verify old data can still be decrypted
        String decrypted = decrypt(encrypted, keyName);
        boolean decryptionSuccess = testData.equals(decrypted);
        
        // Step 5: Verify new encryption uses new key
        String newEncrypted = encryptWithVersion(testData, keyName, newVersion);
        boolean newEncryptionSuccess = !encrypted.equals(newEncrypted);
        
        // Step 6: Rewrap old data with new key (optional)
        String rewrapped = rewrap(encrypted, keyName);
        String rewrappedDecrypted = decrypt(rewrapped, keyName);
        boolean rewrapSuccess = testData.equals(rewrappedDecrypted);
        
        return KeyRotationResult.builder()
            .oldVersion(currentVersion)
            .newVersion(newVersion)
            .oldDataDecryptionWorks(decryptionSuccess)
            .newEncryptionUsesNewKey(newEncryptionSuccess)
            .rewrapWorks(rewrapSuccess)
            .build();
    }
}
```

---

## 6. Validation Procedures

### 6.1 Encryption Validation Checklist

```markdown
## Data Encryption Validation Checklist

### Database Encryption
- [ ] Sensitive columns encrypted (NID, mobile, account numbers)
- [ ] Encryption at rest enabled (TDE)
- [ ] Backup encryption verified
- [ ] Key rotation procedure tested

### Application Encryption
- [ ] Field-level encryption implemented
- [ ] Document encryption working
- [ ] Encryption keys not in code
- [ ] Secure random IV generation
- [ ] Authenticated encryption (GCM) used

### Transport Encryption
- [ ] TLS 1.3 enforced
- [ ] Weak cipher suites disabled
- [ ] HSTS header configured
- [ ] Certificate valid and not expired
- [ ] Certificate chain complete

### Key Management
- [ ] Keys stored in HSM/Vault
- [ ] Key rotation automated
- [ ] Key access logged
- [ ] Emergency key revocation tested
```

### 6.2 Automated Encryption Tests

```java
@SpringBootTest
public class EncryptionValidationTest {
    
    @Autowired
    private FieldEncryptionService encryptionService;
    
    @Test
    public void testAes256Encryption() {
        String plaintext = "Test sensitive data 12345";
        
        String encrypted = encryptionService.encrypt(plaintext);
        assertNotNull(encrypted);
        assertNotEquals(plaintext, encrypted);
        
        // Verify different IVs produce different ciphertexts
        String encrypted2 = encryptionService.encrypt(plaintext);
        assertNotEquals(encrypted, encrypted2);
        
        // Verify decryption
        String decrypted = encryptionService.decrypt(encrypted);
        assertEquals(plaintext, decrypted);
    }
    
    @Test
    public void testEncryptionWithSpecialCharacters() {
        String plaintext = "Special chars: àáâãäå ñ 中文 🎉 <script>alert('xss')</script>";
        
        String encrypted = encryptionService.encrypt(plaintext);
        String decrypted = encryptionService.decrypt(encrypted);
        
        assertEquals(plaintext, decrypted);
    }
    
    @Test
    public void testTamperDetection() {
        String plaintext = "Test data";
        String encrypted = encryptionService.encrypt(plaintext);
        
        // Tamper with ciphertext
        byte[] tampered = Base64.getDecoder().decode(encrypted);
        tampered[tampered.length - 1] ^= 0xFF;
        String tamperedBase64 = Base64.getEncoder().encodeToString(tampered);
        
        // Should throw exception
        assertThrows(EncryptionException.class, () -> {
            encryptionService.decrypt(tamperedBase64);
        });
    }
    
    @Test
    public void testTlsConfiguration() {
        // Verify TLS 1.3
        SSLContext context = SSLContext.getInstance("TLSv1.3");
        context.init(null, null, null);
        
        SSLSocketFactory factory = context.getSocketFactory();
        assertNotNull(factory);
        
        // Connect and verify
        try (SSLSocket socket = (SSLSocket) factory.createSocket("ulms.bank.com", 443)) {
            socket.startHandshake();
            SSLSession session = socket.getSession();
            
            assertEquals("TLSv1.3", session.getProtocol());
            assertTrue(session.getCipherSuite().contains("TLS_AES_256_GCM_SHA384") ||
                      session.getCipherSuite().contains("TLS_AES_128_GCM_SHA256"));
        }
    }
}
```

---

## 7. Testing Tools and Scripts

### 7.1 Encryption Audit Script

```bash
#!/bin/bash
# encryption-audit.sh

echo "=== ULMS Encryption Audit ==="

# Check database encryption
echo "[*] Checking database encryption..."
psql -d ulms -c "
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name LIKE '%encrypted%'
ORDER BY table_name, column_name;
"

# Check for unencrypted sensitive data
echo "[*] Checking for unencrypted sensitive columns..."
psql -d ulms -c "
SELECT 
    table_name,
    column_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name IN ('nid', 'mobile_number', 'account_number')
AND column_name NOT LIKE '%encrypted%'
ORDER BY table_name, column_name;
"

# Check SSL/TLS configuration
echo "[*] Checking SSL/TLS..."
psql -d ulms -c "SHOW ssl;"
psql -d ulms -c "SHOW ssl_ciphers;"

# Check application properties
echo "[*] Checking application encryption config..."
grep -r "encryption\|cipher\|ssl\|tls" /opt/ulms/config/ --include="*.yml" --include="*.properties"

echo "=== Audit Complete ==="
```

### 7.2 Vulnerability Scanning

```bash
#!/bin/bash
# crypto-vulnerability-scan.sh

# Check for weak crypto in code
echo "[*] Scanning for weak cryptographic implementations..."

# Check for weak algorithms
grep -r "MD5\|SHA1\|DES\|3DES\|RC4" /opt/ulms/src --include="*.java" && echo "[!] Weak algorithms found"

# Check for hardcoded keys
grep -r "SecretKey\|PrivateKey\|getBytes()" /opt/ulms/src --include="*.java" | grep -v "test" && echo "[!] Potential hardcoded keys"

# Check for ECB mode
grep -r "/ECB/" /opt/ulms/src --include="*.java" && echo "[!] ECB mode detected"

# Check for static IV
grep -r "new IvParameterSpec" /opt/ulms/src --include="*.java" && echo "[!] Static IV detected"

# Check for weak random
grep -r "new Random()" /opt/ulms/src --include="*.java" && echo "[!] Weak Random usage"

echo "[*] Scan complete"
```

---

## 8. Remediation Guidelines

### 8.1 Common Encryption Issues

| Issue | Risk | Remediation |
|-------|------|-------------|
| Weak algorithm | High | Migrate to AES-256-GCM |
| Static IV | Critical | Generate random IV per encryption |
| ECB mode | Critical | Switch to GCM or CBC with HMAC |
| Hardcoded keys | Critical | Use key management service |
| Weak random | Medium | Use SecureRandom |
| No authentication | High | Use authenticated encryption |

### 8.2 Remediation Priority

| Priority | Issue | Timeline |
|----------|-------|----------|
| P0 | Hardcoded keys, static IV | 24 hours |
| P1 | Weak algorithms, ECB mode | 7 days |
| P2 | Weak random, no authentication | 30 days |

---

## 9. Related Documents

| Document | Purpose |
|----------|---------|
| `[SEC]_Security_Testing_Checklist_OWASP_v1.0.md` | OWASP security checklist |
| `[SEC]_Penetration_Testing_Plan_v1.0.md` | Penetration testing |
| `../Technology_Stack_Recommendation_v2.md` | Security architecture |

---

**Document Owner:** Security Lead, Unisoft Systems Limited  
**Next Review Date:** 2026-03-05  
**Classification:** Confidential

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

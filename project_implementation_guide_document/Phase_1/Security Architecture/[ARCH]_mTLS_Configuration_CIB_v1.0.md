# mTLS Configuration for CIB Integration
## Unisoft Loan Management System (ULMS) v2.0
### Certificate-Based Authentication for Bangladesh Bank CIB Online

---

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ARCH-1.4.5 |
| **Document Title** | mTLS Configuration for CIB (Certificate-based Authentication) |
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
| 1.0 | February 5, 2026 | Lead Developer | Initial mTLS Configuration Document |

---

## Table of Contents

1. [Overview](#1-overview)
2. [mTLS Architecture](#2-mtls-architecture)
3. [Certificate Management](#3-certificate-management)
4. [VPN Configuration](#4-vpn-configuration)
5. [Java Implementation](#5-java-implementation)
6. [Spring WebClient Configuration](#6-spring-webclient-configuration)
7. [Certificate Lifecycle](#7-certificate-lifecycle)
8. [Connection Pooling](#8-connection-pooling)
9. [Error Handling](#9-error-handling)
10. [Monitoring & Alerting](#10-monitoring--alerting)
11. [Troubleshooting Guide](#11-troubleshooting-guide)
12. [Operational Procedures](#12-operational-procedures)
13. [Appendices](#13-appendices)

---

## 1. Overview

### 1.1 Purpose

This document defines the mutual TLS (mTLS) configuration for secure communication between ULMS CIB Service and Bangladesh Bank's CIB Online system. It covers certificate-based authentication, VPN connectivity, and implementation guidelines.

### 1.2 Integration Context

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CIB INTEGRATION CONTEXT                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ULMS Infrastructure                          Bangladesh Bank               │
│   ┌─────────────────────┐                     ┌─────────────────────┐       │
│   │                     │                     │                     │       │
│   │   ┌─────────────┐   │      VPN Tunnel     │   ┌─────────────┐   │       │
│   │   │ CIB Service │   │═════════════════════│   │ CIB Online  │   │       │
│   │   │ (Spring)    │   │      IPSec          │   │    API      │   │       │
│   │   └──────┬──────┘   │                     │   └──────┬──────┘   │       │
│   │          │          │                     │          │          │       │
│   │          │ mTLS     │                     │          │ mTLS     │       │
│   │          │          │                     │          │          │       │
│   │   ┌──────┴──────┐   │                     │   ┌──────┴──────┐   │       │
│   │   │   Client    │   │                     │   │   Server    │   │       │
│   │   │ Certificate │   │◀───────────────────▶│   │ Certificate │   │       │
│   │   │ (ULMS)      │   │    Mutual Auth      │   │ (BB CA)     │   │       │
│   │   └─────────────┘   │                     │   └─────────────┘   │       │
│   │                     │                     │                     │       │
│   └─────────────────────┘                     └─────────────────────┘       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Security Requirements

| Requirement | Specification | Source |
|-------------|---------------|--------|
| **Protocol** | TLS 1.3 | ICT Security V4.0 |
| **Authentication** | Mutual TLS (X.509) | Bangladesh Bank |
| **Key Algorithm** | RSA-4096 | Security Policy |
| **Certificate Validity** | 1 year | Bangladesh Bank |
| **Certificate Authority** | Bangladesh Bank CA | Bangladesh Bank |
| **Network** | VPN over IPSec | Bangladesh Bank |

---

## 2. mTLS Architecture

### 2.1 Mutual TLS Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    mTLS HANDSHAKE FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ULMS CIB Service                              BB CIB Online Server         │
│   ┌────────────────┐                           ┌────────────────┐           │
│   │                │                           │                │           │
│   │                │  1. ClientHello           │                │           │
│   │                │  (TLS 1.3, ciphers)       │                │           │
│   │                │─────────────────────────▶│                │           │
│   │                │                           │                │           │
│   │                │  2. ServerHello           │                │           │
│   │                │  + Server Certificate     │                │           │
│   │                │  + CertificateRequest     │                │           │
│   │                │◀─────────────────────────│                │           │
│   │                │                           │                │           │
│   │  3. Validate   │                           │                │           │
│   │  Server Cert   │                           │                │           │
│   │  (BB CA)       │                           │                │           │
│   │                │                           │                │           │
│   │                │  4. Client Certificate    │                │           │
│   │                │  + CertificateVerify      │                │           │
│   │                │  + Finished               │                │           │
│   │                │─────────────────────────▶│                │           │
│   │                │                           │  5. Validate   │           │
│   │                │                           │  Client Cert   │           │
│   │                │                           │  (ULMS/Bank)   │           │
│   │                │                           │                │           │
│   │                │  6. Finished              │                │           │
│   │                │◀─────────────────────────│                │           │
│   │                │                           │                │           │
│   │                │  === Encrypted Channel === │                │           │
│   │                │                           │                │           │
│   │                │  7. CIB Inquiry Request   │                │           │
│   │                │─────────────────────────▶│                │           │
│   │                │                           │                │           │
│   │                │  8. CIB Report Response   │                │           │
│   │                │◀─────────────────────────│                │           │
│   │                │                           │                │           │
│   └────────────────┘                           └────────────────┘           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Certificate Trust Chain

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CERTIFICATE TRUST CHAIN                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Bangladesh Bank PKI                          ULMS PKI                      │
│   ┌─────────────────────────┐                 ┌─────────────────────────┐   │
│   │                         │                 │                         │   │
│   │  ┌─────────────────┐    │                 │  ┌─────────────────┐    │   │
│   │  │  BB Root CA     │    │                 │  │  ULMS Root CA   │    │   │
│   │  │  (Self-signed)  │    │                 │  │  (Self-signed)  │    │   │
│   │  └────────┬────────┘    │                 │  └────────┬────────┘    │   │
│   │           │             │                 │           │             │   │
│   │           ▼             │                 │           ▼             │   │
│   │  ┌─────────────────┐    │                 │  ┌─────────────────┐    │   │
│   │  │ BB CIB Issuing  │    │                 │  │ ULMS Issuing    │    │   │
│   │  │      CA         │    │                 │  │      CA         │    │   │
│   │  └────────┬────────┘    │                 │  └────────┬────────┘    │   │
│   │           │             │                 │           │             │   │
│   │           ▼             │                 │           ▼             │   │
│   │  ┌─────────────────┐    │                 │  ┌─────────────────┐    │   │
│   │  │ CIB Server      │    │    Mutual       │  │ ULMS Client     │    │   │
│   │  │ Certificate     │◀───┼────Trust────────┼──│ Certificate     │    │   │
│   │  │                 │    │                 │  │                 │    │   │
│   │  │ CN: cib.bb.org  │    │                 │  │ CN: cib-client  │    │   │
│   │  │     .bd         │    │                 │  │ .ulms.unisoft   │    │   │
│   │  │                 │    │                 │  │ .com.bd         │    │   │
│   │  └─────────────────┘    │                 │  └─────────────────┘    │   │
│   │                         │                 │                         │   │
│   └─────────────────────────┘                 └─────────────────────────┘   │
│                                                                              │
│   TrustStore Contents:                        KeyStore Contents:            │
│   • BB Root CA                                • ULMS Client Cert            │
│   • BB CIB Issuing CA                         • ULMS Client Private Key     │
│   • (For server validation)                   • (For client auth)           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Certificate Management

### 3.1 Certificate Specifications

**Client Certificate (ULMS):**

| Attribute | Value |
|-----------|-------|
| **Subject CN** | cib-client.ulms.unisoft.com.bd |
| **Subject O** | Unisoft Systems Limited |
| **Subject OU** | CIB Integration |
| **Subject C** | BD |
| **Subject L** | Dhaka |
| **Key Algorithm** | RSA |
| **Key Size** | 4096 bits |
| **Signature Algorithm** | SHA-384 with RSA |
| **Validity Period** | 1 year |
| **Key Usage** | Digital Signature, Key Encipherment |
| **Extended Key Usage** | TLS Web Client Authentication |

**Certificate Signing Request (CSR):**

```bash
# Generate private key
openssl genrsa -aes256 -out ulms-cib-client.key 4096

# Generate CSR
openssl req -new -key ulms-cib-client.key \
    -out ulms-cib-client.csr \
    -subj "/C=BD/ST=Dhaka/L=Dhaka/O=Unisoft Systems Limited/OU=CIB Integration/CN=cib-client.ulms.unisoft.com.bd" \
    -config <(cat <<EOF
[req]
default_bits = 4096
prompt = no
default_md = sha384
distinguished_name = dn
req_extensions = v3_req

[dn]
C = BD
ST = Dhaka
L = Dhaka
O = Unisoft Systems Limited
OU = CIB Integration
CN = cib-client.ulms.unisoft.com.bd

[v3_req]
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = clientAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = cib-client.ulms.unisoft.com.bd
DNS.2 = cib-service.ulms-production.svc.cluster.local
EOF
)
```

### 3.2 KeyStore Configuration

**Create PKCS12 KeyStore:**

```bash
#!/bin/bash
# create-cib-keystore.sh

CERT_DIR="/etc/ulms/certs/cib"
KEYSTORE_DIR="/etc/ulms/keystores"
KEYSTORE_PASSWORD="$VAULT_KEYSTORE_PASSWORD"

# Combine certificate chain
cat $CERT_DIR/ulms-cib-client.crt \
    $CERT_DIR/ulms-issuing-ca.crt \
    > $CERT_DIR/ulms-cib-chain.crt

# Create PKCS12 keystore
openssl pkcs12 -export \
    -in $CERT_DIR/ulms-cib-chain.crt \
    -inkey $CERT_DIR/ulms-cib-client.key \
    -out $KEYSTORE_DIR/ulms-cib-keystore.p12 \
    -name "ulms-cib-client" \
    -passout pass:$KEYSTORE_PASSWORD \
    -passin pass:$KEY_PASSWORD

# Verify keystore
keytool -list -keystore $KEYSTORE_DIR/ulms-cib-keystore.p12 \
    -storetype PKCS12 \
    -storepass $KEYSTORE_PASSWORD

echo "KeyStore created: $KEYSTORE_DIR/ulms-cib-keystore.p12"
```

### 3.3 TrustStore Configuration

**Create TrustStore with BB CA:**

```bash
#!/bin/bash
# create-cib-truststore.sh

CERT_DIR="/etc/ulms/certs/cib"
TRUSTSTORE_DIR="/etc/ulms/keystores"
TRUSTSTORE_PASSWORD="$VAULT_TRUSTSTORE_PASSWORD"

# Create truststore with BB Root CA
keytool -importcert -noprompt \
    -keystore $TRUSTSTORE_DIR/ulms-cib-truststore.jks \
    -storetype JKS \
    -storepass $TRUSTSTORE_PASSWORD \
    -alias "bb-root-ca" \
    -file $CERT_DIR/bb-root-ca.crt

# Import BB Issuing CA
keytool -importcert -noprompt \
    -keystore $TRUSTSTORE_DIR/ulms-cib-truststore.jks \
    -storetype JKS \
    -storepass $TRUSTSTORE_PASSWORD \
    -alias "bb-cib-issuing-ca" \
    -file $CERT_DIR/bb-cib-issuing-ca.crt

# Verify truststore
keytool -list -keystore $TRUSTSTORE_DIR/ulms-cib-truststore.jks \
    -storepass $TRUSTSTORE_PASSWORD

echo "TrustStore created: $TRUSTSTORE_DIR/ulms-cib-truststore.jks"
```

### 3.4 Vault Storage for Certificates

```bash
# Store certificates in Vault
vault kv put secret/ulms/cib/certificates \
    client_cert="$(cat ulms-cib-client.crt | base64)" \
    client_key="$(cat ulms-cib-client.key | base64)" \
    ca_chain="$(cat bb-ca-chain.crt | base64)" \
    keystore="$(cat ulms-cib-keystore.p12 | base64)" \
    keystore_password="$KEYSTORE_PASSWORD" \
    truststore="$(cat ulms-cib-truststore.jks | base64)" \
    truststore_password="$TRUSTSTORE_PASSWORD" \
    expiry_date="2027-02-04"
```

---

## 4. VPN Configuration

### 4.1 IPSec VPN Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    VPN TUNNEL ARCHITECTURE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ULMS Data Center                              Bangladesh Bank DC           │
│   ┌─────────────────────────┐                 ┌─────────────────────────┐   │
│   │  Internal Network       │                 │  BB Internal Network    │   │
│   │  10.10.0.0/16           │                 │  172.16.0.0/12          │   │
│   │                         │                 │                         │   │
│   │  ┌─────────────────┐    │                 │  ┌─────────────────┐    │   │
│   │  │ CIB Service     │    │                 │  │ CIB API Server  │    │   │
│   │  │ 10.10.1.50      │    │                 │  │ 172.16.100.10   │    │   │
│   │  └────────┬────────┘    │                 │  └────────┬────────┘    │   │
│   │           │             │                 │           │             │   │
│   │           ▼             │                 │           ▼             │   │
│   │  ┌─────────────────┐    │                 │  ┌─────────────────┐    │   │
│   │  │ VPN Gateway     │    │  IPSec Tunnel   │  │ VPN Gateway     │    │   │
│   │  │ (StrongSwan)    │════╬════════════════╬════│ (Cisco ASA)     │    │   │
│   │  │                 │    │  IKEv2 + ESP    │  │                 │    │   │
│   │  │ Public IP:      │    │  AES-256-GCM    │  │ Public IP:      │    │   │
│   │  │ 203.0.113.10    │    │                 │  │ 203.0.113.20    │    │   │
│   │  └─────────────────┘    │                 │  └─────────────────┘    │   │
│   │                         │                 │                         │   │
│   └─────────────────────────┘                 └─────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 StrongSwan Configuration

```conf
# /etc/ipsec.conf - StrongSwan IPSec Configuration

config setup
    charondebug="ike 2, knl 2, cfg 2, net 2, esp 2, dmn 2, mgr 2"
    uniqueids=yes

conn %default
    ikelifetime=28800s
    keylife=3600s
    rekeymargin=3m
    keyingtries=3
    keyexchange=ikev2
    authby=secret
    mobike=no

conn ulms-to-bb-cib
    left=203.0.113.10
    leftsubnet=10.10.0.0/16
    leftid=@vpn.ulms.unisoft.com.bd
    leftfirewall=yes
    right=203.0.113.20
    rightsubnet=172.16.0.0/12
    rightid=@vpn.bb.org.bd
    ike=aes256-sha384-modp4096!
    esp=aes256gcm16-modp4096!
    auto=start
    dpdaction=restart
    dpddelay=30s
    dpdtimeout=120s
```

```conf
# /etc/ipsec.secrets - Pre-Shared Key
@vpn.ulms.unisoft.com.bd @vpn.bb.org.bd : PSK "${VPN_PSK}"
```

### 4.3 Firewall Rules

```bash
#!/bin/bash
# cib-firewall-rules.sh

# Allow VPN traffic
iptables -A INPUT -p udp --dport 500 -j ACCEPT   # IKE
iptables -A INPUT -p udp --dport 4500 -j ACCEPT  # NAT-T
iptables -A INPUT -p esp -j ACCEPT               # ESP

# Allow CIB traffic through tunnel
iptables -A FORWARD -s 10.10.0.0/16 -d 172.16.100.0/24 -j ACCEPT
iptables -A FORWARD -s 172.16.100.0/24 -d 10.10.0.0/16 -j ACCEPT

# Restrict CIB service to specific source IPs
iptables -A OUTPUT -s 10.10.1.50 -d 172.16.100.10 -p tcp --dport 443 -j ACCEPT
iptables -A OUTPUT -s 10.10.1.50 -d 172.16.100.10 -j DROP

# Log dropped packets
iptables -A INPUT -j LOG --log-prefix "CIB-DROPPED: "
```

---

## 5. Java Implementation

### 5.1 SSL Context Configuration

```java
@Configuration
public class CibSslConfig {

    @Value("${cib.ssl.keystore-path}")
    private String keystorePath;

    @Value("${cib.ssl.keystore-password}")
    private String keystorePassword;

    @Value("${cib.ssl.truststore-path}")
    private String truststorePath;

    @Value("${cib.ssl.truststore-password}")
    private String truststorePassword;

    @Bean
    public SSLContext cibSslContext() throws Exception {
        // Load KeyStore (client certificate)
        KeyStore keyStore = KeyStore.getInstance("PKCS12");
        try (InputStream kis = new FileInputStream(keystorePath)) {
            keyStore.load(kis, keystorePassword.toCharArray());
        }

        // Load TrustStore (BB CA certificates)
        KeyStore trustStore = KeyStore.getInstance("JKS");
        try (InputStream tis = new FileInputStream(truststorePath)) {
            trustStore.load(tis, truststorePassword.toCharArray());
        }

        // Initialize KeyManagerFactory
        KeyManagerFactory kmf = KeyManagerFactory.getInstance(
            KeyManagerFactory.getDefaultAlgorithm()
        );
        kmf.init(keyStore, keystorePassword.toCharArray());

        // Initialize TrustManagerFactory
        TrustManagerFactory tmf = TrustManagerFactory.getInstance(
            TrustManagerFactory.getDefaultAlgorithm()
        );
        tmf.init(trustStore);

        // Create SSL Context
        SSLContext sslContext = SSLContext.getInstance("TLSv1.3");
        sslContext.init(kmf.getKeyManagers(), tmf.getTrustManagers(), new SecureRandom());

        return sslContext;
    }

    @Bean
    public SSLConnectionSocketFactory cibSslSocketFactory(SSLContext sslContext) {
        return new SSLConnectionSocketFactory(
            sslContext,
            new String[]{"TLSv1.3"},
            new String[]{
                "TLS_AES_256_GCM_SHA384",
                "TLS_CHACHA20_POLY1305_SHA256"
            },
            SSLConnectionSocketFactory.getDefaultHostnameVerifier()
        );
    }
}
```

### 5.2 Certificate Loading from Vault

```java
@Service
@Slf4j
public class CibCertificateService {

    private final VaultTemplate vaultTemplate;
    private final String certPath = "secret/data/ulms/cib/certificates";

    @Cacheable(value = "cib-certificates", key = "'keystore'")
    public KeyStore loadKeyStore() {
        try {
            VaultKeyValueOperations kv = vaultTemplate.opsForKeyValue(
                "secret", VaultKeyValueOperations.Version.V2);

            Map<String, Object> data = kv.get("ulms/cib/certificates").getData();

            // Decode keystore from base64
            byte[] keystoreBytes = Base64.getDecoder().decode(
                (String) data.get("keystore")
            );
            String password = (String) data.get("keystore_password");

            // Load keystore
            KeyStore keyStore = KeyStore.getInstance("PKCS12");
            keyStore.load(new ByteArrayInputStream(keystoreBytes),
                         password.toCharArray());

            log.info("CIB KeyStore loaded successfully");
            return keyStore;

        } catch (Exception e) {
            log.error("Failed to load CIB KeyStore from Vault", e);
            throw new CertificateLoadException("KeyStore load failed", e);
        }
    }

    @Cacheable(value = "cib-certificates", key = "'truststore'")
    public KeyStore loadTrustStore() {
        try {
            VaultKeyValueOperations kv = vaultTemplate.opsForKeyValue(
                "secret", VaultKeyValueOperations.Version.V2);

            Map<String, Object> data = kv.get("ulms/cib/certificates").getData();

            // Decode truststore from base64
            byte[] truststoreBytes = Base64.getDecoder().decode(
                (String) data.get("truststore")
            );
            String password = (String) data.get("truststore_password");

            // Load truststore
            KeyStore trustStore = KeyStore.getInstance("JKS");
            trustStore.load(new ByteArrayInputStream(truststoreBytes),
                           password.toCharArray());

            log.info("CIB TrustStore loaded successfully");
            return trustStore;

        } catch (Exception e) {
            log.error("Failed to load CIB TrustStore from Vault", e);
            throw new CertificateLoadException("TrustStore load failed", e);
        }
    }

    public LocalDate getCertificateExpiryDate() {
        try {
            KeyStore keyStore = loadKeyStore();
            X509Certificate cert = (X509Certificate) keyStore.getCertificate("ulms-cib-client");
            return cert.getNotAfter().toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDate();
        } catch (Exception e) {
            log.error("Failed to get certificate expiry", e);
            return null;
        }
    }

    @Scheduled(cron = "0 0 9 * * ?") // Daily at 9 AM
    public void checkCertificateExpiry() {
        LocalDate expiry = getCertificateExpiryDate();
        if (expiry != null) {
            long daysUntilExpiry = ChronoUnit.DAYS.between(LocalDate.now(), expiry);

            if (daysUntilExpiry <= 30) {
                alertCertificateExpiry(daysUntilExpiry);
            }
        }
    }

    private void alertCertificateExpiry(long days) {
        log.warn("CIB Certificate expiring in {} days!", days);
        // Send alert to security team
        notificationService.sendAlert(
            "CIB Certificate Expiry Warning",
            String.format("CIB client certificate expires in %d days. Please initiate renewal.", days),
            AlertSeverity.HIGH
        );
    }
}
```

---

## 6. Spring WebClient Configuration

### 6.1 WebClient with mTLS

```java
@Configuration
public class CibWebClientConfig {

    @Autowired
    private CibCertificateService certificateService;

    @Bean
    @Qualifier("cibWebClient")
    public WebClient cibWebClient(
            @Value("${cib.api.base-url}") String baseUrl,
            @Value("${cib.api.timeout-seconds:120}") int timeout) {

        // Create SSL Context with mTLS
        SslContext sslContext = createSslContext();

        // Create HTTP client with SSL
        HttpClient httpClient = HttpClient.create()
            .secure(spec -> spec.sslContext(sslContext))
            .responseTimeout(Duration.ofSeconds(timeout))
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 30000)
            .doOnConnected(conn -> conn
                .addHandlerLast(new ReadTimeoutHandler(timeout))
                .addHandlerLast(new WriteTimeoutHandler(30))
            )
            .wiretap("reactor.netty.http.client.HttpClient", LogLevel.DEBUG, AdvancedByteBufFormat.TEXTUAL);

        return WebClient.builder()
            .baseUrl(baseUrl)
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
            .filter(logRequest())
            .filter(logResponse())
            .filter(retryFilter())
            .build();
    }

    private SslContext createSslContext() {
        try {
            KeyStore keyStore = certificateService.loadKeyStore();
            KeyStore trustStore = certificateService.loadTrustStore();

            // Get private key and certificate chain
            String alias = keyStore.aliases().nextElement();
            PrivateKey privateKey = (PrivateKey) keyStore.getKey(alias,
                certificateService.getKeystorePassword().toCharArray());
            Certificate[] certChain = keyStore.getCertificateChain(alias);

            // Convert to X509 certificates
            X509Certificate[] x509Chain = Arrays.stream(certChain)
                .map(cert -> (X509Certificate) cert)
                .toArray(X509Certificate[]::new);

            // Get trusted certificates
            List<X509Certificate> trustedCerts = new ArrayList<>();
            Enumeration<String> aliases = trustStore.aliases();
            while (aliases.hasMoreElements()) {
                String trustAlias = aliases.nextElement();
                if (trustStore.isCertificateEntry(trustAlias)) {
                    trustedCerts.add((X509Certificate) trustStore.getCertificate(trustAlias));
                }
            }

            // Build SSL Context
            return SslContextBuilder.forClient()
                .keyManager(privateKey, x509Chain)
                .trustManager(trustedCerts.toArray(new X509Certificate[0]))
                .protocols("TLSv1.3")
                .ciphers(Arrays.asList(
                    "TLS_AES_256_GCM_SHA384",
                    "TLS_CHACHA20_POLY1305_SHA256"
                ))
                .build();

        } catch (Exception e) {
            throw new SslConfigurationException("Failed to create SSL context", e);
        }
    }

    private ExchangeFilterFunction logRequest() {
        return ExchangeFilterFunction.ofRequestProcessor(request -> {
            log.info("CIB Request: {} {}", request.method(), request.url());
            // Don't log body - may contain sensitive data
            return Mono.just(request);
        });
    }

    private ExchangeFilterFunction logResponse() {
        return ExchangeFilterFunction.ofResponseProcessor(response -> {
            log.info("CIB Response: {}", response.statusCode());
            return Mono.just(response);
        });
    }

    private ExchangeFilterFunction retryFilter() {
        return (request, next) -> next.exchange(request)
            .retryWhen(Retry.backoff(3, Duration.ofSeconds(5))
                .filter(throwable -> throwable instanceof WebClientRequestException)
                .onRetryExhaustedThrow((retryBackoffSpec, retrySignal) ->
                    new CibConnectionException("CIB connection failed after retries",
                        retrySignal.failure())
                )
            );
    }
}
```

### 6.2 CIB Service Implementation

```java
@Service
@Slf4j
public class CibApiService {

    private final WebClient cibWebClient;
    private final EncryptionService encryptionService;
    private final CircuitBreakerFactory circuitBreakerFactory;

    private static final String CIB_INQUIRY_PATH = "/api/v2/inquiry";

    @Autowired
    public CibApiService(
            @Qualifier("cibWebClient") WebClient cibWebClient,
            EncryptionService encryptionService,
            CircuitBreakerFactory circuitBreakerFactory) {
        this.cibWebClient = cibWebClient;
        this.encryptionService = encryptionService;
        this.circuitBreakerFactory = circuitBreakerFactory;
    }

    public Mono<CibReportResponse> inquireCib(CibInquiryRequest request) {
        // Encrypt NID before sending
        String encryptedNid = encryptionService.encrypt(
            request.getNidNumber(), "ulms-nid-encryption");

        CibApiRequest apiRequest = CibApiRequest.builder()
            .inquiryType(request.getInquiryType())
            .encryptedNid(encryptedNid)
            .dateOfBirth(request.getDateOfBirth())
            .purpose(request.getPurpose())
            .referenceNumber(request.getApplicationReference())
            .requestTimestamp(Instant.now())
            .build();

        CircuitBreaker circuitBreaker = circuitBreakerFactory.create("cib-inquiry");

        return cibWebClient.post()
            .uri(CIB_INQUIRY_PATH)
            .body(Mono.just(apiRequest), CibApiRequest.class)
            .retrieve()
            .onStatus(HttpStatusCode::is4xxClientError, response ->
                response.bodyToMono(String.class)
                    .flatMap(body -> Mono.error(new CibClientException(body)))
            )
            .onStatus(HttpStatusCode::is5xxServerError, response ->
                response.bodyToMono(String.class)
                    .flatMap(body -> Mono.error(new CibServerException(body)))
            )
            .bodyToMono(CibReportResponse.class)
            .transform(it -> circuitBreaker.run(it, throwable -> {
                log.error("CIB circuit breaker triggered", throwable);
                return Mono.error(new CibUnavailableException("CIB service unavailable"));
            }))
            .doOnSuccess(response ->
                log.info("CIB inquiry successful for reference: {}",
                    request.getApplicationReference())
            )
            .doOnError(error ->
                log.error("CIB inquiry failed for reference: {}",
                    request.getApplicationReference(), error)
            );
    }
}
```

---

## 7. Certificate Lifecycle

### 7.1 Lifecycle Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CERTIFICATE LIFECYCLE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│     T-60 Days           T-30 Days           T-14 Days           Expiry      │
│        │                   │                   │                   │         │
│        ▼                   ▼                   ▼                   ▼         │
│   ┌─────────┐         ┌─────────┐         ┌─────────┐         ┌─────────┐  │
│   │ Generate│         │ Submit  │         │ Install │         │ Verify  │  │
│   │   CSR   │────────▶│  to BB  │────────▶│   New   │────────▶│   &     │  │
│   │         │         │         │         │  Cert   │         │ Rotate  │  │
│   └─────────┘         └─────────┘         └─────────┘         └─────────┘  │
│        │                   │                   │                   │         │
│        ▼                   ▼                   ▼                   ▼         │
│   • Generate new      • Submit CSR to     • Receive signed    • Update    │
│     4096-bit RSA        Bangladesh Bank     certificate         Vault      │
│   • Create CSR with   • Follow BB CSR     • Create new        • Update    │
│     correct DN          submission          KeyStore            KeyStore   │
│   • Store private       process           • Test mTLS         • Verify    │
│     key securely      • Track ticket        connection          connectivity│
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    AUTOMATED ALERTS                                 │   │
│   │  • 60 days before: Info - Start renewal process                    │   │
│   │  • 30 days before: Warning - Submit CSR to BB                      │   │
│   │  • 14 days before: High - Install new certificate                  │   │
│   │  • 7 days before: Critical - Immediate action required             │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Certificate Renewal Script

```bash
#!/bin/bash
# renew-cib-certificate.sh

set -e

CERT_DIR="/etc/ulms/certs/cib"
VAULT_ADDR="https://vault.ulms.internal:8200"
DATE=$(date +%Y%m%d)

echo "=== CIB Certificate Renewal Process ==="

# Step 1: Generate new private key
echo "Step 1: Generating new private key..."
openssl genrsa -aes256 \
    -passout pass:${KEY_PASSWORD} \
    -out $CERT_DIR/ulms-cib-client-$DATE.key 4096

# Step 2: Generate CSR
echo "Step 2: Generating CSR..."
openssl req -new \
    -key $CERT_DIR/ulms-cib-client-$DATE.key \
    -passin pass:${KEY_PASSWORD} \
    -out $CERT_DIR/ulms-cib-client-$DATE.csr \
    -config /etc/ulms/certs/cib-csr.cnf

# Step 3: Display CSR for submission
echo "Step 3: CSR generated. Submit to Bangladesh Bank:"
echo "=========================================="
cat $CERT_DIR/ulms-cib-client-$DATE.csr
echo "=========================================="

# Step 4: Wait for signed certificate
echo "Step 4: Waiting for signed certificate from Bangladesh Bank..."
echo "  - Save the signed certificate as: $CERT_DIR/ulms-cib-client-$DATE.crt"
echo "  - Then run: $0 --install"

if [ "$1" == "--install" ]; then
    echo "Step 5: Installing new certificate..."

    # Create new keystore
    openssl pkcs12 -export \
        -in $CERT_DIR/ulms-cib-client-$DATE.crt \
        -inkey $CERT_DIR/ulms-cib-client-$DATE.key \
        -passin pass:${KEY_PASSWORD} \
        -out $CERT_DIR/ulms-cib-keystore-$DATE.p12 \
        -name "ulms-cib-client" \
        -passout pass:${KEYSTORE_PASSWORD} \
        -certfile $CERT_DIR/bb-ca-chain.crt

    # Update Vault
    echo "Step 6: Updating Vault..."
    vault kv put secret/ulms/cib/certificates \
        client_cert="$(base64 $CERT_DIR/ulms-cib-client-$DATE.crt)" \
        client_key="$(base64 $CERT_DIR/ulms-cib-client-$DATE.key)" \
        keystore="$(base64 $CERT_DIR/ulms-cib-keystore-$DATE.p12)" \
        keystore_password="${KEYSTORE_PASSWORD}" \
        expiry_date="$(date -d '+1 year' +%Y-%m-%d)"

    # Restart CIB service to pick up new certificate
    echo "Step 7: Restarting CIB service..."
    kubectl rollout restart deployment/cib-service -n ulms-production

    echo "Certificate renewal complete!"
fi
```

---

## 8. Connection Pooling

### 8.1 Connection Pool Configuration

```java
@Configuration
public class CibConnectionPoolConfig {

    @Bean
    public ConnectionProvider cibConnectionProvider() {
        return ConnectionProvider.builder("cib-pool")
            .maxConnections(50)                    // Max connections
            .maxIdleTime(Duration.ofMinutes(5))   // Idle connection timeout
            .maxLifeTime(Duration.ofMinutes(30))  // Max connection lifetime
            .pendingAcquireTimeout(Duration.ofSeconds(30))
            .pendingAcquireMaxCount(100)
            .evictInBackground(Duration.ofSeconds(120))
            .metrics(true)
            .build();
    }

    @Bean
    @Qualifier("cibHttpClient")
    public HttpClient cibHttpClient(
            ConnectionProvider connectionProvider,
            SslContext sslContext) {

        return HttpClient.create(connectionProvider)
            .secure(spec -> spec.sslContext(sslContext))
            .option(ChannelOption.SO_KEEPALIVE, true)
            .option(ChannelOption.TCP_NODELAY, true)
            .responseTimeout(Duration.ofSeconds(120))
            .compress(true);
    }
}
```

### 8.2 Connection Metrics

```java
@Component
@Slf4j
public class CibConnectionMetrics {

    private final MeterRegistry meterRegistry;

    @EventListener(ApplicationReadyEvent.class)
    public void registerMetrics() {
        // Connection pool metrics are auto-registered via Micrometer
        // Additional custom metrics

        Gauge.builder("cib.ssl.certificate.days_until_expiry", this::getCertificateDaysUntilExpiry)
            .description("Days until CIB certificate expires")
            .register(meterRegistry);
    }

    private double getCertificateDaysUntilExpiry() {
        try {
            // Get expiry from certificate
            LocalDate expiry = certificateService.getCertificateExpiryDate();
            return ChronoUnit.DAYS.between(LocalDate.now(), expiry);
        } catch (Exception e) {
            return -1;
        }
    }
}
```

---

## 9. Error Handling

### 9.1 SSL/TLS Exception Handling

```java
@ControllerAdvice
@Slf4j
public class CibSslExceptionHandler {

    @ExceptionHandler(SSLHandshakeException.class)
    public ResponseEntity<ErrorResponse> handleSslHandshake(SSLHandshakeException e) {
        log.error("CIB SSL handshake failed", e);

        String message = "CIB connection security error";
        if (e.getMessage().contains("certificate")) {
            message = "CIB certificate validation failed";
        } else if (e.getMessage().contains("handshake")) {
            message = "CIB TLS handshake failed";
        }

        return ResponseEntity
            .status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(new ErrorResponse("CIB_SSL_ERROR", message));
    }

    @ExceptionHandler(CertificateExpiredException.class)
    public ResponseEntity<ErrorResponse> handleCertExpired(CertificateExpiredException e) {
        log.error("CIB certificate expired", e);

        // Alert security team
        alertService.sendCriticalAlert("CIB Certificate Expired", e.getMessage());

        return ResponseEntity
            .status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(new ErrorResponse("CIB_CERT_EXPIRED",
                "CIB service temporarily unavailable"));
    }

    @ExceptionHandler(WebClientRequestException.class)
    public ResponseEntity<ErrorResponse> handleConnectionError(WebClientRequestException e) {
        log.error("CIB connection error", e);

        if (e.getCause() instanceof SSLException) {
            return handleSslError((SSLException) e.getCause());
        }

        return ResponseEntity
            .status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(new ErrorResponse("CIB_CONNECTION_ERROR",
                "Unable to connect to CIB service"));
    }

    private ResponseEntity<ErrorResponse> handleSslError(SSLException e) {
        String errorCode = "CIB_SSL_ERROR";
        String message = "CIB SSL/TLS error";

        if (e instanceof SSLPeerUnverifiedException) {
            errorCode = "CIB_PEER_UNVERIFIED";
            message = "CIB server certificate verification failed";
        }

        return ResponseEntity
            .status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(new ErrorResponse(errorCode, message));
    }
}
```

### 9.2 Circuit Breaker Configuration

```java
@Configuration
public class CibCircuitBreakerConfig {

    @Bean
    public Customizer<Resilience4JCircuitBreakerFactory> cibCircuitBreakerCustomizer() {
        return factory -> factory.configureDefault(id -> new Resilience4JConfigBuilder(id)
            .circuitBreakerConfig(CircuitBreakerConfig.custom()
                .failureRateThreshold(50)
                .slowCallRateThreshold(80)
                .slowCallDurationThreshold(Duration.ofSeconds(60))
                .waitDurationInOpenState(Duration.ofMinutes(1))
                .permittedNumberOfCallsInHalfOpenState(5)
                .slidingWindowSize(10)
                .slidingWindowType(CircuitBreakerConfig.SlidingWindowType.COUNT_BASED)
                .minimumNumberOfCalls(5)
                .recordExceptions(
                    WebClientRequestException.class,
                    SSLException.class,
                    ConnectException.class
                )
                .ignoreExceptions(
                    CibClientException.class  // 4xx errors
                )
                .build()
            )
            .timeLimiterConfig(TimeLimiterConfig.custom()
                .timeoutDuration(Duration.ofSeconds(120))
                .build()
            )
            .build()
        );
    }
}
```

---

## 10. Monitoring & Alerting

### 10.1 Prometheus Metrics

```yaml
# CIB mTLS Metrics
- cib_mtls_handshake_total{status="success|failure"}
- cib_mtls_handshake_duration_seconds
- cib_certificate_expiry_days
- cib_connection_pool_active
- cib_connection_pool_idle
- cib_connection_pool_pending
- cib_request_total{status="2xx|4xx|5xx"}
- cib_request_duration_seconds
- cib_circuit_breaker_state{state="closed|open|half_open"}
```

### 10.2 Alert Rules

```yaml
groups:
  - name: cib-mtls-alerts
    rules:
      - alert: CibCertificateExpiringSoon
        expr: cib_certificate_expiry_days < 30
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "CIB certificate expiring in {{ $value }} days"
          runbook: "https://wiki.ulms/runbooks/cib-cert-renewal"

      - alert: CibCertificateCritical
        expr: cib_certificate_expiry_days < 7
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "CRITICAL: CIB certificate expires in {{ $value }} days"

      - alert: CibMtlsHandshakeFailures
        expr: rate(cib_mtls_handshake_total{status="failure"}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High rate of CIB mTLS handshake failures"

      - alert: CibCircuitBreakerOpen
        expr: cib_circuit_breaker_state{state="open"} == 1
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "CIB circuit breaker is OPEN"
```

### 10.3 Health Check Endpoint

```java
@Component
public class CibHealthIndicator implements HealthIndicator {

    private final CibCertificateService certificateService;
    private final WebClient cibWebClient;

    @Override
    public Health health() {
        Health.Builder builder = Health.up();

        // Check certificate expiry
        LocalDate expiry = certificateService.getCertificateExpiryDate();
        long daysUntilExpiry = ChronoUnit.DAYS.between(LocalDate.now(), expiry);

        builder.withDetail("certificateExpiry", expiry.toString())
               .withDetail("daysUntilExpiry", daysUntilExpiry);

        if (daysUntilExpiry < 7) {
            builder.down().withDetail("error", "Certificate expiring soon");
            return builder.build();
        }

        // Check connectivity (lightweight ping)
        try {
            cibWebClient.get()
                .uri("/health")
                .retrieve()
                .toBodilessEntity()
                .block(Duration.ofSeconds(10));

            builder.withDetail("connectivity", "OK");
        } catch (Exception e) {
            builder.down().withDetail("connectivity", "FAILED")
                   .withDetail("error", e.getMessage());
        }

        return builder.build();
    }
}
```

---

## 11. Troubleshooting Guide

### 11.1 Common SSL/TLS Errors

| Error | Possible Cause | Solution |
|-------|---------------|----------|
| `PKIX path building failed` | Missing CA certificate in truststore | Add BB CA chain to truststore |
| `Received fatal alert: certificate_unknown` | Client cert not trusted by server | Verify cert signed by BB CA |
| `SSLHandshakeException: No appropriate protocol` | TLS version mismatch | Enable TLS 1.3 on both sides |
| `Received fatal alert: handshake_failure` | Cipher suite mismatch | Check supported ciphers |
| `Certificate expired` | Client/server cert expired | Renew expired certificate |
| `Connection reset` | VPN tunnel down | Check VPN status |

### 11.2 Diagnostic Commands

```bash
# Test TLS connection
openssl s_client -connect cib.bb.org.bd:443 \
    -cert /etc/ulms/certs/ulms-cib-client.crt \
    -key /etc/ulms/certs/ulms-cib-client.key \
    -CAfile /etc/ulms/certs/bb-ca-chain.crt \
    -tls1_3 -state -debug

# Verify certificate chain
openssl verify -CAfile bb-root-ca.crt \
    -untrusted bb-cib-issuing-ca.crt \
    ulms-cib-client.crt

# Check certificate expiry
openssl x509 -in ulms-cib-client.crt -noout -dates

# Test KeyStore
keytool -list -v -keystore ulms-cib-keystore.p12 \
    -storetype PKCS12 -storepass $PASSWORD

# Check VPN tunnel
ipsec status ulms-to-bb-cib

# Test connectivity through VPN
curl -v --cert ulms-cib-client.crt \
    --key ulms-cib-client.key \
    --cacert bb-ca-chain.crt \
    https://172.16.100.10:443/health
```

### 11.3 Java Debug Flags

```bash
# Enable SSL debugging
java -Djavax.net.debug=ssl:handshake:verbose \
     -Djavax.net.ssl.trustStore=/path/to/truststore.jks \
     -Djavax.net.ssl.keyStore=/path/to/keystore.p12 \
     -jar cib-service.jar
```

---

## 12. Operational Procedures

### 12.1 Certificate Installation Checklist

```markdown
## CIB Certificate Installation Checklist

### Pre-Installation
- [ ] New certificate received from Bangladesh Bank
- [ ] Certificate validity verified (1 year)
- [ ] Certificate chain complete (includes issuing CA)
- [ ] Private key secured in Vault

### Installation
- [ ] Create new PKCS12 keystore
- [ ] Update Vault with new keystore
- [ ] Backup old keystore (retain 90 days)
- [ ] Clear certificate cache in services

### Verification
- [ ] mTLS handshake successful
- [ ] CIB inquiry test passed
- [ ] Health check endpoint OK
- [ ] No SSL errors in logs

### Post-Installation
- [ ] Document installation date
- [ ] Set reminder for next renewal (T-60 days)
- [ ] Notify stakeholders
- [ ] Update monitoring thresholds
```

### 12.2 Emergency Certificate Replacement

```bash
#!/bin/bash
# emergency-cert-replace.sh

echo "EMERGENCY: CIB Certificate Replacement"
echo "======================================="

# Load emergency certificate from secure backup
EMERGENCY_CERT="/secure/backup/cib-emergency.p12"

if [ ! -f "$EMERGENCY_CERT" ]; then
    echo "ERROR: Emergency certificate not found!"
    exit 1
fi

# Update Vault immediately
vault kv put secret/ulms/cib/certificates \
    keystore="$(base64 $EMERGENCY_CERT)" \
    keystore_password="${EMERGENCY_KEYSTORE_PASSWORD}" \
    emergency="true" \
    replaced_at="$(date -Iseconds)"

# Force restart CIB service
kubectl delete pods -l app=cib-service -n ulms-production

# Monitor for successful startup
kubectl rollout status deployment/cib-service -n ulms-production --timeout=300s

echo "Emergency certificate replacement complete"
echo "NOTE: Follow up with proper certificate renewal process"
```

---

## 13. Appendices

### 13.1 Configuration Reference

**application.yml (CIB Service):**

```yaml
cib:
  api:
    base-url: https://172.16.100.10:443
    timeout-seconds: 120
    retry-count: 3
    retry-delay-seconds: 5

  ssl:
    enabled: true
    protocol: TLSv1.3
    keystore-type: PKCS12
    keystore-path: ${VAULT_KEYSTORE_PATH}
    truststore-type: JKS
    truststore-path: ${VAULT_TRUSTSTORE_PATH}
    hostname-verification: true

  connection-pool:
    max-connections: 50
    max-idle-time-minutes: 5
    max-life-time-minutes: 30
    pending-acquire-timeout-seconds: 30

  circuit-breaker:
    enabled: true
    failure-rate-threshold: 50
    slow-call-rate-threshold: 80
    slow-call-duration-seconds: 60
    wait-duration-open-state-minutes: 1
    sliding-window-size: 10

  certificate:
    expiry-warning-days: 30
    expiry-critical-days: 7
```

### 13.2 Related Documents

| Document ID | Document Name |
|-------------|---------------|
| ARCH-1.4.1 | Security Architecture Document |
| ARCH-1.4.3 | Data Encryption Strategy |
| ARCH-1.4.4 | Secrets Management Design (Vault) |
| ARCH-1.5.2 | CIB Online Integration Design |

---

**Document Version:** 1.0
**Classification:** Confidential - Internal Use
**Last Updated:** February 5, 2026
**Next Review:** August 2026

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

*This mTLS Configuration Document defines the certificate-based authentication for Bangladesh Bank CIB integration in ULMS v2.0.*

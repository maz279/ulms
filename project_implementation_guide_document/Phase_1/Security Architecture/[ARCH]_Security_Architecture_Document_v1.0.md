# Security Architecture Document
## Unisoft Loan Management System (ULMS) v2.0
### OAuth 2.0 / JWT / TLS 1.3 Security Framework

---

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ARCH-1.4.1 |
| **Document Title** | Security Architecture Document |
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
| 1.0 | February 5, 2026 | Lead Developer | Initial Security Architecture Document |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Security Architecture Overview](#2-security-architecture-overview)
3. [Authentication Framework](#3-authentication-framework)
4. [Authorization Framework](#4-authorization-framework)
5. [Transport Security (TLS 1.3)](#5-transport-security-tls-13)
6. [API Security](#6-api-security)
7. [Data Security](#7-data-security)
8. [Network Security](#8-network-security)
9. [Security Monitoring & Audit](#9-security-monitoring--audit)
10. [Compliance Mapping](#10-compliance-mapping)
11. [Security Controls Matrix](#11-security-controls-matrix)
12. [Appendices](#12-appendices)

---

## 1. Executive Summary

### 1.1 Purpose

This document defines the comprehensive security architecture for the **Unisoft Loan Management System (ULMS) v2.0**, a digital lending platform designed for Bangladesh's banking sector. The security architecture ensures protection of sensitive financial data, regulatory compliance, and secure integration with Bangladesh Bank systems.

### 1.2 Security Vision

ULMS v2.0 implements a **Defense-in-Depth** security strategy with multiple layers of protection:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ULMS SECURITY LAYERS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ LAYER 1: PERIMETER SECURITY                                            │ │
│  │ • Firewall • WAF • DDoS Protection • IP Whitelisting                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ LAYER 2: TRANSPORT SECURITY                                            │ │
│  │ • TLS 1.3 • mTLS for CIB • Certificate Management                     │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ LAYER 3: AUTHENTICATION & AUTHORIZATION                                │ │
│  │ • OAuth 2.0 / JWT • Keycloak IdP • MFA/OTP • RBAC (11 Roles)         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ LAYER 4: API SECURITY                                                  │ │
│  │ • Kong Gateway • Rate Limiting • Input Validation • CORS              │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ LAYER 5: APPLICATION SECURITY                                          │ │
│  │ • Spring Security • OWASP Controls • Secure Coding Practices          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ LAYER 6: DATA SECURITY                                                 │ │
│  │ • AES-256 Encryption • Field-Level Encryption • Key Management        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ LAYER 7: AUDIT & MONITORING                                            │ │
│  │ • Immutable Audit Logs • SIEM Integration • Real-time Alerts          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Key Security Characteristics

| Characteristic | Implementation | Standard |
|----------------|---------------|----------|
| **Authentication** | OAuth 2.0 / OpenID Connect | RFC 6749, RFC 7519 |
| **Token Format** | JWT with RS256 | RFC 7519 |
| **Transport Encryption** | TLS 1.3 | RFC 8446 |
| **Data Encryption** | AES-256 | FIPS 197 |
| **Identity Provider** | Keycloak 23 | OpenID Connect 1.0 |
| **API Gateway** | Kong 3.5 | Industry Standard |
| **Secrets Management** | HashiCorp Vault 1.15 | Industry Standard |
| **Compliance** | ICT Security Guidelines V4.0 | Bangladesh Bank |

### 1.4 Regulatory Compliance

ULMS v2.0 security architecture is designed to comply with:

- **Bangladesh Bank ICT Security Guidelines V4.0** (2023)
- **BRPD Circular No. 15/2024** - Loan Classification and Provisioning
- **BFIU Circular No. 25** - e-KYC Guidelines
- **Payment and Settlement Systems Act, 2024**
- **Money Laundering Prevention Act, 2012** - AML/CFT Requirements
- **Basel III RBCA Guidelines** - Operational Risk Management

---

## 2. Security Architecture Overview

### 2.1 High-Level Security Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        ULMS v2.0 SECURITY ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  EXTERNAL USERS                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │  Bank Staff  │  │ CPV Officers │  │  Executives  │  │   Partners   │            │
│  │  (Browser)   │  │  (Mobile)    │  │  (Browser)   │  │   (API)      │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
│         │                 │                 │                 │                     │
│         └─────────────────┼─────────────────┼─────────────────┘                     │
│                           │                 │                                        │
│                           ▼                 ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         EDGE SECURITY LAYER                                  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │   │
│  │  │  Cloudflare │  │     WAF     │  │    DDoS     │  │    IP Whitelist     │ │   │
│  │  │     CDN     │  │   (OWASP)   │  │  Protection │  │   (Admin APIs)      │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │   │
│  └───────────────────────────────┬─────────────────────────────────────────────┘   │
│                                  │                                                   │
│                                  ▼ HTTPS (TLS 1.3)                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         API GATEWAY (Kong 3.5)                               │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │   │
│  │  │    JWT      │  │    Rate     │  │    SSL      │  │     Request         │ │   │
│  │  │ Validation  │  │  Limiting   │  │ Termination │  │   Transformation    │ │   │
│  │  │  (RS256)    │  │ (1000/min)  │  │  (TLS 1.3)  │  │                     │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │   │
│  │  │    ACL      │  │   CORS      │  │  Security   │  │     Logging         │ │   │
│  │  │  (Roles)    │  │  Policies   │  │  Headers    │  │    (Audit)          │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │   │
│  └───────────────────────────────┬─────────────────────────────────────────────┘   │
│                                  │                                                   │
│            ┌─────────────────────┼─────────────────────┐                            │
│            │                     │                     │                            │
│            ▼                     ▼                     ▼                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────────────┐ │
│  │   KEYCLOAK 23   │  │  MICROSERVICES  │  │      EXTERNAL INTEGRATIONS          │ │
│  │   (Identity)    │  │  (Spring Boot)  │  │                                     │ │
│  │                 │  │                 │  │  ┌─────────────┐  ┌──────────────┐  │ │
│  │ • OAuth 2.0     │  │ • CIB Service   │  │  │  CIB Online │  │  NID Wing    │  │ │
│  │ • OIDC          │  │ • NID Service   │  │  │   (mTLS)    │  │   (TLS)      │  │ │
│  │ • MFA/OTP       │  │ • Workflow Svc  │  │  └─────────────┘  └──────────────┘  │ │
│  │ • LDAP/AD       │  │ • BRPD Service  │  │  ┌─────────────┐  ┌──────────────┐  │ │
│  │ • Session Mgmt  │  │ • Document Svc  │  │  │    CBS      │  │   Payment    │  │ │
│  │                 │  │ • Reports Svc   │  │  │  (Bank API) │  │   Gateways   │  │ │
│  └────────┬────────┘  └────────┬────────┘  │  └─────────────┘  └──────────────┘  │ │
│           │                    │           └─────────────────────────────────────┘ │
│           │                    │                                                    │
│           ▼                    ▼                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                           DATA LAYER                                         │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                 │   │
│  │  │  PostgreSQL 16 │  │    Redis 7     │  │   MinIO        │                 │   │
│  │  │  (AES-256-TDE) │  │  (Encrypted)   │  │ (AES-256-GCM)  │                 │   │
│  │  └────────────────┘  └────────────────┘  └────────────────┘                 │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                 │   │
│  │  │ HashiCorp Vault│  │  Kafka 3.6     │  │ Elasticsearch  │                 │   │
│  │  │ (Secrets/Keys) │  │  (Encrypted)   │  │  (Audit Logs)  │                 │   │
│  │  └────────────────┘  └────────────────┘  └────────────────┘                 │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Security Domains

| Domain | Components | Security Controls |
|--------|------------|-------------------|
| **Perimeter** | Firewall, WAF, CDN | DDoS protection, IP filtering, geo-blocking |
| **Network** | VPN, Load Balancer | Network segmentation, mTLS for CIB |
| **Identity** | Keycloak | OAuth 2.0, MFA, LDAP federation |
| **API** | Kong Gateway | JWT validation, rate limiting, ACL |
| **Application** | Spring Boot Services | Input validation, secure coding |
| **Data** | PostgreSQL, MinIO, Redis | AES-256 encryption, key management |
| **Audit** | ELK Stack | Immutable logs, SIEM integration |

---

## 3. Authentication Framework

### 3.1 OAuth 2.0 / OpenID Connect Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    OAUTH 2.0 / OIDC AUTHENTICATION FLOW                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐           ┌──────────────┐           ┌──────────────┐    │
│  │              │    (1)    │              │    (2)    │              │    │
│  │    User      │──────────▶│   ULMS Web   │──────────▶│   Keycloak   │    │
│  │   Browser    │  Request  │   React App  │  Redirect │     IdP      │    │
│  │              │           │              │           │              │    │
│  └──────────────┘           └──────────────┘           └──────┬───────┘    │
│         │                                                      │            │
│         │                      (3) Login                       │            │
│         ├──────────────────────────────────────────────────────┤            │
│         │                                                      │            │
│         │              ┌──────────────┐                        │            │
│         │              │     MFA      │◀───────────────────────┤            │
│         │◀─────────────│   SMS OTP    │    (4) If required     │            │
│         │              └──────────────┘                        │            │
│         │                                                      │            │
│         │         (5) Authorization Code                       │            │
│         ├──────────────────────────────────────────────────────┤            │
│         │                                                      │            │
│         ▼                                                      ▼            │
│  ┌──────────────┐           ┌──────────────┐           ┌──────────────┐    │
│  │              │    (6)    │              │    (7)    │              │    │
│  │   ULMS Web   │──────────▶│     Kong     │──────────▶│   Keycloak   │    │
│  │   React App  │  API Call │   Gateway    │   Token   │     IdP      │    │
│  │              │  + Token  │              │  Validate │              │    │
│  └──────────────┘           └──────────────┘           └──────────────┘    │
│                                    │                                        │
│                                    │ (8) Valid Token                        │
│                                    ▼                                        │
│                             ┌──────────────┐                                │
│                             │              │                                │
│                             │ Microservice │                                │
│                             │              │                                │
│                             └──────────────┘                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 JWT Token Specification

**Token Structure (RFC 7519):**

```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "ulms-key-2026-001"
  },
  "payload": {
    "iss": "https://auth.ulms.unisoft.com.bd/realms/ulms",
    "sub": "user-uuid-12345-67890-abcdef",
    "aud": "ulms-api",
    "exp": 1707004800,
    "iat": 1707001200,
    "jti": "jwt-unique-id-abc123",
    "nbf": 1707001200,
    "auth_time": 1707001100,

    "preferred_username": "loan.officer.dhaka",
    "email": "loan.officer@bank.com.bd",
    "name": "Mohammad Rahman",
    "given_name": "Mohammad",
    "family_name": "Rahman",
    "email_verified": true,

    "realm_access": {
      "roles": ["LOAN_OFFICER", "BRANCH_USER"]
    },

    "resource_access": {
      "ulms-api": {
        "roles": [
          "loan:read",
          "loan:create",
          "customer:read",
          "cib:inquiry"
        ]
      }
    },

    "tenantId": "BANK_001",
    "branchId": "BR-DHK-001",
    "branchName": "Dhaka Main Branch",
    "approvalLimit": 500000,
    "employeeId": "EMP-10234"
  },
  "signature": "..."
}
```

### 3.3 Token Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Algorithm** | RS256 | RSA Signature with SHA-256 |
| **Key Size** | 2048-bit | RSA key pair |
| **Access Token TTL** | 3600 seconds (1 hour) | Short-lived for security |
| **Refresh Token TTL** | 86400 seconds (24 hours) | Used to obtain new access tokens |
| **ID Token TTL** | 3600 seconds (1 hour) | Contains user profile |
| **Clock Skew** | 30 seconds | Maximum allowed time difference |

### 3.4 Authentication Methods

| Method | Use Case | Implementation |
|--------|----------|----------------|
| **Username/Password** | Primary login | Keycloak authentication |
| **SMS OTP** | MFA for sensitive operations | Keycloak MFA provider |
| **LDAP/AD Federation** | Bank staff SSO | Keycloak identity brokering |
| **API Key** | Partner API access | Kong consumer keys |
| **mTLS Certificates** | CIB integration | X.509 client certificates |

### 3.5 Multi-Factor Authentication (MFA)

**MFA Triggers:**

| Operation | MFA Required | OTP Type |
|-----------|--------------|----------|
| Login (first time) | Optional | SMS OTP |
| Login (new device) | Required | SMS OTP |
| Loan Approval (> 5 Lakh) | Required | SMS OTP |
| Disbursement | Required | SMS OTP |
| User Administration | Required | SMS OTP |
| Password Change | Required | SMS OTP |
| CIB Inquiry (bulk) | Required | SMS OTP |

**SMS OTP Configuration:**

```yaml
# Keycloak OTP Configuration
otp:
  type: sms
  algorithm: HmacSHA256
  digits: 6
  period: 300  # 5 minutes validity
  lookAheadWindow: 1
  initialCounter: 0

sms_gateway:
  provider: infobip  # or ssl_wireless
  api_url: https://api.infobip.com/sms/2/text/single
  sender_id: ULMS
  template: "Your ULMS verification code is: {{OTP}}. Valid for 5 minutes."
```

---

## 4. Authorization Framework

### 4.1 Role-Based Access Control (RBAC) Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ULMS RBAC HIERARCHY                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                        ┌───────────────────────┐                            │
│                        │   SYSTEM_ADMIN        │                            │
│                        │   (Full System)       │                            │
│                        └───────────┬───────────┘                            │
│                                    │                                         │
│            ┌───────────────────────┼───────────────────────┐                │
│            │                       │                       │                │
│            ▼                       ▼                       ▼                │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   MD (L7)       │    │   DEPUTY_MD     │    │   CREDIT_ADMIN  │         │
│  │   Unlimited     │    │   (L6)          │    │   Disbursement  │         │
│  └────────┬────────┘    └────────┬────────┘    └─────────────────┘         │
│           │                      │                                          │
│           └──────────┬───────────┘                                          │
│                      ▼                                                       │
│           ┌─────────────────┐                                               │
│           │ CREDIT_COMMITTEE│                                               │
│           │     (L5)        │                                               │
│           └────────┬────────┘                                               │
│                    ▼                                                         │
│           ┌─────────────────┐                                               │
│           │  HEAD_OF_CREDIT │                                               │
│           │     (L4)        │                                               │
│           └────────┬────────┘                                               │
│                    ▼                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    REGIONAL_MANAGER (L3)                             │   │
│  └────────────────────────────┬────────────────────────────────────────┘   │
│                               ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    BRANCH_MANAGER (L2)                               │   │
│  └────────────────────────────┬────────────────────────────────────────┘   │
│                               ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                  BRANCH_CREDIT_HEAD (L1)                             │   │
│  └────────────────────────────┬────────────────────────────────────────┘   │
│                               ▼                                             │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────┐                 │
│  │CREDIT_ANALYST │   │  CPV_OFFICER  │   │  BRANCH_USER  │                 │
│  │  (Recommend)  │   │   (Verify)    │   │   (Entry)     │                 │
│  └───────────────┘   └───────────────┘   └───────────────┘                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Role Definitions

| Role | Level | Max Approval (BDT) | Key Permissions |
|------|-------|-------------------|-----------------|
| **BRANCH_USER** | - | None | Create applications, view only |
| **CREDIT_ANALYST** | - | Recommend | CIB inquiry, CPV creation, credit analysis |
| **CPV_OFFICER** | - | Verify | Field verification, photo upload, GPS |
| **BRANCH_CREDIT_HEAD** | L1 | 5 Lakh | Quality review, L1 approval |
| **BRANCH_MANAGER** | L2 | 10 Lakh | Branch approval, proposal generation |
| **REGIONAL_MANAGER** | L3 | 25 Lakh | Regional oversight, L3 approval |
| **HEAD_OF_CREDIT** | L4 | 1 Crore | Credit oversight, L4 approval |
| **CREDIT_COMMITTEE** | L5 | 5 Crore | Committee decision, L5 approval |
| **DEPUTY_MD** | L6 | 10 Crore | Senior approval, L6 approval |
| **MD** | L7 | Unlimited | Final authority, L7 approval |
| **CREDIT_ADMIN** | - | None | Disbursement processing, limit loading |
| **SYSTEM_ADMIN** | - | None | User management, configuration |

### 4.3 Permission Enforcement

**Kong ACL Plugin Configuration:**

```yaml
# Kong ACL Configuration for Role-Based Access
plugins:
  - name: acl
    route: loan-approval-route
    config:
      allow:
        - BRANCH_CREDIT_HEAD
        - BRANCH_MANAGER
        - REGIONAL_MANAGER
        - HEAD_OF_CREDIT
        - CREDIT_COMMITTEE
        - DEPUTY_MD
        - MD
      deny: []
      hide_groups_header: true

  - name: acl
    route: disbursement-route
    config:
      allow:
        - CREDIT_ADMIN
        - SYSTEM_ADMIN
      deny: []

  - name: acl
    route: admin-route
    config:
      allow:
        - SYSTEM_ADMIN
      deny: []
```

**Spring Security Configuration:**

```java
@Configuration
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .jwtAuthenticationConverter(jwtAuthenticationConverter())
                )
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/loans/approve/**")
                    .hasAnyRole("BRANCH_CREDIT_HEAD", "BRANCH_MANAGER",
                               "REGIONAL_MANAGER", "HEAD_OF_CREDIT",
                               "CREDIT_COMMITTEE", "DEPUTY_MD", "MD")
                .requestMatchers("/api/v1/disbursement/**")
                    .hasAnyRole("CREDIT_ADMIN", "SYSTEM_ADMIN")
                .requestMatchers("/api/v1/admin/**")
                    .hasRole("SYSTEM_ADMIN")
                .requestMatchers("/api/v1/cib/**")
                    .hasAnyRole("CREDIT_ANALYST", "BRANCH_CREDIT_HEAD",
                               "BRANCH_MANAGER", "HEAD_OF_CREDIT")
                .anyRequest().authenticated()
            );
        return http.build();
    }
}
```

---

## 5. Transport Security (TLS 1.3)

### 5.1 TLS Configuration

**Protocol Requirements:**

| Parameter | Value | Notes |
|-----------|-------|-------|
| **Minimum Version** | TLS 1.2 | For legacy compatibility |
| **Preferred Version** | TLS 1.3 | Primary protocol |
| **Session Timeout** | 86400 seconds | 24 hours |
| **Session Cache** | 50MB shared | Performance optimization |
| **ALPN Protocols** | h2, http/1.1 | HTTP/2 support |

### 5.2 Cipher Suites

**TLS 1.3 Cipher Suites (Preferred):**

```
TLS_AES_256_GCM_SHA384
TLS_CHACHA20_POLY1305_SHA256
TLS_AES_128_GCM_SHA256
```

**TLS 1.2 Cipher Suites (Fallback):**

```
ECDHE-ECDSA-AES256-GCM-SHA384
ECDHE-RSA-AES256-GCM-SHA384
ECDHE-ECDSA-AES128-GCM-SHA256
ECDHE-RSA-AES128-GCM-SHA256
```

### 5.3 Kong TLS Configuration

```yaml
# Kong SSL/TLS Configuration
ssl_cipher_suite: modern
ssl_ciphers: >-
  ECDHE-ECDSA-AES256-GCM-SHA384:
  ECDHE-RSA-AES256-GCM-SHA384:
  ECDHE-ECDSA-AES128-GCM-SHA256:
  ECDHE-RSA-AES128-GCM-SHA256

ssl_protocols: TLSv1.2 TLSv1.3
ssl_prefer_server_ciphers: "on"
ssl_session_timeout: 1d
ssl_session_cache: shared:SSL:50m
ssl_session_tickets: "off"

# OCSP Stapling
ssl_stapling: "on"
ssl_stapling_verify: "on"

# Certificate Configuration
ssl_certificate: /etc/kong/certs/api.ulms.unisoft.com.bd.crt
ssl_certificate_key: /etc/kong/certs/api.ulms.unisoft.com.bd.key
ssl_trusted_certificate: /etc/kong/certs/ca-chain.crt

# HSTS Configuration
headers:
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### 5.4 Certificate Management

**Certificate Specifications:**

| Certificate | Algorithm | Key Size | Validity | Issuer |
|-------------|-----------|----------|----------|--------|
| **API Gateway** | RSA | 2048-bit | 1 year | DigiCert |
| **Internal Services** | RSA | 2048-bit | 1 year | Internal CA |
| **mTLS (CIB)** | RSA | 4096-bit | 1 year | Bangladesh Bank CA |

**Kubernetes cert-manager Configuration:**

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: ulms-api-certificate
  namespace: ulms-production
spec:
  secretName: ulms-api-tls
  duration: 2160h  # 90 days
  renewBefore: 360h  # 15 days before expiry
  subject:
    organizations:
      - Unisoft Systems Limited
  commonName: api.ulms.unisoft.com.bd
  dnsNames:
    - api.ulms.unisoft.com.bd
    - "*.ulms.unisoft.com.bd"
  issuerRef:
    name: letsencrypt-production
    kind: ClusterIssuer
```

---

## 6. API Security

### 6.1 Kong API Gateway Security Plugins

```yaml
# Security Plugin Stack
plugins:
  # 1. Rate Limiting
  - name: rate-limiting
    config:
      minute: 1000
      policy: redis
      redis_host: redis.ulms.svc
      redis_port: 6379
      redis_database: 1
      fault_tolerant: true
      hide_client_headers: false
      header_name: X-RateLimit-Remaining

  # 2. Request Size Limiting
  - name: request-size-limiting
    config:
      allowed_payload_size: 10  # MB
      size_unit: megabytes

  # 3. Response Rate Limiting
  - name: response-ratelimiting
    config:
      limits:
        - name: loan-api
          value: 5000
          unit: hour

  # 4. Bot Detection
  - name: bot-detection
    config:
      deny:
        - curl
        - wget
        - python-requests
      allow:
        - Mozilla
        - Chrome
        - Safari
        - ULMS-Mobile-App

  # 5. IP Restriction (Admin APIs)
  - name: ip-restriction
    route: admin-routes
    config:
      allow:
        - 192.168.1.0/24    # Office Network
        - 10.0.0.0/8        # VPN Network
      deny: []

  # 6. CORS
  - name: cors
    config:
      origins:
        - https://app.ulms.unisoft.com.bd
        - https://admin.ulms.unisoft.com.bd
      methods:
        - GET
        - POST
        - PUT
        - DELETE
        - OPTIONS
      headers:
        - Accept
        - Accept-Version
        - Content-Length
        - Content-Type
        - Authorization
        - X-Tenant-ID
      exposed_headers:
        - X-Auth-Token
        - X-RateLimit-Remaining
      credentials: true
      max_age: 3600
```

### 6.2 Security Headers

**Response Headers Configuration:**

```yaml
# Security Headers Plugin
plugins:
  - name: response-transformer
    config:
      add:
        headers:
          # Prevent MIME type sniffing
          - "X-Content-Type-Options: nosniff"

          # Prevent clickjacking
          - "X-Frame-Options: DENY"

          # XSS Protection
          - "X-XSS-Protection: 1; mode=block"

          # HSTS
          - "Strict-Transport-Security: max-age=31536000; includeSubDomains; preload"

          # Content Security Policy
          - "Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.ulms.unisoft.com.bd"

          # Referrer Policy
          - "Referrer-Policy: strict-origin-when-cross-origin"

          # Permissions Policy
          - "Permissions-Policy: geolocation=(), microphone=(), camera=(self)"

          # Cache Control
          - "Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate"
          - "Pragma: no-cache"
```

### 6.3 Rate Limiting Strategy

| API Category | Rate Limit | Window | Rationale |
|--------------|------------|--------|-----------|
| **Default** | 1000/min | 1 minute | Standard API access |
| **CIB Service** | 100/min | 1 minute | External API costs |
| **NID Service** | 100/min | 1 minute | External API costs |
| **Analytics** | 50/min | 1 minute | Heavy computation |
| **Admin APIs** | 500/min | 1 minute | Administrative use |
| **Auth Endpoints** | 10/min per IP | 1 minute | Brute force protection |
| **File Upload** | 20/min | 1 minute | Resource intensive |

### 6.4 Input Validation

**Spring Boot Validation Configuration:**

```java
@RestController
@RequestMapping("/api/v1/loans")
@Validated
public class LoanController {

    @PostMapping
    public ResponseEntity<LoanDTO> createLoan(
            @Valid @RequestBody LoanApplicationRequest request) {
        // Validated request
        return ResponseEntity.ok(loanService.create(request));
    }
}

@Data
public class LoanApplicationRequest {

    @NotNull(message = "Customer ID is required")
    @Positive(message = "Customer ID must be positive")
    private Long customerId;

    @NotNull(message = "Product ID is required")
    private Integer productId;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "50000", message = "Minimum loan amount is 50,000 BDT")
    @DecimalMax(value = "200000000", message = "Maximum loan amount is 20 Crore BDT")
    private BigDecimal amount;

    @NotNull(message = "Tenure is required")
    @Min(value = 12, message = "Minimum tenure is 12 months")
    @Max(value = 360, message = "Maximum tenure is 360 months")
    private Integer tenureMonths;

    @NotBlank(message = "Purpose is required")
    @Size(min = 10, max = 500, message = "Purpose must be 10-500 characters")
    @Pattern(regexp = "^[a-zA-Z0-9\\s\\-.,()]+$",
             message = "Purpose contains invalid characters")
    private String purpose;
}
```

---

## 7. Data Security

### 7.1 Encryption Overview

| Data State | Algorithm | Key Size | Implementation |
|------------|-----------|----------|----------------|
| **At Rest (Database)** | AES-256-TDE | 256-bit | PostgreSQL TDE |
| **At Rest (Files)** | AES-256-GCM | 256-bit | MinIO SSE |
| **At Rest (Backups)** | AES-256-CBC | 256-bit | pgBackRest + Vault |
| **In Transit** | TLS 1.3 | 256-bit | ECDHE-AES256 |
| **Field-Level** | AES-256-CBC | 256-bit | JPA @Encrypted |

### 7.2 Field-Level Encryption

**Sensitive Fields Requiring Encryption:**

| Field | Entity | Encryption | Key Source |
|-------|--------|------------|------------|
| `nid_number` | Customer | AES-256-CBC | Vault |
| `date_of_birth` | Customer | AES-256-CBC | Vault |
| `phone_number` | Customer | AES-256-CBC | Vault |
| `account_number` | Loan | AES-256-CBC | Vault |
| `card_number` | Payment | AES-256-CBC | Vault |

**JPA Encryption Converter:**

```java
@Converter
public class AesEncryptor implements AttributeConverter<String, String> {

    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";
    private final VaultTemplate vaultTemplate;

    @Override
    public String convertToDatabaseColumn(String plainText) {
        if (plainText == null) return null;

        try {
            VaultTransitKey key = vaultTemplate.read(
                "transit/keys/ulms-field-encryption"
            );
            byte[] iv = generateIv();
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, key.getSecretKey(),
                       new IvParameterSpec(iv));
            byte[] encrypted = cipher.doFinal(plainText.getBytes());

            // Format: base64(iv):base64(ciphertext):keyVersion
            return Base64.encode(iv) + ":" +
                   Base64.encode(encrypted) + ":" +
                   key.getVersion();
        } catch (Exception e) {
            throw new EncryptionException("Encryption failed", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String encryptedText) {
        if (encryptedText == null) return null;

        try {
            String[] parts = encryptedText.split(":");
            byte[] iv = Base64.decode(parts[0]);
            byte[] cipherText = Base64.decode(parts[1]);
            String keyVersion = parts[2];

            VaultTransitKey key = vaultTemplate.read(
                "transit/keys/ulms-field-encryption", keyVersion
            );

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, key.getSecretKey(),
                       new IvParameterSpec(iv));
            return new String(cipher.doFinal(cipherText));
        } catch (Exception e) {
            throw new EncryptionException("Decryption failed", e);
        }
    }
}
```

### 7.3 Key Management

**Key Rotation Policy:**

| Key Type | Rotation Period | Retention | Storage |
|----------|-----------------|-----------|---------|
| **Field Encryption** | 90 days | 2 years | Vault Transit |
| **Database TDE** | 1 year | 7 years | HSM |
| **TLS Certificates** | 1 year | N/A | cert-manager |
| **JWT Signing** | 1 year | 1 year | Keycloak |
| **API Keys** | 6 months | 1 year | Vault KV |

---

## 8. Network Security

### 8.1 Network Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ULMS NETWORK SECURITY ZONES                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         DMZ (Public Zone)                            │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐           │   │
│  │  │   Cloudflare  │  │     WAF       │  │  Kong Gateway │           │   │
│  │  │      CDN      │  │    (OWASP)    │  │   (TLS Term)  │           │   │
│  │  └───────────────┘  └───────────────┘  └───────────────┘           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                             Port 443 (TLS)                                   │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Application Zone                                │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐           │   │
│  │  │   Keycloak    │  │ Microservices │  │   Fineract    │           │   │
│  │  │   (Auth)      │  │  (Spring)     │  │   (Core)      │           │   │
│  │  └───────────────┘  └───────────────┘  └───────────────┘           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                            Port 5432, 6379                                   │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Data Zone                                     │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐           │   │
│  │  │  PostgreSQL   │  │     Redis     │  │     MinIO     │           │   │
│  │  │  (Primary)    │  │   (Cache)     │  │    (DMS)      │           │   │
│  │  └───────────────┘  └───────────────┘  └───────────────┘           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                              VPN Tunnel                                      │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                   External Integration Zone                          │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐           │   │
│  │  │   CIB Online  │  │   NID Wing    │  │    CBS        │           │   │
│  │  │   (mTLS/VPN)  │  │   (TLS)       │  │   (Bank)      │           │   │
│  │  └───────────────┘  └───────────────┘  └───────────────┘           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Firewall Rules

| Source | Destination | Port | Protocol | Action |
|--------|-------------|------|----------|--------|
| Internet | Kong Gateway | 443 | HTTPS | Allow |
| Kong Gateway | Keycloak | 8443 | HTTPS | Allow |
| Kong Gateway | Microservices | 8080-8090 | HTTP | Allow |
| Microservices | PostgreSQL | 5432 | TCP | Allow |
| Microservices | Redis | 6379 | TCP | Allow |
| Microservices | Kafka | 9092 | TCP | Allow |
| CIB Service | CIB Online (BB) | 443 | mTLS | Allow |
| * | * | * | * | Deny |

### 8.3 VPN Configuration for Bangladesh Bank

```yaml
# IPSec VPN Configuration for Bangladesh Bank
vpn:
  type: IPSec
  mode: tunnel
  encryption: AES-256-GCM
  authentication: SHA-384
  dh_group: 21  # ECDH 521-bit
  pfs: enabled
  lifetime: 28800  # 8 hours

  local:
    gateway: vpn.ulms.unisoft.com.bd
    subnet: 10.10.0.0/24

  remote:
    gateway: vpn.bb.org.bd
    subnet: 172.16.0.0/24

  ike:
    version: 2
    mode: main
    encryption: AES-256
    hash: SHA-384
    dh_group: 21
```

---

## 9. Security Monitoring & Audit

### 9.1 Audit Logging Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUDIT LOGGING FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │   API Call   │────▶│  Kong Logs   │────▶│    Kafka     │                │
│  │              │     │  (JSON)      │     │  audit.logs  │                │
│  └──────────────┘     └──────────────┘     └──────┬───────┘                │
│                                                    │                        │
│  ┌──────────────┐     ┌──────────────┐            │                        │
│  │ Application  │────▶│  App Logs    │────────────┤                        │
│  │   Events     │     │  (JSON)      │            │                        │
│  └──────────────┘     └──────────────┘            │                        │
│                                                    │                        │
│  ┌──────────────┐     ┌──────────────┐            │                        │
│  │   Security   │────▶│ Security Logs│────────────┤                        │
│  │   Events     │     │  (JSON)      │            │                        │
│  └──────────────┘     └──────────────┘            ▼                        │
│                                            ┌──────────────┐                │
│                                            │   Logstash   │                │
│                                            │  (Transform) │                │
│                                            └──────┬───────┘                │
│                                                   │                         │
│                        ┌──────────────────────────┼───────────────────┐    │
│                        │                          │                   │    │
│                        ▼                          ▼                   ▼    │
│                 ┌──────────────┐          ┌──────────────┐    ┌──────────┐│
│                 │Elasticsearch │          │   S3/MinIO   │    │   SIEM   ││
│                 │ (Hot: 90d)   │          │ (Cold: 10y)  │    │(Splunk)  ││
│                 └──────────────┘          └──────────────┘    └──────────┘│
│                        │                                                   │
│                        ▼                                                   │
│                 ┌──────────────┐                                          │
│                 │   Grafana    │                                          │
│                 │  Dashboards  │                                          │
│                 └──────────────┘                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Audit Event Structure

```json
{
  "eventId": "evt-2026-02-05-abc123def456",
  "timestamp": "2026-02-05T10:30:45.123Z",
  "eventType": "LOAN_APPROVED",
  "eventCategory": "BUSINESS",
  "severity": "INFO",

  "actor": {
    "userId": "user-uuid-12345",
    "username": "branch.manager",
    "email": "manager@bank.com.bd",
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "sessionId": "sess-abc123",
    "roles": ["BRANCH_MANAGER"],
    "tenantId": "BANK_001",
    "branchId": "BR-DHK-001"
  },

  "resource": {
    "type": "LOAN_APPLICATION",
    "id": "APP-2026-000123",
    "name": "Personal Loan Application",
    "attributes": {
      "customerId": "CUST-00456",
      "amount": 500000,
      "productType": "PERSONAL_LOAN"
    }
  },

  "action": {
    "type": "APPROVE",
    "method": "POST",
    "endpoint": "/api/v1/loans/APP-2026-000123/approve",
    "status": "SUCCESS",
    "statusCode": 200,
    "durationMs": 245
  },

  "changes": {
    "before": {"status": "PENDING_APPROVAL"},
    "after": {"status": "APPROVED"}
  },

  "context": {
    "requestId": "req-xyz789",
    "traceId": "trace-abc123",
    "spanId": "span-def456",
    "serviceVersion": "1.0.0"
  },

  "metadata": {
    "environment": "production",
    "region": "bd-dhaka-1",
    "cluster": "ulms-prod-01"
  }
}
```

### 9.3 Log Retention Policy

| Log Type | Hot Storage | Warm Storage | Cold Storage | Total Retention |
|----------|-------------|--------------|--------------|-----------------|
| **Audit Logs** | 90 days | 1 year | 9 years | 10 years |
| **Security Logs** | 90 days | 1 year | 6 years | 7 years |
| **Application Logs** | 30 days | 60 days | - | 90 days |
| **Access Logs** | 30 days | 60 days | 275 days | 1 year |

### 9.4 Security Alerts

| Alert | Condition | Severity | Response Time |
|-------|-----------|----------|---------------|
| **Brute Force** | >10 failed logins/5min | Critical | Immediate |
| **Privilege Escalation** | Unauthorized role change | Critical | Immediate |
| **Data Exfiltration** | >1000 records/hour | High | 15 minutes |
| **Unusual Access** | Off-hours admin access | Medium | 30 minutes |
| **Certificate Expiry** | <30 days to expiry | Medium | 24 hours |
| **Rate Limit Breach** | >5000 requests/min | Low | 1 hour |

---

## 10. Compliance Mapping

### 10.1 ICT Security Guidelines V4.0 Compliance

| Guideline Section | Requirement | ULMS Implementation | Status |
|-------------------|-------------|---------------------|--------|
| **4.1** | Access Control | RBAC with 11 roles, Keycloak | ✅ Compliant |
| **4.2** | User Authentication | OAuth 2.0, MFA (SMS OTP) | ✅ Compliant |
| **4.3** | Password Policy | Keycloak password policies | ✅ Compliant |
| **4.4** | Session Management | 30-min timeout, secure cookies | ✅ Compliant |
| **5.1** | Data Encryption | AES-256-TDE, TLS 1.3 | ✅ Compliant |
| **5.2** | Key Management | HashiCorp Vault, HSM | ✅ Compliant |
| **5.3** | Data Masking | Field-level encryption | ✅ Compliant |
| **6.1** | Network Security | Firewall, VPN, segmentation | ✅ Compliant |
| **6.2** | TLS Requirements | TLS 1.3 mandatory | ✅ Compliant |
| **7.1** | Audit Logging | Immutable ELK logs, 10yr | ✅ Compliant |
| **7.2** | Monitoring | Prometheus, Grafana, SIEM | ✅ Compliant |
| **8.1** | Vulnerability Mgmt | Snyk, OWASP DC, SonarQube | ✅ Compliant |
| **8.2** | Penetration Testing | Annual VAPT | ✅ Compliant |

### 10.2 OWASP Top 10 Mitigations

| OWASP Risk | Mitigation | Implementation |
|------------|------------|----------------|
| **A01:2021 Broken Access Control** | RBAC, JWT validation | Spring Security, Kong ACL |
| **A02:2021 Cryptographic Failures** | AES-256, TLS 1.3 | Vault, cert-manager |
| **A03:2021 Injection** | Parameterized queries | JPA/Hibernate, input validation |
| **A04:2021 Insecure Design** | Threat modeling | Architecture review |
| **A05:2021 Security Misconfiguration** | Hardened configs | Security headers, Kong |
| **A06:2021 Vulnerable Components** | Dependency scanning | Snyk, OWASP DC |
| **A07:2021 Auth Failures** | OAuth 2.0, MFA | Keycloak |
| **A08:2021 Data Integrity Failures** | Signed JWTs, checksums | RS256, SHA-256 |
| **A09:2021 Logging Failures** | Comprehensive logging | ELK Stack, audit |
| **A10:2021 SSRF** | URL validation | Input sanitization |

---

## 11. Security Controls Matrix

### 11.1 Technical Controls

| Control Category | Control | Tool/Technology | Owner |
|-----------------|---------|-----------------|-------|
| **Authentication** | OAuth 2.0 / JWT | Keycloak 23 | Security Team |
| **Authorization** | RBAC | Spring Security, Kong | Dev Team |
| **Encryption (Transit)** | TLS 1.3 | Kong, cert-manager | DevOps |
| **Encryption (Rest)** | AES-256 | PostgreSQL TDE, Vault | DBA |
| **API Security** | Gateway | Kong 3.5 | DevOps |
| **WAF** | Web Application Firewall | Cloudflare | Security Team |
| **SIEM** | Security Monitoring | Splunk/ELK | Security Team |
| **Secret Management** | Vault | HashiCorp Vault 1.15 | DevOps |
| **Vulnerability Scanning** | SAST/DAST | SonarQube, Snyk | Dev Team |

### 11.2 Operational Controls

| Control | Frequency | Responsible |
|---------|-----------|-------------|
| Security Patching | Monthly | DevOps Team |
| Access Review | Quarterly | Security Team |
| Penetration Testing | Annually | External Vendor |
| Security Awareness Training | Quarterly | HR/Security |
| Incident Response Drill | Bi-annually | Security Team |
| Backup Testing | Monthly | DBA Team |
| Key Rotation | Per policy | DevOps Team |
| Certificate Renewal | Before expiry | DevOps Team |

---

## 12. Appendices

### 12.1 Glossary

| Term | Definition |
|------|------------|
| **AES-256** | Advanced Encryption Standard with 256-bit key |
| **JWT** | JSON Web Token for secure information transfer |
| **mTLS** | Mutual TLS with client certificate authentication |
| **OAuth 2.0** | Authorization framework (RFC 6749) |
| **OIDC** | OpenID Connect authentication layer |
| **RBAC** | Role-Based Access Control |
| **TDE** | Transparent Data Encryption |
| **TLS 1.3** | Transport Layer Security version 1.3 |

### 12.2 Reference Documents

| Document | Location |
|----------|----------|
| ICT Security Guidelines V4.0 | Bangladesh Bank Website |
| BRPD Circular 15/2024 | Bangladesh Bank Circulars |
| OWASP Top 10 (2021) | owasp.org |
| RFC 6749 (OAuth 2.0) | ietf.org |
| RFC 7519 (JWT) | ietf.org |
| RFC 8446 (TLS 1.3) | ietf.org |

### 12.3 Related ULMS Documents

| Document ID | Document Name |
|-------------|---------------|
| ARCH-1.4.2 | Authentication & Authorization Design (Keycloak) |
| ARCH-1.4.3 | Data Encryption Strategy |
| ARCH-1.4.4 | Secrets Management Design (Vault) |
| ARCH-1.4.5 | mTLS Configuration for CIB |
| ARCH-1.4.6 | RBAC Authorization Matrix |

---

**Document Version:** 1.0
**Classification:** Confidential - Internal Use
**Last Updated:** February 5, 2026
**Next Review:** August 2026

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

*This Security Architecture Document is approved for implementation and provides the security foundation for the ULMS v2.0 project.*

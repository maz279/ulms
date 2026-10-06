# Authentication & Authorization Design Document
## Unisoft Loan Management System (ULMS) v2.0
### Keycloak Identity and Access Management

---

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ARCH-1.4.2 |
| **Document Title** | Authentication & Authorization Design (Keycloak) |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 5, 2026 |
| **Prepared By** | Lead Developer, Security Architect |
| **Reviewed By** | Architecture Review Board |
| **Classification** | Confidential - Internal Use |
| **Status** | Approved for Implementation |

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | February 5, 2026 | Lead Developer | Initial Authentication Design Document |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Keycloak Architecture](#2-keycloak-architecture)
3. [Realm Configuration](#3-realm-configuration)
4. [Client Configuration](#4-client-configuration)
5. [Authentication Flows](#5-authentication-flows)
6. [OAuth 2.0 / OpenID Connect](#6-oauth-20--openid-connect)
7. [Multi-Factor Authentication](#7-multi-factor-authentication)
8. [Federation & Single Sign-On](#8-federation--single-sign-on)
9. [Session Management](#9-session-management)
10. [Token Management](#10-token-management)
11. [User Management](#11-user-management)
12. [Integration Guide](#12-integration-guide)
13. [Security Hardening](#13-security-hardening)
14. [Monitoring & Audit](#14-monitoring--audit)
15. [Appendices](#15-appendices)

---

## 1. Overview

### 1.1 Purpose

This document defines the authentication and authorization architecture for ULMS v2.0 using **Keycloak 23** as the centralized Identity Provider (IdP). It covers user authentication, OAuth 2.0 implementation, multi-factor authentication, and integration with external identity sources.

### 1.2 Keycloak Selection Rationale

| Criteria | Keycloak 23 | Alternative (Auth0) | Decision |
|----------|-------------|---------------------|----------|
| **Open Source** | Yes (Apache 2.0) | No (SaaS) | Keycloak ✓ |
| **On-Premise** | Full control | Cloud-only | Keycloak ✓ |
| **LDAP/AD Federation** | Native support | Limited | Keycloak ✓ |
| **Customization** | Extensive | Limited | Keycloak ✓ |
| **Bangladesh Bank Compliance** | Data residency | Cross-border data | Keycloak ✓ |
| **Cost** | Free | Per-user pricing | Keycloak ✓ |
| **MFA Support** | OTP, SMS, WebAuthn | Similar | Both ✓ |

### 1.3 Key Features

- **OAuth 2.0 / OpenID Connect** compliant
- **Multi-Factor Authentication** with SMS OTP
- **LDAP/Active Directory** federation for bank staff
- **Social Login** (optional for customer portal)
- **Fine-grained Authorization** with custom policies
- **Session Management** with timeout controls
- **Audit Logging** for compliance

---

## 2. Keycloak Architecture

### 2.1 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    KEYCLOAK HIGH AVAILABILITY ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         LOAD BALANCER                                │   │
│  │                    (HAProxy / Kong / AWS ALB)                        │   │
│  │              https://auth.ulms.unisoft.com.bd                        │   │
│  └─────────────────────────────┬───────────────────────────────────────┘   │
│                                │                                            │
│            ┌───────────────────┼───────────────────┐                       │
│            │                   │                   │                       │
│            ▼                   ▼                   ▼                       │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐              │
│  │   Keycloak      │ │   Keycloak      │ │   Keycloak      │              │
│  │   Node 1        │ │   Node 2        │ │   Node 3        │              │
│  │   (Primary)     │ │   (Replica)     │ │   (Replica)     │              │
│  │                 │ │                 │ │                 │              │
│  │   Port: 8443    │ │   Port: 8443    │ │   Port: 8443    │              │
│  │   JGroups: 7800 │ │   JGroups: 7800 │ │   JGroups: 7800 │              │
│  └────────┬────────┘ └────────┬────────┘ └────────┬────────┘              │
│           │                   │                   │                        │
│           └───────────────────┼───────────────────┘                        │
│                               │                                             │
│                    ┌──────────┴──────────┐                                 │
│                    │   JGroups Cluster   │                                 │
│                    │   (Infinispan)      │                                 │
│                    │   Session Replication│                                │
│                    └──────────┬──────────┘                                 │
│                               │                                             │
│            ┌──────────────────┼──────────────────┐                         │
│            │                  │                  │                         │
│            ▼                  ▼                  ▼                         │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐              │
│  │   PostgreSQL    │ │   PostgreSQL    │ │   PostgreSQL    │              │
│  │    Primary      │ │    Standby 1    │ │    Standby 2    │              │
│  │   (Read/Write)  │ │   (Read-Only)   │ │   (Read-Only)   │              │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘              │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    EXTERNAL IDENTITY SOURCES                         │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐            │   │
│  │  │  Bank LDAP    │  │  Active       │  │  SMS Gateway  │            │   │
│  │  │  (Users)      │  │  Directory    │  │  (OTP)        │            │   │
│  │  └───────────────┘  └───────────────┘  └───────────────┘            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 System Requirements

| Component | Specification | Notes |
|-----------|---------------|-------|
| **CPU** | 4 vCPU per node | Minimum for production |
| **Memory** | 8 GB RAM per node | 4GB for Keycloak + 4GB for JVM |
| **Storage** | 50 GB SSD | For logs and temp files |
| **Database** | PostgreSQL 16 | Dedicated instance recommended |
| **Java** | OpenJDK 17 LTS | Keycloak 23 requirement |
| **Nodes** | 3 (minimum) | For high availability |

### 2.3 Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: keycloak
  namespace: ulms-security
spec:
  replicas: 3
  selector:
    matchLabels:
      app: keycloak
  template:
    metadata:
      labels:
        app: keycloak
    spec:
      containers:
        - name: keycloak
          image: quay.io/keycloak/keycloak:23.0.4
          args:
            - start
            - --hostname=auth.ulms.unisoft.com.bd
            - --https-certificate-file=/etc/certs/tls.crt
            - --https-certificate-key-file=/etc/certs/tls.key
            - --db=postgres
            - --db-url=jdbc:postgresql://postgres-keycloak:5432/keycloak
            - --db-username=keycloak
            - --db-password=${DB_PASSWORD}
            - --cache=ispn
            - --cache-stack=kubernetes
          env:
            - name: KEYCLOAK_ADMIN
              valueFrom:
                secretKeyRef:
                  name: keycloak-admin
                  key: username
            - name: KEYCLOAK_ADMIN_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: keycloak-admin
                  key: password
            - name: KC_HEALTH_ENABLED
              value: "true"
            - name: KC_METRICS_ENABLED
              value: "true"
            - name: JAVA_OPTS_APPEND
              value: "-Xms2g -Xmx4g -XX:+UseG1GC"
          ports:
            - containerPort: 8443
              name: https
            - containerPort: 8080
              name: http
            - containerPort: 7800
              name: jgroups
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 8080
            initialDelaySeconds: 60
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health/live
              port: 8080
            initialDelaySeconds: 120
            periodSeconds: 30
          resources:
            requests:
              memory: "4Gi"
              cpu: "2000m"
            limits:
              memory: "8Gi"
              cpu: "4000m"
          volumeMounts:
            - name: certs
              mountPath: /etc/certs
              readOnly: true
      volumes:
        - name: certs
          secret:
            secretName: keycloak-tls
```

---

## 3. Realm Configuration

### 3.1 ULMS Realm Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ULMS REALM STRUCTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  REALM: ulms                                                                 │
│  ├── CLIENTS                                                                 │
│  │   ├── ulms-web-app (React Web Application)                               │
│  │   ├── ulms-mobile-app (React Native CPV App)                             │
│  │   ├── ulms-api-gateway (Kong API Gateway)                                │
│  │   └── ulms-admin-cli (Admin CLI Tool)                                    │
│  │                                                                           │
│  ├── ROLES (Realm Roles)                                                     │
│  │   ├── BRANCH_USER                                                         │
│  │   ├── CREDIT_ANALYST                                                      │
│  │   ├── CPV_OFFICER                                                         │
│  │   ├── BRANCH_CREDIT_HEAD                                                  │
│  │   ├── BRANCH_MANAGER                                                      │
│  │   ├── REGIONAL_MANAGER                                                    │
│  │   ├── HEAD_OF_CREDIT                                                      │
│  │   ├── CREDIT_COMMITTEE                                                    │
│  │   ├── DEPUTY_MD                                                           │
│  │   ├── MD                                                                  │
│  │   ├── CREDIT_ADMIN                                                        │
│  │   └── SYSTEM_ADMIN                                                        │
│  │                                                                           │
│  ├── GROUPS                                                                  │
│  │   ├── /banks/{bank-id}/branches/{branch-id}                              │
│  │   ├── /banks/{bank-id}/head-office                                       │
│  │   └── /banks/{bank-id}/regional/{region-id}                              │
│  │                                                                           │
│  ├── IDENTITY PROVIDERS                                                      │
│  │   ├── bank-ldap (LDAP Federation)                                        │
│  │   └── bank-ad (Active Directory)                                         │
│  │                                                                           │
│  ├── AUTHENTICATION FLOWS                                                    │
│  │   ├── browser (Standard + MFA)                                           │
│  │   ├── direct-grant (API Authentication)                                  │
│  │   └── first-broker-login (LDAP First Login)                              │
│  │                                                                           │
│  └── CLIENT SCOPES                                                           │
│      ├── openid (Standard OIDC)                                             │
│      ├── profile (User Profile)                                             │
│      ├── email (Email Address)                                              │
│      ├── ulms-api (ULMS API Access)                                         │
│      └── ulms-admin (Admin Functions)                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Realm Settings

```json
{
  "realm": "ulms",
  "displayName": "ULMS - Unisoft Loan Management System",
  "displayNameHtml": "<div class=\"kc-logo-text\"><span>ULMS</span></div>",
  "enabled": true,
  "sslRequired": "all",
  "registrationAllowed": false,
  "registrationEmailAsUsername": false,
  "rememberMe": false,
  "verifyEmail": true,
  "loginWithEmailAllowed": true,
  "duplicateEmailsAllowed": false,
  "resetPasswordAllowed": true,
  "editUsernameAllowed": false,
  "bruteForceProtected": true,
  "permanentLockout": false,
  "maxFailureWaitSeconds": 900,
  "minimumQuickLoginWaitSeconds": 60,
  "waitIncrementSeconds": 60,
  "quickLoginCheckMilliSeconds": 1000,
  "maxDeltaTimeSeconds": 43200,
  "failureFactor": 5,

  "passwordPolicy": "length(12) and upperCase(1) and lowerCase(1) and digits(1) and specialChars(1) and notUsername and passwordHistory(5)",

  "accessTokenLifespan": 3600,
  "accessTokenLifespanForImplicitFlow": 900,
  "ssoSessionIdleTimeout": 1800,
  "ssoSessionMaxLifespan": 36000,
  "ssoSessionIdleTimeoutRememberMe": 0,
  "ssoSessionMaxLifespanRememberMe": 0,
  "offlineSessionIdleTimeout": 2592000,
  "offlineSessionMaxLifespanEnabled": false,
  "clientSessionIdleTimeout": 0,
  "clientSessionMaxLifespan": 0,
  "accessCodeLifespan": 60,
  "accessCodeLifespanUserAction": 300,
  "accessCodeLifespanLogin": 1800,
  "actionTokenGeneratedByAdminLifespan": 43200,
  "actionTokenGeneratedByUserLifespan": 300,

  "defaultSignatureAlgorithm": "RS256",
  "revokeRefreshToken": false,
  "refreshTokenMaxReuse": 0,

  "internationalizationEnabled": true,
  "supportedLocales": ["en", "bn"],
  "defaultLocale": "en",

  "browserSecurityHeaders": {
    "contentSecurityPolicyReportOnly": "",
    "xContentTypeOptions": "nosniff",
    "xRobotsTag": "none",
    "xFrameOptions": "SAMEORIGIN",
    "contentSecurityPolicy": "frame-src 'self'; frame-ancestors 'self'; object-src 'none';",
    "xXSSProtection": "1; mode=block",
    "strictTransportSecurity": "max-age=31536000; includeSubDomains"
  },

  "smtpServer": {
    "host": "smtp.ulms.internal",
    "port": "587",
    "from": "noreply@ulms.unisoft.com.bd",
    "fromDisplayName": "ULMS System",
    "ssl": "false",
    "starttls": "true",
    "auth": "true",
    "user": "smtp-user",
    "password": "**********"
  }
}
```

### 3.3 Password Policy

| Policy | Value | Description |
|--------|-------|-------------|
| **Minimum Length** | 12 characters | Strong password requirement |
| **Uppercase** | At least 1 | Character diversity |
| **Lowercase** | At least 1 | Character diversity |
| **Digits** | At least 1 | Number requirement |
| **Special Characters** | At least 1 | Symbol requirement |
| **Not Username** | Enabled | Cannot contain username |
| **Password History** | 5 | Cannot reuse last 5 passwords |
| **Max Age** | 90 days | Password expiration |

---

## 4. Client Configuration

### 4.1 ULMS Web Application Client

```json
{
  "clientId": "ulms-web-app",
  "name": "ULMS Web Application",
  "description": "React-based web application for ULMS",
  "enabled": true,
  "clientAuthenticatorType": "client-secret",
  "secret": "${ULMS_WEB_CLIENT_SECRET}",
  "redirectUris": [
    "https://app.ulms.unisoft.com.bd/*",
    "https://app.ulms.unisoft.com.bd/silent-renew.html"
  ],
  "webOrigins": [
    "https://app.ulms.unisoft.com.bd"
  ],
  "bearerOnly": false,
  "consentRequired": false,
  "standardFlowEnabled": true,
  "implicitFlowEnabled": false,
  "directAccessGrantsEnabled": false,
  "serviceAccountsEnabled": false,
  "publicClient": true,
  "frontchannelLogout": true,
  "protocol": "openid-connect",
  "attributes": {
    "pkce.code.challenge.method": "S256",
    "post.logout.redirect.uris": "https://app.ulms.unisoft.com.bd/*",
    "login_theme": "ulms-theme",
    "backchannel.logout.session.required": "true",
    "backchannel.logout.revoke.offline.tokens": "false"
  },
  "defaultClientScopes": [
    "openid",
    "profile",
    "email",
    "ulms-api"
  ],
  "optionalClientScopes": [
    "offline_access"
  ],
  "protocolMappers": [
    {
      "name": "tenant-id-mapper",
      "protocol": "openid-connect",
      "protocolMapper": "oidc-usermodel-attribute-mapper",
      "config": {
        "claim.name": "tenantId",
        "user.attribute": "tenantId",
        "id.token.claim": "true",
        "access.token.claim": "true",
        "userinfo.token.claim": "true"
      }
    },
    {
      "name": "branch-id-mapper",
      "protocol": "openid-connect",
      "protocolMapper": "oidc-usermodel-attribute-mapper",
      "config": {
        "claim.name": "branchId",
        "user.attribute": "branchId",
        "id.token.claim": "true",
        "access.token.claim": "true",
        "userinfo.token.claim": "true"
      }
    },
    {
      "name": "approval-limit-mapper",
      "protocol": "openid-connect",
      "protocolMapper": "oidc-usermodel-attribute-mapper",
      "config": {
        "claim.name": "approvalLimit",
        "user.attribute": "approvalLimit",
        "id.token.claim": "true",
        "access.token.claim": "true",
        "userinfo.token.claim": "true",
        "jsonType.label": "long"
      }
    }
  ]
}
```

### 4.2 ULMS Mobile Application Client

```json
{
  "clientId": "ulms-mobile-app",
  "name": "ULMS Mobile CPV Application",
  "description": "React Native mobile app for CPV officers",
  "enabled": true,
  "publicClient": true,
  "standardFlowEnabled": true,
  "implicitFlowEnabled": false,
  "directAccessGrantsEnabled": true,
  "redirectUris": [
    "ulms://callback",
    "ulms://oauth/callback"
  ],
  "attributes": {
    "pkce.code.challenge.method": "S256"
  },
  "defaultClientScopes": [
    "openid",
    "profile",
    "ulms-api"
  ],
  "optionalClientScopes": [
    "offline_access"
  ]
}
```

### 4.3 API Gateway Client (Kong)

```json
{
  "clientId": "ulms-api-gateway",
  "name": "ULMS API Gateway (Kong)",
  "description": "Service account for Kong API Gateway to validate tokens",
  "enabled": true,
  "clientAuthenticatorType": "client-secret",
  "secret": "${KONG_CLIENT_SECRET}",
  "bearerOnly": true,
  "consentRequired": false,
  "standardFlowEnabled": false,
  "implicitFlowEnabled": false,
  "directAccessGrantsEnabled": false,
  "serviceAccountsEnabled": true,
  "publicClient": false,
  "protocol": "openid-connect",
  "defaultClientScopes": [
    "openid"
  ]
}
```

### 4.4 Client Scopes

**ULMS API Scope:**

```json
{
  "name": "ulms-api",
  "description": "Access to ULMS API endpoints",
  "protocol": "openid-connect",
  "attributes": {
    "include.in.token.scope": "true",
    "display.on.consent.screen": "true",
    "consent.screen.text": "Access ULMS loan management functions"
  },
  "protocolMappers": [
    {
      "name": "ulms-api-audience",
      "protocol": "openid-connect",
      "protocolMapper": "oidc-audience-mapper",
      "config": {
        "included.client.audience": "ulms-api",
        "id.token.claim": "false",
        "access.token.claim": "true"
      }
    },
    {
      "name": "realm-roles-mapper",
      "protocol": "openid-connect",
      "protocolMapper": "oidc-usermodel-realm-role-mapper",
      "config": {
        "claim.name": "realm_access.roles",
        "jsonType.label": "String",
        "multivalued": "true",
        "id.token.claim": "true",
        "access.token.claim": "true",
        "userinfo.token.claim": "true"
      }
    }
  ]
}
```

---

## 5. Authentication Flows

### 5.1 Browser Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BROWSER AUTHENTICATION FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    STEP 1: Cookie Check                              │  │
│  │    Check if user has existing session cookie                         │  │
│  │    ├── Has valid session → Skip to authorization                     │  │
│  │    └── No session → Continue to Step 2                               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    STEP 2: Identity Provider Redirect                │  │
│  │    Check if user should use federated identity                       │  │
│  │    ├── Bank domain email → Redirect to LDAP/AD                       │  │
│  │    └── Local user → Continue to Step 3                               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    STEP 3: Username/Password Form                    │  │
│  │    Display login form with:                                          │  │
│  │    ├── Username or Email field                                       │  │
│  │    ├── Password field                                                │  │
│  │    ├── Remember Me checkbox (disabled)                               │  │
│  │    └── Forgot Password link                                          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    STEP 4: Credential Validation                     │  │
│  │    Validate username and password                                    │  │
│  │    ├── Invalid → Show error, increment failure count                 │  │
│  │    ├── Locked out → Show lockout message (15 min)                    │  │
│  │    └── Valid → Continue to Step 5                                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    STEP 5: Conditional MFA Check                     │  │
│  │    Check if MFA is required based on:                                │  │
│  │    ├── User role (BRANCH_MANAGER+, always required)                  │  │
│  │    ├── New device detection → Required                               │  │
│  │    ├── High-risk action → Required                                   │  │
│  │    └── Standard login → Optional based on policy                     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    STEP 6: OTP Verification (If Required)            │  │
│  │    Send SMS OTP and display verification form                        │  │
│  │    ├── Valid OTP → Continue to authorization                         │  │
│  │    └── Invalid OTP (3 attempts) → Return to login                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    STEP 7: Session Creation                          │  │
│  │    Create session and issue tokens                                   │  │
│  │    ├── Set session cookie (HttpOnly, Secure, SameSite=Strict)        │  │
│  │    ├── Generate access token (JWT)                                   │  │
│  │    ├── Generate refresh token                                        │  │
│  │    └── Redirect to application with authorization code               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Authentication Flow Configuration

```json
{
  "alias": "ulms-browser-flow",
  "description": "ULMS browser-based authentication with conditional MFA",
  "providerId": "basic-flow",
  "topLevel": true,
  "builtIn": false,
  "authenticationExecutions": [
    {
      "authenticator": "auth-cookie",
      "requirement": "ALTERNATIVE",
      "priority": 10
    },
    {
      "authenticator": "identity-provider-redirector",
      "requirement": "ALTERNATIVE",
      "priority": 20,
      "authenticatorConfig": {
        "alias": "bank-idp-config",
        "config": {
          "defaultProvider": "bank-ldap"
        }
      }
    },
    {
      "flowAlias": "ulms-forms-flow",
      "requirement": "ALTERNATIVE",
      "priority": 30
    }
  ]
}
```

### 5.3 Forms Sub-Flow

```json
{
  "alias": "ulms-forms-flow",
  "description": "Username/password with conditional OTP",
  "providerId": "basic-flow",
  "topLevel": false,
  "authenticationExecutions": [
    {
      "authenticator": "auth-username-password-form",
      "requirement": "REQUIRED",
      "priority": 10
    },
    {
      "flowAlias": "ulms-conditional-otp",
      "requirement": "CONDITIONAL",
      "priority": 20
    }
  ]
}
```

---

## 6. OAuth 2.0 / OpenID Connect

### 6.1 Authorization Code Flow with PKCE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 AUTHORIZATION CODE FLOW WITH PKCE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐                               ┌──────────┐                    │
│  │   User   │                               │ Keycloak │                    │
│  │ Browser  │                               │   IdP    │                    │
│  └────┬─────┘                               └────┬─────┘                    │
│       │                                          │                          │
│       │  1. Click "Login"                        │                          │
│       │─────────────────────────────────────────▶│                          │
│       │                                          │                          │
│       │  2. Generate code_verifier (random)      │                          │
│       │     code_challenge = SHA256(verifier)    │                          │
│       │                                          │                          │
│       │  3. Authorization Request                │                          │
│       │     GET /auth?                           │                          │
│       │       response_type=code&                │                          │
│       │       client_id=ulms-web-app&            │                          │
│       │       redirect_uri=https://app/callback& │                          │
│       │       scope=openid profile ulms-api&     │                          │
│       │       state={random}&                    │                          │
│       │       code_challenge={challenge}&        │                          │
│       │       code_challenge_method=S256         │                          │
│       │─────────────────────────────────────────▶│                          │
│       │                                          │                          │
│       │  4. Login Page                           │                          │
│       │◀─────────────────────────────────────────│                          │
│       │                                          │                          │
│       │  5. Enter Credentials + MFA              │                          │
│       │─────────────────────────────────────────▶│                          │
│       │                                          │                          │
│       │  6. Authorization Code                   │                          │
│       │     302 Redirect to:                     │                          │
│       │     https://app/callback?                │                          │
│       │       code={auth_code}&                  │                          │
│       │       state={same_state}                 │                          │
│       │◀─────────────────────────────────────────│                          │
│       │                                          │                          │
│       │  7. Token Exchange                       │                          │
│       │     POST /token                          │                          │
│       │       grant_type=authorization_code&     │                          │
│       │       code={auth_code}&                  │                          │
│       │       redirect_uri=https://app/callback& │                          │
│       │       code_verifier={verifier}           │                          │
│       │─────────────────────────────────────────▶│                          │
│       │                                          │                          │
│       │  8. Tokens Response                      │                          │
│       │     {                                    │                          │
│       │       "access_token": "eyJ...",          │                          │
│       │       "refresh_token": "eyJ...",         │                          │
│       │       "id_token": "eyJ...",              │                          │
│       │       "expires_in": 3600,                │                          │
│       │       "token_type": "Bearer"             │                          │
│       │     }                                    │                          │
│       │◀─────────────────────────────────────────│                          │
│       │                                          │                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Token Endpoints

| Endpoint | URL | Purpose |
|----------|-----|---------|
| **Authorization** | `/realms/ulms/protocol/openid-connect/auth` | Initiate login |
| **Token** | `/realms/ulms/protocol/openid-connect/token` | Exchange code for tokens |
| **UserInfo** | `/realms/ulms/protocol/openid-connect/userinfo` | Get user profile |
| **Introspect** | `/realms/ulms/protocol/openid-connect/token/introspect` | Validate token |
| **Logout** | `/realms/ulms/protocol/openid-connect/logout` | End session |
| **JWKS** | `/realms/ulms/protocol/openid-connect/certs` | Public keys |
| **Discovery** | `/realms/ulms/.well-known/openid-configuration` | OIDC config |

### 6.3 Token Refresh Flow

```typescript
// React Token Refresh Example
async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const tokenEndpoint = 'https://auth.ulms.unisoft.com.bd/realms/ulms/protocol/openid-connect/token';

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: 'ulms-web-app',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  return response.json();
}

// Automatic Token Refresh (5 minutes before expiry)
function scheduleTokenRefresh(expiresIn: number, refreshToken: string) {
  const refreshTime = (expiresIn - 300) * 1000; // 5 minutes before expiry

  setTimeout(async () => {
    try {
      const newTokens = await refreshAccessToken(refreshToken);
      updateStoredTokens(newTokens);
      scheduleTokenRefresh(newTokens.expires_in, newTokens.refresh_token);
    } catch (error) {
      // Redirect to login
      window.location.href = '/login';
    }
  }, refreshTime);
}
```

---

## 7. Multi-Factor Authentication

### 7.1 SMS OTP Configuration

```json
{
  "alias": "sms-otp-authenticator",
  "config": {
    "sms.gateway": "infobip",
    "sms.api.url": "https://api.infobip.com/sms/2/text/single",
    "sms.api.key": "${SMS_API_KEY}",
    "sms.sender.id": "ULMS",
    "sms.message.template": "Your ULMS verification code is: {{OTP}}. Valid for 5 minutes. Do not share this code.",
    "otp.length": "6",
    "otp.validity.seconds": "300",
    "otp.max.attempts": "3",
    "otp.algorithm": "HmacSHA256"
  }
}
```

### 7.2 Conditional OTP Policy

```json
{
  "alias": "ulms-conditional-otp",
  "description": "Conditional OTP based on user role and context",
  "providerId": "basic-flow",
  "authenticationExecutions": [
    {
      "authenticator": "conditional-user-role",
      "requirement": "REQUIRED",
      "priority": 10,
      "authenticatorConfig": {
        "config": {
          "condUserRole": "BRANCH_MANAGER",
          "negate": "false"
        }
      }
    },
    {
      "authenticator": "auth-otp-form",
      "requirement": "REQUIRED",
      "priority": 20
    }
  ]
}
```

### 7.3 MFA Trigger Conditions

| Condition | MFA Required | Rationale |
|-----------|--------------|-----------|
| **Role: BRANCH_MANAGER+** | Always | Higher privilege users |
| **Role: CREDIT_ADMIN** | Always | Disbursement authority |
| **Role: SYSTEM_ADMIN** | Always | System configuration |
| **New Device Detected** | Always | Security measure |
| **Password Changed** | First login after | Verify identity |
| **Unusual Location** | Always | Geographic anomaly |
| **After 30 Days** | Periodic re-auth | Regular verification |

### 7.4 SMS Gateway Integration

```java
@Service
public class SmsOtpService {

    private final RestTemplate restTemplate;
    private final SmsGatewayConfig config;

    public void sendOtp(String phoneNumber, String otp) {
        // Format phone number for Bangladesh (+880)
        String formattedPhone = formatBangladeshPhone(phoneNumber);

        // Prepare SMS request
        SmsRequest request = SmsRequest.builder()
            .to(formattedPhone)
            .from(config.getSenderId())
            .text(String.format(
                "Your ULMS verification code is: %s. Valid for 5 minutes. Do not share.",
                otp
            ))
            .build();

        // Send via Infobip API
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "App " + config.getApiKey());
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<SmsRequest> entity = new HttpEntity<>(request, headers);

        ResponseEntity<SmsResponse> response = restTemplate.postForEntity(
            config.getApiUrl(),
            entity,
            SmsResponse.class
        );

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new OtpDeliveryException("Failed to send OTP via SMS");
        }

        log.info("OTP sent to phone: {}****{}",
                 formattedPhone.substring(0, 6),
                 formattedPhone.substring(formattedPhone.length() - 2));
    }

    private String formatBangladeshPhone(String phone) {
        // Remove any non-digit characters
        String digits = phone.replaceAll("\\D", "");

        // Ensure +880 prefix
        if (digits.startsWith("0")) {
            return "+880" + digits.substring(1);
        } else if (digits.startsWith("880")) {
            return "+" + digits;
        } else if (!digits.startsWith("+880")) {
            return "+880" + digits;
        }
        return digits;
    }
}
```

---

## 8. Federation & Single Sign-On

### 8.1 LDAP Federation Configuration

```json
{
  "name": "bank-ldap",
  "providerId": "ldap",
  "providerType": "org.keycloak.storage.UserStorageProvider",
  "config": {
    "enabled": ["true"],
    "priority": ["0"],
    "editMode": ["READ_ONLY"],
    "syncRegistrations": ["false"],
    "vendor": ["ad"],
    "usernameLDAPAttribute": ["sAMAccountName"],
    "rdnLDAPAttribute": ["cn"],
    "uuidLDAPAttribute": ["objectGUID"],
    "userObjectClasses": ["person, organizationalPerson, user"],
    "connectionUrl": ["ldaps://ldap.bank.com.bd:636"],
    "usersDn": ["OU=Users,DC=bank,DC=com,DC=bd"],
    "authType": ["simple"],
    "bindDn": ["CN=keycloak-svc,OU=ServiceAccounts,DC=bank,DC=com,DC=bd"],
    "bindCredential": ["${LDAP_BIND_PASSWORD}"],
    "searchScope": ["2"],
    "validatePasswordPolicy": ["false"],
    "trustEmail": ["true"],
    "useTruststoreSpi": ["ldapsOnly"],
    "connectionPooling": ["true"],
    "connectionPoolingAuthentication": ["simple"],
    "connectionPoolingDebug": ["off"],
    "connectionPoolingInitSize": ["1"],
    "connectionPoolingMaxSize": ["10"],
    "connectionPoolingPrefSize": ["5"],
    "connectionPoolingProtocol": ["plain ssl"],
    "connectionPoolingTimeout": ["300000"],
    "connectionTimeout": ["10000"],
    "readTimeout": ["10000"],
    "pagination": ["true"],
    "batchSizeForSync": ["1000"],
    "fullSyncPeriod": ["-1"],
    "changedSyncPeriod": ["86400"],
    "cachePolicy": ["DEFAULT"],
    "evictionDay": [],
    "evictionHour": [],
    "evictionMinute": [],
    "maxLifespan": []
  }
}
```

### 8.2 LDAP Attribute Mappers

```json
{
  "ldapMappers": [
    {
      "name": "username",
      "providerId": "user-attribute-ldap-mapper",
      "config": {
        "ldap.attribute": "sAMAccountName",
        "user.model.attribute": "username",
        "read.only": "true",
        "always.read.value.from.ldap": "true",
        "is.mandatory.in.ldap": "true"
      }
    },
    {
      "name": "email",
      "providerId": "user-attribute-ldap-mapper",
      "config": {
        "ldap.attribute": "mail",
        "user.model.attribute": "email",
        "read.only": "true",
        "always.read.value.from.ldap": "true",
        "is.mandatory.in.ldap": "true"
      }
    },
    {
      "name": "first-name",
      "providerId": "user-attribute-ldap-mapper",
      "config": {
        "ldap.attribute": "givenName",
        "user.model.attribute": "firstName",
        "read.only": "true"
      }
    },
    {
      "name": "last-name",
      "providerId": "user-attribute-ldap-mapper",
      "config": {
        "ldap.attribute": "sn",
        "user.model.attribute": "lastName",
        "read.only": "true"
      }
    },
    {
      "name": "employee-id",
      "providerId": "user-attribute-ldap-mapper",
      "config": {
        "ldap.attribute": "employeeID",
        "user.model.attribute": "employeeId",
        "read.only": "true"
      }
    },
    {
      "name": "department",
      "providerId": "user-attribute-ldap-mapper",
      "config": {
        "ldap.attribute": "department",
        "user.model.attribute": "department",
        "read.only": "true"
      }
    },
    {
      "name": "branch-code",
      "providerId": "user-attribute-ldap-mapper",
      "config": {
        "ldap.attribute": "physicalDeliveryOfficeName",
        "user.model.attribute": "branchId",
        "read.only": "true"
      }
    },
    {
      "name": "group-mapper",
      "providerId": "group-ldap-mapper",
      "config": {
        "groups.dn": "OU=Groups,DC=bank,DC=com,DC=bd",
        "group.name.ldap.attribute": "cn",
        "group.object.classes": "group",
        "membership.ldap.attribute": "member",
        "membership.attribute.type": "DN",
        "mode": "READ_ONLY",
        "user.roles.retrieve.strategy": "LOAD_GROUPS_BY_MEMBER_ATTRIBUTE",
        "drop.non.existing.groups.during.sync": "false"
      }
    }
  ]
}
```

### 8.3 First Broker Login Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FIRST BROKER LOGIN FLOW (LDAP)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. User authenticates via LDAP                                              │
│                    │                                                         │
│                    ▼                                                         │
│  2. Check if user exists in Keycloak                                         │
│     ├── Exists → Link accounts                                               │
│     └── Not exists → Continue                                                │
│                    │                                                         │
│                    ▼                                                         │
│  3. Review Profile (if required)                                             │
│     ├── Display user info from LDAP                                          │
│     ├── Allow user to verify email                                           │
│     └── Collect missing attributes                                           │
│                    │                                                         │
│                    ▼                                                         │
│  4. Map LDAP groups to Keycloak roles                                        │
│     ├── LDAP: CN=LoanOfficers → ROLE: CREDIT_ANALYST                        │
│     ├── LDAP: CN=BranchManagers → ROLE: BRANCH_MANAGER                      │
│     └── LDAP: CN=HOCredit → ROLE: HEAD_OF_CREDIT                            │
│                    │                                                         │
│                    ▼                                                         │
│  5. Set custom attributes                                                    │
│     ├── tenantId from LDAP OU                                                │
│     ├── branchId from LDAP attribute                                         │
│     └── approvalLimit from role mapping                                      │
│                    │                                                         │
│                    ▼                                                         │
│  6. Create local Keycloak user                                               │
│     └── Link to LDAP federation                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Session Management

### 9.1 Session Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| **SSO Session Idle** | 1800 seconds (30 min) | Idle timeout |
| **SSO Session Max** | 36000 seconds (10 hours) | Maximum session length |
| **Offline Session Idle** | 30 days | Offline token idle |
| **Access Token Lifespan** | 3600 seconds (1 hour) | Token validity |
| **Refresh Token Lifespan** | 86400 seconds (24 hours) | Refresh validity |

### 9.2 Session Security

```java
// Session Cookie Configuration
@Bean
public CookieSerializer cookieSerializer() {
    DefaultCookieSerializer serializer = new DefaultCookieSerializer();
    serializer.setCookieName("KEYCLOAK_SESSION");
    serializer.setDomainName(".ulms.unisoft.com.bd");
    serializer.setCookiePath("/");
    serializer.setUseSecureCookie(true);          // HTTPS only
    serializer.setUseHttpOnlyCookie(true);        // No JavaScript access
    serializer.setSameSite("Strict");             // CSRF protection
    serializer.setCookieMaxAge(1800);             // 30 minutes
    return serializer;
}
```

### 9.3 Concurrent Session Control

```json
{
  "alias": "session-limits",
  "config": {
    "max-sessions": "3",
    "behavior-on-exceeded": "terminate-oldest"
  }
}
```

**Session Limits by Role:**

| Role | Max Concurrent Sessions | On Exceed |
|------|------------------------|-----------|
| **BRANCH_USER** | 2 | Terminate oldest |
| **CREDIT_ANALYST** | 2 | Terminate oldest |
| **BRANCH_MANAGER** | 3 | Terminate oldest |
| **HEAD_OF_CREDIT** | 3 | Block new login |
| **MD** | 5 | Block new login |
| **SYSTEM_ADMIN** | 3 | Block new login |

---

## 10. Token Management

### 10.1 JWT Token Structure

**Access Token Claims:**

```json
{
  "exp": 1707004800,
  "iat": 1707001200,
  "jti": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "iss": "https://auth.ulms.unisoft.com.bd/realms/ulms",
  "aud": ["ulms-api", "account"],
  "sub": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "typ": "Bearer",
  "azp": "ulms-web-app",
  "session_state": "abc123-session-state",
  "acr": "1",
  "allowed-origins": ["https://app.ulms.unisoft.com.bd"],
  "realm_access": {
    "roles": ["BRANCH_MANAGER", "BRANCH_USER"]
  },
  "resource_access": {
    "ulms-api": {
      "roles": ["loan:read", "loan:create", "loan:approve", "customer:read"]
    }
  },
  "scope": "openid profile email ulms-api",
  "sid": "abc123-session-id",
  "email_verified": true,
  "name": "Mohammad Rahman",
  "preferred_username": "m.rahman",
  "given_name": "Mohammad",
  "family_name": "Rahman",
  "email": "m.rahman@bank.com.bd",
  "tenantId": "BANK_001",
  "branchId": "BR-DHK-001",
  "branchName": "Dhaka Main Branch",
  "employeeId": "EMP-10234",
  "approvalLimit": 1000000
}
```

### 10.2 Token Signing Keys

```yaml
# RSA Key Configuration
keys:
  - kid: "ulms-key-2026-001"
    algorithm: RS256
    keySize: 2048
    priority: 100
    enabled: true
    active: true

  - kid: "ulms-key-2026-002"
    algorithm: RS256
    keySize: 2048
    priority: 90
    enabled: true
    active: false  # For key rotation

keyRotation:
  enabled: true
  rotationPeriod: 365  # days
  gracePeriod: 30      # days to keep old key for validation
```

### 10.3 Token Validation (Kong)

```yaml
# Kong JWT Validation Plugin
plugins:
  - name: jwt
    config:
      uri_param_names: []
      cookie_names: []
      header_names:
        - Authorization
      claims_to_verify:
        - exp
        - iat
      key_claim_name: kid
      secret_is_base64: false
      run_on_preflight: true
      maximum_expiration: 3600

consumers:
  - username: ulms-api-consumer
    jwt_secrets:
      - key: ulms-key-2026-001
        algorithm: RS256
        rsa_public_key: |
          -----BEGIN PUBLIC KEY-----
          MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
          -----END PUBLIC KEY-----
```

---

## 11. User Management

### 11.1 User Attributes

| Attribute | Type | Source | Description |
|-----------|------|--------|-------------|
| `username` | String | LDAP/Manual | Login identifier |
| `email` | String | LDAP/Manual | Email address |
| `firstName` | String | LDAP/Manual | First name |
| `lastName` | String | LDAP/Manual | Last name |
| `tenantId` | String | Custom | Bank identifier |
| `branchId` | String | LDAP/Custom | Branch code |
| `branchName` | String | Custom | Branch display name |
| `employeeId` | String | LDAP | Employee number |
| `approvalLimit` | Long | Role-based | Max approval amount |
| `phoneNumber` | String | Manual | Mobile for OTP |

### 11.2 User Provisioning

**Automatic Provisioning (LDAP Sync):**

```
LDAP User → Keycloak User
├── Sync on first login
├── Periodic sync (daily)
├── Attribute mapping
└── Group-to-role mapping
```

**Manual User Creation (Admin Console):**

```json
{
  "username": "new.user",
  "enabled": true,
  "emailVerified": true,
  "firstName": "New",
  "lastName": "User",
  "email": "new.user@bank.com.bd",
  "attributes": {
    "tenantId": ["BANK_001"],
    "branchId": ["BR-DHK-002"],
    "branchName": ["Dhaka Gulshan Branch"],
    "employeeId": ["EMP-20456"],
    "phoneNumber": ["+8801712345678"]
  },
  "credentials": [{
    "type": "password",
    "value": "TempPassword123!",
    "temporary": true
  }],
  "realmRoles": ["CREDIT_ANALYST"],
  "requiredActions": ["UPDATE_PASSWORD", "VERIFY_EMAIL"]
}
```

### 11.3 User Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER LIFECYCLE STATES                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐                                                            │
│  │   Created   │  Initial state (via Admin or LDAP sync)                    │
│  └──────┬──────┘                                                            │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────┐                                                            │
│  │   Pending   │  Email verification required                               │
│  │ Verification│                                                            │
│  └──────┬──────┘                                                            │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────┐                                                            │
│  │   Active    │  Normal operational state                                  │
│  └──────┬──────┘                                                            │
│         │                                                                    │
│    ┌────┴────┐                                                              │
│    │         │                                                               │
│    ▼         ▼                                                               │
│  ┌─────────────┐  ┌─────────────┐                                          │
│  │   Locked    │  │  Disabled   │                                          │
│  │ (Temp/Brute)│  │  (Manual)   │                                          │
│  └──────┬──────┘  └──────┬──────┘                                          │
│         │                │                                                   │
│         └────────┬───────┘                                                   │
│                  │                                                           │
│                  ▼                                                           │
│         ┌─────────────┐                                                     │
│         │   Deleted   │  Soft delete (audit retention)                      │
│         └─────────────┘                                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 12. Integration Guide

### 12.1 React Integration (OIDC Client)

```typescript
// keycloak.ts
import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: 'https://auth.ulms.unisoft.com.bd',
  realm: 'ulms',
  clientId: 'ulms-web-app',
};

const keycloak = new Keycloak(keycloakConfig);

export const initKeycloak = async (): Promise<boolean> => {
  try {
    const authenticated = await keycloak.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      pkceMethod: 'S256',
      checkLoginIframe: false,
    });

    if (authenticated) {
      // Schedule token refresh
      scheduleTokenRefresh();
    }

    return authenticated;
  } catch (error) {
    console.error('Keycloak initialization failed:', error);
    return false;
  }
};

export const login = (): void => {
  keycloak.login({
    redirectUri: window.location.origin + '/dashboard',
  });
};

export const logout = (): void => {
  keycloak.logout({
    redirectUri: window.location.origin + '/login',
  });
};

export const getToken = (): string | undefined => {
  return keycloak.token;
};

export const getTokenParsed = (): KeycloakTokenParsed | undefined => {
  return keycloak.tokenParsed;
};

export const getUserRoles = (): string[] => {
  return keycloak.tokenParsed?.realm_access?.roles || [];
};

export const hasRole = (role: string): boolean => {
  return getUserRoles().includes(role);
};

export const getCustomClaim = <T>(claim: string): T | undefined => {
  return keycloak.tokenParsed?.[claim] as T;
};

const scheduleTokenRefresh = (): void => {
  setInterval(async () => {
    try {
      const refreshed = await keycloak.updateToken(300); // Refresh if expires in 5 min
      if (refreshed) {
        console.log('Token refreshed');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      keycloak.login();
    }
  }, 60000); // Check every minute
};

export default keycloak;
```

### 12.2 Spring Boot Integration

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/v1/admin/**").hasRole("SYSTEM_ADMIN")
                .requestMatchers("/api/v1/loans/approve/**").hasAnyRole(
                    "BRANCH_CREDIT_HEAD", "BRANCH_MANAGER", "REGIONAL_MANAGER",
                    "HEAD_OF_CREDIT", "CREDIT_COMMITTEE", "DEPUTY_MD", "MD"
                )
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .jwtAuthenticationConverter(jwtAuthenticationConverter())
                )
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .csrf(csrf -> csrf.disable());

        return http.build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter =
            new JwtGrantedAuthoritiesConverter();
        grantedAuthoritiesConverter.setAuthorityPrefix("ROLE_");
        grantedAuthoritiesConverter.setAuthoritiesClaimName("realm_access.roles");

        JwtAuthenticationConverter jwtAuthenticationConverter =
            new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(
            new KeycloakRealmRoleConverter()
        );

        return jwtAuthenticationConverter;
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        return JwtDecoders.fromIssuerLocation(
            "https://auth.ulms.unisoft.com.bd/realms/ulms"
        );
    }
}

// Custom Role Converter
public class KeycloakRealmRoleConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess == null) {
            return Collections.emptyList();
        }

        @SuppressWarnings("unchecked")
        List<String> roles = (List<String>) realmAccess.get("roles");
        if (roles == null) {
            return Collections.emptyList();
        }

        return roles.stream()
            .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
            .collect(Collectors.toList());
    }
}

// Custom Principal with ULMS Claims
@Component
public class UlmsPrincipalExtractor {

    public UlmsPrincipal extractPrincipal(Jwt jwt) {
        return UlmsPrincipal.builder()
            .userId(jwt.getSubject())
            .username(jwt.getClaim("preferred_username"))
            .email(jwt.getClaim("email"))
            .fullName(jwt.getClaim("name"))
            .tenantId(jwt.getClaim("tenantId"))
            .branchId(jwt.getClaim("branchId"))
            .branchName(jwt.getClaim("branchName"))
            .employeeId(jwt.getClaim("employeeId"))
            .approvalLimit(jwt.getClaim("approvalLimit"))
            .roles(extractRoles(jwt))
            .build();
    }

    private List<String> extractRoles(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess != null) {
            return (List<String>) realmAccess.get("roles");
        }
        return Collections.emptyList();
    }
}
```

---

## 13. Security Hardening

### 13.1 Keycloak Security Checklist

| Setting | Recommended Value | Status |
|---------|-------------------|--------|
| **SSL Required** | All | ✅ |
| **Registration Allowed** | Disabled | ✅ |
| **Brute Force Protection** | Enabled | ✅ |
| **Password Policy** | 12+ chars, complexity | ✅ |
| **Content Security Policy** | Strict | ✅ |
| **X-Frame-Options** | SAMEORIGIN | ✅ |
| **Admin Console Access** | IP restricted | ✅ |
| **Audit Logging** | Enabled | ✅ |
| **Public Key Rotation** | Annual | ✅ |

### 13.2 Admin Console Protection

```yaml
# Restrict Admin Console Access
admin_console:
  allowed_ips:
    - 192.168.1.0/24    # Office network
    - 10.0.0.0/8        # VPN network
  require_mfa: true
  session_timeout: 900   # 15 minutes
  max_sessions: 2
```

### 13.3 Event Logging

```json
{
  "eventsEnabled": true,
  "eventsExpiration": 7776000,
  "eventsListeners": ["jboss-logging", "kafka-listener"],
  "enabledEventTypes": [
    "LOGIN",
    "LOGIN_ERROR",
    "LOGOUT",
    "LOGOUT_ERROR",
    "REGISTER",
    "REGISTER_ERROR",
    "CODE_TO_TOKEN",
    "CODE_TO_TOKEN_ERROR",
    "REFRESH_TOKEN",
    "REFRESH_TOKEN_ERROR",
    "UPDATE_PASSWORD",
    "UPDATE_PASSWORD_ERROR",
    "SEND_RESET_PASSWORD",
    "SEND_RESET_PASSWORD_ERROR",
    "RESET_PASSWORD",
    "RESET_PASSWORD_ERROR",
    "VERIFY_EMAIL",
    "VERIFY_EMAIL_ERROR",
    "IMPERSONATE",
    "CUSTOM_REQUIRED_ACTION",
    "CUSTOM_REQUIRED_ACTION_ERROR",
    "GRANT_CONSENT",
    "GRANT_CONSENT_ERROR",
    "UPDATE_CONSENT",
    "UPDATE_CONSENT_ERROR",
    "REVOKE_GRANT",
    "REVOKE_GRANT_ERROR",
    "CLIENT_LOGIN",
    "CLIENT_LOGIN_ERROR",
    "TOKEN_EXCHANGE",
    "TOKEN_EXCHANGE_ERROR"
  ],
  "adminEventsEnabled": true,
  "adminEventsDetailsEnabled": true
}
```

---

## 14. Monitoring & Audit

### 14.1 Metrics (Prometheus)

```yaml
# Keycloak Metrics
keycloak_logins_total
keycloak_login_errors_total
keycloak_registrations_total
keycloak_refresh_tokens_total
keycloak_active_sessions
keycloak_request_duration_seconds

# Alert Rules
groups:
  - name: keycloak-alerts
    rules:
      - alert: HighLoginFailureRate
        expr: rate(keycloak_login_errors_total[5m]) > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High login failure rate detected"

      - alert: KeycloakDown
        expr: up{job="keycloak"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Keycloak instance is down"
```

### 14.2 Grafana Dashboard

**Key Metrics:**
- Login success/failure rate
- Active sessions per realm
- Token issuance rate
- MFA trigger rate
- Session duration distribution
- Error rate by type

---

## 15. Appendices

### 15.1 Keycloak CLI Commands

```bash
# Export realm configuration
/opt/keycloak/bin/kc.sh export --realm ulms --dir /export

# Import realm configuration
/opt/keycloak/bin/kc.sh import --file /import/ulms-realm.json

# Create admin user
/opt/keycloak/bin/kc.sh bootstrap-admin user

# Start in development mode
/opt/keycloak/bin/kc.sh start-dev

# Start in production mode
/opt/keycloak/bin/kc.sh start --hostname=auth.ulms.unisoft.com.bd
```

### 15.2 Troubleshooting

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Token validation fails | Clock skew | Sync NTP on all servers |
| LDAP sync fails | Connection timeout | Check firewall, increase timeout |
| MFA OTP not received | SMS gateway issue | Check gateway logs, credits |
| Session not persisting | Cookie settings | Verify domain, secure flag |
| High memory usage | Session buildup | Tune session cleanup interval |

### 15.3 Related Documents

| Document ID | Document Name |
|-------------|---------------|
| ARCH-1.4.1 | Security Architecture Document |
| ARCH-1.4.3 | Data Encryption Strategy |
| ARCH-1.4.4 | Secrets Management Design (Vault) |
| ARCH-1.4.6 | RBAC Authorization Matrix |

---

**Document Version:** 1.0
**Classification:** Confidential - Internal Use
**Last Updated:** February 5, 2026
**Next Review:** August 2026

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

*This Authentication & Authorization Design Document defines the Keycloak-based identity management for ULMS v2.0.*

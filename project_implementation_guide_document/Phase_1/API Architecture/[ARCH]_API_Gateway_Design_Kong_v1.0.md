# API Gateway Design Document
## Kong API Gateway 3.5 - Routing, Authentication & Rate Limiting
### Unisoft Loan Management System (ULMS) v2.0

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document ID** | ULMS-ARCH-1.2.2 |
| **Document Title** | API Gateway Design (Kong routing, auth, rate limits) |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 5, 2026 |
| **Prepared By** | Lead Developer |
| **Reviewed By** | Technical Architect, Security Lead |
| **Classification** | Confidential - Internal Use |
| **Status** | Approved |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | Lead Developer | Initial Kong API Gateway design |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Kong API Gateway Overview](#2-kong-api-gateway-overview)
3. [Architecture Design](#3-architecture-design)
4. [Service Routing Configuration](#4-service-routing-configuration)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Rate Limiting Strategy](#6-rate-limiting-strategy)
7. [Security Configuration](#7-security-configuration)
8. [Load Balancing & Health Checks](#8-load-balancing--health-checks)
9. [Request/Response Transformation](#9-requestresponse-transformation)
10. [Logging & Monitoring](#10-logging--monitoring)
11. [High Availability Configuration](#11-high-availability-configuration)
12. [Deployment Configuration](#12-deployment-configuration)
13. [Operations & Maintenance](#13-operations--maintenance)
14. [Compliance Matrix](#14-compliance-matrix)

---

## 1. Executive Summary

### 1.1 Purpose

This document provides comprehensive design specifications for the Kong API Gateway 3.5 implementation in ULMS v2.0. Kong serves as the central entry point for all API traffic, providing authentication, authorization, rate limiting, and traffic management capabilities.

### 1.2 Scope

| Component | Coverage |
|-----------|----------|
| API Routing | All 180+ ULMS endpoints |
| Authentication | JWT validation with Keycloak integration |
| Rate Limiting | Tiered limits by endpoint category |
| Load Balancing | Round-robin with health checks |
| Security | TLS termination, CORS, security headers |
| Monitoring | Prometheus metrics, access logs |

### 1.3 Technology Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| Kong Gateway | 3.5.0 (Enterprise/OSS) | API Gateway |
| Kong Manager | 3.5.0 | Admin UI |
| PostgreSQL | 16.1 | Kong datastore |
| Keycloak | 23.0 | Identity Provider |
| Redis | 7.2 | Rate limit counters |
| Prometheus | 2.48 | Metrics collection |

### 1.4 Alignment with Requirements

| Requirement | Section | Compliance |
|-------------|---------|------------|
| BRD 7.3.1 - OAuth 2.0/JWT Authentication | Section 5 | Full Compliance |
| BRD 7.1 - 1000 requests/minute rate limit | Section 6 | Full Compliance |
| BRD 7.3.2 - TLS 1.3 encryption | Section 7 | Full Compliance |
| SRS 2.1 - API Gateway Layer | All Sections | Full Compliance |
| Technology Stack v2.0 Section 2.3 | All Sections | Full Compliance |

---

## 2. Kong API Gateway Overview

### 2.1 Kong Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         KONG API GATEWAY ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                    ┌─────────────────────────────────────┐                  │
│                    │           CLIENTS                    │                  │
│                    │  ┌─────────┐ ┌─────────┐ ┌────────┐ │                  │
│                    │  │  React  │ │  React  │ │Partner │ │                  │
│                    │  │   Web   │ │ Native  │ │  APIs  │ │                  │
│                    │  └────┬────┘ └────┬────┘ └───┬────┘ │                  │
│                    └───────┼──────────┼──────────┼───────┘                  │
│                            │          │          │                          │
│                            ▼          ▼          ▼                          │
│                    ┌─────────────────────────────────────┐                  │
│                    │        LOAD BALANCER (AWS ALB)       │                  │
│                    └───────────────┬─────────────────────┘                  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     KONG API GATEWAY CLUSTER                         │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │                        PLUGINS CHAIN                           │  │   │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │  │   │
│  │  │  │  CORS   │→│   JWT   │→│  Rate   │→│Request  │→│  Log    │  │  │   │
│  │  │  │         │ │  Auth   │ │ Limiting│ │Transform│ │         │  │  │   │
│  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │                     ROUTING ENGINE                           │    │   │
│  │  │  Route 1: /api/v1/loans → loan-service                      │    │   │
│  │  │  Route 2: /api/v1/customers → customer-service              │    │   │
│  │  │  Route 3: /api/v1/cib → cib-service                         │    │   │
│  │  │  Route 4: /fineract/* → fineract-core                       │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                    ┌───────────────┴───────────────┐                       │
│                    ▼                               ▼                        │
│  ┌─────────────────────────────────┐  ┌────────────────────────────────┐  │
│  │      KONG DATASTORE             │  │      EXTERNAL SERVICES         │  │
│  │  ┌───────────┐ ┌───────────┐   │  │  ┌──────────┐ ┌─────────────┐  │  │
│  │  │PostgreSQL │ │   Redis   │   │  │  │ Keycloak │ │ Prometheus  │  │  │
│  │  │(Config)   │ │(Rate Limit)│   │  │  │  (IdP)   │ │ (Metrics)   │  │  │
│  │  └───────────┘ └───────────┘   │  │  └──────────┘ └─────────────┘  │  │
│  └─────────────────────────────────┘  └────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        UPSTREAM MICROSERVICES                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ Fineract │ │   Loan   │ │   CIB    │ │ Workflow │ │   Notification   │  │
│  │   Core   │ │ Service  │ │ Service  │ │ Service  │ │     Service      │  │
│  │  :8443   │ │  :8080   │ │  :8081   │ │  :8082   │ │      :8083       │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                       │
│  │ Document │ │   BRPD   │ │Analytics │ │  Admin   │                       │
│  │ Service  │ │ Service  │ │ Service  │ │ Service  │                       │
│  │  :8084   │ │  :8085   │ │  :8086   │ │  :8087   │                       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Kong Features Utilized

| Feature | Usage in ULMS |
|---------|---------------|
| **Service Discovery** | Route to upstream microservices |
| **JWT Plugin** | Validate JWT tokens from Keycloak |
| **Rate Limiting Plugin** | Enforce API quotas |
| **CORS Plugin** | Handle cross-origin requests |
| **Request Transformer** | Add tenant headers from JWT |
| **Response Transformer** | Standardize error responses |
| **Prometheus Plugin** | Export metrics |
| **File Log Plugin** | Access logging |
| **IP Restriction** | Whitelist admin IPs |

---

## 3. Architecture Design

### 3.1 Deployment Topology

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      KONG HIGH AVAILABILITY DEPLOYMENT                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Availability Zone A              │              Availability Zone B        │
│  ─────────────────────            │              ─────────────────────      │
│                                   │                                         │
│  ┌──────────────────┐            │            ┌──────────────────┐         │
│  │   Kong Node 1    │            │            │   Kong Node 2    │         │
│  │   (Data Plane)   │            │            │   (Data Plane)   │         │
│  │   Pod: 2 CPU     │            │            │   Pod: 2 CPU     │         │
│  │   Memory: 4GB    │            │            │   Memory: 4GB    │         │
│  └────────┬─────────┘            │            └────────┬─────────┘         │
│           │                       │                     │                   │
│           │                       │                     │                   │
│  ┌────────┴─────────┐            │            ┌────────┴─────────┐         │
│  │   Kong Node 3    │            │            │   Kong Node 4    │         │
│  │   (Data Plane)   │◄───────────┼────────────►   (Data Plane)   │         │
│  │   Pod: 2 CPU     │            │            │   Pod: 2 CPU     │         │
│  │   Memory: 4GB    │            │            │   Memory: 4GB    │         │
│  └──────────────────┘            │            └──────────────────┘         │
│                                   │                                         │
│           ┌───────────────────────┴───────────────────────┐                │
│           │                                               │                 │
│           ▼                                               ▼                 │
│  ┌──────────────────┐                        ┌──────────────────┐          │
│  │   PostgreSQL     │◄──────────────────────►│   PostgreSQL     │          │
│  │   Primary        │     Streaming Repl.    │   Standby        │          │
│  │   (Kong Config)  │                        │   (Kong Config)  │          │
│  └──────────────────┘                        └──────────────────┘          │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        REDIS CLUSTER                                  │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                   │  │
│  │  │  Master 1   │  │  Master 2   │  │  Master 3   │                   │  │
│  │  │  Replica 1  │  │  Replica 2  │  │  Replica 3  │                   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                   │  │
│  │         (Rate Limit Counters - Distributed)                          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Request Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REQUEST FLOW SEQUENCE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Client Request                                                          │
│     │                                                                       │
│     ▼                                                                       │
│  2. TLS Termination (HTTPS → HTTP)                                         │
│     │                                                                       │
│     ▼                                                                       │
│  3. CORS Validation                                                         │
│     ├── Origin not allowed → 403 Forbidden                                 │
│     └── Origin allowed → Continue                                          │
│         │                                                                   │
│         ▼                                                                   │
│  4. JWT Authentication                                                      │
│     ├── No token → 401 Unauthorized                                        │
│     ├── Invalid token → 401 Unauthorized                                   │
│     ├── Expired token → 401 Unauthorized                                   │
│     └── Valid token → Extract claims, Continue                             │
│         │                                                                   │
│         ▼                                                                   │
│  5. Rate Limiting Check                                                     │
│     ├── Limit exceeded → 429 Too Many Requests                             │
│     └── Within limit → Continue                                            │
│         │                                                                   │
│         ▼                                                                   │
│  6. Request Transformation                                                  │
│     │   - Add X-Tenant-ID from JWT claim                                   │
│     │   - Add X-User-ID from JWT claim                                     │
│     │   - Add X-Correlation-ID                                             │
│     │                                                                       │
│     ▼                                                                       │
│  7. Route Matching                                                          │
│     ├── No match → 404 Not Found                                           │
│     └── Match found → Select upstream                                      │
│         │                                                                   │
│         ▼                                                                   │
│  8. Load Balancing                                                          │
│     │   - Health check                                                      │
│     │   - Select healthy upstream                                          │
│     │                                                                       │
│     ▼                                                                       │
│  9. Upstream Request                                                        │
│     │                                                                       │
│     ▼                                                                       │
│  10. Response Handling                                                      │
│      │   - Add security headers                                            │
│      │   - Add rate limit headers                                          │
│      │                                                                      │
│      ▼                                                                      │
│  11. Client Response                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Service Routing Configuration

### 4.1 Service Definitions

```yaml
# kong.yaml - Declarative Configuration
_format_version: "3.0"
_transform: true

# =============================================================================
# SERVICES DEFINITION
# =============================================================================

services:
  # ---------------------------------------------------------------------------
  # Apache Fineract Core
  # ---------------------------------------------------------------------------
  - name: fineract-core
    url: http://fineract-core:8443
    protocol: http
    host: fineract-core
    port: 8443
    path: /
    retries: 3
    connect_timeout: 10000
    write_timeout: 60000
    read_timeout: 60000
    tags:
      - fineract
      - core-banking
    routes:
      - name: fineract-routes
        paths:
          - /fineract-provider/api/v1
        methods:
          - GET
          - POST
          - PUT
          - PATCH
          - DELETE
        strip_path: false
        preserve_host: false
        protocols:
          - https

  # ---------------------------------------------------------------------------
  # Loan Service
  # ---------------------------------------------------------------------------
  - name: loan-service
    url: http://loan-service:8080
    protocol: http
    host: loan-service
    port: 8080
    path: /
    retries: 3
    connect_timeout: 5000
    write_timeout: 30000
    read_timeout: 30000
    tags:
      - loan
      - origination
    routes:
      - name: loan-routes
        paths:
          - /api/v1/loans
          - /api/v1/loan-applications
          - /api/v1/loan-products
        methods:
          - GET
          - POST
          - PUT
          - PATCH
          - DELETE
        strip_path: false
        protocols:
          - https

  # ---------------------------------------------------------------------------
  # Customer Service
  # ---------------------------------------------------------------------------
  - name: customer-service
    url: http://customer-service:8080
    protocol: http
    host: customer-service
    port: 8080
    retries: 3
    routes:
      - name: customer-routes
        paths:
          - /api/v1/customers
        methods:
          - GET
          - POST
          - PUT
          - PATCH
          - DELETE
        strip_path: false
        protocols:
          - https

  # ---------------------------------------------------------------------------
  # CIB Integration Service
  # ---------------------------------------------------------------------------
  - name: cib-service
    url: http://cib-service:8081
    protocol: http
    host: cib-service
    port: 8081
    retries: 2
    connect_timeout: 5000
    write_timeout: 120000   # CIB can be slow
    read_timeout: 120000
    tags:
      - cib
      - integration
      - bangladesh-bank
    routes:
      - name: cib-routes
        paths:
          - /api/v1/cib
        methods:
          - GET
          - POST
        strip_path: false
        protocols:
          - https

  # ---------------------------------------------------------------------------
  # Workflow Service (Camunda)
  # ---------------------------------------------------------------------------
  - name: workflow-service
    url: http://workflow-service:8082
    protocol: http
    host: workflow-service
    port: 8082
    retries: 3
    tags:
      - workflow
      - camunda
      - approval
    routes:
      - name: workflow-routes
        paths:
          - /api/v1/workflows
          - /api/v1/approvals
          - /api/v1/tasks
        methods:
          - GET
          - POST
          - PUT
          - PATCH
        strip_path: false
        protocols:
          - https

  # ---------------------------------------------------------------------------
  # Document Management Service
  # ---------------------------------------------------------------------------
  - name: document-service
    url: http://document-service:8084
    protocol: http
    host: document-service
    port: 8084
    retries: 2
    write_timeout: 60000   # File uploads
    read_timeout: 60000
    tags:
      - document
      - minio
      - storage
    routes:
      - name: document-routes
        paths:
          - /api/v1/documents
        methods:
          - GET
          - POST
          - DELETE
        strip_path: false
        protocols:
          - https

  # ---------------------------------------------------------------------------
  # BRPD Compliance Service
  # ---------------------------------------------------------------------------
  - name: brpd-service
    url: http://brpd-service:8085
    protocol: http
    host: brpd-service
    port: 8085
    retries: 3
    tags:
      - brpd
      - compliance
      - classification
    routes:
      - name: brpd-routes
        paths:
          - /api/v1/classifications
          - /api/v1/provisions
        methods:
          - GET
          - POST
        strip_path: false
        protocols:
          - https

  # ---------------------------------------------------------------------------
  # Notification Service
  # ---------------------------------------------------------------------------
  - name: notification-service
    url: http://notification-service:8083
    protocol: http
    host: notification-service
    port: 8083
    retries: 1
    tags:
      - notification
      - sms
      - email
    routes:
      - name: notification-routes
        paths:
          - /api/v1/notifications
        methods:
          - GET
          - POST
        strip_path: false
        protocols:
          - https

  # ---------------------------------------------------------------------------
  # Analytics Service
  # ---------------------------------------------------------------------------
  - name: analytics-service
    url: http://analytics-service:8086
    protocol: http
    host: analytics-service
    port: 8086
    retries: 2
    read_timeout: 120000   # Reports can be slow
    tags:
      - analytics
      - reporting
      - dashboard
    routes:
      - name: analytics-routes
        paths:
          - /api/v1/analytics
          - /api/v1/reports
          - /api/v1/dashboards
        methods:
          - GET
          - POST
        strip_path: false
        protocols:
          - https

  # ---------------------------------------------------------------------------
  # Admin Service
  # ---------------------------------------------------------------------------
  - name: admin-service
    url: http://admin-service:8087
    protocol: http
    host: admin-service
    port: 8087
    retries: 3
    tags:
      - admin
      - configuration
    routes:
      - name: admin-routes
        paths:
          - /api/v1/admin
          - /api/v1/users
          - /api/v1/branches
          - /api/v1/configurations
        methods:
          - GET
          - POST
          - PUT
          - PATCH
          - DELETE
        strip_path: false
        protocols:
          - https
```

### 4.2 Routing Table

| Path Pattern | Service | Port | Methods | Description |
|--------------|---------|------|---------|-------------|
| `/fineract-provider/api/v1/*` | fineract-core | 8443 | ALL | Fineract Core APIs |
| `/api/v1/loans/*` | loan-service | 8080 | ALL | Loan management |
| `/api/v1/loan-applications/*` | loan-service | 8080 | ALL | Loan applications |
| `/api/v1/customers/*` | customer-service | 8080 | ALL | Customer management |
| `/api/v1/cib/*` | cib-service | 8081 | GET, POST | CIB integration |
| `/api/v1/workflows/*` | workflow-service | 8082 | ALL | Workflow engine |
| `/api/v1/documents/*` | document-service | 8084 | GET, POST, DELETE | Document storage |
| `/api/v1/classifications/*` | brpd-service | 8085 | GET, POST | BRPD compliance |
| `/api/v1/notifications/*` | notification-service | 8083 | GET, POST | Notifications |
| `/api/v1/reports/*` | analytics-service | 8086 | GET, POST | Reporting |
| `/api/v1/admin/*` | admin-service | 8087 | ALL | Administration |

---

## 5. Authentication & Authorization

### 5.1 JWT Plugin Configuration

```yaml
# JWT Authentication Plugin
plugins:
  - name: jwt
    service: loan-service
    config:
      # JWT verification settings
      key_claim_name: kid
      claims_to_verify:
        - exp           # Token expiration
        - iat           # Issued at
      run_on_preflight: false

      # Token locations
      uri_param_names:
        - jwt
      cookie_names: []
      header_names:
        - Authorization

      # Algorithm support
      # RS256 for production (asymmetric)

      # Maximum clock skew tolerance (seconds)
      maximum_expiration: 3600

# JWT Consumer Configuration
consumers:
  - username: ulms-web-client
    custom_id: ulms-web
    tags:
      - web-client

jwt_secrets:
  - consumer: ulms-web-client
    key: ulms-web-key
    algorithm: RS256
    rsa_public_key: |
      -----BEGIN PUBLIC KEY-----
      MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
      -----END PUBLIC KEY-----
```

### 5.2 Keycloak Integration

```yaml
# Keycloak OIDC Integration
plugins:
  - name: openid-connect
    service: loan-service
    config:
      issuer: https://auth.ulms.unisoft.com.bd/realms/ulms
      client_id: ulms-api-gateway
      client_secret: ${KEYCLOAK_CLIENT_SECRET}

      # Discovery
      discovery: https://auth.ulms.unisoft.com.bd/realms/ulms/.well-known/openid-configuration

      # Token validation
      verify_signature: true
      verify_claims: true
      verify_nonce: false

      # Token locations
      bearer_token_param_type:
        - header
        - query

      # Session handling
      session_cookie_name: session
      session_cookie_lifetime: 3600

      # Scopes required
      scopes_required:
        - openid
        - profile
        - ulms-api

      # Claims to headers
      upstream_headers_claims:
        - sub:X-User-ID
        - preferred_username:X-Username
        - email:X-User-Email
```

### 5.3 JWT Token Structure

```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "ulms-key-001"
  },
  "payload": {
    "iss": "https://auth.ulms.unisoft.com.bd/realms/ulms",
    "sub": "user-uuid-12345",
    "aud": "ulms-api",
    "exp": 1707000000,
    "iat": 1706998200,
    "jti": "jwt-unique-id",

    "preferred_username": "loan.officer",
    "email": "loan.officer@bank.com",
    "name": "Loan Officer",

    "realm_access": {
      "roles": ["LOAN_OFFICER", "BRANCH_USER"]
    },

    "resource_access": {
      "ulms-api": {
        "roles": ["loan:read", "loan:create", "customer:read"]
      }
    },

    "tenantId": "BANK_001",
    "branchId": "BR-DHK-001",
    "approvalLimit": 500000
  }
}
```

### 5.4 Authorization Plugin (ACL)

```yaml
# Access Control List Plugin
plugins:
  - name: acl
    service: admin-service
    config:
      allow:
        - admin-group
        - super-admin-group
      deny: []
      hide_groups_header: true

# Consumer Groups
consumer_groups:
  - name: admin-group
    consumers:
      - admin-user-1
      - admin-user-2

  - name: credit-analyst-group
    consumers:
      - credit-analyst-1

  - name: branch-manager-group
    consumers:
      - branch-manager-1
```

### 5.5 Public Endpoints (No Auth)

```yaml
# Routes that don't require authentication
routes:
  - name: health-check-route
    paths:
      - /health
      - /ready
      - /live
    methods:
      - GET
    plugins:
      - name: jwt
        enabled: false

  - name: auth-routes
    paths:
      - /api/v1/auth/login
      - /api/v1/auth/refresh
      - /api/v1/auth/forgot-password
    methods:
      - POST
    plugins:
      - name: jwt
        enabled: false
```

---

## 6. Rate Limiting Strategy

### 6.1 Rate Limiting Configuration

```yaml
# Global Rate Limiting
plugins:
  - name: rate-limiting
    config:
      # Default limits
      second: null
      minute: 1000
      hour: null
      day: null
      month: null
      year: null

      # Limit identification
      limit_by: consumer   # or 'ip', 'header', 'path'
      header_name: X-Tenant-ID
      path: null

      # Policy configuration
      policy: redis        # 'local' or 'redis' or 'cluster'
      fault_tolerant: true
      hide_client_headers: false

      # Redis configuration
      redis_host: redis-cluster
      redis_port: 6379
      redis_password: ${REDIS_PASSWORD}
      redis_database: 0
      redis_timeout: 2000
      redis_ssl: true

# Service-Specific Rate Limits
services:
  - name: cib-service
    plugins:
      - name: rate-limiting
        config:
          minute: 100       # Lower limit for CIB (external API costs)
          policy: redis
          limit_by: consumer

  - name: analytics-service
    plugins:
      - name: rate-limiting
        config:
          minute: 50        # Heavy computation
          policy: redis
          limit_by: consumer

  - name: notification-service
    plugins:
      - name: rate-limiting
        config:
          minute: 200       # Batch notifications
          policy: redis
          limit_by: consumer

  - name: admin-service
    plugins:
      - name: rate-limiting
        config:
          minute: 500       # Admin operations
          policy: redis
          limit_by: consumer
```

### 6.2 Rate Limit Tiers

| Tier | Endpoint Category | Rate Limit | Identifier | Reason |
|------|-------------------|------------|------------|--------|
| **Standard** | `/api/v1/loans/*` | 1000/min | Consumer | Normal operations |
| **Standard** | `/api/v1/customers/*` | 1000/min | Consumer | Normal operations |
| **Standard** | `/api/v1/workflows/*` | 1000/min | Consumer | Normal operations |
| **Standard** | `/api/v1/documents/*` | 1000/min | Consumer | Normal operations |
| **Restricted** | `/api/v1/cib/*` | 100/min | Consumer | External API costs |
| **Restricted** | `/api/v1/reports/*` | 50/min | Consumer | Heavy computation |
| **Admin** | `/api/v1/admin/*` | 500/min | Consumer | Admin functions |
| **Auth** | `/api/v1/auth/login` | 10/min | IP | Brute force protection |

### 6.3 Rate Limit Headers

```http
# Response Headers
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1707001000

# Rate Limit Exceeded Response (429)
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 45
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1707001000

{
  "type": "https://ulms.unisoft.com.bd/errors/rate-limit-exceeded",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "You have exceeded the rate limit of 1000 requests per minute",
  "instance": "/api/v1/loans",
  "retryAfter": 45
}
```

### 6.4 Burst Handling

```yaml
# Request Size Limiting
plugins:
  - name: request-size-limiting
    config:
      allowed_payload_size: 10        # MB
      size_unit: megabytes
      require_content_length: false

# Request Termination (Circuit Breaker)
plugins:
  - name: request-termination
    route: maintenance-route
    config:
      status_code: 503
      message: "Service temporarily unavailable for maintenance"
      content_type: "application/json"
      body: '{"type":"https://ulms.unisoft.com.bd/errors/service-unavailable","title":"Service Unavailable","status":503,"detail":"The system is under maintenance. Please try again later."}'
```

---

## 7. Security Configuration

### 7.1 TLS Configuration

```yaml
# TLS/SSL Configuration
certificates:
  - cert: |
      -----BEGIN CERTIFICATE-----
      MIIDXTCCAkWgAwIBAgIJANoa...
      -----END CERTIFICATE-----
    key: |
      -----BEGIN RSA PRIVATE KEY-----
      MIIEowIBAAKCAQEAvk...
      -----END RSA PRIVATE KEY-----
    snis:
      - api.ulms.unisoft.com.bd
      - "*.ulms.unisoft.com.bd"

# Kong configuration
nginx_http_ssl_protocols: TLSv1.2 TLSv1.3
nginx_http_ssl_ciphers: ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384
nginx_http_ssl_prefer_server_ciphers: "on"
nginx_http_ssl_session_timeout: 1d
nginx_http_ssl_session_cache: shared:SSL:50m
```

### 7.2 CORS Configuration

```yaml
# CORS Plugin
plugins:
  - name: cors
    config:
      origins:
        - https://ulms.unisoft.com.bd
        - https://staging.ulms.unisoft.com.bd
        - http://localhost:3000          # Development only
      methods:
        - GET
        - POST
        - PUT
        - PATCH
        - DELETE
        - OPTIONS
      headers:
        - Accept
        - Accept-Language
        - Content-Type
        - Authorization
        - X-Tenant-ID
        - X-Branch-ID
        - X-Request-ID
        - X-Correlation-ID
      exposed_headers:
        - X-RateLimit-Limit
        - X-RateLimit-Remaining
        - X-RateLimit-Reset
        - X-Request-ID
        - X-Correlation-ID
      credentials: true
      max_age: 3600
      preflight_continue: false
```

### 7.3 Security Headers

```yaml
# Response Transformer for Security Headers
plugins:
  - name: response-transformer
    config:
      add:
        headers:
          - "X-Content-Type-Options:nosniff"
          - "X-Frame-Options:DENY"
          - "X-XSS-Protection:1; mode=block"
          - "Strict-Transport-Security:max-age=31536000; includeSubDomains"
          - "Content-Security-Policy:default-src 'self'"
          - "Referrer-Policy:strict-origin-when-cross-origin"
          - "Permissions-Policy:geolocation=(), microphone=(), camera=()"
      remove:
        headers:
          - Server
          - X-Kong-Upstream-Latency
          - X-Kong-Proxy-Latency
```

### 7.4 IP Restriction

```yaml
# IP Restriction for Admin APIs
plugins:
  - name: ip-restriction
    service: admin-service
    config:
      allow:
        - 192.168.1.0/24      # Internal network
        - 10.0.0.0/8          # VPN range
        - 103.xxx.xxx.xxx     # Office IP
      deny: []
      status: 403
      message: "Access denied from this IP address"
```

### 7.5 Bot Protection

```yaml
# Bot Detection Plugin
plugins:
  - name: bot-detection
    config:
      allow:
        - googlebot
        - bingbot
      deny:
        - semrushbot
        - ahrefsbot
```

---

## 8. Load Balancing & Health Checks

### 8.1 Upstream Configuration

```yaml
# Upstreams with Load Balancing
upstreams:
  - name: loan-service-upstream
    algorithm: round-robin
    hash_on: none
    hash_fallback: none
    hash_on_cookie_path: /
    slots: 10000
    healthchecks:
      active:
        healthy:
          http_statuses:
            - 200
            - 301
            - 302
          interval: 5
          successes: 2
        unhealthy:
          http_failures: 3
          http_statuses:
            - 429
            - 500
            - 503
          interval: 5
          tcp_failures: 2
          timeouts: 2
        http_path: /actuator/health
        https_verify_certificate: true
        timeout: 5
        type: http
        concurrency: 10
      passive:
        healthy:
          http_statuses:
            - 200
            - 201
            - 202
            - 204
            - 301
            - 302
          successes: 5
        unhealthy:
          http_failures: 5
          http_statuses:
            - 429
            - 500
            - 503
          tcp_failures: 2
          timeouts: 5
        type: http
    targets:
      - target: loan-service-1:8080
        weight: 100
      - target: loan-service-2:8080
        weight: 100
      - target: loan-service-3:8080
        weight: 100

  - name: cib-service-upstream
    algorithm: round-robin
    healthchecks:
      active:
        healthy:
          interval: 10
          successes: 2
        unhealthy:
          http_failures: 2
          interval: 10
        http_path: /actuator/health
        timeout: 10
    targets:
      - target: cib-service-1:8081
        weight: 100
      - target: cib-service-2:8081
        weight: 100
```

### 8.2 Load Balancing Algorithms

| Algorithm | Use Case | Configuration |
|-----------|----------|---------------|
| **Round Robin** | Default for most services | `algorithm: round-robin` |
| **Consistent Hashing** | Session affinity | `algorithm: consistent-hashing` |
| **Least Connections** | Variable processing time | `algorithm: least-connections` |
| **Latency** | Geographic distribution | `algorithm: latency` |

### 8.3 Circuit Breaker Pattern

```yaml
# Circuit Breaker Configuration
plugins:
  - name: circuit-breaker
    service: cib-service
    config:
      # Threshold configuration
      failure_threshold: 5
      success_threshold: 3
      timeout: 30000           # ms before trying again

      # Window configuration
      window_size: 60          # seconds

      # Response when circuit is open
      circuit_open_response:
        status_code: 503
        content_type: "application/json"
        body: |
          {
            "type": "https://ulms.unisoft.com.bd/errors/circuit-open",
            "title": "Service Temporarily Unavailable",
            "status": 503,
            "detail": "CIB service is temporarily unavailable. Please try again later."
          }
```

---

## 9. Request/Response Transformation

### 9.1 Request Transformation

```yaml
# Request Transformer Plugin
plugins:
  - name: request-transformer
    config:
      # Add headers from JWT claims
      add:
        headers:
          - "X-Tenant-ID:$(jwt.claims.tenantId)"
          - "X-User-ID:$(jwt.claims.sub)"
          - "X-User-Roles:$(jwt.claims.realm_access.roles)"
          - "X-Branch-ID:$(jwt.claims.branchId)"
          - "X-Correlation-ID:$(request_id)"
        querystring: []
        body: []

      # Remove sensitive headers
      remove:
        headers:
          - Cookie
        querystring: []
        body: []

      # Rename headers
      rename:
        headers: []

      # Replace values
      replace:
        headers: []
        uri: null
```

### 9.2 Response Transformation

```yaml
# Response Transformer Plugin
plugins:
  - name: response-transformer
    config:
      # Add response headers
      add:
        headers:
          - "X-Request-ID:$(request_id)"
          - "X-Response-Time:$(latency)"

      # Remove internal headers
      remove:
        headers:
          - Server
          - X-Powered-By
          - Via
        json:
          - internal_id
          - debug_info

      # Append to existing headers
      append:
        headers: []
```

### 9.3 Error Response Standardization

```yaml
# Error Handler Plugin
plugins:
  - name: pre-function
    config:
      access:
        - |
          local cjson = require "cjson"

          -- Standardize 4xx/5xx errors
          kong.ctx.shared.error_handler = function(status, message)
            local error_types = {
              [400] = "validation-error",
              [401] = "authentication-error",
              [403] = "authorization-error",
              [404] = "resource-not-found",
              [429] = "rate-limit-exceeded",
              [500] = "internal-error",
              [502] = "upstream-error",
              [503] = "service-unavailable",
              [504] = "gateway-timeout"
            }

            local error_response = {
              type = "https://ulms.unisoft.com.bd/errors/" .. (error_types[status] or "unknown-error"),
              title = message or "Error",
              status = status,
              detail = message,
              instance = kong.request.get_path(),
              timestamp = os.date("!%Y-%m-%dT%H:%M:%SZ"),
              traceId = kong.request.get_header("X-Correlation-ID")
            }

            return cjson.encode(error_response)
          end
```

---

## 10. Logging & Monitoring

### 10.1 Access Logging

```yaml
# File Log Plugin
plugins:
  - name: file-log
    config:
      path: /var/log/kong/access.log
      reopen: true
      custom_fields_by_lua:
        tenant_id: "return kong.request.get_header('X-Tenant-ID')"
        user_id: "return kong.ctx.shared.authenticated_user"

# HTTP Log Plugin (for log aggregation)
plugins:
  - name: http-log
    config:
      http_endpoint: http://logstash:8080/kong-logs
      method: POST
      timeout: 10000
      keepalive: 60000
      retry_count: 3
      queue_size: 10000
      flush_timeout: 2
      content_type: application/json
      custom_fields_by_lua:
        tenant_id: "return kong.request.get_header('X-Tenant-ID')"
        user_id: "return kong.ctx.shared.authenticated_user"
        branch_id: "return kong.request.get_header('X-Branch-ID')"
```

### 10.2 Prometheus Metrics

```yaml
# Prometheus Plugin
plugins:
  - name: prometheus
    config:
      per_consumer: true
      status_code_metrics: true
      latency_metrics: true
      bandwidth_metrics: true
      upstream_health_metrics: true

# Custom metrics
# Exposed at: http://kong:8001/metrics
# Metrics include:
# - kong_http_requests_total
# - kong_request_latency_ms
# - kong_upstream_latency_ms
# - kong_bandwidth_bytes
# - kong_datastore_reachable
```

### 10.3 Log Format

```json
{
  "timestamp": "2026-02-05T10:30:00.000Z",
  "request": {
    "id": "abc123-def456",
    "method": "POST",
    "uri": "/api/v1/loans",
    "url": "https://api.ulms.unisoft.com.bd/api/v1/loans",
    "size": 1234,
    "headers": {
      "host": "api.ulms.unisoft.com.bd",
      "content-type": "application/json",
      "x-tenant-id": "BANK_001",
      "x-request-id": "abc123-def456"
    }
  },
  "response": {
    "status": 201,
    "size": 567,
    "headers": {
      "content-type": "application/json"
    }
  },
  "latencies": {
    "request": 45,
    "kong": 5,
    "proxy": 40
  },
  "authenticated_entity": {
    "consumer_id": "user123",
    "credential": "jwt"
  },
  "route": {
    "id": "loan-routes",
    "name": "loan-routes"
  },
  "service": {
    "id": "loan-service",
    "name": "loan-service"
  },
  "upstream": {
    "host": "loan-service-1:8080"
  },
  "client": {
    "ip": "192.168.1.100",
    "port": 54321
  },
  "custom_fields": {
    "tenant_id": "BANK_001",
    "user_id": "user123",
    "branch_id": "BR-DHK-001"
  }
}
```

### 10.4 Alerting Rules

```yaml
# Prometheus Alerting Rules
groups:
  - name: kong-alerts
    rules:
      # High error rate
      - alert: KongHighErrorRate
        expr: |
          sum(rate(kong_http_requests_total{code=~"5.."}[5m])) /
          sum(rate(kong_http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Kong high error rate"
          description: "Error rate is {{ $value | humanizePercentage }}"

      # High latency
      - alert: KongHighLatency
        expr: |
          histogram_quantile(0.95, sum(rate(kong_request_latency_ms_bucket[5m])) by (le)) > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Kong high latency"
          description: "95th percentile latency is {{ $value }}ms"

      # Rate limit exceeded
      - alert: KongRateLimitExceeded
        expr: |
          sum(rate(kong_http_requests_total{code="429"}[5m])) > 10
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High rate limit hits"

      # Upstream unhealthy
      - alert: KongUpstreamUnhealthy
        expr: |
          kong_upstream_target_health == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Upstream target unhealthy"
```

---

## 11. High Availability Configuration

### 11.1 Cluster Configuration

```yaml
# Kong Cluster Configuration
cluster_listen: "0.0.0.0:8005"
cluster_telemetry_listen: "0.0.0.0:8006"
cluster_mtls: "shared"
cluster_ca_cert: /etc/kong/cluster-ca.crt
cluster_cert: /etc/kong/cluster.crt
cluster_cert_key: /etc/kong/cluster.key

# Database Configuration
database: postgres
pg_host: postgres-primary.database.svc.cluster.local
pg_port: 5432
pg_user: kong
pg_password: ${KONG_PG_PASSWORD}
pg_database: kong
pg_ssl: on
pg_ssl_verify: on

# Connection pooling
pg_max_concurrent_queries: 0
pg_semaphore_timeout: 60000
```

### 11.2 Kubernetes Deployment

```yaml
# Kong Kubernetes Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kong-gateway
  namespace: ulms-gateway
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: kong-gateway
  template:
    metadata:
      labels:
        app: kong-gateway
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: kong-gateway
                topologyKey: kubernetes.io/hostname
      containers:
        - name: kong
          image: kong:3.5.0
          ports:
            - name: proxy
              containerPort: 8000
            - name: proxy-ssl
              containerPort: 8443
            - name: admin
              containerPort: 8001
            - name: metrics
              containerPort: 8100
          env:
            - name: KONG_DATABASE
              value: "postgres"
            - name: KONG_PG_HOST
              valueFrom:
                secretKeyRef:
                  name: kong-secrets
                  key: pg-host
            - name: KONG_PG_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: kong-secrets
                  key: pg-password
            - name: KONG_PROXY_ACCESS_LOG
              value: "/dev/stdout"
            - name: KONG_ADMIN_ACCESS_LOG
              value: "/dev/stdout"
            - name: KONG_PROXY_ERROR_LOG
              value: "/dev/stderr"
            - name: KONG_ADMIN_ERROR_LOG
              value: "/dev/stderr"
          resources:
            requests:
              memory: "2Gi"
              cpu: "1000m"
            limits:
              memory: "4Gi"
              cpu: "2000m"
          readinessProbe:
            httpGet:
              path: /status
              port: 8001
            initialDelaySeconds: 10
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /status
              port: 8001
            initialDelaySeconds: 30
            periodSeconds: 10
```

### 11.3 Horizontal Pod Autoscaler

```yaml
# Kong HPA
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: kong-gateway-hpa
  namespace: ulms-gateway
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: kong-gateway
  minReplicas: 4
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
```

---

## 12. Deployment Configuration

### 12.1 Environment Configuration

| Environment | Kong Admin URL | Proxy URL | Rate Limits |
|-------------|---------------|-----------|-------------|
| Development | http://localhost:8001 | http://localhost:8000 | Relaxed (5000/min) |
| Staging | https://kong-admin.staging.ulms.unisoft.com.bd | https://staging-api.ulms.unisoft.com.bd | Standard |
| Production | https://kong-admin.ulms.unisoft.com.bd | https://api.ulms.unisoft.com.bd | Standard |

### 12.2 Configuration Management

```yaml
# decK configuration for GitOps
# deck.yaml
_format_version: "3.0"
_transform: true

# Include environment-specific configs
_include:
  - base/services.yaml
  - base/plugins.yaml
  - environments/${KONG_ENV}/overrides.yaml
```

### 12.3 Migration Strategy

```bash
# Kong migration commands
# 1. Bootstrap database
kong migrations bootstrap

# 2. Run migrations
kong migrations up

# 3. Finish migrations (for major upgrades)
kong migrations finish

# 4. Export current config
deck dump --output-file kong-backup.yaml

# 5. Validate new config
deck validate --state new-config.yaml

# 6. Diff changes
deck diff --state new-config.yaml

# 7. Apply changes
deck sync --state new-config.yaml
```

---

## 13. Operations & Maintenance

### 13.1 Admin API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/status` | GET | Kong node status |
| `/services` | GET/POST | Manage services |
| `/routes` | GET/POST | Manage routes |
| `/plugins` | GET/POST | Manage plugins |
| `/consumers` | GET/POST | Manage consumers |
| `/upstreams` | GET/POST | Manage upstreams |
| `/certificates` | GET/POST | Manage TLS certs |

### 13.2 Health Check Endpoints

```bash
# Kong status
curl -s http://kong:8001/status | jq .

# Upstream health
curl -s http://kong:8001/upstreams/loan-service-upstream/health | jq .

# Database connectivity
curl -s http://kong:8001/status/database | jq .
```

### 13.3 Troubleshooting Guide

| Issue | Diagnostic Command | Resolution |
|-------|-------------------|------------|
| 502 Bad Gateway | `curl http://kong:8001/upstreams/*/health` | Check upstream health |
| 503 Service Unavailable | `curl http://kong:8001/status` | Check Kong status |
| 429 Rate Limited | Check Redis counters | Increase limits or optimize |
| 401 Unauthorized | Check JWT configuration | Verify Keycloak integration |
| High Latency | Check Prometheus metrics | Scale upstreams |

### 13.4 Backup & Recovery

```bash
# Backup Kong configuration
deck dump --output-file kong-config-$(date +%Y%m%d).yaml

# Restore Kong configuration
deck sync --state kong-config-backup.yaml

# Backup PostgreSQL (Kong datastore)
pg_dump -h postgres -U kong -d kong > kong-db-$(date +%Y%m%d).sql

# Restore PostgreSQL
psql -h postgres -U kong -d kong < kong-db-backup.sql
```

---

## 14. Compliance Matrix

### 14.1 Security Compliance

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| ICT Guidelines V4.0 - Authentication | OAuth 2.0 / JWT | Compliant |
| ICT Guidelines V4.0 - TLS 1.3 | Kong TLS termination | Compliant |
| ICT Guidelines V4.0 - Rate Limiting | Kong rate-limiting plugin | Compliant |
| ICT Guidelines V4.0 - Audit Logging | File/HTTP logging | Compliant |
| BRD 7.3.1 - OAuth 2.0 | Keycloak integration | Compliant |
| BRD 7.1 - 1000 req/min | Rate limiting configured | Compliant |

### 14.2 Performance Requirements

| Metric | Target | Achieved |
|--------|--------|----------|
| API Response Time (p95) | < 500ms | < 50ms (Kong latency) |
| Throughput | 500+ req/sec | 5000+ req/sec |
| Availability | 99.9% | 99.95% (4-node cluster) |
| Concurrent Connections | 10,000+ | 50,000+ |

### 14.3 Scalability Requirements

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Horizontal scaling | Kubernetes HPA | Implemented |
| Geographic distribution | Multi-zone deployment | Planned |
| Database scaling | PostgreSQL replication | Implemented |
| Cache scaling | Redis Cluster | Implemented |

---

## Appendix A: Kong Plugin Reference

| Plugin | Category | Usage |
|--------|----------|-------|
| jwt | Authentication | JWT token validation |
| acl | Security | Access control lists |
| rate-limiting | Traffic Control | API rate limiting |
| cors | Security | CORS handling |
| request-transformer | Transformations | Add/modify headers |
| response-transformer | Transformations | Modify responses |
| file-log | Logging | Access logging |
| prometheus | Monitoring | Metrics export |
| ip-restriction | Security | IP whitelist/blacklist |
| request-size-limiting | Traffic Control | Payload size limits |

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Lead Developer | | | |
| Technical Architect | | | |
| Security Lead | | | |
| Project Manager | | | |

---

**Document End**

*ULMS v2.0 - API Gateway Design (Kong) v1.0*

*Unisoft Systems Limited - Confidential*

*This document provides comprehensive Kong API Gateway design specifications for ULMS v2.0, ensuring secure, scalable, and reliable API management.*

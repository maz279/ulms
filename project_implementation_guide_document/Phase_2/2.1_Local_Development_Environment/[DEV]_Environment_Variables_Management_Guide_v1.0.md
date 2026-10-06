# Environment Variables Management Guide
## ULMS v2.0 Configuration Management

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Environment Variables Management Guide |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 8, 2026 |
| **Prepared By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Approved |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Environment Files](#2-environment-files)
3. [Variable Categories](#3-variable-categories)
4. [Security Guidelines](#4-security-guidelines)
5. [Per-Environment Configuration](#5-per-environment-configuration)
6. [Best Practices](#6-best-practices)

---

## 1. Overview

This document defines the environment variable management strategy for ULMS v2.0, ensuring secure and consistent configuration across development, staging, and production environments.

### 1.1 Configuration Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CONFIGURATION HIERARCHY                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Priority 1: Environment Variables (runtime)                                │
│   Priority 2: .env.{environment} files                                       │
│   Priority 3: .env.local (developer overrides)                               │
│   Priority 4: .env (default values)                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Environment Files

### 2.1 File Structure

| File | Purpose | Git Ignore |
|------|---------|------------|
| `.env` | Default values | No |
| `.env.local` | Local overrides | Yes |
| `.env.development` | Development environment | No |
| `.env.test` | Test environment | No |
| `.env.staging` | Staging environment | Yes |
| `.env.production` | Production environment | Yes |

### 2.2 File Locations

```
ulms/
├── .env                          # Root defaults
├── .env.example                  # Template for developers
├── backend/
│   ├── .env                      # Backend defaults
│   ├── .env.local                # Local overrides (gitignored)
│   └── src/main/resources/
│       └── application.yml       # Spring Boot config
├── frontend/
│   └── ulms-web/
│       ├── .env                  # Frontend defaults
│       └── .env.local            # Local overrides (gitignored)
└── docker/
    └── .env.docker               # Docker-specific
```

---

## 3. Variable Categories

### 3.1 Database Configuration

```bash
# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=ulms_dev
POSTGRES_USER=ulms_user
POSTGRES_PASSWORD=dev_password_secure
POSTGRES_POOL_SIZE=20

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=
```

### 3.2 Fineract Configuration

```bash
FINERACT_SERVER_URL=http://localhost:8443
FINERACT_DEFAULT_TENANT=default
FINERACT_USERNAME=mifos
FINERACT_PASSWORD=password
FINERACT_CONNECTION_TIMEOUT=30000
```

### 3.3 Security Configuration

```bash
# JWT Configuration
JWT_SECRET=change-this-in-production-min-32-characters
JWT_ACCESS_TOKEN_TTL=1800
JWT_REFRESH_TOKEN_TTL=604800
JWT_ALGORITHM=RS256

# Encryption
ENCRYPTION_KEY=change-this-in-production-32-chars
ENCRYPTION_ALGORITHM=AES-256-GCM

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
CORS_ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
```

### 3.4 External API Configuration

```bash
# CIB Online
CIB_API_URL=https://cib.bb.org.bd/api/v1
CIB_CLIENT_ID=your-client-id
CIB_CLIENT_SECRET=your-client-secret
CIB_CERTIFICATE_PATH=/path/to/cert.p12
CIB_TIMEOUT=30000

# NID/e-KYC
NID_API_URL=https://nidw.gov.bd/api/v1
NID_API_KEY=your-api-key
NID_TIMEOUT=10000

# CBS Integration
CBS_API_URL=http://cbs.bank.local/api
CBS_API_KEY=your-api-key
```

### 3.5 Feature Flags

```bash
# Development Features
ENABLE_DEBUG_LOGGING=true
ENABLE_SWAGGER_UI=true
ENABLE_SQL_LOGGING=true

# Mock Services (Development)
ENABLE_MOCK_CIB=true
ENABLE_MOCK_NID=true
ENABLE_MOCK_CBS=true

# Production Features
ENABLE_METRICS=true
ENABLE_DISTRIBUTED_TRACING=true
```

---

## 4. Security Guidelines

### 4.1 Secrets Management

**NEVER commit secrets to Git:**

```bash
# .gitignore
.env.local
.env.staging
.env.production
*.pem
*.key
secrets/
```

### 4.2 Secret Rotation

| Secret Type | Rotation Frequency | Owner |
|-------------|-------------------|-------|
| Database passwords | Quarterly | DBA |
| API keys | Semi-annually | Security Team |
| JWT signing keys | Annually | Security Team |
| TLS certificates | Per expiry | DevOps |

### 4.3 Using HashiCorp Vault (Production)

```java
// Spring Boot Vault Configuration
@Configuration
public class VaultConfig {
    
    @Value("${database.username}")
    private String dbUsername;
    
    @Value("${database.password}")
    private String dbPassword;
    
    @Value("${cib.client-secret}")
    private String cibClientSecret;
}
```

### 4.4 Local Development Secrets

```bash
# Use .env.local for local secrets
# NEVER commit this file

# Example .env.local
POSTGRES_PASSWORD=my-local-password
JWT_SECRET=local-dev-only-secret-not-for-production
```

---

## 5. Per-Environment Configuration

### 5.1 Development Environment

**File:** `.env.development`

```bash
# Development-specific settings
NODE_ENV=development
SPRING_PROFILES_ACTIVE=dev

# Debug settings
DEBUG=true
LOG_LEVEL=DEBUG
SQL_LOGGING=true

# Feature flags
ENABLE_MOCK_SERVICES=true
ENABLE_DEBUG_UI=true
```

### 5.2 Staging Environment

**File:** `.env.staging`

```bash
# Staging-specific settings
NODE_ENV=production
SPRING_PROFILES_ACTIVE=staging

# Database (Staging)
POSTGRES_HOST=staging-db.ulms.internal
POSTGRES_DB=ulms_staging

# Reduced logging
LOG_LEVEL=INFO
SQL_LOGGING=false

# Real APIs (not mocks)
ENABLE_MOCK_SERVICES=false
```

### 5.3 Production Environment

**File:** `.env.production`

```bash
# Production settings
NODE_ENV=production
SPRING_PROFILES_ACTIVE=prod

# Security
DEBUG=false
LOG_LEVEL=WARN

# Database (Production Cluster)
POSTGRES_HOST=prod-db-primary.ulms.internal
POSTGRES_POOL_SIZE=50

# Monitoring
ENABLE_METRICS=true
ENABLE_APM=true
```

---

## 6. Best Practices

### 6.1 Naming Conventions

```bash
# Use UPPER_SNAKE_CASE
DATABASE_URL=postgres://localhost:5432/ulms

# Use descriptive prefixes
CIB_API_URL=https://cib.example.com
CIB_CLIENT_ID=client123
CIB_CLIENT_SECRET=secret456

# Boolean values
FEATURE_ENABLED=true
FEATURE_DISABLED=false
```

### 6.2 Validation

```typescript
// env-validation.ts
import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url(),
  VITE_AUTH_URL: z.string().url(),
  VITE_ENABLE_MOCK_API: z.enum(['true', 'false']).default('false'),
});

export const env = envSchema.parse(import.meta.env);
```

### 6.3 Documentation Template

```bash
# .env.example (committed to Git)
# Copy this file to .env.local and fill in your values

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=ulms_dev
POSTGRES_USER=ulms_user
POSTGRES_PASSWORD= # Set your local password

# Security
JWT_SECRET= # Generate with: openssl rand -base64 32
ENCRYPTION_KEY= # Generate with: openssl rand -base64 32

# External APIs
CIB_CLIENT_ID= # Get from Bangladesh Bank
CIB_CLIENT_SECRET= # Get from Bangladesh Bank
```

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

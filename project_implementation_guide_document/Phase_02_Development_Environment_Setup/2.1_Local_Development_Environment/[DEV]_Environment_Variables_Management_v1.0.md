**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Environment Variables Management |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document ID** | 2.1.5 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | DevOps Engineer, ULMS Project |
| **Reviewed By** | Technical Lead |
| **Classification** | Confidential |
| **Status** | Approved |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | DevOps Engineer | Initial version |

---

# Environment Variables Management
## Configuration Management for ULMS Development, Testing, and Production

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Environment Strategy](#2-environment-strategy)
3. [Variable Categories](#3-variable-categories)
4. [Configuration Files](#4-configuration-files)
5. [Environment-Specific Settings](#5-environment-specific-settings)
6. [Secrets Management](#6-secrets-management)
7. [Best Practices](#7-best-practices)
8. [Troubleshooting](#8-troubleshooting)
9. [Related Documents](#9-related-documents)

---

## 1. Purpose

This document establishes the environment variable management strategy for ULMS v2.0, ensuring secure, consistent, and maintainable configuration across development, testing, staging, and production environments in compliance with Bangladesh Bank ICT Security Guidelines V4.0.

---

## 2. Environment Strategy

### 2.1 Environment Tiers

| Environment | Purpose | Access Level | Data Sensitivity |
|-------------|---------|--------------|------------------|
| Local/Dev | Developer workstations | Individual developers | Mock/Synthetic |
| CI/Test | Automated testing | CI/CD pipeline | Synthetic test data |
| Staging | Pre-production validation | QA, Business users | Anonymized production |
| Production | Live banking operations | Authorized personnel only | Real customer data |

### 2.2 Configuration Hierarchy

```
Configuration Priority (High to Low):
├── Runtime Environment Variables
├── .env.{environment}.local (gitignored)
├── .env.{environment}
├── .env.local (gitignored)
└── .env (default)
```

---

## 3. Variable Categories

### 3.1 Category Definitions

| Category | Prefix | Example | Storage |
|----------|--------|---------|---------|
| Database | `DB_` | `DB_HOST`, `DB_PASSWORD` | Secrets Manager |
| Cache | `REDIS_` | `REDIS_HOST`, `REDIS_PORT` | Plaintext/Secrets |
| Message Queue | `KAFKA_` | `KAFKA_BOOTSTRAP_SERVERS` | Plaintext |
| External APIs | `CIB_`, `NID_` | `CIB_API_KEY` | Secrets Manager |
| Application | `ULMS_` | `ULMS_LOG_LEVEL` | Plaintext |
| Frontend | `VITE_` | `VITE_API_URL` | Plaintext |
| Security | `JWT_`, `SSL_` | `JWT_SECRET` | Secrets Manager |

### 3.2 Mandatory Variables Matrix

| Variable | Local | Test | Staging | Production |
|----------|-------|------|---------|------------|
| DATABASE_URL | Required | Required | Required | Required |
| DATABASE_PASSWORD | Optional | Required | Required | Required |
| REDIS_URL | Required | Required | Required | Required |
| KAFKA_BOOTSTRAP_SERVERS | Required | Required | Required | Required |
| JWT_SECRET | Generated | Required | Required | Required |
| CIB_API_KEY | Mock | Mock | Required | Required |
| NID_API_KEY | Mock | Mock | Required | Required |
| SSL_KEYSTORE_PATH | Optional | Optional | Required | Required |

---

## 4. Configuration Files

### 4.1 Root .env.example

**File:** `.env.example` (committed to repository)

```bash
# ==========================================
# ULMS Environment Configuration Template
# Copy to .env and fill in actual values
# ==========================================

# ------------------------------------------
# Environment Settings
# ------------------------------------------
NODE_ENV=development
ULMS_ENVIRONMENT=development
ULMS_LOG_LEVEL=debug

# ------------------------------------------
# Database Configuration
# ------------------------------------------
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=fineract
POSTGRES_PASSWORD=postgres
POSTGRES_DB=fineract_default
DATABASE_URL=postgresql://fineract:postgres@localhost:5432/fineract_default

# ------------------------------------------
# Cache Configuration
# ------------------------------------------
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_SSL_ENABLED=false

# ------------------------------------------
# Message Queue Configuration
# ------------------------------------------
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_CONSUMER_GROUP_ID=ulms-dev-group
KAFKA_SECURITY_PROTOCOL=PLAINTEXT

# ------------------------------------------
# Java/Fineract Configuration
# ------------------------------------------
JAVA_HOME=/usr/lib/jvm/temurin-21-jdk-amd64
FINERACT_NODE_ID=1
FINERACT_DATABASE_HOST=localhost
FINERACT_DATABASE_PORT=5432
FINERACT_DATABASE_NAME=fineract_default
FINERACT_DATABASE_USERNAME=fineract
FINERACT_DATABASE_PASSWORD=postgres

# ------------------------------------------
# Frontend Configuration
# ------------------------------------------
VITE_API_BASE_URL=http://localhost:8080/fineract-provider/api/v1
VITE_API_TIMEOUT=30000
VITE_APP_NAME=ULMS
VITE_APP_VERSION=2.0.0
VITE_DEFAULT_LANGUAGE=en

# ------------------------------------------
# External API Configuration (Development)
# ------------------------------------------
# Use WireMock endpoints for local development
CIB_API_URL=http://localhost:8089/cib
CIB_API_KEY=dev_cib_key
CIB_API_SECRET=dev_cib_secret
CIB_CONNECTION_TIMEOUT=30000

NID_API_URL=http://localhost:8089/nid
NID_API_KEY=dev_nid_key
NID_API_SECRET=dev_nid_secret

# Payment Gateway (Sandbox)
BKASH_API_URL=https://sandbox.bkash.com
BKASH_APP_KEY=dev_bkash_key
BKASH_APP_SECRET=dev_bkash_secret

# ------------------------------------------
# Security Configuration
# ------------------------------------------
JWT_SECRET=your-jwt-secret-key-min-32-characters
JWT_EXPIRATION=86400
JWT_REFRESH_EXPIRATION=604800
ENCRYPTION_KEY=your-encryption-key-32chars

# SSL/TLS (Production Only)
SSL_KEYSTORE_PATH=
SSL_KEYSTORE_PASSWORD=
SSL_TRUSTSTORE_PATH=
SSL_TRUSTSTORE_PASSWORD=

# ------------------------------------------
# Feature Flags
# ------------------------------------------
FEATURE_CIB_INTEGRATION=true
FEATURE_NID_VERIFICATION=true
FEATURE_BKASH_PAYMENT=true
FEATURE_ADVANCED_REPORTS=true
FEATURE_AUDIT_LOGGING=true

# ------------------------------------------
# Monitoring & Observability
# ------------------------------------------
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090
GRAFANA_URL=http://localhost:3000
ELASTICSEARCH_URL=http://localhost:9200
```

### 4.2 Frontend Environment Template

**File:** `ulms-frontend/.env.example`

```bash
# ==========================================
# ULMS Frontend Environment Configuration
# ==========================================

# API Configuration
VITE_API_BASE_URL=http://localhost:8080/fineract-provider/api/v1
VITE_API_TIMEOUT=30000

# App Configuration
VITE_APP_NAME=ULMS
VITE_APP_VERSION=2.0.0
VITE_APP_ENVIRONMENT=development

# Feature Flags
VITE_FEATURE_CIB_INTEGRATION=true
VITE_FEATURE_NID_VERIFICATION=true
VITE_FEATURE_BKASH_PAYMENT=true
VITE_FEATURE_ADVANCED_REPORTS=true
VITE_FEATURE_AUDIT_LOGGING=true

# External Services (Sandbox URLs)
VITE_CIB_SANDBOX_URL=https://sandbox.cib.bb.org.bd
VITE_NID_SANDBOX_URL=https://sandbox.nidw.gov.bd

# Localization
VITE_DEFAULT_LANGUAGE=en
VITE_FALLBACK_LANGUAGE=en
VITE_SUPPORTED_LANGUAGES=en,bn

# Security
VITE_SESSION_TIMEOUT=3600
VITE_ENABLE_2FA=false
```

### 4.3 Backend Environment Template

**File:** `fineract/.env.example`

```bash
# ==========================================
# Fineract Backend Environment Configuration
# ==========================================

# Database Configuration
FINERACT_DATABASE_HOST=localhost
FINERACT_DATABASE_PORT=5432
FINERACT_DATABASE_NAME=fineract_default
FINERACT_DATABASE_USERNAME=fineract
FINERACT_DATABASE_PASSWORD=postgres

# Node Configuration
FINERACT_NODE_ID=1

# Memory Settings
FINERACT_MEMORY_OPTS=-Xmx2g -Xms1g -XX:+UseG1GC

# Cache Configuration
FINERACT_CACHE_TYPE=redis
FINERACT_CACHE_HOST=localhost
FINERACT_CACHE_PORT=6379

# Security
FINERACT_SECURITY_AUTH_BASIC_ENABLED=true
FINERACT_SECURITY_OAUTH_ENABLED=false

# Bangladesh-specific
FINERACT_CURRENCY_DEFAULT=BDT
FINERACT_LOCALE_DEFAULT=en_BD
```

---

## 5. Environment-Specific Settings

### 5.1 Development Environment

**File:** `.env.development` (committed, no secrets)

```bash
# Development Environment Configuration
# These values are safe to commit

ULMS_ENVIRONMENT=development
ULMS_LOG_LEVEL=debug

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=fineract
POSTGRES_DB=fineract_default

# External APIs - Use WireMock
CIB_API_URL=http://localhost:8089/cib
NID_API_URL=http://localhost:8089/nid

# Feature flags - Enable all for dev
FEATURE_CIB_INTEGRATION=true
FEATURE_NID_VERIFICATION=true
FEATURE_BKASH_PAYMENT=true
```

**File:** `.env.development.local` (gitignored, contains secrets)

```bash
# Local Development Secrets
# DO NOT COMMIT THIS FILE

POSTGRES_PASSWORD=your_local_password
JWT_SECRET=dev-jwt-secret-not-for-production
CIB_API_KEY=mock_cib_key
```

### 5.2 Production Environment

**File:** `.env.production` (committed, no secrets)

```bash
# Production Environment Configuration
# Secrets managed by HashiCorp Vault

ULMS_ENVIRONMENT=production
ULMS_LOG_LEVEL=warn

# Database - Connection via IAM auth or secrets
POSTGRES_HOST=${VAULT_POSTGRES_HOST}
POSTGRES_PORT=5432
POSTGRES_USER=${VAULT_POSTGRES_USER}
POSTGRES_DB=ulms_production

# External APIs - Production endpoints
CIB_API_URL=https://api.cib.bb.org.bd/v2
NID_API_URL=https://api.nidw.gov.bd/v2

# Feature flags - Production features only
FEATURE_CIB_INTEGRATION=true
FEATURE_NID_VERIFICATION=true
FEATURE_BKASH_PAYMENT=true
FEATURE_ADVANCED_REPORTS=true
FEATURE_AUDIT_LOGGING=true

# Security - Required in production
SSL_KEYSTORE_PATH=/etc/ssl/ulms/keystore.jks
SSL_TRUSTSTORE_PATH=/etc/ssl/ulms/truststore.jks
```

### 5.3 Docker Compose Environment

**File:** `docker-compose.env`

```bash
# Docker Compose shared environment
# Loaded by all services in docker-compose.yml

# Database
POSTGRES_USER=fineract
POSTGRES_DB=fineract_default
PGDATA=/var/lib/postgresql/data/pgdata

# PgAdmin
PGADMIN_DEFAULT_EMAIL=admin@ulms.local
PGADMIN_DEFAULT_PASSWORD=admin

# Timezone
TZ=Asia/Dhaka
```

---

## 6. Secrets Management

### 6.1 Secrets Classification

| Level | Description | Examples | Storage |
|-------|-------------|----------|---------|
| Critical | Financial/banking secrets | CIB API keys, SSL certs | HashiCorp Vault |
| High | Authentication secrets | JWT secrets, DB passwords | Vault/AWS Secrets |
| Medium | Service credentials | Redis passwords, API keys | Environment variables |
| Low | Configuration | URLs, timeouts, flags | Plaintext files |

### 6.2 HashiCorp Vault Integration

```bash
# Authenticate with Vault
vault login -method=userpass username=ulms-dev

# Read database credentials
vault read secret/ulms/database

# Read CIB API credentials
vault read secret/ulms/external-apis/cib

# Inject secrets into environment
eval $(vault kv get -format=json secret/ulms/database | jq -r '.data.data | to_entries | .[] | "export " + .key + "=" + (.value | @sh)')
```

### 6.3 Kubernetes Secrets

```yaml
# kubernetes/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: ulms-secrets
  namespace: production
type: Opaque
stringData:
  database-url: "postgresql://fineract:${DB_PASSWORD}@postgres:5432/fineract_production"
  jwt-secret: "${JWT_SECRET}"
  cib-api-key: "${CIB_API_KEY}"
---
apiVersion: v1
kind: Secret
metadata:
  name: ssl-certs
  namespace: production
type: kubernetes.io/tls
data:
  tls.crt: ${BASE64_ENCODED_CERT}
  tls.key: ${BASE64_ENCODED_KEY}
```

### 6.4 Secrets Rotation Policy

| Secret Type | Rotation Frequency | Procedure |
|-------------|-------------------|-----------|
| API Keys (CIB/NID) | Every 90 days | Automated via Vault |
| Database Passwords | Every 180 days | Coordinated rotation |
| JWT Secrets | Every 90 days | Zero-downtime rotation |
| SSL Certificates | Before expiry | 30 days prior notice |

---

## 7. Best Practices

### 7.1 Environment Variable Guidelines

```bash
# ✅ GOOD: Use descriptive names
DATABASE_CONNECTION_TIMEOUT=30000
CIB_API_RETRY_ATTEMPTS=3

# ❌ BAD: Vague or abbreviated names
DB_TO=30000
API_RETRY=3
```

```bash
# ✅ GOOD: Consistent naming convention
ULMS_LOG_LEVEL=debug
ULMS_FEATURE_FLAGS=enable_all

# ❌ BAD: Inconsistent prefixes
LOG_LEVEL=debug
app_features=enable_all
```

### 7.2 Security Best Practices

1. **Never commit secrets** to version control
   ```bash
   # Add to .gitignore
   .env
   .env.*.local
   *.pem
   *.key
   ```

2. **Use least privilege** for service accounts
   ```bash
   # Database user with minimal permissions
   CREATE USER ulms_app WITH PASSWORD '${PASSWORD}';
   GRANT CONNECT ON DATABASE fineract TO ulms_app;
   GRANT USAGE ON SCHEMA public TO ulms_app;
   GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO ulms_app;
   ```

3. **Validate environment on startup**
   ```typescript
   // src/config/validate-env.ts
   const requiredEnvVars = [
     'DATABASE_URL',
     'JWT_SECRET',
     'REDIS_URL',
   ];
   
   requiredEnvVars.forEach(varName => {
     if (!process.env[varName]) {
       throw new Error(`Missing required environment variable: ${varName}`);
     }
   });
   ```

### 7.3 Environment Validation Script

**File:** `scripts/validate-env.sh`

```bash
#!/bin/bash
# Environment variable validation script

set -e

echo "Validating environment configuration..."

# Check required variables
required_vars=(
    "DATABASE_URL"
    "REDIS_URL"
    "JWT_SECRET"
)

for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        echo "❌ ERROR: Required environment variable $var is not set"
        exit 1
    else
        echo "✅ $var is set"
    fi
done

# Validate database connection
echo "Testing database connection..."
if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ ERROR: Cannot connect to database"
    exit 1
fi

# Validate Redis connection
echo "Testing Redis connection..."
if redis-cli -u "$REDIS_URL" ping > /dev/null 2>&1; then
    echo "✅ Redis connection successful"
else
    echo "❌ ERROR: Cannot connect to Redis"
    exit 1
fi

echo "✅ Environment validation passed!"
```

---

## 8. Troubleshooting

### 8.1 Common Issues

#### Issue: Environment variables not loading

```bash
# Check if .env file exists
ls -la .env*

# Verify file format (no spaces around =)
grep -n ' = ' .env

# Reload environment
source .env
```

#### Issue: Secrets not resolving in Docker

```bash
# Check secret is defined
docker-compose config | grep SECRET

# Verify secret file exists
docker secret ls

# Inspect container environment
docker exec ulms-backend env | grep -i secret
```

#### Issue: Vault authentication fails

```bash
# Check Vault status
vault status

# Verify token
vault token lookup

# Renew token if needed
vault token renew
```

### 8.2 Debug Commands

```bash
# Print all environment variables (filtered)
env | grep -E '^(ULMS|FINERACT|DATABASE|REDIS)' | sort

# Check specific variable
echo $DATABASE_URL

# Test variable expansion
bash -c 'echo "Database: ${DATABASE_URL:-not set}"'
```

---

## 9. Related Documents

| Document ID | Document Name | Description |
|-------------|---------------|-------------|
| 2.1.1 | [Local Development Setup Guide]([DEV]_Local_Development_Setup_Guide_v1.0.md) | Quickstart guide |
| 2.1.2 | [Docker Compose Configuration]([DEV]_Docker_Compose_Configuration_v1.0.md) | Infrastructure setup |
| 2.6.1 | [Production Deployment Guide](../06_Deployment/[DEPLOY]_Production_Deployment_Guide_v1.0.md) | Production secrets |
| 2.8.1 | [Security Configuration Guide](../08_Compliance/[SEC]_Security_Configuration_Guide_v1.0.md) | Security standards |

---

## Appendix A: Environment Variable Reference

### Complete Variable List

| Variable | Type | Description | Default |
|----------|------|-------------|---------|
| `ULMS_ENVIRONMENT` | string | Deployment environment | `development` |
| `ULMS_LOG_LEVEL` | string | Logging level | `info` |
| `DATABASE_URL` | string | PostgreSQL connection string | - |
| `POSTGRES_HOST` | string | Database hostname | `localhost` |
| `POSTGRES_PORT` | number | Database port | `5432` |
| `POSTGRES_USER` | string | Database username | - |
| `POSTGRES_PASSWORD` | secret | Database password | - |
| `POSTGRES_DB` | string | Database name | - |
| `REDIS_URL` | string | Redis connection string | - |
| `REDIS_HOST` | string | Redis hostname | `localhost` |
| `REDIS_PORT` | number | Redis port | `6379` |
| `REDIS_PASSWORD` | secret | Redis password | - |
| `KAFKA_BOOTSTRAP_SERVERS` | string | Kafka broker list | `localhost:9092` |
| `JWT_SECRET` | secret | JWT signing key | - |
| `JWT_EXPIRATION` | number | JWT expiry in seconds | `86400` |
| `CIB_API_URL` | string | CIB API endpoint | - |
| `CIB_API_KEY` | secret | CIB API key | - |
| `CIB_API_SECRET` | secret | CIB API secret | - |
| `NID_API_URL` | string | NID API endpoint | - |
| `NID_API_KEY` | secret | NID API key | - |
| `SSL_KEYSTORE_PATH` | string | SSL keystore file path | - |
| `SSL_KEYSTORE_PASSWORD` | secret | SSL keystore password | - |

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
*Confidential - ULMS Development Team*

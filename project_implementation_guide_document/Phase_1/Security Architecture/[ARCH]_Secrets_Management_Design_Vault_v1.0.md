# Secrets Management Design Document
## Unisoft Loan Management System (ULMS) v2.0
### HashiCorp Vault Implementation

---

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ARCH-1.4.4 |
| **Document Title** | Secrets Management Design (HashiCorp Vault) |
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
| 1.0 | February 5, 2026 | Lead Developer | Initial Secrets Management Design Document |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Vault Architecture](#2-vault-architecture)
3. [Deployment Configuration](#3-deployment-configuration)
4. [Secret Engines](#4-secret-engines)
5. [Authentication Methods](#5-authentication-methods)
6. [Policies & Access Control](#6-policies--access-control)
7. [Secret Types & Paths](#7-secret-types--paths)
8. [Secret Lifecycle Management](#8-secret-lifecycle-management)
9. [Application Integration](#9-application-integration)
10. [High Availability & Disaster Recovery](#10-high-availability--disaster-recovery)
11. [Monitoring & Audit](#11-monitoring--audit)
12. [Operational Procedures](#12-operational-procedures)
13. [Appendices](#13-appendices)

---

## 1. Executive Summary

### 1.1 Purpose

This document defines the secrets management architecture for ULMS v2.0 using **HashiCorp Vault 1.15** as the centralized secrets management platform. It covers secure storage and management of sensitive credentials, encryption keys, certificates, and API keys required by the system.

### 1.2 Vault Selection Rationale

| Criteria | HashiCorp Vault | AWS Secrets Manager | Decision |
|----------|----------------|---------------------|----------|
| **On-Premise** | Full support | Cloud-only | Vault ✓ |
| **Multi-Cloud** | Yes | AWS-only | Vault ✓ |
| **Dynamic Secrets** | Native | Limited | Vault ✓ |
| **Transit Encryption** | Native engine | Not available | Vault ✓ |
| **PKI Management** | Full CA | Limited | Vault ✓ |
| **Kubernetes Integration** | Native | Via SDK | Vault ✓ |
| **Audit Logging** | Comprehensive | CloudTrail | Both ✓ |
| **Cost** | Free (OSS) | Per-secret pricing | Vault ✓ |

### 1.3 Secrets Categories

| Category | Examples | Storage Engine | Rotation |
|----------|----------|----------------|----------|
| **Static Secrets** | API keys, configuration | KV v2 | Manual/6 months |
| **Dynamic Secrets** | Database credentials | Database | Automatic/1 hour |
| **Encryption Keys** | AES-256 keys | Transit | Automatic/90 days |
| **Certificates** | TLS, mTLS certs | PKI | Automatic/1 year |
| **SSH Keys** | Server access | SSH | On-demand |

---

## 2. Vault Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     HASHICORP VAULT ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        VAULT CLUSTER (HA)                              │ │
│  │                                                                         │ │
│  │  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐               │ │
│  │  │   Vault 1    │   │   Vault 2    │   │   Vault 3    │               │ │
│  │  │   (Active)   │   │  (Standby)   │   │  (Standby)   │               │ │
│  │  │              │   │              │   │              │               │ │
│  │  │  API: 8200   │   │  API: 8200   │   │  API: 8200   │               │ │
│  │  │  Cluster:8201│   │  Cluster:8201│   │  Cluster:8201│               │ │
│  │  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘               │ │
│  │         │                  │                  │                        │ │
│  │         └──────────────────┼──────────────────┘                        │ │
│  │                            │                                            │ │
│  │                   Raft Consensus Protocol                               │ │
│  │                            │                                            │ │
│  │              ┌─────────────┴─────────────┐                             │ │
│  │              │    Integrated Storage     │                             │ │
│  │              │    (Raft Backend)         │                             │ │
│  │              │    + Auto-Unseal (AWS KMS)│                             │ │
│  │              └───────────────────────────┘                             │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│            ┌───────────────────────┼───────────────────────┐                │
│            │                       │                       │                │
│            ▼                       ▼                       ▼                │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│  │  SECRET ENGINES │    │   AUTH METHODS  │    │     POLICIES    │        │
│  │                 │    │                 │    │                 │        │
│  │ • KV v2         │    │ • Kubernetes    │    │ • ulms-service  │        │
│  │ • Transit       │    │ • AppRole       │    │ • ulms-admin    │        │
│  │ • Database      │    │ • Token         │    │ • ulms-backup   │        │
│  │ • PKI           │    │ • LDAP          │    │ • ulms-readonly │        │
│  │ • SSH           │    │                 │    │                 │        │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘        │
│                                    │                                         │
│            ┌───────────────────────┼───────────────────────┐                │
│            │                       │                       │                │
│            ▼                       ▼                       ▼                │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│  │  MICROSERVICES  │    │   KUBERNETES    │    │    OPERATORS    │        │
│  │                 │    │                 │    │                 │        │
│  │ • CIB Service   │    │ • Secrets Sync  │    │ • DBA Team      │        │
│  │ • NID Service   │    │ • CSI Driver    │    │ • DevOps Team   │        │
│  │ • Loan Service  │    │ • Injector      │    │ • Security Team │        │
│  │ • Workflow Svc  │    │                 │    │                 │        │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Overview

| Component | Version | Purpose |
|-----------|---------|---------|
| **Vault Server** | 1.15.4 | Secrets management server |
| **Raft Storage** | Integrated | HA storage backend |
| **AWS KMS** | - | Auto-unseal mechanism |
| **Vault Agent** | 1.15.4 | Sidecar for secret injection |
| **CSI Driver** | 1.4.0 | Kubernetes secrets sync |

---

## 3. Deployment Configuration

### 3.1 Kubernetes Deployment

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: vault
  labels:
    name: vault

---
apiVersion: helm.sh/v3
kind: HelmRelease
metadata:
  name: vault
  namespace: vault
spec:
  chart:
    spec:
      chart: vault
      version: 0.27.0
      sourceRef:
        kind: HelmRepository
        name: hashicorp
  values:
    global:
      enabled: true
      tlsDisable: false

    server:
      image:
        repository: hashicorp/vault
        tag: 1.15.4

      resources:
        requests:
          memory: 2Gi
          cpu: 1000m
        limits:
          memory: 4Gi
          cpu: 2000m

      # High Availability
      ha:
        enabled: true
        replicas: 3
        raft:
          enabled: true
          setNodeId: true
          config: |
            ui = true

            listener "tcp" {
              tls_disable = 0
              address = "[::]:8200"
              cluster_address = "[::]:8201"
              tls_cert_file = "/vault/tls/tls.crt"
              tls_key_file = "/vault/tls/tls.key"
              tls_client_ca_file = "/vault/tls/ca.crt"
            }

            storage "raft" {
              path = "/vault/data"
              retry_join {
                leader_api_addr = "https://vault-0.vault-internal:8200"
                leader_ca_cert_file = "/vault/tls/ca.crt"
              }
              retry_join {
                leader_api_addr = "https://vault-1.vault-internal:8200"
                leader_ca_cert_file = "/vault/tls/ca.crt"
              }
              retry_join {
                leader_api_addr = "https://vault-2.vault-internal:8200"
                leader_ca_cert_file = "/vault/tls/ca.crt"
              }
            }

            seal "awskms" {
              region     = "ap-south-1"
              kms_key_id = "alias/vault-unseal-key"
            }

            api_addr = "https://vault.ulms.internal:8200"
            cluster_addr = "https://$(POD_NAME).vault-internal:8201"

            telemetry {
              prometheus_retention_time = "30s"
              disable_hostname = true
            }

      # Auto-unseal with AWS KMS
      seal:
        type: awskms
        config:
          region: ap-south-1
          kms_key_id: alias/vault-unseal-key

      # Audit logging
      auditStorage:
        enabled: true
        size: 50Gi
        storageClass: gp3-encrypted

      # Data storage
      dataStorage:
        enabled: true
        size: 50Gi
        storageClass: gp3-encrypted

    # Injector for sidecar injection
    injector:
      enabled: true
      replicas: 2
      resources:
        requests:
          memory: 256Mi
          cpu: 250m

    # CSI Provider
    csi:
      enabled: true

    # UI
    ui:
      enabled: true
      serviceType: ClusterIP
```

### 3.2 Initial Setup Script

```bash
#!/bin/bash
# vault-init.sh - Initialize Vault cluster

set -e

VAULT_ADDR="https://vault.ulms.internal:8200"
export VAULT_SKIP_VERIFY=false
export VAULT_CACERT="/etc/vault/tls/ca.crt"

# Initialize Vault (first time only)
if ! vault status 2>/dev/null | grep -q "Initialized.*true"; then
    echo "Initializing Vault..."
    vault operator init \
        -key-shares=5 \
        -key-threshold=3 \
        -format=json > /secure/vault-init.json

    echo "Vault initialized. Secure the init file!"
fi

# Wait for leader election
sleep 10

# Enable audit logging
vault audit enable file file_path=/vault/audit/audit.log

# Enable secret engines
vault secrets enable -path=secret kv-v2
vault secrets enable -path=transit transit
vault secrets enable -path=database database
vault secrets enable -path=pki pki
vault secrets enable -path=ssh ssh

# Enable auth methods
vault auth enable kubernetes
vault auth enable approle
vault auth enable ldap

echo "Vault initialization complete!"
```

---

## 4. Secret Engines

### 4.1 KV Secrets Engine v2

**Configuration:**

```bash
# Enable KV v2 engine
vault secrets enable -path=secret -version=2 kv

# Configure max versions
vault write secret/config max_versions=10
```

**Secret Paths Structure:**

```
secret/
├── data/
│   ├── ulms/
│   │   ├── database/
│   │   │   ├── postgres-primary      # Primary DB credentials
│   │   │   ├── postgres-readonly     # Read replica credentials
│   │   │   └── redis                 # Redis credentials
│   │   ├── api/
│   │   │   ├── cib                   # CIB API credentials
│   │   │   ├── nid                   # NID API credentials
│   │   │   ├── bkash                 # bKash API keys
│   │   │   ├── nagad                 # Nagad API keys
│   │   │   └── sms-gateway           # SMS provider keys
│   │   ├── encryption/
│   │   │   └── keys                  # Encryption key metadata
│   │   └── service/
│   │       ├── keycloak              # Keycloak client secrets
│   │       └── kong                  # Kong admin credentials
│   └── {tenant-id}/                  # Per-tenant secrets
│       └── cbs-integration           # CBS-specific credentials
```

**Example: Store Database Credentials:**

```bash
# Store PostgreSQL credentials
vault kv put secret/ulms/database/postgres-primary \
    username="ulms_app" \
    password="$(openssl rand -base64 32)" \
    host="postgres-primary.ulms.internal" \
    port="5432" \
    database="ulms_production" \
    ssl_mode="verify-full"

# Store with metadata
vault kv metadata put secret/ulms/database/postgres-primary \
    custom_metadata="owner=dba-team" \
    custom_metadata="rotation_period=90d" \
    custom_metadata="environment=production"
```

### 4.2 Transit Secrets Engine

**Configuration:**

```bash
# Enable Transit engine
vault secrets enable transit

# Create encryption keys
vault write transit/keys/ulms-field-encryption \
    type=aes256-gcm96 \
    derived=false \
    exportable=false \
    allow_plaintext_backup=false \
    auto_rotate_period=2160h  # 90 days

vault write transit/keys/ulms-nid-encryption \
    type=aes256-gcm96 \
    derived=false \
    exportable=false \
    auto_rotate_period=2160h

vault write transit/keys/ulms-backup-encryption \
    type=aes256-gcm96 \
    derived=false \
    exportable=true  # Required for pgBackRest
    auto_rotate_period=8760h  # 1 year
```

**Usage:**

```bash
# Encrypt data
vault write transit/encrypt/ulms-field-encryption \
    plaintext=$(echo -n "1234567890123456" | base64)

# Response:
# ciphertext: vault:v1:XkYb7hJwKM/4sEE7N...

# Decrypt data
vault write transit/decrypt/ulms-field-encryption \
    ciphertext="vault:v1:XkYb7hJwKM/4sEE7N..."

# Response:
# plaintext: MTIzNDU2Nzg5MDEyMzQ1Ng==

# Rotate key
vault write -f transit/keys/ulms-field-encryption/rotate
```

### 4.3 Database Secrets Engine

**PostgreSQL Configuration:**

```bash
# Enable database engine
vault secrets enable database

# Configure PostgreSQL connection
vault write database/config/ulms-postgres \
    plugin_name=postgresql-database-plugin \
    allowed_roles="ulms-app,ulms-readonly,ulms-admin" \
    connection_url="postgresql://{{username}}:{{password}}@postgres-primary.ulms.internal:5432/ulms_production?sslmode=verify-full" \
    username="vault_admin" \
    password="$VAULT_DB_PASSWORD" \
    max_open_connections=5 \
    max_idle_connections=3 \
    max_connection_lifetime="5m"

# Create dynamic role for application
vault write database/roles/ulms-app \
    db_name=ulms-postgres \
    creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO \"{{name}}\"; \
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO \"{{name}}\";" \
    revocation_statements="REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM \"{{name}}\"; \
        REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM \"{{name}}\"; \
        DROP ROLE IF EXISTS \"{{name}}\";" \
    default_ttl="1h" \
    max_ttl="24h"

# Create readonly role
vault write database/roles/ulms-readonly \
    db_name=ulms-postgres \
    creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
        GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
    revocation_statements="REVOKE ALL ON ALL TABLES IN SCHEMA public FROM \"{{name}}\"; \
        DROP ROLE IF EXISTS \"{{name}}\";" \
    default_ttl="1h" \
    max_ttl="8h"
```

**Generate Dynamic Credentials:**

```bash
# Get credentials for application
vault read database/creds/ulms-app

# Response:
# Key                Value
# ---                -----
# lease_id           database/creds/ulms-app/abcd1234
# lease_duration     1h
# lease_renewable    true
# password           A1B2C3D4-dynamic-password
# username           v-approle-ulms-app-abcdefgh1234
```

### 4.4 PKI Secrets Engine

**Root CA Setup:**

```bash
# Enable PKI engine for root CA
vault secrets enable -path=pki pki

# Tune max lease for root CA
vault secrets tune -max-lease-ttl=87600h pki

# Generate root CA
vault write -field=certificate pki/root/generate/internal \
    common_name="ULMS Root CA" \
    issuer_name="ulms-root-2026" \
    ttl=87600h \
    > /etc/vault/certs/root_ca.crt

# Configure CA and CRL URLs
vault write pki/config/urls \
    issuing_certificates="https://vault.ulms.internal:8200/v1/pki/ca" \
    crl_distribution_points="https://vault.ulms.internal:8200/v1/pki/crl"
```

**Intermediate CA Setup:**

```bash
# Enable intermediate PKI
vault secrets enable -path=pki_int pki

# Generate intermediate CA CSR
vault write -format=json pki_int/intermediate/generate/internal \
    common_name="ULMS Intermediate CA" \
    issuer_name="ulms-intermediate-2026" \
    | jq -r '.data.csr' > /tmp/pki_intermediate.csr

# Sign with root CA
vault write -format=json pki/root/sign-intermediate \
    issuer_ref="ulms-root-2026" \
    csr=@/tmp/pki_intermediate.csr \
    format=pem_bundle \
    ttl="43800h" \
    | jq -r '.data.certificate' > /tmp/intermediate.cert.pem

# Set signed intermediate certificate
vault write pki_int/intermediate/set-signed \
    certificate=@/tmp/intermediate.cert.pem
```

**Certificate Role:**

```bash
# Create role for server certificates
vault write pki_int/roles/ulms-server \
    allowed_domains="ulms.internal,ulms.unisoft.com.bd" \
    allow_subdomains=true \
    allow_bare_domains=false \
    max_ttl="8760h" \
    ttl="720h" \
    key_type="rsa" \
    key_bits=2048 \
    ou="ULMS Services" \
    organization="Unisoft Systems Limited" \
    country="BD" \
    locality="Dhaka"

# Issue certificate
vault write pki_int/issue/ulms-server \
    common_name="api.ulms.unisoft.com.bd" \
    alt_names="api.ulms.internal,localhost" \
    ttl="720h"
```

---

## 5. Authentication Methods

### 5.1 Kubernetes Authentication

```bash
# Enable Kubernetes auth
vault auth enable kubernetes

# Configure Kubernetes auth
vault write auth/kubernetes/config \
    kubernetes_host="https://kubernetes.default.svc:443" \
    kubernetes_ca_cert=@/var/run/secrets/kubernetes.io/serviceaccount/ca.crt \
    token_reviewer_jwt=@/var/run/secrets/kubernetes.io/serviceaccount/token

# Create role for ULMS services
vault write auth/kubernetes/role/ulms-service \
    bound_service_account_names="ulms-service-account" \
    bound_service_account_namespaces="ulms-production,ulms-staging" \
    policies="ulms-service" \
    ttl="1h" \
    max_ttl="24h"

# Create role for CIB service
vault write auth/kubernetes/role/cib-service \
    bound_service_account_names="cib-service-account" \
    bound_service_account_namespaces="ulms-production" \
    policies="ulms-cib-service" \
    ttl="1h"
```

### 5.2 AppRole Authentication

```bash
# Enable AppRole auth
vault auth enable approle

# Create AppRole for automated processes
vault write auth/approle/role/ulms-backup \
    secret_id_ttl="720h" \
    token_ttl="1h" \
    token_max_ttl="24h" \
    policies="ulms-backup"

# Get Role ID
vault read auth/approle/role/ulms-backup/role-id

# Generate Secret ID
vault write -f auth/approle/role/ulms-backup/secret-id

# Login with AppRole
vault write auth/approle/login \
    role_id="$ROLE_ID" \
    secret_id="$SECRET_ID"
```

### 5.3 LDAP Authentication (Admin Access)

```bash
# Enable LDAP auth
vault auth enable ldap

# Configure LDAP
vault write auth/ldap/config \
    url="ldaps://ldap.unisoft.com.bd:636" \
    userdn="ou=Users,dc=unisoft,dc=com,dc=bd" \
    userattr="sAMAccountName" \
    groupdn="ou=Groups,dc=unisoft,dc=com,dc=bd" \
    groupfilter="(&(objectClass=group)(member:1.2.840.113556.1.4.1941:={{.UserDN}}))" \
    groupattr="cn" \
    binddn="cn=vault-ldap,ou=ServiceAccounts,dc=unisoft,dc=com,dc=bd" \
    bindpass="$LDAP_PASSWORD" \
    certificate=@/etc/vault/certs/ldap-ca.crt \
    insecure_tls=false \
    starttls=false

# Map LDAP groups to policies
vault write auth/ldap/groups/vault-admins policies="admin"
vault write auth/ldap/groups/dba-team policies="ulms-dba"
vault write auth/ldap/groups/devops-team policies="ulms-devops"
```

---

## 6. Policies & Access Control

### 6.1 ULMS Service Policy

```hcl
# ulms-service.hcl - Policy for ULMS microservices

# KV secrets - read only for service configuration
path "secret/data/ulms/database/*" {
  capabilities = ["read"]
}

path "secret/data/ulms/api/*" {
  capabilities = ["read"]
}

path "secret/data/ulms/service/*" {
  capabilities = ["read"]
}

# Transit engine - encrypt/decrypt operations
path "transit/encrypt/ulms-field-encryption" {
  capabilities = ["update"]
}

path "transit/decrypt/ulms-field-encryption" {
  capabilities = ["update"]
}

path "transit/encrypt/ulms-nid-encryption" {
  capabilities = ["update"]
}

path "transit/decrypt/ulms-nid-encryption" {
  capabilities = ["update"]
}

# Database dynamic credentials
path "database/creds/ulms-app" {
  capabilities = ["read"]
}

# PKI - issue certificates
path "pki_int/issue/ulms-server" {
  capabilities = ["create", "update"]
}

# Token renewal
path "auth/token/renew-self" {
  capabilities = ["update"]
}

path "auth/token/lookup-self" {
  capabilities = ["read"]
}
```

### 6.2 CIB Service Policy

```hcl
# ulms-cib-service.hcl - Policy for CIB Service

# CIB-specific secrets
path "secret/data/ulms/api/cib" {
  capabilities = ["read"]
}

# mTLS certificates for Bangladesh Bank
path "pki_int/issue/ulms-cib-client" {
  capabilities = ["create", "update"]
}

# NID encryption for CIB queries
path "transit/encrypt/ulms-nid-encryption" {
  capabilities = ["update"]
}

path "transit/decrypt/ulms-nid-encryption" {
  capabilities = ["update"]
}

# Database credentials
path "database/creds/ulms-readonly" {
  capabilities = ["read"]
}
```

### 6.3 Admin Policy

```hcl
# ulms-admin.hcl - Policy for administrators

# Full access to ULMS secrets
path "secret/data/ulms/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "secret/metadata/ulms/*" {
  capabilities = ["list", "read", "delete"]
}

# Transit key management (not export)
path "transit/keys/*" {
  capabilities = ["create", "read", "update", "list"]
  denied_parameters = {
    "exportable" = []
    "allow_plaintext_backup" = []
  }
}

path "transit/keys/*/rotate" {
  capabilities = ["update"]
}

# Database role management
path "database/roles/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "database/config/*" {
  capabilities = ["read", "list"]
}

# PKI management
path "pki_int/roles/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "pki_int/issue/*" {
  capabilities = ["create", "update"]
}

# Auth method management
path "auth/kubernetes/role/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "auth/approle/role/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Audit log access
path "sys/audit" {
  capabilities = ["read", "list"]
}

path "sys/audit/*" {
  capabilities = ["read"]
}
```

### 6.4 Backup Policy

```hcl
# ulms-backup.hcl - Policy for backup operations

# Backup encryption key (exportable)
path "transit/export/encryption-key/ulms-backup-encryption" {
  capabilities = ["read"]
}

# Database credentials for backup
path "database/creds/ulms-readonly" {
  capabilities = ["read"]
}

# S3 credentials for backup storage
path "secret/data/ulms/backup/s3" {
  capabilities = ["read"]
}
```

---

## 7. Secret Types & Paths

### 7.1 Complete Secrets Inventory

| Secret Path | Type | Rotation | Owner |
|-------------|------|----------|-------|
| `secret/ulms/database/postgres-primary` | KV v2 | Dynamic | DBA |
| `secret/ulms/database/postgres-readonly` | KV v2 | Dynamic | DBA |
| `secret/ulms/database/redis` | KV v2 | 90 days | DevOps |
| `secret/ulms/api/cib` | KV v2 | Annual | Security |
| `secret/ulms/api/nid` | KV v2 | Annual | Security |
| `secret/ulms/api/bkash` | KV v2 | 6 months | DevOps |
| `secret/ulms/api/nagad` | KV v2 | 6 months | DevOps |
| `secret/ulms/api/sms-gateway` | KV v2 | 6 months | DevOps |
| `secret/ulms/service/keycloak` | KV v2 | 6 months | Security |
| `transit/keys/ulms-field-encryption` | Transit | 90 days | Security |
| `transit/keys/ulms-nid-encryption` | Transit | 90 days | Security |
| `transit/keys/ulms-backup-encryption` | Transit | Annual | DBA |
| `database/creds/ulms-app` | Database | 1 hour | Auto |
| `database/creds/ulms-readonly` | Database | 1 hour | Auto |
| `pki_int/issue/ulms-server` | PKI | 30 days | Auto |

### 7.2 Secret Structure Examples

**Database Secret:**

```json
{
  "data": {
    "username": "ulms_app",
    "password": "secure-password-here",
    "host": "postgres-primary.ulms.internal",
    "port": "5432",
    "database": "ulms_production",
    "ssl_mode": "verify-full",
    "ssl_cert": "/path/to/client.crt",
    "ssl_key": "/path/to/client.key",
    "ssl_rootcert": "/path/to/ca.crt"
  },
  "metadata": {
    "created_time": "2026-02-05T10:00:00Z",
    "custom_metadata": {
      "owner": "dba-team",
      "rotation_period": "90d",
      "environment": "production"
    },
    "version": 3
  }
}
```

**API Key Secret:**

```json
{
  "data": {
    "api_key": "cib-api-key-here",
    "api_secret": "cib-api-secret-here",
    "endpoint": "https://cib.bb.org.bd/api/v2",
    "timeout_seconds": 120,
    "retry_count": 3,
    "certificate_path": "/etc/certs/cib-client.p12",
    "certificate_password": "cert-password"
  },
  "metadata": {
    "custom_metadata": {
      "owner": "integration-team",
      "vendor": "Bangladesh Bank",
      "contract_expiry": "2027-12-31"
    }
  }
}
```

---

## 8. Secret Lifecycle Management

### 8.1 Secret Rotation Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SECRET ROTATION WORKFLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│  │  Schedule   │     │   Generate  │     │   Validate  │                   │
│  │  Trigger    │────▶│ New Secret  │────▶│ New Secret  │                   │
│  │  (Cron/TTL) │     │             │     │             │                   │
│  └─────────────┘     └─────────────┘     └─────────────┘                   │
│                                                 │                            │
│                                                 ▼                            │
│                                          ┌─────────────┐                    │
│                                          │   Update    │                    │
│                                          │   Vault     │                    │
│                                          │   (New Ver) │                    │
│                                          └──────┬──────┘                    │
│                                                 │                            │
│                        ┌────────────────────────┼────────────────────┐      │
│                        │                        │                    │      │
│                        ▼                        ▼                    ▼      │
│                 ┌─────────────┐          ┌─────────────┐     ┌───────────┐ │
│                 │   Notify    │          │   Update    │     │   Audit   │ │
│                 │  Services   │          │   External  │     │   Log     │ │
│                 │ (Refresh)   │          │   Systems   │     │           │ │
│                 └─────────────┘          └─────────────┘     └───────────┘ │
│                        │                        │                            │
│                        ▼                        ▼                            │
│                 ┌─────────────┐          ┌─────────────┐                    │
│                 │   Grace     │          │   Verify    │                    │
│                 │   Period    │          │ Connectivity│                    │
│                 │  (Old Key)  │          │             │                    │
│                 └─────────────┘          └─────────────┘                    │
│                        │                        │                            │
│                        └────────────┬───────────┘                           │
│                                     ▼                                        │
│                              ┌─────────────┐                                │
│                              │   Revoke    │                                │
│                              │   Old Key   │                                │
│                              │  (Optional) │                                │
│                              └─────────────┘                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Automated Rotation Script

```bash
#!/bin/bash
# rotate-secrets.sh - Automated secret rotation

set -e

VAULT_ADDR="https://vault.ulms.internal:8200"
SLACK_WEBHOOK="$SLACK_WEBHOOK_URL"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

notify_slack() {
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"$1\"}" \
        "$SLACK_WEBHOOK"
}

rotate_kv_secret() {
    local path=$1
    local generator=$2

    log "Rotating secret: $path"

    # Generate new value
    new_value=$($generator)

    # Get current version
    current_version=$(vault kv metadata get -format=json "$path" | jq -r '.data.current_version')

    # Write new version
    vault kv put "$path" value="$new_value"

    log "Secret rotated: $path (v$current_version -> v$((current_version + 1)))"
    notify_slack "🔄 Secret rotated: $path"
}

rotate_transit_key() {
    local key_name=$1

    log "Rotating transit key: $key_name"

    # Rotate key
    vault write -f "transit/keys/$key_name/rotate"

    # Get new version
    new_version=$(vault read -format=json "transit/keys/$key_name" | jq -r '.data.latest_version')

    log "Transit key rotated: $key_name (v$new_version)"
    notify_slack "🔐 Transit key rotated: $key_name (v$new_version)"
}

# Main execution
log "Starting secret rotation..."

# Rotate API keys (example)
# rotate_kv_secret "secret/ulms/api/sms-gateway" "generate_sms_key"

# Rotate transit keys
rotate_transit_key "ulms-field-encryption"
rotate_transit_key "ulms-nid-encryption"

log "Secret rotation complete"
notify_slack "✅ ULMS secret rotation completed successfully"
```

### 8.3 Lease Management

```java
@Service
@Slf4j
public class VaultLeaseManager {

    private final VaultTemplate vaultTemplate;
    private final ConcurrentHashMap<String, LeaseInfo> activeLeases = new ConcurrentHashMap<>();

    @Scheduled(fixedRate = 60000) // Every minute
    public void renewLeases() {
        activeLeases.forEach((leaseId, leaseInfo) -> {
            if (shouldRenew(leaseInfo)) {
                try {
                    renewLease(leaseId);
                } catch (VaultException e) {
                    log.error("Failed to renew lease: {}", leaseId, e);
                    handleLeaseRenewalFailure(leaseId, leaseInfo);
                }
            }
        });
    }

    private boolean shouldRenew(LeaseInfo leaseInfo) {
        // Renew when 2/3 of TTL has passed
        long elapsed = System.currentTimeMillis() - leaseInfo.getStartTime();
        long threshold = (leaseInfo.getTtlMs() * 2) / 3;
        return elapsed >= threshold;
    }

    private void renewLease(String leaseId) {
        VaultSysOperations sysOps = vaultTemplate.opsForSys();
        Lease renewedLease = sysOps.renew(leaseId);

        LeaseInfo leaseInfo = activeLeases.get(leaseId);
        leaseInfo.setStartTime(System.currentTimeMillis());
        leaseInfo.setTtlMs(renewedLease.getLeaseDuration().toMillis());

        log.debug("Renewed lease: {} for {}ms", leaseId, leaseInfo.getTtlMs());
    }

    private void handleLeaseRenewalFailure(String leaseId, LeaseInfo leaseInfo) {
        // Request new credentials
        log.warn("Lease renewal failed, requesting new credentials for: {}",
                 leaseInfo.getPath());

        activeLeases.remove(leaseId);

        // Trigger credential refresh in dependent services
        eventPublisher.publishEvent(new CredentialRefreshEvent(leaseInfo.getPath()));
    }
}
```

---

## 9. Application Integration

### 9.1 Spring Boot Integration

**Dependencies:**

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-vault-config</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.vault</groupId>
        <artifactId>spring-vault-core</artifactId>
    </dependency>
</dependencies>
```

**Bootstrap Configuration:**

```yaml
# bootstrap.yml
spring:
  application:
    name: loan-service

  cloud:
    vault:
      enabled: true
      uri: https://vault.ulms.internal:8200
      connection-timeout: 5000
      read-timeout: 15000

      # Kubernetes authentication
      authentication: KUBERNETES
      kubernetes:
        role: ulms-service
        kubernetes-path: auth/kubernetes
        service-account-token-file: /var/run/secrets/kubernetes.io/serviceaccount/token

      # TLS configuration
      ssl:
        trust-store: file:/etc/vault/tls/truststore.jks
        trust-store-password: ${VAULT_TRUSTSTORE_PASSWORD}
        trust-store-type: JKS

      # KV secrets
      kv:
        enabled: true
        backend: secret
        profile-separator: /
        default-context: ulms
        application-name: loan-service

      # Database secrets
      database:
        enabled: true
        role: ulms-app
        backend: database

      # Lifecycle management
      config:
        lifecycle:
          enabled: true
          min-renewal: 10s
          expiry-threshold: 1m
          lease-endpoints: LEGACY
```

### 9.2 Vault Agent Sidecar

```yaml
# Kubernetes deployment with Vault Agent
apiVersion: apps/v1
kind: Deployment
metadata:
  name: loan-service
  namespace: ulms-production
spec:
  template:
    metadata:
      annotations:
        vault.hashicorp.com/agent-inject: "true"
        vault.hashicorp.com/role: "ulms-service"
        vault.hashicorp.com/agent-inject-secret-db: "database/creds/ulms-app"
        vault.hashicorp.com/agent-inject-template-db: |
          {{- with secret "database/creds/ulms-app" -}}
          spring.datasource.username={{ .Data.username }}
          spring.datasource.password={{ .Data.password }}
          {{- end }}
        vault.hashicorp.com/agent-inject-secret-api: "secret/data/ulms/api/cib"
        vault.hashicorp.com/agent-inject-template-api: |
          {{- with secret "secret/data/ulms/api/cib" -}}
          cib.api.key={{ .Data.data.api_key }}
          cib.api.secret={{ .Data.data.api_secret }}
          {{- end }}
    spec:
      serviceAccountName: ulms-service-account
      containers:
        - name: loan-service
          image: ulms/loan-service:1.0.0
          volumeMounts:
            - name: vault-secrets
              mountPath: /vault/secrets
              readOnly: true
          env:
            - name: SPRING_CONFIG_IMPORT
              value: "file:/vault/secrets/"
```

### 9.3 Direct API Integration

```java
@Service
@Slf4j
public class VaultSecretService {

    private final VaultTemplate vaultTemplate;

    /**
     * Read static secret from KV engine
     */
    public Map<String, Object> getSecret(String path) {
        VaultKeyValueOperations kvOps = vaultTemplate.opsForKeyValue(
            "secret", VaultKeyValueOperations.Version.V2);

        VaultResponseSupport<Map<String, Object>> response = kvOps.get(path);

        if (response == null || response.getData() == null) {
            throw new SecretNotFoundException("Secret not found: " + path);
        }

        return response.getData();
    }

    /**
     * Get database credentials (dynamic)
     */
    public DatabaseCredentials getDatabaseCredentials(String role) {
        VaultResponse response = vaultTemplate.read("database/creds/" + role);

        if (response == null || response.getData() == null) {
            throw new SecretNotFoundException("Database credentials not found for role: " + role);
        }

        Map<String, Object> data = response.getData();
        return DatabaseCredentials.builder()
            .username((String) data.get("username"))
            .password((String) data.get("password"))
            .leaseId(response.getLeaseId())
            .leaseDuration(response.getLeaseDuration())
            .build();
    }

    /**
     * Encrypt data using Transit engine
     */
    public String encrypt(String plaintext, String keyName) {
        VaultTransitOperations transitOps = vaultTemplate.opsForTransit();
        Ciphertext ciphertext = transitOps.encrypt(keyName, Plaintext.of(plaintext));
        return ciphertext.getCiphertext();
    }

    /**
     * Decrypt data using Transit engine
     */
    public String decrypt(String ciphertext, String keyName) {
        VaultTransitOperations transitOps = vaultTemplate.opsForTransit();
        Plaintext plaintext = transitOps.decrypt(keyName, Ciphertext.of(ciphertext));
        return plaintext.asString();
    }
}
```

---

## 10. High Availability & Disaster Recovery

### 10.1 HA Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    VAULT HA DEPLOYMENT                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Region: ap-south-1 (Primary)              Region: ap-southeast-1 (DR)      │
│  ┌─────────────────────────────┐          ┌─────────────────────────────┐  │
│  │  ┌─────┐ ┌─────┐ ┌─────┐   │          │  ┌─────┐ ┌─────┐ ┌─────┐   │  │
│  │  │ V1  │ │ V2  │ │ V3  │   │   Raft   │  │ V4  │ │ V5  │ │ V6  │   │  │
│  │  │(Act)│ │(Stb)│ │(Stb)│   │◀────────▶│  │(Stb)│ │(Stb)│ │(Stb)│   │  │
│  │  └──┬──┘ └──┬──┘ └──┬──┘   │  Repl    │  └──┬──┘ └──┬──┘ └──┬──┘   │  │
│  │     └───────┼───────┘      │          │     └───────┼───────┘      │  │
│  │             │              │          │             │              │  │
│  │  ┌──────────┴──────────┐   │          │  ┌──────────┴──────────┐   │  │
│  │  │  Raft Storage       │   │          │  │  Raft Storage       │   │  │
│  │  │  (Encrypted)        │   │          │  │  (Encrypted)        │   │  │
│  │  └─────────────────────┘   │          │  └─────────────────────┘   │  │
│  │             │              │          │             │              │  │
│  │  ┌──────────┴──────────┐   │          │  ┌──────────┴──────────┐   │  │
│  │  │  AWS KMS (Unseal)   │   │          │  │  AWS KMS (Unseal)   │   │  │
│  │  └─────────────────────┘   │          │  └─────────────────────┘   │  │
│  └─────────────────────────────┘          └─────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Backup & Recovery

```bash
#!/bin/bash
# vault-backup.sh - Vault backup procedure

BACKUP_DIR="/var/backup/vault"
S3_BUCKET="s3://ulms-vault-backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)

# Create Raft snapshot
vault operator raft snapshot save "$BACKUP_DIR/vault-snapshot-$DATE.snap"

# Encrypt backup
gpg --encrypt --recipient vault-backup@ulms.internal \
    "$BACKUP_DIR/vault-snapshot-$DATE.snap"

# Upload to S3
aws s3 cp "$BACKUP_DIR/vault-snapshot-$DATE.snap.gpg" \
    "$S3_BUCKET/snapshots/vault-snapshot-$DATE.snap.gpg"

# Cleanup local
rm -f "$BACKUP_DIR/vault-snapshot-$DATE.snap"
rm -f "$BACKUP_DIR/vault-snapshot-$DATE.snap.gpg"

# Verify backup
vault operator raft snapshot inspect \
    "$S3_BUCKET/snapshots/vault-snapshot-$DATE.snap.gpg"
```

### 10.3 Disaster Recovery Procedure

```bash
#!/bin/bash
# vault-restore.sh - Vault disaster recovery

SNAPSHOT_FILE=$1
NEW_CLUSTER_ADDR="https://vault-dr.ulms.internal:8200"

# 1. Unseal the DR cluster
vault operator unseal $UNSEAL_KEY_1
vault operator unseal $UNSEAL_KEY_2
vault operator unseal $UNSEAL_KEY_3

# 2. Download and decrypt snapshot
aws s3 cp "s3://ulms-vault-backups/snapshots/$SNAPSHOT_FILE" /tmp/
gpg --decrypt "/tmp/$SNAPSHOT_FILE" > /tmp/vault-snapshot.snap

# 3. Restore from snapshot
vault operator raft snapshot restore -force /tmp/vault-snapshot.snap

# 4. Verify restoration
vault status
vault secrets list

# 5. Update DNS to point to DR cluster
# (Manual step - update Route53/DNS)

echo "DR restoration complete. Update DNS to: $NEW_CLUSTER_ADDR"
```

---

## 11. Monitoring & Audit

### 11.1 Audit Logging Configuration

```bash
# Enable file audit device
vault audit enable file file_path=/vault/audit/vault-audit.log

# Enable syslog audit device (for SIEM)
vault audit enable syslog tag="vault" facility="AUTH"
```

### 11.2 Audit Log Format

```json
{
  "time": "2026-02-05T10:30:45.123456Z",
  "type": "request",
  "auth": {
    "client_token": "hmac-sha256:abc123...",
    "accessor": "accessor-xyz789",
    "display_name": "kubernetes-ulms-production-loan-service",
    "policies": ["default", "ulms-service"],
    "token_policies": ["default", "ulms-service"],
    "metadata": {
      "role": "ulms-service",
      "service_account_name": "ulms-service-account",
      "service_account_namespace": "ulms-production"
    },
    "entity_id": "entity-123",
    "token_type": "service",
    "token_ttl": 3600
  },
  "request": {
    "id": "req-abc123",
    "operation": "read",
    "mount_type": "kv",
    "path": "secret/data/ulms/database/postgres-primary",
    "remote_address": "10.0.1.50",
    "wrap_ttl": 0,
    "headers": {}
  },
  "response": {
    "mount_type": "kv",
    "mount_accessor": "kv_abc123"
  }
}
```

### 11.3 Prometheus Metrics

```yaml
# Vault Prometheus metrics
- job_name: 'vault'
  metrics_path: '/v1/sys/metrics'
  params:
    format: ['prometheus']
  scheme: https
  tls_config:
    ca_file: /etc/prometheus/vault-ca.crt
  bearer_token_file: /etc/prometheus/vault-token
  static_configs:
    - targets:
        - vault-0.vault-internal:8200
        - vault-1.vault-internal:8200
        - vault-2.vault-internal:8200

# Key metrics to monitor:
# vault_core_active - Active node indicator
# vault_core_unsealed - Seal status
# vault_expire_num_leases - Active lease count
# vault_runtime_alloc_bytes - Memory allocation
# vault_audit_log_request_count - Audit log requests
# vault_token_count - Active tokens
```

### 11.4 Alerting Rules

```yaml
groups:
  - name: vault-alerts
    rules:
      - alert: VaultSealed
        expr: vault_core_unsealed == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Vault is sealed"
          description: "Vault node {{ $labels.instance }} is sealed"

      - alert: VaultNoLeader
        expr: vault_core_active == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "No active Vault leader"

      - alert: VaultHighLeaseCount
        expr: vault_expire_num_leases > 10000
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High number of active leases"

      - alert: VaultAuditFailure
        expr: rate(vault_audit_log_request_failure[5m]) > 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Vault audit logging failures detected"
```

---

## 12. Operational Procedures

### 12.1 Emergency Seal Procedure

```bash
#!/bin/bash
# vault-emergency-seal.sh - Emergency seal procedure

echo "⚠️ EMERGENCY SEAL PROCEDURE"
echo "This will seal all Vault nodes!"
read -p "Type 'SEAL' to confirm: " confirm

if [ "$confirm" != "SEAL" ]; then
    echo "Aborted."
    exit 1
fi

# Seal all nodes
for node in vault-0 vault-1 vault-2; do
    echo "Sealing $node..."
    VAULT_ADDR="https://$node.vault-internal:8200" vault operator seal
done

# Notify team
curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"🚨 EMERGENCY: Vault has been sealed!"}' \
    "$SLACK_WEBHOOK_URL"

echo "Vault sealed. Contact security team for unseal procedure."
```

### 12.2 Key Rotation Procedure

```bash
#!/bin/bash
# rotate-transit-keys.sh - Transit key rotation

KEY_NAMES=("ulms-field-encryption" "ulms-nid-encryption")

for key in "${KEY_NAMES[@]}"; do
    echo "Rotating key: $key"

    # Get current version
    current=$(vault read -format=json "transit/keys/$key" | jq -r '.data.latest_version')

    # Rotate
    vault write -f "transit/keys/$key/rotate"

    # Verify
    new=$(vault read -format=json "transit/keys/$key" | jq -r '.data.latest_version')

    echo "Key $key rotated: v$current -> v$new"

    # Update minimum decryption version (optional, after grace period)
    # vault write "transit/keys/$key/config" min_decryption_version=$((current - 2))
done
```

### 12.3 Health Check Script

```bash
#!/bin/bash
# vault-health-check.sh

VAULT_ADDR="https://vault.ulms.internal:8200"

# Check seal status
if vault status | grep -q "Sealed.*false"; then
    echo "✅ Vault is unsealed"
else
    echo "❌ Vault is sealed"
    exit 1
fi

# Check HA status
leader=$(vault status -format=json | jq -r '.leader_address')
if [ -n "$leader" ]; then
    echo "✅ HA Leader: $leader"
else
    echo "❌ No HA leader elected"
    exit 1
fi

# Check audit logging
if vault audit list | grep -q "file/"; then
    echo "✅ Audit logging enabled"
else
    echo "⚠️ Audit logging not configured"
fi

# Check token count
token_count=$(vault read -format=json sys/metrics | jq '.data.Gauges[] | select(.Name=="vault.token.count") | .Value')
echo "ℹ️ Active tokens: $token_count"

echo "Health check complete"
```

---

## 13. Appendices

### 13.1 Vault CLI Quick Reference

```bash
# Authentication
vault login -method=ldap username=admin
vault login -method=kubernetes role=ulms-service

# KV Secrets
vault kv get secret/ulms/database/postgres
vault kv put secret/ulms/api/key api_key=abc123
vault kv delete secret/ulms/old-secret
vault kv metadata get secret/ulms/database/postgres

# Transit
vault write transit/encrypt/mykey plaintext=$(base64 <<< "secret")
vault write transit/decrypt/mykey ciphertext="vault:v1:..."
vault write -f transit/keys/mykey/rotate

# Database
vault read database/creds/ulms-app
vault lease renew database/creds/ulms-app/abc123
vault lease revoke database/creds/ulms-app/abc123

# PKI
vault write pki_int/issue/ulms-server common_name="api.ulms.internal"

# Policies
vault policy list
vault policy read ulms-service
vault policy write ulms-service ulms-service.hcl

# Audit
vault audit list
vault audit enable file file_path=/var/log/vault/audit.log
```

### 13.2 Related Documents

| Document ID | Document Name |
|-------------|---------------|
| ARCH-1.4.1 | Security Architecture Document |
| ARCH-1.4.2 | Authentication & Authorization Design |
| ARCH-1.4.3 | Data Encryption Strategy |
| ARCH-1.4.5 | mTLS Configuration for CIB |

---

**Document Version:** 1.0
**Classification:** Confidential - Internal Use
**Last Updated:** February 5, 2026
**Next Review:** August 2026

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

*This Secrets Management Design Document defines the HashiCorp Vault implementation for ULMS v2.0.*

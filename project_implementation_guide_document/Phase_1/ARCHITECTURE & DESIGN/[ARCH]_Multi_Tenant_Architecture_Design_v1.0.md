# Multi-Tenant Architecture Design
## Unisoft Loan Management System (ULMS) v2.0
### Schema-Per-Bank Isolation Strategy

---

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ARCH-1.1.3 |
| **Document Title** | Multi-Tenant Architecture Design |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 4, 2026 |
| **Prepared By** | Lead Developer, Solutions Architect |
| **Reviewed By** | Architecture Review Board, Security Team |
| **Classification** | Confidential - Internal Use |
| **Status** | Approved for Implementation |

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | February 4, 2026 | Lead Developer | Initial Multi-Tenant Architecture Design |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Multi-Tenancy Strategy](#2-multi-tenancy-strategy)
3. [Tenant Isolation Architecture](#3-tenant-isolation-architecture)
4. [Database Schema Design](#4-database-schema-design)
5. [Tenant Context Management](#5-tenant-context-management)
6. [Tenant Onboarding Process](#6-tenant-onboarding-process)
7. [Configuration Management](#7-configuration-management)
8. [Security Considerations](#8-security-considerations)
9. [Scaling Strategy](#9-scaling-strategy)
10. [Migration & Provisioning](#10-migration--provisioning)
11. [Performance Optimization](#11-performance-optimization)
12. [Appendices](#12-appendices)

---

## 1. Executive Summary

### 1.1 Purpose

This document defines the multi-tenant architecture design for ULMS v2.0, enabling the system to serve multiple banks (tenants) from a single deployment while ensuring complete data isolation, security, and independent configuration per bank.

### 1.2 Multi-Tenancy Approach

ULMS v2.0 adopts a **Schema-Per-Tenant** (also known as **Schema-Per-Bank**) isolation strategy:

| Aspect | Description |
|--------|-------------|
| **Isolation Level** | Database schema level |
| **Target Tenants** | 62+ scheduled commercial banks in Bangladesh |
| **Data Separation** | Complete isolation - each bank has its own schema |
| **Configuration** | Independent per-bank customization |
| **Compliance** | Meets Bangladesh Bank data isolation requirements |

### 1.3 Key Benefits

| Benefit | Description |
|---------|-------------|
| **Complete Data Isolation** | No risk of cross-tenant data leakage |
| **Independent Operations** | Backup, restore, migration per bank |
| **Regulatory Compliance** | Meets ICT Security Guidelines V4.0 |
| **Performance Isolation** | Queries don't affect other tenants |
| **Custom Schema Extensions** | Bank-specific columns if needed |
| **Easier Debugging** | Clear boundary for troubleshooting |

### 1.4 Trade-offs Acknowledged

| Trade-off | Mitigation |
|-----------|------------|
| Higher resource usage | Shared application tier reduces overhead |
| Schema management complexity | Automated Flyway migrations |
| Connection pool management | pgBouncer with per-tenant pooling |
| Cross-tenant reporting | Federated views for group-level reports |

---

## 2. Multi-Tenancy Strategy

### 2.1 Strategy Comparison

| Strategy | Data Isolation | Customization | Cost | Complexity | ULMS Choice |
|----------|---------------|---------------|------|------------|-------------|
| **Separate Database** | ★★★★★ | ★★★★★ | High | High | No |
| **Schema-Per-Tenant** | ★★★★★ | ★★★★ | Medium | Medium | ✅ Yes |
| **Shared Schema (Row-level)** | ★★★ | ★★ | Low | Low | No |
| **Shared Table (Tenant Column)** | ★★ | ★ | Lowest | Low | No |

### 2.2 Why Schema-Per-Tenant?

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    SCHEMA-PER-TENANT ARCHITECTURE                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │                          SHARED APPLICATION LAYER                             │ │
│   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │ │
│   │   │  ULMS Web   │  │  ULMS API   │  │ Microservices│ │  Fineract   │        │ │
│   │   │  Frontend   │  │   Gateway   │  │  Layer      │  │   Core      │        │ │
│   │   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │ │
│   │                                                                               │ │
│   │              ┌────────────────────────────────────────┐                      │ │
│   │              │      Tenant Context Resolver           │                      │ │
│   │              │   (JWT Claim → Schema Selection)       │                      │ │
│   │              └────────────────────────────────────────┘                      │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
│                                         │                                            │
│                                         ▼                                            │
│   ┌───────────────────────────────────────────────────────────────────────────────┐ │
│   │                         POSTGRESQL DATABASE                                    │ │
│   │                                                                                │ │
│   │   ┌─────────────────┐                                                         │ │
│   │   │   public        │  ← Shared infrastructure                                │ │
│   │   │   ├── tenants   │    (tenant registry, global config)                    │ │
│   │   │   ├── users     │                                                         │ │
│   │   │   └── config    │                                                         │ │
│   │   └─────────────────┘                                                         │ │
│   │                                                                                │ │
│   │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │ │
│   │   │   bank_001      │  │   bank_002      │  │   bank_003      │  ...         │ │
│   │   │   ├── m_loan    │  │   ├── m_loan    │  │   ├── m_loan    │              │ │
│   │   │   ├── m_client  │  │   ├── m_client  │  │   ├── m_client  │              │ │
│   │   │   ├── cib_inq   │  │   ├── cib_inq   │  │   ├── cib_inq   │              │ │
│   │   │   └── audit_log │  │   └── audit_log │  │   └── audit_log │              │ │
│   │   └─────────────────┘  └─────────────────┘  └─────────────────┘              │ │
│   │          │                      │                      │                      │ │
│   │   ┌──────┴──────────────────────┴──────────────────────┴─────────────────┐   │ │
│   │   │                      COMPLETE DATA ISOLATION                          │   │ │
│   │   │   • No shared tables between banks                                    │   │ │
│   │   │   • Independent backup/restore                                        │   │ │
│   │   │   • Schema-level security                                             │   │ │
│   │   └──────────────────────────────────────────────────────────────────────┘   │ │
│   │                                                                                │ │
│   └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Regulatory Compliance

| Regulation | Requirement | Schema-Per-Tenant Compliance |
|------------|------------|------------------------------|
| **ICT Security V4.0** | Data segregation | ✅ Complete schema isolation |
| **Bangladesh Bank** | Customer data protection | ✅ Bank-specific schemas |
| **Data Protection Act** | Data localization | ✅ Per-bank data management |
| **Audit Requirements** | Tenant-specific audit trail | ✅ Separate audit tables per schema |

---

## 3. Tenant Isolation Architecture

### 3.1 Isolation Levels

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         TENANT ISOLATION LAYERS                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ╔═══════════════════════════════════════════════════════════════════════════════╗  │
│  ║  LAYER 1: AUTHENTICATION ISOLATION                                             ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                                ║  │
│  ║  ┌─────────────────────────────────────────────────────────────────────────┐  ║  │
│  ║  │                         Keycloak Realms                                  │  ║  │
│  ║  │                                                                          │  ║  │
│  ║  │   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐              │  ║  │
│  ║  │   │ bank_001_realm│  │ bank_002_realm│  │ bank_003_realm│  ...         │  ║  │
│  ║  │   │  • Users      │  │  • Users      │  │  • Users      │              │  ║  │
│  ║  │   │  • Roles      │  │  • Roles      │  │  • Roles      │              │  ║  │
│  ║  │   │  • Clients    │  │  • Clients    │  │  • Clients    │              │  ║  │
│  ║  │   └───────────────┘  └───────────────┘  └───────────────┘              │  ║  │
│  ║  │                                                                          │  ║  │
│  ║  └─────────────────────────────────────────────────────────────────────────┘  ║  │
│  ║                                                                                ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════════╝  │
│                                         │                                            │
│                                         ▼                                            │
│  ╔═══════════════════════════════════════════════════════════════════════════════╗  │
│  ║  LAYER 2: APPLICATION ISOLATION                                                ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                                ║  │
│  ║  ┌─────────────────────────────────────────────────────────────────────────┐  ║  │
│  ║  │                    Tenant Context (Thread-Local)                        │  ║  │
│  ║  │                                                                          │  ║  │
│  ║  │   Request → JWT Extract → TenantId → ThreadLocal<TenantContext>         │  ║  │
│  ║  │                                                                          │  ║  │
│  ║  │   class TenantContext {                                                  │  ║  │
│  ║  │     String tenantId;      // "bank_001"                                 │  ║  │
│  ║  │     String schemaName;    // "bank_001"                                 │  ║  │
│  ║  │     String bankCode;      // "EXIM"                                     │  ║  │
│  ║  │     String branchId;      // "BR001"                                    │  ║  │
│  ║  │     UserPrincipal user;   // Current user                               │  ║  │
│  ║  │   }                                                                      │  ║  │
│  ║  │                                                                          │  ║  │
│  ║  └─────────────────────────────────────────────────────────────────────────┘  ║  │
│  ║                                                                                ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════════╝  │
│                                         │                                            │
│                                         ▼                                            │
│  ╔═══════════════════════════════════════════════════════════════════════════════╗  │
│  ║  LAYER 3: DATABASE ISOLATION                                                   ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                                ║  │
│  ║  ┌─────────────────────────────────────────────────────────────────────────┐  ║  │
│  ║  │                    Schema-Per-Tenant (PostgreSQL)                        │  ║  │
│  ║  │                                                                          │  ║  │
│  ║  │   Before Query:                                                          │  ║  │
│  ║  │   SET search_path TO bank_001, public;                                   │  ║  │
│  ║  │                                                                          │  ║  │
│  ║  │   Execution:                                                             │  ║  │
│  ║  │   SELECT * FROM m_loan WHERE id = 123;                                   │  ║  │
│  ║  │   -- Automatically uses bank_001.m_loan                                  │  ║  │
│  ║  │                                                                          │  ║  │
│  ║  └─────────────────────────────────────────────────────────────────────────┘  ║  │
│  ║                                                                                ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════════╝  │
│                                         │                                            │
│                                         ▼                                            │
│  ╔═══════════════════════════════════════════════════════════════════════════════╗  │
│  ║  LAYER 4: STORAGE ISOLATION                                                    ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                                ║  │
│  ║  ┌─────────────────────────────────────────────────────────────────────────┐  ║  │
│  ║  │                    MinIO Bucket-Per-Tenant                               │  ║  │
│  ║  │                                                                          │  ║  │
│  ║  │   Buckets:                                                               │  ║  │
│  ║  │   • ulms-bank-001-documents                                              │  ║  │
│  ║  │   • ulms-bank-002-documents                                              │  ║  │
│  ║  │   • ulms-bank-003-documents                                              │  ║  │
│  ║  │                                                                          │  ║  │
│  ║  │   Bucket Policy: Tenant-specific IAM policy                              │  ║  │
│  ║  │                                                                          │  ║  │
│  ║  └─────────────────────────────────────────────────────────────────────────┘  ║  │
│  ║                                                                                ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════════╝  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Isolation Mechanisms

#### 3.2.1 Database Connection Isolation

```java
@Component
public class TenantAwareDataSource extends AbstractRoutingDataSource {

    @Override
    protected Object determineCurrentLookupKey() {
        return TenantContext.getCurrentTenant();
    }
}

@Component
public class SchemaMultiTenantConnectionProvider implements MultiTenantConnectionProvider {

    @Override
    public Connection getConnection(String tenantIdentifier) throws SQLException {
        Connection connection = dataSource.getConnection();

        // Set schema for this tenant
        connection.createStatement()
            .execute("SET search_path TO " + tenantIdentifier + ", public");

        return connection;
    }

    @Override
    public void releaseConnection(String tenantIdentifier, Connection connection)
            throws SQLException {
        // Reset to public schema before returning to pool
        connection.createStatement()
            .execute("SET search_path TO public");

        connection.close();
    }
}
```

#### 3.2.2 Hibernate Multi-Tenancy Configuration

```java
@Configuration
@EnableJpaRepositories
public class HibernateMultiTenantConfig {

    @Bean
    public LocalContainerEntityManagerFactoryBean entityManagerFactory(
            DataSource dataSource,
            MultiTenantConnectionProvider connectionProvider,
            CurrentTenantIdentifierResolver tenantResolver) {

        Map<String, Object> properties = new HashMap<>();

        // Multi-tenancy configuration
        properties.put(Environment.MULTI_TENANT, MultiTenancyStrategy.SCHEMA);
        properties.put(Environment.MULTI_TENANT_CONNECTION_PROVIDER, connectionProvider);
        properties.put(Environment.MULTI_TENANT_IDENTIFIER_RESOLVER, tenantResolver);

        // Schema handling
        properties.put(Environment.HBM2DDL_AUTO, "validate");
        properties.put(Environment.SHOW_SQL, false);

        LocalContainerEntityManagerFactoryBean em =
            new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource);
        em.setPackagesToScan("com.ulms.domain");
        em.setJpaPropertyMap(properties);

        return em;
    }
}
```

#### 3.2.3 Current Tenant Identifier Resolver

```java
@Component
public class TenantIdentifierResolver implements CurrentTenantIdentifierResolver {

    private static final String DEFAULT_TENANT = "public";

    @Override
    public String resolveCurrentTenantIdentifier() {
        String tenant = TenantContext.getCurrentTenant();
        return (tenant != null) ? tenant : DEFAULT_TENANT;
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        return true;
    }
}
```

### 3.3 Cross-Tenant Access Prevention

```java
@Aspect
@Component
public class TenantSecurityAspect {

    @Before("@annotation(TenantSecured)")
    public void validateTenantAccess(JoinPoint joinPoint) {
        String currentTenant = TenantContext.getCurrentTenant();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth instanceof JwtAuthenticationToken) {
            JwtAuthenticationToken jwt = (JwtAuthenticationToken) auth;
            String tokenTenant = jwt.getToken().getClaimAsString("tenant_id");

            if (!currentTenant.equals(tokenTenant)) {
                throw new TenantAccessDeniedException(
                    "Cross-tenant access attempt detected: " +
                    "Token tenant=" + tokenTenant +
                    ", Request tenant=" + currentTenant
                );
            }
        }
    }
}

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface TenantSecured {
}
```

---

## 4. Database Schema Design

### 4.1 Schema Structure Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         POSTGRESQL SCHEMA STRUCTURE                                  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   ulms_database                                                                      │
│   │                                                                                  │
│   ├── public (Shared Infrastructure Schema)                                         │
│   │   ├── tenants                    -- Tenant registry                             │
│   │   ├── tenant_configuration       -- Global tenant settings                      │
│   │   ├── users                      -- Global user accounts                        │
│   │   ├── system_configuration       -- System-wide settings                        │
│   │   ├── audit_log_global           -- Cross-tenant audit (admin actions)          │
│   │   └── flyway_schema_history      -- Migration tracking                          │
│   │                                                                                  │
│   ├── bank_001 (Tenant: EXIM Bank)                                                  │
│   │   ├── m_client                   -- Customers                                   │
│   │   ├── m_loan                     -- Loan accounts                               │
│   │   ├── m_loan_repayment_schedule  -- EMI schedules                               │
│   │   ├── m_loan_transaction         -- Loan transactions                           │
│   │   ├── m_savings_account          -- Linked savings accounts                     │
│   │   ├── m_charge                   -- Charges/fees                                │
│   │   ├── m_collateral               -- Collateral records                          │
│   │   ├── cib_inquiry                -- CIB inquiry history                         │
│   │   ├── loan_classification_hist   -- Classification changes                      │
│   │   ├── customer_document          -- Document metadata                           │
│   │   ├── workflow_instance          -- Camunda process instances                   │
│   │   ├── audit_log                  -- Tenant-specific audit trail                 │
│   │   └── ...                                                                       │
│   │                                                                                  │
│   ├── bank_002 (Tenant: Dutch-Bangla Bank)                                          │
│   │   └── (Same structure as bank_001)                                              │
│   │                                                                                  │
│   ├── bank_003 (Tenant: BRAC Bank)                                                  │
│   │   └── (Same structure as bank_001)                                              │
│   │                                                                                  │
│   └── bank_00N (Additional tenants...)                                              │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Public Schema (Shared Infrastructure)

#### 4.2.1 Tenants Registry Table

```sql
-- public.tenants
CREATE TABLE public.tenants (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) UNIQUE NOT NULL,           -- "bank_001"
    schema_name VARCHAR(50) UNIQUE NOT NULL,          -- "bank_001"
    bank_name VARCHAR(100) NOT NULL,                  -- "EXIM Bank Limited"
    bank_code VARCHAR(10) UNIQUE NOT NULL,            -- "EXIM"
    swift_code VARCHAR(11),                           -- "EXIMBDDH"
    routing_number VARCHAR(20),                       -- "120260026"

    -- Contact Information
    head_office_address TEXT,
    website VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),

    -- Configuration
    status VARCHAR(20) DEFAULT 'ACTIVE',              -- ACTIVE, SUSPENDED, TERMINATED
    license_type VARCHAR(50) DEFAULT 'STANDARD',      -- STANDARD, PREMIUM, ENTERPRISE
    max_users INTEGER DEFAULT 1000,
    max_branches INTEGER DEFAULT 100,

    -- Keycloak Integration
    keycloak_realm VARCHAR(100),                      -- "bank_001_realm"

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP,
    suspended_at TIMESTAMP,

    -- Audit
    created_by VARCHAR(50),
    updated_by VARCHAR(50)
);

CREATE INDEX idx_tenants_status ON public.tenants(status);
CREATE INDEX idx_tenants_bank_code ON public.tenants(bank_code);
```

#### 4.2.2 Tenant Configuration Table

```sql
-- public.tenant_configuration
CREATE TABLE public.tenant_configuration (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES public.tenants(tenant_id),
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT,
    config_type VARCHAR(20) DEFAULT 'STRING',         -- STRING, INTEGER, BOOLEAN, JSON
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, config_key)
);

-- Example configurations
INSERT INTO public.tenant_configuration (tenant_id, config_key, config_value, config_type) VALUES
('bank_001', 'loan.max_amount_personal', '5000000', 'INTEGER'),
('bank_001', 'loan.max_tenor_months', '60', 'INTEGER'),
('bank_001', 'approval.level1_limit', '500000', 'INTEGER'),
('bank_001', 'approval.level2_limit', '1000000', 'INTEGER'),
('bank_001', 'cib.api_key', 'encrypted_value', 'STRING'),
('bank_001', 'notification.sms_enabled', 'true', 'BOOLEAN'),
('bank_001', 'branding.logo_url', '/assets/bank_001/logo.png', 'STRING'),
('bank_001', 'branding.primary_color', '#003366', 'STRING');
```

### 4.3 Per-Tenant Schema (Bank-Specific)

#### 4.3.1 Schema Creation Template

```sql
-- Schema creation for new tenant
CREATE SCHEMA IF NOT EXISTS bank_001;

-- Set search path for subsequent operations
SET search_path TO bank_001, public;

-- Grant permissions
GRANT USAGE ON SCHEMA bank_001 TO ulms_app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA bank_001 TO ulms_app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA bank_001 TO ulms_app_user;

-- Revoke public access
REVOKE ALL ON SCHEMA bank_001 FROM PUBLIC;
```

#### 4.3.2 Core Tables (Per-Tenant)

```sql
-- bank_001.m_client (Customer Master)
CREATE TABLE bank_001.m_client (
    id BIGSERIAL PRIMARY KEY,
    external_id VARCHAR(50) UNIQUE,
    account_no VARCHAR(20) UNIQUE,

    -- NID Information (Encrypted)
    nid_number VARCHAR(100) NOT NULL,                 -- Encrypted
    nid_verified BOOLEAN DEFAULT FALSE,
    nid_verified_at TIMESTAMP,

    -- Personal Information
    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100),
    fullname_bn VARCHAR(200),                         -- Bengali name
    display_name VARCHAR(200),

    father_name VARCHAR(100),
    mother_name VARCHAR(100),
    spouse_name VARCHAR(100),

    date_of_birth DATE NOT NULL,
    gender VARCHAR(10),
    marital_status VARCHAR(20),

    -- Contact Information
    mobile_primary VARCHAR(20) NOT NULL,
    mobile_secondary VARCHAR(20),
    email VARCHAR(100),

    -- Address
    present_address_line1 VARCHAR(200),
    present_address_line2 VARCHAR(200),
    present_district VARCHAR(50),
    present_upazila VARCHAR(50),
    present_postal_code VARCHAR(10),

    permanent_address_line1 VARCHAR(200),
    permanent_address_line2 VARCHAR(200),
    permanent_district VARCHAR(50),
    permanent_upazila VARCHAR(50),
    permanent_postal_code VARCHAR(10),

    -- Employment
    employer_name VARCHAR(200),
    designation VARCHAR(100),
    monthly_income DECIMAL(15,2),
    employment_type VARCHAR(50),

    -- Status
    status VARCHAR(20) DEFAULT 'ACTIVE',
    activation_date DATE,

    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50)
);

CREATE INDEX idx_client_nid ON bank_001.m_client(nid_number);
CREATE INDEX idx_client_mobile ON bank_001.m_client(mobile_primary);
CREATE INDEX idx_client_status ON bank_001.m_client(status);
```

```sql
-- bank_001.m_loan (Loan Accounts)
CREATE TABLE bank_001.m_loan (
    id BIGSERIAL PRIMARY KEY,
    account_no VARCHAR(20) UNIQUE NOT NULL,
    external_id VARCHAR(50),

    -- Client Reference
    client_id BIGINT NOT NULL REFERENCES bank_001.m_client(id),

    -- Product & Branch
    product_id BIGINT NOT NULL,
    product_code VARCHAR(20),
    branch_id VARCHAR(20) NOT NULL,
    branch_name VARCHAR(100),

    -- Loan Details
    principal_amount DECIMAL(15,2) NOT NULL,
    approved_principal DECIMAL(15,2),
    principal_disbursed DECIMAL(15,2),
    principal_outstanding DECIMAL(15,2),

    interest_rate DECIMAL(5,4) NOT NULL,              -- Annual rate (e.g., 0.1200 = 12%)
    interest_type VARCHAR(20) DEFAULT 'FIXED',        -- FIXED, FLOATING

    number_of_repayments INTEGER NOT NULL,
    repayment_every INTEGER DEFAULT 1,
    repayment_frequency VARCHAR(20) DEFAULT 'MONTHS', -- DAYS, WEEKS, MONTHS

    -- Dates
    submitted_on_date DATE,
    approved_on_date DATE,
    expected_disbursement_date DATE,
    actual_disbursement_date DATE,
    expected_maturity_date DATE,
    closed_on_date DATE,

    -- Status & Classification
    loan_status VARCHAR(30) DEFAULT 'PENDING_APPROVAL',
    classification VARCHAR(20) DEFAULT 'STD_0',       -- BRPD classification
    dpd INTEGER DEFAULT 0,                            -- Days Past Due
    last_classification_date DATE,

    -- Workflow
    workflow_process_id VARCHAR(100),
    current_approval_level INTEGER,

    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    version INTEGER DEFAULT 0
);

CREATE INDEX idx_loan_client ON bank_001.m_loan(client_id);
CREATE INDEX idx_loan_status ON bank_001.m_loan(loan_status);
CREATE INDEX idx_loan_classification ON bank_001.m_loan(classification);
CREATE INDEX idx_loan_branch ON bank_001.m_loan(branch_id);
CREATE INDEX idx_loan_dpd ON bank_001.m_loan(dpd);
```

```sql
-- bank_001.cib_inquiry (CIB History)
CREATE TABLE bank_001.cib_inquiry (
    id BIGSERIAL PRIMARY KEY,
    inquiry_id VARCHAR(50) UNIQUE NOT NULL,

    -- Request Details
    client_id BIGINT REFERENCES bank_001.m_client(id),
    loan_application_id BIGINT,
    nid_number VARCHAR(100) NOT NULL,                 -- Encrypted
    inquiry_type VARCHAR(20) NOT NULL,                -- INDIVIDUAL, CORPORATE
    purpose VARCHAR(50),

    -- Response Details
    cib_score INTEGER,
    risk_grade VARCHAR(10),
    total_facilities INTEGER,
    total_outstanding DECIMAL(15,2),
    total_monthly_emi DECIMAL(15,2),
    worst_classification VARCHAR(10),
    max_dpd INTEGER,

    -- Raw Response
    request_json JSONB,
    response_json JSONB,

    -- Status
    status VARCHAR(20) DEFAULT 'PENDING',             -- PENDING, SUCCESS, FAILED
    error_message TEXT,

    -- Timestamps
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,
    cached_until TIMESTAMP,

    -- Audit
    requested_by VARCHAR(50)
);

CREATE INDEX idx_cib_client ON bank_001.cib_inquiry(client_id);
CREATE INDEX idx_cib_nid ON bank_001.cib_inquiry(nid_number);
CREATE INDEX idx_cib_status ON bank_001.cib_inquiry(status);
CREATE INDEX idx_cib_requested ON bank_001.cib_inquiry(requested_at);
```

```sql
-- bank_001.loan_classification_history
CREATE TABLE bank_001.loan_classification_history (
    id BIGSERIAL PRIMARY KEY,
    loan_id BIGINT NOT NULL REFERENCES bank_001.m_loan(id),

    -- Classification Change
    previous_classification VARCHAR(20),
    new_classification VARCHAR(20) NOT NULL,
    classification_date DATE NOT NULL,
    dpd INTEGER NOT NULL,

    -- Provision
    previous_provision_rate DECIMAL(5,4),
    new_provision_rate DECIMAL(5,4),
    provision_amount DECIMAL(15,2),

    -- Interest Suspense
    interest_suspended DECIMAL(15,2),

    -- GL Posting Reference
    gl_journal_entry_id BIGINT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_class_hist_loan ON bank_001.loan_classification_history(loan_id);
CREATE INDEX idx_class_hist_date ON bank_001.loan_classification_history(classification_date);
```

```sql
-- bank_001.audit_log (Tenant-Specific Audit)
CREATE TABLE bank_001.audit_log (
    id BIGSERIAL PRIMARY KEY,
    event_id VARCHAR(50) UNIQUE NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Actor
    user_id VARCHAR(50),
    username VARCHAR(100),
    ip_address VARCHAR(45),
    session_id VARCHAR(100),
    branch_id VARCHAR(20),

    -- Resource
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),

    -- Action
    action_type VARCHAR(50),
    action_status VARCHAR(20),

    -- Data
    old_value JSONB,
    new_value JSONB,
    changes JSONB,

    -- Context
    request_uri VARCHAR(500),
    request_method VARCHAR(10),
    correlation_id VARCHAR(100)
);

-- Partitioning by date for performance
CREATE INDEX idx_audit_timestamp ON bank_001.audit_log(event_timestamp);
CREATE INDEX idx_audit_user ON bank_001.audit_log(user_id);
CREATE INDEX idx_audit_resource ON bank_001.audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_type ON bank_001.audit_log(event_type);
```

### 4.4 Table Volume Estimates

| Table | Estimated Rows (Per Bank) | Growth Rate | Partitioning |
|-------|--------------------------|-------------|--------------|
| m_client | 500K - 5M | 10K/month | No |
| m_loan | 100K - 1M | 5K/month | By date |
| m_loan_repayment_schedule | 1M - 10M | 50K/month | By loan_id |
| m_loan_transaction | 5M - 50M | 100K/month | By date |
| cib_inquiry | 200K - 2M | 20K/month | By date |
| loan_classification_history | 500K - 5M | 30K/month | By date |
| audit_log | 10M - 100M | 500K/month | By date |

---

## 5. Tenant Context Management

### 5.1 Tenant Context Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         TENANT CONTEXT RESOLUTION FLOW                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────┐                                                                    │
│  │   Client    │                                                                    │
│  │  (Browser)  │                                                                    │
│  └──────┬──────┘                                                                    │
│         │ 1. Request with JWT                                                       │
│         ▼                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         API Gateway (Kong)                                   │   │
│  │                                                                              │   │
│  │   2. JWT Validation → Extract tenant_id claim                               │   │
│  │   3. Add X-Tenant-ID header to upstream request                             │   │
│  │                                                                              │   │
│  └──────────────────────────────────┬──────────────────────────────────────────┘   │
│                                      │                                              │
│                                      ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                    Spring Boot Application                                   │   │
│  │                                                                              │   │
│  │   ┌─────────────────────────────────────────────────────────────────────┐   │   │
│  │   │                  TenantInterceptor (OncePerRequestFilter)           │   │   │
│  │   │                                                                      │   │   │
│  │   │   4. Extract tenant from:                                           │   │   │
│  │   │      - JWT claim (tenant_id)                                        │   │   │
│  │   │      - Header (X-Tenant-ID)                                         │   │   │
│  │   │      - Subdomain (bank001.ulms.com)                                 │   │   │
│  │   │                                                                      │   │   │
│  │   │   5. Validate tenant exists and is active                           │   │   │
│  │   │                                                                      │   │   │
│  │   │   6. Set TenantContext.setCurrentTenant(tenantId)                   │   │   │
│  │   │                                                                      │   │   │
│  │   └─────────────────────────────────────────────────────────────────────┘   │   │
│  │                                      │                                       │   │
│  │                                      ▼                                       │   │
│  │   ┌─────────────────────────────────────────────────────────────────────┐   │   │
│  │   │                    Controller / Service Layer                        │   │   │
│  │   │                                                                      │   │   │
│  │   │   7. Business logic executes                                        │   │   │
│  │   │   8. Repository calls use TenantContext                             │   │   │
│  │   │                                                                      │   │   │
│  │   └─────────────────────────────────────────────────────────────────────┘   │   │
│  │                                      │                                       │   │
│  │                                      ▼                                       │   │
│  │   ┌─────────────────────────────────────────────────────────────────────┐   │   │
│  │   │                    Hibernate / JPA Layer                             │   │   │
│  │   │                                                                      │   │   │
│  │   │   9. CurrentTenantIdentifierResolver returns tenant                 │   │   │
│  │   │  10. MultiTenantConnectionProvider sets schema                      │   │   │
│  │   │                                                                      │   │   │
│  │   │      SET search_path TO bank_001, public;                           │   │   │
│  │   │                                                                      │   │   │
│  │   └─────────────────────────────────────────────────────────────────────┘   │   │
│  │                                      │                                       │   │
│  └──────────────────────────────────────┼──────────────────────────────────────┘   │
│                                         │                                          │
│                                         ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         PostgreSQL Database                                  │   │
│  │                                                                              │   │
│  │  11. Query executes on tenant-specific schema (bank_001)                    │   │
│  │                                                                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Tenant Context Implementation

```java
/**
 * Thread-local tenant context holder
 */
public class TenantContext {

    private static final ThreadLocal<TenantInfo> CURRENT_TENANT = new ThreadLocal<>();

    public static void setCurrentTenant(TenantInfo tenantInfo) {
        CURRENT_TENANT.set(tenantInfo);
    }

    public static TenantInfo getCurrentTenantInfo() {
        return CURRENT_TENANT.get();
    }

    public static String getCurrentTenant() {
        TenantInfo info = CURRENT_TENANT.get();
        return (info != null) ? info.getTenantId() : null;
    }

    public static String getCurrentSchema() {
        TenantInfo info = CURRENT_TENANT.get();
        return (info != null) ? info.getSchemaName() : "public";
    }

    public static void clear() {
        CURRENT_TENANT.remove();
    }
}

@Data
@Builder
public class TenantInfo {
    private String tenantId;
    private String schemaName;
    private String bankCode;
    private String bankName;
    private String branchId;
    private String keycloakRealm;
    private TenantStatus status;
    private Map<String, String> configuration;
}
```

### 5.3 Tenant Interceptor Filter

```java
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class TenantInterceptor extends OncePerRequestFilter {

    private final TenantRepository tenantRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        try {
            // Extract tenant from JWT
            String tenantId = extractTenantFromJwt(request);

            if (tenantId == null) {
                // Fallback to header
                tenantId = request.getHeader("X-Tenant-ID");
            }

            if (tenantId == null) {
                // Fallback to subdomain
                tenantId = extractTenantFromSubdomain(request);
            }

            if (tenantId != null) {
                // Validate and load tenant info
                TenantInfo tenantInfo = tenantRepository.findByTenantId(tenantId)
                    .map(this::mapToTenantInfo)
                    .orElseThrow(() -> new TenantNotFoundException(tenantId));

                if (tenantInfo.getStatus() != TenantStatus.ACTIVE) {
                    throw new TenantSuspendedException(tenantId);
                }

                TenantContext.setCurrentTenant(tenantInfo);

                // Add MDC for logging
                MDC.put("tenantId", tenantId);
                MDC.put("bankCode", tenantInfo.getBankCode());
            }

            filterChain.doFilter(request, response);

        } finally {
            TenantContext.clear();
            MDC.clear();
        }
    }

    private String extractTenantFromJwt(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                DecodedJWT jwt = JWT.decode(token);
                return jwt.getClaim("tenant_id").asString();
            } catch (JWTDecodeException e) {
                log.warn("Failed to decode JWT for tenant extraction", e);
            }
        }
        return null;
    }

    private String extractTenantFromSubdomain(HttpServletRequest request) {
        String host = request.getServerName();
        // bank001.ulms.unisoft.com.bd -> bank_001
        if (host.contains(".ulms.")) {
            String subdomain = host.split("\\.")[0];
            return subdomain.replace("-", "_");
        }
        return null;
    }
}
```

### 5.4 JWT Token Structure with Tenant Claims

```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user123",
    "iss": "https://auth.ulms.unisoft.com.bd/realms/bank_001_realm",
    "aud": "ulms-web-app",
    "exp": 1707050400,
    "iat": 1707046800,

    "tenant_id": "bank_001",
    "bank_code": "EXIM",
    "bank_name": "EXIM Bank Limited",
    "branch_id": "BR001",
    "branch_name": "Gulshan Branch",

    "user_id": "USR-2026-000123",
    "username": "rezaul.karim",
    "email": "rezaul.karim@eximbank.com.bd",

    "roles": ["CREDIT_ANALYST", "BRANCH_USER"],
    "permissions": ["LOAN_VIEW", "LOAN_CREATE", "CIB_INQUIRY"],
    "approval_limit": 500000,

    "realm_access": {
      "roles": ["offline_access", "uma_authorization"]
    }
  }
}
```

---

## 6. Tenant Onboarding Process

### 6.1 Onboarding Workflow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         TENANT ONBOARDING WORKFLOW                                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│   │  1. Bank    │───▶│  2. Tenant  │───▶│  3. Schema  │───▶│  4. Keycloak│         │
│   │  Contract   │    │  Registry   │    │  Creation   │    │  Realm      │         │
│   │  Signed     │    │  Entry      │    │             │    │  Setup      │         │
│   └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                    │                │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐           │                │
│   │  8. Bank    │◀───│  7. UAT &   │◀───│  6. Initial │◀───┬──────┘                │
│   │  Go-Live    │    │  Training   │    │  Users      │    │                       │
│   └─────────────┘    └─────────────┘    └─────────────┘    │                       │
│                                                             │                       │
│                                              ┌─────────────┐│                       │
│                                              │ 5. MinIO    ││                       │
│                                              │ Bucket      │┘                       │
│                                              └─────────────┘                        │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Automated Onboarding Script

```java
@Service
@Transactional
public class TenantOnboardingService {

    public TenantOnboardingResult onboardTenant(TenantOnboardingRequest request) {

        // Step 1: Validate bank information
        validateBankInfo(request);

        // Step 2: Create tenant registry entry
        Tenant tenant = createTenantRegistry(request);

        // Step 3: Create database schema
        createTenantSchema(tenant.getSchemaName());

        // Step 4: Run Flyway migrations on new schema
        runSchemaMigrations(tenant.getSchemaName());

        // Step 5: Create Keycloak realm
        KeycloakRealm realm = createKeycloakRealm(tenant);

        // Step 6: Create MinIO bucket
        createMinioBucket(tenant.getTenantId());

        // Step 7: Create initial admin user
        User adminUser = createInitialAdminUser(tenant, request.getAdminEmail());

        // Step 8: Initialize default configuration
        initializeDefaultConfiguration(tenant);

        // Step 9: Create default loan products
        createDefaultLoanProducts(tenant);

        // Step 10: Send activation email
        sendActivationEmail(adminUser, tenant);

        return TenantOnboardingResult.builder()
            .tenant(tenant)
            .keycloakRealm(realm)
            .adminUser(adminUser)
            .status(OnboardingStatus.COMPLETED)
            .build();
    }

    private void createTenantSchema(String schemaName) {
        jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS " + schemaName);

        // Grant permissions
        jdbcTemplate.execute(
            "GRANT USAGE ON SCHEMA " + schemaName + " TO ulms_app_user"
        );
        jdbcTemplate.execute(
            "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA " +
            schemaName + " TO ulms_app_user"
        );
        jdbcTemplate.execute(
            "REVOKE ALL ON SCHEMA " + schemaName + " FROM PUBLIC"
        );
    }

    private void runSchemaMigrations(String schemaName) {
        Flyway flyway = Flyway.configure()
            .dataSource(dataSource)
            .schemas(schemaName)
            .locations("classpath:db/tenant-migration")
            .baselineOnMigrate(true)
            .load();

        flyway.migrate();
    }

    private KeycloakRealm createKeycloakRealm(Tenant tenant) {
        RealmRepresentation realm = new RealmRepresentation();
        realm.setRealm(tenant.getTenantId() + "_realm");
        realm.setEnabled(true);
        realm.setDisplayName(tenant.getBankName());

        // Configure realm settings
        realm.setSslRequired("external");
        realm.setRegistrationAllowed(false);
        realm.setResetPasswordAllowed(true);
        realm.setRememberMe(true);

        // Create realm in Keycloak
        keycloakAdmin.realms().create(realm);

        // Create default roles
        createDefaultRoles(realm.getRealm());

        // Create default client
        createUlmsClient(realm.getRealm(), tenant);

        return mapToKeycloakRealm(realm);
    }
}
```

### 6.3 Onboarding Checklist

| Step | Task | Automated | Validation |
|------|------|-----------|------------|
| 1 | Bank contract verification | No | Manual review |
| 2 | Tenant registry entry | Yes | Unique bank_code |
| 3 | Schema creation | Yes | Schema exists check |
| 4 | Flyway migrations | Yes | Migration status |
| 5 | Keycloak realm | Yes | Realm accessible |
| 6 | MinIO bucket | Yes | Bucket exists |
| 7 | Initial admin user | Yes | User can login |
| 8 | Default configuration | Yes | Config count |
| 9 | Default products | Yes | Product count |
| 10 | Activation email | Yes | Email sent |
| 11 | UAT environment | No | Manual setup |
| 12 | User training | No | Attendance record |
| 13 | Go-live approval | No | Sign-off document |

---

## 7. Configuration Management

### 7.1 Per-Bank Configuration Categories

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                      PER-BANK CONFIGURATION CATEGORIES                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  LOAN PRODUCTS                                                               │   │
│  │  • Product codes and names                                                  │   │
│  │  • Interest rate ranges (min/max)                                           │   │
│  │  • Amount limits (min/max)                                                  │   │
│  │  • Tenor limits (min/max months)                                            │   │
│  │  • Processing fees                                                          │   │
│  │  • Late fee configuration                                                   │   │
│  │  • Required documents per product                                           │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  APPROVAL WORKFLOW                                                           │   │
│  │  • Approval level limits (L1-L7)                                            │   │
│  │  • Role assignments per level                                               │   │
│  │  • SLA configurations (hours per level)                                     │   │
│  │  • Escalation rules                                                         │   │
│  │  • Parallel/Sequential approval                                             │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  BRANDING                                                                    │   │
│  │  • Logo URL                                                                 │   │
│  │  • Primary/Secondary colors                                                 │   │
│  │  • Bank name (English/Bengali)                                              │   │
│  │  • Report headers                                                           │   │
│  │  • Email templates                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  INTEGRATION                                                                 │   │
│  │  • CBS API endpoint                                                         │   │
│  │  • CBS credentials (encrypted)                                              │   │
│  │  • CIB API key (encrypted)                                                  │   │
│  │  • SMS gateway credentials                                                  │   │
│  │  • bKash/Nagad merchant IDs                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  COMPLIANCE                                                                  │   │
│  │  • BRPD classification rules                                                │   │
│  │  • Provision rates (if different from standard)                             │   │
│  │  • Regulatory report settings                                               │   │
│  │  • Audit retention periods                                                  │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Configuration Service

```java
@Service
public class TenantConfigurationService {

    private final TenantConfigurationRepository configRepository;
    private final RedisTemplate<String, String> redisTemplate;

    private static final String CACHE_PREFIX = "tenant:config:";
    private static final Duration CACHE_TTL = Duration.ofHours(1);

    public String getConfig(String key) {
        String tenantId = TenantContext.getCurrentTenant();
        return getConfig(tenantId, key);
    }

    public String getConfig(String tenantId, String key) {
        // Try cache first
        String cacheKey = CACHE_PREFIX + tenantId + ":" + key;
        String cachedValue = redisTemplate.opsForValue().get(cacheKey);

        if (cachedValue != null) {
            return cachedValue;
        }

        // Load from database
        return configRepository.findByTenantIdAndConfigKey(tenantId, key)
            .map(config -> {
                String value = config.getIsEncrypted()
                    ? encryptionService.decrypt(config.getConfigValue())
                    : config.getConfigValue();

                // Cache the value
                redisTemplate.opsForValue().set(cacheKey, value, CACHE_TTL);
                return value;
            })
            .orElse(getDefaultConfig(key));
    }

    public Integer getIntConfig(String key) {
        String value = getConfig(key);
        return value != null ? Integer.parseInt(value) : null;
    }

    public Boolean getBoolConfig(String key) {
        String value = getConfig(key);
        return value != null ? Boolean.parseBoolean(value) : null;
    }

    @CacheEvict(cacheNames = "tenantConfig", allEntries = true)
    public void updateConfig(String key, String value) {
        String tenantId = TenantContext.getCurrentTenant();

        TenantConfiguration config = configRepository
            .findByTenantIdAndConfigKey(tenantId, key)
            .orElse(new TenantConfiguration());

        config.setTenantId(tenantId);
        config.setConfigKey(key);
        config.setConfigValue(value);
        config.setUpdatedAt(Instant.now());

        configRepository.save(config);

        // Invalidate cache
        String cacheKey = CACHE_PREFIX + tenantId + ":" + key;
        redisTemplate.delete(cacheKey);
    }
}
```

### 7.3 Sample Configuration Values

| Config Key | Bank A (EXIM) | Bank B (DBBL) | Default |
|------------|---------------|---------------|---------|
| `loan.max_amount_personal` | 5,000,000 | 3,000,000 | 2,000,000 |
| `loan.max_tenor_months` | 60 | 48 | 36 |
| `approval.level1_limit` | 500,000 | 300,000 | 500,000 |
| `approval.level2_limit` | 1,000,000 | 700,000 | 1,000,000 |
| `notification.sms_enabled` | true | true | true |
| `branding.primary_color` | #003366 | #C8102E | #1976D2 |
| `cib.cache_ttl_hours` | 1 | 2 | 1 |

---

## 8. Security Considerations

### 8.1 Tenant-Aware RBAC

```java
@PreAuthorize("@tenantSecurity.hasPermission(#loanId, 'LOAN_VIEW')")
public LoanDTO getLoan(Long loanId) {
    return loanService.getLoan(loanId);
}

@Component("tenantSecurity")
public class TenantSecurityService {

    public boolean hasPermission(Long resourceId, String permission) {
        // Get current tenant
        String currentTenant = TenantContext.getCurrentTenant();

        // Get current user's permissions
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Set<String> userPermissions = extractPermissions(auth);

        // Verify user has permission
        if (!userPermissions.contains(permission)) {
            return false;
        }

        // Verify resource belongs to current tenant
        return verifyResourceTenant(resourceId, currentTenant);
    }

    private boolean verifyResourceTenant(Long resourceId, String tenantId) {
        // Query the resource to verify it belongs to the tenant
        // This prevents cross-tenant data access even with valid permissions
        return resourceRepository.existsByIdAndTenantId(resourceId, tenantId);
    }
}
```

### 8.2 Cross-Tenant Access Prevention Checklist

| Control | Implementation | Status |
|---------|---------------|--------|
| Schema isolation | PostgreSQL schemas | ✅ |
| Connection isolation | Per-request schema setting | ✅ |
| JWT tenant claim | Keycloak realm mapping | ✅ |
| Request validation | TenantInterceptor filter | ✅ |
| Query validation | TenantSecurityAspect | ✅ |
| API authorization | @TenantSecured annotation | ✅ |
| Audit logging | Per-tenant audit tables | ✅ |
| Document isolation | MinIO bucket-per-tenant | ✅ |
| Cache isolation | Tenant-prefixed cache keys | ✅ |

### 8.3 Audit Logging Per Tenant

```java
@Aspect
@Component
public class TenantAuditAspect {

    @AfterReturning(
        pointcut = "@annotation(Audited)",
        returning = "result"
    )
    public void auditAfterSuccess(JoinPoint joinPoint, Object result) {
        String tenantId = TenantContext.getCurrentTenant();
        String userId = SecurityContextHolder.getContext()
            .getAuthentication().getName();

        AuditEvent event = AuditEvent.builder()
            .eventId(UUID.randomUUID().toString())
            .eventType(getEventType(joinPoint))
            .eventTimestamp(Instant.now())
            .tenantId(tenantId)
            .userId(userId)
            .action(joinPoint.getSignature().getName())
            .actionStatus("SUCCESS")
            .resourceType(getResourceType(joinPoint))
            .resourceId(extractResourceId(result))
            .build();

        // Save to tenant-specific audit table
        auditRepository.save(event);

        // Also publish to Kafka for compliance
        kafkaTemplate.send("audit.events", event);
    }
}
```

---

## 9. Scaling Strategy

### 9.1 Scaling for 62+ Banks

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         SCALING STRATEGY FOR 62+ BANKS                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  DATABASE SCALING                                                            │   │
│  │                                                                              │   │
│  │  Primary PostgreSQL Cluster                                                  │   │
│  │  ├── Primary Node (Write)                                                   │   │
│  │  │   └── Schemas: bank_001 - bank_062                                       │   │
│  │  ├── Standby Node 1 (Read)                                                  │   │
│  │  └── Standby Node 2 (Read)                                                  │   │
│  │                                                                              │   │
│  │  Connection Pooling: pgBouncer                                              │   │
│  │  ├── Pool per tenant (max 50 connections)                                   │   │
│  │  └── Total pool: 500 connections                                            │   │
│  │                                                                              │   │
│  │  Future Scale: Database sharding by tenant group                            │   │
│  │  ├── Shard 1: bank_001 - bank_020 (20 banks)                               │   │
│  │  ├── Shard 2: bank_021 - bank_040 (20 banks)                               │   │
│  │  └── Shard 3: bank_041 - bank_062 (22 banks)                               │   │
│  │                                                                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  APPLICATION SCALING                                                         │   │
│  │                                                                              │   │
│  │  Kubernetes Deployment                                                       │   │
│  │  ├── Namespace: ulms-production                                             │   │
│  │  │   ├── ulms-fineract: 3-20 replicas (HPA)                                │   │
│  │  │   ├── ulms-cib-service: 2-10 replicas                                   │   │
│  │  │   ├── ulms-workflow-service: 2-10 replicas                              │   │
│  │  │   └── ... (other services)                                              │   │
│  │  │                                                                          │   │
│  │  │   Resource Allocation (per replica):                                     │   │
│  │  │   ├── CPU: 500m-1000m                                                   │   │
│  │  │   └── Memory: 1Gi-2Gi                                                   │   │
│  │  │                                                                          │   │
│  │  Horizontal Pod Autoscaler                                                   │   │
│  │  ├── CPU target: 70%                                                        │   │
│  │  ├── Memory target: 80%                                                     │   │
│  │  └── Scale up: 15 seconds, Scale down: 60 seconds                          │   │
│  │                                                                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  STORAGE SCALING                                                             │   │
│  │                                                                              │   │
│  │  MinIO Cluster                                                               │   │
│  │  ├── 4+ nodes for high availability                                         │   │
│  │  ├── Erasure coding for data protection                                     │   │
│  │  └── 1 bucket per tenant                                                    │   │
│  │                                                                              │   │
│  │  Estimated Storage per Bank:                                                 │   │
│  │  ├── Documents: 100GB - 1TB                                                 │   │
│  │  ├── Growth rate: 10GB/month                                                │   │
│  │  └── Total (62 banks): 6TB - 62TB                                          │   │
│  │                                                                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Resource Estimation per Tenant

| Resource | Per Tenant (Small) | Per Tenant (Large) | 62 Tenants (Total) |
|----------|-------------------|-------------------|-------------------|
| **Database Storage** | 10 GB | 100 GB | 620 GB - 6.2 TB |
| **Document Storage** | 50 GB | 500 GB | 3.1 TB - 31 TB |
| **DB Connections** | 20 | 50 | 1240 - 3100 |
| **Cache Memory** | 256 MB | 1 GB | 16 GB - 62 GB |
| **CPU (Peak)** | 0.5 cores | 2 cores | 31 - 124 cores |
| **Memory (Peak)** | 1 GB | 4 GB | 62 GB - 248 GB |

---

## 10. Migration & Provisioning

### 10.1 Flyway Migration Strategy

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         FLYWAY MIGRATION STRUCTURE                                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   src/main/resources/                                                               │
│   └── db/                                                                           │
│       ├── migration/                     (Public schema migrations)                 │
│       │   ├── V1.0.0__create_tenants_table.sql                                     │
│       │   ├── V1.0.1__create_tenant_config_table.sql                               │
│       │   └── V1.0.2__create_global_audit_table.sql                                │
│       │                                                                             │
│       └── tenant-migration/              (Per-tenant schema migrations)             │
│           ├── V1.0.0__create_client_table.sql                                      │
│           ├── V1.0.1__create_loan_table.sql                                        │
│           ├── V1.0.2__create_cib_inquiry_table.sql                                 │
│           ├── V1.0.3__create_classification_history_table.sql                      │
│           ├── V1.0.4__create_audit_log_table.sql                                   │
│           ├── V1.1.0__add_loan_indexes.sql                                         │
│           └── V1.2.0__add_new_columns.sql                                          │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Multi-Tenant Migration Executor

```java
@Service
public class TenantMigrationService {

    public void migrateAllTenants() {
        List<Tenant> tenants = tenantRepository.findAllActive();

        for (Tenant tenant : tenants) {
            migrateTenant(tenant.getSchemaName());
        }
    }

    public void migrateTenant(String schemaName) {
        Flyway flyway = Flyway.configure()
            .dataSource(dataSource)
            .schemas(schemaName)
            .locations("classpath:db/tenant-migration")
            .table("flyway_schema_history")
            .baselineOnMigrate(true)
            .validateOnMigrate(true)
            .outOfOrder(false)
            .cleanDisabled(true)  // Never auto-clean in production
            .load();

        MigrateResult result = flyway.migrate();

        log.info("Migration completed for schema {}: {} migrations applied",
            schemaName, result.migrationsExecuted);
    }

    @Scheduled(cron = "0 0 3 * * ?")  // Daily at 3 AM
    public void checkPendingMigrations() {
        List<Tenant> tenants = tenantRepository.findAllActive();

        for (Tenant tenant : tenants) {
            Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .schemas(tenant.getSchemaName())
                .locations("classpath:db/tenant-migration")
                .load();

            MigrationInfo[] pending = flyway.info().pending();

            if (pending.length > 0) {
                log.warn("Tenant {} has {} pending migrations",
                    tenant.getTenantId(), pending.length);

                // Alert operations team
                alertService.sendMigrationAlert(tenant, pending);
            }
        }
    }
}
```

### 10.3 Tenant Provisioning Automation

```yaml
# Kubernetes Job for Tenant Provisioning
apiVersion: batch/v1
kind: Job
metadata:
  name: tenant-provision-bank-063
spec:
  template:
    spec:
      containers:
      - name: provisioner
        image: unisoft/ulms-provisioner:1.0.0
        env:
        - name: TENANT_ID
          value: "bank_063"
        - name: BANK_CODE
          value: "NEWBANK"
        - name: BANK_NAME
          value: "New Bank Limited"
        - name: ADMIN_EMAIL
          value: "admin@newbank.com.bd"
        command: ["/app/provision-tenant.sh"]
      restartPolicy: Never
  backoffLimit: 3
```

---

## 11. Performance Optimization

### 11.1 Connection Pooling with pgBouncer

```ini
# pgbouncer.ini
[databases]
ulms_bank_001 = host=postgres port=5432 dbname=ulms_db
ulms_bank_002 = host=postgres port=5432 dbname=ulms_db
ulms_bank_003 = host=postgres port=5432 dbname=ulms_db

[pgbouncer]
pool_mode = transaction
max_client_conn = 5000
default_pool_size = 50
min_pool_size = 10
reserve_pool_size = 10
reserve_pool_timeout = 5
max_db_connections = 500
```

### 11.2 Query Optimization per Tenant

```sql
-- Ensure indexes are created per tenant schema
-- These indexes significantly improve query performance

-- Index on loan status and branch for dashboard queries
CREATE INDEX CONCURRENTLY idx_loan_status_branch
ON bank_001.m_loan(loan_status, branch_id);

-- Index on classification and DPD for BRPD reports
CREATE INDEX CONCURRENTLY idx_loan_class_dpd
ON bank_001.m_loan(classification, dpd);

-- Index on audit log for compliance queries
CREATE INDEX CONCURRENTLY idx_audit_user_timestamp
ON bank_001.audit_log(user_id, event_timestamp DESC);

-- Partial index for active loans only
CREATE INDEX CONCURRENTLY idx_loan_active
ON bank_001.m_loan(client_id, loan_status)
WHERE loan_status NOT IN ('CLOSED', 'REJECTED', 'CANCELLED');
```

### 11.3 Cache Strategy per Tenant

```java
@Configuration
public class TenantCacheConfiguration {

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofHours(1))
            .serializeKeysWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                    new StringRedisSerializer()
                )
            )
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                    new GenericJackson2JsonRedisSerializer()
                )
            )
            .computePrefixWith(cacheName ->
                TenantContext.getCurrentTenant() + ":" + cacheName + ":"
            );

        return RedisCacheManager.builder(factory)
            .cacheDefaults(config)
            .build();
    }
}

// Usage: Cache key becomes "bank_001:loanProducts:PL-001"
@Cacheable(value = "loanProducts", key = "#productCode")
public LoanProduct getLoanProduct(String productCode) {
    return productRepository.findByCode(productCode);
}
```

---

## 12. Appendices

### Appendix A: Schema Naming Convention

| Entity | Schema | Table | Example |
|--------|--------|-------|---------|
| Tenant Registry | `public` | `tenants` | `public.tenants` |
| Customer | `bank_XXX` | `m_client` | `bank_001.m_client` |
| Loan | `bank_XXX` | `m_loan` | `bank_001.m_loan` |
| CIB Inquiry | `bank_XXX` | `cib_inquiry` | `bank_001.cib_inquiry` |
| Audit Log | `bank_XXX` | `audit_log` | `bank_001.audit_log` |

### Appendix B: Tenant ID Format

| Component | Format | Example |
|-----------|--------|---------|
| Tenant ID | `bank_XXX` | `bank_001` |
| Schema Name | `bank_XXX` | `bank_001` |
| Keycloak Realm | `bank_XXX_realm` | `bank_001_realm` |
| MinIO Bucket | `ulms-bank-XXX-documents` | `ulms-bank-001-documents` |
| Cache Prefix | `bank_XXX:` | `bank_001:` |

### Appendix C: Performance Benchmarks

| Operation | Single Tenant | 62 Tenants | Target |
|-----------|--------------|------------|--------|
| Schema switch | 1-2 ms | 1-2 ms | < 5 ms |
| Simple query | 5-10 ms | 10-20 ms | < 50 ms |
| Complex report | 100-500 ms | 200-800 ms | < 2 sec |
| Tenant onboarding | 30-60 sec | N/A | < 5 min |
| Migration (per schema) | 10-30 sec | N/A | < 1 min |

### Appendix D: References

1. PostgreSQL Schema Documentation
2. Hibernate Multi-Tenancy Guide
3. Spring Data JPA Multi-Tenancy
4. pgBouncer Configuration Guide
5. Flyway Multi-Schema Migration
6. ULMS BRD v1.0
7. ULMS SRS v2.0
8. ULMS Technology Stack v2.0
9. Bangladesh Bank ICT Security Guidelines V4.0

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

*This Multi-Tenant Architecture Design provides the complete specification for schema-per-bank isolation strategy in ULMS v2.0, ensuring data security and compliance for 62+ Bangladesh scheduled commercial banks.*

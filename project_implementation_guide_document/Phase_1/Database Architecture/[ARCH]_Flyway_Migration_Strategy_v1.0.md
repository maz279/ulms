# Flyway Migration Strategy

| Document ID | ULMS-ARCH-FLY-001 |
|-------------|-------------------|
| Version | 1.0 |
| Date | 2026-02-05 |
| Author | System Architect |
| Status | Draft |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-05 | System Architect | Initial document creation |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Flyway 10.x Configuration](#2-flyway-10x-configuration)
3. [Migration Directory Structure](#3-migration-directory-structure)
4. [Migration Naming Convention](#4-migration-naming-convention)
5. [Multi-Tenant Migration Strategy](#5-multi-tenant-migration-strategy)
6. [Tenant Onboarding Process](#6-tenant-onboarding-process)
7. [Baseline Strategy](#7-baseline-strategy)
8. [Rollback Strategy](#8-rollback-strategy)
9. [Migration Testing](#9-migration-testing)
10. [CI/CD Integration](#10-cicd-integration)
11. [Security Considerations](#11-security-considerations)
12. [Compliance Matrix](#12-compliance-matrix)
13. [Appendices](#13-appendices)

---

## 1. Introduction

### 1.1 Purpose

This document defines the Flyway database migration strategy for ULMS v2.0, enabling version-controlled, repeatable, and auditable database schema changes across the multi-tenant architecture supporting 62+ Bangladesh banks.

### 1.2 Scope

- Flyway 10.x configuration for PostgreSQL 16
- Multi-tenant migration execution
- Tenant onboarding automation
- CI/CD pipeline integration
- Rollback and recovery procedures

### 1.3 References

| Document | Description |
|----------|-------------|
| Technology Stack | Flyway 10.x Specifications |
| Multi-Tenant Architecture | Schema-per-tenant design |
| SQL Naming Standards | [STD]_NamingConventions_SQL_Database_v1.0.md |
| Database Schema | [ARCH]_Database_Schema_Design_Document_v1.0.md |

### 1.4 Migration Philosophy

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Database Migration Principles                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   1. Version Control Everything                                      │
│      - All schema changes in Git                                    │
│      - No manual DDL in production                                  │
│                                                                      │
│   2. Forward-Only Migrations                                        │
│      - Avoid destructive operations                                 │
│      - Undo migrations for rollback                                 │
│                                                                      │
│   3. Idempotent When Possible                                       │
│      - Use IF NOT EXISTS                                            │
│      - Safe re-execution                                            │
│                                                                      │
│   4. Test Before Production                                         │
│      - Run on dev → staging → production                            │
│      - Automated validation                                         │
│                                                                      │
│   5. Audit Trail                                                    │
│      - Schema history table                                         │
│      - Migration execution logs                                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Flyway 10.x Configuration

### 2.1 Dependencies (Maven)

```xml
<!-- pom.xml -->
<properties>
    <flyway.version>10.8.1</flyway.version>
</properties>

<dependencies>
    <!-- Flyway Core -->
    <dependency>
        <groupId>org.flywaydb</groupId>
        <artifactId>flyway-core</artifactId>
        <version>${flyway.version}</version>
    </dependency>

    <!-- PostgreSQL Support -->
    <dependency>
        <groupId>org.flywaydb</groupId>
        <artifactId>flyway-database-postgresql</artifactId>
        <version>${flyway.version}</version>
    </dependency>

    <!-- PostgreSQL Driver -->
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <version>42.7.1</version>
    </dependency>
</dependencies>

<build>
    <plugins>
        <plugin>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-maven-plugin</artifactId>
            <version>${flyway.version}</version>
            <configuration>
                <configFiles>
                    <configFile>src/main/resources/flyway.conf</configFile>
                </configFiles>
            </configuration>
        </plugin>
    </plugins>
</build>
```

### 2.2 Flyway Configuration File

```properties
# src/main/resources/flyway.conf

# Database Connection
flyway.url=jdbc:postgresql://localhost:5432/ulms
flyway.user=${DB_USER}
flyway.password=${DB_PASSWORD}

# Migration Locations
flyway.locations=classpath:db/migration,classpath:db/callback

# Schema Configuration
flyway.schemas=public
flyway.defaultSchema=public
flyway.createSchemas=true

# Table Configuration
flyway.table=flyway_schema_history
flyway.tablespace=

# Migration Settings
flyway.baselineOnMigrate=true
flyway.baselineVersion=0
flyway.baselineDescription=Baseline

# Validation
flyway.validateOnMigrate=true
flyway.validateMigrationNaming=true
flyway.cleanDisabled=true

# Encoding
flyway.encoding=UTF-8
flyway.sqlMigrationSeparator=__
flyway.sqlMigrationSuffixes=.sql

# Placeholders
flyway.placeholderReplacement=true
flyway.placeholders.schema_name=public
flyway.placeholders.tenant_id=

# Callbacks
flyway.callbacks=com.ulms.db.FlywayCallback

# Output
flyway.outputQueryResults=false

# Advanced
flyway.mixed=false
flyway.group=false
flyway.installedBy=${user.name}
flyway.loggers=auto
```

### 2.3 Spring Boot Integration

```yaml
# application.yml

spring:
  flyway:
    enabled: true
    baseline-on-migrate: true
    baseline-version: "0"
    locations:
      - classpath:db/migration
    schemas:
      - public
    table: flyway_schema_history
    validate-on-migrate: true
    clean-disabled: true
    out-of-order: false
    placeholders:
      environment: ${ENVIRONMENT:development}
```

### 2.4 Java Configuration

```java
package com.ulms.config;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
public class FlywayConfig {

    @Value("${spring.flyway.locations}")
    private String[] locations;

    @Bean
    public Flyway flyway(DataSource dataSource) {
        return Flyway.configure()
            .dataSource(dataSource)
            .locations(locations)
            .schemas("public")
            .table("flyway_schema_history")
            .baselineOnMigrate(true)
            .baselineVersion("0")
            .validateOnMigrate(true)
            .cleanDisabled(true)
            .load();
    }

    @Bean
    public FlywayMigrationInitializer flywayInitializer(Flyway flyway) {
        return new FlywayMigrationInitializer(flyway);
    }
}
```

---

## 3. Migration Directory Structure

### 3.1 Project Structure

```
src/main/resources/
├── db/
│   ├── migration/                    # Public schema migrations
│   │   ├── V20260101.01__create_tenants_table.sql
│   │   ├── V20260101.02__create_tenant_configuration.sql
│   │   ├── V20260102.01__create_system_parameters.sql
│   │   └── R__refresh_materialized_views.sql
│   │
│   ├── tenant-migration/             # Per-tenant schema migrations
│   │   ├── V20260105.01__create_m_client_table.sql
│   │   ├── V20260105.02__create_m_loan_table.sql
│   │   ├── V20260106.01__create_audit_log_partitioned.sql
│   │   ├── V20260107.01__add_classification_columns.sql
│   │   └── R__create_tenant_views.sql
│   │
│   ├── seed/                         # Reference data seeds
│   │   ├── V20260110.01__seed_classification_codes.sql
│   │   ├── V20260110.02__seed_district_codes.sql
│   │   └── V20260110.03__seed_default_roles.sql
│   │
│   ├── callback/                     # Flyway callbacks
│   │   └── beforeMigrate.sql
│   │
│   └── undo/                         # Undo migrations (Flyway Teams)
│       ├── U20260105.01__drop_m_client_table.sql
│       └── U20260105.02__drop_m_loan_table.sql
│
└── flyway.conf
```

### 3.2 Directory Purposes

| Directory | Purpose | Execution |
|-----------|---------|-----------|
| `db/migration/` | Public schema DDL/DML | On app startup |
| `db/tenant-migration/` | Per-tenant schema DDL/DML | Tenant onboarding + updates |
| `db/seed/` | Reference data initialization | After schema creation |
| `db/callback/` | Pre/post migration hooks | Automatic |
| `db/undo/` | Rollback scripts | Manual (Flyway Teams) |

### 3.3 Migration Categories

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Migration Type Categories                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   V = Versioned Migrations (run once, in order)                     │
│   ├── Schema creation (CREATE TABLE)                                │
│   ├── Column additions (ALTER TABLE ADD)                            │
│   ├── Index creation (CREATE INDEX)                                 │
│   └── Data migrations (INSERT, UPDATE)                              │
│                                                                      │
│   R = Repeatable Migrations (run when checksum changes)             │
│   ├── Views (CREATE OR REPLACE VIEW)                                │
│   ├── Functions (CREATE OR REPLACE FUNCTION)                        │
│   ├── Stored procedures                                             │
│   └── Triggers                                                      │
│                                                                      │
│   U = Undo Migrations (rollback versioned migrations)               │
│   └── Reversal scripts for V migrations                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Migration Naming Convention

### 4.1 Standard Format

```
V{YYYYMMDD}.{NN}__{description}.sql

Where:
  V         = Versioned migration prefix
  YYYYMMDD  = Date (e.g., 20260205)
  NN        = Sequence number within date (01, 02, etc.)
  __        = Double underscore separator
  description = Descriptive name (snake_case)
```

### 4.2 Examples

| Migration File | Description |
|----------------|-------------|
| `V20260101.01__create_tenants_table.sql` | First migration on Jan 1, 2026 |
| `V20260101.02__create_tenant_config.sql` | Second migration on Jan 1, 2026 |
| `V20260205.01__add_kyc_status_column.sql` | Add column migration |
| `V20260205.02__create_cib_inquiry_table.sql` | New table migration |
| `R__create_classification_view.sql` | Repeatable view migration |
| `U20260205.01__remove_kyc_status_column.sql` | Undo migration |

### 4.3 Naming Rules

| Rule | Example | Anti-Pattern |
|------|---------|--------------|
| Use snake_case | `create_m_client_table` | `createMClientTable` |
| Be descriptive | `add_nid_encryption_columns` | `update_table` |
| Include entity | `create_loan_collateral_table` | `create_new_table` |
| Indicate action | `alter_client_add_kyc_fields` | `client_changes` |

---

## 5. Multi-Tenant Migration Strategy

### 5.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                Multi-Tenant Flyway Architecture                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Application Startup                                                │
│   ┌──────────────────────────────────────────────────────────┐     │
│   │  1. Run public schema migrations                          │     │
│   │     └─▶ db/migration/*                                    │     │
│   └──────────────────────────────────────────────────────────┘     │
│                           │                                          │
│                           ▼                                          │
│   ┌──────────────────────────────────────────────────────────┐     │
│   │  2. For each active tenant:                               │     │
│   │     └─▶ Run db/tenant-migration/* on bank_XXX schema     │     │
│   └──────────────────────────────────────────────────────────┘     │
│                           │                                          │
│                           ▼                                          │
│   ┌──────────────────────────────────────────────────────────┐     │
│   │  3. Verify all tenants at same migration version          │     │
│   └──────────────────────────────────────────────────────────┘     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Multi-Tenant Migration Service

```java
package com.ulms.db;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.util.List;

@Service
public class MultiTenantMigrationService {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private TenantRepository tenantRepository;

    private static final String[] TENANT_MIGRATION_LOCATIONS = {
        "classpath:db/tenant-migration",
        "classpath:db/seed"
    };

    /**
     * Run migrations for all active tenants
     */
    public void migrateAllTenants() {
        List<Tenant> activeTenants = tenantRepository.findByStatus("ACTIVE");

        for (Tenant tenant : activeTenants) {
            migrateTenant(tenant.getSchemaName());
        }
    }

    /**
     * Run migrations for a specific tenant
     */
    public void migrateTenant(String schemaName) {
        Flyway flyway = Flyway.configure()
            .dataSource(dataSource)
            .locations(TENANT_MIGRATION_LOCATIONS)
            .schemas(schemaName)
            .table("flyway_schema_history")
            .baselineOnMigrate(true)
            .baselineVersion("0")
            .placeholders(Map.of(
                "schema_name", schemaName,
                "tenant_id", extractTenantId(schemaName)
            ))
            .load();

        flyway.migrate();
    }

    /**
     * Validate tenant schema is up to date
     */
    public boolean validateTenant(String schemaName) {
        Flyway flyway = Flyway.configure()
            .dataSource(dataSource)
            .locations(TENANT_MIGRATION_LOCATIONS)
            .schemas(schemaName)
            .load();

        try {
            flyway.validate();
            return true;
        } catch (FlywayValidateException e) {
            return false;
        }
    }

    /**
     * Get migration info for tenant
     */
    public MigrationInfo[] getTenantMigrationInfo(String schemaName) {
        Flyway flyway = Flyway.configure()
            .dataSource(dataSource)
            .locations(TENANT_MIGRATION_LOCATIONS)
            .schemas(schemaName)
            .load();

        return flyway.info().all();
    }

    private String extractTenantId(String schemaName) {
        // bank_001 -> 001
        return schemaName.replace("bank_", "");
    }
}
```

### 5.3 Tenant Schema History Table

Each tenant schema has its own `flyway_schema_history` table:

```sql
-- In bank_001 schema
SELECT * FROM bank_001.flyway_schema_history;

-- Schema history table structure (automatic)
CREATE TABLE flyway_schema_history (
    installed_rank  INTEGER NOT NULL PRIMARY KEY,
    version         VARCHAR(50),
    description     VARCHAR(200) NOT NULL,
    type            VARCHAR(20) NOT NULL,
    script          VARCHAR(1000) NOT NULL,
    checksum        INTEGER,
    installed_by    VARCHAR(100) NOT NULL,
    installed_on    TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    execution_time  INTEGER NOT NULL,
    success         BOOLEAN NOT NULL
);
```

### 5.4 Placeholder Usage in Migrations

```sql
-- V20260105.01__create_m_client_table.sql
-- Uses ${schema_name} placeholder for multi-tenant support

-- Set search path to tenant schema
SET search_path TO ${schema_name};

-- Create table in tenant schema
CREATE TABLE IF NOT EXISTS m_client (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(10) DEFAULT '${tenant_id}',
    display_name VARCHAR(255) NOT NULL,
    -- ... other columns
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_client_display_name ON m_client(display_name);

-- Reset search path
RESET search_path;
```

---

## 6. Tenant Onboarding Process

### 6.1 Onboarding Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Tenant Onboarding Workflow                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   1. Create Tenant Record                                           │
│   ┌──────────────────────────────────────────────────────────┐     │
│   │  INSERT INTO public.tenants (tenant_code, bank_name...)   │     │
│   └──────────────────────────────────────────────────────────┘     │
│                           │                                          │
│                           ▼                                          │
│   2. Create Tenant Schema                                           │
│   ┌──────────────────────────────────────────────────────────┐     │
│   │  CREATE SCHEMA bank_XXX AUTHORIZATION ulms_admin          │     │
│   └──────────────────────────────────────────────────────────┘     │
│                           │                                          │
│                           ▼                                          │
│   3. Run Tenant Migrations                                          │
│   ┌──────────────────────────────────────────────────────────┐     │
│   │  Flyway.migrate() on bank_XXX                             │     │
│   │  - Creates all tables                                     │     │
│   │  - Creates indexes                                        │     │
│   │  - Seeds reference data                                   │     │
│   └──────────────────────────────────────────────────────────┘     │
│                           │                                          │
│                           ▼                                          │
│   4. Configure Tenant-Specific Settings                             │
│   ┌──────────────────────────────────────────────────────────┐     │
│   │  INSERT INTO bank_XXX.tenant_settings (...)               │     │
│   │  Create admin user, configure Keycloak realm              │     │
│   └──────────────────────────────────────────────────────────┘     │
│                           │                                          │
│                           ▼                                          │
│   5. Activate Tenant                                                │
│   ┌──────────────────────────────────────────────────────────┐     │
│   │  UPDATE public.tenants SET status = 'ACTIVE'              │     │
│   └──────────────────────────────────────────────────────────┘     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Tenant Onboarding Service

```java
package com.ulms.tenant;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;

@Service
public class TenantOnboardingService {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private KeycloakService keycloakService;

    @Transactional
    public Tenant onboardTenant(TenantOnboardingRequest request) {
        String schemaName = "bank_" + request.getTenantCode();

        // 1. Create tenant record
        Tenant tenant = new Tenant();
        tenant.setTenantCode(request.getTenantCode());
        tenant.setBankName(request.getBankName());
        tenant.setSchemaName(schemaName);
        tenant.setStatus("PROVISIONING");
        tenant = tenantRepository.save(tenant);

        try {
            // 2. Create schema
            createSchema(schemaName);

            // 3. Run migrations
            runTenantMigrations(schemaName);

            // 4. Seed initial data
            seedTenantData(schemaName, request);

            // 5. Configure Keycloak realm
            keycloakService.createRealm(request.getTenantCode());

            // 6. Activate tenant
            tenant.setStatus("ACTIVE");
            tenant.setActivatedAt(Instant.now());
            tenantRepository.save(tenant);

            return tenant;

        } catch (Exception e) {
            // Rollback on failure
            tenant.setStatus("FAILED");
            tenant.setErrorMessage(e.getMessage());
            tenantRepository.save(tenant);
            throw new TenantOnboardingException("Failed to onboard tenant", e);
        }
    }

    private void createSchema(String schemaName) {
        jdbcTemplate.execute(String.format(
            "CREATE SCHEMA IF NOT EXISTS %s AUTHORIZATION ulms_admin",
            schemaName
        ));
    }

    private void runTenantMigrations(String schemaName) {
        Flyway flyway = Flyway.configure()
            .dataSource(dataSource)
            .locations(
                "classpath:db/tenant-migration",
                "classpath:db/seed"
            )
            .schemas(schemaName)
            .table("flyway_schema_history")
            .baselineOnMigrate(true)
            .placeholders(Map.of("schema_name", schemaName))
            .load();

        flyway.migrate();
    }

    private void seedTenantData(String schemaName, TenantOnboardingRequest request) {
        // Insert tenant-specific configuration
        String sql = String.format("""
            INSERT INTO %s.tenant_settings (key, value)
            VALUES
                ('bank_name', '%s'),
                ('bank_code', '%s'),
                ('default_currency', 'BDT'),
                ('timezone', 'Asia/Dhaka')
            """, schemaName, request.getBankName(), request.getTenantCode());

        jdbcTemplate.execute(sql);
    }
}
```

### 6.3 Initial Tenant Migration Script

```sql
-- V20260101.01__tenant_bootstrap.sql
-- First migration for new tenant schema

-- Set schema
SET search_path TO ${schema_name};

-- ============================================================================
-- Reference Tables (Small, No Partitioning)
-- ============================================================================

-- Classification codes
CREATE TABLE IF NOT EXISTS ref_classification_code (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    dpd_from INTEGER NOT NULL,
    dpd_to INTEGER,
    provision_rate DECIMAL(5,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert BRPD 15/2024 classification codes
INSERT INTO ref_classification_code (code, name, dpd_from, dpd_to, provision_rate) VALUES
    ('STD-0', 'Standard (Current)', 0, 0, 1.00),
    ('STD-1', 'Standard (1-30 days)', 1, 30, 1.00),
    ('STD-2', 'Standard (31-60 days)', 31, 60, 1.00),
    ('SMA', 'Special Mention Account', 61, 90, 5.00),
    ('SS', 'Sub-Standard', 91, 180, 20.00),
    ('DF', 'Doubtful', 181, 365, 50.00),
    ('BL', 'Bad/Loss', 366, NULL, 100.00)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- Core Tables
-- ============================================================================

-- Customer master (see full DDL in Customer Management data model)
CREATE TABLE IF NOT EXISTS m_client (
    id BIGSERIAL PRIMARY KEY,
    -- ... columns from data model
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Loan master (see full DDL in Loan Applications data model)
CREATE TABLE IF NOT EXISTS m_loan (
    id BIGSERIAL PRIMARY KEY,
    -- ... columns from data model
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create all foreign keys
-- ... (from data model documents)

-- Create all indexes
-- ... (from indexing strategy document)

-- Reset search path
RESET search_path;
```

---

## 7. Baseline Strategy

### 7.1 When to Baseline

| Scenario | Baseline Strategy |
|----------|-------------------|
| New database | `baselineOnMigrate=true`, version 0 |
| Existing database | Baseline at current state |
| After data migration | Baseline post-migration |
| Schema consolidation | Baseline after cleanup |

### 7.2 Baseline Command

```bash
# Baseline existing database
flyway -url=jdbc:postgresql://localhost:5432/ulms \
       -user=ulms_admin \
       -schemas=bank_001 \
       -baselineVersion=20260101.00 \
       -baselineDescription="Baseline existing schema" \
       baseline

# Verify baseline
flyway -url=jdbc:postgresql://localhost:5432/ulms \
       -schemas=bank_001 \
       info
```

### 7.3 Baseline Migration Script

```sql
-- V20260101.00__baseline.sql
-- This migration represents the baseline state

-- This file should be empty or contain comments only
-- It marks the baseline version for the schema

/*
 * BASELINE MIGRATION
 *
 * This migration establishes the baseline for the flyway schema history.
 * All existing tables at this point are considered part of the baseline.
 *
 * Baseline Date: 2026-01-01
 * Schema Version: 1.0.0
 *
 * Tables included in baseline:
 * - m_client
 * - m_loan
 * - m_loan_transaction
 * - audit_log
 * - ... (list all tables)
 */

-- No DDL statements - baseline only
SELECT 1;
```

---

## 8. Rollback Strategy

### 8.1 Undo Migrations (Flyway Teams)

```sql
-- U20260205.01__add_kyc_status_column.sql
-- Undo migration for V20260205.01

SET search_path TO ${schema_name};

-- Remove the column added in V20260205.01
ALTER TABLE m_client DROP COLUMN IF EXISTS kyc_status;
ALTER TABLE m_client DROP COLUMN IF EXISTS kyc_verified_at;
ALTER TABLE m_client DROP COLUMN IF EXISTS kyc_verified_by;

-- Remove related index
DROP INDEX IF EXISTS idx_client_kyc_status;

RESET search_path;
```

### 8.2 Manual Rollback Procedure

For Flyway Community Edition (no undo support):

```sql
-- Step 1: Identify the migration to rollback
SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;

-- Step 2: Execute reversal DDL manually
-- (Based on what the migration did)
ALTER TABLE m_client DROP COLUMN IF EXISTS new_column;

-- Step 3: Remove migration record
DELETE FROM flyway_schema_history WHERE version = '20260205.01';

-- Step 4: Verify
SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;
```

### 8.3 Safe Migration Patterns

```sql
-- SAFE: Add column (can be easily dropped)
ALTER TABLE m_client ADD COLUMN IF NOT EXISTS new_field VARCHAR(100);

-- SAFE: Create index concurrently (can be dropped)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_new ON m_client(new_field);

-- DANGEROUS: Drop column (data loss)
-- Never do this in production without backup
-- ALTER TABLE m_client DROP COLUMN important_field;

-- SAFER: Rename column first, drop later
ALTER TABLE m_client RENAME COLUMN old_name TO old_name_deprecated;
-- After verification period:
-- ALTER TABLE m_client DROP COLUMN old_name_deprecated;
```

### 8.4 Point-in-Time Recovery Integration

```sql
-- Before risky migration, create restore point
SELECT pg_create_restore_point('before_migration_20260205');

-- Run migration
-- ...

-- If issues found, restore to point
-- (requires WAL archiving and pg_basebackup)
```

---

## 9. Migration Testing

### 9.1 Test Categories

| Test Type | Purpose | When |
|-----------|---------|------|
| Syntax Validation | SQL is valid | Pre-commit |
| Schema Comparison | Tables match expected | CI pipeline |
| Data Migration | Data transforms correctly | Staging |
| Performance | Migration completes timely | Staging |
| Rollback | Undo works correctly | Staging |

### 9.2 Test Container Setup

```java
package com.ulms.db;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
class FlywayMigrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16.1")
        .withDatabaseName("ulms_test")
        .withUsername("test")
        .withPassword("test");

    private Flyway flyway;

    @BeforeEach
    void setup() {
        flyway = Flyway.configure()
            .dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
            .locations("classpath:db/migration", "classpath:db/tenant-migration")
            .schemas("public", "bank_test")
            .cleanDisabled(false)
            .load();
    }

    @Test
    void shouldRunAllMigrationsSuccessfully() {
        // Clean and migrate
        flyway.clean();
        var result = flyway.migrate();

        // Verify
        assertThat(result.success).isTrue();
        assertThat(result.migrationsExecuted).isGreaterThan(0);
    }

    @Test
    void shouldValidateMigrations() {
        flyway.clean();
        flyway.migrate();

        // Should not throw
        flyway.validate();
    }

    @Test
    void shouldCreateExpectedTables() {
        flyway.clean();
        flyway.migrate();

        // Verify tables exist
        try (var conn = postgres.createConnection("")) {
            var meta = conn.getMetaData();
            var tables = meta.getTables(null, "bank_test", "m_client", null);
            assertThat(tables.next()).isTrue();
        }
    }
}
```

### 9.3 Migration Validation Script

```bash
#!/bin/bash
# scripts/validate-migrations.sh

set -e

echo "=== Flyway Migration Validation ==="

# Start test database
docker-compose -f docker-compose.test.yml up -d postgres

# Wait for database
sleep 5

# Run clean + migrate
flyway -url=jdbc:postgresql://localhost:5433/ulms_test \
       -user=test \
       -password=test \
       -schemas=public,bank_test \
       -cleanDisabled=false \
       clean migrate

# Validate
flyway -url=jdbc:postgresql://localhost:5433/ulms_test \
       -user=test \
       -password=test \
       -schemas=public,bank_test \
       validate

# Get info
flyway -url=jdbc:postgresql://localhost:5433/ulms_test \
       -user=test \
       -password=test \
       -schemas=public,bank_test \
       info

# Cleanup
docker-compose -f docker-compose.test.yml down

echo "=== Validation Complete ==="
```

---

## 10. CI/CD Integration

### 10.1 GitLab CI Pipeline

```yaml
# .gitlab-ci.yml

stages:
  - validate
  - test
  - migrate-staging
  - migrate-production

variables:
  FLYWAY_VERSION: "10.8.1"

# Validate migration syntax
validate-migrations:
  stage: validate
  image: flyway/flyway:${FLYWAY_VERSION}
  script:
    - flyway -url=jdbc:postgresql://postgres:5432/ulms_test
             -user=test
             -password=test
             -schemas=public,bank_test
             -cleanDisabled=false
             clean migrate validate
  services:
    - postgres:16.1
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
      changes:
        - src/main/resources/db/**/*.sql

# Test migrations
test-migrations:
  stage: test
  image: maven:3.9-eclipse-temurin-21
  script:
    - mvn test -Dtest=FlywayMigrationTest
  services:
    - postgres:16.1
  rules:
    - if: '$CI_COMMIT_BRANCH == "develop"'

# Migrate staging
migrate-staging:
  stage: migrate-staging
  image: flyway/flyway:${FLYWAY_VERSION}
  script:
    - flyway -url=$STAGING_DB_URL
             -user=$STAGING_DB_USER
             -password=$STAGING_DB_PASSWORD
             -schemas=public
             info migrate info
    # Migrate all tenants
    - ./scripts/migrate-all-tenants.sh staging
  environment:
    name: staging
  rules:
    - if: '$CI_COMMIT_BRANCH == "develop"'
      when: manual

# Migrate production
migrate-production:
  stage: migrate-production
  image: flyway/flyway:${FLYWAY_VERSION}
  script:
    - flyway -url=$PROD_DB_URL
             -user=$PROD_DB_USER
             -password=$PROD_DB_PASSWORD
             -schemas=public
             info migrate info
    # Migrate all tenants
    - ./scripts/migrate-all-tenants.sh production
  environment:
    name: production
  rules:
    - if: '$CI_COMMIT_TAG =~ /^v\d+\.\d+\.\d+$/'
      when: manual
  allow_failure: false
```

### 10.2 Migration Script for All Tenants

```bash
#!/bin/bash
# scripts/migrate-all-tenants.sh

ENVIRONMENT=$1

# Load environment config
source "./config/${ENVIRONMENT}.env"

echo "=== Migrating all tenants in ${ENVIRONMENT} ==="

# Get list of active tenants
TENANTS=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c \
  "SELECT schema_name FROM public.tenants WHERE status = 'ACTIVE'")

for TENANT in $TENANTS; do
  TENANT=$(echo $TENANT | xargs)  # Trim whitespace

  if [ -n "$TENANT" ]; then
    echo "Migrating tenant: $TENANT"

    flyway -url="jdbc:postgresql://${DB_HOST}:5432/${DB_NAME}" \
           -user=$DB_USER \
           -password=$DB_PASSWORD \
           -schemas=$TENANT \
           -locations="classpath:db/tenant-migration,classpath:db/seed" \
           -placeholders.schema_name=$TENANT \
           info migrate

    if [ $? -eq 0 ]; then
      echo "✓ $TENANT migrated successfully"
    else
      echo "✗ $TENANT migration failed"
      exit 1
    fi
  fi
done

echo "=== All tenants migrated ==="
```

### 10.3 GitHub Actions Workflow

```yaml
# .github/workflows/database-migration.yml

name: Database Migration

on:
  push:
    branches: [main, develop]
    paths:
      - 'src/main/resources/db/**'
  pull_request:
    paths:
      - 'src/main/resources/db/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16.1
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: ulms_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Run Flyway Validate
        uses: docker://flyway/flyway:10.8.1
        with:
          args: >
            -url=jdbc:postgresql://postgres:5432/ulms_test
            -user=test
            -password=test
            -schemas=public,bank_test
            -locations=filesystem:src/main/resources/db/migration,filesystem:src/main/resources/db/tenant-migration
            -cleanDisabled=false
            clean migrate validate

      - name: Migration Info
        uses: docker://flyway/flyway:10.8.1
        with:
          args: >
            -url=jdbc:postgresql://postgres:5432/ulms_test
            -user=test
            -password=test
            -schemas=public,bank_test
            info
```

---

## 11. Security Considerations

### 11.1 Migration Security Rules

| Rule | Implementation |
|------|----------------|
| No credentials in migrations | Use environment variables |
| No destructive operations in prod | `cleanDisabled=true` |
| Audit all changes | Schema history table |
| Review before production | Manual approval gate |
| Limit database permissions | Migration user role |

### 11.2 Database User Permissions

```sql
-- Create migration user with limited permissions
CREATE ROLE flyway_migration LOGIN PASSWORD 'secure_password';

-- Grant schema creation (for tenant onboarding)
GRANT CREATE ON DATABASE ulms TO flyway_migration;

-- Grant usage on existing schemas
GRANT USAGE ON SCHEMA public TO flyway_migration;

-- For tenant schemas (grant per schema)
GRANT ALL ON SCHEMA bank_001 TO flyway_migration;
GRANT ALL ON ALL TABLES IN SCHEMA bank_001 TO flyway_migration;
GRANT ALL ON ALL SEQUENCES IN SCHEMA bank_001 TO flyway_migration;

-- Deny dangerous operations
REVOKE DROP ON DATABASE ulms FROM flyway_migration;
```

### 11.3 Sensitive Data in Migrations

```sql
-- WRONG: Hardcoded credentials
INSERT INTO app_user (username, password) VALUES ('admin', 'password123');

-- CORRECT: Use placeholders or post-migration scripts
INSERT INTO app_user (username, password_hash)
VALUES ('admin', '${ADMIN_PASSWORD_HASH}');

-- Or leave password NULL and set via secure channel
INSERT INTO app_user (username, password_hash, must_change_password)
VALUES ('admin', NULL, TRUE);
```

### 11.4 Migration Audit Log

```sql
-- Create migration audit table
CREATE TABLE IF NOT EXISTS public.migration_audit (
    id BIGSERIAL PRIMARY KEY,
    migration_version VARCHAR(50) NOT NULL,
    migration_description VARCHAR(200),
    schema_name VARCHAR(100) NOT NULL,
    executed_by VARCHAR(100) NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    execution_time_ms INTEGER,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    client_ip INET
);

-- Trigger to log migrations
CREATE OR REPLACE FUNCTION fn_log_migration()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.migration_audit (
        migration_version,
        migration_description,
        schema_name,
        executed_by,
        execution_time_ms,
        success
    ) VALUES (
        NEW.version,
        NEW.description,
        TG_TABLE_SCHEMA,
        NEW.installed_by,
        NEW.execution_time,
        NEW.success
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 12. Compliance Matrix

### 12.1 Technology Stack Compliance

| Requirement | Implementation |
|-------------|----------------|
| Flyway 10.x | Flyway 10.8.1 configured |
| PostgreSQL 16 | Compatible migrations |
| Multi-tenant | Schema-per-tenant strategy |
| CI/CD Integration | GitLab/GitHub pipelines |

### 12.2 Best Practices Compliance

| Practice | Status |
|----------|--------|
| Version control | ✅ All migrations in Git |
| Naming convention | ✅ V{date}.{seq}__{desc}.sql |
| Testing | ✅ Testcontainers integration |
| Rollback strategy | ✅ Undo migrations + procedures |
| Audit trail | ✅ Schema history + audit log |
| Security | ✅ Limited permissions, no credentials |

---

## 13. Appendices

### Appendix A: Common Migration Patterns

```sql
-- Pattern 1: Add nullable column
ALTER TABLE m_client ADD COLUMN IF NOT EXISTS new_field VARCHAR(100);

-- Pattern 2: Add NOT NULL column with default
ALTER TABLE m_client ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL;

-- Pattern 3: Create index concurrently (no locks)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_client_status ON m_client(status);

-- Pattern 4: Rename column
ALTER TABLE m_client RENAME COLUMN old_name TO new_name;

-- Pattern 5: Change column type (careful!)
ALTER TABLE m_client ALTER COLUMN amount TYPE DECIMAL(18,2) USING amount::DECIMAL(18,2);

-- Pattern 6: Add foreign key
ALTER TABLE m_loan ADD CONSTRAINT fk_loan_client
    FOREIGN KEY (client_id) REFERENCES m_client(id);

-- Pattern 7: Create partitioned table
CREATE TABLE m_loan_transaction (
    id BIGSERIAL,
    transaction_date DATE NOT NULL,
    -- columns
    PRIMARY KEY (id, transaction_date)
) PARTITION BY RANGE (transaction_date);
```

### Appendix B: Troubleshooting

| Issue | Solution |
|-------|----------|
| Migration checksum mismatch | Repair: `flyway repair` |
| Out-of-order migration | Enable: `outOfOrder=true` |
| Failed migration | Fix script, then `flyway repair` |
| Schema not found | Check `schemas` configuration |
| Permission denied | Grant permissions to flyway user |

### Appendix C: Flyway Commands Reference

```bash
# Info - show migration status
flyway info

# Validate - check migrations are valid
flyway validate

# Migrate - run pending migrations
flyway migrate

# Clean - drop all objects (disabled in prod)
flyway clean

# Repair - fix schema history
flyway repair

# Baseline - establish baseline version
flyway baseline

# Undo - rollback last migration (Teams only)
flyway undo
```

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Author | System Architect | | |
| Reviewer | Lead Developer | | |
| Approver | Technical Director | | |

---

*This document is part of the ULMS v2.0 Database Architecture documentation series.*

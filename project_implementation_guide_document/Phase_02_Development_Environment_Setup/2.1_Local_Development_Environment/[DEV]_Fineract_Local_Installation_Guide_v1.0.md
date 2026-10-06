**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Fineract Local Installation Guide |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document ID** | 2.1.3 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Backend Lead, ULMS Project |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Approved |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | Backend Lead | Initial version |

---

# Fineract Local Installation Guide
## Apache Fineract 1.10 Community Edition Setup

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Prerequisites](#2-prerequisites)
3. [Installation Methods](#3-installation-methods)
4. [Option 1: Docker Installation (Recommended)](#4-option-1-docker-installation-recommended)
5. [Option 2: Source Code Installation](#5-option-2-source-code-installation)
6. [Database Configuration](#6-database-configuration)
7. [Fineract Configuration](#7-fineract-configuration)
8. [Tenant Setup](#8-tenant-setup)
9. [Verification Steps](#9-verification-steps)
10. [Development Workflow](#10-development-workflow)
11. [Troubleshooting](#11-troubleshooting)
12. [Related Documents](#12-related-documents)

---

## 1. Purpose

This document provides comprehensive instructions for installing and configuring Apache Fineract 1.10 Community Edition for ULMS v2.0 local development. Fineract serves as the core banking platform providing loan management, accounting, and client management capabilities.

---

## 2. Prerequisites

### 2.1 Software Requirements

| Software | Version | Purpose |
|----------|---------|---------|
| Java JDK | Eclipse Temurin 21 | Runtime environment |
| Gradle | 8.5+ | Build tool |
| PostgreSQL | 16+ | Database server |
| Redis | 7+ | Cache server |
| Git | 2.40+ | Source control |
| Docker | 24.0+ | Alternative containerized setup |

### 2.2 Hardware Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 8 GB | 16 GB |
| Free Disk Space | 20 GB | 50 GB |
| CPU Cores | 4 | 6 |

### 2.3 Network Requirements

- Port 8080 available for Fineract API
- Port 8443 available for HTTPS (optional)
- Internet access for Maven/Gradle dependencies

---

## 3. Installation Methods

Two installation methods are supported:

| Method | Setup Time | Best For | Complexity |
|--------|------------|----------|------------|
| Docker | 5 minutes | Quick start, standard development | Low |
| Source Build | 30 minutes | Custom development, debugging | Medium |

---

## 4. Option 1: Docker Installation (Recommended)

### 4.1 Quick Start

```bash
# Clone ULMS repository with Fineract
git clone https://github.com/unisoft/ulms-v2.git
cd ulms-v2

# Start Fineract with Docker
docker-compose -f docker-compose.fineract.yml up -d fineract

# Wait for startup (2-3 minutes)
docker logs -f ulms-fineract
```

### 4.2 Docker Compose Configuration

**File:** `docker-compose.fineract.yml`

```yaml
version: '3.8'

services:
  fineract:
    image: apache/fineract:1.10.0
    container_name: ulms-fineract
    hostname: fineract
    restart: unless-stopped
    environment:
      # Database Configuration
      FINERACT_DATABASE_HOST: postgres
      FINERACT_DATABASE_PORT: 5432
      FINERACT_DATABASE_NAME: fineract_default
      FINERACT_DATABASE_USERNAME: fineract
      FINERACT_DATABASE_PASSWORD: postgres
      
      # Node Configuration
      FINERACT_NODE_ID: 1
      
      # Memory Settings
      FINERACT_MEMORY_OPTS: "-Xmx2g -Xms1g -XX:+UseG1GC"
      
      # Additional JVM Options
      FINERACT_JVM_OPTS: "-Dspring.profiles.active=dev -Djava.awt.headless=true"
      
      # Security (Development only)
      FINERACT_SECURITY_AUTH_BASIC_ENABLED: "true"
      FINERACT_SECURITY_OAUTH_ENABLED: "false"
      
      # Cache Configuration
      FINERACT_CACHE_TYPE: "redis"
      FINERACT_CACHE_HOST: redis
      FINERACT_CACHE_PORT: 6379
      
    ports:
      - "8080:8080"
      - "8443:8443"
    
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    
    networks:
      - ulms-network
    
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/fineract-provider/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 120s

  postgres:
    image: postgres:16-alpine
    container_name: ulms-postgres
    environment:
      POSTGRES_USER: fineract
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: fineract_default
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U fineract -d fineract_default"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ulms-network

  redis:
    image: redis:7-alpine
    container_name: ulms-redis
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ulms-network

volumes:
  postgres_data:

networks:
  ulms-network:
    driver: bridge
```

---

## 5. Option 2: Source Code Installation

### 5.1 Clone Fineract Repository

```bash
# Create development directory
mkdir -p ~/dev/ulms
cd ~/dev/ulms

# Clone Fineract repository
git clone https://github.com/apache/fineract.git
cd fineract

# Checkout specific version
git checkout 1.10.0
```

### 5.2 Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Set environment variables
export JAVA_HOME=/usr/lib/jvm/temurin-21-jdk-amd64
export PATH=$JAVA_HOME/bin:$PATH

# Verify Java version
java -version
# Output: openjdk version "21.0.2" 2024-01-16 LTS
```

### 5.3 Build Fineract

```bash
# Clean build
./gradlew clean

# Build without tests (faster)
./gradlew bootJar -x test

# Full build with tests (slower, ~20 minutes)
./gradlew clean build

# Build output location
ls -la fineract-provider/build/libs/
# Output: fineract-provider-1.10.0.jar
```

### 5.4 Database Setup

```bash
# Ensure PostgreSQL is running
docker ps | grep postgres

# Create Fineract database (if not exists)
docker exec -it ulms-postgres psql -U fineract -c "CREATE DATABASE fineract_default WITH OWNER fineract ENCODING 'UTF8';"
```

### 5.5 Run Fineract

```bash
# Run with Gradle (development)
./gradlew :fineract-provider:bootRun

# Or run built JAR
java -jar fineract-provider/build/libs/fineract-provider-1.10.0.jar \
  --spring.datasource.url=jdbc:postgresql://localhost:5432/fineract_default \
  --spring.datasource.username=fineract \
  --spring.datasource.password=postgres
```

---

## 6. Database Configuration

### 6.1 Fineract Database Schema

```sql
-- Connect to PostgreSQL
docker exec -it ulms-postgres psql -U fineract -d fineract_default

-- Verify schema creation
\dt

-- Key tables in Fineract
-- m_appuser          - Application users
-- m_client           - Client records
-- m_loan             - Loan accounts
-- m_loan_product     - Loan products
-- m_staff            - Staff/employees
-- m_office           - Branch offices
```

### 6.2 Database Migration (Flyway)

Fineract uses Flyway for database migrations:

```bash
# Run migrations manually
./gradlew :fineract-provider:flewMigrate

# Repair migrations (if needed)
./gradlew :fineract-provider:flewRepair
```

Migration scripts location:
```
fineract-provider/src/main/resources/sql/migrations/
├── core_db/
│   ├── V1__initial_schema.sql
│   ├── V2__add_permissions.sql
│   └── ...
└── tenant_db/
    ├── V1__tenant_schema.sql
    └── ...
```

---

## 7. Fineract Configuration

### 7.1 Application Properties

**File:** `fineract-provider/src/main/resources/application-dev.yml`

```yaml
# ==========================================
# Fineract Development Configuration
# ==========================================

spring:
  profiles:
    active: dev
  
  datasource:
    url: jdbc:postgresql://localhost:5432/fineract_default
    username: fineract
    password: postgres
    driver-class-name: org.postgresql.Driver
    hikari:
      minimum-idle: 10
      maximum-pool-size: 30
      idle-timeout: 600000
      max-lifetime: 1800000
      connection-timeout: 30000
  
  jpa:
    hibernate:
      ddl-auto: none
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
        show_sql: false
    open-in-view: false
  
  flyway:
    enabled: true
    locations: classpath:sql/migrations
    baseline-on-migrate: true
  
  cache:
    type: redis
  
  redis:
    host: localhost
    port: 6379
    timeout: 2000ms
    lettuce:
      pool:
        max-active: 8
        max-idle: 8
        min-idle: 0

server:
  port: 8080
  servlet:
    context-path: /fineract-provider
  compression:
    enabled: true

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: always

fineract:
  node-id: 1
  
  security:
    basicauth:
      enabled: true
    oauth:
      enabled: false
  
  tenant:
    host: localhost
    port: 5432
    username: fineract
    password: postgres
    database: fineract_default
  
  # Bangladesh-specific configurations
  currency:
    default: BDT
    digits-after-decimal: 2
  
  locale:
    default: en_BD
```

### 7.2 Logging Configuration

**File:** `fineract-provider/src/main/resources/logback-spring.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <property name="LOGS" value="./logs" />
    
    <appender name="Console" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <appender name="File" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>${LOGS}/fineract.log</file>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>${LOGS}/fineract-%d{yyyy-MM-dd}.log</fileNamePattern>
            <maxHistory>30</maxHistory>
        </rollingPolicy>
    </appender>
    
    <root level="INFO">
        <appender-ref ref="Console" />
        <appender-ref ref="File" />
    </root>
    
    <logger name="org.apache.fineract" level="DEBUG" />
    <logger name="org.springframework.web" level="INFO" />
</configuration>
```

---

## 8. Tenant Setup

### 8.1 Default Tenant Configuration

```bash
# Create default tenant
curl -X POST http://localhost:8080/fineract-provider/api/v1/tenants \
  -u "mifos:password" \
  -H "Content-Type: application/json" \
  -H "Fineract-Platform-TenantId: default" \
  -d '{
    "tenantIdentifier": "default",
    "name": "Default Tenant",
    "description": "Default tenant for ULMS",
    "timezoneId": "Asia/Dhaka",
    "currencyCode": "BDT"
  }'
```

### 8.2 Multi-Tenant Configuration

For Bangladesh banking sector requirements:

```bash
# Create bank-specific tenant
curl -X POST http://localhost:8080/fineract-provider/api/v1/tenants \
  -u "mifos:password" \
  -H "Content-Type: application/json" \
  -H "Fineract-Platform-TenantId: default" \
  -d '{
    "tenantIdentifier": "abcbank",
    "name": "ABC Bank Ltd",
    "description": "ABC Bank Loan Management",
    "timezoneId": "Asia/Dhaka",
    "currencyCode": "BDT",
    "decimalPlaces": 2,
    "locale": "en_BD"
  }'
```

---

## 9. Verification Steps

### 9.1 Health Check

```bash
# Check application health
curl -s http://localhost:8080/fineract-provider/actuator/health | jq

# Expected response:
{
  "status": "UP",
  "components": {
    "db": { "status": "UP" },
    "diskSpace": { "status": "UP" },
    "ping": { "status": "UP" },
    "redis": { "status": "UP" }
  }
}
```

### 9.2 API Test

```bash
# Get authenticated
curl -X POST http://localhost:8080/fineract-provider/api/v1/authentication \
  -H "Content-Type: application/json" \
  -H "Fineract-Platform-TenantId: default" \
  -d '{
    "username": "mifos",
    "password": "password"
  }'

# List loan products
curl -X GET "http://localhost:8080/fineract-provider/api/v1/loanproducts" \
  -H "Fineract-Platform-TenantId: default" \
  -u "mifos:password"
```

### 9.3 Database Verification

```bash
# Check migration status
docker exec -it ulms-postgres psql -U fineract -d fineract_default -c "SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 10;"

# Count key entities
docker exec -it ulms-postgres psql -U fineract -d fineract_default -c "
SELECT 'Users' as entity, count(*) FROM m_appuser
UNION ALL
SELECT 'Offices', count(*) FROM m_office
UNION ALL
SELECT 'Loan Products', count(*) FROM m_product_loan;
"
```

---

## 10. Development Workflow

### 10.1 Common Gradle Tasks

```bash
# Clean build
./gradlew clean

# Build JAR
./gradlew bootJar

# Run tests
./gradlew test

# Run specific test class
./gradlew test --tests "org.apache.fineract.portfolio.loanaccount.domain.LoanTest"

# Generate API documentation
./gradlew asciidoctor

# Check code quality
./gradlew check

# Run in dev mode with hot reload
./gradlew :fineract-provider:bootRun --args='--spring.profiles.active=dev'
```

### 10.2 Debug Configuration

For VS Code (`.vscode/launch.json`):

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "java",
      "name": "Fineract Debug",
      "request": "launch",
      "mainClass": "org.apache.fineract.ServerApplication",
      "projectName": "fineract-provider",
      "env": {
        "spring.profiles.active": "dev"
      },
      "vmArgs": "-Xmx2g -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005"
    }
  ]
}
```

---

## 11. Troubleshooting

### 11.1 Build Failures

**Issue:** `Could not find or load main class org.gradle.wrapper.GradleWrapperMain`

**Solution:**
```bash
# Download wrapper files
curl -L -o gradle/wrapper/gradle-wrapper.jar https://raw.githubusercontent.com/gradle/gradle/v8.5.0/gradle/wrapper/gradle-wrapper.jar
```

**Issue:** `OutOfMemoryError during build`

**Solution:**
```bash
# Increase Gradle heap size
export GRADLE_OPTS="-Xmx4g -XX:MaxMetaspaceSize=512m"
./gradlew clean build
```

### 11.2 Database Connection Errors

**Issue:** `Connection to localhost:5432 refused`

**Solution:**
```bash
# Verify PostgreSQL is running
docker ps | grep postgres

# Check PostgreSQL logs
docker logs ulms-postgres

# Verify database exists
docker exec ulms-postgres psql -U fineract -l
```

### 11.3 Migration Failures

**Issue:** `FlywayException: Validate failed: Migrations have failed validation`

**Solution:**
```bash
# Repair migrations
./gradlew :fineract-provider:flewRepair

# Or manually clean (CAREFUL: data loss)
docker exec ulms-postgres psql -U fineract -d fineract_default -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

---

## 12. Related Documents

| Document ID | Document Name | Description |
|-------------|---------------|-------------|
| 2.1.1 | [Local Development Setup Guide]([DEV]_Local_Development_Setup_Guide_v1.0.md) | Quickstart guide |
| 2.1.2 | [Docker Compose Configuration]([DEV]_Docker_Compose_Configuration_v1.0.md) | Infrastructure setup |
| 2.2.3 | [Fineract Database Setup]([DB]_Fineract_Database_Setup_v1.0.md) | Database configuration |
| 2.4.1 | [Fineract Core Extension Strategy]([FIN]_Fineract_Core_Extension_Strategy_v1.0.md) | Extension approach |
| 2.4.2 | [Fineract Loan Product Configuration]([FIN]_Fineract_Loan_Product_Configuration_v1.0.md) | Loan products setup |

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
*Internal Use Only - ULMS Development Team*

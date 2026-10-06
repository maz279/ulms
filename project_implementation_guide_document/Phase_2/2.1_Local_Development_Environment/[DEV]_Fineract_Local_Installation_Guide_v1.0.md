# Fineract Local Installation Guide
## Apache Fineract 1.10 CE Setup for ULMS v2.0

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Fineract Local Installation Guide |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 8, 2026 |
| **Prepared By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Approved |

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Installation Methods](#2-installation-methods)
3. [Configuration](#3-configuration)
4. [Database Setup](#4-database-setup)
5. [Verification](#5-verification)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Prerequisites

### 1.1 System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Java | Eclipse Temurin 21 | Eclipse Temurin 21 LTS |
| RAM | 4 GB | 8 GB |
| Disk Space | 10 GB | 20 GB |
| Database | PostgreSQL 16 | PostgreSQL 16 |

### 1.2 Required Tools

```bash
# Verify Java installation
java -version
# Expected: openjdk version "21.0.2"

# Verify Gradle (or use wrapper)
./gradlew --version
# Expected: Gradle 8.5
```

---

## 2. Installation Methods

### 2.1 Method 1: Source Build (Recommended)

```bash
# Clone Fineract repository
git clone https://github.com/apache/fineract.git
cd fineract

# Checkout stable version
git checkout 1.10.0

# Build the project
./gradlew clean bootJar

# Run Fineract
./gradlew :fineract-provider:bootRun
```

### 2.2 Method 2: Docker (Quick Start)

```bash
# Using Docker Compose
docker-compose -f docker/fineract-docker.yml up -d

# Or run directly
docker run -p 8443:8443 \
  -e FINERACT_DEFAULT_TENANT=default \
  -e FINERACT_HIKARI_PASSWORD=postgres \
  apache/fineract:1.10.0
```

### 2.3 Method 3: ULMS Custom Build

```bash
# Navigate to ULMS Fineract module
cd backend/fineract

# Build with ULMS customizations
./gradlew clean build -x test

# Run with local configuration
./gradlew :fineract-provider:bootRun \
  -Pfineract.config=file:./fineract-local.properties
```

---

## 3. Configuration

### 3.1 Application Properties

**File:** `fineract-local.properties`

```properties
# ============================================
# Fineract Local Development Configuration
# ============================================

# Server Configuration
server.port=8443
server.servlet.context-path=/fineract-provider

# Database Configuration
fineract.tenants.host=localhost
fineract.tenants.port=5432
fineract.tenants.username=postgres
fineract.tenants.password=postgres
fineract.tenants.schema=fineract_tenants

fineract.tenant.description=Default Tenant
fineract.tenant.identifier=default
fineract.tenant.name=default
fineract.tenant.timezone=Asia/Dhaka

# Connection Pool (HikariCP)
fineract.hikari.minimumIdle=5
fineract.hikari.maximumPoolSize=20
fineract.hikari.idleTimeout=300000
fineract.hikari.connectionTimeout=20000

# Node Configuration
fineract.node.id=1

# Security
fineract.security.basicauth.enabled=true
fineract.security.oauth.enabled=false

# CORS (for local development)
fineract.security.cors.enabled=true
fineract.security.cors.allowed-origins=http://localhost:5173,http://localhost:3000

# Logging
logging.level.org.apache.fineract=DEBUG
logging.level.org.springframework.jdbc=DEBUG

# Scheduled Jobs (disable some for dev)
fineract.scheduled.jobs.enabled=true
fineract.scheduled.jobs.cron.loan-scheduler=0 0 1 * * ?

# Spring Configuration
spring.datasource.hikari.connectionTimeout=30000
spring.datasource.hikari.idleTimeout=600000
spring.datasource.hikari.maxLifetime=1800000
```

### 3.2 Environment Variables

```bash
# .env file
export FINERACT_DEFAULT_TENANT=default
export FINERACT_HIKARI_PASSWORD=postgres
export FINERACT_HIKARI_JDBC_URL=jdbc:postgresql://localhost:5432/fineract_default

# JVM Options
export JAVA_OPTS="-Xmx2g -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
```

### 3.3 Logging Configuration

**File:** `logback-spring.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <logger name="org.apache.fineract" level="DEBUG"/>
    <logger name="org.springframework.jdbc" level="DEBUG"/>
    
    <root level="INFO">
        <appender-ref ref="CONSOLE"/>
    </root>
</configuration>
```

---

## 4. Database Setup

### 4.1 Create Databases

```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create tenant management database
CREATE DATABASE fineract_tenants;

-- Create default tenant database
CREATE DATABASE fineract_default;

-- Create ULMS database
CREATE DATABASE ulms_dev;

-- Create user (optional)
CREATE USER fineract WITH PASSWORD 'fineract';
GRANT ALL PRIVILEGES ON DATABASE fineract_tenants TO fineract;
GRANT ALL PRIVILEGES ON DATABASE fineract_default TO fineract;
GRANT ALL PRIVILEGES ON DATABASE ulms_dev TO fineract;
```

### 4.2 Initialize Tenant Schema

```sql
-- Connect to tenant database
\c fineract_tenants

-- Create tenant schema (Fineract will auto-populate)
-- Initial data will be inserted on first run
```

### 4.3 Flyway Migrations

```bash
# Run migrations manually (if needed)
./gradlew flywayMigrate -Pflyway.url=jdbc:postgresql://localhost:5432/fineract_default
```

---

## 5. Verification

### 5.1 Health Check

```bash
# Check if Fineract is running
curl -s http://localhost:8443/fineract-provider/actuator/health | jq .

# Expected response:
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP"
    },
    "diskSpace": {
      "status": "UP"
    }
  }
}
```

### 5.2 API Test

```bash
# Get authentication token
curl -X POST \
  http://localhost:8443/fineract-provider/api/v1/authentication \
  -H 'Content-Type: application/json' \
  -H 'Fineract-Platform-TenantId: default' \
  -d '{
    "username": "mifos",
    "password": "password"
  }'

# List offices (requires auth)
curl -X GET \
  http://localhost:8443/fineract-provider/api/v1/offices \
  -H 'Fineract-Platform-TenantId: default' \
  -u 'mifos:password'
```

### 5.3 UI Access

Fineract provides a built-in Community App (Angular-based):

```bash
# Access URL
http://localhost:8443/fineract-provider/

# Default credentials
Username: mifos
Password: password
Tenant: default
```

---

## 6. Troubleshooting

### 6.1 Common Issues

#### Port Already in Use
```bash
# Find process using port 8443
sudo lsof -i :8443

# Kill process
sudo kill -9 <PID>
```

#### Database Connection Failed
```bash
# Verify PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U postgres -d fineract_default -c "SELECT 1"
```

#### Out of Memory
```bash
# Increase heap size
export JAVA_OPTS="-Xmx4g -XX:+UseG1GC"
./gradlew :fineract-provider:bootRun
```

#### Gradle Build Fails
```bash
# Clean and rebuild
./gradlew clean build --refresh-dependencies

# Skip tests for faster build
./gradlew clean build -x test
```

### 6.2 Debug Mode

```bash
# Start with remote debugging
./gradlew :fineract-provider:bootRun \
  -PjvmArgs="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005"

# Attach debugger from VS Code or IntelliJ on port 5005
```

### 6.3 Reset Everything

```bash
# Stop Fineract
Ctrl+C

# Drop and recreate databases
dropdb fineract_default
dropdb fineract_tenants
createdb fineract_default
createdb fineract_tenants

# Clean build
./gradlew clean

# Restart
./gradlew :fineract-provider:bootRun
```

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

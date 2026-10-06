# Local Development Setup Guide
## ULMS v2.0 - 5-Minute Quickstart for Development Team

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Local Development Setup Guide |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 8, 2026 |
| **Prepared By** | Technical Lead |
| **Reviewed By** | Development Team |
| **Classification** | Internal |
| **Status** | Approved for Development |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | February 8, 2026 | Technical Lead | Initial version for 3-developer team |

---

## Table of Contents

1. [Quick Start (5 Minutes)](#1-quick-start-5-minutes)
2. [Prerequisites](#2-prerequisites)
3. [Detailed Setup](#3-detailed-setup)
4. [IDE Configuration](#4-ide-configuration)
5. [Verification](#5-verification)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Quick Start (5 Minutes)

### 1.1 One-Command Setup

```bash
# Clone the repository
git clone https://github.com/unisoft/ulms.git
cd ulms

# Run the automated setup script
./scripts/setup-dev-environment.sh
```

### 1.2 Manual Quick Start

```bash
# Step 1: Start infrastructure services
docker-compose -f docker/docker-compose.dev.yml up -d postgres redis kafka

# Step 2: Start Fineract backend
./gradlew :fineract-provider:bootRun

# Step 3: Start frontend (new terminal)
cd frontend/ulms-web
npm install
npm run dev

# Access the application at http://localhost:5173
```

### 1.3 What's Running After Setup

| Service | URL | Credentials |
|---------|-----|-------------|
| ULMS Web App | http://localhost:5173 | - |
| Fineract API | http://localhost:8443/fineract-provider/api/v1 | mifos/password |
| PostgreSQL | localhost:5432 | postgres/postgres |
| Redis | localhost:6379 | - |
| Kafka UI | http://localhost:8080 | - |

---

## 2. Prerequisites

### 2.1 Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **RAM** | 16 GB | 32 GB |
| **CPU** | 4 cores (Intel i5/AMD Ryzen 5) | 8 cores |
| **Storage** | 50 GB SSD | 100 GB SSD |
| **OS** | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

### 2.2 Required Software

| Software | Version | Verification Command |
|----------|---------|---------------------|
| **Java** | Eclipse Temurin 21 LTS | `java -version` |
| **Node.js** | 20.x LTS | `node -v` |
| **npm** | 10.x | `npm -v` |
| **Docker** | 24.x | `docker --version` |
| **Docker Compose** | 2.x | `docker compose version` |
| **Git** | 2.40+ | `git --version` |

### 2.3 Linux (Ubuntu) Setup Commands

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Java 21 (Eclipse Temurin)
wget -O - https://packages.adoptium.net/artifactory/api/gpg/key/public | sudo apt-key add -
echo "deb https://packages.adoptium.net/artifactory/deb $(awk -F= '/^VERSION_CODENAME/{print$2}' /etc/os-release) main" | sudo tee /etc/apt/sources.list.d/adoptium.list
sudo apt update
sudo apt install -y temurin-21-jdk

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install additional tools
sudo apt install -y git curl wget jq make
```

---

## 3. Detailed Setup

### 3.1 Repository Setup

```bash
# Create workspace directory
mkdir -p ~/workspace/unisoft
cd ~/workspace/unisoft

# Clone repository
git clone https://github.com/unisoft/ulms.git
cd ulms

# Initialize git hooks
git config core.hooksPath .githooks
chmod +x .githooks/*
```

### 3.2 Environment Configuration

Create `.env.local` in project root:

```bash
# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=ulms_dev
POSTGRES_USER=ulms_user
POSTGRES_PASSWORD=dev_password_secure

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Fineract Configuration
FINERACT_SERVER_URL=http://localhost:8443
FINERACT_DEFAULT_TENANT=default
FINERACT_USERNAME=mifos
FINERACT_PASSWORD=password

# Security (Development Only)
JWT_SECRET=dev-jwt-secret-change-in-production-32chars
ENCRYPTION_KEY=dev-encryption-key-32-chars-long

# External APIs (Mock endpoints for development)
CIB_API_URL=http://localhost:8081/mock/cib
NID_API_URL=http://localhost:8081/mock/nid
CBS_API_URL=http://localhost:8081/mock/cbs

# Feature Flags
ENABLE_MOCK_SERVICES=true
ENABLE_DEBUG_LOGGING=true
```

### 3.3 Docker Infrastructure

```bash
# Start all infrastructure services
docker-compose -f docker/docker-compose.dev.yml up -d

# Verify services are running
docker-compose -f docker/docker-compose.dev.yml ps

# View logs
docker-compose -f docker/docker-compose.dev.yml logs -f postgres
```

**docker-compose.dev.yml services:**

| Service | Port | Purpose |
|---------|------|---------|
| postgres | 5432 | Primary database |
| redis | 6379 | Cache & sessions |
| kafka | 9092 | Event streaming |
| zookeeper | 2181 | Kafka coordination |
| kafka-ui | 8080 | Kafka management UI |
| mailhog | 8025 | Email testing |

### 3.4 Database Initialization

```bash
# Run database migrations
./gradlew flywayMigrate

# Seed development data
./scripts/seed-dev-data.sh
```

### 3.5 Fineract Backend Setup

```bash
# Build Fineract
./gradlew clean build -x test

# Start Fineract (Terminal 1)
./gradlew :fineract-provider:bootRun \
  -Pfineract.config=file:./fineract-local.properties

# Or with custom JVM options
export JAVA_OPTS="-Xmx2g -XX:+UseG1GC"
./gradlew :fineract-provider:bootRun
```

### 3.6 Frontend Setup

```bash
cd frontend/ulms-web

# Install dependencies
npm ci

# Start development server
npm run dev

# Or with specific port
npm run dev -- --port 5173
```

---

## 4. IDE Configuration

### 4.1 VS Code Setup

Install required extensions:

```bash
code --install-extension vscjava.vscode-java-pack
code --install-extension vmware.vscode-boot-dev-pack
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension streetsidesoftware.code-spell-checker
```

Create `.vscode/settings.json`:

```json
{
  "java.configuration.updateBuildConfiguration": "automatic",
  "java.format.settings.url": "https://raw.githubusercontent.com/google/styleguide/gh-pages/eclipse-java-google-style.xml",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "eslint.format.enable": true,
  "prettier.requireConfig": true,
  "files.exclude": {
    "**/node_modules": true,
    "**/.gradle": true,
    "**/build": true,
    "**/dist": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/.gradle": true,
    "**/build": true
  },
  "java.compile.nullAnalysis.mode": "automatic"
}
```

### 4.2 VS Code Launch Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "java",
      "name": "Debug Fineract",
      "request": "attach",
      "hostName": "localhost",
      "port": 5005
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Frontend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "${workspaceFolder}/frontend/ulms-web",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

---

## 5. Verification

### 5.1 Health Check Script

Run the verification script:

```bash
./scripts/verify-dev-environment.sh
```

Expected output:
```
✓ Java 21 is installed (openjdk version "21.0.2")
✓ Node.js 20 is installed (v20.11.0)
✓ Docker is running
✓ PostgreSQL is accessible on port 5432
✓ Redis is accessible on port 6379
✓ Fineract is responding on port 8443
✓ Frontend dev server is running on port 5173
✓ All checks passed! Development environment is ready.
```

### 5.2 Manual Verification Steps

```bash
# 1. Check Java version
java -version

# 2. Check Node.js version
node -v

# 3. Verify Docker
docker ps

# 4. Test PostgreSQL connection
psql -h localhost -U ulms_user -d ulms_dev -c "SELECT version();"

# 5. Test Redis connection
redis-cli ping

# 6. Test Fineract API
curl -s http://localhost:8443/fineract-provider/api/v1/offices | jq .

# 7. Test Frontend
curl -s http://localhost:5173 | head
```

### 5.3 First Login

1. Open http://localhost:5173
2. Login with default credentials:
   - Username: `mifos`
   - Password: `password`
3. Change password on first login

---

## 6. Troubleshooting

### 6.1 Common Issues

#### Issue: Port already in use
```bash
# Find process using port 5432
sudo lsof -i :5432

# Kill process or change port in docker-compose.dev.yml
```

#### Issue: Gradle build fails
```bash
# Clean and rebuild
./gradlew clean build --refresh-dependencies

# Or skip tests for faster build
./gradlew clean build -x test
```

#### Issue: npm install fails
```bash
# Clear npm cache
npm cache clean --force

# Use npm ci for clean install
rm -rf node_modules package-lock.json
npm ci
```

#### Issue: Database connection refused
```bash
# Restart PostgreSQL container
docker-compose -f docker/docker-compose.dev.yml restart postgres

# Check logs
docker-compose -f docker/docker-compose.dev.yml logs postgres
```

### 6.2 Performance Optimization

```bash
# Increase Gradle memory
export GRADLE_OPTS="-Xmx4g -XX:MaxMetaspaceSize=512m"

# Enable Gradle daemon
./gradlew --daemon

# Parallel builds
./gradlew build --parallel
```

### 6.3 Reset Development Environment

```bash
# Complete reset script
./scripts/reset-dev-environment.sh

# Manual reset steps:
# 1. Stop all services
docker-compose -f docker/docker-compose.dev.yml down -v

# 2. Clean build directories
./gradlew clean
rm -rf frontend/ulms-web/node_modules
rm -rf frontend/ulms-web/dist

# 3. Start fresh
docker-compose -f docker/docker-compose.dev.yml up -d
./gradlew bootRun
```

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

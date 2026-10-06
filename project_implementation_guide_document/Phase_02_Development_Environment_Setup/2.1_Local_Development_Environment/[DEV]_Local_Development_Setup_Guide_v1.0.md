**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Local Development Setup Guide |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document ID** | 2.1.1 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Technical Lead, ULMS Project |
| **Reviewed By** | Development Team |
| **Classification** | Internal |
| **Status** | Approved |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | Technical Lead | Initial version |

---

# Local Development Setup Guide
## 5-Minute Quickstart for ULMS Developers

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Prerequisites](#2-prerequisites)
3. [Quick Start (5 Minutes)](#3-quick-start-5-minutes)
4. [Detailed Setup Instructions](#4-detailed-setup-instructions)
5. [Repository Structure](#5-repository-structure)
6. [Verification Steps](#6-verification-steps)
7. [IDE Configuration](#7-ide-configuration)
8. [Troubleshooting](#8-troubleshooting)
9. [Related Documents](#9-related-documents)

---

## 1. Purpose

This document provides a streamlined setup guide for developers joining the ULMS v2.0 project. Following this guide, developers MUST be able to set up a fully functional local development environment within 5 minutes using Docker Compose automation.

### Target Audience
- Backend Developers (Java/Spring Boot)
- Frontend Developers (React/TypeScript)
- Full-Stack Developers
- DevOps Engineers

---

## 2. Prerequisites

### 2.1 Required Software

| Software | Minimum Version | Recommended Version | Purpose |
|----------|-----------------|---------------------|---------|
| Docker Desktop | 4.25.0 | 4.27.0+ | Containerization |
| Docker Compose | 2.23.0 | 2.24.0+ | Multi-container orchestration |
| Git | 2.40.0 | 2.43.0+ | Version control |
| VS Code | 1.85.0 | 1.86.0+ | IDE |
| Node.js | 18.19.0 LTS | 20.11.0 LTS | Frontend build |
| Java JDK | Eclipse Temurin 21 | Eclipse Temurin 21.0.2 | Backend runtime |
| Gradle | 8.5 | 8.6 | Java build tool |

### 2.2 System Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 16 GB | 32 GB |
| CPU Cores | 4 | 8 |
| Free Disk Space | 50 GB | 100 GB |
| OS | Windows 10/11, macOS 12+, Ubuntu 22.04+ | Windows 11, macOS 14+, Ubuntu 22.04+ |

### 2.3 Network Requirements

- Internet access for Docker image pulls
- Access to GitHub repository (https://github.com/unisoft/ulms-v2)
- Ports 80, 443, 8080-8090, 5432, 6379, 9200 available locally

---

## 3. Quick Start (5 Minutes)

### 3.1 One-Command Setup

```bash
# Clone the repository
git clone https://github.com/unisoft/ulms-v2.git
cd ulms-v2

# Run the automated setup script
./scripts/dev-setup.sh
```

### 3.2 Manual Quick Setup

If the automated script is unavailable, follow these steps:

```bash
# Step 1: Clone repository (30 seconds)
git clone https://github.com/unisoft/ulms-v2.git
cd ulms-v2

# Step 2: Copy environment template (10 seconds)
cp .env.example .env

# Step 3: Start infrastructure services (3 minutes)
docker-compose -f docker-compose.dev.yml up -d postgres redis kafka

# Step 4: Verify services (30 seconds)
docker-compose ps

# Step 5: Start Fineract backend (builds on first run, 4-5 minutes)
./gradlew bootRun --args='--spring.profiles.active=dev'

# Step 6: Start frontend (in new terminal, 1 minute)
cd ulms-frontend
npm install
npm run dev
```

### 3.3 Access Points After Setup

| Service | URL | Credentials |
|---------|-----|-------------|
| ULMS Frontend | http://localhost:5173 | - |
| Fineract API | http://localhost:8080/fineract-provider/api/v1 | mifos/password |
| PostgreSQL | localhost:5432 | fineract/postgres |
| Redis | localhost:6379 | - (no auth in dev) |
| Kafka UI | http://localhost:8081 | - |

---

## 4. Detailed Setup Instructions

### 4.1 Step 1: Install Prerequisites

#### Windows (PowerShell as Administrator)

```powershell
# Install Chocolatey if not present
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install required packages
choco install -y docker-desktop git vscode temurin21gradle nodejs-lts

# Verify installations
docker --version
git --version
java --version
node --version
gradle --version
```

#### macOS (Homebrew)

```bash
# Install Homebrew if not present
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required packages
brew install --cask docker
brew install git node@20
brew install --cask visual-studio-code
brew install --cask temurin@21
brew install gradle

# Start Docker
open -a Docker
```

#### Ubuntu/Debian

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install prerequisites
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Install Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Install other tools
sudo apt install -y git

# Install Eclipse Temurin 21
wget -O - https://packages.adoptium.net/artifactory/api/gpg/key/public | sudo tee /usr/share/keyrings/adoptium.asc
echo "deb [signed-by=/usr/share/keyrings/adoptium.asc] https://packages.adoptium.net/artifactory/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/adoptium.list
sudo apt update
sudo apt install -y temurin-21-jdk

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### 4.2 Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your settings
# Required variables:
# - DATABASE_URL
# - REDIS_URL
# - KAFKA_BOOTSTRAP_SERVERS
# - CIB_API_CREDENTIALS (for testing)
```

### 4.3 Step 3: Start Development Environment

```bash
# Start all infrastructure services
docker-compose -f docker-compose.dev.yml up -d

# Or start individual services
docker-compose -f docker-compose.dev.yml up -d postgres
docker-compose -f docker-compose.dev.yml up -d redis
docker-compose -f docker-compose.dev.yml up -d kafka
```

---

## 5. Repository Structure

```
ulms-v2/
├── fineract/                    # Apache Fineract backend
│   ├── fineract-provider/       # Core Fineract module
│   ├── fineract-cn/             # Microservices modules
│   └── docker/                  # Docker configurations
├── ulms-frontend/               # React frontend application
│   ├── src/
│   ├── public/
│   └── package.json
├── ulms-mobile/                 # React Native mobile app
├── ulms-microservices/          # Custom microservices
│   ├── cib-service/             # CIB integration
│   ├── workflow-service/        # Camunda workflows
│   └── notification-service/    # SMS/Email notifications
├── docker-compose.dev.yml       # Development orchestration
├── docker-compose.prod.yml      # Production orchestration
├── .env.example                 # Environment template
└── scripts/                     # Helper scripts
    ├── dev-setup.sh
    ├── db-seed.sh
    └── test-run.sh
```

---

## 6. Verification Steps

### 6.1 Verify Infrastructure Services

```bash
# Check running containers
docker-compose ps

# Expected output:
# NAME                STATUS
# ulms-postgres       Up 2 minutes
# ulms-redis          Up 2 minutes
# ulms-kafka          Up 2 minutes
# ulms-zookeeper      Up 2 minutes
```

### 6.2 Verify Database Connection

```bash
# Test PostgreSQL connection
docker exec -it ulms-postgres psql -U fineract -d fineract_default -c "SELECT version();"

# Expected output: PostgreSQL 16.x version information
```

### 6.3 Verify Fineract Backend

```bash
# Check if Fineract is running
curl -s http://localhost:8080/fineract-provider/actuator/health | jq

# Expected output:
{
  "status": "UP",
  "components": {
    "db": { "status": "UP" },
    "diskSpace": { "status": "UP" }
  }
}
```

### 6.4 Verify Frontend

```bash
# Check if dev server is running
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173

# Expected output: 200
```

---

## 7. IDE Configuration

### 7.1 VS Code Extensions (Required)

Install these extensions for optimal development experience:

```bash
code --install-extension vscjava.vscode-java-pack
code --install-extension pivotal.vscode-spring-boot
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension yzhang.markdown-all-in-one
code --install-extension bierner.markdown-mermaid
code --install-extension ms-azuretools.vscode-docker
```

### 7.2 VS Code Settings

Add to `.vscode/settings.json`:

```json
{
  "java.configuration.runtimes": [
    {
      "name": "JavaSE-21",
      "path": "/usr/lib/jvm/temurin-21-jdk-amd64",
      "default": true
    }
  ],
  "java.format.settings.url": "https://raw.githubusercontent.com/google/styleguide/gh-pages/eclipse-java-google-style.xml",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "files.exclude": {
    "**/build": true,
    "**/target": true,
    "**/node_modules": true
  }
}
```

### 7.3 IntelliJ IDEA Configuration

For developers preferring IntelliJ IDEA:

1. Import project from `build.gradle` or `pom.xml`
2. Set Project SDK to Eclipse Temurin 21
3. Enable annotation processing for Lombok
4. Install plugins: .env files support, Rainbow Brackets, String Manipulation

---

## 8. Troubleshooting

### 8.1 Common Issues

#### Issue: Docker daemon not running

**Symptom:** `Cannot connect to the Docker daemon`

**Solution:**
```bash
# Windows
# Start Docker Desktop from Start Menu

# macOS
open -a Docker

# Linux
sudo systemctl start docker
```

#### Issue: Port already in use

**Symptom:** `bind: address already in use`

**Solution:**
```bash
# Find process using port 8080
sudo lsof -i :8080

# Kill process or change port in docker-compose.dev.yml
```

#### Issue: Java version mismatch

**Symptom:** `Could not target platform: 'Java SE 21'`

**Solution:**
```bash
# Verify Java version
java -version

# Set JAVA_HOME (Linux/macOS)
export JAVA_HOME=/usr/lib/jvm/temurin-21-jdk-amd64
export PATH=$JAVA_HOME/bin:$PATH

# Set JAVA_HOME (Windows PowerShell)
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
```

#### Issue: Gradle build fails

**Symptom:** Build fails with dependency resolution errors

**Solution:**
```bash
# Clear Gradle cache
./gradlew clean
rm -rf ~/.gradle/caches

# Rebuild
./gradlew build --refresh-dependencies
```

#### Issue: Frontend npm install fails

**Symptom:** `ERESOLVE unable to resolve dependency tree`

**Solution:**
```bash
# Clear npm cache and node_modules
cd ulms-frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### 8.2 Performance Optimization

#### Docker Resource Allocation

Docker Desktop recommended settings:
- CPUs: 4 (or 50% of available cores)
- Memory: 8 GB minimum, 12 GB recommended
- Swap: 1 GB
- Disk image size: 64 GB

#### Gradle Build Optimization

Add to `~/.gradle/gradle.properties`:

```properties
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=512m
org.gradle.parallel=true
org.gradle.caching=true
org.gradle.configureondemand=true
```

---

## 9. Related Documents

| Document ID | Document Name | Description |
|-------------|---------------|-------------|
| 2.1.2 | [Docker Compose Configuration]([DEV]_Docker_Compose_Configuration_v1.0.md) | Infrastructure services setup |
| 2.1.3 | [Fineract Local Installation Guide]([DEV]_Fineract_Local_Installation_Guide_v1.0.md) | Apache Fineract local setup |
| 2.1.4 | [Frontend Development Setup]([DEV]_Frontend_Development_Setup_v1.0.md) | Vite + HMR setup |
| 2.1.5 | [Environment Variables Management]([DEV]_Environment_Variables_Management_v1.0.md) | Environment configuration |
| 2.2.1 | [PostgreSQL Installation]([DB]_PostgreSQL_16_Installation_Configuration_v1.0.md) | Database installation guide |
| 2.3.1 | [Test Environment Setup]([TEST]_Test_Environment_Setup_Guide_v1.0.md) | Testing environment |

---

## Support Contacts

| Issue Type | Contact | Response Time |
|------------|---------|---------------|
| Setup Issues | Tech Lead | Same day |
| Docker Issues | DevOps Team | 4 hours |
| Fineract Issues | Backend Lead | Same day |
| Frontend Issues | Frontend Lead | Same day |

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
*Internal Use Only - ULMS Development Team*

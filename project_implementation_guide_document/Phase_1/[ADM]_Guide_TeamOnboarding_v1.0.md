# Team Onboarding Guide
## Unisoft Loan Management System (ULMS) v2.0

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Team Onboarding Guide - ULMS v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 3, 2026 |
| **Prepared By** | Technical Lead |
| **Reviewed By** | Project Manager |
| **Classification** | Confidential - Internal Use |
| **Status** | Approved |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Linux Development Environment Setup](#3-linux-development-environment-setup)
4. [VS Code Configuration](#4-vs-code-configuration)
5. [Backend Setup (Java/Spring Boot)](#5-backend-setup-javaspring-boot)
6. [Frontend Setup (React/Vite)](#6-frontend-setup-reactvite)
7. [Database Setup (PostgreSQL)](#7-database-setup-postgresql)
8. [Apache Fineract Setup](#8-apache-fineract-setup)
9. [Docker & DevOps Tools](#9-docker--devops-tools)
10. [Verification Checklist](#10-verification-checklist)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Overview

This guide provides step-by-step instructions for setting up the development environment for ULMS v2.0. All developers are expected to complete this setup within the first 2 days of joining the project.

### Development Stack Summary

| Component | Version | Purpose |
|-----------|---------|---------|
| OS | Ubuntu 22.04 LTS | Development environment |
| Java | Eclipse Temurin 21 | Backend development |
| Node.js | 20.x LTS | Frontend tooling |
| PostgreSQL | 16.1 | Database |
| Redis | 7.2 | Caching |
| Docker | 24.x | Containerization |
| VS Code | Latest | IDE |

---

## 2. Prerequisites

### Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 4 cores | 8 cores |
| RAM | 16 GB | 32 GB |
| Storage | 256 GB SSD | 512 GB SSD |
| Internet | 10 Mbps | 50 Mbps |

### Account Requirements

Before starting, ensure you have:
- [ ] GitLab account with project access
- [ ] Slack workspace invitation
- [ ] Confluence access
- [ ] Jira access
- [ ] Docker Hub account

---

## 3. Linux Development Environment Setup

### 3.1 Install Ubuntu 22.04 LTS

Option 1: Native Installation (Recommended)
- Download from: https://ubuntu.com/download/desktop
- Create bootable USB
- Follow installation wizard

Option 2: Windows Subsystem for Linux (WSL2)
```powershell
# Run in PowerShell as Administrator
wsl --install -d Ubuntu-22.04
wsl --set-default-version 2
```

Option 3: Virtual Machine
- VMware Workstation or VirtualBox
- Allocate: 8GB RAM, 4 vCPUs, 100GB disk

### 3.2 Initial System Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    net-tools \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# Set Git configuration
git config --global user.name "Your Name"
git config --global user.email "your.email@uslbd.com"
git config --global init.defaultBranch main
```

### 3.3 Install SDKMAN (Java Version Manager)

```bash
# Install SDKMAN
curl -s "https://get.sdkman.io" | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"

# Verify installation
sdk version
```

---

## 4. VS Code Configuration

### 4.1 Install VS Code

```bash
# Download and install VS Code
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
sudo install -D -o root -g root -m 644 packages.microsoft.gpg /etc/apt/keyrings/packages.microsoft.gpg
sudo sh -c 'echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/keyrings/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list'
rm -f packages.microsoft.gpg

sudo apt update
sudo apt install -y code
```

### 4.2 Required Extensions

Install the following VS Code extensions:

**Java Development**
- Extension Pack for Java (Microsoft)
- Spring Boot Extension Pack (VMware)
- Gradle for Java
- Java Extension Pack

**Frontend Development**
- ESLint (Microsoft)
- Prettier - Code: formatter
- TypeScript Importer
- React Native Tools
- Tailwind CSS IntelliSense

**Tools & Utilities**
- Docker (Microsoft)
- REST Client (Huachao Mao)
- YAML (Red Hat)
- Markdown All in One
- GitLens - Git supercharged
- Thunder Client (API testing)

**Installation via CLI:**
```bash
# Java extensions
code --install-extension vscjava.vscode-java-pack
code --install-extension vmware.vscode-spring-boot
code --install-extension vscjava.vscode-gradle

# Frontend extensions
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-typescript-next

# Tools
code --install-extension ms-azuretools.vscode-docker
code --install-extension humao.rest-client
code --install-extension redhat.vscode-yaml
code --install-extension eamodio.gitlens
```

### 4.3 VS Code Settings

Create `.vscode/settings.json` in your workspace:

```json
{
  // Editor
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "editor.rulers": [80, 120],
  "editor.tabSize": 2,
  
  // Java
  "java.home": "/home/user/.sdkman/candidates/java/current",
  "java.format.settings.url": "https://raw.githubusercontent.com/google/styleguide/gh-pages/eclipse-java-google-style.xml",
  "java.compile.nullAnalysis.mode": "automatic",
  
  // TypeScript/JavaScript
  "typescript.preferences.importModuleSpecifier": "relative",
  "javascript.preferences.importModuleSpecifier": "relative",
  
  // Files
  "files.exclude": {
    "**/node_modules": true,
    "**/.git": true,
    "**/dist": true,
    "**/build": true,
    "**/.gradle": true
  },
  
  // Terminal
  "terminal.integrated.defaultProfile.linux": "bash",
  
  // REST Client
  "rest-client.defaultHeaders": {
    "Content-Type": "application/json"
  }
}
```

### 4.4 VS Code Launch Configurations

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Fineract Server",
      "type": "java",
      "request": "launch",
      "mainClass": "org.apache.fineract.ServerApplication",
      "projectName": "fineract-provider",
      "env": {
        "FINERACT_NODE_ID": "1",
        "FINERACT_DB_HOST": "localhost",
        "FINERACT_DB_PORT": "5432"
      }
    },
    {
      "name": "ULMS Backend Service",
      "type": "java",
      "request": "launch",
      "mainClass": "com.unisoft.ulms.UlmsApplication",
      "projectName": "ulms-backend"
    },
    {
      "name": "Chrome Debug",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/ulms-frontend/src"
    }
  ]
}
```

---

## 5. Backend Setup (Java/Spring Boot)

### 5.1 Install Java 21

```bash
# Install Java 21 via SDKMAN
sdk install java 21.0.2-tem
sdk default java 21.0.2-tem

# Verify installation
java -version
javac -version
```

Expected output:
```
openjdk version "21.0.2" 2024-01-16 LTS
OpenJDK Runtime Environment Temurin-21.0.2+13
```

### 5.2 Install Maven and Gradle

```bash
# Install Maven
sdk install maven 3.9.6
sdk default maven 3.9.6

# Install Gradle
sdk install gradle 8.5
sdk default gradle 8.5

# Verify
mvn -v
gradle -v
```

### 5.3 Clone ULMS Backend Repository

```bash
# Create workspace directory
mkdir -p ~/workspace/unisoft
cd ~/workspace/unisoft

# Clone repositories
git clone https://gitlab.uslbd.com/unisoft/ulms-backend.git
git clone https://gitlab.uslbd.com/unisoft/ulms-fineract.git

# Or clone from GitHub mirrors if needed
git clone https://github.com/apache/fineract.git ulms-fineract
```

### 5.4 Build Apache Fineract

```bash
cd ~/workspace/unisoft/ulms-fineract

# Build Fineract (first build takes ~10-15 minutes)
./gradlew clean build -x test

# Create Docker image (optional)
./gradlew jibDockerBuild
```

### 5.5 Backend Environment Configuration

Create `application-local.yml` for local development:

```yaml
# src/main/resources/application-local.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/ulms_dev
    username: ulms_user
    password: ulms_password
    driver-class-name: org.postgresql.Driver
  
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
  
  redis:
    host: localhost
    port: 6379
    password: 
  
  kafka:
    bootstrap-servers: localhost:9092

# Logging
logging:
  level:
    com.unisoft.ulms: DEBUG
    org.springframework.web: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"

# Custom properties
ulms:
  cib:
    api-url: https://sandbox.cib.bb.org.bd/api/v1
    timeout-seconds: 120
  nid:
    api-url: https://sandbox.nidw.gov.bd/api
    timeout-seconds: 30
  document:
    storage-path: /tmp/ulms/documents
```

---

## 6. Frontend Setup (React/Vite)

### 6.1 Install Node.js 20.x LTS

```bash
# Install Node Version Manager (NVM)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

# Install Node.js 20.x
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node -v  # Should show v20.x.x
npm -v   # Should show 10.x.x
```

### 6.2 Install Yarn (Optional but Recommended)

```bash
# Install Yarn via npm
npm install -g yarn

# Verify
yarn -v
```

### 6.3 Clone Frontend Repository

```bash
cd ~/workspace/unisoft
git clone https://gitlab.uslbd.com/unisoft/ulms-frontend.git
cd ulms-frontend
```

### 6.4 Install Dependencies

```bash
# Using npm
npm install

# Or using yarn
yarn install
```

### 6.5 Configure Environment Variables

Create `.env.local` file:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8443/fineract-provider/api/v1
VITE_ULMS_API_URL=http://localhost:8080/api/v1
VITE_AUTH_URL=http://localhost:8080/auth

# Feature Flags
VITE_ENABLE_MOCK_API=false
VITE_ENABLE_DEBUG_LOGGING=true

# App Configuration
VITE_APP_NAME=ULMS
VITE_DEFAULT_LANGUAGE=bn
VITE_DATE_FORMAT=DD/MM/YYYY

# CIB Integration (Sandbox)
VITE_CIB_ENABLED=true
VITE_CIB_SANDBOX=true
```

### 6.6 Vite Configuration

Review `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
  server: {
    port: 5173,
    open: true,
    cors: true,
    hmr: {
      overlay: true,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8443',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@mui/material', '@mui/icons-material', '@emotion/react'],
          charts: ['recharts'],
        },
      },
    },
  },
});
```

### 6.7 Start Development Server

```bash
# Start Vite dev server with HMR
npm run dev

# Or with yarn
yarn dev
```

Expected output:
```
  VITE v5.0.0  ready in 245 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
  ➜  press h + enter to show help
```

Access the application at http://localhost:5173/

---

## 7. Database Setup (PostgreSQL)

### 7.1 Install PostgreSQL 16

```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update

# Install PostgreSQL 16
sudo apt install -y postgresql-16 postgresql-client-16 postgresql-contrib-16

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify
psql --version
```

### 7.2 Create ULMS Database

```bash
# Switch to postgres user
sudo -u postgres psql

-- Create database and user
CREATE DATABASE ulms_dev;
CREATE DATABASE ulms_test;
CREATE USER ulms_user WITH ENCRYPTED PASSWORD 'ulms_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ulms_dev TO ulms_user;
GRANT ALL PRIVILEGES ON DATABASE ulms_test TO ulms_user;

-- Exit
\q
```

### 7.3 Configure PostgreSQL

Edit `/etc/postgresql/16/main/postgresql.conf`:

```conf
# Connection settings
listen_addresses = 'localhost'
port = 5432
max_connections = 100

# Memory settings (adjust based on your RAM)
shared_buffers = 256MB
effective_cache_size = 768MB
work_mem = 4MB
maintenance_work_mem = 64MB

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_statement = 'all'
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

### 7.4 Test Database Connection

```bash
# Test connection
psql -h localhost -U ulms_user -d ulms_dev -c "SELECT version();"

# Expected output:
# PostgreSQL 16.x on x86_64-pc-linux-gnu...
```

### 7.5 Install Redis

```bash
# Install Redis
sudo apt install -y redis-server

# Configure Redis
sudo systemctl start redis
sudo systemctl enable redis

# Verify
redis-cli ping
# Expected: PONG
```

---

## 8. Apache Fineract Setup

### 8.1 Database Setup for Fineract

```bash
# Create Fineract database
sudo -u postgres psql << EOF
CREATE DATABASE fineract_default;
CREATE USER fineract WITH ENCRYPTED PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE fineract_default TO fineract;
ALTER DATABASE fineract_default OWNER TO fineract;
EOF
```

### 8.2 Fineract Configuration

Create `fineract-local.properties`:

```properties
# Database
fineract.db.host=localhost
fineract.db.port=5432
fineract.db.name=fineract_default
fineract.db.username=fineract
fineract.db.password=password

# Server
server.port=8443
server.servlet.context-path=/fineract-provider

# Security
fineract.security.basicauth.enabled=true
fineract.security.oauth.enabled=false

# Tenant
fineract.tenant.default=default
```

### 8.3 Run Fineract Locally

```bash
cd ~/workspace/unisoft/ulms-fineract

# Run with Gradle
./gradlew bootRun

# Or run JAR
java -jar fineract-provider/build/libs/*.jar \
  --spring.profiles.active=local
```

### 8.4 Verify Fineract API

```bash
# Test API endpoint
curl -X GET \
  http://localhost:8443/fineract-provider/api/v1/offices \
  -u 'mifos:password'

# Expected: JSON array of offices
```

---

## 9. Docker & DevOps Tools

### 9.1 Install Docker

```bash
# Remove old versions
sudo apt remove docker docker-engine docker.io containerd runc

# Install Docker
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release

sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker compose version
```

### 9.2 Install kubectl

```bash
# Install kubectl
curl -LO "https://dl.k8s/release/$(curl -L -s https://dl.k8s/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Verify
kubectl version --client
```

### 9.3 Install Helm

```bash
# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Verify
helm version
```

### 9.4 Docker Compose for Local Development

Create `docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: ulms-postgres
    environment:
      POSTGRES_USER: ulms_user
      POSTGRES_PASSWORD: ulms_password
      POSTGRES_DB: ulms_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ulms_user"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: ulms-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  kafka:
    image: confluentinc/cp-kafka:latest
    container_name: ulms-kafka
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    depends_on:
      - zookeeper

  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    container_name: ulms-zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

volumes:
  postgres_data:
  redis_data:
```

Run infrastructure services:
```bash
docker compose -f docker-compose.dev.yml up -d
```

---

## 10. Verification Checklist

### Environment Verification

Run the following verification script:

```bash
#!/bin/bash
# save as: verify-env.sh

echo "=== ULMS Development Environment Verification ==="
echo ""

# Java
echo -n "Java 21: "
java -version 2>&1 | head -n 1

# Maven
echo -n "Maven: "
mvn -v | head -n 1

# Gradle
echo -n "Gradle: "
gradle -v | head -n 2 | tail -n 1

# Node.js
echo -n "Node.js: "
node -v

# npm
echo -n "npm: "
npm -v

# PostgreSQL
echo -n "PostgreSQL: "
psql --version

# Redis
echo -n "Redis: "
redis-cli --version

# Docker
echo -n "Docker: "
docker --version

# Docker Compose
echo -n "Docker Compose: "
docker compose version

# Git
echo -n "Git: "
git --version

echo ""
echo "=== Checking Services ==="

# PostgreSQL
echo -n "PostgreSQL connection: "
pg_isready -h localhost -p 5432 2>/dev/null && echo "OK" || echo "NOT RUNNING"

# Redis
echo -n "Redis connection: "
redis-cli ping 2>/dev/null && echo "OK" || echo "NOT RUNNING"

echo ""
echo "=== Environment Variables ==="
echo "JAVA_HOME: $JAVA_HOME"
echo "M2_HOME: $M2_HOME"
echo ""
echo "Verification Complete!"
```

Run:
```bash
chmod +x verify-env.sh
./verify-env.sh
```

### Expected Output

```
=== ULMS Development Environment Verification ===

Java 21: openjdk version "21.0.2" 2024-01-16 LTS
Maven: Apache Maven 3.9.6
Gradle: Gradle 8.5
Node.js: v20.11.0
npm: 10.2.4
PostgreSQL: psql (PostgreSQL) 16.1
Redis: redis-cli 7.2.4
Docker: Docker version 24.0.7
Docker Compose: Docker Compose version v2.23.0
Git: git version 2.43.0

=== Checking Services ===
PostgreSQL connection: OK
Redis connection: PONG

=== Environment Variables ===
JAVA_HOME: /home/user/.sdkman/candidates/java/current
M2_HOME: /home/user/.sdkman/candidates/maven/current

Verification Complete!
```

### Quick Integration Test

```bash
# Start all services
docker compose -f docker-compose.dev.yml up -d

# Build and run backend
cd ~/workspace/unisoft/ulms-backend
./gradlew bootRun &

# Run frontend (in new terminal)
cd ~/workspace/unisoft/ulms-frontend
npm run dev

# Access application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8080
# Fineract API: http://localhost:8443/fineract-provider
```

---

## 11. Troubleshooting

### Common Issues

#### Issue: Java version not detected
**Solution:**
```bash
source ~/.sdkman/bin/sdkman-init.sh
sdk use java 21.0.2-tem
```

#### Issue: PostgreSQL connection refused
**Solution:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check pg_hba.conf
cat /etc/postgresql/16/main/pg_hba.conf
# Ensure: host all all 127.0.0.1/32 scram-sha-256
```

#### Issue: Port already in use
**Solution:**
```bash
# Find process using port
sudo lsof -i :8080
# or
sudo netstat -tulpn | grep :8080

# Kill process
kill -9 <PID>
```

#### Issue: VS Code Java extension not working
**Solution:**
```bash
# Clean Java workspace
# Cmd+Shift+P -> "Java: Clean Workspace"

# Verify JAVA_HOME
echo $JAVA_HOME
# Should point to: /home/user/.sdkman/candidates/java/current
```

#### Issue: Frontend hot reload not working
**Solution:**
```bash
# Check Vite config
# Ensure HMR is enabled in vite.config.ts

# Try clearing cache
rm -rf node_modules/.vite
npm run dev
```

#### Issue: Permission denied on Docker
**Solution:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Logout and login again
```

### Getting Help

| Issue Type | Contact | Channel |
|------------|---------|---------|
| Environment Setup | Technical Lead | Slack #dev-help |
| Git/Repository | DevOps Team | Slack #devops |
| Fineract Issues | Backend Developer | Slack #backend |
| Frontend Issues | Frontend Developer | Slack #frontend |
| Urgent Issues | Project Manager | Direct Message |

---

## Appendix A: Useful Commands

### Daily Development Commands

```bash
# Start infrastructure
docker compose -f docker-compose.dev.yml up -d

# Stop infrastructure
docker compose -f docker-compose.dev.yml down

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Clean Docker
docker system prune -a

# Gradle tasks
./gradlew tasks
./gradlew clean build
./gradlew bootRun
./gradlew test

# Frontend
cd ulms-frontend
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run ESLint
npm run test     # Run tests
npm run preview  # Preview production build
```

### Git Commands

```bash
# Daily workflow
git pull origin main
git checkout -b feature/ULMS-123-feature-name
# Make changes
git add .
git commit -m "feat: add feature description"
git push origin feature/ULMS-123-feature-name
# Create merge request in GitLab
```

---

**Document Version:** 1.0  
**Last Updated:** February 3, 2026  
**Next Review:** As needed

*Document Classification: Confidential - Internal Use Only*

# Build Stage Specification

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Build Stage Specification |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | DevOps Engineering Team |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Approved |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | DevOps Team | Build stage specification |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Build Architecture](#2-build-architecture)
3. [Backend Build](#3-backend-build)
4. [Frontend Build](#4-frontend-build)
5. [Docker Image Build](#5-docker-image-build)
6. [Build Optimization](#6-build-optimization)
7. [Build Verification](#7-build-verification)
8. [Troubleshooting](#8-troubleshooting)
9. [Best Practices](#9-best-practices)
10. [Related Documents](#10-related-documents)

---

## 1. Executive Summary

This document defines the build stage specifications for ULMS v2.0, including backend compilation, frontend bundling, and Docker image creation for Bangladesh banking deployment.

---

## 2. Build Architecture

### 2.1 Build Pipeline

```mermaid
graph LR
    SRC[Source Code] --> COMP[Compilation]
    COMP --> TEST[Unit Tests]
    TEST --> PKG[Packaging]
    PKG --> IMG[Docker Image]
    IMG --> PUSH[Registry Push]
```

### 2.2 Build Matrix

| Component | Language | Build Tool | Target |
|-----------|----------|------------|--------|
| Backend | Java 21 | Gradle | JAR + Docker |
| Frontend | TypeScript | Vite | Static + Docker |
| Mobile | TypeScript | React Native | APK/IPA |

---

## 3. Backend Build

### 3.1 Gradle Configuration

```groovy
// build.gradle.kts
plugins {
    java
    kotlin("jvm") version "1.9.22"
    id("org.springframework.boot") version "3.2.0"
    id("io.spring.dependency-management") version "1.1.4"
    id("com.google.cloud.tools.jib") version "3.4.0"
    jacoco
}

group = "com.unisoft.ulms"
version = "2.0.0"

java {
    sourceCompatibility = JavaVersion.VERSION_21
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.kafka:spring-kafka")
    
    runtimeOnly("org.postgresql:postgresql")
    
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.testcontainers:postgresql")
}

tasks.withType<Test> {
    useJUnitPlatform()
    finalizedBy(tasks.jacocoTestReport)
}

tasks.jacocoTestReport {
    dependsOn(tasks.test)
    reports {
        xml.required = true
        html.required = true
    }
}

jib {
    from {
        image = "eclipse-temurin:21-jre-alpine"
    }
    to {
        image = "registry.unisoft-systems.com/ulms/backend"
        tags = setOf(version.toString(), "latest")
    }
    container {
        mainClass = "com.unisoft.ulms.Application"
        ports = listOf("8080")
        environment = mapOf(
            "SPRING_PROFILES_ACTIVE" to "production"
        )
    }
}
```

### 3.2 Build Commands

```bash
# Clean build
./gradlew clean

# Compile
./gradlew compileJava compileKotlin

# Run tests
./gradlew test

# Generate coverage report
./gradlew jacocoTestReport

# Build JAR
./gradlew bootJar

# Build Docker image
./gradlew jibDockerBuild

# Full build pipeline
./gradlew clean build jibDockerBuild
```

---

## 4. Frontend Build

### 4.1 Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@mui/material', '@emotion/react'],
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
```

### 4.2 Build Commands

```bash
# Install dependencies
npm ci

# Development build
npm run dev

# Production build
npm run build

# Type checking
npx tsc --noEmit

# Lint
npm run lint

# Test
npm run test

# Build with environment
VITE_API_BASE_URL=https://api.unisoft-systems.com npm run build
```

---

## 5. Docker Image Build

### 5.1 Multi-Stage Dockerfile

```dockerfile
# Backend Dockerfile
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /build
COPY gradle/ gradle/
COPY gradlew build.gradle.kts settings.gradle.kts ./
COPY src/ src/
RUN ./gradlew bootJar --no-daemon

FROM eclipse-temurin:21-jre-alpine
RUN apk add --no-cache ca-certificates tzdata
ENV TZ=Asia/Dhaka
RUN addgroup -g 1000 ulms && adduser -u 1000 -G ulms -s /bin/sh -D ulms
WORKDIR /app
COPY --from=builder --chown=ulms:ulms /build/build/libs/*.jar app.jar
USER ulms
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s \
  CMD wget -q --spider http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
```

### 5.2 Build Commands

```bash
# Build with BuildKit
DOCKER_BUILDKIT=1 docker build -t ulms-backend:2.0.0 .

# Multi-platform build
docker buildx build --platform linux/amd64,linux/arm64 -t ulms-backend:2.0.0 .

# Build and push
docker buildx build --platform linux/amd64,linux/arm64 --push \
  -t registry.unisoft-systems.com/ulms/backend:2.0.0 .
```

---

## 6. Build Optimization

### 6.1 Caching Strategy

| Layer | Cache Type | TTL |
|-------|------------|-----|
| Dependencies | Gradle/Maven cache | 24 hours |
| Docker layers | BuildKit cache | 7 days |
| Node modules | NPM cache | 24 hours |

### 6.2 Optimization Techniques

```bash
# Use build cache
docker build --cache-from ulms-backend:latest .

# Parallel builds
./gradlew build --parallel

# Gradle daemon
./gradlew --daemon
```

---

## 7. Build Verification

### 7.1 Verification Steps

| Step | Command | Expected Result |
|------|---------|-----------------|
| JAR exists | `ls build/libs/*.jar` | File exists |
| JAR valid | `java -jar build/libs/*.jar --version` | Version output |
| Image built | `docker images | grep ulms` | Image listed |
| Image runs | `docker run --rm ulms-backend:latest` | Container starts |

---

## 8. Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Build fails | Syntax error | Check compilation output |
| Out of memory | Heap too small | Increase memory limit |
| Slow build | No cache | Verify cache configuration |
| Image large | Wrong base | Use alpine/jre images |

---

## 9. Best Practices

| Practice | Implementation |
|----------|----------------|
| Reproducible | Pin dependency versions |
| Fast | Use layer caching |
| Secure | Non-root containers |
| Small | Multi-stage builds |
| Verified | Automated tests |

---

## 10. Related Documents

| Document | Location | Purpose |
|----------|----------|---------|
| Docker Containerization | `../../01_Containerization/01_[OPS]_Docker_Containerization_Guide_v1.0.md` | Docker |
| GitLab CI Pipeline | `01_[CICD]_GitLab_CI_Pipeline_Configuration_v1.0.md` | CI/CD |

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

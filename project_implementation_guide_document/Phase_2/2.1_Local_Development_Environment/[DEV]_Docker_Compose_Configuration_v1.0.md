# Docker Compose Configuration
## ULMS v2.0 Development Infrastructure

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Docker Compose Configuration |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 8, 2026 |
| **Prepared By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Approved |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Infrastructure Services](#2-infrastructure-services)
3. [Configuration Files](#3-configuration-files)
4. [Service Details](#4-service-details)
5. [Usage Commands](#5-usage-commands)
6. [Network Configuration](#6-network-configuration)
7. [Volume Management](#7-volume-management)

---

## 1. Overview

This document defines the Docker Compose configuration for ULMS v2.0 development environment. It provides containerized infrastructure services required for local development.

### 1.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ULMS DEVELOPMENT INFRASTRUCTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  PostgreSQL  │  │    Redis     │  │    Kafka     │  │  Zookeeper   │    │
│  │    :5432     │  │    :6379     │  │    :9092     │  │    :2181     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                       │
│  │   Kafka UI   │  │   MailHog    │  │   MinIO      │                       │
│  │    :8080     │  │    :8025     │  │    :9000     │                       │
│  └──────────────┘  └──────────────┘  └──────────────┘                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Infrastructure Services

| Service | Version | Port | Purpose |
|---------|---------|------|---------|
| PostgreSQL | 16.1 | 5432 | Primary database |
| Redis | 7.2 | 6379 | Cache & sessions |
| Apache Kafka | 3.6 | 9092 | Event streaming |
| Zookeeper | 3.8 | 2181 | Kafka coordination |
| Kafka UI | latest | 8080 | Kafka management |
| MailHog | latest | 8025 | Email testing |
| MinIO | latest | 9000 | Object storage (S3-compatible) |

---

## 3. Configuration Files

### 3.1 Main Docker Compose File

**File:** `docker/docker-compose.dev.yml`

```yaml
version: '3.8'

services:
  # ============================================
  # PostgreSQL 16 - Primary Database
  # ============================================
  postgres:
    image: postgres:16.1-alpine
    container_name: ulms-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-ulms_user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-dev_password_secure}
      POSTGRES_DB: ${POSTGRES_DB:-ulms_dev}
      PGDATA: /var/lib/postgresql/data/pgdata
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-ulms_user} -d ${POSTGRES_DB:-ulms_dev}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ulms-network
    command:
      - "postgres"
      - "-c"
      - "max_connections=200"
      - "-c"
      - "shared_buffers=256MB"

  # ============================================
  # Redis 7 - Cache & Session Store
  # ============================================
  redis:
    image: redis:7.2-alpine
    container_name: ulms-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    networks:
      - ulms-network

  # ============================================
  # Zookeeper - Kafka Coordination
  # ============================================
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    container_name: ulms-zookeeper
    restart: unless-stopped
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"
    volumes:
      - zookeeper_data:/var/lib/zookeeper/data
      - zookeeper_log:/var/lib/zookeeper/log
    networks:
      - ulms-network

  # ============================================
  # Apache Kafka 3.6 - Event Streaming
  # ============================================
  kafka:
    image: confluentinc/cp-kafka:7.5.0
    container_name: ulms-kafka
    restart: unless-stopped
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
      - "29092:29092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
      KAFKA_MIN_INSYNC_REPLICAS: 1
      KAFKA_DEFAULT_REPLICATION_FACTOR: 1
    volumes:
      - kafka_data:/var/lib/kafka/data
    healthcheck:
      test: ["CMD", "kafka-broker-api-versions", "--bootstrap-server", "localhost:9092"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ulms-network

  # ============================================
  # Kafka UI - Management Interface
  # ============================================
  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    container_name: ulms-kafka-ui
    restart: unless-stopped
    depends_on:
      - kafka
    ports:
      - "8080:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: ulms-local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:29092
      KAFKA_CLUSTERS_0_ZOOKEEPER: zookeeper:2181
    networks:
      - ulms-network

  # ============================================
  # MailHog - Email Testing
  # ============================================
  mailhog:
    image: mailhog/mailhog:latest
    container_name: ulms-mailhog
    restart: unless-stopped
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI
    networks:
      - ulms-network

  # ============================================
  # MinIO - S3-Compatible Object Storage
  # ============================================
  minio:
    image: minio/minio:latest
    container_name: ulms-minio
    restart: unless-stopped
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-minioadmin}
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3
    networks:
      - ulms-network

# ============================================
# Volumes
# ============================================
volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  zookeeper_data:
    driver: local
  zookeeper_log:
    driver: local
  kafka_data:
    driver: local
  minio_data:
    driver: local

# ============================================
# Networks
# ============================================
networks:
  ulms-network:
    driver: bridge
```

### 3.2 Environment File

**File:** `docker/.env.docker`

```bash
# PostgreSQL
POSTGRES_USER=ulms_user
POSTGRES_PASSWORD=dev_password_secure
POSTGRES_DB=ulms_dev

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin

# Kafka Topics (Auto-created)
KAFKA_AUTO_CREATE_TOPICS=true
```

---

## 4. Service Details

### 4.1 PostgreSQL Configuration

```yaml
# Extended configuration for production-like setup
postgres:
  image: postgres:16.1-alpine
  # ... basic config from above ...
  command:
    - "postgres"
    - "-c"
    - "max_connections=200"
    - "-c"
    - "shared_buffers=256MB"
    - "-c"
    - "effective_cache_size=768MB"
    - "-c"
    - "maintenance_work_mem=64MB"
    - "-c"
    - "checkpoint_completion_target=0.9"
    - "-c"
    - "wal_buffers=16MB"
    - "-c"
    - "default_statistics_target=100"
    - "-c"
    - "random_page_cost=1.1"
    - "-c"
    - "effective_io_concurrency=200"
    - "-c"
    - "work_mem=5242kB"
    - "-c"
    - "min_wal_size=1GB"
    - "-c"
    - "max_wal_size=4GB"
```

### 4.2 Redis Configuration

```yaml
redis:
  image: redis:7.2-alpine
  # ... basic config ...
  command: >
    redis-server
    --appendonly yes
    --maxmemory 256mb
    --maxmemory-policy allkeys-lru
    --save 900 1
    --save 300 10
    --save 60 10000
```

### 4.3 Kafka Topic Initialization

**File:** `docker/kafka/init-topics.sh`

```bash
#!/bin/bash

# Wait for Kafka to be ready
echo "Waiting for Kafka to be ready..."
sleep 10

# Create topics
kafka-topics --bootstrap-server kafka:29092 --create --if-not-exists --topic loan.applications --partitions 12 --replication-factor 1
kafka-topics --bootstrap-server kafka:29092 --create --if-not-exists --topic loan.disbursements --partitions 6 --replication-factor 1
kafka-topics --bootstrap-server kafka:29092 --create --if-not-exists --topic loan.payments --partitions 12 --replication-factor 1
kafka-topics --bootstrap-server kafka:29092 --create --if-not-exists --topic cib.updates --partitions 3 --replication-factor 1
kafka-topics --bootstrap-server kafka:29092 --create --if-not-exists --topic notifications --partitions 6 --replication-factor 1
kafka-topics --bootstrap-server kafka:29092 --create --if-not-exists --topic audit.events --partitions 6 --replication-factor 1
kafka-topics --bootstrap-server kafka:29092 --create --if-not-exists --topic workflow.events --partitions 6 --replication-factor 1

echo "Kafka topics created successfully"
```

---

## 5. Usage Commands

### 5.1 Basic Operations

```bash
# Start all services
docker-compose -f docker/docker-compose.dev.yml up -d

# Start specific service
docker-compose -f docker/docker-compose.dev.yml up -d postgres

# Stop all services
docker-compose -f docker/docker-compose.dev.yml down

# Stop and remove volumes (WARNING: Data loss)
docker-compose -f docker/docker-compose.dev.yml down -v

# Restart service
docker-compose -f docker/docker-compose.dev.yml restart postgres

# View logs
docker-compose -f docker/docker-compose.dev.yml logs -f

# View specific service logs
docker-compose -f docker/docker-compose.dev.yml logs -f postgres
```

### 5.2 Health Checks

```bash
# Check all services status
docker-compose -f docker/docker-compose.dev.yml ps

# Check PostgreSQL health
docker exec ulms-postgres pg_isready -U ulms_user

# Check Redis health
docker exec ulms-redis redis-cli ping

# Check Kafka health
docker exec ulms-kafka kafka-broker-api-versions --bootstrap-server localhost:9092
```

### 5.3 Database Operations

```bash
# Connect to PostgreSQL
docker exec -it ulms-postgres psql -U ulms_user -d ulms_dev

# Backup database
docker exec ulms-postgres pg_dump -U ulms_user ulms_dev > backup.sql

# Restore database
docker exec -i ulms-postgres psql -U ulms_user -d ulms_dev < backup.sql
```

### 5.4 Redis Operations

```bash
# Connect to Redis CLI
docker exec -it ulms-redis redis-cli

# Flush all data (WARNING)
docker exec ulms-redis redis-cli FLUSHALL

# Monitor Redis commands
docker exec ulms-redis redis-cli MONITOR
```

---

## 6. Network Configuration

### 6.1 Network Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ulms-network                              │
│                    (Bridge Network)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────┐      ┌──────────┐      ┌──────────┐             │
│   │  Web App │──────│ Fineract │──────│ PostgreSQL             │
│   │  :5173   │      │  :8443   │      │  :5432   │             │
│   └──────────┘      └──────────┘      └──────────┘             │
│        │                 │                                       │
│        │            ┌────┴────┐                                 │
│        │            │  Redis  │                                 │
│        │            │  :6379  │                                 │
│        │            └─────────┘                                 │
│        │                                                        │
│   ┌────┴──────────────────────────────────────────┐            │
│   │              Kafka Ecosystem                   │            │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐     │            │
│   │  │  Kafka   │──│Zookeeper │  │ Kafka UI │     │            │
│   │  │  :9092   │  │  :2181   │  │  :8080   │     │            │
│   │  └──────────┘  └──────────┘  └──────────┘     │            │
│   └───────────────────────────────────────────────┘            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Service Discovery

Services can communicate using container names as hostnames:

```java
// From Fineract to PostgreSQL
String dbUrl = "jdbc:postgresql://postgres:5432/ulms_dev";

// From any service to Redis
String redisUrl = "redis://redis:6379";

// From any service to Kafka
String kafkaUrl = "kafka:29092";
```

---

## 7. Volume Management

### 7.1 Volume List

| Volume | Service | Purpose |
|--------|---------|---------|
| postgres_data | PostgreSQL | Database files |
| redis_data | Redis | Persistent cache |
| zookeeper_data | Zookeeper | Coordination data |
| zookeeper_log | Zookeeper | Transaction logs |
| kafka_data | Kafka | Message logs |
| minio_data | MinIO | Object storage |

### 7.2 Backup and Restore

```bash
# Backup all volumes
./scripts/backup-docker-volumes.sh

# Restore volumes
./scripts/restore-docker-volumes.sh backup-date.tar.gz
```

### 7.3 Cleanup

```bash
# Remove unused volumes
docker volume prune

# Remove specific volume
docker volume rm ulms_postgres_data

# List all volumes
docker volume ls
```

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

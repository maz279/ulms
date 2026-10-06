# Redis 7 Setup and Configuration Guide
## ULMS v2.0 Caching Layer Implementation

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Redis 7 Setup and Configuration Guide |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 8, 2026 |
| **Prepared By** | Technical Lead / DevOps Engineer |
| **Classification** | Internal |
| **Status** | Approved |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Installation Methods](#3-installation-methods)
4. [Configuration](#4-configuration)
5. [ULMS-Specific Redis Configuration](#5-ulms-specific-redis-configuration)
6. [Security Configuration](#6-security-configuration)
7. [Monitoring and Management](#7-monitoring-and-management)
8. [Backup and Recovery](#8-backup-and-recovery)
9. [High Availability Setup](#9-high-availability-setup)
10. [Troubleshooting](#10-troubleshooting)
11. [Performance Tuning](#11-performance-tuning)
12. [Appendix](#12-appendix)

---

## 1. Overview

### 1.1 Purpose

This document provides comprehensive instructions for setting up and configuring Redis 7 as the caching layer for the ULMS v2.0 platform. Redis serves multiple critical functions within the ULMS architecture:

- **Session Storage**: User authentication sessions and JWT token management
- **Application Cache**: API response caching for frequently accessed data
- **Rate Limiting**: API rate limiting to prevent abuse
- **Distributed Locking**: Coordination between microservices
- **Real-time Notifications**: Pub/Sub for loan status updates
- **Temporary Data Storage**: OTP codes, password reset tokens

### 1.2 Architecture Context

```
┌─────────────────────────────────────────────────────────────────┐
│                     ULMS v2.0 Architecture                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   React UI   │  │ React Native │  │   External   │          │
│  │   (Vite)     │  │   (Expo)     │  │    APIs      │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           │                                     │
│                    ┌──────┴──────┐                              │
│                    │  Kong       │                              │
│                    │  Gateway    │                              │
│                    └──────┬──────┘                              │
│                           │                                     │
│         ┌─────────────────┼─────────────────┐                   │
│         │                 │                 │                   │
│    ┌────┴────┐      ┌────┴────┐      ┌────┴────┐              │
│    │Fineract │      │Camunda  │      │Custom   │              │
│    │Core     │      │Workflow │      │Services │              │
│    └────┬────┘      └────┬────┘      └────┬────┘              │
│         │                │                │                    │
│    ┌────┴────────────────┴────────────────┴────┐               │
│    │         Redis 7 Cluster (6 Nodes)         │◄─────────────┤
│    │  ┌────────┐ ┌────────┐ ┌────────┐        │  Session Cache │
│    │  │Master-1│ │Master-2│ │Master-3│        │  API Cache     │
│    │  │Slave-1 │ │Slave-2 │ │Slave-3 │        │  Rate Limiting │
│    │  └────────┘ └────────┘ └────────┘        │  Pub/Sub       │
│    └───────────────────────────────────────────┘               │
│                           │                                     │
│                    ┌──────┴──────┐                              │
│                    │ PostgreSQL  │                              │
│                    │    16       │                              │
│                    └─────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Redis Usage in ULMS

| Use Case | Database Index | TTL | Purpose |
|----------|---------------|-----|---------|
| User Sessions | 0 | 30 min | JWT token storage, user session state |
| API Cache | 1 | 5 min | Frequently accessed API responses |
| Rate Limiting | 2 | 1 min | API request rate limiting counters |
| OTP/Tokens | 3 | 10 min | OTP codes, password reset tokens |
| Distributed Locks | 4 | 60 sec | Service coordination locks |
| Pub/Sub | - | N/A | Real-time notifications |
| Application State | 5 | Varies | Temporary application state |

---

## 2. Prerequisites

### 2.1 System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| RAM | 4 GB | 8 GB+ |
| CPU | 2 cores | 4 cores+ |
| Disk | 20 GB SSD | 50 GB SSD |
| Network | 1 Gbps | 10 Gbps |
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |

### 2.2 Software Dependencies

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required dependencies
sudo apt install -y \
    build-essential \
    tcl \
    systemd \
    curl \
    wget \
    net-tools

# Install monitoring tools (optional)
sudo apt install -y redis-tools
```

### 2.3 Network Requirements

| Port | Protocol | Purpose |
|------|----------|---------|
| 6379 | TCP | Default Redis port |
| 16379 | TCP | Cluster bus port (cluster mode) |
| 26379 | TCP | Sentinel port (HA setup) |

---

## 3. Installation Methods

### 3.1 Method 1: Package Manager Installation (Recommended for Dev)

```bash
# Add Redis official repository
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list

# Update and install Redis 7
sudo apt update
sudo apt install redis-server=7:7.* -y

# Verify installation
redis-server --version
redis-cli --version
```

### 3.2 Method 2: Source Compilation (Recommended for Production)

```bash
# Create Redis user
sudo useradd -r -s /bin/false redis

# Download and compile Redis 7.2.4
cd /tmp
wget https://download.redis.io/releases/redis-7.2.4.tar.gz
tar xzf redis-7.2.4.tar.gz
cd redis-7.2.4

# Compile
make BUILD_TLS=yes
make test
sudo make install

# Create directories
sudo mkdir -p /etc/redis
sudo mkdir -p /var/lib/redis
sudo mkdir -p /var/log/redis
sudo chown redis:redis /var/lib/redis /var/log/redis
sudo chmod 770 /var/lib/redis /var/log/redis

# Copy configuration
sudo cp redis.conf /etc/redis/redis.conf
sudo cp sentinel.conf /etc/redis/sentinel.conf
sudo chown redis:redis /etc/redis/*.conf
```

### 3.3 Method 3: Docker Installation (Development)

```bash
# Create Redis Docker network
docker network create redis-network

# Run Redis 7 container
docker run -d \
    --name ulms-redis \
    --network redis-network \
    -p 6379:6379 \
    -v ulms-redis-data:/data \
    -e REDIS_PASSWORD=your_secure_password \
    redis:7.2-alpine \
    redis-server --appendonly yes --requirepass your_secure_password

# Verify container
docker logs ulms-redis
docker exec -it ulms-redis redis-cli ping
```

### 3.4 Docker Compose Setup (Recommended for Local Development)

Create `docker-compose.redis.yml`:

```yaml
version: '3.8'

services:
  redis:
    image: redis:7.2-alpine
    container_name: ulms-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
      - ./redis/redis.conf:/usr/local/etc/redis/redis.conf:ro
    command: redis-server /usr/local/etc/redis/redis.conf
    environment:
      - REDIS_PASSWORD=${REDIS_PASSWORD:-ulms_redis_2024}
    networks:
      - ulms-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3
    restart: unless-stopped

  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: ulms-redis-commander
    environment:
      - REDIS_HOSTS=local:redis:6379
    ports:
      - "8081:8081"
    networks:
      - ulms-network
    depends_on:
      - redis
    restart: unless-stopped

volumes:
  redis-data:
    driver: local

networks:
  ulms-network:
    driver: bridge
```

---

## 4. Configuration

### 4.1 Basic Configuration (`redis.conf`)

```conf
# ULMS Redis 7 Configuration
# Generated: February 8, 2026
# Version: 1.0

# =============================================================================
# NETWORK CONFIGURATION
# =============================================================================
bind 0.0.0.0
port 6379
tcp-backlog 511
timeout 0
tcp-keepalive 300

# =============================================================================
# GENERAL CONFIGURATION
# =============================================================================
daemonize yes
supervised systemd
pidfile /var/run/redis/redis-server.pid
loglevel notice
logfile /var/log/redis/redis-server.log
databases 16

# =============================================================================
# SNAPSHOTTING (RDB) - Persistence
# =============================================================================
save 900 1      # Save after 900 seconds if at least 1 key changed
save 300 10     # Save after 300 seconds if at least 10 keys changed
save 60 10000   # Save after 60 seconds if at least 10000 keys changed

stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /var/lib/redis

# =============================================================================
# AOF (Append Only File) - Recommended for ULMS
# =============================================================================
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-load-truncated yes
aof-use-rdb-preamble yes

# =============================================================================
# MEMORY MANAGEMENT
# =============================================================================
maxmemory 4gb
maxmemory-policy allkeys-lru
maxmemory-samples 5

# =============================================================================
# SECURITY
# =============================================================================
requirepass your_secure_redis_password_2024

# Rename dangerous commands (optional but recommended)
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG "CONFIG_a8f2d9e1"
rename-command DEBUG ""
rename-command SHUTDOWN "SHUTDOWN_b7c3e9f2"

# =============================================================================
# CLIENTS
# =============================================================================
maxclients 10000

# =============================================================================
# LAZY FREEING
# =============================================================================
lazyfree-lazy-eviction no
lazyfree-lazy-expire yes
lazyfree-lazy-server-del yes
replica-lazy-flush yes

# =============================================================================
# KERNEL CONFIGURATION
# =============================================================================
vm.overcommit_memory = 1
transparent_hugepage/enabled = never
```

### 4.2 Systemd Service Configuration

Create `/etc/systemd/system/redis.service`:

```ini
[Unit]
Description=Redis In-Memory Data Store
After=network.target

[Service]
User=redis
Group=redis
ExecStart=/usr/local/bin/redis-server /etc/redis/redis.conf
ExecStop=/usr/local/bin/redis-cli shutdown
Restart=always
RestartSec=5

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

# Security
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/lib/redis /var/log/redis

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable redis
sudo systemctl start redis
sudo systemctl status redis
```

---

## 5. ULMS-Specific Redis Configuration

### 5.1 Spring Boot Redis Configuration

Add to `application-redis.yml`:

```yaml
spring:
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      password: ${REDIS_PASSWORD:}
      database: 0
      timeout: 2000ms
      lettuce:
        pool:
          max-active: 8
          max-idle: 8
          min-idle: 0
          max-wait: -1ms
        shutdown-timeout: 100ms
      cluster:
        nodes:
          - redis-node-1:6379
          - redis-node-2:6379
          - redis-node-3:6379
        max-redirects: 3

# ULMS Cache Configuration
ulms:
  cache:
    # Session cache (DB 0)
    session:
      ttl: 1800  # 30 minutes
      prefix: "ulms:session:"
    
    # API Response cache (DB 1)
    api:
      ttl: 300   # 5 minutes
      prefix: "ulms:api:"
    
    # Rate limiting (DB 2)
    rate-limit:
      ttl: 60    # 1 minute
      prefix: "ulms:ratelimit:"
      requests-per-minute: 100
    
    # OTP/Token cache (DB 3)
    token:
      ttl: 600   # 10 minutes
      prefix: "ulms:token:"
    
    # Distributed locks (DB 4)
    lock:
      ttl: 60    # 60 seconds
      prefix: "ulms:lock:"
    
    # Application state (DB 5)
    state:
      prefix: "ulms:state:"
```

### 5.2 Redis Configuration Class

```java
package com.unisoft.ulms.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;

@Configuration
@EnableCaching
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        
        // Key serializer
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        
        // Value serializer
        GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer();
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);
        
        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(5))
            .serializeKeysWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new StringRedisSerializer()))
            .serializeValuesWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new GenericJackson2JsonRedisSerializer()));

        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(defaultConfig)
            .withCacheConfiguration("sessions", 
                defaultConfig.entryTtl(Duration.ofMinutes(30)))
            .withCacheConfiguration("api-responses", 
                defaultConfig.entryTtl(Duration.ofMinutes(5)))
            .withCacheConfiguration("loan-data", 
                defaultConfig.entryTtl(Duration.ofMinutes(10)))
            .withCacheConfiguration("customer-data", 
                defaultConfig.entryTtl(Duration.ofMinutes(15)))
            .build();
    }
}
```

### 5.3 Session Management Service

```java
package com.unisoft.ulms.service.cache;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class SessionCacheService {
    
    private final RedisTemplate<String, Object> redisTemplate;
    private static final String SESSION_PREFIX = "ulms:session:";
    private static final long SESSION_TTL = 30; // minutes
    
    public void saveSession(String sessionId, Object sessionData) {
        String key = SESSION_PREFIX + sessionId;
        redisTemplate.opsForValue().set(key, sessionData, SESSION_TTL, TimeUnit.MINUTES);
    }
    
    public Object getSession(String sessionId) {
        String key = SESSION_PREFIX + sessionId;
        return redisTemplate.opsForValue().get(key);
    }
    
    public void deleteSession(String sessionId) {
        String key = SESSION_PREFIX + sessionId;
        redisTemplate.delete(key);
    }
    
    public boolean extendSession(String sessionId) {
        String key = SESSION_PREFIX + sessionId;
        return Boolean.TRUE.equals(redisTemplate.expire(key, SESSION_TTL, TimeUnit.MINUTES));
    }
}
```

### 5.4 Rate Limiting Service

```java
package com.unisoft.ulms.service.cache;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class RateLimitService {
    
    private final StringRedisTemplate redisTemplate;
    private static final String RATE_LIMIT_PREFIX = "ulms:ratelimit:";
    
    public boolean isAllowed(String key, int maxRequests, Duration window) {
        String redisKey = RATE_LIMIT_PREFIX + key;
        
        Long current = redisTemplate.opsForValue().increment(redisKey);
        
        if (current != null && current == 1) {
            redisTemplate.expire(redisKey, window);
        }
        
        return current != null && current <= maxRequests;
    }
    
    public boolean isAllowedForUser(String userId, String action, int maxRequests) {
        String key = String.format("user:%s:action:%s", userId, action);
        return isAllowed(key, maxRequests, Duration.ofMinutes(1));
    }
    
    public boolean isAllowedForApiKey(String apiKey, int maxRequests) {
        String key = String.format("apikey:%s", apiKey);
        return isAllowed(key, maxRequests, Duration.ofMinutes(1));
    }
}
```

### 5.5 Distributed Lock Service

```java
package com.unisoft.ulms.service.cache;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DistributedLockService {
    
    private final StringRedisTemplate redisTemplate;
    private static final String LOCK_PREFIX = "ulms:lock:";
    
    public String acquireLock(String resource, Duration ttl) {
        String lockKey = LOCK_PREFIX + resource;
        String lockValue = UUID.randomUUID().toString();
        
        Boolean acquired = redisTemplate.opsForValue()
            .setIfAbsent(lockKey, lockValue, ttl);
        
        return Boolean.TRUE.equals(acquired) ? lockValue : null;
    }
    
    public boolean releaseLock(String resource, String lockValue) {
        String lockKey = LOCK_PREFIX + resource;
        String currentValue = redisTemplate.opsForValue().get(lockKey);
        
        if (lockValue.equals(currentValue)) {
            return Boolean.TRUE.equals(redisTemplate.delete(lockKey));
        }
        return false;
    }
    
    public boolean renewLock(String resource, String lockValue, Duration ttl) {
        String lockKey = LOCK_PREFIX + resource;
        String currentValue = redisTemplate.opsForValue().get(lockKey);
        
        if (lockValue.equals(currentValue)) {
            return Boolean.TRUE.equals(redisTemplate.expire(lockKey, ttl));
        }
        return false;
    }
}
```

---

## 6. Security Configuration

### 6.1 TLS/SSL Configuration

Generate SSL certificates:

```bash
# Create directory for Redis SSL
sudo mkdir -p /etc/redis/ssl
sudo chown redis:redis /etc/redis/ssl
sudo chmod 700 /etc/redis/ssl

# Generate private key and certificate
openssl genrsa -out /etc/redis/ssl/redis.key 4096
openssl req -new -x509 -key /etc/redis/ssl/redis.key -out /etc/redis/ssl/redis.crt -days 365 \
    -subj "/C=BD/ST=Dhaka/L=Dhaka/O=Unisoft Systems/CN=redis.ulms.local"

# Set permissions
sudo chown redis:redis /etc/redis/ssl/*
sudo chmod 600 /etc/redis/ssl/redis.key
sudo chmod 644 /etc/redis/ssl/redis.crt
```

Update `redis.conf` with TLS:

```conf
# TLS Configuration
port 0
tls-port 6379
tls-cert-file /etc/redis/ssl/redis.crt
tls-key-file /etc/redis/ssl/redis.key
tls-ca-cert-file /etc/redis/ssl/ca.crt
tls-protocols "TLSv1.2 TLSv1.3"

# TLS Authentication
tls-auth-clients optional
tls-replication yes
```

### 6.2 ACL Configuration (Redis 6+)

Create ACL file `/etc/redis/users.acl`:

```acl
# ULMS Redis ACL Configuration
# user <username> on >password ~<key-pattern> +<command> ...

# Default admin user
user default on >admin_secure_password_2024 ~* +@all

# ULMS Application User
user ulms-app on >ulms_app_redis_2024 ~ulms:* +@read +@write +@fast -@dangerous

# ULMS Session Service
user ulms-session on >session_redis_2024 ~ulms:session:* +get +set +del +expire +ttl

# ULMS Rate Limiter
user ulms-ratelimit on >ratelimit_redis_2024 ~ulms:ratelimit:* +incr +expire +get +del

# ULMS Lock Service
user ulms-lock on >lock_redis_2024 ~ulms:lock:* +set +nx +del +get +expire

# Read-only user for monitoring
user ulms-monitor on >monitor_redis_2024 ~* +ping +info +slowlog +client

# Replication user
user repl-user on >replication_secure_2024 ~* +psync +replconf +ping
```

Update `redis.conf`:

```conf
# ACL Configuration
aclfile /etc/redis/users.acl
```

### 6.3 Firewall Configuration

```bash
# Using UFW
sudo ufw allow from 10.0.0.0/8 to any port 6379 proto tcp comment 'Redis internal network'
sudo ufw allow from 172.16.0.0/12 to any port 6379 proto tcp comment 'Redis internal network'
sudo ufw allow from 192.168.0.0/16 to any port 6379 proto tcp comment 'Redis internal network'
sudo ufw deny 6379/tcp comment 'Deny external Redis access'

# Using iptables
sudo iptables -A INPUT -p tcp --dport 6379 -s 10.0.0.0/8 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 6379 -s 172.16.0.0/12 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 6379 -s 192.168.0.0/16 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 6379 -j DROP
```

---

## 7. Monitoring and Management

### 7.1 Redis Insight Setup

```bash
# Run Redis Insight using Docker
docker run -d \
    --name redis-insight \
    -p 5540:5540 \
    -v redis-insight-data:/db \
    redis/redisinsight:latest

# Access at http://localhost:5540
```

### 7.2 Prometheus Exporter

```bash
# Run Redis Exporter
docker run -d \
    --name redis-exporter \
    -p 9121:9121 \
    oliver006/redis_exporter:latest \
    --redis.addr=redis://localhost:6379 \
    --redis.password=your_secure_password
```

Prometheus configuration:

```yaml
scrape_configs:
  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:9121']
    metrics_path: /metrics
```

### 7.3 Grafana Dashboard

Key metrics to monitor:

| Metric | Warning Threshold | Critical Threshold |
|--------|-------------------|-------------------|
| Memory Usage | > 70% | > 85% |
| Connected Clients | > 8000 | > 9500 |
| Keyspace Hits Ratio | < 90% | < 80% |
| Replication Lag | > 1s | > 5s |
| Slow Log Entries | > 10/min | > 50/min |
| Blocked Clients | > 0 | > 10 |

### 7.4 Health Check Script

```bash
#!/bin/bash
# /usr/local/bin/redis-health-check.sh

REDIS_HOST=${REDIS_HOST:-localhost}
REDIS_PORT=${REDIS_PORT:-6379}
REDIS_PASSWORD=${REDIS_PASSWORD:-}

# Check if Redis is responsive
if [ -n "$REDIS_PASSWORD" ]; then
    PONG=$(redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD ping 2>/dev/null)
else
    PONG=$(redis-cli -h $REDIS_HOST -p $REDIS_PORT ping 2>/dev/null)
fi

if [ "$PONG" != "PONG" ]; then
    echo "CRITICAL: Redis is not responding"
    exit 2
fi

# Check memory usage
MEMORY_INFO=$(redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD info memory 2>/dev/null)
USED_MEMORY=$(echo "$MEMORY_INFO" | grep used_memory: | cut -d: -f2 | tr -d '\r')
MAX_MEMORY=$(echo "$MEMORY_INFO" | grep maxmemory: | cut -d: -f2 | tr -d '\r')

if [ "$MAX_MEMORY" -gt 0 ]; then
    MEMORY_PERCENT=$((USED_MEMORY * 100 / MAX_MEMORY))
    if [ "$MEMORY_PERCENT" -gt 85 ]; then
        echo "CRITICAL: Redis memory usage at ${MEMORY_PERCENT}%"
        exit 2
    elif [ "$MEMORY_PERCENT" -gt 70 ]; then
        echo "WARNING: Redis memory usage at ${MEMORY_PERCENT}%"
        exit 1
    fi
fi

echo "OK: Redis is healthy"
exit 0
```

---

## 8. Backup and Recovery

### 8.1 Automated Backup Script

```bash
#!/bin/bash
# /usr/local/bin/redis-backup.sh

BACKUP_DIR="/backup/redis"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform BGSAVE
redis-cli BGSAVE

# Wait for BGSAVE to complete
while redis-cli INFO Persistence | grep -q "rdb_bgsave_in_progress:1"; do
    sleep 1
done

# Copy RDB file
cp /var/lib/redis/dump.rdb $BACKUP_DIR/dump_$DATE.rdb

# Copy AOF if enabled
if [ -f /var/lib/redis/appendonly.aof ]; then
    cp /var/lib/redis/appendonly.aof $BACKUP_DIR/appendonly_$DATE.aof
fi

# Compress backup
cd $BACKUP_DIR
tar czf redis_backup_$DATE.tar.gz dump_$DATE.rdb appendonly_$DATE.aof 2>/dev/null
rm -f dump_$DATE.rdb appendonly_$DATE.aof

# Remove old backups
find $BACKUP_DIR -name "redis_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: redis_backup_$DATE.tar.gz"
```

### 8.2 Restore Procedure

```bash
#!/bin/bash
# /usr/local/bin/redis-restore.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

# Stop Redis
sudo systemctl stop redis

# Extract backup
tar xzf $BACKUP_FILE -C /tmp/

# Restore RDB
cp /tmp/dump_*.rdb /var/lib/redis/dump.rdb

# Restore AOF if exists
if ls /tmp/appendonly_*.aof 1> /dev/null 2>&1; then
    cp /tmp/appendonly_*.aof /var/lib/redis/appendonly.aof
fi

# Set permissions
sudo chown redis:redis /var/lib/redis/*

# Start Redis
sudo systemctl start redis

# Cleanup
rm -f /tmp/dump_*.rdb /tmp/appendonly_*.aof

echo "Restore completed"
```

### 8.3 Cron Job for Backups

```bash
# Add to crontab
0 */6 * * * /usr/local/bin/redis-backup.sh >> /var/log/redis/backup.log 2>&1
```

---

## 9. High Availability Setup

### 9.1 Redis Sentinel Configuration

Create `/etc/redis/sentinel.conf`:

```conf
# Redis Sentinel Configuration for ULMS
port 26379
daemonize yes
supervised systemd
pidfile /var/run/redis/redis-sentinel.pid
logfile /var/log/redis/redis-sentinel.log
dir /var/lib/redis

# Sentinel monitoring
sentinel monitor ulms-master 10.0.1.10 6379 2
sentinel down-after-milliseconds ulms-master 5000
sentinel parallel-syncs ulms-master 1
sentinel failover-timeout ulms-master 60000
sentinel auth-pass ulms-master your_secure_password

# Additional sentinels
sentinel monitor ulms-replica 10.0.1.11 6379 2

# Security
requirepass sentinel_secure_password
```

Sentinel systemd service:

```ini
[Unit]
Description=Redis Sentinel
After=network.target

[Service]
User=redis
Group=redis
ExecStart=/usr/local/bin/redis-sentinel /etc/redis/sentinel.conf
Restart=always

[Install]
WantedBy=multi-user.target
```

### 9.2 Redis Cluster Setup (6 nodes)

Node configuration template (`redis-node.conf`):

```conf
port 6379
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000
appendonly yes
maxmemory 2gb
maxmemory-policy allkeys-lru
```

Create cluster:

```bash
# Start all 6 nodes
for i in {1..6}; do
    mkdir -p /var/lib/redis/node$i
    cp redis-node.conf /etc/redis/redis-node$i.conf
    sed -i "s/port 6379/port 637$i/" /etc/redis/redis-node$i.conf
    redis-server /etc/redis/redis-node$i.conf
done

# Create cluster
redis-cli --cluster create \
    10.0.1.10:6371 10.0.1.10:6372 10.0.1.11:6373 \
    10.0.1.11:6374 10.0.1.12:6375 10.0.1.12:6376 \
    --cluster-replicas 1 -a your_secure_password
```

### 9.3 Connection Pool for Cluster

```java
@Bean
public LettuceConnectionFactory redisConnectionFactory() {
    RedisClusterConfiguration clusterConfig = new RedisClusterConfiguration(
        Arrays.asList(
            "10.0.1.10:6371",
            "10.0.1.10:6372",
            "10.0.1.11:6373",
            "10.0.1.11:6374",
            "10.0.1.12:6375",
            "10.0.1.12:6376"
        )
    );
    clusterConfig.setPassword(RedisPassword.of("your_secure_password"));
    
    ClientOptions clientOptions = ClientOptions.builder()
        .socketOptions(SocketOptions.builder()
            .connectTimeout(Duration.ofSeconds(5))
            .build())
        .timeoutOptions(TimeoutOptions.enabled(Duration.ofSeconds(5)))
        .build();
    
    LettuceClientConfiguration clientConfig = LettuceClientConfiguration.builder()
        .clientOptions(clientOptions)
        .readFrom(ReadFrom.REPLICA_PREFERRED)
        .build();
    
    return new LettuceConnectionFactory(clusterConfig, clientConfig);
}
```

---

## 10. Troubleshooting

### 10.1 Common Issues and Solutions

| Issue | Symptoms | Solution |
|-------|----------|----------|
| Memory Exhaustion | OOM errors, evictions | Increase `maxmemory`, optimize data structures |
| High CPU Usage | Slow responses | Check for expensive operations, optimize queries |
| Connection Refused | Cannot connect | Check firewall, binding configuration |
| Persistence Failures | BGSAVE errors | Check disk space, permissions |
| Replication Lag | Data inconsistency | Network issues, increase `repl-timeout` |
| Slow Queries | High latency | Enable slow log, optimize queries |

### 10.2 Diagnostic Commands

```bash
# Check Redis info
redis-cli INFO

# Check memory usage
redis-cli INFO memory

# Check connected clients
redis-cli CLIENT LIST

# Check slow queries
redis-cli SLOWLOG GET 10

# Check keyspace
redis-cli INFO keyspace

# Monitor real-time commands
redis-cli MONITOR

# Check replication status
redis-cli INFO replication

# Check persistence status
redis-cli INFO persistence
```

### 10.3 Slow Log Configuration

```conf
# Log queries taking longer than 10ms
slowlog-log-slower-than 10000

# Keep last 128 slow queries
slowlog-max-len 128
```

### 10.4 Emergency Procedures

```bash
# Emergency memory flush (DANGEROUS)
redis-cli FLUSHDB

# Force save
redis-cli BGSAVE

# Kill all clients
redis-cli CLIENT KILL TYPE normal

# Check for blocked clients
redis-cli CLIENT LIST | grep blocked

# Memory doctor
redis-cli --bigkeys
redis-cli --memkeys
```

---

## 11. Performance Tuning

### 11.1 Kernel Parameters

```bash
# Add to /etc/sysctl.conf

# Overcommit memory
vm.overcommit_memory = 1

# Disable transparent huge pages
echo never > /sys/kernel/mm/transparent_hugepage/enabled

# Increase socket listen backlog
net.core.somaxconn = 65535

# TCP settings
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_tw_recycle = 1

# Apply changes
sudo sysctl -p
```

### 11.2 Redis Optimizations

```conf
# Disable THP warning
suppress-thp-warning yes

# Hash table settings
hash-max-ziplist-entries 512
hash-max-ziplist-value 64

# List settings
list-max-ziplist-size -2
list-compress-depth 0

# Set settings
set-max-intset-entries 512

# ZSet settings
zset-max-ziplist-entries 128
zset-max-ziplist-value 64

# HyperLogLog settings
hll-sparse-max-bytes 3000

# Stream settings
stream-node-max-bytes 4096
stream-node-max-entries 100
```

### 11.3 Benchmarking

```bash
# Basic benchmark
redis-benchmark -q -n 100000

# Benchmark with pipelining
redis-benchmark -q -n 100000 -P 16

# Benchmark specific commands
redis-benchmark -q -n 100000 SET key:value
redis-benchmark -q -n 100000 GET key:value
redis-benchmark -q -n 100000 LPUSH mylist value
redis-benchmark -q -n 100000 HSET myhash field value

# Benchmark with authentication
redis-benchmark -a your_password -q -n 100000
```

---

## 12. Appendix

### 12.1 Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Feb 8, 2026 | Technical Lead | Initial document creation |

### 12.2 References

- [Redis Documentation](https://redis.io/documentation)
- [Redis Security](https://redis.io/topics/security)
- [Redis Cluster Tutorial](https://redis.io/topics/cluster-tutorial)
- [Spring Data Redis](https://spring.io/projects/spring-data-redis)

### 12.3 Related Documents

| Document | Location | Description |
|----------|----------|-------------|
| PostgreSQL Setup | `[DB]_PostgreSQL_16_Setup_Guide_v1.0.md` | Database setup |
| Docker Setup | `[SETUP]_Docker_Kubernetes_Setup_Guide_v1.0.md` | Container orchestration |
| Monitoring Setup | `[MON]_Monitoring_Grafana_Setup_v1.0.md` | Monitoring configuration |

---

**End of Document**

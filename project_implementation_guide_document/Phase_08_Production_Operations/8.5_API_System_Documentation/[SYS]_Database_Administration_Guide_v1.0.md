# Database Administration Guide

## ULMS v2.0 - PostgreSQL Administration

---

**Document Control**

| Field | Value |
|-------|-------|
| Document ID | ULMS-SYS-DBA-002 |
| Version | 1.0 |
| Status | Final |
| Classification | Internal - Technical |
| Effective Date | February 2026 |
| Review Cycle | Monthly |
| Owner | Database Administrator |
| Approver | Operations Manager |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Architecture](#2-architecture)
3. [Installation](#3-installation)
4. [Configuration](#4-configuration)
5. [Backup and Recovery](#5-backup-and-recovery)
6. [Performance Tuning](#6-performance-tuning)
7. [Maintenance](#7-maintenance)
8. [Monitoring](#8-monitoring)
9. [Security](#9-security)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Introduction

### 1.1 Purpose
This guide provides database administration procedures for ULMS v2.0 PostgreSQL databases.

### 1.2 Database Specifications

| Specification | Value |
|---------------|-------|
| Version | PostgreSQL 16.x |
| Primary Instance | 4 vCPU, 16GB RAM |
| Replica Instance | 4 vCPU, 16GB RAM |
| Storage | 500GB SSD |
| Connection Limit | 200 |
| Encoding | UTF8 |

---

## 2. Architecture

### 2.1 High Availability Setup

```
Application
    │
    ▼
┌─────────────┐
│ PgBouncer   │ Connection Pooling
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
   ▼       ▼
Primary   Replica
 (R/W)    (R/O)
```

### 2.2 Replication Configuration

| Parameter | Primary | Replica |
|-----------|---------|---------|
| wal_level | replica | - |
| max_wal_senders | 10 | - |
| hot_standby | - | on |
| synchronous_commit | remote_apply | - |

---

## 3. Installation

### 3.1 PostgreSQL Installation

```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Install PostgreSQL 16
sudo apt update
sudo apt install postgresql-16 postgresql-contrib-16

# Start service
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### 3.2 Create Database

```sql
-- Create database
CREATE DATABASE ulms_production 
    WITH OWNER = ulms_admin 
    ENCODING = 'UTF8' 
    LC_COLLATE = 'en_US.UTF-8' 
    LC_CTYPE = 'en_US.UTF-8' 
    TABLESPACE = pg_default;

-- Create user
CREATE USER ulms_app WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE ulms_production TO ulms_app;
```

---

## 4. Configuration

### 4.1 postgresql.conf

```ini
# Memory Settings
shared_buffers = 4GB
effective_cache_size = 12GB
work_mem = 20MB
maintenance_work_mem = 512MB

# Connections
max_connections = 200
listen_addresses = '*'

# WAL Settings
wal_level = replica
max_wal_size = 4GB
min_wal_size = 1GB
wal_keep_size = 1GB

# Replication
max_wal_senders = 10
max_replication_slots = 10
hot_standby = on

# Performance
effective_io_concurrency = 200
random_page_cost = 1.1
```

### 4.2 pg_hba.conf

```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
host    ulms_production ulms_app        10.0.0.0/8              scram-sha-256
host    replication     replicator      10.0.0.0/8              scram-sha-256
```

---

## 5. Backup and Recovery

### 5.1 Backup Strategy

| Type | Frequency | Retention | Command |
|------|-----------|-----------|---------|
| Full | Daily | 30 days | pg_dump |
| Incremental | Continuous | 14 days | WAL archiving |
| Manual | Before changes | 90 days | pg_dump |

### 5.2 Backup Procedures

```bash
#!/bin/bash
# daily_backup.sh

BACKUP_DIR=/backup/postgres/$(date +%Y%m%d)
mkdir -p $BACKUP_DIR

# Full backup
pg_dump -h localhost -U postgres -d ulms_production \
    -Fc -f $BACKUP_DIR/ulms_$(date +%H%M).dump

# Verify backup
pg_restore -l $BACKUP_DIR/ulms_*.dump > /dev/null && echo "Backup OK"

# Upload to S3
aws s3 sync $BACKUP_DIR s3://ulms-backups/postgres/$(date +%Y%m%d)/
```

### 5.3 Point-in-Time Recovery

```bash
# 1. Stop PostgreSQL
sudo systemctl stop postgresql@16-main

# 2. Restore base backup
pg_basebackup -h primary -D /var/lib/postgresql/16/main -U replicator -v -P

# 3. Configure recovery
cat > /var/lib/postgresql/16/main/recovery.conf << EOF
restore_command = 'cp /archive/wal/%f %p'
recovery_target_time = '2026-02-05 10:00:00'
recovery_target_action = 'promote'
EOF

# 4. Start recovery
sudo systemctl start postgresql@16-main
```

---

## 6. Performance Tuning

### 6.1 Query Optimization

```sql
-- Find slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Identify missing indexes
SELECT schemaname, tablename, attname 
FROM pg_stats 
WHERE schemaname = 'public' 
AND n_tup_read > 10000 
AND n_tup_fetch < n_tup_read * 0.1;

-- Create index
CREATE INDEX CONCURRENTLY idx_loan_applications_customer 
ON loan_applications(customer_id);
```

### 6.2 Vacuum and Analyze

```bash
# Vacuum all tables
vacuumdb -h localhost -U postgres -d ulms_production -v

# Analyze all tables
vacuumdb -h localhost -U postgres -d ulms_production -v --analyze

# Full vacuum (blocking)
vacuumdb -h localhost -U postgres -d ulms_production -v --full
```

---

## 7. Maintenance

### 7.1 Regular Maintenance Tasks

| Task | Frequency | Command |
|------|-----------|---------|
| VACUUM | Daily | autovacuum |
| ANALYZE | Daily | autovacuum |
| REINDEX | Monthly | REINDEX |
| Log rotation | Daily | logrotate |

### 7.2 Table Maintenance

```sql
-- Reindex table
REINDEX INDEX CONCURRENTLY idx_loan_applications_customer;

-- Analyze specific table
ANALYZE loan_applications;

-- Check table bloat
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables 
WHERE schemaname = 'public';
```

---

## 8. Monitoring

### 8.1 Key Metrics

| Metric | Query | Warning | Critical |
|--------|-------|---------|----------|
| Connections | SELECT count(*) FROM pg_stat_activity | > 150 | > 180 |
| Replication Lag | pg_stat_replication | > 1MB | > 100MB |
| Lock Waits | pg_locks | > 10 | > 50 |
| Dead Tuples | pg_stat_user_tables | > 10% | > 20% |

### 8.2 Health Check Script

```bash
#!/bin/bash
# db_health_check.sh

# Check connection
pg_isready -h prod-db.bank.com

# Check replication lag
psql -c "SELECT 
    CASE 
        WHEN pg_last_wal_receive_lsn() = pg_last_wal_replay_lsn() 
        THEN 0 
        ELSE EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))
    END AS lag_seconds;"

# Check active connections
psql -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"
```

---

## 9. Security

### 9.1 Security Measures

| Measure | Implementation |
|---------|----------------|
| Encryption at Rest | LUKS encryption |
| Encryption in Transit | SSL/TLS |
| Access Control | RBAC |
| Audit Logging | pgaudit extension |
| Password Policy | SCRAM-SHA-256 |

### 9.2 Enable Audit Logging

```sql
-- Install pgaudit
CREATE EXTENSION pgaudit;

-- Configure audit
ALTER SYSTEM SET pgaudit.log = 'write, ddl';
ALTER SYSTEM SET pgaudit.log_catalog = off;
SELECT pg_reload_conf();
```

---

## 10. Troubleshooting

### 10.1 Common Issues

| Issue | Diagnosis | Solution |
|-------|-----------|----------|
| Connection refused | Check pg_hba.conf, postgresql.conf | Update configs |
| Slow queries | Check pg_stat_statements | Add indexes |
| Disk full | Check pg_wal, logs | Archive/cleanup |
| Replication lag | Check network, load | Tune parameters |

### 10.2 Useful Queries

```sql
-- Check blocking queries
SELECT blocked_locks.pid AS blocked_pid,
       blocking_locks.pid AS blocking_pid,
       blocked_activity.query AS blocked_query
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_locks blocking_locks 
    ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.relation = blocked_locks.relation
JOIN pg_catalog.pg_stat_activity blocked_activity 
    ON blocked_activity.pid = blocked_locks.pid
WHERE NOT blocked_locks.granted;

-- Kill query
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid = 12345;
```

---

**Document Control Footer**

*Classification: Internal - Technical*
*Next Review: Monthly*
*Owner: Database Administrator*

**END OF DOCUMENT**

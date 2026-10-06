**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | PostgreSQL 16 Installation and Configuration |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document ID** | 2.2.1 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Database Administrator, ULMS Project |
| **Reviewed By** | Backend Lead |
| **Classification** | Internal |
| **Status** | Approved |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | Database Administrator | Initial version |

---

# PostgreSQL 16 Installation and Configuration
## Linux Installation for ULMS Development and Production

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Prerequisites](#2-prerequisites)
3. [Installation Methods](#3-installation-methods)
4. [Ubuntu/Debian Installation](#4-ubuntudebian-installation)
5. [RHEL/CentOS Installation](#5-rhelcentos-installation)
6. [Post-Installation Configuration](#6-post-installation-configuration)
7. [Performance Tuning](#7-performance-tuning)
8. [Security Configuration](#8-security-configuration)
9. [Backup Configuration](#9-backup-configuration)
10. [Verification Steps](#10-verification-steps)
11. [Troubleshooting](#11-troubleshooting)
12. [Related Documents](#12-related-documents)

---

## 1. Purpose

This document provides comprehensive installation and configuration instructions for PostgreSQL 16, the primary database for ULMS v2.0. The configuration is optimized for Bangladesh banking sector requirements including BRPD 15/2024 loan classification and IFRS-9 Expected Credit Loss (ECL) calculations.

---

## 2. Prerequisites

### 2.1 System Requirements

| Resource | Minimum | Recommended | Production |
|----------|---------|-------------|------------|
| CPU Cores | 4 | 8 | 16+ |
| RAM | 8 GB | 16 GB | 64 GB |
| Disk Space | 50 GB SSD | 100 GB SSD | 500 GB SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS | RHEL 9 |

### 2.2 Network Requirements

| Port | Purpose | Access |
|------|---------|--------|
| 5432 | PostgreSQL Default | Application servers |
| 22 | SSH | Administrators |
| 9100 | Node Exporter (Monitoring) | Monitoring server |

---

## 3. Installation Methods

| Method | Best For | Complexity |
|--------|----------|------------|
| Package Manager (apt/yum) | Standard installations | Low |
| Docker | Development environments | Low |
| Source Build | Custom optimizations | High |
| Cloud Managed (RDS/Cloud SQL) | Production | Low |

---

## 4. Ubuntu/Debian Installation

### 4.1 Install PostgreSQL 16

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required dependencies
sudo apt install -y wget gnupg2 lsb-release curl

# Add PostgreSQL official repository
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list

# Update package lists
sudo apt update

# Install PostgreSQL 16
sudo apt install -y postgresql-16 postgresql-client-16 postgresql-contrib-16

# Install additional extensions
sudo apt install -y postgresql-16-pgaudit postgresql-16-pgstatstatements

# Verify installation
psql --version
# Output: psql (PostgreSQL) 16.x

# Check service status
sudo systemctl status postgresql
```

### 4.2 Create ULMS Database User

```bash
# Switch to postgres user
sudo -i -u postgres

# Create superuser for ULMS
createuser -s -r -d ulms_admin

# Create application user
createuser -P ulms_app
# Enter password when prompted

# Create databases
createdb -O ulms_admin ulms_development
createdb -O ulms_admin ulms_test
createdb -O ulms_admin ulms_production

# Grant privileges
psql -c "GRANT ALL PRIVILEGES ON DATABASE ulms_development TO ulms_app;"
psql -c "GRANT ALL PRIVILEGES ON DATABASE ulms_test TO ulms_app;"
psql -c "GRANT ALL PRIVILEGES ON DATABASE ulms_production TO ulms_app;"

# Create Fineract-specific databases
createdb -O ulms_admin fineract_default
createdb -O ulms_admin fineract_tenant_1

# Exit postgres user
exit
```

### 4.3 Configure pg_hba.conf

**File:** `/etc/postgresql/16/main/pg_hba.conf`

```conf
# ==========================================
# ULMS PostgreSQL Client Authentication
# ==========================================

# TYPE  DATABASE        USER            ADDRESS                 METHOD

# Local connections
local   all             postgres                                peer
local   all             ulms_admin                              peer
local   all             ulms_app                                md5

# IPv4 local connections - Development
host    all             all             127.0.0.1/32            md5

# IPv6 local connections
host    all             all             ::1/128                 md5

# Docker network (development)
host    all             all             172.17.0.0/16           md5
host    all             all             172.18.0.0/16           md5
host    all             all             172.20.0.0/16           md5

# Application servers (staging/production)
# host    ulms_production ulms_app        10.0.1.0/24             md5
# host    ulms_production ulms_app        10.0.2.0/24             md5

# Allow replication connections
local   replication     all                                     peer
host    replication     all             127.0.0.1/32            md5
host    replication     all             ::1/128                 md5
```

### 4.4 Configure postgresql.conf

**File:** `/etc/postgresql/16/main/postgresql.conf`

```conf
# ==========================================
# ULMS PostgreSQL 16 Configuration
# ==========================================

#------------------------------------------------------------------------------
# CONNECTIONS AND AUTHENTICATION
#------------------------------------------------------------------------------
listen_addresses = '*'
port = 5432
max_connections = 200
superuser_reserved_connections = 3

# SSL Configuration (Production)
# ssl = on
# ssl_cert_file = '/etc/ssl/certs/server.crt'
# ssl_key_file = '/etc/ssl/private/server.key'

#------------------------------------------------------------------------------
# RESOURCE USAGE (adjust based on server specs)
#------------------------------------------------------------------------------
# Memory settings for 16GB RAM server
shared_buffers = 4GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
work_mem = 20MB

# For 64GB RAM production server:
# shared_buffers = 16GB
# effective_cache_size = 48GB
# maintenance_work_mem = 2GB
# work_mem = 83MB

# Disk settings
temp_buffers = 16MB
max_prepared_transactions = 100

#------------------------------------------------------------------------------
# WRITE-AHEAD LOGGING
#------------------------------------------------------------------------------
wal_level = replica
wal_buffers = 16MB
max_wal_size = 4GB
min_wal_size = 1GB
checkpoint_completion_target = 0.9
checkpoint_timeout = 10min

#------------------------------------------------------------------------------
# REPLICATION
#------------------------------------------------------------------------------
max_wal_senders = 10
max_replication_slots = 10
wal_keep_size = 1GB

#------------------------------------------------------------------------------
# QUERY TUNING
#------------------------------------------------------------------------------
random_page_cost = 1.1
effective_io_concurrency = 200

# Parallel query settings
max_worker_processes = 8
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
max_parallel_maintenance_workers = 4

#------------------------------------------------------------------------------
# LOGGING
#------------------------------------------------------------------------------
logging_collector = on
log_directory = '/var/log/postgresql'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_messages = warning
log_min_error_statement = error
log_min_duration_statement = 1000
log_checkpoints = on
log_connections = on
log_disconnections = on
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_lock_waits = on
log_temp_files = 0
log_autovacuum_min_duration = 0

#------------------------------------------------------------------------------
# AUTOVACUUM
#------------------------------------------------------------------------------
autovacuum = on
autovacuum_max_workers = 3
autovacuum_naptime = 1min
autovacuum_vacuum_threshold = 50
autovacuum_analyze_threshold = 50

#------------------------------------------------------------------------------
# BANGLADESH BANKING SPECIFIC
#------------------------------------------------------------------------------
# Locale and Format for Bangladesh
datestyle = 'iso, dmy'
timezone = 'Asia/Dhaka'
lc_messages = 'en_US.UTF-8'
lc_monetary = 'en_US.UTF-8'
lc_numeric = 'en_US.UTF-8'
lc_time = 'en_US.UTF-8'
default_text_search_config = 'pg_catalog.english'

# Audit logging for compliance
shared_preload_libraries = 'pg_stat_statements,pgaudit'
pg_stat_statements.max = 10000
pg_stat_statements.track = all
pgaudit.log = 'write,ddl'
pgaudit.log_catalog = off
```

### 4.5 Restart and Verify

```bash
# Restart PostgreSQL
sudo systemctl restart postgresql

# Verify configuration
sudo -u postgres psql -c "SHOW shared_buffers;"
sudo -u postgres psql -c "SHOW max_connections;"
sudo -u postgres psql -c "SHOW timezone;"

# Check for errors
sudo tail -f /var/log/postgresql/postgresql-*.log
```

---

## 5. RHEL/CentOS Installation

### 5.1 Install PostgreSQL 16

```bash
# Disable built-in PostgreSQL module
sudo dnf module disable postgresql -y

# Add PostgreSQL repository
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-x86_64/pgdg-redhat-repo-latest.noarch.rpm

# Install PostgreSQL 16
sudo dnf install -y postgresql16-server postgresql16-contrib postgresql16-libs

# Initialize database
sudo /usr/pgsql-16/bin/postgresql-16-setup initdb

# Enable and start service
sudo systemctl enable postgresql-16
sudo systemctl start postgresql-16

# Verify installation
/usr/pgsql-16/bin/psql --version
```

### 5.2 Configuration Files Location

| File | RHEL/CentOS Path |
|------|------------------|
| postgresql.conf | `/var/lib/pgsql/16/data/postgresql.conf` |
| pg_hba.conf | `/var/lib/pgsql/16/data/pg_hba.conf` |
| Data directory | `/var/lib/pgsql/16/data/` |
| Log directory | `/var/lib/pgsql/16/data/log/` |

---

## 6. Post-Installation Configuration

### 6.1 Create Required Extensions

```bash
# Connect to database
sudo -u postgres psql -d ulms_development

-- Create essential extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgaudit";

-- Verify extensions
\dx

-- Exit
\q
```

### 6.2 Configure Database for Fineract

```bash
# Run Fineract database initialization
sudo -u postgres psql -d fineract_default << EOF
-- Set timezone for Bangladesh
ALTER DATABASE fineract_default SET timezone TO 'Asia/Dhaka';

-- Create schema for ULMS extensions
CREATE SCHEMA IF NOT EXISTS ulms_extensions;

-- Grant permissions
GRANT ALL ON SCHEMA ulms_extensions TO ulms_app;

-- Set search path
ALTER DATABASE fineract_default SET search_path TO public, ulms_extensions;
EOF
```

---

## 7. Performance Tuning

### 7.1 Query Performance Analysis

```sql
-- Enable query statistics tracking
ALTER SYSTEM SET track_activities = on;
ALTER SYSTEM SET track_counts = on;
ALTER SYSTEM SET track_io_timing = on;
ALTER SYSTEM SET track_functions = all;

-- Reload configuration
SELECT pg_reload_conf();

-- View slow queries
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

### 7.2 Index Optimization

```sql
-- Find missing indexes (run after representative workload)
SELECT 
    schemaname,
    tablename,
    attname AS column,
    n_tup_read,
    n_tup_fetch
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY n_tup_read DESC;

-- Analyze table statistics
ANALYZE m_loan;
ANALYZE m_client;
ANALYZE m_loan_repayment_schedule;
```

### 7.3 Connection Pooling (PgBouncer)

```bash
# Install PgBouncer
sudo apt install -y pgbouncer

# Configure PgBouncer
sudo tee /etc/pgbouncer/pgbouncer.ini << 'EOF'
[databases]
ulms_development = host=localhost port=5432 dbname=ulms_development
ulms_production = host=localhost port=5432 dbname=ulms_production

[pgbouncer]
listen_port = 6432
listen_addr = 127.0.0.1
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 10000
default_pool_size = 25
reserve_pool_size = 5
reserve_pool_timeout = 3
EOF

# Create user list
sudo tee /etc/pgbouncer/userlist.txt << EOF
"ulms_app" "md5<password_hash>"
EOF

# Start PgBouncer
sudo systemctl enable pgbouncer
sudo systemctl start pgbouncer
```

---

## 8. Security Configuration

### 8.1 User Privileges

```sql
-- Create read-only user for reporting
CREATE USER ulms_readonly WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE ulms_production TO ulms_readonly;
GRANT USAGE ON SCHEMA public TO ulms_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ulms_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO ulms_readonly;

-- Create backup user
CREATE USER ulms_backup WITH PASSWORD 'backup_password';
GRANT CONNECT ON DATABASE ulms_production TO ulms_backup;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ulms_backup;
```

### 8.2 SSL/TLS Configuration (Production)

```bash
# Generate SSL certificates
sudo openssl req -new -x509 -days 365 -nodes -text \
  -out /etc/ssl/certs/postgresql.crt \
  -keyout /etc/ssl/private/postgresql.key \
  -subj "/CN=db.ulms.unisoft.com.bd"

# Set permissions
sudo chmod 600 /etc/ssl/private/postgresql.key
sudo chown postgres:postgres /etc/ssl/private/postgresql.key
sudo chown postgres:postgres /etc/ssl/certs/postgresql.crt

# Update postgresql.conf
sudo sed -i "s/#ssl = off/ssl = on/" /etc/postgresql/16/main/postgresql.conf
sudo sed -i "s|#ssl_cert_file = ''|ssl_cert_file = '/etc/ssl/certs/postgresql.crt'|" /etc/postgresql/16/main/postgresql.conf
sudo sed -i "s|#ssl_key_file = ''|ssl_key_file = '/etc/ssl/private/postgresql.key'|" /etc/postgresql/16/main/postgresql.conf

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## 9. Backup Configuration

### 9.1 Automated Backup Script

**File:** `/opt/ulms/scripts/backup-postgres.sh`

```bash
#!/bin/bash
# PostgreSQL Backup Script for ULMS

set -e

# Configuration
BACKUP_DIR="/backup/postgresql"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
HOST="localhost"
USER="ulms_backup"

# Databases to backup
DATABASES=("ulms_production" "fineract_default")

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup each database
for DB in "${DATABASES[@]}"; do
    echo "Backing up database: $DB"
    
    # Full backup
    pg_dump -h "$HOST" -U "$USER" -Fc -f "$BACKUP_DIR/${DB}_${DATE}.dump" "$DB"
    
    # Verify backup
    if pg_restore -l "$BACKUP_DIR/${DB}_${DATE}.dump" > /dev/null 2>&1; then
        echo "✅ Backup successful: ${DB}_${DATE}.dump"
    else
        echo "❌ Backup verification failed: ${DB}"
        exit 1
    fi
done

# Cleanup old backups
find "$BACKUP_DIR" -name "*.dump" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $(date)"
```

### 9.2 Cron Job

```bash
# Add to crontab
sudo crontab -e

# Daily backup at 2 AM
0 2 * * * /opt/ulms/scripts/backup-postgres.sh >> /var/log/ulms/backup.log 2>&1

# Hourly WAL archiving (for point-in-time recovery)
0 * * * * /usr/bin/pg_archivecleanup /var/lib/postgresql/16/main/pg_wal/ $(ls -t /backup/wal/*.backup 2>/dev/null | head -1) 2>/dev/null
```

---

## 10. Verification Steps

### 10.1 Basic Connectivity

```bash
# Test local connection
psql -h localhost -U ulms_app -d ulms_development -c "SELECT version();"

# Test network connection (from application server)
psql -h db.ulms.internal -U ulms_app -d ulms_development -c "SELECT 1;"

# Check active connections
sudo -u postgres psql -c "SELECT usename, application_name, client_addr, state FROM pg_stat_activity;"
```

### 10.2 Performance Verification

```sql
-- Check buffer cache hit ratio
SELECT 
    sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 AS cache_hit_ratio
FROM pg_statio_user_tables;

-- Target: > 99%

-- Check autovacuum status
SELECT 
    schemaname,
    tablename,
    last_vacuum,
    last_autovacuum,
    n_tup_ins,
    n_tup_upd,
    n_tup_del
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_tup_upd DESC
LIMIT 10;
```

---

## 11. Troubleshooting

### 11.1 Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check listening ports
sudo netstat -tlnp | grep 5432

# Check logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log

# Reset PostgreSQL password
sudo -u postgres psql -c "ALTER USER ulms_app WITH PASSWORD 'newpassword';"
```

### 11.2 Performance Issues

```bash
# Check long-running queries
sudo -u postgres psql -c "
SELECT pid, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - query_start > interval '5 minutes';
"

# Kill problematic query
sudo -u postgres psql -c "SELECT pg_terminate_backend(<PID>);"

# Check disk space
df -h /var/lib/postgresql
```

### 11.3 WAL Archive Issues

```bash
# Check WAL directory size
du -sh /var/lib/postgresql/16/main/pg_wal/

# Force checkpoint
sudo -u postgres psql -c "CHECKPOINT;"

# Verify WAL archiving
sudo -u postgres psql -c "SELECT * FROM pg_stat_archiver;"
```

---

## 12. Related Documents

| Document ID | Document Name | Description |
|-------------|---------------|-------------|
| 2.1.2 | [Docker Compose Configuration](../2.1_Local_Development_Environment/[DEV]_Docker_Compose_Configuration_v1.0.md) | Containerized setup |
| 2.2.2 | [Database Initialization Scripts]([DB]_Database_Initialization_Scripts_v1.0.md) | Multi-tenant setup |
| 2.2.3 | [Fineract Database Setup]([DB]_Fineract_Database_Setup_v1.0.md) | Core schema configuration |
| 2.2.5 | [Redis Setup]([DB]_Redis_7_Setup_Configuration_v1.0.md) | Cache configuration |
| 2.6.2 | [Database Backup and Recovery](../06_Deployment/[DEPLOY]_Database_Backup_Recovery_v1.0.md) | Backup procedures |

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
*Internal Use Only - ULMS Development Team*

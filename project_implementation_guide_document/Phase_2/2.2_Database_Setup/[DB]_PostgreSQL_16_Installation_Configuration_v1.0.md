# PostgreSQL 16 Installation & Configuration
## Linux Setup for ULMS v2.0

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | PostgreSQL 16 Installation & Configuration |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 8, 2026 |
| **Prepared By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Approved |

---

## Table of Contents

1. [Installation](#1-installation)
2. [Initial Configuration](#2-initial-configuration)
3. [Database Creation](#3-database-creation)
4. [Performance Tuning](#4-performance-tuning)
5. [Security Configuration](#5-security-configuration)
6. [Backup Setup](#6-backup-setup)

---

## 1. Installation

### 1.1 Ubuntu/Debian Installation

```bash
# Add PostgreSQL APT repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'

# Import repository signing key
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Update package lists
sudo apt update

# Install PostgreSQL 16
sudo apt install postgresql-16 postgresql-contrib-16 postgresql-client-16

# Start and enable service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
psql --version
# psql (PostgreSQL) 16.1
```

### 1.2 Verify Service Status

```bash
# Check service status
sudo systemctl status postgresql

# Check listening ports
sudo netstat -tlnp | grep 5432

# Check version
sudo -u postgres psql -c "SELECT version();"
```

---

## 2. Initial Configuration

### 2.1 Create ULMS User

```bash
# Switch to postgres user
sudo -i -u postgres

# Create user
psql -c "CREATE USER ulms_user WITH PASSWORD 'secure_password' CREATEDB;"

# Grant privileges
psql -c "ALTER USER ulms_user WITH SUPERUSER;"

# Exit
exit
```

### 2.2 Configure PostgreSQL

**File:** `/etc/postgresql/16/main/postgresql.conf`

```bash
# Connection Settings
listen_addresses = '*'
port = 5432
max_connections = 200

# Memory Settings (adjust based on RAM)
shared_buffers = 1GB
effective_cache_size = 3GB
work_mem = 10MB
maintenance_work_mem = 256MB

# WAL Settings
wal_level = replica
wal_buffers = 16MB
max_wal_size = 1GB
min_wal_size = 256MB
checkpoint_completion_target = 0.9

# Query Planner
random_page_cost = 1.1
effective_io_concurrency = 200
default_statistics_target = 100

# Logging
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_statement = 'ddl'
```

### 2.3 Configure Client Authentication

**File:** `/etc/postgresql/16/main/pg_hba.conf`

```bash
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# Local connections
local   all             postgres                                peer
local   all             all                                     md5

# IPv4 local connections
host    all             all             127.0.0.1/32            md5

# IPv6 local connections
host    all             all             ::1/128                 md5

# Allow connections from Docker network
host    all             all             172.0.0.0/8             md5

# Allow connections from local network (development)
host    all             all             192.168.0.0/16          md5

# Reject all other connections
host    all             all             0.0.0.0/0               reject
```

### 2.4 Restart PostgreSQL

```bash
sudo systemctl restart postgresql
```

---

## 3. Database Creation

### 3.1 Create ULMS Database

```sql
-- Connect as postgres user
sudo -u postgres psql

-- Create database
CREATE DATABASE ulms_dev
    WITH 
    OWNER = ulms_user
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Create Fineract databases
CREATE DATABASE fineract_tenants OWNER ulms_user;
CREATE DATABASE fineract_default OWNER ulms_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ulms_dev TO ulms_user;
GRANT ALL PRIVILEGES ON DATABASE fineract_tenants TO ulms_user;
GRANT ALL PRIVILEGES ON DATABASE fineract_default TO ulms_user;

-- Exit
\q
```

### 3.2 Create Extensions

```sql
-- Connect to ULMS database
sudo -u postgres psql -d ulms_dev

-- Required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For indexing

-- Verify extensions
\dx

-- Exit
\q
```

### 3.3 Configure Timezone

```sql
-- Set timezone for ULMS (Bangladesh)
ALTER DATABASE ulms_dev SET timezone = 'Asia/Dhaka';
ALTER DATABASE fineract_default SET timezone = 'Asia/Dhaka';

-- Verify
SHOW timezone;
```

---

## 4. Performance Tuning

### 4.1 For Development (16GB RAM)

```bash
# postgresql.conf
shared_buffers = 4GB
effective_cache_size = 12GB
work_mem = 64MB
maintenance_work_mem = 1GB
max_connections = 200
```

### 4.2 Connection Pooling (PgBouncer)

```bash
# Install PgBouncer
sudo apt install pgbouncer

# Configure
sudo nano /etc/pgbouncer/pgbouncer.ini

# Add to pgbouncer.ini
[databases]
ulms_dev = host=localhost port=5432 dbname=ulms_dev

[pgbouncer]
listen_port = 6432
listen_addr = 127.0.0.1
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
```

---

## 5. Security Configuration

### 5.1 SSL Configuration

```bash
# Generate self-signed certificate (development)
sudo -u postgres openssl req -new -x509 -days 365 -nodes -text \
  -out /etc/postgresql/16/main/server.crt \
  -keyout /etc/postgresql/16/main/server.key \
  -subj "/CN=localhost"

# Set permissions
sudo chmod 600 /etc/postgresql/16/main/server.key
sudo chown postgres:postgres /etc/postgresql/16/main/server.key

# Enable SSL in postgresql.conf
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
```

### 5.2 Row Level Security Setup

```sql
-- Enable RLS on tables
ALTER TABLE m_loan ENABLE ROW LEVEL SECURITY;
ALTER TABLE m_client ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY tenant_isolation_policy ON m_loan
    USING (tenant_id = current_setting('app.current_tenant')::INTEGER);
```

---

## 6. Backup Setup

### 6.1 Automated Backups

```bash
# Create backup directory
sudo mkdir -p /var/backups/postgresql
sudo chown postgres:postgres /var/backups/postgresql

# Create backup script
sudo nano /usr/local/bin/backup-postgres.sh
```

**backup-postgres.sh:**

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
DATABASES=("ulms_dev" "fineract_default" "fineract_tenants")

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup each database
for DB in "${DATABASES[@]}"; do
    echo "Backing up $DB..."
    pg_dump -h localhost -U ulms_user -Fc "$DB" > "$BACKUP_DIR/${DB}_${DATE}.dump"
done

# Compress old backups
gzip "$BACKUP_DIR"/*.dump

# Delete backups older than 7 days
find "$BACKUP_DIR" -name "*.dump.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-postgres.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
0 2 * * * /usr/local/bin/backup-postgres.sh >> /var/log/postgresql-backup.log 2>&1
```

### 6.2 Restore from Backup

```bash
# Restore database
pg_restore -h localhost -U ulms_user -d ulms_dev ulms_dev_20260208_020000.dump

# Or with psql for plain SQL dumps
psql -h localhost -U ulms_user -d ulms_dev < ulms_dev_backup.sql
```

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

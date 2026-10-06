# PostgreSQL Backup Configuration - pgBackRest

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | PostgreSQL Backup Configuration - pgBackRest |
| **Project Name** | ULMS |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Classification** | Internal |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Installation](#2-installation)
3. [Configuration](#3-configuration)
4. [Backup Operations](#4-backup-operations)
5. [Monitoring](#5-monitoring)

---

## 1. Overview

pgBackRest configuration for reliable PostgreSQL backups in ULMS.

---

## 2. Installation

```bash
# Install pgBackRest
sudo apt-get install pgbackrest

# Create directories
sudo mkdir -p /var/lib/pgbackrest
sudo chmod 750 /var/lib/pgbackrest
sudo chown postgres:postgres /var/lib/pgbackrest
```

---

## 3. Configuration

### 3.1 pgbackrest.conf

```ini
[global]
repo1-path=/var/lib/pgbackrest
repo1-retention-full=7
repo1-retention-diff=4
repo1-retention-archive=7
repo1-type=s3
repo1-s3-bucket=ulms-pgbackrest
repo1-s3-region=ap-southeast-1
repo1-s3-key=<access-key>
repo1-s3-key-secret=<secret-key>

repo1-cipher-type=aes-256-cbc
repo1-cipher-pass=<cipher-password>

process-max=4
log-level-console=info
log-level-file=debug
start-fast=y
delta=y

[ulms]
pg1-path=/var/lib/postgresql/16/main
pg1-port=5432
pg1-user=postgres
```

### 3.2 PostgreSQL Configuration

```bash
# postgresql.conf
archive_mode = on
archive_command = 'pgbackrest --stanza=ulms archive-push %p'
max_wal_senders = 3
wal_level = replica
```

---

## 4. Backup Operations

### 4.1 Initialize Stanza

```bash
sudo -u postgres pgbackrest --stanza=ulms stanza-create
sudo -u postgres pgbackrest --stanza=ulms check
```

### 4.2 Full Backup

```bash
sudo -u postgres pgbackrest --stanza=ulms backup --type=full
```

### 4.3 Incremental Backup

```bash
sudo -u postgres pgbackrest --stanza=ulms backup --type=diff
```

### 4.4 Scheduled Backups

```bash
# Cron job
0 2 * * 0 postgres pgbackrest --stanza=ulms backup --type=full
0 */6 * * * postgres pgbackrest --stanza=ulms backup --type=diff
```

---

## 5. Monitoring

```bash
# Check backup info
pgbackrest --stanza=ulms info

# Check backup size
pgbackrest --stanza=ulms info --output=json | jq '.[0].backup[] | {time: .timestamp.stop, size: .info.size}'
```

---

*© 2026 Unisoft Systems Limited.*

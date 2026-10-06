# Database Backup and Restore Procedures

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Database Backup and Restore Procedures |
| **Project Name** | ULMS |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Classification** | Confidential |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Backup Procedures](#2-backup-procedures)
3. [Restore Procedures](#3-restore-procedures)
4. [Point-in-Time Recovery](#4-point-in-time-recovery)
5. [Verification](#5-verification)

---

## 1. Overview

PostgreSQL backup and restore procedures for ULMS database operations.

---

## 2. Backup Procedures

### 2.1 Manual Backup

```bash
# Create backup
pg_dump -h $DB_HOST -U $DB_USER -d ulms -Fc > ulms_backup_$(date +%Y%m%d).dump

# Upload to S3
aws s3 cp ulms_backup_*.dump s3://ulms-backups/database/
```

### 2.2 Automated Backup

```bash
# pgBackRest configuration
[global]
repo1-path=/var/lib/pgbackrest
repo1-retention-full=7
repo1-retention-diff=4
repo1-type=s3
repo1-s3-bucket=ulms-backups
repo1-s3-region=ap-southeast-1

[ulms]
pg1-path=/var/lib/postgresql/data
```

---

## 3. Restore Procedures

### 3.1 Full Restore

```bash
# Download backup
aws s3 cp s3://ulms-backups/database/ulms_backup_20260101.dump .

# Restore database
dropdb -h $DB_HOST -U $DB_USER ulms
createdb -h $DB_HOST -U $DB_USER ulms
pg_restore -h $DB_HOST -U $DB_USER -d ulms ulms_backup_20260101.dump
```

### 3.2 pgBackRest Restore

```bash
# Stop PostgreSQL
pg_ctlcluster 16 main stop

# Restore from backup
pgbackrest --stanza=ulms restore

# Start PostgreSQL
pg_ctlcluster 16 main start
```

---

## 4. Point-in-Time Recovery

```bash
# Restore to specific time
pgbackrest --stanza=ulms \
  --type=time \
  --target="2026-01-01 12:00:00" \
  restore
```

---

## 5. Verification

```bash
# Check data integrity
psql -h $DB_HOST -U $DB_USER -d ulms -c "SELECT count(*) FROM loans;"

# Run health checks
psql -h $DB_HOST -U $DB_USER -d ulms -f verify_database.sql
```

---

*© 2026 Unisoft Systems Limited.*

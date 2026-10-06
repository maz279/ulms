# Rollback Procedures

## ULMS v2.0 - Emergency Rollback Guide

---

**Document Control**

| Field | Value |
|-------|-------|
| Document ID | ULMS-OPS-RB-004 |
| Version | 1.0 |
| Status | Final |
| Classification | Internal - Critical Operations |
| Effective Date | February 2026 |
| Review Cycle | Per Release |
| Owner | DevOps Lead |
| Approver | CTO |

---

## Revision History

| Version | Date | Author | Changes | Approver |
|---------|------|--------|---------|----------|
| 0.1 | 2026-01-08 | DevOps Team | Initial draft | - |
| 0.5 | 2026-01-18 | SRE Lead | Added scenarios | - |
| 0.8 | 2026-01-28 | DBA Lead | Added DB rollback | - |
| 1.0 | 2026-02-05 | DevOps Lead | Final release | CTO |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Rollback Decision Matrix](#2-rollback-decision-matrix)
3. [Application Rollback](#3-application-rollback)
4. [Database Rollback](#4-database-rollback)
5. [Infrastructure Rollback](#5-infrastructure-rollback)
6. [Data Migration Rollback](#6-data-migration-rollback)
7. [Configuration Rollback](#7-configuration-rollback)
8. [Full System Rollback](#8-full-system-rollback)
9. [Post-Rollback Verification](#9-post-rollback-verification)
10. [Communication Plan](#10-communication-plan)
11. [Rollback Testing](#11-rollback-testing)
12. [Appendices](#12-appendices)

---

## 1. Introduction

### 1.1 Purpose
This document provides comprehensive rollback procedures for ULMS v2.0 to restore system functionality in case of failed deployments, critical bugs, or system degradation.

### 1.2 Rollback Triggers

| Scenario | Severity | Rollback Decision |
|----------|----------|-------------------|
| Complete system outage | Critical | Immediate rollback |
| Data corruption detected | Critical | Immediate rollback |
| Security vulnerability exposed | Critical | Immediate rollback |
| > 50% functionality impaired | High | Rollback within 1 hour |
| Performance degradation > 200% | High | Rollback if not fixed in 2 hours |
| Critical business process failure | High | Rollback within 30 minutes |
| Minor feature issues | Medium | Fix forward or scheduled rollback |

### 1.3 Rollback Time Objectives

| Component | RTO Target | Actual Limit | Backup Method |
|-----------|------------|--------------|---------------|
| Application | 15 minutes | 30 minutes | Kubernetes rollback |
| Database Schema | 30 minutes | 1 hour | Flyway undo + backup restore |
| Database Data | 1 hour | 4 hours | Point-in-time recovery |
| Configuration | 5 minutes | 15 minutes | Git revert |
| Full System | 2 hours | 4 hours | Disaster recovery |

### 1.4 Prerequisites

Before any rollback:
- [ ] Current state documented
- [ ] Last known good version identified
- [ ] Rollback plan reviewed
- [ ] Stakeholders notified
- [ ] Backup verified (if data rollback required)

---

## 2. Rollback Decision Matrix

### 2.1 Decision Flowchart

```
                        DEPLOYMENT ISSUE DETECTED
                                  │
                                  ▼
                    ┌─────────────────────────────┐
                    │   Is system fully down?     │
                    └─────────────────────────────┘
                           │            │
                          YES           NO
                           │            │
                           ▼            ▼
                    ┌────────────┐  ┌──────────────────────┐
                    │  IMMEDIATE │  │ Is there data loss   │
                    │  ROLLBACK  │  │ or corruption?       │
                    └────────────┘  └──────────────────────┘
                                         │            │
                                        YES           NO
                                         │            │
                                         ▼            ▼
                                  ┌────────────┐  ┌──────────────────┐
                                  │  IMMEDIATE │  │ Can issue be     │
                                  │  ROLLBACK  │  │ fixed in < 2hrs? │
                                  └────────────┘  └──────────────────┘
                                                       │            │
                                                      YES           NO
                                                       │            │
                                                       ▼            ▼
                                                ┌────────────┐  ┌──────────┐
                                                │ FIX FORWARD│  │ ROLLBACK │
                                                │            │  │ SCHEDULED│
                                                └────────────┘  └──────────┘
```

### 2.2 Rollback Authorization

| Rollback Type | Authorizer | Notification |
|---------------|------------|--------------|
| Emergency (P1) | On-call Engineer | Post-facto approval |
| Urgent (P2) | Operations Manager | Immediate notification |
| Planned | Change Advisory Board | 24-hour notice |

---

## 3. Application Rollback

### 3.1 Kubernetes Deployment Rollback

#### Quick Rollback Command

```bash
# Rollback to previous revision (fastest)
kubectl rollout undo deployment/ulms-api -n ulms-production

# Monitor rollback progress
kubectl rollout status deployment/ulms-api -n ulms-production

# Verify rollback
kubectl get pods -n ulms-production
kubectl describe deployment ulms-api -n ulms-production
```

#### Rollback to Specific Version

```bash
# Check revision history
kubectl rollout history deployment/ulms-api -n ulms-production

# Rollback to specific revision
kubectl rollout undo deployment/ulms-api -n ulms-production --to-revision=3

# Verify the specific image version
kubectl get deployment ulms-api -n ulms-production -o jsonpath='{.spec.template.spec.containers[0].image}'
```

### 3.2 Multi-Service Rollback

```bash
#!/bin/bash
# rollback_application.sh

NAMESPACE="ulms-production"
SERVICES=("ulms-api" "ulms-web" "ulms-worker" "ulms-report" "ulms-notification")

echo "Starting application rollback..."
echo "Timestamp: $(date)"
echo ""

for service in "${SERVICES[@]}"; do
    echo "Rolling back $service..."
    kubectl rollout undo deployment/$service -n $NAMESPACE
    kubectl rollout status deployment/$service -n $NAMESPACE --timeout=300s
    echo "$service rollback complete"
    echo ""
done

echo "All services rolled back successfully"
echo "Verifying system health..."

# Health verification
curl -s https://api.ulms.bank.com/actuator/health | jq -r '.status'
```

### 3.3 Canary Deployment Rollback

If using canary deployments with Flagger:

```bash
# Revert canary
kubectl apply -f k8s/canaries/ulms-api-stable.yaml

# Or force promotion of stable
kubectl patch canary ulms-api -n ulms-production --type='merge' -p='{"spec":{"targetRef":{"name":"ulms-api-primary"}}}'

# Delete canary resources
kubectl delete canary ulms-api -n ulms-production
```

### 3.4 Frontend Rollback

```bash
# If using CDN with versioned assets
# Rollback to previous version
aws s3 sync s3://ulms-assets/v2.0.0-previous/ s3://ulms-assets/current/ --delete

# Invalidate CDN cache
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"

# Or update ConfigMap with previous version
kubectl set env deployment/ulms-web APP_VERSION=2.0.0-previous -n ulms-production
```

---

## 4. Database Rollback

### 4.1 Schema Rollback (Flyway)

#### Check Migration Status

```bash
# View current migration status
flyway -configFiles=flyway.conf info

# Output shows:
# +---------+------------------------+---------------------+---------+
# | Version | Description            | Installed on        | State   |
# +---------+------------------------+---------------------+---------+
# | 1.0     | Initial schema         | 2026-01-01 10:00:00 | Success |
# | 2.0     | Add loan tables        | 2026-01-15 14:30:00 | Success |
# | 3.0     | Add workflow tables    | 2026-02-05 09:00:00 | Success | <-- Current
# +---------+------------------------+---------------------+---------+
```

#### Undo Last Migration

```bash
# Undo the last migration (requires undo scripts)
flyway -configFiles=flyway.conf undo

# Undo multiple migrations
flyway -configFiles=flyway.conf undo -target=2.0

# Verify rollback
flyway -configFiles=flyway.conf info
```

### 4.2 Manual Schema Rollback

If Flyway undo is not available:

```bash
#!/bin/bash
# manual_schema_rollback.sh

# 1. Stop application access
kubectl scale deployment ulms-api --replicas=0 -n ulms-production

# 2. Create pre-rollback backup
pg_dump -h prod-db.bank.com -U postgres -d ulms_production \
    -Fc -f "/backup/pre_rollback_$(date +%Y%m%d_%H%M%S).dump"

# 3. Execute rollback script
psql -h prod-db.bank.com -U postgres -d ulms_production \
    -f "sql/rollback_v3.0_to_v2.0.sql"

# 4. Verify schema
psql -h prod-db.bank.com -U postgres -d ulms_production \
    -c "SELECT version FROM schema_version ORDER BY installed_on DESC LIMIT 1;"

# 5. Update Flyway history table
psql -h prod-db.bank.com -U postgres -d ulms_production \
    -c "DELETE FROM flyway_schema_history WHERE version = '3.0';"

# 6. Restart application
kubectl scale deployment ulms-api --replicas=3 -n ulms-production
```

### 4.3 Data Rollback (Point-in-Time Recovery)

#### PITR Procedure

```bash
#!/bin/bash
# pitr_recovery.sh

# Configuration
RESTORE_TIME="2026-02-05 08:00:00"  # Target restore time
BACKUP_DIR="/backup/postgres/base"
WAL_ARCHIVE="/archive/wal"
RECOVERY_DIR="/var/lib/postgresql/16/recovery"

# 1. Stop PostgreSQL
sudo systemctl stop postgresql@16-main

# 2. Move current data (for forensics)
sudo mv /var/lib/postgresql/16/main /var/lib/postgresql/16/main_corrupted_$(date +%Y%m%d)

# 3. Restore from base backup
sudo -u postgres pg_basebackup -D $RECOVERY_DIR -Fp -Xs -P -v \
    -h backup-server.bank.com -U replicator

# 4. Configure recovery
cat > $RECOVERY_DIR/recovery.conf << EOF
restore_command = 'cp $WAL_ARCHIVE/%f %p'
recovery_target_time = '$RESTORE_TIME'
recovery_target_action = 'promote'
EOF

# 5. Start recovery
sudo -u postgres pg_ctl -D $RECOVERY_DIR start

# 6. Monitor recovery
sudo -u postgres psql -c "SELECT pg_is_in_recovery(), pg_last_xact_replay_timestamp();"

# 7. Once promoted, update connection pool
# Edit pgbouncer configuration to point to recovered instance
```

### 4.4 Table-Level Rollback

For specific table recovery:

```sql
-- 1. Create recovery schema
CREATE SCHEMA recovery;

-- 2. Restore specific table from backup
pg_restore --table=loan_applications --schema-only backup.dump

-- 3. Insert data from backup (selective)
INSERT INTO loan_applications 
SELECT * FROM dblink('host=backup-server dbname=ulms_backup', 
                     'SELECT * FROM loan_applications WHERE created_at < ''2026-02-05 09:00:00''')
AS t(id uuid, ...);

-- 4. Verify and reconcile
SELECT COUNT(*) FROM loan_applications WHERE created_at >= '2026-02-05 00:00:00';
```

---

## 5. Infrastructure Rollback

### 5.1 Kubernetes Configuration Rollback

```bash
# Rollback ConfigMap
kubectl rollout undo configmap/ulms-config -n ulms-production

# Or restore from Git
git checkout v2.0.0-stable -- k8s/production/configmaps/
kubectl apply -f k8s/production/configmaps/

# Rollback Secrets (from Vault backup)
vault kv get -version=2 secret/ulms/production/database > db_secret.yaml
kubectl apply -f db_secret.yaml -n ulms-production
```

### 5.2 Ingress Rollback

```bash
# Restore previous ingress configuration
kubectl apply -f k8s/production/ingress/ingress-v1.yaml

# Verify
kubectl get ingress -n ulms-production
kubectl describe ingress ulms-ingress -n ulms-production
```

### 5.3 Network Policy Rollback

```bash
# If network changes caused issues
kubectl delete networkpolicy ulms-restricted -n ulms-production
kubectl apply -f k8s/production/network-policies/default-allow.yaml
```

---

## 6. Data Migration Rollback

### 6.1 Migration Reversal Checklist

| Step | Action | Command/Query | Status |
|------|--------|---------------|--------|
| 1 | Stop all data ingestion | Stop services | ☐ |
| 2 | Identify corrupted records | Query audit log | ☐ |
| 3 | Prepare reversal script | SQL/Python | ☐ |
| 4 | Execute reversal in transaction | BEGIN; ... COMMIT; | ☐ |
| 5 | Verify data consistency | Checksums/counts | ☐ |
| 6 | Restart services | kubectl scale | ☐ |

### 6.2 ETL Rollback Script

```python
#!/usr/bin/env python3
# migration_rollback.py

import psycopg2
from datetime import datetime

class MigrationRollback:
    def __init__(self, db_config):
        self.conn = psycopg2.connect(**db_config)
        self.cursor = self.conn.cursor()
        self.rollback_point = '2026-02-05 09:00:00'
    
    def identify_affected_records(self):
        """Find records modified since migration"""
        query = """
        SELECT table_name, record_id, operation, timestamp
        FROM data_migration_audit
        WHERE timestamp >= %s
        ORDER BY timestamp DESC;
        """
        self.cursor.execute(query, (self.rollback_point,))
        return self.cursor.fetchall()
    
    def rollback_table(self, table_name):
        """Rollback specific table"""
        # Get pre-migration snapshot
        query = f"""
        DELETE FROM {table_name}
        WHERE updated_at >= %s;
        
        INSERT INTO {table_name}
        SELECT * FROM {table_name}_backup
        WHERE updated_at < %s
        AND id NOT IN (SELECT id FROM {table_name});
        """
        self.cursor.execute(query, (self.rollback_point, self.rollback_point))
    
    def verify_integrity(self):
        """Check referential integrity"""
        # Run FK checks
        # Run count comparisons
        pass
    
    def execute_rollback(self):
        """Main rollback procedure"""
        try:
            affected = self.identify_affected_records()
            print(f"Found {len(affected)} affected records")
            
            # Execute rollback
            self.rollback_table('loan_applications')
            self.rollback_table('customers')
            self.rollback_table('repayments')
            
            # Verify
            self.verify_integrity()
            
            self.conn.commit()
            print("Rollback completed successfully")
            
        except Exception as e:
            self.conn.rollback()
            print(f"Rollback failed: {e}")
            raise
        finally:
            self.cursor.close()
            self.conn.close()

if __name__ == '__main__':
    config = {
        'host': 'prod-db.bank.com',
        'database': 'ulms_production',
        'user': 'rollback_admin',
        'password': '***'
    }
    
    rollback = MigrationRollback(config)
    rollback.execute_rollback()
```

---

## 7. Configuration Rollback

### 7.1 Feature Flag Rollback

```bash
# If using LaunchDarkly or similar
# Disable problematic feature
ldcli flags update --project ulms --environment production \
    --flag new-workflow-engine --patch '[{"op": "replace", "path": "/environments/production/on", "value": false}]'

# Or via API
curl -X PATCH https://app.launchdarkly.com/api/v2/flags/ulms/new-workflow-engine \
  -H "Authorization: $LD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "environments": {
      "production": {
        "on": false
      }
    }
  }'
```

### 7.2 Application Property Rollback

```bash
# Edit ConfigMap
kubectl edit configmap ulms-config -n ulms-production

# Or apply previous version
kubectl apply -f k8s/production/configmaps/ulms-config-v1.yaml

# Restart pods to pick up changes
kubectl rollout restart deployment/ulms-api -n ulms-production
```

---

## 8. Full System Rollback

### 8.1 Disaster Recovery Rollback

Use when multiple components are affected:

```bash
#!/bin/bash
# full_system_rollback.sh

set -e

TARGET_VERSION="v2.0.0-stable"
RESTORE_TIME="2026-02-05 08:00:00"
LOG_FILE="/var/log/ulms/rollback_$(date +%Y%m%d_%H%M%S).log"

exec > >(tee -a $LOG_FILE)
exec 2>&1

echo "================================"
echo "FULL SYSTEM ROLLBACK INITIATED"
echo "Target Version: $TARGET_VERSION"
echo "Restore Time: $RESTORE_TIME"
echo "Start Time: $(date)"
echo "================================"

# Phase 1: Stop Applications
echo "[Phase 1] Stopping applications..."
kubectl scale deployment --all --replicas=0 -n ulms-production

# Phase 2: Database Restore
echo "[Phase 2] Restoring database..."
./scripts/pitr_recovery.sh "$RESTORE_TIME"

# Phase 3: Restore Configuration
echo "[Phase 3] Restoring configuration..."
git checkout $TARGET_VERSION -- k8s/production/
kubectl apply -k k8s/production/

# Phase 4: Application Deploy
echo "[Phase 4] Deploying applications..."
kubectl set image deployment/ulms-api \
    ulms-api=registry.bank.com/ulms-api:$TARGET_VERSION -n ulms-production
kubectl set image deployment/ulms-web \
    ulms-web=registry.bank.com/ulms-web:$TARGET_VERSION -n ulms-production

# Phase 5: Verify
echo "[Phase 5] Verification..."
sleep 60
./scripts/health_check.sh

echo "================================"
echo "ROLLBACK COMPLETE"
echo "End Time: $(date)"
echo "================================"
```

### 8.2 Rollback Checklist

| Phase | Task | Owner | Status |
|-------|------|-------|--------|
| 1 | Disable user access | L1 Ops | ☐ |
| 1 | Stop data ingestion | L1 Ops | ☐ |
| 1 | Complete active transactions | L2 Ops | ☐ |
| 2 | Database restore initiated | DBA | ☐ |
| 2 | Database restore verified | DBA | ☐ |
| 3 | Configuration restored | DevOps | ☐ |
| 4 | Application deployed | DevOps | ☐ |
| 4 | Pods healthy | DevOps | ☐ |
| 5 | Smoke tests passed | QA | ☐ |
| 5 | Business validation complete | Business | ☐ |
| 6 | User access re-enabled | L1 Ops | ☐ |

---

## 9. Post-Rollback Verification

### 9.1 Technical Verification

| Check | Command | Expected | Status |
|-------|---------|----------|--------|
| API Health | curl /actuator/health | UP | ☐ |
| Database Connectivity | psql -c "SELECT 1" | 1 | ☐ |
| Pod Status | kubectl get pods | All Running | ☐ |
| Config Version | kubectl get configmap -o yaml | Correct version | ☐ |
| Image Version | kubectl get deployment -o yaml | Correct tag | ☐ |
| Ingress Rules | kubectl get ingress | Correct rules | ☐ |

### 9.2 Business Verification

| Process | Test Case | Expected | Status |
|---------|-----------|----------|--------|
| Login | Valid credentials | Success | ☐ |
| Loan Application | Create new application | Created | ☐ |
| CIB Check | Query credit bureau | Response received | ☐ |
| Approval Workflow | Submit for approval | Workflow started | ☐ |
| Report Generation | Generate daily report | Report generated | ☐ |
| Payment Recording | Record repayment | Balance updated | ☐ |

### 9.3 Data Integrity Verification

```sql
-- Verify record counts
SELECT 'Customers' as table_name, COUNT(*) as count FROM customers
UNION ALL
SELECT 'Loan Applications', COUNT(*) FROM loan_applications
UNION ALL
SELECT 'Repayments', COUNT(*) FROM repayments;

-- Verify critical business rules
SELECT COUNT(*) as invalid_loans
FROM loan_applications
WHERE amount <= 0 OR interest_rate <= 0 OR term_months <= 0;

-- Should return 0
```

---

## 10. Communication Plan

### 10.1 Internal Communication

| Time | Audience | Message | Channel |
|------|----------|---------|---------|
| T+0 | Operations Team | Rollback initiated | Slack #ops |
| T+5 | Management | Rollback in progress | Email |
| T+15 | All Staff | Status update | Slack #general |
| T+30 | Business Users | System maintenance notice | Email |
| Complete | All Stakeholders | Rollback complete | All channels |

### 10.2 External Communication

| Scenario | Audience | Message | Timing |
|----------|----------|---------|--------|
| Extended Outage | Customers | Service disruption notice | Within 30 min |
| Data Concern | Regulators | Incident notification | Within 1 hour |
| Major Incident | Board | Executive briefing | Within 2 hours |

### 10.3 Communication Templates

```
ROLLBACK NOTIFICATION TEMPLATE:

Subject: [ROLLBACK] ULMS v2.0 - Rolling back to v[VERSION]

Impact: [Brief description of impact]
Reason: [Why rollback is necessary]
Expected Duration: [Estimated time]
Affected Services: [List of services]

We are currently rolling back ULMS to version [VERSION] due to [REASON].
The system will be unavailable during this time.

Next Update: [Time]
Contact: [On-call engineer]

[Operations Team]
```

---

## 11. Rollback Testing

### 11.1 Pre-Deployment Rollback Test

Before each production deployment:

```bash
# 1. Deploy to staging
deploy_staging.sh v2.1.0

# 2. Run smoke tests
run_smoke_tests.sh

# 3. Test rollback
kubectl rollout undo deployment/ulms-api -n ulms-staging

# 4. Verify rollback success
run_smoke_tests.sh

# 5. Redeploy for actual testing
deploy_staging.sh v2.1.0
```

### 11.2 Quarterly DR Drill

| Activity | Duration | Frequency |
|----------|----------|-----------|
| Full system restore from backup | 4 hours | Quarterly |
| Database PITR test | 2 hours | Monthly |
| Application rollback test | 30 min | Weekly |
| Configuration restore test | 15 min | Weekly |

### 11.3 Rollback Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Rollback Success Rate | > 95% | Successful / Total |
| Rollback Time | < 30 min | Time to full recovery |
| Data Loss | 0 records | Records lost during rollback |
| Verification Time | < 15 min | Post-rollback validation |

---

## 12. Appendices

### Appendix A: Quick Reference Commands

```bash
# Emergency rollback (single command)
kubectl rollout undo deployment/ulms-api -n ulms-production && \
kubectl rollout status deployment/ulms-api -n ulms-production

# Check current version
kubectl get deployment ulms-api -n ulms-production -o jsonpath='{.spec.template.spec.containers[0].image}'

# Database rollback to specific time
pg_restore --clean --if-exists backup.dump

# Config rollback
git checkout HEAD~1 -- k8s/production/ && kubectl apply -k k8s/production/
```

### Appendix B: Rollback Decision Log

| Date | Issue | Decision | Time to Recover | Lessons Learned |
|------|-------|----------|-----------------|-----------------|
| | | | | |

### Appendix C: Related Documents

| Document | ID | Location |
|----------|-----|----------|
| Production Deployment Checklist | ULMS-OPS-PDCL-001 | 8.1_Production_Deployment/ |
| Disaster Recovery Plan | ULMS-OPS-DRP-001 | 8.1_Business_Continuity/ |
| Database Administration Guide | ULMS-SYS-DBA-001 | 8.5_System_Documentation/ |

---

**Document Control Footer**

*Classification: Internal - Critical Operations*
*Next Review: Per Release*
*Owner: DevOps Lead*

**END OF DOCUMENT**

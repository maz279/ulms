# Production Operations Runbook

## ULMS v2.0 - Daily Operations Guide

---

**Document Control**

| Field | Value |
|-------|-------|
| Document ID | ULMS-OPS-POR-002 |
| Version | 1.0 |
| Status | Final |
| Classification | Internal - Bank Operations |
| Effective Date | February 2026 |
| Review Cycle | Monthly |
| Owner | Operations Manager |
| Approver | CTO |

---

## Revision History

| Version | Date | Author | Changes | Approver |
|---------|------|--------|---------|----------|
| 0.1 | 2026-01-10 | Operations Team | Initial structure | - |
| 0.5 | 2026-01-20 | Senior DevOps | Added procedures | - |
| 0.8 | 2026-01-28 | DBA Lead | Added database ops | - |
| 1.0 | 2026-02-05 | Operations Manager | Final release | CTO |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Operational Overview](#2-operational-overview)
3. [Daily Operations Checklist](#3-daily-operations-checklist)
4. [System Startup Procedures](#4-system-startup-procedures)
5. [System Shutdown Procedures](#5-system-shutdown-procedures)
6. [Backup Operations](#6-backup-operations)
7. [Log Management](#7-log-management)
8. [Health Checks](#8-health-checks)
9. [Routine Maintenance](#9-routine-maintenance)
10. [Escalation Procedures](#10-escalation-procedures)
11. [Emergency Procedures](#11-emergency-procedures)
12. [Appendices](#12-appendices)

---

## 1. Introduction

### 1.1 Purpose
This runbook provides step-by-step procedures for the daily operations of the ULMS v2.0 production environment. It serves as the primary reference for operations staff responsible for maintaining system availability and performance.

### 1.2 Scope
- **In Scope**: Daily operational tasks, monitoring, maintenance, backup verification
- **Out of Scope**: Development activities, architectural changes, major upgrades
- **Operating Hours**: 24/7/365 (Banking operations)
- **Maintenance Windows**: Saturday 02:00-06:00 BDT

### 1.3 Target Audience
- Level 1 Operations Staff
- Level 2 Technical Support
- DevOps Engineers
- Database Administrators

### 1.4 Key Operational Metrics

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| System Uptime | 99.9% | < 99.5% | < 99% |
| Response Time | < 2s | 2-5s | > 5s |
| Error Rate | < 0.1% | 0.1-1% | > 1% |
| CPU Utilization | < 70% | 70-85% | > 85% |
| Memory Usage | < 80% | 80-90% | > 90% |
| Disk Usage | < 70% | 70-85% | > 85% |

---

## 2. Operational Overview

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRODUCTION ENVIRONMENT                    │
├─────────────────────────────────────────────────────────────────┤
│  Load Balancer (HAProxy)                                         │
│         │                                                        │
│    ┌────┴────┐                                                   │
│    │         │                                                   │
│ ┌──▼───┐  ┌──▼───┐  ┌──────────────────────────────────────┐    │
│ │App-01│  │App-02│  │         Kubernetes Cluster            │    │
│ └──┬───┘  └──┬───┘  │  ┌─────────┐ ┌─────────┐ ┌─────────┐  │    │
│    │         │      │  │API Pod-1│ │API Pod-2│ │API Pod-3│  │    │
│    └────┬────┘      │  └────┬────┘ └────┬────┘ └────┬────┘  │    │
│         │           │       └───────────┼───────────┘       │    │
│    ┌────┴────┐      │                   │                   │    │
│    │         │      │              ┌────┴────┐              │    │
│ ┌──▼───┐  ┌──▼───┐  │           ┌──▼───┐  ┌──▼───┐          │    │
│ │DB-Primary│ │DB-Replica│  │           │Svc-01│  │Svc-02│          │    │
│ └───────┘  └───────┘  │           └──────┘  └──────┘          │    │
│                       └──────────────────────────────────────┘    │
│                                                                  │
│  Supporting Services: Redis, Kafka, Elasticsearch, Prometheus    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Operational Responsibilities

| Time (BDT) | Activity | Owner | Duration |
|------------|----------|-------|----------|
| 00:00 | Automated backup verification | System | 30 min |
| 06:00 | Morning health check | L1 Ops | 15 min |
| 09:00 | Business hours readiness check | L1 Ops | 10 min |
| 14:00 | Mid-day performance review | L2 Ops | 15 min |
| 18:00 | Evening health check | L1 Ops | 15 min |
| 22:00 | EOD processing verification | L2 Ops | 20 min |
| 02:00 (Sat) | Weekly maintenance window | DevOps | 4 hours |

### 2.3 Service Dependencies

| Service | Dependencies | Impact if Down |
|---------|--------------|----------------|
| ULMS API | PostgreSQL, Redis, Kafka | Complete system outage |
| ULMS Frontend | ULMS API, CDN | User interface unavailable |
| CIB Service | Bangladesh Bank API | New loan processing blocked |
| Reporting | PostgreSQL, Elasticsearch | Reports unavailable |
| Notification | SMS/Email Gateway | Alerts delayed |
| Workflow Engine | Camunda, PostgreSQL | Approval workflows stalled |

---

## 3. Daily Operations Checklist

### 3.1 Morning Shift (06:00 - 14:00)

#### 3.1.1 System Health Verification (06:00)

| Check | Command/Method | Expected Result | Status | Time |
|-------|----------------|-----------------|--------|------|
| All pods running | `kubectl get pods -n ulms-prod` | All Running | ☐ | |
| Node status | `kubectl get nodes` | All Ready | ☐ | |
| Database connectivity | psql connection test | Connected | ☐ | |
| Redis connectivity | redis-cli ping | PONG | ☐ | |
| API response time | curl /actuator/health | < 500ms | ☐ | |
| Error log review | Kibana dashboard | No critical errors | ☐ | |
| Disk space | df -h | < 70% usage | ☐ | |
| Memory usage | free -h | < 80% usage | ☐ | |

**Operator Signature**: _________________ **Time**: _______

#### 3.1.2 Overnight Job Verification (06:15)

| Job Name | Schedule | Status | Last Run | Next Run |
|----------|----------|--------|----------|----------|
| Daily Backup | 00:00 | ☐ | | |
| EOD Interest Calculation | 23:30 | ☐ | | |
| CIB Report Generation | 01:00 | ☐ | | |
| Data Archival | 02:00 | ☐ | | |
| System Cleanup | 03:00 | ☐ | | |

#### 3.1.3 Business Hours Readiness (09:00)

| Item | Verification | Status |
|------|--------------|--------|
| Login portal accessible | Browser test | ☐ |
| Test transaction processed | Create test loan | ☐ |
| Email notifications working | Send test email | ☐ |
| SMS gateway responsive | Send test SMS | ☐ |
| Report generation functional | Generate test report | ☐ |
| Integration endpoints active | Health check | ☐ |

### 3.2 Afternoon Shift (14:00 - 22:00)

#### 3.2.1 Performance Review (14:00)

| Metric | Morning Avg | Threshold | Status |
|--------|-------------|-----------|--------|
| API Response Time | _____ ms | < 2000ms | ☐ |
| Database Query Time | _____ ms | < 500ms | ☐ |
| Active Users | _____ | < 500 | ☐ |
| Concurrent Sessions | _____ | < 200 | ☐ |
| Error Count | _____ | < 10/hour | ☐ |
| CPU Utilization | _____ % | < 70% | ☐ |

#### 3.2.2 Security Monitoring

| Check | Tool | Expected | Actual | Status |
|-------|------|----------|--------|--------|
| Failed logins | SIEM | < 50/hour | | ☐ |
| Unusual access patterns | Splunk | None detected | | ☐ |
| SSL certificate validity | Monitoring | > 30 days | | ☐ |
| Security patch status | OSSEC | Current | | ☐ |
| Firewall logs review | pfSense | No anomalies | | ☐ |

### 3.3 Night Shift (22:00 - 06:00)

#### 3.3.1 End-of-Day Processing (22:00)

| Process | Verification | Status | Remarks |
|---------|--------------|--------|---------|
| All day transactions posted | DB query | ☐ | |
| Tally reconciliation complete | Report check | ☐ | |
| Batch jobs completed | Job monitor | ☐ | |
| Audit logs archived | File check | ☐ | |
| Backup initiated | Backup system | ☐ | |

#### 3.3.2 Overnight Monitoring

| Time | Activity | Automated | Manual Check |
|------|----------|-----------|--------------|
| 00:00 | Backup verification | ☐ | ☐ |
| 02:00 | System resource check | ☐ | ☐ |
| 04:00 | Database health check | ☐ | ☐ |
| 06:00 | Pre-morning checks | ☐ | ☐ |

---

## 4. System Startup Procedures

### 4.1 Complete System Startup

**Use Case**: After maintenance window or unplanned outage

#### Step 1: Infrastructure Layer (15 minutes)

```bash
# 1.1 Verify network connectivity
ping -c 4 gateway.bank.local
ping -c 4 dns.bank.local

# 1.2 Start load balancer
sudo systemctl start haproxy
sudo systemctl status haproxy

# 1.3 Verify storage systems
kubectl get pvc -n ulms-prod
```

#### Step 2: Database Layer (10 minutes)

```bash
# 2.1 Start PostgreSQL primary
sudo systemctl start postgresql@16-main
sudo -u postgres pg_isready

# 2.2 Verify replication
sudo -u postgres psql -c "SELECT * FROM pg_stat_replication;"

# 2.3 Start Redis
sudo systemctl start redis-server
redis-cli ping

# 2.4 Verify Kafka
sudo systemctl start kafka
kafka-topics.sh --list --bootstrap-server localhost:9092
```

#### Step 3: Application Layer (10 minutes)

```bash
# 3.1 Deploy core services
kubectl apply -f k8s/production/namespace.yaml
kubectl apply -f k8s/production/configmaps/
kubectl apply -f k8s/production/secrets/

# 3.2 Deploy databases
kubectl apply -f k8s/production/postgres/
kubectl apply -f k8s/production/redis/

# 3.3 Wait for databases
kubectl wait --for=condition=ready pod -l app=postgres --timeout=300s

# 3.4 Deploy applications
kubectl apply -f k8s/production/apps/
kubectl apply -f k8s/production/ingress/

# 3.5 Verify deployment
kubectl get pods -n ulms-prod
kubectl get svc -n ulms-prod
```

#### Step 4: Verification (15 minutes)

| Test | Command/URL | Expected | Status |
|------|-------------|----------|--------|
| API Health | https://api.ulms.bank.com/actuator/health | UP | ☐ |
| Frontend Load | https://ulms.bank.com | Homepage loads | ☐ |
| Database | psql connection | Connected | ☐ |
| Login | Test user login | Success | ☐ |
| Transaction | Test loan query | Data returned | ☐ |

**Startup Completion Time**: _______ **Operator**: _______

### 4.2 Service-Specific Startup

#### PostgreSQL Database Startup

```bash
# Check current status
sudo systemctl status postgresql@16-main

# If stopped, start service
sudo systemctl start postgresql@16-main

# Verify startup
sudo -u postgres psql -c "SELECT version();"
sudo -u postgres psql -c "SELECT pg_is_in_recovery();"

# Check replication lag (on replica)
sudo -u postgres psql -c "SELECT 
    CASE 
        WHEN pg_last_wal_receive_lsn() = pg_last_wal_replay_lsn() 
        THEN 0 
        ELSE EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))
    END AS lag_seconds;"
```

#### Application Pod Recovery

```bash
# Check pod status
kubectl get pods -n ulms-prod -o wide

# If pods in CrashLoopBackOff
kubectl describe pod <pod-name> -n ulms-prod
kubectl logs <pod-name> -n ulms-prod --previous

# Restart deployment
kubectl rollout restart deployment/ulms-api -n ulms-prod

# Monitor rollout
kubectl rollout status deployment/ulms-api -n ulms-prod
```

---

## 5. System Shutdown Procedures

### 5.1 Planned Shutdown

**Use Case**: Scheduled maintenance, hardware upgrades

#### Step 1: Pre-Shutdown Tasks (15 minutes)

| Task | Command/Action | Verification | Status |
|------|----------------|--------------|--------|
| Notify stakeholders | Send notification | Receipt confirmed | ☐ |
| Disable user access | Maintenance page | Page displayed | ☐ |
| Complete active transactions | Query active sessions | Count = 0 | ☐ |
| Final backup | Trigger manual backup | Backup complete | ☐ |
| Stop batch jobs | Cancel scheduled jobs | Jobs stopped | ☐ |

#### Step 2: Graceful Application Shutdown (10 minutes)

```bash
# 2.1 Scale down application tier
kubectl scale deployment ulms-api --replicas=0 -n ulms-prod
kubectl scale deployment ulms-web --replicas=0 -n ulms-prod
kubectl scale deployment ulms-worker --replicas=0 -n ulms-prod

# 2.2 Wait for pod termination
kubectl wait --for=delete pod -l app=ulms-api --timeout=300s -n ulms-prod

# 2.3 Stop supporting services
kubectl scale deployment camunda --replicas=0 -n ulms-prod
kubectl scale deployment kafka --replicas=0 -n ulms-prod
```

#### Step 3: Database Shutdown (10 minutes)

```bash
# 3.1 Verify no active connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# 3.2 Stop application connections
sudo -u postgres psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE usename = 'ulms_app';"

# 3.3 Checkpoint database
sudo -u postgres psql -c "CHECKPOINT;"

# 3.4 Stop PostgreSQL
sudo systemctl stop postgresql@16-main

# 3.5 Stop Redis
sudo systemctl stop redis-server
sudo systemctl stop redis-sentinel
```

#### Step 4: Infrastructure Shutdown (5 minutes)

```bash
# 4.1 Stop load balancer
sudo systemctl stop haproxy

# 4.2 Unmount storage (if required)
sudo umount /data/ulms

# 4.3 Verify shutdown
systemctl list-units --state=running | grep -E "postgres|redis|haproxy"
```

**Shutdown Completion Time**: _______ **Operator**: _______

### 5.2 Emergency Shutdown

**Use Case**: Security incident, critical system failure

```bash
# Immediate application shutdown
kubectl delete deployments --all -n ulms-prod

# Immediate database shutdown
sudo systemctl stop postgresql@16-main

# Document reason and time
echo "Emergency shutdown initiated at $(date) by $USER" >> /var/log/ulms/emergency_shutdown.log
```

---

## 6. Backup Operations

### 6.1 Backup Schedule

| Backup Type | Frequency | Retention | Storage Location |
|-------------|-----------|-----------|------------------|
| Full Database | Daily 00:00 | 30 days | On-premise + Cloud |
| Incremental | Every 4 hours | 7 days | On-premise |
| WAL Archiving | Continuous | 14 days | Cloud |
| Configuration | Weekly (Sat) | 12 months | Git + Cloud |
| Application Code | On release | Forever | Git repository |
| File Storage | Daily 01:00 | 90 days | Object storage |

### 6.2 Manual Backup Procedure

#### Database Backup

```bash
#!/bin/bash
# manual_backup.sh - Run as postgres user

BACKUP_DIR="/backup/ulms/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Full database backup
pg_dump -h localhost -U postgres -d ulms_production \
    -Fc -f $BACKUP_DIR/ulms_full_$(date +%H%M).dump

# Verify backup
pg_restore -l $BACKUP_DIR/ulms_full_$(date +%H%M).dump > /dev/null && echo "Backup OK" || echo "Backup FAILED"

# Sync to cloud
aws s3 sync $BACKUP_DIR s3://ulms-backups/$(date +%Y%m%d)/
```

#### Kubernetes Resources Backup

```bash
#!/bin/bash
# backup_k8s.sh

BACKUP_DIR="/backup/k8s/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Export all resources
kubectl get all -n ulms-prod -o yaml > $BACKUP_DIR/resources.yaml
kubectl get configmaps -n ulms-prod -o yaml > $BACKUP_DIR/configmaps.yaml
kubectl get secrets -n ulms-prod -o yaml > $BACKUP_DIR/secrets.yaml
kubectl get ingress -n ulms-prod -o yaml > $BACKUP_DIR/ingress.yaml

# Compress and upload
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
aws s3 cp $BACKUP_DIR.tar.gz s3://ulms-k8s-backups/
```

### 6.3 Backup Verification

| Verification Step | Command | Frequency | Status |
|-------------------|---------|-----------|--------|
| Backup file exists | ls -lh | Daily | ☐ |
| Backup size check | du -h | Daily | ☐ |
| Test restore (dev) | pg_restore | Weekly | ☐ |
| Checksum verification | sha256sum | Daily | ☐ |
| Cloud sync verification | aws s3 ls | Daily | ☐ |

---

## 7. Log Management

### 7.1 Log Locations

| Log Type | Location | Retention | Rotation |
|----------|----------|-----------|----------|
| Application Logs | /var/log/ulms/app/ | 30 days | Daily |
| Database Logs | /var/log/postgresql/ | 14 days | Daily |
| System Logs | /var/log/syslog | 30 days | Weekly |
| Kubernetes Logs | ELK Stack | 90 days | Automated |
| Audit Logs | /var/log/ulms/audit/ | 7 years | Monthly |
| Access Logs | /var/log/nginx/ | 30 days | Daily |

### 7.2 Log Rotation Procedure

```bash
# Manual log rotation
sudo logrotate -f /etc/logrotate.d/ulms

# Verify rotation
ls -lh /var/log/ulms/app/*.log*

# Archive old logs
tar -czf /archive/logs/ulms_$(date +%Y%m%d).tar.gz /var/log/ulms/app/*.log.1
```

### 7.3 Log Analysis Commands

```bash
# Search for errors in last hour
grep -i "error" /var/log/ulms/app/application.log | tail -100

# Find slow queries
sudo -u postgres cat /var/log/postgresql/postgresql-slow.log | grep "duration:" | tail -50

# Check API error rate
grep "500" /var/log/nginx/access.log | wc -l

# Search by request ID
grep "req-id-12345" /var/log/ulms/app/*.log
```

---

## 8. Health Checks

### 8.1 Automated Health Checks

The following checks run automatically every 5 minutes via monitoring system:

| Check | Endpoint | Warning Threshold | Critical Threshold |
|-------|----------|-------------------|-------------------|
| API Availability | /actuator/health | Response > 5s | No response |
| Database Connectivity | TCP 5432 | Connection > 2s | No connection |
| Disk Space | /data | > 80% | > 90% |
| Memory Usage | System | > 85% | > 95% |
| Queue Depth | Kafka | > 1000 | > 5000 |
| SSL Expiry | Certificate | < 30 days | < 7 days |

### 8.2 Manual Health Check Script

```bash
#!/bin/bash
# health_check.sh

echo "=== ULMS Production Health Check ==="
echo "Timestamp: $(date)"
echo ""

# Check Kubernetes
echo "--- Kubernetes Status ---"
kubectl get nodes -o wide
echo ""

# Check Pods
echo "--- Pod Status ---"
kubectl get pods -n ulms-prod
echo ""

# Check API Health
echo "--- API Health ---"
curl -s -o /dev/null -w "%{http_code} %{time_total}s" https://api.ulms.bank.com/actuator/health
echo ""

# Check Database
echo "--- Database Status ---"
sudo -u postgres pg_isready
echo ""

# Check Redis
echo "--- Redis Status ---"
redis-cli ping
echo ""

# Check Disk Space
echo "--- Disk Usage ---"
df -h | grep -E "Filesystem|/data|/var"
echo ""

# Check Memory
echo "--- Memory Usage ---"
free -h
echo ""

echo "=== Health Check Complete ==="
```

---

## 9. Routine Maintenance

### 9.1 Weekly Maintenance (Saturday 02:00-06:00)

| Task | Duration | Procedure | Verification |
|------|----------|-----------|--------------|
| Security updates | 1 hour | apt update && apt upgrade | reboot if needed |
| Database vacuum | 2 hours | VACUUM ANALYZE | pg_stat_user_tables |
| Log archival | 30 min | Compress and move logs | Archive verified |
| Certificate check | 15 min | Verify SSL expiry | > 30 days remaining |
| Performance review | 30 min | Review weekly metrics | Report generated |

### 9.2 Monthly Maintenance

| Task | Duration | Owner |
|------|----------|-------|
| Full system backup test | 4 hours | DBA |
| Disaster recovery drill | 2 hours | Operations |
| Access review | 1 hour | Security |
| Capacity planning review | 1 hour | Infrastructure |
| Patch management | 2 hours | DevOps |

### 9.3 Quarterly Maintenance

| Task | Duration | Owner |
|------|----------|-------|
| Security audit | 8 hours | Security Team |
| Penetration test | 16 hours | External Vendor |
| DR site failover test | 4 hours | Operations |
| Compliance review | 4 hours | Compliance |

---

## 10. Escalation Procedures

### 10.1 Escalation Matrix

| Severity | Definition | Response Time | Escalation Path |
|----------|------------|---------------|-----------------|
| P1 - Critical | Complete system down, data loss | 15 minutes | L1 → L2 → Manager → CTO |
| P2 - High | Major feature unavailable, significant impact | 30 minutes | L1 → L2 → Manager |
| P3 - Medium | Minor feature issue, workaround exists | 2 hours | L1 → L2 |
| P4 - Low | Cosmetic issues, enhancement requests | 24 hours | L1 |

### 10.2 Escalation Contacts

| Level | Name | Role | Contact | Hours |
|-------|------|------|---------|-------|
| L1 | On-call Engineer | Operations | +880-__________ | 24/7 |
| L2 | Senior DevOps | Technical Lead | +880-__________ | 24/7 |
| L3 | Operations Manager | Manager | +880-__________ | 08:00-22:00 |
| L4 | CTO | Executive | +880-__________ | On-demand |

---

## 11. Emergency Procedures

### 11.1 Database Corruption

```bash
# 1. Stop application access
kubectl scale deployment ulms-api --replicas=0 -n ulms-prod

# 2. Assess corruption
sudo -u postgres psql -c "SELECT pg_database.datname, pg_database_size(pg_database.datname) FROM pg_database WHERE datname = 'ulms_production';"

# 3. If corruption confirmed, initiate failover
# Promote replica to primary
sudo -u postgres pg_ctl promote -D /var/lib/postgresql/16/main

# 4. Update connection strings
# Edit application config to point to new primary

# 5. Restore corrupted primary (background)
pg_basebackup -h new-primary -D /var/lib/postgresql/16/main -U replicator -v -P -W
```

### 11.2 Security Breach Response

| Step | Action | Owner | Time |
|------|--------|-------|------|
| 1 | Isolate affected systems | L1 | Immediate |
| 2 | Preserve evidence (snapshots, logs) | L2 | 15 min |
| 3 | Notify security team | L1 | 15 min |
| 4 | Assess scope of breach | Security | 1 hour |
| 5 | Implement containment | L2 | 2 hours |
| 6 | Begin eradication | Security | 4 hours |
| 7 | Recovery and restoration | L2 | 8 hours |
| 8 | Post-incident review | All | 24 hours |

---

## 12. Appendices

### Appendix A: Quick Command Reference

```bash
# Get all pods
kubectl get pods -n ulms-prod

# Check pod logs
kubectl logs -f <pod-name> -n ulms-prod

# Execute command in pod
kubectl exec -it <pod-name> -n ulms-prod -- /bin/bash

# Port forward for debugging
kubectl port-forward svc/ulms-api 8080:8080 -n ulms-prod

# Check resource usage
kubectl top pods -n ulms-prod

# Restart deployment
kubectl rollout restart deployment/ulms-api -n ulms-prod
```

### Appendix B: Monitoring Dashboard URLs

| Dashboard | URL | Purpose |
|-----------|-----|---------|
| Grafana | https://grafana.bank.com | Metrics visualization |
| Kibana | https://kibana.bank.com | Log analysis |
| Prometheus | https://prometheus.bank.com | Metrics collection |
| AlertManager | https://alerts.bank.com | Alert management |

### Appendix C: Related Documents

| Document | ID | Location |
|----------|-----|----------|
| Incident Response Plan | ULMS-OPS-IRP-001 | 8.2_Operations_Support/ |
| Rollback Procedures | ULMS-OPS-RB-001 | 8.1_Production_Deployment/ |
| Database Administration Guide | ULMS-SYS-DBA-001 | 8.5_System_Documentation/ |

---

**Document Control Footer**

*Classification: Internal - Bank Operations*
*Next Review: [Monthly from Effective Date]*
*Owner: Operations Manager*

**END OF DOCUMENT**

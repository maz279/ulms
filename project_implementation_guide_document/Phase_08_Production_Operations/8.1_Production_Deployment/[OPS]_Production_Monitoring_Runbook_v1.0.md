# Production Monitoring Runbook

## ULMS v2.0 - Monitoring & Alerting Guide

---

**Document Control**

| Field | Value |
|-------|-------|
| Document ID | ULMS-OPS-PMR-003 |
| Version | 1.0 |
| Status | Final |
| Classification | Internal - Operations |
| Effective Date | February 2026 |
| Review Cycle | Monthly |
| Owner | Monitoring Lead |
| Approver | Operations Manager |

---

## Revision History

| Version | Date | Author | Changes | Approver |
|---------|------|--------|---------|----------|
| 0.1 | 2026-01-05 | Monitoring Team | Initial draft | - |
| 0.5 | 2026-01-15 | DevOps Lead | Added dashboards | - |
| 0.8 | 2026-01-25 | SRE Lead | Added runbooks | - |
| 1.0 | 2026-02-05 | Monitoring Lead | Final release | Operations Manager |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Monitoring Architecture](#2-monitoring-architecture)
3. [Monitoring Components](#3-monitoring-components)
4. [Alert Management](#4-alert-management)
5. [Dashboards](#5-dashboards)
6. [Metric Definitions](#6-metric-definitions)
7. [Alert Response Procedures](#7-alert-response-procedures)
8. [Log Monitoring](#8-log-monitoring)
9. [Synthetic Monitoring](#9-synthetic-monitoring)
10. [Capacity Monitoring](#10-capacity-monitoring)
11. [Security Monitoring](#11-security-monitoring)
12. [Escalation Procedures](#12-escalation-procedures)
13. [Appendices](#13-appendices)

---

## 1. Introduction

### 1.1 Purpose
This runbook defines the comprehensive monitoring strategy for ULMS v2.0 production environment, including metric collection, alerting thresholds, and response procedures.

### 1.2 Scope
- Infrastructure monitoring (servers, network, storage)
- Application monitoring (APIs, services, databases)
- Business process monitoring (transactions, workflows)
- Security monitoring (access, threats, anomalies)
- Compliance monitoring (audit trails, SLAs)

### 1.3 Monitoring SLAs

| Metric | Target | Measurement |
|--------|--------|-------------|
| Monitoring Availability | 99.99% | Uptime of monitoring stack |
| Alert Latency | < 30 seconds | Time from trigger to notification |
| Dashboard Refresh | < 5 seconds | Data freshness on dashboards |
| Log Ingestion | < 1 minute | Time from log to searchable |
| Metric Retention | 15 months | Historical data availability |

### 1.4 Monitoring Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Metrics Collection | Prometheus | 2.48 | Time-series metrics |
| Visualization | Grafana | 10.2 | Dashboards and alerting |
| Log Aggregation | ELK Stack | 8.11 | Centralized logging |
| APM | Jaeger | 1.50 | Distributed tracing |
| Uptime Monitoring | Blackbox Exporter | 0.24 | Synthetic checks |
| Alerting | Alertmanager | 0.26 | Alert routing |

---

## 2. Monitoring Architecture

### 2.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     MONITORING ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐   │
│  │  ULMS    │    │  ULMS    │    │PostgreSQL│    │  Redis   │   │
│  │   API    │    │   Web    │    │          │    │          │   │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘   │
│       │               │               │               │         │
│       │ Metrics       │ Metrics       │ Metrics       │         │
│       │ (Port 9090)   │ (Port 9090)   │ (Exporter)    │         │
│       │               │               │               │         │
│       └───────────────┴───────────────┴───────────────┘         │
│                       │                                          │
│                       ▼                                          │
│              ┌─────────────────┐                                 │
│              │   Prometheus    │                                 │
│              │   (Collection)  │                                 │
│              └────────┬────────┘                                 │
│                       │                                          │
│          ┌────────────┼────────────┐                            │
│          │            │            │                            │
│          ▼            ▼            ▼                            │
│     ┌────────┐  ┌──────────┐  ┌──────────┐                     │
│     │Grafana │  │Alertmanager│ │  ELK     │                     │
│     │(Visual)│  │ (Alerts)   │ │ (Logs)   │                     │
│     └────────┘  └──────────┘  └──────────┘                     │
│          │            │            │                            │
│          └────────────┼────────────┘                            │
│                       ▼                                          │
│              ┌─────────────────┐                                 │
│              │  Notification   │                                 │
│              │  Channels       │                                 │
│              │  (Email, SMS,   │                                 │
│              │   Slack, Pager) │                                 │
│              └─────────────────┘                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

| Stage | Component | Data Type | Retention |
|-------|-----------|-----------|-----------|
| Collection | Prometheus | Metrics | 15 days (local) |
| Long-term | Thanos/VictoriaMetrics | Metrics | 15 months |
| Real-time | Grafana | Dashboards | Live |
| Storage | Elasticsearch | Logs | 90 days hot, 1 year cold |
| Archival | S3 Glacier | Audit logs | 7 years |

---

## 3. Monitoring Components

### 3.1 Prometheus Configuration

```yaml
# prometheus.yml - Key sections
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - /etc/prometheus/rules/*.yml

scrape_configs:
  - job_name: 'ulms-api'
    static_configs:
      - targets: ['ulms-api-1:9090', 'ulms-api-2:9090']
    metrics_path: '/actuator/prometheus'
    
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
      
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
```

### 3.2 Monitored Endpoints

| Service | Endpoint | Port | Interval | Timeout |
|---------|----------|------|----------|---------|
| ULMS API | /actuator/prometheus | 9090 | 15s | 10s |
| ULMS API Health | /actuator/health | 8080 | 30s | 5s |
| PostgreSQL | /metrics | 9187 | 15s | 10s |
| Redis | /metrics | 9121 | 15s | 10s |
| Node Exporter | /metrics | 9100 | 15s | 10s |
| Blackbox | /probe | 9115 | 60s | 10s |
| Kafka | /metrics | 9308 | 15s | 10s |

### 3.3 Custom Metrics

| Metric Name | Type | Description | Labels |
|-------------|------|-------------|--------|
| ulms_loan_applications_total | Counter | Total loan applications | status, branch |
| ulms_loan_processing_duration_seconds | Histogram | Loan processing time | type |
| ulms_cib_queries_total | Counter | CIB queries made | status |
| ulms_active_users | Gauge | Current active users | role |
| ulms_report_generation_duration | Histogram | Report generation time | report_type |
| ulms_workflow_instances | Gauge | Active workflow instances | workflow_type |

---

## 4. Alert Management

### 4.1 Alert Severity Levels

| Severity | Color | Response Time | Page On-Call |
|----------|-------|---------------|--------------|
| Critical | Red | Immediate | Yes |
| Warning | Orange | 15 minutes | No |
| Info | Blue | 1 hour | No |
| OK | Green | N/A | N/A |

### 4.2 Alert Routing

```yaml
# alertmanager.yml
route:
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty-critical'
      continue: true
    - match:
        severity: warning
      receiver: 'slack-warnings'
    - match:
        alertname: ULMSHighErrorRate
      receiver: 'operations-team'

receivers:
  - name: 'default'
    email_configs:
      - to: 'ops@bank.com'
  
  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: '<key>'
        severity: critical
  
  - name: 'slack-warnings'
    slack_configs:
      - api_url: '<webhook>'
        channel: '#ulms-alerts'
```

### 4.3 Critical Alerts

| Alert Name | Condition | Threshold | Action |
|------------|-----------|-----------|--------|
| ULMSDown | API health check fails | 2 minutes | Page on-call |
| DatabaseDown | PostgreSQL connection fails | 1 minute | Page on-call |
| HighErrorRate | Error rate > threshold | 5% for 5m | Page on-call |
| DiskFull | Disk usage critical | > 90% | Page on-call |
| MemoryExhausted | Memory usage critical | > 95% | Page on-call |
| SSLExpiringSoon | Certificate expiry | < 7 days | Notify team |
| BackupFailed | Backup job failure | Any failure | Create ticket |

### 4.4 Warning Alerts

| Alert Name | Condition | Threshold | Action |
|------------|-----------|-----------|--------|
| HighCPU | CPU usage high | > 80% for 10m | Slack notification |
| HighMemory | Memory usage high | > 85% for 10m | Slack notification |
| SlowQueries | Database slow queries | > 10/min | Slack notification |
| PodRestarting | Pod restarting frequently | > 3 restarts/10m | Slack notification |
| QueueDepthHigh | Message queue backing up | > 1000 messages | Slack notification |
| ResponseTimeHigh | API response slow | > 3s p95 | Slack notification |

---

## 5. Dashboards

### 5.1 Dashboard Inventory

| Dashboard | URL | Purpose | Refresh |
|-----------|-----|---------|---------|
| ULMS Overview | /d/ulms-overview | System health summary | 30s |
| Application Performance | /d/ulms-app-perf | API metrics | 10s |
| Database Performance | /d/ulms-db-perf | PostgreSQL metrics | 30s |
| Infrastructure | /d/ulms-infra | Server resources | 30s |
| Business Metrics | /d/ulms-business | Loan processing KPIs | 1m |
| Security Audit | /d/ulms-security | Security events | 1m |
| Compliance | /d/ulms-compliance | Regulatory metrics | 5m |

### 5.2 ULMS Overview Dashboard

**Panel Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    ULMS SYSTEM OVERVIEW                          │
├─────────────────────────────────────────────────────────────────┤
│  [System Status]  [Active Users]  [Loans Today]  [Error Rate]   │
│     [🟢 UP]         [125]            [47]          [0.02%]      │
├─────────────────────────────────────────────────────────────────┤
│  [API Response Time Graph - Last 6 Hours]                       │
│  ═══════════════════════════════════════════════════════════    │
├─────────────────────────────────────────────────────────────────┤
│  [CPU Usage]    [Memory Usage]    [Disk Usage]    [Network]     │
│  [▓▓▓░░ 45%]    [▓▓▓▓░ 60%]     [▓▓░░░ 35%]    [↕ 50Mbps]    │
├─────────────────────────────────────────────────────────────────┤
│  [Database Connections]    [Active Workflows]    [Queue Depth]  │
│       [45/100]                  [23]                [12]        │
├─────────────────────────────────────────────────────────────────┤
│  [Recent Alerts Table]                                          │
│  [Time] [Severity] [Alert] [Status]                             │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Application Performance Dashboard

**Key Metrics:**

| Panel | Metric | Visualization | Threshold |
|-------|--------|---------------|-----------|
| Request Rate | rate(http_requests_total[5m]) | Graph | N/A |
| Error Rate | rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) | Graph | > 1% |
| Latency p50 | histogram_quantile(0.5, http_request_duration_seconds_bucket) | Graph | < 500ms |
| Latency p95 | histogram_quantile(0.95, http_request_duration_seconds_bucket) | Graph | < 2000ms |
| Latency p99 | histogram_quantile(0.99, http_request_duration_seconds_bucket) | Graph | < 5000ms |
| Top 5 Slow Endpoints | TopK(5, avg by (uri) (http_request_duration_seconds)) | Table | N/A |
| Error Breakdown | sum by (status) (increase(http_requests_total[1h])) | Pie Chart | N/A |

### 5.4 Database Performance Dashboard

**Key Metrics:**

| Panel | Metric | Source | Alert |
|-------|--------|--------|-------|
| Active Connections | pg_stat_activity_count | postgres_exporter | > 80 |
| Connection Saturation | connections / max_connections * 100 | Calculated | > 80% |
| Transactions/sec | pg_stat_database_xact_commit + xact_rollback | postgres_exporter | N/A |
| Cache Hit Ratio | blks_hit / (blks_hit + blks_read) | postgres_exporter | < 95% |
| Lock Waits | pg_locks_count{mode=~".*Lock"} | postgres_exporter | > 10 |
| Replication Lag | pg_stat_replication_pg_wal_lsn_diff | postgres_exporter | > 1GB |
| Slow Queries | Count of queries > 1s | pg_stat_statements | > 10/min |

---

## 6. Metric Definitions

### 6.1 Application Metrics

| Metric | Unit | Collection Method | Business Impact |
|--------|------|-------------------|-----------------|
| ulms_loan_volume_daily | Count | Application counter | Business KPI |
| ulms_disbursement_amount | BDT | Application gauge | Financial reporting |
| ulms_cib_response_time | Seconds | Application timer | Customer experience |
| ulms_workflow_completion_rate | Percentage | Calculated | Process efficiency |
| ulms_user_session_duration | Minutes | Application timer | User engagement |

### 6.2 Infrastructure Metrics

| Metric | Unit | Source | Threshold |
|--------|------|--------|-----------|
| node_cpu_seconds_total | Seconds | node_exporter | > 80% |
| node_memory_MemAvailable_bytes | Bytes | node_exporter | < 20% |
| node_filesystem_avail_bytes | Bytes | node_exporter | < 10% |
| node_network_receive_bytes_total | Bytes | node_exporter | N/A |
| container_cpu_usage_seconds_total | Seconds | cAdvisor | > 80% |
| container_memory_usage_bytes | Bytes | cAdvisor | > 85% |

### 6.3 Database Metrics

| Metric | Unit | Source | Threshold |
|--------|------|--------|-----------|
| pg_stat_database_numbackends | Count | postgres_exporter | > 80 |
| pg_stat_database_xact_commit | Count | postgres_exporter | N/A |
| pg_stat_database_xact_rollback | Count | postgres_exporter | > 1% |
| pg_stat_database_deadlocks | Count | postgres_exporter | > 0 |
| pg_stat_database_temp_bytes | Bytes | postgres_exporter | > 1GB |
| pg_stat_user_tables_seq_scan | Count | postgres_exporter | Monitor trends |

---

## 7. Alert Response Procedures

### 7.1 ULMSDown Alert Response

```
ALERT: ULMSDown
SEVERITY: Critical
CONDITION: API health endpoint returns non-200 for 2 minutes

RESPONSE PROCEDURE:

1. ACKNOWLEDGE (0-2 minutes)
   □ Acknowledge alert in PagerDuty
   □ Post in #incident-response Slack channel
   □ Begin timer for response tracking

2. INITIAL ASSESSMENT (2-5 minutes)
   □ Check if issue is isolated or widespread
     $ curl -s https://api.ulms.bank.com/actuator/health
   □ Check Kubernetes pod status
     $ kubectl get pods -n ulms-prod
   □ Check load balancer status
     $ curl -s http://haproxy:8404/stats

3. DIAGNOSIS (5-15 minutes)
   IF pods are CrashLoopBackOff:
     □ Check pod logs: kubectl logs <pod> -n ulms-prod --previous
     □ Check resource limits: kubectl describe pod <pod> -n ulms-prod
     □ Check for OOMKilled events
   
   IF pods are Running but unhealthy:
     □ Check application logs in Kibana
     □ Check database connectivity from pod
     □ Verify configuration (ConfigMaps, Secrets)
   
   IF all pods are fine:
     □ Check network connectivity
     □ Check load balancer configuration
     □ Check SSL certificate validity

4. RESOLUTION (15-30 minutes)
   □ Apply fix based on diagnosis
   □ Verify health endpoint returns 200
   □ Run smoke tests
   □ Monitor for 10 minutes

5. COMMUNICATION
   □ Update stakeholders every 15 minutes
   □ Post resolution in Slack
   □ Create post-mortem ticket
```

### 7.2 DatabaseDown Alert Response

```
ALERT: DatabaseDown
SEVERITY: Critical
CONDITION: PostgreSQL connection fails for 1 minute

RESPONSE PROCEDURE:

1. ACKNOWLEDGE (0-1 minute)
   □ Acknowledge alert
   □ Notify DBA on-call

2. INITIAL CHECKS (1-5 minutes)
   □ Check PostgreSQL process
     $ sudo systemctl status postgresql@16-main
   □ Check disk space on DB server
     $ df -h
   □ Check for locks or blocking queries
     $ sudo -u postgres psql -c "SELECT * FROM pg_locks WHERE NOT granted;"

3. IF PRIMARY IS DOWN:
   □ Initiate failover to replica
   □ Update application connection strings
   □ Verify application recovery

4. IF REPLICA IS DOWN:
   □ Application continues on primary
   □ Schedule replica rebuild during maintenance window

5. POST-RECOVERY
   □ Verify data consistency
   □ Review logs for root cause
   □ Update runbook if needed
```

### 7.3 HighErrorRate Alert Response

```
ALERT: HighErrorRate
SEVERITY: Critical
CONDITION: Error rate > 5% for 5 minutes

RESPONSE PROCEDURE:

1. ACKNOWLEDGE (0-2 minutes)
   □ Acknowledge alert

2. IDENTIFY ERROR PATTERN (2-10 minutes)
   □ Check Kibana for error spikes
     index: ulms-logs, last 15 minutes
   □ Identify top error types
   □ Check if errors correlate with deployment
   □ Check external dependencies (CIB, CBS, etc.)

3. COMMON SCENARIOS:
   
   SCENARIO: Database connection errors
   □ Check connection pool status
   □ Check for connection leaks
   □ Consider restarting affected pods
   
   SCENARIO: CIB service errors
   □ Check CIB service health
   □ Verify network connectivity to Bangladesh Bank
   □ Check API credentials
   
   SCENARIO: Timeout errors
   □ Check slow query log
   □ Check external API response times
   □ Consider scaling if load-related

4. MITIGATION
   □ If new deployment caused issue: Consider rollback
   □ If external dependency: Enable circuit breaker
   □ If resource constraint: Scale horizontally

5. VERIFICATION
   □ Monitor error rate for 15 minutes
   □ Confirm error rate < 1%
```

---

## 8. Log Monitoring

### 8.1 Log Sources

| Source | Path | Index Pattern | Retention |
|--------|------|---------------|-----------|
| ULMS API | /var/log/ulms/app.log | ulms-app-* | 90 days |
| ULMS Worker | /var/log/ulms/worker.log | ulms-worker-* | 90 days |
| PostgreSQL | /var/log/postgresql/ | postgres-* | 30 days |
| Nginx Access | /var/log/nginx/access.log | nginx-access-* | 30 days |
| Nginx Error | /var/log/nginx/error.log | nginx-error-* | 30 days |
| Audit Logs | /var/log/ulms/audit/ | ulms-audit-* | 7 years |
| Kubernetes | Container stdout | k8s-* | 30 days |

### 8.2 Kibana Search Queries

```
# Find all errors in last hour
index: ulms-app-*
level: ERROR
@timestamp: [now-1h TO now]

# Find slow requests (> 5 seconds)
index: ulms-app-*
response_time: > 5000

# Find specific user activity
index: ulms-audit-*
user_id: "USER123"
@timestamp: [now-24h TO now]

# Find failed login attempts
index: ulms-app-*
event: "LOGIN_FAILED"
@timestamp: [now-1h TO now]

# Find CIB integration errors
index: ulms-app-*
message: "CIB" AND level: ERROR
```

### 8.3 Log-Based Alerts

| Alert Name | Query | Threshold | Action |
|------------|-------|-----------|--------|
| ErrorSpike | level:ERROR | > 100/min | Notify |
| LoginBruteForce | event:LOGIN_FAILED | > 10/user/5min | Block IP |
| DataExportAnomaly | event:EXPORT | > 1000 records | Notify Security |
| PrivilegeEscalation | event:PRIVILEGE_CHANGE | Any | Notify Security |
| AfterHoursAccess | @timestamp:[22:00 TO 06:00] AND level:ERROR | > 10 | Notify |

---

## 9. Synthetic Monitoring

### 9.1 Blackbox Exporter Configuration

```yaml
# blackbox.yml
modules:
  http_2xx:
    prober: http
    timeout: 5s
    http:
      valid_http_versions: ["HTTP/1.1", "HTTP/2.0"]
      valid_status_codes: [200]
      method: GET
      follow_redirects: true
      fail_if_ssl: false
      tls_config:
        insecure_skip_verify: false

  http_post_2xx:
    prober: http
    http:
      method: POST
      headers:
        Content-Type: application/json
```

### 9.2 Synthetic Tests

| Test Name | Target | Frequency | Expected | Alert On |
|-----------|--------|-----------|----------|----------|
| API Health | https://api.ulms.bank.com/actuator/health | 30s | HTTP 200 | 2 failures |
| Frontend Home | https://ulms.bank.com | 30s | HTTP 200 | 2 failures |
| Login API | https://api.ulms.bank.com/auth/login | 60s | HTTP 200 | 2 failures |
| Database Connectivity | TCP localhost:5432 | 30s | Connection OK | 1 failure |
| CIB Integration | https://api.ulms.bank.com/health/cib | 60s | HTTP 200 | 3 failures |
| CBS Integration | https://api.ulms.bank.com/health/cbs | 60s | HTTP 200 | 3 failures |

### 9.3 Transaction Simulation

| Scenario | Steps | Frequency | SLA |
|----------|-------|-----------|-----|
| Complete Loan Application | Login → Create → Submit → Check | 15 min | < 30s |
| Credit Bureau Check | Login → Query CIB → Receive Report | 15 min | < 5s |
| Report Generation | Login → Generate → Download | 1 hour | < 10s |
| Payment Processing | Login → Record Payment → Verify | 30 min | < 5s |

---

## 10. Capacity Monitoring

### 10.1 Capacity Metrics

| Resource | Current | Capacity | Threshold | Forecast |
|----------|---------|----------|-----------|----------|
| CPU Cores | 32 | 64 | 70% | Q2 2026 |
| Memory (GB) | 128 | 256 | 80% | Q3 2026 |
| Storage (TB) | 2.5 | 5 | 70% | Q4 2026 |
| DB Connections | 80 | 200 | 80% | Q2 2026 |
| Concurrent Users | 200 | 500 | 80% | Q1 2026 |

### 10.2 Growth Trends

```promql
# User growth trend (weekly)
avg_over_time(ulms_active_users[1w])

# Storage growth rate
derivative(pg_database_size_bytes[1d])

# Transaction volume growth
rate(ulms_loan_applications_total[1w])
```

### 10.3 Capacity Alerts

| Alert | Condition | Lead Time | Action |
|-------|-----------|-----------|--------|
| Storage80Percent | Disk > 80% | 30 days | Plan expansion |
| CPUScalingNeeded | CPU > 75% sustained | 14 days | Add nodes |
| DBConnectionLimit | Connections > 70% | 7 days | Increase pool |
| LicenseExpiry | < 30 days | 30 days | Renew licenses |

---

## 11. Security Monitoring

### 11.1 Security Metrics

| Metric | Collection | Threshold | Response |
|--------|------------|-----------|----------|
| Failed Logins | Application logs | > 50/hour | Investigate |
| Privilege Escalation | Audit logs | Any | Immediate |
| Data Export Volume | Application logs | > 10000 records | Review |
| After-Hours Access | Audit logs | Unusual pattern | Verify |
| API Key Usage | Gateway logs | Unusual spike | Verify |
| SQL Injection Attempts | WAF logs | Any | Block IP |

### 11.2 SIEM Integration

| Event Type | Severity | Correlation Rule |
|------------|----------|------------------|
| Multiple Failed Logins | High | > 5 from same IP in 10 min |
| Account Lockout | Medium | Any account lockout |
| Password Change | Low | Outside business hours |
| Role Change | High | By non-admin user |
| Data Export | Medium | > 1000 records |
| Configuration Change | High | Production environment |

### 11.3 Compliance Monitoring

| Requirement | Metric | Frequency | Evidence |
|-------------|--------|-----------|----------|
| BRPD 15/2024 Audit Trail | Audit log completeness | Daily | Log verification |
| Access Review | User access audit | Monthly | Report |
| Session Timeout | Inactive session duration | Real-time | Alert if > 30min |
| Data Retention | Archive status | Weekly | Archive logs |
| Encryption Status | At-rest and in-transit | Daily | Config check |

---

## 12. Escalation Procedures

### 12.1 On-Call Schedule

| Day | Primary | Secondary | Manager |
|-----|---------|-----------|---------|
| Mon-Wed | Engineer A | Engineer B | Manager X |
| Thu-Sat | Engineer C | Engineer D | Manager X |
| Sun | Engineer E | Engineer A | Manager Y |

### 12.2 Escalation Matrix

| Time Elapsed | Action | Contact |
|--------------|--------|---------|
| 0 min | Page on-call | Primary |
| 15 min | Escalate to secondary | Secondary |
| 30 min | Manager notification | Manager |
| 1 hour | Director notification | Director |
| 2 hours | Executive notification | CTO/CIO |

### 12.3 Communication Templates

```
INCIDENT NOTIFICATION TEMPLATE:

Subject: [INCIDENT] ULMS - [Severity] - [Brief Description]

Impact: [Service affected, user impact]
Start Time: [Timestamp]
Status: [Investigating/Identified/Monitoring/Resolved]

Description:
[Detailed description of the issue]

Actions Taken:
[Steps taken so far]

Next Update: [Time]
Incident Commander: [Name]
```

---

## 13. Appendices

### Appendix A: Monitoring URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Grafana | https://grafana.bank.com | SSO |
| Prometheus | https://prometheus.bank.com | Ops team only |
| Alertmanager | https://alerts.bank.com | Ops team only |
| Kibana | https://kibana.bank.com | SSO |
| Jaeger | https://jaeger.bank.com | Dev team |

### Appendix B: Common Queries

```promql
# API request rate by endpoint
sum by (uri) (rate(http_requests_total[5m]))

# Error rate percentage
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100

# Database slow queries
pg_stat_statements_mean_time > 1000

# Pod memory usage
topk(10, container_memory_usage_bytes{namespace="ulms-prod"})
```

### Appendix C: Related Documents

| Document | ID | Location |
|----------|-----|----------|
| Incident Response Plan | ULMS-OPS-IRP-001 | 8.2_Operations_Support/ |
| Production Operations Runbook | ULMS-OPS-POR-002 | 8.1_Production_Deployment/ |
| System Administration Manual | ULMS-SYS-ADM-001 | 8.5_System_Documentation/ |

---

**Document Control Footer**

*Classification: Internal - Operations*
*Next Review: [Monthly from Effective Date]*
*Owner: Monitoring Lead*

**END OF DOCUMENT**

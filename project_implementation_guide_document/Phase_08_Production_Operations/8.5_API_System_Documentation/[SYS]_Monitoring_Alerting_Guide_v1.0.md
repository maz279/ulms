# Monitoring & Alerting Guide

## ULMS v2.0 - Monitoring Setup and Configuration

---

**Document Control**

| Field | Value |
|-------|-------|
| Document ID | ULMS-SYS-MON-003 |
| Version | 1.0 |
| Status | Final |
| Classification | Internal - Operations |
| Effective Date | February 2026 |
| Review Cycle | Monthly |
| Owner | Monitoring Lead |
| Approver | Operations Manager |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Monitoring Stack](#2-monitoring-stack)
3. [Metrics](#3-metrics)
4. [Alerting](#4-alerting)
5. [Dashboards](#5-dashboards)
6. [Log Management](#6-log-management)
7. [Runbooks](#7-runbooks)
8. [Appendices](#8-appendices)

---

## 1. Introduction

### 1.1 Purpose
This guide documents the monitoring and alerting setup for ULMS v2.0 production environment.

### 1.2 Monitoring Principles
- Monitor everything
- Alert on symptoms, not causes
- Actionable alerts only
- Automated remediation where possible

---

## 2. Monitoring Stack

### 2.1 Architecture

```
┌─────────────────────────────────────────────────────┐
│                  MONITORING STACK                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Prometheus ──┬──► Grafana (Visualization)          │
│      │        │                                      │
│      │        └──► Alertmanager (Alerting)          │
│      │                                               │
│  Loki ───────────► Grafana (Logs)                   │
│                                                      │
│  Elasticsearch ───► Kibana (Search/Analytics)       │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 2.2 Component Versions

| Component | Version | Purpose |
|-----------|---------|---------|
| Prometheus | 2.48 | Metrics collection |
| Grafana | 10.2 | Visualization |
| Alertmanager | 0.26 | Alert routing |
| Loki | 2.9 | Log aggregation |
| Elasticsearch | 8.11 | Log storage |
| Jaeger | 1.50 | Distributed tracing |

---

## 3. Metrics

### 3.1 System Metrics

| Metric | Query | Threshold |
|--------|-------|-----------|
| CPU Usage | 100 - avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100 | > 80% |
| Memory Usage | (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 | > 85% |
| Disk Usage | (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 | > 80% |
| Network Errors | rate(node_network_receive_errs_total[5m]) | > 0.1% |

### 3.2 Application Metrics

| Metric | Query | Threshold |
|--------|-------|-----------|
| Request Rate | rate(http_requests_total[5m]) | - |
| Error Rate | rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) | > 1% |
| Response Time | histogram_quantile(0.95, http_request_duration_seconds_bucket) | > 2s |
| JVM Heap | jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"} | > 80% |

### 3.3 Database Metrics

| Metric | Query | Threshold |
|--------|-------|-----------|
| Active Connections | pg_stat_activity_count | > 150 |
| Replication Lag | pg_stat_replication_pg_wal_lsn_diff | > 1GB |
| Cache Hit Ratio | pg_stat_database_blks_hit / (pg_stat_database_blks_hit + pg_stat_database_blks_read) | < 95% |
| Slow Queries | Count of queries > 1s | > 10/min |

---

## 4. Alerting

### 4.1 Alert Rules

```yaml
# prometheus-rules.yml
groups:
  - name: ulms-alerts
    rules:
      - alert: ULMSHighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"

      - alert: ULMSSlowResponse
        expr: histogram_quantile(0.95, http_request_duration_seconds_bucket) > 3
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Slow response time"

      - alert: DatabaseDown
        expr: pg_up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database is down"
```

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

receivers:
  - name: 'default'
    email_configs:
      - to: 'ops@bank.com'

  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: '<key>'

  - name: 'slack-warnings'
    slack_configs:
      - api_url: '<webhook>'
        channel: '#ulms-alerts'
```

### 4.3 Severity Levels

| Severity | Response | Example |
|----------|----------|---------|
| Critical | Immediate | System down |
| Warning | 15 min | High error rate |
| Info | 1 hour | Capacity warning |

---

## 5. Dashboards

### 5.1 Dashboard Inventory

| Dashboard | URL | Purpose |
|-----------|-----|---------|
| System Overview | /d/ulms-overview | High-level health |
| Application | /d/ulms-app | API metrics |
| Database | /d/ulms-db | DB performance |
| Infrastructure | /d/ulms-infra | Server metrics |
| Business | /d/ulms-business | Loan metrics |

### 5.2 Key Dashboards

**System Overview Dashboard:**
- System status indicators
- Error rate graph
- Response time trends
- Resource utilization
- Alert summary

**Application Dashboard:**
- Request rate by endpoint
- Error breakdown
- Response time percentiles
- Top slow queries
- Active users

---

## 6. Log Management

### 6.1 Log Aggregation

| Source | Type | Destination |
|--------|------|-------------|
| Application | Structured JSON | Loki/ELK |
| Database | PostgreSQL CSV | ELK |
| System | Syslog | ELK |
| Audit | JSON | ELK (7-year retention) |

### 6.2 Log Query Examples

```
# Find errors in Loki
{job="ulms-api"} |= "ERROR"

# Find slow requests
{job="ulms-api"} | json | response_time > 5000

# Find specific user activity
{job="ulms-api"} | json | user_id = "user123"
```

---

## 7. Runbooks

### 7.1 Alert Response

| Alert | First Action | Escalation |
|-------|--------------|------------|
| ULMSDown | Check pod status | DevOps lead |
| DatabaseDown | Check DB connectivity | DBA |
| HighErrorRate | Check logs | Tech lead |
| DiskFull | Check disk usage | Infrastructure |

### 7.2 Diagnostic Commands

```bash
# Check all pods
kubectl get pods -n ulms-production

# Check logs
kubectl logs -f deployment/ulms-api -n ulms-production

# Check metrics
curl -s http://prometheus:9090/api/v1/query?query=up
```

---

## 8. Appendices

### Appendix A: Monitoring URLs

| Service | URL |
|---------|-----|
| Grafana | https://grafana.bank.com |
| Prometheus | https://prometheus.bank.com |
| Alertmanager | https://alerts.bank.com |
| Kibana | https://kibana.bank.com |

### Appendix B: Related Documents

| Document | ID |
|----------|-----|
| Production Monitoring Runbook | ULMS-OPS-PMR-003 |
| Incident Response Procedures | ULMS-OPS-IRP-002 |

---

**Document Control Footer**

*Classification: Internal - Operations*
*Next Review: Monthly*
*Owner: Monitoring Lead*

**END OF DOCUMENT**

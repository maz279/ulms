# Alerting Rules Configuration

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Alerting Rules Configuration |
| **Project Name** | ULMS |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Classification** | Internal |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Critical Alerts](#2-critical-alerts)
3. [Warning Alerts](#3-warning-alerts)
4. [Business Alerts](#4-business-alerts)
5. [Alert Routing](#5-alert-routing)
6. [Silencing](#6-silencing)

---

## 1. Overview

Comprehensive alerting rules for ULMS infrastructure and applications.

---

## 2. Critical Alerts

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: ulms-critical-alerts
spec:
  groups:
    - name: critical
      rules:
        - alert: ULMSBackendDown
          expr: up{job="ulms-backend"} == 0
          for: 1m
          labels:
            severity: critical
          annotations:
            summary: "ULMS Backend is down"
            
        - alert: ULMSDatabaseDown
          expr: up{job="postgres"} == 0
          for: 1m
          labels:
            severity: critical
          annotations:
            summary: "Database is down"
            
        - alert: ULMSHighErrorRate
          expr: |
            sum(rate(http_requests_total{job="ulms-backend",status=~"5.."}[5m]))
            / sum(rate(http_requests_total{job="ulms-backend"}[5m])) > 0.05
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "Error rate above 5%"
```

---

## 3. Warning Alerts

```yaml
    - name: warning
      rules:
        - alert: ULMSHighLatency
          expr: |
            histogram_quantile(0.95,
              sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
            ) > 0.5
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "High latency detected"
            
        - alert: ULMSHighMemoryUsage
          expr: |
            container_memory_usage_bytes{container="ulms-backend"}
            / container_spec_memory_limit_bytes > 0.85
          for: 10m
          labels:
            severity: warning
          annotations:
            summary: "Memory usage above 85%"
```

---

## 4. Business Alerts

```yaml
    - name: business
      rules:
        - alert: ULMSLowApplicationRate
          expr: |
            rate(ulms_loan_applications_total[1h]) < 0.1
          for: 30m
          labels:
            severity: warning
          annotations:
            summary: "Low loan application rate"
            
        - alert: ULMSHighRejectionRate
          expr: |
            rate(ulms_loans_rejected_total[1h])
            / rate(ulms_loan_applications_total[1h]) > 0.5
          for: 1h
          labels:
            severity: warning
          annotations:
            summary: "High loan rejection rate"
```

---

## 5. Alert Routing

```yaml
# alertmanager-config.yaml
route:
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: default
  routes:
    - match:
        severity: critical
      receiver: pagerduty
      continue: true
    - match:
        severity: warning
      receiver: slack

receivers:
  - name: default
    email_configs:
      - to: 'ops@unisoft-systems.com'
        
  - name: slack
    slack_configs:
      - api_url: '${SLACK_WEBHOOK_URL}'
        channel: '#ulms-alerts'
        
  - name: pagerduty
    pagerduty_configs:
      - service_key: '${PAGERDUTY_KEY}'
        severity: critical
```

---

## 6. Silencing

```yaml
# Silence alerts during maintenance
apiVersion: monitoring.coreos.com/v1alpha1
kind: AlertmanagerConfig
metadata:
  name: maintenance-silence
spec:
  inhibitRules:
    - sourceMatch:
        - name: severity
          value: critical
      targetMatch:
        - name: severity
          value: warning
```

---

*© 2026 Unisoft Systems Limited.*

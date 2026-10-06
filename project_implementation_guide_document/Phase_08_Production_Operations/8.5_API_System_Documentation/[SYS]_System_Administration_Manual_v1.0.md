# System Administration Manual

## ULMS v2.0 - System Administrator Guide

---

**Document Control**

| Field | Value |
|-------|-------|
| Document ID | ULMS-SYS-ADM-001 |
| Version | 1.0 |
| Status | Final |
| Classification | Internal - Technical |
| Effective Date | February 2026 |
| Review Cycle | Quarterly |
| Owner | System Administrator |
| Approver | Operations Manager |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Architecture](#2-system-architecture)
3. [Installation](#3-installation)
4. [Configuration](#4-configuration)
5. [User Management](#5-user-management)
6. [Monitoring](#6-monitoring)
7. [Maintenance](#7-maintenance)
8. [Troubleshooting](#8-troubleshooting)
9. [Security](#9-security)
10. [Appendices](#10-appendices)

---

## 1. Introduction

### 1.1 Purpose
This manual provides system administrators with procedures for installing, configuring, and maintaining ULMS v2.0.

### 1.2 Prerequisites
- Linux administration experience
- Kubernetes knowledge
- Database administration skills
- Networking fundamentals

---

## 2. System Architecture

### 2.1 Component Overview

| Component | Technology | Purpose |
|-----------|------------|---------|
| Application | Spring Boot | Business logic |
| Database | PostgreSQL 16 | Data storage |
| Cache | Redis 7 | Session & caching |
| Message Queue | Kafka 3.6 | Event streaming |
| Search | Elasticsearch | Full-text search |
| Load Balancer | HAProxy | Traffic distribution |
| Monitoring | Prometheus/Grafana | Metrics & alerts |

### 2.2 Network Architecture

```
Internet → Firewall → Load Balancer → Kubernetes Cluster
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                   App                    DB                    Cache
                 (Pods)              (PostgreSQL)            (Redis)
```

---

## 3. Installation

### 3.1 Prerequisites Installation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Kubernetes tools
curl -LO "https://dl.k8s/release/$(curl -L -s https://dl.k8s/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### 3.2 ULMS Deployment

```bash
# Clone deployment repository
git clone https://github.com/unisoft/ulms-deployment.git
cd ulms-deployment

# Configure environment
cp values-production.yaml values-override.yaml
# Edit values-override.yaml with site-specific settings

# Deploy ULMS
helm upgrade --install ulms ./helm-chart \
  -f values-production.yaml \
  -f values-override.yaml \
  --namespace ulms-production \
  --create-namespace
```

---

## 4. Configuration

### 4.1 Core Configuration Files

| File | Location | Purpose |
|------|----------|---------|
| application.yml | ConfigMap | Application settings |
| database.conf | Secret | DB credentials |
| logging.xml | ConfigMap | Logging configuration |
| feature-flags.yml | ConfigMap | Feature toggles |

### 4.2 Key Configuration Parameters

```yaml
# application.yml
server:
  port: 8080
  servlet:
    context-path: /api

spring:
  datasource:
    url: jdbc:postgresql://postgres:5432/ulms_production
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5

  redis:
    host: redis
    port: 6379
    password: ${REDIS_PASSWORD}

  kafka:
    bootstrap-servers: kafka:9092

ulms:
  features:
    cib-integration: true
    auto-approval: false
    multi-currency: false
  
  security:
    session-timeout: 30m
    max-failed-attempts: 5
    password-expiry-days: 90
```

---

## 5. User Management

### 5.1 Creating Users

```bash
# Create admin user
kubectl exec -it deployment/ulms-api -n ulms-production -- \
  java -jar admin-cli.jar user create \
  --username admin@bank.com \
  --password SecurePass123! \
  --role SYSTEM_ADMIN \
  --branch MAIN
```

### 5.2 Role Management

| Role | Permissions |
|------|-------------|
| SYSTEM_ADMIN | Full system access |
| BRANCH_MANAGER | Branch operations + approval |
| LOAN_OFFICER | Loan processing |
| CREDIT_ANALYST | Credit analysis + CIB |
| ACCOUNTANT | Financial operations |
| AUDITOR | Read-only audit access |

---

## 6. Monitoring

### 6.1 Health Checks

```bash
# Application health
curl https://api.ulms.bank.com/actuator/health

# Database connectivity
curl https://api.ulms.bank.com/actuator/health/db

# Redis connectivity
curl https://api.ulms.bank.com/actuator/health/redis
```

### 6.2 Metrics

| Metric | Endpoint | Alert Threshold |
|--------|----------|-----------------|
| JVM Memory | /actuator/metrics/jvm.memory.used | > 80% |
| HTTP Requests | /actuator/metrics/http.server.requests | Error rate > 1% |
| DB Connections | /actuator/metrics/jdbc.connections.active | > 80% |
| Response Time | /actuator/metrics/http.server.requests | p95 > 3s |

---

## 7. Maintenance

### 7.1 Backup Procedures

```bash
# Database backup
pg_dump -h prod-db.bank.com -U postgres -d ulms_production \
  -Fc -f /backup/ulms-$(date +%Y%m%d).dump

# Kubernetes resources backup
kubectl get all -n ulms-production -o yaml > /backup/k8s-resources-$(date +%Y%m%d).yaml
```

### 7.2 Log Management

```bash
# View application logs
kubectl logs -f deployment/ulms-api -n ulms-production

# View previous container logs
kubectl logs deployment/ulms-api -n ulms-production --previous

# Export logs
kubectl logs deployment/ulms-api -n ulms-production --since=24h > app-logs.txt
```

---

## 8. Troubleshooting

### 8.1 Common Issues

| Issue | Symptoms | Solution |
|-------|----------|----------|
| Pod CrashLoopBackOff | Pod keeps restarting | Check logs, resource limits |
| Database Connection Fail | DB errors in logs | Verify DB status, credentials |
| High Memory Usage | OOMKilled events | Increase memory limits |
| Slow Response | High latency | Scale pods, check DB queries |

### 8.2 Diagnostic Commands

```bash
# Check pod status
kubectl get pods -n ulms-production -o wide

# Check pod events
kubectl describe pod <pod-name> -n ulms-production

# Execute into pod
kubectl exec -it <pod-name> -n ulms-production -- /bin/sh

# Port forward for debugging
kubectl port-forward svc/ulms-api 8080:8080 -n ulms-production
```

---

## 9. Security

### 9.1 Security Checklist

| Task | Frequency | Command/Method |
|------|-----------|----------------|
| Rotate secrets | Quarterly | Vault rotation |
| Review access | Monthly | RBAC audit |
| Update patches | Weekly | Automated |
| Scan vulnerabilities | Daily | Trivy scan |
| Audit logs | Daily | SIEM review |

### 9.2 Incident Response

1. Isolate affected systems
2. Preserve evidence
3. Notify security team
4. Apply fixes
5. Document incident

---

## 10. Appendices

### Appendix A: Command Reference

```bash
# Scale deployment
kubectl scale deployment ulms-api --replicas=5 -n ulms-production

# Restart deployment
kubectl rollout restart deployment/ulms-api -n ulms-production

# Check rollout status
kubectl rollout status deployment/ulms-api -n ulms-production

# Rollback
kubectl rollout undo deployment/ulms-api -n ulms-production
```

### Appendix B: Related Documents

| Document | ID | Location |
|----------|-----|----------|
| Database Administration Guide | ULMS-SYS-DBA-002 | 8.5_System_Documentation/ |
| Monitoring Guide | ULMS-SYS-MON-003 | 8.5_System_Documentation/ |
| Troubleshooting KB | ULMS-GOV-TKB-004 | 8.3_Risk_Governance/ |

---

**Document Control Footer**

*Classification: Internal - Technical*
*Next Review: Quarterly*
*Owner: System Administrator*

**END OF DOCUMENT**

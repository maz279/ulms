# Capacity Planning Document

## ULMS v2.0 - Capacity Management

---

**Document Control**

| Field | Value |
|-------|-------|
| Document ID | ULMS-OPS-CP-003 |
| Version | 1.0 |
| Status | Final |
| Classification | Internal - Strategic |
| Effective Date | February 2026 |
| Review Cycle | Quarterly |
| Owner | Infrastructure Lead |
| Approver | CTO |

---

## Revision History

| Version | Date | Author | Changes | Approver |
|---------|------|--------|---------|----------|
| 0.1 | 2026-01-08 | Infrastructure | Initial draft | - |
| 0.5 | 2026-01-18 | Performance Team | Added forecasts | - |
| 0.8 | 2026-01-28 | Architecture | Final review | - |
| 1.0 | 2026-02-05 | Infrastructure Lead | Final release | CTO |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Current Capacity Baseline](#2-current-capacity-baseline)
3. [Capacity Metrics](#3-capacity-metrics)
4. [Growth Projections](#4-growth-projections)
5. [Capacity Thresholds](#5-capacity-thresholds)
6. [Scaling Strategies](#6-scaling-strategies)
7. [Resource Planning](#7-resource-planning)
8. [Cost Analysis](#8-cost-analysis)
9. [Capacity Testing](#9-capacity-testing)
10. [Appendices](#10-appendices)

---

## 1. Introduction

### 1.1 Purpose
This document establishes capacity planning processes for ULMS v2.0 to ensure adequate resources are available to meet current and future demand.

### 1.2 Scope
- Compute capacity (CPU, Memory)
- Storage capacity (Database, Files)
- Network capacity (Bandwidth)
- License capacity (Users, Features)
- Integration capacity (API limits)

### 1.3 Capacity Planning Cycle

| Phase | Activity | Frequency | Owner |
|-------|----------|-----------|-------|
| Monitor | Track actual usage | Continuous | Monitoring Team |
| Analyze | Review trends and patterns | Monthly | Infrastructure |
| Forecast | Project future needs | Quarterly | Infrastructure |
| Plan | Define scaling actions | Quarterly | Infrastructure |
| Implement | Execute capacity changes | As needed | DevOps |

---

## 2. Current Capacity Baseline

### 2.1 Infrastructure Capacity

| Resource | Current | Allocated | Available | Utilization |
|----------|---------|-----------|-----------|-------------|
| **Compute** | | | | |
| CPU Cores | 64 | 48 | 16 | 75% |
| Memory (GB) | 256 | 192 | 64 | 75% |
| **Storage** | | | | |
| Database (TB) | 2.0 | 1.2 | 0.8 | 60% |
| File Storage (TB) | 5.0 | 2.5 | 2.5 | 50% |
| Log Storage (TB) | 1.0 | 0.6 | 0.4 | 60% |
| **Network** | | | | |
| Bandwidth (Mbps) | 1000 | 400 | 600 | 40% |
| **Kubernetes** | | | | |
| Pods | 200 | 120 | 80 | 60% |
| Services | 100 | 60 | 40 | 60% |

### 2.2 Database Capacity

| Metric | Current | Capacity | Growth/Month |
|--------|---------|----------|--------------|
| Database Size | 1.2 TB | 2.0 TB | 50 GB |
| Connections | 80 | 200 | +5 |
| IOPS | 2,000 | 10,000 | +100 |
| Transaction Rate | 500 TPS | 2,000 TPS | +50 TPS |

### 2.3 Application Capacity

| Component | Instances | CPU/Instance | Memory/Instance | Max Scale |
|-----------|-----------|--------------|-----------------|-----------|
| ULMS API | 3 | 2 cores | 4 GB | 10 |
| ULMS Web | 2 | 1 core | 2 GB | 5 |
| ULMS Worker | 2 | 2 cores | 4 GB | 10 |
| PostgreSQL | 2 | 4 cores | 16 GB | 4 (HA) |
| Redis | 3 | 1 core | 2 GB | 6 |
| Kafka | 3 | 2 cores | 4 GB | 6 |

---

## 3. Capacity Metrics

### 3.1 Key Performance Indicators

| Metric | Current | Target | Alert Threshold |
|--------|---------|--------|-----------------|
| CPU Utilization (avg) | 45% | < 70% | > 80% |
| Memory Utilization | 60% | < 80% | > 90% |
| Disk Utilization | 60% | < 70% | > 85% |
| Response Time (p95) | 800ms | < 2000ms | > 3000ms |
| Error Rate | 0.01% | < 0.1% | > 0.5% |
| Concurrent Users | 200 | < 400 | > 450 |

### 3.2 Business Metrics

| Metric | Current | Annual Growth | Capacity Limit |
|--------|---------|---------------|----------------|
| Active Loans | 50,000 | 25% | 500,000 |
| Daily Transactions | 10,000 | 30% | 100,000 |
| Users | 500 | 20% | 5,000 |
| Branches | 50 | 10% | 200 |
| Reports/Day | 1,000 | 15% | 10,000 |

---

## 4. Growth Projections

### 4.1 User Growth Forecast

```
Year    Users    Growth    Capacity Required
─────────────────────────────────────────────
2026    500      Baseline  Current
2027    750      +50%      Scale +50%
2028    1,125    +50%      Scale +50%
2029    1,500    +33%      Scale +33%
2030    2,000    +33%      Scale +33%
```

### 4.2 Data Growth Forecast

| Year | Database Size | Storage Required | IOPS Required |
|------|---------------|------------------|---------------|
| 2026 | 1.5 TB | 2.5 TB | 3,000 |
| 2027 | 2.5 TB | 4.0 TB | 5,000 |
| 2028 | 4.0 TB | 6.0 TB | 8,000 |
| 2029 | 6.0 TB | 10.0 TB | 12,000 |
| 2030 | 8.0 TB | 15.0 TB | 15,000 |

### 4.3 Transaction Volume Forecast

| Year | Daily Transactions | Peak TPS | API Calls/Day |
|------|-------------------|----------|---------------|
| 2026 | 15,000 | 50 | 150,000 |
| 2027 | 30,000 | 100 | 300,000 |
| 2028 | 60,000 | 200 | 600,000 |
| 2029 | 100,000 | 350 | 1,000,000 |
| 2030 | 150,000 | 500 | 1,500,000 |

---

## 5. Capacity Thresholds

### 5.1 Alert Thresholds

| Resource | Green | Yellow | Orange | Red |
|----------|-------|--------|--------|-----|
| CPU | < 60% | 60-75% | 75-85% | > 85% |
| Memory | < 70% | 70-80% | 80-90% | > 90% |
| Disk | < 60% | 60-70% | 70-85% | > 85% |
| DB Connections | < 60% | 60-75% | 75-85% | > 85% |

### 5.2 Scaling Triggers

| Trigger | Current Value | Scale At | Action |
|---------|---------------|----------|--------|
| CPU Avg (7d) | 45% | > 70% | Add nodes |
| Memory Avg (7d) | 60% | > 75% | Add memory |
| Disk Usage | 60% | > 70% | Expand storage |
| Pod CPU | 70% | > 80% | Increase replicas |
| DB Connections | 80 | > 140 | Scale DB |

---

## 6. Scaling Strategies

### 6.1 Horizontal Scaling

```yaml
# HPA Configuration
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ulms-api-hpa
  namespace: ulms-production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ulms-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
```

### 6.2 Vertical Scaling

| Component | Current | Scale To | Trigger |
|-----------|---------|----------|---------|
| API Pod CPU | 2 cores | 4 cores | Sustained > 80% |
| API Pod Memory | 4 GB | 8 GB | Sustained > 80% |
| DB CPU | 4 cores | 8 cores | Sustained > 70% |
| DB Memory | 16 GB | 32 GB | Buffer hit < 95% |

### 6.3 Database Scaling Strategy

```
Current: Single Primary + Replica
        ↓
Phase 1: Read replicas for reporting
        ↓
Phase 2: Connection pooling (PgBouncer)
        ↓
Phase 3: Sharding by region/branch
        ↓
Phase 4: Distributed database (Citus/ Yugabyte)
```

---

## 7. Resource Planning

### 7.1 2026 Capacity Plan

| Quarter | Action | Resources | Cost |
|---------|--------|-----------|------|
| Q1 | Baseline monitoring | - | - |
| Q2 | Add 1 DB replica | 4 cores, 16 GB | $2,000 |
| Q3 | Expand storage | +1 TB | $1,000 |
| Q4 | Scale API tier | +2 pods | $500 |

### 7.2 Hardware Procurement Schedule

| Item | Qty | Required By | Budget | Status |
|------|-----|-------------|--------|--------|
| Application Servers | 2 | Q2 2026 | $10,000 | Planned |
| Database Servers | 2 | Q3 2026 | $20,000 | Planned |
| Storage Expansion | 5 TB | Q2 2026 | $5,000 | Planned |
| Network Equipment | 1 | Q4 2026 | $8,000 | Planned |

---

## 8. Cost Analysis

### 8.1 Current Costs

| Category | Monthly Cost | Annual Cost |
|----------|--------------|-------------|
| Compute | $5,000 | $60,000 |
| Storage | $2,000 | $24,000 |
| Network | $1,000 | $12,000 |
| Licenses | $3,000 | $36,000 |
| Support | $2,000 | $24,000 |
| **Total** | **$13,000** | **$156,000** |

### 8.2 Projected Costs

| Year | Infrastructure | Growth | Total |
|------|----------------|--------|-------|
| 2026 | $156,000 | - | $156,000 |
| 2027 | $156,000 | +30% | $203,000 |
| 2028 | $203,000 | +30% | $264,000 |
| 2029 | $264,000 | +25% | $330,000 |
| 2030 | $330,000 | +20% | $396,000 |

---

## 9. Capacity Testing

### 9.1 Load Testing Schedule

| Test Type | Frequency | Scope | Success Criteria |
|-----------|-----------|-------|------------------|
| Baseline | Monthly | Normal load | < 2s response |
| Peak Load | Quarterly | 2x normal | < 5s response |
| Stress Test | Bi-annually | To failure | Graceful degradation |
| Soak Test | Quarterly | 24-hour run | No memory leaks |
| Spike Test | Quarterly | Sudden 10x load | Auto-scaling works |

### 9.2 Capacity Test Results

| Date | Test Type | Max Users | Max TPS | Result |
|------|-----------|-----------|---------|--------|
| | | | | |

---

## 10. Appendices

### Appendix A: Capacity Calculation Formulas

```
# Peak Users Calculation
Peak Users = Average Users × Peak Factor (2.5)

# CPU Requirement
CPU Cores = (Peak TPS × Avg CPU per Transaction) / CPU Efficiency (0.7)

# Memory Requirement
Memory GB = Base Memory + (Concurrent Users × Memory per User)

# Storage Requirement
Storage TB = (Data Size × Growth Factor) + (Data Size × Retention Period)

# Network Bandwidth
Bandwidth Mbps = (Peak Requests/sec × Avg Request Size × 8) / 1000
```

### Appendix B: Related Documents

| Document | ID | Location |
|----------|-----|----------|
| Performance Testing Guide | ULMS-TEST-PERF-001 | 8.5_Testing/ |
| Infrastructure Architecture | ULMS-ARCH-INF-001 | 8.1_Architecture/ |
| Cost Optimization Guide | ULMS-OPS-COST-001 | 8.1_Operations/ |

---

**Document Control Footer**

*Classification: Internal - Strategic*
*Next Review: Quarterly*
*Owner: Infrastructure Lead*

**END OF DOCUMENT**

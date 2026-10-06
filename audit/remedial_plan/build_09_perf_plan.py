import os

content = r'''---
type: reference
topic: Performance Tuning, High-Availability & Scalability Engineering Plan
target_audience: site_reliability_engineer, database_admin, architect
version: 2026.01
---

# 09. Technical Remediation Plan: High-Availability, Connection Pooling & Performance Tuning

**Document ID:** ULMS-REM-2026-09  
**Classification:** INFRASTRUCTURE SCALABILITY & PERFORMANCE SPECIFICATION  
**Scope:** HikariCP Connection Pool, Redis 7 Cluster, k6 Benchmarking & Database Clustering  

---

## 1. Executive Summary & NFR Targets

To support 62 scheduled commercial banks across Bangladesh, ULMS must sustain heavy enterprise lending loads:
* **Throughput Target:** Sustained $\ge 500\text{ RPS}$ (Requests per second) during peak branch banking hours (10:00 AM – 4:00 PM BST).
* **Latency SLO:** 95th percentile ($p95$) latency $\le 500\text{ ms}$ on read/query endpoints; $\le 1,200\text{ ms}$ on transactional disbursements.
* **Concurrent Capacity:** 1,000 active concurrent banking officers across 65 branches.
* **EOD Batch Processing:** Nightly BRPD 15/2024 classification and ECL provisioning run completing in $\le 45\text{ minutes}$ for a 500,000-loan portfolio.

```mermaid
flowchart TD
    subgraph Client_Tier ["Banking Clients (1,000 Concurrent VUs)"]
        WEB["Staff Web Portal (apps/web)"]
        MOB["Field Agent App (apps/mobile)"]
    end

    subgraph Ingress_Tier ["Ingress & Caching Tier"]
        LB["Kong API Gateway / NLB<br/>(TLS 1.3 Termination)"]
        REDIS["Redis 7 Clustered Cache<br/>(CIB 1h, Products 24h, Customer360 15m)"]
    end

    subgraph Service_Tier ["Application Cluster (Spring Boot 4 Virtual Threads)"]
        API1["ulms-api Pod 1"]
        API2["ulms-api Pod 2"]
        API3["ulms-api Pod 3"]
    end

    subgraph DB_Tier ["PostgreSQL 17 HA Cluster"]
        PG_PRI["PostgreSQL Primary (RW)<br/>HikariCP Pool: 50 Conns/Pod"]
        PG_REP["PostgreSQL Read-Replica (RO)<br/>Dedicated to ReturnsService & Regcon"]
    end

    WEB & MOB --> LB
    LB --> REDIS
    LB --> API1 & API2 & API3
    API1 & API2 & API3 -->|Write Txns| PG_PRI
    API1 & API2 & API3 -.->|Read/Report Queries| PG_REP
```

---

## 2. HikariCP Connection Pool Optimization

### Problem Statement:
[`apps/api/src/main/resources/application.yml`](file:///c:/software_project/mim_project/LMS/LMS_CODEBASE/apps/api/src/main/resources/application.yml) currently omits HikariCP settings, falling back to the Spring Boot default `maximum-pool-size: 10`. During end-of-day classification runs, 10 connections cause connection starvation (`ConnectionTimeoutException`).

### Target Configuration (`application-prod.yml`):
```yaml
spring:
  datasource:
    hikari:
      pool-name: ULMS-Hikari-Prod-Pool
      maximum-pool-size: 50
      minimum-idle: 15
      idle-timeout: 300000            # 5 minutes
      connection-timeout: 20000        # 20 seconds max wait
      max-lifetime: 1200000           # 20 minutes (prevents stale TCP socket leaks)
      leak-detection-threshold: 5000   # 5 seconds warn threshold
      connection-test-query: SELECT 1
```

---

## 3. k6 Performance Benchmark Realignment

### Problem Statement:
In [`deploy/perf/load-profile.js:10`](file:///c:/software_project/mim_project/LMS/LMS_CODEBASE/deploy/perf/load-profile.js):
```javascript
const BASE = __ENV.ULMS_BASE_URL || "http://localhost:5173";
```
The load profile targets port `5173` (Vite dev server) by default! Under load testing, Node.js proxy bottlenecks severely skew results.

### Remediation Protocol:
1. Update `load-profile.js` to target the production ingress gateway:
   ```javascript
   const BASE = __ENV.ULMS_BASE_URL || "http://localhost:8081";
   ```
2. Execute the official NFR compliance drill:
   ```bash
   k6 run --vus 1000 --duration 10m deploy/perf/load-profile.js
   ```
'''

with open('audit/remedial_plan/09_PERFORMANCE_SCALABILITY_AND_HA_PLAN.md', 'w', encoding='utf-8') as f:
    f.write(content.strip() + '\n')

print("Created audit/remedial_plan/09_PERFORMANCE_SCALABILITY_AND_HA_PLAN.md")

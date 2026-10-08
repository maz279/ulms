---
type: reference
topic: high_availability_multi_dc_active_passive
target_audience: [infrastructure_architect, cto, disaster_recovery_manager]
version: 2026.10
document_id: DOC-04-DEP-04
---

# DOC-04-DEP-04: High Availability (HA), Multi-DC Active-Passive & Disaster Recovery (DR) Specification

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | High Availability & Multi-DC Disaster Recovery Specification |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Enterprise Infrastructure Specification |
| **Status** | Approved Master Specification |
| **Authority Chain** | Bangladesh Bank ICT Security Guidelines V4.0 §4.1 |

---

## 1. Physical Datacenter Topology

- **Primary DC (Motijheel / Gulshan):** Active site handling 100% of read-write transactions.
- **Disaster Recovery Site (Savar / Jashore):** Warm standby site $> 30\text{ km}$ distant from Primary DC.
- **Replication Link:** Dedicated 1Gbps point-to-point dark fiber with synchronous streaming replication.

```mermaid
flowchart LR
    subgraph Primary_DC ["Primary DC (Active)"]
        INGRESS_PRI["Ingress Controller"]
        API_PRI["ULMS API Cluster"]
        PG_PRI["PostgreSQL Primary"]
    end

    subgraph DR_Site ["Disaster Recovery DC (Warm Standby)"]
        INGRESS_DR["Ingress Controller (Standby)"]
        API_DR["ULMS API Cluster (Scaled 0)"]
        PG_DR["PostgreSQL Standby (Streaming Sync)"]
    end

    INGRESS_PRI --> API_PRI
    API_PRI --> PG_PRI
    PG_PRI -->|Synchronous WAL Stream| PG_DR
```

---

## 2. Failover Orchestration via Patroni & DNS GSLB

1. **Heartbeat Loss Detection:** Patroni etcd cluster detects master node failure within 10 seconds.
2. **Promote Standby:** Standby node in DR site promoted to primary automatically without split-brain risk.
3. **DNS Cutover:** Global Server Load Balancing (GSLB) flips `lms.bank.com.bd` VIP to DR ingress within 30 seconds.

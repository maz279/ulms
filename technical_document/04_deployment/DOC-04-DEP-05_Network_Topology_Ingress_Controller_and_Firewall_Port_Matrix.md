---
type: reference
topic: network_topology_firewall_port_matrix
target_audience: [network_engineer, firewall_admin, security_auditor]
version: 2026.10
document_id: DOC-04-DEP-05
---

# DOC-04-DEP-05: Network Topology, Ingress Controller & Firewall Port Matrix Specification

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | Network Topology & Firewall Port Matrix Specification |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Enterprise Security & Network Specification |
| **Status** | Approved Master Specification |
| **Authority Chain** | Bangladesh Bank ICT Security Guidelines V4.0 §3.2 (Network Segregation) |

---

## 1. Network Zone Segregation

ULMS requires strict 3-tier DMZ isolation:
- **Zone 1: Perimeter DMZ (External Web/Mobile traffic).**
- **Zone 2: Internal Application Zone (API pods, Keycloak, Fineract).**
- **Zone 3: Secure Core Banking & Database Zone (PostgreSQL, CBS bridge, HSM).**

---

## 2. Comprehensive Firewall Port Matrix

| Source Zone | Destination Zone | Protocol | Port | Service / Purpose |
|---|---|---|---|---|
| Bank LAN / Branches | Perimeter DMZ | TCP | 443 | HTTPS to Staff Web Portal |
| Mobile Gateways | Perimeter DMZ | TCP | 443 | HTTPS to Mobile Field API |
| Perimeter DMZ | Application Zone | TCP | 8081 — ULMS REST API | HTTP REST to `apps/api` |
| Application Zone | Database Zone | TCP | 5433 — PostgreSQL 17 (host-mapped) | PostgreSQL 17 Database Connections |
| Application Zone | Core Banking Zone | TCP | 8083 — Fineract CE / 9090 — Prometheus | Core Banking Bridge / Fineract REST |
| Application Zone | Bangladesh Bank CIB | TCP | 443 | Outbound CIB Online SSL connection |


---

## Addendum — v3.1.0 corrections (Independent Forensic Re-audit, 8 October 2026)

- Full port matrix (v3.1.0, matches deploy/compose): 4173 staff web (nginx, same-origin proxy for /realms and /api) · 8082 Keycloak · 8081 ULMS API · 9977 actuator/management · 8083 Apache Fineract CE · 5433 PostgreSQL 17 · 9002 object storage (SeaweedFS S3) · 9090 Prometheus · 3000 Grafana. 8080 is container-internal only; nothing publishes 5432/8443 on the host.

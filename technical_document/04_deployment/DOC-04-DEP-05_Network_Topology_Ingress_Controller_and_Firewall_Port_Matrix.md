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
| Perimeter DMZ | Application Zone | TCP | 8080 | HTTP REST to `apps/api` |
| Application Zone | Database Zone | TCP | 5432 | PostgreSQL 17 Database Connections |
| Application Zone | Core Banking Zone | TCP | 8443 / 9090 | Core Banking Bridge / Fineract REST |
| Application Zone | Bangladesh Bank CIB | TCP | 443 | Outbound CIB Online SSL connection |

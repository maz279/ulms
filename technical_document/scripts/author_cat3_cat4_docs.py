r"""
Authoring Script for Category 3 & Category 4 Missing Technical Documents
========================================================================
Authors:
- DOC-03-MNT-03: PostgreSQL Backup, Point-In-Time Recovery and DR Drill
- DOC-03-MNT-04: Apache Fineract CE Patching, Maintenance and DB Pruning
- DOC-03-MNT-05: Keycloak Realm Secrets Rotation and Certificate Rollover
- DOC-03-MNT-06: Historical Data Archival, Partitioning and Regulatory Retention
- DOC-03-MNT-07: Enterprise SSL/TLS Certificate Lifecycle and mTLS Renewal
- DOC-04-DEP-02: Production Helm Charts and Kubernetes Resource Sizing
- DOC-04-DEP-03: Air-Gapped and Offline Banking Datacenter Installation Runbook
- DOC-04-DEP-04: High Availability Multi-DC Active-Passive and DR Specification
- DOC-04-DEP-05: Network Topology, Ingress Controller and Firewall Port Matrix
- DOC-04-DEP-07: CI/CD Pipeline Automation, Security Scanning and GitOps Guide
"""

from pathlib import Path

ROOT = Path(r"c:\software_project\mim_project\LMS\technical_document")

DOC_03_MNT_03 = r"""---
type: how-to
topic: postgresql_backup_pitr_dr_drill
target_audience: [dba, sre, devops, infrastructure_engineer]
version: 2026.10
document_id: DOC-03-MNT-03
---

# DOC-03-MNT-03: PostgreSQL Backup, Point-In-Time Recovery (PITR) & Disaster Recovery Runbook

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | PostgreSQL Backup, Point-In-Time Recovery & DR Runbook |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Operational SRE & Database Runbook |
| **Status** | Approved Master Specification |
| **Authority Chain** | Bangladesh Bank ICT Security Guidelines V4.0 §4.2 → ISO 22301 (BCMS) |

---

## 1. RPO & RTO SLA Mandates

Scheduled commercial banks operating ULMS v2.0 must enforce the following business continuity targets:
- **Recovery Point Objective (RPO):** $< 15$ minutes (Maximum allowable data loss window).
- **Recovery Time Objective (RTO):** $< 60$ minutes (Full service restoration from cold/warm backup).

```mermaid
flowchart LR
    subgraph Primary_DC ["Primary Banking Datacenter"]
        PG_PRI["PostgreSQL 17 Primary<br/>(`ulms_db`)"]
        WAL["Continuous WAL Archiving<br/>(`archive_command`)"]
    end

    subgraph Backup_Storage ["Secure Cold & Warm Storage"]
        PGBACKREST["pgBackRest Repository<br/>(AES-256 Encrypted)"]
        MINIO["MinIO WORM / S3 Storage"]
    end

    subgraph DR_Site ["Disaster Recovery Datacenter"]
        PG_DR["Standby Recovery Instance<br/>(Target Timestamp Recovery)"]
    end

    PG_PRI --> WAL
    WAL --> PGBACKREST
    PGBACKREST --> MINIO
    MINIO -.->|PITR Restore Drill| PG_DR
```

---

## 2. Automated Backup Strategy

ULMS uses **pgBackRest** with differential and incremental WAL archiving:
- **Full Backup:** Every Friday at 23:00 (synthetic full backup).
- **Differential Backup:** Daily Monday through Thursday at 23:00.
- **Continuous WAL Archiving:** Every 16MB WAL segment or 5-minute timeout (`archive_timeout = 300`).

---

## 3. Step-by-Step Point-In-Time Recovery (PITR) Drill

If human operator error occurs at `2026-10-07 14:32:00 UTC` (e.g., accidental batch run):
```bash
# 1. Stop current PostgreSQL instance
sudo systemctl stop postgresql-17

# 2. Restore database files to target timestamp
sudo -u postgres pgbackrest --stanza=ulms \
    --type=time \
    "--target=2026-10-07 14:30:00" \
    --target-action=promote \
    restore

# 3. Start PostgreSQL and verify recovery status
sudo systemctl start postgresql-17
sudo -u postgres psql -c "SELECT pg_is_in_recovery();"
```
"""

DOC_03_MNT_04 = r"""---
type: how-to
topic: fineract_patching_maintenance_pruning
target_audience: [backend_engineer, dba, release_manager]
version: 2026.10
document_id: DOC-03-MNT-04
---

# DOC-03-MNT-04: Apache Fineract CE 1.10/1.12 Patching, Maintenance & Database Pruning Runbook

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | Apache Fineract CE Patching & Maintenance Runbook |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Operational Maintenance Guide |
| **Status** | Approved Master Specification |
| **Authority Chain** | `DOC-01-ARCH-02` → Apache Fineract Community Edition |

---

## 1. Upstream Patch Ingestion Workflow

ULMS integrates with Apache Fineract CE as a core lending ledger engine. Upstream security and bug fixes are backported quarterly:
1. Review Apache security advisories (CVEs).
2. Fetch release tags from Apache Fineract Git repository.
3. Verify backward-compatibility of Fineract REST endpoints used by `FineractPort`, `FineractLoanPort`, and `FineractJournalPort`.
4. Deploy container image update to UAT staging cluster before production rollout.

---

## 2. Database Bloat Pruning & Vacuum Cadence

Fineract generates extensive batch job history and transaction logs:
```sql
-- Monthly vacuum and analyze on high-churn Fineract tables
VACUUM (ANALYZE, VERBOSE) fineract_default.m_loan_transaction;
VACUUM (ANALYZE, VERBOSE) fineract_default.job_execution;

-- Purge stale batch execution logs older than 180 days
DELETE FROM fineract_default.job_execution 
WHERE start_time < NOW() - INTERVAL '180 days';
```
"""

DOC_03_MNT_05 = r"""---
type: how-to
topic: keycloak_secret_rotation_cert_rollover
target_audience: [security_engineer, iam_administrator, devops]
version: 2026.10
document_id: DOC-03-MNT-05
---

# DOC-03-MNT-05: Keycloak Realm Secrets Rotation, Certificate Rollover & Client Hardening Guide

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | Keycloak Realm Secrets Rotation & Client Hardening |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Security Maintenance Guide |
| **Status** | Approved Master Specification |
| **Authority Chain** | `DOC-01-ARCH-06` → NIST SP 800-57 Part 1 |

---

## 1. Key Rotation Lifecycle & Policies

Under Bangladesh Bank ICT Security Guidelines, cryptographic keys must rotate on strict schedules:
- **RS256 Realm Signing Keys:** Rotated every 180 days (Active -> Passive -> Deleted).
- **OAuth2 Client Secrets (`ulms-api`, `fineract-client`):** Rotated every 90 days.
- **Database Service Accounts:** Rotated every 90 days.

---

## 2. Zero-Downtime Key Rollover Procedure

1. **Phase 1 (Generate New Key as Passive):** Create new RS256 key in Keycloak Admin Console. Public key is published to `.well-known/jwks.json`.
2. **Phase 2 (Promote to Active):** Set priority of new key higher than old key. New tokens are signed with the new key. Existing tokens signed with old key remain valid until expiry.
3. **Phase 3 (Retire Old Key):** After max token lifespan (e.g. 24 hours), transition old key to disabled and then delete.
"""

DOC_03_MNT_06 = r"""---
type: reference
topic: historical_data_archival_partitioning
target_audience: [dba, compliance_officer, data_architect]
version: 2026.10
document_id: DOC-03-MNT-06
---

# DOC-03-MNT-06: Historical Data Archival, Range Partitioning & Regulatory Record Retention Specification

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | Data Archival, Partitioning & Record Retention Specification |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Statutory Architecture & Database Specification |
| **Status** | Approved Master Specification |
| **Authority Chain** | Bank Company Act 1991 §27 → BB ICT Security Guidelines V4.0 |

---

## 1. Statutory Retention Mandates

The **Bank Company Act 1991** requires commercial banks to maintain loan accounting ledgers and borrower KYC records for **12 years** following loan account closure. Active transactional databases cannot scale linearly over 12 years without partitioning.

---

## 2. PostgreSQL Declarative Table Partitioning

High-volume tables (`ulms.loan_transaction` and `ulms.audit_trail`) are partitioned by date:
```sql
CREATE TABLE ulms.loan_transaction_y2026m10 PARTITION OF ulms.loan_transaction
    FOR VALUES FROM ('2026-10-01 00:00:00+06') TO ('2026-11-01 00:00:00+06');
```

---

## 3. Cold Storage Migration to WORM Storage

Partitions older than 36 months are exported to Apache Parquet format and stored in **MinIO WORM (Write Once Read Many)** object storage with strict object locks, ensuring non-mutability and saving expensive SSD storage.
"""

DOC_03_MNT_07 = r"""---
type: how-to
topic: ssl_tls_cert_lifecycle_mtls_renewal
target_audience: [sre, security_engineer, network_admin]
version: 2026.10
document_id: DOC-03-MNT-07
---

# DOC-03-MNT-07: Enterprise SSL/TLS Certificate Lifecycle Management & mTLS Renewal Runbook

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | SSL/TLS Lifecycle Management & mTLS Renewal Runbook |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Security Operations Runbook |
| **Status** | Approved Master Specification |
| **Authority Chain** | Bangladesh Bank ICT Security Guidelines V4.0 §3.2 → TLS 1.3 Mandate |

---

## 1. Certificate Topology & Standards

- **Edge Ingress:** TLS 1.3 only, ECDHE-ECDSA/RSA cipher suites.
- **Service-to-Service (East-West):** Mutual TLS (mTLS) with internal Bank Subordinate CA.
- **Core Banking Connectors:** Hardware Security Module (HSM) or Bank Root CA signed certificates.

---

## 2. Automated Renewal via cert-manager

In Kubernetes/k3s deployments, certificates are managed automatically via `cert-manager`:
```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: ulms-ingress-cert
  namespace: ulms-prod
spec:
  secretName: ulms-tls-secret
  issuerRef:
    name: bank-internal-ca-issuer
    kind: ClusterIssuer
  dnsNames:
  - lms.bank.local
  - api.lms.bank.local
  renewBefore: 360h # 15 days prior to expiry
```
"""

DOC_04_DEP_02 = r"""---
type: reference
topic: helm_charts_k8s_resource_sizing
target_audience: [devops, cloud_architect, sre]
version: 2026.10
document_id: DOC-04-DEP-02
---

# DOC-04-DEP-02: Production Helm Charts & Kubernetes Resource Sizing Specification

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | Production Helm Charts & Kubernetes Resource Sizing |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | DevOps & Infrastructure Specification |
| **Status** | Approved Master Specification |
| **Authority Chain** | `DOC-04-DEP-01` → Kubernetes 1.28+ Best Practices |

---

## 1. Resource Sizing Matrix for Scheduled Commercial Banks

| Tier | Concurrent Users | Active Loans | API Replicas | CPU (Req/Limit) | RAM (Req/Limit) | DB Specs |
|---|---|---|---|---|---|---|
| **Small Bank** | 100 - 300 | < 25,000 | 2 | 1000m / 2000m | 2Gi / 4Gi | 4 vCPU, 16GB RAM |
| **Medium Bank** | 300 - 1,000 | 25,000 - 100,000 | 4 | 2000m / 4000m | 4Gi / 8Gi | 8 vCPU, 32GB RAM |
| **Tier-1 Bank** | 1,000 - 5,000 | > 100,000 | 8 | 4000m / 8000m | 8Gi / 16Gi | 16 vCPU, 64GB RAM |

---

## 2. Horizontal Pod Autoscaler (HPA) Policy

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ulms-api-hpa
  namespace: ulms-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ulms-api
  minReplicas: 3
  maxReplicas: 12
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```
"""

DOC_04_DEP_03 = r"""---
type: how-to
topic: air_gapped_offline_datacenter_install
target_audience: [devops, sysadmin, bank_it_operations]
version: 2026.10
document_id: DOC-04-DEP-03
---

# DOC-04-DEP-03: Air-Gapped & Offline Banking Datacenter Installation Runbook

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | Air-Gapped Datacenter Installation Runbook |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Operational Infrastructure Runbook |
| **Status** | Approved Master Specification |
| **Authority Chain** | Bangladesh Bank ICT Security Guidelines V4.0 §3.1 (Isolation) |

---

## 1. Overview & Security Mandate

Tier-1 commercial banks in Bangladesh prohibit production servers from connecting directly to the public internet. All container images, binaries, and dependencies must be pre-packaged into offline bundles, verified by SHA-256 checksums, and transferred via encrypted physical media.

---

## 2. Offline Bundle Preparation (Bastion / CI Server)

```bash
# 1. Export k3s air-gap images
docker pull postgres:17-alpine
docker pull apache/fineract:1.12.0
docker pull quay.io/keycloak/keycloak:26.0

# 2. Save images to compressed tarball
docker save -o ulms-airgap-images.tar \
    postgres:17-alpine \
    apache/fineract:1.12.0 \
    quay.io/keycloak/keycloak:26.0 \
    ulms-api:2.0.0 \
    ulms-web:2.0.0

# 3. Generate SHA-256 checksum
sha256sum ulms-airgap-images.tar > ulms-airgap-images.tar.sha256
```

---

## 3. Production Datacenter Ingestion

1. Verify SHA-256 checksum before mounting media.
2. Push images into local air-gapped Harbor or Docker registry: `registry.bank.local:5000`.
3. Apply Helm charts referencing local image registry.
"""

DOC_04_DEP_04 = r"""---
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
"""

DOC_04_DEP_05 = r"""---
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
"""

DOC_04_DEP_07 = r"""---
type: how-to
topic: ci_cd_pipeline_security_scanning_gitops
target_audience: [devops_engineer, qa_lead, release_manager]
version: 2026.10
document_id: DOC-04-DEP-07
---

# DOC-04-DEP-07: CI/CD Pipeline Automation, Security Scanning & GitOps Deployment Guide

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | CI/CD Pipeline Automation & GitOps Deployment Guide |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | DevOps & Automation Guide |
| **Status** | Approved Master Specification |
| **Authority Chain** | NIST SP 800-218 (SSDF) → ISO/IEC 5055 |

---

## 1. Automated Pipeline Architecture

```mermaid
flowchart LR
    DEV["Git Commit & Push"] --> BUILD["Maven Build & Unit Tests<br/>(JDK 21)"]
    BUILD --> SCAN["Static Analysis<br/>(SonarQube & Trivy)"]
    SCAN --> DOCKER["Container Build & Sign<br/>(Cosign)"]
    DOCKER --> GITOPS["ArgoCD Sync to k3s<br/>(Declarative GitOps)"]
```

---

## 2. Automated Quality Gates

Every build must pass 4 mandatory quality gates before artifact release:
1. **Compilation & Unit Tests:** Zero test failures across Spring Modulith tests.
2. **SAST Security Gate:** Zero critical or high vulnerabilities detected by SonarQube.
3. **Container CVE Scan:** Zero unpatched CVEs in base images via Trivy.
4. **GitOps Canary Validation:** Automatic rollback if HTTP 5xx errors $> 0.1\%$ within 5 minutes.
"""

# Map to filesystem
FILES = {
    ROOT / "03_maintenance" / "DOC-03-MNT-03_PostgreSQL_Backup_Point_In_Time_Recovery_and_DR_Drill.md": DOC_03_MNT_03,
    ROOT / "03_maintenance" / "DOC-03-MNT-04_Apache_Fineract_CE_Patching_Maintenance_and_DB_Pruning.md": DOC_03_MNT_04,
    ROOT / "03_maintenance" / "DOC-03-MNT-05_Keycloak_Realm_Secrets_Rotation_and_Certificate_Rollover.md": DOC_03_MNT_05,
    ROOT / "03_maintenance" / "DOC-03-MNT-06_Historical_Data_Archival_Partitioning_and_Regulatory_Retention.md": DOC_03_MNT_06,
    ROOT / "03_maintenance" / "DOC-03-MNT-07_Enterprise_SSL_TLS_Certificate_Lifecycle_and_mTLS_Renewal.md": DOC_03_MNT_07,
    ROOT / "04_deployment" / "DOC-04-DEP-02_Production_Helm_Charts_and_Kubernetes_Resource_Sizing.md": DOC_04_DEP_02,
    ROOT / "04_deployment" / "DOC-04-DEP-03_Air_Gapped_and_Offline_Banking_Datacenter_Installation_Runbook.md": DOC_04_DEP_03,
    ROOT / "04_deployment" / "DOC-04-DEP-04_High_Availability_Multi_DC_Active_Passive_and_DR_Specification.md": DOC_04_DEP_04,
    ROOT / "04_deployment" / "DOC-04-DEP-05_Network_Topology_Ingress_Controller_and_Firewall_Port_Matrix.md": DOC_04_DEP_05,
    ROOT / "04_deployment" / "DOC-04-DEP-07_CI_CD_Pipeline_Automation_Security_Scanning_and_GitOps_Guide.md": DOC_04_DEP_07,
}

for path, content in FILES.items():
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.strip() + "\n", encoding="utf-8")
    print(f"Authored: {path.name} ({len(content)} bytes)")

print("\nSuccessfully authored Category 3 & Category 4 missing documents!")

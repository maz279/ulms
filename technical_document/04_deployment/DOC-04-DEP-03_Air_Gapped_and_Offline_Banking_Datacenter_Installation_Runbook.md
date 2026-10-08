---
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

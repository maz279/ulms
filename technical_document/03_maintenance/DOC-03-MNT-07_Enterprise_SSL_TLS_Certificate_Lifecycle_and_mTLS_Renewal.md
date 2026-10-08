---
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


---

## Addendum — v3.1.0 corrections (Independent Forensic Re-audit, 8 October 2026)

- Expansion pending (flagged by the forensic re-audit): this runbook currently covers topology + cert-manager renewal only; keystore/truststore rotation, expiry monitoring/alerting, and mTLS client-cert rollover procedures are required before operational use.

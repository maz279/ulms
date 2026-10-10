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


---

## Expanded Content — v3.2.0 (real TLS anchors: ingress ulms-tls, Fineract in-cluster 8443 mTLS, CIB PKCS12)

Certificate inventory (verified from the deployment): (1) Ingress/public TLS — Secret ulms-tls bound via ingress.tls in deploy/chart/ulms/values.yaml; issued by cert-manager or the bank CA. (2) Fineract in-cluster mTLS — the API reaches Fineract at https://fineract:8443/fineract-provider (FINERACT_URL); the client truststore must trust the Fineract server cert. (3) CIB client certificate — PKCS12 keystore mounted at ULMS_CIB_KEYSTORE (cib-live profile), passphrase ULMS_CIB_KEYSTORE_PASSWORD in the ulms-api-secrets Secret. (4) Keycloak browser-facing TLS on the external route (reverse-proxy terminated in compose; ingress-terminated in k3s).
Renewal runbook — public/ingress cert: cert-manager renews automatically; verify with kubectl get certificate -n ulms and force with kubectl delete secret ulms-tls (cert-manager re-issues). Bank-CA route: generate a CSR, obtain the signed cert, then kubectl create secret tls ulms-tls --cert=ulms.crt --key=ulms.key --dry-run=client -o yaml | kubectl apply -f - and roll the web ingress (kubectl rollout restart deployment/ulms-web).
Renewal runbook — Fineract mTLS truststore: replace the Fineract server certificate (helm upgrade with the new fineract image/secret), update the API client truststore Secret, then kubectl rollout restart deployment/ulms-api; verify from inside the pod with a health probe against FINERACT_URL over TLS.
Renewal runbook — CIB client certificate (BB annual rotation): obtain the new PKCS12 from BB CIB administration, update the mounted keystore and ULMS_CIB_KEYSTORE_PASSWORD in ulms-api-secrets, restart the API, and confirm a test CIB inquiry in the cib-live window before the old cert expires — schedule at least 15 days ahead of expiry.
Expiry monitoring: export certificate-notAfter from the ingress (kube-state-metrics or cert-manager metrics) and alert at 30/15/7 days via the observability stack; track the CIB keystore expiry in the ops calendar with a 30-day pre-alert — a missed CIB rotation blocks all CIB inquiries (a SEV-2 per TS-06).

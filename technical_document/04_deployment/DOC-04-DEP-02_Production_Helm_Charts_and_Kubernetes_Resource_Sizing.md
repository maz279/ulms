---
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


---

## Addendum — v3.1.0 corrections (Independent Forensic Re-audit, 8 October 2026)

- Expansion pending (flagged): add the values.yaml parameter matrix from deploy/chart/ulms/values.yaml, chart structure, and helm lint/template verification; reconcile the sample HPA floor (minReplicas 3) with the Small-Bank sizing row (2 replicas).


---

## Expanded Content — v3.2.0 (verified against deploy/chart/ulms/values.yaml)

Chart location and structure: the production chart is deploy/chart/ulms (Chart.yaml, values.yaml, templates/). Verify any rendered change with: helm lint deploy/chart/ulms and helm template deploy/chart/ulms -f <env-overlay.yaml> before apply; upgrade with --atomic --timeout 10m.
Parameter matrix (authoritative values.yaml keys): global.imageRegistry / global.pullSecrets — bank mirror registry and pull secrets. api: image ulms-api, tag (defaults to Chart.AppVersion), replicas 2, resources requests 500m/1Gi limits 2/2Gi, env (ULMS_DB_URL jdbc:postgresql://postgresql:5432/ulms; ULMS_OIDC_ISSUER http://keycloak:8080/realms/ulms is the IN-CLUSTER service URL — the browser-facing issuer remains the external route; FINERACT_URL https://fineract:8443/fineract-provider/api/v1 is the in-cluster mTLS endpoint; ULMS_MINIO_ENDPOINT http://minio:9000; ULMS_MINIO_BUCKET ulms-documents; ULMS_CIB_BASE_URL / ULMS_CIB_KEYSTORE for the cib-live window), existingSecret ulms-api-secrets (keys: ULMS_DB_PASSWORD, FINERACT_DB_PASSWORD, FINERACT_USER, FINERACT_PASSWORD, ULMS_MINIO_ACCESS_KEY, ULMS_MINIO_SECRET_KEY, ULMS_RAILS_WEBHOOK_SECRET, ULMS_CIB_KEYSTORE_PASSWORD), probes /actuator/health initialDelay 60s period 10s. web: image ulms-web, replicas 2, 100m/128Mi to 500m/256Mi. postgresql: external flag switches to bank-managed PG, image postgres:17-alpine, persistence 100Gi, existingSecret ulms-pg-secrets (POSTGRES_PASSWORD). keycloak: image quay.io/keycloak/keycloak:26.0, realmImportConfigMap ulms-realm (from deploy/seed/realm-ulms.json), existingSecret ulms-keycloak-secrets (KC_BOOTSTRAP_ADMIN_USERNAME/PASSWORD). fineract: image apache/fineract@fd01236df6 (digest-pinned), persistence 20Gi, existingSecret ulms-fineract-secrets. minio: persistence 200Gi, existingSecret ulms-minio-secrets. ingress: className traefik (k3s default), host ulms.bank.local, tls.secretName ulms-tls (cert-manager or bank CA). observability: prometheus retention 15d, grafana adminSecret ulms-grafana-secrets. networkPolicy: enabled, allowNamespaces [ulms, monitoring].
Scaling note (supersedes the earlier HPA snippet): the shipped chart runs fixed replicas (api 2, web 2) with no HorizontalPodAutoscaler — the HPA manifest printed in earlier drafts was target-state imagination. To scale for a larger bank, raise api.replicas/web.replicas per environment overlay first; introduce an HPA only after load-test evidence (k6 profiles in deploy/perf) justifies autoscaling thresholds.
Sizing tiers (planning guidance, consistent with audit/01 capacity work): Small bank (up to ~25 branches): chart defaults (api 2 x 500m/1Gi, PG 100Gi). Mid bank (25-100 branches): api replicas 3-4, PG 200Gi, Prometheus retention 30d. Large bank (100+ branches): postgresql.external=true onto the bank DB tier, api replicas 4+, dedicated observability namespace.

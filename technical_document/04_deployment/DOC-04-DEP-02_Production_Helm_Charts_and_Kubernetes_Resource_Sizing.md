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

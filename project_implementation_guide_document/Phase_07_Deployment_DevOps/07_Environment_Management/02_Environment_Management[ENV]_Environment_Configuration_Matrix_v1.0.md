# Environment Configuration Matrix

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Environment Configuration Matrix |
| **Project Name** | ULMS |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Classification** | Internal |

---

## Configuration Matrix

| Parameter | Development | Staging | Production |
|-----------|-------------|---------|------------|
| **Replicas** | 1 | 2 | 5 |
| **CPU Limit** | 500m | 1000m | 4000m |
| **Memory Limit** | 1Gi | 2Gi | 8Gi |
| **Log Level** | DEBUG | INFO | WARN |
| **Caching** | Disabled | Enabled | Enabled |
| **SSL/TLS** | Self-signed | Let's Encrypt | Commercial |
| **Database** | Container | RDS | Multi-AZ RDS |
| **Backup** | None | Daily | Continuous |
| **Monitoring** | Basic | Full | Full + Alerting |
| **Auto-scaling** | No | Yes | Yes |

---

## Resource Allocation

| Resource | Dev | Staging | Production |
|----------|-----|---------|------------|
| Nodes | 2 | 3 | 10 |
| vCPU | 4 | 6 | 40 |
| Memory | 16 GB | 24 GB | 160 GB |
| Storage | 50 GB | 100 GB | 500 GB |

---

## Feature Flags

| Feature | Dev | Staging | Production |
|---------|-----|---------|------------|
| New UI | Enabled | Enabled | Disabled |
| Beta APIs | Enabled | Disabled | Disabled |
| Debug Endpoints | Enabled | Disabled | Disabled |

---

*© 2026 Unisoft Systems Limited.*

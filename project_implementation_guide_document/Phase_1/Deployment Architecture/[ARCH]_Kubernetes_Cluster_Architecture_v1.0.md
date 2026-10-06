# Kubernetes Cluster Architecture Document
## Unisoft Loan Management System (ULMS) v2.0
### Production-Ready Kubernetes 1.28 Deployment - 3 Namespaces

---

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ARCH-1.7.1 |
| **Document Title** | Kubernetes Cluster Architecture (3 namespaces) |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 5, 2026 |
| **Prepared By** | Lead Developer, DevOps Architect |
| **Reviewed By** | Architecture Review Board, Infrastructure Team |
| **Classification** | Confidential - Internal Use |
| **Status** | Approved for Implementation |

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | February 5, 2026 | Lead Developer | Initial Kubernetes Cluster Architecture |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Cluster Overview & Architecture](#2-cluster-overview--architecture)
3. [Namespace Strategy & Design](#3-namespace-strategy--design)
4. [Node Configuration & Resource Allocation](#4-node-configuration--resource-allocation)
5. [Application Deployments](#5-application-deployments)
6. [Infrastructure Services Deployments](#6-infrastructure-services-deployments)
7. [Horizontal Pod Autoscaling Configuration](#7-horizontal-pod-autoscaling-configuration)
8. [Service Discovery & Load Balancing](#8-service-discovery--load-balancing)
9. [Storage Architecture & Persistent Volumes](#9-storage-architecture--persistent-volumes)
10. [Security Configuration](#10-security-configuration)
11. [High Availability & Disaster Recovery](#11-high-availability--disaster-recovery)
12. [Monitoring & Observability Integration](#12-monitoring--observability-integration)
13. [GitOps & CI/CD Integration](#13-gitops--cicd-integration)
14. [Backup & Recovery Strategy](#14-backup--recovery-strategy)
15. [Operational Procedures](#15-operational-procedures)
16. [Appendices](#16-appendices)

---

## 1. Executive Summary

### 1.1 Purpose

This document defines the production-ready Kubernetes 1.28 cluster architecture for **ULMS v2.0**, supporting 1000+ concurrent users, 99.9% uptime SLA, and multi-tenant deployment across 62+ Bangladesh banks.

### 1.2 Cluster Specifications

| Specification | Value |
|--------------|-------|
| **Kubernetes Version** | 1.28.x |
| **Cluster Type** | Multi-availability zone (3 AZs) |
| **Namespaces** | 3 (production, staging, monitoring) |
| **Worker Nodes** | 12-30 (auto-scaling enabled) |
| **Node Instance Type** | t3.2xlarge (8 vCPU, 32 GB RAM) |
| **Total Applications** | 9 (Fineract + 8 microservices) |
| **Infrastructure Services** | 11 (PostgreSQL, Redis, Kafka, Kong, Keycloak, Vault, etc.) |
| **Auto-scaling** | HPA enabled (3-20 replicas per service) |
| **Storage** | EBS gp3 (persistent), EFS (shared) |
| **Ingress** | NGINX Ingress Controller + Kong Gateway |
| **High Availability** | Multi-AZ with automatic failover |
| **Disaster Recovery** | Asynchronous replication to Singapore region |

### 1.3 Key Architectural Decisions

**ADR-001**: Kubernetes 1.28 as orchestration platform
- **Rationale**: Cloud-native, horizontal scaling, self-healing, declarative configuration
- **Alternatives Considered**: Docker Swarm (insufficient enterprise features), Nomad (smaller ecosystem)

**ADR-002**: 3-namespace isolation (production, staging, monitoring)
- **Rationale**: Clear separation of concerns, independent resource quotas, network isolation
- **Alternatives Considered**: Single namespace (insufficient isolation), per-tenant namespaces (operational complexity for 62+ banks)

**ADR-003**: Multi-AZ deployment across 3 availability zones
- **Rationale**: 99.9% uptime SLA requires zone-level failure tolerance
- **Alternatives Considered**: Single AZ (SPOF), 2 AZs (requires external tiebreaker for consensus)

### 1.4 Alignment with Requirements

| Requirement | Source | Implementation |
|-------------|--------|----------------|
| 1000+ concurrent users | BRD 7.1 | HPA configuration with 3-20 replicas |
| 99.9% uptime (43 min downtime/month) | BRD 7.5 | Multi-AZ, pod anti-affinity, automatic failover |
| <500ms response time (95th percentile) | SRS 4.1 | Resource allocation, caching, load balancing |
| TLS 1.3 encryption | BRD 7.3, ICT V4.0 | Ingress TLS termination, mTLS for inter-service |
| Multi-tenant data isolation | BRD 6.1 | Schema-per-tenant in PostgreSQL |
| Auto-scaling | SRS 2.1 | HPA for CPU/memory, cluster autoscaler for nodes |

---

## 2. Cluster Overview & Architecture

### 2.1 High-Level Cluster Topology

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    KUBERNETES CLUSTER ARCHITECTURE                           │
│                         (Multi-AZ Deployment)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  AVAILABILITY ZONE 1      AVAILABILITY ZONE 2      AVAILABILITY ZONE 3      │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐      │
│  │  Control Plane   │    │  Control Plane   │    │  Control Plane   │      │
│  │  Master Node 1   │    │  Master Node 2   │    │  Master Node 3   │      │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘      │
│           │                       │                       │                 │
│  ┌────────┴────────┐     ┌────────┴────────┐     ┌────────┴────────┐      │
│  │  Worker Nodes   │     │  Worker Nodes   │     │  Worker Nodes   │      │
│  │  ┌──────────┐   │     │  ┌──────────┐   │     │  ┌──────────┐   │      │
│  │  │ Node 1   │   │     │  │ Node 5   │   │     │  │ Node 9   │   │      │
│  │  │ Node 2   │   │     │  │ Node 6   │   │     │  │ Node 10  │   │      │
│  │  │ Node 3   │   │     │  │ Node 7   │   │     │  │ Node 11  │   │      │
│  │  │ Node 4   │   │     │  │ Node 8   │   │     │  │ Node 12  │   │      │
│  │  └──────────┘   │     │  └──────────┘   │     │  └──────────┘   │      │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘      │
│                                                                              │
│  NAMESPACES ACROSS ALL NODES:                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ulms-production   │  ulms-staging   │  ulms-monitoring             │   │
│  │  - Fineract        │  - Fineract     │  - Prometheus                │   │
│  │  - 8 Microservices │  - 8 Services   │  - Grafana                   │   │
│  │  - Infrastructure  │  - Infrastructure│  - ELK Stack                 │   │
│  │  - PostgreSQL      │  - PostgreSQL   │  - Jaeger                    │   │
│  │  - Redis, Kafka    │  - Redis, Kafka │                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Control Plane Architecture

The Kubernetes control plane is managed (cloud provider handles master nodes) with the following components:

| Component | Purpose | Replicas | HA Strategy |
|-----------|---------|----------|-------------|
| **API Server** | REST API for all cluster operations | 3 | Load balanced across AZs |
| **etcd** | Distributed key-value store (cluster state) | 3 | Raft consensus across AZs |
| **Scheduler** | Assigns pods to nodes based on resources | 3 | Active leader election |
| **Controller Manager** | Maintains desired cluster state | 3 | Active leader election |
| **Cloud Controller** | Cloud provider integrations | 3 | Active leader election |

**Control Plane Security:**
- Private API endpoint (no public access)
- Certificate-based authentication for kubectl
- RBAC policies for service accounts
- Audit logging enabled (10-year retention)

### 2.3 Network Architecture

**VPC Configuration:**
```
VPC: 10.0.0.0/16
├── Public Subnet (10.0.1.0/24) - AZ1 (NAT Gateway, ALB)
├── Public Subnet (10.0.2.0/24) - AZ2 (NAT Gateway)
├── Public Subnet (10.0.3.0/24) - AZ3 (NAT Gateway)
├── Private Subnet (10.0.10.0/24) - AZ1 (Worker Nodes)
├── Private Subnet (10.0.11.0/24) - AZ2 (Worker Nodes)
├── Private Subnet (10.0.12.0/24) - AZ3 (Worker Nodes)
├── Database Subnet (10.0.20.0/24) - AZ1 (RDS, ElastiCache)
├── Database Subnet (10.0.21.0/24) - AZ2 (RDS Standby)
└── Database Subnet (10.0.22.0/24) - AZ3
```

**CNI Plugin**: Calico 3.27 for network policies and pod networking
**DNS**: CoreDNS for service discovery
**Load Balancer**: AWS Network Load Balancer (NLB) for Kong Gateway

---

## 3. Namespace Strategy & Design

### 3.1 Namespace: ulms-production

**Purpose**: Live banking operations serving 62+ banks with 1000+ concurrent users

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ulms-production
  labels:
    environment: production
    tenant: multi
    monitoring: enabled
    compliance: "bangladesh-bank"
  annotations:
    description: "ULMS Production Environment - Live Banking Operations"
    owner: "Lead Developer"
    contact: "devops@unisoft.com"
    budget: "high"
```

**Resource Quotas:**
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: production-quota
  namespace: ulms-production
spec:
  hard:
    requests.cpu: "200"              # 200 CPU cores total
    requests.memory: 400Gi           # 400 GB RAM total
    requests.storage: 5Ti            # 5 TB storage total
    limits.cpu: "400"                # Max 400 CPU cores
    limits.memory: 800Gi             # Max 800 GB RAM
    persistentvolumeclaims: "100"    # Max 100 PVCs
    services.loadbalancers: "5"      # Max 5 LoadBalancers
    pods: "1000"                     # Max 1000 pods
    configmaps: "100"                # Max 100 ConfigMaps
    secrets: "100"                   # Max 100 Secrets
```

**Limit Ranges** (default pod resource constraints):
```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: production-limits
  namespace: ulms-production
spec:
  limits:
  - max:
      cpu: "8"
      memory: "16Gi"
    min:
      cpu: "100m"
      memory: "128Mi"
    default:
      cpu: "1"
      memory: "2Gi"
    defaultRequest:
      cpu: "500m"
      memory: "1Gi"
    type: Container
```

**Network Policy** (namespace isolation):
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: production-isolation
  namespace: ulms-production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          environment: production
    - namespaceSelector:
        matchLabels:
          name: ulms-monitoring  # Allow monitoring namespace
  egress:
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 53  # DNS
    - protocol: UDP
      port: 53  # DNS
  - to:
    - podSelector: {}
```

### 3.2 Namespace: ulms-staging

**Purpose**: UAT, integration testing, and staging deployments

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ulms-staging
  labels:
    environment: staging
    tenant: multi
    monitoring: enabled
  annotations:
    description: "ULMS Staging Environment - UAT and Integration Testing"
    owner: "QA Lead"
```

**Resource Quotas** (50% of production):
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: staging-quota
  namespace: ulms-staging
spec:
  hard:
    requests.cpu: "100"
    requests.memory: 200Gi
    requests.storage: 2Ti
    limits.cpu: "200"
    limits.memory: 400Gi
    persistentvolumeclaims: "50"
    pods: "500"
```

### 3.3 Namespace: ulms-monitoring

**Purpose**: Observability stack (Prometheus, Grafana, ELK, Jaeger)

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ulms-monitoring
  labels:
    environment: monitoring
    monitoring: self
  annotations:
    description: "ULMS Monitoring - Observability Stack"
    owner: "DevOps Team"
```

**Resource Quotas:**
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: monitoring-quota
  namespace: ulms-monitoring
spec:
  hard:
    requests.cpu: "50"
    requests.memory: 100Gi
    requests.storage: 10Ti    # Large for log storage
    limits.cpu: "100"
    limits.memory: 200Gi
    persistentvolumeclaims: "50"
    pods: "200"
```

---

## 4. Node Configuration & Resource Allocation

### 4.1 Node Pools

| Pool Name | Instance Type | vCPU | RAM | Storage | Count (Min/Max) | Purpose |
|-----------|--------------|------|-----|---------|-----------------|---------|
| **general-purpose** | t3.2xlarge | 8 | 32 GB | 100 GB EBS | 12 / 24 | Application workloads |
| **memory-optimized** | r6i.2xlarge | 8 | 64 GB | 100 GB EBS | 3 / 6 | PostgreSQL, Redis |
| **monitoring** | m6i.2xlarge | 8 | 32 GB | 500 GB EBS | 2 / 4 | ELK Stack, Prometheus |

**Total Cluster Capacity:**
- **Minimum**: 17 nodes (12 general + 3 memory + 2 monitoring) = 136 vCPU, 544 GB RAM
- **Maximum**: 34 nodes (24 general + 6 memory + 4 monitoring) = 272 vCPU, 1088 GB RAM

### 4.2 Node Labels & Selectors

**General Purpose Nodes:**
```yaml
metadata:
  labels:
    node-role.kubernetes.io/worker: ""
    workload-type: application
    availability-zone: us-east-1a
    instance-type: t3.2xlarge
    disk-type: ssd
    node-pool: general-purpose
```

**Memory Optimized Nodes:**
```yaml
metadata:
  labels:
    node-role.kubernetes.io/worker: ""
    workload-type: database
    availability-zone: us-east-1a
    instance-type: r6i.2xlarge
    node-pool: memory-optimized
```

### 4.3 Taints & Tolerations

**Database Workload Taint:**
```yaml
# Node taint (prevent general workloads on database nodes)
taints:
- key: workload
  value: database
  effect: NoSchedule

# StatefulSet toleration (allow database pods)
tolerations:
- key: workload
  operator: Equal
  value: database
  effect: NoSchedule
```

### 4.4 Cluster Autoscaler Configuration

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: cluster-autoscaler-config
  namespace: kube-system
data:
  cluster-autoscaler.yaml: |
    scaleDown:
      enabled: true
      delayAfterAdd: 10m
      delayAfterDelete: 10s
      unneededTime: 10m
      utilizationThreshold: 0.5
    resourceLimits:
      minNodes: 12
      maxNodes: 30
    nodeGroups:
    - name: general-purpose
      minSize: 12
      maxSize: 24
      provider: aws
      autoscalingGroup: ulms-general-purpose-asg
    - name: memory-optimized
      minSize: 3
      maxSize: 6
      provider: aws
      autoscalingGroup: ulms-memory-optimized-asg
```

---

## 5. Application Deployments

### 5.1 Apache Fineract Core Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ulms-fineract
  namespace: ulms-production
  labels:
    app: fineract
    component: core
    version: "1.10.0"
    tier: backend
spec:
  replicas: 3  # Minimum replicas (HPA will scale up to 20)
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0  # Zero-downtime deployment
  selector:
    matchLabels:
      app: fineract
      component: core
  template:
    metadata:
      labels:
        app: fineract
        component: core
        version: "1.10.0"
        tier: backend
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/fineract-provider/actuator/prometheus"
        sidecar.istio.io/inject: "false"  # Not using service mesh yet
    spec:
      serviceAccountName: fineract-sa
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      affinity:
        podAntiAffinity:
          # Hard requirement: Must be on different nodes
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: app
                operator: In
                values:
                - fineract
            topologyKey: kubernetes.io/hostname
          # Soft requirement: Prefer different availability zones
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - fineract
              topologyKey: topology.kubernetes.io/zone
      containers:
      - name: fineract
        image: ulms-registry.azurecr.io/fineract:1.10.0-ulms
        imagePullPolicy: IfNotPresent
        ports:
        - name: http
          containerPort: 8443
          protocol: TCP
        - name: actuator
          containerPort: 8080
          protocol: TCP
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "production"
        - name: FINERACT_NODE_ID
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: FINERACT_HIKARI_JDBCURL
          valueFrom:
            secretKeyRef:
              name: database-credentials
              key: jdbc-url
        - name: FINERACT_HIKARI_USERNAME
          valueFrom:
            secretKeyRef:
              name: database-credentials
              key: username
        - name: FINERACT_HIKARI_PASSWORD
          valueFrom:
            secretKeyRef:
              name: database-credentials
              key: password
        - name: FINERACT_HIKARI_MINIMUMIDLECONNECTIONS
          value: "10"
        - name: FINERACT_HIKARI_MAXIMUMPOOLSIZE
          value: "50"
        - name: FINERACT_HIKARI_CONNECTIONTIMEOUT
          value: "30000"
        - name: FINERACT_HIKARI_IDLETIMEOUT
          value: "600000"
        - name: FINERACT_HIKARI_MAXLIFETIME
          value: "1800000"
        - name: JAVA_TOOL_OPTIONS
          value: >-
            -Xms4g -Xmx8g
            -XX:+UseG1GC
            -XX:MaxGCPauseMillis=200
            -XX:+ParallelRefProcEnabled
            -XX:+HeapDumpOnOutOfMemoryError
            -XX:HeapDumpPath=/dumps
            -XX:+ExitOnOutOfMemoryError
            -Dfile.encoding=UTF-8
            -Djava.security.egd=file:/dev/./urandom
            -Duser.timezone=Asia/Dhaka
        resources:
          requests:
            cpu: "2000m"      # 2 CPU cores
            memory: "4Gi"     # 4 GB RAM
            ephemeral-storage: "2Gi"
          limits:
            cpu: "4000m"      # Max 4 CPU cores
            memory: "8Gi"     # Max 8 GB RAM
            ephemeral-storage: "5Gi"
        livenessProbe:
          httpGet:
            path: /fineract-provider/actuator/health/liveness
            port: 8080
            scheme: HTTP
          initialDelaySeconds: 180
          periodSeconds: 30
          timeoutSeconds: 5
          successThreshold: 1
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /fineract-provider/actuator/health/readiness
            port: 8080
            scheme: HTTP
          initialDelaySeconds: 60
          periodSeconds: 10
          timeoutSeconds: 3
          successThreshold: 1
          failureThreshold: 3
        startupProbe:
          httpGet:
            path: /fineract-provider/actuator/health/liveness
            port: 8080
            scheme: HTTP
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 3
          successThreshold: 1
          failureThreshold: 30  # 5 minutes to start (30 * 10s)
        volumeMounts:
        - name: application-config
          mountPath: /etc/fineract
          readOnly: true
        - name: heap-dumps
          mountPath: /dumps
        - name: logs
          mountPath: /var/log/fineract
      volumes:
      - name: application-config
        configMap:
          name: fineract-config
      - name: heap-dumps
        emptyDir:
          sizeLimit: 10Gi
      - name: logs
        emptyDir:
          sizeLimit: 5Gi
      imagePullSecrets:
      - name: azure-registry-secret
```

### 5.2 CIB Service Deployment (Spring Boot + WebFlux)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cib-service
  namespace: ulms-production
  labels:
    app: cib-service
    component: microservice
    version: "1.0.0"
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: cib-service
  template:
    metadata:
      labels:
        app: cib-service
        component: microservice
        version: "1.0.0"
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8081"
        prometheus.io/path: "/actuator/prometheus"
    spec:
      serviceAccountName: cib-service-sa
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchLabels:
                  app: cib-service
              topologyKey: kubernetes.io/hostname
      containers:
      - name: cib-service
        image: ulms-registry.azurecr.io/cib-service:1.0.0
        imagePullPolicy: IfNotPresent
        ports:
        - name: http
          containerPort: 8081
          protocol: TCP
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "production"
        - name: CIB_API_URL
          valueFrom:
            configMapKeyRef:
              name: integration-config
              key: cib-api-url
        - name: CIB_MTLS_CERT_PATH
          value: "/etc/certs/cib-client.crt"
        - name: CIB_MTLS_KEY_PATH
          value: "/etc/certs/cib-client.key"
        - name: CIB_CACHE_TTL_SECONDS
          value: "3600"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-credentials
              key: jdbc-url
        - name: REDIS_HOST
          value: "redis-cluster"
        - name: REDIS_PORT
          value: "6379"
        - name: JAVA_TOOL_OPTIONS
          value: >-
            -Xms1g -Xmx2g
            -XX:+UseG1GC
        resources:
          requests:
            cpu: "500m"
            memory: "1Gi"
          limits:
            cpu: "1000m"
            memory: "2Gi"
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8081
          initialDelaySeconds: 60
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8081
          initialDelaySeconds: 30
          periodSeconds: 10
        volumeMounts:
        - name: cib-mtls-certs
          mountPath: /etc/certs
          readOnly: true
      volumes:
      - name: cib-mtls-certs
        secret:
          secretName: cib-mtls-certificates
```

### 5.3 Microservices Deployment Summary

| Microservice | Port | Replicas (Min/Max) | CPU Request/Limit | Memory Request/Limit |
|--------------|------|-------------------|-------------------|---------------------|
| **CIB Service** | 8081 | 3 / 10 | 500m / 1000m | 1Gi / 2Gi |
| **NID Service** | 8082 | 3 / 10 | 500m / 1000m | 1Gi / 2Gi |
| **Workflow Service** | 8083 | 3 / 10 | 1000m / 2000m | 2Gi / 4Gi |
| **Document Service** | 8084 | 2 / 8 | 500m / 1000m | 1Gi / 2Gi |
| **BRPD Service** | 8085 | 2 / 6 | 500m / 1000m | 1Gi / 2Gi |
| **Notification Service** | 8086 | 2 / 10 | 250m / 500m | 512Mi / 1Gi |
| **Analytics Service** | 8087 | 2 / 8 | 1000m / 2000m | 2Gi / 4Gi |
| **Integration Gateway** | 8088 | 2 / 8 | 500m / 1000m | 1Gi / 2Gi |

**Note**: NID Service, Workflow Service, Document Service, BRPD Service, Notification Service, Analytics Service, and Integration Gateway follow similar deployment patterns to CIB Service with appropriate resource allocations and environment variables.

---

## 6. Infrastructure Services Deployments

### 6.1 PostgreSQL StatefulSet (Patroni + etcd)

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgresql-patroni
  namespace: ulms-production
  labels:
    app: postgresql
    cluster-name: ulms-cluster
spec:
  serviceName: postgres-cluster
  replicas: 3  # 1 primary + 2 standby
  selector:
    matchLabels:
      app: postgresql
      cluster-name: ulms-cluster
  template:
    metadata:
      labels:
        app: postgresql
        cluster-name: ulms-cluster
    spec:
      serviceAccountName: postgres-sa
      securityContext:
        fsGroup: 999
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchLabels:
                app: postgresql
            topologyKey: kubernetes.io/hostname
      nodeSelector:
        workload-type: database
      tolerations:
      - key: workload
        operator: Equal
        value: database
        effect: NoSchedule
      containers:
      - name: postgresql
        image: postgres:16.1-alpine
        ports:
        - name: postgresql
          containerPort: 5432
          protocol: TCP
        - name: patroni
          containerPort: 8008
          protocol: TCP
        env:
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: password
        - name: PGDATA
          value: /var/lib/postgresql/data/pgdata
        - name: PATRONI_SCOPE
          value: ulms-cluster
        - name: PATRONI_KUBERNETES_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        - name: PATRONI_KUBERNETES_LABELS
          value: "{app: postgresql, cluster-name: ulms-cluster}"
        - name: PATRONI_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: PATRONI_POSTGRESQL_DATA_DIR
          value: /var/lib/postgresql/data/pgdata
        - name: PATRONI_POSTGRESQL_LISTEN
          value: "0.0.0.0:5432"
        - name: PATRONI_RESTAPI_LISTEN
          value: "0.0.0.0:8008"
        - name: PATRONI_POSTGRESQL_CONNECT_ADDRESS
          value: "$(POD_IP):5432"
        - name: POD_IP
          valueFrom:
            fieldRef:
              fieldPath: status.podIP
        resources:
          requests:
            cpu: "2000m"
            memory: "8Gi"
          limits:
            cpu: "4000m"
            memory: "16Gi"
        volumeMounts:
        - name: pgdata
          mountPath: /var/lib/postgresql/data
        - name: postgres-config
          mountPath: /etc/postgresql
          readOnly: true
        livenessProbe:
          httpGet:
            path: /liveness
            port: 8008
          initialDelaySeconds: 60
          periodSeconds: 30
          timeoutSeconds: 5
        readinessProbe:
          httpGet:
            path: /readiness
            port: 8008
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 3
      volumes:
      - name: postgres-config
        configMap:
          name: postgres-config
  volumeClaimTemplates:
  - metadata:
      name: pgdata
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: gp3-encrypted
      resources:
        requests:
          storage: 500Gi
```

### 6.2 Redis Cluster StatefulSet

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis-cluster
  namespace: ulms-production
  labels:
    app: redis
spec:
  serviceName: redis-cluster
  replicas: 6  # 3 masters + 3 replicas
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchLabels:
                app: redis
            topologyKey: kubernetes.io/hostname
      containers:
      - name: redis
        image: redis:7.2-alpine
        command:
        - redis-server
        - /conf/redis.conf
        ports:
        - name: redis
          containerPort: 6379
          protocol: TCP
        - name: cluster
          containerPort: 16379
          protocol: TCP
        env:
        - name: POD_IP
          valueFrom:
            fieldRef:
              fieldPath: status.podIP
        resources:
          requests:
            cpu: "500m"
            memory: "2Gi"
          limits:
            cpu: "1000m"
            memory: "4Gi"
        volumeMounts:
        - name: redis-data
          mountPath: /data
        - name: redis-config
          mountPath: /conf
          readOnly: true
        livenessProbe:
          exec:
            command:
            - redis-cli
            - ping
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - redis-cli
            - cluster
            - info
          initialDelaySeconds: 15
          periodSeconds: 5
      volumes:
      - name: redis-config
        configMap:
          name: redis-cluster-config
  volumeClaimTemplates:
  - metadata:
      name: redis-data
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: gp3-encrypted
      resources:
        requests:
          storage: 50Gi
```

### 6.3 Kafka StatefulSet

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: kafka
  namespace: ulms-production
spec:
  serviceName: kafka-cluster
  replicas: 3
  selector:
    matchLabels:
      app: kafka
  template:
    metadata:
      labels:
        app: kafka
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchLabels:
                app: kafka
            topologyKey: kubernetes.io/hostname
      containers:
      - name: kafka
        image: confluentinc/cp-kafka:7.5.0
        ports:
        - name: kafka
          containerPort: 9092
        - name: internal
          containerPort: 9093
        env:
        - name: KAFKA_BROKER_ID
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: KAFKA_ZOOKEEPER_CONNECT
          value: "zookeeper:2181"
        - name: KAFKA_ADVERTISED_LISTENERS
          value: "PLAINTEXT://$(POD_NAME).kafka-cluster:9092"
        - name: KAFKA_LISTENER_SECURITY_PROTOCOL_MAP
          value: "PLAINTEXT:PLAINTEXT"
        - name: KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR
          value: "3"
        - name: KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR
          value: "3"
        - name: KAFKA_TRANSACTION_STATE_LOG_MIN_ISR
          value: "2"
        - name: KAFKA_DEFAULT_REPLICATION_FACTOR
          value: "3"
        - name: KAFKA_MIN_INSYNC_REPLICAS
          value: "2"
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        resources:
          requests:
            cpu: "1000m"
            memory: "4Gi"
          limits:
            cpu: "2000m"
            memory: "8Gi"
        volumeMounts:
        - name: kafka-data
          mountPath: /var/lib/kafka/data
  volumeClaimTemplates:
  - metadata:
      name: kafka-data
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: gp3-encrypted
      resources:
        requests:
          storage: 200Gi
```

### 6.4 Infrastructure Services Summary

| Service | Type | Replicas | CPU Request/Limit | Memory Request/Limit | Storage |
|---------|------|----------|-------------------|---------------------|---------|
| **PostgreSQL (Patroni)** | StatefulSet | 3 | 2000m / 4000m | 8Gi / 16Gi | 500Gi SSD |
| **Redis Cluster** | StatefulSet | 6 | 500m / 1000m | 2Gi / 4Gi | 50Gi SSD |
| **Kafka** | StatefulSet | 3 | 1000m / 2000m | 4Gi / 8Gi | 200Gi SSD |
| **ZooKeeper** | StatefulSet | 3 | 250m / 500m | 512Mi / 1Gi | 20Gi SSD |
| **MinIO** | StatefulSet | 4 | 500m / 1000m | 2Gi / 4Gi | 1Ti HDD |
| **Elasticsearch** | StatefulSet | 3 | 1000m / 2000m | 4Gi / 8Gi | 200Gi SSD |
| **Kong Gateway** | Deployment | 3-5 | 1000m / 2000m | 2Gi / 4Gi | - |
| **Keycloak** | Deployment | 2-3 | 1000m / 2000m | 2Gi / 4Gi | - |
| **Vault** | StatefulSet | 3 | 250m / 500m | 512Mi / 1Gi | 10Gi SSD |

---

## 7. Horizontal Pod Autoscaling Configuration

### 7.1 HPA for Apache Fineract

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: fineract-hpa
  namespace: ulms-production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ulms-fineract
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70  # Scale at 70% CPU
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80  # Scale at 80% memory
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"  # Scale when >1000 RPS per pod
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100  # Double pods
        periodSeconds: 60
      - type: Pods
        value: 2    # Or add 2 pods
        periodSeconds: 60
      selectPolicy: Max
    scaleDown:
      stabilizationWindowSeconds: 300  # Wait 5 min before scale down
      policies:
      - type: Percent
        value: 50   # Remove 50% of pods
        periodSeconds: 120
      - type: Pods
        value: 1    # Or remove 1 pod
        periodSeconds: 120
      selectPolicy: Min
```

### 7.2 HPA Configuration Matrix

| Service | Min | Max | CPU Target | Memory Target | Custom Metric | Scale Up | Scale Down |
|---------|-----|-----|------------|---------------|---------------|----------|------------|
| Fineract | 3 | 20 | 70% | 80% | http_requests/s | +100% / 60s | -50% / 120s |
| CIB Service | 3 | 10 | 70% | 80% | cib_inquiries/s | +100% / 60s | -50% / 120s |
| NID Service | 3 | 10 | 70% | 80% | nid_verifications/s | +100% / 60s | -50% / 120s |
| Workflow Service | 3 | 10 | 70% | 80% | active_workflows | +100% / 60s | -50% / 120s |
| Document Service | 2 | 8 | 70% | 80% | document_uploads/s | +100% / 60s | -50% / 120s |
| BRPD Service | 2 | 6 | 70% | 80% | classification_jobs | +50% / 60s | -50% / 120s |
| Notification Service | 2 | 10 | 70% | 80% | messages_sent/s | +100% / 60s | -50% / 120s |
| Analytics Service | 2 | 8 | 70% | 80% | report_requests/s | +100% / 60s | -50% / 120s |
| Integration Gateway | 2 | 8 | 70% | 80% | integration_calls/s | +100% / 60s | -50% / 120s |

**HPA Decision Logic:**
1. **Scale Up**: Triggered when CPU > 70% OR Memory > 80% OR custom metric exceeds threshold
2. **Scale Up Rate**: Max of (100% increase, +2 pods) per minute
3. **Scale Down**: Triggered when all metrics below threshold for 5 minutes
4. **Scale Down Rate**: Min of (50% reduction, -1 pod) per 2 minutes
5. **Stabilization**: Prevents flapping, ensures stable scaling decisions

---

## 8. Service Discovery & Load Balancing

### 8.1 ClusterIP Service for Fineract

```yaml
apiVersion: v1
kind: Service
metadata:
  name: fineract-service
  namespace: ulms-production
  labels:
    app: fineract
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "8080"
spec:
  type: ClusterIP
  selector:
    app: fineract
    component: core
  ports:
  - name: http
    port: 8443
    targetPort: 8443
    protocol: TCP
  - name: actuator
    port: 8080
    targetPort: 8080
    protocol: TCP
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 10800  # 3 hours (maintain session for long-running loan applications)
```

### 8.2 LoadBalancer Service for Kong Gateway

```yaml
apiVersion: v1
kind: Service
metadata:
  name: kong-proxy
  namespace: ulms-production
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
    service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled: "true"
    service.beta.kubernetes.io/aws-load-balancer-backend-protocol: "tcp"
    service.beta.kubernetes.io/aws-load-balancer-ssl-cert: "arn:aws:acm:us-east-1:123456789:certificate/ulms-cert"
    service.beta.kubernetes.io/aws-load-balancer-ssl-ports: "443"
spec:
  type: LoadBalancer
  loadBalancerSourceRanges:
  - 103.82.40.0/22  # Unisoft office IP range
  - 10.0.0.0/8      # Internal VPC
  selector:
    app: kong
    component: proxy
  ports:
  - name: https
    port: 443
    targetPort: 8443
    protocol: TCP
  - name: http
    port: 80
    targetPort: 8000
    protocol: TCP
```

### 8.3 Headless Service for PostgreSQL StatefulSet

```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres-cluster
  namespace: ulms-production
  labels:
    app: postgresql
spec:
  clusterIP: None  # Headless service for StatefulSet discovery
  selector:
    app: postgresql
    cluster-name: ulms-cluster
  ports:
  - name: postgresql
    port: 5432
    targetPort: 5432
    protocol: TCP
  - name: patroni
    port: 8008
    targetPort: 8008
    protocol: TCP
```

### 8.4 NGINX Ingress Configuration

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ulms-ingress
  namespace: ulms-production
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/ssl-protocols: "TLSv1.3"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "30"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "120"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "120"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://ulms.unisoftbd.com"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - ulms.unisoftbd.com
    - api.ulms.unisoftbd.com
    - admin.ulms.unisoftbd.com
    secretName: ulms-tls-certificate
  rules:
  - host: ulms.unisoftbd.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ulms-frontend
            port:
              number: 80
  - host: api.ulms.unisoftbd.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: kong-proxy
            port:
              number: 8000
  - host: admin.ulms.unisoftbd.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ulms-admin-panel
            port:
              number: 80
```

### 8.5 Service Types Strategy

| Service Type | Use Case | Example Services |
|-------------|----------|------------------|
| **ClusterIP** | Internal service-to-service communication | All microservices, databases |
| **LoadBalancer** | External access from internet | Kong Gateway, NGINX Ingress |
| **Headless** | StatefulSet pod discovery (DNS-based) | PostgreSQL, Kafka, Redis, ZooKeeper |
| **NodePort** | Development/testing only | Staging environment services |

---

## 9. Storage Architecture & Persistent Volumes

### 9.1 StorageClass Definitions

**GP3 Encrypted StorageClass** (AWS EBS gp3, encrypted with KMS):
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: gp3-encrypted
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  encrypted: "true"
  kmsKeyId: "arn:aws:kms:us-east-1:123456789:key/ulms-ebs-key"
  iops: "3000"
  throughput: "125"
allowVolumeExpansion: true
reclaimPolicy: Retain
volumeBindingMode: WaitForFirstConsumer
```

**EFS Shared StorageClass** (AWS EFS for shared storage):
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: efs-sc
provisioner: efs.csi.aws.com
parameters:
  provisioningMode: efs-ap
  fileSystemId: fs-0123456789abcdef
  directoryPerms: "700"
  gidRangeStart: "1000"
  gidRangeEnd: "2000"
  basePath: "/ulms"
reclaimPolicy: Retain
volumeBindingMode: Immediate
```

### 9.2 Storage Allocation Matrix

| Component | Storage Type | Size | IOPS | Throughput | Backup Frequency | Retention |
|-----------|-------------|------|------|------------|------------------|-----------|
| PostgreSQL (per replica) | EBS gp3 | 500 GB | 3000 | 125 MB/s | Hourly incremental | 30 days |
| Redis (per node) | EBS gp3 | 50 GB | 3000 | 125 MB/s | Daily snapshot | 7 days |
| Kafka (per broker) | EBS gp3 | 200 GB | 5000 | 250 MB/s | Topic replication (no backup) | 7 days |
| Elasticsearch (per node) | EBS gp3 | 200 GB | 3000 | 125 MB/s | Weekly snapshot | 30 days |
| MinIO (per node) | EBS gp3 | 1 TB | 5000 | 250 MB/s | Daily versioning | 90 days |
| ZooKeeper (per node) | EBS gp3 | 20 GB | 3000 | 125 MB/s | Daily snapshot | 7 days |
| Vault (per node) | EBS gp3 | 10 GB | 3000 | 125 MB/s | Daily backup | 90 days |
| Shared logs (all pods) | EFS | 1 TB | N/A | N/A | Weekly rotation | 90 days |

**Total Storage Requirements:**
- **Production Namespace**: ~5 TB (PostgreSQL 1.5TB + Kafka 600GB + MinIO 4TB + Others)
- **Staging Namespace**: ~2 TB (50% of production)
- **Monitoring Namespace**: ~10 TB (Elasticsearch logs, Prometheus TSDB)
- **Grand Total**: ~17 TB

### 9.3 PersistentVolumeClaim Example

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: fineract-logs-pvc
  namespace: ulms-production
spec:
  accessModes:
  - ReadWriteMany  # Multiple pods can access
  storageClassName: efs-sc
  resources:
    requests:
      storage: 100Gi
```

### 9.4 Backup Storage Configuration

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-backup-pvc
  namespace: ulms-production
spec:
  accessModes:
  - ReadWriteOnce
  storageClassName: gp3-encrypted
  resources:
    requests:
      storage: 1Ti  # 2x PostgreSQL size for backup retention
```

---

## 10. Security Configuration

### 10.1 RBAC - ServiceAccount for Fineract

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: fineract-sa
  namespace: ulms-production
automountServiceAccountToken: true

---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: fineract-role
  namespace: ulms-production
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["services"]
  verbs: ["get", "list"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: fineract-rolebinding
  namespace: ulms-production
subjects:
- kind: ServiceAccount
  name: fineract-sa
  namespace: ulms-production
roleRef:
  kind: Role
  name: fineract-role
  apiGroup: rbac.authorization.k8s.io
```

### 10.2 NetworkPolicy - Microservice Isolation

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: fineract-netpol
  namespace: ulms-production
spec:
  podSelector:
    matchLabels:
      app: fineract
  policyTypes:
  - Ingress
  - Egress
  ingress:
  # Allow traffic from Kong Gateway only
  - from:
    - podSelector:
        matchLabels:
          app: kong
          component: proxy
    ports:
    - protocol: TCP
      port: 8443
  # Allow traffic from monitoring namespace for metrics
  - from:
    - namespaceSelector:
        matchLabels:
          name: ulms-monitoring
    ports:
    - protocol: TCP
      port: 8080  # Prometheus metrics
  egress:
  # Allow PostgreSQL access
  - to:
    - podSelector:
        matchLabels:
          app: postgresql
    ports:
    - protocol: TCP
      port: 5432
  # Allow Redis access
  - to:
    - podSelector:
        matchLabels:
          app: redis
    ports:
    - protocol: TCP
      port: 6379
  # Allow Kafka access
  - to:
    - podSelector:
        matchLabels:
          app: kafka
    ports:
    - protocol: TCP
      port: 9092
  # Allow DNS
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    - podSelector:
        matchLabels:
          k8s-app: kube-dns
    ports:
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 53
  # Allow external HTTPS (for CIB, NID, payment gateways)
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 443
```

### 10.3 PodSecurityStandard (Restricted)

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ulms-production
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

**Restricted PSS Requirements:**
- Must run as non-root user
- Must drop all capabilities
- Cannot run privileged containers
- Cannot mount host paths
- Must use read-only root filesystem (where possible)

### 10.4 PodDisruptionBudget

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: fineract-pdb
  namespace: ulms-production
spec:
  minAvailable: 2  # Always keep minimum 2 pods running
  selector:
    matchLabels:
      app: fineract
      component: core

---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: postgresql-pdb
  namespace: ulms-production
spec:
  minAvailable: 2  # Always keep 2 running (1 primary + 1 standby minimum)
  selector:
    matchLabels:
      app: postgresql
```

### 10.5 Secrets Management with Vault CSI Driver

```yaml
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: vault-database-secrets
  namespace: ulms-production
spec:
  provider: vault
  parameters:
    vaultAddress: "https://vault.ulms.internal:8200"
    roleName: "ulms-production"
    vaultSkipTLSVerify: "false"
    vaultCACertPath: "/etc/vault-ca/ca.crt"
    objects: |
      - objectName: "database-username"
        secretPath: "secret/data/ulms/production/postgres"
        secretKey: "username"
      - objectName: "database-password"
        secretPath: "secret/data/ulms/production/postgres"
        secretKey: "password"
      - objectName: "jdbc-url"
        secretPath: "secret/data/ulms/production/postgres"
        secretKey: "jdbc-url"
  secretObjects:
  - secretName: database-credentials
    type: Opaque
    data:
    - objectName: database-username
      key: username
    - objectName: database-password
      key: password
    - objectName: jdbc-url
      key: jdbc-url
```

### 10.6 Security Best Practices Summary

| Security Control | Implementation | Priority |
|------------------|----------------|----------|
| **RBAC** | ServiceAccounts with minimal permissions | Critical |
| **Network Policies** | Deny-all default, explicit allow rules | Critical |
| **Pod Security** | Restricted PSS, non-root, drop capabilities | Critical |
| **Secrets Management** | Vault CSI driver, dynamic credentials | Critical |
| **TLS Encryption** | mTLS for inter-service, TLS 1.3 for ingress | Critical |
| **Pod Disruption Budget** | Maintain minimum availability during upgrades | High |
| **Image Security** | Signed images, vulnerability scanning (Trivy) | High |
| **Audit Logging** | All API server requests logged | Critical |

---

## 11. High Availability & Disaster Recovery

### 11.1 High Availability Strategy

| Component | HA Strategy | Replicas | Failover Time | Data Loss |
|-----------|------------|----------|---------------|-----------|
| **Control Plane** | Multi-master (3 AZs) | 3 | < 30 seconds | None |
| **Worker Nodes** | Multi-AZ spread | 12-30 | < 1 minute | None |
| **Fineract** | Anti-affinity + HPA | 3-20 | < 10 seconds | None |
| **PostgreSQL** | Patroni auto-failover | 1+2 | < 30 seconds | None (sync replication) |
| **Redis** | Cluster mode | 3+3 | < 10 seconds | Minimal (cache only) |
| **Kafka** | Multi-broker replication | 3 | < 30 seconds | None (replication factor 3) |
| **Kong Gateway** | Load balanced | 3-5 | < 10 seconds | None (stateless) |
| **Keycloak** | Load balanced + DB | 2-3 | < 10 seconds | None (PostgreSQL backend) |

### 11.2 Pod Anti-Affinity for Critical Services

```yaml
spec:
  affinity:
    podAntiAffinity:
      # Hard constraint: MUST be on different nodes
      requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchLabels:
            app: fineract
            component: core
        topologyKey: kubernetes.io/hostname
      # Soft constraint: PREFER different availability zones
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchLabels:
              app: fineract
              component: core
          topologyKey: topology.kubernetes.io/zone
```

### 11.3 Disaster Recovery Configuration

**Primary Site**: Mumbai (ap-south-1)
- 3 Availability Zones
- 18-30 worker nodes
- Full production deployment

**DR Site**: Singapore (ap-southeast-1)
- 2 Availability Zones
- 6-12 worker nodes (standby)
- Asynchronous replication from primary

**Velero Backup Schedule:**
```yaml
apiVersion: velero.io/v1
kind: Schedule
metadata:
  name: ulms-production-backup
  namespace: velero
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  template:
    includedNamespaces:
    - ulms-production
    ttl: 720h0m0s  # Retain 30 days
    snapshotVolumes: true
    storageLocation: aws-s3-backup
    volumeSnapshotLocations:
    - aws-ebs-snapshots
    labelSelector:
      matchLabels:
        backup: enabled
```

### 11.4 RTO/RPO Targets

| Failure Scenario | RTO (Recovery Time) | RPO (Data Loss) | Recovery Procedure |
|------------------|---------------------|-----------------|-------------------|
| Pod failure | < 10 seconds | 0 | Automatic restart by kubelet |
| Node failure | < 1 minute | 0 | Pod rescheduling to healthy nodes |
| Database primary failure | < 30 seconds | 0 | Patroni promotes standby |
| Availability Zone failure | < 5 minutes | 0 | Pods reschedule to other AZs |
| Complete cluster failure | < 4 hours | < 1 hour | DR cluster activation in Singapore |
| Data corruption | < 2 hours | < 24 hours | Restore from Velero/pgBackRest backup |

---

## 12. Monitoring & Observability Integration

### 12.1 Prometheus Configuration

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: ulms-monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
      external_labels:
        cluster: ulms-production
        environment: production
        region: ap-south-1

    # Alertmanager configuration
    alerting:
      alertmanagers:
      - static_configs:
        - targets:
          - alertmanager:9093

    # Rule files
    rule_files:
    - /etc/prometheus/rules/*.yml

    # Scrape configurations
    scrape_configs:
    # Kubernetes API Server
    - job_name: kubernetes-apiservers
      kubernetes_sd_configs:
      - role: endpoints
        namespaces:
          names:
          - default
      scheme: https
      tls_config:
        ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
      bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
      relabel_configs:
      - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
        action: keep
        regex: default;kubernetes;https

    # Kubernetes Nodes
    - job_name: kubernetes-nodes
      kubernetes_sd_configs:
      - role: node
      scheme: https
      tls_config:
        ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
      bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
      relabel_configs:
      - action: labelmap
        regex: __meta_kubernetes_node_label_(.+)

    # Fineract and all microservices
    - job_name: fineract
      kubernetes_sd_configs:
      - role: pod
        namespaces:
          names:
          - ulms-production
      relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        action: keep
        regex: fineract
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
      - action: labelmap
        regex: __meta_kubernetes_pod_label_(.+)
      - source_labels: [__meta_kubernetes_namespace]
        target_label: kubernetes_namespace
      - source_labels: [__meta_kubernetes_pod_name]
        target_label: kubernetes_pod_name

    # All microservices
    - job_name: microservices
      kubernetes_sd_configs:
      - role: pod
        namespaces:
          names:
          - ulms-production
      relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_component]
        action: keep
        regex: microservice
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
      - action: labelmap
        regex: __meta_kubernetes_pod_label_(.+)

    # PostgreSQL
    - job_name: postgresql
      static_configs:
      - targets:
        - postgresql-patroni-0.postgres-cluster:9187
        - postgresql-patroni-1.postgres-cluster:9187
        - postgresql-patroni-2.postgres-cluster:9187
      relabel_configs:
      - source_labels: [__address__]
        target_label: instance

    # Redis
    - job_name: redis
      static_configs:
      - targets:
        - redis-cluster-0.redis-cluster:9121
        - redis-cluster-1.redis-cluster:9121
        - redis-cluster-2.redis-cluster:9121
      relabel_configs:
      - source_labels: [__address__]
        target_label: instance

    # Kafka
    - job_name: kafka
      static_configs:
      - targets:
        - kafka-0.kafka-cluster:9308
        - kafka-1.kafka-cluster:9308
        - kafka-2.kafka-cluster:9308
```

### 12.2 Alert Rules

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-alerts
  namespace: ulms-monitoring
data:
  alerts.yml: |
    groups:
    - name: ulms_critical
      interval: 30s
      rules:
      # High error rate
      - alert: HighErrorRate
        expr: |
          (
            sum(rate(http_server_requests_seconds_count{status=~"5..",namespace="ulms-production"}[5m]))
            /
            sum(rate(http_server_requests_seconds_count{namespace="ulms-production"}[5m]))
          ) > 0.05
        for: 5m
        labels:
          severity: critical
          team: backend
        annotations:
          summary: "High error rate detected in {{ $labels.namespace }}"
          description: "Error rate is {{ $value | humanizePercentage }} for {{ $labels.job }}"
          runbook: "https://wiki.unisoft.com/runbooks/high-error-rate"

      # High response time
      - alert: HighResponseTime
        expr: |
          histogram_quantile(0.95,
            sum(rate(http_server_requests_seconds_bucket{namespace="ulms-production"}[5m])) by (le, job)
          ) > 2
        for: 10m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "High API response time in {{ $labels.namespace }}"
          description: "95th percentile response time is {{ $value }}s for {{ $labels.job }}"

      # Database connection pool exhaustion
      - alert: DatabaseConnectionPoolHigh
        expr: |
          (
            hikaricp_connections_active{namespace="ulms-production"}
            /
            hikaricp_connections_max{namespace="ulms-production"}
          ) > 0.8
        for: 5m
        labels:
          severity: warning
          team: database
        annotations:
          summary: "Database connection pool usage high"
          description: "Connection pool for {{ $labels.job }} is {{ $value | humanizePercentage }} full"

      # Pod restart loop
      - alert: PodRestartLoop
        expr: |
          rate(kube_pod_container_status_restarts_total{namespace="ulms-production"}[15m]) > 0.1
        for: 5m
        labels:
          severity: critical
          team: devops
        annotations:
          summary: "Pod restart loop detected"
          description: "Pod {{ $labels.pod }} in namespace {{ $labels.namespace }} is restarting frequently"

      # Node memory pressure
      - alert: NodeMemoryPressure
        expr: |
          kube_node_status_condition{condition="MemoryPressure",status="true"} == 1
        for: 5m
        labels:
          severity: critical
          team: devops
        annotations:
          summary: "Node {{ $labels.node }} under memory pressure"
          description: "Node {{ $labels.node }} is experiencing memory pressure"

      # Disk space low
      - alert: DiskSpaceLow
        expr: |
          (
            node_filesystem_avail_bytes{mountpoint="/"}
            /
            node_filesystem_size_bytes{mountpoint="/"}
          ) < 0.15
        for: 10m
        labels:
          severity: warning
          team: devops
        annotations:
          summary: "Disk space low on {{ $labels.instance }}"
          description: "Disk space is {{ $value | humanizePercentage }} full on {{ $labels.instance }}"
```

### 12.3 Grafana Dashboard List

| Dashboard | Purpose | Key Metrics |
|-----------|---------|-------------|
| **Cluster Overview** | Overall health | CPU, memory, disk, network, pod count |
| **Application Metrics** | Fineract + microservices | RPS, latency (p50/p95/p99), errors, active connections |
| **Database Performance** | PostgreSQL | Connections, queries/sec, replication lag, cache hit ratio |
| **Business Metrics** | Loan processing | Applications submitted, approvals, disbursements, TAT |
| **SLA Dashboard** | 99.9% uptime tracking | Availability, response time SLO, error budget |
| **Kafka Metrics** | Message broker | Consumer lag, throughput, partition status |

### 12.4 ELK Stack Integration

**Filebeat DaemonSet** (log shipping from all pods):
```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: filebeat
  namespace: ulms-monitoring
spec:
  selector:
    matchLabels:
      app: filebeat
  template:
    metadata:
      labels:
        app: filebeat
    spec:
      serviceAccountName: filebeat
      containers:
      - name: filebeat
        image: docker.elastic.co/beats/filebeat:8.11.0
        volumeMounts:
        - name: config
          mountPath: /usr/share/filebeat/filebeat.yml
          subPath: filebeat.yml
        - name: varlog
          mountPath: /var/log
          readOnly: true
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true
        env:
        - name: ELASTICSEARCH_HOST
          value: "elasticsearch:9200"
        - name: ELASTICSEARCH_USERNAME
          value: "elastic"
        - name: ELASTICSEARCH_PASSWORD
          valueFrom:
            secretKeyRef:
              name: elasticsearch-credentials
              key: password
      volumes:
      - name: config
        configMap:
          name: filebeat-config
      - name: varlog
        hostPath:
          path: /var/log
      - name: varlibdockercontainers
        hostPath:
          path: /var/lib/docker/containers
```

---

## 13. GitOps & CI/CD Integration

### 13.1 ArgoCD Application Definition

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ulms-production
  namespace: argocd
  finalizers:
  - resources-finalizer.argocd.argoproj.io
spec:
  project: ulms
  source:
    repoURL: https://gitlab.unisoftbd.com/ulms/k8s-manifests.git
    targetRevision: main
    path: environments/production
    directory:
      recurse: true
  destination:
    server: https://kubernetes.default.svc
    namespace: ulms-production
  syncPolicy:
    automated:
      prune: false  # Don't auto-delete resources (safety)
      selfHeal: true  # Auto-sync if drift detected
      allowEmpty: false
    syncOptions:
    - CreateNamespace=true
    - PrunePropagationPolicy=foreground
    - PruneLast=true
    - RespectIgnoreDifferences=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
  revisionHistoryLimit: 10
  ignoreDifferences:
  - group: apps
    kind: Deployment
    jsonPointers:
    - /spec/replicas  # Ignore replica count (managed by HPA)
```

### 13.2 Git Repository Structure

```
ulms-k8s-manifests/
├── base/
│   ├── fineract/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── hpa.yaml
│   │   ├── configmap.yaml
│   │   └── kustomization.yaml
│   ├── cib-service/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── hpa.yaml
│   │   └── kustomization.yaml
│   ├── [other microservices...]/
│   ├── postgresql/
│   │   ├── statefulset.yaml
│   │   ├── service.yaml
│   │   ├── configmap.yaml
│   │   └── kustomization.yaml
│   └── [other infrastructure...]/
├── environments/
│   ├── production/
│   │   ├── kustomization.yaml
│   │   ├── namespace.yaml
│   │   ├── secrets.yaml (sealed)
│   │   └── patches/
│   │       ├── fineract-production.yaml
│   │       └── resource-limits.yaml
│   ├── staging/
│   │   ├── kustomization.yaml
│   │   ├── namespace.yaml
│   │   └── patches/
│   └── monitoring/
│       ├── kustomization.yaml
│       └── prometheus/
└── README.md
```

### 13.3 Kustomization for Production

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: ulms-production

# Base resources
resources:
- ../../base/fineract
- ../../base/cib-service
- ../../base/nid-service
- ../../base/workflow-service
- ../../base/document-service
- ../../base/brpd-service
- ../../base/notification-service
- ../../base/analytics-service
- ../../base/integration-gateway
- ../../base/postgresql
- ../../base/redis
- ../../base/kafka
- ../../base/kong
- ../../base/keycloak
- namespace.yaml

# Patches for production
patchesStrategicMerge:
- patches/fineract-production.yaml
- patches/resource-limits.yaml

# ConfigMap generator
configMapGenerator:
- name: environment-config
  literals:
  - ENVIRONMENT=production
  - LOG_LEVEL=INFO
  - DATABASE_POOL_SIZE=50
  - CACHE_TTL=3600

# Secret generator (from sealed secrets)
secretGenerator:
- name: database-credentials
  files:
  - secrets/db-username.txt
  - secrets/db-password.txt
  - secrets/jdbc-url.txt

# Common labels
commonLabels:
  environment: production
  managed-by: argocd
  project: ulms

# Common annotations
commonAnnotations:
  managed-by: argocd
  deployment-date: "2026-02-05"
```

### 13.4 CI/CD Pipeline Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Git Push   │───▶│  GitLab CI   │───▶│ Docker Build │───▶│  Registry    │
│  (develop)   │    │  (5 stages)  │    │  & Push      │    │  (ACR/ECR)   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                            │                                        │
                            ▼                                        ▼
                    ┌──────────────┐                        ┌──────────────┐
                    │  Test Suite  │                        │  Update K8s  │
                    │  (Unit, Int) │                        │  Manifests   │
                    └──────────────┘                        └──────────────┘
                            │                                        │
                            ▼                                        ▼
                    ┌──────────────┐                        ┌──────────────┐
                    │  SonarQube   │                        │   ArgoCD     │
                    │  Quality Gate│                        │   Detects    │
                    └──────────────┘                        │   Change     │
                            │                                └──────────────┘
                            ▼                                        │
                    ┌──────────────┐                                ▼
                    │ Approve MR   │                        ┌──────────────┐
                    │  (to main)   │                        │   Rolling    │
                    └──────────────┘                        │   Update     │
                            │                                └──────────────┘
                            ▼                                        │
                    ┌──────────────┐                                ▼
                    │  Production  │                        ┌──────────────┐
                    │  Deployment  │                        │  Health      │
                    └──────────────┘                        │  Checks      │
                                                             └──────────────┘
                                                                     │
                                                                     ▼
                                                             ┌──────────────┐
                                                             │  Deployment  │
                                                             │  Complete    │
                                                             └──────────────┘
```

---

## 14. Backup & Recovery Strategy

### 14.1 Velero Backup Configuration

```yaml
apiVersion: velero.io/v1
kind: BackupStorageLocation
metadata:
  name: aws-s3-backup
  namespace: velero
spec:
  provider: aws
  objectStorage:
    bucket: ulms-k8s-backups
    prefix: production
  config:
    region: us-east-1
    serverSideEncryption: AES256
    kmsKeyId: arn:aws:kms:us-east-1:123456789:key/velero-backup-key

---
apiVersion: velero.io/v1
kind: VolumeSnapshotLocation
metadata:
  name: aws-ebs-snapshots
  namespace: velero
spec:
  provider: aws
  config:
    region: us-east-1
```

### 14.2 Backup Schedule Matrix

| Backup Type | Frequency | Retention | Storage Location | Encryption |
|-------------|-----------|-----------|------------------|------------|
| **Full cluster backup** | Daily 2 AM | 30 days | S3 + Glacier | AES-256 |
| **PostgreSQL full backup** | Weekly (Sunday 2 AM) | 90 days | S3 + RDS snapshots | AES-256-TDE |
| **PostgreSQL incremental** | Every 6 hours | 7 days | S3 | AES-256 |
| **EBS volume snapshots** | Daily | 14 days | EBS snapshots | KMS encrypted |
| **Application configs** | On Git commit | 1 year | Git repository | At rest |
| **Secrets backup** | Weekly | 90 days | Encrypted S3 | Vault-sealed |

### 14.3 PostgreSQL Backup with pgBackRest

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: ulms-production
spec:
  schedule: "0 */6 * * *"  # Every 6 hours
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 3
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: postgres-backup-sa
          containers:
          - name: pg-backup
            image: pgbackrest/pgbackrest:latest
            command:
            - /bin/sh
            - -c
            - |
              TIMESTAMP=$(date +%Y%m%d_%H%M%S)
              BACKUP_FILE="/backups/ulms_${TIMESTAMP}.sql.gz"

              # Full backup of all schemas
              pg_dumpall -h postgres-cluster -U postgres | gzip > ${BACKUP_FILE}

              # Upload to S3
              aws s3 cp ${BACKUP_FILE} s3://ulms-db-backups/production/

              # Cleanup local backups older than 2 days
              find /backups -name "*.sql.gz" -mtime +2 -delete

              # Verify backup integrity
              gunzip -t ${BACKUP_FILE}

              echo "Backup completed: ${BACKUP_FILE}"
            env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-credentials
                  key: password
            - name: AWS_ACCESS_KEY_ID
              valueFrom:
                secretKeyRef:
                  name: aws-credentials
                  key: access-key-id
            - name: AWS_SECRET_ACCESS_KEY
              valueFrom:
                secretKeyRef:
                  name: aws-credentials
                  key: secret-access-key
            volumeMounts:
            - name: backup-volume
              mountPath: /backups
          volumes:
          - name: backup-volume
            persistentVolumeClaim:
              claimName: postgres-backup-pvc
          restartPolicy: OnFailure
```

### 14.4 Restore Procedures

**Restore from Velero:**
```bash
# List available backups
velero backup get

# Restore entire namespace
velero restore create --from-backup ulms-production-20260205

# Restore specific resources
velero restore create --from-backup ulms-production-20260205 \
  --include-namespaces ulms-production \
  --include-resources deployments,services,configmaps
```

**Restore PostgreSQL:**
```bash
# Stop all application pods
kubectl scale deployment -n ulms-production --all --replicas=0

# Restore database
kubectl exec -n ulms-production postgresql-patroni-0 -- \
  sh -c 'gunzip -c /backups/ulms_20260205_020000.sql.gz | psql -U postgres'

# Restart application pods
kubectl scale deployment -n ulms-production --all --replicas=3
```

---

## 15. Operational Procedures

### 15.1 Common Operations

| Operation | Command | Frequency |
|-----------|---------|-----------|
| **Check pod status** | `kubectl get pods -n ulms-production` | As needed |
| **View pod logs** | `kubectl logs -f <pod-name> -n ulms-production` | As needed |
| **Describe pod** | `kubectl describe pod <pod-name> -n ulms-production` | Troubleshooting |
| **Scale deployment** | `kubectl scale deployment fineract --replicas=10 -n ulms-production` | As needed |
| **Restart deployment** | `kubectl rollout restart deployment/fineract -n ulms-production` | As needed |
| **Check HPA status** | `kubectl get hpa -n ulms-production` | Daily |
| **View events** | `kubectl get events -n ulms-production --sort-by='.lastTimestamp'` | Troubleshooting |
| **Execute command in pod** | `kubectl exec -it <pod-name> -n ulms-production -- /bin/bash` | As needed |
| **Port forward** | `kubectl port-forward svc/fineract-service 8443:8443 -n ulms-production` | Development |

### 15.2 Troubleshooting Guide

| Issue | Diagnosis | Resolution |
|-------|-----------|------------|
| **CrashLoopBackOff** | `kubectl logs <pod> -n ulms-production --previous` | Fix configuration, increase resources, check dependencies |
| **ImagePullBackOff** | `kubectl describe pod <pod> -n ulms-production` | Verify image name, check imagePullSecrets, registry access |
| **High memory usage** | `kubectl top pods -n ulms-production` | Scale horizontally (HPA), increase memory limits, investigate memory leaks |
| **Database connection errors** | `kubectl logs <pod> -n ulms-production \| grep "connection"` | Verify PostgreSQL service, check credentials in secrets, increase connection pool |
| **503 Service Unavailable** | `kubectl get endpoints -n ulms-production` | Check pod readiness probes, ensure pods are running, verify service selector |
| **High CPU usage** | `kubectl top nodes && kubectl top pods -n ulms-production` | Scale horizontally (HPA), optimize application code, increase CPU limits |
| **PVC not binding** | `kubectl get pvc -n ulms-production && kubectl get pv` | Check StorageClass availability, verify capacity, troubleshoot CSI driver |

### 15.3 Rolling Update Procedure

```bash
# 1. Update image in deployment (via kubectl)
kubectl set image deployment/fineract \
  fineract=ulms-registry.azurecr.io/fineract:1.10.1 \
  -n ulms-production

# 2. Monitor rollout status
kubectl rollout status deployment/fineract -n ulms-production

# Output: Waiting for deployment "fineract" rollout to finish: 1 out of 3 new replicas have been updated...
# Output: deployment "fineract" successfully rolled out

# 3. Check rollout history
kubectl rollout history deployment/fineract -n ulms-production

# 4. If issues, rollback to previous version
kubectl rollout undo deployment/fineract -n ulms-production

# 5. Rollback to specific revision
kubectl rollout undo deployment/fineract --to-revision=2 -n ulms-production

# 6. Pause rollout (if needed during investigation)
kubectl rollout pause deployment/fineract -n ulms-production

# 7. Resume rollout
kubectl rollout resume deployment/fineract -n ulms-production
```

### 15.4 Emergency Procedures

**Emergency Scale Down** (reduce load during incident):
```bash
# Scale down non-critical services
kubectl scale deployment notification-service --replicas=1 -n ulms-production
kubectl scale deployment analytics-service --replicas=1 -n ulms-production

# Keep critical services running
# (Fineract, CIB, NID, Workflow, PostgreSQL)
```

**Emergency Rollback** (all services):
```bash
# Rollback all deployments to previous version
for deployment in $(kubectl get deployments -n ulms-production -o jsonpath='{.items[*].metadata.name}'); do
  kubectl rollout undo deployment/$deployment -n ulms-production
done
```

**Database Emergency Read-Only Mode**:
```bash
# Connect to PostgreSQL primary
kubectl exec -it postgresql-patroni-0 -n ulms-production -- psql -U postgres

# Set to read-only (prevents writes during incident)
postgres=# ALTER DATABASE ulms_production SET default_transaction_read_only = on;
postgres=# SELECT pg_reload_conf();

# Revert to read-write
postgres=# ALTER DATABASE ulms_production SET default_transaction_read_only = off;
```

---

## 16. Appendices

### 16.1 Complete Resource Estimation

**Minimum Cluster Capacity** (12 nodes):

| Component | Pods | CPU Request | Memory Request | Storage | Total CPU | Total Memory |
|-----------|------|-------------|----------------|---------|-----------|--------------|
| Fineract | 3 | 2000m | 4Gi | - | 6000m | 12Gi |
| 8 Microservices | 16 | 8000m | 16Gi | - | 8000m | 16Gi |
| PostgreSQL | 3 | 2000m | 8Gi | 500Gi x 3 | 6000m | 24Gi |
| Redis | 6 | 500m | 2Gi | 50Gi x 6 | 3000m | 12Gi |
| Kafka | 3 | 1000m | 4Gi | 200Gi x 3 | 3000m | 12Gi |
| Infrastructure | 10 | 5000m | 12Gi | - | 5000m | 12Gi |
| System (kubelet, etc) | - | 12000m | 24Gi | - | 12000m | 24Gi |
| **TOTAL** | **~41** | **~43 cores** | **~112 GB** | **~2.4 TB** | **43 cores** | **112 GB** |

**Node Allocation**:
- 12 x t3.2xlarge (8 vCPU, 32 GB RAM each) = 96 vCPU, 384 GB RAM total
- **Effective Capacity**: 43 / 96 = 45% CPU utilization, 112 / 384 = 29% memory utilization
- **Buffer**: 55% CPU, 71% memory available for scaling and overhead

### 16.2 Network Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────────────┐
│                         VPC: 10.0.0.0/16                                   │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                   PUBLIC SUBNETS (DMZ)                              │   │
│  │  ┌────────────┐   ┌────────────┐   ┌────────────┐                 │   │
│  │  │ NAT Gateway│   │    ALB     │   │  Internet  │                 │   │
│  │  │   (AZ-1)   │   │ (External) │   │  Gateway   │                 │   │
│  │  └────────────┘   └────────────┘   └────────────┘                 │   │
│  │  10.0.1.0/24       10.0.2.0/24      10.0.3.0/24                    │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                               │                                             │
│  ┌────────────────────────────┴───────────────────────────────────────┐   │
│  │                   PRIVATE SUBNETS (Worker Nodes)                    │   │
│  │  ┌────────────┐   ┌────────────┐   ┌────────────┐                 │   │
│  │  │  Worker    │   │  Worker    │   │  Worker    │                 │   │
│  │  │ Nodes AZ-1 │   │ Nodes AZ-2 │   │ Nodes AZ-3 │                 │   │
│  │  │ (4 nodes)  │   │ (4 nodes)  │   │ (4 nodes)  │                 │   │
│  │  └────────────┘   └────────────┘   └────────────┘                 │   │
│  │  10.0.10.0/24      10.0.11.0/24     10.0.12.0/24                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                               │                                             │
│  ┌────────────────────────────┴───────────────────────────────────────┐   │
│  │                   DATABASE SUBNETS (Private)                        │   │
│  │  ┌────────────┐   ┌────────────┐   ┌────────────┐                 │   │
│  │  │ PostgreSQL │   │ PostgreSQL │   │ PostgreSQL │                 │   │
│  │  │  Primary   │   │  Standby-1 │   │  Standby-2 │                 │   │
│  │  │   (AZ-1)   │   │   (AZ-2)   │   │   (AZ-3)   │                 │   │
│  │  └────────────┘   └────────────┘   └────────────┘                 │   │
│  │  10.0.20.0/24      10.0.21.0/24     10.0.22.0/24                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
└───────────────────────────────────────────────────────────────────────────┘
```

### 16.3 Compliance Checklist

| Requirement | Source | Implementation | Section Reference |
|-------------|--------|----------------|------------------|
| 1000+ concurrent users | BRD 7.1 | HPA 3-20 replicas per service | Section 7 |
| 99.9% uptime | BRD 7.5 | Multi-AZ, pod anti-affinity, automatic failover | Section 11 |
| <500ms response time | SRS 4.1 | Resource allocation, caching (Redis) | Section 5 |
| TLS 1.3 encryption | BRD 7.3 | Ingress TLS config, mTLS for inter-service | Section 8 |
| Auto-scaling | SRS 2.1 | HPA for all services, cluster autoscaler | Section 7 |
| Multi-tenant isolation | BRD 6.1 | Schema-per-tenant PostgreSQL | Section 6 |
| RBAC | ICT V4.0 | ServiceAccounts, Roles, NetworkPolicies | Section 10 |
| Audit logging | ICT V4.0 | API server audit logs, application logs to ELK | Section 12 |
| Data encryption at rest | ICT V4.0 | EBS encryption with KMS, PostgreSQL TDE | Section 9 |
| Backup & DR | BRD 7.5 | Velero daily backups, DR site in Singapore | Section 14 |

### 16.4 Glossary

| Term | Definition |
|------|------------|
| **HPA** | Horizontal Pod Autoscaler - Automatically scales pods based on metrics |
| **StatefulSet** | Kubernetes controller for stateful applications (databases) with stable network identity |
| **PVC** | PersistentVolumeClaim - Request for storage by a pod |
| **PDB** | PodDisruptionBudget - Ensures minimum availability during voluntary disruptions |
| **CNI** | Container Network Interface - Plugin for pod networking |
| **CRD** | Custom Resource Definition - Extends Kubernetes API |
| **etcd** | Distributed key-value store for Kubernetes cluster state |
| **Patroni** | High availability solution for PostgreSQL with automatic failover |
| **Velero** | Kubernetes backup and restore tool |
| **ArgoCD** | GitOps continuous delivery tool for Kubernetes |
| **RBAC** | Role-Based Access Control - Authorization mechanism |
| **mTLS** | Mutual TLS - Both client and server authenticate each other |
| **PSS** | Pod Security Standards - Security policies for pod specifications |

### 16.5 References

1. **Kubernetes Documentation v1.28** - https://kubernetes.io/docs/
2. **Apache Fineract Deployment Guide** - https://fineract.apache.org/
3. **Patroni Documentation** - https://patroni.readthedocs.io/
4. **ArgoCD Documentation** - https://argo-cd.readthedocs.io/
5. **Prometheus Documentation** - https://prometheus.io/docs/
6. **ULMS System Architecture Document v1.0** - [ARCH-1.1.1]
7. **ULMS Microservices Architecture Blueprint v1.0** - [ARCH-1.1.2]
8. **ULMS Security Architecture v1.0** - [ARCH-1.4.1]
9. **ULMS Multi-Tenant Architecture v1.0** - [ARCH-1.1.3]
10. **Technology Stack Recommendation v2.0**
11. **Software Requirements Specification**
12. **Bangladesh Bank ICT Security Guidelines V4.0**
13. **BRPD Circular 15/2024**
14. **Helm Charts Best Practices** - https://helm.sh/docs/chart_best_practices/
15. **Kubernetes Best Practices** - https://cloud.google.com/kubernetes-engine/docs/best-practices

---

**Document End**

© 2026 Unisoft Systems Limited. All Rights Reserved.

*This Kubernetes Cluster Architecture document provides production-ready deployment specifications for ULMS v2.0 on Kubernetes 1.28 with 3 namespaces, supporting 62+ Bangladesh banks with 99.9% uptime SLA.*

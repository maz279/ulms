# Kubernetes Deployment Guide

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Kubernetes Deployment Guide |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | DevOps Engineering Team |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Approved |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | DevOps Team | Initial deployment guide |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Prerequisites](#2-prerequisites)
3. [Cluster Access Setup](#3-cluster-access-setup)
4. [Namespace Configuration](#4-namespace-configuration)
5. [Application Deployment](#5-application-deployment)
6. [Service Configuration](#6-service-configuration)
7. [Ingress Configuration](#7-ingress-configuration)
8. [Configuration Management](#8-configuration-management)
9. [Deployment Strategies](#9-deployment-strategies)
10. [Related Documents](#10-related-documents)

---

## 1. Executive Summary

This guide provides comprehensive instructions for deploying ULMS v2.0 applications to Kubernetes clusters, covering initial setup, configuration management, and operational procedures for Bangladesh banking environments.

---

## 2. Prerequisites

### 2.1 Required Tools

| Tool | Version | Purpose |
|------|---------|---------|
| kubectl | 1.28+ | Kubernetes CLI |
| helm | 3.13+ | Package manager |
| aws-cli | 2.13+ | AWS authentication |
| eksctl | 0.160+ | EKS management |
| k9s | 0.28+ | Terminal UI |

### 2.2 Access Requirements

```bash
# Configure AWS credentials
aws configure
# Enter: AWS Access Key ID
# Enter: AWS Secret Access Key
# Default region: ap-southeast-1

# Update kubeconfig for EKS
aws eks update-kubeconfig --region ap-southeast-1 --name ulms-production

# Verify access
kubectl get nodes
kubectl get pods -A
```

---

## 3. Cluster Access Setup

### 3.1 RBAC Configuration

```yaml
# Role for developers
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: ulms-production
  name: developer
rules:
  - apiGroups: ["", "apps"]
    resources: ["pods", "services", "deployments", "configmaps"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["pods/log"]
    verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: developer-binding
  namespace: ulms-production
subjects:
  - kind: Group
    name: ulms-developers
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: developer
  apiGroup: rbac.authorization.k8s.io
```

---

## 4. Namespace Configuration

### 4.1 Namespace Structure

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ulms-production
  labels:
    environment: production
    compliance: bank-grade
    istio-injection: enabled
---
apiVersion: v1
kind: Namespace
metadata:
  name: ulms-monitoring
  labels:
    environment: production
    purpose: observability
---
apiVersion: v1
kind: Namespace
metadata:
  name: ulms-security
  labels:
    environment: production
    purpose: security-tools
```

### 4.2 Resource Quotas

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: ulms-quota
  namespace: ulms-production
spec:
  hard:
    requests.cpu: "20"
    requests.memory: 80Gi
    limits.cpu: "40"
    limits.memory: 160Gi
    persistentvolumeclaims: "10"
    services.loadbalancers: "2"
    pods: "50"
```

---

## 5. Application Deployment

### 5.1 Backend Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ulms-backend
  namespace: ulms-production
  labels:
    app: ulms-backend
    version: v2.0.0
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 25%
  selector:
    matchLabels:
      app: ulms-backend
  template:
    metadata:
      labels:
        app: ulms-backend
        version: v2.0.0
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/actuator/prometheus"
    spec:
      serviceAccountName: ulms-backend-sa
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        runAsGroup: 1000
        fsGroup: 1000
      containers:
        - name: backend
          image: registry.unisoft-systems.com/ulms/backend:2.0.0
          imagePullPolicy: Always
          ports:
            - name: http
              containerPort: 8080
              protocol: TCP
            - name: management
              containerPort: 8081
              protocol: TCP
          env:
            - name: SPRING_PROFILES_ACTIVE
              value: "production,kubernetes"
            - name: JAVA_OPTS
              value: "-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=50.0"
            - name: DB_HOST
              valueFrom:
                secretKeyRef:
                  name: ulms-db-credentials
                  key: host
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: ulms-db-credentials
                  key: password
          resources:
            requests:
              cpu: 500m
              memory: 1Gi
            limits:
              cpu: 2000m
              memory: 4Gi
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: management
            initialDelaySeconds: 60
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: management
            initialDelaySeconds: 30
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
          volumeMounts:
            - name: tmp
              mountPath: /tmp
      volumes:
        - name: tmp
          emptyDir: {}
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchExpressions:
                    - key: app
                      operator: In
                      values:
                        - ulms-backend
                topologyKey: kubernetes.io/hostname
---
apiVersion: v1
kind: Service
metadata:
  name: ulms-backend
  namespace: ulms-production
  labels:
    app: ulms-backend
spec:
  type: ClusterIP
  selector:
    app: ulms-backend
  ports:
    - name: http
      port: 8080
      targetPort: 8080
      protocol: TCP
    - name: management
      port: 8081
      targetPort: 8081
      protocol: TCP
```

### 5.2 Frontend Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ulms-frontend
  namespace: ulms-production
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ulms-frontend
  template:
    metadata:
      labels:
        app: ulms-frontend
    spec:
      containers:
        - name: frontend
          image: registry.unisoft-systems.com/ulms/frontend:2.0.0
          ports:
            - containerPort: 80
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
```

---

## 6. Service Configuration

### 6.1 Service Types

| Service Type | Use Case | Example |
|-------------|----------|---------|
| ClusterIP | Internal communication | Backend services |
| NodePort | Development access | Debugging |
| LoadBalancer | External exposure | Public APIs |
| ExternalName | External service mapping | RDS endpoint |

---

## 7. Ingress Configuration

### 7.1 ALB Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ulms-ingress
  namespace: ulms-production
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}]'
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:ap-southeast-1:ACCOUNT:certificate/CERT-ID
    alb.ingress.kubernetes.io/ssl-policy: ELBSecurityPolicy-TLS13-1-2-2021-06
    alb.ingress.kubernetes.io/healthcheck-path: /health
    alb.ingress.kubernetes.io/healthcheck-port: traffic-port
    alb.ingress.kubernetes.io/success-codes: "200"
spec:
  ingressClassName: alb
  rules:
    - host: ulms.unisoft-systems.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: ulms-frontend
                port:
                  number: 80
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: ulms-backend
                port:
                  number: 8080
```

---

## 8. Configuration Management

### 8.1 ConfigMaps

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ulms-config
  namespace: ulms-production
data:
  application.yml: |
    spring:
      datasource:
        url: jdbc:postgresql://ulms-db.cluster-xxx.ap-southeast-1.rds.amazonaws.com:5432/ulms
        username: ulms_app
      jpa:
        hibernate:
          ddl-auto: validate
        properties:
          hibernate:
            dialect: org.hibernate.dialect.PostgreSQLDialect
      redis:
        host: ulms-redis.abc.cache.amazonaws.com
        port: 6379
        timeout: 2000ms
      kafka:
        bootstrap-servers: ulms-kafka:9092
        producer:
          acks: all
          retries: 3
        consumer:
          auto-offset-reset: earliest
          enable-auto-commit: false
```

### 8.2 Secrets Management

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: ulms-db-credentials
  namespace: ulms-production
spec:
  refreshInterval: 1h
  secretStoreRef:
    kind: ClusterSecretStore
    name: vault-backend
  target:
    name: ulms-db-credentials
    creationPolicy: Owner
  data:
    - secretKey: host
      remoteRef:
        key: ulms/production/database
        property: host
    - secretKey: password
      remoteRef:
        key: ulms/production/database
        property: password
```

---

## 9. Deployment Strategies

### 9.1 Rolling Update

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 0
```

### 9.2 Blue-Green Deployment

```bash
# Deploy green version
kubectl apply -f deployment-green.yaml

# Wait for green to be ready
kubectl rollout status deployment/ulms-backend-green

# Switch service to green
kubectl patch service ulms-backend -p '{"spec":{"selector":{"version":"green"}}}'

# Verify, then remove blue
kubectl delete deployment ulms-backend-blue
```

### 9.3 Canary Deployment

```yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: ulms-backend
  namespace: ulms-production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ulms-backend
  service:
    port: 8080
  analysis:
    interval: 30s
    threshold: 5
    maxWeight: 50
    stepWeight: 10
    metrics:
      - name: request-success-rate
        thresholdRange:
          min: 99
        interval: 1m
      - name: request-duration
        thresholdRange:
          max: 500
        interval: 1m
```

---

## 10. Related Documents

| Document | Location | Purpose |
|----------|----------|---------|
| Kubernetes Cluster Architecture | `01_[K8S]_Kubernetes_Cluster_Architecture_v1.0.md` | Cluster design |
| Kubernetes Resource Manifests | `03_[K8S]_Kubernetes_Resource_Manifests_v1.0.md` | Full manifests |
| Helm Charts | `../../03_Helm_Charts/` | Package management |

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

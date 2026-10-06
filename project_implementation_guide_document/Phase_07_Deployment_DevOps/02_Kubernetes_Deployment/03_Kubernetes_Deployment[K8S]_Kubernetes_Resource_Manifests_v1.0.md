# Kubernetes Resource Manifests

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Kubernetes Resource Manifests |
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
| 1.0 | 2026-02-05 | DevOps Team | Complete manifest collection |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Namespace Resources](#2-namespace-resources)
3. [Core Application Resources](#3-core-application-resources)
4. [Service Resources](#4-service-resources)
5. [ConfigMap Resources](#5-configmap-resources)
6. [Secret Resources](#6-secret-resources)
7. [RBAC Resources](#7-rbac-resources)
8. [Network Policy Resources](#8-network-policy-resources)
9. [Storage Resources](#9-storage-resources)
10. [Related Documents](#10-related-documents)

---

## 1. Executive Summary

This document contains complete, production-ready Kubernetes resource manifests for ULMS v2.0 deployment. All manifests follow security best practices and Bangladesh Bank compliance requirements.

---

## 2. Namespace Resources

```yaml
---
# Production Namespace
apiVersion: v1
kind: Namespace
metadata:
  name: ulms-production
  labels:
    name: ulms-production
    environment: production
    compliance: bank-grade
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/enforce-version: latest
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
---
# Staging Namespace
apiVersion: v1
kind: Namespace
metadata:
  name: ulms-staging
  labels:
    name: ulms-staging
    environment: staging
    compliance: bank-grade
---
# Development Namespace
apiVersion: v1
kind: Namespace
metadata:
  name: ulms-development
  labels:
    name: ulms-development
    environment: development
```

---

## 3. Core Application Resources

### 3.1 Backend Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ulms-backend
  namespace: ulms-production
  labels:
    app: ulms-backend
    version: v2.0.0
    component: api
spec:
  replicas: 3
  revisionHistoryLimit: 10
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
        component: api
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/actuator/prometheus"
        vault.hashicorp.com/agent-inject: "true"
        vault.hashicorp.com/role: "ulms-backend"
        vault.hashicorp.com/agent-inject-secret-db: "ulms/data/database"
    spec:
      serviceAccountName: ulms-backend-sa
      automountServiceAccountToken: false
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        runAsGroup: 1000
        fsGroup: 1000
        fsGroupChangePolicy: OnRootMismatch
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: backend
          image: registry.unisoft-systems.com/ulms/backend:2.0.0
          imagePullPolicy: Always
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            runAsNonRoot: true
            runAsUser: 1000
            capabilities:
              drop:
                - ALL
            seccompProfile:
              type: RuntimeDefault
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
            - name: SERVER_PORT
              value: "8080"
            - name: MANAGEMENT_SERVER_PORT
              value: "8081"
            - name: JAVA_OPTS
              value: "-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=50.0 -XX:+UseG1GC -XX:+UseStringDeduplication"
            - name: DB_HOST
              valueFrom:
                secretKeyRef:
                  name: ulms-db-credentials
                  key: host
            - name: DB_PORT
              value: "5432"
            - name: DB_NAME
              value: "ulms"
            - name: DB_USER
              valueFrom:
                secretKeyRef:
                  name: ulms-db-credentials
                  key: username
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: ulms-db-credentials
                  key: password
            - name: REDIS_HOST
              valueFrom:
                configMapKeyRef:
                  name: ulms-config
                  key: redis.host
            - name: REDIS_PORT
              value: "6379"
            - name: KAFKA_BOOTSTRAP_SERVERS
              valueFrom:
                configMapKeyRef:
                  name: ulms-config
                  key: kafka.bootstrap-servers
            - name: KEYCLOAK_URL
              valueFrom:
                configMapKeyRef:
                  name: ulms-config
                  key: keycloak.url
            - name: LOG_LEVEL
              value: "INFO"
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
              scheme: HTTP
            initialDelaySeconds: 60
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
            successThreshold: 1
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: management
              scheme: HTTP
            initialDelaySeconds: 30
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
            successThreshold: 1
          startupProbe:
            httpGet:
              path: /actuator/health/liveness
              port: management
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 30
          volumeMounts:
            - name: tmp
              mountPath: /tmp
            - name: logs
              mountPath: /app/logs
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sh", "-c", "sleep 15"]
      volumes:
        - name: tmp
          emptyDir:
            sizeLimit: 100Mi
        - name: logs
          emptyDir:
            sizeLimit: 500Mi
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
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
              - matchExpressions:
                  - key: workload
                    operator: In
                    values:
                      - applications
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: ScheduleAnyway
          labelSelector:
            matchLabels:
              app: ulms-backend
      terminationGracePeriodSeconds: 60
```

### 3.2 Frontend Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ulms-frontend
  namespace: ulms-production
  labels:
    app: ulms-frontend
    version: v2.0.0
    component: frontend
spec:
  replicas: 2
  revisionHistoryLimit: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 50%
      maxUnavailable: 0
  selector:
    matchLabels:
      app: ulms-frontend
  template:
    metadata:
      labels:
        app: ulms-frontend
        version: v2.0.0
        component: frontend
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 101
        runAsGroup: 101
        fsGroup: 101
      containers:
        - name: frontend
          image: registry.unisoft-systems.com/ulms/frontend:2.0.0
          imagePullPolicy: Always
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            runAsNonRoot: true
            runAsUser: 101
            capabilities:
              drop:
                - ALL
          ports:
            - name: http
              containerPort: 80
              protocol: TCP
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
          livenessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 5
            periodSeconds: 5
```

---

## 4. Service Resources

```yaml
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
  sessionAffinity: None
---
apiVersion: v1
kind: Service
metadata:
  name: ulms-frontend
  namespace: ulms-production
  labels:
    app: ulms-frontend
spec:
  type: ClusterIP
  selector:
    app: ulms-frontend
  ports:
    - name: http
      port: 80
      targetPort: 80
      protocol: TCP
```

---

## 5. ConfigMap Resources

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ulms-config
  namespace: ulms-production
data:
  # Application Configuration
  application.properties: |
    # Server Configuration
    server.servlet.context-path=/api/v1
    server.compression.enabled=true
    server.compression.mime-types=application/json,application/xml,text/html,text/xml,text/plain
    
    # Database Configuration
    spring.datasource.url=jdbc:postgresql://ulms-db.cluster-xxx.ap-southeast-1.rds.amazonaws.com:5432/ulms
    spring.datasource.driver-class-name=org.postgresql.Driver
    spring.datasource.hikari.maximum-pool-size=20
    spring.datasource.hikari.minimum-idle=5
    spring.datasource.hikari.idle-timeout=300000
    spring.datasource.hikari.max-lifetime=1200000
    spring.datasource.hikari.connection-timeout=20000
    
    # JPA Configuration
    spring.jpa.hibernate.ddl-auto=validate
    spring.jpa.show-sql=false
    spring.jpa.properties.hibernate.format_sql=false
    spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
    
    # Cache Configuration
    spring.cache.type=redis
    spring.redis.timeout=2000ms
    spring.redis.lettuce.pool.max-active=8
    spring.redis.lettuce.pool.max-idle=8
    spring.redis.lettuce.pool.min-idle=0
    
    # Kafka Configuration
    spring.kafka.bootstrap-servers=ulms-kafka:9092
    spring.kafka.producer.acks=all
    spring.kafka.producer.retries=3
    spring.kafka.producer.batch-size=16384
    spring.kafka.consumer.auto-offset-reset=earliest
    spring.kafka.consumer.enable-auto-commit=false
    
    # Logging Configuration
    logging.level.root=INFO
    logging.level.com.unisoft.ulms=INFO
    logging.level.org.springframework.security=INFO
    
    # Actuator Configuration
    management.endpoints.web.exposure.include=health,info,metrics,prometheus
    management.endpoint.health.show-details=when-authorized
    management.metrics.export.prometheus.enabled=true
  
  # Individual key-value pairs for environment variables
  redis.host: "ulms-redis.abc.cache.amazonaws.com"
  kafka.bootstrap-servers: "ulms-kafka:9092"
  keycloak.url: "https://auth.unisoft-systems.com"
```

---

## 6. Secret Resources

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
    deletionPolicy: Retain
    template:
      type: Opaque
      metadata:
        annotations:
          reloader.stakater.com/auto: "true"
  data:
    - secretKey: host
      remoteRef:
        key: ulms/production/database
        property: host
    - secretKey: port
      remoteRef:
        key: ulms/production/database
        property: port
    - secretKey: username
      remoteRef:
        key: ulms/production/database
        property: username
    - secretKey: password
      remoteRef:
        key: ulms/production/database
        property: password
    - secretKey: database
      remoteRef:
        key: ulms/production/database
        property: database
---
# TLS Secret example
apiVersion: v1
kind: Secret
metadata:
  name: ulms-tls
  namespace: ulms-production
type: kubernetes.io/tls
data:
  tls.crt: <base64-encoded-certificate>
  tls.key: <base64-encoded-key>
```

---

## 7. RBAC Resources

```yaml
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ulms-backend-sa
  namespace: ulms-production
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::ACCOUNT:role/ulms-backend-role
automountServiceAccountToken: false
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: ulms-backend-role
  namespace: ulms-production
rules:
  - apiGroups: [""]
    resources: ["configmaps"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get"]
    resourceNames: ["ulms-db-credentials"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: ulms-backend-binding
  namespace: ulms-production
subjects:
  - kind: ServiceAccount
    name: ulms-backend-sa
    namespace: ulms-production
roleRef:
  kind: Role
  name: ulms-backend-role
  apiGroup: rbac.authorization.k8s.io
```

---

## 8. Network Policy Resources

```yaml
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ulms-backend-policy
  namespace: ulms-production
spec:
  podSelector:
    matchLabels:
      app: ulms-backend
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: ulms-frontend
        - podSelector:
            matchLabels:
              app: ulms-gateway
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: 8080
        - protocol: TCP
          port: 8081
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: ulms-postgres
      ports:
        - protocol: TCP
          port: 5432
    - to:
        - podSelector:
            matchLabels:
              app: ulms-redis
      ports:
        - protocol: TCP
          port: 6379
    - to:
        - podSelector:
            matchLabels:
              app: ulms-kafka
      ports:
        - protocol: TCP
          port: 9092
    - to:
        - namespaceSelector: {}
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: ulms-production
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
```

---

## 9. Storage Resources

```yaml
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ulms-shared-storage
  namespace: ulms-production
spec:
  accessModes:
    - ReadWriteMany
  storageClassName: efs-sc
  resources:
    requests:
      storage: 10Gi
---
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: gp3-encrypted
provisioner: ebs.csi.aws.com
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
parameters:
  type: gp3
  encrypted: "true"
reclaimPolicy: Retain
```

---

## 10. Related Documents

| Document | Location | Purpose |
|----------|----------|---------|
| Kubernetes Deployment Guide | `02_[K8S]_Kubernetes_Deployment_Guide_v1.0.md` | Deployment procedures |
| Helm Charts | `../../03_Helm_Charts/` | Package management |

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

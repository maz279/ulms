**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | UAT Environment Setup Guide |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | DevOps Lead, Unisoft Systems Limited |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Draft |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | DevOps Lead | Initial version |

---

# UAT Environment Setup Guide

## Table of Contents

1. [Introduction](#1-introduction)
2. [Infrastructure Requirements](#2-infrastructure-requirements)
3. [Environment Configuration](#3-environment-configuration)
4. [Application Deployment](#4-application-deployment)
5. [Database Setup](#5-database-setup)
6. [Integration Configuration](#6-integration-configuration)
7. [Test Data Preparation](#7-test-data-preparation)
8. [User Access Provisioning](#8-user-access-provisioning)
9. [Validation Checklist](#9-validation-checklist)
10. [Troubleshooting](#10-troubleshooting)
11. [Related Documents](#11-related-documents)

---

## 1. Introduction

### 1.1 Purpose

This guide provides step-by-step instructions for setting up the UAT environment for ULMS v2.0, including infrastructure provisioning, application deployment, database setup, and test data preparation.

### 1.2 UAT Environment Purpose

The UAT environment serves as:
- Pre-production validation environment
- Business user testing platform
- Integration testing with sandbox systems
- Performance baseline validation

---

## 2. Infrastructure Requirements

### 2.1 Hardware Specifications

| Component | Specification | Quantity |
|-----------|---------------|----------|
| Application Servers | 8 vCPU, 16 GB RAM, 100 GB SSD | 2 |
| Database Server | 16 vCPU, 32 GB RAM, 500 GB SSD | 1 |
| Redis Cache | 4 vCPU, 8 GB RAM, 50 GB SSD | 1 |
| Kafka Cluster | 4 vCPU, 8 GB RAM, 200 GB SSD | 3 |
| Load Balancer | 4 vCPU, 8 GB RAM | 1 |
| Monitoring Stack | 4 vCPU, 8 GB RAM, 200 GB SSD | 1 |

### 2.2 Network Configuration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         UAT NETWORK ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Internet                                                                   │
│      │                                                                       │
│      ▼                                                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        WAF + Load Balancer                           │   │
│   │                    (ulms-uat.bank.com:443)                           │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│      │                                                                       │
│      ▼                                                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    Kubernetes Cluster (UAT)                          │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐  │   │
│   │  │  App Pod 1  │  │  App Pod 2  │  │      Monitoring Stack       │  │   │
│   │  │  (ULMS API) │  │  (ULMS API) │  │  (Prometheus, Grafana, ELK) │  │   │
│   │  └──────┬──────┘  └──────┬──────┘  └─────────────────────────────┘  │   │
│   │         │                │                                           │   │
│   │         └────────────────┘                                           │   │
│   │                   │                                                  │   │
│   │  ┌────────────────┼────────────────┐                                 │   │
│   │  ▼                ▼                ▼                                 │   │
│   │  ┌─────────┐  ┌─────────┐  ┌─────────┐                              │   │
│   │  │PostgreSQL│  │  Redis  │  │  Kafka  │                              │   │
│   │  │  (R/W)  │  │ (Cache) │  │(Events) │                              │   │
│   │  └─────────┘  └─────────┘  └─────────┘                              │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   External Integrations (Sandbox)                                           │
│   ├── Bangladesh Bank CIB (Test)                                            │
│   ├── NIDW (Sandbox)                                                        │
│   ├── CBS (Test Instance)                                                   │
│   └── Payment Gateways (Sandbox)                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Environment Configuration

### 3.1 Kubernetes Namespace Setup

```bash
#!/bin/bash
# setup-uat-namespace.sh

NAMESPACE="ulms-uat"

echo "Creating UAT namespace..."
kubectl create namespace $NAMESPACE

# Create resource quotas
kubectl apply -f - <<EOF
apiVersion: v1
kind: ResourceQuota
metadata:
  name: uat-quota
  namespace: $NAMESPACE
spec:
  hard:
    requests.cpu: "32"
    requests.memory: 64Gi
    limits.cpu: "64"
    limits.memory: 128Gi
    persistentvolumeclaims: "10"
    services.loadbalancers: "2"
EOF

# Create limit range
kubectl apply -f - <<EOF
apiVersion: v1
kind: LimitRange
metadata:
  name: uat-limits
  namespace: $NAMESPACE
spec:
  limits:
  - default:
      cpu: "2"
      memory: 4Gi
    defaultRequest:
      cpu: "500m"
      memory: 1Gi
    type: Container
EOF

echo "Namespace setup complete"
```

### 3.2 ConfigMap for UAT

```yaml
# uat-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ulms-uat-config
  namespace: ulms-uat
data:
  # Application
  SPRING_PROFILES_ACTIVE: "uat"
  SERVER_PORT: "8080"
  
  # Database
  DATABASE_HOST: "postgres-uat.ulms-uat.svc.cluster.local"
  DATABASE_PORT: "5432"
  DATABASE_NAME: "ulms_uat"
  
  # Redis
  REDIS_HOST: "redis-uat.ulms-uat.svc.cluster.local"
  REDIS_PORT: "6379"
  
  # Kafka
  KAFKA_BOOTSTRAP_SERVERS: "kafka-uat-0.kafka-uat:9092,kafka-uat-1.kafka-uat:9092,kafka-uat-2.kafka-uat:9092"
  
  # Integrations (Sandbox)
  CIB_BASE_URL: "https://cib-sandbox.bb.org.bd"
  NIDW_BASE_URL: "https://nidw-sandbox.gov.bd"
  CBS_BASE_URL: "https://cbs-test.bank.internal"
  BKASH_BASE_URL: "https://sandbox.bka.sh"
  NAGAD_BASE_URL: "https://sandbox.mynagad.com"
  
  # Features
  FEATURE_FLAGS: "{\"enable_biometric\":false,\"enable_live_payments\":false}"
  
  # Logging
  LOG_LEVEL: "INFO"
  LOG_FORMAT: "JSON"
```

---

## 4. Application Deployment

### 4.1 Deployment Configuration

```yaml
# ulms-uat-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ulms-api-uat
  namespace: ulms-uat
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: ulms-api
      environment: uat
  template:
    metadata:
      labels:
        app: ulms-api
        environment: uat
    spec:
      containers:
      - name: ulms-api
        image: registry.bank.com/ulms/api:v2.0.0-RC1
        imagePullPolicy: Always
        ports:
        - containerPort: 8080
          name: http
        envFrom:
        - configMapRef:
            name: ulms-uat-config
        env:
        - name: DATABASE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: ulms-uat-secrets
              key: db-password
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: ulms-uat-secrets
              key: jwt-secret
        resources:
          requests:
            cpu: "1000m"
            memory: "2Gi"
          limits:
            cpu: "2000m"
            memory: "4Gi"
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        volumeMounts:
        - name: tmp
          mountPath: /tmp
      volumes:
      - name: tmp
        emptyDir: {}
      imagePullSecrets:
      - name: registry-credentials
```

### 4.2 Service and Ingress

```yaml
# ulms-uat-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: ulms-api-uat
  namespace: ulms-uat
spec:
  selector:
    app: ulms-api
    environment: uat
  ports:
  - port: 80
    targetPort: 8080
    name: http
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ulms-uat-ingress
  namespace: ulms-uat
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - ulms-uat.bank.com
    secretName: ulms-uat-tls
  rules:
  - host: ulms-uat.bank.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ulms-api-uat
            port:
              number: 80
```

---

## 5. Database Setup

### 5.1 PostgreSQL Deployment

```yaml
# postgres-uat.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres-uat
  namespace: ulms-uat
spec:
  serviceName: postgres-uat
  replicas: 1
  selector:
    matchLabels:
      app: postgres
      environment: uat
  template:
    metadata:
      labels:
        app: postgres
        environment: uat
    spec:
      containers:
      - name: postgres
        image: postgres:16-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: "ulms_uat"
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: ulms-uat-secrets
              key: db-username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: ulms-uat-secrets
              key: db-password
        - name: PGDATA
          value: /var/lib/postgresql/data/pgdata
        volumeMounts:
        - name: postgres-data
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            cpu: "2000m"
            memory: "8Gi"
          limits:
            cpu: "4000m"
            memory: "16Gi"
  volumeClaimTemplates:
  - metadata:
      name: postgres-data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 500Gi
      storageClassName: fast-ssd
```

### 5.2 Database Initialization

```bash
#!/bin/bash
# init-uat-database.sh

DB_HOST="postgres-uat.ulms-uat.svc.cluster.local"
DB_NAME="ulms_uat"
DB_USER="ulms_admin"

echo "Creating database schema..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f schema/01_create_tables.sql
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f schema/02_create_indexes.sql
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f schema/03_create_constraints.sql

echo "Creating reference data..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f data/01_reference_data.sql

echo "Database initialization complete"
```

---

## 6. Integration Configuration

### 6.1 CIB Sandbox Configuration

```yaml
# cib-sandbox-config.yaml
apiVersion: v1
kind: Secret
metadata:
  name: cib-sandbox-credentials
  namespace: ulms-uat
type: Opaque
stringData:
  org-id: "12345678"
  api-key: "test-api-key"
  keystore-password: "test-password"
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: cib-sandbox-config
  namespace: ulms-uat
data:
  base-url: "https://cib-sandbox.bb.org.bd"
  connect-timeout: "10000"
  read-timeout: "30000"
  mock-mode: "false"
```

### 6.2 Payment Gateway Sandbox

```yaml
# payment-sandbox-config.yaml
apiVersion: v1
kind: Secret
metadata:
  name: payment-sandbox-credentials
  namespace: ulms-uat
type: Opaque
stringData:
  bkash-app-key: "test-key"
  bkash-app-secret: "test-secret"
  nagad-merchant-id: "test-merchant"
  nagad-private-key: "test-private-key"
```

---

## 7. Test Data Preparation

### 7.1 Data Generation Script

```bash
#!/bin/bash
# generate-uat-data.sh

UAT_API="https://ulms-uat.bank.com/api"
ADMIN_TOKEN=$(curl -s -X POST $UAT_API/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"UatAdmin123!"}' | jq -r '.token')

echo "Generating UAT test data..."

# Generate borrowers
echo "[*] Creating 1000 test borrowers..."
curl -X POST $UAT_API/test-data/generate \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entity": "BORROWER",
    "count": 1000,
    "distribution": {
      "retail": 0.6,
      "sme": 0.3,
      "corporate": 0.1
    }
  }'

# Generate loans
echo "[*] Creating 2000 test loans..."
curl -X POST $UAT_API/test-data/generate \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entity": "LOAN",
    "count": 2000,
    "status_distribution": {
      "PENDING": 0.1,
      "UNDER_REVIEW": 0.15,
      "APPROVED": 0.2,
      "DISBURSED": 0.45,
      "CLOSED": 0.1
    }
  }'

# Generate users
echo "[*] Creating 50 test users..."
curl -X POST $UAT_API/test-data/generate \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entity": "USER",
    "count": 50,
    "roles": [
      {"RELATIONSHIP_MANAGER": 20},
      {"CREDIT_OFFICER": 10},
      {"BRANCH_MANAGER": 5},
      {"CMU_OFFICER": 5},
      {"ADMIN": 2}
    ]
  }'

echo "UAT data generation complete"
```

### 7.2 Data Anonymization

```java
@Component
public class UATDataAnonymizer {
    
    private final Faker faker = new Faker();
    
    /**
     * Anonymize production data for UAT
     */
    public void anonymizeForUAT() {
        // Anonymize borrower names
        jdbcTemplate.update("""
            UPDATE borrowers 
            SET name = ?, 
                mobile = ?,
                email = ?
            WHERE id = ?
            """, (ps) -> {
            List<Borrower> borrowers = getAllBorrowers();
            for (Borrower b : borrowers) {
                ps.setString(1, faker.name().fullName());
                ps.setString(2, generateBangladeshMobile());
                ps.setString(3, faker.internet().emailAddress());
                ps.setLong(4, b.getId());
                ps.addBatch();
            }
            ps.executeBatch();
        });
        
        // Keep NIDs and account numbers for integration testing
        // but scramble other PII
    }
}
```

---

## 8. User Access Provisioning

### 8.1 UAT User Matrix

| Username | Role | Branch | Password |
|----------|------|--------|----------|
| uat_rm_01 | RELATIONSHIP_MANAGER | Main | UatRm01! |
| uat_rm_02 | RELATIONSHIP_MANAGER | Dhanmondi | UatRm02! |
| uat_co_01 | CREDIT_OFFICER | Main | UatCo01! |
| uat_bm_01 | BRANCH_MANAGER | Main | UatBm01! |
| uat_cmu_01 | CMU_OFFICER | Head Office | UatCmu01! |
| uat_admin | ADMIN | Head Office | UatAdmin! |

### 8.2 User Provisioning Script

```bash
#!/bin/bash
# provision-uat-users.sh

API="https://ulms-uat.bank.com/api"
TOKEN=$(curl -s -X POST $API/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"temp-password"}' | jq -r '.token')

# Create RM users
for i in {01..10}; do
  curl -X POST $API/admin/users \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"username\": \"uat_rm_$i\",
      \"email\": \"uat.rm.$i@bank.com\",
      \"fullName\": \"UAT RM $i\",
      \"role\": \"RELATIONSHIP_MANAGER\",
      \"branchCode\": \"MAIN\",
      \"password\": \"UatRm${i}!\"
    }"
done

echo "Users provisioned successfully"
```

---

## 9. Validation Checklist

### 9.1 Environment Readiness Checklist

```markdown
## UAT Environment Readiness Checklist

### Infrastructure
- [ ] Kubernetes namespace created
- [ ] Resource quotas configured
- [ ] Network policies applied
- [ ] Ingress controller configured
- [ ] TLS certificates installed

### Application
- [ ] API deployed and running
- [ ] Frontend deployed and accessible
- [ ] Health checks passing
- [ ] Logging configured
- [ ] Monitoring enabled

### Database
- [ ] PostgreSQL deployed
- [ ] Schema created
- [ ] Reference data loaded
- [ ] Indexes created
- [ ] Backup configured

### Cache & Message Queue
- [ ] Redis deployed
- [ ] Kafka cluster running
- [ ] Topics created

### Integrations
- [ ] CIB sandbox connectivity
- [ ] NIDW sandbox connectivity
- [ ] CBS test instance connectivity
- [ ] Payment gateway sandboxes

### Data
- [ ] Test borrowers loaded
- [ ] Test loans loaded
- [ ] Test users provisioned
- [ ] Documents uploaded

### Access
- [ ] UAT users created
- [ ] Roles assigned
- [ ] Passwords distributed
- [ ] VPN access configured
```

### 9.2 Smoke Test Script

```bash
#!/bin/bash
# uat-smoke-test.sh

BASE_URL="https://ulms-uat.bank.com"
FAILED=0

echo "=== UAT Environment Smoke Test ==="

# Test 1: Health endpoint
echo "[*] Testing health endpoint..."
if curl -sf "$BASE_URL/actuator/health" > /dev/null; then
    echo "  ✓ Health check passed"
else
    echo "  ✗ Health check failed"
    FAILED=1
fi

# Test 2: API version
echo "[*] Testing API version..."
VERSION=$(curl -sf "$BASE_URL/api/version" | jq -r '.version')
if [ "$VERSION" = "2.0.0-RC1" ]; then
    echo "  ✓ Version correct: $VERSION"
else
    echo "  ✗ Version mismatch: $VERSION"
    FAILED=1
fi

# Test 3: Database connectivity
echo "[*] Testing database connectivity..."
if curl -sf "$BASE_URL/actuator/health/db" | grep -q "UP"; then
    echo "  ✓ Database connected"
else
    echo "  ✗ Database connection failed"
    FAILED=1
fi

# Test 4: Login
echo "[*] Testing authentication..."
TOKEN=$(curl -sf -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"uat_rm_01","password":"UatRm01!"}' | jq -r '.token')
if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo "  ✓ Login successful"
else
    echo "  ✗ Login failed"
    FAILED=1
fi

# Test 5: Loan search
echo "[*] Testing loan search..."
if curl -sf "$BASE_URL/api/loans" \
  -H "Authorization: Bearer $TOKEN" > /dev/null; then
    echo "  ✓ Loan search working"
else
    echo "  ✗ Loan search failed"
    FAILED=1
fi

if [ $FAILED -eq 0 ]; then
    echo "=== All smoke tests passed ==="
    exit 0
else
    echo "=== Some smoke tests failed ==="
    exit 1
fi
```

---

## 10. Troubleshooting

### 10.1 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Pod not starting | Resource limits | Check resource quotas |
| Database connection failed | Wrong credentials | Verify secrets |
| Integration timeout | Network issue | Check connectivity |
| 502 Bad Gateway | App not ready | Wait for readiness probe |
| SSL error | Certificate issue | Renew certificate |

### 10.2 Debug Commands

```bash
# Check pod status
kubectl get pods -n ulms-uat

# View pod logs
kubectl logs -f deployment/ulms-api-uat -n ulms-uat

# Check database connectivity
kubectl exec -it postgres-uat-0 -n ulms-uat -- psql -U ulms_admin -d ulms_uat -c "SELECT 1"

# Check service endpoints
kubectl get svc -n ulms-uat

# Port forward for local testing
kubectl port-forward svc/ulms-api-uat 8080:80 -n ulms-uat
```

---

## 11. Related Documents

| Document | Purpose |
|----------|---------|
| `[UAT]_UAT_Test_Plan_v1.0.md` | Overall UAT approach |
| `[UAT]_UAT_Test_Cases_200plus_v1.0.md` | Test cases |
| `../Technology_Stack_Recommendation_v2.md` | Infrastructure |

---

**Document Owner:** DevOps Lead, Unisoft Systems Limited  
**Next Review Date:** 2026-03-05  
**Classification:** Internal

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

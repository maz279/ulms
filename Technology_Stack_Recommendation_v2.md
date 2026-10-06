# Technology Stack Recommendation Document
## Unisoft Loan Management System (ULMS) - Version 2.0
### Apache Fineract-Based Architecture for Bangladesh Banking Sector

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Technology Stack Recommendation - ULMS v2.0 |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 2.0 |
| **Date** | February 3, 2026 |
| **Prepared By** | Senior Solutions Architect, Technical Lead |
| **Reviewed By** | Architecture Review Board |
| **Classification** | Confidential - Internal Use |
| **Status** | Approved for Implementation |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | January 26, 2026 | Solutions Architect | Initial Technology Stack |
| 2.0 | February 3, 2026 | Senior Solutions Architect | Refinement based on Fineract CE analysis |

---

## Executive Summary

### Strategic Technology Decision

Based on comprehensive analysis of the **LMS_OpenSource_Analysis_Report.md** (Section 3.1), the project adopts **Apache Fineract Community Edition** as the foundational platform. This decision aligns with:

- **RFP Section 9**: Microservices-ready, API-first architecture requirement
- **BRD Section 6**: Enterprise-grade loan lifecycle management
- **URD Section 4**: Multi-channel, multi-tenant user requirements

### Recommended Stack Overview

| Layer | Primary Technology | Rationale |
|-------|-------------------|-----------|
| **Backend Core** | Apache Fineract 1.10 + Java 21 | Proven enterprise CBS foundation |
| **Extension Layer** | Spring Boot 3.2 Microservices | Custom Bangladesh modules |
| **Frontend** | React 18 + TypeScript + MUI | Modern, responsive UI |
| **Mobile** | React Native 0.73 | Cross-platform CPV app |
| **Database** | PostgreSQL 16 (Primary) | Fineract support + scalability |
| **Cache** | Redis 7 | Performance optimization |
| **Messaging** | Apache Kafka 3.6 | Event-driven architecture |
| **DevOps** | Kubernetes 1.28 + Docker | Cloud-native deployment |
| **Security** | Keycloak 23 + Vault 1.15 | Enterprise IAM |

---

## 1. Core Platform: Apache Fineract Community Edition

### 1.1 Platform Selection Justification

**Source Reference:** LMS_OpenSource_Analysis_Report.md - Section 3.1

| Selection Criteria | Apache Fineract Rating | Weight | Score |
|-------------------|----------------------|--------|-------|
| **Enterprise Banking Suitability** | ⭐⭐⭐⭐⭐ | 25% | 25/25 |
| **Bangladesh Compliance Capability** | ⭐⭐⭐⭐⭐ | 20% | 18/20 |
| **Technology Stack Compatibility** | ⭐⭐⭐⭐ | 15% | 12/15 |
| **Community & Support** | ⭐⭐⭐⭐⭐ | 15% | 15/15 |
| **Documentation Quality** | ⭐⭐⭐⭐⭐ | 10% | 10/10 |
| **Customization Ease** | ⭐⭐⭐⭐ | 10% | 8/10 |
| **Long-term Viability** | ⭐⭐⭐⭐⭐ | 5% | 5/5 |
| **TOTAL SCORE** | | **100%** | **93/100** |

### 1.2 Apache Fineract Architecture Alignment

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ULMS ARCHITECTURE ON FINERACT                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     REACT FRONTEND LAYER                             │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │   │
│  │  │  Loan Orig   │ │   Credit     │ │  Workflow    │ │  Dashboard   │ │   │
│  │  │  Module      │ │  Module      │ │  Module      │ │  Module      │ │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │ REST API (OpenAPI 3.0)                    │
│  ┌──────────────────────────────▼──────────────────────────────────────┐   │
│  │                     API GATEWAY (Kong/Spring)                        │   │
│  │         Authentication │ Rate Limiting │ Load Balancing              │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                           │
│  ┌──────────────────────────────▼──────────────────────────────────────┐   │
│  │              ULMS CUSTOM MICROSERVICES (Spring Boot)                 │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────────┐ │   │
│  │  │   CIB      │ │  BRPD      │ │   NID      │ │  Bangladesh Reports │ │   │
│  │  │ Service    │ │ Compliance │ │ e-KYC      │ │  Service            │ │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────────────┘ │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────────┐ │   │
│  │  │  Workflow  │ │ Document   │ │ Notification│ │  Analytics         │ │   │
│  │  │ Engine     │ │ Management │ │ Service    │ │  Service           │ │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────────────┘ │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │ Fineract REST API                         │
│  ┌──────────────────────────────▼──────────────────────────────────────┐   │
│  │                    APACHE FINERACT CORE                              │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────────┐ │   │
│  │  │   Loan     │ │  Savings   │ │ Accounting │ │  Customer          │ │   │
│  │  │ Portfolio  │ │  Accounts  │ │   Engine   │ │  Management        │ │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────────────┘ │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────────┐ │   │
│  │  │  Scheduler │ │   Charge   │ │  Collateral│ │  Reporting         │ │   │
│  │  │  Engine    │ │  Engine    │ │  Management│ │  Framework         │ │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────────────┘ │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │ JPA/Hibernate                             │
│  ┌──────────────────────────────▼──────────────────────────────────────┐   │
│  │                     DATA LAYER                                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │  PostgreSQL  │  │    Redis     │  │   MinIO      │              │   │
│  │  │  (Primary)   │  │   (Cache)    │  │   (DMS)      │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Fineract Core Capabilities Utilization

| Fineract Module | BRD Requirement | Usage in ULMS |
|----------------|-----------------|---------------|
| **Loan Portfolio** | BRD 6.1 - Loan Origination | Core loan lifecycle |
| **Scheduler Engine** | BRD 6.6 - DPD Calculation | Automatic classification |
| **Accounting Engine** | BRD 8.1 - CBS Integration | GL posting integration |
| **Charge Engine** | BRD 6.6 - Late fees | Penalty calculations |
| **Collateral Management** | BRD 6.2.3 - CPV | Security tracking |
| **Customer Management** | BRD 6.1.2 - KYC | Customer master data |
| **Savings Accounts** | BRD 6.4 - Disbursement | Linked accounts |

---

## 2. Backend Technology Stack

### 2.1 Core Technology: Java 21 LTS + Spring Boot 3.2

**Version Specifications:**
- **Java:** Eclipse Temurin JDK 21.0.2 LTS
- **Spring Boot:** 3.2.1
- **Spring Security:** 6.2.1
- **Spring Data JPA:** 3.2.1

**Justification based on BRD Requirements:**

| BRD Requirement | Technology Solution | Implementation |
|----------------|---------------------|----------------|
| **BRD 7.1** - 1000+ Concurrent Users | Java 21 Virtual Threads | `Executors.newVirtualThreadPerTaskExecutor()` |
| **BRD 7.3.1** - OAuth 2.0/JWT | Spring Security 6 | JWT Token-based auth |
| **BRD 6.2.1** - Real-time CIB | Spring WebFlux | Reactive async APIs |
| **BRD 6.3.2** - Parallel Processing | Spring Integration | Workflow orchestration |
| **BRD 7.5** - 99.9% Uptime | Spring Boot Actuator | Health checks, metrics |

### 2.2 ULMS Custom Microservices Architecture

| Microservice | Responsibility | Technology | BRD Reference |
|--------------|---------------|------------|---------------|
| **CIB Integration Service** | CIB Online API, Batch processing | Spring Boot + WebFlux | BRD 6.2.1 |
| **BRPD Compliance Service** | Classification, Provisioning | Spring Boot + Quartz | BRD 6.6.2, 9.1 |
| **NID/e-KYC Service** | NID verification, Biometrics | Spring Boot + REST | BRD 6.1.4 |
| **Workflow Engine Service** | Approval hierarchy, Routing | Spring Boot + Camunda | BRD 6.3 |
| **Document Management Service** | AES-256 encryption, Storage | Spring Boot + MinIO | BRD 6.7 |
| **Bangladesh Reports Service** | CL-1 to CL-5, BOCC minutes | Spring Boot + Jasper | BRD 11.1 |
| **Notification Service** | SMS/Email/Push | Spring Boot + Kafka | BRD 6.3.2 |
| **Analytics Service** | Dashboards, ECL calculations | Spring Boot + Python ML | BRD 11.2, 9.2 |

### 2.3 API Gateway: Kong API Gateway 3.5

**Configuration:**
```yaml
# kong.yml
services:
  - name: fineract-core
    url: http://fineract:8443
    routes:
      - name: fineract-routes
        paths: ["/fineract/*"]
    
  - name: cib-service
    url: http://cib-service:8080
    routes:
      - name: cib-routes
        paths: ["/api/cib/*"]
    plugins:
      - name: rate-limiting
        config:
          minute: 60
      - name: jwt
        config:
          uri_param_names: []
```

**Features:**
- **Authentication:** JWT validation at gateway level (BRD 7.3.1)
- **Rate Limiting:** 1000 requests/minute per user (BRD 7.1)
- **SSL/TLS:** TLS 1.3 termination (BRD 7.3.2)
- **Load Balancing:** Round-robin across service instances

---

## 3. Frontend Technology Stack

### 3.1 Web Application: React 18 + TypeScript 5.3

**Core Libraries:**

| Library | Version | Purpose | URD Reference |
|---------|---------|---------|---------------|
| React | 18.2.0 | UI Framework | URD 14 |
| TypeScript | 5.3.3 | Type Safety | Maintainability |
| Vite | 5.0.0 | Build Tool | Performance |
| React Router | 6.21.0 | Navigation | SPA requirement |
| TanStack Query | 5.17.0 | Server State | URD 5.1 |
| Redux Toolkit | 2.0.0 | Client State | URD 7.1 |
| MUI (Material-UI) | 5.15.0 | Component Library | URD 14.1 |
| React-i18next | 14.0.0 | i18n (Bengali) | URD 14.2 |
| Recharts | 2.10.0 | Data Visualization | URD 10.2 |
| React-PDF | 7.6.0 | Document Generation | URD 5.2.3 |
| React-Hook-Form | 7.49.0 | Form Management | URD 5.1 |
| Zod | 3.22.0 | Schema Validation | Data Integrity |

### 3.2 UI/UX Standards

**Accessibility (URD 14.4):**
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Bengali and English language support

**Responsive Breakpoints:**
```css
/* Mobile First Approach */
sm: 640px   /* Tablet portrait */
md: 768px   /* Tablet landscape */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### 3.3 Module Structure

```
src/
├── modules/
│   ├── los/                    # Loan Origination (URD 5)
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   ├── credit/                 # Credit Management (URD 6)
│   ├── workflow/               # Approval Workflow (URD 7)
│   ├── disbursement/           # Disbursement (URD 8)
│   ├── servicing/              # Loan Servicing (URD 9)
│   ├── collections/            # Collections (URD 9.3)
│   ├── reporting/              # Reports (URD 10)
│   └── admin/                  # Administration (URD 11)
├── shared/
│   ├── components/             # Common UI components
│   ├── hooks/                  # Shared hooks
│   ├── utils/                  # Utilities
│   └── i18n/                   # Translations
└── services/
    ├── api/                    # API clients
    ├── auth/                   # Authentication
    └── websocket/              # Real-time updates
```

---

## 4. Mobile Technology Stack

### 4.1 CPV Mobile App: React Native 0.73

**Justification (URD 6.3):**
- Cross-platform (Android/iOS) from single codebase
- Native performance for offline operations
- GPS and Camera native integration
- React skills transferable from web team

**Core Dependencies:**

| Library | Version | Purpose |
|---------|---------|---------|
| React Native | 0.73.2 | Core framework |
| Expo SDK | 50.0.0 | Development platform |
| Redux Toolkit | 2.0.0 | State management |
| Redux Persist | 6.0.0 | Offline data storage |
| React Native Maps | 1.9.0 | GPS visualization |
| React Native Vision Camera | 3.8.0 | Photo capture |
| React Native MMKV | 2.11.0 | Local storage |
| React Native NetInfo | 11.2.0 | Connectivity detection |
| React Native Background Fetch | 4.2.0 | Background sync |
| React Native Geolocation | 3.1.0 | GPS coordinates |

### 4.2 Offline-First Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  OFFLINE SYNC ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Offline    │───▶│   Queue      │───▶│   Sync       │  │
│  │   Actions    │    │   (Local)    │    │   Engine     │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                   │           │
│         ▼                   ▼                   ▼           │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  MMKV Store  │    │  Background  │    │  Conflict    │  │
│  │  (SQLite)    │    │  Sync Task   │    │  Resolution  │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Sync Strategy:**
- Queue pending CPV reports locally
- Auto-sync when connectivity restored
- Conflict resolution: Server wins for conflicts

---

## 5. Database & Storage Stack

### 5.1 Primary Database: PostgreSQL 16.1

**Selection Rationale:**
- Apache Fineract officially supports PostgreSQL
- Superior JSON support for flexible data
- Advanced indexing for CIB queries
- Native partitioning for large loan tables

**Configuration:**
```sql
-- postgresql.conf optimizations for ULMS
max_connections = 500
shared_buffers = 4GB
effective_cache_size = 12GB
work_mem = 64MB
maintenance_work_mem = 1GB
wal_buffers = 16MB
default_statistics_target = 500
random_page_cost = 1.1
effective_io_concurrency = 200
checkpoint_completion_target = 0.9
wal_compression = on
```

**High Availability:**
- Patroni + etcd for auto-failover
- 1 Primary + 2 Standby replicas
- Synchronous replication for critical data
- pgBackRest for backups

### 5.2 Database Schema Strategy

**Multi-Tenant Design (per Bank):**
```sql
-- Schema per bank
CREATE SCHEMA bank_001;
CREATE SCHEMA bank_002;

-- Tenant isolation
SET search_path TO bank_001, public;
```

**Key Tables:**
| Table | Purpose | Estimated Rows |
|-------|---------|----------------|
| m_loan | Loan accounts | 10M+ |
| m_client | Customers | 5M+ |
| m_loan_repayment_schedule | EMI schedules | 100M+ |
| cib_reports | CIB history | 20M+ |
| loan_classification | BRPD compliance | 10M+ |
| audit_logs | Compliance | 500M+ |

### 5.3 Caching Layer: Redis 7.2

**Use Cases:**
| Cache Type | TTL | Purpose |
|------------|-----|---------|
| CIB Reports | 1 hour | Reduce API calls |
| User Sessions | 30 min | Distributed sessions |
| Loan Products | 24 hours | Static configuration |
| Dashboard Data | 5 min | Real-time metrics |
| Rate Limiting | 1 min | API throttling |

### 5.4 Document Storage: MinIO

**Configuration:**
- AES-256 server-side encryption
- Versioning enabled
- Lifecycle policies for archival
- Integration with Fineract document hooks

---

## 6. Messaging & Integration Stack

### 6.1 Event Streaming: Apache Kafka 3.6

**Topic Design:**
| Topic | Events | Retention | Partitions |
|-------|--------|-----------|------------|
| loan.applications | Created, Approved, Rejected | 1 year | 12 |
| loan.disbursements | Disbursed, Failed | 7 years | 6 |
| loan.payments | EMI, Prepayment, Late | 7 years | 12 |
| cib.updates | New loans, Classifications | 2 years | 3 |
| notifications | SMS, Email, Push | 30 days | 6 |
| audit.events | All user actions | 10 years | 6 |

**Event Schema (Avro):**
```json
{
  "type": "record",
  "name": "LoanApplicationEvent",
  "fields": [
    {"name": "eventId", "type": "string"},
    {"name": "loanId", "type": "long"},
    {"name": "eventType", "type": "enum", "symbols": ["CREATED", "APPROVED", "REJECTED"]},
    {"name": "timestamp", "type": "long", "logicalType": "timestamp-millis"},
    {"name": "userId", "type": "string"},
    {"name": "payload", "type": "bytes"}
  ]
}
```

### 6.2 Integration Middleware: Apache Camel 4.3

**CBS Integration Routes:**
```java
from("direct:cbs-gl-posting")
    .routeId("cbs-gl-route")
    .marshal().json()
    .setHeader("Authorization", constant("Bearer ${cbs.token}"))
    .to("https://cbs.bank.api/gl/transactions")
    .onException(Exception.class)
        .maximumRedeliveries(3)
        .redeliveryDelay(5000)
        .to("kafka:dlq.cbs.failed");
```

---

## 7. DevOps & Infrastructure Stack

### 7.1 Container Orchestration: Kubernetes 1.28

**Namespace Strategy:**
```yaml
namespaces:
  - ulms-production
  - ulms-staging
  - ulms-development
  - ulms-monitoring
```

**Deployment Configuration:**
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ulms-fineract
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    spec:
      containers:
      - name: fineract
        image: unisoft/ulms-fineract:1.0.0
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
```

### 7.2 CI/CD Pipeline: GitLab CI + ArgoCD

**Pipeline Stages:**
1. **Build**: Maven/Gradle compilation, Docker build
2. **Test**: Unit tests, Integration tests, Security scan
3. **Quality**: SonarQube analysis, Code coverage
4. **Package**: Helm chart creation, Image tagging
5. **Deploy**: ArgoCD sync to Kubernetes

### 7.3 Monitoring Stack

**Metrics: Prometheus + Grafana**
- JVM metrics (heap, GC, threads)
- Application metrics (response time, throughput)
- Business metrics (loans processed, TAT)
- Custom dashboards for management

**Logging: ELK Stack**
- Application logs: 90 days retention
- Audit logs: 10 years retention
- Security logs: 7 years retention

**Tracing: Jaeger**
- Distributed transaction tracing
- Performance bottleneck identification

---

## 8. Security Stack

### 8.1 Identity Management: Keycloak 23

**Configuration:**
- OAuth 2.0 / OpenID Connect
- MFA support (SMS OTP)
- LDAP/AD federation for bank integration
- Custom user attributes (approval limits, branch)

**Realm Structure:**
```
ulms-realm/
├── clients/
│   ├── ulms-web
│   ├── ulms-mobile
│   └── ulms-api
├── roles/
│   ├── BRANCH_USER
│   ├── CREDIT_ANALYST
│   ├── BRANCH_MANAGER
│   └── MD
└── identity-providers/
    └── bank-ad-ldap
```

### 8.2 Secrets Management: HashiCorp Vault

**Secret Types:**
- Database credentials (dynamic)
- API keys (CIB, NID, bKash)
- TLS certificates
- Encryption keys (AES-256)

### 8.3 Data Encryption

**At Rest:**
- PostgreSQL: TDE with AES-256
- MinIO: Server-side encryption
- Application: Field-level encryption for NID

**In Transit:**
- TLS 1.3 for all communications
- mTLS for service-to-service
- Certificate rotation automation

---

## 9. Compliance Technology Stack

### 9.1 Audit Framework

**Hibernate Envers:**
- Entity versioning for all loan data
- Audit table retention: 10 years
- Immutable audit trail

**Log Aggregation:**
- Structured logging (JSON format)
- Immutable log storage (WORM)
- Real-time compliance monitoring

### 9.2 BRPD Compliance Engine

**Classification Scheduler:**
```java
@Scheduled(cron = "0 0 2 * * ?") // Daily at 2 AM
public void calculateLoanClassification() {
    // DPD calculation
    // Classification assignment
    // Provision calculation
    // GL posting for provisions
}
```

### 9.3 CIB Integration Security

- Certificate-based authentication
- VPN tunnel to Bangladesh Bank
- Request/response encryption
- Audit logging of all CIB queries

---

## 10. Technology Roadmap

### Phase 1: Foundation (Months 1-2)
- Java 21 + Spring Boot 3.2 setup
- PostgreSQL 16 cluster deployment
- React 18 frontend scaffold
- Keycloak authentication
- Basic Fineract integration

### Phase 2: Core Modules (Months 3-5)
- CIB Integration Service
- NID/e-KYC Service
- Workflow Engine (Camunda)
- Document Management
- Bangladesh Reports

### Phase 3: Advanced Features (Months 6-8)
- React Native CPV app
- AI/ML Credit Scoring
- Islamic Banking Module
- Advanced Analytics
- Full BRPD compliance

### Phase 4: Production Readiness (Months 9-10)
- Security hardening
- Performance optimization
- Disaster recovery testing
- UAT and Go-live

---

## 11. Risk Assessment & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Fineract upgrade conflicts | Medium | High | Version pinning, regression testing |
| Java 21 compatibility | Low | Medium | LTS support until 2031 |
| PostgreSQL scaling | Low | High | Read replicas, sharding strategy |
| Integration complexity | Medium | High | Apache Camel, circuit breakers |
| Security vulnerabilities | Low | Critical | Automated scanning, Vault |

---

## Appendices

### Appendix A: Technology Comparison Summary

| Component | Selected | Alternative | Decision Factor |
|-----------|----------|-------------|-----------------|
| Core Platform | Apache Fineract | Frappe Lending | Enterprise banking fit |
| Backend | Java 21 | Python | Fineract native, performance |
| Frontend | React 18 | Angular | Ecosystem, Bengali support |
| Mobile | React Native | Flutter | Team skills, code sharing |
| Database | PostgreSQL 16 | MySQL 8 | JSON support, Fineract compatible |
| Cache | Redis 7 | Memcached | Persistence, clustering |
| Messaging | Kafka 3.6 | RabbitMQ | Scalability, retention |

### Appendix B: Compliance Mapping

| Requirement | Technology | Status |
|-------------|-----------|--------|
| ICT Security V4.0 | Spring Security 6 + Keycloak | ✅ Compliant |
| AES-256 Encryption | PostgreSQL TDE + Vault | ✅ Compliant |
| TLS 1.3 | Cert-Manager + Ingress | ✅ Compliant |
| Audit Trail | Hibernate Envers + ELK | ✅ Compliant |
| RBAC | Keycloak | ✅ Compliant |
| BRPD 15/2024 | Custom Compliance Service | ✅ Compliant |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

*This Technology Stack Recommendation is approved for implementation and provides the technical foundation for the ULMS project based on Apache Fineract Community Edition.*

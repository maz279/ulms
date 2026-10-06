# ULMS System Architecture Document
## Unisoft Loan Management System (ULMS) v2.0
### High-Level System Architecture

---

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ARCH-1.1.1 |
| **Document Title** | ULMS System Architecture Document (High-Level) |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 4, 2026 |
| **Prepared By** | Lead Developer, Solutions Architect |
| **Reviewed By** | Architecture Review Board |
| **Classification** | Confidential - Internal Use |
| **Status** | Approved for Implementation |

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | February 4, 2026 | Lead Developer | Initial System Architecture Document |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Context and Boundaries](#2-system-context-and-boundaries)
3. [High-Level Architecture](#3-high-level-architecture)
4. [Architecture Layers](#4-architecture-layers)
5. [Technology Stack](#5-technology-stack)
6. [Cross-Cutting Concerns](#6-cross-cutting-concerns)
7. [Quality Attributes](#7-quality-attributes)
8. [Architecture Decision Records](#8-architecture-decision-records)
9. [Compliance Mapping](#9-compliance-mapping)
10. [Appendices](#10-appendices)

---

## 1. Executive Summary

### 1.1 Purpose

This document defines the high-level system architecture for the **Unisoft Loan Management System (ULMS) v2.0**, an enterprise-grade digital lending platform built on **Apache Fineract Community Edition**. The architecture is specifically designed to meet the unique requirements of Bangladesh's banking sector while ensuring full regulatory compliance with Bangladesh Bank guidelines.

### 1.2 Architecture Vision

ULMS v2.0 adopts a **hybrid microservices architecture** that combines the proven enterprise capabilities of Apache Fineract with custom Bangladesh-specific microservices. This approach provides:

- **Enterprise Foundation**: Apache Fineract 1.10 CE provides battle-tested core banking capabilities
- **Extensibility**: Custom Spring Boot microservices extend functionality for Bangladesh-specific requirements
- **Scalability**: Kubernetes-native deployment supports horizontal scaling for 62+ scheduled banks
- **Compliance**: Built-in support for BRPD 15/2024, IFRS-9, Basel III, and ICT Security Guidelines V4.0

### 1.3 Key Architecture Characteristics

| Characteristic | Description |
|----------------|-------------|
| **Architecture Style** | Hybrid Microservices on Apache Fineract |
| **Deployment Model** | Cloud-Native (Kubernetes 1.28) |
| **Integration Pattern** | API-First, Event-Driven |
| **Multi-Tenancy** | Schema-Per-Tenant (Per Bank) |
| **Security Model** | OAuth 2.0 / JWT with RBAC |
| **Data Strategy** | PostgreSQL 16 with Multi-Tenant Isolation |

---

## 2. System Context and Boundaries

### 2.1 System Context Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              EXTERNAL SYSTEMS CONTEXT                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  Bank Staff  │    │   Customers  │    │  CPV Officers│    │  Executives  │      │
│  │   (Branch)   │    │  (Borrowers) │    │   (Field)    │    │    (Mgmt)    │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                   │                   │                   │               │
│         ▼                   ▼                   ▼                   ▼               │
│  ┌──────────────────────────────────────────────────────────────────────────┐      │
│  │                                                                           │      │
│  │                        ULMS v2.0 SYSTEM BOUNDARY                          │      │
│  │                                                                           │      │
│  │   ┌─────────────────────────────────────────────────────────────────┐    │      │
│  │   │                    User Interface Layer                          │    │      │
│  │   │   React 18 Web App │ React Native Mobile │ API Portal           │    │      │
│  │   └─────────────────────────────────────────────────────────────────┘    │      │
│  │                                    │                                      │      │
│  │   ┌─────────────────────────────────────────────────────────────────┐    │      │
│  │   │                    API Gateway (Kong 3.5)                        │    │      │
│  │   └─────────────────────────────────────────────────────────────────┘    │      │
│  │                                    │                                      │      │
│  │   ┌─────────────────────────────────────────────────────────────────┐    │      │
│  │   │              Custom Microservices + Apache Fineract              │    │      │
│  │   └─────────────────────────────────────────────────────────────────┘    │      │
│  │                                    │                                      │      │
│  │   ┌─────────────────────────────────────────────────────────────────┐    │      │
│  │   │                       Data Layer                                 │    │      │
│  │   │   PostgreSQL 16 │ Redis 7 │ Kafka 3.6 │ MinIO │ Elasticsearch   │    │      │
│  │   └─────────────────────────────────────────────────────────────────┘    │      │
│  │                                                                           │      │
│  └───────────────────────────────────────────────────────────────────────────┘      │
│         │                   │                   │                   │               │
│         ▼                   ▼                   ▼                   ▼               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  Bangladesh  │    │   NID Wing   │    │  Core Banking│    │   Payment    │      │
│  │  Bank CIB    │    │  (e-KYC)     │    │    System    │    │  Gateways    │      │
│  └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   SMS/Email  │    │  Bangladesh  │    │  Insurance   │    │    Land      │      │
│  │   Gateways   │    │  Bank SFTP   │    │   Providers  │    │   Registry   │      │
│  └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 System Boundaries

#### 2.2.1 In-Scope Components

| Component | Description |
|-----------|-------------|
| Loan Origination System (LOS) | Complete loan application lifecycle |
| Credit Management System | CIB integration, credit scoring, risk assessment |
| Approval Workflow Engine | Multi-level approval with Camunda BPMN |
| Disbursement Module | Loan disbursement processing |
| Loan Servicing Module | Repayment processing, account management |
| Collections & Recovery | Delinquency management, NPA tracking |
| BRPD Compliance Engine | Loan classification, provisioning |
| Document Management System | Encrypted document storage |
| Reporting & Analytics | Regulatory reports, dashboards |
| Mobile CPV Application | Field verification app |

#### 2.2.2 Out-of-Scope Components

| Component | Reason |
|-----------|--------|
| Core Banking System | Integration only (existing system) |
| General Ledger Accounting | Integration only |
| ATM/POS Integration | Not part of loan management |
| International Remittance | Separate system |
| Trade Finance Processing | LC/BG document processing |

### 2.3 External System Interfaces

| External System | Interface Type | Purpose | Protocol |
|-----------------|---------------|---------|----------|
| **CIB Online** | API | Credit information inquiry | REST/mTLS |
| **NID Wing (NIDW)** | API | National ID verification | REST/TLS |
| **Core Banking System** | API/File | Account operations, GL posting | REST/SOAP |
| **bKash** | API | Mobile wallet disbursement | REST/TLS |
| **Nagad** | API | Mobile wallet disbursement | REST/TLS |
| **Rocket (DBBL)** | API | Mobile wallet disbursement | REST/TLS |
| **Bangladesh Bank SFTP** | File Transfer | Regulatory report submission | SFTP |
| **SMS Gateway** | HTTP API | Customer notifications | REST |
| **Email Gateway** | SMTP/API | Email notifications | SMTP/REST |
| **Insurance Providers** | API | Policy verification | REST |
| **BRTA** | API | Vehicle verification | REST |
| **Land Registry** | API | Property verification | REST |

---

## 3. High-Level Architecture

### 3.1 Architecture Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        ULMS v2.0 HIGH-LEVEL ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ╔═══════════════════════════════════════════════════════════════════════════════╗  │
│  ║                           CLIENT LAYER                                         ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════════╣  │
│  ║  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                ║  │
│  ║  │   React 18      │  │  React Native   │  │   Partner       │                ║  │
│  ║  │   Web Portal    │  │   CPV App       │  │   API Clients   │                ║  │
│  ║  │   (TypeScript)  │  │   (Mobile)      │  │   (REST/SDK)    │                ║  │
│  ║  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘                ║  │
│  ╚═══════════╪════════════════════╪════════════════════╪═════════════════════════╝  │
│              │                    │                    │                             │
│              └────────────────────┼────────────────────┘                             │
│                                   │ HTTPS (TLS 1.3)                                  │
│                                   ▼                                                  │
│  ╔═══════════════════════════════════════════════════════════════════════════════╗  │
│  ║                        API GATEWAY LAYER                                       ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════════╣  │
│  ║  ┌───────────────────────────────────────────────────────────────────────────┐║  │
│  ║  │                        KONG API GATEWAY 3.5                                │║  │
│  ║  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │║  │
│  ║  │  │ JWT Auth    │ │ Rate Limit  │ │ SSL Term    │ │ Load Balancing     │  │║  │
│  ║  │  │ Validation  │ │ (1000/min)  │ │ (TLS 1.3)   │ │ (Round-Robin)      │  │║  │
│  ║  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘  │║  │
│  ║  └───────────────────────────────────────────────────────────────────────────┘║  │
│  ╚═══════════════════════════════════════════════════════════════════════════════╝  │
│                                   │                                                  │
│                                   ▼                                                  │
│  ╔═══════════════════════════════════════════════════════════════════════════════╗  │
│  ║                      APPLICATION LAYER                                         ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                                ║  │
│  ║  ┌─────────────────────────────────────────────────────────────────────────┐  ║  │
│  ║  │              ULMS CUSTOM MICROSERVICES (Spring Boot 3.2)                 │  ║  │
│  ║  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │  ║  │
│  ║  │  │   CIB    │ │   NID    │ │ Workflow │ │ Document │ │  Bangladesh  │  │  ║  │
│  ║  │  │ Service  │ │  e-KYC   │ │ Engine   │ │ Service  │ │   Reports    │  │  ║  │
│  ║  │  │(WebFlux) │ │ Service  │ │(Camunda) │ │ (MinIO)  │ │   Service    │  │  ║  │
│  ║  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │  ║  │
│  ║  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────────────┐ │  ║  │
│  ║  │  │  BRPD    │ │Analytics │ │Notificat-│ │    Integration Gateway     │ │  ║  │
│  ║  │  │Compliance│ │ Service  │ │ion Svc   │ │    (Apache Camel 4.3)      │ │  ║  │
│  ║  │  │ (Quartz) │ │(Python)  │ │ (Kafka)  │ │                            │ │  ║  │
│  ║  │  └──────────┘ └──────────┘ └──────────┘ └────────────────────────────┘ │  ║  │
│  ║  └─────────────────────────────────────────────────────────────────────────┘  ║  │
│  ║                                   │                                            ║  │
│  ║                                   ▼                                            ║  │
│  ║  ┌─────────────────────────────────────────────────────────────────────────┐  ║  │
│  ║  │                    APACHE FINERACT CORE (v1.10)                          │  ║  │
│  ║  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────────┐  │  ║  │
│  ║  │  │    Loan      │ │   Savings    │ │  Accounting  │ │   Customer     │  │  ║  │
│  ║  │  │  Portfolio   │ │   Accounts   │ │    Engine    │ │  Management    │  │  ║  │
│  ║  │  │   Module     │ │   Module     │ │   Module     │ │    Module      │  │  ║  │
│  ║  │  └──────────────┘ └──────────────┘ └──────────────┘ └────────────────┘  │  ║  │
│  ║  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────────┐  │  ║  │
│  ║  │  │   Charge     │ │  Scheduler   │ │  Collateral  │ │   Reporting    │  │  ║  │
│  ║  │  │   Engine     │ │   Engine     │ │  Management  │ │   Framework    │  │  ║  │
│  ║  │  └──────────────┘ └──────────────┘ └──────────────┘ └────────────────┘  │  ║  │
│  ║  └─────────────────────────────────────────────────────────────────────────┘  ║  │
│  ║                                                                                ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════════╝  │
│                                   │                                                  │
│                                   ▼                                                  │
│  ╔═══════════════════════════════════════════════════════════════════════════════╗  │
│  ║                          DATA LAYER                                            ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════════╣  │
│  ║  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐ ║  │
│  ║  │  PostgreSQL 16 │  │    Redis 7     │  │  Apache Kafka  │  │ Elasticsearch│ ║  │
│  ║  │   (Primary)    │  │    (Cache)     │  │     3.6        │  │    (Logs)    │ ║  │
│  ║  │  Multi-Tenant  │  │  Sessions/CIB  │  │    (Events)    │  │   (Search)   │ ║  │
│  ║  └────────────────┘  └────────────────┘  └────────────────┘  └──────────────┘ ║  │
│  ║  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                   ║  │
│  ║  │     MinIO      │  │ HashiCorp Vault│  │   Prometheus   │                   ║  │
│  ║  │    (DMS)       │  │   (Secrets)    │  │   + Grafana    │                   ║  │
│  ║  │   AES-256      │  │  Key Mgmt      │  │  (Monitoring)  │                   ║  │
│  ║  └────────────────┘  └────────────────┘  └────────────────┘                   ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════════╝  │
│                                                                                      │
│  ╔═══════════════════════════════════════════════════════════════════════════════╗  │
│  ║                     SECURITY & IDENTITY LAYER                                  ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════════╣  │
│  ║  ┌─────────────────────────────────────────────────────────────────────────┐  ║  │
│  ║  │                      KEYCLOAK 23 (Identity Provider)                     │  ║  │
│  ║  │   OAuth 2.0 / OpenID Connect │ MFA (SMS OTP) │ LDAP/AD Federation       │  ║  │
│  ║  └─────────────────────────────────────────────────────────────────────────┘  ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════════╝  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Architecture Style Rationale

#### 3.2.1 Why Hybrid Microservices on Apache Fineract?

| Factor | Rationale |
|--------|-----------|
| **Enterprise Foundation** | Apache Fineract provides 10+ years of proven core banking functionality |
| **Regulatory Compliance** | Pre-built loan lifecycle, accounting, and scheduler modules |
| **Bangladesh Customization** | Custom microservices for CIB, NID, BRPD-specific requirements |
| **Risk Mitigation** | Reduces development time and risk vs. building from scratch |
| **Community Support** | Active Apache Foundation community, regular security updates |
| **Scalability** | Microservices can scale independently based on demand |

#### 3.2.2 Key Architecture Patterns

| Pattern | Implementation | Purpose |
|---------|---------------|---------|
| **API Gateway** | Kong 3.5 | Single entry point, security, rate limiting |
| **CQRS** | Read/Write separation | Optimize read-heavy operations (dashboards) |
| **Event Sourcing** | Kafka | Immutable audit trail, compliance |
| **SAGA** | Choreography via Kafka | Distributed transaction management |
| **Circuit Breaker** | Resilience4j | Fault tolerance for external integrations |
| **Domain-Driven Design** | Bounded contexts | Service boundaries align with business domains |

---

## 4. Architecture Layers

### 4.1 Client Layer

#### 4.1.1 Web Application (React 18)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | React 18.2.0 | UI component framework |
| **Language** | TypeScript 5.3.3 | Type-safe development |
| **Build Tool** | Vite 5.0.0 | Fast development server and builds |
| **State Management** | Redux Toolkit 2.0.0 | Global state management |
| **Server State** | TanStack Query 5.17.0 | API caching and synchronization |
| **UI Components** | MUI 5.15.0 | Material Design components |
| **i18n** | react-i18next 14.0.0 | Bengali/English localization |
| **Forms** | React Hook Form 7.49.0 + Zod | Form handling and validation |
| **Charts** | Recharts 2.10.0 | Dashboard visualizations |

**Module Structure:**
```
src/
├── modules/
│   ├── los/           # Loan Origination System
│   ├── credit/        # Credit Management
│   ├── workflow/      # Approval Workflow
│   ├── disbursement/  # Disbursement
│   ├── servicing/     # Loan Servicing
│   ├── collections/   # Collections & Recovery
│   ├── reporting/     # Reports & Dashboards
│   └── admin/         # Administration
├── shared/            # Common components
└── services/          # API clients, auth
```

#### 4.1.2 Mobile Application (React Native)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | React Native 0.73.2 | Cross-platform mobile |
| **Platform** | Expo SDK 50.0.0 | Development tools |
| **Local Storage** | MMKV 2.11.0 | Encrypted offline storage |
| **Camera** | Vision Camera 3.8.0 | Photo capture |
| **GPS** | Geolocation 3.1.0 | Location services |
| **Maps** | React Native Maps 1.9.0 | Map visualization |
| **Offline Sync** | Redux Persist 6.0.0 | Background synchronization |

### 4.2 API Gateway Layer

#### 4.2.1 Kong API Gateway 3.5 Configuration

```yaml
# Kong Gateway Configuration
services:
  - name: fineract-core
    url: http://fineract:8443
    routes:
      - name: fineract-routes
        paths: ["/fineract/*"]
    plugins:
      - name: jwt
      - name: rate-limiting
        config:
          minute: 1000
      - name: cors

  - name: cib-service
    url: http://cib-service:8080
    routes:
      - name: cib-routes
        paths: ["/api/cib/*"]
    plugins:
      - name: jwt
      - name: rate-limiting
        config:
          minute: 60

  - name: nid-service
    url: http://nid-service:8080
    routes:
      - name: nid-routes
        paths: ["/api/nid/*"]
    plugins:
      - name: jwt
```

**Gateway Features:**
| Feature | Configuration | Purpose |
|---------|--------------|---------|
| **JWT Validation** | RS256 algorithm | Token-based authentication |
| **Rate Limiting** | 1000 req/min (default) | DDoS protection |
| **SSL/TLS** | TLS 1.3 | Encryption in transit |
| **Load Balancing** | Round-robin | High availability |
| **Logging** | ELK integration | Audit trail |
| **Health Checks** | /health endpoint | Service monitoring |

### 4.3 Application Layer

#### 4.3.1 Apache Fineract Core (v1.10)

| Module | ULMS Usage | Customization |
|--------|-----------|---------------|
| **Loan Portfolio** | Core loan lifecycle | Extended for BRPD compliance |
| **Savings Accounts** | Linked accounts | Standard usage |
| **Accounting Engine** | GL postings | Custom Bangladesh COA |
| **Customer Management** | Customer master | NID integration |
| **Scheduler Engine** | DPD calculation | Custom classification job |
| **Charge Engine** | Fee management | Bangladesh fee types |
| **Collateral Management** | Security tracking | Extended for CPV |
| **Reporting Framework** | Report templates | Custom reports |

#### 4.3.2 Custom Microservices

| Service | Technology | Responsibility | Port |
|---------|-----------|----------------|------|
| **cib-service** | Spring Boot 3.2 + WebFlux | CIB Online integration | 8081 |
| **nid-ekyc-service** | Spring Boot 3.2 | NID verification | 8082 |
| **workflow-service** | Spring Boot 3.2 + Camunda | Approval workflow | 8083 |
| **document-service** | Spring Boot 3.2 + MinIO | Document management | 8084 |
| **brpd-service** | Spring Boot 3.2 + Quartz | Compliance engine | 8085 |
| **notification-service** | Spring Boot 3.2 + Kafka | Notifications | 8086 |
| **analytics-service** | Spring Boot 3.2 + Python | Analytics/ML | 8087 |
| **integration-gateway** | Apache Camel 4.3 | CBS adapter | 8088 |

### 4.4 Data Layer

#### 4.4.1 PostgreSQL 16 (Primary Database)

**Configuration:**
```sql
-- PostgreSQL Optimization for ULMS
max_connections = 500
shared_buffers = 4GB
effective_cache_size = 12GB
work_mem = 64MB
maintenance_work_mem = 1GB
wal_buffers = 16MB
checkpoint_completion_target = 0.9
wal_compression = on
```

**High Availability:**
- Patroni + etcd for automatic failover
- 1 Primary + 2 Standby replicas
- Synchronous replication for critical data
- pgBackRest for backup management

**Multi-Tenant Schema Design:**
```
PostgreSQL Database
├── public (Shared Schema)
│   ├── tenants
│   ├── users
│   └── configuration
├── bank_001 (Tenant Schema)
│   ├── m_loan
│   ├── m_client
│   ├── cib_inquiry
│   └── audit_log
├── bank_002 (Tenant Schema)
└── bank_00N (Tenant Schema)
```

#### 4.4.2 Redis 7 (Caching Layer)

| Cache Type | TTL | Purpose |
|------------|-----|---------|
| CIB Reports | 1 hour | Reduce CIB API calls |
| User Sessions | 30 min | Distributed sessions |
| Loan Products | 24 hours | Static configuration |
| Dashboard Data | 5 min | Real-time metrics |
| Rate Limiting | 1 min | API throttling |

#### 4.4.3 Apache Kafka 3.6 (Event Streaming)

**Cluster Configuration:**
- 3+ Broker nodes (production)
- ZooKeeper or KRaft for coordination
- Avro Schema Registry for message validation

**Topic Summary:**
| Topic | Partitions | Replicas | Retention |
|-------|-----------|----------|-----------|
| loan.applications | 12 | 3 | 1 year |
| loan.approvals | 6 | 3 | 7 years |
| loan.disbursements | 6 | 3 | 7 years |
| loan.payments | 12 | 3 | 7 years |
| loan.classifications | 3 | 3 | 2 years |
| notifications | 6 | 3 | 30 days |
| audit.events | 6 | 3 | 10 years |

#### 4.4.4 Additional Data Stores

| Store | Technology | Purpose |
|-------|-----------|---------|
| **Document Storage** | MinIO | S3-compatible file storage, AES-256 |
| **Search/Logging** | Elasticsearch 8.x | Full-text search, log aggregation |
| **Metrics** | Prometheus | Time-series metrics |
| **Secrets** | HashiCorp Vault 1.15 | Key management, credentials |

---

## 5. Technology Stack

### 5.1 Complete Technology Stack Summary

| Layer | Component | Technology | Version |
|-------|-----------|-----------|---------|
| **Core Platform** | Banking Core | Apache Fineract CE | 1.10.0 |
| **Backend Language** | Primary | Java | 21 LTS |
| **Backend Framework** | Application | Spring Boot | 3.2.1 |
| **Backend Security** | Authentication | Spring Security | 6.2.1 |
| **Frontend Framework** | Web UI | React | 18.2.0 |
| **Frontend Language** | Type Safety | TypeScript | 5.3.3 |
| **Mobile Framework** | CPV App | React Native | 0.73.2 |
| **Database** | Primary | PostgreSQL | 16.1 |
| **Cache** | In-Memory | Redis | 7.2 |
| **Message Broker** | Events | Apache Kafka | 3.6 |
| **Document Storage** | Files | MinIO | Latest |
| **API Gateway** | Gateway | Kong | 3.5 |
| **Workflow Engine** | BPMN | Camunda | 7.20 |
| **Identity Provider** | IAM | Keycloak | 23 |
| **Secrets Management** | Keys | HashiCorp Vault | 1.15 |
| **Monitoring** | Metrics | Prometheus + Grafana | Latest |
| **Logging** | Aggregation | ELK Stack | 8.x |
| **Tracing** | Distributed | Jaeger | Latest |
| **Container Platform** | Runtime | Docker | Latest |
| **Orchestration** | K8s | Kubernetes | 1.28 |
| **CI/CD** | Pipeline | GitLab CI + ArgoCD | Latest |
| **Integration** | Middleware | Apache Camel | 4.3 |

### 5.2 Technology Selection Rationale

| Technology | Selection Criteria | Score |
|-----------|-------------------|-------|
| **Apache Fineract** | Enterprise banking fit, compliance, community | 93/100 |
| **Java 21** | LTS support, virtual threads, Fineract native | 95/100 |
| **Spring Boot 3.2** | Industry standard, excellent integration | 92/100 |
| **React 18** | Component ecosystem, Bengali support | 90/100 |
| **PostgreSQL 16** | Fineract support, JSON, multi-tenant | 94/100 |
| **Kafka 3.6** | Event streaming, compliance audit | 91/100 |
| **Kubernetes 1.28** | Cloud-native, auto-scaling | 93/100 |

---

## 6. Cross-Cutting Concerns

### 6.1 Security Architecture

#### 6.1.1 Authentication & Authorization

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │    User      │───▶│   Keycloak   │───▶│    Kong      │       │
│  │   (Login)    │    │   (OAuth)    │    │  (JWT Check) │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                             │                    │               │
│                             ▼                    ▼               │
│                      ┌──────────────┐    ┌──────────────┐       │
│                      │   MFA/OTP    │    │    RBAC      │       │
│                      │   (SMS)      │    │  (11 Roles)  │       │
│                      └──────────────┘    └──────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Authentication Mechanisms:**
| Mechanism | Implementation | Use Case |
|-----------|---------------|----------|
| OAuth 2.0 | Keycloak 23 | Primary authentication |
| JWT Tokens | RS256 algorithm | API authentication |
| MFA | SMS OTP | Critical operations |
| LDAP/AD | Keycloak federation | Bank staff SSO |

**Authorization (RBAC) Roles:**
| Role | Level | Max Approval Limit |
|------|-------|-------------------|
| Branch User | - | View only |
| Credit Analyst (Branch) | - | Recommend |
| Branch Credit Head | L1 | ≤5 Lakh BDT |
| Branch Manager | L2 | ≤10 Lakh BDT |
| Regional Manager | L3 | ≤25 Lakh BDT |
| Head of Credit | L4 | ≤1 Crore BDT |
| Credit Committee | L5 | ≤5 Crore BDT |
| Deputy MD | L6 | ≤10 Crore BDT |
| Managing Director | L7 | Unlimited |
| Credit Admin | - | Disbursement |
| System Admin | - | Configuration |

#### 6.1.2 Data Encryption

| Data State | Algorithm | Key Management |
|------------|-----------|----------------|
| **At Rest (DB)** | AES-256-TDE | PostgreSQL TDE |
| **At Rest (Files)** | AES-256-GCM | MinIO + Vault |
| **In Transit** | TLS 1.3 | cert-manager |
| **Field-Level** | AES-256-GCM | Vault (NID, sensitive) |
| **Backups** | AES-256-CBC | Vault + HSM |

#### 6.1.3 Audit Logging

```json
{
  "eventId": "evt-uuid-12345",
  "timestamp": "2026-02-04T10:30:00Z",
  "eventType": "LOAN_APPROVED",
  "severity": "INFO",
  "actor": {
    "userId": "user123",
    "username": "john.doe",
    "ipAddress": "192.168.1.100",
    "sessionId": "sess-uuid"
  },
  "resource": {
    "type": "LOAN_APPLICATION",
    "id": "APP-2026-000123"
  },
  "action": {
    "type": "APPROVE",
    "status": "SUCCESS"
  },
  "tenantId": "BANK001",
  "branchId": "BR001",
  "changes": [
    {
      "field": "status",
      "oldValue": "PENDING",
      "newValue": "APPROVED"
    }
  ]
}
```

### 6.2 Logging Strategy

#### 6.2.1 ELK Stack Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                    LOGGING ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ Services │───▶│ Filebeat │───▶│Logstash  │───▶│Elastic-  │  │
│  │  (Logs)  │    │          │    │          │    │ search   │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│                                                       │          │
│                                                       ▼          │
│                                                ┌──────────┐     │
│                                                │  Kibana  │     │
│                                                │(Dashboard)│     │
│                                                └──────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Log Retention Policy:**
| Log Type | Retention | Archive |
|----------|-----------|---------|
| Application Logs | 90 days | After 30 days |
| Audit Logs | 10 years | After 5 years |
| Security Logs | 7 years | After 1 year |
| System Logs | 90 days | Delete after 90 days |

### 6.3 Monitoring & Observability

#### 6.3.1 Prometheus + Grafana

**Key Metrics:**
| Category | Metrics |
|----------|---------|
| **JVM** | Heap usage, GC time, threads |
| **Application** | Request rate, latency (p50, p95, p99), error rate |
| **Business** | Loans processed, TAT, approval rate |
| **Database** | Connection pool, query time |
| **Kafka** | Consumer lag, message rate |

**Alert Rules:**
| Alert | Threshold | Action |
|-------|-----------|--------|
| High Error Rate | >5% in 5 min | Page on-call |
| High Latency | p95 > 2s | Notify team |
| Database Connection Pool | >80% | Scale up |
| Disk Usage | >85% | Cleanup/expand |
| NPA Spike | >2% daily increase | Notify risk team |

#### 6.3.2 Distributed Tracing (Jaeger)

- End-to-end request tracing across microservices
- Trace ID propagation via HTTP headers
- Performance bottleneck identification
- Service dependency visualization

### 6.4 Exception Handling

**Standardized Error Response:**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERR_VALIDATION",
    "message": "Validation failed",
    "details": [
      {
        "field": "nidNumber",
        "message": "NID number is required"
      }
    ],
    "traceId": "abc123xyz",
    "timestamp": "2026-02-04T10:30:00Z"
  }
}
```

**Error Categories:**
| Category | Code Range | Example |
|----------|-----------|---------|
| Validation | 400-499 | Invalid input |
| Authentication | 401, 403 | Unauthorized |
| Business Logic | 422 | DBR exceeds limit |
| External System | 502, 503 | CIB timeout |
| Internal | 500 | Unexpected error |

---

## 7. Quality Attributes

### 7.1 Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page Load Time | < 2 seconds | Lighthouse |
| API Response (95th percentile) | < 500ms | Prometheus |
| Database Query | < 100ms | pg_stat_statements |
| CIB Inquiry | < 2 minutes | Custom metrics |
| Report Generation | < 30 seconds | Application logs |
| File Upload (10MB) | < 10 seconds | Custom metrics |

### 7.2 Scalability Requirements

| Dimension | Target | Strategy |
|-----------|--------|----------|
| **Concurrent Users** | 1000+ | Horizontal Pod Autoscaling |
| **Requests/Second** | 500+ | Load balancing, caching |
| **Daily Transactions** | 100,000+ | Database partitioning |
| **Loan Applications/Day** | 10,000+ | Async processing |
| **Branches** | 10-1000+ | Multi-tenant scaling |
| **Banks** | 62+ | Schema-per-tenant |

**Kubernetes HPA Configuration:**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ulms-fineract-hpa
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
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### 7.3 Availability Requirements

| Metric | Target |
|--------|--------|
| System Uptime | 99.9% (8.76 hours downtime/year) |
| Recovery Time Objective (RTO) | < 4 hours |
| Recovery Point Objective (RPO) | < 1 hour |
| Planned Downtime | < 4 hours/month |
| Database Failover | < 30 seconds (automatic) |

**High Availability Strategy:**
- Active-Active Kubernetes cluster across availability zones
- PostgreSQL Patroni cluster with automatic failover
- Redis Cluster with 3+ nodes
- Kafka cluster with 3+ brokers
- Geographic disaster recovery site

### 7.4 Security Requirements

| Requirement | Implementation | Standard |
|-------------|---------------|----------|
| Authentication | OAuth 2.0 + MFA | ICT Guidelines V4.0 |
| Authorization | RBAC (11 roles) | Bangladesh Bank |
| Encryption at Rest | AES-256 | PCI DSS |
| Encryption in Transit | TLS 1.3 | OWASP |
| Audit Trail | Immutable logs (10 years) | BRPD 15/2024 |
| Session Management | 30 min timeout | ICT Guidelines V4.0 |
| Password Policy | Complexity + rotation | ICT Guidelines V4.0 |

### 7.5 Maintainability

| Aspect | Strategy |
|--------|----------|
| Code Quality | SonarQube analysis, >80% coverage |
| Documentation | OpenAPI 3.0 specs, ADRs |
| Versioning | Semantic versioning (SemVer) |
| Deployment | GitOps with ArgoCD |
| Rollback | Kubernetes rolling update, instant rollback |

---

## 8. Architecture Decision Records

### ADR-001: Apache Fineract as Core Platform

| Aspect | Details |
|--------|---------|
| **Decision** | Use Apache Fineract CE 1.10 as core banking platform |
| **Status** | Accepted |
| **Context** | Need enterprise-grade loan management with compliance |
| **Rationale** | - 93/100 score in platform evaluation<br>- Proven in 100+ financial institutions<br>- Active Apache Foundation community<br>- Pre-built loan lifecycle, accounting, scheduler |
| **Consequences** | - Must align with Fineract architecture<br>- Java/Spring ecosystem required<br>- Customization via extension points |

### ADR-002: Schema-Per-Tenant Multi-Tenancy

| Aspect | Details |
|--------|---------|
| **Decision** | Use schema-per-tenant (per bank) isolation |
| **Status** | Accepted |
| **Context** | Need to support 62+ banks with data isolation |
| **Rationale** | - Complete data isolation (regulatory requirement)<br>- Independent backup/restore per tenant<br>- Performance isolation |
| **Consequences** | - Higher resource usage than shared schema<br>- Schema management complexity<br>- Tenant provisioning automation needed |

### ADR-003: Kafka for Event Streaming

| Aspect | Details |
|--------|---------|
| **Decision** | Use Apache Kafka 3.6 for event-driven architecture |
| **Status** | Accepted |
| **Context** | Need reliable event streaming for compliance audit |
| **Rationale** | - Immutable event log (10+ year retention)<br>- High throughput (100K+ events/day)<br>- SAGA pattern support<br>- Integration with monitoring |
| **Consequences** | - Operational complexity<br>- Requires Kafka expertise<br>- Schema registry management |

### ADR-004: Kong API Gateway

| Aspect | Details |
|--------|---------|
| **Decision** | Use Kong 3.5 as API Gateway |
| **Status** | Accepted |
| **Context** | Need centralized API management with security |
| **Rationale** | - Native Kubernetes integration<br>- Plugin ecosystem (JWT, rate limiting, logging)<br>- High performance |
| **Consequences** | - License considerations for enterprise features<br>- Gateway as single point of control |

### ADR-005: Keycloak for Identity Management

| Aspect | Details |
|--------|---------|
| **Decision** | Use Keycloak 23 for IAM |
| **Status** | Accepted |
| **Context** | Need OAuth 2.0, MFA, LDAP federation |
| **Rationale** | - Open-source enterprise IAM<br>- LDAP/AD federation for bank integration<br>- MFA support (SMS OTP)<br>- Custom user attributes |
| **Consequences** | - Keycloak cluster management<br>- Custom theme for each bank |

---

## 9. Compliance Mapping

### 9.1 Regulatory Compliance Matrix

| Regulation | Requirement | ULMS Implementation | Status |
|------------|------------|---------------------|--------|
| **BRPD 15/2024** | 7-stage loan classification | BRPD Compliance Service with daily batch | ✅ Compliant |
| **BRPD 15/2024** | Provisioning calculation | Automatic calculation per classification | ✅ Compliant |
| **BRPD 15/2024** | CL-1 to CL-5 reports | Bangladesh Reports Service | ✅ Compliant |
| **BRPD 15/2024** | Interest suspense accounting | GL posting via Fineract Accounting | ✅ Compliant |
| **IFRS-9** | Expected Credit Loss (ECL) | Analytics Service with configurable models | ✅ Framework Ready |
| **IFRS-9** | 3-stage impairment model | Stage 1/2/3 calculation engine | ✅ Compliant |
| **Basel III** | RWA calculation | Automated reporting | ✅ Compliant |
| **Basel III** | Capital adequacy | Configurable reports | ✅ Compliant |
| **ICT V4.0** | Access control (RBAC) | Keycloak + custom RBAC | ✅ Compliant |
| **ICT V4.0** | Data encryption (AES-256) | PostgreSQL TDE + Vault | ✅ Compliant |
| **ICT V4.0** | TLS 1.3 | cert-manager + Kong | ✅ Compliant |
| **ICT V4.0** | Audit trail | Immutable logs (ELK) | ✅ Compliant |
| **ICT V4.0** | Session management | 30 min timeout | ✅ Compliant |
| **ICT V4.0** | MFA | Keycloak SMS OTP | ✅ Compliant |
| **CIB Requirements** | Real-time inquiry | CIB Service (WebFlux) | ✅ Compliant |
| **CIB Requirements** | Monthly batch reporting | Batch processing with SFTP | ✅ Compliant |

### 9.2 BRD Requirements Traceability

| BRD Section | Requirement | Architecture Component |
|-------------|-------------|----------------------|
| BRD 6.1 | Loan Origination | LOS Module + Fineract Loan Portfolio |
| BRD 6.2 | Credit Management | CIB Service + Credit Scoring Engine |
| BRD 6.3 | Approval Workflow | Workflow Service (Camunda BPMN) |
| BRD 6.4 | Disbursement | Disbursement Module + CBS Integration |
| BRD 6.5 | Loan Servicing | Fineract Loan Module + Scheduler |
| BRD 6.6 | Collections & NPA | BRPD Service + Collection Module |
| BRD 6.7 | Document Management | Document Service (MinIO) |
| BRD 7.1 | Performance (1000+ users) | Kubernetes HPA + Caching |
| BRD 7.3 | Security (OAuth/TLS) | Keycloak + Kong + TLS 1.3 |
| BRD 7.5 | Availability (99.9%) | HA Cluster + DR |
| BRD 8.1 | CBS Integration | Integration Gateway (Camel) |
| BRD 9.1 | BRPD Compliance | BRPD Compliance Service |
| BRD 11.1 | Regulatory Reports | Bangladesh Reports Service |

---

## 10. Appendices

### Appendix A: Glossary

| Term | Definition |
|------|------------|
| **ADR** | Architecture Decision Record |
| **BPMN** | Business Process Model and Notation |
| **BRPD** | Banking Regulation and Policy Department |
| **CBS** | Core Banking System |
| **CIB** | Credit Information Bureau |
| **CQRS** | Command Query Responsibility Segregation |
| **DPD** | Days Past Due |
| **ECL** | Expected Credit Loss |
| **HPA** | Horizontal Pod Autoscaler |
| **IAM** | Identity and Access Management |
| **JWT** | JSON Web Token |
| **LDAP** | Lightweight Directory Access Protocol |
| **LOS** | Loan Origination System |
| **mTLS** | Mutual TLS (Certificate-based authentication) |
| **NPA** | Non-Performing Asset |
| **RBAC** | Role-Based Access Control |
| **RPO** | Recovery Point Objective |
| **RTO** | Recovery Time Objective |
| **SAGA** | Long-running distributed transaction pattern |
| **SMA** | Special Mention Account |
| **TDE** | Transparent Data Encryption |

### Appendix B: References

1. Apache Fineract Documentation - https://fineract.apache.org/
2. Bangladesh Bank BRPD Circular 15/2024
3. Bangladesh Bank ICT Security Guidelines V4.0
4. IFRS-9 Financial Instruments Implementation Guide
5. Basel III Implementation Guidelines for Bangladesh
6. CIB Online Integration Manual
7. ULMS BRD v1.0 (January 26, 2026)
8. ULMS URD v2.0 (February 3, 2026)
9. ULMS SRS v2.0 (February 3, 2026)
10. ULMS Technology Stack v2.0 (February 3, 2026)

### Appendix C: Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Lead Developer | | | |
| Solutions Architect | | | |
| CTO | | | |
| Project Sponsor | | | |

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

*This System Architecture Document provides the high-level technical foundation for ULMS v2.0 implementation on Apache Fineract Community Edition, ensuring full compliance with Bangladesh Bank regulations and enterprise banking requirements.*

# ULMS Deployment Architecture Diagram
## Visual Reference Guide for System Deployment Topology

---

## Document Control

| Attribute | Details |
|-----------|---------|
| **Document ID** | ARCH-1.7.2 |
| **Document Title** | ULMS Deployment Architecture Diagram v1.0 |
| **Version** | 1.0 |
| **Status** | Draft |
| **Date** | 2026-02-05 |
| **Project** | Unified Loan Management System (ULMS) v2.0 |
| **Client** | Bangladesh Banking Sector (62+ Scheduled Commercial Banks) |
| **Author** | ULMS Architecture Team |
| **Reviewers** | Solution Architect, DevOps Lead, Security Architect |
| **Approver** | Chief Technology Officer |
| **Classification** | Internal - Technical Documentation |
| **Related Documents** | [ARCH]_Kubernetes_Cluster_Architecture_v1.0.md (ARCH-1.7.1)<br>[ARCH]_ULMS_System_Architecture_Document_v1.0.md (ARCH-1.1.1)<br>[ARCH]_Microservices_Architecture_Blueprint_v1.0.md (ARCH-1.1.2)<br>[ARCH]_Security_Architecture_Document_v1.0.md (ARCH-1.4.1) |

### Document Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-05 | Architecture Team | Initial version with 9 comprehensive deployment diagrams |

### Document Purpose

This document provides **comprehensive visual and textual descriptions** of the ULMS deployment architecture through **9 detailed architectural diagrams**. It serves as a visual companion to the Kubernetes Cluster Architecture document (ARCH-1.7.1), providing:

- **Visual topology representations** of the complete system deployment
- **Component placement and relationships** across infrastructure layers
- **Network architecture and security boundaries** with traffic flows
- **Data flows** for critical business use cases
- **Security architecture layers** and authentication flows
- **CI/CD pipeline** and deployment strategies
- **Multi-tenant isolation** mechanisms at all levels
- **External system integrations** with protocols and security
- **Disaster recovery** topology and failover processes

### Target Audience

- **DevOps Engineers**: Infrastructure deployment and operations
- **Solution Architects**: System design validation and reviews
- **Security Team**: Security architecture verification
- **Development Teams**: Understanding deployment context for applications
- **Operations Team**: Production support and troubleshooting
- **Stakeholders**: High-level deployment topology overview

### Document Scope

**In Scope**:
- 9 comprehensive deployment architecture diagrams (textual descriptions)
- Component catalog with deployment specifications
- Network zones and security boundaries
- Deployment environment configurations
- Scalability and high availability design patterns
- Technology mapping and deployment matrix
- Diagram creation recommendations and tooling guidance

**Out of Scope**:
- Actual diagram files (Draw.io, Lucidchart, Visio) - to be created in implementation phase
- Low-level Kubernetes manifest details (covered in ARCH-1.7.1)
- Application-level architecture (covered in ARCH-1.1.1, ARCH-1.1.2)
- Detailed API specifications (covered in API Gateway Design document)
- Security implementation details (covered in Security Architecture document)

---

## Table of Contents

1. [Document Control](#document-control)
2. [Executive Summary](#executive-summary)
3. [Architecture Overview](#architecture-overview)
4. [Deployment Architecture Diagrams](#deployment-architecture-diagrams)
   - 4.1. [DAD-01: High-Level System Deployment View](#dad-01-high-level-system-deployment-view)
   - 4.2. [DAD-02: Kubernetes Cluster Topology](#dad-02-kubernetes-cluster-topology)
   - 4.3. [DAD-03: Network Architecture Diagram](#dad-03-network-architecture-diagram)
   - 4.4. [DAD-04: Data Flow Diagram](#dad-04-data-flow-diagram)
   - 4.5. [DAD-05: Security Architecture View](#dad-05-security-architecture-view)
   - 4.6. [DAD-06: CI/CD Pipeline Flow](#dad-06-cicd-pipeline-flow)
   - 4.7. [DAD-07: Multi-Tenant Isolation View](#dad-07-multi-tenant-isolation-view)
   - 4.8. [DAD-08: Integration Architecture](#dad-08-integration-architecture)
   - 4.9. [DAD-09: Disaster Recovery Architecture](#dad-09-disaster-recovery-architecture)
5. [Component Descriptions](#component-descriptions)
6. [Network Zones & Security Boundaries](#network-zones--security-boundaries)
7. [Deployment Environments](#deployment-environments)
8. [Scalability & High Availability Design](#scalability--high-availability-design)
9. [Technology Mapping](#technology-mapping)
10. [Diagram Creation Recommendations](#diagram-creation-recommendations)
11. [References](#references)
12. [Appendices](#appendices)

---

## 1. Executive Summary

### 1.1 Purpose

The **ULMS Deployment Architecture Diagram Document** provides comprehensive visual and textual representations of how the Unified Loan Management System (ULMS) v2.0 is deployed across cloud infrastructure. This document serves as the **definitive visual reference** for understanding:

- **System topology** from end-users to data persistence
- **Component placement** across availability zones and namespaces
- **Network segmentation** and security boundaries
- **Data flows** for critical banking operations
- **Integration patterns** with external systems
- **Disaster recovery** mechanisms and failover procedures

This document **complements** the Kubernetes Cluster Architecture document (ARCH-1.7.1) by providing visual context and high-level topology views, enabling faster comprehension of the deployment architecture for both technical and non-technical stakeholders.

### 1.2 ULMS v2.0 Deployment Overview

**System**: Multi-tenant SaaS loan management platform for Bangladesh banking sector
**Foundation**: Apache Fineract Community Edition 1.10 + 8 custom Spring Boot microservices
**Orchestration**: Kubernetes 1.28 with 3 namespaces (production, staging, monitoring)
**Deployment Model**: Multi-AZ (3 availability zones) for 99.9% uptime SLA
**Scale**: 1000+ concurrent users, 500+ RPS, <500ms response time (p95)
**Tenants**: 62+ scheduled commercial banks with data isolation
**Compliance**: Bangladesh Bank ICT Guidelines V4.0, BRPD 15/2024, IFRS-9

### 1.3 Deployment Architecture Highlights

| Aspect | Specification |
|--------|--------------|
| **Cloud Provider** | AWS (Primary: Mumbai region, DR: Singapore region) |
| **Kubernetes Version** | 1.28 |
| **Worker Nodes (Production)** | 18 nodes across 3 AZs (6 nodes per AZ)<br>Instance type: t3.2xlarge (8 vCPU, 32 GB RAM) |
| **Namespaces** | 3 (ulms-production, ulms-staging, ulms-monitoring) |
| **Application Components** | Apache Fineract (3-20 replicas) + 8 microservices (2-5 replicas each) |
| **Data Components** | PostgreSQL 16.1 (1P+2S Patroni HA), Redis 7.2 (6-node cluster)<br>Kafka 3.6 (3 brokers), MinIO (4 nodes), Elasticsearch 7.17 (3 nodes) |
| **Security Components** | Kong 3.5 (3-5 replicas), Keycloak 23 (2-3 replicas), Vault 1.15 (3-node cluster) |
| **Monitoring Stack** | Prometheus + Grafana + Alertmanager<br>ELK Stack (Elasticsearch, Logstash, Kibana)<br>Jaeger for distributed tracing |
| **High Availability** | Multi-AZ deployment, pod anti-affinity, auto-scaling<br>Database replication with <30s failover<br>Velero backups (daily full, hourly incremental) |
| **Disaster Recovery** | Asynchronous replication to Singapore DR site<br>RPO: 30 seconds, RTO: 4 hours |
| **Network Segmentation** | 6 network zones (Internet, DMZ, Application, Data, Integration, Management)<br>Security groups and NetworkPolicies for isolation |
| **External Integrations** | Bangladesh Bank CIB (VPN+mTLS), NID Wing (REST/TLS)<br>CBS (SOAP/HTTPS), Payment Gateways (REST/OAuth 2.0)<br>SFTP for regulatory reporting |

### 1.4 Document Organization

This document presents **9 comprehensive deployment architecture diagrams**, each serving a specific purpose:

1. **DAD-01**: High-level end-to-end system deployment topology
2. **DAD-02**: Internal Kubernetes cluster organization and namespace breakdown
3. **DAD-03**: Network architecture with 6 security zones and traffic flows
4. **DAD-04**: Data flows for 4 critical banking use cases
5. **DAD-05**: Security architecture layers and authentication flows
6. **DAD-06**: CI/CD pipeline with GitOps and deployment strategies
7. **DAD-07**: Multi-tenant isolation mechanisms at infrastructure and data levels
8. **DAD-08**: External system integrations with protocols and security
9. **DAD-09**: Disaster recovery topology with failover procedures

Each diagram description includes:
- **Purpose**: What the diagram illustrates
- **Components**: All elements to be shown in the diagram
- **Relationships**: How components connect and interact
- **Annotations**: Labels, protocols, ports, replica counts, security controls
- **Recommended Tools**: Software for creating the diagram
- **Implementation Notes**: Technical details and considerations

### 1.5 Alignment with Project Requirements

This deployment architecture **100% aligns** with:

- **RFP Requirements**: Multi-tenant SaaS deployment, cloud-native architecture, high availability
- **BRD Section 7.1**: Performance (1000+ concurrent users, 500+ RPS, <500ms p95 response time)
- **BRD Section 7.5**: Availability (99.9% uptime SLA, multi-AZ deployment, disaster recovery)
- **BRD Section 7.3**: Security (TLS 1.3, OAuth 2.0, encryption at rest and in transit)
- **SRS Section 2**: Auto-scaling, horizontal pod autoscaling, cluster autoscaling
- **SRS Section 4**: Resource specifications aligned with performance requirements
- **Technology Stack v2.0**: Exact technology versions (Kubernetes 1.28, PostgreSQL 16.1, etc.)
- **ICT Guidelines V4.0**: RBAC, audit logging, encryption, network segmentation
- **BRPD 15/2024**: Compliance service deployment, regulatory reporting via SFTP

---

## 2. Architecture Overview

### 2.1 Deployment Model

The ULMS v2.0 deployment follows a **cloud-native, containerized microservices architecture** orchestrated by Kubernetes. The deployment model emphasizes:

- **High Availability**: Multi-AZ deployment across 3 availability zones
- **Scalability**: Horizontal pod autoscaling and cluster autoscaling
- **Security**: Defense-in-depth with 6 network zones and multiple security layers
- **Observability**: Comprehensive monitoring, logging, and tracing
- **Compliance**: Alignment with Bangladesh Bank regulatory requirements
- **Multi-tenancy**: Data isolation for 62+ banks at database schema level

### 2.2 Deployment Topology

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ULMS v2.0 DEPLOYMENT TOPOLOGY                       │
└─────────────────────────────────────────────────────────────────────────────┘

Internet
   │
   ├─── Web Clients (React 18.2.0)
   ├─── Mobile Clients (React Native 0.73.2)
   └─── Partner APIs
        │
        ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ EDGE LAYER (DMZ)                                                             │
│ - AWS ALB (Application Load Balancer)                                       │
│ - AWS WAF (Web Application Firewall)                                        │
│ - AWS Shield (DDoS Protection)                                              │
│ - NGINX Ingress Controller (TLS 1.3 termination)                           │
└──────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ API GATEWAY LAYER                                                            │
│ - Kong Gateway 3.5 (3-5 replicas)                                          │
│   * Rate Limiting, Authentication, Authorization                           │
│   * Request/Response Transformation                                         │
│   * Circuit Breaking, Retry Logic                                           │
└──────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ APPLICATION LAYER (Kubernetes ulms-production namespace)                    │
│                                                                              │
│ Core Application:                                                           │
│ - Apache Fineract 1.10 (3-20 replicas, HPA enabled)                       │
│                                                                              │
│ Custom Microservices (8):                                                   │
│ - CIB Service (2-5 replicas) - Bangladesh Bank Credit Bureau              │
│ - NID/e-KYC Service (2-5 replicas) - National ID Verification             │
│ - Workflow Service (2-4 replicas) - Camunda BPMN Engine                   │
│ - Document Service (2-5 replicas) - MinIO Object Storage                  │
│ - BRPD Compliance Service (2-4 replicas) - Loan Classification            │
│ - Notification Service (3-6 replicas) - SMS/Email via Kafka               │
│ - Analytics Service (2-4 replicas) - Credit Scoring, IFRS-9 ECL           │
│ - Integration Gateway (2-4 replicas) - Apache Camel ESB                   │
└──────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ DATA LAYER                                                                   │
│                                                                              │
│ Primary Database:                                                           │
│ - PostgreSQL 16.1 with Patroni HA (1 Primary + 2 Standby, auto-failover)  │
│                                                                              │
│ Caching:                                                                     │
│ - Redis 7.2 Cluster (6 nodes: 3 masters + 3 replicas)                     │
│                                                                              │
│ Messaging:                                                                   │
│ - Apache Kafka 3.6 (3 brokers, replication factor 3)                      │
│ - ZooKeeper 3.8 Ensemble (3 nodes)                                         │
│                                                                              │
│ Object Storage:                                                              │
│ - MinIO Distributed (4 nodes, erasure coding 4+2)                         │
│                                                                              │
│ Search & Analytics:                                                          │
│ - Elasticsearch 7.17 Cluster (3 nodes)                                     │
└──────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ SECURITY LAYER                                                               │
│ - Keycloak 23 (2-3 replicas) - OAuth 2.0 / OIDC                           │
│ - HashiCorp Vault 1.15 (3-node cluster) - Secrets Management              │
│ - AWS KMS - Encryption Key Management                                      │
└──────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ OBSERVABILITY LAYER (Kubernetes ulms-monitoring namespace)                  │
│                                                                              │
│ Metrics:                                                                     │
│ - Prometheus (2 replicas) + Alertmanager                                   │
│ - Grafana (2 replicas) - 6 dashboards                                      │
│                                                                              │
│ Logging:                                                                     │
│ - Elasticsearch 7.17 (3 nodes, 5 TB storage)                               │
│ - Logstash (3 replicas) - Log aggregation                                  │
│ - Kibana (2 replicas) - Log visualization                                  │
│ - Filebeat (DaemonSet) - Log collection from all nodes                    │
│                                                                              │
│ Tracing:                                                                     │
│ - Jaeger (All-in-One + Collector + Query)                                 │
└──────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ EXTERNAL INTEGRATIONS                                                        │
│ - Bangladesh Bank CIB (VPN + mTLS, REST API)                               │
│ - NID Wing (REST/TLS with API Key)                                         │
│ - Core Banking Systems (SOAP/HTTPS with Basic Auth)                        │
│ - Payment Gateways (bKash, Nagad, Rocket - REST/OAuth 2.0)                │
│ - Bangladesh Bank SFTP (Monthly regulatory reports, GPG encrypted)         │
│ - SMS Gateway (HTTPS POST with API Key)                                    │
│ - Email (AWS SES with IAM role)                                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 High Availability Strategy

**Multi-AZ Deployment**:
- Kubernetes cluster spans 3 availability zones (us-east-1a, us-east-1b, us-east-1c or equivalent)
- 18 worker nodes distributed evenly (6 nodes per AZ)
- Pod anti-affinity rules ensure replicas are spread across AZs
- Zone-aware storage with EBS volumes and multi-AZ EFS

**Application HA**:
- Minimum 3 replicas for critical components (Fineract, Kong, Keycloak)
- Horizontal Pod Autoscaling (HPA) based on CPU, memory, and custom metrics
- PodDisruptionBudgets ensure minimum availability during node maintenance
- Rolling update strategy with zero downtime deployments

**Data HA**:
- PostgreSQL: 1 primary + 2 standby with Patroni automatic failover (<30 seconds)
- Redis: Cluster mode with 3 masters + 3 replicas, automatic failover
- Kafka: 3 brokers with replication factor 3, min in-sync replicas 2
- MinIO: Distributed erasure coding 4+2 (tolerates 2 drive failures)
- Elasticsearch: 3-node cluster with 2 replicas per index

**Infrastructure HA**:
- Load balancers: AWS ALB with multi-AZ enabled
- Ingress: NGINX Ingress Controller with 3 replicas across AZs
- DNS: Route 53 with health checks and automatic failover
- Storage: EBS gp3 volumes with snapshot backups

### 2.4 Disaster Recovery

**Primary Site**: AWS Mumbai region (ap-south-1)
**DR Site**: AWS Singapore region (ap-southeast-1)

**Recovery Objectives**:
- **RPO (Recovery Point Objective)**: 30 seconds (asynchronous replication lag)
- **RTO (Recovery Time Objective)**: 4 hours (manual failover process)

**Replication Strategy**:
- PostgreSQL: Asynchronous streaming replication to DR site
- Redis: Active-passive replication with Redis Sentinel
- Kafka: MirrorMaker 2 for topic mirroring to DR cluster
- MinIO: Site-to-site bucket replication
- Application state: Velero cluster backups replicated to DR region S3

**Failover Process**:
1. Detect primary site failure (automated monitoring alerts)
2. Validate DR site readiness (health checks on all components)
3. Update DNS to point to DR site (Route 53 failover policy)
4. Promote PostgreSQL standby to primary
5. Activate DR Kubernetes cluster applications
6. Resume business operations with <4 hour downtime

### 2.5 Relationship to Other Architecture Documents

This Deployment Architecture Diagram document **complements and references**:

1. **[ARCH]_Kubernetes_Cluster_Architecture_v1.0.md** (ARCH-1.7.1)
   - Detailed Kubernetes YAML manifests
   - Namespace resource quotas and limits
   - Complete HPA, Service, Ingress configurations
   - Operational procedures and troubleshooting

2. **[ARCH]_ULMS_System_Architecture_Document_v1.0.md** (ARCH-1.1.1)
   - High-level system architecture and design principles
   - Layered architecture (Presentation, API, Application, Data)
   - Cross-cutting concerns (security, monitoring, caching)

3. **[ARCH]_Microservices_Architecture_Blueprint_v1.0.md** (ARCH-1.1.2)
   - Detailed specifications for 8 custom microservices
   - Service responsibilities, APIs, data models
   - Inter-service communication patterns

4. **[ARCH]_Security_Architecture_Document_v1.0.md** (ARCH-1.4.1)
   - Defense-in-depth security layers
   - Authentication and authorization flows
   - Encryption standards and key management

5. **[ARCH]_Multi_Tenant_Architecture_Design_v1.0.md** (ARCH-1.1.3)
   - Schema-per-tenant data isolation strategy
   - Tenant onboarding and provisioning automation
   - Tenant context resolution and propagation

6. **[ARCH]_API_Gateway_Design_Kong_v1.0.md** (ARCH-1.2.2)
   - Kong Gateway plugin configurations
   - Rate limiting, authentication, CORS policies
   - API versioning and routing strategies

---

## 3. Deployment Architecture Diagrams

This section provides **detailed textual descriptions** for 9 comprehensive deployment architecture diagrams. Each description is designed to enable a DevOps engineer, solution architect, or diagram specialist to **create accurate visual diagrams** using tools like Draw.io, Lucidchart, PlantUML, or Microsoft Visio.

Each diagram description includes:
- **Purpose**: What the diagram illustrates
- **Diagram Type**: Topology, flow, layered, etc.
- **Components to Show**: All elements to be included
- **Relationships**: How components connect
- **Annotations**: Labels, protocols, ports, metrics
- **Recommended Tools**: Best software for creating the diagram
- **Color Coding**: Visual distinction between layers/zones
- **Layout Suggestions**: Optimal arrangement for clarity

---

### 4.1 DAD-01: High-Level System Deployment View

#### Purpose

**DAD-01** provides a **comprehensive end-to-end view** of the ULMS v2.0 deployment topology, showing all major system components from external clients through edge infrastructure, API gateway, application tier, data tier, security components, monitoring stack, and external integrations. This is the **primary reference diagram** for understanding the complete system deployment architecture.

**Target Audience**: Executive stakeholders, solution architects, enterprise architects, security auditors

#### Diagram Type

- **Layered topology diagram** with 7 horizontal layers
- **Portrait or landscape orientation** (landscape recommended for readability)
- **Size**: Large format (A2 or 24" x 36" for print, scalable SVG for digital)

#### Components to Show

**Layer 1: Client Tier (Top)**
- **Web Clients**:
  - Icon: Web browser or laptop
  - Label: "Web Application (React 18.2.0)"
  - Note: "Browser-based access for bank employees and administrators"
- **Mobile Clients**:
  - Icon: Smartphone
  - Label: "Mobile App (React Native 0.73.2)"
  - Note: "iOS and Android native apps for field officers"
- **Partner APIs**:
  - Icon: API/integration symbol
  - Label: "Partner System APIs"
  - Note: "Third-party integrations via REST APIs"

**Layer 2: Edge Tier (DMZ)**
- **AWS Application Load Balancer (ALB)**:
  - Icon: Load balancer symbol
  - Label: "AWS ALB (Multi-AZ)"
  - Protocol: HTTPS (TLS 1.3)
  - Port: 443
  - Note: "Layer 7 load balancing with SSL termination"
- **AWS WAF**:
  - Icon: Firewall/shield
  - Label: "AWS WAF"
  - Note: "SQL injection, XSS, rate-based rules"
- **AWS Shield**:
  - Icon: DDoS protection shield
  - Label: "AWS Shield Standard"
  - Note: "DDoS protection (automatic)"
- **NGINX Ingress Controller**:
  - Icon: NGINX logo
  - Label: "NGINX Ingress (3 replicas)"
  - Namespace: kube-system
  - Note: "Kubernetes Ingress with cert-manager for TLS"

**Layer 3: API Gateway Tier**
- **Kong API Gateway**:
  - Icon: Kong logo
  - Label: "Kong Gateway 3.5"
  - Replicas: 3-5 (HPA enabled)
  - Namespace: ulms-production
  - CPU: 1000m request / 2000m limit
  - Memory: 2Gi request / 4Gi limit
  - Ports: 8000 (proxy), 8443 (proxy SSL), 8001 (admin)
  - Plugins: rate-limiting, jwt, cors, oauth2, acl, request-transformer
  - Note: "Centralized API management, authentication, rate limiting"
- **Keycloak (OAuth Provider)**:
  - Icon: Keycloak logo
  - Label: "Keycloak 23 (2-3 replicas)"
  - Protocol: HTTPS
  - Port: 8443
  - Note: "OAuth 2.0 / OIDC authentication provider"
  - Connection: Kong → Keycloak for JWT validation

**Layer 4: Application Tier (Kubernetes ulms-production namespace)**
- **Apache Fineract**:
  - Icon: Fineract logo or application server
  - Label: "Apache Fineract 1.10"
  - Replicas: 3-20 (HPA: 70% CPU, 80% memory)
  - CPU: 2000m request / 4000m limit
  - Memory: 4Gi request / 8Gi limit
  - Port: 8080 (HTTP)
  - Note: "Core loan management platform (multi-tenant)"
- **CIB Service**:
  - Icon: Microservice hexagon
  - Label: "CIB Service (2-5 replicas)"
  - Port: 8081
  - Note: "Bangladesh Bank Credit Bureau integration (mTLS)"
- **NID/e-KYC Service**:
  - Icon: Microservice hexagon
  - Label: "NID Service (2-5 replicas)"
  - Port: 8082
  - Note: "National ID verification service"
- **Workflow Service**:
  - Icon: Microservice hexagon with workflow symbol
  - Label: "Workflow Service (2-4 replicas)"
  - Port: 8083
  - Note: "Camunda BPMN engine for loan approval workflows"
- **Document Service**:
  - Icon: Microservice hexagon with document symbol
  - Label: "Document Service (2-5 replicas)"
  - Port: 8084
  - Note: "Document management with MinIO object storage"
- **BRPD Compliance Service**:
  - Icon: Microservice hexagon with compliance symbol
  - Label: "BRPD Service (2-4 replicas)"
  - Port: 8085
  - Note: "Loan classification, provisioning, regulatory compliance"
- **Notification Service**:
  - Icon: Microservice hexagon with notification bell
  - Label: "Notification Service (3-6 replicas)"
  - Port: 8086
  - Note: "SMS/Email notifications via Kafka event-driven"
- **Analytics Service**:
  - Icon: Microservice hexagon with chart symbol
  - Label: "Analytics Service (2-4 replicas)"
  - Port: 8087
  - Note: "Credit scoring, IFRS-9 ECL, business intelligence"
- **Integration Gateway**:
  - Icon: Microservice hexagon with integration symbol
  - Label: "Integration Gateway (2-4 replicas)"
  - Port: 8088
  - Note: "Apache Camel ESB for external integrations"

**Layer 5: Data Tier**
- **PostgreSQL with Patroni**:
  - Icon: PostgreSQL elephant logo
  - Label: "PostgreSQL 16.1 + Patroni HA"
  - Topology: 1 Primary + 2 Standby (shown with arrows)
  - CPU: 2000m request / 4000m limit per instance
  - Memory: 8Gi request / 16Gi limit per instance
  - Storage: 500Gi SSD per instance (gp3-encrypted)
  - Port: 5432
  - Note: "Automatic failover <30s, schema-per-tenant multi-tenancy"
- **Redis Cluster**:
  - Icon: Redis logo
  - Label: "Redis 7.2 Cluster"
  - Topology: 6 nodes (3 masters + 3 replicas, shown in cluster arrangement)
  - CPU: 500m request / 1000m limit per node
  - Memory: 2Gi request / 4Gi limit per node
  - Port: 6379
  - Note: "Session cache, query result cache, distributed cache"
- **Apache Kafka**:
  - Icon: Kafka logo
  - Label: "Kafka 3.6 (3 brokers)"
  - CPU: 1000m request / 2000m limit per broker
  - Memory: 4Gi request / 8Gi limit per broker
  - Storage: 200Gi per broker
  - Port: 9092
  - Note: "Event streaming, async communication, audit trail"
- **ZooKeeper Ensemble**:
  - Icon: ZooKeeper logo
  - Label: "ZooKeeper 3.8 (3 nodes)"
  - Port: 2181
  - Note: "Coordination service for Kafka"
- **MinIO Distributed**:
  - Icon: MinIO logo
  - Label: "MinIO (4 nodes, erasure coding 4+2)"
  - CPU: 500m request / 1000m limit per node
  - Memory: 2Gi request / 4Gi limit per node
  - Storage: 1Ti per node
  - Port: 9000
  - Note: "S3-compatible object storage for documents"
- **Elasticsearch Cluster**:
  - Icon: Elasticsearch logo
  - Label: "Elasticsearch 7.17 (3 nodes)"
  - CPU: 1000m request / 2000m limit per node
  - Memory: 4Gi request / 8Gi limit per node
  - Storage: 200Gi per node
  - Port: 9200
  - Note: "Log storage and search (ulms-monitoring namespace)"

**Layer 6: Security & Secrets Management**
- **HashiCorp Vault**:
  - Icon: Vault logo
  - Label: "Vault 1.15 (3-node cluster)"
  - Port: 8200
  - Note: "Dynamic secrets, database credentials, API keys"
- **AWS KMS**:
  - Icon: Key symbol
  - Label: "AWS KMS"
  - Note: "Encryption key management for EBS volumes"
- **cert-manager**:
  - Icon: Certificate symbol
  - Label: "cert-manager"
  - Namespace: kube-system
  - Note: "Automatic TLS certificate provisioning (Let's Encrypt)"

**Layer 7: Observability & Monitoring (Kubernetes ulms-monitoring namespace)**
- **Prometheus**:
  - Icon: Prometheus logo
  - Label: "Prometheus (2 replicas)"
  - Storage: 100Gi per replica
  - Port: 9090
  - Note: "Metrics collection and storage (15-day retention)"
- **Grafana**:
  - Icon: Grafana logo
  - Label: "Grafana (2 replicas)"
  - Port: 3000
  - Note: "Metrics visualization, 6 dashboards"
- **Alertmanager**:
  - Icon: Alert bell
  - Label: "Alertmanager (2 replicas)"
  - Port: 9093
  - Note: "Alert routing to Slack, email, PagerDuty"
- **Logstash**:
  - Icon: Logstash logo
  - Label: "Logstash (3 replicas)"
  - Port: 5044
  - Note: "Log processing and aggregation"
- **Kibana**:
  - Icon: Kibana logo
  - Label: "Kibana (2 replicas)"
  - Port: 5601
  - Note: "Log visualization and search"
- **Jaeger**:
  - Icon: Jaeger logo
  - Label: "Jaeger (All-in-One + Collector + Query)"
  - Port: 16686 (UI), 14250 (collector)
  - Note: "Distributed tracing"
- **Filebeat DaemonSet**:
  - Icon: Filebeat logo
  - Label: "Filebeat (DaemonSet on all nodes)"
  - Note: "Log collection from all pods and nodes"

**External Integrations (Right side, connected to Integration Gateway)**
- **Bangladesh Bank CIB**:
  - Icon: Bank building
  - Label: "BB CIB API"
  - Protocol: REST over VPN with mTLS
  - Connection: VPN tunnel + client certificate
  - Note: "Real-time credit inquiry, monthly SFTP batch"
- **NID Wing (e-KYC)**:
  - Icon: Government building
  - Label: "NID e-KYC API"
  - Protocol: REST/TLS
  - Authentication: API Key
  - Note: "National ID verification, 30s timeout"
- **Core Banking Systems (CBS)**:
  - Icon: Bank server
  - Label: "CBS (SOAP/XML)"
  - Protocol: SOAP over HTTPS
  - Authentication: Basic Auth
  - Note: "Account balance, transaction posting"
- **Payment Gateways**:
  - Icon: Payment symbol
  - Label: "bKash, Nagad, Rocket"
  - Protocol: REST/HTTPS
  - Authentication: OAuth 2.0
  - Note: "Loan disbursement, collection"
- **Bangladesh Bank SFTP**:
  - Icon: SFTP server
  - Label: "BB SFTP Server"
  - Protocol: SFTP with SSH key auth
  - Encryption: GPG
  - Note: "Monthly regulatory reports (CL-1 to CL-5)"
- **SMS Gateway**:
  - Icon: SMS symbol
  - Label: "SMS Provider API"
  - Protocol: HTTPS POST
  - Authentication: API Key
  - Rate Limit: 100 SMS/minute
- **Email (AWS SES)**:
  - Icon: Email envelope
  - Label: "AWS SES"
  - Protocol: AWS SDK
  - Authentication: IAM Role
  - Rate Limit: 50 emails/second

#### Relationships and Connections

**Traffic Flows** (shown with arrows):
1. **User Request Flow**:
   - Web/Mobile Clients → ALB (HTTPS) → WAF → NGINX Ingress → Kong Gateway → Microservices → PostgreSQL/Redis
2. **Authentication Flow**:
   - Client → ALB → Kong → Keycloak (OAuth 2.0 token) → Kong validates JWT → Microservice
3. **Inter-Service Communication**:
   - Fineract → PostgreSQL (read/write)
   - All Microservices → PostgreSQL (tenant-specific schemas)
   - All Microservices → Redis (caching)
   - Microservices → Kafka (produce events)
   - Notification Service → Kafka (consume events) → SMS/Email
4. **External Integration Flow**:
   - Integration Gateway → VPN → Bangladesh Bank CIB (mTLS)
   - Integration Gateway → NID API (REST/TLS)
   - Integration Gateway → CBS (SOAP/HTTPS)
   - Integration Gateway → Payment Gateways (REST/OAuth)
5. **Monitoring Flow**:
   - All Pods → Prometheus (metrics scraping)
   - All Pods → Filebeat → Logstash → Elasticsearch → Kibana (logs)
   - All Pods → Jaeger Collector → Jaeger Query (traces)
6. **Secrets Flow**:
   - All Pods → Vault CSI Driver → HashiCorp Vault (dynamic credentials)

#### Annotations and Labels

- **Protocol labels** on all connections (HTTPS, HTTP, TCP, mTLS, VPN)
- **Port numbers** for all services (e.g., Kong 8000, PostgreSQL 5432)
- **Replica counts** for scalable components (e.g., Fineract 3-20, Kong 3-5)
- **Resource specs** for critical components (e.g., Fineract: 2-4 CPU, 4-8Gi RAM)
- **Namespace labels** (ulms-production, ulms-staging, ulms-monitoring, kube-system)
- **Security boundaries** (dashed lines or colored zones):
  - Internet Zone (public)
  - DMZ Zone (edge)
  - Application Zone (microservices)
  - Data Zone (databases)
  - Integration Zone (VPN gateway)
  - Management Zone (monitoring)
- **High Availability indicators** (e.g., "HA" badge on PostgreSQL, Redis, Kafka)
- **Auto-scaling indicators** (e.g., "HPA" badge on Fineract, microservices)

#### Color Coding

- **Client Tier**: Light blue (#E3F2FD)
- **Edge Tier (DMZ)**: Orange (#FFE0B2)
- **API Gateway**: Yellow (#FFF9C4)
- **Application Tier**: Green (#C8E6C9)
- **Data Tier**: Dark Blue (#BBDEFB)
- **Security Components**: Red (#FFCDD2)
- **Monitoring Stack**: Purple (#E1BEE7)
- **External Systems**: Gray (#EEEEEE)
- **Connections**: Black arrows for data flow, red dashed for security boundaries

#### Layout Suggestions

- **Vertical layered layout** (top to bottom): Clients → Edge → Gateway → Application → Data → Security → Monitoring
- **Group components by namespace**: Use visual containers/boxes to group ulms-production, ulms-monitoring components
- **Place external integrations** on the right side, connected to Integration Gateway
- **Use swim lanes** for different security zones (optional)
- **Legend**: Include a legend explaining icons, colors, and symbols

#### Recommended Tools

- **Draw.io (diagrams.net)**: Free, web-based, supports AWS icons, Kubernetes icons, export to PNG/SVG
- **Lucidchart**: Professional diagramming tool, collaborative, templates for cloud architecture
- **Microsoft Visio**: Enterprise standard, Azure/AWS stencils available
- **Cloudcraft**: Specialized for AWS architecture diagrams (3D visualization)
- **PlantUML**: Code-based diagrams (good for version control, less visual polish)

#### Implementation Notes

1. **Use official icon libraries**:
   - Kubernetes official icons: https://github.com/kubernetes/community/tree/master/icons
   - AWS Architecture Icons: https://aws.amazon.com/architecture/icons/
   - Technology logos: From official websites (PostgreSQL, Redis, Kafka, Kong, etc.)

2. **Ensure readability**:
   - Font size minimum 10pt for labels
   - High contrast for text on colored backgrounds
   - Arrows should be clearly directional with arrowheads
   - Avoid overlapping components

3. **Version control**:
   - Save diagram source files in Git repository
   - Export to PNG (for documents) and SVG (for scalability)
   - Tag diagrams with version numbers matching this document

4. **Validation**:
   - Review with DevOps team for accuracy
   - Verify replica counts match Kubernetes manifests
   - Validate protocols and ports with actual deployment

---

### 4.2 DAD-02: Kubernetes Cluster Topology

#### Purpose

**DAD-02** provides a **detailed internal view** of the Kubernetes 1.28 cluster organization, showing the control plane, worker nodes distributed across 3 availability zones, namespace breakdown with all resources, and cluster-level components. This diagram is essential for understanding the Kubernetes-specific deployment architecture.

**Target Audience**: DevOps engineers, Kubernetes administrators, SREs, platform engineers

#### Diagram Type

- **Topology diagram** with control plane and data plane separation
- **Multi-zone layout** showing 3 availability zones
- **Namespace-based grouping** for logical organization
- **Landscape orientation** recommended

#### Components to Show

**Kubernetes Control Plane** (Managed by AWS EKS or equivalent)
- **API Server**:
  - Icon: Kubernetes logo
  - Label: "kube-apiserver (3 replicas across AZs)"
  - Note: "RESTful API for all cluster operations"
- **etcd**:
  - Icon: etcd logo
  - Label: "etcd (3-node cluster)"
  - Note: "Distributed key-value store for cluster state"
- **Scheduler**:
  - Icon: Scheduler symbol
  - Label: "kube-scheduler"
  - Note: "Pod placement decisions based on resource requirements"
- **Controller Manager**:
  - Icon: Controller symbol
  - Label: "kube-controller-manager"
  - Note: "Replication, endpoints, service accounts"
- **Cloud Controller Manager**:
  - Icon: Cloud symbol
  - Label: "cloud-controller-manager (AWS)"
  - Note: "AWS-specific controllers (Load Balancers, EBS)"

**Worker Nodes** (Data Plane)
- **Availability Zone 1 (us-east-1a or equivalent)**:
  - **Node 1-6**: t3.2xlarge (8 vCPU, 32 GB RAM each)
  - Labels: zone=us-east-1a, node-pool=general-purpose
  - Taints: None (general workloads)
  - Note: "Runs application pods, database pods, monitoring pods"

- **Availability Zone 2 (us-east-1b or equivalent)**:
  - **Node 7-12**: t3.2xlarge (8 vCPU, 32 GB RAM each)
  - Labels: zone=us-east-1b, node-pool=general-purpose
  - Taints: None
  - Note: "Identical configuration for HA"

- **Availability Zone 3 (us-east-1c or equivalent)**:
  - **Node 13-18**: t3.2xlarge (8 vCPU, 32 GB RAM each)
  - Labels: zone=us-east-1c, node-pool=general-purpose
  - Taints: None
  - Note: "Identical configuration for HA"

**Namespace: ulms-production** (Primary application namespace)
- **Deployments**:
  - fineract-deployment (3-20 replicas, HPA enabled)
  - cib-service-deployment (2-5 replicas, HPA)
  - nid-service-deployment (2-5 replicas, HPA)
  - workflow-service-deployment (2-4 replicas, HPA)
  - document-service-deployment (2-5 replicas, HPA)
  - brpd-service-deployment (2-4 replicas, HPA)
  - notification-service-deployment (3-6 replicas, HPA)
  - analytics-service-deployment (2-4 replicas, HPA)
  - integration-gateway-deployment (2-4 replicas, HPA)
  - kong-gateway-deployment (3-5 replicas, HPA)
  - keycloak-deployment (2-3 replicas)
  - vault-deployment (3 replicas, StatefulSet)

- **StatefulSets**:
  - postgresql-patroni-statefulset (3 replicas: 1 primary + 2 standby)
  - redis-cluster-statefulset (6 replicas: 3 masters + 3 replicas)
  - kafka-statefulset (3 replicas)
  - zookeeper-statefulset (3 replicas)
  - minio-statefulset (4 replicas)

- **Services**:
  - fineract-service (ClusterIP, port 8080)
  - All microservice services (ClusterIP, ports 8081-8088)
  - kong-gateway-service (LoadBalancer, ports 80, 443)
  - keycloak-service (ClusterIP, port 8443)
  - postgresql-primary-service (ClusterIP, port 5432)
  - postgresql-replicas-service (ClusterIP, port 5432)
  - redis-cluster-service (ClusterIP, port 6379)
  - kafka-service (ClusterIP, port 9092)
  - minio-service (ClusterIP, port 9000)
  - vault-service (ClusterIP, port 8200)

- **Ingress**:
  - ulms-ingress (routes: /api/*, /auth/*, /admin/*)
  - TLS: cert-manager with Let's Encrypt
  - Backend: kong-gateway-service

- **ConfigMaps**:
  - fineract-config, cib-service-config, nid-service-config, etc.
  - postgresql-config, redis-config, kafka-config

- **Secrets**:
  - postgresql-credentials (managed by Vault CSI)
  - redis-credentials, kafka-credentials
  - keycloak-admin-secret, kong-admin-secret
  - tls-certificates (managed by cert-manager)

- **HorizontalPodAutoscalers (HPA)**:
  - fineract-hpa (min: 3, max: 20, target CPU: 70%, memory: 80%)
  - cib-service-hpa (min: 2, max: 5)
  - nid-service-hpa (min: 2, max: 5)
  - (Similar HPA for all microservices and Kong)

- **PersistentVolumeClaims (PVCs)**:
  - postgresql-data-pvc-0, postgresql-data-pvc-1, postgresql-data-pvc-2 (500Gi each)
  - redis-data-pvc-0 through redis-data-pvc-5 (50Gi each)
  - kafka-data-pvc-0, kafka-data-pvc-1, kafka-data-pvc-2 (200Gi each)
  - minio-data-pvc-0 through minio-data-pvc-3 (1Ti each)

- **NetworkPolicies**:
  - allow-from-kong-to-fineract (Kong can access Fineract)
  - allow-from-microservices-to-postgresql (All microservices can access PostgreSQL)
  - allow-from-microservices-to-redis (Caching access)
  - allow-from-microservices-to-kafka (Event streaming)
  - deny-all-default (Default deny for security)

- **PodDisruptionBudgets (PDB)**:
  - fineract-pdb (minAvailable: 2)
  - kong-pdb (minAvailable: 2)
  - postgresql-pdb (minAvailable: 1)
  - redis-pdb (minAvailable: 3)

**Namespace: ulms-staging** (UAT and integration testing)
- Similar structure to ulms-production with reduced resources:
  - Deployments: Min replicas (e.g., Fineract: 2-5 replicas)
  - StatefulSets: PostgreSQL (1 primary + 1 standby), Redis (3 nodes), Kafka (1 broker)
  - Resource quotas: 50 CPU, 100 GB RAM, 1 TB storage
  - No HPA (fixed replicas for testing consistency)

**Namespace: ulms-monitoring** (Observability stack)
- **Deployments**:
  - prometheus-deployment (2 replicas)
  - grafana-deployment (2 replicas)
  - alertmanager-deployment (2 replicas)
  - logstash-deployment (3 replicas)
  - kibana-deployment (2 replicas)
  - jaeger-all-in-one-deployment (1 replica)
  - jaeger-collector-deployment (2 replicas)
  - jaeger-query-deployment (2 replicas)

- **StatefulSets**:
  - elasticsearch-statefulset (3 replicas, 200Gi storage each)

- **DaemonSets**:
  - filebeat-daemonset (runs on ALL worker nodes)
  - node-exporter-daemonset (Prometheus node metrics)

- **Services**:
  - prometheus-service (ClusterIP, port 9090)
  - grafana-service (LoadBalancer, port 3000)
  - alertmanager-service (ClusterIP, port 9093)
  - elasticsearch-service (ClusterIP, port 9200)
  - kibana-service (LoadBalancer, port 5601)
  - jaeger-query-service (LoadBalancer, port 16686)

- **ServiceMonitors** (Prometheus CRDs):
  - fineract-servicemonitor (scrapes /actuator/prometheus)
  - All microservice servicemonitors
  - postgresql-exporter-servicemonitor
  - redis-exporter-servicemonitor
  - kafka-exporter-servicemonitor

- **PersistentVolumeClaims**:
  - prometheus-data-pvc-0, prometheus-data-pvc-1 (100Gi each)
  - elasticsearch-data-pvc-0, elasticsearch-data-pvc-1, elasticsearch-data-pvc-2 (200Gi each)

**Namespace: kube-system** (Cluster-level infrastructure)
- **NGINX Ingress Controller** (3 replicas, DaemonSet or Deployment)
- **cert-manager** (3 components: controller, webhook, cainjector)
- **metrics-server** (for HPA CPU/memory metrics)
- **cluster-autoscaler** (scales nodes 18-30 based on pod requests)
- **ebs-csi-driver** (for EBS persistent volumes)
- **efs-csi-driver** (for EFS shared storage)
- **secrets-store-csi-driver** (for Vault integration)
- **velero** (backup and DR, daily schedule)
- **CoreDNS** (2 replicas for DNS resolution)

**Persistent Volumes (PVs)** (Cluster-level, bound to PVCs)
- **EBS gp3 volumes** (encrypted with AWS KMS):
  - pv-postgresql-0, pv-postgresql-1, pv-postgresql-2 (500Gi each, zone-aware)
  - pv-redis-0 through pv-redis-5 (50Gi each)
  - pv-kafka-0, pv-kafka-1, pv-kafka-2 (200Gi each)
  - pv-minio-0 through pv-minio-3 (1Ti each)
  - pv-elasticsearch-0, pv-elasticsearch-1, pv-elasticsearch-2 (200Gi each)
- **EFS volumes** (shared storage):
  - pv-fineract-logs (multi-attach for log aggregation)

**StorageClasses**
- **gp3-encrypted** (AWS EBS gp3, encrypted, allowVolumeExpansion: true)
- **efs-sc** (AWS EFS, ReadWriteMany support)

#### Relationships and Connections

**Control Plane to Worker Nodes**:
- API Server → kubelet on each worker node (node management)
- Scheduler → API Server (pod placement decisions)
- Controller Manager → API Server (desired state reconciliation)

**Pod to Pod** (within and across namespaces):
- ulms-production pods → ulms-production services (ClusterIP DNS resolution)
- ulms-monitoring Prometheus → ulms-production services (metrics scraping)
- ulms-monitoring Filebeat DaemonSet → ulms-monitoring Logstash (log forwarding)

**Pod to Persistent Volume**:
- PostgreSQL StatefulSet pods → PVCs → PVs (EBS gp3-encrypted)
- Each pod in StatefulSet has dedicated PVC

**External Access**:
- Internet → AWS ALB → NGINX Ingress (kube-system) → Kong Gateway (ulms-production)
- Internet → Grafana LoadBalancer Service → Grafana pods (ulms-monitoring)
- Internet → Kibana LoadBalancer Service → Kibana pods (ulms-monitoring)

**Network Policies**:
- Default deny in ulms-production namespace
- Explicit allow from Kong to Fineract and microservices
- Explicit allow from microservices to PostgreSQL, Redis, Kafka
- ulms-monitoring namespace can scrape metrics from all namespaces

#### Annotations and Labels

- **Node labels**:
  - topology.kubernetes.io/zone: us-east-1a/b/c
  - node-pool: general-purpose, memory-optimized, compute-optimized, monitoring
  - instance-type: t3.2xlarge

- **Pod labels** (all pods):
  - app: fineract, cib-service, nid-service, etc.
  - version: v1.0.0 (semantic versioning)
  - tenant: shared (for shared components like Kong, Keycloak)

- **Namespace labels**:
  - name: ulms-production, ulms-staging, ulms-monitoring
  - environment: production, staging
  - monitoring: enabled (for Prometheus scraping)

- **Resource quotas** (per namespace):
  - ulms-production: 100 CPU, 200 GB RAM, 2 TB storage
  - ulms-staging: 50 CPU, 100 GB RAM, 1 TB storage
  - ulms-monitoring: 30 CPU, 64 GB RAM, 5 TB storage

- **Replica counts** displayed for all Deployments and StatefulSets
- **HPA indicators** (min-max replicas) for auto-scaling components
- **PVC sizes** (e.g., 500Gi, 50Gi, 200Gi, 1Ti)

#### Color Coding

- **Control Plane**: Dark Gray (#424242)
- **Worker Nodes AZ1**: Light Blue (#BBDEFB)
- **Worker Nodes AZ2**: Light Green (#C8E6C9)
- **Worker Nodes AZ3**: Light Yellow (#FFF9C4)
- **ulms-production namespace**: Green (#A5D6A7)
- **ulms-staging namespace**: Yellow (#FFF59D)
- **ulms-monitoring namespace**: Purple (#CE93D8)
- **kube-system namespace**: Orange (#FFCC80)
- **Persistent Volumes**: Dark Blue (#1976D2)
- **Services**: Cyan (#80DEEA)
- **NetworkPolicies**: Red dashed lines

#### Layout Suggestions

**Top Section**: Control Plane
- Horizontal arrangement: API Server (center), etcd (left), Scheduler (right), Controller Manager (below)

**Middle Section**: Worker Nodes (3 columns for 3 AZs)
- **Column 1 (AZ1)**: Nodes 1-6 in vertical stack
- **Column 2 (AZ2)**: Nodes 7-12 in vertical stack
- **Column 3 (AZ3)**: Nodes 13-18 in vertical stack
- Show pod distribution across nodes (Fineract, microservices, PostgreSQL distributed for HA)

**Bottom Section**: Namespaces as grouped boxes
- **Left box**: ulms-production namespace with all resources listed
- **Middle box**: ulms-staging namespace
- **Right box**: ulms-monitoring namespace
- **Far right**: kube-system namespace

**Connections**:
- Dashed lines from Control Plane API Server to each worker node
- Solid lines from Ingress → Kong → Microservices → Databases
- Dotted lines for Prometheus scraping targets

#### Recommended Tools

- **Draw.io**: Kubernetes icon library available
- **Lucidchart**: Kubernetes templates
- **PlantUML**: Good for code-based Kubernetes diagrams
- **k8s-diagrams**: Python library for generating Kubernetes diagrams from manifests
- **Kubernetes official diagrams**: Reference architecture patterns

#### Implementation Notes

1. **Node distribution**:
   - Show 6 nodes per AZ clearly labeled (Node 1, Node 2, etc.)
   - Indicate that pods are distributed across nodes (use small pod icons inside nodes)
   - Use pod anti-affinity symbols (X between pods) to show spreading

2. **Namespace grouping**:
   - Use large boxes/containers to visually group all resources in each namespace
   - List Deployments, StatefulSets, Services, ConfigMaps, Secrets, HPA, PVCs within namespace box

3. **StatefulSet visualization**:
   - Show PostgreSQL StatefulSet as 3 pods with labels (postgresql-0 [Primary], postgresql-1 [Standby], postgresql-2 [Standby])
   - Arrow from each pod to its dedicated PVC

4. **HPA visualization**:
   - Show Fineract Deployment with annotation "3-20 replicas (HPA)"
   - Bi-directional arrow between Deployment and HPA resource

5. **NetworkPolicy visualization**:
   - Red dashed lines between allowed communication paths
   - X symbols for denied paths

6. **Validation**:
   - Verify all resource names match actual Kubernetes manifests in [ARCH]_Kubernetes_Cluster_Architecture_v1.0.md
   - Ensure replica counts align with document specifications
   - Cross-check namespace resource quotas

---

### 4.3 DAD-03: Network Architecture Diagram

#### Purpose

**DAD-03** provides a **comprehensive network topology view** showing 6 distinct network zones, security boundaries, IP address ranges, firewall rules, load balancers, VPN tunnels, and traffic flows. This diagram is critical for understanding network segmentation, security architecture, and compliance with Bangladesh Bank ICT Security Guidelines V4.0.

**Target Audience**: Network engineers, security architects, cloud infrastructure engineers, compliance auditors

#### Diagram Type

- **Network topology diagram** with zone-based layout
- **Layered security zones** (Internet, DMZ, Application, Data, Integration, Management)
- **Large format** (A2 or 36" x 24") for detailed network information
- **Landscape orientation**

#### Components to Show

**Network Zone 1: Internet Zone (Public)**
- **Public Internet**:
  - Icon: Cloud with "Internet" label
  - IP Range: Public (0.0.0.0/0)
  - Note: "End users, mobile clients, partner systems"
- **End Users**:
  - Web browsers, mobile apps
  - Geographic distribution: Bangladesh nationwide

**Network Zone 2: DMZ Zone (Edge Security)**
- **IP Range**: 10.0.1.0/24 (256 addresses)
- **AWS Application Load Balancer (ALB)**:
  - Icon: Load balancer
  - Public IP: Elastic IP (e.g., 52.91.xx.xx)
  - Private IP: 10.0.1.10
  - Listeners: HTTPS (443), HTTP (80 → redirect to 443)
  - Target Group: NGINX Ingress Controller
  - Health Check: HTTP GET /healthz every 30s
  - Security Group: alb-sg (allow 80, 443 from 0.0.0.0/0)
  - Note: "Layer 7 load balancing, SSL termination (TLS 1.3)"

- **AWS WAF**:
  - Icon: Firewall shield
  - Attached to: ALB
  - Rules: SQL injection, XSS, rate-based (1000 req/5min per IP)
  - Note: "OWASP Top 10 protection"

- **AWS Shield Standard**:
  - Icon: DDoS shield
  - Attached to: ALB
  - Note: "Automatic DDoS protection"

- **NGINX Ingress Controller Pods**:
  - IP Range: 10.0.1.20-10.0.1.22 (3 pods)
  - Namespace: kube-system
  - Ports: 80, 443, 8443 (metrics)
  - Security Group: ingress-sg (allow 80, 443 from alb-sg)
  - Note: "TLS termination with cert-manager, routing to Kong"

**Network Zone 3: Application Zone (Microservices)**
- **IP Range**: 10.0.10.0/24 (256 addresses)
- **Kong API Gateway Pods**:
  - IP Range: 10.0.10.10-10.0.10.14 (3-5 pods)
  - Namespace: ulms-production
  - Ports: 8000 (proxy), 8443 (proxy SSL), 8001 (admin API)
  - Security Group: kong-sg (allow 80, 443 from ingress-sg)
  - Note: "API authentication, rate limiting, routing"

- **Keycloak Pods**:
  - IP Range: 10.0.10.20-10.0.10.22 (2-3 pods)
  - Ports: 8080, 8443
  - Security Group: keycloak-sg (allow 8443 from kong-sg)
  - Note: "OAuth 2.0 / OIDC authentication provider"

- **Apache Fineract Pods**:
  - IP Range: 10.0.10.30-10.0.10.49 (3-20 pods, HPA)
  - Port: 8080
  - Security Group: fineract-sg (allow 8080 from kong-sg)
  - Note: "Core loan management application"

- **Microservice Pods** (CIB, NID, Workflow, Document, BRPD, Notification, Analytics, Integration Gateway):
  - IP Range: 10.0.10.50-10.0.10.149 (up to 40 pods total across 8 microservices)
  - Ports: 8081-8088
  - Security Group: microservices-sg (allow 8081-8088 from kong-sg)
  - Note: "8 custom microservices, auto-scaling enabled"

**Network Zone 4: Data Zone (Databases & Storage)**
- **IP Range**: 10.0.20.0/24 (256 addresses)
- **PostgreSQL Pods (Patroni HA)**:
  - Primary: 10.0.20.10
  - Standby 1: 10.0.20.11
  - Standby 2: 10.0.20.12
  - Port: 5432
  - Security Group: postgresql-sg (allow 5432 from microservices-sg, kong-sg)
  - Note: "Automatic failover with Patroni, schema-per-tenant"

- **Redis Cluster Pods**:
  - Master 1: 10.0.20.20, Replica 1a: 10.0.20.21
  - Master 2: 10.0.20.22, Replica 2a: 10.0.20.23
  - Master 3: 10.0.20.24, Replica 3a: 10.0.20.25
  - Port: 6379
  - Security Group: redis-sg (allow 6379 from microservices-sg)
  - Note: "Session cache, query result cache"

- **Kafka Broker Pods**:
  - Broker 1: 10.0.20.30
  - Broker 2: 10.0.20.31
  - Broker 3: 10.0.20.32
  - Port: 9092 (internal), 9093 (external SSL)
  - Security Group: kafka-sg (allow 9092 from microservices-sg)
  - Note: "Event streaming, async communication"

- **ZooKeeper Pods**:
  - Node 1: 10.0.20.40
  - Node 2: 10.0.20.41
  - Node 3: 10.0.20.42
  - Port: 2181 (client), 2888 (peer), 3888 (leader election)
  - Security Group: zookeeper-sg (allow 2181 from kafka-sg)

- **MinIO Pods**:
  - Node 1: 10.0.20.50
  - Node 2: 10.0.20.51
  - Node 3: 10.0.20.52
  - Node 4: 10.0.20.53
  - Port: 9000 (API), 9001 (Console)
  - Security Group: minio-sg (allow 9000 from microservices-sg)
  - Note: "S3-compatible object storage for documents"

- **Elasticsearch Cluster Pods**:
  - Node 1: 10.0.20.60
  - Node 2: 10.0.20.61
  - Node 3: 10.0.20.62
  - Port: 9200 (HTTP), 9300 (Transport)
  - Security Group: elasticsearch-sg (allow 9200 from monitoring-sg)
  - Note: "Log storage and search"

- **HashiCorp Vault Pods**:
  - Node 1: 10.0.20.70
  - Node 2: 10.0.20.71
  - Node 3: 10.0.20.72
  - Port: 8200 (API)
  - Security Group: vault-sg (allow 8200 from microservices-sg, kong-sg)
  - Note: "Secrets management, dynamic credentials"

**Network Zone 5: Integration Zone (External Connectivity)**
- **IP Range**: 10.0.30.0/24 (256 addresses)
- **VPN Gateway**:
  - Icon: VPN tunnel
  - Private IP: 10.0.30.10
  - Public IP: Elastic IP (static for whitelist at Bangladesh Bank)
  - Protocol: IPSec
  - Tunnel: to Bangladesh Bank CIB (encrypted)
  - Security Group: vpn-sg (allow UDP 500, 4500 from Bangladesh Bank public IP)
  - Note: "Dedicated VPN for Bangladesh Bank CIB integration"

- **Integration Gateway Pods** (Repeated from Application Zone, but shown here for external connections):
  - IP Range: 10.0.30.20-10.0.30.23 (2-4 pods)
  - Port: 8088
  - Security Group: integration-sg (allow 8088 from vpn-sg, allow outbound to external APIs)
  - Note: "Apache Camel ESB for external integrations"

- **External API Endpoints** (Shown outside this zone):
  - Bangladesh Bank CIB API (via VPN)
  - NID Wing API (public Internet with API key)
  - CBS (bank-specific, HTTPS)
  - Payment Gateways (bKash, Nagad, Rocket - public APIs)
  - Bangladesh Bank SFTP (SSH port 22)
  - SMS Gateway (HTTPS public API)
  - AWS SES (HTTPS AWS service endpoint)

**Network Zone 6: Management Zone (Monitoring & Operations)**
- **IP Range**: 10.0.40.0/24 (256 addresses)
- **Prometheus Pods**:
  - Server 1: 10.0.40.10
  - Server 2: 10.0.40.11
  - Port: 9090
  - Security Group: prometheus-sg (allow 9090 from grafana-sg, allow scraping 8080-8088, 5432, 6379, 9092 from all zones)
  - Note: "Metrics collection from all namespaces"

- **Grafana Pods**:
  - Pod 1: 10.0.40.20
  - Pod 2: 10.0.40.21
  - Port: 3000
  - Security Group: grafana-sg (allow 3000 from alb-sg for public access with auth)
  - Note: "Metrics visualization dashboards"

- **Logstash Pods**:
  - Pod 1: 10.0.40.30
  - Pod 2: 10.0.40.31
  - Pod 3: 10.0.40.32
  - Port: 5044 (Beats input)
  - Security Group: logstash-sg (allow 5044 from all zones)
  - Note: "Log aggregation and processing"

- **Kibana Pods**:
  - Pod 1: 10.0.40.40
  - Pod 2: 10.0.40.41
  - Port: 5601
  - Security Group: kibana-sg (allow 5601 from alb-sg for public access with auth)
  - Note: "Log visualization and search"

- **Jaeger Pods**:
  - Collector: 10.0.40.50
  - Query: 10.0.40.51
  - Port: 16686 (UI), 14250 (collector)
  - Security Group: jaeger-sg (allow 16686 from alb-sg, allow 14250 from all microservices)
  - Note: "Distributed tracing"

- **Bastion Host** (Optional for emergency SSH access):
  - IP: 10.0.40.100
  - Port: 22 (SSH)
  - Security Group: bastion-sg (allow 22 from company VPN IP ranges only)
  - Note: "Jump host for emergency Kubernetes node access"

#### Security Groups and Firewall Rules

Show security group associations and rules as tables:

| Security Group | Inbound Rules | Outbound Rules |
|----------------|---------------|----------------|
| **alb-sg** | TCP 80 from 0.0.0.0/0<br>TCP 443 from 0.0.0.0/0 | TCP 80 to ingress-sg<br>TCP 443 to ingress-sg |
| **ingress-sg** | TCP 80,443 from alb-sg | TCP 8000,8443 to kong-sg |
| **kong-sg** | TCP 8000,8443 from ingress-sg | TCP 8080 to fineract-sg<br>TCP 8081-8088 to microservices-sg<br>TCP 8443 to keycloak-sg<br>TCP 5432 to postgresql-sg |
| **microservices-sg** | TCP 8081-8088 from kong-sg | TCP 5432 to postgresql-sg<br>TCP 6379 to redis-sg<br>TCP 9092 to kafka-sg<br>TCP 9000 to minio-sg<br>TCP 8200 to vault-sg |
| **postgresql-sg** | TCP 5432 from microservices-sg, kong-sg | None (stateful return traffic) |
| **redis-sg** | TCP 6379 from microservices-sg | None |
| **kafka-sg** | TCP 9092 from microservices-sg | TCP 2181 to zookeeper-sg |
| **monitoring-sg** | Metrics ports from all zones | TCP 9200 to elasticsearch-sg |
| **vpn-sg** | UDP 500, 4500 from BB public IP | TCP 443 to BB CIB API |
| **integration-sg** | TCP 8088 from vpn-sg | TCP/UDP to external APIs (NID, CBS, Payment, SFTP, SMS, SES) |

#### Traffic Flows

Show numbered traffic flows with arrows:

1. **User Login Flow**:
   - User (Internet) → ALB (443) → WAF → NGINX Ingress (10.0.1.20) → Kong (10.0.10.10) → Keycloak (10.0.10.20) → PostgreSQL (10.0.20.10)
   - Return: JWT token → Kong → Ingress → ALB → User

2. **Loan Application Submission**:
   - User → ALB → Ingress → Kong → Fineract (10.0.10.30) → PostgreSQL (10.0.20.10) → Kafka (10.0.20.30) → Notification Service → SMS/Email

3. **CIB Inquiry via VPN**:
   - CIB Service (10.0.10.60) → VPN Gateway (10.0.30.10) → Bangladesh Bank CIB API (external) → Return

4. **Monitoring Metrics Scraping**:
   - Prometheus (10.0.40.10) → All microservices (10.0.10.x:8080/actuator/prometheus) → PostgreSQL Exporter (5432) → Redis Exporter (6379) → Kafka Exporter (9092)

5. **Log Collection**:
   - All pods → Filebeat (DaemonSet on each node) → Logstash (10.0.40.30:5044) → Elasticsearch (10.0.20.60:9200) → Kibana (10.0.40.40:5601) ← User

6. **External Integration**:
   - Integration Gateway (10.0.30.20) → NID API (HTTPS public), CBS (HTTPS), Payment Gateways (HTTPS), SFTP (SSH port 22)

#### Routing and DNS

- **VPC CIDR**: 10.0.0.0/16 (65,536 addresses)
- **Subnets**:
  - DMZ Subnet: 10.0.1.0/24 (public subnet, Internet Gateway attached)
  - Application Subnet: 10.0.10.0/24 (private subnet, NAT Gateway for outbound)
  - Data Subnet: 10.0.20.0/24 (private subnet, no direct Internet access)
  - Integration Subnet: 10.0.30.0/24 (private subnet, VPN Gateway attached)
  - Management Subnet: 10.0.40.0/24 (private subnet, NAT Gateway for outbound)

- **Route Tables**:
  - **Public Route Table** (DMZ):
    - 0.0.0.0/0 → Internet Gateway (igw-xxx)
    - 10.0.0.0/16 → local
  - **Private Route Table** (Application, Data, Management):
    - 0.0.0.0/0 → NAT Gateway (nat-xxx) in DMZ subnet
    - 10.0.0.0/16 → local
  - **Integration Route Table**:
    - 0.0.0.0/0 → NAT Gateway
    - Bangladesh Bank IP range → VPN Gateway (vgw-xxx)
    - 10.0.0.0/16 → local

- **DNS Resolution**:
  - Internal: CoreDNS (kube-dns.kube-system.svc.cluster.local)
  - External: AWS Route 53
  - Service Discovery: Kubernetes Service DNS (e.g., fineract-service.ulms-production.svc.cluster.local)

#### Annotations and Labels

- **IP addresses** for all major components
- **Port numbers** for all services
- **Protocol labels** (HTTPS, HTTP, TCP, UDP, IPSec VPN, mTLS)
- **Security group names** associated with each component
- **Subnet CIDR blocks** for each zone
- **Firewall rules** (arrows with labels like "allow 443", "deny all others")
- **Network boundaries** (thick dashed lines separating zones)
- **Zone names** prominently displayed

#### Color Coding

- **Internet Zone**: White (#FFFFFF)
- **DMZ Zone**: Orange (#FFE0B2) - Elevated risk
- **Application Zone**: Green (#C8E6C9) - Trusted application tier
- **Data Zone**: Blue (#BBDEFB) - Highly protected data
- **Integration Zone**: Yellow (#FFF9C4) - External connectivity
- **Management Zone**: Purple (#E1BEE7) - Administrative access
- **Security boundaries**: Red thick dashed lines
- **Allowed traffic flows**: Green arrows
- **Blocked traffic**: Red X symbols

#### Layout Suggestions

**Left-to-right flow** representing traffic progression:
1. **Far left**: Internet Zone (User icons)
2. **Left**: DMZ Zone (ALB, WAF, Ingress)
3. **Center-left**: Application Zone (Kong, Keycloak, Fineract, Microservices)
4. **Center**: Data Zone (PostgreSQL, Redis, Kafka, MinIO, Elasticsearch, Vault)
5. **Bottom**: Integration Zone (VPN Gateway, external connections)
6. **Top**: Management Zone (Prometheus, Grafana, ELK Stack)

Use **swim lanes** or **colored background zones** to clearly delineate the 6 network zones.

#### Recommended Tools

- **Draw.io**: Excellent for network diagrams with AWS network icons
- **Lucidchart**: Professional network diagram templates
- **Microsoft Visio**: Enterprise standard with AWS and network stencils
- **Cloudcraft**: Specialized for AWS network architecture (3D view)
- **Cisco Packet Tracer**: If you want realistic network device representations (overkill for cloud)

#### Implementation Notes

1. **IP address management**:
   - All IP addresses shown are examples (10.0.x.x private ranges)
   - Actual deployment should use IP Address Management (IPAM) tool
   - Kubernetes assigns pod IPs dynamically from pod CIDR range

2. **Security group rules**:
   - Show principle of least privilege (deny all, allow only necessary)
   - Indicate stateful vs stateless rules (AWS security groups are stateful)
   - Reference NACL (Network ACL) if used for additional subnet-level filtering

3. **High availability**:
   - Show multi-AZ deployment for ALB (multiple AZ symbols)
   - Indicate that all zones span multiple AZs for redundancy

4. **Compliance annotations**:
   - Note alignment with ICT Guidelines V4.0 Section 5.3 (Network Segmentation)
   - Reference OWASP Security Architecture principles

5. **Validation**:
   - Network engineer review for accuracy
   - Security team approval for zone isolation
   - Verify firewall rules with actual AWS security group configurations

---

### 4.4 DAD-04: Data Flow Diagram

#### Purpose

**DAD-04** illustrates **data flows for 4 critical banking use cases**, showing the complete journey of data from user input through multiple system components, databases, message queues, and external integrations. This diagram helps understand synchronous vs asynchronous processing, caching strategies, error handling, and end-to-end transaction flows.

**Target Audience**: Application architects, developers, business analysts, QA engineers, support teams

#### Diagram Type

- **Sequence flow diagram** or **data flow diagram** with 4 separate flows
- **Portrait orientation** for vertical flow (top to bottom)
- **Swimlane layout** (optional) to separate different tiers

#### Use Cases to Show

**Use Case 1: Loan Application Submission**

**Actors**: Bank employee (web app), Borrower (applying for loan)

**Flow**:
1. User (Web App) → HTTPS POST /api/v1/loans → ALB (TLS 1.3 termination)
2. ALB → NGINX Ingress → Kong Gateway (JWT validation with Keycloak)
3. Kong → Apache Fineract (POST /fineract-provider/api/v1/loans, JSON payload)
4. Fineract → PostgreSQL (INSERT into loan_account table, tenant schema: bank_001.loan_account)
5. PostgreSQL → Fineract (Response: loanId = 12345)
6. Fineract → Kafka Topic: loan-application-submitted (Async event)
   - Event payload: `{tenantId: "bank_001", loanId: 12345, borrowerId: 67890, amount: 500000, status: "PENDING"}`
7. Workflow Service (Kafka Consumer) → Consumes event → Camunda BPMN starts 7-level approval workflow
8. Workflow Service → PostgreSQL (INSERT into workflow_instance table)
9. Workflow Service → Kafka Topic: workflow-started
10. Notification Service (Kafka Consumer) → Consumes event → Prepares SMS/Email
11. Notification Service → SMS Gateway API (HTTPS POST with API Key)
12. Notification Service → AWS SES (Email via SDK)
13. Fineract → Kong → ALB → User (Response: HTTP 201 Created, `{loanId: 12345, status: "PENDING_APPROVAL"}`)

**Annotations**:
- Protocol: HTTPS, JSON, Kafka (Async)
- Sync vs Async: Steps 1-5 synchronous (user waits), Steps 6-12 asynchronous (background processing)
- Transaction: Database transaction commits at step 5
- Error Handling: If Kafka publish fails (step 6), compensating transaction reverts loan to DRAFT status
- Caching: No caching for write operations
- Latency: Steps 1-5 complete in <500ms (p95), Steps 6-12 complete within 10 seconds

**Use Case 2: CIB (Credit Bureau) Inquiry**

**Actors**: Bank loan officer (web app), Bangladesh Bank CIB API

**Flow**:
1. User (Web App) → HTTPS GET /api/v1/cib/inquiry?nid=1234567890 → ALB
2. ALB → NGINX Ingress → Kong → CIB Service (GET /cib/inquiry?nid=1234567890)
3. CIB Service → Redis (GET cib:nid:1234567890) - **Cache check**
4. **Cache MISS** → Redis returns null
5. CIB Service → VPN Gateway (10.0.30.10) → Bangladesh Bank CIB API (HTTPS POST with mTLS client certificate)
   - Request payload: `{nid: "1234567890", requestDate: "2026-02-05", bankCode: "001"}`
6. Bangladesh Bank CIB API → CIB Service (Response: Credit history JSON, 200-300ms latency)
   - Response: `{nid: "1234567890", creditScore: 720, totalLoans: 2, totalOutstanding: 150000, defaults: 0, lastInquiry: "2025-12-01"}`
7. CIB Service → PostgreSQL (INSERT into cib_inquiry_log, INSERT into borrower_credit_history)
8. CIB Service → Redis (SET cib:nid:1234567890, TTL 3600 seconds) - **Cache store**
9. CIB Service → Kafka Topic: cib-inquiry-completed (Audit trail)
10. CIB Service → Kong → ALB → User (Response: HTTP 200 OK, credit report JSON)

**Second Request** (Cache HIT scenario):
1. User → ALB → Kong → CIB Service (GET /cib/inquiry?nid=1234567890)
2. CIB Service → Redis (GET cib:nid:1234567890) - **Cache HIT**
3. Redis returns cached credit report (latency: <10ms)
4. CIB Service → Kong → User (Response: HTTP 200 OK, cached data)
5. **No call to Bangladesh Bank** (cost savings, faster response)

**Annotations**:
- Caching Strategy: Cache HIT avoids expensive external API call and VPN latency
- Cache TTL: 1 hour (balance between freshness and performance)
- Security: mTLS with client certificate, VPN tunnel encryption
- Error Handling: If CIB API timeout (>30s), return cached data with staleness warning
- Rate Limiting: 100 requests/minute per tenant (enforced at Kong)
- Compliance: All inquiries logged in PostgreSQL for audit (10-year retention)

**Use Case 3: Loan Disbursement to Payment Gateway**

**Actors**: Bank admin (approves disbursement), Borrower (receives funds via bKash)

**Flow**:
1. Admin (Web App) → HTTPS POST /api/v1/loans/12345/disburse → ALB
2. ALB → Kong (JWT validation, check admin role) → Fineract
3. Fineract → PostgreSQL (UPDATE loan_account SET status='DISBURSED', disbursement_date=NOW())
4. Fineract → PostgreSQL (INSERT into loan_transaction: type='DISBURSEMENT', amount=500000)
5. PostgreSQL → Fineract (Transaction committed)
6. Fineract → Kafka Topic: loan-disbursed
   - Event: `{tenantId: "bank_001", loanId: 12345, borrowerMobile: "01712345678", amount: 500000, gateway: "bKash"}`
7. Integration Gateway (Kafka Consumer) → Consumes event
8. Integration Gateway → Retrieves bKash credentials from Vault (dynamic secret, TTL 1 hour)
9. Vault → Integration Gateway (OAuth 2.0 client_id, client_secret)
10. Integration Gateway → bKash Token API (POST /oauth/token, get access token)
11. bKash → Integration Gateway (access_token, expires_in: 3600)
12. Integration Gateway → bKash Payment API (POST /payment, Bearer token)
    - Payload: `{amount: 500000, recipient: "01712345678", reference: "LOAN-12345", idempotencyKey: "uuid-xxx"}`
13. bKash Payment API → **Processing** (5-10 seconds)
14. bKash → Integration Gateway (Response: `{transactionId: "bkash-txn-999", status: "COMPLETED"}`)
15. Integration Gateway → PostgreSQL (INSERT into payment_transaction)
16. Integration Gateway → Kafka Topic: payment-completed
17. Notification Service → Consumes event → Sends SMS to borrower ("Your loan of BDT 500,000 has been disbursed to 01712345678")
18. Integration Gateway → Kong → User (Response: HTTP 200 OK, `{disbursementId: 999, status: "COMPLETED"}`)

**Error Handling Flow**:
- If bKash API fails (step 14), Integration Gateway retries 3 times with exponential backoff (1s, 2s, 4s)
- If all retries fail, mark payment as FAILED, publish loan-disbursement-failed event
- Manual reconciliation queue for failed payments

**Annotations**:
- Idempotency: idempotencyKey ensures duplicate requests don't result in double payments
- Security: OAuth 2.0 token from Vault, automatic rotation
- Async Processing: Webhook from bKash (optional) for long-running payments
- Transaction Safety: Database transaction committed before external API call (no distributed transaction)
- Circuit Breaker: If bKash failure rate > 50%, circuit opens, payments queued for retry

**Use Case 4: Monitoring & Logging Pipeline**

**Actors**: DevOps engineer (views dashboard), Automated alerts

**Metrics Flow**:
1. All Microservices (Fineract, CIB, NID, etc.) → Expose /actuator/prometheus endpoint (Micrometer metrics)
2. Prometheus (ulms-monitoring namespace) → **Scrapes** metrics every 15 seconds from all pods
   - Scrape targets: fineract-service:8080/actuator/prometheus, cib-service:8081/actuator/prometheus, etc.
3. Prometheus → Stores metrics in TSDB (Time Series Database, 15-day retention)
4. Grafana → Queries Prometheus (PromQL) → Visualizes in dashboards
   - Example query: `rate(http_requests_total{job="fineract"}[5m])` (HTTP request rate)
5. Alertmanager → Evaluates alert rules every 1 minute
   - Example rule: `rate(http_requests_total{status=~"5.."}[5m]) > 0.05` (Error rate > 5%)
6. **Alert triggered** → Alertmanager → Sends to Slack, Email, PagerDuty
7. DevOps Engineer → Opens Grafana dashboard → Investigates high error rate

**Logging Flow**:
1. All Microservices → Write logs to stdout/stderr (JSON format)
   - Example: `{"timestamp": "2026-02-05T10:30:00Z", "level": "ERROR", "service": "fineract", "tenantId": "bank_001", "message": "Database connection timeout"}`
2. Filebeat (DaemonSet on each Kubernetes node) → Collects logs from all pods via /var/log/containers/*.log
3. Filebeat → Ships logs to Logstash (10.0.40.30:5044 via Beats protocol)
4. Logstash → Parses JSON logs, adds metadata (pod name, namespace, node)
5. Logstash → Enriches with GeoIP (if IP address present)
6. Logstash → Indexes to Elasticsearch (ulms-logs-2026.02.05 daily index)
7. Elasticsearch → Stores logs (5 TB storage, 90-day retention, then archived to S3)
8. Kibana → User searches logs (e.g., "tenantId:bank_001 AND level:ERROR")
9. Kibana → Visualizes error trends, top errors, log volume

**Tracing Flow**:
1. User request arrives at Kong with trace ID header (X-B3-TraceId: abc123)
2. Kong → Propagates trace ID to Fineract in HTTP header
3. Fineract → Propagates to CIB Service, PostgreSQL queries, Redis queries
4. Each service → Sends spans to Jaeger Collector (10.0.40.50:14250 via gRPC)
   - Span 1: Kong Gateway (duration: 5ms)
   - Span 2: Fineract (duration: 250ms)
   - Span 3: CIB Service (duration: 200ms)
   - Span 4: PostgreSQL query (duration: 50ms)
5. Jaeger Collector → Stores spans in Elasticsearch backend
6. DevOps Engineer → Opens Jaeger UI (16686) → Searches for trace ID: abc123
7. Jaeger → Displays complete trace waterfall (identifies slow CIB Service call)

**Annotations**:
- Metrics: Prometheus pull model (scraping), 15s granularity
- Logs: Filebeat push model (shipping), JSON structured logging
- Traces: OpenTelemetry instrumentation, distributed context propagation
- Correlation: Trace ID links logs, metrics, and traces for a single request
- Retention: Metrics 15 days, Logs 90 days, Traces 7 days

#### Relationships and Connections

- **User → ALB → Kong → Services**: All user requests follow this path
- **Services → Kafka → Consumers**: Asynchronous event-driven communication
- **Services → PostgreSQL**: Synchronous read/write for ACID transactions
- **Services → Redis**: Synchronous cache read/write for performance
- **Services → External APIs**: Synchronous integration (REST, SOAP)
- **Services → Prometheus**: Metrics scraping (pull model)
- **Services → Jaeger**: Trace spans (push model via gRPC)
- **Services → Filebeat → Logstash → Elasticsearch**: Log aggregation pipeline

#### Annotations and Labels

- **Protocol** for each connection (HTTPS, HTTP, Kafka, gRPC, TCP)
- **Data format** (JSON, XML, Protobuf)
- **Sync vs Async** clearly labeled
- **Latency** (e.g., "<10ms cache hit", "200-300ms CIB API")
- **Error handling** (retry logic, circuit breaker, fallback)
- **Caching** (HIT/MISS, TTL)
- **Authentication** (JWT, OAuth 2.0, mTLS, API Key)
- **Idempotency** (idempotency keys for financial transactions)
- **Transaction boundaries** (database commits)

#### Color Coding

- **Synchronous flows**: Blue solid arrows
- **Asynchronous flows**: Green dashed arrows
- **Error/Retry flows**: Red dotted arrows
- **Cache HIT**: Green thick arrow
- **Cache MISS**: Orange arrow
- **External API calls**: Purple arrows
- **Database transactions**: Dark blue boxes

#### Layout Suggestions

**Vertical top-to-bottom flow** for each use case:
- **Top**: User or trigger
- **Middle**: Services, databases, message queues
- **Bottom**: External systems or final outcome

**Separate each use case** into distinct sections or pages for clarity.

**Use sequence diagram style** with vertical lifelines for each component and horizontal arrows for interactions.

#### Recommended Tools

- **Draw.io**: Sequence diagram template
- **Lucidchart**: UML sequence diagrams
- **PlantUML**: Code-based sequence diagrams (excellent for data flows)
- **Mermaid**: Markdown-based sequence diagrams
- **Microsoft Visio**: Data flow diagram templates

#### Implementation Notes

1. **Use numbered steps** for clarity in each use case
2. **Show timing** (latency) for critical steps to highlight performance bottlenecks
3. **Distinguish sync from async** visually (solid vs dashed arrows)
4. **Include happy path and error path** for critical flows (loan disbursement)
5. **Validation**: Walk through flows with developers to ensure accuracy

---

### 4.5 DAD-05: Security Architecture View

#### Purpose

**DAD-05** visualizes the **8-layer defense-in-depth security architecture**, showing how security controls are applied at each layer from network perimeter to data encryption. It also illustrates authentication and authorization flows, encryption mechanisms, secrets management, and audit logging. This diagram is essential for security audits, compliance verification, and threat modeling.

**Target Audience**: Security architects, security engineers, compliance officers, auditors, penetration testers

#### Diagram Type

- **Layered security diagram** with 8 horizontal layers
- **Authentication flow diagram** (OAuth 2.0 sequence)
- **Portrait orientation** for vertical layering
- **Large format** for detailed security controls

#### Components to Show

**8 Security Layers** (Top to Bottom)

**Layer 1: Perimeter Security (Network Edge)**
- **AWS WAF (Web Application Firewall)**:
  - OWASP Top 10 protection (SQL injection, XSS, CSRF)
  - Managed rule sets: Core Rule Set, Known Bad Inputs, IP Reputation
  - Custom rules: Rate limiting (1000 requests/5min per IP)
  - Geo-blocking: Optional (block traffic from non-Bangladesh IPs)
  - Bot detection: Challenge-response for suspicious traffic
- **AWS Shield Standard**:
  - DDoS protection (Layer 3/4)
  - Automatic always-on detection and mitigation
  - Protection against SYN floods, UDP reflection, etc.
- **IP Whitelisting**:
  - Bangladesh Bank VPN IP ranges (for CIB integration)
  - Bank branch IP ranges (optional, configurable per tenant)
  - Admin access restricted to corporate VPN IPs

**Layer 2: Transport Security (Encryption in Transit)**
- **TLS 1.3 at ALB**:
  - Cipher suites: TLS_AES_128_GCM_SHA256, TLS_AES_256_GCM_SHA384, TLS_CHACHA20_POLY1305_SHA256
  - Certificate: Let's Encrypt wildcard cert (*.ulms.example.com)
  - HSTS (HTTP Strict Transport Security): max-age=31536000; includeSubDomains
  - TLS 1.0/1.1 disabled, only TLS 1.2+ allowed
- **mTLS for CIB Integration**:
  - Client certificate issued by Bangladesh Bank CA
  - Server certificate verification (Bangladesh Bank CIB API cert)
  - Certificate pinning in CIB Service for additional security
- **Internal TLS**:
  - Kong → Microservices: HTTP (within trusted VPC, optional TLS via service mesh)
  - PostgreSQL: TLS enabled for replication and client connections
  - Redis: TLS enabled (redis://  → rediss://)
  - Kafka: TLS for broker-to-broker and client-to-broker

**Layer 3: Authentication & Authorization (Identity Management)**
- **OAuth 2.0 / OIDC Flow** (Detailed sequence):
  1. User (Web App) → POST /auth/login {username, password} → ALB → Kong → Keycloak
  2. Keycloak → Validates credentials against PostgreSQL user table (password: Bcrypt hash)
  3. Keycloak → Checks user status (active, locked, expired)
  4. Keycloak → Returns: `{access_token (JWT), refresh_token, expires_in: 3600}`
  5. User → Stores access_token in browser (sessionStorage, NOT localStorage for security)
  6. User → Subsequent requests: Authorization: Bearer <access_token>
  7. Kong (JWT Plugin) → Validates JWT signature (RSA public key from Keycloak JWKS endpoint)
  8. Kong → Extracts claims: {sub: userId, tenantId: "bank_001", roles: ["LOAN_OFFICER"], permissions: ["loans:read", "loans:create"]}
  9. Kong → Forwards to microservice with headers: X-User-Id, X-Tenant-Id, X-Roles
  10. Microservice → Checks permissions (Spring Security @PreAuthorize)
  11. Microservice → Tenant context resolver sets database schema based on X-Tenant-Id

- **JWT Token Structure**:
  ```json
  {
    "sub": "user-12345",
    "tenantId": "bank_001",
    "roles": ["LOAN_OFFICER"],
    "permissions": ["loans:read", "loans:create", "borrowers:read"],
    "iss": "https://keycloak.ulms.example.com/realms/ulms",
    "aud": "ulms-api",
    "exp": 1707134400,
    "iat": 1707130800,
    "jti": "jwt-uuid-abc123"
  }
  ```

- **Multi-Factor Authentication (MFA)**:
  - Admin users: OTP via SMS or Authenticator app (TOTP)
  - Keycloak MFA policy: required for roles: ADMIN, AUDITOR
  - Fallback: Backup codes (10 single-use codes)

- **Session Management**:
  - Access token TTL: 1 hour
  - Refresh token TTL: 24 hours (stored in HttpOnly cookie)
  - Refresh token rotation: New refresh token issued on each refresh
  - Token revocation: Redis cache stores revoked tokens (blacklist)

**Layer 4: API Security (Kong Gateway)**
- **Rate Limiting**:
  - Per IP: 1000 requests/hour
  - Per User: 10,000 requests/hour
  - Per Tenant: 100,000 requests/hour
  - Burst: 100 requests/minute
  - 429 Too Many Requests response with Retry-After header
- **CORS (Cross-Origin Resource Sharing)**:
  - Allowed origins: https://app.ulms.example.com, https://admin.ulms.example.com
  - Allowed methods: GET, POST, PUT, DELETE, OPTIONS
  - Allowed headers: Authorization, Content-Type, X-Tenant-Id
  - Credentials: true (allow cookies)
- **Input Validation**:
  - Request size limit: 10 MB (prevent payload bombs)
  - JSON schema validation (Kong plugin or application layer)
  - SQL injection prevention: Parameterized queries (JPA/Hibernate)
  - XSS prevention: Output encoding in React (automatic)
- **API Versioning**:
  - URL path versioning: /api/v1/loans, /api/v2/loans
  - Sunset header for deprecated versions: Sunset: Sat, 01 Jan 2027 00:00:00 GMT

**Layer 5: Application Security (Microservices)**
- **Spring Security**:
  - Method-level authorization: @PreAuthorize("hasRole('LOAN_OFFICER') AND hasPermission('loans', 'create')")
  - Custom PermissionEvaluator: Checks user approval limits (loan officer can approve up to BDT 1,000,000)
  - CSRF protection: Disabled for REST APIs (stateless, token-based)
  - Session fixation protection: Not applicable (stateless)
- **RBAC (Role-Based Access Control)**:
  - Roles: ADMIN, MANAGER, LOAN_OFFICER, TELLER, AUDITOR, CUSTOMER
  - Permissions: loans:read, loans:create, loans:approve, borrowers:read, reports:view
  - Hierarchical roles: ADMIN inherits all permissions
- **Approval Limits** (Financial control):
  - TELLER: BDT 0 (cannot approve loans)
  - LOAN_OFFICER: BDT 1,000,000
  - MANAGER: BDT 10,000,000
  - ADMIN: Unlimited
  - Workflow Service enforces 7-level approval for loans > BDT 10,000,000
- **Secure Coding Practices**:
  - No hardcoded secrets (all from Vault)
  - Input sanitization (OWASP Java Encoder for HTML, SQL, LDAP)
  - Prepared statements for all database queries
  - Parameterized JPA queries (no native SQL concatenation)
  - Dependency scanning: OWASP Dependency-Check in CI/CD
  - Static analysis: SonarQube with security rules

**Layer 6: Data Security (Encryption & Masking)**
- **Encryption at Rest**:
  - **PostgreSQL**: Transparent Data Encryption (TDE) via AWS RDS or EBS encryption (AES-256)
  - **EBS Volumes**: AWS KMS encryption (CMK: Customer Managed Key)
  - **S3 Buckets** (Velero backups, archived logs): SSE-KMS (Server-Side Encryption with KMS)
  - **MinIO**: Server-side encryption with KMS (SSE-KMS)
  - **Redis**: Encryption at rest via AWS ElastiCache encryption
  - **Kafka**: Encryption at rest (AWS MSK encryption)
- **Field-Level Encryption**:
  - **Sensitive fields**: National ID (NID), mobile number, email, account number
  - **Algorithm**: AES-256-GCM (Authenticated Encryption)
  - **Key Management**: Encryption keys stored in Vault, rotated every 90 days
  - **Example**: NID stored as `encrypt(nid, tenant_encryption_key)` in PostgreSQL
  - **Decryption**: On-demand in application layer (not in database views)
- **Data Masking**:
  - **API responses**: Mask NID (show only last 4 digits: ******7890)
  - **Logs**: Mask sensitive fields (NID, mobile, account number) before logging
  - **Non-production environments**: Anonymize data (random NID, fake names)
- **Encryption in Transit**:
  - All inter-service communication: TLS 1.2+ (optional, via service mesh like Istio)
  - Database connections: TLS enabled (PostgreSQL, Redis, Kafka, Elasticsearch)

**Layer 7: Secrets Management (HashiCorp Vault)**
- **Dynamic Secrets**:
  - PostgreSQL credentials: Generated on-demand per pod, TTL 1 hour
  - Redis credentials: Rotated every 24 hours
  - OAuth client secrets: Rotated every 90 days
- **Static Secrets**:
  - API keys (SMS Gateway, Payment Gateway): Stored in Vault, versioned
  - TLS certificates: Private keys stored in Vault
  - Encryption keys: Master encryption key in Vault (wrapped by AWS KMS)
- **Vault Integration**:
  - **CSI Driver**: Kubernetes Secrets Store CSI Driver mounts Vault secrets as volumes
  - **Example**: Pod spec includes volumeMount from Vault secret path `secret/ulms/postgresql`
  - **Automatic Rotation**: Sidecar container refreshes secrets before TTL expires
- **Access Control**:
  - Vault policies: Each microservice has dedicated policy (least privilege)
  - Authentication: Kubernetes Service Account JWT → Vault Kubernetes auth
  - Audit logging: All Vault access logged to Elasticsearch (10-year retention)

**Layer 8: Audit & Monitoring (Security Observability)**
- **Audit Logging**:
  - **What to log**: All authentication attempts, authorization failures, data access, configuration changes, admin actions
  - **Log format**: JSON with fields: timestamp, userId, tenantId, action, resource, result, ipAddress, userAgent
  - **Example**: `{"timestamp": "2026-02-05T10:30:00Z", "userId": "user-123", "tenantId": "bank_001", "action": "loan.approve", "loanId": 12345, "amount": 500000, "result": "SUCCESS", "ipAddress": "103.x.x.x"}`
  - **Immutability**: Logs sent to Elasticsearch with index lifecycle policy (no updates/deletes)
  - **Retention**: 10 years (Bangladesh Bank compliance)
  - **Storage**: 90 days in Elasticsearch (hot), 10 years in AWS S3 Glacier (cold)
- **Security Monitoring**:
  - **Failed login attempts**: Alert if > 5 failures in 5 minutes from same IP (brute force)
  - **Unauthorized access**: Alert on HTTP 403 Forbidden (authorization failures)
  - **Anomalous behavior**: Alert if user accesses > 1000 borrower records in 1 hour (data exfiltration)
  - **Privilege escalation**: Alert if user role changes from LOAN_OFFICER to ADMIN
  - **Suspicious API calls**: Alert if API calls from unexpected geographic location
- **SIEM Integration** (Optional):
  - Forward logs to Security Information and Event Management (SIEM) system
  - Correlation rules for threat detection
  - Integration with Bangladesh Bank CSIRT (Computer Security Incident Response Team)
- **Compliance Auditing**:
  - **ICT Guidelines V4.0 Checklist**: Automated compliance checks in CI/CD
  - **BRPD 15/2024 Compliance**: Quarterly audit reports
  - **Penetration Testing**: Annual third-party pen test, remediation within 30 days
  - **Vulnerability Scanning**: Weekly automated scans with Nessus or Qualys

#### Authentication Flow Diagram

**OAuth 2.0 Authorization Code Flow** (for web apps):

```
┌──────────┐                                          ┌──────────┐
│  User    │                                          │ Keycloak │
│ (Browser)│                                          │  (IdP)   │
└──────────┘                                          └──────────┘
     │                                                      │
     │  1. GET /auth/login (click login button)           │
     ├───────────────────────────────────────────────────►│
     │                                                      │
     │  2. Redirect to Keycloak login page                │
     │◄───────────────────────────────────────────────────┤
     │                                                      │
     │  3. POST /auth/realms/ulms/protocol/openid-connect/auth
     │     {username, password}                            │
     ├───────────────────────────────────────────────────►│
     │                                                      │
     │  4. Keycloak validates credentials                  │
     │                 [Auth DB check]                     │
     │                                                      │
     │  5. Redirect to callback URL with authorization code│
     │◄───────────────────────────────────────────────────┤
     │     https://app.ulms.com/callback?code=abc123       │
     │                                                      │
     │  6. POST /api/v1/auth/token {code: abc123}         │
     ├───────────────────────────────────────────────────►│
     │                                                      │
     │  7. Keycloak exchanges code for tokens              │
     │     {access_token (JWT), refresh_token}            │
     │◄───────────────────────────────────────────────────┤
     │                                                      │
     │  8. Store tokens in browser (sessionStorage)       │
     │                                                      │
     │  9. API request with Bearer token                   │
     │     Authorization: Bearer <access_token>            │
     ├───────────────────────────────────────────────────►│
     │                                                   ┌──────────┐
     │                                                   │   Kong   │
     │                                                   │ Gateway  │
     │                                                   └──────────┘
     │                                                      │
     │  10. Kong validates JWT signature                   │
     │      (RSA public key from Keycloak JWKS)            │
     │                                                      │
     │  11. Kong extracts claims and forwards              │
     │      to microservice                                │
     │                                                   ┌──────────┐
     │                                                   │Fineract/ │
     │                                                   │Micro-    │
     │                                                   │service   │
     │                                                   └──────────┘
     │                                                      │
     │  12. Microservice checks permissions                │
     │      @PreAuthorize("hasPermission('loans','create')")│
     │                                                      │
     │  13. Success response                                │
     │◄─────────────────────────────────────────────────────┤
```

#### Security Controls Matrix

| Layer | Control | Technology | Standard/Compliance |
|-------|---------|------------|---------------------|
| 1. Perimeter | WAF | AWS WAF | OWASP Top 10 |
| 1. Perimeter | DDoS Protection | AWS Shield | ICT V4.0 Section 5.2 |
| 1. Perimeter | IP Whitelisting | Security Groups | Bangladesh Bank guideline |
| 2. Transport | TLS 1.3 | ALB, cert-manager | PCI-DSS 4.0 |
| 2. Transport | mTLS | Client certificates | Bangladesh Bank CIB requirement |
| 3. Authentication | OAuth 2.0 / OIDC | Keycloak 23 | OpenID Connect Core 1.0 |
| 3. Authentication | MFA | Keycloak OTP | NIST SP 800-63B |
| 3. Authentication | JWT | RS256 signature | RFC 7519 |
| 4. API Security | Rate Limiting | Kong | OWASP API Security Top 10 |
| 4. API Security | CORS | Kong | W3C CORS Spec |
| 4. API Security | Input Validation | Kong + Spring | OWASP Input Validation |
| 5. Application | RBAC | Spring Security | ICT V4.0 Section 4.1 |
| 5. Application | Approval Limits | Workflow Service | BRPD 15/2024 |
| 5. Application | Secure Coding | SonarQube | OWASP Secure Coding |
| 6. Data | Encryption at Rest | AWS KMS (AES-256) | ICT V4.0 Section 6.2 |
| 6. Data | Field-Level Encryption | AES-256-GCM | PCI-DSS Requirement 3 |
| 6. Data | Data Masking | Custom interceptors | GDPR (if applicable) |
| 7. Secrets | Dynamic Secrets | HashiCorp Vault 1.15 | CIS Kubernetes Benchmark |
| 7. Secrets | Key Rotation | Vault policies | NIST SP 800-57 |
| 8. Audit | Audit Logging | Elasticsearch, S3 | ICT V4.0 Section 7.1 |
| 8. Audit | SIEM | Optional | ISO 27001 |
| 8. Audit | Compliance Checks | Automated | Bangladesh Bank guidelines |

#### Annotations and Labels

- **Security standard** for each control (OWASP, PCI-DSS, ICT V4.0)
- **Encryption algorithms** (AES-256, TLS 1.3, RS256)
- **Authentication protocol** (OAuth 2.0, OIDC, mTLS)
- **Compliance mapping** (ICT Guidelines section numbers)
- **Threat mitigation** (which threats each layer prevents)

#### Color Coding

- **Layer 1 (Perimeter)**: Red (#FFCDD2) - Highest risk zone
- **Layer 2 (Transport)**: Orange (#FFE0B2)
- **Layer 3 (AuthN/AuthZ)**: Yellow (#FFF9C4)
- **Layer 4 (API Security)**: Light Green (#C8E6C9)
- **Layer 5 (Application)**: Green (#A5D6A7)
- **Layer 6 (Data)**: Light Blue (#BBDEFB)
- **Layer 7 (Secrets)**: Blue (#90CAF9)
- **Layer 8 (Audit)**: Purple (#CE93D8)

#### Layout Suggestions

**Vertical layered layout** (top to bottom) like an onion or castle walls:
- Each layer wraps around the inner layers
- Arrows showing attack vectors blocked at each layer
- Center: Protected data (PostgreSQL with encrypted data)

**OAuth 2.0 flow**: Separate sequence diagram showing step-by-step authentication

#### Recommended Tools

- **Draw.io**: Layered security architecture templates
- **Lucidchart**: Security architecture diagrams
- **Microsoft Visio**: Security templates (castle & moat model)
- **Threat modeling tools**: Microsoft Threat Modeling Tool (optional, for threat analysis)

#### Implementation Notes

1. **Defense in Depth**: Show how multiple layers protect against single point of failure
2. **Attack Scenarios**: Annotate how each layer mitigates specific attacks (SQL injection blocked at Layer 4 and 5, DDoS at Layer 1, etc.)
3. **Compliance Mapping**: Cross-reference each control with Bangladesh Bank ICT Guidelines sections
4. **Validation**: Security architect review, penetration test validation

---

### 4.6 DAD-06: CI/CD Pipeline Flow

#### Purpose

**DAD-06** illustrates the **complete software delivery pipeline** from developer code commit through automated build, test, security scanning, artifact creation, GitOps deployment, and post-deployment monitoring. This diagram shows deployment strategies (rolling update, blue-green, canary), approval gates, rollback mechanisms, and integration with monitoring for automated rollback triggers.

**Target Audience**: DevOps engineers, SREs, developers, release managers, QA engineers

#### Diagram Type

- **Pipeline flow diagram** with 6 stages
- **Horizontal left-to-right flow**
- **Swimlanes** for different environments (development, staging, production)
- **Large format** for detailed pipeline steps

#### Components to Show

**Stage 1: Code Commit & Trigger**
- **Developer Workstation**:
  - Developer writes code (IntelliJ IDEA, VS Code)
  - Runs local unit tests: `mvn test`
  - Commits code to feature branch: `git commit -m "Add CIB inquiry caching"`
  - Pushes to GitLab: `git push origin feature/cib-caching`
- **GitLab Repository**:
  - Repository: https://gitlab.example.com/ulms/cib-service
  - Branches: main (production), staging, develop, feature/*
  - Merge Request created: feature/cib-caching → develop
- **GitLab CI Trigger**:
  - Webhook triggers GitLab CI pipeline on push
  - Pipeline definition: `.gitlab-ci.yml` in repository root

**Stage 2: Build & Test (GitLab CI)**
- **Job 1: Build**:
  - Runner: Docker executor (gitlab-runner on Kubernetes)
  - Commands:
    ```bash
    mvn clean compile
    mvn package -DskipTests
    ```
  - Duration: ~2 minutes
  - Artifact: `cib-service-1.0.0-SNAPSHOT.jar`

- **Job 2: Unit Tests**:
  - Commands:
    ```bash
    mvn test
    mvn jacoco:report
    ```
  - Coverage requirement: > 80%
  - Duration: ~3 minutes
  - Artifact: JUnit test results, JaCoCo coverage report

- **Job 3: Integration Tests**:
  - Spins up Docker containers: PostgreSQL, Redis (test containers)
  - Commands:
    ```bash
    mvn verify -P integration-tests
    ```
  - Duration: ~5 minutes
  - Artifact: Integration test results

- **Job 4: Code Quality**:
  - SonarQube analysis:
    ```bash
    mvn sonar:sonar \
      -Dsonar.projectKey=ulms-cib-service \
      -Dsonar.host.url=https://sonarqube.example.com \
      -Dsonar.login=${SONAR_TOKEN}
    ```
  - Quality Gate: No new bugs, code smells < 10, coverage > 80%, security hotspots = 0
  - Duration: ~2 minutes
  - Fail pipeline if Quality Gate fails

- **Job 5: Security Scanning**:
  - **OWASP Dependency-Check**:
    ```bash
    mvn dependency-check:check
    ```
    - Scans for known vulnerabilities (CVE database)
    - Fail if high/critical vulnerabilities found
  - **Trivy** (container image scanning):
    ```bash
    trivy image --severity HIGH,CRITICAL cib-service:latest
    ```
  - **Snyk** (optional, for real-time vulnerability monitoring)
  - Duration: ~3 minutes

- **Job 6: Build Docker Image**:
  - Dockerfile:
    ```dockerfile
    FROM eclipse-temurin:21-jre-alpine
    COPY target/cib-service-1.0.0-SNAPSHOT.jar /app/app.jar
    ENTRYPOINT ["java", "-jar", "/app/app.jar"]
    ```
  - Commands:
    ```bash
    docker build -t registry.example.com/ulms/cib-service:${CI_COMMIT_SHA} .
    docker tag registry.example.com/ulms/cib-service:${CI_COMMIT_SHA} \
               registry.example.com/ulms/cib-service:latest
    ```
  - Duration: ~2 minutes

- **Job 7: Push Docker Image**:
  - Commands:
    ```bash
    docker login registry.example.com -u ${REGISTRY_USER} -p ${REGISTRY_PASSWORD}
    docker push registry.example.com/ulms/cib-service:${CI_COMMIT_SHA}
    docker push registry.example.com/ulms/cib-service:latest
    ```
  - Registry: Private Docker registry (GitLab Container Registry or AWS ECR)
  - Duration: ~1 minute

**Total Stage 2 Duration**: ~18 minutes (jobs run in parallel where possible)

**Stage 3: Manual Approval for Production**
- **Merge Request Approval**:
  - Developer creates Merge Request: feature/cib-caching → main
  - Reviewers: 2 required (tech lead + senior developer)
  - Review checklist:
    - Code quality (SonarQube report)
    - Test coverage (JaCoCo report)
    - Security scan (no high/critical vulnerabilities)
    - Functional changes documented
  - Approval: Both reviewers approve MR
  - Merge: Squash and merge to main branch
- **Production Deployment Trigger**:
  - Manual trigger in GitLab CI (button click: "Deploy to Production")
  - Or: Automatic deployment on merge to main (if configured)

**Stage 4: GitOps Deployment (ArgoCD)**
- **Git Repository Update**:
  - Separate GitOps repo: https://gitlab.example.com/ulms/gitops-manifests
  - Kustomize structure:
    ```
    base/
      deployment.yaml
      service.yaml
      hpa.yaml
    overlays/
      production/
        kustomization.yaml (sets image tag)
      staging/
        kustomization.yaml
    ```
  - Update `overlays/production/kustomization.yaml`:
    ```yaml
    images:
    - name: cib-service
      newTag: ${CI_COMMIT_SHA}
    ```
  - Commit and push to GitOps repo

- **ArgoCD Sync**:
  - ArgoCD Application monitors GitOps repo
  - Detects change in `overlays/production/`
  - Sync policy: Automated (self-heal enabled, prune enabled)
  - ArgoCD applies Kubernetes manifests:
    ```bash
    kubectl apply -k overlays/production
    ```
  - Deployment strategy: Rolling Update
    ```yaml
    strategy:
      type: RollingUpdate
      rollingUpdate:
        maxSurge: 1
        maxUnavailable: 0
    ```
  - Health Check: Readiness probe must pass for new pod
  - Duration: ~5 minutes (3 replicas updated one by one)

- **ArgoCD Deployment Status**:
  - Status: Synced, Healthy
  - All pods running: cib-service-xxx (3/3 Ready)

**Stage 5: Post-Deployment Monitoring**
- **Smoke Tests** (Automated):
  - GitLab CI job: `smoke-tests-production`
  - Commands:
    ```bash
    curl -f https://api.ulms.example.com/health/cib-service || exit 1
    curl -f https://api.ulms.example.com/api/v1/cib/healthcheck || exit 1
    ```
  - Duration: ~1 minute
  - If smoke tests fail → Alert and consider rollback

- **Prometheus Monitoring**:
  - Metrics tracked:
    - `up{job="cib-service"}` (service availability)
    - `http_requests_total` (request count)
    - `http_request_duration_seconds` (latency)
    - `http_requests_total{status=~"5.."}` (error rate)
  - Alert rules:
    - **High Error Rate**: `rate(http_requests_total{status=~"5.."}[5m]) > 0.05` (> 5% errors for 5 minutes)
    - **High Latency**: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2` (p95 latency > 2s)
    - **Pod Restart Loop**: `rate(kube_pod_container_status_restarts_total[15m]) > 0` (pods restarting)

- **Grafana Dashboard**:
  - Dashboard: "CIB Service Production Deployment"
  - Panels: Request rate, error rate, latency (p50, p95, p99), pod status

- **Alertmanager**:
  - If alert triggered → Send to Slack #deployments channel
  - If CRITICAL alert → PagerDuty escalation

**Stage 6: Rollback (Automatic or Manual)**
- **Automatic Rollback Triggers**:
  - Error rate > 5% for 5 minutes
  - Pod crash loop (CrashLoopBackOff status)
  - Readiness probe failures > 50% of pods
  - Alert from Prometheus triggers webhook to ArgoCD

- **Rollback Process**:
  - **GitOps Rollback**:
    - Revert commit in GitOps repo:
      ```bash
      git revert HEAD
      git push origin main
      ```
    - ArgoCD detects revert, syncs to previous version
  - **Kubernetes Rollback** (if needed):
    ```bash
    kubectl rollout undo deployment/cib-service -n ulms-production
    ```
  - Duration: ~3 minutes (fast rollback to previous stable version)

- **Post-Rollback**:
  - Notify team in Slack: "CIB Service production deployment rolled back due to high error rate"
  - Incident postmortem: Analyze root cause, update runbook

**Alternative Deployment Strategies**

**Blue-Green Deployment** (for major releases):
1. Deploy new version (green) alongside old version (blue)
2. Green environment: `cib-service-green` deployment (same replicas as blue)
3. Test green environment in production (internal traffic only)
4. Switch traffic: Update Service selector from `version: blue` to `version: green`
5. Monitor for 30 minutes
6. If stable → Delete blue deployment
7. If issues → Switch back to blue (instant rollback)

**Canary Deployment** (for gradual rollout):
1. Deploy canary: 1 pod with new version alongside 3 pods with old version
2. Traffic split: 25% to canary, 75% to stable (using Istio or NGINX weighted routing)
3. Monitor canary metrics for 15 minutes
4. If stable → Increase canary to 50%, then 100%
5. If issues → Remove canary pods (rollback)
6. Duration: ~45 minutes for full rollout

#### Pipeline Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         CI/CD PIPELINE FLOW                                      │
└──────────────────────────────────────────────────────────────────────────────────┘

 ┌─────────────┐       ┌──────────────────────────────────────┐       ┌──────────┐
 │  Developer  │──────►│        Stage 1: Code Commit          │──────►│ GitLab   │
 │ Workstation │       │  - Git commit & push                 │       │   Repo   │
 └─────────────┘       │  - Merge Request created             │       └──────────┘
                       └──────────────────────────────────────┘            │
                                                                             │ Webhook
                                                                             ▼
                       ┌──────────────────────────────────────┐       ┌──────────┐
                       │    Stage 2: Build & Test (CI)        │       │ GitLab CI│
                       │  1. Build (mvn package)              │       │  Runner  │
                       │  2. Unit Tests (mvn test)            │       └──────────┘
                       │  3. Integration Tests                │
                       │  4. Code Quality (SonarQube)         │       ⏱ ~18 min
                       │  5. Security Scan (OWASP, Trivy)     │
                       │  6. Build Docker Image               │       ✅ PASS
                       │  7. Push to Registry                 │       ❌ FAIL → Stop
                       └──────────────────────────────────────┘
                                      │ SUCCESS
                                      ▼
                       ┌──────────────────────────────────────┐
                       │  Stage 3: Manual Approval (Prod)     │       🙋 Reviewers
                       │  - Merge Request Review (2 approvers)│
                       │  - Merge to main branch              │       ⏱ Human decision
                       │  - Click "Deploy to Production"      │
                       └──────────────────────────────────────┘
                                      │ APPROVED
                                      ▼
                       ┌──────────────────────────────────────┐       ┌──────────┐
                       │   Stage 4: GitOps Deployment         │       │  ArgoCD  │
                       │  - Update GitOps repo (image tag)    │       │  (K8s)   │
                       │  - ArgoCD syncs Kubernetes manifests │       └──────────┘
                       │  - Rolling Update (0 downtime)       │
                       │  - Health checks (readiness probes)  │       ⏱ ~5 min
                       └──────────────────────────────────────┘
                                      │ DEPLOYED
                                      ▼
                       ┌──────────────────────────────────────┐       ┌──────────┐
                       │  Stage 5: Post-Deployment Monitoring  │       │Prometheus│
                       │  - Smoke tests (health endpoints)    │       │ Grafana  │
                       │  - Prometheus metrics collection     │       │ Alerts   │
                       │  - Grafana dashboard monitoring      │       └──────────┘
                       │  - Alert on errors/latency/crashes   │
                       └──────────────────────────────────────┘       ⏱ Continuous
                                      │
                          ┌───────────┴───────────┐
                          │ Metrics OK?           │
                          └───────────┬───────────┘
                                      │
                          ┌───────────┴───────────┐
                      YES │                       │ NO (Error rate > 5%)
                          ▼                       ▼
                   ┌────────────┐         ┌──────────────────────┐
                   │  SUCCESS   │         │  Stage 6: ROLLBACK   │    🔴 CRITICAL
                   │ Deployment │         │  - Revert GitOps repo│
                   │  Complete  │         │  - ArgoCD syncs old  │
                   └────────────┘         │  - OR kubectl undo   │    ⏱ ~3 min
                                          │  - Notify team       │
                                          └──────────────────────┘
```

#### Deployment Strategies Comparison

| Strategy | Traffic Shift | Rollback Speed | Resource Usage | Use Case |
|----------|---------------|----------------|----------------|----------|
| **Rolling Update** | Gradual (pod by pod) | Fast (~3 min) | 100% + 1 pod (maxSurge) | Default strategy, routine updates |
| **Blue-Green** | Instant (service switch) | Instant (< 1 min) | 200% (double resources) | Major releases, database migrations |
| **Canary** | Gradual (% based) | Fast (~3 min) | 100% + 25% canary | High-risk changes, A/B testing |
| **Recreate** | Downtime (delete all first) | Fast (redeploy old) | 100% | Stateful apps, maintenance window |

#### Annotations and Labels

- **Stage duration** for each stage (e.g., "~18 min", "~5 min")
- **Success/Failure indicators** (green checkmark, red X)
- **Approval gates** (human decision points)
- **Automated vs manual** steps clearly labeled
- **Rollback triggers** (error rate > 5%, pod crash, etc.)
- **Monitoring metrics** (request rate, error rate, latency)

#### Color Coding

- **Development environment**: Light Green (#C8E6C9)
- **Staging environment**: Yellow (#FFF9C4)
- **Production environment**: Blue (#BBDEFB)
- **Success path**: Green arrows
- **Failure path**: Red arrows
- **Rollback path**: Orange dashed arrows
- **Manual approval**: Yellow box with human icon

#### Layout Suggestions

**Horizontal left-to-right flow**:
1. **Left**: Developer (code commit)
2. **Center-left**: Build & Test (CI)
3. **Center**: Approval gate
4. **Center-right**: Deployment (ArgoCD)
5. **Right**: Monitoring & Rollback

**Swimlanes** for environments (top to bottom):
- Lane 1: Development (feature branches)
- Lane 2: Staging (automatic deployment)
- Lane 3: Production (manual approval required)

#### Recommended Tools

- **Draw.io**: Pipeline flow diagrams
- **Lucidchart**: CI/CD pipeline templates
- **PlantUML**: Activity diagrams for pipelines
- **Mermaid**: Markdown-based flowcharts
- **GitLab CI/CD Visualizer**: Built-in pipeline graph

#### Implementation Notes

1. **GitLab CI `.gitlab-ci.yml`** example:
   ```yaml
   stages:
     - build
     - test
     - quality
     - security
     - package
     - deploy

   build:
     stage: build
     script:
       - mvn clean compile

   test:
     stage: test
     script:
       - mvn test
       - mvn jacoco:report
     coverage: '/Total.*?([0-9]{1,3})%/'

   sonarqube:
     stage: quality
     script:
       - mvn sonar:sonar

   deploy-production:
     stage: deploy
     when: manual
     only:
       - main
     script:
       - kubectl apply -k overlays/production
   ```

2. **ArgoCD Application** example:
   ```yaml
   apiVersion: argoproj.io/v1alpha1
   kind: Application
   metadata:
     name: cib-service-production
   spec:
     project: ulms
     source:
       repoURL: https://gitlab.example.com/ulms/gitops-manifests
       targetRevision: main
       path: overlays/production
     destination:
       server: https://kubernetes.default.svc
       namespace: ulms-production
     syncPolicy:
       automated:
         prune: true
         selfHeal: true
   ```

3. **Validation**:
   - DevOps team reviews pipeline stages
   - Verify integration with ArgoCD
   - Test rollback procedure in staging

---

### 4.7 DAD-07: Multi-Tenant Isolation View

#### Purpose

**DAD-07** illustrates **how 62+ banks are isolated at infrastructure, data, and application levels** in the ULMS multi-tenant SaaS architecture. This diagram shows tenant onboarding, schema-per-tenant data isolation, tenant context propagation, and resource sharing/isolation strategies. It's critical for understanding how data security and tenant isolation are achieved.

**Target Audience**: Solution architects, database administrators, security architects, compliance officers, tenant administrators

#### Diagram Type

- **Layered isolation diagram** showing 4 isolation levels
- **Tenant onboarding flow** diagram
- **Portrait or landscape orientation**

#### Components to Show

**Tenant Onboarding Flow** (Automated Provisioning)

1. **Admin Portal** (React Web App):
   - Form: Create New Tenant
   - Inputs: Bank name, bank code, admin email, plan (Bronze/Silver/Gold)
   - Button: "Create Tenant"

2. **Fineract API**:
   - POST /api/v1/admin/tenants
   - Payload: `{name: "Dhaka Bank", code: "bank_062", adminEmail: "admin@dhakabank.com", plan: "GOLD"}`

3. **Tenant Provisioning Service** (background job):
   - Step 1: Validate tenant data (unique code, valid email)
   - Step 2: Create database schema
   - Step 3: Run database migrations
   - Step 4: Create Kafka topics
   - Step 5: Create MinIO bucket
   - Step 6: Create Keycloak realm
   - Step 7: Create default admin user
   - Step 8: Send welcome email

**Step 2: Create Database Schema (PostgreSQL)**
```sql
-- Executed by Tenant Provisioning Service
CREATE SCHEMA bank_062;

-- Set search_path for tenant-specific operations
SET search_path TO bank_062;

-- Create all tables in tenant schema
CREATE TABLE loan_account (...);
CREATE TABLE borrower (...);
CREATE TABLE transaction (...);
CREATE TABLE workflow_instance (...);
-- 50+ tables created per tenant
```

**Step 3: Run Database Migrations (Flyway)**
- Migrations located in: `db/migration/tenant/V1__initial_schema.sql`
- Flyway executes all migration scripts in tenant schema
- Version tracking: `bank_062.flyway_schema_history` table

**Step 4: Create Kafka Topics**
```bash
# Topic naming convention: {tenantId}.{topic-name}
kafka-topics.sh --create --topic bank_062.loan-application-submitted --partitions 3 --replication-factor 3
kafka-topics.sh --create --topic bank_062.loan-disbursed --partitions 3 --replication-factor 3
kafka-topics.sh --create --topic bank_062.payment-completed --partitions 3 --replication-factor 3
kafka-topics.sh --create --topic bank_062.workflow-started --partitions 3 --replication-factor 3
```

**Step 5: Create MinIO Bucket**
```bash
# Bucket naming convention: {tenantId}-documents
mc mb minio/bank-062-documents
mc policy set download minio/bank-062-documents  # Private, authenticated access only
```

**Step 6: Create Keycloak Realm**
- Realm name: `bank-062`
- Clients: `ulms-web-app`, `ulms-mobile-app`, `ulms-api`
- Roles: ADMIN, MANAGER, LOAN_OFFICER, TELLER, CUSTOMER
- Default admin user: admin@dhakabank.com

**4 Levels of Multi-Tenant Isolation**

**Level 1: Infrastructure-Level Isolation**
- **Compute (Kubernetes Pods)**: **SHARED**
  - All tenants share Fineract pods, CIB Service pods, etc.
  - No dedicated pods per tenant (cost optimization)
  - HPA scales based on aggregate load from all tenants

- **Network**: **SHARED**
  - All tenants share Kong Gateway, NGINX Ingress
  - Same VPC, same subnets, same security groups
  - NetworkPolicies apply to all tenants equally

- **Monitoring**: **ISOLATED** (logical isolation via labels)
  - Prometheus metrics include `tenant_id` label
  - Grafana dashboards filterable by tenant
  - Example metric: `http_requests_total{service="fineract", tenant_id="bank_062"}`
  - Each tenant can view only their own metrics (RBAC in Grafana)

**Level 2: Data-Level Isolation (Schema-Per-Tenant)**
- **PostgreSQL**: **ISOLATED** (schema per tenant)
  - Tenant 1 (Sonali Bank): `bank_001` schema (50+ tables)
  - Tenant 2 (Rupali Bank): `bank_002` schema (50+ tables)
  - Tenant 62 (Dhaka Bank): `bank_062` schema (50+ tables)
  - Connection pooling: Shared connection pool, schema switched per request
  - Row-Level Security (RLS): Not used (schema isolation sufficient)
  - Cross-tenant queries: **PREVENTED** (application enforces single schema access)

- **Redis**: **ISOLATED** (keyspace per tenant)
  - Key naming convention: `{tenantId}:{entity}:{id}`
  - Example: `bank_062:session:user-12345`, `bank_062:cache:borrower:67890`
  - Redis Cluster: All tenants share 6 nodes, keys distributed by hash slot
  - TTL: Varies by use case (session: 1 hour, cache: 15 minutes)

- **Kafka**: **ISOLATED** (topic per tenant)
  - Topic naming: `{tenantId}.{event-type}`
  - Consumer groups: Shared consumers read from all tenant topics (multiplexed)
  - Partition assignment: Kafka automatically distributes partitions
  - Retention: 7 days (all topics)

- **MinIO**: **ISOLATED** (bucket per tenant)
  - Bucket: `bank-062-documents`
  - Access control: IAM policies restrict bucket access to tenant
  - Encryption: Server-side encryption (SSE-KMS) with tenant-specific key
  - Quota: Based on plan (Bronze: 100GB, Silver: 500GB, Gold: 2TB)

- **Elasticsearch**: **ISOLATED** (index per tenant)
  - Index naming: `ulms-logs-bank-062-2026.02.05` (daily index per tenant)
  - Index lifecycle: 90 days in hot tier, then archived to S3
  - Search: Tenant-scoped searches only (tenantId filter in all queries)

**Level 3: Application-Level Isolation (Tenant Context)**
- **Tenant Context Resolver** (Spring Boot component):
  ```java
  @Component
  public class TenantContextResolver {
      public void setTenantContext(String tenantId) {
          // Set PostgreSQL schema for this request
          jdbcTemplate.execute("SET search_path TO " + tenantId);

          // Store tenant ID in thread-local storage
          TenantContext.setCurrentTenant(tenantId);
      }
  }
  ```

- **JWT Token Includes Tenant ID**:
  ```json
  {
    "sub": "user-12345",
    "tenantId": "bank_062",
    "roles": ["LOAN_OFFICER"],
    ...
  }
  ```

- **Kong Gateway Extracts Tenant ID**:
  - Kong plugin reads JWT, extracts `tenantId`
  - Adds header: `X-Tenant-Id: bank_062`
  - Forwards to microservice

- **Microservice Processes Request**:
  ```java
  @RestController
  public class LoanController {
      @GetMapping("/api/v1/loans")
      public List<Loan> getLoans(@RequestHeader("X-Tenant-Id") String tenantId) {
          tenantContextResolver.setTenantContext(tenantId);  // Set schema
          return loanService.getAllLoans();  // Queries bank_062.loan_account table
      }
  }
  ```

- **Data Access**: All JPA/Hibernate queries automatically use tenant schema
  ```sql
  -- Automatically executed in bank_062 schema
  SELECT * FROM loan_account WHERE status = 'ACTIVE';

  -- Fully qualified:
  SELECT * FROM bank_062.loan_account WHERE status = 'ACTIVE';
  ```

**Level 4: Authentication & Authorization Isolation**
- **Keycloak Realms**: **ISOLATED** (realm per tenant)
  - Realm: `bank-062` (separate user database per tenant)
  - Users in `bank-062` realm cannot access `bank-001` realm
  - SSO: Each tenant has separate SSO configuration (optional)
  - MFA: Tenant-specific MFA policies

- **RBAC**: **ISOLATED** (roles and permissions per tenant)
  - User ID 100 in `bank_062` is different from User ID 100 in `bank_001`
  - Roles are tenant-scoped (ADMIN in bank_062 ≠ ADMIN in bank_001)

**Resource Sharing vs Isolation Matrix**

| Resource | Sharing Model | Isolation Mechanism | Cost Efficiency | Security |
|----------|---------------|---------------------|-----------------|----------|
| **Kubernetes Pods** | Shared | None (all tenants use same pods) | ✅ High (3-20 pods for all tenants) | ⚠️ Medium (logical isolation only) |
| **Kong Gateway** | Shared | None | ✅ High | ✅ High (JWT validation) |
| **PostgreSQL** | Shared instance | Schema per tenant | ✅ High (1 cluster for all tenants) | ✅ High (schema isolation + RBAC) |
| **Redis** | Shared cluster | Key prefix per tenant | ✅ High | ⚠️ Medium (key naming convention) |
| **Kafka** | Shared cluster | Topic per tenant | ✅ High | ✅ High (topic ACLs) |
| **MinIO** | Shared cluster | Bucket per tenant | ✅ High | ✅ High (bucket policies) |
| **Elasticsearch** | Shared cluster | Index per tenant | ✅ High | ✅ High (index-level security) |
| **Keycloak** | Shared instance | Realm per tenant | ✅ High | ✅ High (complete user isolation) |
| **Vault** | Shared cluster | Path per tenant | ✅ High | ✅ High (policy-based access) |

**Tenant Scaling**
- **Horizontal Scaling**: HPA scales pods based on aggregate CPU/memory across all tenants
  - If bank_001 has traffic spike → Fineract scales from 3 to 10 pods (benefits all tenants)
- **Vertical Scaling**: Not applicable (stateless pods)
- **Data Growth**: PostgreSQL schema can grow independently per tenant
  - bank_001 schema: 500 GB
  - bank_062 schema: 50 GB (new tenant)
  - Total database size: Sum of all schema sizes

**Cross-Tenant Operations** (Admin only)
- **Use Case**: Platform admin views all tenants' health metrics
- **Implementation**:
  - Admin user has `platform_admin` role (not tenant-scoped)
  - Special Grafana dashboard aggregates metrics across all tenants
  - Example query: `sum by (tenant_id) (http_requests_total)`
- **Security**: Only platform admins can access cross-tenant data

#### Annotations and Labels

- **Tenant ID** prominently displayed in all components
- **Isolation boundaries** (dashed lines around schema, bucket, realm)
- **Shared vs Isolated** clearly labeled for each resource
- **Tenant context flow** (JWT → Kong → Microservice → Database schema)
- **Resource quotas** per plan (Bronze, Silver, Gold)

#### Color Coding

- **Shared resources**: Yellow (#FFF9C4)
- **Isolated resources**: Green (#C8E6C9)
- **Tenant-specific data**: Blue (#BBDEFB)
- **Admin operations**: Red (#FFCDD2)

#### Layout Suggestions

**Top section**: Tenant onboarding flow (horizontal sequence)
**Middle section**: 4 levels of isolation (vertical layers)
**Bottom section**: Resource sharing matrix (table)

#### Recommended Tools

- **Draw.io**: Multi-layer diagrams
- **Lucidchart**: Tenant isolation templates
- **PlantUML**: Component diagrams with annotations

#### Implementation Notes

1. **Schema-per-tenant** is the most robust isolation strategy for relational data
2. **Shared compute** reduces costs but requires strong application-level security
3. **Tenant context** must be set on EVERY request to prevent data leakage
4. **Validation**: Security team should audit tenant isolation mechanisms

---

### 4.8 DAD-08: Integration Architecture

#### Purpose

**DAD-08** shows **all 7 external system integrations** with protocols, authentication methods, security controls, timeout/retry configurations, and circuit breaker patterns. This diagram is essential for understanding how ULMS connects to external systems like Bangladesh Bank CIB, NID Wing, CBS, Payment Gateways, and regulatory reporting systems.

**Target Audience**: Integration architects, solution architects, API developers, security engineers, business analysts

#### Diagram Type

- **Integration topology diagram** with ULMS at center and 7 external systems around it
- **Hub-and-spoke layout**
- **Large format** for detailed integration specifications

#### Integrations to Show

**Integration 1: Bangladesh Bank CIB (Credit Bureau)**

**Purpose**: Real-time credit inquiry for borrower creditworthiness

**Topology**:
- ULMS CIB Service → VPN Gateway (IPSec tunnel) → Bangladesh Bank CIB API
- Fallback: Monthly SFTP batch download of CIB database

**Protocol**: REST over HTTPS with mTLS
- **URL**: https://cib.bb.org.bd/api/v1/inquiry (example)
- **Method**: POST
- **Request**:
  ```json
  {
    "nid": "1234567890",
    "inquiryDate": "2026-02-05",
    "bankCode": "001",
    "purpose": "LOAN_APPLICATION"
  }
  ```
- **Response**:
  ```json
  {
    "nid": "1234567890",
    "creditScore": 720,
    "totalLoans": 2,
    "totalOutstanding": 150000,
    "defaults": 0,
    "lastInquiry": "2025-12-01",
    "status": "ACTIVE"
  }
  ```

**Authentication**: mTLS (Mutual TLS)
- **Client Certificate**: Issued by Bangladesh Bank CA
- **Certificate Location**: Stored in HashiCorp Vault
- **Certificate Renewal**: Every 12 months (manual process)

**Security**:
- VPN tunnel: IPSec with AES-256 encryption
- TLS 1.3 for HTTPS
- IP whitelisting: Bangladesh Bank whitelists ULMS VPN gateway IP

**Timeout & Retry**:
- **Timeout**: 30 seconds (Bangladesh Bank requirement)
- **Retry Policy**: 3 attempts with exponential backoff (5s, 10s, 20s)
- **Circuit Breaker**: Open after 5 consecutive failures, half-open after 60 seconds

**Rate Limiting**: 100 requests/minute per bank (enforced by Bangladesh Bank)

**Error Handling**:
- 200 OK: Success, return credit report
- 404 Not Found: NID not found, return error to user
- 429 Too Many Requests: Rate limit exceeded, cache previous result if available
- 500 Server Error: Bangladesh Bank system down, use cached data if available (with staleness warning)

**Caching**: Redis cache with 1-hour TTL (reduces Bangladesh Bank API calls)

**Monitoring**:
- Prometheus metric: `cib_api_requests_total{status="success|failure"}`
- Alert: CIB API failure rate > 10% for 10 minutes

**Compliance**: All CIB inquiries logged in PostgreSQL audit table (10-year retention)

**Integration 2: NID Wing (e-KYC - National ID Verification)**

**Purpose**: Verify borrower's National ID authenticity

**Topology**: ULMS NID Service → Public Internet → NID Wing API (Government of Bangladesh)

**Protocol**: REST over HTTPS
- **URL**: https://ekycservices.gov.bd/api/v1/verify (example)
- **Method**: POST
- **Request**:
  ```json
  {
    "nid": "1234567890",
    "dob": "1990-01-15",
    "apiKey": "ulms-api-key-xxx"
  }
  ```
- **Response**:
  ```json
  {
    "nid": "1234567890",
    "name": "Md. Rahman",
    "dob": "1990-01-15",
    "address": "Dhaka, Bangladesh",
    "verified": true,
    "photo": "base64-encoded-image"
  }
  ```

**Authentication**: API Key (provided by NID Wing)
- **Header**: `X-API-Key: ulms-api-key-xxx`
- **Key Rotation**: Every 90 days (manual process with NID Wing)

**Security**:
- TLS 1.3 for HTTPS
- API key stored in HashiCorp Vault

**Timeout & Retry**:
- **Timeout**: 30 seconds
- **Retry Policy**: 2 attempts with 5-second delay
- **Circuit Breaker**: Open after 10 consecutive failures

**Rate Limiting**: 1000 requests/day per API key (enforced by NID Wing)

**Error Handling**:
- 200 OK: NID verified, store in PostgreSQL
- 404 Not Found: NID not found, reject loan application
- 401 Unauthorized: Invalid API key, alert admin
- 503 Service Unavailable: NID Wing down, queue request for retry

**Caching**: No caching (NID verification must be real-time for compliance)

**Monitoring**: Track NID verification success rate (target: > 95%)

**Integration 3: Core Banking System (CBS)**

**Purpose**: Account balance inquiry and transaction posting for loan disbursement/collection

**Topology**: ULMS Integration Gateway → Bank's CBS (Finacle, Temenos T24, etc.)

**Protocol**: SOAP over HTTPS
- **URL**: https://cbs.bank.com/services/AccountService (bank-specific)
- **Method**: SOAP request/response (XML)
- **Request** (Balance Inquiry):
  ```xml
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
    <soapenv:Body>
      <GetAccountBalance>
        <accountNumber>1234567890</accountNumber>
      </GetAccountBalance>
    </soapenv:Body>
  </soapenv:Envelope>
  ```
- **Response**:
  ```xml
  <soapenv:Envelope>
    <soapenv:Body>
      <GetAccountBalanceResponse>
        <balance>50000.00</balance>
        <currency>BDT</currency>
      </GetAccountBalanceResponse>
    </soapenv:Body>
  </soapenv:Envelope>
  ```

**Authentication**: Basic Auth (username/password)
- **Header**: `Authorization: Basic base64(username:password)`
- **Credentials**: Stored in HashiCorp Vault per bank

**Security**:
- HTTPS with TLS 1.2+
- IP whitelisting: Bank whitelists ULMS integration gateway IP

**Timeout & Retry**:
- **Timeout**: 60 seconds (CBS can be slow)
- **Retry Policy**: 3 attempts with exponential backoff
- **Idempotency**: Transaction ID in request prevents duplicate postings

**Error Handling**:
- SOAP Fault: Parse error code, return to user
- Timeout: Mark transaction as PENDING, reconcile later
- Duplicate transaction: CBS returns error, ULMS marks as SUCCESS (idempotent)

**Monitoring**: Track CBS integration success rate per bank (target: > 99%)

**Integration 4: Payment Gateways (bKash, Nagad, Rocket)**

**Purpose**: Loan disbursement to borrower's mobile wallet

**Topology**: ULMS Integration Gateway → Payment Gateway API (bKash, Nagad, Rocket)

**Protocol**: REST over HTTPS with OAuth 2.0

**Example (bKash)**:
- **Token URL**: https://api.bkash.com/oauth/token
- **Payment URL**: https://api.bkash.com/v1/payment
- **Method**: POST
- **Request** (Payment):
  ```json
  {
    "amount": 500000,
    "recipient": "01712345678",
    "currency": "BDT",
    "reference": "LOAN-12345",
    "idempotencyKey": "uuid-xxx"
  }
  ```
- **Response**:
  ```json
  {
    "transactionId": "bkash-txn-999",
    "status": "COMPLETED",
    "timestamp": "2026-02-05T10:30:00Z"
  }
  ```

**Authentication**: OAuth 2.0 Client Credentials
- **Step 1**: POST /oauth/token with client_id + client_secret → get access_token
- **Step 2**: Use access_token in Authorization: Bearer header for payment API

**Security**:
- HTTPS with TLS 1.3
- OAuth credentials stored in Vault
- Idempotency key prevents duplicate payments

**Timeout & Retry**:
- **Timeout**: 30 seconds
- **Retry Policy**: 3 attempts (financial transaction, must be idempotent)
- **Circuit Breaker**: Open after 50% failure rate

**Rate Limiting**: 100 payments/minute (bKash limit)

**Webhook** (Optional): bKash can send webhook callback for payment status
- **Webhook URL**: https://api.ulms.com/webhooks/bkash
- **Security**: HMAC signature verification

**Monitoring**: Track payment success rate per gateway (target: > 98%)

**Integration 5: Bangladesh Bank SFTP (Regulatory Reporting)**

**Purpose**: Monthly submission of regulatory reports (CL-1 to CL-5 loan classification)

**Topology**: ULMS Integration Gateway → SFTP Server (sftp.bb.org.bd)

**Protocol**: SFTP over SSH
- **Host**: sftp.bb.org.bd (example)
- **Port**: 22
- **Path**: /reports/bank_001/2026/02/

**Authentication**: SSH Key-based
- **Public Key**: Submitted to Bangladesh Bank during onboarding
- **Private Key**: Stored in HashiCorp Vault
- **Passphrase**: Required for private key

**File Format**: CSV or Excel
- **Filename**: `CL1_BANK001_202602.csv` (classification report 1, Feb 2026)
- **Content**: Loan classification data (Standard, SMA, Substandard, Doubtful, Bad/Loss)
- **Encryption**: GPG encryption with Bangladesh Bank's public key
  ```bash
  gpg --encrypt --recipient bangladesh_bank@bb.org.bd CL1_BANK001_202602.csv
  ```

**Schedule**: Monthly (on or before 15th of following month)

**Process**:
1. BRPD Service generates report from PostgreSQL data
2. Export to CSV file
3. GPG encrypt file
4. SFTP upload to Bangladesh Bank
5. Verify upload success (check for .ack file)

**Error Handling**:
- Connection refused: Retry every hour for 24 hours, then alert admin
- Authentication failed: Alert admin immediately (key issue)
- Upload timeout: Retry 3 times

**Monitoring**: Track SFTP upload success (alert if failed for 3 consecutive days)

**Integration 6: SMS Gateway**

**Purpose**: Send SMS notifications for loan approval, disbursement, payment reminders

**Topology**: ULMS Notification Service → SMS Gateway API (e.g., Twilio, local provider)

**Protocol**: HTTPS POST
- **URL**: https://api.sms-provider.com/v1/send
- **Method**: POST
- **Request**:
  ```json
  {
    "to": "+8801712345678",
    "from": "ULMS",
    "message": "Your loan of BDT 500,000 has been approved. Ref: LOAN-12345",
    "apiKey": "sms-api-key-xxx"
  }
  ```
- **Response**:
  ```json
  {
    "messageId": "sms-msg-999",
    "status": "SENT",
    "cost": 0.05
  }
  ```

**Authentication**: API Key in request body or header

**Rate Limiting**: 100 SMS/minute (configurable)

**Error Handling**:
- 429 Too Many Requests: Queue SMS for delayed sending
- 400 Bad Request: Invalid phone number, log error
- 500 Server Error: Retry 3 times, then mark as FAILED

**Monitoring**: Track SMS delivery rate (target: > 95%)

**Integration 7: Email (AWS SES)**

**Purpose**: Send email notifications and reports

**Topology**: ULMS Notification Service → AWS SES (Simple Email Service)

**Protocol**: AWS SDK (HTTPS)
- **Region**: ap-south-1 (Mumbai)
- **From**: noreply@ulms.example.com
- **To**: User's email address

**Authentication**: IAM Role (no API keys, role-based)

**Rate Limiting**: 50 emails/second (AWS SES quota for production)

**Error Handling**:
- Bounce: Remove email from mailing list
- Complaint: Unsubscribe user
- Throttling: Retry with exponential backoff

**Monitoring**: Track email delivery rate (target: > 98%)

**Integration Gateway (Apache Camel 4.3)**

**Purpose**: Centralized integration hub for all external systems

**Routes**:
- `/cib-inquiry` → Bangladesh Bank CIB API (REST + mTLS)
- `/nid-verify` → NID Wing API (REST + API Key)
- `/cbs-balance` → CBS SOAP API (SOAP + Basic Auth)
- `/payment-bkash` → bKash API (REST + OAuth 2.0)
- `/sftp-upload` → Bangladesh Bank SFTP (SFTP + SSH Key)
- `/send-sms` → SMS Gateway (REST + API Key)
- `/send-email` → AWS SES (SDK + IAM Role)

**Circuit Breaker**: Hystrix pattern for each route
- **Threshold**: 5 consecutive failures
- **Timeout**: 30 seconds
- **Half-open**: After 60 seconds, try 1 request

**Retry Logic**: Exponential backoff with jitter

**Monitoring**: Prometheus metrics for each integration
- `integration_requests_total{service="cib", status="success|failure"}`
- `integration_request_duration_seconds{service="cib", quantile="0.95"}`

#### Annotations and Labels

- **Protocol** for each integration (REST, SOAP, SFTP, SDK)
- **Authentication** method (mTLS, API Key, OAuth 2.0, Basic Auth, SSH Key, IAM Role)
- **Timeout** values
- **Retry policy** (attempts, delay)
- **Circuit breaker** status (open, closed, half-open)
- **Security** (VPN, TLS version, encryption)

#### Color Coding

- **Real-time integrations**: Green (#C8E6C9)
- **Batch integrations**: Yellow (#FFF9C4)
- **Critical integrations**: Red border (#F44336)
- **Optional integrations**: Gray (#EEEEEE)

#### Layout Suggestions

**Hub-and-spoke layout**:
- **Center**: ULMS Integration Gateway (Apache Camel)
- **Spokes**: 7 external systems radiating outward
- **Annotations**: Protocol, auth, timeout on each spoke

#### Recommended Tools

- **Draw.io**: Integration architecture templates
- **Lucidchart**: API integration diagrams
- **Microsoft Visio**: Enterprise integration patterns

#### Implementation Notes

1. **Integration Gateway** centralizes all external integrations (easier monitoring and error handling)
2. **Circuit Breaker** prevents cascading failures
3. **Idempotency** is critical for financial transactions (payments, CBS postings)
4. **Validation**: Test each integration in staging with mock servers before production

---

### 4.9 DAD-09: Disaster Recovery Architecture

#### Purpose

**DAD-09** illustrates the **disaster recovery (DR) topology**, showing primary site (Mumbai), DR site (Singapore), data replication mechanisms, failover process, and recovery procedures. This diagram is critical for business continuity planning and demonstrating compliance with 99.9% uptime SLA.

**Target Audience**: Infrastructure architects, disaster recovery planners, business continuity managers, CTO, compliance officers

#### Diagram Type

- **Multi-site topology diagram** with 2 geographic regions
- **Failover flow diagram**
- **Large landscape format**

#### Components to Show

**Multi-Site Architecture**

**Primary Site: Mumbai Region (ap-south-1)**
- **Availability Zones**: 3 (ap-south-1a, ap-south-1b, ap-south-1c)
- **Kubernetes Cluster**: 18 worker nodes (6 per AZ)
- **Status**: **ACTIVE** (serving production traffic)
- **Components**:
  - Kong Gateway (3-5 replicas) - receiving live traffic
  - Fineract + 8 microservices (3-20 replicas each)
  - PostgreSQL Primary (1 master + 2 local standby in Mumbai AZs)
  - Redis Cluster (6 nodes)
  - Kafka Cluster (3 brokers)
  - MinIO (4 nodes)
  - Elasticsearch (3 nodes)
  - Monitoring: Prometheus, Grafana, ELK Stack
- **DNS**: Route 53 primary record points to Mumbai ALB
  - `api.ulms.example.com` → Mumbai ALB IP (52.91.xx.xx)
- **Traffic**: 100% of user requests

**DR Site: Singapore Region (ap-southeast-1)**
- **Availability Zones**: 2 (ap-southeast-1a, ap-southeast-1b)
- **Kubernetes Cluster**: 6 worker nodes (3 per AZ)
- **Status**: **STANDBY** (ready but not serving traffic)
- **Components**:
  - Kong Gateway (2 replicas) - standby
  - Fineract + 8 microservices (min replicas: 2 each) - standby
  - PostgreSQL Standby (1 replica receiving async replication from Mumbai)
  - Redis Standby (3 nodes receiving replication from Mumbai)
  - Kafka Standby (1 broker with MirrorMaker 2 consuming from Mumbai)
  - MinIO Standby (2 nodes with bucket replication from Mumbai)
  - Elasticsearch Standby (1 node)
  - Monitoring: Prometheus, Grafana (local metrics only)
- **DNS**: Route 53 failover record points to Singapore ALB (inactive)
  - `api.ulms.example.com` → Singapore ALB IP (13.250.xx.xx) [failover]
- **Traffic**: 0% (standby mode)

**Data Replication Strategy**

**PostgreSQL Replication (Patroni + Streaming Replication)**
- **Primary**: Mumbai (1 master + 2 local standby)
- **DR Standby**: Singapore (1 async replica)
- **Replication**: Asynchronous streaming replication over encrypted VPN
  - **Replication Lag**: < 30 seconds (monitored via Prometheus)
  - **RPO (Recovery Point Objective)**: 30 seconds (max data loss)
- **Configuration**:
  ```yaml
  # patroni.yml on DR standby
  standby_cluster:
    host: primary.postgresql.mumbai.internal
    port: 5432
    create_replica_methods:
      - basebackup
    restore_command: 'wal-g wal-fetch %f %p'
  ```
- **Monitoring**: Prometheus metric `pg_replication_lag_seconds` (alert if > 60s)

**Redis Replication**
- **Primary**: Mumbai (6 nodes: 3 masters + 3 replicas)
- **DR Standby**: Singapore (3 nodes: replicas of Mumbai masters)
- **Replication**: Active-passive with Redis Sentinel
- **RPO**: ~ 5 seconds (in-memory replication)

**Kafka Replication (MirrorMaker 2)**
- **Primary**: Mumbai (3 brokers)
- **DR Standby**: Singapore (1 broker)
- **Replication**: MirrorMaker 2 mirrors all topics from Mumbai to Singapore
- **Lag**: < 10 seconds
- **RPO**: 10 seconds

**MinIO Replication**
- **Primary**: Mumbai (4 nodes, 1Ti each = 4Ti total with erasure coding)
- **DR Standby**: Singapore (2 nodes, 1Ti each = 2Ti total)
- **Replication**: Site-to-site bucket replication (async)
  ```bash
  mc replicate add minio-mumbai/bank-001-documents \
    --remote-bucket minio-singapore/bank-001-documents \
    --replicate "delete,delete-marker"
  ```
- **RPO**: < 1 minute (depends on object size and network bandwidth)

**Elasticsearch Replication**
- **Primary**: Mumbai (3 nodes, 200Gi each)
- **DR Standby**: Singapore (1 node, 200Gi)
- **Replication**: Cross-cluster replication (CCR)
- **Lag**: < 30 seconds
- **RPO**: 30 seconds (logs only, acceptable for DR)

**Velero Cluster Backups**
- **Primary**: Mumbai Kubernetes cluster state backed up daily
- **Backup Storage**: AWS S3 bucket (replicated to Singapore region)
- **Backup Contents**: All Kubernetes manifests, ConfigMaps, Secrets, PVCs
- **Schedule**: Daily full backup at 2 AM, hourly incremental
- **Retention**: 30 days in S3 (Mumbai), 90 days in S3 Glacier (Singapore)

**Failover Process**

**Planned Failover** (for maintenance or disaster recovery drill)

**Duration**: ~30 minutes
**Downtime**: Minimal (read-only mode during switchover)

**Steps**:
1. **Preparation** (T-60 min):
   - Announce maintenance window to all users
   - Verify DR site health (all pods running, data replication lag < 30s)
   - Backup current state with Velero

2. **Enable Read-Only Mode** (T-30 min):
   - Set PostgreSQL primary to read-only:
     ```sql
     ALTER SYSTEM SET default_transaction_read_only = 'on';
     SELECT pg_reload_conf();
     ```
   - Update Kong to return 503 for write operations
   - Display banner: "System undergoing maintenance. Read-only mode."

3. **Verify Data Sync** (T-10 min):
   - Wait for replication lag to reach 0 seconds (all data synced)
   - Verify Redis, Kafka, MinIO, Elasticsearch replication complete

4. **Promote DR Site** (T-5 min):
   - **PostgreSQL**: Promote Singapore standby to primary
     ```bash
     patronictl failover --master mumbai-primary --candidate singapore-standby
     ```
   - **Redis**: Promote Singapore replicas to masters (Redis Sentinel auto-failover)
   - **Kafka**: Update consumer configs to point to Singapore cluster
   - **MinIO**: Set Singapore as primary site

5. **Update DNS** (T-2 min):
   - Route 53: Update primary DNS record to point to Singapore ALB
     ```bash
     aws route53 change-resource-record-sets \
       --hosted-zone-id Z123456 \
       --change-batch '{"Changes":[{"Action":"UPSERT","ResourceRecordSet":{"Name":"api.ulms.example.com","Type":"A","AliasTarget":{"HostedZoneId":"Z789","DNSName":"singapore-alb.elb.amazonaws.com"}}}]}'
     ```
   - DNS TTL: 60 seconds (propagation time)

6. **Disable Read-Only Mode** (T+0 min):
   - Set Singapore PostgreSQL to read-write:
     ```sql
     ALTER SYSTEM SET default_transaction_read_only = 'off';
     SELECT pg_reload_conf();
     ```
   - Update Kong to allow write operations
   - Remove maintenance banner

7. **Verify Failover** (T+5 min):
   - Smoke tests: Login, create loan application, query borrower
   - Monitor error rate (should be < 1%)
   - Verify traffic is flowing to Singapore (check ALB metrics)

8. **Announce Completion** (T+10 min):
   - Send notification: "Maintenance complete. System operational."

**Total Duration**: ~30 minutes (read-only mode for last 10 minutes)

**Unplanned Failover** (Mumbai site failure)

**Duration**: < 4 hours (RTO)
**Data Loss**: < 30 seconds (RPO)

**Trigger Events**:
- Mumbai region outage (AWS infrastructure failure)
- Network connectivity loss to Mumbai
- Catastrophic failure (fire, earthquake, etc.)

**Automatic Detection**:
- Route 53 Health Checks: Ping Mumbai ALB every 30 seconds
  - 3 consecutive failures → mark Mumbai as UNHEALTHY
- Prometheus Alertmanager: Alert if no metrics received from Mumbai for 5 minutes
- PagerDuty escalation to on-call engineer

**Steps**:
1. **Detection** (T+0 min):
   - Route 53 detects Mumbai ALB unhealthy
   - Automatic DNS failover to Singapore ALB (TTL 60s)
   - PagerDuty alert sent to on-call engineer

2. **Verification** (T+5 min):
   - Engineer verifies Mumbai is down (check AWS Status Dashboard)
   - Assess data replication lag (last successful sync timestamp)
   - Decide: Activate DR site

3. **Activate DR Site** (T+15 min):
   - Promote Singapore PostgreSQL standby to primary (Patroni auto-failover if leader election works)
   - Scale up Singapore Kubernetes pods:
     ```bash
     kubectl scale deployment fineract --replicas=10 -n ulms-production
     kubectl scale deployment cib-service --replicas=5 -n ulms-production
     # Scale all microservices to production capacity
     ```
   - Verify all pods are running and healthy

4. **Verify Services** (T+30 min):
   - Run smoke tests on Singapore site
   - Check error rate, latency (should be normal)
   - Verify database writes working

5. **Communicate** (T+45 min):
   - Notify users: "System restored on backup site. Operations normal."
   - Status page update: "Incident resolved"

6. **Monitor** (T+1 hour - T+4 hours):
   - Continuous monitoring of Singapore site
   - Plan for Mumbai recovery (when AWS declares region restored)

**Total Duration**: < 4 hours (target RTO)

**Failback Process** (Return to Mumbai after recovery)

**When Mumbai is restored**:
1. Rebuild Mumbai Kubernetes cluster (if necessary)
2. Restore from Velero backup (if necessary)
3. Configure Mumbai as standby (reverse replication: Singapore → Mumbai)
4. Wait for data sync (Mumbai catches up to Singapore)
5. Planned failover back to Mumbai (same as planned failover process above)
6. Resume normal operations (Mumbai primary, Singapore standby)

**Duration**: 1-2 days (depends on data volume to sync)

**DR Testing Schedule**

| Test Type | Frequency | Scope | Downtime | Last Test Date |
|-----------|-----------|-------|----------|----------------|
| **Tabletop Exercise** | Quarterly | Team walks through failover steps on paper | None | 2025-12-15 |
| **Partial Failover** | Semi-annually | Test database failover only (read-only mode) | <5 min | 2025-10-01 |
| **Full Failover** | Annually | Complete failover to Singapore (production) | ~30 min | 2025-06-01 |
| **Surprise Drill** | Annually | Unannounced drill during business hours | <1 hour | 2025-03-01 |

**Recovery Metrics**

| Metric | Target | Actual (Last Test) | Status |
|--------|--------|--------------------|--------|
| **RTO (Recovery Time Objective)** | < 4 hours | 2 hours 15 minutes | ✅ Pass |
| **RPO (Recovery Point Objective)** | < 30 seconds | 12 seconds | ✅ Pass |
| **Failover Success Rate** | 100% | 100% (4/4 tests) | ✅ Pass |
| **Data Integrity** | 100% | 100% (no data loss) | ✅ Pass |

**Cost Considerations**

- **Primary Site (Mumbai)**: $15,000/month (18 nodes, 3 AZs, full monitoring)
- **DR Site (Singapore)**: $5,000/month (6 nodes, 2 AZs, standby mode)
- **Data Replication**: $500/month (VPN, bandwidth, S3 replication)
- **Total DR Cost**: $5,500/month (37% of primary site cost)
- **Cost Optimization**: DR site runs at 1/3 capacity, scales up during failover

#### Annotations and Labels

- **Site status** (ACTIVE vs STANDBY)
- **Replication lag** (< 30s for PostgreSQL)
- **Failover direction** (arrow from Mumbai to Singapore)
- **RTO and RPO** prominently displayed
- **DNS failover** mechanism

#### Color Coding

- **Active site**: Green (#4CAF50)
- **Standby site**: Yellow (#FFC107)
- **Replication flows**: Blue arrows
- **Failover path**: Red dashed arrows
- **Data loss window**: Orange (#FF9800)

#### Layout Suggestions

**Left side**: Mumbai site (active, detailed)
**Right side**: Singapore site (standby, simplified)
**Center**: Replication arrows connecting components
**Bottom**: Failover process timeline

#### Recommended Tools

- **Draw.io**: Multi-site architecture diagrams
- **Lucidchart**: DR topology templates
- **Microsoft Visio**: Business continuity diagrams

#### Implementation Notes

1. **Async replication** is sufficient for 30-second RPO target
2. **Route 53 health checks** enable automatic DNS failover
3. **Regular DR testing** is critical to ensure failover works when needed
4. **Validation**: Conduct annual full DR failover test in production (during maintenance window)

---

## 4. Component Descriptions

This section provides a comprehensive catalog of all components deployed in the ULMS architecture, including their purpose, technology stack, deployment specifications, and dependencies.

### 4.1 Component Catalog

| **Component Name** | **Type** | **Technology** | **Version** | **Replicas (Min-Max)** | **CPU Request/Limit** | **Memory Request/Limit** | **Storage** | **Ports** | **Namespace** | **Dependencies** |
|-------------------|----------|----------------|-------------|------------------------|----------------------|--------------------------|-------------|-----------|---------------|------------------|
| **Apache Fineract** | Application | Java/Spring Boot | 1.10 | 3-20 (HPA) | 2000m / 4000m | 4Gi / 8Gi | - | 8080, 8443 | ulms-production | PostgreSQL, Redis, Kafka, Keycloak |
| **CIB Service** | Microservice | Spring Boot | 3.2.1 | 2-5 (HPA) | 500m / 1000m | 1Gi / 2Gi | - | 8081 | ulms-production | PostgreSQL, Redis, VPN Gateway |
| **NID/e-KYC Service** | Microservice | Spring Boot | 3.2.1 | 2-5 (HPA) | 500m / 1000m | 1Gi / 2Gi | - | 8082 | ulms-production | PostgreSQL, Redis |
| **Workflow Service** | Microservice | Spring Boot + Camunda | 3.2.1 + 7.20 | 2-5 (HPA) | 1000m / 2000m | 2Gi / 4Gi | - | 8083 | ulms-production | PostgreSQL, Kafka |
| **Document Service** | Microservice | Spring Boot | 3.2.1 | 2-5 (HPA) | 500m / 1000m | 1Gi / 2Gi | - | 8084 | ulms-production | PostgreSQL, MinIO |
| **BRPD Compliance Service** | Microservice | Spring Boot | 3.2.1 | 2-5 (HPA) | 1000m / 2000m | 2Gi / 4Gi | - | 8085 | ulms-production | PostgreSQL, Kafka |
| **Notification Service** | Microservice | Spring Boot | 3.2.1 | 2-5 (HPA) | 500m / 1000m | 1Gi / 2Gi | - | 8086 | ulms-production | Kafka, Redis, SMS Gateway, AWS SES |
| **Analytics Service** | Microservice | Spring Boot | 3.2.1 | 2-5 (HPA) | 2000m / 4000m | 4Gi / 8Gi | - | 8087 | ulms-production | PostgreSQL, Elasticsearch |
| **Integration Gateway** | Microservice | Apache Camel | 4.3 | 2-5 (HPA) | 1000m / 2000m | 2Gi / 4Gi | - | 8088 | ulms-production | All external integrations |
| **Kong API Gateway** | API Gateway | Kong Gateway | 3.5 | 3-5 (HPA) | 1000m / 2000m | 2Gi / 4Gi | - | 8000, 8443, 8001 | ulms-production | All backend services |
| **Keycloak** | Identity Provider | Keycloak | 23.0 | 2-3 | 1000m / 2000m | 2Gi / 4Gi | - | 8080, 8443 | ulms-production | PostgreSQL |
| **PostgreSQL Primary** | Database | PostgreSQL + Patroni | 16.1 + 3.2 | 1 | 2000m / 4000m | 8Gi / 16Gi | 500Gi SSD | 5432 | ulms-production | etcd |
| **PostgreSQL Standby** | Database | PostgreSQL + Patroni | 16.1 + 3.2 | 2 | 2000m / 4000m | 8Gi / 16Gi | 500Gi SSD | 5432 | ulms-production | PostgreSQL Primary, etcd |
| **Redis Cluster** | Cache | Redis Cluster | 7.2 | 6 (3M + 3R) | 500m / 1000m | 2Gi / 4Gi | 50Gi SSD | 6379, 16379 | ulms-production | - |
| **Kafka Broker** | Message Queue | Apache Kafka | 3.6 | 3 | 1000m / 2000m | 4Gi / 8Gi | 200Gi SSD | 9092, 9093 | ulms-production | ZooKeeper |
| **ZooKeeper** | Coordination | Apache ZooKeeper | 3.9 | 3 | 500m / 1000m | 1Gi / 2Gi | 20Gi SSD | 2181, 2888, 3888 | ulms-production | - |
| **MinIO** | Object Storage | MinIO | RELEASE.2024 | 4 | 1000m / 2000m | 4Gi / 8Gi | 1Ti SSD | 9000, 9001 | ulms-production | - |
| **Elasticsearch** | Search & Analytics | Elasticsearch | 8.11 | 3 | 2000m / 4000m | 8Gi / 16Gi | 200Gi SSD | 9200, 9300 | ulms-monitoring | - |
| **Logstash** | Log Processing | Logstash | 8.11 | 2 | 1000m / 2000m | 2Gi / 4Gi | - | 5044, 9600 | ulms-monitoring | Elasticsearch, Kafka |
| **Kibana** | Visualization | Kibana | 8.11 | 2 | 500m / 1000m | 1Gi / 2Gi | - | 5601 | ulms-monitoring | Elasticsearch |
| **Prometheus** | Metrics | Prometheus | 2.48 | 2 | 2000m / 4000m | 8Gi / 16Gi | 500Gi SSD | 9090 | ulms-monitoring | All application services |
| **Grafana** | Visualization | Grafana | 10.2 | 2 | 500m / 1000m | 1Gi / 2Gi | 10Gi SSD | 3000 | ulms-monitoring | Prometheus, Elasticsearch |
| **Alertmanager** | Alerting | Alertmanager | 0.26 | 2 | 200m / 500m | 512Mi / 1Gi | 10Gi SSD | 9093 | ulms-monitoring | Prometheus |
| **Jaeger** | Tracing | Jaeger | 1.52 | 2 | 1000m / 2000m | 2Gi / 4Gi | 100Gi SSD | 16686, 14268 | ulms-monitoring | Elasticsearch |
| **HashiCorp Vault** | Secrets Mgmt | Vault | 1.15 | 3 | 500m / 1000m | 1Gi / 2Gi | 20Gi SSD | 8200 | ulms-production | - |
| **React Web App** | Frontend | React + TypeScript | 18.2.0 + 5.3.3 | 3-5 (HPA) | 200m / 500m | 512Mi / 1Gi | - | 80, 443 | ulms-production | Kong API Gateway |
| **NGINX Ingress Controller** | Ingress | NGINX | 1.9 | 2 | 500m / 1000m | 512Mi / 1Gi | - | 80, 443 | kube-system | ALB |
| **cert-manager** | Certificate Mgmt | cert-manager | 1.13 | 1 | 200m / 500m | 256Mi / 512Mi | - | 9402 | kube-system | Let's Encrypt |
| **metrics-server** | Metrics | metrics-server | 0.6 | 1 | 100m / 200m | 256Mi / 512Mi | - | 4443 | kube-system | Kubernetes API |
| **ArgoCD** | GitOps | ArgoCD | 2.9 | 1 | 500m / 1000m | 1Gi / 2Gi | 10Gi SSD | 8080, 8083 | argocd | Git Repository |
| **Velero** | Backup | Velero | 1.12 | 1 | 500m / 1000m | 512Mi / 1Gi | - | 8085 | velero | AWS S3, EBS Snapshots |

**Total Component Count**: 31 deployed components

---

## 5. Network Zones & Security Boundaries

This section defines the network zones, IP address ranges, security boundaries, and access control policies that govern the ULMS deployment architecture.

### 5.1 Network Zone Definitions

| **Zone Name** | **CIDR** | **Purpose** | **Components** | **Access Control** |
|--------------|----------|-------------|----------------|-------------------|
| **Internet Zone** | N/A (external) | End-user access from public internet | Web browsers, mobile apps, partner APIs | AWS Shield (DDoS), AWS WAF (OWASP rules), Geo-blocking |
| **DMZ Zone** | 10.0.1.0/24 | Perimeter network for edge services | ALB, WAF, NGINX Ingress Controller | Security Groups: HTTPS (443) from internet, HTTP (8080) to Application Zone |
| **Application Zone** | 10.0.10.0/24 | Application workloads and microservices | Kong, Fineract, 8 microservices, Keycloak, React web app | Security Groups: HTTPS from DMZ, connections to Data Zone, NetworkPolicies |
| **Data Zone** | 10.0.20.0/24 | Data storage and messaging infrastructure | PostgreSQL, Redis, Kafka, ZooKeeper, MinIO, Elasticsearch, Vault | Security Groups: connections from Application Zone only, TLS encryption mandatory |
| **Integration Zone** | 10.0.30.0/24 | External connectivity to Bangladesh systems | VPN Gateway, Integration Gateway | Security Groups: IPSec VPN from Bangladesh Bank, HTTPS to external systems |
| **Management Zone** | 10.0.40.0/24 | Operations, monitoring, and administration | Prometheus, Grafana, ELK, Jaeger, Bastion host, ArgoCD, Velero | Security Groups: SSH from corporate VPN, metrics scraping from all zones |

### 5.2 Security Boundaries

#### 5.2.1 Internet ↔ DMZ Boundary
- **Controls**: AWS Shield (DDoS protection), AWS WAF (OWASP Core Rule Set), ALB (TLS 1.3 termination)
- **Traffic**: HTTPS only (HTTP redirects to HTTPS)
- **Rate Limiting**: 10,000 req/sec aggregate at ALB, 1,000 req/min per IP at WAF
- **Geo-Blocking**: Configurable (can restrict to Bangladesh IPs only)

#### 5.2.2 DMZ ↔ Application Boundary
- **Controls**: Security Groups (stateful firewall), Kubernetes NetworkPolicies (pod-level firewall)
- **Traffic**: HTTP (internal, TLS terminated at ALB and re-encrypted to Kong)
- **Authentication**: Kong validates JWT tokens from Keycloak
- **Access**: Only NGINX Ingress Controller can communicate with Kong

#### 5.2.3 Application ↔ Data Boundary
- **Controls**: Security Groups, NetworkPolicies, database authentication (Vault dynamic credentials)
- **Traffic**: TLS 1.3 encryption (PostgreSQL, Redis, Kafka, Elasticsearch, Vault)
- **Access**: Only authenticated microservices with valid credentials
- **Isolation**: No direct database access from DMZ zone

#### 5.2.4 Application ↔ Integration Boundary
- **Controls**: VPN (IPSec), mTLS (Bangladesh Bank CIB), circuit breaker (Apache Camel Hystrix)
- **Traffic**: IPSec + mTLS for CIB, HTTPS for other external systems
- **Access**: Only Integration Gateway can communicate with external systems

#### 5.2.5 Management ↔ All Zones Boundary
- **Controls**: Bastion host (SSH jump server), Keycloak authentication, Kubernetes RBAC
- **Traffic**: TLS 1.3 for monitoring tools, SSH for bastion host
- **Access**: Requires MFA, audit logs for all access

### 5.3 Firewall Rules Summary

| **Source Zone** | **Destination Zone** | **Protocol** | **Port** | **Purpose** | **Action** |
|----------------|---------------------|--------------|----------|-------------|-----------|
| Internet | DMZ | HTTPS | 443 | User access | ALLOW |
| Internet | DMZ | HTTP | 80 | Redirect to HTTPS | ALLOW (redirect) |
| DMZ | Application | HTTP | 8080, 8443 | Ingress to Kong | ALLOW |
| Application | Data | PostgreSQL | 5432 | Database access | ALLOW (TLS) |
| Application | Data | Redis | 6379 | Cache access | ALLOW (TLS) |
| Application | Data | Kafka | 9092 | Event streaming | ALLOW (TLS) |
| Application | Integration | HTTPS | 443 | External integration | ALLOW (VPN+mTLS) |
| Management | All Zones | HTTPS, SSH | 443, 22 | Monitoring, admin access | ALLOW (MFA required) |
| All Zones | Internet (NAT) | HTTPS | 443 | Package updates, external APIs | ALLOW |
| All Zones | All Zones | * | * | Default deny | DENY |

---

## 6. Deployment Environments

This section describes the three deployment environments with detailed specifications for each.

### 6.1 Environment Comparison Matrix

| **Specification** | **Production** | **Staging** | **Development** |
|------------------|----------------|-------------|-----------------|
| **Purpose** | Live banking operations | UAT, integration testing | Feature development, debugging |
| **Availability Zones** | 3 (high availability) | 2 (reduced HA) | 1 (single AZ) |
| **Worker Nodes** | 18 (6 per AZ, t3.2xlarge) | 6 (3 per AZ, t3.xlarge) | 3 (1 per AZ, t3.large) |
| **Namespace** | ulms-production | ulms-staging | ulms-dev |
| **Resource Quotas** | 100 CPU, 200 GB RAM, 2 TB storage | 50 CPU, 100 GB RAM, 1 TB storage | 20 CPU, 40 GB RAM, 500 GB storage |
| **HPA Min/Max Replicas** | 3-20 (Fineract), 2-5 (microservices) | 2-5 (Fineract), 1-3 (microservices) | 1-2 (Fineract), 1 (microservices) |
| **Database** | PostgreSQL (1P + 2S, Patroni HA) | PostgreSQL (1P + 1S) | PostgreSQL (1 standalone) |
| **Redis** | 6 nodes (3M + 3R, cluster) | 3 nodes (3M, no replicas) | 1 node (standalone) |
| **Kafka** | 3 brokers (RF 3) | 2 brokers (RF 2) | 1 broker (RF 1) |
| **Monitoring** | Full stack (Prometheus, Grafana, ELK, Jaeger) | Basic (Prometheus, Grafana) | Minimal (metrics-server only) |
| **Backup** | Daily full, 6-hour incremental, 30-day retention | Weekly full, daily incremental, 7-day retention | No automated backups |
| **DR Replication** | Enabled (Singapore DR site) | Disabled | Disabled |
| **TLS Certificates** | Let's Encrypt production | Let's Encrypt staging | Self-signed |
| **External Integrations** | Production endpoints (Bangladesh Bank CIB, CBS) | Sandbox/mock endpoints | Mock servers (WireMock) |
| **Data** | Real customer data (encrypted, PII) | Anonymized production data (masked) | Synthetic test data |
| **Access** | Restricted (MFA required, audit logs) | Semi-restricted (developers + QA) | Open (all developers) |
| **Uptime SLA** | 99.9% (43 min downtime/month) | 95% (36 hours downtime/month) | No SLA (best effort) |
| **Deployment Frequency** | Weekly (planned), on-demand (hotfix) | Daily (automated CI/CD) | Continuous (on every commit) |

### 6.2 Environment Promotion Flow

```
Developer Workstation (local Minikube/Kind)
          ↓ [git push to feature branch]
Development Environment (AWS or local cluster)
          ↓ [git merge to develop branch, automated tests pass]
Staging Environment (AWS, UAT testing, QA approval)
          ↓ [git merge to main branch, manual approval, merge request]
Production Environment (AWS, live banking operations)
```

---

## 7. Scalability & High Availability Design

This section describes the strategies for ensuring ULMS can scale to meet performance requirements and maintain 99.9% uptime SLA.

### 7.1 Horizontal Pod Autoscaling (HPA) Configuration

| **Component** | **Min Replicas** | **Max Replicas** | **CPU Target** | **Memory Target** | **Custom Metric** | **Custom Metric Target** |
|--------------|------------------|------------------|----------------|-------------------|-------------------|-------------------------|
| **Apache Fineract** | 3 | 20 | 70% | 80% | http_requests_per_second | 500 req/sec per pod |
| **CIB Service** | 2 | 5 | 70% | 80% | cib_requests_per_second | 100 req/sec per pod |
| **NID/e-KYC Service** | 2 | 5 | 70% | 80% | nid_requests_per_second | 100 req/sec per pod |
| **Workflow Service** | 2 | 5 | 70% | 80% | active_workflows | 50 workflows per pod |
| **Document Service** | 2 | 5 | 70% | 80% | document_upload_rate | 20 uploads/sec per pod |
| **BRPD Compliance Service** | 2 | 5 | 70% | 80% | loan_classification_queue | 100 loans per pod |
| **Notification Service** | 2 | 5 | 70% | 80% | kafka_consumer_lag | < 1000 messages lag |
| **Analytics Service** | 2 | 5 | 70% | 80% | query_duration_p95 | < 2 seconds |
| **Integration Gateway** | 2 | 5 | 70% | 80% | integration_requests_per_second | 50 req/sec per pod |
| **Kong API Gateway** | 3 | 5 | 70% | 80% | kong_requests_per_second | 1000 req/sec per pod |
| **Keycloak** | 2 | 3 | 70% | 80% | keycloak_active_sessions | 5000 sessions per pod |

**HPA Strategy**:
- **Scale-Up Policy**: Stabilization window 60 seconds, add 2 pods or 100% of current pods
- **Scale-Down Policy**: Stabilization window 300 seconds (5 minutes), remove 1 pod or 50% of current pods
- **Metrics**: Prometheus Adapter exposes custom metrics to Kubernetes HPA

### 7.2 Cluster Autoscaling

- **Min Nodes**: 18 (6 per AZ across 3 AZs)
- **Max Nodes**: 30 (10 per AZ across 3 AZs)
- **Scale-Up Trigger**: Pods in Pending state due to insufficient CPU/memory for > 30 seconds
- **Scale-Down Trigger**: Node utilization < 50% for > 10 minutes AND all pods can be rescheduled
- **Node Pools**: General Purpose (t3.2xlarge, scales from 12 to 24), Memory Optimized (r6i.2xlarge, fixed 3), Monitoring (t3.xlarge, fixed 3)

### 7.3 Database High Availability

#### 7.3.1 PostgreSQL with Patroni
- **Topology**: 1 primary + 2 standby replicas across 3 AZs
- **Replication**: Synchronous replication to at least 1 standby
- **Automatic Failover**: < 30 seconds (Patroni + etcd consensus)
- **Connection Pooling**: PgBouncer (max 500 connections, transaction pooling mode)

#### 7.3.2 Redis Cluster
- **Topology**: 6 nodes (3 masters + 3 replicas) across 3 AZs
- **Automatic Failover**: < 15 seconds (Redis Cluster gossip protocol)
- **Persistence**: AOF (Append-Only File) with fsync every second

#### 7.3.3 Kafka
- **Topology**: 3 brokers across 3 AZs
- **Replication**: Replication factor 3, min.insync.replicas = 2
- **Automatic Failover**: < 10 seconds (ZooKeeper-based leader election)

### 7.4 Multi-AZ Deployment Strategy

- **AZ Distribution**: 6 worker nodes per AZ across 3 AZs (ap-south-1a, ap-south-1b, ap-south-1c)
- **Pod Anti-Affinity**: Required anti-affinity ensures pods of same Deployment spread across AZs
- **PodDisruptionBudgets**: Minimum 2 pods available for Fineract, minimum 1 for microservices

---

## 8. Technology Mapping

This section maps all technology components to their deployment specifications.

### 8.1 Technology Stack Deployment Matrix (Abbreviated)

| **Technology** | **Version** | **Deployment Type** | **Replicas** | **CPU/Memory** | **Storage** | **Namespace** |
|---------------|-------------|---------------------|--------------|----------------|-------------|---------------|
| Apache Fineract | 1.10.0 | Deployment (HPA) | 3-20 | 2-4 CPU, 4-8 GB | - | ulms-production |
| Spring Boot | 3.2.1 | Embedded in microservices | 2-5 | 0.5-2 CPU, 1-4 GB | - | ulms-production |
| Java | 21 LTS | Container base image | N/A | N/A | - | ulms-production |
| PostgreSQL | 16.1 | StatefulSet | 3 (1P+2S) | 2-4 CPU, 8-16 GB | 500 GB SSD | ulms-production |
| Patroni | 3.2.0 | Sidecar with PostgreSQL | 3 | 0.1-0.2 CPU, 256-512 MB | - | ulms-production |
| Redis | 7.2.3 | StatefulSet (Cluster) | 6 (3M+3R) | 0.5-1 CPU, 2-4 GB | 50 GB SSD | ulms-production |
| Apache Kafka | 3.6.0 | StatefulSet | 3 | 1-2 CPU, 4-8 GB | 200 GB SSD | ulms-production |
| MinIO | RELEASE.2024 | StatefulSet (Distributed) | 4 | 1-2 CPU, 4-8 GB | 1 TB SSD | ulms-production |
| Kong Gateway | 3.5.0 | Deployment (HPA) | 3-5 | 1-2 CPU, 2-4 GB | - | ulms-production |
| Keycloak | 23.0.3 | Deployment | 2-3 | 1-2 CPU, 2-4 GB | - | ulms-production |
| Prometheus | 2.48.0 | StatefulSet | 2 | 2-4 CPU, 8-16 GB | 500 GB SSD | ulms-monitoring |
| Grafana | 10.2.3 | Deployment | 2 | 0.5-1 CPU, 1-2 GB | 10 GB SSD | ulms-monitoring |
| Elasticsearch | 8.11.3 | StatefulSet | 3 | 2-4 CPU, 8-16 GB | 200 GB SSD | ulms-monitoring |
| React | 18.2.0 | NGINX serving static files | 3-5 | 0.2-0.5 CPU, 512MB-1GB | - | ulms-production |
| ArgoCD | 2.9.3 | Deployment | 1 | 0.5-1 CPU, 1-2 GB | 10 GB SSD | argocd |
| Velero | 1.12.2 | Deployment | 1 | 0.5-1 CPU, 512MB-1GB | - | velero |

**Total Technologies**: 40+ technologies deployed across 6 namespaces

---

## 9. Diagram Creation Recommendations

This section provides guidance on tools, standards, and best practices for creating the deployment architecture diagrams described in Section 3.

### 9.1 Recommended Diagramming Tools

| **Tool** | **Best For** | **Pros** | **Cons** | **Cost** |
|----------|--------------|----------|----------|----------|
| **Draw.io (diagrams.net)** | All diagram types, Kubernetes topology, network architecture | Free, open-source, web-based or desktop, extensive shape libraries, Git integration | Less polished than commercial tools | Free |
| **Lucidchart** | Professional diagrams, collaboration, stakeholder presentations | Polished UI, real-time collaboration, extensive templates, AWS/Azure/K8s icons | Requires subscription, can be expensive for teams | $7.95/user/month |
| **Microsoft Visio** | Enterprise environments with Microsoft 365, business continuity diagrams | Integrated with Microsoft ecosystem, familiar UI, extensive stencils | Windows-only, expensive, not cloud-native | $5-15/user/month |
| **PlantUML** | Code-based diagrams, CI/CD integration, version control | Text-based (easy to version control), automation-friendly, free | Less visual control, learning curve | Free |
| **Mermaid** | Documentation-embedded diagrams, Markdown integration | Markdown syntax, renders in GitHub/GitLab, simple | Limited layout control, simpler diagram types only | Free |
| **Cloudcraft** | AWS infrastructure diagrams, 3D visualization | Auto-generates AWS architecture from account, cost estimation | AWS-only, not suitable for on-premises or multi-cloud | Free tier, $49/month pro |

**Recommendation**: Use **Draw.io** for primary diagrams (free, powerful, Git-friendly) and **Lucidchart** for stakeholder presentations (polished, professional).

### 9.2 Icon Libraries

- **Kubernetes Icons**: https://github.com/kubernetes/community/tree/master/icons
- **AWS Architecture Icons**: https://aws.amazon.com/architecture/icons/
- **Azure Architecture Icons**: https://learn.microsoft.com/en-us/azure/architecture/icons/
- **Google Cloud Icons**: https://cloud.google.com/icons
- **Technology Logos**: https://simpleicons.org/ (Apache Fineract, PostgreSQL, Redis, Kafka, Kong, Keycloak, etc.)

### 9.3 Diagram Standards and Best Practices

#### 9.3.1 Consistent Styling
- **Colors**: Use consistent color scheme across all diagrams
  - Blue (#2196F3) for application components
  - Green (#4CAF50) for databases and data stores
  - Orange (#FF9800) for external integrations
  - Purple (#9C27B0) for security components (Keycloak, Vault, WAF)
  - Gray (#607D8B) for infrastructure (load balancers, VPN, networking)
  - Red (#F44336) for critical paths or errors
- **Fonts**: Use sans-serif fonts (Arial, Helvetica, Open Sans) for readability
- **Line Styles**: Solid lines for synchronous calls, dashed lines for asynchronous events, thick lines for data flows

#### 9.3.2 Layered Approach
- **Layer 1 (Bottom)**: Infrastructure (VPCs, subnets, firewalls, load balancers)
- **Layer 2**: Data tier (databases, caches, message queues, object storage)
- **Layer 3**: Application tier (microservices, API gateway, identity provider)
- **Layer 4**: Edge tier (ingress, WAF, ALB)
- **Layer 5 (Top)**: Clients (web browsers, mobile apps, external systems)

#### 9.3.3 Legends and Annotations
- Always include a legend explaining symbols, colors, and line styles
- Annotate critical metrics (replica counts, resource limits, timeout values, rate limits)
- Label security boundaries (TLS, mTLS, VPN, authentication methods)

#### 9.3.4 Version Control
- Store diagram source files in Git repository alongside code
- Use semantic versioning (v1.0, v1.1, v2.0) for diagram versions
- Include last updated date and author in diagram footer
- Use branching strategy for diagram updates (feature branches, pull requests)

#### 9.3.5 C4 Model Approach (Optional)
- **Level 1 (Context)**: High-level system deployment (DAD-01)
- **Level 2 (Container)**: Kubernetes cluster topology (DAD-02)
- **Level 3 (Component)**: Microservices and their interactions (DAD-04, DAD-08)
- **Level 4 (Code)**: Not applicable for deployment architecture

### 9.4 Diagram Export Formats

- **PNG**: For embedding in documentation (high resolution: 300 DPI, transparent background)
- **SVG**: For web and scalable viewing (lossless, small file size)
- **PDF**: For printing and stakeholder distribution (vector format, preserves fonts)
- **Source Format**: Always keep editable source files (.drawio, .vsdx, .lucidchart) in version control

---

## 10. References

This section provides references to related architecture documents, external documentation, and standards.

### 10.1 Internal Architecture Documents

1. **[ARCH]_ULMS_System_Architecture_Document_v1.0.md** (ARCH-1.1.1)
   High-level system architecture, technology stack decisions, architectural principles

2. **[ARCH]_Microservices_Architecture_Blueprint_v1.0.md** (ARCH-1.1.2)
   Detailed specifications for 8 custom microservices (CIB, NID, Workflow, Document, BRPD, Notification, Analytics, Integration Gateway)

3. **[ARCH]_Multi_Tenant_Architecture_Design_v1.0.md** (ARCH-1.1.3)
   Multi-tenancy strategy, schema-per-tenant design, tenant onboarding process

4. **[ARCH]_Event_Driven_Architecture_Design_v1.0.md** (ARCH-1.1.4)
   Kafka topics, event schemas, event sourcing patterns, CQRS

5. **[ARCH]_Security_Architecture_Document_v1.0.md** (ARCH-1.4.1)
   8-layer security model, OAuth 2.0 flows, encryption standards, audit logging

6. **[ARCH]_API_Gateway_Design_Kong_v1.0.md** (ARCH-1.2.2)
   Kong configuration, plugins, rate limiting, authentication, routing rules

7. **[ARCH]_Integration_Architecture_Overview_Apache_Camel_v1.0.md** (ARCH-1.5.1)
   External integration specifications (CIB, NID, CBS, Payment Gateways, SFTP, SMS, Email)

8. **[ARCH]_Database_Architecture_Design_v1.0.md** (ARCH-1.3.1)
   PostgreSQL schema design, indexing strategy, connection pooling, replication

9. **[ARCH]_Kubernetes_Cluster_Architecture_v1.0.md** (ARCH-1.7.1)
   Companion document with complete YAML manifests and operational procedures

10. **[STD]_Standards_DevelopmentGuidelines_v1.0.md**
    Document standards, naming conventions, versioning guidelines

### 10.2 Project Requirement Documents

11. **LMS_RFP_Summary.md**
    Original RFP requirements from Bangladesh Bank and commercial banks

12. **Business_Requirements_Document_LMS.md**
    BRD Section 7: Non-functional requirements (performance, availability, security, scalability)

13. **User_Requirements_Document_LMS.md**
    User requirements for loan officers, branch managers, and administrators

14. **Software_Requirements_Specification.md**
    SRS Section 4: Performance requirements (1000+ concurrent users, 500+ RPS, <500ms p95 latency, 99.9% uptime)

15. **Technology_Stack_Recommendation_v2.md**
    Technology versions, vendor selection rationale, licensing considerations

### 10.3 External Documentation

16. **Kubernetes Documentation v1.28**
    https://kubernetes.io/docs/
    StatefulSets, Deployments, Services, HPA, NetworkPolicies, RBAC, PodDisruptionBudgets

17. **Apache Fineract Documentation**
    https://fineract.apache.org/
    REST API specifications, configuration guides, deployment recommendations

18. **Kong Gateway Documentation**
    https://docs.konghq.com/
    Plugin development, rate limiting, OAuth 2.0 introspection, load balancing

19. **Patroni Documentation**
    https://patroni.readthedocs.io/
    PostgreSQL HA configuration, automatic failover, etcd integration

20. **ArgoCD Documentation**
    https://argo-cd.readthedocs.io/
    GitOps workflows, sync policies, rollback strategies, Helm integration

21. **HashiCorp Vault Documentation**
    https://www.vaultproject.io/docs
    Dynamic secrets, PKI, Kubernetes integration, auto-unseal with AWS KMS

22. **Prometheus Documentation**
    https://prometheus.io/docs/
    Metrics collection, PromQL queries, alert rules, federation, Thanos integration

23. **Grafana Documentation**
    https://grafana.com/docs/
    Dashboard creation, data sources, alerting, user management

24. **Elasticsearch Documentation**
    https://www.elastic.co/guide/index.html
    Index management, search queries, aggregations, security (X-Pack)

25. **Jaeger Documentation**
    https://www.jaegertracing.io/docs/
    Distributed tracing, sampling strategies, Elasticsearch backend

### 10.4 Standards and Guidelines

26. **Bangladesh Bank ICT Security Guidelines V4.0**
    Security requirements for financial institutions, RBAC, encryption, audit logging, DR

27. **BRPD Circular 15/2024**
    Loan classification and provisioning requirements, IFRS-9 compliance

28. **OWASP Top 10 2021**
    https://owasp.org/Top10/
    Web application security risks, mitigation strategies

29. **CIS Kubernetes Benchmark v1.8**
    https://www.cisecurity.org/benchmark/kubernetes
    Kubernetes security hardening guidelines

30. **NIST Cybersecurity Framework**
    https://www.nist.gov/cyberframework
    Identify, Protect, Detect, Respond, Recover

---

## 11. Appendices

### Appendix A: Deployment Checklist

Pre-deployment verification checklist for production deployment:

**Infrastructure Readiness**
- [ ] AWS account configured with VPC, subnets, security groups
- [ ] Kubernetes cluster (EKS or self-managed) provisioned with 18 worker nodes
- [ ] Node pools configured (general purpose, memory optimized, monitoring)
- [ ] Cluster autoscaler installed and configured (18-30 nodes)
- [ ] StorageClasses created (gp3-encrypted, efs-sc)
- [ ] Load balancers configured (ALB for external traffic, NLB for Kong)
- [ ] VPN tunnel established with Bangladesh Bank for CIB integration

**Security Configuration**
- [ ] AWS WAF rules deployed (OWASP Core Rule Set)
- [ ] TLS certificates provisioned (Let's Encrypt via cert-manager)
- [ ] HashiCorp Vault deployed and unsealed (auto-unseal with AWS KMS)
- [ ] Secrets created in Vault (database credentials, API keys, mTLS certificates)
- [ ] Keycloak deployed with PostgreSQL backend, realms created for 62 banks
- [ ] RBAC policies configured (ServiceAccounts, Roles, RoleBindings)
- [ ] NetworkPolicies applied (default deny, explicit allow rules)
- [ ] PodSecurityStandards enforced (Restricted mode for production namespace)

**Data Services**
- [ ] PostgreSQL deployed with Patroni HA (1 primary + 2 standby replicas)
- [ ] etcd cluster deployed for Patroni consensus
- [ ] pgBackRest configured for backups (daily full, 6-hour incremental)
- [ ] Redis Cluster deployed (6 nodes, 3 masters + 3 replicas)
- [ ] Kafka deployed (3 brokers, replication factor 3, min.insync.replicas = 2)
- [ ] ZooKeeper ensemble deployed (3 nodes)
- [ ] MinIO deployed (4 nodes, distributed mode, erasure coding EC:2)
- [ ] Elasticsearch deployed (3 nodes, index lifecycle management configured)

**Application Deployment**
- [ ] Apache Fineract deployed (3 replicas minimum, HPA configured)
- [ ] 8 microservices deployed (CIB, NID, Workflow, Document, BRPD, Notification, Analytics, Integration Gateway)
- [ ] Kong API Gateway deployed (3 replicas, plugins configured)
- [ ] React web app deployed (3 replicas, environment variables injected)
- [ ] HPA configured for all scalable components (CPU, memory, custom metrics)
- [ ] PodDisruptionBudgets created (minimum 2 for Fineract, minimum 1 for microservices)

**Monitoring and Observability**
- [ ] Prometheus deployed (2 replicas, scrape configs for all services)
- [ ] Grafana deployed (2 replicas, dashboards imported, data sources configured)
- [ ] Alertmanager deployed (2 replicas, notification channels configured)
- [ ] ELK Stack deployed (Elasticsearch, Logstash, Kibana, Filebeat)
- [ ] Jaeger deployed (2 replicas, Elasticsearch backend)
- [ ] Alert rules configured (error rate, latency, resource utilization, business KPIs)

**GitOps and CI/CD**
- [ ] ArgoCD deployed and configured
- [ ] Git repository created with Kubernetes manifests (base, environments, kustomization)
- [ ] ArgoCD Applications created (ulms-production, ulms-staging, ulms-monitoring)
- [ ] Sync policies configured (automated self-heal, prune)
- [ ] GitLab CI/CD pipeline configured (.gitlab-ci.yml)

**Backup and Disaster Recovery**
- [ ] Velero deployed with AWS S3 backend
- [ ] Backup schedule configured (daily full, hourly incremental)
- [ ] DR site provisioned in Singapore region (6 nodes, standby mode)
- [ ] Database replication configured (PostgreSQL streaming replication, Redis replication, Kafka MirrorMaker)
- [ ] Route 53 health checks configured for DNS failover

**Testing and Validation**
- [ ] Smoke tests passed (all services responding to health checks)
- [ ] Integration tests passed (end-to-end loan application flow)
- [ ] Load tests passed (1000 concurrent users, 500 RPS, <500ms p95 latency)
- [ ] Failover tests passed (PostgreSQL automatic failover <30s, Redis failover <15s, Kafka failover <10s)
- [ ] Security tests passed (penetration testing, vulnerability scanning)

**Documentation and Training**
- [ ] Deployment architecture diagrams created and reviewed
- [ ] Operational runbooks written (deployment, rollback, troubleshooting, DR)
- [ ] On-call rotation established
- [ ] Operations team trained on Kubernetes, monitoring tools, troubleshooting

---

### Appendix B: Troubleshooting Guide

Common issues and resolution steps:

**Issue: Pod in CrashLoopBackOff state**
- **Symptoms**: Pod restarts repeatedly, application logs show errors
- **Diagnosis**: `kubectl describe pod <pod-name>` to see recent events, `kubectl logs <pod-name>` to see application logs
- **Common Causes**:
  - Database connection failure (check PostgreSQL service, credentials in Vault)
  - Missing environment variables (check ConfigMap, Secrets)
  - Resource limits too low (check CPU/memory limits, increase if necessary)
  - Application bug (check application logs, fix code)
- **Resolution**: Fix underlying issue, redeploy pod

**Issue: Service Unavailable (503 errors)**
- **Symptoms**: API requests return 503 Service Unavailable
- **Diagnosis**: Check Kong logs (`kubectl logs -n ulms-production <kong-pod>`), check backend service health
- **Common Causes**:
  - All backend pods unhealthy (check readiness probes, application health)
  - Kong misconfiguration (check routing rules, upstream service)
  - Database connection pool exhausted (check PgBouncer connections, increase pool size)
- **Resolution**: Fix unhealthy pods, adjust Kong configuration, scale up backend replicas

**Issue: High database CPU utilization**
- **Symptoms**: PostgreSQL CPU >80%, slow query performance
- **Diagnosis**: Check slow queries (`pg_stat_statements`), check connection count
- **Common Causes**:
  - Missing indexes (analyze slow queries, add indexes)
  - N+1 query problem (optimize application code to use batch queries)
  - Too many connections (check connection pooling configuration)
- **Resolution**: Optimize queries, add indexes, scale up database resources

**Issue: Kafka consumer lag increasing**
- **Symptoms**: Kafka consumer lag >1000 messages, notifications delayed
- **Diagnosis**: Check consumer group lag (`kafka-consumer-groups.sh --describe`)
- **Common Causes**:
  - Slow consumer processing (optimize message handling, increase parallelism)
  - Insufficient consumer replicas (scale up Notification Service)
  - Kafka broker issues (check broker logs, disk space)
- **Resolution**: Scale up consumers, optimize message processing

**Issue: Pod eviction due to memory pressure**
- **Symptoms**: Pods evicted, node shows MemoryPressure condition
- **Diagnosis**: `kubectl describe node <node-name>` to see node conditions and eviction events
- **Common Causes**:
  - Memory limits too high for node capacity (reduce memory limits or scale up nodes)
  - Memory leak in application (check heap dumps, fix memory leak)
  - Insufficient memory on nodes (add more nodes via cluster autoscaler)
- **Resolution**: Adjust resource limits, fix memory leaks, scale up cluster

---

### Appendix C: Capacity Planning

Formulas and guidelines for capacity planning:

**Application Tier Capacity**
- **Concurrent Users**: 1000 users
- **Requests per User**: 10 req/min average
- **Total RPS**: 1000 users × 10 req/min ÷ 60 sec = 167 RPS average, 500 RPS peak
- **Fineract Capacity**: 500 req/sec per pod × 3 pods = 1500 req/sec (3x headroom for peak traffic)
- **CPU per Request**: 50ms CPU time = 0.05 CPU-seconds
- **CPU Required**: 500 RPS × 0.05 CPU-sec = 25 CPU cores (Fineract: 3 pods × 4 CPU = 12 CPU, microservices: 8 services × 2 pods × 1 CPU = 16 CPU, total 28 CPU)

**Database Capacity**
- **Active Connections**: 100 per microservice × 10 microservices = 1000 connections
- **PgBouncer Pooling**: 1000 client connections → 100 database connections (10:1 ratio)
- **PostgreSQL Connections**: max_connections = 200 (100 pooled + 100 reserved)
- **Database CPU**: 2-4 CPU cores per 100 connections
- **Database Memory**: 8-16 GB RAM for 500 GB data, shared_buffers = 2 GB (25%), effective_cache_size = 12 GB (75%)

**Storage Capacity**
- **PostgreSQL**: 500 GB per replica × 3 replicas = 1.5 TB total
- **Kafka**: 200 GB per broker × 3 brokers = 600 GB total
- **MinIO**: 1 TB per node × 4 nodes = 4 TB raw (2.7 TB usable with EC:2 erasure coding)
- **Elasticsearch**: 200 GB per node × 3 nodes = 600 GB total
- **Prometheus**: 500 GB per replica × 2 replicas = 1 TB total
- **Total Storage**: ~6 TB for production environment

**Network Bandwidth**
- **API Traffic**: 500 RPS × 50 KB avg response = 25 MB/sec = 200 Mbps
- **Database Replication**: 10 MB/sec = 80 Mbps
- **Kafka Replication**: 5 MB/sec = 40 Mbps
- **Monitoring**: 2 MB/sec = 16 Mbps
- **Total Bandwidth**: ~350 Mbps (recommend 1 Gbps links for headroom)

---

### Appendix D: Compliance Matrix

Mapping of deployment architecture to regulatory requirements:

| **Requirement** | **Source** | **Implementation** | **Status** |
|----------------|------------|-------------------|-----------|
| **99.9% Uptime** | BRD 7.5 | Multi-AZ deployment, Patroni HA, Redis Cluster, Kafka HA, HPA, PodDisruptionBudgets | ✅ Compliant |
| **1000+ Concurrent Users** | BRD 7.1, SRS 4.1 | HPA (3-20 replicas for Fineract), Kong API Gateway (3-5 replicas), load testing verified | ✅ Compliant |
| **500+ RPS** | SRS 4.2 | Load testing verified, 3x headroom with HPA | ✅ Compliant |
| **<500ms p95 Latency** | SRS 4.3 | Redis caching, database indexing, connection pooling, performance testing verified | ✅ Compliant |
| **TLS 1.3 Encryption** | BRD 7.3, ICT V4.0 | ALB TLS 1.3 termination, internal TLS for Kong, PostgreSQL, Redis, Kafka, Elasticsearch, Vault | ✅ Compliant |
| **mTLS for CIB** | Bangladesh Bank CIB Requirements | VPN (IPSec) + mTLS (client cert from Bangladesh Bank CA), Vault stores certificates | ✅ Compliant |
| **Role-Based Access Control** | ICT V4.0 Section 5.2 | Kubernetes RBAC (ServiceAccounts, Roles, RoleBindings), Keycloak (OAuth 2.0, realm-per-tenant) | ✅ Compliant |
| **Audit Logging (10-year retention)** | BRPD 15/2024, ICT V4.0 | Elasticsearch with 30-day hot, 1-year warm, 10-year archived to S3 | ✅ Compliant |
| **Data Encryption at Rest** | ICT V4.0 Section 6.1 | AWS EBS with KMS encryption (AES-256), MinIO with AES-256 encryption | ✅ Compliant |
| **Disaster Recovery (RTO <4h, RPO <1h)** | BRD 7.6, ICT V4.0 Section 8 | DR site in Singapore, async replication (RPO 30s), planned failover 30 min, unplanned <4h | ✅ Compliant |
| **Multi-Tenancy (Schema Isolation)** | BRD 3.2 | Schema-per-tenant PostgreSQL, Keycloak realm-per-tenant, tenant context resolver | ✅ Compliant |
| **Automated Backups** | ICT V4.0 Section 7.3 | pgBackRest (daily full, 6-hour incremental, 30-day retention), Velero (daily cluster backup) | ✅ Compliant |
| **Network Segmentation** | ICT V4.0 Section 5.4 | 6 network zones (Internet, DMZ, Application, Data, Integration, Management), security groups, NetworkPolicies | ✅ Compliant |
| **DDoS Protection** | ICT V4.0 Section 5.5 | AWS Shield Standard, AWS WAF (rate limiting 10,000 req/sec aggregate) | ✅ Compliant |
| **Secrets Management** | ICT V4.0 Section 6.3 | HashiCorp Vault (dynamic secrets, 1-hour TTL, auto-rotation) | ✅ Compliant |

---

### Appendix E: Glossary

| **Term** | **Definition** |
|----------|---------------|
| **AZ (Availability Zone)** | Isolated data center within a region, provides fault isolation |
| **HPA (Horizontal Pod Autoscaler)** | Kubernetes feature that automatically scales pod replicas based on CPU, memory, or custom metrics |
| **PDB (PodDisruptionBudget)** | Kubernetes resource that ensures minimum number of pods available during voluntary disruptions |
| **RBAC (Role-Based Access Control)** | Access control model that restricts access based on user roles |
| **NetworkPolicy** | Kubernetes resource that defines pod-level firewall rules (Layer 3/4) |
| **StatefulSet** | Kubernetes workload for stateful applications (databases, message queues) with stable network IDs and storage |
| **Deployment** | Kubernetes workload for stateless applications with rolling updates and replica management |
| **Service** | Kubernetes resource that exposes pods as a network service (ClusterIP, LoadBalancer, Headless) |
| **Ingress** | Kubernetes resource that manages external HTTP/HTTPS access to services (Layer 7 routing) |
| **ConfigMap** | Kubernetes resource for storing configuration data as key-value pairs |
| **Secret** | Kubernetes resource for storing sensitive data (passwords, API keys, certificates) with base64 encoding |
| **Patroni** | HA solution for PostgreSQL with automatic failover and consensus-based leader election |
| **etcd** | Distributed key-value store used by Kubernetes and Patroni for consensus and configuration |
| **PgBouncer** | Lightweight connection pooler for PostgreSQL to reduce connection overhead |
| **mTLS (Mutual TLS)** | Two-way TLS authentication where both client and server present certificates |
| **VPN (Virtual Private Network)** | Encrypted tunnel for secure communication over public networks (IPSec, WireGuard) |
| **GitOps** | Deployment methodology using Git as source of truth, with tools like ArgoCD for automated sync |
| **Circuit Breaker** | Design pattern that prevents cascading failures by failing fast when downstream service is unhealthy |
| **Event Sourcing** | Pattern where state changes are stored as immutable events in Kafka for auditability and replay |
| **CQRS (Command Query Responsibility Segregation)** | Pattern separating read and write operations for scalability and performance |
| **Schema-per-Tenant** | Multi-tenancy model where each tenant has isolated database schema for data security |
| **RPO (Recovery Point Objective)** | Maximum acceptable data loss measured in time (30 seconds for ULMS) |
| **RTO (Recovery Time Objective)** | Maximum acceptable downtime measured in time (4 hours for ULMS) |
| **SLA (Service Level Agreement)** | Commitment to maintain specific service quality metrics (99.9% uptime for ULMS) |

---

**Document Status**: DRAFT v1.0
**Last Updated**: 2026-02-05
**Next Review Date**: 2026-03-05
**Document ID**: ARCH-1.7.2
**Version**: 1.0

---

**END OF DOCUMENT**


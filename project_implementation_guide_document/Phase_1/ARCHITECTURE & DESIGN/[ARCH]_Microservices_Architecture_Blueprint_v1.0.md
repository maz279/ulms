# Microservices Architecture Blueprint
## Unisoft Loan Management System (ULMS) v2.0
### 8 Custom Microservices Specification

---

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ARCH-1.1.2 |
| **Document Title** | Microservices Architecture Blueprint |
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
| 1.0 | February 4, 2026 | Lead Developer | Initial Microservices Architecture Blueprint |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Microservices Overview](#2-microservices-overview)
3. [Service Catalog](#3-service-catalog)
4. [Inter-Service Communication](#4-inter-service-communication)
5. [Service Discovery & Load Balancing](#5-service-discovery--load-balancing)
6. [Resilience Patterns](#6-resilience-patterns)
7. [API Contracts](#7-api-contracts)
8. [Deployment Configuration](#8-deployment-configuration)
9. [Service Dependencies](#9-service-dependencies)
10. [Appendices](#10-appendices)

---

## 1. Executive Summary

### 1.1 Purpose

This document provides a comprehensive blueprint for the **8 custom microservices** that extend Apache Fineract CE to meet Bangladesh-specific banking requirements. Each microservice is designed as an independent, deployable unit following domain-driven design principles.

### 1.2 Architecture Principles

| Principle | Description |
|-----------|-------------|
| **Single Responsibility** | Each service handles one business domain |
| **Loose Coupling** | Services communicate via APIs and events |
| **High Cohesion** | Related functionality grouped within service |
| **Independent Deployment** | Services can be deployed independently |
| **Technology Agnostic** | Services can use different tech stacks |
| **Fault Tolerance** | Services handle failures gracefully |
| **Observable** | Services expose health, metrics, and traces |

### 1.3 Technology Foundation

| Component | Technology | Version |
|-----------|-----------|---------|
| **Primary Language** | Java | 21 LTS |
| **Framework** | Spring Boot | 3.2.1 |
| **Security** | Spring Security | 6.2.1 |
| **Reactive** | Spring WebFlux | 6.1.x |
| **Workflow** | Camunda Platform | 7.20 |
| **Integration** | Apache Camel | 4.3 |
| **Analytics** | Python | 3.12 |
| **Containerization** | Docker | Latest |
| **Orchestration** | Kubernetes | 1.28 |

---

## 2. Microservices Overview

### 2.1 Service Landscape

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    ULMS MICROSERVICES ARCHITECTURE                                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│                              ┌─────────────────────┐                                 │
│                              │   Kong API Gateway   │                                 │
│                              │        (3.5)        │                                 │
│                              └──────────┬──────────┘                                 │
│                                         │                                            │
│          ┌──────────────────────────────┼──────────────────────────────┐            │
│          │                              │                              │            │
│          ▼                              ▼                              ▼            │
│  ┌───────────────┐            ┌───────────────┐            ┌───────────────┐        │
│  │  CIB Service  │            │  NID/e-KYC    │            │   Workflow    │        │
│  │   (8081)      │            │   Service     │            │   Service     │        │
│  │  Spring Boot  │            │   (8082)      │            │   (8083)      │        │
│  │  + WebFlux    │            │  Spring Boot  │            │  Spring Boot  │        │
│  └───────────────┘            └───────────────┘            │  + Camunda    │        │
│                                                            └───────────────┘        │
│                                                                                      │
│  ┌───────────────┐            ┌───────────────┐            ┌───────────────┐        │
│  │   Document    │            │     BRPD      │            │ Notification  │        │
│  │   Service     │            │  Compliance   │            │   Service     │        │
│  │   (8084)      │            │   Service     │            │   (8086)      │        │
│  │  Spring Boot  │            │   (8085)      │            │  Spring Boot  │        │
│  │  + MinIO      │            │  Spring Boot  │            │  + Kafka      │        │
│  └───────────────┘            │  + Quartz     │            └───────────────┘        │
│                               └───────────────┘                                      │
│                                                                                      │
│  ┌───────────────┐            ┌─────────────────────────────────────────────┐       │
│  │   Analytics   │            │            Integration Gateway              │       │
│  │   Service     │            │                 (8088)                       │       │
│  │   (8087)      │            │            Apache Camel 4.3                  │       │
│  │  Spring Boot  │            │    CBS Adapter │ Protocol Translation       │       │
│  │  + Python ML  │            └─────────────────────────────────────────────┘       │
│  └───────────────┘                                                                   │
│                                                                                      │
│          │                              │                              │            │
│          └──────────────────────────────┼──────────────────────────────┘            │
│                                         │                                            │
│                                         ▼                                            │
│                    ┌─────────────────────────────────────────┐                      │
│                    │        Apache Fineract Core (1.10)       │                      │
│                    │  Loan Portfolio │ Accounting │ Customer  │                      │
│                    └─────────────────────────────────────────┘                      │
│                                                                                      │
│          ┌──────────────────────────────┼──────────────────────────────┐            │
│          │                              │                              │            │
│          ▼                              ▼                              ▼            │
│  ┌───────────────┐            ┌───────────────┐            ┌───────────────┐        │
│  │  PostgreSQL   │            │     Redis     │            │    Kafka      │        │
│  │     16        │            │       7       │            │     3.6       │        │
│  └───────────────┘            └───────────────┘            └───────────────┘        │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Service Summary

| # | Service Name | Port | Technology | Primary Responsibility |
|---|-------------|------|-----------|----------------------|
| 1 | CIB Integration Service | 8081 | Spring Boot + WebFlux | Bangladesh Bank CIB Online integration |
| 2 | NID/e-KYC Service | 8082 | Spring Boot REST | National ID verification, biometrics |
| 3 | Workflow Service | 8083 | Spring Boot + Camunda | Multi-level approval workflow |
| 4 | Document Service | 8084 | Spring Boot + MinIO | Encrypted document management |
| 5 | BRPD Compliance Service | 8085 | Spring Boot + Quartz | Loan classification, provisioning |
| 6 | Notification Service | 8086 | Spring Boot + Kafka | SMS, Email, Push notifications |
| 7 | Analytics Service | 8087 | Spring Boot + Python | Credit scoring, ECL, dashboards |
| 8 | Integration Gateway | 8088 | Apache Camel 4.3 | CBS adapter, protocol translation |

---

## 3. Service Catalog

### 3.1 CIB Integration Service

#### 3.1.1 Service Overview

| Attribute | Value |
|-----------|-------|
| **Service ID** | ulms-cib-service |
| **Port** | 8081 |
| **Technology** | Spring Boot 3.2 + WebFlux |
| **Database** | PostgreSQL (cib_inquiry table) |
| **Cache** | Redis (1-hour TTL) |
| **BRD Reference** | BRD 6.2.1 |
| **SRS Reference** | SRS-CIB-001 |

#### 3.1.2 Responsibilities

- Real-time CIB Online API integration with Bangladesh Bank
- Individual and Corporate credit inquiries
- Guarantor CIB verification
- Group exposure checking
- Monthly batch file generation for BB
- CIB report caching to reduce API calls
- mTLS certificate management for secure BB communication

#### 3.1.3 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           CIB INTEGRATION SERVICE                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                        REST API Layer (WebFlux)                              │   │
│  │  POST /api/v1/cib/inquiry │ GET /api/v1/cib/batch-status │ POST /batch-file │   │
│  └──────────────────────────────────────┬──────────────────────────────────────┘   │
│                                          │                                          │
│  ┌──────────────────────────────────────┼──────────────────────────────────────┐   │
│  │                       Service Layer                                          │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                 │   │
│  │  │ CIBInquiry     │  │ BatchProcess   │  │ CacheManager   │                 │   │
│  │  │ Service        │  │ Service        │  │ Service        │                 │   │
│  │  └────────────────┘  └────────────────┘  └────────────────┘                 │   │
│  └──────────────────────────────────────┬──────────────────────────────────────┘   │
│                                          │                                          │
│  ┌──────────────────────────────────────┼──────────────────────────────────────┐   │
│  │                       Integration Layer                                      │   │
│  │  ┌────────────────────────────────────────────────────────────────────────┐ │   │
│  │  │                    CIB API Client (WebClient)                          │ │   │
│  │  │  - mTLS Authentication (X.509 Certificates)                            │ │   │
│  │  │  - Retry with Exponential Backoff (3 attempts)                         │ │   │
│  │  │  - Circuit Breaker (Resilience4j)                                      │ │   │
│  │  │  - Request/Response Logging                                            │ │   │
│  │  └────────────────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────┬──────────────────────────────────────┘   │
│                                          │                                          │
│          ┌───────────────────────────────┼───────────────────────────────┐         │
│          │                               │                               │         │
│          ▼                               ▼                               ▼         │
│  ┌───────────────┐            ┌───────────────┐            ┌───────────────┐       │
│  │  PostgreSQL   │            │     Redis     │            │  BB CIB API   │       │
│  │ (cib_inquiry) │            │  (CIB Cache)  │            │   (External)  │       │
│  └───────────────┘            └───────────────┘            └───────────────┘       │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

#### 3.1.4 API Endpoints

| Endpoint | Method | Description | Rate Limit |
|----------|--------|-------------|------------|
| `/api/v1/cib/inquiry` | POST | Real-time CIB inquiry | 60/min |
| `/api/v1/cib/inquiry/{id}` | GET | Get inquiry result | 100/min |
| `/api/v1/cib/corporate` | POST | Corporate CIB inquiry | 30/min |
| `/api/v1/cib/guarantor/{loanId}` | POST | Guarantor CIB check | 60/min |
| `/api/v1/cib/group-exposure` | POST | Group exposure check | 30/min |
| `/api/v1/cib/batch-status` | GET | Monthly batch status | 10/min |
| `/api/v1/cib/batch-file` | POST | Submit batch file | 1/hour |

#### 3.1.5 Data Model

```java
@Entity
@Table(name = "cib_inquiry")
public class CIBInquiry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "inquiry_id", unique = true)
    private String inquiryId;

    @Column(name = "nid_number")
    @Encrypted
    private String nidNumber;

    @Column(name = "inquiry_type")
    @Enumerated(EnumType.STRING)
    private InquiryType inquiryType; // INDIVIDUAL, CORPORATE

    @Column(name = "purpose")
    private String purpose;

    @Column(name = "application_id")
    private String applicationId;

    @Column(name = "cib_score")
    private Integer cibScore;

    @Column(name = "risk_grade")
    private String riskGrade;

    @Column(name = "total_outstanding")
    private BigDecimal totalOutstanding;

    @Column(name = "total_emi")
    private BigDecimal totalEmi;

    @Column(name = "worst_classification")
    private String worstClassification;

    @Column(name = "response_json", columnDefinition = "jsonb")
    private String responseJson;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private InquiryStatus status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "tenant_id")
    private String tenantId;
}
```

#### 3.1.6 Configuration

```yaml
# application.yml
cib:
  api:
    base-url: https://cib.bb.org.bd/api/v1
    timeout: 120000 # 2 minutes
    retry:
      max-attempts: 3
      backoff-multiplier: 2
      initial-interval: 5000
  mtls:
    key-store: classpath:certs/cib-keystore.p12
    key-store-password: ${CIB_KEYSTORE_PASSWORD}
    trust-store: classpath:certs/bb-truststore.p12
  cache:
    ttl: 3600 # 1 hour
  batch:
    cron: "0 0 2 1 * ?" # Monthly at 2 AM on 1st day
    sftp:
      host: sftp.bb.org.bd
      port: 22
      username: ${BB_SFTP_USER}
```

---

### 3.2 NID/e-KYC Service

#### 3.2.1 Service Overview

| Attribute | Value |
|-----------|-------|
| **Service ID** | ulms-nid-service |
| **Port** | 8082 |
| **Technology** | Spring Boot 3.2 REST |
| **Database** | PostgreSQL (customer_verification) |
| **BRD Reference** | BRD 6.1.4 |
| **SRS Reference** | SRS-LOS-001 |

#### 3.2.2 Responsibilities

- NID verification via NIDW (NID Wing) API
- Auto-population of customer data from NID
- Photo matching and biometric verification
- Duplicate NID detection
- Smart card data extraction
- e-KYC compliance management
- NID data encryption (AES-256)

#### 3.2.3 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           NID/e-KYC SERVICE                                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                        REST API Layer                                        │   │
│  │  POST /verify │ POST /photo-match │ GET /customer-data │ POST /duplicate    │   │
│  └──────────────────────────────────────┬──────────────────────────────────────┘   │
│                                          │                                          │
│  ┌──────────────────────────────────────┼──────────────────────────────────────┐   │
│  │                       Service Layer                                          │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                 │   │
│  │  │ NIDVerify      │  │ PhotoMatch     │  │ Duplicate      │                 │   │
│  │  │ Service        │  │ Service        │  │ Detection      │                 │   │
│  │  └────────────────┘  └────────────────┘  └────────────────┘                 │   │
│  │  ┌────────────────┐  ┌────────────────┐                                     │   │
│  │  │ DataEncryption │  │ eKYC           │                                     │   │
│  │  │ Service        │  │ Compliance     │                                     │   │
│  │  └────────────────┘  └────────────────┘                                     │   │
│  └──────────────────────────────────────┬──────────────────────────────────────┘   │
│                                          │                                          │
│          ┌───────────────────────────────┼───────────────────────────────────┐     │
│          │                               │                               │         │
│          ▼                               ▼                               ▼         │
│  ┌───────────────┐            ┌───────────────┐            ┌───────────────┐       │
│  │  PostgreSQL   │            │ HashiCorp     │            │  NIDW API     │       │
│  │ (customer_    │            │ Vault (Keys)  │            │  (External)   │       │
│  │  verification)│            └───────────────┘            └───────────────┘       │
│  └───────────────┘                                                                  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

#### 3.2.4 API Endpoints

| Endpoint | Method | Description | Rate Limit |
|----------|--------|-------------|------------|
| `/api/v1/nid/verify` | POST | Verify NID and get data | 100/min |
| `/api/v1/nid/photo-match` | POST | Match photo with NID | 50/min |
| `/api/v1/nid/duplicate-check` | POST | Check for duplicate NID | 100/min |
| `/api/v1/nid/customer-data/{nid}` | GET | Get auto-fill data | 100/min |
| `/api/v1/ekyc/compliance-status` | GET | e-KYC compliance check | 50/min |

#### 3.2.5 Response Model

```json
{
  "verificationId": "NID-VER-2026-000123",
  "status": "VERIFIED",
  "nidNumber": "*********0123",
  "customerData": {
    "nameEnglish": "MD. REZAUL KARIM",
    "nameBengali": "মো: রেজাউল করিম",
    "fatherName": "MD. ABDUL KARIM",
    "motherName": "MST. FATEMA BEGUM",
    "dateOfBirth": "1990-05-15",
    "gender": "MALE",
    "bloodGroup": "B+",
    "presentAddress": {
      "division": "DHAKA",
      "district": "DHAKA",
      "upazila": "GULSHAN",
      "postOffice": "GULSHAN-1",
      "village": "GULSHAN"
    },
    "permanentAddress": {
      "division": "CHITTAGONG",
      "district": "COMILLA",
      "upazila": "COMILLA SADAR",
      "postOffice": "COMILLA",
      "village": "COMILLA TOWN"
    },
    "photo": "base64_encoded_photo"
  },
  "photoMatchScore": 95.5,
  "photoMatchStatus": "MATCHED",
  "duplicateCheck": {
    "isDuplicate": false,
    "existingCustomerId": null
  },
  "timestamp": "2026-02-04T10:30:00Z"
}
```

---

### 3.3 Workflow Service

#### 3.3.1 Service Overview

| Attribute | Value |
|-----------|-------|
| **Service ID** | ulms-workflow-service |
| **Port** | 8083 |
| **Technology** | Spring Boot 3.2 + Camunda BPM 7.20 |
| **Database** | PostgreSQL (Camunda tables) |
| **BRD Reference** | BRD 6.3 |
| **SRS Reference** | SRS-WF-001 |

#### 3.3.2 Responsibilities

- BPMN 2.0 workflow orchestration
- Multi-level loan approval (7 levels)
- DMN decision tables for routing
- SLA monitoring and escalation
- Delegation of authority
- Digital signature integration
- Real-time workflow tracking
- Approval history and audit trail

#### 3.3.3 Workflow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           WORKFLOW SERVICE (Camunda)                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                        REST API Layer                                        │   │
│  │  POST /start │ POST /approve │ POST /reject │ GET /status │ GET /pending    │   │
│  └──────────────────────────────────────┬──────────────────────────────────────┘   │
│                                          │                                          │
│  ┌──────────────────────────────────────┼──────────────────────────────────────┐   │
│  │                       Camunda Engine                                         │   │
│  │  ┌────────────────────────────────────────────────────────────────────────┐ │   │
│  │  │                    BPMN Process Definitions                            │ │   │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │ │   │
│  │  │  │ Loan Approval│  │  Rescheduling│  │  Write-Off   │                 │ │   │
│  │  │  │   Process    │  │   Process    │  │   Process    │                 │ │   │
│  │  │  └──────────────┘  └──────────────┘  └──────────────┘                 │ │   │
│  │  └────────────────────────────────────────────────────────────────────────┘ │   │
│  │  ┌────────────────────────────────────────────────────────────────────────┐ │   │
│  │  │                    DMN Decision Tables                                 │ │   │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │ │   │
│  │  │  │ Amount-Based │  │ Product-Based│  │  Risk-Based  │                 │ │   │
│  │  │  │   Routing    │  │   Routing    │  │   Routing    │                 │ │   │
│  │  │  └──────────────┘  └──────────────┘  └──────────────┘                 │ │   │
│  │  └────────────────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────┬──────────────────────────────────────┘   │
│                                          │                                          │
│  ┌──────────────────────────────────────┼──────────────────────────────────────┐   │
│  │                       Service Layer                                          │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                 │   │
│  │  │ ApprovalService│  │ SLAMonitor     │  │ Delegation     │                 │   │
│  │  │                │  │ Service        │  │ Service        │                 │   │
│  │  └────────────────┘  └────────────────┘  └────────────────┘                 │   │
│  └──────────────────────────────────────┬──────────────────────────────────────┘   │
│                                          │                                          │
│          ┌───────────────────────────────┼───────────────────────────────────┐     │
│          ▼                               ▼                               ▼         │
│  ┌───────────────┐            ┌───────────────┐            ┌───────────────┐       │
│  │  PostgreSQL   │            │     Kafka     │            │  Notification │       │
│  │ (Camunda DB)  │            │   (Events)    │            │   Service     │       │
│  └───────────────┘            └───────────────┘            └───────────────┘       │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

#### 3.3.4 BPMN Process: Loan Approval

```xml
<!-- loan-approval-process.bpmn -->
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">
  <bpmn:process id="loan-approval" name="Loan Approval Process" isExecutable="true">

    <!-- Start Event -->
    <bpmn:startEvent id="start" name="Application Submitted">
      <bpmn:outgoing>flow1</bpmn:outgoing>
    </bpmn:startEvent>

    <!-- DMN: Determine Approval Level -->
    <bpmn:businessRuleTask id="determineLevel" name="Determine Approval Level"
                           camunda:decisionRef="approval-level-decision">
      <bpmn:incoming>flow1</bpmn:incoming>
      <bpmn:outgoing>flow2</bpmn:outgoing>
    </bpmn:businessRuleTask>

    <!-- Gateway: Route by Level -->
    <bpmn:exclusiveGateway id="levelGateway" name="Approval Level?">
      <bpmn:incoming>flow2</bpmn:incoming>
      <bpmn:outgoing>toLevel1</bpmn:outgoing>
      <bpmn:outgoing>toLevel2</bpmn:outgoing>
      <bpmn:outgoing>toLevel3</bpmn:outgoing>
      <bpmn:outgoing>toLevel4</bpmn:outgoing>
      <bpmn:outgoing>toLevel5</bpmn:outgoing>
      <bpmn:outgoing>toLevel6</bpmn:outgoing>
      <bpmn:outgoing>toLevel7</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <!-- User Tasks for Each Approval Level -->
    <bpmn:userTask id="level1Approval" name="Branch Credit Head Approval"
                   camunda:candidateGroups="BRANCH_CREDIT_HEAD">
      <bpmn:extensionElements>
        <camunda:taskListener event="create"
                              class="com.ulms.workflow.listener.SLAListener"/>
      </bpmn:extensionElements>
    </bpmn:userTask>

    <!-- Additional levels... -->

    <!-- End Events -->
    <bpmn:endEvent id="approved" name="Loan Approved"/>
    <bpmn:endEvent id="rejected" name="Loan Rejected"/>

  </bpmn:process>
</bpmn:definitions>
```

#### 3.3.5 DMN Decision Table: Approval Routing

```dmn
Decision Table: Approval Level Routing

| Amount (BDT) | Customer Type | Product Category | Required Level |
|--------------|---------------|------------------|----------------|
| ≤ 500000     | *             | *                | LEVEL_1        |
| 500001-1000000| *            | *                | LEVEL_2        |
| 1000001-2500000| *           | *                | LEVEL_3        |
| 2500001-10000000| *          | *                | LEVEL_4        |
| 10000001-50000000| *         | *                | LEVEL_5        |
| 50000001-100000000| *        | *                | LEVEL_6        |
| > 100000000  | *             | *                | LEVEL_7        |
```

#### 3.3.6 API Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/v1/workflow/start` | POST | Start approval workflow | JWT |
| `/api/v1/workflow/approve/{taskId}` | POST | Approve loan | JWT + APPROVER |
| `/api/v1/workflow/reject/{taskId}` | POST | Reject loan | JWT + APPROVER |
| `/api/v1/workflow/return/{taskId}` | POST | Return for revision | JWT + APPROVER |
| `/api/v1/workflow/delegate/{taskId}` | POST | Delegate approval | JWT + APPROVER |
| `/api/v1/workflow/pending` | GET | Get pending approvals | JWT |
| `/api/v1/workflow/status/{processId}` | GET | Workflow status | JWT |
| `/api/v1/workflow/history/{applicationId}` | GET | Approval history | JWT |
| `/api/v1/workflow/sla-breaches` | GET | SLA breach report | JWT + ADMIN |

---

### 3.4 Document Service

#### 3.4.1 Service Overview

| Attribute | Value |
|-----------|-------|
| **Service ID** | ulms-document-service |
| **Port** | 8084 |
| **Technology** | Spring Boot 3.2 + MinIO |
| **Storage** | MinIO (S3-compatible) |
| **Encryption** | AES-256-GCM |
| **BRD Reference** | BRD 6.7 |
| **SRS Reference** | SRS-LOS-004 |

#### 3.4.2 Responsibilities

- Secure document upload with AES-256 encryption
- Virus scanning before storage
- Version control and history
- Document checklist management per product
- Access control (role-based)
- Document expiry alerts
- OCR text extraction for searchability
- Thumbnail generation

#### 3.4.3 API Endpoints

| Endpoint | Method | Description | Max Size |
|----------|--------|-------------|----------|
| `/api/v1/documents/upload` | POST | Upload document | 20MB |
| `/api/v1/documents/bulk-upload` | POST | Bulk upload (max 10) | 50MB |
| `/api/v1/documents/{id}` | GET | Download document | - |
| `/api/v1/documents/{id}/metadata` | GET | Get metadata | - |
| `/api/v1/documents/{id}/versions` | GET | Version history | - |
| `/api/v1/documents/checklist/{productId}` | GET | Product document checklist | - |
| `/api/v1/documents/missing/{applicationId}` | GET | Missing documents | - |
| `/api/v1/documents/expiring` | GET | Expiring documents | - |

#### 3.4.4 Document Categories

| Category | Document Types | Max Size | Retention |
|----------|---------------|----------|-----------|
| **Identity** | NID, Passport, Photo | 5MB | 10 years |
| **Income** | Salary slip, Bank statement | 10MB | 7 years |
| **Property** | Title deed, Mutation | 20MB | Loan term + 7 years |
| **Collateral** | Valuation report, Insurance | 15MB | Loan term + 7 years |
| **Legal** | Board resolution, Agreement | 20MB | Loan term + 7 years |

---

### 3.5 BRPD Compliance Service

#### 3.5.1 Service Overview

| Attribute | Value |
|-----------|-------|
| **Service ID** | ulms-brpd-service |
| **Port** | 8085 |
| **Technology** | Spring Boot 3.2 + Quartz Scheduler |
| **Database** | PostgreSQL (loan_classification) |
| **BRD Reference** | BRD 6.6.2, 9.1 |
| **SRS Reference** | SRS-BRPD-001 |

#### 3.5.2 Responsibilities

- Daily loan classification (7-stage per BRPD 15/2024)
- DPD (Days Past Due) calculation
- Provision calculation by classification
- Interest suspense accounting
- NPA migration tracking
- CL-1 to CL-5 report generation
- Classification history and audit trail

#### 3.5.3 Classification Rules (BRPD 15/2024)

| Classification | DPD Range | Provision % | Interest Treatment |
|----------------|-----------|-------------|-------------------|
| STD-0 (Standard) | 0 | 1% | Accrue normally |
| STD-1 (Watch) | 1-30 | 1% | Accrue normally |
| STD-2 (Caution) | 31-60 | 1% | Accrue normally |
| SMA (Special Mention) | 61-90 | 5% | Accrue normally |
| SS (Substandard) | 91-180 | 20% | Suspend interest |
| DF (Doubtful) | 181-365 | 50% | Suspend interest |
| B/L (Bad/Loss) | >365 | 100% | Write-off interest |

#### 3.5.4 Daily Classification Job

```java
@Service
public class LoanClassificationService {

    @Scheduled(cron = "0 30 2 * * ?") // Daily at 2:30 AM
    @Transactional
    public void performDailyClassification() {
        List<LoanAccount> activeLoans = loanRepository.findActiveLoans();

        for (LoanAccount loan : activeLoans) {
            // Calculate DPD
            int dpd = calculateDPD(loan);

            // Determine new classification
            Classification newClassification = determineClassification(dpd);

            // Check for classification change
            if (loan.getClassification() != newClassification) {
                // Create classification history record
                ClassificationHistory history = createHistory(loan, newClassification, dpd);
                historyRepository.save(history);

                // Update loan classification
                loan.setClassification(newClassification);
                loan.setDpd(dpd);
                loan.setLastClassificationDate(LocalDate.now());
                loanRepository.save(loan);

                // Calculate and post provision GL entry
                BigDecimal provisionAmount = calculateProvision(loan, newClassification);
                postProvisionEntry(loan, provisionAmount);

                // Handle interest suspense if applicable
                if (newClassification.isNPA()) {
                    handleInterestSuspense(loan);
                }

                // Publish classification change event
                eventPublisher.publish(new LoanClassificationChangedEvent(loan));
            }
        }

        // Generate daily summary report
        generateDailySummary();
    }

    private Classification determineClassification(int dpd) {
        if (dpd == 0) return Classification.STD_0;
        if (dpd <= 30) return Classification.STD_1;
        if (dpd <= 60) return Classification.STD_2;
        if (dpd <= 90) return Classification.SMA;
        if (dpd <= 180) return Classification.SS;
        if (dpd <= 365) return Classification.DF;
        return Classification.BL;
    }
}
```

#### 3.5.5 API Endpoints

| Endpoint | Method | Description | Schedule |
|----------|--------|-------------|----------|
| `/api/v1/brpd/classification/run` | POST | Trigger manual classification | On-demand |
| `/api/v1/brpd/classification/{loanId}` | GET | Get loan classification | - |
| `/api/v1/brpd/classification/history/{loanId}` | GET | Classification history | - |
| `/api/v1/brpd/reports/cl1` | GET | CL-1 Report (Classified Loans) | Monthly |
| `/api/v1/brpd/reports/cl2` | GET | CL-2 Report (Provisioning) | Monthly |
| `/api/v1/brpd/reports/cl3` | GET | CL-3 Report (Recovery) | Monthly |
| `/api/v1/brpd/reports/cl4` | GET | CL-4 Report (Write-off) | Monthly |
| `/api/v1/brpd/reports/cl5` | GET | CL-5 Report (Restructured) | Monthly |
| `/api/v1/brpd/dashboard` | GET | NPA Dashboard | Real-time |

---

### 3.6 Notification Service

#### 3.6.1 Service Overview

| Attribute | Value |
|-----------|-------|
| **Service ID** | ulms-notification-service |
| **Port** | 8086 |
| **Technology** | Spring Boot 3.2 + Kafka |
| **Queue** | Kafka (notifications topic) |
| **BRD Reference** | BRD 6.3.2 |

#### 3.6.2 Responsibilities

- Multi-channel notifications (SMS, Email, Push)
- Template engine (Bengali + English)
- Delivery status tracking
- Retry mechanism for failed deliveries
- Notification preferences per customer
- Scheduled notifications (reminders)
- Bulk notification campaigns

#### 3.6.3 Notification Channels

| Channel | Provider | Rate Limit | Retry |
|---------|----------|-----------|-------|
| **SMS** | Robi/GP API | 100/sec | 3 attempts |
| **Email** | AWS SES | 50/sec | 3 attempts |
| **Push** | Firebase FCM | 1000/sec | 2 attempts |
| **In-App** | WebSocket | Unlimited | None |

#### 3.6.4 Notification Templates

```java
public enum NotificationType {
    LOAN_APPLICATION_RECEIVED("loan.application.received"),
    LOAN_APPROVED("loan.approved"),
    LOAN_REJECTED("loan.rejected"),
    LOAN_DISBURSED("loan.disbursed"),
    EMI_REMINDER("emi.reminder"),
    EMI_OVERDUE("emi.overdue"),
    PAYMENT_RECEIVED("payment.received"),
    CLASSIFICATION_CHANGE("classification.change"),
    DOCUMENT_EXPIRING("document.expiring"),
    OTP_VERIFICATION("otp.verification");

    private final String templateKey;
}
```

#### 3.6.5 Template Example (Bengali)

```json
{
  "templateKey": "emi.reminder",
  "language": "bn",
  "channels": ["SMS", "EMAIL"],
  "smsTemplate": "প্রিয় {{customerName}}, আপনার {{productName}} ঋণের EMI {{amount}} টাকা {{dueDate}} তারিখে বকেয়া। অনুগ্রহ করে সময়মত পরিশোধ করুন। - ULMS",
  "emailSubject": "EMI প্রদানের অনুস্মারক - {{loanAccountNumber}}",
  "emailTemplate": "email-templates/emi-reminder-bn.html"
}
```

---

### 3.7 Analytics Service

#### 3.7.1 Service Overview

| Attribute | Value |
|-----------|-------|
| **Service ID** | ulms-analytics-service |
| **Port** | 8087 |
| **Technology** | Spring Boot 3.2 + Python ML |
| **ML Framework** | scikit-learn, XGBoost |
| **BRD Reference** | BRD 11.2, 6.2.2 |
| **SRS Reference** | SRS-CS-001 |

#### 3.7.2 Responsibilities

- ML-based credit scoring
- DBR/DTI calculation
- ECL (Expected Credit Loss) calculation - IFRS-9
- Dashboard aggregation queries
- Predictive analytics (default probability)
- Portfolio risk analysis
- Custom report generation

#### 3.7.3 Credit Scoring Model

```python
# credit_scoring_service.py
class CreditScoringService:
    def calculate_score(self, application_data):
        features = self.extract_features(application_data)

        # Feature weights (configurable)
        weights = {
            'customer_profile': 0.20,
            'financial_capacity': 0.30,
            'credit_history': 0.25,
            'collateral': 0.15,
            'industry_risk': 0.10
        }

        # Component scores
        profile_score = self.score_customer_profile(features)
        financial_score = self.score_financial_capacity(features)
        credit_score = self.score_credit_history(features)
        collateral_score = self.score_collateral(features)
        industry_score = self.score_industry_risk(features)

        # Weighted total
        total_score = (
            profile_score * weights['customer_profile'] +
            financial_score * weights['financial_capacity'] +
            credit_score * weights['credit_history'] +
            collateral_score * weights['collateral'] +
            industry_score * weights['industry_risk']
        )

        return {
            'totalScore': round(total_score),
            'grade': self.get_grade(total_score),
            'components': {
                'customerProfile': {'score': profile_score, 'weight': 20},
                'financialCapacity': {'score': financial_score, 'weight': 30},
                'creditHistory': {'score': credit_score, 'weight': 25},
                'collateral': {'score': collateral_score, 'weight': 15},
                'industryRisk': {'score': industry_score, 'weight': 10}
            },
            'recommendation': self.get_recommendation(total_score),
            'explanation': self.generate_explanation(features)
        }

    def get_grade(self, score):
        if score >= 850: return 'AAA'
        if score >= 750: return 'AA'
        if score >= 650: return 'A'
        if score >= 550: return 'BBB'
        if score >= 450: return 'BB'
        return 'B'
```

#### 3.7.4 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/analytics/credit-score` | POST | Calculate credit score |
| `/api/v1/analytics/dbr-dti` | POST | Calculate DBR/DTI |
| `/api/v1/analytics/ecl/{loanId}` | GET | ECL calculation |
| `/api/v1/analytics/portfolio-risk` | GET | Portfolio risk analysis |
| `/api/v1/analytics/dashboard/executive` | GET | Executive dashboard data |
| `/api/v1/analytics/dashboard/branch` | GET | Branch dashboard data |
| `/api/v1/analytics/predictions/default` | POST | Default probability |

---

### 3.8 Integration Gateway

#### 3.8.1 Service Overview

| Attribute | Value |
|-----------|-------|
| **Service ID** | ulms-integration-gateway |
| **Port** | 8088 |
| **Technology** | Apache Camel 4.3 |
| **Pattern** | ESB + SAGA |
| **BRD Reference** | BRD 8.1 |
| **SRS Reference** | SRS 9.1 |

#### 3.8.2 Responsibilities

- CBS (Core Banking System) integration adapter
- Protocol translation (REST ↔ SOAP ↔ File)
- Message transformation
- SAGA orchestration for distributed transactions
- Dead letter queue handling
- Integration monitoring and alerting
- Retry and circuit breaker patterns

#### 3.8.3 Camel Routes

```java
@Component
public class IntegrationRoutes extends RouteBuilder {

    @Override
    public void configure() {

        // Error handling
        errorHandler(deadLetterChannel("kafka:dlq.integration.failed")
            .maximumRedeliveries(3)
            .redeliveryDelay(5000)
            .useExponentialBackOff());

        // CBS Account Creation Route (SAGA)
        from("kafka:loan.approved")
            .routeId("cbs-account-creation")
            .log("Processing approved loan: ${body}")
            .unmarshal().json(JsonLibrary.Jackson, LoanApprovedEvent.class)
            .process(this::transformToCBSRequest)
            .choice()
                .when(header("cbsProtocol").isEqualTo("SOAP"))
                    .to("cxf:bean:cbsSoapEndpoint")
                .otherwise()
                    .setHeader("Authorization", constant("Bearer ${cbs.token}"))
                    .to("https://cbs.bank.api/accounts")
            .end()
            .choice()
                .when(header("CamelHttpResponseCode").isEqualTo(200))
                    .log("CBS account created successfully")
                    .to("kafka:loan.account.created")
                .otherwise()
                    .log("CBS account creation failed")
                    .to("kafka:loan.account.failed")
                    .process(this::triggerCompensation)
            .end();

        // CIB Batch File Transfer Route
        from("quartz:cib-batch?cron=0+0+2+1+*+?")
            .routeId("cib-batch-file-transfer")
            .bean("cibBatchService", "generateBatchFile")
            .setHeader("CamelFileName", simple("CIB_${date:now:yyyyMM}.txt"))
            .to("sftp://sftp.bb.org.bd/cib?username={{bb.sftp.user}}&privateKeyFile={{bb.sftp.key}}")
            .log("CIB batch file transferred successfully");

        // Payment Gateway Routes
        from("direct:bkash-disbursement")
            .routeId("bkash-integration")
            .setHeader("Authorization", simple("Bearer ${bkash.token}"))
            .to("https://bkash.com/api/disbursement")
            .unmarshal().json();

        from("direct:nagad-disbursement")
            .routeId("nagad-integration")
            .setHeader("Authorization", simple("Bearer ${nagad.token}"))
            .to("https://nagad.com.bd/api/disbursement")
            .unmarshal().json();
    }
}
```

#### 3.8.4 Supported Integrations

| External System | Protocol | Direction | Pattern |
|-----------------|----------|-----------|---------|
| Core Banking (CBS) | REST/SOAP | Bidirectional | SAGA |
| CIB Online | REST (mTLS) | Outbound | Request-Reply |
| NID Wing | REST | Outbound | Request-Reply |
| Bangladesh Bank SFTP | SFTP | Outbound | Batch |
| bKash | REST | Outbound | Async |
| Nagad | REST | Outbound | Async |
| Rocket | REST | Outbound | Async |
| SMS Gateway | HTTP | Outbound | Fire-and-forget |
| Email (SES) | SMTP/API | Outbound | Fire-and-forget |

---

## 4. Inter-Service Communication

### 4.1 Communication Patterns

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    INTER-SERVICE COMMUNICATION PATTERNS                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐ │
│  │                        SYNCHRONOUS (REST/gRPC)                                 │ │
│  │                                                                                 │ │
│  │   Service A ──────────────────► Service B                                      │ │
│  │              HTTP Request/Response                                             │ │
│  │                                                                                 │ │
│  │   Use Cases:                                                                   │ │
│  │   - CIB inquiry (real-time)                                                   │ │
│  │   - NID verification (real-time)                                              │ │
│  │   - Credit score calculation                                                  │ │
│  │   - Document retrieval                                                        │ │
│  │                                                                                 │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐ │
│  │                        ASYNCHRONOUS (Kafka Events)                             │ │
│  │                                                                                 │ │
│  │   Service A ──► Kafka Topic ──► Service B                                      │ │
│  │              Publish             Subscribe                                      │ │
│  │                    │                                                           │ │
│  │                    └──► Service C (also subscribes)                            │ │
│  │                                                                                 │ │
│  │   Use Cases:                                                                   │ │
│  │   - Loan approved → Notification Service                                       │ │
│  │   - Loan approved → Integration Gateway (CBS)                                  │ │
│  │   - Classification changed → Analytics Service                                 │ │
│  │   - Audit events → ELK Stack                                                  │ │
│  │                                                                                 │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Synchronous Communication (REST)

| Source Service | Target Service | Endpoint | Purpose |
|---------------|----------------|----------|---------|
| Frontend | CIB Service | POST /cib/inquiry | Credit check |
| Frontend | NID Service | POST /nid/verify | Customer onboarding |
| Frontend | Document Service | POST /documents/upload | File upload |
| Workflow Service | Analytics Service | POST /credit-score | Scoring |
| BRPD Service | Fineract | GET /loans | Loan data |

### 4.3 Asynchronous Communication (Kafka)

| Event | Producer | Consumers | Topic |
|-------|----------|-----------|-------|
| LoanApplicationCreated | LOS Module | Workflow, Notification | loan.applications |
| LoanApproved | Workflow Service | Integration, Notification, Analytics | loan.approvals |
| LoanDisbursed | Integration Gateway | Notification, Analytics | loan.disbursements |
| PaymentReceived | Fineract | Notification, Analytics | loan.payments |
| ClassificationChanged | BRPD Service | Notification, Analytics | loan.classifications |
| NotificationRequest | All Services | Notification Service | notifications |
| AuditEvent | All Services | ELK Stack | audit.events |

---

## 5. Service Discovery & Load Balancing

### 5.1 Kubernetes Service Discovery

```yaml
# Example: CIB Service Discovery
apiVersion: v1
kind: Service
metadata:
  name: ulms-cib-service
  namespace: ulms-production
spec:
  selector:
    app: ulms-cib-service
  ports:
    - protocol: TCP
      port: 8081
      targetPort: 8081
  type: ClusterIP

---
# Kong Ingress Route
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ulms-cib-ingress
  annotations:
    konghq.com/strip-path: "true"
spec:
  ingressClassName: kong
  rules:
    - http:
        paths:
          - path: /api/cib
            pathType: Prefix
            backend:
              service:
                name: ulms-cib-service
                port:
                  number: 8081
```

### 5.2 Load Balancing Strategy

| Layer | Strategy | Implementation |
|-------|----------|---------------|
| **API Gateway** | Round-robin | Kong upstream |
| **Services** | Least connections | Kubernetes Service |
| **Database** | Read replicas | Patroni/pgBouncer |
| **Kafka** | Partition-based | Consumer groups |

---

## 6. Resilience Patterns

### 6.1 Circuit Breaker (Resilience4j)

```java
@Service
public class CIBApiClient {

    @CircuitBreaker(name = "cibApi", fallbackMethod = "cibFallback")
    @Retry(name = "cibApi")
    @RateLimiter(name = "cibApi")
    public Mono<CIBResponse> inquiryCIB(CIBRequest request) {
        return webClient.post()
            .uri("/api/inquiry")
            .bodyValue(request)
            .retrieve()
            .bodyToMono(CIBResponse.class);
    }

    public Mono<CIBResponse> cibFallback(CIBRequest request, Exception ex) {
        log.warn("CIB circuit breaker open, returning cached response");
        return cibCacheService.getCachedReport(request.getNidNumber());
    }
}
```

**Circuit Breaker Configuration:**
```yaml
resilience4j:
  circuitbreaker:
    instances:
      cibApi:
        registerHealthIndicator: true
        slidingWindowSize: 10
        minimumNumberOfCalls: 5
        failureRateThreshold: 50
        waitDurationInOpenState: 60s
        permittedNumberOfCallsInHalfOpenState: 3
  retry:
    instances:
      cibApi:
        maxAttempts: 3
        waitDuration: 5s
        exponentialBackoffMultiplier: 2
  ratelimiter:
    instances:
      cibApi:
        limitForPeriod: 60
        limitRefreshPeriod: 1m
```

### 6.2 Timeout Configuration

| Service | Read Timeout | Connect Timeout | Write Timeout |
|---------|-------------|-----------------|---------------|
| CIB Service | 120s | 10s | 30s |
| NID Service | 30s | 5s | 10s |
| Workflow Service | 60s | 5s | 30s |
| Document Service | 60s | 5s | 120s |
| Integration Gateway | 180s | 10s | 60s |

### 6.3 Bulkhead Pattern

```java
@Bulkhead(name = "cibApi", type = Bulkhead.Type.THREADPOOL)
public CompletableFuture<CIBResponse> inquiryCIBAsync(CIBRequest request) {
    return CompletableFuture.supplyAsync(() -> cibApiClient.inquiryCIB(request));
}
```

**Bulkhead Configuration:**
```yaml
resilience4j:
  bulkhead:
    instances:
      cibApi:
        maxConcurrentCalls: 20
        maxWaitDuration: 10s
  thread-pool-bulkhead:
    instances:
      cibApi:
        maxThreadPoolSize: 10
        coreThreadPoolSize: 5
        queueCapacity: 50
```

---

## 7. API Contracts

### 7.1 OpenAPI 3.0 Specification

Each microservice exposes its API contract via OpenAPI 3.0:

| Service | Swagger URL | Endpoints |
|---------|-------------|-----------|
| CIB Service | /swagger-ui/cib | 7 |
| NID Service | /swagger-ui/nid | 5 |
| Workflow Service | /swagger-ui/workflow | 9 |
| Document Service | /swagger-ui/documents | 8 |
| BRPD Service | /swagger-ui/brpd | 10 |
| Notification Service | /swagger-ui/notifications | 6 |
| Analytics Service | /swagger-ui/analytics | 7 |
| Integration Gateway | /swagger-ui/integration | 5 |

### 7.2 Standardized Response Format

```json
{
  "success": true,
  "data": {
    // Response payload
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "timestamp": "2026-02-04T10:30:00Z",
    "traceId": "abc123xyz"
  },
  "error": null
}
```

### 7.3 Error Response Format

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERR_CIB_TIMEOUT",
    "message": "CIB service timeout",
    "details": [
      {
        "field": null,
        "message": "Bangladesh Bank CIB service did not respond within 2 minutes"
      }
    ],
    "traceId": "abc123xyz",
    "timestamp": "2026-02-04T10:30:00Z"
  }
}
```

---

## 8. Deployment Configuration

### 8.1 Kubernetes Deployment Template

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ulms-cib-service
  namespace: ulms-production
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: ulms-cib-service
  template:
    metadata:
      labels:
        app: ulms-cib-service
    spec:
      containers:
      - name: cib-service
        image: unisoft/ulms-cib-service:1.0.0
        ports:
        - containerPort: 8081
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "production"
        - name: CIB_KEYSTORE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: cib-secrets
              key: keystore-password
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8081
          initialDelaySeconds: 60
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8081
          initialDelaySeconds: 30
          periodSeconds: 5
```

### 8.2 Resource Allocation

| Service | CPU Request | CPU Limit | Memory Request | Memory Limit | Replicas |
|---------|------------|-----------|----------------|--------------|----------|
| CIB Service | 500m | 1000m | 1Gi | 2Gi | 2-5 |
| NID Service | 250m | 500m | 512Mi | 1Gi | 2-4 |
| Workflow Service | 500m | 1000m | 1Gi | 2Gi | 2-5 |
| Document Service | 500m | 1000m | 1Gi | 2Gi | 2-4 |
| BRPD Service | 500m | 1000m | 1Gi | 2Gi | 2-3 |
| Notification Service | 250m | 500m | 512Mi | 1Gi | 2-4 |
| Analytics Service | 1000m | 2000m | 2Gi | 4Gi | 2-4 |
| Integration Gateway | 500m | 1000m | 1Gi | 2Gi | 2-4 |

### 8.3 Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ulms-cib-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ulms-cib-service
  minReplicas: 2
  maxReplicas: 10
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

---

## 9. Service Dependencies

### 9.1 Dependency Matrix

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         SERVICE DEPENDENCY MATRIX                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│              │ CIB │ NID │ WF │ DOC │ BRPD │ NOTIF │ ANALYTICS │ INT-GW │ FINERACT │
│  ────────────┼─────┼─────┼────┼─────┼──────┼───────┼───────────┼────────┼──────────│
│  CIB         │  -  │     │    │     │      │   ●   │           │        │    ●     │
│  NID         │     │  -  │    │     │      │   ●   │           │        │    ●     │
│  Workflow    │  ●  │  ●  │ -  │  ●  │      │   ●   │     ●     │        │    ●     │
│  Document    │     │     │    │  -  │      │   ●   │           │        │    ●     │
│  BRPD        │     │     │    │     │  -   │   ●   │           │        │    ●     │
│  Notification│     │     │    │     │      │   -   │           │        │          │
│  Analytics   │  ●  │     │    │     │  ●   │       │     -     │        │    ●     │
│  Int-Gateway │     │     │    │     │      │   ●   │           │   -    │    ●     │
│                                                                                      │
│  Legend: ● = depends on                                                             │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Startup Order

1. **Infrastructure** (PostgreSQL, Redis, Kafka, MinIO)
2. **Core Platform** (Apache Fineract)
3. **Foundation Services** (Notification, Document)
4. **Integration Services** (CIB, NID, Integration Gateway)
5. **Business Services** (Workflow, BRPD, Analytics)
6. **API Gateway** (Kong)

### 9.3 Health Check Dependencies

| Service | Critical Dependencies | Graceful Degradation |
|---------|----------------------|---------------------|
| CIB Service | PostgreSQL, Redis, BB CIB API | Cache fallback if BB unavailable |
| NID Service | PostgreSQL, NIDW API | Return last known data |
| Workflow Service | PostgreSQL, Kafka, Camunda | Queue tasks if Kafka down |
| BRPD Service | PostgreSQL, Fineract | Delay classification job |
| Notification Service | Kafka, SMS/Email gateways | Retry queue |

---

## 10. Appendices

### Appendix A: Service Ports Summary

| Service | HTTP Port | Management Port | Debug Port |
|---------|-----------|-----------------|------------|
| CIB Service | 8081 | 8091 | 5081 |
| NID Service | 8082 | 8092 | 5082 |
| Workflow Service | 8083 | 8093 | 5083 |
| Document Service | 8084 | 8094 | 5084 |
| BRPD Service | 8085 | 8095 | 5085 |
| Notification Service | 8086 | 8096 | 5086 |
| Analytics Service | 8087 | 8097 | 5087 |
| Integration Gateway | 8088 | 8098 | 5088 |
| Fineract Core | 8443 | 8543 | 5443 |

### Appendix B: Environment Variables

| Variable | Service | Description |
|----------|---------|-------------|
| `SPRING_PROFILES_ACTIVE` | All | Environment profile |
| `DATABASE_URL` | All | PostgreSQL connection |
| `REDIS_URL` | CIB, NID | Redis connection |
| `KAFKA_BOOTSTRAP_SERVERS` | All | Kafka brokers |
| `CIB_KEYSTORE_PASSWORD` | CIB | mTLS keystore password |
| `VAULT_TOKEN` | All | Vault access token |
| `KEYCLOAK_URL` | All | Keycloak server URL |

### Appendix C: References

1. Spring Boot 3.2 Documentation
2. Apache Camel 4.3 Enterprise Integration Patterns
3. Camunda Platform 7 Documentation
4. Resilience4j Configuration Guide
5. Kubernetes Best Practices
6. ULMS BRD v1.0
7. ULMS SRS v2.0
8. ULMS Technology Stack v2.0

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

*This Microservices Architecture Blueprint provides the detailed specification for all 8 custom microservices extending Apache Fineract for ULMS v2.0.*

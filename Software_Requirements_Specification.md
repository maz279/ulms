# Software Requirements Specification (SRS)
## Unisoft Loan Management System (ULMS) v2.0
### Apache Fineract-Based Implementation for Bangladesh Banking Sector

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Software Requirements Specification - ULMS v2.0 |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 2.0 |
| **Date** | February 3, 2026 |
| **Prepared By** | Senior Solutions Architect, Technical Lead |
| **Reviewed By** | Chief Technology Officer, QA Lead |
| **Classification** | Confidential - Internal Use |
| **Status** | Approved for Development |

**Standards Compliance:**
- IEEE 830-1998 - Recommended Practice for Software Requirements Specifications
- ISO/IEC/IEEE 29148-2018 - Systems and Software Engineering - Life Cycle Processes

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | January 26, 2026 | Technical Team | Initial SRS |
| 2.0 | February 3, 2026 | Senior Solutions Architect | Fineract CE alignment |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Architecture](#2-system-architecture)
3. [Functional Requirements](#3-functional-requirements)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [Interface Requirements](#5-interface-requirements)
6. [Database Requirements](#6-database-requirements)
7. [Security Requirements](#7-security-requirements)
8. [Compliance Requirements](#8-compliance-requirements)
9. [Integration Requirements](#9-integration-requirements)
10. [Appendices](#10-appendices)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) defines the complete technical requirements for the **Unisoft Loan Management System (ULMS) v2.0**, an enterprise-grade loan management platform built on **Apache Fineract Community Edition**. This document serves as the primary technical reference for development, testing, and deployment teams.

### 1.2 Scope

ULMS v2.0 encompasses:
- Complete loan lifecycle management system
- Bangladesh Bank regulatory compliance (BRPD 15/2024)
- CIB Online integration
- NID/e-KYC verification
- Islamic banking product support
- Multi-channel access (Web, Mobile, API)
- Enterprise reporting and analytics

### 1.3 Document Alignment

| Document | Reference | Relationship |
|----------|-----------|--------------|
| RFP LMS-BD-2026-001 | All Sections | Baseline requirements |
| BRD v1.0 | Sections 5-13 | Business requirements mapping |
| URD v2.0 | All Sections | User requirements translation |
| Technology Stack v2.0 | All Sections | Technical implementation |
| Fineract Analysis Report | Section 3.1 | Platform capabilities |

### 1.4 Definitions and Acronyms

| Term | Definition |
|------|------------|
| **API** | Application Programming Interface |
| **CQRS** | Command Query Responsibility Segregation |
| **DDD** | Domain-Driven Design |
| **DTO** | Data Transfer Object |
| **ESB** | Enterprise Service Bus |
| **HSM** | Hardware Security Module |
| **IdP** | Identity Provider |
| **JPA** | Java Persistence API |
| **JWT** | JSON Web Token |
| **K8s** | Kubernetes |
| **ORM** | Object-Relational Mapping |
| **PKI** | Public Key Infrastructure |
| **REST** | Representational State Transfer |
| **SAGA** | Long-running transaction pattern |
| **SOA** | Service-Oriented Architecture |
| **TDE** | Transparent Data Encryption |

---

## 2. System Architecture

### 2.1 Architectural Overview

ULMS v2.0 follows a **hybrid microservices architecture** built on Apache Fineract:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │   React Web  │  │  React Native│  │   Partner    │  │   CBS/MFS        │ │
│  │   Frontend   │  │   CPV App    │  │   APIs       │  │   Systems        │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘ │
└─────────┼─────────────────┼─────────────────┼───────────────────┼───────────┘
          │                 │                 │                   │
          └─────────────────┴─────────────────┴───────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Kong API Gateway 3.5                              │   │
│  │  - JWT Validation  - Rate Limiting  - SSL Termination  - Routing    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ULMS CUSTOM MICROSERVICES                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │   CIB    │ │   NID    │ │ Workflow │ │Document  │ │ Bangladesh       │  │
│  │ Service  │ │  e-KYC   │ │ Engine   │ │ Service  │ │ Reports          │  │
│  │(Spring)  │ │(Spring)  │ │(Camunda) │ │(Spring)  │ │ Service          │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘  │
│       │            │            │            │                │            │
│  ┌────┴─────┐ ┌────┴─────┐ ┌────┴─────┐ ┌────┴─────┐ ┌──────┴──────┐   │
│  │  BRPD    │ │Analytics │ │Notification│ │  CBS    │ │  Integration │   │
│  │Compliance│ │ Service  │ │ Service   │ │ Adapter │ │   Gateway   │   │
│  │ Service  │ │(Python)  │ │(Spring)   │ │(Camel)  │ │   (Kong)    │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    APACHE FINERACT CORE PLATFORM                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────────────┐ │
│  │    Loan      │ │   Savings    │ │  Accounting  │ │     Customer       │ │
│  │  Portfolio   │ │   Accounts   │ │   Engine     │ │   Management       │ │
│  │   Module     │ │   Module     │ │   Module     │ │    Module          │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────────────────┘ │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────────────┐ │
│  │   Charge     │ │  Scheduler   │ │  Collateral  │ │     Reporting      │ │
│  │   Engine     │ │   Engine     │ │  Management  │ │    Framework       │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATA & MESSAGING LAYER                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────────────┐   │
│  │ PostgreSQL │  │    Redis   │  │    Kafka   │  │   Elasticsearch    │   │
│  │  (Primary) │  │   (Cache)  │  │  (Events)  │  │   (Search/Log)     │   │
│  └────────────┘  └────────────┘  └────────────┘  └────────────────────┘   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                           │
│  │   MinIO    │  │  HashiCorp │  │  Prometheus│                           │
│  │  (DMS)     │  │    Vault   │  │  + Grafana │                           │
│  └────────────┘  └────────────┘  └────────────┘                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Specifications

#### 2.2.1 Apache Fineract Core

**Version:** Apache Fineract 1.10.0

**Modules Utilized:**

| Fineract Module | ULMS Usage | Customization |
|-----------------|------------|---------------|
| `loanaccount` | Core loan lifecycle | Extended for BRPD compliance |
| `savingsaccount` | Linked accounts | Standard usage |
| `accounting` | GL postings | Custom COA for Bangladesh |
| `client` | Customer management | NID integration |
| `scheduler` | DPD calculation | Custom classification job |
| `charge` | Fee management | Bangladesh fee types |
| `collateral` | Security management | Extended for CPV |
| `reporting` | Report framework | Custom templates |

#### 2.2.2 ULMS Custom Services

| Service | Tech Stack | Responsibility |
|---------|-----------|----------------|
| **cib-service** | Spring Boot 3.2, WebFlux | CIB Online API integration, batch processing |
| **nid-ekyc-service** | Spring Boot 3.2, REST | NID verification, biometric validation |
| **workflow-service** | Spring Boot 3.2, Camunda | Multi-level approval, SLA tracking |
| **document-service** | Spring Boot 3.2, MinIO | AES-256 encryption, version control |
| **brpd-service** | Spring Boot 3.2, Quartz | Classification, provisioning, reports |
| **notification-service** | Spring Boot 3.2, Kafka | SMS/Email/Push notifications |
| **analytics-service** | Spring Boot 3.2, Python ML | Dashboards, ECL calculations |
| **integration-gateway** | Apache Camel 4.3 | CBS adapter, protocol translation |

---

## 3. Functional Requirements

### 3.1 Loan Origination System (LOS)

#### 3.1.1 Customer Onboarding

**SRS-LOS-001: NID-Based Customer Registration**

**Description:** The system shall support customer registration using NID (National Identity Card) with real-time verification.

**Technical Specifications:**

| Parameter | Specification |
|-----------|--------------|
| API Endpoint | `POST /api/v1/customers` |
| NID Validation | Integration with NIDW (NID Wing) API |
| Response Time | < 5 seconds for NID verification |
| Data Fields | Name (Bengali/English), DOB, Address, Photo |
| Storage | Encrypted at rest (AES-256) |
| Audit | All NID queries logged |

**Data Model:**
```java
@Entity
@Table(name = "ulms_customers")
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "nid_number", unique = true, nullable = false, length = 20)
    @Encrypted
    private String nidNumber;
    
    @Column(name = "name_en", nullable = false)
    private String nameEnglish;
    
    @Column(name = "name_bn")
    private String nameBengali;
    
    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;
    
    @Embedded
    private Address presentAddress;
    
    @Embedded
    private Address permanentAddress;
    
    @Column(name = "mobile_number", nullable = false)
    private String mobileNumber;
    
    @Column(name = "email")
    private String email;
    
    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL)
    private List<LoanApplication> applications;
}
```

**Acceptance Criteria:**
- [ ] NID verification completes in < 5 seconds
- [ ] Customer data auto-populated from NID response
- [ ] Duplicate NID detection implemented
- [ ] Photo match verification (optional)

#### 3.1.2 Loan Application Processing

**SRS-LOS-002: Multi-Product Application Support**

**Description:** The system shall support multiple loan product types with configurable parameters.

**Product Types:**

| Product Code | Product Name | Category | Islamic |
|--------------|--------------|----------|---------|
| PL-001 | Personal Loan | Retail | No |
| HL-001 | Home Loan | Retail | No |
| AL-001 | Auto Loan | Retail | No |
| EL-001 | Education Loan | Retail | No |
| CC-001 | Credit Card | Retail | No |
| WC-001 | Working Capital | Commercial | No |
| TF-001 | Trade Finance | Commercial | No |
| PF-001 | Project Finance | Commercial | No |
| MU-001 | Murabaha | Retail | Yes |
| IJ-001 | Ijara | Retail | Yes |
| MS-001 | Musharaka | Commercial | Yes |
| MD-001 | Mudaraba | Commercial | Yes |

**Product Configuration Schema:**
```yaml
loan_product:
  code: "PL-001"
  name_en: "Personal Loan"
  name_bn: "ব্যক্তিগত ঋণ"
  category: "RETAIL"
  is_islamic: false
  
  amount_limits:
    min: 50000
    max: 2000000
    default: 500000
  
  interest_config:
    type: "FIXED"  # FIXED, FLOATING
    min_rate: 9.0
    max_rate: 18.0
    default_rate: 12.0
  
  tenor_limits:
    min_months: 12
    max_months: 60
    default_months: 36
  
  repayment:
    frequency: "MONTHLY"  # MONTHLY, QUARTERLY
    type: "EMI"  # EMI, BULLET
  
  charges:
    processing_fee:
      type: "PERCENTAGE"
      value: 1.0
    late_fee:
      type: "FIXED"
      value: 500
  
  required_documents:
    - NID
    - PHOTO
    - INCOME_PROOF
    - BANK_STATEMENT
  
  approval_workflow: "STANDARD"  # STANDARD, FAST_TRACK
```

### 3.2 Credit Management System

#### 3.2.1 CIB Integration

**SRS-CIB-001: Online CIB Inquiry**

**Description:** Real-time integration with Bangladesh Bank CIB Online system.

**API Specification:**

**Request:**
```http
POST /api/v1/cib/inquiry
Content-Type: application/json
Authorization: Bearer {jwt_token}

{
  "inquiryType": "INDIVIDUAL",
  "nidNumber": "1234567890123",
  "dateOfBirth": "1990-05-15",
  "purpose": "LOAN_APPLICATION",
  "applicationId": "APP-2026-000123"
}
```

**Response:**
```json
{
  "inquiryId": "CIB-20260203-001",
  "status": "SUCCESS",
  "reportDate": "2026-02-03T10:30:00Z",
  "subject": {
    "name": "MD. REZAUL KARIM",
    "nidNumber": "*********0123",
    "cibScore": 785,
    "riskGrade": "AA"
  },
  "facilities": [
    {
      "bankName": "EXAMPLE BANK LTD",
      "facilityType": "TERM_LOAN",
      "sanctionedAmount": 1000000,
      "outstandingAmount": 650000,
      "emiAmount": 25000,
      "classification": "STD",
      "overdueAmount": 0,
      "dpd": 0
    }
  ],
  "summary": {
    "totalFacilities": 3,
    "totalOutstanding": 1250000,
    "totalMonthlyEMI": 45000,
    "worstClassification": "STD",
    "maxDPD": 0
  }
}
```

**Integration Architecture:**
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   ULMS Web   │────▶│  CIB Service │────▶│  BB CIB      │
│   Frontend   │     │  (Spring)    │     │  Online API  │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  CIB Cache   │
                     │   (Redis)    │
                     │  TTL: 1 hour │
                     └──────────────┘
```

**Error Handling:**
| Error Code | Description | Retry Strategy |
|------------|-------------|----------------|
| CIB-001 | NID not found | No retry |
| CIB-002 | BB system timeout | 3 retries, 5s interval |
| CIB-003 | Invalid certificate | Alert admin |
| CIB-004 | Rate limit exceeded | Queue and retry |

#### 3.2.2 Credit Scoring Engine

**SRS-CS-001: Automated Credit Scoring**

**Description:** ML-based credit scoring with explainable results.

**Scoring Algorithm:**
```python
# Python Microservice (analytics-service)
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
        
        # Score calculation
        profile_score = self.score_customer_profile(features)
        financial_score = self.score_financial_capacity(features)
        credit_score = self.score_credit_history(features)
        collateral_score = self.score_collateral(features)
        industry_score = self.score_industry_risk(features)
        
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
```

**Scoring Matrix:**

| Score Range | Grade | Recommendation | Auto-Approval |
|-------------|-------|----------------|---------------|
| 850-1000 | AAA | Approve | Yes (up to limit) |
| 750-849 | AA | Approve | Yes (up to 50L) |
| 650-749 | A | Approve with conditions | No |
| 550-649 | BBB | Review manually | No |
| 450-549 | BB | High risk - senior approval | No |
| Below 450 | B | Reject | No |

### 3.3 Approval Workflow Engine

#### 3.3.1 Workflow Definition

**SRS-WF-001: Camunda-Based Workflow Engine**

**Description:** BPMN 2.0 workflow engine for multi-level approval.

**Workflow Model:**
```bpmn
┌─────────────────────────────────────────────────────────────────────────────┐
│                        LOAN APPROVAL WORKFLOW                                │
│                              (BPMN 2.0)                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   [Start] ──▶ [Application Submitted] ──▶ [Check Amount] ──┐                │
│                                                             │                │
│                                    ┌────────────────────────┘                │
│                                    │                                         │
│                                    ▼                                         │
│                      ┌─────────────────────────┐                            │
│                      │   Gateway: Amount Check  │                            │
│                      │  ≤5L? │ 5L-10L? │ 10L-25L? │ >25L?                   │
│                      └────────┴─────────┴──────────┴────────┘               │
│                          │         │          │            │                │
│                          ▼         ▼          ▼            ▼                │
│                   [Credit Head] [Branch Mgr] [Regional] [HO Credit]         │
│                          │         │          │            │                │
│                          └─────────┴──────────┴────────────┘                │
│                                          │                                   │
│                                          ▼                                   │
│                              [Approval Decision]                            │
│                                  /    │    \                                │
│                        [Approve]  [Reject]  [Return]                        │
│                             │         │         │                           │
│                             ▼         ▼         ▼                           │
│                      [Disburse]  [Notify]  [Revise]                         │
│                             │         │         │                           │
│                             └─────────┴─────────┘                           │
│                                          │                                   │
│                                          ▼                                   │
│                                     [End]                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

**DMN Decision Table:**
```dmn
| Amount (BDT) | Customer Type | Product | Required Approval |
|--------------|---------------|---------|-------------------|
| ≤ 5,00,000   | Individual    | Any     | Branch Credit Head |
| 5L - 10L     | Individual    | Any     | Branch Manager |
| 10L - 25L    | Any           | Any     | Regional Manager |
| 25L - 1Cr    | Any           | Any     | Head of Credit |
| 1Cr - 5Cr    | Any           | Any     | Credit Committee |
| 5Cr - 10Cr   | Any           | Any     | Deputy MD |
| > 10Cr       | Any           | Any     | Managing Director |
```

### 3.4 BRPD Compliance Engine

#### 3.4.1 Loan Classification

**SRS-BRPD-001: Automated Classification System**

**Description:** Daily batch job for loan classification per BRPD Circular 15/2024.

**Classification Rules:**

| Classification | DPD Range | Provision % | Color Code |
|----------------|-----------|-------------|------------|
| STD-0 (Standard) | Current | 1% | Green |
| STD-1 (Watch) | 1-30 days | 1% | Light Green |
| STD-2 (Caution) | 31-60 days | 1% | Yellow |
| SMA (Special Mention) | 61-90 days | 5% | Orange |
| SS (Substandard) | 91-180 days | 20% | Light Red |
| DF (Doubtful) | 181-365 days | 50% | Red |
| B/L (Bad/Loss) | >365 days | 100% | Dark Red |

**Implementation:**
```java
@Service
public class LoanClassificationService {
    
    @Scheduled(cron = "0 30 2 * * ?") // Daily at 2:30 AM
    @Transactional
    public void performDailyClassification() {
        List<LoanAccount> activeLoans = loanRepository.findActiveLoans();
        
        for (LoanAccount loan : activeLoans) {
            int dpd = calculateDPD(loan);
            Classification newClassification = determineClassification(dpd);
            
            if (loan.getClassification() != newClassification) {
                // Create classification history
                ClassificationHistory history = new ClassificationHistory();
                history.setLoanId(loan.getId());
                history.setPreviousClassification(loan.getClassification());
                history.setNewClassification(newClassification);
                history.setDpd(dpd);
                history.setChangeDate(LocalDate.now());
                historyRepository.save(history);
                
                // Update loan
                loan.setClassification(newClassification);
                loanRepository.save(loan);
                
                // Post provision GL entry
                postProvisionEntry(loan, newClassification);
                
                // Publish event
                eventPublisher.publish(new LoanClassificationChangedEvent(loan));
            }
        }
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
    
    private BigDecimal calculateProvision(LoanAccount loan, Classification classification) {
        BigDecimal outstanding = loan.getOutstandingBalance();
        return outstanding.multiply(classification.getProvisionRate());
    }
}
```

---

## 4. Non-Functional Requirements

### 4.1 Performance Requirements

#### 4.1.1 Response Time

| Operation | Target (95th percentile) | Measurement Method |
|-----------|-------------------------|-------------------|
| Page Load | < 2 seconds | Lighthouse |
| API Response | < 500ms | Prometheus |
| Database Query | < 100ms | pg_stat_statements |
| CIB Inquiry | < 2 minutes | Custom metrics |
| Report Generation | < 30 seconds | Application logs |
| File Upload (10MB) | < 10 seconds | Custom metrics |

#### 4.1.2 Throughput

| Metric | Target | Measurement |
|--------|--------|-------------|
| Concurrent Users | 1000+ | Load testing |
| Requests/Second | 500+ | JMeter |
| Loan Applications/Day | 10,000+ | Business metrics |
| Transactions/Day | 100,000+ | Database metrics |

### 4.2 Scalability Requirements

#### 4.2.1 Horizontal Scaling

```yaml
# Kubernetes HPA Configuration
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
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
```

### 4.3 Availability Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| System Uptime | 99.9% | Monitoring |
| RTO (Recovery Time) | < 4 hours | DR Testing |
| RPO (Data Loss) | < 1 hour | Backup testing |
| Planned Downtime | < 4 hours/month | Maintenance windows |

---

## 5. Interface Requirements

### 5.1 API Specifications

#### 5.1.1 REST API Standards

**Base URL:** `https://api.ulms.unisoft.com.bd/v1`

**Authentication:**
```http
Authorization: Bearer {jwt_token}
X-API-Key: {api_key}
```

**Response Format:**
```json
{
  "success": true,
  "data": { },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  },
  "error": null
}
```

**Error Response:**
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
    ]
  }
}
```

#### 5.1.2 Key API Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/auth/login` | POST | User authentication | Public |
| `/auth/refresh` | POST | Refresh token | JWT |
| `/customers` | POST | Create customer | JWT |
| `/customers/{id}` | GET | Get customer | JWT |
| `/loans/applications` | POST | Submit application | JWT |
| `/loans/applications/{id}` | GET | Get application | JWT |
| `/cib/inquiry` | POST | CIB inquiry | JWT, CIB_ROLE |
| `/workflow/approvals/{id}` | POST | Approve/reject | JWT, APPROVER |
| `/reports/cl1` | GET | CL-1 report | JWT, REPORT_VIEW |

### 5.2 External System Interfaces

#### 5.2.1 CIB Online Integration

**Protocol:** REST API over VPN
**Authentication:** Mutual TLS (mTLS)
**Data Format:** JSON
**Rate Limit:** 100 requests/minute

**Integration Flow:**
```
┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐
│  ULMS    │───▶│   VPN GW     │───▶│  BB CIB API  │───▶│  CIB DB  │
│          │◀───│              │◀───│              │◀───│          │
└──────────┘    └──────────────┘    └──────────────┘    └──────────┘
     │                 │                  │
     │                 │                  │
     ▼                 ▼                  ▼
┌──────────┐    ┌──────────────┐    ┌──────────────┐
│  Audit   │    │   Logging    │    │   Cache      │
│  Log     │    │   (ELK)      │    │   (Redis)    │
└──────────┘    └──────────────┘    └──────────────┘
```

#### 5.2.2 CBS Integration

**Protocol:** REST/SOAP (bank-dependent)
**Integration Pattern:** Asynchronous with SAGA

**Event Flow:**
```
1. Loan Approved
   │
   ▼
2. Publish "LoanApproved" event to Kafka
   │
   ▼
3. CBS Adapter consumes event
   │
   ▼
4. CBS Adapter calls CBS API (Create Account)
   │
   ├─ Success ──▶ Publish "AccountCreated" event
   │
   └─ Failure ──▶ Publish "AccountCreationFailed" event
                  Trigger compensation
```

---

## 6. Database Requirements

### 6.1 Database Schema

#### 6.1.1 Multi-Tenant Design

```sql
-- Tenant isolation using schema-per-tenant
CREATE SCHEMA bank_001;
CREATE SCHEMA bank_002;

-- Tenant-aware tables
CREATE TABLE bank_001.m_loan (
    id BIGSERIAL PRIMARY KEY,
    account_no VARCHAR(20) UNIQUE NOT NULL,
    external_id VARCHAR(50),
    client_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    -- ... loan details
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tenant identification
CREATE TABLE public.tenants (
    id SERIAL PRIMARY KEY,
    schema_name VARCHAR(50) UNIQUE NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    bank_code VARCHAR(10) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 6.1.2 Key Tables

| Table | Purpose | Estimated Volume | Partitioning |
|-------|---------|-----------------|--------------|
| `m_loan` | Loan accounts | 10M+ | By date |
| `m_loan_repayment_schedule` | EMI schedules | 100M+ | By loan_id |
| `m_loan_transaction` | Transactions | 500M+ | By date |
| `m_client` | Customers | 5M+ | - |
| `cib_inquiry` | CIB history | 20M+ | By date |
| `loan_classification_history` | Classification changes | 50M+ | By date |
| `audit_log` | Audit trail | 1B+ | By date |

### 6.2 Data Retention

| Data Type | Retention Period | Archive Strategy |
|-----------|-----------------|------------------|
| Active loan data | Loan term + 7 years | No archive |
| Closed loan data | 7 years from closure | Archive after 2 years |
| CIB inquiries | 5 years | Archive after 1 year |
| Audit logs | 10 years | Archive after 5 years |
| System logs | 90 days | Delete after 90 days |

---

## 7. Security Requirements

### 7.1 Authentication

#### 7.1.1 JWT Token Structure

```json
{
  "sub": "user123",
  "iss": "ulms-auth",
  "iat": 1706294400,
  "exp": 1706298000,
  "roles": ["CREDIT_ANALYST", "BRANCH_USER"],
  "branch_id": "BR001",
  "bank_id": "BANK001",
  "approval_limit": 1000000,
  "permissions": ["LOAN_VIEW", "LOAN_CREATE", "CIB_INQUIRY"]
}
```

**Token Configuration:**
| Parameter | Value |
|-----------|-------|
| Access Token TTL | 30 minutes |
| Refresh Token TTL | 7 days |
| Algorithm | RS256 (RSA + SHA-256) |
| Key Rotation | 90 days |

### 7.2 Authorization

#### 7.2.1 RBAC Matrix

| Role | Loan View | Loan Create | CIB Inquiry | Approve | Admin |
|------|-----------|-------------|-------------|---------|-------|
| BRANCH_USER | ✓ | ✓ | - | - | - |
| CREDIT_ANALYST | ✓ | ✓ | ✓ | - | - |
| BRANCH_MANAGER | ✓ | ✓ | ✓ | ✓ (10L) | - |
| HEAD_OF_CREDIT | ✓ | ✓ | ✓ | ✓ (1Cr) | - |
| MD | ✓ | ✓ | ✓ | ✓ (Unlimited) | - |
| ADMIN | ✓ | - | - | - | ✓ |

### 7.3 Data Encryption

#### 7.3.1 Encryption at Rest

| Data Type | Algorithm | Key Management |
|-----------|-----------|----------------|
| Database | AES-256-TDE | PostgreSQL TDE |
| Files | AES-256-GCM | HashiCorp Vault |
| Backups | AES-256-CBC | Vault + HSM |

#### 7.3.2 Encryption in Transit

| Channel | Protocol | Cipher Suites |
|---------|----------|---------------|
| Web | TLS 1.3 | TLS_AES_256_GCM_SHA384 |
| API | TLS 1.3 | TLS_AES_256_GCM_SHA384 |
| Service-to-Service | mTLS | TLS_AES_256_GCM_SHA384 |

### 7.4 Audit Logging

**Audit Event Schema:**
```json
{
  "eventId": "evt-uuid",
  "timestamp": "2026-02-03T10:30:00Z",
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
  "context": {
    "branchId": "BR001",
    "bankId": "BANK001"
  },
  "changes": [
    {
      "field": "status",
      "oldValue": "PENDING",
      "newValue": "APPROVED"
    }
  ]
}
```

---

## 8. Compliance Requirements

### 8.1 BRPD Circular 15/2024

**Requirements:**
- Daily loan classification at EOD
- Automatic provision calculation
- CL-1 to CL-5 report generation
- Interest suspense accounting
- NPA migration tracking

### 8.2 IFRS-9 ECL

**Requirements:**
- 12-month ECL for Stage 1
- Lifetime ECL for Stage 2
- Lifetime ECL for Stage 3 (credit impaired)
- Forward-looking macroeconomic adjustments
- ECL model validation

### 8.3 ICT Security Guidelines V4.0

**Compliance Checklist:**
| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Access Control | RBAC + MFA | ✓ Compliant |
| Data Encryption | AES-256 | ✓ Compliant |
| Audit Trail | Immutable logs | ✓ Compliant |
| Patch Management | Automated | ✓ Compliant |
| Incident Response | Defined process | ✓ Compliant |
| BCP/DR | Hot standby | ✓ Compliant |

---

## 9. Integration Requirements

### 9.1 Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       INTEGRATION LAYER (Apache Camel)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     ROUTE DEFINITIONS                                │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                      │   │
│  │  // CBS Integration                                                 │   │
│  │  from("kafka:loan.approved")                                        │   │
│  │    .routeId("cbs-integration")                                      │   │
│  │    .transform(cbsTransformer)                                       │   │
│  │    .to("https://cbs.bank.api/accounts")                             │   │
│  │    .onException().retry(3);                                         │   │
│  │                                                                      │   │
│  │  // CIB Integration                                                 │   │
│  │  from("direct:cib-inquiry")                                         │   │
│  │    .routeId("cib-integration")                                      │   │
│  │    .to("https://cib.bb.org.bd/api/inquiry")                         │   │
│  │    .transform(cibResponseTransformer);                              │   │
│  │                                                                      │   │
│  │  // NID Integration                                                 │   │
│  │  from("direct:nid-verify")                                          │   │
│  │    .routeId("nid-integration")                                      │   │
│  │    .to("https://nidw.gov.bd/api/verify");                           │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Event Streaming

**Kafka Topics:**
| Topic | Partitions | Replication | Retention |
|-------|-----------|-------------|-----------|
| `loan.applications` | 12 | 3 | 1 year |
| `loan.approvals` | 6 | 3 | 7 years |
| `loan.disbursements` | 6 | 3 | 7 years |
| `loan.payments` | 12 | 3 | 7 years |
| `loan.classifications` | 3 | 3 | 2 years |
| `notifications` | 6 | 3 | 30 days |
| `audit.events` | 6 | 3 | 10 years |

---

## 10. Appendices

### Appendix A: Traceability Matrix

| SRS ID | Description | URD Ref | BRD Ref | Priority | Status |
|--------|-------------|---------|---------|----------|--------|
| SRS-LOS-001 | NID-Based Registration | UR-LOS-001 | 6.1.2 | Critical | Approved |
| SRS-LOS-002 | Multi-Product Support | UR-LOS-002 | 6.1.2 | Critical | Approved |
| SRS-CIB-001 | CIB Online Integration | UR-CIB-001 | 6.2.1 | Critical | Approved |
| SRS-CS-001 | Credit Scoring Engine | UR-CS-001 | 6.2.2 | Critical | Approved |
| SRS-WF-001 | Camunda Workflow | UR-WF-001 | 6.3 | Critical | Approved |
| SRS-BRPD-001 | Classification Engine | UR-COLL-003 | 6.6.2 | Critical | Approved |

### Appendix B: Glossary

| Term | Definition |
|------|------------|
| **BPMN** | Business Process Model and Notation |
| **DMN** | Decision Model and Notation |
| **ECL** | Expected Credit Loss |
| **SAGA** | Pattern for managing long-running transactions |
| **HPA** | Horizontal Pod Autoscaler (Kubernetes) |

### Appendix C: Technology Stack Reference

See: `Technology_Stack_Recommendation_v2.md`

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

*This Software Requirements Specification v2.0 is approved for development and provides the complete technical foundation for ULMS implementation on Apache Fineract Community Edition.*

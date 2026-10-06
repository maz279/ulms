# Integration Architecture Overview
## Unisoft Loan Management System (ULMS) v2.0
### Apache Camel ESB Integration Framework

---

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ARCH-1.5.1 |
| **Document Title** | Integration Architecture Overview (Apache Camel ESB) |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 5, 2026 |
| **Prepared By** | Lead Developer, Solutions Architect |
| **Reviewed By** | Architecture Review Board |
| **Classification** | Confidential - Internal Use |
| **Status** | Approved for Implementation |

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | February 5, 2026 | Lead Developer | Initial Integration Architecture Overview |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Integration Strategy](#2-integration-strategy)
3. [Apache Camel 4.3 Architecture](#3-apache-camel-43-architecture)
4. [Integration Landscape](#4-integration-landscape)
5. [Integration Gateway Service](#5-integration-gateway-service)
6. [Integration Patterns](#6-integration-patterns)
7. [Message Transformation](#7-message-transformation)
8. [Error Handling & Dead Letter Queues](#8-error-handling--dead-letter-queues)
9. [Resilience Patterns](#9-resilience-patterns)
10. [Security Architecture](#10-security-architecture)
11. [Monitoring & Observability](#11-monitoring--observability)
12. [Deployment Configuration](#12-deployment-configuration)
13. [Appendices](#13-appendices)

---

## 1. Executive Summary

### 1.1 Purpose

This document provides a comprehensive overview of the Integration Architecture for ULMS v2.0. It defines how the system integrates with external systems including Bangladesh Bank CIB Online, NID Wing (e-KYC), Core Banking Systems, Mobile Financial Services (bKash, Nagad, Rocket), and regulatory reporting channels using Apache Camel 4.3 as the Enterprise Service Bus (ESB).

### 1.2 Integration Philosophy

ULMS adopts an **API-First, Event-Driven** integration strategy:

| Principle | Description |
|-----------|-------------|
| **Loose Coupling** | External systems connected via standardized APIs and message queues |
| **Protocol Agnostic** | Apache Camel provides protocol translation (REST, SOAP, SFTP, JMS) |
| **Resilient** | Circuit breakers, retries, and fallback mechanisms for fault tolerance |
| **Observable** | Full traceability through distributed tracing and centralized logging |
| **Secure** | mTLS, OAuth 2.0, and encryption for all external communications |

### 1.3 Scope

This document covers:
- Apache Camel ESB architecture and configuration
- Integration patterns and messaging flows
- External system connectivity
- Error handling and resilience
- Security and compliance requirements

### 1.4 Key Integration Points

| External System | Integration Type | Protocol | Priority |
|-----------------|------------------|----------|----------|
| Bangladesh Bank CIB Online | Real-time + Batch | REST (mTLS), SFTP | Critical |
| NID Wing (e-KYC) | Real-time | REST (TLS) | Critical |
| Core Banking System (CBS) | Real-time + Batch | REST/SOAP | Critical |
| bKash | Real-time | REST (OAuth 2.0) | High |
| Nagad | Real-time | REST (OAuth 2.0) | High |
| Rocket (DBBL) | Real-time | REST | High |
| Bangladesh Bank SFTP | Batch | SFTP (SSH) | High |
| SMS Gateway | Real-time | HTTP API | Medium |
| Email Gateway | Real-time | SMTP/API | Medium |

---

## 2. Integration Strategy

### 2.1 Strategic Objectives

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    INTEGRATION STRATEGIC OBJECTIVES                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │    AGILITY      │  │  RELIABILITY    │  │   COMPLIANCE    │             │
│  │                 │  │                 │  │                 │             │
│  │ • Quick adapter │  │ • 99.9% uptime  │  │ • BB CIB rules  │             │
│  │   development   │  │ • Auto-recovery │  │ • BRPD 15/2024  │             │
│  │ • Protocol      │  │ • Graceful      │  │ • ICT Security  │             │
│  │   flexibility   │  │   degradation   │  │   V4.0          │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │  SCALABILITY    │  │   SECURITY      │  │ OBSERVABILITY   │             │
│  │                 │  │                 │  │                 │             │
│  │ • Horizontal    │  │ • mTLS for BB   │  │ • Distributed   │             │
│  │   scaling       │  │ • OAuth 2.0     │  │   tracing       │             │
│  │ • Multi-tenant  │  │ • Data          │  │ • Real-time     │             │
│  │   support       │  │   encryption    │  │   monitoring    │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Integration Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ULMS INTEGRATION LAYERS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    PRESENTATION LAYER                                │   │
│  │  React Web │ React Native │ Partner APIs │ External Systems          │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                           │
│  ┌──────────────────────────────▼──────────────────────────────────────┐   │
│  │                    API GATEWAY LAYER (Kong 3.5)                      │   │
│  │  • JWT Validation  • Rate Limiting  • SSL Termination  • Routing    │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                           │
│  ┌──────────────────────────────▼──────────────────────────────────────┐   │
│  │                    APPLICATION SERVICES LAYER                        │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │   CIB    │ │   NID    │ │ Workflow │ │   BRPD   │ │ Document │  │   │
│  │  │ Service  │ │ Service  │ │ Service  │ │ Service  │ │ Service  │  │   │
│  │  │  (8081)  │ │  (8082)  │ │  (8083)  │ │  (8085)  │ │  (8084)  │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                           │
│  ┌──────────────────────────────▼──────────────────────────────────────┐   │
│  │              INTEGRATION LAYER (Apache Camel 4.3)                    │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                Integration Gateway Service (8088)            │   │   │
│  │  │  • Route Definitions   • Protocol Translation               │   │   │
│  │  │  • Message Transformation   • Error Handling                │   │   │
│  │  │  • Circuit Breakers   • Dead Letter Queues                  │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                           │
│  ┌──────────────────────────────▼──────────────────────────────────────┐   │
│  │                    EXTERNAL SYSTEMS LAYER                            │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │   │
│  │  │   CIB   │ │   NID   │ │   CBS   │ │  bKash  │ │ BB SFTP │       │   │
│  │  │ Online  │ │  Wing   │ │  (Bank) │ │ /Nagad  │ │         │       │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Integration Decision Matrix

| Criteria | Synchronous API | Asynchronous Event | Batch File |
|----------|-----------------|-------------------|------------|
| **Use When** | Immediate response needed | Fire-and-forget, decoupled | Large data volumes |
| **Latency** | Low (<2s) | Variable | High (scheduled) |
| **Coupling** | Tight | Loose | Very Loose |
| **Reliability** | Direct error handling | Guaranteed delivery | File-based retry |
| **Examples** | CIB inquiry, NID verify | Notifications, GL posting | CIB batch, reports |

---

## 3. Apache Camel 4.3 Architecture

### 3.1 Why Apache Camel

| Feature | Benefit for ULMS |
|---------|------------------|
| **Enterprise Integration Patterns (EIP)** | Proven patterns for complex routing |
| **300+ Components** | Pre-built connectors for REST, SOAP, SFTP, Kafka, etc. |
| **Protocol Agnostic** | Unified model regardless of transport |
| **Spring Boot Integration** | Native support for Spring Boot 3.2 |
| **Type Converters** | Automatic data transformation |
| **Error Handling** | Dead letter channels, retry policies |
| **Testing Support** | Mock endpoints, test containers |

### 3.2 Camel Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    APACHE CAMEL 4.3 ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         CAMEL CONTEXT                                │   │
│  │                                                                       │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │                      ROUTE DEFINITIONS                        │  │   │
│  │  │                                                                │  │   │
│  │  │  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐      │  │   │
│  │  │  │ CBS Routes   │   │ CIB Routes   │   │ MFS Routes   │      │  │   │
│  │  │  │              │   │              │   │              │      │  │   │
│  │  │  │ • Account    │   │ • Inquiry    │   │ • bKash      │      │  │   │
│  │  │  │   Creation   │   │ • Batch      │   │ • Nagad      │      │  │   │
│  │  │  │ • GL Posting │   │   Upload     │   │ • Rocket     │      │  │   │
│  │  │  │ • Balance    │   │ • Status     │   │              │      │  │   │
│  │  │  └──────────────┘   └──────────────┘   └──────────────┘      │  │   │
│  │  │                                                                │  │   │
│  │  │  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐      │  │   │
│  │  │  │ SFTP Routes  │   │ Notification │   │ Error        │      │  │   │
│  │  │  │              │   │ Routes       │   │ Routes       │      │  │   │
│  │  │  │ • BB Upload  │   │ • SMS        │   │ • DLQ        │      │  │   │
│  │  │  │ • Download   │   │ • Email      │   │ • Retry      │      │  │   │
│  │  │  │ • Archive    │   │ • Push       │   │ • Alert      │      │  │   │
│  │  │  └──────────────┘   └──────────────┘   └──────────────┘      │  │   │
│  │  │                                                                │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  │                                                                       │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │                      COMPONENTS                               │  │   │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │  │   │
│  │  │  │  HTTP   │ │  KAFKA  │ │  SFTP   │ │  JDBC   │ │  TIMER  │ │  │   │
│  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │  │   │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │  │   │
│  │  │  │  REST   │ │  SOAP   │ │  FILE   │ │  BEAN   │ │ DIRECT  │ │  │   │
│  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  │                                                                       │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │                      PROCESSORS                               │  │   │
│  │  │  Type Converters │ Data Formats │ Expression Languages       │  │   │
│  │  │  (JSON, XML, CSV)   (Jackson, JAXB)   (Simple, SpEL, OGNL)   │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Key Camel Components Used

| Component | URI Scheme | Purpose |
|-----------|------------|---------|
| **HTTP** | `http://`, `https://` | REST API calls to external systems |
| **Kafka** | `kafka:topic` | Event streaming, async messaging |
| **SFTP** | `sftp://host/path` | Bangladesh Bank file transfers |
| **Timer/Quartz** | `timer:`, `quartz:` | Scheduled batch jobs |
| **Direct** | `direct:name` | In-memory synchronous routing |
| **SEDA** | `seda:name` | In-memory asynchronous routing |
| **Bean** | `bean:beanName` | Java bean method invocation |
| **Log** | `log:name` | Logging and debugging |

### 3.4 Camel Configuration

```java
@Configuration
@EnableConfigurationProperties(CamelConfigurationProperties.class)
public class CamelConfiguration {

    @Bean
    public CamelContext camelContext() {
        CamelContext context = new DefaultCamelContext();

        // Configure JSON data format
        context.setDataFormats(Map.of(
            "json-jackson", new JacksonDataFormat()
        ));

        // Configure thread pool
        context.getExecutorServiceManager().setDefaultThreadPoolProfile(
            new ThreadPoolProfile()
                .setPoolSize(10)
                .setMaxPoolSize(50)
                .setMaxQueueSize(1000)
                .setKeepAliveTime(60L)
        );

        // Enable metrics
        context.addService(new MicrometerRoutePolicyFactory());

        return context;
    }
}
```

```yaml
# application.yml - Camel Configuration
camel:
  springboot:
    name: ulms-integration-gateway
    main-run-controller: true

  component:
    kafka:
      brokers: ${KAFKA_BOOTSTRAP_SERVERS:localhost:9092}
      security-protocol: SASL_SSL

    http:
      connect-timeout: 30000
      socket-timeout: 120000

    sftp:
      strict-host-key-checking: "yes"
      preferred-authentications: publickey

  threadpool:
    pool-size: 10
    max-pool-size: 50
    max-queue-size: 1000
```

---

## 4. Integration Landscape

### 4.1 External Systems Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ULMS INTEGRATION LANDSCAPE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                              ┌─────────────┐                                 │
│                              │    ULMS     │                                 │
│                              │  Platform   │                                 │
│                              └──────┬──────┘                                 │
│                                     │                                        │
│       ┌─────────────────────────────┼─────────────────────────────┐         │
│       │                             │                             │         │
│       │  REGULATORY               │  FINANCIAL               │  SUPPORT   │
│       │  SYSTEMS                  │  SYSTEMS                 │  SYSTEMS   │
│       │                             │                             │         │
│   ┌───┴───┐ ┌───────┐        ┌────┴────┐ ┌────────┐       ┌────┴────┐     │
│   │  BB   │ │  NID  │        │   CBS   │ │ Payment│       │  SMS    │     │
│   │  CIB  │ │  Wing │        │  (Bank) │ │ Gateway│       │ Gateway │     │
│   │Online │ │       │        │         │ │        │       │         │     │
│   └───┬───┘ └───┬───┘        └────┬────┘ └────┬───┘       └────┬────┘     │
│       │         │                  │          │                 │          │
│       │         │                  │     ┌────┴────┐           │          │
│   ┌───┴───┐     │             ┌───┴───┐ │ bKash   │      ┌────┴────┐     │
│   │  BB   │     │             │Fineract│ │ Nagad   │      │  Email  │     │
│   │ SFTP  │     │             │  Core  │ │ Rocket  │      │ Gateway │     │
│   │       │     │             │        │ └─────────┘      │         │     │
│   └───────┘     │             └────────┘                  └─────────┘     │
│                 │                                                          │
│            ┌────┴────┐                                                     │
│            │  BRTA   │  (Vehicle Verification - Future)                    │
│            │  Land   │  (Property Verification - Future)                   │
│            │Registry │                                                     │
│            └─────────┘                                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Integration Matrix

| System | Direction | Protocol | Auth | Frequency | SLA |
|--------|-----------|----------|------|-----------|-----|
| **BB CIB Online** | Outbound | REST/mTLS | X.509 Cert | Real-time | 2 min |
| **BB CIB Batch** | Outbound | SFTP | SSH Key | Monthly | N/A |
| **NID Wing** | Outbound | REST/TLS | API Key | Real-time | 10 sec |
| **CBS** | Bidirectional | REST/SOAP | OAuth 2.0 | Real-time | 5 sec |
| **bKash** | Outbound | REST | OAuth 2.0 | Real-time | 30 sec |
| **Nagad** | Outbound | REST | OAuth 2.0 | Real-time | 30 sec |
| **Rocket** | Outbound | REST | API Key | Real-time | 30 sec |
| **BB SFTP** | Outbound | SFTP | SSH Key | Monthly | N/A |
| **SMS Gateway** | Outbound | HTTP | API Key | Real-time | 5 sec |
| **Email Gateway** | Outbound | SMTP/API | Credentials | Real-time | 30 sec |

### 4.3 Data Flow Patterns

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PRIMARY DATA FLOWS                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. LOAN APPLICATION FLOW                                                    │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Customer │───▶│ NID API  │───▶│ CIB API  │───▶│  Credit  │              │
│  │   Data   │    │ Verify   │    │ Inquiry  │    │ Decision │              │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│                                                                              │
│  2. DISBURSEMENT FLOW                                                        │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Approved │───▶│   CBS    │───▶│ Payment  │───▶│ Customer │              │
│  │   Loan   │    │ Account  │    │ Gateway  │    │ Notified │              │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│                                                                              │
│  3. COLLECTION FLOW                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Payment  │───▶│   CBS    │───▶│ Fineract │───▶│ Receipt  │              │
│  │ Received │    │ Credit   │    │ Update   │    │ Issued   │              │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│                                                                              │
│  4. REGULATORY REPORTING FLOW                                                │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  Daily   │───▶│  Report  │───▶│  SFTP    │───▶│   BB     │              │
│  │  Close   │    │ Generate │    │ Transfer │    │ Received │              │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Integration Gateway Service

### 5.1 Service Overview

| Attribute | Value |
|-----------|-------|
| **Service ID** | ulms-integration-gateway |
| **Port** | 8088 |
| **Technology** | Spring Boot 3.2 + Apache Camel 4.3 |
| **Repository** | ulms-integration-gateway |
| **Primary Function** | External system integration orchestration |

### 5.2 Service Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    INTEGRATION GATEWAY SERVICE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    REST API LAYER                                    │   │
│  │  POST /integration/cbs/* │ POST /integration/payment/* │ etc.       │   │
│  └──────────────────────────────────────┬──────────────────────────────┘   │
│                                          │                                  │
│  ┌──────────────────────────────────────┼──────────────────────────────┐   │
│  │                    CAMEL CONTEXT                                     │   │
│  │                                                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │                    ROUTE BUILDER                            │    │   │
│  │  │                                                              │    │   │
│  │  │  ┌──────────────────────────────────────────────────────┐  │    │   │
│  │  │  │  CBS Routes                                          │  │    │   │
│  │  │  │  • cbs-account-creation    • cbs-gl-posting         │  │    │   │
│  │  │  │  • cbs-limit-loading       • cbs-balance-inquiry    │  │    │   │
│  │  │  └──────────────────────────────────────────────────────┘  │    │   │
│  │  │                                                              │    │   │
│  │  │  ┌──────────────────────────────────────────────────────┐  │    │   │
│  │  │  │  Payment Routes                                      │  │    │   │
│  │  │  │  • bkash-disbursement      • nagad-disbursement     │  │    │   │
│  │  │  │  • rocket-disbursement     • payment-status         │  │    │   │
│  │  │  └──────────────────────────────────────────────────────┘  │    │   │
│  │  │                                                              │    │   │
│  │  │  ┌──────────────────────────────────────────────────────┐  │    │   │
│  │  │  │  SFTP Routes                                         │  │    │   │
│  │  │  │  • cib-batch-upload        • regulatory-report      │  │    │   │
│  │  │  │  • acknowledgment-download                          │  │    │   │
│  │  │  └──────────────────────────────────────────────────────┘  │    │   │
│  │  │                                                              │    │   │
│  │  │  ┌──────────────────────────────────────────────────────┐  │    │   │
│  │  │  │  Error Routes                                        │  │    │   │
│  │  │  │  • dlq-processor           • retry-processor        │  │    │   │
│  │  │  │  • alert-sender                                     │  │    │   │
│  │  │  └──────────────────────────────────────────────────────┘  │    │   │
│  │  │                                                              │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  │                                                                       │   │
│  └──────────────────────────────────────┬──────────────────────────────┘   │
│                                          │                                  │
│       ┌──────────────────────────────────┼──────────────────────────────┐  │
│       │                                  │                              │  │
│       ▼                                  ▼                              ▼  │
│  ┌──────────┐                    ┌──────────────┐                ┌────────┐│
│  │  Kafka   │                    │    Redis     │                │ Vault  ││
│  │  (Events)│                    │   (Cache)    │                │(Secrets││
│  └──────────┘                    └──────────────┘                └────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Route Definitions

```java
@Component
public class IntegrationRoutes extends RouteBuilder {

    @Override
    public void configure() throws Exception {

        // Global error handler
        errorHandler(deadLetterChannel("kafka:dlq.integration.failed")
            .maximumRedeliveries(3)
            .redeliveryDelay(5000)
            .retryAttemptedLogLevel(LoggingLevel.WARN)
            .useExponentialBackOff()
            .backOffMultiplier(2));

        // ============================================
        // CBS INTEGRATION ROUTES
        // ============================================

        // CBS Account Creation (triggered by Kafka event)
        from("kafka:loan.approved?groupId=integration-gateway")
            .routeId("cbs-account-creation")
            .log("Processing approved loan for CBS: ${body}")
            .unmarshal().json(JsonLibrary.Jackson, LoanApprovedEvent.class)
            .process(exchange -> {
                LoanApprovedEvent event = exchange.getIn().getBody(LoanApprovedEvent.class);
                CbsAccountRequest request = cbsTransformer.toAccountRequest(event);
                exchange.getIn().setBody(request);
            })
            .marshal().json()
            .setHeader("Authorization", simple("Bearer ${header.cbsToken}"))
            .setHeader(Exchange.HTTP_METHOD, constant("POST"))
            .setHeader(Exchange.CONTENT_TYPE, constant("application/json"))
            .circuitBreaker()
                .resilience4jConfiguration()
                    .failureRateThreshold(50)
                    .waitDurationInOpenState(60000)
                    .slidingWindowSize(10)
                .end()
                .to("{{cbs.api.url}}/accounts")
            .onFallback()
                .log("CBS circuit breaker open, queuing for retry")
                .to("kafka:cbs.retry.queue")
            .end()
            .choice()
                .when(header(Exchange.HTTP_RESPONSE_CODE).isEqualTo(200))
                    .log("CBS account created successfully")
                    .to("kafka:loan.account.created")
                .otherwise()
                    .log("CBS account creation failed")
                    .to("kafka:loan.account.failed")
            .end();

        // CBS GL Posting
        from("direct:cbs-gl-posting")
            .routeId("cbs-gl-posting")
            .marshal().json()
            .setHeader("Authorization", simple("Bearer ${header.cbsToken}"))
            .to("{{cbs.api.url}}/gl/transactions")
            .unmarshal().json();

        // ============================================
        // PAYMENT GATEWAY ROUTES
        // ============================================

        // bKash Disbursement
        from("direct:bkash-disbursement")
            .routeId("bkash-disbursement")
            .log("Processing bKash disbursement: ${body}")
            .process("bkashAuthProcessor")
            .setHeader("Authorization", simple("Bearer ${header.bkashToken}"))
            .marshal().json()
            .to("{{bkash.api.url}}/disbursement")
            .unmarshal().json()
            .process("bkashResponseProcessor");

        // Nagad Disbursement
        from("direct:nagad-disbursement")
            .routeId("nagad-disbursement")
            .log("Processing Nagad disbursement: ${body}")
            .process("nagadAuthProcessor")
            .setHeader("Authorization", simple("Bearer ${header.nagadToken}"))
            .marshal().json()
            .to("{{nagad.api.url}}/disbursement")
            .unmarshal().json()
            .process("nagadResponseProcessor");

        // Rocket Disbursement
        from("direct:rocket-disbursement")
            .routeId("rocket-disbursement")
            .log("Processing Rocket disbursement: ${body}")
            .setHeader("X-API-Key", simple("${header.rocketApiKey}"))
            .marshal().json()
            .to("{{rocket.api.url}}/disbursement")
            .unmarshal().json();

        // ============================================
        // SFTP ROUTES
        // ============================================

        // CIB Batch File Upload (Monthly)
        from("quartz:cib-batch?cron=0+0+2+1+*+?")
            .routeId("cib-batch-upload")
            .log("Starting monthly CIB batch file generation")
            .bean("cibBatchService", "generateBatchFile")
            .setHeader("CamelFileName", simple("CIB_${date:now:yyyyMM}.txt"))
            .to("sftp://{{bb.sftp.host}}/cib" +
                "?username={{bb.sftp.username}}" +
                "&privateKeyFile={{bb.sftp.private-key}}" +
                "&strictHostKeyChecking=yes")
            .log("CIB batch file uploaded successfully")
            .to("kafka:cib.batch.completed");

        // Regulatory Report Upload
        from("direct:regulatory-report-upload")
            .routeId("regulatory-report-upload")
            .log("Uploading regulatory report: ${header.reportType}")
            .setHeader("CamelFileName", simple("${header.reportType}_${date:now:yyyyMMdd}.xlsx"))
            .to("sftp://{{bb.sftp.host}}/reports" +
                "?username={{bb.sftp.username}}" +
                "&privateKeyFile={{bb.sftp.private-key}}")
            .log("Regulatory report uploaded: ${header.CamelFileName}");

        // ============================================
        // NOTIFICATION ROUTES
        // ============================================

        // SMS Notification
        from("kafka:notifications?groupId=sms-sender")
            .routeId("sms-notification")
            .filter(simple("${body.channel} == 'SMS'"))
            .process("smsTemplateProcessor")
            .setHeader(Exchange.HTTP_METHOD, constant("POST"))
            .setHeader("X-API-Key", simple("{{sms.api.key}}"))
            .to("{{sms.gateway.url}}/send")
            .log("SMS sent to ${body.recipient}");

        // Email Notification
        from("kafka:notifications?groupId=email-sender")
            .routeId("email-notification")
            .filter(simple("${body.channel} == 'EMAIL'"))
            .process("emailTemplateProcessor")
            .to("smtp://{{email.smtp.host}}:{{email.smtp.port}}" +
                "?username={{email.smtp.username}}" +
                "&password={{email.smtp.password}}")
            .log("Email sent to ${body.recipient}");
    }
}
```

### 5.4 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/integration/cbs/account` | POST | Create CBS account |
| `/integration/cbs/gl-posting` | POST | Post GL entry |
| `/integration/cbs/balance` | GET | Get account balance |
| `/integration/payment/bkash` | POST | bKash disbursement |
| `/integration/payment/nagad` | POST | Nagad disbursement |
| `/integration/payment/rocket` | POST | Rocket disbursement |
| `/integration/payment/status/{txnId}` | GET | Payment status |
| `/integration/sftp/upload` | POST | Upload file to SFTP |
| `/integration/health` | GET | Health check |

---

## 6. Integration Patterns

### 6.1 Synchronous Request-Reply

**Use Case**: Real-time CIB inquiry, NID verification

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   ULMS       │  HTTP   │  Integration │  HTTP   │   External   │
│   Service    │────────▶│   Gateway    │────────▶│   System     │
│              │◀────────│              │◀────────│              │
│              │ Response│              │ Response│              │
└──────────────┘         └──────────────┘         └──────────────┘
```

```java
// Synchronous CIB Inquiry Route
from("direct:cib-inquiry-sync")
    .routeId("cib-inquiry-sync")
    .setHeader("Authorization", simple("${header.mTlsToken}"))
    .to("https://cib.bb.org.bd/api/v2/inquiry?sslContextParameters=#cibSslContext")
    .unmarshal().json(JsonLibrary.Jackson, CibResponse.class);
```

### 6.2 Asynchronous Event-Driven

**Use Case**: Loan approval notification, GL posting

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Producer   │  Kafka  │   Kafka      │  Kafka  │   Consumer   │
│   Service    │────────▶│   Topic      │────────▶│   Service    │
│              │  Event  │              │  Event  │              │
└──────────────┘         └──────────────┘         └──────────────┘
        │                                                 │
        │                ┌──────────────┐                │
        └───────────────▶│  Audit Log   │◀───────────────┘
                         └──────────────┘
```

```java
// Asynchronous GL Posting
from("kafka:loan.disbursed")
    .routeId("async-gl-posting")
    .log("Processing GL posting for disbursement: ${body}")
    .process("glPostingTransformer")
    .to("direct:cbs-gl-posting")
    .to("kafka:gl.posting.completed");
```

### 6.3 SAGA Pattern for Distributed Transactions

**Use Case**: Loan disbursement (multiple systems)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SAGA: LOAN DISBURSEMENT                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FORWARD FLOW (Success)                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Create   │───▶│ Load     │───▶│ Transfer │───▶│ Update   │              │
│  │ Account  │    │ Limit    │    │ Funds    │    │ Status   │              │
│  │ (CBS)    │    │ (CBS)    │    │ (MFS)    │    │ (ULMS)   │              │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│                                                                              │
│  COMPENSATION FLOW (Failure at Step 3)                                       │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                              │
│  │ Reverse  │◀───│ Reverse  │◀───│ Failure  │                              │
│  │ Account  │    │ Limit    │    │ Detected │                              │
│  │ (CBS)    │    │ (CBS)    │    │          │                              │
│  └──────────┘    └──────────┘    └──────────┘                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

```java
// SAGA Orchestrator
from("kafka:loan.approved")
    .routeId("disbursement-saga")
    .saga()
        .propagation(SagaPropagation.REQUIRES_NEW)
        .completion("direct:disbursement-complete")
        .compensation("direct:disbursement-compensate")
        .option("loanId", simple("${body.loanId}"))
    .to("direct:create-cbs-account")
    .to("direct:load-limit")
    .to("direct:transfer-funds")
    .to("direct:update-status");

from("direct:disbursement-compensate")
    .routeId("disbursement-compensation")
    .log("Compensating disbursement for loan: ${header.loanId}")
    .to("direct:reverse-limit")
    .to("direct:reverse-account")
    .to("kafka:disbursement.failed");
```

### 6.4 Batch File Transfer

**Use Case**: CIB monthly reporting, regulatory reports

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Scheduler  │  Timer  │   Batch      │  SFTP   │  Bangladesh  │
│   (Quartz)   │────────▶│   Processor  │────────▶│    Bank      │
│              │         │              │         │              │
└──────────────┘         └──────────────┘         └──────────────┘
        │                        │
        ▼                        ▼
┌──────────────┐         ┌──────────────┐
│   Database   │         │   Archive    │
│   (Query)    │         │   (S3/MinIO) │
└──────────────┘         └──────────────┘
```

```java
// Monthly CIB Batch Job
from("quartz:cib?cron=0+0+2+1+*+?") // 2 AM on 1st of month
    .routeId("cib-monthly-batch")
    .bean("cibBatchService", "generateMonthlyBatch")
    .split(body())
        .streaming()
        .to("file://{{batch.output.dir}}?fileName=CIB_BATCH_${date:now:yyyyMM}.txt")
    .end()
    .to("sftp://{{bb.sftp.host}}/cib?privateKeyFile={{bb.sftp.key}}")
    .to("kafka:cib.batch.completed");
```

### 6.5 Content-Based Router

**Use Case**: Payment gateway selection

```java
// Payment Gateway Router
from("direct:process-disbursement")
    .routeId("payment-router")
    .choice()
        .when(simple("${body.paymentMethod} == 'BKASH'"))
            .to("direct:bkash-disbursement")
        .when(simple("${body.paymentMethod} == 'NAGAD'"))
            .to("direct:nagad-disbursement")
        .when(simple("${body.paymentMethod} == 'ROCKET'"))
            .to("direct:rocket-disbursement")
        .when(simple("${body.paymentMethod} == 'BANK_TRANSFER'"))
            .to("direct:cbs-transfer")
        .otherwise()
            .to("direct:default-disbursement")
    .end();
```

---

## 7. Message Transformation

### 7.1 Transformation Strategy

| Source Format | Target Format | Transformer |
|---------------|---------------|-------------|
| Java Object | JSON | Jackson |
| Java Object | XML | JAXB |
| JSON | Java Object | Jackson |
| CSV | Java Object | Bindy |
| Fixed-Width | Java Object | Custom Parser |

### 7.2 Data Format Configuration

```java
@Configuration
public class DataFormatConfiguration {

    @Bean
    public JacksonDataFormat jsonDataFormat() {
        JacksonDataFormat json = new JacksonDataFormat();
        json.setObjectMapper(objectMapper());
        json.setPrettyPrint(false);
        return json;
    }

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);
        return mapper;
    }

    @Bean
    public JaxbDataFormat xmlDataFormat() {
        JaxbDataFormat jaxb = new JaxbDataFormat();
        jaxb.setContextPath("com.ulms.integration.model");
        return jaxb;
    }
}
```

### 7.3 Custom Transformers

```java
@Component("cbsTransformer")
public class CbsTransformer {

    public CbsAccountRequest toAccountRequest(LoanApprovedEvent event) {
        return CbsAccountRequest.builder()
            .customerId(event.getCustomerId())
            .accountType("LOAN")
            .productCode(event.getProductCode())
            .sanctionAmount(event.getSanctionedAmount())
            .interestRate(event.getInterestRate())
            .tenor(event.getTenor())
            .branchCode(event.getBranchCode())
            .currency("BDT")
            .build();
    }

    public LoanDisbursedEvent fromCbsResponse(CbsAccountResponse response, String loanId) {
        return LoanDisbursedEvent.builder()
            .loanId(loanId)
            .cbsAccountNumber(response.getAccountNumber())
            .disbursementDate(LocalDate.now())
            .status("DISBURSED")
            .build();
    }
}

@Component("cibBatchTransformer")
public class CibBatchTransformer {

    // Fixed-width format as per Bangladesh Bank specification
    public String toSubjectRecord(CibSubjectData subject) {
        StringBuilder sb = new StringBuilder(500);

        // Field positions as per CIB specification
        sb.append(padRight(subject.getFiCode(), 4));              // 1-4
        sb.append(padRight(subject.getBranchCode(), 4));          // 5-8
        sb.append(padRight(subject.getSubjectId(), 20));          // 9-28
        sb.append(padRight(subject.getNidNumber(), 17));          // 29-45
        sb.append(padRight(subject.getNameEn(), 100));            // 46-145
        sb.append(formatDate(subject.getDob()));                  // 146-153
        // ... continue for all 500 bytes

        return sb.toString();
    }

    private String padRight(String value, int length) {
        if (value == null) value = "";
        return String.format("%-" + length + "s", value).substring(0, length);
    }

    private String formatDate(LocalDate date) {
        return date != null ? date.format(DateTimeFormatter.BASIC_ISO_DATE) : "        ";
    }
}
```

---

## 8. Error Handling & Dead Letter Queues

### 8.1 Error Handling Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐                                                           │
│  │   Message    │                                                           │
│  │   Received   │                                                           │
│  └──────┬───────┘                                                           │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────┐     Success    ┌──────────────┐                          │
│  │   Process    │───────────────▶│   Complete   │                          │
│  │   Message    │                │              │                          │
│  └──────┬───────┘                └──────────────┘                          │
│         │                                                                    │
│         │ Error                                                              │
│         ▼                                                                    │
│  ┌──────────────┐                                                           │
│  │   Retry      │────────────────┐                                          │
│  │   (1-3x)     │                │ Max Retries                              │
│  └──────┬───────┘                │                                          │
│         │                        ▼                                          │
│         │ Success         ┌──────────────┐                                  │
│         │                 │   Dead       │                                  │
│         ▼                 │   Letter     │                                  │
│  ┌──────────────┐         │   Queue      │                                  │
│  │   Complete   │         └──────┬───────┘                                  │
│  │              │                │                                          │
│  └──────────────┘                ▼                                          │
│                          ┌──────────────┐                                   │
│                          │   Alert &    │                                   │
│                          │   Manual     │                                   │
│                          │   Review     │                                   │
│                          └──────────────┘                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Error Handler Configuration

```java
@Component
public class ErrorHandlerConfiguration extends RouteBuilder {

    @Override
    public void configure() throws Exception {

        // Global error handler for all routes
        errorHandler(deadLetterChannel("kafka:dlq.integration.failed")
            .maximumRedeliveries(3)
            .redeliveryDelay(5000)
            .retryAttemptedLogLevel(LoggingLevel.WARN)
            .retriesExhaustedLogLevel(LoggingLevel.ERROR)
            .useExponentialBackOff()
            .backOffMultiplier(2)
            .maximumRedeliveryDelay(60000)
            .onRedelivery(exchange -> {
                int attempt = exchange.getIn().getHeader(Exchange.REDELIVERY_COUNTER, Integer.class);
                log.warn("Retry attempt {} for message: {}", attempt, exchange.getIn().getBody());
            })
            .onExceptionOccurred(exchange -> {
                Exception e = exchange.getProperty(Exchange.EXCEPTION_CAUGHT, Exception.class);
                log.error("Exception occurred: {}", e.getMessage());
            }));

        // Specific exception handlers
        onException(HttpOperationFailedException.class)
            .handled(true)
            .maximumRedeliveries(3)
            .redeliveryDelay(10000)
            .process(exchange -> {
                HttpOperationFailedException e = exchange.getProperty(
                    Exchange.EXCEPTION_CAUGHT, HttpOperationFailedException.class);

                if (e.getStatusCode() == 401) {
                    // Token expired - refresh and retry
                    exchange.getIn().setHeader("tokenRefreshRequired", true);
                } else if (e.getStatusCode() >= 500) {
                    // Server error - retry
                    throw e;
                } else {
                    // Client error - don't retry
                    exchange.getIn().setHeader("errorType", "CLIENT_ERROR");
                }
            })
            .to("direct:error-processor");

        onException(ConnectException.class, SocketTimeoutException.class)
            .handled(true)
            .maximumRedeliveries(5)
            .redeliveryDelay(15000)
            .useExponentialBackOff()
            .to("kafka:dlq.connection.failed");

        // DLQ Processor Route
        from("kafka:dlq.integration.failed?groupId=dlq-processor")
            .routeId("dlq-processor")
            .log("Processing DLQ message: ${body}")
            .process(exchange -> {
                // Extract error details
                String errorMessage = exchange.getProperty(Exchange.EXCEPTION_CAUGHT, Exception.class).getMessage();
                String routeId = exchange.getIn().getHeader("CamelRouteId", String.class);

                // Create error event
                IntegrationErrorEvent errorEvent = IntegrationErrorEvent.builder()
                    .routeId(routeId)
                    .errorMessage(errorMessage)
                    .originalPayload(exchange.getIn().getBody(String.class))
                    .timestamp(Instant.now())
                    .build();

                exchange.getIn().setBody(errorEvent);
            })
            .to("direct:send-alert")
            .to("mongodb:errorCollection?operation=insert");
    }
}
```

### 8.3 Dead Letter Queue Topics

| DLQ Topic | Source | Retention | Alert Level |
|-----------|--------|-----------|-------------|
| `dlq.integration.failed` | General integration failures | 7 days | Warning |
| `dlq.cbs.failed` | CBS integration failures | 14 days | Critical |
| `dlq.payment.failed` | Payment gateway failures | 14 days | Critical |
| `dlq.cib.failed` | CIB API failures | 7 days | High |
| `dlq.notification.failed` | SMS/Email failures | 3 days | Low |

---

## 9. Resilience Patterns

### 9.1 Circuit Breaker Configuration

```java
@Configuration
public class ResilienceConfiguration {

    @Bean
    public CircuitBreakerRegistry circuitBreakerRegistry() {
        CircuitBreakerConfig cbsConfig = CircuitBreakerConfig.custom()
            .failureRateThreshold(50)
            .slowCallRateThreshold(80)
            .slowCallDurationThreshold(Duration.ofSeconds(30))
            .waitDurationInOpenState(Duration.ofSeconds(60))
            .permittedNumberOfCallsInHalfOpenState(5)
            .slidingWindowSize(10)
            .slidingWindowType(CircuitBreakerConfig.SlidingWindowType.COUNT_BASED)
            .recordExceptions(
                ConnectException.class,
                SocketTimeoutException.class,
                HttpServerErrorException.class
            )
            .ignoreExceptions(
                HttpClientErrorException.class
            )
            .build();

        CircuitBreakerConfig paymentConfig = CircuitBreakerConfig.custom()
            .failureRateThreshold(30)
            .waitDurationInOpenState(Duration.ofSeconds(120))
            .slidingWindowSize(20)
            .build();

        return CircuitBreakerRegistry.of(Map.of(
            "cbs", cbsConfig,
            "cib", cbsConfig,
            "bkash", paymentConfig,
            "nagad", paymentConfig,
            "rocket", paymentConfig
        ));
    }

    @Bean
    public RetryRegistry retryRegistry() {
        RetryConfig defaultConfig = RetryConfig.custom()
            .maxAttempts(3)
            .waitDuration(Duration.ofSeconds(5))
            .exponentialBackoffMultiplier(2)
            .retryExceptions(
                ConnectException.class,
                SocketTimeoutException.class
            )
            .build();

        return RetryRegistry.of(defaultConfig);
    }

    @Bean
    public BulkheadRegistry bulkheadRegistry() {
        BulkheadConfig config = BulkheadConfig.custom()
            .maxConcurrentCalls(20)
            .maxWaitDuration(Duration.ofSeconds(30))
            .build();

        return BulkheadRegistry.of(config);
    }
}
```

### 9.2 Resilience Patterns in Camel Routes

```java
// Circuit Breaker in Camel Route
from("direct:cbs-with-resilience")
    .routeId("cbs-resilient-call")
    .circuitBreaker()
        .resilience4jConfiguration()
            .circuitBreaker("cbs")
            .bulkhead("cbs")
        .end()
        .to("{{cbs.api.url}}/accounts")
    .onFallback()
        .log("CBS is unavailable, using fallback")
        .process(exchange -> {
            // Queue for later processing
            exchange.getIn().setHeader("fallbackReason", "CBS_UNAVAILABLE");
        })
        .to("kafka:cbs.retry.queue")
    .end();
```

### 9.3 Timeout Configuration

| Integration | Connect Timeout | Read Timeout | Total Timeout |
|-------------|-----------------|--------------|---------------|
| CIB Online | 30s | 120s | 180s |
| NID Wing | 10s | 30s | 45s |
| CBS | 15s | 60s | 90s |
| bKash | 10s | 30s | 45s |
| Nagad | 10s | 30s | 45s |
| Rocket | 10s | 30s | 45s |
| SMS Gateway | 5s | 15s | 25s |

---

## 10. Security Architecture

### 10.1 Security Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    INTEGRATION SECURITY LAYERS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    TRANSPORT SECURITY                                │   │
│  │  • TLS 1.3 for all external communications                          │   │
│  │  • mTLS for Bangladesh Bank CIB (certificate-based)                 │   │
│  │  • VPN tunnel for CIB connectivity                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    AUTHENTICATION                                    │   │
│  │  • OAuth 2.0 for payment gateways (bKash, Nagad)                   │   │
│  │  • API Keys for SMS/Email gateways                                  │   │
│  │  • X.509 Certificates for Bangladesh Bank                           │   │
│  │  • SSH Keys for SFTP transfers                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    DATA PROTECTION                                   │   │
│  │  • AES-256 encryption for sensitive data at rest                   │   │
│  │  • NID/PII encryption before external calls                        │   │
│  │  • Secure credential storage in HashiCorp Vault                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    AUDIT & COMPLIANCE                                │   │
│  │  • Complete audit trail for all integrations                        │   │
│  │  • Request/response logging (sanitized)                            │   │
│  │  • ICT Security Guidelines V4.0 compliance                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Authentication by System

| System | Auth Method | Credential Storage | Rotation |
|--------|-------------|-------------------|----------|
| BB CIB | mTLS (X.509) | Vault | Annually |
| BB SFTP | SSH Key | Vault | Annually |
| NID Wing | API Key | Vault | Quarterly |
| CBS | OAuth 2.0 | Vault | Dynamic |
| bKash | OAuth 2.0 | Vault | Dynamic |
| Nagad | OAuth 2.0 | Vault | Dynamic |
| Rocket | API Key | Vault | Quarterly |
| SMS Gateway | API Key | Vault | Quarterly |

### 10.3 SSL/TLS Configuration

```java
@Configuration
public class SslConfiguration {

    @Bean
    public SSLContext defaultSslContext() throws Exception {
        TrustManagerFactory tmf = TrustManagerFactory.getInstance(
            TrustManagerFactory.getDefaultAlgorithm());
        tmf.init((KeyStore) null);

        SSLContext sslContext = SSLContext.getInstance("TLSv1.3");
        sslContext.init(null, tmf.getTrustManagers(), new SecureRandom());

        return sslContext;
    }

    @Bean
    @Qualifier("cibSslContext")
    public SSLContext cibSslContext(
            @Value("${cib.ssl.keystore-path}") String keystorePath,
            @Value("${cib.ssl.keystore-password}") String keystorePassword,
            @Value("${cib.ssl.truststore-path}") String truststorePath,
            @Value("${cib.ssl.truststore-password}") String truststorePassword) throws Exception {

        // Load KeyStore (client certificate)
        KeyStore keyStore = KeyStore.getInstance("PKCS12");
        try (InputStream kis = new FileInputStream(keystorePath)) {
            keyStore.load(kis, keystorePassword.toCharArray());
        }

        // Load TrustStore (BB CA)
        KeyStore trustStore = KeyStore.getInstance("JKS");
        try (InputStream tis = new FileInputStream(truststorePath)) {
            trustStore.load(tis, truststorePassword.toCharArray());
        }

        KeyManagerFactory kmf = KeyManagerFactory.getInstance(
            KeyManagerFactory.getDefaultAlgorithm());
        kmf.init(keyStore, keystorePassword.toCharArray());

        TrustManagerFactory tmf = TrustManagerFactory.getInstance(
            TrustManagerFactory.getDefaultAlgorithm());
        tmf.init(trustStore);

        SSLContext sslContext = SSLContext.getInstance("TLSv1.3");
        sslContext.init(kmf.getKeyManagers(), tmf.getTrustManagers(), new SecureRandom());

        return sslContext;
    }
}
```

### 10.4 Sensitive Data Handling

```java
@Component
public class DataSanitizer {

    // Fields to mask in logs
    private static final Set<String> SENSITIVE_FIELDS = Set.of(
        "nidNumber", "mobileNumber", "accountNumber", "password", "apiKey"
    );

    public String sanitizeForLogging(String json) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(json);

            sanitizeNode(root);

            return mapper.writeValueAsString(root);
        } catch (Exception e) {
            return "[SANITIZATION_ERROR]";
        }
    }

    private void sanitizeNode(JsonNode node) {
        if (node.isObject()) {
            ObjectNode objectNode = (ObjectNode) node;
            Iterator<String> fieldNames = objectNode.fieldNames();

            while (fieldNames.hasNext()) {
                String fieldName = fieldNames.next();
                if (SENSITIVE_FIELDS.contains(fieldName)) {
                    objectNode.put(fieldName, "***MASKED***");
                } else {
                    sanitizeNode(objectNode.get(fieldName));
                }
            }
        } else if (node.isArray()) {
            for (JsonNode element : node) {
                sanitizeNode(element);
            }
        }
    }
}
```

---

## 11. Monitoring & Observability

### 11.1 Monitoring Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    OBSERVABILITY STACK                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    METRICS (Prometheus + Grafana)                    │   │
│  │  • Route execution time      • Message throughput                   │   │
│  │  • Error rates               • Circuit breaker status               │   │
│  │  • External system latency   • Queue depths                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    LOGGING (ELK Stack)                               │   │
│  │  • Structured JSON logs      • Request/Response correlation         │   │
│  │  • Error stack traces        • Audit events                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    TRACING (Jaeger)                                  │   │
│  │  • Distributed trace IDs     • Service dependency mapping           │   │
│  │  • Latency breakdown         • Error propagation                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    ALERTING (Prometheus Alertmanager)                │   │
│  │  • Circuit breaker alerts    • High error rate alerts               │   │
│  │  • Latency threshold alerts  • DLQ depth alerts                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Key Metrics

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `integration_route_total` | Total messages processed per route | - |
| `integration_route_failures` | Failed messages per route | >5% |
| `integration_route_duration` | Processing time per route | >30s (95th) |
| `integration_external_latency` | External system response time | >10s |
| `integration_circuit_breaker_state` | Circuit breaker state | Open |
| `integration_dlq_depth` | Dead letter queue message count | >100 |
| `integration_retry_count` | Retry attempts | >3 per minute |

### 11.3 Grafana Dashboard

```yaml
# integration-dashboard.json
dashboard:
  title: "ULMS Integration Gateway"
  panels:
    - title: "Message Throughput"
      type: graph
      targets:
        - expr: rate(integration_route_total[5m])
          legendFormat: "{{route}}"

    - title: "Error Rate"
      type: graph
      targets:
        - expr: rate(integration_route_failures[5m]) / rate(integration_route_total[5m]) * 100
          legendFormat: "{{route}}"

    - title: "External System Latency"
      type: heatmap
      targets:
        - expr: integration_external_latency_bucket

    - title: "Circuit Breaker Status"
      type: stat
      targets:
        - expr: integration_circuit_breaker_state
          legendFormat: "{{name}}"

    - title: "DLQ Depth"
      type: gauge
      targets:
        - expr: kafka_consumer_group_lag{topic=~"dlq.*"}
```

### 11.4 Alert Rules

```yaml
# prometheus-alerts.yml
groups:
  - name: integration-alerts
    rules:
      - alert: IntegrationHighErrorRate
        expr: rate(integration_route_failures[5m]) / rate(integration_route_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate on route {{ $labels.route }}"

      - alert: IntegrationCircuitBreakerOpen
        expr: integration_circuit_breaker_state == 1
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Circuit breaker OPEN for {{ $labels.name }}"

      - alert: IntegrationHighLatency
        expr: histogram_quantile(0.95, integration_route_duration_bucket) > 30
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency on route {{ $labels.route }}"

      - alert: IntegrationDLQBacklog
        expr: kafka_consumer_group_lag{topic=~"dlq.*"} > 100
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "DLQ backlog on topic {{ $labels.topic }}"
```

---

## 12. Deployment Configuration

### 12.1 Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ulms-integration-gateway
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
      app: ulms-integration-gateway
  template:
    metadata:
      labels:
        app: ulms-integration-gateway
    spec:
      containers:
      - name: integration-gateway
        image: unisoft/ulms-integration-gateway:1.0.0
        ports:
        - containerPort: 8088
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
        - name: KAFKA_BOOTSTRAP_SERVERS
          valueFrom:
            configMapKeyRef:
              name: ulms-config
              key: kafka.brokers
        - name: CBS_API_URL
          valueFrom:
            secretKeyRef:
              name: integration-secrets
              key: cbs-api-url
        volumeMounts:
        - name: cib-certs
          mountPath: /etc/ulms/certs/cib
          readOnly: true
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8088
          initialDelaySeconds: 60
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8088
          initialDelaySeconds: 30
          periodSeconds: 5
      volumes:
      - name: cib-certs
        secret:
          secretName: cib-certificates
```

### 12.2 Resource Allocation

| Environment | Replicas | CPU Request | CPU Limit | Memory Request | Memory Limit |
|-------------|----------|-------------|-----------|----------------|--------------|
| Development | 1 | 250m | 500m | 512Mi | 1Gi |
| Staging | 2 | 500m | 1000m | 1Gi | 2Gi |
| Production | 3-5 | 500m | 1000m | 1Gi | 2Gi |

---

## 13. Appendices

### 13.1 Configuration Properties Reference

```yaml
# application-production.yml
integration:
  # CBS Configuration
  cbs:
    url: ${CBS_API_URL}
    timeout: 60000
    retry:
      max-attempts: 3
      delay: 5000

  # CIB Configuration
  cib:
    url: https://cib.bb.org.bd/api/v2
    timeout: 120000
    ssl:
      keystore-path: /etc/ulms/certs/cib/keystore.p12
      truststore-path: /etc/ulms/certs/cib/truststore.jks

  # Payment Gateways
  bkash:
    url: https://api.bkash.com/v1
    client-id: ${BKASH_CLIENT_ID}
    client-secret: ${BKASH_CLIENT_SECRET}

  nagad:
    url: https://api.nagad.com.bd/v1
    client-id: ${NAGAD_CLIENT_ID}
    client-secret: ${NAGAD_CLIENT_SECRET}

  rocket:
    url: https://api.rocket.com.bd/v1
    api-key: ${ROCKET_API_KEY}

  # SFTP Configuration
  sftp:
    bb:
      host: sftp.bb.org.bd
      port: 22
      username: ${BB_SFTP_USER}
      private-key: /etc/ulms/keys/bb-sftp.key

  # Notifications
  sms:
    gateway-url: ${SMS_GATEWAY_URL}
    api-key: ${SMS_API_KEY}

  email:
    smtp:
      host: smtp.ses.ap-south-1.amazonaws.com
      port: 587
      username: ${EMAIL_SMTP_USER}
      password: ${EMAIL_SMTP_PASSWORD}
```

### 13.2 Related Documents

| Document ID | Document Name |
|-------------|---------------|
| ARCH-1.5.2 | CIB Online Integration Design |
| ARCH-1.5.3 | NID/e-KYC Integration Design |
| ARCH-1.5.4 | CBS Integration Design |
| ARCH-1.5.5 | Payment Gateway Integration Design |
| ARCH-1.5.6 | Bangladesh Bank SFTP Integration |
| ARCH-1.4.5 | mTLS Configuration for CIB |
| ARCH-1.1.2 | Microservices Architecture Blueprint |
| ARCH-1.1.4 | Event-Driven Architecture Design |

### 13.3 Glossary

| Term | Definition |
|------|------------|
| **ESB** | Enterprise Service Bus |
| **EIP** | Enterprise Integration Patterns |
| **mTLS** | Mutual TLS (certificate-based authentication) |
| **SAGA** | Pattern for managing distributed transactions |
| **DLQ** | Dead Letter Queue |
| **Circuit Breaker** | Pattern to prevent cascading failures |

---

**Document Version:** 1.0
**Classification:** Confidential - Internal Use
**Last Updated:** February 5, 2026
**Next Review:** August 2026

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

*This Integration Architecture Overview Document provides the comprehensive integration framework for ULMS v2.0 using Apache Camel 4.3 ESB.*

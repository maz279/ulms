# Event-Driven Architecture Design
## Unisoft Loan Management System (ULMS) v2.0
### Apache Kafka Event Streaming Implementation

---

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ARCH-1.1.4 |
| **Document Title** | Event-Driven Architecture Design |
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
| 1.0 | February 4, 2026 | Lead Developer | Initial Event-Driven Architecture Design |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Event-Driven Architecture Overview](#2-event-driven-architecture-overview)
3. [Apache Kafka Configuration](#3-apache-kafka-configuration)
4. [Kafka Topics Specification](#4-kafka-topics-specification)
5. [Event Schemas](#5-event-schemas)
6. [Producer/Consumer Patterns](#6-producerconsumer-patterns)
7. [Event Sourcing Implementation](#7-event-sourcing-implementation)
8. [SAGA Pattern for Distributed Transactions](#8-saga-pattern-for-distributed-transactions)
9. [Dead Letter Queue Strategy](#9-dead-letter-queue-strategy)
10. [Event Flow Diagrams](#10-event-flow-diagrams)
11. [Monitoring & Alerting](#11-monitoring--alerting)
12. [Compliance Considerations](#12-compliance-considerations)
13. [Appendices](#13-appendices)

---

## 1. Executive Summary

### 1.1 Purpose

This document defines the event-driven architecture for ULMS v2.0, utilizing **Apache Kafka 3.6** as the central event streaming platform. The architecture enables loose coupling between microservices, provides an immutable audit trail for compliance, and supports high-throughput asynchronous processing.

### 1.2 Key Objectives

| Objective | Implementation |
|-----------|---------------|
| **Asynchronous Processing** | Kafka consumers process events independently |
| **Loose Coupling** | Services communicate via events, not direct calls |
| **Immutable Audit Trail** | Kafka retention provides 10-year compliance audit |
| **Scalability** | Partitioned topics enable horizontal scaling |
| **Resilience** | Dead letter queues handle failures gracefully |
| **Event Sourcing** | Complete loan lifecycle event history |

### 1.3 Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Event Broker** | Apache Kafka | 3.6 |
| **Schema Registry** | Confluent Schema Registry | 7.5 |
| **Schema Format** | Apache Avro | 1.11.3 |
| **Stream Processing** | Kafka Streams | 3.6 |
| **Monitoring** | Kafka Exporter + Prometheus | Latest |
| **UI** | Kafka UI / AKHQ | Latest |

---

## 2. Event-Driven Architecture Overview

### 2.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    ULMS EVENT-DRIVEN ARCHITECTURE                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ╔═══════════════════════════════════════════════════════════════════════════════╗  │
│  ║                           EVENT PRODUCERS                                      ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                                ║  │
│  ║  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  ║  │
│  ║  │   LOS      │ │  Workflow  │ │   BRPD     │ │   CBS      │ │  Fineract  │  ║  │
│  ║  │  Module    │ │  Service   │ │  Service   │ │  Adapter   │ │   Core     │  ║  │
│  ║  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘  ║  │
│  ║        │              │              │              │              │          ║  │
│  ╚════════╪══════════════╪══════════════╪══════════════╪══════════════╪══════════╝  │
│           │              │              │              │              │              │
│           └──────────────┴──────────────┴──────────────┴──────────────┘              │
│                                         │                                            │
│                                         ▼                                            │
│  ╔═══════════════════════════════════════════════════════════════════════════════╗  │
│  ║                         APACHE KAFKA CLUSTER (3.6)                             ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                                ║  │
│  ║  ┌─────────────────────────────────────────────────────────────────────────┐  ║  │
│  ║  │                        Kafka Brokers (3+)                                │  ║  │
│  ║  │  ┌───────────┐  ┌───────────┐  ┌───────────┐                           │  ║  │
│  ║  │  │ Broker 1  │  │ Broker 2  │  │ Broker 3  │                           │  ║  │
│  ║  │  │ (Leader)  │  │ (Replica) │  │ (Replica) │                           │  ║  │
│  ║  │  └───────────┘  └───────────┘  └───────────┘                           │  ║  │
│  ║  └─────────────────────────────────────────────────────────────────────────┘  ║  │
│  ║                                                                                ║  │
│  ║  ┌─────────────────────────────────────────────────────────────────────────┐  ║  │
│  ║  │                         Topics (7 Core Topics)                           │  ║  │
│  ║  │                                                                          │  ║  │
│  ║  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │  ║  │
│  ║  │  │loan.applications│  │ loan.approvals  │  │loan.disbursements│         │  ║  │
│  ║  │  │  P:12  R:3      │  │  P:6   R:3      │  │  P:6   R:3       │         │  ║  │
│  ║  │  │  Ret:1 year     │  │  Ret:7 years    │  │  Ret:7 years     │         │  ║  │
│  ║  │  └─────────────────┘  └─────────────────┘  └─────────────────┘         │  ║  │
│  ║  │                                                                          │  ║  │
│  ║  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │  ║  │
│  ║  │  │  loan.payments  │  │loan.classificat-│  │  notifications  │         │  ║  │
│  ║  │  │  P:12  R:3      │  │ions  P:3  R:3   │  │  P:6   R:3      │         │  ║  │
│  ║  │  │  Ret:7 years    │  │  Ret:2 years    │  │  Ret:30 days    │         │  ║  │
│  ║  │  └─────────────────┘  └─────────────────┘  └─────────────────┘         │  ║  │
│  ║  │                                                                          │  ║  │
│  ║  │  ┌─────────────────┐  ┌─────────────────────────────────────────────┐  │  ║  │
│  ║  │  │  audit.events   │  │           Dead Letter Queues                │  │  ║  │
│  ║  │  │  P:6   R:3      │  │  dlq.loan.applications │ dlq.cbs.failed    │  │  ║  │
│  ║  │  │  Ret:10 years   │  │  dlq.notifications     │ dlq.integration   │  │  ║  │
│  ║  │  └─────────────────┘  └─────────────────────────────────────────────┘  │  ║  │
│  ║  │                                                                          │  ║  │
│  ║  └─────────────────────────────────────────────────────────────────────────┘  ║  │
│  ║                                                                                ║  │
│  ║  ┌─────────────────────────────────────────────────────────────────────────┐  ║  │
│  ║  │                    Confluent Schema Registry                             │  ║  │
│  ║  │   Avro Schemas │ Schema Versioning │ Compatibility Checks               │  ║  │
│  ║  └─────────────────────────────────────────────────────────────────────────┘  ║  │
│  ║                                                                                ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════════╝  │
│                                         │                                            │
│                                         ▼                                            │
│  ╔═══════════════════════════════════════════════════════════════════════════════╗  │
│  ║                           EVENT CONSUMERS                                      ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                                ║  │
│  ║  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  ║  │
│  ║  │Notification│ │ Analytics  │ │ Integration│ │    ELK     │ │  BRPD      │  ║  │
│  ║  │  Service   │ │  Service   │ │  Gateway   │ │   Stack    │ │  Service   │  ║  │
│  ║  │(SMS/Email) │ │(Dashboards)│ │ (CBS Sync) │ │ (Logging)  │ │(Compliance)│  ║  │
│  ║  └────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘  ║  │
│  ║                                                                                ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════════╝  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Event-Driven Principles

| Principle | Description | ULMS Implementation |
|-----------|-------------|---------------------|
| **Event Immutability** | Events are facts that cannot be changed | Kafka append-only log |
| **Event Ordering** | Events within a partition maintain order | Loan ID as partition key |
| **At-Least-Once Delivery** | Events delivered at least once | Idempotent consumers |
| **Event Schema Evolution** | Schemas evolve without breaking consumers | Avro + Schema Registry |
| **Loose Coupling** | Producers don't know consumers | Topic-based pub/sub |

### 2.3 Event Categories

| Category | Description | Topics | Retention |
|----------|-------------|--------|-----------|
| **Domain Events** | Business state changes | loan.* | 1-7 years |
| **Integration Events** | Cross-system communication | cbs.*, cib.* | 30 days |
| **Notification Events** | User communications | notifications | 30 days |
| **Audit Events** | Compliance and security | audit.events | 10 years |
| **Dead Letter Events** | Failed processing | dlq.* | 30 days |

---

## 3. Apache Kafka Configuration

### 3.1 Cluster Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                       KAFKA CLUSTER ARCHITECTURE                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐ │
│  │                           Kubernetes Namespace: ulms-kafka                      │ │
│  │                                                                                 │ │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │                        Kafka Brokers (StatefulSet)                        │ │ │
│  │  │                                                                            │ │ │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                    │ │ │
│  │  │  │   Broker 0   │  │   Broker 1   │  │   Broker 2   │                    │ │ │
│  │  │  │   kafka-0    │  │   kafka-1    │  │   kafka-2    │                    │ │ │
│  │  │  │              │  │              │  │              │                    │ │ │
│  │  │  │  CPU: 2      │  │  CPU: 2      │  │  CPU: 2      │                    │ │ │
│  │  │  │  RAM: 8GB    │  │  RAM: 8GB    │  │  RAM: 8GB    │                    │ │ │
│  │  │  │  Disk: 1TB   │  │  Disk: 1TB   │  │  Disk: 1TB   │                    │ │ │
│  │  │  │  SSD NVMe    │  │  SSD NVMe    │  │  SSD NVMe    │                    │ │ │
│  │  │  └──────────────┘  └──────────────┘  └──────────────┘                    │ │ │
│  │  │                                                                            │ │ │
│  │  └───────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                 │ │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │                    KRaft Controllers (or ZooKeeper)                       │ │ │
│  │  │                                                                            │ │ │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                    │ │ │
│  │  │  │ Controller 0 │  │ Controller 1 │  │ Controller 2 │                    │ │ │
│  │  │  │   kraft-0    │  │   kraft-1    │  │   kraft-2    │                    │ │ │
│  │  │  └──────────────┘  └──────────────┘  └──────────────┘                    │ │ │
│  │  │                                                                            │ │ │
│  │  └───────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                 │ │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │                       Schema Registry (Deployment)                        │ │ │
│  │  │                                                                            │ │ │
│  │  │  ┌──────────────┐  ┌──────────────┐                                      │ │ │
│  │  │  │ schema-reg-0 │  │ schema-reg-1 │                                      │ │ │
│  │  │  │ (Active)     │  │ (Standby)    │                                      │ │ │
│  │  │  └──────────────┘  └──────────────┘                                      │ │ │
│  │  │                                                                            │ │ │
│  │  └───────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                 │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Broker Configuration

```properties
# server.properties - Production Kafka Broker Configuration

# Broker Identification
broker.id=0
broker.rack=rack1

# Network Configuration
listeners=PLAINTEXT://0.0.0.0:9092,SSL://0.0.0.0:9093
advertised.listeners=PLAINTEXT://kafka-0.kafka.ulms-kafka.svc.cluster.local:9092
listener.security.protocol.map=PLAINTEXT:PLAINTEXT,SSL:SSL

# Log Configuration
log.dirs=/var/kafka-logs
num.partitions=12
default.replication.factor=3
min.insync.replicas=2

# Log Retention
log.retention.hours=168              # 7 days default (overridden per topic)
log.retention.bytes=-1               # No size limit
log.segment.bytes=1073741824         # 1GB segments
log.retention.check.interval.ms=300000

# Performance Tuning
num.network.threads=8
num.io.threads=16
socket.send.buffer.bytes=102400
socket.receive.buffer.bytes=102400
socket.request.max.bytes=104857600

# Replication
replica.fetch.max.bytes=1048576
replica.fetch.wait.max.ms=500
replica.lag.time.max.ms=30000

# Message Configuration
message.max.bytes=10485760           # 10MB max message
compression.type=lz4                 # LZ4 compression

# Transaction Support
transaction.state.log.replication.factor=3
transaction.state.log.min.isr=2

# Auto Topic Creation (Disabled in production)
auto.create.topics.enable=false

# Group Coordinator
offsets.topic.replication.factor=3
offsets.topic.num.partitions=50

# Metrics
metric.reporters=io.prometheus.client.exporter.KafkaExporter
```

### 3.3 Schema Registry Configuration

```yaml
# schema-registry.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: schema-registry
  namespace: ulms-kafka
spec:
  replicas: 2
  selector:
    matchLabels:
      app: schema-registry
  template:
    spec:
      containers:
      - name: schema-registry
        image: confluentinc/cp-schema-registry:7.5.0
        ports:
        - containerPort: 8081
        env:
        - name: SCHEMA_REGISTRY_HOST_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: SCHEMA_REGISTRY_KAFKASTORE_BOOTSTRAP_SERVERS
          value: "kafka-0.kafka:9092,kafka-1.kafka:9092,kafka-2.kafka:9092"
        - name: SCHEMA_REGISTRY_LISTENERS
          value: "http://0.0.0.0:8081"
        - name: SCHEMA_REGISTRY_SCHEMA_COMPATIBILITY_LEVEL
          value: "BACKWARD"
        - name: SCHEMA_REGISTRY_AVRO_COMPATIBILITY_LEVEL
          value: "BACKWARD"
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
```

### 3.4 Kubernetes StatefulSet for Kafka

```yaml
# kafka-statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: kafka
  namespace: ulms-kafka
spec:
  serviceName: kafka
  replicas: 3
  selector:
    matchLabels:
      app: kafka
  template:
    metadata:
      labels:
        app: kafka
    spec:
      containers:
      - name: kafka
        image: confluentinc/cp-kafka:7.5.0
        ports:
        - containerPort: 9092
          name: plaintext
        - containerPort: 9093
          name: ssl
        env:
        - name: KAFKA_BROKER_ID
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: KAFKA_ZOOKEEPER_CONNECT
          value: "zk-0.zk:2181,zk-1.zk:2181,zk-2.zk:2181"
        - name: KAFKA_LISTENERS
          value: "PLAINTEXT://0.0.0.0:9092"
        - name: KAFKA_ADVERTISED_LISTENERS
          value: "PLAINTEXT://$(hostname -f):9092"
        - name: KAFKA_DEFAULT_REPLICATION_FACTOR
          value: "3"
        - name: KAFKA_MIN_INSYNC_REPLICAS
          value: "2"
        - name: KAFKA_NUM_PARTITIONS
          value: "12"
        - name: KAFKA_LOG_RETENTION_HOURS
          value: "168"
        - name: KAFKA_AUTO_CREATE_TOPICS_ENABLE
          value: "false"
        resources:
          requests:
            memory: "6Gi"
            cpu: "1500m"
          limits:
            memory: "8Gi"
            cpu: "2000m"
        volumeMounts:
        - name: kafka-data
          mountPath: /var/kafka-logs
  volumeClaimTemplates:
  - metadata:
      name: kafka-data
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: ssd-storage
      resources:
        requests:
          storage: 1Ti
```

---

## 4. Kafka Topics Specification

### 4.1 Topic Summary Table

| Topic Name | Partitions | Replication | Retention | Purpose | Key |
|------------|-----------|-------------|-----------|---------|-----|
| `loan.applications` | 12 | 3 | 1 year | Loan application lifecycle | loanId |
| `loan.approvals` | 6 | 3 | 7 years | Approval decisions | loanId |
| `loan.disbursements` | 6 | 3 | 7 years | Disbursement events | loanId |
| `loan.payments` | 12 | 3 | 7 years | Payment transactions | loanId |
| `loan.classifications` | 3 | 3 | 2 years | BRPD classification changes | loanId |
| `notifications` | 6 | 3 | 30 days | SMS/Email/Push triggers | customerId |
| `audit.events` | 6 | 3 | 10 years | Compliance audit trail | eventId |

### 4.2 Detailed Topic Configurations

#### 4.2.1 loan.applications

```bash
# Topic creation command
kafka-topics.sh --create \
  --bootstrap-server kafka:9092 \
  --topic loan.applications \
  --partitions 12 \
  --replication-factor 3 \
  --config retention.ms=31536000000 \      # 1 year (365 days)
  --config retention.bytes=-1 \
  --config cleanup.policy=delete \
  --config compression.type=lz4 \
  --config min.insync.replicas=2 \
  --config message.timestamp.type=CreateTime
```

**Event Types:**
- `LoanApplicationCreated`
- `LoanApplicationUpdated`
- `LoanApplicationSubmitted`
- `LoanApplicationWithdrawn`
- `LoanApplicationCancelled`

#### 4.2.2 loan.approvals

```bash
kafka-topics.sh --create \
  --bootstrap-server kafka:9092 \
  --topic loan.approvals \
  --partitions 6 \
  --replication-factor 3 \
  --config retention.ms=220898482000 \     # 7 years (regulatory)
  --config retention.bytes=-1 \
  --config cleanup.policy=delete \
  --config compression.type=lz4 \
  --config min.insync.replicas=2
```

**Event Types:**
- `LoanApprovalRequested`
- `LoanApprovedByLevel1`
- `LoanApprovedByLevel2`
- `LoanApprovedByLevel3`
- `LoanApprovedByLevel4`
- `LoanApprovedByLevel5`
- `LoanApprovedByLevel6`
- `LoanApprovedByLevel7`
- `LoanFinalApproved`
- `LoanRejected`
- `LoanReturnedForRevision`
- `LoanApprovalDelegated`

#### 4.2.3 loan.disbursements

```bash
kafka-topics.sh --create \
  --bootstrap-server kafka:9092 \
  --topic loan.disbursements \
  --partitions 6 \
  --replication-factor 3 \
  --config retention.ms=220898482000 \     # 7 years
  --config retention.bytes=-1 \
  --config cleanup.policy=delete \
  --config compression.type=lz4 \
  --config min.insync.replicas=2
```

**Event Types:**
- `DisbursementInitiated`
- `DisbursementProcessing`
- `DisbursementCompleted`
- `DisbursementFailed`
- `DisbursementReversed`
- `PartialDisbursement`

#### 4.2.4 loan.payments

```bash
kafka-topics.sh --create \
  --bootstrap-server kafka:9092 \
  --topic loan.payments \
  --partitions 12 \
  --replication-factor 3 \
  --config retention.ms=220898482000 \     # 7 years
  --config retention.bytes=-1 \
  --config cleanup.policy=delete \
  --config compression.type=lz4 \
  --config min.insync.replicas=2
```

**Event Types:**
- `EMIPaymentReceived`
- `EMIPaymentMissed`
- `EMIPaymentLate`
- `PrepaymentReceived`
- `PartPaymentReceived`
- `PenaltyApplied`
- `WaiverApplied`
- `LoanClosed`

#### 4.2.5 loan.classifications

```bash
kafka-topics.sh --create \
  --bootstrap-server kafka:9092 \
  --topic loan.classifications \
  --partitions 3 \
  --replication-factor 3 \
  --config retention.ms=63072000000 \      # 2 years
  --config retention.bytes=-1 \
  --config cleanup.policy=delete \
  --config compression.type=lz4 \
  --config min.insync.replicas=2
```

**Event Types:**
- `LoanClassificationChanged`
- `LoanEnteredSMA`
- `LoanEnteredNPA`
- `LoanUpgraded`
- `LoanDowngraded`
- `ProvisionCalculated`

#### 4.2.6 notifications

```bash
kafka-topics.sh --create \
  --bootstrap-server kafka:9092 \
  --topic notifications \
  --partitions 6 \
  --replication-factor 3 \
  --config retention.ms=2592000000 \       # 30 days
  --config retention.bytes=-1 \
  --config cleanup.policy=delete \
  --config compression.type=lz4 \
  --config min.insync.replicas=2
```

**Event Types:**
- `SMSNotificationRequested`
- `EmailNotificationRequested`
- `PushNotificationRequested`
- `InAppNotificationRequested`
- `BulkNotificationRequested`

#### 4.2.7 audit.events

```bash
kafka-topics.sh --create \
  --bootstrap-server kafka:9092 \
  --topic audit.events \
  --partitions 6 \
  --replication-factor 3 \
  --config retention.ms=315360000000 \     # 10 years (compliance)
  --config retention.bytes=-1 \
  --config cleanup.policy=delete \
  --config compression.type=lz4 \
  --config min.insync.replicas=2
```

**Event Types:**
- `UserLogin`
- `UserLogout`
- `DataAccess`
- `DataModification`
- `ConfigurationChange`
- `SecurityViolation`
- `SystemEvent`

### 4.3 Dead Letter Queue Topics

```bash
# DLQ for loan applications
kafka-topics.sh --create \
  --bootstrap-server kafka:9092 \
  --topic dlq.loan.applications \
  --partitions 3 \
  --replication-factor 3 \
  --config retention.ms=2592000000         # 30 days

# DLQ for CBS integration
kafka-topics.sh --create \
  --bootstrap-server kafka:9092 \
  --topic dlq.cbs.failed \
  --partitions 3 \
  --replication-factor 3 \
  --config retention.ms=2592000000

# DLQ for notifications
kafka-topics.sh --create \
  --bootstrap-server kafka:9092 \
  --topic dlq.notifications \
  --partitions 3 \
  --replication-factor 3 \
  --config retention.ms=2592000000

# DLQ for integration
kafka-topics.sh --create \
  --bootstrap-server kafka:9092 \
  --topic dlq.integration \
  --partitions 3 \
  --replication-factor 3 \
  --config retention.ms=2592000000
```

---

## 5. Event Schemas

### 5.1 Avro Schema Registry Structure

```
schemas/
├── loan/
│   ├── LoanApplicationEvent.avsc
│   ├── LoanApprovalEvent.avsc
│   ├── LoanDisbursementEvent.avsc
│   ├── LoanPaymentEvent.avsc
│   └── LoanClassificationEvent.avsc
├── notification/
│   └── NotificationEvent.avsc
├── audit/
│   └── AuditEvent.avsc
└── common/
    ├── Address.avsc
    ├── Money.avsc
    └── UserInfo.avsc
```

### 5.2 Core Event Schemas

#### 5.2.1 LoanApplicationEvent.avsc

```json
{
  "type": "record",
  "name": "LoanApplicationEvent",
  "namespace": "com.ulms.events.loan",
  "doc": "Event representing loan application lifecycle changes",
  "fields": [
    {
      "name": "eventId",
      "type": "string",
      "doc": "Unique event identifier (UUID)"
    },
    {
      "name": "eventType",
      "type": {
        "type": "enum",
        "name": "LoanApplicationEventType",
        "symbols": [
          "CREATED",
          "UPDATED",
          "SUBMITTED",
          "WITHDRAWN",
          "CANCELLED"
        ]
      },
      "doc": "Type of loan application event"
    },
    {
      "name": "eventTimestamp",
      "type": {
        "type": "long",
        "logicalType": "timestamp-millis"
      },
      "doc": "Timestamp when event occurred"
    },
    {
      "name": "tenantId",
      "type": "string",
      "doc": "Tenant identifier (bank_XXX)"
    },
    {
      "name": "loanId",
      "type": "long",
      "doc": "Loan application ID"
    },
    {
      "name": "applicationNumber",
      "type": "string",
      "doc": "Human-readable application number"
    },
    {
      "name": "customerId",
      "type": "long",
      "doc": "Customer ID"
    },
    {
      "name": "productCode",
      "type": "string",
      "doc": "Loan product code"
    },
    {
      "name": "requestedAmount",
      "type": {
        "type": "bytes",
        "logicalType": "decimal",
        "precision": 15,
        "scale": 2
      },
      "doc": "Requested loan amount"
    },
    {
      "name": "currency",
      "type": "string",
      "default": "BDT",
      "doc": "Currency code (ISO 4217)"
    },
    {
      "name": "requestedTenor",
      "type": "int",
      "doc": "Requested tenor in months"
    },
    {
      "name": "interestRate",
      "type": {
        "type": "bytes",
        "logicalType": "decimal",
        "precision": 5,
        "scale": 4
      },
      "doc": "Annual interest rate"
    },
    {
      "name": "branchId",
      "type": "string",
      "doc": "Branch code"
    },
    {
      "name": "creditScore",
      "type": ["null", "int"],
      "default": null,
      "doc": "Credit score if available"
    },
    {
      "name": "cibScore",
      "type": ["null", "int"],
      "default": null,
      "doc": "CIB score if available"
    },
    {
      "name": "dbr",
      "type": ["null", {
        "type": "bytes",
        "logicalType": "decimal",
        "precision": 5,
        "scale": 2
      }],
      "default": null,
      "doc": "Debt Burden Ratio"
    },
    {
      "name": "userId",
      "type": "string",
      "doc": "User who triggered the event"
    },
    {
      "name": "previousState",
      "type": ["null", "string"],
      "default": null,
      "doc": "Previous application state"
    },
    {
      "name": "newState",
      "type": "string",
      "doc": "New application state"
    },
    {
      "name": "metadata",
      "type": {
        "type": "map",
        "values": "string"
      },
      "default": {},
      "doc": "Additional metadata"
    },
    {
      "name": "correlationId",
      "type": ["null", "string"],
      "default": null,
      "doc": "Correlation ID for distributed tracing"
    }
  ]
}
```

#### 5.2.2 LoanApprovalEvent.avsc

```json
{
  "type": "record",
  "name": "LoanApprovalEvent",
  "namespace": "com.ulms.events.loan",
  "doc": "Event representing loan approval workflow changes",
  "fields": [
    {
      "name": "eventId",
      "type": "string"
    },
    {
      "name": "eventType",
      "type": {
        "type": "enum",
        "name": "LoanApprovalEventType",
        "symbols": [
          "APPROVAL_REQUESTED",
          "APPROVED_LEVEL_1",
          "APPROVED_LEVEL_2",
          "APPROVED_LEVEL_3",
          "APPROVED_LEVEL_4",
          "APPROVED_LEVEL_5",
          "APPROVED_LEVEL_6",
          "APPROVED_LEVEL_7",
          "FINAL_APPROVED",
          "REJECTED",
          "RETURNED_FOR_REVISION",
          "DELEGATED"
        ]
      }
    },
    {
      "name": "eventTimestamp",
      "type": {
        "type": "long",
        "logicalType": "timestamp-millis"
      }
    },
    {
      "name": "tenantId",
      "type": "string"
    },
    {
      "name": "loanId",
      "type": "long"
    },
    {
      "name": "applicationNumber",
      "type": "string"
    },
    {
      "name": "workflowProcessId",
      "type": "string",
      "doc": "Camunda process instance ID"
    },
    {
      "name": "taskId",
      "type": ["null", "string"],
      "default": null,
      "doc": "Camunda task ID"
    },
    {
      "name": "approvalLevel",
      "type": "int",
      "doc": "Current approval level (1-7)"
    },
    {
      "name": "approverUserId",
      "type": "string",
      "doc": "Approver user ID"
    },
    {
      "name": "approverName",
      "type": "string",
      "doc": "Approver full name"
    },
    {
      "name": "approverRole",
      "type": "string",
      "doc": "Approver role"
    },
    {
      "name": "approvedAmount",
      "type": ["null", {
        "type": "bytes",
        "logicalType": "decimal",
        "precision": 15,
        "scale": 2
      }],
      "default": null,
      "doc": "Approved amount (may differ from requested)"
    },
    {
      "name": "approvalLimit",
      "type": {
        "type": "bytes",
        "logicalType": "decimal",
        "precision": 15,
        "scale": 2
      },
      "doc": "Approver's approval limit"
    },
    {
      "name": "decision",
      "type": {
        "type": "enum",
        "name": "ApprovalDecision",
        "symbols": ["APPROVE", "REJECT", "RETURN", "DELEGATE"]
      }
    },
    {
      "name": "comments",
      "type": ["null", "string"],
      "default": null,
      "doc": "Approval comments"
    },
    {
      "name": "conditions",
      "type": {
        "type": "array",
        "items": "string"
      },
      "default": [],
      "doc": "Approval conditions"
    },
    {
      "name": "nextApprovalLevel",
      "type": ["null", "int"],
      "default": null,
      "doc": "Next required approval level"
    },
    {
      "name": "delegatedTo",
      "type": ["null", "string"],
      "default": null,
      "doc": "User ID if delegated"
    },
    {
      "name": "slaViolated",
      "type": "boolean",
      "default": false,
      "doc": "Whether SLA was violated"
    },
    {
      "name": "processingTimeMinutes",
      "type": ["null", "int"],
      "default": null,
      "doc": "Processing time in minutes"
    },
    {
      "name": "digitalSignature",
      "type": ["null", "string"],
      "default": null,
      "doc": "Digital signature hash"
    },
    {
      "name": "correlationId",
      "type": ["null", "string"],
      "default": null
    }
  ]
}
```

#### 5.2.3 LoanPaymentEvent.avsc

```json
{
  "type": "record",
  "name": "LoanPaymentEvent",
  "namespace": "com.ulms.events.loan",
  "doc": "Event representing loan payment transactions",
  "fields": [
    {
      "name": "eventId",
      "type": "string"
    },
    {
      "name": "eventType",
      "type": {
        "type": "enum",
        "name": "LoanPaymentEventType",
        "symbols": [
          "EMI_RECEIVED",
          "EMI_MISSED",
          "EMI_LATE",
          "PREPAYMENT",
          "PART_PAYMENT",
          "PENALTY_APPLIED",
          "WAIVER_APPLIED",
          "LOAN_CLOSED"
        ]
      }
    },
    {
      "name": "eventTimestamp",
      "type": {
        "type": "long",
        "logicalType": "timestamp-millis"
      }
    },
    {
      "name": "tenantId",
      "type": "string"
    },
    {
      "name": "loanId",
      "type": "long"
    },
    {
      "name": "loanAccountNumber",
      "type": "string"
    },
    {
      "name": "customerId",
      "type": "long"
    },
    {
      "name": "transactionId",
      "type": "string",
      "doc": "Unique transaction identifier"
    },
    {
      "name": "transactionDate",
      "type": {
        "type": "int",
        "logicalType": "date"
      }
    },
    {
      "name": "dueDate",
      "type": ["null", {
        "type": "int",
        "logicalType": "date"
      }],
      "default": null,
      "doc": "EMI due date"
    },
    {
      "name": "installmentNumber",
      "type": ["null", "int"],
      "default": null,
      "doc": "Installment number"
    },
    {
      "name": "principalAmount",
      "type": {
        "type": "bytes",
        "logicalType": "decimal",
        "precision": 15,
        "scale": 2
      }
    },
    {
      "name": "interestAmount",
      "type": {
        "type": "bytes",
        "logicalType": "decimal",
        "precision": 15,
        "scale": 2
      }
    },
    {
      "name": "penaltyAmount",
      "type": {
        "type": "bytes",
        "logicalType": "decimal",
        "precision": 15,
        "scale": 2
      },
      "default": "\u0000\u0000"
    },
    {
      "name": "totalAmount",
      "type": {
        "type": "bytes",
        "logicalType": "decimal",
        "precision": 15,
        "scale": 2
      }
    },
    {
      "name": "currency",
      "type": "string",
      "default": "BDT"
    },
    {
      "name": "paymentMethod",
      "type": {
        "type": "enum",
        "name": "PaymentMethod",
        "symbols": [
          "CASH",
          "CHEQUE",
          "ACCOUNT_DEBIT",
          "BKASH",
          "NAGAD",
          "ROCKET",
          "CARD",
          "OTHER"
        ]
      }
    },
    {
      "name": "paymentReference",
      "type": ["null", "string"],
      "default": null
    },
    {
      "name": "outstandingBefore",
      "type": {
        "type": "bytes",
        "logicalType": "decimal",
        "precision": 15,
        "scale": 2
      }
    },
    {
      "name": "outstandingAfter",
      "type": {
        "type": "bytes",
        "logicalType": "decimal",
        "precision": 15,
        "scale": 2
      }
    },
    {
      "name": "dpdBefore",
      "type": "int",
      "default": 0
    },
    {
      "name": "dpdAfter",
      "type": "int",
      "default": 0
    },
    {
      "name": "correlationId",
      "type": ["null", "string"],
      "default": null
    }
  ]
}
```

#### 5.2.4 LoanClassificationEvent.avsc

```json
{
  "type": "record",
  "name": "LoanClassificationEvent",
  "namespace": "com.ulms.events.loan",
  "doc": "Event representing BRPD loan classification changes",
  "fields": [
    {
      "name": "eventId",
      "type": "string"
    },
    {
      "name": "eventType",
      "type": {
        "type": "enum",
        "name": "ClassificationEventType",
        "symbols": [
          "CLASSIFICATION_CHANGED",
          "ENTERED_SMA",
          "ENTERED_NPA",
          "UPGRADED",
          "DOWNGRADED",
          "PROVISION_CALCULATED"
        ]
      }
    },
    {
      "name": "eventTimestamp",
      "type": {
        "type": "long",
        "logicalType": "timestamp-millis"
      }
    },
    {
      "name": "tenantId",
      "type": "string"
    },
    {
      "name": "loanId",
      "type": "long"
    },
    {
      "name": "loanAccountNumber",
      "type": "string"
    },
    {
      "name": "classificationDate",
      "type": {
        "type": "int",
        "logicalType": "date"
      }
    },
    {
      "name": "previousClassification",
      "type": ["null", {
        "type": "enum",
        "name": "Classification",
        "symbols": ["STD_0", "STD_1", "STD_2", "SMA", "SS", "DF", "BL"]
      }],
      "default": null
    },
    {
      "name": "newClassification",
      "type": "Classification"
    },
    {
      "name": "dpdBefore",
      "type": "int"
    },
    {
      "name": "dpdAfter",
      "type": "int"
    },
    {
      "name": "outstandingAmount",
      "type": {
        "type": "bytes",
        "logicalType": "decimal",
        "precision": 15,
        "scale": 2
      }
    },
    {
      "name": "previousProvisionRate",
      "type": ["null", {
        "type": "bytes",
        "logicalType": "decimal",
        "precision": 5,
        "scale": 4
      }],
      "default": null
    },
    {
      "name": "newProvisionRate",
      "type": {
        "type": "bytes",
        "logicalType": "decimal",
        "precision": 5,
        "scale": 4
      }
    },
    {
      "name": "provisionAmount",
      "type": {
        "type": "bytes",
        "logicalType": "decimal",
        "precision": 15,
        "scale": 2
      }
    },
    {
      "name": "interestSuspended",
      "type": {
        "type": "bytes",
        "logicalType": "decimal",
        "precision": 15,
        "scale": 2
      },
      "default": "\u0000\u0000"
    },
    {
      "name": "glJournalEntryId",
      "type": ["null", "long"],
      "default": null,
      "doc": "GL posting reference"
    },
    {
      "name": "isNPA",
      "type": "boolean",
      "default": false
    },
    {
      "name": "correlationId",
      "type": ["null", "string"],
      "default": null
    }
  ]
}
```

#### 5.2.5 AuditEvent.avsc

```json
{
  "type": "record",
  "name": "AuditEvent",
  "namespace": "com.ulms.events.audit",
  "doc": "Compliance audit event",
  "fields": [
    {
      "name": "eventId",
      "type": "string"
    },
    {
      "name": "eventType",
      "type": "string",
      "doc": "Audit event type"
    },
    {
      "name": "eventTimestamp",
      "type": {
        "type": "long",
        "logicalType": "timestamp-millis"
      }
    },
    {
      "name": "severity",
      "type": {
        "type": "enum",
        "name": "Severity",
        "symbols": ["DEBUG", "INFO", "WARN", "ERROR", "CRITICAL"]
      }
    },
    {
      "name": "tenantId",
      "type": "string"
    },
    {
      "name": "actor",
      "type": {
        "type": "record",
        "name": "Actor",
        "fields": [
          {"name": "userId", "type": "string"},
          {"name": "username", "type": "string"},
          {"name": "ipAddress", "type": "string"},
          {"name": "sessionId", "type": ["null", "string"], "default": null},
          {"name": "userAgent", "type": ["null", "string"], "default": null}
        ]
      }
    },
    {
      "name": "resource",
      "type": {
        "type": "record",
        "name": "Resource",
        "fields": [
          {"name": "resourceType", "type": "string"},
          {"name": "resourceId", "type": ["null", "string"], "default": null}
        ]
      }
    },
    {
      "name": "action",
      "type": {
        "type": "record",
        "name": "Action",
        "fields": [
          {"name": "actionType", "type": "string"},
          {"name": "actionStatus", "type": "string"},
          {"name": "statusCode", "type": ["null", "int"], "default": null}
        ]
      }
    },
    {
      "name": "context",
      "type": {
        "type": "map",
        "values": "string"
      },
      "default": {}
    },
    {
      "name": "oldValue",
      "type": ["null", "string"],
      "default": null,
      "doc": "JSON representation of old value"
    },
    {
      "name": "newValue",
      "type": ["null", "string"],
      "default": null,
      "doc": "JSON representation of new value"
    },
    {
      "name": "changes",
      "type": {
        "type": "array",
        "items": {
          "type": "record",
          "name": "Change",
          "fields": [
            {"name": "field", "type": "string"},
            {"name": "oldValue", "type": ["null", "string"], "default": null},
            {"name": "newValue", "type": ["null", "string"], "default": null}
          ]
        }
      },
      "default": []
    },
    {
      "name": "requestUri",
      "type": ["null", "string"],
      "default": null
    },
    {
      "name": "requestMethod",
      "type": ["null", "string"],
      "default": null
    },
    {
      "name": "correlationId",
      "type": ["null", "string"],
      "default": null
    }
  ]
}
```

### 5.3 Schema Compatibility Strategy

| Setting | Value | Description |
|---------|-------|-------------|
| **Compatibility Level** | BACKWARD | New schema can read old data |
| **Schema Evolution** | Supported | Add fields with defaults |
| **Field Removal** | Not allowed | Must deprecate first |
| **Field Type Change** | Not allowed | Add new field instead |

---

## 6. Producer/Consumer Patterns

### 6.1 Producer Configuration

```java
@Configuration
public class KafkaProducerConfig {

    @Bean
    public ProducerFactory<String, Object> producerFactory() {
        Map<String, Object> props = new HashMap<>();

        // Bootstrap servers
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, kafkaBootstrapServers);

        // Serializers
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG,
            KafkaAvroSerializer.class);

        // Schema Registry
        props.put("schema.registry.url", schemaRegistryUrl);

        // Reliability settings
        props.put(ProducerConfig.ACKS_CONFIG, "all");              // Wait for all replicas
        props.put(ProducerConfig.RETRIES_CONFIG, 3);               // Retry on failure
        props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true); // Idempotent producer
        props.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, 5);

        // Performance settings
        props.put(ProducerConfig.BATCH_SIZE_CONFIG, 16384);        // 16KB batch
        props.put(ProducerConfig.LINGER_MS_CONFIG, 10);            // 10ms linger
        props.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "lz4"); // Compression
        props.put(ProducerConfig.BUFFER_MEMORY_CONFIG, 33554432);  // 32MB buffer

        return new DefaultKafkaProducerFactory<>(props);
    }

    @Bean
    public KafkaTemplate<String, Object> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }
}
```

### 6.2 Event Publisher Service

```java
@Service
@Slf4j
public class EventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final MeterRegistry meterRegistry;

    public <T> CompletableFuture<SendResult<String, T>> publish(
            String topic,
            String key,
            T event) {

        // Add tenant context to event
        if (event instanceof TenantAwareEvent) {
            ((TenantAwareEvent) event).setTenantId(TenantContext.getCurrentTenant());
        }

        // Add correlation ID
        if (event instanceof CorrelatedEvent) {
            String correlationId = MDC.get("correlationId");
            if (correlationId == null) {
                correlationId = UUID.randomUUID().toString();
            }
            ((CorrelatedEvent) event).setCorrelationId(correlationId);
        }

        log.info("Publishing event to topic={}, key={}, type={}",
            topic, key, event.getClass().getSimpleName());

        // Create headers
        ProducerRecord<String, Object> record = new ProducerRecord<>(topic, key, event);
        record.headers()
            .add("tenantId", TenantContext.getCurrentTenant().getBytes())
            .add("correlationId", MDC.get("correlationId").getBytes())
            .add("eventTimestamp", String.valueOf(System.currentTimeMillis()).getBytes())
            .add("producer", "ulms-app".getBytes());

        return kafkaTemplate.send(record)
            .thenApply(result -> {
                log.debug("Event published successfully: topic={}, partition={}, offset={}",
                    result.getRecordMetadata().topic(),
                    result.getRecordMetadata().partition(),
                    result.getRecordMetadata().offset());

                // Metrics
                meterRegistry.counter("kafka.events.published",
                    "topic", topic,
                    "tenant", TenantContext.getCurrentTenant()
                ).increment();

                return result;
            })
            .exceptionally(ex -> {
                log.error("Failed to publish event: topic={}, key={}", topic, key, ex);

                meterRegistry.counter("kafka.events.failed",
                    "topic", topic,
                    "tenant", TenantContext.getCurrentTenant()
                ).increment();

                throw new EventPublishException("Failed to publish event", ex);
            });
    }
}
```

### 6.3 Consumer Configuration

```java
@Configuration
@EnableKafka
public class KafkaConsumerConfig {

    @Bean
    public ConsumerFactory<String, Object> consumerFactory() {
        Map<String, Object> props = new HashMap<>();

        // Bootstrap servers
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, kafkaBootstrapServers);

        // Deserializers
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG,
            KafkaAvroDeserializer.class);

        // Schema Registry
        props.put("schema.registry.url", schemaRegistryUrl);
        props.put("specific.avro.reader", true);

        // Consumer settings
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);  // Manual commit
        props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 100);
        props.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, 300000); // 5 min
        props.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, 30000);    // 30 sec
        props.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, 10000); // 10 sec

        // Isolation level for transactions
        props.put(ConsumerConfig.ISOLATION_LEVEL_CONFIG, "read_committed");

        return new DefaultKafkaConsumerFactory<>(props);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, Object>
            kafkaListenerContainerFactory() {

        ConcurrentKafkaListenerContainerFactory<String, Object> factory =
            new ConcurrentKafkaListenerContainerFactory<>();

        factory.setConsumerFactory(consumerFactory());
        factory.setConcurrency(3);  // 3 consumer threads
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL);
        factory.setCommonErrorHandler(kafkaErrorHandler());

        return factory;
    }

    @Bean
    public DefaultErrorHandler kafkaErrorHandler() {
        // Retry 3 times with exponential backoff
        ExponentialBackOff backOff = new ExponentialBackOff(1000, 2);
        backOff.setMaxElapsedTime(60000);  // Max 1 minute

        DefaultErrorHandler handler = new DefaultErrorHandler(
            new DeadLetterPublishingRecoverer(kafkaTemplate()),
            backOff
        );

        // Don't retry for these exceptions
        handler.addNotRetryableExceptions(
            SerializationException.class,
            ValidationException.class
        );

        return handler;
    }
}
```

### 6.4 Event Consumer Implementation

```java
@Service
@Slf4j
public class LoanApprovalEventConsumer {

    @KafkaListener(
        topics = "loan.approvals",
        groupId = "notification-service",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void handleLoanApprovalEvent(
            @Payload LoanApprovalEvent event,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset,
            Acknowledgment ack) {

        try {
            // Set tenant context from event
            TenantContext.setCurrentTenant(event.getTenantId());

            // Set correlation ID for tracing
            MDC.put("correlationId", event.getCorrelationId());
            MDC.put("eventId", event.getEventId());

            log.info("Processing loan approval event: eventId={}, type={}, loanId={}",
                event.getEventId(),
                event.getEventType(),
                event.getLoanId());

            // Process based on event type
            switch (event.getEventType()) {
                case FINAL_APPROVED:
                    sendApprovalNotification(event);
                    break;
                case REJECTED:
                    sendRejectionNotification(event);
                    break;
                case RETURNED_FOR_REVISION:
                    sendRevisionRequestNotification(event);
                    break;
                default:
                    log.debug("Ignoring event type: {}", event.getEventType());
            }

            // Acknowledge successful processing
            ack.acknowledge();

            log.info("Successfully processed event: eventId={}", event.getEventId());

        } catch (Exception e) {
            log.error("Error processing loan approval event: eventId={}",
                event.getEventId(), e);

            // Don't acknowledge - will be retried or sent to DLQ
            throw e;

        } finally {
            TenantContext.clear();
            MDC.clear();
        }
    }
}
```

### 6.5 Consumer Groups

| Consumer Group | Topics | Purpose | Instances |
|---------------|--------|---------|-----------|
| `notification-service` | loan.approvals, loan.payments, loan.classifications | Send notifications | 2-4 |
| `analytics-service` | loan.*, audit.events | Dashboard updates | 2-4 |
| `integration-gateway` | loan.approvals, loan.disbursements | CBS sync | 2-4 |
| `brpd-service` | loan.payments, loan.classifications | Compliance tracking | 2 |
| `elk-ingestion` | audit.events | Log aggregation | 3 |

---

## 7. Event Sourcing Implementation

### 7.1 Event Store Pattern

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         EVENT SOURCING PATTERN                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                        Loan Aggregate                                        │   │
│  │                                                                              │   │
│  │  Current State:                      Event History (Kafka):                  │   │
│  │  ┌─────────────────────┐            ┌─────────────────────────────────────┐ │   │
│  │  │ LoanAccount {       │            │ 1. LoanApplicationCreated (t0)      │ │   │
│  │  │   id: 123           │    ◄────── │ 2. LoanApplicationSubmitted (t1)    │ │   │
│  │  │   status: DISBURSED │  Rebuild   │ 3. LoanApprovedLevel1 (t2)          │ │   │
│  │  │   amount: 500000    │    from    │ 4. LoanApprovedLevel2 (t3)          │ │   │
│  │  │   dpd: 0            │   events   │ 5. LoanFinalApproved (t4)           │ │   │
│  │  │   ...               │            │ 6. DisbursementCompleted (t5)       │ │   │
│  │  │ }                   │            │ 7. EMIPaymentReceived (t6)          │ │   │
│  │  └─────────────────────┘            └─────────────────────────────────────┘ │   │
│  │                                                                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  Benefits:                                                                          │
│  • Complete audit trail (compliance requirement)                                    │
│  • Ability to replay events                                                         │
│  • Point-in-time state reconstruction                                               │
│  • Debugging and forensics                                                          │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Event Replay Service

```java
@Service
@Slf4j
public class EventReplayService {

    private final KafkaConsumer<String, Object> replayConsumer;
    private final LoanAggregateRepository aggregateRepository;

    /**
     * Rebuild loan aggregate state from events
     */
    public LoanAggregate rebuildLoanState(Long loanId, Instant asOfTime) {
        log.info("Rebuilding loan state: loanId={}, asOfTime={}", loanId, asOfTime);

        // Create new consumer for replay
        Properties props = createReplayConsumerProps();
        try (KafkaConsumer<String, Object> consumer = new KafkaConsumer<>(props)) {

            // Subscribe to loan topics
            consumer.subscribe(Arrays.asList(
                "loan.applications",
                "loan.approvals",
                "loan.disbursements",
                "loan.payments"
            ));

            // Seek to beginning
            consumer.poll(Duration.ofMillis(100));
            consumer.seekToBeginning(consumer.assignment());

            // Initialize aggregate
            LoanAggregate aggregate = new LoanAggregate(loanId);

            // Replay events
            while (true) {
                ConsumerRecords<String, Object> records = consumer.poll(Duration.ofSeconds(5));

                if (records.isEmpty()) {
                    break;  // No more records
                }

                for (ConsumerRecord<String, Object> record : records) {
                    // Filter by loan ID
                    if (!record.key().equals(String.valueOf(loanId))) {
                        continue;
                    }

                    // Check timestamp
                    if (record.timestamp() > asOfTime.toEpochMilli()) {
                        break;  // Stop at asOfTime
                    }

                    // Apply event to aggregate
                    aggregate.apply(record.value());
                }
            }

            log.info("Rebuilt loan state: loanId={}, finalState={}",
                loanId, aggregate.getStatus());

            return aggregate;
        }
    }

    /**
     * Replay all events for a tenant (disaster recovery)
     */
    public void replayTenantEvents(String tenantId, Instant fromTime) {
        log.warn("Starting tenant event replay: tenantId={}, fromTime={}",
            tenantId, fromTime);

        // This would be used for disaster recovery or data migration
        // Implementation similar to above but for all loans in a tenant
    }
}
```

---

## 8. SAGA Pattern for Distributed Transactions

### 8.1 SAGA Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    LOAN DISBURSEMENT SAGA (Choreography)                             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  Happy Path:                                                                         │
│                                                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐     │
│  │  Loan    │───▶│   CBS    │───▶│  Payment │───▶│ Document │───▶│ Notifica-│     │
│  │ Approved │    │ Account  │    │ Gateway  │    │ Service  │    │  tion    │     │
│  │          │    │ Created  │    │ Disbursed│    │ Updated  │    │  Sent    │     │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘     │
│       │               │               │               │               │             │
│       │               │               │               │               │             │
│       ▼               ▼               ▼               ▼               ▼             │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │                              Kafka Topics                                     │  │
│  │  loan.approvals → cbs.account.created → disbursement.completed → ...         │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  Compensation Path (if Payment Gateway fails):                                       │
│                                                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                                      │
│  │ Payment  │───▶│   CBS    │───▶│  Loan    │                                      │
│  │ Failed   │    │ Account  │    │ Status   │                                      │
│  │          │    │ Reversed │    │ Reverted │                                      │
│  └──────────┘    └──────────┘    └──────────┘                                      │
│       │               │               │                                             │
│       ▼               ▼               ▼                                             │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │                         Compensation Topics                                   │  │
│  │  disbursement.failed → cbs.account.reversal → loan.status.reverted           │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 SAGA Implementation

```java
@Service
@Slf4j
public class DisbursementSagaOrchestrator {

    @KafkaListener(topics = "loan.approvals", groupId = "disbursement-saga")
    public void handleLoanApproved(LoanApprovalEvent event) {
        if (event.getEventType() != LoanApprovalEventType.FINAL_APPROVED) {
            return;
        }

        log.info("Starting disbursement SAGA for loan: {}", event.getLoanId());

        // Step 1: Create CBS Account
        CBSAccountRequest accountRequest = buildAccountRequest(event);
        eventPublisher.publish("cbs.account.create", event.getLoanId(), accountRequest);
    }

    @KafkaListener(topics = "cbs.account.created", groupId = "disbursement-saga")
    public void handleAccountCreated(CBSAccountCreatedEvent event) {
        log.info("CBS account created for loan: {}, account: {}",
            event.getLoanId(), event.getAccountNumber());

        // Step 2: Initiate Disbursement
        DisbursementRequest request = buildDisbursementRequest(event);
        eventPublisher.publish("disbursement.initiate", event.getLoanId(), request);
    }

    @KafkaListener(topics = "disbursement.completed", groupId = "disbursement-saga")
    public void handleDisbursementCompleted(DisbursementCompletedEvent event) {
        log.info("Disbursement completed for loan: {}", event.getLoanId());

        // Step 3: Update loan status
        LoanStatusUpdateEvent statusEvent = LoanStatusUpdateEvent.builder()
            .loanId(event.getLoanId())
            .newStatus(LoanStatus.DISBURSED)
            .build();

        eventPublisher.publish("loan.status.updated", event.getLoanId(), statusEvent);

        // Step 4: Send notification
        NotificationEvent notification = NotificationEvent.builder()
            .customerId(event.getCustomerId())
            .type(NotificationType.LOAN_DISBURSED)
            .build();

        eventPublisher.publish("notifications", event.getCustomerId(), notification);
    }

    // Compensation handlers
    @KafkaListener(topics = "cbs.account.failed", groupId = "disbursement-saga")
    public void handleAccountCreationFailed(CBSAccountFailedEvent event) {
        log.error("CBS account creation failed for loan: {}. Reason: {}",
            event.getLoanId(), event.getErrorMessage());

        // Compensate: Revert loan status
        LoanStatusUpdateEvent compensation = LoanStatusUpdateEvent.builder()
            .loanId(event.getLoanId())
            .newStatus(LoanStatus.APPROVED_PENDING_DISBURSEMENT)
            .reason("CBS account creation failed")
            .build();

        eventPublisher.publish("loan.status.updated", event.getLoanId(), compensation);

        // Alert operations team
        alertService.sendCriticalAlert("CBS account creation failed", event);
    }

    @KafkaListener(topics = "disbursement.failed", groupId = "disbursement-saga")
    public void handleDisbursementFailed(DisbursementFailedEvent event) {
        log.error("Disbursement failed for loan: {}. Reason: {}",
            event.getLoanId(), event.getErrorMessage());

        // Compensate: Reverse CBS account
        CBSAccountReversalRequest reversal = CBSAccountReversalRequest.builder()
            .loanId(event.getLoanId())
            .accountNumber(event.getAccountNumber())
            .reason("Disbursement failed")
            .build();

        eventPublisher.publish("cbs.account.reversal", event.getLoanId(), reversal);

        // Revert loan status
        LoanStatusUpdateEvent compensation = LoanStatusUpdateEvent.builder()
            .loanId(event.getLoanId())
            .newStatus(LoanStatus.APPROVED_PENDING_DISBURSEMENT)
            .reason("Disbursement failed: " + event.getErrorMessage())
            .build();

        eventPublisher.publish("loan.status.updated", event.getLoanId(), compensation);
    }
}
```

---

## 9. Dead Letter Queue Strategy

### 9.1 DLQ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                       DEAD LETTER QUEUE STRATEGY                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  Normal Processing:                                                                  │
│                                                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                                      │
│  │ Producer │───▶│  Topic   │───▶│ Consumer │───▶ Success                          │
│  └──────────┘    └──────────┘    └──────────┘                                      │
│                                        │                                            │
│                                        │ Failure (after retries)                    │
│                                        ▼                                            │
│  ┌────────────────────────────────────────────────────────────────────────────────┐ │
│  │                           Dead Letter Queue                                     │ │
│  │                                                                                 │ │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │ DLQ Record:                                                               │ │ │
│  │  │ • Original topic: loan.approvals                                         │ │ │
│  │  │ • Original partition: 3                                                  │ │ │
│  │  │ • Original offset: 12345                                                 │ │ │
│  │  │ • Original key: 67890                                                    │ │ │
│  │  │ • Error message: "Connection timeout to CBS"                             │ │ │
│  │  │ • Retry count: 3                                                         │ │ │
│  │  │ • First failure timestamp: 2026-02-04T10:30:00Z                         │ │ │
│  │  │ • Last failure timestamp: 2026-02-04T10:35:00Z                          │ │ │
│  │  │ • Original payload: { ... }                                              │ │ │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                 │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
│                                        │                                            │
│                                        ▼                                            │
│  ┌────────────────────────────────────────────────────────────────────────────────┐ │
│  │                          DLQ Processing Options                                 │ │
│  │                                                                                 │ │
│  │  1. Manual Inspection     - Operations reviews failed events                   │ │
│  │  2. Automatic Retry       - Scheduled job retries after cooldown               │ │
│  │  3. Skip & Alert          - Skip event, alert for investigation                │ │
│  │  4. Manual Reprocessing   - Admin triggers reprocessing via UI                 │ │
│  │                                                                                 │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 DLQ Consumer

```java
@Service
@Slf4j
public class DeadLetterQueueProcessor {

    @Scheduled(fixedDelay = 300000)  // Every 5 minutes
    public void processDLQEvents() {
        log.info("Starting DLQ processing");

        // Process each DLQ topic
        processTopicDLQ("dlq.loan.applications");
        processTopicDLQ("dlq.cbs.failed");
        processTopicDLQ("dlq.notifications");
    }

    private void processTopicDLQ(String dlqTopic) {
        try (KafkaConsumer<String, DeadLetterEvent> consumer = createDLQConsumer(dlqTopic)) {
            ConsumerRecords<String, DeadLetterEvent> records = consumer.poll(Duration.ofSeconds(30));

            for (ConsumerRecord<String, DeadLetterEvent> record : records) {
                DeadLetterEvent dlqEvent = record.value();

                try {
                    // Check if enough time has passed for retry
                    if (shouldRetry(dlqEvent)) {
                        retryEvent(dlqEvent);
                        consumer.commitSync();
                    } else if (shouldAlert(dlqEvent)) {
                        alertOperations(dlqEvent);
                    }
                } catch (Exception e) {
                    log.error("Error processing DLQ event: {}", dlqEvent.getEventId(), e);
                }
            }
        }
    }

    private boolean shouldRetry(DeadLetterEvent event) {
        // Retry if:
        // 1. Less than max retries
        // 2. Enough cooldown time has passed
        // 3. Error is transient (not permanent failure)
        return event.getRetryCount() < MAX_RETRIES
            && event.getLastFailureTime().plus(RETRY_COOLDOWN).isBefore(Instant.now())
            && isTransientError(event.getErrorMessage());
    }

    private void retryEvent(DeadLetterEvent event) {
        log.info("Retrying DLQ event: eventId={}, originalTopic={}",
            event.getEventId(), event.getOriginalTopic());

        // Republish to original topic
        eventPublisher.publish(
            event.getOriginalTopic(),
            event.getOriginalKey(),
            event.getOriginalPayload()
        );

        // Update retry count
        event.setRetryCount(event.getRetryCount() + 1);
    }
}
```

---

## 10. Event Flow Diagrams

### 10.1 Loan Application to Disbursement Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│               LOAN APPLICATION TO DISBURSEMENT EVENT FLOW                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  Customer                                                                            │
│     │                                                                                │
│     │ 1. Submit application                                                          │
│     ▼                                                                                │
│  ┌──────────┐  LoanApplicationCreated                                               │
│  │   LOS    │────────────────────────────────────────────────────────────────────┐  │
│  │  Module  │                                                                    │  │
│  └────┬─────┘                                                                    │  │
│       │                                                                          │  │
│       │ 2. CIB/NID verification                                                  │  │
│       ▼                                                                          │  │
│  ┌──────────┐  LoanApplicationSubmitted                                          │  │
│  │ Credit   │────────────────────────────────────────────────────────────────┐   │  │
│  │ Service  │                                                                │   │  │
│  └────┬─────┘                                                                │   │  │
│       │                                                                      │   │  │
│       │ 3. Start approval workflow                                           │   │  │
│       ▼                                                                      │   │  │
│  ┌──────────┐  LoanApprovalRequested                                         │   │  │
│  │ Workflow │────────────────────────────────────────────────────────────┐   │   │  │
│  │ Service  │                                                            │   │   │  │
│  └────┬─────┘                                                            │   │   │  │
│       │                                                                  │   │   │  │
│       │ 4. Multi-level approval (L1→L7)                                  │   │   │  │
│       │    LoanApprovedLevel1, LoanApprovedLevel2, ...                   │   │   │  │
│       ▼                                                                  │   │   │  │
│  ┌──────────┐  LoanFinalApproved                                         │   │   │  │
│  │ Approval │────────────────────────────────────────────────────────┐   │   │   │  │
│  │ Complete │                                                        │   │   │   │  │
│  └────┬─────┘                                                        │   │   │   │  │
│       │                                                              │   │   │   │  │
│       │ 5. Create CBS account                                        │   │   │   │  │
│       ▼                                                              │   │   │   │  │
│  ┌──────────┐  CBSAccountCreated                                     │   │   │   │  │
│  │ Integra- │────────────────────────────────────────────────────┐   │   │   │   │  │
│  │  tion    │                                                    │   │   │   │   │  │
│  └────┬─────┘                                                    │   │   │   │   │  │
│       │                                                          │   │   │   │   │  │
│       │ 6. Disburse funds                                        │   │   │   │   │  │
│       ▼                                                          │   │   │   │   │  │
│  ┌──────────┐  DisbursementCompleted                             │   │   │   │   │  │
│  │ Payment  │────────────────────────────────────────────────┐   │   │   │   │   │  │
│  │ Gateway  │                                                │   │   │   │   │   │  │
│  └────┬─────┘                                                │   │   │   │   │   │  │
│       │                                                      │   │   │   │   │   │  │
│       │ 7. Send notification                                 │   │   │   │   │   │  │
│       ▼                                                      ▼   ▼   ▼   ▼   ▼   │  │
│  ┌──────────┐                                          ┌─────────────────────────┐  │
│  │ Notific- │                                          │      Kafka Topics       │  │
│  │  ation   │                                          │                         │  │
│  │ Service  │                                          │  • loan.applications    │  │
│  └──────────┘                                          │  • loan.approvals       │  │
│                                                        │  • loan.disbursements   │  │
│  ──────────────────────────────────────────────────── │  • notifications        │  │
│   All events stored for 7+ years (compliance)         │  • audit.events         │  │
│                                                        └─────────────────────────┘  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 EMI Payment and Classification Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│               EMI PAYMENT AND CLASSIFICATION EVENT FLOW                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌──────────┐  1. EMI Payment                                                       │
│  │ Fineract │──────────────────────────────────────────────────────────────────────┐│
│  │   Core   │  EMIPaymentReceived                                                  ││
│  └────┬─────┘                                                                      ││
│       │                                                                            ││
│       │ 2. Update loan status                                                      ││
│       ▼                                                                            ││
│  ┌──────────┐                                                                      ││
│  │  Loan    │                                                                      ││
│  │ Servicing│                                                                      ││
│  └────┬─────┘                                                                      ││
│       │                                                                            ││
│       │ 3. Check classification (daily batch)                                      ││
│       ▼                                                                            ││
│  ┌──────────┐  LoanClassificationChanged (if DPD changed)                          ││
│  │  BRPD    │──────────────────────────────────────────────────────────────────┐   ││
│  │ Service  │                                                                  │   ││
│  └────┬─────┘                                                                  │   ││
│       │                                                                        │   ││
│       ├── 4a. If upgraded (DPD decreased)                                     │   ││
│       │        LoanUpgraded                                                   │   ││
│       │                                                                        │   ││
│       ├── 4b. If downgraded (DPD increased)                                   │   ││
│       │        LoanDowngraded                                                 │   ││
│       │                                                                        │   ││
│       └── 4c. If NPA (DPD > 90)                                               │   ││
│                LoanEnteredNPA                                                  │   ││
│                                                                                │   ││
│       │                                                                        │   ││
│       │ 5. Post provision GL entries                                          │   ││
│       ▼                                                                        │   ││
│  ┌──────────┐  ProvisionCalculated                                             │   ││
│  │Accounting│──────────────────────────────────────────────────────────────┐   │   ││
│  │ Module   │                                                              │   │   ││
│  └────┬─────┘                                                              │   │   ││
│       │                                                                    │   │   ││
│       │ 6. Notify customer (if classification changed)                     │   │   ││
│       ▼                                                                    │   │   ││
│  ┌──────────┐                                                              │   │   ││
│  │ Notific- │                                                              │   │   ││
│  │  ation   │                                                              │   │   ││
│  └──────────┘                                                              │   │   ││
│                                                                            │   │   ││
│       │ 7. Update analytics/dashboards                                     │   │   ││
│       ▼                                                                    ▼   ▼   ▼│
│  ┌──────────┐                                               ┌──────────────────────┐│
│  │Analytics │                                               │    Kafka Topics      ││
│  │ Service  │                                               │                      ││
│  └──────────┘                                               │  • loan.payments     ││
│                                                             │  • loan.classifica-  ││
│  ──────────────────────────────────────────────────────────│    tions             ││
│   Compliance: All events retained for audit                 │  • audit.events      ││
│                                                             └──────────────────────┘│
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Monitoring & Alerting

### 11.1 Kafka Metrics Dashboard

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `kafka_consumer_lag` | Consumer lag per partition | > 10,000 |
| `kafka_messages_in_per_sec` | Messages produced per second | N/A (monitoring) |
| `kafka_messages_out_per_sec` | Messages consumed per second | N/A (monitoring) |
| `kafka_request_latency_avg` | Average request latency | > 100ms |
| `kafka_under_replicated_partitions` | Under-replicated partitions | > 0 |
| `kafka_offline_partitions` | Offline partitions | > 0 (critical) |
| `kafka_isr_shrinks_per_sec` | ISR shrink rate | > 0 |
| `kafka_log_flush_time_ms_avg` | Log flush time | > 50ms |

### 11.2 Prometheus Alert Rules

```yaml
# kafka-alerts.yaml
groups:
- name: kafka
  rules:
  - alert: KafkaConsumerLag
    expr: kafka_consumer_lag > 10000
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High consumer lag on {{ $labels.topic }}"
      description: "Consumer group {{ $labels.group }} has lag > 10000 on topic {{ $labels.topic }}"

  - alert: KafkaUnderReplicatedPartitions
    expr: kafka_server_ReplicaManager_UnderReplicatedPartitions > 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Under-replicated partitions detected"
      description: "{{ $value }} partitions are under-replicated"

  - alert: KafkaOfflinePartitions
    expr: kafka_controller_KafkaController_OfflinePartitionsCount > 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Offline partitions detected"
      description: "{{ $value }} partitions are offline"

  - alert: KafkaDLQMessagesHigh
    expr: kafka_topic_partition_current_offset{topic=~"dlq.*"} > 100
    for: 15m
    labels:
      severity: warning
    annotations:
      summary: "High number of messages in DLQ"
      description: "DLQ {{ $labels.topic }} has {{ $value }} messages"

  - alert: KafkaBrokerDown
    expr: up{job="kafka"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Kafka broker down"
      description: "Kafka broker {{ $labels.instance }} is down"
```

### 11.3 Grafana Dashboard Panels

| Panel | Metrics | Purpose |
|-------|---------|---------|
| Message Rate | `kafka_messages_in_per_sec` | Throughput monitoring |
| Consumer Lag | `kafka_consumer_lag` | Processing health |
| Error Rate | `kafka_request_error_rate` | Error detection |
| Broker Health | `kafka_broker_up` | Availability |
| Topic Size | `kafka_log_size_bytes` | Capacity planning |
| DLQ Depth | `kafka_topic_messages{topic=~"dlq.*"}` | Failed messages |

---

## 12. Compliance Considerations

### 12.1 Audit Trail Compliance

| Requirement | Implementation | Retention |
|-------------|---------------|-----------|
| **BRPD 15/2024** | All loan classification events | 7 years |
| **ICT Security V4.0** | All user actions | 10 years |
| **IFRS-9** | ECL calculation events | 7 years |
| **CIB Reporting** | All CIB inquiries | 5 years |

### 12.2 Data Immutability

| Control | Implementation |
|---------|---------------|
| **Append-only log** | Kafka log segments |
| **No deletion** | `log.cleanup.policy=delete` (time-based only) |
| **Replication** | 3 replicas minimum |
| **Checksum** | CRC32 verification |

### 12.3 Compliance Reporting

```java
@Service
public class ComplianceReportService {

    /**
     * Generate audit trail report for Bangladesh Bank
     */
    public ComplianceReport generateAuditTrail(
            String tenantId,
            LocalDate startDate,
            LocalDate endDate) {

        // Query audit.events topic for date range
        List<AuditEvent> events = queryAuditEvents(tenantId, startDate, endDate);

        return ComplianceReport.builder()
            .tenantId(tenantId)
            .reportPeriod(new DateRange(startDate, endDate))
            .totalEvents(events.size())
            .eventsByType(groupByType(events))
            .userActivitySummary(summarizeUserActivity(events))
            .securityEvents(filterSecurityEvents(events))
            .generatedAt(Instant.now())
            .build();
    }
}
```

---

## 13. Appendices

### Appendix A: Topic Naming Convention

| Pattern | Example | Description |
|---------|---------|-------------|
| `{domain}.{entity}` | `loan.applications` | Domain events |
| `{domain}.{entity}.{action}` | `cbs.account.create` | Integration commands |
| `dlq.{original-topic}` | `dlq.loan.applications` | Dead letter queue |
| `audit.events` | `audit.events` | Audit trail |

### Appendix B: Event Header Standards

| Header | Type | Purpose |
|--------|------|---------|
| `tenantId` | String | Tenant identifier |
| `correlationId` | String (UUID) | Request tracing |
| `eventTimestamp` | Long (epoch ms) | Event time |
| `producer` | String | Producer service name |
| `eventType` | String | Event type for routing |

### Appendix C: Schema Evolution Guidelines

| Change Type | Allowed | Action Required |
|-------------|---------|-----------------|
| Add field with default | ✅ Yes | Register new schema version |
| Add optional field | ✅ Yes | Register new schema version |
| Remove field | ❌ No | Deprecate first, remove in v2 |
| Change field type | ❌ No | Add new field instead |
| Rename field | ❌ No | Add new field, deprecate old |

### Appendix D: References

1. Apache Kafka Documentation - https://kafka.apache.org/documentation/
2. Confluent Schema Registry - https://docs.confluent.io/platform/current/schema-registry/
3. Apache Avro Specification - https://avro.apache.org/docs/current/spec.html
4. SAGA Pattern - https://microservices.io/patterns/data/saga.html
5. Event Sourcing - https://martinfowler.com/eaaDev/EventSourcing.html
6. ULMS BRD v1.0
7. ULMS SRS v2.0
8. ULMS Technology Stack v2.0
9. Bangladesh Bank ICT Security Guidelines V4.0

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

*This Event-Driven Architecture Design provides the complete specification for Apache Kafka event streaming in ULMS v2.0, ensuring loose coupling, audit compliance, and scalable asynchronous processing.*

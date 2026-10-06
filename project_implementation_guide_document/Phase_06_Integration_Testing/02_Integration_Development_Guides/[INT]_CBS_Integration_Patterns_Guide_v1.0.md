**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | CBS Integration Patterns Guide |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Technical Lead, Unisoft Systems Limited |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | Technical Lead | Initial version |

---

# CBS Integration Patterns Guide

## Table of Contents

1. [Introduction](#1-introduction)
2. [CBS Integration Overview](#2-cbs-integration-overview)
3. [Integration Patterns](#3-integration-patterns)
4. [SAGA Pattern Implementation](#4-saga-pattern-implementation)
5. [Event-Driven Integration](#5-event-driven-integration)
6. [API Gateway Pattern](#6-api-gateway-pattern)
7. [Data Synchronization](#7-data-synchronization)
8. [Error Handling and Recovery](#8-error-handling-and-recovery)
9. [Implementation Examples](#9-implementation-examples)
10. [Related Documents](#10-related-documents)

---

## 1. Introduction

### 1.1 Purpose

This document defines integration patterns for connecting ULMS v2.0 with Core Banking Systems (CBS) in Bangladesh banks. It covers synchronous and asynchronous patterns, transaction management, and data consistency strategies.

### 1.2 Scope

- Synchronous API integration patterns
- Asynchronous event-driven patterns
- SAGA pattern for distributed transactions
- Data synchronization strategies
- Error handling and recovery mechanisms

---

## 2. CBS Integration Overview

### 2.1 Typical CBS Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ULMS-CBS INTEGRATION ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         ULMS v2.0                                    │   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │   │
│   │  │  Loan    │  │  Payment │  │ Reporting│  │  Account │            │   │
│   │  │  Service │  │  Service │  │  Service │  │  Service │            │   │
│   │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘            │   │
│   │       └─────────────┴─────────────┴─────────────┘                  │   │
│   │                     │                                              │   │
│   │              ┌──────▼──────┐                                       │   │
│   │              │  API Gateway │                                      │   │
│   │              │   (Kong)     │                                      │   │
│   │              └──────┬──────┘                                       │   │
│   └─────────────────────┼──────────────────────────────────────────────┘   │
│                         │                                                  │
│   ┌─────────────────────┼──────────────────────────────────────────────┐   │
│   │                     ▼                                              │   │
│   │  ┌─────────────────────────────────────────────────────────────┐   │   │
│   │  │              INTEGRATION LAYER (Apache Camel)               │   │   │
│   │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │   │   │
│   │  │  │  Protocol   │  │   Message   │  │   Transformation    │ │   │   │
│   │  │  │  Adapter    │  │   Router    │  │     Engine          │ │   │   │
│   │  │  │ (REST/SOAP) │  │  (Kafka)    │  │  (Data Mapper)      │ │   │   │
│   │  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │   │   │
│   │  └─────────────────────────────────────────────────────────────┘   │   │
│   │                     │                                              │   │
│   │       ┌─────────────┼─────────────┐                                │   │
│   │       ▼             ▼             ▼                                │   │
│   │  ┌─────────┐  ┌─────────┐  ┌─────────┐                           │   │
│   │  │   ORACLE │  │  Finacle│  │  T24    │  ← Core Banking Systems │   │
│   │  │  FLEXCUBE│  │         │  │         │                           │   │
│   │  └─────────┘  └─────────┘  └─────────┘                           │   │
│   │                                                                    │   │
│   └────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Integration Points

| Integration Point | Direction | Protocol | Frequency |
|-------------------|-----------|----------|-----------|
| Account Inquiry | ULMS → CBS | REST/SOAP | Real-time |
| Loan Disbursement | ULMS → CBS | REST/SOAP | Real-time |
| Repayment Posting | ULMS → CBS | REST/SOAP | Real-time |
| GL Posting | ULMS → CBS | REST/SOAP | Real-time |
| Transaction Status | ULMS → CBS | REST/SOAP | Real-time |
| Account Updates | CBS → ULMS | Kafka | Event-driven |
| Balance Updates | CBS → ULMS | Kafka | Event-driven |

---

## 3. Integration Patterns

### 3.1 Pattern Selection Matrix

| Scenario | Recommended Pattern | Reason |
|----------|---------------------|--------|
| Loan Disbursement | SAGA + Outbox | ACID properties required |
| Account Inquiry | API Gateway + Cache | High read frequency |
| Repayment | Event-driven + Idempotency | High volume, async processing |
| Data Sync | CDC + Event Streaming | Real-time consistency |
| Report Generation | Batch + API | Large data sets |

### 3.2 Pattern Comparison

| Pattern | Latency | Consistency | Complexity | Use Case |
|---------|---------|-------------|------------|----------|
| Synchronous API | Low | Strong | Low | Account inquiry |
| SAGA | Medium | Eventual | High | Multi-step transactions |
| Event-Driven | Low | Eventual | Medium | High volume updates |
| Batch | High | Eventual | Low | End-of-day processing |

---

## 4. SAGA Pattern Implementation

### 4.1 SAGA Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SAGA PATTERN - LOAN DISBURSEMENT                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Step 1: Create Loan Account                                                │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐                             │
│   │  START   │───▶│  Create  │───▶│  Account │                             │
│   │          │    │  Account │    │  Created │                             │
│   └──────────┘    └──────────┘    └────┬─────┘                             │
│                                        │                                     │
│   Step 2: Debit Loan GL                                                    │
│                                        ▼                                     │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐                             │
│   │  Compensate│◀──│  Debit   │◀───│  GL      │                             │
│   │  (if fail)│    │  Loan GL │    │  Debited │                             │
│   └──────────┘    └──────────┘    └────┬─────┘                             │
│                                        │                                     │
│   Step 3: Credit Borrower Account                                          │
│                                        ▼                                     │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐                             │
│   │  Compensate│◀──│  Credit  │◀───│  Funds   │                             │
│   │  (if fail)│    │  Account │    │  Credited│                             │
│   └──────────┘    └──────────┘    └────┬─────┘                             │
│                                        │                                     │
│   Step 4: Update Status                                                    │
│                                        ▼                                     │
│                                   ┌──────────┐                             │
│                                   │DISBURSED │                             │
│                                   │  COMPLETE│                             │
│                                   └──────────┘                             │
│                                                                              │
│   Compensation Flow:                                                         │
│   If Step 3 fails → Reverse Step 2 (Credit Loan GL)                          │
│   If Step 2 fails → Reverse Step 1 (Delete Account)                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 SAGA Implementation with Camunda

```java
/**
 * Loan Disbursement SAGA Orchestrator
 */
@Component
public class LoanDisbursementSaga {
    
    private final RuntimeService runtimeService;
    private final TaskService taskService;
    
    private static final String PROCESS_KEY = "loanDisbursementSaga";
    
    /**
     * Start loan disbursement saga
     */
    public String startDisbursementSaga(DisbursementRequest request) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("loanId", request.getLoanId());
        variables.put("accountNumber", request.getAccountNumber());
        variables.put("amount", request.getAmount());
        variables.put("currency", "BDT");
        variables.put("disbursementDate", LocalDateTime.now());
        variables.put("idempotencyKey", request.getIdempotencyKey());
        
        ProcessInstance instance = runtimeService
            .startProcessInstanceByKey(PROCESS_KEY, request.getLoanId(), variables);
        
        return instance.getId();
    }
    
    /**
     * Step 1: Create loan account
     */
    @ServiceTask(topic = "createLoanAccount")
    public static class CreateLoanAccountHandler {
        
        @Autowired
        private CBSService cbsService;
        
        @JobWorker(type = "createLoanAccount")
        public Map<String, Object> createAccount(JobClient client, ActivatedJob job) {
            Map<String, Object> vars = job.getVariablesAsMap();
            
            try {
                AccountCreationRequest request = AccountCreationRequest.builder()
                    .loanId((String) vars.get("loanId"))
                    .accountType("LOAN")
                    .currency((String) vars.get("currency"))
                    .build();
                
                AccountCreationResponse response = cbsService.createAccount(request);
                
                return Map.of(
                    "accountCreated", true,
                    "cbsAccountNumber", response.getAccountNumber(),
                    "glCode", response.getGlCode()
                );
                
            } catch (Exception e) {
                return Map.of(
                    "accountCreated", false,
                    "error", e.getMessage()
                );
            }
        }
    }
    
    /**
     * Step 2: Debit loan GL
     */
    @ServiceTask(topic = "debitLoanGL")
    public static class DebitLoanGLHandler {
        
        @Autowired
        private CBSService cbsService;
        
        @JobWorker(type = "debitLoanGL")
        public Map<String, Object> debitGL(JobClient client, ActivatedJob job) {
            Map<String, Object> vars = job.getVariablesAsMap();
            
            GLPostingRequest request = GLPostingRequest.builder()
                .glCode((String) vars.get("glCode"))
                .amount((BigDecimal) vars.get("amount"))
                .transactionType("LOAN_DISBURSEMENT")
                .reference((String) vars.get("loanId"))
                .narration("Loan disbursement - " + vars.get("loanId"))
                .build();
            
            GLPostingResponse response = cbsService.debitGL(request);
            
            return Map.of(
                "glPosted", response.isSuccess(),
                "transactionId", response.getTransactionId(),
                "glTransactionId", response.getGlTransactionId()
            );
        }
    }
    
    /**
     * Step 2 Compensation: Reverse GL posting
     */
    @ServiceTask(topic = "compensateGLPosting")
    public static class CompensateGLHandler {
        
        @Autowired
        private CBSService cbsService;
        
        @JobWorker(type = "compensateGLPosting")
        public Map<String, Object> compensate(JobClient client, ActivatedJob job) {
            Map<String, Object> vars = job.getVariablesAsMap();
            String glTransactionId = (String) vars.get("glTransactionId");
            
            cbsService.reverseGLTransaction(glTransactionId, "Disbursement failed");
            
            return Map.of("glCompensated", true);
        }
    }
    
    /**
     * Step 3: Credit borrower account
     */
    @ServiceTask(topic = "creditBorrowerAccount")
    public static class CreditAccountHandler {
        
        @Autowired
        private CBSService cbsService;
        
        @JobWorker(type = "creditBorrowerAccount")
        public Map<String, Object> creditAccount(JobClient client, ActivatedJob job) {
            Map<String, Object> vars = job.getVariablesAsMap();
            
            FundTransferRequest request = FundTransferRequest.builder()
                .fromAccount((String) vars.get("cbsAccountNumber"))
                .toAccount((String) vars.get("accountNumber"))
                .amount((BigDecimal) vars.get("amount"))
                .currency((String) vars.get("currency"))
                .reference((String) vars.get("loanId"))
                .narration("Loan disbursement")
                .idempotencyKey((String) vars.get("idempotencyKey"))
                .build();
            
            FundTransferResponse response = cbsService.transferFunds(request);
            
            return Map.of(
                "fundsTransferred", response.isSuccess(),
                "transferTransactionId", response.getTransactionId(),
                "cbsReference", response.getCbsReference()
            );
        }
    }
    
    /**
     * Step 3 Compensation: Reverse fund transfer
     */
    @ServiceTask(topic = "compensateFundTransfer")
    public static class CompensateTransferHandler {
        
        @Autowired
        private CBSService cbsService;
        
        @JobWorker(type = "compensateFundTransfer")
        public Map<String, Object> compensate(JobClient client, ActivatedJob job) {
            Map<String, Object> vars = job.getVariablesAsMap();
            String transactionId = (String) vars.get("transferTransactionId");
            
            cbsService.reverseTransaction(transactionId);
            
            return Map.of("transferCompensated", true);
        }
    }
}
```

### 4.3 BPMN Process Definition

```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:zeebe="http://camunda.org/schema/zeebe/1.0"
                  id="loanDisbursementSaga"
                  targetNamespace="http://ulms.unisoft.com/saga">

  <bpmn:process id="loanDisbursementSaga" isExecutable="true">
    
    <!-- Start Event -->
    <bpmn:startEvent id="start" name="Start Disbursement"/>
    
    <!-- Step 1: Create Account -->
    <bpmn:serviceTask id="createAccount" name="Create Loan Account">
      <bpmn:extensionElements>
        <zeebe:taskDefinition type="createLoanAccount" />
      </bpmn:extensionElements>
    </bpmn:serviceTask>
    
    <!-- Gateway: Check Account Creation -->
    <bpmn:exclusiveGateway id="accountCreatedGateway" name="Account Created?"/>
    
    <!-- Step 2: Debit GL -->
    <bpmn:serviceTask id="debitGL" name="Debit Loan GL">
      <bpmn:extensionElements>
        <zeebe:taskDefinition type="debitLoanGL" />
      </bpmn:extensionElements>
    </bpmn:serviceTask>
    
    <!-- Gateway: Check GL Posting -->
    <bpmn:exclusiveGateway id="glPostedGateway" name="GL Posted?"/>
    
    <!-- Step 3: Credit Account -->
    <bpmn:serviceTask id="creditAccount" name="Credit Borrower Account">
      <bpmn:extensionElements>
        <zeebe:taskDefinition type="creditBorrowerAccount" />
      </bpmn:extensionElements>
    </bpmn:serviceTask>
    
    <!-- Gateway: Check Transfer -->
    <bpmn:exclusiveGateway id="transferCompletedGateway" name="Transfer Complete?"/>
    
    <!-- Compensation: Reverse GL -->
    <bpmn:serviceTask id="compensateGL" name="Reverse GL Posting">
      <bpmn:extensionElements>
        <zeebe:taskDefinition type="compensateGLPosting" />
      </bpmn:extensionElements>
    </bpmn:serviceTask>
    
    <!-- Compensation: Reverse Transfer -->
    <bpmn:serviceTask id="compensateTransfer" name="Reverse Fund Transfer">
      <bpmn:extensionElements>
        <zeebe:taskDefinition type="compensateFundTransfer" />
      </bpmn:extensionElements>
    </bpmn:serviceTask>
    
    <!-- Success End -->
    <bpmn:endEvent id="success" name="Disbursement Complete">
      <bpmn:terminateEventDefinition/>
    </bpmn:endEvent>
    
    <!-- Failure End -->
    <bpmn:endEvent id="failure" name="Disbursement Failed">
      <bpmn:errorEventDefinition errorRef="disbursementError"/>
    </bpmn:endEvent>
    
    <!-- Sequence Flows -->
    <bpmn:sequenceFlow id="flow1" sourceRef="start" targetRef="createAccount"/>
    <bpmn:sequenceFlow id="flow2" sourceRef="createAccount" targetRef="accountCreatedGateway"/>
    <bpmn:sequenceFlow id="flow3" sourceRef="accountCreatedGateway" targetRef="debitGL">
      <bpmn:conditionExpression>=accountCreated</bpmn:conditionExpression>
    </bpmn:sequenceFlow>
    <bpmn:sequenceFlow id="flow4" sourceRef="debitGL" targetRef="glPostedGateway"/>
    <bpmn:sequenceFlow id="flow5" sourceRef="glPostedGateway" targetRef="creditAccount">
      <bpmn:conditionExpression>=glPosted</bpmn:conditionExpression>
    </bpmn:sequenceFlow>
    <bpmn:sequenceFlow id="flow6" sourceRef="creditAccount" targetRef="transferCompletedGateway"/>
    <bpmn:sequenceFlow id="flow7" sourceRef="transferCompletedGateway" targetRef="success">
      <bpmn:conditionExpression>=fundsTransferred</bpmn:conditionExpression>
    </bpmn:sequenceFlow>
    
    <!-- Compensation Flows -->
    <bpmn:sequenceFlow id="flow8" sourceRef="transferCompletedGateway" targetRef="compensateTransfer">
      <bpmn:conditionExpression>=!fundsTransferred</bpmn:conditionExpression>
    </bpmn:sequenceFlow>
    <bpmn:sequenceFlow id="flow9" sourceRef="compensateTransfer" targetRef="compensateGL"/>
    <bpmn:sequenceFlow id="flow10" sourceRef="compensateGL" targetRef="failure"/>
    <bpmn:sequenceFlow id="flow11" sourceRef="glPostedGateway" targetRef="compensateGL">
      <bpmn:conditionExpression>=!glPosted</bpmn:conditionExpression>
    </bpmn:sequenceFlow>
    
  </bpmn:process>
</bpmn:definitions>
```

---

## 5. Event-Driven Integration

### 5.1 Event Streaming Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EVENT-DRIVEN INTEGRATION PATTERN                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────────┐                                                       │
│   │     CBS          │                                                       │
│   │  (Source System) │                                                       │
│   └────────┬─────────┘                                                       │
│            │ Change Data Capture (CDC)                                       │
│            ▼                                                                 │
│   ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐   │
│   │  Debezium        │────▶│  Apache Kafka    │────▶│  ULMS Services   │   │
│   │  (CDC Connector) │     │  (Event Bus)     │     │  (Consumers)     │   │
│   └──────────────────┘     └──────────────────┘     └──────────────────┘   │
│                                   │                                          │
│                          ┌────────┼────────┐                                 │
│                          ▼        ▼        ▼                                 │
│                    ┌─────────┐ ┌─────────┐ ┌─────────┐                      │
│                    │ account │ │ balance │ │ txn-log │                      │
│                    │ events  │ │ events  │ │ events  │                      │
│                    └─────────┘ └─────────┘ └─────────┘                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Kafka Configuration

```java
@Configuration
public class CBSKafkaConfiguration {
    
    @Bean
    public ConsumerFactory<String, CBSEvent> cbsEventConsumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, kafkaServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "ulms-cbs-integration");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        props.put(JsonDeserializer.TRUSTED_PACKAGES, "com.unisoft.ulms.integration.cbs.events");
        
        return new DefaultKafkaConsumerFactory<>(props);
    }
    
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, CBSEvent> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, CBSEvent> factory = 
            new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(cbsEventConsumerFactory());
        factory.setConcurrency(3);
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL_IMMEDIATE);
        return factory;
    }
}
```

### 5.3 Event Consumer

```java
@Component
@Slf4j
public class CBSEventConsumer {
    
    @Autowired
    private AccountSyncService accountSyncService;
    
    @Autowired
    private BalanceUpdateService balanceUpdateService;
    
    @Autowired
    private TransactionLogService transactionLogService;
    
    /**
     * Process account events from CBS
     */
    @KafkaListener(topics = "cbs.account.events", groupId = "ulms-cbs-integration")
    public void handleAccountEvent(
            @Payload CBSEvent event,
            @Header("event-type") String eventType,
            Acknowledgment acknowledgment) {
        
        try {
            switch (eventType) {
                case "ACCOUNT_CREATED":
                    accountSyncService.syncAccount(event.getPayload());
                    break;
                case "ACCOUNT_UPDATED":
                    accountSyncService.updateAccount(event.getPayload());
                    break;
                case "ACCOUNT_CLOSED":
                    accountSyncService.closeAccount(event.getPayload());
                    break;
                default:
                    log.warn("Unknown account event type: {}", eventType);
            }
            
            acknowledgment.acknowledge();
            
        } catch (Exception e) {
            log.error("Failed to process account event: {}", event.getEventId(), e);
            // Don't acknowledge - will retry
            throw e;
        }
    }
    
    /**
     * Process balance update events
     */
    @KafkaListener(topics = "cbs.balance.events", groupId = "ulms-cbs-integration")
    public void handleBalanceEvent(@Payload BalanceEvent event, Acknowledgment ack) {
        balanceUpdateService.updateBalance(
            event.getAccountNumber(),
            event.getNewBalance(),
            event.getTimestamp()
        );
        ack.acknowledge();
    }
}
```

---

## 6. API Gateway Pattern

### 6.1 Kong Configuration

```yaml
# kong-cbs-integration.yml
services:
  - name: cbs-oracle
    url: https://cbs-oracle.bank.internal:8443
    routes:
      - name: cbs-oracle-route
        paths:
          - /api/cbs/oracle
    plugins:
      - name: rate-limiting
        config:
          minute: 1000
      - name: key-auth
      - name: request-transformer
        config:
          add:
            headers:
              - X-Source-System:ULMS
              
  - name: cbs-finacle
    url: https://cbs-finacle.bank.internal:8443
    routes:
      - name: cbs-finacle-route
        paths:
          - /api/cbs/finacle
    plugins:
      - name: rate-limiting
        config:
          minute: 1000
      - name: key-auth

consumers:
  - username: ulms-service
    keyauth_credentials:
      - key: ${CBS_API_KEY}
```

### 6.2 Dynamic Routing

```java
@Component
public class CBSRoutingService {
    
    @Autowired
    private BankConfigurationRepository bankConfigRepo;
    
    /**
     * Get CBS endpoint based on bank configuration
     */
    public CBSEndpoint getEndpoint(String bankCode) {
        BankConfiguration config = bankConfigRepo.findByBankCode(bankCode);
        
        return switch (config.getCbsType()) {
            case "ORACLE_FLEXCUBE" -> CBSEndpoint.builder()
                .baseUrl("/api/cbs/oracle")
                .protocol(CBSProtocol.REST)
                .version("12.0")
                .build();
                
            case "FINACLE" -> CBSEndpoint.builder()
                .baseUrl("/api/cbs/finacle")
                .protocol(CBSProtocol.SOAP)
                .version("10.5")
                .build();
                
            case "T24" -> CBSEndpoint.builder()
                .baseUrl("/api/cbs/t24")
                .protocol(CBSProtocol.REST)
                .version("R22")
                .build();
                
            default -> throw new UnsupportedCBSException("Unsupported CBS: " + config.getCbsType());
        };
    }
}
```

---

## 7. Data Synchronization

### 7.1 CDC Configuration

```yaml
# debezium-cbs-connector.json
{
  "name": "cbs-cdc-connector",
  "config": {
    "connector.class": "io.debezium.connector.oracle.OracleConnector",
    "database.hostname": "cbs-db.bank.internal",
    "database.port": "1521",
    "database.user": "dbz_user",
    "database.password": "${DBZ_PASSWORD}",
    "database.dbname": "CBSDB",
    "database.server.name": "cbs",
    "table.include.list": "CBS.ACCOUNTS,CBS.TRANSACTIONS,CBS.GL_ENTRIES",
    "snapshot.mode": "initial",
    "tombstones.on.delete": true,
    "decimal.handling.mode": "string",
    "transforms": "unwrap",
    "transforms.unwrap.type": "io.debezium.transforms.ExtractNewRecordState",
    "transforms.unwrap.drop.tombstones": false,
    "transforms.unwrap.delete.handling.mode": "rewrite",
    "key.converter": "org.apache.kafka.connect.json.JsonConverter",
    "key.converter.schemas.enable": false,
    "value.converter": "org.apache.kafka.connect.json.JsonConverter",
    "value.converter.schemas.enable": false
  }
}
```

---

## 8. Error Handling and Recovery

### 8.1 Retry Strategy

```java
@Component
public class CBSRetryStrategy {
    
    @Bean
    public RetryTemplate cbsRetryTemplate() {
        RetryTemplate template = new RetryTemplate();
        
        // Retry on specific exceptions
        SimpleRetryPolicy policy = new SimpleRetryPolicy(
            3,
            Map.of(
                CBSConnectionException.class, true,
                CBSTimeoutException.class, true,
                CBSTransientException.class, true,
                CBSValidationException.class, false
            )
        );
        
        // Exponential backoff
        ExponentialBackOffPolicy backOff = new ExponentialBackOffPolicy();
        backOff.setInitialInterval(1000);
        backOff.setMultiplier(2.0);
        backOff.setMaxInterval(10000);
        
        template.setRetryPolicy(policy);
        template.setBackOffPolicy(backOff);
        
        return template;
    }
}
```

### 8.2 Dead Letter Queue

```java
@Component
public class CBSDeadLetterHandler {
    
    @Autowired
    private KafkaTemplate<String, FailedRequest> dlqTemplate;
    
    /**
     * Handle failed CBS requests
     */
    public void handleFailedRequest(CBSRequest request, Exception error) {
        FailedRequest failed = FailedRequest.builder()
            .originalRequest(request)
            .errorMessage(error.getMessage())
            .errorType(error.getClass().getSimpleName())
            .timestamp(Instant.now())
            .retryCount(request.getRetryCount())
            .build();
        
        dlqTemplate.send("cbs.failed.requests", request.getId(), failed);
        
        // Alert if critical
        if (isCriticalError(error)) {
            alertService.sendAlert("CBS Integration Failure", failed);
        }
    }
    
    /**
     * Retry failed requests
     */
    @Scheduled(fixedDelay = 300000) // Every 5 minutes
    public void retryFailedRequests() {
        // Implementation for DLQ retry
    }
}
```

---

## 9. Implementation Examples

### 9.1 Complete Integration Service

```java
@Service
@Slf4j
public class CBSIntegrationService {
    
    @Autowired
    private CBSClient cbsClient;
    
    @Autowired
    private RetryTemplate retryTemplate;
    
    @Autowired
    private IdempotencyKeyService idempotencyService;
    
    /**
     * Post loan disbursement to CBS with full resilience
     */
    @Transactional
    public DisbursementResult postDisbursement(DisbursementRequest request) {
        // Check idempotency
        if (idempotencyService.isProcessed(request.getIdempotencyKey())) {
            return idempotencyService.getResult(request.getIdempotencyKey());
        }
        
        try {
            return retryTemplate.execute(context -> {
                log.info("Attempt {} to post disbursement for loan: {}",
                    context.getRetryCount() + 1, request.getLoanId());
                
                CBSResponse response = cbsClient.postDisbursement(request);
                
                DisbursementResult result = DisbursementResult.builder()
                    .success(response.isSuccess())
                    .cbsTransactionId(response.getTransactionId())
                    .cbsReference(response.getReference())
                    .timestamp(LocalDateTime.now())
                    .build();
                
                // Store for idempotency
                idempotencyService.store(request.getIdempotencyKey(), result);
                
                return result;
            });
            
        } catch (Exception e) {
            log.error("Failed to post disbursement after retries", e);
            throw new DisbursementFailedException("CBS posting failed", e);
        }
    }
}
```

---

## 10. Related Documents

| Document | Purpose |
|----------|---------|
| `[INT]_CIB_Online_API_Integration_Guide_v1.0.md` | CIB integration details |
| `[INT]_Payment_Gateway_Integration_Guide_v1.0.md` | Payment integration |
| `../Software_Requirements_Specification.md` | System requirements |

---

**Document Owner:** Technical Lead, Unisoft Systems Limited  
**Next Review Date:** 2026-03-05  
**Classification:** Internal

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

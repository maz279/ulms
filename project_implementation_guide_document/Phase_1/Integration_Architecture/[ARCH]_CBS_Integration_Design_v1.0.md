# CBS Integration Design
## Core Banking System Integration with SAGA Pattern
### Unisoft Loan Management System (ULMS) v2.0

---

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ULMS-ARCH-1.5.4 |
| **Document Title** | CBS Integration Design (Account, GL Posting, SAGA) |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 5, 2026 |
| **Prepared By** | Lead Developer |
| **Reviewed By** | Technical Architect, Solutions Architect |
| **Classification** | Confidential - Internal Use |
| **Status** | Approved for Implementation |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | Lead Dev | Initial CBS Integration Design Document |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [CBS Integration Strategy](#2-cbs-integration-strategy)
3. [Apache Camel CBS Routes](#3-apache-camel-cbs-routes)
4. [Integration Functions](#4-integration-functions)
5. [SAGA Pattern Implementation](#5-saga-pattern-implementation)
6. [Data Synchronization](#6-data-synchronization)
7. [Fineract-CBS Integration](#7-fineract-cbs-integration)
8. [GL Posting Design](#8-gl-posting-design)
9. [Error Handling & Compensation](#9-error-handling--compensation)
10. [Reconciliation Process](#10-reconciliation-process)
11. [Security & Authentication](#11-security--authentication)
12. [Monitoring & Alerting](#12-monitoring--alerting)
13. [Bank-Specific Adapters](#13-bank-specific-adapters)
14. [Data Model](#14-data-model)
15. [Implementation Guide](#15-implementation-guide)
16. [Appendices](#16-appendices)

---

## 1. Executive Summary

### 1.1 Purpose

This document defines the comprehensive integration design for Core Banking System (CBS) integration with ULMS v2.0. The design covers account creation, limit loading, GL posting, and distributed transaction management using the SAGA pattern via Apache Camel 4.3 integration framework.

### 1.2 Integration Objectives

| Objective | Target | Measurement |
|-----------|--------|-------------|
| **Real-time Sync Latency** | < 5 seconds | Message processing time |
| **Transaction Success Rate** | > 99.9% | Successful completions |
| **Data Consistency** | 100% | Reconciliation accuracy |
| **System Availability** | 99.9% | Integration uptime |
| **Compensation Success** | 100% | SAGA rollback success |

### 1.3 Integration Scope

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CBS INTEGRATION SCOPE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        IN SCOPE                                      │   │
│   ├─────────────────────────────────────────────────────────────────────┤   │
│   │  • Customer account creation in CBS                                  │   │
│   │  • Loan account creation and limit loading                          │   │
│   │  • GL posting (double-entry accounting)                             │   │
│   │  • Balance inquiry and account status                               │   │
│   │  • Account modification and closure                                  │   │
│   │  • SAGA pattern for distributed transactions                        │   │
│   │  • Real-time event synchronization                                   │   │
│   │  • Batch reconciliation                                              │   │
│   │  • Apache Fineract accounting module integration                    │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                       OUT OF SCOPE                                   │   │
│   ├─────────────────────────────────────────────────────────────────────┤   │
│   │  • CBS core replacement                                              │   │
│   │  • ATM/POS transaction integration                                   │   │
│   │  • International remittance processing                               │   │
│   │  • Trade finance (LC/BG) operations                                  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.4 Key Integration Functions

| Function | Direction | Protocol | Pattern |
|----------|-----------|----------|---------|
| **Customer Account Creation** | ULMS → CBS | REST/SOAP | Sync + SAGA |
| **Loan Account Creation** | ULMS → CBS | REST/SOAP | Sync + SAGA |
| **Limit Loading** | ULMS → CBS | REST/SOAP | Sync |
| **GL Posting** | ULMS → CBS | REST/SOAP | Async + SAGA |
| **Balance Inquiry** | CBS → ULMS | REST | Sync |
| **Account Status Update** | CBS → ULMS | Event/Webhook | Async |
| **Batch Reconciliation** | Bidirectional | File/SFTP | Batch |

---

## 2. CBS Integration Strategy

### 2.1 Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CBS INTEGRATION ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      ULMS APPLICATION LAYER                          │   │
│   │                                                                       │   │
│   │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │   │
│   │   │   Loan   │  │ Customer │  │   BRPD   │  │   Disbursement   │   │   │
│   │   │ Service  │  │ Service  │  │ Service  │  │    Service       │   │   │
│   │   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   │   │
│   │        │             │             │                  │             │   │
│   └────────│─────────────│─────────────│──────────────────│─────────────┘   │
│            │             │             │                  │                  │
│            ▼             ▼             ▼                  ▼                  │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    APACHE FINERACT 1.10                              │   │
│   │                                                                       │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │   │
│   │   │    Loan      │  │   Client     │  │      Accounting          │   │   │
│   │   │  Portfolio   │  │  Management  │  │       Engine             │   │   │
│   │   └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘   │   │
│   │          │                 │                       │                 │   │
│   └──────────│─────────────────│───────────────────────│─────────────────┘   │
│              │                 │                       │                     │
│              ▼                 ▼                       ▼                     │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │               INTEGRATION GATEWAY (Apache Camel 4.3)                 │   │
│   │                        Port 8088                                     │   │
│   │                                                                       │   │
│   │   ┌──────────────────────────────────────────────────────────────┐   │   │
│   │   │                    CAMEL ROUTES                               │   │   │
│   │   │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │   │   │
│   │   │  │ cbs-account    │  │ cbs-gl-posting │  │ cbs-balance    │  │   │   │
│   │   │  │ -creation      │  │ -route         │  │ -inquiry       │  │   │   │
│   │   │  └────────────────┘  └────────────────┘  └────────────────┘  │   │   │
│   │   │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │   │   │
│   │   │  │ cbs-limit      │  │ cbs-reconcile  │  │ saga-          │  │   │   │
│   │   │  │ -loading       │  │ -route         │  │ orchestrator   │  │   │   │
│   │   │  └────────────────┘  └────────────────┘  └────────────────┘  │   │   │
│   │   └──────────────────────────────────────────────────────────────┘   │   │
│   │                               │                                       │   │
│   │   ┌──────────────────────────────────────────────────────────────┐   │   │
│   │   │                 CBS ADAPTERS                                  │   │   │
│   │   │  ┌────────────┐  ┌────────────┐  ┌────────────┐              │   │   │
│   │   │  │  Temenos   │  │  Finacle   │  │  Flexcube  │  ...        │   │   │
│   │   │  │  Adapter   │  │  Adapter   │  │  Adapter   │              │   │   │
│   │   │  └────────────┘  └────────────┘  └────────────┘              │   │   │
│   │   └──────────────────────────────────────────────────────────────┘   │   │
│   │                               │                                       │   │
│   └───────────────────────────────│───────────────────────────────────────┘   │
│                                   │                                          │
│                          Protocol Translation                                │
│                                   │                                          │
│   ┌───────────────────────────────▼───────────────────────────────────────┐   │
│   │                     EXTERNAL CBS SYSTEMS                              │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐ │   │
│   │  │    Bank A    │  │    Bank B    │  │        Bank C               │ │   │
│   │  │  (Temenos)   │  │  (Finacle)   │  │      (Flexcube)             │ │   │
│   │  │   REST API   │  │   SOAP API   │  │     REST + MQ               │ │   │
│   │  └──────────────┘  └──────────────┘  └──────────────────────────────┘ │   │
│   └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Integration Patterns

| Pattern | Description | Use Case |
|---------|-------------|----------|
| **Synchronous Request-Reply** | Direct API call with immediate response | Balance inquiry, status check |
| **Asynchronous Fire-and-Forget** | Send message, don't wait for response | Notifications, logging |
| **Async with Callback** | Send message, receive response via callback | Long-running transactions |
| **SAGA Orchestration** | Coordinated multi-step transactions | Account + Limit + GL posting |
| **Event-Driven** | React to CBS events via webhooks | Account status changes |
| **Batch Processing** | Scheduled bulk operations | Daily reconciliation |

### 2.3 Integration Service Specification

| Parameter | Value | Notes |
|-----------|-------|-------|
| **Service Name** | integration-gateway | Kubernetes deployment |
| **Port** | 8088 | Service port |
| **Framework** | Spring Boot 3.2.1 + Apache Camel 4.3 | Java 21 |
| **Message Format** | JSON (REST), XML (SOAP) | Protocol-specific |
| **Transport** | HTTP/HTTPS, JMS, Kafka | Multi-protocol |
| **Database** | PostgreSQL 16 | SAGA state, audit |

---

## 3. Apache Camel CBS Routes

### 3.1 Route Configuration Overview

```java
// CbsIntegrationRouteBuilder.java
@Component
public class CbsIntegrationRouteBuilder extends RouteBuilder {

    @Override
    public void configure() throws Exception {

        // Global Error Handler
        errorHandler(deadLetterChannel("kafka:dlq.cbs.failed")
            .maximumRedeliveries(3)
            .redeliveryDelay(5000)
            .exponentialBackOff()
            .retryAttemptedLogLevel(LoggingLevel.WARN)
            .onRedelivery(exchange -> {
                log.warn("CBS route retry attempt: {}",
                    exchange.getIn().getHeader(Exchange.REDELIVERY_COUNTER));
            }));

        // Configure CBS routes
        configureAccountCreationRoute();
        configureLimitLoadingRoute();
        configureGlPostingRoute();
        configureBalanceInquiryRoute();
        configureReconciliationRoute();
        configureSagaOrchestratorRoute();
    }
}
```

### 3.2 Account Creation Route

```java
// Account Creation Camel Route
private void configureAccountCreationRoute() {

    // Loan Approved Event Consumer
    from("kafka:ulms.loan.approved?groupId=cbs-integration")
        .routeId("cbs-account-creation-route")
        .description("Create loan account in CBS after loan approval")

        // Validate incoming event
        .unmarshal().json(JsonLibrary.Jackson, LoanApprovedEvent.class)
        .validate(body().isNotNull())

        // Log event processing
        .log(LoggingLevel.INFO, "Processing loan approval for CBS: ${body.loanId}")

        // Enrich with customer data
        .enrich("direct:fetch-customer-data", new CustomerEnricher())

        // Determine CBS adapter based on bank config
        .process("cbsAdapterSelector")

        // Circuit Breaker for CBS call
        .circuitBreaker()
            .resilience4jConfiguration()
                .minimumNumberOfCalls(5)
                .failureRateThreshold(50)
                .waitDurationInOpenState(60)
            .end()

            // Transform to CBS-specific format
            .process("cbsRequestTransformer")

            // Route to appropriate CBS adapter
            .toD("direct:${header.cbsAdapterRoute}")

        .onFallback()
            .process("cbsFallbackProcessor")
            .to("kafka:ulms.cbs.pending-manual")
        .end()

        // Process CBS response
        .choice()
            .when(simple("${body.status} == 'SUCCESS'"))
                .log(LoggingLevel.INFO, "CBS account created: ${body.cbsAccountId}")
                .process("updateLoanWithCbsAccount")
                .to("kafka:ulms.cbs.account.created")
            .otherwise()
                .log(LoggingLevel.ERROR, "CBS account creation failed: ${body.error}")
                .to("kafka:ulms.cbs.account.failed")
        .end();

    // Temenos T24 Adapter Route
    from("direct:cbs-temenos-adapter")
        .routeId("cbs-temenos-adapter-route")
        .marshal().json()
        .setHeader("Content-Type", constant("application/json"))
        .setHeader("Authorization", method("temenosAuthProvider", "getAuthHeader"))
        .to("https4://{{cbs.temenos.url}}/api/v1/accounts"
            + "?bridgeEndpoint=true"
            + "&sslContextParameters=#cbsSslContext")
        .unmarshal().json(JsonLibrary.Jackson, TemenosResponse.class);

    // Finacle Adapter Route
    from("direct:cbs-finacle-adapter")
        .routeId("cbs-finacle-adapter-route")
        .marshal().jacksonXml()
        .setHeader("Content-Type", constant("text/xml"))
        .setHeader("SOAPAction", constant("createAccount"))
        .to("spring-ws:{{cbs.finacle.url}}/AccountService"
            + "?sslContextParameters=#cbsSslContext")
        .unmarshal().jacksonXml(FinacleResponse.class);
}
```

### 3.3 Limit Loading Route

```java
// Limit Loading Camel Route
private void configureLimitLoadingRoute() {

    from("kafka:ulms.loan.disbursement.approved?groupId=cbs-limit-loader")
        .routeId("cbs-limit-loading-route")
        .description("Load loan limit in CBS after disbursement approval")

        .unmarshal().json(JsonLibrary.Jackson, DisbursementApprovedEvent.class)

        .log(LoggingLevel.INFO, "Loading limit for loan: ${body.loanId}")

        // Validate CBS account exists
        .process("validateCbsAccountExists")

        // Transform to CBS limit request
        .process("limitLoadingTransformer")

        // Execute with retries
        .circuitBreaker()
            .resilience4jConfiguration()
                .minimumNumberOfCalls(5)
                .failureRateThreshold(50)
            .end()

            .toD("direct:${header.cbsAdapterRoute}-limit")

        .onFallback()
            .log(LoggingLevel.ERROR, "Limit loading fallback triggered")
            .to("kafka:ulms.cbs.limit.failed")
        .end()

        // Update ULMS with limit status
        .process("updateLoanLimitStatus")

        // Emit success event
        .to("kafka:ulms.cbs.limit.loaded");

    // Limit Loading for Temenos
    from("direct:cbs-temenos-adapter-limit")
        .routeId("cbs-temenos-limit-route")
        .setBody(simple("${body.temenosLimitRequest}"))
        .marshal().json()
        .to("https4://{{cbs.temenos.url}}/api/v1/limits"
            + "?bridgeEndpoint=true"
            + "&httpMethod=POST");
}
```

### 3.4 GL Posting Route

```java
// GL Posting Camel Route
private void configureGlPostingRoute() {

    from("direct:cbs-gl-posting")
        .routeId("cbs-gl-posting-route")
        .description("Post GL entries to CBS")

        // Validate GL entry
        .validate(body().method("isValid"))

        .log(LoggingLevel.INFO, "Posting GL entry: ${body.transactionRef}")

        // Ensure double-entry completeness
        .process("glEntryValidator")

        // Transform to CBS GL format
        .process("glPostingTransformer")

        // Execute GL posting
        .circuitBreaker()
            .toD("direct:${header.cbsAdapterRoute}-gl")
        .onFallback()
            .log(LoggingLevel.ERROR, "GL posting fallback")
            .to("kafka:dlq.cbs.gl.failed")
        .end()

        // Verify posting
        .process("verifyGlPosting")

        // Store posting confirmation
        .to("jpa:GlPostingLog");

    // Kafka consumer for batch GL postings
    from("kafka:ulms.gl.posting.requests?groupId=cbs-gl-batch")
        .routeId("cbs-gl-batch-route")
        .aggregate(header("batchId"), new GlEntryAggregator())
            .completionSize(100)
            .completionTimeout(30000)
        .split(body())
            .parallelProcessing()
            .executorService("glPostingExecutor")
            .to("direct:cbs-gl-posting")
        .end();
}
```

### 3.5 Balance Inquiry Route

```java
// Balance Inquiry Route
private void configureBalanceInquiryRoute() {

    from("direct:cbs-balance-inquiry")
        .routeId("cbs-balance-inquiry-route")
        .description("Query account balance from CBS")

        // Check cache first
        .setHeader("cacheKey", simple("balance:${body.accountNumber}"))
        .process("checkBalanceCache")

        .choice()
            .when(header("cacheHit").isEqualTo(true))
                .log(LoggingLevel.DEBUG, "Balance cache hit")
            .otherwise()
                // Call CBS for balance
                .process("cbsAdapterSelector")
                .toD("direct:${header.cbsAdapterRoute}-balance")
                // Cache the result (5 minutes TTL)
                .process("cacheBalanceResult")
        .end()

        .process("balanceResponseTransformer");

    // Temenos balance inquiry
    from("direct:cbs-temenos-adapter-balance")
        .routeId("cbs-temenos-balance-route")
        .setHeader("Content-Type", constant("application/json"))
        .setBody(simple("{\"accountId\": \"${body.cbsAccountId}\"}"))
        .to("https4://{{cbs.temenos.url}}/api/v1/accounts/${body.cbsAccountId}/balance"
            + "?bridgeEndpoint=true"
            + "&httpMethod=GET");
}
```

---

## 4. Integration Functions

### 4.1 Function Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CBS INTEGRATION FUNCTIONS                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    ACCOUNT OPERATIONS                                │   │
│   │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │   │
│   │  │ Customer Account │  │  Loan Account    │  │  Account Status  │   │   │
│   │  │   Creation       │  │   Creation       │  │   Management     │   │   │
│   │  │                  │  │                  │  │                  │   │   │
│   │  │ • Create CIF     │  │ • Create loan    │  │ • Activate       │   │   │
│   │  │ • Link to CBS    │  │ • Link to CIF    │  │ • Suspend        │   │   │
│   │  │ • Sync details   │  │ • Set product    │  │ • Close          │   │   │
│   │  └──────────────────┘  └──────────────────┘  └──────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    LIMIT OPERATIONS                                  │   │
│   │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │   │
│   │  │  Limit Loading   │  │ Limit Modification│  │ Limit Inquiry    │   │   │
│   │  │                  │  │                  │  │                  │   │   │
│   │  │ • Set limit      │  │ • Increase       │  │ • Available      │   │   │
│   │  │ • Set dates      │  │ • Decrease       │  │ • Utilized       │   │   │
│   │  │ • Set terms      │  │ • Extend         │  │ • Outstanding    │   │   │
│   │  └──────────────────┘  └──────────────────┘  └──────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    GL POSTING OPERATIONS                             │   │
│   │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │   │
│   │  │ Disbursement     │  │  Repayment       │  │  Provision       │   │   │
│   │  │   Posting        │  │   Posting        │  │   Posting        │   │   │
│   │  │                  │  │                  │  │                  │   │   │
│   │  │ • DR: Loan A/C   │  │ • DR: Cash/Bank  │  │ • DR: P&L Exp    │   │   │
│   │  │ • CR: Cash/Bank  │  │ • CR: Loan A/C   │  │ • CR: Provision  │   │   │
│   │  │                  │  │ • CR: Interest   │  │    Reserve       │   │   │
│   │  └──────────────────┘  └──────────────────┘  └──────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Customer Account Creation

```java
// CustomerAccountService.java
@Service
@Slf4j
public class CustomerAccountService {

    private final CbsIntegrationGateway cbsGateway;
    private final CustomerRepository customerRepository;
    private final SagaOrchestrator sagaOrchestrator;

    /**
     * Create customer account in CBS
     */
    @Transactional
    public CbsAccountResponse createCustomerAccount(
            Long customerId,
            String tenantId) {

        Customer customer = customerRepository.findById(customerId)
            .orElseThrow(() -> new CustomerNotFoundException(customerId));

        // Build CBS account request
        CbsAccountRequest request = CbsAccountRequest.builder()
            .customerId(customer.getCustomerCif())
            .customerName(customer.getFullname())
            .customerType(customer.getCustomerCategory())
            .idNumber(customer.getNidNumber())
            .idType("NID")
            .mobileNumber(customer.getMobilePrimary())
            .email(customer.getEmail())
            .branchCode(customer.getHomeBranchId())
            .productCode("LOAN_GENERAL")
            .currencyCode("BDT")
            .build();

        // Execute via CBS gateway
        CbsAccountResponse response = cbsGateway.createAccount(request, tenantId);

        if (response.isSuccess()) {
            // Update customer with CBS account ID
            customer.setCbsAccountId(response.getAccountId());
            customer.setCbsCustomerId(response.getCustomerId());
            customer.setCbsSyncStatus("SYNCED");
            customer.setCbsSyncedAt(LocalDateTime.now());
            customerRepository.save(customer);

            log.info("CBS account created for customer {}: {}",
                customerId, response.getAccountId());
        }

        return response;
    }
}
```

### 4.3 Loan Account Creation

```java
// LoanAccountService.java
@Service
@Slf4j
public class LoanAccountService {

    private final CbsIntegrationGateway cbsGateway;
    private final LoanRepository loanRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    /**
     * Create loan account in CBS after approval
     */
    @Transactional
    public CbsLoanAccountResponse createLoanAccount(
            Long loanId,
            String tenantId) {

        Loan loan = loanRepository.findById(loanId)
            .orElseThrow(() -> new LoanNotFoundException(loanId));

        // Validate loan is approved
        if (!loan.getStatus().equals(LoanStatus.APPROVED)) {
            throw new InvalidLoanStateException(
                "Loan must be approved before CBS account creation");
        }

        // Build CBS loan account request
        CbsLoanAccountRequest request = CbsLoanAccountRequest.builder()
            .customerCbsId(loan.getCustomer().getCbsCustomerId())
            .loanProductCode(mapToProductCode(loan.getLoanProductId()))
            .loanAmount(loan.getApprovedAmount())
            .interestRate(loan.getInterestRate())
            .tenure(loan.getTenure())
            .tenureUnit(loan.getTenureUnit().name())
            .repaymentFrequency(loan.getRepaymentFrequency().name())
            .firstRepaymentDate(loan.getFirstRepaymentDate())
            .maturityDate(loan.getMaturityDate())
            .branchCode(loan.getBranchCode())
            .currencyCode("BDT")
            .disbursementAccountId(loan.getDisbursementAccountId())
            .collateralDetails(mapCollaterals(loan.getCollaterals()))
            .build();

        // Execute CBS call
        CbsLoanAccountResponse response = cbsGateway
            .createLoanAccount(request, tenantId);

        if (response.isSuccess()) {
            // Update loan with CBS details
            loan.setCbsLoanAccountId(response.getLoanAccountId());
            loan.setCbsLoanReference(response.getLoanReference());
            loan.setCbsSyncStatus("SYNCED");
            loan.setCbsSyncedAt(LocalDateTime.now());
            loanRepository.save(loan);

            // Emit event
            kafkaTemplate.send("ulms.cbs.loan.account.created",
                LoanAccountCreatedEvent.builder()
                    .loanId(loanId)
                    .cbsLoanAccountId(response.getLoanAccountId())
                    .timestamp(LocalDateTime.now())
                    .build());

            log.info("CBS loan account created: {} for loan {}",
                response.getLoanAccountId(), loanId);
        }

        return response;
    }

    private String mapToProductCode(Long productId) {
        // Map ULMS product to CBS product code
        return loanProductRepository.findById(productId)
            .map(LoanProduct::getCbsProductCode)
            .orElseThrow(() -> new ProductNotFoundException(productId));
    }
}
```

### 4.4 Limit Loading

```java
// LimitLoadingService.java
@Service
@Slf4j
public class LimitLoadingService {

    private final CbsIntegrationGateway cbsGateway;
    private final LoanRepository loanRepository;

    /**
     * Load loan limit in CBS after disbursement approval
     */
    @Transactional
    public CbsLimitResponse loadLimit(Long loanId, String tenantId) {

        Loan loan = loanRepository.findById(loanId)
            .orElseThrow(() -> new LoanNotFoundException(loanId));

        // Validate CBS account exists
        if (loan.getCbsLoanAccountId() == null) {
            throw new CbsAccountNotFoundException(
                "CBS loan account not created for loan: " + loanId);
        }

        // Build limit loading request
        CbsLimitRequest request = CbsLimitRequest.builder()
            .loanAccountId(loan.getCbsLoanAccountId())
            .limitAmount(loan.getApprovedAmount())
            .limitStartDate(loan.getDisbursementDate())
            .limitExpiryDate(loan.getMaturityDate())
            .limitType("LOAN_LIMIT")
            .interestRate(loan.getInterestRate())
            .repaymentSchedule(generateRepaymentSchedule(loan))
            .build();

        // Execute CBS call
        CbsLimitResponse response = cbsGateway.loadLimit(request, tenantId);

        if (response.isSuccess()) {
            loan.setLimitLoadedInCbs(true);
            loan.setLimitLoadedAt(LocalDateTime.now());
            loan.setCbsLimitReference(response.getLimitReference());
            loanRepository.save(loan);

            log.info("CBS limit loaded for loan {}: {}",
                loanId, response.getLimitReference());
        }

        return response;
    }
}
```

---

## 5. SAGA Pattern Implementation

### 5.1 SAGA Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SAGA ORCHESTRATION PATTERN                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    SAGA ORCHESTRATOR                                 │   │
│   │                 (Choreography via Kafka Events)                      │   │
│   └───────────────────────────────┬─────────────────────────────────────┘   │
│                                   │                                          │
│                                   │                                          │
│   ┌───────────────────────────────▼─────────────────────────────────────┐   │
│   │                    LOAN DISBURSEMENT SAGA                            │   │
│   │                                                                       │   │
│   │   STEP 1              STEP 2              STEP 3              STEP 4 │   │
│   │   ┌─────────┐         ┌─────────┐         ┌─────────┐         ┌─────┐│   │
│   │   │ Create  │────────▶│  Load   │────────▶│   GL    │────────▶│Trans││   │
│   │   │ Account │         │  Limit  │         │ Posting │         │ fer ││   │
│   │   └────┬────┘         └────┬────┘         └────┬────┘         └──┬──┘│   │
│   │        │                   │                   │                  │   │   │
│   │        │ COMPENSATE        │ COMPENSATE        │ COMPENSATE      │   │   │
│   │        ▼                   ▼                   ▼                  │   │   │
│   │   ┌─────────┐         ┌─────────┐         ┌─────────┐            │   │   │
│   │   │ Close   │◀────────│ Unload  │◀────────│ Reverse │◀───────────┘   │   │
│   │   │ Account │         │  Limit  │         │   GL    │                │   │
│   │   └─────────┘         └─────────┘         └─────────┘                │   │
│   │                                                                       │   │
│   └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   SAGA STATE MACHINE:                                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                      │   │
│   │   PENDING ──▶ ACCOUNT_CREATED ──▶ LIMIT_LOADED ──▶ GL_POSTED        │   │
│   │      │              │                   │              │             │   │
│   │      │              ▼                   ▼              ▼             │   │
│   │      │         COMPENSATING ◀──── COMPENSATING ◀── COMPENSATING     │   │
│   │      │              │                   │              │             │   │
│   │      ▼              ▼                   ▼              ▼             │   │
│   │   FAILED ◀───── FAILED ◀──────── FAILED ◀─────── FAILED            │   │
│   │                                                                      │   │
│   │   ──▶ COMPLETED (All steps successful)                              │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 SAGA Orchestrator Implementation

```java
// SagaOrchestrator.java
@Service
@Slf4j
public class SagaOrchestrator {

    private final SagaStateRepository sagaStateRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final CustomerAccountService customerAccountService;
    private final LoanAccountService loanAccountService;
    private final LimitLoadingService limitLoadingService;
    private final GlPostingService glPostingService;

    /**
     * Start a new loan disbursement SAGA
     */
    @Transactional
    public SagaExecution startDisbursementSaga(
            Long loanId,
            String tenantId,
            String initiatedBy) {

        // Create SAGA execution record
        SagaExecution saga = SagaExecution.builder()
            .sagaId(UUID.randomUUID().toString())
            .sagaType(SagaType.LOAN_DISBURSEMENT)
            .entityId(loanId)
            .tenantId(tenantId)
            .status(SagaStatus.PENDING)
            .currentStep(0)
            .initiatedBy(initiatedBy)
            .initiatedAt(LocalDateTime.now())
            .build();

        saga = sagaStateRepository.save(saga);

        // Emit SAGA started event
        kafkaTemplate.send("ulms.saga.events",
            SagaStartedEvent.builder()
                .sagaId(saga.getSagaId())
                .sagaType(saga.getSagaType())
                .entityId(loanId)
                .build());

        // Execute first step
        executeNextStep(saga);

        return saga;
    }

    /**
     * Execute the next step in the SAGA
     */
    @Async
    public void executeNextStep(SagaExecution saga) {
        try {
            switch (saga.getCurrentStep()) {
                case 0:
                    executeStep1_CreateAccount(saga);
                    break;
                case 1:
                    executeStep2_LoadLimit(saga);
                    break;
                case 2:
                    executeStep3_GlPosting(saga);
                    break;
                case 3:
                    executeStep4_Transfer(saga);
                    break;
                default:
                    completeSaga(saga);
            }
        } catch (Exception e) {
            log.error("SAGA step {} failed for saga {}: {}",
                saga.getCurrentStep(), saga.getSagaId(), e.getMessage());
            startCompensation(saga, e);
        }
    }

    /**
     * Step 1: Create CBS Account
     */
    private void executeStep1_CreateAccount(SagaExecution saga) {
        log.info("SAGA {}: Executing Step 1 - Create Account", saga.getSagaId());

        updateSagaStatus(saga, SagaStatus.IN_PROGRESS, "Creating CBS account");

        CbsLoanAccountResponse response = loanAccountService
            .createLoanAccount(saga.getEntityId(), saga.getTenantId());

        if (response.isSuccess()) {
            // Store step result
            saga.setStepData("cbsAccountId", response.getLoanAccountId());
            saga.setCurrentStep(1);
            updateSagaStatus(saga, SagaStatus.IN_PROGRESS, "Account created");

            // Continue to next step
            executeNextStep(saga);
        } else {
            throw new SagaStepFailedException(
                "Account creation failed: " + response.getErrorMessage());
        }
    }

    /**
     * Step 2: Load Limit
     */
    private void executeStep2_LoadLimit(SagaExecution saga) {
        log.info("SAGA {}: Executing Step 2 - Load Limit", saga.getSagaId());

        updateSagaStatus(saga, SagaStatus.IN_PROGRESS, "Loading limit");

        CbsLimitResponse response = limitLoadingService
            .loadLimit(saga.getEntityId(), saga.getTenantId());

        if (response.isSuccess()) {
            saga.setStepData("limitReference", response.getLimitReference());
            saga.setCurrentStep(2);
            updateSagaStatus(saga, SagaStatus.IN_PROGRESS, "Limit loaded");

            executeNextStep(saga);
        } else {
            throw new SagaStepFailedException(
                "Limit loading failed: " + response.getErrorMessage());
        }
    }

    /**
     * Step 3: GL Posting
     */
    private void executeStep3_GlPosting(SagaExecution saga) {
        log.info("SAGA {}: Executing Step 3 - GL Posting", saga.getSagaId());

        updateSagaStatus(saga, SagaStatus.IN_PROGRESS, "Posting GL entries");

        GlPostingResponse response = glPostingService
            .postDisbursementEntries(saga.getEntityId(), saga.getTenantId());

        if (response.isSuccess()) {
            saga.setStepData("glTransactionRef", response.getTransactionRef());
            saga.setCurrentStep(3);
            updateSagaStatus(saga, SagaStatus.IN_PROGRESS, "GL posted");

            executeNextStep(saga);
        } else {
            throw new SagaStepFailedException(
                "GL posting failed: " + response.getErrorMessage());
        }
    }

    /**
     * Step 4: Transfer/Disbursement
     */
    private void executeStep4_Transfer(SagaExecution saga) {
        log.info("SAGA {}: Executing Step 4 - Transfer", saga.getSagaId());

        updateSagaStatus(saga, SagaStatus.IN_PROGRESS, "Transferring funds");

        // Transfer execution logic
        // ...

        saga.setCurrentStep(4);
        completeSaga(saga);
    }

    /**
     * Complete the SAGA successfully
     */
    private void completeSaga(SagaExecution saga) {
        saga.setStatus(SagaStatus.COMPLETED);
        saga.setCompletedAt(LocalDateTime.now());
        sagaStateRepository.save(saga);

        kafkaTemplate.send("ulms.saga.events",
            SagaCompletedEvent.builder()
                .sagaId(saga.getSagaId())
                .entityId(saga.getEntityId())
                .completedAt(LocalDateTime.now())
                .build());

        log.info("SAGA {} completed successfully", saga.getSagaId());
    }

    /**
     * Start compensation (rollback) process
     */
    private void startCompensation(SagaExecution saga, Exception error) {
        log.warn("Starting SAGA compensation for {}: {}",
            saga.getSagaId(), error.getMessage());

        saga.setStatus(SagaStatus.COMPENSATING);
        saga.setErrorMessage(error.getMessage());
        sagaStateRepository.save(saga);

        // Execute compensating transactions in reverse order
        compensateFromStep(saga, saga.getCurrentStep());
    }

    /**
     * Execute compensating transactions
     */
    private void compensateFromStep(SagaExecution saga, int failedStep) {
        try {
            for (int step = failedStep - 1; step >= 0; step--) {
                switch (step) {
                    case 2:
                        compensateGlPosting(saga);
                        break;
                    case 1:
                        compensateLimitLoading(saga);
                        break;
                    case 0:
                        compensateAccountCreation(saga);
                        break;
                }
            }

            saga.setStatus(SagaStatus.COMPENSATED);
            saga.setCompensatedAt(LocalDateTime.now());
            sagaStateRepository.save(saga);

            log.info("SAGA {} compensation completed", saga.getSagaId());

        } catch (Exception e) {
            log.error("SAGA compensation failed for {}: {}",
                saga.getSagaId(), e.getMessage());

            saga.setStatus(SagaStatus.COMPENSATION_FAILED);
            saga.setCompensationError(e.getMessage());
            sagaStateRepository.save(saga);

            // Alert for manual intervention
            kafkaTemplate.send("ulms.saga.compensation.failed",
                SagaCompensationFailedEvent.builder()
                    .sagaId(saga.getSagaId())
                    .error(e.getMessage())
                    .build());
        }
    }

    private void compensateGlPosting(SagaExecution saga) {
        String glRef = saga.getStepData("glTransactionRef");
        if (glRef != null) {
            glPostingService.reversePosting(glRef, saga.getTenantId());
            log.info("SAGA {}: GL posting reversed", saga.getSagaId());
        }
    }

    private void compensateLimitLoading(SagaExecution saga) {
        String limitRef = saga.getStepData("limitReference");
        if (limitRef != null) {
            limitLoadingService.unloadLimit(limitRef, saga.getTenantId());
            log.info("SAGA {}: Limit unloaded", saga.getSagaId());
        }
    }

    private void compensateAccountCreation(SagaExecution saga) {
        String accountId = saga.getStepData("cbsAccountId");
        if (accountId != null) {
            loanAccountService.closeLoanAccount(accountId, saga.getTenantId());
            log.info("SAGA {}: Account closed", saga.getSagaId());
        }
    }
}
```

### 5.3 SAGA Event Handling

```java
// SagaEventListener.java
@Component
@Slf4j
public class SagaEventListener {

    private final SagaOrchestrator sagaOrchestrator;
    private final SagaStateRepository sagaStateRepository;

    @KafkaListener(topics = "ulms.loan.disbursement.approved",
                   groupId = "saga-orchestrator")
    public void handleDisbursementApproved(DisbursementApprovedEvent event) {
        log.info("Received disbursement approval, starting SAGA for loan: {}",
            event.getLoanId());

        sagaOrchestrator.startDisbursementSaga(
            event.getLoanId(),
            event.getTenantId(),
            event.getApprovedBy()
        );
    }

    @KafkaListener(topics = "ulms.saga.step.completed",
                   groupId = "saga-orchestrator")
    public void handleStepCompleted(SagaStepCompletedEvent event) {
        SagaExecution saga = sagaStateRepository.findById(event.getSagaId())
            .orElseThrow(() -> new SagaNotFoundException(event.getSagaId()));

        sagaOrchestrator.executeNextStep(saga);
    }

    @KafkaListener(topics = "ulms.saga.compensation.required",
                   groupId = "saga-orchestrator")
    public void handleCompensationRequired(SagaCompensationRequiredEvent event) {
        log.warn("SAGA compensation required: {}", event.getSagaId());

        SagaExecution saga = sagaStateRepository.findById(event.getSagaId())
            .orElseThrow(() -> new SagaNotFoundException(event.getSagaId()));

        sagaOrchestrator.startCompensation(saga,
            new SagaStepFailedException(event.getReason()));
    }
}
```

---

## 6. Data Synchronization

### 6.1 Synchronization Modes

| Mode | Description | Frequency | Use Case |
|------|-------------|-----------|----------|
| **Real-time** | Immediate sync via events | Instant | Transactions, status |
| **Near Real-time** | Polling-based sync | 5 minutes | Balance updates |
| **Batch** | Scheduled bulk sync | Daily/Nightly | Reconciliation |
| **On-Demand** | Manual trigger | As needed | Data correction |

### 6.2 Real-time Sync Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REAL-TIME SYNCHRONIZATION                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ULMS                           KAFKA                           CBS         │
│   ┌──────────┐                ┌──────────┐                 ┌──────────┐     │
│   │  Loan    │   1. Event     │  Topic:  │   3. Consume    │   CBS    │     │
│   │ Service  │ ─────────────▶ │  ulms.   │ ─────────────▶  │ Adapter  │     │
│   │          │                │  loan.   │                 │          │     │
│   │          │                │ approved │                 │          │     │
│   └──────────┘                └──────────┘                 └────┬─────┘     │
│                                                                  │           │
│                                                          4. API Call        │
│                                                                  │           │
│                                                                  ▼           │
│                                                            ┌──────────┐     │
│                                                            │   CBS    │     │
│                                                            │  System  │     │
│                                                            └────┬─────┘     │
│                                                                  │           │
│                                                          5. Response        │
│                                                                  │           │
│   ┌──────────┐                ┌──────────┐                 ┌────▼─────┐     │
│   │   Loan   │   7. Consume   │  Topic:  │   6. Event      │   CBS    │     │
│   │ Service  │ ◀───────────── │  ulms.   │ ◀───────────── │ Adapter  │     │
│   │          │                │  cbs.    │                 │          │     │
│   │          │                │ synced   │                 │          │     │
│   └──────────┘                └──────────┘                 └──────────┘     │
│                                                                              │
│                                                                              │
│   Kafka Topics for Sync:                                                    │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  ulms.loan.approved           │  ULMS → CBS (Loan approved)         │   │
│   │  ulms.loan.disbursement       │  ULMS → CBS (Disbursement request)  │   │
│   │  ulms.cbs.account.created     │  CBS → ULMS (Account confirmation)  │   │
│   │  ulms.cbs.limit.loaded        │  CBS → ULMS (Limit confirmation)    │   │
│   │  ulms.cbs.transaction.posted  │  CBS → ULMS (GL confirmation)       │   │
│   │  ulms.cbs.sync.failed         │  Error events                       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Batch Reconciliation

```java
// BatchReconciliationService.java
@Service
@Slf4j
public class BatchReconciliationService {

    private final LoanRepository loanRepository;
    private final CbsIntegrationGateway cbsGateway;
    private final ReconciliationLogRepository reconciliationLogRepository;

    /**
     * Daily reconciliation between ULMS and CBS
     */
    @Scheduled(cron = "0 0 2 * * ?")  // 2 AM daily
    public void runDailyReconciliation() {
        log.info("Starting daily CBS reconciliation");

        LocalDate reconciliationDate = LocalDate.now().minusDays(1);

        List<Loan> ulmsLoans = loanRepository
            .findByDisbursementDateAndCbsSynced(reconciliationDate, true);

        ReconciliationReport report = ReconciliationReport.builder()
            .reconciliationDate(reconciliationDate)
            .startedAt(LocalDateTime.now())
            .build();

        int matched = 0;
        int mismatched = 0;
        List<ReconciliationDiscrepancy> discrepancies = new ArrayList<>();

        for (Loan loan : ulmsLoans) {
            try {
                // Fetch CBS record
                CbsLoanDetails cbsDetails = cbsGateway
                    .getLoanDetails(loan.getCbsLoanAccountId(), loan.getTenantId());

                // Compare records
                ReconciliationResult result = compareRecords(loan, cbsDetails);

                if (result.isMatch()) {
                    matched++;
                } else {
                    mismatched++;
                    discrepancies.add(result.getDiscrepancy());
                }

            } catch (Exception e) {
                log.error("Reconciliation failed for loan {}: {}",
                    loan.getId(), e.getMessage());
                discrepancies.add(ReconciliationDiscrepancy.builder()
                    .loanId(loan.getId())
                    .type(DiscrepancyType.CBS_ERROR)
                    .description(e.getMessage())
                    .build());
            }
        }

        // Save report
        report.setMatchedCount(matched);
        report.setMismatchedCount(mismatched);
        report.setDiscrepancies(discrepancies);
        report.setCompletedAt(LocalDateTime.now());

        reconciliationLogRepository.save(report);

        // Alert if discrepancies found
        if (mismatched > 0) {
            alertReconciliationDiscrepancies(report);
        }

        log.info("Daily reconciliation completed. Matched: {}, Mismatched: {}",
            matched, mismatched);
    }

    private ReconciliationResult compareRecords(
            Loan ulmsLoan,
            CbsLoanDetails cbsDetails) {

        List<String> differences = new ArrayList<>();

        // Compare loan amount
        if (!ulmsLoan.getDisbursedAmount().equals(cbsDetails.getDisbursedAmount())) {
            differences.add(String.format("Amount mismatch: ULMS=%s, CBS=%s",
                ulmsLoan.getDisbursedAmount(), cbsDetails.getDisbursedAmount()));
        }

        // Compare outstanding balance
        if (!ulmsLoan.getOutstandingBalance().equals(cbsDetails.getOutstandingBalance())) {
            differences.add(String.format("Balance mismatch: ULMS=%s, CBS=%s",
                ulmsLoan.getOutstandingBalance(), cbsDetails.getOutstandingBalance()));
        }

        // Compare status
        if (!mapCbsStatus(cbsDetails.getStatus()).equals(ulmsLoan.getStatus())) {
            differences.add(String.format("Status mismatch: ULMS=%s, CBS=%s",
                ulmsLoan.getStatus(), cbsDetails.getStatus()));
        }

        if (differences.isEmpty()) {
            return ReconciliationResult.match();
        }

        return ReconciliationResult.mismatch(
            ReconciliationDiscrepancy.builder()
                .loanId(ulmsLoan.getId())
                .cbsAccountId(cbsDetails.getAccountId())
                .type(DiscrepancyType.DATA_MISMATCH)
                .differences(differences)
                .build());
    }
}
```

---

## 7. Fineract-CBS Integration

### 7.1 Fineract as Intermediate Layer

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FINERACT-CBS INTEGRATION                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      ULMS APPLICATION                                │   │
│   │   (Loan Origination, Approval Workflow, Customer Management)         │   │
│   └────────────────────────────────────┬────────────────────────────────┘   │
│                                        │                                     │
│                                        ▼                                     │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    APACHE FINERACT 1.10                              │   │
│   │                                                                       │   │
│   │   ┌───────────────┐    ┌───────────────┐    ┌───────────────────┐   │   │
│   │   │ Loan Portfolio│    │   Accounting  │    │    Scheduler      │   │   │
│   │   │    Module     │    │    Module     │    │     Module        │   │   │
│   │   │               │    │               │    │                   │   │   │
│   │   │ • Loan CRUD   │    │ • GL Accounts │    │ • DPD Calc        │   │   │
│   │   │ • Schedule    │    │ • Journal     │    │ • Classification  │   │   │
│   │   │ • Repayment   │    │ • Posting     │    │ • Provision       │   │   │
│   │   └───────┬───────┘    └───────┬───────┘    └─────────┬─────────┘   │   │
│   │           │                    │                      │             │   │
│   └───────────│────────────────────│──────────────────────│─────────────┘   │
│               │                    │                      │                  │
│               │     Fineract Hooks / Events               │                  │
│               │                    │                      │                  │
│               ▼                    ▼                      ▼                  │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                  INTEGRATION GATEWAY (Camel)                         │   │
│   │                                                                       │   │
│   │   Fineract Event → Transform → CBS API Call → Response Handling     │   │
│   │                                                                       │   │
│   └────────────────────────────────────┬────────────────────────────────┘   │
│                                        │                                     │
│                                        ▼                                     │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      EXTERNAL CBS                                    │   │
│   │                (Bank's Core Banking System)                          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Fineract Hooks for CBS Integration

```java
// FineractCbsHookProcessor.java
@Service
@Slf4j
public class FineractCbsHookProcessor {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    /**
     * Process Fineract webhook events and trigger CBS sync
     */
    public void processHookEvent(FineractHookEvent event) {
        switch (event.getEntity()) {
            case "LOAN":
                processLoanEvent(event);
                break;
            case "CLIENT":
                processClientEvent(event);
                break;
            case "SAVINGSACCOUNT":
                processSavingsEvent(event);
                break;
            default:
                log.debug("Unhandled Fineract event: {}", event.getEntity());
        }
    }

    private void processLoanEvent(FineractHookEvent event) {
        switch (event.getAction()) {
            case "DISBURSE":
                // Trigger CBS limit loading
                kafkaTemplate.send("ulms.fineract.loan.disbursed",
                    FineractLoanDisbursedEvent.builder()
                        .loanId(event.getResourceId())
                        .tenantId(event.getTenantId())
                        .disbursedAmount(event.getData().get("disbursedAmount"))
                        .disbursedDate(event.getData().get("disbursedDate"))
                        .build());
                break;

            case "REPAYMENT":
                // Trigger CBS repayment posting
                kafkaTemplate.send("ulms.fineract.loan.repayment",
                    FineractRepaymentEvent.builder()
                        .loanId(event.getResourceId())
                        .tenantId(event.getTenantId())
                        .repaymentAmount(event.getData().get("amount"))
                        .principalPortion(event.getData().get("principalPortion"))
                        .interestPortion(event.getData().get("interestPortion"))
                        .build());
                break;

            case "WRITEOFF":
                // Trigger CBS write-off
                kafkaTemplate.send("ulms.fineract.loan.writeoff",
                    FineractWriteOffEvent.builder()
                        .loanId(event.getResourceId())
                        .tenantId(event.getTenantId())
                        .writeOffAmount(event.getData().get("amount"))
                        .build());
                break;
        }
    }
}
```

### 7.3 Fineract-CBS Account Mapping

```sql
-- Account mapping table for Fineract-CBS synchronization
CREATE TABLE fineract_cbs_account_mapping (
    id BIGSERIAL PRIMARY KEY,

    -- Fineract References
    fineract_loan_id BIGINT NOT NULL,
    fineract_client_id BIGINT NOT NULL,
    fineract_product_id BIGINT,

    -- CBS References
    cbs_customer_id VARCHAR(50) NOT NULL,
    cbs_loan_account_id VARCHAR(50) NOT NULL,
    cbs_liability_account VARCHAR(20),  -- GL account

    -- Mapping Details
    cbs_product_code VARCHAR(20),
    mapping_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    -- Sync Status
    last_sync_status VARCHAR(20),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    last_sync_error TEXT,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,

    -- Constraints
    CONSTRAINT uq_fineract_loan UNIQUE (fineract_loan_id),
    CONSTRAINT uq_cbs_loan_account UNIQUE (cbs_loan_account_id)
);

CREATE INDEX idx_fineract_cbs_mapping_cbs_account
    ON fineract_cbs_account_mapping(cbs_loan_account_id);

CREATE INDEX idx_fineract_cbs_mapping_status
    ON fineract_cbs_account_mapping(mapping_status);
```

---

## 8. GL Posting Design

### 8.1 Double-Entry Accounting Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    GL POSTING STRUCTURE                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   LOAN DISBURSEMENT GL ENTRY:                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  Transaction: DISBURSEMENT                                           │   │
│   │  Reference: DISB-2026-000123                                        │   │
│   │                                                                      │   │
│   │  ┌─────────────────────────────┬─────────────────────────────────┐  │   │
│   │  │         DEBIT               │           CREDIT                │  │   │
│   │  ├─────────────────────────────┼─────────────────────────────────┤  │   │
│   │  │ Loan Receivable A/C         │ Customer Disbursement A/C       │  │   │
│   │  │ (Asset)                     │ (Liability/Cash)                │  │   │
│   │  │ GL: 1301-001-XXXX           │ GL: 2101-001-XXXX               │  │   │
│   │  │ Amount: 1,000,000 BDT       │ Amount: 1,000,000 BDT           │  │   │
│   │  └─────────────────────────────┴─────────────────────────────────┘  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   LOAN REPAYMENT GL ENTRY:                                                  │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  Transaction: REPAYMENT                                              │   │
│   │  Reference: REP-2026-000456                                         │   │
│   │                                                                      │   │
│   │  ┌─────────────────────────────┬─────────────────────────────────┐  │   │
│   │  │         DEBIT               │           CREDIT                │  │   │
│   │  ├─────────────────────────────┼─────────────────────────────────┤  │   │
│   │  │ Cash/Bank A/C               │ Loan Receivable A/C             │  │   │
│   │  │ GL: 1101-001-XXXX           │ GL: 1301-001-XXXX               │  │   │
│   │  │ Amount: 50,000 BDT          │ Amount: 40,000 BDT (Principal)  │  │   │
│   │  │                             │                                  │  │   │
│   │  │                             │ Interest Income A/C              │  │   │
│   │  │                             │ GL: 4101-001-XXXX               │  │   │
│   │  │                             │ Amount: 10,000 BDT (Interest)   │  │   │
│   │  └─────────────────────────────┴─────────────────────────────────┘  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   PROVISION GL ENTRY (BRPD 15/2024):                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  Transaction: PROVISION_INCREASE                                     │   │
│   │  Reference: PROV-2026-000789                                        │   │
│   │                                                                      │   │
│   │  ┌─────────────────────────────┬─────────────────────────────────┐  │   │
│   │  │         DEBIT               │           CREDIT                │  │   │
│   │  ├─────────────────────────────┼─────────────────────────────────┤  │   │
│   │  │ Provision Expense A/C       │ Provision Reserve A/C           │  │   │
│   │  │ (P&L Expense)               │ (Liability/Contra Asset)        │  │   │
│   │  │ GL: 5201-001-XXXX           │ GL: 1399-001-XXXX               │  │   │
│   │  │ Amount: 200,000 BDT         │ Amount: 200,000 BDT             │  │   │
│   │  └─────────────────────────────┴─────────────────────────────────┘  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 GL Posting Service

```java
// GlPostingService.java
@Service
@Slf4j
public class GlPostingService {

    private final CbsIntegrationGateway cbsGateway;
    private final GlPostingLogRepository glPostingLogRepository;
    private final GlAccountMappingRepository glAccountMappingRepository;

    /**
     * Post disbursement GL entries to CBS
     */
    @Transactional
    public GlPostingResponse postDisbursementEntries(
            Long loanId,
            String tenantId) {

        Loan loan = loanRepository.findById(loanId)
            .orElseThrow(() -> new LoanNotFoundException(loanId));

        // Get GL account mappings
        GlAccountMapping mapping = glAccountMappingRepository
            .findByProductAndTransactionType(
                loan.getLoanProductId(),
                TransactionType.DISBURSEMENT);

        // Build GL entry
        GlEntry entry = GlEntry.builder()
            .transactionRef(generateTransactionRef("DISB"))
            .transactionDate(loan.getDisbursementDate())
            .valueDate(loan.getDisbursementDate())
            .currency("BDT")
            .narration(String.format("Loan Disbursement - %s",
                loan.getLoanReference()))
            .build();

        // Debit: Loan Receivable
        entry.addLine(GlEntryLine.builder()
            .accountCode(mapping.getLoanReceivableAccount())
            .entryType(EntryType.DEBIT)
            .amount(loan.getDisbursedAmount())
            .narration("Loan disbursement to " + loan.getCustomer().getFullname())
            .build());

        // Credit: Cash/Disbursement Account
        entry.addLine(GlEntryLine.builder()
            .accountCode(mapping.getDisbursementAccount())
            .entryType(EntryType.CREDIT)
            .amount(loan.getDisbursedAmount())
            .narration("Loan disbursement from " + mapping.getDisbursementAccount())
            .build());

        // Validate double-entry
        if (!entry.isBalanced()) {
            throw new GlEntryNotBalancedException(
                "GL entry is not balanced: " + entry.getTransactionRef());
        }

        // Post to CBS
        GlPostingResponse response = cbsGateway.postGlEntry(entry, tenantId);

        // Log posting
        GlPostingLog logEntry = GlPostingLog.builder()
            .loanId(loanId)
            .transactionRef(entry.getTransactionRef())
            .transactionType(TransactionType.DISBURSEMENT)
            .amount(loan.getDisbursedAmount())
            .status(response.isSuccess() ? "SUCCESS" : "FAILED")
            .cbsTransactionId(response.getCbsTransactionId())
            .postedAt(LocalDateTime.now())
            .build();

        glPostingLogRepository.save(logEntry);

        return response;
    }

    /**
     * Reverse a GL posting
     */
    @Transactional
    public GlPostingResponse reversePosting(
            String originalTransactionRef,
            String tenantId) {

        GlPostingLog originalPosting = glPostingLogRepository
            .findByTransactionRef(originalTransactionRef)
            .orElseThrow(() -> new GlPostingNotFoundException(originalTransactionRef));

        // Build reversal entry
        GlEntry reversalEntry = GlEntry.builder()
            .transactionRef(generateTransactionRef("REV"))
            .transactionDate(LocalDate.now())
            .valueDate(LocalDate.now())
            .currency("BDT")
            .narration("Reversal of " + originalTransactionRef)
            .originalTransactionRef(originalTransactionRef)
            .isReversal(true)
            .build();

        // Reverse debit/credit
        // (Implementation details for reversal)

        GlPostingResponse response = cbsGateway.postGlEntry(reversalEntry, tenantId);

        if (response.isSuccess()) {
            originalPosting.setReversed(true);
            originalPosting.setReversalRef(reversalEntry.getTransactionRef());
            glPostingLogRepository.save(originalPosting);
        }

        return response;
    }

    private String generateTransactionRef(String prefix) {
        return String.format("%s-%s-%06d",
            prefix,
            LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE),
            ThreadLocalRandom.current().nextInt(999999));
    }
}
```

### 8.3 GL Account Mapping

```sql
-- GL Account Mapping Table
CREATE TABLE gl_account_mapping (
    id BIGSERIAL PRIMARY KEY,

    -- Product Reference
    loan_product_id BIGINT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,

    -- GL Accounts
    loan_receivable_account VARCHAR(20) NOT NULL,
    interest_receivable_account VARCHAR(20),
    disbursement_account VARCHAR(20) NOT NULL,
    interest_income_account VARCHAR(20),
    fee_income_account VARCHAR(20),
    penalty_income_account VARCHAR(20),
    provision_expense_account VARCHAR(20),
    provision_reserve_account VARCHAR(20),
    write_off_expense_account VARCHAR(20),

    -- CBS Mapping
    cbs_branch_code VARCHAR(10),
    cbs_cost_center VARCHAR(20),

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_gl_mapping UNIQUE (loan_product_id, transaction_type)
);

-- Sample GL Account Mappings
INSERT INTO gl_account_mapping (
    loan_product_id, transaction_type,
    loan_receivable_account, disbursement_account,
    interest_income_account, provision_expense_account,
    provision_reserve_account
) VALUES
(1, 'DISBURSEMENT', '1301-001-0001', '2101-001-0001', '4101-001-0001', '5201-001-0001', '1399-001-0001'),
(1, 'REPAYMENT', '1301-001-0001', '1101-001-0001', '4101-001-0001', NULL, NULL),
(1, 'PROVISION', '1301-001-0001', NULL, NULL, '5201-001-0001', '1399-001-0001');
```

---

## 9. Error Handling & Compensation

### 9.1 Error Classification

| Error Type | Code | Retry | Compensation |
|------------|------|-------|--------------|
| **CBS Timeout** | CBS_TIMEOUT_001 | Yes (3x) | None |
| **CBS Unavailable** | CBS_UNAVAIL_001 | Yes (3x) | None |
| **Invalid Account** | CBS_INVALID_ACC | No | N/A |
| **Insufficient Balance** | CBS_INSUF_BAL | No | Reverse previous |
| **Duplicate Transaction** | CBS_DUP_TXN | No | Idempotent |
| **GL Posting Failed** | CBS_GL_FAIL | Yes (2x) | Reverse account |
| **SAGA Step Failed** | SAGA_STEP_FAIL | No | Compensate |

### 9.2 Retry Configuration

```yaml
# CBS Retry Configuration
cbs:
  retry:
    max-attempts: 3
    initial-interval: 2000
    multiplier: 2
    max-interval: 30000
    retryable-exceptions:
      - java.net.SocketTimeoutException
      - java.net.ConnectException
      - org.springframework.web.client.HttpServerErrorException

  circuit-breaker:
    failure-rate-threshold: 50
    wait-duration-in-open-state: 60000
    sliding-window-size: 10
    minimum-number-of-calls: 5
```

### 9.3 Dead Letter Queue Processing

```java
// CbsDlqProcessor.java
@Component
@Slf4j
public class CbsDlqProcessor {

    @KafkaListener(topics = "dlq.cbs.failed", groupId = "dlq-processor")
    public void processDlqMessage(ConsumerRecord<String, Object> record) {
        log.warn("Processing DLQ message: topic={}, partition={}, offset={}",
            record.topic(), record.partition(), record.offset());

        // Extract failure details
        CbsFailedMessage failedMessage = deserialize(record.value());

        // Log for manual review
        CbsDlqLog dlqLog = CbsDlqLog.builder()
            .originalTopic(failedMessage.getOriginalTopic())
            .messageKey(record.key())
            .failureReason(failedMessage.getErrorMessage())
            .payload(failedMessage.getPayload())
            .receivedAt(LocalDateTime.now())
            .status("PENDING_REVIEW")
            .build();

        cbsDlqLogRepository.save(dlqLog);

        // Alert operations team
        alertService.sendDlqAlert(dlqLog);
    }
}
```

---

## 10. Reconciliation Process

### 10.1 Reconciliation Schedule

| Reconciliation Type | Schedule | Scope |
|--------------------|----------|-------|
| **Intraday Balance** | Every 4 hours | Active loans |
| **Daily Transaction** | 2 AM daily | Previous day |
| **Weekly Position** | Sunday 3 AM | All loans |
| **Monthly Full** | 1st of month | Complete portfolio |

### 10.2 Reconciliation Report

```java
// ReconciliationReport.java
@Data
@Entity
@Table(name = "reconciliation_report")
public class ReconciliationReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate reconciliationDate;
    private String reconciliationType;  // DAILY, WEEKLY, MONTHLY

    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    private Integer totalRecords;
    private Integer matchedCount;
    private Integer mismatchedCount;
    private Integer errorCount;

    @OneToMany(mappedBy = "report", cascade = CascadeType.ALL)
    private List<ReconciliationDiscrepancy> discrepancies;

    private String status;  // COMPLETED, FAILED, PARTIAL
    private String executedBy;

    @Column(columnDefinition = "TEXT")
    private String summary;
}
```

---

## 11. Security & Authentication

### 11.1 CBS Authentication Methods

| Method | Use Case | Configuration |
|--------|----------|---------------|
| **API Key** | Simple REST APIs | Header-based |
| **OAuth 2.0** | Modern CBS APIs | Client credentials |
| **Certificate (mTLS)** | High-security | X.509 certificates |
| **WS-Security** | SOAP APIs | Username token |

### 11.2 Security Configuration

```yaml
# CBS Security Configuration
cbs:
  security:
    # OAuth 2.0
    oauth:
      enabled: true
      token-url: ${CBS_OAUTH_TOKEN_URL}
      client-id: ${vault:secret/data/ulms/cbs#client-id}
      client-secret: ${vault:secret/data/ulms/cbs#client-secret}
      scope: "accounts:read accounts:write gl:post"

    # mTLS
    mtls:
      enabled: true
      key-store: classpath:certs/cbs-client.p12
      key-store-password: ${vault:secret/data/ulms/cbs#keystore-password}
      trust-store: classpath:certs/cbs-ca.jks
      trust-store-password: ${vault:secret/data/ulms/cbs#truststore-password}

    # Data encryption
    encryption:
      enabled: true
      algorithm: AES-256-GCM
      key-id: cbs-integration-key
```

---

## 12. Monitoring & Alerting

### 12.1 Key Metrics

| Metric | Type | Threshold | Alert |
|--------|------|-----------|-------|
| `cbs.request.duration` | Timer | > 5 seconds | Warning |
| `cbs.request.success.rate` | Gauge | < 99% | Critical |
| `cbs.circuit.breaker.state` | Gauge | OPEN | Critical |
| `saga.execution.duration` | Timer | > 60 seconds | Warning |
| `saga.compensation.rate` | Counter | > 1% | Critical |
| `reconciliation.mismatch.rate` | Gauge | > 0.1% | Warning |

### 12.2 Prometheus Metrics

```java
// CbsMetrics.java
@Component
public class CbsMetrics {

    private final Counter cbsRequestCounter;
    private final Timer cbsRequestDuration;
    private final Gauge cbsCircuitBreakerState;

    public CbsMetrics(MeterRegistry registry) {
        this.cbsRequestCounter = Counter.builder("cbs.request.total")
            .description("Total CBS API requests")
            .tag("service", "cbs-integration")
            .register(registry);

        this.cbsRequestDuration = Timer.builder("cbs.request.duration")
            .description("CBS API request duration")
            .tag("service", "cbs-integration")
            .publishPercentiles(0.5, 0.95, 0.99)
            .register(registry);

        this.cbsCircuitBreakerState = Gauge.builder("cbs.circuit.breaker.state",
                () -> circuitBreaker.getState().getOrder())
            .description("CBS circuit breaker state (0=CLOSED, 1=HALF_OPEN, 2=OPEN)")
            .register(registry);
    }
}
```

### 12.3 Alert Rules

```yaml
# Prometheus Alert Rules
groups:
  - name: cbs-integration-alerts
    rules:
      - alert: CbsHighErrorRate
        expr: |
          sum(rate(cbs_request_total{status="error"}[5m])) /
          sum(rate(cbs_request_total[5m])) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "CBS integration error rate above 1%"

      - alert: CbsCircuitBreakerOpen
        expr: cbs_circuit_breaker_state == 2
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "CBS circuit breaker is OPEN"

      - alert: SagaCompensationHigh
        expr: |
          sum(rate(saga_compensation_total[1h])) /
          sum(rate(saga_execution_total[1h])) > 0.01
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "SAGA compensation rate above 1%"
```

---

## 13. Bank-Specific Adapters

### 13.1 Adapter Architecture

| Bank CBS | Adapter | Protocol | Notes |
|----------|---------|----------|-------|
| **Temenos T24** | TemenosCbsAdapter | REST/JSON | Modern API |
| **Finacle** | FinacleCbsAdapter | SOAP/XML | Legacy WSDL |
| **Flexcube** | FlexcubeCbsAdapter | REST + MQ | Hybrid |
| **In-house** | GenericCbsAdapter | Configurable | Custom |

### 13.2 Adapter Interface

```java
// CbsAdapter.java
public interface CbsAdapter {

    // Account Operations
    CbsAccountResponse createAccount(CbsAccountRequest request);
    CbsAccountResponse getAccount(String accountId);
    CbsAccountResponse updateAccountStatus(String accountId, AccountStatus status);

    // Loan Operations
    CbsLoanAccountResponse createLoanAccount(CbsLoanAccountRequest request);
    CbsLimitResponse loadLimit(CbsLimitRequest request);
    CbsLimitResponse modifyLimit(CbsLimitRequest request);

    // GL Operations
    GlPostingResponse postGlEntry(GlEntry entry);
    GlPostingResponse reverseGlEntry(String transactionRef);

    // Inquiry Operations
    CbsBalanceResponse getBalance(String accountId);
    CbsTransactionHistory getTransactionHistory(String accountId, LocalDate from, LocalDate to);

    // Health Check
    boolean isHealthy();
}
```

---

## 14. Data Model

### 14.1 CBS Integration Tables

```sql
-- CBS Sync Status Table
CREATE TABLE cbs_sync_status (
    id BIGSERIAL PRIMARY KEY,

    -- Entity Reference
    entity_type VARCHAR(30) NOT NULL,     -- CUSTOMER, LOAN, TRANSACTION
    entity_id BIGINT NOT NULL,

    -- CBS Reference
    cbs_entity_id VARCHAR(50),
    cbs_account_id VARCHAR(50),

    -- Sync Status
    sync_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    -- PENDING, SYNCED, FAILED, OUT_OF_SYNC
    last_sync_at TIMESTAMP WITH TIME ZONE,
    last_sync_error TEXT,
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMP WITH TIME ZONE,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_cbs_sync_entity UNIQUE (entity_type, entity_id)
);

-- SAGA Execution Table
CREATE TABLE saga_execution (
    id BIGSERIAL PRIMARY KEY,
    saga_id VARCHAR(50) UNIQUE NOT NULL,

    -- SAGA Details
    saga_type VARCHAR(50) NOT NULL,       -- LOAN_DISBURSEMENT, LOAN_CLOSURE, etc.
    entity_id BIGINT NOT NULL,
    tenant_id VARCHAR(50) NOT NULL,

    -- Status
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    -- PENDING, IN_PROGRESS, COMPLETED, COMPENSATING, COMPENSATED, FAILED
    current_step INTEGER DEFAULT 0,

    -- Step Data (JSONB)
    step_data JSONB,

    -- Error Handling
    error_message TEXT,
    compensation_error TEXT,

    -- Timestamps
    initiated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    compensated_at TIMESTAMP WITH TIME ZONE,

    -- Audit
    initiated_by VARCHAR(100) NOT NULL,

    CONSTRAINT chk_saga_status CHECK (
        status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'COMPENSATING',
                   'COMPENSATED', 'COMPENSATION_FAILED', 'FAILED')
    )
);

CREATE INDEX idx_saga_execution_status ON saga_execution(status);
CREATE INDEX idx_saga_execution_entity ON saga_execution(entity_id);

-- GL Posting Log Table
CREATE TABLE gl_posting_log (
    id BIGSERIAL PRIMARY KEY,

    -- Reference
    loan_id BIGINT,
    transaction_ref VARCHAR(50) UNIQUE NOT NULL,
    transaction_type VARCHAR(30) NOT NULL,

    -- Amount
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BDT',

    -- CBS Reference
    cbs_transaction_id VARCHAR(50),

    -- Status
    status VARCHAR(20) NOT NULL,          -- SUCCESS, FAILED, REVERSED
    reversed BOOLEAN DEFAULT FALSE,
    reversal_ref VARCHAR(50),

    -- Timestamps
    posted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    reversed_at TIMESTAMP WITH TIME ZONE,

    -- Error Details
    error_code VARCHAR(20),
    error_message TEXT,

    CONSTRAINT chk_gl_posting_status CHECK (
        status IN ('SUCCESS', 'FAILED', 'REVERSED', 'PENDING')
    )
);

CREATE INDEX idx_gl_posting_loan ON gl_posting_log(loan_id);
CREATE INDEX idx_gl_posting_date ON gl_posting_log(posted_at);
```

---

## 15. Implementation Guide

### 15.1 Prerequisites

| Component | Requirement | Notes |
|-----------|-------------|-------|
| **Java** | 21 (LTS) | GraalVM recommended |
| **Spring Boot** | 3.2.1 | Parent POM |
| **Apache Camel** | 4.3 | Integration framework |
| **Apache Kafka** | 3.6 | Event streaming |
| **PostgreSQL** | 16 | Database |
| **CBS Access** | API credentials | Bank-specific |

### 15.2 Configuration Steps

1. **Configure CBS Adapter**
   - Select appropriate adapter for bank's CBS
   - Configure authentication credentials in Vault
   - Set up SSL/mTLS certificates

2. **Configure Camel Routes**
   - Enable required CBS routes
   - Configure circuit breaker thresholds
   - Set up dead letter queues

3. **Configure SAGA**
   - Enable SAGA orchestration
   - Configure compensation handlers
   - Set up monitoring

4. **Deploy and Test**
   - Deploy to staging environment
   - Run integration tests
   - Verify reconciliation

---

## 16. Appendices

### Appendix A: Kafka Topics

| Topic | Purpose | Retention |
|-------|---------|-----------|
| `ulms.loan.approved` | Loan approval events | 7 days |
| `ulms.loan.disbursement.approved` | Disbursement approvals | 7 days |
| `ulms.cbs.account.created` | CBS account confirmations | 7 days |
| `ulms.cbs.limit.loaded` | Limit load confirmations | 7 days |
| `ulms.cbs.gl.posted` | GL posting confirmations | 7 days |
| `ulms.saga.events` | SAGA orchestration events | 14 days |
| `dlq.cbs.failed` | Dead letter queue | 30 days |

### Appendix B: Error Codes

| Code | Description | Action |
|------|-------------|--------|
| CBS_001 | Connection timeout | Retry |
| CBS_002 | Authentication failed | Check credentials |
| CBS_003 | Invalid request | Fix request data |
| CBS_004 | Account not found | Verify account ID |
| CBS_005 | Insufficient balance | Check balance |
| CBS_006 | Duplicate transaction | Idempotent, skip |
| CBS_007 | GL posting failed | Retry/Manual |
| SAGA_001 | Step execution failed | Compensate |
| SAGA_002 | Compensation failed | Manual intervention |

### Appendix C: References

1. Apache Camel 4.3 Documentation
2. Apache Fineract 1.10 API Reference
3. ULMS BRD v1.0 - Section 8.1 CBS Integration
4. ULMS SRS v2.0 - Section 5.2.2 CBS Integration
5. Technology Stack v2.0 - Apache Camel Routes
6. Temenos T24 API Documentation
7. Finacle Integration Toolkit

---

**Document End**

*ULMS v2.0 - CBS Integration Design v1.0*

*Unisoft Systems Limited - Confidential*

*This document provides the comprehensive CBS integration design with SAGA pattern for ULMS v2.0.*

# Camunda BPMN Workflow Design

## Unisoft Loan Management System (ULMS) v2.0

### 7-Level Approval Workflow Engine

---

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ARCH-1.6.1 |
| **Document Title** | Camunda BPMN Workflow Design |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 5, 2026 |
| **Prepared By** | Lead Developer |
| **Reviewed By** | Architecture Review Board |
| **Classification** | Confidential - Internal Use |
| **Status** | Approved for Implementation |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | Lead Developer | Initial Camunda BPMN Workflow Design |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Camunda Platform Configuration](#2-camunda-platform-configuration)
3. [BPMN Process Definitions](#3-bpmn-process-definitions)
4. [Process Components](#4-process-components)
5. [Task Listeners and Execution Listeners](#5-task-listeners-and-execution-listeners)
6. [Process Variables Schema](#6-process-variables-schema)
7. [Kafka Event Integration](#7-kafka-event-integration)
8. [Security Configuration](#8-security-configuration)
9. [Monitoring and Operations](#9-monitoring-and-operations)
10. [Error Handling and Compensation](#10-error-handling-and-compensation)
11. [Deployment Configuration](#11-deployment-configuration)
12. [Compliance Matrix](#12-compliance-matrix)

---

## 1. Executive Summary

### 1.1 Purpose

This document defines the Camunda Platform 7.20 integration for ULMS v2.0, covering BPMN 2.0 process definitions, workflow orchestration, and the 7-level approval hierarchy implementation.

### 1.2 Scope

| Aspect | Coverage |
|--------|----------|
| Workflow Engine | Camunda Platform 7.20 |
| BPMN Version | 2.0 |
| Process Definitions | 4 main processes |
| Approval Levels | L1-L7 (7 levels) |
| Integration Framework | Spring Boot 3.2.1 |
| Service Port | 8083 |

### 1.3 Key Workflows

| Process ID | Process Name | Description | Priority |
|------------|--------------|-------------|----------|
| loan-approval-process | Loan Approval Workflow | 7-level approval for loan applications | Critical |
| loan-disbursement-process | Disbursement Workflow | Fund release process | Critical |
| loan-reschedule-process | Rescheduling Workflow | Loan restructuring | High |
| loan-writeoff-process | Write-Off Workflow | NPA write-off process | High |

### 1.4 Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Workflow Engine | Camunda Platform | 7.20 |
| Framework | Spring Boot | 3.2.1 |
| Java | OpenJDK | 21 LTS |
| Database | PostgreSQL | 16 |
| Message Broker | Apache Kafka | 3.6 |
| API Gateway | Kong | 3.5 |
| Identity | Keycloak | 23 |

---

## 2. Camunda Platform Configuration

### 2.1 Spring Boot Integration

```yaml
# application.yml - Workflow Service Configuration
server:
  port: 8083
  servlet:
    context-path: /workflow

spring:
  application:
    name: ulms-workflow-service
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:production}

  # Database Configuration
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:5432/${DB_NAME:ulms_camunda}
    username: ${DB_USER:camunda}
    password: ${DB_PASSWORD}
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      pool-name: CamundaHikariPool

  # JPA Configuration
  jpa:
    database-platform: org.hibernate.dialect.PostgreSQLDialect
    hibernate:
      ddl-auto: none
    show-sql: false
    properties:
      hibernate:
        format_sql: true
        default_schema: ${TENANT_SCHEMA:ulms_workflow}

# ═══════════════════════════════════════════════════════════════════════════════
# CAMUNDA CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════
camunda:
  bpm:
    # Database Configuration
    database:
      schema-update: true
      type: postgres
      table-prefix: ACT_

    # Process Engine
    process-engine-name: ulms-workflow-engine
    history-level: full
    history-level-default: full

    # Job Execution
    job-execution:
      enabled: true
      deployment-aware: true
      core-pool-size: 5
      max-pool-size: 10
      queue-capacity: 100
      keep-alive-seconds: 30
      lock-time-in-millis: 300000
      wait-time-in-millis: 5000
      max-wait: 60000

    # Authorization
    authorization:
      enabled: true
      authorization-check-revokes: always
      tenant-check-enabled: true

    # Admin User
    admin-user:
      id: ${CAMUNDA_ADMIN_USER:admin}
      password: ${CAMUNDA_ADMIN_PASSWORD}
      first-name: Camunda
      last-name: Admin
      email: admin@ulms.com

    # Generic Properties
    generic-properties:
      properties:
        history-cleanup-enabled: true
        history-cleanup-batch-size: 500
        history-cleanup-degree-of-parallelism: 2
        history-removal-time-strategy: end
        history-time-to-live: P365D
        batch-operation-history-time-to-live: P30D

    # Webapp (Cockpit, Admin, Tasklist)
    webapp:
      application-path: /camunda

    # Metrics
    metrics:
      enabled: true
      db-reporter-activate: true

# ═══════════════════════════════════════════════════════════════════════════════
# KAFKA CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════
spring:
  kafka:
    bootstrap-servers: ${KAFKA_BOOTSTRAP_SERVERS:localhost:9092}
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
      acks: all
      retries: 3
      properties:
        enable.idempotence: true
    consumer:
      group-id: ulms-workflow-service
      auto-offset-reset: earliest
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      properties:
        spring.json.trusted.packages: com.ulms.workflow.event

# ═══════════════════════════════════════════════════════════════════════════════
# LOGGING CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════
logging:
  level:
    root: INFO
    com.ulms.workflow: DEBUG
    org.camunda.bpm: INFO
    org.camunda.bpm.engine.impl.persistence: WARN
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n"

# ═══════════════════════════════════════════════════════════════════════════════
# MANAGEMENT ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════
management:
  server:
    port: 8093
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus,camunda
  endpoint:
    health:
      show-details: when_authorized
      probes:
        enabled: true
  health:
    livenessState:
      enabled: true
    readinessState:
      enabled: true
```

### 2.2 Spring Boot Application Class

```java
package com.ulms.workflow;

import org.camunda.bpm.spring.boot.starter.annotation.EnableProcessApplication;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableProcessApplication("ulms-workflow-application")
@EnableKafka
@EnableAsync
@EnableScheduling
public class WorkflowServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(WorkflowServiceApplication.class, args);
    }
}
```

### 2.3 Process Engine Configuration

```java
package com.ulms.workflow.config;

import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.impl.cfg.ProcessEngineConfigurationImpl;
import org.camunda.bpm.engine.impl.history.HistoryLevel;
import org.camunda.bpm.spring.boot.starter.configuration.impl.AbstractCamundaConfiguration;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

import java.util.List;

@Configuration
@Order(1)
public class CamundaEngineConfiguration extends AbstractCamundaConfiguration {

    @Override
    public void preInit(ProcessEngineConfigurationImpl configuration) {
        // History level for full audit
        configuration.setHistoryLevel(HistoryLevel.HISTORY_LEVEL_FULL);

        // Enable authorization
        configuration.setAuthorizationEnabled(true);
        configuration.setAuthorizationCheckRevokes(true);

        // Configure tenant checking
        configuration.setTenantCheckEnabled(true);

        // Custom ID generators for distributed environment
        configuration.setIdGenerator(new StrongUuidGenerator());

        // Enable telemetry (disabled for production)
        configuration.setTelemetryReporterActivate(false);
    }

    @Override
    public void postInit(ProcessEngineConfigurationImpl configuration) {
        // Register custom plugins
        List<ProcessEnginePlugin> plugins = configuration.getProcessEnginePlugins();
        plugins.add(new AuditLogPlugin());
        plugins.add(new MetricsPlugin());
    }

    @Override
    public void postProcessEngineBuild(ProcessEngine processEngine) {
        // Post-initialization tasks
        log.info("Camunda Process Engine '{}' initialized successfully",
            processEngine.getName());
    }
}
```

---

## 3. BPMN Process Definitions

### 3.1 Loan Approval Process Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                           LOAN APPROVAL BPMN PROCESS (loan-approval-process)                         │
├─────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                      │
│  ┌──────────┐   ┌──────────────────┐   ┌──────────────────┐   ┌───────────────────────────────┐   │
│  │ ○ Start  │──▶│ Validate         │──▶│ Determine Level  │──▶│ Exclusive Gateway             │   │
│  │ (Message)│   │ Application      │   │ (DMN Business    │   │ (Route by Approval Level)     │   │
│  └──────────┘   │ (Service Task)   │   │ Rule Task)       │   └──────────────┬────────────────┘   │
│                 └──────────────────┘   └──────────────────┘                  │                     │
│                                                                               │                     │
│  ┌───────────────────────────────────────────────────────────────────────────┴─────────────────┐  │
│  │                                                                                               │  │
│  │    ┌──────────────────────────────────────────────────────────────────────────────────┐     │  │
│  │    │                        7-LEVEL APPROVAL SUBPROCESS                                │     │  │
│  │    │                                                                                   │     │  │
│  │    │  ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   │     │  │
│  │    │  │ L1     │   │ L2     │   │ L3     │   │ L4     │   │ L5     │   │ L6     │   │     │  │
│  │    │  │ BCH    │──▶│ BM     │──▶│ RM     │──▶│ HOC    │──▶│ CC     │──▶│ DMD    │   │     │  │
│  │    │  │ ≤5L    │   │ ≤10L   │   │ ≤25L   │   │ ≤1Cr   │   │ ≤5Cr   │   │ ≤10Cr  │   │     │  │
│  │    │  │ 4hrs   │   │ 6hrs   │   │ 8hrs   │   │ 12hrs  │   │ 24hrs  │   │ 48hrs  │   │     │  │
│  │    │  └────┬───┘   └────┬───┘   └────┬───┘   └────┬───┘   └────┬───┘   └────┬───┘   │     │  │
│  │    │       │            │            │            │            │            │        │     │  │
│  │    │       │   ┌────────┘            │            │            │            │        │     │  │
│  │    │       │   │                     │            │            │            │        │     │  │
│  │    │       ▼   ▼                     ▼            ▼            ▼            ▼        │     │  │
│  │    │  ┌────────────┐           ┌────────┐                                            │     │  │
│  │    │  │ Decision   │           │ L7     │                                            │     │  │
│  │    │  │ Gateway    │           │ MD     │                                            │     │  │
│  │    │  └────┬───────┘           │ >10Cr  │                                            │     │  │
│  │    │       │                   │ 72hrs  │                                            │     │  │
│  │    │       │                   └────┬───┘                                            │     │  │
│  │    └───────┼────────────────────────┼────────────────────────────────────────────────┘     │  │
│  │            │                        │                                                        │  │
│  └────────────┼────────────────────────┼────────────────────────────────────────────────────────┘  │
│               │                        │                                                           │
│               ▼                        ▼                                                           │
│    ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐                        │
│    │ ● Approved       │     │ ● Rejected       │     │ ↩ Returned       │                        │
│    │ (End Event)      │     │ (End Event)      │     │ (Intermediate    │                        │
│    │                  │     │                  │     │  Event)          │                        │
│    └──────────────────┘     └──────────────────┘     └──────────────────┘                        │
│                                                                                                    │
│  Legend: BCH=Branch Credit Head, BM=Branch Manager, RM=Regional Manager,                         │
│          HOC=Head of Credit, CC=Credit Committee, DMD=Deputy MD, MD=Managing Director            │
│          L=Lakh (100,000), Cr=Crore (10,000,000)                                                 │
│                                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Complete BPMN XML - Loan Approval Process

```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  xmlns:camunda="http://camunda.org/schema/1.0/bpmn"
                  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  id="Definitions_LoanApproval"
                  targetNamespace="http://ulms.unisoft.com/bpmn"
                  exporter="Camunda Modeler"
                  exporterVersion="5.17.0">

  <!-- ══════════════════════════════════════════════════════════════════════════ -->
  <!-- LOAN APPROVAL PROCESS                                                       -->
  <!-- ══════════════════════════════════════════════════════════════════════════ -->
  <bpmn:process id="loan-approval-process"
                name="Loan Approval Workflow"
                isExecutable="true"
                camunda:historyTimeToLive="P365D"
                camunda:candidateStarterGroups="BRANCH_USER,CREDIT_ANALYST_BRANCH">

    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <!-- START EVENT - Application Submitted                                       -->
    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <bpmn:startEvent id="start_application_submitted"
                     name="Application Submitted"
                     camunda:formKey="embedded:app:forms/start-form.html">
      <bpmn:extensionElements>
        <camunda:executionListener event="start"
                                   delegateExpression="${processStartListener}"/>
      </bpmn:extensionElements>
      <bpmn:outgoing>flow_start_to_validate</bpmn:outgoing>
    </bpmn:startEvent>

    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <!-- SERVICE TASK - Validate Application                                       -->
    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <bpmn:serviceTask id="task_validate_application"
                      name="Validate Application"
                      camunda:delegateExpression="${validateApplicationDelegate}">
      <bpmn:extensionElements>
        <camunda:inputOutput>
          <camunda:inputParameter name="loanId">${loanId}</camunda:inputParameter>
        </camunda:inputOutput>
      </bpmn:extensionElements>
      <bpmn:incoming>flow_start_to_validate</bpmn:incoming>
      <bpmn:outgoing>flow_validate_to_cib</bpmn:outgoing>
    </bpmn:serviceTask>

    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <!-- SERVICE TASK - CIB Check                                                  -->
    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <bpmn:serviceTask id="task_cib_check"
                      name="CIB Inquiry"
                      camunda:delegateExpression="${cibCheckDelegate}"
                      camunda:asyncBefore="true">
      <bpmn:extensionElements>
        <camunda:failedJobRetryTimeCycle>R3/PT5M</camunda:failedJobRetryTimeCycle>
      </bpmn:extensionElements>
      <bpmn:incoming>flow_validate_to_cib</bpmn:incoming>
      <bpmn:outgoing>flow_cib_to_scoring</bpmn:outgoing>
    </bpmn:serviceTask>

    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <!-- SERVICE TASK - Credit Scoring                                             -->
    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <bpmn:serviceTask id="task_credit_scoring"
                      name="Calculate Credit Score"
                      camunda:delegateExpression="${creditScoringDelegate}">
      <bpmn:incoming>flow_cib_to_scoring</bpmn:incoming>
      <bpmn:outgoing>flow_scoring_to_dmn</bpmn:outgoing>
    </bpmn:serviceTask>

    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <!-- BUSINESS RULE TASK - Determine Approval Level (DMN)                       -->
    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <bpmn:businessRuleTask id="task_determine_level"
                           name="Determine Approval Level"
                           camunda:decisionRef="approval-level-routing"
                           camunda:mapDecisionResult="singleResult"
                           camunda:resultVariable="routingResult">
      <bpmn:incoming>flow_scoring_to_dmn</bpmn:incoming>
      <bpmn:outgoing>flow_dmn_to_gateway</bpmn:outgoing>
    </bpmn:businessRuleTask>

    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <!-- EXCLUSIVE GATEWAY - Route by Approval Level                               -->
    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <bpmn:exclusiveGateway id="gateway_route_level"
                           name="Route by Level">
      <bpmn:incoming>flow_dmn_to_gateway</bpmn:incoming>
      <bpmn:outgoing>flow_to_L1</bpmn:outgoing>
      <bpmn:outgoing>flow_to_L2</bpmn:outgoing>
      <bpmn:outgoing>flow_to_L3</bpmn:outgoing>
      <bpmn:outgoing>flow_to_L4</bpmn:outgoing>
      <bpmn:outgoing>flow_to_L5</bpmn:outgoing>
      <bpmn:outgoing>flow_to_L6</bpmn:outgoing>
      <bpmn:outgoing>flow_to_L7</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <!-- USER TASK - L1 Branch Credit Head Approval                                -->
    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <bpmn:userTask id="task_L1_approval"
                   name="L1: Branch Credit Head Approval"
                   camunda:candidateGroups="BRANCH_CREDIT_HEAD"
                   camunda:formKey="embedded:app:forms/approval-form.html"
                   camunda:dueDate="${dateTime().plusHours(4)}">
      <bpmn:extensionElements>
        <camunda:taskListener event="create"
                              delegateExpression="${slaTaskListener}"/>
        <camunda:taskListener event="complete"
                              delegateExpression="${approvalAuditListener}"/>
        <camunda:properties>
          <camunda:property name="approvalLevel" value="1"/>
          <camunda:property name="slaHours" value="4"/>
          <camunda:property name="escalationHours" value="6"/>
        </camunda:properties>
      </bpmn:extensionElements>
      <bpmn:incoming>flow_to_L1</bpmn:incoming>
      <bpmn:outgoing>flow_L1_to_decision</bpmn:outgoing>

      <!-- Timer Boundary Event for SLA -->
      <bpmn:boundaryEvent id="timer_L1_sla"
                          name="L1 SLA Timer"
                          attachedToRef="task_L1_approval"
                          cancelActivity="false">
        <bpmn:timerEventDefinition>
          <bpmn:timeDuration>PT4H</bpmn:timeDuration>
        </bpmn:timerEventDefinition>
        <bpmn:outgoing>flow_L1_sla_to_escalation</bpmn:outgoing>
      </bpmn:boundaryEvent>
    </bpmn:userTask>

    <!-- L1 Decision Gateway -->
    <bpmn:exclusiveGateway id="gateway_L1_decision" name="L1 Decision">
      <bpmn:incoming>flow_L1_to_decision</bpmn:incoming>
      <bpmn:outgoing>flow_L1_approve_final</bpmn:outgoing>
      <bpmn:outgoing>flow_L1_approve_escalate</bpmn:outgoing>
      <bpmn:outgoing>flow_L1_reject</bpmn:outgoing>
      <bpmn:outgoing>flow_L1_return</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <!-- USER TASK - L2 Branch Manager Approval                                    -->
    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <bpmn:userTask id="task_L2_approval"
                   name="L2: Branch Manager Approval"
                   camunda:candidateGroups="BRANCH_MANAGER"
                   camunda:formKey="embedded:app:forms/approval-form.html"
                   camunda:dueDate="${dateTime().plusHours(6)}">
      <bpmn:extensionElements>
        <camunda:taskListener event="create"
                              delegateExpression="${slaTaskListener}"/>
        <camunda:taskListener event="complete"
                              delegateExpression="${approvalAuditListener}"/>
        <camunda:properties>
          <camunda:property name="approvalLevel" value="2"/>
          <camunda:property name="slaHours" value="6"/>
          <camunda:property name="escalationHours" value="8"/>
        </camunda:properties>
      </bpmn:extensionElements>
      <bpmn:incoming>flow_to_L2</bpmn:incoming>
      <bpmn:incoming>flow_L1_approve_escalate</bpmn:incoming>
      <bpmn:outgoing>flow_L2_to_decision</bpmn:outgoing>

      <bpmn:boundaryEvent id="timer_L2_sla" attachedToRef="task_L2_approval" cancelActivity="false">
        <bpmn:timerEventDefinition>
          <bpmn:timeDuration>PT6H</bpmn:timeDuration>
        </bpmn:timerEventDefinition>
      </bpmn:boundaryEvent>
    </bpmn:userTask>

    <!-- L2 Decision Gateway -->
    <bpmn:exclusiveGateway id="gateway_L2_decision" name="L2 Decision">
      <bpmn:incoming>flow_L2_to_decision</bpmn:incoming>
      <bpmn:outgoing>flow_L2_approve_final</bpmn:outgoing>
      <bpmn:outgoing>flow_L2_approve_escalate</bpmn:outgoing>
      <bpmn:outgoing>flow_L2_reject</bpmn:outgoing>
      <bpmn:outgoing>flow_L2_return</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <!-- USER TASK - L3 Regional Manager Approval                                  -->
    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <bpmn:userTask id="task_L3_approval"
                   name="L3: Regional Manager Approval"
                   camunda:candidateGroups="REGIONAL_MANAGER"
                   camunda:formKey="embedded:app:forms/approval-form.html"
                   camunda:dueDate="${dateTime().plusHours(8)}">
      <bpmn:extensionElements>
        <camunda:taskListener event="create"
                              delegateExpression="${slaTaskListener}"/>
        <camunda:taskListener event="complete"
                              delegateExpression="${approvalAuditListener}"/>
        <camunda:properties>
          <camunda:property name="approvalLevel" value="3"/>
          <camunda:property name="slaHours" value="8"/>
          <camunda:property name="escalationHours" value="12"/>
        </camunda:properties>
      </bpmn:extensionElements>
      <bpmn:incoming>flow_to_L3</bpmn:incoming>
      <bpmn:incoming>flow_L2_approve_escalate</bpmn:incoming>
      <bpmn:outgoing>flow_L3_to_decision</bpmn:outgoing>

      <bpmn:boundaryEvent id="timer_L3_sla" attachedToRef="task_L3_approval" cancelActivity="false">
        <bpmn:timerEventDefinition>
          <bpmn:timeDuration>PT8H</bpmn:timeDuration>
        </bpmn:timerEventDefinition>
      </bpmn:boundaryEvent>
    </bpmn:userTask>

    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <!-- USER TASK - L4 Head of Credit Approval                                    -->
    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <bpmn:userTask id="task_L4_approval"
                   name="L4: Head of Credit Approval"
                   camunda:candidateGroups="HEAD_OF_CREDIT"
                   camunda:formKey="embedded:app:forms/approval-form.html"
                   camunda:dueDate="${dateTime().plusHours(12)}">
      <bpmn:extensionElements>
        <camunda:taskListener event="create"
                              delegateExpression="${slaTaskListener}"/>
        <camunda:taskListener event="complete"
                              delegateExpression="${approvalAuditListener}"/>
        <camunda:properties>
          <camunda:property name="approvalLevel" value="4"/>
          <camunda:property name="slaHours" value="12"/>
          <camunda:property name="escalationHours" value="18"/>
        </camunda:properties>
      </bpmn:extensionElements>
      <bpmn:incoming>flow_to_L4</bpmn:incoming>
      <bpmn:incoming>flow_L3_approve_escalate</bpmn:incoming>
      <bpmn:outgoing>flow_L4_to_decision</bpmn:outgoing>

      <bpmn:boundaryEvent id="timer_L4_sla" attachedToRef="task_L4_approval" cancelActivity="false">
        <bpmn:timerEventDefinition>
          <bpmn:timeDuration>PT12H</bpmn:timeDuration>
        </bpmn:timerEventDefinition>
      </bpmn:boundaryEvent>
    </bpmn:userTask>

    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <!-- USER TASK - L5 Credit Committee Approval                                  -->
    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <bpmn:userTask id="task_L5_approval"
                   name="L5: Credit Committee Approval"
                   camunda:candidateGroups="CREDIT_COMMITTEE"
                   camunda:formKey="embedded:app:forms/committee-approval-form.html"
                   camunda:dueDate="${dateTime().plusHours(24)}">
      <bpmn:extensionElements>
        <camunda:taskListener event="create"
                              delegateExpression="${slaTaskListener}"/>
        <camunda:taskListener event="complete"
                              delegateExpression="${approvalAuditListener}"/>
        <camunda:properties>
          <camunda:property name="approvalLevel" value="5"/>
          <camunda:property name="slaHours" value="24"/>
          <camunda:property name="escalationHours" value="36"/>
          <camunda:property name="requiresQuorum" value="true"/>
          <camunda:property name="quorumSize" value="3"/>
        </camunda:properties>
      </bpmn:extensionElements>
      <bpmn:incoming>flow_to_L5</bpmn:incoming>
      <bpmn:incoming>flow_L4_approve_escalate</bpmn:incoming>
      <bpmn:outgoing>flow_L5_to_decision</bpmn:outgoing>

      <bpmn:boundaryEvent id="timer_L5_sla" attachedToRef="task_L5_approval" cancelActivity="false">
        <bpmn:timerEventDefinition>
          <bpmn:timeDuration>PT24H</bpmn:timeDuration>
        </bpmn:timerEventDefinition>
      </bpmn:boundaryEvent>
    </bpmn:userTask>

    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <!-- USER TASK - L6 Deputy MD Approval                                         -->
    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <bpmn:userTask id="task_L6_approval"
                   name="L6: Deputy MD Approval"
                   camunda:candidateGroups="DEPUTY_MD"
                   camunda:formKey="embedded:app:forms/approval-form.html"
                   camunda:dueDate="${dateTime().plusHours(48)}">
      <bpmn:extensionElements>
        <camunda:taskListener event="create"
                              delegateExpression="${slaTaskListener}"/>
        <camunda:taskListener event="complete"
                              delegateExpression="${approvalAuditListener}"/>
        <camunda:properties>
          <camunda:property name="approvalLevel" value="6"/>
          <camunda:property name="slaHours" value="48"/>
          <camunda:property name="escalationHours" value="72"/>
        </camunda:properties>
      </bpmn:extensionElements>
      <bpmn:incoming>flow_to_L6</bpmn:incoming>
      <bpmn:incoming>flow_L5_approve_escalate</bpmn:incoming>
      <bpmn:outgoing>flow_L6_to_decision</bpmn:outgoing>

      <bpmn:boundaryEvent id="timer_L6_sla" attachedToRef="task_L6_approval" cancelActivity="false">
        <bpmn:timerEventDefinition>
          <bpmn:timeDuration>PT48H</bpmn:timeDuration>
        </bpmn:timerEventDefinition>
      </bpmn:boundaryEvent>
    </bpmn:userTask>

    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <!-- USER TASK - L7 Managing Director Approval                                 -->
    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <bpmn:userTask id="task_L7_approval"
                   name="L7: Managing Director Approval"
                   camunda:candidateGroups="MANAGING_DIRECTOR"
                   camunda:formKey="embedded:app:forms/approval-form.html"
                   camunda:dueDate="${dateTime().plusHours(72)}">
      <bpmn:extensionElements>
        <camunda:taskListener event="create"
                              delegateExpression="${slaTaskListener}"/>
        <camunda:taskListener event="complete"
                              delegateExpression="${approvalAuditListener}"/>
        <camunda:properties>
          <camunda:property name="approvalLevel" value="7"/>
          <camunda:property name="slaHours" value="72"/>
          <camunda:property name="escalationHours" value="96"/>
        </camunda:properties>
      </bpmn:extensionElements>
      <bpmn:incoming>flow_to_L7</bpmn:incoming>
      <bpmn:incoming>flow_L6_approve_escalate</bpmn:incoming>
      <bpmn:outgoing>flow_L7_to_decision</bpmn:outgoing>

      <bpmn:boundaryEvent id="timer_L7_sla" attachedToRef="task_L7_approval" cancelActivity="false">
        <bpmn:timerEventDefinition>
          <bpmn:timeDuration>PT72H</bpmn:timeDuration>
        </bpmn:timerEventDefinition>
      </bpmn:boundaryEvent>
    </bpmn:userTask>

    <!-- L7 Decision Gateway -->
    <bpmn:exclusiveGateway id="gateway_L7_decision" name="L7 Decision">
      <bpmn:incoming>flow_L7_to_decision</bpmn:incoming>
      <bpmn:outgoing>flow_L7_approve</bpmn:outgoing>
      <bpmn:outgoing>flow_L7_reject</bpmn:outgoing>
      <bpmn:outgoing>flow_L7_return</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <!-- SERVICE TASK - Record Final Approval                                      -->
    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <bpmn:serviceTask id="task_record_approval"
                      name="Record Final Approval"
                      camunda:delegateExpression="${recordApprovalDelegate}">
      <bpmn:incoming>flow_L1_approve_final</bpmn:incoming>
      <bpmn:incoming>flow_L2_approve_final</bpmn:incoming>
      <bpmn:incoming>flow_L3_approve_final</bpmn:incoming>
      <bpmn:incoming>flow_L4_approve_final</bpmn:incoming>
      <bpmn:incoming>flow_L5_approve_final</bpmn:incoming>
      <bpmn:incoming>flow_L6_approve_final</bpmn:incoming>
      <bpmn:incoming>flow_L7_approve</bpmn:incoming>
      <bpmn:outgoing>flow_approval_to_end</bpmn:outgoing>
    </bpmn:serviceTask>

    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <!-- SERVICE TASK - Record Rejection                                           -->
    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <bpmn:serviceTask id="task_record_rejection"
                      name="Record Rejection"
                      camunda:delegateExpression="${recordRejectionDelegate}">
      <bpmn:incoming>flow_L1_reject</bpmn:incoming>
      <bpmn:incoming>flow_L2_reject</bpmn:incoming>
      <bpmn:incoming>flow_L3_reject</bpmn:incoming>
      <bpmn:incoming>flow_L4_reject</bpmn:incoming>
      <bpmn:incoming>flow_L5_reject</bpmn:incoming>
      <bpmn:incoming>flow_L6_reject</bpmn:incoming>
      <bpmn:incoming>flow_L7_reject</bpmn:incoming>
      <bpmn:outgoing>flow_rejection_to_end</bpmn:outgoing>
    </bpmn:serviceTask>

    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <!-- END EVENTS                                                                -->
    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <bpmn:endEvent id="end_approved" name="Loan Approved">
      <bpmn:extensionElements>
        <camunda:executionListener event="end"
                                   delegateExpression="${approvalCompleteListener}"/>
      </bpmn:extensionElements>
      <bpmn:incoming>flow_approval_to_end</bpmn:incoming>
      <bpmn:messageEventDefinition id="msg_approved"
                                   camunda:expression="${kafkaEventPublisher.publishApprovalEvent(execution, 'APPROVED')}"/>
    </bpmn:endEvent>

    <bpmn:endEvent id="end_rejected" name="Loan Rejected">
      <bpmn:extensionElements>
        <camunda:executionListener event="end"
                                   delegateExpression="${rejectionCompleteListener}"/>
      </bpmn:extensionElements>
      <bpmn:incoming>flow_rejection_to_end</bpmn:incoming>
      <bpmn:messageEventDefinition id="msg_rejected"
                                   camunda:expression="${kafkaEventPublisher.publishApprovalEvent(execution, 'REJECTED')}"/>
    </bpmn:endEvent>

    <!-- ════════════════════════════════════════════════════════════════════════ -->
    <!-- SEQUENCE FLOWS                                                            -->
    <!-- ════════════════════════════════════════════════════════════════════════ -->

    <!-- Start to Validate -->
    <bpmn:sequenceFlow id="flow_start_to_validate"
                       sourceRef="start_application_submitted"
                       targetRef="task_validate_application"/>

    <!-- Validate to CIB -->
    <bpmn:sequenceFlow id="flow_validate_to_cib"
                       sourceRef="task_validate_application"
                       targetRef="task_cib_check"/>

    <!-- CIB to Scoring -->
    <bpmn:sequenceFlow id="flow_cib_to_scoring"
                       sourceRef="task_cib_check"
                       targetRef="task_credit_scoring"/>

    <!-- Scoring to DMN -->
    <bpmn:sequenceFlow id="flow_scoring_to_dmn"
                       sourceRef="task_credit_scoring"
                       targetRef="task_determine_level"/>

    <!-- DMN to Gateway -->
    <bpmn:sequenceFlow id="flow_dmn_to_gateway"
                       sourceRef="task_determine_level"
                       targetRef="gateway_route_level"/>

    <!-- Routing to Approval Levels -->
    <bpmn:sequenceFlow id="flow_to_L1" sourceRef="gateway_route_level" targetRef="task_L1_approval">
      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">
        ${routingResult.approvalLevel == 1}
      </bpmn:conditionExpression>
    </bpmn:sequenceFlow>

    <bpmn:sequenceFlow id="flow_to_L2" sourceRef="gateway_route_level" targetRef="task_L2_approval">
      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">
        ${routingResult.approvalLevel == 2}
      </bpmn:conditionExpression>
    </bpmn:sequenceFlow>

    <bpmn:sequenceFlow id="flow_to_L3" sourceRef="gateway_route_level" targetRef="task_L3_approval">
      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">
        ${routingResult.approvalLevel == 3}
      </bpmn:conditionExpression>
    </bpmn:sequenceFlow>

    <bpmn:sequenceFlow id="flow_to_L4" sourceRef="gateway_route_level" targetRef="task_L4_approval">
      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">
        ${routingResult.approvalLevel == 4}
      </bpmn:conditionExpression>
    </bpmn:sequenceFlow>

    <bpmn:sequenceFlow id="flow_to_L5" sourceRef="gateway_route_level" targetRef="task_L5_approval">
      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">
        ${routingResult.approvalLevel == 5}
      </bpmn:conditionExpression>
    </bpmn:sequenceFlow>

    <bpmn:sequenceFlow id="flow_to_L6" sourceRef="gateway_route_level" targetRef="task_L6_approval">
      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">
        ${routingResult.approvalLevel == 6}
      </bpmn:conditionExpression>
    </bpmn:sequenceFlow>

    <bpmn:sequenceFlow id="flow_to_L7" sourceRef="gateway_route_level" targetRef="task_L7_approval">
      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">
        ${routingResult.approvalLevel == 7}
      </bpmn:conditionExpression>
    </bpmn:sequenceFlow>

    <!-- L1 Decision Flows -->
    <bpmn:sequenceFlow id="flow_L1_to_decision" sourceRef="task_L1_approval" targetRef="gateway_L1_decision"/>

    <bpmn:sequenceFlow id="flow_L1_approve_final" sourceRef="gateway_L1_decision" targetRef="task_record_approval">
      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">
        ${decision == 'APPROVE' &amp;&amp; loanAmount &lt;= 500000}
      </bpmn:conditionExpression>
    </bpmn:sequenceFlow>

    <bpmn:sequenceFlow id="flow_L1_approve_escalate" sourceRef="gateway_L1_decision" targetRef="task_L2_approval">
      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">
        ${decision == 'APPROVE' &amp;&amp; loanAmount > 500000}
      </bpmn:conditionExpression>
    </bpmn:sequenceFlow>

    <bpmn:sequenceFlow id="flow_L1_reject" sourceRef="gateway_L1_decision" targetRef="task_record_rejection">
      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">
        ${decision == 'REJECT'}
      </bpmn:conditionExpression>
    </bpmn:sequenceFlow>

    <bpmn:sequenceFlow id="flow_L1_return" sourceRef="gateway_L1_decision" targetRef="end_returned">
      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">
        ${decision == 'RETURN'}
      </bpmn:conditionExpression>
    </bpmn:sequenceFlow>

    <!-- Final Flows -->
    <bpmn:sequenceFlow id="flow_approval_to_end" sourceRef="task_record_approval" targetRef="end_approved"/>
    <bpmn:sequenceFlow id="flow_rejection_to_end" sourceRef="task_record_rejection" targetRef="end_rejected"/>

  </bpmn:process>

</bpmn:definitions>
```

---

## 4. Process Components

### 4.1 Java Delegate Classes

#### 4.1.1 Validate Application Delegate

```java
package com.ulms.workflow.delegate;

import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

@Component("validateApplicationDelegate")
@RequiredArgsConstructor
@Slf4j
public class ValidateApplicationDelegate implements JavaDelegate {

    private final LoanRepository loanRepository;
    private final ValidationService validationService;

    @Override
    public void execute(DelegateExecution execution) throws Exception {
        Long loanId = (Long) execution.getVariable("loanId");
        log.info("Validating loan application: {}", loanId);

        Loan loan = loanRepository.findById(loanId)
            .orElseThrow(() -> new LoanNotFoundException(loanId));

        // Perform validation
        ValidationResult result = validationService.validateApplication(loan);

        if (!result.isValid()) {
            throw new ValidationException(result.getErrors());
        }

        // Set process variables
        execution.setVariable("clientId", loan.getClientId());
        execution.setVariable("clientNid", loan.getClientNid());
        execution.setVariable("loanAmount", loan.getProposedPrincipal());
        execution.setVariable("productCode", loan.getProductCode());
        execution.setVariable("branchId", loan.getBranchId());
        execution.setVariable("applicationNumber", loan.getApplicationRef());

        log.info("Loan application {} validated successfully", loanId);
    }
}
```

#### 4.1.2 CIB Check Delegate

```java
package com.ulms.workflow.delegate;

import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

@Component("cibCheckDelegate")
@RequiredArgsConstructor
@Slf4j
public class CIBCheckDelegate implements JavaDelegate {

    private final CIBService cibService;
    private final LoanRepository loanRepository;

    @Override
    public void execute(DelegateExecution execution) throws Exception {
        Long loanId = (Long) execution.getVariable("loanId");
        String clientNid = (String) execution.getVariable("clientNid");

        log.info("Initiating CIB check for loan: {}, NID: {}", loanId, clientNid);

        // Call CIB service
        CIBResult cibResult = cibService.inquire(clientNid);

        // Update loan with CIB result
        Loan loan = loanRepository.findById(loanId)
            .orElseThrow(() -> new LoanNotFoundException(loanId));
        loan.setCibChecked(true);
        loan.setCibCheckDate(LocalDate.now());
        loanRepository.save(loan);

        // Set CIB variables
        execution.setVariable("cibScore", cibResult.getScore());
        execution.setVariable("cibStatus", cibResult.getStatus());
        execution.setVariable("existingDPD", cibResult.getMaxDPD());
        execution.setVariable("totalExposure", cibResult.getTotalExposure());

        log.info("CIB check completed for loan: {}, Score: {}", loanId, cibResult.getScore());
    }
}
```

#### 4.1.3 Credit Scoring Delegate

```java
package com.ulms.workflow.delegate;

import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

@Component("creditScoringDelegate")
@RequiredArgsConstructor
@Slf4j
public class CreditScoringDelegate implements JavaDelegate {

    private final CreditScoringService scoringService;
    private final LoanRepository loanRepository;

    @Override
    public void execute(DelegateExecution execution) throws Exception {
        Long loanId = (Long) execution.getVariable("loanId");
        Integer cibScore = (Integer) execution.getVariable("cibScore");

        log.info("Calculating credit score for loan: {}", loanId);

        Loan loan = loanRepository.findById(loanId)
            .orElseThrow(() -> new LoanNotFoundException(loanId));

        // Calculate credit score
        CreditScoreResult scoreResult = scoringService.calculateScore(
            loan,
            cibScore
        );

        // Update loan
        loan.setCreditScore(scoreResult.getScore());
        loan.setRiskGrade(scoreResult.getRiskGrade());
        loan.setDebtBurdenRatio(scoreResult.getDbr());
        loanRepository.save(loan);

        // Set scoring variables
        execution.setVariable("creditScore", scoreResult.getScore());
        execution.setVariable("riskGrade", scoreResult.getRiskGrade().name());
        execution.setVariable("dbrPercentage", scoreResult.getDbr());
        execution.setVariable("customerType", loan.getCustomerType());
        execution.setVariable("productCategory", loan.getProductCategory());

        log.info("Credit score calculated for loan: {}, Score: {}, Risk: {}",
            loanId, scoreResult.getScore(), scoreResult.getRiskGrade());
    }
}
```

#### 4.1.4 Record Approval Delegate

```java
package com.ulms.workflow.delegate;

import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Component;

@Component("recordApprovalDelegate")
@RequiredArgsConstructor
@Slf4j
public class RecordApprovalDelegate implements JavaDelegate {

    private final LoanRepository loanRepository;
    private final ApprovalLogRepository approvalLogRepository;
    private final NotificationService notificationService;
    private final KafkaEventPublisher eventPublisher;

    @Override
    public void execute(DelegateExecution execution) throws Exception {
        Long loanId = (Long) execution.getVariable("loanId");
        String approverId = (String) execution.getVariable("lastApproverId");
        Integer finalLevel = (Integer) execution.getVariable("currentApprovalLevel");

        log.info("Recording final approval for loan: {} at level: {}", loanId, finalLevel);

        Loan loan = loanRepository.findById(loanId)
            .orElseThrow(() -> new LoanNotFoundException(loanId));

        // Update loan status
        loan.setLoanStatus(LoanState.APPROVED.name());
        loan.setApprovedBy(approverId);
        loan.setApprovedAt(Instant.now());
        loan.setApprovedOnDate(LocalDate.now());
        loan.setApprovedPrincipal(loan.getProposedPrincipal());
        loan.setApprovedInterestRate(loan.getProposedInterestRate());
        loan.setApprovedTermMonths(loan.getProposedTermMonths());

        loanRepository.save(loan);

        // Send notification
        notificationService.sendApprovalNotification(loan);

        // Publish Kafka event
        eventPublisher.publishLoanApprovedEvent(loan, finalLevel);

        log.info("Loan {} approved successfully", loanId);
    }
}
```

---

## 5. Task Listeners and Execution Listeners

### 5.1 SLA Task Listener

```java
package com.ulms.workflow.listener;

import org.camunda.bpm.engine.delegate.DelegateTask;
import org.camunda.bpm.engine.delegate.TaskListener;
import org.springframework.stereotype.Component;

@Component("slaTaskListener")
@RequiredArgsConstructor
@Slf4j
public class SLATaskListener implements TaskListener {

    private final LoanRepository loanRepository;
    private final WorkflowTaskRepository taskRepository;

    @Override
    public void notify(DelegateTask delegateTask) {
        Long loanId = (Long) delegateTask.getVariable("loanId");
        String taskId = delegateTask.getId();
        int approvalLevel = getApprovalLevel(delegateTask);
        int slaHours = getSLAHours(delegateTask);

        log.info("Task created - Loan: {}, Task: {}, Level: L{}, SLA: {}h",
            loanId, taskId, approvalLevel, slaHours);

        // Calculate SLA due time
        Instant slaDueAt = Instant.now().plus(Duration.ofHours(slaHours));

        // Update loan
        Loan loan = loanRepository.findById(loanId).orElse(null);
        if (loan != null) {
            loan.setCurrentWorkflowTaskId(taskId);
            loan.setCurrentApprovalLevel(approvalLevel);
            loan.setPendingApprovalSince(Instant.now());
            loan.setApprovalSlaDueAt(slaDueAt);
            loan.setIsSlaBreached(false);
            loanRepository.save(loan);
        }

        // Create workflow task record
        WorkflowTask workflowTask = WorkflowTask.builder()
            .loanId(loanId)
            .taskId(taskId)
            .taskName(delegateTask.getName())
            .approvalLevel(approvalLevel)
            .candidateGroup(getCandidateGroup(delegateTask))
            .createdAt(Instant.now())
            .slaDueAt(slaDueAt)
            .status(TaskStatus.PENDING)
            .build();

        taskRepository.save(workflowTask);
    }

    private int getApprovalLevel(DelegateTask task) {
        String level = task.getExecution()
            .getBpmnModelElementInstance()
            .getAttributeValue("camunda:property[@name='approvalLevel']/@value");
        return Integer.parseInt(level != null ? level : "0");
    }

    private int getSLAHours(DelegateTask task) {
        String sla = task.getExecution()
            .getBpmnModelElementInstance()
            .getAttributeValue("camunda:property[@name='slaHours']/@value");
        return Integer.parseInt(sla != null ? sla : "4");
    }

    private String getCandidateGroup(DelegateTask task) {
        return task.getCandidates().stream()
            .filter(c -> c instanceof org.camunda.bpm.engine.task.IdentityLink)
            .map(c -> ((org.camunda.bpm.engine.task.IdentityLink) c).getGroupId())
            .findFirst()
            .orElse(null);
    }
}
```

### 5.2 Approval Audit Listener

```java
package com.ulms.workflow.listener;

import org.camunda.bpm.engine.delegate.DelegateTask;
import org.camunda.bpm.engine.delegate.TaskListener;
import org.springframework.stereotype.Component;

@Component("approvalAuditListener")
@RequiredArgsConstructor
@Slf4j
public class ApprovalAuditListener implements TaskListener {

    private final ApprovalLogRepository approvalLogRepository;
    private final WorkflowTaskRepository taskRepository;
    private final LoanRepository loanRepository;
    private final KafkaEventPublisher eventPublisher;

    @Override
    public void notify(DelegateTask delegateTask) {
        Long loanId = (Long) delegateTask.getVariable("loanId");
        String decision = (String) delegateTask.getVariable("decision");
        String comments = (String) delegateTask.getVariable("comments");
        String assignee = delegateTask.getAssignee();
        int approvalLevel = (Integer) delegateTask.getVariable("currentApprovalLevel");

        log.info("Task completed - Loan: {}, Level: L{}, Decision: {}, By: {}",
            loanId, approvalLevel, decision, assignee);

        // Get loan and check SLA
        Loan loan = loanRepository.findById(loanId).orElse(null);
        boolean slaBreached = loan != null &&
            loan.getApprovalSlaDueAt() != null &&
            Instant.now().isAfter(loan.getApprovalSlaDueAt());

        // Create approval log
        ApprovalLog approvalLog = ApprovalLog.builder()
            .loanId(loanId)
            .taskId(delegateTask.getId())
            .approvalLevel(approvalLevel)
            .approverUserId(assignee)
            .decision(ApprovalDecision.valueOf(decision))
            .comments(comments)
            .approvedAt(Instant.now())
            .slaDueAt(loan != null ? loan.getApprovalSlaDueAt() : null)
            .isSlaBreached(slaBreached)
            .build();

        approvalLogRepository.save(approvalLog);

        // Update workflow task
        taskRepository.findByTaskId(delegateTask.getId())
            .ifPresent(task -> {
                task.setCompletedAt(Instant.now());
                task.setCompletedBy(assignee);
                task.setDecision(decision);
                task.setStatus(TaskStatus.COMPLETED);
                task.setIsSlaBreached(slaBreached);
                taskRepository.save(task);
            });

        // Set variables for next step
        delegateTask.setVariable("lastApproverId", assignee);
        delegateTask.setVariable("lastApprovalLevel", approvalLevel);
        delegateTask.setVariable("lastDecision", decision);

        // Publish event
        eventPublisher.publishApprovalDecisionEvent(loanId, approvalLevel, decision, assignee);
    }
}
```

---

## 6. Process Variables Schema

### 6.1 Process Variables Definition

```java
package com.ulms.workflow.variable;

import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * Process variables schema for loan-approval-process
 */
@Data
public class LoanApprovalProcessVariables {

    // ════════════════════════════════════════════════════════════════════════
    // LOAN IDENTIFICATION
    // ════════════════════════════════════════════════════════════════════════
    private Long loanId;                    // Loan ID in database
    private String applicationNumber;       // Application reference number
    private Long clientId;                  // Customer ID
    private String clientNid;               // Customer NID
    private String branchId;                // Originating branch

    // ════════════════════════════════════════════════════════════════════════
    // LOAN DETAILS
    // ════════════════════════════════════════════════════════════════════════
    private BigDecimal loanAmount;          // Proposed principal
    private String productCode;             // Loan product code
    private String productCategory;         // PERSONAL, HOME, AUTO, SME, etc.
    private String customerType;            // INDIVIDUAL, CORPORATE, SME

    // ════════════════════════════════════════════════════════════════════════
    // CIB RESULTS
    // ════════════════════════════════════════════════════════════════════════
    private Integer cibScore;               // CIB score (0-1000)
    private String cibStatus;               // CIB inquiry status
    private Integer existingDPD;            // Maximum existing DPD
    private BigDecimal totalExposure;       // Total CIB exposure

    // ════════════════════════════════════════════════════════════════════════
    // CREDIT SCORING
    // ════════════════════════════════════════════════════════════════════════
    private Integer creditScore;            // Calculated credit score
    private String riskGrade;               // LOW, MEDIUM, HIGH, VERY_HIGH
    private BigDecimal dbrPercentage;       // Debt Burden Ratio %

    // ════════════════════════════════════════════════════════════════════════
    // ROUTING RESULT (from DMN)
    // ════════════════════════════════════════════════════════════════════════
    private Integer approvalLevel;          // Required approval level (1-7)
    private String candidateGroup;          // Keycloak role for approval
    private Integer slaHours;               // SLA hours for this level

    // ════════════════════════════════════════════════════════════════════════
    // APPROVAL TRACKING
    // ════════════════════════════════════════════════════════════════════════
    private Integer currentApprovalLevel;   // Current level being processed
    private String lastApproverId;          // Last approver user ID
    private Integer lastApprovalLevel;      // Last approval level
    private String lastDecision;            // APPROVE, REJECT, RETURN
    private String decision;                // Current task decision
    private String comments;                // Approval/rejection comments

    // ════════════════════════════════════════════════════════════════════════
    // TENANT CONTEXT
    // ════════════════════════════════════════════════════════════════════════
    private String tenantId;                // Multi-tenant identifier
}
```

### 6.2 Variable Types Reference

| Variable | Type | Set By | Description |
|----------|------|--------|-------------|
| loanId | Long | Start Event | Primary loan identifier |
| loanAmount | BigDecimal | Validate Task | Proposed principal amount |
| cibScore | Integer | CIB Task | Credit bureau score |
| riskGrade | String | Scoring Task | Risk classification |
| approvalLevel | Integer | DMN Task | Required approval level |
| candidateGroup | String | DMN Task | Keycloak role |
| decision | String | User Task | Approval decision |

---

## 7. Kafka Event Integration

### 7.1 Kafka Event Publisher

```java
package com.ulms.workflow.event;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class KafkaEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ObjectMapper objectMapper;

    private static final String TOPIC_LOAN_APPLICATIONS = "loan.applications";
    private static final String TOPIC_LOAN_APPROVALS = "loan.approvals";
    private static final String TOPIC_LOAN_STATUS = "loan.status-changes";

    /**
     * Publish loan approval event
     */
    public void publishLoanApprovedEvent(Loan loan, int finalLevel) {
        LoanApprovalEvent event = LoanApprovalEvent.builder()
            .eventId(UUID.randomUUID().toString())
            .eventType("LOAN_APPROVED")
            .timestamp(Instant.now())
            .loanId(loan.getId())
            .applicationNumber(loan.getApplicationRef())
            .clientId(loan.getClientId())
            .branchId(loan.getBranchId())
            .loanAmount(loan.getApprovedPrincipal())
            .productCode(loan.getProductCode())
            .finalApprovalLevel(finalLevel)
            .approvedBy(loan.getApprovedBy())
            .tenantId(TenantContext.getCurrentTenant())
            .build();

        sendEvent(TOPIC_LOAN_APPROVALS, loan.getId().toString(), event);
        log.info("Published LOAN_APPROVED event for loan: {}", loan.getId());
    }

    /**
     * Publish approval decision event
     */
    public void publishApprovalDecisionEvent(Long loanId, int level,
                                             String decision, String approverId) {
        ApprovalDecisionEvent event = ApprovalDecisionEvent.builder()
            .eventId(UUID.randomUUID().toString())
            .eventType("APPROVAL_DECISION_" + decision)
            .timestamp(Instant.now())
            .loanId(loanId)
            .approvalLevel(level)
            .decision(decision)
            .approverId(approverId)
            .tenantId(TenantContext.getCurrentTenant())
            .build();

        sendEvent(TOPIC_LOAN_APPROVALS, loanId.toString(), event);
        log.info("Published approval decision event - Loan: {}, Level: L{}, Decision: {}",
            loanId, level, decision);
    }

    /**
     * Publish from BPMN process
     */
    public void publishApprovalEvent(DelegateExecution execution, String eventType) {
        Long loanId = (Long) execution.getVariable("loanId");
        String applicationNumber = (String) execution.getVariable("applicationNumber");
        BigDecimal loanAmount = (BigDecimal) execution.getVariable("loanAmount");

        LoanStatusEvent event = LoanStatusEvent.builder()
            .eventId(UUID.randomUUID().toString())
            .eventType(eventType)
            .timestamp(Instant.now())
            .loanId(loanId)
            .applicationNumber(applicationNumber)
            .processInstanceId(execution.getProcessInstanceId())
            .newStatus(eventType.equals("APPROVED") ? "APPROVED" : "REJECTED")
            .loanAmount(loanAmount)
            .tenantId(TenantContext.getCurrentTenant())
            .build();

        sendEvent(TOPIC_LOAN_STATUS, loanId.toString(), event);
    }

    private void sendEvent(String topic, String key, Object event) {
        kafkaTemplate.send(topic, key, event)
            .addCallback(
                result -> log.debug("Event sent to {}: {}", topic, key),
                failure -> log.error("Failed to send event to {}: {}", topic, failure.getMessage())
            );
    }
}
```

### 7.2 Kafka Event Schemas

```java
@Data
@Builder
public class LoanApprovalEvent {
    private String eventId;
    private String eventType;
    private Instant timestamp;
    private Long loanId;
    private String applicationNumber;
    private Long clientId;
    private String branchId;
    private BigDecimal loanAmount;
    private String productCode;
    private Integer finalApprovalLevel;
    private String approvedBy;
    private String tenantId;
}

@Data
@Builder
public class ApprovalDecisionEvent {
    private String eventId;
    private String eventType;
    private Instant timestamp;
    private Long loanId;
    private Integer approvalLevel;
    private String decision;
    private String approverId;
    private String comments;
    private String tenantId;
}
```

---

## 8. Security Configuration

### 8.1 Keycloak Integration

```java
package com.ulms.workflow.security;

import org.camunda.bpm.engine.IdentityService;
import org.camunda.bpm.engine.impl.identity.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class CamundaAuthenticationFilter extends OncePerRequestFilter {

    private final IdentityService identityService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
                String userId = jwt.getClaimAsString("preferred_username");
                List<String> groups = jwt.getClaimAsStringList("groups");
                String tenantId = jwt.getClaimAsString("tenant_id");

                // Set Camunda authentication
                identityService.setAuthentication(userId, groups, Collections.singletonList(tenantId));
            }

            filterChain.doFilter(request, response);
        } finally {
            identityService.clearAuthentication();
        }
    }
}
```

### 8.2 Role to Candidate Group Mapping

| Keycloak Role | Camunda Candidate Group | Approval Level |
|---------------|------------------------|----------------|
| BRANCH_CREDIT_HEAD | BRANCH_CREDIT_HEAD | L1 |
| BRANCH_MANAGER | BRANCH_MANAGER | L2 |
| REGIONAL_MANAGER | REGIONAL_MANAGER | L3 |
| HEAD_OF_CREDIT | HEAD_OF_CREDIT | L4 |
| CREDIT_COMMITTEE | CREDIT_COMMITTEE | L5 |
| DEPUTY_MD | DEPUTY_MD | L6 |
| MANAGING_DIRECTOR | MANAGING_DIRECTOR | L7 |

---

## 9. Monitoring and Operations

### 9.1 Workflow Metrics

```java
package com.ulms.workflow.metrics;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import io.micrometer.core.instrument.Counter;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class WorkflowMetricsCollector {

    private final MeterRegistry meterRegistry;

    @PostConstruct
    public void registerMetrics() {
        // Process instance counters
        Counter.builder("ulms.workflow.process.started")
            .description("Workflow processes started")
            .tag("process", "loan-approval")
            .register(meterRegistry);

        Counter.builder("ulms.workflow.process.completed")
            .description("Workflow processes completed")
            .tag("process", "loan-approval")
            .tag("outcome", "approved")
            .register(meterRegistry);

        // Task duration timer
        Timer.builder("ulms.workflow.task.duration")
            .description("Task completion duration")
            .tag("process", "loan-approval")
            .publishPercentiles(0.5, 0.95, 0.99)
            .register(meterRegistry);

        // SLA breach counter
        Counter.builder("ulms.workflow.sla.breached")
            .description("SLA breaches by level")
            .register(meterRegistry);
    }

    public void recordTaskCompletion(String taskName, int level, Duration duration) {
        Timer.builder("ulms.workflow.task.duration")
            .tag("task", taskName)
            .tag("level", "L" + level)
            .register(meterRegistry)
            .record(duration);
    }

    public void recordSLABreach(int level) {
        Counter.builder("ulms.workflow.sla.breached")
            .tag("level", "L" + level)
            .register(meterRegistry)
            .increment();
    }
}
```

### 9.2 Prometheus Metrics Endpoint

```yaml
# Prometheus scrape config
management:
  metrics:
    export:
      prometheus:
        enabled: true
    tags:
      application: ulms-workflow-service
      environment: ${SPRING_PROFILES_ACTIVE:production}
  endpoint:
    prometheus:
      enabled: true
```

---

## 10. Error Handling and Compensation

### 10.1 Error Handling Strategy

```java
package com.ulms.workflow.handler;

import org.camunda.bpm.engine.delegate.BpmnError;
import org.camunda.bpm.engine.impl.incident.FailedJobIncidentHandler;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class WorkflowErrorHandler {

    /**
     * Handle CIB service errors
     */
    public void handleCIBError(DelegateExecution execution, Exception e) {
        log.error("CIB check failed for loan {}: {}",
            execution.getVariable("loanId"), e.getMessage());

        if (e instanceof CIBServiceUnavailableException) {
            // Retry later
            throw new BpmnError("CIB_UNAVAILABLE", "CIB service temporarily unavailable");
        } else if (e instanceof CIBInvalidNIDException) {
            // Business error - cannot proceed
            throw new BpmnError("INVALID_NID", "Invalid NID for CIB inquiry");
        }

        // Technical error
        throw new BpmnError("CIB_ERROR", "CIB inquiry failed: " + e.getMessage());
    }

    /**
     * Handle approval task errors
     */
    public void handleApprovalError(DelegateTask task, Exception e) {
        log.error("Approval task error for loan {}: {}",
            task.getVariable("loanId"), e.getMessage());

        // Log to incident table
        recordIncident(task, e);
    }

    private void recordIncident(DelegateTask task, Exception e) {
        // Record in workflow_incident table
    }
}
```

### 10.2 Retry Configuration

```xml
<!-- In BPMN for service tasks that may fail -->
<bpmn:serviceTask id="task_cib_check" name="CIB Inquiry">
  <bpmn:extensionElements>
    <!-- Retry 3 times with 5 minute intervals -->
    <camunda:failedJobRetryTimeCycle>R3/PT5M</camunda:failedJobRetryTimeCycle>
  </bpmn:extensionElements>
</bpmn:serviceTask>
```

---

## 11. Deployment Configuration

### 11.1 Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ulms-workflow-service
  namespace: ulms
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ulms-workflow-service
  template:
    metadata:
      labels:
        app: ulms-workflow-service
    spec:
      containers:
        - name: workflow-service
          image: ulms/workflow-service:1.0.0
          ports:
            - containerPort: 8083
              name: http
            - containerPort: 8093
              name: management
          env:
            - name: SPRING_PROFILES_ACTIVE
              value: "production"
            - name: DB_HOST
              valueFrom:
                secretKeyRef:
                  name: ulms-db-secret
                  key: host
          resources:
            requests:
              memory: "1Gi"
              cpu: "500m"
            limits:
              memory: "2Gi"
              cpu: "1000m"
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8093
            initialDelaySeconds: 60
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8093
            initialDelaySeconds: 30
            periodSeconds: 5
```

---

## 12. Compliance Matrix

### 12.1 Regulatory Compliance

| Requirement | Regulation | Implementation |
|-------------|------------|----------------|
| 7-level approval | BRD 6.3.1 | L1-L7 user tasks |
| SLA tracking | BRD 6.3.2 | Timer boundary events |
| Audit trail | ICT Security V4.0 | Execution listeners, Kafka events |
| Authorization | BRD 6.3.4 | Keycloak integration |
| CIB integration | BB Guidelines | Service task with retry |

### 12.2 Document References

| Reference Document | Location | Relevant Sections |
|-------------------|----------|-------------------|
| Workflow State Machine | Phase_1/Workflow Architecture/ | All sections |
| DMN Decision Tables | Phase_1/Workflow Architecture/ | Section 4 |
| RBAC Authorization Matrix | Phase_1/Security Architecture/ | Section 3 |
| Event Driven Architecture | Phase_1/ARCHITECTURE & DESIGN/ | Section 4 |

---

**Document End**

*This document is part of the ULMS v2.0 Architecture Documentation Suite*

*Last Updated: February 5, 2026*

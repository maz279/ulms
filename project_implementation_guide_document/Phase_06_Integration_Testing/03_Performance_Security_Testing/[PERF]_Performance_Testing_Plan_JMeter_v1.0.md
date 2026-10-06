**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Performance Testing Plan - JMeter |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Performance Test Lead, Unisoft Systems Limited |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Draft |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | Performance Lead | Initial version |

---

# Performance Testing Plan - JMeter

## Table of Contents

1. [Introduction](#1-introduction)
2. [Performance Objectives](#2-performance-objectives)
3. [Test Environment](#3-test-environment)
4. [JMeter Test Plan Structure](#4-jmeter-test-plan-structure)
5. [Load Test Scenarios](#5-load-test-scenarios)
6. [Test Execution Strategy](#6-test-execution-strategy)
7. [Monitoring and Metrics](#7-monitoring-and-metrics)
8. [Results Analysis](#8-results-analysis)
9. [JMeter Scripts](#9-jmeter-scripts)
10. [Related Documents](#10-related-documents)

---

## 1. Introduction

### 1.1 Purpose

This document defines the comprehensive performance testing approach for ULMS v2.0 using Apache JMeter. It covers load testing, stress testing, and endurance testing to ensure the system meets Bangladesh banking sector performance requirements.

### 1.2 Scope

- API performance testing (REST endpoints)
- Database performance validation
- Concurrent user load testing
- End-to-end transaction performance
- Infrastructure resource utilization

---

## 2. Performance Objectives

### 2.1 Target Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Throughput** | 500 RPS sustained | Requests per second |
| **Concurrent Users** | 1000+ | Simultaneous users |
| **Response Time (p50)** | < 500ms | 50th percentile |
| **Response Time (p95)** | < 1500ms | 95th percentile |
| **Response Time (p99)** | < 2000ms | 99th percentile |
| **Error Rate** | < 0.1% | Failed requests % |
| **CPU Utilization** | < 70% | Average during peak |
| **Memory Utilization** | < 80% | Heap usage |
| **Database CPU** | < 70% | PostgreSQL CPU |

### 2.2 Peak Load Scenarios

| Scenario | Users | Duration | Purpose |
|----------|-------|----------|---------|
| Normal Load | 500 | 1 hour | Baseline performance |
| Peak Load | 1000 | 30 min | Maximum capacity |
| Stress Test | 2000 | 15 min | Breaking point |
| Soak Test | 500 | 8 hours | Stability |
| Spike Test | 0→1500→0 | 5 min | Sudden load |

---

## 3. Test Environment

### 3.1 Environment Specification

```yaml
# Performance Test Environment
environment:
  name: "ULMS-Performance-Test"
  
  application:
    replicas: 3
    cpu: 4 cores
    memory: 8 GB
    
  database:
    type: "PostgreSQL 16"
    cpu: 8 cores
    memory: 16 GB
    storage: SSD 500 GB
    
  cache:
    type: "Redis 7"
    memory: 4 GB
    
  message_queue:
    type: "Kafka 3.6"
    nodes: 3
    
  jmeter:
    controller:
      cpu: 4 cores
      memory: 8 GB
    injectors: 5
    per_injector:
      cpu: 8 cores
      memory: 16 GB
```

### 3.2 Network Topology

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PERFORMANCE TEST ENVIRONMENT                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    JMETER CONTROLLER                                 │   │
│   │                    (Test Orchestration)                              │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│        ┌───────────────────────────┼───────────────────────────┐             │
│        │                           │                           │             │
│        ▼                           ▼                           ▼             │
│   ┌─────────┐                ┌─────────┐                ┌─────────┐         │
│   │ INJECTOR│                │ INJECTOR│                │ INJECTOR│         │
│   │   #1    │                │   #2    │                │   #3    │         │
│   │200 users│                │200 users│                │200 users│         │
│   └────┬────┘                └────┬────┘                └────┬────┘         │
│        │                          │                          │              │
│        └──────────────────────────┼──────────────────────────┘              │
│                                   │                                         │
│                                   ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         LOAD BALANCER (Kong)                         │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                         │
│        ┌──────────────────────────┼──────────────────────────┐              │
│        │                          │                          │              │
│        ▼                          ▼                          ▼              │
│   ┌─────────┐                ┌─────────┐                ┌─────────┐        │
│   │  APP    │                │  APP    │                │  APP    │        │
│   │ NODE 1  │                │ NODE 2  │                │ NODE 3  │        │
│   └────┬────┘                └────┬────┘                └────┬────┘        │
│        │                          │                          │             │
│        └──────────────────────────┼──────────────────────────┘             │
│                                   │                                        │
│   ┌───────────────────────────────▼─────────────────────────────────────┐  │
│   │                    POSTGRESQL + REDIS + KAFKA                        │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. JMeter Test Plan Structure

### 4.1 Test Plan Organization

```
ULMS_Performance_Test_Plan.jmx
│
├── Thread Groups
│   ├── Loan Application Flow (300 users)
│   ├── Loan Inquiry (400 users)
│   ├── Repayment Processing (200 users)
│   └── Report Generation (100 users)
│
├── Configuration Elements
│   ├── HTTP Request Defaults
│   ├── HTTP Cookie Manager
│   ├── HTTP Header Manager
│   ├── CSV Data Set Config
│   ├── User Defined Variables
│   └── JDBC Connection Configuration
│
├── Pre Processors
│   ├── JSR223 PreProcessor (Token Generation)
│   └── User Parameters
│
├── Samplers
│   ├── HTTP Request (Login)
│   ├── HTTP Request (Create Loan)
│   ├── HTTP Request (Get Loan)
│   ├── HTTP Request (Update Loan)
│   └── JDBC Request (Validate DB)
│
├── Post Processors
│   ├── JSON Extractor (Token)
│   ├── JSON Extractor (Loan ID)
│   └── JSR223 PostProcessor (Assertions)
│
├── Assertions
│   ├── Response Assertion
│   ├── Duration Assertion
│   └── JSON Assertion
│
├── Listeners
│   ├── View Results Tree (Debug)
│   ├── Aggregate Report
│   ├── Response Time Graph
│   ├── Backend Listener (InfluxDB)
│   └── Summary Report
│
└── Timers
    ├── Gaussian Random Timer
    └── Constant Throughput Timer
```

### 4.2 JMeter Properties

```properties
# jmeter.properties for ULMS Testing

# Thread settings
jmeter.threads.verifythreadgroup.onstart=false

# HTTP settings
httpclient.timeout=30000
httpclient.socket.http.cps=0
httpclient.socket.https.cps=0

# CSV dataset settings
csvdataset.file.encoding=UTF-8

# Reporting settings
jmeter.reportgenerator.overall_granularity=1000
jmeter.reportgenerator.response_heatmap_granularity=1000

# Backend listener (InfluxDB)
jmeter.reportgenerator.exporter.influxdb.url=http://influxdb:8086
jmeter.reportgenerator.exporter.influxdb.database=jmeter
```

---

## 5. Load Test Scenarios

### 5.1 Scenario 1: Loan Application Submission

```xml
<!-- Loan Application Thread Group -->
<ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="Loan Application Flow">
  <stringProp name="ThreadGroup.num_threads">300</stringProp>
  <stringProp name="ThreadGroup.ramp_time">300</stringProp>
  <stringProp name="ThreadGroup.duration">3600</stringProp>
  
  <elementProp name="ThreadGroup.arguments" elementType="Arguments">
    <collectionProp name="Arguments.arguments">
      <elementProp name="base_url" elementType="Argument">
        <stringProp name="Argument.value">${__P(base_url,ulms-test.bank.com)}</stringProp>
      </elementProp>
      <elementProp name="port" elementType="Argument">
        <stringProp name="Argument.value">${__P(port,8080)}</stringProp>
      </elementProp>
    </collectionProp>
  </elementProp>
</ThreadGroup>

<!-- CSV Data Set for Test Users -->
<CSVDataSet guiclass="TestBeanGUI" testclass="CSVDataSet" testname="Test Users">
  <stringProp name="filename">test-users.csv</stringProp>
  <stringProp name="variableNames">username,password,nid</stringProp>
  <boolProp name="ignoreFirstLine">true</boolProp>
  <stringProp name="delimiter">,</stringProp>
  <boolProp name="quotedData">false</boolProp>
  <stringProp name="recycle">true</stringProp>
  <stringProp name="shareMode">shareMode.all</stringProp>
</CSVDataSet>

<!-- Login Request -->
<HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="1. Login">
  <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
    <collectionProp name="Arguments.arguments">
      <elementProp name="" elementType="HTTPArgument">
        <boolProp name="HTTPArgument.always_encode">false</boolProp>
        <stringProp name="Argument.value">{
          "username": "${username}",
          "password": "${password}"
        }</stringProp>
        <stringProp name="Argument.metadata">=</stringProp>
      </elementProp>
    </collectionProp>
  </elementProp>
  <stringProp name="HTTPSampler.domain">${base_url}</stringProp>
  <stringProp name="HTTPSampler.port">${port}</stringProp>
  <stringProp name="HTTPSampler.path">/api/auth/login</stringProp>
  <stringProp name="HTTPSampler.method">POST</stringProp>
</HTTPSamplerProxy>

<!-- Extract Auth Token -->
<JSONPostProcessor guiclass="JSONPostProcessorGui" testclass="JSONPostProcessor" testname="Extract Token">
  <stringProp name="JSONPostProcessor.referenceNames">authToken</stringProp>
  <stringProp name="JSONPostProcessor.jsonPathExprs">$.data.token</stringProp>
  <stringProp name="JSONPostProcessor.match_numbers">1</stringProp>
</JSONPostProcessor>

<!-- Create Loan Application -->
<HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="2. Create Loan Application">
  <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
    <collectionProp name="Arguments.arguments">
      <elementProp name="" elementType="HTTPArgument">
        <stringProp name="Argument.value">{
          "borrowerNid": "${nid}",
          "loanAmount": ${__Random(50000,5000000)},
          "tenureMonths": ${__Random(12,60)},
          "loanPurpose": "Business Expansion",
          "productCode": "SME-WC-001"
        }</stringProp>
      </elementProp>
    </collectionProp>
  </elementProp>
  <stringProp name="HTTPSampler.domain">${base_url}</stringProp>
  <stringProp name="HTTPSampler.port">${port}</stringProp>
  <stringProp name="HTTPSampler.path">/api/loans</stringProp>
  <stringProp name="HTTPSampler.method">POST</stringProp>
</HTTPSamplerProxy>

<!-- Header Manager for Auth -->
<HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="HTTP Headers">
  <collectionProp name="HeaderManager.headers">
    <elementProp name="" elementType="Header">
      <stringProp name="Header.name">Authorization</stringProp>
      <stringProp name="Header.value">Bearer ${authToken}</stringProp>
    </elementProp>
    <elementProp name="" elementType="Header">
      <stringProp name="Header.name">Content-Type</stringProp>
      <stringProp name="Header.value">application/json</stringProp>
    </elementProp>
  </collectionProp>
</HeaderManager>

<!-- Response Time Assertion -->
<DurationAssertion guiclass="DurationAssertionGui" testclass="DurationAssertion" testname="Max Response Time">
  <stringProp name="DurationAssertion.duration">2000</stringProp>
</DurationAssertion>

<!-- Response Code Assertion -->
<ResponseAssertion guiclass="AssertionGui" testclass="ResponseAssertion" testname="Status Code 200">
  <collectionProp name="Asserion.test_strings">
    <stringProp name="49586">200</stringProp>
  </collectionProp>
  <stringProp name="Assertion.test_field">Assertion.response_code</stringProp>
</ResponseAssertion>

<!-- Backend Listener for Grafana -->
<BackendListener guiclass="BackendListenerGui" testclass="BackendListener" testname="InfluxDB Backend">
  <elementProp name="arguments" elementType="Arguments">
    <collectionProp name="Arguments.arguments">
      <elementProp name="influxdbUrl" elementType="Argument">
        <stringProp name="Argument.value">http://influxdb:8086/write?db=jmeter</stringProp>
      </elementProp>
      <elementProp name="application" elementType="Argument">
        <stringProp name="Argument.value">ulms-perf-test</stringProp>
      </elementProp>
      <elementProp name="measurement" elementType="Argument">
        <stringProp name="Argument.value">jmeter</stringProp>
      </elementProp>
    </collectionProp>
  </elementProp>
  <stringProp name="classname">org.apache.jmeter.visualizers.backend.influxdb.InfluxdbBackendListenerClient</stringProp>
</BackendListener>
```

### 5.2 Scenario 2: Loan Inquiry Load

```xml
<ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="Loan Inquiry">
  <stringProp name="ThreadGroup.num_threads">400</stringProp>
  <stringProp name="ThreadGroup.ramp_time">240</stringProp>
  <stringProp name="ThreadGroup.duration">3600</stringProp>
</ThreadGroup>

<!-- Random Loan ID CSV -->
<CSVDataSet guiclass="TestBeanGUI" testclass="CSVDataSet" testname="Loan IDs">
  <stringProp name="filename">loan-ids.csv</stringProp>
  <stringProp name="variableNames">loanId</stringProp>
  <boolProp name="ignoreFirstLine">true</boolProp>
  <stringProp name="shareMode">shareMode.all</stringProp>
</CSVDataSet>

<!-- Get Loan Details -->
<HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="Get Loan Details">
  <stringProp name="HTTPSampler.domain">${base_url}</stringProp>
  <stringProp name="HTTPSampler.port">${port}</stringProp>
  <stringProp name="HTTPSampler.path">/api/loans/${loanId}</stringProp>
  <stringProp name="HTTPSampler.method">GET</stringProp>
</HTTPSamplerProxy>

<!-- Search Loans -->
<HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="Search Loans">
  <stringProp name="HTTPSampler.domain">${base_url}</stringProp>
  <stringProp name="HTTPSampler.port">${port}</stringProp>
  <stringProp name="HTTPSampler.path">/api/loans/search</stringProp>
  <stringProp name="HTTPSampler.method">POST</stringProp>
  <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
    <collectionProp name="Arguments.arguments">
      <elementProp name="" elementType="HTTPArgument">
        <stringProp name="Argument.value">{
          "status": "${__RandomFromMultipleVar(PENDING|APPROVED|DISBURSED)}",
          "page": 0,
          "size": 20
        }</stringProp>
      </elementProp>
    </collectionProp>
  </elementProp>
</HTTPSamplerProxy>

<!-- Throughput Timer -->
<ConstantThroughputTimer guiclass="TestBeanGUI" testclass="ConstantThroughputTimer" testname="Throughput">
  <doubleProp>
    <name>throughput</name>
    <value>150.0</value>
    <savedValue>0.0</savedValue>
  </doubleProp>
  <intProp name="calcMode">1</intProp>
</ConstantThroughputTimer>
```

---

## 6. Test Execution Strategy

### 6.1 Execution Phases

| Phase | Users | Ramp-up | Duration | Purpose |
|-------|-------|---------|----------|---------|
| Warm-up | 50 | 5 min | 15 min | Stabilize system |
| Baseline | 250 | 10 min | 30 min | Establish baseline |
| Normal Load | 500 | 15 min | 60 min | Production simulation |
| Peak Load | 1000 | 20 min | 30 min | Capacity test |
| Stress Test | 2000 | 30 min | 15 min | Breaking point |
| Recovery | 100 | 5 min | 30 min | Recovery validation |

### 6.2 Execution Commands

```bash
#!/bin/bash
# run-performance-tests.sh

JMETER_HOME=/opt/apache-jmeter-5.6
TEST_PLAN=ULMS_Performance_Test_Plan.jmx
REPORT_DIR=./reports/$(date +%Y%m%d_%H%M%S)

# Set JVM options for JMeter
export HEAP="-Xms4g -Xmx8g"

# Run test with different user loads
for USERS in 250 500 1000 2000; do
  echo "Running test with $USERS users..."
  
  $JMETER_HOME/bin/jmeter \
    -n \
    -t $TEST_PLAN \
    -Jusers=$USERS \
    -Jrampup=$((USERS/10)) \
    -Jduration=1800 \
    -Jbase_url=ulms-perf.bank.com \
    -l $REPORT_DIR/results_$USERS.jtl \
    -e \
    -o $REPORT_DIR/dashboard_$USERS
    
  echo "Test completed for $USERS users"
  sleep 300  # 5 min cooldown
done

# Generate consolidated report
echo "Generating consolidated report..."
$JMETER_HOME/bin/jmeter -g $REPORT_DIR/results_*.jtl -o $REPORT_DIR/consolidated
```

---

## 7. Monitoring and Metrics

### 7.1 Key Metrics Collection

| Category | Metric | Tool | Threshold |
|----------|--------|------|-----------|
| **Response Time** | Average, p50, p95, p99 | JMeter | < 2000ms |
| **Throughput** | Requests/sec | JMeter | > 500 RPS |
| **Error Rate** | Failed requests % | JMeter | < 0.1% |
| **CPU** | Application server % | Prometheus | < 70% |
| **Memory** | Heap usage % | Prometheus | < 80% |
| **Database** | Query time, connections | pg_stat_statements | < 100ms |
| **Network** | Bandwidth, latency | Network monitor | < 10ms |

### 7.2 Grafana Dashboard Configuration

```json
{
  "dashboard": {
    "title": "ULMS Performance Testing",
    "panels": [
      {
        "title": "Response Time",
        "targets": [
          {
            "expr": "jmeter.all.h.avg",
            "legendFormat": "Average"
          },
          {
            "expr": "jmeter.all.h.p95",
            "legendFormat": "p95"
          },
          {
            "expr": "jmeter.all.h.p99",
            "legendFormat": "p99"
          }
        ]
      },
      {
        "title": "Throughput",
        "targets": [
          {
            "expr": "jmeter.all.h.count",
            "legendFormat": "Requests/sec"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "jmeter.all.ko.count / jmeter.all.h.count * 100",
            "legendFormat": "Error %"
          }
        ]
      },
      {
        "title": "Active Users",
        "targets": [
          {
            "expr": "jmeter.test.startedThreads",
            "legendFormat": "Active Threads"
          }
        ]
      }
    ]
  }
}
```

---

## 8. Results Analysis

### 8.1 Performance Report Template

```markdown
# Performance Test Report

## Executive Summary
- **Test Date**: [Date]
- **Test Duration**: [Duration]
- **Total Users**: [Number]
- **Status**: [PASS/FAIL]

## Key Results

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Throughput | 500 RPS | [X] RPS | [PASS/FAIL] |
| p95 Response Time | < 1500ms | [X] ms | [PASS/FAIL] |
| p99 Response Time | < 2000ms | [X] ms | [PASS/FAIL] |
| Error Rate | < 0.1% | [X]% | [PASS/FAIL] |

## Bottlenecks Identified
1. [Issue description]
2. [Issue description]

## Recommendations
1. [Recommendation]
2. [Recommendation]
```

---

## 9. JMeter Scripts

### 9.1 CLI Execution Options

```bash
# Basic execution
jmeter -n -t ULMS_Test_Plan.jmx -l results.jtl

# With properties
jmeter -n -t ULMS_Test_Plan.jmx \
  -Jusers=1000 \
  -Jrampup=300 \
  -Jduration=3600 \
  -Jbase_url=ulms.bank.com \
  -l results.jtl \
  -e -o dashboard

# Distributed testing
jmeter -n -t ULMS_Test_Plan.jmx \
  -R injector1,injector2,injector3,injector4,injector5 \
  -l results.jtl
```

---

## 10. Related Documents

| Document | Purpose |
|----------|---------|
| `[PERF]_Load_Testing_Scenarios_v1.0.md` | Detailed load test scenarios |
| `[PERF]_Database_Performance_Testing_v1.0.md` | Database performance testing |
| `[TEST]_Master_Test_Strategy_Document_v1.0.md` | Overall test strategy |

---

**Document Owner:** Performance Test Lead, Unisoft Systems Limited  
**Next Review Date:** 2026-03-05  
**Classification:** Internal

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

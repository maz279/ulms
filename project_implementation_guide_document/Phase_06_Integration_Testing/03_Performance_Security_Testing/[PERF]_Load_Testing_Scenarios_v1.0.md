**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Load Testing Scenarios |
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

# Load Testing Scenarios

## Table of Contents

1. [Introduction](#1-introduction)
2. [Load Testing Types](#2-load-testing-types)
3. [Normal Load Scenarios](#3-normal-load-scenarios)
4. [Peak Load Scenarios](#4-peak-load-scenarios)
5. [Spike Testing](#5-spike-testing)
6. [Soak Testing](#6-soak-testing)
7. [Stress Testing](#7-stress-testing)
8. [Volume Testing](#8-volume-testing)
9. [Test Data Requirements](#9-test-data-requirements)
10. [Related Documents](#10-related-documents)

---

## 1. Introduction

### 1.1 Purpose

This document defines comprehensive load testing scenarios for ULMS v2.0, covering normal operations, peak loads, and extreme conditions to ensure the system performs reliably under all expected and unexpected conditions.

### 1.2 Test Categories

| Category | Description | Duration |
|----------|-------------|----------|
| Normal Load | Expected daily operations | 1-2 hours |
| Peak Load | Maximum expected usage | 30-60 minutes |
| Spike Test | Sudden traffic increases | 5-10 minutes |
| Soak Test | Extended operations | 8-24 hours |
| Stress Test | Beyond capacity limits | Until failure |
| Volume Test | Large data processing | Varies |

---

## 2. Load Testing Types

### 2.1 Test Type Matrix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LOAD TESTING TYPE MATRIX                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Test Type      │  Load Level  │  Duration   │  Purpose                   │
│   ───────────────────────────────────────────────────────────────────────   │
│   Normal Load    │  60-80%      │  1-2 hours  │  Baseline performance      │
│   Peak Load      │  100%        │  30-60 min  │  Maximum capacity          │
│   Spike Test     │  0→150%→0    │  5-10 min   │  Sudden load handling      │
│   Soak Test      │  70%         │  8-24 hours │  Memory leak detection     │
│   Stress Test    │  120-200%    │  Until fail │  Breaking point            │
│   Volume Test    │  Varies      │  Varies     │  Data capacity             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Normal Load Scenarios

### 3.1 Business Hours Simulation

| Time | Users | Activity Mix | RPS Target |
|------|-------|--------------|------------|
| 09:00-10:00 | 300 | Morning ramp-up | 200 |
| 10:00-12:00 | 500 | Peak morning | 350 |
| 12:00-13:00 | 400 | Lunch dip | 250 |
| 13:00-16:00 | 550 | Afternoon peak | 400 |
| 16:00-17:00 | 350 | End of day | 250 |
| 17:00-18:00 | 200 | Evening taper | 150 |

### 3.2 Transaction Mix - Normal Load

| Transaction | Percentage | Users | Frequency |
|-------------|------------|-------|-----------|
| Loan Application | 25% | 125 | Every 10 min |
| Loan Inquiry | 35% | 175 | Every 5 min |
| Document Upload | 15% | 75 | Every 15 min |
| Repayment | 15% | 75 | Every 10 min |
| Report Generation | 10% | 50 | Every 30 min |

### 3.3 JMeter Configuration

```xml
<ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="Normal Load - Business Hours">
  <stringProp name="ThreadGroup.num_threads">500</stringProp>
  <stringProp name="ThreadGroup.ramp_time">600</stringProp>
  <stringProp name="ThreadGroup.duration">36000</stringProp> <!-- 10 hours -->
  
  <!-- Loan Application Thread Group -->
  <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="Loan Applications (25%)">
    <stringProp name="ThreadGroup.num_threads">125</stringProp>
    <stringProp name="ThreadGroup.ramp_time">300</stringProp>
    <stringProp name="ThreadGroup.duration">36000</stringProp>
  </ThreadGroup>
  
  <!-- Loan Inquiry Thread Group -->
  <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="Loan Inquiries (35%)">
    <stringProp name="ThreadGroup.num_threads">175</stringProp>
    <stringProp name="ThreadGroup.ramp_time">300</stringProp>
    <stringProp name="ThreadGroup.duration">36000</stringProp>
  </ThreadGroup>
  
  <!-- Other thread groups similarly configured -->
</ThreadGroup>
```

---

## 4. Peak Load Scenarios

### 4.1 Monthly End Processing

| Activity | Users | Transactions | Description |
|----------|-------|--------------|-------------|
| Report Generation | 100 | 500/hour | Month-end reports |
| Classification Updates | 150 | 1000/hour | DPD processing |
| CIB Batch Updates | 50 | 200/hour | CIB report generation |
| Statement Generation | 200 | 2000/hour | Customer statements |

### 4.2 Peak Load Profile

```
Users
 │
1000├────────────────────────────┐
    │                            │
 800├──────────┐                 │
    │          │                 │
 600├──────┐   │   ┌─────────┐   │
    │      │   │   │         │   │
 400├──┐   │   └───┘         └───┘
    │  │   │
 200├──┘   │
    │      │
   0├──────┴───┬───┬───┬───┬───┬───▶ Time (hours)
    0         1   2   3   4   5
```

### 4.3 Peak Load Test Configuration

```bash
#!/bin/bash
# peak-load-test.sh

# Phase 1: Ramp to 600 users (5 min)
# Phase 2: Hold at 600 users (10 min)
# Phase 3: Spike to 1000 users (2 min ramp)
# Phase 4: Hold at 1000 users (30 min)
# Phase 5: Ramp down (5 min)

jmeter -n -t ULMS_Peak_Load.jmx \
  -Jphase1_users=600 \
  -Jphase1_ramp=300 \
  -Jphase1_hold=600 \
  -Jphase2_users=1000 \
  -Jphase2_ramp=120 \
  -Jphase2_hold=1800 \
  -l peak_load_results.jtl \
  -e -o peak_load_report
```

---

## 5. Spike Testing

### 5.1 Spike Scenarios

| Scenario | Normal Load | Spike Load | Duration | Recovery |
|----------|-------------|------------|----------|----------|
| Sudden Market News | 300 | 1200 | 5 min | 10 min |
| Loan Campaign Launch | 200 | 1500 | 10 min | 15 min |
| End of Financial Year | 400 | 1800 | 15 min | 20 min |
| System Recovery | 0 | 1000 | 2 min | 10 min |

### 5.2 Spike Test Pattern

```
Users
 │
1800├              ┌────┐
    │              │    │
1500├              │    │     ┌────────┐
    │              │    │     │        │
1200├     ┌───┐    │    │     │        │
    │     │   │    │    │     │        │
 900├─────┤   │    │    │     │        │
    │     │   │    │    │     │        │
 600├     │   │────┘    └─────┤        │
    │     │   │               │        │
 300├─────┘   │               │        │
    │         │               │        │
   0├─────────┴───────────────┴────────┴───▶ Time
    0    5    10   15   20   25   30   35   40 (min)
```

### 5.3 Spike Test JMeter Configuration

```xml
<ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="Spike Test">
  <!-- Use Ultimate Thread Group for complex patterns -->
  <kg.apc.jmeter.threads.UltimateThreadGroup guiclass="kg.apc.jmeter.threads.UltimateThreadGroupGui" 
    testclass="kg.apc.jmeter.threads.UltimateThreadGroup" testname="Ultimate Thread Group">
    <collectionProp name="ultimatethreadgroupdata">
      <!-- Initial load: 300 users -->
      <collectionProp name="-1204532325">
        <stringProp name="100">300</stringProp>    <!-- Start threads -->
        <stringProp name="0">0</stringProp>         <!-- Initial delay -->
        <stringProp name="100">300</stringProp>    <!-- Startup time -->
        <stringProp name="100">300</stringProp>    <!-- Hold load -->
        <stringProp name="100">60</stringProp>     <!-- Shutdown time -->
      </collectionProp>
      <!-- First spike: 1200 users at 5 min -->
      <collectionProp name="-1204532326">
        <stringProp name="100">900</stringProp>    <!-- Additional threads -->
        <stringProp name="0">300</stringProp>      <!-- Start at 5 min -->
        <stringProp name="100">60</stringProp>     <!-- Ramp in 1 min -->
        <stringProp name="100">300</stringProp>    <!-- Hold for 5 min -->
        <stringProp name="100">60</stringProp>     <!-- Shutdown in 1 min -->
      </collectionProp>
      <!-- Second spike: 1500 users at 15 min -->
      <collectionProp name="-1204532327">
        <stringProp name="100">1200</stringProp>   <!-- Additional threads -->
        <stringProp name="0">900</stringProp>      <!-- Start at 15 min -->
        <stringProp name="100">120</stringProp>    <!-- Ramp in 2 min -->
        <stringProp name="100">600</stringProp>    <!-- Hold for 10 min -->
        <stringProp name="100">300</stringProp>    <!-- Shutdown in 5 min -->
      </collectionProp>
    </collectionProp>
  </kg.apc.jmeter.threads.UltimateThreadGroup>
</ThreadGroup>
```

---

## 6. Soak Testing

### 6.1 Soak Test Objectives

| Objective | Target | Measurement |
|-----------|--------|-------------|
| Memory Leak Detection | Zero growth | Heap usage stable |
| Connection Pool Exhaustion | No failures | Connection count stable |
| Log File Growth | < 10 GB/day | Log rotation working |
| Database Performance | No degradation | Query time stable |
| Resource Cleanup | Complete | No orphaned resources |

### 6.2 24-Hour Soak Test Profile

```
Users
 │
 700├────────────────────────────────────────────────────────────┐
    │                                                            │
 600├────────────────────────────────────────────────────────────┤
    │                                                            │
 500├────────────────────────────────────────────────────────────┤
    │                                                            │
 400├────────────────────────────────────────────────────────────┤
    │                                                            │
 300├────────────────────────────────────────────────────────────┤
    │                                                            │
 200├────────────────────────────────────────────────────────────┤
    │                                                            │
 100├────────────────────────────────────────────────────────────┤
    │                                                            │
   0├────────────────────────────────────────────────────────────┘
    0    4    8   12   16   20   24 (hours)
    
    Continuous load of 500 users for 24 hours
    Transaction mix: Normal business operations
```

### 6.3 Soak Test Configuration

```bash
#!/bin/bash
# soak-test.sh

# 24-hour soak test at 70% capacity (500 users)

jmeter -n -t ULMS_Soak_Test.jmx \
  -Jusers=500 \
  -Jrampup=1800 \
  -Jduration=86400 \
  -Jthink_time_min=2000 \
  -Jthink_time_max=5000 \
  -l soak_test_24h.jtl \
  -e -o soak_test_report

# Monitor system metrics every 5 minutes
./monitor-system-metrics.sh &
MONITOR_PID=$!

# Wait for JMeter to complete
wait

# Stop monitoring
kill $MONITOR_PID

# Generate trend analysis
./analyze-soak-trends.sh soak_test_24h.jtl
```

---

## 7. Stress Testing

### 7.1 Stress Test Approach

| Phase | Users | RPS | Duration | Purpose |
|-------|-------|-----|----------|---------|
| Warm-up | 100 | 50 | 5 min | Baseline |
| Ramp 1 | 500 | 250 | 10 min | Normal load |
| Ramp 2 | 1000 | 500 | 10 min | Target load |
| Ramp 3 | 1500 | 750 | 10 min | Overload |
| Ramp 4 | 2000 | 1000 | Until fail | Breaking point |

### 7.2 Stress Test Results Template

```markdown
# Stress Test Report

## Test Configuration
- **Start Time**: [Timestamp]
- **Initial Users**: 100
- **Max Users Attempted**: 2000
- **Duration**: [Duration]

## Breaking Point Analysis

| Metric | At Break | Normal | Degradation |
|--------|----------|--------|-------------|
| Max Users | [X] | 1000 | [X%] |
| Response Time | [X] ms | 500 ms | [X%] |
| Error Rate | [X]% | 0.1% | [X%] |
| CPU Usage | [X]% | 70% | [X%] |
| Memory Usage | [X]% | 80% | [X%] |

## First Failure
- **Users at Failure**: [X]
- **Error Type**: [Type]
- **Component**: [Component]
- **Stack Trace**: [Trace]

## Recovery Test
- **Recovery Time**: [X] seconds
- **Data Integrity**: [PASS/FAIL]
- **Service Restoration**: [PASS/FAIL]
```

### 7.3 Stress Test JMeter Configuration

```xml
<kg.apc.jmeter.threads.SteppingThreadGroup guiclass="kg.apc.jmeter.threads.SteppingThreadGroupGui" 
  testclass="kg.apc.jmeter.threads.SteppingThreadGroup" testname="Stress Test - Stepping">
  <stringProp name="ThreadGroup.num_threads">2000</stringProp>
  <stringProp name="Threads initial delay">0</stringProp>
  <stringProp name="Start users count">100</stringProp>
  <stringProp name="Start users count burst">0</stringProp>
  <stringProp name="Start users period">60</stringProp>
  <stringProp name="Stop users count">10</stringProp>
  <stringProp name="Stop users period">1</stringProp>
  <stringProp name="flighttime">600</stringProp>
  <stringProp name="rampUp">30</stringProp>
  <elementProp name="ThreadGroup.main_controller" elementType="LoopController">
    <boolProp name="LoopController.continue_forever">false</boolProp>
    <stringProp name="LoopController.loops">-1</stringProp>
  </elementProp>
</kg.apc.jmeter.threads.SteppingThreadGroup>
```

---

## 8. Volume Testing

### 8.1 Data Volume Scenarios

| Scenario | Records | Data Size | Duration |
|----------|---------|-----------|----------|
| 1 Year Loans | 100,000 | 5 GB | 2 hours |
| 5 Year Loans | 500,000 | 25 GB | 4 hours |
| 10 Year Loans | 1,000,000 | 50 GB | 8 hours |
| Full History | 5,000,000 | 250 GB | 24 hours |

### 8.2 Volume Test Configuration

```java
@Component
public class VolumeTestDataGenerator {
    
    /**
     * Generate large volume test data
     */
    public void generateVolumeData(int recordCount) {
        int batchSize = 1000;
        int batches = recordCount / batchSize;
        
        for (int i = 0; i < batches; i++) {
            List<Loan> loans = IntStream.range(0, batchSize)
                .mapToObj(j -> generateLoan(i * batchSize + j))
                .collect(Collectors.toList());
            
            loanRepository.saveAll(loans);
            
            if (i % 100 == 0) {
                log.info("Generated {} of {} records", i * batchSize, recordCount);
            }
        }
    }
}
```

---

## 9. Test Data Requirements

### 9.1 Data Volume by Test Type

| Test Type | Loans | Borrowers | Transactions | Documents |
|-----------|-------|-----------|--------------|-----------|
| Normal Load | 10,000 | 10,000 | 50,000 | 30,000 |
| Peak Load | 50,000 | 50,000 | 250,000 | 150,000 |
| Soak Test | 100,000 | 100,000 | 1,000,000 | 500,000 |
| Stress Test | 200,000 | 200,000 | 2,000,000 | 1,000,000 |
| Volume Test | 1,000,000 | 1,000,000 | 10,000,000 | 5,000,000 |

### 9.2 Data Generation Script

```bash
#!/bin/bash
# generate-load-test-data.sh

RECORDS=${1:-100000}

echo "Generating $RECORDS test records..."

# Generate borrowers
curl -X POST http://localhost:8080/api/test-data/generate \
  -H "Content-Type: application/json" \
  -d "{
    \"entity\": \"BORROWER\",
    \"count\": $RECORDS,
    \"batchSize\": 1000
  }"

# Generate loans
curl -X POST http://localhost:8080/api/test-data/generate \
  -H "Content-Type: application/json" \
  -d "{
    \"entity\": \"LOAN\",
    \"count\": $RECORDS,
    \"batchSize\": 1000
  }"

echo "Data generation complete"
```

---

## 10. Related Documents

| Document | Purpose |
|----------|---------|
| `[PERF]_Performance_Testing_Plan_JMeter_v1.0.md` | JMeter test plans |
| `[PERF]_Database_Performance_Testing_v1.0.md` | Database testing |
| `[TEST]_Master_Test_Strategy_Document_v1.0.md` | Overall strategy |

---

**Document Owner:** Performance Test Lead, Unisoft Systems Limited  
**Next Review Date:** 2026-03-05  
**Classification:** Internal

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

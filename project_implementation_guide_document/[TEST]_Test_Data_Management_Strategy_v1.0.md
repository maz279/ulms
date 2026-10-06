# Test Data Management Strategy
## ULMS v2.0 Test Data Lifecycle and Governance

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Test Data Management Strategy |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 8, 2026 |
| **Prepared By** | QA Lead / Data Architect |
| **Classification** | Internal |
| **Status** | Approved |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Test Data Architecture](#2-test-data-architecture)
3. [Data Categories](#3-data-categories)
4. [Data Generation](#4-data-generation)
5. [Data Masking and Anonymization](#5-data-masking-and-anonymization)
6. [Data Provisioning](#6-data-provisioning)
7. [Data Storage and Versioning](#7-data-storage-and-versioning)
8. [Data Refresh and Cleanup](#8-data-refresh-and-cleanup)
9. [Data Security and Compliance](#9-data-security-and-compliance)
10. [Tools and Automation](#10-tools-and-automation)
11. [Appendix](#11-appendix)

---

## 1. Overview

### 1.1 Purpose

This document establishes the comprehensive test data management strategy for ULMS v2.0, ensuring consistent, secure, and compliant test data across all testing environments.

### 1.2 Objectives

| Objective | Description |
|-----------|-------------|
| Data Availability | Test data available on-demand |
| Data Privacy | All PII masked in non-production |
| Data Consistency | Referential integrity maintained |
| Data Freshness | Regular refresh cycles |
| Cost Efficiency | Optimized storage usage |

### 1.3 Scope

This strategy covers:
- Test data generation and synthesis
- Production data masking and subsetting
- Test data provisioning and deployment
- Data lifecycle management
- Security and compliance requirements

---

## 2. Test Data Architecture

### 2.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Test Data Management Architecture                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   Synthetic  │    │   Masked     │    │   Subset     │          │
│  │   Generator  │───▶│   Data       │───▶│   Extract    │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│         │                   │                   │                   │
│         └───────────────────┼───────────────────┘                   │
│                             ▼                                       │
│                    ┌────────────────┐                               │
│                    │  Data Store    │                               │
│                    │  (Versioned)   │                               │
│                    └───────┬────────┘                               │
│                            │                                        │
│         ┌──────────────────┼──────────────────┐                     │
│         │                  │                  │                     │
│         ▼                  ▼                  ▼                     │
│    ┌─────────┐       ┌─────────┐       ┌─────────┐                 │
│    │   DEV   │       │  TEST   │       │  STAGE  │                 │
│    └─────────┘       └─────────┘       └─────────┘                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Categories

### 3.1 Data Classification

| Category | Description | Sensitivity | Handling |
|----------|-------------|-------------|----------|
| Public | Reference data, configurations | Low | No masking |
| Internal | Business rules, product info | Medium | Minimal masking |
| Confidential | Customer data, financials | High | Full masking |
| Restricted | Authentication, credentials | Critical | Encryption + masking |

### 3.2 Test Data Sets

| Data Set | Records | Purpose | Refresh Frequency |
|----------|---------|---------|-------------------|
| Minimal | 100 | Unit testing | Per test run |
| Standard | 10,000 | Integration testing | Daily |
| Large | 100,000 | Performance testing | Weekly |
| Production Clone | 1M+ | UAT/Staging | Monthly |

---

## 4. Data Generation

### 4.1 Synthetic Data Generator

```java
@Component
public class SyntheticDataGenerator {
    
    private final Faker faker = new Faker(new Locale("en", "BD"));
    
    public Customer generateCustomer() {
        return Customer.builder()
            .customerId(generateCustomerId())
            .fullName(faker.name().fullName())
            .nidNumber(generateNID())
            .mobileNumber(generateMobile())
            .email(faker.internet().emailAddress())
            .dateOfBirth(faker.date().birthday(18, 70))
            .address(generateAddress())
            .build();
    }
    
    private String generateNID() {
        return String.format("%013d", 
            faker.number().numberBetween(1000000000000L, 9999999999999L));
    }
    
    private String generateMobile() {
        String[] prefixes = {"017", "018", "019", "015", "016"};
        String prefix = prefixes[faker.number().numberBetween(0, 5)];
        return prefix + faker.number().digits(8);
    }
}
```

### 4.2 Data Generation Script

```sql
-- Generate test customers
INSERT INTO test_customers (customer_id, full_name, nid_number, mobile_number)
SELECT 
    'CUST-' || LPAD(seq::text, 6, '0'),
    'Test Customer ' || seq,
    LPAD((random() * 9999999999999)::bigint::text, 13, '0'),
    CASE (random() * 4)::int
        WHEN 0 THEN '017'
        WHEN 1 THEN '018'
        WHEN 2 THEN '019'
        WHEN 3 THEN '015'
        ELSE '016'
    END || LPAD((random() * 99999999)::bigint::text, 8, '0')
FROM generate_series(1, 10000) AS seq;
```

---

## 5. Data Masking and Anonymization

### 5.1 Masking Rules

| Field | Method | Example |
|-------|--------|---------|
| NID | Partial masking | XXXXXX1234567 |
| Mobile | Partial masking | 017XXXX1234 |
| Email | Hash domain | user@XXXX.com |
| Name | Faker replacement | Random name |
| Address | Synthetic | Generated address |
| Account Number | Format preserving | XXXX5678 |

### 5.2 Masking Implementation

```java
@Component
public class DataMasker {
    
    public String maskNID(String nid) {
        if (nid == null || nid.length() < 7) return "XXXXXX";
        return "XXXXXX" + nid.substring(nid.length() - 7);
    }
    
    public String maskMobile(String mobile) {
        if (mobile == null || mobile.length() < 8) return "XXXX";
        return mobile.substring(0, 3) + "XXXX" + 
               mobile.substring(mobile.length() - 4);
    }
    
    public String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "XXXX";
        String[] parts = email.split("@");
        String local = parts[0].substring(0, Math.min(2, parts[0].length())) + "***";
        return local + "@" + parts[1].replaceAll("\\.", "X");
    }
}
```

---

## 6. Data Provisioning

### 6.1 Provisioning API

```java
@RestController
@RequestMapping("/api/v1/test-data")
public class TestDataController {
    
    @PostMapping("/provision")
    public ResponseEntity<ProvisionResponse> provisionData(
            @RequestBody ProvisionRequest request) {
        
        String datasetId = dataProvisioner.provision(
            request.getEnvironment(),
            request.getDataSetType(),
            request.getRecordCount()
        );
        
        return ResponseEntity.ok(new ProvisionResponse(datasetId));
    }
    
    @DeleteMapping("/{datasetId}")
    public ResponseEntity<Void> cleanupData(@PathVariable String datasetId) {
        dataProvisioner.cleanup(datasetId);
        return ResponseEntity.noContent().build();
    }
}
```

### 6.2 CLI Tool

```bash
# Provision test data
ulms-test-data provision \
    --environment test \
    --type standard \
    --count 10000 \
    --tag sprint-23

# Cleanup test data
ulms-test-data cleanup \
    --environment test \
    --tag sprint-23 \
    --older-than 7d
```

---

## 7. Data Storage and Versioning

### 7.1 Storage Structure

```
/test-data-store/
├── datasets/
│   ├── v1.0.0/
│   │   ├── customers.parquet
│   │   ├── loans.parquet
│   │   └── metadata.json
│   └── v1.1.0/
│       └── ...
├── snapshots/
│   ├── daily/
│   └── weekly/
└── backups/
    └── monthly/
```

### 7.2 Metadata Format

```json
{
  "version": "1.0.0",
  "created": "2026-02-08T10:00:00Z",
  "recordCount": 10000,
  "checksum": "sha256:abc123...",
  "tables": [
    {
      "name": "customers",
      "records": 10000,
      "dependencies": []
    },
    {
      "name": "loans",
      "records": 15000,
      "dependencies": ["customers"]
    }
  ]
}
```

---

## 8. Data Refresh and Cleanup

### 8.1 Refresh Schedule

| Environment | Refresh Type | Schedule |
|-------------|--------------|----------|
| DEV | Full reset | On demand |
| TEST | Incremental | Daily at 2 AM |
| STAGING | Full refresh | Weekly (Sunday) |
| PERF | Subset | Before each run |

### 8.2 Cleanup Policies

```yaml
cleanup:
  dev:
    retention: 24h
    auto_cleanup: true
  test:
    retention: 7d
    auto_cleanup: true
  staging:
    retention: 30d
    auto_cleanup: false
```

---

## 9. Data Security and Compliance

### 9.1 Security Controls

| Control | Implementation |
|---------|---------------|
| Encryption | AES-256 for data at rest |
| Access Control | RBAC with environment isolation |
| Audit Logging | All data access logged |
| Data Residency | Bangladesh data centers only |

### 9.2 Compliance Requirements

- Bangladesh Bank IT Security Guidelines
- Data Protection Act compliance
- PII handling per BFIU guidelines

---

## 10. Tools and Automation

### 10.1 Tool Stack

| Purpose | Tool |
|---------|------|
| Data Generation | JavaFaker, TPC-E |
| Masking | Apache ShardingSphere |
| Storage | MinIO, PostgreSQL |
| Versioning | Git LFS, DVC |
| Orchestration | Airflow |

### 10.2 Automation Pipeline

```yaml
name: Test Data Pipeline
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
triggers:
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - name: Generate synthetic data
        run: ./scripts/generate-test-data.sh
      
      - name: Apply masking
        run: ./scripts/mask-sensitive-data.sh
      
      - name: Store dataset
        run: ./scripts/store-dataset.sh
      
      - name: Provision to environments
        run: ./scripts/provision-data.sh
```

---

## 11. Appendix

### 11.1 Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Feb 8, 2026 | QA Lead | Initial document creation |

### 11.2 Related Documents

| Document | Description |
|----------|-------------|
| `[TEST]_Test_Environment_Setup_Guide_v1.0.md` | Test environment setup |
| `[TEST]_WireMock_Configuration_v1.0.md` | API mocking configuration |

---

**End of Document**

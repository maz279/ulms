# Disaster Recovery Testing Procedures

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Disaster Recovery Testing Procedures |
| **Project Name** | ULMS |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Classification** | Internal |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Test Types](#2-test-types)
3. [Test Procedures](#3-test-procedures)
4. [Success Criteria](#4-success-criteria)
5. [Documentation](#5-documentation)

---

## 1. Overview

Standardized DR testing procedures for ULMS to validate recovery capabilities.

---

## 2. Test Types

| Test Type | Scope | Duration | Frequency |
|-----------|-------|----------|-----------|
| Backup Restore | Single component | 2 hours | Monthly |
| Failover | Database | 4 hours | Quarterly |
| Full DR | Complete system | 8 hours | Annually |

---

## 3. Test Procedures

### 3.1 Backup Restore Test

```bash
# 1. Select backup to test
BACKUP=$(aws s3 ls s3://ulms-backups/ | tail -1)

# 2. Create test environment
kubectl create namespace ulms-dr-test

# 3. Restore backup
velero restore create --from-backup $BACKUP --namespace-mappings ulms-production:ulms-dr-test

# 4. Verify data integrity
kubectl exec -n ulms-dr-test deploy/ulms-backend -- ./verify-data.sh

# 5. Cleanup
kubectl delete namespace ulms-dr-test
```

### 3.2 Database Failover Test

```bash
# 1. Record test start time
TEST_START=$(date +%s)

# 2. Trigger failover
aws rds failover-db-cluster --db-cluster-identifier ulms-cluster

# 3. Monitor failover
aws rds describe-db-clusters --db-cluster-identifier ulms-cluster

# 4. Verify application connectivity
kubectl exec deploy/ulms-backend -- pg_isready -h $DB_HOST

# 5. Calculate RTO
TEST_END=$(date +%s)
RTO=$((TEST_END - TEST_START))
echo "RTO: $RTO seconds"
```

---

## 4. Success Criteria

| Metric | Target | Actual | Pass/Fail |
|--------|--------|--------|-----------|
| RTO | < 4 hours | | |
| RPO | < 1 hour | | |
| Data Integrity | 100% | | |
| Application Availability | 99.9% | | |

---

## 5. Documentation

### 5.1 Test Report Template

```markdown
# DR Test Report

## Test Information
- Date: YYYY-MM-DD
- Test Type: [Backup/Failover/Full]
- Tester: Name

## Execution Summary
- Start Time: 
- End Time: 
- Duration: 

## Results
| Component | Status | Notes |
|-----------|--------|-------|
| Database | Pass/Fail | |
| Application | Pass/Fail | |
| Network | Pass/Fail | |

## Issues Found
1. 
2. 

## Recommendations
1. 
2. 

## Sign-off
- Tester: ___________
- Reviewer: ___________
```

---

*© 2026 Unisoft Systems Limited.*

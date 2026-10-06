**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Database Performance Testing |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Database Administrator, Unisoft Systems Limited |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Draft |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | DBA | Initial version |

---

# Database Performance Testing

## Table of Contents

1. [Introduction](#1-introduction)
2. [Database Performance Objectives](#2-database-performance-objectives)
3. [Query Performance Testing](#3-query-performance-testing)
4. [Index Optimization](#4-index-optimization)
5. [Connection Pool Testing](#5-connection-pooling-testing)
6. [Concurrency and Locking](#6-concurrency-and-locking)
7. [Storage and I/O Testing](#7-storage-and-io-testing)
8. [Monitoring and Diagnostics](#8-monitoring-and-diagnostics)
9. [Optimization Recommendations](#9-optimization-recommendations)
10. [Related Documents](#10-related-documents)

---

## 1. Introduction

### 1.1 Purpose

This document defines comprehensive database performance testing procedures for ULMS v2.0 PostgreSQL database. It covers query optimization, index testing, connection pooling, and storage performance validation.

### 1.2 Scope

- SQL query performance validation
- Index effectiveness testing
- Connection pool optimization
- Lock contention analysis
- Storage I/O performance
- Replication lag testing

---

## 2. Database Performance Objectives

### 2.1 Performance Targets

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Simple Query | < 10 ms | < 50 ms |
| Complex Join | < 100 ms | < 500 ms |
| Report Query | < 5 sec | < 30 sec |
| Batch Insert | > 10,000 rows/sec | > 5,000 rows/sec |
| Index Creation | < 10 min | < 30 min |
| Connection Acquisition | < 5 ms | < 50 ms |
| Replication Lag | < 1 sec | < 5 sec |

### 2.2 Load Targets

| Metric | Target |
|--------|--------|
| Concurrent Connections | 500 |
| Transactions per Second | 1000 |
| Active Queries | 200 |
| Cache Hit Ratio | > 99% |

---

## 3. Query Performance Testing

### 3.1 Critical Query List

```sql
-- Q1: Loan lookup by ID (Most frequent)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM loans 
WHERE loan_id = 'LOAN-12345';

-- Q2: Borrower loan history
EXPLAIN (ANALYZE, BUFFERS)
SELECT l.*, p.amount as last_payment
FROM loans l
LEFT JOIN payments p ON l.loan_id = p.loan_id
WHERE l.borrower_nid = '1234567890123'
ORDER BY l.created_date DESC;

-- Q3: Active loans with classification
EXPLAIN (ANALYZE, BUFFERS)
SELECT l.loan_id, l.outstanding_amount, lc.classification
FROM loans l
JOIN loan_classification lc ON l.loan_id = lc.loan_id
WHERE l.status = 'ACTIVE'
AND lc.effective_date = (
    SELECT MAX(effective_date) 
    FROM loan_classification 
    WHERE loan_id = l.loan_id
);

-- Q4: Overdue loans report
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
    l.loan_id,
    l.borrower_nid,
    b.name,
    l.outstanding_amount,
    l.next_due_date,
    CURRENT_DATE - l.next_due_date as days_overdue
FROM loans l
JOIN borrowers b ON l.borrower_nid = b.nid
WHERE l.status = 'ACTIVE'
AND l.next_due_date < CURRENT_DATE
AND l.outstanding_amount > 0
ORDER BY days_overdue DESC;

-- Q5: CL-1 Report Generation
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
    loan_type,
    classification,
    COUNT(*) as loan_count,
    SUM(outstanding_principal) as total_outstanding,
    SUM(required_provision) as total_provision
FROM loan_summary_view
WHERE reporting_date = CURRENT_DATE
GROUP BY loan_type, classification;
```

### 3.2 Query Performance Test Script

```java
@Component
public class QueryPerformanceTest {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    /**
     * Execute query performance benchmark
     */
    public QueryPerformanceResult benchmarkQuery(String queryName, String sql, int iterations) {
        List<Long> executionTimes = new ArrayList<>();
        
        // Warm up
        for (int i = 0; i < 5; i++) {
            jdbcTemplate.queryForList(sql);
        }
        
        // Benchmark
        for (int i = 0; i < iterations; i++) {
            long start = System.nanoTime();
            jdbcTemplate.queryForList(sql);
            long duration = (System.nanoTime() - start) / 1_000_000; // Convert to ms
            executionTimes.add(duration);
        }
        
        // Calculate statistics
        Collections.sort(executionTimes);
        
        return QueryPerformanceResult.builder()
            .queryName(queryName)
            .min(executionTimes.get(0))
            .max(executionTimes.get(executionTimes.size() - 1))
            .avg(executionTimes.stream().mapToLong(Long::longValue).average().orElse(0))
            .p50(executionTimes.get(executionTimes.size() / 2))
            .p95(executionTimes.get((int)(executionTimes.size() * 0.95)))
            .p99(executionTimes.get((int)(executionTimes.size() * 0.99)))
            .build();
    }
}
```

---

## 4. Index Optimization

### 4.1 Required Indexes

```sql
-- Primary lookup indexes
CREATE INDEX CONCURRENTLY idx_loans_loan_id ON loans(loan_id);
CREATE INDEX CONCURRENTLY idx_loans_borrower_nid ON loans(borrower_nid);
CREATE INDEX CONCURRENTLY idx_borrowers_nid ON borrowers(nid);

-- Classification indexes
CREATE INDEX CONCURRENTLY idx_loan_class_loan_id_date 
    ON loan_classification(loan_id, effective_date DESC);
CREATE INDEX CONCURRENTLY idx_loans_classification 
    ON loans(status, classification) WHERE status = 'ACTIVE';

-- Payment indexes
CREATE INDEX CONCURRENTLY idx_payments_loan_id_date 
    ON payments(loan_id, payment_date DESC);
CREATE INDEX CONCURRENTLY idx_payments_status 
    ON payments(status) WHERE status = 'PENDING';

-- Reporting indexes
CREATE INDEX CONCURRENTLY idx_loans_reporting_date 
    ON loans(reporting_date, loan_type, classification);

-- Full-text search indexes
CREATE INDEX CONCURRENTLY idx_borrowers_name_gin 
    ON borrowers USING gin(to_tsvector('english', name));

-- Partial indexes for common queries
CREATE INDEX CONCURRENTLY idx_loans_active_overdue 
    ON loans(loan_id, outstanding_amount) 
    WHERE status = 'ACTIVE' AND next_due_date < CURRENT_DATE;
```

### 4.2 Index Testing Script

```sql
-- Test index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,  -- Number of index scans
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Check for missing indexes
SELECT 
    schemaname,
    relname AS table_name,
    seq_scan - idx_scan AS too_much_seq,
    CASE WHEN seq_scan - idx_scan > 0 
        THEN 'Missing Index?' 
        ELSE 'OK' 
    END AS status
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY too_much_seq DESC;

-- Analyze index sizes
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

---

## 5. Connection Pool Testing

### 5.1 HikariCP Configuration

```yaml
# database.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/ulms
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    driver-class-name: org.postgresql.Driver
    hikari:
      # Pool sizing
      minimum-idle: 10
      maximum-pool-size: 100
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      
      # Performance settings
      leak-detection-threshold: 60000
      register-mbeans: true
      
      # Connection validation
      connection-test-query: SELECT 1
      validation-timeout: 5000
```

### 5.2 Connection Pool Test

```java
@Component
public class ConnectionPoolTest {
    
    @Autowired
    private HikariDataSource dataSource;
    
    /**
     * Test connection pool under load
     */
    public PoolPerformanceResult testConnectionPool(int concurrentRequests) {
        HikariPoolMXBean poolMXBean = dataSource.getHikariPoolMXBean();
        HikariConfigMXBean configMXBean = dataSource.getHikariConfigMXBean();
        
        ExecutorService executor = Executors.newFixedThreadPool(concurrentRequests);
        CountDownLatch latch = new CountDownLatch(concurrentRequests);
        List<Long> acquisitionTimes = Collections.synchronizedList(new ArrayList<>());
        
        // Record initial metrics
        int initialActive = poolMXBean.getActiveConnections();
        int initialIdle = poolMXBean.getIdleConnections();
        int initialWaiting = poolMXBean.getThreadsAwaitingConnection();
        
        // Simulate concurrent connections
        for (int i = 0; i < concurrentRequests; i++) {
            executor.submit(() -> {
                try {
                    long start = System.nanoTime();
                    try (Connection conn = dataSource.getConnection()) {
                        long acquisitionTime = (System.nanoTime() - start) / 1_000_000;
                        acquisitionTimes.add(acquisitionTime);
                        
                        // Simulate work
                        Thread.sleep(100);
                    }
                } catch (Exception e) {
                    log.error("Connection error", e);
                } finally {
                    latch.countDown();
                }
            });
        }
        
        try {
            latch.await(60, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        executor.shutdown();
        
        // Calculate statistics
        Collections.sort(acquisitionTimes);
        
        return PoolPerformanceResult.builder()
            .concurrentRequests(concurrentRequests)
            .successfulConnections(acquisitionTimes.size())
            .avgAcquisitionTime(acquisitionTimes.stream().mapToLong(Long::longValue).average().orElse(0))
            .maxAcquisitionTime(acquisitionTimes.get(acquisitionTimes.size() - 1))
            .p95AcquisitionTime(acquisitionTimes.get((int)(acquisitionTimes.size() * 0.95)))
            .finalActiveConnections(poolMXBean.getActiveConnections())
            .finalIdleConnections(poolMXBean.getIdleConnections())
            .maxConnectionsReached(poolMXBean.getTotalConnections() >= configMXBean.getMaximumPoolSize())
            .threadsAwaitingConnection(poolMXBean.getThreadsAwaitingConnection())
            .build();
    }
}
```

---

## 6. Concurrency and Locking

### 6.1 Lock Contention Test

```java
@Component
public class LockContentionTest {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    /**
     * Test concurrent loan updates
     */
    public LockTestResult testConcurrentUpdates(String loanId, int concurrentUsers) {
        ExecutorService executor = Executors.newFixedThreadPool(concurrentUsers);
        CountDownLatch latch = new CountDownLatch(concurrentUsers);
        List<TransactionResult> results = Collections.synchronizedList(new ArrayList<>());
        
        for (int i = 0; i < concurrentUsers; i++) {
            final int userId = i;
            executor.submit(() -> {
                long start = System.currentTimeMillis();
                try {
                    jdbcTemplate.update(
                        "UPDATE loans SET outstanding_amount = outstanding_amount - ? " +
                        "WHERE loan_id = ?",
                        1000, loanId
                    );
                    results.add(TransactionResult.success(userId, System.currentTimeMillis() - start));
                } catch (Exception e) {
                    results.add(TransactionResult.failure(userId, e.getMessage()));
                } finally {
                    latch.countDown();
                }
            });
        }
        
        try {
            latch.await(60, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        executor.shutdown();
        
        long successful = results.stream().filter(TransactionResult::isSuccess).count();
        long failed = results.stream().filter(r -> !r.isSuccess()).count();
        
        return LockTestResult.builder()
            .concurrentUsers(concurrentUsers)
            .successfulTransactions(successful)
            .failedTransactions(failed)
            .averageResponseTime(results.stream().filter(TransactionResult::isSuccess)
                .mapToLong(TransactionResult::getDuration).average().orElse(0))
            .build();
    }
}
```

### 6.2 Deadlock Detection

```sql
-- Monitor for deadlocks
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_statement,
    blocking_activity.query AS blocking_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.relation = blocked_locks.relation
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- Check deadlock statistics
SELECT 
    deadlocks,
    conflicts,
    temp_files,
    temp_bytes
FROM pg_stat_database
WHERE datname = 'ulms';
```

---

## 7. Storage and I/O Testing

### 7.1 I/O Performance Test

```bash
#!/bin/bash
# io-performance-test.sh

# Test table read performance
echo "Testing sequential read performance..."
psql -d ulms -c "
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT * FROM loans;
"

# Test index scan performance
echo "Testing index scan performance..."
psql -d ulms -c "
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT * FROM loans WHERE loan_id = 'LOAN-12345';
"

# Test write performance
echo "Testing write performance..."
psql -d ulms -c "
DO \$\$
DECLARE
    start_time timestamp;
    end_time timestamp;
BEGIN
    start_time := clock_timestamp();
    
    INSERT INTO test_performance (data)
    SELECT md5(random()::text)
    FROM generate_series(1, 10000);
    
    end_time := clock_timestamp();
    
    RAISE NOTICE 'Insert time: %', end_time - start_time;
END \$\$;
"

# Check table bloat
echo "Checking table bloat..."
psql -d ulms -c "
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;
"
```

### 7.2 Storage Monitoring

```sql
-- Table size monitoring
SELECT 
    schemaname,
    relname AS table_name,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    pg_size_pretty(pg_relation_size(relid)) AS table_size,
    pg_size_pretty(pg_indexes_size(relid)) AS index_size
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 20;

-- Database growth trend
SELECT 
    datname,
    pg_size_pretty(pg_database_size(datname)) AS size
FROM pg_database
WHERE datname = 'ulms';

-- WAL generation rate
SELECT 
    pg_current_wal_lsn(),
    pg_wal_lsn_diff(pg_current_wal_lsn(), '0/00000000') / 1024 / 1024 AS wal_mb;
```

---

## 8. Monitoring and Diagnostics

### 8.1 Key Monitoring Queries

```sql
-- Active queries
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    now() - query_start AS duration,
    LEFT(query, 100) AS query_snippet
FROM pg_stat_activity
WHERE state = 'active'
AND pid != pg_backend_pid()
ORDER BY duration DESC;

-- Long-running queries
SELECT 
    pid,
    usename,
    now() - query_start AS duration,
    LEFT(query, 200) AS query
FROM pg_stat_activity
WHERE state = 'active'
AND now() - query_start > interval '5 minutes'
ORDER BY duration DESC;

-- Query statistics (from pg_stat_statements)
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    rows,
    shared_blks_hit,
    shared_blks_read
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;

-- Cache hit ratio
SELECT 
    sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) AS cache_hit_ratio
FROM pg_statio_user_tables;

-- Table statistics
SELECT 
    schemaname,
    relname,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    n_tup_ins,
    n_tup_upd,
    n_tup_del
FROM pg_stat_user_tables
ORDER BY seq_scan DESC
LIMIT 20;
```

### 8.2 Prometheus Exporter Configuration

```yaml
# postgres_exporter.yml
auth_modules:
  ulms:
    type: userpass
    userpass:
      username: exporter
      password: ${EXPORTER_PASSWORD}
    options:
      sslmode: disable

collectors:
  - pg_stat_activity
  - pg_stat_database
  - pg_stat_user_tables
  - pg_stat_user_indexes
  - pg_statio_user_tables
  - pg_locks
  - pg_replication
```

---

## 9. Optimization Recommendations

### 9.1 Query Optimization Checklist

```markdown
## Query Optimization Checklist

### Before Deployment
- [ ] All queries EXPLAIN ANALYZE verified
- [ ] Indexes created for WHERE, JOIN, ORDER BY columns
- [ ] Covering indexes for frequently accessed columns
- [ ] Partition strategy defined for large tables
- [ ] Query result caching configured

### Regular Maintenance
- [ ] ANALYZE executed weekly
- [ ] VACUUM executed nightly
- [ ] Index bloat monitored
- [ ] Query performance logs reviewed
- [ ] Slow query log analyzed

### Capacity Planning
- [ ] Connection pool size validated
- [ ] Disk I/O capacity monitored
- [ ] Memory settings optimized
- [ ] Replication lag monitored
```

### 9.2 PostgreSQL Configuration

```ini
# postgresql.conf optimizations for ULMS

# Memory Settings
shared_buffers = 4GB
effective_cache_size = 12GB
work_mem = 64MB
maintenance_work_mem = 512MB

# Checkpoint Settings
checkpoint_completion_target = 0.9
max_wal_size = 4GB
min_wal_size = 1GB

# Query Planning
effective_io_concurrency = 200
random_page_cost = 1.1

# Connection Settings
max_connections = 500
superuser_reserved_connections = 3

# Logging
log_min_duration_statement = 1000
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
```

---

## 10. Related Documents

| Document | Purpose |
|----------|---------|
| `[PERF]_Performance_Testing_Plan_JMeter_v1.0.md` | Overall performance testing |
| `[PERF]_Load_Testing_Scenarios_v1.0.md` | Load testing scenarios |
| `../Technology_Stack_Recommendation_v2.md` | Database architecture |

---

**Document Owner:** Database Administrator, Unisoft Systems Limited  
**Next Review Date:** 2026-03-05  
**Classification:** Internal

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

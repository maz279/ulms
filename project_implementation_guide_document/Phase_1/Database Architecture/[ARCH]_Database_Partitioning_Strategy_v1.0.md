# Database Partitioning Strategy

| Document ID | ULMS-ARCH-PART-001 |
|-------------|---------------------|
| Version | 1.0 |
| Date | 2026-02-05 |
| Author | System Architect |
| Status | Draft |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-05 | System Architect | Initial document creation |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Partitioning Rationale](#2-partitioning-rationale)
3. [Volume Estimates](#3-volume-estimates)
4. [Partition Types and Strategy](#4-partition-types-and-strategy)
5. [Tables to Partition](#5-tables-to-partition)
6. [PostgreSQL 16 Partitioning Implementation](#6-postgresql-16-partitioning-implementation)
7. [Monthly Partition Automation](#7-monthly-partition-automation)
8. [Partition Maintenance](#8-partition-maintenance)
9. [Query Performance Considerations](#9-query-performance-considerations)
10. [Archive Strategy](#10-archive-strategy)
11. [Compliance Matrix](#11-compliance-matrix)
12. [Appendices](#12-appendices)

---

## 1. Introduction

### 1.1 Purpose

This document defines the database partitioning strategy for ULMS v2.0, providing guidelines for optimal data distribution, query performance, and data lifecycle management across the multi-tenant architecture supporting 62+ Bangladesh banks.

### 1.2 Scope

- Range partitioning for time-series data
- List partitioning for status-based data
- Monthly partition automation
- Archive and purge strategies
- Query optimization through partition pruning

### 1.3 References

| Document | Description |
|----------|-------------|
| BRD Section 8.2 | Data Retention Requirements |
| SRS Section 7.3 | Performance Requirements |
| Technology Stack | PostgreSQL 16.1 Specifications |
| ICT Security V4.0 | Data Retention Guidelines |

### 1.4 Multi-Tenant Context

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Multi-Tenant Partitioning Model                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Public Schema                                                      │
│   ┌──────────────────────────────────────────────────────────┐     │
│   │  tenants (no partitioning - small table)                  │     │
│   │  tenant_configuration (no partitioning - small table)     │     │
│   └──────────────────────────────────────────────────────────┘     │
│                                                                      │
│   Per-Tenant Schema (bank_XXX)                                      │
│   ┌──────────────────────────────────────────────────────────┐     │
│   │  m_loan_transaction ──▶ RANGE by transaction_date        │     │
│   │  audit_log ──▶ RANGE by event_timestamp                  │     │
│   │  loan_classification_history ──▶ RANGE by class_date     │     │
│   │  cib_inquiry ──▶ RANGE by requested_at                   │     │
│   │  m_loan ──▶ LIST by loan_status (optional)               │     │
│   └──────────────────────────────────────────────────────────┘     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Partitioning Rationale

### 2.1 Why Partition?

| Benefit | Description |
|---------|-------------|
| **Query Performance** | Partition pruning eliminates scanning irrelevant data |
| **Maintenance Efficiency** | Operations can target individual partitions |
| **Data Lifecycle** | Easy archive/purge of old partitions |
| **Parallel Operations** | Parallel index builds and vacuum |
| **Reduced Lock Contention** | Partition-level locks instead of table-level |

### 2.2 Partitioning Decision Criteria

| Criteria | Threshold | Action |
|----------|-----------|--------|
| Table Size | > 10 GB | Consider partitioning |
| Row Count | > 10 million rows | Consider partitioning |
| Time-Series Data | Any size | Partition by date |
| Status-Based Queries | > 1 million active | Consider list partition |
| Retention Policy | Defined retention | Partition for easy purge |

### 2.3 Tables NOT to Partition

| Table | Reason |
|-------|--------|
| m_client | Frequently joined, moderate size |
| m_loan | Moderate size, complex queries |
| ref_* tables | Reference/lookup tables |
| app_user | Small table |
| tenant_configuration | Small table |

---

## 3. Volume Estimates

### 3.1 Per-Bank Volume Estimates (Annual)

| Table | Rows/Year | Row Size | Annual Size |
|-------|-----------|----------|-------------|
| m_loan_transaction | 2,400,000 | 500 bytes | 1.2 GB |
| audit_log | 5,000,000 | 1 KB | 5 GB |
| loan_classification_history | 365,000 | 300 bytes | 110 MB |
| cib_inquiry | 50,000 | 2 KB | 100 MB |
| notification_log | 1,000,000 | 500 bytes | 500 MB |

### 3.2 System-Wide Projections (62 Banks)

| Table | 1 Year | 3 Years | 7 Years |
|-------|--------|---------|---------|
| m_loan_transaction | 74 GB | 222 GB | 518 GB |
| audit_log | 310 GB | 930 GB | 2.1 TB |
| loan_classification_history | 6.8 GB | 20.4 GB | 47.6 GB |
| cib_inquiry | 6.2 GB | 18.6 GB | 43.4 GB |

### 3.3 Growth Assumptions

- 10% YoY growth in transaction volume
- Linear growth in audit logs with user activity
- Stable classification history per active loan
- CIB inquiry growth tied to new loan applications

---

## 4. Partition Types and Strategy

### 4.1 Range Partitioning (Primary Strategy)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Range Partitioning by Month                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   m_loan_transaction (parent)                                       │
│   ├── m_loan_transaction_2026_01 (2026-01-01 to 2026-02-01)        │
│   ├── m_loan_transaction_2026_02 (2026-02-01 to 2026-03-01)        │
│   ├── m_loan_transaction_2026_03 (2026-03-01 to 2026-04-01)        │
│   └── ... (monthly partitions)                                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Best For:**
- Transaction tables
- Audit logs
- Historical records
- Time-series data

### 4.2 List Partitioning (Secondary Strategy)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    List Partitioning by Status                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   m_loan (parent) - Optional Implementation                         │
│   ├── m_loan_active (ACTIVE, DISBURSED)                            │
│   ├── m_loan_closed (CLOSED, SETTLED)                               │
│   ├── m_loan_npa (WRITTEN_OFF)                                      │
│   └── m_loan_pending (DRAFT, SUBMITTED, UNDER_REVIEW)              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Best For:**
- Status-based access patterns
- Separating hot/cold data
- Optimizing common queries

### 4.3 Composite Partitioning (Advanced)

```sql
-- Range-List composite example (if needed)
CREATE TABLE audit_log (
    id BIGSERIAL,
    event_timestamp TIMESTAMP WITH TIME ZONE,
    event_type VARCHAR(50),
    ...
) PARTITION BY RANGE (event_timestamp);

-- Each monthly partition can be sub-partitioned by event_type
-- Only recommended for very high-volume scenarios
```

---

## 5. Tables to Partition

### 5.1 m_loan_transaction (CRITICAL)

| Attribute | Value |
|-----------|-------|
| Partition Key | transaction_date |
| Partition Type | RANGE |
| Partition Interval | Monthly |
| Retention | 7 years active, 7 years archive |

**Rationale:** Highest volume table, time-series access pattern, financial audit requirements.

### 5.2 audit_log (CRITICAL)

| Attribute | Value |
|-----------|-------|
| Partition Key | event_timestamp |
| Partition Type | RANGE |
| Partition Interval | Monthly |
| Retention | 7 years (regulatory) |

**Rationale:** Very high volume, compliance retention, rarely accessed old data.

### 5.3 loan_classification_history (HIGH)

| Attribute | Value |
|-----------|-------|
| Partition Key | classification_date |
| Partition Type | RANGE |
| Partition Interval | Monthly |
| Retention | Loan lifetime + 7 years |

**Rationale:** BRPD compliance reporting, time-series analysis.

### 5.4 cib_inquiry (HIGH)

| Attribute | Value |
|-----------|-------|
| Partition Key | requested_at |
| Partition Type | RANGE |
| Partition Interval | Monthly |
| Retention | 24 months active cache, 7 years archive |

**Rationale:** CIB history requirements, time-based access.

### 5.5 notification_log (MEDIUM)

| Attribute | Value |
|-----------|-------|
| Partition Key | created_at |
| Partition Type | RANGE |
| Partition Interval | Monthly |
| Retention | 2 years |

**Rationale:** Moderate volume, short retention needed.

### 5.6 Summary Table

| Table | Priority | Partition Key | Interval | Est. Partitions |
|-------|----------|---------------|----------|-----------------|
| m_loan_transaction | Critical | transaction_date | Monthly | 84 (7 years) |
| audit_log | Critical | event_timestamp | Monthly | 84 (7 years) |
| loan_classification_history | High | classification_date | Monthly | 84+ |
| cib_inquiry | High | requested_at | Monthly | 84+ |
| notification_log | Medium | created_at | Monthly | 24 (2 years) |
| cib_event_log | Medium | event_timestamp | Monthly | 84 |

---

## 6. PostgreSQL 16 Partitioning Implementation

### 6.1 m_loan_transaction Partitioned Table

```sql
-- ============================================================================
-- Table: m_loan_transaction (Partitioned)
-- Partition Strategy: RANGE by transaction_date (Monthly)
-- Schema: Per-tenant (bank_XXX)
-- ============================================================================

-- Drop existing table if migrating
-- ALTER TABLE m_loan_transaction RENAME TO m_loan_transaction_old;

-- Create partitioned parent table
CREATE TABLE m_loan_transaction (
    -- Primary Key (includes partition key for local uniqueness)
    id                          BIGINT NOT NULL DEFAULT nextval('m_loan_transaction_id_seq'),
    transaction_date            DATE NOT NULL,

    -- Foreign Keys
    loan_id                     BIGINT NOT NULL,

    -- Transaction Details
    transaction_type            VARCHAR(50) NOT NULL,
    transaction_reference       VARCHAR(50),
    amount                      DECIMAL(18,2) NOT NULL,
    principal_portion           DECIMAL(18,2),
    interest_portion            DECIMAL(18,2),
    fee_portion                 DECIMAL(18,2),
    penalty_portion             DECIMAL(18,2),

    -- Balance After
    outstanding_principal       DECIMAL(18,2),
    outstanding_interest        DECIMAL(18,2),

    -- Payment Details
    payment_channel             VARCHAR(30),
    payment_reference           VARCHAR(100),

    -- Status
    is_reversed                 BOOLEAN DEFAULT FALSE,
    reversed_on_date            DATE,
    reversal_transaction_id     BIGINT,

    -- Audit Fields
    created_at                  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by                  BIGINT NOT NULL,

    -- Primary Key includes partition key
    PRIMARY KEY (id, transaction_date)

) PARTITION BY RANGE (transaction_date);

-- Create sequence if not exists
CREATE SEQUENCE IF NOT EXISTS m_loan_transaction_id_seq;

-- Create initial partitions (2026)
CREATE TABLE m_loan_transaction_2026_01 PARTITION OF m_loan_transaction
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE m_loan_transaction_2026_02 PARTITION OF m_loan_transaction
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE m_loan_transaction_2026_03 PARTITION OF m_loan_transaction
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE TABLE m_loan_transaction_2026_04 PARTITION OF m_loan_transaction
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

CREATE TABLE m_loan_transaction_2026_05 PARTITION OF m_loan_transaction
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE TABLE m_loan_transaction_2026_06 PARTITION OF m_loan_transaction
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE TABLE m_loan_transaction_2026_07 PARTITION OF m_loan_transaction
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE TABLE m_loan_transaction_2026_08 PARTITION OF m_loan_transaction
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

CREATE TABLE m_loan_transaction_2026_09 PARTITION OF m_loan_transaction
    FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

CREATE TABLE m_loan_transaction_2026_10 PARTITION OF m_loan_transaction
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');

CREATE TABLE m_loan_transaction_2026_11 PARTITION OF m_loan_transaction
    FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');

CREATE TABLE m_loan_transaction_2026_12 PARTITION OF m_loan_transaction
    FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

-- Create default partition for safety
CREATE TABLE m_loan_transaction_default PARTITION OF m_loan_transaction DEFAULT;

-- Create indexes on partitioned table (PostgreSQL 16 creates on all partitions)
CREATE INDEX idx_txn_loan_id ON m_loan_transaction(loan_id);
CREATE INDEX idx_txn_type ON m_loan_transaction(transaction_type);
CREATE INDEX idx_txn_date_loan ON m_loan_transaction(transaction_date, loan_id);

-- Comments
COMMENT ON TABLE m_loan_transaction IS 'Partitioned loan transaction table (monthly by transaction_date)';
```

### 6.2 audit_log Partitioned Table

```sql
-- ============================================================================
-- Table: audit_log (Partitioned)
-- Partition Strategy: RANGE by event_timestamp (Monthly)
-- Schema: Per-tenant (bank_XXX)
-- ============================================================================

CREATE TABLE audit_log (
    -- Primary Key
    id                          BIGINT NOT NULL DEFAULT nextval('audit_log_id_seq'),
    event_timestamp             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Event Details
    event_type                  VARCHAR(50) NOT NULL,
    event_action                VARCHAR(30) NOT NULL,

    -- Actor
    user_id                     BIGINT,
    username                    VARCHAR(100),
    user_ip_address             INET,
    user_agent                  TEXT,

    -- Resource
    resource_type               VARCHAR(100) NOT NULL,
    resource_id                 BIGINT,
    resource_name               VARCHAR(255),

    -- Change Details
    old_values                  JSONB,
    new_values                  JSONB,
    changed_fields              TEXT[],

    -- Context
    correlation_id              UUID,
    session_id                  VARCHAR(100),
    request_path                VARCHAR(500),

    -- Primary Key
    PRIMARY KEY (id, event_timestamp)

) PARTITION BY RANGE (event_timestamp);

-- Create sequence
CREATE SEQUENCE IF NOT EXISTS audit_log_id_seq;

-- Create 2026 partitions
CREATE TABLE audit_log_2026_01 PARTITION OF audit_log
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE audit_log_2026_02 PARTITION OF audit_log
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE audit_log_2026_03 PARTITION OF audit_log
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE TABLE audit_log_2026_04 PARTITION OF audit_log
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

CREATE TABLE audit_log_2026_05 PARTITION OF audit_log
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE TABLE audit_log_2026_06 PARTITION OF audit_log
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE TABLE audit_log_2026_07 PARTITION OF audit_log
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE TABLE audit_log_2026_08 PARTITION OF audit_log
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

CREATE TABLE audit_log_2026_09 PARTITION OF audit_log
    FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

CREATE TABLE audit_log_2026_10 PARTITION OF audit_log
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');

CREATE TABLE audit_log_2026_11 PARTITION OF audit_log
    FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');

CREATE TABLE audit_log_2026_12 PARTITION OF audit_log
    FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

-- Default partition
CREATE TABLE audit_log_default PARTITION OF audit_log DEFAULT;

-- Indexes
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_correlation ON audit_log(correlation_id);
CREATE INDEX idx_audit_type_action ON audit_log(event_type, event_action);

-- BRIN index for timestamp (very efficient for sequential data)
CREATE INDEX idx_audit_timestamp_brin ON audit_log USING BRIN (event_timestamp);

-- Comments
COMMENT ON TABLE audit_log IS 'Partitioned audit log table (monthly by event_timestamp)';
```

### 6.3 loan_classification_history Partitioned Table

```sql
-- ============================================================================
-- Table: loan_classification_history (Partitioned)
-- Partition Strategy: RANGE by classification_date (Monthly)
-- Schema: Per-tenant (bank_XXX)
-- ============================================================================

CREATE TABLE loan_classification_history (
    -- Primary Key
    id                          BIGINT NOT NULL DEFAULT nextval('loan_classification_history_id_seq'),
    classification_date         DATE NOT NULL,

    -- Foreign Keys
    loan_id                     BIGINT NOT NULL,

    -- Classification Details
    previous_status             VARCHAR(10),
    new_status                  VARCHAR(10) NOT NULL,
    days_past_due               INTEGER NOT NULL DEFAULT 0,

    -- Provision
    provision_rate              DECIMAL(5,2) NOT NULL,
    provision_amount            DECIMAL(18,2),

    -- Outstanding at Classification
    outstanding_principal       DECIMAL(18,2),
    outstanding_interest        DECIMAL(18,2),

    -- Audit
    classified_by               VARCHAR(50) DEFAULT 'SYSTEM',
    created_at                  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Primary Key
    PRIMARY KEY (id, classification_date)

) PARTITION BY RANGE (classification_date);

-- Sequence
CREATE SEQUENCE IF NOT EXISTS loan_classification_history_id_seq;

-- Create 2026 partitions
CREATE TABLE loan_classification_history_2026_01 PARTITION OF loan_classification_history
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE loan_classification_history_2026_02 PARTITION OF loan_classification_history
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE loan_classification_history_2026_03 PARTITION OF loan_classification_history
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE TABLE loan_classification_history_2026_04 PARTITION OF loan_classification_history
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

CREATE TABLE loan_classification_history_2026_05 PARTITION OF loan_classification_history
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE TABLE loan_classification_history_2026_06 PARTITION OF loan_classification_history
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE TABLE loan_classification_history_2026_07 PARTITION OF loan_classification_history
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE TABLE loan_classification_history_2026_08 PARTITION OF loan_classification_history
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

CREATE TABLE loan_classification_history_2026_09 PARTITION OF loan_classification_history
    FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

CREATE TABLE loan_classification_history_2026_10 PARTITION OF loan_classification_history
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');

CREATE TABLE loan_classification_history_2026_11 PARTITION OF loan_classification_history
    FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');

CREATE TABLE loan_classification_history_2026_12 PARTITION OF loan_classification_history
    FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

-- Default partition
CREATE TABLE loan_classification_history_default PARTITION OF loan_classification_history DEFAULT;

-- Indexes
CREATE INDEX idx_class_hist_loan ON loan_classification_history(loan_id);
CREATE INDEX idx_class_hist_status ON loan_classification_history(new_status);
CREATE INDEX idx_class_hist_date_loan ON loan_classification_history(classification_date, loan_id);

-- Comments
COMMENT ON TABLE loan_classification_history IS 'Partitioned BRPD classification history (monthly)';
```

### 6.4 cib_inquiry Partitioned Table

```sql
-- ============================================================================
-- Table: cib_inquiry (Partitioned)
-- Partition Strategy: RANGE by requested_at (Monthly)
-- Schema: Per-tenant (bank_XXX)
-- ============================================================================

CREATE TABLE cib_inquiry (
    -- Primary Key
    id                          BIGINT NOT NULL DEFAULT nextval('cib_inquiry_id_seq'),
    requested_at                TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    client_id                   BIGINT NOT NULL,
    loan_application_id         BIGINT,

    -- Inquiry Details
    inquiry_reference_no        VARCHAR(50) NOT NULL,
    inquiry_type                VARCHAR(30) NOT NULL DEFAULT 'CREDIT_CHECK',
    nid_number_encrypted        VARCHAR(255) NOT NULL,
    nid_encryption_key_id       VARCHAR(100) NOT NULL,

    -- Response
    response_received_at        TIMESTAMP WITH TIME ZONE,
    status                      VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    cib_score                   INTEGER,
    cib_risk_grade              VARCHAR(10),
    total_facilities            INTEGER,
    total_outstanding           DECIMAL(18,2),
    worst_classification        VARCHAR(10),
    max_dpd                     INTEGER,

    -- JSON Storage
    request_payload             JSONB,
    response_payload            JSONB,

    -- Audit
    created_by                  BIGINT NOT NULL,

    -- Primary Key
    PRIMARY KEY (id, requested_at)

) PARTITION BY RANGE (requested_at);

-- Sequence
CREATE SEQUENCE IF NOT EXISTS cib_inquiry_id_seq;

-- Create 2026 partitions (include timestamp ranges)
CREATE TABLE cib_inquiry_2026_01 PARTITION OF cib_inquiry
    FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2026-02-01 00:00:00+00');

CREATE TABLE cib_inquiry_2026_02 PARTITION OF cib_inquiry
    FOR VALUES FROM ('2026-02-01 00:00:00+00') TO ('2026-03-01 00:00:00+00');

CREATE TABLE cib_inquiry_2026_03 PARTITION OF cib_inquiry
    FOR VALUES FROM ('2026-03-01 00:00:00+00') TO ('2026-04-01 00:00:00+00');

CREATE TABLE cib_inquiry_2026_04 PARTITION OF cib_inquiry
    FOR VALUES FROM ('2026-04-01 00:00:00+00') TO ('2026-05-01 00:00:00+00');

CREATE TABLE cib_inquiry_2026_05 PARTITION OF cib_inquiry
    FOR VALUES FROM ('2026-05-01 00:00:00+00') TO ('2026-06-01 00:00:00+00');

CREATE TABLE cib_inquiry_2026_06 PARTITION OF cib_inquiry
    FOR VALUES FROM ('2026-06-01 00:00:00+00') TO ('2026-07-01 00:00:00+00');

CREATE TABLE cib_inquiry_2026_07 PARTITION OF cib_inquiry
    FOR VALUES FROM ('2026-07-01 00:00:00+00') TO ('2026-08-01 00:00:00+00');

CREATE TABLE cib_inquiry_2026_08 PARTITION OF cib_inquiry
    FOR VALUES FROM ('2026-08-01 00:00:00+00') TO ('2026-09-01 00:00:00+00');

CREATE TABLE cib_inquiry_2026_09 PARTITION OF cib_inquiry
    FOR VALUES FROM ('2026-09-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');

CREATE TABLE cib_inquiry_2026_10 PARTITION OF cib_inquiry
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

CREATE TABLE cib_inquiry_2026_11 PARTITION OF cib_inquiry
    FOR VALUES FROM ('2026-11-01 00:00:00+00') TO ('2026-12-01 00:00:00+00');

CREATE TABLE cib_inquiry_2026_12 PARTITION OF cib_inquiry
    FOR VALUES FROM ('2026-12-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

-- Default partition
CREATE TABLE cib_inquiry_default PARTITION OF cib_inquiry DEFAULT;

-- Unique constraint on reference (needs partition key)
CREATE UNIQUE INDEX uk_cib_inquiry_ref ON cib_inquiry(inquiry_reference_no, requested_at);

-- Indexes
CREATE INDEX idx_cib_inquiry_client ON cib_inquiry(client_id);
CREATE INDEX idx_cib_inquiry_status ON cib_inquiry(status);
CREATE INDEX idx_cib_inquiry_nid ON cib_inquiry(nid_number_encrypted);

-- Comments
COMMENT ON TABLE cib_inquiry IS 'Partitioned CIB inquiry table (monthly by requested_at)';
```

---

## 7. Monthly Partition Automation

### 7.1 Partition Creation Function

```sql
-- ============================================================================
-- Function: fn_create_monthly_partitions
-- Purpose: Create monthly partitions for the next N months
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_create_monthly_partitions(
    p_schema_name TEXT,
    p_table_name TEXT,
    p_partition_column TEXT,
    p_months_ahead INTEGER DEFAULT 3
) RETURNS INTEGER AS $$
DECLARE
    v_start_date DATE;
    v_end_date DATE;
    v_partition_name TEXT;
    v_sql TEXT;
    v_count INTEGER := 0;
    v_current_month DATE;
    v_column_type TEXT;
BEGIN
    -- Get column type to determine partition syntax
    SELECT data_type INTO v_column_type
    FROM information_schema.columns
    WHERE table_schema = p_schema_name
        AND table_name = p_table_name
        AND column_name = p_partition_column;

    -- Loop through months
    FOR i IN 0..p_months_ahead LOOP
        v_current_month := DATE_TRUNC('month', CURRENT_DATE + (i || ' months')::INTERVAL);
        v_start_date := v_current_month;
        v_end_date := v_current_month + INTERVAL '1 month';

        v_partition_name := p_table_name || '_' || TO_CHAR(v_current_month, 'YYYY_MM');

        -- Check if partition exists
        IF NOT EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = p_schema_name
                AND c.relname = v_partition_name
        ) THEN
            -- Create partition based on column type
            IF v_column_type LIKE 'timestamp%' THEN
                v_sql := format(
                    'CREATE TABLE %I.%I PARTITION OF %I.%I FOR VALUES FROM (%L) TO (%L)',
                    p_schema_name, v_partition_name,
                    p_schema_name, p_table_name,
                    v_start_date::TIMESTAMP WITH TIME ZONE,
                    v_end_date::TIMESTAMP WITH TIME ZONE
                );
            ELSE
                v_sql := format(
                    'CREATE TABLE %I.%I PARTITION OF %I.%I FOR VALUES FROM (%L) TO (%L)',
                    p_schema_name, v_partition_name,
                    p_schema_name, p_table_name,
                    v_start_date,
                    v_end_date
                );
            END IF;

            EXECUTE v_sql;
            v_count := v_count + 1;

            RAISE NOTICE 'Created partition: %.%', p_schema_name, v_partition_name;
        END IF;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;
```

### 7.2 Tenant-Wide Partition Creation

```sql
-- ============================================================================
-- Function: fn_create_all_tenant_partitions
-- Purpose: Create partitions for all tenants
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_create_all_tenant_partitions(
    p_months_ahead INTEGER DEFAULT 3
) RETURNS TABLE (
    tenant_schema TEXT,
    table_name TEXT,
    partitions_created INTEGER
) AS $$
DECLARE
    v_tenant RECORD;
    v_table RECORD;
    v_count INTEGER;
    v_partitioned_tables TEXT[][] := ARRAY[
        ARRAY['m_loan_transaction', 'transaction_date'],
        ARRAY['audit_log', 'event_timestamp'],
        ARRAY['loan_classification_history', 'classification_date'],
        ARRAY['cib_inquiry', 'requested_at']
    ];
BEGIN
    -- Loop through all active tenants
    FOR v_tenant IN
        SELECT schema_name FROM public.tenants WHERE status = 'ACTIVE'
    LOOP
        -- Loop through partitioned tables
        FOREACH v_table SLICE 1 IN ARRAY v_partitioned_tables
        LOOP
            -- Create partitions
            SELECT fn_create_monthly_partitions(
                v_tenant.schema_name,
                v_table[1],
                v_table[2],
                p_months_ahead
            ) INTO v_count;

            RETURN QUERY SELECT v_tenant.schema_name, v_table[1], v_count;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### 7.3 Scheduled Job (pg_cron)

```sql
-- ============================================================================
-- Schedule: Monthly partition creation (pg_cron)
-- Runs on 1st of each month at 00:30 AM
-- ============================================================================

-- Install pg_cron extension (once)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule partition creation job
SELECT cron.schedule(
    'create-monthly-partitions',          -- job name
    '30 0 1 * *',                         -- 1st of month at 00:30
    $$SELECT fn_create_all_tenant_partitions(3)$$
);

-- Alternative: Use pg_partman for automated management
-- CREATE EXTENSION IF NOT EXISTS pg_partman;
```

### 7.4 Partition Creation Monitoring

```sql
-- ============================================================================
-- Table: partition_management_log
-- Purpose: Track partition creation/maintenance operations
-- Schema: public
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.partition_management_log (
    id                  BIGSERIAL PRIMARY KEY,
    operation_type      VARCHAR(30) NOT NULL,
    tenant_schema       VARCHAR(100),
    table_name          VARCHAR(100),
    partition_name      VARCHAR(150),
    partition_range     TEXT,
    status              VARCHAR(20) NOT NULL,
    error_message       TEXT,
    rows_affected       BIGINT,
    executed_at         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    executed_by         VARCHAR(100) DEFAULT CURRENT_USER,
    duration_ms         INTEGER
);

CREATE INDEX idx_part_log_table ON public.partition_management_log(table_name);
CREATE INDEX idx_part_log_executed ON public.partition_management_log(executed_at);
```

---

## 8. Partition Maintenance

### 8.1 Partition Pruning (Old Partitions)

```sql
-- ============================================================================
-- Function: fn_detach_old_partitions
-- Purpose: Detach partitions older than retention period
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_detach_old_partitions(
    p_schema_name TEXT,
    p_table_name TEXT,
    p_retention_months INTEGER
) RETURNS INTEGER AS $$
DECLARE
    v_cutoff_date DATE;
    v_partition RECORD;
    v_count INTEGER := 0;
    v_sql TEXT;
BEGIN
    v_cutoff_date := DATE_TRUNC('month', CURRENT_DATE - (p_retention_months || ' months')::INTERVAL);

    -- Find partitions to detach
    FOR v_partition IN
        SELECT
            c.relname AS partition_name,
            pg_get_expr(c.relpartbound, c.oid) AS partition_bound
        FROM pg_class p
        JOIN pg_inherits i ON p.oid = i.inhparent
        JOIN pg_class c ON c.oid = i.inhrelid
        JOIN pg_namespace n ON n.oid = p.relnamespace
        WHERE n.nspname = p_schema_name
            AND p.relname = p_table_name
            AND c.relname LIKE p_table_name || '_%'
            AND c.relname != p_table_name || '_default'
        ORDER BY c.relname
    LOOP
        -- Extract date from partition name (e.g., table_2024_01)
        IF v_partition.partition_name ~ '_[0-9]{4}_[0-9]{2}$' THEN
            DECLARE
                v_partition_date DATE;
            BEGIN
                v_partition_date := TO_DATE(
                    RIGHT(v_partition.partition_name, 7),
                    'YYYY_MM'
                );

                IF v_partition_date < v_cutoff_date THEN
                    -- Detach partition (keeps data, removes from parent)
                    v_sql := format(
                        'ALTER TABLE %I.%I DETACH PARTITION %I.%I',
                        p_schema_name, p_table_name,
                        p_schema_name, v_partition.partition_name
                    );
                    EXECUTE v_sql;

                    -- Log operation
                    INSERT INTO public.partition_management_log (
                        operation_type, tenant_schema, table_name, partition_name, status
                    ) VALUES (
                        'DETACH', p_schema_name, p_table_name, v_partition.partition_name, 'SUCCESS'
                    );

                    v_count := v_count + 1;
                    RAISE NOTICE 'Detached partition: %.%', p_schema_name, v_partition.partition_name;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                INSERT INTO public.partition_management_log (
                    operation_type, tenant_schema, table_name, partition_name, status, error_message
                ) VALUES (
                    'DETACH', p_schema_name, p_table_name, v_partition.partition_name, 'FAILED', SQLERRM
                );
            END;
        END IF;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;
```

### 8.2 Partition Archival

```sql
-- ============================================================================
-- Function: fn_archive_partition
-- Purpose: Move detached partition to archive schema
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_archive_partition(
    p_source_schema TEXT,
    p_partition_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_archive_schema TEXT;
    v_sql TEXT;
BEGIN
    v_archive_schema := p_source_schema || '_archive';

    -- Create archive schema if not exists
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', v_archive_schema);

    -- Move table to archive schema
    v_sql := format(
        'ALTER TABLE %I.%I SET SCHEMA %I',
        p_source_schema, p_partition_name, v_archive_schema
    );
    EXECUTE v_sql;

    -- Log operation
    INSERT INTO public.partition_management_log (
        operation_type, tenant_schema, partition_name, status
    ) VALUES (
        'ARCHIVE', p_source_schema, p_partition_name, 'SUCCESS'
    );

    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.partition_management_log (
        operation_type, tenant_schema, partition_name, status, error_message
    ) VALUES (
        'ARCHIVE', p_source_schema, p_partition_name, 'FAILED', SQLERRM
    );
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
```

### 8.3 Vacuum and Analyze Schedule

```sql
-- ============================================================================
-- Vacuum and Analyze for Partitioned Tables
-- ============================================================================

-- Per-partition vacuum (more efficient than whole table)
-- Schedule via pg_cron

-- Nightly vacuum for active partitions (current month + previous)
SELECT cron.schedule(
    'vacuum-active-partitions',
    '0 2 * * *',  -- 2 AM daily
    $$
    DO $$
    DECLARE
        v_current_partition TEXT;
        v_previous_partition TEXT;
        v_tenant RECORD;
    BEGIN
        v_current_partition := TO_CHAR(CURRENT_DATE, 'YYYY_MM');
        v_previous_partition := TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY_MM');

        FOR v_tenant IN SELECT schema_name FROM public.tenants WHERE status = 'ACTIVE'
        LOOP
            -- Vacuum current month transaction partition
            EXECUTE format('VACUUM ANALYZE %I.m_loan_transaction_%s',
                v_tenant.schema_name, v_current_partition);
            EXECUTE format('VACUUM ANALYZE %I.m_loan_transaction_%s',
                v_tenant.schema_name, v_previous_partition);

            -- Vacuum audit log partitions
            EXECUTE format('VACUUM ANALYZE %I.audit_log_%s',
                v_tenant.schema_name, v_current_partition);
        END LOOP;
    END $$;
    $$
);

-- Weekly full table statistics update
SELECT cron.schedule(
    'analyze-partitioned-tables',
    '0 3 * * 0',  -- Sunday 3 AM
    $$SELECT fn_analyze_all_partitions()$$
);
```

---

## 9. Query Performance Considerations

### 9.1 Partition Pruning

PostgreSQL automatically prunes partitions when the partition key is in WHERE clause.

```sql
-- GOOD: Partition pruning active (only scans relevant partitions)
SELECT * FROM m_loan_transaction
WHERE transaction_date BETWEEN '2026-01-01' AND '2026-01-31'
    AND loan_id = 12345;

-- EXPLAIN shows: Scans only m_loan_transaction_2026_01

-- BAD: No pruning (scans ALL partitions)
SELECT * FROM m_loan_transaction
WHERE EXTRACT(MONTH FROM transaction_date) = 1;

-- BAD: No pruning with function on partition key
SELECT * FROM m_loan_transaction
WHERE DATE_TRUNC('month', transaction_date) = '2026-01-01';
```

### 9.2 Partition-Wise Joins

```sql
-- Enable partition-wise joins (PostgreSQL 16)
SET enable_partitionwise_join = ON;
SET enable_partitionwise_aggregate = ON;

-- Efficient join between partitioned tables
SELECT
    t.transaction_date,
    t.amount,
    c.new_status
FROM m_loan_transaction t
JOIN loan_classification_history c ON t.loan_id = c.loan_id
    AND t.transaction_date::DATE = c.classification_date
WHERE t.transaction_date BETWEEN '2026-01-01' AND '2026-03-31';

-- PostgreSQL will join matching partitions together
```

### 9.3 Query Optimization Tips

| Scenario | Recommendation |
|----------|----------------|
| Date range queries | Always include partition key in WHERE |
| Cross-partition aggregates | Use parallel query execution |
| Joins with partitioned tables | Enable partition-wise joins |
| Full table scans | Create appropriate indexes on each partition |
| Large result sets | Use LIMIT with ORDER BY partition key |

### 9.4 Monitoring Partition Performance

```sql
-- View partition sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname || '.' || tablename)) AS data_size,
    pg_size_pretty(pg_indexes_size(schemaname || '.' || tablename)) AS index_size
FROM pg_tables
WHERE tablename LIKE 'm_loan_transaction_%'
    AND schemaname = 'bank_001'
ORDER BY tablename;

-- Check partition pruning in query plan
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM m_loan_transaction
WHERE transaction_date BETWEEN '2026-01-01' AND '2026-01-31';
```

---

## 10. Archive Strategy

### 10.1 Data Retention Policy

| Data Category | Active Retention | Archive Retention | Total |
|---------------|------------------|-------------------|-------|
| Financial Transactions | 7 years | 7 years | 14 years |
| Audit Logs | 7 years | 7 years | 14 years |
| Classification History | Loan lifetime + 7 years | N/A | Variable |
| CIB Inquiry | 2 years | 7 years | 9 years |
| Notifications | 2 years | N/A | 2 years |

### 10.2 Archive Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Data Archive Architecture                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Active Database (PostgreSQL 16)                                   │
│   ┌──────────────────────────────────────────────────────────┐     │
│   │  bank_001                                                  │     │
│   │  ├── m_loan_transaction_2026_01 (hot)                     │     │
│   │  ├── m_loan_transaction_2026_02 (hot)                     │     │
│   │  └── ... (rolling 7 years)                                │     │
│   └──────────────────────────────────────────────────────────┘     │
│                           │                                          │
│                           │ Detach & Archive (after 7 years)        │
│                           ▼                                          │
│   Archive Schema (Same PostgreSQL)                                  │
│   ┌──────────────────────────────────────────────────────────┐     │
│   │  bank_001_archive                                          │     │
│   │  ├── m_loan_transaction_2019_01 (cold)                    │     │
│   │  ├── m_loan_transaction_2019_02 (cold)                    │     │
│   │  └── ... (years 8-14)                                     │     │
│   └──────────────────────────────────────────────────────────┘     │
│                           │                                          │
│                           │ Export to Cold Storage (after 14 years) │
│                           ▼                                          │
│   Cold Storage (MinIO/S3)                                           │
│   ┌──────────────────────────────────────────────────────────┐     │
│   │  Parquet files for regulatory retention                    │     │
│   └──────────────────────────────────────────────────────────┘     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 10.3 Archive Process

```sql
-- ============================================================================
-- Function: fn_run_monthly_archive
-- Purpose: Monthly archive job for all tenants
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_run_monthly_archive() RETURNS TABLE (
    tenant_schema TEXT,
    table_name TEXT,
    partitions_archived INTEGER,
    rows_archived BIGINT
) AS $$
DECLARE
    v_tenant RECORD;
    v_table_config RECORD;
    v_partition RECORD;
    v_count INTEGER;
    v_rows BIGINT;
    v_cutoff_date DATE;
BEGIN
    -- Archive configuration
    FOR v_table_config IN
        SELECT * FROM (VALUES
            ('m_loan_transaction', 84),     -- 7 years = 84 months
            ('audit_log', 84),
            ('loan_classification_history', 84),
            ('cib_inquiry', 24),            -- 2 years = 24 months
            ('notification_log', 24)
        ) AS t(tbl_name, retention_months)
    LOOP
        v_cutoff_date := DATE_TRUNC('month', CURRENT_DATE - (v_table_config.retention_months || ' months')::INTERVAL);

        FOR v_tenant IN
            SELECT schema_name FROM public.tenants WHERE status = 'ACTIVE'
        LOOP
            v_count := 0;
            v_rows := 0;

            -- Detach and archive old partitions
            FOR v_partition IN
                SELECT c.relname AS partition_name
                FROM pg_class p
                JOIN pg_inherits i ON p.oid = i.inhparent
                JOIN pg_class c ON c.oid = i.inhrelid
                JOIN pg_namespace n ON n.oid = p.relnamespace
                WHERE n.nspname = v_tenant.schema_name
                    AND p.relname = v_table_config.tbl_name
                    AND c.relname ~ '_[0-9]{4}_[0-9]{2}$'
            LOOP
                DECLARE
                    v_partition_date DATE;
                BEGIN
                    v_partition_date := TO_DATE(RIGHT(v_partition.partition_name, 7), 'YYYY_MM');

                    IF v_partition_date < v_cutoff_date THEN
                        -- Get row count before detaching
                        EXECUTE format('SELECT COUNT(*) FROM %I.%I',
                            v_tenant.schema_name, v_partition.partition_name) INTO v_rows;

                        -- Detach partition
                        EXECUTE format('ALTER TABLE %I.%I DETACH PARTITION %I.%I',
                            v_tenant.schema_name, v_table_config.tbl_name,
                            v_tenant.schema_name, v_partition.partition_name);

                        -- Archive partition
                        PERFORM fn_archive_partition(v_tenant.schema_name, v_partition.partition_name);

                        v_count := v_count + 1;
                    END IF;
                END;
            END LOOP;

            IF v_count > 0 THEN
                RETURN QUERY SELECT v_tenant.schema_name, v_table_config.tbl_name, v_count, v_rows;
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule monthly archive job
SELECT cron.schedule(
    'monthly-archive',
    '0 1 1 * *',  -- 1st of month at 1 AM
    $$SELECT * FROM fn_run_monthly_archive()$$
);
```

### 10.4 Purge Strategy (After 14 Years)

```sql
-- ============================================================================
-- Function: fn_purge_archived_data
-- Purpose: Permanently delete data after full retention period
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_purge_archived_data(
    p_archive_schema TEXT,
    p_retention_years INTEGER DEFAULT 14
) RETURNS INTEGER AS $$
DECLARE
    v_cutoff_date DATE;
    v_table RECORD;
    v_count INTEGER := 0;
BEGIN
    v_cutoff_date := DATE_TRUNC('month', CURRENT_DATE - (p_retention_years || ' years')::INTERVAL);

    FOR v_table IN
        SELECT tablename FROM pg_tables
        WHERE schemaname = p_archive_schema
            AND tablename ~ '_[0-9]{4}_[0-9]{2}$'
    LOOP
        DECLARE
            v_table_date DATE;
        BEGIN
            v_table_date := TO_DATE(RIGHT(v_table.tablename, 7), 'YYYY_MM');

            IF v_table_date < v_cutoff_date THEN
                -- Export to cold storage before dropping (optional)
                -- PERFORM fn_export_to_parquet(p_archive_schema, v_table.tablename);

                -- Drop table
                EXECUTE format('DROP TABLE IF EXISTS %I.%I', p_archive_schema, v_table.tablename);

                -- Log
                INSERT INTO public.partition_management_log (
                    operation_type, tenant_schema, partition_name, status
                ) VALUES ('PURGE', p_archive_schema, v_table.tablename, 'SUCCESS');

                v_count := v_count + 1;
            END IF;
        END;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;
```

---

## 11. Compliance Matrix

### 11.1 BRD Compliance

| BRD Requirement | Section | Implementation |
|-----------------|---------|----------------|
| BRD 8.2.1 | Financial Data Retention (7 years) | Monthly partitions with 84-month retention |
| BRD 8.2.2 | Audit Trail Retention | Partitioned audit_log with 7-year retention |
| BRD 8.2.3 | Archive Strategy | Detach → Archive schema → Cold storage |

### 11.2 SRS Compliance

| SRS Requirement | Section | Implementation |
|-----------------|---------|----------------|
| SRS 7.3.1 | Query Performance | Partition pruning, partition-wise joins |
| SRS 7.3.2 | Large Table Management | Monthly partitioning strategy |
| SRS 7.3.3 | Data Lifecycle | Automated archive and purge |

### 11.3 Regulatory Compliance

| Regulation | Requirement | Implementation |
|------------|-------------|----------------|
| Bangladesh Bank | 7-year financial records | 84-month partition retention |
| ICT Security V4.0 | Data retention policy | Archive schema + cold storage |
| BRPD 15/2024 | Classification history | Partitioned loan_classification_history |

---

## 12. Appendices

### Appendix A: Partition Naming Convention

```
{table_name}_{YYYY}_{MM}

Examples:
- m_loan_transaction_2026_01
- audit_log_2026_02
- loan_classification_history_2026_03
- cib_inquiry_2026_04
```

### Appendix B: pg_partman Configuration (Alternative)

```sql
-- Using pg_partman for automated partition management
CREATE EXTENSION IF NOT EXISTS pg_partman;

-- Configure m_loan_transaction
SELECT partman.create_parent(
    'bank_001.m_loan_transaction',
    'transaction_date',
    'native',
    'monthly'
);

UPDATE partman.part_config
SET retention = '84 months',
    retention_keep_table = true,
    premake = 3
WHERE parent_table = 'bank_001.m_loan_transaction';
```

### Appendix C: Monitoring Queries

```sql
-- List all partitions for a table
SELECT
    nmsp_parent.nspname AS parent_schema,
    parent.relname AS parent_table,
    nmsp_child.nspname AS child_schema,
    child.relname AS child_table,
    pg_get_expr(child.relpartbound, child.oid) AS partition_range
FROM pg_inherits
JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
JOIN pg_class child ON pg_inherits.inhrelid = child.oid
JOIN pg_namespace nmsp_parent ON parent.relnamespace = nmsp_parent.oid
JOIN pg_namespace nmsp_child ON child.relnamespace = nmsp_child.oid
WHERE parent.relname = 'm_loan_transaction'
ORDER BY child.relname;

-- Check partition sizes
SELECT
    child.relname AS partition_name,
    pg_size_pretty(pg_relation_size(child.oid)) AS size,
    pg_stat_get_live_tuples(child.oid) AS row_count
FROM pg_inherits
JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
JOIN pg_class child ON pg_inherits.inhrelid = child.oid
WHERE parent.relname = 'm_loan_transaction'
ORDER BY child.relname;
```

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Author | System Architect | | |
| Reviewer | Lead Developer | | |
| Approver | Technical Director | | |

---

*This document is part of the ULMS v2.0 Database Architecture documentation series.*

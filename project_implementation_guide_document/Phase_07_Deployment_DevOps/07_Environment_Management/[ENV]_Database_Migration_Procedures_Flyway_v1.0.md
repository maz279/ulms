# Database Migration Procedures - Flyway

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Database Migration Procedures - Flyway |
| **Project Name** | ULMS |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Classification** | Internal |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Migration Naming](#2-migration-naming)
3. [Migration Scripts](#3-migration-scripts)
4. [CI/CD Integration](#4-cicd-integration)
5. [Rollback Procedures](#5-rollback-procedures)
6. [Best Practices](#6-best-practices)

---

## 1. Overview

Database migration management using Flyway for ULMS PostgreSQL database.

---

## 2. Migration Naming

```
db/migration/
├── V1.0.0__baseline.sql
├── V1.0.1__create_loans_table.sql
├── V1.0.2__create_customers_table.sql
├── V1.1.0__add_loan_indexes.sql
└── V1.1.1__alter_customer_columns.sql
```

---

## 3. Migration Scripts

### 3.1 Example Migration

```sql
-- V1.0.1__create_loans_table.sql
CREATE TABLE loans (
    id BIGSERIAL PRIMARY KEY,
    application_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    amount DECIMAL(15,2) NOT NULL,
    tenure_months INTEGER NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_loans_customer ON loans(customer_id);
CREATE INDEX idx_loans_status ON loans(status);

COMMENT ON TABLE loans IS 'Loan applications table';
```

---

## 4. CI/CD Integration

```yaml
# GitLab CI
flyway-migrate:
  stage: migrate
  image: flyway/flyway:10
  script:
    - flyway -url=$DB_URL -user=$DB_USER -password=$DB_PASSWORD migrate
  only:
    - main
```

---

## 5. Rollback Procedures

### 5.1 Undo Migration

```sql
-- U1.0.1__create_loans_table.sql
DROP INDEX idx_loans_status;
DROP INDEX idx_loans_customer;
DROP TABLE loans;
```

### 5.2 Baseline Command

```bash
flyway baseline -baselineVersion=1.0.0
```

---

## 6. Best Practices

| Practice | Description |
|----------|-------------|
| Versioning | Use semantic versioning |
| Idempotency | Make migrations rerunnable |
| Transactions | Wrap in transactions |
| Testing | Test migrations in staging |
| Documentation | Comment complex migrations |

---

*© 2026 Unisoft Systems Limited.*

---
type: how-to
topic: flyway_database_migration_and_schema_evolution
target_audience: [dba, backend_developer, devops_engineer, data_architect]
version: 2026.10
document_id: DOC-03-MNT-02
---

# DOC-03-MNT-02: Flyway Database Migration & Schema Evolution Guide

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | Flyway Database Migration & Schema Evolution Guide |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Database Administration & Evolution Guide |
| **Status** | Approved Master Migration Guide |
| **Authority Chain** | `LMS_CODEBASE/apps/api/src/main/resources/db/migration/` → `LMS_CODEBASE/PLANNING/04_Data_Model_and_Migration_Plan.md` |
| **Target Codebase** | `c:\software_project\mim_project\LMS\LMS_CODEBASE` |

---

## 1. Relational Topology & Dual-Schema Architecture

ULMS v2.0 maintains a strictly partitioned dual-schema physical database architecture within PostgreSQL 17 to preserve clean separation between the loan origination workflow engine and the core banking accounting ledger:

```mermaid
flowchart TD
    subgraph PG17 ["PostgreSQL 17 Database Server (ulms_prod)"]
        subgraph Schema_ULMS ["ulms Schema (67 tables in total, V1–V18)"]
            T1["customer, kyc_check"]
            T2["application, collateral"]
            T3["score_result, cib_report"]
            T4["approval_band, workflow_task"]
            T5["collection_action, dunning_step"]
            T6["classification_history, provision_run"]
            T7["outbox_event, idempotency_key"]
        end
        subgraph Schema_Fineract ["fineract_default Schema (25 Tables)"]
            F1["m_client, m_group"]
            F2["m_loan, m_loan_repayment_schedule"]
            F3["m_loan_transaction, m_loan_charge"]
            F4["acc_gl_journal_entry, acc_gl_account"]
        end
    end
    API["ULMS Spring Boot API"] -->|Flyway V1..V18| Schema_ULMS
    FIN["Fineract CE 1.12.x"] -->|Fineract Native Migrations| Schema_Fineract
```

### Key Schema Responsibilities:
- **`ulms` (Managed by Flyway):** High-speed customer onboarding, e-KYC documents, loan application wizards, risk scorecards, credit committee approval ladder tasks, BRPD 15/2024 classification board, and transactional outbox events.
- **`fineract_default` (Managed by Fineract Engine):** Authoritative general ledger balances, double-entry accounting journal vouchers, loan amortization schedules, and interest accrual ledgers.

---

## 2. Chronological Flyway Migration Inventory (V001 to V018)

All schema changes in `ulms` are version-controlled, immutable, and sequentially executed via Flyway:

| Migration File | Released | Core Tables Created / Altered | Architectural Purpose |
|---|---|---|---|
| **`V1__init.sql`** | Phase P0 | `uuid-ossp`, `pgcrypto` extensions | Enables cryptographic UUID generation and hashing. |
| **`V2__origination_workflow.sql`** | Phase P1 | `customers`, `customer_kyc`, `addresses` | Core customer master register and biometric KYC metadata. |
| **`V3__customer_compliance.sql`** | Phase P1 | `applications`, `application_co_borrowers` | Loan origination pipeline drafts and co-borrower relationships. |
| **`V4__actor_width.sql`** | Phase P1 | `collaterals`, `collateral_valuations` | Immovable/movable asset registers with forced sale values. |
| **`V5__credit_approval.sql`** | Phase P2 | `cib_inquiries`, `cib_contracts` | Bangladesh Bank CIB inquiry cache and contract records. |
| **`V6__cib_compliance.sql`** | Phase P2 | `scorecard_results`, `dbr_calculations` | Risk model scoring breakdown and DBR evaluation history. |
| **`V7__concurrency_audit.sql`** | Phase P2 | `approval_tasks`, `approval_actions` | 7-stage credit committee delegation ladder and audit trail. |
| **`V8__servicing_collections.sql`** | Phase P2 | `sanction_letters`, `sanction_covenants` | Formal loan sanction letters and credit covenants. |
| **`V9__collections_parity.sql`** | Phase P3 | `servicing_disbursements`, `prepayments` | Disbursement tracking and early settlement records. |
| **`V10__regcon_reporting.sql`** | Phase P3 | `repayment_transactions`, `repayment_allocations` | Teller and gateway cash/cheque repayment journal cache. |
| **`V11__regcon_audit_g.sql`** | Phase P3 | `payment_webhooks`, `webhook_deliveries` | Asynchronous MFS webhook idempotency and replay buffer. |
| **`V12__r3_r4_r5_modules.sql`** | Phase P4 | `collections_cases`, `ptp_records` | Delinquency worklist and Promise-to-Pay (PTP) tracking. |
| **`V13__loan_stage_width.sql`** | Phase P4 | `dunning_actions`, `legal_notices` | Statutory dunning letters, SMS reminders, and legal notices. |
| **`V14__r10_business_logic.sql`** | Phase P4 | `classification_history`, `provision_runs` | BRPD Circular 15/2024 classification snapshots and provision JVs. |
| **`V15__q3_uat_flips.sql`** | Phase P0 | `outbox_event`, `outbox_dead_letters` | Transactional outbox table for resilient domain event publishing. |
| **`V16__q1_workflow_depth.sql`**| Phase P0 | `idempotency_records` | Distributed idempotency locks with TTL timestamps. |
| **`V17__q1_collections_depth.sql`**| Phase P5 | Foreign keys, composite B-tree indexes | Performance tuning for high-density customer/loan lookups. |
| **`V18__field_gateway.sql`** | Phase P5 | `audit_entry`, change capture triggers | Bangladesh Bank regulatory compliance immutable audit log. |

---

## 3. Zero-Downtime Database Evolution: The Expand-Contract Pattern

In a 24/7 banking environment, database schema changes must never require scheduled system downtime or lock tables during active branch banking hours. ULMS mandates the **Expand-Contract Pattern**:

```mermaid
sequenceDiagram
    autonumber
    Note over App,DB: Phase 1: Expand (Release N)
    App->>DB: Add new column (nullable or with default)
    App->>DB: Application writes to both old and new columns
    Note over App,DB: Phase 2: Migrate (Background Data Backfill)
    App->>DB: Background worker backfills existing historical rows
    Note over App,DB: Phase 3: Contract (Release N+1)
    App->>DB: Application stops reading old column
    App->>DB: Drop old column safely in subsequent migration
```

### Golden Rules of Non-Locking SQL:
1. **Never add a `NOT NULL` column without a default:** Adding `NOT NULL` without a `DEFAULT` scans and locks the entire table. Always add as nullable first, backfill data, and then add the constraint asynchronously:
   ```sql
   -- Safe Column Addition
   ALTER TABLE ulms.customer 
   ADD COLUMN IF NOT EXISTS national_id_v2 VARCHAR(17);
   ```
2. **Never build indexes synchronously on large tables:** Always use `CONCURRENTLY` to avoid blocking writes:
   ```sql
   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_nid_v2 
   ON ulms.customer (national_id_v2);
   ```
3. **Never rename columns in-place:** A column rename instantly breaks older running API pods during a rolling upgrade. Expand with a new column, dual-write, and contract in the next release cycle.

---

## 4. Emergency Database Runbooks

### Runbook 1: Resolving Flyway Checksum Mismatches (`flyway repair`)
- **Symptom:** API fails to start with `FlywayException: Validate failed: Migration checksum mismatch for migration version V004`.
- **Root Cause:** A developer modified the text or whitespace of an already applied migration script instead of creating a new version.
- **Remediation Procedure:**
  1. Inspect differences between the Git migration file and the recorded checksum in `flyway_schema_history`:
  ```sql
  SELECT version, description, checksum, installed_on 
  FROM ulms.flyway_schema_history 
  WHERE version = '004';
  ```
  2. If the modification was cosmetic (e.g., adding a comment) and schema integrity is verified:
  ```bash
  cd apps/api
  ./gradlew flywayRepair
  ```
  3. The `flywayRepair` command recalculates checksums in `flyway_schema_history` and re-aligns validation.

### Runbook 2: Resolving Failed Migrations
- **Symptom:** Migration fails mid-execution; `flyway_schema_history` records `success = false`. Subsequent boots are blocked.
- **Remediation Procedure:**
  1. Review PostgreSQL server logs to identify the exact failing SQL statement.
  2. In PostgreSQL, DDL inside migrations is wrapped in transactions. Manually correct the underlying issue.
  3. Delete the failed history row:
  ```sql
  DELETE FROM ulms.flyway_schema_history WHERE version = '$FAILED_VERSION' AND success = false;
  ```
  4. Fix the SQL script and re-run `./gradlew flywayMigrate`.

---

*— End of Flyway Database Migration & Schema Evolution Guide —*


---

## Addendum — v3.1.0 corrections (Independent Forensic Re-audit, 8 October 2026)

- Migration inventory replaced (v3.1.0) with the real V1–V18 filenames from apps/api/src/main/resources/db/migration/ (V1__init, V2__origination_workflow, V3__customer_compliance, V4__actor_width, V5__credit_approval, V6__cib_compliance, V7__concurrency_audit, V8__servicing_collections, V9__collections_parity, V10__regcon_reporting, V11__regcon_audit_g, V12__r3_r4_r5_modules, V13__loan_stage_width, V14__r10_business_logic, V15__q3_uat_flips, V16__q1_workflow_depth, V17__q1_collections_depth, V18__field_gateway). Schema names corrected to ulms (67 tables total) + fineract_default. The 45k-row rehearsal script lives at deploy/drills/migration-45k-rehearsal.sh.

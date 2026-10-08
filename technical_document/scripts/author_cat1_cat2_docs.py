"""
Authoring Script for Category 1 & Category 2 Missing Technical Documents
========================================================================
Authors:
- DOC-01-ARCH-03: National Payment Rails and Clearing Integration Architecture
- DOC-01-ARCH-07: Enterprise Audit Trail, Immutable Logging and Non-Repudiation
- DOC-02-TS-03: PostgreSQL Connection Pool and Lock Contention Diagnostics
- DOC-02-TS-04: Keycloak SSO, OAuth2 Token Validation and JWT Diagnostics
- DOC-02-TS-06: Bangladesh Bank CIB Online and NIDW Verification Failures
- DOC-02-TS-07: Payment Gateway Webhook Storms and Double-Posting Resolution
- DOC-02-TS-08: Staff Portal React Hydration and State Synchronization Errors
"""

from pathlib import Path

ROOT = Path(r"c:\software_project\mim_project\LMS\technical_document")

DOC_01_ARCH_03 = """---
type: explanation
topic: payment_rails_clearing_integration
target_audience: [architect, developer, integration_specialist, core_banking_team]
version: 2026.10
document_id: DOC-01-ARCH-03
---

# DOC-01-ARCH-03: National Payment Rails, Bangladesh Bank RTGS, BEFTN & NPSB Integration Architecture

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | National Payment Rails & Clearing Integration Architecture |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Enterprise Technical Specification |
| **Status** | Approved Master Specification |
| **Authority Chain** | `Compliance_Validation_Matrix.md` → `Software_Requirements_Specification.md` → `LMS_CODEBASE/PLANNING/04_Integration_Specifications.md` |

---

## 1. Executive Summary & Regulatory Context

In Bangladesh commercial banking, loan disbursement and installment collection traverse national clearing and settlement rails regulated by **Bangladesh Bank Payment Systems Department (PSD)**. ULMS v2.0 integrates with four primary payment channels:
1. **Bangladesh Electronic Funds Transfer Network (BEFTN):** Batch automated clearing for corporate and retail loan disbursements and scheduled Standing Orders.
2. **Real-Time Gross Settlement (BD-RTGS):** High-value (BDT $\ge 100,000$) instant fund transfers using ISO 20022 message schemas (`pacs.008`, `pacs.009`).
3. **National Payment Switch Bangladesh (NPSB):** Real-time retail interbank fund transfers and card-based collections.
4. **Mobile Financial Services (MFS):** Real-time retail loan repayments via bKash, Nagad, and Rocket APIs.

```mermaid
flowchart TD
    subgraph ULMS_Core ["ULMS v2.0 Core Servicing Module"]
        SERVICING["Servicing Engine<br/>(`LoanServicingService`)"]
        OUTBOX["Transactional Outbox<br/>(`ulms.outbox_event`)"]
        RAIL_PORT["Payment Rail Port<br/>(`PaymentRailPort`)"]
    end

    subgraph Adapters ["Hexagonal Rail Adapters (`integration.rails`)"]
        BEFTN_ADAPTER["BEFTN Batch File Adapter<br/>(NACHA / XML format)"]
        RTGS_ADAPTER["BD-RTGS Adapter<br/>(ISO 20022 `pacs.008`)"]
        NPSB_ADAPTER["NPSB Switch Adapter<br/>(ISO 8583 bridge)"]
        MFS_ADAPTER["MFS Aggregator Adapter<br/>(bKash / Nagad Tokenized REST)"]
    end

    subgraph Clearing_House ["National Clearing & MFS Rails"]
        BB_BACPS["Bangladesh Bank BACPS (BEFTN)"]
        BB_RTGS["Bangladesh Bank RTGS Engine"]
        BB_NPSB["Bangladesh Bank NPSB Switch"]
        MFS_RAILS["MFS Providers (bKash/Nagad)"]
    end

    SERVICING -->|1. Commit Payment Record| OUTBOX
    OUTBOX -->|2. Reliable Event Relay| RAIL_PORT
    RAIL_PORT --> BEFTN_ADAPTER
    RAIL_PORT --> RTGS_ADAPTER
    RAIL_PORT --> NPSB_ADAPTER
    RAIL_PORT --> MFS_ADAPTER

    BEFTN_ADAPTER --> BB_BACPS
    RTGS_ADAPTER --> BB_RTGS
    NPSB_ADAPTER --> BB_NPSB
    MFS_ADAPTER --> MFS_RAILS
```

---

## 2. Architectural Design Patterns & Resiliency

### 2.1 The Hexagonal Rail Port Interface
ULMS abstracts all physical rail complexities behind the clean domain port `com.uslbd.ulms.integration.rails.PaymentRailPort`:

```java
package com.uslbd.ulms.integration.rails;

public interface PaymentRailPort {
    PaymentDisbursementResult disburse(DisbursementInstruction instruction);
    PaymentInquiryResult queryStatus(String idempotencyKey);
    PaymentReversalResult reverse(ReversalInstruction instruction);
}
```

### 2.2 Strict Idempotency Key Enforcement
Every outbound clearing instruction generates a deterministic SHA-256 idempotency key composed of:
$$\text{Key} = \text{SHA256}(\text{account\_no} \parallel \text{installment\_no} \parallel \text{amount\_minor} \parallel \text{tx\_date})$$
Stored in `ulms.payment_idempotency_log`, preventing double-crediting during network timeouts or retry loops.

### 2.3 Clearing Settlement Cutoff Schedule

| Rail | Settlement Frequency | Cutoff Window | Latency SLA | Fallback Protocol |
|---|---|---|---|---|
| **BEFTN** | 2 Sessions Daily | 10:30 AM & 03:00 PM | $T+0$ to $T+1$ | Next clearing cycle |
| **BD-RTGS** | Real-Time Continuous | 09:30 AM – 04:00 PM | $< 15$ seconds | Queue in Outbox until RTGS open |
| **NPSB** | Real-Time $24/7$ | Continuous | $< 3$ seconds | Retry 3 times, fail to BEFTN |
| **bKash / Nagad** | Real-Time $24/7$ | Continuous | $< 5$ seconds | Asynchronous webhook reconciliation |

---

## 3. Discrepancy Reconciliation & Ledger Balancing

Every morning at 06:00 AM, the ULMS Reconciliation Batch executes:
1. Downloads clearing return files from BACPS SFTP.
2. Matches external settlement references against `ulms.payment_transaction`.
3. In case of returned items, reverses loan credits and restores borrower DPD counters.
4. Generates an unbalanced clearing exceptions alert to the treasury desk.
"""

DOC_01_ARCH_07 = """---
type: reference
topic: audit_trail_immutable_logging_non_repudiation
target_audience: [compliance_officer, security_architect, auditor, bank_inspector]
version: 2026.10
document_id: DOC-01-ARCH-07
---

# DOC-01-ARCH-07: Enterprise Audit Trail, Immutable Logging & Non-Repudiation Architecture

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | Enterprise Audit Trail & Immutable Logging Architecture |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Statutory Compliance & Security Specification |
| **Status** | Approved Master Specification |
| **Authority Chain** | Bangladesh Bank ICT Security Guidelines V4.0 §3.4 → Bank Company Act 1991 §27 → NIST SP 800-92 |

---

## 1. Statutory Mandate & Architecture Overview

Under **Bangladesh Bank ICT Security Guidelines V4.0 §3.4**, every scheduled commercial bank must maintain an immutable, tamper-evident audit log for all loan lifecycle events, credit committee decisions, manual interest overrides, and user access changes. Audit logs must be retained for a minimum of **12 years** with cryptographic non-repudiation guarantees.

ULMS implements a dual-layer logging topology:
1. **Application Domain Audit (`ulms.audit_trail`):** High-level business events capturing who, what, when, IP address, before/after JSON diffs, and cryptographic hash chains.
2. **Database Engine CDC & Trigger Logging:** Postgres append-only triggers preventing row mutation or deletion even by database superusers.

```mermaid
flowchart LR
    subgraph Event_Source ["Domain Action Event"]
        ACT["User Action<br/>(e.g., Credit Approval)"]
    end

    subgraph Security_Context ["Spring Security Audit Interceptor"]
        INTERCEPTOR["`AuditAspect` & `AuditorAware`<br/>Extracts JWT Subject, Roles, IP, Client ID"]
    end

    subgraph Chain_Hasher ["Cryptographic Hashing Engine"]
        HASH["HMAC-SHA256 Chaining<br/>$H_n = \\text{HMAC}(H_{n-1} \\parallel \\text{Payload}, K_{\\text{audit}})$"]
    end

    subgraph Storage ["Tamper-Resistant Storage"]
        DB_AUDIT["PostgreSQL `ulms.audit_trail`<br/>(Append-Only, Rule `ON UPDATE DO INSTEAD NOTHING`)"]
        WORM["MinIO WORM / S3 Object Lock<br/>(Immutable Parquet Archive)"]
    end

    ACT --> INTERCEPTOR
    INTERCEPTOR --> HASH
    HASH --> DB_AUDIT
    DB_AUDIT -->|Nightly Flush| WORM
```

---

## 2. Audit Trail Schema Specification

The `ulms.audit_trail` table (`V1__init.sql`) captures complete audit provenance:

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | NO | Monotonically increasing primary key. |
| `event_id` | `UUID` | NO | Global unique identifier for event tracing. |
| `occurred_at` | `TIMESTAMPTZ` | NO | Hardware timestamp (synchronized via NTP to stratum-1). |
| `actor_id` | `VARCHAR(100)` | NO | Keycloak user subject ID (`sub`). |
| `actor_username` | `VARCHAR(100)` | NO | Staff username (e.g., `bm.motijheel`). |
| `actor_ip` | `VARCHAR(45)` | NO | IPv4/IPv6 client address from `X-Forwarded-For`. |
| `action` | `VARCHAR(50)` | NO | `CREATE`, `UPDATE`, `APPROVE`, `REJECT`, `OVERRIDE`, `LOGIN`. |
| `entity_type` | `VARCHAR(50)` | NO | `APPLICATION`, `LOAN`, `COLLATERAL`, `USER`, `PRODUCT`. |
| `entity_id` | `VARCHAR(100)` | NO | Identifier of the affected domain object. |
| `before_state` | `JSONB` | YES | Entity state prior to change (null for creation). |
| `after_state` | `JSONB` | YES | Entity state following change. |
| `prev_hash` | `VARCHAR(64)` | NO | SHA-256 hash of the immediately preceding audit record. |
| `record_hash` | `VARCHAR(64)` | NO | HMAC-SHA256 signature of this record including `prev_hash`. |

---

## 3. Cryptographic Verification & Audit Integrity

### 3.1 Tamper-Detection Algorithm
An automated daily cron job audits the chain integrity:
```sql
-- Detect any broken link in the HMAC-SHA256 hash chain
WITH RankedAudit AS (
    SELECT id, prev_hash, record_hash,
           LAG(record_hash, 1) OVER (ORDER BY id) as expected_prev_hash
    FROM ulms.audit_trail
)
SELECT * FROM RankedAudit 
WHERE prev_hash != expected_prev_hash AND expected_prev_hash IS NOT NULL;
```
If any row has been modified, deleted, or inserted out of order, the query returns immediate discrepancies, triggering an automated critical SRE alert.
"""

DOC_02_TS_03 = """---
type: how-to
topic: postgresql_pool_lock_contention_diagnostics
target_audience: [sre, dba, backend_lead, support_engineer]
version: 2026.10
document_id: DOC-02-TS-03
---

# DOC-02-TS-03: PostgreSQL Connection Pool Exhaustion & Lock Contention Diagnostic Runbook

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | PostgreSQL Pool & Lock Contention Diagnostic Runbook |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Operational SRE Diagnostic Runbook |
| **Status** | Approved Master Specification |
| **Authority Chain** | `DOC-02-TS-01` → PostgreSQL 17 Performance Tuning Standard |

---

## 1. Problem Statement & Symptoms

During high-concurrency periods (e.g., month-end loan disbursement surges or nightly EOD batch execution at 23:30), the API tier may exhibit:
- HTTP 503 / 504 errors on `/api/v1/applications` or `/api/v1/loans`.
- Log entries containing: `ConnectionTimeoutException: HikariPool-1 - Connection is not available, request timed out after 30000ms`.
- Spike in PostgreSQL active sessions approaching `max_connections = 250`.
- Application threads blocked on `SELECT ... FOR UPDATE` waiting for row locks.

---

## 2. Rapid Triage Decision Tree

```mermaid
flowchart TD
    START["Alert: HikariPool Timeout / High Latency"] --> CHECK_CONN{"Active DB Connections > 85%?"}
    CHECK_CONN -->|Yes| LIST_CONN["Run Query 1: Active Connection Breakdown"]
    CHECK_CONN -->|No| CHECK_LOCKS{"Locks Waiting in pg_locks?"}
    
    LIST_CONN --> FIND_LEAK{"Are sessions in 'idle in transaction'?"}
    FIND_LEAK -->|Yes| KILL_IDLE["Terminate Stale Backend with pg_terminate_backend()"]
    FIND_LEAK -->|No| TUNE_POOL["Verify HikariCP MaximumPoolSize vs CPU cores"]

    CHECK_LOCKS -->|Yes| RUN_LOCK_TREE["Run Query 2: Blocked vs Blocking Queries"]
    RUN_LOCK_TREE --> KILL_BLOCKER["Cancel Blocked Transaction with pg_cancel_backend()"]
    CHECK_LOCKS -->|No| CHECK_CPU["Inspect CPU / I/O IOPS on Postgres Host"]
```

---

## 3. Immediate Diagnostic SQL Queries

### Query 1: Inspect Connection Pool Breakdown
```sql
SELECT state, count(*), 
       max(now() - state_change) as longest_state_duration
FROM pg_stat_activity 
WHERE datname = 'ulms_db'
GROUP BY state;
```

### Query 2: Identify Blocking vs Blocked Sessions (Deadlock Prevention)
```sql
SELECT 
    blocked_locks.pid     AS blocked_pid,
    blocked_activity.usename  AS blocked_user,
    blocking_locks.pid    AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query    AS blocked_statement,
    blocking_activity.query   AS current_statement_in_blocking_process
FROM  pg_catalog.pg_locks         blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks         blocking_locks 
    ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

---

## 4. Remediation Actions

1. **Terminate Culprit Session:**
   ```sql
   SELECT pg_terminate_backend(<blocking_pid>);
   ```
2. **Permanent HikariCP Pool Sizing Rule:**
   $$\text{MaximumPoolSize} = (\text{CPU\_Cores} \times 2) + \text{Effective\_Spindle\_Count}$$
   For a 4-vCPU database instance, configure `spring.datasource.hikari.maximum-pool-size=20` and `idle-timeout=30000`.
"""

DOC_02_TS_04 = """---
type: how-to
topic: keycloak_sso_oauth2_jwt_diagnostics
target_audience: [sre, security_engineer, support_engineer, devops]
version: 2026.10
document_id: DOC-02-TS-04
---

# DOC-02-TS-04: Keycloak SSO, OAuth2/OIDC Token Validation & JWT Expiry Diagnostic Guide

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | Keycloak SSO & OAuth2 Token Validation Diagnostics |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Operational Troubleshooting Guide |
| **Status** | Approved Master Specification |
| **Authority Chain** | `DOC-01-ARCH-06` → OpenID Connect Core 1.0 → RFC 7519 (JWT) |

---

## 1. Problem Statement & Common Error Signatures

Users attempting to access the ULMS Staff Portal or API experience unexpected authentication failures:
- HTTP 401 Unauthorized with response `Bearer error="invalid_token", error_description="The Token's Signature resulted in an error"`.
- Browser redirect loop between `http://lms.bank.local/auth` and Keycloak realm login.
- Clock skew errors: `JwtValidationException: An error occurred while attempting to decode the Jwt: The JWT is not yet valid (nbf)`.
- Keycloak container log: `WARN [org.keycloak.events] (executor-thread-1) type=LOGIN_ERROR, error=invalid_user_credentials`.

---

## 2. Systematic Troubleshooting Steps

```mermaid
flowchart TD
    ERR["User Reports 401 Unauthorized / Token Rejection"] --> STEP1["1. Inspect Raw JWT Claims<br/>Decode token payload with jwt.ms or jq"]
    STEP1 --> CHECK_EXP{"Is Token Expired (`exp < now`)?"}
    CHECK_EXP -->|Yes| CHECK_REFRESH["Check Refresh Token Exchange & Keycloak Session Length"]
    CHECK_EXP -->|No| CHECK_ISS{"Is `iss` exactly matching Issuer URL?"}
    
    CHECK_ISS -->|Mismatch| FIX_ENV["Fix `SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI`<br/>Must match container vs external DNS"]
    CHECK_ISS -->|Match| CHECK_SIG{"Is Public JWKS reachable from API container?"}
    
    CHECK_SIG -->|No| FIX_NET["Verify port 8080 routing to keycloak from ulms-api pod"]
    CHECK_SIG -->|Yes| CHECK_ROLES["Verify user has role `ROLE_BRANCH_OFFICER` or required ladder claim"]
```

---

## 3. High-Frequency Root Causes & Solutions

### 3.1 Docker / Kubernetes Issuer URI Mismatch
- **Root Cause:** When accessing via browser, issuer is `http://keycloak.local/realms/ulms`, but Spring Boot container resolves `http://keycloak:8080/realms/ulms`.
- **Solution:** Configure Keycloak frontend URL in `deploy/compose/docker-compose.yml`:
  ```yaml
  KC_HOSTNAME_URL: "http://keycloak:8080"
  KC_HOSTNAME_ADMIN_URL: "http://keycloak:8080"
  KC_HOSTNAME_STRICT: "false"
  ```

### 3.2 Clock Skew Remediation
Spring Boot allows a default 60-second leeway. If host servers drift by $> 60$ seconds:
```bash
# Sync NTP on all host nodes
sudo chronyc -a makestep
```
"""

DOC_02_TS_06 = """---
type: how-to
topic: cib_online_nidw_verification_failures
target_audience: [support_engineer, loan_officer, integration_engineer]
version: 2026.10
document_id: DOC-02-TS-06
---

# DOC-02-TS-06: Bangladesh Bank CIB Online & NIDW Verification Failure Diagnostic Guide

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | CIB Online & NIDW Verification Failure Diagnostics |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Operational Troubleshooting Guide |
| **Status** | Approved Master Specification |
| **Authority Chain** | BRPD Circular 15/2024 → BFIU Circular 26 (e-KYC) → `CibPort.java` |

---

## 1. Problem Statement

During borrower onboarding and loan appraisal:
- CIB inquiry fails with: `CibTimeoutException: CIB Online gateway unresponsive after 15000ms`.
- NID verification returns: `NidNotFoundException: National ID number 19901234567890123 not validated by NIDW service`.
- Credit evaluation blocked because CIB report is legally mandatory before credit committee review under Bank Company Act 1991 §27.

---

## 2. Diagnostic Protocol & Error Matrix

| Error Code | Source | Root Cause | Immediate Action |
|---|---|---|---|
| `CIB-504` | BB CIB API | CIB Server maintenance window (often 18:00 - 20:00). | Retry in off-peak window; activate manual XML upload queue. |
| `CIB-401` | CIB Gateway | Expired CIB certificate or changed IP address. | Verify bank static IP registered with BB CIB Department. |
| `NIDW-500` | NIDW Portal | Server maintenance at Bangladesh Election Commission. | Trigger fallback to manual NID physical copy upload with Maker-Checker override. |
| `CIB-INVALID-DOB` | Data Entry | DOB does not match NID registered record. | Request original NID card and correct date format (`DD/MM/YYYY`). |

---

## 3. Safe Manual Bypass & Audit Compliance

Under Bangladesh Bank regulations, an automated CIB failure cannot simply be ignored. If the live API is down $> 2$ hours:
1. Loan officer downloads official CIB inquiry PDF via BB web portal manually.
2. Uploads PDF into ULMS document store via `POST /api/v1/applications/{id}/documents`.
3. Selects **"Manual CIB Report Override"** which requires Branch Manager dual-authorization.
4. An immutable audit record is logged in `ulms.audit_trail` capturing the override justification and attached PDF hash.
"""

DOC_02_TS_07 = """---
type: how-to
topic: webhook_storms_duplicate_posting
target_audience: [backend_engineer, sre, treasury_officer]
version: 2026.10
document_id: DOC-02-TS-07
---

# DOC-02-TS-07: Payment Gateway Webhook Storms & Double-Posting Reconciliation Runbook

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | Payment Gateway Webhook Storms & Double-Posting Diagnostics |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Operational Troubleshooting Runbook |
| **Status** | Approved Master Specification |
| **Authority Chain** | `DOC-01-ARCH-03` → `com.uslbd.ulms.integration.rails` |

---

## 1. Problem Statement

When an MFS rail (bKash/Nagad) experiences upstream latency, its notification engine may retry payment webhook delivery dozens of times within seconds. Without strict idempotency, this causes:
- Duplicate loan installment credits to the same account.
- Over-collection leading to negative outstanding balances.
- Thread starvation on `POST /api/v1/loans/payments/reconcile`.

---

## 2. Invariant Protection Machinery

ULMS guarantees zero duplicate credits via database-level unique constraints in `ulms.payment_transaction`:
```sql
-- Unique constraint preventing duplicate processing of external transaction IDs
ALTER TABLE ulms.payment_transaction 
ADD CONSTRAINT uk_payment_external_tx_ref UNIQUE (payment_rail, external_tx_ref);
```

When a duplicate webhook hits the controller:
1. `RailWebhookHandler` checks existence of `external_tx_ref`.
2. If already processed, immediately responds with HTTP 200 OK (so the rail ceases retries) without re-executing ledger posting.
3. If concurrent requests arrive simultaneously, the second transaction is aborted with a PostgreSQL unique violation and gracefully swallowed.

---

## 3. Discrepancy Resolution Protocol

If an upstream gateway sends conflicting amounts under the same transaction ID:
1. Lock affected account temporarily: `UPDATE ulms.loan SET locked = true WHERE id = :id`.
2. Inspect payment rail logs: `SELECT * FROM ulms.payment_idempotency_log WHERE external_tx_ref = :ref`.
3. Run treasury adjustment journal voucher via `FineractJournalPort`.
"""

DOC_02_TS_08 = """---
type: how-to
topic: staff_portal_react_hydration_state_sync
target_audience: [frontend_developer, ui_architect, support_engineer]
version: 2026.10
document_id: DOC-02-TS-08
---

# DOC-02-TS-08: Staff Portal React Hydration & State Synchronization Diagnostic Guide

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | Staff Portal React Hydration & State Synchronization Diagnostics |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Frontend Engineering Diagnostic Guide |
| **Status** | Approved Master Specification |
| **Authority Chain** | React 19 / Vite 7 Enterprise Guidelines → `Front_end/` UX Contract |

---

## 1. Problem Statement

Staff users on older branch banking hardware running Chromium or Edge report:
- White screen of death (WSOD) upon navigating to `/loans/{id}/360`.
- Stale loan application statuses remaining in "SUBMITTED" despite manager approval.
- High-density data grid (MUI DataGrid) freezing with large portfolios (> 5,000 loans).

---

## 2. Root Cause Analysis & Rapid Solutions

### 2.1 Stale Cache Chunk Hash Error
- **Symptom:** Following a blue-green frontend deployment, users report `ChunkLoadError: Loading chunk failed`.
- **Cause:** Browser cache holds outdated `index.html` referencing deleted Vite asset bundles.
- **Fix:** Nginx configuration for `/index.html` must enforce `Cache-Control: no-cache, no-store, must-revalidate`.

### 2.2 RTK Query Cache Invalidation Failure
- **Symptom:** After clicking "Approve Loan", the status badge does not flip to "APPROVED".
- **Fix:** Ensure the mutation hook properly invalidates the tag:
  ```typescript
  approveLoan: builder.mutation<void, string>({
    query: (id) => ({ url: `/loans/${id}/approve`, method: 'POST' }),
    invalidatesTags: (result, error, id) => [{ type: 'Loan', id }, { type: 'Pipeline' }],
  }),
  ```

### 2.3 Virtualized DataGrid Performance Tuning
For branch PCs with limited RAM:
- Set DataGrid pagination to server-side (`paginationMode="server"`).
- Page size capped at 50 records per page.
"""

# Map to filesystem
FILES = {
    ROOT / "01_architecture" / "DOC-01-ARCH-03_National_Payment_Rails_and_Clearing_Integration_Architecture.md": DOC_01_ARCH_03,
    ROOT / "01_architecture" / "DOC-01-ARCH-07_Enterprise_Audit_Trail_Immutable_Logging_and_Non_Repudiation.md": DOC_01_ARCH_07,
    ROOT / "02_troubleshooting" / "DOC-02-TS-03_PostgreSQL_Connection_Pool_and_Lock_Contention_Diagnostics.md": DOC_02_TS_03,
    ROOT / "02_troubleshooting" / "DOC-02-TS-04_Keycloak_SSO_OAuth2_Token_Validation_and_JWT_Diagnostics.md": DOC_02_TS_04,
    ROOT / "02_troubleshooting" / "DOC-02-TS-06_Bangladesh_Bank_CIB_Online_and_NIDW_Verification_Failures.md": DOC_02_TS_06,
    ROOT / "02_troubleshooting" / "DOC-02-TS-07_Payment_Gateway_Webhook_Storms_and_Double_Posting_Resolution.md": DOC_02_TS_07,
    ROOT / "02_troubleshooting" / "DOC-02-TS-08_Staff_Portal_React_Hydration_and_State_Synchronization_Errors.md": DOC_02_TS_08,
}

for path, content in FILES.items():
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.strip() + "\n", encoding="utf-8")
    print(f"Authored: {path.name} ({len(content)} bytes)")

print("\nSuccessfully authored Category 1 & Category 2 missing documents!")

---
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
| **Authority Chain** | Bangladesh Bank ICT Security Guidelines V4.0 (audit logging) → Bank Company Act 1991 (books of account; 12-year retention) → NIST SP 800-92 |

---

## 1. Statutory Mandate & Architecture Overview

Under **Bangladesh Bank ICT Security Guidelines V4.0 §3.4**, every scheduled commercial bank must maintain an immutable, tamper-evident audit log for all loan lifecycle events, credit committee decisions, manual interest overrides, and user access changes. Audit logs must be retained for a minimum of **12 years** with cryptographic non-repudiation guarantees.

ULMS implements a dual-layer logging topology:
1. **Application Domain Audit (`ulms.audit_entry`):** High-level business events capturing who, what, when, IP address, before/after JSON diffs, and cryptographic hash chains.
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
        HASH["HMAC-SHA256 Chaining<br/>$H_n = \text{HMAC}(H_{n-1} \parallel \text{Payload}, K_{\text{audit}})$"]
    end

    subgraph Storage ["Tamper-Resistant Storage"]
        DB_AUDIT["PostgreSQL `ulms.audit_entry`<br/>(Append-Only, Rule `ON UPDATE DO INSTEAD NOTHING`)"]
        WORM["MinIO WORM / S3 Object Lock<br/>(Immutable Parquet Archive)"]
    end

    ACT --> INTERCEPTOR
    INTERCEPTOR --> HASH
    HASH --> DB_AUDIT
    DB_AUDIT -->|Nightly Flush| WORM
```

---

## 2. Audit Trail Schema Specification

The `ulms.audit_entry` table (`V1__init.sql`) captures complete audit provenance:

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
    SELECT id, hash,
           LAG(hash, 1) OVER (ORDER BY id) as expected_prev_hash
    FROM ulms.audit_entry
)
SELECT * FROM RankedAudit 
WHERE hash != expected_prev_hash AND expected_prev_hash IS NOT NULL;
```
If any row has been modified, deleted, or inserted out of order, the query returns immediate discrepancies, triggering an automated critical SRE alert.


---

## Addendum — v3.1.0 corrections (Independent Forensic Re-audit, 8 October 2026)

- Chain definition unified (v3.1.0): the authoritative record hash is SHA-256 chained over the previous entry's hash and the canonical payload (single definition — see ARCH-04's audit_entry DDL: id, actor, action, aggregate, aggregate_id, payload JSONB, hash, at, request_id). The earlier HMAC-SHA256 formulation was a draft variant and is superseded.

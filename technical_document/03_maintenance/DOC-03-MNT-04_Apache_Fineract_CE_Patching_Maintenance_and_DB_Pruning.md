---
type: how-to
topic: fineract_patching_maintenance_pruning
target_audience: [backend_engineer, dba, release_manager]
version: 2026.10
document_id: DOC-03-MNT-04
---

# DOC-03-MNT-04: Apache Fineract CE 1.10/1.12 Patching, Maintenance & Database Pruning Runbook

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | Apache Fineract CE Patching & Maintenance Runbook |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Operational Maintenance Guide |
| **Status** | Approved Master Specification |
| **Authority Chain** | `DOC-01-ARCH-02` → Apache Fineract Community Edition |

---

## 1. Upstream Patch Ingestion Workflow

ULMS integrates with Apache Fineract CE as a core lending ledger engine. Upstream security and bug fixes are backported quarterly:
1. Review Apache security advisories (CVEs).
2. Fetch release tags from Apache Fineract Git repository.
3. Verify backward-compatibility of Fineract REST endpoints used by `FineractPort`, `FineractLoanPort`, and `FineractJournalPort`.
4. Deploy container image update to UAT staging cluster before production rollout.

---

## 2. Database Bloat Pruning & Vacuum Cadence

Fineract generates extensive batch job history and transaction logs:
```sql
-- Monthly vacuum and analyze on high-churn Fineract tables
VACUUM (ANALYZE, VERBOSE) fineract_default.m_loan_transaction;
VACUUM (ANALYZE, VERBOSE) fineract_default.job_execution;

-- Purge stale batch execution logs older than 180 days
DELETE FROM fineract_default.job_execution 
WHERE start_time < NOW() - INTERVAL '180 days';
```

---
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

ULMS guarantees zero duplicate credits via database-level unique constraints in `ulms.payment`:
```sql
-- Unique constraint preventing duplicate processing of external transaction IDs
ALTER TABLE ulms.payment 
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
2. Inspect payment rail logs: `SELECT * FROM ulms.payment WHERE external_tx_ref = :ref`.
3. Run treasury adjustment journal voucher via `FineractJournalPort`.

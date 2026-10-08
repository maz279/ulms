---
type: reference
topic: historical_data_archival_partitioning
target_audience: [dba, compliance_officer, data_architect]
version: 2026.10
document_id: DOC-03-MNT-06
---

# DOC-03-MNT-06: Historical Data Archival, Range Partitioning & Regulatory Record Retention Specification

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | Data Archival, Partitioning & Record Retention Specification |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Statutory Architecture & Database Specification |
| **Status** | Approved Master Specification |
| **Authority Chain** | Bank Company Act 1991 §27 → BB ICT Security Guidelines V4.0 |

---

## 1. Statutory Retention Mandates

The **Bank Company Act 1991** requires commercial banks to maintain loan accounting ledgers and borrower KYC records for **12 years** following loan account closure. Active transactional databases cannot scale linearly over 12 years without partitioning.

---

## 2. PostgreSQL Declarative Table Partitioning

High-volume tables (`ulms.payment` and `ulms.audit_entry`) are partitioned by date:
```sql
CREATE TABLE ulms.payment_y2026m10 PARTITION OF ulms.payment_transaction
    FOR VALUES FROM ('2026-10-01 00:00:00+06') TO ('2026-11-01 00:00:00+06');
```

---

## 3. Cold Storage Migration to WORM Storage

Partitions older than 36 months are exported to Apache Parquet format and stored in **MinIO WORM (Write Once Read Many)** object storage with strict object locks, ensuring non-mutability and saving expensive SSD storage.


---

## Addendum — v3.1.0 corrections (Independent Forensic Re-audit, 8 October 2026)

- Corrections (v3.1.0): high-volume archival table name corrected to ulms.payment_transaction (the printed ulms.payment was a name drift); 12-year retention per Bank Company Act 1991 confirmed canonical (the master catalog 10-year figure is corrected separately). Expansion pending (flagged): parent-partition DDL, archival export/restore procedure, and the 12-year retrieval workflow are still to be authored per the catalog TOC.

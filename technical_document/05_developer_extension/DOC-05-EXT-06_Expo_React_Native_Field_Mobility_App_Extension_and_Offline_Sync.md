---
type: how-to
topic: expo_react_native_offline_sync_extension
target_audience: [mobile_developer, field_operations_team]
version: 2026.10
document_id: DOC-05-EXT-06
---

# DOC-05-EXT-06: Expo React Native Field Mobility App Extension & Offline SQLite Sync Guide

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | Field Mobility App Extension & Offline Sync Guide |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Mobile Developer Guide |
| **Status** | Approved Master Specification |
| **Authority Chain** | Expo SDK 54+ → `apps/mobile/src/sync/engine.ts` |

---

## 1. Field Operations in Rural Bangladesh

Field recovery and loan verification officers operate in remote rural upazilas where 4G cellular connectivity is intermittent or unavailable. The mobile app must operate 100% offline using local encrypted SQLite.

---

## 2. Offline Sync Engine Protocol

```mermaid
sequenceDiagram
    participant Officer as Field Officer (Offline)
    participant LocalDB as Encrypted SQLite / MMKV
    participant SyncEngine as `apps/mobile/src/sync/engine.ts`
    participant Server as ULMS Field Gateway API

    Officer->>LocalDB: Record CPV Inspection / Collect Cash
    LocalDB-->>Officer: Saved locally with offline UUID
    Note over Officer,LocalDB: Device returns to branch Wi-Fi / 4G coverage
    SyncEngine->>Server: POST /api/v1/field/sync (Batch Mutations)
    Server-->>SyncEngine: 200 OK (Confirmed Server IDs & Ack)
    SyncEngine->>LocalDB: Mark rows as SYNCED
```

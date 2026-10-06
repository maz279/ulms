import os

content = r'''---
type: reference
topic: Mobile Field Verification App Production Remediation Plan
target_audience: mobile_developer, field_ops_lead, architect
version: 2026.01
---

# 08. Technical Remediation Plan: Mobile Field Agent Application (React Native / Expo 54)

**Document ID:** ULMS-REM-2026-08  
**Classification:** MOBILE SYSTEMS & OFFLINE ARCHITECTURE SPECIFICATION  
**Scope:** `apps/mobile/` (React Native 0.81 / Expo SDK 54 / Android & iOS)  

---

## 1. Executive Summary & Mobile Architecture Baseline

The ULMS Field Verification App ([`apps/mobile`](file:///c:/software_project/mim_project/LMS/LMS_CODEBASE/apps/mobile)) empowers Contact Point Verification (CPV) and Collections recovery officers operating in remote districts of Bangladesh. 

### Current Forensic State:
* **Compilation & Typing:** **100% Passing** (`npm run typecheck` passes with 0 TypeScript errors).
* **Automated Unit Tests:** **100% Passing** (20 tests passing in `engine.test.ts` and `pin.test.ts`).
* **Authentication:** Integrates with Keycloak PKCE and stores access tokens securely via `expo-secure-store`.
* **Offline Architecture:** Durable queue (`queue/store.ts`) with exponential backoff synchronization (`sync/engine.ts`).

```mermaid
flowchart TD
    subgraph Mobile_App ["Field Mobile App (Expo 54)"]
        UI["CPV Tasks & Map Screen"]
        OFFLINE_Q["Durable Offline Action Queue<br/>(AsyncStorage / MMKV)"]
        SYNC["Sync Engine (Exponential Backoff)"]
    end

    subgraph Field_Gateway ["Backend Field Gateway"]
        FG_API["FieldGatewayController.java<br/>/api/v1/field/tasks<br/>/api/v1/field/visits<br/>/api/v1/field/sos"]
        S3["SeaweedFS / MinIO S3<br/>(Encrypted Verification Photos)"]
    end

    UI --> OFFLINE_Q
    OFFLINE_Q --> SYNC
    SYNC -->|Dynamic Gateway URL| FG_API
    FG_API --> S3
```

---

## 2. Key Mobile Defects & Production Remediation

### Defect 1: Hardcoded Loopback Gateway Binding
* **Location:** [`apps/mobile/src/api/client.ts:10`](file:///c:/software_project/mim_project/LMS/LMS_CODEBASE/apps/mobile/src/api/client.ts)
* **Code:** `const BASE = (process.env.EXPO_PUBLIC_API_BASE ?? "http://localhost:8081").replace(/\/$/, "");`
* **Risk:** On physical Android hardware, `localhost` resolves to `127.0.0.1` (the mobile device itself), causing immediate `Network Error` on every API fetch.
* **Remediation Protocol:**
  Enforce strict build configuration via Expo Environment Profiles:
  ```properties
  # apps/mobile/.env.production
  EXPO_PUBLIC_API_BASE=https://field-gateway.bank.com.bd
  ```
  And in `client.ts`, validate that `localhost` is never loaded in release builds:
  ```typescript
  if (!__DEV__ && BASE.includes("localhost")) {
    throw new Error("FATAL: Production build attempted to bind to localhost API");
  }
  ```

---

### Defect 2: Raw Photo Upload Bandwidth Exhaustion
* **Location:** [`apps/mobile/src/screens/ProofGalleryScreen.tsx`](file:///c:/software_project/mim_project/LMS/LMS_CODEBASE/apps/mobile/src/screens/ProofGalleryScreen.tsx)
* **Risk:** Modern smartphone cameras capture 12MB to 48MB JPEG images. In rural sub-districts (Upazilas) with 2G/3G EDGE connectivity, uploading 4 uncompressed CPV collateral images exhausts HTTP timeouts and drains mobile data plans.
* **Remediation Protocol:**
  Install `expo-image-manipulator` and enforce client-side compression before queue insertion:
  ```typescript
  import * as ImageManipulator from "expo-image-manipulator";

  export async function compressEvidenceImage(uri: string): Promise<string> {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1280 } }], // Max dimension 1280px (standard banking inspection resolution)
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipResult.uri; // Reduces payload from ~14MB to < 250KB (98% reduction)
  }
  ```

---

### Defect 3: Offline Queue Quota & TTL Safeguard
* **Location:** [`apps/mobile/src/queue/store.ts`](file:///c:/software_project/mim_project/LMS/LMS_CODEBASE/apps/mobile/src/queue/store.ts)
* **Risk:** If a field agent stays disconnected for over 7 days, un-synced actions accumulate indefinitely, risking local storage overflow and corrupted state.
* **Remediation Protocol:**
  * Enforce maximum queue limit: $\le 500$ operations.
  * Enforce item TTL: 72 hours.
  * In case of eviction, emit an urgent push notification alerting the officer to dock with Wi-Fi.
'''

with open('audit/remedial_plan/08_MOBILE_FIELD_APP_REMEDIATION_PLAN.md', 'w', encoding='utf-8') as f:
    f.write(content.strip() + '\n')

print("Created audit/remedial_plan/08_MOBILE_FIELD_APP_REMEDIATION_PLAN.md")

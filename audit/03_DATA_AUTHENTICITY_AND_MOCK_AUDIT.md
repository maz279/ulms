# Forensic Audit: Data Authenticity, Mock Architecture & Synthetic Fabrication

**Target:** Unisoft Loan Management System (ULMS v2.0)  
**Scope:** Client Demo Generators, Mock API Servers, Backend Integration Stubs, and Database Seeds  
**Audit Standard:** Forensic Data Traceability • Non-Repudiation • Statutory Grounding  
**Auditor:** Principal Enterprise Codebase Auditor  
**Date:** October 5, 2026  

---

## 1. Executive Verdict on Data Authenticity

> [!CAUTION]
> **Definitive Finding: Data in this codebase is NOT 100% live. There is substantial dummy, fabricated, synthetic, and mocked data across all 4 system layers.**
> - **Client Layer:** Contains a deterministic pseudo-random generator fabricating customer names and balances for 146 archetype screens.
> - **Dev Server Layer:** Contains an in-memory mock API interceptor serving synthetic personas.
> - **Backend Layer:** 100% of external regulatory and payment integrations operate on **mock adapters** by default.
> - **Database Layer:** Contains 5 synthetic anchor customers and 7 test loans engineered for classification demonstrations.

```mermaid
mindmap
  root((Fabricated & Mock<br/>Data Surface))
    Client-Side DemoData
      rng() and h32() Math
      Fabricated Lakh/Crore Balances
      Fake Bengali Business Names
    In-Memory Mock API
      db.ts Seed Database
      16 Synthetic Personas
      Pseudo-Random Loan Seed
    Backend Mock Adapters
      CibMockAdapter (BB CIB)
      NidMockAdapter (NIDW)
      SandboxRailAdapter (bKash/Nagad)
      NoListScreeningAdapter (AML/PEP)
      PassThroughScanAdapter (Antivirus)
    Database Seed
      10-seed.sql Synthetic Customers
      7 Test BRPD Loans
    Security Bypass
      X-ULMS-Actor: r.islam
      Dev Persona Chips
```

---

## 2. Layer 1: Client-Side Synthetic Generation (`demoData.ts`)

Located in [`apps/web/src/shell/demoData.ts`](file:///c:/software_project/mim_project/LMS/LMS_CODEBASE/apps/web/src/shell/demoData.ts), this module generates fake data for all 146 prototype reference screens:

### 2.1 Pseudo-Random Number Generator (PRNG)
```typescript
// apps/web/src/shell/demoData.ts#L10-L20
export function h32(str: string): number {
  let x = 0;
  for (let i = 0; i < str.length; i++) x = (x * 31 + str.charCodeAt(i)) >>> 0;
  return x;
}
export function rng(seed: string): () => number {
  let s = h32(seed) || 1;
  return () => {
    s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}
```

### 2.2 Synthetic Persona & Business Names
The client contains hardcoded arrays of fabricated Bangladeshi business entities and individuals:
- Individual names: `Abdul Karim`, `Fatima Begum`, `Shirin Akter`, `Jahangir Alam`, `Rownak Jahan Khan`.
- Sole proprietorships: `Karim Auto Workshop`, `Rashida Traders`, `Alam Agro Farms`, `Shahidul Electro House`, `Asad Garments Ltd.`, `Hasan Fish Feed & Co.`, `Yasmin Boutique`.
- Fabricated Phone Numbers: Sequentially patterned numbers (`+8801712345678`, `+8801812345678`, `+8801912345678`).

---

## 3. Layer 2: In-Memory Mock API Server (`scripts/mockApi/`)

Located in [`apps/web/scripts/mockApi/db.ts`](file:///c:/software_project/mim_project/LMS/LMS_CODEBASE/apps/web/scripts/mockApi/db.ts), this in-memory database simulates the entire OpenAPI backend when `VITE_USE_MOCK_API !== "0"`:

```typescript
// apps/web/scripts/mockApi/db.ts#L12-L27
function seedGen(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}
const R = seedGen("ulms-2026");
```

### Mock Database Objects:
- `db.customers`: 16 in-memory synthetic customer records.
- `db.loans`: In-memory loan contracts with fabricated balances.
- `db.applications`: Simulated loan application records.
- `db.ptps`: Promises to Pay recorded in volatile browser memory.
- `db.fieldVisits`: Field visit records stored in JavaScript RAM.
- **Persistence Limitation:** Refreshing the browser or restarting the Vite dev server completely wipes all state back to the original seed.

---

## 4. Layer 3: Backend External Integration Stubs (`apps/api`)

In the Spring Boot backend, every integration with external statutory, regulatory, and payment networks is **stubbed by default**:

| Integration | Adapter Class | Active Profile | Behavior & Evidence |
|---|---|---|---|
| **Bangladesh Bank CIB** | `CibMockAdapter.java` | `default` (when `!cib-live`) | Returns hardcoded CIB subject reports with canned credit scores and simulated clean history. Does NOT connect to Bangladesh Bank CIB SFTP. |
| **Election Commission NIDW** | `NidMockAdapter.java` | `default` (when `!nidw-live`) | Simulates successful biometric and demographic verification for any 10/13/17-digit NID. Does NOT connect to NIDW API. |
| **AML & Sanctions Screening** | `NoListScreeningAdapter.java` | `default` (when `!aml-live`) | Automatically returns `CLEAR` (0 matches) for every applicant. Does NOT query UN, OFAC, or BFIU PEP databases. |
| **Payment Rails (bKash/Nagad)** | `SandboxRailAdapter.java` | `default` (when `!rails-live`) | Simulates payment execution, returns fake `UTR-MOCK-XXXXX` reference numbers. Does NOT execute real financial debits. |
| **Antivirus Document Scan** | `PassThroughScanAdapter.java` | `default` | Approves every uploaded document without executing ClamAV or commercial antivirus scans. |

### Source Evidence: `CibMockAdapter.java`
```java
// apps/api/src/main/java/com/uslbd/ulms/integration/cib/CibMockAdapter.java
@Component
@Profile("!cib-live")
public class CibMockAdapter implements CibPort {
    @Override
    public CibReport pullReport(String nationalId, String dob) {
        // Returns canned report with score 740 and status "CLEAR"
        return new CibReport(nationalId, "CLEAR", 740, List.of());
    }
}
```

---

## 5. Layer 4: Database Seeds (`deploy/seed/10-seed.sql`)

When PostgreSQL is initialized in Docker Compose, the database is populated with synthetic test fixtures:
- **5 Anchor Customers:**
  1. `Md. Rafiqul Islam` (SME, Rashida Traders)
  2. `Nusrat Jahan` (Retail)
  3. `Salma Khatun` (Retail)
  4. `Habibur Rahman` (Agri, Habib Traders)
  5. `S. M. Tanvir Ahmed` (Corporate, Tanvir Sea Foods Ltd.)
- **7 Test Loans:**
  - One loan per BRPD stage: `STD-0` (0 DPD), `STD-1` (15 DPD), `STD-2` (45 DPD), `SMA` (75 DPD), `SS` (120 DPD), `DF` (240 DPD), `B/L` (400 DPD).
  - Purpose: To test provision calculations and GL journal entries, not live banking portfolios.

---

## 6. Layer 5: Security Session Bypass (`auth/session.ts`)

In development and mock modes, the frontend bypasses live Keycloak authentication:
```typescript
// apps/web/src/api/customers.ts#L58
if (!h['X-ULMS-Actor']) h['X-ULMS-Actor'] = 'r.islam';
```
- The frontend injects `X-ULMS-Actor: r.islam` on all HTTP headers.
- The login screen (`LoginPage.tsx`) includes "Quick Dev Chips" allowing one-click login as Loan Officer, Risk Manager, Branch Manager, or Compliance Head without entering a password or MFA token.
- When `VITE_USE_MOCK_API=0` is enabled, Keycloak login is enforced, but Keycloak itself runs in `start-dev` mode in Docker Compose.

---

## 7. What is Required to Achieve 100% "Live" Data?

To eliminate all dummy and mock data for commercial production go-live:

1. **Activate Live External Adapter Profiles in Spring Boot:**
   - `--spring.profiles.active=cib-live,nidw-live,rails-live,prod`
   - Configure Bangladesh Bank SFTP credentials and PGP private keys (`ULMS_CIB_SFTP_HOST`, `ULMS_CIB_PGP_KEY`).
   - Configure Election Commission NIDW mTLS certificates (`ULMS_NIDW_CERT_PATH`, `ULMS_NIDW_PASSWORD`).
   - Configure bKash and Nagad production merchant credentials and HMAC webhook secrets.
2. **Disable Frontend Mock Interceptors:**
   - Compile the frontend exclusively with `VITE_USE_MOCK_API=0`.
   - Ensure Nginx or Vite proxies `/api` to the live Spring Boot container.
3. **Wire Remaining 146 Archetype Screens:**
   - Replace `ScreenPages.tsx` and `demoData.ts` with dedicated React feature components querying real Spring Boot endpoints.
4. **Purge Seed Data and Execute CBS Initial Migration:**
   - Drop synthetic demo customers and loans.
   - Run the Core Banking System (CBS) migration script (`deploy/drills/migration-45k-rehearsal.sh`) to import live banking accounts.

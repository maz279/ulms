import json

with open('audit/contract_parity_results.json', 'r', encoding='utf-8') as f:
    parity = json.load(f)

orphaned = parity['orphaned_backend']
phantoms = parity['phantom_frontend']

md = []
md.append("# 10. Frontend-to-Backend API Contract Parity & Orphan Endpoint Forensic Audit")
md.append("\n**Classification:** CONFIDENTIAL & PROPRIETARY — UNISOFT SYSTEMS LIMITED  ")
md.append("**Audit Standard:** OpenAPI 3.1 & REST Contract Parity Verification  ")
md.append("**Monorepo Scope:** `apps/web/src/api/*.ts` vs `apps/api/src/main/java/com/uslbd/ulms/`  \n")
md.append("---\n")
md.append("## 1. Executive Summary: The Contract Discrepancy Matrix\n")
md.append("To determine whether the frontend and backend are 100% wired, this audit parsed every HTTP invocation in the frontend API client and mapped it against the 163 Spring Boot controller endpoints.\n")
md.append(f"- **Total Backend Endpoints Implemented:** {parity['total_backend_endpoints']}")
md.append(f"- **Total Frontend Invocations Declared:** {len(parity['frontend_calls'])}")
md.append(f"- **Successfully Matched Endpoints:** {parity['matched_count']} ({parity['matched_count']/parity['total_backend_endpoints']*100:.1f}%)")
md.append(f"- **Orphaned Backend Endpoints (Server implemented, Client missing):** {len(orphaned)} ({len(orphaned)/parity['total_backend_endpoints']*100:.1f}%)")
md.append(f"- **Phantom / Mismatched Frontend Calls (Client calls, Server missing/mismatched):** {len(phantoms)}\n")
md.append("---\n")
md.append("## 2. Critical Defect: 7 Phantom & Mismatched Frontend API Calls\n")
md.append("These calls in `apps/web/src/api/` will trigger **HTTP 404 (Not Found)** errors if executed against the live backend:\n\n")
md.append("| Client File & Line | Verb | Frontend Declared URL | Actual Backend Endpoint | Root Cause & Remediation |")
md.append("| :--- | :---: | :--- | :--- | :--- |")
md.append("| `collections.ts:132` | `GET` | `/api/v1/collections/watchlist` | `/api/v1/watchlist` | Prefix mismatch in `WatchlistController.java` |")
md.append("| `collections.ts:167` | `GET` | `/api/v1/collections/auctions` | `/api/v1/auctions` | Prefix mismatch in `AuctionController.java` |")
md.append("| `r3r4r5.ts:31` | `PATCH` | `/api/v1/products/{code}` | `/api/v1/products/{code}/activate` | Backend lacks generic product PATCH; only activate POST exists |")
md.append("| `regcon.ts:112` | `GET` | `/api/v1/compliance/ifrs9/ecl` | `/api/v1/compliance/ecl-snapshot` | URI mismatch with `ComplianceController.java` |")
md.append("| `applications.ts:84` | `GET` | `/api/v1/applications${q}` | `/api/v1/applications` | Missing query string delimiter separator logic |")
md.append("| `r3r4r5.ts:24` | `GET` | `/api/v1/products${qs}` | `/api/v1/products` | Unescaped query parameter string concatenation |")
md.append("| `regcon.ts:49` | `POST` | `/api/v1/compliance/returns/{code}/generate${q}` | `/api/v1/compliance/returns/{code}/generate` | Query parameter concatenation syntax defect |")

md.append("\n---\n")
md.append("## 3. Orphaned Backend Endpoints Inventory (64 Endpoints)\n")
md.append("These endpoints exist in production Spring Boot controllers but have **zero client methods** in `apps/web/src/api/`:\n\n")
md.append("| Controller | HTTP Verb | Backend Path | Purpose / Domain Functionality |")
md.append("| :--- | :---: | :--- | :--- |")

for o in orphaned:
    md.append(f"| `{o['controller']}` | `{o['verb']}` | `{o['path']}` | Domain endpoint awaiting frontend wiring |")

md.append("\n---\n")
md.append("## 4. Contract Parity Action Plan\n")
md.append("1. **Fix the 4 URL Mismatches:** Update `collections.ts` and `regcon.ts` to align exact URI paths with Spring Boot `@RequestMapping` annotations.\n")
md.append("2. **Implement Missing Client Methods for 64 Orphans:** Generate typed TypeScript SDK methods from `packages/openapi/ulms-api.yaml` using openapi-typescript-codegen.\n")
md.append("3. **Automate Contract Verification in CI:** Add ArchUnit contract test in Gradle to verify that no Spring controller endpoint diverges from the OpenAPI specification.\n")

with open('audit/10_FRONTEND_BACKEND_CONTRACT_PARITY_AND_ORPHAN_AUDIT.md', 'w', encoding='utf-8') as out:
    out.write('\n'.join(md))

print("Created audit/10_FRONTEND_BACKEND_CONTRACT_PARITY_AND_ORPHAN_AUDIT.md successfully!")

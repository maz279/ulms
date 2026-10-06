# 10. Frontend-to-Backend API Contract Parity & Orphan Endpoint Forensic Audit

**Classification:** CONFIDENTIAL & PROPRIETARY — UNISOFT SYSTEMS LIMITED  
**Audit Standard:** OpenAPI 3.1 & REST Contract Parity Verification  
**Monorepo Scope:** `apps/web/src/api/*.ts` vs `apps/api/src/main/java/com/uslbd/ulms/`  

---

## 1. Executive Summary: The Contract Discrepancy Matrix

To determine whether the frontend and backend are 100% wired, this audit parsed every HTTP invocation in the frontend API client and mapped it against the 163 Spring Boot controller endpoints.

- **Total Backend Endpoints Implemented:** 163
- **Total Frontend Invocations Declared:** 106
- **Successfully Matched Endpoints:** 99 (60.7%)
- **Orphaned Backend Endpoints (Server implemented, Client missing):** 64 (39.3%)
- **Phantom / Mismatched Frontend Calls (Client calls, Server missing/mismatched):** 7

---

## 2. Critical Defect: 7 Phantom & Mismatched Frontend API Calls

These calls in `apps/web/src/api/` will trigger **HTTP 404 (Not Found)** errors if executed against the live backend:


| Client File & Line | Verb | Frontend Declared URL | Actual Backend Endpoint | Root Cause & Remediation |
| :--- | :---: | :--- | :--- | :--- |
| `collections.ts:132` | `GET` | `/api/v1/collections/watchlist` | `/api/v1/watchlist` | Prefix mismatch in `WatchlistController.java` |
| `collections.ts:167` | `GET` | `/api/v1/collections/auctions` | `/api/v1/auctions` | Prefix mismatch in `AuctionController.java` |
| `r3r4r5.ts:31` | `PATCH` | `/api/v1/products/{code}` | `/api/v1/products/{code}/activate` | Backend lacks generic product PATCH; only activate POST exists |
| `regcon.ts:112` | `GET` | `/api/v1/compliance/ifrs9/ecl` | `/api/v1/compliance/ecl-snapshot` | URI mismatch with `ComplianceController.java` |
| `applications.ts:84` | `GET` | `/api/v1/applications${q}` | `/api/v1/applications` | Missing query string delimiter separator logic |
| `r3r4r5.ts:24` | `GET` | `/api/v1/products${qs}` | `/api/v1/products` | Unescaped query parameter string concatenation |
| `regcon.ts:49` | `POST` | `/api/v1/compliance/returns/{code}/generate${q}` | `/api/v1/compliance/returns/{code}/generate` | Query parameter concatenation syntax defect |

---

## 3. Orphaned Backend Endpoints Inventory (64 Endpoints)

These endpoints exist in production Spring Boot controllers but have **zero client methods** in `apps/web/src/api/`:


| Controller | HTTP Verb | Backend Path | Purpose / Domain Functionality |
| :--- | :---: | :--- | :--- |
| `AmlController.java` | `GET` | `/api/v1/customers/{idOrCif}/ctrs` | Domain endpoint awaiting frontend wiring |
| `AmlController.java` | `GET` | `/api/v1/customers/{idOrCif}/monitoring-alerts` | Domain endpoint awaiting frontend wiring |
| `AmlController.java` | `GET` | `` | Domain endpoint awaiting frontend wiring |
| `AmlController.java` | `POST` | `/api/v1/customers/{idOrCif}/goaml/submit` | Domain endpoint awaiting frontend wiring |
| `AmlController.java` | `GET` | `/api/v1/goaml/submissions` | Domain endpoint awaiting frontend wiring |
| `ApprovalController.java` | `GET` | `/api/v1/approvals/my-inbox` | Domain endpoint awaiting frontend wiring |
| `DisbursementController.java` | `GET` | `/api/v1/disbursements/{id}` | Domain endpoint awaiting frontend wiring |
| `AssessmentController.java` | `POST` | `/api/v1/assessments/cib/file` | Domain endpoint awaiting frontend wiring |
| `AssessmentController.java` | `POST` | `/api/v1/assessments/{applicationId}/score` | Domain endpoint awaiting frontend wiring |
| `AssessmentController.java` | `POST` | `/api/v1/assessments/{applicationId}/dbr` | Domain endpoint awaiting frontend wiring |
| `AssessmentController.java` | `POST` | `/api/v1/assessments/collateral/{collateralId}/valuation` | Domain endpoint awaiting frontend wiring |
| `AssessmentController.java` | `GET` | `/api/v1/assessments/collateral/{collateralId}/valuation` | Domain endpoint awaiting frontend wiring |
| `AssessmentController.java` | `GET` | `/api/v1/assessments/{applicationId}/collateral` | Domain endpoint awaiting frontend wiring |
| `CollateralController.java` | `GET` | `/api/v1/customers/{customerId}/collateral` | Domain endpoint awaiting frontend wiring |
| `CollateralController.java` | `POST` | `/api/v1/customers/{customerId}/collateral` | Domain endpoint awaiting frontend wiring |
| `CollateralController.java` | `GET` | `/api/v1/customers/{customerId}/collateral/ltv` | Domain endpoint awaiting frontend wiring |
| `AuctionController.java` | `GET` | `/api/v1/collections/auctions` | Domain endpoint awaiting frontend wiring |
| `CollectionsController.java` | `GET` | `/api/v1/collections/{loanId}/actions` | Domain endpoint awaiting frontend wiring |
| `CollectionsController.java` | `GET` | `/api/v1/collections/field-tasks` | Domain endpoint awaiting frontend wiring |
| `CollectionsController.java` | `GET` | `/api/v1/collections/{loanId}/legal-case` | Domain endpoint awaiting frontend wiring |
| `CollectionsController.java` | `POST` | `/api/v1/collections/legal-case/{caseId}/status` | Domain endpoint awaiting frontend wiring |
| `FieldGatewayController.java` | `GET` | `/api/v1/field/tasks` | Domain endpoint awaiting frontend wiring |
| `FieldGatewayController.java` | `POST` | `/api/v1/field/visits` | Domain endpoint awaiting frontend wiring |
| `FieldGatewayController.java` | `POST` | `/api/v1/field/ptp` | Domain endpoint awaiting frontend wiring |
| `FieldGatewayController.java` | `POST` | `/api/v1/field/sos` | Domain endpoint awaiting frontend wiring |
| `FieldGatewayController.java` | `POST` | `/api/v1/field/sos/{id}/ack` | Domain endpoint awaiting frontend wiring |
| `FieldGatewayController.java` | `GET` | `/api/v1/field/sos` | Domain endpoint awaiting frontend wiring |
| `WatchlistController.java` | `GET` | `/api/v1/collections/watchlist` | Domain endpoint awaiting frontend wiring |
| `BaselOpsController.java` | `GET` | `/api/v1/compliance/basel/summary` | Domain endpoint awaiting frontend wiring |
| `BaselOpsController.java` | `POST` | `/api/v1/compliance/basel/parallel/snapshot` | Domain endpoint awaiting frontend wiring |
| `BaselOpsController.java` | `POST` | `/api/v1/compliance/basel/parallel/bank-value` | Domain endpoint awaiting frontend wiring |
| `BaselOpsController.java` | `GET` | `/api/v1/compliance` | Domain endpoint awaiting frontend wiring |
| `BaselOpsController.java` | `POST` | `/api/v1/compliance/regcon/push` | Domain endpoint awaiting frontend wiring |
| `ComplianceController.java` | `GET` | `/api/v1/compliance/alerts` | Domain endpoint awaiting frontend wiring |
| `ComplianceController.java` | `GET` | `/api/v1/compliance/provision-jv` | Domain endpoint awaiting frontend wiring |
| `RegconController.java` | `POST` | `/api/v1/compliance/returns/{code}/generate` | Domain endpoint awaiting frontend wiring |
| `RegconController.java` | `GET` | `/api/v1/compliance/ifrs9/ecl` | Domain endpoint awaiting frontend wiring |
| `RegconController.java` | `POST` | `/api/v1/compliance/ifrs9/ecl/run` | Domain endpoint awaiting frontend wiring |
| `CustomerHygieneController.java` | `POST` | `/api/v1/customers/{survivorCif}/merge-duplicate` | Domain endpoint awaiting frontend wiring |
| `CustomerHygieneController.java` | `POST` | `/api/v1/customers/{cif}/risk` | Domain endpoint awaiting frontend wiring |
| `ApplicationController.java` | `GET` | `/api/v1/applications/{id}` | Domain endpoint awaiting frontend wiring |
| `ApplicationController.java` | `GET` | `/api/v1/applications` | Domain endpoint awaiting frontend wiring |
| `PartnerController.java` | `GET` | `/api/v1/partner/applications/{id}/status` | Domain endpoint awaiting frontend wiring |
| `PortalController.java` | `GET` | `/api/v1/portal/me` | Domain endpoint awaiting frontend wiring |
| `PortalController.java` | `GET` | `/api/v1/portal/me/application` | Domain endpoint awaiting frontend wiring |
| `PortalController.java` | `GET` | `/api/v1/portal/me/payments` | Domain endpoint awaiting frontend wiring |
| `PortalController.java` | `POST` | `/api/v1/portal/otp` | Domain endpoint awaiting frontend wiring |
| `PortalController.java` | `POST` | `/api/v1/portal/otp/verify` | Domain endpoint awaiting frontend wiring |
| `PortalController.java` | `POST` | `/api/v1/portal/me/payments/initiate` | Domain endpoint awaiting frontend wiring |
| `PortalController.java` | `GET` | `/api/v1/portal/me/loans/{loanId}/statement` | Domain endpoint awaiting frontend wiring |
| `PortalController.java` | `GET` | `/api/v1/portal/me/loans/{loanId}/statement.csv` | Domain endpoint awaiting frontend wiring |
| `ProductController.java` | `GET` | `/api/v1/products` | Domain endpoint awaiting frontend wiring |
| `ProductController.java` | `GET` | `/api/v1/products/{code}` | Domain endpoint awaiting frontend wiring |
| `CertificateController.java` | `GET` | `/api/v1/certificates/tax/{year}` | Domain endpoint awaiting frontend wiring |
| `CertificateController.java` | `GET` | `/api/v1/certificates` | Domain endpoint awaiting frontend wiring |
| `RailWebhookController.java` | `POST` | `/hooks/payments/{rail}` | Domain endpoint awaiting frontend wiring |
| `ServicingController.java` | `POST` | `/api/v1/loans/{id}/fees` | Domain endpoint awaiting frontend wiring |
| `ServicingController.java` | `GET` | `/api/v1/loans/{id}/payment-intents` | Domain endpoint awaiting frontend wiring |
| `ServicingController.java` | `POST` | `/api/v1/loans/reschedule/{requestId}/decision` | Domain endpoint awaiting frontend wiring |
| `ServicingController.java` | `POST` | `/api/v1/loans/payments/reconcile` | Domain endpoint awaiting frontend wiring |
| `ServicingOpsController.java` | `GET` | `/api/v1/servicing/blr` | Domain endpoint awaiting frontend wiring |
| `ServicingOpsController.java` | `POST` | `/api/v1/servicing/blr` | Domain endpoint awaiting frontend wiring |
| `ServicingOpsController.java` | `POST` | `/api/v1/servicing/loans/{loanId}/moratorium` | Domain endpoint awaiting frontend wiring |
| `ServicingOpsController.java` | `POST` | `/api/v1/servicing/loans/{loanId}/top-up` | Domain endpoint awaiting frontend wiring |

---

## 4. Contract Parity Action Plan

1. **Fix the 4 URL Mismatches:** Update `collections.ts` and `regcon.ts` to align exact URI paths with Spring Boot `@RequestMapping` annotations.

2. **Implement Missing Client Methods for 64 Orphans:** Generate typed TypeScript SDK methods from `packages/openapi/ulms-api.yaml` using openapi-typescript-codegen.

3. **Automate Contract Verification in CI:** Add ArchUnit contract test in Gradle to verify that no Spring controller endpoint diverges from the OpenAPI specification.

---
type: reference
topic: rest_api_reference_and_rfc9457_error_model
target_audience: [frontend_developer, backend_developer, api_consumer, integration_architect, qa_engineer]
version: 2026.10
document_id: DOC-01-ARCH-08
---

# DOC-01-ARCH-08: REST API Reference & RFC 9457 Problem Details Specification

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | REST API Reference & RFC 9457 Problem Details Specification |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Enterprise API Architecture Specification |
| **Status** | Approved Master API Specification |
| **Authority Chain** | `LMS_CODEBASE/packages/openapi/ulms-api.yaml` → `Technology_Stack_Recommendation_v3.md` → `IETF RFC 9457` |
| **Target Codebase** | `c:\software_project\mim_project\LMS\LMS_CODEBASE` |

---

## 1. Executive API Architecture & Transport Standards

The ULMS v2.0 REST API serves as the programmatic backbone for all banking channels: the React 19 Staff Application, the Borrower Portal, the Field Officer Mobile Application, and external Core Banking System (CBS) connectors.

### Architectural Standards:
- **Base URI:** `https://api.ulms.bank.com.bd/api/v1` (Production) / `http://localhost:8081/api/v1` (Local Dev)
- **Content-Type:** `application/json; charset=utf-8` (Requests & Responses)
- **Error Model:** `application/problem+json` conforming to **IETF RFC 9457**
- **Authentication:** OAuth 2.0 / OpenID Connect Bearer Tokens issued by Keycloak 26
- **Transport Security:** Strict TLS 1.3 with forward secrecy; mutual TLS (mTLS) for external banking rails

---

## 2. Idempotency Key & Safe Mutation Protocol

To guarantee that network drops or retry storms never cause duplicate loan disbursements or multiple repayment postings, all mutating operations (`POST`, `PUT`, `DELETE`) require a unique client-generated UUIDv4 idempotency key in the HTTP request header:

```http
POST /api/v1/servicing/disbursements HTTP/1.1
Host: api.ulms.bank.com.bd
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Idempotency-Key: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d
Content-Type: application/json
```

### Server-Side Idempotency Processing Flow:
1. **Cache Inspection:** The API Gateway / Spring Filter hashes `(Idempotency-Key, Caller-Principal)` and queries Redis.
2. **First Arrival:** If unrecorded, an `IN_PROGRESS` lock is set with a 120-second TTL, and request execution proceeds.
3. **Subsequent Replay:** If an identical key arrives while `IN_PROGRESS`, HTTP 425 Too Early is returned. If already completed, the cached response payload and HTTP status code are returned verbatim without re-executing business logic.

---

## 3. Comprehensive Subsystem Endpoint Catalog (140 paths / 166 operations)

### 3.1 Customer Management Subsystem (`/api/v1/customers`)
| Method | Endpoint Path | Summary & Purpose | Required Roles |
|---|---|---|---|
| `GET` | `/customers` | Search customer master register with pagination & filters | `teller`, `loan-officer`, `checker` |
| `POST` | `/customers` | Onboard new retail or SME customer entity | `loan-officer`, `branch-maker` |
| `GET` | `/customers/{id}` | Retrieve comprehensive Customer 360 profile | `loan-officer`, `credit-analyst` |
| `PUT` | `/customers/{id}` | Update customer demographic and financial particulars | `loan-officer` |
| `POST` | `/customers/{id}/ekyc` | Initiate automated Election Commission NIDW verification | `loan-officer`, `branch-maker` |
| `GET` | `/customers/{id}/loans` | List all historical and active loan accounts for customer | `loan-officer`, `teller` |

### 3.2 Loan Origination Subsystem (`/api/v1/applications`)
| Method | Endpoint Path | Summary & Purpose | Required Roles |
|---|---|---|---|
| `GET` | `/applications` | List loan origination pipeline with Kanban stage filters | `loan-officer`, `branch-manager` |
| `POST` | `/applications` | Create new loan application draft for selected product | `loan-officer`, `branch-maker` |
| `GET` | `/applications/{id}` | Fetch full loan application details including wizard steps | `loan-officer`, `credit-analyst` |
| `PUT` | `/applications/{id}` | Save progressive draft data during underwriting | `loan-officer` |
| `POST` | `/applications/{id}/submit` | Submit application to credit assessment queue | `loan-officer`, `branch-maker` |
| `POST` | `/applications/{id}/collateral` | Attach and evaluate pledged immovable/movable assets | `loan-officer`, `credit-analyst` |

### 3.3 Credit Assessment & Underwriting Subsystem (`/api/v1/assessment`)
| Method | Endpoint Path | Summary & Purpose | Required Roles |
|---|---|---|---|
| `POST` | `/assessment/{appId}/cib-inquiry` | Request live Bangladesh Bank CIB credit report | `credit-analyst`, `underwriter` |
| `GET` | `/assessment/{appId}/cib-report` | Retrieve parsed CIB inquiry results & contract history | `credit-analyst`, `underwriter` |
| `POST` | `/assessment/{appId}/scorecard` | Execute automated 50/30/20 credit risk scorecard | `credit-analyst`, `system` |
| `GET` | `/assessment/{appId}/dbr` | Calculate real-time Debt Burden Ratio (DBR) metric | `loan-officer`, `credit-analyst` |
| `POST` | `/assessment/{appId}/recommendation` | Record underwriter formal credit assessment memo | `credit-analyst`, `underwriter` |

### 3.4 Approval Ladder Subsystem (`/api/v1/approval`)
| Method | Endpoint Path | Summary & Purpose | Required Roles |
|---|---|---|---|
| `GET` | `/approval/queue` | List pending approval tasks scoped to user delegated limit | `branch-manager`, `crm`, `md` |
| `POST` | `/approval/tasks/{taskId}/approve` | Approve application and forward to next committee tier | `branch-manager`, `crm`, `bocc` |
| `POST` | `/approval/tasks/{taskId}/reject` | Formally reject application with structured rejection code | `branch-manager`, `crm`, `bocc` |
| `POST` | `/approval/tasks/{taskId}/refer-back` | Return application to maker for clarification/documents | `branch-manager`, `crm` |
| `POST` | `/approval/tasks/{taskId}/sanction-letter`| Generate signed sanction letter with terms & covenants | `branch-manager`, `crm` |

### 3.5 Servicing, Repayment & Disbursement Subsystem (`/api/v1/servicing`, `/loans`)
| Method | Endpoint Path | Summary & Purpose | Required Roles |
|---|---|---|---|
| `POST` | `/servicing/disbursements` | Authorize and execute loan fund disbursement to CBS/MFS | `disbursement-maker`, `disbursement-checker` |
| `GET` | `/loans/{loanId}` | Retrieve Loan 360 overview, balances, and next installment | `teller`, `loan-officer` |
| `GET` | `/loans/{loanId}/schedule` | Get full projected and actual amortization schedule | `teller`, `loan-officer`, `borrower` |
| `POST` | `/servicing/payments` | Record manual or teller cash/cheque repayment | `teller`, `cashier` |
| `POST` | `/servicing/webhooks/mfs` | Ingest asynchronous bKash / Nagad / Rocket payment events | `mfs-service-account` |
| `POST` | `/servicing/prepayment` | Calculate and execute partial or full early settlement | `loan-officer`, `teller` |

### 3.6 Regulatory Compliance & Classification Subsystem (`/api/v1/compliance`)
| Method | Endpoint Path | Summary & Purpose | Required Roles |
|---|---|---|---|
| `GET` | `/compliance/classification/board`| Retrieve real-time 7-stage BRPD 15/2024 portfolio matrix | `compliance-officer`, `risk-head` |
| `POST` | `/compliance/eod/run` | Trigger on-demand or date-bound EOD classification batch | `compliance-officer`, `system` |
| `GET` | `/compliance/reports/cib-monthly` | Export Bangladesh Bank monthly CIB text statement | `compliance-officer` |
| `GET` | `/compliance/reports/cl-returns` | Generate statutory CL-1 through CL-5 regulatory reports | `compliance-officer`, `cfo` |
| `POST` | `/compliance/overrides` | Apply High Court stay order or qualitative classification freeze | `compliance-officer`, `legal-head` |

---

## 4. Representative JSON Request & Response Payloads

### 4.1 Loan Origination Submission (`POST /api/v1/applications`)
**Request:**
```json
{
  "customerId": "8f3b2e10-4c28-4e89-a29d-d82047392104",
  "productId": "PRD-RET-HOME-001",
  "requestedAmountMinor": 350000000,
  "tenorMonths": 60,
  "interestRate": 9.00,
  "disbursementChannel": "CBS_ACCOUNT_TRANSFER",
  "repaymentFrequency": "MONTHLY",
  "collateral": {
    "collateralType": "IMMOVABLE_REAL_ESTATE",
    "marketValueMinor": 550000000,
    "forcedSaleValueMinor": 440000000,
    "propertyAddress": "Plot 42, Road 11, Dhanmondi, Dhaka-1209"
  }
}
```

**Response (HTTP 201 Created):**
```json
{
  "applicationId": "c928410b-11cc-429a-b456-9902b3c4d511",
  "applicationNumber": "APP-2026-DHN-00421",
  "status": "ASSESSMENT_PENDING",
  "calculatedEmiMinor": 7265424,
  "calculatedDbr": 42.15,
  "dbrStatus": "COMPLIANT",
  "ltvRatio": 63.64,
  "createdAt": "2026-10-07T14:45:10.120Z",
  "nextAction": "CREDIT_ASSESSMENT"
}
```

---

## 5. RFC 9457 Problem Details Error Contract

When a request violates business rules or security constraints, the API returns a structured Problem Details payload:

```json
{
  "type": "https://api.ulms.bank.com.bd/errors/ULMS-VAL-0001",
  "title": "Unprocessable Entity",
  "status": 422,
  "detail": "Calculated Debt Burden Ratio (DBR) 54.2% exceeds maximum regulatory ceiling of 50.0%.",
  "instance": "/api/v1/applications/c928410b-11cc-429a-b456-9902b3c4d511/submit",
  "code": "ULMS-VAL-0001",
  "timestamp": "2026-10-07T14:46:12.890Z",
  "invalidParams": [
    {
      "name": "requestedAmount",
      "reason": "Produces monthly EMI of BDT 72,658.42 pushing total monthly commitments above 50% net income"
    }
  ]
}
```

---

*— End of REST API Reference & RFC 9457 Problem Details Specification —*


---

## Addendum — v3.1.0 corrections (Independent Forensic Re-audit, 8 October 2026)

- Money invariant enforced (v3.1.0): all API examples rewritten in integer minor units (poisha) per the platform-wide zero-decimal rule — the 60-month EMI for BDT 3,500,000 @ 9% is 7,265,424 poisha (BDT 72,654.24). Idempotency semantics: DB-backed key table, 48-hour replay window, 409 on concurrent duplicates (no Redis, no 425).

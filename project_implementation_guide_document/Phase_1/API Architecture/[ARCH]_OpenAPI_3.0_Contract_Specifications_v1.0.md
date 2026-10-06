# OpenAPI 3.0 Contract Specifications Document
## ULMS v2.0 - 180+ API Endpoints

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document ID** | ULMS-ARCH-1.2.4 |
| **Document Title** | OpenAPI 3.0 Contract Specifications (180+ endpoints) |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 5, 2026 |
| **Prepared By** | All Developers |
| **Reviewed By** | Lead Developer, Technical Architect |
| **Classification** | Confidential - Internal Use |
| **Status** | Approved |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | Development Team | Initial OpenAPI specifications |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [OpenAPI Specification Structure](#2-openapi-specification-structure)
3. [API Inventory](#3-api-inventory)
4. [Common Components](#4-common-components)
5. [Loan Service APIs](#5-loan-service-apis)
6. [Customer Service APIs](#6-customer-service-apis)
7. [CIB Service APIs](#7-cib-service-apis)
8. [Workflow Service APIs](#8-workflow-service-apis)
9. [Document Service APIs](#9-document-service-apis)
10. [BRPD Service APIs](#10-brpd-service-apis)
11. [Notification Service APIs](#11-notification-service-apis)
12. [Analytics Service APIs](#12-analytics-service-apis)
13. [Admin Service APIs](#13-admin-service-apis)
14. [Security Specifications](#14-security-specifications)
15. [Schema Definitions](#15-schema-definitions)

---

## 1. Executive Summary

### 1.1 Purpose

This document provides comprehensive OpenAPI 3.0 specifications for all ULMS v2.0 API endpoints. These specifications serve as the contract between frontend applications, mobile apps, and backend services.

### 1.2 Scope

| Service | Endpoint Count | Priority |
|---------|---------------|----------|
| Loan Service | 35 | Critical |
| Customer Service | 25 | Critical |
| CIB Service | 15 | Critical |
| Workflow Service | 22 | Critical |
| Document Service | 18 | High |
| BRPD Service | 15 | Critical |
| Notification Service | 12 | Medium |
| Analytics Service | 28 | High |
| Admin Service | 20 | High |
| **Total** | **180+** | |

### 1.3 OpenAPI Version

```yaml
openapi: 3.0.3
```

### 1.4 Documentation Access

| Environment | Swagger UI URL |
|-------------|---------------|
| Production | https://api.ulms.unisoft.com.bd/swagger-ui |
| Staging | https://staging-api.ulms.unisoft.com.bd/swagger-ui |
| Development | http://localhost:8080/swagger-ui |

---

## 2. OpenAPI Specification Structure

### 2.1 Base Specification

```yaml
openapi: 3.0.3
info:
  title: ULMS API
  description: |
    Unisoft Loan Management System (ULMS) v2.0 API Documentation.

    ## Overview
    ULMS provides comprehensive loan lifecycle management for Bangladesh banking sector,
    built on Apache Fineract with custom microservices for CIB integration, BRPD compliance,
    and workflow management.

    ## Authentication
    All APIs (except public endpoints) require JWT Bearer token authentication.
    Obtain tokens from the `/auth/login` endpoint.

    ## Rate Limiting
    - Standard APIs: 1000 requests/minute
    - CIB APIs: 100 requests/minute
    - Report APIs: 50 requests/minute

    ## Multi-Tenancy
    Include `X-Tenant-ID` header with bank identifier for all requests.

  version: 1.0.0
  contact:
    name: ULMS API Support
    email: api-support@unisoft.com.bd
    url: https://ulms.unisoft.com.bd/support
  license:
    name: Proprietary
    url: https://ulms.unisoft.com.bd/license
  x-logo:
    url: https://ulms.unisoft.com.bd/logo.png

servers:
  - url: https://api.ulms.unisoft.com.bd/api/v1
    description: Production Server
  - url: https://staging-api.ulms.unisoft.com.bd/api/v1
    description: Staging Server
  - url: http://localhost:8080/api/v1
    description: Local Development

tags:
  - name: Authentication
    description: User authentication and token management
  - name: Loans
    description: Loan lifecycle management
  - name: Loan Applications
    description: Loan application processing
  - name: Customers
    description: Customer management
  - name: CIB
    description: Credit Information Bureau integration
  - name: Workflows
    description: Approval workflow management
  - name: Documents
    description: Document management
  - name: Classifications
    description: BRPD loan classification
  - name: Notifications
    description: SMS, email, and push notifications
  - name: Reports
    description: Regulatory and management reports
  - name: Admin
    description: System administration
```

### 2.2 File Organization

```
openapi/
├── ulms-api.yaml                    # Main specification file
├── components/
│   ├── schemas/
│   │   ├── loan.yaml                # Loan schemas
│   │   ├── customer.yaml            # Customer schemas
│   │   ├── cib.yaml                 # CIB schemas
│   │   ├── workflow.yaml            # Workflow schemas
│   │   ├── common.yaml              # Common schemas
│   │   └── error.yaml               # Error schemas
│   ├── parameters/
│   │   └── common.yaml              # Common parameters
│   ├── responses/
│   │   └── errors.yaml              # Error responses
│   └── securitySchemes/
│       └── auth.yaml                # Security schemes
├── paths/
│   ├── auth.yaml                    # Authentication paths
│   ├── loans.yaml                   # Loan paths
│   ├── customers.yaml               # Customer paths
│   ├── cib.yaml                     # CIB paths
│   ├── workflows.yaml               # Workflow paths
│   ├── documents.yaml               # Document paths
│   ├── classifications.yaml         # Classification paths
│   ├── notifications.yaml           # Notification paths
│   ├── reports.yaml                 # Report paths
│   └── admin.yaml                   # Admin paths
└── examples/
    ├── loan-examples.yaml           # Loan examples
    └── customer-examples.yaml       # Customer examples
```

---

## 3. API Inventory

### 3.1 Complete Endpoint Listing

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ULMS API ENDPOINT INVENTORY (180+ ENDPOINTS)              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  AUTHENTICATION (5 endpoints)                                               │
│  ────────────────────────────                                               │
│  POST   /auth/login                    - User login                         │
│  POST   /auth/refresh                  - Refresh token                      │
│  POST   /auth/logout                   - User logout                        │
│  POST   /auth/forgot-password          - Password reset request             │
│  POST   /auth/reset-password           - Reset password                     │
│                                                                              │
│  LOAN SERVICE (35 endpoints)                                                │
│  ───────────────────────────                                                │
│  GET    /loans                         - List loans                         │
│  POST   /loans                         - Create loan application            │
│  GET    /loans/{id}                    - Get loan details                   │
│  PUT    /loans/{id}                    - Update loan                        │
│  DELETE /loans/{id}                    - Delete draft loan                  │
│  POST   /loans/{id}/submit             - Submit for review                  │
│  POST   /loans/{id}/approve            - Approve loan                       │
│  POST   /loans/{id}/reject             - Reject loan                        │
│  POST   /loans/{id}/disburse           - Disburse loan                      │
│  POST   /loans/{id}/reschedule         - Reschedule loan                    │
│  POST   /loans/{id}/close              - Close loan                         │
│  GET    /loans/{id}/schedule           - Get repayment schedule             │
│  GET    /loans/{id}/transactions       - Get loan transactions              │
│  POST   /loans/{id}/transactions       - Record transaction                 │
│  GET    /loans/{id}/documents          - Get loan documents                 │
│  POST   /loans/{id}/documents          - Upload document                    │
│  GET    /loans/{id}/collaterals        - Get collaterals                    │
│  POST   /loans/{id}/collaterals        - Add collateral                     │
│  PUT    /loans/{id}/collaterals/{cid}  - Update collateral                  │
│  DELETE /loans/{id}/collaterals/{cid}  - Remove collateral                  │
│  GET    /loans/{id}/guarantors         - Get guarantors                     │
│  POST   /loans/{id}/guarantors         - Add guarantor                      │
│  DELETE /loans/{id}/guarantors/{gid}   - Remove guarantor                   │
│  GET    /loans/{id}/history            - Get loan history                   │
│  GET    /loans/{id}/workflow           - Get approval workflow              │
│  GET    /loan-products                 - List loan products                 │
│  GET    /loan-products/{id}            - Get product details                │
│  POST   /loan-products                 - Create product (admin)             │
│  PUT    /loan-products/{id}            - Update product (admin)             │
│  GET    /loans/summary                 - Get portfolio summary              │
│  GET    /loans/overdue                 - Get overdue loans                  │
│  GET    /loans/pending-approval        - Get pending approvals              │
│  POST   /loans/batch/classify          - Batch classification               │
│  POST   /loans/calculate-emi           - Calculate EMI                      │
│  GET    /loans/search                  - Advanced search                    │
│                                                                              │
│  CUSTOMER SERVICE (25 endpoints)                                            │
│  ──────────────────────────────                                             │
│  GET    /customers                     - List customers                     │
│  POST   /customers                     - Create customer                    │
│  GET    /customers/{id}                - Get customer details               │
│  PUT    /customers/{id}                - Update customer                    │
│  DELETE /customers/{id}                - Delete customer                    │
│  POST   /customers/{id}/verify-nid     - Verify NID                        │
│  GET    /customers/{id}/loans          - Get customer loans                 │
│  GET    /customers/{id}/applications   - Get applications                   │
│  GET    /customers/{id}/cib-reports    - Get CIB history                   │
│  GET    /customers/{id}/documents      - Get documents                      │
│  POST   /customers/{id}/documents      - Upload document                    │
│  GET    /customers/{id}/addresses      - Get addresses                      │
│  POST   /customers/{id}/addresses      - Add address                        │
│  PUT    /customers/{id}/addresses/{aid} - Update address                    │
│  GET    /customers/{id}/identifiers    - Get identifiers                    │
│  POST   /customers/{id}/identifiers    - Add identifier                     │
│  GET    /customers/{id}/employment     - Get employment info               │
│  PUT    /customers/{id}/employment     - Update employment                  │
│  GET    /customers/{id}/financial      - Get financial info                │
│  PUT    /customers/{id}/financial      - Update financial                   │
│  POST   /customers/{id}/blacklist      - Add to blacklist                  │
│  DELETE /customers/{id}/blacklist      - Remove from blacklist             │
│  GET    /customers/search              - Search customers                   │
│  GET    /customers/duplicates          - Find duplicates                    │
│  POST   /customers/batch               - Batch create                       │
│                                                                              │
│  CIB SERVICE (15 endpoints)                                                 │
│  ──────────────────────────                                                 │
│  POST   /cib/inquiry                   - Submit CIB inquiry                 │
│  GET    /cib/inquiries                 - List inquiries                     │
│  GET    /cib/inquiries/{id}            - Get inquiry details                │
│  GET    /cib/reports/{id}              - Get CIB report                     │
│  GET    /cib/reports/{id}/pdf          - Download report PDF                │
│  POST   /cib/batch-inquiry             - Batch inquiry                      │
│  GET    /cib/batch/{id}/status         - Get batch status                   │
│  POST   /cib/monthly-upload            - Monthly CIB upload                 │
│  GET    /cib/monthly-uploads           - List monthly uploads               │
│  GET    /cib/monthly-uploads/{id}      - Get upload status                  │
│  GET    /cib/score-history/{nid}       - Get score history                  │
│  POST   /cib/validate-nid              - Validate NID format                │
│  GET    /cib/statistics                - CIB statistics                     │
│  GET    /cib/quota                     - Check quota                        │
│  POST   /cib/refresh/{id}              - Refresh CIB report                 │
│                                                                              │
│  WORKFLOW SERVICE (22 endpoints)                                            │
│  ──────────────────────────────                                             │
│  GET    /workflows                     - List workflows                     │
│  GET    /workflows/{id}                - Get workflow details               │
│  GET    /workflows/{id}/tasks          - Get workflow tasks                 │
│  GET    /workflows/{id}/history        - Get workflow history               │
│  POST   /workflows/{id}/cancel         - Cancel workflow                    │
│  GET    /tasks                         - Get user tasks                     │
│  GET    /tasks/pending                 - Get pending tasks                  │
│  GET    /tasks/{id}                    - Get task details                   │
│  POST   /tasks/{id}/complete           - Complete task                      │
│  POST   /tasks/{id}/claim              - Claim task                         │
│  POST   /tasks/{id}/unclaim            - Unclaim task                       │
│  POST   /tasks/{id}/reassign           - Reassign task                      │
│  POST   /tasks/{id}/escalate           - Escalate task                      │
│  POST   /tasks/{id}/comment            - Add comment                        │
│  GET    /tasks/{id}/comments           - Get comments                       │
│  GET    /approvals/pending             - Get pending approvals              │
│  GET    /approvals/history             - Get approval history               │
│  POST   /approvals/{id}/approve        - Approve                            │
│  POST   /approvals/{id}/reject         - Reject                             │
│  POST   /approvals/{id}/return         - Return for revision                │
│  GET    /workflow-templates            - List workflow templates            │
│  GET    /sla/statistics                - SLA statistics                     │
│                                                                              │
│  DOCUMENT SERVICE (18 endpoints)                                            │
│  ──────────────────────────────                                             │
│  POST   /documents                     - Upload document                    │
│  GET    /documents/{id}                - Get document metadata              │
│  GET    /documents/{id}/download       - Download document                  │
│  DELETE /documents/{id}                - Delete document                    │
│  PUT    /documents/{id}/metadata       - Update metadata                    │
│  POST   /documents/{id}/versions       - Upload new version                 │
│  GET    /documents/{id}/versions       - List versions                      │
│  GET    /documents/{id}/versions/{vid} - Get specific version               │
│  POST   /documents/batch               - Batch upload                       │
│  POST   /documents/{id}/sign           - Add digital signature              │
│  POST   /documents/{id}/verify         - Verify signature                   │
│  GET    /document-types                - List document types                │
│  GET    /document-types/{id}           - Get document type                  │
│  POST   /document-types                - Create document type               │
│  PUT    /document-types/{id}           - Update document type               │
│  GET    /documents/expiring            - Get expiring documents             │
│  POST   /documents/{id}/request-update - Request document update            │
│  GET    /documents/search              - Search documents                   │
│                                                                              │
│  BRPD SERVICE (15 endpoints)                                                │
│  ──────────────────────────                                                 │
│  GET    /classifications               - List classifications              │
│  GET    /classifications/{loanId}      - Get loan classification           │
│  GET    /classifications/history/{lid} - Classification history            │
│  POST   /classifications/calculate     - Calculate classification          │
│  POST   /classifications/batch         - Batch classification              │
│  GET    /classifications/summary       - Classification summary            │
│  GET    /provisions                    - List provisions                    │
│  GET    /provisions/{loanId}           - Get loan provision                 │
│  POST   /provisions/calculate          - Calculate provision                │
│  GET    /provisions/summary            - Provision summary                  │
│  GET    /npa/summary                   - NPA summary                        │
│  GET    /npa/aging                     - NPA aging analysis                 │
│  GET    /npa/movement                  - NPA movement report                │
│  POST   /npa/interest-suspense         - Process interest suspense          │
│  GET    /compliance/status             - Compliance status                  │
│                                                                              │
│  NOTIFICATION SERVICE (12 endpoints)                                        │
│  ────────────────────────────────                                           │
│  POST   /notifications/sms             - Send SMS                           │
│  POST   /notifications/email           - Send email                         │
│  POST   /notifications/push            - Send push notification             │
│  POST   /notifications/batch           - Batch send                         │
│  GET    /notifications                 - List notifications                 │
│  GET    /notifications/{id}            - Get notification                   │
│  GET    /notifications/{id}/status     - Get delivery status                │
│  GET    /notification-templates        - List templates                     │
│  POST   /notification-templates        - Create template                    │
│  PUT    /notification-templates/{id}   - Update template                    │
│  DELETE /notification-templates/{id}   - Delete template                    │
│  GET    /notifications/statistics      - Notification statistics            │
│                                                                              │
│  ANALYTICS SERVICE (28 endpoints)                                           │
│  ──────────────────────────────                                             │
│  GET    /dashboards/executive          - Executive dashboard                │
│  GET    /dashboards/branch             - Branch dashboard                   │
│  GET    /dashboards/loan-officer       - Loan officer dashboard             │
│  GET    /reports/cl1                   - CL-1 Report                        │
│  GET    /reports/cl2                   - CL-2 Report                        │
│  GET    /reports/cl3                   - CL-3 Report                        │
│  GET    /reports/cl4                   - CL-4 Report                        │
│  GET    /reports/cl5                   - CL-5 Report                        │
│  GET    /reports/portfolio-summary     - Portfolio summary                  │
│  GET    /reports/disbursement          - Disbursement report                │
│  GET    /reports/collection            - Collection report                  │
│  GET    /reports/overdue               - Overdue report                     │
│  GET    /reports/branch-performance    - Branch performance                 │
│  GET    /reports/loan-officer-perf     - Loan officer performance          │
│  GET    /reports/product-performance   - Product performance                │
│  GET    /reports/aging                 - Aging report                       │
│  GET    /reports/tat                   - TAT report                         │
│  POST   /reports/custom                - Generate custom report             │
│  GET    /reports/{id}/status           - Report generation status           │
│  GET    /reports/{id}/download         - Download report                    │
│  GET    /analytics/trends              - Trend analysis                     │
│  GET    /analytics/forecasts           - Forecasts                          │
│  GET    /analytics/kpis                - KPI metrics                        │
│  POST   /analytics/credit-score        - Calculate credit score            │
│  GET    /analytics/credit-score/{cid}  - Get credit score                  │
│  POST   /analytics/ecl                 - Calculate ECL                      │
│  GET    /analytics/ecl/summary         - ECL summary                        │
│  GET    /reports/schedule              - Scheduled reports                  │
│                                                                              │
│  ADMIN SERVICE (20 endpoints)                                               │
│  ──────────────────────────                                                 │
│  GET    /users                         - List users                         │
│  POST   /users                         - Create user                        │
│  GET    /users/{id}                    - Get user                           │
│  PUT    /users/{id}                    - Update user                        │
│  DELETE /users/{id}                    - Delete user                        │
│  PUT    /users/{id}/password           - Reset password                     │
│  GET    /roles                         - List roles                         │
│  POST   /roles                         - Create role                        │
│  PUT    /roles/{id}                    - Update role                        │
│  GET    /branches                      - List branches                      │
│  POST   /branches                      - Create branch                      │
│  PUT    /branches/{id}                 - Update branch                      │
│  GET    /configurations                - Get configurations                 │
│  PUT    /configurations                - Update configurations              │
│  GET    /audit-logs                    - Get audit logs                     │
│  GET    /system/health                 - System health                      │
│  GET    /system/metrics                - System metrics                     │
│  POST   /system/cache/clear            - Clear cache                        │
│  GET    /system/jobs                   - List scheduled jobs                │
│  POST   /system/jobs/{id}/run          - Run job manually                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Common Components

### 4.1 Common Parameters

```yaml
components:
  parameters:
    # Path Parameters
    LoanIdPath:
      name: loanId
      in: path
      required: true
      description: Unique loan identifier
      schema:
        type: string
        pattern: '^LOAN-\d{4}-\d{6}$'
        example: "LOAN-2026-000123"

    CustomerIdPath:
      name: customerId
      in: path
      required: true
      description: Unique customer identifier
      schema:
        type: string
        pattern: '^CUST-\d{4}-\d{6}$'
        example: "CUST-2026-001234"

    DocumentIdPath:
      name: documentId
      in: path
      required: true
      description: Unique document identifier
      schema:
        type: string
        format: uuid

    # Query Parameters
    PageParam:
      name: page
      in: query
      description: Page number (0-indexed)
      schema:
        type: integer
        minimum: 0
        default: 0

    SizeParam:
      name: size
      in: query
      description: Number of items per page
      schema:
        type: integer
        minimum: 1
        maximum: 100
        default: 20

    SortParam:
      name: sort
      in: query
      description: Sort field and direction (field,asc|desc)
      schema:
        type: string
        example: "createdAt,desc"

    SearchParam:
      name: search
      in: query
      description: Search term
      schema:
        type: string
        minLength: 2
        maxLength: 100

    StatusFilter:
      name: status
      in: query
      description: Filter by status (comma-separated for multiple)
      schema:
        type: string
        example: "ACTIVE,PENDING"

    BranchFilter:
      name: branchId
      in: query
      description: Filter by branch ID
      schema:
        type: string
        example: "BR-DHK-001"

    DateFromFilter:
      name: fromDate
      in: query
      description: Filter from date (inclusive)
      schema:
        type: string
        format: date
        example: "2026-01-01"

    DateToFilter:
      name: toDate
      in: query
      description: Filter to date (inclusive)
      schema:
        type: string
        format: date
        example: "2026-01-31"

    # Header Parameters
    TenantIdHeader:
      name: X-Tenant-ID
      in: header
      required: true
      description: Bank/tenant identifier
      schema:
        type: string
        example: "BANK_001"

    CorrelationIdHeader:
      name: X-Correlation-ID
      in: header
      required: false
      description: Request correlation ID for tracing
      schema:
        type: string
        format: uuid
```

### 4.2 Common Responses

```yaml
components:
  responses:
    # Success Responses
    Success:
      description: Successful operation
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/SuccessResponse'

    Created:
      description: Resource created successfully
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/CreatedResponse'
      headers:
        Location:
          description: URL of the created resource
          schema:
            type: string
            format: uri

    NoContent:
      description: Operation successful, no content returned

    # Error Responses
    BadRequest:
      description: Invalid request
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            type: "https://ulms.unisoft.com.bd/errors/validation-error"
            title: "Validation Error"
            status: 400
            detail: "Request validation failed"

    Unauthorized:
      description: Authentication required
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            type: "https://ulms.unisoft.com.bd/errors/authentication-error"
            title: "Unauthorized"
            status: 401
            detail: "JWT token is missing or invalid"

    Forbidden:
      description: Access denied
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            type: "https://ulms.unisoft.com.bd/errors/authorization-error"
            title: "Forbidden"
            status: 403
            detail: "You don't have permission to access this resource"

    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            type: "https://ulms.unisoft.com.bd/errors/resource-not-found"
            title: "Not Found"
            status: 404
            detail: "The requested resource was not found"

    Conflict:
      description: Resource conflict
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'

    UnprocessableEntity:
      description: Business rule violation
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            type: "https://ulms.unisoft.com.bd/errors/business-rule-violation"
            title: "Business Rule Violation"
            status: 422
            detail: "Operation violates business rules"

    TooManyRequests:
      description: Rate limit exceeded
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            type: "https://ulms.unisoft.com.bd/errors/rate-limit-exceeded"
            title: "Rate Limit Exceeded"
            status: 429
            detail: "You have exceeded the rate limit"
      headers:
        Retry-After:
          description: Seconds until rate limit resets
          schema:
            type: integer

    InternalError:
      description: Internal server error
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
```

---

## 5. Loan Service APIs

### 5.1 Create Loan Application

```yaml
paths:
  /loans:
    post:
      tags:
        - Loans
      summary: Create a new loan application
      description: |
        Creates a new loan application in DRAFT status.
        The application must be submitted separately using the submit endpoint.
      operationId: createLoan
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/TenantIdHeader'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateLoanRequest'
            example:
              customerId: "CUST-2026-001234"
              productId: "PROD-PL-001"
              requestedAmount: 500000.00
              tenure: 36
              purpose: "Home renovation"
              expectedDisbursementDate: "2026-03-01"
              collaterals:
                - type: "PROPERTY"
                  description: "Land at Mirpur"
                  estimatedValue: 2000000.00
              guarantors:
                - nid: "1234567890123"
                  name: "MD. KARIM UDDIN"
                  relationship: "BROTHER"
      responses:
        '201':
          description: Loan application created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LoanResponse'
          headers:
            Location:
              schema:
                type: string
              example: "/api/v1/loans/LOAN-2026-000123"
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'

    get:
      tags:
        - Loans
      summary: List loans
      description: |
        Retrieves a paginated list of loans with optional filters.
        Results are filtered based on user's access permissions.
      operationId: getLoans
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/TenantIdHeader'
        - $ref: '#/components/parameters/PageParam'
        - $ref: '#/components/parameters/SizeParam'
        - $ref: '#/components/parameters/SortParam'
        - $ref: '#/components/parameters/StatusFilter'
        - $ref: '#/components/parameters/BranchFilter'
        - $ref: '#/components/parameters/DateFromFilter'
        - $ref: '#/components/parameters/DateToFilter'
        - name: customerId
          in: query
          schema:
            type: string
        - name: productId
          in: query
          schema:
            type: string
        - name: classification
          in: query
          schema:
            type: string
            enum: [STD_0, STD_1, STD_2, SMA, SS, DF, BL]
        - name: amountMin
          in: query
          schema:
            type: number
        - name: amountMax
          in: query
          schema:
            type: number
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LoanListResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
```

### 5.2 Get Loan Details

```yaml
  /loans/{loanId}:
    get:
      tags:
        - Loans
      summary: Get loan details
      description: Retrieves detailed information about a specific loan
      operationId: getLoan
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/LoanIdPath'
        - $ref: '#/components/parameters/TenantIdHeader'
        - name: include
          in: query
          description: Additional data to include
          schema:
            type: array
            items:
              type: string
              enum: [schedule, transactions, documents, collaterals, guarantors, workflow]
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LoanDetailResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '404':
          $ref: '#/components/responses/NotFound'
```

### 5.3 Loan Approval

```yaml
  /loans/{loanId}/approve:
    post:
      tags:
        - Loans
      summary: Approve loan
      description: |
        Approves a loan application. Requires appropriate approval authority
        based on loan amount and approval hierarchy.
      operationId: approveLoan
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/LoanIdPath'
        - $ref: '#/components/parameters/TenantIdHeader'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ApprovalRequest'
            example:
              approvedAmount: 450000.00
              interestRate: 12.5
              tenure: 36
              conditions:
                - "Property valuation report required"
                - "Life insurance mandatory"
              remarks: "Approved based on good CIB score and stable employment"
      responses:
        '200':
          description: Loan approved successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LoanResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'
        '404':
          $ref: '#/components/responses/NotFound'
        '422':
          description: Cannot approve loan
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                type: "https://ulms.unisoft.com.bd/errors/business-rule-violation"
                title: "Cannot Approve Loan"
                status: 422
                detail: "Loan cannot be approved in current status"
                errors:
                  - code: "LOAN_INVALID_STATE"
                    message: "Loan must be in SUBMITTED status to approve"
```

### 5.4 Loan Disbursement

```yaml
  /loans/{loanId}/disburse:
    post:
      tags:
        - Loans
      summary: Disburse loan
      description: |
        Disburses an approved loan. Triggers CBS integration for account credit.
      operationId: disburseLoan
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/LoanIdPath'
        - $ref: '#/components/parameters/TenantIdHeader'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/DisbursementRequest'
            example:
              disbursementDate: "2026-03-01"
              disbursementAmount: 450000.00
              disbursementMode: "ACCOUNT_CREDIT"
              accountNumber: "1234567890"
              firstEmiDate: "2026-04-05"
              remarks: "Disbursed after document verification"
      responses:
        '200':
          description: Loan disbursed successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DisbursementResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '404':
          $ref: '#/components/responses/NotFound'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'
```

---

## 6. Customer Service APIs

### 6.1 Create Customer

```yaml
paths:
  /customers:
    post:
      tags:
        - Customers
      summary: Create a new customer
      description: |
        Creates a new customer with NID verification.
        Automatically checks for duplicate NID and blacklist.
      operationId: createCustomer
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/TenantIdHeader'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateCustomerRequest'
            example:
              nid: "1234567890123"
              firstName: "MD. REZAUL"
              lastName: "KARIM"
              firstNameBn: "মোঃ রেজাউল"
              lastNameBn: "করিম"
              dateOfBirth: "1990-05-15"
              gender: "MALE"
              mobileNumber: "+8801712345678"
              email: "rezaul.karim@email.com"
              presentAddress:
                line1: "123, Road 5"
                line2: "Dhanmondi"
                city: "Dhaka"
                postalCode: "1205"
              employment:
                type: "SALARIED"
                employerName: "ABC Corporation"
                designation: "Manager"
                monthlyIncome: 75000
      responses:
        '201':
          description: Customer created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CustomerResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '409':
          description: Duplicate NID
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                type: "https://ulms.unisoft.com.bd/errors/conflict-error"
                title: "Duplicate NID"
                status: 409
                detail: "Customer with NID 1234567890123 already exists"
        '422':
          $ref: '#/components/responses/UnprocessableEntity'
```

### 6.2 NID Verification

```yaml
  /customers/{customerId}/verify-nid:
    post:
      tags:
        - Customers
      summary: Verify customer NID
      description: |
        Verifies customer NID with National ID Wing (NIDW).
        Auto-populates customer data from NID response.
      operationId: verifyCustomerNid
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/CustomerIdPath'
        - $ref: '#/components/parameters/TenantIdHeader'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - nid
                - dateOfBirth
              properties:
                nid:
                  type: string
                  pattern: '^\d{13}$|^\d{17}$'
                dateOfBirth:
                  type: string
                  format: date
            example:
              nid: "1234567890123"
              dateOfBirth: "1990-05-15"
      responses:
        '200':
          description: NID verification successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/NidVerificationResponse'
              example:
                verified: true
                verificationId: "NID-VER-2026-001234"
                nidData:
                  name: "MD. REZAUL KARIM"
                  nameBn: "মোঃ রেজাউল করিম"
                  fatherName: "MD. ABDUL KARIM"
                  motherName: "FATEMA BEGUM"
                  dateOfBirth: "1990-05-15"
                  presentAddress: "123, Road 5, Dhanmondi, Dhaka"
                  photo: "base64-encoded-photo"
        '422':
          description: NID verification failed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
```

---

## 7. CIB Service APIs

### 7.1 CIB Inquiry

```yaml
paths:
  /cib/inquiry:
    post:
      tags:
        - CIB
      summary: Submit CIB inquiry
      description: |
        Submits a real-time CIB inquiry to Bangladesh Bank CIB Online system.
        Results are cached for 1 hour.
      operationId: submitCibInquiry
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/TenantIdHeader'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CibInquiryRequest'
            example:
              customerId: "CUST-2026-001234"
              nid: "1234567890123"
              dateOfBirth: "1990-05-15"
              inquiryType: "INDIVIDUAL"
              purpose: "LOAN_APPLICATION"
              applicationId: "APP-2026-000456"
      responses:
        '200':
          description: CIB inquiry successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CibReportResponse'
              example:
                inquiryId: "CIB-2026-001234"
                status: "SUCCESS"
                reportDate: "2026-02-05T10:30:00Z"
                subject:
                  name: "MD. REZAUL KARIM"
                  nid: "123****0123"
                  cibScore: 785
                  riskGrade: "AA"
                facilities:
                  - bankName: "EXAMPLE BANK LTD"
                    facilityType: "TERM_LOAN"
                    sanctionedAmount: 1000000
                    outstandingAmount: 650000
                    classification: "STD"
                    dpd: 0
                summary:
                  totalFacilities: 3
                  totalOutstanding: 1250000
                  totalMonthlyEMI: 45000
                  worstClassification: "STD"
                  maxDPD: 0
        '202':
          description: CIB inquiry accepted, processing
          content:
            application/json:
              schema:
                type: object
                properties:
                  inquiryId:
                    type: string
                  status:
                    type: string
                    enum: [PROCESSING]
                  estimatedCompletionTime:
                    type: string
                    format: date-time
        '429':
          $ref: '#/components/responses/TooManyRequests'
        '503':
          description: CIB service unavailable
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
```

---

## 8. Workflow Service APIs

### 8.1 Get Pending Approvals

```yaml
paths:
  /approvals/pending:
    get:
      tags:
        - Workflows
      summary: Get pending approvals
      description: |
        Retrieves list of pending approval tasks for the authenticated user
        based on their approval authority.
      operationId: getPendingApprovals
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/TenantIdHeader'
        - $ref: '#/components/parameters/PageParam'
        - $ref: '#/components/parameters/SizeParam'
        - name: type
          in: query
          schema:
            type: string
            enum: [LOAN_APPROVAL, DISBURSEMENT, RESCHEDULE, WRITE_OFF]
        - name: priority
          in: query
          schema:
            type: string
            enum: [HIGH, MEDIUM, LOW]
        - name: dueWithinDays
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 30
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PendingApprovalsResponse'
              example:
                data:
                  - taskId: "TASK-2026-001234"
                    workflowId: "WF-2026-000123"
                    type: "LOAN_APPROVAL"
                    loanId: "LOAN-2026-000123"
                    customerName: "MD. REZAUL KARIM"
                    requestedAmount: 500000
                    branchName: "Dhaka Main Branch"
                    submittedAt: "2026-02-04T10:30:00Z"
                    dueAt: "2026-02-06T10:30:00Z"
                    priority: "HIGH"
                    previousApprovals:
                      - level: "BRANCH_CREDIT_HEAD"
                        approver: "John Doe"
                        approvedAt: "2026-02-04T14:00:00Z"
                pagination:
                  page: 0
                  size: 20
                  totalElements: 45
```

### 8.2 Complete Approval Task

```yaml
  /approvals/{taskId}/approve:
    post:
      tags:
        - Workflows
      summary: Approve task
      description: |
        Approves a pending approval task.
        Automatically routes to next approver if required.
      operationId: approveTask
      security:
        - bearerAuth: []
      parameters:
        - name: taskId
          in: path
          required: true
          schema:
            type: string
        - $ref: '#/components/parameters/TenantIdHeader'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ApprovalActionRequest'
            example:
              approvedAmount: 450000
              interestRate: 12.5
              conditions:
                - "Property valuation required"
              remarks: "Approved based on strong financials"
              digitalSignature: "base64-signature-data"
      responses:
        '200':
          description: Task approved successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApprovalActionResponse'
```

---

## 9. Document Service APIs

### 9.1 Upload Document

```yaml
paths:
  /documents:
    post:
      tags:
        - Documents
      summary: Upload document
      description: |
        Uploads a document with AES-256 encryption.
        Supports PDF, JPG, PNG formats up to 10MB.
      operationId: uploadDocument
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/TenantIdHeader'
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required:
                - file
                - documentType
                - entityType
                - entityId
              properties:
                file:
                  type: string
                  format: binary
                  description: Document file (max 10MB)
                documentType:
                  type: string
                  enum: [NID, TIN, PHOTO, INCOME_PROOF, BANK_STATEMENT, PROPERTY_DEED]
                entityType:
                  type: string
                  enum: [CUSTOMER, LOAN, APPLICATION]
                entityId:
                  type: string
                description:
                  type: string
                  maxLength: 500
                expiryDate:
                  type: string
                  format: date
      responses:
        '201':
          description: Document uploaded successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DocumentResponse'
              example:
                id: "DOC-2026-001234"
                fileName: "nid_front.pdf"
                documentType: "NID"
                mimeType: "application/pdf"
                size: 1048576
                checksum: "sha256-hash"
                encrypted: true
                uploadedAt: "2026-02-05T10:30:00Z"
                uploadedBy: "user123"
        '400':
          $ref: '#/components/responses/BadRequest'
        '413':
          description: File too large
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
```

---

## 10. BRPD Service APIs

### 10.1 Get Classification

```yaml
paths:
  /classifications/{loanId}:
    get:
      tags:
        - Classifications
      summary: Get loan classification
      description: |
        Retrieves current BRPD classification for a loan
        including DPD calculation and provision rate.
      operationId: getLoanClassification
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/LoanIdPath'
        - $ref: '#/components/parameters/TenantIdHeader'
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ClassificationResponse'
              example:
                loanId: "LOAN-2026-000123"
                classification: "SMA"
                previousClassification: "STD_2"
                dpd: 75
                dpdCalculatedAt: "2026-02-05T02:30:00Z"
                outstandingBalance: 450000
                provisionRate: 5.0
                provisionAmount: 22500
                classificationDate: "2026-02-05"
                nextReviewDate: "2026-02-06"
                interestSuspense: 12500
                brpdCircular: "15/2024"
        '404':
          $ref: '#/components/responses/NotFound'
```

### 10.2 Batch Classification

```yaml
  /classifications/batch:
    post:
      tags:
        - Classifications
      summary: Run batch classification
      description: |
        Triggers batch classification for all active loans.
        Typically run daily at 2:30 AM.
      operationId: runBatchClassification
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/TenantIdHeader'
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                branchId:
                  type: string
                  description: Optional branch filter
                asOfDate:
                  type: string
                  format: date
                  description: Classification date (default today)
      responses:
        '202':
          description: Batch classification started
          content:
            application/json:
              schema:
                type: object
                properties:
                  jobId:
                    type: string
                  status:
                    type: string
                    enum: [STARTED]
                  estimatedLoans:
                    type: integer
                  estimatedCompletionTime:
                    type: string
                    format: date-time
```

---

## 11. Notification Service APIs

### 11.1 Send SMS

```yaml
paths:
  /notifications/sms:
    post:
      tags:
        - Notifications
      summary: Send SMS notification
      description: Sends SMS to customer mobile number
      operationId: sendSms
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/TenantIdHeader'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SmsRequest'
            example:
              templateId: "TMPL-LOAN-APPROVED"
              recipient: "+8801712345678"
              parameters:
                customerName: "MD. REZAUL KARIM"
                loanAmount: "4,50,000"
                loanId: "LOAN-2026-000123"
              customerId: "CUST-2026-001234"
              entityType: "LOAN"
              entityId: "LOAN-2026-000123"
      responses:
        '202':
          description: SMS queued for delivery
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/NotificationResponse'
```

---

## 12. Analytics Service APIs

### 12.1 CL-1 Report

```yaml
paths:
  /reports/cl1:
    get:
      tags:
        - Reports
      summary: Generate CL-1 Report
      description: |
        Generates Bangladesh Bank CL-1 (Classified Loans) report.
        Report shows all classified loans by classification status.
      operationId: generateCl1Report
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/TenantIdHeader'
        - name: asOfDate
          in: query
          required: true
          schema:
            type: string
            format: date
        - name: branchId
          in: query
          schema:
            type: string
        - name: format
          in: query
          schema:
            type: string
            enum: [JSON, PDF, EXCEL]
            default: JSON
      responses:
        '200':
          description: Report generated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Cl1ReportResponse'
            application/pdf:
              schema:
                type: string
                format: binary
            application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
              schema:
                type: string
                format: binary
```

### 12.2 Executive Dashboard

```yaml
  /dashboards/executive:
    get:
      tags:
        - Reports
      summary: Get executive dashboard
      description: |
        Retrieves executive dashboard KPIs and metrics.
      operationId: getExecutiveDashboard
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/TenantIdHeader'
        - name: period
          in: query
          schema:
            type: string
            enum: [TODAY, WEEK, MONTH, QUARTER, YEAR]
            default: MONTH
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ExecutiveDashboardResponse'
              example:
                period: "MONTH"
                portfolioSummary:
                  totalLoans: 15000
                  totalOutstanding: 2500000000
                  averageTicketSize: 166666
                disbursements:
                  count: 450
                  amount: 225000000
                  growthPercent: 12.5
                collections:
                  dueAmount: 180000000
                  collectedAmount: 172000000
                  collectionRate: 95.5
                npaMetrics:
                  totalNPA: 125000000
                  npaPercent: 5.0
                  provisionAmount: 62500000
                approvalMetrics:
                  pendingCount: 85
                  avgTat: 18.5
                  approvalRate: 82.3
```

---

## 13. Admin Service APIs

### 13.1 User Management

```yaml
paths:
  /users:
    get:
      tags:
        - Admin
      summary: List users
      operationId: getUsers
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/TenantIdHeader'
        - $ref: '#/components/parameters/PageParam'
        - $ref: '#/components/parameters/SizeParam'
        - name: role
          in: query
          schema:
            type: string
        - name: branchId
          in: query
          schema:
            type: string
        - name: status
          in: query
          schema:
            type: string
            enum: [ACTIVE, INACTIVE, LOCKED]
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserListResponse'

    post:
      tags:
        - Admin
      summary: Create user
      operationId: createUser
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/TenantIdHeader'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserResponse'
```

---

## 14. Security Specifications

### 14.1 Security Schemes

```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: |
        JWT Bearer token authentication.

        Token is obtained from `/auth/login` endpoint.
        Include in Authorization header: `Bearer {token}`

        Token contains:
        - User ID and roles
        - Tenant ID
        - Branch ID
        - Approval limits

    apiKey:
      type: apiKey
      in: header
      name: X-API-Key
      description: |
        API Key for service-to-service authentication.
        Used by partner integrations.

security:
  - bearerAuth: []
```

### 14.2 Required Headers

```yaml
# All protected endpoints require these headers
headers:
  Authorization:
    required: true
    description: "Bearer {JWT_TOKEN}"
  X-Tenant-ID:
    required: true
    description: "Bank/tenant identifier (e.g., BANK_001)"
  X-Correlation-ID:
    required: false
    description: "Request correlation ID for tracing"
```

---

## 15. Schema Definitions

### 15.1 Loan Schemas

```yaml
components:
  schemas:
    CreateLoanRequest:
      type: object
      required:
        - customerId
        - productId
        - requestedAmount
        - tenure
        - purpose
      properties:
        customerId:
          type: string
          description: Customer identifier
          pattern: '^CUST-\d{4}-\d{6}$'
          example: "CUST-2026-001234"
        productId:
          type: string
          description: Loan product identifier
          example: "PROD-PL-001"
        requestedAmount:
          type: number
          format: double
          minimum: 10000
          maximum: 100000000
          description: Requested loan amount in BDT
          example: 500000.00
        tenure:
          type: integer
          minimum: 6
          maximum: 84
          description: Loan tenure in months
          example: 36
        purpose:
          type: string
          maxLength: 500
          description: Purpose of the loan
          example: "Home renovation"
        expectedDisbursementDate:
          type: string
          format: date
          description: Expected disbursement date
        collaterals:
          type: array
          items:
            $ref: '#/components/schemas/CollateralRequest'
        guarantors:
          type: array
          items:
            $ref: '#/components/schemas/GuarantorRequest'
        remarks:
          type: string
          maxLength: 1000

    LoanResponse:
      type: object
      properties:
        data:
          $ref: '#/components/schemas/Loan'
        _links:
          type: object
          properties:
            self:
              type: object
              properties:
                href:
                  type: string
            customer:
              type: object
              properties:
                href:
                  type: string
            documents:
              type: object
              properties:
                href:
                  type: string
            schedule:
              type: object
              properties:
                href:
                  type: string

    Loan:
      type: object
      properties:
        id:
          type: string
          description: Unique loan identifier
          example: "LOAN-2026-000123"
        customerId:
          type: string
          example: "CUST-2026-001234"
        customerName:
          type: string
          example: "MD. REZAUL KARIM"
        productId:
          type: string
          example: "PROD-PL-001"
        productName:
          type: string
          example: "Personal Loan"
        requestedAmount:
          type: number
          format: double
          example: 500000.00
        approvedAmount:
          type: number
          format: double
          nullable: true
          example: 450000.00
        disbursedAmount:
          type: number
          format: double
          nullable: true
          example: 450000.00
        outstandingBalance:
          type: number
          format: double
          example: 425000.00
        interestRate:
          type: number
          format: double
          example: 12.5
        tenure:
          type: integer
          example: 36
        emiAmount:
          type: number
          format: double
          example: 15040.50
        status:
          $ref: '#/components/schemas/LoanStatus'
        classification:
          $ref: '#/components/schemas/Classification'
        dpd:
          type: integer
          example: 0
        branchId:
          type: string
          example: "BR-DHK-001"
        branchName:
          type: string
          example: "Dhaka Main Branch"
        applicationDate:
          type: string
          format: date
        approvedAt:
          type: string
          format: date-time
          nullable: true
        disbursedAt:
          type: string
          format: date-time
          nullable: true
        firstEmiDate:
          type: string
          format: date
          nullable: true
        maturityDate:
          type: string
          format: date
          nullable: true
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
        createdBy:
          type: string
        updatedBy:
          type: string

    LoanStatus:
      type: string
      enum:
        - DRAFT
        - SUBMITTED
        - UNDER_REVIEW
        - APPROVED
        - REJECTED
        - DISBURSED
        - ACTIVE
        - CLOSED
        - WRITTEN_OFF
        - RESCHEDULED

    Classification:
      type: string
      enum:
        - STD_0
        - STD_1
        - STD_2
        - SMA
        - SS
        - DF
        - BL
      description: |
        BRPD 15/2024 Classification:
        - STD_0: Standard (Current)
        - STD_1: Standard (Watch) - 1-30 DPD
        - STD_2: Standard (Caution) - 31-60 DPD
        - SMA: Special Mention Account - 61-90 DPD
        - SS: Substandard - 91-180 DPD
        - DF: Doubtful - 181-365 DPD
        - BL: Bad/Loss - >365 DPD

    ErrorResponse:
      type: object
      properties:
        type:
          type: string
          format: uri
          example: "https://ulms.unisoft.com.bd/errors/validation-error"
        title:
          type: string
          example: "Validation Error"
        status:
          type: integer
          example: 422
        detail:
          type: string
          example: "One or more validation errors occurred"
        instance:
          type: string
          example: "/api/v1/loans"
        timestamp:
          type: string
          format: date-time
        traceId:
          type: string
        errors:
          type: array
          items:
            $ref: '#/components/schemas/FieldError'

    FieldError:
      type: object
      properties:
        field:
          type: string
          example: "requestedAmount"
        code:
          type: string
          example: "AMOUNT_TOO_LOW"
        message:
          type: string
          example: "Amount must be at least BDT 10,000"
        rejectedValue:
          example: 5000

    Pagination:
      type: object
      properties:
        page:
          type: integer
          example: 0
        size:
          type: integer
          example: 20
        totalElements:
          type: integer
          example: 150
        totalPages:
          type: integer
          example: 8
        hasNext:
          type: boolean
          example: true
        hasPrevious:
          type: boolean
          example: false
        isFirst:
          type: boolean
          example: true
        isLast:
          type: boolean
          example: false
```

---

## Appendix A: API Quick Reference

| Service | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Auth | `/auth/login` | POST | User login |
| Loans | `/loans` | POST | Create loan |
| Loans | `/loans/{id}/approve` | POST | Approve loan |
| Loans | `/loans/{id}/disburse` | POST | Disburse loan |
| Customers | `/customers` | POST | Create customer |
| Customers | `/customers/{id}/verify-nid` | POST | Verify NID |
| CIB | `/cib/inquiry` | POST | CIB inquiry |
| Workflows | `/approvals/pending` | GET | Pending approvals |
| Documents | `/documents` | POST | Upload document |
| Reports | `/reports/cl1` | GET | CL-1 Report |

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Lead Developer | | | |
| Developer 1 | | | |
| Developer 2 | | | |
| Technical Architect | | | |

---

**Document End**

*ULMS v2.0 - OpenAPI 3.0 Contract Specifications v1.0*

*Unisoft Systems Limited - Confidential*

*This document provides comprehensive OpenAPI 3.0 specifications for all 180+ ULMS v2.0 API endpoints.*

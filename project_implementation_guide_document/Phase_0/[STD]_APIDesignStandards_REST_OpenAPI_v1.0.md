# API Design Standards (REST, OpenAPI 3.0)

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ULMS-STD-0.3.5 |
| **Document Title** | API Design Standards (REST, OpenAPI 3.0) |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-04 |
| **Prepared By** | Technical Lead |
| **Reviewed By** | Project Manager |
| **Classification** | Internal |
| **Status** | Approved |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-04 | Lead Dev | Initial version |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [RESTful Design Principles](#2-restful-design-principles)
3. [URL Structure & Naming](#3-url-structure--naming)
4. [HTTP Methods](#4-http-methods)
5. [HTTP Status Codes](#5-http-status-codes)
6. [Request & Response Format](#6-request--response-format)
7. [Pagination, Filtering & Sorting](#7-pagination-filtering--sorting)
8. [Error Handling](#8-error-handling)
9. [Versioning Strategy](#9-versioning-strategy)
10. [Security Standards](#10-security-standards)
11. [OpenAPI 3.0 Specification](#11-openapi-30-specification)
12. [Kong API Gateway Integration](#12-kong-api-gateway-integration)
13. [ULMS API Examples](#13-ulms-api-examples)

---

## 1. Introduction

### 1.1 Purpose

This document defines API design standards for ULMS v2.0, ensuring consistent, predictable, and well-documented APIs across all microservices. These standards align with industry best practices and Bangladesh banking requirements.

### 1.2 Scope

All REST APIs in ULMS including:
- Loan Origination APIs
- Credit Management APIs
- CIB Integration APIs
- Workflow APIs
- Document Management APIs
- Reporting APIs
- Administration APIs

### 1.3 API Inventory Overview

| Service | Base Path | Estimated Endpoints |
|---------|-----------|---------------------|
| Fineract Core | /fineract-provider/api/v1 | 50+ |
| Loan Service | /api/v1/loans | 30+ |
| Credit Service | /api/v1/credit | 25+ |
| CIB Service | /api/v1/cib | 15+ |
| Workflow Service | /api/v1/workflows | 20+ |
| Document Service | /api/v1/documents | 15+ |
| Notification Service | /api/v1/notifications | 10+ |
| Admin Service | /api/v1/admin | 15+ |
| **Total** | | **180+** |

---

## 2. RESTful Design Principles

### 2.1 Core Principles

| Principle | Description | Example |
|-----------|-------------|---------|
| **Resource-Oriented** | URLs represent resources, not actions | `/loans` not `/getLoan` |
| **Stateless** | Each request contains all needed info | No server-side session |
| **Uniform Interface** | Consistent URL structure | `/resources/{id}` |
| **HATEOAS** | Responses include related links | Links to related resources |
| **Layered System** | API gateway abstracts backend | Kong handles routing |

### 2.2 Resource Design Guidelines

```
Resources are nouns, not verbs:

✅ Good:
GET /api/v1/loans
POST /api/v1/loans
GET /api/v1/loans/{id}

❌ Bad:
GET /api/v1/getLoanById
POST /api/v1/createLoan
GET /api/v1/loan/retrieve
```

### 2.3 Resource Relationships

```
Parent-Child relationships:

/api/v1/customers/{customerId}/loans          # Loans for a customer
/api/v1/loans/{loanId}/documents              # Documents for a loan
/api/v1/loans/{loanId}/payments               # Payments for a loan
/api/v1/branches/{branchId}/applications      # Applications by branch
```

---

## 3. URL Structure & Naming

### 3.1 Base URL Format

```
https://{environment}.ulms.unisoft.com.bd/api/{version}/{resource}

Production: https://api.ulms.unisoft.com.bd/api/v1/
Staging:    https://staging-api.ulms.unisoft.com.bd/api/v1/
Development: https://dev-api.ulms.unisoft.com.bd/api/v1/
Local:      http://localhost:8080/api/v1/
```

### 3.2 URL Naming Conventions

| Rule | Example | Avoid |
|------|---------|-------|
| Use lowercase | `/loans` | `/Loans` |
| Use hyphens for multi-word | `/loan-applications` | `/loan_applications` |
| Use plural nouns | `/customers` | `/customer` |
| No trailing slash | `/loans` | `/loans/` |
| No file extensions | `/loans/123` | `/loans/123.json` |
| No verbs in URL | `/loans` | `/getLoans` |

### 3.3 URL Path Parameters

```
# Resource identifier
GET /api/v1/loans/{loanId}

# Nested resources
GET /api/v1/customers/{customerId}/loans/{loanId}

# Parameter naming: camelCase
GET /api/v1/loans/{loanId}/documents/{documentId}
```

### 3.4 URL Query Parameters

```
# Filtering
GET /api/v1/loans?status=ACTIVE&branchId=101

# Pagination
GET /api/v1/loans?page=0&size=20

# Sorting
GET /api/v1/loans?sort=createdAt,desc

# Searching
GET /api/v1/customers?search=rahman

# Date range
GET /api/v1/loans?fromDate=2026-01-01&toDate=2026-01-31
```

### 3.5 Resource Actions (Non-CRUD Operations)

For actions that don't fit CRUD, use sub-resources:

```
# Approve a loan (action)
POST /api/v1/loans/{loanId}/approve

# Reject a loan
POST /api/v1/loans/{loanId}/reject

# Disburse a loan
POST /api/v1/loans/{loanId}/disburse

# Submit for review
POST /api/v1/loan-applications/{id}/submit

# Generate CIB report
POST /api/v1/customers/{customerId}/cib-inquiry
```

---

## 4. HTTP Methods

### 4.1 Method Usage

| Method | Purpose | Request Body | Idempotent | Safe |
|--------|---------|--------------|------------|------|
| GET | Retrieve resource(s) | No | Yes | Yes |
| POST | Create resource | Yes | No | No |
| PUT | Replace resource | Yes | Yes | No |
| PATCH | Partial update | Yes | Yes | No |
| DELETE | Remove resource | No | Yes | No |
| OPTIONS | Get allowed methods | No | Yes | Yes |
| HEAD | Get headers only | No | Yes | Yes |

### 4.2 Method Examples

```
# GET - Retrieve
GET /api/v1/loans                    # List all loans
GET /api/v1/loans/123                # Get loan by ID
GET /api/v1/loans?status=ACTIVE      # Get filtered loans

# POST - Create
POST /api/v1/loans                   # Create new loan
POST /api/v1/loans/123/approve       # Action on loan

# PUT - Full replacement
PUT /api/v1/loans/123                # Replace entire loan

# PATCH - Partial update
PATCH /api/v1/loans/123              # Update specific fields

# DELETE - Remove
DELETE /api/v1/loans/123             # Delete loan
DELETE /api/v1/loans/123/documents/456  # Delete document from loan
```

### 4.3 Method Selection Guide

| Scenario | Method | URL |
|----------|--------|-----|
| Get list of resources | GET | /resources |
| Get single resource | GET | /resources/{id} |
| Create new resource | POST | /resources |
| Replace entire resource | PUT | /resources/{id} |
| Update partial resource | PATCH | /resources/{id} |
| Delete resource | DELETE | /resources/{id} |
| Perform action on resource | POST | /resources/{id}/action |
| Bulk create | POST | /resources/batch |
| Bulk delete | DELETE | /resources/batch |

---

## 5. HTTP Status Codes

### 5.1 Success Codes (2xx)

| Code | Name | Usage | Example |
|------|------|-------|---------|
| 200 | OK | Successful GET, PUT, PATCH | Get loan details |
| 201 | Created | Successful POST (created) | Create new loan |
| 202 | Accepted | Request accepted, processing async | Submit for CIB |
| 204 | No Content | Successful DELETE | Delete document |

### 5.2 Client Error Codes (4xx)

| Code | Name | Usage | Example |
|------|------|-------|---------|
| 400 | Bad Request | Invalid request body/params | Missing required field |
| 401 | Unauthorized | Missing/invalid authentication | No JWT token |
| 403 | Forbidden | Authenticated but not authorized | Wrong role |
| 404 | Not Found | Resource doesn't exist | Loan ID not found |
| 405 | Method Not Allowed | Wrong HTTP method | POST on /loans/{id} |
| 409 | Conflict | State conflict | Duplicate application |
| 415 | Unsupported Media Type | Wrong content type | XML instead of JSON |
| 422 | Unprocessable Entity | Semantic validation error | Invalid NID format |
| 429 | Too Many Requests | Rate limit exceeded | API throttling |

### 5.3 Server Error Codes (5xx)

| Code | Name | Usage | Example |
|------|------|-------|---------|
| 500 | Internal Server Error | Unexpected server error | Unhandled exception |
| 502 | Bad Gateway | Upstream service error | CIB API down |
| 503 | Service Unavailable | Service temporarily down | Maintenance |
| 504 | Gateway Timeout | Upstream timeout | CIB response slow |

### 5.4 Status Code Selection Guide

```
Request Processing:

Valid request?
├── No → 400 Bad Request
└── Yes → Authenticated?
    ├── No → 401 Unauthorized
    └── Yes → Authorized?
        ├── No → 403 Forbidden
        └── Yes → Resource exists?
            ├── No → 404 Not Found
            └── Yes → Business rules pass?
                ├── No → 422 Unprocessable Entity
                └── Yes → Process successful?
                    ├── No → 500 Internal Server Error
                    └── Yes → Return 2xx
```

---

## 6. Request & Response Format

### 6.1 Content Type

```
Headers:
Content-Type: application/json
Accept: application/json
```

### 6.2 Request Body Format

```json
{
  "customerId": "CUST-2026-001234",
  "productId": "PROD-PERSONAL-001",
  "requestedAmount": 500000.00,
  "tenure": 36,
  "purpose": "Home renovation",
  "collaterals": [
    {
      "type": "PROPERTY",
      "value": 2000000.00,
      "description": "Land at Mirpur"
    }
  ]
}
```

### 6.3 Response Body Format - Single Resource

```json
{
  "data": {
    "id": "LOAN-2026-000123",
    "customerId": "CUST-2026-001234",
    "productName": "Personal Loan",
    "requestedAmount": 500000.00,
    "approvedAmount": 450000.00,
    "interestRate": 12.5,
    "tenure": 36,
    "status": "APPROVED",
    "createdAt": "2026-02-04T10:30:00Z",
    "updatedAt": "2026-02-04T14:45:00Z"
  },
  "links": {
    "self": "/api/v1/loans/LOAN-2026-000123",
    "customer": "/api/v1/customers/CUST-2026-001234",
    "documents": "/api/v1/loans/LOAN-2026-000123/documents",
    "payments": "/api/v1/loans/LOAN-2026-000123/payments"
  }
}
```

### 6.4 Response Body Format - Collection

```json
{
  "data": [
    {
      "id": "LOAN-2026-000123",
      "customerId": "CUST-2026-001234",
      "status": "APPROVED"
    },
    {
      "id": "LOAN-2026-000124",
      "customerId": "CUST-2026-001235",
      "status": "PENDING"
    }
  ],
  "pagination": {
    "page": 0,
    "size": 20,
    "totalElements": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrevious": false
  },
  "links": {
    "self": "/api/v1/loans?page=0&size=20",
    "next": "/api/v1/loans?page=1&size=20",
    "last": "/api/v1/loans?page=7&size=20"
  }
}
```

### 6.5 Field Naming Conventions

| Rule | Example | Avoid |
|------|---------|-------|
| camelCase | `customerId` | `customer_id` |
| Boolean as is/has | `isActive`, `hasDocuments` | `active`, `documents_exist` |
| Dates in ISO 8601 | `2026-02-04T10:30:00Z` | `04-02-2026` |
| Amounts as numbers | `500000.00` | `"500000.00"` |
| IDs as strings | `"LOAN-2026-000123"` | `123` |

### 6.6 Null Handling

```json
{
  "data": {
    "id": "LOAN-2026-000123",
    "approvedAmount": null,           // Explicit null for optional field
    "sanctionedAt": null,             // Not yet sanctioned
    "disbursedAt": null               // Not yet disbursed
  }
}

// Alternatively, omit null fields:
{
  "data": {
    "id": "LOAN-2026-000123"
    // approvedAmount not included
  }
}
```

---

## 7. Pagination, Filtering & Sorting

### 7.1 Pagination Parameters

| Parameter | Description | Default | Max |
|-----------|-------------|---------|-----|
| `page` | Page number (0-indexed) | 0 | - |
| `size` | Items per page | 20 | 100 |

```
GET /api/v1/loans?page=0&size=20
GET /api/v1/loans?page=2&size=50
```

### 7.2 Pagination Response

```json
{
  "data": [...],
  "pagination": {
    "page": 0,
    "size": 20,
    "totalElements": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrevious": false,
    "isFirst": true,
    "isLast": false
  }
}
```

### 7.3 Filtering Parameters

```
# Single value filter
GET /api/v1/loans?status=ACTIVE

# Multiple values (OR)
GET /api/v1/loans?status=ACTIVE,PENDING

# Range filter
GET /api/v1/loans?amountMin=100000&amountMax=500000

# Date range
GET /api/v1/loans?createdFrom=2026-01-01&createdTo=2026-01-31

# Text search
GET /api/v1/customers?search=rahman

# Nested filter
GET /api/v1/loans?customer.nid=1234567890123
```

### 7.4 Sorting Parameters

```
# Single field sort
GET /api/v1/loans?sort=createdAt,desc

# Multiple field sort
GET /api/v1/loans?sort=status,asc&sort=createdAt,desc

# Default sort
// If no sort specified, default to createdAt,desc
```

### 7.5 Combined Example

```
GET /api/v1/loans?status=ACTIVE&branchId=101&amountMin=100000&sort=createdAt,desc&page=0&size=20

Response:
{
  "data": [...],
  "filters": {
    "status": "ACTIVE",
    "branchId": "101",
    "amountMin": 100000
  },
  "sort": [
    { "field": "createdAt", "direction": "desc" }
  ],
  "pagination": {
    "page": 0,
    "size": 20,
    "totalElements": 45,
    "totalPages": 3
  }
}
```

---

## 8. Error Handling

### 8.1 Error Response Format (RFC 7807)

```json
{
  "type": "https://ulms.unisoft.com.bd/errors/validation-error",
  "title": "Validation Error",
  "status": 422,
  "detail": "One or more validation errors occurred",
  "instance": "/api/v1/loans",
  "timestamp": "2026-02-04T10:30:00Z",
  "traceId": "abc123def456",
  "errors": [
    {
      "field": "requestedAmount",
      "code": "AMOUNT_TOO_LOW",
      "message": "Amount must be at least BDT 10,000",
      "rejectedValue": 5000
    },
    {
      "field": "tenure",
      "code": "TENURE_INVALID",
      "message": "Tenure must be between 6 and 84 months",
      "rejectedValue": 120
    }
  ]
}
```

### 8.2 Standard Error Types

| Type | HTTP Status | Description |
|------|-------------|-------------|
| `/errors/validation-error` | 400, 422 | Input validation failed |
| `/errors/authentication-error` | 401 | Authentication required |
| `/errors/authorization-error` | 403 | Permission denied |
| `/errors/resource-not-found` | 404 | Resource doesn't exist |
| `/errors/conflict-error` | 409 | State conflict |
| `/errors/rate-limit-exceeded` | 429 | Too many requests |
| `/errors/internal-error` | 500 | Server error |
| `/errors/service-unavailable` | 503 | Service down |

### 8.3 Error Codes by Domain

#### Loan Errors

| Code | Message |
|------|---------|
| `LOAN_NOT_FOUND` | Loan with ID {id} not found |
| `LOAN_ALREADY_DISBURSED` | Loan has already been disbursed |
| `LOAN_AMOUNT_EXCEEDS_LIMIT` | Requested amount exceeds product limit |
| `LOAN_INVALID_STATE_TRANSITION` | Cannot {action} loan in {status} status |

#### Customer Errors

| Code | Message |
|------|---------|
| `CUSTOMER_NOT_FOUND` | Customer with ID {id} not found |
| `CUSTOMER_NID_INVALID` | NID must be 13 or 17 digits |
| `CUSTOMER_DUPLICATE_NID` | Customer with NID {nid} already exists |
| `CUSTOMER_BLACKLISTED` | Customer is in blacklist |

#### CIB Errors

| Code | Message |
|------|---------|
| `CIB_SERVICE_UNAVAILABLE` | CIB service is temporarily unavailable |
| `CIB_INQUIRY_FAILED` | CIB inquiry failed: {reason} |
| `CIB_RESPONSE_TIMEOUT` | CIB response timed out |

### 8.4 Error Response Examples

**Validation Error (422)**
```json
{
  "type": "https://ulms.unisoft.com.bd/errors/validation-error",
  "title": "Validation Error",
  "status": 422,
  "detail": "Request validation failed",
  "instance": "/api/v1/loans",
  "timestamp": "2026-02-04T10:30:00Z",
  "traceId": "abc123",
  "errors": [
    {
      "field": "nid",
      "code": "CUSTOMER_NID_INVALID",
      "message": "NID must be 13 or 17 digits",
      "rejectedValue": "12345"
    }
  ]
}
```

**Not Found Error (404)**
```json
{
  "type": "https://ulms.unisoft.com.bd/errors/resource-not-found",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Loan with ID LOAN-2026-999999 not found",
  "instance": "/api/v1/loans/LOAN-2026-999999",
  "timestamp": "2026-02-04T10:30:00Z",
  "traceId": "abc123"
}
```

**Business Rule Error (422)**
```json
{
  "type": "https://ulms.unisoft.com.bd/errors/business-rule-violation",
  "title": "Business Rule Violation",
  "status": 422,
  "detail": "Cannot approve loan due to business rule violation",
  "instance": "/api/v1/loans/LOAN-2026-000123/approve",
  "timestamp": "2026-02-04T10:30:00Z",
  "traceId": "abc123",
  "errors": [
    {
      "code": "DBR_EXCEEDED",
      "message": "Debt Burden Ratio (55%) exceeds maximum allowed (50%)"
    }
  ]
}
```

---

## 9. Versioning Strategy

### 9.1 Version Format

ULMS uses **URL path versioning**:

```
/api/v1/loans
/api/v2/loans
```

### 9.2 Version Rules

| Rule | Description |
|------|-------------|
| Major version in URL | `/api/v1/`, `/api/v2/` |
| Breaking changes = new version | v1 → v2 for incompatible changes |
| Backward compatible changes | Same version, additive only |
| Deprecation period | 6 months minimum |
| Documentation | Each version fully documented |

### 9.3 Breaking vs Non-Breaking Changes

**Non-Breaking (keep same version):**
- Adding new endpoints
- Adding optional request fields
- Adding response fields
- Adding new enum values (with caution)

**Breaking (new version required):**
- Removing endpoints
- Removing request/response fields
- Changing field types
- Changing URL structure
- Changing authentication method

### 9.4 Deprecation Headers

```
HTTP/1.1 200 OK
Deprecation: true
Sunset: Sat, 01 Aug 2026 00:00:00 GMT
Link: </api/v2/loans>; rel="successor-version"
```

### 9.5 Version Lifecycle

```
v1 (Current)
├── Fully supported
├── Bug fixes
├── Security patches
└── New features (non-breaking)

v2 (Coming)
├── Breaking changes
├── New features
└── Beta testing period

v0 (Deprecated)
├── No new features
├── Security patches only
└── Sunset date announced
```

---

## 10. Security Standards

### 10.1 Authentication

**OAuth 2.0 / JWT Bearer Token**

```
GET /api/v1/loans
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Structure:**
```json
{
  "sub": "user123",
  "iss": "https://auth.ulms.unisoft.com.bd",
  "aud": "ulms-api",
  "exp": 1707000000,
  "iat": 1706998200,
  "roles": ["LOAN_OFFICER", "BRANCH_USER"],
  "tenantId": "BANK_001",
  "branchId": "BR_101"
}
```

### 10.2 Authorization

**Role-Based Access Control (RBAC)**

| Role | Permissions |
|------|-------------|
| BRANCH_USER | Read own branch loans |
| LOAN_OFFICER | Create, read, update loans |
| CREDIT_ANALYST | Review loans, CIB inquiry |
| BRANCH_MANAGER | Approve up to limit |
| HO_CREDIT | Approve higher limits |
| ADMIN | Full system access |

### 10.3 API Security Headers

```
# Request Headers
Authorization: Bearer {token}
X-Tenant-ID: BANK_001
X-Request-ID: uuid-string
X-Correlation-ID: uuid-string

# Response Headers
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

### 10.4 Rate Limiting

```
# Response Headers
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1707001000

# Rate Limits by Tier
Standard: 1000 requests/minute
Premium: 5000 requests/minute
Internal: 10000 requests/minute

# 429 Response
{
  "type": "https://ulms.unisoft.com.bd/errors/rate-limit-exceeded",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "You have exceeded the rate limit. Please retry after 60 seconds.",
  "retryAfter": 60
}
```

### 10.5 Input Validation

```java
// Request DTO with validation
public record LoanApplicationRequest(
    @NotNull @Size(min = 13, max = 17) String nid,
    @NotNull @DecimalMin("10000") @DecimalMax("100000000") BigDecimal amount,
    @NotNull @Min(6) @Max(84) Integer tenure,
    @NotBlank @Size(max = 500) String purpose
) {}
```

### 10.6 Sensitive Data Handling

```json
// ❌ Bad: Full NID in response
{
  "nid": "1234567890123"
}

// ✅ Good: Masked NID
{
  "nid": "123****0123"
}

// ❌ Bad: Account number visible
{
  "accountNumber": "1234567890"
}

// ✅ Good: Masked account
{
  "accountNumber": "****7890"
}
```

---

## 11. OpenAPI 3.0 Specification

### 11.1 Specification Structure

```yaml
openapi: 3.0.3
info:
  title: ULMS Loan API
  description: Loan Management API for ULMS v2.0
  version: 1.0.0
  contact:
    name: ULMS API Support
    email: api-support@unisoft.com.bd

servers:
  - url: https://api.ulms.unisoft.com.bd/api/v1
    description: Production
  - url: https://staging-api.ulms.unisoft.com.bd/api/v1
    description: Staging
  - url: http://localhost:8080/api/v1
    description: Local Development

tags:
  - name: Loans
    description: Loan management operations
  - name: Customers
    description: Customer management operations
  - name: CIB
    description: Credit Information Bureau operations
```

### 11.2 Path Definition Example

```yaml
paths:
  /loans:
    get:
      tags:
        - Loans
      summary: List all loans
      description: Retrieve a paginated list of loans with optional filters
      operationId: getLoans
      parameters:
        - $ref: '#/components/parameters/PageParam'
        - $ref: '#/components/parameters/SizeParam'
        - name: status
          in: query
          description: Filter by loan status
          schema:
            $ref: '#/components/schemas/LoanStatus'
        - name: branchId
          in: query
          description: Filter by branch ID
          schema:
            type: string
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LoanListResponse'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '403':
          $ref: '#/components/responses/ForbiddenError'
      security:
        - bearerAuth: []

    post:
      tags:
        - Loans
      summary: Create a new loan application
      description: Submit a new loan application
      operationId: createLoan
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoanApplicationRequest'
      responses:
        '201':
          description: Loan created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LoanResponse'
        '400':
          $ref: '#/components/responses/BadRequestError'
        '422':
          $ref: '#/components/responses/ValidationError'
      security:
        - bearerAuth: []
```

### 11.3 Schema Definition Example

```yaml
components:
  schemas:
    LoanApplicationRequest:
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
          example: "CUST-2026-001234"
        productId:
          type: string
          description: Loan product identifier
          example: "PROD-PERSONAL-001"
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

    LoanResponse:
      type: object
      properties:
        data:
          $ref: '#/components/schemas/Loan'
        links:
          $ref: '#/components/schemas/LoanLinks'

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
        status:
          $ref: '#/components/schemas/LoanStatus'
        requestedAmount:
          type: number
          format: double
          example: 500000.00
        approvedAmount:
          type: number
          format: double
          nullable: true
          example: 450000.00
        interestRate:
          type: number
          format: double
          example: 12.5
        tenure:
          type: integer
          example: 36
        createdAt:
          type: string
          format: date-time
          example: "2026-02-04T10:30:00Z"
        updatedAt:
          type: string
          format: date-time
          example: "2026-02-04T14:45:00Z"

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

    ErrorResponse:
      type: object
      properties:
        type:
          type: string
          format: uri
        title:
          type: string
        status:
          type: integer
        detail:
          type: string
        instance:
          type: string
        timestamp:
          type: string
          format: date-time
        traceId:
          type: string
        errors:
          type: array
          items:
            $ref: '#/components/schemas/FieldError'

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

### 11.4 Common Components

```yaml
components:
  parameters:
    PageParam:
      name: page
      in: query
      description: Page number (0-indexed)
      schema:
        type: integer
        default: 0
        minimum: 0
    SizeParam:
      name: size
      in: query
      description: Page size
      schema:
        type: integer
        default: 20
        minimum: 1
        maximum: 100
    SortParam:
      name: sort
      in: query
      description: Sort field and direction (field,asc|desc)
      schema:
        type: string
        example: "createdAt,desc"

  responses:
    UnauthorizedError:
      description: Authentication required
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
    ForbiddenError:
      description: Permission denied
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
    NotFoundError:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
    ValidationError:
      description: Validation error
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
```

---

## 12. Kong API Gateway Integration

### 12.1 Kong Configuration

```yaml
# kong.yml
_format_version: "3.0"

services:
  - name: loan-service
    url: http://loan-service:8080
    routes:
      - name: loan-routes
        paths:
          - /api/v1/loans
        strip_path: false
    plugins:
      - name: jwt
        config:
          key_claim_name: kid
          claims_to_verify:
            - exp
      - name: rate-limiting
        config:
          minute: 1000
          policy: local
      - name: cors
        config:
          origins:
            - https://ulms.unisoft.com.bd
          methods:
            - GET
            - POST
            - PUT
            - PATCH
            - DELETE
          headers:
            - Authorization
            - Content-Type
            - X-Tenant-ID
            - X-Request-ID
          max_age: 3600

  - name: cib-service
    url: http://cib-service:8080
    routes:
      - name: cib-routes
        paths:
          - /api/v1/cib
    plugins:
      - name: jwt
      - name: rate-limiting
        config:
          minute: 100  # Lower limit for CIB
      - name: request-size-limiting
        config:
          allowed_payload_size: 1
```

### 12.2 Rate Limiting by Endpoint

| Endpoint | Rate Limit | Reason |
|----------|------------|--------|
| `/api/v1/loans` | 1000/min | Standard operations |
| `/api/v1/cib/*` | 100/min | External API costs |
| `/api/v1/reports/*` | 50/min | Heavy operations |
| `/api/v1/admin/*` | 500/min | Admin functions |

### 12.3 Request Transformation

```yaml
# Add tenant header from JWT claim
plugins:
  - name: request-transformer
    config:
      add:
        headers:
          - X-Tenant-ID:$(jwt.claims.tenantId)
          - X-User-ID:$(jwt.claims.sub)
```

---

## 13. ULMS API Examples

### 13.1 Loan Application Flow

**1. Create Loan Application**
```http
POST /api/v1/loans HTTP/1.1
Host: api.ulms.unisoft.com.bd
Authorization: Bearer {token}
Content-Type: application/json
X-Tenant-ID: BANK_001

{
  "customerId": "CUST-2026-001234",
  "productId": "PROD-PERSONAL-001",
  "requestedAmount": 500000.00,
  "tenure": 36,
  "purpose": "Home renovation"
}
```

**Response:**
```json
{
  "data": {
    "id": "LOAN-2026-000123",
    "status": "DRAFT",
    "requestedAmount": 500000.00,
    "createdAt": "2026-02-04T10:30:00Z"
  },
  "links": {
    "self": "/api/v1/loans/LOAN-2026-000123",
    "submit": "/api/v1/loans/LOAN-2026-000123/submit"
  }
}
```

**2. Submit for Review**
```http
POST /api/v1/loans/LOAN-2026-000123/submit HTTP/1.1
Authorization: Bearer {token}
```

**3. Get CIB Report**
```http
POST /api/v1/cib/inquiry HTTP/1.1
Authorization: Bearer {token}
Content-Type: application/json

{
  "customerId": "CUST-2026-001234",
  "inquiryType": "INDIVIDUAL",
  "purpose": "LOAN_APPLICATION"
}
```

**4. Approve Loan**
```http
POST /api/v1/loans/LOAN-2026-000123/approve HTTP/1.1
Authorization: Bearer {token}
Content-Type: application/json

{
  "approvedAmount": 450000.00,
  "interestRate": 12.5,
  "conditions": ["Property valuation required"],
  "remarks": "Approved based on CIB score"
}
```

### 13.2 Postman Collection Structure

```json
{
  "info": {
    "name": "ULMS API Collection",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    { "key": "baseUrl", "value": "https://api.ulms.unisoft.com.bd/api/v1" },
    { "key": "token", "value": "" }
  ],
  "auth": {
    "type": "bearer",
    "bearer": [{ "key": "token", "value": "{{token}}" }]
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        { "name": "Login", "request": { "method": "POST", "url": "{{baseUrl}}/auth/login" } }
      ]
    },
    {
      "name": "Loans",
      "item": [
        { "name": "List Loans", "request": { "method": "GET", "url": "{{baseUrl}}/loans" } },
        { "name": "Create Loan", "request": { "method": "POST", "url": "{{baseUrl}}/loans" } },
        { "name": "Get Loan", "request": { "method": "GET", "url": "{{baseUrl}}/loans/:id" } },
        { "name": "Approve Loan", "request": { "method": "POST", "url": "{{baseUrl}}/loans/:id/approve" } }
      ]
    },
    {
      "name": "CIB",
      "item": [
        { "name": "CIB Inquiry", "request": { "method": "POST", "url": "{{baseUrl}}/cib/inquiry" } }
      ]
    }
  ]
}
```

---

## Appendix A: Quick Reference

### HTTP Methods

| Method | CRUD | Idempotent | Safe |
|--------|------|------------|------|
| GET | Read | Yes | Yes |
| POST | Create | No | No |
| PUT | Update/Replace | Yes | No |
| PATCH | Partial Update | Yes | No |
| DELETE | Delete | Yes | No |

### Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

### URL Patterns

```
GET    /resources           # List
GET    /resources/{id}      # Get one
POST   /resources           # Create
PUT    /resources/{id}      # Replace
PATCH  /resources/{id}      # Update
DELETE /resources/{id}      # Delete
POST   /resources/{id}/action  # Action
```

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Technical Lead | | | |
| Project Manager | | | |

---

**Document End**

*ULMS v2.0 - API Design Standards v1.0*

*Unisoft Systems Limited - Confidential*

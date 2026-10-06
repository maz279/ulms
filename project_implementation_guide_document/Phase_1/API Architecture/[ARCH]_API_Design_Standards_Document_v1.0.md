# API Design Standards Document
## Unisoft Loan Management System (ULMS) v2.0

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document ID** | ULMS-ARCH-1.2.1 |
| **Document Title** | API Design Standards Document |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 5, 2026 |
| **Prepared By** | Lead Developer |
| **Reviewed By** | Technical Architect, Project Manager |
| **Classification** | Confidential - Internal Use |
| **Status** | Approved |

**Revision History**

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | Lead Developer | Initial comprehensive API design standards |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [API Design Philosophy](#2-api-design-philosophy)
3. [RESTful API Principles](#3-restful-api-principles)
4. [URL Design Standards](#4-url-design-standards)
5. [HTTP Methods & Status Codes](#5-http-methods--status-codes)
6. [Request & Response Standards](#6-request--response-standards)
7. [Data Type Standards](#7-data-type-standards)
8. [Pagination, Filtering & Sorting](#8-pagination-filtering--sorting)
9. [Error Handling Standards](#9-error-handling-standards)
10. [Security Standards](#10-security-standards)
11. [Documentation Standards](#11-documentation-standards)
12. [API Governance](#12-api-governance)
13. [ULMS API Catalog](#13-ulms-api-catalog)
14. [Compliance Matrix](#14-compliance-matrix)

---

## 1. Executive Summary

### 1.1 Purpose

This document establishes comprehensive API design standards for the Unisoft Loan Management System (ULMS) v2.0. These standards ensure consistency, maintainability, and interoperability across all 180+ API endpoints spanning 8 microservices.

### 1.2 Scope

These standards apply to:
- All ULMS REST APIs
- Apache Fineract Core API extensions
- Custom microservice APIs (CIB, NID, Workflow, Document, BRPD, Notification, Analytics, Integration Gateway)
- Partner integration APIs
- Mobile application APIs

### 1.3 Alignment with Requirements

| Requirement Document | Section | Compliance |
|---------------------|---------|------------|
| RFP LMS-BD-2026-001 | Section 9 - API-first architecture | Full Compliance |
| BRD v1.0 | Section 8.3 - API Architecture | Full Compliance |
| SRS v2.0 | Section 5.1 - API Specifications | Full Compliance |
| Technology Stack v2.0 | Section 2.3 - Kong API Gateway | Full Compliance |

### 1.4 API Inventory Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ULMS API ARCHITECTURE OVERVIEW                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    TOTAL APIs: 180+ ENDPOINTS                          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐            │
│  │ Fineract Core    │ │ Loan Service     │ │ Credit Service   │            │
│  │ 50+ endpoints    │ │ 30+ endpoints    │ │ 25+ endpoints    │            │
│  │ /fineract/*      │ │ /api/v1/loans    │ │ /api/v1/credit   │            │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘            │
│                                                                              │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐            │
│  │ CIB Service      │ │ Workflow Service │ │ Document Service │            │
│  │ 15+ endpoints    │ │ 20+ endpoints    │ │ 15+ endpoints    │            │
│  │ /api/v1/cib      │ │ /api/v1/workflows│ │ /api/v1/documents│            │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘            │
│                                                                              │
│  ┌──────────────────┐ ┌──────────────────┐                                 │
│  │ Notification Svc │ │ Admin Service    │                                 │
│  │ 10+ endpoints    │ │ 15+ endpoints    │                                 │
│  │ /api/v1/notify   │ │ /api/v1/admin    │                                 │
│  └──────────────────┘ └──────────────────┘                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. API Design Philosophy

### 2.1 Core Principles

| Principle | Description | Rationale |
|-----------|-------------|-----------|
| **API-First** | Design APIs before implementation | Ensures contract stability |
| **Consumer-Centric** | Design for API consumers | Improves developer experience |
| **Consistency** | Uniform patterns across all APIs | Reduces learning curve |
| **Simplicity** | Keep APIs intuitive | Easier adoption and maintenance |
| **Evolvability** | Design for change | Future-proof architecture |

### 2.2 Design Guidelines

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API DESIGN DECISION TREE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Is this a resource operation?                                              │
│  ├── YES → Use standard REST verbs (GET, POST, PUT, PATCH, DELETE)         │
│  └── NO → Is it an action on a resource?                                   │
│       ├── YES → Use POST /resources/{id}/action                            │
│       └── NO → Is it a query-only operation?                               │
│            ├── YES → Use GET with query parameters                         │
│            └── NO → Use POST with custom endpoint                          │
│                                                                              │
│  Is the operation idempotent?                                               │
│  ├── YES → Use PUT for full replacement, PATCH for partial update          │
│  └── NO → Use POST                                                         │
│                                                                              │
│  Does it return data?                                                       │
│  ├── YES → Return 200 OK with data                                         │
│  └── NO → Return 204 No Content                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Bangladesh Banking Context

Special considerations for Bangladesh banking sector:

| Consideration | Implementation |
|--------------|----------------|
| **Bengali Language** | Support Bengali text in all string fields (UTF-8) |
| **NID Format** | Support both 13-digit and 17-digit NID formats |
| **Currency** | Use BDT (ISO 4217) as default currency code |
| **Date/Time** | UTC timestamps with BST (UTC+6) conversion support |
| **Regulatory IDs** | Support CIB Subject Code, BEFTN codes, etc. |

---

## 3. RESTful API Principles

### 3.1 REST Constraints

| Constraint | ULMS Implementation |
|------------|---------------------|
| **Client-Server** | Clear separation between React frontend and Spring Boot backend |
| **Stateless** | JWT tokens for authentication; no server-side sessions |
| **Cacheable** | Redis caching with ETags for GET responses |
| **Uniform Interface** | Consistent URL patterns, HTTP methods, and response formats |
| **Layered System** | Kong API Gateway abstracts backend services |
| **Code on Demand** | Optional JavaScript for dynamic UI components |

### 3.2 Resource Modeling

#### 3.2.1 Resource Identification

```
Primary Resources:
┌─────────────────────────────────────────────────────────────────────────────┐
│ Resource         │ URI Pattern              │ Description                   │
├──────────────────┼──────────────────────────┼───────────────────────────────┤
│ Customers        │ /api/v1/customers        │ Bank customers (borrowers)    │
│ Loans            │ /api/v1/loans            │ Loan accounts                 │
│ Applications     │ /api/v1/loan-applications│ Loan applications             │
│ Documents        │ /api/v1/documents        │ Uploaded documents            │
│ Workflows        │ /api/v1/workflows        │ Approval workflows            │
│ CIB Inquiries    │ /api/v1/cib/inquiries    │ Credit bureau inquiries       │
│ Classifications  │ /api/v1/classifications  │ BRPD loan classifications     │
│ Payments         │ /api/v1/payments         │ Loan payments                 │
│ Branches         │ /api/v1/branches         │ Bank branches                 │
│ Products         │ /api/v1/loan-products    │ Loan products                 │
└─────────────────────────────────────────────────────────────────────────────┘

Nested Resources:
┌─────────────────────────────────────────────────────────────────────────────┐
│ /api/v1/customers/{customerId}/loans          │ Loans for a customer        │
│ /api/v1/loans/{loanId}/documents              │ Documents for a loan        │
│ /api/v1/loans/{loanId}/payments               │ Payments for a loan         │
│ /api/v1/loans/{loanId}/schedules              │ Repayment schedule          │
│ /api/v1/branches/{branchId}/applications      │ Applications by branch      │
│ /api/v1/workflows/{workflowId}/tasks          │ Tasks in a workflow         │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 3.2.2 Resource Relationships

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ULMS RESOURCE RELATIONSHIPS                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                          ┌──────────────┐                                   │
│                          │   Customer   │                                   │
│                          └──────┬───────┘                                   │
│                    ┌────────────┼────────────┐                              │
│                    ▼            ▼            ▼                              │
│            ┌───────────┐ ┌───────────┐ ┌───────────┐                       │
│            │Application│ │    Loan   │ │ CIB Report│                       │
│            └─────┬─────┘ └─────┬─────┘ └───────────┘                       │
│                  │             │                                            │
│        ┌─────────┼─────────┐   │                                            │
│        ▼         ▼         ▼   │                                            │
│  ┌──────────┐ ┌────────┐ ┌────┴────┐                                       │
│  │ Workflow │ │Document│ │ Payment │                                       │
│  └────┬─────┘ └────────┘ └─────────┘                                       │
│       │                                                                     │
│       ▼                                                                     │
│  ┌──────────┐                                                               │
│  │   Task   │                                                               │
│  └──────────┘                                                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 HATEOAS Implementation

```json
{
  "data": {
    "id": "LOAN-2026-000123",
    "status": "APPROVED",
    "requestedAmount": 500000.00
  },
  "_links": {
    "self": {
      "href": "/api/v1/loans/LOAN-2026-000123"
    },
    "customer": {
      "href": "/api/v1/customers/CUST-2026-001234"
    },
    "documents": {
      "href": "/api/v1/loans/LOAN-2026-000123/documents"
    },
    "approve": {
      "href": "/api/v1/loans/LOAN-2026-000123/approve",
      "method": "POST"
    },
    "disburse": {
      "href": "/api/v1/loans/LOAN-2026-000123/disburse",
      "method": "POST"
    }
  }
}
```

---

## 4. URL Design Standards

### 4.1 Base URL Structure

```
Production:    https://api.ulms.unisoft.com.bd/api/{version}/{resource}
Staging:       https://staging-api.ulms.unisoft.com.bd/api/{version}/{resource}
Development:   https://dev-api.ulms.unisoft.com.bd/api/{version}/{resource}
Local:         http://localhost:8080/api/{version}/{resource}
```

### 4.2 URL Naming Conventions

| Rule | Correct Example | Incorrect Example |
|------|-----------------|-------------------|
| Use lowercase | `/loans` | `/Loans`, `/LOANS` |
| Use hyphens for multi-word | `/loan-applications` | `/loan_applications`, `/loanApplications` |
| Use plural nouns | `/customers` | `/customer` |
| No trailing slash | `/loans` | `/loans/` |
| No file extensions | `/loans/123` | `/loans/123.json` |
| No verbs in URL | `/loans` | `/getLoans`, `/createLoan` |
| Use path for hierarchy | `/customers/{id}/loans` | `/customer-loans?customerId=` |

### 4.3 Path Parameters

```yaml
# Resource identifier
GET /api/v1/loans/{loanId}

# Nested resources
GET /api/v1/customers/{customerId}/loans/{loanId}

# Parameter naming: camelCase
GET /api/v1/loans/{loanId}/documents/{documentId}

# ID Format Standards:
# - loanId: LOAN-{YEAR}-{SEQUENCE} (e.g., LOAN-2026-000123)
# - customerId: CUST-{YEAR}-{SEQUENCE} (e.g., CUST-2026-001234)
# - applicationId: APP-{YEAR}-{SEQUENCE} (e.g., APP-2026-000456)
# - branchId: BR-{CODE} (e.g., BR-DHK-001)
```

### 4.4 Query Parameters

```yaml
# Filtering
GET /api/v1/loans?status=ACTIVE&branchId=BR-DHK-001

# Pagination
GET /api/v1/loans?page=0&size=20

# Sorting
GET /api/v1/loans?sort=createdAt,desc

# Searching
GET /api/v1/customers?search=rahman

# Date range
GET /api/v1/loans?fromDate=2026-01-01&toDate=2026-01-31

# Multiple values
GET /api/v1/loans?status=ACTIVE,PENDING&branchId=BR-DHK-001,BR-CTG-001

# Complex filtering
GET /api/v1/loans?amountMin=100000&amountMax=500000&classification=STD
```

### 4.5 Resource Actions

For operations that don't fit standard CRUD, use action sub-resources:

```yaml
# Loan lifecycle actions
POST /api/v1/loans/{loanId}/submit           # Submit for review
POST /api/v1/loans/{loanId}/approve          # Approve loan
POST /api/v1/loans/{loanId}/reject           # Reject loan
POST /api/v1/loans/{loanId}/disburse         # Disburse loan
POST /api/v1/loans/{loanId}/reschedule       # Reschedule loan

# Workflow actions
POST /api/v1/workflows/{workflowId}/tasks/{taskId}/complete
POST /api/v1/workflows/{workflowId}/tasks/{taskId}/reassign

# Customer actions
POST /api/v1/customers/{customerId}/verify-nid
POST /api/v1/customers/{customerId}/cib-inquiry

# Batch operations
POST /api/v1/loans/batch/classify            # Batch classification
POST /api/v1/notifications/batch/send        # Batch send notifications
```

---

## 5. HTTP Methods & Status Codes

### 5.1 HTTP Methods

| Method | Usage | Request Body | Response Body | Idempotent | Safe |
|--------|-------|--------------|---------------|------------|------|
| GET | Retrieve resource(s) | No | Yes | Yes | Yes |
| POST | Create resource / Action | Yes | Yes | No | No |
| PUT | Full resource replacement | Yes | Yes | Yes | No |
| PATCH | Partial resource update | Yes | Yes | Yes | No |
| DELETE | Remove resource | No | No/Yes | Yes | No |
| HEAD | Get headers only | No | No | Yes | Yes |
| OPTIONS | Get allowed methods | No | Yes | Yes | Yes |

### 5.2 Method Usage Examples

```http
# GET - Retrieve resources
GET /api/v1/loans                           # List all loans
GET /api/v1/loans/LOAN-2026-000123          # Get single loan
GET /api/v1/loans?status=ACTIVE             # Filtered list

# POST - Create resources
POST /api/v1/loans                          # Create new loan application
{
  "customerId": "CUST-2026-001234",
  "productId": "PROD-PL-001",
  "requestedAmount": 500000.00
}

# PUT - Full replacement
PUT /api/v1/loans/LOAN-2026-000123          # Replace entire loan data
{
  "customerId": "CUST-2026-001234",
  "productId": "PROD-PL-001",
  "requestedAmount": 600000.00,
  "tenure": 48
}

# PATCH - Partial update
PATCH /api/v1/loans/LOAN-2026-000123        # Update specific fields
{
  "requestedAmount": 550000.00
}

# DELETE - Remove resources
DELETE /api/v1/loans/LOAN-2026-000123/documents/DOC-001
```

### 5.3 HTTP Status Codes

#### 5.3.1 Success Codes (2xx)

| Code | Name | Usage | Example |
|------|------|-------|---------|
| 200 | OK | Successful GET, PUT, PATCH | Loan details retrieved |
| 201 | Created | Successful POST creating resource | New loan application created |
| 202 | Accepted | Async operation started | CIB inquiry submitted |
| 204 | No Content | Successful DELETE | Document deleted |

#### 5.3.2 Client Error Codes (4xx)

| Code | Name | Usage | Example |
|------|------|-------|---------|
| 400 | Bad Request | Malformed request | Invalid JSON syntax |
| 401 | Unauthorized | Missing/invalid authentication | No JWT token |
| 403 | Forbidden | Authenticated but not authorized | Wrong role |
| 404 | Not Found | Resource doesn't exist | Loan ID not found |
| 405 | Method Not Allowed | Wrong HTTP method | POST on /loans/{id} |
| 409 | Conflict | State conflict | Duplicate NID |
| 415 | Unsupported Media Type | Wrong content type | XML instead of JSON |
| 422 | Unprocessable Entity | Business validation failed | DBR exceeds limit |
| 429 | Too Many Requests | Rate limit exceeded | API throttled |

#### 5.3.3 Server Error Codes (5xx)

| Code | Name | Usage | Example |
|------|------|-------|---------|
| 500 | Internal Server Error | Unexpected error | Unhandled exception |
| 502 | Bad Gateway | Upstream error | CIB API down |
| 503 | Service Unavailable | Service down | Maintenance |
| 504 | Gateway Timeout | Upstream timeout | CIB response slow |

### 5.4 Status Code Decision Matrix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     STATUS CODE DECISION FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Request received                                                            │
│       │                                                                      │
│       ▼                                                                      │
│  Is request well-formed (valid JSON, etc.)?                                 │
│  ├── NO → 400 Bad Request                                                   │
│  └── YES                                                                    │
│       │                                                                      │
│       ▼                                                                      │
│  Is authentication token present and valid?                                 │
│  ├── NO → 401 Unauthorized                                                  │
│  └── YES                                                                    │
│       │                                                                      │
│       ▼                                                                      │
│  Does user have required permissions?                                       │
│  ├── NO → 403 Forbidden                                                     │
│  └── YES                                                                    │
│       │                                                                      │
│       ▼                                                                      │
│  Does requested resource exist?                                             │
│  ├── NO → 404 Not Found                                                     │
│  └── YES                                                                    │
│       │                                                                      │
│       ▼                                                                      │
│  Do business rules pass?                                                    │
│  ├── NO → 422 Unprocessable Entity                                          │
│  └── YES                                                                    │
│       │                                                                      │
│       ▼                                                                      │
│  Is processing successful?                                                  │
│  ├── NO → 500 Internal Server Error                                         │
│  └── YES → Return 2xx (200/201/202/204)                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Request & Response Standards

### 6.1 Content Types

```http
Content-Type: application/json
Accept: application/json
Accept-Language: en-US, bn-BD
```

### 6.2 Request Headers

| Header | Required | Description | Example |
|--------|----------|-------------|---------|
| `Authorization` | Yes | JWT Bearer token | `Bearer eyJhbGciOiJSUzI1...` |
| `Content-Type` | Yes (POST/PUT/PATCH) | Request body format | `application/json` |
| `Accept` | No | Response format | `application/json` |
| `X-Tenant-ID` | Yes | Bank/tenant identifier | `BANK_001` |
| `X-Branch-ID` | No | Branch identifier | `BR-DHK-001` |
| `X-Request-ID` | Recommended | Unique request ID | `uuid-string` |
| `X-Correlation-ID` | Recommended | Correlation ID for tracing | `uuid-string` |
| `Accept-Language` | No | Preferred language | `bn-BD` |

### 6.3 Request Body Format

```json
{
  "customerId": "CUST-2026-001234",
  "productId": "PROD-PL-001",
  "requestedAmount": 500000.00,
  "tenure": 36,
  "purpose": "Home renovation",
  "remarks": "Customer has good credit history",
  "collaterals": [
    {
      "type": "PROPERTY",
      "description": "Land at Mirpur",
      "estimatedValue": 2000000.00
    }
  ],
  "guarantors": [
    {
      "nid": "1234567890123",
      "name": "MD. KARIM UDDIN",
      "relationship": "BROTHER"
    }
  ]
}
```

### 6.4 Response Body Format

#### 6.4.1 Single Resource Response

```json
{
  "data": {
    "id": "LOAN-2026-000123",
    "customerId": "CUST-2026-001234",
    "productId": "PROD-PL-001",
    "productName": "Personal Loan",
    "requestedAmount": 500000.00,
    "approvedAmount": 450000.00,
    "interestRate": 12.50,
    "tenure": 36,
    "emiAmount": 15040.50,
    "status": "APPROVED",
    "classification": "STD",
    "branchId": "BR-DHK-001",
    "branchName": "Dhaka Main Branch",
    "createdAt": "2026-02-04T10:30:00Z",
    "updatedAt": "2026-02-05T14:45:00Z",
    "createdBy": "user123",
    "updatedBy": "approver456"
  },
  "_links": {
    "self": {
      "href": "/api/v1/loans/LOAN-2026-000123"
    },
    "customer": {
      "href": "/api/v1/customers/CUST-2026-001234"
    },
    "documents": {
      "href": "/api/v1/loans/LOAN-2026-000123/documents"
    },
    "payments": {
      "href": "/api/v1/loans/LOAN-2026-000123/payments"
    }
  }
}
```

#### 6.4.2 Collection Response

```json
{
  "data": [
    {
      "id": "LOAN-2026-000123",
      "customerId": "CUST-2026-001234",
      "status": "APPROVED",
      "requestedAmount": 500000.00
    },
    {
      "id": "LOAN-2026-000124",
      "customerId": "CUST-2026-001235",
      "status": "PENDING",
      "requestedAmount": 750000.00
    }
  ],
  "pagination": {
    "page": 0,
    "size": 20,
    "totalElements": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrevious": false,
    "isFirst": true,
    "isLast": false
  },
  "_links": {
    "self": {
      "href": "/api/v1/loans?page=0&size=20"
    },
    "next": {
      "href": "/api/v1/loans?page=1&size=20"
    },
    "last": {
      "href": "/api/v1/loans?page=7&size=20"
    }
  }
}
```

### 6.5 Response Headers

```http
HTTP/1.1 200 OK
Content-Type: application/json
X-Request-ID: abc123-def456-ghi789
X-Correlation-ID: xyz789-uvw456-rst123
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1707001000
ETag: "a1b2c3d4e5f6"
Cache-Control: private, max-age=300
```

---

## 7. Data Type Standards

### 7.1 Field Naming Conventions

| Rule | Example | Avoid |
|------|---------|-------|
| Use camelCase | `customerId` | `customer_id`, `CustomerID` |
| Boolean prefix is/has/can | `isActive`, `hasDocuments` | `active`, `documentsExist` |
| Date suffix with At | `createdAt`, `approvedAt` | `createDate`, `approved_time` |
| Amount suffix with Amount | `requestedAmount` | `requested_amt`, `amount_requested` |
| Count suffix with Count | `documentCount` | `docNo`, `numberOfDocs` |

### 7.2 Data Type Specifications

| Type | JSON Type | Format | Example |
|------|-----------|--------|---------|
| ID | string | Custom format | `"LOAN-2026-000123"` |
| Date | string | ISO 8601 | `"2026-02-04"` |
| DateTime | string | ISO 8601 UTC | `"2026-02-04T10:30:00Z"` |
| Money | number | Decimal (2 places) | `500000.00` |
| Percentage | number | Decimal (2 places) | `12.50` |
| Boolean | boolean | true/false | `true` |
| Enum | string | UPPER_SNAKE_CASE | `"APPROVED"` |
| NID | string | 13 or 17 digits | `"1234567890123"` |
| Phone | string | E.164 format | `"+8801712345678"` |
| Email | string | Email format | `"user@example.com"` |

### 7.3 Currency and Amount Handling

```json
{
  "requestedAmount": 500000.00,
  "approvedAmount": 450000.00,
  "currency": "BDT",
  "breakdown": {
    "principal": 450000.00,
    "interest": 81459.00,
    "processingFee": 4500.00,
    "totalPayable": 535959.00
  }
}
```

### 7.4 Date and Time Handling

```json
{
  "applicationDate": "2026-02-04",
  "createdAt": "2026-02-04T10:30:00Z",
  "approvedAt": "2026-02-05T14:45:00+06:00",
  "firstEmiDate": "2026-03-05",
  "maturityDate": "2029-02-05"
}
```

### 7.5 Null Handling

```json
// Option 1: Explicit null (preferred for optional fields)
{
  "id": "LOAN-2026-000123",
  "approvedAmount": null,
  "disbursedAt": null
}

// Option 2: Omit null fields (for large responses)
{
  "id": "LOAN-2026-000123"
}
```

### 7.6 Enum Values

```json
// Loan Status
["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED",
 "DISBURSED", "ACTIVE", "CLOSED", "WRITTEN_OFF"]

// Classification (BRPD 15/2024)
["STD_0", "STD_1", "STD_2", "SMA", "SS", "DF", "BL"]

// Document Types
["NID", "TIN", "PHOTO", "INCOME_PROOF", "BANK_STATEMENT",
 "PROPERTY_DEED", "TRADE_LICENSE", "FINANCIAL_STATEMENT"]

// Approval Actions
["APPROVE", "REJECT", "RETURN", "ESCALATE", "DEFER"]
```

---

## 8. Pagination, Filtering & Sorting

### 8.1 Pagination Parameters

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | integer | 0 | - | Page number (0-indexed) |
| `size` | integer | 20 | 100 | Items per page |

```http
GET /api/v1/loans?page=0&size=20
GET /api/v1/loans?page=2&size=50
```

### 8.2 Pagination Response

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
    "isLast": false,
    "numberOfElements": 20
  }
}
```

### 8.3 Filtering

```http
# Single value filter
GET /api/v1/loans?status=ACTIVE

# Multiple values (OR condition)
GET /api/v1/loans?status=ACTIVE,PENDING

# Range filter
GET /api/v1/loans?amountMin=100000&amountMax=500000

# Date range filter
GET /api/v1/loans?createdFrom=2026-01-01&createdTo=2026-01-31

# Text search
GET /api/v1/customers?search=rahman

# Nested field filter
GET /api/v1/loans?customer.branchId=BR-DHK-001

# Combined filters (AND condition)
GET /api/v1/loans?status=ACTIVE&branchId=BR-DHK-001&classification=STD
```

### 8.4 Sorting

```http
# Single field sort
GET /api/v1/loans?sort=createdAt,desc

# Multiple field sort
GET /api/v1/loans?sort=status,asc&sort=createdAt,desc

# Default sort (if not specified)
# Default: createdAt,desc
```

### 8.5 Full Example

```http
GET /api/v1/loans?status=ACTIVE&branchId=BR-DHK-001&amountMin=100000&sort=createdAt,desc&page=0&size=20

Response:
{
  "data": [...],
  "filters": {
    "status": ["ACTIVE"],
    "branchId": "BR-DHK-001",
    "amountMin": 100000
  },
  "sort": [
    {"field": "createdAt", "direction": "desc"}
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

## 9. Error Handling Standards

### 9.1 Error Response Format (RFC 7807)

```json
{
  "type": "https://ulms.unisoft.com.bd/errors/validation-error",
  "title": "Validation Error",
  "status": 422,
  "detail": "One or more validation errors occurred",
  "instance": "/api/v1/loans",
  "timestamp": "2026-02-04T10:30:00Z",
  "traceId": "abc123-def456-ghi789",
  "path": "/api/v1/loans",
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

### 9.2 Error Types

| Error Type URI | HTTP Status | Description |
|---------------|-------------|-------------|
| `/errors/validation-error` | 400, 422 | Input validation failed |
| `/errors/authentication-error` | 401 | Authentication required/failed |
| `/errors/authorization-error` | 403 | Permission denied |
| `/errors/resource-not-found` | 404 | Resource doesn't exist |
| `/errors/method-not-allowed` | 405 | HTTP method not supported |
| `/errors/conflict-error` | 409 | State conflict |
| `/errors/rate-limit-exceeded` | 429 | Too many requests |
| `/errors/internal-error` | 500 | Server error |
| `/errors/service-unavailable` | 502, 503 | Upstream service error |

### 9.3 Domain-Specific Error Codes

#### Loan Errors

| Code | HTTP Status | Message |
|------|-------------|---------|
| `LOAN_NOT_FOUND` | 404 | Loan with ID {id} not found |
| `LOAN_ALREADY_DISBURSED` | 409 | Loan has already been disbursed |
| `LOAN_AMOUNT_EXCEEDS_LIMIT` | 422 | Requested amount exceeds product limit |
| `LOAN_INVALID_STATE` | 422 | Cannot {action} loan in {status} status |
| `LOAN_DBR_EXCEEDED` | 422 | Debt Burden Ratio ({value}%) exceeds maximum ({max}%) |

#### Customer Errors

| Code | HTTP Status | Message |
|------|-------------|---------|
| `CUSTOMER_NOT_FOUND` | 404 | Customer with ID {id} not found |
| `CUSTOMER_NID_INVALID` | 422 | NID must be 13 or 17 digits |
| `CUSTOMER_DUPLICATE_NID` | 409 | Customer with NID {nid} already exists |
| `CUSTOMER_BLACKLISTED` | 422 | Customer is in blacklist |

#### CIB Errors

| Code | HTTP Status | Message |
|------|-------------|---------|
| `CIB_SERVICE_UNAVAILABLE` | 503 | CIB service is temporarily unavailable |
| `CIB_INQUIRY_FAILED` | 502 | CIB inquiry failed: {reason} |
| `CIB_RESPONSE_TIMEOUT` | 504 | CIB response timed out |
| `CIB_INVALID_NID` | 422 | NID not found in CIB database |

### 9.4 Error Response Examples

```json
// 401 Unauthorized
{
  "type": "https://ulms.unisoft.com.bd/errors/authentication-error",
  "title": "Authentication Required",
  "status": 401,
  "detail": "JWT token is missing or invalid",
  "instance": "/api/v1/loans",
  "timestamp": "2026-02-04T10:30:00Z",
  "traceId": "abc123"
}

// 403 Forbidden
{
  "type": "https://ulms.unisoft.com.bd/errors/authorization-error",
  "title": "Access Denied",
  "status": 403,
  "detail": "You don't have permission to approve loans above BDT 10,00,000",
  "instance": "/api/v1/loans/LOAN-2026-000123/approve",
  "timestamp": "2026-02-04T10:30:00Z",
  "traceId": "abc123"
}

// 404 Not Found
{
  "type": "https://ulms.unisoft.com.bd/errors/resource-not-found",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "Loan with ID LOAN-2026-999999 not found",
  "instance": "/api/v1/loans/LOAN-2026-999999",
  "timestamp": "2026-02-04T10:30:00Z",
  "traceId": "abc123"
}

// 422 Business Rule Violation
{
  "type": "https://ulms.unisoft.com.bd/errors/business-rule-violation",
  "title": "Business Rule Violation",
  "status": 422,
  "detail": "Loan approval failed due to business rule violations",
  "instance": "/api/v1/loans/LOAN-2026-000123/approve",
  "timestamp": "2026-02-04T10:30:00Z",
  "traceId": "abc123",
  "errors": [
    {
      "code": "LOAN_DBR_EXCEEDED",
      "message": "Debt Burden Ratio (55%) exceeds maximum (50%)"
    },
    {
      "code": "CIB_SCORE_LOW",
      "message": "CIB score (420) is below minimum (450)"
    }
  ]
}

// 429 Rate Limit Exceeded
{
  "type": "https://ulms.unisoft.com.bd/errors/rate-limit-exceeded",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "You have exceeded the rate limit of 100 requests per minute",
  "instance": "/api/v1/cib/inquiry",
  "timestamp": "2026-02-04T10:30:00Z",
  "traceId": "abc123",
  "retryAfter": 45
}
```

---

## 10. Security Standards

### 10.1 Authentication

#### 10.1.1 OAuth 2.0 / JWT Authentication

```http
GET /api/v1/loans HTTP/1.1
Host: api.ulms.unisoft.com.bd
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 10.1.2 JWT Token Structure

```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "key-id-001"
  },
  "payload": {
    "sub": "user123",
    "iss": "https://auth.ulms.unisoft.com.bd",
    "aud": "ulms-api",
    "exp": 1707000000,
    "iat": 1706998200,
    "roles": ["LOAN_OFFICER", "BRANCH_USER"],
    "permissions": ["LOAN_VIEW", "LOAN_CREATE", "CIB_INQUIRY"],
    "tenantId": "BANK_001",
    "branchId": "BR-DHK-001",
    "approvalLimit": 500000
  }
}
```

#### 10.1.3 Token Configuration

| Parameter | Value |
|-----------|-------|
| Access Token TTL | 30 minutes |
| Refresh Token TTL | 7 days |
| Algorithm | RS256 (RSA + SHA-256) |
| Key Rotation | 90 days |

### 10.2 Authorization (RBAC)

| Role | Permissions |
|------|-------------|
| `BRANCH_USER` | LOAN_VIEW (own branch) |
| `LOAN_OFFICER` | LOAN_VIEW, LOAN_CREATE, LOAN_UPDATE |
| `CREDIT_ANALYST` | LOAN_VIEW, LOAN_ANALYZE, CIB_INQUIRY |
| `BRANCH_MANAGER` | LOAN_VIEW, LOAN_APPROVE (up to limit) |
| `CREDIT_HEAD` | LOAN_VIEW, LOAN_APPROVE (higher limit) |
| `MD` | FULL_ACCESS |
| `ADMIN` | SYSTEM_CONFIG, USER_MANAGEMENT |

### 10.3 Security Headers

```http
# Response Security Headers
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

### 10.4 Rate Limiting

| Endpoint Category | Rate Limit | Reason |
|------------------|------------|--------|
| Standard APIs | 1000/min | Normal operations |
| CIB APIs | 100/min | External API costs |
| Report APIs | 50/min | Heavy computation |
| Admin APIs | 500/min | Administrative tasks |
| Authentication | 10/min | Brute force protection |

```http
# Rate limit headers
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1707001000
```

### 10.5 Input Validation

```java
// Java Bean Validation
public record LoanApplicationRequest(
    @NotNull @Pattern(regexp = "CUST-\\d{4}-\\d{6}")
    String customerId,

    @NotNull @Pattern(regexp = "PROD-[A-Z]{2}-\\d{3}")
    String productId,

    @NotNull @DecimalMin("10000") @DecimalMax("100000000")
    BigDecimal requestedAmount,

    @NotNull @Min(6) @Max(84)
    Integer tenure,

    @NotBlank @Size(max = 500)
    String purpose
) {}
```

### 10.6 Sensitive Data Handling

```json
// Input (full data)
{
  "nid": "1234567890123",
  "accountNumber": "1234567890"
}

// Output (masked)
{
  "nid": "123****0123",
  "accountNumber": "****7890"
}
```

---

## 11. Documentation Standards

### 11.1 OpenAPI 3.0 Requirements

All APIs must have OpenAPI 3.0 documentation including:

- API title and description
- Server URLs for all environments
- Security schemes
- Complete path documentation
- Request/response schemas
- Examples for all operations
- Error response documentation

### 11.2 Code Comments

```java
/**
 * Creates a new loan application.
 *
 * @param request The loan application request containing customer and product details
 * @return The created loan application with assigned ID
 * @throws ValidationException if request validation fails
 * @throws DuplicateResourceException if application already exists
 *
 * @apiNote This endpoint requires LOAN_CREATE permission
 * @see LoanApplicationRequest
 * @see LoanApplicationResponse
 */
@PostMapping
public ResponseEntity<LoanApplicationResponse> createApplication(
    @Valid @RequestBody LoanApplicationRequest request
) {
    // Implementation
}
```

### 11.3 API Changelog

```markdown
## API Changelog

### v1.2.0 (2026-03-01)
- Added: POST /api/v1/loans/{id}/reschedule endpoint
- Added: `rescheduledAt` field to Loan response
- Deprecated: GET /api/v1/loans/pending (use filter instead)

### v1.1.0 (2026-02-15)
- Added: Batch classification endpoint
- Added: `classification` field to Loan response
- Changed: `status` enum added WRITTEN_OFF value

### v1.0.0 (2026-02-01)
- Initial release
```

---

## 12. API Governance

### 12.1 API Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          API LIFECYCLE                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [Design] → [Review] → [Develop] → [Test] → [Deploy] → [Monitor] → [Retire]│
│      │         │          │         │         │           │           │     │
│      ▼         ▼          ▼         ▼         ▼           ▼           ▼     │
│   OpenAPI   Design    Contract   Unit/    Staging      Usage      Sunset   │
│    Spec    Review     Testing   Integ    → Prod      Analytics   Notice    │
│                                 Tests                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 12.2 Breaking Change Policy

| Change Type | Version Impact | Notice Period |
|-------------|---------------|---------------|
| New endpoint | None (additive) | None |
| New optional field | None (additive) | None |
| New required field | Major version | 6 months |
| Remove endpoint | Major version | 6 months |
| Remove field | Major version | 6 months |
| Change field type | Major version | 6 months |

### 12.3 Deprecation Process

```http
# Deprecation headers
HTTP/1.1 200 OK
Deprecation: true
Sunset: Sat, 01 Aug 2026 00:00:00 GMT
Link: </api/v2/loans>; rel="successor-version"
```

### 12.4 API Review Checklist

- [ ] Follows REST principles
- [ ] URL naming conventions applied
- [ ] Proper HTTP methods used
- [ ] Correct status codes returned
- [ ] Request/response format consistent
- [ ] Error handling implemented
- [ ] Security controls in place
- [ ] OpenAPI documentation complete
- [ ] Backward compatibility maintained

---

## 13. ULMS API Catalog

### 13.1 API Services Overview

| Service | Base Path | Endpoints | Description |
|---------|-----------|-----------|-------------|
| **Fineract Core** | `/fineract-provider/api/v1` | 50+ | Core banking operations |
| **Loan Service** | `/api/v1/loans` | 30+ | Loan lifecycle management |
| **Customer Service** | `/api/v1/customers` | 20+ | Customer management |
| **Credit Service** | `/api/v1/credit` | 25+ | Credit analysis |
| **CIB Service** | `/api/v1/cib` | 15+ | CIB integration |
| **Workflow Service** | `/api/v1/workflows` | 20+ | Approval workflows |
| **Document Service** | `/api/v1/documents` | 15+ | Document management |
| **Notification Service** | `/api/v1/notifications` | 10+ | SMS/Email/Push |
| **Report Service** | `/api/v1/reports` | 25+ | Regulatory reports |
| **Admin Service** | `/api/v1/admin` | 15+ | System administration |

### 13.2 Key API Endpoints

```yaml
# Loan Management
POST   /api/v1/loans                           # Create loan application
GET    /api/v1/loans                           # List loans
GET    /api/v1/loans/{id}                      # Get loan details
PATCH  /api/v1/loans/{id}                      # Update loan
POST   /api/v1/loans/{id}/submit               # Submit for review
POST   /api/v1/loans/{id}/approve              # Approve loan
POST   /api/v1/loans/{id}/reject               # Reject loan
POST   /api/v1/loans/{id}/disburse             # Disburse loan

# Customer Management
POST   /api/v1/customers                       # Create customer
GET    /api/v1/customers                       # List customers
GET    /api/v1/customers/{id}                  # Get customer
POST   /api/v1/customers/{id}/verify-nid       # Verify NID
GET    /api/v1/customers/{id}/loans            # Get customer loans

# CIB Integration
POST   /api/v1/cib/inquiry                     # Submit CIB inquiry
GET    /api/v1/cib/inquiries/{id}              # Get inquiry result
GET    /api/v1/cib/reports/{id}                # Get CIB report

# Workflow Management
GET    /api/v1/workflows/pending               # Get pending approvals
POST   /api/v1/workflows/{id}/approve          # Approve workflow task
POST   /api/v1/workflows/{id}/reject           # Reject workflow task
POST   /api/v1/workflows/{id}/escalate         # Escalate task

# Document Management
POST   /api/v1/documents                       # Upload document
GET    /api/v1/documents/{id}                  # Get document
DELETE /api/v1/documents/{id}                  # Delete document
GET    /api/v1/loans/{loanId}/documents        # Get loan documents

# Reports
GET    /api/v1/reports/cl1                     # CL-1 Report
GET    /api/v1/reports/cl2                     # CL-2 Report
GET    /api/v1/reports/portfolio-summary       # Portfolio Summary
GET    /api/v1/reports/branch-performance      # Branch Performance
```

---

## 14. Compliance Matrix

### 14.1 Requirement Traceability

| Requirement ID | Requirement | API Implementation | Status |
|---------------|-------------|-------------------|--------|
| BRD-8.1 | REST API architecture | All services use REST | Compliant |
| BRD-8.2 | OAuth 2.0 authentication | Keycloak + JWT | Compliant |
| SRS-5.1 | OpenAPI 3.0 documentation | All endpoints documented | Compliant |
| RFP-9.1 | API-first design | Design-first approach | Compliant |
| ICT-7.3 | TLS 1.3 encryption | All traffic encrypted | Compliant |
| ICT-7.5 | Rate limiting | Kong rate limiter | Compliant |

### 14.2 Security Compliance

| Security Control | Implementation | ICT Guidelines V4.0 |
|-----------------|----------------|---------------------|
| Authentication | OAuth 2.0 / JWT | Section 7.3.1 |
| Authorization | RBAC with Keycloak | Section 7.3.2 |
| Encryption (Transit) | TLS 1.3 | Section 7.4.1 |
| Rate Limiting | Kong plugin | Section 7.5.2 |
| Input Validation | Bean Validation | Section 7.6.1 |
| Audit Logging | All API calls logged | Section 8.1 |

### 14.3 Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time (95th) | < 500ms | Prometheus metrics |
| Throughput | 500+ req/sec | JMeter testing |
| Concurrent Users | 1000+ | Load testing |
| Error Rate | < 0.1% | Monitoring dashboards |

---

## Appendix A: Quick Reference Card

### HTTP Methods Quick Reference

| Method | CRUD | Idempotent | Safe |
|--------|------|------------|------|
| GET | Read | Yes | Yes |
| POST | Create | No | No |
| PUT | Replace | Yes | No |
| PATCH | Update | Yes | No |
| DELETE | Delete | Yes | No |

### Common Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET/PUT/PATCH |
| 201 | Created | Successful POST (create) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Malformed request |
| 401 | Unauthorized | Auth required |
| 403 | Forbidden | Permission denied |
| 404 | Not Found | Resource not found |
| 422 | Unprocessable | Validation failed |
| 429 | Too Many Requests | Rate limited |
| 500 | Server Error | Unexpected error |

### URL Pattern Quick Reference

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
| Lead Developer | | | |
| Technical Architect | | | |
| Project Manager | | | |
| QA Lead | | | |

---

**Document End**

*ULMS v2.0 - API Design Standards Document v1.0*

*Unisoft Systems Limited - Confidential*

*This document establishes comprehensive API design standards ensuring consistency, maintainability, and compliance across all ULMS v2.0 APIs.*

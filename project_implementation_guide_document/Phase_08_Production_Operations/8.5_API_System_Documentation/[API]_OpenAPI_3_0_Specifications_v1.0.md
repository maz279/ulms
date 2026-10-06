# OpenAPI 3.0 Specifications

## ULMS v2.0 - Interactive API Documentation

---

**Document Control**

| Field | Value |
|-------|-------|
| Document ID | ULMS-API-OAS-001 |
| Version | 1.0 |
| Status | Final |
| Classification | Internal - Technical |
| Effective Date | February 2026 |
| Review Cycle | Per Release |
| Owner | API Lead |
| Approver | Technical Lead |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [API Overview](#2-api-overview)
3. [Authentication](#3-authentication)
4. [Core APIs](#4-core-apis)
5. [OpenAPI Specification](#5-openapi-specification)
6. [Code Generation](#6-code-generation)
7. [Appendices](#7-appendices)

---

## 1. Introduction

### 1.1 Purpose
This document provides OpenAPI 3.0 specifications for ULMS v2.0 REST APIs, enabling interactive documentation and client code generation.

### 1.2 API Standards
- OpenAPI 3.0.3
- RESTful design principles
- JSON data format
- OAuth 2.0 / JWT authentication

---

## 2. API Overview

### 2.1 Base URLs

| Environment | Base URL |
|-------------|----------|
| Production | https://api.ulms.bank.com/v1 |
| Staging | https://api-staging.ulms.bank.com/v1 |
| Development | https://api-dev.ulms.bank.com/v1 |

### 2.2 API Categories

| Category | Description | Base Path |
|----------|-------------|-----------|
| Core Banking | Loan and customer management | /loans, /customers |
| Workflow | Approval workflows | /workflows |
| Reporting | Reports and analytics | /reports |
| Integration | External system integration | /integrations |
| Admin | System administration | /admin |

---

## 3. Authentication

### 3.1 OAuth 2.0 Flow

```yaml
securitySchemes:
  OAuth2:
    type: oauth2
    flows:
      password:
        tokenUrl: /auth/token
        scopes:
          read: Read access
          write: Write access
          admin: Administrative access
```

### 3.2 JWT Token

```http
GET /api/v1/loans HTTP/1.1
Host: api.ulms.bank.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldU...
```

---

## 4. Core APIs

### 4.1 Loans API

#### Get All Loans

```yaml
/loans:
  get:
    summary: Get all loans
    description: Retrieve a paginated list of loans with optional filters
    tags:
      - Loans
    parameters:
      - name: page
        in: query
        schema:
          type: integer
          default: 0
      - name: size
        in: query
        schema:
          type: integer
          default: 20
      - name: status
        in: query
        schema:
          type: string
          enum: [PENDING, APPROVED, REJECTED, DISBURSED, CLOSED]
      - name: branchId
        in: query
        schema:
          type: string
          format: uuid
    responses:
      '200':
        description: Successful response
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PagedLoanResponse'
      '401':
        description: Unauthorized
      '403':
        description: Forbidden
```

#### Create Loan Application

```yaml
/loans:
  post:
    summary: Create new loan application
    tags:
      - Loans
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
        description: Invalid request
      '409':
        description: Duplicate application
```

#### Get Loan by ID

```yaml
/loans/{loanId}:
  get:
    summary: Get loan details
    tags:
      - Loans
    parameters:
      - name: loanId
        in: path
        required: true
        schema:
          type: string
          format: uuid
    responses:
      '200':
        description: Loan details retrieved
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoanResponse'
      '404':
        description: Loan not found
```

### 4.2 Customers API

```yaml
/customers:
  get:
    summary: Search customers
    tags:
      - Customers
    parameters:
      - name: nid
        in: query
        schema:
          type: string
          pattern: '^\d{10,17}$'
      - name: phone
        in: query
        schema:
          type: string
      - name: name
        in: query
        schema:
          type: string
    responses:
      '200':
        description: Customer search results
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/CustomerResponse'

  post:
    summary: Create customer
    tags:
      - Customers
    requestBody:
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/CustomerRequest'
    responses:
      '201':
        description: Customer created
```

### 4.3 CIB Integration API

```yaml
/integrations/cib/query:
  post:
    summary: Query Credit Information Bureau
    tags:
      - Integrations
    requestBody:
      content:
        application/json:
          schema:
            type: object
            properties:
              nid:
                type: string
                required: true
              dob:
                type: string
                format: date
    responses:
      '200':
        description: CIB report retrieved
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CIBReportResponse'
      '503':
        description: CIB service unavailable
```

---

## 5. OpenAPI Specification

### 5.1 Complete OpenAPI Document

```yaml
openapi: 3.0.3
info:
  title: ULMS API
  description: Unisoft Loan Management System API
  version: 2.0.0
  contact:
    name: ULMS Support
    email: api-support@uslbd.com
  license:
    name: Proprietary
    url: https://uslbd.com/license

servers:
  - url: https://api.ulms.bank.com/v1
    description: Production
  - url: https://api-staging.ulms.bank.com/v1
    description: Staging

security:
  - OAuth2: [read, write]

paths:
  /auth/token:
    post:
      summary: Get access token
      tags:
        - Authentication
      requestBody:
        content:
          application/x-www-form-urlencoded:
            schema:
              type: object
              properties:
                grant_type:
                  type: string
                  enum: [password]
                username:
                  type: string
                password:
                  type: string
                scope:
                  type: string
      responses:
        '200':
          description: Token issued
          content:
            application/json:
              schema:
                type: object
                properties:
                  access_token:
                    type: string
                  token_type:
                    type: string
                  expires_in:
                    type: integer
                  refresh_token:
                    type: string

  /loans:
    get:
      summary: List loans
      tags:
        - Loans
      parameters:
        - $ref: '#/components/parameters/PageParam'
        - $ref: '#/components/parameters/SizeParam'
        - name: status
          in: query
          schema:
            type: string
            enum: [PENDING, APPROVED, REJECTED, DISBURSED, CLOSED]
      responses:
        '200':
          $ref: '#/components/responses/LoanListResponse'

    post:
      summary: Create loan
      tags:
        - Loans
      requestBody:
        $ref: '#/components/requestBodies/LoanRequest'
      responses:
        '201':
          $ref: '#/components/responses/LoanResponse'

  /loans/{loanId}:
    parameters:
      - $ref: '#/components/parameters/LoanIdParam'
    get:
      summary: Get loan details
      tags:
        - Loans
      responses:
        '200':
          $ref: '#/components/responses/LoanResponse'
        '404':
          $ref: '#/components/responses/NotFound'

    put:
      summary: Update loan
      tags:
        - Loans
      requestBody:
        $ref: '#/components/requestBodies/LoanRequest'
      responses:
        '200':
          $ref: '#/components/responses/LoanResponse'

    delete:
      summary: Delete loan
      tags:
        - Loans
      responses:
        '204':
          description: Deleted

components:
  securitySchemes:
    OAuth2:
      type: oauth2
      flows:
        password:
          tokenUrl: /auth/token
          scopes:
            read: Read access
            write: Write access
            admin: Administrative access

  schemas:
    LoanResponse:
      type: object
      properties:
        id:
          type: string
          format: uuid
        applicationNumber:
          type: string
        customerId:
          type: string
          format: uuid
        productCode:
          type: string
        amount:
          type: number
          format: decimal
        interestRate:
          type: number
          format: decimal
        termMonths:
          type: integer
        status:
          type: string
          enum: [PENDING, APPROVED, REJECTED, DISBURSED, CLOSED]
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    LoanApplicationRequest:
      type: object
      required:
        - customerId
        - productCode
        - amount
        - termMonths
      properties:
        customerId:
          type: string
          format: uuid
        productCode:
          type: string
          maxLength: 20
        amount:
          type: number
          minimum: 1000
        interestRate:
          type: number
        termMonths:
          type: integer
          minimum: 3
          maximum: 360
        purpose:
          type: string
        collateral:
          $ref: '#/components/schemas/CollateralRequest'

    CustomerResponse:
      type: object
      properties:
        id:
          type: string
          format: uuid
        nid:
          type: string
        name:
          type: string
        phone:
          type: string
        email:
          type: string
          format: email
        address:
          $ref: '#/components/schemas/Address'

    PagedLoanResponse:
      type: object
      properties:
        content:
          type: array
          items:
            $ref: '#/components/schemas/LoanResponse'
        pageable:
          $ref: '#/components/schemas/Pageable'
        totalElements:
          type: integer
        totalPages:
          type: integer

    Pageable:
      type: object
      properties:
        pageNumber:
          type: integer
        pageSize:
          type: integer
        sort:
          type: object

    ErrorResponse:
      type: object
      properties:
        timestamp:
          type: string
          format: date-time
        status:
          type: integer
        error:
          type: string
        message:
          type: string
        path:
          type: string

  parameters:
    LoanIdParam:
      name: loanId
      in: path
      required: true
      schema:
        type: string
        format: uuid

    PageParam:
      name: page
      in: query
      schema:
        type: integer
        default: 0
        minimum: 0

    SizeParam:
      name: size
      in: query
      schema:
        type: integer
        default: 20
        minimum: 1
        maximum: 100

  requestBodies:
    LoanRequest:
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/LoanApplicationRequest'

  responses:
    LoanResponse:
      description: Loan response
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/LoanResponse'

    LoanListResponse:
      description: List of loans
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/PagedLoanResponse'

    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
```

---

## 6. Code Generation

### 6.1 Server Stub Generation

```bash
# Generate Spring Boot server
openapi-generator-cli generate \
  -i ulms-api.yaml \
  -g spring \
  -o ulms-server \
  --library spring-boot \
  -p basePackage=com.unisoft.ulms.api \
  -p apiPackage=com.unisoft.ulms.api.controller \
  -p modelPackage=com.unisoft.ulms.api.model \
  -p configPackage=com.unisoft.ulms.api.config \
  -p dateLibrary=java8 \
  -p useSwaggerUI=true
```

### 6.2 Client SDK Generation

```bash
# Generate TypeScript client for React
openapi-generator-cli generate \
  -i ulms-api.yaml \
  -g typescript-axios \
  -o ulms-client-ts \
  -p npmName=@unisoft/ulms-client \
  -p npmVersion=2.0.0 \
  -p supportsES6=true

# Generate Java client
openapi-generator-cli generate \
  -i ulms-api.yaml \
  -g java \
  -o ulms-client-java \
  -p library=resttemplate
```

---

## 7. Appendices

### Appendix A: API Versioning Strategy

| Version | Status | Sunset Date |
|---------|--------|-------------|
| v1 | Current | - |
| v2 | Planned | - |

### Appendix B: Related Documents

| Document | ID | Location |
|----------|-----|----------|
| API Integration Guide | ULMS-API-INT-001 | 8.5_API_System_Documentation/ |
| Postman Collection | ULMS-API-POST-001 | 8.5_API_System_Documentation/ |
| API Security Guide | ULMS-SEC-API-001 | Security/ |

---

**Document Control Footer**

*Classification: Internal - Technical*
*Next Review: Per Release*
*Owner: API Lead*

**END OF DOCUMENT**

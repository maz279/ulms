# API Integration Guide for Partners

## ULMS v2.0 - Third-Party Integration Guide

---

**Document Control**

| Field | Value |
|-------|-------|
| Document ID | ULMS-API-INT-001 |
| Version | 1.0 |
| Status | Final |
| Classification | External - Partners |
| Effective Date | February 2026 |
| Review Cycle | Per Release |
| Owner | Integration Lead |
| Approver | CTO |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Authentication](#3-authentication)
4. [Core Integration Patterns](#4-core-integration-patterns)
5. [API Endpoints](#5-api-endpoints)
6. [Webhooks](#6-webhooks)
7. [Error Handling](#7-error-handling)
8. [Rate Limits](#8-rate-limits)
9. [SDKs and Tools](#9-sdks-and-tools)
10. [Appendices](#10-appendices)

---

## 1. Introduction

### 1.1 Purpose
This guide helps third-party partners integrate with ULMS v2.0 for:
- Core banking system integration
- Payment gateway integration
- Credit bureau integration
- SMS/Email service integration
- Document management integration

### 1.2 Audience
- Technical architects
- Integration developers
- Solution providers
- Fintech partners

---

## 2. Getting Started

### 2.1 Prerequisites

| Requirement | Details |
|-------------|---------|
| API Access | Contact partner-support@uslbd.com |
| HTTPS Support | TLS 1.2 or higher |
| IP Whitelisting | Provide integration server IPs |
| Testing Environment | Sandbox access provided |

### 2.2 Sandbox Environment

| Environment | URL | Purpose |
|-------------|-----|---------|
| Sandbox API | https://api-sandbox.ulms.bank.com | Development & Testing |
| Sandbox Auth | https://auth-sandbox.ulms.bank.com | Authentication |

### 2.3 Support Channels

| Channel | Contact | Response Time |
|---------|---------|---------------|
| Technical Support | partner-support@uslbd.com | 24 hours |
| Emergency Hotline | +880-XXXXXXXXXX | 4 hours |
| Documentation | https://docs.ulms.bank.com | - |

---

## 3. Authentication

### 3.1 OAuth 2.0 Client Credentials Flow

```
Step 1: Request Token
POST https://auth.ulms.bank.com/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
&scope=read write

Step 2: Use Token
GET https://api.ulms.bank.com/v1/loans
Authorization: Bearer {access_token}
```

### 3.2 Token Response

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldU...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "read write"
}
```

### 3.3 JWT Token Structure

```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "iss": "https://auth.ulms.bank.com",
    "sub": "partner-id",
    "aud": "ulms-api",
    "exp": 1704067200,
    "iat": 1704063600,
    "scope": "read write",
    "client_id": "your-client-id"
  }
}
```

---

## 4. Core Integration Patterns

### 4.1 Synchronous Request-Response

Use for: Real-time queries, immediate responses

```javascript
// Example: Check loan status
async function getLoanStatus(loanId) {
  const response = await fetch(
    `https://api.ulms.bank.com/v1/loans/${loanId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  return await response.json();
}
```

### 4.2 Asynchronous Webhook Pattern

Use for: Long-running processes, event notifications

```javascript
// 1. Register webhook
POST /v1/webhooks
{
  "url": "https://your-domain.com/webhooks/ulms",
  "events": ["loan.approved", "loan.disbursed", "repayment.received"],
  "secret": "your-webhook-secret"
}

// 2. Receive webhook
app.post('/webhooks/ulms', (req, res) => {
  // Verify signature
  const signature = req.headers['x-ulms-signature'];
  const payload = JSON.stringify(req.body);
  
  if (!verifySignature(signature, payload, webhookSecret)) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process event
  const event = req.body;
  console.log(`Received ${event.type}:`, event.data);
  
  // Acknowledge receipt
  res.status(200).send('OK');
});
```

### 4.3 Batch Processing Pattern

Use for: Bulk data operations

```javascript
// Upload batch file
POST /v1/batches
Content-Type: multipart/form-data

file: repayment-batch-20240115.csv
format: CSV
callbackUrl: https://your-domain.com/batch-callback

// Check batch status
GET /v1/batches/{batchId}

Response:
{
  "id": "batch-12345",
  "status": "PROCESSING",
  "totalRecords": 1000,
  "processedRecords": 750,
  "failedRecords": 2,
  "errors": [
    {
      "row": 234,
      "error": "Invalid account number"
    }
  ]
}
```

---

## 5. API Endpoints

### 5.1 Loan Management

#### Create Loan Application

```http
POST /v1/loans
Authorization: Bearer {token}
Content-Type: application/json

{
  "customer": {
    "nid": "1234567890123",
    "name": "John Doe",
    "phone": "+8801712345678",
    "email": "john@example.com",
    "dateOfBirth": "1990-01-15",
    "address": {
      "street": "123 Main St",
      "city": "Dhaka",
      "postalCode": "1200"
    }
  },
  "loanDetails": {
    "productCode": "PERSONAL-001",
    "amount": 500000,
    "termMonths": 36,
    "purpose": "Home renovation",
    "interestRate": 12.5
  },
  "collateral": {
    "type": "PROPERTY",
    "description": "Residential property",
    "value": 1000000
  },
  "documents": [
    {
      "type": "NID",
      "fileUrl": "https://your-storage.com/nid.pdf"
    }
  ]
}

Response: 201 Created
{
  "loanId": "550e8400-e29b-41d4-a716-446655440000",
  "applicationNumber": "APP-2024-0001234",
  "status": "PENDING",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### Get Loan Details

```http
GET /v1/loans/{loanId}
Authorization: Bearer {token}

Response: 200 OK
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "applicationNumber": "APP-2024-0001234",
  "customer": {
    "id": "cust-12345",
    "name": "John Doe",
    "nid": "1234567890123"
  },
  "amount": 500000,
  "interestRate": 12.5,
  "termMonths": 36,
  "status": "APPROVED",
  "outstandingBalance": 450000,
  "nextDueDate": "2024-02-15",
  "installmentAmount": 16667,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### 5.2 Repayment Processing

#### Record Repayment

```http
POST /v1/loans/{loanId}/repayments
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 16667,
  "paymentDate": "2024-01-15",
  "paymentMethod": "BANK_TRANSFER",
  "referenceNumber": "TXN-123456789",
  "remarks": "Monthly installment"
}

Response: 201 Created
{
  "repaymentId": "rep-12345",
  "loanId": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 16667,
  "principal": 15000,
  "interest": 1667,
  "outstandingAfter": 435000,
  "status": "POSTED",
  "postedAt": "2024-01-15T11:00:00Z"
}
```

### 5.3 Credit Bureau Integration

#### Query CIB Report

```http
POST /v1/integrations/cib/query
Authorization: Bearer {token}
Content-Type: application/json

{
  "nid": "1234567890123",
  "dateOfBirth": "1990-01-15",
  "purpose": "LOAN_APPLICATION"
}

Response: 200 OK
{
  "cibId": "CIB-12345678",
  "reportDate": "2024-01-15",
  "creditScore": 750,
  "facilitySummary": {
    "totalFacilities": 3,
    "totalOutstanding": 250000,
    "totalLimit": 500000,
    "totalEMI": 15000
  },
  "facilities": [
    {
      "type": "PERSONAL_LOAN",
      "lender": "Bank A",
      "limit": 200000,
      "outstanding": 150000,
      "emi": 10000,
      "status": "ACTIVE"
    }
  ],
  "inquiries": [
    {
      "date": "2024-01-10",
      "lender": "Bank B",
      "purpose": "CREDIT_CARD"
    }
  ]
}
```

---

## 6. Webhooks

### 6.1 Available Events

| Event | Description | Payload |
|-------|-------------|---------|
| loan.created | New loan application | Loan details |
| loan.submitted | Loan submitted for approval | Loan + Status |
| loan.approved | Loan approved | Loan + Approval details |
| loan.rejected | Loan rejected | Loan + Rejection reason |
| loan.disbursed | Loan amount disbursed | Loan + Disbursement details |
| repayment.received | Repayment recorded | Repayment details |
| repayment.failed | Repayment failed | Failure reason |
| customer.updated | Customer information updated | Customer details |

### 6.2 Webhook Payload Structure

```json
{
  "id": "evt-1234567890",
  "type": "loan.approved",
  "created": 1705312800,
  "data": {
    "loanId": "550e8400-e29b-41d4-a716-446655440000",
    "applicationNumber": "APP-2024-0001234",
    "customerId": "cust-12345",
    "amount": 500000,
    "status": "APPROVED",
    "approvedBy": "manager@bank.com",
    "approvedAt": "2024-01-15T14:30:00Z",
    "approvalNotes": "Good credit history"
  }
}
```

### 6.3 Signature Verification

```python
import hmac
import hashlib

def verify_webhook_signature(payload, signature, secret):
    """
    Verify webhook signature from ULMS
    """
    expected = hmac.new(
        secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(f"sha256={expected}", signature)

# Usage
signature = request.headers.get('X-ULMS-Signature')
payload = request.body
secret = 'your-webhook-secret'

if verify_webhook_signature(payload, signature, secret):
    process_webhook(json.loads(payload))
else:
    raise ValueError("Invalid signature")
```

---

## 7. Error Handling

### 7.1 Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "customer.nid",
        "message": "NID must be 13 or 17 digits"
      }
    ],
    "requestId": "req-550e8400-e29b",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### 7.2 Error Codes

| Code | HTTP Status | Description | Resolution |
|------|-------------|-------------|------------|
| INVALID_REQUEST | 400 | Malformed request | Check request format |
| VALIDATION_ERROR | 400 | Validation failed | Check field requirements |
| UNAUTHORIZED | 401 | Invalid credentials | Refresh token |
| FORBIDDEN | 403 | Insufficient permissions | Check scopes |
| NOT_FOUND | 404 | Resource not found | Verify IDs |
| RATE_LIMITED | 429 | Too many requests | Implement backoff |
| INTERNAL_ERROR | 500 | Server error | Retry or contact support |
| SERVICE_UNAVAILABLE | 503 | Service down | Retry later |

### 7.3 Retry Strategy

```javascript
async function callAPIWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await sleep(delay);
        continue;
      }
      
      if (response.status >= 500) {
        const delay = Math.pow(2, i) * 1000;
        await sleep(delay);
        continue;
      }
      
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

---

## 8. Rate Limits

### 8.1 Rate Limit Tiers

| Tier | Requests/Minute | Burst | Use Case |
|------|-----------------|-------|----------|
| Standard | 100 | 150 | Standard integration |
| Premium | 500 | 750 | High-volume partners |
| Enterprise | 2000 | 3000 | Core banking partners |

### 8.2 Rate Limit Headers

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1705316400
X-RateLimit-Retry-After: 45
```

---

## 9. SDKs and Tools

### 9.1 Official SDKs

| Language | Package | Installation |
|----------|---------|--------------|
| JavaScript | @unisoft/ulms-js | `npm install @unisoft/ulms-js` |
| Python | unisoft-ulms | `pip install unisoft-ulms` |
| Java | com.unisoft:ulms-client | Maven dependency |
| PHP | unisoft/ulms-php | `composer require unisoft/ulms-php` |

### 9.2 JavaScript SDK Example

```javascript
import { ULMSClient } from '@unisoft/ulms-js';

const client = new ULMSClient({
  baseURL: 'https://api.ulms.bank.com',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret'
});

// Create loan
const loan = await client.loans.create({
  customer: {
    nid: '1234567890123',
    name: 'John Doe',
    phone: '+8801712345678'
  },
  loanDetails: {
    productCode: 'PERSONAL-001',
    amount: 500000,
    termMonths: 36
  }
});

// Listen to webhooks
client.webhooks.on('loan.approved', (event) => {
  console.log('Loan approved:', event.data.loanId);
});
```

---

## 10. Appendices

### Appendix A: Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-01 | Initial release |

### Appendix B: Related Documents

| Document | Location |
|----------|----------|
| OpenAPI Specifications | [OPS]_OpenAPI_3_0_Specifications_v1.0.md |
| Postman Collection | [OPS]_Postman_Collection_v1.0.json |
| API Security Guide | Security/ |

---

**Document Control Footer**

*Classification: External - Partners*
*Next Review: Per Release*
*Owner: Integration Lead*

**END OF DOCUMENT**

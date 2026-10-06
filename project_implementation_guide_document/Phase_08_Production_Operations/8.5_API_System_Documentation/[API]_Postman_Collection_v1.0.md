# Postman Collection

## ULMS v2.0 - API Testing Collection

---

**Document Control**

| Field | Value |
|-------|-------|
| Document ID | ULMS-API-POST-001 |
| Version | 1.0 |
| Status | Final |
| Classification | Internal - Technical |
| Effective Date | February 2026 |
| Review Cycle | Per Release |
| Owner | QA Lead |
| Approver | Technical Lead |

---

## 1. Introduction

### 1.1 Purpose
This document describes the Postman collection for ULMS v2.0 API testing and provides instructions for importing and using the collection.

### 1.2 Collection Contents

| Category | Requests | Description |
|----------|----------|-------------|
| Authentication | 3 | Login, token refresh, logout |
| Loans | 12 | CRUD operations for loans |
| Customers | 8 | Customer management |
| Repayments | 5 | Payment processing |
| Reports | 6 | Report generation |
| Admin | 10 | System administration |
| Integration | 4 | External system tests |

---

## 2. Collection Structure

### 2.1 Folder Hierarchy

```
ULMS v2.0 API Collection
├── 01 - Authentication
│   ├── Get Access Token
│   ├── Refresh Token
│   └── Logout
├── 02 - Loans
│   ├── Get All Loans
│   ├── Create Loan
│   ├── Get Loan by ID
│   ├── Update Loan
│   ├── Delete Loan
│   ├── Submit for Approval
│   ├── Approve Loan
│   ├── Reject Loan
│   ├── Disburse Loan
│   ├── Get Loan Documents
│   ├── Upload Document
│   └── Get Repayment Schedule
├── 03 - Customers
│   ├── Search Customers
│   ├── Create Customer
│   ├── Get Customer
│   ├── Update Customer
│   ├── Get Customer Loans
│   ├── Get CIB History
│   └── Update KYC
├── 04 - Repayments
│   ├── Record Repayment
│   ├── Get Repayments
│   ├── Reverse Repayment
│   ├── Generate Receipt
│   └── Bulk Upload
├── 05 - Reports
│   ├── Portfolio Summary
│   ├── NPL Report
│   ├── Provision Report
│   ├── Disbursement Report
│   ├── Collection Report
│   └── Custom Report
├── 06 - Admin
│   ├── Get Users
│   ├── Create User
│   ├── Update User
│   ├── Get Roles
│   ├── Get Branches
│   ├── System Health
│   ├── Audit Logs
│   └── Configuration
└── 07 - Integration
    ├── CIB Query
    ├── CBS Sync
    ├── SMS Send
    └── Email Send
```

---

## 3. Environment Variables

### 3.1 Environment Configuration

```json
{
  "name": "ULMS-Production",
  "values": [
    {
      "key": "base_url",
      "value": "https://api.ulms.bank.com",
      "type": "default"
    },
    {
      "key": "auth_url",
      "value": "https://auth.ulms.bank.com",
      "type": "default"
    },
    {
      "key": "client_id",
      "value": "your-client-id",
      "type": "secret"
    },
    {
      "key": "client_secret",
      "value": "your-client-secret",
      "type": "secret"
    },
    {
      "key": "access_token",
      "value": "",
      "type": "secret"
    },
    {
      "key": "refresh_token",
      "value": "",
      "type": "secret"
    },
    {
      "key": "test_loan_id",
      "value": "",
      "type": "default"
    },
    {
      "key": "test_customer_id",
      "value": "",
      "type": "default"
    }
  ]
}
```

### 3.2 Variable Usage

| Variable | Usage Example |
|----------|---------------|
| `{{base_url}}` | `{{base_url}}/v1/loans` |
| `{{access_token}}` | `Authorization: Bearer {{access_token}}` |
| `{{test_loan_id}}` | `{{base_url}}/v1/loans/{{test_loan_id}}` |

---

## 4. Sample Requests

### 4.1 Authentication - Get Access Token

```json
{
  "name": "Get Access Token",
  "request": {
    "method": "POST",
    "header": [
      {
        "key": "Content-Type",
        "value": "application/x-www-form-urlencoded"
      }
    ],
    "url": {
      "raw": "{{auth_url}}/oauth/token",
      "host": ["{{auth_url}}"],
      "path": ["oauth", "token"]
    },
    "body": {
      "mode": "urlencoded",
      "urlencoded": [
        {
          "key": "grant_type",
          "value": "password"
        },
        {
          "key": "username",
          "value": "test.user@bank.com"
        },
        {
          "key": "password",
          "value": "Test@123456"
        },
        {
          "key": "client_id",
          "value": "{{client_id}}"
        },
        {
          "key": "client_secret",
          "value": "{{client_secret}}"
        },
        {
          "key": "scope",
          "value": "read write"
        }
      ]
    }
  },
  "event": [
    {
      "listen": "test",
      "script": {
        "exec": [
          "pm.test('Status code is 200', function () {",
          "    pm.response.to.have.status(200);",
          "});",
          "",
          "var jsonData = pm.response.json();",
          "pm.environment.set('access_token', jsonData.access_token);",
          "pm.environment.set('refresh_token', jsonData.refresh_token);"
        ]
      }
    }
  ]
}
```

### 4.2 Loans - Create Loan

```json
{
  "name": "Create Loan",
  "request": {
    "method": "POST",
    "header": [
      {
        "key": "Authorization",
        "value": "Bearer {{access_token}}"
      },
      {
        "key": "Content-Type",
        "value": "application/json"
      }
    ],
    "url": {
      "raw": "{{base_url}}/v1/loans",
      "host": ["{{base_url}}"],
      "path": ["v1", "loans"]
    },
    "body": {
      "mode": "raw",
      "raw": "{\n  \"customer\": {\n    \"nid\": \"1234567890123\",\n    \"name\": \"Test Customer\",\n    \"phone\": \"+8801712345678\",\n    \"email\": \"test@example.com\",\n    \"dateOfBirth\": \"1990-01-15\",\n    \"address\": {\n      \"street\": \"123 Test Street\",\n      \"city\": \"Dhaka\",\n      \"postalCode\": \"1200\"\n    }\n  },\n  \"loanDetails\": {\n    \"productCode\": \"PERSONAL-001\",\n    \"amount\": 500000,\n    \"termMonths\": 36,\n    \"purpose\": \"Home renovation\",\n    \"interestRate\": 12.5\n  },\n  \"collateral\": {\n    \"type\": \"PROPERTY\",\n    \"description\": \"Residential apartment\",\n    \"value\": 1000000\n  }\n}"
    }
  },
  "event": [
    {
      "listen": "test",
      "script": {
        "exec": [
          "pm.test('Status code is 201', function () {",
          "    pm.response.to.have.status(201);",
          "});",
          "",
          "var jsonData = pm.response.json();",
          "pm.environment.set('test_loan_id', jsonData.loanId);",
          "",
          "pm.test('Response has loan ID', function () {",
          "    pm.expect(jsonData).to.have.property('loanId');",
          "    pm.expect(jsonData).to.have.property('applicationNumber');",
          "});"
        ]
      }
    }
  ]
}
```

### 4.3 CIB Integration

```json
{
  "name": "CIB Query",
  "request": {
    "method": "POST",
    "header": [
      {
        "key": "Authorization",
        "value": "Bearer {{access_token}}"
      },
      {
        "key": "Content-Type",
        "value": "application/json"
      }
    ],
    "url": {
      "raw": "{{base_url}}/v1/integrations/cib/query",
      "host": ["{{base_url}}"],
      "path": ["v1", "integrations", "cib", "query"]
    },
    "body": {
      "mode": "raw",
      "raw": "{\n  \"nid\": \"1234567890123\",\n  \"dateOfBirth\": \"1990-01-15\"\n}"
    }
  }
}
```

---

## 5. Collection Runner

### 5.1 Running the Collection

1. Open Postman
2. Import the collection
3. Select environment
4. Click "Run" on the collection
5. Configure runner options

### 5.2 Runner Configuration

| Option | Value |
|--------|-------|
| Iterations | 1 |
| Delay | 100ms |
| Data | (optional CSV file) |
| Save responses | Yes |
| Run collection without using stored cookies | No |

---

## 6. Newman CLI

### 6.1 Running with Newman

```bash
# Install Newman
npm install -g newman

# Run collection
newman run ULMS-API-Collection.json \
  -e ULMS-Production-Environment.json \
  --reporters cli,html,json \
  --reporter-html-export report.html \
  --reporter-json-export report.json

# Run with data file
newman run ULMS-API-Collection.json \
  -e ULMS-Production-Environment.json \
  -d test-data.csv
```

### 6.2 CI/CD Integration

```yaml
# .gitlab-ci.yml
api-tests:
  stage: test
  image: postman/newman:latest
  script:
    - newman run collections/ULMS-API-Collection.json
        -e environments/ULMS-Staging.json
        --reporters cli,junit
        --reporter-junit-export newman-report.xml
  artifacts:
    reports:
      junit: newman-report.xml
```

---

## 7. Appendix: Complete Collection JSON

The complete collection is available at:
- File: `ULMS-API-Collection-v1.0.json`
- Location: `/docs/api/postman/`
- Import URL: `https://api-docs.ulms.bank.com/collection.json`

---

**Document Control Footer**

*Classification: Internal - Technical*
*Next Review: Per Release*
*Owner: QA Lead*

**END OF DOCUMENT**

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Workflow REST API Design |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Unisoft Technical Team |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# Workflow REST API Design

## 1. API Overview

Base URL: `/api/v1/workflows`

## 2. Endpoints

### 2.1 Process Instances

#### Start Process Instance
```http
POST /api/v1/workflows/processes/{processId}/instances
Content-Type: application/json

{
  "businessKey": "LA-2026-000123",
  "variables": {
    "loanApplicationId": 123,
    "borrowerNid": "1234567890",
    "loanAmount": 500000
  }
}

Response: 201 Created
{
  "processInstanceKey": 2251799813685249,
  "processId": "loan-origination",
  "businessKey": "LA-2026-000123",
  "status": "ACTIVE",
  "startTime": "2026-02-08T10:30:00"
}
```

#### Get Instance Status
```http
GET /api/v1/workflows/instances/{processInstanceKey}

Response: 200 OK
{
  "processInstanceKey": 2251799813685249,
  "processId": "loan-origination",
  "businessKey": "LA-2026-000123",
  "status": "ACTIVE",
  "currentActivity": "bocc-review",
  "startTime": "2026-02-08T10:30:00",
  "variables": {
    "cibDecision": "APPROVE",
    "boccDecision": null
  }
}
```

#### Cancel Instance
```http
DELETE /api/v1/workflows/instances/{processInstanceKey}

Response: 204 No Content
```

### 2.2 User Tasks

#### List Tasks
```http
GET /api/v1/workflows/tasks?assignee=john.doe&processId=loan-origination

Response: 200 OK
{
  "tasks": [
    {
      "taskId": "2251799813685252",
      "taskDefinitionId": "bocc-review",
      "name": "BOCC Review",
      "processInstanceKey": 2251799813685249,
      "creationTime": "2026-02-08T10:35:00",
      "dueDate": "2026-02-10T10:35:00",
      "variables": {
        "loanAmount": 500000,
        "cibScore": 685
      }
    }
  ],
  "total": 5
}
```

#### Claim Task
```http
POST /api/v1/workflows/tasks/{taskId}/claim
{
  "assignee": "john.doe"
}

Response: 200 OK
```

#### Complete Task
```http
POST /api/v1/workflows/tasks/{taskId}/complete
Content-Type: application/json

{
  "variables": {
    "boccDecision": "FORWARD",
    "boccComments": "Recommend approval"
  }
}

Response: 200 OK
```

### 2.3 Process Definitions

#### List Process Definitions
```http
GET /api/v1/workflows/process-definitions

Response: 200 OK
{
  "definitions": [
    {
      "processId": "loan-origination",
      "name": "Loan Origination",
      "version": 3,
      "resource": "loan-origination.bpmn"
    },
    {
      "processId": "loan-disbursement",
      "name": "Loan Disbursement",
      "version": 2,
      "resource": "loan-disbursement.bpmn"
    }
  ]
}
```

#### Deploy Process
```http
POST /api/v1/workflows/process-definitions
Content-Type: multipart/form-data

file: loan-origination-v4.bpmn

Response: 201 Created
{
  "deploymentKey": 2251799813685300,
  "processesDeployed": 1,
  "decisionsDeployed": 0
}
```

## 3. Error Responses

```http
400 Bad Request
{
  "code": "INVALID_VARIABLES",
  "message": "Required variable 'loanAmount' is missing"
}

404 Not Found
{
  "code": "PROCESS_NOT_FOUND",
  "message": "Process definition 'unknown-process' not found"
}

409 Conflict
{
  "code": "TASK_ALREADY_ASSIGNED",
  "message": "Task is already assigned to another user"
}
```

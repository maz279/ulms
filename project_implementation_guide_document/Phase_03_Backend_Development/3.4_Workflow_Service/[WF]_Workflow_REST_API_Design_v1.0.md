**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Workflow REST API Design |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Technical Lead |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# Workflow REST API Design

## Table of Contents

1. [API Overview](#1-api-overview)
2. [Process Management](#2-process-management)
3. [Task Management](#3-task-management)
4. [Error Handling](#4-error-handling)

---

## 1. API Overview

Base URL: `/api/v1/workflows`

| Endpoint | Method | Description |
|----------|--------|-------------|
| /processes | POST | Start process |
| /processes/{key} | GET | Get process status |
| /processes/{key}/cancel | POST | Cancel process |
| /tasks | GET | List tasks |
| /tasks/{id} | GET | Get task details |
| /tasks/{id}/complete | POST | Complete task |
| /tasks/{id}/assign | POST | Assign task |

## 2. Process Management

### Start Process

```http
POST /api/v1/workflows/processes
Content-Type: application/json

{
  "processId": "loan-approval-v1",
  "variables": {
    "loanId": 12345,
    "amount": 5000000,
    "applicantName": "John Doe"
  }
}
```

Response:
```json
{
  "processInstanceKey": 2251799813685251,
  "processId": "loan-approval-v1",
  "status": "STARTED",
  "startTime": "2026-02-05T10:00:00Z"
}
```

### Get Process Status

```http
GET /api/v1/workflows/processes/2251799813685251
```

Response:
```json
{
  "processInstanceKey": 2251799813685251,
  "processId": "loan-approval-v1",
  "status": "ACTIVE",
  "currentElement": "Task_Level2",
  "variables": {
    "loanId": 12345,
    "level1Decision": "APPROVE"
  },
  "startTime": "2026-02-05T10:00:00Z"
}
```

## 3. Task Management

### List Tasks

```http
GET /api/v1/workflows/tasks?assignee=john.doe&state=CREATED
```

Response:
```json
{
  "tasks": [
    {
      "id": "2251799813685260",
      "name": "Level 2: Branch Manager Review",
      "processInstanceKey": 2251799813685251,
      "creationTime": "2026-02-05T10:15:00Z",
      "dueDate": "2026-02-05T18:15:00Z",
      "variables": {
        "loanId": 12345,
        "amount": 5000000
      }
    }
  ],
  "total": 1
}
```

### Complete Task

```http
POST /api/v1/workflows/tasks/2251799813685260/complete
Content-Type: application/json

{
  "variables": {
    "level2Decision": "APPROVE",
    "level2Comments": "All documents verified"
  }
}
```

## 4. Error Handling

| Status | Code | Description |
|--------|------|-------------|
| 400 | WF-001 | Invalid process ID |
| 404 | WF-002 | Process not found |
| 409 | WF-003 | Task already completed |
| 500 | WF-004 | Workflow engine error |

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Workflow Service Implementation Guide |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Technical Lead |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# Workflow Service Implementation Guide

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Setup](#2-setup)
3. [Configuration](#3-configuration)
4. [Implementation](#4-implementation)
5. [Testing](#5-testing)

---

## 1. Prerequisites

- Camunda Platform 8.3
- Java 21
- Maven 3.9+
- Docker (for local development)

## 2. Setup

### Maven Dependencies

```xml
<dependencies>
    <dependency>
        <groupId>io.camunda</groupId>
        <artifactId>spring-boot-starter-camunda-sdk</artifactId>
        <version>8.3.0</version>
    </dependency>
    <dependency>
        <groupId>io.camunda</groupId>
        <artifactId>zeebe-client-java</artifactId>
        <version>8.3.0</version>
    </dependency>
</dependencies>
```

## 3. Configuration

```yaml
camunda:
  client:
    mode: saas  # or self-managed
    cluster-id: ${CAMUNDA_CLUSTER_ID}
    region: ${CAMUNDA_REGION}
    auth:
      client-id: ${CAMUNDA_CLIENT_ID}
      client-secret: ${CAMUNDA_CLIENT_SECRET}
    
zeebe:
  client:
    worker:
      threads: 10
      max-jobs-active: 32
```

## 4. Implementation

### 4.1 Create Job Worker

```java
@Component
public class ApprovalJobWorker {
    
    @JobWorker(type = "approve-loan")
    public Map<String, Object> approveLoan(final ActivatedJob job) {
        Long loanId = job.getVariable("loanId");
        
        // Business logic
        approvalService.approve(loanId);
        
        return Map.of(
            "approved", true,
            "approvedAt", LocalDateTime.now()
        );
    }
}
```

### 4.2 REST Controller

```java
@RestController
@RequestMapping("/api/v1/workflows")
@RequiredArgsConstructor
public class WorkflowController {
    
    private final WorkflowService workflowService;
    
    @PostMapping("/loan-approval/start")
    public ResponseEntity<StartWorkflowResponse> startApproval(
            @RequestBody StartApprovalRequest request) {
        
        long processInstanceKey = workflowService.startProcess(
            "loan-approval-v1",
            Map.of(
                "loanId", request.getLoanId(),
                "amount", request.getAmount()
            )
        );
        
        return ResponseEntity.ok(
            StartWorkflowResponse.builder()
                .processInstanceKey(processInstanceKey)
                .status("STARTED")
                .build()
        );
    }
    
    @GetMapping("/tasks")
    public ResponseEntity<List<TaskDto>> getTasks(
            @RequestParam String assignee) {
        return ResponseEntity.ok(workflowService.getUserTasks(assignee));
    }
    
    @PostMapping("/tasks/{taskId}/complete")
    public ResponseEntity<Void> completeTask(
            @PathVariable String taskId,
            @RequestBody CompleteTaskRequest request) {
        
        workflowService.completeTask(taskId, request.getVariables());
        return ResponseEntity.ok().build();
    }
}
```

## 5. Testing

```java
@SpringBootTest
class WorkflowServiceTest {
    
    @Autowired
    private ZeebeClient zeebeClient;
    
    @Test
    void testLoanApprovalProcess() {
        // Deploy process
        zeebeClient.newDeployResourceCommand()
            .addResourceFromClasspath("loan-approval.bpmn")
            .send()
            .join();
        
        // Start instance
        ProcessInstanceEvent instance = zeebeClient
            .newCreateInstanceCommand()
            .bpmnProcessId("loan-approval-v1")
            .latestVersion()
            .variables(Map.of("loanId", 12345L))
            .send()
            .join();
        
        assertThat(instance.getProcessInstanceKey()).isPositive();
    }
}
```

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

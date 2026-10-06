**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Workflow Service Test Suite |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Technical Lead |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# Workflow Service Test Suite

## Table of Contents

1. [Unit Tests](#1-unit-tests)
2. [Integration Tests](#2-integration-tests)
3. [Process Tests](#3-process-tests)

---

## 1. Unit Tests

```java
@ExtendWith(MockitoExtension.class)
class WorkflowServiceTest {
    
    @Mock
    private ZeebeClient zeebeClient;
    
    @InjectMocks
    private WorkflowServiceImpl workflowService;
    
    @Test
    void startProcess_Success() {
        // Given
        when(zeebeClient.newCreateInstanceCommand())
            .thenReturn(mockCreateInstanceCommand);
        when(mockCreateInstanceCommand.bpmnProcessId("loan-approval"))
            .thenReturn(mockCreateInstanceCommand);
        when(mockCreateInstanceCommand.latestVersion())
            .thenReturn(mockCreateInstanceCommand);
        when(mockCreateInstanceCommand.variables(anyMap()))
            .thenReturn(mockCreateInstanceCommand);
        when(mockCreateInstanceCommand.send())
            .thenReturn(CompletableFuture.completedFuture(
                createProcessInstanceEvent(12345L)));
        
        // When
        long result = workflowService.startProcess("loan-approval", Map.of());
        
        // Then
        assertThat(result).isEqualTo(12345L);
    }
}
```

## 2. Integration Tests

```java
@SpringBootTest
@Testcontainers
class WorkflowIntegrationTest {
    
    @Container
    static GenericContainer<?> zeebe = new GenericContainer<>("camunda/zeebe:8.3.0")
        .withExposedPorts(26500);
    
    @Autowired
    private WorkflowService workflowService;
    
    @Test
    void completeApprovalFlow() {
        // Start process
        long processKey = workflowService.startProcess(
            "loan-approval-v1",
            Map.of("loanId", 12345L, "amount", 5000000)
        );
        
        // Complete Level 1
        List<TaskDto> tasks = workflowService.getUserTasks("officer1");
        workflowService.completeTask(
            tasks.get(0).getId(),
            Map.of("level1Decision", "APPROVE")
        );
        
        // Verify process advanced
        ProcessStatus status = workflowService.getProcessStatus(processKey);
        assertThat(status.getCurrentElement()).isEqualTo("Task_Level2");
    }
}
```

## 3. Process Tests

```java
@ZeebeProcessTest
class LoanApprovalProcessTest {
    
    @Test
    void test7LevelApprovalProcess() {
        // Deploy process
        client.newDeployResourceCommand()
            .addResourceFromClasspath("loan-approval-7-level.bpmn")
            .send()
            .join();
        
        // Start instance
        ProcessInstanceEvent instance = client
            .newCreateInstanceCommand()
            .bpmnProcessId("loan-approval-7-level")
            .latestVersion()
            .variables(Map.of(
                "loanId", 12345L,
                "amount", 50000000
            ))
            .send()
            .join();
        
        // Complete all approval levels
        completeTask(instance.getProcessInstanceKey(), "Task_Level1", 
            Map.of("level1Decision", "APPROVE"));
        completeTask(instance.getProcessInstanceKey(), "Task_Level2",
            Map.of("level2Decision", "APPROVE"));
        // ... continue through all levels
        
        // Assert process completed
        ProcessInstanceResult result = client
            .newCreateInstanceCommand()
            .bpmnProcessId("loan-approval-7-level")
            .latestVersion()
            .withResult()
            .send()
            .join();
        
        assertThat(result.getVariables().get("finalDecision"))
            .isEqualTo("APPROVED");
    }
}
```

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

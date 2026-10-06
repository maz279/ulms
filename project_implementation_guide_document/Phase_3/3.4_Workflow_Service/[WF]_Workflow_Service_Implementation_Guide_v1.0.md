**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Workflow Service Implementation Guide |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Unisoft Technical Team |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# Workflow Service Implementation Guide

## 1. Prerequisites

### 1.1 Required Software
- Java 21
- Camunda Platform 8.3
- Zeebe CLI (zbctl)
- Docker & Docker Compose

### 1.2 Dependencies

```xml
<dependencies>
    <dependency>
        <groupId>io.camunda</groupId>
        <artifactId>spring-boot-starter-camunda</artifactId>
        <version>8.3.0</version>
    </dependency>
    <dependency>
        <groupId>io.camunda</groupId>
        <artifactId>zeebe-client-java</artifactId>
        <version>8.3.0</version>
    </dependency>
</dependencies>
```

## 2. Configuration

### 2.1 Application Configuration

```yaml
camunda:
  client:
    zeebe:
      gateway-url: http://localhost:26500
      security:
        plaintext: true
      defaults:
        max-jobs-active: 32
        timeout: 300000
    operate:
      base-url: http://localhost:8081
    tasklist:
      base-url: http://localhost:8082

workflow:
  processes:
    loan-origination-id: loan-origination
    disbursement-id: loan-disbursement
    collection-id: collection-process
```

## 3. Service Implementation

### 3.1 Workflow Service Interface

```java
public interface WorkflowService {
    
    /**
     * Start a new workflow instance
     */
    WorkflowInstance startProcess(String processId, Map<String, Object> variables);
    
    /**
     * Complete a user task
     */
    void completeTask(String taskId, Map<String, Object> variables);
    
    /**
     * Cancel a workflow instance
     */
    void cancelInstance(long processInstanceKey);
    
    /**
     * Get instance status
     */
    WorkflowStatus getInstanceStatus(long processInstanceKey);
    
    /**
     * List active tasks for a user
     */
    List<UserTask> getTasksForUser(String userId, String processId);
}
```

### 3.2 Workflow Service Implementation

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class WorkflowServiceImpl implements WorkflowService {
    
    private final ZeebeClient zeebeClient;
    private final CamundaOperateClient operateClient;
    private final WorkflowRepository workflowRepository;
    
    @Override
    public WorkflowInstance startProcess(String processId, Map<String, Object> variables) {
        log.info("Starting process: {} with variables: {}", processId, variables);
        
        ProcessInstanceEvent event = zeebeClient.newCreateInstanceCommand()
            .bpmnProcessId(processId)
            .latestVersion()
            .variables(variables)
            .send()
            .join();
        
        WorkflowInstance instance = WorkflowInstance.builder()
            .processInstanceKey(event.getProcessInstanceKey())
            .processId(processId)
            .businessKey((String) variables.get("businessKey"))
            .status(WorkflowStatus.ACTIVE)
            .startTime(LocalDateTime.now())
            .variables(variables)
            .build();
        
        workflowRepository.save(instance);
        
        log.info("Process started with key: {}", event.getProcessInstanceKey());
        return instance;
    }
    
    @Override
    public void completeTask(String taskId, Map<String, Object> variables) {
        log.info("Completing task: {} with variables: {}", taskId, variables);
        
        zeebeClient.newCompleteCommand(Long.parseLong(taskId))
            .variables(variables)
            .send()
            .join();
    }
    
    @Override
    public void cancelInstance(long processInstanceKey) {
        log.info("Cancelling process instance: {}", processInstanceKey);
        
        zeebeClient.newCancelInstanceCommand(processInstanceKey)
            .send()
            .join();
        
        workflowRepository.updateStatus(processInstanceKey, WorkflowStatus.CANCELLED);
    }
    
    @Override
    public List<UserTask> getTasksForUser(String userId, String processId) {
        // Query Tasklist API for user tasks
        return tasklistClient.getTasks(TaskQuery.builder()
            .assignee(userId)
            .processDefinitionId(processId)
            .state(TaskState.CREATED)
            .build());
    }
}
```

### 3.3 Process Controller

```java
@RestController
@RequestMapping("/api/v1/workflows")
@RequiredArgsConstructor
@Tag(name = "Workflow Management")
public class WorkflowController {
    
    private final WorkflowService workflowService;
    
    @PostMapping("/start/{processId}")
    public ResponseEntity<WorkflowInstance> startProcess(
            @PathVariable String processId,
            @RequestBody Map<String, Object> variables) {
        
        WorkflowInstance instance = workflowService.startProcess(processId, variables);
        return ResponseEntity.ok(instance);
    }
    
    @PostMapping("/tasks/{taskId}/complete")
    public ResponseEntity<Void> completeTask(
            @PathVariable String taskId,
            @RequestBody Map<String, Object> variables) {
        
        workflowService.completeTask(taskId, variables);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/instances/{processInstanceKey}")
    public ResponseEntity<WorkflowStatus> getInstanceStatus(
            @PathVariable long processInstanceKey) {
        
        WorkflowStatus status = workflowService.getInstanceStatus(processInstanceKey);
        return ResponseEntity.ok(status);
    }
    
    @GetMapping("/tasks")
    public ResponseEntity<List<UserTask>> getTasks(
            @RequestParam String userId,
            @RequestParam(required = false) String processId) {
        
        List<UserTask> tasks = workflowService.getTasksForUser(userId, processId);
        return ResponseEntity.ok(tasks);
    }
}
```

## 4. Process Event Handling

### 4.1 Process Event Listener

```java
@Component
@RequiredArgsConstructor
public class ProcessEventHandler {
    
    private final WorkflowRepository workflowRepository;
    private final NotificationService notificationService;
    
    @ZeebeWorker(type = "process-complete", autoComplete = true)
    public void handleProcessComplete(JobClient client, ActivatedJob job) {
        long processInstanceKey = job.getProcessInstanceKey();
        
        workflowRepository.updateStatus(processInstanceKey, WorkflowStatus.COMPLETED);
        workflowRepository.updateEndTime(processInstanceKey, LocalDateTime.now());
        
        String businessKey = getVariable(job, "businessKey", String.class);
        notificationService.sendProcessCompleteNotification(businessKey);
    }
    
    @ZeebeWorker(type = "sla-breach", autoComplete = true)
    public void handleSlaBreach(JobClient client, ActivatedJob job) {
        String taskId = getVariable(job, "taskId", String.class);
        String assignee = getVariable(job, "assignee", String.class);
        
        notificationService.sendSlaBreachAlert(taskId, assignee);
    }
}
```

## 5. Deployment

### 5.1 Docker Compose

```yaml
version: '3'
services:
  zeebe:
    image: camunda/zeebe:8.3.0
    ports:
      - "26500:26500"
    environment:
      - ZEEBE_BROKER_EXPORTERS_ELASTICSEARCH_CLASSNAME=io.camunda.zeebe.exporter.ElasticsearchExporter
      
  operate:
    image: camunda/operate:8.3.0
    ports:
      - "8081:8080"
    environment:
      - CAMUNDA_OPERATE_ZEEBE_GATEWAYADDRESS=zeebe:26500
      
  tasklist:
    image: camunda/tasklist:8.3.0
    ports:
      - "8082:8080"
    environment:
      - CAMUNDA_TASKLIST_ZEEBE_GATEWAYADDRESS=zeebe:26500
      
  workflow-service:
    build: ./workflow-service
    ports:
      - "8083:8080"
    environment:
      - CAMUNDA_CLIENT_ZEEBE_GATEWAY-URL=http://zeebe:26500
```

---

## Appendices

### A.1 zbctl Commands

```bash
# Deploy process
zbctl deploy resource loan-origination.bpmn

# Create instance
zbctl create instance loan-origination --variables '{"loanAppId": 123}'

# List instances
zbctl list instances

# Cancel instance
zbctl cancel instance <processInstanceKey>
```

### A.2 Process Variables

| Variable | Type | Description |
|----------|------|-------------|
| loanApplicationId | Long | Internal loan application ID |
| borrowerNid | String | Borrower NID |
| cibDecision | String | CIB decision result |
| approved | Boolean | Approval status |
| approvedAmount | BigDecimal | Approved loan amount |

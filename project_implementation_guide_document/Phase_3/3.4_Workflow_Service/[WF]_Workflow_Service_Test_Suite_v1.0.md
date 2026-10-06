**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Workflow Service Test Suite |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Unisoft Technical Team |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# Workflow Service Test Suite

## 1. Unit Tests

### 1.1 Workflow Service Test

```java
@ExtendWith(MockitoExtension.class)
class WorkflowServiceTest {
    
    @Mock
    private ZeebeClient zeebeClient;
    
    @InjectMocks
    private WorkflowServiceImpl workflowService;
    
    @Test
    void shouldStartProcessInstance() {
        // Given
        String processId = "loan-origination";
        Map<String, Object> variables = Map.of("loanAppId", 123);
        
        CreateProcessInstanceCommandStep1 command = mock(...);
        when(zeebeClient.newCreateInstanceCommand()).thenReturn(command);
        
        // When
        WorkflowInstance result = workflowService.startProcess(processId, variables);
        
        // Then
        assertThat(result.getProcessId()).isEqualTo(processId);
        assertThat(result.getStatus()).isEqualTo(WorkflowStatus.ACTIVE);
    }
    
    @Test
    void shouldCompleteTask() {
        // Given
        String taskId = "12345";
        Map<String, Object> variables = Map.of("approved", true);
        
        // When
        workflowService.completeTask(taskId, variables);
        
        // Then
        verify(zeebeClient).newCompleteCommand(12345L);
    }
}
```

## 2. Integration Tests

```java
@SpringBootTest
@Testcontainers
class WorkflowIntegrationTest {
    
    @Container
    static ZeebeContainer zeebe = new ZeebeContainer("camunda/zeebe:8.3.0");
    
    @Autowired
    private WorkflowService workflowService;
    
    @DynamicPropertySource
    static void configure(DynamicPropertyRegistry registry) {
        registry.add("camunda.client.zeebe.gateway-url", 
            () -> zeebe.getExternalGatewayAddress());
    }
    
    @Test
    void shouldExecuteLoanOriginationProcess() {
        // Deploy process
        deployProcess("loan-origination.bpmn");
        
        // Start instance
        WorkflowInstance instance = workflowService.startProcess(
            "loan-origination",
            Map.of("loanApplicationId", 123L, "cibDecision", "APPROVE")
        );
        
        // Wait for completion
        await()
            .atMost(30, TimeUnit.SECONDS)
            .until(() -> workflowService.getInstanceStatus(
                instance.getProcessInstanceKey()).isCompleted());
    }
}
```

## 3. BPMN Tests

```java
@ZeebeProcessTest
class LoanOriginationBpmnTest {
    
    @Test
    void shouldApproveLoanWithGoodCib() {
        // Deploy process
        engine.deployment().withResourceFromClasspath("loan-origination.bpmn").deploy();
        
        // Start process
        ProcessInstanceEvent instance = engine.processInstance()
            .ofBpmnProcessId("loan-origination")
            .withVariables(Map.of(
                "loanApplicationId", 123L,
                "cibDecision", "APPROVE"
            ))
            .create();
        
        // Verify NID verification executed
        engine.job().ofInstance(instance.getProcessInstanceKey())
            .withType("nid-verification")
            .complete();
        
        // Verify CIB check executed
        engine.job().ofInstance(instance.getProcessInstanceKey())
            .withType("cib-inquiry")
            .complete();
        
        // Assert process waiting at BOCC review
        assertThat(instance).isWaitingAtElements("bocc-review");
    }
}
```

## 4. Load Tests

```scala
class WorkflowLoadTest extends Simulation {
  
  val httpProtocol = http
    .baseUrl("http://localhost:8080")
    .acceptHeader("application/json")
  
  val startProcess = exec(
    http("Start Process")
      .post("/api/v1/workflows/processes/loan-origination/instances")
      .body(StringBody("""{"businessKey": "${businessKey}"}"""))
      .check(status.is(201))
      .check(jsonPath("$.processInstanceKey").saveAs("instanceKey"))
  )
  
  val scn = scenario("Workflow Load Test")
    .feed(csv("business-keys.csv"))
    .exec(startProcess)
  
  setUp(
    scn.inject(
      rampUsersPerSec(1).to(50).during(60),
      constantUsersPerSec(50).during(300)
    )
  ).protocols(httpProtocol)
}
```

---

## Appendices

### A.1 Test Coverage Requirements
| Component | Coverage |
|-----------|----------|
| WorkflowService | 90% |
| Job Workers | 85% |
| BPMN Processes | All paths |
| DMN Decisions | All rules |

### A.2 Test Environments
| Environment | Zeebe | Data |
|-------------|-------|------|
| Unit Test | In-memory | Mock |
| Integration | Testcontainer | Test data |
| E2E | Docker | Production-like |

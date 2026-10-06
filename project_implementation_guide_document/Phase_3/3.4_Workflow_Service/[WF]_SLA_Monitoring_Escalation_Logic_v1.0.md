**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | SLA Monitoring and Escalation Logic |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Unisoft Technical Team |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# SLA Monitoring and Escalation Logic

## 1. SLA Definitions

### 1.1 Loan Origination SLAs

| Task | SLA | Warning | Critical |
|------|-----|---------|----------|
| NID Verification | 1 hour | 45 min | 1 hour |
| CIB Check | 4 hours | 3 hours | 4 hours |
| Document Collection | 3 days | 2 days | 3 days |
| BOCC Review | 2 days | 1.5 days | 2 days |
| Credit Committee | 3 days | 2 days | 3 days |
| Customer Acceptance | 7 days | 5 days | 7 days |
| **Total Process** | **14 days** | **10 days** | **14 days** |

### 1.2 Disbursement SLAs

| Task | SLA | Warning | Critical |
|------|-----|---------|----------|
| Final Verification | 4 hours | 3 hours | 4 hours |
| Pre-Disbursement CIB | 1 hour | 45 min | 1 hour |
| CBS Posting | 30 min | 20 min | 30 min |
| **Total Process** | **3 days** | **2 days** | **3 days** |

## 2. Implementation

### 2.1 SLA Monitor Service

```java
@Service
@RequiredArgsConstructor
public class SlaMonitorService {
    
    private final ZeebeClient zeebeClient;
    private final NotificationService notificationService;
    private final SlaRepository slaRepository;
    
    @Scheduled(fixedDelay = 300000) // Every 5 minutes
    public void checkSlaBreaches() {
        List<ActiveTask> activeTasks = getActiveTasks();
        
        for (ActiveTask task : activeTasks) {
            SlaDefinition sla = getSlaForTask(task.getTaskType());
            
            if (sla == null) continue;
            
            Duration elapsed = Duration.between(task.getStartTime(), LocalDateTime.now());
            
            if (elapsed.compareTo(sla.getCritical()) > 0) {
                handleCriticalBreach(task, elapsed);
            } else if (elapsed.compareTo(sla.getWarning()) > 0) {
                handleWarningBreach(task, elapsed);
            }
        }
    }
    
    private void handleWarningBreach(ActiveTask task, Duration elapsed) {
        log.warn("SLA Warning: Task {} has elapsed {}", task.getTaskId(), elapsed);
        
        notificationService.sendNotification(
            task.getAssignee(),
            "SLA Warning",
            String.format("Task %s is approaching SLA breach. Time elapsed: %s",
                task.getTaskName(), formatDuration(elapsed))
        );
    }
    
    private void handleCriticalBreach(ActiveTask task, Duration elapsed) {
        log.error("SLA Critical: Task {} has breached SLA at {}", 
            task.getTaskId(), elapsed);
        
        // Send to supervisor
        notificationService.sendEscalation(
            task.getSupervisorId(),
            "SLA Breach",
            String.format("Task %s assigned to %s has breached SLA",
                task.getTaskName(), task.getAssignee())
        );
        
        // Trigger escalation in workflow
        zeebeClient.newPublishMessageCommand()
            .messageName("sla-breach")
            .correlationKey(task.getProcessInstanceKey().toString())
            .variables(Map.of(
                "breachedTaskId", task.getTaskId(),
                "breachDuration", elapsed.toMinutes()
            ))
            .send()
            .join();
        
        // Record breach
        slaRepository.save(SlaBreach.builder()
            .taskId(task.getTaskId())
            .taskType(task.getTaskType())
            .assignee(task.getAssignee())
            .elapsedTime(elapsed)
            .breachTime(LocalDateTime.now())
            .build());
    }
}
```

### 2.2 Escalation Rules

```java
@Component
public class EscalationRuleEngine {
    
    public EscalationAction determineEscalation(SlaBreach breach, int breachCount) {
        // First breach - notify assignee and supervisor
        if (breachCount == 1) {
            return EscalationAction.builder()
                .notifyAssignee(true)
                .notifySupervisor(true)
                .reassignTask(false)
                .escalateToManagement(false)
                .build();
        }
        
        // Second breach - reassign task
        if (breachCount == 2) {
            return EscalationAction.builder()
                .notifyAssignee(true)
                .notifySupervisor(true)
                .reassignTask(true)
                .newAssignee(findAlternativeAssignee(breach.getTaskType()))
                .escalateToManagement(false)
                .build();
        }
        
        // Third breach - escalate to management
        return EscalationAction.builder()
            .notifyAssignee(true)
            .notifySupervisor(true)
            .reassignTask(true)
            .escalateToManagement(true)
            .managementLevel("BRANCH_MANAGER")
            .build();
    }
}
```

## 3. Metrics and Reporting

```java
@Component
public class SlaMetricsService {
    
    private final MeterRegistry meterRegistry;
    
    public void recordTaskCompletion(String taskType, Duration duration, boolean slaMet) {
        Timer.builder("workflow.task.duration")
            .tag("taskType", taskType)
            .tag("slaMet", String.valueOf(slaMet))
            .register(meterRegistry)
            .record(duration);
        
        if (!slaMet) {
            Counter.builder("workflow.sla.breach")
                .tag("taskType", taskType)
                .register(meterRegistry)
                .increment();
        }
    }
    
    public SlaReport generateReport(LocalDate startDate, LocalDate endDate) {
        return SlaReport.builder()
            .periodStart(startDate)
            .periodEnd(endDate)
            .totalTasks(slaRepository.countTasks(startDate, endDate))
            .slaMetCount(slaRepository.countSlaMet(startDate, endDate))
            .breachCount(slaRepository.countBreaches(startDate, endDate))
            .averageCompletionTime(slaRepository.calculateAverageTime(startDate, endDate))
            .build();
    }
}
```

---

## Appendices

### A.1 SLA Calculation
SLA excludes:
- Customer delays (document submission)
- System downtime
- Public holidays
- Waiting for external services (if > 24 hours)

### A.2 Reporting Schedule
| Report | Frequency | Recipients |
|--------|-----------|------------|
| Daily SLA | Daily | Operations Team |
| Weekly Summary | Weekly | Department Heads |
| Monthly Analytics | Monthly | Management |

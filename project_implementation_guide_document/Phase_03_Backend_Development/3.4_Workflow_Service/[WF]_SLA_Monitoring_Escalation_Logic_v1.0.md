**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | SLA Monitoring and Escalation Logic |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | 2026-02-05 |
| **Prepared By** | Technical Lead |
| **Reviewed By** | Solution Architect |
| **Classification** | Internal |
| **Status** | Draft |

---

# SLA Monitoring and Escalation Logic

## Table of Contents

1. [SLA Definitions](#1-sla-definitions)
2. [Monitoring Implementation](#2-monitoring-implementation)
3. [Escalation Logic](#3-escalation-logic)
4. [Notifications](#4-notifications)

---

## 1. SLA Definitions

| Approval Level | Role | Standard SLA | Critical SLA |
|----------------|------|--------------|--------------|
| Level 1 | Branch Officer | 4 hours | 2 hours |
| Level 2 | Branch Manager | 8 hours | 4 hours |
| Level 3 | Area Manager | 1 day | 12 hours |
| Level 4 | Regional Manager | 2 days | 1 day |
| Level 5 | Zonal Head | 3 days | 2 days |
| Level 6 | Head of Credit | 5 days | 3 days |
| Level 7 | Board/MD | 7 days | 5 days |

## 2. Monitoring Implementation

```java
@Component
public class SlaMonitorService {
    
    private final TaskRepository taskRepository;
    private final NotificationService notificationService;
    
    @Scheduled(fixedDelay = 300000) // Every 5 minutes
    public void checkSlaViolations() {
        List<Task> overdueTasks = taskRepository.findOverdueTasks(LocalDateTime.now());
        
        for (Task task : overdueTasks) {
            processSlaViolation(task);
        }
    }
    
    private void processSlaViolation(Task task) {
        long overdueMinutes = ChronoUnit.MINUTES.between(
            task.getDueDate(), 
            LocalDateTime.now()
        );
        
        // Determine escalation level
        EscalationLevel level = determineEscalationLevel(overdueMinutes);
        
        // Send notification
        sendEscalationNotification(task, level);
        
        // Log violation
        logSlaViolation(task, overdueMinutes);
    }
    
    private EscalationLevel determineEscalationLevel(long overdueMinutes) {
        if (overdueMinutes < 60) return EscalationLevel.WARNING;
        if (overdueMinutes < 240) return EscalationLevel.MODERATE;
        if (overdueMinutes < 1440) return EscalationLevel.HIGH;
        return EscalationLevel.CRITICAL;
    }
}
```

## 3. Escalation Logic

```java
@Service
public class EscalationService {
    
    public void escalateTask(String taskId, EscalationLevel level) {
        Task task = taskService.getTask(taskId);
        
        switch (level) {
            case WARNING:
                notifyAssignee(task, "SLA Warning");
                break;
            case MODERATE:
                notifyAssignee(task, "SLA Breach");
                notifyManager(task);
                break;
            case HIGH:
                reassignToBackup(task);
                notifySeniorManager(task);
                break;
            case CRITICAL:
                escalateToNextLevel(task);
                notifyHeadOfDepartment(task);
                break;
        }
    }
    
    private void escalateToNextLevel(Task task) {
        int currentLevel = extractLevel(task.getName());
        String nextLevelRole = getRoleForLevel(currentLevel + 1);
        
        taskService.reassignTask(task.getId(), nextLevelRole);
    }
}
```

## 4. Notifications

```java
@Component
public class SlaNotificationService {
    
    public void sendSlaWarning(Task task) {
        Notification notification = Notification.builder()
            .recipient(task.getAssignee())
            .subject("SLA Warning: Task Due Soon")
            .body(String.format(
                "Task '%s' is due in %d minutes. Please complete promptly.",
                task.getName(),
                minutesUntilDue(task)
            ))
            .priority(NotificationPriority.HIGH)
            .build();
        
        notificationService.send(notification);
    }
    
    public void sendSlaBreach(Task task, long overdueMinutes) {
        Notification notification = Notification.builder()
            .recipient(task.getAssignee())
            .cc(getManagerEmail(task.getAssignee()))
            .subject("URGENT: SLA Breach - Immediate Action Required")
            .body(String.format(
                "Task '%s' is %d minutes overdue. Immediate action required.",
                task.getName(),
                overdueMinutes
            ))
            .priority(NotificationPriority.URGENT)
            .build();
        
        notificationService.send(notification);
    }
}
```

---

*© 2026 Unisoft Systems Limited. All Rights Reserved.*

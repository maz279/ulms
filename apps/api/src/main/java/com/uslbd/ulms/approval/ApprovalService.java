package com.uslbd.ulms.approval;

import com.uslbd.ulms.platform.audit.AuditService;
import com.uslbd.ulms.platform.workflow.WorkflowService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.UUID;

/**
 * Approval actions (PLANNING/03 mod-approval). Deliberately thin: the engine
 * (platform) owns state; module side-effects on completion happen via
 * WorkflowCompletedEvent listeners (keeps module graph acyclic — ADR-001).
 *
 * Role gate (06 §1 method security): an API caller's realm roles must cover
 * the task's ladder level (admin bypasses). An empty role set means an
 * internal/system call (tests, event replay) — the HTTP boundary always
 * passes the JWT's roles, so the gate cannot be skipped from outside.
 */
@Service
public class ApprovalService {

    /** Realm role → ladder level (band table role_key), 06 §1 + V2 seeds. */
    static final Map<String, String> ROLE_TO_LADDER = Map.of(
            "branch-officer", "ladder-1",
            "branch-manager", "ladder-2",
            "regional-manager", "ladder-3",
            "divisional-head", "ladder-4",
            "ho-credit", "ladder-5",
            "credit-committee", "ladder-6",
            "md", "ladder-7");

    private final WorkflowService workflow;
    private final AuditService audit;

    ApprovalService(WorkflowService workflow, AuditService audit) {
        this.workflow = workflow; this.audit = audit;
    }

    @Transactional
    public ActResult act(UUID taskId, WorkflowService.Action action, String actor, String remark) {
        return act(taskId, action, actor, Set.of(), remark, null);
    }

    /**
     * Full act (Q1.3): DELEGATE carries the delegate user in {@code delegateTo};
     * every other action ignores it. Two gates stack before the engine:
     * the ladder ROLE gate (realm roles cover the task's level, admin bypasses)
     * and the ASSIGNEE gate (a delegated/claimed task answers only to its
     * assignee — or admin), so delegation actually transfers responsibility.
     */
    @Transactional
    public ActResult act(UUID taskId, WorkflowService.Action action, String actor,
                         Set<String> realmRoles, String remark) {
        return act(taskId, action, actor, realmRoles, remark, null);
    }

    @Transactional
    public ActResult act(UUID taskId, WorkflowService.Action action, String actor,
                         Set<String> realmRoles, String remark, String delegateTo) {
        if (!realmRoles.isEmpty()) {
            var task = workflow.task(taskId)
                    .orElseThrow(() -> new NoSuchElementException("Task not open: " + taskId));
            boolean admin = realmRoles.contains("admin");
            boolean allowed = admin
                    || realmRoles.stream().map(ROLE_TO_LADDER::get).anyMatch(task.getAssigneeRole()::equals);
            if (!allowed) {
                throw new org.springframework.security.access.AccessDeniedException(
                        "Role not authorized for " + task.getAssigneeRole() + " task");
            }
            if (task.getAssigneeUser() != null && !admin
                    && !actor.equals(task.getAssigneeUser())) {
                throw new org.springframework.security.access.AccessDeniedException(
                        "Task is assigned to " + task.getAssigneeUser());
            }
        }
        WorkflowService.Outcome out = workflow.act(taskId, action, actor, remark, delegateTo);
        audit.record(actor, "APPROVAL_" + action.name(), "workflow_task", taskId,
                "{\"event\":\"" + out.event() + "\"}", UUID.randomUUID());
        return new ActResult(out.instance().getStatus(), out.event().name(),
                out.nextTask() == null ? null : out.nextTask().getId());
    }

    /** Conditions precedent on an application's workflow (Q1.3). */
    @Transactional(readOnly = true)
    public java.util.List<com.uslbd.ulms.platform.workflow.ApprovalCondition>
            conditions(UUID applicationId) {
        return workflow.conditions("application", applicationId);
    }

    /** SATISFIED (evidence) or WAIVED (override) — admin or any ladder level. */
    @Transactional
    public com.uslbd.ulms.platform.workflow.ApprovalCondition resolveCondition(
            UUID conditionId, String status, String actor, String remark) {
        var resolved = workflow.resolveCondition(conditionId, status, actor);
        audit.record(actor, "CONDITION_" + status, "workflow_task", resolved.getTaskId(),
                "{\"condition\":\"" + resolved.getId() + "\",\"remark\":\""
                        + (remark == null ? "" : remark.replace("\"", "'")) + "\"}",
                UUID.randomUUID());
        return resolved;
    }

    public record ActResult(String instanceStatus, String event, UUID nextTaskId) {}
}

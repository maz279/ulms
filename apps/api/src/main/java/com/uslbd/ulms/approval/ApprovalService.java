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
        return act(taskId, action, actor, Set.of(), remark);
    }

    @Transactional
    public ActResult act(UUID taskId, WorkflowService.Action action, String actor,
                         Set<String> realmRoles, String remark) {
        if (!realmRoles.isEmpty()) {
            var task = workflow.task(taskId)
                    .orElseThrow(() -> new NoSuchElementException("Task not open: " + taskId));
            boolean allowed = realmRoles.contains("admin")
                    || realmRoles.stream().map(ROLE_TO_LADDER::get).anyMatch(task.getAssigneeRole()::equals);
            if (!allowed) {
                throw new org.springframework.security.access.AccessDeniedException(
                        "Role not authorized for " + task.getAssigneeRole() + " task");
            }
        }
        WorkflowService.Outcome out = workflow.act(taskId, action, actor, remark);
        audit.record(actor, "APPROVAL_" + action.name(), "workflow_task", taskId,
                "{\"event\":\"" + out.event() + "\"}", UUID.randomUUID());
        return new ActResult(out.instance().getStatus(), out.event().name(),
                out.nextTask() == null ? null : out.nextTask().getId());
    }

    public record ActResult(String instanceStatus, String event, UUID nextTaskId) {}
}

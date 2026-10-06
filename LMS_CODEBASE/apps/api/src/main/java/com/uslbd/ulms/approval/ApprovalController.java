package com.uslbd.ulms.approval;

import com.uslbd.ulms.platform.ApiList;
import com.uslbd.ulms.platform.AuthPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** Approver inbox + actions (PLANNING/03 mod-approval). */
@RestController
@RequestMapping("/api/v1/approvals")
class ApprovalController {

    private final ApprovalService service;
    private final LadderService ladder;
    private final com.uslbd.ulms.platform.workflow.WorkflowService workflow;

    ApprovalController(ApprovalService service, LadderService ladder,
                       com.uslbd.ulms.platform.workflow.WorkflowService workflow) {
        this.service = service; this.ladder = ladder; this.workflow = workflow;
    }

    /** The 7-level ladder (config) — powers the UI ladder view. */
    @GetMapping("/ladder")
    ApiList<LadderService.LadderRung> ladder() { return ApiList.of(ladder.ladder()); }

    /**
     * Approver inbox (03 mod-approval): OPEN tasks whose ladder level matches
     * the caller's realm roles (admin sees all), newest first.
     */
    @GetMapping("/my-inbox")
    ApiList<InboxItem> myInbox(org.springframework.security.core.Authentication auth) {
        var ladderRoles = AuthPrincipal.rolesOf(auth).stream()
                .map(ApprovalService.ROLE_TO_LADDER::get)
                .filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.toSet());
        if (AuthPrincipal.rolesOf(auth).contains("admin")) ladderRoles.add("admin");
        var items = workflow.openTasksForRoles(ladderRoles).stream()
                .map(t -> new InboxItem(t.getId(), t.getNode(), t.getAssigneeRole(),
                        t.getPhase(), t.getAssigneeUser(), t.getSlaDeadline(),
                        workflow.instanceOfTask(t.getId())
                                .map(i -> i.getAggregateId().toString()).orElse(null)))
                .toList();
        return ApiList.of(items);
    }

    /** Current task for an application (pipeline detail / BPF state). */
    @GetMapping("/current/{applicationId}")
    ResponseEntity<CurrentTask> current(@PathVariable UUID applicationId) {
        return workflow.currentTask("application", applicationId)
                .map(t -> ResponseEntity.ok(new CurrentTask(t.getId(), t.getNode(),
                        t.getAssigneeRole(), t.getPhase(), t.getStatus(),
                        t.getSlaDeadline())))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Act on a task: approve | reject | return | escalate | delegate |
     * approve_with_conditions (03 + Q1.3). The actor is the JWT subject
     * (client-sent actor ignored — 06 §1) and the caller's realm roles must
     * cover the task's ladder level (ApprovalService gate). DELEGATE requires
     * {@code delegateTo}; APPROVE_WITH_CONDITIONS takes one condition per
     * remark line.
     */
    @PostMapping("/{taskId}/act")
    @PreAuthorize("hasAnyRole('branch-officer','branch-manager','regional-manager',"
            + "'divisional-head','ho-credit','credit-committee','md','admin')")
    ApprovalService.ActResult act(@PathVariable UUID taskId, @RequestBody ActRequest body,
                                   Authentication auth) {
        com.uslbd.ulms.platform.workflow.WorkflowService.Action parsed;
        try {
            parsed = com.uslbd.ulms.platform.workflow.WorkflowService.Action
                    .valueOf(body.action().trim().toUpperCase().replace('-', '_'));
        } catch (Exception e) {
            throw new IllegalArgumentException("Unknown action: " + body.action());
        }
        if (parsed == com.uslbd.ulms.platform.workflow.WorkflowService.Action.DELEGATE
                && (body.delegateTo() == null || body.delegateTo().isBlank())) {
            throw new IllegalArgumentException("delegateTo is required for DELEGATE");
        }
        return service.act(taskId, parsed, AuthPrincipal.actorOf(auth),
                AuthPrincipal.rolesOf(auth), body.remark(), body.delegateTo());
    }

    /** Conditions precedent recorded on an application's approvals (Q1.3). */
    @GetMapping("/conditions/{applicationId}")
    @PreAuthorize("hasAnyRole('branch-officer','branch-manager','regional-manager',"
            + "'divisional-head','ho-credit','credit-committee','md','admin')")
    ApiList<ConditionDto> conditions(@PathVariable UUID applicationId) {
        return ApiList.of(service.conditions(applicationId).stream()
                .map(c -> new ConditionDto(c.getId(), c.getNode(), c.getConditionText(),
                        c.getStatus(), c.getCreatedBy(), c.getCreatedAt(),
                        c.getResolvedBy(), c.getResolvedAt()))
                .toList());
    }

    /** Resolve a condition: SATISFIED (evidence on file) or WAIVED (override). */
    @PostMapping("/conditions/{conditionId}/resolve")
    @PreAuthorize("hasAnyRole('branch-officer','branch-manager','regional-manager',"
            + "'divisional-head','ho-credit','credit-committee','md','admin')")
    ConditionDto resolve(@PathVariable UUID conditionId, @RequestBody ResolveRequest body,
                         Authentication auth) {
        var c = service.resolveCondition(conditionId, body.status(),
                AuthPrincipal.actorOf(auth), body.remark());
        return new ConditionDto(c.getId(), c.getNode(), c.getConditionText(), c.getStatus(),
                c.getCreatedBy(), c.getCreatedAt(), c.getResolvedBy(), c.getResolvedAt());
    }

    record ActRequest(String action, String actor, String remark, String delegateTo) {}
    record ResolveRequest(String status, String remark) {}
    record ConditionDto(UUID id, String node, String conditionText, String status,
                        String createdBy, java.time.Instant createdAt,
                        String resolvedBy, java.time.Instant resolvedAt) {}
    record InboxItem(UUID taskId, String node, String role, String phase, String assigneeUser,
                     java.time.Instant slaDeadline, String applicationId) {}
    record CurrentTask(UUID taskId, String node, String role, String phase,
                       String status, java.time.Instant slaDeadline) {}
}

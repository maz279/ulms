package com.uslbd.ulms.platform.workflow;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * SLA engine (R10 P-B, WF-SPEC §5): arms every open ladder task with a
 * deadline from ulms.sla_policy, then scans every 15 minutes —
 *   80% of budget consumed → WARN (once) + notification
 *   deadline passed        → BREACH (audit + notification)
 *   SLA + 50% passed       → auto-ESCALATE to the next rung via the workflow
 *                            engine (task closes ESCALATED_DUE_TO_SLA).
 * Node convention: "ladder-&lt;n&gt;" (n = 1..7). Urgent lanes read the same
 * policy table; applications do not carry urgency in the pilot — the
 * standard lane is the default.
 */
@Service
public class SlaService {

    private final WorkflowTaskSlaRepository tasks;
    private final SlaPolicyRepository policies;
    private final WorkflowService workflow;
    private final com.uslbd.ulms.platform.audit.AuditService audit;
    private final com.uslbd.ulms.platform.outbox.OutboxService outbox;

    public SlaService(WorkflowTaskSlaRepository tasks, SlaPolicyRepository policies,
                      WorkflowService workflow,
                      com.uslbd.ulms.platform.audit.AuditService audit,
                      com.uslbd.ulms.platform.outbox.OutboxService outbox) {
        this.tasks = tasks; this.policies = policies; this.workflow = workflow;
        this.audit = audit; this.outbox = outbox;
    }

    @Scheduled(cron = "0 */15 * * * *")
    public void scan() {
        runOnce(Instant.now());
    }

    /** One scan pass (scheduled or operator-invoked); returns tasks acted on. */
    @Transactional
    public ScanResult runOnce(Instant now) {
        int warned = 0, breached = 0, escalated = 0, armed = 0;
        List<WorkflowTask> open = tasks.findByStatusOrderByOpenedAtAsc("OPEN");
        for (WorkflowTask task : open) {
            Optional<Integer> level = levelOf(task.getNode());
            if (level.isEmpty()) continue;                     // non-ladder nodes: no SLA
            int standardMin = policies.findByLevel(level.get())
                    .map(SlaPolicy::getStandardMin).orElse(240);   // fallback 4 h
            // WorkflowService arms a flat 48 h deadline at creation; the first
            // scan re-arms it onto the per-level policy (idempotent after that)
            java.time.Instant policyDeadline = task.getOpenedAt()
                    .plus(Duration.ofMinutes(standardMin));
            if (task.getSlaDeadline() == null || !task.getSlaDeadline().equals(policyDeadline)) {
                task.armSla(policyDeadline);
                tasks.save(task);
                armed++;
            }
            Duration window = Duration.ofMinutes(standardMin);
            Instant deadline = task.getSlaDeadline();
            Instant opened = deadline.minus(window);

            // WARN at 80% of budget (once)
            if ("OK".equals(task.getSlaState())
                    && now.isAfter(opened.plus(window.multipliedBy(4).dividedBy(5)))) {
                task.markSlaWarned();
                tasks.save(task);
                outbox.emit("workflow_task", task.getId(), "SLA_WARNING",
                        Map.of("node", task.getNode(), "role", task.getAssigneeRole()));
                warned++;
            }
            // BREACH at deadline (once)
            if (List.of("OK", "WARNED").contains(task.getSlaState()) && now.isAfter(deadline)) {
                task.markSlaBreached();
                tasks.save(task);
                audit.record("system:sla", "SLA_BREACHED", "workflow_task", task.getId(),
                        "{\"node\":\"" + task.getNode() + "\",\"minutes\":"
                                + standardMin + "}", UUID.randomUUID());
                outbox.emit("workflow_task", task.getId(), "SLA_BREACH",
                        Map.of("node", task.getNode(), "role", task.getAssigneeRole()));
                breached++;
            }
            // AUTO-ESCALATE at SLA + 50% (WF-SPEC §5) — the engine opens the
            // next rung's task and closes this one ESCALATED.
            if (now.isAfter(deadline.plus(window.dividedBy(2)))
                    && !"ESCALATED".equals(task.getSlaState())) {
                task.markSlaEscalated();
                tasks.save(task);
                try {
                    workflow.act(task.getId(), WorkflowService.Action.ESCALATE,
                            "system:sla", "auto-escalated at SLA+50% (WF-SPEC §5)");
                    escalated++;
                } catch (IllegalStateException topOfLadder) {
                    // L7 has no upper node — the breach stands, board notified
                    outbox.emit("workflow_task", task.getId(), "SLA_TOP_BREACH",
                            Map.of("node", task.getNode()));
                }
            }
        }
        return new ScanResult(armed, warned, breached, escalated);
    }

    /** "L4" → 4 (node convention; assignee ROLE carries the "ladder-4" name). */
    static Optional<Integer> levelOf(String node) {
        if (node == null || node.length() < 2 || node.charAt(0) != 'L') return Optional.empty();
        try {
            return Optional.of(Integer.parseInt(node.substring(1)));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    public record ScanResult(int armed, int warned, int breached, int escalated) {}
}

package com.uslbd.ulms.platform.workflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * DB-backed workflow engine (ADR-003, PLANNING/03 mod-approval).
 * Data-driven graph from workflow_definition; ladder bands are config rows.
 * Semantics implemented here and locked by WorkflowEngineTest:
 *  - APPROVE on ACTION task → next node (or dual CHECK phase first when dual:true)
 *  - APPROVE on CHECK task → next node (maker-checker satisfied)
 *  - APPROVE_WITH_CONDITIONS (Q1.3) → advances like APPROVE but records
 *    conditions precedent (one per remark line) that gate disbursement
 *  - DELEGATE (Q1.3) → reassign the open task to a named peer in place;
 *    node/phase/SLA unchanged, only the delegate (or admin) may act after
 *  - REJECT → instance REJECTED (terminal)
 *  - RETURN → reopen PREVIOUS node's task once (loop-guarded); at L1 → RETURNED to submitter
 *  - ESCALATE → push the decision up one node without approving
 *  - completion fires the graph's onComplete event key via the returned Outcome
 */
@Service
public class WorkflowService {

    public static final String LADDER = "approval-ladder-7";
    private static final Duration STAGE_SLA = Duration.ofHours(48);   // 03: SLA 48h

    private final WorkflowDefinitionRepository definitions;
    private final WorkflowInstanceRepository instances;
    private final WorkflowTaskRepository tasks;
    private final WorkflowTaskQueryRepository taskQueries;
    private final WorkflowTransitionRepository transitions;
    private final ApprovalConditionRepository conditions;
    private final ObjectMapper json = new ObjectMapper();
    private final org.springframework.context.ApplicationEventPublisher events;
    private final SignatureCapturePort signatures;   // Q3.2: approval-signature evidence

    public WorkflowService(WorkflowDefinitionRepository definitions,
                           WorkflowInstanceRepository instances,
                           WorkflowTaskRepository tasks,
                           WorkflowTaskQueryRepository taskQueries,
                           WorkflowTransitionRepository transitions,
                           ApprovalConditionRepository conditions,
                           org.springframework.context.ApplicationEventPublisher events,
                           SignatureCapturePort signatures) {
        this.definitions = definitions; this.instances = instances;
        this.tasks = tasks; this.taskQueries = taskQueries; this.transitions = transitions;
        this.conditions = conditions;
        this.events = events;
        this.signatures = signatures;
    }

    /** Resolve the ladder start level for an amount (BDT minor units) from approval_band. */
    // NOTE: bands live in their own repository (ApprovalBandRepository in mod-approval's
    // shared package) — injected there; here the engine only walks the graph.

    @Transactional
    public Started start(String definitionKey, String aggregate, UUID aggregateId, String startNode) {
        WorkflowDefinition def = definitions.findByKeyAndActiveTrue(definitionKey)
                .orElseThrow(() -> new IllegalArgumentException("Unknown workflow: " + definitionKey));
        Node node = node(def, startNode);
        WorkflowInstance instance = WorkflowInstance.start(
                UUID.randomUUID(), definitionKey, aggregate, aggregateId, node.id());
        instances.save(instance);
        WorkflowTask task = openTask(instance.getId(), node, node.dual() ? "ACTION" : "ACTION");
        return new Started(instance, task);
    }

    /** Open task by id (the approval role gate reads node + assigneeRole before acting). */
    @Transactional(readOnly = true)
    public Optional<WorkflowTask> task(UUID taskId) {
        return tasks.findByIdAndStatusNot(taskId, "DONE");
    }

    /**
     * Open tasks for the given ladder roles — the approver inbox (03
     * mod-approval `GET /approvals/my-inbox`). Admin sees every open task.
     */
    @Transactional(readOnly = true)
    public java.util.List<WorkflowTask> openTasksForRoles(java.util.Set<String> ladderRoles) {
        var open = taskQueries.findAllByStatusOrderByOpenedAtDesc("OPEN");
        return ladderRoles.contains("admin") ? open
                : open.stream()
                        .filter(t -> ladderRoles.contains(t.getAssigneeRole()))
                        .toList();
    }

    /** Aggregate (e.g. application id) behind a task — inbox rows join on this. */
    @Transactional(readOnly = true)
    public Optional<WorkflowInstance> instanceOfTask(UUID taskId) {
        return tasks.findById(taskId).flatMap(t -> instances.findById(t.getInstanceId()));
    }

    @Transactional
    public Outcome act(UUID taskId, Action action, String actor, String remark) {
        return act(taskId, action, actor, remark, null);
    }

    /**
     * Full-parameter act (Q1.3): DELEGATE carries the delegate user; every
     * other action ignores it. Kept as a single transactional entry so the
     * role gate in mod-approval sees one choke point.
     */
    @Transactional
    public Outcome act(UUID taskId, Action action, String actor, String remark, String delegateTo) {
        WorkflowTask task = tasks.findByIdAndStatusNot(taskId, "DONE")
                .orElseThrow(() -> new IllegalStateException("Task not open: " + taskId));
        WorkflowInstance instance = instances.findById(task.getInstanceId())
                .orElseThrow(() -> new IllegalStateException("Instance missing"));
        WorkflowDefinition def = definitions.findById(instance.getDefinitionKey()).orElseThrow();

        // Maker-checker invariant (03 mod-approval): the CHECK phase must be a
        // DIFFERENT person than the ACTION phase on the same node.
        if ("CHECK".equals(task.getPhase()) && action == Action.APPROVE
                && actor.equals(makerOf(instance.getId(), task.getNode()))) {
            throw new IllegalStateException("Maker-checker violation: same user cannot check own action");
        }

        Node node = node(def, task.getNode());

        // Q3.2 (WF-SPEC §7): approvals on the ladder capture signature evidence
        // bound to this exact act() — payload = taskId|action|actor|now-bucket.
        // A conditional approval is signed like any other (it moves the file).
        WorkflowTransition transition = WorkflowTransition.of(taskId, actor,
                action == Action.APPROVE_WITH_CONDITIONS ? "APPROVE_COND" : action.name(), remark);
        boolean approval = action == Action.APPROVE || action == Action.APPROVE_WITH_CONDITIONS;
        if (approval) {
            java.util.Optional<Integer> level = SlaService.levelOf(node.id());
            if (level.isPresent()) {
                String payloadHash = CanvasSignatureAdapter.ALGORITHM_CANVAS.equals("canvas-sha256")
                        ? sha256Hex(taskId + "|" + action + "|" + actor + "|" + node.id())
                        : null;
                transition.attachSignature(signatures.capture(actor, payloadHash, level.get()));
            }
        }
        transitions.save(transition);

        switch (action) {
            case DELEGATE -> {
                // Q1.3 (03 mod-approval): hand the open task to a named peer —
                // node/phase unchanged, SLA clock keeps running, from then on
                // ONLY the delegate (or admin) may act on it
                if (delegateTo == null || delegateTo.isBlank()) {
                    throw new IllegalArgumentException("DELEGATE requires a delegate user");
                }
                if (delegateTo.equals(actor)) {
                    throw new IllegalArgumentException("Cannot delegate a task to yourself");
                }
                task.reassign(delegateTo.trim());
                return new Outcome(instance, task, Event.DELEGATED);
            }
            case APPROVE_WITH_CONDITIONS -> {
                // conditions precedent ride the approval: one row per non-blank
                // remark line; disbursement gates on every row resolving
                java.util.List<String> lines = conditionLines(remark);
                if (lines.isEmpty()) {
                    throw new IllegalArgumentException(
                            "APPROVE_WITH_CONDITIONS requires at least one condition line");
                }
                for (String line : lines) {
                    conditions.save(ApprovalCondition.pending(
                            instance.getId(), taskId, node.id(), line, actor));
                }
                // fall through to the APPROVE machinery (dual phase / advance /
                // completion) — the conditions are already recorded
                return approve(task, instance, node, Action.APPROVE_WITH_CONDITIONS);
            }
            case APPROVE -> {
                return approve(task, instance, node, action);
            }
            case REJECT -> {
                task.close("REJECTED");
                instance.complete("REJECTED");
                events.publishEvent(new WorkflowCompletedEvent(
                        instance.getId(), instance.getAggregate(), instance.getAggregateId(), false));
                return new Outcome(instance, null, Event.REJECTED);
            }
            case ESCALATE -> {
                // 03 mod-approval: push the decision UP one node without
                // approving — the higher level's task opens immediately.
                task.close("ESCALATED");
                if (node.next() == null) {
                    throw new IllegalStateException(
                            "Cannot escalate past the top of the ladder (" + node.id() + ")");
                }
                instance.moveTo(node.next());
                Node upper = node(def, node.next());
                WorkflowTask upperTask = openTask(instance.getId(), upper, "ACTION");
                return new Outcome(instance, upperTask, Event.ESCALATED);
            }
            case RETURN -> {
                task.close("RETURNED");
                Optional<Node> prev = previousNode(def, node.id());
                if (prev.isEmpty()) {
                    instance.complete("RETURNED");          // back to maker (03: once per stage)
                    return new Outcome(instance, null, Event.RETURNED_TO_MAKER);
                }
                instance.moveTo(prev.get().id());
                WorkflowTask reopened = openTask(instance.getId(), prev.get(), "ACTION");
                return new Outcome(instance, reopened, Event.NODE_ADVANCED);
            }
            default -> throw new IllegalArgumentException("Unsupported action " + action);
        }
    }

    /** Shared APPROVE machinery (dual phase → advance → completion event). */
    private Outcome approve(WorkflowTask task, WorkflowInstance instance, Node node, Action action) {
        if ("ACTION".equals(task.getPhase()) && node.dual()) {
            // maker-checker: ACTION close → open CHECK task (different user, enforced by caller)
            task.close("DONE");
            WorkflowTask check = openTask(instance.getId(), node, "CHECK");
            return new Outcome(instance, check, Event.DUAL_PHASE_CHECK);
        }
        task.close("DONE");
        if (node.next() == null) {
            instance.complete("COMPLETED");
            events.publishEvent(new WorkflowCompletedEvent(
                    instance.getId(), instance.getAggregate(), instance.getAggregateId(), true));
            return new Outcome(instance, null, Event.COMPLETED);
        }
        instance.moveTo(node.next());
        Node next = node(definitions.findById(instance.getDefinitionKey()).orElseThrow(), node.next());
        WorkflowTask nextTask = openTask(instance.getId(), next, "ACTION");
        return new Outcome(instance, nextTask, Event.NODE_ADVANCED);
    }

    /** Condition lines from a remark: one per non-blank line, trimmed. */
    private static java.util.List<String> conditionLines(String remark) {
        if (remark == null || remark.isBlank()) return java.util.List.of();
        return java.util.Arrays.stream(remark.split("\\r?\\n"))
                .map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    /** Conditions precedent recorded on the latest instance of an aggregate. */
    @Transactional(readOnly = true)
    public java.util.List<ApprovalCondition> conditions(String aggregate, UUID aggregateId) {
        return instance(aggregate, aggregateId)
                .map(i -> conditions.findAllByInstanceIdOrderByCreatedAtAsc(i.getId()))
                .orElse(java.util.List.of());
    }

    /** Outstanding PENDING conditions — >0 blocks disbursement (Q1.3). */
    @Transactional(readOnly = true)
    public long outstandingConditions(String aggregate, UUID aggregateId) {
        return instance(aggregate, aggregateId)
                .map(i -> conditions.countByInstanceIdAndStatus(i.getId(), ApprovalCondition.PENDING))
                .orElse(0L);
    }

    /** SATISFIED (evidence on file) or WAIVED (documented override). */
    @Transactional
    public ApprovalCondition resolveCondition(UUID conditionId, String status, String actor) {
        ApprovalCondition c = conditions.findById(conditionId)
                .orElseThrow(() -> new IllegalArgumentException("No condition " + conditionId));
        c.resolve(status, actor);
        return c;
    }

    public Optional<WorkflowTask> currentTask(String aggregate, UUID aggregateId) {
        return instances.findTopByAggregateAndAggregateIdOrderByIdDesc(aggregate, aggregateId)
                .flatMap(i -> tasks.findTopByInstanceIdOrderByOpenedAtDesc(i.getId()));
    }

    public Optional<WorkflowInstance> instance(String aggregate, UUID aggregateId) {
        return instances.findTopByAggregateAndAggregateIdOrderByIdDesc(aggregate, aggregateId);
    }

    /** Actor of the ACTION-phase approval on this node (the "maker" for CHECK tasks). */
    private String makerOf(UUID instanceId, String node) {
        return taskQueries.findAllByInstanceIdAndNodeOrderByOpenedAtAsc(instanceId, node).stream()
                .filter(t -> "DONE".equals(t.getStatus()))
                .findFirst()
                .flatMap(t -> transitions.findTopByTaskIdOrderByAtDesc(t.getId()))
                .map(WorkflowTransition::getActor)
                .orElse(null);
    }

    private WorkflowTask openTask(UUID instanceId, Node node, String phase) {
        return tasks.save(WorkflowTask.open(UUID.randomUUID(), instanceId, node.id(),
                node.role(), phase, Instant.now().plus(STAGE_SLA)));
    }

    private Node node(WorkflowDefinition def, String id) {
        try {
            JsonNode nodes = json.readTree(def.getGraph()).get("nodes");
            for (JsonNode n : nodes) {
                if (id.equals(n.get("id").asText())) {
                    return new Node(n.get("id").asText(), n.get("role").asText(),
                            n.path("dual").asBoolean(false),
                            n.hasNonNull("next") ? n.get("next").asText() : null);
                }
            }
        } catch (Exception e) {
            throw new IllegalStateException("Bad workflow graph: " + def.getKey(), e);
        }
        throw new IllegalStateException("Node not in graph: " + id);
    }

    private Optional<Node> previousNode(WorkflowDefinition def, String id) {
        try {
            JsonNode nodes = json.readTree(def.getGraph()).get("nodes");
            for (JsonNode n : nodes) {
                if (n.hasNonNull("next") && id.equals(n.get("next").asText())) {
                    return Optional.of(new Node(n.get("id").asText(), n.get("role").asText(),
                            n.path("dual").asBoolean(false),
                            n.hasNonNull("next") ? n.get("next").asText() : null));
                }
            }
        } catch (Exception e) {
            throw new IllegalStateException("Bad workflow graph", e);
        }
        return Optional.empty();
    }

    private static String sha256Hex(String s) {
        try {
            return java.util.HexFormat.of().formatHex(java.security.MessageDigest
                    .getInstance("SHA-256").digest(s.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    public enum Action { APPROVE, REJECT, RETURN, ESCALATE, DELEGATE, APPROVE_WITH_CONDITIONS }
    public enum Event { DUAL_PHASE_CHECK, NODE_ADVANCED, COMPLETED, REJECTED, RETURNED_TO_MAKER,
                        ESCALATED, DELEGATED }

    public record Node(String id, String role, boolean dual, String next) {}
    public record Started(WorkflowInstance instance, WorkflowTask task) {}
    public record Outcome(WorkflowInstance instance, WorkflowTask nextTask, Event event) {}
}

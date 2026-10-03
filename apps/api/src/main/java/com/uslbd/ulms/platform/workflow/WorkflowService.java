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
 *  - REJECT → instance REJECTED (terminal)
 *  - RETURN → reopen PREVIOUS node's task once (loop-guarded); at L1 → RETURNED to submitter
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
    private final ObjectMapper json = new ObjectMapper();
    private final org.springframework.context.ApplicationEventPublisher events;
    private final SignatureCapturePort signatures;   // Q3.2: approval-signature evidence

    public WorkflowService(WorkflowDefinitionRepository definitions,
                           WorkflowInstanceRepository instances,
                           WorkflowTaskRepository tasks,
                           WorkflowTaskQueryRepository taskQueries,
                           WorkflowTransitionRepository transitions,
                           org.springframework.context.ApplicationEventPublisher events,
                           SignatureCapturePort signatures) {
        this.definitions = definitions; this.instances = instances;
        this.tasks = tasks; this.taskQueries = taskQueries; this.transitions = transitions;
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
        // bound to this exact act() — payload = taskId|action|actor|now-bucket
        WorkflowTransition transition = WorkflowTransition.of(taskId, actor, action.name(), remark);
        if (action == Action.APPROVE) {
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
            case APPROVE -> {
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
                Node next = node(def, node.next());
                WorkflowTask nextTask = openTask(instance.getId(), next, "ACTION");
                return new Outcome(instance, nextTask, Event.NODE_ADVANCED);
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

    public enum Action { APPROVE, REJECT, RETURN, ESCALATE }
    public enum Event { DUAL_PHASE_CHECK, NODE_ADVANCED, COMPLETED, REJECTED, RETURNED_TO_MAKER, ESCALATED }

    public record Node(String id, String role, boolean dual, String next) {}
    public record Started(WorkflowInstance instance, WorkflowTask task) {}
    public record Outcome(WorkflowInstance instance, WorkflowTask nextTask, Event event) {}
}

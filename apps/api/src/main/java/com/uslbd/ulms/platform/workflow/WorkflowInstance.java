package com.uslbd.ulms.platform.workflow;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "workflow_instance", schema = "ulms")
public class WorkflowInstance {

    @Id private UUID id;
    @Column(name = "definition_key", nullable = false, length = 30) private String definitionKey;
    @Column(nullable = false, length = 40) private String aggregate;
    @Column(name = "aggregate_id", nullable = false) private UUID aggregateId;
    @Column(name = "current_node", nullable = false, length = 30) private String currentNode;
    @Column(nullable = false, length = 12) private String status = "RUNNING";
    @Column(name = "started_at", nullable = false) private Instant startedAt = Instant.now();
    @Column(name = "ended_at") private Instant endedAt;

    protected WorkflowInstance() {}

    static WorkflowInstance start(UUID id, String definitionKey, String aggregate,
                                  UUID aggregateId, String startNode) {
        WorkflowInstance i = new WorkflowInstance();
        i.id = id; i.definitionKey = definitionKey; i.aggregate = aggregate;
        i.aggregateId = aggregateId; i.currentNode = startNode;
        return i;
    }

    void moveTo(String node) { this.currentNode = node; }
    void complete(String status) { this.status = status; this.endedAt = Instant.now(); }

    public UUID getId() { return id; }
    public String getDefinitionKey() { return definitionKey; }
    public String getAggregate() { return aggregate; }
    public UUID getAggregateId() { return aggregateId; }
    public String getCurrentNode() { return currentNode; }
    public String getStatus() { return status; }
    public Instant getStartedAt() { return startedAt; }
    public Instant getEndedAt() { return endedAt; }
}

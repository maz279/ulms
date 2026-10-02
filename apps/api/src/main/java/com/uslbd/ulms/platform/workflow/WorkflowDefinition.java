package com.uslbd.ulms.platform.workflow;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.util.UUID;

@Entity
@Table(name = "workflow_definition", schema = "ulms")
public class WorkflowDefinition {

    @Id @Column(length = 30) private String key;
    @Column(nullable = false, length = 60) private String name;

    /** Graph JSON per V2 seed: { start, nodes:[{id,role,dual?,next}], onComplete }. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private String graph;

    @Column(nullable = false) private int version = 1;
    @Column(nullable = false) private boolean active = true;

    protected WorkflowDefinition() {}

    public String getKey() { return key; }
    public String getName() { return name; }
    public String getGraph() { return graph; }
    public int getVersion() { return version; }
    public boolean isActive() { return active; }
}

package com.uslbd.ulms.compliance;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * A saved governed report (P4 audit-G, 12 W11 "report viewer/writer"): the
 * thin, binding slice of the prototype's 7-step writer — a definition binds
 * the portfolio read model to a group-by and an owner; executing it is
 * running the read model (assembly-only, no free-form SQL by design).
 */
@Entity
@Table(name = "report_definition", schema = "ulms")
public class ReportDefinition {

    @Id @Column(nullable = false, updatable = false) private UUID id;
    @Column(nullable = false, unique = true, length = 120) private String name;
    @Column(nullable = false, length = 30) private String domain = "loan-portfolio";
    @Column(name = "group_by", nullable = false, length = 15) private String groupBy;
    @Column(nullable = false, length = 20) private String schedule = "manual";
    @Column(name = "created_by", nullable = false, length = 64) private String createdBy;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    protected ReportDefinition() {}

    static ReportDefinition of(UUID id, String name, String groupBy,
                               String schedule, String createdBy) {
        ReportDefinition d = new ReportDefinition();
        d.id = id; d.name = name; d.groupBy = groupBy;
        d.schedule = schedule == null || schedule.isBlank() ? "manual" : schedule;
        d.createdBy = createdBy;
        return d;
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getDomain() { return domain; }
    public String getGroupBy() { return groupBy; }
    public String getSchedule() { return schedule; }
    public String getCreatedBy() { return createdBy; }
    public Instant getCreatedAt() { return createdAt; }
}

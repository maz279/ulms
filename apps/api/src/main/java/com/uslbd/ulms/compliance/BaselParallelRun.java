package com.uslbd.ulms.compliance;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Basel parallel-run comparison row (Q3.7, V15): ULMS-computed metric vs the
 * bank's current-return value for a period, with a variance note. Two
 * quarters side-by-side is the go-live evidence.
 */
@Entity
@Table(name = "basel_parallel_run", schema = "ulms",
       uniqueConstraints = @UniqueConstraint(name = "uq_basel_period_metric",
               columnNames = {"period", "metric"}))
public class BaselParallelRun {

    @Id private UUID id;
    @Column(nullable = false, length = 7) private String period;      // YYYY-MM
    @Column(nullable = false, length = 40) private String metric;     // CAR|rwaBySegment|leverageRatioBp
    @Column(name = "ulms_value", nullable = false, columnDefinition = "text") private String ulmsValue;
    @Column(name = "bank_value", columnDefinition = "text") private String bankValue;
    @Column(name = "variance_note", columnDefinition = "text") private String varianceNote;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    protected BaselParallelRun() {}

    static BaselParallelRun of(UUID id, String period, String metric,
                               String ulmsValue, String bankValue, String varianceNote) {
        BaselParallelRun b = new BaselParallelRun();
        b.id = id; b.period = period; b.metric = metric;
        b.ulmsValue = ulmsValue; b.bankValue = bankValue; b.varianceNote = varianceNote;
        return b;
    }

    public UUID getId() { return id; }
    public String getPeriod() { return period; }
    public String getMetric() { return metric; }
    public String getUlmsValue() { return ulmsValue; }
    public String getBankValue() { return bankValue; }
    public String getVarianceNote() { return varianceNote; }
    public Instant getCreatedAt() { return createdAt; }
}

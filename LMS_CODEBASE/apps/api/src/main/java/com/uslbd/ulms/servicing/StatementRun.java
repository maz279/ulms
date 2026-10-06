package com.uslbd.ulms.servicing;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/** Statement generation audit row (03 statement_run). */
@Entity
@Table(name = "statement_run", schema = "ulms",
       indexes = @Index(name = "idx_statement_loan", columnList = "loan_id"))
public class StatementRun {

    @Id @Column(nullable = false, updatable = false) private UUID id;
    @Column(name = "loan_id", nullable = false) private UUID loanId;
    @Column(nullable = false) private int rows;
    @Column(name = "from_ts", nullable = false) private Instant fromTs;
    @Column(name = "to_ts", nullable = false) private Instant toTs;
    @Column(name = "generated_by", nullable = false, length = 64) private String generatedBy;
    @Column(name = "generated_at", nullable = false) private Instant generatedAt = Instant.now();

    protected StatementRun() {}

    static StatementRun of(UUID id, UUID loanId, int rows, Instant fromTs, Instant toTs,
                           String generatedBy) {
        StatementRun s = new StatementRun();
        s.id = id; s.loanId = loanId; s.rows = rows;
        s.fromTs = fromTs; s.toTs = toTs; s.generatedBy = generatedBy;
        return s;
    }

    public UUID getId() { return id; }
    public UUID getLoanId() { return loanId; }
    public int getRows() { return rows; }
    public Instant getFromTs() { return fromTs; }
    public Instant getToTs() { return toTs; }
    public String getGeneratedBy() { return generatedBy; }
    public Instant getGeneratedAt() { return generatedAt; }
}

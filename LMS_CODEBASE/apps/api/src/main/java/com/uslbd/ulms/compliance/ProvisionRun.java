package com.uslbd.ulms.compliance;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** One EOD run per date (unique) — BRPD 15/2024 provisions snapshot (03). */
@Entity
@Table(name = "provision_run", schema = "ulms")
public class ProvisionRun {

    @Id @Column(nullable = false, updatable = false) private UUID id;
    @Column(name = "run_date", nullable = false, unique = true) private LocalDate runDate;
    @Column(name = "loans_classified", nullable = false) private int loansClassified;
    @Column(name = "total_outstanding_minor", nullable = false) private long totalOutstandingMinor;
    @Column(name = "total_provision_minor", nullable = false) private long totalProvisionMinor;
    @JdbcTypeCode(SqlTypes.JSON) @Column(nullable = false, columnDefinition = "jsonb")
    private String detail;                       // per-class counts + amounts
    @Column(name = "started_by", nullable = false, length = 64) private String startedBy;
    @Column(name = "finished_at", nullable = false) private Instant finishedAt = Instant.now();

    protected ProvisionRun() {}

    static ProvisionRun of(UUID id, LocalDate runDate, int loans, long outstanding,
                           long provision, String detailJson, String startedBy) {
        ProvisionRun r = new ProvisionRun();
        r.id = id; r.runDate = runDate; r.loansClassified = loans;
        r.totalOutstandingMinor = outstanding; r.totalProvisionMinor = provision;
        r.detail = detailJson; r.startedBy = startedBy;
        return r;
    }

    public UUID getId() { return id; }
    public LocalDate getRunDate() { return runDate; }
    public int getLoansClassified() { return loansClassified; }
    public long getTotalOutstandingMinor() { return totalOutstandingMinor; }
    public long getTotalProvisionMinor() { return totalProvisionMinor; }
    public String getDetail() { return detail; }
    public String getStartedBy() { return startedBy; }
    public Instant getFinishedAt() { return finishedAt; }
}

package com.uslbd.ulms.compliance;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** Per-loan classification at a run date — the migration list (from→to) lives here (03). */
@Entity
@Table(name = "classification_history", schema = "ulms",
       uniqueConstraints = @UniqueConstraint(name = "uq_classification_loan_date",
               columnNames = {"loan_id", "run_date"}))
public class ClassificationHistory {

    @Id @Column(nullable = false, updatable = false) private UUID id;
    @Column(name = "loan_id", nullable = false) private UUID loanId;
    @Column(name = "run_date", nullable = false) private LocalDate runDate;
    @Column(name = "from_class", length = 6) private String fromClass;
    @Column(name = "to_class", nullable = false, length = 6) private String toClass;
    @Column(nullable = false) private int dpd;
    @Column(name = "outstanding_minor", nullable = false) private long outstandingMinor;
    @Column(name = "provision_rate_bp", nullable = false) private int provisionRateBp;
    @Column(name = "provision_minor", nullable = false) private long provisionMinor;
    @Column(name = "interest_suspense", nullable = false) private boolean interestSuspense;
    @Column(name = "classified_at", nullable = false) private Instant classifiedAt = Instant.now();

    protected ClassificationHistory() {}

    static ClassificationHistory of(UUID id, UUID loanId, LocalDate runDate, String fromClass,
                                    String toClass, int dpd, long outstandingMinor,
                                    int rateBp, long provisionMinor, boolean interestSuspense) {
        ClassificationHistory h = new ClassificationHistory();
        h.id = id; h.loanId = loanId; h.runDate = runDate;
        h.fromClass = fromClass; h.toClass = toClass; h.dpd = dpd;
        h.outstandingMinor = outstandingMinor; h.provisionRateBp = rateBp;
        h.provisionMinor = provisionMinor; h.interestSuspense = interestSuspense;
        return h;
    }

    public UUID getId() { return id; }
    public UUID getLoanId() { return loanId; }
    public LocalDate getRunDate() { return runDate; }
    public String getFromClass() { return fromClass; }
    public String getToClass() { return toClass; }
    public int getDpd() { return dpd; }
    public long getOutstandingMinor() { return outstandingMinor; }
    public int getProvisionRateBp() { return provisionRateBp; }
    public long getProvisionMinor() { return provisionMinor; }
    public boolean isInterestSuspense() { return interestSuspense; }
    public Instant getClassifiedAt() { return classifiedAt; }
}

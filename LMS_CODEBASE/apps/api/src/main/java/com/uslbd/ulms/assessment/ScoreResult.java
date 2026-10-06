package com.uslbd.ulms.assessment;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

/** Versioned scorecard result (03 mod-assessment: "score versioning"). */
@Entity
@Table(name = "score_result", schema = "ulms",
       indexes = @Index(name = "idx_scoreresult_app", columnList = "application_id"))
public class ScoreResult {

    @Id @Column(nullable = false, updatable = false) private UUID id;
    @Column(name = "application_id", nullable = false) private UUID applicationId;
    @Column(nullable = false) private int version;
    @Column(nullable = false) private int score;
    @Column(nullable = false, length = 2) private String grade;        // A|B|C|D
    @Column(nullable = false, length = 14) private String decision;    // AUTO_PASS|REFER|AUTO_DECLINE
    @JdbcTypeCode(SqlTypes.JSON) @Column(nullable = false, columnDefinition = "jsonb")
    private String factors;
    @Column(name = "computed_by", nullable = false, length = 64) private String computedBy;
    @Column(name = "computed_at", nullable = false) private Instant computedAt = Instant.now();

    protected ScoreResult() {}

    static ScoreResult of(UUID id, UUID applicationId, int version, int score,
                          String grade, String decision, String factorsJson, String computedBy) {
        ScoreResult s = new ScoreResult();
        s.id = id; s.applicationId = applicationId; s.version = version;
        s.score = score; s.grade = grade; s.decision = decision;
        s.factors = factorsJson; s.computedBy = computedBy;
        return s;
    }

    public UUID getId() { return id; }
    public UUID getApplicationId() { return applicationId; }
    public int getVersion() { return version; }
    public int getScore() { return score; }
    public String getGrade() { return grade; }
    public String getDecision() { return decision; }
    public String getFactors() { return factors; }
    public String getComputedBy() { return computedBy; }
    public Instant getComputedAt() { return computedAt; }
}

package com.uslbd.ulms.collections;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** Recovery & legal case tracking (03 mod-collections table legal_case). */
@Entity
@Table(name = "legal_case", schema = "ulms",
       uniqueConstraints = @UniqueConstraint(name = "uq_legalcase_no", columnNames = "case_no"),
       indexes = @Index(name = "idx_legalcase_loan", columnList = "loan_id"))
public class LegalCase {

    @Id @Column(nullable = false, updatable = false) private UUID id;
    @Column(name = "loan_id", nullable = false) private UUID loanId;
    @Column(name = "case_no", nullable = false, length = 24) private String caseNo;
    @Column(length = 160) private String court;
    @Column(name = "filed_on") private LocalDate filedOn;
    @Column(nullable = false, length = 12) private String status = "FILED";
    @Column(name = "claim_minor", nullable = false) private long claimMinor;
    @Column(length = 120) private String lawyer;
    @Column(length = 500) private String notes;
    @Column(name = "created_by", nullable = false, length = 64) private String createdBy;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    protected LegalCase() {}

    static LegalCase of(UUID id, UUID loanId, String caseNo, String court,
                        LocalDate filedOn, long claimMinor, String lawyer,
                        String notes, String createdBy) {
        LegalCase lc = new LegalCase();
        lc.id = id; lc.loanId = loanId; lc.caseNo = caseNo; lc.court = court;
        lc.filedOn = filedOn; lc.claimMinor = claimMinor; lc.lawyer = lawyer;
        lc.notes = notes; lc.createdBy = createdBy;
        return lc;
    }

    void updateStatus(String status) { this.status = status; }

    public UUID getId() { return id; }
    public UUID getLoanId() { return loanId; }
    public String getCaseNo() { return caseNo; }
    public String getCourt() { return court; }
    public LocalDate getFiledOn() { return filedOn; }
    public String getStatus() { return status; }
    public long getClaimMinor() { return claimMinor; }
    public String getLawyer() { return lawyer; }
    public String getNotes() { return notes; }
    public String getCreatedBy() { return createdBy; }
    public Instant getCreatedAt() { return createdAt; }
}

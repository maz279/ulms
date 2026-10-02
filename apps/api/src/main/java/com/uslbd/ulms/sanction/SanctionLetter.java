package com.uslbd.ulms.sanction;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Sanction letter (R3): bilingual body rendered at SANCTION, acceptance
 * tracked via a crypto-random token (portal link), single live letter per
 * application (REPLACED supersedes).
 */
@Entity
// uniqueness lives in V12 as a PARTIAL unique index (application_id where
// status <> 'REPLACED') — a JPA-level @UniqueConstraint would wrongly forbid
// the supersede history, so none is declared here; Flyway owns the schema
@Table(name = "sanction_letter", schema = "ulms")
public class SanctionLetter {

    public enum Status { ISSUED, ACCEPTED, REPLACED }

    @Id private UUID id;
    @Column(name = "application_id", nullable = false) private UUID applicationId;
    @Column(name = "app_no", nullable = false, length = 16) private String appNo;
    @Column(name = "cif_no", nullable = false, length = 16) private String cifNo;
    @Column(name = "customer_name_en", nullable = false, length = 120) private String customerNameEn;
    @Column(name = "amount_minor", nullable = false) private long amountMinor;
    @Column(name = "tenor_months", nullable = false) private int tenorMonths;
    @Column(name = "rate_bp", nullable = false) private int rateBp;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 10) private Status status = Status.ISSUED;
    @Column(name = "acceptance_token", nullable = false, length = 64) private String acceptanceToken;
    @Column(name = "accepted_at") private Instant acceptedAt;
    @Column(name = "issued_at", nullable = false) private Instant issuedAt = Instant.now();
    @Column(name = "issued_by", nullable = false, length = 64) private String issuedBy;
    @Column(name = "body_en", nullable = false, columnDefinition = "text") private String bodyEn;
    @Column(name = "body_bn", columnDefinition = "text") private String bodyBn;

    protected SanctionLetter() {}

    public static SanctionLetter issue(UUID id, UUID applicationId, String appNo, String cifNo,
                                       String customerNameEn, long amountMinor, int tenorMonths,
                                       int rateBp, String acceptanceToken, String issuedBy,
                                       String bodyEn, String bodyBn) {
        SanctionLetter s = new SanctionLetter();
        s.id = id; s.applicationId = applicationId; s.appNo = appNo; s.cifNo = cifNo;
        s.customerNameEn = customerNameEn; s.amountMinor = amountMinor;
        s.tenorMonths = tenorMonths; s.rateBp = rateBp;
        s.acceptanceToken = acceptanceToken; s.issuedBy = issuedBy;
        s.bodyEn = bodyEn; s.bodyBn = bodyBn;
        return s;
    }

    /** Tokenized acceptance (portal). Wrong token ⇒ 409 (defense in depth). */
    public void accept(String token) {
        if (status == Status.ACCEPTED) return;
        if (!acceptanceToken.equals(token)) {
            throw new IllegalStateException("acceptance token mismatch");
        }
        this.status = Status.ACCEPTED;
        this.acceptedAt = Instant.now();
    }

    void supersede() { this.status = Status.REPLACED; }

    public String getCustomerNameEn() { return customerNameEn; }
    public int getTenorMonths() { return tenorMonths; }
    public int getRateBp() { return rateBp; }
    public String getAcceptanceToken() { return acceptanceToken; }
    public java.time.Instant getAcceptedAt() { return acceptedAt; }
    public java.time.Instant getIssuedAt() { return issuedAt; }
    public String getIssuedBy() { return issuedBy; }
    public UUID getId() { return id; }
    public UUID getApplicationId() { return applicationId; }
    public String getAppNo() { return appNo; }
    public String getCifNo() { return cifNo; }
    public long getAmountMinor() { return amountMinor; }
    public Status getStatus() { return status; }
    public String getBodyEn() { return bodyEn; }
    public String getBodyBn() { return bodyBn; }
}

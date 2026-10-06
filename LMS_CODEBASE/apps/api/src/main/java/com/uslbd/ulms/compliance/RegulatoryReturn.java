package com.uslbd.ulms.compliance;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * One generated regulatory return pack (P4 / 11 §6): CL-1..CL-5, CIB files,
 * Basel CAR, EDW, IFRS-9 ECL, large-loan forecast. Payload JSON is the
 * WORM-staged source of truth; {@code fileSha256} checksums the rendered
 * file so downstream submission evidence is tamper-evident.
 *
 * <p>Sign-off chain (06 §8 P4, 11 §6): preparer is the system at generation
 * (STAGED) → checker (CHECKED) → compliance officer (FILED = submitted to
 * Bangladesh Bank). Transitions are enforced in ReturnsService.
 */
@Entity
@Table(name = "regulatory_return", schema = "ulms")
public class RegulatoryReturn {

    @Id @Column(nullable = false, updatable = false) private UUID id;
    @Column(nullable = false, length = 10) private String code;
    @Column(nullable = false, length = 7) private String period;   // YYYY-MM
    @Column(nullable = false, length = 10) private String status = "STAGED";
    @Column(nullable = false, columnDefinition = "text") private String payload;
    @Column(name = "file_format", nullable = false, length = 16) private String fileFormat;
    @Column(name = "file_sha256", nullable = false, length = 64) private String fileSha256;
    @Column(name = "storage_key", length = 200) private String storageKey;   // WORM object-store copy (11 §6)
    @Column(name = "row_count", nullable = false) private int rowCount;
    @Column(nullable = false, length = 64) private String preparer;
    @Column(length = 64) private String checker;
    @Column(name = "checked_at") private Instant checkedAt;
    @Column(name = "compliance_officer", length = 64) private String complianceOfficer;
    @Column(name = "compliance_approved_at") private Instant complianceApprovedAt;
    @Column(name = "submitted_at") private Instant submittedAt;
    @Column(name = "generated_at", nullable = false) private Instant generatedAt = Instant.now();

    protected RegulatoryReturn() {}

    static RegulatoryReturn staged(UUID id, String code, String period, String payload,
                                   String fileFormat, String sha256, int rowCount,
                                   String preparer, String storageKey) {
        RegulatoryReturn r = new RegulatoryReturn();
        r.id = id; r.code = code; r.period = period; r.payload = payload;
        r.fileFormat = fileFormat; r.fileSha256 = sha256;
        r.rowCount = rowCount; r.preparer = preparer; r.storageKey = storageKey;
        return r;
    }

    /** R10 P-F: transmission booked by the nightly ops job (after FILED). */
    void transmitted() {
        if (!"FILED".equals(status)) {
            throw new IllegalStateException("Return " + code + " is " + status
                    + " — transmission applies to FILED packs only");
        }
        this.status = "TRANSMITTED";
    }

    /** Checker sign-off — only valid from STAGED. */
    void check(String checker) {
        if (!"STAGED".equals(status)) {
            throw new IllegalStateException("Return " + code + " is " + status
                    + " — checker sign-off applies to STAGED packs only");
        }
        this.status = "CHECKED"; this.checker = checker; this.checkedAt = Instant.now();
    }

    /** Compliance sign-off + submission — only valid from CHECKED, by a DIFFERENT officer. */
    void file(String officer) {
        if (!"CHECKED".equals(status)) {
            throw new IllegalStateException("Return " + code + " is " + status
                    + " — compliance sign-off requires CHECKED packs (preparer → checker → compliance)");
        }
        if (officer != null && officer.equals(checker)) {
            throw new IllegalStateException("Return " + code + ": compliance sign-off must be a"
                    + " DIFFERENT officer than the checker (06 §8 maker-checker)");
        }
        this.status = "FILED";
        this.complianceOfficer = officer;
        this.complianceApprovedAt = Instant.now();
        this.submittedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public String getCode() { return code; }
    public String getPeriod() { return period; }
    public String getStatus() { return status; }
    public String getPayload() { return payload; }
    public String getFileFormat() { return fileFormat; }
    public String getFileSha256() { return fileSha256; }
    public String getStorageKey() { return storageKey; }
    public int getRowCount() { return rowCount; }
    public String getPreparer() { return preparer; }
    public String getChecker() { return checker; }
    public Instant getCheckedAt() { return checkedAt; }
    public String getComplianceOfficer() { return complianceOfficer; }
    public Instant getComplianceApprovedAt() { return complianceApprovedAt; }
    public Instant getSubmittedAt() { return submittedAt; }
    public Instant getGeneratedAt() { return generatedAt; }
}

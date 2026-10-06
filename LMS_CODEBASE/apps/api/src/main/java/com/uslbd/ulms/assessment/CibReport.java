package com.uslbd.ulms.assessment;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

/** One CIB pull per (cif, period, file) — deduped by unique constraint (11 §1). */
@Entity
@Table(name = "cib_report", schema = "ulms",
       indexes = @Index(name = "idx_cibreport_customer", columnList = "customer_id"))
public class CibReport {

    @Id @Column(nullable = false, updatable = false) private UUID id;
    @Column(name = "customer_id", nullable = false) private UUID customerId;
    @Column(name = "cif_no", nullable = false, length = 16) private String cifNo;
    @Column(nullable = false, length = 12) private String status;      // PENDING|PARSED|FAILED
    @Column(nullable = false, length = 16) private String source;      // MOCK_REALTIME|FILE
    @Column(name = "report_period", nullable = false, length = 7) private String reportPeriod;
    @Column(name = "file_id", nullable = false, length = 40) private String fileId;
    @Column(columnDefinition = "text") private String raw;   // NULL going forward (06 §5 — raw lives in the object store)
    @JdbcTypeCode(SqlTypes.JSON) @Column(columnDefinition = "jsonb") private String parsed;
    @Column(name = "storage_key", length = 200) private String storageKey;
    @Column(length = 200) private String error;
    @Column(name = "pulled_by", nullable = false, length = 64) private String pulledBy;
    @Column(name = "pulled_at", nullable = false) private Instant pulledAt = Instant.now();

    protected CibReport() {}

    static CibReport of(UUID id, UUID customerId, String cifNo, String source,
                        String reportPeriod, String fileId, String pulledBy) {
        CibReport r = new CibReport();
        r.id = id; r.customerId = customerId; r.cifNo = cifNo; r.source = source;
        r.reportPeriod = reportPeriod; r.fileId = fileId; r.pulledBy = pulledBy;
        r.status = "PENDING";
        return r;
    }

    void attachStorage(String storageKey) { this.storageKey = storageKey; this.raw = null; }
    void markParsed(String parsedJson) { this.status = "PARSED"; this.parsed = parsedJson; }
    void markFailed(String error) { this.status = "FAILED"; this.error = error; }

    public UUID getId() { return id; }
    public UUID getCustomerId() { return customerId; }
    public String getCifNo() { return cifNo; }
    public String getStatus() { return status; }
    public String getSource() { return source; }
    public String getReportPeriod() { return reportPeriod; }
    public String getFileId() { return fileId; }
    public String getRaw() { return raw; }
    public String getParsed() { return parsed; }
    public String getStorageKey() { return storageKey; }
    public String getError() { return error; }
    public String getPulledBy() { return pulledBy; }
    public Instant getPulledAt() { return pulledAt; }
}

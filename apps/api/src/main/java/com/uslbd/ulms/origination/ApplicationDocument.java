package com.uslbd.ulms.origination;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/** Document metadata; bytes live in MinIO (PLANNING/03, 06 §5). */
@Entity
@Table(name = "application_document", schema = "ulms",
       indexes = @Index(name = "idx_appdoc_application", columnList = "applicationId"))
public class ApplicationDocument {

    @Id private UUID id;
    @Column(name = "application_id") private UUID applicationId;   // nullable since V14: portal demo uploads arrive pre-application
    @Column(name = "doc_type", nullable = false, length = 30) private String docType;
    @Column(name = "storage_key", nullable = false, length = 200) private String storageKey;
    @Column(nullable = false, length = 64) private String sha256;
    @Column(name = "size_bytes", nullable = false) private long sizeBytes;
    @Column(name = "scan_status", nullable = false, length = 10) private String scanStatus = "PENDING";
    @Column(name = "uploaded_by", nullable = false, length = 64) private String uploadedBy;
    @Column(name = "uploaded_at", nullable = false) private Instant uploadedAt = Instant.now();

    protected ApplicationDocument() {}

    static ApplicationDocument of(UUID id, UUID applicationId, String docType,
                                  String storageKey, String sha256, long sizeBytes, String uploadedBy) {
        ApplicationDocument d = new ApplicationDocument();
        d.id = id; d.applicationId = applicationId; d.docType = docType;
        d.storageKey = storageKey; d.sha256 = sha256; d.sizeBytes = sizeBytes;
        d.uploadedBy = uploadedBy;
        return d;
    }

    void markScanned(String scanStatus) { this.scanStatus = scanStatus; }

    public UUID getId() { return id; }
    public UUID getApplicationId() { return applicationId; }
    public String getDocType() { return docType; }
    public String getStorageKey() { return storageKey; }
    public String getSha256() { return sha256; }
    public long getSizeBytes() { return sizeBytes; }
    public String getScanStatus() { return scanStatus; }
    public String getUploadedBy() { return uploadedBy; }
    public Instant getUploadedAt() { return uploadedAt; }
}

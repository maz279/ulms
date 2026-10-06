package com.uslbd.ulms.aml;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/** goAML submission record (Q3.3, V15) — one row per BFIU portal POST. */
@Entity
@Table(name = "goaml_submission", schema = "ulms",
       indexes = @Index(name = "idx_goaml_cif", columnList = "cif_no"))
public class GoamlSubmission {

    @Id private UUID id;
    @Column(name = "cif_no", nullable = false, length = 16) private String cifNo;
    @Column(name = "xml_sha256", nullable = false, length = 64) private String xmlSha256;
    @Column(nullable = false, length = 12) private String status = "PENDING";
    @Column(name = "bfiu_ack", length = 64) private String bfiuAck;
    @Column(name = "submitted_at", nullable = false) private Instant submittedAt = Instant.now();

    protected GoamlSubmission() {}

    static GoamlSubmission pending(UUID id, String cifNo, String xmlSha256) {
        GoamlSubmission g = new GoamlSubmission();
        g.id = id; g.cifNo = cifNo; g.xmlSha256 = xmlSha256;
        return g;
    }

    void accept(String ack) { this.status = "ACCEPTED"; this.bfiuAck = ack; }
    void reject(String reason) { this.status = "REJECTED"; this.bfiuAck = reason; }

    public UUID getId() { return id; }
    public String getCifNo() { return cifNo; }
    public String getXmlSha256() { return xmlSha256; }
    public String getStatus() { return status; }
    public String getBfiuAck() { return bfiuAck; }
    public Instant getSubmittedAt() { return submittedAt; }
}

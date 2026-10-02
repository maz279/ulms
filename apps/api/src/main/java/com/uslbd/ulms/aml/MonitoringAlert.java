package com.uslbd.ulms.aml;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/** Monitoring alert (R10 P-C): VELOCITY or STRUCTURING rule hit on a customer. */
@Entity
@Table(name = "monitoring_alert", schema = "ulms",
       indexes = @Index(name = "idx_monitoring_cif", columnList = "cif_no"))
public class MonitoringAlert {

    @Id private UUID id;
    @Column(name = "cif_no", nullable = false, length = 16) private String cifNo;
    @Column(nullable = false, length = 20) private String rule;   // VELOCITY | STRUCTURING
    @Column(nullable = false, columnDefinition = "text") private String detail;
    @Column(name = "str_raised", nullable = false) private boolean strRaised = false;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    protected MonitoringAlert() {}

    static MonitoringAlert of(UUID id, String cifNo, String rule, String detail) {
        MonitoringAlert m = new MonitoringAlert();
        m.id = id; m.cifNo = cifNo; m.rule = rule; m.detail = detail;
        return m;
    }

    void markStrRaised() { this.strRaised = true; }

    public UUID getId() { return id; }
    public String getCifNo() { return cifNo; }
    public String getRule() { return rule; }
    public String getDetail() { return detail; }
    public boolean isStrRaised() { return strRaised; }
    public Instant getCreatedAt() { return createdAt; }
}

package com.uslbd.ulms.aml;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/** STR filing (R4, V12): recorded per BFIU practice — descriptive reason,
 *  immutable once FILED, exported through the regcon BFIU channel. */
@Entity
@Table(name = "str_report", schema = "ulms",
       indexes = @Index(name = "idx_str_cif", columnList = "cif_no"))
public class StrReport {

    @Id private UUID id;
    @Column(name = "cif_no", nullable = false, length = 16) private String cifNo;
    @Column(nullable = false, columnDefinition = "text") private String reason;
    @Column(name = "amount_minor", nullable = false) private long amountMinor;
    @Column(nullable = false, length = 10) private String status = "FILED";
    @Column(name = "bfiu_ref", nullable = false, length = 24) private String bfiuRef;
    @Column(name = "filed_by", nullable = false, length = 64) private String filedBy;
    @Column(name = "filed_at", nullable = false) private Instant filedAt = Instant.now();

    protected StrReport() {}

    static StrReport filed(UUID id, String cifNo, String reason, long amountMinor,
                           String bfiuRef, String filedBy) {
        StrReport s = new StrReport();
        s.id = id; s.cifNo = cifNo; s.reason = reason;
        s.amountMinor = amountMinor; s.bfiuRef = bfiuRef; s.filedBy = filedBy;
        return s;
    }

    public UUID getId() { return id; }
    public String getCifNo() { return cifNo; }
    public String getReason() { return reason; }
    public long getAmountMinor() { return amountMinor; }
    public String getStatus() { return status; }
    public String getBfiuRef() { return bfiuRef; }
    public String getFiledBy() { return filedBy; }
    public Instant getFiledAt() { return filedAt; }
}

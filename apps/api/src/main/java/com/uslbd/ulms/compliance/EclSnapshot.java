package com.uslbd.ulms.compliance;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

/**
 * IFRS-9 ECL runway snapshot (P4 / 03 mod-compliance): one row per BRPD stage
 * per as-of date. Fields are the runway mandated for Dec 2027 (12 §2 risk 9:
 * "ECL fields built P2; reports assembly-only later") — PD/LGD/EAD calibrated
 * per BRPD class now so the statement assembly later is data-only.
 */
@Entity
@Table(name = "ecl_snapshot", schema = "ulms")
public class EclSnapshot {

    @Id @Column(nullable = false, updatable = false) private UUID id;
    @Column(name = "as_of", nullable = false) private LocalDate asOf;
    @Column(nullable = false, length = 6) private String stage;
    @Column(name = "ifrs_stage", nullable = false) private int ifrsStage;   // 1 | 2 | 3
    @Column(nullable = false) private int loans;
    @Column(name = "ead_minor", nullable = false) private long eadMinor;
    @Column(name = "pd_bp", nullable = false) private int pdBp;
    @Column(name = "lgd_bp", nullable = false) private int lgdBp;
    @Column(name = "ecl_minor", nullable = false) private long eclMinor;
    @Column(name = "brpd_provision_minor", nullable = false) private long brpdProvisionMinor;

    protected EclSnapshot() {}

    static EclSnapshot of(UUID id, LocalDate asOf, String stage, int ifrsStage,
                          int loans, long eadMinor, int pdBp, int lgdBp,
                          long eclMinor, long brpdProvisionMinor) {
        EclSnapshot s = new EclSnapshot();
        s.id = id; s.asOf = asOf; s.stage = stage; s.ifrsStage = ifrsStage;
        s.loans = loans; s.eadMinor = eadMinor; s.pdBp = pdBp; s.lgdBp = lgdBp;
        s.eclMinor = eclMinor; s.brpdProvisionMinor = brpdProvisionMinor;
        return s;
    }

    public UUID getId() { return id; }
    public LocalDate getAsOf() { return asOf; }
    public String getStage() { return stage; }
    public int getIfrsStage() { return ifrsStage; }
    public int getLoans() { return loans; }
    public long getEadMinor() { return eadMinor; }
    public int getPdBp() { return pdBp; }
    public int getLgdBp() { return lgdBp; }
    public long getEclMinor() { return eclMinor; }
    public long getBrpdProvisionMinor() { return brpdProvisionMinor; }
}

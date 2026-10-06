package com.uslbd.ulms.assessment;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

/** One bureau facility line from a CIB report (03 mod-assessment). */
@Entity
@Table(name = "cib_facility", schema = "ulms",
       indexes = @Index(name = "idx_cibfacility_report", columnList = "cib_report_id"))
public class CibFacility {

    @Id @Column(nullable = false, updatable = false) private UUID id;
    @Column(name = "cib_report_id", nullable = false) private UUID cibReportId;
    @Column(name = "lender_code", length = 20) private String lenderCode;
    @Column(name = "lender_name", length = 120) private String lenderName;
    @Column(name = "facility_type", length = 30) private String facilityType;
    @Column(name = "limit_minor") private Long limitMinor;
    @Column(name = "outstanding_minor") private Long outstandingMinor;
    @Column(name = "overdue_minor") private Long overdueMinor;
    @Column(name = "installment_minor") private Long installmentMinor;
    private Integer dpd;
    @Column(length = 6) private String classification;
    @Column(name = "last_payment_date") private LocalDate lastPaymentDate;
    @Column(name = "repayment_track", length = 24) private String repaymentTrack;   // 24m rhythm (03)

    protected CibFacility() {}

    static CibFacility of(UUID id, UUID cibReportId,
                          com.uslbd.ulms.integration.cib.CibFixedWidthParser.Facility f) {
        CibFacility e = new CibFacility();
        e.id = id; e.cibReportId = cibReportId;
        e.lenderCode = f.lenderCode(); e.lenderName = f.lenderName();
        e.facilityType = f.facilityType();
        e.limitMinor = f.limitMinor(); e.outstandingMinor = f.outstandingMinor();
        e.overdueMinor = f.overdueMinor(); e.installmentMinor = f.installmentMinor();
        e.dpd = f.dpd(); e.classification = f.classification();
        e.lastPaymentDate = f.lastPaymentDate() == null ? null
                : LocalDate.parse(f.lastPaymentDate().substring(0, 4) + "-"
                        + f.lastPaymentDate().substring(4, 6) + "-"
                        + f.lastPaymentDate().substring(6, 8));
        e.repaymentTrack = f.repaymentTrack();
        return e;
    }

    public UUID getId() { return id; }
    public UUID getCibReportId() { return cibReportId; }
    public String getLenderCode() { return lenderCode; }
    public String getLenderName() { return lenderName; }
    public String getFacilityType() { return facilityType; }
    public Long getLimitMinor() { return limitMinor; }
    public Long getOutstandingMinor() { return outstandingMinor; }
    public Long getOverdueMinor() { return overdueMinor; }
    public Long getInstallmentMinor() { return installmentMinor; }
    public Integer getDpd() { return dpd; }
    public String getClassification() { return classification; }
    public LocalDate getLastPaymentDate() { return lastPaymentDate; }
    public String getRepaymentTrack() { return repaymentTrack; }
}

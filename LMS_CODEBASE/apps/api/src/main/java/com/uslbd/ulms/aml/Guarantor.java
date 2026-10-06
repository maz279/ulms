package com.uslbd.ulms.aml;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.Instant;
import java.util.UUID;

/**
 * Guarantor registry row (R4, V12): collateral-adjacent party attached to a
 * customer, CIB-checked at attach time (score snapshot + CLEAR/REFER).
 */
@Entity
@Table(name = "guarantor", schema = "ulms",
       indexes = @Index(name = "idx_guarantor_customer", columnList = "customer_id"))
public class Guarantor {

    @Id private UUID id;
    @Column(name = "customer_id", nullable = false) private UUID customerId;
    @Column(nullable = false, length = 120) private String name;
    @Column(length = 20) private String nid;
    @Column(nullable = false, length = 14) private String mobile;
    @Column(name = "cib_score") private Integer cibScore;
    @Column(name = "cib_status", length = 8) private String cibStatus;   // CLEAR | REFER
    @Column(name = "linked_amount_minor", nullable = false) private long linkedAmountMinor;
    @Column(nullable = false, length = 10) private String status = "ACTIVE";
    @Column(name = "checked_at") private LocalDate checkedAt;
    @Column(name = "created_by", nullable = false, length = 64) private String createdBy;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    protected Guarantor() {}

    static Guarantor attach(UUID id, UUID customerId, String name, String nid, String mobile,
                            int cibScore, String cibStatus, long linkedAmountMinor,
                            String createdBy) {
        Guarantor g = new Guarantor();
        g.id = id; g.customerId = customerId; g.name = name; g.nid = nid; g.mobile = mobile;
        g.cibScore = cibScore; g.cibStatus = cibStatus;
        g.linkedAmountMinor = linkedAmountMinor;
        g.createdBy = createdBy;
        g.checkedAt = LocalDate.now();
        return g;
    }

    public UUID getId() { return id; }
    public UUID getCustomerId() { return customerId; }
    public String getName() { return name; }
    public String getNid() { return nid; }
    public String getMobile() { return mobile; }
    public Integer getCibScore() { return cibScore; }
    public String getCibStatus() { return cibStatus; }
    public long getLinkedAmountMinor() { return linkedAmountMinor; }
    public String getStatus() { return status; }
    public LocalDate getCheckedAt() { return checkedAt; }
    public String getCreatedBy() { return createdBy; }
    public Instant getCreatedAt() { return createdAt; }
}

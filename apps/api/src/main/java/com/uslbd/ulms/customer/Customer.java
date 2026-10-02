package com.uslbd.ulms.customer;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

/**
 * Customer mirror for the UI (PLANNING/04 §2). The lending truth is Fineract;
 * this row is what our API serves. Names are stored per language and rendered
 * ONE per request (bilingual separation, PLANNING/07 §6).
 */
@Entity
@Table(name = "customer", schema = "ulms",
       indexes = {
           @Index(name = "idx_customer_branch", columnList = "branchCode"),
           @Index(name = "idx_customer_mobile", columnList = "mobile")
       })
public class Customer {

    /** Product/segment vocabulary (PLANNING/03 mod-customer). */
    public enum Segment { RETAIL, SME, CORPORATE, AGRI }

    @Id @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "cif_no", nullable = false, unique = true, length = 16)
    private String cifNo;

    @Column(name = "name_en", nullable = false, length = 140)
    private String nameEn;

    @Column(name = "name_bn", length = 140)
    private String nameBn;

    @Column(nullable = false, length = 20)
    private String segment;        // RETAIL | SME | CORPORATE | AGRI

    @Column(nullable = false, length = 16)
    private String mobile;

    /** Masked only — full NID never stored in ULMS (PLANNING/06 §5). */
    @Column(name = "nid_masked", length = 24)
    private String nidMasked;

    @Column(name = "kyc_status", nullable = false, length = 12)
    private String kycStatus = "PENDING";

    @Column(name = "branch_code", nullable = false, length = 8)
    private String branchCode;

    @Column(name = "fineract_client_id", unique = true)
    private Long fineractClientId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    // R10 P-B: AML risk class + merge bookkeeping + KYC refresh tracking
    @Column(nullable = false, length = 8) private String risk = "Low";
    @Column(name = "merged_into_cif", length = 16) private String mergedIntoCif;
    @Column(name = "last_kyc_at") private Instant lastKycAt;

    protected Customer() {}

    static Customer newCustomer(UUID id, String cifNo, String nameEn, String nameBn,
                                String segment, String mobile, String branchCode) {
        Customer c = new Customer();
        c.id = id; c.cifNo = cifNo; c.nameEn = nameEn; c.nameBn = nameBn;
        c.segment = segment; c.mobile = mobile; c.branchCode = branchCode;
        return c;
    }

    void attachFineract(long fineractClientId) { this.fineractClientId = fineractClientId; }
    void kycVerified() { this.kycStatus = "VERIFIED"; this.lastKycAt = Instant.now(); }
    void kycRejected() { this.kycStatus = "REJECTED"; }
    /** R10 P-B: AML risk drives the EDD posture + KYC refresh cycle (1/2/3 y). */
    void updateRisk(String risk) { this.risk = risk; }
    /** R10 P-B: dedupe — the row survives only as a merge tombstone. */
    void markMerged(String survivorCif) { this.mergedIntoCif = survivorCif; }

    /** ULMS stores masked NID only (06 §5): first name kept? No — prototype pattern ****5678. */
    void maskNid(String fullNid) {
        if (fullNid == null || fullNid.isBlank()) return;
        this.nidMasked = "****" + fullNid.substring(Math.max(0, fullNid.length() - 4));
    }

    public UUID getId() { return id; }
    public String getCifNo() { return cifNo; }
    public String getNameEn() { return nameEn; }
    public String getNameBn() { return nameBn; }
    public String getSegment() { return segment; }
    public String getMobile() { return mobile; }
    public String getNidMasked() { return nidMasked; }
    public String getKycStatus() { return kycStatus; }
    public String getBranchCode() { return branchCode; }
    public Long getFineractClientId() { return fineractClientId; }
    public Instant getCreatedAt() { return createdAt; }
    public String getRisk() { return risk; }
    public String getMergedIntoCif() { return mergedIntoCif; }
    public Instant getLastKycAt() { return lastKycAt; }
}

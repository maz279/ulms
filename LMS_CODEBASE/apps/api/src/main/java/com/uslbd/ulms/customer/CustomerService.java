package com.uslbd.ulms.customer;

import com.uslbd.ulms.integration.fineract.FineractPort;
import com.uslbd.ulms.integration.nid.NidPort;
import com.uslbd.ulms.integration.screening.ScreeningPort;
import com.uslbd.ulms.platform.audit.AuditService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class CustomerService {

    private final CustomerRepository repository;
    private final FineractPort fineract;
    private final AuditService audit;
    private final NidPort nid;
    private final KycCheckRepository kycChecks;
    private final ScreeningHitRepository screeningHits;
    private final ScreeningPort screening;

    CustomerService(CustomerRepository repository, FineractPort fineract,
                    NidPort nid, KycCheckRepository kycChecks,
                    ScreeningHitRepository screeningHits, ScreeningPort screening,
                    AuditService audit) {
        this.repository = repository; this.fineract = fineract; this.nid = nid;
        this.kycChecks = kycChecks; this.screeningHits = screeningHits;
        this.screening = screening; this.audit = audit;
    }

    /**
     * One transaction: ULMS mirror + Fineract client + audit row.
     * P0 note: the Fineract call is synchronous here for the walking slice;
     * P1 moves it to the transactional-outbox dispatcher (PLANNING/01 §5A)
     * with a reconciliation job — interface unchanged.
     */
    @Transactional
    public Customer create(CustomerCreateRequest req, UUID idempotencyKey, String actor, UUID requestId) {
        Customer c = Customer.newCustomer(UUID.randomUUID(), nextCif(), req.nameEn(),
                req.nameBn(), req.segment().name(), req.mobile(), req.branchCode());
        c.maskNid(req.nid());                     // 06 §5: masked only, full never stored
        // Assigned UUID id ⇒ Spring Data treats save() as merge(); the MANAGED
        // instance is the return value — mutate that one or updates never flush.
        c = repository.save(c);

        long fineractClientId = fineract.createClient(new FineractPort.FineractClient(
                req.nameEn(), req.nameBn(), req.mobile(), req.branchCode(),
                req.nameEn()));
        c.attachFineract(fineractClientId);

        audit.record(actor, "CUSTOMER_CREATED", "customer", c.getId(),
                "{\"cif\":\"" + c.getCifNo() + "\",\"fineractClientId\":" + fineractClientId + "}",
                requestId);
        return c;
    }

    @Transactional(readOnly = true)
    CustomerPageView list(int page, int size) {
        return list(page, size, null);
    }

    /**
     * Branch-scoped roster (P5 audit F4, 06 §1): a non-null {@code branch}
     * restricts the page to that branch — the caller's branch_code claim as
     * resolved by the controller, never a client-supplied value.
     */
    @Transactional(readOnly = true)
    CustomerPageView list(int page, int size, String branch) {
        var all = repository.findAll().stream()
                .filter(c -> branch == null || branch.equalsIgnoreCase(c.getBranchCode()))
                .sorted(java.util.Comparator.comparing(Customer::getCreatedAt).reversed())
                .toList();   // newest first — the just-created row is visible
        return CustomerPageView.of(all, page, size);
    }

    @Transactional(readOnly = true)
    public Customer get(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No customer " + id));
    }

    /** R10 P-B: AML risk class update (EDD posture + refresh cycle driver). */
    @Transactional
    public Customer setRisk(Customer c, String risk) {
        c.updateRisk(risk);
        return repository.save(c);
    }

    /** 360 lookup by CIF number (03: `GET /customers/{cif}` accepts the CIF). */
    @Transactional(readOnly = true)
    public Customer byCif(String cifNo) {
        return repository.findByCifNo(cifNo)
                .orElseThrow(() -> new NoSuchElementException("No customer " + cifNo));
    }

    /** All customers sharing a registered mobile (portal login disambiguates
     *  by loan ownership — see PortalController; kept here because only this
     *  module owns customer rows). */
    @Transactional(readOnly = true)
    public List<Customer> allByMobile(String mobile) {
        return repository.findAll().stream()
                .filter(c -> mobile != null && mobile.equals(c.getMobile()))
                .toList();
    }

    /**
     * Cross-module read: Fineract client id for an application's customer (03).
     * Legacy rows created before the JPA-merge fix can lack the link — those
     * self-heal here. Fineract enforces globally-unique mobileNo, so the
     * existing client is looked up and RE-ATTACHED (never duplicated); only a
     * mobile Fineract has never seen creates a new client. Audited as
     * FINERACT_CLIENT_BACKFILLED.
     */
    @Transactional
    public long fineractClientIdOf(java.util.UUID customerId) {
        Customer c = repository.findById(customerId)
                .orElseThrow(() -> new NoSuchElementException("No customer " + customerId));
        Long fineractId = c.getFineractClientId();
        if (fineractId != null) return fineractId;

        long linked = fineract.findClientIdByMobile(c.getMobile())
                .orElseGet(() -> fineract.createClient(new FineractPort.FineractClient(
                        c.getNameEn(), c.getNameBn(), c.getMobile(), c.getBranchCode(),
                        c.getNameEn())));
        c.attachFineract(linked);   // c is managed — dirty-check flushes the update
        audit.record("system:backfill", "FINERACT_CLIENT_BACKFILLED", "customer", customerId,
                "{\"fineractClientId\":" + linked + "}", java.util.UUID.randomUUID());
        return linked;
    }

    /**
     * NIDW e-KYC refresh (03 mod-customer `kyc-refresh`, 11 §2): every attempt
     * persists a kyc_check history row. VERIFIED/REJECTED transition the
     * customer; ERROR leaves PENDING actionable (officer fallback: retry or
     * manual verification) instead of failing the request — 06 §4 status machine.
     */
    @Transactional
    public Customer verifyKyc(java.util.UUID customerId, String nidNumber,
                              java.time.LocalDate dob, String actor) {
        Customer c = get(customerId);
        var result = nid.verify(new NidPort.NidQuery(nidNumber, c.getNameEn(), dob));
        kycChecks.save(KycCheck.of(UUID.randomUUID(), customerId, result.status(),
                result.referenceId()));
        switch (result.status()) {
            case NidPort.NidResult.VERIFIED -> { c.kycVerified(); c.maskNid(nidNumber); }
            case NidPort.NidResult.REJECTED -> c.kycRejected();
            default -> { /* ERROR: status machine parks at PENDING for officer fallback */ }
        }
        audit.record(actor, "KYC_" + result.status(), "customer", customerId,
                "{\"reference\":\"" + result.referenceId() + "\"}", UUID.randomUUID());
        return c;
    }

    /** KYC attempt history for the 360 view (newest first). */
    @Transactional(readOnly = true)
    public List<KycCheck> kycChecks(java.util.UUID customerId) {
        return kycChecks.findAllByCustomerIdOrderByCheckedAtDesc(customerId);
    }

    /** Screening history for the 360 view (newest first). */
    @Transactional(readOnly = true)
    public List<ScreeningHit> screeningHits(java.util.UUID customerId) {
        return screeningHits.findAllByCustomerIdOrderByCheckedAtDesc(customerId);
    }

    /**
     * Sanctions/PEP screening (06 §8 P1 hook): persists hits, audits the check.
     * Hits do NOT block onboarding — they route to a compliance review task in P2.
     */
    @Transactional
    public List<ScreeningHit> screen(java.util.UUID customerId, String actor) {
        Customer c = get(customerId);
        var result = screening.screen(c.getNameEn());
        result.matches().forEach(m -> screeningHits.save(ScreeningHit.of(
                UUID.randomUUID(), customerId, m.listName(), m.matchedName())));
        audit.record(actor, "CUSTOMER_SCREENED", "customer", customerId,
                "{\"hits\":" + result.matches().size() + "}", UUID.randomUUID());
        return screeningHits.findAllByCustomerIdOrderByCheckedAtDesc(customerId);
    }

    private String nextCif() {
        return "CIF-" + (100_000 + repository.count() + 1);
    }
}

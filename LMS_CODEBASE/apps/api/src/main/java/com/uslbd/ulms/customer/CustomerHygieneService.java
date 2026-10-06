package com.uslbd.ulms.customer;

import com.uslbd.ulms.platform.audit.AuditService;
import com.uslbd.ulms.platform.outbox.OutboxService;
import jakarta.persistence.EntityManager;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * Customer hygiene jobs (R10 P-B, SRS 3.1.1 + PLAN-06 §4):
 *  - merge-duplicate: re-points every referencing row to the surviving CIF
 *    and tombstones the duplicate (idempotent — re-merge is a no-op);
 *  - KYC refresh cycle: high 1 y / medium 2 y / low 3 y — the nightly scan
 *    raises KYC_REFRESH_DUE audit + outbox events for the compliance queue.
 */
@Service
public class CustomerHygieneService {

    private final CustomerRepository customers;
    private final AuditService audit;
    private final OutboxService outbox;
    private final EntityManager em;

    CustomerHygieneService(CustomerRepository customers, AuditService audit,
                           OutboxService outbox, EntityManager em) {
        this.customers = customers; this.audit = audit;
        this.outbox = outbox; this.em = em;
    }

    /** Months allowed between KYC refreshes by AML risk class. */
    static int refreshMonths(String risk) {
        return switch (risk == null ? "Low" : risk) {
            case "High" -> 12;
            case "Medium" -> 24;
            default -> 36;
        };
    }

    /**
     * Merge a duplicate customer into the survivor. Re-points applications,
     * loans, guarantors and collateral via bulk updates, then tombstones the
     * duplicate (merged_into_cif). Idempotent: merging an already-merged
     * row into the same survivor returns without touching anything.
     */
    @Transactional
    public MergeResult mergeDuplicate(String survivorCif, String duplicateCif, String actor) {
        if (survivorCif.equals(duplicateCif)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "cannot merge a customer into itself");
        }
        Customer survivor = customers.findByCifNo(survivorCif)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "survivor " + survivorCif + " not found"));
        Customer duplicate = customers.findByCifNo(duplicateCif)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "duplicate " + duplicateCif + " not found"));
        if (duplicate.getMergedIntoCif() != null) {
            if (duplicate.getMergedIntoCif().equals(survivorCif)) {
                return new MergeResult(survivorCif, duplicateCif, 0, 0, 0, 0);   // replay
            }
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    duplicateCif + " already merged into " + duplicate.getMergedIntoCif());
        }

        int apps = em.createQuery(
                        "update com.uslbd.ulms.origination.Application a set a.customerId = :surv "
                                + "where a.customerId = :dup")
                .setParameter("surv", survivor.getId())
                .setParameter("dup", duplicate.getId())
                .executeUpdate();
        int loans = em.createQuery(
                        "update com.uslbd.ulms.servicing.Loan l set l.customerId = :surv "
                                + "where l.customerId = :dup")
                .setParameter("surv", survivor.getId())
                .setParameter("dup", duplicate.getId())
                .executeUpdate();
        int guarantors = em.createQuery(
                        "update com.uslbd.ulms.aml.Guarantor g set g.customerId = :surv "
                                + "where g.customerId = :dup")
                .setParameter("surv", survivor.getId())
                .setParameter("dup", duplicate.getId())
                .executeUpdate();
        int collateral = em.createQuery(
                        "update com.uslbd.ulms.assessment.Collateral c set c.customerId = :surv "
                                + "where c.customerId = :dup")
                .setParameter("surv", survivor.getId())
                .setParameter("dup", duplicate.getId())
                .executeUpdate();

        duplicate.markMerged(survivorCif);
        audit.record(actor, "CUSTOMER_MERGED", "customer", duplicate.getId(),
                "{\"survivor\":\"" + survivorCif + "\",\"applications\":" + apps
                        + ",\"loans\":" + loans + "}", UUID.randomUUID());
        outbox.emit("customer", survivor.getId(), "CUSTOMER_MERGED",
                java.util.Map.of("survivorCif", survivorCif, "duplicateCif", duplicateCif));
        return new MergeResult(survivorCif, duplicateCif, apps, loans, guarantors, collateral);
    }

    /** Nightly 03:15 — KYC refresh due-dates by risk class. */
    @Scheduled(cron = "0 15 3 * * *")
    public void nightly() {
        runOnce(LocalDate.now());
    }

    /** One pass; returns the number of due refresh events raised. */
    @Transactional
    public int runOnce(LocalDate today) {
        int raised = 0;
        for (Customer c : customers.findAll()) {
            if (c.getMergedIntoCif() != null) continue;
            Instant anchor = c.getLastKycAt() != null ? c.getLastKycAt() : c.getCreatedAt();
            long monthsSince = ChronoUnit.MONTHS.between(
                    LocalDate.ofInstant(anchor, java.time.ZoneId.of("Asia/Dhaka")), today);
            if (monthsSince < refreshMonths(c.getRisk())) continue;
            audit.record("system:kyc", "KYC_REFRESH_DUE", "customer", c.getId(),
                    "{\"risk\":\"" + c.getRisk() + "\",\"monthsSince\":" + monthsSince + "}",
                    UUID.randomUUID());
            outbox.emit("customer", c.getId(), "KYC_REFRESH_DUE",
                    java.util.Map.of("cif", c.getCifNo(), "risk", c.getRisk()));
            raised++;
        }
        return raised;
    }

    public record MergeResult(String survivorCif, String duplicateCif,
                              int applications, int loans, int guarantors, int collateral) {}
}

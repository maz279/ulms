package com.uslbd.ulms.customer360;

import com.uslbd.ulms.customer.Customer;
import com.uslbd.ulms.customer.CustomerService;
import com.uslbd.ulms.customer.KycCheck;
import com.uslbd.ulms.customer.ScreeningHit;
import com.uslbd.ulms.origination.Application;
import com.uslbd.ulms.origination.OriginationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Customer 360 aggregate (PLANNING/03: `GET /customers/{cif}` — 360 view).
 * Composition module: reads customer + origination exposed APIs; neither of
 * those modules depends on this one (modulith graph stays acyclic, ADR-001).
 */
@RestController
@RequestMapping("/api/v1/customers")
class Customer360Controller {

    private final CustomerService customers;
    private final OriginationService origination;

    Customer360Controller(CustomerService customers, OriginationService origination) {
        this.customers = customers; this.origination = origination;
    }

    /** {id} accepts a UUID or a CIF number (prototype navigates by CIF). */
    @GetMapping("/{idOrCif}")
    Customer360View byIdOrCif(@PathVariable String idOrCif) {
        Customer c = isUuid(idOrCif)
                ? customers.get(UUID.fromString(idOrCif))
                : customers.byCif(idOrCif);
        return Customer360View.of(c,
                origination.applicationsOf(c.getId()),
                customers.kycChecks(c.getId()),
                customers.screeningHits(c.getId()));
    }

    private static boolean isUuid(String s) {
        try { UUID.fromString(s); return true; } catch (IllegalArgumentException e) { return false; }
    }

    record AppLine(UUID id, String appNo, String stage, long amountMinor,
                   int tenorMonths, java.time.Instant createdAt) {
        static AppLine of(Application a) {
            return new AppLine(a.getId(), a.getAppNo(), a.getStage().name(),
                    a.getAmountMinor(), a.getTenorMonths(), a.getCreatedAt());
        }
    }

    record KycLine(String status, String referenceId, java.time.Instant checkedAt) {
        static KycLine of(KycCheck k) { return new KycLine(k.getStatus(), k.getReferenceId(), k.getCheckedAt()); }
    }

    record ScreeningLine(String listName, String matchedName, java.time.Instant checkedAt) {
        static ScreeningLine of(ScreeningHit s) {
            return new ScreeningLine(s.getListName(), s.getMatchedName(), s.getCheckedAt());
        }
    }

    record Customer360View(UUID id, String cifNo, CustomerViewLite customer,
                           List<AppLine> applications, List<KycLine> kycChecks,
                           List<ScreeningLine> screeningHits) {
        record CustomerViewLite(String nameEn, String nameBn, String segment, String mobile,
                                String branchCode, String kycStatus, String nidMasked,
                                Long fineractClientId) {}
        static Customer360View of(Customer c, List<Application> apps,
                                  List<KycCheck> kyc, List<ScreeningHit> hits) {
            return new Customer360View(c.getId(), c.getCifNo(),
                    new CustomerViewLite(c.getNameEn(), c.getNameBn(), c.getSegment(),
                            c.getMobile(), c.getBranchCode(), c.getKycStatus(),
                            c.getNidMasked(), c.getFineractClientId()),
                    apps.stream().map(AppLine::of).toList(),
                    kyc.stream().map(KycLine::of).toList(),
                    hits.stream().map(ScreeningLine::of).toList());
        }
    }
}

package com.uslbd.ulms.assessment;

import com.uslbd.ulms.platform.audit.AuditService;
import com.uslbd.ulms.platform.outbox.OutboxService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Collateral registry (R10 P-C, PLAN-03 / USER-CR §5) on the V5 collateral
 * table, extended by V14 with customer scope + forced-sale value. Validates
 * valuation freshness (report ≤ 1 year) and FSV ≤ MV, and runs the LTV gate
 * — acceptable = Σ min(MV, FSV) × LTV cap; a breach raises the
 * approval-condition event instead of silently passing.
 */
@Service
public class CollateralRegistryService
        implements com.uslbd.ulms.compliance.CollateralValuePort {

    /** Default LTV caps by collateral type (USER-CR §5) — bank-tunable. */
    static int defaultLtvBp(String collateralType) {
        return switch (collateralType == null ? "" : collateralType) {
            case "PROPERTY", "RESIDENTIAL" -> 7000;
            case "COMMERCIAL" -> 6000;
            case "LAND" -> 5000;
            case "FDR" -> 9000;
            case "GOLD" -> 8000;
            default -> 5000;
        };
    }

    private final CollateralRepository collateral;
    private final AuditService audit;
    private final OutboxService outbox;

    public CollateralRegistryService(CollateralRepository collateral, AuditService audit,
                                     OutboxService outbox) {
        this.collateral = collateral; this.audit = audit; this.outbox = outbox;
    }

    @Transactional(readOnly = true)
    public List<Collateral> ofCustomer(UUID customerId) {
        return collateral.findAllByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    /** Register with validation (valuation ≤ 1 y, FSV ≤ MV, no future dates). */
    @Transactional
    public Collateral register(RegisterRequest req, String actor) {
        if (req.valuedOn() == null || req.valuedOn().isAfter(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "valuation date required and cannot be future-dated");
        }
        if (req.valuedOn().isBefore(LocalDate.now().minusYears(1))) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "valuation report older than 1 year (USER-CR §5)");
        }
        if (req.forcedSaleValueMinor() > req.marketValueMinor()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "forced-sale value cannot exceed market value");
        }
        Collateral c = collateral.save(Collateral.registered(UUID.randomUUID(),
                req.applicationId(), req.customerId(), req.type(), req.description(),
                req.marketValueMinor(), req.forcedSaleValueMinor(),
                req.valuedOn(), req.insuredUntil(), actor));
        audit.record(actor, "COLLATERAL_REGISTERED", "collateral", c.getId(),
                "{\"type\":\"" + c.getCollateralType() + "\",\"mv\":" + c.getValueMinor()
                        + ",\"fsv\":" + c.getForcedSaleValueMinor() + "}",
                UUID.randomUUID());
        return c;
    }

    /** R10 P-F: total recognized realizable value (min of MV/FSV) for Basel CRM. */
    @Override
    @Transactional(readOnly = true)
    public long realizableOf(UUID customerId) {
        return activeOf(customerId).stream()
                .mapToLong(c -> Math.min(c.getValueMinor(), c.getForcedSaleValueMinor()))
                .sum();
    }

    /**
     * LTV verdict for an exposure against the customer's ACTIVE securities.
     * Breach emits the approval-condition event (LTV_BREACH outbox + audit).
     */
    @Transactional
    public LtvVerdict checkLtv(UUID customerId, long exposureMinor, int productMaxLtvBp,
                               String actor) {
        List<Collateral> active = activeOf(customerId);
        long realizable = realizableOf(customerId);
        int ltvBp = productMaxLtvBp > 0 ? productMaxLtvBp
                : (active.isEmpty() ? 0 : defaultLtvBp(active.get(0).getCollateralType()));
        long acceptable = realizable * ltvBp / 10_000;
        boolean breach = exposureMinor > acceptable;
        if (breach) {
            audit.record(actor, "COLLATERAL_LTV_BREACH", "customer", customerId,
                    "{\"exposure\":" + exposureMinor + ",\"acceptable\":" + acceptable
                            + ",\"ltvBp\":" + ltvBp + "}", UUID.randomUUID());
            outbox.emit("customer", customerId, "LTV_BREACH",
                    Map.of("exposureMinor", exposureMinor, "acceptableMinor", acceptable));
        }
        return new LtvVerdict(exposureMinor, realizable, ltvBp, acceptable, breach);
    }

    private List<Collateral> activeOf(UUID customerId) {
        return ofCustomer(customerId).stream()
                .filter(c -> "ACTIVE".equals(c.getStatus())).toList();
    }

    public record RegisterRequest(UUID applicationId, UUID customerId, String type,
                                  String description, long marketValueMinor,
                                  long forcedSaleValueMinor, LocalDate valuedOn,
                                  LocalDate insuredUntil) {}
    public record LtvVerdict(long exposureMinor, long realizableMinor, int ltvBp,
                             long acceptableMinor, boolean breach) {}
}

package com.uslbd.ulms.product;

import com.uslbd.ulms.platform.audit.AuditService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

/**
 * Product engine (R3): versioned no-code configuration with maker-checker —
 * drafts are amendable, activation retires the previous ACTIVE version.
 */
@Service
public class ProductService {

    private final LoanProductRepository products;
    private final AuditService audit;

    ProductService(LoanProductRepository products, AuditService audit) {
        this.products = products; this.audit = audit;
    }

    @Transactional(readOnly = true)
    public List<LoanProduct> list(boolean includeInactive) {
        return includeInactive ? products.findAll()
                : products.findByStatusOrderByCodeAsc(LoanProduct.Status.ACTIVE);
    }

    /** Rate lookup that never throws — for callers inside a live transaction
     *  where a 404-through-proxy would mark the shared tx rollback-only. */
    @Transactional(readOnly = true)
    public Integer rateBpOrNull(String code) {
        return products.findByCodeOrderByVersionDesc(code).stream()
                .filter(p -> p.getStatus() != LoanProduct.Status.RETIRED)
                .findFirst()
                .map(LoanProduct::getRateBp)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public LoanProduct active(String code) {
        // "live" product = newest non-RETIRED version (DRAFT before maker-checker
        // activation, ACTIVE after) — RETIRED rows keep history only
        return products.findByCodeOrderByVersionDesc(code).stream()
                .filter(p -> p.getStatus() != LoanProduct.Status.RETIRED)
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "product " + code + " not found"));
    }

    @Transactional
    public LoanProduct create(String code, String nameEn, String nameBn,
                              long minAmountMinor, long maxAmountMinor,
                              int tenorMinMonths, int tenorMaxMonths,
                              int rateBp, String actor) {
        if (minAmountMinor <= 0 || maxAmountMinor < minAmountMinor) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "min/max amount bounds invalid");
        }
        // one live version per code at a time (DRAFT or ACTIVE): superseding
        // happens via activate, not by stacking drafts
        boolean liveExists = products.findByCodeOrderByVersionDesc(code).stream()
                .anyMatch(p -> p.getStatus() != LoanProduct.Status.RETIRED);
        if (liveExists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "active version exists for " + code + " — version it instead");
        }
        var p = LoanProduct.draft(UUID.randomUUID(), code, nameEn, nameBn,
                minAmountMinor, maxAmountMinor, tenorMinMonths, tenorMaxMonths,
                LoanProduct.RateType.FIXED, rateBp, actor);
        products.save(p);
        audit.record(actor, "PRODUCT_CREATE", code, p.getId(),
                "\"v1 draft max " + maxAmountMinor + " minor\"", UUID.randomUUID());
        return p;
    }

    @Transactional
    public LoanProduct activate(String code, String actor) {
        var draft = products.findByCodeOrderByVersionDesc(code).stream()
                .filter(p -> p.getStatus() == LoanProduct.Status.DRAFT)
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                        "no DRAFT " + code + " to activate"));
        products.findByCodeAndStatus(code, LoanProduct.Status.ACTIVE)
                .ifPresent(LoanProduct::retire);
        draft.activate();
        audit.record(actor, "PRODUCT_ACTIVATE", code, draft.getId(),
                "\"activated per maker-checker\"", UUID.randomUUID());
        return draft;
    }

    public LoanProduct.Eligibility eligibility(String code, long amountMinor, int tenorMonths) {
        return active(code).eligibility(amountMinor, tenorMonths);
    }
}

package com.uslbd.ulms.assessment;

import com.uslbd.ulms.platform.ApiList;
import com.uslbd.ulms.platform.AuthPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Collateral registry API (R10 P-C, USER-CR §5): registration with
 * valuation rules, customer portfolio, and the LTV verdict used as an
 * approval condition.
 */
@RestController
class CollateralController {

    private final CollateralRegistryService registry;

    CollateralController(CollateralRegistryService registry) {
        this.registry = registry;
    }

    @GetMapping("/api/v1/customers/{customerId}/collateral")
    @PreAuthorize("hasAnyRole('branch-officer','credit-analyst','branch-manager','regional-manager','ho-credit','compliance','admin')")
    ApiList<Collateral> ofCustomer(@PathVariable UUID customerId) {
        return ApiList.of(registry.ofCustomer(customerId));
    }

    @PostMapping("/api/v1/customers/{customerId}/collateral")
    @PreAuthorize("hasAnyRole('branch-officer','credit-analyst','admin')")
    ResponseEntity<Collateral> register(@PathVariable UUID customerId,
                                        @RequestBody Map<String, Object> body,
                                        Authentication auth) {
        var req = new CollateralRegistryService.RegisterRequest(
                body.get("applicationId") == null ? null
                        : UUID.fromString(body.get("applicationId").toString()),
                customerId,
                str(body.get("type")),
                str(body.get("description")),
                num(body.get("marketValueMinor")),
                num(body.get("forcedSaleValueMinor")),
                body.get("valuedOn") == null ? null : java.time.LocalDate.parse(str(body.get("valuedOn"))),
                body.get("insuredUntil") == null ? null : java.time.LocalDate.parse(str(body.get("insuredUntil"))));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(registry.register(req, AuthPrincipal.actorOf(auth)));
    }

    /** LTV verdict for a proposed/actual exposure (breach ⇒ approval condition). */
    @GetMapping("/api/v1/customers/{customerId}/collateral/ltv")
    @PreAuthorize("hasAnyRole('credit-analyst','branch-manager','regional-manager','ho-credit','compliance','admin')")
    CollateralRegistryService.LtvVerdict ltv(@PathVariable UUID customerId,
                                             @RequestParam long exposureMinor,
                                             @RequestParam(defaultValue = "0") int productMaxLtvBp,
                                             Authentication auth) {
        return registry.checkLtv(customerId, exposureMinor, productMaxLtvBp,
                AuthPrincipal.actorOf(auth));
    }

    private static String str(Object o) { return o == null ? null : String.valueOf(o); }
    private static long num(Object o) {
        if (o instanceof Number n) return n.longValue();
        throw new org.springframework.web.server.ResponseStatusException(
                HttpStatus.UNPROCESSABLE_ENTITY, "numeric field required");
    }
}

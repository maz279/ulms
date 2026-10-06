package com.uslbd.ulms.customer;

import com.uslbd.ulms.platform.ApiList;
import com.uslbd.ulms.platform.AuthPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Customer hygiene API (R10 P-B): duplicate merge + risk class. KYC refresh
 * runs on its nightly cycle (compliance queue consumes the events).
 */
@RestController
@RequestMapping("/api/v1/customers")
class CustomerHygieneController {

    private final CustomerHygieneService hygiene;
    private final CustomerService customers;

    CustomerHygieneController(CustomerHygieneService hygiene, CustomerService customers) {
        this.hygiene = hygiene; this.customers = customers;
    }

    /** Merge a duplicate CIF into the survivor (idempotent; re-points all rows). */
    @PostMapping("/{survivorCif}/merge-duplicate")
    @PreAuthorize("hasAnyRole('admin','compliance')")
    ResponseEntity<CustomerHygieneService.MergeResult> merge(
            @PathVariable String survivorCif,
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        Object dup = body.get("duplicateCif");
        if (dup == null || dup.toString().isBlank()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_ENTITY, "duplicateCif required");
        }
        return ResponseEntity.ok().body(
                hygiene.mergeDuplicate(survivorCif, dup.toString(), AuthPrincipal.actorOf(auth)));
    }

    /** Update the AML risk class (drives EDD posture + the 1/2/3-y refresh cycle). */
    @PostMapping("/{cif}/risk")
    @PreAuthorize("hasAnyRole('compliance','admin')")
    Map<String, Object> updateRisk(@PathVariable String cif,
                                   @RequestBody Map<String, Object> body) {
        Object risk = body.get("risk");
        if (risk == null || !java.util.List.of("Low", "Medium", "High").contains(risk.toString())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_ENTITY, "risk must be Low|Medium|High");
        }
        customers.setRisk(customers.byCif(cif), risk.toString());
        return Map.of("cifNo", cif, "risk", risk.toString());
    }
}

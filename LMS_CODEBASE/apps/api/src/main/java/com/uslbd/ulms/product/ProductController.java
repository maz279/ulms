package com.uslbd.ulms.product;

import com.uslbd.ulms.platform.ApiList;
import com.uslbd.ulms.platform.AuthPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Product catalog API (R3, OpenAPI v1.7 §products). */
@RestController
@RequestMapping("/api/v1/products")
class ProductController {

    private final ProductService service;

    ProductController(ProductService service) { this.service = service; }

    @GetMapping
    ApiList<LoanProduct> list(@RequestParam(defaultValue = "false") boolean includeInactive) {
        return ApiList.of(service.list(includeInactive));
    }

    @GetMapping("/{code}")
    LoanProduct byCode(@PathVariable String code) { return service.active(code); }

    @PostMapping
    @PreAuthorize("hasRole('admin')")
    ResponseEntity<LoanProduct> create(@RequestHeader("Idempotency-Key") UUID idempotencyKey,
                                       @RequestBody Map<String, Object> body,
                                       Authentication auth) {
        for (String required : List.of("code", "nameEn", "minAmountMinor", "maxAmountMinor",
                                       "tenorMinMonths", "tenorMaxMonths", "rateBp")) {
            // code/nameEn are strings; the numeric fields must be Numbers
            if (!(body.get(required) instanceof Number)
                    && !(List.of("code", "nameEn").contains(required) && body.get(required) instanceof String)) {
                throw new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.UNPROCESSABLE_ENTITY, required + " is required");
            }
        }
        var p = service.create(
                String.valueOf(body.get("code")),
                String.valueOf(body.get("nameEn")),
                body.get("nameBn") == null ? null : String.valueOf(body.get("nameBn")),
                ((Number) body.get("minAmountMinor")).longValue(),
                ((Number) body.get("maxAmountMinor")).longValue(),
                ((Number) body.get("tenorMinMonths")).intValue(),
                ((Number) body.get("tenorMaxMonths")).intValue(),
                ((Number) body.get("rateBp")).intValue(),
                AuthPrincipal.actorOf(auth));
        return ResponseEntity.status(HttpStatus.CREATED).contentType(MediaType.APPLICATION_JSON).body(p);
    }

    /** External-audit fix: the admin form's PATCH — amend a DRAFT. */
    @PatchMapping("/{code}")
    @PreAuthorize("hasRole('admin')")
    LoanProduct patch(@PathVariable String code, @RequestBody Map<String, Object> body,
                      Authentication auth) {
        return service.patch(code, body, AuthPrincipal.actorOf(auth));
    }

    @PostMapping("/{code}/activate")
    @PreAuthorize("hasRole('admin')")
    LoanProduct activate(@PathVariable String code, Authentication auth) {
        return service.activate(code, AuthPrincipal.actorOf(auth));
    }

    @GetMapping("/{code}/eligibility")
    LoanProduct.Eligibility eligibility(@PathVariable String code,
                                        @RequestParam long amountMinor,
                                        @RequestParam int tenorMonths) {
        return service.eligibility(code, amountMinor, tenorMonths);
    }
}

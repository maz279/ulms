package com.uslbd.ulms.aml;

import com.uslbd.ulms.customer.Customer;
import com.uslbd.ulms.customer.CustomerService;
import com.uslbd.ulms.platform.ApiList;
import com.uslbd.ulms.platform.AuthPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * AML endpoints (R4, OpenAPI v1.7 §customers): guarantor registry under the
 * customer resource, AML posture, STR filing. {idOrCif} accepts UUID or CIF
 * like the 360 view.
 */
@RestController
class AmlController {

    private final AmlService aml;
    private final CustomerService customers;
    private final MonitoringService monitoring;   // R10 P-C surfaces

    AmlController(AmlService aml, CustomerService customers, MonitoringService monitoring) {
        this.aml = aml; this.customers = customers; this.monitoring = monitoring;
    }

    @GetMapping("/api/v1/customers/{idOrCif}/guarantors")
    ApiList<Guarantor> guarantors(@PathVariable String idOrCif) {
        return ApiList.of(aml.guarantorsOf(resolve(idOrCif).getId()));
    }

    @PostMapping("/api/v1/customers/{idOrCif}/guarantors")
    @PreAuthorize("hasAnyRole('collections','compliance','admin')")
    ResponseEntity<Guarantor> attach(@PathVariable String idOrCif,
                                     @RequestBody Map<String, Object> body,
                                     Authentication auth) {
        var req = new AmlService.AttachRequest(
                str(body.get("name")),
                str(body.get("nid")),
                str(body.get("mobile")),
                body.get("linkedAmountMinor") instanceof Number n ? n.longValue() : null);
        return ResponseEntity.status(HttpStatus.CREATED).contentType(MediaType.APPLICATION_JSON)
                .body(aml.attachGuarantor(resolve(idOrCif).getId(), req,
                        AuthPrincipal.actorOf(auth)));
    }

    @GetMapping("/api/v1/customers/{idOrCif}/aml")
    AmlService.AmlPosture posture(@PathVariable String idOrCif) {
        return aml.posture(resolve(idOrCif).getId());
    }

    @PostMapping("/api/v1/customers/{idOrCif}/str")
    @PreAuthorize("hasAnyRole('compliance','admin')")
    ResponseEntity<StrReport> fileStr(@PathVariable String idOrCif,
                                      @RequestBody Map<String, Object> body,
                                      Authentication auth) {
        var s = aml.fileStr(resolve(idOrCif).getId(),
                str(body.get("reason")),
                body.get("amountMinor") instanceof Number n ? n.longValue() : null,
                AuthPrincipal.actorOf(auth));
        return ResponseEntity.status(HttpStatus.CREATED).contentType(MediaType.APPLICATION_JSON).body(s);
    }

    // ── R10 P-C: monitoring surfaces + goAML export ─────────────────────────

    @GetMapping("/api/v1/customers/{idOrCif}/ctrs")
    @PreAuthorize("hasAnyRole('compliance','admin')")
    ApiList<CtrReport> ctrs(@PathVariable String idOrCif) {
        var c = resolve(idOrCif);
        return ApiList.of(monitoring.ctrsOf(c.getCifNo()));
    }

    @GetMapping("/api/v1/customers/{idOrCif}/monitoring-alerts")
    @PreAuthorize("hasAnyRole('compliance','admin')")
    ApiList<MonitoringAlert> alerts(@PathVariable String idOrCif) {
        var c = resolve(idOrCif);
        return ApiList.of(monitoring.alertsOf(c.getCifNo()));
    }

    @GetMapping(value = "/api/v1/customers/{idOrCif}/goaml.xml",
                produces = "application/xml")
    @PreAuthorize("hasAnyRole('compliance','admin')")
    ResponseEntity<String> goaml(@PathVariable String idOrCif, Authentication auth) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/xml"))
                .body(aml.goamlExport(resolve(idOrCif).getId(), AuthPrincipal.actorOf(auth)));
    }

    private Customer resolve(String idOrCif) {
        try {
            return customers.get(UUID.fromString(idOrCif));
        } catch (IllegalArgumentException notUuid) {
            return customers.byCif(idOrCif);
        }
    }

    private static String str(Object o) { return o == null ? null : String.valueOf(o); }
}

package com.uslbd.ulms.aml;

import com.uslbd.ulms.customer.Customer;
import com.uslbd.ulms.customer.CustomerService;
import com.uslbd.ulms.platform.audit.AuditService;
import com.uslbd.ulms.platform.outbox.OutboxService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * AML module (R4, OpenAPI v1.7 §customers): guarantor registry with the
 * attach-time CIB check, AML posture (CDD/EDD from screening hits), and STR
 * filing per BFIU practice (descriptive reason ≥20 chars, immutable FILED
 * rows, reference-stamped). Behavioral parity with the mock slices that the
 * web/e2e layer exercises (apps/web scripts/mockApi r3r4r5).
 */
@Service
public class AmlService {

    /** BD mobile per BTRC numbering: +8801 + 9 digits (14 chars). */
    static final String BD_MOBILE = "^\\+8801\\d{9}$";

    private final GuarantorRepository guarantors;
    private final StrReportRepository strs;
    private final CustomerService customers;
    private final AuditService audit;
    private final OutboxService outbox;
    private final CtrReportRepository ctrs;   // R10 P-C: goAML export marks CTRs

    AmlService(GuarantorRepository guarantors, StrReportRepository strs,
               CustomerService customers, AuditService audit, OutboxService outbox,
               CtrReportRepository ctrs) {
        this.guarantors = guarantors; this.strs = strs;
        this.customers = customers; this.audit = audit; this.outbox = outbox;
        this.ctrs = ctrs;
    }

    @Transactional(readOnly = true)
    public List<Guarantor> guarantorsOf(UUID customerId) {
        return guarantors.findAllByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    @Transactional
    public Guarantor attachGuarantor(UUID customerId, AttachRequest req, String actor) {
        Customer c = customers.get(customerId);
        if (req == null || req.name() == null || req.name().isBlank()
                || req.mobile() == null || !req.mobile().matches(BD_MOBILE)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "name and BD mobile required");
        }
        // Deterministic bureau score snapshot (650..829, CLEAR ≥680) — same
        // formula as the mock so web journeys and this slice agree; swapped
        // for the real assessment port when cib-live lands (D4).
        int score = 650 + Math.abs(req.name().length() * 17 + req.mobile().length() * 31) % 180;
        String cibStatus = score >= 680 ? "CLEAR" : "REFER";
        Guarantor g = guarantors.save(Guarantor.attach(UUID.randomUUID(), c.getId(),
                req.name(), req.nid(), req.mobile(), score, cibStatus,
                req.linkedAmountMinor() == null ? 0 : req.linkedAmountMinor(), actor));
        audit.record(actor, "GUARANTOR_ADD", "customer", c.getId(),
                "\"" + g.getName() + " · CIB " + g.getCibScore() + " " + g.getCibStatus() + "\"",
                UUID.randomUUID());
        outbox.emit("customer", c.getId(), "GUARANTOR_ADDED", Map.of("cif", c.getCifNo()));
        return g;
    }

    @Transactional(readOnly = true)
    public AmlPosture posture(UUID customerId) {
        Customer c = customers.get(customerId);
        var hits = customers.screeningHits(customerId);
        // R10: risk class lives on the customer (1/2/3-y refresh cycles);
        // a screening hit always escalates to High/EDD (06 §8)
        String risk = !hits.isEmpty() || "High".equals(c.getRisk())
                ? "High" : c.getRisk() == null ? "Low" : c.getRisk();
        return new AmlPosture(c.getCifNo(),
                "High".equals(risk) ? "EDD" : "CDD",
                risk, hits, strs.findAllByCifNoOrderByFiledAtDesc(c.getCifNo()));
    }

    /**
     * goAML export shape (R10 P-C): the BFIU goAML XML for the customer's
     * FILED STRs + unexported CTRs. Live submission goes through the goAML
     * portal at the UAT window — this renders the exact payload and marks
     * exported CTRs.
     */
    @Transactional
    public String goamlExport(UUID customerId, String actor) {
        Customer c = customers.get(customerId);
        var sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<goAML>\n <report>\n");
        sb.append("  <rentity>ULMS</rentity>\n");
        sb.append("  <submissionCode>S</submissionCode>\n");
        for (StrReport s : strs.findAllByCifNoOrderByFiledAtDesc(c.getCifNo())) {
            sb.append("  <transaction>\n   <typecode>STR</typecode>\n   <reference>")
              .append(s.getBfiuRef()).append("</reference>\n   <cif>").append(s.getCifNo())
              .append("</cif>\n   <amount>").append(s.getAmountMinor()).append("</amount>\n")
              .append("   <reason>").append(escapeXml(s.getReason())).append("</reason>\n")
              .append("  </transaction>\n");
        }
        for (CtrReport ctr : ctrs.findAllByCifNoOrderByOccurredAtDesc(c.getCifNo())) {
            if (!ctr.isExported()) {
                sb.append("  <transaction>\n   <typecode>CTR</typecode>\n   <reference>CTR-")
                  .append(ctr.getId()).append("</reference>\n   <cif>").append(ctr.getCifNo())
                  .append("</cif>\n   <amount>").append(ctr.getAmountMinor()).append("</amount>\n")
                  .append("   <reason>cash transaction at/above reporting threshold</reason>\n")
                  .append("  </transaction>\n");
                ctr.markExported();
            }
        }
        sb.append(" </report>\n</goAML>\n");
        audit.record(actor, "GOAML_EXPORTED", "customer", c.getId(),
                "{\"cif\":\"" + c.getCifNo() + "\"}", UUID.randomUUID());
        return sb.toString();
    }

    private static String escapeXml(String s) {
        return s == null ? "" : s.replace("&", "&amp;").replace("<", "&lt;")
                .replace(">", "&gt;").replace("\"", "&quot;");
    }

    @Transactional
    public StrReport fileStr(UUID customerId, String reason, Long amountMinor, String actor) {
        Customer c = customers.get(customerId);
        if (reason == null || reason.length() < 20) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "STR reason must be descriptive (≥20 chars) per BFIU practice");
        }
        StrReport s = strs.save(StrReport.filed(UUID.randomUUID(), c.getCifNo(), reason,
                amountMinor == null ? 0 : amountMinor,
                "BFIU-" + System.currentTimeMillis(), actor));
        audit.record(actor, "STR_FILE", "str_report", s.getId(),
                "\"ref " + s.getBfiuRef() + " on " + c.getCifNo() + "\"", UUID.randomUUID());
        return s;
    }

    public record AttachRequest(String name, String nid, String mobile, Long linkedAmountMinor) {}
    public record AmlPosture(String cifNo, String cddLevel, String risk,
                             List<?> screeningHits, List<StrReport> strs) {}
}

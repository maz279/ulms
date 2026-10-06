package com.uslbd.ulms.servicing;

import com.uslbd.ulms.customer.Customer;
import com.uslbd.ulms.customer.CustomerService;
import com.uslbd.ulms.platform.ApiList;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Tax certificates (03 mod-servicing): interest paid per loan for a year.
 * Lives in SERVICING — compliance must not depend on this module (modulith:
 * servicing→compliance for alerts is the one allowed direction).
 *
 * <p>Security (P5 audit F1): staff-only — the {@code borrower} role is not
 * accepted until borrower JWTs carry a bound identity claim (UAT OTP work);
 * nothing today binds a borrower subject to the {@code cif} parameter.
 */
@RestController
@RequestMapping("/api/v1/certificates")
@PreAuthorize("hasAnyRole('branch-officer','compliance','admin')")
class CertificateController {

    private final ServicingService servicing;
    private final CustomerService customers;

    CertificateController(ServicingService servicing, CustomerService customers) {
        this.servicing = servicing; this.customers = customers;
    }

    @GetMapping("/tax/{year}")
    @PreAuthorize("hasAnyRole('branch-officer','compliance','admin')")
    ApiList<TaxLine> tax(@PathVariable int year, @RequestParam String cif) {
        Customer c = customers.byCif(cif);
        if (year < 2000 || year > 2100) throw new IllegalArgumentException("Bad year " + year);
        List<com.uslbd.ulms.servicing.ServicingService.TaxCertificateLine> lines =
                servicing.taxCertificate(c.getId(), year);
        return ApiList.of(lines.stream()
                .map(l -> new TaxLine(c.getCifNo(), c.getNameEn(), year, l.loanNo(),
                        l.interestPaidMinor(), l.totalPaidMinor()))
                .toList());
    }

    record TaxLine(String cifNo, String nameEn, int year, String loanNo,
                   long interestPaidMinor, long totalPaidMinor) {}

    /** R10 P-E: bilingual tax certificate as PDF (openhtmltopdf render). */
    @GetMapping(value = "/tax/{year}/pdf", produces = "application/pdf")
    org.springframework.http.ResponseEntity<byte[]> taxPdf(@PathVariable int year,
                                                          @RequestParam String cif) {
        Customer c = customers.byCif(cif);
        if (year < 2000 || year > 2100) throw new IllegalArgumentException("Bad year " + year);
        var lines = servicing.taxCertificate(c.getId(), year);
        long totalInterest = lines.stream().mapToLong(
                com.uslbd.ulms.servicing.ServicingService.TaxCertificateLine::interestPaidMinor).sum();
        var sb = new StringBuilder();
        sb.append("<html><body style='font-family:sans-serif'>")
          .append("<h2>Tax Certificate / কর সনদপত্র</h2>")
          .append("<p>This certifies interest paid on loans held by <b>").append(c.getNameEn())
          .append("</b> (CIF ").append(c.getCifNo()).append(") in the year ")
          .append(year).append(".</p>")
          .append("<table border='1' cellspacing='0' cellpadding='4'>")
          .append("<tr><th>Loan</th><th>Interest paid (BDT)</th><th>Total paid (BDT)</th></tr>");
        for (var l : lines) {
            sb.append("<tr><td>").append(l.loanNo()).append("</td><td>")
              .append(String.format("%.2f", l.interestPaidMinor() / 100.0)).append("</td><td>")
              .append(String.format("%.2f", l.totalPaidMinor() / 100.0)).append("</td></tr>");
        }
        sb.append("<tr><td><b>Total</b></td><td><b>")
          .append(String.format("%.2f", totalInterest / 100.0))
          .append("</b></td><td></td></tr></table>")
          .append("<p style='margin-top:24px'>Issued by ULMS on behalf of the bank. ")
          .append("This is a system-generated certificate.</p></body></html>");
        byte[] pdf = PdfRenderer.htmlToPdf(sb.toString());
        return org.springframework.http.ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .header("Content-Disposition",
                        "attachment; filename=tax-" + c.getCifNo() + "-" + year + ".pdf")
                .body(pdf);
    }
}

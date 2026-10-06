package com.uslbd.ulms.compliance;

import com.uslbd.ulms.platform.AuthPrincipal;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Regulatory console endpoints (P4 / G4, 03 mod-compliance): returns board,
 * pack generation, preparer→checker→compliance sign-off, WORM file export,
 * submission calendar, IFRS-9 ECL runway board, Basel CAR inputs.
 */
@RestController
@RequestMapping("/api/v1/compliance")
class RegconController {

    private final ReturnsService returnsService;

    RegconController(ReturnsService returnsService) { this.returnsService = returnsService; }

    /** The regcon board — 12-row catalog × latest pack + KPIs (prototype pgRegcon). */
    @GetMapping("/returns")
    @PreAuthorize("hasAnyRole('compliance','credit-analyst','branch-manager','admin')")
    Map<String, Object> board() { return returnsService.board(LocalDate.now()); }

    /** Submission calendar (prototype G3-s2). */
    @GetMapping("/regcon-calendar")
    @PreAuthorize("hasAnyRole('compliance','credit-analyst','branch-manager','admin')")
    List<Map<String, String>> calendar(@RequestParam(defaultValue = "6") int months) {
        return RegconCatalog.upcoming(LocalDate.now(), Math.min(Math.max(months, 1), 24)).stream()
                .map(d -> Map.of("code", d.code(), "dueDate", d.dueDate().toString(),
                        "period", RegconCatalog.periodOf(d.dueDate())))
                .toList();
    }

    /** Generate (or regenerate) a pack for a period — preparer is the system (11 §6). */
    @PostMapping("/returns/{code}/generate")
    @PreAuthorize("hasAnyRole('compliance','admin')")
    Map<String, Object> generate(@PathVariable String code,
                                 @RequestParam(defaultValue = "") String period) {
        String periodOrCurrent = period.isBlank()
                ? YearMonth.now().minusMonths(1).toString()   // returns report on the prior month
                : period;
        var r = returnsService.generate(code, periodOrCurrent, AuthPrincipal.actorOf());
        return Map.of("id", r.getId().toString(), "code", r.getCode(), "period", r.getPeriod(),
                "status", r.getStatus(), "rowCount", r.getRowCount(),
                "fileSha256", r.getFileSha256(), "fileFormat", r.getFileFormat());
    }

    /** Checker sign-off — STAGED → CHECKED (06 §8 P4 chain). */
    @PostMapping("/returns/{id}/signoff/check")
    @PreAuthorize("hasAnyRole('compliance','branch-manager','admin')")
    Map<String, Object> check(@PathVariable UUID id) {
        var r = returnsService.check(id, AuthPrincipal.actorOf());
        return Map.of("id", r.getId().toString(), "status", r.getStatus(),
                "checker", r.getChecker());
    }

    /** Compliance sign-off + submission — CHECKED → FILED (submitted to Bangladesh Bank). */
    @PostMapping("/returns/{id}/signoff/file")
    @PreAuthorize("hasAnyRole('compliance','admin')")
    Map<String, Object> file(@PathVariable UUID id) {
        var r = returnsService.fileReturn(id, AuthPrincipal.actorOf());
        return Map.of("id", r.getId().toString(), "status", r.getStatus(),
                "submittedAt", r.getSubmittedAt().toString());
    }

    /** WORM-staged file download — CSV or fixed-width, checksum-verified (07 §5). */
    @GetMapping("/returns/{id}/file")
    @PreAuthorize("hasAnyRole('compliance','credit-analyst','branch-manager','admin')")
    ResponseEntity<String> download(@PathVariable UUID id) {
        var rendered = returnsService.file(id);
        MediaType type = "fixed-width".equals(rendered.ret().getFileFormat())
                ? MediaType.TEXT_PLAIN : new MediaType("text", "csv");
        String ext = "fixed-width".equals(rendered.ret().getFileFormat()) ? "txt" : "csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + rendered.ret().getCode().replace("/", "-")
                                + "-" + rendered.ret().getPeriod() + "." + ext + "\"")
                .header("X-ULMS-Sha256", rendered.ret().getFileSha256())
                .contentType(type)
                .body(rendered.content());
    }

    /** IFRS-9 ECL runway board — snapshot rows + totals + months to Dec 2027. */
    @GetMapping("/ifrs9/ecl")
    @PreAuthorize("hasAnyRole('compliance','credit-analyst','branch-manager','admin')")
    Map<String, Object> ecl(@RequestParam(required = false) String asOf) {
        LocalDate date = asOf == null || asOf.isBlank()
                ? LocalDate.now().withDayOfMonth(1) : LocalDate.parse(asOf);
        return returnsService.eclBoard(date);
    }

    /** Run (or rerun) the ECL snapshot for an as-of date. */
    @PostMapping("/ifrs9/ecl/run")
    @PreAuthorize("hasAnyRole('compliance','admin')")
    Map<String, Object> eclRun(@RequestParam(required = false) String asOf) {
        LocalDate date = asOf == null || asOf.isBlank()
                ? LocalDate.now().withDayOfMonth(1) : LocalDate.parse(asOf);
        var rows = returnsService.runEclSnapshot(date, AuthPrincipal.actorOf());
        return Map.of("asOf", date.toString(), "stages", rows.size(),
                "eclMinor", rows.stream().mapToLong(EclSnapshot::getEclMinor).sum(),
                "brpdProvisionMinor", rows.stream().mapToLong(EclSnapshot::getBrpdProvisionMinor).sum());
    }

    /** Basel III CAR inputs — live computation over the current portfolio. */
    @GetMapping("/basel/car")
    @PreAuthorize("hasAnyRole('compliance','credit-analyst','branch-manager','admin')")
    Map<String, Object> car() { return returnsService.carInputs(); }
}

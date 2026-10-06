package com.uslbd.ulms.compliance;

import com.uslbd.ulms.platform.AuthPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Reporting endpoints (P4 / 12 W11): the portfolio read model plus the thin
 * report-writer slice — definitions bind the read model to a group-by and are
 * executed by running it (assembly-only, never client-side money formatting,
 * never free-form SQL).
 */
@RestController
@RequestMapping("/api/v1/reporting")
class ReportingController {

    private final ReportingService reporting;
    private final ReportDefinitionRepository definitions;
    private final com.uslbd.ulms.platform.audit.AuditService audit;

    ReportingController(ReportingService reporting, ReportDefinitionRepository definitions,
                        com.uslbd.ulms.platform.audit.AuditService audit) {
        this.reporting = reporting; this.definitions = definitions; this.audit = audit;
    }

    /** Loan portfolio aggregate — MV_LOAN_PORTFOLIO shape, grouped by classification|stage|branch. */
    @GetMapping("/portfolio")
    @PreAuthorize("hasAnyRole('compliance','credit-analyst','branch-manager','collections','admin')")
    Map<String, Object> portfolio(@RequestParam(defaultValue = "classification") String groupby) {
        return reporting.portfolio(groupby);
    }

    /** Saved governed reports (the writer's durable output). */
    @GetMapping("/definitions")
    @PreAuthorize("hasAnyRole('compliance','credit-analyst','branch-manager','collections','admin')")
    List<ReportDefinition> listDefinitions() { return definitions.findAllByOrderByCreatedAtDesc(); }

    /** Save a report definition — binds the portfolio read model to a group-by. */
    @PostMapping("/definitions")
    @PreAuthorize("hasAnyRole('compliance','credit-analyst','branch-manager','admin')")
    ReportDefinition saveDefinition(@RequestBody DefinitionRequest body) {
        String name = body.name() == null ? "" : body.name().trim();
        if (name.length() < 3 || name.length() > 120) {
            throw new IllegalArgumentException("Report name must be 3–120 characters");
        }
        if (definitions.existsByName(name)) {
            throw new IllegalStateException("A report named \"" + name + "\" already exists");
        }
        // validates the group-by against the read model's enum
        reporting.portfolio(body.groupBy());
        ReportDefinition saved = definitions.save(ReportDefinition.of(UUID.randomUUID(),
                name, body.groupBy(), body.schedule(), AuthPrincipal.actorOf()));
        // P5 audit F3: a saved definition is a governed-config state change — audited (06 §3)
        audit.record(AuthPrincipal.actorOf(), "REPORT_DEFINITION_SAVED", "report_definition",
                saved.getId(),
                "{\"name\":\"" + name + "\",\"groupBy\":\"" + saved.getGroupBy() + "\"}",
                UUID.randomUUID());
        return saved;
    }

    /** Execute a saved definition — runs the read model with its group-by. */
    @GetMapping("/definitions/{id}/run")
    @PreAuthorize("hasAnyRole('compliance','credit-analyst','branch-manager','collections','admin')")
    Map<String, Object> runDefinition(@PathVariable UUID id) {
        ReportDefinition d = definitions.findById(id)
                .orElseThrow(() -> new java.util.NoSuchElementException("No such report definition " + id));
        Map<String, Object> result = reporting.portfolio(d.getGroupBy());
        result.put("definition", Map.of("id", d.getId().toString(), "name", d.getName(),
                "schedule", d.getSchedule(), "createdBy", d.getCreatedBy()));
        return result;
    }

    record DefinitionRequest(String name, String groupBy, String schedule) {}
}

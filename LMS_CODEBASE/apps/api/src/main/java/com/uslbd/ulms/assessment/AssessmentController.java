package com.uslbd.ulms.assessment;

import com.uslbd.ulms.customer.Customer;
import com.uslbd.ulms.customer.CustomerService;
import com.uslbd.ulms.platform.ApiList;
import com.uslbd.ulms.platform.AuthPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.NoSuchElementException;
import java.util.UUID;

/** Assessment endpoints (03 mod-assessment; conventions 05). */
@RestController
@RequestMapping("/api/v1/assessments")
class AssessmentController {

    private final AssessmentService service;
    private final CustomerService customers;
    private final ApplicationFactsProvider applicationFacts;

    AssessmentController(AssessmentService service, CustomerService customers,
                         ApplicationFactsProvider applicationFacts) {
        this.service = service; this.customers = customers;
        this.applicationFacts = applicationFacts;
    }

    /** Async pull in production; the P2 mock is synchronous (03). */
    @PostMapping("/cib/{cif}")
    @PreAuthorize("hasAnyRole('branch-officer','credit-analyst','admin')")
    CibPullView pullCib(@PathVariable String cif) {
        Customer c = customers.byCif(cif);
        var report = service.pullCib(c.getId(), c.getCifNo(), AuthPrincipal.actorOf());
        return new CibPullView(report.getId(), report.getStatus(), report.getReportPeriod(),
                report.getError());
    }

    /**
     * Monthly SFTP file channel (11 §1 `parseFile`): accepts the raw
     * fixed-width file body; the SAME parser as real-time produces identical
     * rows. Deduped by (cif, period, fileId). Body validated (period format,
     * raw ≤ 1 MB) — unbounded bodies are a DoS vector.
     */
    @PostMapping("/cib/file")
    @PreAuthorize("hasAnyRole('credit-analyst','compliance','admin')")
    CibPullView ingestFile(@jakarta.validation.Valid @RequestBody FileIngestRequest body) {
        Customer c = customers.byCif(body.cif());
        var report = service.ingestFile(c.getId(), c.getCifNo(), body.period(),
                body.fileId(), body.raw(), AuthPrincipal.actorOf());
        return new CibPullView(report.getId(), report.getStatus(), report.getReportPeriod(),
                report.getError());
    }

    /** Parsed facilities + pull history of the latest report (CIB viewer). */
    @GetMapping("/cib/{cif}")
    CibDetailView getCib(@PathVariable String cif) {
        Customer c = customers.byCif(cif);
        var view = service.latestCib(c.getId());
        return new CibDetailView(view.report().getId(), view.report().getStatus(),
                view.report().getReportPeriod(), view.report().getPulledAt(),
                view.facilities().stream().map(FacilityView::of).toList(),
                view.pullHistory().stream().map(h -> new PullLine(h.getReportPeriod(),
                        h.getStatus(), h.getSource(), h.getPulledAt().toString())).toList());
    }

    /** Re-run the assessment for an application — facts read SERVER-side. */
    @PostMapping("/{applicationId}/score")
    @PreAuthorize("hasAnyRole('branch-officer','credit-analyst','admin')")
    ScoreView score(@PathVariable UUID applicationId) {
        var outcome = service.assessApplication(applicationFacts.facts(applicationId),
                AuthPrincipal.actorOf());
        return ScoreView.of(outcome);
    }

    /** DBR-only computation with the full policy breakdown (03) — server facts. */
    @PostMapping("/{applicationId}/dbr")
    @PreAuthorize("hasAnyRole('branch-officer','credit-analyst','admin')")
    DbrView dbr(@PathVariable UUID applicationId) {
        var breakdown = service.computeDbr(applicationFacts.facts(applicationId),
                AuthPrincipal.actorOf());
        return new DbrView(breakdown.dbrPercent() == null ? null : breakdown.dbrPercent().toPlainString(),
                breakdown.incomeMinor(), breakdown.existingEmiMinor(),
                breakdown.cibObligationMinor(), breakdown.proposedEmiMinor());
    }

    /** Latest stored score for the pipeline/assessment panel. */
    @GetMapping("/{applicationId}/score")
    ResponseEntity<ScoreView> latestScore(@PathVariable UUID applicationId) {
        ScoreResult s = service.latestScore(applicationId);
        return s == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(ScoreView.ofStored(s));
    }

    @PostMapping("/{applicationId}/collateral")
    @PreAuthorize("hasAnyRole('branch-officer','admin')")
    CollateralView addCollateral(@PathVariable UUID applicationId,
                                 @RequestBody CollateralRequest body) {
        var c = service.addCollateral(applicationId, body.type(), body.description(),
                body.valueMinor(), body.valuedOn(), body.insuredUntil(), AuthPrincipal.actorOf());
        return CollateralView.of(c);
    }

    /** Revalue collateral: history row + current update (04 §3). */
    @PostMapping("/collateral/{collateralId}/valuation")
    @PreAuthorize("hasAnyRole('branch-officer','credit-analyst','admin')")
    CollateralView revalue(@PathVariable UUID collateralId,
                           @jakarta.validation.Valid @RequestBody ValuationRequest body) {
        return CollateralView.of(service.revalueCollateral(collateralId, body.valueMinor(),
                body.valuedOn(), AuthPrincipal.actorOf()));
    }

    /** Full valuation history (04 §3 collateral_valuation). */
    @GetMapping("/collateral/{collateralId}/valuation")
    ApiList<ValuationView> valuationHistory(@PathVariable UUID collateralId) {
        return ApiList.of(service.valuationHistory(collateralId).stream()
                .map(v -> new ValuationView(v.getId(), v.getValueMinor(),
                        v.getValuedOn() == null ? null : v.getValuedOn().toString(),
                        v.getValuedBy(), v.getCreatedAt().toString()))
                .toList());
    }

    @GetMapping("/{applicationId}/collateral")
    ApiList<CollateralView> collateral(@PathVariable UUID applicationId) {
        return ApiList.of(service.collateralOf(applicationId).stream()
                .map(CollateralView::of).toList());
    }

    // ── views ──────────────────────────────────────────────────────────────
    record CibPullView(UUID id, String status, String period, String error) {}
    record PullLine(String period, String status, String source, String pulledAt) {}
    record FacilityView(String lenderCode, String lenderName, String facilityType,
                        Long limitMinor, Long outstandingMinor, Long overdueMinor,
                        Long installmentMinor, Integer dpd, String classification,
                        String lastPaymentDate, String repaymentTrack) {
        static FacilityView of(CibFacility f) {
            return new FacilityView(f.getLenderCode(), f.getLenderName(), f.getFacilityType(),
                    f.getLimitMinor(), f.getOutstandingMinor(), f.getOverdueMinor(),
                    f.getInstallmentMinor(), f.getDpd(), f.getClassification(),
                    f.getLastPaymentDate() == null ? null : f.getLastPaymentDate().toString(),
                    f.getRepaymentTrack());
        }
    }
    record CibDetailView(UUID id, String status, String period, java.time.Instant pulledAt,
                         java.util.List<FacilityView> facilities,
                         java.util.List<PullLine> pullHistory) {}
    record ScoreView(int score, String grade, String decision, int version,
                     String dbrPercent, long cibObligationMinor, long proposedEmiMinor,
                     String factors) {
        static ScoreView of(AssessmentService.AssessmentOutcome o) {
            return new ScoreView(o.score().getScore(), o.score().getGrade(),
                    o.score().getDecision(), o.score().getVersion(),
                    o.dbr() == null ? null : o.dbr().toPlainString(),
                    o.cibObligationMinor(), o.proposedEmiMinor(), o.score().getFactors());
        }
        static ScoreView ofStored(ScoreResult s) {
            return new ScoreView(s.getScore(), s.getGrade(), s.getDecision(), s.getVersion(),
                    null, 0, 0, s.getFactors());
        }
    }
    record DbrView(String dbrPercent, long incomeMinor, long existingEmiMinor,
                   long cibObligationMinor, long proposedEmiMinor) {}
    record CollateralView(UUID id, String type, String description, long valueMinor,
                          String valuedOn, String insuredUntil) {
        static CollateralView of(Collateral c) {
            return new CollateralView(c.getId(), c.getCollateralType(), c.getDescription(),
                    c.getValueMinor(), c.getValuedOn() == null ? null : c.getValuedOn().toString(),
                    c.getInsuredUntil() == null ? null : c.getInsuredUntil().toString());
        }
    }
    record FileIngestRequest(
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max = 16) String cif,
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Pattern(
                    regexp = "^\\d{4}-(0[1-9]|1[0-2])$", message = "period must be YYYY-MM") String period,
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max = 40) String fileId,
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(
                    max = 1_000_000, message = "raw file exceeds 1 MB") String raw) {}
    record ValuationRequest(@jakarta.validation.constraints.Positive long valueMinor,
                            java.time.LocalDate valuedOn) {}
    record ValuationView(UUID id, long valueMinor, String valuedOn, String valuedBy,
                         String createdAt) {}
    record CollateralRequest(String type, String description, long valueMinor,
                             java.time.LocalDate valuedOn, java.time.LocalDate insuredUntil) {}
}

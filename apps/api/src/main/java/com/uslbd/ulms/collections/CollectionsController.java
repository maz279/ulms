package com.uslbd.ulms.collections;

import com.uslbd.ulms.platform.ApiList;
import com.uslbd.ulms.platform.AuthPrincipal;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

/** Collections endpoints (03 mod-collections): worklist, actions, PTP, field tasks. */
@RestController
@RequestMapping("/api/v1/collections")
class CollectionsController {

    private final CollectionsService service;
    private final DunningLadderService ladder;

    CollectionsController(CollectionsService service, DunningLadderService ladder) {
        this.service = service; this.ladder = ladder;
    }

    /** Bucket worklist — the prototype F2 board (priority = broken-PTP boost). */
    @GetMapping("/worklist")
    ApiList<CollectionsService.WorklistRow> worklist() {
        return ApiList.of(service.worklist());
    }

    @PostMapping("/{loanId}/actions/{actionType}")
    @PreAuthorize("hasAnyRole('collections','branch-officer','admin')")
    ActionView action(@PathVariable UUID loanId, @PathVariable String actionType,
                      @RequestBody ActionRequest body) {
        var a = service.recordAction(loanId, actionType.toUpperCase(), body.outcome(),
                body.notes(), AuthPrincipal.actorOf());
        return ActionView.of(a);
    }

    @GetMapping("/{loanId}/actions")
    ApiList<ActionView> actions(@PathVariable UUID loanId) {
        return ApiList.of(service.actionsOf(loanId).stream().map(ActionView::of).toList());
    }

    /** PTP promise — the prototype's contextual form (03). */
    @PostMapping("/{loanId}/ptp")
    @PreAuthorize("hasAnyRole('collections','branch-officer','admin')")
    PtpView promise(@PathVariable UUID loanId, @RequestBody PtpRequest body) {
        var p = service.promise(loanId, body.promisedAmountMinor(), body.promisedOn(),
                body.confidence(), body.contactName(), body.contactRelation(),
                body.contactPhone(), body.remark(), AuthPrincipal.actorOf());
        return PtpView.of(p);
    }

    @PostMapping("/ptp/{ptpId}/outcome")
    @PreAuthorize("hasAnyRole('collections','admin')")
    PtpView outcome(@PathVariable UUID ptpId, @RequestBody OutcomeRequest body) {
        return PtpView.of(service.markOutcome(ptpId, body.kept(), AuthPrincipal.actorOf()));
    }

    @GetMapping("/ptp/calendar")
    ApiList<PtpView> calendar(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ApiList.of(service.calendar(from, to).stream().map(PtpView::of).toList());
    }

    @PostMapping("/field-tasks")
    @PreAuthorize("hasAnyRole('collections','branch-manager','admin')")
    FieldTaskView assign(@RequestBody FieldTaskRequest body) {
        return FieldTaskView.of(service.assignFieldTask(body.loanId(), body.assignedTo(),
                body.dueOn(), AuthPrincipal.actorOf()));
    }

    @PostMapping("/field-tasks/{taskId}/complete")
    @PreAuthorize("hasAnyRole('collections','admin')")
    FieldTaskView complete(@PathVariable UUID taskId,
                           @RequestBody(required = false) EvidenceRequest body) {
        return FieldTaskView.of(service.completeFieldTask(taskId,
                body == null ? "" : body.evidence(), AuthPrincipal.actorOf()));
    }

    @GetMapping("/field-tasks")
    ApiList<FieldTaskView> openTasks() {
        return ApiList.of(service.openTasks().stream().map(FieldTaskView::of).toList());
    }

    // ── dunning queue (03 timers on collection_action) ────────────────────

    /** Queued (unacted) dunning steps — the ladder timer's action inbox. */
    @GetMapping("/dunning/queue")
    ApiList<ActionView> dunningQueue() {
        return ApiList.of(ladder.dueQueue().stream().map(ActionView::of).toList());
    }

    /** Operator/scheduler trigger for the nightly ladder pass. */
    @PostMapping("/dunning/run")
    @PreAuthorize("hasAnyRole('collections','admin')")
    Object dunningRun() {
        return java.util.Map.of("queued", ladder.runOnce(LocalDate.now()));
    }

    /** Officer acts a queued dunning step with the real outcome. */
    @PostMapping("/dunning/{actionId}/resolve")
    @PreAuthorize("hasAnyRole('collections','admin')")
    ActionView dunningResolve(@PathVariable UUID actionId, @RequestBody ActionRequest body) {
        return ActionView.of(ladder.resolveQueued(actionId, body.outcome(), body.notes(),
                AuthPrincipal.actorOf()));
    }

    // ── legal cases (03 CRUD) ──────────────────────────────────────────────

    @PostMapping("/{loanId}/legal-case")
    @PreAuthorize("hasAnyRole('collections','compliance','admin')")
    LegalCaseView fileCase(@PathVariable UUID loanId, @RequestBody LegalCaseRequest body) {
        return LegalCaseView.of(service.fileCase(loanId, body.court(), body.filedOn(),
                body.claimMinor(), body.lawyer(), body.notes(), AuthPrincipal.actorOf()));
    }

    @GetMapping("/{loanId}/legal-case")
    ApiList<LegalCaseView> cases(@PathVariable UUID loanId) {
        return ApiList.of(service.casesOf(loanId).stream().map(LegalCaseView::of).toList());
    }

    @PostMapping("/legal-case/{caseId}/status")
    @PreAuthorize("hasAnyRole('collections','compliance','admin')")
    LegalCaseView caseStatus(@PathVariable UUID caseId, @RequestBody CaseStatusRequest body) {
        return LegalCaseView.of(service.updateCaseStatus(caseId, body.status(),
                AuthPrincipal.actorOf()));
    }

    /** Collections resolution adjustment: waive interest in Fineract (03). */
    @PostMapping("/{loanId}/waive-interest")
    @PreAuthorize("hasAnyRole('collections','branch-manager','admin')")
    Object waive(@PathVariable UUID loanId, @RequestBody WaiveRequest body) {
        return java.util.Map.of("fineractTxn",
                service.waiveInterest(loanId, body.amountMinor(), AuthPrincipal.actorOf()));
    }

    // ── views (PTP phone is MASKED here — 08 B3 privacy) ──────────────────
    record ActionView(UUID id, UUID loanId, String actionType, String outcome,
                      String notes, String actor, String actedAt, LocalDate dueOn) {
        static ActionView of(CollectionAction a) {
            return new ActionView(a.getId(), a.getLoanId(), a.getActionType(), a.getOutcome(),
                    a.getNotes(), a.getActor(), a.getActedAt().toString(), a.getDueOn());
        }
    }
    record LegalCaseView(UUID id, UUID loanId, String caseNo, String court,
                         String filedOn, String status, long claimMinor, String lawyer) {
        static LegalCaseView of(LegalCase lc) {
            return new LegalCaseView(lc.getId(), lc.getLoanId(), lc.getCaseNo(), lc.getCourt(),
                    lc.getFiledOn() == null ? null : lc.getFiledOn().toString(),
                    lc.getStatus(), lc.getClaimMinor(), lc.getLawyer());
        }
    }
    record PtpView(UUID id, UUID loanId, long promisedAmountMinor, LocalDate promisedOn,
                   String confidence, String contactName, String contactRelation,
                   String contactPhoneMasked, String remark, int dpdAtPromise,
                   String classificationAtPromise, String kept) {
        static PtpView of(Ptp p) {
            String phone = p.getContactPhone();
            String masked = phone == null ? null
                    : "****" + phone.substring(Math.max(0, phone.length() - 4));
            return new PtpView(p.getId(), p.getLoanId(), p.getPromisedAmountMinor(),
                    p.getPromisedOn(), p.getConfidence(), p.getContactName(),
                    p.getContactRelation(), masked, p.getRemark(), p.getDpdAtPromise(),
                    p.getClassificationAtPromise(), p.getKept());
        }
    }
    record FieldTaskView(UUID id, UUID loanId, String assignedTo, LocalDate dueOn,
                         String status, String notes, String doneAt) {
        static FieldTaskView of(FieldTask t) {
            return new FieldTaskView(t.getId(), t.getLoanId(), t.getAssignedTo(), t.getDueOn(),
                    t.getStatus(), t.getNotes(), t.getDoneAt() == null ? null : t.getDoneAt().toString());
        }
    }
    record ActionRequest(String outcome, String notes) {}
    record LegalCaseRequest(String court, LocalDate filedOn, long claimMinor,
                            String lawyer, String notes) {}
    record CaseStatusRequest(@jakarta.validation.constraints.NotBlank String status) {}
    record WaiveRequest(@jakarta.validation.constraints.Positive long amountMinor) {}
    record PtpRequest(long promisedAmountMinor,
                      @jakarta.validation.constraints.NotNull LocalDate promisedOn,
                      @jakarta.validation.constraints.NotBlank String confidence,
                      String contactName, String contactRelation, String contactPhone,
                      String remark) {}
    record OutcomeRequest(boolean kept) {}
    record FieldTaskRequest(@jakarta.validation.constraints.NotNull UUID loanId,
                            @jakarta.validation.constraints.NotBlank String assignedTo,
                            @jakarta.validation.constraints.NotNull LocalDate dueOn) {}
    record EvidenceRequest(String evidence) {}
}

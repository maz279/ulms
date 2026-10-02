package com.uslbd.ulms.origination;

import com.uslbd.ulms.platform.ApiList;
import com.uslbd.ulms.platform.AuthPrincipal;
import com.uslbd.ulms.platform.idempotency.IdempotencyService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.security.SecureRandom;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/applications")
class ApplicationController {

    private final OriginationService service;
    private final IdempotencyService idempotency;
    private final com.uslbd.ulms.platform.workflow.WorkflowService workflow;
    private static final SecureRandom RANDOM = new SecureRandom();   // non-secret id space

    ApplicationController(OriginationService service, IdempotencyService idempotency,
                          com.uslbd.ulms.platform.workflow.WorkflowService workflow) {
        this.service = service; this.idempotency = idempotency; this.workflow = workflow;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('branch-officer','admin')")
    ResponseEntity<String> draft(@RequestHeader("Idempotency-Key") UUID idempotencyKey,
                                 @Valid @RequestBody ApplicationDraftRequest req,
                                 Authentication auth) {
        var replay = idempotency.replayOf(idempotencyKey, "POST /applications", req);
        if (replay.isPresent()) {
            return ResponseEntity.status(replay.get().statusCode())
                    .header("Idempotent-Replay", "true")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(replay.get().responseBody());
        }
        Application a = service.createDraft(nextAppNo(), req.customerId(), req.productCode(),
                req.amountMinor(), req.tenorMonths(), req.rateType(), req.branchCode(),
                req.incomeMinor(), req.existingEmiMinor(), AuthPrincipal.actorOf(auth));
        var view = ApplicationView.of(a, null, null, null);
        idempotency.record(idempotencyKey, "POST /applications", req, 201, view);
        return ResponseEntity
                .created(URI.create("/api/v1/applications/" + a.getId()))
                .contentType(MediaType.APPLICATION_JSON)
                .body(write(view));
    }

    /** Wizard autosave (07 §4): PATCH the draft while still in SCREENING.
     *  Optional `version` body field = optimistic concurrency (05 §4). */
    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('branch-officer','admin')")
    ApplicationView patch(@PathVariable UUID id, @RequestBody DraftPatchRequest req,
                          Authentication auth) {
        return ApplicationView.of(service.updateDraft(id, req.productCode(), req.amountMinor(),
                req.tenorMonths(), req.rateType(), req.incomeMinor(), req.existingEmiMinor(),
                req.version(), AuthPrincipal.actorOf(auth)), null, null, null);
    }

    /** Submit → CIB pull → scoring (auto-decline possible) → CPV (03 G2 flow). */
    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('branch-officer','admin')")
    ApplicationView submit(@PathVariable UUID id, Authentication auth) {
        Application a = service.submit(id, AuthPrincipal.actorOf(auth));
        return ApplicationView.of(a, null, null, null);
    }

    /** CPV gate: PASS starts the approval ladder; FAIL rolls back to SCREENING. */
    @PostMapping("/{id}/cpv")
    @PreAuthorize("hasAnyRole('branch-officer','collections','admin')")
    ApplicationView cpv(@PathVariable UUID id, @RequestBody CpvRequest body,
                        Authentication auth) {
        Application a = service.cpv(id, body.passed(), body.notes() == null ? "" : body.notes(),
                AuthPrincipal.actorOf(auth));
        return ApplicationView.of(a, null, null, null);
    }

    @PostMapping("/{id}/documents")
    @PreAuthorize("hasAnyRole('branch-officer','admin')")
    ResponseEntity<DocumentView> upload(@PathVariable UUID id,
                                        @RequestPart("file") MultipartFile file,
                                        @RequestParam String docType,
                                        Authentication auth) throws IOException {
        var d = service.attachDocument(id, docType, file.getInputStream(), file.getSize(),
                file.getContentType() == null ? "application/octet-stream" : file.getContentType(),
                AuthPrincipal.actorOf(auth));
        return ResponseEntity.created(URI.create("/api/v1/applications/" + id + "/documents"))
                .body(new DocumentView(d.getId(), d.getDocType(), d.getSha256(),
                        d.getSizeBytes(), d.getScanStatus()));
    }

    @GetMapping("/{id}/documents")
    ApiList<DocumentView> docs(@PathVariable UUID id) {
        return ApiList.of(service.documents(id).stream()
                .map(d -> new DocumentView(d.getId(), d.getDocType(), d.getSha256(),
                        d.getSizeBytes(), d.getScanStatus()))
                .toList());
    }

    @GetMapping("/{id}")
    ApplicationView get(@PathVariable UUID id) {
        var a = service.get(id);
        var task = workflow.currentTask("application", id).orElse(null);   // 03: detail incl. workflow state
        return ApplicationView.of(a, task == null ? null : task.getNode(),
                task == null ? null : task.getPhase(), task == null ? null : task.getSlaDeadline());
    }

    @GetMapping
    ApiList<ApplicationView> list(@RequestParam(required = false) String stage,
                                  @RequestParam(required = false) String branch,
                                  @RequestParam(required = false) String officer,
                                  @RequestParam(defaultValue = "1") int page,
                                  @RequestParam(defaultValue = "25") int size,
                                  @org.springframework.beans.factory.annotation.Value(
                                          "${ulms.branch-scope-required:true}") boolean branchScopeRequired) {
        int capped = Math.min(size, 100);
        // P5 audit F4: a branch-scoped caller's claim WINS over the ?branch= param
        String effectiveBranch = com.uslbd.ulms.platform.AuthPrincipal
                .requireBranchFor(branchScopeRequired);
        if (effectiveBranch != null) branch = effectiveBranch;
        return ApiList.of(service.list(stage, branch, officer).stream()
                .map(a -> ApplicationView.of(a, null, null, null)).toList(), page, capped);
    }

    private String nextAppNo() { return "APP-" + (700_000 + RANDOM.nextInt(99_999)); }

    private String write(Object view) {
        return IdempotencyService.toJson(view);
    }

    record ApplicationDraftRequest(UUID customerId, String productCode, long amountMinor,
                                   int tenorMonths, Application.RateType rateType,
                                   String branchCode, Long incomeMinor, Long existingEmiMinor) {}
    record DraftPatchRequest(String productCode, long amountMinor, int tenorMonths,
                             Application.RateType rateType, Long incomeMinor, Long existingEmiMinor,
                             Long version) {}
    record CpvRequest(boolean passed, String notes) {}
    record DocumentView(UUID id, String docType, String sha256, long sizeBytes, String scanStatus) {}
}

package com.uslbd.ulms.collections;

import com.fasterxml.jackson.databind.JsonNode;
import com.uslbd.ulms.platform.audit.AuditService;
import com.uslbd.ulms.platform.outbox.OutboxService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Mobile field-app gateway (PLANNING/08 §A5): the dedicated /field/* contract
 * the Expo app syncs against — delta task pull, idempotent visit intake,
 * PTP capture, and one-tap SOS. Offline rules mirror §A3: task status is
 * SERVER-WINS (a replayed visit is suppressed but its evidence is still
 * appended to the task), evidence is append-only.
 */
@Service
public class FieldGatewayService {

    private final FieldTaskRepository tasks;
    private final FieldVisitRepository visits;
    private final SosAlertRepository sos;
    private final CollectionsService collections;
    private final AuditService audit;
    private final OutboxService outbox;

    FieldGatewayService(FieldTaskRepository tasks, FieldVisitRepository visits,
                        SosAlertRepository sos, CollectionsService collections,
                        AuditService audit, OutboxService outbox) {
        this.tasks = tasks; this.visits = visits; this.sos = sos;
        this.collections = collections; this.audit = audit; this.outbox = outbox;
    }

    /** Delta pull: the officer's tasks changed since `since` (null = full
     *  bundle). Returns tasks + a bundle version for the offline cache. */
    @Transactional(readOnly = true)
    public Map<String, Object> tasksFor(String officer, Instant since) {
        List<FieldTask> all = tasks.findAllByAssignedToOrderByDueOnAsc(officer);
        List<FieldTask> delta = since == null ? all : all.stream()
                .filter(t -> t.getCreatedAt() != null && t.getCreatedAt().isAfter(since)
                        || t.getDoneAt() != null && t.getDoneAt().isAfter(since))
                .toList();
        String version = all.stream()
                .map(t -> t.getDoneAt() == null ? t.getCreatedAt() : max(t.getCreatedAt(), t.getDoneAt()))
                .filter(x -> x != null)
                .max(Instant::compareTo).map(Instant::toString).orElse("empty");
        return Map.of("data", delta, "bundleVersion", version);
    }

    /**
     * Idempotent visit intake (client uuid = the mobile op id). First apply
     * transitions the task (server-wins) and appends evidence; replays are
     * recorded with applied=false and never double-transition.
     */
    @Transactional
    public VisitResult visit(String clientUuid, UUID taskId, UUID loanId, String outcome,
                             JsonNode evidence, String actor) {
        var existing = visits.findByClientUuid(clientUuid);
        if (existing.isPresent()) {
            return new VisitResult(existing.get(), true);   // offline replay
        }
        boolean transitioned = false;
        if (taskId != null) {
            FieldTask task = tasks.findById(taskId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "task not found"));
            transitioned = task.complete(evidence == null ? null : evidence.toString());
            tasks.save(task);
        }
        FieldVisit v = visits.save(FieldVisit.record(UUID.randomUUID(), clientUuid,
                taskId, loanId, actor, outcome == null ? "VERIFIED" : outcome,
                evidence, transitioned));
        audit.record(actor, transitioned ? "FIELD_VISIT" : "FIELD_VISIT_REPLAY",
                "field_visit", v.getId(),
                "{\"client\":\"" + clientUuid + "\",\"outcome\":\"" + v.getOutcome() + "\"}",
                UUID.randomUUID());
        if (transitioned && loanId != null) {
            outbox.emit("loan", loanId, "FIELD_VISIT_RECORDED",
                    Map.of("officer", actor, "outcome", v.getOutcome()));
        }
        return new VisitResult(v, false);
    }

    /** visit outcome for the wire: the row + whether this call was a replay. */
    public record VisitResult(FieldVisit visit, boolean replayed) {}

    /** PTP captured in the field (03 mod-collections rules unchanged). */
    @Transactional
    public Ptp ptp(UUID loanId, long promisedAmountMinor, java.time.LocalDate promisedOn,
                   String confidence, String contactName, String contactRelation,
                   String contactPhone, String remark, String actor) {
        return collections.promise(loanId, promisedAmountMinor, promisedOn, confidence,
                contactName, contactRelation, contactPhone, remark, actor);
    }

    /** One-tap SOS: durable alert + outbox event driving branch security + SMS. */
    @Transactional
    public SosAlert sos(UUID loanId, Double lat, Double lng, String note, String actor) {
        SosAlert a = sos.save(SosAlert.raise(UUID.randomUUID(), actor, loanId, lat, lng, note));
        audit.record(actor, "SOS_RAISED", "sos_alert", a.getId(),
                lat != null && lng != null
                        ? String.format("{\"lat\":%.5f,\"lng\":%.5f}", lat, lng)
                        : "{\"geo\":\"unavailable\"}",
                UUID.randomUUID());
        outbox.emit("sos_alert", a.getId(), "SOS_RAISED", Map.of(
                "officer", actor,
                "geo", lat != null && lng != null ? lat + "," + lng : "unavailable"));
        return a;
    }

    @Transactional
    public SosAlert acknowledgeSos(UUID id, String actor) {
        SosAlert a = sos.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "alert not found"));
        try {
            a.acknowledge();
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        }
        audit.record(actor, "SOS_ACKNOWLEDGED", "sos_alert", id,
                "\"acknowledged\"", UUID.randomUUID());
        return a;
    }

    @Transactional(readOnly = true)
    public List<SosAlert> openSos() {
        return sos.findAllByStatusOrderByCreatedAtDesc("OPEN");
    }

    private static Instant max(Instant a, Instant b) {
        return a.isAfter(b) ? a : b;
    }
}

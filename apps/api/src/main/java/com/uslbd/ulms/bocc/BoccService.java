package com.uslbd.ulms.bocc;

import com.uslbd.ulms.customer.CustomerService;
import com.uslbd.ulms.platform.audit.AuditService;
import com.uslbd.ulms.platform.outbox.OutboxService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * BOCC committee flow (R3): schedule with auto-agenda from the branch's
 * APPROVAL queue, quorum-checked check-ins, per-case votes, close with
 * auto-minutes + outbox event.
 */
@Service
public class BoccService {

    private final BoccMeetingRepository meetings;
    private final CustomerService customers;
    private final AuditService audit;
    private final OutboxService outbox;

    BoccService(BoccMeetingRepository meetings, CustomerService customers,
                AuditService audit, OutboxService outbox) {
        this.meetings = meetings; this.customers = customers;
        this.audit = audit; this.outbox = outbox;
    }

    @Transactional(readOnly = true)
    public List<BoccMeeting> list() { return meetings.findAllByOrderByMeetingDateDesc(); }

    @Transactional(readOnly = true)
    public BoccMeeting get(UUID id) {
        return meetings.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "meeting not found"));
    }

    @Transactional
    public BoccMeeting schedule(String branchCode, LocalDate date, List<String> members, String actor) {
        if (members == null || members.size() < 3) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "at least 3 panel members required");
        }
        BoccMeeting m = BoccMeeting.schedule(UUID.randomUUID(), branchCode, date,
                members.size() / 2 + 1, actor);
        for (var a : meetings.pendingCasesAtBranch(branchCode)) {
            m.addAgendaItem(new BoccAgendaItem(UUID.randomUUID(), m.getId(), a.getId(),
                    a.getAppNo(), customers.get(a.getCustomerId()).getCifNo(), a.getAmountMinor()));
        }
        meetings.save(m);
        audit.record(actor, "BOCC_SCHEDULE", "bocc_meeting", m.getId(),
                "\"" + m.getAgenda().size() + " cases for " + branchCode + "\"", UUID.randomUUID());
        return m;
    }

    @Transactional
    public BoccMeeting checkIn(UUID id, String member) {
        BoccMeeting m = get(id);
        try {
            m.checkIn(member);
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        }
        return m;
    }

    @Transactional
    public BoccMeeting vote(UUID id, UUID agendaItemId, String member,
                            BoccVote.Vote vote, String dissent) {
        BoccMeeting m = get(id);
        try {
            m.vote(agendaItemId, member, vote, dissent);
        } catch (IllegalStateException | IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        }
        return m;
    }

    @Transactional
    public BoccMeeting close(UUID id, String actor) {
        BoccMeeting m = get(id);
        try {
            m.close();
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        }
        audit.record(actor, "BOCC_CLOSE", "bocc_meeting", m.getId(),
                "\"auto-minutes drafted\"", UUID.randomUUID());
        outbox.emit("bocc_meeting", m.getId(), "BOCC_CLOSED",
                Map.of("branch", m.getBranchCode(), "cases", m.getAgenda().size()));
        return m;
    }
}

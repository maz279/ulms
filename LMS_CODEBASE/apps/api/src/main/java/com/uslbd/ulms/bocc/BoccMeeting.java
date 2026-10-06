package com.uslbd.ulms.bocc;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * BOCC sitting (R3): branch credit committee meeting — agenda auto-built
 * from pending APPROVAL cases at the branch, quorum-checked attendance,
 * per-case votes with dissent, auto-minutes on close.
 */
@Entity
@Table(name = "bocc_meeting", schema = "ulms")
public class BoccMeeting {

    public enum Status { SCHEDULED, HELD, CLOSED }

    @Id private UUID id;
    @Column(name = "branch_code", nullable = false, length = 8) private String branchCode;
    @Column(name = "meeting_date", nullable = false) private LocalDate meetingDate;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 10) private Status status = Status.SCHEDULED;
    @Column(name = "quorum_needed", nullable = false) private int quorumNeeded;
    @Column(name = "minutes_text", columnDefinition = "text") private String minutesText;
    @Column(name = "closed_at") private Instant closedAt;
    @Column(name = "created_by", nullable = false, length = 64) private String createdBy;
    @Column(name = "created_at", nullable = false) private Instant createdAt = Instant.now();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "bocc_attendance", schema = "ulms",
                     joinColumns = @JoinColumn(name = "meeting_id"),
                     uniqueConstraints = @UniqueConstraint(columnNames = {"meeting_id", "member"}))
    @Column(name = "member", nullable = false, length = 64)
    private List<String> attendedMembers = new ArrayList<>();

    @OneToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "meeting_id", nullable = false)
    private List<BoccAgendaItem> agenda = new ArrayList<>();

    @OneToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "meeting_id", nullable = false)
    private List<BoccVote> votes = new ArrayList<>();

    protected BoccMeeting() {}

    public static BoccMeeting schedule(UUID id, String branchCode, LocalDate date,
                                       int quorumNeeded, String createdBy) {
        BoccMeeting m = new BoccMeeting();
        m.id = id; m.branchCode = branchCode; m.meetingDate = date;
        m.quorumNeeded = quorumNeeded; m.createdBy = createdBy;
        return m;
    }

    void checkIn(String member) {
        if (status == Status.CLOSED) throw new IllegalStateException("meeting closed");
        if (!attendedMembers.contains(member)) {
            attendedMembers.add(member);
            status = Status.HELD;
        }
    }

    boolean quorumMet() { return attendedMembers.size() >= quorumNeeded; }

    void vote(UUID agendaItemId, String member, BoccVote.Vote vote, String dissent) {
        if (status == Status.CLOSED) throw new IllegalStateException("meeting closed");
        if (!attendedMembers.contains(member)) {
            throw new IllegalArgumentException("only checked-in members vote");
        }
        boolean dup = votes.stream().anyMatch(v -> v.agendaItemId().equals(agendaItemId) && v.member().equals(member));
        if (dup) throw new IllegalStateException("one vote per member per case");
        votes.add(new BoccVote(agendaItemId, member, vote, dissent));
    }

    /** Close: quorum gate → resolution per case (majority APPROVE wins) → minutes draft. */
    void close() {
        if (status == Status.CLOSED) throw new IllegalStateException("already closed");
        if (!quorumMet()) {
            throw new IllegalStateException("quorum not met: " + attendedMembers.size() + "/" + quorumNeeded);
        }
        var sb = new StringBuilder("BOCC minutes — ").append(branchCode).append(' ').append(meetingDate)
                .append(". Present: ").append(String.join(", ", attendedMembers)).append(".\n");
        for (BoccAgendaItem item : agenda) {
            long approve = votes.stream().filter(v -> v.agendaItemId().equals(item.getId())
                    && v.getVote() == BoccVote.Vote.APPROVE).count();
            long total = votes.stream().filter(v -> v.agendaItemId().equals(item.getId())).count();
            String resolution = approve > total / 2 ? "RECOMMEND_APPROVE"
                    : votes.stream().anyMatch(v -> v.agendaItemId().equals(item.getId())
                            && v.getVote() == BoccVote.Vote.REJECT) ? "REJECT" : "HOLD";
            item.setResolution(resolution);
            sb.append(item.getAppNo()).append(": ").append(resolution)
                    .append(" (").append(total).append(" votes)\n");
        }
        this.minutesText = sb.toString();
        this.status = Status.CLOSED;
        this.closedAt = Instant.now();
    }

    public java.time.Instant getClosedAt() { return closedAt; }
    public String getCreatedBy() { return createdBy; }
    public java.time.Instant getCreatedAt() { return createdAt; }
    public UUID getId() { return id; }
    public String getBranchCode() { return branchCode; }
    public LocalDate getMeetingDate() { return meetingDate; }
    public Status getStatus() { return status; }
    public int getQuorumNeeded() { return quorumNeeded; }
    public String getMinutesText() { return minutesText; }
    public List<String> getAttendedMembers() { return attendedMembers; }
    public List<BoccAgendaItem> getAgenda() { return agenda; }
    public List<BoccVote> getVotes() { return votes; }
    void addAgendaItem(BoccAgendaItem item) { agenda.add(item); }
}

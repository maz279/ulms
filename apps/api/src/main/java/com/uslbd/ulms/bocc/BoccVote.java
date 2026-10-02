package com.uslbd.ulms.bocc;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/** Committee vote on an agenda case (R3) — one per member per case, dissent recorded. */
@Entity
@Table(name = "bocc_vote", schema = "ulms",
       uniqueConstraints = @UniqueConstraint(columnNames = {"agenda_item", "member"}))
public class BoccVote {

    public enum Vote { APPROVE, REJECT, HOLD, DEFER }

    @Id private UUID id;
    // FK written by BoccMeeting's @OneToMany @JoinColumn — read-only here
    @Column(name = "meeting_id", nullable = false, insertable = false, updatable = false) private UUID meetingId;
    @Column(name = "agenda_item", nullable = false) private UUID agendaItemId;
    @Column(nullable = false, length = 64) private String member;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 10) private Vote vote;
    @Column(columnDefinition = "text") private String dissent;
    @Column(name = "voted_at", nullable = false) private Instant votedAt = Instant.now();

    protected BoccVote() {}

    BoccVote(UUID agendaItemId, String member, Vote vote, String dissent) {
        this.id = UUID.randomUUID();
        this.agendaItemId = agendaItemId; this.member = member;
        this.vote = vote; this.dissent = dissent;
    }

    public UUID agendaItemId() { return agendaItemId; }
    public String member() { return member; }
    public Vote getVote() { return vote; }
    public String getDissent() { return dissent; }
}

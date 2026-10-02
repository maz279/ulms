package com.uslbd.ulms.customer;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/** Sanctions/PEP/adverse-media screening result (03 mod-customer; 06 §8 P1 hooks). */
@Entity
@Table(name = "screening_hit", schema = "ulms",
       indexes = @Index(name = "idx_screeninghit_customer", columnList = "customer_id"))
public class ScreeningHit {

    @Id @Column(nullable = false, updatable = false) private UUID id;
    @Column(name = "customer_id", nullable = false) private UUID customerId;
    @Column(name = "list_name", nullable = false, length = 60) private String listName;
    @Column(name = "matched_name", nullable = false, length = 200) private String matchedName;
    @Column(name = "checked_at", nullable = false) private Instant checkedAt = Instant.now();

    protected ScreeningHit() {}

    static ScreeningHit of(UUID id, UUID customerId, String listName, String matchedName) {
        ScreeningHit s = new ScreeningHit();
        s.id = id; s.customerId = customerId; s.listName = listName; s.matchedName = matchedName;
        return s;
    }

    public UUID getId() { return id; }
    public UUID getCustomerId() { return customerId; }
    public String getListName() { return listName; }
    public String getMatchedName() { return matchedName; }
    public Instant getCheckedAt() { return checkedAt; }
}

package com.uslbd.ulms.platform.outbox;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, UUID> {

    /** Pending rows, oldest first, bounded batch (the relay drains these). */
    List<OutboxEvent> findTop50ByDispatchedAtIsNullOrderByCreatedAtAsc();

    Optional<OutboxEvent> findById(UUID id);

    long countByDispatchedAtIsNotNull();

    @Modifying
    @Query("update OutboxEvent e set e.dispatchedAt = :at where e.id = :id")
    int markDispatched(@Param("id") UUID id, @Param("at") Instant at);
}

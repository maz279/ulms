package com.uslbd.ulms.platform.audit;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

interface AuditEntryRepository extends JpaRepository<AuditEntry, UUID> {
    Optional<AuditEntry> findTopByOrderByAtDesc();
}

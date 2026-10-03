package com.uslbd.ulms.platform.workflow;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface ApprovalConditionRepository extends JpaRepository<ApprovalCondition, UUID> {
    List<ApprovalCondition> findAllByInstanceIdOrderByCreatedAtAsc(UUID instanceId);
    long countByInstanceIdAndStatus(UUID instanceId, String status);
    Optional<ApprovalCondition> findByIdAndStatus(UUID id, String status);
}

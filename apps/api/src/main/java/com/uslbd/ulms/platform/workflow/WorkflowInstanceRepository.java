package com.uslbd.ulms.platform.workflow;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

interface WorkflowInstanceRepository extends JpaRepository<WorkflowInstance, UUID> {
    Optional<WorkflowInstance> findTopByAggregateAndAggregateIdOrderByIdDesc(String aggregate, UUID aggregateId);
}

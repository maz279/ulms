package com.uslbd.ulms.platform.workflow;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

interface WorkflowTaskRepository extends JpaRepository<WorkflowTask, UUID> {
    Optional<WorkflowTask> findTopByInstanceIdOrderByOpenedAtDesc(UUID instanceId);
    Optional<WorkflowTask> findByIdAndStatusNot(UUID id, String status);
}

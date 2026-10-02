package com.uslbd.ulms.platform.workflow;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface WorkflowDefinitionRepository extends JpaRepository<WorkflowDefinition, String> {
    Optional<WorkflowDefinition> findByKeyAndActiveTrue(String key);
}

interface WorkflowTransitionRepository extends JpaRepository<WorkflowTransition, UUID> {
    Optional<WorkflowTransition> findTopByTaskIdOrderByAtDesc(UUID taskId);
}

interface WorkflowTaskQueryRepository extends JpaRepository<WorkflowTask, UUID> {
    List<WorkflowTask> findAllByInstanceIdAndNodeOrderByOpenedAtAsc(UUID instanceId, String node);
    List<WorkflowTask> findAllByStatusOrderByOpenedAtDesc(String status);
}

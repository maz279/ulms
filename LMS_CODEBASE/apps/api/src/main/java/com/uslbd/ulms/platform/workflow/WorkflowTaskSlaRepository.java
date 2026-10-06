package com.uslbd.ulms.platform.workflow;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

interface WorkflowTaskSlaRepository extends JpaRepository<WorkflowTask, UUID> {
    List<WorkflowTask> findByStatusOrderByOpenedAtAsc(String status);
}

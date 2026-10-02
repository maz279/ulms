package com.uslbd.ulms.platform.workflow;

import java.util.UUID;

/**
 * Published on workflow completion (approved=true → COMPLETED; false → REJECTED).
 * Domain modules listen (synchronous @EventListener keeps the same transaction)
 * — keeps module dependencies acyclic (PLANNING/03 approval ↔ origination).
 */
public record WorkflowCompletedEvent(UUID instanceId, String aggregate, UUID aggregateId,
                                     boolean approved) {}

package com.uslbd.ulms.platform.workflow;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Workflow state machine oracle (PLANNING/09 §3): dual-phase, advance, reject,
 * return-once, completion event — against real Postgres + Flyway-seeded graph.
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class WorkflowServiceTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired WorkflowService workflow;

    UUID aggId = UUID.randomUUID();

    @Test
    void dualPhaseRequiresDifferentUserThenAdvances() {
        var started = workflow.start(WorkflowService.LADDER, "application", aggId, "L1");
        // maker (user A) approves ACTION → CHECK opens
        var check = workflow.act(started.task().getId(), WorkflowService.Action.APPROVE, "user:A", "ok");
        assertThat(check.event()).isEqualTo(WorkflowService.Event.DUAL_PHASE_CHECK);
        // maker cannot check own action
        assertThatThrownBy(() -> workflow.act(check.nextTask().getId(),
                WorkflowService.Action.APPROVE, "user:A", null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Maker-checker violation");
        // checker (user B) completes → advance to L2
        var adv = workflow.act(check.nextTask().getId(), WorkflowService.Action.APPROVE, "user:B", "checked");
        assertThat(adv.event()).isEqualTo(WorkflowService.Event.NODE_ADVANCED);
        assertThat(adv.instance().getCurrentNode()).isEqualTo("L2");
    }

    @Test
    void rejectIsTerminal() {
        var s = workflow.start(WorkflowService.LADDER, "application", UUID.randomUUID(), "L3");
        var out = workflow.act(s.task().getId(), WorkflowService.Action.REJECT, "user:X", "policy");
        assertThat(out.event()).isEqualTo(WorkflowService.Event.REJECTED);
        assertThat(out.instance().getStatus()).isEqualTo("REJECTED");
    }

    @Test
    void returnReopensPreviousNode() {
        var s = workflow.start(WorkflowService.LADDER, "application", UUID.randomUUID(), "L2");
        var out = workflow.act(s.task().getId(), WorkflowService.Action.RETURN, "user:X", "docs missing");
        assertThat(out.event()).isEqualTo(WorkflowService.Event.NODE_ADVANCED);
        assertThat(out.instance().getCurrentNode()).isEqualTo("L1");
    }

    @Test
    void completionAtL7FiresCompleted() {
        var s = workflow.start(WorkflowService.LADDER, "application", UUID.randomUUID(), "L7");
        var out = workflow.act(s.task().getId(), WorkflowService.Action.APPROVE, "user:md", null);
        assertThat(out.event()).isEqualTo(WorkflowService.Event.COMPLETED);
        assertThat(out.instance().getStatus()).isEqualTo("COMPLETED");
    }
}

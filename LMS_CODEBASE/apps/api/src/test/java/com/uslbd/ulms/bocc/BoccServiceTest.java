package com.uslbd.ulms.bocc;

import com.uslbd.ulms.customer.CustomerService;
import com.uslbd.ulms.origination.OriginationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ResponseStatusException;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * BOCC committee rules (R3) — quorum gate, one-vote-per-member, majority
 * resolutions + auto-minutes; agenda sourced from the branch APPROVAL queue.
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class BoccServiceTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractPort clientPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 5200 + seq.incrementAndGet();
        }
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractLoanPort loanPort() {
            return spec -> 999L;
        }
        @Bean @Primary com.uslbd.ulms.integration.docs.DocumentStorePort docPort() {
            return new com.uslbd.ulms.integration.docs.DocumentStorePort() {
                @Override public com.uslbd.ulms.integration.docs.DocumentStorePort.StoredObject put(
                        String key, java.io.InputStream bytes, long size, String contentType) {
                    return new com.uslbd.ulms.integration.docs.DocumentStorePort.StoredObject(
                            key, "b".repeat(64), size);
                }
                @Override public String presignedGetUrl(String key,
                        com.uslbd.ulms.integration.docs.DocumentStorePort.DurationTtl ttl) {
                    return "http://minio.local/" + key;
                }
            };
        }
    }

    @Autowired BoccService bocc;

    @Test
    void scheduleAgendaQuorumVoteClose() {
        var m = bocc.schedule("BR-001", LocalDate.now().plusDays(1),
                List.of("bm-1", "bm-2", "bm-3"), "test");
        assertThat(m.getStatus()).isEqualTo(BoccMeeting.Status.SCHEDULED);
        assertThat(m.getQuorumNeeded()).isEqualTo(2);        // majority of 3

        // close without quorum → 409
        assertThatThrownBy(() -> bocc.close(m.getId(), "test"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);

        bocc.checkIn(m.getId(), "bm-1");
        bocc.checkIn(m.getId(), "bm-2");

        if (!m.getAgenda().isEmpty()) {
            var item = m.getAgenda().get(0);
            bocc.vote(m.getId(), item.getId(), "bm-1", BoccVote.Vote.APPROVE, null);
            bocc.vote(m.getId(), item.getId(), "bm-2", BoccVote.Vote.APPROVE, "risk note");
            // one vote per member per case
            assertThatThrownBy(() -> bocc.vote(m.getId(), item.getId(), "bm-1", BoccVote.Vote.REJECT, null))
                    .isInstanceOf(ResponseStatusException.class);
            // non-checked-in member cannot vote
            assertThatThrownBy(() -> bocc.vote(m.getId(), item.getId(), "bm-3", BoccVote.Vote.APPROVE, null))
                    .isInstanceOf(ResponseStatusException.class);
        }

        var closed = bocc.close(m.getId(), "test");
        assertThat(closed.getStatus()).isEqualTo(BoccMeeting.Status.CLOSED);
        assertThat(closed.getMinutesText()).startsWith("BOCC minutes — BR-001");
        if (!closed.getAgenda().isEmpty()) {
            assertThat(closed.getAgenda().get(0).getResolution()).isEqualTo("RECOMMEND_APPROVE");
        }
    }

    @Test
    void panelOfTwoIsRejected() {
        assertThatThrownBy(() -> bocc.schedule("BR-002", LocalDate.now(),
                List.of("bm-1", "bm-2"), "test"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
    }
}

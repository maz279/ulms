package com.uslbd.ulms.customer;

import com.uslbd.ulms.integration.fineract.FineractPort;
import com.uslbd.ulms.integration.screening.ScreeningPort;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Screening hook oracle (06 §8 P1): a hit persists screening_hit + audits;
 * the default no-list adapter reports CLEAR. Idempotency replay (05 §4) is
 * exercised at the service level here.
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class ScreeningAndIdempotencyTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary FineractPort fineractPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 4000 + seq.incrementAndGet();
        }
        /** One sanctions hit for every screened name — exercises persistence. */
        @Bean @Primary ScreeningPort screeningPort() {
            return nameEn -> new ScreeningPort.ScreeningResult(java.util.List.of(
                    new ScreeningPort.ScreeningMatch("sanctions", "SIMILAR TO " + nameEn)));
        }
    }

    @Autowired CustomerService customers;
    @Autowired com.uslbd.ulms.platform.idempotency.IdempotencyService idempotency;
    @Autowired JdbcTemplate jdbc;

    @Test
    void screeningPersistsHitsAndAudits() {
        var req = new CustomerCreateRequest("Screened Person", null,
                Customer.Segment.SME, "+8801712345678", null, "BR-001");
        Customer c = customers.create(req, UUID.randomUUID(), "user:test", UUID.randomUUID());

        var hits = customers.screen(c.getId(), "user:compliance");
        assertThat(hits).hasSize(1);
        assertThat(hits.get(0).getListName()).isEqualTo("sanctions");
        assertThat(jdbc.queryForObject(
                "select count(*) from ulms.screening_hit where customer_id = ?",
                Long.class, c.getId())).isEqualTo(1L);
        assertThat(lastAction()).isEqualTo("CUSTOMER_SCREENED");
    }

    @Test
    void idempotencyReplayReturnsStoredResponse() {
        UUID key = UUID.randomUUID();
        String endpoint = "POST /customers";
        var body = new CustomerCreateRequest("Idem Person", null,
                Customer.Segment.RETAIL, "+8801812345678", null, "BR-001");

        assertThat(idempotency.replayOf(key, endpoint, body)).isEmpty();   // first call

        idempotency.record(key, endpoint, body, 201, java.util.Map.of("id", "x"));
        assertThat(idempotency.replayOf(key, endpoint, body)).isPresent(); // replay hits
        assertThat(idempotency.replayOf(key, endpoint, body).get().statusCode()).isEqualTo(201);

        var otherBody = new CustomerCreateRequest("Different", null,
                Customer.Segment.RETAIL, "+8801912345678", null, "BR-002");
        assertThat(idempotency.replayOf(key, endpoint, otherBody)).isEmpty();     // same key, other body
        assertThat(idempotency.isConflict(key, endpoint, otherBody)).isTrue();    // 409 signal
    }

    private String lastAction() {
        return jdbc.queryForObject(
                "select action from ulms.audit_entry order by at desc limit 1", String.class);
    }
}

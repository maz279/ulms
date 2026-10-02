package com.uslbd.ulms.approval;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Ladder band boundary oracle (PLANNING/09 §3): ±৳1 around every band edge.
 * Amounts in BDT minor units (৳1 = 100).
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class LadderBoundaryTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired LadderService ladder;

    // minor units: ৳1=100 · edges: 5L=5e7, 10L=1e8, 25L=2.5e8, 50L=5e8, 2.5Cr=2.5e9, 10Cr=1e10
    @ParameterizedTest(name = "{0} minor → {1}")
    @CsvSource({
        "1,            L1",   // ৳0.01
        "49999999,     L1",   // ৳499,999.99  (just under ৳5L)
        "50000000,     L1",   // ৳5L exactly (max inclusive)
        "50000001,     L2",   // ৳5L + ৳0.01
        "100000000,    L2",   // ৳10L exactly
        "100000001,    L3",
        "250000000,    L3",   // ৳25L
        "250000001,    L4",
        "500000000,    L4",   // ৳50L
        "500000001,    L5",
        "2500000000,   L5",   // ৳2.5Cr
        "2500000001,   L6",
        "10000000000,  L6",   // ৳10Cr
        "10000000001,  L7",   // > ৳10Cr
        "999999999999, L7"
    })
    void bandBoundaries(long amountMinor, String expectedNode) {
        assertThat(ladder.startNodeFor(amountMinor)).isEqualTo(expectedNode);
    }

    @Test
    void ladderHasSevenRungsInOrder() {
        var rungs = ladder.ladder();
        assertThat(rungs).hasSize(7);
        assertThat(rungs.get(0).level()).isEqualTo(1);
        assertThat(rungs.get(6).roleKey()).isEqualTo("ladder-7");
    }
}

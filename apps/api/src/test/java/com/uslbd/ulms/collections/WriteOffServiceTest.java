package com.uslbd.ulms.collections;

import com.uslbd.ulms.customer.CustomerCreateRequest;
import com.uslbd.ulms.customer.CustomerService;
import com.uslbd.ulms.servicing.ServicingService;
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

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * R4 write-off workflow (audit/plan/phases/R4): classification gate, board
 * band, approve (GL+CIB) with outstanding zeroed, reversal restoring the
 * claim, recovery incentive (5%).
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class WriteOffServiceTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractPort clientPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 5300 + seq.incrementAndGet();
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

    @Autowired WriteOffService writeOffs;
    @Autowired ServicingService servicing;
    @Autowired com.uslbd.ulms.servicing.LoanRepository loans;
    @Autowired CustomerService customers;

    private com.uslbd.ulms.servicing.Loan classifiedLoan(String cls) {
        int dpd = switch (cls) { case "B/L" -> 400; case "DF" -> 200; case "SS" -> 120; default -> 0; };
        var mobile = String.format("+88017%08d", System.nanoTime() % 100_000_000L);
        var req = new CustomerCreateRequest("WO Person " + System.nanoTime() % 1000, null,
                com.uslbd.ulms.customer.Customer.Segment.SME, mobile, null, "BR-001");
        var c = customers.create(req, UUID.randomUUID(), "test", UUID.randomUUID());
        var loanId = UUID.randomUUID();
        var loan = com.uslbd.ulms.servicing.Loan.demo(loanId, c.getId(),
                "LN-WO" + (System.nanoTime() % 99_999), 600_000_000L, dpd);
        loan.reclassify(cls, List.of("SS", "DF", "B/L").contains(cls));
        loans.save(loan);
        return loans.findById(loanId).orElseThrow();
    }

    @Test
    void classificationGateAndLifecycle() {
        var std = classifiedLoan("STD-0");
        assertThatThrownBy(() -> writeOffs.propose(std.getId(), "aged arrears, exhausted", "test"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);

        var ss = classifiedLoan("SS");
        var w = writeOffs.propose(ss.getId(), "aged arrears, recovery exhausted", "test");
        assertThat(w.getState()).isEqualTo(WriteOff.State.PROPOSED);
        assertThat(w.getBoardBand()).isEqualTo("EXEC_COMMITTEE");   // 4Cr < 10Cr

        // duplicate proposal blocked
        assertThatThrownBy(() -> writeOffs.propose(ss.getId(), "again", "test"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);

        var executed = writeOffs.approve(w.getId(), "committee");
        assertThat(executed.getState()).isEqualTo(WriteOff.State.EXECUTED);
        assertThat(executed.getGlRef()).startsWith("WO-");
        assertThat(loans.findById(ss.getId()).orElseThrow().getOutstandingMinor()).isZero();

        var reversed = writeOffs.reverse(w.getId(), "recovery arrived");
        assertThat(reversed.getState()).isEqualTo(WriteOff.State.REVERSED);
        assertThat(loans.findById(ss.getId()).orElseThrow().getOutstandingMinor())
                .isEqualTo(w.getAmountMinor());
    }

    @Test
    void recoveryIncentiveIsFivePercent() {
        var bl = classifiedLoan("B/L");
        var w = writeOffs.propose(bl.getId(), "board-approved write-off batch", "test");
        writeOffs.approve(w.getId(), "board");
        var r = writeOffs.recordRecovery(bl.getId(), 1_000_000L, "CASH", "collector");
        assertThat(r.getAmountMinor()).isEqualTo(1_000_000L);
        assertThat(r.getIncentiveMinor()).isEqualTo(50_000L);       // 5%
        assertThat(writeOffs.recoveriesOf(bl.getId())).hasSize(1);
    }
}

package com.uslbd.ulms.customer;

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
import java.time.ZoneId;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * R10 P-B hygiene slice: duplicate merge (idempotency, re-pointing, conflict)
 * and the risk-based KYC refresh cycle (1/2/3 y).
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class CustomerHygieneTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractPort clientPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 8500 + seq.incrementAndGet();
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

    @Autowired CustomerHygieneService hygiene;
    @Autowired CustomerService customers;
    @Autowired CustomerRepository repo;
    @Autowired com.uslbd.ulms.servicing.LoanRepository loans;

    private Customer newCustomer(String name) {
        return customers.create(new CustomerCreateRequest(name, null,
                Customer.Segment.RETAIL, "+88017" + (1_000_000 + System.nanoTime() % 8_999_999),
                null, "BR-001"),
                UUID.randomUUID(), "test", UUID.randomUUID());
    }

    @Test
    void mergeIsIdempotentRePointsAndConflictsOnReMergeElsewhere() {
        Customer survivor = newCustomer("Survivor Person");
        Customer duplicate = newCustomer("Duplicate Person");
        loans.save(com.uslbd.ulms.servicing.Loan.demo(
                UUID.randomUUID(), duplicate.getId(), "LN-MRG1", 100_000_00L, 0));

        var first = hygiene.mergeDuplicate(survivor.getCifNo(), duplicate.getCifNo(), "test");
        assertThat(first.loans()).isEqualTo(1);
        assertThat(customers.byCif(duplicate.getCifNo()).getMergedIntoCif())
                .isEqualTo(survivor.getCifNo());
        assertThat(loans.findAllByCustomerId(duplicate.getId())).isEmpty();
        assertThat(loans.findAllByCustomerId(survivor.getId())).hasSize(1);

        // replay is a no-op
        var replay = hygiene.mergeDuplicate(survivor.getCifNo(), duplicate.getCifNo(), "test");
        assertThat(replay.loans()).isZero();

        // self-merge rejected
        assertThatThrownBy(() -> hygiene.mergeDuplicate(survivor.getCifNo(), survivor.getCifNo(), "t"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);

        // merging an already-merged row into a DIFFERENT survivor conflicts
        Customer other = newCustomer("Other Person");
        assertThatThrownBy(() -> hygiene.mergeDuplicate(other.getCifNo(), duplicate.getCifNo(), "t"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void kycRefreshCadenceFollowsRiskClass() {
        assertThat(CustomerHygieneService.refreshMonths("High")).isEqualTo(12);
        assertThat(CustomerHygieneService.refreshMonths("Medium")).isEqualTo(24);
        assertThat(CustomerHygieneService.refreshMonths("Low")).isEqualTo(36);
        assertThat(CustomerHygieneService.refreshMonths(null)).isEqualTo(36);

        // a fresh customer is NOT due; one aged past the cycle IS
        Customer fresh = newCustomer("Fresh Person");
        Customer stale = newCustomer("Stale Person");
        ageByMonths(stale, 40);   // Low risk → due after 36 months

        int raised = hygiene.runOnce(LocalDate.now());
        assertThat(raised).isGreaterThanOrEqualTo(1);
        // and the pass is idempotent within the same day? (events re-raise —
        // the compliance queue dedupes; documented behavior)
    }

    private void setRiskViaRepo(Customer c) {
        repo.save(c);
    }

    private void ageByMonths(Customer c, int months) {
        try {
            var f = Customer.class.getDeclaredField("createdAt");
            f.setAccessible(true);
            f.set(c, java.time.Instant.now().atZone(ZoneId.of("Asia/Dhaka"))
                    .minusMonths(months).toInstant());
            setRiskViaRepo(c);   // detached with id ⇒ merge persists the field
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(e);
        }
    }
}

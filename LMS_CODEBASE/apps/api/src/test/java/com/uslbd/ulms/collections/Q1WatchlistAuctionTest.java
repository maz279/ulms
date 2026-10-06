package com.uslbd.ulms.collections;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Q1.4 + Q1.5 gates (PLAN-03 mod-collections depth):
 *  - watchlist: manual add with reason codes, one OPEN row per loan,
 *    terminal clear, and the nightly STD-2 auto-flag (idempotent)
 *  - auction ledger: written-off-only gate, SCHEDULED → HELD → SOLD, and
 *    THE gate — auction proceeds land as a RecoveryEntry with the 5%
 *    recovery incentive computed (CL-3 reporting picks it up from there)
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class Q1WatchlistAuctionTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractPort clientPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 9800 + seq.incrementAndGet();
        }
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractLoanPort loanPort() {
            return spec -> 9900L;
        }
        @Bean @Primary com.uslbd.ulms.integration.docs.DocumentStorePort docPort() {
            return new com.uslbd.ulms.integration.docs.DocumentStorePort() {
                @Override public StoredObject put(String key, java.io.InputStream bytes,
                                                  long size, String contentType) {
                    return new StoredObject(key, "e".repeat(64), size);
                }
                @Override public String presignedGetUrl(String key, DurationTtl ttl) {
                    return "http://minio.local/" + key;
                }
            };
        }
    }

    @Autowired WatchlistService watchlist;
    @Autowired AuctionService auctions;
    @Autowired WriteOffService writeOffs;
    @Autowired com.uslbd.ulms.servicing.LoanRepository loans;

    // ── Q1.4 watchlist ────────────────────────────────────────────────────

    @Test
    void watchlistAddIsSingleOpenPerLoanAndClearIsTerminal() {
        var loan = loan("STD-0");

        var entry = watchlist.add(loan.getId(), "DPD_RISING",
                "2 cheques bounced, DPD trending 12→19", 5, "user:officer");
        assertThat(entry.getStatus()).isEqualTo("OPEN");
        assertThat(entry.getReviewBy()).isAfter(Instant.now());

        // one OPEN row per loan
        assertThatThrownBy(() -> watchlist.add(loan.getId(), "CIB_ALERT", null, null, "user:officer"))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class)
                .hasMessageContaining("already on the watchlist");

        // unknown reason codes are refused
        assertThatThrownBy(() -> watchlist.add(loan.getId(), "GUT_FEEL", null, null, "user:officer"))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class)
                .hasMessageContaining("reasonCode");

        // clearing is terminal; a re-offender enters as a fresh row
        var cleared = watchlist.clear(entry.getId(), "regularized via branch visit", "user:manager");
        assertThat(cleared.getStatus()).isEqualTo("CLEARED");
        assertThatThrownBy(() -> watchlist.clear(entry.getId(), null, "user:manager"))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class)
                .hasMessageContaining("already CLEARED");
        var again = watchlist.add(loan.getId(), "FIELD_INTEL", "re-offending", null, "user:officer");
        assertThat(again.getStatus()).isEqualTo("OPEN");

        // the working list shows the OPEN row
        assertThat(watchlist.list("OPEN")).extracting(WatchlistEntry::getLoanId)
                .contains(loan.getId());
    }

    @Test
    void nightlyScanAutoFlagsStd2Idempotently() {
        var std2 = loan("STD-2");
        var healthy = loan("STD-0");

        int first = watchlist.flagNewlyStd2();
        assertThat(first).isGreaterThanOrEqualTo(1);
        var rows = watchlist.list("OPEN");
        assertThat(rows).anyMatch(w -> w.getLoanId().equals(std2.getId())
                && "AUTO_STD2".equals(w.getReasonCode()));
        assertThat(rows).noneMatch(w -> w.getLoanId().equals(healthy.getId()));

        // idempotent — the OPEN-per-loan gate makes the re-run a no-op
        assertThat(watchlist.flagNewlyStd2()).isZero();
    }

    // ── Q1.5 auction ledger ───────────────────────────────────────────────

    @Test
    void auctionRequiresWrittenOffLoanAndProceedsCutAnIncentivizedRecovery() {
        var loan = loan("B/L");
        var writeOff = writeOffs.propose(loan.getId(),
                "B/L classified, no viable restructuring path", "user:officer");
        writeOffs.approve(writeOff.getId(), "user:manager");
        assertThat(loans.findById(loan.getId()).orElseThrow().getOutstandingMinor()).isZero();

        var entry = auctions.schedule(loan.getId(), "DEED-2291/2019",
                "Dhaka Metropolitan Auction House", Instant.now().plusSeconds(86_400),
                5_000_000_00L, "user:officer");
        assertThat(entry.getStatus()).isEqualTo("SCHEDULED");

        auctions.markHeld(entry.getId(), "user:officer");
        var sold = auctions.markSold(entry.getId(), 4_800_000_00L,
                "M/s Karim Traders", "user:manager");

        // THE gate: proceeds land as a RecoveryEntry (mode AUCTION) with the
        // 5% recovery incentive computed — CL-3 picks the ledger up from there
        assertThat(sold.getStatus()).isEqualTo("SOLD");
        assertThat(sold.getProceedsMinor()).isEqualTo(4_800_000_00L);
        assertThat(sold.getRecoveryId()).isNotNull();
        var recovery = writeOffs.recoveriesOf(loan.getId()).stream()
                .filter(r -> r.getId().equals(sold.getRecoveryId())).findFirst().orElseThrow();
        assertThat(recovery.getMode()).isEqualTo("AUCTION");
        assertThat(recovery.getAmountMinor()).isEqualTo(4_800_000_00L);
        assertThat(recovery.getIncentiveMinor()).isEqualTo(240_000_00L);   // 5%

        // a sold auction is immutable
        assertThatThrownBy(() -> auctions.cancel(sold.getId(), "user:officer"))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class)
                .hasMessageContaining("cannot be cancelled");
    }

    @Test
    void auctionOnALiveLoanIsRefused() {
        var loan = loan("STD-0");   // no write-off in flight
        assertThatThrownBy(() -> auctions.schedule(loan.getId(), null, "venue",
                Instant.now().plusSeconds(3_600), 1_000_000_00L, "user:officer"))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class)
                .hasMessageContaining("written-off loans only");
    }

    // ── helpers ───────────────────────────────────────────────────────────

    @Autowired com.uslbd.ulms.customer.CustomerService customers;

    /** Migrated-loan fixture (Loan.demo: application_id NULL, no FK row). */
    private com.uslbd.ulms.servicing.Loan loan(String classification) {
        var mobile = String.format("+88017%08d", System.nanoTime() % 100_000_000L);
        var req = new com.uslbd.ulms.customer.CustomerCreateRequest(
                "Q1 Person " + System.nanoTime() % 1000, null,
                com.uslbd.ulms.customer.Customer.Segment.SME, mobile, null, "BR-001");
        var customer = customers.create(req, UUID.randomUUID(), "user:test", UUID.randomUUID());
        var loanId = UUID.randomUUID();
        var l = com.uslbd.ulms.servicing.Loan.demo(loanId, customer.getId(),
                "LN-Q1-" + System.nanoTime() % 1_000_000, 15_000_000_00L,
                "STD-2".equals(classification) ? 45 : 0);
        if (!"STD-0".equals(classification)) {
            l.reclassify(classification, true);
        }
        loans.save(l);
        return loans.findById(loanId).orElseThrow();
    }
}

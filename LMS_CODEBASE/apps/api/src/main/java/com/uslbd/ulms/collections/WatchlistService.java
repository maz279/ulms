package com.uslbd.ulms.collections;

import com.uslbd.ulms.customer.CustomerRepository;
import com.uslbd.ulms.platform.audit.AuditService;
import com.uslbd.ulms.servicing.Loan;
import com.uslbd.ulms.servicing.LoanRepository;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

/**
 * Collections early-warning watchlist (Q1.4, PLAN-03 mod-collections).
 * Manual officer adds with validated reason codes + review cadence, plus
 * the nightly scan that auto-flags accounts entering STD-2 (31-60 DPD) —
 * the pre-SMA intervention window. Presence on the list triggers graduated
 * dunning earlier; clearing is terminal and evidenced.
 */
@Service
public class WatchlistService {

    private final WatchlistRepository watchlist;
    private final LoanRepository loans;
    private final CustomerRepository customers;
    private final AuditService audit;

    WatchlistService(WatchlistRepository watchlist, LoanRepository loans,
                     CustomerRepository customers, AuditService audit) {
        this.watchlist = watchlist; this.loans = loans;
        this.customers = customers; this.audit = audit;
    }

    @Transactional
    public WatchlistEntry add(UUID loanId, String reasonCode, String note,
                              Integer reviewWithinDays, String actor) {
        if (!WatchlistEntry.REASONS.contains(reasonCode)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "reasonCode must be one of " + WatchlistEntry.REASONS);
        }
        Loan loan = loans.findById(loanId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "loan not found"));
        watchlist.findByLoanIdAndStatus(loanId, "OPEN").ifPresent(w -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "loan already on the watchlist (" + w.getReasonCode() + ")");
        });
        WatchlistEntry entry = WatchlistEntry.open(UUID.randomUUID(), loanId,
                cifOf(loan), loan.getLoanNo(), reasonCode, note,
                java.time.Instant.now().plus(Duration.ofDays(
                        reviewWithinDays == null ? 7 : reviewWithinDays)), actor);
        watchlist.save(entry);
        audit.record(actor, "WATCHLIST_ADD", "watchlist_entry", entry.getId(),
                "\"" + loan.getLoanNo() + " " + reasonCode + "\"", UUID.randomUUID());
        return entry;
    }

    @Transactional
    public WatchlistEntry clear(UUID id, String note, String actor) {
        WatchlistEntry entry = watchlist.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "entry not found"));
        try {
            entry.clear(actor, note);
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        }
        audit.record(actor, "WATCHLIST_CLEAR", "watchlist_entry", id,
                "\"" + entry.getLoanNo() + "\"", UUID.randomUUID());
        return entry;
    }

    @Transactional(readOnly = true)
    public List<WatchlistEntry> list(String status) {
        String s = status == null || status.isBlank() ? "OPEN" : status.toUpperCase();
        if ("ALL".equals(s)) {
            return watchlist.findAll().stream()
                    .sorted(java.util.Comparator.comparing(WatchlistEntry::getAddedAt).reversed())
                    .toList();
        }
        return watchlist.findAllByStatusOrderByReviewByAsc(s);
    }

    /**
     * Nightly early-warning scan: every loan entering STD-2 (31-60 DPD) gets
     * an AUTO_STD2 row with a 7-day review cadence. Idempotent — the OPEN
     * unique-per-loan gate makes re-runs no-ops. Invoked by the scheduler
     * (02:15 Asia/Dhaka) and directly by the batch tests.
     */
    @Scheduled(cron = "0 15 2 * * *", zone = "Asia/Dhaka")
    @Transactional
    public int flagNewlyStd2() {
        int added = 0;
        for (Loan loan : loans.findAllByClassification("STD-2")) {
            if (watchlist.findByLoanIdAndStatus(loan.getId(), "OPEN").isPresent()) continue;
            WatchlistEntry entry = WatchlistEntry.open(UUID.randomUUID(), loan.getId(),
                    cifOf(loan), loan.getLoanNo(), "AUTO_STD2",
                    "auto: classification entered STD-2 (31-60 DPD)",
                    java.time.Instant.now().plus(Duration.ofDays(7)), "system:watchlist");
            watchlist.save(entry);
            audit.record("system:watchlist", "WATCHLIST_ADD", "watchlist_entry", entry.getId(),
                    "\"" + loan.getLoanNo() + " AUTO_STD2\"", UUID.randomUUID());
            added++;
        }
        return added;
    }

    private String cifOf(Loan loan) {
        return customers.findById(loan.getCustomerId()).map(c -> c.getCifNo()).orElse("?");
    }
}

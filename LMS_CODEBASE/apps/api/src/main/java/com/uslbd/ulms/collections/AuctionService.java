package com.uslbd.ulms.collections;

import com.uslbd.ulms.customer.CustomerRepository;
import com.uslbd.ulms.platform.audit.AuditService;
import com.uslbd.ulms.servicing.Loan;
import com.uslbd.ulms.servicing.LoanRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Collateral auction/disposal ledger (Q1.5, ULS-01 §6.3 recovery
 * management). Auctions are tracked on WRITTEN-OFF loans only — the
 * collateral has been possessed, the account is closed at zero, and the
 * auction recovers against the write-off. Selling cuts a RecoveryEntry
 * (mode AUCTION) through the existing 5%-incentive ledger, so CL-3 and
 * the recovery board see auction proceeds like any other recovery.
 */
@Service
public class AuctionService {

    private final AuctionRepository auctions;
    private final WriteOffRepository writeOffs;
    private final WriteOffService writeOffService;
    private final LoanRepository loans;
    private final CustomerRepository customers;
    private final AuditService audit;

    AuctionService(AuctionRepository auctions, WriteOffRepository writeOffs,
                   WriteOffService writeOffService, LoanRepository loans,
                   CustomerRepository customers, AuditService audit) {
        this.auctions = auctions; this.writeOffs = writeOffs;
        this.writeOffService = writeOffService; this.loans = loans;
        this.customers = customers; this.audit = audit;
    }

    /** Schedule an auction — the loan must carry an EXECUTED write-off. */
    @Transactional
    public AuctionEntry schedule(UUID loanId, String collateralRef, String venue,
                                 Instant scheduledFor, long reserveMinor, String actor) {
        Loan loan = loans.findById(loanId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "loan not found"));
        boolean executed = writeOffs.findAllByLoanIdOrderByProposedAtDesc(loanId).stream()
                .anyMatch(w -> w.getState() == WriteOff.State.EXECUTED);
        if (!executed) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "auctions track written-off loans only (no EXECUTED write-off on "
                            + loan.getLoanNo() + ")");
        }
        if (venue == null || venue.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "venue is required");
        }
        if (scheduledFor == null || scheduledFor.isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "scheduledFor must be in the future");
        }
        if (reserveMinor <= 0) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "reserveMinor must be positive");
        }
        AuctionEntry entry = AuctionEntry.schedule(UUID.randomUUID(), loanId, cifOf(loan),
                loan.getLoanNo(), collateralRef, venue, scheduledFor, reserveMinor, actor);
        auctions.save(entry);
        audit.record(actor, "AUCTION_SCHEDULED", "auction_entry", entry.getId(),
                "\"" + loan.getLoanNo() + " " + venue + "\"", UUID.randomUUID());
        return entry;
    }

    @Transactional
    public AuctionEntry markHeld(UUID id, String actor) {
        AuctionEntry entry = get(id);
        try {
            entry.markHeld();
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        }
        audit.record(actor, "AUCTION_HELD", "auction_entry", id,
                "\"held\"", UUID.randomUUID());
        return entry;
    }

    /** SOLD cuts the RecoveryEntry (mode AUCTION, 5% incentive policy). */
    @Transactional
    public AuctionEntry markSold(UUID id, long proceedsMinor, String buyer, String actor) {
        AuctionEntry entry = get(id);
        if (buyer == null || buyer.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "buyer is required");
        }
        RecoveryEntry recovery = writeOffService.recordRecovery(
                entry.getLoanId(), proceedsMinor, "AUCTION", actor);
        try {
            entry.markSold(proceedsMinor, buyer, recovery.getId());
        } catch (IllegalStateException | IllegalArgumentException e) {
            // rollback the recovery row too — the ledger and entry move together
            throw new ResponseStatusException(
                    e instanceof IllegalArgumentException ? HttpStatus.UNPROCESSABLE_ENTITY : HttpStatus.CONFLICT,
                    e.getMessage());
        }
        audit.record(actor, "AUCTION_SOLD", "auction_entry", id,
                "{\"proceeds\":" + proceedsMinor + ",\"recovery\":\"" + recovery.getId() + "\"}",
                UUID.randomUUID());
        return entry;
    }

    @Transactional
    public AuctionEntry markUnsold(UUID id, String actor) {
        AuctionEntry entry = get(id);
        try {
            entry.markUnsold();
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        }
        audit.record(actor, "AUCTION_UNSOLD", "auction_entry", id,
                "\"unsold\"", UUID.randomUUID());
        return entry;
    }

    @Transactional
    public AuctionEntry cancel(UUID id, String actor) {
        AuctionEntry entry = get(id);
        try {
            entry.cancel();
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        }
        audit.record(actor, "AUCTION_CANCELLED", "auction_entry", id,
                "\"cancelled\"", UUID.randomUUID());
        return entry;
    }

    @Transactional(readOnly = true)
    public List<AuctionEntry> list(String status, UUID loanId) {
        if (loanId != null) return auctions.findAllByLoanIdOrderByScheduledForDesc(loanId);
        if (status == null || status.isBlank()) return auctions.findAll();
        return auctions.findAllByStatusOrderByScheduledForAsc(status.toUpperCase());
    }

    private AuctionEntry get(UUID id) {
        return auctions.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "auction not found"));
    }

    private String cifOf(Loan loan) {
        return customers.findById(loan.getCustomerId()).map(c -> c.getCifNo()).orElse("?");
    }
}

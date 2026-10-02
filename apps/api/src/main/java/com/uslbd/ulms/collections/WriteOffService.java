package com.uslbd.ulms.collections;

import com.uslbd.ulms.customer.CustomerRepository;
import com.uslbd.ulms.platform.audit.AuditService;
import com.uslbd.ulms.platform.outbox.OutboxService;
import com.uslbd.ulms.servicing.Loan;
import com.uslbd.ulms.servicing.LoanRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Write-off workflow + recovery ledger (R4): SS/DF/B-L gate at proposal,
 * board band by amount, GL JV + CIB flag on approve (loan closed at zero),
 * reversal restores outstanding when recovery arrives. 5% incentive policy.
 * Talks to the servicing aggregates via their own repositories — the Loan
 * entity's write-off mutations are package-private to servicing, so this
 * service goes through the R4 bridge below.
 */
@Service
public class WriteOffService {

    static final long BOARD_BAND_MINOR = 10_000_000_000L;        // > ৳10Cr → BOARD
    static final double INCENTIVE_RATE = 0.05;                    // 5% policy

    private final WriteOffRepository writeOffs;
    private final RecoveryRepository recoveries;
    private final LoanRepository loans;
    private final CustomerRepository customers;
    private final AuditService audit;
    private final OutboxService outbox;

    WriteOffService(WriteOffRepository writeOffs, RecoveryRepository recoveries,
                    LoanRepository loans, CustomerRepository customers,
                    AuditService audit, OutboxService outbox) {
        this.writeOffs = writeOffs; this.recoveries = recoveries;
        this.loans = loans; this.customers = customers;
        this.audit = audit; this.outbox = outbox;
    }

    private Loan loan(UUID loanId) {
        return loans.findById(loanId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "loan not found"));
    }

    @Transactional(readOnly = true)
    public List<WriteOff> register() { return writeOffs.findAllByOrderByProposedAtDesc(); }

    @Transactional
    public WriteOff propose(UUID loanId, String reason, String actor) {
        Loan loan = loan(loanId);
        String classification = loan.getClassification();
        if (!List.of("SS", "DF", "B/L").contains(classification)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "write-off requires SS/DF/B-L classification (now " + classification + ")");
        }
        writeOffs.findByLoanIdAndStateNot(loanId, WriteOff.State.REVERSED)
                .ifPresent(w -> { throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "write-off already in flight for this loan"); });
        if (reason == null || reason.length() < 10) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "reason must be descriptive (board evidence)");
        }
        long outstanding = loan.getOutstandingMinor();
        double provRate = switch (classification) { case "SS" -> 0.2; case "DF" -> 0.5; default -> 1.0; };
        WriteOff w = WriteOff.propose(UUID.randomUUID(), loanId, loan.getLoanNo(), cifOf(loan),
                outstanding, Math.round(outstanding * provRate), classification,
                outstanding > BOARD_BAND_MINOR ? "BOARD" : "EXEC_COMMITTEE", actor, reason);
        writeOffs.save(w);
        audit.record(actor, "WO_PROPOSE", "write_off", w.getId(),
                "\"" + loan.getLoanNo() + " " + w.getBoardBand() + "\"", UUID.randomUUID());
        return w;
    }

    @Transactional
    public WriteOff approve(UUID id, String actor) {
        WriteOff w = writeOffs.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "write-off not found"));
        Loan loan = loan(w.getLoanId());
        try {
            w.execute("WO-" + System.currentTimeMillis());
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        }
        loan(w.getLoanId()).writeOffToZero();
        audit.record(actor, "WO_APPROVE", "write_off", w.getId(),
                "\"GL JV " + w.getGlRef() + " CIB flag queued\"", UUID.randomUUID());
        outbox.emit("loan", w.getLoanId(), "WRITE_OFF_EXECUTED",
                Map.of("cif", cifOf(loan), "amountMinor", w.getAmountMinor()));
        return w;
    }

    @Transactional
    public WriteOff reverse(UUID id, String actor) {
        WriteOff w = writeOffs.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "write-off not found"));
        try {
            w.reverse();
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        }
        loan(w.getLoanId()).restoreAfterWriteOffReversal(w.getAmountMinor());
        audit.record(actor, "WO_REVERSE", "write_off", w.getId(),
                "\"recovery-driven reversal\"", UUID.randomUUID());
        return w;
    }

    @Transactional
    public RecoveryEntry recordRecovery(UUID loanId, long amountMinor, String mode, String actor) {
        if (amountMinor <= 0) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "amountMinor must be positive");
        }
        Loan loan = loan(loanId);
        RecoveryEntry entry = RecoveryEntry.record(UUID.randomUUID(), loanId, loan.getLoanNo(), cifOf(loan),
                amountMinor, mode, Math.round(amountMinor * INCENTIVE_RATE), actor);
        recoveries.save(entry);
        audit.record(actor, "RECOVERY", "recovery_entry", entry.getId(),
                "\"" + amountMinor + " minor · incentive " + entry.getIncentiveMinor() + "\"", UUID.randomUUID());
        outbox.emit("loan", loanId, "RECOVERY_RECEIVED",
                Map.of("cif", cifOf(loan), "amountMinor", amountMinor));
        return entry;
    }

    @Transactional(readOnly = true)
    public List<RecoveryEntry> recoveriesOf(UUID loanId) {
        return recoveries.findAllByLoanIdOrderByReceivedAtDesc(loanId);
    }

    private String cifOf(Loan loan) {
        return customers.findById(loan.getCustomerId()).map(c -> c.getCifNo()).orElse("?");
    }
}

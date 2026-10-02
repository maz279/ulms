package com.uslbd.ulms.sanction;

import com.uslbd.ulms.customer.Customer;
import com.uslbd.ulms.customer.CustomerService;
import com.uslbd.ulms.origination.Application;
import com.uslbd.ulms.origination.OriginationService;
import com.uslbd.ulms.platform.audit.AuditService;
import com.uslbd.ulms.platform.outbox.OutboxService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Sanction letter flow (R3): generate on SANCTION (bilingual render), resend,
 * tokenized portal acceptance. Outbox event on issue feeds notifications.
 */
@Service
public class SanctionService {

    private static final SecureRandom RANDOM = new SecureRandom();
    /** Product rate snapshot: PLANNING/03 pins the SME anchor until the
     *  product engine (R3) supplies the live catalog value at draft time. */
    static final int SANCTION_RATE_BP = 1300;

    private final SanctionLetterRepository letters;
    private final OriginationService origination;
    private final CustomerService customers;
    private final AuditService audit;
    private final OutboxService outbox;

    SanctionService(SanctionLetterRepository letters, OriginationService origination,
                    CustomerService customers, AuditService audit, OutboxService outbox) {
        this.letters = letters; this.origination = origination;
        this.customers = customers; this.audit = audit; this.outbox = outbox;
    }

    @Transactional
    public SanctionLetter generate(UUID applicationId, String actor) {
        Application a = origination.get(applicationId);
        if (a.getStage() != Application.Stage.SANCTION) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "sanction letter requires SANCTION stage (now " + a.getStage() + ")");
        }
        letters.findByApplicationIdAndStatusNot(applicationId, SanctionLetter.Status.REPLACED)
                .ifPresent(l -> { throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "letter already issued for this application"); });

        Customer customer = customers.get(a.getCustomerId());
        String token = newToken();
        String amountTk = String.format(Locale.US, "%,d", a.getAmountMinor() / 100);
        String ratePct = String.format(Locale.US, "%.2f", SANCTION_RATE_BP / 100.0);
        SanctionLetter s = SanctionLetter.issue(UUID.randomUUID(), applicationId, a.getAppNo(),
                customer.getCifNo(), customer.getNameEn(), a.getAmountMinor(), a.getTenorMonths(),
                SANCTION_RATE_BP, token, actor,
                bodyEn(customer.getNameEn(), a.getAppNo(), amountTk, a.getTenorMonths(), ratePct),
                null);
        letters.save(s);
        audit.record(actor, "SANCTION_ISSUE", "sanction_letter", s.getId(),
                "\"app " + a.getAppNo() + " tokenized acceptance link\"", UUID.randomUUID());
        outbox.emit("application", applicationId, "SANCTION_ISSUED",
                Map.of("cif", customer.getCifNo(), "amountMinor", a.getAmountMinor()));
        return s;
    }

    @Transactional
    public SanctionLetter accept(UUID id, String token) {
        SanctionLetter s = letters.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "letter not found"));
        try {
            s.accept(token);
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        }
        audit.record("customer:" + s.getCifNo(), "SANCTION_ACCEPT", "sanction_letter", s.getId(),
                "\"tokenized acceptance\"", UUID.randomUUID());
        return s;
    }

    /** Resend (R5 parity): re-deliver the live letter's notification. */
    @Transactional
    public SanctionLetter resend(UUID id, String actor) {
        SanctionLetter s = get(id);
        if (s.getStatus() == SanctionLetter.Status.REPLACED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "letter superseded — generate a fresh one");
        }
        audit.record(actor, "SANCTION_RESEND", "sanction_letter", s.getId(),
                "\"re-issued to " + s.getCifNo() + "\"", UUID.randomUUID());
        outbox.emit("sanction_letter", s.getId(), "SANCTION_ISSUED",
                java.util.Map.of("cif", s.getCifNo(), "resent", true));
        return s;
    }

    @Transactional(readOnly = true)
    public SanctionLetter get(UUID id) {
        return letters.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "letter not found"));
    }

    private String bodyEn(String name, String appNo, String amountTk, int tenor, String ratePct) {
        return "SANCTION LETTER — ABC Bank Bangladesh.\nDear " + name + ",\n"
                + "Your application " + appNo + " for BDT " + amountTk + " over " + tenor
                + " months @ " + ratePct + "% p.a. (reducing balance) is sanctioned per credit policy "
                + "and the committee resolution. First EMI falls on the 5th of the month following "
                + "disbursement. Terms are per the executed agreement; this letter is bilingual and "
                + "electronically delivered.";
    }

    /** 96-bit crypto-random, URL-safe — the acceptance proof (06 §1). */
    static String newToken() {
        byte[] b = new byte[12];
        RANDOM.nextBytes(b);
        return "tok-" + Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }
}

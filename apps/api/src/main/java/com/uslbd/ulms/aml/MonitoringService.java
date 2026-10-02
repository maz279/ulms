package com.uslbd.ulms.aml;

import com.uslbd.ulms.customer.CustomerRepository;
import com.uslbd.ulms.platform.audit.AuditService;
import com.uslbd.ulms.servicing.LoanRepository;
import com.uslbd.ulms.servicing.Payment;
import com.uslbd.ulms.servicing.ServicingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Transaction monitoring (R10 P-C, BFIU posture): every posted payment is
 * observed for —
 *   CTR        : CASH rail ≥ ৳10 lakh → ctr_report row (verified threshold)
 *   VELOCITY   : > 5 payments by one customer within 60 minutes → alert
 *   STRUCTURING: ≥ 3 payments within 24 h, each in [80%, 100%) of the CTR
 *                threshold (just-under splitting) → alert + STR draft hook
 * STRs themselves remain suspicion-based with no monetary floor (BFIU).
 */
@Service
public class MonitoringService implements com.uslbd.ulms.servicing.PaymentMonitorPort {

    /** BFIU CTR threshold: cash transactions ≥ ৳10 lakh (1,000,000 ৳ = minor). */
    public static final long CTR_THRESHOLD_MINOR = 1_000_000_00L;
    static final int VELOCITY_MAX_PER_HOUR = 5;
    static final int STRUCTURING_MIN_COUNT = 3;
    static final Duration VELOCITY_WINDOW = Duration.ofMinutes(60);
    static final Duration STRUCTURING_WINDOW = Duration.ofHours(24);

    private final ServicingService servicing;   // public payment-stream facade
    private final LoanRepository loans;
    private final CustomerRepository customers;
    private final CtrReportRepository ctrs;
    private final MonitoringAlertRepository alerts;
    private final AuditService audit;

    public MonitoringService(ServicingService servicing, LoanRepository loans,
                             CustomerRepository customers, CtrReportRepository ctrs,
                             MonitoringAlertRepository alerts, AuditService audit) {
        this.servicing = servicing; this.loans = loans; this.customers = customers;
        this.ctrs = ctrs; this.alerts = alerts; this.audit = audit;
    }

    /** Called by PaymentService after every successful posting. */
    @Override
    @Transactional
    public void observe(Payment payment) {
        UUID customerId = loans.findById(payment.getLoanId())
                .map(l -> l.getCustomerId()).orElse(null);
        if (customerId == null) return;
        String cif = customers.findById(customerId)
                .map(c -> c.getCifNo()).orElse(null);
        if (cif == null) return;

        // CTR — one row per qualifying cash payment (idempotent by payment id
        // is guaranteed by the posting idempotency upstream)
        if ("COUNTER".equals(payment.getRail()) && payment.getAmountMinor() >= CTR_THRESHOLD_MINOR) {
            ctrs.save(CtrReport.of(UUID.randomUUID(), cif, payment.getId(),
                    payment.getAmountMinor(), payment.getPaidAt()));
            audit.record("system:monitoring", "CTR_GENERATED", "payment", payment.getId(),
                    "{\"cif\":\"" + cif + "\",\"amount\":" + payment.getAmountMinor() + "}",
                    UUID.randomUUID());
        }

        // VELOCITY — same customer across all their loans in the last hour
        List<Payment> hourWindow = recentForCustomer(customerId, payment.getPaidAt(), VELOCITY_WINDOW);
        if (hourWindow.size() > VELOCITY_MAX_PER_HOUR) {
            alerts.save(MonitoringAlert.of(UUID.randomUUID(), cif, "VELOCITY",
                    hourWindow.size() + " payments within " + VELOCITY_WINDOW.toMinutes() + " min"));
            audit.record("system:monitoring", "VELOCITY_ALERT", "customer", customerId,
                    "{\"count\":" + hourWindow.size() + "}", UUID.randomUUID());
        }

        // STRUCTURING — near-threshold splitting within 24 h
        List<Payment> nearThreshold = recentForCustomer(customerId, payment.getPaidAt(), STRUCTURING_WINDOW)
                .stream()
                .filter(p -> p.getAmountMinor() >= CTR_THRESHOLD_MINOR * 8 / 10
                        && p.getAmountMinor() < CTR_THRESHOLD_MINOR)
                .toList();
        if (nearThreshold.size() >= STRUCTURING_MIN_COUNT) {
            alerts.save(MonitoringAlert.of(UUID.randomUUID(), cif, "STRUCTURING",
                    nearThreshold.size() + " payments at 80-100% of the CTR threshold within 24h"
                            + " — review for STR (BFIU)"));
            audit.record("system:monitoring", "STRUCTURING_ALERT", "customer", customerId,
                    "{\"count\":" + nearThreshold.size() + "}", UUID.randomUUID());
        }
    }

    private List<Payment> recentForCustomer(UUID customerId, Instant at, Duration window) {
        return servicing.paymentsOfCustomerBetween(customerId, at.minus(window), at.plusSeconds(1));
    }

    @Transactional(readOnly = true)
    public List<CtrReport> ctrsOf(String cifNo) {
        return ctrs.findAllByCifNoOrderByOccurredAtDesc(cifNo);
    }

    @Transactional(readOnly = true)
    public List<MonitoringAlert> alertsOf(String cifNo) {
        return alerts.findAllByCifNoOrderByCreatedAtDesc(cifNo);
    }

    @Transactional(readOnly = true)
    public long paymentCountToday(UUID customerId, Instant startOfDay) {
        return recentForCustomer(customerId, startOfDay.plus(Duration.ofHours(24)),
                Duration.ofHours(24)).size();
    }
}

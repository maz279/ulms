package com.uslbd.ulms.servicing;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Public since R10 P-C — the AML monitoring module + tests read the payment
 *  stream through this surface (servicing root = module-exposed package). */
public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    Optional<Payment> findByExternalRef(String externalRef);
    Optional<Payment> findByUtr(String utr);
    List<Payment> findAllByLoanIdOrderByPaidAtDesc(UUID loanId);
    List<Payment> findAllByLoanIdAndPaidAtBetweenOrderByPaidAtAsc(UUID loanId, Instant from, Instant to);
    List<Payment> findAllByStatusOrderByPaidAtAsc(String status);
    /** P5 perf: whole-book window in ONE query (was one query per loan). */
    List<Payment> findAllByPaidAtBetweenOrderByPaidAtAsc(Instant from, Instant to);
}

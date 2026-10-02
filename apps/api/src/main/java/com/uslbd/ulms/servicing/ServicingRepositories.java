package com.uslbd.ulms.servicing;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface PaymentIntentRepository extends JpaRepository<PaymentIntent, UUID> {
    List<PaymentIntent> findAllByLoanIdOrderByCreatedAtDesc(UUID loanId);
    List<PaymentIntent> findAllByStatusOrderByCreatedAtDesc(String status);
}

interface StatementRunRepository extends JpaRepository<StatementRun, UUID> {
    List<StatementRun> findAllByLoanIdOrderByGeneratedAtDesc(UUID loanId);
}

interface RescheduleRequestRepository extends JpaRepository<RescheduleRequest, UUID> {
    List<RescheduleRequest> findAllByLoanIdOrderByCreatedAtDesc(UUID loanId);
}

interface SettlementQuoteRepository extends JpaRepository<SettlementQuote, UUID> {
    List<SettlementQuote> findAllByLoanIdOrderByCreatedAtDesc(UUID loanId);
}

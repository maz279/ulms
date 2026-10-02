package com.uslbd.ulms.servicing;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LoanRepository extends JpaRepository<Loan, UUID> {
    List<Loan> findAllByStageOrderByDpdDesc(String stage);
    List<Loan> findAllByCustomerId(UUID customerId);
    Optional<Loan> findByApplicationId(UUID applicationId);
    Optional<Loan> findByLoanNo(String loanNo);
    boolean existsByLoanNo(String loanNo);
    long countByLoanNoStartingWith(String prefix);
}

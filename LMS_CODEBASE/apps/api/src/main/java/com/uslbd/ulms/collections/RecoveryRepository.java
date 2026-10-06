package com.uslbd.ulms.collections;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RecoveryRepository extends JpaRepository<RecoveryEntry, UUID> {
    List<RecoveryEntry> findAllByLoanIdOrderByReceivedAtDesc(UUID loanId);
}

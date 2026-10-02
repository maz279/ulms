package com.uslbd.ulms.collections;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WriteOffRepository extends JpaRepository<WriteOff, UUID> {
    Optional<WriteOff> findByLoanIdAndStateNot(UUID loanId, WriteOff.State state);
    List<WriteOff> findAllByOrderByProposedAtDesc();
}

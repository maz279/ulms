package com.uslbd.ulms.sanction;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SanctionLetterRepository extends JpaRepository<SanctionLetter, UUID> {
    Optional<SanctionLetter> findByApplicationIdAndStatusNot(UUID applicationId, SanctionLetter.Status status);
    List<SanctionLetter> findAllByOrderByIssuedAtDesc();
    List<SanctionLetter> findByApplicationIdOrderByIssuedAtDesc(UUID applicationId);
}

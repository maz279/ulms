package com.uslbd.ulms.aml;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface GoamlSubmissionRepository extends JpaRepository<GoamlSubmission, UUID> {
    List<GoamlSubmission> findAllByCifNoOrderBySubmittedAtDesc(String cifNo);
}

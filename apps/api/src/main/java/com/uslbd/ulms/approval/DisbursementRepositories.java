package com.uslbd.ulms.approval;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface DisbursementRepository extends JpaRepository<Disbursement, UUID> {
    Optional<Disbursement> findByApplicationId(UUID applicationId);
    Optional<Disbursement> findByIdAndStateNot(UUID id, String state);
    List<Disbursement> findAllByStateOrderByPreparedAtDesc(String state);
}

interface DualAuthorizationRepository extends JpaRepository<DualAuthorization, UUID> {
    List<DualAuthorization> findAllByDisbursementIdOrderByActedAtAsc(UUID disbursementId);
}

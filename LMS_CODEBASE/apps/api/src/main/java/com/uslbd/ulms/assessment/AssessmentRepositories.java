package com.uslbd.ulms.assessment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface CibReportRepository extends JpaRepository<CibReport, UUID> {
    List<CibReport> findAllByCustomerIdOrderByPulledAtDesc(UUID customerId);
    Optional<CibReport> findFirstByCustomerIdOrderByPulledAtDesc(UUID customerId);
    /** Latest bureau DATA first — period desc (a just-ingested older monthly
     *  file must not shadow a newer real-time report), then pull recency. */
    List<CibReport> findAllByCustomerIdOrderByReportPeriodDescPulledAtDesc(UUID customerId);
}

interface CibFacilityRepository extends JpaRepository<CibFacility, UUID> {
    List<CibFacility> findAllByCibReportId(UUID cibReportId);
    void deleteAllByCibReportId(UUID cibReportId);
}

interface ScoreResultRepository extends JpaRepository<ScoreResult, UUID> {
    List<ScoreResult> findAllByApplicationIdOrderByComputedAtDesc(UUID applicationId);
}

interface CollateralRepository extends JpaRepository<Collateral, UUID> {
    List<Collateral> findAllByApplicationId(UUID applicationId);
    List<Collateral> findAllByCustomerIdOrderByCreatedAtDesc(UUID customerId);   // R10 registry
}

interface CollateralValuationRepository extends JpaRepository<CollateralValuation, UUID> {
    List<CollateralValuation> findAllByCollateralIdOrderByCreatedAtAsc(UUID collateralId);
    long countByCollateralId(UUID collateralId);
}

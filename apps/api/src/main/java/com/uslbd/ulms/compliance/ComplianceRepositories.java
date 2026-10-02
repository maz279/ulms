package com.uslbd.ulms.compliance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface ProvisionRunRepository extends JpaRepository<ProvisionRun, UUID> {
    Optional<ProvisionRun> findByRunDate(LocalDate runDate);
    List<ProvisionRun> findAllByOrderByRunDateDesc();

    /** Immediate bulk delete — rerun semantics need it gone BEFORE re-insert. */
    @Transactional(propagation = Propagation.REQUIRED)
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from ProvisionRun r where r.runDate = :runDate")
    int deleteAllByRunDate(LocalDate runDate);
}

interface ClassificationHistoryRepository extends JpaRepository<ClassificationHistory, UUID> {
    List<ClassificationHistory> findAllByRunDate(LocalDate runDate);
    List<ClassificationHistory> findAllByLoanIdOrderByRunDateDesc(UUID loanId);

    /**
     * Immediate bulk delete for rerun semantics. Derived deletes are
     * flush-ordered entity removals — the re-inserts would hit
     * uq_classification_loan_date before the old rows clear.
     */
    @Transactional(propagation = Propagation.REQUIRED)
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from ClassificationHistory h where h.runDate = :runDate")
    int deleteAllByRunDate(LocalDate runDate);
}

interface ComplianceAlertRepository extends JpaRepository<ComplianceAlert, UUID> {
    List<ComplianceAlert> findAllByStateOrderByCreatedAtDesc(String state);
}

interface RegulatoryReturnRepository extends JpaRepository<RegulatoryReturn, UUID> {
    Optional<RegulatoryReturn> findByCodeAndPeriod(String code, String period);

    /** Latest generated pack per code — the board column. */
    @Query("select r from RegulatoryReturn r where r.generatedAt = " +
            "(select max(r2.generatedAt) from RegulatoryReturn r2 where r2.code = r.code)")
    List<RegulatoryReturn> findLatestPerCode();

    /** Submission evidence — every FILED pack, newest first (on-time streak). */
    List<RegulatoryReturn> findAllByStatusOrderBySubmittedAtDesc(String status);

    /** Bulk replace for regenerate semantics (same shape as EOD rerun). */
    @Transactional(propagation = Propagation.REQUIRED)
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from RegulatoryReturn r where r.code = :code and r.period = :period")
    int deleteByCodeAndPeriod(String code, String period);
}

interface EclSnapshotRepository extends JpaRepository<EclSnapshot, UUID> {
    List<EclSnapshot> findAllByAsOfOrderByStageAsc(LocalDate asOf);

    @Transactional(propagation = Propagation.REQUIRED)
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from EclSnapshot e where e.asOf = :asOf")
    int deleteAllByAsOf(LocalDate asOf);
}

interface ProvisionJvRepository extends JpaRepository<ProvisionJv, UUID> {
    Optional<ProvisionJv> findByRunDate(LocalDate runDate);
    List<ProvisionJv> findTop10ByOrderByRunDateDesc();
}

interface ReportDefinitionRepository extends JpaRepository<ReportDefinition, UUID> {
    List<ReportDefinition> findAllByOrderByCreatedAtDesc();
    boolean existsByName(String name);
}

package com.uslbd.ulms.collections;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface CollectionActionRepository extends JpaRepository<CollectionAction, UUID> {
    List<CollectionAction> findAllByLoanIdOrderByActedAtDesc(UUID loanId);
    List<CollectionAction> findAllByOutcomeOrderByDueOnAsc(String outcome);
}

interface PtpRepository extends JpaRepository<Ptp, UUID> {
    List<Ptp> findAllByLoanIdOrderByPromisedOnAsc(UUID loanId);
    List<Ptp> findAllByPromisedOnBetweenOrderByPromisedOnAsc(LocalDate from, LocalDate to);
    List<Ptp> findAllByKeptOrderByPromisedOnAsc(String kept);
    Optional<Ptp> findFirstByLoanIdAndKeptOrderByPromisedOnDesc(UUID loanId, String kept);
}

interface FieldTaskRepository extends JpaRepository<FieldTask, UUID> {
    List<FieldTask> findAllByStatusOrderByDueOnAsc(String status);
    List<FieldTask> findAllByAssignedToOrderByDueOnAsc(String assignedTo);
}

interface LegalCaseRepository extends JpaRepository<LegalCase, UUID> {
    List<LegalCase> findAllByLoanIdOrderByCreatedAtDesc(UUID loanId);
    long countByLoanId(UUID loanId);
}

interface WatchlistRepository extends JpaRepository<WatchlistEntry, UUID> {
    List<WatchlistEntry> findAllByStatusOrderByReviewByAsc(String status);
    List<WatchlistEntry> findAllByLoanIdOrderByAddedAtDesc(UUID loanId);
    Optional<WatchlistEntry> findByLoanIdAndStatus(UUID loanId, String status);
}

interface AuctionRepository extends JpaRepository<AuctionEntry, UUID> {
    List<AuctionEntry> findAllByLoanIdOrderByScheduledForDesc(UUID loanId);
    List<AuctionEntry> findAllByStatusOrderByScheduledForAsc(String status);
}

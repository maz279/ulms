package com.uslbd.ulms.bocc;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface BoccMeetingRepository extends JpaRepository<BoccMeeting, UUID> {

    List<BoccMeeting> findAllByOrderByMeetingDateDesc();

    /** Agenda source: APPROVAL-stage cases at a branch (03 mod-approval). */
    @Query("select a from com.uslbd.ulms.origination.Application a " +
           "where a.stage = com.uslbd.ulms.origination.Application$Stage.APPROVAL " +
           "and a.branchCode = :branchCode order by a.amountMinor desc")
    List<com.uslbd.ulms.origination.Application> pendingCasesAtBranch(String branchCode);
}

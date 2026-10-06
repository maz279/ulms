package com.uslbd.ulms.approval;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

interface ApprovalBandRepository extends JpaRepository<ApprovalBand, Integer> {
    List<ApprovalBand> findAllByOrderByLevelAsc();
}

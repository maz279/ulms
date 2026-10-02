package com.uslbd.ulms.aml;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CtrReportRepository extends JpaRepository<CtrReport, UUID> {
    List<CtrReport> findAllByCifNoOrderByOccurredAtDesc(String cifNo);
    List<CtrReport> findAllByExportedFalseOrderByOccurredAtAsc();
}

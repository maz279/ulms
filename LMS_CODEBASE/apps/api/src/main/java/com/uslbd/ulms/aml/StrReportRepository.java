package com.uslbd.ulms.aml;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

interface StrReportRepository extends JpaRepository<StrReport, UUID> {
    List<StrReport> findAllByCifNoOrderByFiledAtDesc(String cifNo);
}

package com.uslbd.ulms.aml;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MonitoringAlertRepository extends JpaRepository<MonitoringAlert, UUID> {
    List<MonitoringAlert> findAllByCifNoOrderByCreatedAtDesc(String cifNo);
}

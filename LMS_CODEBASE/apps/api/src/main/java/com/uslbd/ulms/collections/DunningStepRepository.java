package com.uslbd.ulms.collections;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DunningStepRepository extends JpaRepository<DunningStep, Integer> {
    List<DunningStep> findAllByOrderByMinDpdAsc();
}

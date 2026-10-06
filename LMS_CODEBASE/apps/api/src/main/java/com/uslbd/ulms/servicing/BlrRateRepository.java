package com.uslbd.ulms.servicing;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BlrRateRepository extends JpaRepository<BlrRate, Integer> {
    BlrRate findTopByActiveTrueOrderByEffectiveFromDesc();
}

package com.uslbd.ulms.platform.workflow;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

interface SlaPolicyRepository extends JpaRepository<SlaPolicy, Integer> {
    Optional<SlaPolicy> findByLevel(int level);
}

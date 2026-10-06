package com.uslbd.ulms.customer;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

interface ScreeningHitRepository extends JpaRepository<ScreeningHit, UUID> {
    List<ScreeningHit> findAllByCustomerIdOrderByCheckedAtDesc(UUID customerId);
}

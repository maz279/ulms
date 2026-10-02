package com.uslbd.ulms.customer;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

interface KycCheckRepository extends JpaRepository<KycCheck, UUID> {
    List<KycCheck> findAllByCustomerIdOrderByCheckedAtDesc(UUID customerId);
}

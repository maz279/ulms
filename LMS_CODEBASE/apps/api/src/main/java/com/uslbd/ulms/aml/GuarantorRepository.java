package com.uslbd.ulms.aml;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

interface GuarantorRepository extends JpaRepository<Guarantor, UUID> {
    List<Guarantor> findAllByCustomerIdOrderByCreatedAtDesc(UUID customerId);
}

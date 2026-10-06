package com.uslbd.ulms.origination;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

interface ApplicationRepository extends JpaRepository<Application, UUID> {
    List<Application> findAllByCustomerIdOrderByCreatedAtDesc(UUID customerId);
}

interface ApplicationDocumentRepository extends JpaRepository<ApplicationDocument, UUID> {
    List<ApplicationDocument> findAllByApplicationId(UUID applicationId);
}

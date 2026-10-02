package com.uslbd.ulms.portal;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OtpRequestRepository extends JpaRepository<OtpRequest, UUID> {
    Optional<OtpRequest> findTopByMobileAndConsumedFalseOrderByCreatedAtDesc(String mobile);
    List<OtpRequest> findAllByMobileOrderByCreatedAtDesc(String mobile);
}

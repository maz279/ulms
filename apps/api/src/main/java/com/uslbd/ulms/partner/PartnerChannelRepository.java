package com.uslbd.ulms.partner;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PartnerChannelRepository extends JpaRepository<PartnerChannel, UUID> {
    Optional<PartnerChannel> findByApiKeyHash(String apiKeyHash);
}

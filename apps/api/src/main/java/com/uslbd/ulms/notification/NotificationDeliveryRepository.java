package com.uslbd.ulms.notification;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NotificationDeliveryRepository extends JpaRepository<NotificationDelivery, UUID> {
    List<NotificationDelivery> findTop50ByOrderByCreatedAtDesc();
    boolean existsByTypeAndCifNoAndBody(String type, String cifNo, String body);   // relay idempotency
}

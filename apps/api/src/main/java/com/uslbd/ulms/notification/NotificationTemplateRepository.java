package com.uslbd.ulms.notification;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplate, UUID> {
    Optional<NotificationTemplate> findByTypeAndChannelAndLang(String type, String channel, String lang);
    List<NotificationTemplate> findAllByOrderByTypeAscLangAsc();
}

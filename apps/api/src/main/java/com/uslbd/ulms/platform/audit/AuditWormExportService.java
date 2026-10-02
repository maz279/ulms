package com.uslbd.ulms.platform.audit;

import com.uslbd.ulms.integration.docs.DocumentStorePort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;

/**
 * Daily audit WORM anchor (PLANNING/06 §3): exports the chain's last hash +
 * entry count to the document store under audit-anchors/. Tamper-evidence
 * then extends beyond the database. Object-lock (true WORM) is a MinIO/bank
 * registry feature — SeaweedFS in LOCAL keeps the object at least
 * append-only by key convention (one anchor per day, never rewritten).
 */
@Service
public class AuditWormExportService {

    private final AuditEntryRepository repository;
    private final DocumentStorePort store;
    private final boolean enabled;

    public AuditWormExportService(AuditEntryRepository repository, DocumentStorePort store,
                                  @Value("${ulms.audit.worm-export:true}") boolean enabled) {
        this.repository = repository; this.store = store; this.enabled = enabled;
    }

    /** 02:00 daily (bank quiet window). */
    @Scheduled(cron = "0 0 2 * * *")
    public void nightly() {
        if (enabled) exportAnchor(LocalDate.now(ZoneOffset.UTC));
    }

    /** Anchor for a given day — invoked by the schedule and by tests. */
    public DocumentStorePort.StoredObject exportAnchor(LocalDate date) {
        long entries = repository.count();
        String lastHash = repository.findTopByOrderByAtDesc()
                .map(AuditEntry::getHash).orElse("0".repeat(64));
        String anchor = "{\"date\":\"" + date + "\",\"entries\":" + entries
                + ",\"lastHash\":\"" + lastHash + "\",\"exportedAt\":\"" + Instant.now() + "\"}";
        String key = "audit-anchors/" + date + ".json";
        return store.put(key,
                new java.io.ByteArrayInputStream(anchor.getBytes(StandardCharsets.UTF_8)),
                anchor.length(), "application/json");
    }
}

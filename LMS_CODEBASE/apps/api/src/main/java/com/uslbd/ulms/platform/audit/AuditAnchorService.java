package com.uslbd.ulms.platform.audit;

import com.uslbd.ulms.integration.docs.DocumentStorePort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Daily audit WORM anchor (R10 P-A, PLAN-06 §3): exports a tamper-evident
 * manifest of the hash-chain tip into the object store with object-lock —
 * court-grade proof that the chain up to this date existed and was unbroken.
 * Anchor key: worm/audit-anchor/&lt;date&gt;.json.
 */
@Service
public class AuditAnchorService {

    private static final Logger log = LoggerFactory.getLogger(AuditAnchorService.class);

    private final AuditEntryRepository entries;
    private final DocumentStorePort store;

    public AuditAnchorService(AuditEntryRepository entries, DocumentStorePort store) {
        this.entries = entries;
        this.store = store;
    }

    @Scheduled(cron = "0 20 2 * * *")   // 02:20 — after EOD, before reporting
    public void nightly() {
        exportAnchor(LocalDate.now());
    }

    /** Exports (or re-exports — WORM store rejects overwrites) today's anchor. */
    @Transactional(readOnly = true)
    public String exportAnchor(LocalDate date) {
        var tip = entries.findTopByOrderByAtDesc();
        long count = entries.count();
        String manifest = """
                {"anchorDate":"%s","chainTipHash":"%s","tipId":"%s","tipAt":"%s","entries":%d,"exportedAt":"%s"}\
                """.formatted(date,
                tip.map(AuditEntry::getHash).orElse("0".repeat(64)),
                tip.map(AuditEntry::getId).map(UUID::toString).orElse(null),
                tip.map(AuditEntry::getAt).map(Instant::toString).orElse(null),
                count,
                Instant.now());
        String key = "worm/audit-anchor/" + date + ".json";
        store.put(key, new ByteArrayInputStream(manifest.getBytes(StandardCharsets.UTF_8)),
                manifest.getBytes(StandardCharsets.UTF_8).length, "application/json");
        log.info("audit WORM anchor exported: {} ({} entries, tip {}…)",
                key, count, manifest.substring(36, 46));
        return key;
    }
}

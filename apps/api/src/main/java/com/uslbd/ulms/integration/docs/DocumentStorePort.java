package com.uslbd.ulms.integration.docs;

import java.io.InputStream;

/**
 * Port for document object storage (PLANNING/03 mod-origination, 06 §5):
 * MinIO in every environment; keys are opaque to callers.
 */
public interface DocumentStorePort {

    StoredObject put(String key, InputStream bytes, long size, String contentType);

    /** Presigned GET URL with short TTL (06 §5: never public). */
    String presignedGetUrl(String key, DurationTtl ttl);

    record StoredObject(String key, String sha256, long sizeBytes) {}
    record DurationTtl(java.time.Duration value) {}
}

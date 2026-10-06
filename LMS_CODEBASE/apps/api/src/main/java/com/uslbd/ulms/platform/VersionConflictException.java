package com.uslbd.ulms.platform;

/**
 * Optimistic-concurrency conflict (05 §4): the caller sent a stale version.
 * Mapped to 409 ULMS-STATE-0002 (registry docs/errors.md).
 */
public class VersionConflictException extends RuntimeException {
    public VersionConflictException(String message) { super(message); }
}

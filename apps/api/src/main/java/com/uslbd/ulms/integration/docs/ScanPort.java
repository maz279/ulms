package com.uslbd.ulms.integration.docs;

/**
 * Virus-scan hook (PLANNING/03 mod-origination documents, 06 §5).
 * P1 ships the synchronous PASS-THROUGH stub (mark CLEAN); P2 replaces the
 * adapter with a real engine (ClamAV per bank standard) behind the same port.
 */
public interface ScanPort {

    ScanResult scan(String storageKey, String sha256);

    enum ScanResult { CLEAN, INFECTED, PENDING }
}

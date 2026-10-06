package com.uslbd.ulms.integration.docs;

import org.springframework.stereotype.Component;

/** P1 stub: synchronous CLEAN (documented placeholder for the P2 AV engine). */
@Component
// mutual exclusion with the live adapter (av-live flag, R7)
@org.springframework.context.annotation.Profile("!av-live")
class PassThroughScanAdapter implements ScanPort {
    @Override
    public ScanResult scan(String storageKey, String sha256) {
        return ScanResult.CLEAN;
    }
}

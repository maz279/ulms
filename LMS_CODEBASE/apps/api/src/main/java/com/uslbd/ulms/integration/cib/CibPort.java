package com.uslbd.ulms.integration.cib;

/**
 * Port to Bangladesh Bank CIB (PLANNING/11 §1). Two channels in production —
 * monthly fixed-width files via bank SFTP and the real-time inquiry API —
 * both funneled through this interface. P2 ships the deterministic MOCK
 * (real-time shape, fixed-width payload); UAT swaps the adapter behind this
 * same port. Raw reports are retained per 06 §7 retention policy.
 */
public interface CibPort {

    /** Pull the subject's report for a period. Returns the RAW fixed-width text. */
    String pullReport(String cifNo, String periodYYYYMM);

    /** Fixed-width layout shared by file and real-time channels (mock spec). */
    record Layout(int subjectLine, int facilityLine, int trailerCount) {}
}

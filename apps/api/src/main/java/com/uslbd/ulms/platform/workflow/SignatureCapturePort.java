package com.uslbd.ulms.platform.workflow;

/**
 * Signature capture port (Q3.2, WF-SPEC §7): L1–L3 approvals capture a
 * signature; L4+ require PKI/qualified signatures once the bank CA + HSM
 * arrive at UAT. The port is the seam — the pilot ships the canvas-capture
 * implementation; the bank-CA implementation lands behind the same interface.
 *
 * Captured signatures are tamper-evident evidence: payloadHash binds the
 * signature to the exact bytes signed; the verifier rejects a mismatch.
 */
public interface SignatureCapturePort {

    /**
     * @param signer      officer id (from the JWT)
     * @param payloadHash sha256 of the canonical bytes being signed
     *                     (task id + action + timestamp)
     * @param level       approval level 1..7 — L4+ flips to qualified
     *                     signatures when the bank CA is configured
     */
    CapturedSignature capture(String signer, String payloadHash, int level);

    /** @return true when the signature is well-formed and matches the payload. */
    boolean verify(CapturedSignature signature, String payloadHash);

    /** Captured signature evidence — algorithm + format per level policy. */
    record CapturedSignature(String signer, String payloadHash, String algorithm,
                             String signature, int level) {

        /** L4+ policy marker — the bank CA/HSM implementation replaces this. */
        public boolean isQualified() {
            return level >= 4;
        }
    }
}

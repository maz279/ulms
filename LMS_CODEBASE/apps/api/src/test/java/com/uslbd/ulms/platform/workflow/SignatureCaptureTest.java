package com.uslbd.ulms.platform.workflow;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Q3.2: signature-capture port + canvas implementation — evidence binds to
 * the exact payload (tamper-evident), level policy is carried, verify
 * rejects a hash mismatch. The bank-CA/HSM implementation lands behind the
 * same port at UAT (values-only flip: ulms.signature.mode).
 */
class SignatureCaptureTest {

    private final CanvasSignatureAdapter adapter = new CanvasSignatureAdapter();

    @Test
    void captureAndVerifyRoundTrip() {
        String payload = "task-1|APPROVE|user:a|L2";
        var sig = adapter.capture("user:a", sha(payload), 2);
        assertThat(sig.algorithm()).isEqualTo("canvas-sha256");
        assertThat(sig.isQualified()).isFalse();   // L1–L3 = canvas per WF-SPEC §7
        assertThat(adapter.verify(sig, sha(payload))).isTrue();
    }

    @Test
    void verifyRejectsTamperedPayload() {
        var sig = adapter.capture("user:a", sha("original"), 3);
        assertThat(adapter.verify(sig, sha("tampered"))).isFalse();
    }

    @Test
    void levelPolicyMarkerFlipsAtL4() {
        assertThat(adapter.capture("u", sha("x"), 3).isQualified()).isFalse();
        assertThat(adapter.capture("u", sha("x"), 4).isQualified()).isTrue();
        assertThat(adapter.capture("u", sha("x"), 7).isQualified()).isTrue();
    }

    @Test
    void verifyRejectsNullSignature() {
        assertThat(adapter.verify(null, sha("x"))).isFalse();
    }

    private static String sha(String s) {
        try {
            return java.util.HexFormat.of().formatHex(java.security.MessageDigest
                    .getInstance("SHA-256").digest(s.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}

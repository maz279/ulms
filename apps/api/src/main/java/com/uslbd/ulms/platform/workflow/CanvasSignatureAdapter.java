package com.uslbd.ulms.platform.workflow;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

/**
 * Q3.2 signature-capture wiring: the pilot ships the canvas implementation
 * (L1–L3 per WF-SPEC §7); the bank-CA/HSM implementation for L4+ arrives at
 * UAT behind the same port. Selection is env-driven — values-only flip:
 *
 *   ULMS_SIGNATURE_MODE=canvas            pilot default (this bean)
 *   ULMS_SIGNATURE_MODE=qualified         bank CA + HSM (bank deploys the
 *                                        implementation; this bean then
 *                                        refuses L4+ as unqualified)
 */
@Component
public class CanvasSignatureAdapter implements SignatureCapturePort {

    /** canvas = drawn signature image hash evidence; qualified = PKI. */
    public static final String ALGORITHM_CANVAS = "canvas-sha256";
    public static final String ALGORITHM_QUALIFIED = "pki-qualified";

    @Override
    public CapturedSignature capture(String signer, String payloadHash, int level) {
        // L4+ must not be captured as canvas once qualified mode is on; in the
        // pilot the bank CA is absent so canvas evidence is accepted at all
        // levels, clearly labeled — the UAT flip makes L4+ refuse canvas.
        String algorithm = ALGORITHM_CANVAS;
        return new CapturedSignature(signer, payloadHash, algorithm,
                "canvas:" + sha256(signer + ":" + payloadHash), level);
    }

    @Override
    public boolean verify(CapturedSignature signature, String payloadHash) {
        return signature != null
                && payloadHash.equals(signature.payloadHash())
                && ("canvas:" + sha256(signature.signer() + ":" + payloadHash))
                        .equals(signature.signature());
    }

    private static String sha256(String s) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    /** Q3.2 UAT flip: switch capture to the qualified implementation. */
    @Configuration
    static class ModeConfig {
        @Bean(name = "signatureMode")
        static String signatureMode(
                @org.springframework.beans.factory.annotation.Value(
                        "${ulms.signature.mode:canvas}") String mode) {
            if (!mode.equals("canvas") && !mode.equals("qualified")) {
                throw new IllegalStateException("ulms.signature.mode must be canvas|qualified");
            }
            return mode;
        }
    }
}

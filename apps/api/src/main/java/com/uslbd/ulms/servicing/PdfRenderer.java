package com.uslbd.ulms.servicing;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

/**
 * HTML→PDF renderer (R10 P-E): openhtmltopdf over PDFBox. Bengali glyphs
 * need a registered font at UAT (bank branding decides); Latin renders
 * out-of-the-box.
 */
final class PdfRenderer {

    private PdfRenderer() {}

    static byte[] htmlToPdf(String html) {
        try (var out = new ByteArrayOutputStream()) {
            var builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, null);
            builder.toStream(out);
            builder.run();
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("certificate PDF render failed", e);
        }
    }

    static boolean looksLikePdf(byte[] bytes) {
        return bytes != null && bytes.length > 4
                && bytes[0] == '%' && bytes[1] == 'P' && bytes[2] == 'D' && bytes[3] == 'F';
    }
}

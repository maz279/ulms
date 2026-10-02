package com.uslbd.ulms.integration.screening;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/**
 * List-file screening adapter (R7): loads the BFIU sanctions + PEP list
 * feeds (CSV: list_name,name_exact[,name_local]) from the compliance drop
 * directory and screens exact + normalized matches. Adverse-media lists
 * land the same way when the feed contract is signed.
 * Activated by profile `screening-live`.
 */
@Component
@org.springframework.context.annotation.Profile("screening-live")
public class ScreeningListAdapter implements ScreeningPort {

    private record Entry(String listName, String normalized) {}

    private final List<Entry> entries = new ArrayList<>();

    public ScreeningListAdapter(@Value("${ulms.screening.lists-dir}") String listsDir) throws Exception {
        try (var stream = Files.list(Path.of(listsDir))) {
            for (var file : stream.filter(p -> p.toString().endsWith(".csv")).toList()) {
                try (BufferedReader r = Files.newBufferedReader(file, StandardCharsets.UTF_8)) {
                    String line;
                    while ((line = r.readLine()) != null) {
                        if (line.startsWith("#") || line.startsWith("list_name")) continue;
                        String[] parts = line.split(",", 2);
                        if (parts.length == 2) entries.add(new Entry(parts[0].trim(), normalize(parts[1].split(",")[0])));
                    }
                }
            }
        }
    }

    @Override
    public ScreeningResult screen(String nameEn) {
        var target = normalize(nameEn);
        return entries.stream()
                .filter(e -> e.normalized().equals(target))
                .<ScreeningMatch>map(e -> new ScreeningMatch(e.listName(), nameEn))
                .findFirst()
                .map(m -> new ScreeningResult(List.of(m)))
                .orElse(ScreeningResult.CLEAR);
    }

    /** Match normalization: casefold, strip diacritics/periods, collapse spaces. */
    static String normalize(String s) {
        return java.text.Normalizer.normalize(s == null ? "" : s, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("[.\\-']", "")
                .toLowerCase()
                .trim()
                .replaceAll("\\s+", " ");
    }
}

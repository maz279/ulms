package com.uslbd.ulms.platform;

import java.util.List;
import java.util.UUID;

/** Standard list envelope (PLANNING/05 §2): { data, meta } on every list route. */
public record ApiList<T>(List<T> data, Meta meta) {

    public record Meta(UUID requestId, int page, int size, long totalElements, int totalPages) {}

    public static <T> ApiList<T> of(List<T> data, int page, int size) {
        int total = data.size();
        int from = Math.min((page - 1) * size, total);
        int to = Math.min(from + size, total);
        int pages = size == 0 ? 0 : (int) Math.ceil(total / (double) size);
        return new ApiList<>(data.subList(from, to),
                new Meta(UUID.randomUUID(), page, size, total, pages));
    }

    /** Full list, no slicing (small P1 collections like a document set). */
    public static <T> ApiList<T> of(List<T> data) {
        return new ApiList<>(data, new Meta(UUID.randomUUID(), 1, data.size(), data.size(), 1));
    }
}

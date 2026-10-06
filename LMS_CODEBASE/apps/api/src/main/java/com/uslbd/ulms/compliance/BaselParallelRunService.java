package com.uslbd.ulms.compliance;

import com.uslbd.ulms.platform.audit.AuditService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Basel parallel-run harness (Q3.7): snapshots ULMS-computed metrics for a
 * period, records the bank's current-return values alongside, and renders the
 * side-by-side comparison report. Two quarters of these rows are the Basel
 * parallel-run evidence for go-live.
 */
@Service
public class BaselParallelRunService {

    private final BaselParallelRunRepository runs;
    private final BaselService basel;
    private final AuditService audit;

    public BaselParallelRunService(BaselParallelRunRepository runs, BaselService basel,
                                   AuditService audit) {
        this.runs = runs; this.basel = basel; this.audit = audit;
    }

    /** Snapshot ULMS metrics for the period (idempotent upsert by metric). */
    @Transactional
    public int snapshotUmlsValues(String period, String actor) {
        try {
            java.time.YearMonth.parse(period);   // shape AND calendar validity
        } catch (java.time.format.DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "period must be a valid YYYY-MM, got " + period);
        }
        Map<String, String> metrics = new LinkedHashMap<>();
        metrics.put("CAR", com.uslbd.ulms.platform.idempotency.IdempotencyService
                .toJson(basel.rwaSummary()));
        metrics.put("rwaBySegment", com.uslbd.ulms.platform.idempotency.IdempotencyService
                .toJson(basel.rwaBySegment()));
        metrics.put("leverageRatioBp", String.valueOf(basel.leverageRatioBp()));

        int written = 0;
        for (var e : metrics.entrySet()) {
            var existing = runs.findAllByPeriodOrderByMetricAsc(period).stream()
                    .filter(r -> r.getMetric().equals(e.getKey())).findFirst();
            if (existing.isPresent()) {
                // re-snapshot replaces the ULMS side only; bank values kept
                runs.save(BaselParallelRun.of(existing.get().getId(), period, e.getKey(),
                        e.getValue(), existing.get().getBankValue(),
                        existing.get().getVarianceNote()));
            } else {
                runs.save(BaselParallelRun.of(UUID.randomUUID(), period, e.getKey(),
                        e.getValue(), null, null));
            }
            written++;
        }
        audit.record(actor, "BASEL_PARALLEL_SNAPSHOT", "period", UUID.nameUUIDFromBytes(
                period.getBytes()), "\"" + written + " metrics for " + period + "\"",
                UUID.randomUUID());
        return written;
    }

    /** Record the bank's current-return value + variance note for a metric. */
    @Transactional
    public BaselParallelRun recordBankValue(String period, String metric,
                                           String bankValue, String varianceNote, String actor) {
        var row = runs.findAllByPeriodOrderByMetricAsc(period).stream()
                .filter(r -> r.getMetric().equals(metric)).findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "no ULMS snapshot for " + metric + " @ " + period
                                + " — snapshot first"));
        runs.save(BaselParallelRun.of(row.getId(), period, metric,
                row.getUlmsValue(), bankValue, varianceNote));
        audit.record(actor, "BASEL_PARALLEL_BANK_VALUE", "period", row.getId(),
                "\"" + metric + " bank value recorded\"", UUID.randomUUID());
        return row;
    }

    /** Side-by-side report (markdown) for one period or all quarters. */
    @Transactional(readOnly = true)
    public String report(String periodOrNull) {
        var rows = periodOrNull == null
                ? runs.findAll()
                : runs.findAllByPeriodOrderByMetricAsc(periodOrNull);
        rows.sort(java.util.Comparator.comparing(BaselParallelRun::getPeriod)
                .thenComparing(BaselParallelRun::getMetric));
        var sb = new StringBuilder("# Basel parallel-run — ULMS vs bank current returns\n\n");
        sb.append("| Period | Metric | ULMS | Bank | Variance note |\n|---|---|---|---|---|\n");
        for (BaselParallelRun r : rows) {
            sb.append("| ").append(r.getPeriod())
              .append(" | ").append(r.getMetric())
              .append(" | ").append(truncate(r.getUlmsValue()))
              .append(" | ").append(r.getBankValue() == null ? "—" : truncate(r.getBankValue()))
              .append(" | ").append(r.getVarianceNote() == null ? "" : r.getVarianceNote())
              .append(" |\n");
        }
        long complete = rows.stream().filter(r -> r.getBankValue() != null).count();
        sb.append("\n").append(complete).append("/").append(rows.size())
          .append(" metrics have bank values recorded.\n");
        return sb.toString();
    }

    @Transactional(readOnly = true)
    public List<BaselParallelRun> rows(String periodOrNull) {
        return periodOrNull == null ? runs.findAll()
                : runs.findAllByPeriodOrderByMetricAsc(periodOrNull);
    }

    private static String truncate(String s) {
        return s.length() > 60 ? s.substring(0, 57) + "…" : s;
    }
}

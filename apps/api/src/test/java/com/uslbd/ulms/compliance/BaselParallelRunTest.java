package com.uslbd.ulms.compliance;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ResponseStatusException;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Q3.7: Basel parallel-run harness — snapshot ULMS metrics per period
 * (idempotent), record the bank's current-return values, render the
 * side-by-side report. Two quarters of these rows are the go-live evidence.
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class BaselParallelRunTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractPort clientPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 8900 + seq.incrementAndGet();
        }
        @Bean @Primary com.uslbd.ulms.integration.fineract.FineractLoanPort loanPort() {
            return spec -> 999L;
        }
        @Bean @Primary com.uslbd.ulms.integration.docs.DocumentStorePort docPort() {
            return new com.uslbd.ulms.integration.docs.DocumentStorePort() {
                @Override public com.uslbd.ulms.integration.docs.DocumentStorePort.StoredObject put(
                        String key, java.io.InputStream bytes, long size, String contentType) {
                    return new com.uslbd.ulms.integration.docs.DocumentStorePort.StoredObject(
                            key, "b".repeat(64), size);
                }
                @Override public String presignedGetUrl(String key,
                        com.uslbd.ulms.integration.docs.DocumentStorePort.DurationTtl ttl) {
                    return "http://minio.local/" + key;
                }
            };
        }
    }

    @Autowired BaselParallelRunService parallel;
    @Autowired BaselParallelRunRepository runs;

    @Test
    void snapshotIsIdempotentAndRejectsBadPeriods() {
        assertThatThrownBy(() -> parallel.snapshotUmlsValues("2026-13", "t"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);

        int first = parallel.snapshotUmlsValues("2026-09", "t");
        assertThat(first).isEqualTo(3);   // CAR + rwaBySegment + leverageRatioBp
        int rerun = parallel.snapshotUmlsValues("2026-09", "t");
        assertThat(rerun).isEqualTo(3);
        assertThat(runs.findAllByPeriodOrderByMetricAsc("2026-09")).hasSize(3);  // upsert, not append
    }

    @Test
    void bankValueRequiresSnapshotAndReportShowsBothSides() {
        assertThatThrownBy(() -> parallel.recordBankValue("2025-01", "CAR", "11.8%", "note", "t"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);

        parallel.snapshotUmlsValues("2026-06", "t");
        parallel.recordBankValue("2026-06", "CAR", "11.8%",
                "0.7pp below ULMS — legacy provisioning floor", "t");

        String report = parallel.report("2026-06");
        assertThat(report).startsWith("# Basel parallel-run");
        assertThat(report).contains("| 2026-06 | CAR |");
        assertThat(report).contains("11.8%");
        assertThat(report).contains("1/3 metrics have bank values");
    }
}

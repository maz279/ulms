package com.uslbd.ulms.platform;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import io.micrometer.core.instrument.Counter;

/**
 * Business metrics surfaced in Grafana (PLANNING/10 §5). The walking skeleton
 * publishes customers.created — each module adds its own counters here.
 */
@Configuration
public class MetricsConfig {

    @Bean
    Counter customersCreated(io.micrometer.core.instrument.MeterRegistry registry) {
        return Counter.builder("ulms_customers_created_total")
                .description("Customers created via the ULMS API")
                .register(registry);
    }
}

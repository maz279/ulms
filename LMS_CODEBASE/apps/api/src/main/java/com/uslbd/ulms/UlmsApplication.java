package com.uslbd.ulms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.modulith.Modulithic;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.time.Clock;

/**
 * ULMS v2.0 — modular monolith entry point (PLANNING/01).
 * Modules live under com.uslbd.ulms.<module>; boundaries verified by
 * Spring Modulith tests (ArchUnit in CI). Adding a new module requires
 * an ADR (see docs/adr).
 */
@SpringBootApplication
@EnableScheduling
@Modulithic(sharedModules = {"platform"})
public class UlmsApplication {

    @Bean
    Clock clock() { return Clock.systemUTC(); }   // webhook timestamp window + tests

    public static void main(String[] args) {
        SpringApplication.run(UlmsApplication.class, args);
    }
}

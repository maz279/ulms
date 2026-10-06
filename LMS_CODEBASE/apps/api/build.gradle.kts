plugins {
    java
    id("org.springframework.boot") version "4.0.0"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "com.uslbd.ulms"
version = "0.1.0-SNAPSHOT"

java {
    toolchain { languageVersion = JavaLanguageVersion.of(21) }
}

repositories { mavenCentral() }

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-oauth2-resource-server")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("io.micrometer:micrometer-registry-prometheus")   // P5: makes /actuator/prometheus real (admin-gated)
    implementation("org.springframework.modulith:spring-modulith-starter-core:1.4.0")
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")
    implementation("org.springframework.boot:spring-boot-flyway")   // Boot 4: auto-config lives here
    implementation("org.springframework.boot:spring-boot-starter-webflux") // Fineract adapter HTTP client
    implementation("io.github.resilience4j:resilience4j-spring-boot3:2.2.0")   // R7: CIB retry matrix
    implementation("org.aspectj:aspectjweaver")   // Boot 4 dropped starter-aop; resilience4j annotations need the weaver (version via BOM)
    implementation("com.github.ben-manes.caffeine:caffeine:3.1.8")             // R7: CIB 1h response cache
    implementation("org.bouncycastle:bcpg-jdk18on:1.78.1")                       // R7: BB SFTP PGP sign+encrypt
    implementation("software.amazon.awssdk:s3:2.31.0")                    // MinIO document store (P1)
    implementation("com.openhtmltopdf:openhtmltopdf-pdfbox:1.0.10")        // R10 P-E: tax-certificate / no-due PDFs

    runtimeOnly("org.postgresql:postgresql")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.boot:spring-boot-testcontainers")
    testImplementation("org.springframework.modulith:spring-modulith-starter-test:1.4.0")
    testImplementation("com.tngtech.archunit:archunit:1.3.0")   // dual-auth structural rule (03)
    testImplementation("org.testcontainers:junit-jupiter:1.21.3")
    testImplementation("org.testcontainers:postgresql:1.21.3")
    testImplementation("io.rest-assured:rest-assured:5.5.0")
    testImplementation("org.wiremock:wiremock-standalone:3.9.1")   // R7: live-adapter contract tests (cib)
}

// Boot 4 no longer auto-applies dependency management — import the BOM explicitly.
dependencyManagement {
    imports {
        mavenBom("org.springframework.boot:spring-boot-dependencies:4.0.0")
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
    // R10: 512 m thrashed GC with ~31 cached Spring Testcontainers contexts —
    // the full suite died in an old-gen spiral; 2 g + parallel-off runs clean
    maxHeapSize = "2g"
    // Testcontainers needs DOCKER_HOST if docker runs via TCP
    environment("TESTCONTAINERS_RYUK_DISABLED", "true")
}

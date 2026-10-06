# Test Environment Setup Guide
## ULMS v2.0 Testing Infrastructure Configuration

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | Test Environment Setup Guide |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 8, 2026 |
| **Prepared By** | QA Lead / DevOps Engineer |
| **Classification** | Internal |
| **Status** | Approved |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Test Environment Architecture](#2-test-environment-architecture)
3. [Prerequisites](#3-prerequisites)
4. [Test Environment Setup](#4-test-environment-setup)
5. [Test Data Configuration](#5-test-data-configuration)
6. [Test Automation Setup](#6-test-automation-setup)
7. [CI/CD Integration](#7-cicd-integration)
8. [Mock Services Configuration](#8-mock-services-configuration)
9. [Test Reporting](#9-test-reporting)
10. [Troubleshooting](#10-troubleshooting)
11. [Appendix](#11-appendix)

---

## 1. Overview

### 1.1 Purpose

This document provides comprehensive instructions for setting up and configuring the complete testing infrastructure for ULMS v2.0. The test environment supports multiple testing types and ensures consistent, reliable, and automated testing capabilities.

### 1.2 Testing Strategy Overview

| Test Type | Environment | Tools | Frequency |
|-----------|-------------|-------|-----------|
| Unit Tests | Local/Dev | JUnit 5, Mockito | Every commit |
| Integration Tests | Test | TestContainers | Every PR |
| API Tests | Test | REST Assured, Postman | Nightly |
| E2E Tests | Staging | Cypress, Playwright | Nightly |
| Performance Tests | Performance | k6, JMeter | Weekly |
| Security Tests | Security | OWASP ZAP | Weekly |
| Accessibility Tests | Staging | Axe, Lighthouse | Weekly |

### 1.3 Test Environment Types

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ULMS Test Environment Matrix                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │   DEV    │───▶│   TEST   │───▶│  STAGING │───▶│   PROD   │      │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘      │
│       │               │               │                            │
│       ▼               ▼               ▼                            │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                      │
│  │ Unit/Int │    │  API/E2E │    │ UAT/Perf │                      │
│  │  Tests   │    │  Tests   │    │  Tests   │                      │
│  └──────────┘    └──────────┘    └──────────┘                      │
│                                                                     │
│  Environments:                                                      │
│  • DEV:    Local developer environment                              │
│  • TEST:    Automated testing environment                           │
│  • STAGING: Pre-production validation                               │
│  • PROD:    Production (excluded from automated tests)              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Test Environment Architecture

### 2.1 Physical Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ULMS Test Environment                               │
│                         (Kubernetes Cluster)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Ingress Controller                            │   │
│  │                    (Nginx / Kong Gateway)                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│        ┌───────────────────────────┼───────────────────────────┐            │
│        │                           │                           │            │
│        ▼                           ▼                           ▼            │
│  ┌──────────────┐          ┌──────────────┐          ┌──────────────┐      │
│  │  TEST-Namespace          STAGE-Namespace          PERF-Namespace  │      │
│  │  ────────────            ──────────────            ────────────  │      │
│  │  • ULMS API              • ULMS API               • ULMS API    │      │
│  │  • ULMS UI               • ULMS UI                • ULMS UI     │      │
│  │  • Fineract              • Fineract               • Fineract    │      │
│  │  • Camunda               • Camunda                • Camunda     │      │
│  │  • PostgreSQL            • PostgreSQL             • PostgreSQL  │      │
│  │  • Redis                 • Redis                  • Redis       │      │
│  │  • Kafka                 • Kafka                  • Kafka       │      │
│  │  • WireMock              • WireMock               • Locust      │      │
│  │  • Test Runner           • Selenium Grid          • k6          │      │
│  └──────────────┘          └──────────────┘          └──────────────┘      │
│                                                                             │
│  Supporting Services:                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Jenkins  │  │  Sonar   │  │  Nexus   │  │  Vault   │  │  ELK     │      │
│  │  CI/CD   │  │  Qube    │  │  Repo    │  │  Secrets │  │  Stack   │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Network Configuration

| Environment | Subnet | Domain | SSL Certificate |
|-------------|--------|--------|-----------------|
| TEST | 10.10.0.0/16 | test.ulms.local | Self-signed |
| STAGING | 10.20.0.0/16 | staging.ulms.local | Let's Encrypt |
| PERFORMANCE | 10.30.0.0/16 | perf.ulms.local | Self-signed |

---

## 3. Prerequisites

### 3.1 Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 8 cores | 16 cores+ |
| RAM | 16 GB | 32 GB+ |
| Storage | 100 GB SSD | 200 GB SSD |
| Network | 1 Gbps | 10 Gbps |

### 3.2 Software Requirements

```bash
# Required tools
java --version          # Java 21
node --version          # Node.js 20+
docker --version        # Docker 24.x
kubectl version         # Kubernetes 1.28+
helm version            # Helm 3.x

# Testing tools
mvn --version           # Maven 3.9+
newman --version        # Newman (Postman CLI)
npx cypress --version   # Cypress 13+
k6 version              # k6 0.48+
```

### 3.3 Install Testing Tools

```bash
# Install Maven
sudo apt update
sudo apt install maven -y

# Install Node.js and testing tools
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install global testing packages
sudo npm install -g newman newman-reporter-htmlextra
sudo npm install -g @playwright/test
sudo npm install -g lighthouse

# Install k6 for performance testing
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt update
sudo apt install k6

# Install OWASP ZAP
wget https://github.com/zaproxy/zaproxy/releases/download/v2.14.0/ZAP_2_14_0_unix.sh
chmod +x ZAP_2_14_0_unix.sh
sudo ./ZAP_2_14_0_unix.sh -q
```

---

## 4. Test Environment Setup

### 4.1 Docker Compose Test Environment

Create `docker-compose.test.yml`:

```yaml
version: '3.8'

services:
  # PostgreSQL for Testing
  postgres-test:
    image: postgres:16-alpine
    container_name: ulms-postgres-test
    environment:
      POSTGRES_DB: ulms_test
      POSTGRES_USER: ulms_test
      POSTGRES_PASSWORD: test_password_2024
    ports:
      - "5433:5432"
    volumes:
      - postgres-test-data:/var/lib/postgresql/data
      - ./test/sql/init-test-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ulms_test"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ulms-test-network

  # Redis for Testing
  redis-test:
    image: redis:7.2-alpine
    container_name: ulms-redis-test
    ports:
      - "6380:6379"
    command: redis-server --requirepass test_redis_2024
    volumes:
      - redis-test-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - ulms-test-network

  # Kafka for Testing
  zookeeper-test:
    image: confluentinc/cp-zookeeper:7.5.0
    container_name: ulms-zookeeper-test
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
    networks:
      - ulms-test-network

  kafka-test:
    image: confluentinc/cp-kafka:7.5.0
    container_name: ulms-kafka-test
    depends_on:
      - zookeeper-test
    ports:
      - "9093:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper-test:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9093
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    networks:
      - ulms-test-network

  # WireMock for API Mocking
  wiremock-test:
    image: wiremock/wiremock:3.3.1
    container_name: ulms-wiremock-test
    ports:
      - "8089:8080"
    volumes:
      - ./test/wiremock/mappings:/home/wiremock/mappings
      - ./test/wiremock/__files:/home/wiremock/__files
    command: --global-response-templating --verbose
    networks:
      - ulms-test-network

  # MailHog for Email Testing
  mailhog-test:
    image: mailhog/mailhog:v1.0.1
    container_name: ulms-mailhog-test
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI
    networks:
      - ulms-test-network

  # MinIO for S3 Testing
  minio-test:
    image: minio/minio:RELEASE.2024-01-16T16-07-38Z
    container_name: ulms-minio-test
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    command: server /data --console-address ":9001"
    volumes:
      - minio-test-data:/data
    networks:
      - ulms-test-network

  # Selenium Grid for E2E Testing
  selenium-hub:
    image: selenium/hub:4.16.1
    container_name: selenium-hub
    ports:
      - "4444:4444"
      - "4442:4442"
      - "4443:4443"
    networks:
      - ulms-test-network

  chrome-node:
    image: selenium/node-chrome:4.16.1
    container_name: chrome-node
    depends_on:
      - selenium-hub
    environment:
      - SE_EVENT_BUS_HOST=selenium-hub
      - SE_EVENT_BUS_PUBLISH_PORT=4442
      - SE_EVENT_BUS_SUBSCRIBE_PORT=4443
      - SE_NODE_MAX_SESSIONS=4
    networks:
      - ulms-test-network

  firefox-node:
    image: selenium/node-firefox:4.16.1
    container_name: firefox-node
    depends_on:
      - selenium-hub
    environment:
      - SE_EVENT_BUS_HOST=selenium-hub
      - SE_EVENT_BUS_PUBLISH_PORT=4442
      - SE_EVENT_BUS_SUBSCRIBE_PORT=4443
      - SE_NODE_MAX_SESSIONS=4
    networks:
      - ulms-test-network

  # Test Reporting Service
  allure-service:
    image: frankescobar/allure-docker-service:2.24.0
    container_name: ulms-allure
    ports:
      - "5050:5050"
    environment:
      CHECK_RESULTS_EVERY_SECONDS: 5
      KEEP_HISTORY: 1
    volumes:
      - ./test/results:/app/allure-results
    networks:
      - ulms-test-network

volumes:
  postgres-test-data:
  redis-test-data:
  minio-test-data:

networks:
  ulms-test-network:
    driver: bridge
```

### 4.2 Start Test Environment

```bash
# Create test environment directory
mkdir -p ulms-test-env
cd ulms-test-env

# Download compose file
curl -o docker-compose.test.yml [URL_TO_FILE]

# Start all services
docker-compose -f docker-compose.test.yml up -d

# Verify all services are running
docker-compose -f docker-compose.test.yml ps

# View logs
docker-compose -f docker-compose.test.yml logs -f

# Stop environment
docker-compose -f docker-compose.test.yml down

# Stop and remove volumes (clean slate)
docker-compose -f docker-compose.test.yml down -v
```

---

## 5. Test Data Configuration

### 5.1 Test Database Initialization

Create `test/sql/init-test-db.sql`:

```sql
-- ULMS Test Database Initialization
-- Date: February 8, 2026

-- Create test schemas
CREATE SCHEMA IF NOT EXISTS test_data;
CREATE SCHEMA IF NOT EXISTS test_reference;

-- Test Banks
INSERT INTO test_reference.banks (code, name, swift_code, is_active) VALUES
('001', 'Test Bank Limited', 'TESTBDDH', true),
('002', 'Demo Islamic Bank', 'DEMOBDDH', true),
('003', 'Sample Commercial Bank', 'SAMBDDH', true);

-- Test Branches
INSERT INTO test_reference.branches (bank_code, branch_code, branch_name, routing_number) VALUES
('001', '001', 'Gulshan Branch', '110110001'),
('001', '002', 'Dhanmondi Branch', '110110002'),
('002', '001', 'Motijheel Branch', '120110001');

-- Test Loan Products
INSERT INTO test_reference.loan_products (product_code, product_name, product_type, interest_rate_min, interest_rate_max, tenure_min_months, tenure_max_months) VALUES
('PL-001', 'Personal Loan - Standard', 'PERSONAL', 9.0, 15.0, 12, 60),
('PL-002', 'Personal Loan - Premium', 'PERSONAL', 7.0, 12.0, 12, 84),
('HL-001', 'Home Loan - Fixed Rate', 'HOME', 7.5, 11.0, 60, 300),
('BL-001', 'SME Business Loan', 'BUSINESS', 10.0, 16.0, 6, 120),
('IL-001', 'Islamic Car Ijarah', 'ISLAMIC', 8.0, 12.0, 12, 72);

-- Test Users
INSERT INTO test_reference.test_users (username, email, role, branch_code, is_active) VALUES
('test.admin', 'admin@test.ulms', 'SYSTEM_ADMIN', '001', true),
('test.bm', 'bm001@test.ulms', 'BRANCH_MANAGER', '001', true),
('test.rm', 'rm001@test.ulms', 'RELATIONSHIP_MANAGER', '001', true),
('test.cso', 'cso001@test.ulms', 'CUSTOMER_SERVICE_OFFICER', '001', true),
('test.credit', 'credit001@test.ulms', 'CREDIT_ANALYST', '001', true),
('test.committee', 'committee001@test.ulms', 'CREDIT_COMMITTEE', '001', true);

-- Test Customers
INSERT INTO test_reference.test_customers (customer_id, full_name, nid_number, mobile_number, email, customer_type) VALUES
('CUST-001', 'Md. Test Customer One', '1234567890123', '01700000001', 'customer1@test.ulms', 'INDIVIDUAL'),
('CUST-002', 'Test Business Ltd.', '9876543210987', '01700000002', 'business@test.ulms', 'CORPORATE'),
('CUST-003', 'Fatima Begum', '5678901234567', '01700000003', 'customer3@test.ulms', 'INDIVIDUAL');

-- Test Loan Applications
INSERT INTO test_data.test_loan_applications (
    application_id, customer_id, product_code, 
    requested_amount, requested_tenure_months, 
    application_status, created_date
) VALUES
('APP-2024-000001', 'CUST-001', 'PL-001', 500000, 36, 'DRAFT', NOW() - INTERVAL '5 days'),
('APP-2024-000002', 'CUST-002', 'BL-001', 5000000, 60, 'UNDER_REVIEW', NOW() - INTERVAL '3 days'),
('APP-2024-000003', 'CUST-003', 'HL-001', 8000000, 240, 'APPROVED', NOW() - INTERVAL '10 days');

-- Create test data generation function
CREATE OR REPLACE FUNCTION test_data.generate_test_loan_applications(
    p_count INTEGER DEFAULT 100
) RETURNS VOID AS $$
DECLARE
    v_counter INTEGER := 0;
    v_customer_id VARCHAR(20);
    v_product_code VARCHAR(20);
    v_amount DECIMAL(15,2);
    v_tenure INTEGER;
BEGIN
    WHILE v_counter < p_count LOOP
        v_customer_id := 'CUST-' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 4, '0');
        v_product_code := (ARRAY['PL-001', 'PL-002', 'HL-001', 'BL-001'])[FLOOR(RANDOM() * 4 + 1)];
        v_amount := FLOOR(RANDOM() * 1000000 + 100000);
        v_tenure := (ARRAY[12, 24, 36, 48, 60])[FLOOR(RANDOM() * 5 + 1)];
        
        INSERT INTO test_data.test_loan_applications (
            application_id, customer_id, product_code,
            requested_amount, requested_tenure_months,
            application_status, created_date
        ) VALUES (
            'APP-GEN-' || LPAD(v_counter::TEXT, 6, '0'),
            v_customer_id,
            v_product_code,
            v_amount,
            v_tenure,
            (ARRAY['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'])[FLOOR(RANDOM() * 3 + 1)],
            NOW() - (RANDOM() * INTERVAL '30 days')
        );
        
        v_counter := v_counter + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Generate sample test data
SELECT test_data.generate_test_loan_applications(50);
```

### 5.2 Test Data Management Configuration

Create `test-data-config.yml`:

```yaml
test-data:
  # Data generation settings
  generation:
    default-batch-size: 100
    parallel-threads: 4
    
  # Data masking rules for production-like data
  masking:
    nid-number:
      pattern: "XXXXXX{{last-7}}"
      preserve-format: true
    mobile-number:
      pattern: "017XXXX{{last-4}}"
    email:
      pattern: "{{first-3}}***@{{domain}}"
      
  # Test data categories
  categories:
    minimal:
      customers: 10
      applications: 20
      users: 5
    
    standard:
      customers: 100
      applications: 500
      users: 20
      loans: 300
      
    comprehensive:
      customers: 1000
      applications: 5000
      users: 50
      loans: 3000
      transactions: 10000
      
    performance:
      customers: 10000
      applications: 50000
      loans: 30000
      transactions: 100000
      
  # Data retention
  retention:
    test-environment: 7-days
    staging-environment: 30-days
    performance-test: on-demand
```

---

## 6. Test Automation Setup

### 6.1 Maven Test Configuration

Update `pom.xml` test profiles:

```xml
<profiles>
    <!-- Unit Test Profile -->
    <profile>
        <id>unit-tests</id>
        <activation>
            <activeByDefault>true</activeByDefault>
        </activation>
        <properties>
            <test.groups>unit</test.groups>
        </properties>
        <build>
            <plugins>
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-surefire-plugin</artifactId>
                    <version>3.2.5</version>
                    <configuration>
                        <groups>${test.groups}</groups>
                        <excludedGroups>integration,e2e,performance</excludedGroups>
                        <parallel>methods</parallel>
                        <threadCount>4</threadCount>
                    </configuration>
                </plugin>
            </plugins>
        </build>
    </profile>
    
    <!-- Integration Test Profile -->
    <profile>
        <id>integration-tests</id>
        <properties>
            <test.groups>integration</test.groups>
        </properties>
        <build>
            <plugins>
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-failsafe-plugin</artifactId>
                    <version>3.2.5</version>
                    <configuration>
                        <groups>${test.groups}</groups>
                    </configuration>
                    <executions>
                        <execution>
                            <goals>
                                <goal>integration-test</goal>
                                <goal>verify</goal>
                            </goals>
                        </execution>
                    </executions>
                </plugin>
            </plugins>
        </build>
    </profile>
    
    <!-- E2E Test Profile -->
    <profile>
        <id>e2e-tests</id>
        <properties>
            <test.groups>e2e</test.groups>
        </properties>
    </profile>
</profiles>

<dependencies>
    <!-- JUnit 5 -->
    <dependency>
        <groupId>org.junit.jupiter</groupId>
        <artifactId>junit-jupiter</artifactId>
        <version>5.10.0</version>
        <scope>test</scope>
    </dependency>
    
    <!-- Mockito -->
    <dependency>
        <groupId>org.mockito</groupId>
        <artifactId>mockito-core</artifactId>
        <version>5.8.0</version>
        <scope>test</scope>
    </dependency>
    
    <!-- TestContainers -->
    <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>postgresql</artifactId>
        <version>1.19.3</version>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>junit-jupiter</artifactId>
        <version>1.19.3</version>
        <scope>test</scope>
    </dependency>
    
    <!-- REST Assured -->
    <dependency>
        <groupId>io.rest-assured</groupId>
        <artifactId>rest-assured</artifactId>
        <version>5.4.0</version>
        <scope>test</scope>
    </dependency>
    
    <!-- Selenium -->
    <dependency>
        <groupId>org.seleniumhq.selenium</groupId>
        <artifactId>selenium-java</artifactId>
        <version>4.16.2</version>
        <scope>test</scope>
    </dependency>
    
    <!-- Allure Reporting -->
    <dependency>
        <groupId>io.qameta.allure</groupId>
        <artifactId>allure-junit5</artifactId>
        <version>2.25.0</version>
        <scope>test</scope>
    </dependency>
</dependencies>
```

### 6.2 Test Configuration Properties

Create `src/test/resources/application-test.yml`:

```yaml
spring:
  profiles:
    active: test
  
  datasource:
    url: jdbc:postgresql://localhost:5433/ulms_test
    username: ulms_test
    password: test_password_2024
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 5
      minimum-idle: 2
  
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: true
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
  
  data:
    redis:
      host: localhost
      port: 6380
      password: test_redis_2024
      database: 0
  
  kafka:
    bootstrap-servers: localhost:9093
    consumer:
      group-id: ulms-test-group
      auto-offset-reset: earliest
  
  mail:
    host: localhost
    port: 1025

# Test-specific configurations
ulms:
  test:
    mock:
      cib-url: http://localhost:8089/cib
      nid-url: http://localhost:8089/nid
      payment-url: http://localhost:8089/payment
    
    selenium:
      hub-url: http://localhost:4444/wd/hub
      browser: chrome
      headless: true
      implicit-wait: 10
    
    data:
      seed-enabled: true
      seed-file: test-data-seed.sql

# Logging
logging:
  level:
    com.unisoft.ulms: DEBUG
    org.springframework.test: INFO
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
```

### 6.3 TestContainer Configuration

```java
package com.unisoft.ulms.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.utility.DockerImageName;

@TestConfiguration(proxyBeanMethods = false)
public class TestContainerConfig {

    @Bean
    @ServiceConnection
    public PostgreSQLContainer<?> postgresContainer() {
        return new PostgreSQLContainer<>(DockerImageName.parse("postgres:16-alpine"))
            .withDatabaseName("ulms_test")
            .withUsername("ulms_test")
            .withPassword("test_password_2024")
            .withInitScript("schema-test.sql");
    }

    @Bean
    public GenericContainer<?> redisContainer() {
        return new GenericContainer<>(DockerImageName.parse("redis:7.2-alpine"))
            .withExposedPorts(6379)
            .withCommand("redis-server --requirepass test_redis_2024");
    }

    @Bean
    public KafkaContainer kafkaContainer() {
        return new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.5.0"));
    }
}
```

---

## 7. CI/CD Integration

### 7.1 Jenkins Pipeline

Create `Jenkinsfile`:

```groovy
pipeline {
    agent any
    
    tools {
        maven 'Maven-3.9'
        jdk 'JDK-21'
    }
    
    environment {
        DOCKER_REGISTRY = 'registry.ulms.local'
        SONAR_URL = 'http://sonar.ulms.local'
        ALLURE_URL = 'http://allure.ulms.local'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Unit Tests') {
            steps {
                sh 'mvn clean test -P unit-tests'
            }
            post {
                always {
                    junit '**/target/surefire-reports/*.xml'
                    jacoco execPattern: '**/target/jacoco.exec'
                }
            }
        }
        
        stage('Code Quality') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh 'mvn sonar:sonar -Dsonar.projectKey=ULMS'
                }
            }
        }
        
        stage('Integration Tests') {
            steps {
                sh 'docker-compose -f docker-compose.test.yml up -d'
                sh 'sleep 30' // Wait for services
                sh 'mvn verify -P integration-tests'
            }
            post {
                always {
                    sh 'docker-compose -f docker-compose.test.yml down'
                    junit '**/target/failsafe-reports/*.xml'
                }
            }
        }
        
        stage('API Tests') {
            steps {
                sh 'newman run tests/postman/ulms-api-collection.json \
                    -e tests/postman/test-environment.json \
                    --reporters cli,htmlextra \
                    --reporter-htmlextra-export newman-report.html'
            }
            post {
                always {
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: '.',
                        reportFiles: 'newman-report.html',
                        reportName: 'API Test Report'
                    ])
                }
            }
        }
        
        stage('E2E Tests') {
            when {
                branch 'develop'
            }
            steps {
                sh 'npm ci'
                sh 'npx cypress run --record --parallel'
            }
            post {
                always {
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'cypress/reports/html',
                        reportFiles: 'index.html',
                        reportName: 'E2E Test Report'
                    ])
                }
            }
        }
        
        stage('Performance Tests') {
            when {
                anyOf {
                    branch 'develop'
                    branch 'main'
                }
            }
            steps {
                sh 'k6 run --out influxdb=http://influxdb:8086/k6 tests/performance/smoke-test.js'
            }
        }
        
        stage('Security Tests') {
            when {
                branch 'main'
            }
            steps {
                sh 'zap-api-scan.py -t http://test.ulms.local -f openapi'
            }
        }
        
        stage('Build & Push') {
            when {
                anyOf {
                    branch 'develop'
                    branch 'main'
                }
            }
            steps {
                script {
                    def image = docker.build("${DOCKER_REGISTRY}/ulms:${BUILD_NUMBER}")
                    docker.withRegistry("https://${DOCKER_REGISTRY}", 'registry-credentials') {
                        image.push()
                        image.push('latest')
                    }
                }
            }
        }
    }
    
    post {
        always {
            allure([
                includeProperties: false,
                jdk: '',
                properties: [],
                reportBuildPolicy: 'ALWAYS',
                results: [[path: 'target/allure-results']]
            ])
            cleanWs()
        }
        failure {
            emailext (
                subject: "ULMS Build Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: "Check console output at ${env.BUILD_URL}",
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
    }
}
```

### 7.2 GitLab CI Configuration

Create `.gitlab-ci.yml`:

```yaml
stages:
  - build
  - test
  - report
  - deploy

variables:
  MAVEN_OPTS: "-Dmaven.repo.local=.m2/repository"
  DOCKER_REGISTRY: "registry.ulms.local"

# Cache settings
.maven-cache: &maven-cache
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - .m2/repository

docker-in-docker: &docker-in-docker
  services:
    - docker:24-dind
  variables:
    DOCKER_TLS_CERTDIR: "/certs"

# Build stage
build:
  stage: build
  image: maven:3.9-eclipse-temurin-21
  <<: *maven-cache
  script:
    - mvn compile -DskipTests
  artifacts:
    paths:
      - target/

# Test stages
unit-tests:
  stage: test
  image: maven:3.9-eclipse-temurin-21
  <<: *maven-cache
  script:
    - mvn test -P unit-tests
  artifacts:
    reports:
      junit: target/surefire-reports/TEST-*.xml
    paths:
      - target/site/jacoco/

integration-tests:
  stage: test
  image: maven:3.9-eclipse-temurin-21
  <<: *maven-cache
  <<: *docker-in-docker
  script:
    - docker-compose -f docker-compose.test.yml up -d
    - sleep 30
    - mvn verify -P integration-tests
    - docker-compose -f docker-compose.test.yml down
  artifacts:
    reports:
      junit: target/failsafe-reports/TEST-*.xml

api-tests:
  stage: test
  image: postman/newman:latest
  script:
    - newman run tests/postman/ulms-api-collection.json
        -e tests/postman/test-environment.json
        --reporters cli,junit
        --reporter-junit-export newman-report.xml
  artifacts:
    reports:
      junit: newman-report.xml

e2e-tests:
  stage: test
  image: cypress/browsers:node-20.11.0-chrome-121.0.6167.85-1-ff-120.0-edge-121.0.2277.83-1
  script:
    - npm ci
    - npx cypress run --browser chrome
  artifacts:
    when: always
    paths:
      - cypress/videos/**/*.mp4
      - cypress/screenshots/**/*.png
    expire_in: 1 week

performance-tests:
  stage: test
  image: grafana/k6:latest
  script:
    - k6 run --out json=performance-results.json tests/performance/load-test.js
  artifacts:
    paths:
      - performance-results.json

# Report stage
allure-report:
  stage: report
  image: frankescobar/allure-docker-service:latest
  script:
    - allure generate target/allure-results -o allure-report
  artifacts:
    paths:
      - allure-report
    expire_in: 30 days

# Deploy stage
deploy-test:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl config use-context test
    - kubectl set image deployment/ulms-backend ulms=${DOCKER_REGISTRY}/ulms:${CI_COMMIT_SHA}
    - kubectl rollout status deployment/ulms-backend
  environment:
    name: test
  only:
    - develop
```

---

## 8. Mock Services Configuration

### 8.1 CIB Mock Configuration

Create `test/wiremock/mappings/cib-mock.json`:

```json
{
  "mappings": [
    {
      "id": "cib-inquiry-success",
      "name": "CIB Inquiry - Success",
      "request": {
        "method": "POST",
        "urlPath": "/cib/v1/inquiry",
        "headers": {
          "Authorization": {
            "matches": "Bearer .*"
          },
          "Content-Type": {
            "equalTo": "application/json"
          }
        },
        "bodyPatterns": [
          {
            "matchesJsonPath": "$.nidNumber"
          }
        ]
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "jsonBody": {
          "inquiryId": "CIB-{{randomValue type='UUID'}}",
          "nidNumber": "{{jsonPath request.body '$.nidNumber'}}",
          "cibReport": {
            "cibScore": {{randomInt lower=300 upper=850}},
            "reportDate": "{{now format='yyyy-MM-dd'}}",
            "inquiryDate": "{{now}}",
            "reportStatus": "AVAILABLE",
            "totalOutstandingAmount": {{randomInt lower=0 upper=5000000}},
            "totalNumberOfLoans": {{randomInt lower=0 upper=10}},
            "loanClassifications": {
              "standard": {{randomInt lower=0 upper=8}},
              "specialMention": {{randomInt lower=0 upper=2}},
              "substandard": 0,
              "doubtful": 0,
              "bad": 0
            },
            "worstStatus": "STD",
            "numberOfInquiriesLast6Months": {{randomInt lower=0 upper=5}},
            "defaults": []
          },
          "responseCode": "00",
          "responseMessage": "Success"
        }
      }
    },
    {
      "id": "cib-inquiry-no-data",
      "name": "CIB Inquiry - No Data",
      "request": {
        "method": "POST",
        "urlPath": "/cib/v1/inquiry",
        "bodyPatterns": [
          {
            "matchesJsonPath": "$.nidNumber",
            "equalToJson": "{\"nidNumber\": \"0000000000000\"}"
          }
        ]
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "jsonBody": {
          "inquiryId": "CIB-{{randomValue type='UUID'}}",
          "nidNumber": "0000000000000",
          "cibReport": null,
          "responseCode": "01",
          "responseMessage": "No CIB data found for this NID"
        }
      }
    },
    {
      "id": "cib-inquiry-timeout",
      "name": "CIB Inquiry - Timeout Simulation",
      "request": {
        "method": "POST",
        "urlPath": "/cib/v1/inquiry",
        "bodyPatterns": [
          {
            "matchesJsonPath": "$.nidNumber",
            "equalToJson": "{\"nidNumber\": \"9999999999999\"}"
          }
        ]
      },
      "response": {
        "status": 504,
        "fixedDelayMilliseconds": 31000,
        "headers": {
          "Content-Type": "application/json"
        },
        "jsonBody": {
          "error": "Gateway Timeout",
          "message": "CIB service response timeout"
        }
      }
    }
  ]
}
```

### 8.2 NID Verification Mock

Create `test/wiremock/mappings/nid-mock.json`:

```json
{
  "mappings": [
    {
      "id": "nid-verify-success",
      "name": "NID Verification - Success",
      "request": {
        "method": "POST",
        "urlPath": "/nid/v1/verify",
        "headers": {
          "Content-Type": {
            "equalTo": "application/json"
          }
        }
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "jsonBody": {
          "verificationId": "NID-{{randomValue type='UUID'}}",
          "nidNumber": "{{jsonPath request.body '$.nidNumber'}}",
          "verified": true,
          "citizenInfo": {
            "fullNameBangla": "মোঃ পরীক্ষা গ্রাহক",
            "fullNameEnglish": "Md. Test Customer",
            "fatherName": "Md. Test Father",
            "motherName": "Test Mother",
            "dateOfBirth": "1990-01-01",
            "gender": "Male",
            "bloodGroup": "O+",
            "presentAddress": {
              "division": "Dhaka",
              "district": "Dhaka",
              "upazila": "Gulshan",
              "union": "Ward-20",
              "village": "Gulshan-1",
              "postCode": "1212"
            },
            "permanentAddress": {
              "division": "Dhaka",
              "district": "Gazipur",
              "upazila": "Gazipur Sadar",
              "union": "Bason",
              "village": "Test Village",
              "postCode": "1700"
            }
          },
          "photo": "{{base64 'test/wiremock/__files/sample-photo.jpg'}}",
          "responseCode": "00",
          "responseMessage": "Verification Successful"
        }
      }
    },
    {
      "id": "nid-verify-invalid",
      "name": "NID Verification - Invalid NID",
      "request": {
        "method": "POST",
        "urlPath": "/nid/v1/verify",
        "bodyPatterns": [
          {
            "matchesJsonPath": "$.nidNumber",
            "equalToJson": "{\"nidNumber\": \"1111111111111\"}"
          }
        ]
      },
      "response": {
        "status": 400,
        "headers": {
          "Content-Type": "application/json"
        },
        "jsonBody": {
          "verificationId": "NID-{{randomValue type='UUID'}}",
          "nidNumber": "1111111111111",
          "verified": false,
          "citizenInfo": null,
          "responseCode": "E01",
          "responseMessage": "Invalid NID number format"
        }
      }
    }
  ]
}
```

---

## 9. Test Reporting

### 9.1 Allure Configuration

Create `allure.properties`:

```properties
allure.results.directory=target/allure-results
allure.link.issue.pattern=https://jira.ulms.local/browse/{}
allure.link.tms.pattern=https://testrail.ulms.local/index.php?/cases/view/{}
allure.report.remove.attachments=.*png
```

### 9.2 Test Report Generation Script

```bash
#!/bin/bash
# generate-test-report.sh

REPORT_DIR="test-reports/$(date +%Y%m%d_%H%M%S)"
mkdir -p $REPORT_DIR

# Collect all test results
cp -r target/surefire-reports $REPORT_DIR/unit-tests/
cp -r target/failsafe-reports $REPORT_DIR/integration-tests/
cp -r target/site/jacoco $REPORT_DIR/coverage/

# Generate Allure report
allure generate target/allure-results -o $REPORT_DIR/allure-report

# Copy Cypress reports
cp -r cypress/reports $REPORT_DIR/e2e-tests/

# Copy Newman reports
cp newman-report.html $REPORT_DIR/api-tests/

# Copy performance results
cp performance-results.json $REPORT_DIR/performance/

# Generate summary
cat > $REPORT_DIR/summary.md << EOF
# ULMS Test Execution Summary
**Date:** $(date)
**Build:** ${BUILD_NUMBER:-local}
**Branch:** ${BRANCH_NAME:-unknown}

## Test Results

| Test Type | Status | Reports |
|-----------|--------|---------|
| Unit Tests | [View](unit-tests/) | [Coverage](coverage/) |
| Integration Tests | [View](integration-tests/) | - |
| API Tests | [View](api-tests/) | - |
| E2E Tests | [View](e2e-tests/) | [Screenshots](e2e-tests/screenshots/) |
| Performance Tests | - | [Results](performance/) |

## Allure Report
[View Full Report](allure-report/index.html)
EOF

echo "Report generated: $REPORT_DIR"
```

---

## 10. Troubleshooting

### 10.1 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| TestContainers timeout | Docker not running | Start Docker daemon |
| Port conflicts | Services already running | Stop existing services or change ports |
| Database connection failed | PostgreSQL not ready | Increase wait time or check logs |
| Selenium Grid connection error | Grid not running | Verify docker-compose up for selenium |
| WireMock not responding | Mapping errors | Check mapping JSON syntax |

### 10.2 Diagnostic Commands

```bash
# Check container status
docker-compose -f docker-compose.test.yml ps

# View service logs
docker-compose -f docker-compose.test.yml logs -f [service-name]

# Test PostgreSQL connection
docker exec -it ulms-postgres-test psql -U ulms_test -d ulms_test -c "SELECT 1"

# Test Redis connection
docker exec -it ulms-redis-test redis-cli ping

# Test WireMock
curl http://localhost:8089/__admin/mappings

# Check Selenium Grid
curl http://localhost:4444/wd/hub/status
```

---

## 11. Appendix

### 11.1 Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Feb 8, 2026 | QA Lead | Initial document creation |

### 11.2 Related Documents

| Document | Description |
|----------|-------------|
| `[TEST]_WireMock_Configuration_v1.0.md` | WireMock setup details |
| `[TEST]_Test_Data_Management_Strategy_v1.0.md` | Test data management |
| `[MON]_Monitoring_Grafana_Setup_v1.0.md` | Monitoring setup |

---

**End of Document**

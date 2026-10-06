# 12. Supply Chain Security, Software Bill of Materials (SBOM) & License Contagion Audit

**Classification:** CONFIDENTIAL & PROPRIETARY — UNISOFT SYSTEMS LIMITED  
**Audit Standard:** NIST SP 800-218 (SSDF) • OpenSSF Scorecard • SPDX 3.0 • ISO/IEC 5230 (OpenChain)  
**Scope:** Monorepo Third-Party Dependencies, Transitive Supply Chain, and Copyleft Legal Due Diligence  

---

## 1. Executive Summary: Intellectual Property & Supply Chain Clearance

Enterprise banking software must ensure that no third-party libraries introduce **viral copyleft licenses (e.g. AGPL-3.0, GPL-3.0)** that could legally force the disclosure of proprietary banking intellectual property.


### Audit Verdict: ✅ **100% CLEAR OF VIRAL COPYLEFT CONTAGION**

- **Backend (`apps/api`):** 100% Permissive (Apache 2.0, MIT, BSD) with one LGPL library (`OpenHTMLtoPDF`) utilized purely as a dynamically linked runtime server utility with zero client distribution.

- **Frontend (`apps/web`):** 100% MIT / Apache 2.0.

- **Mobile (`apps/mobile`):** 100% MIT / Apache 2.0.

- **Workflow Engine License Risk Averted:** Camunda 8.3 was completely eliminated from the codebase, removing proprietary Camunda Zeebe licensing liabilities in favor of an in-house database-backed workflow state machine.


---

## 2. Backend Software Bill of Materials (SBOM) & License Analysis

| Dependency Coordinate | Declared Version | Primary License | Risk Assessment | Purpose in ULMS |
| :--- | :---: | :---: | :---: | :--- |
| `org.springframework.boot:spring-boot-starter-web` | 4.0.0 | Apache 2.0 | **SAFE** | Core HTTP & REST controller engine |
| `org.springframework.boot:spring-boot-starter-security` | 4.0.0 | Apache 2.0 | **SAFE** | OAuth2 Resource Server & JWT validation |
| `org.springframework.boot:spring-boot-starter-data-jpa` | 4.0.0 | Apache 2.0 | **SAFE** | Hibernate 6 ORM persistence |
| `org.springframework.modulith:spring-modulith-starter-core` | 1.4.0 | Apache 2.0 | **SAFE** | Modular monolith boundary enforcement |
| `org.flywaydb:flyway-core` | Latest (BOM) | Apache 2.0 | **SAFE** | Relational schema versioning |
| `org.postgresql:postgresql` | Latest (BOM) | BSD-2-Clause | **SAFE** | JDBC driver for PostgreSQL 17 |
| `io.github.resilience4j:resilience4j-spring-boot3` | 2.2.0 | Apache 2.0 | **SAFE** | Circuit breaker & retry matrix for CIB |
| `com.github.ben-manes.caffeine:caffeine` | 3.1.8 | Apache 2.0 | **SAFE** | High-performance in-memory caching |
| `org.bouncycastle:bcpg-jdk18on` | 1.78.1 | Bouncy Castle (MIT) | **SAFE** | Bangladesh Bank SFTP OpenPGP encryption |
| `software.amazon.awssdk:s3` | 2.31.0 | Apache 2.0 | **SAFE** | SeaweedFS / MinIO S3 document storage |
| `com.openhtmltopdf:openhtmltopdf-pdfbox` | 1.0.10 | LGPL 2.1 | **LOW / COMPLIANT** | Server-side PDF generation (tax/sanction) |
| `org.testcontainers:postgresql` | 1.21.3 | MIT | **SAFE (Test-only)** | Integration testing with real PostgreSQL |

---

## 3. Frontend & Mobile SBOM & License Analysis

| Package Name | Version | License | Ecosystem | Assessment |
| :--- | :---: | :---: | :---: | :---: |
| `react` / `react-dom` | 19.1.0 | MIT | Web / Mobile | **SAFE** |
| `@mui/material` / `@mui/icons-material` | 7.0.0 / 7.3.11 | MIT | Web | **SAFE** |
| `react-router-dom` | 7.6.0 | MIT | Web | **SAFE** |
| `zod` | 4.6.5 | MIT | Web | **SAFE** |
| `vite` | 7.0.0 | MIT | Build Tool | **SAFE** |
| `typescript` | 5.8.0 | Apache 2.0 | Language Tool | **SAFE** |
| `expo` | 54.0.0 | MIT | Mobile | **SAFE** |
| `react-native` | 0.81.0 | MIT | Mobile | **SAFE** |
| `@react-native-async-storage` | 2.2.0 | MIT | Mobile | **SAFE** |

---

## 4. Camunda 8 vs In-House State Machine Forensic Due Diligence

- **Historical Context:** Initial RFP and BRD v1.0 references proposed Camunda 8.3.

- **Licensing Conflict:** Camunda 8 utilizes the Zeebe Community License, which restricts commercial cloud service hosting and demands commercial seat licensing for enterprise scale.

- **ULMS Remediation:** The monorepo architecture implemented an internal, database-persisted workflow engine in `com.uslbd.ulms.platform.workflow` backed by `ulms.workflow_definition`, `ulms.workflow_instance`, `ulms.workflow_task`, and `ulms.workflow_transition`.

- **Audit Finding:** This design decision eliminated recurring third-party licensing fees without compromising the 7-tier Maker-Checker approval and delegation of authority ladder.

# Bangladesh Bank SFTP Integration
## Regulatory Report Submission via Secure File Transfer
### Unisoft Loan Management System (ULMS) v2.0

---

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | ULMS-ARCH-1.5.6 |
| **Document Title** | Bangladesh Bank SFTP Integration (Regulatory Reports) |
| **Project Name** | Unisoft Loan Management System (ULMS) v2.0 |
| **Document Version** | 1.0 |
| **Date** | February 5, 2026 |
| **Prepared By** | Lead Developer |
| **Reviewed By** | Technical Architect, Compliance Officer |
| **Classification** | Confidential - Internal Use |
| **Status** | Approved for Implementation |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-02-05 | Lead Dev | Initial Bangladesh Bank SFTP Integration Design |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Bangladesh Bank Reporting Requirements](#2-bangladesh-bank-reporting-requirements)
3. [SFTP Architecture](#3-sftp-architecture)
4. [Apache Camel SFTP Routes](#4-apache-camel-sftp-routes)
5. [Report File Formats](#5-report-file-formats)
6. [CIB Batch File Processing](#6-cib-batch-file-processing)
7. [CL Reports Generation](#7-cl-reports-generation)
8. [Basel III Reports](#8-basel-iii-reports)
9. [Report Generation Service](#9-report-generation-service)
10. [File Encryption & Signing](#10-file-encryption--signing)
11. [Transfer Scheduling](#11-transfer-scheduling)
12. [Error Handling & Retry](#12-error-handling--retry)
13. [Audit Trail](#13-audit-trail)
14. [Monitoring & Alerting](#14-monitoring--alerting)
15. [Data Model](#15-data-model)
16. [Implementation Guide](#16-implementation-guide)
17. [Appendices](#17-appendices)

---

## 1. Executive Summary

### 1.1 Purpose

This document defines the comprehensive integration design for secure file transfer of regulatory reports to Bangladesh Bank via SFTP. The integration supports automated generation and submission of CIB batch files, CL-1 to CL-5 reports, and Basel III compliance reports.

### 1.2 Integration Objectives

| Objective | Target | Measurement |
|-----------|--------|-------------|
| **Report Accuracy** | 100% | Validation pass rate |
| **On-Time Submission** | 100% | Meeting BB deadlines |
| **Transfer Success Rate** | > 99.9% | Successful transfers |
| **File Integrity** | 100% | Checksum verification |
| **Audit Compliance** | 100% | Complete audit trail |

### 1.3 Integration Scope

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BANGLADESH BANK SFTP INTEGRATION SCOPE                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        IN SCOPE                                      │   │
│   ├─────────────────────────────────────────────────────────────────────┤   │
│   │  • CIB monthly batch file generation and submission                 │   │
│   │  • CL-1 to CL-5 regulatory reports                                  │   │
│   │  • BRPD 15/2024 compliance reports                                  │   │
│   │  • Basel III quarterly reports                                      │   │
│   │  • Secure SFTP transfer to Bangladesh Bank                          │   │
│   │  • File encryption (PGP/GPG if required)                            │   │
│   │  • Transfer acknowledgment processing                               │   │
│   │  • Comprehensive audit trail                                         │   │
│   │  • Report archival (7-year retention)                               │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                       OUT OF SCOPE                                   │   │
│   ├─────────────────────────────────────────────────────────────────────┤   │
│   │  • Real-time CIB API integration (covered in Doc 1.5.2)             │   │
│   │  • BB correspondence management                                      │   │
│   │  • Manual report submission process                                  │   │
│   │  • BB circular management system                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.4 Report Summary

| Report ID | Report Name | Frequency | Deadline | Format |
|-----------|-------------|-----------|----------|--------|
| **CIB-BATCH** | CIB Monthly Batch | Monthly | 1st of month | Fixed-width |
| **CL-1** | Classified Loan Statement | Monthly | 10th of month | Excel/CSV |
| **CL-2** | Provisioning Statement | Monthly | 10th of month | Excel/CSV |
| **CL-3** | Recovery Position | Monthly | 10th of month | Excel/CSV |
| **CL-4** | Write-off Details | Monthly | 10th of month | Excel/CSV |
| **CL-5** | Restructured Loans | Monthly | 10th of month | Excel/CSV |
| **BASEL-III** | Risk-Weighted Assets | Quarterly | End of quarter | XML |

---

## 2. Bangladesh Bank Reporting Requirements

### 2.1 Regulatory Framework

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BANGLADESH BANK REGULATORY HIERARCHY                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      BANGLADESH BANK                                 │   │
│   │               (Central Bank of Bangladesh)                           │   │
│   │                                                                       │   │
│   │   ┌─────────────────────────────────────────────────────────────┐   │   │
│   │   │                   KEY DEPARTMENTS                            │   │   │
│   │   │                                                              │   │   │
│   │   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │   │   │
│   │   │  │    BRPD      │  │     CIB      │  │  Financial       │  │   │   │
│   │   │  │  (Banking    │  │   (Credit    │  │  Stability       │  │   │   │
│   │   │  │  Regulation) │  │ Information) │  │  Department      │  │   │   │
│   │   │  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │   │   │
│   │   │         │                 │                   │             │   │   │
│   │   └─────────│─────────────────│───────────────────│─────────────┘   │   │
│   │             │                 │                   │                 │   │
│   └─────────────│─────────────────│───────────────────│─────────────────┘   │
│                 │                 │                   │                     │
│                 ▼                 ▼                   ▼                     │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      REPORTING REQUIREMENTS                          │   │
│   │                                                                       │   │
│   │  BRPD Reports              CIB Reports           Basel Reports       │   │
│   │  ├── CL-1 Statement        ├── Monthly Batch     ├── RWA Report     │   │
│   │  ├── CL-2 Provision        ├── Subject File      ├── CAR Report     │   │
│   │  ├── CL-3 Recovery         └── Contract File     ├── LCR Report     │   │
│   │  ├── CL-4 Write-off                              └── NSFR Report    │   │
│   │  └── CL-5 Restructure                                               │   │
│   │                                                                       │   │
│   └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 BRPD 15/2024 Classification Requirements

| Classification | DPD Range | Provision Rate | Report Inclusion |
|----------------|-----------|----------------|------------------|
| **STD (Standard)** | 0-60 | 1% | Not in CL reports |
| **SMA (Special Mention)** | 61-90 | 5% | CL-1 |
| **SS (Substandard)** | 91-180 | 20% | CL-1, CL-2 |
| **DF (Doubtful)** | 181-360 | 50% | CL-1, CL-2 |
| **B/L (Bad/Loss)** | >360 | 100% | CL-1, CL-2 |

### 2.3 Reporting Calendar

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MONTHLY REPORTING CALENDAR                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Day 1                                                                     │
│   └── CIB Monthly Batch File Due                                            │
│       • Subject Records (all borrowers)                                     │
│       • Contract Records (all loan facilities)                              │
│                                                                              │
│   Day 5                                                                     │
│   └── Internal Classification Run                                           │
│       • Calculate DPD for all loans                                         │
│       • Assign classification per BRPD 15/2024                              │
│       • Calculate provisions                                                │
│                                                                              │
│   Day 7                                                                     │
│   └── Report Generation                                                     │
│       • Generate CL-1 through CL-5 reports                                  │
│       • Internal review and validation                                       │
│                                                                              │
│   Day 10                                                                    │
│   └── CL Reports Due                                                        │
│       • Submit CL-1 to CL-5 via SFTP                                        │
│       • Receive acknowledgment from BB                                      │
│                                                                              │
│   Quarterly (End of Quarter + 15 days)                                      │
│   └── Basel III Reports Due                                                 │
│       • Risk-Weighted Assets (RWA)                                          │
│       • Capital Adequacy Ratio (CAR)                                        │
│       • Liquidity Coverage Ratio (LCR)                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. SFTP Architecture

### 3.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SFTP INTEGRATION ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      ULMS APPLICATION LAYER                          │   │
│   │                                                                       │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │   │
│   │   │    BRPD      │  │     CIB      │  │     Reporting            │  │   │
│   │   │   Service    │  │   Service    │  │     Service              │  │   │
│   │   │  (Port 8085) │  │  (Port 8081) │  │   (Port 8086)            │  │   │
│   │   └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘  │   │
│   │          │                 │                       │                │   │
│   └──────────│─────────────────│───────────────────────│────────────────┘   │
│              │                 │                       │                     │
│              ▼                 ▼                       ▼                     │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                  REPORT GENERATION ENGINE                            │   │
│   │                                                                       │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │   │
│   │   │   Jasper     │  │    Apache    │  │    Excel/CSV             │  │   │
│   │   │   Reports    │  │    POI       │  │    Generator             │  │   │
│   │   └──────────────┘  └──────────────┘  └──────────────────────────┘  │   │
│   │                                                                       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                  FILE PROCESSING LAYER                               │   │
│   │                                                                       │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │   │
│   │   │    File      │  │     PGP      │  │    Checksum              │  │   │
│   │   │  Validator   │  │  Encryption  │  │    Generator             │  │   │
│   │   └──────────────┘  └──────────────┘  └──────────────────────────┘  │   │
│   │                                                                       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │               INTEGRATION GATEWAY (Apache Camel 4.3)                 │   │
│   │                                                                       │   │
│   │   ┌──────────────────────────────────────────────────────────────┐   │   │
│   │   │                    SFTP ROUTES                                │   │   │
│   │   │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │   │   │
│   │   │  │ cib-batch      │  │ cl-reports     │  │ basel-reports  │  │   │   │
│   │   │  │ -upload        │  │ -upload        │  │ -upload        │  │   │   │
│   │   │  └────────────────┘  └────────────────┘  └────────────────┘  │   │   │
│   │   │  ┌────────────────┐  ┌────────────────┐                      │   │   │
│   │   │  │ ack-download   │  │ error-handler  │                      │   │   │
│   │   │  └────────────────┘  └────────────────┘                      │   │   │
│   │   └──────────────────────────────────────────────────────────────┘   │   │
│   │                               │                                       │   │
│   └───────────────────────────────│───────────────────────────────────────┘   │
│                                   │                                          │
│                          SFTP Protocol (SSH)                                │
│                            VPN/IPSec Tunnel                                 │
│                                   │                                          │
│   ┌───────────────────────────────▼───────────────────────────────────────┐   │
│   │                    BANGLADESH BANK                                    │   │
│   │                                                                       │   │
│   │   ┌──────────────────────┐     ┌───────────────────────────────────┐ │   │
│   │   │     SFTP Server      │     │       Processing System           │ │   │
│   │   │                      │     │                                   │ │   │
│   │   │  /upload/cib/        │────▶│  CIB Processing                   │ │   │
│   │   │  /upload/brpd/       │────▶│  BRPD Processing                  │ │   │
│   │   │  /upload/basel/      │────▶│  Basel Processing                 │ │   │
│   │   │  /download/ack/      │◀────│  Acknowledgments                  │ │   │
│   │   │                      │     │                                   │ │   │
│   │   └──────────────────────┘     └───────────────────────────────────┘ │   │
│   │                                                                       │   │
│   └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 SFTP Connection Configuration

| Parameter | Value | Notes |
|-----------|-------|-------|
| **Host (CIB)** | sftp.bb.org.bd | CIB SFTP server |
| **Host (BRPD)** | brpd-sftp.bb.org.bd | BRPD reports |
| **Port** | 22 | Standard SFTP |
| **Protocol** | SFTP over SSH | Secure transfer |
| **Authentication** | SSH Key + Password | Dual authentication |
| **Encryption** | AES-256 | SSH encryption |
| **Connection Mode** | VPN required | IPSec tunnel |

### 3.3 Directory Structure at Bangladesh Bank

```
/home/bankcode/
├── upload/
│   ├── cib/
│   │   ├── incoming/         # Upload CIB batch files here
│   │   └── processed/        # Processed files moved here
│   ├── brpd/
│   │   ├── incoming/         # Upload CL reports here
│   │   └── processed/
│   └── basel/
│       ├── incoming/         # Upload Basel reports
│       └── processed/
├── download/
│   ├── ack/                  # Acknowledgment files
│   └── error/                # Error reports
└── archive/
    └── YYYY/MM/              # Archived files
```

### 3.4 Service Specification

| Parameter | Value | Notes |
|-----------|-------|-------|
| **Service Name** | sftp-integration-service | Part of integration-gateway |
| **Port** | 8088 | Shared with integration gateway |
| **Scheduler** | Quartz | Job scheduling |
| **File Storage** | MinIO | Report staging |
| **Archive** | MinIO + PostgreSQL | 7-year retention |

---

## 4. Apache Camel SFTP Routes

### 4.1 CIB Batch Upload Route

```java
// CibBatchUploadRoute.java
@Component
public class CibBatchUploadRoute extends RouteBuilder {

    @Override
    public void configure() throws Exception {

        // Error Handler
        errorHandler(deadLetterChannel("kafka:dlq.sftp.cib.failed")
            .maximumRedeliveries(3)
            .redeliveryDelay(300000)  // 5 minutes
            .onRedelivery(exchange -> {
                log.warn("CIB upload retry attempt: {}",
                    exchange.getIn().getHeader(Exchange.REDELIVERY_COUNTER));
            }));

        // CIB Batch File Upload Route
        from("quartz://cib-batch-upload?cron=0+0+23+1+*+?")  // 1st of month, 11 PM
            .routeId("cib-batch-upload-route")
            .description("Monthly CIB batch file upload to Bangladesh Bank")

            .log(LoggingLevel.INFO, "Starting CIB batch file upload")

            // Generate CIB batch files
            .to("direct:generate-cib-batch")

            // Validate generated files
            .to("direct:validate-cib-files")

            // Calculate checksums
            .process("checksumCalculator")

            // Encrypt if required
            .choice()
                .when(simple("{{sftp.cib.encryption.enabled}}"))
                    .to("direct:pgp-encrypt")
            .end()

            // Upload via SFTP
            .to("sftp://{{sftp.cib.host}}:{{sftp.cib.port}}/upload/cib/incoming" +
                "?username={{sftp.cib.username}}" +
                "&privateKeyFile={{sftp.cib.private-key}}" +
                "&privateKeyPassphrase={{vault:secret/data/ulms/sftp#cib-key-pass}}" +
                "&knownHostsFile={{sftp.cib.known-hosts}}" +
                "&strictHostKeyChecking=yes" +
                "&connectTimeout=30000" +
                "&timeout=60000" +
                "&disconnect=true")

            // Log upload success
            .process("cibUploadAuditLogger")

            // Emit success event
            .to("kafka:ulms.sftp.cib.uploaded")

            .log(LoggingLevel.INFO, "CIB batch file upload completed");

        // CIB Batch Generation
        from("direct:generate-cib-batch")
            .routeId("cib-batch-generation-route")
            .log(LoggingLevel.INFO, "Generating CIB batch files")

            // Generate Subject file
            .to("bean:cibBatchGenerator?method=generateSubjectFile")
            .setHeader("CibSubjectFile", body())

            // Generate Contract file
            .to("bean:cibBatchGenerator?method=generateContractFile")
            .setHeader("CibContractFile", body())

            // Create batch package
            .process("cibBatchPackager");

        // CIB File Validation
        from("direct:validate-cib-files")
            .routeId("cib-validation-route")
            .log(LoggingLevel.INFO, "Validating CIB batch files")

            .to("bean:cibFileValidator?method=validateSubjectFile")
            .choice()
                .when(simple("${body.hasErrors}"))
                    .log(LoggingLevel.ERROR, "CIB Subject file validation failed")
                    .to("direct:handle-validation-error")
                    .stop()
            .end()

            .to("bean:cibFileValidator?method=validateContractFile")
            .choice()
                .when(simple("${body.hasErrors}"))
                    .log(LoggingLevel.ERROR, "CIB Contract file validation failed")
                    .to("direct:handle-validation-error")
                    .stop()
            .end();
    }
}
```

### 4.2 CL Reports Upload Route

```java
// ClReportsUploadRoute.java
@Component
public class ClReportsUploadRoute extends RouteBuilder {

    @Override
    public void configure() throws Exception {

        // CL Reports Upload Route (Monthly, 10th)
        from("quartz://cl-reports-upload?cron=0+0+22+10+*+?")  // 10th of month, 10 PM
            .routeId("cl-reports-upload-route")
            .description("Monthly CL-1 to CL-5 reports upload")

            .log(LoggingLevel.INFO, "Starting CL reports upload")

            // Generate all CL reports
            .multicast()
                .parallelProcessing()
                .to("direct:generate-cl1-report",
                    "direct:generate-cl2-report",
                    "direct:generate-cl3-report",
                    "direct:generate-cl4-report",
                    "direct:generate-cl5-report")
            .end()

            // Package reports
            .process("clReportPackager")

            // Validate all reports
            .to("direct:validate-cl-reports")

            // Upload via SFTP
            .split(body())
                .to("sftp://{{sftp.brpd.host}}:{{sftp.brpd.port}}/upload/brpd/incoming" +
                    "?username={{sftp.brpd.username}}" +
                    "&privateKeyFile={{sftp.brpd.private-key}}" +
                    "&privateKeyPassphrase={{vault:secret/data/ulms/sftp#brpd-key-pass}}" +
                    "&knownHostsFile={{sftp.brpd.known-hosts}}")
            .end()

            // Log audit trail
            .process("clUploadAuditLogger")

            .to("kafka:ulms.sftp.cl.uploaded");

        // Individual CL Report Generation Routes
        from("direct:generate-cl1-report")
            .routeId("cl1-generation-route")
            .to("bean:clReportGenerator?method=generateCl1Report");

        from("direct:generate-cl2-report")
            .routeId("cl2-generation-route")
            .to("bean:clReportGenerator?method=generateCl2Report");

        from("direct:generate-cl3-report")
            .routeId("cl3-generation-route")
            .to("bean:clReportGenerator?method=generateCl3Report");

        from("direct:generate-cl4-report")
            .routeId("cl4-generation-route")
            .to("bean:clReportGenerator?method=generateCl4Report");

        from("direct:generate-cl5-report")
            .routeId("cl5-generation-route")
            .to("bean:clReportGenerator?method=generateCl5Report");
    }
}
```

### 4.3 Acknowledgment Download Route

```java
// AcknowledgmentDownloadRoute.java
@Component
public class AcknowledgmentDownloadRoute extends RouteBuilder {

    @Override
    public void configure() throws Exception {

        // Poll for acknowledgment files
        from("sftp://{{sftp.cib.host}}:{{sftp.cib.port}}/download/ack" +
             "?username={{sftp.cib.username}}" +
             "&privateKeyFile={{sftp.cib.private-key}}" +
             "&privateKeyPassphrase={{vault:secret/data/ulms/sftp#cib-key-pass}}" +
             "&knownHostsFile={{sftp.cib.known-hosts}}" +
             "&delay=3600000" +  // Poll every hour
             "&delete=false" +
             "&move=.processed" +
             "&filter=#ackFileFilter")
            .routeId("ack-download-route")
            .description("Download acknowledgment files from BB")

            .log(LoggingLevel.INFO, "Processing acknowledgment file: ${file:name}")

            // Parse acknowledgment
            .process("acknowledgmentParser")

            // Update submission status
            .to("bean:submissionStatusService?method=updateStatus")

            // Store acknowledgment
            .to("jpa:SftpAcknowledgment")

            // Emit event
            .to("kafka:ulms.sftp.ack.received");

        // Poll for error files
        from("sftp://{{sftp.cib.host}}:{{sftp.cib.port}}/download/error" +
             "?username={{sftp.cib.username}}" +
             "&privateKeyFile={{sftp.cib.private-key}}" +
             "&privateKeyPassphrase={{vault:secret/data/ulms/sftp#cib-key-pass}}" +
             "&delay=3600000" +
             "&move=.processed")
            .routeId("error-download-route")

            .log(LoggingLevel.ERROR, "Error file received from BB: ${file:name}")

            // Parse error report
            .process("errorReportParser")

            // Alert operations team
            .to("direct:alert-bb-error")

            .to("kafka:ulms.sftp.error.received");
    }
}
```

---

## 5. Report File Formats

### 5.1 CIB Subject Record Format (500 bytes, Fixed-Width)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CIB SUBJECT RECORD FORMAT                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Position  Length  Field Name           Description                        │
│   ─────────────────────────────────────────────────────────────────────     │
│   001-003   3       Record Type          "SUB" for Subject                   │
│   004-020   17      Subject ID           CIF or Customer ID                  │
│   021-070   50      Subject Name         Customer name (uppercase)           │
│   071-083   13      NID                  National ID number                  │
│   084-093   10      Date of Birth        YYYY-MM-DD                          │
│   094-094   1       Gender               M/F                                 │
│   095-194   100     Present Address      Full address                        │
│   195-294   100     Permanent Address    Full address                        │
│   295-309   15      Mobile Number        11-digit mobile                     │
│   310-359   50      Business Name        For business borrowers              │
│   360-362   3       District Code        BB district code                    │
│   363-363   1       Subject Type         I=Individual, C=Corporate           │
│   364-376   13      TIN                  Tax ID number                       │
│   377-396   20      Sector Code          Economic sector                     │
│   397-496   100     Filler               Spaces                              │
│   497-500   4       Checksum             CRC-32 checksum                     │
│                                                                              │
│   Total Record Length: 500 bytes                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 CIB Contract Record Format (600 bytes, Fixed-Width)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CIB CONTRACT RECORD FORMAT                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Position  Length  Field Name           Description                        │
│   ─────────────────────────────────────────────────────────────────────     │
│   001-003   3       Record Type          "CON" for Contract                  │
│   004-020   17      Subject ID           Links to Subject record             │
│   021-040   20      Contract ID          Loan account number                 │
│   041-060   20      Facility Type        BB facility type code               │
│   061-075   15      Sanctioned Amount    Right-justified, zero-filled        │
│   076-090   15      Outstanding Amount   Current outstanding                 │
│   091-105   15      Overdue Amount       Overdue principal                   │
│   106-115   10      Sanction Date        YYYY-MM-DD                          │
│   116-125   10      Expiry Date          YYYY-MM-DD                          │
│   126-128   3       Interest Rate        Format: XX.X (e.g., 125 = 12.5%)   │
│   129-129   1       Classification       0-6 (0=STD, 6=B/L)                  │
│   130-139   10      Classification Date  YYYY-MM-DD                          │
│   140-154   15      Provision Amount     Required provision                  │
│   155-164   10      Last Payment Date    YYYY-MM-DD                          │
│   165-179   15      Last Payment Amount  Last payment received               │
│   180-182   3       Days Past Due        000-999                             │
│   183-192   10      Write-off Date       If written off                      │
│   193-207   15      Write-off Amount     Written-off amount                  │
│   208-209   2       Collateral Type      BB collateral code                  │
│   210-224   15      Collateral Value     Collateral amount                   │
│   225-229   5       Branch Code          Reporting branch                    │
│   230-596   367     Filler               Spaces                              │
│   597-600   4       Checksum             CRC-32 checksum                     │
│                                                                              │
│   Total Record Length: 600 bytes                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 CL-1 Report Format (Excel)

| Column | Field | Description | Format |
|--------|-------|-------------|--------|
| A | Sl No | Serial number | Number |
| B | Branch Code | Reporting branch | Text |
| C | Branch Name | Branch name | Text |
| D | Borrower Name | Customer name | Text |
| E | Loan Account No | Account number | Text |
| F | Facility Type | Loan type | Text |
| G | Sanctioned Amount | Approved limit | Currency |
| H | Outstanding | Current balance | Currency |
| I | Overdue | Past due amount | Currency |
| J | Classification | STD/SMA/SS/DF/BL | Text |
| K | DPD | Days past due | Number |
| L | Provision Required | Calculated provision | Currency |
| M | Provision Held | Actual provision | Currency |
| N | Shortfall | Difference | Currency |

---

## 6. CIB Batch File Processing

### 6.1 CIB Batch Generator

```java
// CibBatchGenerator.java
@Service
@Slf4j
public class CibBatchGenerator {

    private final LoanRepository loanRepository;
    private final CustomerRepository customerRepository;
    private final CibCodeMapper cibCodeMapper;

    private static final int SUBJECT_RECORD_LENGTH = 500;
    private static final int CONTRACT_RECORD_LENGTH = 600;

    /**
     * Generate CIB Subject file
     */
    public File generateSubjectFile(LocalDate reportDate) {
        log.info("Generating CIB Subject file for {}", reportDate);

        // Get all customers with active loans
        List<Customer> customers = customerRepository
            .findCustomersWithActiveLoans(reportDate);

        File subjectFile = createTempFile("CIB_SUBJECT_", ".dat");

        try (BufferedWriter writer = new BufferedWriter(
                new FileWriter(subjectFile))) {

            // Write header record
            writer.write(createHeaderRecord("SUB", reportDate, customers.size()));
            writer.newLine();

            // Write subject records
            for (Customer customer : customers) {
                String record = formatSubjectRecord(customer);
                writer.write(record);
                writer.newLine();
            }

            // Write trailer record
            writer.write(createTrailerRecord("SUB", customers.size()));

        } catch (IOException e) {
            throw new CibFileGenerationException(
                "Failed to generate Subject file", e);
        }

        log.info("CIB Subject file generated: {} records", customers.size());
        return subjectFile;
    }

    /**
     * Generate CIB Contract file
     */
    public File generateContractFile(LocalDate reportDate) {
        log.info("Generating CIB Contract file for {}", reportDate);

        // Get all loan facilities
        List<Loan> loans = loanRepository
            .findActiveAndClassifiedLoans(reportDate);

        File contractFile = createTempFile("CIB_CONTRACT_", ".dat");

        try (BufferedWriter writer = new BufferedWriter(
                new FileWriter(contractFile))) {

            // Write header
            writer.write(createHeaderRecord("CON", reportDate, loans.size()));
            writer.newLine();

            // Write contract records
            for (Loan loan : loans) {
                String record = formatContractRecord(loan, reportDate);
                writer.write(record);
                writer.newLine();
            }

            // Write trailer
            writer.write(createTrailerRecord("CON", loans.size()));

        } catch (IOException e) {
            throw new CibFileGenerationException(
                "Failed to generate Contract file", e);
        }

        log.info("CIB Contract file generated: {} records", loans.size());
        return contractFile;
    }

    private String formatSubjectRecord(Customer customer) {
        StringBuilder record = new StringBuilder(SUBJECT_RECORD_LENGTH);

        // Record Type (1-3)
        record.append(padRight("SUB", 3));

        // Subject ID (4-20)
        record.append(padRight(customer.getCustomerCif(), 17));

        // Subject Name (21-70)
        record.append(padRight(customer.getFullname().toUpperCase(), 50));

        // NID (71-83)
        record.append(padRight(decryptNid(customer.getNidNumber()), 13));

        // Date of Birth (84-93)
        record.append(formatDate(customer.getDateOfBirth()));

        // Gender (94)
        record.append(customer.getGender().equals("MALE") ? "M" : "F");

        // Present Address (95-194)
        record.append(padRight(formatAddress(customer.getPresentAddress()), 100));

        // Permanent Address (195-294)
        record.append(padRight(formatAddress(customer.getPermanentAddress()), 100));

        // Mobile (295-309)
        record.append(padRight(customer.getMobilePrimary(), 15));

        // Business Name (310-359)
        record.append(padRight(customer.getBusinessName(), 50));

        // District Code (360-362)
        record.append(padRight(cibCodeMapper.getDistrictCode(
            customer.getDistrict()), 3));

        // Subject Type (363)
        record.append(customer.getCustomerCategory().equals("INDIVIDUAL") ? "I" : "C");

        // TIN (364-376)
        record.append(padRight(customer.getTin(), 13));

        // Sector Code (377-396)
        record.append(padRight(cibCodeMapper.getSectorCode(
            customer.getIndustrySector()), 20));

        // Filler (397-496)
        record.append(padRight("", 100));

        // Checksum (497-500) - calculated separately
        String checksum = calculateChecksum(record.toString());
        record.append(checksum);

        return record.toString();
    }

    private String formatContractRecord(Loan loan, LocalDate reportDate) {
        StringBuilder record = new StringBuilder(CONTRACT_RECORD_LENGTH);

        // Record Type (1-3)
        record.append(padRight("CON", 3));

        // Subject ID (4-20)
        record.append(padRight(loan.getCustomer().getCustomerCif(), 17));

        // Contract ID (21-40)
        record.append(padRight(loan.getLoanAccountNumber(), 20));

        // Facility Type (41-60)
        record.append(padRight(cibCodeMapper.getFacilityType(
            loan.getLoanProductId()), 20));

        // Sanctioned Amount (61-75)
        record.append(padLeft(formatAmount(loan.getApprovedAmount()), 15, '0'));

        // Outstanding Amount (76-90)
        record.append(padLeft(formatAmount(loan.getOutstandingBalance()), 15, '0'));

        // Overdue Amount (91-105)
        record.append(padLeft(formatAmount(loan.getOverdueAmount()), 15, '0'));

        // Sanction Date (106-115)
        record.append(formatDate(loan.getApprovalDate()));

        // Expiry Date (116-125)
        record.append(formatDate(loan.getMaturityDate()));

        // Interest Rate (126-128)
        record.append(formatRate(loan.getInterestRate()));

        // Classification (129)
        record.append(mapClassification(loan.getClassification()));

        // Classification Date (130-139)
        record.append(formatDate(loan.getClassificationDate()));

        // Provision Amount (140-154)
        record.append(padLeft(formatAmount(loan.getProvisionAmount()), 15, '0'));

        // Last Payment Date (155-164)
        record.append(formatDate(loan.getLastPaymentDate()));

        // Last Payment Amount (165-179)
        record.append(padLeft(formatAmount(loan.getLastPaymentAmount()), 15, '0'));

        // Days Past Due (180-182)
        record.append(padLeft(String.valueOf(loan.getDaysPastDue()), 3, '0'));

        // Write-off Date (183-192)
        record.append(formatDate(loan.getWriteOffDate()));

        // Write-off Amount (193-207)
        record.append(padLeft(formatAmount(loan.getWriteOffAmount()), 15, '0'));

        // Collateral Type (208-209)
        record.append(padRight(getCollateralType(loan), 2));

        // Collateral Value (210-224)
        record.append(padLeft(formatAmount(loan.getCollateralValue()), 15, '0'));

        // Branch Code (225-229)
        record.append(padRight(loan.getBranchCode(), 5));

        // Filler (230-596)
        record.append(padRight("", 367));

        // Checksum (597-600)
        String checksum = calculateChecksum(record.toString());
        record.append(checksum);

        return record.toString();
    }

    private String mapClassification(LoanClassification classification) {
        return switch (classification) {
            case STANDARD -> "0";
            case SMA -> "1";
            case SUBSTANDARD -> "2";
            case DOUBTFUL -> "3";
            case BAD_LOSS -> "4";
            default -> "0";
        };
    }

    private String calculateChecksum(String data) {
        CRC32 crc = new CRC32();
        crc.update(data.getBytes(StandardCharsets.UTF_8));
        return String.format("%04X", crc.getValue() & 0xFFFF);
    }

    private String padRight(String str, int length) {
        if (str == null) str = "";
        return String.format("%-" + length + "s", str).substring(0, length);
    }

    private String padLeft(String str, int length, char padChar) {
        if (str == null) str = "";
        StringBuilder sb = new StringBuilder();
        for (int i = str.length(); i < length; i++) {
            sb.append(padChar);
        }
        sb.append(str);
        return sb.substring(0, length);
    }

    private String formatDate(LocalDate date) {
        if (date == null) return "          ";  // 10 spaces
        return date.format(DateTimeFormatter.ISO_LOCAL_DATE);
    }

    private String formatAmount(BigDecimal amount) {
        if (amount == null) return "0";
        return amount.setScale(0, RoundingMode.HALF_UP).toPlainString();
    }
}
```

---

## 7. CL Reports Generation

### 7.1 CL Report Generator Service

```java
// ClReportGenerator.java
@Service
@Slf4j
public class ClReportGenerator {

    private final LoanRepository loanRepository;
    private final ProvisionService provisionService;

    /**
     * Generate CL-1: Classified Loan Statement
     */
    public File generateCl1Report(LocalDate reportDate) {
        log.info("Generating CL-1 report for {}", reportDate);

        // Get all classified loans (SMA and above)
        List<Loan> classifiedLoans = loanRepository
            .findByClassificationInAndReportDate(
                Arrays.asList(
                    LoanClassification.SMA,
                    LoanClassification.SUBSTANDARD,
                    LoanClassification.DOUBTFUL,
                    LoanClassification.BAD_LOSS),
                reportDate);

        // Group by branch and classification
        Map<String, List<Loan>> byBranch = classifiedLoans.stream()
            .collect(Collectors.groupingBy(Loan::getBranchCode));

        // Create workbook
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("CL-1 Statement");

        // Create header
        createCl1Header(sheet);

        // Populate data
        int rowNum = 1;
        for (Loan loan : classifiedLoans) {
            Row row = sheet.createRow(rowNum++);
            populateCl1Row(row, loan, rowNum - 1);
        }

        // Add summary section
        addCl1Summary(sheet, rowNum, classifiedLoans);

        // Write to file
        File reportFile = createTempFile("CL1_", ".xlsx");
        try (FileOutputStream fos = new FileOutputStream(reportFile)) {
            workbook.write(fos);
        } catch (IOException e) {
            throw new ReportGenerationException("Failed to write CL-1 report", e);
        }

        log.info("CL-1 report generated: {} classified loans", classifiedLoans.size());
        return reportFile;
    }

    /**
     * Generate CL-2: Provisioning Statement
     */
    public File generateCl2Report(LocalDate reportDate) {
        log.info("Generating CL-2 report for {}", reportDate);

        // Get loans requiring provision
        List<Loan> loansWithProvision = loanRepository
            .findLoansRequiringProvision(reportDate);

        // Calculate provision details
        List<ProvisionDetail> provisionDetails = loansWithProvision.stream()
            .map(loan -> provisionService.calculateProvision(loan, reportDate))
            .collect(Collectors.toList());

        // Create Excel report
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("CL-2 Provisioning");

        createCl2Header(sheet);

        int rowNum = 1;
        for (ProvisionDetail detail : provisionDetails) {
            Row row = sheet.createRow(rowNum++);
            populateCl2Row(row, detail, rowNum - 1);
        }

        // Add totals
        addCl2Summary(sheet, rowNum, provisionDetails);

        File reportFile = createTempFile("CL2_", ".xlsx");
        writeWorkbook(workbook, reportFile);

        return reportFile;
    }

    /**
     * Generate CL-3: Recovery Position
     */
    public File generateCl3Report(LocalDate reportDate) {
        log.info("Generating CL-3 report for {}", reportDate);

        // Get recovery data for the month
        LocalDate monthStart = reportDate.withDayOfMonth(1);
        LocalDate monthEnd = reportDate;

        List<LoanRecovery> recoveries = recoveryRepository
            .findByRecoveryDateBetween(monthStart, monthEnd);

        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("CL-3 Recovery");

        createCl3Header(sheet);

        int rowNum = 1;
        for (LoanRecovery recovery : recoveries) {
            Row row = sheet.createRow(rowNum++);
            populateCl3Row(row, recovery, rowNum - 1);
        }

        File reportFile = createTempFile("CL3_", ".xlsx");
        writeWorkbook(workbook, reportFile);

        return reportFile;
    }

    /**
     * Generate CL-4: Write-off Details
     */
    public File generateCl4Report(LocalDate reportDate) {
        log.info("Generating CL-4 report for {}", reportDate);

        // Get write-offs for the reporting period
        List<Loan> writtenOffLoans = loanRepository
            .findByStatusAndWriteOffDateBetween(
                LoanStatus.WRITTEN_OFF,
                reportDate.withDayOfMonth(1),
                reportDate);

        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("CL-4 Write-off");

        createCl4Header(sheet);

        int rowNum = 1;
        for (Loan loan : writtenOffLoans) {
            Row row = sheet.createRow(rowNum++);
            populateCl4Row(row, loan, rowNum - 1);
        }

        File reportFile = createTempFile("CL4_", ".xlsx");
        writeWorkbook(workbook, reportFile);

        return reportFile;
    }

    /**
     * Generate CL-5: Restructured Loans
     */
    public File generateCl5Report(LocalDate reportDate) {
        log.info("Generating CL-5 report for {}", reportDate);

        // Get restructured loans
        List<Loan> restructuredLoans = loanRepository
            .findByRestructuredTrue();

        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("CL-5 Restructured");

        createCl5Header(sheet);

        int rowNum = 1;
        for (Loan loan : restructuredLoans) {
            Row row = sheet.createRow(rowNum++);
            populateCl5Row(row, loan, rowNum - 1);
        }

        File reportFile = createTempFile("CL5_", ".xlsx");
        writeWorkbook(workbook, reportFile);

        return reportFile;
    }

    private void createCl1Header(Sheet sheet) {
        Row headerRow = sheet.createRow(0);
        String[] headers = {
            "Sl No", "Branch Code", "Branch Name", "Borrower Name",
            "Loan A/C No", "Facility Type", "Sanctioned Amt",
            "Outstanding", "Overdue", "Classification", "DPD",
            "Provision Required", "Provision Held", "Shortfall"
        };

        CellStyle headerStyle = createHeaderStyle(sheet.getWorkbook());

        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }
    }

    private void populateCl1Row(Row row, Loan loan, int slNo) {
        row.createCell(0).setCellValue(slNo);
        row.createCell(1).setCellValue(loan.getBranchCode());
        row.createCell(2).setCellValue(loan.getBranchName());
        row.createCell(3).setCellValue(loan.getCustomer().getFullname());
        row.createCell(4).setCellValue(loan.getLoanAccountNumber());
        row.createCell(5).setCellValue(loan.getLoanProduct().getName());
        row.createCell(6).setCellValue(loan.getApprovedAmount().doubleValue());
        row.createCell(7).setCellValue(loan.getOutstandingBalance().doubleValue());
        row.createCell(8).setCellValue(loan.getOverdueAmount().doubleValue());
        row.createCell(9).setCellValue(loan.getClassification().name());
        row.createCell(10).setCellValue(loan.getDaysPastDue());
        row.createCell(11).setCellValue(loan.getProvisionRequired().doubleValue());
        row.createCell(12).setCellValue(loan.getProvisionHeld().doubleValue());
        row.createCell(13).setCellValue(
            loan.getProvisionRequired().subtract(loan.getProvisionHeld()).doubleValue());
    }
}
```

---

## 8. Basel III Reports

### 8.1 Basel III Report Generator

```java
// BaselReportGenerator.java
@Service
@Slf4j
public class BaselReportGenerator {

    /**
     * Generate Basel III Risk-Weighted Assets (RWA) Report
     */
    public File generateRwaReport(LocalDate reportDate) {
        log.info("Generating Basel III RWA report for quarter ending {}",
            reportDate);

        // Calculate RWA components
        RwaCalculation rwa = calculateRiskWeightedAssets(reportDate);

        // Generate XML report
        BaselRwaReport report = BaselRwaReport.builder()
            .reportDate(reportDate)
            .reportingEntity(getReportingEntityCode())
            .creditRwa(rwa.getCreditRwa())
            .marketRwa(rwa.getMarketRwa())
            .operationalRwa(rwa.getOperationalRwa())
            .totalRwa(rwa.getTotalRwa())
            .tier1Capital(rwa.getTier1Capital())
            .tier2Capital(rwa.getTier2Capital())
            .totalCapital(rwa.getTotalCapital())
            .capitalAdequacyRatio(rwa.getCapitalAdequacyRatio())
            .build();

        File reportFile = createTempFile("BASEL_RWA_", ".xml");

        try {
            JAXBContext context = JAXBContext.newInstance(BaselRwaReport.class);
            Marshaller marshaller = context.createMarshaller();
            marshaller.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, true);
            marshaller.marshal(report, reportFile);
        } catch (JAXBException e) {
            throw new ReportGenerationException(
                "Failed to generate Basel RWA XML", e);
        }

        return reportFile;
    }

    private RwaCalculation calculateRiskWeightedAssets(LocalDate reportDate) {
        // Credit RWA calculation
        BigDecimal creditRwa = calculateCreditRwa(reportDate);

        // Market RWA (simplified - actual calculation more complex)
        BigDecimal marketRwa = calculateMarketRwa(reportDate);

        // Operational RWA (Basic Indicator Approach)
        BigDecimal operationalRwa = calculateOperationalRwa(reportDate);

        BigDecimal totalRwa = creditRwa.add(marketRwa).add(operationalRwa);

        // Capital components
        BigDecimal tier1Capital = getTier1Capital();
        BigDecimal tier2Capital = getTier2Capital();
        BigDecimal totalCapital = tier1Capital.add(tier2Capital);

        // CAR calculation
        BigDecimal car = totalCapital.divide(totalRwa, 4, RoundingMode.HALF_UP)
            .multiply(new BigDecimal("100"));

        return RwaCalculation.builder()
            .creditRwa(creditRwa)
            .marketRwa(marketRwa)
            .operationalRwa(operationalRwa)
            .totalRwa(totalRwa)
            .tier1Capital(tier1Capital)
            .tier2Capital(tier2Capital)
            .totalCapital(totalCapital)
            .capitalAdequacyRatio(car)
            .build();
    }

    private BigDecimal calculateCreditRwa(LocalDate reportDate) {
        // Standardized Approach for Credit Risk
        List<Loan> loans = loanRepository.findAllActiveAsOf(reportDate);

        return loans.stream()
            .map(loan -> {
                // Risk weight based on loan type and collateral
                BigDecimal riskWeight = getRiskWeight(loan);
                return loan.getOutstandingBalance().multiply(riskWeight);
            })
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal getRiskWeight(Loan loan) {
        // Risk weights per Basel III guidelines for Bangladesh
        // Simplified - actual implementation more complex
        if (loan.isFullySecured()) {
            return new BigDecimal("0.50");  // 50% for secured loans
        } else if (loan.getLoanProduct().isRetail()) {
            return new BigDecimal("0.75");  // 75% for retail
        } else {
            return new BigDecimal("1.00");  // 100% for others
        }
    }
}
```

---

## 9. Report Generation Service

### 9.1 BRPD Reporting Service

```java
// BrpdReportingService.java
@Service
@Slf4j
public class BrpdReportingService {

    private final CibBatchGenerator cibBatchGenerator;
    private final ClReportGenerator clReportGenerator;
    private final BaselReportGenerator baselReportGenerator;
    private final SftpTransferService sftpTransferService;
    private final ReportArchiveService archiveService;
    private final ReportSubmissionRepository submissionRepository;

    /**
     * Generate and submit all monthly reports
     */
    @Transactional
    public ReportSubmissionResult submitMonthlyReports(LocalDate reportMonth) {
        log.info("Starting monthly report submission for {}", reportMonth);

        ReportSubmission submission = ReportSubmission.builder()
            .reportMonth(reportMonth)
            .submissionType("MONTHLY")
            .status("IN_PROGRESS")
            .startedAt(LocalDateTime.now())
            .build();

        submission = submissionRepository.save(submission);

        try {
            // Generate CIB batch files
            List<File> cibFiles = generateCibBatch(reportMonth);
            submission.setCibFilesGenerated(true);

            // Upload CIB files
            SftpUploadResult cibResult = sftpTransferService
                .uploadCibFiles(cibFiles);
            submission.setCibUploadStatus(cibResult.getStatus());

            // Generate CL reports
            List<File> clFiles = generateClReports(reportMonth);
            submission.setClReportsGenerated(true);

            // Upload CL reports
            SftpUploadResult clResult = sftpTransferService
                .uploadClReports(clFiles);
            submission.setClUploadStatus(clResult.getStatus());

            // Archive all files
            archiveService.archiveReports(cibFiles, clFiles, reportMonth);

            submission.setStatus("COMPLETED");
            submission.setCompletedAt(LocalDateTime.now());

            return ReportSubmissionResult.success(submission);

        } catch (Exception e) {
            log.error("Monthly report submission failed", e);
            submission.setStatus("FAILED");
            submission.setErrorMessage(e.getMessage());
            submissionRepository.save(submission);

            return ReportSubmissionResult.failure(e.getMessage());
        }
    }

    private List<File> generateCibBatch(LocalDate reportMonth) {
        List<File> files = new ArrayList<>();
        files.add(cibBatchGenerator.generateSubjectFile(reportMonth));
        files.add(cibBatchGenerator.generateContractFile(reportMonth));
        return files;
    }

    private List<File> generateClReports(LocalDate reportMonth) {
        LocalDate reportDate = reportMonth.withDayOfMonth(
            reportMonth.lengthOfMonth());

        List<File> files = new ArrayList<>();
        files.add(clReportGenerator.generateCl1Report(reportDate));
        files.add(clReportGenerator.generateCl2Report(reportDate));
        files.add(clReportGenerator.generateCl3Report(reportDate));
        files.add(clReportGenerator.generateCl4Report(reportDate));
        files.add(clReportGenerator.generateCl5Report(reportDate));
        return files;
    }
}
```

---

## 10. File Encryption & Signing

### 10.1 PGP Encryption Service

```java
// PgpEncryptionService.java
@Service
@Slf4j
public class PgpEncryptionService {

    @Value("${sftp.encryption.public-key}")
    private Resource publicKeyResource;

    @Value("${sftp.encryption.enabled}")
    private boolean encryptionEnabled;

    /**
     * Encrypt file using PGP
     */
    public File encryptFile(File inputFile) throws Exception {
        if (!encryptionEnabled) {
            return inputFile;
        }

        log.info("Encrypting file: {}", inputFile.getName());

        // Load public key
        PGPPublicKey publicKey = loadPublicKey();

        File encryptedFile = new File(inputFile.getParent(),
            inputFile.getName() + ".pgp");

        try (OutputStream encryptedOut = new BufferedOutputStream(
                new FileOutputStream(encryptedFile))) {

            // Create encrypted data generator
            PGPEncryptedDataGenerator encGen = new PGPEncryptedDataGenerator(
                new JcePGPDataEncryptorBuilder(PGPEncryptedData.AES_256)
                    .setWithIntegrityPacket(true)
                    .setSecureRandom(new SecureRandom())
                    .setProvider("BC"));

            encGen.addMethod(new JcePublicKeyKeyEncryptionMethodGenerator(publicKey)
                .setProvider("BC"));

            // Encrypt
            try (OutputStream cOut = encGen.open(encryptedOut,
                    new byte[1 << 16])) {

                PGPCompressedDataGenerator compressedGen =
                    new PGPCompressedDataGenerator(PGPCompressedData.ZIP);

                try (OutputStream compressedOut = compressedGen.open(cOut)) {
                    PGPUtil.writeFileToLiteralData(compressedOut,
                        PGPLiteralData.BINARY, inputFile);
                }
            }
        }

        log.info("File encrypted successfully: {}", encryptedFile.getName());
        return encryptedFile;
    }

    private PGPPublicKey loadPublicKey() throws Exception {
        try (InputStream keyIn = publicKeyResource.getInputStream()) {
            PGPPublicKeyRingCollection pgpPub = new PGPPublicKeyRingCollection(
                PGPUtil.getDecoderStream(keyIn),
                new JcaKeyFingerprintCalculator());

            Iterator<PGPPublicKeyRing> keyRings = pgpPub.getKeyRings();
            while (keyRings.hasNext()) {
                PGPPublicKeyRing keyRing = keyRings.next();
                Iterator<PGPPublicKey> keys = keyRing.getPublicKeys();
                while (keys.hasNext()) {
                    PGPPublicKey key = keys.next();
                    if (key.isEncryptionKey()) {
                        return key;
                    }
                }
            }
        }

        throw new IllegalArgumentException("Can't find encryption key");
    }
}
```

### 10.2 Checksum Generation

```java
// ChecksumService.java
@Service
@Slf4j
public class ChecksumService {

    /**
     * Generate SHA-256 checksum for file
     */
    public String generateChecksum(File file) throws IOException {
        MessageDigest digest;
        try {
            digest = MessageDigest.getInstance("SHA-256");
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }

        try (FileInputStream fis = new FileInputStream(file);
             DigestInputStream dis = new DigestInputStream(fis, digest)) {

            byte[] buffer = new byte[8192];
            while (dis.read(buffer) != -1) {
                // DigestInputStream updates digest automatically
            }
        }

        byte[] hashBytes = digest.digest();
        return bytesToHex(hashBytes);
    }

    /**
     * Create checksum file (.sha256)
     */
    public File createChecksumFile(File dataFile) throws IOException {
        String checksum = generateChecksum(dataFile);

        File checksumFile = new File(dataFile.getParent(),
            dataFile.getName() + ".sha256");

        try (FileWriter writer = new FileWriter(checksumFile)) {
            writer.write(checksum + "  " + dataFile.getName());
        }

        return checksumFile;
    }

    /**
     * Verify file against checksum
     */
    public boolean verifyChecksum(File dataFile, String expectedChecksum)
            throws IOException {
        String actualChecksum = generateChecksum(dataFile);
        return actualChecksum.equalsIgnoreCase(expectedChecksum);
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
```

---

## 11. Transfer Scheduling

### 11.1 Quartz Job Configuration

```java
// SftpSchedulerConfig.java
@Configuration
public class SftpSchedulerConfig {

    @Bean
    public JobDetail cibBatchUploadJob() {
        return JobBuilder.newJob(CibBatchUploadJob.class)
            .withIdentity("cibBatchUpload", "sftp")
            .withDescription("Monthly CIB batch file upload")
            .storeDurably()
            .build();
    }

    @Bean
    public Trigger cibBatchUploadTrigger(JobDetail cibBatchUploadJob) {
        return TriggerBuilder.newTrigger()
            .forJob(cibBatchUploadJob)
            .withIdentity("cibBatchUploadTrigger", "sftp")
            .withDescription("Trigger for CIB batch upload - 1st of month, 11 PM")
            .withSchedule(CronScheduleBuilder
                .cronSchedule("0 0 23 1 * ?")
                .withMisfireHandlingInstructionFireAndProceed())
            .build();
    }

    @Bean
    public JobDetail clReportsUploadJob() {
        return JobBuilder.newJob(ClReportsUploadJob.class)
            .withIdentity("clReportsUpload", "sftp")
            .withDescription("Monthly CL reports upload")
            .storeDurably()
            .build();
    }

    @Bean
    public Trigger clReportsUploadTrigger(JobDetail clReportsUploadJob) {
        return TriggerBuilder.newTrigger()
            .forJob(clReportsUploadJob)
            .withIdentity("clReportsUploadTrigger", "sftp")
            .withDescription("Trigger for CL reports upload - 10th of month, 10 PM")
            .withSchedule(CronScheduleBuilder
                .cronSchedule("0 0 22 10 * ?")
                .withMisfireHandlingInstructionFireAndProceed())
            .build();
    }

    @Bean
    public JobDetail baselReportsUploadJob() {
        return JobBuilder.newJob(BaselReportsUploadJob.class)
            .withIdentity("baselReportsUpload", "sftp")
            .withDescription("Quarterly Basel III reports upload")
            .storeDurably()
            .build();
    }

    @Bean
    public Trigger baselReportsUploadTrigger(JobDetail baselReportsUploadJob) {
        // Quarterly: 15 days after quarter end (Jan 15, Apr 15, Jul 15, Oct 15)
        return TriggerBuilder.newTrigger()
            .forJob(baselReportsUploadJob)
            .withIdentity("baselReportsUploadTrigger", "sftp")
            .withSchedule(CronScheduleBuilder
                .cronSchedule("0 0 22 15 1,4,7,10 ?")
                .withMisfireHandlingInstructionFireAndProceed())
            .build();
    }
}
```

### 11.2 Schedule Summary

| Job | Schedule | Description |
|-----|----------|-------------|
| **CIB Batch Upload** | 1st of month, 11 PM | Monthly CIB batch files |
| **CL Reports Upload** | 10th of month, 10 PM | Monthly CL-1 to CL-5 |
| **Basel Reports Upload** | 15th of Jan/Apr/Jul/Oct, 10 PM | Quarterly Basel III |
| **Ack Download** | Every hour | Check for acknowledgments |
| **Error Download** | Every hour | Check for error reports |

---

## 12. Error Handling & Retry

### 12.1 Error Classification

| Error Type | Code | Retry | Action |
|------------|------|-------|--------|
| **Connection Failed** | SFTP_CONN_001 | Yes (5x) | Exponential backoff |
| **Authentication Failed** | SFTP_AUTH_001 | No | Alert operations |
| **File Not Found** | SFTP_FILE_001 | No | Check generation |
| **Transfer Timeout** | SFTP_TIMEOUT | Yes (3x) | Retry after 5 min |
| **Permission Denied** | SFTP_PERM_001 | No | Check credentials |
| **Validation Failed** | VAL_FAIL_001 | No | Fix data, regenerate |
| **BB Rejected** | BB_REJ_001 | No | Review error report |

### 12.2 Retry Configuration

```yaml
# SFTP Retry Configuration
sftp:
  retry:
    max-attempts: 5
    initial-interval: 60000      # 1 minute
    multiplier: 2
    max-interval: 900000         # 15 minutes

  connection:
    timeout: 30000               # 30 seconds
    data-timeout: 300000         # 5 minutes
    keep-alive: 60000            # 1 minute
```

---

## 13. Audit Trail

### 13.1 Audit Logging

```java
// SftpAuditService.java
@Service
@Slf4j
public class SftpAuditService {

    private final SftpAuditLogRepository auditLogRepository;

    /**
     * Log SFTP transfer attempt
     */
    @Transactional
    public SftpAuditLog logTransferAttempt(
            String reportType,
            String fileName,
            String direction,
            String destination) {

        SftpAuditLog auditLog = SftpAuditLog.builder()
            .reportType(reportType)
            .fileName(fileName)
            .direction(direction)        // UPLOAD or DOWNLOAD
            .destination(destination)
            .status("INITIATED")
            .attemptedAt(LocalDateTime.now())
            .build();

        return auditLogRepository.save(auditLog);
    }

    /**
     * Update transfer result
     */
    @Transactional
    public void updateTransferResult(
            Long auditLogId,
            String status,
            Long fileSize,
            String checksum,
            String errorMessage) {

        SftpAuditLog auditLog = auditLogRepository.findById(auditLogId)
            .orElseThrow(() -> new AuditLogNotFoundException(auditLogId));

        auditLog.setStatus(status);
        auditLog.setFileSize(fileSize);
        auditLog.setChecksum(checksum);
        auditLog.setCompletedAt(LocalDateTime.now());

        if (errorMessage != null) {
            auditLog.setErrorMessage(errorMessage);
        }

        auditLogRepository.save(auditLog);
    }
}
```

### 13.2 Audit Log Table

```sql
-- SFTP Audit Log Table
CREATE TABLE sftp_audit_log (
    id BIGSERIAL PRIMARY KEY,

    -- Report Details
    report_type VARCHAR(30) NOT NULL,     -- CIB_BATCH, CL_REPORT, BASEL
    report_period VARCHAR(10),            -- YYYY-MM or YYYY-QN
    file_name VARCHAR(200) NOT NULL,
    file_size BIGINT,
    checksum VARCHAR(64),

    -- Transfer Details
    direction VARCHAR(10) NOT NULL,       -- UPLOAD, DOWNLOAD
    destination VARCHAR(100) NOT NULL,    -- SFTP path
    sftp_host VARCHAR(100),

    -- Status
    status VARCHAR(30) NOT NULL,          -- INITIATED, SUCCESS, FAILED
    retry_count INTEGER DEFAULT 0,

    -- Error Details
    error_code VARCHAR(20),
    error_message TEXT,

    -- Timestamps
    attempted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Audit
    initiated_by VARCHAR(100) NOT NULL,

    -- Constraints
    CONSTRAINT chk_direction CHECK (direction IN ('UPLOAD', 'DOWNLOAD')),
    CONSTRAINT chk_status CHECK (
        status IN ('INITIATED', 'IN_PROGRESS', 'SUCCESS', 'FAILED', 'RETRYING')
    )
);

CREATE INDEX idx_sftp_audit_report_type ON sftp_audit_log(report_type);
CREATE INDEX idx_sftp_audit_status ON sftp_audit_log(status);
CREATE INDEX idx_sftp_audit_date ON sftp_audit_log(attempted_at);
```

---

## 14. Monitoring & Alerting

### 14.1 Key Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `sftp.upload.total` | Counter | Total upload attempts |
| `sftp.upload.success` | Counter | Successful uploads |
| `sftp.upload.failed` | Counter | Failed uploads |
| `sftp.upload.duration` | Timer | Upload duration |
| `report.generation.duration` | Timer | Report generation time |
| `sftp.connection.active` | Gauge | Active connections |

### 14.2 Alert Rules

```yaml
groups:
  - name: sftp-alerts
    rules:
      - alert: SftpUploadFailed
        expr: increase(sftp_upload_failed_total[1h]) > 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "SFTP upload to Bangladesh Bank failed"

      - alert: ReportDeadlineMissed
        expr: |
          (day_of_month() == 1 AND hour() > 23 AND
           absent(sftp_upload_success_total{report="CIB_BATCH"}))
        for: 1h
        labels:
          severity: critical
        annotations:
          summary: "CIB batch file not uploaded by deadline"

      - alert: ClReportDeadlineMissed
        expr: |
          (day_of_month() == 10 AND hour() > 22 AND
           absent(sftp_upload_success_total{report="CL_REPORTS"}))
        for: 1h
        labels:
          severity: critical
        annotations:
          summary: "CL reports not uploaded by deadline"
```

---

## 15. Data Model

### 15.1 Report Submission Table

```sql
-- Report Submission Table
CREATE TABLE report_submission (
    id BIGSERIAL PRIMARY KEY,

    -- Report Details
    report_month DATE NOT NULL,
    submission_type VARCHAR(20) NOT NULL,  -- MONTHLY, QUARTERLY
    report_types VARCHAR(100),             -- CIB,CL1,CL2,CL3,CL4,CL5

    -- Generation Status
    cib_files_generated BOOLEAN DEFAULT FALSE,
    cl_reports_generated BOOLEAN DEFAULT FALSE,
    basel_reports_generated BOOLEAN DEFAULT FALSE,

    -- Upload Status
    cib_upload_status VARCHAR(20),
    cl_upload_status VARCHAR(20),
    basel_upload_status VARCHAR(20),

    -- Acknowledgment
    ack_received BOOLEAN DEFAULT FALSE,
    ack_received_at TIMESTAMP WITH TIME ZONE,
    ack_reference VARCHAR(100),

    -- Status
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,

    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,

    CONSTRAINT chk_submission_status CHECK (
        status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'PARTIAL')
    )
);

CREATE INDEX idx_report_submission_month ON report_submission(report_month);
CREATE INDEX idx_report_submission_status ON report_submission(status);
```

---

## 16. Implementation Guide

### 16.1 Prerequisites

| Component | Requirement | Notes |
|-----------|-------------|-------|
| **Java** | 21 (LTS) | GraalVM recommended |
| **Spring Boot** | 3.2.1 | Parent POM |
| **Apache Camel** | 4.3 | SFTP component |
| **Quartz** | 2.3.2 | Job scheduling |
| **Apache POI** | 5.2.x | Excel generation |
| **Bouncy Castle** | Latest | PGP encryption |
| **BB SFTP Access** | SSH keys | Request from BB |
| **VPN** | IPSec tunnel | To BB network |

### 16.2 Configuration Steps

1. **Obtain BB SFTP Credentials**
   - Request merchant code from Bangladesh Bank
   - Generate SSH key pair
   - Submit public key to BB
   - Receive SFTP access details

2. **Configure VPN**
   - Set up IPSec tunnel to BB network
   - Configure StrongSwan/OpenSwan
   - Test connectivity

3. **Configure SFTP**
   - Store private key in Vault
   - Configure known_hosts
   - Test connection

4. **Schedule Jobs**
   - Configure Quartz scheduler
   - Set up job triggers
   - Test job execution

---

## 17. Appendices

### Appendix A: File Naming Conventions

| Report Type | File Name Format | Example |
|-------------|------------------|---------|
| **CIB Subject** | `BANKCODE_SUBJECT_YYYYMM.dat` | `ABC_SUBJECT_202602.dat` |
| **CIB Contract** | `BANKCODE_CONTRACT_YYYYMM.dat` | `ABC_CONTRACT_202602.dat` |
| **CL-1** | `CL1_BANKCODE_YYYYMM.xlsx` | `CL1_ABC_202602.xlsx` |
| **CL-2** | `CL2_BANKCODE_YYYYMM.xlsx` | `CL2_ABC_202602.xlsx` |
| **Basel RWA** | `BASEL_RWA_BANKCODE_YYYYQN.xml` | `BASEL_RWA_ABC_2026Q1.xml` |

### Appendix B: BB Facility Type Codes

| Code | Description |
|------|-------------|
| 01 | Term Loan |
| 02 | Working Capital |
| 03 | Cash Credit |
| 04 | Overdraft |
| 05 | Demand Loan |
| 06 | Trade Finance |
| 07 | Housing Loan |
| 08 | Consumer Loan |
| 09 | SME Loan |
| 10 | Agricultural Loan |

### Appendix C: Kafka Topics

| Topic | Purpose | Retention |
|-------|---------|-----------|
| `ulms.sftp.cib.uploaded` | CIB upload confirmation | 30 days |
| `ulms.sftp.cl.uploaded` | CL reports upload | 30 days |
| `ulms.sftp.ack.received` | BB acknowledgments | 90 days |
| `ulms.sftp.error.received` | BB error reports | 90 days |
| `dlq.sftp.cib.failed` | Dead letter queue | 90 days |

### Appendix D: References

1. Bangladesh Bank CIB Online User Manual
2. BRPD Circular 15/2024
3. Basel III Implementation Guidelines for Bangladesh
4. Bangladesh Bank SFTP Integration Guide
5. ULMS BRD v1.0 - Section 9 Regulatory Compliance
6. ULMS BRD v1.0 - Section 11 Reporting Requirements
7. Apache Camel 4.3 SFTP Component Documentation

---

**Document End**

*ULMS v2.0 - Bangladesh Bank SFTP Integration v1.0*

*Unisoft Systems Limited - Confidential*

*This document provides the comprehensive Bangladesh Bank SFTP integration design for regulatory report submission in ULMS v2.0.*

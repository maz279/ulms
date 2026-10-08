---
type: how-to
topic: regulatory_return_xml_csv_generation
target_audience: [backend_developer, compliance_developer, reporting_analyst]
version: 2026.10
document_id: DOC-05-EXT-07
---

# DOC-05-EXT-07: Bangladesh Bank Regulatory Return XML/CSV Generation Extension Guide

**Document Control**

| Field | Value |
|---|---|
| **Document Title** | Regulatory Return XML/CSV Generation Extension Guide |
| **Project Name** | Unisoft Loan Management System (ULMS v2.0) |
| **Document Version** | 3.0.0 |
| **Date** | 2026-10-07 |
| **Classification** | Statutory Developer Guide |
| **Status** | Approved Master Specification |
| **Authority Chain** | Bangladesh Bank Regcon Guidelines → BRPD Circular 15/2024 |

---

## 1. Regulatory Reporting Architecture

Bangladesh Bank mandates quarterly and monthly returns in strict XML and CSV formats (SBS-1, SBS-2, SBS-3, CIB Monthly, and BRPD CL-1 to CL-5). 

ULMS provides the `RegulatoryReportBuilder` interface:
```java
package com.uslbd.ulms.compliance.reports;

public interface RegulatoryReportBuilder {
    ReportMetadata getMetadata();
    byte[] generateReport(LocalDate reportingPeriod, ReportFormat format);
    ValidationResult validateAgainstXsd(byte[] payload);
}
```

---

## 2. Adding a New Return (e.g. SBS-3 SME Portfolio Return)

1. Implement `Sbs3ReportBuilder.java` in `com.uslbd.ulms.compliance.reports`.
2. Extract aggregated loan exposure by industrial sector from `ulms.loan`.
3. Format output adhering to BB Regcon XML Schema Definition (XSD).
4. Register report definition in `ulms.loan_product`.

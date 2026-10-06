# CIB Report Viewer Component
## ULMS v2.0 Credit Information Bureau Report

---

**Document Control**

| Field | Value |
|-------|-------|
| **Document Title** | CIB Report Viewer Component |
| **Project Name** | Unisoft Loan Management System (ULMS) |
| **Document Version** | 1.0 |
| **Date** | 2026-02-08 |
| **Prepared By** | Frontend Developer |
| **Reviewed By** | Technical Lead |
| **Classification** | Internal |
| **Status** | Draft |

---

## 1. Component Overview

Displays Credit Information Bureau (CIB) reports from Bangladesh Bank.

## 2. Report Sections

```typescript
interface CIBReport {
  inquiryId: string;
  reportDate: string;
  subject: {
    name: string;
    nidNumber: string;
    cibScore: number;
    riskGrade: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B';
  };
  facilities: CIBFacility[];
  summary: {
    totalFacilities: number;
    totalOutstanding: number;
    totalMonthlyEMI: number;
    worstClassification: string;
    maxDPD: number;
  };
}
```

## 3. Viewer Layout

```typescript
export function CIBReportViewer({ report }: { report: CIBReport }): React.ReactElement {
  return (
    <Card>
      <ReportHeader report={report} />
      <SubjectInfo subject={report.subject} />
      <CIBScoreCard score={report.subject.cibScore} />
      <FacilityTable facilities={report.facilities} />
      <SummarySection summary={report.summary} />
    </Card>
  );
}
```

---

**Document End**

*© 2026 Unisoft Systems Limited. All Rights Reserved.*
